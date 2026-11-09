"use server";
import { redirect } from "next/navigation";
import { clearSession, login, requireUser, setSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { saveDraft, submitIntake, runSummary } from "@/lib/pipeline";
import type { Answers } from "@/lib/answers";
import { after } from "next/server";

export async function mccLogin(_: string | null, fd: FormData) {
  const err = await login("mcc", String(fd.get("email") || ""), String(fd.get("password") || ""));
  if (err) return err;
  redirect("/myconnectedcare");
}

export async function mccSignup(_: string | null, fd: FormData) {
  const email = String(fd.get("email") || "").trim().toLowerCase();
  const password = String(fd.get("password") || "");
  const confirm = String(fd.get("confirm") || "");
  const dob = String(fd.get("dob") || "");
  if (password.length < 6) return "Please choose a password with at least 6 characters.";
  if (password !== confirm) return "The two passwords do not match.";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return "An account with this email already exists. Please log in instead.";
  const ref = await prisma.referral.findFirst({ where: { email }, orderBy: { createdAt: "desc" } });
  if (!ref) return "We could not find a Cancer Centre referral for this email. Please use the email address the Cancer Centre wrote to.";
  if (dob && dob !== ref.dob) return "The date of birth does not match our records.";
  const user = await prisma.user.create({ data: { email, password, name: `${ref.firstName} ${ref.lastName}`, role: "patient", referralId: ref.id } });
  await setSession("mcc", user.id);
  redirect("/myconnectedcare");
}

export async function mccLogout() {
  await clearSession("mcc");
  redirect("/myconnectedcare/login");
}

export async function saveDraftAction(answers: Answers) {
  const user = await requireUser("mcc");
  if (!user.referralId) return;
  const existingSubmitted = await prisma.intakeSubmission.findFirst({ where: { referralId: user.referralId, status: "submitted" } });
  if (existingSubmitted) return;
  await saveDraft(user.referralId, answers);
}

export async function submitIntakeAction(answers: Answers) {
  const user = await requireUser("mcc");
  if (!user.referralId) return;
  const { submissionId } = await submitIntake({ referralId: user.referralId, answers, completedBy: "patient", userId: user.id, userName: user.name });
  after(() => runSummary(submissionId));
  redirect("/myconnectedcare/questionnaires/intake/complete");
}
