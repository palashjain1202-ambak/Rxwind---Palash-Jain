"use client";

import { motion } from "motion/react";
import { ArrowUpRight, Stethoscope } from "lucide-react";
import { useMemory } from "@/lib/store";
import { catColor, episodeDays, episodeMeds } from "@/lib/insights";
import { categoryLabel, monthsShort } from "@/lib/i18n";
import type { Episode } from "@/lib/types";
import { parseISO } from "@/lib/util";
import { FormIcon, TiltCard } from "./ui";

export function EpisodeCard({ e, i = 0 }: { e: Episode; i?: number }) {
  const { go, lang, t } = useMemory();
  const d = parseISO(e.startDate);
  const col = catColor[e.category];
  const meds = episodeMeds(e);
  return (
    <TiltCard className="rounded-[26px]">
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: i * 0.05, type: "spring", stiffness: 240, damping: 26 }}
      onClick={() => go({ name: "episode", id: e.id })}
      className="card group relative flex w-full flex-col overflow-hidden p-4 text-left"
    >
      <span className="absolute inset-x-0 top-0 h-1" style={{ background: col.fg }} />
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-mono text-[0.7rem] text-ink-3">
            {monthsShort[lang][d.getMonth()]} {d.getFullYear()}
          </div>
          <div className="mt-0.5 font-display text-[1.05rem] font-semibold leading-snug">{e.title}</div>
        </div>
        <span
          className="rounded-full px-2 py-0.5 text-[0.65rem] font-bold"
          style={{ background: col.bg, color: col.fg }}
        >
          {categoryLabel[lang][e.category]}
        </span>
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-xs text-ink-3">
        <Stethoscope className="size-3.5" />
        {e.prescriptions.map((p) => p.doctor.replace("Dr. ", "Dr ")).join(" → ")}
      </div>
      <div className="mt-3 flex -space-x-1.5">
        {meds.slice(0, 5).map((m) => (
          <span
            key={m.id}
            title={m.name}
            className="grid size-7 place-items-center rounded-full border-2 border-paper text-white"
            style={{
              background:
                m.verdict === "helped" ? "#0f9f7a" : m.verdict === "side-effect" ? "#d93d4a" : m.verdict === "no-change" ? "#d98a04" : "#8a94a3",
            }}
          >
            <FormIcon form={m.form} className="size-3.5" />
          </span>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="font-semibold text-ink-2">
          {e.status === "resolved" ? t("resolvedIn", { n: episodeDays(e) }) : e.status === "active" ? t("active") : t("ongoing")}
        </span>
        <ArrowUpRight className="size-4 text-ink-3 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-coral" />
      </div>
    </motion.button>
    </TiltCard>
  );
}
