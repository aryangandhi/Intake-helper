# Build brief: AI-Assisted Patient Intake Prototype (WRHN Cancer Centre, class project)

## 0. How to work on this

1. Read this whole brief and look at every attached image before writing code.
2. Reply with a short build plan (stack, folder structure, data model, list of pages) and any questions. Wait for my go-ahead.
3. Build in this order, and run the app and test each phase before moving on:
   1. App shell, demo hub, logins and seeded data
   2. Intake Assistant admin side (referrals) and the simulated patient inbox
   3. MyConnectedCare and the digital intake form
   4. AI summary generation and the EMR intake document (with citations)
   5. Nurse help request, nurse inbox and PowerForm (Scenario 2)
   6. Co-op student flow (Scenario 3)
   7. Clinic note, demo reset, polish and end-to-end tests
4. Keep it simple. This is a demo prototype for a class, not production software. When a requirement is unclear, choose the simplest option that keeps the demo flow working, and write down the assumption in `DECISIONS.md`.

## 1. Context

We are a university team (CS497/HLTH480) working with the WRHN Cancer Centre.

**Today:** an oncology nurse phones every new patient 1 to 2 days before their first appointment and fills out a long intake form (a "PowerForm") with them over the phone. This can take a large part of a nurse's day, every week. The oncologist then reads the form and rewrites the medical history into their consultation note.

**Our solution has two parts:**
- **Tech solution:** patients fill out the intake form themselves online. AI turns the answers into a summary for the oncologist, with citations linking every statement back to the patient's raw answers.
- **Non-tech solution:** trained co-op students do the phone intakes instead of nurses, a nurse reviews their work, and there is no AI.

**What this build is for:** a clickable prototype for a peer evaluation (cognitive walkthrough) in class on **Thursday, November 12**.
- Classmates get short scenario cards (for example, "You are a patient who received an email from the Cancer Centre...") and must work out the steps without help.
- The demo runs **locally on one laptop at our table**. Classmates use that laptop, switching between browser tabs for each system.
- There are 3 evaluation rounds, so the demo data must be easy to reset between rounds.
- Because testers get no instructions, the UI must make the next step obvious. Do not add hints that give away the steps.

## 2. Ground rules (important)

- **Synthetic data only.** Seed only fictional patients (for example, "Jane Doe"). Show a thin banner on every page: "Class prototype. Fictional data only. Do not enter real personal health information." The AI feature must only ever receive this fictional data.
- **Not affiliated.** MyConnectedCare and Oracle Health are real systems we are representing. Build our own generic look *inspired by* the attached screenshots (layout and structure), but do not copy logos, trademarks or exact branding. Label screens as "MyConnectedCare (prototype)" and "Oracle Health EMR (prototype)", and include a footer line saying the prototype is not affiliated with WRHN or Oracle.
- **No real email or SMS.** Emails go to a simulated inbox inside the app (see 5.2).
- **Reliable during the demo.** If the AI API fails or no API key is set, fall back to a deterministic, template-based summary so the flow never breaks (see 6.5).

## 3. Architecture

**One web app** that contains **three simulated systems**, plus a patient email inbox and a demo hub. Each system has its own URL, its own login screen and its own visual style, so the systems feel separate.

| Route | System | Who uses it |
|---|---|---|
| `/` | **Demo hub**: three cards (Patient, Nurse/Admin, Doctor) linking to each system. A "Reset demo data" button sits behind a small settings icon. | Team members running the demo |
| `/inbox` | **Patient email inbox (simulated)**, showing the emails received by the logged-in demo patient | Patient |
| `/myconnectedcare` | **MyConnectedCare (prototype)**, the patient portal. Patients only; no nurse or doctor access. | Patient |
| `/intake-assistant` | **Intake Assistant**: a hospital admin and nursing portal. Admins enter referrals, nurses get notifications, nurses (or co-op students) complete the PowerForm, and nurses review co-op intakes. Present it as an ideal all-in-one tool for intake staff. | Admin, Nurse, Co-op student |
| `/intake-assistant/request-help` | Public **"Request a nurse call" form**, linked from the email and from the digital form | Patient (no login) |
| `/emr` | **Oracle Health EMR (prototype)**: patient charts, the intake document (AI summary and raw data) and the clinic note | Nurse, Oncologist |

### Seeded demo accounts

Use simple accounts with passwords stored in seed data, which is fine for a prototype. List them in the README and on the tester scenario cards. Also show a collapsible "Demo credentials" hint under each login form.

