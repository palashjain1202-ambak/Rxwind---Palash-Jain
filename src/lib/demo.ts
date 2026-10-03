import type { CheckIn, Episode, Food, Form, Medicine, MemoryState, Prescription, Verdict } from "./types";
import { addDays, daysBetween, slotsFromCode, todayISO } from "./util";
import type { MedReport } from "./types";
import { analyzeLocal } from "./medkb";

let n = 0;
const id = (p: string) => `${p}${++n}`;

function med(
  name: string,
  o: {
    generic?: string;
    strength?: string;
    form: Form;
    dose: string;
    code: string;
    food: Food;
    days?: number | null;
    en: string;
    hi: string;
    sos?: boolean;
    verdict?: Verdict;
    side?: string[];
    conf?: number;
  },
): Medicine {
  return {
    id: id("m"),
    name,
    generic: o.generic,
    strength: o.strength,
    form: o.form,
    dose: o.dose,
    frequencyCode: o.code,
    slots: o.sos ? { morning: false, afternoon: false, evening: false, night: false } : slotsFromCode(o.code),
    sos: o.sos,
    food: o.food,
    durationDays: o.days ?? null,
    purpose: { en: o.en, hi: o.hi },
    confidence: o.conf ?? 0.97,
    verdict: o.verdict,
    sideEffects: o.side,
  };
}

function rx(p: Omit<Prescription, "id" | "source">): Prescription {
  return { ...p, id: id("rx"), source: "demo" };
}

const ci = (date: string, feeling: CheckIn["feeling"], sideEffects: string[] = [], note?: string): CheckIn => ({
  date,
  feeling,
  sideEffects,
  note,
});

const SEED: Record<string, Omit<MedReport, "date" | "analysis"> & { after: number }> = {
  "Azee 500": { kind: "side-effect", symptoms: ["acidity"], severity: "moderate", onset: "first-dose", after: 1 },
  "Levocet 5": { kind: "side-effect", symptoms: ["drowsy"], severity: "moderate", onset: "first-dose", after: 1 },
  "Zerodol-P": { kind: "side-effect", symptoms: ["acidity"], severity: "moderate", onset: "few-days", after: 3 },
  "Moxicip Eye Drops": { kind: "not-working", symptoms: [], missed: "none", asInstructed: "yes", trend: "same", after: 3 },
};

/** Gives the demo a few past medicine checks, analysed by the offline library. Idempotent. */
export function seedReports(s: MemoryState): MemoryState {
  let changed = false;
  const episodes = s.episodes.map((ep) => {
    if (ep.status !== "resolved") return ep;
    const all = ep.prescriptions.flatMap((p) => p.medicines);
    return {
      ...ep,
      prescriptions: ep.prescriptions.map((p) => ({
        ...p,
        medicines: p.medicines.map((m) => {
          const seed = SEED[m.name];
          if (!seed || m.report) return m;
          changed = true;
          const { after, ...rest } = seed;
          const date = addDays(p.date, after);
          const report: MedReport = { ...rest, date };
          const ctx = { dayIndex: daysBetween(p.date, date) + 1, others: all.filter((o) => o.id !== m.id), diagnosis: p.diagnosis };
          return { ...m, report: { ...report, analysis: analyzeLocal(m, report, ctx, "en") } };
        }),
      })),
    };
  });
  return changed ? { ...s, episodes } : s;
}

