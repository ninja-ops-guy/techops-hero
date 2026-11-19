#!/usr/bin/env node
// Focused fixture-assisted regression: production standup, legacy wandering,
// checkpoint repair and coworker dialogue ownership. No campaign flags are set.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const port = Number(process.env.DAY_CONTACT_PORT || 4196);
const base = process.env.DAY_CONTACT_BASE_URL || `http://127.0.0.1:${port}/`;
const origin = new URL(base).origin;
const out = process.env.DAY_CONTACT_OUT_DIR || '/tmp/techops-day-contact-ownership';
const profiles = [
  { id: 'portrait', width: 390, height: 844, touch: true },
  { id: 'desktop', width: 1280, height: 800, touch: false }
].filter(p => !process.env.DAY_CONTACT_PROFILES || process.env.DAY_CONTACT_PROFILES.split(',').includes(p.id));
const report = {
  status: 'running', fixture: true,
  scope: 'Real New Day/Standard/Clock in, authored standup, assignment and Continue. Declared fixtures: office entry, floor position, scoped NPC list and randomness for the legacy wander step, injected board overlap in live state and a saved checkpoint, and a controlled clock for early Skip. Campaign progression comes from player-facing choices. Browser emulation.',
  profiles: []
};
let browser, server;
await mkdir(out, { recursive: true });

