"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export type CiteInfo = { n: number; question: string; answer: string };

export function jumpToRaw(fieldId: string) {
  const el = document.getElementById(`raw-${fieldId}`);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.classList.remove("raw-highlight");
  void el.offsetWidth; // restart the animation
  el.classList.add("raw-highlight");
  el.focus({ preventScroll: true });
  setTimeout(() => el.classList.remove("raw-highlight"), 2200);
}

export function CitationChip({ fieldId, info }: { fieldId: string; info?: CiteInfo }) {
  if (!info) return null;
  return (
    <span className="group relative inline-block align-baseline">
      <button
        type="button"
        onClick={() => jumpToRaw(fieldId)}
        aria-label={`Citation ${info.n}: ${info.question}. Answer: ${info.answer}`}
        className="ml-0.5 rounded border border-emr-600/50 bg-emr-50 px-1 text-[10px] font-semibold leading-4 text-emr-600 hover:bg-emr-600 hover:text-white"
      >
        [{info.n}]
      </button>
      <span role="tooltip" className="pointer-events-none invisible absolute bottom-full left-1/2 z-30 mb-1 w-72 -translate-x-1/2 rounded border border-gray-400 bg-white p-2 text-left text-[12px] font-normal text-gray-900 shadow-lg group-hover:visible group-focus-within:visible">
        <span className="block font-semibold">Q: {info.question}</span>
        <span className="mt-1 block">A: {info.answer}</span>
      </span>
    </span>
  );
}

export function Statement({ text, citations, unsupported, cites }: { text: string; citations: string[]; unsupported: boolean; cites: Record<string, CiteInfo> }) {
  return (
    <span
      className={unsupported ? "group/u relative rounded bg-amber-200 px-0.5 outline outline-1 outline-amber-500" : ""}
      title={unsupported ? "Not linked to a patient answer. Please verify." : undefined}
      data-unsupported={unsupported ? "true" : undefined}
    >
      {text}
      {unsupported && <span className="sr-only"> (Not linked to a patient answer. Please verify.)</span>}
      {citations.map((c) => (
        <CitationChip key={c} fieldId={c} info={cites[c]} />
      ))}
    </span>
  );
}

export function FlagLink({ fieldId, children }: { fieldId: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={() => jumpToRaw(fieldId)} className="text-left text-emr-600 underline">
      {children}
    </button>
  );
}

export function CopyButton({ text, label }: { text: string; label: string }) {
  return (
    <button
      type="button"
      title={`Copy ${label}`}
      aria-label={`Copy ${label}`}
      onClick={async (e) => {
        const btn = e.currentTarget;
        try {
          await navigator.clipboard.writeText(text);
          btn.dataset.copied = "1";
          setTimeout(() => delete btn.dataset.copied, 1500);
        } catch {}
      }}
      className="group/c inline-flex items-center gap-1 rounded border border-gray-300 px-1.5 py-0.5 text-[11px] text-gray-700 hover:bg-gray-100 data-[copied]:border-green-600 data-[copied]:text-green-700"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
      <span className="group-data-[copied]/c:hidden">Copy</span>
      <span className="hidden group-data-[copied]/c:inline">Copied</span>
    </button>
  );
}

/** Refreshes the page every 2 seconds while the summary is being generated. */
export function AutoRefresh({ active }: { active: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => router.refresh(), 2000);
    return () => clearInterval(t);
  }, [active, router]);
  return null;
}
