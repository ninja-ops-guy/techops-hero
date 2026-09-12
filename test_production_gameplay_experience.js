'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('production_gameplay_experience.js','utf8');
function boot(){let rafFn=null;const c={console,Math,Date,setTimeout,clearTimeout,requestAnimationFrame(fn){rafFn=fn;return 1;},cancelAnimationFrame(){},matchMedia(){return{matches:false};},navigator:{vibrate(){}},V67SET:{shake:true,volSfx:0},S:{nightMode:false,inBattle:false,inDialog:false},NM:null,TechOpsLevelRegistry:{goodDogsMission(m){return m===3?{id:'gooddogs.m3',ordinal:3,name:'BREACH',objective:'CROSS THE BREACH',target:1450,stage:{landmarks:[{x:330,label:'IMPACT',kind:'breach'},{x:900,label:'AIRLOCK',kind:'door'},{x:1450,label:'BLOCK 118',kind:'door'}]}}:null;}}};c.globalThis=c;vm.createContext(c);vm.runInContext(source,c);return{c,api:c.TechOpsGameplayExperience,frame:()=>rafFn()};}
const b=boot(),row=b.c.TechOpsLevelRegistry.goodDogsMission(3);assert.equal(b.api.VERSION,1);assert.equal(b.api.nextLandmark(row,400).label,'AIRLOCK');assert.equal(b.api.nextLandmark(row,1440).label,'BLOCK 118');assert.equal(b.api.nearestLandmark(row,875).mark.label,'AIRLOCK');
const events=()=>[{id:1,type:'jab'},{id:2,type:'whiff'},{id:3,type:'launcher'}];
const n={district:'downtown',x:100,w:24,enemies:[],_nightCombat:{events:events()}};b.c.NM=n;b.c.S.nightMode=n;
const first=n._nightCombat,original=JSON.stringify(n);assert.equal(b.api.consumeCombat(n),3);assert.equal(b.api.consumeCombat(n),0);assert.equal(JSON.stringify(n),original,'observer must not mutate gameplay');
n._nightCombat={events:events().slice(0,2)};assert.equal(b.api.consumeCombat(n),2,'same world, replacement street combat must not inherit the old ID high-water mark');
const fresh={...n,_nightCombat:{events:events()}};b.c.NM=fresh;b.c.S.nightMode=fresh;assert.equal(b.api.consumeCombat(fresh),3,'new run restarts semantic IDs');
b.api.consumeCombat({_v736:{m:3}});n._nightCombat=first;b.c.NM=n;b.c.S.nightMode=n;assert.equal(b.api.consumeCombat(n),0,'returning to a previously observed combat must not replay old sounds/flashes');
first.events.push({id:4,type:'jab'});b.c.S.inDialog=true;assert.equal(b.api.consumeCombat(n),0);b.c.S.inDialog=false;assert.equal(b.api.consumeCombat(n),0,'cinematic-time events must not replay after returning');
first.events.push({id:5,type:'jab',guarded:true},{id:6,type:'guard'});assert.equal(b.api.consumeCombat(n),1,'a guarded attack creates one guard feedback, not a second hit');
first.events.push({id:NaN,type:'jab'},{id:Infinity,type:'jab'});assert.equal(b.api.consumeCombat(n),0);
assert.match(source,/never owns damage, collision, progression/);assert.match(source,/TechOpsLevelRegistry/);assert.match(source,/prefers-reduced-motion/);assert.match(source,/volSfx/);assert.doesNotMatch(source,/\.hp\s*[-+]=|\.alive\s*=|\.kills\s*\+\+|localStorage\.setItem/);assert.doesNotMatch(source,/createOscillator|createGain|new\s+(?:AudioContext|C)\(/,'presentation must not add a competing audio path');
console.log('Production gameplay experience: navigation, per-combat cursors, new-run/mode reset, pause, guarded contact, immutable state and single audio ownership PASS');
