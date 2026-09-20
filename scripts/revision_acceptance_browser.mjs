#!/usr/bin/env node
"use strict";

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const port = Number(process.env.REVISION_PORT || 4187);
const base = process.env.REVISION_BASE_URL || `http://127.0.0.1:${port}/`;
const out = process.env.REVISION_OUT_DIR || "/tmp/techops-revision-acceptance";
const server = process.env.REVISION_BASE_URL ? null : spawn("python3", [
  "scripts/media_http_server.py", "--port", String(port), "--bind", "127.0.0.1"
], { stdio: "ignore" });

await mkdir(out, { recursive: true });
const report = { browser: "chromium", pageErrors: [], requestsBlocked: [], checks: [] };
let browser;

async function waitForServer() {
  for (let attempt = 0; attempt < 80; attempt++) {
    try { if ((await fetch(base)).ok) return; } catch (_) { /* retry */ }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Local server did not become ready: ${base}`);
}

async function readyTitle(page) {
  await page.waitForFunction(() => window.TechOpsProductionTitleExperience?.state().ready === true, null, { timeout: 25000 });
}

try {
  await waitForServer();
  browser = await chromium.launch({ headless: true });
  report.browserVersion = browser.version();
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await context.route("**/*", route => {
    if (route.request().url().startsWith(base)) return route.continue();
    report.requestsBlocked.push(route.request().url());
    return route.abort();
  });
  const page = await context.newPage();
  page.on("pageerror", error => report.pageErrors.push(String(error.stack || error)));

  await page.goto(base, { waitUntil: "domcontentloaded" });
  await readyTitle(page);
  const title = await page.evaluate(() => ({
    title: document.title,
    cards: [...document.querySelectorAll("[data-production-title-card]")]
      .filter(button => !button.classList.contains("hidden"))
      .map(button => ({ id: button.id, disabled: button.disabled, label: button.getAttribute("aria-label") }))
  }));
  assert.equal(title.title, "TechOps Hero — Production v1.2");
  assert.deepEqual(title.cards.map(card => card.id), ["btn-start", "btn-v736", "btn-nightcrawler"]);
  assert.ok(title.cards.every(card => !card.disabled && card.label));
  report.checks.push("cinematic title is ready, accessible, and exposes three valid fresh-run routes");
  await page.screenshot({ path: `${out}/title.png`, fullPage: true });

  await page.evaluate(() => {
    const stale = TechOpsCampaign.createInitialState();
    stale.campaign.day = 2;
    stale.flags.tuesday_morning_reached = true;
    TechOpsCampaign.save(stale, localStorage);
    localStorage.setItem("techops_save", JSON.stringify({ day: 2, clock: 900, budget: 999, meta: { marker: "stale-run" } }));
    localStorage.setItem("techops_save_bak", JSON.stringify({ day: 8, meta: { marker: "stale-backup" } }));
  });
  await page.locator("#btn-start").click();
  await page.locator("#dlg-options button").filter({ hasText: "Standard" }).click();
  await page.locator("#dlg-options button").filter({ hasText: "Clock in" }).click();
  await page.waitForFunction(() => {
    const campaign = TechOpsCampaign.load(localStorage);
    return campaign?.campaign?.day === 1 &&
      S?.npcs?.some(npc => npc.id === "campaign_shipping") &&
      S.npcs.some(npc => npc.id === "campaign_plating") &&
      S.npcs.some(npc => npc.id === "campaign_access");
  }, null, { timeout: 15000 });
  const fresh = await page.evaluate(() => ({
    campaignDay: TechOpsCampaign.load(localStorage).campaign.day,
    backup: (() => { try { return JSON.parse(localStorage.getItem("techops_save_bak")); } catch (_) { return null; } })(),
    contacts: S.npcs.filter(npc => String(npc.id).startsWith("campaign_")).map(npc => npc.id).sort()
  }));
  assert.equal(fresh.campaignDay, 1);
  assert.notEqual(fresh.backup?.meta?.marker, "stale-backup", "New Game cannot leave the old recovery shadow eligible for restoration");
  if (fresh.backup) assert.equal(fresh.backup.day, 1, "any newly created recovery shadow must belong to the fresh run");
  for (const id of ["campaign_access", "campaign_plating", "campaign_shipping"]) assert.ok(fresh.contacts.includes(id), `missing canonical Day 1 contact: ${id}`);
  report.checks.push("New Day clears stale primary/backup saves and restores canonical Day 1 contacts");

  await page.evaluate(() => {
    if (S.inDialog) closeDlg();
    S.clock = 777;
    S.budget = 123;
    S.px = 7;
    S.py = 8;
    save();
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await readyTitle(page);
  await page.waitForFunction(() => !document.getElementById("btn-continue")?.classList.contains("hidden"));
  await page.locator("#btn-continue").click();
  await page.waitForTimeout(500);
  const resumed = await page.evaluate(() => ({
    clock: S.clock, budget: S.budget, px: S.px, py: S.py,
    sharedTicketIdentity: S.tickets.every(ticket => S.npcs.includes(ticket)),
    inDialog: S.inDialog,
    dialogVisible: (() => { const node = document.getElementById("dialogue"); return !!(node && !node.classList.contains("hidden") && getComputedStyle(node).display !== "none"); })(),
    shell: TechOpsModeShell.health()
  }));
  assert.deepEqual({ clock: resumed.clock, budget: resumed.budget, px: resumed.px, py: resumed.py }, { clock: 777, budget: 123, px: 7, py: 8 });
  assert.equal(resumed.sharedTicketIdentity, true);
  assert.equal(resumed.inDialog, resumed.dialogVisible, "Continue cannot leave a hidden dialogue blocker");
  assert.equal(resumed.shell.mode, "day");
  report.checks.push("Continue restores exact scene state with canonical NPC/ticket identity and no hidden blocker");
  await page.screenshot({ path: `${out}/day-resumed.png`, fullPage: true });

  assert.deepEqual(report.pageErrors, []);
  report.status = "passed";
  await context.close();
} catch (error) {
  report.status = "failed";
  report.failure = String(error.stack || error);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  if (server) server.kill();
  await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
}
