import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { IaShell, PageTitle } from "@/components/IaShell";
import { StatusChip } from "@/components/StatusChip";
import { formatShort } from "@/lib/answers";

export const dynamic = "force-dynamic";
export const metadata = { title: "Intake Assistant: Upcoming intakes" };

export default async function Upcoming() {
  const user = await requireUser("ia");
  const refs = await prisma.referral.findMany({ orderBy: { appointmentAt: "asc" }, include: { submissions: { where: { status: "submitted" } } } });
  return (
    <IaShell user={user} active="upcoming">
      <PageTitle title="Upcoming intakes" sub="New patients by appointment date. Open a patient to see details or complete the PowerForm." />
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="px-3 py-2">Appointment</th>
              <th className="px-3 py-2">Patient</th>
              <th className="px-3 py-2">DOB</th>
              <th className="px-3 py-2">Phone</th>
              <th className="px-3 py-2">Provider group</th>
              <th className="px-3 py-2">Intake status</th>
            </tr>
          </thead>
          <tbody>
            {refs.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="whitespace-nowrap px-3 py-2">{formatShort(r.appointmentAt)}</td>
                <td className="px-3 py-2">
                  <Link href={`/intake-assistant/patients/${r.id}`} className="font-medium text-ia-700 underline">{r.lastName}, {r.firstName}</Link>
                </td>
                <td className="px-3 py-2">{r.dob}</td>
                <td className="px-3 py-2">{r.phone}</td>
                <td className="px-3 py-2">{r.providerGroup}</td>
                <td className="px-3 py-2"><StatusChip status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </IaShell>
  );
}
