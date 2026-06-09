import { useNavigate } from "react-router-dom";
import type { DomainScore } from "@/types";
import { useScope, useScorecard, useScopeStats } from "@/hooks";
import { useT } from "@/i18n";
import { cn } from "@/lib/cn";
import { accent, valueToneClass, deltaToneClass, GRADE_GROUP, gradeGroupOf } from "@/lib/colors";
import { pct, locNum, greetingKey } from "@/lib/format";
import { overallTrendData } from "@/lib/trend";
import { OUTPUT_DOMAIN_ID } from "@/config/frameworks";
import { GSQAC_DOMAINS } from "@/config/kpiCatalog";
import { SectionLabel, Badge, ProgressBar } from "@/components/ui/atoms";
import { RatingRing } from "@/components/ui/RatingRing";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { HeroKpiStrip } from "@/components/ui/HeroKpiStrip";
import { Sparkline } from "@/components/ui/Sparkline";
import { VskBadge } from "@/components/ui/VskBadge";
import { Icon, ChevronRight, ArrowUpRight, ArrowDownRight, Database } from "@/components/ui/Icon";

/**
 * Homepage (mobile-first, same for every role). Order: Overall score → Domain
 * cards → School Quality → Key indicators. The overall score is the headline
 * with its grade badge + a small 30-day trend; domain cards show the next-level-
 * up entity's name + score (not a ± delta); status lives in colour, not chrome.
 */
