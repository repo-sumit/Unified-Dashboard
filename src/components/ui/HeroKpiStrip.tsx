import type { KpiRecord, Level, RagStatus } from "@/types";
import { cn } from "@/lib/cn";
import { rag } from "@/lib/colors";
import { formatValue, formatDelta, locNum, pct } from "@/lib/format";
import { peerAvg, peerGapOf, peerLevelOf } from "@/lib/peer";
import { gradeFor, GSQAC_BANDS } from "@/config/ratingBands";
import { useT } from "@/i18n";
import { isImproving, statusFromGrade } from "@/engine";
import { Card, StatusDot, ProgressBar } from "./atoms";
import { Sparkline } from "./Sparkline";
import { RatingBadge } from "./RatingBadge";
import { FrequencyBadge } from "./DataBadges";
import { Info } from "./Icon";

/**
 * "What to act on" — the official green-flagged HERO indicators (config-driven
 * via `kpi.hero`): deliberately the intervention/action levers, not vanity
 * headline numbers. Ordered most-at-risk first (live), each FREQUENCY-AWARE
 * (daily → trend; monthly → compliance; half/twice-yearly → cycle delta; yearly
 * → snapshot + GSQAC grade; counts → count + rate; ratio → x / target). The N+1
 * comparison shows as a relative gap; at State (no parent) it falls back to
 * vs-previous-period. Demo / data-lake honesty badges are carried verbatim.
 */
const STATUS_RANK: Record<RagStatus, number> = { red: 0, amber: 1, green: 2, na: 3 };

/** GSQAC (sq_*) status comes from its official GRADE band, not the generic 85/65
 *  RAG — so the status dot can never disagree with the grade badge beside it. */
function heroStatus(rec: KpiRecord): RagStatus {
  if (rec.kpi.id.startsWith("sq_") && rec.value != null) {
    return statusFromGrade(gradeFor(rec.value, GSQAC_BANDS).group ?? "D");
  }
  return rec.status;
}

