import { chromium } from "playwright";
const BASE = process.env.BASE_URL || "http://localhost:4176";
const ROLES = [
  ["teacher", "tp", "2400000001", "24010100101", "section"],
  ["principal", "tp", "2400000002", "24010100101", "school"],
  ["crc", "officer", "2401010005", "1234", "cluster"],
  ["brc", "officer", "240101", "2345", "block"],
  ["deo", "officer", "2401", "3456", "district"],
  ["state", "officer", "24", "0000", "state"],
];
const browser = await chromium.launch();
let pass = 0;
for (const [name, mode, id, second, expectLevel] of ROLES) {
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 800 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: mode === "tp" ? /Teacher \/ Principal/ : /Officer/ }).click();
  await page.getByPlaceholder(mode === "tp" ? "Your 10-digit ID" : "Your ID").fill(id);
  await page.getByPlaceholder(mode === "tp" ? "11-digit UDISE" : "4-digit PIN").fill(second);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: /Continue & Sign In/ }).click();
  let ok = false;
  try { await page.waitForURL(`${BASE}/app`, { timeout: 8000 }); ok = true; } catch {}
  await page.waitForTimeout(400);
  const scopeId = await page.evaluate(() => { const r = localStorage.getItem("unified-portal-session"); return r ? JSON.parse(r).state.scopeId : null; });
  const roleStored = await page.evaluate(() => { const r = localStorage.getItem("unified-portal-session"); return r ? JSON.parse(r).state.user?.role : null; });
  const good = ok && roleStored === name && errs.length === 0;
  if (good) pass++;
  console.log(`${good ? "PASS" : "FAIL"}  ${name}: logged in=${ok} role=${roleStored} scope=${scopeId} errs=${errs.length}`);
  await ctx.close();
}
console.log(`\n==== ${pass}/${ROLES.length} roles OK ====`);
if (pass !== ROLES.length) process.exitCode = 1;
await browser.close();
