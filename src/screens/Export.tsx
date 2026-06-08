import type { KpiRecord } from "@/types";
import { useScope, useScorecard, useScopeStats } from "@/hooks";
import { statusFromScore } from "@/engine";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { rag } from "@/lib/colors";
import { pct, locNum, formatValue, formatDelta } from "@/lib/format";
import { peerAvg, peerGapOf, peerLevelOf } from "@/lib/peer";
import { gradeFor, GSQAC_BANDS } from "@/config/ratingBands";
import { CURRENT_PERIOD } from "@/config";
import { Card, SectionLabel, Badge, Button, ProgressBar } from "@/components/ui/atoms";
import { RatingRing } from "@/components/ui/RatingRing";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { Download, Sparkles } from "@/components/ui/Icon";

const PERIODIC = new Set(["Daily", "Weekly", "Monthly"]);

export default function Export() {
  const { entity, currentId } = useScope();
  const sc = useScorecard(currentId);
  const stats = useScopeStats(currentId);
  const { t, tn, lang } = useT();
  if (!entity || !sc) return null;

  const scored = sc.domainScores.filter((d) => d.weightage > 0);
  const periodNo = CURRENT_PERIOD().id.split("W")[1];
  const peerLevel = peerLevelOf(entity.level);
  const gsqacCoverage = stats && stats.schools > 0 && stats.gsqacReal < stats.schools ? stats : null;

  // N+1 (own vs next level up) for %/score level indicators
  const n1 = (rec: KpiRecord): string => {
    if (rec.value == null || !peerLevel) return "—";
    if (rec.kpi.context || rec.kpi.id.startsWith("sq_")) return "—";
    if (rec.kpi.unit !== "%" && rec.kpi.unit !== "score") return "—";
    const g = peerGapOf(rec.value, peerAvg(rec.kpi.id, entity.level), rec.kpi.direction);
    if (!g) return "—";
    return `${locNum(Math.round(g.peer), lang)}${rec.kpi.unit === "%" ? "%" : ""} (${formatDelta(g.gap, rec.kpi.unit === "%" ? "%" : "score", lang)})`;
  };
  // Δ by frequency: periodic → week-on-week; annual/half/twice → vs last cycle
  const deltaCol = (rec: KpiRecord): string => {
    if (rec.value == null) return "—";
    if (PERIODIC.has(rec.kpi.frequency ?? "")) return rec.deltaWoW != null ? formatDelta(rec.deltaWoW, rec.kpi.unit === "%" ? "%" : "score", lang) : "—";
    if (rec.kpi.id.startsWith("sq_")) return entity.meta.gsqac?.improvement != null ? formatDelta(entity.meta.gsqac.improvement, "%", lang) : "—";
    if (rec.kpi.context) return formatDelta(rec.value, "%", lang); // the value IS the cycle change
    return "—";
  };
  const valueCol = (rec: KpiRecord): string => {
    if (rec.value == null) return "NA";
    if (rec.kpi.id.startsWith("sq_")) return `${locNum(Math.round(rec.value), lang)} (${gradeFor(rec.value, GSQAC_BANDS).grade})`;
    if (rec.kpi.context) return formatDelta(rec.value, "%", lang);
    return formatValue(rec.value, rec.kpi.unit, lang);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 no-print">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-neutral-900 sm:text-2xl">{t("export.title")}</h1>
          <p className="mt-0.5 text-sm text-neutral-500">{t("export.generatedOn")} · {t("common.week")} {locNum(periodNo, lang)}</p>
        </div>
        <Button onClick={() => window.print()}><Download size={16} /> {t("export.download")}</Button>
      </div>

      <Card className="card-pad sm:p-6">
        {/* report header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-500 text-white text-sm font-extrabold">VSK</span>
              <div className="min-w-0">
                <div className="truncate text-base font-extrabold text-neutral-900" title={tn(entity.name, entity.name_gu)}>{tn(entity.name, entity.name_gu)}</div>
                <div className="truncate text-2xs text-neutral-400">{t(`levels.${entity.level}`)} · {sc.framework.name} · {t("common.week")} {locNum(periodNo, lang)}</div>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <RatingRing percent={sc.overallPercent} grade={sc.grade} size={104} stroke={10} lang={lang} sublabel={t("scorecard.inputComposite")} />
            {sc.grade && <RatingBadge grade={sc.grade} size="lg" />}
          </div>
        </div>

        {/* 4A domain summary */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-2xs uppercase tracking-wider text-neutral-400">
                <th className="py-2">{t("export.domain")}</th>
                <th className="py-2 text-right">{t("common.weightage")}</th>
                <th className="py-2 text-right">%</th>
                <th className="py-2 text-right">{t("scorecard.contribution")}</th>
                <th className="py-2 text-right">{t("kpi.statusLabel")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {scored.map((d) => (
                <tr key={d.domain.id}>
                  <td className="py-2.5 font-semibold text-neutral-800">{tn(d.domain.name, d.domain.name_gu)}</td>
                  <td className="py-2.5 text-right tabular-nums text-neutral-500">{Math.round(d.domain.weightage * 100)}%</td>
                  <td className={cn("py-2.5 text-right font-bold tabular-nums", d.percent == null ? "text-rag-naText" : rag(d.status).text)}>{d.percent == null ? "NA" : pct(d.percent, lang)}</td>
                  <td className="py-2.5 text-right tabular-nums text-neutral-600">{d.contribution.toFixed(1)}</td>
                  <td className="py-2.5 text-right"><Badge status={d.status} className="!text-2xs">{t(`status.${d.status}`)}</Badge></td>
                </tr>
              ))}
              <tr className="border-t-2 border-line">
                <td className="py-3 font-extrabold text-neutral-900">{t("scorecard.inputComposite")}</td>
                <td className="py-3 text-right tabular-nums text-neutral-500">100%</td>
                <td className={cn("py-3 text-right font-extrabold tabular-nums", rag(sc.status).text)}>{pct(sc.overallPercent, lang)}</td>
                <td className="py-3 text-right font-bold tabular-nums">{sc.overallPercent != null ? sc.overallPercent.toFixed(1) : "—"}</td>
                <td className="py-3 text-right">{sc.grade ? <RatingBadge grade={sc.grade} size="sm" celebrate={false} /> : "NA"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* full indicator detail per domain — every applicable indicator at this level */}
        {sc.domainScores.filter((d) => d.records.length > 0).map((d) => (
          <div key={d.domain.id} className="mt-6">
            <div className="flex items-center justify-between gap-2">
              <SectionLabel className="!mb-0">{tn(d.domain.name, d.domain.name_gu)}</SectionLabel>
              {d.percent != null && <span className={cn("text-sm font-extrabold tnum", rag(d.status).text)}>{pct(d.percent, lang)}{d.grade ? ` · ${d.grade}` : ""}</span>}
            </div>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-2xs uppercase tracking-wider text-neutral-400">
                    <th className="py-1.5 pr-2">{t("scorecard.indicators")}</th>
                    <th className="py-1.5 px-2 text-right">{t("kpi.current")}</th>
                    <th className="py-1.5 px-2 text-right">{peerLevel ? `${t(`levels.${peerLevel}`)} ${t("common.average")}` : t("common.average")}</th>
                    <th className="py-1.5 px-2 text-right">Δ</th>
                    <th className="py-1.5 pl-2">{t("common.source")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {d.records.map((rec) => (
                    <tr key={rec.kpi.id} className={cn(rec.kpi.hero && "bg-amber-50/40")}>
                      <td className="py-2 pr-2 font-medium text-neutral-800">
                        <span className="inline-flex items-center gap-1">
                          {rec.kpi.hero && <Sparkles size={11} className="shrink-0 text-amber-500" />}
                          {tn(rec.kpi.name, rec.kpi.name_gu)}
                        </span>
                        <span className="block text-2xs font-normal text-neutral-400">{t(`ogm.freq.${rec.kpi.frequency ?? "Latest"}`)}</span>
                      </td>
                      <td className={cn("py-2 px-2 text-right font-bold tnum", rec.value == null ? "text-rag-naText" : rag(rec.status).text)}>{valueCol(rec)}</td>
                      <td className="py-2 px-2 text-right tabular-nums text-neutral-500">{n1(rec)}</td>
                      <td className="py-2 px-2 text-right tabular-nums text-neutral-500">{deltaCol(rec)}</td>
                      <td className="py-2 pl-2 text-2xs text-neutral-400">{rec.kpi.data_source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {/* GSQAC live data */}
        {entity.meta.gsqac && (
          <div className="mt-6 border-t border-line pt-4">
            <SectionLabel>GSQAC · D1–D5</SectionLabel>
            {gsqacCoverage && gsqacCoverage.schools >= 2 && (
              <p className="mt-1 text-2xs text-neutral-400">{t("ogm.coverage", { real: locNum(gsqacCoverage.gsqacReal, lang), total: locNum(gsqacCoverage.schools, lang) })}</p>
            )}
            <div className="mt-2 grid grid-cols-5 gap-2">
              {Object.entries(entity.meta.gsqac.domains).map(([dk, v]) => (
                <div key={dk} className="text-center">
                  <div className="text-2xs font-semibold text-neutral-400">{dk}</div>
                  <ProgressBar value={v * 100} status={statusFromScore(v * 100)} className="my-1" height={6} />
                  <div className="text-xs font-bold tnum text-neutral-700">{pct(v * 100, lang)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="mt-4 text-2xs text-neutral-400">★ = {t("ogm.heroKpis")}. {t("export.note")}</p>
      </Card>
    </div>
  );
}
