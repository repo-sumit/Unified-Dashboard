import { Fragment, type ReactNode } from "react";
import type { KpiDef } from "@/types";
import { cn } from "@/lib/cn";

/**
 * Estimated layout-height "weight" for a KPI card, used to balance the two desktop
 * columns. Taller content → larger weight: 1 metric (compact) = 1, 2 metrics
 * (medium) = 2, 3+ metrics (tall) = 3. When Compare is applied every card grows an
 * embedded chart, so add a flat +2. This is a height *estimate*, not a pixel
 * measurement — enough for the greedy split to keep the columns visually even.
 */
export function getKpiCardLayoutWeight(kpi: Pick<KpiDef, "metrics">, compareApplied: boolean): number {
  const metricCount = kpi.metrics?.length || 1;
  let weight = metricCount === 1 ? 1 : metricCount === 2 ? 2 : 3;
  if (compareApplied) weight += 2;
  return weight;
}

/**
 * Greedy two-column split: keep the first (hero) card top-left, then drop each
 * remaining card into the currently shorter column. Avoids one column towering
 * over the other the way CSS grid rows do when cards differ in height.
 */
export function splitIntoBalancedColumns<T>(items: T[], weightOf: (item: T) => number): [T[], T[]] {
  const cols: [T[], T[]] = [[], []];
  const height = [0, 0];
  items.forEach((item, i) => {
    const target = i === 0 ? 0 : height[0] <= height[1] ? 0 : 1; // hero pinned top-left
    cols[target].push(item);
    height[target] += weightOf(item);
  });
  return cols;
}

/**
 * Balanced KPI card grid for the domain / sub-domain listing pages.
 *
 * - **Mobile** (`< md`): a single column in the original logical order — simple,
 *   natural scroll, no reordering.
 * - **Desktop / tablet** (`>= md`): two flex columns (NOT grid rows, which leave
 *   awkward gaps when cards differ in height). Cards are distributed by a greedy
 *   weight split so the columns stay visually even before and after Compare.
 *
 * Cards keep their natural, content-aware height — this only decides *which*
 * column each card lands in, never forcing equal heights.
 */
export function BalancedKpiGrid<T>({
  items, getKey, getWeight, renderItem,
}: {
  items: T[];
  getKey: (item: T) => string;
  getWeight: (item: T) => number;
  renderItem: (item: T) => ReactNode;
}) {
  const [left, right] = splitIntoBalancedColumns(items, getWeight);
  const Column = ({ col }: { col: T[] }) => (
    <div className="flex flex-col gap-3">
      {col.map((it) => <Fragment key={getKey(it)}>{renderItem(it)}</Fragment>)}
    </div>
  );
  return (
    <>
      {/* mobile — one column, logical order */}
      <div className={cn("flex flex-col gap-3 md:hidden")}>
        {items.map((it) => <Fragment key={getKey(it)}>{renderItem(it)}</Fragment>)}
      </div>
      {/* desktop / tablet — two balanced columns */}
      <div className="hidden gap-3 md:grid md:grid-cols-2">
        <Column col={left} />
        <Column col={right} />
      </div>
    </>
  );
}
