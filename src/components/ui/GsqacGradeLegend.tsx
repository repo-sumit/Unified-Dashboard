import { useT } from "@/i18n";
import { GSQAC_BANDS } from "@/config/ratingBands";
import { GSQAC_BAND_HEX } from "@/lib/colors";
import { Card, SectionLabel } from "./atoms";

/**
 * GSQAC grade-scale legend — the official % → grade bands with their report colours.
 * Ranges are derived from GSQAC_BANDS (highest-min first) so they stay in sync with
 * the scale. Shown at the foot of the School Quality page; explanatory, not interactive.
 */
export function GsqacGradeLegend() {
  const { t } = useT();
  const bands = [...GSQAC_BANDS].sort((a, b) => b.min - a.min);
  return (
    <Card className="card-pad">
      <SectionLabel>{t("scorecard.gradeScale")}</SectionLabel>
      <p className="mt-1 text-2xs text-neutral-400">{t("scorecard.gradeScaleHint")}</p>
      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-4">
        {bands.map((b, i) => {
          const range = i === 0 ? `>${b.min}%` : `>${b.min}–${bands[i - 1].min}%`;
          return (
            <li key={b.grade} className="flex items-center gap-2">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: GSQAC_BAND_HEX[b.grade] ?? "#9CA3AF" }} aria-hidden />
              <span className="text-sm font-bold tnum text-neutral-900">{b.grade}</span>
              <span className="text-2xs text-neutral-500">{range}</span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
