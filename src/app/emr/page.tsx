import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { EmrTopBar } from "@/components/EmrShell";
import { formatShort } from "@/lib/answers";

export const dynamic = "force-dynamic";
export const metadata = { title: "Oracle Health EMR (prototype): Patient list" };

export default async function PatientList({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requireUser("emr");
  const q = ((await searchParams).q || "").trim().toLowerCase();
  const all = await prisma.referral.findMany({ orderBy: { appointmentAt: "asc" }, include: { documents: { orderBy: { createdAt: "desc" } } } });
  const refs = q ? all.filter((r) => `${r.firstName} ${r.lastName} ${r.lastName}, ${r.firstName} ${r.mrn}`.toLowerCase().includes(q)) : all;
  return (
    <div className="flex flex-1 flex-col bg-gray-100 text-[13px]">
      <EmrTopBar user={user} />
      <main className="p-3">
        <div className="border border-gray-300 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-300 bg-gray-50 px-3 py-2">
            <h1 className="text-sm font-bold text-emr-800">Patient List: Oncology New Patients</h1>
            <form className="flex gap-1" role="search">
              <label htmlFor="q" className="sr-only">Search patients</label>
              <input id="q" name="q" defaultValue={q} placeholder="Search name or MRN" className="w-56 border border-gray-400 px-2 py-1" />
              <button className="border border-gray-500 bg-white px-2 py-1 hover:bg-gray-100">Search</button>
            </form>
          </div>
          <table className="w-full text-left">
            <thead className="bg-emr-100 text-gray-800">
              <tr>
                <th className="px-3 py-1.5">Name</th><th className="px-3 py-1.5">MRN</th><th className="px-3 py-1.5">DOB</th><th className="px-3 py-1.5">Service</th><th className="px-3 py-1.5">Appointment</th><th className="px-3 py-1.5">Documents</th>
              </tr>
            </thead>
            <tbody>
              {refs.map((r) => (
                <tr key={r.id} className="border-t border-gray-200 hover:bg-emr-50">
                  <td className="px-3 py-1.5"><Link href={`/emr/patients/${r.id}/documents`} className="font-semibold text-emr-600 underline">{r.lastName}, {r.firstName}</Link></td>
                  <td className="px-3 py-1.5">{r.mrn}</td>
                  <td className="px-3 py-1.5">{r.dob}</td>
                  <td className="px-3 py-1.5">{r.providerGroup}</td>
                  <td className="px-3 py-1.5">{formatShort(r.appointmentAt)}</td>
                  <td className="px-3 py-1.5">{r.documents.length ? `${r.documents.length} new` : ""}</td>
                </tr>
              ))}
              {refs.length === 0 && <tr><td colSpan={6} className="px-3 py-4 text-center text-gray-600">No patients found.</td></tr>}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
