"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");
const src=fs.readFileSync("runtime_night.js","utf8");
let intervalFn=null,dialog=null,exitCalls=0,clockCalls=0;
const classList={add(){},remove(){},contains(){return false;}};
const document={hidden:false,readyState:"complete",head:{appendChild(){}},body:{appendChild(){}},activeElement:null,
  getElementById(id){return id==="toast"?{classList}:null;},
  createElement(tag){return {tagName:tag,className:"",style:{},classList,appendChild(){},setAttribute(){},remove(){},focus(){},getContext(){return {drawImage(){}}}};},
  addEventListener(){},removeEventListener(){}};
const S={clock:1200,nightMode:null,inDialog:false,inBattle:false,paused:false,gameOver:false,day:1};
const NM={district:"downtown",x:100,y:100,enemies:[],done:{},cash:50,kills:1};S.nightMode=NM;
let currentNow=1000;
const ctx={globalThis:null,window:null,document,S,NM,performance:{now:()=>currentNow},
  setInterval(fn){intervalFn=fn;return 1;},clearInterval(){},requestAnimationFrame(){return 1;},cancelAnimationFrame(){},matchMedia(){return {matches:true};},
  updateHUD(){},advanceClock(min){clockCalls+=min;S.clock+=min;},exitNight(){exitCalls++;S.nightMode=null;},enterNight(){S.nightMode=NM;},interact(){},
  nmCarMenu(){ctx.dlg("🚗 THE CHARGER — where to?","",[{t:"Home",f(){}}]);},toast(){},closeDlg(){S.inDialog=false;},
  dlg(title,text,opts){dialog={title,text,opts};S.inDialog=true;},
  TechOpsCampaign:{load(){return {flags:{day_work_unlocked:true},campaign:{day:1},evidence:{ghostIdentityEvidence:{status:"established"}}};}},localStorage:{},
  TechOpsSector04Runtime:{enterBrowser(){}}
};
ctx.globalThis=ctx;ctx.window=ctx;vm.createContext(ctx);vm.runInContext(src,ctx,{filename:"runtime_night.js"});
assert.equal(ctx.TechOpsNightFlow.health().installed,true);
assert.equal(typeof intervalFn,"function");
ctx.advanceClock(20);assert.equal(S.clock,1200);assert.equal(clockCalls,0,"street completion jump must be suppressed");
ctx.advanceClock(5);assert.equal(S.clock,1205);assert.equal(clockCalls,0,"night clock must not invoke daytime ticket simulation");
ctx.nmCarMenu();assert.match(dialog.opts[0].t,/NIGHT WALKER CAMPAIGN/);
dialog.opts[0].f();assert.match(dialog.title,/AFTER HOURS/);assert.equal(dialog.opts[0].t,"Enter Sector 04 — campaign mission");
S.inDialog=false;NM.district="home";NM.x=1600;ctx.exitNight(true);assert.equal(exitCalls,0);assert.equal(dialog.title,"MIKE'S HOUSE");
S.inDialog=false;NM.x=100;NM.district="downtown";const before=S.clock;
for(let i=0;i<25;i++){currentNow+=100;intervalFn();}
assert.ok(S.clock>before,"active night time must advance while standing still");
console.log("runtime_night smoke: PASS");
