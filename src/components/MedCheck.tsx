"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle, Check, CircleHelp, Copy, HeartPulse, Phone, Pill, ShieldAlert, Sparkles, Stethoscope, X,
} from "lucide-react";
import { useMemory } from "@/lib/store";
import { SYMPTOMS, URGENT, analyzeLocal, findEntry, medClass, symptomLabel } from "@/lib/medkb";
import { foodLabel, slotLabel } from "@/lib/i18n";
import { todaysMeds } from "@/lib/insights";
import type { Episode, Lang, MedAnalysis, MedReport, Medicine, MemoryState, SymptomKey } from "@/lib/types";
import { SLOTS } from "@/lib/types";
import { cx, daysBetween, todayISO } from "@/lib/util";
import { FormIcon } from "./ui";
import { CalendarButton } from "./CalendarButton";

type Kind = MedReport["kind"];

export interface MedCheckTarget {
  ep: Episode;
  med: Medicine;
}

const MATCH_STYLE: Record<string, { bg: string; fg: string; en: string; hi: string }> = {
  common: { bg: "bg-amber-soft", fg: "text-amber", en: "Common side effect", hi: "आम साइड इफ़ेक्ट" },
  uncommon: { bg: "bg-sky-soft", fg: "text-sky", en: "Less common", hi: "कम आम" },
  serious: { bg: "bg-rose-soft", fg: "text-rose", en: "Needs attention", hi: "ध्यान दें" },
  "not-typical": { bg: "bg-ink/[0.06]", fg: "text-ink-2", en: "Not typical for this medicine", hi: "इस दवा से आम नहीं" },
  likely: { bg: "bg-coral-soft", fg: "text-leaf-deep", en: "Likely", hi: "संभावित" },
  possible: { bg: "bg-sky-soft", fg: "text-sky", en: "Possible", hi: "हो सकता है" },
  unlikely: { bg: "bg-ink/[0.06]", fg: "text-ink-3", en: "Less likely", hi: "कम संभावित" },
};

/** Context used by the offline analysis: day of course, other medicines, diagnosis. */
export function checkContext(state: MemoryState, ep: Episode, med: Medicine, at = todayISO()) {
  const rx = ep.prescriptions.find((p) => p.medicines.some((m) => m.id === med.id));
  const dayIndex = rx ? Math.max(1, daysBetween(rx.date, at) + 1) : 1;
  const others =
    ep.status === "resolved"
      ? ep.prescriptions.flatMap((p) => p.medicines).filter((m) => m.id !== med.id)
      : todaysMeds(state, ep.memberId).map((i) => i.med).filter((m) => m.id !== med.id);
  return { rx, dayIndex, others, diagnosis: rx?.diagnosis };
}

/** Library analyses are re-run in the current language; AI ones are shown as saved. */
export function localizedAnalysis(state: MemoryState, ep: Episode | undefined, med: Medicine, lang: Lang) {
  const r = med.report;
  const a = r?.analysis;
  if (!r || !a || a.lang === lang || a.source !== "library" || !ep) return a;
  return analyzeLocal(med, r, checkContext(state, ep, med, r.date), lang);
}

function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}

