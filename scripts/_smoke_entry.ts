/* Runtime smoke test of the pure data + engine layer (no React/DOM). */
import { getFramework, PERIODS, UNIFIED_FRAMEWORK } from "@/config";
import { dataProvider } from "@/data/provider";
import { getScorecard, getKpiRecord } from "@/engine";
import { roleFromIdLength } from "@/lib/format";
import meta from "@/data/seed/meta.json";

const fw = getFramework();
const errs: string[] = [];
const ok = (c: boolean, m: string) => { if (!c) errs.push("FAIL: " + m); };
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);

// framework shape
ok(fw.id === "unified", "single unified framework");
ok(fw.kpis.length === 35, `35 KPIs (got ${fw.kpis.length})`);
ok(fw.domains.length === 7, `6A + District domains (got ${fw.domains.length})`);
ok(UNIFIED_FRAMEWORK.domains.some((d) => d.id === "a5"), "A5 (GSQAC) domain present");

const state = dataProvider.getEntity("st-gj")!;
const district = dataProvider.getDescendants("st-gj", "district")[0];
const school = dataProvider.getDescendants("st-gj", "school")[0];
const section = dataProvider.getDescendants(school.id, "section")[0];

for (const e of [state, district, school, section]) {
  const sc = getScorecard(fw, e.id, PERIODS)!;
  ok(!!sc && sc.overallPercent != null && sc.overallPercent >= 0 && sc.overallPercent <= 100, `${e.level} overall in range`);
  console.log(`${e.level.padEnd(9)} ${e.name.slice(0, 22).padEnd(23)} score=${(sc.overallPercent ?? 0).toFixed(1).padStart(5)} grade=${(sc.grade ?? "NA").padEnd(5)} pmShri=${e.meta.pmShri ? "Y" : "-"}`);
}

// NA + cascade consistency
ok(getKpiRecord(fw, "gsqac_score", section.id, PERIODS)!.value === null, "section gsqac_score is NA");
const secAtt = getKpiRecord(fw, "att_pct", section.id, PERIODS)!;
ok(secAtt.value !== null && secAtt.series.length === PERIODS.length, "section att_pct present with series");
const grades = dataProvider.getDescendants(school.id, "grade");
const schoolAtt = getKpiRecord(fw, "att_pct", school.id, PERIODS)!.value!;
const gradeAtt = grades.map((g) => getKpiRecord(fw, "att_pct", g.id, PERIODS)!.value!).filter((v) => v != null);
ok(Math.abs(schoolAtt - mean(gradeAtt)) <= 0.6, `school att == mean(grades) (${schoolAtt} vs ${mean(gradeAtt).toFixed(1)})`);
const blocks = dataProvider.getDescendants(district.id, "block");
const distRe = getKpiRecord(fw, "reenrollment", district.id, PERIODS)!.value!;
const blkRe = blocks.map((b) => getKpiRecord(fw, "reenrollment", b.id, PERIODS)!.value!).filter((v) => v != null);
ok(Math.abs(distRe - mean(blkRe)) <= 0.6, `district reenrollment == mean(blocks) (${distRe} vs ${mean(blkRe).toFixed(1)})`);

// PM SHRI filter changes aggregates
dataProvider.setSchoolFilter("all");
const allState = getScorecard(fw, "st-gj", PERIODS)!.overallPercent;
dataProvider.setSchoolFilter("pmshri");
const pmState = getScorecard(fw, "st-gj", PERIODS)!.overallPercent;
dataProvider.setSchoolFilter("non");
const nonState = getScorecard(fw, "st-gj", PERIODS)!.overallPercent;
dataProvider.setSchoolFilter("all");
ok(pmState !== allState || nonState !== allState, `PM SHRI filter changes the state aggregate (all=${allState} pm=${pmState} non=${nonState})`);

// login: role inferred from ID length + correct second field
ok(roleFromIdLength("24") === "state" && roleFromIdLength("2401") === "deo" && roleFromIdLength("240101") === "brc", "officer ID lengths → roles");
ok(roleFromIdLength("24000009") === "teacher" && roleFromIdLength("2401010001") === "crc" && roleFromIdLength("24010100011") === "principal", "teacher/cluster/school ID lengths → roles");
const deo = meta.demoLogins.find((d) => d.role === "deo")!;
ok(!!dataProvider.resolveLogin("deo", deo.login_id, deo.passcode!), "DEO logs in with District ID + PIN");
ok(!dataProvider.resolveLogin("deo", deo.login_id, "9999"), "wrong PIN rejected");
const tch = meta.demoLogins.find((d) => d.role === "teacher")!;
ok(!!dataProvider.resolveLogin("teacher", tch.login_id, tch.school_id!), "Teacher logs in with Teacher ID + School ID");

console.log(`\n${errs.length ? errs.join("\n") : "ALL SMOKE CHECKS PASSED ✓"}`);
if (errs.length) process.exitCode = 1;
