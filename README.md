# Rxwind — remember what worked

Rxwind turns Indian prescriptions ("parchis") into a living health memory.

- **Snap a parchi** → Gemini Vision decodes handwriting and Indian shorthand (1-0-1, BD, TDS, HS, SOS, AC/PC) into a Subah → Raat dose plan, in English or Hindi, with per-medicine confidence.
- **Safety checks** → allergy cross-check against the family member's profile and duplicate-ingredient warnings across active prescriptions.
- **Daily one-tap check-in** → how you feel + side effects, and a per-medicine "did it help?" verdict.
- **Rewind** → every illness, doctor and medicine on one timeline; bulk-upload old parchis to build it in seconds.
- **Season radar** → a 12-month wheel of your past episodes that flags what's likely to come back (with live AQI from Open-Meteo).
- **Doctor brief** → a one-page, AI-summarised history to share on WhatsApp or save as PDF.

Rxwind never recommends or changes medicines. Data stays in the browser (localStorage).

## Stack
Next.js 15 · React 19 · Tailwind v4 · Motion · Gemini (`@google/genai`) via server routes `/api/scan` and `/api/brief`.

## Run
```
npm install
GEMINI_API_KEY=... npm run dev
```
Optional: `GEMINI_MODEL` to pin a model (defaults to `gemini-flash-latest` with fallbacks).
