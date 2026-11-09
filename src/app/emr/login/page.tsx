import { redirect } from "next/navigation";
import { currentUser, LOGIN_DISABLED } from "@/lib/auth";
import { RolePicker } from "@/components/RolePicker";
import { emrQuickLogin } from "../actions";
import { DemoCredentials } from "@/components/DemoCredentials";
import { EmrTopBar } from "@/components/EmrShell";
import { EmrLoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Oracle Health EMR (prototype): Log in" };

export default async function Page() {
  if (await currentUser("emr", { noDefault: true })) redirect("/emr");
  return (
    <div className="flex flex-1 flex-col bg-gray-200">
      <EmrTopBar />
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-xs border border-gray-400 bg-white shadow">
          <div className="bg-emr-600 px-4 py-2 text-sm font-semibold text-white">Oracle Health EMR (prototype)</div>
          <div className="p-4">
            {LOGIN_DISABLED ? (
              <RolePicker
                action={emrQuickLogin}
                buttonClass="bg-emr-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emr-700"
                accounts={[{ label: "Oncologist (Dr. Maria Santos)", email: "oncologist@wrhn-demo.ca" }, { label: "Nurse (Priya Patel)", email: "nurse@wrhn-demo.ca" }]}
              />
            ) : (
              <>
                <EmrLoginForm />
                <DemoCredentials accounts={[{ label: "Oncologist", email: "oncologist@wrhn-demo.ca" }, { label: "Nurse", email: "nurse@wrhn-demo.ca" }]} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
