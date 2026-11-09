import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MccShell } from "@/components/MccShell";
import { PatientIntakeForm } from "@/components/intake/PatientIntakeForm";
import { sectionsFor } from "@/config/intakeQuestions";
import { parseAnswers } from "@/lib/answers";
import { saveDraftAction, submitIntakeAction } from "../../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "MyConnectedCare (prototype): Intake form" };

export default async function IntakePage() {
  const user = await requireUser("mcc");
  if (!user.referralId) redirect("/myconnectedcare/questionnaires");
  const submitted = await prisma.intakeSubmission.findFirst({ where: { referralId: user.referralId, status: "submitted" } });
  if (submitted) redirect("/myconnectedcare/questionnaires/intake/view");
  const draft = await prisma.intakeSubmission.findFirst({ where: { referralId: user.referralId, status: "draft" } });
  return (
    <MccShell active="questionnaires" name={user.name} badge={{ questionnaires: 1 }}>
      <PatientIntakeForm
        sections={sectionsFor("patient")}
        initialAnswers={parseAnswers(draft?.answers)}
        referralId={user.referralId}
        saveDraft={saveDraftAction}
        submit={submitIntakeAction}
      />
    </MccShell>
  );
}
