import { test, expect, type Page, type BrowserContext } from "@playwright/test";

const PASSWORD = "password";

async function reset(page: Page) {
  const res = await page.request.post("/api/reset");
  expect(res.ok()).toBeTruthy();
}

async function loginWith(page: Page, email: string) {
  await page.getByLabel(/email/i).first().fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: /log in|sign in/i }).click();
}

async function openFromEmail(context: BrowserContext, page: Page, linkName: RegExp) {
  const [popup] = await Promise.all([context.waitForEvent("page"), page.getByRole("link", { name: linkName }).click()]);
  await popup.waitForLoadState();
  return popup;
}

async function oncologistOpensLatestIntake(page: Page, patient: string) {
  await page.goto("/emr");
  if (page.url().includes("/login")) await loginWith(page, "oncologist@wrhn-demo.ca");
  await page.getByRole("link", { name: patient }).click();
  await page.getByRole("link", { name: "Oncology New Patient Intake" }).first().click();
  await expect(page.getByRole("heading", { name: "Oncology New Patient Intake" })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await reset(page);
});

test("Scenario 1: patient completes the form online, oncologist reviews it", async ({ page, context }) => {
  // 1. Patient inbox
  await page.goto("/inbox");
  await loginWith(page, "jane.doe@example.com");
  await page.getByRole("link", { name: /Action needed: Complete your new patient intake form/ }).click();
  await expect(page.getByText("Prefer to do this over the phone?")).toBeVisible();

  // 2. Open MyConnectedCare from the email (signs the patient straight in)
  const mcc = await openFromEmail(context, page, /Open MyConnectedCare/);
  await expect(mcc.getByRole("heading", { name: "Hello, Jane" })).toBeVisible();

  // 3. Questionnaires > Start Intake Form
  await mcc.getByRole("link", { name: /Questionnaires/ }).click();
  await mcc.getByRole("link", { name: "Start Intake Form" }).click();
  await mcc.waitForLoadState("networkidle"); // wait for the form to hydrate

  // 4. Fill the form
  await expect(mcc.getByRole("button", { name: /Need help\? Request a nurse call/ })).toBeVisible();
  await mcc.locator("#in-ay_preferred_name").fill("Jane");
  await mcc.getByRole("radio", { name: "Female" }).check();
  await mcc.locator("#q-ay_pregnancy").getByRole("radio", { name: "No", exact: true }).check(); // conditional
  await mcc.locator("#in-ay_language").fill("English");
  await mcc.getByRole("radio", { name: "Email" }).check();
  await mcc.locator("#q-ay_caregiver").getByRole("radio", { name: "No" }).check();
  await mcc.locator("#q-ay_trial").getByRole("radio", { name: "Yes" }).check();
  await expect(mcc.locator("#in-ay_trial_name")).toBeVisible(); // conditional question appears
  await mcc.getByRole("button", { name: "Next →" }).click();

  await mcc.locator("#in-mc_reason").fill("My family doctor found a lump in my left breast in September 2026. A biopsy showed cancer.");
  await mcc.locator("#q-mc_pain").getByRole("radio", { name: "Yes" }).check();
  await mcc.locator("#in-mc_pain_location").fill("Left breast");
  await mcc.locator("#q-mc_pain_score").getByText("4", { exact: true }).click();
  await mcc.getByRole("checkbox", { name: "Feeling very tired" }).check();
  await mcc.getByRole("button", { name: "Next →" }).click();

  await mcc.locator("#q-al_has").getByRole("radio", { name: "Yes" }).check();
  await mcc.locator("#in-al_list").fill("Penicillin");
  await mcc.locator("#in-al_list-0-reaction").fill("Hives");
  await mcc.getByRole("button", { name: "Next →" }).click();

  await mcc.locator("#in-med_list").fill("Metformin");
  await mcc.locator("#in-med_list-0-dose").fill("500 mg");
  await mcc.locator("#in-med_list-0-frequency").fill("twice a day");
  await mcc.getByRole("button", { name: "Next →" }).click();

  await mcc.locator("#in-mh_conditions").fill("Type 2 diabetes since 2015.");
  // Skip the rest to test incomplete handling: jump to review via step list
  await mcc.getByRole("button", { name: "Review and send" }).click();
  await expect(mcc.getByText(/questions are not answered yet/)).toBeVisible();
  await mcc.getByRole("button", { name: "Send to my care team" }).click();

  // 5. Completion screen
  await expect(mcc.getByRole("heading", { name: "Thank you, your intake form has been sent to your care team." })).toBeVisible();

  // 6-7. Oncologist sees the document
  const emr = await context.newPage();
  await oncologistOpensLatestIntake(emr, "Doe, Jane");
  await expect(emr.getByText("AI Summary (paragraph)")).toBeVisible({ timeout: 30_000 });
  await expect(emr.getByText("Template summary (AI unavailable)")).toBeVisible();
  // Citation jumps to raw answer
  await emr.locator("section[aria-labelledby=ai-para] button", { hasText: /^\[\d+\]$/ }).first().click();
  await expect(emr.locator("tr.raw-highlight")).toHaveCount(1);
  await expect(emr.getByText("Flagged / missing items")).toBeVisible();
  await expect(emr.getByRole("button", { name: /Not answered: Do you smoke/ })).toBeVisible();

  // 8. Verify, copy to note, edit and save
  await emr.getByRole("button", { name: "Mark as verified" }).click();
  await expect(emr.getByText(/Verified by Dr. Maria Santos/)).toBeVisible();
  await emr.getByRole("button", { name: "Copy to clinic note" }).click();
  await expect(emr.locator("#currentMedications")).toHaveValue(/Metformin/);
  await expect(emr.locator("#medicalHistory")).not.toHaveValue(/\[\d+\]/);
  await emr.locator("#plan").fill("Discuss treatment options.");
  await emr.getByRole("button", { name: "Save note" }).click();
  await expect(emr.getByText(/Saved at/)).toBeVisible();
});