async function waitForServer() {
  for (let i = 0; i < 100; i++) {
    try { const r = await fetch(base); await r.arrayBuffer(); if (r.ok) return; } catch (_) {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw Error('Contact regression server unavailable: ' + base);
}
async function click(page, name) {
  await page.getByRole('button', { name, exact: true }).click({ timeout: 10000 });
}
async function capture(page, profile, label) {
  await page.screenshot({ path: `${out}/${profile}-${label}.png`, fullPage: true });
}
async function state(page) {
  return page.evaluate(() => ({
    position: { x: S.px, y: S.py }, room: S.room?.id || null,
    title: document.getElementById('dlg-name').textContent,
    inDialog: S.inDialog, native: S.meta.campaignAct1Native,
    contacts: S.npcs.filter(n => n.campaignAct1).map(n => ({ id: n.id, x: n.x, y: n.y })),
    flags: TechOpsCampaign.load(localStorage).flags
  }));
}

async function openShift(page) {
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.TechOpsProductionTitleExperience?.state().ready, null, { timeout: 30000 });
  await page.locator('#btn-start').click();
  await page.locator('#dlg-options button').filter({ hasText: 'Standard' }).click();
  await page.locator('#dlg-options button').filter({ hasText: 'Clock in' }).click();
  await page.waitForFunction(() => window.S?.map && window.TechOpsDayExperience && window.TechOpsCampaignNativeAct1);
}

async function enterStandup(page) {
  await page.evaluate(() => {
    if (S.inDialog) closeDlg();
    if (S.room) v69ExitRoom();
    TechOpsCampaignNativeAct1.ensureWorld(); TechOpsDayWorld.ensureWorld();
    // Same declared entry fixture as Day device acceptance; syncHud owns entry.
    S.room = { id: 'itdept', key: ROOM_OF_BIOME.itdept, x: .12, door: 'left', back: { px: S.px, py: S.py } };
    TechOpsDayExperience.syncHud();
  });
}

async function authoredStandup(page, result) {
  await openShift(page);
  await enterStandup(page);
  result.standup = [];
  for (const [index, speaker] of ['NICK', 'AMIT', 'BRANDON', 'DANIEL'].entries()) {
    const title = await page.locator('#dlg-name').textContent();
    assert.equal(title, 'STANDUP SCENE // ' + speaker);
    result.standup.push(title);
    if (index === 0) await capture(page, result.id, 'authored-standup');
    await click(page, index === 3 ? 'Decide the assignments' : 'Continue standup');
  }
  assert.equal(await page.locator('#dlg-name').textContent(), 'MORNING STANDUP');
  await click(page, 'Assign queue: Mike investigates access');
  const campaign = await page.evaluate(() => TechOpsCampaign.load(localStorage));
  assert.equal(campaign.flags.standup_completed, true);
  assert.deepEqual(campaign.assignments, { shipping_cannot_print: 'mike', plating_workstation_down: 'amit', impossible_access_event: 'mike' });
  result.assignment = campaign.assignments;
  await page.evaluate(() => { closeDlg(); if (S.room) v69ExitRoom(); });
  result.checks.push('All four authored standup speakers and real ownership assignment preserved');
}

async function dialogue(page) {
  return page.evaluate(() => ({
    open: S.inDialog && !document.getElementById('dialogue').classList.contains('hidden'),
    title: document.getElementById('dlg-name').textContent,
    body: document.getElementById('dlg-text').textContent
  }));
}

async function campaignState(page) {
  return page.evaluate(() => TechOpsCampaign.load(localStorage));
}

async function openFromFloor(page, x, y) {
  await page.evaluate(({ x, y }) => {
    if (S.inDialog) closeDlg();
    if (S.room) v69ExitRoom();
    if (S.map[y]?.[x] !== 0) throw Error('Interaction fixture is not on floor');
    S.px = x; S.py = y;
    interact();
  }, { x, y });
}

function assertAmit(view) {
  assert.equal(view.open, true);
  assert.match(view.title, / AMIT — IT DEPT$/);
  assert.match(view.body, /I own the Plating incident/);
}

async function verifyChooser(page, result, assigned) {
  // Amit (33,13) and the board (34,12) share this approach tile.
  await openFromFloor(page, 34, 13);
  assert.equal((await dialogue(page)).title, 'NEARBY / CHOOSE AN INTERACTION');
  const options = await page.locator('#dlg-options button').allTextContents();
  assert.ok(options.includes('Talk to AMIT'));
  assert.ok(options.includes('Read Morning standup board'));
  await click(page, 'Talk to AMIT');
  const amit = await dialogue(page);
  assertAmit(amit);
  assert.deepEqual(await campaignState(page), assigned);

  await openFromFloor(page, 34, 13);
  await click(page, 'Read Morning standup board');
  const board = await dialogue(page);
  assert.equal(board.open, true);
  assert.equal(board.title, 'CAMPAIGN STANDUP');
  assert.match(board.body, /Shipping -> Mike.*Plating -> Amit.*Impossible Access -> Mike/s);
  assert.deepEqual(await campaignState(page), assigned);
  result.chooser = { options, amit, board };
  result.checks.push('Amit and the completed board remain separately selectable without changing campaign state');
}

async function verifyContinue(page, result, assigned) {
  const saved = await page.evaluate(() => {
    if (S.inDialog) closeDlg();
    if (S.room) v69ExitRoom();
    S.px = 33; S.py = 14;
    if (!save()) throw Error('Could not save Day checkpoint');
    const key = TechOpsSaveKeys.dayCheckpoint;
    const checkpoint = JSON.parse(localStorage.getItem(key));
    if (checkpoint?.savedAt !== S._saveRevision) throw Error('Missing current Day checkpoint');
    const amit = COWORKERS.find(n => n.id === 'amit');
    const board = checkpoint.state.npcs.find(n => n.id === 'campaign_standup');
    board.x = amit.x; board.y = amit.y;
    localStorage.setItem(key, JSON.stringify(checkpoint));
    return { revision: checkpoint.savedAt, position: { x: S.px, y: S.py } };
  });

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.TechOpsProductionTitleExperience?.state().ready, null, { timeout: 30000 });
  const resumed = await page.locator('#btn-continue').evaluate(button => {
    if (!button.getClientRects().length || button.disabled) throw Error('Continue is unavailable');
    // Observe synchronously so a later world refresh cannot repair a missed load-time overlap.
    button.click();
    const boards = S.npcs.filter(n => n.id === 'campaign_standup');
    const board = boards[0];
    return {
      revision: S._saveRevision, position: { x: S.px, y: S.py },
      titleHidden: document.getElementById('title-screen').classList.contains('hidden'),
      count: boards.length, board: board && { x: board.x, y: board.y },
      native: S.meta.campaignAct1Native?.standup,
      floor: board && S.map[board.y]?.[board.x],
      onCoworker: board && COWORKERS.some(n => n.x === board.x && n.y === board.y)
    };
  });
  result.resume = { saved, resumed };
  assert.equal(resumed.titleHidden, true);
  assert.equal(resumed.revision, saved.revision);
  assert.deepEqual(resumed.position, saved.position, 'Continue must restore the saved floor position');
  assert.equal(resumed.count, 1);
  assert.equal(resumed.onCoworker, false);
  assert.equal(resumed.floor, 0);
  assert.deepEqual(resumed.native, resumed.board);
  await page.evaluate(() => interact());
  assertAmit(await dialogue(page));
  assert.deepEqual(await campaignState(page), assigned);
  result.checks.push('Continue restores a real checkpoint, repairs the overlap before interaction and preserves assignments');
}