- **Patient:** `jane.doe@example.com`. Add 2 or 3 more fictional patients so the nurse inbox and EMR patient list don't look empty.
- **Admin:** `admin@wrhn-demo.ca`
- **Nurse:** `nurse@wrhn-demo.ca`
- **Co-op student:** `coop@wrhn-demo.ca`
- **Oncologist:** `oncologist@wrhn-demo.ca`

MyConnectedCare should also support **sign up**, since the email says "log in or sign up". Allow sign-up only if the email matches an existing referral, and link the new account to that referral.

## 4. Data model (suggested)

- **Referral:** patient name, date of birth, email, phone, first appointment date (date and time), provider group, status. Status is one of: `referral_entered → email_sent → in_progress → submitted | help_requested → nurse_completed | coop_pending_review → in_emr`.
- **Email:** recipient, subject, body (HTML), sent time, linked referral.
- **HelpRequest:** referral, name, DOB, phone, preferred language, best time to call, notes, created time, status (`new | called | completed`).
- **IntakeSubmission:** referral, answers (JSON keyed by stable question IDs), completed by (`patient | nurse | coop_student`), completed-by user, submitted time, list of incomplete fields, review status (for co-op intakes).
- **AISummary:** submission, paragraph sentences (with citations), bullet sections (with citations), flagged and missing items, model used or "template fallback", validation results, generated time.
- **EMRDocument:** patient, type ("Oncology New Patient Intake"), linked submission, linked AI summary (null for co-op intakes), verified-by and verified-at.
- **ClinicNote:** patient, author, and sections: Medical History, Current Medications, Allergies, Social History, Family History, Examination/Assessment, Plan, Follow-up.

## 5. Screens

### 5.1 Intake Assistant: admin side (referrals)

- **Referral form** with these fields: first name, last name, date of birth, email, phone, first appointment date, provider group.
- **Email scheduling:** on save, the system schedules the intake email for 7 days before the appointment.
  - Show the scheduled send date in the referral list.
  - Because we can't wait a week during a demo, add a **"Send intake email now (demo)"** button.
  - Also send immediately if the appointment is 7 days away or less.
- **Referral list** with status chips for each referral.
- This screen is mainly used to *explain* where the email comes from. Scenario cards start from the patient inbox, so the seeded Jane Doe referral must already have an email sent.

### 5.2 Patient email inbox (simulated)

- A simple webmail-style inbox: a list of emails on one side, the open email on the other. Patients log in with the same demo patient account, or pick a patient on the inbox page.
- **The intake email** contains the items below. Use the default draft that follows, and keep the email text in one editable template file so our team can replace the wording later without touching code.
  - Near the **top**, in large bold text, the option to have a nurse call them instead: a button or link to "Prefer to do this over the phone? Request a nurse call." This came directly from peer feedback, so it must not be buried at the bottom.
  - Step-by-step instructions: (1) click the link to log in or sign up for MyConnectedCare, (2) click **Questionnaires** on the left, (3) click **Start Intake Form**.
  - A button linking to MyConnectedCare.
  - A link to an **example completed form** (see 5.3).
  - A reminder to **bring an official list of current medications** to the appointment.
  - A due date: please complete before the appointment.

**Default email draft:**
> Subject: Action needed: Complete your new patient intake form before your appointment on {date}
>
> Hello {first name},
>
> Your first appointment at the Cancer Centre is on {date, time}. Before then, please complete your new patient intake form online. It takes about 20 to 30 minutes and you can save and come back later.
>
> **Prefer to do this over the phone?** [Request a nurse call] and a nurse will call you 1 to 2 days before your appointment.
>
> How to complete the form online: 1) Click the button below to log in or sign up for MyConnectedCare. 2) Click "Questionnaires" on the left. 3) Click "Start Intake Form".
>
> [Open MyConnectedCare]
>
> Not sure how to answer? [See an example of a completed form]
>
> Please bring an official list of your current medications to your appointment.

### 5.3 MyConnectedCare (patient portal)

**Layout:** model it on the attached MyConnectedCare screenshot, with a left navigation and a main panel. Navigation items: Home, Questionnaires, Appointments (read-only list), Messages (placeholder).

