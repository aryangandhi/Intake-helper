import { z } from "zod";
import { SUMMARY_HEADINGS } from "@/config/intakeQuestions";

export const SentenceSchema = z.object({
  text: z.string().min(1),
  citations: z.array(z.string()),
});

export const ModelSummarySchema = z.object({
  paragraph: z.array(SentenceSchema).min(1),
  sections: z.array(
    z.object({
      heading: z.string(),
      bullets: z.array(SentenceSchema),
    }),
  ),
  flagged: z.array(z.object({ field_id: z.string(), note: z.string() })),
});

export type ModelSummary = z.infer<typeof ModelSummarySchema>;

export interface CheckedSentence {
  text: string;
  citations: string[]; // valid citations only
  unsupported: boolean;
  reasons: string[];
}

export interface CheckedSummary {
  paragraph: CheckedSentence[];
  sections: { heading: string; bullets: CheckedSentence[] }[];
  flagged: { field_id: string; note: string }[];
}

export interface ValidationReport {
  totalStatements: number;
  supported: number;
  unsupported: number;
  invalidCitations: string[];
  issues: { text: string; reasons: string[] }[];
}

/** JSON schema sent to the model via response_format (strict mode). */
export const RESPONSE_JSON_SCHEMA = {
  name: "intake_summary",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["paragraph", "sections", "flagged"],
    properties: {
      paragraph: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["text", "citations"],
          properties: { text: { type: "string" }, citations: { type: "array", items: { type: "string" } } },
        },
      },
      sections: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["heading", "bullets"],
          properties: {
            heading: { type: "string", enum: SUMMARY_HEADINGS },
            bullets: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["text", "citations"],
                properties: { text: { type: "string" }, citations: { type: "array", items: { type: "string" } } },
              },
            },
          },
        },
      },
      flagged: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["field_id", "note"],
          properties: { field_id: { type: "string" }, note: { type: "string" } },
        },
      },
    },
  },
} as const;
