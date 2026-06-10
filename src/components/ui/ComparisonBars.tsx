import { cn } from "@/lib/cn";
import type { RagStatus, Unit } from "@/types";
import { rag } from "@/lib/colors";
import { formatValue, formatValueFull } from "@/lib/format";
import { useT, type Lang } from "@/i18n";
import { ChevronRight } from "./Icon";

export interface ChildBar {
  id: string;
  label: string;
  value: number | null;
  status: RagStatus;
}

/** shorten common unit names so bar labels stay readable ("Grade 5" → "G5"). */
function abbrev(label: string): string {
  return label
    .replace(/^Grade\s+/, "G")
    .replace(/^Section\s+/, "Sec ")
    .replace(/\s+Pri\.\s*Sch\.$/, "")
    .replace(/\s+Primary School$/, "");
}

/**
 * Embedded comparison bars — the design's per-card chart. Compact vertical bars,
 * one per selected child unit, worst-first (lower-is-better metrics put the
 * highest/worst first), value label above, abbreviated unit label below, RAG
 * fill. Spacing is responsive to the bar count: a few bars spread evenly across
 * the full chart width (no blank right side); many bars (9+) use a fixed gap and
 * scroll horizontally inside the card (the page never scrolls sideways) with a
 * "scroll ›" hint. Tapping a bar drills into that unit. Unit-consistent.
 */
export function ChildComparisonBars({
  title, bars, unit = "%", lang = "en", height = 88, lowerBetter = false, maxValue, onOpen,
}: {
  title?: string;
  bars: ChildBar[];
  unit?: Unit;
  lang?: Lang;
  height?: number;
  lowerBetter?: boolean;
  maxValue?: number;
  onOpen?: (id: string) => void;
}) {
  const { t } = useT();
  const valued = bars.filter((b) => b.value != null);
  const sorted = [...valued].sort((a, b) =>
    lowerBetter ? (b.value as number) - (a.value as number) : (a.value as number) - (b.value as number),
  );
  const top = maxValue ?? Math.max(...sorted.map((b) => b.value as number), 1);
  // few bars → distribute across the card width; many (9+) → fixed gap + scroll
  const count = sorted.length;
  const shouldScroll = count > 8;
  const justifyClass = count <= 1 ? "justify-center" : count <= 4 ? "justify-between" : "justify-around";
  const summary = sorted.map((b) => `${b.label} ${formatValue(b.value, unit, lang)}`).join(", ");

  return (
    <div className="mt-3">
      {(title || shouldScroll) && (
        <div className="mb-2 flex items-center justify-between gap-2">
          {title ? <span className="section-title !mb-0">{title}</span> : <span />}
          {shouldScroll && (
            <span className="inline-flex shrink-0 items-center gap-0.5 text-2xs font-semibold text-neutral-400">
              {t("common.scroll")}<ChevronRight size={11} />
            </span>
          )}
        </div>
      )}
      <div
        className={cn("flex items-end overflow-x-auto pb-1.5", shouldScroll ? "gap-6" : cn(justifyClass, "gap-3"))}
        role="img"
        aria-label={summary}
      >
        {sorted.map((b) => {
          const v = b.value as number;
          const h = Math.max(6, (v / top) * height);
          const c = rag(b.status);
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => onOpen?.(b.id)}
              title={`${b.label} · ${formatValueFull(v, unit, lang)}`}
              className="flex shrink-0 flex-col items-center gap-1 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
              style={{ width: 40, cursor: onOpen ? "pointer" : "default" }}
            >
              <span className={cn("text-2xs font-bold tnum leading-none", c.text)}>{formatValue(v, unit, lang)}</span>
              <span className="flex w-full items-end" style={{ height }}>
                <span className={cn("w-full origin-bottom animate-bar-grow", c.bg)} style={{ height: h, borderRadius: "6px 6px 3px 3px" }} />
              </span>
              <span className="block w-full truncate text-center text-2xs font-semibold leading-tight text-neutral-400" title={b.label}>
                {abbrev(b.label)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
