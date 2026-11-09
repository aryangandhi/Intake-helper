"use client";
import { useEffect, useRef, useState } from "react";
import type { Question } from "@/config/intakeQuestions";
import type { AnswerValue, RepeatValue } from "@/lib/answers";

type SR = {
  lang: string;
  interimResults: boolean;
  onresult: (e: { results: { 0: { transcript: string } }[] }) => void;
  onend: () => void;
  onerror: () => void;
  start: () => void;
  stop: () => void;
};

export function useSpeechRecognitionSupported() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
    setOk(Boolean(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);
  return ok;
}

export function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.95;
  u.lang = "en-CA";
  window.speechSynthesis.speak(u);
}

function MicButton({ onText, label }: { onText: (t: string) => void; label: string }) {
  const supported = useSpeechRecognitionSupported();
  const [listening, setListening] = useState(false);
  const recRef = useRef<SR | null>(null);
  if (!supported) return null;
  const toggle = () => {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const w = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = "en-CA";
    rec.interimResults = false;
    rec.onresult = (e) => onText(e.results[0][0].transcript);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  };
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={listening ? `Stop voice input for ${label}` : `Speak your answer for ${label}`}
      title={listening ? "Stop listening" : "Speak your answer"}
      className={`shrink-0 rounded-md border px-3 ${listening ? "border-red-600 bg-red-50 text-red-700" : "border-gray-400 bg-white text-gray-800 hover:bg-gray-100"}`}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="9" y="2" width="6" height="12" rx="3" />
        <path d="M5 10a7 7 0 0 0 14 0M12 17v5" />
      </svg>
      <span className="sr-only">{listening ? "Listening" : "Voice input"}</span>
    </button>
  );
}

function appendText(prev: string | undefined, t: string) {
  return prev && prev.trim() ? `${prev.trim()} ${t}` : t;
}

