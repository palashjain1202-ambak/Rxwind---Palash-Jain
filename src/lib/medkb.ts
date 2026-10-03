import type { Lang, MedAnalysis, MedFinding, MedReport, Medicine, SymptomKey } from "./types";

export const SYMPTOMS: SymptomKey[] = [
  "acidity", "nausea", "loose", "constipation", "drowsy", "dizzy", "headache", "burning",
  "rash", "dry-mouth", "palpitations", "muscle", "mood", "swelling", "breathing",
];

export const symptomLabel: Record<Lang, Record<SymptomKey, string>> = {
  en: {
    acidity: "Acidity", nausea: "Nausea", loose: "Loose motions", constipation: "Constipation", drowsy: "Drowsy",
    dizzy: "Dizzy", headache: "Headache", burning: "Burning or stinging", rash: "Rash or itching", "dry-mouth": "Dry mouth",
    palpitations: "Racing heart", muscle: "Muscle pain", mood: "Mood or sleep changes", swelling: "Swollen face or lips",
    breathing: "Trouble breathing",
  },
  hi: {
    acidity: "एसिडिटी", nausea: "जी मिचलाना", loose: "दस्त", constipation: "कब्ज़", drowsy: "नींद आना",
    dizzy: "चक्कर", headache: "सिरदर्द", burning: "जलन", rash: "दाने या खुजली", "dry-mouth": "मुँह सूखना",
    palpitations: "दिल तेज़ धड़कना", muscle: "मांसपेशियों में दर्द", mood: "मूड या नींद में बदलाव", swelling: "चेहरे या होंठ पर सूजन",
    breathing: "साँस लेने में दिक्कत",
  },
};

/** Symptoms that always need urgent care, whatever the medicine. */
export const URGENT: SymptomKey[] = ["swelling", "breathing"];

/** Legacy free-text side effects in demo data → symptom keys */
export const legacyToKey: Record<string, SymptomKey> = {
  Acidity: "acidity", Drowsy: "drowsy", Nausea: "nausea", Headache: "headache", Burning: "burning",
  Dizzy: "dizzy", "Loose motions": "loose", Rash: "rash",
};

type T = { en: string; hi: string };
interface Entry {
  keys: string[];
  cls: T;
  common: SymptomKey[];
  uncommon?: SymptomKey[];
  serious?: SymptomKey[];
  onsetDays: number;
  onsetNote: T;
  why: T[]; // reasons it may not seem to work
  care: T[]; // non-prescriptive tips
}

const t = (en: string, hi: string): T => ({ en, hi });

