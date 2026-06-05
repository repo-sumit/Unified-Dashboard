import type { KpiDef, Level, LevelRepresentation, Representation } from "@/types";

/**
 * Unified Portal — the canonical 6A KPI catalog (35 KPIs across A1–A6 +
 * District tracking), transcribed from
 * `Docs/GJ_Unified platform_KPI definition.xlsx` → sheet "6A KPI Framework":
 * clarified descriptions, per-level granularity, and the real data source per
 * KPI. Punitive labels are reframed supportively per the feedback doc
 * (EWS → "At Risk"; "Below Benchmark"/"Low-Performing" → support framing).
 * Adding a KPI here (or a kpi_definitions row) renders it everywhere with no
 * component change.
 */

// ── level_representation builders (section → state) ──────────────────
const rep = (
  section: Representation,
  grade: Representation,
  school: Representation,
  up: Representation,
): LevelRepresentation => ({ section, grade, school, cluster: up, block: up, district: up, state: up });

/** %-style KPI owned at the section/class level, averaged upward. */
const classAvg = () => rep("class", "avg", "school", "avg");
/** %-style KPI that exists from the school up (NA at section/grade). */
const schoolAvg = () => rep("NA", "NA", "school", "avg");
/** count owned per school, summed upward (NA below school). */
const schoolSum = () => rep("NA", "NA", "count", "sum");
/** count of schools — an aggregate that exists from the cluster up. */
const aggCount = () => rep("NA", "NA", "NA", "count");
/** % of schools meeting a bar — aggregate from cluster up. */
const pctMeeting = () => rep("NA", "NA", "NA", "avg");
/** district/state-only tracking metric (NA below block). */
const districtOnly = (): LevelRepresentation => ({
  section: "NA", grade: "NA", school: "NA", cluster: "NA", block: "avg", district: "avg", state: "avg",
});

/** Benchmark targets per level (carried from the Gujarat VSK KPI Framework
 *  PDF; Teacher → section & grade, remaining levels map 1:1). */
export const BENCHMARKS: Record<string, Partial<Record<Level, number>>> = {
  att_pct: { section: 88, grade: 88, school: 91, cluster: 89, block: 87, district: 88, state: 89 },
  att_chronic: { school: 42, cluster: 210, block: 820, district: 4200, state: 48000 },
  att_below_bench: { cluster: 8, block: 27, district: 140, state: 1120 },
  att_report: { section: 100, grade: 100, school: 98, cluster: 97, block: 96, district: 97, state: 97 },
  at_risk_followup: { section: 90, grade: 90, school: 88, cluster: 86, block: 84, district: 85, state: 84 },

  asm_participation: { section: 96, grade: 96, school: 94, cluster: 93, block: 92, district: 93, state: 93 },
  proficiency: { section: 68, grade: 68, school: 64, cluster: 61, block: 59, district: 61, state: 60 },
  below_proficiency: { section: 22, grade: 22, school: 26, cluster: 29, block: 31, district: 29, state: 30 },
  improvement_cycle: { section: 12, grade: 12, school: 10, cluster: 9, block: 8, district: 9, state: 8 },
  orf_fln: { section: 14, grade: 14, school: 11, cluster: 9, block: 8, district: 9, state: 8 },
  reports_generated: { school: 95, cluster: 94, block: 92, district: 93, state: 94 },

  module_completion: { section: 71, grade: 71, school: 68, cluster: 66, block: 63, district: 65, state: 64 },
  tpd_hours: { section: 100, grade: 100, school: 92, cluster: 89, block: 86, district: 87, state: 87 },
  identified_remediation: { section: 72, grade: 72, school: 70, cluster: 68, block: 66, district: 68, state: 67 },
  receiving_remediation: { section: 68, grade: 68, school: 66, cluster: 64, block: 62, district: 64, state: 63 },
  post_intervention: { section: 60, grade: 60, school: 58, cluster: 56, block: 54, district: 56, state: 55 },

  scheme_delivery: { school: 95, cluster: 94, block: 93, district: 94, state: 94 },
  payment_completion: { school: 94, cluster: 92, block: 91, district: 92, state: 92 },
  pending_grievances: { school: 18, cluster: 110, block: 430, district: 2200, state: 21000 },
  issue_resolution: { school: 88, cluster: 85, block: 83, district: 85, state: 84 },
  repeat_cases: { school: 4, cluster: 21, block: 90, district: 470, state: 4800 },

  gsqac_score: { school: 72, cluster: 71, block: 69, district: 70, state: 70 },
  schools_meeting: { cluster: 71, block: 68, district: 70, state: 69 },
  priority_support: { cluster: 7, block: 24, district: 118, state: 980 },
  gsqac_improvement: { school: 9, cluster: 8, block: 7, district: 8, state: 7 },
  improvement_actions: { school: 84, cluster: 82, block: 79, district: 81, state: 80 },

  sameday_reporting: { section: 95, grade: 95, school: 93, cluster: 91, block: 90, district: 92, state: 91 },
  dashboard_lag: { school: 2, cluster: 3, block: 4, district: 4, state: 4 },
  pending_issues: { school: 11, cluster: 74, block: 310, district: 1520, state: 14000 },
  repeat_issues: { school: 7, cluster: 8, block: 10, district: 9, state: 10 },
  action_atrisk: { school: 88, cluster: 85, block: 83, district: 84, state: 83 },

  dropout_reduction: { block: 3.2, district: 2.9, state: 2.8 },
  reenrollment: { block: 78, district: 77, state: 76 },
  grant_expenditure: { block: 82, district: 80, state: 79 },
  pmshri_score: { block: 78, district: 76, state: 76 },
};

