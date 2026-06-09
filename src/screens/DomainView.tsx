import { useNavigate, useParams } from "react-router-dom";
import { useScope, useScorecard } from "@/hooks";
import { useT } from "@/i18n";
import { Card, StatusDot } from "@/components/ui/atoms";
import { KpiCardAuto } from "@/components/ui/MultiMetricKpiCard";
import { OperationalKpiCard } from "@/components/ui/OperationalKpiCard";
import { ChevronRight } from "@/components/ui/Icon";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { BackLink } from "@/components/layout/PageHeader";
import { PageSection, PageGrid } from "@/components/layout/PageSection";

/**
 * Domain view — tier 2 of the 3-click drill. No top summary card: the back link
 * is followed directly by the indicator section (Administration shows its
 * sub-domains first; other domains list their indicators).
 */
export default function DomainView() {
  const { domainId } = useParams();
  const { entity, currentId } = useScope();
  const sc = useScorecard(currentId);
  const { t, tn, lang } = useT();
  const navigate = useNavigate();

  if (!sc || !entity) return null;
  const ds = sc.domainScores.find((d) => d.domain.id === domainId);
  if (!ds || ds.records.length === 0) {
    return (
      <ScreenContainer>
        <BackLink label={t("nav.home")} onClick={() => navigate("/app")} />
        <Card className="card-pad text-center text-sm text-neutral-500">{t("domain.noKpis")}</Card>
      </ScreenContainer>
    );
  }

  const parentName = sc.parent ? tn(sc.parent.entity.name, sc.parent.entity.name_gu) : undefined;

  // Assessment IA split: a single-metric operational indicator (SAT reports downloaded)
  // sits in its own compact section, separate from the richer multi-metric outcome cards.
  // Config-driven by `kpi.metrics` (currently only Assessment has the mix), so other
  // domains keep their single uniform grid untouched.
  const outcomes = ds.records.filter((r) => r.kpi.metrics?.length);
  const operational = ds.records.filter((r) => !r.kpi.metrics?.length);
  const splitView = ds.subScores.length === 0 && outcomes.length > 0 && operational.length > 0;

  return (
    <ScreenContainer>
      <BackLink label={t("nav.home")} onClick={() => navigate("/app")} />

      {/* sub-domains (Administration) → tier-3 drill */}
      {ds.subScores.length > 0 ? (
        <PageSection title={t("scorecard.subDomains")}>
          <PageGrid cols="two" className="gap-2">
            {ds.subScores.map((ss) => (
              <button
                key={ss.sub.id}
                onClick={() => navigate(`/app/domain/${ds.domain.id}/${ss.sub.id}`)}
                className="group flex items-center gap-3 rounded-xl border border-line/70 bg-white px-3 py-3 text-left hover:bg-neutral-50"
              >
                <StatusDot status={ss.status} className="mt-0.5" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-neutral-900">{tn(ss.sub.name, ss.sub.name_gu)}</span>
                  <span className="text-2xs text-neutral-400">{ss.records.length} {t("scorecard.indicators")}</span>
                </span>
                <ChevronRight size={16} className="shrink-0 text-neutral-300 transition-transform group-hover:translate-x-0.5" />
              </button>
            ))}
          </PageGrid>
        </PageSection>
      ) : splitView ? (
        <>
          {/* Operational indicator — compact health-check row, kept apart from outcomes */}
          <PageSection title={t("domain.operationalIndicator")}>
            <div className="flex flex-col gap-3">
              {operational.map((r) => (
                <OperationalKpiCard
                  key={r.kpi.id}
                  rec={r}
                  name={tn(r.kpi.name, r.kpi.name_gu)}
                  lang={lang}
                  level={entity.level}
                  parentName={parentName}
                  onClick={() => navigate(`/app/kpi/${r.kpi.id}`)}
                />
              ))}
            </div>
          </PageSection>

          {/* Assessment outcomes — the richer multi-metric analytical cards */}
          <PageSection title={t("domain.assessmentOutcomes")}>
            <PageGrid cols="kpi">
              {outcomes.map((r) => (
                <KpiCardAuto
                  key={r.kpi.id}
                  rec={r}
                  name={tn(r.kpi.name, r.kpi.name_gu)}
                  lang={lang}
                  level={entity.level}
                  parentName={parentName}
                  currentId={currentId}
                  onClick={() => navigate(`/app/kpi/${r.kpi.id}`)}
                />
              ))}
            </PageGrid>
          </PageSection>
        </>
      ) : (
        <PageSection title={t("domain.kpisIn", { name: tn(ds.domain.name, ds.domain.name_gu) })}>
          <PageGrid cols="kpi">
            {ds.records.map((r) => (
              <KpiCardAuto
                key={r.kpi.id}
                rec={r}
                name={tn(r.kpi.name, r.kpi.name_gu)}
                lang={lang}
                level={entity.level}
                parentName={parentName}
                currentId={currentId}
                onClick={() => navigate(`/app/kpi/${r.kpi.id}`)}
              />
            ))}
          </PageGrid>
        </PageSection>
      )}
    </ScreenContainer>
  );
}
