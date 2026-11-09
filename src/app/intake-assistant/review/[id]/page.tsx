import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { IaShell, PageTitle } from "@/components/IaShell";
import { PatientStrip } from "@/components/PatientStrip";
import { PowerForm } from "@/components/intake/PowerForm";
import { sectionsFor } from "@/config/intakeQuestions";
import { formatShort, parseAnswers } from "@/lib/answers";
import { reviewAction } from "../../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Intake Assistant: Review co-op intake" };

export default async function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("ia", ["nurse"]);
  const { id } = await params;
  const sub = await prisma.intakeSubmission.findUnique({ where: { id }, include: { referral: true } });
  if (!sub || sub.completedBy !== "coop_student") notFound();
  return (
    <IaShell user={user} active="review">
      <Link href="/intake-assistant/review" className="text-sm text-ia-700 underline">← Review queue</Link>
      <PageTitle title="Review co-op intake" sub={`Completed by co-op student ${sub.completedByName} on ${formatShort(sub.submittedAt)}. Correct anything needed, then approve.`} />
      <PatientStrip r={sub.referral} />
      <PowerForm
        sections={sectionsFor("staff")}
        initialAnswers={parseAnswers(sub.answers)}
        showComment
        actions={[
          { id: "return", label: "Return to student", needsComment: true },
          { id: "approve", label: "Approve and send to EMR", primary: true },
        ]}
        onAction={reviewAction.bind(null, sub.id)}
      />
    </IaShell>
  );
}