type CatItem = Omit<KpiDef, "sort_order"> & { sort_order?: number };

const CATALOG: CatItem[] = [
  // ── A1: Attendance & Access (blue) ───────────────────────────────
  k("att_pct", "a1", "Attendance %", "હાજરી %", "%", "higher", "Smart Attendance System (OAS)", "≥ 90%", classAvg(),
    "Daily student attendance (present ÷ enrolled × 100), rolled up to school/cluster/block/state averages.",
    "દૈનિક વિદ્યાર્થી હાજરી (હાજર ÷ નોંધાયેલ × ૧૦૦), દરેક સ્તરે સરેરાશ."),
  k("att_chronic", "a1", "Chronic Absentee Students", "સતત ગેરહાજર વિદ્યાર્થીઓ", "count", "lower", "Child Tracking System + EWS", "Reduce", schoolSum(),
    "Students absent for >7 consecutive days or >30% of school days in a month — for early intervention.",
    "મહિનામાં >૭ સળંગ દિવસ અથવા >૩૦% દિવસ ગેરહાજર વિદ્યાર્થીઓ — વહેલા હસ્તક્ષેપ માટે."),
  k("att_below_bench", "a1", "Schools Needing Attendance Support", "હાજરી સહાય જરૂરી શાળાઓ", "count", "lower", "Smart Attendance System (OAS)", "Reduce", aggCount(),
    "Schools where average attendance is below the state benchmark — prioritised for support.",
    "સરેરાશ હાજરી રાજ્ય બેન્ચમાર્કથી નીચે હોય તેવી શાળાઓ — સહાય માટે પ્રાથમિકતા."),
  k("att_report", "a1", "Attendance Reporting Compliance %", "હાજરી રિપોર્ટિંગ અનુપાલન %", "%", "higher", "Smart Attendance System (OAS)", "100%", classAvg(),
    "Share of schools that submitted attendance by the daily cut-off — system-usage discipline, not student attendance.",
    "દૈનિક કટ-ઓફ સુધી હાજરી સબમિટ કરનાર શાળાઓનો હિસ્સો — સિસ્ટમ ઉપયોગની શિસ્ત."),
  k("at_risk_followup", "a1", "At-Risk Follow-up Completed %", "જોખમ ધરાવતા ફોલો-અપ પૂર્ણ %", "%", "higher", "EWS · SMA", "≥ 90%", classAvg(),
    "Share of At-Risk-flagged students with a completed, logged follow-up (home visit, counsellor call).",
    "જોખમ-ફ્લેગ થયેલ વિદ્યાર્થીઓમાં પૂર્ણ થયેલ ફોલો-અપ (ઘરની મુલાકાત, કાઉન્સેલર કોલ) નો હિસ્સો."),

  // ── A2: Assessment & Learning Outcomes (green) ───────────────────
  k("asm_participation", "a2", "Assessment Participation %", "મૂલ્યાંકન સહભાગિતા %", "%", "higher", "Xamta App (PAT/SAT)", "≥ 95%", classAvg(),
    "Enrolled students who actually appeared in the scheduled PAT/SAT assessment.",
    "નિર્ધારિત PAT/SAT મૂલ્યાંકનમાં ખરેખર હાજર રહેલ નોંધાયેલ વિદ્યાર્થીઓ."),
  k("proficiency", "a2", "Proficiency %", "નિપુણતા %", "%", "higher", "Xamta · PARAKH", "≥ 65%", classAvg(),
    "Students scoring at or above the PARAKH-aligned proficiency threshold (clear mastery criterion).",
    "PARAKH-આધારિત નિપુણતા થ્રેશોલ્ડ પર કે ઉપર સ્કોર કરનાર વિદ્યાર્થીઓ."),
  k("below_proficiency", "a2", "Students Below Proficiency %", "નિપુણતાથી નીચે વિદ્યાર્થીઓ %", "%", "lower", "Xamta · Gyan Prabhav", "Reduce", classAvg(),
    "Assessed students scoring below the proficiency level — segmented for targeted intervention.",
    "નિપુણતા સ્તરથી નીચે સ્કોર કરનાર મૂલ્યાંકિત વિદ્યાર્થીઓ — લક્ષિત હસ્તક્ષેપ માટે."),
  k("improvement_cycle", "a2", "Improvement Across Cycles %", "ચક્રો વચ્ચે સુધારો %", "%", "higher", "Xamta · Gyan Prabhav", "↑ each cycle", classAvg(),
    "Percentage-point change in average score between two consecutive assessment cycles (PAT/SAT).",
    "બે સળંગ મૂલ્યાંકન ચક્રો વચ્ચે સરેરાશ સ્કોરમાં ટકાવારી-બિંદુ ફેરફાર."),
  k("orf_fln", "a2", "Improvement in ORF & FLN", "ORF અને FLN માં સુધારો", "%", "higher", "Vaachan Samiksha · FLN", "↑ each cycle", classAvg(),
    "Improvement in Oral Reading Fluency (words/min) and Foundational Literacy & Numeracy across cycles.",
    "મૌખિક વાચન પ્રવાહિતા અને પાયાનું સાક્ષરતા-ગણન માં ચક્રો વચ્ચે સુધારો."),
  k("reports_generated", "a2", "Reports Generated & Downloaded %", "રિપોર્ટ બનાવ્યા અને ડાઉનલોડ %", "%", "higher", "Gyan Prabhav", "≥ 95%", schoolAvg(),
    "Schools whose Gyan Prabhav student report cards were generated and accessed within the reporting window.",
    "રિપોર્ટિંગ વિન્ડોમાં Gyan Prabhav રિપોર્ટ કાર્ડ બનાવ્યા અને જોયા હોય તેવી શાળાઓ."),

  // ── A3: Adaptive Learning & Remediation (yellow) ─────────────────
  k("module_completion", "a3", "Module Completion %", "મોડ્યુલ પૂર્ણતા %", "%", "higher", "Swamulyankan / G-SHALA", "≥ 70%", classAvg(),
    "Students assigned a remediation/adaptive module on Swamulyankan/G-SHALA who completed it.",
    "Swamulyankan/G-SHALA પર ઉપચાર મોડ્યુલ સોંપાયેલ અને પૂર્ણ કરનાર વિદ્યાર્થીઓ."),
  k("tpd_hours", "a3", "Teacher TPD Hours Completion %", "શિક્ષક TPD કલાક પૂર્ણતા %", "%", "higher", "Prashikshak", "Min 50 hrs/yr", rep("class", "avg", "school", "avg"),
    "Teachers who completed the minimum 50 hours of Teacher Professional Development this academic year.",
    "આ વર્ષે ઓછામાં ઓછા ૫૦ કલાક શિક્ષક વ્યાવસાયિક વિકાસ પૂર્ણ કરનાર શિક્ષકો."),
  k("identified_remediation", "a3", "Students Identified for Remediation %", "ઉપચાર માટે ઓળખાયેલા વિદ્યાર્થીઓ %", "%", "higher", "Xamta · PARAKH", "Identify all", classAvg(),
    "Enrolled students identified as needing remedial support from assessment data.",
    "મૂલ્યાંકન ડેટા પરથી ઉપચારની જરૂરિયાત તરીકે ઓળખાયેલ વિદ્યાર્થીઓ."),
  k("receiving_remediation", "a3", "Students Receiving Remediation %", "ઉપચાર મેળવતા વિદ્યાર્થીઓ %", "%", "higher", "Swamulyankan / G-SHALA", "≥ identified", classAvg(),
    "Identified students actively enrolled in and engaging with a remediation/adaptive programme.",
    "ઓળખાયેલ વિદ્યાર્થીઓ જે ઉપચાર કાર્યક્રમમાં સક્રિય રીતે જોડાયેલ છે."),
  k("post_intervention", "a3", "Improvement After Intervention %", "હસ્તક્ષેપ પછી સુધારો %", "%", "higher", "Xamta · Gyan Prabhav", "↑ post-remediation", classAvg(),
    "Students who showed measurable improvement (≥5 pp) in post-intervention vs pre-intervention scores.",
    "હસ્તક્ષેપ પછી પૂર્વ-સ્કોર સામે માપી શકાય તેવો સુધારો (≥૫ પોઈન્ટ) દર્શાવનાર વિદ્યાર્થીઓ."),

  // ── A4: Administration & Service Delivery (orange) ───────────────
  k("scheme_delivery", "a4", "Scheme Beneficiary Mapping & Delivery %", "યોજના લાભાર્થી મેપિંગ અને વિતરણ %", "%", "higher", "PFMS / IPMS · UDISE+", "≥ 95%", schoolAvg(),
    "Eligible students mapped to schemes (Namo Lakshmi/Saraswati, DigiVrtti, Gyan Sadhana/Sethu, ST schemes).",
    "યોજનાઓ (નમો લક્ષ્મી/સરસ્વતી, ડિજિવૃત્તિ, જ્ઞાન સાધના/સેતુ) સાથે મેપ થયેલ પાત્ર વિદ્યાર્થીઓ."),
  k("payment_completion", "a4", "Payment Completion % (Scheme-wise)", "ચુકવણી પૂર્ણતા % (યોજનાવાર)", "%", "higher", "PFMS / IPMS", "≥ 95%", schoolAvg(),
    "Mapped beneficiaries for whom payment was successfully disbursed/credited (not just approved).",
    "મેપ થયેલ લાભાર્થીઓ જેમની ચુકવણી સફળતાપૂર્વક જમા થઈ (માત્ર મંજૂર નહીં)."),
  k("pending_grievances", "a4", "Pending Payments & Grievances", "બાકી ચુકવણી અને ફરિયાદો", "count", "lower", "PFMS · CAL · ICT Support", "Reduce", schoolSum(),
    "Unresolved cases: payments past SLA, CAL grievances, and open ICT/infrastructure issues.",
    "વણઉકેલાયેલ કેસ: SLA વીતી ગયેલ ચુકવણી, CAL ફરિયાદો અને ખુલ્લા ICT/માળખા પ્રશ્નો."),
  k("issue_resolution", "a4", "Issue Resolution % (Within SLA)", "સમસ્યા નિરાકરણ % (SLA માં)", "%", "higher", "CAL · ICT Support", "≥ 90%", schoolAvg(),
    "Grievances and service issues resolved within the defined SLA timeline (7 / 15 / 30 days).",
    "નિર્ધારિત SLA સમયમર્યાદામાં ઉકેલાયેલ ફરિયાદો અને સેવા સમસ્યાઓ."),
  k("repeat_cases", "a4", "Repeat / Reopened Cases", "પુનરાવર્તિત / ફરી ખોલેલા કેસ", "count", "lower", "CAL · PFMS", "Reduce", schoolSum(),
    "Cases logged more than once or reopened after closure — indicates systemic failure points.",
    "એક કરતાં વધુ વાર નોંધાયેલ કે બંધ થયા પછી ફરી ખોલેલ કેસ — પ્રણાલીગત નબળાઈ દર્શાવે."),

  // ── A5: Accreditation & School Quality (pink) — GSQAC ────────────
  k("gsqac_score", "a5", "GSQAC Score", "GSQAC સ્કોર", "score", "higher", "GSQAC · Saksham Shala", "Grade A", schoolAvg(),
    "Composite GSQAC school-quality score: Learning & Teaching, Administration, Co-curricular, Resources.",
    "સંયુક્ત GSQAC શાળા-ગુણવત્તા સ્કોર: અધ્યયન-અધ્યાપન, વહીવટ, સહ-અભ્યાસિક, સંસાધનો."),
  k("schools_meeting", "a5", "Schools Meeting Quality Benchmark %", "ગુણવત્તા બેન્ચમાર્ક પૂર્ણ કરતી શાળાઓ %", "%", "higher", "GSQAC", "≥ 75%", pctMeeting(),
    "Schools that achieved an A or B grade under GSQAC in the most recent assessment cycle.",
    "તાજેતરના GSQAC ચક્રમાં A કે B ગ્રેડ મેળવનાર શાળાઓ."),
  k("priority_support", "a5", "Schools for Priority Support", "પ્રાથમિકતા સહાય માટેની શાળાઓ", "count", "lower", "GSQAC · Saksham Shala", "Reduce", aggCount(),
    "Schools in the C/D band prioritised for targeted support and improvement plans.",
    "C/D બેન્ડમાંની શાળાઓ — લક્ષિત સહાય અને સુધારણા યોજનાઓ માટે પ્રાથમિકતા."),
  k("gsqac_improvement", "a5", "GSQAC Improvement Across Cycles %", "GSQAC ચક્રો વચ્ચે સુધારો %", "%", "higher", "GSQAC", "↑ each cycle", schoolAvg(),
    "Percentage-point change in a school's GSQAC score between two consecutive accreditation cycles.",
    "બે સળંગ માન્યતા ચક્રો વચ્ચે શાળાના GSQAC સ્કોરમાં ટકાવારી-બિંદુ ફેરફાર."),
  k("improvement_actions", "a5", "Improvement Actions Completed %", "સુધારણા ક્રિયાઓ પૂર્ણ %", "%", "higher", "SMA · Saksham Shala", "≥ 85%", schoolAvg(),
    "Post-GSQAC / SMA-inspection action points the school completed and documented in time.",
    "GSQAC / SMA નિરીક્ષણ પછીની ક્રિયાઓ જે શાળાએ સમયસર પૂર્ણ અને દસ્તાવેજ કરી."),

  // ── A6: Governance, Monitoring & AI Efficiency (light blue) ──────
  k("sameday_reporting", "a6", "Same-Day Reporting %", "સમાન-દિવસ રિપોર્ટિંગ %", "%", "higher", "VSK · Pocket VSK", "≥ 95%", classAvg(),
    "Schools submitting all required data (attendance, assessment, admin) by the same-day cut-off.",
    "સમાન-દિવસ કટ-ઓફ સુધી તમામ જરૂરી ડેટા સબમિટ કરનાર શાળાઓ."),
  k("dashboard_lag", "a6", "Dashboard Data Lag", "ડેશબોર્ડ ડેટા વિલંબ", "hours", "lower", "VSK Backend Logs", "≤ 2 hrs", schoolAvg(),
    "Average hours between data entry at school level and visibility on VSK dashboards. Lower is better.",
    "શાળા સ્તરે ડેટા એન્ટ્રી અને VSK ડેશબોર્ડ પર દેખાવા વચ્ચેના સરેરાશ કલાક. ઓછું વધુ સારું."),
  k("pending_issues", "a6", "Pending Issues (Cross-System)", "બાકી સમસ્યાઓ (ક્રોસ-સિસ્ટમ)", "count", "lower", "CAL · SMA · PFMS", "Reduce", schoolSum(),
    "Unresolved issues across all systems (attendance, assessment, grievances, ICT, scheme backlogs) past SLA.",
    "તમામ સિસ્ટમમાં SLA વીતી ગયેલ વણઉકેલાયેલ સમસ્યાઓ."),
  k("repeat_issues", "a6", "Repeat Issues %", "પુનરાવર્તિત સમસ્યાઓ %", "%", "lower", "CAL · SMA", "Reduce", schoolAvg(),
    "Issues that recurred or were reopened after closure — high rate indicates root cause not addressed.",
    "બંધ થયા પછી ફરી થયેલ સમસ્યાઓ — ઊંચો દર મૂળ કારણ ન ઉકેલ્યાનું દર્શાવે."),
  k("action_atrisk", "a6", "Action Taken on At-Risk Cases %", "જોખમ ધરાવતા કેસ પર પગલાં %", "%", "higher", "EWS · SMA", "≥ 90%", schoolAvg(),
    "Students/schools flagged At-Risk by the AI model with a documented follow-up action within SLA.",
    "AI દ્વારા જોખમ-ફ્લેગ થયેલ કેસ જેમના પર SLA માં દસ્તાવેજિત પગલાં લેવાયા."),

  // ── District Level Tracking (grey · informational) ───────────────
  k("dropout_reduction", "district", "Dropout Rate Reduction %", "ડ્રોપઆઉટ દરમાં ઘટાડો %", "%", "higher", "UDISE+ · CTS", "↑ reduction", districtOnly(),
    "Year-on-year reduction in the share of students who dropped out (enrolled last year, not re-enrolled).",
    "ગયા વર્ષે નોંધાયેલ પણ ફરી ન નોંધાયેલ વિદ્યાર્થીઓના હિસ્સામાં વાર્ષિક ઘટાડો."),
  k("reenrollment", "district", "Re-Enrolment vs Target %", "લક્ષ્ય સામે પુનઃનોંધણી %", "%", "higher", "CTS / Vidya Track", "≥ target", districtOnly(),
    "Out-of-school children re-enrolled this year, measured against the block/state re-enrolment target.",
    "આ વર્ષે ફરી નોંધાયેલ શાળા-બહારના બાળકો, બ્લોક/રાજ્ય લક્ષ્ય સામે."),
  k("grant_expenditure", "district", "Grant & Expenditure (Samagra Shiksha) %", "અનુદાન અને ખર્ચ (સમગ્ર શિક્ષા) %", "%", "higher", "PRABANDH · PFMS", "≥ 85% utilisation", districtOnly(),
    "Fund utilisation: actual expenditure against the approved Samagra Shiksha budget.",
    "ભંડોળ ઉપયોગ: મંજૂર સમગ્ર શિક્ષા બજેટ સામે વાસ્તવિક ખર્ચ."),
  k("pmshri_score", "district", "PM SHRI School Performance %", "PM SHRI શાળા પ્રદર્શન %", "%", "higher", "GSQAC · Xamta · SMA", "≥ 80%", districtOnly(),
    "Quality & outcome score for PM SHRI schools (learning outcomes, infrastructure, governance).",
    "PM SHRI શાળાઓ માટે ગુણવત્તા-પરિણામ સ્કોર (અધ્યયન પરિણામો, માળખું, શાસન)."),
];

function k(
  id: string,
  domain_id: string,
  name: string,
  name_gu: string,
  unit: KpiDef["unit"],
  direction: KpiDef["direction"],
  data_source: string,
  target: string,
  level_representation: LevelRepresentation,
  description: string,
  description_gu: string,
): CatItem {
  return { id, domain_id, name, name_gu, unit, direction, data_source, target, level_representation, description, description_gu };
}

export const VSK_KPIS: KpiDef[] = CATALOG.map((item, i) => ({ ...item, sort_order: i }));
