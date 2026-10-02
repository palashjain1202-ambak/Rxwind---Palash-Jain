import type { Category, Episode, Medicine, Member, MemoryState, Slot } from "./types";
import { addDays, daysBetween, parseISO, todayISO } from "./util";

export const catColor: Record<Category, { fg: string; bg: string }> = {
  eye: { fg: "#2f6fe4", bg: "#dde8fc" },
  respiratory: { fg: "#6d4cf0", bg: "#e7e1fd" },
  skin: { fg: "#d98a04", bg: "#fbedd0" },
  infection: { fg: "#e8613c", bg: "#fde5dc" },
  digestive: { fg: "#0f9f7a", bg: "#d9f3ea" },
  fever: { fg: "#d93d4a", bg: "#fbe0e2" },
  pain: { fg: "#a35c2e", bg: "#f6e5d8" },
  chronic: { fg: "#3a4757", bg: "#e4e7ec" },
  other: { fg: "#6b7685", bg: "#eceef1" },
};

export const memberEpisodes = (s: MemoryState, memberId: string) =>
  s.episodes.filter((e) => e.memberId === memberId).sort((a, b) => b.startDate.localeCompare(a.startDate));

export const episodeMeds = (e: Episode) => e.prescriptions.flatMap((p) => p.medicines);

export const episodeDays = (e: Episode) =>
  daysBetween(e.startDate, e.endDate ?? todayISO()) + 1;

export const doctorsOf = (eps: Episode[]) =>
  Array.from(new Set(eps.flatMap((e) => e.prescriptions.map((p) => p.doctor))));

/** Medicines that should be taken today (non-SOS, within course window). */
export function todaysMeds(s: MemoryState, memberId: string, today = todayISO()) {
  const out: { med: Medicine; ep: Episode; dayIndex: number; totalDays: number | null }[] = [];
  for (const ep of s.episodes) {
    if (ep.memberId !== memberId || ep.status === "resolved") continue;
    // latest prescription wins for same generic
    const seen = new Set<string>();
    const rxs = [...ep.prescriptions].sort((a, b) => b.date.localeCompare(a.date));
    for (const rx of rxs) {
      for (const m of rx.medicines) {
        const key = (m.generic || m.name).toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        const dayIndex = daysBetween(rx.date, today) + 1;
        if (dayIndex < 1) continue;
        if (m.durationDays && dayIndex > m.durationDays) continue;
        out.push({ med: m, ep, dayIndex, totalDays: m.durationDays ?? null });
      }
    }
  }
  return out;
}

export function slotItems(items: ReturnType<typeof todaysMeds>, slot: Slot) {
  return items.filter((i) => !i.med.sos && i.med.slots[slot]);
}

export interface Pattern {
  category: Category;
  title: string;
  episodes: Episode[];
  months: number[];
  helped: Medicine[];
  failed: Medicine[];
}

const monthDist = (a: number, b: number) => Math.min(Math.abs(a - b), 12 - Math.abs(a - b));

export function recurringPatterns(eps: Episode[]): Pattern[] {
  const byCat = new Map<Category, Episode[]>();
  for (const e of eps) {
    if (e.category === "chronic") continue;
    byCat.set(e.category, [...(byCat.get(e.category) ?? []), e]);
  }
  const out: Pattern[] = [];
  for (const [category, list] of byCat) {
    if (list.length < 2) continue;
    const months = list.map((e) => parseISO(e.startDate).getMonth());
    const clustered = months.some((m, i) => months.some((n, j) => i !== j && monthDist(m, n) <= 1));
    if (!clustered) continue;
    const meds = list.flatMap(episodeMeds);
    out.push({
      category,
      title: list[0].title,
      episodes: list.sort((a, b) => a.startDate.localeCompare(b.startDate)),
      months,
      helped: uniqBy(meds.filter((m) => m.verdict === "helped"), (m) => m.generic || m.name),
      failed: uniqBy(meds.filter((m) => m.verdict === "no-change" || m.verdict === "side-effect"), (m) => m.generic || m.name),
    });
  }
  return out;
}

export function uniqBy<T>(arr: T[], key: (t: T) => string) {
  const m = new Map<string, T>();
  for (const a of arr) if (!m.has(key(a).toLowerCase())) m.set(key(a).toLowerCase(), a);
  return [...m.values()];
}

