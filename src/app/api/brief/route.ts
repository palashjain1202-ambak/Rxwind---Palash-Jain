import { NextResponse } from "next/server";
import { generateJSON, hasKey } from "@/lib/server/gemini";

export const runtime = "nodejs";
export const maxDuration = 45;

const schema = {
  type: "OBJECT",
  properties: {
    summaryEn: { type: "STRING" },
    summaryHi: { type: "STRING" },
    questionsEn: { type: "ARRAY", items: { type: "STRING" } },
    questionsHi: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["summaryEn", "summaryHi", "questionsEn", "questionsHi"],
};

const PROMPT = `You write a patient-held handover note for an Indian doctor who has ~2 minutes.
Using ONLY the JSON history below, write:
1) summaryEn: 3-4 crisp clinical sentences: recurring patterns with months, what the patient REPORTED helped vs didn't, side effects (with severity and onset when a medicine "check" exists), missed doses, allergies, current medicines. Use generic names with brand in brackets once. No advice, no new diagnoses, no recommendations.
2) summaryHi: the same in simple Hindi (Devanagari).
3) questionsEn: 3 short questions the patient could ask this doctor (e.g. about prevention before the season, avoiding a drug that caused side effects, what to do if a medicine isn't working). Never suggest a specific drug or dose.
4) questionsHi: same in simple Hindi.
Phrase reported outcomes as "patient reports…". Be factual. Never use em dashes.`;

export async function POST(req: Request) {
  if (!hasKey()) return NextResponse.json({ error: "no_key" }, { status: 503 });
  try {
    const body = await req.json();
    const json = JSON.stringify(body).slice(0, 24000);
    const out = await generateJSON<Record<string, unknown>>([{ text: PROMPT + "\n\nHISTORY:\n" + json }], schema, {
      temperature: 0.3,
    });
    return NextResponse.json(out);
  } catch (e) {
    const msg = String((e as Error)?.message ?? e);
    console.error("brief failed", msg);
    return NextResponse.json({ error: "brief_failed", message: msg.slice(0, 300) }, { status: 500 });
  }
}
