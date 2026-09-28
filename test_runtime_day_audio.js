'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
const source = fs.readFileSync('runtime_day_audio.js', 'utf8');
let count = 0;
async function test(name, fn) { await fn(); count++; console.log('PASS ' + name); }
function fixture(options = {}) {
  const log = [], contexts = [], handlers = {}, timers = new Map(), storage = new Map(), musicEvents = {}, volumeReads = [];
  let timerId = 0, currentSound = { id: 8, title: 'Another song' };
  const param = () => ({ value: 0, setValueAtTime(v) { this.value = v; }, linearRampToValueAtTime() {}, exponentialRampToValueAtTime(v) { assert(v > 0); } });
  const node = kind => ({ kind, frequency: param(), gain: param(), connect() {}, disconnect() { this.disconnected = true; }, start(t) { log.push(['start', t]); }, stop(t) { log.push(['stop', t]); } });
  class AudioContext {
    constructor() { this.state = options.suspended ? 'suspended' : 'running'; this.currentTime = 1; this.destination = node('destination'); this.nodes = []; contexts.push(this); }
    createGain() { const n = node('gain'); this.nodes.push(n); return n; }
    createOscillator() { const n = node('oscillator'); this.nodes.push(n); return n; }
    resume() { if (options.rejectResume) return Promise.reject(Error('blocked')); this.state = 'running'; return Promise.resolve(); }
  }
  const w = {
    volume: 72, paused: false,
    bind(event, callback) { (musicEvents[event] || (musicEvents[event] = [])).push(callback); },
    getSounds(callback) { if (options.deferSounds) w.soundsCallback = callback; else callback(options.noSong ? [] : [{ id: 23, title: 'Red in the Mirror', permalink_url: 'https://soundcloud.com/raikouno/red-in-the-mirror' }]); },
    getCurrentSound(callback) { callback(currentSound); },
    getVolume(callback) { if (options.deferVolume) volumeReads.push(callback); else callback(w.volume); },
    setVolume(value) { w.volume = value; log.push(['volume', value]); },
    skip(index) { log.push(['skip', index]); currentSound = { id: 23, title: 'Red in the Mirror' }; },
    play() { if (options.playThrows) throw Error('failed'); w.paused = false; log.push(['play']); },
    pause() { w.paused = true; log.push(['pause']); }
  };
  const elements = {
    'sc-widget': { getAttribute: () => options.blankFrame ? 'about:blank' : 'https://w.soundcloud.com/player/' },
    'sc-api': { addEventListener() {}, removeEventListener() {} }
  };
  const math = Object.create(Math); math.random = () => { throw Error('game RNG touched'); };
  const r = vm.createContext({ console, Promise, Math: math, AudioContext: options.unsupported ? undefined : AudioContext,
    S: { nightMode: false }, V67SET: { volSfx: .8, volMusic: .7 },
    document: { hidden: false, getElementById: id => elements[id], addEventListener(type, fn) { (handlers[type] || (handlers[type] = [])).push(fn); } },
    localStorage: { getItem: key => options.corrupt ? '{broken' : storage.get(key), setItem: (key, value) => storage.set(key, value) },
    setTimeout(fn) { timers.set(++timerId, fn); return timerId; }, clearTimeout(id) { timers.delete(id); },
    SC: { Widget: Object.assign(() => w, { Events: { PLAY: 'play', READY: 'ready', ERROR: 'error' } }) },
    initMusic() { log.push(['init']); },
    setMusic(value) { vm.runInContext('musicRequested=' + value + ';sfxMuted=' + !value, r); log.push(['setMusic', value]); }
  });
  r._testWidget = w;
  vm.runInContext('let AC=null; let sfxMuted=false; let scWidget=_testWidget; let scReady=true; let musicRequested=true;', r);
  if (options.noWidget) vm.runInContext('scWidget=null; SC=undefined;', r);
  vm.runInContext(source, r);
  return { r, api: r.TechOpsDayAudio, contexts, log, handlers, timers, storage, w, musicEvents, volumeReads,
    fire: type => (musicEvents[type] || []).forEach(fn => fn()),
    expire: () => Array.from(timers.values()).forEach(fn => fn()),
    sound: value => { currentSound = value; } };
}
(async () => {
  await test('load is silent, idempotent and creates no extra soundtrack player', () => {
    const f = fixture(); vm.runInContext(source, f.r); assert.equal(f.contexts.length, 0); assert.equal(f.log.length, 0); assert.equal(f.handlers.pointerdown.length, 1);
    assert.doesNotMatch(source, /new\s+Audio\(|setInterval\(|requestAnimationFrame\(|Math\.random\(/);
  });
  await test('SFX need an explicit gesture and reuse the global audio context', () => {
    const f = fixture(); assert.equal(f.api.unlock(), false); assert.equal(f.api.emit('inspect'), false); f.handlers.pointerdown[0]();
    assert.equal(f.api.emit('inspect'), true); assert.equal(f.contexts.length, 1); assert.equal(vm.runInContext('AC', f.r), f.contexts[0]);
  });
  await test('all six semantic cues are finite and voices stay bounded', () => {
    const f = fixture(); f.api.unlock({ userGesture: true });
    Object.keys(f.api.CUES).forEach(type => { f.contexts[0].currentTime += .06; assert.equal(f.api.emit(type), true); });
    assert.equal(f.api.diagnostics().played, 6); assert(f.api.diagnostics().voices <= 4);
    assert(f.log.filter(x => x[0] === 'stop' && Number.isFinite(x[1])).every(x => x[1] < 3));
  });
  await test('cue spam and unknown/prototype event names are ignored', () => {
    const f = fixture(); f.api.unlock({ userGesture: true }); assert(f.api.emit('clue')); assert.equal(f.api.emit('clue'), false);
    ['missing', 'toString', '__proto__'].forEach(type => assert.equal(f.api.emit(type), false));
  });
  await test('master mute silences active cues and blocks new effects', () => {
    const f = fixture(); f.api.unlock({ userGesture: true }); f.api.emit('repair'); vm.runInContext('sfxMuted=true;', f.r);
    assert.equal(f.api.emit('verify'), false); assert.equal(f.api.diagnostics().voices, 0);
  });
  await test('SFX preferences multiply master gain, persist separately and never change music choice', () => {
    const f = fixture(); f.api.setPreferences({ volume: .4 }); f.api.unlock({ userGesture: true }); f.api.emit('inspect');
    assert(Math.abs(f.contexts[0].nodes[0].gain.value - .32) < 1e-9); assert.equal(vm.runInContext('musicRequested', f.r), true);
    assert.deepEqual(Array.from(f.storage.keys()), [f.api.KEY]); f.api.setPreferences({ volume: NaN }); assert.equal(f.api.settings().volume, .4);
  });
  await test('zero SFX volume and unsupported browsers fail silently', () => {
    for (const options of [{ unsupported: true }, { corrupt: true }]) { const f = fixture(options); f.api.setPreferences({ volume: 0 }); assert.equal(f.api.unlock({ userGesture: true }), false); assert.equal(f.contexts.length, 0); }
  });
  await test('night mode and paused state suppress day effects', () => {
    const f = fixture(); f.api.unlock({ userGesture: true }); f.api.onContext('night'); assert.equal(f.api.emit('repair'), false);
    f.api.onContext('field'); f.r.S.paused = true; assert.equal(f.api.emit('repair'), false); f.r.S.paused = false; f.r.S.nightMode = true; assert.equal(f.api.emit('repair'), false);
  });
  await test('background hides all effects and ducks music without playing or pausing', () => {
    const f = fixture(); f.api.unlock({ userGesture: true }); f.api.emit('inspect'); f.w.paused = true;
    f.r.document.hidden = true; f.handlers.visibilitychange[0](); assert.equal(f.api.diagnostics().voices, 0); assert.equal(f.w.volume, 0);
    f.r.document.hidden = false; f.handlers.visibilitychange[0](); assert.equal(f.w.volume, 72); assert.equal(f.w.paused, true);
    assert.equal(f.log.filter(x => x[0] === 'play' || x[0] === 'pause').length, 0);
  });
  await test('nested duck reasons restore only after their own release, respecting pause', () => {
    const f = fixture(); f.api.duck('inspection', .6); f.api.duck('dialogue', .3); assert.equal(f.w.volume, 21.599999999999998);
    f.w.paused = true; f.api.resume('dialogue'); assert.equal(f.w.volume, 43.199999999999996); f.api.resume('inspection'); assert.equal(f.w.volume, 72); assert(f.w.paused);
  });
  await test('stale asynchronous volume reads cannot reapply a closed duck', () => {
    const f = fixture({ deferVolume: true }); f.api.duck('dialogue'); f.api.resume('dialogue'); f.volumeReads[0](72); assert.equal(f.w.volume, 72);
  });
  await test('music slider changed during duck determines restore volume', () => {
    const f = fixture(); f.api.duck('dialogue'); f.r.V67SET.volMusic = .25; f.api.resume('dialogue'); assert.equal(f.w.volume, 25);
  });
  await test('morning song requires gesture and explicit opt-in respects a mute choice', async () => {
    const f = fixture(); assert.equal((await f.api.playMorningTrack()).status, 'gesture-required');
    vm.runInContext('sfxMuted=true;musicRequested=false', f.r); assert.equal((await f.api.playMorningTrack({ userGesture: true })).status, 'muted'); assert.equal(f.log.length, 0);
  });
  await test('zero music volume never calls the global play toggle even on explicit opt-in', async () => {
    const f = fixture(); f.r.V67SET.volMusic = 0;
    assert.equal((await f.api.playMorningTrack({ userGesture: true, enableAudio: true })).status, 'muted');
    assert.equal(f.log.length, 0);
  });
  await test('song request is pending until real PLAY confirms the exact current track', async () => {
    const f = fixture(); let resolved = false; const promise = f.api.playMorningTrack({ userGesture: true }).then(value => { resolved = true; return value; });
    await Promise.resolve(); assert.equal(resolved, false); f.sound({ id: 8, title: 'Another song' }); f.fire('play'); await Promise.resolve(); assert.equal(resolved, false);
    f.sound({ id: 23, title: 'Red in the Mirror' }); f.fire('play'); const result = await promise;
    assert.equal(result.status, 'playing'); assert.equal(result.trackId, 23); assert.equal(result.source, 'existing-soundcloud-widget'); assert.equal(f.timers.size, 0);
  });
  await test('explicit Play music control may enable the existing master toggle', async () => {
    const f = fixture(); vm.runInContext('sfxMuted=true;musicRequested=false', f.r); const promise = f.api.playMorningTrack({ userGesture: true, enableAudio: true });
    f.fire('play'); assert.equal((await promise).status, 'playing'); assert.equal(vm.runInContext('musicRequested', f.r), true); assert(f.log.some(x => x[0] === 'setMusic' && x[1] === true));
  });
  await test('no widget, missing song, failed command and playback error never report heard', async () => {
    for (const [options, expected] of [[{ noWidget: true }, 'timeout'], [{ noSong: true }, 'not-found'], [{ playThrows: true }, 'unavailable'], [{}, 'unavailable']]) {
      const f = fixture(options), promise = f.api.playMorningTrack({ userGesture: true }); if (options.noWidget) f.expire(); else if (!Object.keys(options).length) f.fire('error');
      assert.equal((await promise).status, expected); assert.equal(f.r.S.flags, undefined);
    }
  });
  await test('mute while playback is pending prevents a success receipt', async () => {
    const f = fixture(), promise = f.api.playMorningTrack({ userGesture: true }); vm.runInContext('sfxMuted=true;musicRequested=false', f.r); f.fire('play'); assert.equal((await promise).status, 'muted');
  });
  await test('background cancels a pending song request and cannot award listening', async () => {
    const f = fixture(), promise = f.api.playMorningTrack({ userGesture: true }); f.r.document.hidden = true; f.handlers.visibilitychange[0](); f.fire('play'); assert.equal((await promise).status, 'cancelled');
  });
  await test('repeated attempts keep one event dispatcher and preserve another owner', async () => {
    const f = fixture(); let external = 0; f.w.bind('play', () => external++);
    for (let i = 0; i < 4; i++) { const promise = f.api.playMorningTrack({ userGesture: true }); f.fire('play'); assert.equal((await promise).status, 'playing'); }
    assert.equal(f.musicEvents.play.length, 2); assert.equal(external, 4);
  });
  await test('rejected WebAudio resume never replays stale cues', async () => {
    const f = fixture({ suspended: true, rejectResume: true }); assert.equal(f.api.unlock({ userGesture: true }), false); assert.equal(f.api.emit('repair'), false);
    await Promise.resolve(); await Promise.resolve(); assert.equal(f.api.diagnostics().played, 0);
  });
  console.log('Day audio: ' + count + ' tests passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
