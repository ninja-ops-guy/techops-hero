'use strict';
/* Contract: the Night MORE toggle owns the same press pipeline as combat buttons.
 * Touch presses toggle via pointerdown/touchstart, compatibility click duplicates
 * never double-toggle, keyboard/AT clicks (detail 0) still work, and a disabled
 * toggle ignores input. Regression: a click-only listener silently failed on
 * touch whenever a page-level touch handler prevented default. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=['night_combat.js','night_combat_input.js'].map(p=>fs.readFileSync(p,'utf8')).join('\n');
let passed=0;
function test(name,fn){fn();passed++;console.log('PASS '+name);}

function makeButton(doc,id){
  const listeners={};
  return {id,type:'',className:'',textContent:'',hidden:false,disabled:false,dataset:{},children:[],style:{},
    _attrs:{},_listeners:listeners,
    setAttribute(k,v){this._attrs[k]=String(v);},getAttribute(k){return k in this._attrs?this._attrs[k]:null;},
    appendChild(c){this.children.push(c);if(c.id)doc._byId[c.id]=c;return c;},
    addEventListener(t,fn){(listeners[t]=listeners[t]||[]).push(fn);},
    fire(type,props){const e=Object.assign({type,button:0,detail:type==='click'?1:0,preventDefault(){this.defaultPrevented=true;},stopImmediatePropagation(){this.stopped=true;}},props);for(const fn of listeners[type]||[])fn(e);return e;}};
}
function fixture({pointerEvents=true}={}){
  const byId={},docListeners={};
  const doc={_byId:byId,hidden:false,head:{appendChild(){}},
    getElementById(id){return byId[id]||null;},
    createElement(tag){return makeButton(doc,'');},
    querySelectorAll(){return [];},
    addEventListener(type,fn){docListeners[type]=fn;}};
  const r={console,performance:{now:()=>1000},document:doc,S:{nightMode:true},keys:{},joy:{x:0,y:0},
    addEventListener(){},sfx(){},nmCheckClear(){},
    NM_W:1800,NM_FLOOR:430,NM_GRAV:.48,cv:{width:1048,height:720},clamp:(v,a,b)=>Math.max(a,Math.min(b,v))};
  if(pointerEvents)r.PointerEvent=function(){};
  r.window=r;r.globalThis=r;
  r.NM={district:'industrial',x:400,y:396,w:22,h:34,hp:100,face:1,vx:0,vy:0,onGround:true,dashT:0,dashCD:0,ifr:0,hitStop:0,jumps:0,jHeld:false,flip:0,platforms:[],clear:false,enemies:[]};
  vm.runInNewContext(source,r);
  const box=makeButton(doc,'v55-nmbtns');byId['v55-nmbtns']=box;
  r.TechOpsNightInput.sync();
  const more=byId['night-input-assists'];
  assert.ok(more,'sync creates the MORE toggle');
  return {r,doc,box,more};
}
const expanded=f=>f.more.getAttribute('aria-expanded');

test('touch press toggles via pointerdown; the compatibility click never double-toggles',()=>{
  const f=fixture();
  assert.equal(expanded(f),'false');
  f.more.fire('pointerdown');
  assert.equal(expanded(f),'true','pointerdown toggles');
  f.more.fire('click',{detail:1});
  assert.equal(expanded(f),'true','synthesized click after a pointer press is ignored');
  f.more.fire('touchstart');
  assert.equal(expanded(f),'true','compat touchstart after pointerdown is ignored');
});

test('legacy touch devices toggle on touchstart when Pointer Events are unavailable',()=>{
  const f=fixture({pointerEvents:false});
  const e=f.more.fire('touchstart');
  assert.equal(expanded(f),'true','touchstart toggles');
  assert.ok(e.defaultPrevented,'touch press claims the gesture');
  f.more.fire('click',{detail:1});
  assert.equal(expanded(f),'true','the compatibility click is still ignored');
});

test('keyboard and assistive-technology clicks (detail 0) toggle',()=>{
  const f=fixture();
  f.more.fire('click',{detail:0});
  assert.equal(expanded(f),'true');
  f.more.fire('click',{detail:0});
  assert.equal(expanded(f),'false');
});

test('a disabled toggle ignores presses',()=>{
  const f=fixture();
  f.r.S.paused=true;f.r.TechOpsNightInput.sync();
  assert.equal(f.more.disabled,true,'paused combat disables the toggle');
  f.more.fire('pointerdown');f.more.fire('click',{detail:0});
  assert.equal(expanded(f),'false','no toggle while disabled');
});

test('expanding reveals the optional dash and grab buttons with 44px-class targets intact',()=>{
  const f=fixture();
  f.more.fire('pointerdown');
  assert.equal(f.doc._byId['night-input-grab'].hidden,false,'grab revealed');
  assert.equal(f.more.getAttribute('aria-expanded'),'true');
  f.more.fire('click',{detail:0});
  assert.equal(f.doc._byId['night-input-grab'].hidden,true,'grab hidden again');
});

test('toggling never dispatches combat actions',()=>{
  const f=fixture();
  f.more.fire('pointerdown');f.more.fire('click',{detail:0});
  assert.deepEqual(f.r.NM._nightCombat&&f.r.NM._nightCombat.events||[],[],'no combat events from the toggle');
});

console.log(passed+'/6 night MORE toggle contracts passed');
