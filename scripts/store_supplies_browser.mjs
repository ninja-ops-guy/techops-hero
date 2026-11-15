import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
const base = process.env.STORE_BASE_URL || 'http://127.0.0.1:4178/';
const out = process.env.STORE_OUT_DIR || '/tmp/techops-store-check';
fs.mkdirSync(out, {recursive: true});
const server = process.env.STORE_BASE_URL ? null : spawn('python3', ['scripts/media_http_server.py', '--port', '4178', '--bind', '127.0.0.1'], {stdio: 'ignore'});
for (let attempt = 0; attempt < 50; attempt++) {
  try { if ((await fetch(base)).ok) break; } catch (_) {}
  await new Promise(resolve => setTimeout(resolve, 100));
}
const browser = await chromium.launch({headless: true});
const reports = [];
const allProfiles = [
  {id: 'desktop', viewport: {width: 1280, height: 800}, hasTouch: false},
  {id: 'portrait', viewport: {width: 390, height: 844}, hasTouch: true},
  {id: 'landscape', viewport: {width: 844, height: 390}, hasTouch: true}
];
const profiles = process.env.STORE_PROFILES ? allProfiles.filter(p => process.env.STORE_PROFILES.split(',').includes(p.id)) : allProfiles;
async function title(page) {
  await page.waitForFunction(() => window.__productionTitleReadiness?.ready && !document.querySelector('#btn-start')?.disabled);
}
function option(page, text) { return page.locator('#dlg-options button').filter({hasText: text}).first(); }
async function press(locator, touch) { await locator.scrollIntoViewIfNeeded(); if (touch) await locator.tap(); else await locator.click(); }
try {
  for (const profile of process.env.STORE_DAY_ONLY ? [] : profiles) {
    console.log('Checking', profile.id);
    const context = await browser.newContext(profile);
    await context.route('**/*', route => route.request().url().startsWith(base) ? route.continue() : route.abort());
    const page = await context.newPage(); page.setDefaultTimeout(30000);
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(base); await title(page);
    await press(page.locator('#btn-nightcrawler'), profile.hasTouch);
    await press(option(page, /Standard/), profile.hasTouch);
    await press(option(page, /Take the Charger/), profile.hasTouch);
    await page.locator('#v722-cine').waitFor({state: 'visible'});
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => window.S?.nightMode && !S.inDialog && !window.__productionDesiredMode);
    await press(page.locator('#night-campaign'), profile.hasTouch);
    await press(option(page, /^Supplies and store$/), profile.hasTouch);
    await press(option(page, /Store — buy/), profile.hasTouch);
    const budget = await page.evaluate(() => S.budget);
    await press(option(page, /^Field Dressing —/), profile.hasTouch);
    await press(option(page, /^First Aid Kit —/), profile.hasTouch);
    assert.equal(await page.evaluate(() => S.budget), budget - 60);
    assert.equal(await option(page, /^Field Dressing —/).count(), 0, 'sold stock disappears');
    await press(option(page, /Back to supplies/), profile.hasTouch);
    await press(option(page, /^Use First Aid/), profile.hasTouch);
    assert.equal(await page.evaluate(() => S.supplies.supply_firstaid), 1, 'full HP keeps the kit');
    // Explicit damage fixture isolates use and persistence from random enemy damage.
    await page.evaluate(() => { NM.hp = 40; });
    await press(option(page, /^Use Field Dressing/), profile.hasTouch);
    assert.equal(await page.evaluate(() => NM.hp), 55);
    assert.equal(await page.evaluate(() => S.supplies.supply_dressing), 0);
    await page.waitForTimeout(700);
    await page.screenshot({path: `${out}/${profile.id}-supplies.png`});
    await page.reload(); await title(page);
    await press(page.locator('#btn-nightcrawler'), profile.hasTouch);
    await page.waitForFunction(() => !!window.__nightCheckpointResumed && !!S?.nightMode);
    assert.equal(await page.evaluate(() => NM.hp), 55);
    assert.equal(await page.evaluate(() => S.supplies.supply_firstaid), 1);
    assert.equal(await page.evaluate(() => S.storeStock.includes('supply_dressing')), false);
    // Keyboard menu must use the visible Night dialogue, with no invisible panel lock.
    await page.keyboard.press('m');
    await page.waitForFunction(() => S.inDialog && document.querySelector('#dlg-name').textContent.includes('SUPPLIES'));
    assert.equal(await page.evaluate(() => panelOpen), false);
    await press(option(page, /Back to Night Walker/), profile.hasTouch);
    await press(page.locator('#night-campaign'), profile.hasTouch);
    await press(option(page, /West Annex/), profile.hasTouch);
    await page.waitForFunction(() => !!NM._nightwalker);
    await page.keyboard.press('Escape');
    await page.evaluate(() => { if (S.inDialog) closeDlg(); });
    await press(page.locator('#night-campaign'), profile.hasTouch);
    await press(option(page, /^Supplies and store$/), profile.hasTouch);
    await press(option(page, /^Use First Aid/), profile.hasTouch);
    assert.equal(await page.evaluate(() => NM.hp), 90);
    assert.equal(await page.evaluate(() => S.supplies.supply_firstaid), 0);
    assert.equal(await page.evaluate(() => TechOpsNightRuntime.checkpointStatus().state.nightMode.hp), 90);
    await press(option(page, /Back to Night Walker/), profile.hasTouch);
    await press(page.locator('#night-campaign'), profile.hasTouch);
    await press(option(page, /Save progress and return to free roam/), profile.hasTouch);
    assert.equal(await page.evaluate(() => NM.hp), 90, 'mission exit keeps healed HP');
    assert.equal(await page.evaluate(() => localStorage.getItem('techops_save')), null, 'standalone purchases keep Day isolated');
    assert.deepEqual(errors, []);
    reports.push({profile: profile.id, passed: true, fixture: 'Set Night HP to 40 while the supplies menu is open. Mission briefing dismissal uses closeDlg after the normal mission launch.', checks: ['purchase', 'sold stock', 'full health', 'use', 'reload', 'keyboard menu', 'field report use and return', 'Day isolation'], errors});
    await context.close();
  }
  // Day store uses a prepared budget/stock fixture after a normal new-game start.
  for (const profile of profiles) {
    console.log('Checking Day store', profile.id);
    const context = await browser.newContext(profile);
    await context.route('**/*', route => route.request().url().startsWith(base) ? route.continue() : route.abort());
    const page = await context.newPage(); page.setDefaultTimeout(30000);
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(base); await title(page);
    await press(page.locator('#btn-start'), profile.hasTouch);
    await press(option(page, /Standard/), profile.hasTouch);
    await press(option(page, /Clock in/), profile.hasTouch);
    await page.waitForFunction(() => window.S?.map && !S.inDialog);
    await page.evaluate(() => {
      S.budget = 1000; S.hp = 10;
      S.storeStock = ['supply_dressing', 'supply_firstaid', 'lab_bike', 'book_itil', 'lab_ram', 'retired-item'];
      S.storeStockDay = S.day;
    });
    await press(page.locator(profile.hasTouch ? '#tb-menu' : '#btn-menu'), profile.hasTouch);
    await press(page.locator('#panel-tabs button').filter({hasText: /^Store$/}), profile.hasTouch);
    await press(page.locator('[data-buy="lab_bike"]'), profile.hasTouch);
    await press(page.locator('[data-buy="book_itil"]'), profile.hasTouch);
    await press(page.locator('[data-buy="lab_ram"]'), profile.hasTouch);
    assert.equal(await page.evaluate(() => S.budget), 120);
    assert.equal(await page.evaluate(() => S.maxHp), 50);
    assert.equal(await page.evaluate(() => S.lab.includes('bike') && S.books.includes('book_itil')), true);
    await press(page.locator('[data-buy="supply_firstaid"]'), profile.hasTouch);
    await press(page.locator('[data-buy="supply_dressing"]'), profile.hasTouch);
    await press(page.locator('#panel-tabs button').filter({hasText: /^Inventory$/}), profile.hasTouch);
    await press(page.locator('[data-use="supply_firstaid"]'), profile.hasTouch);
    assert.equal(await page.evaluate(() => S.hp), 50);
    assert.equal(await page.evaluate(() => S.supplies.supply_firstaid), 0);
    // Carry the remaining purchased dressing through the ordinary Night entry.
    await press(page.locator('#panel-close'), profile.hasTouch);
    await page.evaluate(() => { S.clock = 1080; nightDoorDialog(); });
    await press(option(page, /Head out/), profile.hasTouch);
    await page.waitForFunction(() => !!S.nightMode);
    await page.evaluate(() => { NM.hp = 60; });
    await page.keyboard.press('m');
    await press(option(page, /^Use Field Dressing/), profile.hasTouch);
    assert.equal(await page.evaluate(() => NM.hp), 75);
    assert.equal(await page.evaluate(() => S.supplies.supply_dressing), 0);
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('techops_save')).supplies.supply_dressing), 0);
    assert.deepEqual(errors, []);
    reports.push({profile: 'day-' + profile.id, passed: true, fixture: 'Prepared budget, daily stock and HP. Opened the normal south-exit dialogue at 18:00, with Night HP set to 60.', checks: ['menu button', 'bike purchase', 'book purchase', 'lab upgrade', 'unknown saved stock', 'Day item use', 'Day to Night carryover', 'profile save'], errors});
    await context.close();
  }
  fs.writeFileSync(`${out}/report.json`, JSON.stringify(reports, null, 2));
  console.log(JSON.stringify(reports));
} finally { await browser.close(); if (server) server.kill(); }
