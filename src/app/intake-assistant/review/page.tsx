import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { IaShell, PageTitle } from "@/components/IaShell";
import { StatusChip } from "@/components/StatusChip";
import { formatShort } from "@/lib/answers";

export const dynamic = "force-dynamic";
export const metadata = { title: "Intake Assistant: Co-op review queue" };

export default async function ReviewQueue({ searchParams }: { searchParams: Promise<{ approved?: string; returned?: string }> }) {
  const user = await requireUser("ia", ["nurse"]);
  const sp = await searchParams;
  const subs = await prisma.intakeSubmission.findMany({
    where: { completedBy: "coop_student", status: "submitted" },
    include: { referral: true },
    orderBy: { submittedAt: "desc" },
  });
  const pending = subs.filter((s) => s.reviewStatus === "pending");
  const others = subs.filter((s) => s.reviewStatus !== "pending");
  return (
    <IaShell user={user} active="review">
      <PageTitle title="Co-op review queue" sub="Intakes completed by co-op students. Review, correct if needed, then approve to send to the EMR." />
      {sp.approved && <p role="status" className="mb-4 rounded-md border border-green-300 bg-green-50 px-4 py-2 text-green-900">Approved and sent to the EMR.</p>}
      {sp.returned && <p role="status" className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-2">Returned to the student with your comment.</p>}
      <h2 className="mb-2 font-semibold">Pending review ({pending.length})</h2>
      <Table rows={pending} />
      {others.length > 0 && (
        <>
          <h2 className="mb-2 mt-8 font-semibold">Reviewed</h2>
          <Table rows={others} />
        </>
      )}
    </IaShell>
  );
}

function Table({ rows }: { rows: Awaited<ReturnType<typeof prisma.intakeSubmission.findMany<{ include: { referral: true } }>>> }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-100 text-slate-700">
          <tr><th className="px-3 py-2">Patient</th><th className="px-3 py-2">Appointment</th><th className="px-3 py-2">Completed by</th><th className="px-3 py-2">Submitted</th><th className="px-3 py-2">Status</th></tr>
        </thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={5} className="px-3 py-6 text-center text-slate-600">Nothing here.</td></tr>}
          {rows.map((s) => (
            <tr key={s.id} className="border-t">
              <td className="px-3 py-2">
                {s.reviewStatus === "pending" ? (
                  <Link href={`/intake-assistant/review/${s.id}`} className="font-medium text-ia-700 underline">{s.referral.lastName}, {s.referral.firstName}</Link>
                ) : (
                  <span>{s.referral.lastName}, {s.referral.firstName}</span>
                )}
              </td>
              <td className="px-3 py-2">{formatShort(s.referral.appointmentAt)}</td>
              <td className="px-3 py-2">Co-op student {s.completedByName}</td>
              <td className="px-3 py-2">{formatShort(s.submittedAt)}</td>
              <td className="px-3 py-2"><StatusChip status={s.reviewStatus || ""} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
