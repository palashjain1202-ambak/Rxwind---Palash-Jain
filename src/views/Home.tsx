"use client";

import { motion } from "motion/react";
import { ArrowRight, CircleAlert, CircleCheck, CircleX, FileText, Images, ScanLine, ShieldCheck, Wind } from "lucide-react";
import { useMemory } from "@/lib/store";
import { DosePlan, ProgressRing, useTodayProgress } from "@/components/DosePlan";
import { CalendarButton } from "@/components/CalendarButton";
import { CheckInCard } from "@/components/CheckIn";
import { MedFeedback } from "@/components/MedCheck";
import { SeasonWheel, aqiBand, useAqi } from "@/components/SeasonWheel";
import { EpisodeCard } from "@/components/EpisodeCard";
import { MemberSwitch } from "@/components/Shell";
import { Btn, Chip, CountUp, FormIcon, Reveal, SectionTitle, fadeUp, stagger } from "@/components/ui";
import { catColor, episodeMeds, medLedger, memberEpisodes, recurringPatterns, stats, upcomingRisks } from "@/lib/insights";
import { monthsLong } from "@/lib/i18n";
import { daysBetween, greetingKey, parseISO, todayISO } from "@/lib/util";
import type { Medicine } from "@/lib/types";

export default function Home() {
  const { state, t, lang, go } = useMemory();
  const member = state.members.find((m) => m.id === state.activeMemberId) ?? state.members[0];
  const eps = memberEpisodes(state, member.id);
  const allEps = state.episodes.filter((e) => e.memberId === member.id);
  const active = eps.find((e) => e.status === "active") ?? eps.find((e) => e.status === "ongoing");
  const { total, done } = useTodayProgress(member.id);
  const upcoming = upcomingRisks(allEps);
  const ledger = medLedger(allEps);
  const s = stats(allEps);
  const aqi = useAqi(state.city.lat, state.city.lon);
  const patterns = recurringPatterns(allEps);

  if (!eps.length) return <EmptyHome />;

  const today = new Date();
  const dateLabel = `${today.getDate()} ${monthsLong[lang][today.getMonth()]}`;

  return (
    <motion.div variants={stagger(0.07)} initial="hidden" animate="show" className="flex flex-col gap-6 md:gap-8">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="font-mono text-xs text-ink-3">{dateLabel}</div>
          <h1 className="font-display mt-1 text-[2rem] font-semibold leading-[1.05] md:text-[2.75rem]">
            {`${t(greetingKey())}, ${member.name}`.split(" ").map((w, i) => (
              <motion.span
                key={member.id + i}
                className="mr-[0.25em] inline-block"
                initial={{ opacity: 0, y: 24, rotate: 4, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, rotate: 0, filter: "blur(0px)" }}
                transition={{ delay: 0.08 * i, type: "spring", stiffness: 220, damping: 18 }}
              >
                {w}
              </motion.span>
            ))}
          </h1>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-2">
            <span><CountUp to={s.episodes} className="font-mono font-semibold text-ink" /> {t("episodes")}</span>
            <span><CountUp to={s.doctors} className="font-mono font-semibold text-ink" /> {t("doctors")}</span>
            <span><CountUp to={s.medicines} className="font-mono font-semibold text-ink" /> {t("medicines")}</span>
          </div>
        </div>
        <div className="lg:hidden">
          <MemberSwitch />
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Active episode + doses */}
        <motion.section variants={fadeUp} className="card relative z-10 p-4 md:p-6 lg:col-span-8">
          {active ? (
            <>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="relative flex size-2">
                      <span className="absolute inset-0 animate-ping rounded-full bg-coral opacity-70" />
                      <span className="relative size-2 rounded-full bg-coral" />
                    </span>
                    <span className="text-[0.7rem] font-semibold text-ink-3">
                      {active.status === "active" ? t("activeEpisode") : t("ongoing")}
                    </span>
                  </div>
                  <button onClick={() => go({ name: "episode", id: active.id })} className="mt-1 text-left">
                    <h2 className="font-display text-[1.6rem] font-semibold leading-tight hover:text-coral md:text-[1.9rem]">{active.title}</h2>
                  </button>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-ink-2">
                    <span>{active.prescriptions.at(-1)?.doctor}</span>
                    <span className="text-ink-3">·</span>
                    {active.status === "active" ? (
                      <span className="font-mono text-xs">
                        {t("day", { d: daysBetween(active.startDate, todayISO()) + 1 })}
                      </span>
                    ) : (
                      <span className="text-xs">{active.prescriptions.at(-1)?.diagnosis}</span>
                    )}
                  </div>
                </div>
                {total > 0 && <ProgressRing done={done} total={total} />}
              </div>
              <div className="mt-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[0.7rem] font-semibold text-ink-3">{t("todaysDoses")}</div>
                  <CalendarButton memberId={member.id} />
                </div>
                <DosePlan memberId={member.id} />
              </div>
              <div className="mt-6 border-t border-ink/[0.06] pt-5">
                <MedFeedback episode={active} />
              </div>
              {active.status === "active" && (
                <div className="mt-6 border-t border-ink/[0.06] pt-5">
                  <CheckInCard episode={active} />
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-start gap-3 py-6">
              <CircleCheck className="size-8 text-mint" />
              <h2 className="font-display text-2xl font-semibold">{lang === "hi" ? "अभी कोई दवा नहीं चल रही" : "Nothing active right now"}</h2>
              <Btn variant="ink" icon={<ScanLine className="size-4" />} onClick={() => go({ name: "scan" })}>
                {t("scanTitle")}
              </Btn>
            </div>
          )}
        </motion.section>

        {/* Season radar */}
        <motion.section variants={fadeUp} className="card relative overflow-hidden p-4 md:p-6 lg:col-span-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[0.7rem] font-semibold text-ink-3">{t("seasonRadar")}</div>
              <h2 className="font-display text-xl font-semibold">{t("nextOn")}</h2>
            </div>
            {aqi && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl px-3 py-1.5 text-right"
                style={{ background: aqiBand(aqi.aqi).color + "18" }}
                title={t("liveAqi")}
              >
                <div className="flex items-center gap-1 text-[0.62rem] font-semibold text-ink-3">
                  <Wind className="size-3" /> AQI · {state.city.name}
                </div>
                <div className="font-mono text-lg font-bold leading-none" style={{ color: aqiBand(aqi.aqi).color }}>
                  {aqi.aqi}
                </div>
              </motion.div>
            )}
          </div>
          <div className="my-3 flex justify-center">
            <SeasonWheel episodes={allEps} upcoming={upcoming} size={280} />
          </div>
          {upcoming[0] ? <UpcomingNote u={upcoming[0]} aqi={aqi?.aqi} /> : <p className="text-sm text-ink-3">{t("radarEmpty")}</p>}
        </motion.section>
      </div>

      {/* Ledger */}
      <motion.section variants={fadeUp}>
        <SectionTitle kicker={t("reportedBy")}>{t("patterns")}</SectionTitle>
        <div className="grid gap-4 md:grid-cols-3">
          <LedgerCol title={t("whatHelped")} icon={<CircleCheck className="size-4" />} tone="mint" meds={ledger.helped} />
          <LedgerCol title={t("whatDidnt")} icon={<CircleX className="size-4" />} tone="amber" meds={ledger.failed} />
          <LedgerCol title={t("sideEffectsLabel")} icon={<CircleAlert className="size-4" />} tone="rose" meds={ledger.side} showFx />
        </div>
        {patterns.length > 0 && (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {patterns.map((p) => (
              <Reveal key={p.category}>
                <div className="card flex items-center gap-4 p-4">
                  <div className="grid size-12 shrink-0 place-items-center rounded-2xl" style={{ background: catColor[p.category].bg, color: catColor[p.category].fg }}>
                    <span className="font-mono text-lg font-bold">{p.episodes.length}×</span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-display font-semibold">
                      {p.title} <span className="text-ink-3">· {t("recurring")}</span>
                    </div>
                    <div className="text-sm text-ink-2">
                      {p.episodes.map((e) => `${monthsLong[lang][parseISO(e.startDate).getMonth()]} ${parseISO(e.startDate).getFullYear()}`).join(", ")}
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </motion.section>

      {/* Recent */}
      <motion.section variants={fadeUp}>
        <SectionTitle
          action={
            <button onClick={() => go({ name: "rewind" })} className="inline-flex items-center gap-1 text-sm font-semibold text-coral">
              {t("seeAll")} <ArrowRight className="size-4" />
            </button>
          }
        >
          {t("rewind")}
        </SectionTitle>
        <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 xl:grid-cols-4">
          {eps.filter((e) => e.status === "resolved").slice(0, 4).map((e, i) => (
            <div key={e.id} className="w-[78%] shrink-0 snap-start md:w-auto">
              <EpisodeCard e={e} i={i} />
            </div>
          ))}
        </div>
      </motion.section>

      <motion.div variants={fadeUp} className="flex items-start gap-2.5 rounded-2xl bg-ink/[0.04] p-4 text-xs leading-relaxed text-ink-2">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-mint" />
        {t("safety")}
      </motion.div>
    </motion.div>
  );
}

function UpcomingNote({ u, aqi }: { u: ReturnType<typeof upcomingRisks>[number]; aqi?: number }) {
  const { t, lang, go } = useMemory();
  const meds = episodeMeds(u.episode);
  const helped = meds.filter((m) => m.verdict === "helped");
  const failed = meds.filter((m) => m.verdict === "no-change" || m.verdict === "side-effect");
  const y = parseISO(u.episode.startDate).getFullYear();
  const m = monthsLong[lang][parseISO(u.episode.startDate).getMonth()];
  return (
    <div className="rounded-2xl bg-canvas/80 p-3.5">
      <p className="text-sm leading-relaxed text-ink-2">
        {lang === "hi" ? (
          <>
            <b className="text-ink">{m} {y}</b> में आपको <b className="text-ink">{u.episode.title}</b> हुआ था
            {u.episode.endDate ? <>, {Math.max(1, Math.round((parseISO(u.episode.endDate).getTime() - parseISO(u.episode.startDate).getTime()) / 864e5) + 1)} दिन</> : null}.
          </>
        ) : (
          <>
            In <b className="text-ink">{m} {y}</b> you had <b className="text-ink">{u.episode.title.toLowerCase()}</b>
            {u.episode.endDate ? <> for {Math.max(1, Math.round((parseISO(u.episode.endDate).getTime() - parseISO(u.episode.startDate).getTime()) / 864e5) + 1)} days</> : null}.
            {aqi && aqi > 150 && u.episode.category === "respiratory" ? <> Air is already at AQI {aqi}.</> : null}
          </>
        )}
      </p>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {helped.slice(0, 2).map((m) => (
          <Chip key={m.id} tone="mint">✓ {m.generic?.split("+")[0].trim() || m.name}</Chip>
        ))}
        {failed.slice(0, 2).map((m) => (
          <Chip key={m.id} tone="rose">✕ {m.generic?.split("+")[0].trim() || m.name}</Chip>
        ))}
      </div>
      <p className="mt-2.5 text-xs text-ink-3">{t("bookCheck")}</p>
      <Btn size="sm" variant="ink" className="mt-3 w-full" icon={<FileText className="size-4" />} onClick={() => go({ name: "brief" })}>
        {t("brief")}
      </Btn>
    </div>
  );
}

function LedgerCol({ title, icon, tone, meds, showFx }: { title: string; icon: React.ReactNode; tone: "mint" | "amber" | "rose"; meds: Medicine[]; showFx?: boolean }) {
  const { lang } = useMemory();
  const c = { mint: "text-mint bg-mint-soft", amber: "text-amber bg-amber-soft", rose: "text-rose bg-rose-soft" }[tone];
  return (
    <Reveal>
      <div className="card h-full p-4">
        <div className={`mb-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${c}`}>
          {icon}
          {title}
        </div>
        <div className="flex flex-col gap-2">
          {meds.length === 0 && <span className="text-sm text-ink-3">Nothing yet</span>}
          {meds.slice(0, 5).map((m) => (
            <div key={m.id} className="flex items-center gap-2.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-canvas text-ink-2">
                <FormIcon form={m.form} className="size-4" />
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{m.name}</div>
                <div className="truncate text-xs text-ink-3">
                  {showFx && m.sideEffects?.length ? m.sideEffects.join(", ") + " · " : ""}
                  {m.purpose[lang]}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Reveal>
  );
}

function EmptyHome() {
  const { t, go } = useMemory();
  return (
    <div className="grid min-h-[70dvh] place-items-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md text-center">
        <motion.div
          className="mx-auto mb-6 grid size-24 place-items-center rounded-[28px] bg-ink text-coral shadow-[var(--shadow-lift)]"
          animate={{ rotate: [0, -6, 6, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <Images className="size-10" />
        </motion.div>
        <h1 className="font-display text-3xl font-semibold">{t("empty1")}</h1>
        <p className="mt-3 text-ink-2">{t("empty2")}</p>
        <Btn size="lg" className="mt-6" icon={<ScanLine className="size-5" />} onClick={() => go({ name: "scan" })}>
          {t("scanTitle")}
        </Btn>
      </motion.div>
    </div>
  );
}
