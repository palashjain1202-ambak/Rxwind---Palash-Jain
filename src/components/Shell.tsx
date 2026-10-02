"use client";

import { AnimatePresence, motion } from "motion/react";
import { FileText, History, House, Languages, Lock, RotateCcw, ScanLine } from "lucide-react";
import { useMemory, type Route } from "@/lib/store";
import { cx } from "@/lib/util";
import { Logo } from "./ui";

const NAV: { key: Route["name"]; icon: typeof House; label: "home" | "rewind" | "scan" | "brief" }[] = [
  { key: "home", icon: House, label: "home" },
  { key: "rewind", icon: History, label: "rewind" },
  { key: "scan", icon: ScanLine, label: "scan" },
  { key: "brief", icon: FileText, label: "brief" },
];

export function LangToggle({ compact = false }: { compact?: boolean }) {
  const { lang, setLang, t } = useMemory();
  return (
    <button
      onClick={() => setLang(lang === "en" ? "hi" : "en")}
      className={cx(
        "group relative inline-flex items-center gap-1.5 overflow-hidden rounded-full border border-ink/10 bg-paper/70 font-semibold text-ink transition hover:border-ink/25",
        compact ? "h-9 px-3 text-sm" : "h-10 px-4 text-sm",
      )}
      aria-label="Switch language"
    >
      <Languages className="size-4 text-coral" />
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={lang}
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -12, opacity: 0 }}
          transition={{ duration: 0.18 }}
          style={{ fontFamily: lang === "en" ? "Mukta" : undefined }}
        >
          {t("language")}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

