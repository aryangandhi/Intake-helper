"use client";
import { useActionState } from "react";

type Note = Record<string, string>;
const FIELDS: [string, string, number][] = [
  ["medicalHistory", "Medical History", 8],
  ["currentMedications", "Current Medications", 5],
  ["allergies", "Allergies", 2],
  ["socialHistory", "Social History", 4],
  ["familyHistory", "Family History", 3],
  ["examination", "Examination/Assessment", 4],
  ["plan", "Plan", 4],
  ["followUp", "Follow-up", 2],
];

export function NoteEditor({ note, save }: { note: Note; save: (prev: string | null, fd: FormData) => Promise<string> }) {
  const [msg, action, pending] = useActionState(save, null);
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="noteDate" className="block font-semibold">Date</label>
          <input id="noteDate" name="noteDate" type="date" defaultValue={note.noteDate} className="mt-0.5 w-full border border-gray-400 px-2 py-1" />
        </div>
        <div>
          <label htmlFor="oncologist" className="block font-semibold">Oncologist</label>
          <input id="oncologist" name="oncologist" defaultValue={note.oncologist} className="mt-0.5 w-full border border-gray-400 px-2 py-1" />
        </div>
      </div>
      {FIELDS.map(([id, label, rows]) => (
        <div key={id}>
          <label htmlFor={id} className="block font-semibold text-emr-800">{label}</label>
          <textarea id={id} name={id} rows={rows} defaultValue={note[id]} className="mt-0.5 w-full border border-gray-400 px-2 py-1 font-mono text-[13px] leading-5" />
        </div>
      ))}
      <div className="flex items-center gap-3">
        <button disabled={pending} className="bg-emr-600 px-4 py-1.5 font-semibold text-white hover:bg-emr-700">{pending ? "Saving…" : "Save note"}</button>
        {msg && <span role="status" className="text-green-800">{msg}</span>}
      </div>
    </form>
  );
}
