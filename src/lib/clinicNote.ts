import { prisma } from "./db";
import { buildRawData, flatRaw, parseAnswers } from "./answers";
import type { CheckedSummary } from "./ai/schema";

type NoteParts = { medicalHistory: string; currentMedications: string; allergies: string; socialHistory: string; familyHistory: string };

const bullets = (summary: CheckedSummary, heading: string) =>
  (summary.sections.find((s) => s.heading === heading)?.bullets || []).map((b) => `- ${b.text}`);

/** Text pasted into the clinic note. Citation markers are left out. */
export function noteFromSummary(summary: CheckedSummary): NoteParts {
  const hpi = summary.paragraph.map((s) => s.text).join(" ");
  const mh = [...bullets(summary, "Medical history"), ...bullets(summary, "Procedures / surgeries")];
  return {
    medicalHistory: [hpi, mh.length ? `\nPast medical / surgical history:\n${mh.join("\n")}` : ""].join("").trim(),
    currentMedications: bullets(summary, "Current medications").join("\n"),
    allergies: bullets(summary, "Allergies").join("\n"),
    socialHistory: bullets(summary, "Social history").join("\n"),
    familyHistory: bullets(summary, "Family history").join("\n"),
  };
}

/** For co-op intakes (no AI): copy the raw answers. */
export function noteFromRaw(get: (id: string) => string): NoteParts {
  const list = (s: string) => (s ? s.split("; ").map((x) => `- ${x}`).join("\n") : "");
  const lines = (pairs: [string, string][]) => pairs.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join("\n");
  return {
    medicalHistory: lines([["Reason for visit", get("mc_reason")], ["Health conditions", get("mh_conditions")], ["Surgeries / procedures", get("sx_list")]]),
    currentMedications: list(get("med_list")),
    allergies: get("al_list") ? list(get("al_list")) : get("al_has") === "No" ? "No known allergies" : "",
    socialHistory: lines([["Tobacco", [get("ls_tobacco"), get("ls_tobacco_details")].filter(Boolean).join(", ")], ["Alcohol", get("ls_alcohol")], ["Living situation", get("ls_living")], ["Work / school", get("ls_work")]]),
    familyHistory: list(get("fh_list")),
  };
}

export async function buildNoteFromDocument(docId: string): Promise<NoteParts> {
  const doc = await prisma.eMRDocument.findUniqueOrThrow({ where: { id: docId }, include: { referral: true, submission: { include: { summary: true } } } });
  const summary = doc.submission.summary;
  if (doc.hasAISummary && summary?.status === "ready") return noteFromSummary(JSON.parse(summary.content));
  const raw = flatRaw(buildRawData(parseAnswers(doc.submission.answers), doc.referral, doc.submission.completedBy === "patient" ? "patient" : "staff"));
  const map = new Map(raw.map((r) => [r.field_id, r.answer]));
  return noteFromRaw((id) => map.get(id) || "");
}
