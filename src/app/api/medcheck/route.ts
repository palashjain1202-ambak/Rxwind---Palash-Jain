import { NextResponse } from "next/server";
import { generateJSON, hasKey } from "@/lib/server/gemini";

export const runtime = "nodejs";
export const maxDuration = 45;

const MATCH = ["common", "uncommon", "serious", "not-typical", "likely", "possible", "unlikely"];

const schema = {
  type: "OBJECT",
  properties: {
    summary: { type: "STRING", description: "One plain sentence, max 18 words" },
    findings: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          label: { type: "STRING", description: "Short label: the symptom (for side effects) or the reason (for not working)" },
          match: { type: "STRING", enum: MATCH },
          detail: { type: "STRING", description: "1-2 plain sentences explaining why" },
        },
        required: ["label", "match", "detail"],
      },
    },
    selfCare: { type: "ARRAY", items: { type: "STRING" } },
    askDoctor: { type: "ARRAY", items: { type: "STRING" } },
    redFlags: { type: "ARRAY", items: { type: "STRING" } },
    urgent: { type: "BOOLEAN" },
  },
  required: ["summary", "findings", "selfCare", "askDoctor", "redFlags", "urgent"],
};

const PROMPT = `You are a careful clinical pharmacist helping an Indian patient understand how a prescribed medicine is affecting them.
You EXPLAIN; you never prescribe. Rules:
- Never tell the patient to stop, start, skip or change the dose of any medicine. Say "talk to your doctor" instead.
- Never suggest a new medicine by name.
- For SIDE EFFECTS: for each reported symptom, say whether it is a known side effect of this exact medicine (match: common / uncommon / serious if rare-but-important) or not typical (match: not-typical). If not typical, say if another current medicine or the illness itself is a more likely cause. Be accurate to standard drug references.
- For NOT WORKING: list the most plausible reasons ranked (match: likely / possible / unlikely). Consider: too early for this drug class (give the usual time to work), missed doses, wrong timing relative to food, the drug class not matching the likely cause (e.g. antibiotics don't treat viral or allergic illness), interactions with other current medicines, and anything in the patient's reports. Phrase diagnostic doubts as questions for the doctor.
- selfCare: only safe, non-prescriptive tips (e.g. take as prescribed with food if the prescription says so, hydration, reminders). Max 3.
- askDoctor: 2-3 short questions the patient can ask.
- redFlags: warning signs that need urgent care, specific to this medicine and situation. Always include signs of a serious allergic reaction. Mention 112 as India's emergency number.
- urgent=true if any reported symptom suggests anaphylaxis, severe reaction, or the patient marked severe.
- Plain, warm, short sentences. No em dashes. Write everything in LANGUAGE.

DATA:
`;

export async function POST(req: Request) {
  if (!hasKey()) return NextResponse.json({ error: "no_key" }, { status: 503 });
  try {
    const body = await req.json();
    const lang = body?.lang === "hi" ? "simple Hindi (Devanagari)" : "English";
    const out = await generateJSON<Record<string, unknown>>(
      [{ text: PROMPT.replace("LANGUAGE", lang) + JSON.stringify(body).slice(0, 12000) }],
      schema,
      { temperature: 0.2 },
    );
    const findings = Array.isArray(out.findings) ? (out.findings as { label: string; match: string; detail: string }[]) : [];
    return NextResponse.json({
      summary: String(out.summary ?? ""),
      findings: findings.filter((f) => f?.label && f?.detail).map((f) => ({ ...f, match: MATCH.includes(f.match) ? f.match : "possible" })),
      selfCare: Array.isArray(out.selfCare) ? out.selfCare : [],
      askDoctor: Array.isArray(out.askDoctor) ? out.askDoctor : [],
      redFlags: Array.isArray(out.redFlags) ? out.redFlags : [],
      urgent: Boolean(out.urgent),
    });
  } catch (e) {
    const msg = String((e as Error)?.message ?? e);
    console.error("medcheck failed", msg);
    return NextResponse.json({ error: "medcheck_failed" }, { status: 500 });
  }
}
