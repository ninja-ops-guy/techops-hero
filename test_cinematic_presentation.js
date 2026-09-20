'use strict';

// Behavioral DOM/media fixtures. These exercise production callbacks, not real
// decoding, physical touch or assistive-technology certification.
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

function harness({supported = true, reducedMotion = false} = {}) {
  const events = () => ({
    listeners: new Map(),
    addEventListener(name, fn) { if (!this.listeners.has(name)) this.listeners.set(name, new Set()); this.listeners.get(name).add(fn); },
    removeEventListener(name, fn) { this.listeners.get(name)?.delete(fn); },
    emit(name, value = {}) { for (const fn of [...(this.listeners.get(name) || [])]) fn(value); }
  });
  const doc = Object.assign(events(), {hidden: false});
  const rafs = new Map(); let serial = 0, time = 100, reloads = 0;
  const trace = [];
  function element(tag) {
    const classes = new Set();
    const el = Object.assign(events(), {tagName: tag.toUpperCase(), children: [], style: {}, dataset: {}, disabled: false, hidden: false, textContent: '', attributes: {},
      classList: {add(...values) {values.forEach(v => classes.add(v));}, remove(...values) {values.forEach(v => classes.delete(v));}, contains(value) {return classes.has(value);}, toggle(value, enabled) {if (enabled) classes.add(value); else classes.delete(value);}},
      setAttribute(name, value) {this.attributes[name] = value; if (name === 'id') this.id = value; if (name === 'class') {classes.clear(); value.split(/\s+/).forEach(c => classes.add(c));}},
      removeAttribute(name) {delete this.attributes[name]; if (name === 'src') delete this.src;},
      appendChild(child) {this.children.push(child); child.parentNode = this; return child;},
      insertBefore(child, before) {this.children.splice(this.children.indexOf(before), 0, child); child.parentNode = this;},
      removeChild(child) {this.children.splice(this.children.indexOf(child), 1); child.parentNode = null;},
      remove() {this.parentNode?.removeChild(this);},
      focus() {doc.activeElement = this;},
      querySelectorAll(selector) {const matches = node => selector[0] === '#' ? node.id === selector.slice(1) : selector[0] === '.' ? node.classList.contains(selector.slice(1)) : node.tagName.toLowerCase() === selector; return this.children.flatMap(c => [...(matches(c) ? [c] : []), ...c.querySelectorAll(selector)]);},
      querySelector(selector) {return this.querySelectorAll(selector)[0] || null;},
      getBoundingClientRect() {return {toJSON() {return {width: 960, height: 540};}};}
    });
    Object.defineProperty(el, 'className', {set(value) {el.setAttribute('class', value);}});
    Object.defineProperty(el, 'isConnected', {get() {return !!this.parentNode;}});
    Object.defineProperty(el, 'innerHTML', {set(html) {
      this.markup = html; this.children.forEach(c => c.parentNode = null); this.children = [];
      const stack = [this];
      for (const match of html.matchAll(/<(\/)?([a-z0-9]+)([^>]*)>/gi)) {
        const [, closing, name, attrs] = match;
        if (closing) {if (stack.length > 1) stack.pop(); continue;}
        const child = element(name);
        for (const attr of attrs.matchAll(/([\w-]+)="([^"]*)"/g)) child.setAttribute(attr[1], attr[2]);
        child.hidden = /\bhidden\b/.test(attrs); stack.at(-1).appendChild(child);
        if (!/^(br|hr|img|input)$/i.test(name)) stack.push(child);
      }
    }, get() {return this.markup || '';}});
    if (tag === 'canvas') {el.clientWidth = 960; el.clientHeight = 540; el.width = 960; el.height = 420; const drawing = {canvas: el, createLinearGradient() {return {addColorStop() {}};}}; el.getContext = () => new Proxy(drawing, {get(target, property) {return property in target ? target[property] : () => {};}});}
    if (tag === 'video') Object.assign(el, {currentTime: 0, readyState: 2, networkState: 1, buffered: {length: 0}, paused: true, ended: false, playCalls: 0,
      canPlayType() {return supported ? 'probably' : '';}, load() {}, pause() {this.paused = true;}, play() {this.paused = false; this.playCalls++; this.onplaying?.(); return Promise.resolve();}});
    return el;
  }
  doc.body = element('body'); doc.head = element('head'); doc.body.style.overflow = 'auto'; doc.documentElement = element('html'); doc.documentElement.appendChild(doc.head); doc.documentElement.appendChild(doc.body);
  doc.createElement = element; doc.getElementById = id => doc.documentElement.querySelector('#' + id);
  const launch = element('button'); launch.id = 'launch'; doc.body.appendChild(launch); launch.focus();
  const root = Object.assign(events(), {console, document: doc, navigator: {maxTouchPoints: 0}, MediaSource: {isTypeSupported: () => supported}, performance: {now: () => time},
    matchMedia: () => ({matches: reducedMotion}), requestAnimationFrame(fn) {rafs.set(++serial, fn); return serial;}, cancelAnimationFrame(id) {rafs.delete(id);},
    setTimeout(fn, delay) {if (!delay) queueMicrotask(fn); return ++serial;}, clearTimeout() {}, setInterval: () => ++serial, clearInterval() {},
    getComputedStyle: () => ({visibility: 'visible'}),
    Image: class {set src(value) {this._src = value; this.complete = true; this.naturalWidth = 384; queueMicrotask(() => this.onload?.());} get src() {return this._src;}},
    S: {inDialog: false, meta: {_v736: {m: 8, done: false}}}, NM: {_v736: {m: 8}, enemies: [], clear: false},
    localStorage: {setItem() {}}, TechOpsGoodDogsCampaignState: {completeReturn() {trace.push('semantic');}},
    save() {trace.push('save'); return true;}, location: {reload() {trace.push('reload'); reloads++;}}
  });
  root.window = root; root.globalThis = root; vm.createContext(root);
  return {root, doc, launch, trace, rafs,
    load(file) {vm.runInContext(fs.readFileSync(file, 'utf8'), root, {filename: file});},
    step(ms = 16) {time += ms; const queued = [...rafs.values()]; rafs.clear(); queued.forEach(fn => fn(time));},
    visibility(hidden) {doc.hidden = hidden; doc.emit('visibilitychange');},
    get reloads() {return reloads;}
  };
}
const event = (extra = {}) => Object.assign({preventDefault() {}, stopPropagation() {}, stopImmediatePropagation() {}, key: ''}, extra);
const flush = async () => {for (let i = 0; i < 8; i++) await Promise.resolve();};

