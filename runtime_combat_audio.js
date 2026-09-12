/* Event-driven street-combat feedback. Owns only an SFX bus and preferences.
 * No soundtrack routing, damage, rewards, story flags, frame loop or polling.
 * Samples are synthesized locally; nothing is downloaded or sent off-device. */
(function (root) {
  'use strict';
  if (!root || root.TechOpsCombatAudio) return;
  const KEY = 'techops_hero_combat_audio_v1';
  const MAX_VOICES = 8;
  const CUES = Object.freeze({
    windup:   { label:'SWING', body:220, end:100, noise:.025, filter:1800, length:.075, gain:.35, priority:0 },
    whiff:    { label:'MISS', body:160, end:90, noise:.035, filter:1100, length:.09, gain:.25, priority:0 },
    grab:     { label:'GRAB', body:145, end:85, noise:.05, filter:900, length:.09, gain:.7, priority:1 },
    jab:      { label:'HIT', body:150, end:58, noise:.085, filter:1800, length:.1, gain:.9, priority:1 },
    cross:    { label:'CROSS', body:125, end:45, noise:.1, filter:2100, length:.13, gain:1, priority:1 },
    launcher: { label:'RISING FINISH', body:90, end:210, noise:.09, filter:2300, length:.18, gain:1, priority:3 },
    air:      { label:'AIR HIT', body:210, end:95, noise:.065, filter:2200, length:.09, gain:.85, priority:1 },
    throw:    { label:'THROW', body:160, end:42, noise:.075, filter:1200, length:.16, gain:1, priority:2 },
    collision:{ label:'CROWD IMPACT', body:100, end:34, noise:.1, filter:1300, length:.16, gain:1, priority:2 },
    wall:     { label:'WALL IMPACT', body:82, end:30, noise:.12, filter:1600, length:.19, gain:1, priority:2 },
    slam:     { label:'SLAM', body:70, end:28, noise:.12, filter:1000, length:.2, gain:1, priority:3 },
    guard:    { label:'GUARDED', body:580, end:260, noise:.055, filter:3200, length:.09, gain:.7, priority:2 },
    block:    { label:'BLOCK', body:740, end:360, noise:.05, filter:3500, length:.1, gain:.8, priority:2 },
    hurt:     { label:'HURT', body:180, end:55, noise:.07, filter:1500, length:.14, gain:.9, priority:3 },
    escape:   { label:'GRIP LOST', body:160, end:90, noise:.025, filter:700, length:.09, gain:.5, priority:1 },
    ko:       { label:'KNOCKOUT', body:310, end:465, noise:.025, filter:1300, length:.2, gain:.8, priority:4 }
  });
  let preferences = { volume:.65, captions:false };
  try {
    const saved = JSON.parse(root.localStorage && root.localStorage.getItem(KEY) || 'null');
    if (saved && Number.isFinite(saved.volume)) preferences.volume = Math.max(0, Math.min(1, saved.volume));
    if (saved && typeof saved.captions === 'boolean') preferences.captions = saved.captions;
  } catch (_) { /* Unavailable/corrupt settings must not prevent play. */ }
  let context = null, bus = null, limiter = null, noiseBuffer = null;
  let voices = [], seen = new WeakMap(), resumePending = null;
  const stats = { played:0, dropped:0, unavailable:0 };
  function street(n) { return !!n && Array.isArray(n.enemies) && typeof n.district === 'string' && !n._v736 && !n._sector04 && n.district !== 'waldo'; }
  function world() { try { return typeof NM !== 'undefined' ? NM : root.NM || null; } catch (_) { return root.NM || null; } }
  function state() { try { return typeof S !== 'undefined' ? S : root.S || null; } catch (_) { return root.S || null; } }
  function allowed(n) {
    const s=state(),d=root.TechOpsPresentationDirector;
    return street(n) && !n.drive && (!!s && !!s.nightMode && (s.nightMode===true || s.nightMode===n) && !s.inDialog && !s.inBattle && !s.paused && !s.gameOver) && !(d && typeof d.isBlocking==='function' && d.isBlocking());
  }
  function globallyMuted() {
    // game.js uses a classic-script lexical binding, not window.sfxMuted.
    return (typeof sfxMuted !== 'undefined' && sfxMuted) || root.sfxMuted === true;
  }
  function masterVolume() { const value=root.V67SET&&root.V67SET.volSfx; return typeof value==='number'&&Number.isFinite(value)?Math.max(0,Math.min(1,value)):1; }
  function hidden() { return !!(root.document && root.document.hidden); }
  function enabled() { return preferences.volume > 0 && masterVolume() > 0 && !globallyMuted() && !hidden(); }
  function disposeVoice(v) {
    if (v.disposed) return;
    v.disposed = true;
    v.sources.forEach(s => { try { s.onended = null; s.stop(); } catch (_) {} });
    v.nodes.forEach(node => { try { node.disconnect(); } catch (_) {} });
    voices = voices.filter(item => item !== v);
  }
  function silence() { voices.slice().forEach(disposeVoice); }
  function resetBus() {
    silence();
    [bus, limiter].forEach(node => { try { if (node) node.disconnect(); } catch (_) {} });
    bus = limiter = noiseBuffer = null;
  }
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
    if (shared !== context) { resetBus(); context = shared; }
    if (!bus) {
      // Publish the completed graph only; a partial construction can be retried.
      let gain, compressor;
      try {
        gain = context.createGain(); compressor = context.createDynamicsCompressor();
        compressor.threshold.value = -18; compressor.knee.value = 12;
        compressor.ratio.value = 8; compressor.attack.value = .003; compressor.release.value = .08;
        gain.connect(compressor); compressor.connect(context.destination);
        gain.gain.value = preferences.volume;
        bus = gain; limiter = compressor;
      } catch (error) {
        [gain, compressor].forEach(node => { try { if (node) node.disconnect(); } catch (_) {} });
        throw error;
      }
    }
    return context;
  }
  function unlock() {
    if (!enabled()) {silence();return false;}
    try {
      const ac = acquireContext(); if (!ac) return false;
      if (ac.state === 'suspended' && !resumePending) {
        // Resume only the context, never replay the action that requested it.
        resumePending = Promise.resolve(ac.resume()).catch(() => false).finally(() => { resumePending = null; });
      }
      return ac.state === 'running';
    } catch (_) { stats.unavailable++; return false; }
  }
  function noise(ac) {
    if (noiseBuffer) return noiseBuffer;
    const buffer = ac.createBuffer(1, Math.ceil(ac.sampleRate * .22), ac.sampleRate);
    const data = buffer.getChannelData(0);
    // Deterministic local noise avoids touching gameplay's Math.random stream.
    let seed = 0x247a;
    for (let i=0; i<data.length; i++) { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; data[i] = (seed / 2147483648 - 1); }
    noiseBuffer = buffer;
    return buffer;
  }
  function synth(cue, position) {
    if (!enabled() || !context || !bus || context.state !== 'running') { silence(); return false; }
    const t = context.currentTime;
    voices.slice().forEach(v => { if (v.end <= t) disposeVoice(v); });
    if (voices.length >= MAX_VOICES) {
      const lowest = voices.reduce((a,b) => a.priority <= b.priority ? a : b);
      if (lowest.priority > cue.priority) { stats.dropped++; return false; }
      disposeVoice(lowest);
    }
    const voice = { priority:cue.priority, end:t+cue.length+.005, sources:[], nodes:[], disposed:false };
    voices.push(voice);
    try {
      bus.gain.setValueAtTime(preferences.volume * masterVolume(), t);
      let destination=bus;
      if(typeof context.createStereoPanner==='function'){
        const pan=context.createStereoPanner();voice.nodes.push(pan);
        pan.pan.setValueAtTime(Math.max(-.75,Math.min(.75,Number(position)||0)),t);
        pan.connect(bus);destination=pan;
      }
      const tone = context.createOscillator(); voice.sources.push(tone); voice.nodes.push(tone);
      const body = context.createGain(); voice.nodes.push(body);
      tone.type = cue === CUES.block || cue === CUES.guard ? 'triangle' : 'sine';
      tone.frequency.setValueAtTime(cue.body, t);
      tone.frequency.exponentialRampToValueAtTime(cue.end, t+cue.length);
      body.gain.setValueAtTime(.0001, t); body.gain.linearRampToValueAtTime(.12*cue.gain, t+.004);
      body.gain.exponentialRampToValueAtTime(.0001, t+cue.length);
      tone.connect(body); body.connect(destination);
      const source = context.createBufferSource(); voice.sources.push(source); voice.nodes.push(source);
      const filter = context.createBiquadFilter(); voice.nodes.push(filter);
      const envelope = context.createGain(); voice.nodes.push(envelope);
      source.buffer = noise(context); filter.type = 'lowpass'; filter.frequency.value = cue.filter;
      envelope.gain.setValueAtTime(cue.noise * cue.gain, t);
      envelope.gain.exponentialRampToValueAtTime(.0001, t+cue.length);
      source.connect(filter); filter.connect(envelope); envelope.connect(destination);
      // Both sources share one bounded voice and are disconnected on completion.
      tone.onended = () => disposeVoice(voice);
      tone.start(t); source.start(t); tone.stop(voice.end); source.stop(voice.end);
      stats.played++; return true;
    } catch (_) { disposeVoice(voice); stats.unavailable++; return false; }
  }
  function emit(n, event) {
    if (!street(n) || !event || !Object.prototype.hasOwnProperty.call(CUES, event.type)) return false;
    let record = seen.get(n);
    if (!record || record.state !== n._nightCombat) {
      record = { state:n._nightCombat, serial:-1, last:Object.create(null) }; seen.set(n, record);
    }
    if (!Number.isFinite(event.id) || event.id <= record.serial) return false;
    record.serial = event.id;
    if(!allowed(n)){silence();return false;}
    if(event.guarded)return false; // The preceding guard contact already sounded.
    const cue = CUES[event.type];
    // Crowds may generate many simultaneous contacts. Keep the first of each
    // type in a 25ms simulation window; distinct critical events still sound.
    if (Number.isFinite(event.time) && record.last[event.type] !== undefined && event.time-record.last[event.type] < 25) {
      stats.dropped++; return false;
    }
    record.last[event.type] = event.time;
    return synth(cue, Number.isFinite(event.x)&&Number.isFinite(n.x)?(event.x-n.x-(Number(n.w)||22)/2)/400:0);
  }
  function configure(patch) {
    if (patch && Number.isFinite(patch.volume)) preferences.volume = Math.max(0,Math.min(1,patch.volume));
    if (patch && typeof patch.captions === 'boolean') preferences.captions = patch.captions;
    if (!enabled()) silence();
    try { if (bus && context) bus.gain.setValueAtTime(preferences.volume * masterVolume(), context.currentTime); } catch (_) {}
    try { if (root.localStorage) root.localStorage.setItem(KEY, JSON.stringify(preferences)); } catch (_) {}
    return settings();
  }
  function settings() { return { volume:preferences.volume, captions:preferences.captions }; }
  function caption(n) {
    if (!preferences.captions || !allowed(n) || !n._nightCombat || hidden()) return '';
    const c = n._nightCombat;
    const recent = c.events.filter(e => !e.guarded && Object.prototype.hasOwnProperty.call(CUES,e.type) && e.type !== 'windup' && c.time-e.time >= 0 && c.time-e.time <= 600);
    if (!recent.length) return '';
    const last = recent[recent.length-1];
    return '[' + CUES[last.type].label + ']';
  }
  function openSettings(back) {
    if (typeof root.dlg !== 'function') return false;
    const p = settings();
    root.dlg('COMBAT // SOUND & CAPTIONS', 'Fighting effects: <b>'+Math.round(p.volume*100)+'%</b><br>Captions: <b>'+(p.captions?'ON':'OFF')+'</b><br><br>These controls affect street fighting only. The existing audio toggle still mutes all effects. Music is unchanged.', [
      {t:'Effects: OFF',f:()=>{configure({volume:0});openSettings(back);}},
      {t:'Effects: QUIET',f:()=>{configure({volume:.35});unlock();openSettings(back);}},
      {t:'Effects: STANDARD',f:()=>{configure({volume:.65});unlock();openSettings(back);}},
      {t:'Effects: FULL',f:()=>{configure({volume:1});unlock();openSettings(back);}},
      {t:p.captions?'Turn captions off':'Turn captions on',f:()=>{configure({captions:!settings().captions});openSettings(back);}},
      {t:'Back',f:typeof back==='function'?back:()=>{if(typeof root.closeDlg==='function')root.closeDlg();}}
    ]); return true;
  }
  function gesture() { if (allowed(world())) unlock(); }
  if (root.document && root.document.addEventListener) {
    root.document.addEventListener('pointerdown',gesture,{passive:true,capture:true});
    root.document.addEventListener('keydown',gesture,{passive:true,capture:true});
    root.document.addEventListener('visibilitychange',()=>{if(hidden())silence();});
  }
  root.TechOpsCombatAudio = { VERSION:2, KEY, MAX_VOICES, CUES, emit, unlock, silence, configure, settings, caption, openSettings,
    diagnostics:()=>({played:stats.played,dropped:stats.dropped,unavailable:stats.unavailable,voices:voices.length,contextState:context?context.state:'not-created'}) };
})(typeof globalThis !== 'undefined' ? globalThis : this);
