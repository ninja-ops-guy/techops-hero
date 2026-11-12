#!/usr/bin/env node
// Production browser acceptance. Only Day 1 prerequisites are seeded; all
// Sector 04 movement, jumps, inspections and return choices use browser input.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const port = process.env.SECTOR04_PORT || '4214';
const url = process.env.SECTOR04_BASE_URL || `http://127.0.0.1:${port}/`;
const out = path.resolve(process.env.SECTOR04_OUT_DIR || '/tmp/techops-sector04-acceptance');
const selected = process.env.SECTOR04_PROFILES?.split(',');
const profiles = [
  { name: 'desktop', width: 1280, height: 800, touch: false },
  { name: 'portrait', width: 390, height: 844, touch: true },
  { name: 'landscape', width: 844, height: 390, touch: true }
].filter(profile => !selected || selected.includes(profile.name));

const bindings = {
  left: ['ArrowLeft', '#dpad .d-left'],
  right: ['ArrowRight', '#dpad .d-right'],
  up: ['ArrowUp', '#dpad .d-up']
};

async function input(context, page, touch) {
  const session = touch ? await context.newCDPSession(page) : null;
  return {
    async hold(actions) {
      if (!session) {
        for (const action of actions) await page.keyboard.down(bindings[action][0]);
        return;
      }
      const touchPoints = await Promise.all(actions.map(async (action, index) => {
        const button = page.locator(bindings[action][1]);
        await button.waitFor({ state: 'visible' });
        const box = await button.boundingBox();
        assert.ok(box, `Missing touch direction ${action}`);
        const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
        const hit = await button.evaluate((el, point) => {
          const target = document.elementFromPoint(point.x, point.y);
          return el.contains(target) ? null : target?.id || target?.className || target?.tagName || 'outside viewport';
        }, point);
        assert.equal(hit, null, `Touch direction ${action} is occluded by ${hit}`);
        return { ...point, id: index + 1, radiusX: 3, radiusY: 3, force: 1 };
      }));
      await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints });
    },
    async release(actions) {
      if (!session) {
        for (const action of actions) await page.keyboard.up(bindings[action][0]);
        return;
      }
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    },
    async inspect() {
      if (!touch) return page.keyboard.press('KeyE');
      await page.locator('#tb-interact').tap();
    }
  };
}

async function prepareDay(page) {
  await page.evaluate(() => {
    const campaign = TechOpsCampaign.createInitialState();
    TechOpsCampaign.assignTicket(campaign, 'shipping_cannot_print', 'mike');
    TechOpsCampaign.assignTicket(campaign, 'plating_workstation_down', 'amit');
    TechOpsCampaign.assignTicket(campaign, 'impossible_access_event', 'mike');
    TechOpsCampaign.completeStandup(campaign);
    TechOpsCampaign.completeWorkstation(campaign, { redInTheMirrorHeard: true, feliciaVideoSeen: true });
    for (const id of ['shipping_cannot_print', 'plating_workstation_down']) {
      TechOpsCampaign.resolveTicket(campaign, id, { technicalResolution: true, verification: 'strong', humanOutcome: 'restored' });
    }
    TechOpsCampaign.recordGhostEvidence(campaign, { id: 'badge_impossible_access', perspective: 'firsthand', discoveredBy: 'mike' });
    TechOpsCampaign.save(campaign, localStorage);
    TechOpsCampaignNativeAct1.sector04Door();
  });
}

const position = page => page.evaluate(() => {
  const night = window.S?.nightMode;
  return night && { x: night.x, feet: night.y + night.h, grounded: night.onGround, hp: night.hp, jumps: night.jumps };
});
const sceneState = page => page.evaluate(() => TechOpsSector04.snapshot(TechOpsCampaign.load(localStorage)));
const nearby = page => page.evaluate(() => {
  const night = S.nightMode;
  return TechOpsSector04Runtime.nearestInspectable(night, night.x + night.w / 2, night.y + night.h / 2)?.id;
});
const waitUntilGrounded = page => page.waitForFunction(() => S.nightMode?.onGround && Math.abs(S.nightMode.vx) < .2);

