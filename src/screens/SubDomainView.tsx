import { useNavigate, useParams } from "react-router-dom";
import { useScope, useScorecard } from "@/hooks";
import { useT } from "@/i18n";
import { Card } from "@/components/ui/atoms";
import { KpiCardAuto } from "@/components/ui/MultiMetricKpiCard";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { BackLink } from "@/components/layout/PageHeader";
import { PageSection, PageGrid } from "@/components/layout/PageSection";

/** Sub-domain view — tier 3 of the 3-click drill (Domain › Sub-domain › Indicators). */
export default function SubDomainView() {
  const { domainId, subId } = useParams();
  const { entity, currentId } = useScope();
  const sc = useScorecard(currentId);
  const { t, tn, lang } = useT();
  const navigate = useNavigate();

  if (!sc) return null;
  const ds = sc.domainScores.find((d) => d.domain.id === domainId);
  const ss = ds?.subScores.find((s) => s.sub.id === subId);
  if (!ds || !ss) {
    return (
      <ScreenContainer>
        <BackLink label={ds ? tn(ds.domain.name, ds.domain.name_gu) : t("nav.home")} onClick={() => navigate(`/app/domain/${domainId}`)} />
        <Card className="card-pad text-center text-sm text-neutral-500">{t("domain.noKpis")}</Card>
      </ScreenContainer>
    );
  }

  const parentName = sc.parent ? tn(sc.parent.entity.name, sc.parent.entity.name_gu) : undefined;

  return (
    <ScreenContainer>
      <BackLink label={tn(ds.domain.name, ds.domain.name_gu)} onClick={() => navigate(`/app/domain/${domainId}`)} />

      <PageSection title={t("scorecard.indicators")}>
        <PageGrid cols="kpi">
          {ss.records.map((r) => (
            <KpiCardAuto
              key={r.kpi.id}
              rec={r}
              name={tn(r.kpi.name, r.kpi.name_gu)}
              lang={lang}
              level={entity?.level}
              parentName={parentName}
              currentId={currentId}
              onClick={() => navigate(`/app/kpi/${r.kpi.id}`)}
            />
          ))}
        </PageGrid>
      </PageSection>
    </ScreenContainer>
  );
}
