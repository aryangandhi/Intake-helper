import { prisma } from "@/lib/db";
import { HelpForm } from "./HelpForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Request a nurse call" };

function HelpHeader() {
  return (
    <header className="bg-teal-900 px-4 py-3 text-white">
      <p className="text-lg font-bold">Cancer Centre · New Patient Intake</p>
      <p className="text-sm text-teal-100">Provided by Intake Assistant (prototype)</p>
    </header>
  );
}

export default async function RequestHelp({ searchParams }: { searchParams: Promise<{ ref?: string; from?: string }> }) {
  const sp = await searchParams;
  const r = sp.ref ? await prisma.referral.findUnique({ where: { id: sp.ref } }) : null;
  const prefill = { name: r ? `${r.firstName} ${r.lastName}` : "", dob: r?.dob || "", phone: r?.phone || "", language: "" };
  return (
    <div className="flex flex-1 flex-col bg-teal-50">
      <style>{`html{font-size:18px}`}</style>
      <HelpHeader />
      <main className="mx-auto w-full max-w-xl px-4 py-8">
        <div className="rounded-2xl bg-white p-6 shadow">
          <h1 className="text-3xl font-bold text-teal-950">Request a nurse call</h1>
          <p className="mt-2 text-lg text-gray-800">A nurse will call you before your first appointment and complete your intake form with you over the phone.</p>
          <div className="mt-6">
            <HelpForm prefill={prefill} refId={r?.id || ""} from={sp.from || "email"} />
          </div>
        </div>
      </main>
    </div>
  );
}
