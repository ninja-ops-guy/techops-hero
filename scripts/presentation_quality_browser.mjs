#!/usr/bin/env node
// Responsive presentation acceptance. Direct scene entry is a visual fixture;
// the assignment/workstation choices themselves use the production controls.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { assertLandscapeControlBounds, assertTouchTarget } from './responsive_control_contract.mjs';

const port = Number(process.env.PRESENTATION_PORT || 4196);
const base = process.env.PRESENTATION_BASE_URL || `http://127.0.0.1:${port}/`;
const out = process.env.PRESENTATION_OUT_DIR || '/tmp/techops-presentation-quality';
const server = process.env.PRESENTATION_BASE_URL ? null : spawn('python3', ['scripts/media_http_server.py', '--port', String(port), '--bind', '127.0.0.1'], { stdio: 'ignore' });
const profiles = [
  ['desktop', 1280, 800, false], ['portrait', 390, 844, true],
  ['compact', 320, 568, true], ['landscape', 844, 390, true],
  ['zoom-equivalent', 640, 400, false]
].filter(([name]) => !process.env.PRESENTATION_PROFILES || process.env.PRESENTATION_PROFILES.split(',').includes(name));
const report = { status: 'running', fixture: true, profiles: [] };
let browser;

async function settledText(page) {
  // Tapping the production dialogue copy completes its typewriter, and does not
  // activate a choice. Wait for a stable copy before taking a visual receipt.
  await page.locator('#dlg-text').click();
  await page.waitForTimeout(250);
}
async function sceneContract(page, profile, scene) {
  await settledText(page);
  if (scene === 'workstation') await page.waitForFunction(() => !window.__techopsAct1ReferenceScene);
  else await page.waitForFunction(id => window.__techopsAct1ReferenceScene === id, scene);
  const state = await page.evaluate(() => {
    const dialog = document.getElementById('dialogue');
    const stage = document.getElementById('act1-reference');
    const bg = stage && stage.querySelector('.a1-bg');
    return {
      scene: window.__techopsAct1ReferenceScene,
      sameContext: !stage || stage.parentNode === dialog.parentNode,
      copy: document.getElementById('dlg-text').textContent,
      dialog: dialog.getBoundingClientRect().toJSON(), stage: stage && stage.getBoundingClientRect().toJSON(),
      font: parseFloat(getComputedStyle(document.getElementById('dlg-text')).fontSize),
      animation: stage ? getComputedStyle(stage).animationName : 'none',
      background: bg ? getComputedStyle(bg).backgroundImage : null,
      touchVisible: getComputedStyle(document.getElementById('touch-ui')).visibility,
      viewport: { width: innerWidth, height: innerHeight },
      scrollWidth: document.body.scrollWidth
    };
  });
  assert.equal(state.sameContext, true, 'scene cannot visually cover dialogue through a sibling stacking context');
  if (scene === 'workstation') {
    assert.equal(state.stage, null, 'retired workstation concept plate stays retired');
    assert.match(state.copy, /The shift is waiting on the other side of the screen/, 'clicking current HTML-rich dialogue cannot resurrect preceding typewriter copy');
  } else assert.ok(state.stage.bottom <= state.dialog.top + 1 || state.stage.right <= state.dialog.left + 1, 'art and conversation reserve separate areas');
  assert.ok(state.dialog.top >= 0 && state.dialog.bottom <= state.viewport.height, 'dialogue must remain on screen');
  assert.ok(state.scrollWidth <= state.viewport.width, 'no horizontal overflow');
  assert.ok(state.font >= 13, 'body copy must remain readable');
  assert.equal(state.animation, 'none', 'reduced motion removes scene entrance animation');
  if (state.stage) assert.equal(state.touchVisible, 'hidden', 'movement controls cannot intercept a scene conversation');
  const buttons = page.locator('#dlg-options button');
  for (let i = 0; i < await buttons.count(); i++) {
    const button = buttons.nth(i);
    await button.scrollIntoViewIfNeeded();
    const box = await button.boundingBox();
    assertTouchTarget(box, 'dialogue choice');
    assert.ok(await button.evaluate(el => {
      const b = el.getBoundingClientRect();
      const hit = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2);
      return hit === el || el.contains(hit);
    }), 'each choice is reachable and unobscured');
  }
  await page.locator('#dialogue').evaluate(el => { el.scrollTop = 0; });
  await page.locator('#toast').waitFor({ state: 'hidden', timeout: 12000 });
  await page.screenshot({ path: `${out}/${profile}-${scene}.png` });
  return state;
}

