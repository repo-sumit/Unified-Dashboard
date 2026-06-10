import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { SectionLabel } from "@/components/ui/atoms";

/** A labelled section with consistent label + spacing + optional right action. */
export function PageSection({
  title, action, children, className,
}: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={className}>
      {(title || action) && (
        <div className="mb-2 flex items-center justify-between gap-2">
          {title ? <SectionLabel className="!mb-0">{title}</SectionLabel> : <span />}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

const COLS: Record<string, string> = {
  // `sm:auto-rows-fr` makes every row track equal height from the 2-up breakpoint up,
  // so KPI cards in the same row stretch to match (single/dual/triple-metric alike).
  // Left off at the 1-col mobile breakpoint so phone cards keep their natural height.
  kpi: "grid-cols-1 sm:grid-cols-2 sm:auto-rows-fr xl:grid-cols-3",
  // domain insight cards carry embedded charts → a 2-column grid (2×2) on tablet+
  // so each card stays wide and information-rich; full-width on mobile.
  domain: "grid-cols-1 sm:grid-cols-2 sm:auto-rows-fr",
  two: "grid-cols-1 sm:grid-cols-2",
};

/** Consistent responsive card grid. `cols="kpi"` (1/2/3) is the indicator default. */
export function PageGrid({
  children, cols = "kpi", className,
}: { children: ReactNode; cols?: "kpi" | "domain" | "two"; className?: string }) {
  return <div className={cn("grid gap-3", COLS[cols], className)}>{children}</div>;
}
