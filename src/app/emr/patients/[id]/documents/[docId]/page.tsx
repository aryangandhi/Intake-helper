import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ChartLayout } from "@/components/EmrShell";
import { AutoRefresh, CopyButton, FlagLink, Statement, type CiteInfo } from "@/components/emr/Citations";
import { bannerAllergies } from "@/lib/emr";
import { buildRawData, flatRaw, formatShort, parseAnswers } from "@/lib/answers";
import type { CheckedSummary, ValidationReport } from "@/lib/ai/schema";
import { getQuestion } from "@/config/intakeQuestions";
import { copyToClinicNote, markVerified } from "../../../../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Oracle Health EMR (prototype): Oncology New Patient Intake" };

const WHO: Record<string, string> = { patient: "the patient online (MyConnectedCare)", nurse: "a nurse by phone", coop_student: "a co-op student by phone" };

export default async function DocumentView({ params }: { params: Promise<{ id: string; docId: string }> }) {
  const user = await requireUser("emr");
  const { id, docId } = await params;
  const doc = await prisma.eMRDocument.findUnique({ where: { id: docId }, include: { referral: true, submission: { include: { summary: true } } } });
  if (!doc || doc.referralId !== id) notFound();
  const sub = doc.submission;
  const audience = sub.completedBy === "patient" ? "patient" : "staff";
  const rawSections = buildRawData(parseAnswers(sub.answers), doc.referral, audience);
  const raw = flatRaw(rawSections);
  const cites: Record<string, CiteInfo> = {};
  raw.forEach((r, i) => (cites[r.field_id] = { n: i + 1, question: r.question, answer: r.answer || "Not answered" }));
  const summaryRow = sub.summary;
  const pending = doc.hasAISummary && summaryRow?.status !== "ready";
  const summary: CheckedSummary | null = summaryRow?.status === "ready" ? JSON.parse(summaryRow.content) : null;
  const validation: ValidationReport | null = summaryRow?.status === "ready" ? JSON.parse(summaryRow.validation) : null;
  const incomplete: string[] = JSON.parse(sub.incompleteFields || "[]");
  const isCoop = sub.completedBy === "coop_student";

  const plainSection = (heading: string) => (summary?.sections.find((s) => s.heading === heading)?.bullets || []).map((b) => `- ${b.text}`).join("\n");
  const flagged = summary ? summary.flagged : incomplete.map((f) => ({ field_id: f, note: `Not answered: ${getQuestion(f)?.label || f}` }));

  return (
    <ChartLayout r={doc.referral} active="documents" allergies={await bannerAllergies(doc.referralId)} user={user}>
      <AutoRefresh active={pending} />
      <Link href={`/emr/patients/${id}/documents`} className="text-emr-600 underline">← Documents</Link>
      <article className="mt-2 border border-gray-300 bg-white">
        <header className="border-b border-gray-300 bg-gray-50 px-4 py-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-base font-bold text-emr-800">{doc.type}</h1>
              <p className="mt-0.5 text-gray-800">
                {isCoop ? (
                  <strong>
                    Completed by co-op student {sub.completedByName}, reviewed by RN {sub.reviewedByName} on {formatShort(sub.reviewedAt)}
                  </strong>
                ) : (
                  <>
                    Completed by {WHO[sub.completedBy]}
                    {sub.completedBy === "nurse" && sub.completedByName ? ` (RN ${sub.completedByName})` : ""} on {formatShort(sub.submittedAt)}.{" "}
                    {summaryRow?.status === "ready" && (
                      <span className={summaryRow.isFallback ? "font-semibold text-amber-800" : ""}>
                        Summary: {summaryRow.isFallback ? "Template summary (AI unavailable)" : `AI model (${summaryRow.modelUsed})`}.
                      </span>
                    )}
                  </>
                )}
              </p>
              {doc.verifiedAt ? (
                <p className="mt-0.5 font-semibold text-green-800">✓ Verified by {doc.verifiedByName} on {formatShort(doc.verifiedAt)}</p>
              ) : doc.hasAISummary ? (
                <p className="mt-0.5 font-semibold text-amber-800">DRAFT: AI summary not yet verified by a clinician</p>
              ) : null}
            </div>
            <div className="flex gap-2">
              {doc.hasAISummary && !doc.verifiedAt && (
                <form action={markVerified.bind(null, doc.id)}>
                  <button disabled={pending} className="border border-green-700 bg-white px-3 py-1.5 font-semibold text-green-800 hover:bg-green-50 disabled:opacity-50">Mark as verified</button>
                </form>
              )}
              <form action={copyToClinicNote.bind(null, doc.id)}>
                <button disabled={pending} className="bg-emr-600 px-3 py-1.5 font-semibold text-white hover:bg-emr-700 disabled:opacity-50">Copy to clinic note</button>
              </form>
            </div>
          </div>
        </header>

        {doc.hasAISummary && (
          <>
            {pending ? (
              <div role="status" className="m-4 flex items-center gap-3 rounded border border-emr-100 bg-emr-50 p-4 text-sm">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-emr-600 border-t-transparent" aria-hidden="true" />
                Your care team&apos;s summary is being prepared…
              </div>
            ) : summary ? (
              <>
                <section className="border-b border-gray-200 px-4 py-3" aria-labelledby="ai-para">
                  <div className="flex items-center justify-between">
                    <h2 id="ai-para" className="text-sm font-bold uppercase tracking-wide text-emr-800">AI Summary (paragraph)</h2>
                    <CopyButton label="paragraph summary" text={summary.paragraph.map((s) => s.text).join(" ")} />
                  </div>
                  <p className="mt-2 max-w-4xl text-[14px] leading-7">
                    {summary.paragraph.map((s, i) => (
                      <span key={i}>
                        <Statement {...s} cites={cites} />{" "}
                      </span>
                    ))}
                  </p>
                </section>
                <section className="border-b border-gray-200 px-4 py-3" aria-labelledby="ai-points">
                  <h2 id="ai-points" className="text-sm font-bold uppercase tracking-wide text-emr-800">AI Summary (point form)</h2>
                  <div className="mt-2 grid gap-x-8 gap-y-3 lg:grid-cols-2">
                    {summary.sections.map((sec) => (
                      <div key={sec.heading}>
                        <div className="flex items-center justify-between border-b border-gray-200 pb-0.5">
                          <h3 className="font-semibold">{sec.heading}</h3>
                          <CopyButton label={sec.heading} text={plainSection(sec.heading)} />
                        </div>
                        <ul className="mt-1 list-disc space-y-1 pl-5 leading-6">
                          {sec.bullets.map((b, i) => (
                            <li key={i}>
                              <Statement {...b} cites={cites} />
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    <div className="lg:col-span-2">
                      <h3 className="border-b border-gray-200 pb-0.5 font-semibold text-red-800">Flagged / missing items</h3>
                      {flagged.length === 0 ? (
                        <p className="mt-1 text-gray-700">None.</p>
                      ) : (
                        <ul className="mt-1 list-disc space-y-1 pl-5">
                          {flagged.map((f, i) => (
                            <li key={i}>
                              {cites[f.field_id] ? <FlagLink fieldId={f.field_id}>{f.note}</FlagLink> : f.note}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                  {validation && validation.unsupported > 0 && (
                    <p className="mt-3 text-[12px] text-amber-900">
                      {validation.unsupported} of {validation.totalStatements} statements could not be linked to a patient answer and are highlighted in amber. Please verify them.
                    </p>
                  )}
                </section>
              </>
            ) : null}
          </>
        )}

        {isCoop && (
          <p className="border-b border-gray-200 bg-gray-50 px-4 py-2 text-gray-700">No AI summary for this intake (completed by co-op student). Raw form data only.</p>
        )}

        <section className="px-4 py-3" aria-labelledby="raw">
          <h2 id="raw" className="text-sm font-bold uppercase tracking-wide text-emr-800">Raw Form Data</h2>
          {isCoop && flagged.length > 0 && (
            <p className="mt-1 text-red-800">Incomplete: {flagged.map((f) => getQuestion(f.field_id)?.label || f.field_id).join("; ")}</p>
          )}
          {rawSections.map((s) => (
            <div key={s.id} className="mt-3">
              <h3 className="bg-emr-100 px-2 py-1 font-semibold">{s.title}</h3>
              <table className="w-full">
                <tbody>
                  {s.items.map((it) => (
                    <tr key={it.field_id} id={`raw-${it.field_id}`} tabIndex={-1} className="border-b border-gray-100 align-top outline-none">
                      <td className="w-10 px-2 py-1 text-[11px] text-gray-500">[{cites[it.field_id].n}]</td>
                      <td className="w-[45%] py-1 pr-3 text-gray-700">{it.question}</td>
                      <td className={`py-1 ${it.answer ? "font-medium" : it.incomplete ? "font-semibold text-red-700" : "text-gray-500"}`}>{it.answer || (it.incomplete ? "Incomplete (not answered)" : "Not answered")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </section>
      </article>
    </ChartLayout>
  );
}