const KB: Entry[] = [
  {
    keys: ["azithromycin", "azee", "azithral"],
    cls: t("antibiotic (macrolide)", "एंटीबायोटिक"),
    common: ["acidity", "nausea", "loose"],
    uncommon: ["headache", "dizzy"],
    serious: ["palpitations", "rash", "swelling", "breathing"],
    onsetDays: 3,
    onsetNote: t("Short courses keep working for a few days after the last tablet.", "छोटा कोर्स आख़िरी गोली के बाद भी कुछ दिन असर करता है।"),
    why: [
      t("Antibiotics only work on bacteria. Coughs from viruses, allergy or pollution won't respond to them.", "एंटीबायोटिक सिर्फ़ बैक्टीरिया पर काम करती है। वायरस, एलर्जी या प्रदूषण वाली खाँसी पर नहीं।"),
    ],
    care: [t("Ask your doctor if it can be taken after food to ease the stomach.", "डॉक्टर से पूछें कि क्या इसे खाने के बाद ले सकते हैं।")],
  },
  {
    keys: ["amoxicillin", "amoxycillin", "augmentin", "amoxiclav", "clavulanic", "mox", "moxikind"],
    cls: t("antibiotic (penicillin family)", "एंटीबायोटिक (पेनिसिलिन)"),
    common: ["loose", "nausea", "acidity"],
    uncommon: ["rash", "headache"],
    serious: ["swelling", "breathing"],
    onsetDays: 3,
    onsetNote: t("Most people feel better within 48 to 72 hours.", "ज़्यादातर लोग 48 से 72 घंटे में बेहतर महसूस करते हैं।"),
    why: [
      t("Many sore throats and colds are viral, and antibiotics don't work on viruses.", "कई गले के दर्द वायरल होते हैं, जिन पर एंटीबायोटिक काम नहीं करती।"),
    ],
    care: [
      t("Don't stop an antibiotic halfway on your own. Call your doctor instead.", "एंटीबायोटिक बीच में ख़ुद से बंद न करें। डॉक्टर से बात करें।"),
      t("Curd or buttermilk may help mild loose motions. Ask your doctor if it continues.", "हल्के दस्त में दही या छाछ मदद कर सकती है। जारी रहे तो डॉक्टर से पूछें।"),
    ],
  },
  {
    keys: ["levocetirizine", "cetirizine", "levocet", "fexofenadine", "allegra"],
    cls: t("anti-allergy (antihistamine)", "एलर्जी की दवा"),
    common: ["drowsy", "dry-mouth", "headache"],
    uncommon: ["dizzy"],
    onsetDays: 1,
    onsetNote: t("Usually works within a day for sneezing and itching.", "छींक और खुजली में आमतौर पर एक दिन में असर।"),
    why: [t("It calms allergy symptoms. It won't clear an infection.", "यह एलर्जी के लक्षण कम करती है, इन्फ़ेक्शन नहीं।")],
    care: [t("If it makes you sleepy, ask your doctor about taking it at bedtime.", "नींद आए तो डॉक्टर से रात को लेने के बारे में पूछें।")],
  },
  {
    keys: ["montelukast", "montair"],
    cls: t("airway anti-inflammatory", "साँस की सूजन की दवा"),
    common: ["headache", "nausea"],
    uncommon: ["mood", "drowsy"],
    onsetDays: 7,
    onsetNote: t("Can take a few days to a week to settle airway swelling.", "साँस की नली की सूजन कम होने में कुछ दिन से एक हफ़्ता लग सकता है।"),
    why: [t("It prevents and settles allergic swelling. It isn't a quick reliever.", "यह धीरे काम करती है, तुरंत राहत वाली दवा नहीं।")],
    care: [t("Unusual mood changes, bad dreams or poor sleep are worth telling your doctor about.", "मूड में बदलाव या बुरे सपने आएँ तो डॉक्टर को बताएँ।")],
  },
  {
    keys: ["pantoprazole", "pan 40", "pan d", "rabeprazole", "omeprazole", "esomeprazole"],
    cls: t("acid reducer", "एसिडिटी की दवा"),
    common: ["headache", "loose", "nausea"],
    uncommon: ["dizzy", "constipation"],
    onsetDays: 3,
    onsetNote: t("Works best taken 30 to 60 minutes before breakfast.", "नाश्ते से 30 से 60 मिनट पहले लेने पर सबसे अच्छा काम करती है।"),
    why: [t("If taken after food, it works much less well.", "खाने के बाद लेने पर असर कम होता है।")],
    care: [],
  },
  {
    keys: ["paracetamol", "dolo", "crocin", "calpol"],
    cls: t("fever and pain reliever", "बुखार और दर्द की दवा"),
    common: [],
    uncommon: ["nausea", "rash"],
    serious: ["swelling", "breathing"],
    onsetDays: 0,
    onsetNote: t("Lowers fever for 4 to 6 hours. It doesn't treat the cause.", "4 से 6 घंटे बुखार कम करती है, कारण का इलाज नहीं।"),
    why: [t("A fever that keeps coming back is the illness, not the medicine failing.", "बुखार बार-बार आना बीमारी का हिस्सा है, दवा की नाकामी नहीं।")],
    care: [t("Check other medicines for paracetamol too, so you don't double up.", "दूसरी दवाओं में भी पैरासिटामोल तो नहीं, यह जाँच लें।")],
  },
  {
    keys: ["aceclofenac", "diclofenac", "ibuprofen", "ketorolac", "zerodol", "ketorol", "naproxen", "nimesulide"],
    cls: t("painkiller (NSAID)", "दर्द निवारक (NSAID)"),
    common: ["acidity", "nausea"],
    uncommon: ["dizzy", "headache"],
    serious: ["swelling", "breathing", "rash"],
    onsetDays: 1,
    onsetNote: t("Pain relief usually starts within an hour or two.", "दर्द में राहत आमतौर पर एक-दो घंटे में।"),
    why: [t("Joint or nerve pain may need other treatment like physiotherapy.", "जोड़ों या नस के दर्द में फ़िज़ियो जैसी दूसरी मदद चाहिए हो सकती है।")],
    care: [t("Ask your doctor whether a stomach-protecting medicine should go with it.", "डॉक्टर से पूछें कि क्या साथ में पेट की दवा लेनी चाहिए।")],
  },
  {
    keys: ["doxycycline", "doxt"],
    cls: t("antibiotic (tetracycline)", "एंटीबायोटिक"),
    common: ["acidity", "nausea", "burning"],
    uncommon: ["headache", "rash"],
    onsetDays: 42,
    onsetNote: t("For acne it usually takes 6 to 8 weeks to show results.", "मुँहासों पर असर दिखने में 6 से 8 हफ़्ते लगते हैं।"),
    why: [t("Acne treatment is slow. Early weeks often look the same.", "मुँहासों का इलाज धीमा होता है, शुरू में फ़र्क नहीं दिखता।")],
    care: [t("Take it with a full glass of water and stay upright for 30 minutes, as your prescription says.", "पूरा गिलास पानी के साथ लें और 30 मिनट तक लेटें नहीं।")],
  },
  {
    keys: ["fluconazole", "forcan"],
    cls: t("antifungal", "फंगल की दवा"),
    common: ["headache", "nausea"],
    uncommon: ["dizzy", "rash"],
    onsetDays: 14,
    onsetNote: t("Fungal rashes clear slowly, often over 2 to 4 weeks.", "फंगल धीरे ठीक होता है, 2 से 4 हफ़्ते में।"),
    why: [t("Sweat and damp clothes can keep a fungal rash going.", "पसीना और गीले कपड़े फंगल को बढ़ाते रहते हैं।")],
    care: [],
  },
  {
    keys: ["luliconazole", "lulifin", "clotrimazole", "terbinafine"],
    cls: t("antifungal cream", "फंगल क्रीम"),
    common: ["burning"],
    uncommon: ["rash"],
    onsetDays: 14,
    onsetNote: t("Keep using it for the full course, even after the rash fades.", "दाने हटने के बाद भी पूरा कोर्स करें।"),
    why: [t("Stopping early often brings the rash back.", "जल्दी बंद करने से दाने लौट आते हैं।")],
    care: [],
  },
  {
    keys: ["olopatadine", "olopat"],
    cls: t("anti-allergy eye drop", "एलर्जी की आई ड्रॉप"),
    common: ["burning", "headache"],
    onsetDays: 1,
    onsetNote: t("Itch usually eases within a day.", "खुजली आमतौर पर एक दिन में कम।"),
    why: [t("If the eyes are infected rather than allergic, it won't help much.", "अगर इन्फ़ेक्शन है, एलर्जी नहीं, तो इससे ज़्यादा फ़ायदा नहीं होगा।")],
    care: [],
  },
  {
    keys: ["moxifloxacin", "moxicip", "vigamox"],
    cls: t("antibiotic eye drop", "एंटीबायोटिक आई ड्रॉप"),
    common: ["burning"],
    uncommon: ["headache"],
    onsetDays: 2,
    onsetNote: t("Bacterial eye infections usually improve in 2 to 3 days.", "बैक्टीरियल इन्फ़ेक्शन 2 से 3 दिन में सुधरता है।"),
    why: [t("Allergic red eyes don't respond to antibiotic drops.", "एलर्जी वाली लाल आँखों पर एंटीबायोटिक ड्रॉप असर नहीं करती।")],
    care: [],
  },
  {
    keys: ["adapalene", "adaferin", "tretinoin"],
    cls: t("retinoid gel", "रेटिनॉइड जेल"),
    common: ["burning", "rash"],
    onsetDays: 56,
    onsetNote: t("Acne can look worse in the first 2 to 4 weeks before it improves.", "पहले 2 से 4 हफ़्ते मुँहासे बढ़े दिख सकते हैं, फिर सुधार।"),
    why: [t("Results usually take 8 to 12 weeks.", "नतीजे 8 से 12 हफ़्ते में दिखते हैं।")],
    care: [],
  },
  {
    keys: ["levothyroxine", "thyronorm", "thyroxine", "eltroxin"],
    cls: t("thyroid hormone", "थायरॉइड हार्मोन"),
    common: [],
    uncommon: ["palpitations", "headache"],
    onsetDays: 42,
    onsetNote: t("Levels take about 6 weeks to settle after a dose change.", "डोज़ बदलने के बाद लगभग 6 हफ़्ते लगते हैं।"),
    why: [
      t("It must be taken on an empty stomach, 30 to 60 minutes before food.", "खाली पेट, खाने से 30 से 60 मिनट पहले लेनी होती है।"),
      t("Calcium, iron or antacids taken close to it can block it.", "कैल्शियम, आयरन या एंटासिड पास में लेने से असर कम होता है।"),
    ],
    care: [],
  },
  {
    keys: ["telmisartan", "telma", "amlodipine", "losartan"],
    cls: t("blood pressure medicine", "बीपी की दवा"),
    common: ["dizzy"],
    uncommon: ["headache", "swelling"],
    onsetDays: 14,
    onsetNote: t("Full effect on BP takes about 2 to 4 weeks.", "पूरा असर 2 से 4 हफ़्ते में।"),
    why: [t("Salt, stress and missed doses all push BP up.", "नमक, तनाव और छूटी डोज़ से बीपी बढ़ता है।")],
    care: [],
  },
  {
    keys: ["atorvastatin", "atorva", "rosuvastatin"],
    cls: t("cholesterol medicine", "कोलेस्ट्रॉल की दवा"),
    common: ["muscle", "nausea"],
    uncommon: ["headache"],
    onsetDays: 42,
    onsetNote: t("Cholesterol is usually rechecked after 6 to 12 weeks.", "6 से 12 हफ़्ते बाद जाँच होती है।"),
    why: [],
    care: [],
  },
  {
    keys: ["calcium", "shelcal"],
    cls: t("calcium and vitamin D", "कैल्शियम और विटामिन D"),
    common: ["constipation", "acidity"],
    onsetDays: 60,
    onsetNote: t("Bone benefits build slowly over months.", "हड्डियों पर असर महीनों में।"),
    why: [],
    care: [t("Keep it a few hours apart from thyroid medicine.", "थायरॉइड की दवा से कुछ घंटे दूर रखें।")],
  },
  {
    keys: ["budesonide", "budecort", "fluticasone"],
    cls: t("steroid inhaler", "स्टेरॉइड इनहेलर"),
    common: ["burning", "headache"],
    onsetDays: 7,
    onsetNote: t("Takes several days of regular use to calm the airways.", "नियमित इस्तेमाल के कुछ दिन बाद असर।"),
    why: [t("Inhaler technique matters a lot. Ask to be shown again.", "इनहेलर का सही तरीका ज़रूरी है, दोबारा दिखाने को कहें।")],
    care: [t("Rinse your mouth after each use, as advised.", "हर बार के बाद कुल्ला करें।")],
  },
  {
    keys: ["ascoril", "levosalbutamol", "salbutamol"],
    cls: t("cough syrup with a bronchodilator", "खाँसी का सिरप"),
    common: ["palpitations", "nausea"],
    uncommon: ["headache", "dizzy"],
    onsetDays: 2,
    onsetNote: t("Loosens cough over 2 to 3 days.", "2 से 3 दिन में बलगम ढीला।"),
    why: [],
    care: [],
  },
];

