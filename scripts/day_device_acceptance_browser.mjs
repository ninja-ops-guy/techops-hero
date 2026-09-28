#!/usr/bin/env node
// Fixture-assisted UI acceptance: production startup and actual incident buttons.
// Explicit coordinate placement and scene entry are NOT an unassisted playthrough.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const port = Number(process.env.DAY_DEVICE_PORT || 4187);
const base = process.env.DAY_DEVICE_BASE_URL || `http://127.0.0.1:${port}/`;
const origin = new URL(base).origin;
const out = process.env.DAY_DEVICE_OUT_DIR || '/tmp/techops-day-device';
const profiles = [
  { id: 'desktop', width: 1280, height: 800, touch: false },
  { id: 'portrait', width: 390, height: 844, touch: true },
  { id: 'compact', width: 320, height: 568, touch: true },
  { id: 'landscape', width: 844, height: 390, touch: true }
].filter(p => !process.env.DAY_DEVICE_PROFILES || process.env.DAY_DEVICE_PROFILES.split(',').includes(p.id));
const report = {
  status: 'running', fixture: true, browser: 'chromium',
  scope: 'Fixture-assisted Day device UI: real New Day, Standard, Clock in and morning choices; declared scene-exit and coordinate fixtures at authored approach tiles. Printer-to-workstation routing is traversed with actual keyboard input; other scene entries remain fixture-assisted. Actual incident buttons drive evidence and case progression. Not a complete unassisted walk, physical-phone certification, or soundtrack playback certification. External requests are blocked; music uses the explicit muted continuation.',
  profiles: []
};
let browser, activePage, server;
await mkdir(out, { recursive: true });

