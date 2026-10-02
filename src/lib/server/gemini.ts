import { GoogleGenAI } from "@google/genai";

const FALLBACK_MODELS = ["gemini-flash-latest", "gemini-3.8-flash", "gemini-2.5-flash", "gemini-2.0-flash"];

export function hasKey() {
  return Boolean(process.env.GEMINI_API_KEY);
}

type Part = { text: string } | { inlineData: { data: string; mimeType: string } };

/** Calls Gemini with JSON output, walking a model fallback chain on 404/429/5xx. */
export async function generateJSON<T>(parts: Part[], schema: object, opts: { temperature?: number } = {}): Promise<T> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const models = [process.env.GEMINI_MODEL, ...FALLBACK_MODELS].filter(Boolean) as string[];
  let lastErr: unknown;
  for (const model of models) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: [{ role: "user", parts }],
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
          temperature: opts.temperature ?? 0.1,
        },
      });
      const text = res.text ?? "";
      return JSON.parse(text) as T;
    } catch (e) {
      lastErr = e;
      const msg = String((e as Error)?.message ?? e);
      // Try the next model on not-found, quota or transient errors
      if (/404|not found|NOT_FOUND|429|RESOURCE_EXHAUSTED|500|503|UNAVAILABLE|overloaded|deprecated/i.test(msg)) continue;
      if (e instanceof SyntaxError) continue;
      throw e;
    }
  }
  throw lastErr ?? new Error("All models failed");
}
