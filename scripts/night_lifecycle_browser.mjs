#!/usr/bin/env node
// Real browser acceptance. Fixtures use canonical APIs only to arrange story
// prerequisites; the home/Charger/campaign controls are exercised as a player.
import { chromium, firefox, webkit } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
const OUT = process.env.NIGHT_REPORT_DIR || 'artifacts/night-lifecycle';
await mkdir(OUT, { recursive: true });
const server = spawn('python3', ['-m', 'http.server', '4173', '--bind', '127.0.0.1'], { stdio: 'ignore' });
const URL = 'http://127.0.0.1:4173/';
const results = [];
const delay = ms => new Promise(r => setTimeout(r, ms));
for (let i = 0; i < 60; i++) { try { const r = await fetch(URL); if (r.ok) break; } catch {} await delay(100); }
async function mount(page) {
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => window.__productionBootstrapReady && window.TechOpsNightRuntime, null, { timeout: 60000 });
}
async function enterNight(page) {
  await page.locator('#btn-nightcrawler').click();
  await page.waitForFunction(() => window.v722?.active() || (typeof S !== 'undefined' && S?.nightMode) || (!document.querySelector('#dialogue')?.classList.contains('hidden') && document.querySelectorAll('#dlg-options button').length));
  if (await page.evaluate(() => !(typeof S !== 'undefined' && S?.nightMode) && !window.v722?.active())) await page.locator('#dlg-options button').first().click();
  await page.waitForFunction(() => window.v722?.active() || (typeof S !== 'undefined' && S?.nightMode), null, { timeout: 30000 });
  if (await page.evaluate(() => !!window.v722?.active())) await page.evaluate(() => window.v722.skip());
  await page.waitForFunction(() => typeof S !== 'undefined' && !!S?.nightMode && !S.inDialog && !window.v722?.active(), null, { timeout: 30000 });
  await page.waitForFunction(() => !window.__productionDesiredMode, null, { timeout: 10000 });
}
async function finishReturn(page) {
  await page.waitForFunction(() => !!window.v725?.active() || (!S.nightMode), null, { timeout: 10000 });
  if (await page.evaluate(() => !!window.v725?.active())) await page.locator('#night-home-skip').click();
  await page.waitForFunction(() => !S.nightMode, null, { timeout: 15000 });
}
function prepareCampaign(page, evidence) {
  return page.evaluate(evidence => {
    const api = TechOpsCampaign, c = api.createInitialState();
    api.assignTicket(c, 'shipping_cannot_print', 'mike'); api.assignTicket(c, 'plating_workstation_down', 'amit'); api.assignTicket(c, 'impossible_access_event', 'mike');
    api.completeStandup(c); api.completeWorkstation(c, { redInTheMirrorHeard: true, feliciaVideoSeen: true });
    api.resolveTicket(c, 'shipping_cannot_print', { technicalResolution: true, verification: 'strong', humanOutcome: 'restored' });
    api.resolveTicket(c, 'plating_workstation_down', { technicalResolution: true, verification: 'strong', humanOutcome: 'restored' });
    if (evidence) api.recordGhostEvidence(c, { id: 'badge_impossible_access', perspective: 'firsthand', discoveredBy: 'mike' });
    api.save(c, localStorage); return JSON.stringify(c.evidence);
  }, evidence);
}
async function run(name, engine, mobile) {
  const browser = await engine.launch({ headless: true });
  const context = await browser.newContext({ viewport: mobile ? { width: 844, height: 390 } : { width: 1280, height: 800 }, hasTouch: mobile, deviceScaleFactor: 1 });
  await context.route('**/*', route => route.request().url().startsWith(URL) ? route.continue() : route.abort());
  const page = await context.newPage(), errors = [], steps = [];
  page.on('pageerror', error => errors.push(String(error.stack || error)));
  const record = { browser: name, mobile, status: 'running', steps, errors };
  results.push(record);
  try {
    await mount(page); await enterNight(page); steps.push('canonical title/difficulty/Night Drive launch');
    // Live keyboard movement through the actual immutable Night compositor.
    const x = await page.evaluate(() => NM.x); await page.keyboard.down('ArrowRight'); await page.waitForTimeout(450); await page.keyboard.up('ArrowRight');
    assert.ok(await page.evaluate(x => NM.x > x + 8, x), 'Night keyboard movement'); steps.push('keyboard movement');
    await page.evaluate(() => { NM.enemies = []; NM.x = 700; NM.hp = 100; S.weather = 'storm'; S.clock = 1439; S.nightMode._nightLifecycle.seconds = 0; });
    const ticketsBefore = await page.evaluate(() => JSON.stringify(S.tickets.map(t => ({ age: t.age, incident: t.incidentDeclared }))));
    await page.waitForFunction(() => S.clock >= 1440, null, { timeout: 10000 });
    assert.equal(await page.evaluate(() => fmtClock(S.clock)), '00:00');
    assert.equal(await page.evaluate(() => JSON.stringify(S.tickets.map(t => ({ age: t.age, incident: t.incidentDeclared })))), ticketsBefore);
    assert.equal(await page.evaluate(() => S.inDialog), false); steps.push('continuous midnight clock; no ticket aging or daytime announcements');
    // Neither legacy day simulation nor weather compositor may run at night.
    await page.evaluate(() => { window.__nightDayStep = 0; window.__nightDayDraw = 0; window.__savedDayStep = window.step; window.__savedDayDraw = window.draw; window.step = function(...a) { window.__nightDayStep++; return window.__savedDayStep(...a); }; window.draw = function(...a) { window.__nightDayDraw++; return window.__savedDayDraw(...a); }; });
    await page.waitForTimeout(250);
    assert.deepEqual(await page.evaluate(() => [window.__nightDayStep, window.__nightDayDraw]), [0, 0]);
    await page.evaluate(() => { window.step = window.__savedDayStep; window.draw = window.__savedDayDraw; }); steps.push('day renderer and event chain isolated');
    // Put stale day coordinates next to office content. E must remain a Night action.
    await page.evaluate(() => { S.px = 10; S.py = 10; S.room = { id: 'it', x: .5 }; S.npcs.push({ id: 'test-day-leak', x: 11, y: 10, ambient: false, done: false, campaignAct2: 'felicia_daylight' }); });
    await page.keyboard.press('e'); assert.equal(await page.evaluate(() => S.inDialog), false);
    await page.evaluate(() => { S.room = null; S.npcs = S.npcs.filter(n => n.id !== 'test-day-leak'); }); steps.push('stale office contacts do not steal Night input');
    await page.locator('#night-campaign').click();
    assert.match(await page.locator('#dlg-text').innerText(), /standup|Day 1/);
    await page.locator('#dlg-options button').filter({ hasText: 'Back to Night Walker' }).click();
    steps.push('visible campaign hub; locked opening not bypassed');
    // Charger -> Home uses the real destination button; only traversal distance
    // is arranged after arriving so all browsers test the same door boundary.
    await page.evaluate(() => { NM.x = 110; NM.y = 396; NM.vx = NM.vy = 0; });
    await page.keyboard.press('e');
    await page.locator('#dlg-options button').filter({ hasText: 'HOME STREET' }).click();
    await page.waitForFunction(() => NM?.district === 'home' && !NM.drive);
    await page.evaluate(() => { NM.x = 1730; NM.y = 396; }); await page.waitForTimeout(180);
    assert.equal(await page.evaluate(() => !!S.nightMode), true, 'walking to the edge must not end the night');
    await page.evaluate(() => { NM.x = 1489; NM.y = 396; NM.vx = NM.vy = 0; });
    await page.locator('#night-home-interact').waitFor({ state: 'visible' });
    await page.screenshot({ path: `${OUT}/${name}-home.png` });
    await page.locator('#night-home-interact').click();
    await page.locator('#dlg-options button').filter({ hasText: 'Stay out tonight' }).click();
    assert.equal(await page.evaluate(() => !!S.nightMode), true);
    await page.locator('#night-home-interact').click();
    const sleepClock = await page.evaluate(() => S.clock);
    await page.locator('#dlg-options button').filter({ hasText: 'Sleep — return to day mode' }).click();
    await page.locator('#night-home-skip').waitFor({ state: 'visible' }); await page.waitForTimeout(500);
    assert.equal(await page.evaluate(() => S.clock), sleepClock, 'clock is paused during cinematic');
    await page.screenshot({ path: `${OUT}/${name}-transition.png` });
    if (name !== 'chromium') await page.locator('#night-home-skip').click();
    await page.waitForFunction(() => !window.v725?.active(), null, { timeout: 15000 });
    await page.waitForTimeout(150);
    if (await page.locator('#dlg-options button').filter({ hasText: 'Straight to bed' }).isVisible()) await page.locator('#dlg-options button').filter({ hasText: 'Straight to bed' }).click();
    await page.waitForFunction(() => !S.nightMode, null, { timeout: 15000 });
    await page.locator('#eod-rewards button').first().waitFor({ state: 'visible' });
    await page.locator('#eod-rewards button').first().click();
    await page.waitForFunction(() => !S.nightMode && S.clock < 1020 && !S.inDialog, null, { timeout: 15000 });
    await page.waitForTimeout(1200);
    assert.equal(await page.evaluate(() => S.nightMode || null), null);
    assert.equal(await page.evaluate(() => localStorage.getItem('techops_char')), null);
    assert.equal(await page.evaluate(() => S.meta.nightVisit.active), false);
    await page.screenshot({ path: `${OUT}/${name}-morning.png` });
    steps.push(name === 'chromium' ? 'full home cinematic -> day review -> morning, no re-entry' : 'skip home cinematic -> day review -> morning, no re-entry');
    // Fresh page for same-day recovery and the asynchronous Sector 04 handoff.
    await context.clearCookies(); await page.evaluate(() => localStorage.clear()); await mount(page); await enterNight(page);
    await page.locator('#night-campaign').click(); await page.locator('#dlg-options button').filter({ hasText: 'Resume the daytime opening' }).click(); await finishReturn(page);
    const evidence = await prepareCampaign(page, true);
    const outcome = await page.evaluate(() => TechOpsSector04Runtime.enterBrowser());
    assert.equal(outcome.pending, true, 'Sector 04 should wait for Night Drive');
    await page.waitForFunction(() => window.v722?.active()); await page.evaluate(() => window.v722.skip());
    await page.waitForFunction(() => !!S.nightMode?._sector04?.active && !S.inDialog);
    await page.evaluate(() => { NM.x = 720; NM._continuityCheck = 'same-session'; NM.enemies.forEach(e => { e.x = 1000; }); });
    await page.locator('#night-campaign').click(); await page.locator('#dlg-options button').filter({ hasText: 'Continue Sector 04 investigation' }).click();
    assert.equal(await page.evaluate(() => NM._continuityCheck), 'same-session');
    assert.equal(await page.evaluate(() => JSON.stringify(TechOpsCampaign.load(localStorage).evidence)), evidence);
    assert.equal(await page.evaluate(() => TechOpsCampaign.load(localStorage).flags.tuesday_morning_reached), false);
    await page.screenshot({ path: `${OUT}/${name}-sector04.png` });
    steps.push('async Sector 04 launch and resume preserve evidence and encounter');
    assert.equal(errors.length, 0, `Unhandled browser errors: ${errors.join('\n')}`);
    record.status = 'passed';
  } catch (error) {
    record.status = 'failed'; record.failure = String(error.stack || error);
    try { record.state = await page.evaluate(() => ({ night: !!S?.nightMode, district: S?.nightMode?.district, inDialog: S?.inDialog, clock: S?.clock, runtime: window.TechOpsNightRuntime?.health(), dialog: document.querySelector('#dialogue')?.innerText })); await page.screenshot({ path: `${OUT}/${name}-failure.png` }); } catch {}
  } finally { await browser.close(); await writeFile(`${OUT}/report.json`, JSON.stringify(results, null, 2)); }
}
try {
  for (const [name, engine, mobile] of [['chromium', chromium, false], ['firefox', firefox, false], ['webkit', webkit, false], ['webkit-mobile', webkit, true]]) await run(name, engine, mobile);
} finally { server.kill(); }
console.log(JSON.stringify(results, null, 2));
if (results.some(r => r.status !== 'passed')) process.exitCode = 1;
