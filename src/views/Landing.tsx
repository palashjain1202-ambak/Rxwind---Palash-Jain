"use client";

import { AnimatePresence, motion, useScroll, useTransform } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, BellRing, Camera, Check, History, Lock, Moon, Pill, Rewind, ShieldAlert, ShieldCheck, Sparkles, Sunrise, Wind } from "lucide-react";
import { useMemory } from "@/lib/store";
import { buildDemo } from "@/lib/demo";
import { catColor, upcomingRisks } from "@/lib/insights";
import { monthsShort } from "@/lib/i18n";
import { cx, parseISO } from "@/lib/util";
import { Ambient, LangToggle } from "@/components/Shell";
import { SeasonWheel } from "@/components/SeasonWheel";
import { Btn, CountUp, Logo, Reveal, TiltCard } from "@/components/ui";

export default function Landing() {
  const { t, lang, startDemo, startMine, go, state } = useMemory();
  const demo = useMemo(() => buildDemo(), []);
  const riyaEps = demo.episodes.filter((e) => e.memberId === "riya");
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const heroO = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const [wheelSize, setWheelSize] = useState(360);
  useEffect(() => {
    const f = () => setWheelSize(Math.max(260, Math.min(360, window.innerWidth - 64)));
    f();
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);

  return (
    <div className="relative min-h-dvh overflow-x-clip">
      <Ambient />
      <header className="relative z-20 mx-auto flex max-w-[1240px] items-center justify-between px-4 pt-[max(env(safe-area-inset-top),16px)] md:px-8 md:pt-6">
        <Logo />
        <div className="flex items-center gap-2">
          <LangToggle compact />
          <Btn size="sm" variant="ink" className="hidden sm:inline-flex" onClick={() => (state.episodes.length ? go({ name: "home" }) : startDemo())}>
            {lang === "hi" ? "ऐप खोलें" : "Open app"}
          </Btn>
        </div>
      </header>

      {/* HERO */}
      <section ref={heroRef} className="relative z-10 mx-auto grid max-w-[1240px] items-center gap-10 px-4 pb-10 pt-10 md:px-8 md:pt-16 lg:grid-cols-[1.05fr_1fr] lg:gap-6 lg:pb-24 lg:pt-20">
        <motion.div style={{ y: heroY, opacity: heroO }}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-ink/10 bg-paper/70 px-3 py-1.5 text-xs font-semibold text-ink-2 backdrop-blur"
          >
            <span className="relative flex size-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-coral opacity-70" />
              <span className="relative size-2 rounded-full bg-coral" />
            </span>
            {lang === "hi" ? "भारतीय पर्चियों के लिए AI हेल्थ मेमोरी" : "AI health memory for Indian parchis"}
          </motion.div>
          <h1 className="font-display text-[2.7rem] font-semibold leading-[0.98] tracking-tight sm:text-[3.6rem] lg:text-[4.6rem]">
            <motion.span
              className="block"
              initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            >
              {t("heroTitle1")}
            </motion.span>
            <motion.span
              className="mt-1 flex items-center gap-3 text-coral"
              initial={{ opacity: 0, x: 60, filter: "blur(10px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              transition={{ type: "spring", stiffness: 90, damping: 16, delay: 0.25 }}
            >
              <motion.span
                animate={{ x: [0, -10, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.2 }}
                className="inline-grid"
              >
                <Rewind className="size-[0.8em] fill-leaf text-leaf" strokeWidth={1.5} />
              </motion.span>
              <span className="grad-text pb-2">{t("heroTitle2")}</span>
            </motion.span>
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="mt-6 max-w-[34rem] text-[1.06rem] leading-relaxed text-ink-2 md:text-lg"
          >
            {t("heroSub")}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <Btn size="lg" onClick={startDemo} icon={<History className="size-5" />}>
              {t("tryDemo")}
            </Btn>
            <Btn size="lg" variant="outline" onClick={startMine} icon={<Camera className="size-5" />}>
              {t("startMine")}
            </Btn>
          </motion.div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="mt-3 text-xs text-ink-3">
            {t("demoNote")}
          </motion.p>
        </motion.div>

        <div className="relative">
          <HeroDemo />
          <FloatChip className="-left-6 top-6 hidden lg:flex" delay={1.2} icon={<ShieldCheck className="size-4 text-mint" />}>
            {lang === "hi" ? "एलर्जी जाँच: सब ठीक" : "Allergy check passed"}
          </FloatChip>
          <FloatChip className="-bottom-5 -left-6 hidden lg:flex" delay={1.6} icon={<Wind className="size-4 text-violet" />}>
            {lang === "hi" ? "स्मॉग का मौसम 36 दिन में" : "Smog season in 36 days"}
          </FloatChip>
          <FloatChip className="-right-4 -top-4 hidden lg:flex" delay={2} icon={<Sparkles className="size-4 text-leaf" />}>
            {lang === "hi" ? "8 की जगह 3 दिन" : "3 days instead of 8"}
          </FloatChip>
        </div>
      </section>

      {/* TAPE */}
      <section className="relative z-10 border-y border-ink/[0.06] bg-paper/40 py-5 backdrop-blur-sm">
        <div className="mask-fade-x overflow-hidden">
          <div className="animate-marquee-rev flex w-max gap-3">
            {[...riyaEps, ...riyaEps, ...riyaEps, ...riyaEps].map((e, i) => {
              const d = parseISO(e.startDate);
              const helped = e.prescriptions.flatMap((p) => p.medicines).find((m) => m.verdict === "helped");
              return (
                <div key={i} className="flex shrink-0 items-center gap-3 rounded-full border border-ink/[0.07] bg-paper/90 py-2 pl-2 pr-4">
                  <span className="size-7 rounded-full" style={{ background: catColor[e.category].bg, boxShadow: `inset 0 0 0 2px ${catColor[e.category].fg}` }} />
                  <span className="font-mono text-xs text-ink-3">
                    {monthsShort[lang][d.getMonth()]} {d.getFullYear()}
                  </span>
                  <span className="text-sm font-semibold">{e.title}</span>
                  {helped && <span className="text-xs font-semibold text-mint">✓ {helped.generic?.split("+")[0] ?? helped.name}</span>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PROBLEM: dark band */}
      <section className="relative z-10 px-3 py-14 md:px-8 md:py-24">
        <Reveal>
          <div className="relative mx-auto max-w-[1240px] overflow-hidden rounded-[36px] bg-ink px-6 py-12 text-white md:rounded-[44px] md:px-14 md:py-20">
            <div
              aria-hidden
              className="absolute inset-0 opacity-[0.07]"
              style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "22px 22px" }}
            />
            <motion.div
              aria-hidden
              className="absolute -left-24 -top-24 size-[420px] rounded-full blur-3xl"
              style={{ background: "radial-gradient(circle, rgba(55,178,77,.45), transparent 65%)" }}
              animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
              transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              aria-hidden
              className="absolute -bottom-32 right-0 size-[460px] rounded-full blur-3xl"
              style={{ background: "radial-gradient(circle, rgba(18,155,138,.4), transparent 65%)" }}
              animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
              transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="relative">
              <div className="text-sm font-semibold text-[#8fe0a0]">{lang === "hi" ? "समस्या" : "The problem"}</div>
              <h2 className="font-display mt-3 max-w-3xl text-[2rem] font-semibold leading-[1.05] md:text-[3.2rem]">
                {lang === "hi" ? "दो मिनट का परामर्श। न पढ़ी जाने वाली पर्ची। कोई याद नहीं रखता क्या काम आया।" : "Two-minute consults. Unreadable parchis. Nobody remembers what worked."}
              </h2>
              <div className="mt-12 grid gap-8 md:grid-cols-3 md:gap-0 md:divide-x md:divide-white/10">
                {[
                  { pre: "", n: 60, suf: "%", k: "stat1" as const, s: "stat1Src" as const },
                  { pre: "~", n: 2, suf: " min", k: "stat2" as const, s: "stat2Src" as const },
                  { pre: lang === "hi" ? "" : "up to ", n: 80, suf: "%", k: "stat3" as const, s: "stat3Src" as const },
                ].map((x, i) => (
                  <motion.div
                    key={x.k}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.15 * i, type: "spring", stiffness: 140, damping: 20 }}
                    className="md:px-8 md:first:pl-0 md:last:pr-0"
                  >
                    <div className="font-display flex items-baseline text-[3.4rem] font-semibold leading-none md:text-[4.2rem]">
                      {x.pre && <span className="mr-1 text-[0.45em] text-white/60">{x.pre}</span>}
                      <span className="bg-[linear-gradient(120deg,#b6f0c1,#5fd17a,#3cc9b5)] bg-clip-text text-transparent">
                        <CountUp to={x.n} duration={1.6} />
                        {x.suf}
                      </span>
                    </div>
                    <p className="mt-3 max-w-xs text-white/75">{t(x.k)}</p>
                    <p className="mt-3 font-mono text-[0.7rem] text-white/40">{t(x.s)}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* HOW IT WORKS: stepper + phone */}
      <HowItWorks />

      {/* SEASONS */}
      <section className="relative z-10 px-3 py-14 md:px-8 md:py-24">
        <Reveal>
          <div className="relative mx-auto grid max-w-[1240px] items-center gap-10 overflow-hidden rounded-[36px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,.85),rgba(232,246,236,.7))] p-6 shadow-[var(--shadow-soft)] md:rounded-[44px] md:p-12 lg:grid-cols-2">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-leaf-deep">{t("seasonRadar")}</div>
              <h2 className="font-display mt-3 text-[2rem] font-semibold leading-[1.05] md:text-[3rem]">
                {lang === "hi" ? "आपकी सेहत के भी मौसम होते हैं।" : "Your health has seasons."}
              </h2>
              <p className="mt-4 max-w-lg text-lg text-ink-2">
                {lang === "hi"
                  ? "रिया को हर मई आँखों की एलर्जी और हर नवंबर स्मॉग वाली खाँसी होती है। इस बार वो पहले से तैयार थी। 8 की जगह 3 दिन।"
                  : "Riya gets itchy eyes every May and a smog cough every November. This year she saw it coming. 3 days instead of 8."}
              </p>
              <div className="mt-7 flex flex-col gap-2.5">
                {[
                  { m: 4, title: lang === "hi" ? "आँखों की एलर्जी" : "Itchy eyes", note: lang === "hi" ? "Olopatadine से आराम" : "Olopatadine helped", cat: "eye" as const },
                  { m: 7, title: lang === "hi" ? "मानसून फंगल" : "Monsoon rash", note: lang === "hi" ? "क्रीम + गोली, 4 हफ़्ते" : "Cream and tablet, 4 weeks", cat: "skin" as const },
                  { m: 10, title: lang === "hi" ? "स्मॉग वाली खाँसी" : "Smog cough", note: lang === "hi" ? "Azithromycin से एसिडिटी" : "Azithromycin caused acidity", cat: "respiratory" as const },
                ].map((r, i) => (
                  <motion.div
                    key={r.m}
                    initial={{ opacity: 0, x: -24 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 + i * 0.12, type: "spring", stiffness: 180, damping: 20 }}
                    whileHover={{ x: 6 }}
                    className="flex items-center gap-4 rounded-2xl border border-ink/[0.06] bg-paper/80 p-3"
                  >
                    <span
                      className="grid size-12 shrink-0 place-items-center rounded-xl text-sm font-bold"
                      style={{ background: catColor[r.cat].bg, color: catColor[r.cat].fg }}
                    >
                      {monthsShort[lang][r.m]}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold">{r.title}</span>
                      <span className="block text-sm text-ink-3">{r.note}</span>
                    </span>
                    {r.m === 10 && (
                      <span className="ml-auto shrink-0 rounded-full bg-sun-soft px-2.5 py-1 text-xs font-bold text-amber">
                        {lang === "hi" ? "आने वाला" : "Next up"}
                      </span>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="relative mx-auto">
              <motion.div
                aria-hidden
                className="absolute inset-0 -z-10 rounded-full blur-3xl"
                style={{ background: "radial-gradient(circle, rgba(55,178,77,.25), transparent 65%)" }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 6, repeat: Infinity }}
              />
              <SeasonWheel episodes={riyaEps} upcoming={upcomingRisks(riyaEps)} size={wheelSize} />
            </div>
          </div>
        </Reveal>
      </section>

      {/* BENTO */}
      <Bento />

      {/* CTA */}
      <section className="relative z-10 mx-auto max-w-[1240px] px-3 pb-16 md:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-[36px] bg-ink px-6 py-14 text-center text-white md:rounded-[44px] md:py-20">
            <motion.div
              className="absolute left-1/2 top-1/2 size-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-3xl"
              style={{ background: "radial-gradient(circle, #37b24d, transparent 60%)" }}
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 6, repeat: Infinity }}
            />
            <div className="relative mx-auto mb-6 w-fit">
              <Logo size={52} word={false} />
            </div>
            <h2 className="font-display relative text-[2.2rem] font-semibold leading-tight md:text-[3.4rem]">{t("tagline")}</h2>
            <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Btn size="lg" onClick={startDemo}>
                {t("tryDemo")} <ArrowRight className="size-5" />
              </Btn>
              <Btn size="lg" variant="ghost" className="text-white hover:bg-white/10" onClick={startMine}>
                {t("startMine")}
              </Btn>
            </div>
          </div>
        </Reveal>
        <footer className="mt-8 flex flex-col items-center justify-between gap-2 text-xs text-ink-3 md:flex-row">
          <span>Rxwind · {lang === "hi" ? "मोज़ेक वेलनेस बिल्डर राउंड के लिए बनाया" : "Built for the Mosaic Wellness Builder Round"}</span>
          <span>{lang === "hi" ? "डेटा सिर्फ़ आपके डिवाइस पर। पर्ची Gemini पढ़ता है।" : "Your data stays on your device. Parchis read by Gemini."}</span>
        </footer>
      </section>
    </div>
  );
}

/* ---------- How it works ---------- */

const STEP_MS = 5200;

function HowItWorks() {
  const { lang } = useMemory();
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const id = setTimeout(() => setStep((s) => (s + 1) % 3), STEP_MS);
    return () => clearTimeout(id);
  }, [step, paused]);
  const steps = [
    {
      icon: <Camera className="size-5" />,
      title: lang === "hi" ? "पर्ची की फ़ोटो लें" : "Snap the parchi",
      body: lang === "hi" ? "लिखावट, 1-0-1, BD, AC. सब समझकर सुबह से रात तक का प्लान।" : "Handwriting, 1-0-1, BD, AC. Decoded into a simple morning-to-night plan.",
    },
    {
      icon: <Check className="size-5" />,
      title: lang === "hi" ? "बताएँ क्या काम आया" : "Tell it what worked",
      body: lang === "hi" ? "रोज़ एक टैप। ऐसे पर्चियाँ याद बन जाती हैं।" : "One tap a day. That's how prescriptions become memory.",
    },
    {
      icon: <BellRing className="size-5" />,
      title: lang === "hi" ? "अगली बार पहले से तैयार" : "Be ready next season",
      body: lang === "hi" ? "मई में आँखें, नवंबर में खाँसी। Rxwind पहले बताता है।" : "Eyes in May, cough in November. Rxwind sees it coming and briefs your doctor.",
    },
  ];
  return (
    <section className="relative z-10 mx-auto max-w-[1240px] px-4 py-6 md:px-8 md:py-10">
      <Reveal>
        <div className="text-sm font-semibold text-leaf-deep">{lang === "hi" ? "कैसे काम करता है" : "How it works"}</div>
        <h2 className="font-display mt-3 max-w-2xl text-[2rem] font-semibold leading-[1.05] md:text-[3rem]">
          {lang === "hi" ? "तीन टैप में सेहत की याद।" : "Three taps to a health memory."}
        </h2>
      </Reveal>
      <div className="mt-10 grid items-center gap-10 lg:grid-cols-[1fr_auto] lg:gap-16">
        <div className="flex flex-col gap-3" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          {steps.map((s, i) => {
            const on = i === step;
            return (
              <motion.button
                key={i}
                onClick={() => setStep(i)}
                layout
                className={cx(
                  "relative overflow-hidden rounded-3xl border p-5 text-left transition-colors md:p-6",
                  on ? "border-white bg-paper shadow-[var(--shadow-lift)]" : "border-transparent bg-paper/30 hover:bg-paper/60",
                )}
              >
                <div className="flex items-start gap-4">
                  <span
                    className={cx(
                      "grid size-11 shrink-0 place-items-center rounded-2xl transition-colors",
                      on ? "bg-[linear-gradient(135deg,#3dbb55,#1f8a3b)] text-white" : "bg-coral-soft text-leaf-deep",
                    )}
                  >
                    {s.icon}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-ink-3">0{i + 1}</span>
                      <h3 className="font-display text-xl font-semibold">{s.title}</h3>
                    </div>
                    <AnimatePresence initial={false}>
                      {on && (
                        <motion.p
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden pt-1.5 text-ink-2"
                        >
                          {s.body}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                {on && (
                  <motion.span
                    key={`bar-${step}-${paused}`}
                    className="absolute bottom-0 left-0 h-[3px] bg-[linear-gradient(90deg,#37b24d,#129b8a)]"
                    initial={{ width: "0%" }}
                    animate={{ width: paused ? "0%" : "100%" }}
                    transition={{ duration: paused ? 0 : STEP_MS / 1000, ease: "linear" }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
        <Phone>
          <AnimatePresence mode="wait">
            {step === 0 && <ScreenScan key="s0" />}
            {step === 1 && <ScreenCheckin key="s1" />}
            {step === 2 && <ScreenAlert key="s2" />}
          </AnimatePresence>
        </Phone>
      </div>
    </section>
  );
}

function Phone({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotate: 3 }}
      whileInView={{ opacity: 1, y: 0, rotate: 0 }}
      viewport={{ once: true }}
      transition={{ type: "spring", stiffness: 90, damping: 16 }}
      className="relative mx-auto"
    >
      <div
        aria-hidden
        className="absolute -inset-10 -z-10 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(55,178,77,.3), transparent 65%)" }}
      />
      <div className="relative h-[560px] w-[280px] rounded-[48px] bg-ink p-[10px] shadow-[0_40px_80px_-30px_rgba(17,41,29,.55)]">
        <div className="relative h-full w-full overflow-hidden rounded-[38px] bg-[linear-gradient(180deg,#eef8f0,#e3f2e7)]">
          <div className="absolute left-1/2 top-2 z-20 h-6 w-24 -translate-x-1/2 rounded-full bg-ink" />
          <div className="flex items-center justify-between px-6 pt-3 text-[0.62rem] font-semibold text-ink">
            <span>9:41</span>
            <span>5G</span>
          </div>
          <div className="px-4 pt-6">{children}</div>
        </div>
      </div>
    </motion.div>
  );
}

const screenAnim = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -16, scale: 0.98 },
  transition: { duration: 0.35 },
};

function ScreenScan() {
  const { lang } = useMemory();
  const meds = [
    { n: "Dolo 650", s: lang === "hi" ? "सुबह · दोपहर · रात" : "Morning · Afternoon · Night" },
    { n: "Allegra 120", s: lang === "hi" ? "रात" : "Night" },
    { n: "Pan 40", s: lang === "hi" ? "सुबह, खाने से पहले" : "Morning, before food" },
  ];
  return (
    <motion.div {...screenAnim}>
      <div className="font-display text-lg font-semibold">{lang === "hi" ? "पर्ची पढ़ी जा रही है" : "Reading your parchi"}</div>
      <div className="relative mt-3 h-[170px] overflow-hidden rounded-2xl bg-ink shadow-md">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/samples/gp-fever-thumb.jpg" alt="" className="size-full object-cover object-top opacity-90" />
        <motion.div
          className="absolute inset-x-0 h-14"
          style={{ background: "linear-gradient(to bottom, transparent, rgba(55,178,77,.35) 85%, rgba(55,178,77,.95))" }}
          animate={{ top: ["-30%", "100%"] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {meds.map((m, i) => (
          <motion.div
            key={m.n}
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 + i * 0.5, type: "spring", stiffness: 260, damping: 22 }}
            className="flex items-center gap-2.5 rounded-xl bg-white p-2.5 shadow-sm"
          >
            <span className="grid size-7 place-items-center rounded-lg bg-coral-soft text-leaf-deep">
              <Check className="size-3.5" strokeWidth={3} />
            </span>
            <span>
              <span className="block text-[0.8rem] font-semibold">{m.n}</span>
              <span className="block text-[0.68rem] text-ink-3">{m.s}</span>
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function ScreenCheckin() {
  const { lang } = useMemory();
  const colors = ["#d93d4a", "#e8613c", "#d98a04", "#37b24d", "#129b8a"];
  return (
    <motion.div {...screenAnim}>
      <div className="text-xs font-semibold text-ink-3">{lang === "hi" ? "दिन 4" : "Day 4"}</div>
      <div className="font-display text-lg font-semibold leading-tight">{lang === "hi" ? "आज कैसा लग रहा है?" : "How are you feeling today?"}</div>
      <div className="mt-4 grid grid-cols-5 gap-1.5">
        {colors.map((c, i) => (
          <motion.div
            key={c}
            className="grid aspect-square place-items-center rounded-xl bg-white shadow-sm"
            animate={i === 3 ? { scale: [1, 1, 1.18, 1], backgroundColor: ["#fff", "#fff", c, c] } : {}}
            transition={{ duration: 1.2, delay: 0.6, times: [0, 0.5, 0.75, 1] }}
          >
            <svg width="26" height="26" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke={i === 3 ? "#fff" : c} strokeWidth="2.4" />
              <circle cx="12.5" cy="14" r="2" fill={i === 3 ? "#fff" : c} />
              <circle cx="23.5" cy="14" r="2" fill={i === 3 ? "#fff" : c} />
              <path d={`M11 ${23 - (i - 2) * 1.5} Q18 ${23 + (i - 2) * 4.5} 25 ${23 - (i - 2) * 1.5}`} fill="none" stroke={i === 3 ? "#fff" : c} strokeWidth="2.4" strokeLinecap="round" />
            </svg>
          </motion.div>
        ))}
      </div>
      <div className="mt-5 text-xs font-semibold text-ink-3">{lang === "hi" ? "क्या फ़ायदा हुआ?" : "Did it help?"}</div>
      {[
        { n: "Montair LC", v: lang === "hi" ? "फ़ायदा हुआ" : "Helped", c: "bg-mint text-white" },
        { n: "Azee 500", v: lang === "hi" ? "एसिडिटी" : "Acidity", c: "bg-rose text-white" },
      ].map((m, i) => (
        <motion.div
          key={m.n}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 + i * 0.5 }}
          className="mt-2 flex items-center justify-between rounded-xl bg-white p-2.5 shadow-sm"
        >
          <span className="text-[0.8rem] font-semibold">{m.n}</span>
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.9 + i * 0.5, type: "spring", stiffness: 400, damping: 14 }}
            className={cx("rounded-full px-2 py-0.5 text-[0.65rem] font-bold", m.c)}
          >
            {m.v}
          </motion.span>
        </motion.div>
      ))}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3 }}
        className="mt-4 rounded-xl bg-ink p-3 text-[0.72rem] text-white"
      >
        {lang === "hi" ? "सेव हो गया। अगली बार काम आएगा।" : "Saved to your memory. Next time, you'll know."}
      </motion.div>
    </motion.div>
  );
}

function ScreenAlert() {
  const { lang } = useMemory();
  return (
    <motion.div {...screenAnim} className="relative">
      <motion.div
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 220, damping: 18 }}
        className="rounded-2xl bg-white/95 p-3 shadow-[var(--shadow-lift)]"
      >
        <div className="flex items-center gap-2 text-[0.65rem] font-semibold text-ink-3">
          <Logo size={16} word={false} /> Rxwind · {lang === "hi" ? "अभी" : "now"}
        </div>
        <div className="mt-1.5 text-[0.82rem] font-semibold leading-snug">
          {lang === "hi" ? "स्मॉग का मौसम 36 दिन में" : "Smog season in 36 days"}
        </div>
        <div className="text-[0.72rem] leading-snug text-ink-2">
          {lang === "hi" ? "पिछली बार Montair से आराम, Azithromycin से एसिडिटी।" : "Last time Montair helped. Azithromycin gave you acidity."}
        </div>
      </motion.div>
      <div className="mt-5 grid grid-cols-4 gap-1.5">
        {monthsShort[lang].map((m, i) => {
          const hot = i === 10;
          const past = i === 4 || i === 7;
          return (
            <motion.div
              key={m}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + i * 0.04 }}
              className={cx(
                "relative rounded-lg py-2 text-center text-[0.68rem] font-semibold",
                hot ? "bg-violet text-white" : past ? "bg-sky-soft text-sky" : "bg-white text-ink-3",
              )}
            >
              {m}
              {hot && (
                <motion.span
                  className="absolute inset-0 rounded-lg border-2 border-violet"
                  animate={{ scale: [1, 1.25], opacity: [0.8, 0] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                />
              )}
            </motion.div>
          );
        })}
      </div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4 }}
        className="mt-5 rounded-2xl bg-[linear-gradient(135deg,#3dbb55,#1f8a3b)] p-3 text-white"
      >
        <div className="text-[0.72rem] text-white/80">{lang === "hi" ? "डॉक्टर ब्रीफ़ तैयार" : "Doctor brief ready"}</div>
        <div className="text-[0.82rem] font-semibold">{lang === "hi" ? "WhatsApp पर भेजें" : "Share on WhatsApp"}</div>
      </motion.div>
    </motion.div>
  );
}

/* ---------- Bento ---------- */

function Bento() {
  const { lang } = useMemory();
  const hi = lang === "hi";
  return (
    <section className="relative z-10 mx-auto max-w-[1240px] px-4 pb-20 md:px-8">
      <Reveal>
        <div className="text-sm font-semibold text-leaf-deep">{hi ? "छोटी चीज़ें, बड़ा फ़र्क" : "Small things, big difference"}</div>
        <h2 className="font-display mt-3 max-w-2xl text-[2rem] font-semibold leading-[1.05] md:text-[3rem]">
          {hi ? "पूरे परिवार के लिए बना।" : "Built for the whole family."}
        </h2>
      </Reveal>
      <div className="mt-10 grid gap-4 md:grid-cols-6">
        <BentoTile className="md:col-span-3" title={hi ? "एलर्जी जाँच" : "Allergy check"} body={hi ? "माँ को पेनिसिलिन से एलर्जी? नई पर्ची में दिखते ही चेतावनी।" : "Maa is allergic to penicillin. Rxwind flags it the moment a new parchi has it."}>
          <AllergyDemo />
        </BentoTile>
        <BentoTile className="md:col-span-3" title={hi ? "हिंदी और English" : "English and हिंदी"} body={hi ? "एक टैप में पूरा ऐप हिंदी में। माता-पिता के लिए आसान।" : "One tap switches the whole app. Easy for parents."}>
          <LangDemo />
        </BentoTile>
        <BentoTile className="md:col-span-2" title={hi ? "कैलेंडर रिमाइंडर" : "Calendar reminders"} body={hi ? "हर डोज़ का रिमाइंडर, कोर्स ख़त्म होते ही बंद।" : "Every dose, on your calendar. Stops when the course ends."}>
          <CalDemo />
        </BentoTile>
        <BentoTile className="md:col-span-2" title={hi ? "WhatsApp पर ब्रीफ़" : "Brief on WhatsApp"} body={hi ? "पूरी हिस्ट्री एक पेज में, डॉक्टर के लिए।" : "Your whole history on one page for the doctor."}>
          <BriefDemo />
        </BentoTile>
        <BentoTile className="md:col-span-2" title={hi ? "आपके फ़ोन पर ही" : "Private by default"} body={hi ? "कोई अकाउंट नहीं। डेटा आपके डिवाइस पर।" : "No account. Your data stays on your device."}>
          <LockDemo />
        </BentoTile>
      </div>
    </section>
  );
}

function BentoTile({ className = "", title, body, children }: { className?: string; title: string; body: string; children: React.ReactNode }) {
  return (
    <Reveal className={className}>
      <TiltCard max={4} className="card group h-full overflow-hidden p-5 md:p-6">
        <div className="relative grid h-36 place-items-center overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#f1faf2,#e2f3e7)]">{children}</div>
        <h3 className="font-display mt-5 text-lg font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-ink-2">{body}</p>
      </TiltCard>
    </Reveal>
  );
}

function AllergyDemo() {
  return (
    <div className="flex w-[85%] max-w-[300px] flex-col gap-2">
      <div className="flex items-center gap-2 rounded-xl bg-white p-2.5 shadow-sm">
        <span className="grid size-7 place-items-center rounded-lg bg-canvas text-ink-2"><Pill className="size-4" /></span>
        <span className="text-sm font-semibold">Mox 500</span>
        <span className="ml-auto text-xs text-ink-3">Amoxicillin</span>
      </div>
      <motion.div
        className="flex items-center gap-2 rounded-xl border border-rose/30 bg-rose-soft p-2.5 text-xs font-semibold text-rose"
        animate={{ opacity: [0, 1, 1, 0], y: [8, 0, 0, 8] }}
        transition={{ duration: 3.6, repeat: Infinity, times: [0, 0.15, 0.85, 1], repeatDelay: 0.6 }}
      >
        <ShieldAlert className="size-4 shrink-0" />
        Maa is allergic to penicillin
      </motion.div>
    </div>
  );
}

function LangDemo() {
  const [hiOn, setHiOn] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setHiOn((v) => !v), 2200);
    return () => clearInterval(id);
  }, []);
  const words = hiOn ? ["सुबह", "दोपहर", "रात"] : ["Morning", "Afternoon", "Night"];
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex rounded-full bg-white p-1 text-xs font-semibold shadow-sm">
        <motion.span
          className="absolute inset-y-1 w-[calc(50%-4px)] rounded-full bg-[linear-gradient(135deg,#3dbb55,#1f8a3b)]"
          animate={{ x: hiOn ? "100%" : "0%" }}
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        />
        <span className={cx("relative z-10 px-4 py-1", !hiOn ? "text-white" : "text-ink-3")}>English</span>
        <span className={cx("relative z-10 px-4 py-1", hiOn ? "text-white" : "text-ink-3")} style={{ fontFamily: "Mukta" }}>
          हिंदी
        </span>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={hiOn ? "hi" : "en"}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
          className="flex gap-2"
        >
          {words.map((w) => (
            <span key={w} className="rounded-xl bg-white px-3 py-1.5 text-sm font-semibold shadow-sm" style={{ fontFamily: hiOn ? "Mukta" : undefined }}>
              {w}
            </span>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function CalDemo() {
  const times = ["8 AM", "2 PM", "10 PM"];
  return (
    <div className="flex w-[80%] flex-col gap-1.5">
      {times.map((t, i) => (
        <motion.div
          key={t}
          className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 text-xs shadow-sm"
          animate={{ x: [0, 4, 0] }}
          transition={{ duration: 0.6, delay: i * 0.9, repeat: Infinity, repeatDelay: 2.1 }}
        >
          <motion.span
            className="size-2 rounded-full bg-leaf"
            animate={{ scale: [1, 1.8, 1] }}
            transition={{ duration: 0.6, delay: i * 0.9, repeat: Infinity, repeatDelay: 2.1 }}
          />
          <span className="font-semibold">{t}</span>
          <Pill className="ml-auto size-3.5 text-ink-3" />
        </motion.div>
      ))}
    </div>
  );
}

function BriefDemo() {
  return (
    <div className="relative w-[70%]">
      <div className="rounded-xl bg-white p-3 shadow-sm">
        {[90, 70, 80, 55].map((w, i) => (
          <motion.div
            key={i}
            className="mb-1.5 h-1.5 rounded-full bg-ink/10"
            initial={{ width: 0 }}
            whileInView={{ width: `${w}%` }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 + i * 0.15, duration: 0.5 }}
          />
        ))}
      </div>
      <motion.div
        className="absolute -bottom-3 -right-4 rounded-2xl rounded-br-sm bg-[#1faa59] px-3 py-1.5 text-xs font-semibold text-white shadow-md"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2.4, repeat: Infinity }}
      >
        Sent ✓✓
      </motion.div>
    </div>
  );
}

function LockDemo() {
  return (
    <motion.div
      className="relative grid size-16 place-items-center rounded-2xl bg-white text-leaf-deep shadow-sm"
      animate={{ rotate: [0, -6, 6, 0] }}
      transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 1 }}
    >
      <Lock className="size-7" />
      <motion.span
        className="absolute inset-0 rounded-2xl border-2 border-leaf"
        animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
        transition={{ duration: 1.8, repeat: Infinity }}
      />
    </motion.div>
  );
}

