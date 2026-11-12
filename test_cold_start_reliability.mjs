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

async function checkNightOnboarding(page, touch) {
  const activate = locator => touch ? locator.tap() : locator.click();
  await page.evaluate(() => {
    window.__nightOnboardingEntries = 0;
    window.addEventListener("techops:night-entered", () => window.__nightOnboardingEntries++);
  });
  await activate(page.locator("#btn-nightcrawler"));
  await activate(page.getByRole("button", { name: /Intern/ }));

  const dispatch = page.locator("#dialogue");
  const takeCharger = dispatch.getByRole("button", { name: /Take the Charger/ });
  // Allow multiple router polls to run without activating the dispatch.
  await page.waitForTimeout(1000);
  assert.ok(await dispatch.isVisible(), "After Hours Dispatch should wait for the player");
  assert.match(await dispatch.innerText(), /After Hours Dispatch[\s\S]*Downtown Street 1/);
  assert.ok(await takeCharger.isVisible(), "The Charger action should remain visible");
  assert.deepEqual(await page.evaluate(() => ({
    entries: window.__nightOnboardingEntries,
    drive: window.v722.active(),
    night: !!window.S?.nightMode,
    checkpoint: window.TechOpsNightRuntime.checkpointStatus().status
  })), { entries: 0, drive: false, night: false, checkpoint: "empty" });

  if (touch) await takeCharger.tap();
  else {
    assert.ok(await takeCharger.evaluate(button => document.activeElement === button), "Night dispatch must focus its action for keyboard players");
    await page.keyboard.press("Enter");
  }
  const drive = page.locator("#v722-cine");
  await drive.waitFor({ state: "visible" });
  await activate(drive);
  await page.waitForFunction(() =>
    window.__productionNightLaunchOk &&
    window.S?.nightMode?.district === "downtown" &&
    window.S.nightMode.street === 1 &&
    !window.S.inDialog &&
    !window.v722.active() &&
    window.TechOpsNightRuntime.checkpointStatus().status === "ready"
  );
  assert.equal(await dispatch.isVisible(), false);
  assert.deepEqual(await page.evaluate(() => ({
    entries: window.__nightOnboardingEntries,
    enemies: window.S.nightMode.enemies.length
  })), { entries: 1, enemies: 2 });
}

for (const [name, launcher] of [["chromium", chromium], ["webkit", webkit]]) {
  let browser;
  try {
    browser = await launcher.launch({ headless: true });
    for (let run = 1; run <= 4; run++) {
      const checkOnboarding = run === 4;
      const touch = checkOnboarding && name === "webkit";
      const context = await browser.newContext(touch ? {
        viewport: { width: 844, height: 390 }, hasTouch: true
      } : {});
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
      if (checkOnboarding && !problems.length) {
        try {
          await checkNightOnboarding(page, touch);
        } catch (error) {
          problems.push(`Night onboarding: ${error.message}`);
        }
      }
      if (pageErrors.length) problems.push(`first-party page errors: ${pageErrors.join(" | ")}`);
      if (failedRequests.length) problems.push(`first-party request failures: ${failedRequests.join(" | ")}`);
      if (crashes.length) problems.push("browser page crashed");
      if (problems.length) failures.push(`${name} cold start ${run}: ${problems.join("; ")}`);
      await context.close();
    }
    if (!failures.some(failure => failure.startsWith(`${name} `))) {
      console.log(`${name}: 4/4 cold starts ready and Night onboarding passed`);
    }
  } catch (error) {
    failures.push(`${name} runner error: ${error.stack || error}`);
  } finally {
    if (browser) await browser.close();
  }
}
server.close();
assert.deepStrictEqual(failures, [], failures.join("\n"));
console.log("Cold-start reliability: PASS (8 fresh contexts, Night onboarding in both browsers, zero first-party errors or failed requests)");