/** Finds library entries for a medicine. Combination medicines merge their parts. */
export function findEntry(m: Pick<Medicine, "name" | "generic">): Entry | undefined {
  const hay = `${m.name} ${m.generic ?? ""}`.toLowerCase();
  const word = (k: string) => new RegExp(`(^|[^a-z])${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^a-z])`);
  const hits = KB.filter((e) => e.keys.some((k) => word(k).test(hay)));
  if (hits.length <= 1) return hits[0];
  const u = <X,>(xs: (X[] | undefined)[]) => Array.from(new Set(xs.flatMap((x) => x ?? [])));
  return {
    keys: u(hits.map((h) => h.keys)),
    cls: { en: hits.map((h) => h.cls.en).join(" + "), hi: hits.map((h) => h.cls.hi).join(" + ") },
    common: u(hits.map((h) => h.common)),
    uncommon: u(hits.map((h) => h.uncommon)),
    serious: u(hits.map((h) => h.serious)),
    onsetDays: Math.max(...hits.map((h) => h.onsetDays)),
    onsetNote: hits[hits.length - 1].onsetNote,
    why: hits.flatMap((h) => h.why),
    care: hits.flatMap((h) => h.care),
  };
}

export function medClass(m: Pick<Medicine, "name" | "generic">, lang: Lang) {
  return findEntry(m)?.cls[lang];
}

