import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { IaShell, PageTitle } from "@/components/IaShell";
import { StatusChip } from "@/components/StatusChip";
import { formatShort } from "@/lib/answers";

export const dynamic = "force-dynamic";
export const metadata = { title: "Intake Assistant: Notifications" };

export default async function Notifications() {
  const user = await requireUser("ia", ["nurse"]);
  const items = await prisma.helpRequest.findMany({ include: { referral: true }, orderBy: { createdAt: "desc" } });
  return (
    <IaShell user={user} active="notifications">
      <PageTitle title="Notifications" sub="Patients who asked for a nurse to call them and complete the intake over the phone." />
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="px-3 py-2">Patient</th>
              <th className="px-3 py-2">Appointment</th>
              <th className="px-3 py-2">Phone</th>
              <th className="px-3 py-2">Language</th>
              <th className="px-3 py-2">Best time</th>
              <th className="px-3 py-2">Requested</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-6 text-center text-slate-600">No notifications.</td></tr>
            )}
            {items.map((h) => (
              <tr key={h.id} className={`border-t ${h.read ? "" : "bg-ia-50 font-semibold"}`}>
                <td className="px-3 py-2">
                  <Link href={`/intake-assistant/notifications/${h.id}`} className="text-ia-700 underline">
                    {!h.read && <span className="mr-1 inline-block h-2 w-2 rounded-full bg-red-600" aria-label="Unread" />}
                    Nurse call requested: {h.name}
                  </Link>
                </td>
                <td className="px-3 py-2">{h.referral ? formatShort(h.referral.appointmentAt) : "Unknown"}</td>
                <td className="px-3 py-2">{h.phone}</td>
                <td className="px-3 py-2">{h.language}</td>
                <td className="px-3 py-2">{h.bestTime}</td>
                <td className="px-3 py-2">{formatShort(h.createdAt)}</td>
                <td className="px-3 py-2"><StatusChip status={h.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </IaShell>
  );
}
