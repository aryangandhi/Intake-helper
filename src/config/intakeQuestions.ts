// DRAFT wording: pending Health Sciences review
//
// This file defines every question on the intake form (patient form and staff PowerForm).
// Edit wording, examples or options here. Keep `id` values stable: saved answers, AI citations
// and the EMR raw data all refer to questions by id.
//
// Question types: text | longtext | yesno | single | multi | date | scale | repeat
// - `showIf` hides a question unless another answer matches (conditional logic).
// - `staffOnly` questions appear only on the nurse / co-op PowerForm.
// - `optional` questions are never listed as incomplete.
// - `summaryHeading` tells the template summary (and copy-to-note) where the answer belongs.

export type QuestionType = "text" | "longtext" | "yesno" | "single" | "multi" | "date" | "scale" | "repeat";

export type SummaryHeading =
  | "Reason for referral / chief complaint"
  | "Medical history"
  | "Procedures / surgeries"
  | "Current medications"
  | "Allergies"
  | "Social history"
  | "Family history"
  | "Functional status / symptoms"
  | "Psychosocial"
  | "Advance care planning";

export interface RepeatField {
  id: string;
  label: string;
  example?: string;
}

export interface Question {
  id: string;
  label: string;
  type: QuestionType;
  example?: string;
  help?: string;
  info?: string; // shown behind an "i" button next to the question, for terms many people don't know
  options?: string[];
  optionGroups?: { group: string; options: string[] }[];
  repeatFields?: RepeatField[];
  noneLabel?: string; // for repeat lists: "I don't take any medications"
  showIf?: { id: string; equals: string | string[] };
  staffOnly?: boolean;
  optional?: boolean;
  summaryHeading?: SummaryHeading;
  voice?: boolean; // show microphone button (text fields)
}

export interface Section {
  id: string;
  title: string;
  intro?: string;
  staffOnly?: boolean;
  questions: Question[];
}

export const SUMMARY_HEADINGS: SummaryHeading[] = [
  "Reason for referral / chief complaint",
  "Medical history",
  "Procedures / surgeries",
  "Current medications",
  "Allergies",
  "Social history",
  "Family history",
  "Functional status / symptoms",
  "Psychosocial",
  "Advance care planning",
];

const MOOD_OPTIONS = ["Not at all", "Several days", "More than half the days", "Nearly every day"];

