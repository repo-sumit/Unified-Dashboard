import { useNavigate, useParams } from "react-router-dom";
import { useScope, useKpiRecord, useKpiCascade, useFramework } from "@/hooks";
import { useT } from "@/i18n";
import { isImproving } from "@/engine";
import { cn } from "@/lib/cn";
import { rag } from "@/lib/colors";
import { formatValue, formatDelta, locNum } from "@/lib/format";
import { peerAvg, peerGapOf, peerLevelOf } from "@/lib/peer";
import { gradeFor, GSQAC_BANDS } from "@/config/ratingBands";
import { Card, SectionLabel, Badge, DeltaPill, TrendArrow, EmptyNA } from "@/components/ui/atoms";
import { TrendChart } from "@/components/ui/TrendChart";
import { ComparisonBars, type CompareBar } from "@/components/ui/ComparisonBars";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { FrequencyBadge } from "@/components/ui/DataBadges";
import { ArrowLeft, Database } from "@/components/ui/Icon";

const PERIODIC = new Set(["Daily", "Weekly", "Monthly"]);

export default function KpiDetail() {
  const { kpiId } = useParams();
  const { entity, currentId } = useScope();
  const fw = useFramework();
  const rec = useKpiRecord(kpiId, currentId);
  const cascade = useKpiCascade(kpiId, currentId);
  const { t, tn, lang } = useT();
  const navigate = useNavigate();

  if (!rec || !entity) return null;
  const kpi = rec.kpi;
  const c = rag(rec.status);
  const na = rec.value == null;
  const improving = isImproving(rec.trend, kpi.direction);
  const domain = fw.domains.find((d) => d.id === kpi.domain_id);
  const name = tn(kpi.name, kpi.name_gu);
  const isGsqac = kpi.id.startsWith("sq_");
  const isContextDelta = kpi.displayStrategy === "delta_cycle";
  const periodic = PERIODIC.has(kpi.frequency ?? "");

  // N+1 peer comparison (own vs next level up). Skipped for State, counts/ratios,
  // cycle deltas, and GSQAC (real value has no real next-level-up baseline in mock).
  const peerLevel = peerLevelOf(entity.level);
  const canPeer = !na && (kpi.unit === "%" || kpi.unit === "score") && !isContextDelta && !isGsqac;
  const peer = canPeer && peerLevel ? peerGapOf(rec.value, peerAvg(kpi.id, entity.level), kpi.direction) : null;

  // cycle-over-cycle delta for annual/half/twice cadences (no fabricated weekly line)
  const cycleDelta = isGsqac
    ? entity.meta.gsqac?.improvement ?? null
    : isContextDelta
      ? rec.value
      : null;

  const bars: CompareBar[] = cascade.map((row) => ({
    key: row.level,
    label: lang === "gu" ? row.label_gu : row.label,
    sublabel: lang === "gu" && row.entity.name_gu ? row.entity.name_gu : row.entity.name,
    value: row.value,
    status: row.status,
    isCurrent: row.isCurrent,
  }));
  const hasCascade = bars.filter((b) => b.value != null).length >= 2; // ≥2 ⇒ has ancestors (hidden at State)

  return (
    <div className="space-y-5 animate-fade-in">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm font-semibold text-neutral-500 hover:text-primary-600">
        <ArrowLeft size={16} /> {t("common.back")}
      </button>

      {/* header + current value */}
      <Card className="card-pad">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {domain && <p className="text-xs font-semibold text-primary-600">{tn(domain.name, domain.name_gu)}</p>}
            <h1 className="text-lg font-extrabold text-neutral-900">{name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <FrequencyBadge frequency={kpi.frequency} />
              <span className="inline-flex max-w-full items-center gap-1 truncate text-2xs text-neutral-400" title={kpi.data_source}>
                <Database size={11} className="shrink-0" /> <span className="truncate">{kpi.data_source}</span>
              </span>
            </div>
          </div>
          <Badge status={rec.status}>{t(`status.${rec.status}`)}</Badge>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-x-6 gap-y-3">
          <div className="min-w-0">
            <SectionLabel>{t("kpi.current")}</SectionLabel>
            {na ? (
              <div className="mt-1 text-4xl font-extrabold text-rag-naText">{t("common.na")}</div>
            ) : isGsqac ? (
              <div className="mt-1 flex items-center gap-2">
                <span className="text-4xl font-extrabold tnum text-neutral-900">{locNum(Math.round(rec.value as number), lang)}</span>
                <RatingBadge grade={gradeFor(rec.value as number, GSQAC_BANDS).grade} size="md" />
              </div>
            ) : (
              <div className="mt-1 flex items-end gap-2">
                <span className={cn("text-4xl font-extrabold tnum", isContextDelta ? (improving ? "text-rag-greenText" : "text-rag-redText") : c.text)}>
                  {isContextDelta ? formatDelta(rec.value, "%", lang) : formatValue(rec.value, kpi.unit, lang)}
                </span>
                <TrendArrow trend={rec.trend} improving={improving} size={22} />
              </div>
            )}
            {/* N+1 peer comparison — replaces the old "vs benchmark" copy */}
            {peer && peerLevel && (
              <p className="mt-1.5 text-xs text-neutral-500">
                {t(`levels.${peerLevel}`)} {locNum(Math.round(peer.peer), lang)}{kpi.unit === "%" ? "%" : ""} ·{" "}
                <span className={cn("font-semibold", peer.ahead ? "text-rag-greenText" : "text-rag-redText")}>
                  {formatDelta(peer.gap, kpi.unit === "%" ? "%" : "score", lang)} {peer.ahead ? t("scorecard.ahead") : t("scorecard.behind")}
                </span>
              </p>
            )}
            {(isContextDelta || isGsqac) && <p className="mt-1.5 text-xs text-neutral-500">{t("scorecard.vsLastCycle")}</p>}
          </div>
          {!na && periodic && (
            <div className="flex gap-2">
              <DeltaPill delta={rec.deltaWoW} unit={kpi.unit} direction={kpi.direction} lang={lang} label={t("kpi.deltaWoW")} />
              <DeltaPill delta={rec.deltaMoM} unit={kpi.unit} direction={kpi.direction} lang={lang} label={t("kpi.deltaMoM")} />
            </div>
          )}
        </div>

        {/* the "why" story */}
        <div className={cn("mt-4 rounded-xl px-4 py-3 text-sm font-medium", c.soft, c.text)}>
          {lang === "gu" ? rec.remark_gu : rec.remark}
        </div>
      </Card>

      {/* TREND — frequency-aware (B): periodic → trend line; annual/half/twice → cycle view */}
      {na ? (
        <EmptyNA hint={t("kpi.noData")} />
      ) : periodic && rec.series.length > 1 ? (
        <Card className="card-pad">
          <SectionLabel>{kpi.frequency === "Daily" ? t("kpi.trend30d") : kpi.frequency === "Monthly" ? t("kpi.trendMonthly") : t("kpi.recentTrend")}</SectionLabel>
          <div className="mt-2"><TrendChart record={rec} lang={lang} /></div>
        </Card>
      ) : (
        <Card className="card-pad">
          <SectionLabel>{t("kpi.cycleTitle")}</SectionLabel>
          <div className="mt-2 flex flex-wrap items-end gap-x-8 gap-y-3">
            <div>
              <p className="text-2xs uppercase tracking-wide text-neutral-400">{t("kpi.thisCycle")}</p>
              <p className={cn("text-2xl font-extrabold tnum", c.text)}>
                {isContextDelta ? formatDelta(rec.value, "%", lang) : isGsqac ? locNum(Math.round(rec.value as number), lang) : formatValue(rec.value, kpi.unit, lang)}
              </p>
            </div>
            {cycleDelta != null && (
              <div>
                <p className="text-2xs uppercase tracking-wide text-neutral-400">{t("scorecard.vsLastCycle")}</p>
                <p className={cn("text-2xl font-extrabold tnum", cycleDelta >= 0 ? "text-rag-greenText" : "text-rag-redText")}>{formatDelta(cycleDelta, "%", lang)}</p>
              </div>
            )}
          </div>
          <p className="mt-3 text-2xs text-neutral-400">{t("kpi.annualSnapshot")}</p>
        </Card>
      )}

      {/* CROSS-LEVEL COMPARISON (C) — own + ancestors up to State; hidden for a State user */}
      {hasCascade && (
        <Card className="card-pad">
          <SectionLabel>{t("kpi.cascadeTitle", { name })}</SectionLabel>
          {kpi.unit === "count" && <p className="mt-0.5 text-2xs text-neutral-400">{t("compare.perSchool")}</p>}
          <div className="mt-4">
            <ComparisonBars bars={bars} unit={kpi.unit} lang={lang} />
          </div>
        </Card>
      )}

      {/* HOW IT'S CALCULATED */}
      {kpi.formula && (
        <Card className="card-pad">
          <SectionLabel>{t("kpi.formula")}</SectionLabel>
          <p className="mt-2 text-sm text-neutral-700">{kpi.formula}</p>
          {kpi.dataLagNote && <p className="mt-2 text-2xs text-neutral-400">{kpi.dataLagNote}</p>}
          {kpi.lowestLevel && <p className="mt-1 text-2xs text-neutral-400">{t("kpi.lowestLevelNote", { level: t(`levels.${kpi.lowestLevel}`) })}</p>}
        </Card>
      )}
    </div>
  );
}