export function medLedger(eps: Episode[]) {
  const meds = eps.flatMap(episodeMeds);
  const helped = uniqBy(meds.filter((m) => m.verdict === "helped"), (m) => m.generic || m.name);
  const failed = uniqBy(meds.filter((m) => m.verdict === "no-change"), (m) => m.generic || m.name);
  const side = uniqBy(meds.filter((m) => m.verdict === "side-effect" || (m.sideEffects?.length ?? 0) > 0), (m) => m.generic || m.name);
  return { helped, failed, side };
}

export interface Upcoming {
  episode: Episode;
  daysUntil: number;
  anniversary: string;
}

/** Past (resolved) episodes whose anniversary falls within the next `windowDays`. */
export function upcomingRisks(eps: Episode[], windowDays = 75, today = todayISO()): Upcoming[] {
  const t = parseISO(today);
  const out: Upcoming[] = [];
  for (const e of eps) {
    if (e.status !== "resolved" || e.category === "chronic") continue;
    const s = parseISO(e.startDate);
    const ann = new Date(t.getFullYear(), s.getMonth(), s.getDate());
    if (ann < t) ann.setFullYear(t.getFullYear() + 1);
    const days = Math.round((ann.getTime() - t.getTime()) / 86400000);
    if (days <= windowDays && daysBetween(e.startDate, today) > 200) {
      out.push({ episode: e, daysUntil: days, anniversary: ann.toISOString().slice(0, 10) });
    }
  }
  // collapse same category (keep nearest)
  const best = new Map<string, Upcoming>();
  for (const u of out.sort((a, b) => a.daysUntil - b.daysUntil)) {
    const k = u.episode.category;
    if (!best.has(k)) best.set(k, u);
  }
  return [...best.values()];
}

const ALLERGY_MAP: Record<string, string[]> = {
  penicillin: ["amoxicillin", "amoxycillin", "augmentin", "amoxiclav", "clavulanic", "ampicillin", "cloxacillin", "penicillin", "mox "],
  sulfa: ["sulfamethoxazole", "cotrimoxazole", "septran", "bactrim", "sulfa"],
  nsaid: ["ibuprofen", "diclofenac", "aceclofenac", "naproxen", "aspirin", "ketorolac", "nimesulide", "mefenamic"],
  aspirin: ["aspirin", "ecosprin", "disprin"],
  cephalosporin: ["cefixime", "cefuroxime", "ceftriaxone", "cefpodoxime", "cephalexin"],
};

export function allergyHits(m: Pick<Medicine, "name" | "generic">, member?: Member) {
  if (!member?.allergies.length) return [];
  const hay = `${m.name} ${m.generic ?? ""}`.toLowerCase();
  const hits: string[] = [];
  for (const a of member.allergies) {
    const key = a.toLowerCase();
    const words = ALLERGY_MAP[key] ?? ALLERGY_MAP[Object.keys(ALLERGY_MAP).find((k) => key.includes(k)) ?? ""] ?? [key];
    if (words.some((w) => hay.includes(w))) hits.push(a);
  }
  return hits;
}

/** Same active ingredient prescribed in two different places that are both current. */
export function duplicateHits(
  m: Pick<Medicine, "name" | "generic">,
  current: { med: Medicine; ep: Episode }[],
) {
  const parts = (s: string) =>
    s
      .toLowerCase()
      .split(/\+|,| and /)
      .map((x) => x.replace(/[^a-z]/g, "").trim())
      .filter((x) => x.length > 4);
  const mine = parts(m.generic || m.name);
  return current.filter((c) => parts(c.med.generic || c.med.name).some((p) => mine.includes(p)));
}

export function seasonWheel(eps: Episode[]) {
  const months: { category: Category; episode: Episode }[][] = Array.from({ length: 12 }, () => []);
  for (const e of eps) {
    if (e.category === "chronic") continue;
    months[parseISO(e.startDate).getMonth()].push({ category: e.category, episode: e });
  }
  return months;
}

export function stats(eps: Episode[]) {
  return {
    episodes: eps.length,
    doctors: doctorsOf(eps).length,
    medicines: uniqBy(eps.flatMap(episodeMeds), (m) => m.generic || m.name).length,
  };
}

export function feelingSeries(e: Episode) {
  return e.checkIns
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((c) => ({ day: daysBetween(e.startDate, c.date) + 1, feeling: c.feeling, date: c.date }));
}

export const nextDays = (start: string, n: number) => Array.from({ length: n }, (_, i) => addDays(start, i));