export const INTAKE_SECTIONS: Section[] = [
  {
    id: "about",
    title: "About you",
    intro: "A few questions so we can care for you in the way that works best for you.",
    questions: [
      { id: "ay_preferred_name", label: "What name would you like us to call you?", type: "text", example: "Example: Jane, or Mrs. Doe", optional: true, voice: true },
      { id: "ay_sex", label: "What sex were you assigned at birth?", type: "single", options: ["Female", "Male", "Intersex", "Prefer not to say"] },
      {
        id: "ay_pregnancy",
        label: "Are you pregnant, or could you be pregnant, or are you breastfeeding?",
        type: "single",
        options: ["No", "Yes, I am pregnant or could be", "Yes, I am breastfeeding", "Not sure"],
        showIf: { id: "ay_sex", equals: "Female" },
        summaryHeading: "Medical history",
      },
      { id: "ay_language", label: "What language do you prefer to speak?", type: "text", example: "Example: English, or Punjabi", voice: true },
      {
        id: "ay_contact",
        label: "How do you prefer we contact you?",
        type: "single",
        options: ["Phone call", "Text message", "Email", "MyConnectedCare message"],
      },
      {
        id: "ay_sensory_has",
        label: "Do you have any trouble hearing, seeing, or other sensory needs?",
        type: "yesno",
        summaryHeading: "Functional status / symptoms",
      },
      {
        id: "ay_sensory_list",
        label: "Which of these apply to you? Choose all that apply.",
        type: "multi",
        options: [
          "Trouble hearing",
          "I use hearing aids",
          "Trouble seeing",
          "I need large print",
          "Blind or low vision",
          "Trouble speaking",
          "Numbness or loss of feeling",
          "I use a cane, walker or wheelchair",
          "Something else",
        ],
        showIf: { id: "ay_sensory_has", equals: "Yes" },
        summaryHeading: "Functional status / symptoms",
      },
      {
        id: "ay_sensory_details",
        label: "Anything else we should know about your sensory needs or devices?",
        type: "text",
        example: "Example: Hearing aids in both ears. Please face me when speaking.",
        showIf: { id: "ay_sensory_has", equals: "Yes" },
        optional: true,
        voice: true,
        summaryHeading: "Functional status / symptoms",
      },
      { id: "ay_caregiver", label: "Are you the main caregiver for someone else (a child, partner or parent)?", type: "yesno", summaryHeading: "Social history" },
      {
        id: "ay_caregiver_arrangements",
        label: "Have you made arrangements for their care while you are at your appointments?",
        type: "yesno",
        showIf: { id: "ay_caregiver", equals: "Yes" },
        summaryHeading: "Social history",
      },
      { id: "ay_trial", label: "Are you taking part in a clinical trial (a research study)?", type: "yesno", summaryHeading: "Medical history" },
      {
        id: "ay_trial_name",
        label: "What is the name of the clinical trial?",
        type: "text",
        example: "Example: CCTG MA.40 study (write \"not sure\" if you don't know)",
        showIf: { id: "ay_trial", equals: "Yes" },
        voice: true,
        summaryHeading: "Medical history",
      },
    ],
  },
  {
    id: "concern",
    title: "Main concern and symptoms",
    questions: [
      {
        id: "mc_reason",
        label: "In your own words, what brings you to the Cancer Centre?",
        type: "longtext",
        example: "Example: My family doctor found a lump in my left breast in September. A biopsy showed cancer.",
        voice: true,
        summaryHeading: "Reason for referral / chief complaint",
      },
      { id: "mc_pain", label: "Do you have any pain right now?", type: "yesno", summaryHeading: "Functional status / symptoms" },
      {
        id: "mc_pain_location",
        label: "Where is the pain?",
        type: "text",
        example: "Example: Lower back, worse at night",
        showIf: { id: "mc_pain", equals: "Yes" },
        voice: true,
        summaryHeading: "Functional status / symptoms",
      },
      {
        id: "mc_pain_score",
        label: "How bad is the pain? (0 = no pain, 10 = worst pain you can imagine)",
        type: "scale",
        showIf: { id: "mc_pain", equals: "Yes" },
        summaryHeading: "Functional status / symptoms",
      },
      {
        id: "mc_symptoms",
        label: "In the past month, have you had any of these? Choose all that apply.",
        type: "multi",
        optionGroups: [
          { group: "General", options: ["Feeling very tired", "Weight loss without trying", "Fever or night sweats", "Poor appetite"] },
          { group: "Breathing and heart", options: ["Shortness of breath", "Cough that won't go away", "Chest pain", "Swollen legs or ankles"] },
          { group: "Stomach and bowel", options: ["Nausea or vomiting", "Diarrhea", "Constipation", "Blood in stool"] },
          { group: "Bladder", options: ["Pain when peeing", "Peeing more often", "Blood in urine", "Leaking urine"] },
          { group: "None", options: ["None of these"] },
        ],
        summaryHeading: "Functional status / symptoms",
      },
    ],
  },
  {
    id: "allergies",
    title: "Allergies",
    questions: [
      { id: "al_has", label: "Do you have any allergies (to medications, foods, latex or anything else)?", type: "yesno", summaryHeading: "Allergies" },
      {
        id: "al_list",
        label: "What are you allergic to, and what happens?",
        type: "repeat",
        repeatFields: [
          { id: "allergen", label: "Allergic to", example: "Example: Penicillin" },
          { id: "reaction", label: "What happens", example: "Example: Hives and itchy skin" },
        ],
        showIf: { id: "al_has", equals: "Yes" },
        summaryHeading: "Allergies",
      },
    ],
  },
  {
    id: "medications",
    title: "Current medications",
    intro: "Please also bring your official list of current medications (from your pharmacy) to your appointment.",
    questions: [
      {
        id: "med_list",
        label: "List all the medications you take, including vitamins and over-the-counter medications.",
        type: "repeat",
        repeatFields: [
          { id: "name", label: "Medication name", example: "Example: Metformin" },
          { id: "dose", label: "Dose", example: "Example: 500 mg" },
          { id: "frequency", label: "How often", example: "Example: twice a day" },
        ],
        noneLabel: "I don't take any medications",
        help: "If you used the microphone, please check the medicine names. Voice typing can get medication names wrong.",
        summaryHeading: "Current medications",
      },
    ],
  },
  {
    id: "history",
    title: "Medical history",
    questions: [
      {
        id: "mh_has",
        label: "Do you have any health conditions now, or have you had any in the past?",
        type: "yesno",
        summaryHeading: "Medical history",
      },
      {
        id: "mh_list",
        label: "Which health conditions do you have, or have you had? Choose all that apply.",
        type: "multi",
        options: [
          "High blood pressure",
          "High cholesterol",
          "Diabetes",
          "Heart disease or heart attack",
          "Stroke",
          "Asthma or COPD",
          "Kidney disease",
          "Liver disease",
          "Thyroid problems",
          "Arthritis",
          "Depression or anxiety",
          "A previous cancer",
          "Something else",
        ],
        showIf: { id: "mh_has", equals: "Yes" },
        summaryHeading: "Medical history",
      },
      {
        id: "mh_details",
        label: "Tell us more, such as when each condition started, or any condition not on the list.",
        type: "longtext",
        example: "Example: Type 2 diabetes since 2015. Asthma as a child.",
        showIf: { id: "mh_has", equals: "Yes" },
        optional: true,
        voice: true,
        summaryHeading: "Medical history",
      },
      {
        id: "sx_list",
        label: "Have you had any surgeries or procedures? List what and when.",
        type: "repeat",
        repeatFields: [
          { id: "procedure", label: "Surgery or procedure", example: "Example: Gallbladder removed" },
          { id: "when", label: "When (year)", example: "Example: 2012" },
        ],
        noneLabel: "I have not had any surgeries or procedures",
        summaryHeading: "Procedures / surgeries",
      },
    ],
  },
  {
    id: "family",
    title: "Family history",
    questions: [
      {
        id: "fh_list",
        label: "Has anyone in your family had cancer or another serious illness?",
        type: "repeat",
        repeatFields: [
          { id: "relative", label: "Family member", example: "Example: Mother" },
          { id: "condition", label: "Illness", example: "Example: Breast cancer at age 60" },
        ],
        noneLabel: "No family history that I know of",
        summaryHeading: "Family history",
      },
    ],
  },
  {
    id: "lifestyle",
    title: "Lifestyle",
    questions: [
      { id: "ls_tobacco", label: "Do you smoke or use tobacco?", type: "single", options: ["Never", "I used to", "Yes, currently"], summaryHeading: "Social history" },
      {
        id: "ls_tobacco_details",
        label: "What and how much? When did you stop (if you stopped)?",
        type: "text",
        example: "Example: 1 pack a day for 20 years, quit in 2010",
        showIf: { id: "ls_tobacco", equals: ["I used to", "Yes, currently"] },
        voice: true,
        summaryHeading: "Social history",
      },
      {
        id: "ls_alcohol",
        label: "How often do you drink alcohol?",
        type: "single",
        options: ["Never", "Less than once a week", "1 to 2 days a week", "3 or more days a week"],
        summaryHeading: "Social history",
      },
      {
        id: "ls_living",
        label: "Who do you live with? Do you have any help at home?",
        type: "longtext",
        example: "Example: I live with my husband. My daughter helps with groceries.",
        voice: true,
        summaryHeading: "Social history",
      },
      { id: "ls_work", label: "Do you work or go to school? What do you do?", type: "text", example: "Example: Retired teacher", voice: true, summaryHeading: "Social history" },
    ],
  },
  {
    id: "planning",
    title: "Planning ahead",
    questions: [
      {
        id: "acp_has",
        label: "Do you have an advance care plan?",
        type: "single",
        options: ["Yes", "No", "Not sure"],
        info:
          "An advance care plan is a record of your wishes for future health care, in case you become too sick to speak for yourself. It can be written down or shared with family and your care team. Many people do not have one yet, and that is okay. Your care team can talk with you about it.",
        summaryHeading: "Advance care planning",
      },
    ],
  },
  {
    id: "feeling",
    title: "How you've been feeling",
    questions: [
      {
        id: "mood_down",
        label: "In the past month, how often have you felt sad, blue, depressed or down?",
        type: "single",
        options: MOOD_OPTIONS,
        summaryHeading: "Psychosocial",
      },
      {
        id: "mood_interest",
        label: "In the past month, how often have you had little interest or enjoyment in the things you usually do?",
        type: "single",
        options: MOOD_OPTIONS,
        summaryHeading: "Psychosocial",
      },
    ],
  },
  {
    id: "contacts",
    title: "Emergency contact and pharmacy",
    questions: [
      {
        id: "cp_name",
        label: "Emergency contact or care partner's name, and how they are related to you",
        type: "text",
        example: "Example: John Doe (husband)",
        voice: true,
        summaryHeading: "Social history",
      },
      { id: "cp_phone", label: "Emergency contact's phone number", type: "text", example: "Example: 519-555-0142" },
      { id: "ph_name", label: "Your main pharmacy's name and location", type: "text", example: "Example: Shoppers Drug Mart, King St. Waterloo", voice: true },
      { id: "ph_phone", label: "Your pharmacy's phone number", type: "text", example: "Example: 519-555-0199" },
    ],
  },
  {
    id: "vitals",
    title: "Vital signs (to be measured at visit)",
    staffOnly: true,
    questions: [
      { id: "vs_temp", label: "Temperature (°C)", type: "text", staffOnly: true, optional: true },
      { id: "vs_hr", label: "Heart rate (bpm)", type: "text", staffOnly: true, optional: true },
      { id: "vs_rr", label: "Respiratory rate (/min)", type: "text", staffOnly: true, optional: true },
      { id: "vs_bp", label: "Blood pressure (mmHg)", type: "text", staffOnly: true, optional: true },
      { id: "vs_spo2", label: "SpO2 (%)", type: "text", staffOnly: true, optional: true },
      { id: "vs_weight", label: "Weight (kg)", type: "text", staffOnly: true, optional: true },
      { id: "vs_height", label: "Height (cm)", type: "text", staffOnly: true, optional: true },
    ],
  },
];

export const ALL_QUESTIONS: Question[] = INTAKE_SECTIONS.flatMap((s) => s.questions);

export function getQuestion(id: string): Question | undefined {
  return ALL_QUESTIONS.find((q) => q.id === id);
}

export function sectionsFor(audience: "patient" | "staff"): Section[] {
  return audience === "patient" ? INTAKE_SECTIONS.filter((s) => !s.staffOnly) : INTAKE_SECTIONS;
}
