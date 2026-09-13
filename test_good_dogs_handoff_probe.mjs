import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import {readGoodDogsHandoff, waitForGoodDogsHandoff} from './scripts/good_dogs_handoff_probe.mjs';

const request = {mission: 4, cutsceneId: 'GD_CUT_05'};
function fixture() {
  const n = {_v736: {m: 4, ending: false, cellOpened: true}};
  const s = {meta: {_v736: {m: 4}}, nightMode: n, inDialog: false};
  const progress = {active: true, mission: 4, transition: false, handoff: null,
    handoffComplete: {mission: 4, startedAt: 100, completedAt: 200},
    runtimePending: null, handoffError: null, cinematicVisible: false};
  const bridge = {running: false, visibleBlocker: false, error: null,
    seen: {GD_CUT_04: true, GD_CUT_05: true}};
  const presentation = {blocking: false, claims: [], surfaces: []};
  const nodes = new Map();
  let nativeActive = false;
  const root = {S: s, NM: n, document: {getElementById: id => nodes.get(id)},
    getComputedStyle: el => el.style,
    TechOpsGoodBoysProgressionAuthority: {acceptance: () => progress},
    TechOpsGoodBoysCampaignState: {mission: () => s.meta._v736.m},
    TechOpsGoodDogsCutsceneBridge: {acceptance: () => bridge, get running() {return bridge.running;}},
    TechOpsPresentationDirector: {current: () => presentation},
    v725: {active: () => nativeActive}, __goodDogsPreRenderedCutsceneActive: false,
    __goodDogsCutsceneExit: {id: 'GD_CUT_05', status: 'USER_SKIPPED'}};
  const context = vm.createContext(root);
  const evaluate = args => JSON.parse(JSON.stringify(vm.runInContext(
    `(${readGoodDogsHandoff.toString()})(${JSON.stringify(args || request)})`, context)));
  const node = (id, {hidden = false, active = true, display = 'block', opacity = '1'} = {}) => nodes.set(id,
    {classList: {contains: name => name === 'hidden' ? hidden : name === 'active' && active},
      style: {display, visibility: 'visible', opacity}});
  return {root, n, s, progress, bridge, presentation, evaluate, node, native: on => {nativeActive = on;}};
}
function freeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);Object.values(value).forEach(freeze);return value;
}
function rejectsWith(f, reason) {const d = f.evaluate();assert.equal(d.ready, false);assert.ok(d.reasons.includes(reason), JSON.stringify(d));return d;}

