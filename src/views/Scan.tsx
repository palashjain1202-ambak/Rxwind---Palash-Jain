"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, Camera, Check, CircleAlert, ImagePlus, Loader2, Pencil, ShieldAlert, Sparkles, TriangleAlert, Upload, X,
} from "lucide-react";
import { useMemory } from "@/lib/store";
import { SAMPLES, type Sample } from "@/lib/samples";
import { prepareImage, urlToBlob } from "@/lib/image";
import type { Food, Medicine, ScanResult, Slot } from "@/lib/types";
import { SLOTS } from "@/lib/types";
import { allergyHits, catColor, duplicateHits, todaysMeds } from "@/lib/insights";
import { categoryLabel, foodLabel, formLabel, slotLabel } from "@/lib/i18n";
import { cx, daysBetween, uid } from "@/lib/util";
import { Btn, Chip, ConfidenceDot, FormIcon } from "@/components/ui";

type Phase = "pick" | "scanning" | "review" | "bulk";
type Prepared = { base64: string; preview: string; thumb: string; mimeType: string };

async function callScan(img: Prepared): Promise<ScanResult> {
  const r = await fetch("/api/scan", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ images: [{ data: img.base64, mimeType: img.mimeType }] }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.message || j.error || "scan failed"), { code: j.error || r.status });
  return j as ScanResult;
}

