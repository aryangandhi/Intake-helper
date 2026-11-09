import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { MccFontSize, MccHeader } from "@/components/MccShell";
import { DemoCredentials } from "@/components/DemoCredentials";
import { LoginForm, SignupForm } from "./forms";

export const dynamic = "force-dynamic";
export const metadata = { title: "MyConnectedCare (prototype): Log in" };

export default async function Page({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  if (await currentUser("mcc")) redirect("/myconnectedcare");
  const signup = (await searchParams).mode === "signup";
  const tab = (on: boolean) => `flex-1 py-3 text-center text-lg font-semibold ${on ? "border-b-4 border-mcc-700 text-mcc-900" : "text-gray-700 hover:bg-gray-50"}`;
  return (
    <div className="flex flex-1 flex-col bg-mcc-50">
      <MccFontSize />
      <MccHeader />
      <main className="mx-auto w-full max-w-md px-4 py-8">
        <div className="rounded-2xl bg-white p-6 shadow">
          <h1 className="text-2xl font-bold text-mcc-900">Welcome to MyConnectedCare</h1>
          <p className="mt-1 text-gray-800">Your secure patient portal.</p>
          <div className="mt-5 flex border-b">
            <Link href="/myconnectedcare/login" className={tab(!signup)} aria-current={!signup ? "page" : undefined}>Log in</Link>
            <Link href="/myconnectedcare/login?mode=signup" className={tab(signup)} aria-current={signup ? "page" : undefined}>Sign up</Link>
          </div>
          <div className="mt-5">{signup ? <SignupForm /> : <LoginForm />}</div>
          <DemoCredentials accounts={[{ label: "Patient", email: "jane.doe@example.com" }, { label: "Sign up (no account yet)", email: "robert.chen@example.com, DOB 1960-11-21" }]} />
        </div>
      </main>
    </div>
  );
}
