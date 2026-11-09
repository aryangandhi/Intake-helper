import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { IaShell, PageTitle } from "@/components/IaShell";
import { StatusChip } from "@/components/StatusChip";
import { Email } from "@/components/Email";
import { formatShort } from "@/lib/answers";

export const dynamic = "force-dynamic";
export const metadata = { title: "Intake Assistant: Patient" };

const WHO: Record<string, string> = { patient: "Patient (online)", nurse: "Nurse (phone)", coop_student: "Co-op student (phone)" };

export default async function PatientDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ done?: string }> }) {
  const user = await requireUser("ia");
  const { id } = await params;
  const sp = await searchParams;
  const r = await prisma.referral.findUnique({
    where: { id },
    include: { submissions: { orderBy: { updatedAt: "desc" } }, helpRequests: { orderBy: { createdAt: "desc" } } },
  });
  if (!r) notFound();
  const submitted = r.submissions.filter((s) => s.status === "submitted");
  const done = submitted.some((s) => s.completedBy !== "coop_student" || s.reviewStatus !== "returned");
  const openHelp = r.helpRequests.find((h) => h.status !== "completed");
  const canStart = (user.role === "nurse" || user.role === "coop") && !done;
  const returned = submitted.find((s) => s.reviewStatus === "returned");
  const params2 = new URLSearchParams();
  if (openHelp && user.role === "nurse") params2.set("help", openHelp.id);
  if (returned && user.role === "coop") params2.set("sub", returned.id);
  const qs = params2.toString() ? `?${params2}` : "";
  return (
    <IaShell user={user} active="upcoming">
      <Link href="/intake-assistant/upcoming" className="text-sm text-ia-700 underline">← Upcoming intakes</Link>
      {sp.done === "nurse" && (
        <p role="status" className="my-4 rounded-md border border-green-300 bg-green-50 px-4 py-3 text-green-900">
          Intake submitted. The AI summary is being prepared and the intake document will appear in the patient&apos;s EMR chart.
        </p>
      )}
      {sp.done === "coop" && (
        <p role="status" className="my-4 rounded-md border border-green-300 bg-green-50 px-4 py-3 text-green-900">
          Intake submitted. It has been sent to the nurse review queue.
        </p>
      )}
      <PageTitle title={`${r.lastName}, ${r.firstName}`} sub={<>DOB {r.dob} · MRN {r.mrn} · {r.phone} · <Email value={r.email} /></>} right={<StatusChip status={r.status} />} />
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="font-semibold">Appointment</h2>
            <p className="mt-1 text-sm">{formatShort(r.appointmentAt)} · {r.providerGroup}</p>
            <p className="mt-1 text-sm text-slate-600">Intake email: {r.emailSentAt ? `sent ${formatShort(r.emailSentAt)}` : `scheduled ${formatShort(r.emailScheduledAt)}`}</p>
          </section>
          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="font-semibold">Intake submissions</h2>
            {r.submissions.length === 0 && <p className="mt-1 text-sm text-slate-600">Nothing yet.</p>}
            <ul className="mt-2 space-y-2 text-sm">
              {r.submissions.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center gap-2">
                  {s.status === "draft" ? (
                    <span>Patient started the online form (last saved {formatShort(s.updatedAt)})</span>
                  ) : (
                    <span>
                      Submitted {formatShort(s.submittedAt)} by {WHO[s.completedBy]} {s.completedByName && `(${s.completedByName})`}
                    </span>
                  )}
                  {s.reviewStatus && <StatusChip status={s.reviewStatus} />}
                </li>
              ))}
            </ul>
          </section>
          {r.helpRequests.length > 0 && (
            <section className="rounded-lg border border-slate-200 bg-white p-4">
              <h2 className="font-semibold">Nurse call requests</h2>
              <ul className="mt-2 space-y-1 text-sm">
                {r.helpRequests.map((h) => (
                  <li key={h.id}>
                    {formatShort(h.createdAt)}: {h.language}, {h.bestTime} <StatusChip status={h.status} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
        <aside className="h-fit space-y-3 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="font-semibold">Actions</h2>
          {canStart ? (
            <Link href={`/intake-assistant/powerform/${r.id}${qs}`} className="block rounded-md bg-ia-600 px-4 py-2.5 text-center font-semibold text-white hover:bg-ia-700">
              Start PowerForm
            </Link>
          ) : (
            <p className="text-sm text-slate-700">{done ? "The intake for this patient has been completed." : "No actions available for your role."}</p>
          )}
        </aside>
      </div>
    </IaShell>
  );
}
