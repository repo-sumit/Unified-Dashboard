import { useState } from "react";
import { cn } from "@/lib/cn";
import { useT } from "@/i18n";
import { CheckCircle2, ChevronRight, Minus } from "./Icon";

export interface MsOption { id: string; label: string }
export interface MsGroup { key: string; label: string; options: MsOption[] }

/**
 * Grouped multi-select popover with per-group "Select all" — used by the
 * Compare view's "add comparison" control (FCR-7.2 Select All).
 */
export function MultiSelect({
  groups, selected, onChange, placeholder, max = 6,
}: { groups: MsGroup[]; selected: string[]; onChange: (ids: string[]) => void; placeholder: string; max?: number }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const sel = new Set(selected);

  const toggle = (id: string) => {
    const next = new Set(sel);
    if (next.has(id)) next.delete(id);
    else if (next.size < max) next.add(id);
    onChange([...next]);
  };
  const groupAll = (g: MsGroup) => {
    const ids = g.options.map((o) => o.id);
    const allOn = ids.every((id) => sel.has(id));
    const next = new Set(sel);
    if (allOn) ids.forEach((id) => next.delete(id));
    else ids.forEach((id) => { if (next.size < max) next.add(id); });
    onChange([...next]);
  };

  const filtered = groups
    .map((g) => ({ ...g, options: g.options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase())) }))
    .filter((g) => g.options.length);

  // global Select all / Clear all across every (filtered) group, respecting max
  const allFilteredIds = filtered.flatMap((g) => g.options.map((o) => o.id));
  const allOn = allFilteredIds.length > 0 && allFilteredIds.every((id) => sel.has(id));
  const toggleAll = () => {
    const next = new Set(sel);
    if (allOn) allFilteredIds.forEach((id) => next.delete(id));
    else for (const id of allFilteredIds) { if (next.size >= max) break; next.add(id); }
    onChange([...next]);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors", selected.length ? "bg-primary-50 text-primary-700 ring-1 ring-primary-200" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200")}
      >
        {placeholder}{selected.length ? ` · ${selected.length}` : ""}
        <ChevronRight size={13} className={cn("transition-transform", open && "rotate-90")} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 z-40 mt-1.5 max-h-80 w-72 overflow-auto rounded-xl border border-line bg-white p-2 shadow-raised">
            <div className="sticky top-0 -mx-2 -mt-2 mb-1 bg-white px-2 pb-1.5 pt-2">
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`${t("common.search")}…`} className="w-full rounded-lg border border-line bg-neutral-50 px-2.5 py-1.5 text-xs outline-none focus:border-primary-400" />
              <div className="mt-1 flex items-center justify-between gap-2 px-0.5">
                <button onClick={toggleAll} disabled={!allFilteredIds.length} className="text-2xs font-semibold text-primary-600 hover:underline disabled:opacity-40">
                  {allOn ? t("common.clearAll") : t("common.selectAll")}
                </button>
                {selected.length > 0 ? (
                  <button onClick={() => onChange([])} className="inline-flex items-center gap-1 text-2xs font-semibold text-neutral-400 hover:text-rag-redText">
                    <Minus size={12} /> {t("common.clear")} ({selected.length}/{max})
                  </button>
                ) : (
                  <span className="text-2xs tnum text-neutral-400">0/{max}</span>
                )}
              </div>
            </div>
            {filtered.map((g) => {
              const allOn = g.options.every((o) => sel.has(o.id));
              return (
                <div key={g.key} className="mb-1.5">
                  <div className="flex items-center justify-between px-1 py-1">
                    <span className="text-2xs font-bold uppercase tracking-wide text-neutral-400">{g.label}</span>
                    <button onClick={() => groupAll(g)} className="text-2xs font-semibold text-primary-600 hover:underline">{allOn ? t("common.clearAll") : t("common.selectAll")}</button>
                  </div>
                  {g.options.map((o) => (
                    <button key={o.id} onClick={() => toggle(o.id)} className={cn("flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs hover:bg-neutral-50", sel.has(o.id) && "bg-primary-50/60")}>
                      <span className={cn("grid h-4 w-4 shrink-0 place-items-center rounded border", sel.has(o.id) ? "border-primary-500 bg-primary-500 text-white" : "border-line")}>
                        {sel.has(o.id) && <CheckCircle2 size={12} />}
                      </span>
                      <span className="truncate text-neutral-700">{o.label}</span>
                    </button>
                  ))}
                </div>
              );
            })}
            {!filtered.length && <p className="px-2 py-3 text-center text-xs text-neutral-400">{t("common.noMatches")}</p>}
          </div>
        </>
      )}
    </div>
  );
}
