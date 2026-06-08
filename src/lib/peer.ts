import type { Level } from "@/types";
import { PUBLISHED } from "@/config/kpiCatalog";

/**
 * N+1 comparison (OGM 3.0): "each level compares against its next higher level"
 * (School vs Cluster avg, Cluster vs Block avg, …). This replaces a static state
 * baseline. The next-level-up average is the PUBLISHED figure at the parent level.
 */
const PARENT: Record<Level, Level | null> = {
  state: null,
  district: "state",
  block: "district",
  cluster: "block",
  school: "cluster",
  grade: "school",
  section: "school",
};

export function peerLevelOf(level: Level): Level | null {
  return PARENT[level];
}

/** The next-level-up average for a KPI (null at State, or where not published). */
export function peerAvg(kpiId: string, level: Level): number | null {
  const pl = PARENT[level];
  if (!pl) return null;
  return PUBLISHED[kpiId]?.[pl] ?? null;
}

export interface PeerGap {
  peer: number;
  gap: number; // value − peer (signed)
  ahead: boolean; // direction-aware: are we better than the peer average?
}

/** Compare a value to its next-level-up average, direction-aware. */
export function peerGapOf(value: number | null, peer: number | null, direction: "higher" | "lower"): PeerGap | null {
  if (value == null || peer == null) return null;
  const gap = Math.round((value - peer) * 10) / 10;
  const ahead = direction === "higher" ? gap >= 0 : gap <= 0;
  return { peer, gap, ahead };
}
