# AI-Assisted Patient Intake: class prototype

Clickable prototype for the CS497/HLTH480 peer evaluation (cognitive walkthrough). One local web app that contains three simulated systems, a simulated patient email inbox and a demo hub.

> Class prototype. Fictional data only. Not affiliated with WRHN, Oracle Health or MyConnectedCare.

## Setup (one time)

Needs Node.js 20 or newer.

```bash
npm install            # also generates the Prisma client
cp .env.example .env   # add your OpenRouter key here (optional)
npm run setup          # creates the SQLite database and loads demo data
npm run dev            # http://localhost:3000
```

After the first time, `npm run dev` is all you need.

For the demo day you can also run a production build, which is faster: `npm run build` then `npm start`.

## Environment variables (`.env`)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | SQLite file. Default `file:./dev.db` (stored at `prisma/dev.db`). |
| `OPENROUTER_API_KEY` | OpenRouter key, used only on the server. Leave empty to always use the template summary. |
| `AI_MODEL` | Any OpenRouter model ID with JSON output. Default `openai/gpt-4.1-mini`. |
| `DISABLE_LOGIN` | `"true"` (demo mode) skips most password screens: the EMR opens as the oncologist, and Intake Assistant shows one-click "Continue as Admin / Nurse / Co-op student" buttons ("Switch role" in the header goes back to them). The patient inbox always asks which patient you are. `"false"` requires all the logins below. Restart `npm run dev` after changing it. |

If the key is missing, the call fails, it takes more than 20 seconds, or the output fails validation twice, the app uses a template summary built straight from the answers, labelled "Template summary (AI unavailable)". The demo never breaks if the Wi-Fi is down.

## URLs

| URL | System |
|---|---|
| `/` | Demo hub (reset button behind the gear icon) |
| `/inbox` | Patient email inbox (simulated) |
| `/myconnectedcare` | MyConnectedCare (prototype), patient portal |
| `/myconnectedcare/example` | Example completed form (public) |
| `/intake-assistant` | Intake Assistant: admin, nurse and co-op student portal |
| `/intake-assistant/request-help` | Public "Request a nurse call" form |
| `/emr` | Oracle Health EMR (prototype) |

## Demo accounts

Password for every account: **`password`**

| Role | Email | Systems |
|---|---|---|
| Patient | `jane.doe@example.com` | Inbox, MyConnectedCare |
| Patient (no portal account yet, can sign up) | `robert.chen@example.com` (DOB 1960-11-21) | Inbox, MyConnectedCare sign up |
| Admin | `admin@wrhn-demo.ca` | Intake Assistant |
| Nurse | `nurse@wrhn-demo.ca` | Intake Assistant, EMR |
| Co-op student | `coop@wrhn-demo.ca` | Intake Assistant |
| Oncologist | `oncologist@wrhn-demo.ca` | EMR |

Each system has its own login, so you can be logged in as the patient in one tab and the nurse in another.

**Any referred patient** can sign in to the inbox with their email and `password`, including patients the admin just entered. The **Open MyConnectedCare** button in the intake email signs that patient straight in to the portal (creating their account if needed), so there is no second login.

### Running the form again without a reset

1. Intake Assistant → Admin → **+ New referral**. Use a new email (e.g. `demo2@example.com`) and an appointment within 7 days, so the email is sent right away (otherwise click **Send intake email now (demo)**).
2. Inbox → **Sign out** → sign in as that email with `password`.
3. Open the email → **Open MyConnectedCare** → you are in that patient's portal with a fresh form.

Seeded patients: Jane Doe (email sent, nothing started), Margaret Wilson (completed online, already in the EMR with a summary), Robert Chen (email sent, no portal account), Ahmed Hassan (asked for a nurse call earlier, already called), Linda Nguyen (referral just entered, email not sent yet). Appointment dates are relative to the day you reset.

## Resetting between rounds

- In the app: open `/`, click the gear icon, click **Reset demo data**. This also logs everyone out.
- From a terminal: `npm run reset` (works while the app is running).

Close the other tabs (or reload them) after a reset.

## Tests

```bash
npm test             # unit tests for the citation validator
npm run test:e2e     # Playwright: main scenarios, signup, nurse-call paths, voice controls, demo shortcuts and reset
```

First time only, Playwright needs a browser: `npx playwright install chromium`. The e2e tests reset the demo data.

## Where to edit things

| What | File |
|---|---|
| Intake questions, examples, conditional logic | `src/config/intakeQuestions.ts` |
| Intake email wording | `src/content/intakeEmail.ts` |
| Example completed form | `src/content/exampleForm.ts` |
| Seed data | `src/lib/seed.ts` |
| AI prompt and model call | `src/lib/ai/summarize.ts` |
| Citation validator | `src/lib/ai/validate.ts` |
| Template fallback summary | `src/lib/ai/fallback.ts` |

## Tech

Next.js 15 (App Router) with TypeScript and Tailwind CSS, Prisma with SQLite, the OpenAI SDK pointed at OpenRouter, zod, Vitest and Playwright.

## Hosting it for free (Render)

1. Sign in at https://render.com with GitHub.
2. **New > Blueprint**, pick the `Intake-helper` repo, and paste your OpenRouter key when asked.
3. Render builds the app and gives you a link like `https://intake-helper.onrender.com`.

The free plan sleeps after about 15 minutes with no visitors (the first visit then takes about a minute)
and restarts with fresh demo data each time it wakes. Settings live in `render.yaml`.
Set a monthly spending limit on your OpenRouter key, since anyone with the link can trigger AI calls.
