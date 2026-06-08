import type { KpiRecord, Level, Scorecard } from "@/types";
import { peerAvg, peerLevelOf } from "./peer";
import { INPUT_DOMAIN_IDS } from "@/config/frameworks";

/**
 * "What needs attention?" — genuinely COMPUTED priority insights for the
 * 6-second scan, distinct from the fixed Hero strip ("what to act on") and the
 * risk table (which units to drill). Each insight is derived live from the
 * scorecard + N+1 peer averages + scope coverage; nothing is hardcoded. The
 * component translates `kind` + params, so numbers localise (incl. Gujarati).
 */

export type InsightSeverity = "critical" | "warning" | "info";
export type InsightKind = "peer_gap" | "low_domain" | "decline" | "chronic" | "coverage";

export interface Insight {
  id: string;
  kind: InsightKind;
  severity: InsightSeverity;
  icon: string; // lucide name
  label: string;
  label_gu: string;
  metric?: number; // primary number (gap / % / count)
  extra?: number; // secondary (peer avg / total / rate)
  unit?: "%" | "count" | "score" | "pp";
  peerLevel?: Level;
  domainId?: string;
  kpiId?: string;
}

export interface ScopeStats {
  schools: number;
  gsqacReal: number;
  enrolment: number;
}

const SEV_RANK: Record<InsightSeverity, number> = { critical: 0, warning: 1, info: 2 };
const round1 = (v: number) => Math.round(v * 10) / 10;

export function computeInsights(sc: Scorecard, opts: { stats?: ScopeStats | null } = {}): Insight[] {
  const level = sc.entity.level;
  const records: KpiRecord[] = sc.domainScores.flatMap((d) => d.records);
  const out: Insight[] = [];

  // 1) Biggest negative N+1 gap — level/rate indicators only (counts & deltas
  //    are excluded; their "vs parent" isn't a like-for-like). Needs a parent.
  const peerLevel = peerLevelOf(level);
  if (peerLevel) {
    let worst: { rec: KpiRecord; deficit: number; peer: number } | null = null;
    for (const r of records) {
      if (r.value == null || r.kpi.context) continue;
      if (r.kpi.unit !== "%" && r.kpi.unit !== "score") continue;
      // exclude School Quality / GSQAC: its real value has no real next-level-up
      // baseline in the mock, so a "behind the parent" gap would be an artifact.
      if (r.kpi.domain_id === "school_quality") continue;
      const peer = peerAvg(r.kpi.id, level);
      if (peer == null) continue;
      const deficit = r.kpi.direction === "higher" ? peer - r.value : r.value - peer;
      if (deficit > (worst?.deficit ?? 1.99)) worst = { rec: r, deficit, peer };
    }
    if (worst && worst.deficit >= 2) {
      out.push({
        id: "peer_gap", kind: "peer_gap",
        severity: worst.deficit >= 8 ? "critical" : "warning",
        icon: "TrendingDown",
        label: worst.rec.kpi.name, label_gu: worst.rec.kpi.name_gu,
        metric: round1(worst.deficit), extra: round1(worst.peer),
        unit: worst.rec.kpi.unit === "score" ? "score" : "%",
        peerLevel, kpiId: worst.rec.kpi.id, domainId: worst.rec.kpi.domain_id,
      });
    }
  }

  // 2) Lowest input domain
  const inputs = sc.domainScores.filter(
    (d) => (INPUT_DOMAIN_IDS as readonly string[]).includes(d.domain.id) && d.percent != null,
  );
  const lowest = [...inputs].sort((a, b) => (a.percent as number) - (b.percent as number))[0];
  if (lowest && (lowest.percent as number) < 85) {
    out.push({
      id: "low_domain", kind: "low_domain",
      severity: (lowest.percent as number) < 65 ? "critical" : "warning",
      icon: "Gauge",
      label: lowest.domain.name, label_gu: lowest.domain.name_gu,
      metric: round1(lowest.percent as number), unit: "%",
      domainId: lowest.domain.id,
    });
  }

  // 3) Biggest decline vs cycle — a context-delta indicator that went negative
  let decline: KpiRecord | null = null;
  for (const r of records) {
    if (!r.kpi.context || r.kpi.displayStrategy !== "delta_cycle" || r.value == null) continue;
    const improving = r.kpi.direction === "higher" ? r.value >= 0 : r.value <= 0;
    if (!improving && (!decline || Math.abs(r.value) > Math.abs(decline.value as number))) decline = r;
  }
  if (decline) {
    out.push({
      id: "decline", kind: "decline",
      severity: Math.abs(decline.value as number) >= 3 ? "critical" : "warning",
      icon: "ArrowDownRight",
      label: decline.kpi.name, label_gu: decline.kpi.name_gu,
      metric: round1(Math.abs(decline.value as number)), unit: "pp",
      kpiId: decline.kpi.id, domainId: decline.kpi.domain_id,
    });
  }

  // 4) Most chronic absentees — count + rate (vs enrolment in scope). NOTE: in the
  //    mock the count and the enrolment denominator are sourced independently, so
  //    the rate is approximate (illustrative); with live data they share a denominator.
  const chronic = records.find((r) => r.kpi.id === "att_chronic" && r.value != null);
  if (chronic && (chronic.value as number) > 0) {
    const enrol = opts.stats?.enrolment ?? 0;
    const rate = enrol > 0 ? ((chronic.value as number) / enrol) * 100 : null;
    out.push({
      id: "chronic", kind: "chronic",
      severity: rate != null && rate >= 3 ? "critical" : rate != null && rate >= 1 ? "warning" : "info",
      icon: "Users",
      label: chronic.kpi.name, label_gu: chronic.kpi.name_gu,
      metric: Math.round(chronic.value as number),
      extra: rate != null ? round1(rate) : undefined,
      unit: "count", kpiId: "att_chronic", domainId: "attendance",
    });
  }

  // 5) Data coverage — GSQAC measured for X / Y schools (honesty, never a
  //    performance read). Only at officer scope, when there's a real gap.
  const stats = opts.stats;
  if (stats && stats.schools >= 4 && stats.gsqacReal < stats.schools && stats.gsqacReal / stats.schools < 0.95) {
    out.push({
      id: "coverage", kind: "coverage", severity: "info", icon: "Database",
      label: "GSQAC", label_gu: "GSQAC",
      metric: stats.gsqacReal, extra: stats.schools, unit: "count",
    });
  }

  return out.sort((a, b) => SEV_RANK[a.severity] - SEV_RANK[b.severity]);
}
