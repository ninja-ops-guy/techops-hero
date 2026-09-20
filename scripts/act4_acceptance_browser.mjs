#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const port = Number(process.env.ACT4_PORT || 4194);
const base = process.env.ACT4_BASE_URL || `http://127.0.0.1:${port}/`;
const out = process.env.ACT4_OUT_DIR || "/tmp/techops-act4-acceptance";
const server = process.env.ACT4_BASE_URL ? null : spawn("python3", ["scripts/media_http_server.py", "--port", String(port), "--bind", "127.0.0.1"], { stdio: "ignore" });
const report = { scope: "Fixture-assisted Act IV: public prerequisite actions seeded; real dialog clicks, middle reload and report. Not a full campaign playthrough or physical-device certification.", profiles: [] };
await mkdir(out, { recursive: true });
let browser, activePage;
async function title(page) { await page.waitForFunction(() => window.TechOpsProductionTitleExperience?.state().ready === true, null, { timeout: 25000 }); }
async function click(page, text) { await page.getByRole("button", { name: text, exact: true }).click({ timeout: 10000 }); }
async function snapshot(page) { return page.evaluate(() => { const state = TechOpsCampaign.load(localStorage); return { trust: TechOpsCampaignAct2.snapshot(state).trustIsEarned, evidenceScore: state.p1.evidence.score, trustScore: state.p1.trust.score, facts: state.story.facts }; }); }
try {
  for (let i = 0; i < 80; i++) {
    try { if ((await fetch(base)).ok) break; } catch (_) { /* local server starting */ }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  browser = await chromium.launch({ headless: true });
  report.browserVersion = browser.version();
  for (const profile of [{ id: "desktop", viewport: { width: 1280, height: 800 } }, { id: "touch-portrait", viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true }]) {
    const { id, ...options } = profile;
    const context = await browser.newContext(options);
    await context.route("**/*", route => route.request().url().startsWith(base) ? route.continue() : route.abort());
    const page = await context.newPage(), result = { id, pageErrors: [] };
    activePage = page;
    report.profiles.push(result);
    page.on("pageerror", error => result.pageErrors.push(String(error.stack || error)));
    await page.goto(base, { waitUntil: "domcontentloaded" });
    await title(page);
    await page.locator("#btn-start").click();
    await page.locator("#dlg-options button").filter({ hasText: "Standard" }).click();
    await page.locator("#dlg-options button").filter({ hasText: "Clock in" }).click();
    await page.waitForFunction(() => window.S?.npcs?.some(npc => npc.id === "campaign_shipping") && window.TechOpsCampaignNativeAct2);
    await page.evaluate(() => {
      // Bounded fixture: establish Act I–III through the canonical APIs.
      const c = TechOpsCampaign, a = TechOpsCampaignAct2, state = c.createInitialState();
      for (const [ticket, owner] of [["shipping_cannot_print", "mike"], ["plating_workstation_down", "amit"], ["impossible_access_event", "security"]]) c.assignTicket(state, ticket, owner);
      c.completeStandup(state);
      c.completeWorkstation(state, { redInTheMirrorHeard: true, feliciaVideoSeen: true });
      c.recordGhostEvidence(state, { id: "badge_impossible_access", perspective: "delegated_verified", discoveredBy: "security" });
      c.enterSector04(state); c.insightAccessGuard(state); c.severAccessController(state); c.transitionToTuesday(state);
      TechOpsStory.syncAct1State(state); a.beginGhostFrequency(state);
      a.recordBadgeClonerEvidence(state, { physicalArtifact: true, auditContradiction: true, perspective: "delegated_verified" });
      a.firstDaylightFeliciaConversation(state, { approach: "professional" });
      a.recordMorningstarTrace(state, { component: "telemetry", source: "trace_bay", verified: true });
      a.recordRooftopViolinEvidence(state, { signalObserved: true, corroborated: true }); a.revealViolinist(state);
      c.save(state, localStorage);
      closeDlg(); S.day = 2; setupDay(); closeDlg(); save();
      TechOpsCampaignNativeAct2.feliciaDaylight();
    });
    result.before = await snapshot(page);
    result.sceneComposition = await page.evaluate(() => {
      const scene = document.getElementById("campaign-visual"), dialog = document.getElementById("dialogue"), wrap = document.getElementById("game-wrap");
      return { sharedContext: scene?.parentElement === wrap && dialog?.parentElement === wrap, sceneZ: Number(getComputedStyle(scene).zIndex), dialogZ: Number(getComputedStyle(dialog).zIndex) };
    });
    assert.equal(result.sceneComposition.sharedContext, true, "authored stage must share the dialog's stacking context");
    assert.ok(result.sceneComposition.dialogZ > result.sceneComposition.sceneZ, "readable dialogue belongs above the stage");
    await page.screenshot({ path: `${out}/${id}-before.png`, fullPage: true });
    await click(page, "Investigate the unauthorized traffic together");
    assert.equal(await page.locator("#v725-cine").count(), 0, "legacy movie cannot assign intent or rewards before the investigation");
    await click(page, "Trace the source");
    for (const label of ["Ask Inspection what is blocked", "Compare traffic with the last good shift"]) { await click(page, label); await click(page, "Continue investigation"); }
    result.beforeReload = await snapshot(page);
    await page.reload({ waitUntil: "domcontentloaded" });
    await title(page);
    await page.locator("#btn-continue").click();
    await page.evaluate(() => { closeDlg(); TechOpsCampaignNativeAct2.feliciaDaylight(); });
    result.afterReload = await snapshot(page);
    assert.deepEqual(result.afterReload, result.beforeReload);
    await page.screenshot({ path: `${out}/${id}-resumed.png`, fullPage: true });
    await click(page, "Review the maintenance handoff with Felicia"); await click(page, "Continue investigation");
    await click(page, "An outside actor controls Inspection"); await click(page, "Continue investigation");
    assert.equal((await snapshot(page)).trust.stage, "hypothesize");
    await click(page, "The diagnostic mirror was never retired"); await click(page, "Continue investigation");
    await click(page, "Preserve the comparison and retire the stale mirror");
    await click(page, "Recheck the traffic and live service"); await click(page, "Continue investigation");
    result.technicalOnly = await snapshot(page);
    assert.equal(result.technicalOnly.facts.felicia_alliance, undefined);
    assert.equal(result.technicalOnly.trust.requesterVerified, false);
    await click(page, "Have Inspection submit and confirm a real result"); await click(page, "Continue investigation");
    await click(page, "Report the finding and share ownership");
    result.after = await snapshot(page);
    assert.equal(result.after.facts.felicia_alliance, true);
    assert.equal(result.after.facts.morningstar_hangar_revealed, true);
    assert.equal(result.after.trustScore, result.before.trustScore + 2);
    assert.equal(result.after.evidenceScore, result.before.evidenceScore + 2);
    await page.screenshot({ path: `${out}/${id}-after.png`, fullPage: true });
    assert.deepEqual(result.pageErrors, []);
    result.status = "passed";
    await context.close();
  }
  report.status = "passed";
} catch (error) {
  report.status = "failed"; report.failure = String(error.stack || error); process.exitCode = 1;
  if (activePage && !activePage.isClosed()) {
    await activePage.screenshot({ path: `${out}/failure.png`, fullPage: true });
    report.failureDialog = await activePage.locator("#dialogue").innerText({ timeout: 1000 }).catch(() => "dialog unavailable");
    report.failureState = await snapshot(activePage).catch(() => null);
  }
}
finally { if (browser) await browser.close(); if (server) server.kill(); await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2)); console.log(JSON.stringify(report)); }
