import { useState } from "react";
import type { KpiDef, Unit } from "@/types";
import { cn } from "@/lib/cn";
import { compareBarStatus } from "@/lib/colors";
import { resolveMetricLabel } from "@/lib/format";
import { useScope, useKpiChildSeries } from "@/hooks";
import { useCompare } from "@/components/compare/CompareContext";
import { useT } from "@/i18n";
import { CompareHint } from "./kpiCardParts";
import { ChildComparisonBars, type ChildBar } from "./ComparisonBars";

/**
 * The per-card Compare chart for a KPI card. Hidden until Compare is applied (a
 * dashed hint shows instead, so cards stay compact). After Apply it renders a
 * bar chart of the KPI's value across the SELECTED n-1 child units, in the KPI's
 * OWN unit (count→count, %→%, visits→visits, score→score). Multi-metric KPIs get
 * "Compare by" chips that switch the chart to the chosen metric's unit. Worst-
 * first; tapping a bar drills into that unit. No line graphs, no mixed units.
 */
export function KpiCompareSection({ kpi }: { kpi: KpiDef }) {
  const { childLevel, applied, selected } = useCompare();
  const { entity, setScope } = useScope();
  const { t, tn, lang } = useT();
  const [mi, setMi] = useState(0);

  const metrics = kpi.metrics ?? [];
  const multi = metrics.length > 0;
  const metric = multi ? metrics[Math.min(mi, metrics.length - 1)] : null;
  const unit: Unit = metric ? metric.unit : kpi.unit;
  const direction = metric ? metric.direction : kpi.direction;

  const ids = applied ? selected.map((e) => e.id) : [];
  const series = useKpiChildSeries(kpi.id, ids, metric?.id);

  if (!childLevel) return null; // leaf scope — nothing below to compare

  const levelLabel = t(`levels.${childLevel}`);
  if (!applied) {
    return <div className="mt-3"><CompareHint text={t("compare.hint", { level: levelLabel.toLowerCase() })} /></div>;
  }

  const nameById = new Map(selected.map((e) => [e.id, tn(e.name, e.name_gu)]));
  const allVals = series.filter((s) => s.value != null).map((s) => s.value as number);
  const bars: ChildBar[] = series
    .filter((s) => s.value != null)
    .map((s) => ({
      id: s.id,
      label: nameById.get(s.id) ?? s.id,
      value: s.value,
      status: compareBarStatus(s.value as number, unit, direction, allVals),
    }));

  const maxValue = unit === "%" || unit === "score" ? 100 : unit === "ratio" ? 3 : undefined;
  const chartTitle = t("compare.chartTitle", { level: levelLabel });

  return (
    <div className="mt-3 border-t border-line/60 pt-3">
      {multi && (
        <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <span className="text-2xs font-bold uppercase tracking-wide text-neutral-400">{t("compare.by")}</span>
          <div className="flex flex-wrap gap-1.5">
            {metrics.map((m, i) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMi(i)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-2xs font-semibold transition-colors",
                  i === mi ? "bg-primary-50 text-primary-700" : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200",
                )}
              >
                {resolveMetricLabel(m.label, m.label_gu, entity?.level ?? "school", lang)}
              </button>
            ))}
          </div>
        </div>
      )}
      {bars.length ? (
        <ChildComparisonBars
          title={chartTitle}
          bars={bars}
          unit={unit}
          lang={lang}
          height={multi ? 100 : 78}
          lowerBetter={direction === "lower"}
          maxValue={maxValue}
          onOpen={(id) => setScope(id)}
        />
      ) : (
        <p className="text-2xs text-neutral-400">{t("compare.notTracked")}</p>
      )}
    </div>
  );
}
