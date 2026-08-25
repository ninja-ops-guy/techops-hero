"use strict";
const assert=require("assert"),fs=require("fs"),vm=require("vm");
const src=fs.readFileSync("good_boys_canon_runtime.js","utf8");
let loaded=null;
function fakeElement(text){return{style:{setProperty(k,v){this[k]=v;}},textContent:text||"",dataset:{},classList:{add(){},toggle(){}},setAttribute(){},addEventListener(type,fn){if(type==="click"||type==="pointerdown")this[type]=fn;},remove(){this.removed=true;},querySelectorAll(){return[];}};}
const titleChild=fakeElement("← play as Mike instead");
const body={classList:{toggle(){}},appendChild(el){this.last=el;}};
const dialogue=fakeElement();
const context={console,setInterval(){return 1;},setTimeout(fn){fn();return 1;},performance:{now(){return 0;}},S:{meta:{_v736:{m:1,done:false}},inDialog:false,nightMode:false},NM:null,
  document:{body,createElement(tag){const e=fakeElement();e.tagName=tag;e.innerHTML="";return e;},getElementById(id){if(id==="title-screen")return{querySelectorAll(){return[titleChild];}};if(id==="dialogue")return dialogue;if(id==="good-boys-begin")return body.last&&body.last.innerHTML.includes("good-boys-begin")?(body.begin||(body.begin=fakeElement("BEGIN THE INCIDENT"))):null;return null;}},
  enterNight(){context.S.nightMode=true;context.NM={district:"downtown",x:120,y:220};},
  nmLoadDistrict(id){loaded=id;context.NM=context.NM||{};context.NM.district=id;return id;},drawNM(){return true;},
  v725:{play(id,cb){if(cb)cb();return true;}},
  v736:{start(){context.nmLoadDistrict("suburbs");context.NM._v736={m:1,active:"katrin",chars:{katrin:{hp:100,maxHp:100},manchez:{hp:120,maxHp:120}},partner:{x:60,y:220},sync:0};}}
};context.globalThis=context;vm.createContext(context);vm.runInContext(src,context,{filename:"good_boys_canon_runtime.js"});
const api=context.TechOpsGoodBoysCanon;assert.ok(api);assert.strictEqual(api.VERSION,4);
assert.strictEqual(api.SEQUENCE[1].name,"THE INCIDENT");assert.strictEqual(api.SEQUENCE[2].name,"HULL BREACH");
assert.ok(api.SEQUENCE[4].objective.includes("FREE K"));assert.ok(api.SEQUENCE[6].objective.includes("FREE WALDO"));
api.cleanTitle();assert.strictEqual(titleChild.style.display,"none","redundant Mike title option must be hidden");
context.v736.start();assert.strictEqual(loaded,"orbital","Good Boys cannot start in suburbs");assert.strictEqual(context.NM.district,"orbital");
context.S.meta._v736.m=1;context.NM=null;context.S.nightMode=false;let handed=false;context.v725.play("b736m1",()=>{handed=true;context.nmLoadDistrict("suburbs");context.NM._v736={m:1,active:"katrin",chars:{katrin:{hp:100,maxHp:100},manchez:{hp:120,maxHp:120}},partner:{x:60,y:220},sync:0};});
assert.strictEqual(handed,false,"gameplay must wait for explicit intro confirmation");assert.ok(body.last&&/already aboard an orbital installation/.test(body.last.innerHTML));
assert.ok(body.begin&&typeof body.begin.pointerdown==="function");body.begin.pointerdown({preventDefault(){},stopPropagation(){}});
assert.strictEqual(context.S.nightMode,true,"Good Boys must prime Night runtime before mission callback");assert.strictEqual(handed,true,"intro must hand to gameplay after NM is ready");assert.strictEqual(context.NM.district,"orbital");assert.strictEqual(context.S.inDialog,false);
const raw=src.toLowerCase();assert.ok(raw.includes("play as mike instead"));assert.ok(raw.includes("night_runtime_timeout"));assert.ok(raw.includes("prepareNightRuntime".toLowerCase()));
console.log("Good Boys canon runtime/async handoff: PASS");
