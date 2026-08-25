"use strict";
const assert=require("assert"),fs=require("fs"),vm=require("vm");
const src=fs.readFileSync("good_boys_canon_runtime.js","utf8");
let loaded=null,beginCb=null;
function fakeElement(text){return{style:{setProperty(k,v){this[k]=v;}},textContent:text||"",dataset:{},classList:{add(){},toggle(){}},setAttribute(){},addEventListener(type,fn){if(type==="click"||type==="pointerdown")this[type]=fn;},remove(){this.removed=true;},querySelectorAll(){return[];}};}
const titleChild=fakeElement("← play as Mike instead");
const body={classList:{toggle(){}},appendChild(el){this.last=el;}};
const dialogue=fakeElement();
const context={console,setInterval(){return 1;},performance:{now(){return 0;}},S:{meta:{_v736:{m:1,done:false}},inDialog:false},NM:null,
  document:{body,createElement(tag){const e=fakeElement();e.tagName=tag;e.innerHTML="";return e;},getElementById(id){if(id==="title-screen")return{querySelectorAll(){return[titleChild];}};if(id==="dialogue")return dialogue;if(id==="good-boys-begin")return body.last&&body.last.innerHTML.includes("good-boys-begin")?(body.begin||(body.begin=fakeElement("BEGIN THE INCIDENT"))):null;return null;}},
  nmLoadDistrict(id){loaded=id;this.NM={district:id};return id;},drawNM(){return true;},
  v725:{play(id,cb){if(cb)cb();return true;}},
  v736:{start(){context.nmLoadDistrict("suburbs");context.NM._v736={m:1,active:"katrin",chars:{katrin:{hp:100,maxHp:100},manchez:{hp:100,maxHp:100}},sync:0};}}
};context.globalThis=context;vm.createContext(context);vm.runInContext(src,context,{filename:"good_boys_canon_runtime.js"});
const api=context.TechOpsGoodBoysCanon;assert.ok(api);assert.strictEqual(api.VERSION,3);
assert.strictEqual(api.SEQUENCE[1].name,"THE INCIDENT");assert.strictEqual(api.SEQUENCE[2].name,"HULL BREACH");
assert.strictEqual(api.SEQUENCE[4].objective,"FIND CELL 118 · GET THE PRISONER OUT");
assert.strictEqual(api.SEQUENCE[6].objective,"FREE WALDO IN CELL 1984");
api.cleanTitle();assert.strictEqual(titleChild.style.display,"none","redundant Mike title option must be hidden");
context.v736.start();assert.strictEqual(loaded,"orbital","Good Boys cannot start in suburbs");assert.strictEqual(context.NM.district,"orbital");
context.S.meta._v736.m=2;context.NM=null;loaded=null;context.nmLoadDistrict("industrial");assert.strictEqual(loaded,"orbital","M2 remains orbital");
context.S.meta._v736.m=1;context.NM=null;let handed=false;context.v725.play("b736m1",()=>{handed=true;});
assert.strictEqual(handed,false,"gameplay must wait for explicit intro confirmation");
assert.ok(body.last&&/already aboard an orbital installation/.test(body.last.innerHTML));
assert.ok(!/corrupted satellite/i.test(body.last.innerHTML));assert.ok(!/expecting to rescue mike/i.test(body.last.innerHTML));
assert.ok(body.begin&&typeof body.begin.pointerdown==="function");body.begin.pointerdown({preventDefault(){},stopPropagation(){}});assert.strictEqual(handed,true,"intro must hand directly to gameplay callback");
assert.strictEqual(context.S.inDialog,false,"legacy dialogue state must not trap gameplay");
const raw=src.toLowerCase();assert.ok(raw.includes("play as mike instead"),"runtime must explicitly remove the redundant title copy");assert.ok(raw.includes("missing_pair_state"),"runtime must expose a pair-state health check");
console.log("Good Boys canon runtime/title/handoff: PASS");
