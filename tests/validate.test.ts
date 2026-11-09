import { describe, expect, it } from "vitest";
import { checkSentence, findUnsupportedNumbers, validateSummary } from "@/lib/ai/validate";
import { buildTemplateSummary } from "@/lib/ai/fallback";

const answers = new Map([
  ["med_list", "Metformin, 500 mg, twice a day; Ramipril, 10 mg, once a day"],
  ["mc_reason", "A biopsy in September 2026 showed breast cancer."],
  ["mc_pain_score", "7 out of 10"],
  ["pt_age", "59 years"],
  ["ay_sex", "Female"],
  ["ls_work", ""],
]);

describe("findUnsupportedNumbers", () => {
  it("accepts numbers that appear in the cited answers", () => {
    expect(findUnsupportedNumbers("Metformin 500 mg twice daily", [answers.get("med_list")!])).toEqual([]);
  });
  it("rejects numbers that do not appear", () => {
    expect(findUnsupportedNumbers("Metformin 850 mg twice daily", [answers.get("med_list")!])).toEqual(["850"]);
  });
  it("does not match a number inside a longer number", () => {
    expect(findUnsupportedNumbers("Ramipril 1 mg", [answers.get("med_list")!])).toEqual(["1"]);
    expect(findUnsupportedNumbers("Took 50 mg", ["500 mg"])).toEqual(["50"]);
  });
  it("accepts 7/10 when the answer says 7 out of 10", () => {
    expect(findUnsupportedNumbers("Pain rated 7/10", [answers.get("mc_pain_score")!])).toEqual([]);
  });
  it("ignores trailing punctuation", () => {
    expect(findUnsupportedNumbers("Biopsy in 2026.", [answers.get("mc_reason")!])).toEqual([]);
  });
});

describe("checkSentence", () => {
  it("marks a sentence with valid citations and matching numbers as supported", () => {
    const r = checkSentence({ text: "Ms. Doe is a 59-year-old woman.", citations: ["pt_age", "ay_sex"] }, answers);
    expect(r.unsupported).toBe(false);
    expect(r.citations).toEqual(["pt_age", "ay_sex"]);
  });
  it("marks a sentence with no citations as unsupported", () => {
    const r = checkSentence({ text: "She is very anxious.", citations: [] }, answers);
    expect(r.unsupported).toBe(true);
    expect(r.reasons).toContain("No valid citation");
  });
  it("drops citations to unknown or empty fields, and fails if none remain", () => {
    const r = checkSentence({ text: "Works as a teacher.", citations: ["ls_work", "does_not_exist"] }, answers);
    expect(r.citations).toEqual([]);
    expect(r.unsupported).toBe(true);
  });
  it("keeps valid citations when some are invalid", () => {
    const r = checkSentence({ text: "Takes metformin.", citations: ["med_list", "bogus"] }, answers);
    expect(r.unsupported).toBe(false);
    expect(r.citations).toEqual(["med_list"]);
    expect(r.reasons[0]).toMatch(/Invalid/);
  });
  it("marks a sentence with a hallucinated number as unsupported", () => {
    const r = checkSentence({ text: "A 2 cm mass was seen in September 2026.", citations: ["mc_reason"] }, answers);
    expect(r.unsupported).toBe(true);
    expect(r.reasons.join()).toMatch(/2\b/);
  });
  it("checks numbers only against the sentence's own citations", () => {
    const r = checkSentence({ text: "Metformin 500 mg.", citations: ["mc_reason"] }, answers);
    expect(r.unsupported).toBe(true);
  });
});

describe("validateSummary", () => {
  it("reports totals and keeps unsupported statements (not removed)", () => {
    const refs = [...answers].map(([field_id, answer]) => ({ field_id, answer }));
    const { checked, report } = validateSummary(
      {
        paragraph: [
          { text: "Ms. Doe is a 59-year-old woman.", citations: ["pt_age", "ay_sex"] },
          { text: "She smokes 20 cigarettes a day.", citations: [] },
        ],
        sections: [{ heading: "Current medications", bullets: [{ text: "Metformin 500 mg twice a day", citations: ["med_list"] }] }],
        flagged: [{ field_id: "ls_work", note: "Not answered" }, { field_id: "made_up", note: "x" }],
      },
      refs,
      [...answers.keys()],
    );
    expect(report.totalStatements).toBe(3);
    expect(report.unsupported).toBe(1);
    expect(checked.paragraph).toHaveLength(2);
    expect(checked.paragraph[1].unsupported).toBe(true);
    expect(checked.flagged).toEqual([{ field_id: "ls_work", note: "Not answered" }]);
  });

  it("the template fallback always passes its own validation", () => {
    const items = [
      { field_id: "pt_name", section: "", question: "Patient name", answer: "Jane Doe", incomplete: false },
      { field_id: "pt_age", section: "", question: "Age", answer: "59 years", incomplete: false },
      { field_id: "pt_provider_group", section: "", question: "Provider group", answer: "Medical Oncology", incomplete: false },
      { field_id: "ay_sex", section: "", question: "Sex", answer: "Female", incomplete: false },
      { field_id: "mc_reason", section: "", question: "Reason", answer: "Lump found in 2026", incomplete: false },
      { field_id: "mc_pain", section: "", question: "Pain", answer: "Yes", incomplete: false },
      { field_id: "mc_pain_score", section: "", question: "Score", answer: "4 out of 10", incomplete: false },
      { field_id: "med_list", section: "", question: "Meds", answer: "Metformin, 500 mg, twice a day", incomplete: false },
    ];
    const tpl = buildTemplateSummary(items, ["ls_tobacco"]);
    const { report } = validateSummary(tpl, items, items.map((i) => i.field_id).concat("ls_tobacco"));
    expect(report.unsupported).toBe(0);
    expect(tpl.flagged[0].field_id).toBe("ls_tobacco");
  });
});
