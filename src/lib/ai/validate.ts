import type { CheckedSentence, CheckedSummary, ModelSummary, ValidationReport } from "./schema";

export interface AnswerRef {
  field_id: string;
  answer: string;
}

const NUM_RE = /\d+(?:[.,:/-]\d+)*/g;

function hasWholeNumber(haystack: string, token: string): boolean {
  const esc = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<![\\d.])${esc}(?![\\d]|\\.\\d)`).test(haystack);
}

/** Every number or date in `text` must appear in at least one of the cited answers. */
export function findUnsupportedNumbers(text: string, citedAnswers: string[]): string[] {
  const haystack = citedAnswers.join(" \n ").replace(/(\d),(\d{3})/g, "$1$2");
  const tokens = (text.replace(/(\d),(\d{3})/g, "$1$2").match(NUM_RE) || []).map((t) => t.replace(/[.,:/-]+$/, ""));
  const missing: string[] = [];
  for (const tok of tokens) {
    if (hasWholeNumber(haystack, tok)) continue;
    // Allow "8/10" when the answer says "8 out of 10", or a date written with different separators.
    const parts = tok.split(/[/:-]/).filter(Boolean);
    if (parts.length > 1 && parts.every((p) => hasWholeNumber(haystack, p))) continue;
    missing.push(tok);
  }
  return missing;
}

export function checkSentence(s: { text: string; citations: string[] }, answers: Map<string, string>): CheckedSentence {
  const reasons: string[] = [];
  const valid = Array.from(new Set(s.citations)).filter((c) => (answers.get(c) || "").trim() !== "");
  const invalid = s.citations.filter((c) => !valid.includes(c));
  if (invalid.length) reasons.push(`Invalid or empty citation: ${invalid.join(", ")}`);
  if (valid.length === 0) {
    reasons.push("No valid citation");
  } else {
    const missing = findUnsupportedNumbers(s.text, valid.map((c) => answers.get(c) || ""));
    if (missing.length) reasons.push(`Number or date not found in cited answers: ${missing.join(", ")}`);
  }
  const unsupported = valid.length === 0 || reasons.some((r) => r.startsWith("Number"));
  return { text: s.text.trim(), citations: valid, unsupported, reasons };
}

/** Validate a model (or template) summary against the submission's answers. */
export function validateSummary(
  summary: ModelSummary,
  refs: AnswerRef[],
  knownFieldIds: string[],
): { checked: CheckedSummary; report: ValidationReport } {
  const answers = new Map(refs.map((r) => [r.field_id, r.answer]));
  const invalidCitations = new Set<string>();
  const issues: { text: string; reasons: string[] }[] = [];

  const run = (s: { text: string; citations: string[] }) => {
    const c = checkSentence(s, answers);
    s.citations.filter((x) => !c.citations.includes(x)).forEach((x) => invalidCitations.add(x));
    if (c.reasons.length) issues.push({ text: c.text, reasons: c.reasons });
    return c;
  };

  const paragraph = summary.paragraph.map(run);
  const sections = summary.sections
    .map((sec) => ({ heading: sec.heading, bullets: sec.bullets.map(run) }))
    .filter((sec) => sec.bullets.length > 0);
  const flagged = summary.flagged.filter((f) => knownFieldIds.includes(f.field_id) || f.field_id === "");

  const all = [...paragraph, ...sections.flatMap((s) => s.bullets)];
  const unsupported = all.filter((s) => s.unsupported).length;
  return {
    checked: { paragraph, sections, flagged },
    report: {
      totalStatements: all.length,
      supported: all.length - unsupported,
      unsupported,
      invalidCitations: Array.from(invalidCitations),
      issues,
    },
  };
}
