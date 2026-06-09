import type { KpiRecord, Level, Unit } from "@/types";
import { rag, deltaToneClass } from "@/lib/colors";
import { peerAvg, peerLevelOf } from "@/lib/peer";
import { buildTrend, cadenceOf, snapshotContextKey, getLastUpdatedLabel } from "@/lib/trend";
import { getWorkingDateLabel, formatValue } from "@/lib/format";
import { useT, type Lang } from "@/i18n";
import { Sparkline } from "./Sparkline";
import { FrequencyDelta } from "./FrequencyDelta";
import { ValueDisplay } from "./ValueDisplay";
import { KpiCardShell, KpiCardHeader, KpiPrimary, KpiFooter, KpiContextTile } from "./kpiCardParts";

/** Headline metric label for a single-metric card — keeps the same label rhythm as the
 *  multi-metric cards' sub-metric labels (e.g. "Avg score") without inventing data. */
function headlineLabelKey(unit: Unit): string {
  switch (unit) {
    case "%": return "kpi.lblRate";
    case "count": return "kpi.lblCount";
    case "score": return "kpi.lblScore";
    default: return "kpi.lblValue";
  }
}

/**
 * Per-KPI tile — composed from the shared KPI-card shell so single-metric cards read
 * as the SAME product component as the multi-metric (SAT1/SAT2/ORF/CET/CGMS) cards:
 * identical header / primary / trend / footer rhythm. The footer is always filled with
 * two compact context tiles (parent N+1, source, last-updated) so a single-metric card
 * never leaves a blank middle or looks sparser than its richer neighbours.
 */
export function KpiCard({
  rec, name, onClick, lang = "en", level, parentName,
}: { rec: KpiRecord; name: string; onClick?: () => void; lang?: Lang; level?: Level; parentName?: string }) {
  const { t } = useT();
  const kpi = rec.kpi;
  const na = rec.value == null;
  const c = rag(rec.status);
  // snapshot/cycle indicators (e.g. SAT1/SAT2) get no time-trend graph — a cycle context line instead
  const trend = na || kpi.noTrend ? null : buildTrend(rec, lang);
  const isDelta = kpi.displayStrategy === "delta_cycle";
  const peerScore = level && peerLevelOf(level) ? peerAvg(kpi.id, level) : null;
  // main value colour follows the delta DIRECTION (up=green, down=red; lower-is-better
  // KPIs like absentees flip — handled by deltaToneClass via kpi.direction), neutral when
  // flat or suppressed. GSQAC keeps its grade/status tone (untouched).
  const isGsqac = kpi.id.startsWith("sq_");
  const valueTone = isGsqac ? undefined : !kpi.suppressDelta && trend?.delta ? deltaToneClass(trend.delta, kpi.direction) : "text-neutral-900";
  // Sheet-driven last-updated context (§3): Daily → date · Monthly → month · Yearly → year.
  const lastUpdated = kpi.showLastUpdatedOnUi ? getLastUpdatedLabel(kpi, new Date(), lang) : null;
  // blank-Delta sheet rows (e.g. "SAT reports downloaded"): no delta — show "as on <date>".
  const asOnLabel = kpi.suppressDelta ? (lastUpdated || getWorkingDateLabel(new Date(), lang)) : null;

  // ── footer: always two compact context tiles, drawn from already-available data ──
  const tiles: { label: string; value: string; title?: string }[] = [];
  if (!na && parentName && peerScore != null) {
    const pv = formatValue(peerScore, kpi.unit, lang);
    tiles.push({ label: t("kpi.parentAvgLabel"), value: `${parentName} · ${pv}`, title: `${parentName} · ${pv}` });
  }
  tiles.push({ label: t("common.source"), value: kpi.data_source, title: kpi.data_source });
  if (tiles.length < 2) {
    tiles.push({ label: t("kpi.frequencyLabel"), value: lastUpdated || asOnLabel || t("kpi.latestAvailable") });
  }
  const footer = tiles.slice(0, 2);

  return (
    <KpiCardShell onClick={onClick}>
      <KpiCardHeader title={name} frequency={kpi.frequency} context={asOnLabel ? null : lastUpdated} scheduleNote={kpi.scheduleNote} />

      {/* primary metric — label + value (+ delta / as-on), then the trend graph */}
      <KpiPrimary>
        <div>
          <span className="block text-2xs font-semibold uppercase tracking-wide text-neutral-400">{t(headlineLabelKey(kpi.unit))}</span>
          <div className="mt-0.5 flex items-end justify-between gap-2">
            <ValueDisplay value={rec.value} unit={kpi.unit} status={rec.status} direction={kpi.direction} isDelta={isDelta} lang={lang} size="lg" toneClass={valueTone} naLabel={t("common.na")} />
            {asOnLabel ? (
              <span className="pb-1 text-2xs font-semibold text-neutral-400">{t("kpi.asOnShort", { date: asOnLabel })}</span>
            ) : trend && !isDelta && trend.delta != null && trend.delta !== 0 ? (
              <FrequencyDelta delta={trend.delta} unit={kpi.unit} direction={kpi.direction} cadence={trend.cadence} lang={lang} className="pb-1" />
            ) : null}
          </div>
        </div>

        {/* frequency-appropriate trend graph (snapshot indicators show a context line instead) */}
        {trend && trend.points.length > 1 ? (
          <Sparkline data={trend.points.map((p) => p.value)} color={c.hex} height={32} responsive />
        ) : !na && kpi.noTrend ? (
          <span className="text-2xs text-neutral-400">{t(snapshotContextKey(cadenceOf(kpi.frequency)))}</span>
        ) : null}
      </KpiPrimary>

      {/* footer — two compact context tiles, same rhythm as the multi-metric sub-tiles */}
      <KpiFooter>
        {na ? (
          <KpiContextTile label={t("common.na")} value={t("common.notTracked")} />
        ) : (
          footer.map((tile, i) => <KpiContextTile key={i} label={tile.label} value={tile.value} valueTitle={tile.title} />)
        )}
        {na && <KpiContextTile label={t("common.source")} value={kpi.data_source} valueTitle={kpi.data_source} />}
      </KpiFooter>
    </KpiCardShell>
  );
}
