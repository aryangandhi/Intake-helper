import { prisma } from "./db";

/** 1 if the patient still has the intake questionnaire to submit. */
export async function questionnaireBadge(referralId: string | null) {
  if (!referralId) return 0;
  const done = await prisma.intakeSubmission.count({ where: { referralId, status: "submitted" } });
  return done ? 0 : 1;
}
