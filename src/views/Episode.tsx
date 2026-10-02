"use client";

import { motion } from "motion/react";
import { ArrowLeft, CalendarDays, CircleCheckBig, FileText, MapPin, Stethoscope } from "lucide-react";
import { useMemory } from "@/lib/store";
import { catColor, episodeDays } from "@/lib/insights";
import { categoryLabel, foodLabel, monthsShort, slotLabel, verdictLabel } from "@/lib/i18n";
import { SLOTS, type Verdict } from "@/lib/types";
import { cx, parseISO } from "@/lib/util";
import { CheckInCard, FeelingChart } from "@/components/CheckIn";
import { DosePlan } from "@/components/DosePlan";
import { CalendarButton } from "@/components/CalendarButton";
import { Btn, Chip, FormIcon, Reveal } from "@/components/ui";

const fmt = (s: string, lang: "en" | "hi") => {
  const d = parseISO(s);
  return `${d.getDate()} ${monthsShort[lang][d.getMonth()]} ${d.getFullYear()}`;
};

export default function EpisodeView({ id }: { id: string }) {
  const { state, lang, t, back, go, setVerdict, resolveEpisode } = useMemory();
  const e = state.episodes.find((x) => x.id === id);
  if (!e) {
    return (
      <div className="py-20 text-center">
        <p className="text-ink-2">Not found.</p>
        <Btn className="mt-4" onClick={() => go({ name: "home" })}>{t("home")}</Btn>
      </div>
    );
  }
  const col = catColor[e.category];
  const member = state.members.find((m) => m.id === e.memberId);
  const rxs = [...e.prescriptions].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="flex flex-col gap-6">
      <button onClick={back} className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-ink-3 hover:text-ink">
        <ArrowLeft className="size-4" /> {t("back")}
      </button>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[30px] p-6 md:p-8"
        style={{ background: `linear-gradient(135deg, ${col.bg}, #fffdf9 70%)` }}
      >
        <motion.div
          className="absolute -right-16 -top-16 size-64 rounded-full opacity-40 blur-2xl"
          style={{ background: col.fg }}
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full px-2.5 py-1 text-xs font-bold text-white" style={{ background: col.fg }}>
                {categoryLabel[lang][e.category]}
              </span>
              <Chip tone={e.status === "resolved" ? "mint" : e.status === "active" ? "amber" : "sky"}>
                {e.status === "resolved" ? t("resolvedIn", { n: episodeDays(e) }) : e.status === "active" ? t("active") : t("ongoing")}
              </Chip>
              {member && <Chip>{member.relation[lang] === "You" || member.relation[lang] === "आप" ? member.name : member.relation[lang]}</Chip>}
              {e.city && (
                <Chip>
                  <MapPin className="size-3" /> {e.city}
                </Chip>
              )}
            </div>
            <h1 className="font-display mt-3 text-[2.2rem] font-semibold leading-[1.05] md:text-[3.2rem]">{e.title}</h1>
            <div className="mt-2 flex items-center gap-2 font-mono text-sm text-ink-2">
              <CalendarDays className="size-4" />
              {fmt(e.startDate, lang)} {e.endDate ? `→ ${fmt(e.endDate, lang)}` : ""}
            </div>
          </div>
          <div className="flex items-end gap-6">
            <div>
              <div className="font-mono text-4xl font-bold leading-none md:text-5xl">{episodeDays(e)}</div>
              <div className="text-xs font-semibold text-ink-3">{lang === "hi" ? "दिन" : "days"}</div>
            </div>
            <div>
              <div className="font-mono text-4xl font-bold leading-none md:text-5xl">{rxs.length}</div>
              <div className="text-xs font-semibold text-ink-3">{t("doctors")}</div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-7">
          {e.checkIns.length >= 2 && (
            <Reveal>
              <div className="card p-5">
                <div className="mb-1 text-[0.7rem] font-semibold text-ink-3">{lang === "hi" ? "आपने कैसा महसूस किया" : "How you felt"}</div>
                <FeelingChart episode={e} />
              </div>
            </Reveal>
          )}

          {/* Prescriptions timeline */}
          <div className="relative">
            <div className="absolute bottom-6 left-[19px] top-6 w-px bg-gradient-to-b from-ink/20 via-ink/10 to-transparent" />
            <div className="flex flex-col gap-5">
              {rxs.map((rx, ri) => (
                <Reveal key={rx.id} delay={ri * 0.05}>
                  <div className="relative flex gap-4">
                    <div className="relative z-10 grid size-10 shrink-0 place-items-center rounded-full bg-ink text-white shadow-[var(--shadow-soft)]">
                      <Stethoscope className="size-4" />
                    </div>
                    <div className="card min-w-0 flex-1 p-4 md:p-5">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="font-display text-lg font-semibold">{rx.doctor}</div>
                          <div className="text-sm text-ink-3">{[rx.specialty, rx.clinic].filter(Boolean).join(" · ")}</div>
                        </div>
                        <span className="font-mono text-xs text-ink-3">{fmt(rx.date, lang)}</span>
                      </div>
                      {rx.diagnosis && (
                        <div className="mt-2 inline-block rounded-lg bg-canvas px-2.5 py-1 text-sm font-semibold text-ink-2">{rx.diagnosis}</div>
                      )}
                      <div className="mt-4 flex flex-col divide-y divide-ink/[0.06]">
                        {rx.medicines.map((m) => (
                          <div key={m.id} className="py-3 first:pt-0">
                            <div className="flex items-start gap-3">
                              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-canvas text-ink-2">
                                <FormIcon form={m.form} className="size-4" />
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-baseline gap-x-2">
                                  <span className="font-semibold">{m.name}</span>
                                  {m.generic && <span className="text-xs text-ink-3">{m.generic}</span>}
                                </div>
                                <div className="text-xs text-ink-2">
                                  {m.dose} ·{" "}
                                  {m.sos
                                    ? t("asNeeded")
                                    : SLOTS.filter((s) => m.slots[s]).map((s) => slotLabel[lang][s].name).join(" + ")}{" "}
                                  · {foodLabel[lang][m.food]} · {m.durationDays ? t("forDays", { n: m.durationDays }) : t("ongoingMed")}
                                </div>
                                <div className="mt-0.5 text-xs text-ink-3">{m.purpose[lang]}</div>
                              </div>
                            </div>
                            <VerdictPicker value={m.verdict} onPick={(v) => setVerdict(e.id, m.id, v)} />
                            {m.sideEffects?.length ? (
                              <div className="ml-12 mt-1.5 text-xs font-semibold text-rose">
                                {lang === "hi" ? "बताया: " : "Reported: "}
                                {m.sideEffects.join(", ")}
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                      {rx.advice?.length ? (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {rx.advice.map((a) => (
                            <Chip key={a} tone="sky">
                              {a}
                            </Chip>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-5">
          {e.status !== "resolved" && (
            <div className="card p-5">
              <div className="mb-3 text-[0.7rem] font-semibold text-ink-3">{t("todaysDoses")}</div>
              <CalendarButton memberId={e.memberId} className="mb-3" />
              <DosePlan memberId={e.memberId} compact />
              {e.status === "active" && (
                <>
                  <div className="mt-6 border-t border-ink/[0.06] pt-5">
                    <CheckInCard episode={e} />
                  </div>
                  <Btn variant="outline" size="sm" className="mt-5" icon={<CircleCheckBig className="size-4 text-mint" />} onClick={() => resolveEpisode(e.id)}>
                    {lang === "hi" ? "ठीक हो गया" : "I've recovered"}
                  </Btn>
                </>
              )}
            </div>
          )}
          {e.status === "resolved" && !e.outcome && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-[26px] bg-[linear-gradient(135deg,#3dbb55,#1f8a3b)] p-6 text-white"
            >
              <CircleCheckBig className="size-7" />
              <p className="font-display mt-3 text-xl font-semibold">
                {lang === "hi" ? `${episodeDays(e)} दिन में ठीक। यह आपकी मेमोरी में सेव है।` : `Recovered in ${episodeDays(e)} days. Saved to your memory.`}
              </p>
              <p className="mt-1 text-sm text-white/80">
                {lang === "hi" ? "ऊपर बताएँ कि कौन सी दवा काम आई।" : "Mark which medicines helped so next time is easier."}
              </p>
            </motion.div>
          )}
          {e.outcome && (
            <Reveal>
              <div className="rounded-[26px] bg-ink p-6 text-white">
                <div className="text-[0.7rem] font-semibold text-white/50">{lang === "hi" ? "नतीजा" : "How it ended"}</div>
                <p className="font-display mt-2 text-xl leading-snug">{e.outcome[lang]}</p>
                {e.status === "resolved" && (
                  <div className="mt-4 inline-flex rounded-full bg-mint/20 px-3 py-1 text-sm font-semibold text-[#7ee2c3]">
                    {t("resolvedIn", { n: episodeDays(e) })}
                  </div>
                )}
              </div>
            </Reveal>
          )}
          <div className="card p-5">
            <div className="font-display text-lg font-semibold">{t("briefTitle")}</div>
            <p className="mt-1 text-sm text-ink-2">{t("briefSub")}</p>
            <Btn variant="ink" className="mt-4 w-full" icon={<FileText className="size-4" />} onClick={() => go({ name: "brief", episodeId: e.id })}>
              {t("brief")}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

function VerdictPicker({ value, onPick }: { value?: Verdict; onPick: (v: Verdict) => void }) {
  const { lang } = useMemory();
  const opts: { v: Verdict; tone: string; on: string }[] = [
    { v: "helped", tone: "text-mint", on: "bg-mint text-white" },
    { v: "no-change", tone: "text-amber", on: "bg-amber text-white" },
    { v: "side-effect", tone: "text-rose", on: "bg-rose text-white" },
  ];
  return (
    <div className="ml-12 mt-2 flex flex-wrap gap-1">
      {opts.map((o) => {
        const on = value === o.v;
        return (
          <motion.button
            key={o.v}
            whileTap={{ scale: 0.92 }}
            onClick={() => onPick(o.v)}
            className={cx(
              "rounded-full px-2.5 py-1 text-[0.7rem] font-bold transition-colors",
              on ? o.on : cx("bg-ink/[0.04] hover:bg-ink/[0.08]", o.tone),
            )}
          >
            {verdictLabel[lang][o.v]}
          </motion.button>
        );
      })}
    </div>
  );
}
