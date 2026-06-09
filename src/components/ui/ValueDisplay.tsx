import { cn } from "@/lib/cn";
import type { Direction, RagStatus, Unit } from "@/types";
import { deltaToneClass, valueToneClass } from "@/lib/colors";
import { formatDelta, formatValue } from "@/lib/format";
import type { Lang } from "@/i18n";

const SIZE: Record<string, string> = {
  md: "text-2xl",
  lg: "text-3xl",
  xl: "text-4xl",
};

/**
 * The single, canonical big-number value treatment. Colour: when a `toneClass` is
 * passed (the card derives it from the delta direction — up=green, down=red, with
 * the lower-is-better/absentee exception, neutral when flat) it wins; otherwise it
 * falls back to RAG status / signed-delta tone. Used by every metric card + detail
 * view so the value reads the same everywhere.
 */
export function ValueDisplay({
  value, unit, status, direction = "higher", isDelta = false, lang = "en", size = "lg", naLabel = "NA", toneClass, className,
}: {
  value: number | null;
  unit: Unit;
  status: RagStatus;
  direction?: Direction;
  isDelta?: boolean;
  lang?: Lang;
  size?: "md" | "lg" | "xl";
  naLabel?: string;
  toneClass?: string;
  className?: string;
}) {
  const na = value == null;
  const tone = na ? "text-rag-naText" : toneClass ?? (isDelta ? deltaToneClass(value, direction) : valueToneClass(status));
  const text = na ? naLabel : isDelta ? formatDelta(value, unit, lang) : formatValue(value, unit, lang);
  return <span className={cn(SIZE[size], "font-extrabold tnum", tone, className)}>{text}</span>;
}
