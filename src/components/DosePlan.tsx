"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, Moon, Sun, Sunrise, Sunset, Zap } from "lucide-react";
import { useMemory } from "@/lib/store";
import { foodLabel, slotLabel } from "@/lib/i18n";
import { slotItems, todaysMeds } from "@/lib/insights";
import { SLOTS, type Slot } from "@/lib/types";
import { cx, todayISO } from "@/lib/util";
import { Burst, FormIcon } from "./ui";

const SLOT_ICON: Record<Slot, typeof Sun> = { morning: Sunrise, afternoon: Sun, evening: Sunset, night: Moon };
const SLOT_TINT: Record<Slot, string> = {
  morning: "from-[#ffe9c7] to-[#fff6e8]",
  afternoon: "from-[#fff1bf] to-[#fffaea]",
  evening: "from-[#ffd9cc] to-[#fff1ea]",
  night: "from-[#dcd6ff] to-[#f1eeff]",
};

export function currentSlot(): Slot {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 16) return "afternoon";
  if (h < 19) return "evening";
  return "night";
}

export function useTodayProgress(memberId: string) {
  const { state } = useMemory();
  const items = todaysMeds(state, memberId);
  const today = todayISO();
  let total = 0;
  let done = 0;
  for (const s of SLOTS)
    for (const i of slotItems(items, s)) {
      total++;
      if (i.ep.doses?.[today]?.[`${i.med.id}:${s}`]) done++;
    }
  return { items, total, done };
}

export function ProgressRing({ done, total, size = 64 }: { done: number; total: number; size?: number }) {
  const r = size / 2 - 5;
  const c = 2 * Math.PI * r;
  const pct = total ? done / total : 0;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(17,41,29,.08)" strokeWidth={6} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={pct === 1 ? "#0f9f7a" : "#2fa346"}
          strokeWidth={6}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ type: "spring", stiffness: 80, damping: 18 }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center font-mono text-sm font-semibold text-ink">
        {done}/{total}
      </div>
    </div>
  );
}

export function DosePlan({ memberId, compact = false }: { memberId: string; compact?: boolean }) {
  const { state, lang, toggleDose, t } = useMemory();
  const items = todaysMeds(state, memberId);
  const today = todayISO();
  const now = currentSlot();
  const sos = items.filter((i) => i.med.sos);
  const slots = SLOTS.filter((s) => slotItems(items, s).length > 0);

  if (!items.length) return null;

  return (
    <div>
      <div className="flex flex-col gap-3">
        {slots.map((s, si) => {
          const list = slotItems(items, s);
          const Icon = SLOT_ICON[s];
          const isNow = s === now;
          const allDone = list.every((i) => i.ep.doses?.[today]?.[`${i.med.id}:${s}`]);
          return (
            <motion.div
              key={s}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * si, type: "spring", stiffness: 260, damping: 26 }}
              className={cx(
                "relative overflow-hidden rounded-[22px] border bg-gradient-to-b p-3.5",
                SLOT_TINT[s],
                isNow ? "border-sun/50 ring-2 ring-sun/25" : "border-ink/[0.06]",
              )}
            >
              <div className={cx(!compact && "md:flex md:items-start md:gap-4")}>
              <div className={cx("mb-3 flex items-center justify-between", !compact && "md:mb-0 md:w-32 md:shrink-0 md:flex-col md:items-start md:gap-2 md:pt-1")}>
                <div className="flex items-center gap-2">
                  <motion.span
                    className="grid size-8 place-items-center rounded-full bg-white/80 text-ink shadow-sm"
                    animate={isNow ? { rotate: [0, 12, -8, 0] } : {}}
                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                  >
                    <Icon className="size-4" />
                  </motion.span>
                  <div>
                    <div className="font-display text-[1.05rem] font-semibold leading-tight">{slotLabel[lang][s].name}</div>
                    <div className="font-mono text-[0.68rem] text-ink-3">{slotLabel[lang][s].time}</div>
                  </div>
                </div>
                {isNow && !allDone && (
                  <span className="rounded-full bg-sun px-2 py-0.5 text-[0.65rem] font-bold text-white shadow-[0_4px_12px_-4px_rgba(242,160,61,.8)]">
                    {lang === "hi" ? "अभी" : "Now"}
                  </span>
                )}
                {allDone && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="relative grid size-6 place-items-center rounded-full bg-mint text-white"
                  >
                    <Check className="size-3.5" strokeWidth={3} />
                    <Burst show />
                  </motion.span>
                )}
              </div>
              <div className={cx("grid flex-1 gap-2", !compact && "sm:grid-cols-2")}>
                {list.map((i) => {
                  const k = `${i.med.id}:${s}`;
                  const taken = !!i.ep.doses?.[today]?.[k];
                  return (
                    <motion.button
                      key={k}
                      layout
                      whileTap={{ scale: 0.97 }}
                      onClick={() => toggleDose(i.ep.id, i.med.id, s)}
                      className={cx(
                        "group flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition-colors",
                        taken ? "bg-white/50" : "bg-white shadow-[0_1px_2px_rgba(17,41,29,.06)] hover:shadow-md",
                      )}
                    >
                      <span
                        className={cx(
                          "grid size-10 shrink-0 place-items-center rounded-xl transition-colors",
                          taken ? "bg-mint text-white" : "bg-canvas text-ink-2",
                        )}
                      >
                        <AnimatePresence mode="wait" initial={false}>
                          {taken ? (
                            <motion.span key="c" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}>
                              <Check className="size-5" strokeWidth={3} />
                            </motion.span>
                          ) : (
                            <motion.span key="i" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                              <FormIcon form={i.med.form} className="size-5" />
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={cx("block truncate text-[0.92rem] font-semibold", taken && "text-ink-3 line-through decoration-ink/30")}>
                          {i.med.name}
                        </span>
                        <span className="block truncate text-xs text-ink-3">
                          {i.med.dose} · {foodLabel[lang][i.med.food]}
                        </span>
                      </span>
                      {i.totalDays ? (
                        <span className="shrink-0 font-mono text-[0.65rem] text-ink-3">
                          {i.dayIndex}/{i.totalDays}
                        </span>
                      ) : null}
                    </motion.button>
                  );
                })}
              </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      {sos.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl border border-dashed border-ink/15 px-3 py-2.5 text-sm">
          <Zap className="size-4 text-amber" />
          <span className="font-semibold text-ink-2">{t("asNeeded")}:</span>
          {sos.map((i) => (
            <span key={i.med.id} className="inline-flex items-center gap-1.5 rounded-full bg-paper px-2.5 py-1 text-xs font-semibold">
              <FormIcon form={i.med.form} className="size-3.5" />
              {i.med.name}
              <span className="font-normal text-ink-3">· {i.med.purpose[lang]}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
