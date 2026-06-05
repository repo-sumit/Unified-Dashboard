import type { DomainDef, FrameworkConfig } from "@/types";
import { GSQAC_BANDS } from "./ratingBands";
import { VSK_KPIS } from "./kpiCatalog";

const ALL_LEVELS = ["state", "district", "block", "cluster", "school", "grade", "section"] as const;

/**
 * THE single Unified Portal framework. GSQAC and SQAF are folded in (GSQAC is
 * the A5 Accreditation & School-Quality domain). There is no user-facing
 * framework switcher — but the engine stays fully config-driven: adding a
 * domain/KPI here (or a Supabase row) renders it everywhere with no code
 * change. Domain colours follow the KPI definition file's legend.
 */
const UNIFIED_DOMAINS: DomainDef[] = [
  d("a1", "A1 · Attendance & Access", "A1 · હાજરી અને પહોંચ", 0.15, 0, "CalendarCheck", "blue"),
  d("a2", "A2 · Assessment & Learning", "A2 · મૂલ્યાંકન અને અધ્યયન", 0.25, 1, "ClipboardCheck", "green"),
  d("a3", "A3 · Adaptive Learning & Remediation", "A3 · અનુકૂલિત અધ્યયન અને ઉપચાર", 0.15, 2, "GraduationCap", "yellow"),
  d("a4", "A4 · Administration & Service Delivery", "A4 · વહીવટ અને સેવા વિતરણ", 0.1, 3, "Building2", "orange"),
  d("a5", "A5 · Accreditation & School Quality", "A5 · માન્યતા અને શાળા ગુણવત્તા", 0.2, 4, "Award", "pink"),
  d("a6", "A6 · Governance, Monitoring & AI", "A6 · શાસન, દેખરેખ અને AI", 0.15, 5, "Gauge", "lightblue"),
  // weightage 0 ⇒ informational only, excluded from the overall score.
  d("district", "District Tracking", "જિલ્લા સ્તરનું ટ્રેકિંગ", 0, 6, "Map", "grey"),
];

export const UNIFIED_FRAMEWORK: FrameworkConfig = {
  id: "unified",
  name: "Unified Portal · 6A",
  name_gu: "Unified Portal · 6A",
  levels: [...ALL_LEVELS],
  rating_bands: GSQAC_BANDS,
  domains: UNIFIED_DOMAINS.map((dm) => ({ ...dm, framework: "unified" })),
  kpis: VSK_KPIS,
};

function d(
  id: string,
  name: string,
  name_gu: string,
  weightage: number,
  sort_order: number,
  icon: string,
  accent: string,
): DomainDef {
  return { id, framework: "unified", name, name_gu, weightage, sort_order, icon, accent };
}

export const DEFAULT_FRAMEWORK_ID = "unified";

/** Single framework — `id` is accepted for backward-compat but ignored. */
export function getFramework(_id?: string): FrameworkConfig {
  return UNIFIED_FRAMEWORK;
}