async function verifyEarlySkip(page, result) {
  await openShift(page);
  const now = Date.now();
  await page.clock.install({ time: now });
  await page.clock.pauseAt(now + 1000);
  await enterStandup(page);
  assert.equal((await dialogue(page)).title, 'STANDUP SCENE // NICK');
  await page.clock.fastForward(5500);
  assert.equal((await dialogue(page)).title, 'STANDUP SCENE // AMIT', 'The timer must advance the live scene');
  await page.getByRole('button', { name: 'Skip to assignments', exact: true }).dispatchEvent('click');
  assert.equal((await dialogue(page)).title, 'MORNING STANDUP');
  await page.getByRole('button', { name: 'Delegate Impossible Access to Security', exact: true }).dispatchEvent('click');
  const assigned = await campaignState(page);
  assert.equal(assigned.flags.standup_completed, true);
  assert.deepEqual(assigned.assignments, { shipping_cannot_print: 'mike', plating_workstation_down: 'amit', impossible_access_event: 'security' });
  await openFromFloor(page, 33, 14);
  const before = await dialogue(page);
  assertAmit(before);
  await page.clock.fastForward(5700);
  const after = await dialogue(page);
  assert.deepEqual(after, before, 'The pending standup beat must leave Amit’s dialogue intact');
  assert.deepEqual(await campaignState(page), assigned);
  result.earlySkip = { before, after, assignment: assigned.assignments };
  result.checks.push('Early Skip retires an active standup timer and preserves Amit’s dialogue and delegated assignment');
  await page.clock.resume();
}

async function coworkers(page, result, label) {
  const owners = await page.evaluate(() => {
    const results = [];
    for (const npc of COWORKERS) {
      if (S.inDialog) closeDlg();
      if (S.room) v69ExitRoom();
      const p = [[0, 1], [-1, 0], [1, 0], [0, -1]].map(([dx, dy]) => ({ x: npc.x + dx, y: npc.y + dy }))
        .find(p => S.map[p.y]?.[p.x] === 0 && !S.npcs.some(n => n.x === p.x && n.y === p.y) && !COWORKERS.some(n => n.x === p.x && n.y === p.y));
      if (!p) throw Error('Coworker has no clear approach: ' + npc.name);
      S.px = p.x; S.py = p.y; S.meta.dayRouteTarget = 'mike_desk';
      interact();
      if (document.getElementById('dlg-name').textContent.includes('CHOOSE')) {
        const option = Array.from(document.querySelectorAll('#dlg-options button')).find(b => b.textContent === 'Talk to ' + npc.name);
        if (!option) throw Error('Missing coworker interaction owner: ' + npc.name);
        option.click();
      }
      const title = document.getElementById('dlg-name').textContent;
      if (!title.toUpperCase().includes(npc.name)) throw Error('Wrong speaker: ' + title + ' (npc ' + npc.name + ', pos ' + npc.x + ',' + npc.y + ')');
      if (title !== npc.face + ' ' + npc.name + ' — IT DEPT') throw Error('Incorrect coworker dialogue owner: ' + title);
      results.push({ npc: npc.name, title, player: p });
    }
    return results;
  });
  result[label] = owners;
  await capture(page, result.id, label);
  return owners;
}

