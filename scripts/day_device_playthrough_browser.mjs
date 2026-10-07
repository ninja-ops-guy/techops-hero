#!/usr/bin/env node
// Unassisted Day-1 playthrough: real title buttons, HUD route buttons, and
// keyboard-only movement. No coordinate fixtures, no state injection.
// page.evaluate is READ-ONLY (state assertions, route guidance, HUD geometry
// diagnostics); every progression beat is driven by actual buttons or keys.
// Music: external soundtrack requests are blocked in this environment, so the
// morning track uses the game's real accessibility path ("Continue with music
// muted"). That records morningListening.status = user_skipped — audible
// playback of Red in the Mirror stays uncertified here and is covered by the
// fixture-assisted mapping capture plus manual browser steps in the report.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const port = Number(process.env.DAY_PLAYTHROUGH_PORT || 4195);
const base = process.env.DAY_PLAYTHROUGH_BASE_URL || `http://127.0.0.1:${port}/`;
const origin = new URL(base).origin;
const out = process.env.DAY_PLAYTHROUGH_OUT_DIR || 'scripts/docs/qa-day-playthrough-2026-10-03';
const profile = {
  id: process.env.DAY_PLAYTHROUGH_PROFILE || 'portrait',
  width: Number(process.env.DAY_PLAYTHROUGH_WIDTH || 390),
  height: Number(process.env.DAY_PLAYTHROUGH_HEIGHT || 844),
  touch: (process.env.DAY_PLAYTHROUGH_TOUCH || '1') === '1'
};
const report = {
  status: 'running', fixture: false, browser: 'chromium', profile,
  scope: 'Complete unassisted Day-1 playthrough with normal player controls: real title/morning buttons, HUD route marking, keyboard walking with collision checks, side-room entry by walking, workstation desktop interactions, Shipping printer + workstation investigation, and requester verification. No teleports, no coordinate fixtures, no progress injection. page.evaluate is read-only. Morning music uses the real "Continue with music muted" accessibility path (external audio is blocked here); audible playback of Red in the Mirror remains uncertified in this environment.'
};
let browser, server;
const beats = [];
const pageErrors = [];
const blocked = [];
await mkdir(out, { recursive: true });

