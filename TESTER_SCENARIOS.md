# Tester scenario cards

Print or show one card per tester. Do not give extra instructions. All passwords are `password`.

If `DISABLE_LOGIN="true"` is set in `.env`, only the patient inbox asks for a password: the EMR opens as the oncologist and Intake Assistant asks testers to click their role. The **Open MyConnectedCare** button in the email always signs the patient in to the portal, so there is no portal login step.

To give each tester a fresh patient, have the admin enter a new referral (appointment within 7 days) and put that email on the card instead of Jane's.

---

## Card 1: Patient (online form)

**You are Jane Doe.** You just received an email from the Cancer Centre about your first appointment. Do what the email asks.

- Your email login: `jane.doe@example.com` / `password`
- Start in the browser tab called **Mail**.

---

## Card 2: Patient (prefers the phone), then Nurse

**Part A. You are Jane Doe.** You received an email from the Cancer Centre asking you to fill out a form online. You are not comfortable with computers and would rather do it over the phone.

- Your email login: `jane.doe@example.com` / `password`
- Start in the browser tab called **Mail**.

**Part B. You are Priya, a nurse at the Cancer Centre.** Check whether any patients need your help with their intake, and complete what they need. (Pretend you are on the phone with the patient and make up reasonable answers.)

- Intake Assistant login: `nurse@wrhn-demo.ca` / `password`

---

## Card 3: Co-op student, then Nurse

**Part A. You are Jordan, a co-op student working in the Cancer Centre intake team.** Complete the intake for Linda Nguyen, who has an upcoming appointment. (Pretend you are on the phone with her and make up reasonable answers.)

- Intake Assistant login: `coop@wrhn-demo.ca` / `password`

**Part B. You are Priya, a nurse.** Check the intakes that co-op students have done and send them on if they look right.

- Intake Assistant login: `nurse@wrhn-demo.ca` / `password`

---

## Card 4 (optional, after Card 1 or 2): Oncologist

**You are Dr. Santos, an oncologist.** You are seeing Jane Doe for the first time. Review her intake information, check that it is accurate, and start your consultation note.

- EMR login: `oncologist@wrhn-demo.ca` / `password`

---

# Expected action sequences (for hosts only)

### Scenario 1 (Card 1, then Card 4)
1. Mail: sign in, open "Action needed: Complete your new patient intake form…".
2. Click **Open MyConnectedCare** (opens a new tab).
3. (Signed in to the portal automatically.)
4. Click **Questionnaires** on the left, then **Start Intake Form**.
5. Answer questions step by step (optional: Read questions aloud, microphone). Click **Next** through the steps.
6. Review step lists unanswered questions; click **Send to my care team**.
7. Sees "Thank you, your intake form has been sent to your care team."
8. EMR (Card 4): log in, click **Doe, Jane**, open **Oncology New Patient Intake**.
9. Click a citation chip like [14]: the page scrolls to the raw answer and highlights it. Hover a chip to see the question and answer. See **Flagged / missing items**.
10. Click **Mark as verified**, then **Copy to clinic note**. Edit the note (e.g. Plan) and click **Save note**.

### Scenario 2 (Card 2)
1. Mail: open the intake email, click **Request a nurse call** near the top (new tab). Alternative: from inside the form, click **Need help? Request a nurse call**.
2. Check pre-filled name, DOB, phone; add language and best time; click **Request a nurse call**.
3. Sees "Thanks. A nurse will call you 1 to 2 days before your appointment on …".
4. Intake Assistant: log in as nurse; lands on **Notifications** with an unread badge.
5. Click **Nurse call requested: Jane Doe**, then **Start PowerForm**.
6. Fill the dense form; click **Submit and send to EMR**.
7. (Optional) EMR: the document shows "Completed by a nurse by phone" with the AI summary and citations.

### Scenario 3 (Card 3)
1. Intake Assistant: log in as co-op student; **Upcoming intakes** opens.
2. Click **Nguyen, Linda**, then **Start PowerForm**.
3. Fill the form; click **Submit for nurse review**. Sees "sent to the nurse review queue".
4. Log out (top right), log in as nurse; click **Co-op review queue** (badge shows 1).
5. Open **Nguyen, Linda**; correct anything; click **Approve and send to EMR**.
6. (Optional) EMR: Linda's document shows "Completed by co-op student Jordan Lee, reviewed by RN Priya Patel on …" and raw data only, no AI summary.

**Between rounds:** demo hub (`/`) → gear icon → **Reset demo data**, then reload the open tabs.
