# Decisions and assumptions

Where the brief was unclear, I chose the simplest option that keeps the demo working.

## Process
- The brief asked for a plan and a go-ahead first. Aryan's request was to build it, so I built it in one pass and listed the plan in the project thread.
- Only the whiteboard wireframe was attached. The MyConnectedCare screenshot, EMR chart screenshot, example clinic note and sample write-up were not, so those layouts follow the brief's descriptions (left nav + main panel; EMR patient banner + left menu; clinic note headings in the given order; HPI-style paragraph).

## Stack
- Next.js 15 App Router, TypeScript, Tailwind CSS 3, Prisma 6 + SQLite, OpenAI SDK pointed at OpenRouter, zod, Vitest, Playwright.
- No shadcn/ui: a handful of hand-written components keeps installs small and avoids a code generator.
- No web fonts (system fonts only), so the app works fully offline except for the AI call.
- Default model `openai/gpt-4.1-mini`: supports strict JSON-schema output, fast, cheap. Change with `AI_MODEL`.

## Auth and accounts
- Prototype auth: each system stores the logged-in user id in its own cookie (`proto_mcc`, `proto_ia`, `proto_emr`, `proto_inbox`), so each system has a separate login. Passwords are plain text in seed data (fine for a class demo). All passwords are `password`.
- All passwords are `password` (Aryan's request, 2026-11-08).
- The intake email's **Open MyConnectedCare** button goes to `/myconnectedcare/open?ref=<referral id>`, which signs that patient in to the portal (creating their account with password `password` if needed). This saves a second login during the demo. Signing in to the inbox as a different patient signs the portal out, so the portal follows the inbox patient.
- The simulated mail inbox accepts any referred patient's email with `password`, even before they have a MyConnectedCare account, because a real person has email before they sign up for the portal.
- Jane Doe already has a MyConnectedCare account (so testers can follow the card's login details). Robert Chen has no account, to demo **Sign up**. Sign-up requires an email that matches a referral and the matching date of birth, and links the account to that referral.
- The nurse account works in both Intake Assistant and the EMR. The admin and co-op accounts work only in Intake Assistant; the oncologist only in the EMR.

- `DISABLE_LOGIN="true"` (demo mode, on by default in `.env.example`) skips password screens. The inbox still asks which patient you are, so each round can use a different patient. Systems with one obvious user default to that user (portal: the patient signed in to the inbox, else Jane Doe; EMR: Dr. Santos, with "Switch user" to pick the nurse). Intake Assistant has three roles, so it shows one-click role buttons instead. The Playwright tests run with the flag off so the real login screens stay covered.

## Email
- The email template lives in `src/content/intakeEmail.ts`. It is rendered when the email is "sent" and stored, so editing the template affects new emails (reset the demo to regenerate seeded ones).
- Links in the email open in a new tab, like real webmail.
- "Request a nurse call" in the email includes the referral id, so the help form is pre-filled. Without it, the form matches a referral by date of birth and last name.
- Emails are scheduled for 7 days before the appointment. There is no background job; the referral list shows the scheduled date and has **Send intake email now (demo)**. Referrals with an appointment 7 days away or less are sent on save.

## Intake form
- 10 patient sections, about 25 visible questions (more appear through conditional logic). Wording is a draft, marked "pending Health Sciences review" in the config file.
- Added "What sex were you assigned at birth?" so the pregnancy / breastfeeding question can be conditional (the brief's gynecological example). Full gynecological history was left out to keep the form short.
- Repeatable lists (medications, surgeries, family history) have a "none" checkbox, so "I don't take any medications" counts as an answer and is not flagged.
- Required = every visible, non-optional question. Preferred name and the vitals are optional. Unanswered required questions are stored as `incompleteFields` and listed under Flagged / missing items.
- Autosave runs about 1 second after each change. "Save and finish later" saves and returns to Questionnaires.
- Read aloud: when the toggle is on, each question is read when you move into it, and each question gets a Listen button. The microphone uses the browser's speech recognition where it works (Chrome, Edge, Safari). In Brave, Firefox, or when that service fails, it records audio and sends it to `/api/transcribe` (OpenRouter, `TRANSCRIBE_MODEL`, needs `OPENROUTER_API_KEY`). A note reminds patients to check voice-entered medication names.
- The patient portal uses an 18px base font and high-contrast colours.
- The nurse / co-op PowerForm uses the same questions plus an optional "Vital signs (to be measured at visit)" section. If the patient had started the online form, the PowerForm is pre-filled with those answers. The language from a nurse-call request is pre-filled too.

## AI summary
- Runs in the background (Next.js `after()`) right after a patient or nurse submits, so the patient sees the thank-you screen immediately. The EMR document shows "Your care team's summary is being prepared…" and refreshes every 2 seconds until it is ready.
- Referral details (name, DOB, age, provider group, appointment) are added to the raw data as a "Patient details (from referral)" section, so statements like "a 59-year-old woman referred to Medical Oncology" have something to cite.
- Attempt 1 uses `response_format: json_schema` (strict). If the response doesn't parse or pass zod, attempt 2 asks for plain JSON. If that fails too, or the API errors or times out (20 s), the template fallback is used.
- Any incomplete field the model forgets to flag is added to `flagged` automatically.
- Validation: citations must point to fields with non-empty answers (invalid ones are dropped from the chips and recorded). Every number in a statement must appear in its cited answers ("7/10" matches "7 out of 10"; "5" does not match "500"). Failing statements are kept, highlighted amber, with the tooltip "Not linked to a patient answer. Please verify."
- Margaret Wilson's seeded summary is pre-written (labelled "Seeded demo summary"), so the EMR has a finished example without an API call. It includes one deliberately unsupported bullet ("2 cm mass") to show the amber highlight.

## EMR
- Citation numbers follow the order of the raw form data, so [14] is the 14th row.
- "Mark as verified" is shown only for documents with an AI summary. Co-op documents are already reviewed by a nurse.
- "Copy to clinic note" fills Medical History (HPI paragraph + medical history + procedures), Current Medications, Allergies, Social History and Family History, without citation markers, and leaves the other sections alone. Clicking it again overwrites those five sections. For co-op documents it copies the raw answers instead (no AI involved).
- One clinic note per patient.
- The banner allergy line comes from the latest intake in the chart.

## Co-op flow
- Co-op submissions go to the nurse's "Co-op review queue". The nurse can edit answers, then **Approve and send to EMR** or **Return to student** (comment required). Returned intakes appear under the student's "My submitted intakes" with a "Fix and resubmit" button.
- The patient status chip shows "Co-op: pending review", then "In EMR" after approval.

## Reset
- `seedDemo()` deletes all rows and re-inserts the seed data. It is used by `npm run setup`, `npm run reset`, the hub button and `POST /api/reset` (used by the tests). The hub button also clears all prototype login cookies.
- Appointment dates are relative to the moment of reset (Jane: 6 days out at 10:00, so her email was "sent" yesterday).

## v2 changes (team feedback, Nov 8 doc and Nov 9 call)
- Sensory needs and health conditions are now a Yes / No question, then a pick list (checkboxes, not a dropdown, so older patients can see every choice at once) and an optional free-text box.
- "Medicine" is now "medication" everywhere on the form.
- Removed the substitute decision-maker questions (not legally binding on an intake form). The emergency contact question covers who to call. The advance care plan question stays, with an "i" button that explains what it is.
- Mood questions now ask how often in the past month (Not at all / Several days / More than half the days / Nearly every day), like a PHQ-2.
- "Demo: fill in randomly" on the patient form and the PowerForm fills every blank question with believable answers. Answers already typed are kept.
- AI point-form summary has a "Copy all points" button. Copy buttons fall back to a non-clipboard-API copy when the page is opened over plain http (e.g. a second laptop on the same Wi-Fi).
- The "Open MyConnectedCare" email button now redirects with a relative URL. Before, it redirected to localhost, which failed on a teammate's laptop through the Cloudflare tunnel.
