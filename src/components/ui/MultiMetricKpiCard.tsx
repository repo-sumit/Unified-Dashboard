import type { KpiRecord, Level } from "@/types";
import { deltaToneClass } from "@/lib/colors";
import { formatValue, resolveMetricLabel } from "@/lib/format";
import { peerAvg, peerLevelOf } from "@/lib/peer";
import { buildTrend, getLastUpdatedLabel } from "@/lib/trend";
import { shouldShowCardDelta } from "@/lib/displayPolicy";
import { useKpiMetrics } from "@/hooks";
import { useT, type Lang } from "@/i18n";
import { FrequencyDelta } from "./FrequencyDelta";
import { KpiCardShell, KpiCardHeader, KpiMetricRow } from "./kpiCardParts";
import { KpiCompareSection } from "./KpiCompareSection";
import { KpiCard } from "./KpiCard";

/**
 * Multi-metric indicator card (Teacher/Student attendance · att_report · SAT1/SAT2/ORF/
 * CET/CGMS · Average CPD Time Per Teacher) — compact, graph-free score table. Each
 * metric is one `KpiMetricRow` (resolved label · value · N+1 · policy-gated delta).
 * "% below hierarchy average" resolves to the current scope ("% below block average").
 * No source on cards; charts live on the KPI detail page only.
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
    <KpiCardShell onClick={onClick} compare={<KpiCompareSection kpi={kpi} />} metrics={metrics.length || 1}>
      <KpiCardHeader title={name} frequency={kpi.frequency} context={lastUpdated} />

      <div className="mt-2 divide-y divide-line/60">
        {metrics.length ? (
          metrics.map((m) => <MetricRow key={m.kpi.id} rec={m} level={level} parentName={parentName} lang={lang} />)
        ) : (
          <span className="block py-2 text-2xs text-neutral-400">{t("common.notTracked")}</span>
        )}
      </div>
    </KpiCardShell>
  );
}

/** One metric row — label resolved to the current scope level, delta only where allowed. */
function MetricRow({
  rec, level, parentName, lang,
}: { rec: KpiRecord; level?: Level; parentName?: string; lang: Lang }) {
  const kpi = rec.kpi;
  const na = rec.value == null;
  const showDelta = !na && shouldShowCardDelta(kpi);
  const trend = showDelta ? buildTrend(rec, lang) : null;
  const delta = trend?.delta ?? null;
  const peer = level && peerLevelOf(level) ? peerAvg(kpi.id, level) : null;
  const tone = na ? "text-rag-naText" : delta ? deltaToneClass(delta, kpi.direction) : "text-neutral-900";
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
