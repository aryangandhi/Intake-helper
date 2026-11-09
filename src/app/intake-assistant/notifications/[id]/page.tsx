import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { IaShell, PageTitle } from "@/components/IaShell";
import { StatusChip } from "@/components/StatusChip";
import { formatShort } from "@/lib/answers";
import { setHelpStatus } from "../../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Intake Assistant: Nurse call request" };

export default async function HelpDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("ia", ["nurse"]);
  const { id } = await params;
  const h = await prisma.helpRequest.findUnique({ where: { id }, include: { referral: true } });
  if (!h) notFound();
  if (!h.read) await prisma.helpRequest.update({ where: { id }, data: { read: true } });
  const r = h.referral;
  const row = (k: string, v: React.ReactNode) => (
    <div className="grid grid-cols-[11rem_1fr] border-t px-4 py-2 text-sm">
      <dt className="text-slate-600">{k}</dt>
      <dd className="font-medium">{v}</dd>
    </div>
  );
  return (
    <IaShell user={user} active="notifications">
      <Link href="/intake-assistant/notifications" className="text-sm text-ia-700 underline">← All notifications</Link>
      <PageTitle title={`Nurse call requested: ${h.name}`} sub={`Requested ${formatShort(h.createdAt)} from ${h.source === "portal" ? "the MyConnectedCare intake form" : "the intake email"}`} right={<StatusChip status={h.status} />} />
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <dl className="rounded-lg border border-slate-200 bg-white">
          <h2 className="px-4 py-3 font-semibold">Patient details</h2>
          {row("Name", h.name)}
          {row("Date of birth", h.dob)}
          {row("Phone", h.phone)}
          {row("Preferred language", h.language)}
          {row("Best time to call", h.bestTime)}
          {row("Note from patient", h.notes || "None")}
          {r && row("First appointment", `${formatShort(r.appointmentAt)} · ${r.providerGroup}`)}
          {r && row("MRN", r.mrn)}
        </dl>
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="font-semibold">Actions</h2>
          {h.status === "completed" ? (
            <p className="text-sm text-slate-700">Intake completed. It has been sent to the EMR.</p>
          ) : r ? (
            <Link href={`/intake-assistant/powerform/${r.id}?help=${h.id}`} className="block rounded-md bg-ia-600 px-4 py-2.5 text-center font-semibold text-white hover:bg-ia-700">
              Start PowerForm
            </Link>
          ) : (
            <p className="text-sm text-red-700">No matching referral found for this patient.</p>
          )}
          {h.status === "new" && (
            <form action={setHelpStatus.bind(null, h.id, "called")}>
              <button className="w-full rounded-md border border-slate-400 px-4 py-2 text-sm hover:bg-slate-50">Mark as called (no answer / call booked)</button>
            </form>
          )}
        </div>
      </div>
    </IaShell>
  );
}
