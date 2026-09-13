import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {createSession} from './assets/good-dogs-3d/session.mjs';
import {eligible} from './assets/good-dogs-3d/level.mjs';
function fixture(){const root={console,Date,performance:{now:()=>1000}};root.globalThis=root;const game=createSession(root);vm.runInNewContext(fs.readFileSync('good_boys_access_core_authority.js','utf8'),root);return {root,game,api:root.TechOpsGoodBoysAccessCoreAuthority};}
test('post-K M5 only; modal, mismatched, pre-rescue and later missions retain native renderer',()=>{
 const {root}=fixture();assert.equal(eligible(root),true);root.S.meta._v736.k=false;assert.equal(eligible(root),false);root.S.meta._v736.k=true;root.S.inDialog=true;assert.equal(eligible(root),false);root.S.inDialog=false;root.S.meta._v736.m=6;assert.equal(eligible(root),false);root.S.meta._v736.m=5;root.NM._v736.m=4;assert.equal(eligible(root),false);
});
test('current canonical Index -> security -> explicit Access Node order survives 3D demo',()=>{
 const {root,game,api}=fixture();root.NM.x=1070;assert.equal(game.action('use'),false);const index=root.NM.enemies.find(e=>e.kind==='mikeindex');assert.ok(index);index.hp=0;index.alive=false;api.tick();assert.equal(root.S.story.facts.mike_index_defeated,true);assert.equal(game.action('use'),false);
 root.NM.enemies.forEach(e=>{e.hp=0;e.alive=false;});root.NM.x=300;assert.equal(game.action('use'),false);root.NM.x=1070;assert.equal(game.action('use'),true);assert.equal(game.complete,false);root.NM.x=1480;assert.equal(game.action('use'),false);game.c.partner.x=1400;assert.equal(game.action('use'),true);assert.equal(game.complete,true);assert.equal(root.S.meta._v736.waldo,false);assert.equal(root.S.story.facts.waldo_freed,undefined);
});
test('retry does not inherit old encounter flags; resume keeps actual checkpoint',()=>{
 const {root,game,api}=fixture();const index=root.NM.enemies[0];index.hp=0;index.alive=false;api.tick();const saved=game.snapshot();const retry=createSession(root);api.tick();assert.equal(root.NM._gbMikeIndexDefeated,false);assert.equal(api.acceptance().mikeIndexCount,1);retry.restore(saved);api.tick();assert.equal(root.NM._gbMikeIndexDefeated,true);assert.equal(api.acceptance().mikeIndexCount,0);assert.equal(root.NM.enemies.filter(e=>e.hp>0).length,3);
});
test('pause blocks movement and actions; Index predictions refer to past samples',()=>{
 const {root,game}=fixture();game.setPause(true);const x=root.NM.x;game.tick(1,{axis:1});game.action('attack');assert.equal(root.NM.x,x);game.setPause(false);
 for(let i=0;i<50;i++)game.tick(.05,{axis:1});const e=root.NM.enemies.find(e=>e.kind==='mikeindex');assert.ok(e.recordedTarget<root.NM.x-50,'prediction must lag movement');
});
test('compositor uses the 3D callback once and keeps the immutable simulation',()=>{
 const root={console,Date,setInterval(){return 1;},clearInterval(){},document:null};root.globalThis=root;root.S={nightMode:true};root.NM={x:10,y:10};root.ctx={};let draws=0,steps=0,visuals=0;
 root.__techopsFinalParserDrawNM=()=>draws++;root.__techopsFinalParserStepNM=()=>steps++;
 vm.runInNewContext(fs.readFileSync('production_wrapper_guard.js','utf8'),root);
 root.TechOpsGoodDogs3D={draw(){visuals++;return true;}};root.drawNM();root.stepNM();assert.equal(draws,0);assert.equal(visuals,1);assert.equal(steps,1);
 root.TechOpsGoodDogs3D.draw=()=>false;root.drawNM();assert.equal(draws,1);assert.equal(steps,1);
});
test('local partner has independent movement, can be revived, and a dead checkpoint cannot heal on reload',()=>{
 const {game,root,api}=fixture();game.setCoop(true);const x=game.n.x,p=game.c.partner.x;game.tick(.05,{partnerAxis:1});assert.equal(game.n.x,x);assert.ok(game.c.partner.x>p);
 game.c.chars.manchez.hp=0;game.n.x=game.c.partner.x;assert.equal(game.action('use'),true);assert.equal(game.c.chars.manchez.hp,48);
 game.c.chars.katrin.hp=0;game.c.chars.manchez.hp=0;const saved=game.snapshot(),again=createSession(root);api.tick();again.restore(saved);assert.equal(root.S.gameOver,true);assert.equal(again.action('attack'),false);
});