/** Animated parchi → dose plan transformation */

function FloatChip({ children, icon, className = "", delay = 0 }: { children: React.ReactNode; icon: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
      transition={{ opacity: { delay }, scale: { delay, type: "spring" }, y: { delay, duration: 4, repeat: Infinity, ease: "easeInOut" } }}
      className={cx("glass absolute z-20 items-center gap-2 rounded-2xl px-3 py-2 text-xs font-semibold text-ink", className)}
    >
      {icon}
      {children}
    </motion.div>
  );
}

function HeroDemo() {
  const { lang } = useMemory();
  const [step, setStep] = useState(0); // 0 scanning, 1..4 lines decoded, 5 plan
  useEffect(() => {
    const seq = [1300, 650, 650, 650, 650, 3600];
    const id = setTimeout(() => setStep((s) => (s + 1) % 6), seq[step]);
    return () => clearTimeout(id);
  }, [step]);
  const lines = [
    { hand: "Tab. Augmentin 625   1–0–1  PC ×5d", name: "Augmentin 625", slot: [1, 0, 0, 1], food: lang === "hi" ? "खाने के बाद" : "after food", days: 5 },
    { hand: "Tab. Pan 40   1–0–0  AC ×5d", name: "Pan 40", slot: [1, 0, 0, 0], food: lang === "hi" ? "खाने से पहले" : "before food", days: 5 },
    { hand: "Betadine gargle  TDS", name: "Betadine gargle", slot: [1, 1, 0, 1], food: lang === "hi" ? "खाने के बाद" : "after food", days: 5 },
    { hand: "Tab. Dolo 650  SOS", name: "Dolo 650", slot: [0, 0, 0, 0], food: lang === "hi" ? "ज़रूरत पर" : "only if fever", days: 0 },
  ];
  const slotNames = lang === "hi" ? ["सुबह", "दोपहर", "शाम", "रात"] : ["Morning", "Afternoon", "Evening", "Night"];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, rotate: 2 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 80, damping: 16, delay: 0.2 }}
      className="relative mx-auto w-full max-w-[520px]"
    >
      {/* parchi */}
      <motion.div
        animate={{ rotate: step === 5 ? -7 : -3, x: step === 5 ? -24 : 0, scale: step === 5 ? 0.92 : 1 }}
        transition={{ type: "spring", stiffness: 90, damping: 16 }}
        className="relative z-0 overflow-hidden rounded-[22px] bg-[#fbf8f1] p-5 pb-28 shadow-[var(--shadow-lift)] sm:p-6 sm:pb-32"
      >
        <div className="flex items-end justify-between border-b-2 border-double border-[#b5462f]/50 pb-2">
          <div>
            <div className="text-lg font-bold text-[#7c2414]" style={{ fontFamily: "Georgia, serif" }}>
              Dr. Anil Sharma
            </div>
            <div className="text-[0.65rem] text-[#5a4636]">MBBS · General Physician</div>
          </div>
          <div className="text-xl text-[#1b3a8a]" style={{ fontFamily: "Caveat" }}>
            {new Date().getDate()}/{new Date().getMonth() + 1}
          </div>
        </div>
        <div className="mt-2 text-3xl italic text-[#7c2414]" style={{ fontFamily: "Georgia, serif" }}>
          ℞
        </div>
        <div className="flex flex-col gap-1.5 pl-4">
          {lines.map((l, i) => (
            <motion.div
              key={i}
              className="relative w-fit rounded-md px-1 text-[1.35rem] leading-tight text-[#1b3a8a] sm:text-[1.5rem]"
              style={{ fontFamily: "Caveat", rotate: i % 2 ? -0.6 : 0.5 }}
              animate={{ backgroundColor: step === i + 1 ? "rgba(47,163,70,.16)" : "rgba(47,163,70,0)" }}
            >
              {l.hand}
            </motion.div>
          ))}
        </div>
        <div className="mt-3 pl-4 text-[1.1rem] leading-tight text-[#1b3a8a]" style={{ fontFamily: "Caveat" }}>
          Warm salt water gargles. Review if fever &gt; 3 days.
        </div>
        <AnimatePresence>
          {step === 0 && (
            <motion.div
              key="laser"
              className="absolute inset-x-0 h-20"
              style={{ background: "linear-gradient(to bottom, transparent, rgba(47,163,70,.25) 85%, rgba(47,163,70,.9))" }}
              initial={{ top: "-20%" }}
              animate={{ top: "100%" }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* decoded plan */}
      <motion.div
        className="glass relative z-10 -mt-24 ml-auto w-[92%] rounded-[24px] p-4 sm:-mt-28 sm:w-[86%]"
        animate={{ y: step === 0 ? 30 : 0, opacity: step === 0 ? 0 : 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 18 }}
      >
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[0.68rem] font-bold text-ink-3">
            <Sunrise className="size-3.5 text-coral" /> {lang === "hi" ? "आज का प्लान" : "Today's plan"}
          </div>
          <div className="flex items-center gap-1 text-[0.68rem] font-semibold text-mint">
            <Check className="size-3.5" strokeWidth={3} /> {lang === "hi" ? "Gemini ने पढ़ा" : "Read by Gemini"}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          {lines.map((l, i) => (
            <AnimatePresence key={i}>
              {step >= i + 1 && (
                <motion.div
                  initial={{ opacity: 0, x: -30, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  className="flex items-center gap-3 rounded-2xl bg-white/90 p-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{l.name}</div>
                    <div className="truncate text-[0.7rem] text-ink-3">
                      {l.food}
                      {l.days ? ` · ${l.days} ${lang === "hi" ? "दिन" : "days"}` : ""}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {l.slot.map((on, si) => (
                      <span
                        key={si}
                        title={slotNames[si]}
                        className="grid size-6 place-items-center rounded-full text-[0.55rem] font-bold"
                        style={{ background: on ? (si === 3 ? "#6d4cf0" : "#2fa346") : "rgba(17,41,29,.06)", color: on ? "#fff" : "#9aa3af" }}
                      >
                        {si === 3 ? <Moon className="size-3" /> : slotNames[si][0]}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          ))}
        </div>
        <AnimatePresence>
          {step === 5 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-2 flex items-start gap-2 rounded-2xl bg-ink p-3 text-xs text-white">
                <History className="mt-0.5 size-4 shrink-0 text-coral" />
                <span>
                  {lang === "hi"
                    ? "पिछली बार Azithromycin से एसिडिटी हुई थी, डॉक्टर को बताएँ।"
                    : "Azithromycin gave you acidity last November. Added to your brief."}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
