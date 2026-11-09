import type { Answers } from "@/lib/answers";

// Fully completed example form for a fictional patient. Shown read-only at /myconnectedcare/example.
export const EXAMPLE_PATIENT = {
  firstName: "Sam",
  lastName: "Example",
  dob: "1959-06-15",
  providerGroup: "Medical Oncology",
};

export const EXAMPLE_ANSWERS: Answers = {
  ay_preferred_name: "Sam",
  ay_sex: "Male",
  ay_language: "English",
  ay_contact: "Phone call",
  ay_sensory: "I wear glasses. No hearing problems.",
  ay_caregiver: "Yes",
  ay_caregiver_arrangements: "Yes",
  ay_trial: "No",
  mc_reason: "I had blood in my stool for a few weeks. A colonoscopy in August found a tumour in my colon. My family doctor sent me here.",
  mc_pain: "Yes",
  mc_pain_location: "Lower belly, comes and goes",
  mc_pain_score: "4",
  mc_symptoms: ["Feeling very tired", "Weight loss without trying", "Blood in stool"],
  al_has: "Yes",
  al_list: { items: [{ allergen: "Penicillin", reaction: "Hives and itchy skin" }] },
  med_list: {
    items: [
      { name: "Metformin", dose: "500 mg", frequency: "twice a day" },
      { name: "Ramipril", dose: "10 mg", frequency: "once a day in the morning" },
      { name: "Vitamin D", dose: "1000 IU", frequency: "once a day" },
    ],
  },
  mh_conditions: "Type 2 diabetes since 2015. High blood pressure. Asthma as a child.",
  sx_list: { items: [{ procedure: "Gallbladder removed", when: "2012" }, { procedure: "Colonoscopy with biopsy", when: "2026" }] },
  fh_list: { items: [{ relative: "Mother", condition: "Breast cancer at age 60" }, { relative: "Brother", condition: "Type 2 diabetes" }] },
  ls_tobacco: "I used to",
  ls_tobacco_details: "1 pack a day for 20 years, quit in 2010",
  ls_alcohol: "1 to 2 days a week",
  ls_living: "I live with my wife. I take care of my grandson after school. My daughter can drive me to appointments.",
  ls_work: "Retired electrician",
  acp_has: "No",
  acp_sdm_name: "Maria Example",
  acp_sdm_relationship: "Wife",
  mood_down: "No",
  mood_interest: "Yes",
  cp_name: "Maria Example (wife)",
  cp_phone: "519-555-0142",
  ph_name: "Shoppers Drug Mart, King St. Waterloo",
  ph_phone: "519-555-0199",
};