test("Scenario 2: patient requests a nurse call, nurse completes the PowerForm", async ({ page, context }) => {
  await page.goto("/inbox");
  await loginWith(page, "jane.doe@example.com");
  await page.getByRole("link", { name: /Action needed/ }).click();
  const help = await openFromEmail(context, page, /Request a nurse call/);
  await expect(help.getByLabel("Your full name")).toHaveValue("Jane Doe");
  await help.getByLabel("Preferred language").fill("English");
  await help.getByRole("button", { name: "Request a nurse call" }).click();
  await expect(help.getByText(/A nurse will call you 1 to 2 days before your appointment/)).toBeVisible();

  const ia = await context.newPage();
  await ia.goto("/intake-assistant");
  await loginWith(ia, "nurse@wrhn-demo.ca");
  await expect(ia.getByRole("link", { name: /Notifications/ })).toContainText("1");
  await ia.getByRole("link", { name: "Nurse call requested: Jane Doe" }).click();
  await ia.getByRole("link", { name: "Start PowerForm" }).click();
  await ia.waitForLoadState("networkidle");
  await ia.locator("#in-mc_reason").fill("Abnormal mammogram in October 2026, biopsy confirmed breast cancer.");
  await ia.locator("#in-al_has").selectOption("No");
  await ia.locator("#in-med_list").fill("Levothyroxine");
  await ia.locator("#in-med_list-0-dose").fill("50 mcg");
  await ia.locator("#in-med_list-0-frequency").fill("once daily");
  await ia.locator("#in-vs_hr").fill("72");
  await ia.getByRole("button", { name: "Submit and send to EMR" }).click();
  await expect(ia.getByText(/Intake submitted. The AI summary is being prepared/)).toBeVisible();

  const emr = await context.newPage();
  await oncologistOpensLatestIntake(emr, "Doe, Jane");
  await expect(emr.getByText(/Completed by a nurse by phone \(RN Priya Patel\)/)).toBeVisible();
  await expect(emr.getByText("AI Summary (point form)")).toBeVisible({ timeout: 30_000 });
  await expect(emr.locator("#raw-med_list")).toContainText("Levothyroxine, 50 mcg, once daily");
  await expect(emr.locator("#raw-vs_hr")).toContainText("72");

  // Help request marked completed
  await ia.goto("/intake-assistant/notifications");
  await expect(ia.getByRole("row", { name: /Jane Doe/ }).getByText("Completed")).toBeVisible();
});

