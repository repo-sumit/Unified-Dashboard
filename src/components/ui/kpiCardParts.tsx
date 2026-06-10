import type { ReactNode } from "react";
import type { Frequency } from "@/types";
import { cn } from "@/lib/cn";
import { Card } from "./atoms";
import { FrequencyBadge } from "./DataBadges";
import { BarChart3, ChevronRight } from "./Icon";

/**
 * Shared KPI-card layout pieces — a strict row grammar (header · meta · metrics ·
 * footer), graph-free and compact (trend charts live only on the KPI detail page).
 * Single- and multi-metric cards use the same shell, header and metric row so they
 * read as one component and align across the grid. No source line on cards.
 */

/**
 * Outer shell — compact card with a clickable summary region (drills to the KPI
 * detail) and an optional `compare` slot rendered as a sibling. The summary is a
 * <button>; the compare slot has its own buttons (metric chips, bars), so it must
 * live OUTSIDE the summary button — never nest interactive controls.
 */
export function KpiCardShell({ onClick, children, compare }: { onClick?: () => void; children: ReactNode; compare?: ReactNode }) {
  return (
    <Card className="card-pad flex h-full min-h-[10rem] w-full flex-col transition-shadow hover:shadow-raised">
      {onClick ? (
        <button onClick={onClick} className="group flex flex-1 flex-col text-left">{children}</button>
      ) : (
        <div className="flex flex-1 flex-col">{children}</div>
      )}
      {compare}
    </Card>
  );
}

/**
 * Header (title + chevron) and the meta row (frequency · last-updated) in one block.
 * The meta period label already encodes any schedule month (e.g. "Sep 2025"), so the
 * raw `scheduleNote` is never appended again — that was the "Sep 2025 September" dup.
 */
export function KpiCardHeader({ title, frequency, context }: { title: string; frequency?: Frequency; context?: string | null }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <span className="line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-snug text-neutral-900" title={title}>{title}</span>
        <span className="mt-1 flex flex-wrap items-center gap-1.5">
          <FrequencyBadge frequency={frequency} />
          {context && <span className="text-2xs font-medium text-neutral-400">· {context}</span>}
        </span>
      </div>
      <ChevronRight size={16} className="mt-0.5 shrink-0 text-neutral-300 transition-transform group-hover:translate-x-0.5" />
    </div>
  );
}

/**
 * One compact metric row with three aligned columns: value · parent N+1 · delta.
 * Used for every row of a multi-metric card so they line up; the label sits above.
 */
export function KpiMetricRow({
  label, value, valueTone, parentLabel, delta,
}: { label: string; value: string; valueTone?: string; parentLabel?: string | null; delta?: ReactNode }) {
  return (
    <div className="py-2 first:pt-1 last:pb-0">
      <span className="block text-2xs font-semibold uppercase tracking-wide text-neutral-400">{label}</span>
      <div className="mt-0.5 grid grid-cols-3 items-baseline gap-x-2">
        <span className={cn("truncate text-xl font-extrabold tnum leading-none", valueTone)}>{value}</span>
        <span className="truncate text-2xs text-neutral-400">{parentLabel}</span>
        <span className="justify-self-end">{delta}</span>
      </div>
    </div>
  );
}

/** Dashed "Tap Compare to view …" affordance shown before a comparison is applied
 *  (keeps cards compact — no reserved empty chart space). */
export function CompareHint({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-dashed border-line px-2.5 py-2 text-2xs font-semibold text-neutral-400">
      <BarChart3 size={13} className="shrink-0 text-neutral-300" /> {text}
    </div>
  );
}

