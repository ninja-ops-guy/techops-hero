'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { boot, click, SHIPPING, PLATING, ACCESS } = require('./test_helpers/gameplay_fixture');

function setup() {
  const b = boot(), r = b.r;
  let nearby = false, route = null, talk = null;
  r.TechOpsDayExperience = {
    requireDesk() { if (!nearby) route = 'mike_desk'; return nearby; },
    desktopNearby() { return nearby; },
    routeTo(id) { route = id; r.closeDlg(); return true; },
    talk(id) { talk = id; return true; },
    workstationSkin() {}, interact() { return false; }
  };
  const state = b.C.createInitialState();
  for (const [id, owner] of [[SHIPPING, 'mike'], [PLATING, 'amit'], [ACCESS, 'security']]) b.C.assignTicket(state, id, owner);
  b.C.completeStandup(state); b.C.save(state, b.store); b.N.ensureWorld();
  return { b, r, setNear(value) { nearby = value; }, get route() { return route; }, get talk() { return talk; } };
}
const stored = b => b.C.load(b.store);
let count = 0;
async function test(name, fn) { await fn(); count++; console.log('PASS ' + name); }

(async () => {
  await test('desktop entrypoints away from Mike desk do not write opening state', () => {
    const x = setup(), b = x.b, before = b.store.getItem(b.C.SAVE_KEY);
    for (const run of [() => b.N.openWorkstation(), () => b.N.openWorkstationTab('MUSIC'), () => b.N.openMusicTab(), () => b.N.openCompanyTab(), () => b.N.playFeliciaVideo(), () => b.N.completeFeliciaVideo(false), () => b.N.unlockDayShift()]) {
      assert.equal(run(), false); assert.equal(x.route, 'mike_desk');
    }
    assert.equal(b.store.getItem(b.C.SAVE_KEY), before);
  });

  await test('confirmed PLAY commits once without replaying the legacy soundtrack wrapper', async () => {
    const x = setup(), { b, r } = x; x.setNear(true);
    let resolve, replay = 0;
    r.TechOpsDayAudio = { playMorningTrack() { return new Promise(done => { resolve = done; }); } };
    const base = b.C.hearRedInMirror, wrapper = state => { replay++; return base(state); };
    wrapper.__base = base; wrapper.__techopsDiegeticRed = true; b.C.hearRedInMirror = wrapper;
    b.N.openMusicTab(); const pending = click(b, 'Play Red in the Mirror');
    assert.equal(stored(b).flags.red_in_mirror_heard, false);
    resolve({ status: 'playing', source: 'confirmed-test-widget' }); await pending;
    assert.equal(stored(b).flags.red_in_mirror_heard, true);
    assert.equal(stored(b).morningListening.userSkipped, false); assert.equal(replay, 0);
    assert.equal(stored(b).history.filter(item => item.type === 'red_in_mirror_heard').length, 1);
  });

  for (const status of ['timeout', 'muted', 'not-found', 'unavailable', 'cancelled']) {
    await test(status + ' does not claim listening and offers a recoverable choice', async () => {
      const x = setup(), { b, r } = x; x.setNear(true);
      r.TechOpsDayAudio = { playMorningTrack: () => Promise.resolve({ status }) };
      b.N.openMusicTab(); await click(b, 'Play Red in the Mirror');
      assert.equal(stored(b).flags.red_in_mirror_heard, false);
      assert.ok(r.dialog.options.some(option => option.t === 'Retry Red in the Mirror'));
      assert.ok(r.dialog.options.some(option => option.t === 'Continue with music muted'));
    });
  }

  await test('explicit muted continuation uses the audio owner and records an honest skip', () => {
    const x = setup(), { b, r } = x; x.setNear(true); const choices = [];
    r.setMusic = on => choices.push(on);
    b.N.openMusicTab(); click(b, 'Continue with music muted');
    assert.deepEqual(choices, [false]);
    assert.equal(stored(b).flags.red_in_mirror_heard, true);
    assert.equal(stored(b).morningListening.userSkipped, true);
    assert.equal(stored(b).history.at(-1).context, 'accessibility_skip');
    assert.match(r.dialog.body, /playback was not claimed/);
  });

  await test('stale muted callback away from the desk cannot mute or advance another scene', () => {
    const x = setup(), { b, r } = x; x.setNear(true); const choices = [];
    r.setMusic = on => choices.push(on);
    b.N.openMusicTab(); const callback = r.dialog.options.find(option => option.t === 'Continue with music muted').f;
    x.setNear(false); callback();
    assert.deepEqual(choices, []); assert.equal(stored(b).flags.red_in_mirror_heard, false);
  });

  for (const stale of ['closed', 'moved', 'new-run', 'new-view', 'night']) {
    await test('late PLAY after ' + stale + ' cannot advance the opening', async () => {
      const x = setup(), { b, r } = x; x.setNear(true); let resolve;
      r.TechOpsDayAudio = { playMorningTrack: () => new Promise(done => { resolve = done; }) };
      b.N.openMusicTab(); const pending = click(b, 'Play Red in the Mirror');
      if (stale === 'closed') r.closeDlg();
      if (stale === 'moved') x.setNear(false);
      if (stale === 'new-run') r.S = Object.assign({}, r.S);
      if (stale === 'new-view') b.N.openWorkstationTab('TEAMS');
      if (stale === 'night') r.S.nightMode = {};
      resolve({ status: 'playing' }); await pending;
      assert.equal(stored(b).flags.red_in_mirror_heard, false);
    });
  }

  await test('muted continuation prevents a delayed real DayAudio playlist callback from playing', async () => {
    const x = setup(), { b, r } = x; x.setNear(true);
    let soundsReady, plays = 0, pauses = 0;
    const sound = { id: 7, title: 'Red in the Mirror' }, handlers = {};
    r.setTimeout = setTimeout; r.clearTimeout = clearTimeout;
    r.sfxMuted = false; r.musicRequested = true; r.scReady = true;
    r.SC = { Widget: { Events: { PLAY: 'play', READY: 'ready', ERROR: 'error' } } };
    r.scWidget = {
      bind(event, callback) { handlers[event] = callback; },
      getSounds(callback) { soundsReady = callback; },
      getCurrentSound(callback) { callback(sound); },
      skip() {}, setVolume() {},
      play() { plays++; if (handlers.play) handlers.play(); },
      pause() { pauses++; }
    };
    r.setMusic = on => { r.musicRequested = !!on; r.sfxMuted = !on; if (!on) r.scWidget.pause(); };
    vm.runInContext(fs.readFileSync('runtime_day_audio.js', 'utf8'), r, { filename: 'runtime_day_audio.js' });
    b.N.openMusicTab(); const pending = click(b, 'Play Red in the Mirror');
    assert.equal(typeof soundsReady, 'function');
    click(b, 'Continue with music muted'); soundsReady([sound]); await pending;
    assert.equal(plays, 0); assert.equal(pauses, 1);
    assert.equal(stored(b).morningListening.status, 'user_skipped');
    assert.equal(r.TechOpsDayAudio.diagnostics().playback.status, 'muted');
  });

  await test('field UI and public quick-close routes cannot create remote evidence or close a ticket', () => {
    const x = setup(), { b, r } = x, before = b.store.getItem(b.C.SAVE_KEY);
    b.I.openGather(SHIPPING); assert.equal(x.route, 'shipping');
    b.N.resolveTicket(SHIPPING); assert.equal(x.route, 'shipping');
    r.TechOpsDayWorld = { at() { return false; } }; b.N.recordAccessEvidence();
    assert.equal(stored(b).evidence.ghostIdentityEvidence.sources.length, 0);
    assert.equal(stored(b).tickets[SHIPPING], undefined);
    assert.equal(b.store.getItem(b.C.SAVE_KEY), before);
  });
  console.log('Day spatial campaign and morning audio: ' + count + ' tests passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
