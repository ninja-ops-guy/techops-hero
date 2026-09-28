/* Day incident sound: bounded UI cues and the existing user soundtrack widget.
 * No music assets, extra player, music loop, gameplay writes or story flags.
 * playMorningTrack resolves only after SoundCloud confirms PLAY for the song;
 * its caller owns the decision to record ordinary listening in campaign state. */
(function (root) {
  'use strict';
  if (!root || root.TechOpsDayAudio) return;
  const KEY = 'techops_hero_day_audio_v1';
  const CUES = Object.freeze({
    inspect: [[440, .00, .055], [660, .04, .06]],
    clue: [[587, .00, .08], [880, .07, .12]],
    reject: [[196, .00, .08], [165, .075, .1]],
    repair: [[330, .00, .05], [440, .055, .06], [554, .115, .08]],
    verify: [[523, .00, .08], [659, .085, .09], [784, .17, .15]],
    transition: [[220, .00, .09], [330, .065, .13]]
  });
  let preferences = { volume: .5 };
  try {
    const saved = JSON.parse(root.localStorage && root.localStorage.getItem(KEY) || 'null');
    if (saved && Number.isFinite(saved.volume)) preferences.volume = Math.max(0, Math.min(1, saved.volume));
  } catch (_) {}
  let context = null, bus = null, voices = [], resumePending = null;
  let surface = 'field', lastCue = Object.create(null), musicWidget = null;
  let duckGeneration = 0, baseVolume = null, duckMaster = null, pendingTrack = null;
  const ducks = new Map();
  const widgetBindings = new WeakMap();
  const stats = { played: 0, dropped: 0, unavailable: 0 };
  let lastPlayback = { status: 'idle' };
  const clamp = (v) => Math.max(0, Math.min(1, v));
  function hidden() { return !!(root.document && root.document.hidden); }
  function gameState() { return typeof S !== 'undefined' ? S : root.S; }
  function globallyMuted() { return (typeof sfxMuted !== 'undefined' && sfxMuted) || root.sfxMuted === true; }
  function master(kind) {
    const value = root.V67SET && root.V67SET[kind];
    return Number.isFinite(value) ? clamp(value) : 1;
  }
  function dayActive() {
    const state = gameState();
    return surface !== 'night' && surface !== 'title' && surface !== 'paused' &&
      !(state && (state.nightMode || state.gameOver || state.paused));
  }
  function enabled() { return dayActive() && !hidden() && !globallyMuted() && preferences.volume > 0 && master('volSfx') > 0; }
  function dispose(voice) {
    if (voice.disposed) return;
    voice.disposed = true;
    voice.nodes.forEach(node => {
      node.onended = null;
      try { if (node.stop) node.stop(); } catch (_) {}
      try { node.disconnect(); } catch (_) {}
    });
    voices = voices.filter(item => item !== voice);
  }
  function silence() { voices.slice().forEach(dispose); }
  function acquireContext() {
    let shared = typeof AC !== 'undefined' ? AC : null;
    if (!shared || shared.state === 'closed') {
      shared = context && context.state !== 'closed' ? context : null;
      if (!shared) {
        const Constructor = root.AudioContext || root.webkitAudioContext;
        if (!Constructor) return null;
        shared = new Constructor();
      }
      if (typeof AC !== 'undefined') AC = shared;
    }
    if (shared !== context) {
      silence();
      try { if (bus) bus.disconnect(); } catch (_) {}
      context = shared; bus = null;
    }
    if (!bus) { const next = context.createGain(); next.connect(context.destination); bus = next; }
    return context;
  }
  function unlock(options) {
    if (!options || options.userGesture !== true || !enabled()) return false;
    try {
      const ac = acquireContext();
      if (!ac) return false;
      if (ac.state === 'suspended' && !resumePending) {
        resumePending = Promise.resolve(ac.resume()).catch(() => false).finally(() => { resumePending = null; });
      }
      return ac.state === 'running';
    } catch (_) { stats.unavailable++; return false; }
  }
  function emit(type) {
    if (!Object.prototype.hasOwnProperty.call(CUES, type)) return false;
    if (!enabled() || !context || !bus || context.state !== 'running') { silence(); return false; }
    const t = context.currentTime;
    if (lastCue[type] !== undefined && t - lastCue[type] < .055) { stats.dropped++; return false; }
    lastCue[type] = t;
    voices.slice().forEach(voice => { if (voice.end <= t) dispose(voice); });
    while (voices.length >= 4) dispose(voices[0]);
    const notes = CUES[type], voice = { nodes: [], end: t + .4, disposed: false };
    voices.push(voice);
    try {
      bus.gain.setValueAtTime(preferences.volume * master('volSfx'), t);
      notes.forEach((note, index) => {
        const osc = context.createOscillator(); voice.nodes.push(osc);
        const gain = context.createGain(); voice.nodes.push(gain);
        const start = t + note[1], end = start + note[2];
        osc.type = type === 'reject' ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(note[0], start);
        gain.gain.setValueAtTime(.0001, start);
        gain.gain.linearRampToValueAtTime(.075, start + .008);
        gain.gain.exponentialRampToValueAtTime(.0001, end);
        osc.connect(gain); gain.connect(bus);
        if (index === notes.length - 1) { voice.end = end + .005; osc.onended = () => dispose(voice); }
        osc.start(start); osc.stop(end + .005);
      });
      stats.played++; return true;
    } catch (_) { dispose(voice); stats.unavailable++; return false; }
  }
  function settings() { return { volume: preferences.volume }; }
  function setPreferences(patch) {
    if (patch && Number.isFinite(patch.volume)) preferences.volume = clamp(patch.volume);
    if (!enabled()) silence();
    if (bus && context) bus.gain.setValueAtTime(preferences.volume * master('volSfx'), context.currentTime);
    try { if (root.localStorage) root.localStorage.setItem(KEY, JSON.stringify(preferences)); } catch (_) {}
    return settings();
  }
  function widget() {
    if (typeof scWidget !== 'undefined' && scWidget) musicWidget = scWidget;
    if (musicWidget) return musicWidget;
    // SC.Widget addresses the already-mounted iframe. Never create/load a player here.
    const frame = root.document && root.document.getElementById('sc-widget');
    if (!frame || !/soundcloud\.com/.test(frame.getAttribute('src') || '') || !root.SC || !root.SC.Widget) return null;
    try { musicWidget = root.SC.Widget(frame); return musicWidget; } catch (_) { return null; }
  }
  function factor() { return ducks.size ? Math.min.apply(null, Array.from(ducks.values())) : 1; }
  function syncDucks() {
    const w = widget(), generation = ++duckGeneration;
    if (!w || typeof w.setVolume !== 'function') return false;
    const apply = () => {
      if (generation !== duckGeneration || baseVolume === null) return;
      const currentMaster = master('volMusic');
      const sourceVolume = currentMaster !== duckMaster ? currentMaster * 100 : baseVolume;
      try { w.setVolume(sourceVolume * factor()); } catch (_) {}
      if (!ducks.size) { baseVolume = null; duckMaster = null; }
    };
    if (baseVolume !== null) { apply(); return true; }
    if (!ducks.size || typeof w.getVolume !== 'function') return false;
    try {
      w.getVolume(value => {
        if (generation !== duckGeneration || !ducks.size || !Number.isFinite(Number(value))) return;
        baseVolume = Math.max(0, Math.min(100, Number(value))); duckMaster = master('volMusic'); apply();
      });
      return true;
    } catch (_) { return false; }
  }
  function duck(reason, amount) {
    if (!reason) return false;
    const value = Number.isFinite(amount) ? clamp(amount) : .35;
    if (ducks.get(String(reason)) === value) return true;
    ducks.set(String(reason), value); return syncDucks();
  }
  function resume(reason) {
    if (!ducks.delete(String(reason || 'context'))) return false;
    return syncDucks(); // Volume only. Never undo the player's pause/mute choice.
  }
  function onContext(next) {
    const value = typeof next === 'string' ? next : next && next.type;
    if (typeof value !== 'string') return surface;
    surface = value;
    if (!enabled()) silence();
    if (surface === 'paused') duck('context', 0);
    else if (surface === 'dialogue') duck('context', .3);
    else if (surface === 'inspection' || surface === 'desktop') duck('context', .6);
    else resume('context');
    return surface;
  }
  function trackMatches(sound) {
    return !!sound && (/red\s+in\s+the\s+mirror/i.test(String(sound.title || '')) || /red[-_]?in[-_]?the[-_]?mirror/i.test(String(sound.permalink_url || '')));
  }
  function bindWidget(w) {
    if (widgetBindings.has(w)) return widgetBindings.get(w);
    const events = root.SC && root.SC.Widget && root.SC.Widget.Events;
    if (!events || !events.PLAY || typeof w.bind !== 'function' || typeof w.getCurrentSound !== 'function') return null;
    const binding = { active: null };
    w.bind(events.PLAY, () => { if (binding.active) binding.active.play(); });
    if (events.READY) w.bind(events.READY, () => { if (binding.active) binding.active.ready(); });
    if (events.ERROR) w.bind(events.ERROR, () => { if (binding.active) binding.active.error(); });
    widgetBindings.set(w, binding); return binding;
  }
  function playMorningTrack(options) {
    options = options || {};
    const result = status => Promise.resolve({ status });
    if (!options.userGesture) return result('gesture-required');
    if (hidden() || !dayActive()) return result('inactive');
    if (pendingTrack) pendingTrack.cancel();
    if (master('volMusic') <= 0) return result('muted');
    // Enabling audio is a separate, explicit music-control choice.
    if (options.enableAudio === true && typeof root.setMusic === 'function') root.setMusic(true);
    if (globallyMuted() || master('volMusic') <= 0) return result('muted');
    const requested = typeof musicRequested !== 'undefined' ? musicRequested : root.musicRequested;
    if (requested === false && options.enableAudio !== true) return result('muted');
    if (typeof root.initMusic === 'function') root.initMusic(true);
    return new Promise(resolve => {
      let finished = false, playingWidget = null, started = false, selected = null, binding = null, hooks = null;
      const doc = root.document, apiScript = doc && doc.getElementById('sc-api');
      const timeoutMs = Number.isFinite(options.timeoutMs) ? Math.max(250, Math.min(30000, options.timeoutMs)) : 12000;
      function finish(status, extra) {
        if (finished) return;
        finished = true; root.clearTimeout(timeout);
        if (apiScript && apiScript.removeEventListener) apiScript.removeEventListener('load', connect);
        // SoundCloud unbind removes all callbacks for an event. One shared
        // dispatcher per widget avoids both listener growth and owner removal.
        if (binding && binding.active === hooks) binding.active = null;
        if (pendingTrack && pendingTrack.cancel === cancel) pendingTrack = null;
        lastPlayback = Object.assign({ status }, extra || {}); resolve(Object.assign({}, lastPlayback));
      }
      function cancel() { finish('cancelled'); }
      const timeout = root.setTimeout(() => finish('timeout'), timeoutMs);
      pendingTrack = { cancel };
      function confirmedPlay() {
        if (finished || !started || !playingWidget || !selected) return;
        try {
          playingWidget.getCurrentSound(sound => {
            if (finished || !trackMatches(sound)) return;
            if (selected.id !== undefined && sound.id !== selected.id) return;
            if (hidden() || !dayActive() || globallyMuted() || master('volMusic') <= 0) return finish('muted');
            const requestedNow = typeof musicRequested !== 'undefined' ? musicRequested : root.musicRequested;
            if (requestedNow === false) return finish('cancelled');
            syncDucks();
            finish('playing', { title: String(sound.title || 'Red in the Mirror'), trackId: sound.id, source: 'existing-soundcloud-widget' });
          });
        } catch (_) { finish('unavailable'); }
      }
      function start() {
        if (finished || started) return;
        started = true;
        try {
          playingWidget.getSounds(sounds => {
            if (finished) return;
            const list = Array.isArray(sounds) ? sounds : [], index = list.findIndex(trackMatches);
            if (index < 0) return finish('not-found');
            selected = list[index];
            if (hidden() || !dayActive() || globallyMuted() || master('volMusic') <= 0) return finish('muted');
            try {
              playingWidget.skip(index);
              // Existing global music volume remains the authority.
              if (ducks.size) { baseVolume = master('volMusic') * 100; duckMaster = master('volMusic'); }
              playingWidget.setVolume(master('volMusic') * 100 * factor());
              playingWidget.play();
            } catch (_) { finish('unavailable'); }
          });
        } catch (_) { finish('unavailable'); }
      }
      function connect() {
        if (finished || playingWidget) return;
        playingWidget = widget();
        if (!playingWidget) return;
        try {
          binding = bindWidget(playingWidget);
          if (!binding) return finish('unavailable');
          hooks = { play: confirmedPlay, ready: start, error: () => finish('unavailable') };
          binding.active = hooks;
          // getSounds is supported on an already-ready widget; READY calls
          // start otherwise. No polling or new runtime loop is necessary.
          if (typeof scReady === 'undefined' || scReady) start();
        } catch (_) { finish('unavailable'); }
      }
      if (apiScript && apiScript.addEventListener) apiScript.addEventListener('load', connect, { once: true });
      connect();
    });
  }
  function gesture() { if (dayActive()) unlock({ userGesture: true }); }
  if (root.document && root.document.addEventListener) {
    root.document.addEventListener('pointerdown', gesture, { passive: true, capture: true });
    root.document.addEventListener('keydown', gesture, { passive: true, capture: true });
    root.document.addEventListener('visibilitychange', () => {
      if (hidden()) { silence(); duck('background', 0); if (pendingTrack) pendingTrack.cancel(); }
      else resume('background');
    });
    root.document.addEventListener('click', () => { if (!enabled()) silence(); });
  }
  root.TechOpsDayAudio = {
    VERSION: 1, KEY, CUES, emit, unlock, silence, onContext, setPreferences, configure: setPreferences, settings,
    playMorningTrack, duck, resume,
    diagnostics: () => ({ played: stats.played, dropped: stats.dropped, unavailable: stats.unavailable, voices: voices.length,
      context: surface, contextState: context ? context.state : 'not-created', duckReasons: Array.from(ducks.keys()),
      playback: Object.assign({}, lastPlayback) })
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
