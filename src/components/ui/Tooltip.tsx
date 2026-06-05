import { type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Info } from "./Icon";

/** Hover/focus tooltip (no dep) — also exposes the text as an accessible label. */
export function InfoTooltip({ text, className, size = 13 }: { text: string; className?: string; size?: number }) {
  return (
    <span className={cn("group relative inline-flex align-middle", className)}>
      <button type="button" aria-label={text} className="text-neutral-400 hover:text-neutral-600">
        <Info size={size} />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-1.5 w-56 -translate-x-1/2 rounded-lg bg-neutral-900 px-3 py-2 text-2xs font-medium leading-snug text-white opacity-0 shadow-raised transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}

export function Tooltip({ text, children }: { text: string; children: ReactNode }) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-40 mb-1.5 w-52 -translate-x-1/2 rounded-lg bg-neutral-900 px-3 py-2 text-2xs font-medium leading-snug text-white opacity-0 shadow-raised transition-opacity duration-150 group-hover:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}
