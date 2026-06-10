import type { KpiDef } from "@/types";
import { cadenceOf } from "@/lib/trend";

/**
 * Central display policy (June 2026 transcript) — the single place that decides
 * what a KPI CARD may show. Screens/components never re-derive these rules.
 *
 * Delta on cards is allowed ONLY for:
 *  • Assessment: SAT1 · SAT2 · CET · CGMS (incl. their sub-metrics) — never FLN/ORF
 *  • School Quality: the GSQAC score only — never the D1–D5 domain indicators
 * Everything else — every Daily indicator, all of Attendance, all of
 * Administration (School Observation included) — shows its as-on date instead.
 *
 * Source is shown ONLY on the KPI/indicator detail page (and in the export
 * tables) — never on cards.
 */

const ASSESSMENT_DELTA_PARENTS = new Set(["asm_sat1", "asm_sat2", "asm_cet", "asm_cgms"]);

/** parent indicator id of a (possibly synthesized) sub-metric id — `asm_sat1__avgScore` → `asm_sat1`. */
export function parentKpiId(kpiId: string): string {
  return kpiId.split("__")[0];
}

/**
 * May this KPI (or synthesized sub-metric record) show a delta on a CARD?
 * Detail-page trend charts are unaffected — this gates card chrome only.
 */
export function shouldShowCardDelta(kpi: Pick<KpiDef, "id" | "domain_id" | "frequency" | "suppressDelta">): boolean {
  if (kpi.suppressDelta) return false;
  if (cadenceOf(kpi.frequency) === "daily") return false;
  const parent = parentKpiId(kpi.id);
  // sq_d5's CET/CGMS rows reuse asm_* series but live in School Quality — the
  // domain check keeps them delta-free (GSQAC delta is for the score only).
  if (kpi.domain_id === "assessment") return ASSESSMENT_DELTA_PARENTS.has(parent);
  if (kpi.domain_id === "school_quality") return parent === "sq_gsqac";
  return false;
}

export type SourceContext = "card" | "detail" | "export";

/** Source text is detail-page (and export-table) information, never card chrome. */
export function shouldShowSource(context: SourceContext): boolean {
  return context !== "card";
}
