import type { KpiRecord, Level } from "@/types";
import { rag, deltaToneClass } from "@/lib/colors";
import { peerAvg, peerLevelOf } from "@/lib/peer";
import { buildTrend, getLastUpdatedLabel } from "@/lib/trend";
import { getWorkingDateLabel } from "@/lib/format";
import { useT, type Lang } from "@/i18n";
import { Card } from "./atoms";
import { Sparkline } from "./Sparkline";
import { ValueDisplay } from "./ValueDisplay";
import { FrequencyDelta } from "./FrequencyDelta";
import { NPlusOneLine } from "./NPlusOneLine";
import { FrequencyBadge } from "./DataBadges";
import { ChevronRight } from "./Icon";

/**
 * Compact, horizontal operational KPI card — a lightweight health-check tile for a
 * single-metric operational indicator (e.g. "SAT reports downloaded in classrooms").
 * Such a KPI looks sparse in the tall analytical card, so it gets its own slim row:
 *   left  → title + frequency + as-on / last-updated
 *   right → value, optional delta, N+1, with a small sparkline between (wide screens)
 * Shares the same atoms (FrequencyBadge, ValueDisplay, NPlusOneLine, FrequencyDelta) so
 * typography stays in the same family as the analytical cards.
 */
export function OperationalKpiCard({
  rec, name, onClick, lang = "en", level, parentName,
}: { rec: KpiRecord; name: string; onClick?: () => void; lang?: Lang; level?: Level; parentName?: string }) {
  const { t } = useT();
  const kpi = rec.kpi;
  const na = rec.value == null;
  const c = rag(rec.status);
  const trend = na || kpi.noTrend ? null : buildTrend(rec, lang);
  const peerScore = level && peerLevelOf(level) ? peerAvg(kpi.id, level) : null;
  const valueTone = !kpi.suppressDelta && trend?.delta ? deltaToneClass(trend.delta, kpi.direction) : "text-neutral-900";
  const lastUpdated = kpi.showLastUpdatedOnUi ? getLastUpdatedLabel(kpi, new Date(), lang) : null;
  const asOnLabel = kpi.suppressDelta ? (lastUpdated || getWorkingDateLabel(new Date(), lang)) : null;
  const pts = trend ? trend.points.map((p) => p.value) : [];
  const showDelta = !na && !asOnLabel && trend && trend.delta != null && trend.delta !== 0;

  return (
    <Card
      as="button"
      onClick={onClick}
      className="group card-pad flex w-full items-center gap-3 text-left transition-shadow hover:shadow-raised"
    >
      <div className="min-w-0 flex-1">
        <span className="block text-sm font-bold leading-snug text-neutral-900">{name}</span>
        <span className="mt-1 flex flex-wrap items-center gap-1.5">
          <FrequencyBadge frequency={kpi.frequency} />
          {asOnLabel ? (
            <span className="text-2xs font-semibold text-neutral-400">{t("kpi.asOnShort", { date: asOnLabel })}</span>
          ) : lastUpdated ? (
            <span className="text-2xs font-medium text-neutral-400">· {lastUpdated}</span>
          ) : null}
        </span>
      </div>

      {pts.length > 1 && (
        <div className="hidden shrink-0 items-center sm:flex">
          <Sparkline data={pts} color={c.hex} width={108} height={32} />
        </div>
      )}

      <div className="flex shrink-0 flex-col items-end">
        <ValueDisplay value={rec.value} unit={kpi.unit} status={rec.status} direction={kpi.direction} lang={lang} size="lg" toneClass={valueTone} naLabel={t("common.na")} />
        {showDelta && (
          <FrequencyDelta delta={trend!.delta} unit={kpi.unit} direction={kpi.direction} cadence={trend!.cadence} lang={lang} />
        )}
        <NPlusOneLine parentName={parentName} value={peerScore} unit={kpi.unit} lang={lang} className="text-right" />
      </div>

      <ChevronRight size={16} className="shrink-0 text-neutral-300 transition-transform group-hover:translate-x-0.5" />
    </Card>
  );
}
