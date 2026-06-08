import type { LeaderboardEntry, Level } from "@/types";
import { cn } from "@/lib/cn";
import { rag, accent } from "@/lib/colors";
import { pct, locNum } from "@/lib/format";
import { useT } from "@/i18n";
import { getFramework } from "@/config";
import { INPUT_DOMAIN_IDS } from "@/config/frameworks";
import { Card, SectionLabel, StatusDot } from "./atoms";
import { RatingBadge } from "./RatingBadge";
import { ChevronRight, ArrowDownRight, AlertTriangle, Info } from "./Icon";

/**
 * Officer decision surface: the units below you that need attention first,
 * sorted by COMPOSITE RISK — the Input Composite (30% Attendance + 30%
 * Assessment + 40% Administration), lowest first. No ranks/medals; risk-first,
 * so the officer's eye lands on the weakest unit in the 6-second scan. The sort
 * is made transparent: the formula is on the header info, and each row shows
 * its 4A breakdown (accent dots tying back to the domain cards) so "why is this
 * ranked here?" is answerable at a glance. Reuses the child leaderboard.
 */
export function SchoolRiskTable({
  entries, childLevel, limit = 6, onOpen, onViewAll,
}: { entries: LeaderboardEntry[]; childLevel: Level; limit?: number; onOpen?: (id: string) => void; onViewAll?: () => void }) {
  const { t, tn, lang } = useT();
  const scored = entries.filter((e) => e.percent != null);
  if (scored.length === 0) return null;

  const worst = [...scored].sort((a, b) => (a.percent as number) - (b.percent as number)).slice(0, limit);
  const needAttention = scored.filter((e) => e.status === "red" || e.status === "amber").length;
  const title = childLevel === "school" ? t("ogm.riskSchools") : t("ogm.riskFocus");
  const inputDomains = getFramework().domains.filter((d) => (INPUT_DOMAIN_IDS as readonly string[]).includes(d.id));

  return (
    <Card className="card-pad">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <SectionLabel className="!mb-0 inline-flex items-center gap-1.5">
          {title}
          <button type="button" title={t("ogm.riskFormula")} aria-label={t("ogm.riskFormula")} className="inline-flex rounded-full text-neutral-300 hover:text-neutral-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300">
            <Info size={13} />
          </button>
        </SectionLabel>
        <div className="flex items-center gap-2">
          {needAttention > 0 && (
            <span className="chip bg-amber-50 text-amber-700">
              <AlertTriangle size={12} /> {t("ogm.offTrack", { n: locNum(needAttention, lang) })}
            </span>
          )}
          {onViewAll && (
            <button onClick={onViewAll} className="text-xs font-semibold text-primary-600 hover:underline">{t("common.viewAll")}</button>
          )}
        </div>
      </div>

      <ul className="-mx-2 divide-y divide-line/60">
        {worst.map((e) => {
          const c = rag(e.status);
          const dropping = e.deltaWoW != null && e.deltaWoW < -0.05;
          const breakdownTitle = inputDomains
            .map((d) => `${tn(d.name, d.name_gu)}: ${e.domainPercents?.[d.id] != null ? Math.round(e.domainPercents[d.id] as number) + "%" : "—"}`)
            .join(" · ");
          return (
            <li key={e.entity.id}>
              <button
                onClick={() => onOpen?.(e.entity.id)}
                className="group flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-neutral-50"
              >
                <StatusDot status={e.status} className="shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-neutral-800" title={tn(e.entity.name, e.entity.name_gu)}>
                    {tn(e.entity.name, e.entity.name_gu)}
                  </span>
                  {/* 4A breakdown behind the composite (accent dots tie to the domain cards) */}
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-2xs text-neutral-400" title={breakdownTitle}>
                    {inputDomains.map((d) => {
                      const v = e.domainPercents?.[d.id];
                      return (
                        <span key={d.id} className="inline-flex items-center gap-1 tnum">
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent(d.accent).hex }} />
                          {v == null ? "—" : locNum(Math.round(v), lang)}
                        </span>
                      );
                    })}
                    {dropping && (
                      <span className="inline-flex items-center font-semibold text-rag-redText">
                        <ArrowDownRight size={11} /> {locNum(Math.abs(Math.round((e.deltaWoW as number) * 10) / 10), lang)} {t("ogm.thisWeek")}
                      </span>
                    )}
                  </span>
                </span>
                <span className={cn("shrink-0 text-base font-extrabold tnum", c.text)}>{pct(e.percent, lang)}</span>
                {e.grade && <RatingBadge grade={e.grade} size="sm" className="shrink-0" />}
                <ChevronRight size={16} className="shrink-0 text-neutral-300 transition-transform group-hover:translate-x-0.5" />
              </button>
            </li>
          );
        })}
      </ul>

      {scored.length > worst.length && (
        <p className="mt-2 px-2 text-2xs text-neutral-400">
          {t("ogm.riskMore", { n: locNum(scored.length - worst.length, lang) })}
        </p>
      )}
    </Card>
  );
}
