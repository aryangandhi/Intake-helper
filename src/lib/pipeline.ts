import { prisma } from "./db";
import { buildRawData, computeIncomplete, flatRaw, parseAnswers, type Answers } from "./answers";
import { generateSummary } from "./ai/summarize";

type CompletedBy = "patient" | "nurse" | "coop_student";

/** Save a draft (patient autosave). */
export async function saveDraft(referralId: string, answers: Answers) {
  const existing = await prisma.intakeSubmission.findFirst({ where: { referralId, status: "draft", completedBy: "patient" } });
  if (existing) {
    await prisma.intakeSubmission.update({ where: { id: existing.id }, data: { answers: JSON.stringify(answers) } });
  } else {
    await prisma.intakeSubmission.create({ data: { referralId, answers: JSON.stringify(answers), completedBy: "patient" } });
  }
  const r = await prisma.referral.findUniqueOrThrow({ where: { id: referralId } });
  if (["referral_entered", "email_sent"].includes(r.status)) {
    await prisma.referral.update({ where: { id: referralId }, data: { status: "in_progress" } });
  }
}

/**
 * Submit an intake. Patient and nurse submissions go straight to the EMR and get an AI summary
 * (generated in the background; returns the summary id). Co-op submissions go to nurse review.
 */
export async function submitIntake(opts: {
  referralId: string;
  answers: Answers;
  completedBy: CompletedBy;
  userId: string;
  userName: string;
  submissionId?: string; // reuse an existing (draft or returned) submission
  helpRequestId?: string;
}): Promise<{ submissionId: string; summaryId: string | null }> {
  const audience = opts.completedBy === "patient" ? "patient" : "staff";
  const incomplete = computeIncomplete(opts.answers, audience);
  const data = {
    answers: JSON.stringify(opts.answers),
    status: "submitted",
    completedBy: opts.completedBy,
    completedByUserId: opts.userId,
    completedByName: opts.userName,
    submittedAt: new Date(),
    incompleteFields: JSON.stringify(incomplete),
    reviewStatus: opts.completedBy === "coop_student" ? "pending" : null,
  };

  let submissionId = opts.submissionId;
  if (!submissionId && opts.completedBy === "patient") {
    const draft = await prisma.intakeSubmission.findFirst({ where: { referralId: opts.referralId, status: "draft", completedBy: "patient" } });
    submissionId = draft?.id;
  }
  const sub = submissionId
    ? await prisma.intakeSubmission.update({ where: { id: submissionId }, data })
    : await prisma.intakeSubmission.create({ data: { ...data, referralId: opts.referralId } });

  // A staff submission replaces any unfinished patient draft.
  if (opts.completedBy !== "patient") {
    await prisma.intakeSubmission.deleteMany({ where: { referralId: opts.referralId, status: "draft" } });
  }

  if (opts.helpRequestId) {
    await prisma.helpRequest.update({ where: { id: opts.helpRequestId }, data: { status: "completed", read: true } });
  } else if (opts.completedBy === "nurse") {
    await prisma.helpRequest.updateMany({ where: { referralId: opts.referralId, status: { not: "completed" } }, data: { status: "completed", read: true } });
  }

  if (opts.completedBy === "coop_student") {
    await prisma.referral.update({ where: { id: opts.referralId }, data: { status: "coop_pending_review" } });
    return { submissionId: sub.id, summaryId: null };
  }

  await prisma.referral.update({
    where: { id: opts.referralId },
    data: { status: opts.completedBy === "patient" ? "submitted" : "nurse_completed" },
  });
  const summary = await prisma.aISummary.create({ data: { submissionId: sub.id, status: "pending" } });
  await prisma.eMRDocument.create({ data: { referralId: opts.referralId, submissionId: sub.id, hasAISummary: true } });
  return { submissionId: sub.id, summaryId: summary.id };
}

/** Runs the AI pipeline for a submission and stores the result. Never throws. */
export async function runSummary(submissionId: string) {
  try {
    const sub = await prisma.intakeSubmission.findUniqueOrThrow({ where: { id: submissionId }, include: { referral: true } });
    if (sub.completedBy === "coop_student") return; // never summarise co-op intakes
    const answers = parseAnswers(sub.answers);
    const audience = sub.completedBy === "patient" ? "patient" : "staff";
    const raw = flatRaw(buildRawData(answers, sub.referral, audience));
    const incomplete: string[] = JSON.parse(sub.incompleteFields || "[]");
    const result = await generateSummary(raw, incomplete);
    await prisma.aISummary.update({
      where: { submissionId },
      data: {
        status: "ready",
        content: JSON.stringify(result.content),
        validation: JSON.stringify(result.validation),
        modelUsed: result.modelUsed,
        isFallback: result.isFallback,
        generatedAt: new Date(),
      },
    });
  } catch (err) {
    console.error("[summary] pipeline error", err);
  }
}

/** Nurse approves a co-op intake (optionally with corrections) and sends it to the EMR without AI. */
export async function approveCoopIntake(submissionId: string, answers: Answers, nurseName: string) {
  const sub = await prisma.intakeSubmission.update({
    where: { id: submissionId },
    data: {
      answers: JSON.stringify(answers),
      incompleteFields: JSON.stringify(computeIncomplete(answers, "staff")),
      reviewStatus: "approved",
      reviewedByName: nurseName,
      reviewedAt: new Date(),
    },
  });
  await prisma.eMRDocument.create({ data: { referralId: sub.referralId, submissionId: sub.id, hasAISummary: false } });
  await prisma.referral.update({ where: { id: sub.referralId }, data: { status: "in_emr" } });
}
