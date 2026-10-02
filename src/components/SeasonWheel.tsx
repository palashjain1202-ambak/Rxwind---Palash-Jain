"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useMemory } from "@/lib/store";
import { catColor, seasonWheel, type Upcoming } from "@/lib/insights";
import { categoryLabel, monthsShort } from "@/lib/i18n";
import type { Episode } from "@/lib/types";
import { parseISO } from "@/lib/util";

const TAU = Math.PI * 2;
const polar = (cx: number, cy: number, r: number, a: number) => [cx + r * Math.sin(a), cy - r * Math.cos(a)] as const;

function arcPath(cx: number, cy: number, r: number, a0: number, a1: number) {
  const [x0, y0] = polar(cx, cy, r, a0);
  const [x1, y1] = polar(cx, cy, r, a1);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
}

export function SeasonWheel({ episodes, upcoming, size = 320 }: { episodes: Episode[]; upcoming: Upcoming[]; size?: number }) {
  const { lang, go } = useMemory();
  const [hover, setHover] = useState<Episode | null>(null);
  const months = seasonWheel(episodes);
  const now = new Date();
  const monthFrac = (now.getMonth() + (now.getDate() - 1) / 30) / 12;
  const c = size / 2;
  const R = size / 2 - 34;
  const seg = TAU / 12;
  const next = upcoming[0];

  return (
    <div className="relative mx-auto select-none" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        <defs>
          <radialGradient id="wheel-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fffdf9" />
            <stop offset="100%" stopColor="#e6f3e8" />
          </radialGradient>
        </defs>
        <circle cx={c} cy={c} r={R + 18} fill="url(#wheel-bg)" stroke="rgba(17,41,29,.06)" />
        <g className="spin-slow" style={{ transformOrigin: `${c}px ${c}px`, transformBox: "view-box" }}>
          <circle cx={c} cy={c} r={R + 24} fill="none" stroke="#37b24d" strokeOpacity={0.35} strokeWidth={1.5} strokeDasharray="2 9" />
        </g>
        {/* month ticks + labels */}
        {Array.from({ length: 12 }, (_, i) => {
          const a = i * seg;
          const [x0, y0] = polar(c, c, R - 34, a);
          const [x1, y1] = polar(c, c, R + 18, a);
          const [lx, ly] = polar(c, c, R + 30, a + seg / 2);
          const cur = i === now.getMonth();
          return (
            <g key={i}>
              <line x1={x0} y1={y0} x2={x1} y2={y1} stroke="rgba(17,41,29,.07)" />
              <text
                x={lx}
                y={ly}
                textAnchor="middle"
                dominantBaseline="middle"
                className="font-mono"
                fontSize={10.5}
                fontWeight={cur ? 700 : 500}
                fill={cur ? "#2fa346" : "#6b7685"}
              >
                {monthsShort[lang][i]}
              </text>
            </g>
          );
        })}
        {/* upcoming window */}
        {next && (
          <motion.path
            d={arcPath(c, c, R + 8, monthFrac * TAU, (monthFrac + Math.min(next.daysUntil, 80) / 365) * TAU)}
            stroke="#2fa346"
            strokeOpacity={0.22}
            strokeWidth={14}
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.9, duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          />
        )}
        {/* episodes as stacked arcs */}
        {months.map((list, mi) =>
          list.map((it, k) => {
            const r = R - 6 - k * 13;
            const pad = 0.05;
            const year = parseISO(it.episode.startDate).getFullYear();
            const faded = year < now.getFullYear() ? 0.75 : 1;
            return (
              <motion.path
                key={it.episode.id}
                d={arcPath(c, c, r, mi * seg + pad, (mi + 1) * seg - pad)}
                stroke={catColor[it.category].fg}
                strokeOpacity={faded}
                strokeWidth={9}
                strokeLinecap="round"
                fill="none"
                className="cursor-pointer"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ delay: 0.25 + mi * 0.05 + k * 0.08, duration: 0.6 }}
                onMouseEnter={() => setHover(it.episode)}
                onMouseLeave={() => setHover(null)}
                onClick={() => go({ name: "episode", id: it.episode.id })}
                whileHover={{ strokeWidth: 12 }}
              />
            );
          }),
        )}
        {/* needle */}
        <motion.g
          initial={{ rotate: monthFrac * 360 - 120 }}
          animate={{ rotate: monthFrac * 360 }}
          transition={{ type: "spring", stiffness: 40, damping: 12, delay: 0.3 }}
          style={{ transformOrigin: `${c}px ${c}px`, transformBox: "view-box" }}
        >
          <line x1={c} y1={c} x2={c} y2={c - R - 14} stroke="#11291d" strokeWidth={2} strokeLinecap="round" />
          <circle cx={c} cy={c - R - 14} r={5} fill="#2fa346" stroke="#fff" strokeWidth={2} />
        </motion.g>
        <circle cx={c} cy={c} r={R - 62} fill="#fffdf9" stroke="rgba(17,41,29,.06)" />
              </svg>
      {/* center label */}
      <div
        className="pointer-events-none absolute grid place-items-center text-center"
        style={{ left: c - (R - 66), top: c - (R - 66), width: (R - 66) * 2, height: (R - 66) * 2 }}
      >
        <motion.div key={hover?.id ?? next?.episode.id ?? "none"} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          {hover ? (
            <>
              <div className="text-[0.62rem] font-semibold text-ink-3">
                {categoryLabel[lang][hover.category]} · {parseISO(hover.startDate).getFullYear()}
              </div>
              <div className="font-display text-[0.95rem] font-semibold leading-tight">{hover.title}</div>
            </>
          ) : next ? (
            <>
              <div className="text-[0.62rem] font-semibold text-coral">
                {lang === "hi" ? "आने वाला" : "Coming up"}
              </div>
              <div className="font-display text-[0.98rem] font-semibold leading-tight">{next.episode.title}</div>
              <div className="mt-0.5 font-mono text-[0.7rem] text-ink-3">
                {lang === "hi" ? `~${next.daysUntil} दिन में` : `in ~${next.daysUntil} days`}
              </div>
            </>
          ) : (
            <div className="px-2 text-[0.72rem] text-ink-3">{lang === "hi" ? "आपका मौसम चक्र" : "Your health seasons"}</div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export function useAqi(lat: number, lon: number) {
  const [aqi, setAqi] = useState<{ aqi: number; pm25: number } | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch(
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5&timezone=auto`,
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!cancelled && j?.current?.us_aqi != null) setAqi({ aqi: Math.round(j.current.us_aqi), pm25: Math.round(j.current.pm2_5) });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [lat, lon]);
  return aqi;
}

export function aqiBand(v: number) {
  if (v <= 50) return { label: "Good", hi: "अच्छी", color: "#0f9f7a" };
  if (v <= 100) return { label: "Moderate", hi: "ठीक-ठाक", color: "#d98a04" };
  if (v <= 150) return { label: "Unhealthy for sensitive", hi: "संवेदनशील के लिए ख़राब", color: "#2fa346" };
  if (v <= 200) return { label: "Unhealthy", hi: "ख़राब", color: "#d93d4a" };
  if (v <= 300) return { label: "Very unhealthy", hi: "बहुत ख़राब", color: "#8f3fbf" };
  return { label: "Hazardous", hi: "ख़तरनाक", color: "#7a1f2b" };
}