async function forcedWander(page) {
  return page.evaluate(() => {
    if (S.inDialog) closeDlg(); if (S.room) v69ExitRoom();
    const board = S.npcs.find(n => n.id === 'campaign_standup');
    if (!board) throw Error('No authored standup board');
    // The historical diagonal from (34,12) to Amit at (33,13).
    const start = { x: 34, y: 12 }, destination = COWORKERS.find(n => n.name === 'AMIT');
    if (S.map[start.y]?.[start.x] !== 0 || S.map[destination.y]?.[destination.x] !== 0) throw Error('Historical wander tiles are not floor');
    const other = S.npcs.find(n => n.ambient && !n.campaignAct1 && n.x > 1 && S.map[n.y + 1]?.[n.x - 1] === 0 && !COWORKERS.some(c => c.x === n.x - 1 && c.y === n.y + 1));
    if (!other) throw Error('No ordinary ambient movement control');
    const originalNpcs = S.npcs, originalRandom = Math.random;
    const otherStart = { x: other.x, y: other.y };
    const oldBoard = { x: board.x, y: board.y };
    board.x = start.x; board.y = start.y;
    // Only this synchronous step sees the fixture list; all real NPCs return
    // before any frame or timer can run. The hook's actual filter/pick/R execute.
    S.npcs = [board, other]; S.px = 21; S.py = 16;
    let offsets = 0, randomCalls = 0;
    Math.random = function () {
      const stack = new Error().stack || '';
      if (!stack.includes('v67_hooks.js')) return originalRandom();
      randomCalls++;
      if (/\bat R \(/.test(stack)) return offsets++ % 2 === 0 ? 0 : .999999;
      return .1; // first NPC, success probability, with a stable diagonal above
    };
    let observed;
    try {
      step(0);
      observed = { boardBefore: start, boardAfter: { x: board.x, y: board.y }, nativeBeforeRefresh: { ...S.meta.campaignAct1Native.standup }, ordinaryBefore: otherStart, ordinaryAfter: { x: other.x, y: other.y }, offsets, randomCalls };
    } finally {
      S.npcs = originalNpcs; Math.random = originalRandom;
      // Keep the observed board location for ownership verification; ordinary
      // movement is a disposable control and must not alter the real floor.
      other.x = otherStart.x; other.y = otherStart.y;
    }
    observed.originalBoard = oldBoard;
    // The production 250ms story-spine tick refreshes the native coordinates.
    // Invoke its real callback synchronously rather than wait for a random frame.
    if (!window.TechOpsCampaignBibleGapPass) throw Error('Production story-spine tick is unavailable');
    observed.spine = TechOpsCampaignBibleGapPass.ensureDay1Spine();
    observed.nativeAfter = S.meta.campaignAct1Native.standup;
    return observed;
  });
}

async function savedOverlap(page) {
  return page.evaluate(() => {
    if (S.inDialog) closeDlg(); if (S.room) v69ExitRoom();
    const board = S.npcs.find(n => n.id === 'campaign_standup'), amit = COWORKERS.find(n => n.name === 'AMIT');
    board.x = amit.x; board.y = amit.y; // declared old-checkpoint corruption
    const canonicalBefore = JSON.stringify(TechOpsCampaign.load(localStorage));
    const repaired = TechOpsCampaignNativeAct1.ensureWorld();
    const position = { x: board.x, y: board.y };
    return { repaired, overlap: { x: amit.x, y: amit.y }, position, native: S.meta.campaignAct1Native.standup,
      canonicalUnchanged: canonicalBefore === JSON.stringify(TechOpsCampaign.load(localStorage)),
      duplicates: S.npcs.filter(n => n.id === board.id).length, floor: S.map[board.y]?.[board.x],
      onCoworker: COWORKERS.some(n => n.x === board.x && n.y === board.y) };
  });
}

async function profilePage(profile, result) {
  const context = await browser.newContext({ viewport: result.viewport, hasTouch: profile.touch, isMobile: profile.touch, reducedMotion: 'reduce' });
  await context.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  const page = await context.newPage();
  page.on('pageerror', error => result.pageErrors.push(String(error.stack || error)));
  return { context, page };
}

try {
  if (!profiles.length) throw Error('DAY_CONTACT_PROFILES selected no profiles');
  if (!process.env.DAY_CONTACT_BASE_URL) server = spawn('python3', ['scripts/media_http_server.py', '--port', String(port), '--bind', '127.0.0.1'], { stdio: 'ignore' });
  await waitForServer();
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome'].find(existsSync);
  browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  report.browserVersion = browser.version();
  for (const profile of profiles) {
    const result = { id: profile.id, viewport: { width: profile.width, height: profile.height }, status: 'running', checks: [], pageErrors: [] };
    report.profiles.push(result);
    const { context, page } = await profilePage(profile, result);
    try {
      await authoredStandup(page, result);
      const assigned = await campaignState(page);
      await coworkers(page, result, 'before-wander');
      // Real dialogue ownership blocks ambient wandering during this wait.
      // Closing it inside forcedWander immediately exercises the elapsed hook.
      await page.waitForTimeout(2700);
      result.wander = await forcedWander(page);
      // Check ownership before pin assertions so an old revision can retain the
      // exact wrong-speaker evidence as well as the movement that caused it.
      await coworkers(page, result, 'after-wander');
      assert.deepEqual(result.wander.boardAfter, result.wander.boardBefore, 'Campaign board must never enter the ambient wander pool');
      assert.equal(result.wander.offsets, 2, 'The real legacy wander hook must exercise the movement control');
      assert.deepEqual(result.wander.ordinaryAfter, { x: result.wander.ordinaryBefore.x - 1, y: result.wander.ordinaryBefore.y + 1 }, 'Ordinary ambient movement remains enabled');
      result.checks.push('Forced real legacy wandering preserves board position and all four coworker dialogue owners');
      result.savedOverlap = await savedOverlap(page);
      assert.equal(result.savedOverlap.repaired, true);
      assert.equal(result.savedOverlap.onCoworker, false, 'Old checkpoint board must be relocated off every authored coworker');
      assert.equal(result.savedOverlap.floor, 0);
      assert.equal(result.savedOverlap.duplicates, 1);
      assert.deepEqual(result.savedOverlap.native, result.savedOverlap.position);
      assert.equal(result.savedOverlap.canonicalUnchanged, true, 'Spatial repair must not alter campaign progression');
      await coworkers(page, result, 'after-checkpoint-repair');
      result.checks.push('Production checkpoint repair restores contact separation and all coworker owners without story writes');
      const beforeDelay = await state(page);
      await page.waitForTimeout(5700);
      const afterDelay = await state(page);
      assert.equal(afterDelay.inDialog, true);
      assert.equal(afterDelay.title, beforeDelay.title, 'A retired standup timer cannot replace the coworker conversation');
      assert.equal(afterDelay.title.toUpperCase().includes('DANIEL'), true);
      result.delayedOwner = { waitMs: 5700, before: beforeDelay.title, after: afterDelay.title };
      await capture(page, result.id, 'delayed-owner');
      result.checks.push('Coworker dialogue remains owned after the 5500ms standup timer boundary');
      if (profile.id === 'portrait') {
        await verifyChooser(page, result, assigned);
        await verifyContinue(page, result, assigned);
        const early = await profilePage(profile, result);
        try {
          await verifyEarlySkip(early.page, result);
          await capture(early.page, result.id, 'early-skip');
        } finally { await early.context.close(); }
      }
      assert.deepEqual(result.pageErrors, []);
      result.status = 'passed';
    } catch (error) {
      result.status = 'failed'; result.failure = String(error.stack || error);
      result.failureState = await state(page).catch(() => null);
      await capture(page, result.id, 'failure').catch(() => {});
      throw error;
    } finally { await context.close(); }
  }
  report.status = 'passed';
} catch (error) {
  report.status = browser ? 'failed' : 'blocked'; report.failure = String(error.stack || error); process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  if (server) server.kill();
  await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
}