test('fresh M4, settled film and released native handoff are playable', () => {
  const f = fixture();assert.equal(f.evaluate().ready, true);
  f.root.__goodDogsCutsceneExit.status = 'COMPLETED';assert.equal(f.evaluate().ready, true);
});
test('run #808: film-only exit passes the old predicate while the outgoing runtime is ending', () => {
  const f = fixture();f.n._v736.ending = true;f.progress.active = false;
  f.progress.handoff = {mission: 4, at: 1789247976543};
  f.progress.handoffComplete = {mission: 3};
  f.progress.runtimePending = {mission: 4, status: 'awaiting-fresh-runtime'};
  f.progress.cinematicVisible = true;f.s.inDialog = true;f.native(true);
  f.presentation.blocking = true;f.presentation.surfaces = ['story-cine'];f.node('v725-cine');
  assert.equal(!f.bridge.running && !f.root.__goodDogsPreRenderedCutsceneActive, true);
  const d = rejectsWith(f, 'handoff-pending');assert.ok(d.reasons.includes('runtime-not-playable'));
  assert.ok(d.reasons.includes('presentation-owned'));assert.ok(d.reasons.includes('dialog-blocked'));
});
test('CUT_04 transient dialog=false is not fresh-runtime evidence', () => {
  const f = fixture();f.n._v736.ending = true;f.progress.active = false;f.native(true);
  f.progress.handoffComplete = {mission: 3};f.root.__goodDogsCutsceneExit.id = 'GD_CUT_04';
  assert.equal(f.evaluate({mission: 4, cutsceneId: 'GD_CUT_04'}).ready, false);
});
for (const [name, change, reason] of [
  ['ending runtime', f => {f.n._v736.ending = true;}, 'runtime-not-playable'],
  ['inactive authority', f => {f.progress.active = false;}, 'runtime-not-playable'],
  ['wrong world', f => {f.s.nightMode = {};}, 'runtime-not-playable'],
  ['runtime mission mismatch', f => {f.n._v736.m = 3;}, 'mission-diverged'],
  ['saved mission mismatch', f => {f.s.meta._v736.m = 5;}, 'mission-diverged'],
  ['canonical state mismatch', f => {f.root.TechOpsGoodBoysCampaignState.mission = () => 3;}, 'mission-diverged'],
  ['authority mission mismatch', f => {f.progress.mission = 5;}, 'mission-diverged'],
  ['pending handoff', f => {f.progress.handoff = {mission: 4};}, 'handoff-pending'],
  ['pending runtime', f => {f.progress.runtimePending = {status: 'awaiting-runtime'};}, 'handoff-pending'],
  ['transition cooldown', f => {f.progress.transition = true;}, 'handoff-pending'],
  ['missing completion', f => {f.progress.handoffComplete = null;}, 'handoff-pending'],
  ['old mission completion', f => {f.progress.handoffComplete = {mission: 3};}, 'handoff-pending'],
  ['handoff error', f => {f.progress.handoffError = 'failed to mount';}, 'authority-error'],
  ['bridge error', f => {f.bridge.error = 'media failed';}, 'authority-error'],
  ['native cinematic without DOM', f => {f.native(true);}, 'presentation-owned'],
  ['native DOM absent from bridge blockers', f => {f.node('v725-cine');}, 'presentation-owned'],
  ['director-only claim', f => {f.presentation.blocking = true;f.presentation.claims = [{owner: 'native', blocking: true}];}, 'presentation-owned'],
  ['progression cinematic ownership', f => {f.progress.cinematicVisible = true;}, 'presentation-owned'],
  ['fading dialogue', f => {f.node('dialogue', {opacity: '0'});}, 'presentation-owned'],
  ['visible prison briefing', f => {f.node('gb-prison-cine');}, 'presentation-owned'],
  ['running bridge', f => {f.bridge.running = true;}, 'film-owned'],
  ['active film flag', f => {f.root.__goodDogsPreRenderedCutsceneActive = true;}, 'film-owned'],
  ['bridge-visible blocker', f => {f.bridge.visibleBlocker = true;}, 'film-owned'],
  ['wrong clip exit', f => {f.root.__goodDogsCutsceneExit.id = 'GD_CUT_04';}, 'film-not-settled'],
  ['nonterminal clip exit', f => {f.root.__goodDogsCutsceneExit.status = 'FAILED';}, 'film-not-settled'],
  ['unrecorded clip', f => {f.bridge.seen.GD_CUT_05 = false;}, 'film-not-settled'],
  ['persistent invisible dialog latch', f => {f.s.inDialog = true;}, 'dialog-blocked'],
  ['missing authority', f => {delete f.root.TechOpsPresentationDirector;}, 'authority-unavailable'],
  ['missing native observer', f => {delete f.root.v725;}, 'authority-unavailable'],
  ['missing runtime', f => {delete f.n._v736;}, 'runtime-unavailable']
]) test(`rejects ${name}`, () => {const f = fixture();change(f);rejectsWith(f, reason);});

