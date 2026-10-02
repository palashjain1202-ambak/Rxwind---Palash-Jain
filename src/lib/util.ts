import type { Slot } from "./types";

export const uid = () => Math.random().toString(36).slice(2, 10);

export const iso = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const parseISO = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

export const addDays = (s: string, n: number) => {
  const d = parseISO(s);
  d.setDate(d.getDate() + n);
  return iso(d);
};

export const daysBetween = (a: string, b: string) =>
  Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / 86400000);

export const todayISO = () => iso(new Date());

/** "1-0-1" style → slots. Supports 3-part (M-A-N) and 4-part (M-A-E-N). */
export function slotsFromCode(code: string): Record<Slot, boolean> {
  const s = { morning: false, afternoon: false, evening: false, night: false };
  const c = code.trim().toUpperCase();
  const parts = c.split(/[-–]/).map((p) => p.trim());
  if (parts.length === 3 && parts.every((p) => /^[0-9½.]+$/.test(p))) {
    s.morning = parts[0] !== "0";
    s.afternoon = parts[1] !== "0";
    s.night = parts[2] !== "0";
    return s;
  }
  if (parts.length === 4 && parts.every((p) => /^[0-9½.]+$/.test(p))) {
    s.morning = parts[0] !== "0";
    s.afternoon = parts[1] !== "0";
    s.evening = parts[2] !== "0";
    s.night = parts[3] !== "0";
    return s;
  }
  if (/\b(OD|QD|ONCE)\b/.test(c)) s.morning = true;
  else if (/\b(BD|BID|TWICE)\b/.test(c)) (s.morning = true), (s.night = true);
  else if (/\b(TDS|TID|THRICE)\b/.test(c)) (s.morning = true), (s.afternoon = true), (s.night = true);
  else if (/\b(QID|QDS)\b/.test(c)) (s.morning = true), (s.afternoon = true), (s.evening = true), (s.night = true);
  else if (/\b(HS|BEDTIME)\b/.test(c)) s.night = true;
  return s;
}

export const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(" ");

export function greetingKey(): "goodMorning" | "goodAfternoon" | "goodEvening" {
  const h = new Date().getHours();
  return h < 12 ? "goodMorning" : h < 17 ? "goodAfternoon" : "goodEvening";
}