- **Questionnaires page:** a card for "Oncology New Patient Intake" with its status and a **Start Intake Form** button (or Continue / View submitted).
- **The intake form:**
  - **Multi-step layout**, one section per step, with a progress bar and section names.
  - **Autosave**, with "Save and finish later".
  - **A persistent "Need help? Request a nurse call" control** at the top of every step, floating or sticky, as peer feedback asked for. It opens the help request form with the patient's details pre-filled and marks the referral `help_requested`.
  - **An example answer under each question,** in italics (for example, *"Example: Metformin 500 mg, twice a day"*), plus a link to a full example completed form.
  - **Read-aloud and voice input:** a toggle that reads each question aloud (Web Speech API `speechSynthesis`) and a microphone button on text fields for voice-to-text (`SpeechRecognition`, where the browser supports it).
    - Hide the microphone gracefully when it isn't supported.
    - Show a small note that patients should check voice-entered medication names, since accents can cause speech recognition errors with medication names (feedback from our community partner).
  - **Conditional logic,** for example gynecological and pregnancy questions only when relevant, and "Name of clinical trial" only if they answered yes to being in one.
  - **Review step before submit:** list every unanswered or incomplete question with a link back to it. Patients may still submit with gaps; those fields are recorded as `incomplete` and flagged later.
  - **Completion screen:** "Thank you, your intake form has been sent to your care team." Nothing else to do.
- **Larger font and high contrast by default.** Many patients are older adults. The patient side must also work well on a phone.

### 5.4 Request a nurse call (public form)

- **Fields:** name, date of birth, phone number, preferred language, best time to call, optional note. Pre-fill these when opened from inside the portal.
- **After submitting:** "Thanks. A nurse will call you 1 to 2 days before your appointment on {date} to complete your intake over the phone."
- **Effect:** creates a **notification** in the nurse inbox in Intake Assistant.

### 5.5 Intake Assistant: nurse side

- **Inbox / notifications:** a list of help requests showing patient, appointment date, phone, preferred language, request time and status. Include an unread badge.
- **Opening a request** shows the patient details and a **Start PowerForm** button.
- **PowerForm:** the same intake questions, laid out as a dense single-page clinical form (staff are fast with dense forms) and embedded inside Intake Assistant.
  - Pre-fill the patient details.
  - On submit, `completed_by = nurse`, and the same AI summary pipeline runs (section 6), sending the result to the EMR.
  - The help request is marked `completed`.
- **Upcoming intakes list:** all referrals with appointment dates and status. A nurse can see who has completed the form online, who requested a call and who hasn't done anything yet.

### 5.6 Intake Assistant: co-op student flow (non-tech solution)

- **Co-op students log in to Intake Assistant** and see the upcoming intakes list. They can open any patient and complete the **PowerForm** (as if over the phone).
  - On submit, `completed_by = coop_student`, and the submission goes to a **"Pending nurse review"** queue. **No AI summary is generated for co-op intakes.**
- **Nurses see the review queue.** They open the intake, make corrections if needed, and click **Approve and send to EMR** (or Return to student with a comment).
- **In the EMR,** a co-op intake document shows **raw form data only**, with a clear label: "Completed by co-op student {name}, reviewed by RN {name} on {date}".

> This review flow is confirmed by the team: student completes the PowerForm, it goes to the nurse review queue, the nurse approves, and the EMR shows raw data only, labelled with who completed it and who reviewed it.

### 5.7 Oracle Health EMR (prototype)

**Layout:** model it on the attached EMR chart screenshot and the whiteboard sketch.
- A patient banner across the top (for example, "Doe, Jane", DOB, MRN (fake), allergies).
- A left menu with **Documents** and **Clinic Notes**.
- A patient list or search screen after login.

**Intake document:** one document per intake, titled "Oncology New Patient Intake", with three parts in this order.
1. **AI Summary (paragraph):** a short History of Present Illness style narrative (see the HPI section of the attached sample write-up).
2. **AI Summary (point form):** the *same information* as the paragraph, grouped under headings: Reason for referral / chief complaint, Medical history, Procedures / surgeries, Current medications, Allergies, Social history, Family history, Functional status / symptoms, Psychosocial, Advance care planning, Flagged / missing items.
3. **Raw Form Data:** every question and answer, grouped by section, with each answer having its own anchor.

**Citations:**
- Every sentence and bullet in the summary ends with small numbered citation chips, for example [3].
- **Clicking a citation scrolls to the raw answer and highlights it** for about 2 seconds. Hovering shows the question and answer in a tooltip.
- Sentences that fail validation (see 6.4) are **highlighted in amber** with the tooltip "Not linked to a patient answer. Please verify."
- Incomplete answers are listed under "Flagged / missing items".

