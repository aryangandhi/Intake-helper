import OpenAI from "openai";
import { getQuestion, SUMMARY_HEADINGS } from "@/config/intakeQuestions";
import type { RawItem } from "@/lib/answers";
import { buildTemplateSummary } from "./fallback";
import { ModelSummarySchema, RESPONSE_JSON_SCHEMA, type CheckedSummary, type ModelSummary, type ValidationReport } from "./schema";
import { validateSummary } from "./validate";

export const DEFAULT_MODEL = "openai/gpt-4.1-mini";

const SYSTEM_PROMPT = `You summarize a new patient's oncology intake form for their oncologist.
The data is fictional (class prototype).

Rules:
- Use ONLY information in the provided answers. Never infer diagnoses, dates, doses or history that are not stated.
- Every sentence and bullet must cite at least one field_id (from the input) that supports it, in "citations".
- Copy medication names, doses, dates and numbers exactly as written.
- Use neutral, factual clinical language. Never use judgmental or loaded wording about the patient (for example "non-compliant", "difficult", "poor historian").
- If something is unclear, contradictory or missing, add it to "flagged" (with its field_id) instead of guessing. Every incomplete field must appear in "flagged".
- "paragraph": 3 to 6 sentences written as a History of Present Illness (HPI): open with age, sex (if given) and reason for referral, then relevant history, symptoms, medications and social context.
- "sections": the SAME facts in point form, grouped under these headings (omit headings with no information): ${SUMMARY_HEADINGS.join("; ")}.
- Reply with JSON only: {"paragraph":[{"text","citations"}],"sections":[{"heading","bullets":[{"text","citations"}]}],"flagged":[{"field_id","note"}]}`;

export interface SummaryResult {
  content: CheckedSummary;
  validation: ValidationReport;
  modelUsed: string;
  isFallback: boolean;
}

function buildUserMessage(items: RawItem[], incomplete: string[]) {
  return JSON.stringify(
    {
      answers: items.filter((i) => i.answer).map((i) => ({ field_id: i.field_id, section: i.section, question: i.question, answer: i.answer })),
      incomplete_fields: incomplete.map((id) => ({ field_id: id, question: getQuestion(id)?.label || id })),
    },
    null,
    1,
  );
}

async function callModel(client: OpenAI, model: string, items: RawItem[], incomplete: string[], mode: "json_schema" | "json_object"): Promise<ModelSummary | null> {
  const res = await client.chat.completions.create(
    {
      model,
      temperature: 0.1,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserMessage(items, incomplete) },
      ],
      response_format: mode === "json_schema" ? { type: "json_schema", json_schema: RESPONSE_JSON_SCHEMA as never } : { type: "json_object" },
    },
    { timeout: 20_000, maxRetries: 0 },
  );
  const text = res.choices[0]?.message?.content || "";
  const jsonText = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  try {
    const parsed = ModelSummarySchema.safeParse(JSON.parse(jsonText));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** Generate the summary with the AI model, falling back to the template on any failure. */
export async function generateSummary(items: RawItem[], incomplete: string[]): Promise<SummaryResult> {
  const knownIds = items.map((i) => i.field_id).concat(incomplete);
  const refs = items.map((i) => ({ field_id: i.field_id, answer: i.answer }));
  const key = process.env.OPENROUTER_API_KEY?.trim();
  const model = process.env.AI_MODEL?.trim() || DEFAULT_MODEL;

  if (key) {
    const client = new OpenAI({
      apiKey: key,
      baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
      defaultHeaders: { "X-Title": "Intake Prototype (class project)" },
    });
    // Attempt 1 uses a strict JSON schema; attempt 2 (retry) asks for plain JSON in case the model lacks schema support.
    for (const mode of ["json_schema", "json_object"] as const) {
      try {
        const out = await callModel(client, model, items, incomplete, mode);
        if (out) {
          // Make sure every incomplete field is flagged even if the model forgot.
          for (const id of incomplete) {
            if (!out.flagged.some((f) => f.field_id === id)) out.flagged.push({ field_id: id, note: `Not answered: ${getQuestion(id)?.label || id}` });
          }
          const { checked, report } = validateSummary(out, refs, knownIds);
          return { content: checked, validation: report, modelUsed: model, isFallback: false };
        }
        console.warn(`[summary] ${mode} response failed validation`);
      } catch (err) {
        const status = (err as { status?: number }).status;
        console.warn(`[summary] AI call failed (${mode}):`, (err as Error).message);
        // Only retry with plain JSON if the provider rejected the request format; otherwise go to fallback.
        if (status !== 400 && status !== 422) break;
      }
    }
  }

  const tpl = buildTemplateSummary(items, incomplete);
  const { checked, report } = validateSummary(tpl, refs, knownIds);
  return { content: checked, validation: report, modelUsed: "Template summary (AI unavailable)", isFallback: true };
}
