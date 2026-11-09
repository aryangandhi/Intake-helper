import type { RawSection } from "@/lib/answers";

export function ReadOnlyAnswers({ sections }: { sections: RawSection[] }) {
  return (
    <div className="space-y-6">
      {sections.map((s) => (
        <section key={s.id} className="rounded-xl border border-gray-300 bg-white p-5">
          <h2 className="text-xl font-bold text-mcc-900">{s.title}</h2>
          <dl className="mt-3 divide-y">
            {s.items.map((i) => (
              <div key={i.field_id} className="py-3">
                <dt className="font-semibold text-gray-900">{i.question}</dt>
                <dd className={`mt-1 ${i.answer ? "text-gray-800" : "italic text-gray-600"}`}>{i.answer || "Not answered"}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
