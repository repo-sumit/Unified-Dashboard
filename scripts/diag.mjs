import { chromium } from "playwright";
const BASE = process.env.BASE_URL || "http://localhost:5174";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 320, height: 760 } });
const page = await ctx.newPage();
await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await page.getByRole("tab", { name: /Officer/ }).click();
await page.getByPlaceholder("Your ID").fill("24");
await page.getByPlaceholder("4-digit PIN").fill("0000");
await page.getByRole("button", { name: "Continue", exact: true }).click();
await page.getByRole("button", { name: /Continue & Sign In/ }).click();
await page.waitForURL(`${BASE}/app`, { timeout: 8000 });
await page.setViewportSize({ width: 320, height: 760 });
await page.waitForTimeout(500);

const out = await page.evaluate(() => {
  const vw = window.innerWidth;
  const rows = [];
  document.querySelectorAll("body *").forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.right > vw + 1) {
      const childOver = [...el.children].some((c) => c.getBoundingClientRect().right > vw + 1);
      const cls = typeof el.className === "string" ? el.className.slice(0, 50) : "";
      rows.push({ leaf: !childOver, line: `${childOver ? " " : "*"} ${el.tagName.toLowerCase()}.${cls}  L=${Math.round(r.left)} W=${Math.round(r.width)} R=${Math.round(r.right)}  "${(el.textContent || "").trim().slice(0, 24)}"` });
    }
  });
  return { vw, docW: document.documentElement.scrollWidth, rows };
});
console.log("viewport", out.vw, "docScrollWidth", out.docW);
console.log("over-wide chain (* = leaf-most, no wide child):");
out.rows.forEach((r) => console.log("  " + r.line));
await browser.close();
