import { chromium } from "playwright";
const BASE = process.env.BASE_URL || "http://localhost:5174";
const browser = await chromium.launch();

// State officer → Compare (domain-grouped) + GSQAC KPI detail (shows its domain)
const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
const page = await ctx.newPage();
await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.getByRole("tab", { name: /Officer/ }).click();
await page.getByPlaceholder("Your ID").fill("24");
await page.getByPlaceholder("4-digit PIN").fill("0000");
await page.getByRole("button", { name: "Continue", exact: true }).click();
await page.getByRole("button", { name: /Continue & Sign In/ }).click();
await page.waitForURL(`${BASE}/app`, { timeout: 8000 });

await page.goto(`${BASE}/app/kpi/gsqac_score`, { waitUntil: "networkidle" });
await page.waitForTimeout(500);
const domainLabel = await page.locator("h1").first().evaluate((el) => el.previousElementSibling?.textContent ?? "").catch(() => "");
const headerTxt = await page.locator("body").innerText();
const m = headerTxt.match(/A\d · [^\n]+/);
console.log("GSQAC KpiDetail domain label:", m ? m[0] : "(not found)");
await page.screenshot({ path: "verify-shots/chk-gsqac-domain.png" });

// Compare: open the Add comparison picker to show Select all
await page.goto(`${BASE}/app/compare`, { waitUntil: "networkidle" });
await page.waitForTimeout(400);
await page.getByRole("button", { name: /Add comparison/ }).click();
await page.waitForTimeout(300);
await page.screenshot({ path: "verify-shots/chk-compare-selectall.png" });

// mobile: logout reachable
const m2 = await browser.newContext({ viewport: { width: 390, height: 844 } });
const mp = await m2.newPage();
await mp.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await mp.getByRole("tab", { name: /Officer/ }).click();
await mp.getByPlaceholder("Your ID").fill("24");
await mp.getByPlaceholder("4-digit PIN").fill("0000");
await mp.getByRole("button", { name: "Continue", exact: true }).click();
await mp.getByRole("button", { name: /Continue & Sign In/ }).click();
await mp.waitForURL(`${BASE}/app`, { timeout: 8000 });
await mp.waitForTimeout(400);
const logoutVisible = await mp.getByRole("button", { name: /Log out/i }).isVisible().catch(() => false);
console.log("mobile logout visible:", logoutVisible);
await mp.screenshot({ path: "verify-shots/chk-mobile-logout.png" });

await browser.close();