export function MemberSwitch({ vertical = false }: { vertical?: boolean }) {
  const { state, setMember, lang } = useMemory();
  if (state.members.length < 2) return null;
  return (
    <div className={cx("relative flex gap-1 rounded-full bg-ink/[0.05] p-1", vertical && "w-full")}>
      {state.members.map((m) => {
        const on = m.id === state.activeMemberId;
        return (
          <button
            key={m.id}
            onClick={() => setMember(m.id)}
            className={cx(
              "relative z-10 flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors",
              on ? "text-ink" : "text-ink-3 hover:text-ink-2",
            )}
          >
            {on && (
              <motion.span
                layoutId={vertical ? "member-pill-v" : "member-pill"}
                className="absolute inset-0 -z-10 rounded-full bg-paper shadow-[var(--shadow-soft)]"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
            <span
              className="grid size-6 place-items-center rounded-full text-[0.7rem] font-bold text-white"
              style={{ background: m.tint }}
            >
              {m.name[0]}
            </span>
            <span className="truncate">{m.relation[lang] === "You" || m.relation[lang] === "आप" ? m.name : m.relation[lang]}</span>
          </button>
        );
      })}
    </div>
  );
}

function DemoCard() {
  const { state, t, resetDemo, startMine } = useMemory();
  if (state.mode !== "demo") return null;
  return (
    <div className="rounded-2xl border border-dashed border-ink/15 p-4">
      <div className="text-xs font-semibold text-coral">Demo</div>
      <p className="mt-1 text-sm text-ink-2">{t("demoBanner")}</p>
      <div className="mt-3 flex gap-2">
        <button onClick={startMine} className="rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-white">
          {t("switchToMine")}
        </button>
        <button onClick={resetDemo} className="inline-flex items-center gap-1 rounded-full px-2 py-1.5 text-xs font-semibold text-ink-3 hover:text-ink">
          <RotateCcw className="size-3" /> {t("resetDemo")}
        </button>
      </div>
    </div>
  );
}

export function Shell({ children, routeKey }: { children: React.ReactNode; routeKey: string }) {
  const { route, go, t, state } = useMemory();
  const active = route.name === "episode" ? "rewind" : route.name;

  return (
    <div className="relative min-h-dvh">
      <Ambient />
      {/* Desktop sidebar */}
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col border-r border-ink/[0.06] bg-paper/50 px-5 py-6 backdrop-blur-xl lg:flex">
        <button onClick={() => go({ name: "landing" })} className="mb-9 self-start">
          <Logo />
        </button>
        <nav className="flex flex-col gap-1">
          {NAV.map((n) => {
            const on = active === n.key;
            const Icon = n.icon;
            return (
              <button
                key={n.key}
                onClick={() => go({ name: n.key } as Route)}
                className={cx(
                  "relative flex h-11 items-center gap-3 rounded-xl px-3.5 text-[0.95rem] font-semibold transition-colors",
                  on ? "text-ink" : "text-ink-3 hover:text-ink",
                )}
              >
                {on && (
                  <motion.span
                    layoutId="side-active"
                    className="absolute inset-0 rounded-xl bg-paper shadow-[var(--shadow-soft)]"
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                  />
                )}
                <Icon className={cx("relative size-[18px]", on && n.key === "scan" ? "text-coral" : "")} strokeWidth={2.2} />
                <span className="relative">{t(n.label)}</span>
                {n.key === "scan" && (
                  <span className="relative ml-auto rounded-full bg-coral px-2 py-0.5 text-[0.65rem] font-bold text-white">AI</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="mt-8">
          <div className="mb-2 px-1 text-[0.7rem] font-semibold text-ink-3">{t("family")}</div>
          {state.members.length > 1 ? <MemberSwitch vertical /> : null}
        </div>

        <div className="mt-auto flex flex-col gap-4">
          <DemoCard />
          <div className="flex items-center justify-between">
            <LangToggle compact />
            <span className="inline-flex items-center gap-1 text-[0.7rem] text-ink-3">
              <Lock className="size-3" /> {t("privacy")}
            </span>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="no-print sticky top-0 z-30 flex items-center justify-between gap-3 bg-canvas/75 px-4 pb-2 pt-[max(env(safe-area-inset-top),12px)] backdrop-blur-xl lg:hidden">
        <button onClick={() => go({ name: "landing" })}>
          <Logo size={28} />
        </button>
        <LangToggle compact />
      </header>

      <main className="relative z-10 lg:pl-[264px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={routeKey}
            initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto w-full max-w-[1240px] px-4 pb-36 pt-3 md:px-8 lg:px-10 lg:pb-16 lg:pt-10"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile tab bar */}
      <nav className="no-print fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(env(safe-area-inset-bottom),12px)] lg:hidden">
        <div className="glass mx-auto flex h-[68px] max-w-md items-center justify-around rounded-[26px] px-2">
          {NAV.map((n) => {
            const on = active === n.key;
            const Icon = n.icon;
            if (n.key === "scan")
              return (
                <motion.button
                  key={n.key}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => go({ name: "scan" })}
                  className="pulse-ring relative -mt-9 grid size-[62px] place-items-center rounded-full bg-coral text-white shadow-[var(--shadow-glow)]"
                  aria-label={t("scan")}
                >
                  <ScanLine className="size-7" strokeWidth={2.2} />
                </motion.button>
              );
            return (
              <button
                key={n.key}
                onClick={() => go({ name: n.key } as Route)}
                className={cx("relative flex w-16 flex-col items-center gap-1 py-1 text-[0.68rem] font-semibold", on ? "text-ink" : "text-ink-3")}
              >
                <Icon className="size-[22px]" strokeWidth={on ? 2.4 : 2} />
                {t(n.label)}
                {on && (
                  <motion.span layoutId="tab-dot" className="absolute -bottom-1 size-1 rounded-full bg-coral" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

const FLOATERS = [
  { x: 6, y: 18, s: 26, r: -20, d: 14, k: "pill" },
  { x: 88, y: 12, s: 18, r: 35, d: 17, k: "leaf" },
  { x: 72, y: 62, s: 30, r: 60, d: 19, k: "pill" },
  { x: 14, y: 74, s: 20, r: 10, d: 16, k: "drop" },
  { x: 46, y: 30, s: 14, r: -40, d: 21, k: "leaf" },
  { x: 94, y: 84, s: 22, r: -10, d: 18, k: "drop" },
  { x: 30, y: 92, s: 16, r: 50, d: 15, k: "pill" },
  { x: 60, y: 8, s: 12, r: 0, d: 20, k: "drop" },
];

function Floater({ k, size }: { k: string; size: number }) {
  if (k === "pill")
    return (
      <svg width={size * 2} height={size} viewBox="0 0 40 20">
        <rect x="1" y="1" width="38" height="18" rx="9" fill="#fff" stroke="#37b24d" strokeOpacity=".35" />
        <path d="M20 1h10a9 9 0 0 1 0 18H20z" fill="#37b24d" fillOpacity=".28" />
      </svg>
    );
  if (k === "leaf")
    return (
      <svg width={size} height={size} viewBox="0 0 24 24">
        <path d="M4 20C4 9 11 4 20 4c0 9-5 16-16 16Z" fill="#37b24d" fillOpacity=".22" />
        <path d="M4 20 14 10" stroke="#1f7a36" strokeOpacity=".3" strokeWidth="1.4" />
      </svg>
    );
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M12 3s7 7.5 7 12a7 7 0 0 1-14 0c0-4.5 7-12 7-12Z" fill="#129b8a" fillOpacity=".18" />
    </svg>
  );
}

export function Ambient() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <motion.div
        className="absolute -left-40 -top-40 size-[620px] rounded-full opacity-60 blur-[90px]"
        style={{ background: "radial-gradient(circle, #c7ecce 0%, transparent 70%)" }}
        animate={{ x: [0, 80, -20, 0], y: [0, 50, 90, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-40 top-1/4 size-[560px] rounded-full opacity-50 blur-[100px]"
        style={{ background: "radial-gradient(circle, #bfe9e1 0%, transparent 70%)" }}
        animate={{ x: [0, -70, 10, 0], y: [0, -40, 50, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-220px] left-1/3 size-[520px] rounded-full opacity-45 blur-[110px]"
        style={{ background: "radial-gradient(circle, #ffe2b8 0%, transparent 70%)" }}
        animate={{ x: [0, 60, -50, 0], y: [0, -30, 0, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
      />
      {FLOATERS.map((f, i) => (
        <div
          key={i}
          className="floaty absolute"
          style={
            {
              left: `${f.x}%`,
              top: `${f.y}%`,
              "--dur": `${f.d}s`,
              "--dx": `${i % 2 ? 24 : -24}px`,
              "--r0": `${f.r}deg`,
              "--r1": `${f.r + 40}deg`,
              animationDelay: `${-i * 2.3}s`,
            } as React.CSSProperties
          }
        >
          <Floater k={f.k} size={f.s} />
        </div>
      ))}
    </div>
  );
}