try {
  await mkdir(out, { recursive: true });
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(base)).ok) break; } catch (_) { /* server startup */ }
    if (i === 99) throw Error('Presentation server unavailable');
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  browser = await chromium.launch({ headless: true });
  for (const [name, width, height, touch] of profiles) {
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: touch, isMobile: touch, reducedMotion: 'reduce' });
    await context.route('**/*', route => route.request().url().startsWith(base) ? route.continue() : route.abort());
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(String(error)));
    try {
      await page.goto(base, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => window.TechOpsProductionTitleExperience?.state().ready, null, { timeout: 25000 });
      await page.locator('#btn-start').click();
      await page.locator('#dlg-options button').filter({ hasText: 'Standard' }).click();
      await page.locator('#dlg-options button').filter({ hasText: 'Clock in' }).click();
      await page.waitForFunction(() => window.S && window.TechOpsCampaignNativeAct1);
      await page.evaluate(() => { if (S.inDialog) closeDlg(); });
      await page.locator('#toast').waitFor({ state: 'hidden', timeout: 12000 });
      // Initial Day notifications are scheduled in sequence. Wait through the
      // first cycle so screenshot receipts do not capture an unrelated toast.
      await page.waitForTimeout(1300);
      await page.locator('#toast').waitFor({ state: 'hidden', timeout: 12000 });
      await page.waitForTimeout(200);
      const field = await page.evaluate(() => {
        const rect = id => document.getElementById(id).getBoundingClientRect().toJSON();
        return { objectives: rect('quest-tracker'), controls: rect('dpad'), phoneRole: document.getElementById('v54-phone').getAttribute('role'), phoneTab: document.getElementById('v54-phone').tabIndex,
          toolbar: [...document.querySelectorAll('#hud-right [data-control-label]')].map(el => ({ id: el.id, ...el.getBoundingClientRect().toJSON() })).filter(b => b.width > 0) };
      });
      assert.equal(field.phoneRole, 'button');
      assert.equal(field.phoneTab, 0);
      for (const control of field.toolbar) assertTouchTarget(control, control.id);
      if (name === 'landscape') assert.ok(field.objectives.bottom <= field.controls.top, 'landscape objectives must not overlap movement controls');
      await page.screenshot({ path: `${out}/${name}-day.png` });
      await page.evaluate(() => TechOpsCampaignNativeAct1.openStandup());
      const standup = await sceneContract(page, name, 'standup');
      await page.locator('#dlg-options button').filter({ hasText: 'Assign queue: Mike investigates access' }).click();
      await page.locator('#dlg-options button').filter({ hasText: 'Open workstation' }).click();
      const workstation = await sceneContract(page, name, 'workstation');
      assert.deepEqual(errors, []);
      report.profiles.push({ name, pass: true, field, standup, workstation });
      console.log(JSON.stringify({ profile: name, status: 'passed' }));
    } catch (error) {
      await page.screenshot({ path: `${out}/${name}-failure.png` }).catch(() => {});
      report.profiles.push({ name, pass: false, failure: String(error.stack || error), errors });
    } finally { await context.close(); }
  }
  // MORE is a distinct responsive state: six combat controls must coexist
  // with four directions and A/menu on the smallest supported landscape row.
  const nightContext = await browser.newContext({ viewport: { width: 568, height: 320 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
  await nightContext.route('**/*', route => route.request().url().startsWith(base) ? route.continue() : route.abort());
  const nightPage = await nightContext.newPage(), nightErrors = [];
  nightPage.on('pageerror', error => nightErrors.push(String(error)));
  try {
    await nightPage.goto(base, { waitUntil: 'domcontentloaded' });
    await nightPage.waitForFunction(() => window.TechOpsProductionTitleExperience?.state().ready, null, { timeout: 25000 });
    await nightPage.locator('#btn-nightcrawler').tap();
    const deadline = Date.now() + 20000;
    while (Date.now() < deadline) {
      if (await nightPage.evaluate(() => !!window.S?.nightMode && !S.inDialog && !window.v722?.active() && !window.__productionDesiredMode)) break;
      if (await nightPage.evaluate(() => !!window.v722?.active())) await nightPage.keyboard.press('Escape');
      else {
        const choices = nightPage.locator('#dlg-options button');
        if (await choices.first().isVisible().catch(() => false)) {
          const standard = choices.filter({ hasText: /Standard/ }).first();
          await (await standard.isVisible() ? standard : choices.first()).tap();
        }
      }
      await nightPage.waitForTimeout(100);
    }
    await nightPage.waitForFunction(() => window.S?.nightMode && !S.inDialog && !window.__productionDesiredMode, null, { timeout: 1000 });
    const collapsed = await assertLandscapeControlBounds(nightPage);
    const more = nightPage.locator('#night-input-assists');
    const cycles = [];
    const stableTargets = snapshot => snapshot.controls
      .filter(control => control.id.startsWith('dbtn ') || ['tb-interact', 'tb-menu', 'night-input-assists'].includes(control.id))
      .map(({ id, left, top, width, height }) => ({ id, left, top, width, height }));
    for (let cycle = 0; cycle < 6; cycle++) {
      await more.tap();
      await nightPage.waitForFunction(() => document.getElementById('night-input-assists')?.getAttribute('aria-expanded') === 'true');
      const expanded = await assertLandscapeControlBounds(nightPage);
      assert.equal(expanded.controls.length, 12, 'expanded Night exposes all twelve movement/combat/menu targets');
      assert.deepEqual(stableTargets(expanded), stableTargets(collapsed), 'opening MORE cannot resize or relocate movement, MORE, A, or menu targets');
      if (cycle === 0) await nightPage.screenshot({ path: `${out}/narrow-landscape-night-more.png` });
      await more.tap();
      await nightPage.waitForFunction(() => document.getElementById('night-input-assists')?.getAttribute('aria-expanded') === 'false');
      const restored = await assertLandscapeControlBounds(nightPage);
      assert.equal(restored.controls.length, collapsed.controls.length, 'collapsing MORE restores the original control set');
      assert.deepEqual(stableTargets(restored), stableTargets(collapsed), 'closing MORE cannot resize or relocate movement, MORE, A, or menu targets');
      cycles.push({ expanded, restored });
    }
    assert.deepEqual(nightErrors, []);
    report.narrowNight = { pass: true, collapsed, expanded: cycles[0].expanded, restored: cycles[0].restored, cycles };
    console.log(JSON.stringify({ profile: 'narrow-landscape-night-more', status: 'passed' }));
  } catch (error) {
    report.narrowNight = { pass: false, failure: String(error.stack || error), errors: nightErrors, controls: error.controlSnapshot || null };
    await nightPage.screenshot({ path: `${out}/narrow-landscape-night-more-failure.png` }).catch(() => {});
  } finally { await nightContext.close(); }
  report.status = report.profiles.length && report.profiles.every(p => p.pass) && report.narrowNight.pass ? 'passed' : 'failed';
  if (report.status === 'failed') process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  if (server) server.kill();
  await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
}
