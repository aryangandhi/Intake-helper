import { MccFontSize, MccHeader } from "@/components/MccShell";
import { ReadOnlyAnswers } from "@/components/ReadOnlyAnswers";
import { EXAMPLE_ANSWERS, EXAMPLE_PATIENT } from "@/content/exampleForm";
import { buildRawData } from "@/lib/answers";

export const metadata = { title: "Example completed intake form" };

export default function ExamplePage() {
  const sections = buildRawData(EXAMPLE_ANSWERS, { ...EXAMPLE_PATIENT, appointmentAt: new Date() }, "patient").slice(1);
  return (
    <div className="flex flex-1 flex-col bg-mcc-50">
      <MccFontSize />
      <MccHeader />
      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        <h1 className="text-3xl font-bold text-mcc-900">Example of a completed intake form</h1>
        <p className="mt-2 text-lg text-gray-800">
          This is a made-up example for a pretend patient, &quot;Sam Example&quot;. It shows the kind of answers that help your care team. Your answers will be different.
        </p>
        <div className="mt-6">
          <ReadOnlyAnswers sections={sections} />
        </div>
      </main>
    </div>
  );
}
