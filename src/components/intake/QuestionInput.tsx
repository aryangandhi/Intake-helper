"use client";
import { useEffect, useRef, useState } from "react";
import type { Question } from "@/config/intakeQuestions";
import type { AnswerValue, RepeatValue } from "@/lib/answers";

type SR = {
  lang: string;
  interimResults: boolean;
  onresult: (e: { results: { 0: { transcript: string } }[] }) => void;
  onend: () => void;
  onerror: (e: { error: string }) => void;
  start: () => void;
  stop: () => void;
};

type SRCtor = new () => SR;

function browserRecognizer(): SRCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor };
  // Brave exposes the API but its speech service always fails, so skip it there.
  if ((navigator as unknown as { brave?: unknown }).brave) return null;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

// Set once the browser's own recognizer fails (e.g. "network"); after that we record and transcribe on the server.
let browserRecognizerBroken = false;

/** True when some form of voice input can work in this browser. */
export function useSpeechRecognitionSupported() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    setOk(Boolean(browserRecognizer() || (typeof MediaRecorder !== "undefined" && navigator.mediaDevices?.getUserMedia)));
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

/** Converts a recording to 16 kHz mono WAV (base64), the format the transcription model accepts. */
async function toWavBase64(blob: Blob): Promise<string> {
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  const decoded = await ctx.decodeAudioData(await blob.arrayBuffer());
  void ctx.close();
  const rate = 16000;
  const offline = new OfflineAudioContext(1, Math.max(1, Math.ceil(decoded.duration * rate)), rate);
  const src = offline.createBufferSource();
  src.buffer = decoded;
  src.connect(offline.destination);
  src.start();
  const samples = (await offline.startRendering()).getChannelData(0);
  const buf = new ArrayBuffer(44 + samples.length * 2);
  const v = new DataView(buf);
  const str = (o: number, t: string) => [...t].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, "RIFF");
  v.setUint32(4, 36 + samples.length * 2, true);
  str(8, "WAVE");
  str(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, rate, true);
  v.setUint32(28, rate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  str(36, "data");
  v.setUint32(40, samples.length * 2, true);
  samples.forEach((x, i) => v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, x)) * 0x7fff, true));
  let bin = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

function MicButton({ onText, label }: { onText: (t: string) => void; label: string }) {
  const supported = useSpeechRecognitionSupported();
  const [state, setState] = useState<"idle" | "listening" | "transcribing">("idle");
  const [error, setError] = useState("");
  const recRef = useRef<SR | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  if (!supported) return null;

  // Fallback: record with the microphone, then send the audio to /api/transcribe.
  const startRecording = async () => {
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError("The microphone is blocked. Allow microphone access in your browser, or type your answer.");
      setState("idle");
      return;
    }
    const chunks: Blob[] = [];
    const mr = new MediaRecorder(stream);
    mr.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    mr.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      setState("transcribing");
      try {
        const audio = await toWavBase64(new Blob(chunks, { type: mr.mimeType }));
        const res = await fetch("/api/transcribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ audio }) });
        const data = (await res.json()) as { text?: string; error?: string };
        if (!res.ok) setError(data.error || "Voice typing did not work. Please type your answer.");
        else if (data.text) onText(data.text);
        else setError("We didn't hear anything. Please try again.");
      } catch {
        setError("Voice typing did not work. Please type your answer.");
      }
      setState("idle");
    };
    mediaRef.current = mr;
    mr.start();
    setState("listening");
  };

  const toggle = () => {
    setError("");
    if (state === "listening") {
      recRef.current?.stop();
      if (mediaRef.current?.state === "recording") mediaRef.current.stop();
      return;
    }
    if (state === "transcribing") return;
    const Ctor = browserRecognizerBroken ? null : browserRecognizer();
    if (!Ctor) return void startRecording();
    const rec = new Ctor();
    rec.lang = "en-CA";
    rec.interimResults = false;
    let switched = false;
    rec.onresult = (e) => onText(e.results[0][0].transcript);
    rec.onend = () => !switched && setState("idle");
    rec.onerror = (e) => {
      if (e.error === "not-allowed") {
        setError("The microphone is blocked. Allow microphone access in your browser, or type your answer.");
      } else if (e.error !== "no-speech" && e.error !== "aborted") {
        // The browser's speech service is unavailable: switch to recording for this and later answers.
        browserRecognizerBroken = true;
        switched = true;
        void startRecording();
      }
    };
    recRef.current = rec;
    setState("listening");
    rec.start();
  };
  const listening = state === "listening";
  return (
    <div className="relative flex shrink-0">
      <button
        type="button"
        onClick={toggle}
        aria-label={listening ? `Stop voice input for ${label}` : `Speak your answer for ${label}`}
        title={listening ? "Stop listening" : state === "transcribing" ? "Turning your words into text…" : "Speak your answer"}
        className={`rounded-md border px-3 ${listening ? "border-red-600 bg-red-50 text-red-700" : state === "transcribing" ? "border-gray-400 bg-gray-100 text-gray-500" : "border-gray-400 bg-white text-gray-800 hover:bg-gray-100"}`}
      >
        {state === "transcribing" ? (
          <span className="block h-5 w-5 animate-spin rounded-full border-2 border-gray-500 border-t-transparent" aria-hidden="true" />
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 10a7 7 0 0 0 14 0M12 17v5" />
          </svg>
        )}
        <span className="sr-only">{listening ? "Listening. Tap again to stop." : state === "transcribing" ? "Turning your words into text" : "Voice input"}</span>
      </button>
      {listening && <span className="absolute right-0 top-full z-10 mt-1 whitespace-nowrap rounded bg-red-700 px-2 py-0.5 text-sm text-white">Listening… tap to stop</span>}
      {error && (
        <span role="alert" className="absolute right-0 top-full z-10 mt-1 w-64 rounded border border-amber-500 bg-amber-50 p-2 text-sm text-gray-900">
          {error}
        </span>
      )}
    </div>
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
        <div id={inputId} tabIndex={-1} role="group" aria-labelledby={`lbl-${q.id}`} className={`grid gap-3 ${dense ? (q.optionGroups ? "grid-cols-4" : "grid-cols-1") : "sm:grid-cols-2"}`}>
          {(q.optionGroups || [{ group: "", options: q.options || [] }]).map((g) => (
            <fieldset key={g.group} className={dense ? (g.group ? "" : "grid grid-cols-2 gap-x-3 sm:grid-cols-3") : "rounded-lg border border-gray-300 p-3"}>
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

/** "i" button that shows a plain-language explanation under a question. */
export function InfoButton({ q, dense = false, onOpen }: { q: Question; dense?: boolean; onOpen?: (text: string) => void }) {
  const [open, setOpen] = useState(false);
  if (!q.info) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          if (!open) onOpen?.(q.info!);
        }}
        aria-expanded={open}
        aria-controls={`info-${q.id}`}
        aria-label={`What does this mean? ${q.label}`}
        title="What does this mean?"
        className={`ml-2 inline-flex shrink-0 items-center justify-center rounded-full border-2 border-current align-middle font-bold italic leading-none text-sky-800 hover:bg-sky-50 ${dense ? "h-4 w-4 border text-[10px]" : "h-7 w-7 text-base"}`}
      >
        i
      </button>
      {open && (
        <span id={`info-${q.id}`} role="note" className={`mt-2 block rounded-lg border border-sky-300 bg-sky-50 font-normal not-italic text-gray-900 ${dense ? "p-2 text-xs" : "p-3 text-lg"}`}>
          {q.info}
        </span>
      )}
    </>
  );
}
