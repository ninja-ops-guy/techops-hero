// Deterministic world-boundary input contracts using the production co-op module.
// These are VM contracts, not claims of full-page/browser/device acceptance.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
const source = fs.readFileSync(new URL('../good_dogs_coop.js', import.meta.url), 'utf8');
function world(m = 1) {
  const body = x => ({x,y:396,vx:0,vy:0,w:22,h:34,face:1,onGround:true,jumps:0,hp:120});
  return {...body(700),platforms:[],enemies:[],_v736:{m,active:'katrin',partner:body(650),
    chars:{katrin:{hp:120,maxHp:120},manchez:{hp:120,maxHp:120}},shots:[]}};
}
function harness() {
  const listeners = new Map();
  const nodes = new Map();
  const root = {NM:world(),S:{nightMode:true,inDialog:false,meta:{_v736:{m:1,playMode:'local'}}},
    document:{body:{dataset:{}},hidden:false,querySelector:()=>null,getElementById:id=>nodes.get(id)||null,addEventListener:(k,f)=>listeners.set(k,f)},
    getComputedStyle:node=>node.style||{},
    addEventListener:(k,f)=>listeners.set(k,f),performance:{now:()=>0}};
  vm.createContext(root);vm.runInContext(source,root,{filename:'good_dogs_coop.js'});
  const api=root.TechOpsGoodDogsCoop;
  function key(code,down=true){listeners.get(down?'keydown':'keyup')({code,preventDefault(){},stopImmediatePropagation(){}});}
  const partnerStep=()=>api.stepPartner(root.NM,1/60,1,(e,d)=>{e.hp-=d;},1800);
  // Production order: beginStep -> pair/partner -> puzzle.
  function frame(){api.beginStep(root.NM);partnerStep();api.stepPuzzle(root.NM,1/60);}
  function next(){root.NM=world(2);root.S.meta._v736.m=2;return root.NM._v736.partner;}
  return {root,api,key,partnerStep,frame,next,listeners,nodes};
}

