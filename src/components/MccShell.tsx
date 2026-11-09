import Link from "next/link";
import { mccLogout } from "@/app/myconnectedcare/actions";
import { LOGIN_DISABLED } from "@/lib/auth";

const NAV = [
  { key: "home", href: "/myconnectedcare", label: "Home", icon: "M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" },
  { key: "questionnaires", href: "/myconnectedcare/questionnaires", label: "Questionnaires", icon: "M9 5h10M9 12h10M9 19h10M4 5h.01M4 12h.01M4 19h.01" },
  { key: "appointments", href: "/myconnectedcare/appointments", label: "Appointments", icon: "M8 2v4M16 2v4M3 9h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" },
  { key: "messages", href: "/myconnectedcare/messages", label: "Messages", icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
];

export function MccFontSize() {
  // Larger default font for the patient portal (many patients are older adults).
  return <style>{`html{font-size:18px}`}</style>;
}

export function MccHeader({ name }: { name?: string }) {
  return (
    <header className="bg-mcc-800 text-white">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <Link href="/myconnectedcare" className="flex items-center gap-2 text-xl font-bold">
          <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-mcc-800">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7-4.4-9.3-9A5.4 5.4 0 0 1 12 6a5.4 5.4 0 0 1 9.3 6c-2.3 4.6-9.3 9-9.3 9z" /></svg>
          </span>
          <span>
            MyConnectedCare <span className="text-sm font-normal text-mcc-100">(prototype)</span>
          </span>
        </Link>
        {name && (
          <form action={mccLogout} className="flex items-center gap-3">
            <span className="hidden text-base sm:inline">{name}</span>
            {!LOGIN_DISABLED && <button className="rounded-md border border-white/60 px-3 py-1 text-base hover:bg-mcc-700">Log out</button>}
          </form>
        )}
      </div>
    </header>
  );
}

export function MccShell({ active, name, badge, children }: { active: string; name: string; badge?: Record<string, number>; children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col bg-mcc-50">
      <MccFontSize />
      <MccHeader name={name} />
      <div className="flex flex-1 flex-col md:flex-row">
        <nav aria-label="Main" className="border-b border-mcc-100 bg-white md:w-60 md:border-b-0 md:border-r">
          <ul className="flex overflow-x-auto md:flex-col md:py-4">
            {NAV.map((n) => {
              const on = active === n.key;
              return (
                <li key={n.key} className="shrink-0">
                  <Link
                    href={n.href}
                    aria-current={on ? "page" : undefined}
                    className={`flex items-center gap-3 px-4 py-3 text-base md:text-lg ${on ? "border-b-4 border-mcc-700 bg-mcc-50 font-bold text-mcc-900 md:border-b-0 md:border-l-4" : "text-gray-800 hover:bg-gray-50"}`}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={n.icon} /></svg>
                    {n.label}
                    {badge?.[n.key] ? <span className="ml-auto rounded-full bg-red-700 px-2 text-sm font-bold text-white" aria-label={`${badge[n.key]} new`}>{badge[n.key]}</span> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <main className="flex-1 px-4 py-6 md:px-10 md:py-8">{children}</main>
      </div>
    </div>
  );
}
