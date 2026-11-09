"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { clearSession, login, quickLogin, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendIntakeEmail, SEVEN_DAYS } from "@/lib/email";
import { approveCoopIntake, runSummary, submitIntake } from "@/lib/pipeline";
import type { Answers } from "@/lib/answers";

export async function iaLogin(_: string | null, fd: FormData) {
  const err = await login("ia", String(fd.get("email") || ""), String(fd.get("password") || ""));
  if (err) return err;
  redirect("/intake-assistant");
}

export async function iaQuickLogin(email: string) {
  await quickLogin("ia", email);
  redirect("/intake-assistant");
}

export async function iaLogout() {
  await clearSession("ia");
  redirect("/intake-assistant/login");
}

export async function createReferral(_: string | null, fd: FormData) {
  await requireUser("ia", ["admin", "nurse"]);
  const get = (k: string) => String(fd.get(k) || "").trim();
  const required = ["firstName", "lastName", "dob", "email", "phone", "appointmentAt", "providerGroup"];
  if (required.some((k) => !get(k))) return "Please fill in every field.";
  const appt = new Date(get("appointmentAt"));
  if (isNaN(appt.getTime())) return "Please enter a valid appointment date and time.";
  const count = await prisma.referral.count();
  const ref = await prisma.referral.create({
    data: {
      firstName: get("firstName"),
      lastName: get("lastName"),
      dob: get("dob"),
      email: get("email").toLowerCase(),
      phone: get("phone"),
      appointmentAt: appt,
      providerGroup: get("providerGroup"),
      mrn: String(7000101 + count + Math.floor(Math.random() * 100)),
      emailScheduledAt: new Date(appt.getTime() - SEVEN_DAYS),
    },
  });
  // Send right away if the appointment is 7 days away or less.
  if (appt.getTime() - Date.now() <= SEVEN_DAYS) await sendIntakeEmail(ref.id);
  redirect("/intake-assistant/referrals?created=" + ref.id);
}

export async function sendEmailNow(referralId: string) {
  await requireUser("ia", ["admin", "nurse"]);
  await sendIntakeEmail(referralId);
  revalidatePath("/intake-assistant/referrals");
}

export async function setHelpStatus(id: string, status: string) {
  await requireUser("ia", ["nurse"]);
  await prisma.helpRequest.update({ where: { id }, data: { status } });
  revalidatePath(`/intake-assistant/notifications/${id}`);
}

/** PowerForm submit by a nurse or a co-op student. */
export async function submitPowerForm(referralId: string, answers: Answers, opts: { helpRequestId?: string; submissionId?: string }) {
  const user = await requireUser("ia", ["nurse", "coop"]);
  if (user.role === "nurse") {
    const { submissionId } = await submitIntake({ referralId, answers, completedBy: "nurse", userId: user.id, userName: user.name, helpRequestId: opts.helpRequestId });
    after(() => runSummary(submissionId));
    redirect(`/intake-assistant/patients/${referralId}?done=nurse`);
  }
  await submitIntake({ referralId, answers, completedBy: "coop_student", userId: user.id, userName: user.name, submissionId: opts.submissionId });
  redirect(`/intake-assistant/patients/${referralId}?done=coop`);
}

export async function reviewCoopIntake(submissionId: string, answers: Answers, decision: "approve" | "return", comment: string) {
  const user = await requireUser("ia", ["nurse"]);
  const sub = await prisma.intakeSubmission.findUniqueOrThrow({ where: { id: submissionId } });
  if (decision === "approve") {
    await approveCoopIntake(submissionId, answers, user.name);
    redirect(`/intake-assistant/review?approved=${sub.referralId}`);
  }
  await prisma.intakeSubmission.update({
    where: { id: submissionId },
    data: { answers: JSON.stringify(answers), reviewStatus: "returned", reviewComment: comment, reviewedByName: user.name, reviewedAt: new Date() },
  });
  redirect(`/intake-assistant/review?returned=${sub.referralId}`);
}

export async function submitHelpRequest(_: string | null, fd: FormData) {
  const get = (k: string) => String(fd.get(k) || "").trim();
  if (!get("name") || !get("dob") || !get("phone")) return "Please enter your name, date of birth and phone number.";
  let referralId = get("ref") || null;
  if (referralId && !(await prisma.referral.findUnique({ where: { id: referralId } }))) referralId = null;
  if (!referralId) {
    // Match by date of birth and last name when opened without a link.
    const last = get("name").split(" ").pop()?.toLowerCase() || "";
    const cands = await prisma.referral.findMany({ where: { dob: get("dob") } });
    referralId = cands.find((c) => c.lastName.toLowerCase() === last)?.id || cands[0]?.id || null;
  }
  const hr = await prisma.helpRequest.create({
    data: {
      referralId,
      name: get("name"),
      dob: get("dob"),
      phone: get("phone"),
      language: get("language") || "English",
      bestTime: get("bestTime") || "Any time",
      notes: get("notes"),
      source: get("from") === "portal" ? "portal" : "email",
    },
  });
  if (referralId) {
    const r = await prisma.referral.findUniqueOrThrow({ where: { id: referralId } });
    if (!["submitted", "nurse_completed", "in_emr", "coop_pending_review"].includes(r.status)) {
      await prisma.referral.update({ where: { id: referralId }, data: { status: "help_requested" } });
    }
  }
  redirect(`/intake-assistant/request-help/thanks?id=${hr.id}`);
}

// Thin wrappers with the (actionId, answers, comment) signature the PowerForm component expects.
export async function powerFormAction(referralId: string, helpRequestId: string, submissionId: string, _actionId: string, answers: Answers, _comment: string) {
  await submitPowerForm(referralId, answers, { helpRequestId: helpRequestId || undefined, submissionId: submissionId || undefined });
}

export async function reviewAction(submissionId: string, actionId: string, answers: Answers, comment: string) {
  await reviewCoopIntake(submissionId, answers, actionId === "approve" ? "approve" : "return", comment);
}