**Header and actions:**
- A header line shows who completed the form (patient online, nurse by phone, or co-op student), when, and whether the summary came from the AI model or the template fallback.
- A **Mark as verified** button, available to nurses and oncologists, records name and time. The AI summary is a draft until a clinician has checked it.
- A **Copy to clinic note** button, plus a copy icon on each section.

**Clinic Notes tab:**
- A consultation note editor with these headings in order: **Medical History, Current Medications, Allergies, Social History, Family History, Examination/Assessment, Plan, Follow-up**, plus Date and Oncologist at the top.
- "Copy to clinic note" pastes the matching summary sections into Medical History, Current Medications, Allergies, Social History and Family History. Leave the citation markers out of the pasted text.
- The oncologist can edit and save. Layout reference: the attached example clinic note image.

## 6. AI summary pipeline

### 6.1 Trigger

Runs on the server when a submission with `completed_by` set to `patient` or `nurse` is submitted. It never runs for `coop_student`.

### 6.2 Model and settings

- **Use OpenRouter.** It has an OpenAI-compatible API at `https://openrouter.ai/api/v1`, so you can use the OpenAI SDK with a custom `baseURL`.
  - Read the key from `OPENROUTER_API_KEY` and the model ID from `AI_MODEL`, so we can swap models without code changes. Put both in `.env.example`.
  - Pick a capable default model that supports JSON output, and tell me which one you chose.
- Keep the API key server-side only. It must never reach the browser.
- **Validate the output yourself,** because JSON-schema support varies between models on OpenRouter.
  - Ask for JSON matching the schema below (use `response_format` with a JSON schema where the chosen model supports it).
  - Parse and validate the response with a schema library such as zod.
  - If validation fails, retry once. If it fails again, use the fallback (6.5).
- Use a low temperature.
- OpenRouter passes requests to third-party model providers. This is another reason the app must only ever handle fictional data.

### 6.3 Input and output

**Input:** a list of `{field_id, section, question, answer}` for **non-empty answers only**, plus the list of incomplete fields.

**Output schema (example):**
```json
{
  "paragraph": [ { "text": "Ms. Doe is a 58-year-old woman referred for newly diagnosed ...", "citations": ["gi_chief_complaint", "gi_provider_group"] } ],
  "sections": [
    { "heading": "Current medications", "bullets": [ { "text": "Metformin 500 mg twice daily", "citations": ["ch_medication_history"] } ] }
  ],
  "flagged": [ { "field_id": "ch_allergies", "note": "Not answered" } ]
}
```

**Prompt rules to give the model:**
- Use only information in the provided answers. Never infer diagnoses, dates, doses or history that are not stated.
- Every sentence and bullet must cite at least one `field_id` that supports it.
- Copy medication names, doses, dates and numbers exactly as written.
- Use neutral, factual clinical language. No judgmental or loaded wording about the patient (for example, never "non-compliant", "difficult", "poor historian").
- If something is unclear or missing, put it in `flagged` instead of guessing.
- Write the paragraph in HPI style, with the point-form sections holding the same facts.

### 6.4 Validation (runs on the server after the model responds; this is a key feature)

- **Citation check:** every cited `field_id` must exist in the submission and have a non-empty answer.
- **Number and date check:** any number or date in a sentence (doses, years, ages) must appear in the text of at least one of its cited answers.
- **Fail handling:** any sentence or bullet with no valid citation, or that fails the number and date check, is marked `unsupported`. It is shown in amber, not removed.
- Store the validation results. Add unit tests for the validator.

### 6.5 Fallback

If the API call fails or times out (around 20 seconds), or no key is set, build a template summary straight from the answers.
- One bullet per answered key field, each citing its own field.
- A simple templated paragraph.
- Mark it as "Template summary (AI unavailable)".

## 7. Scenarios (acceptance criteria)

These must work end to end, starting from a fresh reset.

### Scenario 1: patient completes the form online (tech solution)
1. Patient opens `/inbox` and sees the intake email.
2. Clicks the link, then logs in or signs up for MyConnectedCare.
3. Goes to Questionnaires and clicks **Start Intake Form**.
4. Completes the form (with optional read-aloud or voice), sees the review step, and submits.
5. Sees the completion screen.
6. The summary is generated, and the document appears in the EMR.
7. The oncologist logs in to the EMR and opens Jane Doe. They can see the intake document, click citations that jump to the raw answers, and see flagged items.
8. The oncologist clicks **Mark as verified**, then **Copy to clinic note**, edits the note and saves.