test('all six quality-tier models match the shipped manifest and GLB envelope',()=>{
 const base='assets/good-dogs-3d/';
 const manifest=JSON.parse(fs.readFileSync(base+'asset-manifest.json','utf8'));
 const expected=['char.k','dog.katrin','dog.manchez'].flatMap(id=>['models/'+id+'.glb','models/'+id+'.lite.glb']).sort();
 assert.deepEqual(manifest.models.map(m=>m.file).sort(),expected);
 for(const model of manifest.models){
  const bytes=fs.readFileSync(base+model.file);
  assert.equal(bytes.length,model.bytes,model.file+' size');
  assert.equal(createHash('sha256').update(bytes).digest('hex'),model.sha256,model.file+' digest');
  assert.equal(bytes.toString('ascii',0,4),'glTF');
  assert.equal(bytes.readUInt32LE(4),2);
  assert.equal(bytes.readUInt32LE(8),bytes.length);
 }
});

test('four-way keyboard and touch controls match the camera without orbiting on reversal',async()=>{
 const THREE=await import('./assets/good-dogs-3d/vendor/three.module.js');
 const {positionCamera,movementInput}=await import('./assets/good-dogs-3d/camera.mjs');
 const camera=new THREE.PerspectiveCamera(50,1,.08,80),side=new THREE.OrthographicCamera();
 const opts={targetZ:5,focusY:.53,aspect:1.5,kPosition:new THREE.Vector3(-.95,0,3.8)};
 for(const view of ['third','retro','first','crew']){
  const cam=positionCamera(camera,side,{...opts,view});cam.updateMatrixWorld();
  for(const [key,hold] of [['ArrowUp','forward'],['ArrowDown','back'],['ArrowLeft','left'],['ArrowRight','right']]){
   const input=movementInput(new Set([key]),[],view),touch=movementInput(new Set(),[hold],view);
   assert.equal(input.axis,touch.axis);assert.equal(input.strafe,touch.strafe);
   const start=new THREE.Vector3(0,.5,5),next=start.clone().add(new THREE.Vector3(input.strafe,0,input.axis));
   if(hold==='right')assert.ok(next.project(cam).x>start.project(cam).x,view+' right must move screen-right');
   if(hold==='left')assert.ok(next.project(cam).x<start.project(cam).x,view+' left must move screen-left');
  }
  const before=cam.position.clone();positionCamera(camera,side,{...opts,view,face:-1});assert.ok(before.equals(cam.position));
  assert.equal(movementInput(new Set(['KeyW','KeyS']),[],view).axis,0);
 }
});

test('grounded corridor has no platform collision, normalized movement, or jump action',()=>{
 const a=fixture().game,b=fixture().game;
 const x=a.n.x,lane=a.n._gdLane;a.tick(.05,{axis:1});b.tick(.05,{axis:1,strafe:1});
 assert.ok(b.n.x-x<a.n.x-x,'diagonal speed is normalized');assert.ok(b.n._gdLane>lane);
 assert.equal(a.n.platforms.length,0);assert.equal(a.action('jump'),false);
 for(let i=0;i<100;i++)a.tick(.05,{strafe:1});assert.ok(a.n._gdLane<=2.15);assert.equal(a.n.y+a.n.h,430);
 a.action('dash');a.tick(.05,{axis:1});assert.equal(a.n.y+a.n.h,430);assert.equal(a.n.onGround,true);
 const saved=b.snapshot(),restored=fixture().game;restored.restore(saved);assert.equal(restored.n._gdLane,b.n._gdLane);assert.equal(restored.n.y+restored.n.h,430);
});

