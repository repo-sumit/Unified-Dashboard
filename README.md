# Unified Portal — Vidya Samiksha Kendra (Gujarat)

One platform for school-performance KPIs across every level of the Gujarat education system. A user logs in and instantly sees a **role-specific, story-first dashboard**: how am I doing, on what, am I improving, and how do I compare to peers and the levels above me — down to the section of a class.

Config-driven and **KPI-agnostic**: the whole dashboard renders from `domains` / `kpi_definitions` / `kpi_values`, so adding a KPI is a data change, not a redesign. Built on the canonical **6A KPI framework** (35 KPIs across A1–A6 + District tracking) with **real GSQAC data** folded into the A5 (Accreditation & School Quality) domain.

> Bilingual (English + ગુજરાતી). Mobile-first → desktop. Anonymised demo data.

---

## Quick start

```bash
cd app
npm install            # if "npm" is blocked in PowerShell, use: npm.cmd install
npm run seed           # (re)generate seed JSON from ../GSQAC/gsqac 2024-25.csv  (output is committed)
npm run dev            # http://localhost:5173
```

Verify:

```bash
npm run typecheck      # tsc --noEmit
npm run build          # tsc + vite build → dist/
node scripts/smoke.mjs # runtime check of the data + engine (no browser)
```

### Login — role is inferred from the ID's digit-length

No role picker: type an ID and the app detects the role, then asks for the right second field. **DEO logs in with the 4-digit District ID + PIN**; the same level-ID + PIN pattern applies to State/Block/Cluster; Teacher uses Teacher ID + School ID. (Use the **"Demo logins ▾"** helper on the login screen.)

| Level | Digits | Demo ID | 2nd field |
|---|---|---|---|
| State | 2 | `24` | PIN `0000` |
| District (DEO) | 4 | `2401` | PIN `3456` |
| Block (BRC/BEO) | 6 | `240101` | PIN `2345` |
| Cluster (CRC) | 10 | `2401010001` | PIN `1234` |
| School / Principal | 11 | `24010100011` | PIN `1111` |
| Teacher | 8 | `24000009` | School ID `24010100011` |
| Student (UDISE) | 18 | — | (not a login) |

IDs nest by prefix (school `24010100011` → cluster `2401010001` → block `240101` → district `2401` → state `24`). Codes are nested-synthetic; **names and GSQAC scores are real** (sliced from `gsqac 2024-25.csv`). There is **no SSO consent step** — after confirming details you land straight on the dashboard.

---

## What each role sees (access-control matrix)

| | Teacher | Principal | Officer (Cluster→State) |
|---|---|---|---|
| Greeting (time-based) | ✓ | ✓ | ✓ |
| TPD tracker (38/50 hrs) + 7-day trend | personal | — | — |
| Classroom Pulse — Students "At Risk" (ⓘ tooltip) | ✓ | — | — |
| Threshold "Needs Improvement" header + training links | ✓ | — | — |
| School vs **State** average | hidden | ✓ | (cascade view) |
| GSQAC Accreditation Scoreboard (e.g. 720/1000) | hidden | ✓ | — |
| Compliance benchmarks (PTR 27:1 · class max 30 · enrolment 150+ · chronic · avg training) | hidden | ✓ | — |
| Attendance-gap detector + **Download Names** | hidden | ✓ | — |
| Drop-out reduction ("14 fewer than last year") | hidden | ✓ | — |
| Improvement Actions **for Teachers** | hidden | ✓ | — |
| Improvement Actions **of the School** | hidden | hidden | hidden |
| Cascading scorecard · leaderboard · section compare · export | — | ✓ | ✓ |

Officers (Cluster/Block/District/State) get the cascading scorecard (overall ring + grade, domain bars vs the level above, leaderboard, section comparison, export).

---

## Global features

- **PM SHRI filter** (top nav): All / PM SHRI / Non-PM SHRI — an aspirational institutional tracker that scopes the aggregate rollups.
- **Vocabulary & sentiment migration** (non-punitive): EWS → **"At Risk"** (with the holistic-identification tooltip); "Schools Below Benchmark"/"Low-Performing Schools" → support-framed labels; "Delta" → "Improvement across cycles".
- **Time-based greeting** on login + home.
- **Bilingual** En/ગુ with Gujarati numerals; **anonymised** people-names.

---

## Architecture (data-first)

KPIs are stored LONG / metadata-driven. The five tables in `supabase/schema.sql` are mirrored 1:1 by the `DataProvider` seam:

```
entities · app_users · domains · kpi_definitions · kpi_values
```

```
src/
  config/      the single 6A framework · 35-KPI catalog · rating bands · periods
  data/        seed JSON (real names + scores, nested codes) · MockProvider (deterministic, PM-SHRI-aware) · SupabaseProvider stub
  engine/      RAG · Δ WoW/MoM · trend · bottom-up cascading rollups · domain & overall score · grade · leaderboard · story
  i18n/        en + gu dictionaries
  hooks/       compose provider + engine (apply the PM SHRI filter)
  components/  ui primitives + layout (AppShell, PM SHRI filter) + role/ (TeacherView, PrincipalView)
  screens/     Login · ScorecardHome (role-routed) · DomainView · KpiDetail · CascadeComparison · SectionComparison · Leaderboard · Export
```

Everything derived lives in `engine/` (Δ, RAG, rollups, overall = Σ weightage×domain% → grade). Rollups are genuine bottom-up aggregations (a school = mean of its sections, a district = mean of its blocks). The **single framework** is config: adding a domain/KPI renders it everywhere with no code change — the switcher was removed, not the modularity.

### Swap mock → live (Supabase)
1. Run `supabase/schema.sql` then the generated `supabase/seed.sql`.
2. Load `domains`/`kpi_definitions` from `src/config` and `kpi_values` from the data lake.
3. Set `VITE_DATA_PROVIDER=supabase` (+ URL/key) and flesh out `src/data/provider/supabaseProvider.ts`.

### Deploy (Vercel)
`vercel.json` is included (SPA rewrites + `npm run build` → `dist/`). Import the repo with root `app/`.

---

## Non-goals
No chat/AI, no data-entry/writes, no real SSO/OAuth, no app-to-app redirection, no student-level drill-down by default. Clean seams left for SSO and source-app redirection.
