import type { PrismaClient } from "@prisma/client";
import { ageFromDob, buildRawData, computeIncomplete, flatRaw, type Answers } from "./answers";
import { renderIntakeEmail, SEVEN_DAYS } from "./email";
import { validateSummary } from "./ai/validate";
import type { ModelSummary } from "./ai/schema";

export const DEMO_PASSWORD = "password";

function daysFromNow(days: number, hour: number, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

const MARGARET_ANSWERS: Answers = {
  ay_preferred_name: "Maggie",
  ay_sex: "Female",
  ay_pregnancy: "No",
  ay_language: "English",
  ay_contact: "Phone call",
  ay_sensory_has: "Yes",
  ay_sensory_list: ["Trouble hearing", "Trouble seeing"],
  ay_sensory_details: "I wear glasses for reading. Slightly hard of hearing in my right ear, no hearing aid.",
  ay_caregiver: "No",
  ay_trial: "No",
  mc_reason: "I had a lumpectomy for breast cancer in my right breast in October 2026. My surgeon referred me for radiation treatment.",
  mc_pain: "Yes",
  mc_pain_location: "Right breast and armpit where the surgery was",
  mc_pain_score: "3",
  mc_symptoms: ["Feeling very tired", "Poor appetite"],
  al_has: "Yes",
  al_list: { items: [{ allergen: "Sulfa drugs", reaction: "Rash" }] },
  med_list: {
    items: [
      { name: "Amlodipine", dose: "5 mg", frequency: "once a day" },
      { name: "Atorvastatin", dose: "20 mg", frequency: "once a day at bedtime" },
      { name: "Acetaminophen", dose: "500 mg", frequency: "as needed for pain, up to 3 times a day" },
    ],
  },
  mh_has: "Yes",
  mh_list: ["High blood pressure", "High cholesterol", "Arthritis"],
  mh_details: "High blood pressure for about 10 years. Osteoarthritis in both knees.",
  sx_list: { items: [{ procedure: "Right breast lumpectomy", when: "2026" }, { procedure: "Cataract surgery, left eye", when: "2019" }] },
  fh_list: { items: [{ relative: "Sister", condition: "Breast cancer at age 62" }, { relative: "Father", condition: "Heart attack" }] },
  ls_tobacco: "I used to",
  ls_tobacco_details: "Half a pack a day for 15 years, quit in 1990",
  ls_alcohol: "Less than once a week",
  ls_living: "I live alone in an apartment. My son visits on weekends and drives me to appointments.",
  ls_work: "Retired bank teller",
  acp_has: "Yes",
  mood_down: "Not at all",
  mood_interest: "Several days",
  cp_name: "David Wilson (son)",
  cp_phone: "519-555-0177",
  ph_name: "Rexall, Weber St. Kitchener",
  // ph_phone left blank on purpose, so the document shows a flagged item
};

function margaretSummary(age: number): ModelSummary {
  return {
    paragraph: [
      { text: `Ms. Wilson is a ${age}-year-old woman referred to Radiation Oncology after a right breast lumpectomy for breast cancer in October 2026.`, citations: ["pt_age", "ay_sex", "pt_provider_group", "mc_reason"] },
      { text: "She reports pain in the right breast and armpit at the surgical site, rated 3 out of 10, along with fatigue and poor appetite over the past month.", citations: ["mc_pain_location", "mc_pain_score", "mc_symptoms"] },
      { text: "Her history includes high blood pressure for about 10 years, high cholesterol and osteoarthritis of both knees, and she had left cataract surgery in 2019.", citations: ["mh_list", "mh_details", "sx_list"] },
      { text: "Current medications are amlodipine 5 mg once a day, atorvastatin 20 mg at bedtime and acetaminophen 500 mg as needed for pain.", citations: ["med_list"] },
      { text: "She is allergic to sulfa drugs (rash), and her sister had breast cancer at age 62.", citations: ["al_list", "fh_list"] },
      { text: "She is a former smoker who quit in 1990, lives alone, and is supported by her son, who is her emergency contact.", citations: ["ls_tobacco", "ls_tobacco_details", "ls_living", "cp_name"] },
    ],
    sections: [
      {
        heading: "Reason for referral / chief complaint",
        bullets: [
          { text: "Referred to Radiation Oncology for radiation treatment after right breast lumpectomy for breast cancer (October 2026)", citations: ["pt_provider_group", "mc_reason"] },
          // Intentionally unsupported (number not in the answers) to show how validation flags it.
          { text: "Pre-operative mammogram in September 2026 showed a 2 cm mass", citations: ["mc_reason"] },
        ],
      },
      { heading: "Medical history", bullets: [{ text: "High blood pressure (about 10 years), high cholesterol, osteoarthritis in both knees", citations: ["mh_list", "mh_details"] }, { text: "Not in a clinical trial", citations: ["ay_trial"] }] },
      { heading: "Procedures / surgeries", bullets: [{ text: "Right breast lumpectomy (2026)", citations: ["sx_list"] }, { text: "Cataract surgery, left eye (2019)", citations: ["sx_list"] }] },
      {
        heading: "Current medications",
        bullets: [
          { text: "Amlodipine 5 mg once a day", citations: ["med_list"] },
          { text: "Atorvastatin 20 mg once a day at bedtime", citations: ["med_list"] },
          { text: "Acetaminophen 500 mg as needed for pain, up to 3 times a day", citations: ["med_list"] },
        ],
      },
      { heading: "Allergies", bullets: [{ text: "Sulfa drugs: rash", citations: ["al_list"] }] },
      {
        heading: "Social history",
        bullets: [
          { text: "Former smoker: half a pack a day for 15 years, quit in 1990", citations: ["ls_tobacco", "ls_tobacco_details"] },
          { text: "Alcohol less than once a week", citations: ["ls_alcohol"] },
          { text: "Lives alone in an apartment; son visits on weekends and drives her to appointments", citations: ["ls_living"] },
          { text: "Retired bank teller", citations: ["ls_work"] },
        ],
      },
      { heading: "Family history", bullets: [{ text: "Sister: breast cancer at age 62", citations: ["fh_list"] }, { text: "Father: heart attack", citations: ["fh_list"] }] },
      {
        heading: "Functional status / symptoms",
        bullets: [
          { text: "Pain at right breast and armpit surgical site, 3 out of 10", citations: ["mc_pain_location", "mc_pain_score"] },
          { text: "Fatigue and poor appetite in the past month", citations: ["mc_symptoms"] },
          { text: "Wears reading glasses; slightly hard of hearing in right ear, no hearing aid", citations: ["ay_sensory_list", "ay_sensory_details"] },
        ],
      },
      { heading: "Psychosocial", bullets: [{ text: "Low mood in past month: not at all; little interest or enjoyment on several days", citations: ["mood_down", "mood_interest"] }] },
      { heading: "Advance care planning", bullets: [{ text: "Has an advance care plan", citations: ["acp_has"] }] },
    ],
    flagged: [{ field_id: "ph_phone", note: "Pharmacy phone number not provided" }],
  };
}

/** Wipes the database and loads the demo data. Used by `npm run setup`, `npm run reset` and the demo hub. */
export async function seedDemo(prisma: PrismaClient) {
  await prisma.clinicNote.deleteMany();
  await prisma.eMRDocument.deleteMany();
  await prisma.aISummary.deleteMany();
  await prisma.intakeSubmission.deleteMany();
  await prisma.helpRequest.deleteMany();
  await prisma.email.deleteMany();
  await prisma.user.deleteMany();
  await prisma.referral.deleteMany();

  // Staff
  await prisma.user.createMany({
    data: [
      { email: "admin@wrhn-demo.ca", password: DEMO_PASSWORD, name: "Alex Morgan", role: "admin" },
      { email: "nurse@wrhn-demo.ca", password: DEMO_PASSWORD, name: "Priya Patel", role: "nurse" },
      { email: "coop@wrhn-demo.ca", password: DEMO_PASSWORD, name: "Jordan Lee", role: "coop" },
      { email: "oncologist@wrhn-demo.ca", password: DEMO_PASSWORD, name: "Dr. Maria Santos", role: "oncologist" },
    ],
  });

  const mk = async (r: {
    firstName: string; lastName: string; dob: string; sex: string; email: string; phone: string;
    appt: Date; providerGroup: string; mrn: string; status: string; sendEmail: boolean; account: boolean;
  }) => {
    const ref = await prisma.referral.create({
      data: {
        firstName: r.firstName, lastName: r.lastName, dob: r.dob, sex: r.sex, email: r.email, phone: r.phone,
        appointmentAt: r.appt, providerGroup: r.providerGroup, mrn: r.mrn, status: r.status,
        emailScheduledAt: new Date(r.appt.getTime() - SEVEN_DAYS),
        createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000),
      },
    });
    if (r.sendEmail) {
      const sentAt = new Date(Math.min(Date.now() - 60 * 60 * 1000, r.appt.getTime() - SEVEN_DAYS));
      const { subject, bodyHtml } = renderIntakeEmail(ref);
      await prisma.email.create({ data: { to: ref.email, subject, bodyHtml, sentAt, referralId: ref.id } });
      await prisma.referral.update({ where: { id: ref.id }, data: { emailSentAt: sentAt } });
    }
    if (r.account) {
      await prisma.user.create({ data: { email: r.email, password: DEMO_PASSWORD, name: `${r.firstName} ${r.lastName}`, role: "patient", referralId: ref.id } });
    }
    return ref;
  };

  // Scenario 1 and 2 patient: email already sent, has a MyConnectedCare account.
  await mk({ firstName: "Jane", lastName: "Doe", dob: "1967-03-14", sex: "Female", email: "jane.doe@example.com", phone: "519-555-0101", appt: daysFromNow(6, 10), providerGroup: "Medical Oncology", mrn: "7000101", status: "email_sent", sendEmail: true, account: true });

  // Finished example already in the EMR.
  const margaret = await mk({ firstName: "Margaret", lastName: "Wilson", dob: "1951-08-02", sex: "Female", email: "margaret.wilson@example.com", phone: "519-555-0123", appt: daysFromNow(3, 9, 30), providerGroup: "Radiation Oncology", mrn: "7000102", status: "submitted", sendEmail: true, account: true });

  // Email sent, no portal account yet (can use "Sign up").
  await mk({ firstName: "Robert", lastName: "Chen", dob: "1960-11-21", sex: "Male", email: "robert.chen@example.com", phone: "519-555-0145", appt: daysFromNow(5, 14), providerGroup: "Hematology", mrn: "7000103", status: "email_sent", sendEmail: true, account: false });

  // Asked for a nurse call earlier; nurse has already called to book a time.
  const ahmed = await mk({ firstName: "Ahmed", lastName: "Hassan", dob: "1948-05-09", sex: "Male", email: "ahmed.hassan@example.com", phone: "519-555-0168", appt: daysFromNow(2, 11), providerGroup: "Medical Oncology", mrn: "7000104", status: "help_requested", sendEmail: true, account: false });
  await prisma.helpRequest.create({
    data: { referralId: ahmed.id, name: "Ahmed Hassan", dob: "1948-05-09", phone: "519-555-0168", language: "Arabic", bestTime: "Mornings", notes: "My daughter Layla will help translate.", source: "email", status: "called", read: true, createdAt: new Date(Date.now() - 26 * 3600 * 1000) },
  });

  // Referral just entered; email not sent yet (appointment is more than 7 days away).
  await mk({ firstName: "Linda", lastName: "Nguyen", dob: "1972-01-30", sex: "Female", email: "linda.nguyen@example.com", phone: "519-555-0190", appt: daysFromNow(12, 13), providerGroup: "Surgical Oncology", mrn: "7000105", status: "referral_entered", sendEmail: false, account: false });

  // Margaret's completed online submission, AI summary and EMR document.
  const submittedAt = new Date(Date.now() - 20 * 3600 * 1000);
  const sub = await prisma.intakeSubmission.create({
    data: {
      referralId: margaret.id, answers: JSON.stringify(MARGARET_ANSWERS), status: "submitted", completedBy: "patient",
      completedByName: "Margaret Wilson", submittedAt, incompleteFields: JSON.stringify(computeIncomplete(MARGARET_ANSWERS, "patient")),
    },
  });
  const raw = flatRaw(buildRawData(MARGARET_ANSWERS, margaret, "patient"));
  const { checked, report } = validateSummary(margaretSummary(ageFromDob(margaret.dob)), raw.map((i) => ({ field_id: i.field_id, answer: i.answer })), raw.map((i) => i.field_id));
  await prisma.aISummary.create({
    data: { submissionId: sub.id, status: "ready", content: JSON.stringify(checked), validation: JSON.stringify(report), modelUsed: "Seeded demo summary (pre-written example)", isFallback: false, generatedAt: new Date(submittedAt.getTime() + 15000) },
  });
  await prisma.eMRDocument.create({ data: { referralId: margaret.id, submissionId: sub.id, hasAISummary: true, createdAt: submittedAt } });
}
