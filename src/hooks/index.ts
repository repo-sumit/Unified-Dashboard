import { useMemo } from "react";
import type { Entity } from "@/types";
import { PERIODS, getFramework } from "@/config";
import { dataProvider } from "@/data/provider";
import {
  getChildLeaderboard,
  getKpiChildSeries,
  getKpiMetricRecords,
  getKpiRecord,
  getOverallBenchmark,
  getScorecard,
  childLevelOf,
} from "@/engine";
import { useSession } from "@/store/session";

export { PERIODS } from "@/config";

export function useFramework() {
  const frameworkId = useSession((s) => s.frameworkId);
  return useMemo(() => getFramework(frameworkId), [frameworkId]);
}

/** the active PM SHRI filter — every data hook applies it before computing. */
export function usePmShri() {
  return useSession((s) => s.pmShri);
}

/** the user's scope + current (possibly drilled-down) entity + helpers. */
export function useScope() {
  const user = useSession((s) => s.user);
  const scopeId = useSession((s) => s.scopeId);
  const setScope = useSession((s) => s.setScope);
  const resetScope = useSession((s) => s.resetScope);

  const homeId = user?.entity_id ?? null;
  // ACCESS CONTROL (read-side clamp): never trust the persisted scopeId. If it
  // points outside the user's subtree (e.g. hand-edited localStorage), fall back
  // to home so no out-of-scope entity is ever rendered. Pairs with the write-side
  // guard in setScope. NOTE: client-side only; production needs server-side authz.
  const rawId = scopeId ?? homeId;
  const currentId = homeId && rawId && dataProvider.isInScope(homeId, rawId) ? rawId : homeId;

  const entity = useMemo(() => (currentId ? dataProvider.getEntity(currentId) : undefined), [currentId]);
  const homeEntity = useMemo(() => (homeId ? dataProvider.getEntity(homeId) : undefined), [homeId]);

  const trail = useMemo<Entity[]>(() => {
    if (!entity || !homeId) return entity ? [entity] : [];
    const chain = [entity, ...dataProvider.getAncestors(entity.id)];
    const homeIdx = chain.findIndex((e) => e.id === homeId);
    // clamp to home → current; if home isn't on the chain (escaped scope), show
    // only the current entity rather than leaking the full ancestor chain.
    const bounded = homeIdx >= 0 ? chain.slice(0, homeIdx + 1) : [entity];
    return bounded.reverse();
  }, [entity, homeId]);

  const children = useMemo(() => (currentId ? dataProvider.getChildren(currentId) : []), [currentId]);
  const childLevel = entity ? childLevelOf(entity.level) : null;

  return { user, entity, homeEntity, currentId, homeId, setScope, resetScope, trail, children, childLevel };
}

export function useScorecard(entityId: string | null | undefined) {
  const fw = useFramework();
  const pmShri = usePmShri();
  const role = useSession((s) => s.user?.role);
  return useMemo(() => {
    dataProvider.setSchoolFilter(pmShri);
    return entityId ? getScorecard(fw, entityId, PERIODS, role) : null;
  }, [fw, entityId, pmShri, role]);
}

export function useKpiRecord(kpiId: string | undefined, entityId: string | null | undefined) {
  const fw = useFramework();
  const pmShri = usePmShri();
  return useMemo(() => {
    dataProvider.setSchoolFilter(pmShri);
    return kpiId && entityId ? getKpiRecord(fw, kpiId, entityId, PERIODS) : null;
  }, [fw, kpiId, entityId, pmShri]);
}

/** the sub-metric records of a multi-metric indicator (empty for single-metric). */
export function useKpiMetrics(kpiId: string | undefined, entityId: string | null | undefined) {
  const fw = useFramework();
  const pmShri = usePmShri();
  return useMemo(() => {
    dataProvider.setSchoolFilter(pmShri);
    return kpiId && entityId ? getKpiMetricRecords(fw, kpiId, entityId, PERIODS) : [];
  }, [fw, kpiId, entityId, pmShri]);
}

/** child units (one level below) scored + graded — powers the embedded
 *  n-1 comparison bar charts on the home screen and domain pages. */
export function useChildLeaderboard(entityId: string | null | undefined) {
  const fw = useFramework();
  const pmShri = usePmShri();
  const role = useSession((s) => s.user?.role);
  return useMemo(() => {
    dataProvider.setSchoolFilter(pmShri);
    return entityId ? getChildLeaderboard(fw, entityId, PERIODS, role) : [];
  }, [fw, entityId, pmShri, role]);
}

/** Read-only aggregate benchmark (overall % + per-domain %) for a higher level
 *  shown as comparison context only — see engine getOverallBenchmark. */
export function useOverallBenchmark(entityId: string | null | undefined) {
  const fw = useFramework();
  const pmShri = usePmShri();
  const role = useSession((s) => s.user?.role);
  return useMemo(() => {
    dataProvider.setSchoolFilter(pmShri);
    return entityId ? getOverallBenchmark(fw, entityId, PERIODS, role) : null;
  }, [fw, entityId, pmShri, role]);
}

export function useEntity(id: string | null | undefined) {
  return useMemo(() => (id ? dataProvider.getEntity(id) : undefined), [id]);
}

/** Per-child values of one KPI (or sub-metric) for the embedded Compare chart.
 *  Unit-consistent: each value is in the KPI/metric's own unit. Empty when no
 *  ids are given (so callers pass `[]` until Compare is applied). */
export function useKpiChildSeries(kpiId: string | undefined, entityIds: string[], metricId?: string) {
  const fw = useFramework();
  const pmShri = usePmShri();
  const idsKey = entityIds.join(",");
  return useMemo(() => {
    dataProvider.setSchoolFilter(pmShri);
    if (!kpiId || entityIds.length === 0) return [];
    return getKpiChildSeries(fw, kpiId, entityIds, PERIODS, metricId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fw, kpiId, idsKey, metricId, pmShri]);
}

/** schools-in-scope coverage + enrolment (honours PM-Shri) — for the data-coverage
 *  chip and the chronic-absentee rate. Memoised; the provider caches descendants. */
export function useScopeStats(entityId: string | null | undefined) {
  const pmShri = usePmShri();
  return useMemo(() => {
    if (!entityId) return null;
    dataProvider.setSchoolFilter(pmShri);
    return dataProvider.getScopeStats(entityId);
  }, [entityId, pmShri]);
}
