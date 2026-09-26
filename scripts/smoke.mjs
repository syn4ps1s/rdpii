// Smoke test: loads dist/index.html in headless Chromium, waits for the title menu,
// fails on any page error. Saves a screenshot to dist/smoke.png.
import { chromium } from "playwright-core";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
import fs from "node:fs";
const exe = process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium";
const browser = await chromium.launch({
  executablePath: fs.existsSync(exe) ? exe : undefined,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--autoplay-policy=no-user-gesture-required"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push("console: " + m.text()));
page.on("request", (q) => !q.url().startsWith("data:") && !q.url().startsWith("file:") && console.log("req", q.url().slice(0, 120)));
await page.goto("file://" + path.join(root, "dist/index.html"), { waitUntil: "domcontentloaded" });
await page.waitForSelector("#screens .menu .btn", { timeout: 120000 });
await page.waitForTimeout(3000);
const buttons = await page.$$eval("#screens .menu .btn", (b) => b.map((x) => x.textContent.trim().replace(/\s+/g, " ")));
await page.screenshot({ path: path.join(root, "dist/smoke.png") });
await browser.close();
console.log("menu:", buttons);
if (errors.length) { console.error("errors:\n" + errors.join("\n")); process.exit(1); }
console.log("smoke ok");