/** Bottom sheet (phone) / dialog (desktop) for "is this medicine working / causing this?" */
export function MedCheckSheet({
  open,
  onClose,
  targets,
  initialKind = "side-effect",
  presetSymptoms = [],
  showSaved,
}: {
  open: boolean;
  onClose: () => void;
  targets: MedCheckTarget[];
  initialKind?: Kind;
  presetSymptoms?: SymptomKey[];
  showSaved?: MedCheckTarget;
}) {
  const mounted = useMounted();
  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="medcheck"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/35 backdrop-blur-sm sm:items-center sm:p-4"
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 60, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 50, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="relative flex max-h-[92dvh] w-full max-w-[520px] flex-col overflow-hidden rounded-t-[30px] bg-paper shadow-[var(--shadow-lift)] sm:rounded-[30px]"
          >
            <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-ink/15 sm:hidden" />
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-10 grid size-9 place-items-center rounded-full bg-ink/[0.05] hover:bg-ink/10"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
            <Flow targets={targets} initialKind={initialKind} presetSymptoms={presetSymptoms} showSaved={showSaved} onClose={onClose} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function Flow({
  targets,
  initialKind,
  presetSymptoms,
  showSaved,
  onClose,
}: {
  targets: MedCheckTarget[];
  initialKind: Kind;
  presetSymptoms: SymptomKey[];
  showSaved?: MedCheckTarget;
  onClose: () => void;
}) {
  const { lang, state, saveReport } = useMemory();
  const hi = lang === "hi";
  const [target, setTarget] = useState<MedCheckTarget | null>(showSaved ?? (targets.length === 1 ? targets[0] : null));
  const [phase, setPhase] = useState<"pick" | "form" | "loading" | "result">(
    showSaved?.med.report?.analysis ? "result" : targets.length === 1 || showSaved ? "form" : "pick",
  );
  const [kind, setKind] = useState<Kind>(showSaved?.med.report?.kind ?? initialKind);
  const [symptoms, setSymptoms] = useState<SymptomKey[]>(showSaved?.med.report?.symptoms ?? presetSymptoms);
  const [other, setOther] = useState(showSaved?.med.report?.other ?? "");
  const [severity, setSeverity] = useState<MedReport["severity"]>(showSaved?.med.report?.severity ?? "mild");
  const [onset, setOnset] = useState<MedReport["onset"]>(showSaved?.med.report?.onset ?? "few-days");
  const [missed, setMissed] = useState<MedReport["missed"]>(showSaved?.med.report?.missed ?? "none");
  const [asInstructed, setAsInstructed] = useState<MedReport["asInstructed"]>(showSaved?.med.report?.asInstructed ?? "yes");
  const [trend, setTrend] = useState<MedReport["trend"]>(showSaved?.med.report?.trend ?? "same");
  const [analysis, setAnalysis] = useState<MedAnalysis | null>((showSaved && localizedAnalysis(state, showSaved.ep, showSaved.med, lang)) ?? null);

  const member = target ? state.members.find((m) => m.id === target.ep.memberId) : undefined;
  const ctx = useMemo(
    () => (target ? checkContext(state, target.ep, target.med, target.ep.status === "resolved" ? (target.ep.endDate ?? todayISO()) : todayISO()) : null),
    [state, target],
  );
  const rx = ctx?.rx;
  const dayIndex = ctx?.dayIndex ?? 1;
  const others = useMemo(() => ctx?.others ?? [], [ctx]);
  const ranked = useMemo(() => {
    const score = (m: Medicine) => {
      const e = findEntry(m);
      if (!e) return 0;
      return presetSymptoms.reduce(
        (n, k) => n + (e.common.includes(k) ? 3 : e.serious?.includes(k) ? 2 : e.uncommon?.includes(k) ? 1 : 0),
        0,
      );
    };
    return targets.map((tg) => ({ tg, score: score(tg.med) })).sort((a, b) => b.score - a.score);
  }, [targets, presetSymptoms]);
  const urgentPicked = symptoms.some((s) => URGENT.includes(s)) || (kind === "side-effect" && severity === "severe");
  const canSubmit = kind === "not-working" || symptoms.length > 0 || other.trim().length > 1;

  const submit = async () => {
    if (!target) return;
    const report: MedReport = {
      kind,
      date: todayISO(),
      symptoms: kind === "side-effect" ? symptoms : [],
      other: other.trim() || undefined,
      severity: kind === "side-effect" ? severity : undefined,
      onset: kind === "side-effect" ? onset : undefined,
      missed: kind === "not-working" ? missed : undefined,
      asInstructed: kind === "not-working" ? asInstructed : undefined,
      trend: kind === "not-working" ? trend : undefined,
    };
    setPhase("loading");
    const local = analyzeLocal(target.med, report, { dayIndex, others, diagnosis: rx?.diagnosis }, lang);
    const minWait = new Promise((r) => setTimeout(r, 1700));
    let result: MedAnalysis = local;
    try {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 15000);
      const r = await fetch("/api/medcheck", {
        method: "POST",
        signal: ctrl.signal,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          lang,
          medicine: {
            name: target.med.name,
            generic: target.med.generic,
            strength: target.med.strength,
            dose: target.med.dose,
            frequency: target.med.frequencyCode,
            food: target.med.food,
            courseDays: target.med.durationDays,
            purpose: target.med.purpose.en,
          },
          dayOfCourse: dayIndex,
          diagnosis: rx?.diagnosis,
          prescribedBy: rx?.specialty,
          patient: { age: member?.age, allergies: member?.allergies, conditions: member?.conditions },
          otherCurrentMedicines: others.map((o) => `${o.name}${o.generic ? ` (${o.generic})` : ""}`),
          report: { ...report, symptoms: report.symptoms.map((s) => symptomLabel.en[s]) },
        }),
      });
      clearTimeout(to);
      if (r.ok) {
        const j = await r.json();
        if (j?.summary && Array.isArray(j.findings) && j.findings.length) {
          result = { ...j, urgent: j.urgent || local.urgent, redFlags: j.redFlags?.length ? j.redFlags : local.redFlags, source: "ai", lang };
        }
      }
    } catch {}
    await minWait;
    setAnalysis(result);
    saveReport(target.ep.id, target.med.id, { ...report, analysis: result });
    setPhase("result");
  };

  return (
    <div className="no-scrollbar overflow-y-auto px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-5 sm:px-7 sm:pt-7">
      <AnimatePresence mode="wait">
        {phase === "pick" && (
          <motion.div key="pick" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h3 className="font-display pr-10 text-2xl font-semibold">
              {presetSymptoms.length ? (hi ? "किस दवा से हो सकता है?" : "Which one could cause this?") : hi ? "कौन सी दवा?" : "Which medicine?"}
            </h3>
            <p className="mt-1 text-sm text-ink-2">
              {presetSymptoms.length
                ? hi
                  ? `${presetSymptoms.map((k) => symptomLabel.hi[k]).join(", ")} के लिए आपकी दवाएँ, सबसे संभावित पहले।`
                  : `Your medicines, most likely first for ${presetSymptoms.map((k) => symptomLabel.en[k].toLowerCase()).join(", ")}.`
                : hi
                  ? "जिस दवा के बारे में बताना है, उसे चुनें।"
                  : "Pick the one you want to tell us about."}
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {ranked.map(({ tg, score }, i) => {
                const badge = !presetSymptoms.length
                  ? null
                  : score >= 3
                    ? { cls: "bg-rose-soft text-rose", t: hi ? "अक्सर होता है" : "Known to cause this" }
                    : score >= 1
                      ? { cls: "bg-amber-soft text-amber", t: hi ? "कभी कभी" : "Sometimes" }
                      : { cls: "bg-ink/[0.05] text-ink-3", t: hi ? "आम नहीं" : "Not typical" };
                return (
                  <motion.button
                    key={tg.med.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.04 * i }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setTarget(tg);
                      setPhase("form");
                    }}
                    className="flex items-center gap-3 rounded-2xl border border-ink/[0.08] bg-white p-3 text-left hover:border-leaf/50"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-canvas text-ink-2">
                      <FormIcon form={tg.med.form} className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{tg.med.name}</span>
                      <span className="block truncate text-xs text-ink-3">{medClass(tg.med, lang) ?? tg.med.purpose[lang]}</span>
                    </span>
                    {badge && <span className={cx("shrink-0 rounded-full px-2 py-0.5 text-[0.68rem] font-bold", badge.cls)}>{badge.t}</span>}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {phase === "form" && target && (
          <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <MedHeader med={target.med} dayIndex={dayIndex} />
            <div className="relative mt-5 grid grid-cols-2 rounded-2xl bg-ink/[0.05] p-1">
              {(["side-effect", "not-working"] as Kind[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setKind(k)}
                  className={cx("relative z-10 rounded-xl py-2.5 text-sm font-semibold transition-colors", kind === k ? "text-ink" : "text-ink-3")}
                >
                  {kind === k && (
                    <motion.span layoutId="medcheck-kind" className="absolute inset-0 -z-10 rounded-xl bg-white shadow-sm" transition={{ type: "spring", stiffness: 500, damping: 38 }} />
                  )}
                  {k === "side-effect" ? (hi ? "साइड इफ़ेक्ट" : "Side effect") : hi ? "काम नहीं कर रही" : "Not working"}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait" initial={false}>
              {kind === "side-effect" ? (
                <motion.div key="se" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                  <Q>{hi ? "आपको क्या महसूस हो रहा है?" : "What are you feeling?"}</Q>
                  <div className="flex flex-wrap gap-1.5">
                    {SYMPTOMS.map((s) => {
                      const on = symptoms.includes(s);
                      const urgent = URGENT.includes(s);
                      return (
                        <motion.button
                          key={s}
                          whileTap={{ scale: 0.94 }}
                          onClick={() => setSymptoms((x) => (on ? x.filter((y) => y !== s) : [...x, s]))}
                          className={cx(
                            "rounded-full border px-3 py-1.5 text-[0.8rem] font-semibold transition-colors",
                            on
                              ? urgent
                                ? "border-rose bg-rose text-white"
                                : "border-ink bg-ink text-white"
                              : urgent
                                ? "border-rose/30 bg-rose-soft/50 text-rose"
                                : "border-ink/10 bg-white text-ink-2 hover:border-ink/25",
                          )}
                        >
                          {symptomLabel[lang][s]}
                        </motion.button>
                      );
                    })}
                  </div>
                  <input
                    value={other}
                    onChange={(e) => setOther(e.target.value)}
                    placeholder={hi ? "कुछ और? यहाँ लिखें" : "Something else? Type it here"}
                    className="mt-2.5 w-full rounded-xl border border-ink/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-leaf"
                  />
                  <UrgentBanner show={urgentPicked} />
                  <Q>{hi ? "कब शुरू हुआ?" : "When did it start?"}</Q>
                  <Seg
                    value={onset}
                    onChange={setOnset}
                    opts={[
                      ["first-dose", hi ? "पहली डोज़ के बाद" : "After the first dose"],
                      ["few-days", hi ? "कुछ दिन बाद" : "After a few days"],
                      ["later", hi ? "बाद में" : "Later on"],
                    ]}
                  />
                  <Q>{hi ? "कितना परेशान कर रहा है?" : "How bad is it?"}</Q>
                  <Seg
                    value={severity}
                    onChange={setSeverity}
                    opts={[
                      ["mild", hi ? "हल्का" : "Mild"],
                      ["moderate", hi ? "परेशान कर रहा" : "Bothering me"],
                      ["severe", hi ? "बहुत ज़्यादा" : "Severe"],
                    ]}
                  />
                </motion.div>
              ) : (
                <motion.div key="nw" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                  <div className="mt-5 rounded-2xl bg-canvas p-3 text-sm text-ink-2">
                    <span className="font-semibold text-ink">{hi ? "पर्ची के हिसाब से: " : "As prescribed: "}</span>
                    {target.med.dose},{" "}
                    {target.med.sos ? (hi ? "ज़रूरत पर" : "only when needed") : SLOTS.filter((s) => target.med.slots[s]).map((s) => slotLabel[lang][s].name).join(" + ")},{" "}
                    {foodLabel[lang][target.med.food]}
                    {target.med.durationDays ? (hi ? `, ${target.med.durationDays} दिन` : `, for ${target.med.durationDays} days`) : ""}
                  </div>
                  <Q>{hi ? "कोई डोज़ छूटी?" : "Missed any doses?"}</Q>
                  <Seg
                    value={missed}
                    onChange={setMissed}
                    opts={[
                      ["none", hi ? "नहीं" : "None"],
                      ["few", hi ? "एक-दो" : "One or two"],
                      ["many", hi ? "कई" : "Quite a few"],
                    ]}
                  />
                  <Q>{hi ? "क्या ऊपर बताए तरीके से ले रहे हैं?" : "Taking it exactly as above?"}</Q>
                  <Seg
                    value={asInstructed}
                    onChange={setAsInstructed}
                    opts={[
                      ["yes", hi ? "हाँ" : "Yes"],
                      ["unsure", hi ? "पक्का नहीं" : "Not sure"],
                      ["no", hi ? "नहीं" : "No"],
                    ]}
                  />
                  <Q>{hi ? "लक्षण कैसे हैं?" : "How are the symptoms?"}</Q>
                  <Seg
                    value={trend}
                    onChange={setTrend}
                    opts={[
                      ["same", hi ? "वैसे ही" : "About the same"],
                      ["worse", hi ? "बढ़ रहे हैं" : "Getting worse"],
                      ["new", hi ? "नए लक्षण" : "New symptoms"],
                    ]}
                  />
                  <input
                    value={other}
                    onChange={(e) => setOther(e.target.value)}
                    placeholder={hi ? "और कुछ बताना है? (वैकल्पिक)" : "Anything else? (optional)"}
                    className="mt-3 w-full rounded-xl border border-ink/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-leaf"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileTap={{ scale: 0.97 }}
              disabled={!canSubmit}
              onClick={submit}
              className="btn-shine relative mt-6 flex h-13 w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-[linear-gradient(135deg,#3dbb55,#1f8a3b)] py-3.5 font-semibold text-white shadow-[var(--shadow-glow)] disabled:opacity-40"
            >
              <Sparkles className="size-4" />
              {hi ? `${target.med.name} की जाँच करें` : `Check ${target.med.name}`}
            </motion.button>
            <p className="mt-3 text-center text-[0.7rem] text-ink-3">
              {hi ? "Rxwind समझाता है, दवा नहीं बदलता। फ़ैसला डॉक्टर का।" : "Rxwind explains. It never changes your medicines. Your doctor decides."}
            </p>
          </motion.div>
        )}

        {phase === "loading" && target && <Loading key="loading" med={target.med} kind={kind} />}

        {phase === "result" && target && analysis && (
          <Result key="result" med={target.med} analysis={analysis} kind={kind} onDone={onClose} onEdit={() => setPhase("form")} reminderFor={kind === "not-working" && missed !== "none" && target.ep.status !== "resolved" ? target.ep.memberId : undefined} />
        )}
      </AnimatePresence>
    </div>
  );
}

function MedHeader({ med, dayIndex }: { med: Medicine; dayIndex: number }) {
  const { lang } = useMemory();
  const cls = medClass(med, lang);
  return (
    <div className="flex items-center gap-3 pr-10">
      <span className="grid size-12 place-items-center rounded-2xl bg-[linear-gradient(135deg,#e3f6e7,#cdeed5)] text-leaf-deep">
        <FormIcon form={med.form} className="size-6" />
      </span>
      <div className="min-w-0">
        <div className="font-display truncate text-xl font-semibold">{med.name}</div>
        <div className="truncate text-xs text-ink-3">
          {[med.generic, cls, dayIndex > 0 && (lang === "hi" ? `दिन ${dayIndex}` : `Day ${dayIndex}`)].filter(Boolean).join(" · ")}
        </div>
      </div>
    </div>
  );
}

function Q({ children }: { children: React.ReactNode }) {
  return <div className="mb-2 mt-5 text-sm font-semibold text-ink">{children}</div>;
}

function Seg<T extends string>({ value, onChange, opts }: { value: T | undefined; onChange: (v: T) => void; opts: [T, string][] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {opts.map(([v, l]) => (
        <motion.button
          key={v}
          whileTap={{ scale: 0.95 }}
          onClick={() => onChange(v)}
          className={cx(
            "rounded-full border px-3.5 py-1.5 text-[0.8rem] font-semibold transition-colors",
            value === v ? "border-leaf bg-coral-soft text-leaf-deep" : "border-ink/10 bg-white text-ink-2 hover:border-ink/25",
          )}
        >
          {l}
        </motion.button>
      ))}
    </div>
  );
}

function UrgentBanner({ show }: { show: boolean }) {
  const { lang } = useMemory();
  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
          <div className="mt-3 flex items-start gap-3 rounded-2xl bg-rose p-3.5 text-white">
            <ShieldAlert className="mt-0.5 size-5 shrink-0" />
            <div className="text-sm">
              <div className="font-semibold">{lang === "hi" ? "यह गंभीर हो सकता है" : "This could be serious"}</div>
              <div className="text-white/90">
                {lang === "hi" ? "सूजन या साँस में दिक्कत हो तो इंतज़ार न करें।" : "With swelling or trouble breathing, don't wait for an app."}
              </div>
              <a href="tel:112" className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-rose">
                <Phone className="size-3.5" /> {lang === "hi" ? "112 पर कॉल करें" : "Call 112"}
              </a>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Loading({ med, kind }: { med: Medicine; kind: Kind }) {
  const { lang } = useMemory();
  const hi = lang === "hi";
  const lines =
    kind === "side-effect"
      ? hi
        ? ["दवा की जानकारी देख रहे हैं", "आपके लक्षण मिला रहे हैं", "दूसरी दवाओं से तुलना"]
        : ["Looking up how this medicine works", "Matching it with what you feel", "Checking your other medicines"]
      : hi
        ? ["असर आने का समय देख रहे हैं", "डोज़ और समय जाँच रहे हैं", "दूसरी वजहें ढूँढ रहे हैं"]
        : ["Checking how long it usually takes", "Looking at doses and timing", "Thinking through other reasons"];
  const [k, setK] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setK((x) => Math.min(x + 1, lines.length - 1)), 600);
    return () => clearInterval(id);
  }, [lines.length]);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-10 text-center">
      <div className="relative grid size-24 place-items-center">
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-dashed border-leaf/40"
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        />
        <motion.span
          className="absolute inset-3 rounded-full bg-[radial-gradient(circle,rgba(55,178,77,.25),transparent_70%)]"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        />
        <span className="grid size-14 place-items-center rounded-2xl bg-[linear-gradient(135deg,#3dbb55,#1f8a3b)] text-white shadow-[var(--shadow-glow)]">
          <Pill className="size-7" />
        </span>
      </div>
      <div className="font-display mt-6 text-xl font-semibold">
        <span className="shimmer-text">{hi ? `${med.name} की जाँच` : `Checking ${med.name}`}</span>
      </div>
      <div className="mt-4 flex flex-col gap-2">
        {lines.map((l, i) => (
          <motion.div key={l} animate={{ opacity: i <= k ? 1 : 0.3 }} className="flex items-center justify-center gap-2 text-sm text-ink-2">
            {i < k ? <Check className="size-4 text-mint" strokeWidth={3} /> : <span className="size-1.5 rounded-full bg-ink/30" />}
            {l}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function Result({ med, analysis, kind, onDone, onEdit, reminderFor }: { med: Medicine; analysis: MedAnalysis; kind: Kind; onDone: () => void; onEdit: () => void; reminderFor?: string }) {
  const { lang } = useMemory();
  const hi = lang === "hi";
  const [copied, setCopied] = useState(false);
  const tone = analysis.urgent
    ? "bg-[linear-gradient(135deg,#d93d4a,#b42d3a)] text-white"
    : kind === "side-effect"
      ? "bg-[linear-gradient(135deg,#fff3dc,#ffe6c2)] text-ink"
      : "bg-[linear-gradient(135deg,#e3f6e7,#cdeed5)] text-ink";
  const Icon = analysis.urgent ? AlertTriangle : kind === "side-effect" ? HeartPulse : CircleHelp;
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <MedHeader med={med} dayIndex={0} />
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.05 }}
        className={cx("mt-5 rounded-3xl p-5", tone)}
      >
        <div className="flex items-start gap-3">
          <Icon className="mt-0.5 size-6 shrink-0" />
          <p className="font-display text-lg font-semibold leading-snug">{analysis.summary}</p>
        </div>
        {analysis.urgent && (
          <a href="tel:112" className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-sm font-bold text-rose">
            <Phone className="size-4" /> {hi ? "112 पर कॉल करें" : "Call 112"}
          </a>
        )}
      </motion.div>

      <div className="mt-4 flex flex-col gap-2.5">
        {analysis.findings.map((f, i) => {
          const st = MATCH_STYLE[f.match] ?? MATCH_STYLE.possible;
          return (
            <motion.div
              key={f.label + i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.08 }}
              className="rounded-2xl border border-ink/[0.07] bg-white p-3.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold">{f.label}</span>
                <span className={cx("rounded-full px-2.5 py-0.5 text-[0.7rem] font-bold", st.bg, st.fg)}>{hi ? st.hi : st.en}</span>
              </div>
              <p className="mt-1 text-sm text-ink-2">{f.detail}</p>
            </motion.div>
          );
        })}
      </div>

      {reminderFor && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4 flex flex-col gap-2 rounded-2xl border border-leaf/25 bg-mint-soft/40 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-sm font-semibold">{hi ? "डोज़ छूटना बंद करें।" : "Stop missing doses."}</p>
          <CalendarButton memberId={reminderFor} />
        </motion.div>
      )}
      {analysis.selfCare.length > 0 && (
        <Block title={hi ? "आप क्या कर सकते हैं" : "What you can do"} icon={<Check className="size-4 text-mint" />} items={analysis.selfCare} delay={0.35} />
      )}
      {analysis.askDoctor.length > 0 && (
        <div className="mt-4 rounded-2xl bg-canvas p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Stethoscope className="size-4 text-leaf-deep" /> {hi ? "डॉक्टर से पूछें" : "Ask your doctor"}
            </div>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(analysis.askDoctor.map((q) => `• ${q}`).join("\n")).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                });
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-ink-3 hover:text-ink"
            >
              {copied ? <Check className="size-3.5 text-mint" /> : <Copy className="size-3.5" />} {copied ? (hi ? "कॉपी हुआ" : "Copied") : hi ? "कॉपी" : "Copy"}
            </button>
          </div>
          <ul className="mt-2 space-y-1.5 text-sm text-ink-2">
            {analysis.askDoctor.map((q) => (
              <li key={q} className="flex gap-2">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-leaf" />
                {q}
              </li>
            ))}
          </ul>
        </div>
      )}
      {analysis.redFlags.length > 0 && (
        <Block title={hi ? "तुरंत मदद कब लें" : "Get help right away if"} icon={<ShieldAlert className="size-4 text-rose" />} items={analysis.redFlags} tone="rose" delay={0.45} />
      )}

      <div className="mt-5 flex items-center justify-between gap-2 text-[0.7rem] text-ink-3">
        <span className="inline-flex items-center gap-1">
          <Sparkles className="size-3" />
          {analysis.source === "ai" ? (hi ? "Gemini से विश्लेषण" : "Analysed by Gemini") : hi ? "Rxwind दवा लाइब्रेरी से" : "From Rxwind's medicine library"}
        </span>
        <span className="inline-flex items-center gap-1 font-semibold text-mint">
          <Check className="size-3" strokeWidth={3} /> {hi ? "मेमोरी और डॉक्टर ब्रीफ़ में सेव" : "Saved to memory and doctor brief"}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button onClick={onEdit} className="rounded-full border border-ink/15 py-3 text-sm font-semibold">
          {hi ? "जवाब बदलें" : "Change answers"}
        </button>
        <button onClick={onDone} className="rounded-full bg-ink py-3 text-sm font-semibold text-white">
          {hi ? "हो गया" : "Done"}
        </button>
      </div>
      <p className="mt-3 text-center text-[0.68rem] text-ink-3">
        {hi ? "यह जानकारी है, इलाज नहीं। दवा बदलने से पहले डॉक्टर से बात करें।" : "This is information, not medical advice. Talk to your doctor before changing anything."}
      </p>
    </motion.div>
  );
}

function Block({ title, icon, items, tone, delay = 0 }: { title: string; icon: React.ReactNode; items: string[]; tone?: "rose"; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={cx("mt-4 rounded-2xl p-4", tone === "rose" ? "bg-rose-soft/60" : "bg-mint-soft/50")}
    >
      <div className="flex items-center gap-2 text-sm font-semibold">
        {icon} {title}
      </div>
      <ul className="mt-2 space-y-1.5 text-sm text-ink-2">
        {items.map((x) => (
          <li key={x} className="flex gap-2">
            <span className={cx("mt-2 size-1.5 shrink-0 rounded-full", tone === "rose" ? "bg-rose" : "bg-mint")} />
            {x}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

/** Small summary chip under a medicine that has a saved check. */
export function ReportChip({ med, ep, onOpen }: { med: Medicine; ep?: Episode; onOpen: () => void }) {
  const { lang, state } = useMemory();
  const a = localizedAnalysis(state, ep, med, lang);
  if (!a) return null;
  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -1 }}
      onClick={onOpen}
      className={cx(
        "mt-2 flex w-full items-start gap-2 rounded-xl border px-3 py-2 text-left text-xs",
        a.urgent ? "border-rose/30 bg-rose-soft text-rose" : "border-ink/[0.07] bg-canvas text-ink-2",
      )}
    >
      <Sparkles className="mt-0.5 size-3.5 shrink-0 text-leaf-deep" />
      <span className="min-w-0 flex-1">
        <span className="font-semibold text-ink">{lang === "hi" ? "जाँच: " : "Checked: "}</span>
        {a.summary}
      </span>
      <span className="shrink-0 font-semibold text-leaf-deep">{lang === "hi" ? "देखें" : "View"}</span>
    </motion.button>
  );
}

/** "Is it working?" quick feedback list for an episode's current medicines. */
export function MedFeedback({ episode }: { episode: Episode }) {
  const { lang, setVerdict } = useMemory();
  const hi = lang === "hi";
  const [check, setCheck] = useState<{ med: Medicine; kind: Kind; saved?: boolean } | null>(null);
  const latest = [...episode.prescriptions].sort((a, b) => a.date.localeCompare(b.date)).at(-1);
  const meds = latest?.medicines ?? [];
  if (!meds.length) return null;
  const opts = [
    { v: "helped" as const, en: "Helping", hi: "असर है", on: "bg-mint text-white", off: "text-mint" },
    { v: "no-change" as const, en: "Not working", hi: "असर नहीं", on: "bg-amber text-white", off: "text-amber" },
    { v: "side-effect" as const, en: "Side effect", hi: "साइड इफ़ेक्ट", on: "bg-rose text-white", off: "text-rose" },
  ];
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="font-display text-lg font-semibold">{hi ? "दवा असर कर रही है?" : "Is it working?"}</div>
          <p className="text-sm text-ink-3">
            {hi ? "बताइए, हम दवा से मिलाकर जाँचेंगे।" : "Tell us. We'll check it against the medicine."}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-coral-soft px-2.5 py-1 text-[0.7rem] font-bold text-leaf-deep">
          <Sparkles className="size-3" /> {hi ? "AI जाँच" : "AI check"}
        </span>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {meds.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
            className="rounded-2xl bg-canvas/70 p-3"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-paper text-ink-2">
                  <FormIcon form={m.form} className="size-4" />
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{m.name}</div>
                  <div className="truncate text-xs text-ink-3">{m.purpose[lang]}</div>
                </div>
              </div>
              <div className="flex gap-1">
                {opts.map((o) => {
                  const on = m.verdict === o.v;
                  return (
                    <motion.button
                      key={o.v}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => {
                        if (o.v === "helped") setVerdict(episode.id, m.id, "helped");
                        else setCheck({ med: m, kind: o.v === "side-effect" ? "side-effect" : "not-working" });
                      }}
                      className={cx(
                        "flex-1 whitespace-nowrap rounded-full px-2.5 py-1.5 text-[0.72rem] font-bold transition-colors sm:flex-none",
                        on ? o.on : cx("bg-paper hover:bg-ink/[0.06]", o.off),
                      )}
                    >
                      {on && o.v === "helped" && <Check className="-mt-0.5 mr-0.5 inline size-3" />}
                      {o[lang]}
                    </motion.button>
                  );
                })}
              </div>
            </div>
            {m.report?.analysis && <ReportChip med={m} ep={episode} onOpen={() => setCheck({ med: m, kind: m.report!.kind, saved: true })} />}
          </motion.div>
        ))}
      </div>
      <MedCheckSheet
        open={!!check}
        onClose={() => setCheck(null)}
        targets={check ? [{ ep: episode, med: check.med }] : []}
        initialKind={check?.kind}
        showSaved={check?.saved ? { ep: episode, med: check.med } : undefined}
      />
    </div>
  );
}
