import { NextResponse } from "next/server";
import OpenAI from "openai";

// POST /api/transcribe  { audio: base64 WAV }  ->  { text }
// Used by the microphone buttons when the browser has no working built-in speech recognition
// (Brave, Firefox, or when Chrome's speech service is blocked). Needs OPENROUTER_API_KEY.
const DEFAULT_TRANSCRIBE_MODEL = "google/gemini-2.5-flash";
const MAX_BASE64 = 8_000_000; // about 4 minutes of 16 kHz mono audio

export async function POST(req: Request) {
  const key = process.env.OPENROUTER_API_KEY?.trim();
  if (!key) return NextResponse.json({ error: "Voice typing needs an OpenRouter API key on the server." }, { status: 503 });

  const body = (await req.json().catch(() => null)) as { audio?: string } | null;
  const audio = body?.audio || "";
  if (!audio || audio.length > MAX_BASE64) return NextResponse.json({ error: "No audio, or the recording is too long." }, { status: 400 });

  const client = new OpenAI({
    apiKey: key,
    baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
    defaultHeaders: { "X-Title": "Intake Prototype (class project)" },
  });
  try {
    const res = await client.chat.completions.create({
      model: process.env.TRANSCRIBE_MODEL?.trim() || DEFAULT_TRANSCRIBE_MODEL,
      temperature: 0,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Transcribe this recording of a patient answering a health intake question. Return only the words spoken, with normal punctuation. If nothing is said, return an empty string.",
            },
            { type: "input_audio", input_audio: { data: audio, format: "wav" } },
          ],
        },
      ],
    });
    const text = (res.choices[0]?.message?.content || "").trim().replace(/^"|"$/g, "");
    return NextResponse.json({ text });
  } catch (e) {
    console.error("transcribe failed", e);
    return NextResponse.json({ error: "Could not turn the recording into text. Please try again or type your answer." }, { status: 502 });
  }
}
