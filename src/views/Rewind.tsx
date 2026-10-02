"use client";

import { motion, useScroll, useSpring } from "motion/react";
import { useMemo, useRef, useState } from "react";
import { Rewind as RewindIcon } from "lucide-react";
import { useMemory } from "@/lib/store";
import { catColor, episodeDays, episodeMeds, memberEpisodes } from "@/lib/insights";
import { categoryLabel, monthsShort } from "@/lib/i18n";
import type { Category, Episode } from "@/lib/types";
import { cx, parseISO } from "@/lib/util";
import { MemberSwitch } from "@/components/Shell";
import { FormIcon } from "@/components/ui";

export default function Rewind() {
  const { state, t, lang } = useMemory();
  const all = memberEpisodes(state, state.activeMemberId);
  const [cat, setCat] = useState<Category | "all">("all");
  const eps = all.filter((e) => cat === "all" || e.category === cat);
  const cats = Array.from(new Set(all.map((e) => e.category)));
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 70%", "end 60%"] });
  const line = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  const years = useMemo(() => {
    const m = new Map<number, Episode[]>();
    for (const e of eps) {
      const y = parseISO(e.startDate).getFullYear();
      m.set(y, [...(m.get(y) ?? []), e]);
    }
    return [...m.entries()].sort((a, b) => b[0] - a[0]);
  }, [eps]);

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <motion.div
            className="mb-2 inline-flex items-center gap-2 rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
          >
            <motion.span animate={{ x: [0, -4, 0] }} transition={{ duration: 1.2, repeat: Infinity }}>
              <RewindIcon className="size-3.5 fill-coral text-coral" />
            </motion.span>
            {all.length} {t("episodes")}
          </motion.div>
          <h1 className="font-display text-[2.2rem] font-semibold leading-none md:text-[3rem]">{t("rewindTitle")}</h1>
          <p className="mt-2 text-ink-2">{t("rewindSub")}</p>
        </div>
        <MemberSwitch />
      </div>

      <Tape episodes={all} />

      <div className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        {(["all", ...cats] as const).map((c) => {
          const on = cat === c;
          return (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cx(
                "relative shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
                on ? "text-white" : "bg-paper text-ink-2 hover:text-ink",
              )}
            >
              {on && <motion.span layoutId="cat-pill" className="absolute inset-0 rounded-full bg-ink" transition={{ type: "spring", stiffness: 500, damping: 36 }} />}
              <span className="relative inline-flex items-center gap-1.5">
                {c !== "all" && <span className="size-2 rounded-full" style={{ background: catColor[c].fg }} />}
                {c === "all" ? (lang === "hi" ? "सब" : "All") : categoryLabel[lang][c]}
              </span>
            </button>
          );
        })}
      </div>

      <div ref={ref} className="relative mt-8">
        {/* spine */}
        <div className="absolute bottom-0 left-[15px] top-0 w-[2px] rounded-full bg-ink/[0.07] md:left-1/2 md:-translate-x-1/2" />
        <motion.div
          className="absolute left-[15px] top-0 w-[2px] origin-top rounded-full bg-gradient-to-b from-coral to-violet md:left-1/2 md:-translate-x-1/2"
          style={{ scaleY: line, height: "100%" }}
        />
        {years.map(([y, list]) => (
          <div key={y} className="relative mb-6">
            <div className="sticky top-16 z-10 mb-4 flex md:top-6 md:justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="font-display ml-10 rounded-full bg-canvas/90 px-4 py-1 text-2xl font-bold backdrop-blur md:ml-0"
              >
                {y}
              </motion.div>
            </div>
            <div className="flex flex-col gap-5">
              {list.map((e, i) => (
                <TimelineItem key={e.id} e={e} side={i % 2 === 0 ? "left" : "right"} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineItem({ e, side }: { e: Episode; side: "left" | "right" }) {
  const { lang, go, t } = useMemory();
  const d = parseISO(e.startDate);
  const col = catColor[e.category];
  const meds = episodeMeds(e);
  const helped = meds.filter((m) => m.verdict === "helped");
  const bad = meds.filter((m) => m.verdict === "no-change" || m.verdict === "side-effect");
  return (
    <div className={cx("relative flex md:w-1/2", side === "left" ? "md:pr-10" : "md:ml-auto md:pl-10")}>
      <motion.span
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ type: "spring", stiffness: 400, damping: 18 }}
        className={cx(
          "absolute left-[8px] top-5 z-10 size-4 rounded-full border-[3px] border-canvas md:left-auto",
          side === "left" ? "md:-right-2" : "md:-left-2",
        )}
        style={{ background: col.fg, boxShadow: `0 0 0 4px ${col.bg}` }}
      />
      <motion.button
        onClick={() => go({ name: "episode", id: e.id })}
        initial={{ opacity: 0, x: side === "left" ? -40 : 40, filter: "blur(6px)" }}
        whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ type: "spring", stiffness: 160, damping: 22 }}
        whileHover={{ y: -4 }}
        className="card ml-10 w-full overflow-hidden text-left md:ml-0"
      >
        <div className="flex">
          <div className="w-1.5 shrink-0" style={{ background: col.fg }} />
          <div className="min-w-0 flex-1 p-4 md:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-mono text-xs text-ink-3">
                  {d.getDate()} {monthsShort[lang][d.getMonth()]} · {e.status === "resolved" ? t("resolvedIn", { n: episodeDays(e) }) : e.status === "active" ? t("active") : t("ongoing")}
                </div>
                <div className="font-display mt-0.5 text-xl font-semibold">{e.title}</div>
              </div>
              <span className="shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-bold" style={{ background: col.bg, color: col.fg }}>
                {categoryLabel[lang][e.category]}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {e.prescriptions.map((p, i) => (
                <span key={p.id} className="inline-flex items-center gap-1 text-xs">
                  {i > 0 && <span className="text-ink-3">→</span>}
                  <span className="rounded-full bg-canvas px-2 py-0.5 font-semibold text-ink-2">{p.doctor}</span>
                </span>
              ))}
            </div>
            {(helped.length > 0 || bad.length > 0) && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {helped.map((m) => (
                  <span key={m.id} className="inline-flex items-center gap-1 rounded-full bg-mint-soft px-2 py-0.5 text-[0.7rem] font-semibold text-mint">
                    <FormIcon form={m.form} className="size-3" /> {m.name}
                  </span>
                ))}
                {bad.map((m) => (
                  <span key={m.id} className="inline-flex items-center gap-1 rounded-full bg-rose-soft px-2 py-0.5 text-[0.7rem] font-semibold text-rose line-through decoration-rose/40">
                    <FormIcon form={m.form} className="size-3" /> {m.name}
                  </span>
                ))}
              </div>
            )}
            {e.outcome && <p className="mt-3 line-clamp-2 text-sm text-ink-2">{e.outcome[lang]}</p>}
          </div>
        </div>
      </motion.button>
    </div>
  );
}

function Tape({ episodes }: { episodes: Episode[] }) {
  const { lang, go } = useMemory();
  if (!episodes.length) return null;
  const now = new Date();
  const start = new Date(Math.min(...episodes.map((e) => parseISO(e.startDate).getTime())));
  start.setDate(1);
  const months: Date[] = [];
  for (const d = new Date(start); d <= now; d.setMonth(d.getMonth() + 1)) months.push(new Date(d));
  const span = now.getTime() - start.getTime();
  const pos = (s: string) => ((parseISO(s).getTime() - start.getTime()) / span) * 100;
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card mt-6 p-4">
      <div className="relative h-16">
        <div className="absolute inset-x-0 top-7 h-[3px] rounded-full bg-ink/[0.07]" />
        {months.map((m, i) => (
          <div key={i} className="absolute top-0 -translate-x-1/2 text-center" style={{ left: `${(i / Math.max(1, months.length - 1)) * 100}%` }}>
            {(m.getMonth() === 0 || i === 0 || i === months.length - 1) && (
              <span className="block font-mono text-[0.62rem] font-semibold text-ink-3">
                {monthsShort[lang][m.getMonth()]} {String(m.getFullYear()).slice(2)}
              </span>
            )}
          </div>
        ))}
        {episodes.map((e, i) => {
          const l = pos(e.startDate);
          const r = pos(e.endDate ?? new Date().toISOString().slice(0, 10));
          return (
            <motion.button
              key={e.id}
              title={e.title}
              onClick={() => go({ name: "episode", id: e.id })}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.3 + i * 0.06, type: "spring", stiffness: 200, damping: 22 }}
              whileHover={{ scaleY: 1.6 }}
              className="absolute top-[22px] h-3 origin-left rounded-full"
              style={{ left: `${l}%`, width: `max(10px, ${r - l}%)`, background: catColor[e.category].fg }}
            />
          );
        })}
        <motion.div
          className="absolute top-[16px] -ml-[9px] grid size-[18px] place-items-center rounded-full bg-coral shadow-[var(--shadow-glow)]"
          initial={{ left: "100%" }}
          animate={{ left: ["100%", "0%", "0%", "100%"], scale: [1, 1.3, 1.3, 1] }}
          transition={{ duration: 3.2, times: [0, 0.45, 0.55, 1], ease: "easeInOut", delay: 0.6 }}
        >
          <span className="size-1.5 rounded-full bg-white" />
        </motion.div>
        <div className="absolute bottom-0 right-0 font-mono text-[0.62rem] font-semibold text-coral">{lang === "hi" ? "आज" : "now"}</div>
      </div>
    </motion.div>
  );
}
