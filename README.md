# Rxwind: remember what worked

**Live app:** https://rxwind-palash-jain-nine.vercel.app

Rxwind turns Indian prescriptions ("parchis") into a health memory for the whole family.

## What it does

- **Snap a parchi.** Gemini reads the handwriting and decodes Indian shorthand (1-0-1, BD, TDS, HS, SOS, AC/PC) into a Morning, Afternoon, Evening and Night plan. Works in English and Hindi, with a confidence score per medicine.
- **Safety checks.** Every medicine is checked against the family member's allergies and current medicines, with duplicate-ingredient warnings.
- **Daily tracking.** Tick off doses, add reminders to Google, Apple or Outlook calendar, and log how you feel.
- **Is it working?** Report a side effect or a medicine that isn't helping. Rxwind checks whether it's a known effect of that medicine, explains likely reasons it isn't working (too early, missed doses, food timing), and lists red flags for when to call a doctor. Gemini does the analysis, with a built-in medicine library as an offline fallback.
- **Rewind.** Every illness, doctor and medicine on one timeline. Bulk-upload old parchis to build it in seconds.
- **Season radar.** A 12-month wheel of past illnesses that warns before a recurring one comes back, with what worked last time and live AQI from Open-Meteo.
- **Doctor brief.** A two-minute summary of what helped, what didn't and what to avoid, shared on WhatsApp or saved as PDF.

Rxwind never recommends, stops or changes medicines. All data stays in the browser (localStorage). No sign-up.

## Stack

Next.js 15, React 19, TypeScript, Tailwind v4, Motion, Gemini (`@google/genai`) via server routes `/api/scan`, `/api/medcheck` and `/api/brief`.

## Run locally

```
npm install
GEMINI_API_KEY=your-key npm run dev
```

Optional: set `GEMINI_MODEL` to pin a model. By default it uses `gemini-flash-latest` and falls back to other Flash models if one is busy.

The demo profile (Riya and her mother) works without a key. Scanning a real parchi needs `GEMINI_API_KEY`.
