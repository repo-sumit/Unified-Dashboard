import { useSession, type PmShriMode } from "@/store/session";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { Select } from "@/components/ui/Select";
import { SlidersHorizontal } from "../ui/Icon";

/**
 * Global school-type filter (FCR-1.3) — All Schools / PM SHRI / Non-PM SHRI.
 * Scopes the aggregate rollups. Uses the shared design-system Select with a
 * clear filter (sliders) icon, and an amber "filtered" treatment when narrowed.
 */
export function PmShriFilter({ className }: { className?: string }) {
  const pmShri = useSession((s) => s.pmShri);
  const setPmShri = useSession((s) => s.setPmShri);
  const { t } = useT();
  const active = pmShri !== "all";

  return (
    <Select
      value={pmShri}
      onChange={(v) => setPmShri(v as PmShriMode)}
      options={[
        { value: "all", label: t("pmShri.all") },
        { value: "pmshri", label: t("pmShri.pmshri") },
        { value: "non", label: t("pmShri.non") },
      ]}
      ariaLabel={t("pmShri.label")}
      searchable={false}
      align="left"
      className={className}
      leadingIcon={<SlidersHorizontal size={14} className={active ? "text-amber-500" : "text-neutral-400"} />}
      triggerClassName={cn(active && "!bg-amber-50 ring-1 ring-amber-200")}
    />
  );
}
