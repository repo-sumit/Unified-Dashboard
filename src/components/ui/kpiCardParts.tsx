import type { ReactNode } from "react";
import type { Frequency } from "@/types";
import { cn } from "@/lib/cn";
import { Card } from "./atoms";
import { FrequencyBadge } from "./DataBadges";
import { ChevronRight } from "./Icon";

/**
 * Shared KPI-card layout contract. Single-, dual- and triple-metric cards all
 * compose from these pieces so they read as ONE product component: same outer
 * min-height, the same header rhythm (title clamped to 2 lines), a primary region
 * that grows to absorb slack (no blank middle), and a 2-up footer pinned to the
 * bottom. The footer holds either sub-metric tiles (multi) or compact context
 * tiles (single/dual) so every card has the same perceived density.
 */

/** Outer shell — equal min-height + bottom-anchored footer for the whole grid. */
export function KpiCardShell({ onClick, children }: { onClick?: () => void; children: ReactNode }) {
  return (
    <Card
      as="button"
      onClick={onClick}
      className="group card-pad flex h-full min-h-[16.5rem] w-full flex-col gap-2.5 text-left transition-shadow hover:shadow-raised"
    >
      {children}
    </Card>
  );
}

/** Title (clamped to 2 lines → consistent header height) + chevron + chip row. */
export function KpiCardHeader({
  title, frequency, context, scheduleNote,
}: { title: string; frequency?: Frequency; context?: string | null; scheduleNote?: string }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <span className="line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-snug text-neutral-900" title={title}>{title}</span>
        <span className="mt-1 flex flex-wrap items-center gap-1.5">
          <FrequencyBadge frequency={frequency} />
          {context && <span className="text-2xs font-medium text-neutral-400">· {context}</span>}
          {scheduleNote && <span className="text-2xs font-medium text-neutral-400">{scheduleNote}</span>}
        </span>
      </div>
      <ChevronRight size={16} className="mt-0.5 shrink-0 text-neutral-300 transition-transform group-hover:translate-x-0.5" />
    </div>
  );
}

/** Primary region — value + trend. `grows` centres modest content so a sparse card
 *  fills its height instead of leaving a blank gap above the footer. */
export function KpiPrimary({ children }: { children: ReactNode }) {
  return <div className="flex flex-1 flex-col justify-center gap-2">{children}</div>;
}

/** Bottom-anchored 2-up footer grid — same rhythm on every card. */
export function KpiFooter({ children }: { children: ReactNode }) {
  return <div className="mt-auto grid grid-cols-2 gap-x-3 gap-y-1 border-t border-line/70 pt-2.5">{children}</div>;
}

/** Compact context tile (label + value) that fills a footer slot on cards without a
 *  second/third sub-metric: parent (N+1) average, data source, or last-updated. */
export function KpiContextTile({ label, value, valueTitle, className }: { label: string; value: ReactNode; valueTitle?: string; className?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      <span className="block truncate text-2xs font-semibold uppercase tracking-wide text-neutral-400">{label}</span>
      <span className="mt-0.5 block truncate text-xs font-semibold text-neutral-600" title={valueTitle}>{value}</span>
    </div>
  );
}
