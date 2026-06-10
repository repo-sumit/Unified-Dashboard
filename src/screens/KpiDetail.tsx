import { useNavigate, useParams } from "react-router-dom";
import type { KpiRecord, Level } from "@/types";
import { useScope, useKpiRecord, useKpiMetrics, useFramework } from "@/hooks";
import { useT, type Lang } from "@/i18n";
import { rag } from "@/lib/colors";
import { resolveMetricLabel } from "@/lib/format";
import { buildTrend, trendTitleKey, getLastUpdatedLabel } from "@/lib/trend";
import { GSQAC_DOMAINS, GSQAC_SUBDOMAINS } from "@/config/kpiCatalog";
import { Card, SectionLabel, EmptyNA } from "@/components/ui/atoms";
import { TrendChart } from "@/components/ui/TrendChart";
import { FrequencyBadge } from "@/components/ui/DataBadges";
import { Database } from "@/components/ui/Icon";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { BackLink } from "@/components/layout/PageHeader";

export default function KpiDetail() {
  const { kpiId } = useParams();
  const { entity, currentId } = useScope();
  const fw = useFramework();
  const rec = useKpiRecord(kpiId, currentId);
  const metricRecs = useKpiMetrics(kpiId, currentId);
  const { t, tn, lang } = useT();
  const navigate = useNavigate();

  if (!rec || !entity) return null;
  const kpi = rec.kpi;
  const c = rag(rec.status);
  const na = rec.value == null;
  const domain = fw.domains.find((d) => d.id === kpi.domain_id);
  const isMulti = metricRecs.length > 0;
  const isGsqac = kpi.id.startsWith("sq_");

  const name = tn(kpi.name, kpi.name_gu);

  const trend = na || kpi.noTrend ? null : buildTrend(rec, lang);
  const luLabel = getLastUpdatedLabel(kpi, new Date(), lang);

  return (
    <ScreenContainer>
      <BackLink label={t("common.back")} onClick={() => navigate(-1)} />

      {/* ── compact page header — title + meta only; no value/summary strip ── */}
      <div className="pb-2">
        {domain && <p className="text-xs font-semibold text-primary-600">{tn(domain.name, domain.name_gu)}</p>}
        <h1 className="mt-0.5 text-xl font-extrabold leading-snug text-neutral-900">{name}</h1>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-2xs text-neutral-400">
          <FrequencyBadge frequency={kpi.frequency} />
          {luLabel && <span>· {luLabel}</span>}
          <span className="inline-flex items-center gap-1 truncate" title={kpi.data_source}>
            <Database size={10} className="shrink-0" />
            <span className="truncate">{kpi.data_source}</span>
          </span>
        </div>
      </div>

      {/* TREND — chart title includes KPI/metric name so graphs are unambiguous */}
      {isMulti ? (
        metricRecs.map((mr) => <MetricTrendCard key={mr.kpi.id} rec={mr} level={entity.level} lang={lang} />)
      ) : na ? (
        <EmptyNA hint={t("kpi.noData")} />
      ) : !kpi.noTrend && trend ? (
        <Card className="card-pad">
          <SectionLabel>{t(trendTitleKey(trend.cadence))}: {name}</SectionLabel>
          <div className="mt-2">
            <TrendChart points={trend.points} unit={kpi.unit} color={c.hex} cadence={trend.cadence} lang={lang} />
          </div>
        </Card>
      ) : null}

      {/* GSQAC SUB-DOMAIN BREAKDOWN — the report's domain → sub-domain → indicator structure */}
      {isGsqac && <GsqacBreakdown kpiId={kpi.id} />}

      {/* HOW IT'S CALCULATED */}
      {isMulti ? (
        <Card className="card-pad">
          <SectionLabel>{t("kpi.formula")}</SectionLabel>
          <dl className="mt-2 space-y-2.5">
            {metricRecs.map((mr) => (
              <div key={mr.kpi.id}>
                <dt className="text-xs font-bold text-neutral-800">
                  {resolveMetricLabel(mr.kpi.name, mr.kpi.name_gu, entity.level, lang)}
                </dt>
                <dd className="text-sm text-neutral-600">{mr.kpi.formula}</dd>
              </div>
            ))}
          </dl>
          {kpi.dataLagNote && <p className="mt-2 text-2xs text-neutral-400">{kpi.dataLagNote}</p>}
        </Card>
      ) : kpi.formula ? (
        <Card className="card-pad">
          <SectionLabel>{t("kpi.formula")}</SectionLabel>
          <p className="mt-2 text-sm text-neutral-700">{kpi.formula}</p>
          {kpi.dataLagNote && <p className="mt-2 text-2xs text-neutral-400">{kpi.dataLagNote}</p>}
        </Card>
      ) : null}
    </ScreenContainer>
  );
}

/**
 * GSQAC sub-domain breakdown — the report's domain → sub-domain → indicator
 * structure. For the overall GSQAC score, all 5 domains are shown (each as a
 * labelled group); for a single domain (sq_dN), only that domain's sub-domains.
 * Reference structure from the report card — not per-entity scores.
 */
function GsqacBreakdown({ kpiId }: { kpiId: string }) {
  const { t, tn } = useT();
  const overall = kpiId === "sq_gsqac";
  const domains = overall ? GSQAC_DOMAINS : GSQAC_DOMAINS.filter((d) => d.kpiId === kpiId);
  if (!domains.length) return null;
  return (
    <Card className="card-pad">
      <SectionLabel>{t("kpi.subdomains")}</SectionLabel>
      <div className="mt-3 space-y-4">
        {domains.map((d) => {
          const subs = GSQAC_SUBDOMAINS[d.key] ?? [];
          if (!subs.length) return null;
          return (
            <div key={d.key}>
              {overall && <p className="mb-1.5 text-xs font-bold text-primary-600">{tn(d.name, d.name_gu)}</p>}
              <ul className="space-y-2">
                {subs.map((s) => (
                  <li key={s.name} className="rounded-xl bg-neutral-50 px-3 py-2">
                    <p className="text-sm font-semibold text-neutral-800">{tn(s.name, s.name_gu)}</p>
                    <p className="mt-0.5 text-2xs leading-relaxed text-neutral-500">{s.indicators.join(" · ")}</p>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/** One trend chart per sub-metric — title is "{resolved metric label} · {cadence}". */
function MetricTrendCard({ rec, level, lang }: { rec: KpiRecord; level: Level; lang: Lang }) {
  const { t } = useT();
  if (rec.value == null) return null;
  const trend = buildTrend(rec, lang);
  if (trend.points.length < 2) return null;
  const c = rag(rec.status);
  const label = resolveMetricLabel(rec.kpi.name, rec.kpi.name_gu, level, lang);
  return (
    <Card className="card-pad">
      <SectionLabel>{label} · {t(trendTitleKey(trend.cadence))}</SectionLabel>
      <div className="mt-2">
        <TrendChart points={trend.points} unit={rec.kpi.unit} color={c.hex} cadence={trend.cadence} lang={lang} height={180} />
      </div>
    </Card>
  );
}
