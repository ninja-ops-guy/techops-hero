#!/usr/bin/env node
// Fixture-assisted UI acceptance: production startup and actual incident buttons.
// Explicit coordinate placement and scene entry are NOT an unassisted playthrough.
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { openApp, inspectDesktop, traceLabels, repairQueue } from './lib/doors_workstation.mjs';

const port = Number(process.env.DAY_DEVICE_PORT || 4187);
const base = process.env.DAY_DEVICE_BASE_URL || `http://127.0.0.1:${port}/`;
const origin = new URL(base).origin;
const out = process.env.DAY_DEVICE_OUT_DIR || '/tmp/techops-day-device';
const profiles = [
  { id: 'desktop', width: 1280, height: 800, touch: false, reducedMotion: 'reduce' },
  { id: 'portrait', width: 390, height: 844, touch: true, reducedMotion: 'reduce' },
  { id: 'compact', width: 320, height: 568, touch: true, reducedMotion: 'reduce' },
  { id: 'landscape', width: 844, height: 390, touch: true, reducedMotion: 'reduce' },
  { id: 'desktop-motion', width: 1280, height: 800, touch: false, reducedMotion: 'no-preference' }
].filter(p => !process.env.DAY_DEVICE_PROFILES || process.env.DAY_DEVICE_PROFILES.split(',').includes(p.id));
const sourcePaths = [
  'index.html', 'campaign_world_visuals.js', 'runtime_day.js', 'runtime_day_prompt.js', 'runtime_day.css', 'runtime_day_doors.js', 'runtime_day_doors.css',
  'runtime_day_plating.js', 'runtime_day_plating.css', 'runtime_day_security.js', 'runtime_day_security.css',
  'runtime_day_world.js', 'campaign_act1.js', 'campaign_act1_investigations.js', 'campaign_native_act1.js',
  'scripts/day_device_acceptance_browser.mjs', 'scripts/day_device_playthrough_browser.mjs', 'scripts/lib/doors_workstation.mjs', 'test_campaign_world_visuals.js',
  '.github/workflows/day-device-experience.yml'
];
async function sourceIdentity() {
  const hashes = Object.fromEntries(await Promise.all(sourcePaths.map(async file =>
    [file, createHash('sha256').update(await readFile(file)).digest('hex')])));
  return { head: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    tree: execFileSync('git', ['rev-parse', 'HEAD^{tree}'], { encoding: 'utf8' }).trim(),
    runId: process.env.GITHUB_RUN_ID || null, runAttempt: process.env.GITHUB_RUN_ATTEMPT || null, hashes };
}
const report = {
  status: 'running', fixture: true, browser: 'chromium',
  scope: 'Fixture-assisted Day device UI: real New Day, Standard, Clock in and morning choices; declared scene-exit and coordinate fixtures at authored approach tiles. Printer-to-workstation routing is traversed with actual keyboard input; other scene entries remain fixture-assisted. Actual incident buttons drive evidence and case progression. Not a complete unassisted walk, physical-phone certification, or soundtrack playback certification. External requests are blocked; music mapping is verified against a stubbed playlist widget (recorded track id must match the playlist Red in the Mirror entry) while audible playback stays uncertified.',
  profiles: [], sourceBefore: null, sourceAfter: null, sourceUnchanged: false
};
let browser, activePage, server;
await mkdir(out, { recursive: true });

