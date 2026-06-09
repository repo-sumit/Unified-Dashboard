import { useNavigate, useParams } from "react-router-dom";
import { useScope, useKpiRecord, useKpiCascade, useFramework } from "@/hooks";
import { useT } from "@/i18n";
import { isImproving } from "@/engine";
import { cn } from "@/lib/cn";
import { rag, deltaToneClass } from "@/lib/colors";
import { formatValue, formatDelta, locNum } from "@/lib/format";
import { peerLevelOf } from "@/lib/peer";
import { buildTrend, deltaLabelKey, trendTitleKey } from "@/lib/trend";
import { gradeFor, GSQAC_BANDS } from "@/config/ratingBands";
import { Card, SectionLabel, Badge, DeltaPill, TrendArrow, EmptyNA } from "@/components/ui/atoms";
import { TrendChart } from "@/components/ui/TrendChart";
import { ComparisonBars, type CompareBar } from "@/components/ui/ComparisonBars";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { FrequencyBadge } from "@/components/ui/DataBadges";
import { ArrowLeft, Database } from "@/components/ui/Icon";

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
  const isGsqac = kpi.id.startsWith("sq_");
  const isContextDelta = kpi.displayStrategy === "delta_cycle";
  const peerLevel = peerLevelOf(entity.level);

  // "Students below hierarchy avg" → substitute the actual N+1 level name (e.g. "cluster")
  const parentLevelLabel = peerLevel ? t(`levels.${peerLevel}`) : null;
  let name = tn(kpi.name, kpi.name_gu);
  if (kpi.id === "asm_below" && parentLevelLabel) {
    name = lang === "gu" ? name.replace("સ્તર", parentLevelLabel) : name.replace(/\bhierarchy\b/i, parentLevelLabel.toLowerCase());
  }

  // frequency-aware trend (history + cadence + delta-vs-one-period-back)
  const trend = na ? null : buildTrend(rec, lang);

  const bars: CompareBar[] = cascade.map((row) => ({
    key: row.level,
    label: lang === "gu" ? row.label_gu : row.label,
    sublabel: lang === "gu" && row.entity.name_gu ? row.entity.name_gu : row.entity.name,
    value: row.value,
    status: row.status,
    isCurrent: row.isCurrent,
  }));
  const hasCascade = bars.filter((b) => b.value != null).length >= 2; // ≥2 ⇒ has ancestors (hidden at State)
  // N+1 — the immediate parent (next level up): its real name + score, consistent with the cards.
  const parentRow = cascade.length >= 2 ? cascade[cascade.length - 2] : null;

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
                <span className={cn("text-4xl font-extrabold tnum", isContextDelta ? deltaToneClass(rec.value, kpi.direction) : c.text)}>
                  {isContextDelta ? formatDelta(rec.value, "%", lang) : formatValue(rec.value, kpi.unit, lang)}
                </span>
                <TrendArrow trend={rec.trend} improving={improving} size={22} />
              </div>
            )}
            {/* N+1 — next level up: parent name + its real score (no ± delta) */}
            {parentRow && parentRow.value != null && (
              <p className="mt-1.5 text-xs text-neutral-500">
                {lang === "gu" && parentRow.entity.name_gu ? parentRow.entity.name_gu : parentRow.entity.name} · {formatValue(parentRow.value, kpi.unit, lang)}
              </p>
            )}
          </div>
          {/* single delta tag, wording derived from the indicator's frequency */}
          {trend && (
            <DeltaPill delta={trend.delta} unit={kpi.unit} direction={kpi.direction} lang={lang} label={t(deltaLabelKey(trend.cadence))} />
          )}
        </div>
      </Card>

      {/* TREND — frequency-correct: cadence-appropriate x-axis (daily 30d / months /
          cycles / half-years / years), never a fabricated weekly line for annual data */}
      {na || !trend ? (
        <EmptyNA hint={t("kpi.noData")} />
      ) : (
        <Card className="card-pad">
          <SectionLabel>{t(trendTitleKey(trend.cadence))}</SectionLabel>
          <div className="mt-2">
            <TrendChart
              points={trend.points}
              unit={kpi.unit}
              benchmark={isGsqac ? null : rec.benchmark}
              color={c.hex}
              cadence={trend.cadence}
              lang={lang}
            />
          </div>
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
