"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { useMemory } from "@/lib/store";
import { sideEffectOptions } from "@/lib/i18n";
import type { CheckIn as CI, Episode } from "@/lib/types";
import { feelingSeries } from "@/lib/insights";
import { cx, todayISO } from "@/lib/util";
import { MedCheckSheet } from "./MedCheck";
import { legacyToKey } from "@/lib/medkb";

const FACES: { v: CI["feeling"]; emoji: string; key: "feeling1" | "feeling2" | "feeling3" | "feeling4" | "feeling5"; color: string }[] = [
  { v: 1, emoji: "😣", key: "feeling1", color: "#d93d4a" },
  { v: 2, emoji: "😕", key: "feeling2", color: "#e8613c" },
  { v: 3, emoji: "😐", key: "feeling3", color: "#d98a04" },
  { v: 4, emoji: "🙂", key: "feeling4", color: "#37b24d" },
  { v: 5, emoji: "😄", key: "feeling5", color: "#129b8a" },
];

export function CheckInCard({ episode }: { episode: Episode }) {
  const { t, lang, addCheckIn } = useMemory();
  const today = todayISO();
  const existing = episode.checkIns.find((c) => c.date === today);
  const [feeling, setFeeling] = useState<CI["feeling"] | null>(existing?.feeling ?? null);
  const [effects, setEffects] = useState<string[]>(existing?.sideEffects ?? []);
  const [saved, setSaved] = useState(!!existing);
  const [checkOpen, setCheckOpen] = useState(false);
  const latest = [...episode.prescriptions].sort((a, b) => a.date.localeCompare(b.date)).at(-1);
  const targets = (latest?.medicines ?? []).map((med) => ({ ep: episode, med }));
  const preset = effects.map((x) => legacyToKey[x]).filter(Boolean);

  const save = (f: CI["feeling"], fx: string[]) => {
    addCheckIn(episode.id, { date: today, feeling: f, sideEffects: fx });
    setSaved(true);
  };

  return (
    <div>
      <div className="mb-3 font-display text-[1.05rem] font-semibold">{t("howFeeling")}</div>
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {FACES.map((f) => {
          const on = feeling === f.v;
          return (
            <motion.button
              key={f.v}
              whileTap={{ scale: 0.88 }}
              whileHover={{ y: -3 }}
              onClick={() => {
                setFeeling(f.v);
                save(f.v, effects);
              }}
              className={cx(
                "relative flex flex-col items-center gap-1 rounded-2xl border py-2.5 transition-colors",
                on ? "border-transparent bg-paper shadow-[var(--shadow-lift)]" : "border-ink/[0.07] bg-paper/50 hover:bg-paper",
              )}
            >
              <motion.span
                animate={on ? { scale: [1, 1.25, 1], rotate: [0, -8, 0] } : { scale: 1 }}
                transition={{ duration: 0.45 }}
                style={{ filter: feeling && !on ? "grayscale(1) opacity(.5)" : undefined }}
              >
                <Face v={f.v} color={f.color} active={on} />
              </motion.span>
              <span className="text-[0.62rem] font-semibold text-ink-3 sm:text-[0.68rem]">{t(f.key)}</span>
              {on && (
                <motion.span layoutId={`feel-${episode.id}`} className="absolute -bottom-1 h-1 w-6 rounded-full" style={{ background: f.color }} />
              )}
            </motion.button>
          );
        })}
      </div>
      <AnimatePresence>
        {feeling && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mb-2 mt-4 text-xs font-semibold text-ink-3">{t("sideEffectsQ")}</div>
            <div className="flex flex-wrap gap-1.5">
              {sideEffectOptions[lang].map((s, i) => {
                const key = sideEffectOptions.en[i];
                const on = effects.includes(key);
                return (
                  <motion.button
                    key={key}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => {
                      const fx = on ? effects.filter((x) => x !== key) : [...effects, key];
                      setEffects(fx);
                      save(feeling, fx);
                    }}
                    className={cx(
                      "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                      on ? "border-rose bg-rose-soft text-rose" : "border-ink/10 bg-paper text-ink-2 hover:border-ink/25",
                    )}
                  >
                    {s}
                  </motion.button>
                );
              })}
            </div>
            <AnimatePresence>
              {effects.length > 0 && targets.length > 0 && (
                <motion.button
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setCheckOpen(true)}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-2 text-xs font-semibold text-white shadow-[var(--shadow-soft)]"
                >
                  <Sparkles className="size-3.5 text-[#8fe0a0]" />
                  {lang === "hi" ? "किस दवा से हो रहा है? जाँचें" : "Which medicine is doing this? Check"}
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
      <MedCheckSheet open={checkOpen} onClose={() => setCheckOpen(false)} targets={targets} initialKind="side-effect" presetSymptoms={preset} />
      <AnimatePresence>
        {saved && feeling && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-mint"
          >
            <Check className="size-3.5" strokeWidth={3} /> {t("checkInSaved")}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FeelingChart({ episode, height = 120 }: { episode: Episode; height?: number }) {
  const { lang } = useMemory();
  const pts = feelingSeries(episode);
  if (pts.length < 2) return null;
  const maxDay = Math.max(...pts.map((p) => p.day), 2);
  const W = 560;
  const H = height;
  const px = (d: number) => 16 + ((d - 1) / (maxDay - 1)) * (W - 32);
  const py = (f: number) => H - 18 - ((f - 1) / 4) * (H - 36);
  const path = pts
    .map((p, i) => {
      if (i === 0) return `M ${px(p.day)} ${py(p.feeling)}`;
      const prev = pts[i - 1];
      const mx = (px(prev.day) + px(p.day)) / 2;
      return `C ${mx} ${py(prev.feeling)}, ${mx} ${py(p.feeling)}, ${px(p.day)} ${py(p.feeling)}`;
    })
    .join(" ");
  const rxDays = episode.prescriptions
    .map((r) => ({ day: Math.round((new Date(r.date).getTime() - new Date(episode.startDate).getTime()) / 86400000) + 1, doc: r.doctor }))
    .filter((r) => r.day > 1);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full overflow-visible">
      <defs>
        <linearGradient id={`fg-${episode.id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#0f9f7a" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#0f9f7a" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[1, 3, 5].map((f) => (
        <line key={f} x1={16} x2={W - 16} y1={py(f)} y2={py(f)} stroke="rgba(17,41,29,.06)" strokeDasharray="3 5" />
      ))}
      {rxDays.map((r) => (
        <g key={r.day}>
          <line x1={px(r.day)} x2={px(r.day)} y1={8} y2={H - 12} stroke="#6d4cf0" strokeOpacity={0.5} strokeDasharray="2 4" />
          <text x={px(r.day) + 5} y={14} fontSize={10} fill="#6d4cf0" fontWeight={600}>
            {r.doc}
          </text>
        </g>
      ))}
      <motion.path
        d={`${path} L ${px(pts[pts.length - 1].day)} ${H - 12} L ${px(pts[0].day)} ${H - 12} Z`}
        fill={`url(#fg-${episode.id})`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      />
      <motion.path
        d={path}
        fill="none"
        stroke="#0f9f7a"
        strokeWidth={2.5}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      />
      {pts.map((p, i) => (
        <motion.circle
          key={p.date}
          cx={px(p.day)}
          cy={py(p.feeling)}
          r={4.5}
          fill="#fff"
          stroke="#0f9f7a"
          strokeWidth={2}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 + i * 0.08 }}
        />
      ))}
      <text x={16} y={H - 1} fontSize={10} fill="#6b7685" className="font-mono">
        {lang === "hi" ? "दिन 1" : "Day 1"}
      </text>
      <text x={W - 16} y={H - 1} fontSize={10} fill="#6b7685" textAnchor="end" className="font-mono">
        {lang === "hi" ? `दिन ${maxDay}` : `Day ${maxDay}`}
      </text>
    </svg>
  );
}

function Face({ v, color, active }: { v: number; color: string; active: boolean }) {
  // mouth curvature: 1 sad .. 5 big smile
  const c = (v - 3) * 4.5;
  const mouth = `M11 ${23 - c / 3} Q18 ${23 + c} 25 ${23 - c / 3}`;
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" className="block">
      <circle cx="18" cy="18" r="16" fill={active ? color : "#fff"} stroke={color} strokeWidth="2" />
      <motion.g animate={active ? { scaleY: [1, 0.1, 1] } : {}} transition={{ delay: 0.5, duration: 0.25 }} style={{ transformOrigin: "18px 14px" }}>
        <circle cx="12.5" cy="14" r="2" fill={active ? "#fff" : color} />
        <circle cx="23.5" cy="14" r="2" fill={active ? "#fff" : color} />
      </motion.g>
      <motion.path
        d={mouth}
        fill="none"
        stroke={active ? "#fff" : color}
        strokeWidth="2.4"
        strokeLinecap="round"
        initial={false}
        animate={{ d: mouth }}
      />
    </svg>
  );
}