### Scenario 2: patient requests a nurse call (tech solution)
1. Patient requests a nurse call, either from the link in the email or from the button inside the form.
2. Patient sees the confirmation screen.
3. The nurse logs in to Intake Assistant and sees a new notification.
4. The nurse opens it, clicks **Start PowerForm**, completes it and submits.
5. The same AI summary pipeline runs and the document appears in the EMR.
6. The oncologist (or nurse) reviews it as in Scenario 1.

### Scenario 3: co-op student completes the intake (non-tech solution)
1. The co-op student logs in to Intake Assistant, opens an upcoming patient, completes the PowerForm and submits.
2. The submission goes to the nurse review queue.
3. The nurse approves it.
4. The EMR shows a raw-data-only document labelled with who completed and who reviewed it. **No AI summary.**

### Demo reset
"Reset demo data" restores all seed data and statuses, so each of the 3 evaluation rounds starts clean. Provide it in the demo hub and as a script.

## 8. Intake form content

- **Build a shortened demo version of the form,** about 15 to 25 questions in total, so a tester can finish it in about 5 minutes.
  - The full WRHN category list is in **Appendix A** for reference.
  - Define the questions in a single config file (`intakeQuestions.ts` or JSON) with stable `field_id`s, so we can edit wording or add more questions later without touching code.
- **Use this subset:**
  - **About you:** preferred name, preferred spoken language, preferred way to be contacted, any hearing, vision or other sensory needs (and devices used), whether they are the main caregiver for someone (and whether arrangements are made), and whether they are in a clinical trial (and which one).
  - **Allergies:** what they're allergic to and what happens.
  - **Current medications:** a repeatable list of name, dose and how often. Remind them to bring their official medication list.
  - **Main concern and symptoms:** what brings them in, pain (where and how bad, on a 0 to 10 scale), and other symptoms (a checklist covering general, breathing/heart, stomach/bowel and bladder symptoms).
  - **Medical history:** past and current health conditions.
  - **Surgeries and procedures:** a repeatable list of what and when.
  - **Family history:** a repeatable list of relative and condition.
  - **Lifestyle:** tobacco, alcohol, living situation (who they live with, any help at home) and work or school.
  - **Planning ahead:** whether they have an advance care plan, and their substitute decision-maker's name and relationship.
  - **How you've been feeling:** the two 12-month mood screening questions in Appendix A.
  - **Care partner and pharmacy:** care partner name and phone, and primary pharmacy name and phone.
- **Question wording:** write the questions and example answers yourself, in plain language (around a grade 6 to 8 reading level). Our Health Sciences teammates will review and may replace the wording later, so keep it all in the config file and add a comment at the top of that file saying "DRAFT wording: pending Health Sciences review".
- **Vital signs** (temperature, heart rate, SpO2, etc.) can't be measured by patients at home, so leave them out of the patient form. The nurse and co-op PowerForm uses the same subset, plus an optional "Vital signs (to be measured at visit)" section.
- **Question types:** text, long text, yes/no, single and multi select, date, and a repeatable list (for medications, surgeries and family history).
- **Example completed form:** generate a fully filled example for a fictional patient and show it as a read-only page linked from the email and the form.
- **Seed data:** also seed one fully completed online submission for a second fictional patient, so the EMR already has one finished example before any scenario runs.

## 9. Non-functional requirements

- The patient side is responsive and works on a phone. Staff sides can be desktop-first.
- **Accessibility:** large tap targets, labels on all inputs, keyboard navigation, focus states, and contrast meeting WCAG AA.
- Each system gets a distinct visual identity, so testers can tell they've moved to a different system. The patient portal is friendly and calm. Intake Assistant is a clean admin tool. The EMR is dense and clinical, in the style of an EMR.
- Show a loading state while the summary is generated ("Your care team's summary is being prepared"). On the EMR side, show the summary as soon as it's ready.

## 10. Tech stack (default; tell me if you'd change it)

- **Next.js (App Router)** with TypeScript, Tailwind CSS and a component library such as shadcn/ui.
- **Database:** Prisma with SQLite, a single local file. No hosted database needed.
- **Runs locally on one laptop** (`npm run dev` or `npm start`). No deployment needed. Make sure it works offline except for the AI call, and that the template fallback covers the case where the venue Wi-Fi is down.
- **AI:** the OpenAI SDK pointed at OpenRouter (see 6.2), called only from a server route.
- **Testing:** Playwright end-to-end tests covering Scenarios 1 to 3, plus unit tests for the citation validator.

