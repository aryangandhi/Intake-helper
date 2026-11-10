// Demo helper: fills the intake form with random but believable answers, so the team can
// get through the patient form or the PowerForm quickly during a demo.
import type { Question, Section } from "@/config/intakeQuestions";
import { isAnswered, isVisible, type Answers, type AnswerValue, type RepeatValue } from "./answers";

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const chance = (p: number) => Math.random() < p;
function pickSome<T>(arr: T[], min: number, max: number): T[] {
  const n = Math.min(arr.length, min + Math.floor(Math.random() * (max - min + 1)));
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
}

// Answer pools for free-text questions. Anything not listed falls back to the question's example.
const TEXT: Record<string, string[]> = {
  ay_preferred_name: ["Jan", "Bob", "Lin", "Raj", "Maggie", "Tony"],
  ay_language: ["English", "English", "French", "Punjabi", "Mandarin", "Portuguese"],
  ay_trial_name: ["Not sure", "CCTG MA.40 study"],
  ay_sensory_details: ["Glasses for reading.", "Hearing aid in my left ear. Please speak clearly.", "I need large print on forms."],
  mc_reason: [
    "My family doctor found a lump in my left breast in September. A biopsy showed cancer.",
    "I had blood in my stool for a few weeks. A colonoscopy found a tumour in my colon.",
    "I had a cough that would not go away. A CT scan showed a spot on my right lung.",
    "My PSA blood test was high. A biopsy showed prostate cancer.",
    "I had a mole on my back that changed shape. It was removed and was melanoma.",
  ],
  mc_pain_location: ["Lower back, worse at night", "Right side of my chest", "Lower belly, comes and goes", "Left hip when walking"],
  mh_details: ["Type 2 diabetes since 2015.", "High blood pressure for about 10 years.", "Asthma as a child. Knee arthritis.", "Thyroid medication since 2018."],
  ls_tobacco_details: ["1 pack a day for 20 years, quit in 2010", "Half a pack a day for 15 years, quit in 1995", "About 5 cigarettes a day"],
  ls_living: [
    "I live with my husband. My daughter helps with groceries.",
    "I live alone in an apartment. My son visits on weekends.",
    "I live with my wife and two teenage kids.",
    "I live with my sister. We help each other.",
  ],
  ls_work: ["Retired teacher", "Office manager", "Retired electrician", "Nurse, part time", "Truck driver"],
  cp_name: ["John Doe (husband)", "Maria Lopez (wife)", "David Wilson (son)", "Priya Shah (daughter)", "Anne Martin (sister)"],
  cp_phone: ["519-555-0142", "519-555-0177", "226-555-0110", "519-555-0123"],
  ph_name: ["Shoppers Drug Mart, King St. Waterloo", "Rexall, Weber St. Kitchener", "Costco Pharmacy, Waterloo", "Pharmasave, Elmira"],
  ph_phone: ["519-555-0199", "519-555-0188", "226-555-0166"],
  vs_temp: ["36.6", "36.9", "37.1"],
  vs_hr: ["68", "74", "82", "90"],
  vs_rr: ["14", "16", "18"],
  vs_bp: ["118/76", "128/82", "136/88", "142/90"],
  vs_spo2: ["96", "97", "98", "99"],
  vs_weight: ["58", "64", "72", "81", "90"],
  vs_height: ["158", "165", "172", "180"],
};

// Rows for list questions (allergies, medications, surgeries, family history).
const ROWS: Record<string, Record<string, string>[]> = {
  al_list: [
    { allergen: "Penicillin", reaction: "Hives and itchy skin" },
    { allergen: "Sulfa drugs", reaction: "Rash" },
    { allergen: "Peanuts", reaction: "Throat swelling" },
    { allergen: "Latex", reaction: "Itchy skin" },
  ],
  med_list: [
    { name: "Metformin", dose: "500 mg", frequency: "twice a day" },
    { name: "Ramipril", dose: "10 mg", frequency: "once a day" },
    { name: "Atorvastatin", dose: "20 mg", frequency: "once a day at bedtime" },
    { name: "Levothyroxine", dose: "50 mcg", frequency: "once a day" },
    { name: "Vitamin D", dose: "1000 IU", frequency: "once a day" },
    { name: "Acetaminophen", dose: "500 mg", frequency: "as needed for pain" },
  ],
  sx_list: [
    { procedure: "Gallbladder removed", when: "2012" },
    { procedure: "Appendix removed", when: "1998" },
    { procedure: "Cataract surgery, left eye", when: "2019" },
    { procedure: "Knee replacement, right", when: "2021" },
  ],
  fh_list: [
    { relative: "Mother", condition: "Breast cancer at age 60" },
    { relative: "Father", condition: "Heart attack" },
    { relative: "Brother", condition: "Type 2 diabetes" },
    { relative: "Aunt", condition: "Ovarian cancer" },
  ],
};

function fromExample(q: Question): string {
  return (q.example || "").replace(/^Example:\s*/, "").replace(/\s*\(.*\)$/, "") || "Not sure";
}

function randomValue(q: Question): AnswerValue {
  switch (q.type) {
    case "text":
    case "longtext":
      return TEXT[q.id] ? pick(TEXT[q.id]) : fromExample(q);
    case "date":
      return new Date(Date.now() - Math.random() * 3e10).toISOString().slice(0, 10);
    case "yesno":
      return chance(0.5) ? "Yes" : "No";
    case "single":
      if (q.id === "ay_pregnancy") return chance(0.85) ? "No" : pick(q.options || ["No"]);
      return pick(q.options || [""]);
    case "scale":
      return String(1 + Math.floor(Math.random() * 7));
    case "multi": {
      const groups = q.optionGroups || [{ group: "", options: q.options || [] }];
      const opts = groups.flatMap((g) => g.options).filter((o) => o !== "None of these" && o !== "Something else");
      return pickSome(opts, 1, 3);
    }
    case "repeat": {
      const rows = ROWS[q.id];
      if (q.noneLabel && chance(0.2)) return { none: true, items: [] } satisfies RepeatValue;
      if (rows) return { items: pickSome(rows, 1, 3) } satisfies RepeatValue;
      const fields = q.repeatFields || [];
      return { items: [Object.fromEntries(fields.map((f) => [f.id, (f.example || "").replace(/^Example:\s*/, "")]))] };
    }
  }
}

/**
 * Fills every blank, visible question in form order (so follow-up questions get answered too).
 * Answers already entered are kept.
 */
export function randomAnswers(sections: Section[], current: Answers = {}): Answers {
  const out: Answers = { ...current };
  for (const s of sections) {
    for (const q of s.questions) {
      if (!isVisible(q, out) || isAnswered(q, out[q.id])) continue;
      out[q.id] = randomValue(q);
    }
  }
  return out;
}