test("Scenario 3: co-op student completes the intake, nurse approves, EMR shows raw data only", async ({ browser }) => {
  const coopCtx = await browser.newContext({ baseURL: "http://localhost:3000" });
  const coop = await coopCtx.newPage();
  await coop.goto("/intake-assistant");
  await loginWith(coop, "coop@wrhn-demo.ca");
  await coop.getByRole("link", { name: "Nguyen, Linda" }).click();
  await coop.getByRole("link", { name: "Start PowerForm" }).click();
  await coop.waitForLoadState("networkidle");
  await coop.locator("#in-mc_reason").fill("Referred after surgery for a skin melanoma on her back.");
  await coop.locator("#in-al_has").selectOption("No");
  await coop.getByRole("button", { name: "Submit for nurse review" }).click();
  await expect(coop.getByText(/sent to the nurse review queue/)).toBeVisible();

  const nurseCtx = await browser.newContext({ baseURL: "http://localhost:3000" });
  const nurse = await nurseCtx.newPage();
  await nurse.goto("/intake-assistant");
  await loginWith(nurse, "nurse@wrhn-demo.ca");
  await nurse.getByRole("link", { name: /Co-op review queue/ }).click();
  await nurse.getByRole("link", { name: "Nguyen, Linda" }).click();
  await nurse.waitForLoadState("networkidle");
  await nurse.locator("#in-ls_tobacco").selectOption("Never");
  await nurse.getByRole("button", { name: "Approve and send to EMR" }).click();
  await expect(nurse.getByText("Approved and sent to the EMR.")).toBeVisible();

  const emr = await nurseCtx.newPage();
  await oncologistOpensLatestIntake(emr, "Nguyen, Linda");
  await expect(emr.getByText(/Completed by co-op student Jordan Lee, reviewed by RN Priya Patel on/)).toBeVisible();
  await expect(emr.getByText("AI Summary (paragraph)")).toHaveCount(0);
  await expect(emr.getByRole("heading", { name: "Raw Form Data" })).toBeVisible();
  await expect(emr.locator("#raw-ls_tobacco")).toContainText("Never");
});

test("New referral: admin enters a patient, patient reads the email and lands in their own portal", async ({ page, context }) => {
  const ia = await context.newPage();
  await ia.goto("/intake-assistant");
  await loginWith(ia, "admin@wrhn-demo.ca");
  await ia.getByRole("link", { name: "+ New referral" }).click();
  await ia.getByLabel("First name").fill("Test");
  await ia.getByLabel("Last name").fill("Patient");
  await ia.getByLabel("Date of birth").fill("1970-05-05");
  await ia.getByLabel("Phone").fill("519-555-0000");
  await ia.getByLabel("Email").fill("test.patient@example.com");
  const appt = new Date(Date.now() + 3 * 864e5);
  const local = new Date(appt.getTime() - appt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  await ia.getByLabel("First appointment (date and time)").fill(local);
  await ia.getByLabel("Provider group").selectOption("Hematology");
  await ia.getByRole("button", { name: "Save referral" }).click();
  await expect(ia.getByText(/intake email was sent right away/)).toBeVisible();

  await page.goto("/inbox");
  await loginWith(page, "test.patient@example.com");
  await page.getByRole("link", { name: /Action needed/ }).click();
  const mcc = await openFromEmail(context, page, /Open MyConnectedCare/);
  await expect(mcc.getByRole("heading", { name: "Hello, Test" })).toBeVisible();
  await mcc.getByRole("link", { name: /Questionnaires/ }).click();
  await expect(mcc.getByRole("link", { name: "Start Intake Form" })).toBeVisible();
});

test("Demo reset restores seed data", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Demo settings").click();
  await page.getByRole("button", { name: "Reset demo data" }).click();
  await expect(page.getByText("Demo data has been reset.")).toBeVisible();
});
