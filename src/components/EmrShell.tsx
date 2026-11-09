import Link from "next/link";
import { emrLogout } from "@/app/emr/actions";
import { ageFromDob } from "@/lib/answers";
import { LOGIN_DISABLED } from "@/lib/auth";

export function EmrTopBar({ user }: { user?: { name: string; role: string } }) {
  return (
    <header className="flex items-center justify-between bg-emr-800 px-3 py-1.5 text-xs text-white">
      <div className="flex items-center gap-4">
        <Link href="/emr" className="text-sm font-semibold tracking-wide">Oracle Health EMR <span className="font-normal text-emr-100">(prototype)</span></Link>
        {user && <Link href="/emr" className="rounded px-2 py-0.5 hover:bg-emr-700">Patient List</Link>}
      </div>
      {user && (
        <form action={emrLogout} className="flex items-center gap-3">
          <span>{user.role === "nurse" ? `RN ${user.name}` : user.name}</span>
          <button className="rounded border border-white/40 px-2 py-0.5 hover:bg-emr-700">{LOGIN_DISABLED ? "Switch user" : "Log out"}</button>
        </form>
      )}
    </header>
  );
}

type R = { id: string; firstName: string; lastName: string; dob: string; sex: string; mrn: string; providerGroup: string };

export function PatientBanner({ r, allergies }: { r: R; allergies: string }) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 border-b-2 border-emr-600 bg-emr-50 px-3 py-2 text-xs md:grid-cols-[auto_auto_auto_1fr]">
      <div className="col-span-2 text-lg font-bold text-emr-800 md:col-span-1 md:row-span-2 md:pr-6">{r.lastName}, {r.firstName}</div>
      <div><span className="text-gray-600">DOB:</span> {r.dob}</div>
      <div><span className="text-gray-600">Age:</span> {ageFromDob(r.dob)} years</div>
      <div><span className="text-gray-600">MRN:</span> {r.mrn}</div>
      <div><span className="text-gray-600">Sex:</span> {r.sex || "Not recorded"}</div>
      <div><span className="text-gray-600">Service:</span> {r.providerGroup}</div>
      <div className={allergies.startsWith("No") ? "" : "font-semibold text-red-800"}><span className="font-normal text-gray-600">Allergies:</span> {allergies}</div>
    </div>
  );
}

export function ChartLayout({ r, active, allergies, user, children }: { r: R; active: "documents" | "notes"; allergies: string; user: { name: string; role: string }; children: React.ReactNode }) {
  const item = (key: string, href: string, label: string) => (
    <li>
      <Link href={href} aria-current={active === key ? "page" : undefined} className={`block border-l-4 px-3 py-1.5 ${active === key ? "border-emr-600 bg-white font-semibold text-emr-800" : "border-transparent text-gray-800 hover:bg-white"}`}>
        {label}
      </Link>
    </li>
  );
  return (
    <div className="flex flex-1 flex-col bg-gray-100 text-[13px]">
      <EmrTopBar user={user} />
      <PatientBanner r={r} allergies={allergies} />
      <div className="flex flex-1">
        <nav aria-label="Chart menu" className="w-44 shrink-0 border-r border-gray-300 bg-gray-200 py-2">
          <p className="px-3 pb-1 text-[11px] font-bold uppercase text-gray-600">Menu</p>
          <ul>
            {item("documents", `/emr/patients/${r.id}/documents`, "Documents")}
            {item("notes", `/emr/patients/${r.id}/notes`, "Clinic Notes")}
          </ul>
        </nav>
        <main className="min-w-0 flex-1 p-3">{children}</main>
      </div>
    </div>
  );
}