export default function Scan() {
  const { t, lang, state, setMember, savePrescription, go } = useMemory();
  const [phase, setPhase] = useState<Phase>("pick");
  const [img, setImg] = useState<Prepared | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [meds, setMeds] = useState<Medicine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [usedCache, setUsedCache] = useState(false);
  const [memberId, setMemberId] = useState(state.activeMemberId);
  const [target, setTarget] = useState<string>("new");
  const [bulk, setBulk] = useState<{ thumb: string; status: "wait" | "run" | "ok" | "err"; title?: string }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const member = state.members.find((m) => m.id === memberId) ?? state.members[0];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [phase]);

  const startSingle = useCallback(async (prepared: Prepared, sample?: Sample) => {
    setImg(prepared);
    setError(null);
    setUsedCache(false);
    setPhase("scanning");
    const minWait = new Promise((r) => setTimeout(r, 2600));
    let res: ScanResult | null = null;
    try {
      res = await callScan(prepared);
    } catch (e) {
      if (sample) {
        res = sample.cached;
        setUsedCache(true);
      } else {
        await minWait;
        setError((e as { code?: string }).code === "no_key" ? "AI isn't configured on this deployment yet." : t("errorScan"));
        setPhase("pick");
        return;
      }
    }
    await minWait;
    if (!res.isPrescription) {
      setError(t("notRx"));
      setPhase("pick");
      return;
    }
    setResult(res);
    setMeds(res.medicines.map((m) => ({ ...m, id: uid() })));
    setPhase("review");
  }, [t]);

  const onFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files).filter((f) => f.type.startsWith("image/") || /\.(heic|jpg|jpeg|png|webp)$/i.test(f.name));
      if (!list.length) return;
      if (list.length === 1) {
        try {
          const p = await prepareImage(list[0]);
          startSingle(p);
        } catch {
          setError(t("errorScan"));
        }
        return;
      }
      // bulk import → build the rewind
      const prepared = await Promise.all(list.slice(0, 8).map((f) => prepareImage(f).catch(() => null)));
      const ok = prepared.filter(Boolean) as Prepared[];
      setBulk(ok.map((p) => ({ thumb: p.thumb, status: "wait" })));
      setPhase("bulk");
      const created: { id: string; category: string; date: string }[] = [];
      for (let i = 0; i < ok.length; i++) {
        setBulk((b) => b.map((x, j) => (j === i ? { ...x, status: "run" } : x)));
        try {
          const res = await callScan(ok[i]);
          if (!res.isPrescription) throw new Error("not rx");
          const date = res.date ?? new Date().toISOString().slice(0, 10);
          const near = created.find((c) => c.category === res.category && Math.abs(daysBetween(c.date, date)) <= 21);
          const existing = state.episodes.find(
            (e) => e.memberId === memberId && e.category === res.category && Math.abs(daysBetween(e.startDate, date)) <= 21,
          );
          const epId = savePrescription(res, {
            memberId,
            episodeId: near?.id ?? existing?.id ?? "new",
            thumb: ok[i].thumb,
            meds: res.medicines.map((m) => ({ ...m, id: uid() })),
          });
          if (!near && !existing) created.push({ id: epId, category: res.category, date });
          setBulk((b) => b.map((x, j) => (j === i ? { ...x, status: "ok", title: res.episodeTitle?.[lang] ?? res.diagnosis } : x)));
        } catch {
          setBulk((b) => b.map((x, j) => (j === i ? { ...x, status: "err" } : x)));
        }
      }
    },
    [startSingle, savePrescription, memberId, state.episodes, lang, t],
  );

  const pickSample = async (s: Sample) => {
    if (state.members.some((m) => m.id === s.memberHint)) setMemberId(s.memberHint);
    const blob = await urlToBlob(s.src);
    const p = await prepareImage(blob);
    startSingle(p, s);
  };

  // candidate episodes to attach to
  const candidates = useMemo(() => {
    if (!result) return [];
    const date = result.date ?? new Date().toISOString().slice(0, 10);
    return state.episodes
      .filter((e) => e.memberId === memberId && (e.status !== "resolved" || Math.abs(daysBetween(e.startDate, date)) <= 21))
      .filter((e) => e.category === result.category || e.status === "active")
      .slice(0, 3);
  }, [result, state.episodes, memberId]);

  useEffect(() => {
    if (!result) return;
    const same = candidates.find((c) => c.category === result.category);
    setTarget(same ? same.id : "new");
  }, [result, candidates]);

  const current = useMemo(() => todaysMeds(state, memberId), [state, memberId]);

  const save = () => {
    if (!result || !img) return;
    const epId = savePrescription(result, { memberId, episodeId: target, thumb: img.thumb, meds });
    setMember(memberId);
    go({ name: "episode", id: epId });
  };

  return (
    <div className="mx-auto max-w-[1100px]">
      <AnimatePresence mode="wait">
        {phase === "pick" && (
          <motion.div key="pick" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <div className="mb-6 md:mb-8">
              <h1 className="font-display text-[2rem] font-semibold leading-tight md:text-[2.6rem]">{t("scanTitle")}</h1>
              <p className="mt-2 max-w-xl text-ink-2">{t("scanSub")}</p>
            </div>

            {state.members.length > 1 && (
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-ink-3">{t("pickMember")}</span>
                {state.members.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMemberId(m.id)}
                    className={cx(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition",
                      memberId === m.id ? "border-ink bg-ink text-white" : "border-ink/10 bg-paper text-ink-2",
                    )}
                  >
                    <span className="grid size-5 place-items-center rounded-full text-[0.6rem] text-white" style={{ background: m.tint }}>
                      {m.name[0]}
                    </span>
                    {m.relation[lang] === "You" || m.relation[lang] === "आप" ? m.name : `${m.relation[lang]} · ${m.name}`}
                  </button>
                ))}
              </div>
            )}

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 flex items-center gap-2 rounded-2xl bg-rose-soft px-4 py-3 text-sm font-semibold text-rose"
                >
                  <CircleAlert className="size-4" /> {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid gap-4 lg:grid-cols-5">
              <motion.div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDrag(true);
                }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDrag(false);
                  onFiles(e.dataTransfer.files);
                }}
                animate={{ scale: drag ? 1.015 : 1 }}
                className={cx(
                  "relative flex min-h-[300px] flex-col items-center justify-center overflow-hidden rounded-[28px] border-2 border-dashed p-8 text-center transition-colors lg:col-span-3 lg:min-h-[420px]",
                  drag ? "border-coral bg-coral-soft/60" : "border-ink/15 bg-paper/60",
                )}
              >
                <ScanIllustration />
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Btn size="lg" icon={<Camera className="size-5" />} onClick={() => camRef.current?.click()} className="md:hidden">
                    {t("takePhoto")}
                  </Btn>
                  <Btn size="lg" variant="ink" icon={<Upload className="size-5" />} onClick={() => fileRef.current?.click()}>
                    {t("upload")}
                  </Btn>
                </div>
                <p className="mt-4 hidden text-sm text-ink-3 md:block">
                  {lang === "hi" ? "या पर्चियाँ यहाँ खींचकर छोड़ें — एक साथ कई भी" : "or drop parchis here — several at once builds your rewind"}
                </p>
                <p className="mt-4 text-xs text-ink-3 md:hidden">
                  {lang === "hi" ? "कई पुरानी पर्चियाँ एक साथ चुनें" : "Pick several old parchis at once to build your rewind"}
                </p>
                <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => e.target.files && onFiles(e.target.files)} />
                <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => e.target.files && onFiles(e.target.files)} />
              </motion.div>

              <div className="lg:col-span-2">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink-2">
                  <Sparkles className="size-4 text-coral" /> {t("trySample")}
                </div>
                <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
                  {SAMPLES.map((s, i) => (
                    <motion.button
                      key={s.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.08 }}
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => pickSample(s)}
                      className="card group flex flex-col overflow-hidden text-left lg:flex-row lg:items-center lg:gap-4 lg:p-3"
                    >
                      <div className="relative aspect-[3/4] w-full overflow-hidden bg-canvas lg:aspect-auto lg:h-24 lg:w-20 lg:shrink-0 lg:rounded-xl">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={s.thumb} alt="" className="size-full object-cover transition duration-500 group-hover:scale-110" />
                      </div>
                      <div className="p-2.5 lg:p-0">
                        <div className="text-[0.65rem] font-bold text-coral">{s.kind[lang]}</div>
                        <div className="text-xs font-semibold leading-snug sm:text-sm">{s.label[lang]}</div>
                        {s.memberHint === "maa" && state.mode === "demo" && (
                          <div className="mt-1 hidden text-xs text-ink-3 lg:block">{lang === "hi" ? "माँ के लिए · एलर्जी जाँच देखें" : "For Maa · watch the allergy check"}</div>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {phase === "scanning" && img && (
          <motion.div key="scan" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }}>
            <ScanningStage preview={img.preview} />
          </motion.div>
        )}

        {phase === "review" && result && img && (
          <motion.div key="review" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button onClick={() => setPhase("pick")} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-3 hover:text-ink">
              <ArrowLeft className="size-4" /> {t("back")}
            </button>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
              <div className="lg:sticky lg:top-8 lg:self-start">
                <div className="card overflow-hidden p-2">
                  <div className="relative overflow-hidden rounded-[20px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.preview} alt="Prescription" className="max-h-[220px] w-full object-cover object-top lg:max-h-none" />
                    <motion.div
                      initial={{ top: "0%" }}
                      animate={{ top: "100%" }}
                      transition={{ duration: 0.9, ease: "easeInOut" }}
                      className="absolute inset-x-0 h-16 bg-gradient-to-b from-transparent via-mint/30 to-transparent"
                    />
                  </div>
                  <div className="p-3">
                    <div className="font-display text-lg font-semibold">{result.doctor}</div>
                    <div className="text-sm text-ink-3">{[result.specialty, result.clinic].filter(Boolean).join(" · ")}</div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {result.date && <Chip>{result.date}</Chip>}
                      <span
                        className="rounded-full px-2.5 py-1 text-xs font-semibold"
                        style={{ background: catColor[result.category].bg, color: catColor[result.category].fg }}
                      >
                        {categoryLabel[lang][result.category]}
                      </span>
                      <Chip tone={result.legibility === "clear" ? "mint" : result.legibility === "partly" ? "amber" : "rose"}>
                        {result.legibility === "clear" ? (lang === "hi" ? "साफ़" : "Clear") : result.legibility === "partly" ? (lang === "hi" ? "कुछ अस्पष्ट" : "Partly legible") : lang === "hi" ? "अस्पष्ट" : "Hard to read"}
                      </Chip>
                    </div>
                    {result.diagnosis && <p className="mt-3 text-sm text-ink-2">{result.diagnosis}</p>}
                    {usedCache && (
                      <p className="mt-3 rounded-xl bg-amber-soft px-3 py-2 text-xs text-amber">
                        {lang === "hi" ? "AI अभी व्यस्त है — सैंपल का सेव किया हुआ नतीजा दिखाया गया।" : "AI is busy right now — showing this sample's saved reading."}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h2 className="font-display text-2xl font-semibold md:text-3xl">{t("reviewTitle")}</h2>
                <p className="mt-1 text-sm text-ink-2">{t("reviewSub")}</p>

                {/* safety flags */}
                <div className="mt-4 flex flex-col gap-2">
                  {meds.flatMap((m) =>
                    allergyHits(m, member).map((a) => (
                      <motion.div
                        key={m.id + a}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-start gap-3 rounded-2xl border border-rose/30 bg-rose-soft p-3.5 text-sm text-rose"
                      >
                        <ShieldAlert className="mt-0.5 size-5 shrink-0" />
                        <div>
                          <b>
                            {lang === "hi" ? `एलर्जी जाँच: ${member.name} को ${a} से एलर्जी है।` : `Allergy check: ${member.name} is allergic to ${a}.`}
                          </b>{" "}
                          {lang === "hi"
                            ? `${m.name} (${m.generic ?? ""}) इसी समूह की दवा लगती है। लेने से पहले डॉक्टर को बताएँ।`
                            : `${m.name} (${m.generic ?? ""}) looks like it belongs to this group. Tell the doctor before taking it.`}
                        </div>
                      </motion.div>
                    )),
                  )}
                  {meds.flatMap((m) =>
                    duplicateHits(m, current).map((d) => (
                      <div key={m.id + d.med.id} className="flex items-start gap-3 rounded-2xl border border-amber/30 bg-amber-soft p-3.5 text-sm text-amber">
                        <TriangleAlert className="mt-0.5 size-5 shrink-0" />
                        <div>
                          {lang === "hi"
                            ? `${m.name} में वही दवा है जो ${d.med.name} (${d.ep.title}) में पहले से चल रही है। डबल डोज़ से बचने के लिए पूछें।`
                            : `${m.name} shares an ingredient with ${d.med.name}, which ${member.name} is already taking for "${d.ep.title}". Ask before doubling up.`}
                        </div>
                      </div>
                    )),
                  )}
                  {result.warnings?.map((w) => (
                    <div key={w} className="flex items-start gap-2.5 rounded-2xl bg-ink/[0.04] px-3.5 py-2.5 text-xs text-ink-2">
                      <CircleAlert className="mt-0.5 size-3.5 shrink-0 text-amber" /> {w}
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-col gap-3">
                  {meds.map((m, i) => (
                    <ReviewMed
                      key={m.id}
                      m={m}
                      i={i}
                      onChange={(nm) => setMeds((all) => all.map((x) => (x.id === m.id ? nm : x)))}
                      onRemove={() => setMeds((all) => all.filter((x) => x.id !== m.id))}
                    />
                  ))}
                </div>

                {result.advice?.length > 0 && (
                  <div className="mt-4 rounded-2xl bg-paper/70 p-4">
                    <div className="mb-1.5 text-xs font-semibold text-ink-3">{t("notes")}</div>
                    <ul className="list-inside list-disc text-sm text-ink-2">
                      {result.advice.map((a) => (
                        <li key={a}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-6">
                  <div className="mb-2 text-xs font-semibold text-ink-3">
                    {lang === "hi" ? "मेमोरी में कहाँ जोड़ें" : "Where does this go?"}
                  </div>
                  <div className="flex flex-col gap-2">
                    {candidates.map((c) => (
                      <TargetOption key={c.id} on={target === c.id} onClick={() => setTarget(c.id)} title={`${t("addToEpisode")} ${c.title}`} sub={c.startDate} />
                    ))}
                    <TargetOption
                      on={target === "new"}
                      onClick={() => setTarget("new")}
                      title={`${t("newEpisode")}: ${result.episodeTitle?.[lang] ?? result.diagnosis}`}
                      sub={categoryLabel[lang][result.category]}
                    />
                  </div>
                </div>

                <div className="sticky bottom-24 z-20 mt-6 lg:bottom-6">
                  <Btn size="lg" className="w-full" icon={<Check className="size-5" />} onClick={save}>
                    {t("confirmSave")}
                  </Btn>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {phase === "bulk" && (
          <motion.div key="bulk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mx-auto max-w-2xl py-6 text-center">
            <h1 className="font-display text-3xl font-semibold md:text-4xl">
              {bulk.every((b) => b.status === "ok" || b.status === "err") ? t("importedN", { n: bulk.filter((b) => b.status === "ok").length }) : t("importing")}
            </h1>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {bulk.map((b, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30, rotate: (i % 2 ? 1 : -1) * 8 }}
                  animate={{ opacity: 1, y: 0, rotate: 0 }}
                  transition={{ delay: i * 0.08, type: "spring" }}
                  className="relative w-28 overflow-hidden rounded-2xl bg-paper shadow-[var(--shadow-lift)]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={b.thumb} alt="" className={cx("aspect-[3/4] w-full object-cover", b.status === "wait" && "opacity-40 grayscale")} />
                  {b.status === "run" && (
                    <motion.div
                      className="absolute inset-x-0 h-10 bg-gradient-to-b from-transparent via-coral/50 to-transparent"
                      animate={{ top: ["-10%", "100%"] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                    />
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent p-2 text-left text-[0.65rem] font-semibold text-white">
                    {b.status === "ok" ? b.title : b.status === "err" ? "✕" : b.status === "run" ? "…" : ""}
                  </div>
                  {b.status === "ok" && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-mint text-white">
                      <Check className="size-3.5" strokeWidth={3} />
                    </motion.span>
                  )}
                  {b.status === "run" && <Loader2 className="absolute right-1.5 top-1.5 size-5 animate-spin text-coral" />}
                </motion.div>
              ))}
            </div>
            {bulk.every((b) => b.status === "ok" || b.status === "err") && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
                <Btn size="lg" onClick={() => { setMember(memberId); go({ name: "rewind" }); }}>{t("rewind")} →</Btn>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TargetOption({ on, onClick, title, sub }: { on: boolean; onClick: () => void; title: string; sub: string }) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "flex items-center gap-3 rounded-2xl border p-3 text-left transition",
        on ? "border-ink bg-paper shadow-[var(--shadow-soft)]" : "border-ink/10 bg-paper/50 hover:border-ink/25",
      )}
    >
      <span className={cx("grid size-5 place-items-center rounded-full border-2", on ? "border-coral" : "border-ink/20")}>
        {on && <motion.span layoutId="target-dot" className="size-2.5 rounded-full bg-coral" />}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold">{title}</span>
        <span className="block text-xs text-ink-3">{sub}</span>
      </span>
    </button>
  );
}

function ReviewMed({ m, i, onChange, onRemove }: { m: Medicine; i: number; onChange: (m: Medicine) => void; onRemove: () => void }) {
  const { lang, t } = useMemory();
  const [edit, setEdit] = useState(false);
  const low = m.confidence < 0.7;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.12 + i * 0.09, type: "spring", stiffness: 260, damping: 24 }}
      className={cx("card p-4", low && "ring-2 ring-amber/40")}
    >
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-canvas text-ink-2">
          <FormIcon form={m.form} className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          {edit ? (
            <input
              value={m.name}
              onChange={(e) => onChange({ ...m, name: e.target.value })}
              className="w-full rounded-lg border border-ink/15 bg-paper px-2 py-1 font-semibold outline-none focus:border-coral"
            />
          ) : (
            <div className="flex flex-wrap items-center gap-x-2">
              <span className="font-display text-[1.08rem] font-semibold">{m.name}</span>
              {m.strength && <span className="text-sm text-ink-3">{m.strength}</span>}
            </div>
          )}
          <div className="text-xs text-ink-3">
            {formLabel[lang][m.form]}
            {m.generic ? ` · ${m.generic}` : ""}
          </div>
          <div className="mt-1 text-sm text-ink-2">{m.purpose[lang]}</div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span className="mr-1 inline-flex items-center gap-1.5 font-mono text-[0.68rem] text-ink-3" title={t("confidence")}>
            <ConfidenceDot c={m.confidence} /> {Math.round(m.confidence * 100)}%
          </span>
          <button onClick={() => setEdit((e) => !e)} className="grid size-8 place-items-center rounded-full hover:bg-ink/5" aria-label={t("edit")}>
            {edit ? <Check className="size-4 text-mint" /> : <Pencil className="size-3.5 text-ink-3" />}
          </button>
          <button onClick={onRemove} className="grid size-8 place-items-center rounded-full hover:bg-rose-soft" aria-label="Remove">
            <X className="size-4 text-ink-3" />
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {m.sos ? (
          <Chip tone="amber">{t("asNeeded")}</Chip>
        ) : (
          SLOTS.map((s: Slot) => {
            const on = m.slots[s];
            if (!edit && !on) return null;
            return (
              <button
                key={s}
                disabled={!edit}
                onClick={() => onChange({ ...m, slots: { ...m.slots, [s]: !on } })}
                className={cx(
                  "rounded-full px-2.5 py-1 text-xs font-semibold transition",
                  on ? "bg-ink text-white" : "border border-dashed border-ink/20 text-ink-3",
                )}
              >
                {slotLabel[lang][s].name}
              </button>
            );
          })
        )}
        {edit ? (
          <select
            value={m.food}
            onChange={(e) => onChange({ ...m, food: e.target.value as Food })}
            className="rounded-full border border-ink/15 bg-paper px-2 py-1 text-xs font-semibold"
          >
            {(Object.keys(foodLabel.en) as Food[]).map((f) => (
              <option key={f} value={f}>
                {foodLabel[lang][f]}
              </option>
            ))}
          </select>
        ) : (
          <Chip tone="sky">{foodLabel[lang][m.food]}</Chip>
        )}
        {edit ? (
          <label className="inline-flex items-center gap-1 rounded-full border border-ink/15 bg-paper px-2 py-0.5 text-xs font-semibold">
            <input
              type="number"
              min={0}
              value={m.durationDays ?? ""}
              onChange={(e) => onChange({ ...m, durationDays: e.target.value ? Number(e.target.value) : null })}
              className="w-10 bg-transparent outline-none"
            />
            {lang === "hi" ? "दिन" : "days"}
          </label>
        ) : (
          <Chip>{m.durationDays ? t("forDays", { n: m.durationDays }) : t("ongoingMed")}</Chip>
        )}
        <span className="ml-auto font-mono text-[0.7rem] text-ink-3">
          {m.dose}
          {m.frequencyCode ? ` · ${m.frequencyCode}` : ""}
        </span>
      </div>
    </motion.div>
  );
}

function ScanIllustration() {
  return (
    <div className="relative h-36 w-28">
      <motion.div
        className="absolute inset-0 rounded-xl bg-paper shadow-[var(--shadow-lift)]"
        animate={{ rotate: [-6, -3, -6] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="paper-lines absolute inset-3 top-8 opacity-80" />
        <div className="absolute left-3 top-3 font-hand text-2xl text-coral" style={{ fontFamily: "Caveat" }}>
          ℞
        </div>
      </motion.div>
      <motion.div
        className="absolute inset-0 rounded-xl bg-paper shadow-[var(--shadow-lift)]"
        animate={{ rotate: [5, 8, 5], x: [10, 14, 10] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="space-y-2 p-3 pt-9">
          {[80, 60, 72, 50].map((w, i) => (
            <div key={i} className="h-1.5 rounded-full bg-sky/30" style={{ width: `${w}%` }} />
          ))}
        </div>
        <motion.div
          className="absolute inset-x-1 h-0.5 rounded-full bg-coral shadow-[0_0_12px_2px_rgba(47,163,70,.6)]"
          animate={{ top: ["12%", "88%", "12%"] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
      <motion.div
        className="absolute -right-6 -top-4 grid size-11 place-items-center rounded-2xl bg-coral text-white shadow-[var(--shadow-glow)]"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 2.2, repeat: Infinity }}
      >
        <ImagePlus className="size-5" />
      </motion.div>
    </div>
  );
}

function ScanningStage({ preview }: { preview: string }) {
  const { t } = useMemory();
  const steps = t("scanningSteps").split("|");
  const [k, setK] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setK((x) => Math.min(x + 1, steps.length - 1)), 1100);
    return () => clearInterval(id);
  }, [steps.length]);
  const boxes = [
    { l: "14%", t: "30%", w: "62%", h: "5%" },
    { l: "16%", t: "36%", w: "58%", h: "5%" },
    { l: "15%", t: "42%", w: "60%", h: "5%" },
    { l: "14%", t: "48%", w: "56%", h: "5%" },
    { l: "60%", t: "8%", w: "30%", h: "8%" },
  ];
  return (
    <div className="mx-auto grid max-w-4xl items-center gap-8 py-4 md:grid-cols-2 md:py-10">
      <div className="relative mx-auto w-full max-w-[360px]">
        <div className="relative overflow-hidden rounded-[26px] bg-ink shadow-[var(--shadow-lift)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="" className="w-full opacity-90" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(17,41,29,.0),rgba(17,41,29,.25))]" />
          {boxes.map((b, i) => (
            <motion.div
              key={i}
              className="absolute rounded-md border-2 border-coral/80 bg-coral/10"
              style={{ left: b.l, top: b.t, width: b.w, height: b.h }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [0, 1, 1, 0.6], scale: 1 }}
              transition={{ delay: 0.5 + i * 0.35, duration: 0.8 }}
            />
          ))}
          <motion.div
            className="absolute inset-x-0 h-24"
            style={{ background: "linear-gradient(to bottom, transparent, rgba(47,163,70,.35) 85%, rgba(47,163,70,.9) 100%)" }}
            animate={{ top: ["-25%", "100%"] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
          {[
            "left-3 top-3 border-l-2 border-t-2",
            "right-3 top-3 border-r-2 border-t-2",
            "bottom-3 left-3 border-b-2 border-l-2",
            "bottom-3 right-3 border-b-2 border-r-2",
          ].map((c) => (
            <motion.span
              key={c}
              className={cx("absolute size-8 rounded-[6px] border-white", c)}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            />
          ))}
        </div>
      </div>
      <div>
        <div className="text-xs font-semibold text-coral">Gemini · Vision</div>
        <h2 className="font-display mt-2 text-3xl font-semibold md:text-4xl">
          <span className="shimmer-text">{t("reading")}</span>
        </h2>
        <div className="mt-6 flex flex-col gap-3">
          {steps.map((s, i) => (
            <motion.div
              key={s}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: i <= k ? 1 : 0.35, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3"
            >
              <span className={cx("grid size-7 place-items-center rounded-full", i < k ? "bg-mint text-white" : i === k ? "bg-coral-soft text-coral" : "bg-ink/5 text-ink-3")}>
                {i < k ? <Check className="size-4" strokeWidth={3} /> : i === k ? <Loader2 className="size-4 animate-spin" /> : <span className="size-1.5 rounded-full bg-current" />}
              </span>
              <span className={cx("text-[0.98rem] font-semibold", i <= k ? "text-ink" : "text-ink-3")}>{s}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