export function HeroKpiStrip({
  records, level, enrolment, onOpen,
}: { records: KpiRecord[]; level: Level; enrolment?: number; onOpen?: (rec: KpiRecord) => void }) {
  const { t } = useT();
  const heroes = records
    .filter((r) => r.kpi.hero && r.value != null)
    // most-at-risk first: red → amber → green, then lowest achievement, then catalog order
    .sort((a, b) => {
      const s = STATUS_RANK[heroStatus(a)] - STATUS_RANK[heroStatus(b)];
      if (s !== 0) return s;
      const ach = (a.achievement ?? 101) - (b.achievement ?? 101);
      if (ach !== 0) return ach;
      return a.kpi.sort_order - b.kpi.sort_order;
    });
  if (!heroes.length) return null;

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-2">
        <p className="section-title !mb-0">{t("ogm.heroKpis")}</p>
        <span className="text-2xs text-neutral-400">{t("ogm.heroKpisHint")}</span>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
        {heroes.map((rec) => (
          <HeroTile key={rec.kpi.id} rec={rec} level={level} enrolment={enrolment} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}

function HeroTile({
  rec, level, enrolment, onOpen,
}: {
  rec: KpiRecord;
  level: Level;
  enrolment?: number;
  onOpen?: (rec: KpiRecord) => void;
}) {
  const { t, tn, lang } = useT();
  const kpi = rec.kpi;
  const ds = heroStatus(rec);
  const c = rag(ds);
  const v = rec.value as number;
  const strat = kpi.displayStrategy;
  const isContextDelta = strat === "delta_cycle";
  const improving = isContextDelta ? (kpi.direction === "higher" ? v >= 0 : v <= 0) : isImproving(rec.trend, kpi.direction);

  // N+1 comparison — for level/rate indicators (%/score). At State (no parent)
  // fall back to vs-previous-period. Skipped for counts/ratios, cycle deltas, and
  // GSQAC (sq_*: real data has no real next-level-up baseline in the mock — the
  // grade is the signal, not a delta vs a synthetic figure).
  const showPeer = (kpi.unit === "%" || kpi.unit === "score") && !isContextDelta && !kpi.id.startsWith("sq_");
  const peerLevel = peerLevelOf(level);
  const peer = showPeer && peerLevel ? peerGapOf(v, peerAvg(kpi.id, level), kpi.direction) : null;
  // State fallback only for genuinely period-to-period cadences — never an annual
  // metric (where a "vs last week" delta would be fabricated noise).
  const allowPrevFallback = kpi.frequency === "Daily" || kpi.frequency === "Weekly" || kpi.frequency === "Monthly";
  const target = (kpi.target ?? "").replace(/[^0-9]/g, "") || "2";
  const chronicRate = kpi.unit === "count" && enrolment && enrolment > 0 ? (v / enrolment) * 100 : null;

  return (
    <Card
      as="button"
      onClick={() => onOpen?.(rec)}
      className="card-pad group flex w-full flex-col gap-2 text-left transition-shadow hover:shadow-raised"
    >
      <div className="flex items-start justify-between gap-1.5">
        <span className="flex min-w-0 items-center gap-1.5">
          <StatusDot status={ds} />
          <span className="line-clamp-2 text-2xs font-semibold leading-tight text-neutral-600">{tn(kpi.name, kpi.name_gu)}</span>
        </span>
        <FrequencyBadge frequency={kpi.frequency} className="shrink-0" />
      </div>

      {/* PRIMARY — frequency-aware */}
      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          {isContextDelta ? (
            <span className={cn("text-2xl font-extrabold tnum", improving ? "text-rag-greenText" : "text-rag-redText")}>
              {formatDelta(v, "%", lang)}
            </span>
          ) : kpi.unit === "ratio" ? (
            <span className={cn("text-2xl font-extrabold tnum", c.text)}>
              {locNum(v, lang)}<span className="text-sm font-bold text-neutral-400"> / {locNum(target, lang)}</span>
            </span>
          ) : kpi.id === "sq_gsqac" ? (
            <span className="flex items-center gap-1.5">
              <span className="text-2xl font-extrabold tnum text-neutral-900">{locNum(Math.round(v), lang)}</span>
              <RatingBadge grade={gradeFor(v, GSQAC_BANDS).grade} size="sm" />
            </span>
          ) : (
            <span className={cn("text-2xl font-extrabold tnum", c.text)}>{formatValue(v, kpi.unit, lang)}</span>
          )}
        </div>
        {strat === "trend_30d" && rec.series.length > 1 && (
          <Sparkline data={rec.series.map((s) => s.value)} color={c.hex} width={64} height={26} />
        )}
      </div>

      {strat === "compliance" && <ProgressBar value={v} status={rec.status} height={5} />}

      {/* SECONDARY — N+1 / vs-cycle / count-rate / vs-target */}
      {peer && peerLevel ? (
        <span className="text-2xs text-neutral-400">
          {t(`levels.${peerLevel}`)} {locNum(Math.round(peer.peer), lang)}{kpi.unit === "%" ? "%" : ""} ·{" "}
          <span className={cn("font-semibold", peer.ahead ? "text-rag-greenText" : "text-rag-redText")}>
            {formatDelta(peer.gap, kpi.unit === "%" ? "%" : "score", lang)} {peer.ahead ? t("scorecard.ahead") : t("scorecard.behind")}
          </span>
          {kpi.id === "ret_reenroll" && <> · {t("ogm.vsTarget")}</>}
        </span>
      ) : showPeer && !peerLevel && allowPrevFallback && rec.deltaWoW != null ? (
        // State fallback: no next level up → compare to the previous period
        <span className="text-2xs text-neutral-400">
          {t("ogm.vsPrevPeriod")}{" "}
          <span className={cn("font-semibold", isImproving(rec.trend, kpi.direction) ? "text-rag-greenText" : rec.deltaWoW === 0 ? "text-neutral-400" : "text-rag-redText")}>
            {formatDelta(rec.deltaWoW, kpi.unit === "%" ? "%" : "score", lang)}
          </span>
          {kpi.id === "ret_reenroll" && <> · {t("ogm.vsTarget")}</>}
        </span>
      ) : kpi.id === "ret_reenroll" ? (
        <span className="text-2xs text-neutral-400">{t("ogm.vsTarget")}</span>
      ) : isContextDelta ? (
        <span className="text-2xs text-neutral-400">{t("scorecard.vsLastCycle")}</span>
      ) : kpi.unit === "count" ? (
        <span className="text-2xs text-neutral-400">
          {chronicRate != null ? `${pct(chronicRate, lang)} ${t("ogm.ofEnrolled")}` : t("ogm.studentsCount")}
        </span>
      ) : kpi.unit === "ratio" ? (
        <span className="text-2xs text-neutral-400">{t("ogm.perMonthMax2")}</span>
      ) : null}

      {/* data-lag caveat (e.g. dropout / re-enrolment confirmed next year via CTS) */}
      {kpi.dataLagNote && (
        <span title={kpi.dataLagNote} aria-label={kpi.dataLagNote} className="mt-0.5 inline-flex w-fit text-neutral-300">
          <Info size={12} />
        </span>
      )}
    </Card>
  );
}
