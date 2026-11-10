"use client";
import { useState, useTransition } from "react";
import type { Section } from "@/config/intakeQuestions";
import { isAnswered, isVisible, type AnswerValue, type Answers } from "@/lib/answers";
import { randomAnswers } from "@/lib/randomFill";
import { InfoButton, QuestionInput } from "./QuestionInput";

export type PowerFormAction = { id: string; label: string; primary?: boolean; needsComment?: boolean };

export function PowerForm({
  sections,
  initialAnswers,
  actions,
  onAction,
  showComment = false,
  initialComment = "",
}: {
  sections: Section[];
  initialAnswers: Answers;
  actions: PowerFormAction[];
  onAction: (actionId: string, answers: Answers, comment: string) => Promise<void>;
  showComment?: boolean;
  initialComment?: string;
}) {
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [comment, setComment] = useState(initialComment);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const set = (id: string, v: AnswerValue) => setAnswers((p) => ({ ...p, [id]: v }));
  const blank = sections.flatMap((s) => s.questions).filter((q) => !q.optional && isVisible(q, answers) && !isAnswered(q, answers[q.id])).length;

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="space-y-3"
      aria-label="PowerForm: Oncology New Patient Intake"
    >
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setAnswers((a) => randomAnswers(sections, a))}
          title="Demo only: fills every blank field with random answers"
          className="rounded border border-dashed border-slate-500 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
        >
          Demo: fill in randomly
        </button>
      </div>
      <div className="grid gap-3 xl:grid-cols-2">
        {sections.map((s) => (
          <fieldset key={s.id} className={`rounded border border-slate-300 bg-white ${s.id === "concern" ? "xl:col-span-2" : ""}`}>
            <legend className="ml-2 px-1 text-xs font-bold uppercase tracking-wide text-ia-800">{s.title}</legend>
            <div className="divide-y divide-slate-100 px-3 pb-2">
              {s.questions
                .filter((q) => isVisible(q, answers))
                .map((q) => (
                  <div key={q.id} id={`q-${q.id}`} className="grid gap-1 py-1.5 sm:grid-cols-[minmax(10rem,40%)_1fr] sm:gap-3">
                    <label id={`lbl-${q.id}`} htmlFor={`in-${q.id}`} className="pt-1 text-xs font-medium leading-snug text-slate-700">
                      {q.label}
                      <InfoButton q={q} dense />
                    </label>
                    <QuestionInput q={q} value={answers[q.id]} onChange={(v) => set(q.id, v)} dense />
                  </div>
                ))}
            </div>
          </fieldset>
        ))}
      </div>

      {showComment && (
        <div className="rounded border border-slate-300 bg-white p-3">
          <label htmlFor="review-comment" className="block text-sm font-semibold">Comment for the co-op student (needed to return)</label>
          <textarea id="review-comment" rows={2} value={comment} onChange={(e) => setComment(e.target.value)} className="mt-1 w-full rounded border border-slate-400 px-2 py-1 text-sm" />
        </div>
      )}

      <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-slate-300 bg-slate-50/95 py-3">
        <p className="text-sm text-slate-700">{blank ? `${blank} required field${blank === 1 ? "" : "s"} blank (will be flagged as incomplete)` : "All required fields complete"}</p>
        <div className="flex items-center gap-2">
          {error && <span role="alert" className="text-sm text-red-700">{error}</span>}
          {actions.map((a) => (
            <button
              key={a.id}
              type="button"
              disabled={pending}
              onClick={() => {
                if (a.needsComment && !comment.trim()) {
                  setError("Please add a comment for the student.");
                  document.getElementById("review-comment")?.focus();
                  return;
                }
                setError("");
                start(() => onAction(a.id, answers, comment));
              }}
              className={a.primary ? "rounded-md bg-ia-600 px-4 py-2 font-semibold text-white hover:bg-ia-700 disabled:opacity-60" : "rounded-md border border-slate-500 bg-white px-4 py-2 font-medium hover:bg-slate-100 disabled:opacity-60"}
            >
              {pending ? "Saving…" : a.label}
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}
