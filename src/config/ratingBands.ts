import type { RatingBand } from "@/types";

/**
 * OFFICIAL GSQAC (Gunotsav 2.0) grade scale — verbatim from the GSQAC School
 * Report Card 2024–25 footer:
 *   >95% A5★ · >90–95% A4★ · >85–90% A3★ · >80–85% A2★ · >75–80% A1★
 *   >50–75% B · >25–50% C · >0–25% D
 * Grouped into broad bands A/B/C/D for RAG colouring (all A-stars → group A).
 * `min` is the band's lower bound; gradeFor uses `>=`. All thresholds are config —
 * switching a framework swaps these rows.
 */
export const GSQAC_BANDS: RatingBand[] = [
  { grade: "A5★", min: 95, group: "A" },
  { grade: "A4★", min: 90, group: "A" },
  { grade: "A3★", min: 85, group: "A" },
  { grade: "A2★", min: 80, group: "A" },
  { grade: "A1★", min: 75, group: "A" },
  { grade: "B", min: 50, group: "B" },
  { grade: "C", min: 25, group: "C" },
  { grade: "D", min: 0, group: "D" },
];

/** RAG thresholds on a 0..100 achievement scale (per-KPI overridable). */
export const RAG_DEFAULT = { green: 85, amber: 65 } as const;

export function gradeFor(percent: number, bands: RatingBand[]): RatingBand {
  // bands are highest-min first; return the first whose min is met.
  const sorted = [...bands].sort((a, b) => b.min - a.min);
  return sorted.find((b) => percent >= b.min) ?? sorted[sorted.length - 1];
}
