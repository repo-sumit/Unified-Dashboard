import type { LucideIcon } from "lucide-react";
import type { Insight, InsightKind, InsightSeverity } from "@/lib/insights";
import { cn } from "@/lib/cn";
import { locNum, formatValueFull } from "@/lib/format";
import { useT } from "@/i18n";
import { Card, SectionLabel } from "./atoms";
import {
  TrendingDown, Gauge, ArrowDownRight, Users, Database, CheckCircle2, ChevronRight, AlertTriangle,
} from "./Icon";

/**
 * "What needs attention?" — the auto-generated priority triage. Renders the
 * live-computed insights (biggest N+1 gap, weakest domain, decline vs cycle,
 * chronic absentees, data-coverage gaps) ranked by urgency. Distinct from the
 * Hero strip (what to act on) and the risk table (which units). The core of
 * the 6-second scan: an officer reads the top line and knows the priority.
 */

const ICON: Record<InsightKind, LucideIcon> = {
  peer_gap: TrendingDown,
  low_domain: Gauge,
  decline: ArrowDownRight,
  chronic: Users,
  coverage: Database,
};

const SEV: Record<InsightSeverity, { dot: string; tint: string }> = {
  critical: { dot: "text-rag-redText", tint: "bg-rag-redSoft" },
  warning: { dot: "text-rag-amberText", tint: "bg-rag-amberSoft" },
  // info (e.g. data-coverage) stays neutral — only red/amber carry urgency on the strip
  info: { dot: "text-neutral-500", tint: "bg-neutral-100" },
};

export function AttentionStrip({ insights, onOpen }: { insights: Insight[]; onOpen?: (ins: Insight) => void }) {
  const { t, tn, lang } = useT();

  if (!insights.length) {
    return (
      <Card className="card-pad flex items-center gap-2.5 border border-emerald-100 bg-emerald-50/40">
        <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
        <p className="text-sm font-medium text-emerald-800">{t("ogm.allClear")}</p>
      </Card>
    );
  }

  const sentence = (ins: Insight): string => {
    const label = tn(ins.label, ins.label_gu);
    const num = (n?: number) => (n == null ? "" : locNum(n, lang));
    const cnt = (n?: number) => (n == null ? "" : formatValueFull(n, "count", lang));
    const pctOrScore = ins.unit === "%" ? "%" : "";
    switch (ins.kind) {
      case "peer_gap":
        return t("ogm.insight.peer_gap", {
          label, metric: `${num(ins.metric)}${pctOrScore}`,
          level: t(`levels.${ins.peerLevel}`), extra: `${num(ins.extra)}${pctOrScore}`,
        });
      case "low_domain":
        return t("ogm.insight.low_domain", { label, metric: num(ins.metric) });
      case "decline":
        return t("ogm.insight.decline", { label, metric: num(ins.metric) });
      case "chronic":
        return ins.extra != null
          ? t("ogm.insight.chronic", { metric: cnt(ins.metric), extra: num(ins.extra) })
          : t("ogm.insight.chronicNoRate", { metric: cnt(ins.metric) });
      case "coverage":
        return t("ogm.insight.coverage", { metric: cnt(ins.metric), extra: cnt(ins.extra) });
    }
  };

  return (
    <Card className="card-pad">
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-x-2">
        <SectionLabel className="!mb-0 inline-flex items-center gap-1.5">
          <AlertTriangle size={13} className="text-rag-amberText" /> {t("ogm.attentionTitle")}
        </SectionLabel>
        <span className="text-2xs text-neutral-400">{t("ogm.attentionHint")}</span>
      </div>
      <ul className="-mx-1 space-y-0.5">
        {insights.map((ins) => {
          const I = ICON[ins.kind];
          const sev = SEV[ins.severity];
          const interactive = !!(ins.domainId || ins.kpiId);
          return (
            <li key={ins.id}>
              <button
                onClick={() => interactive && onOpen?.(ins)}
                disabled={!interactive}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left",
                  interactive ? "transition-colors hover:bg-neutral-50" : "cursor-default",
                )}
              >
                <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-full", sev.tint)}>
                  <I size={14} className={sev.dot} />
                </span>
                <span className="min-w-0 flex-1 text-sm font-medium leading-snug text-neutral-700">{sentence(ins)}</span>
                {interactive && <ChevronRight size={15} className="shrink-0 text-neutral-300" />}
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