(async () => {
  {
    const h = harness({supported: false}); h.load('good_dogs_cutscenes_v2_2.js'); let writes = 0;
    const result = h.root.GoodDogsCutscenes.play('GD_CUT_01', {onStateWrite() {writes++;}});
    const overlay = h.doc.getElementById('good-dogs-cutscene-overlay'), video = overlay.querySelector('video'), skip = overlay.querySelector('.gd-film-skip');
    assert.strictEqual(video.src, undefined, 'unsupported decoder must not request the movie');
    assert.match(overlay.querySelector('.gd-film-status').textContent, /cannot play/);
    assert.strictEqual(h.doc.activeElement, skip);
    assert.strictEqual(writes, 0);
    h.visibility(true); skip.emit('click', event()); assert.strictEqual(writes, 0, 'hidden user controls cannot settle progression'); h.visibility(false);
    assert.strictEqual(overlay.querySelector('.gd-film-play').disabled, true, 'visibility cannot enable unsupported playback');
    const skipHandler = [...skip.listeners.get('click')][0], lateEnded = video.onended;
    skipHandler(event()); skipHandler(event()); lateEnded(); h.step(); await flush();
    assert.strictEqual((await result).status, 'USER_SKIPPED'); assert.strictEqual(writes, 1);
    assert.strictEqual(h.doc.activeElement, h.launch, 'movie restores the initiating control');
    assert.strictEqual(h.doc.listeners.get('visibilitychange').size, 0);
  }
  {
    const h = harness(); h.load('good_dogs_cutscenes_v2_2.js'); let writes = 0;
    const result = h.root.GoodDogsCutscenes.play('GD_CUT_04', {onStateWrite() {writes++;}});
    const overlay = h.doc.getElementById('good-dogs-cutscene-overlay'), video = overlay.querySelector('video'), pause = overlay.querySelector('.gd-film-pause'), play = overlay.querySelector('.gd-film-play');
    pause.emit('click', event()); assert.strictEqual(video.paused, true); assert.strictEqual(h.doc.activeElement, play);
    h.doc.emit('keydown', event({key: 'Tab', shiftKey: true})); assert.strictEqual(h.doc.activeElement, overlay.querySelector('.gd-film-skip'));
    play.emit('click', event()); h.visibility(true); video.ended = true; video.onended(); await flush();
    assert.strictEqual(writes, 0, 'background ended event cannot silently advance story');
    h.visibility(false); await flush(); assert.strictEqual(writes, 0, 'returning to tab requires explicit resume');
    play.emit('click', event()); h.step(); await flush(); assert.strictEqual((await result).status, 'COMPLETED'); assert.strictEqual(writes, 1);
  }
  {
    const h = harness(); h.load('good_dogs_home_scene.js');
    const result = h.root.TechOpsGoodDogsHomeScene.play(); await flush();
    const overlay = h.doc.getElementById('good-dogs-home-scene'), next = overlay.querySelector('#gd-home-next'), skip = overlay.querySelector('#gd-home-skip'), staleSkip = skip.onclick;
    h.root.emit('keydown', event({key: 'Tab', shiftKey: true})); assert.strictEqual(h.doc.activeElement, skip);
    h.step(); const shot = h.root.__goodDogsHomeScene.shot; h.visibility(true); next.onclick(); h.step(120000);
    assert.strictEqual(h.root.__goodDogsHomeScene.shot, shot); assert.strictEqual(h.rafs.size, 0, 'home animation suspends in background');
    h.visibility(false); next.onclick(); next.onclick(); next.onclick(); await result;
    const exit = h.root.__goodDogsHomeSceneExit; assert.strictEqual(exit.status, 'COMPLETED'); staleSkip();
    assert.strictEqual(h.root.__goodDogsHomeSceneExit, exit, 'late home skip cannot replace completed outcome'); assert.strictEqual(h.doc.activeElement, h.launch);
  }
  {
    const h = harness(); h.load('good_dogs_home_scene.js'); const result = h.root.TechOpsGoodDogsHomeScene.play(); await flush();
    const skip = h.doc.getElementById('good-dogs-home-scene').querySelector('#gd-home-skip').onclick; skip(); const exit = h.root.__goodDogsHomeSceneExit; skip(); await result;
    assert.strictEqual(exit.status, 'USER_SKIPPED'); assert.strictEqual(h.root.__goodDogsHomeSceneExit, exit);
  }
  {
    const h = harness(); h.load('good_boys_earthfall_ending.js'); const api = h.root.TechOpsGoodBoysEarthfallEnding;
    const first = h.doc.getElementById('gbe-next'), staleNext = [...first.listeners.get('click')][0]; staleNext(event()); staleNext(event());
    assert.strictEqual(api.acceptance().scene, 2, 'a stale next button cannot advance a replacement scene');
    h.visibility(true); assert.strictEqual(api.skip(), false); assert.strictEqual(h.trace.length, 0); h.visibility(false);
    h.doc.emit('keydown', event({key: 'Tab', code: 'Tab', shiftKey: true})); assert.strictEqual(h.doc.activeElement.id, 'gbe-skip');
    assert.strictEqual(api.skip(), true); assert.strictEqual(api.skip(), false); assert.deepStrictEqual(h.trace, ['semantic', 'save', 'reload']); assert.strictEqual(h.reloads, 1);
    assert.strictEqual(h.doc.activeElement, h.launch);
    assert.strictEqual(api.replay(), true); h.trace.length = 0; h.root.save = () => {h.trace.push('save'); return false;};
    assert.strictEqual(api.skip(), false); api.tick(); assert.strictEqual(api.acceptance().running, true); assert.strictEqual(api.acceptance().complete, false);
    assert.match(h.doc.getElementById('good-boys-earthfall-cine').querySelector('.gbe-error').textContent, /could not be saved/);
    assert.strictEqual(api.acceptance().scene, 4); h.root.save = () => {h.trace.push('save'); return true;};
    assert.strictEqual(api.next(), true); assert.deepStrictEqual(h.trace, ['semantic', 'save', 'save', 'reload'], 'save retry must not repeat narrative settlement');
    assert.strictEqual(h.reloads, 2); assert.strictEqual(api.next(), false);
  }
  {
    const h = harness(); delete h.root.document; h.load('good_boys_earthfall_ending.js');
    assert.strictEqual(h.root.S.meta._v736.done, false, 'missing presentation cannot automatically complete Earthfall');
    assert.deepStrictEqual(h.trace, []);
  }
  {
    const h = harness({reducedMotion: true});
    h.root.GOOD_BOYS_CUTSCENE_PLATES = {warden_shuttle_bay: 'bay.png', earthfall: 'earthfall.png', crash_site: 'crash.png', waldo_house: 'home.png'};
    h.load('good_boys_earthfall_ending.js'); const api = h.root.TechOpsGoodBoysEarthfallEnding;
    h.step(); const firstFrame = api.acceptance().lastFrame; h.step(5000);
    assert.strictEqual(api.acceptance().lastFrame, firstFrame, 'reduced motion holds an authored shuttle pose');
    api.next(); assert.match(h.doc.getElementById('good-boys-earthfall-cine').style.backgroundImage, /earthfall\.png/, 'scene transitions use the matching authored plate');
    h.visibility(true); h.step(5000); assert.strictEqual(h.rafs.size, 0, 'Earthfall animation suspends in background');
    h.visibility(false); assert.strictEqual(h.rafs.size, 1);
  }
  console.log('Cinematic modal focus, background pause, idempotent skip and save recovery: PASS');
})().catch(error => {console.error(error); process.exitCode = 1;});
