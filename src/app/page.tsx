import Link from "next/link";
import { resetDemoAction } from "./actions";

export const dynamic = "force-dynamic";

const cards = [
  {
    title: "Patient",
    desc: "Email inbox and the MyConnectedCare patient portal.",
    links: [
      { href: "/inbox", label: "Patient email inbox" },
      { href: "/myconnectedcare", label: "MyConnectedCare (prototype)" },
    ],
    cls: "border-teal-600",
  },
  {
    title: "Nurse / Admin / Co-op",
    desc: "Intake Assistant: referrals, nurse call requests, PowerForm and co-op review.",
    links: [{ href: "/intake-assistant", label: "Intake Assistant" }],
    cls: "border-indigo-600",
  },
  {
    title: "Doctor",
    desc: "Oracle Health EMR (prototype): intake documents and clinic notes.",
    links: [{ href: "/emr", label: "Oracle Health EMR (prototype)" }],
    cls: "border-sky-800",
  },
];

export default async function Hub({ searchParams }: { searchParams: Promise<{ reset?: string }> }) {
  const sp = await searchParams;
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Intake prototype: demo hub</h1>
          <p className="mt-2 text-gray-700">Open each system in its own browser tab.</p>
        </div>
        <details className="relative">
          <summary aria-label="Demo settings" title="Demo settings" className="list-none cursor-pointer rounded-full p-2 hover:bg-gray-100 text-gray-600">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </summary>
          <div className="absolute right-0 z-10 mt-2 w-72 rounded-lg border bg-white p-4 shadow-lg">
            <p className="text-sm text-gray-700">Restore all demo data and log everyone out. Use this between evaluation rounds.</p>
            <form action={resetDemoAction} className="mt-3">
              <button className="w-full rounded-md bg-red-700 px-3 py-2 font-semibold text-white hover:bg-red-800">Reset demo data</button>
            </form>
          </div>
        </details>
      </div>
      {sp.reset && <p role="status" className="mt-4 rounded-md bg-green-50 border border-green-300 px-4 py-2 text-green-900">Demo data has been reset.</p>}
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {cards.map((c) => (
          <section key={c.title} className={`rounded-xl border-t-8 ${c.cls} border-x border-b bg-white p-6 shadow-sm`}>
            <h2 className="text-xl font-bold">{c.title}</h2>
            <p className="mt-2 text-gray-700">{c.desc}</p>
            <ul className="mt-4 space-y-2">
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} target="_blank" className="font-semibold text-blue-800 underline">
                    {l.label} ↗
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
