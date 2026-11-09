import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { IaShell, PageTitle } from "@/components/IaShell";
import { StatusChip } from "@/components/StatusChip";
import { Email } from "@/components/Email";
import { formatShort } from "@/lib/answers";
import { sendEmailNow } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Intake Assistant: Referrals" };

export default async function Referrals({ searchParams }: { searchParams: Promise<{ created?: string }> }) {
  const user = await requireUser("ia", ["admin", "nurse"]);
  const sp = await searchParams;
  const refs = await prisma.referral.findMany({ orderBy: { createdAt: "desc" } });
  const created = sp.created ? refs.find((r) => r.id === sp.created) : null;
  return (
    <IaShell user={user} active="referrals">
      <PageTitle
        title="Referrals"
        sub="New patient referrals. The intake email is sent automatically 7 days before the first appointment."
        right={<Link href="/intake-assistant/referrals/new" className="rounded-md bg-ia-600 px-4 py-2 font-semibold text-white hover:bg-ia-700">+ New referral</Link>}
      />
      {created && (
        <p role="status" className="mb-4 rounded-md border border-green-300 bg-green-50 px-4 py-2 text-green-900">
          Referral saved for {created.firstName} {created.lastName}. {created.emailSentAt ? "The intake email was sent right away (appointment is within 7 days)." : `The intake email is scheduled for ${formatShort(created.emailScheduledAt)}.`}
        </p>
      )}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="px-3 py-2">Patient</th>
              <th className="px-3 py-2">DOB</th>
              <th className="px-3 py-2">First appointment</th>
              <th className="px-3 py-2">Provider group</th>
              <th className="px-3 py-2">Intake email</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {refs.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2 font-medium">
                  {r.lastName}, {r.firstName}
                  <div className="text-xs font-normal text-slate-600"><Email value={r.email} /></div>
                </td>
                <td className="px-3 py-2">{r.dob}</td>
                <td className="px-3 py-2">{formatShort(r.appointmentAt)}</td>
                <td className="px-3 py-2">{r.providerGroup}</td>
                <td className="px-3 py-2">
                  {r.emailSentAt ? <span>Sent {formatShort(r.emailSentAt)}</span> : <span>Scheduled {formatShort(r.emailScheduledAt)}</span>}
                </td>
                <td className="px-3 py-2"><StatusChip status={r.status} /></td>
                <td className="px-3 py-2 text-right">
                  {!r.emailSentAt && (
                    <form action={sendEmailNow.bind(null, r.id)}>
                      <button className="whitespace-nowrap rounded border border-ia-600 px-2 py-1 text-xs font-semibold text-ia-700 hover:bg-ia-50">Send intake email now (demo)</button>
                    </form>
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
