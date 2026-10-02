"use client";

import { animate, motion, useInView, useMotionValue, useSpring, useTransform } from "motion/react";
import { useEffect, useId, useRef } from "react";
import {
  Droplet, FlaskConical, Pill, Syringe, Wind, Sparkles, Waves, SprayCan, Package, Tablets, CircleDot,
} from "lucide-react";
import type { Form } from "@/lib/types";
import { cx } from "@/lib/util";

export function Logo({ size = 32, word = true, className = "" }: { size?: number; word?: boolean; className?: string }) {
  const gid = "lg" + useId().replace(/:/g, "");
  return (
    <span className={cx("inline-flex items-center gap-2.5", className)}>
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        initial="rest"
        whileHover="hover"
        aria-hidden
      >
        <defs><linearGradient id={gid} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#3dbb55" /><stop offset="1" stopColor="#12806e" /></linearGradient></defs>
        <rect width="64" height="64" rx="18" fill={`url(#${gid})`} />
        <motion.path d="M33 20 19 32l14 12V20Z" fill="#ffffff" variants={{ rest: { x: 0 }, hover: { x: -3 } }} />
        <motion.path
          d="M47 20 33 32l14 12V20Z"
          fill="#ffffff"
          opacity={0.6}
          variants={{ rest: { x: 0 }, hover: { x: -6 } }}
        />
      </motion.svg>
      {word && (
        <span className="font-display text-[1.35rem] font-bold leading-none tracking-tight text-ink" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.04em" }}>
          rx<span className="text-leaf-deep">wind</span>
        </span>
      )}
    </span>
  );
}

export function Btn({
  children, onClick, variant = "primary", className = "", size = "md", type = "button", disabled, icon,
}: {
  children?: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ink" | "ghost" | "soft" | "outline";
  className?: string;
  size?: "sm" | "md" | "lg";
  type?: "button" | "submit";
  disabled?: boolean;
  icon?: React.ReactNode;
}) {
  const v = {
    primary: "btn-shine overflow-hidden bg-[linear-gradient(135deg,#3dbb55,#1f8a3b)] text-white shadow-[var(--shadow-glow)] hover:brightness-105",
    ink: "bg-ink text-white hover:bg-ink/90 shadow-[var(--shadow-lift)]",
    ghost: "text-ink hover:bg-ink/5",
    soft: "bg-ink/[0.05] text-ink hover:bg-ink/[0.08]",
    outline: "border border-ink/15 text-ink hover:border-ink/30 bg-paper/60",
  }[variant];
  const s = { sm: "h-9 px-3.5 text-sm", md: "h-11 px-5 text-[0.95rem]", lg: "h-14 px-7 text-base" }[size];
  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      whileHover={{ y: -1 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={cx(
        "relative inline-flex select-none items-center justify-center gap-2 rounded-full font-semibold transition-[filter,background-color,border-color] disabled:pointer-events-none disabled:opacity-40",
        v, s, className,
      )}
    >
      {icon}
      {children}
    </motion.button>
  );
}

export function Chip({ children, tone = "ink", className = "" }: { children: React.ReactNode; tone?: "ink" | "coral" | "mint" | "rose" | "amber" | "sky" | "violet"; className?: string }) {
  const t = {
    ink: "bg-ink/[0.06] text-ink-2",
    coral: "bg-coral-soft text-coral",
    mint: "bg-mint-soft text-mint",
    rose: "bg-rose-soft text-rose",
    amber: "bg-amber-soft text-amber",
    sky: "bg-sky-soft text-sky",
    violet: "bg-violet-soft text-violet",
  }[tone];
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", t, className)}>
      {children}
    </span>
  );
}

export function FormIcon({ form, className = "size-4" }: { form: Form; className?: string }) {
  const I =
    {
      tablet: Tablets, capsule: Pill, syrup: FlaskConical, drops: Droplet, cream: Sparkles, inhaler: Wind,
      injection: Syringe, gargle: Waves, spray: SprayCan, powder: Package, other: CircleDot,
    }[form] ?? CircleDot;
  return <I className={className} strokeWidth={2} />;
}

export function CountUp({ to, className = "", duration = 1.2 }: { to: number; className?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v).toString());
  useEffect(() => {
    if (!inView) return;
    const c = animate(mv, to, { duration, ease: [0.16, 1, 0.3, 1] });
    return () => c.stop();
  }, [inView, to, mv, duration]);
  return <motion.span ref={ref} className={className}>{rounded}</motion.span>;
}

export function SectionTitle({ children, kicker, action }: { children: React.ReactNode; kicker?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        {kicker && <div className="mb-1 text-[0.7rem] font-semibold text-ink-3">{kicker}</div>}
        <h2 className="font-display text-xl font-semibold text-ink md:text-[1.4rem]">{children}</h2>
      </div>
      {action}
    </div>
  );
}

export const fadeUp = {
  hidden: { opacity: 0, y: 18, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 220, damping: 26 } },
} as const;

export const stagger = (s = 0.06, d = 0) => ({
  hidden: {},
  show: { transition: { staggerChildren: s, delayChildren: d } },
});

export function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 22, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ type: "spring", stiffness: 180, damping: 24, delay }}
    >
      {children}
    </motion.div>
  );
}

export function ConfidenceDot({ c }: { c: number }) {
  const tone = c >= 0.85 ? "bg-mint" : c >= 0.65 ? "bg-amber" : "bg-rose";
  return (
    <span className="relative inline-flex size-2.5">
      {c < 0.65 && <span className={cx("absolute inset-0 animate-ping rounded-full opacity-60", tone)} />}
      <span className={cx("relative inline-flex size-2.5 rounded-full", tone)} />
    </span>
  );
}

/** Card that tilts toward the cursor and shows a spotlight border. */
export function TiltCard({ children, className = "", onClick, max = 6 }: { children: React.ReactNode; className?: string; onClick?: () => void; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 200, damping: 20 });
  const sry = useSpring(ry, { stiffness: 200, damping: 20 });
  return (
    <motion.div
      ref={ref}
      onClick={onClick}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return;
        const r = ref.current!.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        ry.set((px - 0.5) * max * 2);
        rx.set(-(py - 0.5) * max * 2);
        ref.current!.style.setProperty("--mx", `${px * 100}%`);
        ref.current!.style.setProperty("--my", `${py * 100}%`);
      }}
      onPointerLeave={() => {
        rx.set(0);
        ry.set(0);
      }}
      style={{ rotateX: srx, rotateY: sry, transformPerspective: 900 }}
      className={cx("spotlight", className)}
    >
      {children}
    </motion.div>
  );
}

/** Small celebratory particle burst. */
export function Burst({ show }: { show: boolean }) {
  const parts = Array.from({ length: 14 }, (_, i) => i);
  if (!show) return null;
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
      {parts.map((i) => {
        const a = (i / parts.length) * Math.PI * 2;
        const d = 40 + (i % 3) * 18;
        return (
          <motion.span
            key={i}
            className="absolute size-1.5 rounded-full"
            style={{ background: ["#37b24d", "#f2a03d", "#129b8a", "#6d4cf0"][i % 4] }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: Math.cos(a) * d, y: Math.sin(a) * d, opacity: 0, scale: 0.4 }}
            transition={{ duration: 0.8, ease: [0.2, 0.8, 0.3, 1] }}
          />
        );
      })}
    </span>
  );
}