export function QuestionInput({
  q,
  value,
  onChange,
  dense = false,
  voice = false,
}: {
  q: Question;
  value: AnswerValue;
  onChange: (v: AnswerValue) => void;
  dense?: boolean;
  voice?: boolean;
}) {
  const inputId = `in-${q.id}`;
  const base = dense
    ? "w-full rounded border border-gray-400 px-2 py-1 text-sm"
    : "w-full rounded-lg border-2 border-gray-500 px-3 py-3 text-lg focus:border-teal-700";
  const showMic = voice && q.voice && !dense;

  switch (q.type) {
    case "text":
    case "date":
      return (
        <div className="flex gap-2">
          <input id={inputId} type={q.type === "date" ? "date" : "text"} className={base} value={(value as string) || ""} onChange={(e) => onChange(e.target.value)} />
          {showMic && <MicButton label={q.label} onText={(t) => onChange(appendText(value as string, t))} />}
        </div>
      );
    case "longtext":
      return (
        <div className="flex gap-2">
          <textarea id={inputId} rows={dense ? 2 : 3} className={base} value={(value as string) || ""} onChange={(e) => onChange(e.target.value)} />
          {showMic && <MicButton label={q.label} onText={(t) => onChange(appendText(value as string, t))} />}
        </div>
      );
    case "yesno":
    case "single": {
      const opts = q.type === "yesno" ? ["Yes", "No"] : q.options || [];
      if (dense) {
        return (
          <select id={inputId} className={base} value={(value as string) || ""} onChange={(e) => onChange(e.target.value)}>
            <option value="">—</option>
            {opts.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        );
      }
      return (
        <div id={inputId} tabIndex={-1} role="radiogroup" aria-labelledby={`lbl-${q.id}`} className={`grid gap-2 ${q.type === "yesno" ? "grid-cols-2 max-w-sm" : "sm:grid-cols-2"}`}>
          {opts.map((o) => (
            <label key={o} className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 px-4 py-3 text-lg ${value === o ? "border-teal-700 bg-teal-50 font-semibold" : "border-gray-400 bg-white hover:bg-gray-50"}`}>
              <input type="radio" name={q.id} className="h-5 w-5 accent-teal-700" checked={value === o} onChange={() => onChange(o)} />
              {o}
            </label>
          ))}
        </div>
      );
    }
    case "scale": {
      return (
        <div id={inputId} tabIndex={-1} role="radiogroup" aria-labelledby={`lbl-${q.id}`} className="flex flex-wrap gap-1.5">
          {Array.from({ length: 11 }, (_, n) => String(n)).map((n) => (
            <label key={n} className={`flex cursor-pointer items-center justify-center rounded-md border-2 ${dense ? "h-7 w-8 text-sm" : "h-12 w-12 text-lg"} ${value === n ? "border-teal-700 bg-teal-700 font-bold text-white" : "border-gray-400 bg-white hover:bg-gray-50"}`}>
              <input type="radio" name={q.id} className="sr-only" checked={value === n} onChange={() => onChange(n)} aria-label={`${n} out of 10`} />
              {n}
            </label>
          ))}
        </div>
      );
    }
    case "multi": {
      const arr = Array.isArray(value) ? value : [];
      const toggle = (o: string) => {
        if (o === "None of these") return onChange(arr.includes(o) ? [] : [o]);
        const next = arr.includes(o) ? arr.filter((x) => x !== o) : [...arr.filter((x) => x !== "None of these"), o];
        onChange(next);
      };
      return (
        <div id={inputId} tabIndex={-1} role="group" aria-labelledby={`lbl-${q.id}`} className={`grid gap-3 ${dense ? "grid-cols-4" : "sm:grid-cols-2"}`}>
          {(q.optionGroups || [{ group: "", options: q.options || [] }]).map((g) => (
            <fieldset key={g.group} className={dense ? "" : "rounded-lg border border-gray-300 p-3"}>
              {g.group && <legend className={`font-semibold ${dense ? "text-xs uppercase text-gray-600" : "px-1"}`}>{g.group}</legend>}
              {g.options.map((o) => {
                return (
                  <label key={o} className={`flex cursor-pointer items-center gap-2 ${dense ? "text-sm" : "py-1.5 text-lg"}`}>
                    <input type="checkbox" className={dense ? "h-4 w-4" : "h-5 w-5 accent-teal-700"} checked={arr.includes(o)} onChange={() => toggle(o)} />
                    {o}
                  </label>
                );
              })}
            </fieldset>
          ))}
        </div>
      );
    }
    case "repeat": {
      const r: RepeatValue = (value as RepeatValue) || { items: [] };
      const items = r.items && r.items.length ? r.items : [{}];
      const fields = q.repeatFields || [];
      const set = (next: RepeatValue) => onChange(next);
      return (
        <div className="space-y-3">
          {q.noneLabel && (
            <label className={`flex cursor-pointer items-center gap-2 ${dense ? "text-sm" : "text-lg"}`}>
              <input type="checkbox" className={dense ? "h-4 w-4" : "h-5 w-5 accent-teal-700"} checked={Boolean(r.none)} onChange={(e) => set({ none: e.target.checked, items: r.items || [] })} />
              {q.noneLabel}
            </label>
          )}
          {!r.none && (
            <>
              {items.map((it, idx) => (
                <div key={idx} className={dense ? "flex items-end gap-2" : "rounded-lg border border-gray-300 bg-gray-50 p-3"}>
                  <div className={`grid flex-1 gap-2 ${dense ? "" : "sm:gap-3"}`} style={{ gridTemplateColumns: dense ? `repeat(${fields.length}, minmax(0,1fr))` : undefined }}>
                    {fields.map((f, fi) => {
                      const fid = idx === 0 && fi === 0 ? inputId : `in-${q.id}-${idx}-${f.id}`;
                      return (
                        <div key={f.id} className={dense ? "" : "sm:grid sm:grid-cols-[10rem_1fr] sm:items-center sm:gap-3"}>
                          <label htmlFor={fid} className={dense ? "block text-xs text-gray-600" : "block font-medium"}>
                            {f.label}
                            {idx > 0 || dense ? "" : ""}
                          </label>
                          <div>
                            <div className="flex gap-2">
                              <input
                                id={fid}
                                className={base}
                                value={it[f.id] || ""}
                                onChange={(e) => {
                                  const next = items.map((x, j) => (j === idx ? { ...x, [f.id]: e.target.value } : x));
                                  set({ none: false, items: next });
                                }}
                              />
                              {voice && !dense && (
                                <MicButton
                                  label={`${f.label} ${idx + 1}`}
                                  onText={(t) => {
                                    const next = items.map((x, j) => (j === idx ? { ...x, [f.id]: appendText(x[f.id], t) } : x));
                                    set({ none: false, items: next });
                                  }}
                                />
                              )}
                            </div>
                            {!dense && idx === 0 && f.example && <p className="mt-1 text-base italic text-gray-700">{f.example}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => set({ none: false, items: items.filter((_, j) => j !== idx) })}
                      className={dense ? "rounded border border-gray-400 px-2 py-1 text-xs" : "mt-2 text-base text-red-800 underline"}
                    >
                      Remove{dense ? "" : ` ${fields[0]?.label.toLowerCase() || "item"} ${idx + 1}`}
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => set({ none: false, items: [...items, {}] })}
                className={dense ? "rounded border border-indigo-600 px-2 py-1 text-xs font-medium text-indigo-700" : "rounded-lg border-2 border-teal-700 px-4 py-2 text-lg font-semibold text-teal-800 hover:bg-teal-50"}
              >
                + Add another
              </button>
            </>
          )}
        </div>
      );
    }
  }
}