test('hidden/inactive media overlays do not create false blockers', () => {
  const f = fixture();f.node('good-dogs-cutscene-overlay', {active: false});
  f.node('dialogue', {hidden: true});f.node('gb-prison-cine', {display: 'none'});
  assert.equal(f.evaluate().ready, true);
});
test('reader accepts deeply frozen state and never settles/ticks/clears it', () => {
  const f = fixture();f.s.inDialog = true;
  for (const api of [f.root.TechOpsGoodBoysProgressionAuthority, f.root.TechOpsGoodDogsCutsceneBridge])
    for (const key of ['tick', 'releaseCinematicBlock', 'finalizeHandoff']) api[key] = () => assert.fail('reader mutated game state');
  f.root.v725.skip = () => assert.fail('reader skipped native cinematic');
  [f.s, f.n, f.progress, f.bridge, f.presentation].forEach(freeze);
  const before = JSON.stringify([f.s, f.n, f.progress, f.bridge, f.presentation]);
  rejectsWith(f, 'dialog-blocked');
  assert.equal(JSON.stringify([f.s, f.n, f.progress, f.bridge, f.presentation]), before);
});
test('absent campaign state cannot be initialized by observation', () => {
  const f = fixture();delete f.s.meta._v736;
  f.root.TechOpsGoodBoysProgressionAuthority.acceptance = () => assert.fail('must not initialize absent meta');
  rejectsWith(f, 'runtime-unavailable');assert.equal('_v736' in f.s.meta, false);
});
test('a broken acceptance API propagates instead of being normalized to success', async () => {
  const error = new Error('acceptance crashed');
  await assert.rejects(waitForGoodDogsHandoff({evaluate: async () => {throw error;}}, request), e => e === error);
});
test('bounded waiter observes pending -> native-owned -> released without mutation', async () => {
  const f = fixture();f.progress.handoff = {mission: 4};f.s.inDialog = true;
  let polls = 0;
  const page = {evaluate: async (fn, arg) => {assert.equal(fn, readGoodDogsHandoff);return f.evaluate(arg);},
    waitForTimeout: async () => {if (++polls === 1) {f.progress.handoff = null;f.native(true);} else {f.native(false);f.s.inDialog = false;}}};
  const d = await waitForGoodDogsHandoff(page, request, {timeout: 1000});
  assert.equal(polls, 2);assert.equal(d.state.ready, true);assert.equal(d.observations.length, 3);
  assert.ok(d.observations[0].state.reasons.includes('handoff-pending'));
  assert.ok(d.observations[1].state.reasons.includes('presentation-owned'));
});
test('persistent dialog or missing handoff times out and cannot reach the next fixture', async () => {
  for (const fault of ['dialog', 'handoff']) {
    const f = fixture();if (fault === 'dialog') f.s.inDialog = true;else f.progress.handoff = {mission: 4};
    let advanced = false;
    const page = {evaluate: async (_, arg) => f.evaluate(arg), waitForTimeout: ms => new Promise(resolve => setTimeout(resolve, ms))};
    await assert.rejects(async () => {await waitForGoodDogsHandoff(page, request, {timeout: 25, pollInterval: 5});advanced = true;}, e => {
      assert.equal(e.code, 'GOOD_DOGS_HANDOFF_TIMEOUT');assert.equal(e.cutsceneId, 'GD_CUT_05');
      assert.equal(e.handoff.state.ready, false);assert.ok(e.handoff.observations.length);return true;
    });
    assert.equal(advanced, false);assert.equal(f.s.inDialog, fault === 'dialog');
  }
});
test('invalid deadlines and mission requests are rejected before browser evaluation', async () => {
  const page = {evaluate: () => assert.fail('invalid request evaluated')};
  for (const arg of [{mission: 8, cutsceneId: 'GD_CUT_05'}, {mission: 4, cutsceneId: 'not-a-clip'}])
    await assert.rejects(waitForGoodDogsHandoff(page, arg), TypeError);
  for (const timeout of [0, -1, NaN, Infinity]) await assert.rejects(waitForGoodDogsHandoff(page, request, {timeout}), TypeError);
});
test('actual production modules expose native ownership even when bridge DOM inventory is empty', () => {
  const f = fixture();f.n._v736.ending = true;f.s.inDialog = true;
  f.root.__goodBoysHandoffInProgress = {mission: 4, at: 100};
  f.root.__goodBoysHandoffComplete = {mission: 3};
  f.root.document.querySelectorAll = () => [];
  f.root.setInterval = () => 1;f.root.clearInterval = () => {};
  f.root.setTimeout = () => 1;f.root.__productionSingleCompositor = true;
  f.root.GoodDogsCutscenes = {state: () => ({GD_CUT_04: {seen: true}, GD_CUT_05: {seen: true}})};
  for (const key of ['TechOpsGoodBoysCampaignState', 'TechOpsGoodBoysProgressionAuthority', 'TechOpsGoodDogsCutsceneBridge', 'TechOpsPresentationDirector']) delete f.root[key];
  const context = vm.createContext(f.root);
  for (const file of ['cinematic_systems.js', 'good_dogs_cutscene_bridge.js', 'good_boys_progression_authority.js'])
    vm.runInContext(readFileSync(file, 'utf8'), context);
  const token = f.root.TechOpsPresentationDirector.begin({id: 'b736m4', mode: 'gooddogs', owner: 'native-test'});
  assert.ok(token);f.native(true);
  f.root.TechOpsGoodBoysProgressionAuthority.tick();
  assert.equal(f.root.TechOpsGoodDogsCutsceneBridge.acceptance().visibleBlocker, false);
  const before = JSON.stringify(f.s);
  const read = () => JSON.parse(JSON.stringify(vm.runInContext(`(${readGoodDogsHandoff.toString()})(${JSON.stringify(request)})`, context)));
  const pending = read();assert.equal(pending.ready, false);assert.ok(pending.reasons.includes('handoff-pending'));
  assert.equal(JSON.stringify(f.s), before);
  f.n._v736 = {m: 4, ending: false, cellOpened: true};f.native(false);
  f.root.TechOpsPresentationDirector.end(token);f.root.TechOpsGoodDogsCutsceneBridge.tick();
  f.root.TechOpsGoodBoysProgressionAuthority.tick();
  assert.equal(read().ready, true);
});
test('progression fixture waits before Cell 118 mutation and before declaring CUT_05 playable', () => {
  const s = readFileSync('scripts/good_boys_progression_bot.mjs', 'utf8');
  const before = s.indexOf("await playableHandoff(page,4,'GD_CUT_04')");
  const mutation = s.indexOf('c.cellOpened=true;');
  const after = s.indexOf("await playableHandoff(page,4,'GD_CUT_05')");
  assert.ok(before > 0 && mutation > before && after > mutation);
  assert.ok(s.includes("'stale-dialog-after-gd-cut-04'"));assert.ok(s.includes("'stale-dialog-after-gd-cut-05'"));
  assert.ok(s.includes('Cell 118 fixture lost playable M4 ownership'));
  assert.ok(s.includes("'unsettled-handoff-after-'+e.cutsceneId"));
  assert.ok(readFileSync('scripts/production_release_gate.js', 'utf8').includes('"test_good_dogs_handoff_probe.mjs"'));
});
