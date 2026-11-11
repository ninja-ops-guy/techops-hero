import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { createRequire } from "node:module";
const { chromium, webkit } = createRequire(import.meta.url)("playwright");

const root = process.cwd();
const types = new Map([
  ["html", "text/html; charset=utf-8"], ["js", "text/javascript; charset=utf-8"],
  ["css", "text/css; charset=utf-8"], ["json", "application/json; charset=utf-8"],
  ["svg", "image/svg+xml"], ["png", "image/png"], ["jpg", "image/jpeg"],
  ["jpeg", "image/jpeg"], ["webp", "image/webp"], ["mp4", "video/mp4"],
  ["woff", "font/woff"], ["woff2", "font/woff2"]
]);
const server = http.createServer((req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    const filename = path.resolve(root, relative);
    if (!filename.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
    if (!fs.existsSync(filename) || !fs.statSync(filename).isFile()) { res.writeHead(404); res.end(); return; }
    const ext = path.extname(filename).slice(1).toLowerCase();
    res.writeHead(200, { "Content-Type": types.get(ext) || "application/octet-stream", "Cache-Control": "no-store" });
    fs.createReadStream(filename).pipe(res);
  } catch (error) { res.writeHead(500); res.end(String(error)); }
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const thirdParty = value => /sndcdn|soundcloud|google|gstatic|doubleclick|googlesyndication|recaptcha/i.test(String(value || ""));
const failures = [];

for (const [name, launcher] of [["chromium", chromium], ["webkit", webkit]]) {
  let browser;
  try {
    browser = await launcher.launch({ headless: true });
    for (let run = 1; run <= 4; run++) {
      const context = await browser.newContext();
      const page = await context.newPage();
      const pageErrors = [], failedRequests = [], crashes = [];
      page.on("pageerror", error => { if (!thirdParty(error.stack || error.message)) pageErrors.push(error.message); });
      page.on("response", response => { if (response.url().startsWith(origin) && response.status() >= 400) failedRequests.push(`${response.status()} ${response.url()}`); });
      page.on("requestfailed", request => { if (request.url().startsWith(origin)) failedRequests.push(request.url()); });
      page.on("crash", () => crashes.push("page-crash"));
      await page.goto(origin, { waitUntil: "domcontentloaded" });
      await page.waitForFunction(() => window.__productionBootstrapReady === true, undefined, { timeout: 30000 });
      const result = await page.evaluate(() => ({
        safePaused: document.body.innerText.includes("SAFE STARTUP PAUSED"),
        modes: [...document.querySelectorAll("#btn-start,#btn-v736,#btn-nightcrawler")].map(button => ({ id: button.id, disabled: button.disabled, hidden: button.classList.contains("hidden") }))
      }));
      const problems = [];
      if (result.safePaused) problems.push("Safe Startup remained paused");
      if (result.modes.length !== 3 || result.modes.some(mode => mode.disabled || mode.hidden)) problems.push(`mode buttons not ready: ${JSON.stringify(result.modes)}`);
      if (pageErrors.length) problems.push(`first-party page errors: ${pageErrors.join(" | ")}`);
      if (failedRequests.length) problems.push(`first-party request failures: ${failedRequests.join(" | ")}`);
      if (crashes.length) problems.push("browser page crashed");
      if (problems.length) failures.push(`${name} cold start ${run}: ${problems.join("; ")}`);
      await context.close();
    }
    console.log(`${name}: 4/4 cold starts ready`);
  } catch (error) {
    failures.push(`${name} runner error: ${error.stack || error}`);
  } finally {
    if (browser) await browser.close();
  }
}
server.close();
assert.deepStrictEqual(failures, [], failures.join("\n"));
console.log("Cold-start reliability: PASS (8 fresh contexts, zero first-party errors or failed requests)");
