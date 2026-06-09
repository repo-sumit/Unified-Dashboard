import type { KpiRecord, Level } from "@/types";
import { cn } from "@/lib/cn";
import { rag, deltaToneClass } from "@/lib/colors";
import { formatValue } from "@/lib/format";
import { peerAvg, peerLevelOf } from "@/lib/peer";
import { buildTrend, getLastUpdatedLabel } from "@/lib/trend";
import { useKpiMetrics } from "@/hooks";
import { useT, type Lang } from "@/i18n";
import { Sparkline } from "./Sparkline";
import { FrequencyDelta } from "./FrequencyDelta";
import { NPlusOneLine } from "./NPlusOneLine";
import { ValueDisplay } from "./ValueDisplay";
import { KpiCardShell, KpiCardHeader, KpiPrimary, KpiFooter, KpiContextTile } from "./kpiCardParts";
import { KpiCard } from "./KpiCard";

/**
 * Multi-metric indicator card (SAT1/SAT2/ORF/CET/CGMS). Built from the SAME shared
 * KPI-card shell as the single-metric KpiCard, so 1-, 2- and 3-metric cards read as
 * one component: identical header / primary / trend / footer rhythm and outer height.
 *   • primary metric (label · big value · N+1 · delta · one sparkline)
 *   • a 2-up footer of compact sub-metric tiles; a dual-metric card fills the spare
 *     slot with a source context tile so it never looks shorter than a triple card.
 * Each sub-metric keeps the value/delta tone discipline (lower-is-better metrics like
 * "Below hierarchy avg" go green when they fall).
 */
export function MultiMetricKpiCard({
  rec, metrics, name, onClick, lang = "en", level, parentName,
}: {
  rec: KpiRecord;
  metrics: KpiRecord[];
  name: string;
  onClick?: () => void;
  lang?: Lang;
  level?: Level;
  parentName?: string;
}) {
  const { t } = useT();
  const kpi = rec.kpi;
  const [primary, ...secondary] = metrics;
  const lastUpdated = getLastUpdatedLabel(kpi, new Date(), lang);

  return (
    <KpiCardShell onClick={onClick}>
      <KpiCardHeader title={name} frequency={kpi.frequency} context={lastUpdated} scheduleNote={kpi.scheduleNote} />

      {/* PRIMARY metric — headline value + its trend */}
      <KpiPrimary>
        {primary ? (
          <MetricBlock rec={primary} level={level} parentName={parentName} lang={lang} variant="primary" />
        ) : (
          <span className="text-2xs text-neutral-400">{t("common.notTracked")}</span>
        )}
      </KpiPrimary>

      {/* FOOTER — compact sub-metric tiles; pad a dual-metric card's spare slot with source */}
      <KpiFooter>
        {secondary.map((m) => (
          <MetricBlock key={m.kpi.id} rec={m} level={level} parentName={parentName} lang={lang} variant="compact" />
        ))}
        {secondary.length < 2 && <KpiContextTile label={t("common.source")} value={kpi.data_source} valueTitle={kpi.data_source} />}
      </KpiFooter>
    </KpiCardShell>
  );
}

const COMPACT_SPARK = "#94A3B8"; // calm slate for the micro-sparklines (avoid colour overload)

function MetricBlock({
  rec, level, parentName, lang, variant,
}: {
  rec: KpiRecord;
  level?: Level;
  parentName?: string;
  lang: Lang;
  variant: "primary" | "compact";
}) {
  const { tn } = useT();
  const kpi = rec.kpi;
  const na = rec.value == null;
  const label = tn(kpi.name, kpi.name_gu);
  const trend = na ? null : buildTrend(rec, lang);
  const delta = trend?.delta ?? null;
  const peer = level && peerLevelOf(level) ? peerAvg(kpi.id, level) : null;
  const tone = na ? "text-rag-naText" : delta ? deltaToneClass(delta, kpi.direction) : "text-neutral-900";
  const pts = trend ? trend.points.map((p) => p.value) : [];

  if (variant === "primary") {
    const c = rag(rec.status);
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <span className="block text-2xs font-semibold uppercase tracking-wide text-neutral-400">{label}</span>
            <ValueDisplay value={rec.value} unit={kpi.unit} status={rec.status} direction={kpi.direction} lang={lang} size="lg" toneClass={tone} className="mt-0.5 block" />
          </div>
          <div className="flex shrink-0 flex-col items-end gap-0.5 pb-0.5">
            <NPlusOneLine parentName={parentName} value={peer} unit={kpi.unit} lang={lang} />
            {delta != null && delta !== 0 && (
              <FrequencyDelta delta={delta} unit={kpi.unit} direction={kpi.direction} cadence={trend!.cadence} lang={lang} />
            )}
          </div>
        </div>
        {pts.length > 1 && <Sparkline data={pts} color={c.hex} height={32} responsive />}
      </div>
    );
  }

  // compact secondary tile
  return (
    <div className="min-w-0 py-0.5">
      <span className="block truncate text-2xs font-semibold uppercase tracking-wide text-neutral-400">{label}</span>
      <span className={cn("block text-lg font-extrabold tnum leading-tight", tone)}>{na ? "—" : formatValue(rec.value, kpi.unit, lang)}</span>
      <NPlusOneLine parentName={parentName} value={peer} unit={kpi.unit} lang={lang} className="!text-[10px]" />
      <div className="mt-0.5 flex items-center justify-between gap-1">
        {delta != null && delta !== 0 ? (
          <FrequencyDelta delta={delta} unit={kpi.unit} direction={kpi.direction} cadence={trend!.cadence} lang={lang} />
        ) : <span />}
        {pts.length > 1 && <Sparkline data={pts} color={COMPACT_SPARK} width={56} height={16} strokeWidth={1.5} />}
      </div>
    </div>
  );
}

/**
 * Selector used wherever a KPI tile is rendered: a multi-metric indicator (kpi.metrics)
 * renders the MultiMetricKpiCard with its provider-driven sub-metric records; everything
 * else falls back to the standard single-value KpiCard. The hook is always called (with
 * an undefined id for single-metric KPIs) so hook order stays stable.
 */
export function KpiCardAuto({
  rec, name, onClick, lang = "en", level, parentName, currentId,
}: {
  rec: KpiRecord;
  name: string;
  onClick?: () => void;
  lang?: Lang;
  level?: Level;
  parentName?: string;
  currentId?: string | null;
}) {
  const isMulti = !!rec.kpi.metrics?.length;
  const metrics = useKpiMetrics(isMulti ? rec.kpi.id : undefined, currentId);
  if (isMulti && metrics.length) {
    return <MultiMetricKpiCard rec={rec} metrics={metrics} name={name} onClick={onClick} lang={lang} level={level} parentName={parentName} />;
  }
  return <KpiCard rec={rec} name={name} onClick={onClick} lang={lang} level={level} parentName={parentName} />;
}