const L = (x: T, lang: Lang) => x[lang];

/** Instant, offline analysis from Rxwind's medicine library. */
export function analyzeLocal(
  med: Medicine,
  report: MedReport,
  ctx: { dayIndex: number; others: Medicine[]; diagnosis?: string },
  lang: Lang,
): MedAnalysis {
  const hi = lang === "hi";
  const e = findEntry(med);
  const findings: MedFinding[] = [];
  const selfCare: string[] = [];
  const askDoctor: string[] = [];
  const redFlags: string[] = [];
  const name = med.name;
  const urgent = report.symptoms.some((s) => URGENT.includes(s)) || report.severity === "severe";

  if (report.kind === "side-effect") {
    for (const s of report.symptoms) {
      const label = symptomLabel[lang][s];
      if (URGENT.includes(s)) {
        findings.push({
          label,
          match: "serious",
          detail: hi ? "यह गंभीर एलर्जी का संकेत हो सकता है। तुरंत डॉक्टरी मदद लें।" : "This can be a sign of a serious allergic reaction. Get medical help now.",
        });
        continue;
      }
      if (e?.common.includes(s)) {
        findings.push({ label, match: "common", detail: hi ? `${name} का यह आम साइड इफ़ेक्ट है।` : `A common, well-known side effect of ${name}.` });
      } else if (e?.uncommon?.includes(s)) {
        findings.push({ label, match: "uncommon", detail: hi ? `${name} से यह कभी-कभी होता है।` : `Can happen with ${name}, but less often.` });
      } else if (e?.serious?.includes(s)) {
        findings.push({ label, match: "serious", detail: hi ? `${name} से यह कम होता है पर ज़रूरी है। आज ही डॉक्टर को बताएँ।` : `Rare with ${name} but important. Tell your doctor today.` });
      } else {
        const other = ctx.others.find((o) => {
          const oe = findEntry(o);
          return oe && (oe.common.includes(s) || oe.uncommon?.includes(s));
        });
        findings.push({
          label,
          match: "not-typical",
          detail: other
            ? hi
              ? `${name} से यह आमतौर पर नहीं होता। आपकी दूसरी दवा ${other.name} इसकी वजह हो सकती है।`
              : `Not typical for ${name}. Your other medicine, ${other.name}, is a more likely cause.`
            : hi
              ? `${name} से यह आमतौर पर नहीं होता। यह बीमारी की वजह से भी हो सकता है।`
              : `Not typical for ${name}. It may be part of the illness itself.`,
        });
      }
    }
    e?.care.forEach((c) => selfCare.push(L(c, lang)));
    if (!selfCare.length) selfCare.push(hi ? "दवा ख़ुद से बंद या कम न करें। पहले डॉक्टर से पूछें।" : "Don't stop or change the dose on your own. Check with your doctor first.");
    askDoctor.push(hi ? `क्या ${name} की जगह कोई और विकल्प है?` : `Is there an alternative to ${name} that suits me better?`);
    askDoctor.push(hi ? "क्या समय या खाने के साथ लेने से फ़र्क पड़ेगा?" : "Would changing the timing or taking it with food help?");
  } else {
    const onset = e?.onsetDays ?? 3;
    const tooEarly = ctx.dayIndex <= onset;
    const isAbx = /antibiotic/i.test(e?.cls.en ?? "") || /cillin|mycin|floxacin|cycline/i.test(`${med.generic ?? ""}`);
    const span = onset >= 14 ? (hi ? `${Math.round(onset / 7)} हफ़्ते` : `${Math.round(onset / 7)} weeks`) : hi ? `${Math.max(1, onset)} दिन` : `${Math.max(1, onset)} day${onset > 1 ? "s" : ""}`;
    if (tooEarly) {
      findings.push({
        label: hi ? "अभी जल्दी है" : "It's probably too early",
        match: "likely",
        detail: hi
          ? `आप दिन ${ctx.dayIndex} पर हैं। ${name} को असर दिखाने में आमतौर पर ${span} लगते हैं।`
          : `You're on day ${ctx.dayIndex}. ${name} usually needs about ${span} to show a difference.`,
      });
    }
    if (report.missed === "few" || report.missed === "many") {
      findings.push({
        label: hi ? "छूटी हुई डोज़" : "Missed doses",
        match: report.missed === "many" ? "likely" : "possible",
        detail: hi ? "डोज़ छूटने से शरीर में दवा का स्तर गिरता है और असर कम होता है। कैलेंडर रिमाइंडर मदद कर सकते हैं।" : "Skipped doses lower the level of medicine in your body. Calendar reminders can help.",
      });
    }
    if (report.asInstructed && report.asInstructed !== "yes" && med.food !== "any") {
      findings.push({
        label: hi ? "लेने का तरीका" : "How it's taken",
        match: report.asInstructed === "no" ? "likely" : "possible",
        detail: hi ? `इसे ${med.food === "before" ? "खाने से पहले" : med.food === "after" ? "खाने के बाद" : med.food === "empty" ? "खाली पेट" : "खाने के साथ"} लेना है। गलत समय पर लेने से असर कम हो सकता है।` : `It's meant to be taken ${med.food === "before" ? "before food" : med.food === "after" ? "after food" : med.food === "empty" ? "on an empty stomach" : "with food"}. The wrong timing can weaken it.`,
      });
    }
    e?.why.forEach((w) => findings.push({ label: hi ? "जानने लायक" : "Worth knowing", match: "possible", detail: L(w, lang) }));
    if (!tooEarly) {
      findings.push({
        label: hi ? "दवा को पूरा समय मिल चुका" : "It's had time to work",
        match: report.missed === "none" || !report.missed ? "likely" : "possible",
        detail: hi
          ? `दिन ${ctx.dayIndex} हो गया है और आमतौर पर ${span} में फ़र्क दिखता है। यह डॉक्टर को बताने लायक है।`
          : `It's day ${ctx.dayIndex}, and it usually helps within ${span}. That's worth telling your doctor.`,
      });
    }
    // most likely reason first
    const rank = { likely: 0, possible: 1, unlikely: 2 } as Record<string, number>;
    findings.sort((x, y) => (rank[x.match] ?? 3) - (rank[y.match] ?? 3));
    if (report.trend === "worse" || report.trend === "new") {
      redFlags.push(hi ? "लक्षण बढ़ रहे हैं या नए आ रहे हैं, तो जल्द डॉक्टर से मिलें।" : "Symptoms getting worse or new ones appearing: see your doctor soon.");
    }
    if (e) selfCare.push(hi ? `सुझाव: ${L(e.onsetNote, lang)}` : `Tip: ${L(e.onsetNote, lang)}`);
    selfCare.push(
      isAbx
        ? hi ? "एंटीबायोटिक बीच में ख़ुद से बंद न करें। पहले डॉक्टर से बात करें।" : "Don't stop an antibiotic halfway on your own. Talk to your doctor first."
        : hi ? "डॉक्टर से बात होने तक दवा वैसे ही लेते रहें जैसे लिखी है।" : "Keep taking it as prescribed until you've spoken to your doctor.",
    );
    askDoctor.push(hi ? `${name} से कितने दिन में फ़र्क दिखना चाहिए?` : `How many days should ${name} take to work for me?`);
    askDoctor.push(
      tooEarly
        ? hi ? "अगर कुछ दिन और फ़र्क न दिखे तो क्या करूँ?" : "What should I do if there's still no change in a few days?"
        : hi ? "क्या दवा बदलनी चाहिए या पहले कोई जाँच करानी चाहिए?" : "Should we switch, or test what's causing this first?",
    );
  }

  redFlags.push(
    hi
      ? "चेहरे या होंठ पर सूजन, साँस में दिक्कत, या पूरे शरीर पर दाने: तुरंत 112 पर कॉल करें या अस्पताल जाएँ।"
      : "Swelling of face or lips, trouble breathing, or a spreading rash: call 112 or go to a hospital now.",
  );

  const top = findings[0];
  const summary =
    report.kind === "side-effect"
      ? urgent
        ? hi ? "यह गंभीर हो सकता है। तुरंत डॉक्टरी मदद लें।" : "This could be serious. Get medical help now."
        : top?.match === "common"
          ? hi ? `${top.label}, ${name} का जाना-माना साइड इफ़ेक्ट है।` : `${top.label} is a known, common side effect of ${name}.`
          : top?.match === "not-typical"
            ? hi ? `${name} से ${top.label} आमतौर पर नहीं होता।` : `${top.label} isn't typical for ${name}.`
            : hi ? `${name} से ${top?.label ?? "यह"} हो सकता है।` : `${top?.label ?? "This"} can happen with ${name}.`
      : report.trend === "worse" || report.trend === "new"
        ? hi ? "लक्षण बढ़ रहे हैं। जल्द डॉक्टर से मिलें।" : "Things are getting worse. See your doctor soon."
        : report.missed === "many"
          ? hi ? "छूटी डोज़ सबसे संभावित वजह है।" : "Missed doses are the most likely reason."
          : ctx.dayIndex <= (e?.onsetDays ?? 3)
            ? hi ? "शायद अभी जल्दी है। थोड़ा और समय दें।" : "Probably too early to tell. Give it a little longer."
            : report.asInstructed === "no"
              ? hi ? "लेने का तरीका असर कम कर रहा हो सकता है।" : "The way it's being taken may be weakening it."
              : hi ? `${name} को समय मिल चुका है। डॉक्टर को बताएँ।` : `${name} has had time to work. Tell your doctor.`;

  return { summary, findings, selfCare, askDoctor, redFlags, urgent, source: "library", lang };
}
