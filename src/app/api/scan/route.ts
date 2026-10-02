import { NextResponse } from "next/server";
import { generateJSON, hasKey } from "@/lib/server/gemini";
import type { ScanResult } from "@/lib/types";
import { slotsFromCode } from "@/lib/util";

export const runtime = "nodejs";
export const maxDuration = 60;

const CATEGORIES = ["eye", "respiratory", "skin", "infection", "digestive", "fever", "pain", "chronic", "other"];
const FORMS = ["tablet", "capsule", "syrup", "drops", "cream", "inhaler", "injection", "gargle", "spray", "powder", "other"];

const schema = {
  type: "OBJECT",
  properties: {
    isPrescription: { type: "BOOLEAN" },
    legibility: { type: "STRING", enum: ["clear", "partly", "poor"] },
    doctor: { type: "STRING", description: "Doctor's name as written, with Dr. prefix" },
    specialty: { type: "STRING" },
    clinic: { type: "STRING", description: "Clinic/hospital name and area if visible" },
    date: { type: "STRING", nullable: true, description: "Prescription date as YYYY-MM-DD, null if absent" },
    patientName: { type: "STRING", nullable: true },
    diagnosis: { type: "STRING", description: "Diagnosis or chief complaint in plain words" },
    category: { type: "STRING", enum: CATEGORIES },
    episodeTitle: {
      type: "OBJECT",
      properties: { en: { type: "STRING" }, hi: { type: "STRING" } },
      required: ["en", "hi"],
    },
    medicines: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING", description: "Brand name as written, corrected to the real Indian brand spelling" },
          generic: { type: "STRING", description: "Active ingredient(s)" },
          strength: { type: "STRING" },
          form: { type: "STRING", enum: FORMS },
          dose: { type: "STRING", description: "Amount per intake in plain English, e.g. '1 tablet', '2 drops each eye', '10 ml'" },
          frequencyCode: { type: "STRING", description: "As written, e.g. 1-0-1, BD, TDS, HS, SOS, 1-1-1" },
          morning: { type: "BOOLEAN" },
          afternoon: { type: "BOOLEAN" },
          evening: { type: "BOOLEAN" },
          night: { type: "BOOLEAN" },
          sos: { type: "BOOLEAN", description: "Only when needed" },
          food: { type: "STRING", enum: ["before", "after", "with", "empty", "any"] },
          durationDays: { type: "INTEGER", nullable: true, description: "Course length in days; null if ongoing/not stated" },
          purposeEn: { type: "STRING", description: "What it's for, max 7 plain words, no jargon" },
          purposeHi: { type: "STRING", description: "Same in simple Hindi (Devanagari)" },
          confidence: { type: "NUMBER", description: "0-1 confidence that name AND timing were read correctly" },
        },
        required: ["name", "form", "dose", "morning", "afternoon", "evening", "night", "sos", "food", "purposeEn", "purposeHi", "confidence"],
      },
    },
    advice: { type: "ARRAY", items: { type: "STRING" } },
    followUp: { type: "STRING", nullable: true },
    warnings: { type: "ARRAY", items: { type: "STRING" }, description: "Anything the patient must double-check with a pharmacist" },
  },
  required: ["isPrescription", "legibility", "doctor", "category", "episodeTitle", "medicines", "advice", "warnings"],
};

