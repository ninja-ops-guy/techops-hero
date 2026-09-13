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

test('screen directions match keyboard and touch, without orbiting on reversal',async()=>{
 const THREE=await import('./assets/good-dogs-3d/vendor/three.module.js');
 const {positionCamera,movementInput}=await import('./assets/good-dogs-3d/camera.mjs');
 const camera=new THREE.PerspectiveCamera(50,1,.08,80),side=new THREE.OrthographicCamera(-9,9,6,-6,.05,100);
 const opts={targetZ:5,focusY:.53,aspect:1.5,kPosition:new THREE.Vector3(-.95,0,3.8)};
 for(const view of ['third','retro','first','crew']){
  const cam=positionCamera(camera,side,{...opts,view});cam.updateMatrixWorld();
  const start=new THREE.Vector3(0,.5,5),key=movementInput(new Set(['ArrowRight']),[],view),touch=movementInput(new Set(),['forward'],view);
  assert.equal(key.axis,touch.axis);assert.equal(movementInput(new Set(['ArrowLeft']),[],view).axis,-key.axis);
  const forward=start.clone().add(new THREE.Vector3(0,0,key.axis));
  if(view==='retro'||view==='crew')assert.ok(forward.project(cam).x>start.clone().project(cam).x,view+' right input must move right on screen');
  else assert.ok(forward.distanceTo(cam.position)>start.distanceTo(cam.position),view+' forward input moves into the scene');
  const before=cam.position.clone();positionCamera(camera,side,{...opts,view,face:-1});assert.ok(before.equals(cam.position),'reversing the dog must not rotate the camera');
  assert.equal(movementInput(new Set(['KeyW','KeyS']),[],view).axis,0);
 }
});


test('portrait cameras keep both complete dogs inside the horizontal frame',async()=>{
 const THREE=await import('./assets/good-dogs-3d/vendor/three.module.js');
 const {positionCamera}=await import('./assets/good-dogs-3d/camera.mjs');
 const camera=new THREE.PerspectiveCamera(),side=new THREE.OrthographicCamera();
 for(const view of ['third','crew'])for(const width of [320,390])for(const separation of [.67,2]){
  positionCamera(camera,side,{view,targetZ:5,focusY:.53,aspect:width/844,separation});camera.updateMatrixWorld();
  for(const sign of [-1,1])for(const x of [-.28,.28])for(const z of [-.55,.55])for(const y of [0,.94]){
   const point=new THREE.Vector3(sign*.33+x,y,5+sign*separation*.5+z).project(camera);
   assert.ok(Math.abs(point.x)<1,`${view} at ${width}px clips a dog (${point.x})`);
  }
 }
});
