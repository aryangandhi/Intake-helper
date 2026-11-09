import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { IaShell, PageTitle } from "@/components/IaShell";
import { PatientStrip } from "@/components/PatientStrip";
import { PowerForm } from "@/components/intake/PowerForm";
import { sectionsFor } from "@/config/intakeQuestions";
import { parseAnswers } from "@/lib/answers";
import { powerFormAction } from "../../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Intake Assistant: PowerForm" };

export default async function PowerFormPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ help?: string; sub?: string }> }) {
  const user = await requireUser("ia", ["nurse", "coop"]);
  const { id } = await params;
  const sp = await searchParams;
  const r = await prisma.referral.findUnique({ where: { id } });
  if (!r) notFound();
  const help = sp.help ? await prisma.helpRequest.findUnique({ where: { id: sp.help } }) : null;
  const returned = sp.sub ? await prisma.intakeSubmission.findFirst({ where: { id: sp.sub, completedByUserId: user.id, reviewStatus: "returned" } }) : null;
  const draft = await prisma.intakeSubmission.findFirst({ where: { referralId: r.id, status: "draft" } });
  const initial = parseAnswers(returned?.answers ?? draft?.answers);
  if (help?.language && !initial.ay_language) initial.ay_language = help.language;
  if (!initial.ay_sex && (r.sex === "Female" || r.sex === "Male")) initial.ay_sex = r.sex;
  const who = user.role === "nurse" ? `RN ${user.name}` : `Co-op student ${user.name}`;
  return (
    <IaShell user={user} active={user.role === "nurse" && help ? "notifications" : "upcoming"}>
      <Link href={`/intake-assistant/patients/${r.id}`} className="text-sm text-ia-700 underline">← Patient</Link>
      <PageTitle title="PowerForm: Oncology New Patient Intake" sub={`Completed by ${who} over the phone${user.role === "coop" ? " · goes to nurse review before the EMR" : ""}`} />
      <PatientStrip r={r} />
      {draft && !returned && <p className="mb-3 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm">Pre-filled with answers the patient started online. Confirm them with the patient.</p>}
      {returned && (
        <p className="mb-3 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm">
          <strong>Returned by RN {returned.reviewedByName}:</strong> {returned.reviewComment}
        </p>
      )}
      <PowerForm
        sections={sectionsFor("staff")}
        initialAnswers={initial}
        actions={[{ id: "submit", label: user.role === "nurse" ? "Submit and send to EMR" : "Submit for nurse review", primary: true }]}
        onAction={powerFormAction.bind(null, r.id, help?.id || "", returned?.id || "")}
      />
    </IaShell>
  );
}
