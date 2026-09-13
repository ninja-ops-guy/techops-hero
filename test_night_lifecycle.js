'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
let passed=0;
function test(name,run){run();passed++;console.log('PASS '+name);}
function fixture(){
  const store=new Map(),listeners=new Map();
  const c={console,document:null,performance:{now:()=>1000},setInterval:()=>1,clearInterval(){},setTimeout:()=>1,
    S:{day:1,clock:900,budget:100,weather:'storm',meta:{},tickets:[{age:8}],nightMode:null,inDialog:false},
    keys:{d:true},joy:{x:1,y:0},steps:0,draws:0,exits:0,oldClockCalls:0,
    localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},
    addEventListener:(name,fn)=>{const a=listeners.get(name)||[];a.push(fn);listeners.set(name,a);},
    dispatchEvent:e=>(listeners.get(e.type)||[]).forEach(fn=>fn(e)),
    CustomEvent:class{constructor(type,{detail}){this.type=type;this.detail=detail;}},
    v725:{h:{},definitions:{},register(id,def){this.definitions[id]=def;},play(id,done){c.scene={id,done};return true;},skip(){c.scene.done();}},
    stepNM(){c.steps++;},drawNM(){c.draws++;},draw(){},save(){return true;},fmtClock(){return 'old';},
    advanceClock(m){c.oldClockCalls++;c.S.clock+=m;c.S.tickets[0].age+=m;},
    interact:()=> 'old-interact',closeDlg(){c.S.inDialog=false;},dlg(title,body,opts){c.dialog={title,body,opts};c.S.inDialog=true;},
    exitNight(){if(!c.S.nightMode)return;c.exits++;c.S.budget+=c.S.nightMode.cash;c.S.nightMode=null;c.NM=null;c.TechOpsNightRuntime.endVisit(c.S);}
  };
  c.window=c;c.globalThis=c;vm.createContext(c);
  // The real director's claim handling participates in every scene test.
  vm.runInContext(fs.readFileSync('cinematic_systems.js','utf8'),c);
  vm.runInContext(fs.readFileSync('runtime_night.js','utf8'),c);
  const api=c.TechOpsNightRuntime;
  c.enter=()=>{api.beforeEnter(c.S);c.S.clock=Math.max(1080,c.S.clock);const n={district:'home',street:1,x:1489,y:396,w:22,h:34,cash:37,kills:2,done:{},platforms:[],enemies:[]};c.NM=n;c.S.nightMode=n;api.onEntered(c.S,n);return n;};
  return {c,api};
}
test('one frame-owned clock advances once without aging work tickets',()=>{
  const{c,api}=fixture();c.enter();for(let i=0;i<100;i++)api.frame(.05);
  assert.equal(c.S.clock,1081);assert.equal(c.steps,100);assert.equal(c.oldClockCalls,0);assert.equal(c.S.tickets[0].age,8);
  assert.equal(c.advanceClock(20),true);assert.equal(c.S.clock,1101);assert.equal(c.oldClockCalls,0);
});
test('dialogue, pause, game-over and hidden tabs stop time',()=>{
  const{c,api}=fixture();c.enter();for(const key of ['inDialog','inBattle','paused','gameOver']){c.S[key]=true;for(let i=0;i<100;i++)api.tick(.1);c.S[key]=false;}
  c.document={hidden:true};for(let i=0;i<100;i++)api.tick(.1);c.document=null;
  assert.equal(c.S.clock,1080);assert.equal(c.steps,0);
});
test('invalid deltas and suspended frames cannot fast-forward the night',()=>{
  const{c,api}=fixture();c.enter();for(const dt of [Infinity,NaN,-10])api.tick(dt);assert.equal(c.NM._nightLifecycle.seconds,0);
  api.tick(3600);assert.ok(c.NM._nightLifecycle.seconds<=.1);assert.equal(c.S.clock,1080);
});
test('midnight changes display, not the workday or office state',()=>{
  const{c,api}=fixture();c.enter();c.S.clock=1439;api.advance(3);assert.equal(c.S.clock,1442);assert.equal(c.fmtClock(c.S.clock),'00:02');assert.equal(c.S.day,1);assert.equal(api.advance(-20),false);assert.equal(api.advance(Infinity),false);
});
test('travel counts, while Good Dogs and Waldo retain their own loop',()=>{
  const{c,api}=fixture(),n=c.enter();assert.equal(api.active(true),false);n.drive={};for(let i=0;i<50;i++)api.frame(.1);assert.equal(c.S.clock,1081);
  n._v736={m:3};assert.equal(api.frame(.1),false);delete n._v736;n.district='waldo';assert.equal(api.active(n),true,'Waldo departures use the travel owner');n.drive=null;assert.equal(api.frame(.1),false);n.district='home';c.__productionDesiredMode='goodboys';assert.equal(api.frame(.1),false);
});
test('travel dispatcher isolates street simulation, pauses input, and owns Waldo departures',()=>{
  const {c,api}=fixture(),n=c.enter();n.district='waldo';n.onGround=true;n.x=280;
  c.TechOpsNightDistricts={home:{name:'HOME'},waldo:{name:'WALDO'}};
  vm.runInContext(fs.readFileSync('night_travel.js','utf8'),c);
  const travel=c.TechOpsNightTravel;travel.start(n,'home');
  c.ctx=new Proxy({canvas:{width:1000,height:600},createLinearGradient(){return {addColorStop(){}};}},{get(o,k){return k in o?o[k]:()=>{};}});
  c.keys={arrowup:true};c.joy={x:0,y:0};api.frame(.05);
  assert.equal(n.drive.lane,0);assert.equal(c.steps,0,'outgoing street AI never runs during traffic');assert.equal(c.draws,0,'street overlays do not draw over traffic');
  const t=n.drive.elapsed;for(const key of ['inDialog','paused','gameOver']){c.S[key]=true;api.frame(.05);c.S[key]=false;assert.equal(n.drive.elapsed,t);}
  assert.equal(api.openCampaign(),false,'campaign cannot interrupt a trip');
});
test('home requires the spatial ground-level door and explicit interaction',()=>{
  const{c,api}=fixture(),n=c.enter();assert.equal(api.atHome(),true);n.x=1770;assert.equal(api.sleep(),false);n.x=1489;n.y=220;assert.equal(api.atHome(),false);n.y=396;n._sector04={};assert.equal(api.atHome(),false);delete n._sector04;n.drive={};assert.equal(api.atHome(),false);n.drive=null;
  assert.equal(api.openHome(),true);assert.equal(c.exits,0);c.dialog.opts.find(o=>/Stay/.test(o.t)).f();assert.equal(c.S.inDialog,false);assert.equal(c.S.nightMode,n);
});
test('home claims survive the actual stale-dialog guard and block gameplay',()=>{
  const{c,api}=fixture();c.enter();vm.runInContext(fs.readFileSync('production_wrapper_guard.js','utf8'),c);
  assert.equal(api.sleep(),true);assert.equal(c.TechOpsPresentationDirector.isBlocking(),true);
  for(let i=0;i<100;i++){c.TechOpsProductionWrapperGuard.enforce();api.frame(.1);}
  assert.equal(c.S.inDialog,true);assert.equal(c.steps,0);assert.equal(c.S.clock,1080);assert.equal(c.exits,0);
});
test('normal finish and skip use one settlement and clear Night identity',()=>{
  for(const skip of [true,false]){const{c,api}=fixture();c.enter();c.S.meta._char='nightcrawler';c.localStorage.setItem('techops_char','nightcrawler');api.sleep();const done=c.scene.done;if(skip)c.v725.skip();else done();done();c.exitNight(true);
  assert.equal(c.exits,1);assert.equal(c.S.budget,137);assert.equal(c.S.nightMode,null);assert.equal(c.localStorage.getItem('techops_char'),null);assert.equal(c.S.meta._char,undefined);assert.equal(c.__productionActiveMode,'day');assert.equal(c.TechOpsPresentationDirector.isBlocking(),false);assert.equal(c.keys.d,false);assert.equal(c.joy.x,0);}
});
test('stale callbacks release their claim but do not touch a replacement run',()=>{
  const{c,api}=fixture();c.enter();api.sleep();const done=c.scene.done,next={day:8,clock:600,budget:444,meta:{},nightMode:null};c.S=next;c.NM=null;api.frame(.1);done();assert.equal(c.S,next);assert.equal(c.S.budget,444);assert.equal(c.exits,0);assert.equal(c.TechOpsPresentationDirector.isBlocking(),false);
});
test('missing cinematic renderer keeps an explicit safe continuation',()=>{
  const{c,api}=fixture();c.enter();c.v725=null;api.sleep();assert.equal(c.exits,0);c.dialog.opts[0].f();assert.equal(c.exits,1);assert.equal(c.TechOpsPresentationDirector.isBlocking(),false);
});
test('campaign discovery cannot invent prerequisites or evidence',()=>{
  const{c,api}=fixture();c.enter();const story={campaign:{day:1},flags:{day_work_unlocked:false},evidence:{}};c.TechOpsCampaign={load:()=>story};c.TechOpsSector04Runtime={enterBrowser(){}};
  const original=JSON.stringify(story);api.openCampaign();assert.match(c.dialog.body,/standup/);assert.equal(c.dialog.opts.some(o=>/Enter Sector/.test(o.t)),false);assert.equal(JSON.stringify(story),original);story.flags.day_work_unlocked=true;api.openCampaign();assert.match(c.dialog.body,/Identity evidence missing/);assert.equal(c.dialog.opts.some(o=>/Enter Sector/.test(o.t)),true);
});
test('same-day return preserves evidence, original clock, weather and cash',()=>{
  const{c,api}=fixture();c.enter();const story={campaign:{day:1},flags:{},evidence:{preserved:true}};c.TechOpsCampaign={load:()=>story};api.resumeDay();c.scene.done();assert.equal(c.S.clock,900);assert.equal(c.S.day,1);assert.equal(c.S.weather,'storm');assert.equal(c.S.budget,137);assert.equal(story.evidence.preserved,true);
});
test('delayed day notices are scoped to state, day and mode generation',()=>{
  const src=fs.readFileSync('game.js','utf8'),body=src.slice(src.indexOf('function dayNotice('),src.indexOf('// ---------- game loop ----------'));const c={S:{day:1},hit:0};c.window=c;vm.createContext(c);vm.runInContext(body,c);const f=c.dayNotice(()=>c.hit++);f();c.S.nightMode={};f();c.S.nightMode=null;c.S._modeEpoch=1;f();assert.equal(c.hit,1);const g=c.dayNotice(()=>c.hit++);c.S.day++;g();assert.equal(c.hit,1);
});
function sectorFixture(){
  const{c,api}=fixture(),C=require('./campaign_act1.js');c.TechOpsCampaign=C;c.TechOpsSector04=require('./campaign_sector04.js');const story=C.createInitialState();C.assignTicket(story,'shipping_cannot_print','mike');C.assignTicket(story,'plating_workstation_down','amit');C.assignTicket(story,'impossible_access_event','mike');C.completeStandup(story);C.completeWorkstation(story,{redInTheMirrorHeard:true,feliciaVideoSeen:true});C.save(story,c.localStorage);c.enterCalls=0;c.enterNight=()=>{c.enterCalls++;};c.nmJab=()=>{};vm.runInContext(fs.readFileSync('campaign_sector04_runtime.js','utf8'),c);c.TechOpsSector04Runtime.install();return{c,api,rt:c.TechOpsSector04Runtime};
}
test('real Sector 04 adapter waits for Night Drive and reuses the encounter',()=>{
  const{c,rt}=sectorFixture();assert.equal(rt.enterBrowser().pending,true);assert.equal(c.enterCalls,1);c.enter();const n=c.S.nightMode;assert.equal(n.district,'sector04');n.x=750;rt.enterBrowser();assert.equal(c.S.nightMode,n);assert.equal(n.x,750);assert.equal(c.enterCalls,1);
});
test('pending Sector 04 attachment cannot enter a different run',()=>{
  const{c,rt}=sectorFixture();rt.enterBrowser();c.S={day:1,clock:900,meta:{},nightMode:null};c.enter();assert.equal(c.S.nightMode.district,'home');
});
test('one dispatch, no competing heartbeat or automatic edge sleep',()=>{
  const src=fs.readFileSync('runtime_night.js','utf8');assert.doesNotMatch(src,/setInterval\s*\(/);assert.match(fs.readFileSync('game.js','utf8'),/!nightRuntime\.frame\(dt\)/);assert.doesNotMatch(fs.readFileSync('night_hooks.js','utf8'),/NM\.district === "home" && NM\.x[^\n]*exitNight/);assert.match(src,/overflow-y:auto/);
});
console.log(`Night lifecycle: ${passed} regression groups passed`);
