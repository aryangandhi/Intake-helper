import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { IaShell, PageTitle } from "@/components/IaShell";
import { StatusChip } from "@/components/StatusChip";
import { formatShort } from "@/lib/answers";

export const dynamic = "force-dynamic";
export const metadata = { title: "Intake Assistant: My submitted intakes" };

export default async function MyIntakes() {
  const user = await requireUser("ia", ["coop"]);
  const subs = await prisma.intakeSubmission.findMany({ where: { completedByUserId: user.id, completedBy: "coop_student" }, include: { referral: true }, orderBy: { submittedAt: "desc" } });
  return (
    <IaShell user={user} active="my-intakes">
      <PageTitle title="My submitted intakes" sub="Intakes you completed. A nurse reviews each one before it goes to the EMR." />
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr><th className="px-3 py-2">Patient</th><th className="px-3 py-2">Submitted</th><th className="px-3 py-2">Review</th><th className="px-3 py-2">Nurse comment</th><th className="px-3 py-2" /></tr>
          </thead>
          <tbody>
            {subs.length === 0 && <tr><td colSpan={5} className="px-3 py-6 text-center text-slate-600">You have not submitted any intakes yet.</td></tr>}
            {subs.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="px-3 py-2">{s.referral.lastName}, {s.referral.firstName}</td>
                <td className="px-3 py-2">{formatShort(s.submittedAt)}</td>
                <td className="px-3 py-2"><StatusChip status={s.reviewStatus || ""} />{s.reviewedByName && <span className="ml-2 text-xs text-slate-600">by RN {s.reviewedByName}</span>}</td>
                <td className="px-3 py-2">{s.reviewComment}</td>
                <td className="px-3 py-2">
                  {s.reviewStatus === "returned" && (
                    <Link href={`/intake-assistant/powerform/${s.referralId}?sub=${s.id}`} className="rounded border border-ia-600 px-2 py-1 text-xs font-semibold text-ia-700">Fix and resubmit</Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </IaShell>
  );
}
