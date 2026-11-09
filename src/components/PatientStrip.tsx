import { ageFromDob, formatShort } from "@/lib/answers";

export function PatientStrip({ r }: { r: { firstName: string; lastName: string; dob: string; phone: string; mrn: string; providerGroup: string; appointmentAt: Date } }) {
  return (
    <div className="mb-3 flex flex-wrap gap-x-6 gap-y-1 rounded border border-ia-100 bg-ia-50 px-4 py-2 text-sm">
      <span className="font-semibold">{r.lastName.toUpperCase()}, {r.firstName}</span>
      <span>DOB {r.dob} ({ageFromDob(r.dob)} y)</span>
      <span>MRN {r.mrn}</span>
      <span>Phone {r.phone}</span>
      <span>Appt {formatShort(r.appointmentAt)} · {r.providerGroup}</span>
    </div>
  );
}
