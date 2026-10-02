"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { CheckIn, Episode, Lang, Medicine, MemoryState, Prescription, ScanResult, Slot, Verdict } from "./types";
import { buildDemo, emptyState } from "./demo";
import { tr, type TKey } from "./i18n";
import { daysBetween, todayISO, uid } from "./util";

const KEY = "rxwind:v3";
const LANG_KEY = "rxwind:lang";

export type Route =
  | { name: "landing" }
  | { name: "home" }
  | { name: "scan" }
  | { name: "rewind" }
  | { name: "brief"; episodeId?: string }
  | { name: "episode"; id: string };

function parseHash(h: string): Route {
  const p = h.replace(/^#\/?/, "").split("/");
  switch (p[0]) {
    case "home":
      return { name: "home" };
    case "scan":
      return { name: "scan" };
    case "rewind":
      return { name: "rewind" };
    case "brief":
      return { name: "brief", episodeId: p[1] };
    case "episode":
      return p[1] ? { name: "episode", id: p[1] } : { name: "home" };
    default:
      return { name: "landing" };
  }
}

export const routeHash = (r: Route) =>
  r.name === "landing"
    ? "#/"
    : r.name === "episode"
      ? `#/episode/${r.id}`
      : r.name === "brief" && r.episodeId
        ? `#/brief/${r.episodeId}`
        : `#/${r.name}`;

interface Ctx {
  ready: boolean;
  state: MemoryState;
  lang: Lang;
  t: (k: TKey, v?: Record<string, string | number>) => string;
  route: Route;
  go: (r: Route) => void;
  back: () => void;
  setLang: (l: Lang) => void;
  setMember: (id: string) => void;
  toggleDose: (epId: string, medId: string, slot: Slot, date?: string) => void;
  addCheckIn: (epId: string, c: CheckIn) => void;
  setVerdict: (epId: string, medId: string, v: Verdict) => void;
  savePrescription: (scan: ScanResult, opts: { memberId: string; episodeId: string | "new"; thumb?: string; meds: Medicine[] }) => string;
  startDemo: () => void;
  startMine: () => void;
  resetDemo: () => void;
  resolveEpisode: (epId: string) => void;
}

const C = createContext<Ctx | null>(null);

export function MemoryProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MemoryState>(() => buildDemo());
  const [lang, setLangState] = useState<Lang>("en");
  const [route, setRoute] = useState<Route>({ name: "landing" });
  const [ready, setReady] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as MemoryState;
        if (parsed?.version === 3) setState(parsed.mode === "demo" ? refreshDemo(parsed) : parsed);
      }
      const l = localStorage.getItem(LANG_KEY);
      if (l === "hi" || l === "en") setLangState(l);
    } catch {}
    setRoute(parseHash(window.location.hash));
    const onHash = () => setRoute(parseHash(window.location.hash));
    window.addEventListener("hashchange", onHash);
    hydrated.current = true;
    setReady(true);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {}
  }, [lang]);

  const go = useCallback((r: Route) => {
    const h = routeHash(r);
    if (window.location.hash !== h) window.location.hash = h;
    else setRoute(r);
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, []);

  const back = useCallback(() => {
    if (window.history.length > 1) window.history.back();
    else go({ name: "home" });
  }, [go]);

  const mutateEp = useCallback((epId: string, f: (e: Episode) => Episode) => {
    setState((s) => ({ ...s, episodes: s.episodes.map((e) => (e.id === epId ? f(e) : e)) }));
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      ready,
      state,
      lang,
      t: (k, v) => tr(lang, k, v),
      route,
      go,
      back,
      setLang: setLangState,
      setMember: (id) => setState((s) => ({ ...s, activeMemberId: id })),
      toggleDose: (epId, medId, slot, date = todayISO()) =>
        mutateEp(epId, (e) => {
          const doses = { ...(e.doses ?? {}) };
          const day = { ...(doses[date] ?? {}) };
          const k = `${medId}:${slot}`;
          day[k] = !day[k];
          doses[date] = day;
          return { ...e, doses };
        }),
      addCheckIn: (epId, c) =>
        mutateEp(epId, (e) => ({ ...e, checkIns: [...e.checkIns.filter((x) => x.date !== c.date), c] })),
      setVerdict: (epId, medId, v) =>
        mutateEp(epId, (e) => ({
          ...e,
          prescriptions: e.prescriptions.map((p) => ({
            ...p,
            medicines: p.medicines.map((m) => (m.id === medId ? { ...m, verdict: v } : m)),
          })),
        })),
      savePrescription: (scan, { memberId, episodeId, thumb, meds }) => {
        const rx: Prescription = {
          id: uid(),
          doctor: scan.doctor || "Doctor",
          specialty: scan.specialty,
          clinic: scan.clinic,
          date: scan.date && /^\d{4}-\d{2}-\d{2}$/.test(scan.date) ? scan.date : todayISO(),
          diagnosis: scan.diagnosis,
          medicines: meds,
          advice: scan.advice,
          followUp: scan.followUp ?? null,
          thumb,
          source: "scan",
        };
        const newId = "ep-" + uid();
        const targetId = episodeId === "new" ? newId : episodeId;
        setState((s) => {
          if (episodeId !== "new" && s.episodes.some((e) => e.id === episodeId)) {
            return {
              ...s,
              episodes: s.episodes.map((e) =>
                e.id === episodeId
                  ? { ...e, prescriptions: [...e.prescriptions, rx], startDate: rx.date < e.startDate ? rx.date : e.startDate }
                  : e,
              ),
            };
          }
          const maxDays = Math.max(0, ...meds.map((m) => m.durationDays ?? 0));
          const isChronic = scan.category === "chronic" || meds.some((m) => m.durationDays === null && !m.sos && scan.category === "chronic");
          const age = daysBetween(rx.date, todayISO());
          const status: Episode["status"] = isChronic ? "ongoing" : age <= Math.max(maxDays, 7) ? "active" : "resolved";
          const ep: Episode = {
            id: newId,
            memberId,
            title: scan.episodeTitle?.[lang] || scan.episodeTitle?.en || scan.diagnosis || "Episode",
            category: scan.category ?? "other",
            startDate: rx.date,
            endDate: status === "resolved" ? rx.date.slice(0, 10) : null,
            status,
            city: s.city.name,
            prescriptions: [rx],
            checkIns: [],
            outcome: null,
          };
          if (status === "resolved" && maxDays) {
            const d = new Date(rx.date);
            d.setDate(d.getDate() + maxDays);
            ep.endDate = d.toISOString().slice(0, 10);
          }
          return { ...s, episodes: [...s.episodes, ep] };
        });
        return targetId;
      },
      startDemo: () => {
        setState((s) => (s.mode === "demo" ? s : buildDemo()));
        go({ name: "home" });
      },
      startMine: () => {
        setState((s) => (s.mode === "mine" ? s : emptyState()));
        go({ name: "scan" });
      },
      resetDemo: () => {
        setState(buildDemo());
        go({ name: "home" });
      },
      resolveEpisode: (epId) =>
        mutateEp(epId, (e) => ({ ...e, status: "resolved", endDate: todayISO() })),
    }),
    [ready, state, lang, route, go, back, mutateEp],
  );

  return <C.Provider value={value}>{children}</C.Provider>;
}

/** Keep the demo's active episode anchored to "now" across days. */
function refreshDemo(saved: MemoryState): MemoryState {
  const active = saved.episodes.find((e) => e.id === "ep-throat-active");
  if (!active) return buildDemo();
  const age = daysBetween(active.startDate, todayISO());
  if (age >= 0 && age <= 4) return saved;
  return buildDemo();
}

export function useMemory() {
  const v = useContext(C);
  if (!v) throw new Error("useMemory outside provider");
  return v;
}
