import type { KpiRecord, Level } from "@/types";
import { deltaToneClass } from "@/lib/colors";
import { formatValue, resolveMetricLabel } from "@/lib/format";
import { peerAvg, peerLevelOf } from "@/lib/peer";
import { buildTrend, getLastUpdatedLabel } from "@/lib/trend";
import { useKpiMetrics } from "@/hooks";
import { useT, type Lang } from "@/i18n";
import { FrequencyDelta } from "./FrequencyDelta";
import { KpiCardShell, KpiCardHeader, KpiMetricRow, KpiSourceLine } from "./kpiCardParts";
import { KpiCard } from "./KpiCard";

/**
 * Multi-metric indicator card (SAT1/SAT2/ORF/CET/CGMS/att_report) — compact, graph-free
 * score table. Each metric is one `KpiMetricRow` (resolved label · value · N+1 · delta).
 * "Below hierarchy avg" is resolved to the current scope level (e.g. "Below block avg").
 * No sparklines; charts live on the KPI detail page only.
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
  const lastUpdated = getLastUpdatedLabel(kpi, new Date(), lang);

  return (
    <KpiCardShell onClick={onClick}>
      <KpiCardHeader title={name} frequency={kpi.frequency} context={lastUpdated} />

      <div className="mt-2 divide-y divide-line/60">
        {metrics.length ? (
          metrics.map((m) => <MetricRow key={m.kpi.id} rec={m} level={level} parentName={parentName} lang={lang} />)
        ) : (
          <span className="block py-2 text-2xs text-neutral-400">{t("common.notTracked")}</span>
        )}
      </div>

      <KpiSourceLine label={t("common.source")} source={kpi.data_source} />
    </KpiCardShell>
  );
}

/** One metric row — resolves "Below hierarchy avg" to "Below {level} avg" dynamically. */
function MetricRow({
  rec, level, parentName, lang,
}: { rec: KpiRecord; level?: Level; parentName?: string; lang: Lang }) {
  const kpi = rec.kpi;
  const na = rec.value == null;
  const trend = na ? null : buildTrend(rec, lang);
  const delta = trend?.delta ?? null;
  const peer = level && peerLevelOf(level) ? peerAvg(kpi.id, level) : null;
  const tone = na ? "text-rag-naText" : delta ? deltaToneClass(delta, kpi.direction) : "text-neutral-900";
  // Resolve "hierarchy" → current scope level (e.g. "Below block avg" at block level).
  const label = resolveMetricLabel(kpi.name, kpi.name_gu, level ?? "school", lang);

  return (
    <KpiMetricRow
      label={label}
      value={na ? "—" : formatValue(rec.value, kpi.unit, lang)}
      valueTone={tone}
      parentLabel={parentName && peer != null ? `${parentName} · ${formatValue(peer, kpi.unit, lang)}` : null}
      delta={delta != null && delta !== 0 ? (
        <FrequencyDelta delta={delta} unit={kpi.unit} direction={kpi.direction} cadence={trend!.cadence} lang={lang} />
      ) : null}
    />
  );
}

/**
 * Selector: multi-metric indicator → MultiMetricKpiCard; everything else → KpiCard.
 * Hook is always called (with undefined id for single-metric) to preserve stable order.
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
