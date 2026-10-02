import type { Episode, Lang, Medicine, Slot } from "./types";
import { SLOTS } from "./types";
import { foodLabel } from "./i18n";
import { todayISO } from "./util";

const SLOT_TIME: Record<Slot, [number, number]> = {
  morning: [8, 0],
  afternoon: [14, 0],
  evening: [18, 0],
  night: [22, 0],
};
const SLOT_NAME: Record<Lang, Record<Slot, string>> = {
  en: { morning: "Morning", afternoon: "Afternoon", evening: "Evening", night: "Night" },
  hi: { morning: "सुबह", afternoon: "दोपहर", evening: "शाम", night: "रात" },
};

export interface SlotEvent {
  slot: Slot;
  title: string;
  details: string;
  start: string; // yyyymmddThhmmss (local, floating)
  end: string;
  days: number; // how many daily repeats
}

const stamp = (isoDate: string, h: number, m: number) =>
  `${isoDate.replace(/-/g, "")}T${String(h).padStart(2, "0")}${String(m).padStart(2, "0")}00`;

/** One daily recurring event per time of day, listing every medicine due then. */
export function buildSlotEvents(
  items: { med: Medicine; ep: Episode; dayIndex: number; totalDays: number | null }[],
  lang: Lang,
  personName?: string,
): SlotEvent[] {
  const today = todayISO();
  const out: SlotEvent[] = [];
  for (const slot of SLOTS) {
    const due = items.filter((i) => !i.med.sos && i.med.slots[slot]);
    if (!due.length) continue;
    // ongoing meds (no duration) get 30 days of reminders
    const days = Math.max(...due.map((i) => (i.totalDays ? Math.max(1, i.totalDays - i.dayIndex + 1) : 30)));
    const [h, m] = SLOT_TIME[slot];
    const names = due.map((i) => i.med.name).join(", ");
    const lines = due.map((i) => {
      const left = i.totalDays ? i.totalDays - i.dayIndex + 1 : null;
      const until = left ? (lang === "hi" ? ` (${left} दिन और)` : ` (${left} more day${left > 1 ? "s" : ""})`) : "";
      return `• ${i.med.name}: ${i.med.dose}, ${foodLabel[lang][i.med.food]}${until}`;
    });
    out.push({
      slot,
      title: `${lang === "hi" ? "दवा लें" : "Take"}${personName ? ` (${personName})` : ""}: ${names}`,
      details: `${SLOT_NAME[lang][slot]}\n${lines.join("\n")}\n\nRxwind`,
      start: stamp(today, h, m),
      end: stamp(today, h, m + 15),
      days,
    });
  }
  return out;
}

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

export function toICS(events: SlotEvent[]) {
  const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Rxwind//Dose reminders//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
  events.forEach((e, i) => {
    lines.push(
      "BEGIN:VEVENT",
      `UID:rxwind-${e.slot}-${e.start}-${i}@rxwind.app`,
      `DTSTAMP:${now}`,
      `DTSTART:${e.start}`,
      `DTEND:${e.end}`,
      `RRULE:FREQ=DAILY;COUNT=${e.days}`,
      `SUMMARY:${esc(e.title)}`,
      `DESCRIPTION:${esc(e.details)}`,
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${esc(e.title)}`,
      "TRIGGER:PT0M",
      "END:VALARM",
      "END:VEVENT",
    );
  });
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadICS(events: SlotEvent[], filename = "rxwind-reminders.ics") {
  const blob = new Blob([toICS(events)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function googleCalendarUrl(e: SlotEvent) {
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    details: e.details,
    dates: `${e.start}/${e.end}`,
    recur: `RRULE:FREQ=DAILY;COUNT=${e.days}`,
    ctz: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata",
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