test('corridor attacks and Access Node use respect lateral distance',()=>{
 const {game,api}=fixture(),e=game.n.enemies[0];e.x=game.n.x+20;e._gdLane=2.1;game.n._gdLane=-2.1;
 assert.equal(game.action('attack'),false);const hp=e.hp;assert.equal(e.hp,hp);
 e.alive=false;e.hp=0;api.tick();game.n.enemies.forEach(e=>{e.hp=0;e.alive=false;});game.n.x=1070;
 game.n._gdLane=2.1;assert.equal(game.action('use'),false);game.n._gdLane=-1.5;assert.equal(game.action('use'),true);
});

test('portrait cameras keep both complete dogs inside the horizontal frame',async()=>{
 const THREE=await import('./assets/good-dogs-3d/vendor/three.module.js');
 const {positionCamera}=await import('./assets/good-dogs-3d/camera.mjs');
 const camera=new THREE.PerspectiveCamera(),side=new THREE.OrthographicCamera();
 for(const view of ['third','crew'])for(const width of [320,390])for(const separation of [.67,2]){
  positionCamera(camera,side,{view,targetZ:5,focusY:.53,aspect:width/844,separation});camera.updateMatrixWorld();
  for(const heading of [0,Math.PI/2,Math.PI])for(const sign of [-1,1])for(const x of [-.28,.28])for(const z of [-.55,.55])for(const y of [0,.94]){
   const point=new THREE.Vector3(x,y,z).applyAxisAngle(new THREE.Vector3(0,1,0),heading).add(new THREE.Vector3(sign*.33,0,5+sign*separation*.5)).project(camera);
   assert.ok(Math.abs(point.x)<1,`${view} at ${width}px clips a dog (${point.x})`);
  }
 }
});


test('actual native M5 simulation walks four directions on the floor and isolates other missions',()=>{
 const r={console,Date,Math,performance:{now:()=>1000},S:{nightMode:true,inDialog:false},keys:{},NM_W:1800,NM_FLOOR:430,NM_GRAV:.48,cv:{width:960,height:540},sfx(){},clamp:(v,a,b)=>Math.max(a,Math.min(b,v))};r.window=r;r.globalThis=r;
 const n=r.NM={x:200,y:396,w:22,h:34,hp:100,vx:0,vy:0,onGround:true,face:1,jHeld:false,jumps:0,flip:0,dashT:0,dashCD:0,ifr:0,hitStop:0,clear:false,platforms:[{x:100,y:345,w:400}],enemies:[],_v736:{m:5,active:'katrin',chars:{katrin:{}},partner:{x:130,h:34}}};
 const hooks=fs.readFileSync('night_hooks.js','utf8');vm.runInNewContext(fs.readFileSync('good_dogs_grounded.js','utf8')+'\n'+hooks.slice(hooks.indexOf('function stepNM(dt)'),hooks.indexOf('// ---------- night rendering')),r);
 r.keys.arrowup=true;r.stepNM(.05);assert.ok(n.x>200);assert.equal(n.y+n.h,430);assert.equal(n.platforms.length,0);
 const x=n.x,lane=n._gdLane;r.keys={arrowright:true};r.stepNM(.05);assert.equal(n.x,x);assert.ok(n._gdLane<lane,'right moves across the floor');
 r.keys={arrowdown:true};r.stepNM(.05);assert.ok(n.x<x);assert.equal(n.y+n.h,430);
 const frozen=n.x;r.S.inDialog=true;r.stepNM(.05);assert.equal(n.x,frozen);r.S.inDialog=false;
 r.TechOpsGoodDogs3D={status:()=>({view:'crew'})};r.keys={arrowup:true};const prior=n.x;r.stepNM(.05);assert.ok(n.x<prior,'crew view reverses forward into the view');
 n._v736.m=4;n.jHeld=false;r.keys={arrowup:true};r.stepNM(.05);assert.ok(n.y+n.h<430,'the earlier authored retro mission retains its jump');
});


