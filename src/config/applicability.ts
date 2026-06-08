import type { Level, Role } from "@/types";
import { PUBLISHED, VSK_KPIS } from "./kpiCatalog";

/**
 * KPI applicability — fully config-driven (no hardcoded id lists). An indicator
 * is hidden (never shown as NA clutter) when it doesn't apply. Two axes:
 *  • LEVEL — `kpi.lowestLevel` is the lowest hierarchy level the indicator shows
 *    at. School-and-above indicators (teacher attendance, MDM, reporting, ALL
 *    Administration, GSQAC) are hidden at grade/section; classroom indicators
 *    (student attendance, chronic, ALL assessment) go down to section. (This is
 *    what stops "Teacher attendance %" appearing on a Section card.)
 *  • ROLE — `kpi.roleVisibility` (sheet column J "Visible to teacher"). A "No"
 *    row lists the non-teacher roles, so the teacher persona is excluded even
 *    where the indicator is otherwise level-applicable (e.g. CET/CGMS).
 */

const KPI_BY_ID = new Map(VSK_KPIS.map((k) => [k.id, k]));
const LEVEL_ORDER: Level[] = ["state", "district", "block", "cluster", "school", "grade", "section"];
const levelIdx = (l: Level) => LEVEL_ORDER.indexOf(l);

export function kpiAppliesToRole(kpiId: string, role: Role): boolean {
  const k = KPI_BY_ID.get(kpiId);
  if (k?.roleVisibility) return k.roleVisibility.includes(role);
  return true; // no restriction ⇒ visible to every role (level still gates it)
}

export function kpiAppliesAtLevel(kpiId: string, level: Level): boolean {
  const k = KPI_BY_ID.get(kpiId);
  if (!k) return false;
  const lowest = k.lowestLevel ?? "section";
  // applies only at `level` if it is at or ABOVE the indicator's lowest level
  if (levelIdx(level) > levelIdx(lowest)) return false;
  // …and only where that level actually carries a value (grade reads section data)
  if (level === "grade") return PUBLISHED[kpiId]?.section != null;
  return PUBLISHED[kpiId]?.[level] != null;
}

/** A KPI shows for a (role, level) when it applies to BOTH. */
export function kpiApplies(kpiId: string, role: Role, level: Level): boolean {
  return kpiAppliesToRole(kpiId, role) && kpiAppliesAtLevel(kpiId, level);
}

/** count KPIs are compared as "avg per school", not raw totals (which grow with
 *  scope). schoolsImplied derives the per-school divisor from the published ratios. */
export function schoolsImplied(kpiId: string, level: Level): number {
  const p = PUBLISHED[kpiId];
  const school = p?.school;
  const here = p?.[level];
  if (!school || here == null || school === 0) return 1;
  return Math.max(1, Math.round(here / school));
}
