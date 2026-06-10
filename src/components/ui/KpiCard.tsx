import type { KpiRecord, Level } from "@/types";
import { deltaToneClass } from "@/lib/colors";
import { peerAvg, peerLevelOf } from "@/lib/peer";
import { buildTrend, getLastUpdatedLabel } from "@/lib/trend";
import { formatValue } from "@/lib/format";
import { shouldShowCardDelta } from "@/lib/displayPolicy";
import { useT, type Lang } from "@/i18n";
import { ValueDisplay } from "./ValueDisplay";
import { FrequencyDelta } from "./FrequencyDelta";
import { KpiCardShell, KpiCardHeader } from "./kpiCardParts";
import { KpiCompareSection } from "./KpiCompareSection";

/**
 * Single-metric KPI tile — compact, graph-free, row-based: header (title +
 * frequency·date chip) · value (+ delta only where the display policy allows) ·
 * peer comparison. No source, no metric-type labels (Rate/Count/Score), no
 * "Parent avg" label — the entity name in the peer string is self-explanatory.
 * Date context lives in the header chip only, so it never repeats in the body.
 */
export function KpiCard({
  rec, name, onClick, lang = "en", level, parentName,
}: { rec: KpiRecord; name: string; onClick?: () => void; lang?: Lang; level?: Level; parentName?: string }) {
  const { t } = useT();
  const kpi = rec.kpi;
  const na = rec.value == null;
  const showDelta = !na && shouldShowCardDelta(kpi);
  const trend = showDelta ? buildTrend(rec, lang) : null;
  const peerScore = level && peerLevelOf(level) ? peerAvg(kpi.id, level) : null;
  const isGsqac = kpi.id.startsWith("sq_");
  // value colour follows the delta only when a delta is actually shown; otherwise neutral
  const valueTone = isGsqac ? undefined : trend?.delta ? deltaToneClass(trend.delta, kpi.direction) : "text-neutral-900";
  const lastUpdated = getLastUpdatedLabel(kpi, new Date(), lang) || null;
  const hasPeer = !na && !!parentName && peerScore != null;
  const peerStr = peerScore != null ? `${parentName} · ${formatValue(peerScore, kpi.unit, lang)}` : "";

  return (
    <KpiCardShell onClick={onClick} compare={<KpiCompareSection kpi={kpi} />}>
      <KpiCardHeader title={name} frequency={kpi.frequency} context={lastUpdated} />

      {/* headline value — delta beside it only for policy-allowed indicators */}
      <div className="mt-3 flex items-baseline justify-between gap-2">
        <ValueDisplay value={rec.value} unit={kpi.unit} status={rec.status} direction={kpi.direction} lang={lang} size="lg" toneClass={valueTone} naLabel={t("common.na")} />
        {trend && trend.delta != null && trend.delta !== 0 ? (
          <FrequencyDelta delta={trend.delta} unit={kpi.unit} direction={kpi.direction} cadence={trend.cadence} lang={lang} />
        ) : null}
      </div>

      {/* footer — the N+1 peer comparison, pinned to the foot (no source on cards) */}
      <div className="mt-auto pt-2.5">
        {hasPeer ? (
          <span className="block truncate text-xs font-semibold text-neutral-500" title={peerStr}>{peerStr}</span>
        ) : na ? (
          <span className="block text-2xs text-neutral-400">{t("common.notTracked")}</span>
        ) : null}
      </div>
    </KpiCardShell>
  );
}
