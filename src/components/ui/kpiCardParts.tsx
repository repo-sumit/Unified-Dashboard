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
 * Outer shell — content-aware card with a clickable summary region (drills to the
 * KPI detail) and an optional `compare` slot rendered as a sibling. The summary is
 * a <button>; the compare slot has its own buttons (metric chips, bars), so it
 * must live OUTSIDE the summary button — never nest interactive controls.
 *
 * Height tiers by metric count (`metrics`): 1 → compact · 2 → medium · 3+ → tall.
 * No `h-full` — paired with the grid's `items-start`, a single-metric card stays
 * short instead of stretching to a neighbouring 2/3-metric card's height.
 */
export function KpiCardShell({ onClick, children, compare, metrics = 1 }: { onClick?: () => void; children: ReactNode; compare?: ReactNode; metrics?: number }) {
  const minH = metrics >= 3 ? "min-h-[14rem]" : metrics === 2 ? "min-h-[12rem]" : "min-h-[9rem]";
  return (
    <Card className={cn("card-pad flex w-full flex-col transition-shadow hover:shadow-raised", minH)}>
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
 * One inline KPI row — the unified grammar shared by single- and multi-metric
 * cards: the value (big, bold) with its metric/descriptor inline immediately
 * after it ("4.7K students absent…", "88.2% Present"), and the N+1 peer
 * comparison right-aligned. `descriptor` (single-metric) uses a larger value and
 * a lighter, wrapping descriptor, and pins the comparison to the row's end;
 * metric rows sit on one baseline with a thin divider between them. The inline
 * label replaces the old uppercase label-above-value pattern. No "Parent avg",
 * no source line.
 */
export function KpiInlineRow({
  value, label, descriptor = false, valueTone, peerLabel, delta, divider,
}: {
  value: string;
  label: string;
  descriptor?: boolean;
  valueTone?: string;
  peerLabel?: string | null;
  delta?: ReactNode;
  divider?: boolean;
}) {
  return (
    <div className={cn("flex items-baseline justify-between gap-3 py-2", divider && "border-t border-line/60")}>
      <span className="min-w-0 flex-1 leading-snug">
        <b className={cn("mr-1.5 align-[-1px] font-extrabold tnum", descriptor ? "text-3xl" : "text-xl", valueTone ?? "text-neutral-900")}>{value}</b>
        <span className={cn("text-neutral-500", descriptor ? "text-[15px] font-medium" : "text-sm font-semibold")}>{label}</span>
      </span>
      {(peerLabel || delta) && (
        <span className={cn("flex shrink-0 items-baseline gap-2 whitespace-nowrap text-right", descriptor && "self-end")}>
          {peerLabel && <span className="text-xs font-semibold text-neutral-500">{peerLabel}</span>}
          {delta}
        </span>
      )}
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

