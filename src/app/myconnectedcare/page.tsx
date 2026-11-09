import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { questionnaireBadge } from "@/lib/mcc";
import { MccShell } from "@/components/MccShell";
import { formatDateTime } from "@/lib/answers";

export const dynamic = "force-dynamic";
export const metadata = { title: "MyConnectedCare (prototype): Home" };

export default async function Home() {
  const user = await requireUser("mcc");
  const r = user.referral;
  const badge = await questionnaireBadge(user.referralId);
  return (
    <MccShell active="home" name={user.name} badge={{ questionnaires: badge }}>
      <h1 className="text-3xl font-bold text-mcc-900">Hello, {r?.firstName || user.name}</h1>
      <p className="mt-2 text-lg text-gray-800">Welcome to your patient portal.</p>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Upcoming appointment</h2>
          {r ? (
            <>
              <p className="mt-3 text-lg font-semibold">{formatDateTime(r.appointmentAt)}</p>
              <p className="text-gray-800">{r.providerGroup}, Cancer Centre</p>
              <Link href="/myconnectedcare/appointments" className="mt-3 inline-block text-mcc-700 underline">View appointments</Link>
            </>
          ) : (
            <p className="mt-3 text-gray-700">No upcoming appointments.</p>
          )}
        </section>
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Messages</h2>
          <p className="mt-3 text-gray-700">You have no new messages.</p>
        </section>
      </div>
    </MccShell>
  );
}
