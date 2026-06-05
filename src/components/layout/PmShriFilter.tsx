import { useSession, type PmShriMode } from "@/store/session";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { Sparkles } from "../ui/Icon";

/**
 * Global PM SHRI institutional filter (FCR-1.3) — All / PM SHRI / Non-PM SHRI.
 * Acts as an administrative toggle and an aspirational tracker for
 * non-qualifying campuses; scopes the aggregate rollups.
 */
export function PmShriFilter({ className }: { className?: string }) {
  const pmShri = useSession((s) => s.pmShri);
  const setPmShri = useSession((s) => s.setPmShri);
  const { t } = useT();

  return (
    <label
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5",
        pmShri === "all" ? "bg-neutral-100" : "bg-amber-50 ring-1 ring-amber-200",
        className,
      )}
      title={t("pmShri.aspire")}
    >
      <Sparkles size={14} className={pmShri === "all" ? "text-neutral-400" : "text-amber-500"} />
      <span className="sr-only">{t("pmShri.label")}</span>
      <select
        value={pmShri}
        onChange={(e) => setPmShri(e.target.value as PmShriMode)}
        className="cursor-pointer bg-transparent text-xs font-semibold text-neutral-700 outline-none"
      >
        <option value="all">{t("pmShri.all")}</option>
        <option value="pmshri">{t("pmShri.pmshri")}</option>
        <option value="non">{t("pmShri.non")}</option>
      </select>
    </label>
  );
}
