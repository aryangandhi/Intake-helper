import Link from "next/link";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { DemoCredentials } from "@/components/DemoCredentials";
import { Email } from "@/components/Email";
import { formatShort } from "@/lib/answers";
import { InboxLoginForm } from "./LoginForm";
import { inboxLogout, markRead } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mail (simulated)" };

function MailHeader({ email }: { email?: string }) {
  return (
    <header className="flex items-center justify-between bg-slate-800 px-4 py-3 text-white">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 6-10 7L2 6" /></svg>
        Mail <span className="text-sm font-normal text-slate-300">(simulated email inbox)</span>
      </div>
      {email && (
        <form action={inboxLogout} className="flex items-center gap-3 text-sm">
          <span className="hidden sm:inline"><Email value={email} /></span>
          <button className="rounded border border-slate-400 px-2 py-1 hover:bg-slate-700">Sign out</button>
        </form>
      )}
    </header>
  );
}

export default async function InboxPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  // The inbox always asks which patient you are (even in demo mode), so each demo round can use a new patient.
  const inboxEmail = (await cookies()).get("proto_inbox")?.value;
  const user = inboxEmail ? { email: inboxEmail } : null;
  if (!user) {
    return (
      <div className="flex flex-1 flex-col bg-slate-100">
        <MailHeader />
        <main className="mx-auto w-full max-w-md px-4 py-12">
          <div className="rounded-xl bg-white p-6 shadow">
            <h1 className="mb-4 text-2xl font-bold">Sign in to your email</h1>
            <InboxLoginForm />
            <DemoCredentials accounts={[{ label: "Patient (Jane Doe)", email: "jane.doe@example.com" }, { label: "Any new referral", email: "the email the admin entered" }]} />
          </div>
        </main>
      </div>
    );
  }
  const sp = await searchParams;
  const emails = await prisma.email.findMany({ where: { to: user.email }, orderBy: { sentAt: "desc" } });
  const open = emails.find((e) => e.id === sp.id) || null;
  if (open && !open.read) await markRead(open.id);

  return (
    <div className="flex flex-1 flex-col bg-slate-100">
      <MailHeader email={user.email} />
      <main className="flex flex-1 flex-col md:flex-row">
        <nav aria-label="Inbox" className={`${open ? "hidden md:block" : "block"} w-full border-r border-slate-300 bg-white md:w-96`}>
          <h1 className="border-b px-4 py-3 text-lg font-bold">Inbox</h1>
          {emails.length === 0 && <p className="px-4 py-6 text-gray-600">No emails yet.</p>}
          <ul>
            {emails.map((e) => (
              <li key={e.id}>
                <Link href={`/inbox?id=${e.id}`} className={`block border-b px-4 py-3 hover:bg-blue-50 ${open?.id === e.id ? "bg-blue-50" : ""}`}>
                  <div className="flex justify-between gap-2 text-sm">
                    <span className={e.read ? "text-gray-700" : "font-bold"}>Cancer Centre Intake</span>
                    <span className="text-gray-600">{e.sentAt.toLocaleDateString("en-CA", { month: "short", day: "numeric" })}</span>
                  </div>
                  <div className={`mt-1 ${e.read ? "text-gray-800" : "font-bold"}`}>{e.subject}</div>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <section className={`${open ? "block" : "hidden md:block"} flex-1 p-4 md:p-8`}>
          {open ? (
            <article className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow">
              <Link href="/inbox" className="mb-4 inline-block text-blue-800 underline md:hidden">← Back to inbox</Link>
              <h2 className="text-2xl font-bold">{open.subject}</h2>
              <p className="mt-2 text-sm text-gray-600">
                From: Cancer Centre New Patient Intake &lt;<Email value="intake@cancercentre-demo.ca" />&gt; · To: <Email value={open.to} /> · {formatShort(open.sentAt)}
              </p>
              <div className="email-body mt-6 text-lg" dangerouslySetInnerHTML={{ __html: open.bodyHtml.replace('href="/myconnectedcare"', `href="/myconnectedcare/open?ref=${open.referralId}"`).replace(/<a /g, '<a target="_blank" ') }} />
            </article>
          ) : (
            <p className="mt-20 text-center text-gray-600">Select an email to read it.</p>
          )}
        </section>
      </main>
    </div>
  );
}
