import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ChartLayout } from "@/components/EmrShell";
import { bannerAllergies } from "@/lib/emr";
import { saveClinicNote } from "@/app/emr/actions";
import { NoteEditor } from "./NoteEditor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Oracle Health EMR (prototype): Clinic Notes" };

export default async function Notes({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ copied?: string }> }) {
  const user = await requireUser("emr");
  const { id } = await params;
  const sp = await searchParams;
  const r = await prisma.referral.findUnique({ where: { id }, include: { clinicNote: true } });
  if (!r) notFound();
  const n = r.clinicNote;
  const note = {
    noteDate: n?.noteDate || new Date().toISOString().slice(0, 10),
    oncologist: n?.oncologist || (user.role === "oncologist" ? user.name : ""),
    medicalHistory: n?.medicalHistory || "",
    currentMedications: n?.currentMedications || "",
    allergies: n?.allergies || "",
    socialHistory: n?.socialHistory || "",
    familyHistory: n?.familyHistory || "",
    examination: n?.examination || "",
    plan: n?.plan || "",
    followUp: n?.followUp || "",
  };
  return (
    <ChartLayout r={r} active="notes" allergies={await bannerAllergies(r.id)} user={user}>
      <div className="border border-gray-300 bg-white">
        <h1 className="border-b border-gray-300 bg-gray-50 px-3 py-1.5 text-sm font-bold text-emr-800">Clinic Notes: Oncology Consultation Note</h1>
        <div className="p-4">
          {sp.copied && (
            <p role="status" className="mb-3 border border-green-300 bg-green-50 px-3 py-2 text-green-900">
              Intake summary copied into Medical History, Current Medications, Allergies, Social History and Family History. Review and edit, then save.
            </p>
          )}
          {!n && !sp.copied && (
            <p className="mb-3 text-gray-700">
              No note yet. Use <strong>Copy to clinic note</strong> on the intake document in <Link href={`/emr/patients/${r.id}/documents`} className="text-emr-600 underline">Documents</Link>, or start typing.
            </p>
          )}
          <NoteEditor key={r.id} note={note} save={saveClinicNote.bind(null, r.id)} />
        </div>
      </div>
    </ChartLayout>
  );
}
