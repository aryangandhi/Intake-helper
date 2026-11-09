"use client";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Question, Section } from "@/config/intakeQuestions";
import { isAnswered, isVisible, type AnswerValue, type Answers } from "@/lib/answers";
import { QuestionInput, speak, useSpeechRecognitionSupported } from "./QuestionInput";

export function PatientIntakeForm({
  sections,
  initialAnswers,
  referralId,
  saveDraft,
  submit,
}: {
  sections: Section[];
  initialAnswers: Answers;
  referralId: string;
  saveDraft: (a: Answers) => Promise<void>;
  submit: (a: Answers) => Promise<void>;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [step, setStep] = useState(0); // sections.length === review step
  const [readAloud, setReadAloud] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [submitting, startSubmit] = useTransition();
  const [focusTarget, setFocusTarget] = useState<string | null>(null);
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const micSupported = useSpeechRecognitionSupported();
  const isReview = step === sections.length;
  const headingRef = useRef<HTMLHeadingElement>(null);

  const doSave = useCallback(
    async (a: Answers) => {
      setSaveState("saving");
      await saveDraft(a);
      dirty.current = false;
      setSaveState("saved");
    },
    [saveDraft],
  );

  // Autosave about a second after the last change.
  useEffect(() => {
    if (!dirty.current) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => doSave(answers), 900);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [answers, doSave]);

  const setAnswer = (id: string, v: AnswerValue) => {
    dirty.current = true;
    setSaveState("idle");
    setAnswers((prev) => ({ ...prev, [id]: v }));
  };

  // Move focus to the step heading (or a specific question) whenever the step changes.
  const prevStep = useRef(step);
  useEffect(() => {
    if (prevStep.current === step && !focusTarget) return; // not on first load
    prevStep.current = step;
    if (focusTarget) {
      const el = document.getElementById(`in-${focusTarget}`) || document.getElementById(`q-${focusTarget}`);
      el?.scrollIntoView({ block: "center" });
      (el as HTMLElement | null)?.focus();
      setFocusTarget(null);
    } else {
      window.scrollTo({ top: 0 });
      headingRef.current?.focus();
    }
    if (readAloud) {
      const s = sections[step];
      speak(s ? `${s.title}. ${s.intro || ""}` : "Review your answers before you send them.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const missing = useMemo(() => {
    const out: { section: number; q: Question }[] = [];
    sections.forEach((s, si) =>
      s.questions.forEach((q) => {
        if (!q.optional && isVisible(q, answers) && !isAnswered(q, answers[q.id])) out.push({ section: si, q });
      }),
    );
    return out;
  }, [answers, sections]);

  const go = (n: number) => {
    if (dirty.current) doSave(answers);
    setStep(n);
  };

  const saveAndLeave = async () => {
    await doSave(answers);
    router.push("/myconnectedcare/questionnaires?saved=1");
  };

  const requestHelp = async () => {
    await doSave(answers);
    router.push(`/intake-assistant/request-help?ref=${referralId}&from=portal`);
  };

  const section = sections[step];

  return (
    <div className="mx-auto max-w-3xl">
      {/* Sticky help bar, always visible at the top of every step */}
      <div className="sticky top-0 z-20 -mx-4 mb-4 border-b-2 border-mcc-600 bg-white px-4 py-3 shadow-sm md:mx-0 md:rounded-b-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={requestHelp} className="flex items-center gap-2 rounded-lg bg-amber-300 px-4 py-2 text-lg font-bold text-black hover:bg-amber-400">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
            </svg>
            Need help? Request a nurse call
          </button>
          <label className="flex cursor-pointer items-center gap-2 text-base font-medium">
            <input
              type="checkbox"
              role="switch"
              aria-checked={readAloud}
              checked={readAloud}
              onChange={(e) => {
                setReadAloud(e.target.checked);
                if (!e.target.checked) window.speechSynthesis?.cancel();
                else speak("Read aloud is on. Each question will be read when you select it.");
              }}
              className="h-6 w-6 accent-mcc-700"
            />
            Read questions aloud
          </label>
        </div>
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-base font-semibold text-mcc-800">Oncology New Patient Intake</p>
        <Link href="/myconnectedcare/example" target="_blank" className="text-base text-mcc-700 underline">
          See an example of a completed form
        </Link>
      </div>

      {/* Progress */}
      <div className="mt-2" aria-label="Progress">
        <div className="flex justify-between text-base text-gray-800">
          <span>
            Step {step + 1} of {sections.length + 1}: <strong>{isReview ? "Review and send" : section.title}</strong>
          </span>
          <span aria-live="polite" className="text-gray-700">
            {saveState === "saving" ? "Saving…" : saveState === "saved" ? "All changes saved" : ""}
          </span>
        </div>
        <div className="mt-2 h-3 w-full rounded-full bg-gray-200" role="progressbar" aria-valuemin={1} aria-valuemax={sections.length + 1} aria-valuenow={step + 1}>
          <div className="h-3 rounded-full bg-mcc-600 transition-all" style={{ width: `${((step + 1) / (sections.length + 1)) * 100}%` }} />
        </div>
        <ol className="mt-3 hidden flex-wrap gap-x-1 gap-y-1 text-sm md:flex">
          {[...sections.map((s) => s.title), "Review and send"].map((t, i) => (
            <li key={t}>
              <button
                type="button"
                onClick={() => go(i)}
                aria-current={i === step ? "step" : undefined}
                className={`rounded-full px-2.5 py-1 ${i === step ? "bg-mcc-700 font-bold text-white" : i < step ? "bg-mcc-100 text-mcc-900" : "bg-gray-100 text-gray-800"}`}
              >
                {t}
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm md:p-8">
        {!isReview ? (
          <>
            <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-bold text-mcc-900 outline-none md:text-3xl">
              {section.title}
            </h1>
            {section.intro && <p className="mt-2 rounded-lg bg-mcc-50 p-3 text-lg text-gray-900">{section.intro}</p>}
            {micSupported && section.questions.some((q) => q.voice || q.type === "repeat") && (
              <p className="mt-3 text-base text-gray-700">
                Tip: tap the microphone to speak your answer. Please check what was typed, especially medication names, because voice typing can make mistakes.
              </p>
            )}
            <div className="mt-6 space-y-8">
              {section.questions
                .filter((q) => isVisible(q, answers))
                .map((q) => (
                  <div
                    key={q.id}
                    id={`q-${q.id}`}
                    onFocus={(e) => {
                      if (readAloud && !e.currentTarget.contains(e.relatedTarget as Node)) speak(q.label);
                    }}
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <label id={`lbl-${q.id}`} htmlFor={`in-${q.id}`} className="block text-xl font-semibold text-gray-900">
                        {q.label}
                        {q.optional && <span className="ml-2 text-base font-normal text-gray-700">(optional)</span>}
                      </label>
                      {readAloud && (
                        <button type="button" onClick={() => speak(`${q.label}. ${q.example || ""}`)} className="shrink-0 rounded-md border border-gray-400 px-2 py-1 text-base" aria-label={`Read aloud: ${q.label}`}>
                          🔊 Listen
                        </button>
                      )}
                    </div>
                    {q.example && q.type !== "repeat" && <p className="mb-2 text-base italic text-gray-700">{q.example}</p>}
                    <QuestionInput q={q} value={answers[q.id]} onChange={(v) => setAnswer(q.id, v)} voice />
                    {q.help && <p className="mt-2 text-base text-gray-800">{q.help}</p>}
                  </div>
                ))}
            </div>
          </>
        ) : (
          <>
            <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-bold text-mcc-900 outline-none md:text-3xl">
              Review and send
            </h1>
            {missing.length === 0 ? (
              <p className="mt-4 rounded-lg bg-green-50 p-4 text-lg text-green-900">You have answered every question.</p>
            ) : (
              <div className="mt-4 rounded-lg border-2 border-amber-500 bg-amber-50 p-4">
                <h2 className="text-xl font-bold">
                  {missing.length} question{missing.length === 1 ? " is" : "s are"} not answered yet
                </h2>
                <p className="mt-1 text-lg">You can go back and answer them, or send the form as it is. Your care team will ask you about anything missing.</p>
                <ul className="mt-3 space-y-2">
                  {missing.map((m) => (
                    <li key={m.q.id}>
                      <button
                        type="button"
                        className="text-left text-lg text-blue-900 underline"
                        onClick={() => {
                          setFocusTarget(m.q.id);
                          go(m.section);
                        }}
                      >
                        {sections[m.section].title}: {m.q.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="mt-6 text-lg">When you send the form, it goes to your care team at the Cancer Centre.</p>
          </>
        )}

        <div className="mt-10 flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row">
            {step > 0 && (
              <button type="button" onClick={() => go(step - 1)} className="rounded-lg border-2 border-gray-600 px-5 py-3 text-lg font-semibold hover:bg-gray-50">
                ← Back
              </button>
            )}
            <button type="button" onClick={saveAndLeave} className="rounded-lg px-5 py-3 text-lg font-semibold text-mcc-800 underline hover:bg-mcc-50">
              Save and finish later
            </button>
          </div>
          {!isReview ? (
            <button type="button" onClick={() => go(step + 1)} className="rounded-lg bg-mcc-700 px-6 py-3 text-lg font-bold text-white hover:bg-mcc-800">
              Next →
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={() =>
                startSubmit(async () => {
                  if (timer.current) clearTimeout(timer.current);
                  await submit(answers);
                })
              }
              className="rounded-lg bg-mcc-700 px-6 py-3 text-lg font-bold text-white hover:bg-mcc-800 disabled:opacity-60"
            >
              {submitting ? "Sending…" : "Send to my care team"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
