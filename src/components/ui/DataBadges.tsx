import type { Frequency } from "@/types";
import { cn } from "@/lib/cn";
import { useT } from "@/i18n";
import { Clock, Info } from "./Icon";

/**
 * Data-state badges — the honesty layer. Every indicator declares its cadence;
 * the UI never fakes freshness.
 *  • FrequencyBadge — how often it updates (drives the display strategy).
 *  • FreshnessBadge — cadence-appropriate recency ("Updated daily" / "2024–25").
 * Source is detail-page meta only (see lib/displayPolicy) — no source badge
 * exists, so cards cannot grow one back.
 */

const FRESH_CADENCE: Frequency[] = ["Daily", "Weekly", "Monthly"];

function chip(className?: string) {
  return cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-medium", className);
}

export function FrequencyBadge({ frequency, className }: { frequency?: Frequency; className?: string }) {
  const { t } = useT();
  if (!frequency) return null;
  return (
    <span className={chip(cn("bg-neutral-100 text-neutral-500", className))}>
      <Clock size={11} /> {t(`ogm.freq.${frequency}`)}
    </span>
  );
}

export function FreshnessBadge({ frequency, stale, className }: { frequency?: Frequency; stale?: boolean; className?: string }) {
  const { t } = useT();
  if (!frequency) return null;
  const isFresh = !stale && FRESH_CADENCE.includes(frequency);
  return (
    <span className={chip(cn(isFresh ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-500", className))}>
      <span className={cn("h-1.5 w-1.5 rounded-full", isFresh ? "bg-emerald-500" : "bg-neutral-400")} />
      {t(`ogm.freshness.${frequency}`)}
    </span>
  );
}

/** Inline data-lag caveat (e.g. dropout half-yearly, confirmed next year via CTS). */
export function DataLagNote({ note, className }: { note?: string; className?: string }) {
  if (!note) return null;
  return (
    <p className={cn("flex items-start gap-1 text-2xs text-neutral-400", className)}>
      <Info size={11} className="mt-0.5 shrink-0" /> <span>{note}</span>
    </p>
  );
}