export function buildDemo(): MemoryState {
  n = 0;
  const today = todayISO();
  const activeStart = addDays(today, -3);

  const episodes: Episode[] = [
    {
      id: "ep-eye-25",
      memberId: "riya",
      title: "Red, itchy eyes",
      category: "eye",
      startDate: "2025-05-06",
      endDate: "2025-05-14",
      status: "resolved",
      city: "Delhi",
      prescriptions: [
        rx({
          doctor: "Dr. Anil Sharma",
          specialty: "General Physician",
          clinic: "Sharma Clinic, Lajpat Nagar",
          date: "2025-05-06",
          diagnosis: "Red eyes, ? conjunctivitis",
          medicines: [
            med("Moxicip Eye Drops", {
              generic: "Moxifloxacin", strength: "0.5%", form: "drops", dose: "1 drop each eye", code: "QID",
              food: "any", days: 5, en: "Antibiotic eye drops", hi: "एंटीबायोटिक आई ड्रॉप", verdict: "no-change", side: ["Burning"],
            }),
            med("Dolo 650", {
              generic: "Paracetamol", strength: "650 mg", form: "tablet", dose: "1 tablet", code: "SOS", food: "after",
              en: "For pain or fever", hi: "दर्द या बुखार के लिए", sos: true, verdict: "unsure",
            }),
          ],
          advice: ["Wash hands often", "Don't share towels"],
        }),
        rx({
          doctor: "Dr. Kavya Rao",
          specialty: "Ophthalmologist",
          clinic: "Rao Eye Centre, Defence Colony",
          date: "2025-05-10",
          diagnosis: "Allergic conjunctivitis (seasonal)",
          medicines: [
            med("Olopat Eye Drops", {
              generic: "Olopatadine", strength: "0.1%", form: "drops", dose: "1 drop each eye", code: "BD", food: "any",
              days: 14, en: "Anti-allergy eye drops", hi: "एलर्जी की आई ड्रॉप", verdict: "helped",
            }),
            med("Refresh Tears", {
              generic: "Carboxymethylcellulose", strength: "0.5%", form: "drops", dose: "1 drop each eye", code: "QID",
              food: "any", days: 30, en: "Lubricating eye drops", hi: "आँखों को नम रखने वाली ड्रॉप", verdict: "helped",
            }),
          ],
          advice: ["Cold compress twice a day", "Don't rub eyes", "Wraparound sunglasses outdoors"],
          followUp: "If not better in 1 week",
        }),
      ],
      checkIns: [
        ci("2025-05-06", 2, ["Burning"]),
        ci("2025-05-08", 2, ["Burning"]),
        ci("2025-05-09", 1, [], "Worse. Both eyes now."),
        ci("2025-05-10", 2),
        ci("2025-05-11", 3),
        ci("2025-05-12", 4),
        ci("2025-05-14", 5),
      ],
      outcome: {
        en: "Antibiotic drops didn't help and stung. Cleared 2 days after switching to anti-allergy drops. 8 days in total.",
        hi: "एंटीबायोटिक ड्रॉप से फ़ायदा नहीं हुआ, जलन हुई। एलर्जी ड्रॉप शुरू करने के 2 दिन बाद ठीक। कुल 8 दिन।",
      },
    },
    {
      id: "ep-cough-25",
      memberId: "riya",
      title: "Smog cough",
      category: "respiratory",
      startDate: "2025-11-08",
      endDate: "2025-11-26",
      status: "resolved",
      city: "Delhi",
      prescriptions: [
        rx({
          doctor: "Dr. Anil Sharma",
          specialty: "General Physician",
          clinic: "Sharma Clinic, Lajpat Nagar",
          date: "2025-11-08",
          diagnosis: "Acute bronchitis",
          medicines: [
            med("Azee 500", {
              generic: "Azithromycin", strength: "500 mg", form: "tablet", dose: "1 tablet", code: "OD", food: "after",
              days: 3, en: "Antibiotic", hi: "एंटीबायोटिक", verdict: "side-effect", side: ["Acidity"],
            }),
            med("Montair LC", {
              generic: "Montelukast + Levocetirizine", strength: "10/5 mg", form: "tablet", dose: "1 tablet", code: "HS",
              food: "any", days: 10, en: "For allergy and airway swelling", hi: "एलर्जी और साँस की सूजन के लिए", verdict: "helped",
            }),
            med("Pan 40", {
              generic: "Pantoprazole", strength: "40 mg", form: "tablet", dose: "1 tablet", code: "OD", food: "before",
              days: 5, en: "Protects the stomach from acidity", hi: "एसिडिटी से पेट की रक्षा", verdict: "unsure",
            }),
          ],
          advice: ["Steam inhalation twice daily", "Warm fluids"],
        }),
        rx({
          doctor: "Dr. Neha Kapoor",
          specialty: "Pulmonologist",
          clinic: "Breathe Well Clinic, Saket",
          date: "2025-11-14",
          diagnosis: "Allergic bronchitis triggered by air pollution",
          medicines: [
            med("Budecort 200 Inhaler", {
              generic: "Budesonide", strength: "200 mcg", form: "inhaler", dose: "2 puffs", code: "BD", food: "any",
              days: 21, en: "Calms swollen airways", hi: "साँस की नली की सूजन कम करता है", verdict: "helped",
            }),
            med("Montair LC", {
              generic: "Montelukast + Levocetirizine", strength: "10/5 mg", form: "tablet", dose: "1 tablet", code: "HS",
              food: "any", days: 14, en: "For allergy and airway swelling", hi: "एलर्जी और साँस की सूजन के लिए", verdict: "helped",
            }),
          ],
          advice: ["Rinse mouth after inhaler", "N95 mask when AQI > 200", "Avoid morning walks on high-AQI days"],
          followUp: "Review in 3 weeks",
        }),
      ],
      checkIns: [
        ci("2025-11-08", 2),
        ci("2025-11-10", 2, ["Acidity"]),
        ci("2025-11-12", 2, ["Acidity"], "Cough same. Stomach upset."),
        ci("2025-11-14", 2),
        ci("2025-11-17", 3),
        ci("2025-11-20", 4),
        ci("2025-11-26", 5),
      ],
      outcome: {
        en: "Antibiotic caused acidity and the cough didn't shift. Inhaler + Montair settled it in ~12 days. AQI in Delhi was above 350 that week.",
        hi: "एंटीबायोटिक से एसिडिटी हुई और खाँसी नहीं गई। इनहेलर + मोंटेयर से ~12 दिन में ठीक। उस हफ़्ते दिल्ली का AQI 350 से ऊपर था।",
      },
    },
    {
      id: "ep-fever-26",
      memberId: "riya",
      title: "Viral fever",
      category: "fever",
      startDate: "2026-02-12",
      endDate: "2026-02-16",
      status: "resolved",
      city: "Delhi",
      prescriptions: [
        rx({
          doctor: "Dr. Anil Sharma",
          specialty: "General Physician",
          clinic: "Sharma Clinic, Lajpat Nagar",
          date: "2026-02-12",
          diagnosis: "Viral fever",
          medicines: [
            med("Dolo 650", {
              generic: "Paracetamol", strength: "650 mg", form: "tablet", dose: "1 tablet", code: "TDS", food: "after",
              days: 3, en: "Brings down fever", hi: "बुखार कम करता है", verdict: "helped",
            }),
            med("Electral ORS", {
              generic: "Oral rehydration salts", form: "powder", dose: "1 sachet in 1 L water", code: "1-1-1", food: "any",
              days: 3, en: "Keeps you hydrated", hi: "शरीर में पानी बनाए रखता है", verdict: "helped",
            }),
          ],
          advice: ["Rest", "Plenty of fluids"],
        }),
      ],
      checkIns: [ci("2026-02-12", 2), ci("2026-02-14", 3), ci("2026-02-16", 5)],
      outcome: { en: "Settled in 4 days with rest and paracetamol.", hi: "आराम और पैरासिटामोल से 4 दिन में ठीक।" },
    },
    {
      id: "ep-eye-26",
      memberId: "riya",
      title: "Red, itchy eyes",
      category: "eye",
      startDate: "2026-04-29",
      endDate: "2026-05-02",
      status: "resolved",
      city: "Delhi",
      prescriptions: [
        rx({
          doctor: "Dr. Kavya Rao",
          specialty: "Ophthalmologist",
          clinic: "Rao Eye Centre, Defence Colony",
          date: "2026-04-29",
          diagnosis: "Allergic conjunctivitis (seasonal), early",
          medicines: [
            med("Olopat Eye Drops", {
              generic: "Olopatadine", strength: "0.1%", form: "drops", dose: "1 drop each eye", code: "BD", food: "any",
              days: 14, en: "Anti-allergy eye drops", hi: "एलर्जी की आई ड्रॉप", verdict: "helped",
            }),
            med("Refresh Tears", {
              generic: "Carboxymethylcellulose", strength: "0.5%", form: "drops", dose: "1 drop each eye", code: "QID",
              food: "any", days: 30, en: "Lubricating eye drops", hi: "आँखों को नम रखने वाली ड्रॉप", verdict: "helped",
            }),
          ],
          advice: ["Cold compress", "Sunglasses outdoors"],
        }),
      ],
      checkIns: [ci("2026-04-29", 3), ci("2026-04-30", 4), ci("2026-05-02", 5)],
      outcome: {
        en: "Saw the eye doctor at the first itch, carrying last year's brief. Over in 3 days instead of 8.",
        hi: "पहली खुजली पर ही पिछले साल का ब्रीफ़ लेकर आँखों के डॉक्टर के पास गईं। 8 की जगह 3 दिन में ठीक।",
      },
    },
    {
      id: "ep-skin-26",
      memberId: "riya",
      title: "Monsoon fungal rash",
      category: "skin",
      startDate: "2026-08-03",
      endDate: "2026-08-31",
      status: "resolved",
      city: "Delhi",
      prescriptions: [
        rx({
          doctor: "Dr. Arjun Mehta",
          specialty: "Dermatologist",
          clinic: "SkinFirst, Greater Kailash",
          date: "2026-08-03",
          diagnosis: "Tinea corporis",
          medicines: [
            med("Lulifin Cream", {
              generic: "Luliconazole", strength: "1%", form: "cream", dose: "Thin layer", code: "BD", food: "any",
              days: 28, en: "Antifungal cream", hi: "फंगल इन्फ़ेक्शन की क्रीम", verdict: "helped",
            }),
            med("Forcan 150", {
              generic: "Fluconazole", strength: "150 mg", form: "tablet", dose: "1 tablet once a week", code: "OD",
              food: "after", days: 28, en: "Antifungal tablet (weekly)", hi: "फंगल की गोली (हफ़्ते में एक)", verdict: "helped",
            }),
            med("Levocet 5", {
              generic: "Levocetirizine", strength: "5 mg", form: "tablet", dose: "1 tablet", code: "HS", food: "any",
              days: 10, en: "Reduces itching", hi: "खुजली कम करता है", verdict: "side-effect", side: ["Drowsy"],
            }),
          ],
          advice: ["Keep the area dry", "Loose cotton clothes", "Don't stop the cream early"],
        }),
      ],
      checkIns: [ci("2026-08-03", 2), ci("2026-08-08", 3, ["Drowsy"]), ci("2026-08-17", 4), ci("2026-08-31", 5)],
      outcome: { en: "Cleared in 4 weeks. Levocet made you drowsy at work.", hi: "4 हफ़्ते में ठीक। लेवोसेट से काम पर नींद आती थी।" },
    },
    {
      id: "ep-throat-active",
      memberId: "riya",
      title: "Throat infection",
      category: "infection",
      startDate: activeStart,
      endDate: null,
      status: "active",
      city: "Delhi",
      prescriptions: [
        rx({
          doctor: "Dr. Anil Sharma",
          specialty: "General Physician",
          clinic: "Sharma Clinic, Lajpat Nagar",
          date: activeStart,
          diagnosis: "Acute pharyngitis",
          medicines: [
            med("Augmentin 625 Duo", {
              generic: "Amoxicillin + Clavulanic acid", strength: "625 mg", form: "tablet", dose: "1 tablet", code: "1-0-1",
              food: "after", days: 5, en: "Antibiotic for the throat infection", hi: "गले के इन्फ़ेक्शन की एंटीबायोटिक",
            }),
            med("Pan 40", {
              generic: "Pantoprazole", strength: "40 mg", form: "tablet", dose: "1 tablet", code: "1-0-0", food: "before",
              days: 5, en: "Protects the stomach from acidity", hi: "एसिडिटी से पेट की रक्षा",
            }),
            med("Betadine Gargle", {
              generic: "Povidone-iodine 2%", form: "gargle", dose: "10 ml in warm water", code: "1-1-1", food: "after",
              days: 5, en: "Soothes and disinfects the throat", hi: "गले को आराम और सफ़ाई",
            }),
            med("Dolo 650", {
              generic: "Paracetamol", strength: "650 mg", form: "tablet", dose: "1 tablet", code: "SOS", food: "after",
              en: "Only if fever is above 100°F", hi: "सिर्फ़ 100°F से ज़्यादा बुखार पर", sos: true,
            }),
          ],
          advice: ["Warm salt-water gargles", "Avoid cold drinks"],
          followUp: "If fever persists beyond 3 days",
        }),
      ],
      checkIns: [ci(activeStart, 2), ci(addDays(activeStart, 1), 2), ci(addDays(activeStart, 2), 3)],
      doses: Object.fromEntries(
        [0, 1, 2].map((d) => [
          addDays(activeStart, d),
          { "m*:morning": true, "m*:night": true, "m*:afternoon": true },
        ]),
      ),
      outcome: null,
    },
    // Maa
    {
      id: "ep-maa-chronic",
      memberId: "maa",
      title: "BP & thyroid",
      category: "chronic",
      startDate: "2024-12-10",
      endDate: null,
      status: "ongoing",
      city: "Delhi",
      prescriptions: [
        rx({
          doctor: "Dr. Suresh Bhatia",
          specialty: "Physician",
          clinic: "Bhatia Health Clinic, Malviya Nagar",
          date: "2024-12-10",
          diagnosis: "Hypertension; Hypothyroidism",
          medicines: [
            med("Thyronorm 50", {
              generic: "Levothyroxine", strength: "50 mcg", form: "tablet", dose: "1 tablet at 6 AM", code: "1-0-0",
              food: "empty", days: null, en: "Thyroid hormone", hi: "थायरॉइड की दवा", verdict: "helped",
            }),
            med("Telma 40", {
              generic: "Telmisartan", strength: "40 mg", form: "tablet", dose: "1 tablet", code: "1-0-0", food: "after",
              days: null, en: "Controls blood pressure", hi: "बीपी कंट्रोल करता है", verdict: "helped",
            }),
            med("Atorva 10", {
              generic: "Atorvastatin", strength: "10 mg", form: "tablet", dose: "1 tablet", code: "0-0-1", food: "after",
              days: null, en: "Lowers cholesterol", hi: "कोलेस्ट्रॉल कम करता है", verdict: "unsure",
            }),
          ],
          advice: ["Low salt", "Walk 30 min daily", "TSH test every 6 months"],
          followUp: "Every 3 months",
        }),
      ],
      checkIns: [],
      outcome: null,
    },
    {
      id: "ep-maa-cough",
      memberId: "maa",
      title: "Smog cough",
      category: "respiratory",
      startDate: "2025-11-10",
      endDate: "2025-11-19",
      status: "resolved",
      city: "Delhi",
      prescriptions: [
        rx({
          doctor: "Dr. Anil Sharma",
          specialty: "General Physician",
          clinic: "Sharma Clinic, Lajpat Nagar",
          date: "2025-11-10",
          diagnosis: "Allergic cough",
          medicines: [
            med("Montair LC", {
              generic: "Montelukast + Levocetirizine", strength: "10/5 mg", form: "tablet", dose: "1 tablet", code: "HS",
              food: "any", days: 10, en: "For allergy and airway swelling", hi: "एलर्जी और साँस की सूजन के लिए", verdict: "helped",
            }),
            med("Ascoril LS Syrup", {
              generic: "Ambroxol + Levosalbutamol + Guaifenesin", form: "syrup", dose: "10 ml", code: "TDS", food: "after",
              days: 5, en: "Loosens cough", hi: "बलगम ढीला करता है", verdict: "helped",
            }),
          ],
          advice: ["Steam inhalation", "Stay indoors on high-AQI days"],
        }),
      ],
      checkIns: [ci("2025-11-10", 2), ci("2025-11-14", 3), ci("2025-11-19", 5)],
      outcome: { en: "Settled in 9 days.", hi: "9 दिन में ठीक।" },
    },
    {
      id: "ep-maa-knee",
      memberId: "maa",
      title: "Knee pain",
      category: "pain",
      startDate: "2026-03-18",
      endDate: "2026-04-10",
      status: "resolved",
      city: "Delhi",
      prescriptions: [
        rx({
          doctor: "Dr. Rohit Verma",
          specialty: "Orthopaedic",
          clinic: "Joint Care Centre, Saket",
          date: "2026-03-18",
          diagnosis: "Early osteoarthritis, right knee",
          medicines: [
            med("Zerodol-P", {
              generic: "Aceclofenac + Paracetamol", strength: "100/325 mg", form: "tablet", dose: "1 tablet", code: "BD",
              food: "after", days: 7, en: "Pain relief", hi: "दर्द से राहत", verdict: "side-effect", side: ["Acidity"],
            }),
            med("Shelcal 500", {
              generic: "Calcium + Vitamin D3", strength: "500 mg", form: "tablet", dose: "1 tablet", code: "0-1-0",
              food: "after", days: 90, en: "Bone strength", hi: "हड्डियों की मज़बूती", verdict: "unsure",
            }),
          ],
          advice: ["Quadriceps exercises daily", "Avoid squatting", "Physiotherapy 2x a week"],
        }),
      ],
      checkIns: [ci("2026-03-18", 2), ci("2026-03-25", 3, ["Acidity"]), ci("2026-04-10", 4)],
      outcome: { en: "Better with physio. Painkiller caused acidity.", hi: "फ़िज़ियो से बेहतर। पेनकिलर से एसिडिटी हुई।" },
    },
  ];

  // Resolve wildcard dose keys for the active episode to real med ids
  for (const ep of episodes) {
    if (!ep.doses) continue;
    const meds = ep.prescriptions.flatMap((p) => p.medicines).filter((m) => !m.sos);
    const resolved: Episode["doses"] = {};
    for (const [date] of Object.entries(ep.doses)) {
      const day: Record<string, boolean> = {};
      for (const m of meds) for (const [slot, on] of Object.entries(m.slots)) if (on) day[`${m.id}:${slot}`] = true;
      resolved[date] = day;
    }
    ep.doses = resolved;
  }

  return seedReports({
    version: 3,
    mode: "demo",
    activeMemberId: "riya",
    city: { name: "Delhi", lat: 28.6139, lon: 77.209 },
    members: [
      {
        id: "riya",
        name: "Riya",
        relation: { en: "You", hi: "आप" },
        age: 29,
        city: "Delhi",
        allergies: [],
        conditions: [],
        tint: "#2fa346",
      },
      {
        id: "maa",
        name: "Sunita",
        relation: { en: "Maa", hi: "माँ" },
        age: 57,
        city: "Delhi",
        allergies: ["Penicillin"],
        conditions: ["Hypertension", "Hypothyroidism"],
        tint: "#6d4cf0",
      },
    ],
    episodes,
  });
}

export function emptyState(): MemoryState {
  return {
    version: 3,
    mode: "mine",
    activeMemberId: "me",
    city: { name: "Delhi", lat: 28.6139, lon: 77.209 },
    members: [
      { id: "me", name: "Me", relation: { en: "You", hi: "आप" }, age: 0, city: "", allergies: [], conditions: [], tint: "#2fa346" },
    ],
    episodes: [],
  };
}
