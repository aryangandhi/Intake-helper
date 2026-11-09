const LABELS: Record<string, { label: string; cls: string }> = {
  referral_entered: { label: "Referral entered", cls: "bg-gray-100 text-gray-800 border-gray-300" },
  email_sent: { label: "Email sent", cls: "bg-blue-50 text-blue-800 border-blue-300" },
  in_progress: { label: "Form in progress", cls: "bg-amber-50 text-amber-900 border-amber-300" },
  submitted: { label: "Completed online", cls: "bg-green-50 text-green-800 border-green-300" },
  help_requested: { label: "Nurse call requested", cls: "bg-rose-50 text-rose-800 border-rose-300" },
  nurse_completed: { label: "Completed by nurse", cls: "bg-green-50 text-green-800 border-green-300" },
  coop_pending_review: { label: "Co-op: pending review", cls: "bg-purple-50 text-purple-800 border-purple-300" },
  in_emr: { label: "In EMR", cls: "bg-emerald-50 text-emerald-800 border-emerald-300" },
  new: { label: "New", cls: "bg-rose-50 text-rose-800 border-rose-300" },
  called: { label: "Called", cls: "bg-amber-50 text-amber-900 border-amber-300" },
  completed: { label: "Completed", cls: "bg-green-50 text-green-800 border-green-300" },
  pending: { label: "Pending review", cls: "bg-purple-50 text-purple-800 border-purple-300" },
  returned: { label: "Returned to student", cls: "bg-amber-50 text-amber-900 border-amber-300" },
  approved: { label: "Approved", cls: "bg-green-50 text-green-800 border-green-300" },
};

export function StatusChip({ status }: { status: string }) {
  const s = LABELS[status] || { label: status, cls: "bg-gray-100 text-gray-800 border-gray-300" };
  return <span className={`inline-block whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span>;
}
