import type { KpiRecord, Level } from "@/types";
import { rag, deltaToneClass } from "@/lib/colors";
import { peerAvg, peerLevelOf } from "@/lib/peer";
import { buildTrend, cadenceOf, snapshotContextKey } from "@/lib/trend";
import { useT, type Lang } from "@/i18n";
import { Card } from "./atoms";
import { Sparkline } from "./Sparkline";
import { FrequencyDelta } from "./FrequencyDelta";
import { NPlusOneLine } from "./NPlusOneLine";
import { ValueDisplay } from "./ValueDisplay";
import { FrequencyBadge } from "./DataBadges";
import { ChevronRight } from "./Icon";

/**
 * Per-KPI tile — composed entirely from the shared metric atoms (ValueDisplay,
 * FrequencyDelta, NPlusOneLine) so it stays in the same visual family as the
 * domain cards and any change here propagates everywhere. KPI-only additions: a
 * frequency-appropriate trend graph and the N+1 parent line. Change-delta KPIs
 * (YoY/cycle improvement) show a signed value and skip the redundant inline delta.
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
  // flat. GSQAC keeps its grade/status tone (untouched).
  const isGsqac = kpi.id.startsWith("sq_");
  const valueTone = isGsqac ? undefined : trend?.delta ? deltaToneClass(trend.delta, kpi.direction) : "text-neutral-900";
  // Daily KPIs: show the latest data date (the last daily trend point, e.g. "1 Jun") next to the badge
  const isDaily = cadenceOf(kpi.frequency) === "daily";
  const latestDate = isDaily && trend && trend.points.length ? trend.points[trend.points.length - 1].x : null;

  return (
    <Card
      as="button"
      onClick={onClick}
      className="group card-pad flex w-full flex-col gap-2 text-left transition-shadow hover:shadow-raised"
    >
      {/* identity + frequency badge (from KPI config) */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="block text-sm font-bold leading-snug text-neutral-900">{name}</span>
          <span className="mt-1 flex flex-wrap items-center gap-1.5">
            <FrequencyBadge frequency={kpi.frequency} />
            {latestDate && <span className="text-2xs font-medium text-neutral-400">· {latestDate}</span>}
            {kpi.scheduleNote && <span className="text-2xs font-medium text-neutral-400">{kpi.scheduleNote}</span>}
          </span>
        </div>
        <ChevronRight size={16} className="mt-0.5 shrink-0 text-neutral-300 transition-transform group-hover:translate-x-0.5" />
      </div>

      {/* value + inline direction-aware frequency delta */}
      <div className="flex items-end justify-between gap-2">
        <ValueDisplay value={rec.value} unit={kpi.unit} status={rec.status} direction={kpi.direction} isDelta={isDelta} lang={lang} size="lg" toneClass={valueTone} />
        {trend && !isDelta && trend.delta != null && trend.delta !== 0 && (
          <FrequencyDelta delta={trend.delta} unit={kpi.unit} direction={kpi.direction} cadence={trend.cadence} lang={lang} className="pb-1" />
        )}
      </div>

      {/* frequency-appropriate trend graph (snapshot indicators show a cycle context line instead) */}
      {trend && trend.points.length > 1 ? (
        <Sparkline data={trend.points.map((p) => p.value)} color={c.hex} height={30} responsive />
      ) : !na && kpi.noTrend ? (
        <span className="text-2xs text-neutral-400">{t(snapshotContextKey(cadenceOf(kpi.frequency)))}</span>
      ) : null}

      {/* N+1: parent entity name + this KPI's score at the parent level */}
      {na ? (
        <span className="text-2xs text-neutral-400">{t("common.notTracked")}</span>
      ) : (
        <NPlusOneLine parentName={parentName} value={peerScore} unit={kpi.unit} lang={lang} signed={isDelta} />
      )}
    </Card>
  );
}
