import { chromium } from "playwright";
const BASE = process.env.BASE_URL || "http://localhost:5174";
const browser = await chromium.launch();

async function tpLogin(page, id, udise) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: /Teacher \/ Principal/ }).click();
  await page.getByPlaceholder("Your 10-digit ID").fill(id);
  await page.getByPlaceholder("11-digit UDISE").fill(udise);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: /Continue & Sign In/ }).click();
  await page.waitForURL(`${BASE}/app`, { timeout: 8000 });
  await page.waitForTimeout(400);
}

for (const [role, id, udise] of [["principal", "2400000002", "24010100101"], ["teacher", "2400000001", "24010100101"]]) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await tpLogin(page, id, udise);
  const pm = await page.getByRole("button", { name: "PM SHRI" }).count();
  const allSchools = await page.getByText("All Schools").count();
  console.log(`${role}: PM SHRI control count = ${pm}, "All Schools" text count = ${allSchools}  → ${pm === 0 && allSchools === 0 ? "HIDDEN ✓" : "VISIBLE ✗"}`);
  await page.screenshot({ path: `verify-shots/pmshri-${role}.png` });
  await ctx.close();
}
await browser.close();
