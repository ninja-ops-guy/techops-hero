'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function fixture(){
 let current=null;const s={meta:{},clock:1100,inDialog:false};const r={S:s,performance:{now:()=>100},dlg:(title,body,options)=>{current={title,body,options};s.inDialog=true;},closeDlg:()=>{s.inDialog=false;},TechOpsNightInput:{reset(){}}};r.globalThis=r;
 vm.runInNewContext(fs.readFileSync('night_combat_lab.js','utf8'),r);vm.runInNewContext(fs.readFileSync('night_progression.js','utf8'),r);
 const n={district:'downtown',street:1,x:600,y:396,w:22,h:34,hp:63,cash:25,kills:4,enemies:[],platforms:[],done:{}};s.nightMode=n;
 return {r,s,n,lab:r.TechOpsCombatLab,dialog:()=>current};
}
let count=0;function test(name,fn){fn();count++;console.log('PASS '+name);}
test('entry requires a safe street, no pending attack, and valid mode',()=>{const {n,lab}=fixture();n.enemies=[{x:700,alive:true}];assert.equal(lab.start('arena'),false);assert(!n._combatLab);n.enemies=[];n._nightCombat={attack:{}};assert.equal(lab.start('arena'),false);delete n._nightCombat;assert.equal(lab.start('invalid'),false);});
test('training uses baseline modifiers and cannot earn combat or clear rewards',()=>{const {n,r,lab}=fixture();assert(lab.start('training'));assert.equal(n._combatLab.mode,'training');assert.equal(n.enemies[0]._labDummy,true);assert.equal(r.TechOpsNightProgression.eligible(n),false);assert.equal(r.TechOpsNightProgression.defeat(n,n.enemies[0]),false);assert.equal(r.TechOpsNightProgression.clear(n),false);assert.equal(r.TechOpsNightProgression.modifiers(n).damage,1);});
test('checkpoint and exit restore street without practice health, kills or cash',()=>{const {n,lab}=fixture();assert(lab.start('arena'));n.hp=2;n.cash=500;n.kills=90;const checkpoint=lab.checkpointNight();assert.equal(checkpoint.hp,63);assert.equal(checkpoint.cash,25);assert.equal(checkpoint.kills,4);assert.equal(checkpoint._combatLab,undefined);assert(lab.leave());assert.equal(n.hp,63);assert.equal(n.cash,25);assert.equal(n.kills,4);assert.equal(n._combatLab,undefined);assert.equal(lab.leave(),false);});
test('arena finish is once-only and retry produces a fresh opponent',()=>{const {n,lab,dialog}=fixture();lab.start('arena');lab.finish(false);assert.match(dialog().title,/DEFEAT/);assert.equal(lab.finish(false),false);dialog().options.find(o=>o.t==='Fight again').f();assert.equal(n._combatLab.done,false);assert.equal(n.enemies[0].hp,90);assert(lab.leave());});
test('entry refuses special modes without altering them',()=>{for(const marker of ['_sector04','_nightwalker','_livingWorld','_v736','drive']){const {n,lab}=fixture();n[marker]={};assert.equal(lab.start('arena'),false);assert(n[marker]);}});
console.log(JSON.stringify({suite:'night-combat-lab',checks:count}));
