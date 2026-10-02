"use client";

import { AnimatePresence, motion, useScroll, useTransform } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, BellRing, Camera, Check, History, Moon, Rewind, ShieldCheck, Sunrise } from "lucide-react";
import { useMemory } from "@/lib/store";
import { buildDemo } from "@/lib/demo";
import { catColor, upcomingRisks } from "@/lib/insights";
import { monthsShort } from "@/lib/i18n";
import { parseISO } from "@/lib/util";
import { Ambient, LangToggle } from "@/components/Shell";
import { SeasonWheel } from "@/components/SeasonWheel";
import { Btn, Logo, Reveal, TiltCard } from "@/components/ui";

export default function Landing() {
  const { t, lang, startDemo, startMine, go, state } = useMemory();
  const demo = useMemo(() => buildDemo(), []);
  const riyaEps = demo.episodes.filter((e) => e.memberId === "riya");
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const heroO = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

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
            {lang === "hi" ? "AI हेल्थ मेमोरी · भारतीय पर्चियों के लिए" : "AI health memory · built for Indian parchis"}
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

        <HeroDemo />
      </section>

      {/* TAPE */}
      <section className="relative z-10 py-6">
        <div className="mask-fade-x overflow-hidden">
          <div className="animate-marquee-rev flex w-max gap-3">
            {[...riyaEps, ...riyaEps, ...riyaEps, ...riyaEps].map((e, i) => {
              const d = parseISO(e.startDate);
              const helped = e.prescriptions.flatMap((p) => p.medicines).find((m) => m.verdict === "helped");
              return (
                <div key={i} className="flex shrink-0 items-center gap-3 rounded-full border border-ink/[0.07] bg-paper/80 py-2 pl-2 pr-4 backdrop-blur">
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

      {/* WHY */}
      <section className="relative z-10 mx-auto max-w-[1240px] px-4 py-16 md:px-8 md:py-24">
        <Reveal>
          <div className="text-xs font-semibold text-coral">{t("whyTitle")}</div>
          <h2 className="font-display mt-3 max-w-3xl text-[2rem] font-semibold leading-[1.05] md:text-[3rem]">
            {lang === "hi" ? "दो मिनट का परामर्श। हाथ की लिखी पर्ची। और याद कुछ नहीं रहता।" : "Two-minute consults. Handwritten parchis. And nobody remembers what worked last time."}
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            { n: "60%", k: "stat1" as const, s: "stat1Src" as const },
            { n: "~2 min", k: "stat2" as const, s: "stat2Src" as const },
            { n: "40–80%", k: "stat3" as const, s: "stat3Src" as const },
          ].map((x, i) => (
            <Reveal key={x.k} delay={i * 0.08}>
              <TiltCard className="card h-full p-6">
                <div className="font-display text-5xl font-semibold text-ink md:text-6xl">{x.n}</div>
                <p className="mt-3 text-ink-2">{t(x.k)}</p>
                <p className="mt-4 font-mono text-[0.68rem] text-ink-3">{t(x.s)}</p>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* HOW */}
      <section className="relative z-10 mx-auto max-w-[1240px] px-4 py-10 md:px-8 md:py-16">
        <div className="grid gap-4 md:grid-cols-3">
          <HowCard
            i={0}
            icon={<Camera className="size-5" />}
            title={lang === "hi" ? "पर्ची की फ़ोटो लें" : "Snap the parchi"}
            body={lang === "hi" ? "हाथ की लिखावट, 1-0-1, BD, AC — सब समझकर साफ़ दवा प्लान।" : "Handwriting, 1-0-1, BD, AC — decoded into a clean Subah-to-Raat plan, in English or Hindi."}
          />
          <HowCard
            i={1}
            icon={<Check className="size-5" />}
            title={lang === "hi" ? "बताएँ क्या काम आया" : "Tell it what worked"}
            body={lang === "hi" ? "रोज़ एक टैप: कैसा लगा, कोई साइड इफ़ेक्ट? यही आपकी मेमोरी बनता है।" : "One tap a day: how you feel, any side effects. That's what turns prescriptions into memory."}
          />
          <HowCard
            i={2}
            icon={<BellRing className="size-5" />}
            title={lang === "hi" ? "अगली बार पहले से तैयार" : "Be ready next season"}
            body={lang === "hi" ? "मई में आँखें, नवंबर में खाँसी — Rxwind पहले बताता है और डॉक्टर के लिए ब्रीफ़ बनाता है।" : "Eyes in May, cough in November — Rxwind sees it coming and hands your next doctor a 30-second brief."}
          />
        </div>
      </section>

      {/* WHEEL SHOWCASE */}
      <section className="relative z-10 mx-auto max-w-[1240px] px-4 py-16 md:px-8 md:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <div className="text-xs font-semibold text-coral">{t("seasonRadar")}</div>
            <h2 className="font-display mt-3 text-[2rem] font-semibold leading-[1.05] md:text-[3rem]">
              {lang === "hi" ? "आपकी सेहत के भी मौसम होते हैं।" : "Your health has seasons."}
            </h2>
            <p className="mt-4 max-w-lg text-lg text-ink-2">
              {lang === "hi"
                ? "रिया को हर मई आँखों की एलर्जी और हर नवंबर स्मॉग वाली खाँसी होती है। दूसरी बार, Rxwind की वजह से, वो पहले ही सही डॉक्टर के पास गई — 8 की जगह 3 दिन।"
                : "Riya gets itchy eyes every May and a smog cough every November. The second time round, she went to the right doctor at the first itch, with last year's brief. Over in 3 days instead of 8."}
            </p>
            <div className="mt-6 flex items-center gap-3 text-sm text-ink-3">
              <ShieldCheck className="size-4 text-mint" /> {t("safety")}
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="card mx-auto w-fit p-6">
              <SeasonWheel episodes={riyaEps} upcoming={upcomingRisks(riyaEps)} size={340} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 mx-auto max-w-[1240px] px-4 pb-20 md:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-[36px] bg-ink px-6 py-14 text-center text-white md:py-20">
            <motion.div
              className="absolute left-1/2 top-1/2 size-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-3xl"
              style={{ background: "radial-gradient(circle, #2fa346, transparent 60%)" }}
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 6, repeat: Infinity }}
            />
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
          <span>{lang === "hi" ? "डेटा सिर्फ़ आपके डिवाइस पर · Gemini से पर्ची पढ़ाई" : "Data stays on your device · Parchis read by Gemini"}</span>
        </footer>
      </section>
    </div>
  );
}

function HowCard({ i, icon, title, body }: { i: number; icon: React.ReactNode; title: string; body: string }) {
  return (
    <Reveal delay={i * 0.08}>
      <TiltCard className="card group relative h-full overflow-hidden p-6">
        <div className="font-mono text-[5rem] font-bold leading-none text-ink/[0.04] absolute -right-2 -top-3">{i + 1}</div>
        <div className="grid size-11 place-items-center rounded-2xl bg-coral-soft text-coral transition group-hover:bg-coral group-hover:text-white">{icon}</div>
        <h3 className="font-display mt-5 text-xl font-semibold">{title}</h3>
        <p className="mt-2 text-ink-2">{body}</p>
      </TiltCard>
    </Reveal>
  );
}

/** Animated parchi → dose plan transformation */
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
  const slotNames = lang === "hi" ? ["सुबह", "दोपहर", "शाम", "रात"] : ["Subah", "Dopahar", "Shaam", "Raat"];
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
        className="relative z-0 overflow-hidden rounded-[22px] bg-[#fbf8f1] p-5 pb-6 shadow-[var(--shadow-lift)] sm:p-6"
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
        className="glass relative z-10 -mt-10 ml-auto w-[92%] rounded-[24px] p-4 sm:-mt-12 sm:w-[86%]"
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
                    ? "पिछली बार Azithromycin से एसिडिटी हुई थी — डॉक्टर को बताएँ।"
                    : "Last November, Azithromycin gave you acidity. Rxwind added it to your doctor brief."}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
