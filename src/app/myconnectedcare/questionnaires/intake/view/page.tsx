import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MccShell } from "@/components/MccShell";
import { ReadOnlyAnswers } from "@/components/ReadOnlyAnswers";
import { buildRawData, formatShort, parseAnswers } from "@/lib/answers";

export const dynamic = "force-dynamic";
export const metadata = { title: "MyConnectedCare (prototype): Submitted form" };

export default async function View() {
  const user = await requireUser("mcc");
  const sub = user.referralId ? await prisma.intakeSubmission.findFirst({ where: { referralId: user.referralId, status: "submitted" }, orderBy: { submittedAt: "desc" } }) : null;
  if (!sub || !user.referral) redirect("/myconnectedcare/questionnaires");
  const sections = buildRawData(parseAnswers(sub.answers), user.referral, sub.completedBy === "patient" ? "patient" : "staff").slice(1).filter((s) => s.id !== "vitals");
  return (
    <MccShell active="questionnaires" name={user.name}>
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-mcc-900">Oncology New Patient Intake</h1>
        <p className="mt-2 text-lg text-gray-800">Sent to your care team on {formatShort(sub.submittedAt)}{sub.completedBy !== "patient" ? " (completed with your care team over the phone)" : ""}.</p>
        <div className="mt-6"><ReadOnlyAnswers sections={sections} /></div>
      </div>
    </MccShell>
  );
}
