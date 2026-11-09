import { requireUser } from "@/lib/auth";
import { MccShell } from "@/components/MccShell";
import { formatDateTime } from "@/lib/answers";
import { questionnaireBadge } from "@/lib/mcc";

export const dynamic = "force-dynamic";
export const metadata = { title: "MyConnectedCare (prototype): Appointments" };

export default async function Appointments() {
  const user = await requireUser("mcc");
  const r = user.referral;
  return (
    <MccShell active="appointments" name={user.name} badge={{ questionnaires: await questionnaireBadge(user.referralId) }}>
      <h1 className="text-3xl font-bold text-mcc-900">Appointments</h1>
      {r ? (
        <table className="mt-6 w-full max-w-3xl overflow-hidden rounded-xl bg-white text-left text-lg shadow-sm">
          <thead className="bg-mcc-100">
            <tr><th className="px-4 py-3">Date and time</th><th className="px-4 py-3">Clinic</th><th className="px-4 py-3">Type</th></tr>
          </thead>
          <tbody>
            <tr className="border-t"><td className="px-4 py-3">{formatDateTime(r.appointmentAt)}</td><td className="px-4 py-3">{r.providerGroup}</td><td className="px-4 py-3">New patient consultation (in person)</td></tr>
          </tbody>
        </table>
      ) : (
        <p className="mt-6">No appointments.</p>
      )}
    </MccShell>
  );
}
