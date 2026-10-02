"use client";

import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { Copy, MessageCircle, Printer, Sparkles, Check } from "lucide-react";
import { useMemory } from "@/lib/store";
import { catColor, episodeDays, episodeMeds, medLedger, memberEpisodes, recurringPatterns, todaysMeds } from "@/lib/insights";
import { foodLabel, monthsShort, slotLabel } from "@/lib/i18n";
import { SLOTS, type Episode, type Medicine } from "@/lib/types";
import { daysBetween, parseISO, todayISO } from "@/lib/util";
import { MemberSwitch } from "@/components/Shell";
import { Btn, Logo } from "@/components/ui";

type Ai = { summaryEn: string; summaryHi: string; questionsEn: string[]; questionsHi: string[] };

const fmt = (s: string, lang: "en" | "hi") => {
  const d = parseISO(s);
  return `${monthsShort[lang][d.getMonth()]} ${d.getFullYear()}`;
};

const gname = (m: Medicine) => (m.generic ? `${m.generic} (${m.name})` : m.name);

export default function Brief({ episodeId }: { episodeId?: string }) {
  const { state, lang, t } = useMemory();
  const member = state.members.find((m) => m.id === state.activeMemberId) ?? state.members[0];
  const eps = memberEpisodes(state, member.id);
  const focus = episodeId ? state.episodes.find((e) => e.id === episodeId) : undefined;
  const recent = eps.filter((e) => daysBetween(e.startDate, todayISO()) <= 550);
  const current = todaysMeds(state, member.id);
  const ledger = medLedger(eps);
  const patterns = recurringPatterns(eps);
  const [ai, setAi] = useState<Ai | null>(null);
  const [aiState, setAiState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [copied, setCopied] = useState(false);

  const payload = useMemo(
    () => ({
      patient: { name: member.name, age: member.age, city: member.city, allergies: member.allergies, conditions: member.conditions },
      focusEpisode: focus?.title,
      currentMedicines: current.map((c) => ({ name: c.med.name, generic: c.med.generic, dose: c.med.dose, code: c.med.frequencyCode, for: c.ep.title })),
      episodes: recent.map((e) => ({
        title: e.title,
        category: e.category,
        start: e.startDate,
        days: episodeDays(e),
        status: e.status,
        doctors: e.prescriptions.map((p) => `${p.doctor} (${p.specialty ?? ""})`),
        diagnoses: e.prescriptions.map((p) => p.diagnosis).filter(Boolean),
        medicines: episodeMeds(e).map((m) => ({ name: m.name, generic: m.generic, patientReport: m.verdict ?? "not recorded", sideEffects: m.sideEffects })),
      })),
    }),
    [member, focus, current, recent],
  );

  useEffect(() => {
    if (!recent.length) return;
    let cancel = false;
    setAiState("loading");
    setAi(null);
    fetch("/api/brief", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((j: Ai) => {
        if (!cancel && j.summaryEn) {
          setAi(j);
          setAiState("done");
        }
      })
      .catch(() => !cancel && setAiState("error"));
    return () => {
      cancel = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member.id, episodeId]);

  const fallbackSummary = useMemo(() => {
    const parts: string[] = [];
    for (const p of patterns)
      parts.push(
        `Recurring "${p.title.toLowerCase()}" (${p.category}) episodes: ${p.episodes.map((e) => fmt(e.startDate, "en")).join(", ")}.`,
      );
    if (ledger.helped.length) parts.push(`Patient reports benefit from ${ledger.helped.slice(0, 3).map(gname).join(", ")}.`);
    if (ledger.failed.length) parts.push(`No improvement reported with ${ledger.failed.map(gname).join(", ")}.`);
    if (ledger.side.length)
      parts.push(`Side effects reported: ${ledger.side.map((m) => `${m.generic ?? m.name}${m.sideEffects?.length ? ` (${m.sideEffects.join(", ")})` : ""}`).join("; ")}.`);
    return parts.join(" ");
  }, [patterns, ledger]);

  const summary = ai ? (lang === "hi" ? ai.summaryHi : ai.summaryEn) : fallbackSummary;
  const questions = ai ? (lang === "hi" ? ai.questionsHi : ai.questionsEn) : [];

  const plain = useMemo(() => {
    const L: string[] = [];
    L.push(`*Rxwind health brief — ${member.name}${member.age ? `, ${member.age}` : ""}*`);
    if (focus) L.push(`Re: ${focus.title}`);
    L.push(`Allergies: ${member.allergies.join(", ") || "None known"}`);
    if (member.conditions.length) L.push(`Long-term: ${member.conditions.join(", ")}`);
    L.push("");
    L.push(summary);
    if (current.length) {
      L.push("", "*Current medicines*");
      for (const c of current) L.push(`• ${c.med.name}${c.med.generic ? ` (${c.med.generic})` : ""} — ${c.med.dose}, ${c.med.frequencyCode ?? ""}`);
    }
    L.push("", "*History*");
    for (const e of recent.slice(0, 8))
      L.push(`• ${fmt(e.startDate, "en")}: ${e.title} — ${e.prescriptions.map((p) => p.doctor).join(" → ")} — ${e.status === "resolved" ? `${episodeDays(e)} days` : e.status}`);
    L.push("", "_Patient-reported via Rxwind. Not a clinical record._");
    return L.join("\n");
  }, [member, focus, summary, current, recent]);

  if (!eps.length)
    return (
      <div className="py-20 text-center text-ink-2">
        {t("empty1")} {t("empty2")}
      </div>
    );

  return (
    <div className="mx-auto max-w-[920px]">
      <div className="no-print mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-display text-[2.2rem] font-semibold leading-none md:text-[3rem]">{t("briefTitle")}</h1>
          <p className="mt-2 text-ink-2">{t("briefSub")}</p>
        </div>
        <MemberSwitch />
      </div>

      <div className="no-print mb-5 flex flex-wrap gap-2">
        <Btn
          icon={<MessageCircle className="size-4" />}
          onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(plain)}`, "_blank")}
          className="bg-[#1faa59] shadow-none"
        >
          {t("shareWhatsApp")}
        </Btn>
        <Btn variant="outline" icon={<Printer className="size-4" />} onClick={() => window.print()}>
          {t("print")}
        </Btn>
        <Btn
          variant="outline"
          icon={copied ? <Check className="size-4 text-mint" /> : <Copy className="size-4" />}
          onClick={() => {
            navigator.clipboard?.writeText(plain).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1600);
            });
          }}
        >
          {copied ? t("copied") : t("copy")}
        </Btn>
      </div>

      <motion.article
        initial={{ opacity: 0, y: 24, rotate: -0.6 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
        className="relative overflow-hidden rounded-[28px] bg-white p-6 shadow-[var(--shadow-lift)] md:p-10 print:rounded-none print:p-0 print:shadow-none"
      >
        <div className="flex flex-col gap-4 border-b border-ink/10 pb-5 md:flex-row md:items-start md:justify-between">
          <div>
            <Logo size={26} />
            <h2 className="font-display mt-4 text-3xl font-semibold">
              {member.name}
              {member.age ? <span className="text-ink-3">, {member.age}</span> : null}
            </h2>
            {focus && (
              <div className="mt-1 text-sm font-semibold" style={{ color: catColor[focus.category].fg }}>
                Re: {focus.title} · {lang === "hi" ? "दिन" : "Day"} {episodeDays(focus)}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm md:text-right">
            <div>
              <div className="text-[0.65rem] font-bold text-ink-3">{t("allergies")}</div>
              <div className={member.allergies.length ? "font-semibold text-rose" : "text-ink-2"}>{member.allergies.join(", ") || t("noneKnown")}</div>
            </div>
            <div>
              <div className="text-[0.65rem] font-bold text-ink-3">{t("conditions")}</div>
              <div className="text-ink-2">{member.conditions.join(", ") || t("noneKnown")}</div>
            </div>
            <div className="col-span-2 font-mono text-xs text-ink-3">
              {lang === "hi" ? "बनाया गया" : "Generated"} {todayISO()} · {member.city || state.city.name}
            </div>
          </div>
        </div>

        {/* Summary */}
        <section className="mt-6">
          <div className="mb-2 flex items-center gap-2 text-[0.7rem] font-bold text-ink-3">
            <Sparkles className="size-3.5 text-coral" /> {t("summaryAi")}
          </div>
          {aiState === "loading" && !ai ? (
            <div className="space-y-2">
              <p className="text-[1.02rem] leading-relaxed text-ink">{fallbackSummary}</p>
              <span className="shimmer-text text-xs font-semibold">{t("generating")}</span>
            </div>
          ) : (
            <motion.p key={summary.slice(0, 20)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[1.02rem] leading-relaxed text-ink">
              {summary}
            </motion.p>
          )}
        </section>

        {/* Current meds */}
        {current.length > 0 && (
          <section className="mt-7">
            <H>{lang === "hi" ? "अभी चल रही दवाइयाँ" : "Current medicines"}</H>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody>
                  {current.map((c) => (
                    <tr key={c.med.id} className="border-b border-ink/[0.06] last:border-0">
                      <td className="py-2 pr-3 font-semibold">{c.med.name}</td>
                      <td className="py-2 pr-3 text-ink-3">{c.med.generic}</td>
                      <td className="py-2 pr-3 text-ink-2">
                        {c.med.sos ? t("asNeeded") : SLOTS.filter((s) => c.med.slots[s]).map((s) => slotLabel[lang][s].name).join("+")} · {foodLabel[lang][c.med.food]}
                      </td>
                      <td className="py-2 text-right font-mono text-xs text-ink-3">{c.ep.title}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Ledger */}
        <section className="mt-7 grid gap-4 md:grid-cols-3">
          <LedgerList title={t("whatHelped")} color="#0f9f7a" items={ledger.helped.map((m) => m.generic ?? m.name)} />
          <LedgerList title={t("whatDidnt")} color="#d98a04" items={ledger.failed.map((m) => m.generic ?? m.name)} />
          <LedgerList
            title={t("sideEffectsLabel")}
            color="#d93d4a"
            items={ledger.side.map((m) => `${m.generic ?? m.name}${m.sideEffects?.length ? ` — ${m.sideEffects.join(", ")}` : ""}`)}
          />
        </section>

        {/* History */}
        <section className="mt-7">
          <H>{lang === "hi" ? "पिछले 18 महीने" : "Last 18 months"}</H>
          <div className="flex flex-col">
            {recent.map((e: Episode) => (
              <div key={e.id} className="grid grid-cols-[72px_1fr] gap-3 border-b border-ink/[0.06] py-2.5 last:border-0 md:grid-cols-[90px_1fr_auto]">
                <div className="font-mono text-xs text-ink-3">{fmt(e.startDate, lang)}</div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 font-semibold">
                    <span className="size-2 shrink-0 rounded-full" style={{ background: catColor[e.category].fg }} />
                    {e.title}
                  </div>
                  <div className="text-xs text-ink-3">{e.prescriptions.map((p) => p.doctor).join(" → ")}</div>
                </div>
                <div className="col-start-2 text-xs font-semibold text-ink-2 md:col-start-auto md:text-right">
                  {e.status === "resolved" ? t("resolvedIn", { n: episodeDays(e) }) : e.status === "active" ? t("active") : t("ongoing")}
                </div>
              </div>
            ))}
          </div>
        </section>

        {questions.length > 0 && (
          <section className="mt-7 rounded-2xl bg-canvas p-4">
            <H>{lang === "hi" ? "डॉक्टर से पूछें" : "Questions to ask"}</H>
            <ol className="list-inside list-decimal space-y-1 text-sm text-ink-2">
              {questions.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ol>
          </section>
        )}

        <p className="mt-7 border-t border-ink/10 pt-4 text-xs text-ink-3">{t("reportedBy")} {t("safety")}</p>
      </motion.article>
    </div>
  );
}

function H({ children }: { children: React.ReactNode }) {
  return <div className="mb-2 text-[0.7rem] font-bold text-ink-3">{children}</div>;
}

function LedgerList({ title, color, items }: { title: string; color: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-ink/[0.07] p-4">
      <div className="mb-2 text-xs font-bold" style={{ color }}>
        {title}
      </div>
      <ul className="space-y-1 text-sm text-ink-2">
        {items.length ? items.map((i) => <li key={i}>{i}</li>) : <li className="text-ink-3">—</li>}
      </ul>
    </div>
  );
}
