"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarPlus, Download, ExternalLink, X } from "lucide-react";
import { useMemory } from "@/lib/store";
import { todaysMeds } from "@/lib/insights";
import { buildSlotEvents, downloadICS, googleCalendarUrl } from "@/lib/calendar";
import { slotLabel } from "@/lib/i18n";
import { cx } from "@/lib/util";

export function CalendarButton({ memberId, className = "" }: { memberId: string; className?: string }) {
  const { state, lang } = useMemory();
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const member = state.members.find((m) => m.id === memberId);
  const items = todaysMeds(state, memberId);
  const events = buildSlotEvents(items, lang, member && member.relation.en !== "You" ? member.name : undefined);
  if (!events.length) return null;

  const hi = lang === "hi";
  return (
    <div className={cx("relative", className)}>
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-full border border-leaf/30 bg-paper px-3.5 py-2 text-sm font-semibold text-leaf-deep shadow-sm transition hover:border-leaf/60"
      >
        <CalendarPlus className="size-4" />
        {hi ? "कैलेंडर में रिमाइंडर जोड़ें" : "Add reminders to calendar"}
      </motion.button>
      {mounted &&
        createPortal(
      <AnimatePresence>
        {open && (
          <motion.div
            key="cal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/30 p-3 backdrop-blur-sm sm:items-center"
          >
          <motion.div
            onClick={(ev) => ev.stopPropagation()}
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
            className="w-full max-w-[400px] rounded-[28px] border border-ink/[0.08] bg-paper p-5 pb-[max(env(safe-area-inset-bottom),20px)] shadow-[var(--shadow-lift)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-display text-base font-semibold">{hi ? "रोज़ के रिमाइंडर" : "Daily reminders"}</div>
                <p className="mt-0.5 text-xs text-ink-3">
                  {hi
                    ? "हर समय के लिए एक। कोर्स ख़त्म होते ही बंद।"
                    : "One per time slot. Stops when the course ends."}
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="grid size-8 place-items-center rounded-full hover:bg-ink/5" aria-label="Close">
                <X className="size-4" />
              </button>
            </div>
            <button
              onClick={() => {
                downloadICS(events);
                setDone(true);
              }}
              className="mt-3 flex w-full items-center gap-3 rounded-2xl bg-[linear-gradient(135deg,#3dbb55,#1f8a3b)] p-3 text-left text-white"
            >
              <Download className="size-5 shrink-0" />
              <span>
                <span className="block text-sm font-semibold">{hi ? "फ़ोन / Apple / Outlook कैलेंडर" : "Phone, Apple or Outlook calendar"}</span>
                <span className="block text-xs text-white/80">
                  {done ? (hi ? "फ़ाइल डाउनलोड हुई, उसे खोलें" : "Downloaded. Open the file to add it.") : hi ? "एक फ़ाइल में सारे रिमाइंडर" : "All reminders in one file"}
                </span>
              </span>
            </button>
            <div className="mt-3 text-xs font-semibold text-ink-3">Google Calendar</div>
            <div className="mt-1.5 flex flex-col gap-1.5">
              {events.map((e) => (
                <a
                  key={e.slot}
                  href={googleCalendarUrl(e)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-3 rounded-2xl border border-ink/[0.07] px-3 py-2.5 text-sm hover:border-leaf/40"
                >
                  <span className="min-w-0">
                    <span className="font-semibold">
                      {slotLabel[lang][e.slot].name} · {slotLabel[lang][e.slot].time}
                    </span>
                    <span className="block truncate text-xs text-ink-3">{e.title.split(": ").slice(1).join(": ")}</span>
                  </span>
                  <ExternalLink className="size-4 shrink-0 text-ink-3" />
                </a>
              ))}
            </div>
          </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}
