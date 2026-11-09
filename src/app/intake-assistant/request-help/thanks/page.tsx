import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/answers";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nurse call requested" };

export default async function Thanks({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const sp = await searchParams;
  const hr = sp.id ? await prisma.helpRequest.findUnique({ where: { id: sp.id }, include: { referral: true } }) : null;
  const date = hr?.referral ? formatDate(hr.referral.appointmentAt) : "your appointment date";
  return (
    <div className="flex flex-1 flex-col bg-teal-50">
      <style>{`html{font-size:18px}`}</style>
      <header className="bg-teal-900 px-4 py-3 text-white">
        <p className="text-lg font-bold">Cancer Centre · New Patient Intake</p>
        <p className="text-sm text-teal-100">Provided by Intake Assistant (prototype)</p>
      </header>
      <main className="mx-auto w-full max-w-xl px-4 py-10">
        <div className="rounded-2xl bg-white p-8 text-center shadow">
          <div aria-hidden="true" className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-800">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5" /></svg>
          </div>
          <h1 className="mt-4 text-3xl font-bold text-teal-950">Thanks. Your request has been sent.</h1>
          <p className="mt-4 text-xl text-gray-900">
            A nurse will call you 1 to 2 days before your appointment on <strong>{date}</strong> to complete your intake over the phone.
          </p>
          {hr?.source === "portal" && (
            <Link href="/myconnectedcare" className="mt-6 inline-block text-lg text-teal-800 underline">Back to MyConnectedCare</Link>
          )}
        </div>
      </main>
    </div>
  );
}