const PROMPT = `You are a meticulous Indian clinical pharmacist reading a doctor's prescription ("parchi") photo for a patient.
Extract exactly what is written. Never invent medicines, doses or durations that aren't on the page.

Indian prescription conventions you must decode:
- "1-0-1" = morning & night; "1-1-1" = morning, afternoon, night; "0-0-1" = night; "1-0-0" = morning; 4-part "1-1-1-1" adds evening.
- OD/QD = once daily (morning unless HS), BD/BID = morning+night, TDS/TID = morning+afternoon+night, QID = all four, HS = bedtime (night), SOS/PRN = only when needed (sos=true, no slots).
- AC = before food, PC = after food; "empty stomach" for thyroid/early-morning meds; "x 5 days", "5/7" = 5 days, "1/52" = 1 week, "x 1 month" = 30 days, "cont." = ongoing (null).
- Correct common handwriting misreads to the real Indian brand (e.g. "Augmentin 625", "Pan 40", "Dolo 650", "Montair LC", "Azee 500", "Thyronorm").
- Eye/ear drops: dose like "1 drop each eye". Creams: "thin layer". Syrups: ml.

Confidence: lower it (<0.7) whenever handwriting is ambiguous, the brand is uncertain, or timing is inferred rather than written.
category: pick the body system the illness belongs to; "chronic" only for long-term conditions (BP, thyroid, diabetes).
episodeTitle: a short, friendly patient-facing title (2-4 words, e.g. "Throat infection", "Red, itchy eyes"), in English and simple Hindi.
warnings: include unclear items, look-alike drug names, missing durations for antibiotics.
If the image is not a prescription, set isPrescription=false and return empty medicines.`;

type Raw = Omit<ScanResult, "medicines"> & {
  medicines: (ScanResult["medicines"][number] & {
    morning: boolean; afternoon: boolean; evening: boolean; night: boolean; purposeEn: string; purposeHi: string;
  })[];
};

export async function POST(req: Request) {
  if (!hasKey()) {
    return NextResponse.json({ error: "no_key", message: "GEMINI_API_KEY is not set on the server." }, { status: 503 });
  }
  try {
    const body = (await req.json()) as { images: { data: string; mimeType: string }[] };
    if (!body?.images?.length) return NextResponse.json({ error: "no_image" }, { status: 400 });
    const imgs = body.images.slice(0, 3);
    const raw = await generateJSON<Raw>(
      [{ text: PROMPT }, ...imgs.map((i) => ({ inlineData: { data: i.data, mimeType: i.mimeType || "image/jpeg" } }))],
      schema,
    );
    const cat = CATEGORIES.includes(raw.category) ? raw.category : "other";
    const result: ScanResult = {
      ...raw,
      isPrescription: raw.isPrescription !== false,
      legibility: raw.legibility ?? "partly",
      doctor: raw.doctor || "Doctor",
      category: cat as ScanResult["category"],
      episodeTitle: {
        en: raw.episodeTitle?.en || raw.diagnosis || "New episode",
        hi: raw.episodeTitle?.hi || raw.episodeTitle?.en || raw.diagnosis || "नई बीमारी",
      },
      advice: Array.isArray(raw.advice) ? raw.advice : [],
      warnings: Array.isArray(raw.warnings) ? raw.warnings : [],
      medicines: (raw.medicines ?? []).map((m) => {
        let slots = { morning: !!m.morning, afternoon: !!m.afternoon, evening: !!m.evening, night: !!m.night };
        if (!m.sos && !Object.values(slots).some(Boolean) && m.frequencyCode) slots = slotsFromCode(m.frequencyCode);
        return {
          name: m.name || "Medicine",
          generic: m.generic,
          strength: m.strength,
          form: FORMS.includes(m.form) ? m.form : "other",
          dose: m.dose || "As directed",
          frequencyCode: m.frequencyCode,
          slots,
          sos: !!m.sos,
          food: (["before", "after", "with", "empty", "any"] as const).includes(m.food) ? m.food : "any",
          durationDays: m.durationDays ?? null,
          purpose: { en: m.purposeEn || "", hi: m.purposeHi || m.purposeEn || "" },
          confidence: Math.max(0, Math.min(1, Number(m.confidence ?? 0.6))),
        };
      }),
    };
    return NextResponse.json(result);
  } catch (e) {
    const msg = String((e as Error)?.message ?? e);
    console.error("scan failed", msg);
    const status = /429|RESOURCE_EXHAUSTED/.test(msg) ? 429 : 500;
    return NextResponse.json({ error: "scan_failed", message: msg.slice(0, 300) }, { status });
  }
}
