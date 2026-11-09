import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ChartLayout } from "@/components/EmrShell";
import { bannerAllergies } from "@/lib/emr";
import { formatShort } from "@/lib/answers";

export const dynamic = "force-dynamic";
export const metadata = { title: "Oracle Health EMR (prototype): Documents" };

const WHO: Record<string, string> = { patient: "Patient (online)", nurse: "Nurse (phone)", coop_student: "Co-op student (phone)" };

export default async function Documents({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("emr");
  const { id } = await params;
  const r = await prisma.referral.findUnique({ where: { id }, include: { documents: { orderBy: { createdAt: "desc" }, include: { submission: true } } } });
  if (!r) notFound();
  return (
    <ChartLayout r={r} active="documents" allergies={await bannerAllergies(r.id)} user={user}>
      <div className="border border-gray-300 bg-white">
        <h1 className="border-b border-gray-300 bg-gray-50 px-3 py-1.5 text-sm font-bold text-emr-800">Documents</h1>
        <table className="w-full text-left">
          <thead className="bg-emr-100"><tr><th className="px-3 py-1.5">Date</th><th className="px-3 py-1.5">Document</th><th className="px-3 py-1.5">Completed by</th><th className="px-3 py-1.5">Status</th></tr></thead>
          <tbody>
            {r.documents.length === 0 && <tr><td colSpan={4} className="px-3 py-4 text-center text-gray-600">No documents.</td></tr>}
            {r.documents.map((d) => (
              <tr key={d.id} className="border-t border-gray-200 hover:bg-emr-50">
                <td className="px-3 py-1.5">{formatShort(d.createdAt)}</td>
                <td className="px-3 py-1.5"><Link href={`/emr/patients/${r.id}/documents/${d.id}`} className="font-semibold text-emr-600 underline">{d.type}</Link></td>
                <td className="px-3 py-1.5">{WHO[d.submission.completedBy]}</td>
                <td className="px-3 py-1.5">{d.verifiedAt ? `Verified by ${d.verifiedByName}` : d.hasAISummary ? "Draft: needs verification" : "Reviewed by RN"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChartLayout>
  );
}
