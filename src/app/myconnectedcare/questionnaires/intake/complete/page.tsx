import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { MccShell } from "@/components/MccShell";

export const dynamic = "force-dynamic";
export const metadata = { title: "MyConnectedCare (prototype): Form sent" };

export default async function Complete() {
  const user = await requireUser("mcc");
  return (
    <MccShell active="questionnaires" name={user.name}>
      <div className="mx-auto mt-6 max-w-2xl rounded-2xl bg-white p-8 text-center shadow-sm">
        <div aria-hidden="true" className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-800">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5" /></svg>
        </div>
        <h1 className="mt-4 text-3xl font-bold text-mcc-900">Thank you, your intake form has been sent to your care team.</h1>
        <p className="mt-4 text-lg text-gray-800">There is nothing else you need to do. Please remember to bring an official list of your current medications to your appointment.</p>
        <Link href="/myconnectedcare" className="mt-6 inline-block text-lg text-mcc-700 underline">Back to Home</Link>
      </div>
    </MccShell>
  );
}
