"use client";

import { AnimatePresence, motion, useScroll, useSpring } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
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
    <div id={`ep-card-${e.id}`} className={cx("relative flex scroll-mt-28 md:w-1/2", side === "left" ? "md:pr-10" : "md:ml-auto md:pl-10")}>
      <motion.span
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ type: "spring", stiffness: 400, damping: 18 }}
        className={cx(
          "absolute left-[8px] top-5 z-10 size-4 rounded-full border-[3px] border-canvas",
          side === "left" ? "md:left-auto md:right-[-8px]" : "md:left-[-8px]",
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
  const { lang } = useMemory();
  const [hover, setHover] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scroller.current;
    if (el && el.scrollWidth > el.clientWidth) el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
  }, []);
  if (!episodes.length) return null;

  const now = new Date();
  const start = new Date(Math.min(...episodes.map((e) => parseISO(e.startDate).getTime())));
  start.setDate(1);
  start.setMonth(start.getMonth() - 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 15);
  const span = end.getTime() - start.getTime();
  const pct = (d: Date) => ((d.getTime() - start.getTime()) / span) * 100;

  const months: Date[] = [];
  for (const d = new Date(start); d <= end; d.setMonth(d.getMonth() + 1)) months.push(new Date(d));
  const nowPct = pct(now);
  const sorted = [...episodes].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const hovered = sorted.find((e) => e.id === hover);

  const jump = (id: string) => {
    const el = document.getElementById(`ep-card-${id}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.animate(
      [
        { transform: "scale(1)", filter: "drop-shadow(0 0 0 rgba(55,178,77,0))" },
        { transform: "scale(1.02)", filter: "drop-shadow(0 0 18px rgba(55,178,77,.55))" },
        { transform: "scale(1)", filter: "drop-shadow(0 0 0 rgba(55,178,77,0))" },
      ],
      { duration: 1400, delay: 450, easing: "ease-in-out" },
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative mt-6 overflow-hidden rounded-[28px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,.92),rgba(234,247,237,.85))] shadow-[var(--shadow-soft)]"
    >
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-4 md:px-6">
        <div className="text-sm font-semibold text-ink-2">
          {lang === "hi" ? "आपकी टाइमलाइन" : "Your timeline"}
          <span className="ml-2 font-normal text-ink-3">
            {monthsShort[lang][months[0].getMonth()]} {months[0].getFullYear()} → {lang === "hi" ? "आज" : "today"}
          </span>
        </div>
        <div className="h-5 text-xs text-ink-3">
          <AnimatePresence mode="wait">
            {hovered ? (
              <motion.span key={hovered.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="inline-flex items-center gap-1.5 font-semibold text-ink">
                <span className="size-2 rounded-full" style={{ background: catColor[hovered.category].fg }} />
                {hovered.title} · {parseISO(hovered.startDate).getDate()} {monthsShort[lang][parseISO(hovered.startDate).getMonth()]} {parseISO(hovered.startDate).getFullYear()}
              </motion.span>
            ) : (
              <motion.span key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {lang === "hi" ? "किसी बीमारी पर टैप करें" : "Tap an illness to jump to it"}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* scroll area (scrolls sideways on small screens) */}
      <div ref={scroller} className="no-scrollbar overflow-x-auto">
        <div className="relative mx-5 min-w-[680px] pb-4 pt-9 md:mx-6">
          {/* month grid + labels */}
          <div className="absolute inset-x-0 bottom-4 top-9">
            {months.map((m, i) => {
              const left = pct(m);
              const isJan = m.getMonth() === 0;
              return (
                <div key={i} className="absolute top-0 h-full" style={{ left: `${left}%` }}>
                  <div className={cx("absolute top-0 h-[calc(100%-22px)] w-px", isJan ? "bg-ink/15" : "bg-ink/[0.06]")} />
                  <div className={cx("absolute bottom-0 -translate-x-1/2 whitespace-nowrap text-[0.68rem]", isJan ? "font-bold text-ink-2" : "text-ink-3")}>
                    {monthsShort[lang][m.getMonth()]}
                  </div>
                  {(isJan || i === 0) && (
                    <div className="absolute -top-7 whitespace-nowrap rounded-full bg-ink px-2 py-0.5 text-[0.62rem] font-bold text-white">
                      {m.getFullYear()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* track */}
          <div className="relative h-14">
            <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-ink/[0.06]" />
            {/* elapsed fill up to today */}
            <motion.div
              className="absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-[linear-gradient(90deg,rgba(55,178,77,.15),rgba(55,178,77,.45))]"
              initial={{ width: 0 }}
              animate={{ width: `${nowPct}%` }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            />
            {sorted.map((e, i) => {
              const l = pct(parseISO(e.startDate));
              const r = pct(e.endDate ? parseISO(e.endDate) : now);
              const col = catColor[e.category];
              const on = hover === e.id;
              return (
                <motion.button
                  key={e.id}
                  aria-label={e.title}
                  onMouseEnter={() => setHover(e.id)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(e.id)}
                  onBlur={() => setHover(null)}
                  onClick={() => jump(e.id)}
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={{ delay: 0.4 + i * 0.08, type: "spring", stiffness: 220, damping: 22 }}
                  className={cx(
                    "absolute top-1/2 origin-left -translate-y-1/2 rounded-full outline-none",
                    e.category === "chronic" ? "h-1.5 opacity-40" : "h-4",
                  )}
                  style={{
                    left: `${l}%`,
                    width: `max(16px, ${r - l}%)`,
                    background: `linear-gradient(90deg, ${col.fg}, ${col.fg}cc)`,
                    boxShadow: on ? `0 0 0 4px ${col.bg}, 0 6px 16px -4px ${col.fg}` : e.category === "chronic" ? "none" : `0 2px 6px -2px ${col.fg}99`,
                    zIndex: on ? 10 : e.category === "chronic" ? 0 : 1,
                  }}
                  whileHover={{ scaleY: 1.35 }}
                />
              );
            })}
            {/* today marker */}
            <div className="absolute top-0 h-full" style={{ left: `${nowPct}%` }}>
              <div className="absolute -top-1 bottom-0 w-[2px] -translate-x-1/2 rounded-full bg-leaf" />
              <span className="absolute top-1/2 grid size-5 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-leaf shadow-[0_0_0_4px_rgba(55,178,77,.2)]">
                <span className="size-2 rounded-full bg-white" />
              </span>
              <motion.span
                className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-leaf"
                animate={{ scale: [1, 2.2], opacity: [0.7, 0] }}
                transition={{ duration: 1.8, repeat: Infinity }}
              />
              <span className="absolute -top-7 -translate-x-1/2 whitespace-nowrap rounded-full bg-leaf px-2 py-0.5 text-[0.62rem] font-bold text-white">
                {lang === "hi" ? "आज" : "Today"}
              </span>
            </div>
          </div>
          <div className="h-6" />
        </div>
      </div>
    </motion.div>
  );
}
