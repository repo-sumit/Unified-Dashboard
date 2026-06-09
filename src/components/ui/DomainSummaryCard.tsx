import { cn } from "@/lib/cn";
import type { DomainScore, KpiRecord, Level } from "@/types";
import { accent, deltaToneClass } from "@/lib/colors";
import { peerAvg } from "@/lib/peer";
import { buildTrend, getLastUpdatedLabel } from "@/lib/trend";
import { getWorkingDateLabel } from "@/lib/format";
import { useT } from "@/i18n";
import { Card } from "./atoms";
import { Icon, ChevronRight } from "./Icon";
import { ValueDisplay } from "./ValueDisplay";
import { FrequencyDelta } from "./FrequencyDelta";
import { NPlusOneLine } from "./NPlusOneLine";

/**
 * The canonical domain card.
 *  • `variant="home"` — the scorecard tile. Its primary value is the domain's
 *    HOMEPAGE indicator (`heroRec`, the sheet's green-flagged hero) — its value,
 *    unit, frequency-aware delta and N+1 — with the indicator label under the
 *    domain name. Falls back to the domain aggregate if no hero record is passed.
 *  • `variant="page"` — the expanded domain-page header. Same hero-indicator
 *    logic as `home`, just full-width, so the two are one family.
 * Status lives in the value colour — no "On track" text tags.
 */
export function DomainSummaryCard({
  ds, name, heroRec, heroName, level, delta, parentName, parentPercent, variant = "home", onClick,
}: {
  ds: DomainScore;
  name: string;
  heroRec?: KpiRecord | null;
  heroName?: string;
  level?: Level;
  delta?: number | null;
  parentName?: string;
  parentPercent?: number | null;
  variant?: "home" | "page";
  onClick?: () => void;
}) {
  const { t, lang } = useT();
  const a = accent(ds.domain.accent);

  // primary value = the domain's homepage (hero) indicator; falls back to the aggregate
  const useHero = !!heroRec;
  const trend = useHero && heroRec!.value != null ? buildTrend(heroRec!, lang) : null;
  const value = useHero ? heroRec!.value : ds.percent;
  const unit = useHero ? heroRec!.kpi.unit : "%";
  const status = useHero ? heroRec!.status : ds.status;
  const direction = useHero ? heroRec!.kpi.direction : "higher";
  const peerScore = useHero ? (level ? peerAvg(heroRec!.kpi.id, level) : null) : (parentPercent ?? null);
  const deltaVal = useHero ? (trend?.delta ?? null) : (delta ?? null);
  // SAT-reports-style indicators (blank-Delta sheet rows): show "as on <date>" instead
  // of a delta, here on the homepage domain card too (§2).
  const suppressDelta = useHero && !!heroRec!.kpi.suppressDelta;
  const asOnLabel = suppressDelta ? (getLastUpdatedLabel(heroRec!.kpi, new Date(), lang) || getWorkingDateLabel(new Date(), lang)) : null;
  const deltaEl = asOnLabel
    ? <span className="pb-1 text-2xs font-semibold text-neutral-400">{t("kpi.asOnShort", { date: asOnLabel })}</span>
    : deltaVal != null && deltaVal !== 0
      ? <FrequencyDelta delta={deltaVal} unit={unit} direction={direction} cadence={trend?.cadence ?? "daily"} showPeriod={useHero} lang={lang} className="pb-1" />
      : null;
  // main value colour follows delta direction (up=green / down=red, direction-aware), neutral
  // when flat — or when the delta is suppressed (as-on-date indicators stay neutral).
  const valueTone = !asOnLabel && deltaVal ? deltaToneClass(deltaVal, direction) : "text-neutral-900";

  if (variant === "page") {
    return (
      <Card className="card-pad">
        <div className="flex items-center gap-3">
          <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-2xl", a.bg)}>
            <Icon name={ds.domain.icon} className={a.icon} size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-extrabold text-neutral-900">{name}</h1>
            {heroName && <p className="truncate text-xs text-neutral-400">{heroName}</p>}
          </div>
          <div className="flex shrink-0 flex-col items-end">
            <ValueDisplay value={value} unit={unit} status={status} direction={direction} lang={lang} size="lg" naLabel={t("common.na")} toneClass={valueTone} />
            {deltaEl}
          </div>
        </div>
        <NPlusOneLine parentName={parentName} value={peerScore} unit={unit} lang={lang} className="mt-2" />
      </Card>
    );
  }

  return (
    <Card
      as="button"
      onClick={onClick}
      className="group card-pad flex w-full flex-col gap-2 text-left transition-shadow hover:shadow-raised"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="flex min-w-0 items-start gap-2">
          <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", a.bg)}>
            <Icon name={ds.domain.icon} className={a.icon} size={18} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-neutral-900">{name}</span>
            {heroName && <span className="block truncate text-2xs text-neutral-400">{heroName}</span>}
          </span>
        </span>
        <ChevronRight size={16} className="mt-0.5 shrink-0 text-neutral-300 transition-transform group-hover:translate-x-0.5" />
      </div>

      <div className="flex items-end justify-between gap-2">
        <ValueDisplay value={value} unit={unit} status={status} direction={direction} lang={lang} size="lg" naLabel={t("common.na")} toneClass={valueTone} />
        {deltaEl}
      </div>

      <NPlusOneLine parentName={parentName} value={peerScore} unit={unit} lang={lang} />
    </Card>
  );
}
