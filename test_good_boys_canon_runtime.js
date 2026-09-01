"use strict";
const assert=require("assert"),fs=require("fs"),vm=require("vm");
const src=fs.readFileSync("good_boys_canon_runtime.js","utf8");
let loaded=null;
function fakeElement(text){return{style:{setProperty(k,v){this[k]=v;}},textContent:text||"",dataset:{},classList:{add(){},toggle(){}},setAttribute(){},addEventListener(type,fn){if(type==="click"||type==="pointerdown")this[type]=fn;},remove(){this.removed=true;},querySelectorAll(){return[];}};}
const titleChild=fakeElement("← play as Mike instead"),body={classList:{add(){},toggle(){}},appendChild(el){this.last=el;}},dialogue=fakeElement();
const context={console,setInterval(){return 1;},setTimeout(fn){fn();return 1;},performance:{now(){return 0;}},S:{meta:{_v736:{m:1,done:false}},inDialog:false,nightMode:false},NM:null,
 document:{body,createElement(tag){const e=fakeElement();e.tagName=tag;e.innerHTML="";return e;},getElementById(id){if(id==="title-screen")return{querySelectorAll(){return[titleChild];}};if(id==="dialogue")return dialogue;if(id==="good-boys-begin")return body.last&&body.last.innerHTML.includes("good-boys-begin")?(body.begin||(body.begin=fakeElement("FOLLOW THE TRAIL"))):null;return null;}},
 enterNight(){context.S.nightMode=true;context.NM={district:"downtown",x:120,y:220};},nmLoadDistrict(id){loaded=id;context.NM=context.NM||{};context.NM.district=id;return id;},drawNM(){return true;},
 v725:{play(id,cb){if(cb)cb();return true;}},v736:{start(){context.NM=context.NM||{x:120,y:220};context.NM._v736={m:1,active:"katrin",chars:{katrin:{hp:100,maxHp:100},manchez:{hp:120,maxHp:120}},partner:{x:60,y:220},sync:0};context.nmLoadDistrict("suburbs");}}
};context.globalThis=context;vm.createContext(context);vm.runInContext(src,context,{filename:"good_boys_canon_runtime.js"});
const api=context.TechOpsGoodBoysCanon;assert.ok(api);assert.ok(api.VERSION>=6);
assert.strictEqual(typeof api.drawHud,"function","canon HUD must be exported for the production compositor");
assert.strictEqual(typeof api.syncIdentity,"function","canon identity sync must be exported for the production router");
assert.strictEqual(api.SEQUENCE[1].name,"WALDO'S HOUSE");assert.strictEqual(api.SEQUENCE[2].name,"THE HIDDEN BAY");assert.strictEqual(api.SEQUENCE[3].name,"MAKE A DOOR");
assert.ok(api.SEQUENCE[4].objective.includes("FREE K"));assert.ok(api.SEQUENCE[6].objective.includes("FREE WALDO"));assert.strictEqual(api.SEQUENCE[8].name,"EARTHFALL");
api.cleanTitle();assert.strictEqual(titleChild.style.display,"none");context.v736.start();assert.strictEqual(loaded,"goodboys_home");assert.strictEqual(context.NM.district,"goodboys_home");
context.S.meta._v736.m=1;context.NM=null;context.S.nightMode=false;let handed=false;context.v725.play("b736m1",()=>{handed=true;context.NM._v736={m:1,active:"katrin",chars:{katrin:{hp:100,maxHp:100},manchez:{hp:120,maxHp:120}},partner:{x:60,y:220},sync:0};});
assert.strictEqual(handed,false);assert.ok(body.last&&/Waldo is gone/.test(body.last.innerHTML));assert.ok(body.begin&&typeof body.begin.pointerdown==="function");body.begin.pointerdown({preventDefault(){},stopPropagation(){}});
assert.strictEqual(context.S.nightMode,true);assert.strictEqual(handed,true);assert.strictEqual(context.NM.district,"goodboys_home");assert.strictEqual(context.S.inDialog,false);
const raw=src.toLowerCase();assert.ok(raw.includes("play as mike instead"));assert.ok(raw.includes("night_runtime_timeout"));assert.ok(raw.includes("preparenightruntime"));assert.ok(raw.includes("productioncompositoractive"));
const assets=fs.readFileSync("good_boys_campaign_assets.js","utf8");assert.ok(/production art only/i.test(assets));assert.ok(!/data:image\/svg\+xml/i.test(assets));assert.ok(assets.includes("assets/v736/katrin_manchez_atlas.png"));assert.ok(assets.includes("waldo_garage")&&assets.includes("orbital_gate")&&assets.includes("orbital_eye"));
console.log("Good Boys Waldo-house canon + production-art authority: PASS");