test('fresh held movement survives the first M2 puzzle update',()=>{
  const h=harness();h.frame();const p=h.next();h.key('KeyD');h.frame();const x=p.x;
  h.frame();assert.ok(Math.abs((p.x-x)-3.4)<1e-9);h.key('KeyD',false);
});
test('an unconsumed M1 jump cannot leak into M2',()=>{
  const h=harness();h.frame();h.key('KeyW');const p=h.next();h.frame();
  assert.equal(p.onGround,true);assert.equal(p.jumps,0);
});
test('held M1 movement cannot move a fresh M2 body',()=>{
  const h=harness();h.frame();h.key('KeyD');const p=h.next();h.frame();
  assert.equal(p.x,650);assert.equal(p.vx,0);
});
test('fresh M2 jump is consumed once in production step order',()=>{
  const h=harness();h.frame();const p=h.next();h.key('KeyW');h.key('KeyW',false);h.frame();
  assert.equal(p.onGround,false);assert.equal(p.jumps,1);assert.ok(p.vy<0);assert.ok(p.y<396);
  h.frame();assert.equal(p.jumps,1);
});
test('fresh M2 jump survives puzzle-first scheduling too',()=>{
  const h=harness();h.frame();const p=h.next();h.key('KeyW');h.key('KeyW',false);
  h.api.stepPuzzle(h.root.NM,1/60);h.partnerStep();assert.equal(p.jumps,1);
});
test('a blocked transition discards input rather than replaying it',()=>{
  const h=harness();const p=h.next();h.root.NM._v736.resolving=true;h.key('KeyW');h.frame();
  h.root.NM._v736.resolving=false;h.frame();assert.equal(p.jumps,0);assert.equal(p.onGround,true);
});
test('modal, lifecycle and presentation transitions release held movement',()=>{
  const visible=()=>({hidden:false,classList:{contains:()=>false},style:{display:'block',visibility:'visible',opacity:'1'}});
  for(const mode of ['panel','eod','settings','gameOver','paused','hidden','presentation','cinematic']){
    const h=harness(),p=h.next();h.key('KeyD');
    if(mode==='panel')h.nodes.set('panel',visible());
    if(mode==='eod')h.nodes.set('eod',visible());
    if(mode==='settings')h.nodes.set('v67-settings',visible());
    if(mode==='gameOver')h.root.S.gameOver=true;
    if(mode==='paused')h.root.S.paused=true;
    if(mode==='hidden')h.root.document.hidden=true;
    if(mode==='presentation')h.root.TechOpsPresentationDirector={isBlocking:()=>true};
    if(mode==='cinematic')h.nodes.set('good-boys-ship-interlude',visible());
    h.partnerStep();const x=p.x;
    h.nodes.clear();h.root.S.gameOver=false;h.root.S.paused=false;h.root.document.hidden=false;h.root.TechOpsPresentationDirector=null;
    h.partnerStep();assert.equal(p.x,x,mode+' must not replay a held movement after unblock');assert.equal(p.vx,0);
    h.key('KeyD',false);
  }
});
test('dialog and home overlays reject keys',()=>{
  for(const overlay of ['dialog','home']){
    const h=harness();h.frame();
    if(overlay==='dialog')h.root.S.inDialog=true;else h.root.document.querySelector=()=>({});
    h.key('KeyW');h.key('KeyW',false);h.root.S.inDialog=false;h.root.document.querySelector=()=>null;
    h.frame();assert.equal(h.root.NM._v736.partner.jumps,0);
  }
});
test('beginStep clears queued input when partner scheduling is skipped by a blocker',()=>{
  for(const mode of ['dialog','resolving','ending','opening']){
    const h=harness(),p=h.next();h.key('KeyD');h.key('KeyW');
    if(mode==='dialog')h.root.S.inDialog=true;
    if(mode==='resolving')h.root.NM._v736.resolving=true;
    if(mode==='ending')h.root.NM._v736.ending=true;
    if(mode==='opening')h.root.document.querySelector=()=>({});
    h.api.beginStep(h.root.NM);
    h.root.S.inDialog=false;h.root.NM._v736.resolving=false;h.root.NM._v736.ending=false;h.root.document.querySelector=()=>null;
    h.partnerStep();assert.equal(p.x,650,mode);assert.equal(p.vx,0,mode);assert.equal(p.jumps,0,mode);assert.equal(p.onGround,true,mode);
    h.key('KeyD',false);h.key('KeyW',false);h.key('KeyD');h.partnerStep();assert.ok(p.x>650,mode+' cleanup must not latch input permanently');h.key('KeyD',false);
  }
});
test('blur and visibility change discard queued jumps',()=>{
  for(const event of ['blur','visibilitychange']){
    const h=harness();h.frame();h.key('KeyW');h.listeners.get(event)();h.frame();
    assert.equal(h.root.NM._v736.partner.jumps,0);
  }
});
test('same-world puzzle steps do not retrigger a held jump',()=>{
  const h=harness();h.frame();h.key('KeyW');h.frame();h.frame();h.frame();
  assert.equal(h.root.NM._v736.partner.jumps,1);
});
test('P2 attack still reaches the supplied shared damage resolver',()=>{
  const h=harness();h.frame();const p=h.next();
  h.root.NM.enemies=[{x:p.x+35,y:p.y,w:24,h:34,hp:30,alive:true}];
  h.key('KeyF');h.key('KeyF',false);h.frame();assert.equal(h.root.NM.enemies[0].hp,19);
});
test('solo mode does not claim independent P2 keys',()=>{
  const h=harness();h.api.configure('solo');
  let claimed=false;h.listeners.get('keydown')({code:'KeyW',preventDefault(){claimed=true;},stopImmediatePropagation(){}});
  assert.equal(claimed,false);assert.equal(h.api.mode(),'solo');
});
