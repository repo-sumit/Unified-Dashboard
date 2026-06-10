import type { KpiRecord, Level } from "@/types";
import { deltaToneClass } from "@/lib/colors";
import { peerAvg, peerLevelOf } from "@/lib/peer";
import { buildTrend, getLastUpdatedLabel } from "@/lib/trend";
import { formatValue } from "@/lib/format";
import { useT, type Lang } from "@/i18n";
import { ValueDisplay } from "./ValueDisplay";
import { FrequencyDelta } from "./FrequencyDelta";
import { KpiCardShell, KpiCardHeader, KpiContextTile } from "./kpiCardParts";

/**
 * Single-metric KPI tile — compact, graph-free, row-based: header · value + delta ·
 * peer comparison + source footer. No metric-type labels (Rate/Count/Score) and no
 * "Parent avg" label — the entity name in the peer string is self-explanatory.
 * Build-trend used only for the delta; sparklines live on the KPI detail page only.
 */
export function KpiCard({
  rec, name, onClick, lang = "en", level, parentName,
}: { rec: KpiRecord; name: string; onClick?: () => void; lang?: Lang; level?: Level; parentName?: string }) {
  const { t } = useT();
  const kpi = rec.kpi;
  const na = rec.value == null;
  const trend = na || kpi.noTrend ? null : buildTrend(rec, lang);
  const isDelta = kpi.displayStrategy === "delta_cycle";
  const peerScore = level && peerLevelOf(level) ? peerAvg(kpi.id, level) : null;
  const isGsqac = kpi.id.startsWith("sq_");
  const valueTone = isGsqac ? undefined : !kpi.suppressDelta && trend?.delta ? deltaToneClass(trend.delta, kpi.direction) : "text-neutral-900";
  // Period label (Daily → date · Monthly → month · SAT → "Sep 2025").
  // Shown in the header frequency row — single source of truth, no duplication.
  const lastUpdated = kpi.showLastUpdatedOnUi ? getLastUpdatedLabel(kpi, new Date(), lang) : null;
  const hasPeer = !na && !!parentName && peerScore != null;
  const peerStr = peerScore != null ? `${parentName} · ${formatValue(peerScore, kpi.unit, lang)}` : "";

  return (
    <KpiCardShell onClick={onClick}>
      <KpiCardHeader title={name} frequency={kpi.frequency} context={lastUpdated} />

      {/* headline value + delta — no RATE/COUNT/SCORE/LATEST label above the value */}
      <div className="mt-3 flex items-baseline justify-between gap-2">
        <ValueDisplay value={rec.value} unit={kpi.unit} status={rec.status} direction={kpi.direction} isDelta={isDelta} lang={lang} size="lg" toneClass={valueTone} naLabel={t("common.na")} />
        {trend && !isDelta && !kpi.suppressDelta && trend.delta != null && trend.delta !== 0 ? (
          <FrequencyDelta delta={trend.delta} unit={kpi.unit} direction={kpi.direction} cadence={trend.cadence} lang={lang} />
        ) : null}
      </div>

      {/* footer — peer comparison (no label) + source, pinned to the foot */}
      <div className="mt-auto pt-3">
        {hasPeer ? (
          <div className="grid grid-cols-2 items-end gap-x-3">
            {/* peer N+1: entity name + value is self-explanatory — no "PARENT AVG" label */}
            <span className="min-w-0 block truncate text-xs font-semibold text-neutral-600" title={peerStr}>{peerStr}</span>
            <KpiContextTile label={t("common.source")} value={kpi.data_source} valueTitle={kpi.data_source} />
          </div>
        ) : (
          <KpiContextTile label={na ? t("common.na") : t("common.source")} value={na ? t("common.notTracked") : kpi.data_source} valueTitle={kpi.data_source} />
        )}
      </div>
    </KpiCardShell>
  );
}
