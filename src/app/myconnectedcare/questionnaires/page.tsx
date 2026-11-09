import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MccShell } from "@/components/MccShell";
import { formatDate, formatShort } from "@/lib/answers";

export const dynamic = "force-dynamic";
export const metadata = { title: "MyConnectedCare (prototype): Questionnaires" };

export default async function Questionnaires() {
  const user = await requireUser("mcc");
  const r = user.referral;
  const subs = r ? await prisma.intakeSubmission.findMany({ where: { referralId: r.id }, orderBy: { updatedAt: "desc" } }) : [];
  const submitted = subs.find((s) => s.status === "submitted");
  const draft = subs.find((s) => s.status === "draft");
  const status = submitted ? "Submitted" : draft ? "In progress" : "Not started";
  return (
    <MccShell active="questionnaires" name={user.name} badge={{ questionnaires: submitted || !r ? 0 : 1 }}>
      <h1 className="text-3xl font-bold text-mcc-900">Questionnaires</h1>
      {!r ? (
        <p className="mt-6 text-lg">You have no questionnaires.</p>
      ) : (
        <article className="mt-6 max-w-2xl rounded-2xl border-l-8 border-mcc-600 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-2xl font-bold">Oncology New Patient Intake</h2>
            <span className={`rounded-full px-3 py-1 text-base font-semibold ${submitted ? "bg-green-100 text-green-900" : draft ? "bg-amber-100 text-amber-900" : "bg-gray-100 text-gray-900"}`}>{status}</span>
          </div>
          <p className="mt-2 text-lg text-gray-800">From: Cancer Centre, {r.providerGroup}</p>
          {submitted ? (
            <p className="mt-1 text-lg text-gray-800">Sent to your care team on {formatShort(submitted.submittedAt)}.</p>
          ) : (
            <p className="mt-1 text-lg text-gray-800">Please complete before your appointment on {formatDate(r.appointmentAt)}. About 20 to 30 minutes.</p>
          )}
          <div className="mt-5">
            {submitted ? (
              <Link href="/myconnectedcare/questionnaires/intake/view" className="inline-block rounded-lg border-2 border-mcc-700 px-5 py-3 text-lg font-bold text-mcc-800 hover:bg-mcc-50">View submitted form</Link>
            ) : (
              <Link href="/myconnectedcare/questionnaires/intake" className="inline-block rounded-lg bg-mcc-700 px-6 py-3 text-lg font-bold text-white hover:bg-mcc-800">{draft ? "Continue Intake Form" : "Start Intake Form"}</Link>
            )}
          </div>
        </article>
      )}
    </MccShell>
  );
}