async function waitForServer() {
  for (let i = 0; i < 100; i++) {
    try { const res = await fetch(base); await res.arrayBuffer(); if (res.ok) return; } catch (_) {}
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
async function assertBatchGeometry(page, label, selector = '.doors-field', focusedPrompt = false) {
  const surface = page.locator(selector);
  await surface.waitFor({ state: 'visible' });
  const bounds = await surface.evaluate(el => {
    function rect(node) { const r = node.getBoundingClientRect(); return { x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height }; }
    function visible(node) { return node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden'; }
    const windows = [...el.querySelectorAll('.os-window,.doors-window')].filter(visible);
    return { ...rect(el), viewport: { width: innerWidth, height: innerHeight }, documentWidth: document.body.scrollWidth,
      surfaceScrollLeft: el.scrollLeft, surfaceClient: el.clientWidth, surfaceScroll: el.scrollWidth,
      windows: windows.map(node => ({ name: node.className, ...rect(node), scrollLeft:node.scrollLeft })),
      regions: [...el.querySelectorAll('.os-content,.doors-pane,.doors-properties,.doors-terminal,.doors-terminal form,[data-plating-session],.doors-security')].filter(visible)
        .map(node => ({ name: node.className || node.tagName, client: node.clientWidth, scroll: node.scrollWidth, scrollLeft: node.scrollLeft, ...rect(node) })),
      prompt: [...el.querySelectorAll('.doors-terminal h1,.doors-terminal form,.doors-terminal input')].filter(visible)
        .map(node => ({ name: node.tagName, ...rect(node), client:node.clientWidth,scroll:node.scrollWidth,
          focused: node === document.activeElement, parent: rect(node.closest('.os-window')) })) };
  });
  const withinViewport = r => r.x >= -1 && r.y >= -1 && r.right <= bounds.viewport.width+1 && r.bottom <= bounds.viewport.height+1;
  assert.ok(withinViewport(bounds), label + ' surface fits viewport: ' + JSON.stringify(bounds));
  assert.ok(bounds.documentWidth <= bounds.viewport.width + 1, label + ' does not cause page horizontal overflow');
  assert.equal(bounds.surfaceScrollLeft, 0, label + ' surface has no hidden horizontal scroll');
  assert.ok(bounds.surfaceScroll <= bounds.surfaceClient+1, label + ' surface contents fit horizontally: ' + JSON.stringify(bounds));
  for (const window of bounds.windows) {
    assert.ok(withinViewport(window), label + ' actual window fits viewport: ' + JSON.stringify(window));
    assert.ok(window.x >= bounds.x-1 && window.right <= bounds.right+1 && window.y >= bounds.y-1 && window.bottom <= bounds.bottom+1,
      label + ' actual window fits desktop: ' + JSON.stringify(window));
    assert.equal(window.scrollLeft,0,label + ' window has no hidden horizontal scroll');
  }
  for (const region of bounds.regions) {
    assert.ok(region.scroll <= region.client+1, label + ' fits horizontally: ' + JSON.stringify(region));
    assert.equal(region.scrollLeft,0,label + ' content has no hidden horizontal scroll: ' + region.name);
    assert.ok(region.x >= -1 && region.right <= bounds.viewport.width+1, label + ' nested content is horizontally visible: ' + JSON.stringify(region));
  }
  for (const node of bounds.prompt) {
    assert.ok(node.x >= -1 && node.right <= bounds.viewport.width+1 && node.x >= node.parent.x-1 && node.right <= node.parent.right+1,
      label + ' Prompt text/input is horizontally visible: ' + JSON.stringify(node));
    if (node.name==='H1') assert.ok(node.scroll <= node.client+1, label + ' Prompt heading is not cropped');
    if (focusedPrompt && node.name==='INPUT') {
      assert.equal(node.focused,true,label + ' Prompt input retains focus');
      assert.ok(withinViewport(node),label + ' focused Prompt input remains in viewport: ' + JSON.stringify(node));
      assert.ok(node.width>=44 && node.height>=44,label + ' focused Prompt input remains usable');
    }
  }
  return bounds;
}
async function assertBatchLayout(page, label, selector = '.doors-field') {
  const bounds = await assertBatchGeometry(page,label,selector);
  const buttons = page.locator(selector).locator('button:visible:not(:disabled)');
  for (const button of await buttons.all()) {
    await button.scrollIntoViewIfNeeded();
    await assertBatchGeometry(page,label+' after control scroll',selector);
    const b = await button.evaluate(el => {
      const r = el.getBoundingClientRect(), hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return { label: el.getAttribute('aria-label') || el.textContent, width: r.width, height: r.height, hit: el.contains(hit) };
    });
    assert.ok(b.width >= 43.9 && b.height >= 43.9, label + ' has 44px controls: ' + JSON.stringify(b));
    assert.ok(b.hit, label + ' unobscured control: ' + b.label);
  }
  return bounds;
}
async function failureGeometry(page) {
  return page.evaluate(() => ({ viewport: { width:innerWidth,height:innerHeight },
    nodes: [...document.querySelectorAll('.os-desktop,.os-window,.os-content,.os-taskbar,.os-taskbar > *,.doors-field,.doors-window,.doors-pane')]
      .filter(el=>el.getClientRects().length).map(el=>{
        const r=el.getBoundingClientRect(),s=getComputedStyle(el);
        return { name:el.className||el.tagName, label:el.getAttribute('aria-label')||el.textContent.slice(0,90),
          x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height,
          clientWidth:el.clientWidth,scrollWidth:el.scrollWidth,scrollLeft:el.scrollLeft,
          display:s.display,position:s.position,flex:s.flex,minWidth:s.minWidth,maxWidth:s.maxWidth,overflowX:s.overflowX };
      }) }));
}
async function keyboardTrap(page) {
  const focusable = page.locator('#dlg-text button:visible:not(:disabled),#dlg-text input:visible:not(:disabled)');
  await focusable.first().focus();
  await page.keyboard.press('Shift+Tab');
  assert.ok(await focusable.last().evaluate(el => document.activeElement === el), 'Shift+Tab wraps to last desktop control');
  await page.keyboard.press('Tab');
  assert.ok(await focusable.first().evaluate(el => document.activeElement === el), 'Tab wraps to first desktop control');
}
async function fixtureAtRequester(page, ticketId) {
  return page.evaluate(ticketId => {
    // Declared approach-only fixture: the real requester dialog and button
    // must witness the task. No record, evidence or outcome is manufactured.
    if (S.inDialog) closeDlg();
    if (S.room) v69ExitRoom();
    const id = ticketId === 'plating_workstation_down' ? 'plating' : 'shipping';
    const contact = TechOpsDayWorld.contact(id);
    if (!contact) throw Error('Missing authored requester ' + id);
    const p = [[0,1],[-1,0],[1,0],[0,-1]].map(([x,y])=>({x:contact.x+x,y:contact.y+y}))
      .find(p=>S.map[p.y]?.[p.x]===0 && !S.npcs.some(n=>n.x===p.x&&n.y===p.y));
    if (!p) throw Error('No walkable requester approach ' + id);
    S.px=p.x; S.py=p.y;
    if (!TechOpsDayExperience.talk(ticketId)) throw Error('Requester refused physical approach ' + id);
    return { id, position: p, contact: { x: contact.x, y: contact.y } };
  }, ticketId);
}
async function screenshot(page, id, scene) {
  await page.locator('#dlg-text, .day-workspace, .day-evidence, .doors-pane, .os-content').evaluateAll(nodes => nodes.forEach(el => { el.scrollTop = 0; }));
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
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
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
  if (layout.reducedMotion) assert.equal(layout.animation, 'none', `${label}: reduced motion removes entrance animation`);
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
async function morningOpening(page, result, reducedMotion) {
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
    S.room={id:'itdept',key:ROOM_OF_BIOME.itdept,x:.12,door:'left',back:{px:S.px,py:S.py}};
    TechOpsDayExperience.syncHud(); // real entry-trigger owner; no openStandup call
  });
  await page.getByRole('button',{name:'Skip to assignments',exact:true}).waitFor();
  await screenshot(page,result.id,'entry-standup');
  await click(page,'Skip to assignments');
  await click(page, 'Assign queue: Mike investigates access');
  await click(page, "Walk to Mike's workstation");
  await page.keyboard.down('d');
  try{await page.waitForFunction(()=>S.room&&S.room.x>=.78,null,{timeout:8000});}finally{await page.keyboard.up('d');}
  await screenshot(page,result.id,'side-room-desk');
  await page.keyboard.press('e');
  result.deskFixture={scene:'itdept',input:'actual keyboard walk to visible side-room desk'};
  await page.locator('.os-desktop').waitFor({state:'visible'});
  await screenshot(page, result.id, 'simulated-desktop');
  await click(page, 'Maximize window');
  assert.equal(await page.locator('.os-window.os-maximized').count(),1);
  await click(page, 'Minimize window');
  assert.equal(await page.locator('.os-window').isVisible(),false);
  await click(page, 'Restore current application');
  assert.equal(await page.locator('.os-window').isVisible(), true);
  await click(page, 'Show desktop');
  await click(page, 'PROMPT');
  const command = page.getByRole('textbox', { name: 'Command', exact: true });
  await command.fill('hostname'); await command.press('Enter');
  await page.getByRole('log').getByText(/MIKE-WS/).waitFor();
  await command.fill('<img src=x onerror=alert(1)>'); await click(page, 'Run');
  assert.equal(await page.locator('.doors-terminal img').count(), 0);
  assert.ok(await page.locator('.doors-terminal [data-kind=input]').count(), 'Prompt distinguishes typed input');
  assert.ok(await page.locator('.doors-terminal [data-kind=output]').count(), 'Prompt distinguishes command output');
  assert.ok(await page.locator('.doors-terminal [data-kind=error]').count(), 'Prompt distinguishes command errors');
  await page.getByRole('log').getByText(/Unknown command/).waitFor();
  assert.match(await page.getByRole('log').innerText(), /<img src=x onerror=alert\(1\)>/, 'command is displayed literally');
  assert.ok(await command.evaluate(el => document.activeElement === el), 'Prompt returns focus after Run');
  result.promptLayout = await assertBatchLayout(page, result.id + ' Prompt', '.os-desktop');
  await keyboardTrap(page);
  await command.fill('cls'); await command.press('Enter');
  assert.equal((await page.getByRole('log').innerText()).trim(), '', 'cls clears displayed history');
  await command.fill('whoami'); await command.press('Enter');
  await page.getByRole('log').getByText(/AEROTECH \/ Mike/).waitFor();
  result.promptFocusedGeometry = await assertBatchGeometry(page, result.id + ' focused Prompt', '.os-desktop', true);
  await screenshot(page, result.id, 'prompt');
  await command.fill('open music'); await command.press('Enter');
  await page.getByRole('button', {name:'Play Red in the Mirror', exact:true}).waitFor();
  // Red in the Mirror mapping, metadata level: external soundtrack requests
  // are blocked, so drive the real MUSIC flow against a stub widget whose
  // playlist carries a decoy track before the real entry. The capture asserts
  // the requested/recorded track id matches the playlist "Red in the Mirror"
  // entry; audible playback stays uncertified in this environment.
  await page.evaluate(() => {
    window.__a1Playlist = [
      { id: 9, title: 'Warehouse Lights', permalink_url: 'https://soundcloud.com/ops-day/warehouse-lights' },
      { id: 7, title: 'Red in the Mirror', permalink_url: 'https://soundcloud.com/ops-day/red-in-the-mirror' }
    ];
    // game.js keeps scWidget/scReady as top-level let bindings, so assigning
    // window.scWidget cannot be seen by the runtime. Model the integration
    // surface instead: a soundcloud-looking iframe src plus an SC.Widget
    // factory the real initMusic()/widget() path picks up, with a playlist
    // that carries a decoy track before the real entry.
    const frame = document.getElementById('sc-widget');
    if (frame && frame.dataset.src) frame.setAttribute('src', frame.dataset.src);
    const handlers = {}; let current = null;
    window.__a1Trace = [];
    const trace = step => { window.__a1Trace.push(step); };
    window.__a1Errors = [];
    window.addEventListener('error', e => window.__a1Errors.push('error:' + String(e.message)));
    window.addEventListener('unhandledrejection', e => window.__a1Errors.push('rejection:' + String(e.reason && e.reason.message || e.reason)));
    const stub = {
      bind: (event, cb) => {
        try {
          trace('bind:' + String(event));
          handlers[event] = cb;
          if (event === 'ready') cb();
        } catch (err) { trace('bind-throw:' + String(err && err.message)); throw err; }
      },
      getSounds: cb => {
        trace('getSounds');
        setTimeout(() => {
          try {
            const list = window.__a1Playlist.map(t => Object.assign({}, t));
            trace('sounds-index:' + list.findIndex(s => /red\s+in\s+the\s+mirror/i.test(String(s.title || ''))));
            cb(list);
          } catch (err) { trace('sounds-throw:' + String(err && err.message)); }
        }, 30);
      },
      getCurrentSound: cb => { trace('getCurrentSound'); setTimeout(() => cb(current), 30); },
      skip: index => { trace('skip:' + index); current = window.__a1Playlist[index]; if (handlers.play) handlers.play(); },
      setVolume: () => {}, pause: () => { trace('pause'); }, play: () => { trace('play'); if (handlers.play) handlers.play(); },
      getVolume: cb => cb(50)
    };
    // SoundCloud exposes Events on the SC.Widget constructor itself; both
    // game.js and runtime_day_audio.js read SC.Widget.Events.
    const widgetFn = () => { trace('widget-factory'); return stub; };
    widgetFn.Events = { PLAY: 'play', READY: 'ready', ERROR: 'error' };
    window.SC = { Widget: widgetFn };
    const origPlay = window.TechOpsDayAudio && window.TechOpsDayAudio.playMorningTrack;
    if (origPlay) window.TechOpsDayAudio.playMorningTrack = opts => Promise.resolve(origPlay(opts)).then(r => { trace('resolve:' + JSON.stringify(r)); return r; });
    trace('stub-installed SC=' + (typeof window.SC));
  });
  await click(page, 'Play Red in the Mirror');
  await page.waitForFunction(() => TechOpsCampaign.load(localStorage).flags.red_in_mirror_heard === true, null, { timeout: 8000 }).catch(async (e) => {
    const diag = await page.evaluate(() => ({
      playback: window.TechOpsDayAudio && TechOpsDayAudio.diagnostics().playback,
      dlg: document.getElementById('dlg-name') && document.getElementById('dlg-name').textContent,
      scWidget: typeof scWidget === 'undefined' ? 'undef' : (scWidget ? 'set' : 'null'),
      scReady: typeof scReady === 'undefined' ? 'undef' : scReady,
      trace: window.__a1Trace || [],
      pageErrors: window.__a1Errors || [],
      dlgText: document.getElementById('dlg-text') && document.getElementById('dlg-text').textContent.slice(0, 160)
    }));
    throw new Error('red_in_mirror_heard timeout: ' + JSON.stringify(diag));
  });
  result.musicMapping = await page.evaluate(() => {
    const entry = window.__a1Playlist.find(t => /red\s+in\s+the\s+mirror/i.test(t.title));
    const c = TechOpsCampaign.load(localStorage);
    return { playlistEntryId: entry.id, playlistEntryTitle: entry.title, status: c.morningListening.status, trackId: c.morningListening.trackId, title: c.morningListening.title, source: c.morningListening.source };
  });
  assert.equal(result.musicMapping.status, 'playing', 'stubbed playlist confirms playback through the real flow');
  assert.equal(result.musicMapping.trackId, result.musicMapping.playlistEntryId, 'requested track id matches the playlist Red in the Mirror entry');
  assert.equal(result.musicMapping.title, result.musicMapping.playlistEntryTitle, 'recorded title is the playlist entry title');
  await click(page, 'Back to desktop');
  await click(page, 'COMPANY');
  await click(page, 'Open Felicia profile');
  await click(page, 'Play People Behind the Flight');
  await page.locator('.day-film-shot').waitFor({state:'visible'});
  result.companyFilm = await page.evaluate(() => ({ alt: document.querySelector('.day-film-shot img')?.getAttribute('alt'), caption: document.querySelector('.day-film-caption')?.textContent, reducedHint: document.querySelector('.day-film-note')?.textContent }));
  assert.equal(result.companyFilm.alt, '', 'company film uses its caption as the single text alternative');
  assert.match(result.companyFilm.caption, /FIELD SYSTEMS/i);
  if (reducedMotion) {
    assert.match(result.companyFilm.reducedHint, /Next shot/i);
    await page.waitForTimeout(900);
    assert.match(await page.locator('.day-film-caption').innerText(), /FIELD SYSTEMS/i, 'reduced-motion film holds for explicit input');
  } else {
    assert.equal(result.companyFilm.reducedHint, undefined, 'ordinary motion does not show reduced-motion guidance');
    await page.waitForFunction(() => /FELICIA \/ SECURITY RESEARCH/i.test(document.querySelector('.day-film-caption')?.textContent || ''), null, { timeout: 5000 });
    result.companyFilm.automaticAdvance = await page.locator('.day-film-caption').innerText();
  }
  await screenshot(page, result.id, 'company-cutscene');
  await click(page, 'Skip video');
  await click(page, 'CLOCK IN — START DAY SHIFT');
  await page.locator('.day-film-shot.handoff').waitFor({state:'visible'});
  const firstHandoff = await page.locator('.day-film-caption').innerText();
  assert.match(firstHandoff, /RETURN TO THE FLOOR/i);
  if (reducedMotion) {
    await page.waitForTimeout(1750);
    const heldHandoff = await page.locator('.day-film-caption').innerText();
    assert.match(heldHandoff, /09:00 \/ NEW HAVEN/i, 'reduced-motion handoff waits for explicit input');
    await click(page, 'Next shot');
  } else {
    await page.waitForFunction(() => /DAY SHIFT \/ HANDOFF/i.test(document.querySelector('.day-film-caption')?.textContent || ''), null, { timeout: 3000 });
  }
  const secondHandoff = await page.locator('.day-film-caption').innerText();
  assert.match(secondHandoff, /DAY SHIFT \/ HANDOFF/i);
  result.shiftHandoff = { mode: reducedMotion ? 'manual' : 'automatic', first: firstHandoff, second: secondHandoff };
  await click(page, 'Stand up');
  result.opening = await page.evaluate(() => {
    const c = TechOpsCampaign.load(localStorage);
    return { unlocked: c.flags.day_work_unlocked, listening: c.morningListening, tickets: c.tickets, stations: TechOpsDayWorld.stations().map(s => ({ id: s.id, available: s.available })) };
  });
  assert.equal(result.opening.unlocked, true);
  assert.equal(result.opening.listening.status, 'playing', 'track confirmed against the stubbed playlist; audible playback uncertified');
  assert.equal(result.opening.listening.userSkipped, false);
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
      if(!title.toUpperCase().includes(npc.name.toUpperCase()))throw Error('Wrong speaker: '+title+' (npc '+npc.name+', pos '+npc.x+','+npc.y+')');
      results.push({npc:npc.name,title});
    }
    closeDlg();return results;
  });
  result.requesterDialogue=await page.evaluate(()=>{
    const n=S.npcs.find(n=>!n.ambient&&!n.done&&!String(n.id||'').startsWith('campaign_')&&n.type);
    if(!n)throw Error('No ordinary requester for dialogue audit');
    if(S.inDialog)closeDlg();ticketFlow(n);
    return {name:n.name,department:n.dept,options:Array.from(document.querySelectorAll('#dlg-options button')).map(b=>b.textContent)};
  });
  await screenshot(page,result.id,'requester-conversation');
  await page.evaluate(()=>closeDlg());

  // Shipping act1-reference stage: real requester dialog opens the authored
  // stage; the floor line must be the measured art floor, not a fixed offset.
  result.shippingStage = await page.evaluate(() => {
    if (S.inDialog) closeDlg();
    if (S.room) v69ExitRoom();
    const p = S.meta.campaignAct1Native && S.meta.campaignAct1Native.shipping;
    if (!p) throw Error('No authored shipping contact');
    const spot = [[0,1],[-1,0],[1,0],[0,-1],[0,0]].map(([dx,dy]) => ({ x: p.x + dx, y: p.y + dy }))
      .find(t => S.map[t.y] && S.map[t.y][t.x] === 0) || p;
    S.px = spot.x; S.py = spot.y;
    const ok = TechOpsDayExperience.talk('shipping_cannot_print');
    return { ok, fixture: 'teleported adjacent to authored shipping contact', title: document.getElementById('dlg-name').textContent, stage: !!document.getElementById('act1-reference') };
  });
  assert.equal(result.shippingStage.ok, true, 'shipping requester conversation opens');
  assert.match(result.shippingStage.title, /SHIPPING/);
  await page.locator('#act1-reference .a1-actor').waitFor({ state: 'visible', timeout: 5000 });
  await page.waitForFunction(() => {
    const el = document.getElementById('act1-reference');
    if (!el) return false;
    // The stylesheet's default 18% is positive even before stage geometry is
    // applied. Require the measured inline floor and authored actor placement.
    const actor = el.querySelector('.a1-anchored.a1-actor');
    const v = parseFloat(el.style.getPropertyValue('--a1-floor-bottom'));
    return v > 0 && !!(actor && actor.style.left && actor.style.top && actor.style.width && actor.style.height);
  }, null, { timeout: 5000 });
  result.shippingFloor = await page.evaluate(() => getComputedStyle(document.getElementById('act1-reference')).getPropertyValue('--a1-floor-bottom').trim());
  assert.match(result.shippingFloor, /%$/, 'floor line measured from the art');
  // Authored-anchor regression: the clerk's feet must land on the authored
  // floor line (400/432 of the art) and the body must stand at the authored
  // spot (150/768), not drift with sprite padding or viewport cover-crop.
  result.shippingAnchor = await page.evaluate(() => {
    const actor = document.querySelector('#act1-reference .a1-anchored.a1-actor');
    const bg = actor && actor.parentElement;
    if (!actor || !bg) return null;
    const a = actor.getBoundingClientRect(), b = bg.getBoundingClientRect();
    if (!b.height) return null;
    return { feetY: (a.bottom - b.top) / b.height, centerX: ((a.left + a.right) / 2 - b.left) / b.width };
  });
  assert.ok(result.shippingAnchor, 'anchored clerk rendered inside the stage background');
  assert.ok(result.shippingAnchor.feetY - 400 / 432 > -0.03 && result.shippingAnchor.feetY - 400 / 432 < 0.05, `clerk feet on authored floor line (got ${result.shippingAnchor.feetY.toFixed(3)})`);
  // Narrow stage boxes crop toward the authored desk band, nudging the spot;
  // the regression that matters is the clerk staying visible in the left
  // story zone, never back over the forklift/crates on the right.
  assert.ok(result.shippingAnchor.centerX > 0.03 && result.shippingAnchor.centerX < 0.42, `clerk visible in the left story zone, clear of forklift/crates (got ${result.shippingAnchor.centerX.toFixed(3)})`);
  // let the transient room-entry card clear so the capture shows only the stage
  await page.waitForFunction(() => !document.getElementById('v710-card'), null, { timeout: 6000 }).catch(() => {});
  await page.waitForTimeout(300);
  await screenshot(page, result.id, 'shipping-stage');
  await page.evaluate(() => closeDlg());

}

