"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { clearSession, login, quickLogin, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildNoteFromDocument } from "@/lib/clinicNote";

export async function emrLogin(_: string | null, fd: FormData) {
  const err = await login("emr", String(fd.get("email") || ""), String(fd.get("password") || ""));
  if (err) return err;
  redirect("/emr");
}

export async function emrQuickLogin(email: string) {
  await quickLogin("emr", email);
  redirect("/emr");
}

export async function emrLogout() {
  await clearSession("emr");
  redirect("/emr/login");
}

export async function markVerified(docId: string) {
  const user = await requireUser("emr");
  const doc = await prisma.eMRDocument.update({ where: { id: docId }, data: { verifiedByName: user.role === "nurse" ? `RN ${user.name}` : user.name, verifiedAt: new Date() } });
  revalidatePath(`/emr/patients/${doc.referralId}/documents/${docId}`);
}

export async function copyToClinicNote(docId: string) {
  const user = await requireUser("emr");
  const doc = await prisma.eMRDocument.findUniqueOrThrow({ where: { id: docId } });
  const parts = await buildNoteFromDocument(docId);
  const existing = await prisma.clinicNote.findUnique({ where: { referralId: doc.referralId } });
  const today = new Date().toISOString().slice(0, 10);
  const data = {
    ...parts,
    noteDate: existing?.noteDate || today,
    oncologist: existing?.oncologist || (user.role === "oncologist" ? user.name : ""),
  };
  await prisma.clinicNote.upsert({ where: { referralId: doc.referralId }, update: data, create: { referralId: doc.referralId, ...data } });
  redirect(`/emr/patients/${doc.referralId}/notes?copied=1`);
}

export async function saveClinicNote(referralId: string, _: string | null, fd: FormData) {
  await requireUser("emr");
  const g = (k: string) => String(fd.get(k) || "");
  const data = {
    noteDate: g("noteDate"),
    oncologist: g("oncologist"),
    medicalHistory: g("medicalHistory"),
    currentMedications: g("currentMedications"),
    allergies: g("allergies"),
    socialHistory: g("socialHistory"),
    familyHistory: g("familyHistory"),
    examination: g("examination"),
    plan: g("plan"),
    followUp: g("followUp"),
  };
  await prisma.clinicNote.upsert({ where: { referralId }, update: data, create: { referralId, ...data } });
  revalidatePath(`/emr/patients/${referralId}/notes`);
  return `Saved at ${new Date().toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" })}`;
}
