import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL || "http://localhost:5174";
const OUT = "verify-shots/qa";
mkdirSync(OUT, { recursive: true });

const ROLES = {
  principal: { mode: "tp", id: "2400000002", second: "24010100101" },
  state: { mode: "officer", id: "24", second: "0000" },
  brc: { mode: "officer", id: "240101", second: "2345" },
  teacher: { mode: "tp", id: "2400000001", second: "24010100101" },
};
const SCREENS = [
  ["home", "/app"],
  ["compare", "/app/compare"],
  ["sections", "/app/sections"],
  ["leaderboard", "/app/leaderboard"],
  ["export", "/app/export"],
  ["kpi", "/app/kpi/att_pct"],
];
const WIDTHS = [320, 375, 390, 768, 1024, 1440];
const LANGS = ["en", "gu"];
// screenshots only for these (role, screen, width, lang) to keep volume sane
const SHOOT = new Set([
  "principal|home|375|en", "principal|home|320|en", "principal|home|1440|en", "principal|home|375|gu",
  "principal|compare|375|en", "principal|sections|375|en", "principal|leaderboard|375|en", "principal|export|375|en",
  "state|compare|375|en", "state|sections|375|en", "teacher|home|375|en", "brc|home|375|en",
  "principal|kpi|375|en",
]);

const problems = [];

async function login(page, r) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  if (r.mode === "tp") {
    await page.getByRole("tab", { name: /Teacher \/ Principal/ }).click();
    await page.getByPlaceholder("Your 10-digit ID").fill(r.id);
    await page.getByPlaceholder("11-digit UDISE").fill(r.second);
  } else {
    await page.getByRole("tab", { name: /Officer/ }).click();
    await page.getByPlaceholder("Your ID").fill(r.id);
    await page.getByPlaceholder("4-digit PIN").fill(r.second);
  }
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: /Continue & Sign In/ }).click();
  await page.waitForURL(`${BASE}/app`, { timeout: 8000 });
}
async function setLang(page, lang) {
  await page.evaluate((lng) => {
    const k = "unified-portal-session"; const r = localStorage.getItem(k);
    if (r) { const d = JSON.parse(r); d.state.lang = lng; localStorage.setItem(k, JSON.stringify(d)); }
  }, lang);
}
async function measure(page) {
  return page.evaluate(() => {
    const winW = window.innerWidth;
    const docW = document.documentElement.scrollWidth;
    const offenders = [];
    document.querySelectorAll("body *").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && r.right > winW + 1.5 && r.left >= -1) {
        const cls = typeof el.className === "string" ? el.className.split(/\s+/).filter(Boolean).slice(0, 2).join(".") : "";
        offenders.push(el.tagName.toLowerCase() + (cls ? "." + cls : "") + ` [${Math.round(r.right - winW)}px over]`);
      }
    });
    // sub-44px interactive targets
    let smallTaps = 0;
    document.querySelectorAll("button,a[href],[role=button],[role=tab],[role=option],input,select").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && (r.height < 44 || r.width < 44)) smallTaps++;
    });
    return { horiz: docW > winW + 1.5, docW, winW, offenders: [...new Set(offenders)].slice(0, 5), smallTaps };
  });
}

const browser = await chromium.launch();
for (const [roleName, r] of Object.entries(ROLES)) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + String(e).slice(0, 120)));
  page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text().slice(0, 120)); });
  await login(page, r);

  for (const lang of LANGS) {
    await setLang(page, lang);
    for (const [screenName, path] of SCREENS) {
      const errBefore = errors.length;
      await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" }).catch(() => {});
      for (const w of WIDTHS) {
        await page.setViewportSize({ width: w, height: w < 500 ? 760 : 900 });
        await page.waitForTimeout(180);
        const m = await measure(page);
        const key = `${roleName}|${screenName}|${w}|${lang}`;
        if (m.horiz) problems.push({ key, type: "OVERFLOW", detail: `doc ${m.docW}>${m.winW}; ${m.offenders.join(" | ")}` });
        if (SHOOT.has(key)) await page.screenshot({ path: `${OUT}/${roleName}-${screenName}-${w}-${lang}.png`, fullPage: true }).catch(() => {});
      }
      const newErrs = errors.slice(errBefore);
      if (newErrs.length) problems.push({ key: `${roleName}|${screenName}|${lang}`, type: "CONSOLE", detail: [...new Set(newErrs)].slice(0, 3).join(" || ") });
    }
  }
  await ctx.close();
}
await browser.close();

console.log(`\n==== QA SWEEP: ${problems.length} problem(s) ====`);
for (const p of problems) console.log(`[${p.type}] ${p.key}\n   ${p.detail}`);
if (!problems.length) console.log("No horizontal-overflow or console-error problems found across roles × screens × {320,375,768,1440} × {en,gu}.");