## 11. Deliverables / definition of done

- The app runs locally with one command, after copying `.env.example` and running a seed script.
- All three scenarios pass as Playwright tests, and I have also clicked through them manually.
- Demo reset works.
- `README.md` covers: setup, environment variables, demo accounts, the URLs for each system, and how to reset.
- `TESTER_SCENARIOS.md` holds three short scenario cards for classmates. Each gives a role, a goal and the login details, with **no step-by-step instructions**. Example: "You are Jane Doe. You just received an email from the Cancer Centre about your first appointment. Do what the email asks." Also include the expected action sequence for each scenario, for us (the hosts) to compare against.
- `DECISIONS.md` lists any assumptions you made.

## 12. Out of scope

- Real email or SMS sending.
- Real integration with MyConnectedCare, Oracle Health or Cerner (FHIR, etc.).
- Production-grade authentication, real patient data and HIPAA/PHIPA compliance work. Just keep the API key server-side and keep the synthetic-data banner.
- A WaterlooWorks job posting page. The co-op job posting is a separate document, not part of this app.
- Analytics and admin settings beyond what's described here.

## 13. Attachments I'm including

1. **Whiteboard workflow sketch** (photo): the patient view (email, MyConnectedCare login, intake form with a "Need help? Click this box" checkbox, complete and not-complete screens), the doctor view (EMR with AI Summary on top and Raw Form Data below, then a Consultation Note with the AI summary pasted under Medical History and Medications) and the non-tech co-op section. The sticky notes are classmate feedback: they liked the nurse-call option for older adults and for people who can't complete the form.
2. **MyConnectedCare screenshot** (patient view): use it as the layout reference for the patient portal.
3. **EMR patient chart screenshot:** the layout reference for the EMR.
4. **Example clinic note:** the layout reference for the Clinic Notes tab.
5. **Sample medical write-up (PDF or pasted HPI section):** the style reference for the AI paragraph summary.

## Appendix A: WRHN oncology intake form categories (from our community partner)

**General Information:** Type of Visit; Provider Group (hematology, medical oncology, radiation oncology, etc.); Mode of Visit (in-person, phone, virtual); Chief Complaint; Preferred Spoken Language; Preferred Mode of Communication; Sensory Deficits; Sensory Devices Needed; Sensory Devices at Bedside; Preferred Name; Admission info given by; Pregnancy Status; Breastfeeding Status; Are you the primary caregiver for someone else?; Are arrangements made for the care of that person?; In a clinical trial?; Name of clinical trial if known; Do you have any pets at home?; Are arrangements made for the care of your pets?

**Vital Signs:** Temperature; Heart rate; Respiratory rate; Blood pressure; SpO2; Weight; Height.

**Clinical History:**
- **Allergies.**
- **Medication History.**
- **Subjective Assessment:** Pain; General symptoms; Activity tolerance; Cardiopulmonary symptoms; Gastrointestinal symptoms; Genitourinary symptoms; (others).
- **Advance Care Planning:** Advance care plan?; Substitute decision maker.
- **Problem History (medical history).**
- **Procedure History (surgeries, etc.).**
- **Social History:** Tobacco; Alcohol; Substance use; Nutrition; Exercise/sleep; Home/living situation; Health/environmental risks; Employment/school; Psychosocial; Sexual; Other.
- **Gynecological History:** Menarche onset; Menstrual status; Last menstrual period (date); Approximate last menstrual period (free text); Last menstrual period description (normal/abnormal); Length of menstruation; Last normal menstrual period (date); Age of menopause; Menstrual history comment; Pregnancy status; Patient-stated estimated due date; Gravida; Para; Miscarriages; Therapeutic abortions.
- **Family History.**
- **Psychosocial/Spiritual Assessment:**
  - Spiritual: Do you identify with a particular faith group or traditional culture?; Which one?; Any spiritual, religious or cultural needs important for your care?
  - Psychosocial: In the past 12 months, have you had a time when you felt sad, blue, depressed or down most of the time for at least two weeks? Or, in the past 12 months, have you had a time, lasting at least 2 weeks, when you didn't care about or enjoy the things you usually do?

**Screening and Specialty Assessments:** Oncology nutrition; Transfusion reactions; Infectious disease screening.

**Contact Information:** Contact information; Care partners; Primary pharmacy; Secondary pharmacy; External lab details; External medical imaging details; Insurance details.

**MRI and CT Questions:** MRI/CT screening questions.
