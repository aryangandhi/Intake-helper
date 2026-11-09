import { redirect } from "next/navigation";
import { currentUser, LOGIN_DISABLED } from "@/lib/auth";
import { RolePicker } from "@/components/RolePicker";
import { iaQuickLogin } from "../actions";
import { DemoCredentials } from "@/components/DemoCredentials";
import { IaLoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Intake Assistant: Sign in" };

export default async function Page() {
  if (await currentUser("ia")) redirect("/intake-assistant");
  return (
    <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-ia-50 to-slate-100 px-4 py-12">
      <div className="w-full max-w-sm rounded-xl bg-white p-7 shadow-lg">
        <div className="mb-5 flex items-center gap-2">
          <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-md bg-ia-600 font-bold text-white">IA</span>
          <div>
            <h1 className="text-xl font-semibold">Intake Assistant</h1>
            <p className="text-sm text-slate-600">Cancer Centre staff portal (prototype)</p>
          </div>
        </div>
        {LOGIN_DISABLED ? (
          <RolePicker
            action={iaQuickLogin}
            buttonClass="rounded-md bg-ia-600 px-4 py-2 font-semibold text-white hover:bg-ia-700"
            accounts={[
              { label: "Admin (Alex Morgan)", email: "admin@wrhn-demo.ca" },
              { label: "Nurse (Priya Patel)", email: "nurse@wrhn-demo.ca" },
              { label: "Co-op student (Jordan Lee)", email: "coop@wrhn-demo.ca" },
            ]}
          />
        ) : (
          <>
            <IaLoginForm />
            <DemoCredentials
              accounts={[
                { label: "Admin", email: "admin@wrhn-demo.ca" },
                { label: "Nurse", email: "nurse@wrhn-demo.ca" },
                { label: "Co-op student", email: "coop@wrhn-demo.ca" },
              ]}
            />
          </>
        )}
      </div>
    </div>
  );
}
