import type { ScanResult } from "./types";

const S = (m: Partial<Record<"morning" | "afternoon" | "evening" | "night", boolean>>) => ({
  morning: !!m.morning, afternoon: !!m.afternoon, evening: !!m.evening, night: !!m.night,
});

export interface Sample {
  id: string;
  label: { en: string; hi: string };
  kind: { en: string; hi: string };
  src: string;
  thumb: string;
  memberHint: string;
  cached: ScanResult;
}

export const SAMPLES: Sample[] = [
  {
    id: "gp-fever",
    label: { en: "GP · fever & cough", hi: "डॉक्टर · बुखार-खाँसी" },
    kind: { en: "Handwritten", hi: "हाथ से लिखी" },
    src: "/samples/gp-fever.jpg",
    thumb: "/samples/gp-fever-thumb.jpg",
    memberHint: "riya",
    cached: {
      isPrescription: true,
      legibility: "partly",
      doctor: "Dr. R. K. Malhotra",
      specialty: "General Physician (MD Medicine)",
      clinic: "Malhotra Family Clinic, Kalkaji",
      date: "2026-09-29",
      patientName: "Riya",
      diagnosis: "Fever for 2 days with sore throat and dry cough",
      category: "fever",
      episodeTitle: { en: "Fever & cough", hi: "बुखार और खाँसी" },
      medicines: [
        { name: "Dolo 650", generic: "Paracetamol", strength: "650 mg", form: "tablet", dose: "1 tablet", frequencyCode: "1-1-1", slots: S({ morning: true, afternoon: true, night: true }), sos: false, food: "after", durationDays: 3, purpose: { en: "Brings down fever and pain", hi: "बुखार और दर्द कम करता है" }, confidence: 0.96 },
        { name: "Allegra 120", generic: "Fexofenadine", strength: "120 mg", form: "tablet", dose: "1 tablet", frequencyCode: "0-0-1", slots: S({ night: true }), sos: false, food: "any", durationDays: 5, purpose: { en: "For allergy, runny nose, throat irritation", hi: "एलर्जी और गले की खराश के लिए" }, confidence: 0.88 },
        { name: "Ascoril LS Syrup", generic: "Ambroxol + Levosalbutamol + Guaifenesin", form: "syrup", dose: "10 ml", frequencyCode: "TDS", slots: S({ morning: true, afternoon: true, night: true }), sos: false, food: "after", durationDays: 5, purpose: { en: "Loosens cough and eases breathing", hi: "खाँसी ढीली करता है, साँस आसान" }, confidence: 0.82 },
        { name: "Pan 40", generic: "Pantoprazole", strength: "40 mg", form: "tablet", dose: "1 tablet", frequencyCode: "1-0-0", slots: S({ morning: true }), sos: false, food: "before", durationDays: 5, purpose: { en: "Prevents acidity", hi: "एसिडिटी से बचाता है" }, confidence: 0.93 },
      ],
      advice: ["Steam inhalation twice a day", "Warm fluids", "Review if fever lasts more than 3 days"],
      followUp: "If fever > 3 days",
      warnings: ["Ascoril LS can cause tremor or palpitations in some people"],
    },
  },
  {
    id: "derm-acne",
    label: { en: "Dermatologist · acne", hi: "त्वचा विशेषज्ञ · मुँहासे" },
    kind: { en: "Printed", hi: "प्रिंटेड" },
    src: "/samples/derm-acne.jpg",
    thumb: "/samples/derm-acne-thumb.jpg",
    memberHint: "riya",
    cached: {
      isPrescription: true,
      legibility: "clear",
      doctor: "Dr. Arjun Mehta",
      specialty: "Dermatologist",
      clinic: "SkinFirst Clinic, Greater Kailash II",
      date: "2026-09-15",
      patientName: "Riya M.",
      diagnosis: "Acne (grade II) with dark marks",
      category: "skin",
      episodeTitle: { en: "Acne & dark marks", hi: "मुँहासे और दाग" },
      medicines: [
        { name: "Adaferin Gel 0.1%", generic: "Adapalene", strength: "0.1%", form: "cream", dose: "Pea-sized, whole face", frequencyCode: "HS", slots: S({ night: true }), sos: false, food: "any", durationDays: 56, purpose: { en: "Unclogs pores, prevents new pimples", hi: "रोमछिद्र खोलता है, नए मुँहासे रोकता है" }, confidence: 0.98 },
        { name: "Clindac A Gel", generic: "Clindamycin", strength: "1%", form: "cream", dose: "Thin layer on pimples", frequencyCode: "BD", slots: S({ morning: true, night: true }), sos: false, food: "any", durationDays: 42, purpose: { en: "Antibiotic gel for active pimples", hi: "मुँहासों के लिए एंटीबायोटिक जेल" }, confidence: 0.97 },
        { name: "Doxt-SL 100", generic: "Doxycycline", strength: "100 mg", form: "tablet", dose: "1 tablet", frequencyCode: "0-0-1", slots: S({ night: true }), sos: false, food: "after", durationDays: 28, purpose: { en: "Antibiotic that calms inflamed acne", hi: "सूजे मुँहासों के लिए एंटीबायोटिक" }, confidence: 0.97 },
        { name: "Suncros Aqua SPF 50", generic: "Sunscreen", form: "cream", dose: "2 finger-lengths", frequencyCode: "Morning, reapply 3-hourly", slots: S({ morning: true }), sos: false, food: "any", durationDays: null, purpose: { en: "Protects skin, stops marks darkening", hi: "धूप से बचाव, दाग गहरे नहीं होते" }, confidence: 0.95 },
      ],
      advice: ["Don't pick or squeeze", "Mild dryness for 1–2 weeks is expected", "Take doxycycline with a full glass of water; stay upright 30 min"],
      followUp: "After 4 weeks",
      warnings: [],
    },
  },
  {
    id: "dental",
    label: { en: "Dentist · root canal", hi: "दाँत · रूट कैनाल" },
    kind: { en: "Handwritten", hi: "हाथ से लिखी" },
    src: "/samples/dental.jpg",
    thumb: "/samples/dental-thumb.jpg",
    memberHint: "maa",
    cached: {
      isPrescription: true,
      legibility: "partly",
      doctor: "Dr. Priya Nair",
      specialty: "Dentist (Endodontist)",
      clinic: "Smile Dental Care, Malviya Nagar",
      date: "2026-09-30",
      patientName: "Sunita",
      diagnosis: "Tooth pain in a lower left molar, root canal started",
      category: "infection",
      episodeTitle: { en: "Tooth pain (root canal)", hi: "दाँत दर्द (रूट कैनाल)" },
      medicines: [
        { name: "Mox 500", generic: "Amoxicillin", strength: "500 mg", form: "capsule", dose: "1 capsule", frequencyCode: "1-1-1", slots: S({ morning: true, afternoon: true, night: true }), sos: false, food: "after", durationDays: 5, purpose: { en: "Antibiotic for the tooth infection", hi: "दाँत के इन्फ़ेक्शन की एंटीबायोटिक" }, confidence: 0.84 },
        { name: "Ketorol DT", generic: "Ketorolac", strength: "10 mg", form: "tablet", dose: "1 tablet", frequencyCode: "SOS", slots: S({}), sos: true, food: "after", durationDays: null, purpose: { en: "Strong painkiller, only if needed", hi: "तेज़ दर्द निवारक, ज़रूरत पर ही" }, confidence: 0.86 },
        { name: "Pan D", generic: "Pantoprazole + Domperidone", form: "tablet", dose: "1 tablet", frequencyCode: "1-0-0", slots: S({ morning: true }), sos: false, food: "empty", durationDays: 5, purpose: { en: "Prevents acidity and nausea", hi: "एसिडिटी और जी मिचलाने से बचाव" }, confidence: 0.9 },
        { name: "Hexidine Mouthwash", generic: "Chlorhexidine 0.2%", form: "gargle", dose: "10 ml", frequencyCode: "BD", slots: S({ morning: true, night: true }), sos: false, food: "after", durationDays: null, purpose: { en: "Keeps the mouth clean after treatment", hi: "इलाज के बाद मुँह साफ़ रखता है" }, confidence: 0.83 },
      ],
      advice: ["Avoid chewing on the left side", "Next sitting on 7 Oct"],
      followUp: "2026-10-07",
      warnings: ["'Mox' is amoxicillin, which is a penicillin. Check allergy history.", "Ketorolac is an NSAID; avoid if you have kidney issues or acidity."],
    },
  },
];