async function waitForServer() {
  for (let i = 0; i < 100; i++) {
    try { const res = await fetch(base); await res.arrayBuffer(); if (res.ok) return; } catch (_) {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Playthrough server unavailable: ${base}`);
}
async function click(page, name) {
  await page.getByRole('button', { name, exact: true }).click({ timeout: 10000 });
}
async function clickMatch(page, pattern) {
  await page.getByRole('button', { name: pattern }).first().click({ timeout: 10000 });
}
async function state(page) {
  return page.evaluate(() => {
    const c = TechOpsCampaign.load(localStorage);
    return {
      px: S.px, py: S.py, room: S.room ? { id: S.room.id, x: S.room.x, door: S.room.door || null } : null,
      inDialog: S.inDialog, flags: c.flags, tickets: c.tickets,
      investigations: c.investigations || {}, listening: c.morningListening || null,
      objective: TechOpsDayWorld.nextObjective() && { id: TechOpsDayWorld.nextObjective().id, title: TechOpsDayWorld.nextObjective().title }
    };
  });
}
async function screenshot(page, name) {
  await page.locator('#dlg-text, .day-workspace, .day-evidence').evaluateAll(nodes => nodes.forEach(el => { el.scrollTop = 0; })).catch(() => {});
  await page.screenshot({ path: `${out}/${report.profile.id}-${name}.png`, fullPage: true });
}
// READ-ONLY floor HUD geometry: which boxes overlap at this viewport.
async function hudDiag(page) {
  return page.evaluate(() => {
    const r = el => { const b = el.getBoundingClientRect(); return { el: el.id || String(el.className), x: +b.x.toFixed(1), y: +b.y.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1), right: +b.right.toFixed(1), bottom: +b.bottom.toFixed(1) } };
    const hit = (a, b) => !(a.right <= b.x || b.right <= a.x || a.bottom <= b.y || b.bottom <= a.y);
    const top = document.getElementById('hud-top');
    const children = [...top.children].map(r);
    const right = [...document.getElementById('hud-right').children].map(r);
    // Identify exactly what paints inside the stats row between the cells.
    const stack = [130, 140, 150].map(x => [x, 65].join(',')).map(pt => {
      const [x, y] = pt.split(',').map(Number);
      return { x, y, stack: document.elementsFromPoint(x, y).map(el => ({ el: el.id || String(el.className).slice(0, 40), text: (el.textContent || '').slice(0, 40) })) };
    });
    const all = children.concat(right);
    const overlaps = [];
    for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) if (hit(all[i], all[j])) overlaps.push({ a: all[i].el, b: all[j].el });
    return { viewport: { w: innerWidth, h: innerHeight }, hudTop: r(top), gridTemplateColumns: getComputedStyle(top).gridTemplateColumns, children, hudRightChildren: right, questTracker: r(document.getElementById('quest-tracker')), hitStack: stack, overlaps };
  });
}
// READ-ONLY workstation console geometry: taskbar vs footer overlap check.
async function consoleDiag(page) {
  return page.evaluate(() => {
    const r = el => { const b = el.getBoundingClientRect(); return { el: el.className || el.id, x: +b.x.toFixed(1), y: +b.y.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1), right: +b.right.toFixed(1), bottom: +b.bottom.toFixed(1), clientH: el.clientHeight, scrollH: el.scrollHeight } };
    const sel = s => { const el = document.querySelector(s); return el ? r(el) : null; };
    const hit = (a, b) => a && b && !(a.right <= b.x || b.right <= a.x || a.bottom <= b.y || b.bottom <= a.y);
    const consoleEl = document.querySelector('.day-console');
    const dlgText = document.getElementById('dlg-text');
    const taskbar = sel('.day-taskbar'), footer = sel('.day-console-footer');
    return {
      dialogue: r(document.getElementById('dialogue')), dlgText: { ...r(dlgText), scrollH: dlgText.scrollHeight },
      console: consoleEl ? { ...r(consoleEl), children: [...consoleEl.children].map(r) } : null,
      workspace: sel('.day-workspace'), desktop: sel('.day-desktop'), taskbar, footer,
      taskbarOverlapsFooter: hit(taskbar, footer)
    };
  });
}
// Keyboard walk following the game's own marked route. Read-only guidance:
// the route itself was marked by a real HUD/console button before calling.
async function walkTo(page, id, kind) {
  const evidence = { input: 'actual-keyboard', id, kind, steps: [], transientOccupancy: [] };
  for (let i = 0; i < 220; i++) {
    const next = await page.evaluate(({ id, kind }) => {
      if (S.inDialog) return { stop: 'dialog' };
      if (S.room) return { stop: 'room', room: { id: S.room.id, x: S.room.x } };
      if (S.nightMode || S.inBattle) throw Error('Floor route lost its input owner');
      const atContact = key => { const p = S.meta.campaignAct1Native && S.meta.campaignAct1Native[key]; return !!p && Math.abs(S.px - p.x) + Math.abs(S.py - p.y) <= 1; };
      if (kind === 'station' ? TechOpsDayWorld.at(id) : atContact(id)) return { stop: 'arrived', at: { px: S.px, py: S.py } };
      const route = TechOpsDayWorld.currentRoute();
      if (!route || !route.ok || !route.target || route.target.id !== id || !route.path || !route.path[1]) throw Error('No marked route step toward ' + id + ': ' + JSON.stringify(route && { ok: route.ok, target: route.target && route.target.id, status: route.status }));
      const to = route.path[1], dx = to.x - S.px, dy = to.y - S.py;
      if (Math.abs(dx) + Math.abs(dy) !== 1 || S.map[to.y][to.x] !== 0 || S.npcs.some(n => n.x === to.x && n.y === to.y)) throw Error('Route step is not a clear adjacent floor tile toward ' + id);
      return { to, key: dx === 1 ? 'ArrowRight' : dx === -1 ? 'ArrowLeft' : dy === 1 ? 'ArrowDown' : 'ArrowUp' };
    }, { id, kind });
    if (next.stop) { evidence.stop = next; return evidence; }
    await page.keyboard.down(next.key);
    let movementError;
    try { await page.waitForFunction(({ x, y }) => S.px === x && S.py === y, next.to, { timeout: 1800 }); }
    catch (error) { movementError = error; }
    finally { await page.keyboard.up(next.key); }
    const observed = await page.evaluate(({ to, key }) => ({
      px: S.px, py: S.py, room: S.room ? S.room.id : null, inDialog: S.inDialog, inBattle: S.inBattle, night: !!S.nightMode,
      targetOccupied: S.npcs.some(n => n.x === to.x && n.y === to.y),
      keyReleased: typeof keys === 'undefined' || !keys[key.toLowerCase()]
    }), next);
    if (movementError) {
      if (observed.targetOccupied && !observed.room && !observed.inDialog && !observed.inBattle && !observed.night) { evidence.transientOccupancy.push({ to: next.to, observed }); continue; }
      throw Error('Keyboard route did not reach its next tile: ' + JSON.stringify({ next, observed }));
    }
    assert.equal(observed.room, null, 'walk remains in the displayed floor scene');
    assert.equal(observed.keyReleased, true, 'route step releases its movement key');
    assert.equal(observed.px, next.to.x, 'actual keyboard movement reached the routed tile (x)');
    assert.equal(observed.py, next.to.y, 'actual keyboard movement reached the routed tile (y)');
    evidence.steps.push({ from: { px: next.to.x - (next.key === 'ArrowRight' ? 1 : next.key === 'ArrowLeft' ? -1 : 0), py: next.to.y - (next.key === 'ArrowDown' ? 1 : next.key === 'ArrowUp' ? -1 : 0) }, to: next.to, key: next.key });
  }
  throw Error('Marked keyboard route exceeded its bounded 220-step budget toward ' + id);
}
async function pressEAndResolveChoose(page, namePattern) {
  await page.keyboard.press('e');
  const choose = page.locator('#dialogue:visible #dlg-name', { hasText: 'CHOOSE' });
  if (await choose.count() && await choose.isVisible()) await page.getByRole('button', { name: namePattern }).first().click();
}
async function holdRoomKey(page, key, predicate, timeout = 9000) {
  await page.keyboard.down(key);
  try { await page.waitForFunction(predicate, null, { timeout }); }
  finally { await page.keyboard.up(key); }
}

try {
  if (!process.env.DAY_PLAYTHROUGH_BASE_URL) server = spawn('python', ['scripts/media_http_server.py', '--port', String(port), '--bind', '127.0.0.1'], { stdio: 'ignore' });
  await waitForServer();
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome'].find(existsSync);
  browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  report.browserVersion = browser.version();
  const context = await browser.newContext({ viewport: { width: profile.width, height: profile.height }, hasTouch: profile.touch, isMobile: profile.touch, reducedMotion: 'reduce' });
  await context.route('**/*', route => {
    if (new URL(route.request().url()).origin === origin) return route.continue();
    blocked.push(route.request().url()); return route.abort();
  });
  const page = await context.newPage();
  page.on('pageerror', error => pageErrors.push(String(error.stack || error)));
  const beat = async (name, data = {}) => { const s = await state(page); beats.push({ name, ...data, state: { px: s.px, py: s.py, room: s.room, inDialog: s.inDialog, objective: s.objective } }); };

  // 1 · Title and morning entry — real buttons only.
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.TechOpsProductionTitleExperience && window.TechOpsProductionTitleExperience.state().ready, null, { timeout: 30000 });
  await page.locator('#btn-start').click();
  await page.locator('#dlg-options button').filter({ hasText: 'Standard' }).click();
  await page.locator('#dlg-options button').filter({ hasText: 'Clock in' }).click();
  await page.waitForFunction(() => window.S && window.S.map && window.TechOpsDayWorld && window.TechOpsDayExperience && window.TechOpsCampaignNativeAct1 && window.TechOpsDayCases, null, { timeout: 15000 });
  report.spawn = await state(page);
  assert.equal(report.spawn.objective.id, 'standup', 'morning objective is the standup');

  // 2 · Mark the standup route with the real HUD button, walk it with arrows.
  report.hudDiagBeforeRoute = await hudDiag(page);
  await page.locator('#day-route-hud [data-day-route]').click();
  report.standupRoute = await page.evaluate(() => { const r = TechOpsDayWorld.currentRoute(); return { ok: r.ok, target: r.target && r.target.id, steps: r.steps }; });
  assert.equal(report.standupRoute.ok, true); assert.equal(report.standupRoute.target, 'standup');
  report.walkToStandup = await walkTo(page, 'standup', 'contact');
  assert.equal(report.walkToStandup.stop.stop, 'dialog', 'standup opens by walking into the office, no E required');
  await beat('standup-opened');

  // 3 · Standup: skip the scripted intro, confirm assignments, route to desk.
  await click(page, 'Skip to assignments');
  await click(page, 'Assign queue: Mike investigates access');
  await click(page, "Walk to Mike's workstation");
  report.afterStandup = await state(page);
  assert.equal(report.afterStandup.flags.standup_completed, true, 'assignments confirm the standup');
  await beat('standup-complete');

  // 4 · Walk to Mike's desk; crossing the IT biome opens the side room for real.
  report.walkToDesk = await walkTo(page, 'mike_desk', 'station');
  assert.equal(report.walkToDesk.stop.stop, 'room', 'walking into the IT department opens the side room');
  await screenshot(page, '02-room-entry');
  const door = await page.waitForFunction(() => window.S.room && S.room.door, null, { timeout: 5000 }).then(h => h.jsonValue());
  if (door === 'right') await holdRoomKey(page, 'a', () => window.S.room && S.room.x <= 0.8);
  else await holdRoomKey(page, 'd', () => window.S.room && S.room.x >= 0.8);
  await beat('side-room-desk');
  await screenshot(page, '03-side-room-desk');
  await page.keyboard.press('e');
  await page.locator('.os-desktop').waitFor({ state: 'visible', timeout: 8000 });
  await beat('workstation-opened', { dialog: await page.locator('#dlg-name').innerText() });

  // 5 · Morning at the desk: muted-continuation music, company profile, clock-in.
  await click(page, 'MUSIC');
  await click(page, 'Continue with music muted');
  report.afterMusic = await state(page);
  assert.equal(report.afterMusic.flags.red_in_mirror_heard, true, 'muted accessibility path still completes the morning beat');
  assert.equal(report.afterMusic.listening.status, 'user_skipped', 'muted continuation is recorded as user_skipped, not playback');
  await screenshot(page, '04-music-muted');
  await click(page, 'Back to desktop');
  await click(page, 'COMPANY');
  await click(page, 'Open Felicia profile');
  await click(page, 'Play People Behind the Flight');
  await page.locator('.day-film-shot').waitFor({ state: 'visible', timeout: 8000 });
  await screenshot(page, '05-company-cutscene');
  await click(page, 'Skip video');
  await click(page, 'CLOCK IN — START DAY SHIFT');
  await click(page, 'Stand up');
  report.afterClockIn = await state(page);
  assert.equal(report.afterClockIn.flags.day_work_unlocked, true, 'clock-in unlocks the day shift');
  assert.equal(report.afterClockIn.flags.felicia_video_watched, true);
  assert.equal(report.afterClockIn.flags.workstation_checked, true);
  await beat('clock-in');

  // 6 · Return to the floor; capture portrait HUD geometry (overlap check).
  await page.keyboard.press('q');
  await page.waitForFunction(() => !S.room, null, { timeout: 5000 });
  report.floorAfterClockIn = await state(page);
  report.hudDiagFloor = await hudDiag(page);
  await screenshot(page, '07-floor-after-clock-in');
  await beat('returned-to-floor');

  // 7 · Shipping investigation: route to the printer, inspect, evidence.
  assert.equal(report.floorAfterClockIn.objective.id, 'shipping_printer', 'first field objective is the Shipping printer');
  await page.locator('#day-route-hud [data-day-route]').click();
  report.printerRoute = await page.evaluate(() => { const r = TechOpsDayWorld.currentRoute(); return { ok: r.ok, target: r.target && r.target.id, steps: r.steps }; });
  assert.equal(report.printerRoute.target, 'shipping_printer');
  report.walkToPrinter = await walkTo(page, 'shipping_printer', 'station');
  assert.equal(report.walkToPrinter.stop.stop, 'arrived', 'keyboard walk reaches the printer approach tile');
  await pressEAndResolveChoose(page, /Shipping label printer/);
  await page.locator('.day-console').waitFor({ state: 'visible', timeout: 8000 });
  await beat('printer-console-opened');
  await page.locator('.day-hotspot[data-value="printer_self_test"]').click();
  report.printerEvidence = await state(page);
  assert.deepEqual(report.printerEvidence.investigations.shipping_cannot_print.evidence, ['printer_self_test']);
  assert.equal(report.printerEvidence.investigations.shipping_cannot_print.activeSurface || 'physical', 'physical');
  await screenshot(page, '09-printer-evidence');
  report.consoleDiagPrinter = await consoleDiag(page);

  // 8 · Walk to the Shipping workstation; local screen diagnosis and repair.
  const beforeRoute = { px: report.printerEvidence.px, py: report.printerEvidence.py };
  await click(page, 'Walk to Shipping workstation');
  const afterRouteClick = await state(page);
  assert.deepEqual({ px: afterRouteClick.px, py: afterRouteClick.py }, beforeRoute, 'route control marks the floor; it never teleports Mike');
  report.walkToWorkstation = await walkTo(page, 'shipping_workstation', 'station');
  assert.equal(report.walkToWorkstation.stop.stop, 'arrived');
  await pressEAndResolveChoose(page, /Shipping workstation/);
  await page.locator('.day-console').waitFor({ state: 'visible', timeout: 8000 });
  await click(page, '02 · Use local screen');
  await beat('workstation-screen-opened');
  report.consoleDiagWorkstation = await consoleDiag(page);
  await screenshot(page, '10-workstation-diagnostics');
  for (const id of ['queue_trace', 'compare_user']) await page.locator(`.day-app-grid [data-day-action="observe"][data-value="${id}"]`).click();
  report.screenEvidence = await state(page);
  assert.deepEqual(report.screenEvidence.investigations.shipping_cannot_print.evidence, ['printer_self_test', 'queue_trace', 'compare_user']);
  await page.locator('[data-day-action="hypothesis"][data-value="permissions"]').click();
  await click(page, 'Apply the supported repair');
  await click(page, 'Run the technical verification');
  report.technical = await state(page);
  assert.equal(report.technical.investigations.shipping_cannot_print.technicalCheckPassed, true);
  assert.equal(!!report.technical.tickets.shipping_cannot_print, false, 'technical success cannot close the human task');
  await screenshot(page, '11-workstation-verified');
  await beat('technical-verified');

  // 9 · Return to the Shipping clerk, witness the real task, close the ticket.
  await click(page, 'Return to requester for verification');
  const afterRequesterRoute = await state(page);
  assert.equal(afterRequesterRoute.inDialog, false, 'requester-route exits the console to the floor');
  report.walkToRequester = await walkTo(page, 'shipping', 'contact');
  assert.equal(report.walkToRequester.stop.stop, 'arrived', 'keyboard walk reaches the Shipping clerk');
  await pressEAndResolveChoose(page, /Shipping clerk/);
  await clickMatch(page, /successful task/);
  await click(page, 'Return to work');
  report.afterVerification = await state(page);
  assert.equal(!!report.afterVerification.tickets.shipping_cannot_print, true, 'requester verification resolves the Shipping ticket');
  await screenshot(page, '12-service-restored');
  await beat('shipping-verified');

  // 10 · Final floor state and HUD geometry.
  report.hudDiagFinal = await hudDiag(page);
  await screenshot(page, '13-floor-final');
  report.beats = beats; report.pageErrors = pageErrors; report.requestsBlocked = blocked;
  assert.deepEqual(pageErrors, [], 'no page errors during the playthrough');
  report.status = 'passed';
  await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ status: report.status, beats: beats.length, steps: { standup: report.walkToStandup.steps.length, desk: report.walkToDesk.steps.length, printer: report.walkToPrinter.steps.length, workstation: report.walkToWorkstation.steps.length, requester: report.walkToRequester.steps.length }, hudFloorOverlaps: report.hudDiagFloor.overlaps, consoleWorkstationOverlap: report.consoleDiagWorkstation.taskbarOverlapsFooter, tickets: report.afterVerification.tickets }, null, 2));
} catch (error) {
  report.status = 'failed';
  report.failure = String(error.stack || error);
  report.beats = report.beats || beats;
  report.pageErrors = pageErrors; report.requestsBlocked = blocked;
  try { await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2)); } catch (_) {}
  console.error(report.failure);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  if (server) server.kill();
}