try {
  if (!profiles.length) throw Error('DAY_DEVICE_PROFILES selected no profiles');
  report.sourceBefore = await sourceIdentity();
  if (!process.env.DAY_DEVICE_BASE_URL) server = spawn('python3', ['scripts/media_http_server.py', '--port', String(port), '--bind', '127.0.0.1'], { stdio: 'ignore' });
  await waitForServer();
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome'].find(existsSync);
  browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  report.browserVersion = browser.version();
  for (const profile of profiles) {
    const result = { id: profile.id, viewport: { width: profile.width, height: profile.height }, reducedMotion: profile.reducedMotion, checks: [], pageErrors: [], requestsBlocked: [] };
    report.profiles.push(result);
    const context = await browser.newContext({ viewport: result.viewport, hasTouch: profile.touch, isMobile: profile.touch, reducedMotion: profile.reducedMotion });
    await context.route('**/*', route => {
      if (new URL(route.request().url()).origin === origin) return route.continue();
      result.requestsBlocked.push(route.request().url()); return route.abort();
    });
    const page = await context.newPage(); activePage = page;
    page.on('pageerror', error => result.pageErrors.push(String(error.stack || error)));
    try {
      await morningOpening(page, result, profile.reducedMotion === 'reduce');
      result.checks.push('Real title and morning controls unlock Day; muted continuation is recorded explicitly');
      result.floorRouteVisual = await page.evaluate(() => {
        closeDlg(); if (S.room) v69ExitRoom();
        const beforeMap = JSON.stringify(S.map), beforeStations = JSON.stringify(S.meta.dayStations.items);
        const visual = TechOpsCampaignWorldVisuals && TechOpsCampaignWorldVisuals.drawDayFloorPolish;
        if (typeof visual !== 'function') throw Error('Day floor visual overlay is unavailable');
        const planned = TechOpsDayWorld.route('shipping_workstation');
        const active = TechOpsDayWorld.currentRoute();
        return {
          planned: { ok: planned.ok, target: planned.target && planned.target.id, steps: planned.steps },
          active: { ok: active && active.ok, target: active && active.target && active.target.id, steps: active && active.steps },
          mapUnchanged: beforeMap === JSON.stringify(S.map),
          stationsUnchanged: beforeStations === JSON.stringify(S.meta.dayStations.items)
        };
      });
      assert.equal(result.floorRouteVisual.planned.ok, true);
      assert.equal(result.floorRouteVisual.planned.target, 'shipping_workstation');
      assert.equal(result.floorRouteVisual.active.target, 'shipping_workstation');
      assert.equal(result.floorRouteVisual.mapUnchanged, true);
      assert.equal(result.floorRouteVisual.stationsUnchanged, true);
      await screenshot(page, result.id, 'floor-route');
      result.checks.push('Passive Day floor overlay exposes a real Shipping route without changing tiles or station geometry');
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
      await click(page, '02 · Open Doors');
      result.desktopLayout = await inspectDesktop(page);
      await openApp(page, 'Print Center');
      await click(page, 'Maximize window');
      assert.equal(await page.locator('.doors-field[data-max=true]').count(), 1);
      await click(page, 'Minimize window');
      await click(page, 'Restore Print Center');
      await click(page, 'Close window');
      assert.equal((await caseState(page)).investigations.shipping_cannot_print.evidence.length, 1, 'window management records no evidence');
      await traceLabels(page);
      result.screenEvidence = await caseState(page);
      assert.deepEqual(result.screenEvidence.investigations.shipping_cannot_print.evidence, ['printer_self_test', 'queue_trace', 'compare_user']);
      assert.equal(result.screenEvidence.active.surface, 'screen');
      await screenshot(page, profile.id, 'workstation-diagnostics');
      await repairQueue(page);
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
      await click(page, '02 · Open Doors');
      await openApp(page, 'Device Manager');
      await click(page, 'Open connected devices');
      await openApp(page, 'Work Order');
      await page.locator('[data-day-action="hypothesis"][data-value="display_failure"]').click();
      assert.equal((await caseState(page)).ordinary.laptop_dock_link.fixApplied, false, 'wrong explanation does not repair the device');
      await page.locator('[data-day-action="hypothesis"][data-value="upstream_disconnected"]').click();
      await click(page, 'Inspect equipment');
      await click(page, 'Confirm the agreed change window');
      await click(page, 'Apply the supported repair');
      await click(page, '02 · Open Doors');
      await openApp(page, 'Device Manager');
      await click(page, 'Rescan dock and test drawing share');
      result.optionalTechnicalOnly = (await caseState(page)).ordinary.laptop_dock_link;
      assert.equal(result.optionalTechnicalOnly.requesterVerified, false);
      assert.equal(result.optionalTechnicalOnly.phase, 'requester');
      await openApp(page, 'Work Order');
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
      result.platingFixture = await fixtureAtStation(page, 'plating_workstation');
      await page.locator('.plating-cabinet[data-session="disconnected"]').waitFor();
      assert.equal(await page.locator('.plating-hold[data-hold="pending"]').count(), 1);
      result.platingPhysicalLayout = await assertConsole(page, `${profile.id} Plating HMI`);
      await screenshot(page, profile.id, 'plating-hmi');
      await click(page, '02 · Open Doors');
      await openApp(page, 'Connection Test');
      assert.match(await page.locator('.plating-checks li').nth(1).innerText(), /Not checked/);
      assert.match(await page.locator('.plating-checks li').nth(2).innerText(), /Not verified/);
      await click(page, 'Check local sign-in');
      await click(page, 'Ping line controller');
      assert.match(await page.locator('.plating-checks li').nth(1).innerText(), /Reachable/);
      assert.match(await page.locator('.plating-checks li').nth(2).innerText(), /Not verified/);
      assert.equal((await caseState(page)).investigations.plating_workstation_down.technicalCheckPassed, false, 'ping cannot verify an application session');
      result.platingReachableLayout = await assertBatchLayout(page, profile.id + ' reachable controller');
      await screenshot(page, profile.id, 'plating-reachable');
      await openApp(page, 'Services');
      assert.match(await page.locator('.plating-dependency li').nth(1).innerText(), /Query required/);
      await click(page, 'Inspect dependency chain');
      assert.match(await page.locator('.plating-dependency li').nth(1).innerText(), /Stopped/);
      result.platingStoppedLayout = await assertBatchLayout(page, profile.id + ' stopped dependency');
      await screenshot(page, profile.id, 'plating-services-stopped');
      await click(page, 'Open work order');
      await click(page, 'integration failure');
      await openApp(page, 'Services');
      await click(page, 'Automatic');
      await click(page, 'Apply startup and start service');
      assert.equal((await caseState(page)).investigations.plating_workstation_down.fixApplied, false, 'the operator hold gates a supported repair');
      assert.equal(await page.locator('.plating-hold[data-hold="pending"]').count(), 1);
      await click(page, 'Open work order');
      await click(page, 'Coordinate operator hold with Amit');
      await click(page, 'Open repair tool');
      assert.equal(await page.locator('.plating-hold[data-hold="confirmed"]').count(), 1);
      await click(page, 'Manual');
      await click(page, 'Apply startup and start service');
      assert.equal((await caseState(page)).investigations.plating_workstation_down.fixApplied, false, 'a one-off manual start is not the persistent repair');
      await click(page, 'Automatic');
      await click(page, 'Apply startup and start service');
      assert.match(await page.locator('.plating-dependency li').nth(1).innerText(), /Running/);
      await screenshot(page, profile.id, 'plating-services-running');
      await openApp(page, 'Connection Test');
      assert.match(await page.locator('.plating-checks li').nth(2).innerText(), /Repair applied · test pending/);
      const repairOnly = await caseState(page);
      assert.equal(repairOnly.investigations.plating_workstation_down.fixApplied, true);
      assert.equal(repairOnly.investigations.plating_workstation_down.technicalCheckPassed, false);
      assert.equal(!!repairOnly.tickets.plating_workstation_down, false);
      result.platingRepairLayout = await assertBatchLayout(page, profile.id + ' session ready to test');
      await screenshot(page, profile.id, 'plating-session-pending');
      await click(page, 'Reconnect and test session');
      assert.match(await page.locator('.plating-checks li').nth(2).innerText(), /Session verified/);
      result.platingTechnicalOnly = await caseState(page);
      assert.equal(result.platingTechnicalOnly.investigations.plating_workstation_down.technicalCheckPassed, true);
      assert.equal(!!result.platingTechnicalOnly.tickets.plating_workstation_down, false, 'session success cannot close the human task');
      result.platingVerifiedLayout = await assertBatchLayout(page, profile.id + ' verified session');
      await screenshot(page, profile.id, 'plating-session-verified');
      await click(page, 'Inspect equipment');
      await page.locator('.plating-cabinet[data-session="verified"]').waitFor();
      assert.equal(await page.locator('.plating-hold[data-hold="confirmed"]').count(), 1);
      await click(page, 'Return to floor');
      result.platingRequesterFixture = await fixtureAtRequester(page, 'plating_workstation_down');
      await click(page, 'Witness the requester’s successful task');
      result.platingComplete = await caseState(page);
      assert.equal(result.platingComplete.tickets.plating_workstation_down.verification, 'strong');
      assert.equal(result.platingComplete.tickets.plating_workstation_down.humanOutcome, 'restored');
      await screenshot(page, profile.id, 'plating-requester-verified');
      await click(page, 'Return to work');
      result.checks.push('Plating distinguishes unknown/reachable controller, stopped/running dependency and unverified/verified session; operator hold and independent requester witness remain required');

      const securityBefore = await page.evaluate(() => TechOpsCampaign.load(localStorage));
      result.securityFixture = await fixtureAtStation(page, 'security_workstation');
      await openApp(page, 'Badge Log');
      await page.locator('.doors-security__equipment svg[role="img"]').waitFor();
      assert.equal(await page.locator('.doors-security__timeline ol li').count(), 1, 'only the existing event is shown');
      assert.equal(await page.locator('.doors-security__timeline time').innerText(), '02:13');
      assert.equal(await page.locator('.doors-security__result').innerText(), 'ACCESS GRANTED');
      assert.match(await page.locator('.doors-security__comparison [data-proof="recorded"]').innerText(), /Credential accepted/);
      assert.match(await page.locator('.doors-security__comparison [data-proof="unverified"]').innerText(), /Physical presence unverified/);
      assert.equal(await page.locator('.doors-security').getByText('M.OLIVEFIELD', { exact: false }).count(), 0, 'identity detail stays behind the existing review action');
      assert.deepEqual(await page.evaluate(() => TechOpsCampaign.load(localStorage)), securityBefore, 'opening the log awards no evidence');
      result.securityLayout = await assertBatchLayout(page, profile.id + ' Security Event Log');
      await screenshot(page, profile.id, 'security-event-log');
      await click(page, 'Review access event');
      const securityAfter = await page.evaluate(() => TechOpsCampaign.load(localStorage));
      const sources = securityAfter.evidence.ghostIdentityEvidence.sources;
      assert.equal(sources.length, securityBefore.evidence.ghostIdentityEvidence.sources.length + 1);
      const badge = sources.find(source => source.id === 'badge_impossible_access');
      assert.ok(badge, 'existing canonical badge fact was recorded');
      assert.equal(badge.completeness, 'partial');
      assert.equal(badge.authority, 'access_control');
      assert.deepEqual(securityAfter.flags, securityBefore.flags, 'review cannot award entry or other progression flags');
      assert.deepEqual(securityAfter.night, securityBefore.night, 'review cannot start Sector 04 or reveal its events');
      assert.deepEqual(securityAfter.tickets, securityBefore.tickets, 'the identity inconsistency is not a resolved ticket');
      assert.equal(securityAfter.evidence.ghostIdentityEvidence.corroborated, false);
      result.securityEvidence = { source: badge, flagsUnchanged: true, nightUnchanged: true, unresolved: true };
      await click(page, 'Continue');
      result.checks.push('Security log shows one existing access event; opening is read-only and deliberate review records only partial existing badge evidence without early progression');

      result.promptExitFixture = await fixtureAtStation(page, 'mike_desk');
      await click(page, 'Show desktop');
      await click(page, 'PROMPT');
      const promptPosition = await position(page);
      await page.getByRole('textbox', { name: 'Command', exact: true }).fill('wasd');
      await page.keyboard.press('Escape');
      assert.deepEqual(await position(page), promptPosition, 'Prompt keyboard flow never moves Mike');
      assert.equal(await page.evaluate(() => S.inDialog), false, 'Escape dismisses the desktop through its current owner');
      result.checks.push('Prompt Enter/Run, literal errors, cls, Tab/Shift+Tab focus wrapping and Escape preserve keyboard ownership and world position');
      assert.deepEqual(result.pageErrors, []);
      result.status = 'passed';
    } catch (error) {
      result.status = 'failed'; result.failure = String(error.stack || error);
      result.failureState = await caseState(page).catch(() => null);
      result.failureGeometry = await failureGeometry(page).catch(() => null);
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
  const reviews=[
    ['plating-hmi','Batch 2 · Plating cabinet','Authored HMI/cabinet close-up. Repair, technical test and requester closure remain separate.'],
    ['plating-reachable','Batch 2 · Connection Test','Controller responds while integration session remains unverified.'],
    ['plating-services-stopped','Batch 2 · Services dependency','Queried dependency and production integration are stopped; operator hold is not yet coordinated.'],
    ['plating-services-running','Batch 2 · Persistent repair','Automatic startup restores the service; session still needs its own test.'],
    ['plating-session-pending','Batch 2 · Session ready','Repair applied with confirmed operator hold; no technical or human verification implied.'],
    ['plating-session-verified','Batch 2 · Technical verification','Fresh integration session test passes; requester task is still open.'],
    ['plating-requester-verified','Batch 2 · Independent task witness','Real requester action records strong verification and restored outcome.'],
    ['security-event-log','Batch 2 · Evidence boundary','One existing 02:13 event. Accepted credential and unverified physical presence stay distinct.'],
    ['prompt','Batch 2 · Prompt keyboard','Typed input, output and errors use distinct semantic rows. Commands remain local and whitelisted.'],
    ['entry-standup','P1 · Entry / story ownership','Functional entry and skip checks passed in the preceding capture. Current framing: scripted standup holds a cinematic mid shot with Mike parked at an authored mark (left third) so he cannot occlude the speaker; the current speaker carries a floor spotlight and gold pointer while the crew dims, the arrival card is suppressed until standup completes, and the dept chip reports floor-wide open tickets instead of a misleading "all clear". Compact dialogue caps at 30–34vh with auxiliary small print dropped.'],
    ['shipping-stage','P1 · Authored staging','The clerk is anchored to hand-authored scene coordinates (spot x 150/768, feet on the y 400/432 floor line) inside the art window, clear of the forklift and crate stack, with the label printer on the desk front edge occluding the monitor base. Capture asserts the rendered feet and spot against the authored fractions every run; sprite transparent padding is compensated by measured alpha-bbox anchors. Remaining: the clerk portrait artwork does not match the floor sprite set (mismatched character art stays open).'],
    ['side-room-desk','P1 · Spatial affordance','Desk is visible, keyboard approach opens the workstation, and the "use workstation" prompt now rides a dark pill that stays legible on bright backdrops and portrait crops. Remaining: the foreground desk is a canvas-drawn stand-in whose detail level differs from the backdrop furniture; replacing it with a matching furniture asset stays open.'],
    ['requester-conversation','P1 · Dialogue specificity','Questions must concern this incident and department. Answers must remain visible and already-discussed topics must not repeat.'],
    ['simulated-desktop','P1 · Interface hierarchy','Mike’s physical workstation runs Doors. Minimize, taskbar restore and typed Prompt commands are exercised on every viewport.'],
    ['company-cutscene','P2 · Texture / art direction','Review photoreal media versus pixel characters. Functional capture is not art approval; visual consistency remains an authored asset task.'],
    ['printer-inspection','P1 · Evidence before action','Physical printer inspection supplies the self-test. The separate dispatch workstation runs Doors Print Center and Queue Security.'],
    ['floor-route','P1 · Route legibility','The real Shipping path is captured at desktop, 390px, 320px and short landscape with reduced motion. Outlined chevrons, named departmental marks and a textual target label must remain legible without a color-only or moving cue.'],
    ['floor','P2 · World texture consistency','Fixed this round: NPC status markers are vector badges (gold ticket / pulsing red diamond / green check) instead of emoji glyphs, so the HUD stats row no longer picks up tofu boxes under the scrim in captures; the $80 / Tickets / Output row spacing is verified clean at 390px. Observed still open: top-down props, flat desk tiles and detailed side-room art have different pixel density and lighting. Next: choose one pixel grid, palette and light direction, then replace inconsistent props in both views.']
  ];
  report.visualReview={standard:'docs/production/PRODUCTION-BIBLE-R1.md',automaticVerdict:report.status,aestheticCertification:false,priorities:reviews.map(([scene,priority,note])=>({scene,priority,note}))};
  const html='<!doctype html><meta charset="utf-8"><title>TechOps Hero — experience review</title><style>body{background:#0b1823;color:#dce8f0;font:16px/1.5 system-ui;margin:32px;max-width:1400px}article{border:1px solid #3c586b;padding:18px;margin:24px 0}img{display:block;max-width:100%;max-height:720px;margin:auto}b{color:#ffd38b}.shots{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:16px}figure{margin:0;position:relative}figcaption{padding:12px;background:#183448;border-left:4px solid #e7bb62}small{color:#9db4c6}</style><h1>TechOps Hero / captured experience review</h1><p>Fixture-assisted runs at four viewport sizes. Captures are annotated against the production bible. Automated functional passes do not certify texture consistency or AAA presentation.</p>'+reviews.map(([scene,priority,note])=>'<article><b>'+priority+'</b><h2>'+scene.replaceAll('-',' ')+'</h2><p>'+note+'</p><div class="shots">'+profiles.map(p=>'<figure><img loading="lazy" src="'+p.id+'-'+scene+'.png" alt="'+p.id+' '+scene+'"><figcaption>'+p.id+' · '+p.width+' × '+p.height+'<br><small>'+note+'</small></figcaption></figure>').join('')+'</div></article>').join('');
  await writeFile(`${out}/visual-review.html`,html);
  report.sourceAfter = await sourceIdentity();
  report.sourceUnchanged = JSON.stringify(report.sourceBefore) === JSON.stringify(report.sourceAfter);
  if (!report.sourceUnchanged) { report.status = 'failed'; report.sourceFailure = 'Source changed during browser qualification'; process.exitCode = 1; }
  await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
}
