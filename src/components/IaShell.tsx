import Link from "next/link";
import { prisma } from "@/lib/db";
import { iaLogout } from "@/app/intake-assistant/actions";
import { LOGIN_DISABLED } from "@/lib/auth";

type U = { name: string; role: string; id: string };

export async function IaShell({ user, active, children }: { user: U; active: string; children: React.ReactNode }) {
  const unread = user.role === "nurse" ? await prisma.helpRequest.count({ where: { read: false } }) : 0;
  const pending = user.role === "nurse" ? await prisma.intakeSubmission.count({ where: { completedBy: "coop_student", status: "submitted", reviewStatus: "pending" } }) : 0;
  const returned = user.role === "coop" ? await prisma.intakeSubmission.count({ where: { completedByUserId: user.id, reviewStatus: "returned" } }) : 0;
  const nav: { key: string; href: string; label: string; badge?: number }[] =
    user.role === "admin"
      ? [
          { key: "referrals", href: "/intake-assistant/referrals", label: "Referrals" },
          { key: "upcoming", href: "/intake-assistant/upcoming", label: "Upcoming intakes" },
        ]
      : user.role === "nurse"
        ? [
            { key: "notifications", href: "/intake-assistant/notifications", label: "Notifications", badge: unread },
            { key: "upcoming", href: "/intake-assistant/upcoming", label: "Upcoming intakes" },
            { key: "review", href: "/intake-assistant/review", label: "Co-op review queue", badge: pending },
            { key: "referrals", href: "/intake-assistant/referrals", label: "Referrals" },
          ]
        : [
            { key: "upcoming", href: "/intake-assistant/upcoming", label: "Upcoming intakes" },
            { key: "my-intakes", href: "/intake-assistant/my-intakes", label: "My submitted intakes", badge: returned },
          ];
  const roleLabel = user.role === "admin" ? "Admin" : user.role === "nurse" ? "Registered Nurse" : "Co-op Student";
  return (
    <div className="flex flex-1 flex-col bg-slate-50 text-[15px]">
      <header className="flex items-center justify-between bg-ia-700 px-5 py-2.5 text-white">
        <Link href="/intake-assistant" className="flex items-center gap-2 font-semibold">
          <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-md bg-white font-bold text-ia-700">IA</span>
          Intake Assistant <span className="text-sm font-normal text-ia-100">· Cancer Centre (prototype)</span>
        </Link>
        <form action={iaLogout} className="flex items-center gap-3 text-sm">
          <span>
            {user.name} <span className="rounded bg-white/15 px-1.5 py-0.5 text-xs">{roleLabel}</span>
          </span>
          <button className="rounded border border-white/50 px-2 py-1 hover:bg-ia-600">{LOGIN_DISABLED ? "Switch role" : "Sign out"}</button>
        </form>
      </header>
      <div className="flex flex-1">
        <nav aria-label="Intake Assistant" className="w-56 shrink-0 border-r border-slate-200 bg-white py-4">
          <ul>
            {nav.map((n) => (
              <li key={n.key}>
                <Link
                  href={n.href}
                  aria-current={active === n.key ? "page" : undefined}
                  className={`flex items-center justify-between px-5 py-2.5 ${active === n.key ? "border-l-4 border-ia-600 bg-ia-50 font-semibold text-ia-800" : "text-slate-700 hover:bg-slate-50"}`}
                >
                  {n.label}
                  {n.badge ? (
                    <span className="rounded-full bg-red-600 px-2 text-xs font-bold text-white" aria-label={`${n.badge} new`}>
                      {n.badge}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <main className="min-w-0 flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

export function PageTitle({ title, sub, right }: { title: string; sub?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        {sub && <p className="mt-1 text-slate-600">{sub}</p>}
      </div>
      {right}
    </div>
  );
}
