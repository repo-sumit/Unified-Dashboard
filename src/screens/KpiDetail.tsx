import { useNavigate, useParams } from "react-router-dom";
import type { KpiRecord, Level } from "@/types";
import { useScope, useKpiRecord, useKpiMetrics, useFramework } from "@/hooks";
import { useT, type Lang } from "@/i18n";
import { rag, gsqacGradeHex } from "@/lib/colors";
import { resolveMetricLabel } from "@/lib/format";
import { buildTrend, trendTitleKey, getLastUpdatedLabel } from "@/lib/trend";
import { gradeFor, GSQAC_BANDS } from "@/config/ratingBands";
import { GSQAC_DOMAINS, GSQAC_SUBDOMAINS } from "@/config/kpiCatalog";
import { Card, SectionLabel, EmptyNA } from "@/components/ui/atoms";
import { TrendChart, MultiTrendChart } from "@/components/ui/TrendChart";
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

      {/* TREND — chart title includes KPI/metric name so graphs are unambiguous.
          GSQAC multi-metric (CET & CGMS) → one chart, one line per sub-metric. */}
      {isMulti ? (
        isGsqac ? (
          <GsqacMultiTrend recs={metricRecs} name={name} level={entity.level} lang={lang} />
        ) : (
          metricRecs.map((mr) => <MetricTrendCard key={mr.kpi.id} rec={mr} level={entity.level} lang={lang} />)
        )
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

      {/* GSQAC SUB-DOMAIN BREAKDOWN — per-domain only (not on the overall GSQAC score page) */}
      {isGsqac && kpi.id !== "sq_gsqac" && <GsqacBreakdown kpiId={kpi.id} />}

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
 * GSQAC sub-domain breakdown for a single domain (sq_dN) — the report's
 * sub-domain → indicator structure. Reference structure from the report card,
 * not per-entity scores. Not rendered for the overall GSQAC score page.
 */
function GsqacBreakdown({ kpiId }: { kpiId: string }) {
  const { t, tn } = useT();
  const domain = GSQAC_DOMAINS.find((d) => d.kpiId === kpiId);
  const subs = domain ? GSQAC_SUBDOMAINS[domain.key] ?? [] : [];
  if (!subs.length) return null;
  return (
    <Card className="card-pad">
      <SectionLabel>{t("kpi.subdomains")}</SectionLabel>
      <ul className="mt-3 space-y-2">
        {subs.map((s) => (
          <li key={s.name} className="rounded-xl bg-neutral-50 px-3 py-2">
            <p className="text-sm font-semibold text-neutral-800">{tn(s.name, s.name_gu)}</p>
            <p className="mt-0.5 text-2xs leading-relaxed text-neutral-500">{s.indicators.join(" · ")}</p>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/**
 * GSQAC multi-metric trend — all sub-metrics on ONE chart, one line each (e.g. CET
 * & CGMS for the State-Exams domain). Title is "{cadence trend}: {domain name}".
 */
function GsqacMultiTrend({ recs, name, level, lang }: { recs: KpiRecord[]; name: string; level: Level; lang: Lang }) {
  const { t } = useT();
  const series = recs
    .map((mr) => ({ rec: mr, trend: buildTrend(mr, lang) }))
    .filter((s) => s.trend.points.length >= 2);
  if (!series.length) return null;
  const cadence = series[0].trend.cadence;
  return (
    <Card className="card-pad">
      <SectionLabel>{t(trendTitleKey(cadence))}: {name}</SectionLabel>
      <div className="mt-2">
        <MultiTrendChart
          series={series.map((s) => {
            // line colour follows the GSQAC grade scale — by each metric's latest value
            const v = s.rec.value ?? s.trend.points[s.trend.points.length - 1].value;
            return {
              key: s.rec.kpi.id,
              label: resolveMetricLabel(s.rec.kpi.name, s.rec.kpi.name_gu, level, lang),
              color: gsqacGradeHex(gradeFor(v, GSQAC_BANDS).grade),
              points: s.trend.points,
            };
          })}
          unit={series[0].rec.kpi.unit}
          cadence={cadence}
          lang={lang}
          height={200}
        />
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