async function waitForServer() {
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(base)).ok) return; } catch (_) {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Day acceptance server unavailable: ${base}`);
}
async function click(page, name) {
  await page.getByRole('button', { name, exact: true }).click({ timeout: 10000 });
}
async function position(page) { return page.evaluate(() => ({ px: S.px, py: S.py })); }
async function caseState(page) {
  return page.evaluate(() => {
    const c = TechOpsCampaign.load(localStorage);
    return { campaignFlags: c.flags, tickets: c.tickets, investigations: c.investigations || {},
      ordinary: S.meta.dayCases || {}, active: TechOpsDayExperience.active(), position: { px: S.px, py: S.py } };
  });
}
async function fixtureAtStation(page, id, open = true) {
  return page.evaluate(({ id, open }) => {
    // This is the declared fixture boundary. It does not manufacture evidence,
    // diagnosis, repair, verification, ticket completion, or progression flags.
    if (S.inDialog) closeDlg();
    const previousRoom = S.room?.id || null;
    if (S.room) {
      if (typeof window.v69ExitRoom !== 'function') throw Error('No production side-room exit is available');
      v69ExitRoom();
    }
    if (!TechOpsDayWorld.ensureWorld()) throw Error('Station world is unavailable');
    const station = TechOpsDayWorld.stations().find(s => s.id === id);
    if (!station?.available || !station.approach) throw Error('No reachable authored approach: ' + id);
    if (S.map[station.approach.y]?.[station.approach.x] !== 0) throw Error('Station approach is not a walkable tile: ' + id);
    S.px = station.approach.x; S.py = station.approach.y;
    if (S.room) throw Error('Floor fixture is still rendered inside a side room');
    if (!TechOpsDayWorld.at(id)) throw Error('Fixture did not reach the physical station: ' + id);
    if (open && !TechOpsDayExperience.openDevice(id)) throw Error('Physical station refused to open: ' + id);
    return { station: id, px: S.px, py: S.py, approach: station.approach, previousRoom, exitEntryPoint: previousRoom ? 'v69ExitRoom fixture before coordinate placement' : null };
  }, { id, open });
}
async function walkMarkedRoute(page, stationId) {
  const evidence = { input: 'actual-keyboard', stationId, steps: [], transientOccupancy: [] };
  for (let i = 0; i < 160; i++) {
    const next = await page.evaluate(id => {
      const before = { px: S.px, py: S.py };
      if (S.room || S.nightMode || S.inDialog || S.inBattle) throw Error('Floor route lost its input owner: ' + JSON.stringify({ room: S.room?.id, night: !!S.nightMode, dialog: S.inDialog, battle: S.inBattle }));
      if (TechOpsDayWorld.at(id)) return { done: true, before };
      const route = TechOpsDayWorld.currentRoute();
      if (!route?.ok || route.target?.id !== id || !route.path?.[1]) throw Error('No marked route step toward ' + id);
      const to = route.path[1], dx = to.x - S.px, dy = to.y - S.py;
      if (Math.abs(dx) + Math.abs(dy) !== 1 || S.map[to.y]?.[to.x] !== 0 || S.npcs.some(n => n.x === to.x && n.y === to.y)) throw Error('Route step is not a clear adjacent floor tile');
      return { before, to, key: dx === 1 ? 'ArrowRight' : dx === -1 ? 'ArrowLeft' : dy === 1 ? 'ArrowDown' : 'ArrowUp' };
    }, stationId);
    if (next.done) { evidence.arrived = next.before; evidence.alreadyAdjacent = evidence.steps.length === 0; return evidence; }
    await page.keyboard.down(next.key);
    let movementError;
    try { await page.waitForFunction(({ x, y }) => S.px === x && S.py === y, next.to, { timeout: 1800 }); }
    catch (error) { movementError = error; }
    finally { await page.keyboard.up(next.key); }
    const observed = await page.evaluate(({ to, key }) => ({
      position: { px: S.px, py: S.py }, room: S.room?.id || null,
      inDialog: S.inDialog, inBattle: S.inBattle, night: !!S.nightMode,
      targetOccupied: S.npcs.some(n => n.x === to.x && n.y === to.y),
      keyReleased: typeof keys === 'undefined' || !keys[key.toLowerCase()]
    }), next);
    if (movementError) {
      // Only an actually observed wandering NPC allows replanning. A wrong
      // scene/input owner or failed movement remains a failure, never a teleport.
      if (observed.targetOccupied && !observed.room && !observed.inDialog && !observed.inBattle && !observed.night && observed.position.px === next.before.px && observed.position.py === next.before.py) {
        evidence.transientOccupancy.push({ ...next, observed }); continue;
      }
      throw Error('Keyboard route did not reach its next tile: ' + JSON.stringify({ ...next, observed }), { cause: movementError });
    }
    assert.equal(observed.room, null, 'walked Shipping route remains in the displayed floor scene');
    assert.equal(observed.keyReleased, true, 'route step releases its movement key');
    assert.deepEqual(observed.position, { px: next.to.x, py: next.to.y }, 'actual keyboard movement reached the routed tile');
    evidence.steps.push({ from: next.before, to: observed.position, key: next.key, collisionChecked: true });
  }
  throw Error('Marked keyboard route exceeded its bounded 160-step budget');
}
async function screenshot(page, id, scene) {
  await page.locator('#dlg-text, .day-workspace, .day-evidence').evaluateAll(nodes => nodes.forEach(el => { el.scrollTop = 0; }));
  await page.screenshot({ path: `${out}/${id}-${scene}.png`, fullPage: true });
}
async function assertConsole(page, label) {
  await page.locator('#dialogue.day-device-mode').waitFor({ state: 'visible' });
  const layout = await page.evaluate(() => {
    const dialog = document.querySelector('#dialogue.day-device-mode'), rect = dialog.getBoundingClientRect();
    const progress = dialog.querySelector('.day-progress');
    return { rect: rect.toJSON(), width: innerWidth, height: innerHeight,
      bodyScrollWidth: document.body.scrollWidth,
      regions: [...dialog.querySelectorAll('.day-console,.day-workspace,.day-main,.day-evidence')].map(el => ({ name: el.className, client: el.clientWidth, scroll: el.scrollWidth })),
      animation: getComputedStyle(dialog).animationName,
      sideRoom: S.room?.id || null,
      roomBannerHidden: !document.querySelector('#v710-card') || getComputedStyle(document.querySelector('#v710-card')).display === 'none',
      progress: progress ? { children: [...progress.children].map(el => el.tagName),
        labels: [...progress.children].map(el => el.textContent),
        nestedCaseContent: progress.querySelectorAll('.day-evidence-item,.day-actions,h3').length,
        actionsOutside: [...dialog.querySelectorAll('.day-actions')].every(el => !progress.contains(el)),
        evidenceOutside: [...dialog.querySelectorAll('.day-evidence-item')].every(el => !progress.contains(el)) } : null,
      diagram: !!dialog.querySelector('svg[role="img"][aria-label]') };
  });
  assert.equal(layout.sideRoom, null, `${label}: physical console belongs to the displayed floor, not hidden side-room coordinates`);
  assert.ok(layout.progress, `${label}: case progression list exists`);
  assert.deepEqual(layout.progress.children, ['LI', 'LI', 'LI', 'LI'], `${label}: progression contains only four direct list items`);
  assert.deepEqual(layout.progress.labels, ['Observe', 'Diagnose', 'Repair', 'Verify']);
  assert.equal(layout.progress.nestedCaseContent, 0, `${label}: evidence and actions cannot be swallowed by the progress row`);
  assert.equal(layout.progress.actionsOutside, true);
  assert.equal(layout.progress.evidenceOutside, true);
  assert.ok(layout.rect.left >= -1 && layout.rect.top >= -1 && layout.rect.right <= layout.width + 1 && layout.rect.bottom <= layout.height + 1, `${label}: console stays within viewport`);
  assert.ok(layout.bodyScrollWidth <= layout.width + 1, `${label}: no document horizontal overflow`);
  for (const region of layout.regions) assert.ok(region.scroll <= region.client + 1, `${label}: ${region.name} must not require horizontal scrolling (${region.scroll}/${region.client})`);
  assert.equal(layout.roomBannerHidden, true, `${label}: room banner must not overlay device controls`);
  assert.equal(layout.animation, 'none', `${label}: reduced motion removes entrance animation`);
  const controls = [], buttons = page.locator('#dialogue.day-device-mode .day-console button');
  for (let i = 0; i < await buttons.count(); i++) {
    const button = buttons.nth(i);
    await button.scrollIntoViewIfNeeded();
    const control = await button.evaluate(el => {
      const r = el.getBoundingClientRect(), hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return { action: el.dataset.dayAction, value: el.dataset.value || '', label: el.getAttribute('aria-label') || el.textContent,
        width: r.width, height: r.height, hit: hit === el || el.contains(hit) };
    });
    assert.ok(control.width >= 43.9 && control.height >= 43.9, `${label}: 44px target: ${JSON.stringify(control)}`);
    assert.equal(control.hit, true, `${label}: unobscured button center: ${control.label}`);
    controls.push(control);
  }
  return { ...layout, controls };
}
async function morningOpening(page, result) {
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.TechOpsProductionTitleExperience?.state().ready, null, { timeout: 30000 });
  await page.locator('#btn-start').click();
  await page.locator('#dlg-options button').filter({ hasText: 'Standard' }).click();
  await page.locator('#dlg-options button').filter({ hasText: 'Clock in' }).click();
  await page.waitForFunction(() => window.S?.map && window.TechOpsDayWorld && window.TechOpsDayExperience && window.TechOpsCampaignNativeAct1 && window.TechOpsDayCases);
  await page.evaluate(() => {
    if (S.inDialog) closeDlg();
    if (S.room) v69ExitRoom();
    TechOpsCampaignNativeAct1.ensureWorld(); TechOpsDayWorld.ensureWorld();
    const contact = TechOpsDayWorld.contact('standup');
    const approach = [[0, 1], [-1, 0], [1, 0], [0, -1]].map(([x, y]) => ({ x: contact.x + x, y: contact.y + y }))
      .find(p => S.map[p.y]?.[p.x] === 0 && !S.npcs.some(n => n.x === p.x && n.y === p.y));
    if (!approach) throw Error('Standup has no clear fixture approach');
    S.px = approach.x; S.py = approach.y;
    TechOpsCampaignNativeAct1.openStandup();
  });
  await click(page, 'Assign queue: Mike investigates access');
  await click(page, "Walk to Mike's workstation");
  result.deskFixture = await fixtureAtStation(page, 'mike_desk');
  await page.locator('.os-desktop').waitFor({state:'visible'});
  await screenshot(page, result.id, 'simulated-desktop');
  await click(page, 'Maximize window');
  assert.equal(await page.locator('.os-window.os-maximized').count(),1);
  await click(page, 'Minimize window');
  assert.equal(await page.locator('.os-window').isVisible(),false);
  await click(page, 'Show desktop');
  await click(page, 'MUSIC');
  await click(page, 'Continue with music muted');
  await click(page, 'Back to desktop');
  await click(page, 'COMPANY');
  await click(page, 'Open Felicia profile');
  await click(page, 'Play People Behind the Flight');
  await page.locator('.day-film-shot').waitFor({state:'visible'});
  await screenshot(page, result.id, 'company-cutscene');
  await click(page, 'Skip video');
  await click(page, 'CLOCK IN — START DAY SHIFT');
  await click(page, 'Stand up');
  result.opening = await page.evaluate(() => {
    const c = TechOpsCampaign.load(localStorage);
    return { unlocked: c.flags.day_work_unlocked, listening: c.morningListening, tickets: c.tickets, stations: TechOpsDayWorld.stations().map(s => ({ id: s.id, available: s.available })) };
  });
  assert.equal(result.opening.unlocked, true);
  assert.equal(result.opening.listening.status, 'user_skipped', 'blocked external soundtrack is never certified as heard');
  assert.equal(result.opening.listening.userSkipped, true);
  assert.equal(!!result.opening.tickets.shipping_cannot_print, false);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  result.floorScene = await page.evaluate(() => ({ room: S.room?.id || null, position: { px: S.px, py: S.py } }));
  if (result.floorScene.room) {
    await page.keyboard.press('q');
    await page.waitForFunction(() => !S.room);
    result.floorScene.exitInput = 'Q';
  }
  assert.equal(await page.evaluate(() => !!S.room), false, 'floor screenshot cannot show a side-room overlay');
  await screenshot(page, result.id, 'floor');
  result.officeInteractions = await page.evaluate(() => {
    const desk = TechOpsDayWorld.stations().find(x => x.id === 'mike_desk');
    if(desk.x !== MIKE_DESK.x || desk.y !== MIKE_DESK.y || !desk.authored) throw Error('Duplicate or relocated Mike desk');
    const results=[];
    for(const npc of COWORKERS){
      if(S.inDialog)closeDlg();if(S.room)v69ExitRoom();
      const p=[[0,1],[-1,0],[1,0],[0,-1]].map(([x,y])=>({x:npc.x+x,y:npc.y+y})).find(p=>S.map[p.y]?.[p.x]===0&&!S.npcs.some(n=>n.x===p.x&&n.y===p.y)&&!COWORKERS.some(n=>n.x===p.x&&n.y===p.y));
      if(!p)throw Error('Coworker cannot be reached: '+npc.name);
      S.px=p.x;S.py=p.y;S.meta.dayRouteTarget='mike_desk';interact();
      if(document.getElementById('dlg-name').textContent.includes('CHOOSE')){
        const b=Array.from(document.querySelectorAll('#dlg-options button')).find(b=>b.textContent==='Talk to '+npc.name);if(!b)throw Error('Missing NPC choice '+npc.name);b.click();
      }
      const title=document.getElementById('dlg-name').textContent;
      if(/WORKSTATION|MIKE.*DESK/.test(title))throw Error('NPC opened workstation: '+npc.name);
      if(!title.toUpperCase().includes(npc.name.toUpperCase()))throw Error('Wrong speaker: '+title);
      results.push({npc:npc.name,title});
    }
    closeDlg();return results;
  });

}

try {
  if (!profiles.length) throw Error('DAY_DEVICE_PROFILES selected no profiles');
  if (!process.env.DAY_DEVICE_BASE_URL) server = spawn('python3', ['scripts/media_http_server.py', '--port', String(port), '--bind', '127.0.0.1'], { stdio: 'ignore' });
  await waitForServer();
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome'].find(existsSync);
  browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  report.browserVersion = browser.version();
  for (const profile of profiles) {
    const result = { id: profile.id, viewport: { width: profile.width, height: profile.height }, checks: [], pageErrors: [], requestsBlocked: [] };
    report.profiles.push(result);
    const context = await browser.newContext({ viewport: result.viewport, hasTouch: profile.touch, isMobile: profile.touch, reducedMotion: 'reduce' });
    await context.route('**/*', route => {
      if (new URL(route.request().url()).origin === origin) return route.continue();
      result.requestsBlocked.push(route.request().url()); return route.abort();
    });
    const page = await context.newPage(); activePage = page;
    page.on('pageerror', error => result.pageErrors.push(String(error.stack || error)));
    try {
      await morningOpening(page, result);
      result.checks.push('Real title and morning controls unlock Day; muted continuation is recorded explicitly');
      result.offDevice = await page.evaluate(() => {
        closeDlg();
        if (S.room) v69ExitRoom();
        const stations = TechOpsDayWorld.stations(); let found;
        for (let y = 0; y < S.map.length && !found; y++) for (let x = 0; x < S.map[y].length; x++) {
          if (S.map[y][x] === 0 && stations.every(s => Math.abs(x - s.x) + Math.abs(y - s.y) > 2) && !S.npcs.some(n => n.x === x && n.y === y)) { found = { x, y }; break; }
        }
        if (!found) throw Error('No off-device fixture tile');
        S.px = found.x; S.py = found.y;
        const before = { px: S.px, py: S.py }, openDevice = TechOpsDayExperience.openDevice('shipping_workstation');
        const workstation = TechOpsCampaignNativeAct1.openWorkstation();
        return { before, after: { px: S.px, py: S.py }, openDevice, workstation, active: TechOpsDayExperience.active(), inDialog: S.inDialog };
      });
      assert.equal(result.offDevice.openDevice, false); assert.equal(result.offDevice.workstation, false);
      assert.equal(result.offDevice.active, null); assert.equal(result.offDevice.inDialog, false);
      assert.deepEqual(result.offDevice.after, result.offDevice.before);
      result.checks.push('Remote device and workstation entry are rejected without teleporting');

      result.printerFixture = await fixtureAtStation(page, 'shipping_printer');
      result.printerLayout = await assertConsole(page, `${profile.id} printer`);
      assert.equal(result.printerLayout.diagram, true);
      assert.equal(await page.locator('.day-stage-nav [data-day-action="screen"]').count(), 0, 'printer hardware has no remote desktop tab');
      await page.locator('.day-hotspot[data-value="printer_self_test"]').click();
      result.printerEvidence = await caseState(page);
      assert.deepEqual(result.printerEvidence.investigations.shipping_cannot_print.evidence, ['printer_self_test']);
      assert.equal(result.printerEvidence.active.surface, 'physical');
      assert.match(await page.locator('.day-observation').innerText(), /local self-test|print engine/i);
      await screenshot(page, profile.id, 'printer-inspection');
      const beforeRoute = await position(page);
      await click(page, 'Walk to Shipping workstation');
      assert.deepEqual(await position(page), beforeRoute, 'route control marks the floor; it never teleports Mike');
      result.route = await page.evaluate(() => TechOpsDayWorld.currentRoute());
      assert.equal(result.route.ok, true); assert.equal(result.route.target.id, 'shipping_workstation');
      assert.equal(await page.evaluate(() => S.inDialog), false);
      result.checks.push('Printer hotspot records physical evidence and the workstation route preserves position');

      result.workstationWalk = await walkMarkedRoute(page, 'shipping_workstation');
      const walkedArrival = await position(page);
      assert.equal(await page.evaluate(() => TechOpsDayExperience.openDevice('shipping_workstation')), true, 'open the workstation from the walked arrival tile');
      assert.deepEqual(await position(page), walkedArrival, 'opening the workstation cannot teleport after actual walking');
      result.checks.push(result.workstationWalk.alreadyAdjacent ? 'Printer exit was already adjacent to the workstation; no walking or teleportation claimed' : 'Marked printer-to-workstation route traversed with actual keyboard movement and collision checks');
      await click(page, '02 · Use local screen');
      result.desktopLayout = await assertConsole(page, `${profile.id} desktop`);
      assert.equal(await page.locator('.day-desktop').count(), 1);
      for (const id of ['queue_trace', 'compare_user']) await page.locator(`.day-app-grid [data-day-action="observe"][data-value="${id}"]`).click();
      result.screenEvidence = await caseState(page);
      assert.deepEqual(result.screenEvidence.investigations.shipping_cannot_print.evidence, ['printer_self_test', 'queue_trace', 'compare_user']);
      assert.equal(result.screenEvidence.active.surface, 'screen');
      await screenshot(page, profile.id, 'workstation-diagnostics');
      await page.locator('[data-day-action="hypothesis"][data-value="permissions"]').click();
      await click(page, 'Apply the supported repair');
      await click(page, 'Run the technical verification');
      result.technicalOnly = await caseState(page);
      assert.equal(result.technicalOnly.investigations.shipping_cannot_print.technicalCheckPassed, true);
      assert.equal(!!result.technicalOnly.tickets.shipping_cannot_print, false, 'technical success cannot close the human task');
      const beforeExit = await position(page);
      await click(page, 'Return to floor');
      assert.deepEqual(await position(page), beforeExit, 'return to floor restores exact player coordinates');
      assert.equal(await page.evaluate(() => S.inDialog), false);
      result.checks.push('Local screen tools drive diagnosis and technical verification; human closure stays open; exit preserves coordinates');

      const canonicalBefore = await page.evaluate(() => TechOpsCampaign.load(localStorage));
      result.laptopFixture = await fixtureAtStation(page, 'laptop_dock_link');
      for (const id of ['dock_power', 'upstream_cable']) await page.locator(`.day-hotspot[data-value="${id}"]`).click();
      await click(page, '02 · Use local screen');
      await page.locator('.day-app-grid [data-value="device_inventory"]').click();
      await page.locator('[data-day-action="hypothesis"][data-value="display_failure"]').click();
      assert.equal((await caseState(page)).ordinary.laptop_dock_link.fixApplied, false, 'wrong explanation does not repair the device');
      await page.locator('[data-day-action="hypothesis"][data-value="upstream_disconnected"]').click();
      await click(page, '01 · Inspect equipment');
      await click(page, 'Confirm the agreed change window');
      await click(page, 'Apply the supported repair');
      await click(page, '02 · Use local screen');
      await click(page, 'Run the technical verification');
      result.optionalTechnicalOnly = (await caseState(page)).ordinary.laptop_dock_link;
      assert.equal(result.optionalTechnicalOnly.requesterVerified, false);
      assert.equal(result.optionalTechnicalOnly.phase, 'requester');
      await click(page, 'Ask Design engineer to perform the task here');
      result.optionalComplete = (await caseState(page)).ordinary.laptop_dock_link;
      assert.equal(result.optionalComplete.phase, 'complete');
      assert.equal(result.optionalComplete.requesterVerified, true);
      assert.deepEqual(await page.evaluate(() => TechOpsCampaign.load(localStorage)), canonicalBefore, 'ordinary device completion never advances the authored campaign');
      await screenshot(page, profile.id, 'laptop-verified');
      const laptopExit = await position(page); await page.keyboard.press('Escape');
      assert.deepEqual(await position(page), laptopExit);
      assert.equal(await page.evaluate(() => TechOpsDayExperience.active()), null);
      result.checks.push('Optional laptop case completes through evidence, rejected hypothesis, consent, repair and two verification stages without story changes');
      assert.deepEqual(result.pageErrors, []);
      result.status = 'passed';
    } catch (error) {
      result.status = 'failed'; result.failure = String(error.stack || error);
      result.failureState = await caseState(page).catch(() => null);
      await page.screenshot({ path: `${out}/${profile.id}-failure.png`, fullPage: true }).catch(() => {});
      throw error;
    } finally { await context.close(); activePage = null; }
  }
  report.status = 'passed';
} catch (error) {
  report.status = browser ? 'failed' : 'blocked';
  report.failure = String(error.stack || error); process.exitCode = 1;
  if (activePage && !activePage.isClosed()) await activePage.screenshot({ path: `${out}/failure.png`, fullPage: true }).catch(() => {});
} finally {
  if (browser) await browser.close();
  if (server) server.kill();
  await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
}
