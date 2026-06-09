import { cn } from "@/lib/cn";
import type { KpiRecord } from "@/types";
import { rag, valueToneClass } from "@/lib/colors";
import { formatValue } from "@/lib/format";
import { buildTrend, deltaLabelKey } from "@/lib/trend";
import { useT, type Lang } from "@/i18n";
import { Card, DeltaPill, StatusDot } from "./atoms";
import { Sparkline } from "./Sparkline";
import { ChevronRight } from "./Icon";

/** The per-KPI tile: full name · value · frequency-aware mini trend · cadence delta tag.
 *  Same card language as the homepage (no truncation, no "% score" clutter). */
export function KpiCard({
  rec, name, onClick, lang = "en",
}: { rec: KpiRecord; name: string; onClick?: () => void; lang?: Lang }) {
  const { t } = useT();
  const c = rag(rec.status);
  const na = rec.value == null;
  const trend = na ? null : buildTrend(rec, lang);

  return (
    <Card
      as="button"
      onClick={onClick}
      className={cn(
        "card-pad group flex w-full flex-col gap-3 text-left transition-shadow hover:shadow-raised",
        na && "opacity-95",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <StatusDot status={rec.status} className="mt-1 shrink-0" />
          <span className="text-sm font-semibold leading-snug text-neutral-700">{name}</span>
        </div>
        <ChevronRight size={16} className="mt-0.5 shrink-0 text-neutral-300 transition-transform group-hover:translate-x-0.5" />
      </div>

      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          {na ? (
            <span className="text-2xl font-extrabold text-rag-naText">NA</span>
          ) : (
            <span className={cn("text-2xl font-extrabold tnum", valueToneClass(rec.status))}>{formatValue(rec.value, rec.kpi.unit, lang)}</span>
          )}
        </div>
        {trend && trend.points.length > 1 && (
          <Sparkline data={trend.points.map((p) => p.value)} color={c.hex} />
        )}
      </div>

      {na || !trend ? (
        <p className="text-2xs text-neutral-400">{t("common.notTracked")}</p>
      ) : (
        <DeltaPill delta={trend.delta} unit={rec.kpi.unit} direction={rec.kpi.direction} lang={lang} label={t(deltaLabelKey(trend.cadence))} />
      )}
    </Card>
  );
}
