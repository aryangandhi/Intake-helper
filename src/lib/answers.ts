import { INTAKE_SECTIONS, type Question, sectionsFor } from "@/config/intakeQuestions";

export type RepeatValue = { none?: boolean; items: Record<string, string>[] };
export type AnswerValue = string | string[] | RepeatValue | undefined;
export type Answers = Record<string, AnswerValue>;

export interface ReferralLike {
  firstName: string;
  lastName: string;
  dob: string;
  sex?: string;
  providerGroup: string;
  appointmentAt: Date | string;
}

export interface RawItem {
  field_id: string;
  section: string;
  question: string;
  answer: string; // formatted, "" if not answered
  incomplete: boolean;
}

export interface RawSection {
  id: string;
  title: string;
  items: RawItem[];
}

export function ageFromDob(dob: string, now = new Date()): number {
  const d = new Date(dob + "T00:00:00");
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

export function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-CA", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

export function formatDateTime(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return `${formatDate(date)} at ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
}

export function formatShort(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function isVisible(q: Question, answers: Answers): boolean {
  if (!q.showIf) return true;
  const v = answers[q.showIf.id];
  const want = Array.isArray(q.showIf.equals) ? q.showIf.equals : [q.showIf.equals];
  return typeof v === "string" && want.includes(v);
}

export function isAnswered(q: Question, value: AnswerValue): boolean {
  if (value === undefined || value === null) return false;
  if (q.type === "repeat") {
    const r = value as RepeatValue;
    if (r.none) return true;
    return (r.items || []).some((it) => Object.values(it).some((x) => (x || "").trim() !== ""));
  }
  if (Array.isArray(value)) return value.length > 0;
  return String(value).trim() !== "";
}

export function formatAnswer(q: Question, value: AnswerValue): string {
  if (!isAnswered(q, value)) return "";
  if (q.type === "repeat") {
    const r = value as RepeatValue;
    if (r.none) return q.noneLabel || "None";
    const fields = q.repeatFields || [];
    return (r.items || [])
      .filter((it) => Object.values(it).some((x) => (x || "").trim() !== ""))
      .map((it) =>
        fields
          .map((f) => (it[f.id] || "").trim())
          .filter(Boolean)
          .join(", "),
      )
      .join("; ");
  }
  if (Array.isArray(value)) return value.join(", ");
  if (q.type === "scale") return `${value} out of 10`;
  return String(value).trim();
}

/** Visible, required questions that have no answer. */
export function computeIncomplete(answers: Answers, audience: "patient" | "staff"): string[] {
  const out: string[] = [];
  for (const s of sectionsFor(audience)) {
    for (const q of s.questions) {
      if (q.optional || !isVisible(q, answers)) continue;
      if (!isAnswered(q, answers[q.id])) out.push(q.id);
    }
  }
  return out;
}

export function referralSection(r: ReferralLike): RawSection {
  const appt = typeof r.appointmentAt === "string" ? new Date(r.appointmentAt) : r.appointmentAt;
  const items: RawItem[] = [
    { field_id: "pt_name", section: "Patient details (from referral)", question: "Patient name", answer: `${r.firstName} ${r.lastName}`, incomplete: false },
    { field_id: "pt_dob", section: "Patient details (from referral)", question: "Date of birth", answer: r.dob, incomplete: false },
    { field_id: "pt_age", section: "Patient details (from referral)", question: "Age", answer: `${ageFromDob(r.dob)} years`, incomplete: false },
    { field_id: "pt_provider_group", section: "Patient details (from referral)", question: "Provider group", answer: r.providerGroup, incomplete: false },
    { field_id: "pt_appointment", section: "Patient details (from referral)", question: "First appointment", answer: formatDateTime(appt), incomplete: false },
  ];
  return { id: "referral", title: "Patient details (from referral)", items };
}

/** All raw data shown in the EMR, grouped by section, in form order. */
export function buildRawData(answers: Answers, referral: ReferralLike, audience: "patient" | "staff"): RawSection[] {
  const sections: RawSection[] = [referralSection(referral)];
  for (const s of INTAKE_SECTIONS) {
    if (s.staffOnly && audience === "patient") continue;
    const items: RawItem[] = [];
    for (const q of s.questions) {
      if (!isVisible(q, answers)) continue;
      const answer = formatAnswer(q, answers[q.id]);
      if (s.staffOnly && !answer) continue; // hide empty vitals
      items.push({ field_id: q.id, section: s.title, question: q.label, answer, incomplete: !answer && !q.optional });
    }
    if (items.length) sections.push({ id: s.id, title: s.title, items });
  }
  return sections;
}

export function flatRaw(sections: RawSection[]): RawItem[] {
  return sections.flatMap((s) => s.items);
}

export function parseAnswers(json: string | null | undefined): Answers {
  try {
    return JSON.parse(json || "{}");
  } catch {
    return {};
  }
}