async function walkTo(page, controls, target) {
  const right = (await position(page)).x < target;
  const actions = [right ? 'right' : 'left'];
  await controls.hold(actions);
  try {
    await page.waitForFunction(({ target, right }) => {
      const night = S.nightMode;
      return night && (right ? night.x >= target : night.x <= target);
    }, { target, right }, { timeout: 6000 });
  }
  finally { await controls.release(actions); }
}

async function landOn(page, controls, height) {
  const actions = ['right', 'up'];
  await controls.hold(actions);
  try {
    await page.waitForFunction(() => S.nightMode?.jumps === 1 && !S.nightMode.onGround);
    await page.waitForFunction(height => {
      const night = S.nightMode;
      return night?.onGround && night.y + night.h === height;
    }, height, { timeout: 3000 });
  } finally { await controls.release(actions); }
  await waitUntilGrounded(page);
  const landed = await position(page);
  assert.equal(landed.feet, height, 'Mike must be able to stop on the platform');
  return landed;
}

async function run(browser, profile, record) {
  const { name, width, height, touch } = profile;
  const context = await browser.newContext({ viewport: { width, height }, isMobile: touch, hasTouch: touch, reducedMotion: 'reduce' });
  await context.route('**/*', route => route.request().url().startsWith(url) ? route.continue() : route.abort());
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  page.on('pageerror', error => record.errors.push(error.message));
  page.on('response', response => {
    if (response.url().startsWith(url) && response.status() >= 400) record.errors.push(`${response.status()} ${response.url()}`);
  });
  const select = locator => touch ? locator.tap() : locator.click();
  const option = text => page.locator('#dlg-options button').filter({ hasText: text });
  const capture = checkpoint => page.screenshot({ path: path.join(out, `${name}-${checkpoint}.png`) });

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__productionTitleReadiness?.ready && window.TechOpsSector04Runtime);
    await select(page.locator('#btn-start'));
    await select(option(/Standard/));
    await select(option(/Clock in/));
    await page.waitForFunction(() => window.S?.map && !S.inDialog);
    await prepareDay(page);
    await select(option(/^Enter Sector 04$/));
    await page.waitForFunction(() => window.v722?.active() || S.nightMode?._sector04?.active);
    if (await page.evaluate(() => window.v722?.active())) {
      if (touch) await page.locator('#v722-cine canvas').tap();
      else await page.keyboard.press('Escape');
    }
    await page.waitForFunction(() => S.nightMode?._sector04?.active && !S.inDialog);
    await page.waitForFunction(() => S.nightMode?._sector04?.hangarDrawn === true && window.__techOpsLayerEvidence?.asset === 'sector04_hangar');
    const controls = await input(context, page, touch);
    await controls.inspect();
    assert.equal(await page.evaluate(() => S.inDialog), false, 'Sector 04 must not open the Earth travel hub');
    assert.equal((await sceneState(page)).controllerRevealed, false, 'Day evidence must not skip the opening clue');
    if (touch) assert.equal(await page.locator('#tb-interact').getAttribute('aria-label'), 'Attack');
    record.checks.push('The indoor hangar rendered at the campaign entrance');
    await page.waitForFunction(() => {
      const chapter = document.getElementById('night-chapter');
      return !chapter || getComputedStyle(chapter).display === 'none' || getComputedStyle(chapter).opacity === '0';
    });
    await capture('entrance');

    await walkTo(page, controls, 570);
    assert.equal(await nearby(page), 'purple_damage');
    if (touch) assert.equal(await page.locator('#tb-interact').getAttribute('aria-label'), 'Inspect');
    await controls.inspect();
    const clue = await sceneState(page);
    assert.equal(clue.purpleDamageInspected, true);
    assert.equal(clue.controllerRevealed, true);
    assert.equal(clue.controllerSevered, false);
    record.checks.push('Ground-level purple damage reveals the controller');
    await capture('trace');

    await walkTo(page, controls, 812);
    await waitUntilGrounded(page);
    record.lowerPlatform = await landOn(page, controls, 372);
    record.controllerPlatform = await landOn(page, controls, 320);
    if (await nearby(page) !== 'identity_controller') {
      await walkTo(page, controls, 1170);
      await waitUntilGrounded(page);
    }
    assert.equal(await nearby(page), 'identity_controller');
    record.checks.push('Two single jumps reach the elevated controller');
    await capture('controller');
    await controls.inspect();
    const severed = await sceneState(page);
    assert.equal(severed.controllerSevered, true);
    assert.equal(severed.permanentlyDefeated, true);
    assert.equal(await page.evaluate(() => S.nightMode.enemies.some(enemy => enemy.alive)), false);

    await walkTo(page, controls, 1540);
    assert.equal(await nearby(page), 'locked_violin_door');
    await controls.inspect();
    assert.equal((await sceneState(page)).violinNoteHeard, true);
    await walkTo(page, controls, 1630);
    assert.equal(await nearby(page), 'symptoms_terminal');
    await controls.inspect();
    const terminal = page.locator('#dlg-text');
    await terminal.waitFor();
    const terminalText = await terminal.innerText();
    assert.match(terminalText, /YOU ARE FIXING THE SYMPTOMS\./);
    assert.match(terminalText, /Mike: Then show me the problem\./);
    const terminalRecorded = await page.evaluate(() => {
      const campaign = TechOpsCampaign.load(localStorage);
      return campaign.flags.tuesday_morning_reached && campaign.history.some(event => event.type === 'sector04_inspected' && event.inspectableId === 'symptoms_terminal');
    });
    assert.equal(terminalRecorded, true, 'The terminal inspection must survive the Tuesday state reset');
    record.checks.push('Severed controller, heard the violin, and reached the authored terminal');
    await capture('terminal');

    await select(option(/^Continue to Tuesday morning$/));
    await page.waitForFunction(() => window.v725?.active() || !S.nightMode || document.querySelector('#dlg-text')?.textContent === 'The night gives way to morning.');
    if (await page.evaluate(() => window.v725?.active())) await select(page.locator('#v725-cine .day-cine-skip'));
    else if (await option(/^Continue to day mode$/).isVisible()) await select(option(/^Continue to day mode$/));
    await page.waitForFunction(() => !S.nightMode && S.day === 2);
    assert.equal(await page.evaluate(() => TechOpsCampaign.load(localStorage).flags.tuesday_morning_reached), true);
    record.checks.push('Tuesday morning restores the Day shell');
    assert.deepEqual(record.errors, []);
    record.passed = true;
  } catch (error) {
    record.error = String(error.stack || error);
    record.position = await position(page).catch(() => null);
    await capture('failure').catch(() => {});
  } finally {
    await context.close();
  }
}

assert.ok(profiles.length, 'Select at least one Sector 04 browser profile');
await mkdir(out, { recursive: true });
const server = process.env.SECTOR04_BASE_URL ? null : spawn('python3', ['scripts/media_http_server.py', '--port', port, '--bind', '127.0.0.1'], { stdio: 'ignore' });
const report = { fixture: 'Day 1 prerequisites and door placement', profiles: [] };
let browser;
try {
  for (let attempt = 0; attempt < 60; attempt++) {
    try { if ((await fetch(url)).ok) break; } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  browser = await chromium.launch({ headless: true });
  for (const profile of profiles) {
    const record = { ...profile, passed: false, checks: [], errors: [] };
    report.profiles.push(record);
    await run(browser, profile, record);
    console.log(JSON.stringify(record));
  }
} finally {
  await browser?.close();
  server?.kill();
  await writeFile(path.join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n');
}
if (report.profiles.some(profile => !profile.passed)) process.exitCode = 1;