test('guided play uses proximity targeting without facing misses or remote hits',()=>{
 const {game}=fixture(),e=game.n.enemies[0];e.x=game.n.x-55;e._gdLane=game.n._gdLane;game.n.face=1;const hp=e.hp;
 assert.equal(game.action('attack'),true);assert.equal(e.hp,hp-26);assert.equal(game.n.face,-1);assert.ok(game.n._gdAttack>0);
 game.setCoop(true);e.x=game.n.x+500;const farHp=e.hp;for(let i=0;i<10;i++)game.tick(.05,{attack:true});assert.equal(e.hp,farHp);
});
test('solo partner contributes attacks and hold-strike respects cooldown and pause',()=>{
 const {game}=fixture(),e=game.n.enemies[0];e.x=game.n.x+35;e._gdLane=0;const hp=e.hp;
 game.tick(.05,{attack:true});assert.ok(e.hp<=hp-52,'player and AI partner both land attacks');const after=e.hp;
 game.tick(.05,{attack:true});assert.equal(e.hp,after,'holding must not attack on every frame');game.setPause(true);game.tick(.05,{attack:true});assert.equal(e.hp,after);
});
test('objective and enabled interaction follow encounter, console range, partner and door readiness',()=>{
 const {game,api}=fixture();assert.equal(game.guidance().step,1);assert.equal(game.guidance().canUse,false);
 game.n.enemies.forEach(e=>{e.hp=0;e.alive=false;});api.tick();assert.equal(game.guidance().step,2);
 game.n.enemies.forEach(e=>{e.hp=0;e.alive=false;});assert.equal(game.guidance().step,3);assert.equal(game.guidance().canUse,false);
 game.n.x=1070;game.n._gdLane=2;assert.equal(game.guidance().canUse,false);game.n._gdLane=-1.4;assert.equal(game.guidance().useLabel,'UNLOCK ROUTE');assert.equal(game.guidance().canUse,true);assert.equal(game.action('use'),true);
 game.n.x=1450;assert.equal(game.guidance().useLabel,'WAIT FOR PARTNER');game.c.partner.x=1400;assert.equal(game.guidance().useLabel,'NEXT BLOCK');assert.equal(game.action('use'),true);
});
test('distant enemies cannot damage the dogs before the encounter is reached',()=>{
 const {game}=fixture(),hp=game.c.chars.katrin.hp;for(let i=0;i<80;i++)game.tick(.05,{});assert.equal(game.c.chars.katrin.hp,hp);assert.equal(game.n.enemies[0].windup,0);
});


test("guided inputs complete all four beats without editing health or encounter flags",()=>{
const {game,root}=fixture(),stages=[];
for(let i=0;i<15000&&!game.complete&&!root.S.gameOver;i++){
 const g=game.guidance(),n=game.n; if(stages.at(-1)!==g.step)stages.push(g.step);
 if(g.canUse)game.action('use');
 const t=g.target,dx=(t.x-n.x)/60,dy=(t._gdLane||0)-(n._gdLane||0),d=Math.hypot(dx,dy);
 const threat=game.n.enemies.some(e=>e.hp>0&&e.windup>0&&Math.hypot((n.x-e.recordedTarget)/60,(n._gdLane||0)-e.recordedLane)<1.25);
 const stop=g.step<3?d<1.4:g.step===3?g.canUse:n.x>=1430;
 game.tick(.05,{axis:stop?0:Math.abs(dx)>.15?Math.sign(dx):0,strafe:stop?0:Math.abs(dy)>.12?Math.sign(dy):0,attack:g.step<3,block:threat});
}
assert.equal(game.complete,true);assert.deepEqual(stages,[1,2,3,4]);assert.ok(game.c.chars.katrin.hp>0);assert.equal(root.S.meta._v736.waldo,false);
});
