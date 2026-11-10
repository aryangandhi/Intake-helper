import { ALL_QUESTIONS, SUMMARY_HEADINGS, getQuestion } from "@/config/intakeQuestions";
import type { RawItem } from "@/lib/answers";
import type { ModelSummary } from "./schema";

// Short labels used in template bullets.
const SHORT: Record<string, string> = {
  ay_pregnancy: "Pregnancy / breastfeeding",
  ay_sensory_has: "Sensory needs",
  ay_sensory_list: "Sensory needs",
  ay_sensory_details: "Sensory needs (details)",
  ay_caregiver: "Primary caregiver for someone else",
  ay_caregiver_arrangements: "Care arrangements made",
  ay_trial: "In a clinical trial",
  ay_trial_name: "Clinical trial",
  mc_reason: "Reason for visit (patient's words)",
  mc_pain: "Current pain",
  mc_pain_location: "Pain location",
  mc_pain_score: "Pain score",
  mc_symptoms: "Symptoms in past month",
  al_has: "Has allergies",
  al_list: "Allergies",
  med_list: "Medications",
  mh_has: "Has health conditions",
  mh_list: "Health conditions",
  mh_details: "Health conditions (details)",
  sx_list: "Surgeries / procedures",
  fh_list: "Family history",
  ls_tobacco: "Tobacco",
  ls_tobacco_details: "Tobacco details",
  ls_alcohol: "Alcohol",
  ls_living: "Living situation",
  ls_work: "Work / school",
  acp_has: "Advance care plan",
  mood_down: "Felt down or depressed in past month",
  mood_interest: "Little interest or enjoyment in past month",
  cp_name: "Emergency contact / care partner",
};

/** Deterministic summary built straight from the answers (used when AI is unavailable). */
export function buildTemplateSummary(items: RawItem[], incomplete: string[]): ModelSummary {
  const a = new Map(items.filter((i) => i.answer).map((i) => [i.field_id, i.answer]));
  const paragraph: ModelSummary["paragraph"] = [];

  const sex = a.get("ay_sex");
  const noun = sex === "Female" ? "woman" : sex === "Male" ? "man" : "patient";
  const age = (a.get("pt_age") || "").replace(" years", "");
  paragraph.push({
    text: `${a.get("pt_name")} is a ${age}-year-old ${noun} referred to ${a.get("pt_provider_group")}.`,
    citations: ["pt_name", "pt_age", "pt_provider_group", ...(sex === "Female" || sex === "Male" ? ["ay_sex"] : [])],
  });
  if (a.get("mc_reason")) paragraph.push({ text: `In the patient's words: "${a.get("mc_reason")}"`, citations: ["mc_reason"] });
  if (a.get("mh_list") || a.get("mh_details")) {
    const parts = [a.get("mh_list"), a.get("mh_details")].filter(Boolean).join(". ");
    paragraph.push({ text: `Reported health conditions: ${parts}`, citations: [...(a.get("mh_list") ? ["mh_list"] : []), ...(a.get("mh_details") ? ["mh_details"] : [])] });
  } else if (a.get("mh_has") === "No") paragraph.push({ text: "No health conditions reported.", citations: ["mh_has"] });
  if (a.get("mc_pain") === "Yes") {
    const loc = a.get("mc_pain_location");
    const score = a.get("mc_pain_score");
    paragraph.push({
      text: `Reports current pain${loc ? ` (${loc})` : ""}${score ? `, rated ${score}` : ""}.`,
      citations: ["mc_pain", ...(loc ? ["mc_pain_location"] : []), ...(score ? ["mc_pain_score"] : [])],
    });
  }
  if (a.get("med_list")) paragraph.push({ text: `Medications reported: ${a.get("med_list")}.`, citations: ["med_list"] });
  if (a.get("al_list")) paragraph.push({ text: `Allergies reported: ${a.get("al_list")}.`, citations: ["al_list"] });
  else if (a.get("al_has") === "No") paragraph.push({ text: "No known allergies reported.", citations: ["al_has"] });

  const byHeading = new Map<string, ModelSummary["sections"][number]["bullets"]>();
  for (const q of ALL_QUESTIONS) {
    const ans = a.get(q.id);
    if (!ans || !q.summaryHeading) continue;
    if (q.id === "al_has" && a.get("al_list")) continue;
    if (q.id === "mh_has" && (a.get("mh_list") || a.get("mh_details"))) continue;
    if (q.id === "ay_sensory_has" && (a.get("ay_sensory_list") || a.get("ay_sensory_details"))) continue;
    const list = byHeading.get(q.summaryHeading) || [];
    list.push({ text: `${SHORT[q.id] || q.label}: ${ans}`, citations: [q.id] });
    byHeading.set(q.summaryHeading, list);
  }
  const sections = SUMMARY_HEADINGS.filter((h) => byHeading.has(h)).map((h) => ({ heading: h, bullets: byHeading.get(h)! }));
  const flagged = incomplete.map((id) => ({ field_id: id, note: `Not answered: ${getQuestion(id)?.label || id}` }));
  return { paragraph, sections, flagged };
}
