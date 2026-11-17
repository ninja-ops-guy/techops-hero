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
  const rafs = new Map(), timeouts = new Map(); let serial = 0, time = 100, reloads = 0;
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
      contains(node) {return this === node || this.children.some(child => child.contains(node));},
      focus() {doc.activeElement = this;},
      querySelectorAll(selector) {const matches = node => selector[0] === '#' ? node.id === selector.slice(1) : selector[0] === '.' ? node.classList.contains(selector.slice(1)) : node.tagName.toLowerCase() === selector; return this.children.flatMap(c => [...(matches(c) ? [c] : []), ...c.querySelectorAll(selector)]);},
      querySelector(selector) {return this.querySelectorAll(selector)[0] || null;},
      getBoundingClientRect() {return {toJSON() {return {width: 960, height: 540};}};}
    });
    let copy = ''; Object.defineProperty(el, 'textContent', {get() {return copy;}, set(value) {copy = String(value); this.children.forEach(child => child.parentNode = null); this.children = [];}});
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
    setTimeout(fn, delay) {const id = ++serial; if (!delay) queueMicrotask(fn); else timeouts.set(id, fn); return id;}, clearTimeout(id) {timeouts.delete(id);}, setInterval: () => ++serial, clearInterval() {},
    innerWidth: 960, innerHeight: 540, checkDayEnd() {},
    getComputedStyle: () => ({display: "block", visibility: 'visible'}),
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
    runTimeouts() {const pending = [...timeouts.values()]; timeouts.clear(); pending.forEach(fn => fn());},
    get reloads() {return reloads;}
  };
}
const event = (extra = {}) => Object.assign({preventDefault() {}, stopPropagation() {}, stopImmediatePropagation() {}, key: ''}, extra);
const flush = async () => {for (let i = 0; i < 8; i++) await Promise.resolve();};


(async () => {
  const h = harness(); const calls=[]; let muted=false, volume=0.6, available=true;
  const values = {}; h.root.localStorage={getItem(k){return values[k]||null;},setItem(k,v){values[k]=v;}};
  h.root.V67SET={volMusic:volume};
  h.root.TechOpsDayAudio={beginCinematic(k){calls.push(['begin',k]);return available;},resume(k){calls.push(['release',k]);return true;}};
  h.load('good_dogs_cutscenes_v2_2.js'); let writes=0;
  const result=h.root.GoodDogsCutscenes.play('GD_CUT_01',{onStateWrite(){writes++;}});
  const overlay=h.doc.getElementById('good-dogs-cutscene-overlay');
  const video=overlay.querySelector('video'), sound=overlay.querySelector('.gd-film-sound'), cc=overlay.querySelector('.gd-film-cc');
  const status=overlay.querySelector('.gd-film-status'), pause=overlay.querySelector('.gd-film-pause'), play=overlay.querySelector('.gd-film-play');
  assert.strictEqual(video.muted,true); assert.strictEqual(cc.attributes['aria-disabled'],'true');
  cc.emit('click',event()); assert.match(status.textContent,/not available/); assert.equal(writes,0);
  sound.focus(); h.doc.emit('keydown',event({key:'Tab'})); assert.equal(h.doc.activeElement,cc);
  h.root.sfxMuted=true; sound.emit('click',event()); assert.equal(video.muted,true); assert.equal(calls.length,0);
  h.root.sfxMuted=false; available=false; sound.emit('click',event()); assert.equal(video.muted,true);
  available=true; sound.emit('click',event()); assert.equal(video.muted,false); assert.equal(video.volume,.6);
  assert.equal(calls.at(-1)[0],'begin'); assert.equal(sound.attributes['aria-pressed'],'true');
  h.root.V67SET.volMusic=.25; h.doc.emit('techops-audio-change'); assert.equal(video.volume,.25); assert.equal(video.muted,false);
  h.root.sfxMuted=true; h.doc.emit('techops-audio-change'); assert.equal(video.muted,true); assert.equal(calls.at(-1)[0],'release'); assert.equal(writes,0);
  h.root.sfxMuted=false; sound.emit('click',event()); assert.equal(video.muted,false);
  pause.emit('click',event()); assert.equal(video.muted,true); assert.equal(calls.at(-1)[0],'release');
  play.emit('click',event()); assert.equal(video.muted,true); sound.emit('click',event()); assert.equal(video.muted,false);
  h.visibility(true); assert.equal(video.muted,true); assert.equal(calls.at(-1)[0],'release'); assert.equal(writes,0);
  h.visibility(false); play.emit('click',event()); sound.emit('click',event()); assert.equal(video.muted,false);
  overlay.querySelector('.gd-film-skip').emit('click',event()); h.step(); await flush();
  assert.equal((await result).status,'USER_SKIPPED'); assert.equal(writes,1); assert.equal(calls.at(-1)[0],'release'); assert.equal(h.doc.activeElement,h.launch);

  // Fixture-only track establishes control and failure behavior; no invented caption content ships.
  h.root.GoodDogsCutscenes.clips.GD_CUT_04.captionSrc='fixture.vtt';
  const second=h.root.GoodDogsCutscenes.play('GD_CUT_04',{onStateWrite(){writes++;}});
  const v2=overlay.querySelector('video'), t=v2.querySelector('track'); t.track={mode:'disabled'}; t.onload();
  assert.equal(t.track.mode,'showing'); assert.equal(cc.attributes['aria-pressed'],'true');
  cc.emit('click',event()); assert.equal(t.track.mode,'disabled'); assert.equal(values.techops_good_dogs_captions_v1,'off');
  cc.emit('click',event()); assert.equal(t.track.mode,'showing'); t.onerror();
  assert.equal(cc.attributes['aria-disabled'],'true'); assert.match(status.textContent,/could not be loaded/); assert.equal(writes,1);
  v2.onended(); h.step(); await flush(); assert.equal((await second).status,'COMPLETED'); assert.equal(writes,2);
  const third=h.root.GoodDogsCutscenes.play('GD_CUT_02'); assert.equal(sound.hidden,true); overlay.querySelector('.gd-film-skip').emit('click',event()); h.step(); await flush(); await third;
  // A new request cancels the prior overlay without marking it seen or leaking the music claim.
  const stale=h.root.GoodDogsCutscenes.play('GD_CUT_06',{onStateWrite(){writes++;}});
  const oldVideo=overlay.querySelector('video'); sound.emit('click',event()); assert.equal(oldVideo.muted,false);
  const replacement=h.root.GoodDogsCutscenes.play('GD_CUT_07',{onStateWrite(){writes++;}});
  h.step(); await flush(); assert.equal((await stale).status,'CANCELLED'); assert.equal(writes,2);
  assert.equal(calls.at(-1)[0],'release'); assert.equal(h.root.GoodDogsCutscenes.state().GD_CUT_06,undefined);
  const replacementVideo=overlay.querySelector('video'); sound.emit('click',event()); assert.equal(replacementVideo.muted,false);
  replacementVideo.onerror(); assert.equal(replacementVideo.muted,true); assert.equal(calls.at(-1)[0],'release'); assert.equal(writes,2);
  overlay.querySelector('.gd-film-skip').emit('click',event()); h.step(); await flush(); assert.equal((await replacement).status,'USER_SKIPPED'); assert.equal(writes,3);
  console.log('Good Dogs caption and sound lifecycle: PASS');
})().catch(e=>{console.error(e);process.exitCode=1;});