export default function ScorecardHome() {
  const { user, entity, currentId } = useScope();
  const sc = useScorecard(currentId);
  const stats = useScopeStats(currentId);
  const { t, tn, lang } = useT();
  const navigate = useNavigate();

  if (!entity || !sc) return null;

  const greeting = t(`greeting.${greetingKey()}`);
  const inputs = sc.domainScores.filter((d) => d.domain.kind === "input" && d.records.length > 0);
  const output = sc.domainScores.find((d) => d.domain.id === OUTPUT_DOMAIN_ID);
  const gsqac = entity.meta.gsqac;
  const allRecords = sc.domainScores.flatMap((d) => d.records);
  const gsqacCoverage = stats && stats.schools > 0 && stats.gsqacReal < stats.schools ? stats : null;
  const overallTrend = overallTrendData(sc.overallPercent, entity.id);
  const gradeHex = sc.grade ? GRADE_GROUP[gradeGroupOf(sc.grade)].hex : "#9CA3AF";
  const parent = sc.parent;

  // net movement of the overall score across the trend window (the "which way am I going")
  const overallNet = overallTrend.length > 1 ? Math.round(overallTrend[overallTrend.length - 1]) - Math.round(overallTrend[0]) : 0;
  const netStr = `${overallNet > 0 ? "+" : overallNet < 0 ? "−" : "±"}${locNum(Math.abs(overallNet), lang)}`;
  const netTone = overallNet > 0 ? "bg-rag-greenSoft text-rag-greenText" : overallNet < 0 ? "bg-rag-redSoft text-rag-redText" : "bg-neutral-100 text-neutral-500";

  const domainWoW = (d: DomainScore) => {
    const ds = d.records
      .filter((r) => r.kpi.unit === "%" || r.kpi.unit === "score")
      .map((r) => r.deltaWoW)
      .filter((v): v is number => v != null);
    return ds.length ? Math.round((ds.reduce((a, b) => a + b, 0) / ds.length) * 10) / 10 : null;
  };
  const parentPct = (id: string) => parent?.domainPercents[id] ?? null;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* scope header */}
      <div className="flex items-center gap-3">
        <VskBadge size={40} />
        <div className="min-w-0">
          {user && <p className="text-sm font-medium text-neutral-500">{greeting}, {tn(user.name, user.name_gu).split(" ")[0]}</p>}
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-xl font-extrabold tracking-tight text-neutral-900 sm:text-2xl" title={tn(entity.name, entity.name_gu)}>{tn(entity.name, entity.name_gu)}</h1>
            <Badge className="bg-neutral-100 text-neutral-500">{t(`levels.${entity.level}`)}</Badge>
          </div>
        </div>
      </div>

      {/* OVERALL SCORE — the hero: ring + grade + contextual 30-day trend read as one unit.
          Subtle green-tinted surface + raised elevation sets it apart from the domain cards. */}
      <div className="rounded-2xl border border-rag-green/20 bg-gradient-to-br from-tint-mintBg via-white to-tint-greenBg/40 p-4 shadow-raised sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
          <div className="flex items-center gap-4 sm:shrink-0">
            <RatingRing percent={sc.overallPercent} grade={sc.grade} size={104} stroke={11} lang={lang} sublabel={t("scorecard.overall")} />
            {sc.grade && <RatingBadge grade={sc.grade} size="lg" />}
          </div>
          {overallTrend.length > 1 && (
            <div className="min-w-0 flex-1 sm:border-l sm:border-line/60 sm:pl-6">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="section-title !mb-0">{t("kpi.trendDaily")}</p>
                <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold tnum", netTone)}>
                  {t("scorecard.netOver30", { delta: netStr, n: locNum(30, lang) })}
                </span>
              </div>
              <Sparkline data={overallTrend} color={gradeHex} height={56} strokeWidth={2.5} baseline={overallTrend[0]} emphasizeEnd responsive />
            </div>
          )}
        </div>
      </div>

      {/* DOMAIN cards */}
      <div>
        <SectionLabel className="mb-2">{t("scorecard.domainsHeader")}</SectionLabel>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {inputs.map((d) => {
            const a = accent(d.domain.accent);
            const wow = domainWoW(d);
            const pp = parentPct(d.domain.id);
            return (
              <button key={d.domain.id} onClick={() => navigate(`/app/domain/${d.domain.id}`)} className="group card card-pad flex flex-col gap-2 text-left transition-shadow hover:shadow-raised">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", a.bg)}><Icon name={d.domain.icon} className={a.icon} size={18} /></span>
                    <span className="block truncate text-sm font-bold text-neutral-900">{tn(d.domain.name, d.domain.name_gu)}</span>
                  </span>
                  <ChevronRight size={16} className="shrink-0 text-neutral-300 transition-transform group-hover:translate-x-0.5" />
                </div>
                <div className="flex items-end justify-between gap-2">
                  <span className={cn("text-3xl font-extrabold tnum", d.percent == null ? "text-rag-naText" : valueToneClass(d.status))}>{d.percent == null ? t("common.na") : pct(d.percent, lang)}</span>
                  {wow != null && wow !== 0 && (
                    <span className={cn("inline-flex items-center pb-1 text-2xs font-bold", deltaToneClass(wow, "higher"))}>
                      {wow > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{locNum(Math.abs(wow), lang)}
                    </span>
                  )}
                </div>
                {parent && pp != null && (
                  <span className="truncate text-2xs text-neutral-400">{tn(parent.entity.name, parent.entity.name_gu)} · {pct(pp, lang)}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* SCHOOL QUALITY — GSQAC output, annual */}
      {output && output.percent != null && (
        <button onClick={() => navigate(`/app/domain/${OUTPUT_DOMAIN_ID}`)} className="group block w-full rounded-2xl border border-tint-pinkRing/80 bg-gradient-to-br from-tint-pinkBg to-white p-4 text-left shadow-card transition-shadow hover:shadow-raised sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-tint-pinkRing"><Icon name="Award" className="text-pink-700" size={18} /></span>
              <span>
                <span className="block text-sm font-bold text-neutral-900">{tn(output.domain.name, output.domain.name_gu)}</span>
                <span className="block text-2xs font-semibold uppercase tracking-wide text-pink-700">{t("scorecard.output")} · {t("scorecard.annual")}</span>
              </span>
            </span>
            <span className="flex items-center gap-2">
              <span className={cn("text-3xl font-extrabold tnum", valueToneClass(output.status))}>{pct(output.percent, lang)}</span>
              {output.grade && <RatingBadge grade={output.grade} size="md" />}
              <ChevronRight size={16} className="text-neutral-300 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
          {gsqacCoverage && gsqacCoverage.schools >= 2 && (
            <p
              className="mt-2 inline-flex items-center gap-1 text-2xs text-neutral-500"
              title={t("ogm.coverageHint")}
              aria-label={`${t("ogm.coverage", { real: locNum(gsqacCoverage.gsqacReal, lang), total: locNum(gsqacCoverage.schools, lang) })}. ${t("ogm.coverageHint")}`}
            >
              <Database size={11} /> {t("ogm.coverage", { real: locNum(gsqacCoverage.gsqacReal, lang), total: locNum(gsqacCoverage.schools, lang) })}
            </p>
          )}
          {gsqac && (
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-5">
              {GSQAC_DOMAINS.map((g) => {
                const v = gsqac.domains[g.key];
                return (
                  <div key={g.key} className="min-w-0">
                    <div className="flex items-center justify-between gap-1 text-2xs text-neutral-500"><span className="truncate" title={tn(g.name, g.name_gu)}>{tn(g.name, g.name_gu)}</span><span className="tnum font-semibold">{v == null ? t("common.na") : pct(v * 100, lang)}</span></div>
                    {v != null && <ProgressBar value={v * 100} status={v * 100 >= 75 ? "green" : v * 100 >= 50 ? "amber" : "red"} className="mt-0.5" height={5} />}
                  </div>
                );
              })}
            </div>
          )}
          {gsqac?.improvement != null && (
            <p className="mt-3 text-xs text-neutral-500">
              {t("scorecard.vsLastCycle")}: <b className={deltaToneClass(gsqac.improvement, "higher")}>{gsqac.improvement >= 0 ? "+" : ""}{locNum(gsqac.improvement, lang)}%</b>
              {gsqac.synth && <span className="ml-1 text-2xs text-neutral-300">({t("common.sample")})</span>}
            </p>
          )}
        </button>
      )}

      {/* KEY INDICATORS — full-width tiles, full names; opens the indicator detail */}
      <HeroKpiStrip
        records={allRecords}
        level={entity.level}
        enrolment={stats?.enrolment}
        parentName={parent ? tn(parent.entity.name, parent.entity.name_gu) : undefined}
        onOpen={(rec) => navigate(`/app/kpi/${rec.kpi.id}`)}
      />
    </div>
  );
}
