#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const gameSource = fs.readFileSync('game.js', 'utf8');
const begin = gameSource.indexOf('// background-save:begin');
const end = gameSource.indexOf('// background-save:end');
assert.ok(begin >= 0 && end > begin, 'guard is embedded in game.js');
const src = gameSource.slice(begin, end + '// background-save:end'.length);
let passed = 0;
function test(name, fn) { fn(); passed++; console.log('PASS', name); }
function world(saveImpl = () => true) {
  const events = { window: {}, document: {} };
  const ctx = {
    window: { addEventListener: (name, fn) => { (events.window[name] ||= []).push(fn); } },
    document: { visibilityState:'visible', addEventListener: (name, fn) => { (events.document[name] ||= []).push(fn); } },
    save: saveImpl,
  };
  vm.createContext(ctx);
  vm.runInContext(src, ctx);
  const fire = (target, event) => (events[target][event] || []).forEach(fn => fn());
  const hidden = () => {ctx.document.visibilityState='hidden';fire('document','visibilitychange');};
  const visible = () => {ctx.document.visibilityState='visible';fire('document','visibilitychange');};
  return {ctx,events,fire,hidden,visible};
}
function store() {
  const data = new Map();
  let refuseKey = null;
  return {
    data,
    getItem(k) {return data.has(k) ? data.get(k) : null;},
    setItem(k,v) { if (k===refuseKey) throw new Error('QuotaExceededError: '+k); data.set(k,String(v));},
    failOn(k){refuseKey=k;},
  };
}
function saveFixture({mode = 'day', storage = store()}={}) {
  let saves = 0;
  const S = {day:3,clock:777,budget:42,meta:{},nightMode: mode==='night' ? {district:'industrial',street:2,cash:100,x:700} : null,};
  storage.data.set('techops_save', JSON.stringify({day:2,clock:600,budget:10,_saveRevision:10}));
  storage.data.set('techops_save_bak', JSON.stringify({day:1,clock:550,budget:5,_saveRevision:9}));
  function save() {
    saves++;
    try {
      if(mode === 'night') {
        storage.setItem('techops_nightcrawler_session_v1', JSON.stringify({version:2,mode:'nightcrawler',status:'active',state:{...S}}));
        return true;
      }
      const previousRaw=storage.getItem('techops_save');
      const payload=JSON.stringify({_profileSchemaVersion:1,day:S.day,clock:S.clock,budget:S.budget,_saveRevision:10+saves});
      if(previousRaw && previousRaw!==payload) {
        const prev=JSON.parse(previousRaw);
        storage.setItem(prev && typeof prev==='object' ? 'techops_save_bak':'techops_save_corrupt_v1', previousRaw);
      }
      storage.setItem('techops_save',payload);
      storage.setItem('techops_day_checkpoint_v2',JSON.stringify({version:2,state:{...S}}));
      return true;
    } catch(e){ctx.window.__techopsSaveError=String(e);return false;}
  }
  const ctx={window:{}};
  const w=world(save);
  ctx.window=w.ctx.window;
  return {w,S,storage,saves:()=>saves};
}

test('exactly one pagehide and visibility listener',()=>{const {events}=world();assert.equal(events.window.pagehide.length,1);assert.equal(events.document.visibilitychange.length,1);});
test('pagehide saves on its own',()=>{let n=0;const w=world(()=>{n++;return true;});w.fire('window','pagehide');assert.equal(n,1);});
test('hidden saves; visible does not save',()=>{let n=0;const w=world(()=>{n++;return true;});w.hidden();w.visible();assert.equal(n,1);});
test('hidden then pagehide makes only one save',()=>{const f=saveFixture();f.w.hidden();f.w.fire('window','pagehide');assert.equal(f.saves(),1);assert.equal(JSON.parse(f.storage.getItem('techops_save_bak')).day,2);});
test('pagehide then hidden makes only one save',()=>{const f=saveFixture();f.w.fire('window','pagehide');f.w.hidden();assert.equal(f.saves(),1);});
test('duplicate events do not advance revision',()=>{const f=saveFixture();f.w.hidden();const bytes=f.storage.getItem('techops_save');f.w.hidden();f.w.fire('window','pagehide');assert.equal(f.storage.getItem('techops_save'),bytes);});
test('Day checkpoint restored from cold storage after hide',()=>{const f=saveFixture();f.S.budget=700;f.S.clock=930;f.w.hidden();const reopened=JSON.parse(f.storage.getItem('techops_day_checkpoint_v2'));assert.equal(reopened.state.budget,700);assert.equal(reopened.state.clock,930);});
test('Night checkpoint restored from cold storage after hide',()=>{const f=saveFixture({mode:'night'});f.S.nightMode.x=912;f.S.nightMode.cash=240;f.w.hidden();const reopened=JSON.parse(f.storage.getItem('techops_nightcrawler_session_v1'));assert.equal(reopened.state.nightMode.x,912);assert.equal(reopened.state.nightMode.cash,240);});
test('a failure on first hide permits pagehide retry',()=>{let n=0;const w=world(()=>++n>=2);w.hidden();w.fire('window','pagehide');assert.equal(n,2);});
test('a thrown save is contained and next event retries',()=>{let n=0;const w=world(()=>{n++;if(n===1)throw Error('quota');return true;});assert.doesNotThrow(()=>w.hidden());assert.match(w.ctx.window.__techopsSaveError,/quota/);w.fire('window','pagehide');assert.equal(n,2);});
test('failed backup rotation does not overwrite primary and permits retry',()=>{const storage=store();const f=saveFixture({storage});const old=storage.getItem('techops_save');storage.failOn('techops_save_bak');f.w.hidden();assert.equal(storage.getItem('techops_save'),old);assert.equal(f.saves(),1);storage.failOn(null);f.w.fire('window','pagehide');assert.equal(f.saves(),2);assert.equal(JSON.parse(storage.getItem('techops_save')).day,3);});
test('new visible period re-arms guard',()=>{let n=0;const w=world(()=>{n++;return true;});w.hidden();w.visible();w.hidden();assert.equal(n,2);});
test('BFCache pageshow re-arms guard',()=>{let n=0;const w=world(()=>{n++;return true;});w.fire('window','pagehide');w.fire('window','pageshow');w.fire('window','pagehide');assert.equal(n,2);});
test('missing save is safe',()=>{const w=world();delete w.ctx.save;assert.doesNotThrow(()=>w.fire('window','pagehide'));});
test('no-window embedding is safe',()=>{assert.doesNotThrow(()=>vm.runInNewContext(src,{}));});
test('false save does not suppress subsequent event',()=>{let n=0;const w=world(()=>{n++;return false;});w.hidden();w.fire('window','pagehide');assert.equal(n,2);});
console.log(`\n${passed}/${passed} isolated lifecycle-contract checks passed`);
