'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const runtime=fs.readFileSync('runtime_night.js','utf8'),game=fs.readFileSync('game.js','utf8');
let passed=0;
function test(name,run){run();passed++;console.log('PASS '+name);}
const plain=value=>JSON.parse(JSON.stringify(value));
function fixture(){
  const data=new Map([['techops_save','day-bytes'],['techops_day_checkpoint_v1','day-world-bytes'],['techops_hero_campaign_v1','campaign-bytes'],['techops_good_dogs_session_v1','dogs-bytes']]),events={},elements={};
  const node=()=>{const classes=new Set(['hidden']);return {style:{setProperty(k,v){this[k]=v;},removeProperty(k){delete this[k];}},classList:{add:k=>classes.add(k),remove:k=>classes.delete(k),contains:k=>classes.has(k)},textContent:'',addEventListener(){}};};
  for(const id of ['title-screen','hud','dialogue','panel','battle','eod','touch-ui'])elements[id]=node();
  const c={console,document:null,performance:{now:()=>5000},setInterval:()=>1,clearInterval(){},setTimeout:()=>1,isFinite,
    S:null,NM:null,keys:{d:true,j:true},joy:{x:1,y:-1},exits:0,reloads:0,
    localStorage:{getItem:k=>data.get(k)||null,setItem(k,v){if(c.quota)throw new Error('QuotaExceededError');data.set(k,String(v));},removeItem:k=>data.delete(k)},
    addEventListener:(key,fn)=>{events[key]=fn;},stepNM(){},drawNM(){},draw(){},
    closeDlg(){if(c.S)c.S.inDialog=false;},dlg(title,body,options){c.dialog={title,body,options};c.S.inDialog=true;},
    exitNight(){if(!c.S.nightMode)return false;c.exits++;c.S.budget+=c.NM.cash;c.S.nightMode=null;c.NM=null;c.TechOpsNightRuntime.endVisit(c.S);return true;},
    location:{reload(){c.reloads++;}},TechOpsStateValidator:{assertBeforeSave:()=>true},
    newState:()=>({}),$:id=>elements[id],showTouchUI(){},initMusic(){},updateHUD(){},
    DAY_CHECKPOINT_KEY:'techops_day_checkpoint_v1',NIGHT_CRAWLER_SAVE_KEY:'techops_nightcrawler_session_v1',GOOD_DOGS_SAVE_KEY:'techops_good_dogs_session_v1'
  };
  c.window=c;c.globalThis=c;vm.createContext(c);
  vm.runInContext(runtime,c);
  const restore=game.match(/window\.TechOpsRestoreNightState = function\(snapshot\) \{[\s\S]*?\n\};/);
  assert.ok(restore);vm.runInContext(restore[0],c);
  const saves=game.match(/const PROFILE_SAVE_SCHEMA_VERSION = \d+;\nconst save = \(\) => \{[\s\S]*?\nfunction loadDayCheckpoint\(profile\) \{[\s\S]*?\n\}/);
  vm.runInContext(saves[0]+'\nthis.saveFromGame=save;',c);
  c.save=c.saveFromGame;
  function start(){
    c.S={day:1,clock:1191,xp:5,budget:80,stress:10,hp:40,maxHp:40,diff:1.3,meta:{_standaloneMode:'nightcrawler',_char:'nightcrawler',nightVisit:{active:true,day:1,clock:1191,returnClock:540}},map:[[0,0],[0,0]],
      certs:[],inv:[],journal:[],ach:[],books:[],lab:[],staff:[],infra:[],stats:{networking:1},soft:{patience:1},rep:{IT:2},inDialog:false,inBattle:false,gameOver:false,moving:true};
    c.NM={district:'industrial',street:2,done:{downtown:true},drive:null,x:777,y:396,w:22,h:34,hp:63,vx:3,vy:0,face:1,onGround:true,cash:215,kills:4,clear:false,cam:600,block:true,jHeld:true,
      platforms:[{x:300,y:330,w:130,h:14}],enemies:[{kind:'guard',x:840,y:397,w:27,h:33,hp:16,maxHp:68,dmg:15,spd:.7,alive:true,cash:[22,32],windup:8},{kind:'thug',x:955,y:400,w:24,h:30,hp:-3,maxHp:48,dmg:10,spd:1,alive:false,cash:[15,25]}],
      _nightLifecycle:{seconds:2.35,weather:'rain',exitCommitted:false}};
    c.S.nightMode=c.NM;return c.S;
  }
  function startWaldo(){
    start();c.NM.district='waldo';c.NM.street=1;c.NM.enemies=[];c.NM.platforms=[];c.NM.done={};
    c.NM.waldo={used:{},mow:null,repair:null,waldoX:900,waldoDir:1,waldoT:0};
    c.S.car={engine:80,tires:75,brakes:70,battery:85,body:90};return c.S;
  }
  return {c,api:c.TechOpsNightRuntime,data,events,elements,start,startWaldo};
}
test('the real game save checkpoints the complete isolated Night world',()=>{
  const {c,api,data,start}=fixture();start();const before=new Map(data);
  assert.equal(c.saveFromGame(),true);const record=api.checkpointStatus();assert.equal(record.status,'ready');
  assert.equal(record.state.diff,1.3);assert.equal(record.state.clock,1191);assert.equal(record.state.nightMode.hp,63);
  assert.equal(record.state.nightMode.district,'industrial');assert.equal(record.state.nightMode.street,2);
  assert.deepEqual(plain(record.state.nightMode.done),{downtown:true});assert.equal(record.state.nightMode.cash,215);assert.equal(record.state.nightMode.kills,4);
  assert.equal(record.state.nightMode.enemies[0].hp,16);assert.equal(record.state.nightMode.enemies[1].hp,-3);assert.equal(record.state.nightMode.enemies[1].alive,false);
  for(const [key,value] of before)assert.equal(data.get(key),value,'Night must not alter '+key);
});
test('resume restores durable location and travel, without held actions or stale modal callbacks',()=>{
  const {c,api,start}=fixture();start();c.S.inDialog=true;c.S.paused=true;c.NM.drive={to:'airport',t:620,dur:1500};
  vm.runInContext(fs.readFileSync('night_combat.js','utf8'),c);
  const enemy=c.NM.enemies[0];c.TechOpsNightCombat.stepEnemy(c.NM,enemy,0);
  enemy._nightCombat.held=true;enemy._nightCombat.stunUntil=1200;
  Object.assign(c.TechOpsNightCombat.state(c.NM),{time:1000,grab:{enemy,at:800},follow:{enemy},attack:{buffer:{keys:{j:true}}}});
  assert.equal(api.saveCheckpoint(),true);assert.equal(enemy._nightCombat.held,true,'saving must not mutate live combat');
  c.S=null;c.NM=null;assert.equal(api.resumeCheckpoint(),true);
  assert.equal(c.S.nightMode,c.NM);assert.equal(c.S.inDialog,false);assert.equal(c.S.paused,false);assert.equal(c.S.moving,false);
  assert.equal(c.NM.x,777);assert.equal(c.NM.y,396);assert.equal(c.NM.hp,63);assert.equal(c.S.clock,1191);assert.equal(c.S.diff,1.3);
  assert.deepEqual(plain(c.NM.drive),{to:'airport',t:620,dur:1500});assert.equal(c.NM._nightLifecycle.seconds,2.35);
  assert.equal(c.NM._nightCombat.grab,null);assert.equal(c.NM._nightCombat.attack,null);assert.equal(c.NM.enemies[0]._nightCombat.held,false);
  assert.equal(c.NM.enemies[0].hp,16);assert.equal(c.NM.block,false);assert.equal(c.NM.jHeld,false);assert.equal(c.keys.d,false);assert.equal(c.joy.x,0);assert.equal(c.joy.y,0);
});
test('all street districts, final clear states and active drive checkpoints are supported',()=>{
  const {c,api,start}=fixture();start();
  for(const district of ['downtown','longwharf','industrial','wooster','airport','suburbs','home']){
    c.NM.district=district;c.NM.street=district==='home'?1:2;c.NM.enemies=[];c.NM.done[district]=true;c.NM.clear=false;
    assert.equal(api.saveCheckpoint(),true,district);assert.equal(api.checkpointStatus().status,'ready',district);
  }
  c.NM.drive={to:'downtown',t:0,dur:1500};assert.equal(api.saveCheckpoint(),true);
});
test("Waldo travel, property activity, departure and once-only rewards survive a complete reload loop",()=>{
  const {c,api,data,events,startWaldo}=fixture();startWaldo();const otherSlots=new Map(data);
  c.NM.drive={to:'waldo',t:620,dur:1500};assert.equal(api.saveCheckpoint(),true);
  c.S=null;c.NM=null;assert.equal(api.resumeCheckpoint(),true);assert.deepEqual(plain(c.NM.drive),{to:'waldo',t:620,dur:1500});
  c.NM.drive=null;c.NM.x=742;c.NM.cam=300;c.NM.waldo.waldoX=933;c.NM.waldo.waldoDir=-1;c.NM.waldo.waldoT=1.2;
  c.NM.waldo.mow={cells:Array.from({length:24},(_,i)=>i<7?2:i===7?1:0),done:false,cutSfx:4800};
  c.NM.waldo.used.grill=true;c.S.meta._v733smokePaid=true;c.S.meta._v733docs=['sat-ground-station'];
  c.S.inDialog=true;events.pagehide();const saved=data.get(api.CHECKPOINT_KEY);assert.equal(JSON.parse(saved).state.inDialog,false);
  c.S=null;c.NM=null;assert.equal(api.resumeCheckpoint(),true);
  assert.equal(api.active(c.NM),false,'Waldo must not acquire Night frame, clock, HUD or combat ownership');
  assert.equal(c.NM.x,742);assert.equal(c.NM.cam,300);assert.equal(c.NM.waldo.waldoX,933);assert.equal(c.NM.waldo.waldoDir,-1);assert.equal(c.NM.waldo.waldoT,1.2);
  assert.deepEqual(plain(c.NM.waldo.mow.cells),Array.from({length:24},(_,i)=>i<7?2:i===7?1:0));assert.equal(c.NM.waldo.used.grill,true);
  assert.equal(c.S.meta._v733smokePaid,true);assert.deepEqual(plain(c.S.meta._v733docs),['sat-ground-station']);
  c.NM.waldo.mow.cells.fill(2);c.NM.waldo.mow.done=true;c.NM.waldo.used.mow=true;c.S.meta._v733q1=true;c.S.meta.orbital=true;
  c.NM.waldo.repair={part:'brakes',marker:.47,dir:-1,rounds:2,hits:1};c.S.budget=60;
  for(let i=0;i<105;i++)api.frame(.05);assert.equal(api.checkpointStatus().state.nightMode.waldo.repair.marker,.47,'frame autosave must include Waldo without simulating its clock');
  c.NM.drive={to:'home',t:300,dur:1500};assert.equal(api.saveCheckpoint(),true);
  c.S=null;c.NM=null;assert.equal(api.resumeCheckpoint(),true);
  assert.deepEqual(plain(c.NM.drive),{to:'home',t:300,dur:1500});assert.deepEqual(plain(c.NM.waldo.repair),{part:'brakes',marker:.47,dir:-1,rounds:2,hits:1});
  assert.equal(c.NM.waldo.used.mow,true);assert.equal(c.S.meta._v733q1,true);assert.equal(c.S.budget,60);
  for(const [key,value] of otherSlots)assert.equal(data.get(key),value,'Waldo recovery must not alter '+key);
});
test("malformed Waldo checkpoints fail closed without replacing live state or saved bytes",()=>{
  const {c,api,data,startWaldo}=fixture();startWaldo();c.NM.waldo.mow={cells:new Array(24).fill(0),done:false};assert.equal(api.saveCheckpoint(),true);
  const valid=data.get(api.CHECKPOINT_KEY),live=c.S,otherSlots=new Map(data),cases=[
    ['missing property',n=>{delete n.waldo;}],['property array',n=>{n.waldo=[];}],['used array',n=>{n.waldo.used=[];}],
    ['non-boolean use',n=>{n.waldo.used.grill='yes';}],['unknown use',n=>{n.waldo.used.unknown=true;}],
    ['invalid position',n=>{n.waldo.waldoX=null;}],['invalid direction',n=>{n.waldo.waldoDir=0;}],['invalid wander timer',n=>{n.waldo.waldoT=-1;}],
    ['short lawn',n=>{n.waldo.mow.cells.pop();}],['invalid lawn cell',n=>{n.waldo.mow.cells[0]=3;}],['invalid mow completion',n=>{n.waldo.mow.done='yes';}],
    ['invalid mow sound time',n=>{n.waldo.mow.cutSfx=null;}],['repair array',n=>{n.waldo.repair=[];}],['unknown repair part',n=>{n.waldo.repair={part:'warp',marker:.5,dir:1,rounds:3,hits:0};}],
    ['invalid repair marker',n=>{n.waldo.repair={part:'brakes',marker:2,dir:1,rounds:3,hits:0};}],['invalid repair direction',n=>{n.waldo.repair={part:'brakes',marker:.5,dir:0,rounds:3,hits:0};}],
    ['invalid repair rounds',n=>{n.waldo.repair={part:'brakes',marker:.5,dir:1,rounds:4,hits:0};}],['excess repair hits',n=>{n.waldo.repair={part:'brakes',marker:.5,dir:1,rounds:3,hits:4};}]
  ];
  for(const [name,mutate] of cases){
    const record=JSON.parse(valid);mutate(record.state.nightMode);const raw=JSON.stringify(record);data.set(api.CHECKPOINT_KEY,raw);
    assert.equal(api.checkpointStatus().status,'invalid',name);assert.equal(api.resumeCheckpoint(),false,name);
    assert.equal(c.S,live,name+' must not replace live state');assert.equal(data.get(api.CHECKPOINT_KEY),raw,name+' must retain the original bytes');
    for(const [key,value] of otherSlots)if(key!==api.CHECKPOINT_KEY)assert.equal(data.get(key),value,name+' must not alter '+key);
  }
});
test('corrupt, future, malformed and foreign saves never mutate live state or other slots',()=>{
  const {c,api,data,start}=fixture();start();api.saveCheckpoint();const valid=data.get(api.CHECKPOINT_KEY),live=c.S;
  const wrongMode=JSON.parse(valid);wrongMode.state.meta._standaloneMode='gooddogs';
  const wrongSector=JSON.parse(valid);wrongSector.state.nightMode._sector04={};
  const badEnemy=JSON.parse(valid);badEnemy.state.nightMode.enemies[0].hp=null;
  const future=JSON.parse(valid);future.version=99;
  for(const raw of ['{broken',JSON.stringify(wrongMode),JSON.stringify(wrongSector),JSON.stringify(badEnemy),JSON.stringify(future),JSON.stringify({meta:{_standaloneMode:'nightcrawler'}})]){
    data.set(api.CHECKPOINT_KEY,raw);assert.equal(api.checkpointStatus().status,'invalid');assert.equal(api.resumeCheckpoint(),false);assert.equal(c.S,live);assert.equal(data.get(api.CHECKPOINT_KEY),raw);
  }
});
test('malformed combat checkpoints stop before restoration and preserve all saved bytes',()=>{
  const {c,api,data,start}=fixture();start();
  vm.runInContext(fs.readFileSync('night_combat.js','utf8'),c);
  c.TechOpsNightCombat.state(c.NM);
  c.TechOpsNightCombat.stepEnemy(c.NM,c.NM.enemies[0],0);
  assert.equal(api.saveCheckpoint(),true);
  const valid=data.get(api.CHECKPOINT_KEY),live=c.S,otherSlots=new Map(data);
  const cases=[
    ['event container',n=>{n._nightCombat.events={};}],
    ['effect container',n=>{n._nightCombat.fx={};}],
    ['missing effects',n=>{delete n._nightCombat.fx;}],
    ['combat array',n=>{n._nightCombat=[];}],
    ['invalid combat timer',n=>{n._nightCombat.stunUntil='later';}],
    ['invalid event sequence',n=>{n._nightCombat.serial='invalid';}],
    ['invalid relay counter',n=>{n._nightCombat.relay='invalid';}],
    ['enemy primitive',n=>{n.enemies[0]._nightCombat=4;}],
    ['enemy array',n=>{n.enemies[0]._nightCombat=[];}],
    ['reaction flag',n=>{n.enemies[0]._nightCombat.air='yes';}],
    ['reaction velocity',n=>{n.enemies[0]._nightCombat.vy=null;}],
    ['reaction hit counter',n=>{n.enemies[0]._nightCombat.airHits='invalid';}],
    ['collision history',n=>{n.enemies[0]._nightCombat.flightHits={};}],
    ['collision identity',n=>{n.enemies[0]._nightCombat.flightHits=['2'];}],
    ['airborne velocity missing',n=>{n.enemies[0]._nightCombat.air=true;delete n.enemies[0]._nightCombat.vx;}],
    ['thrown collision history missing',n=>{n.enemies[0]._nightCombat.air=true;n.enemies[0]._nightCombat.thrown=true;delete n.enemies[0]._nightCombat.flightHits;}]
  ];
  for(const key of ['time','stunUntil','lastInput','lastHit','serial'])cases.push(['missing combat '+key,n=>{delete n._nightCombat[key];}]);
  for(const key of ['id','stunUntil','air','airHits','recoverUntil','vx','vy','flightHits','held'])cases.push(['missing reaction '+key,n=>{delete n.enemies[0]._nightCombat[key];}]);
  for(const [name,mutate] of cases){
    const record=JSON.parse(valid);mutate(record.state.nightMode);const raw=JSON.stringify(record);data.set(api.CHECKPOINT_KEY,raw);
    assert.equal(api.checkpointStatus().status,'invalid',name);assert.equal(api.resumeCheckpoint(),false,name);
    assert.equal(c.S,live,name+' must not replace live state');assert.equal(data.get(api.CHECKPOINT_KEY),raw,name+' must retain the original bytes');
    for(const [key,value] of otherSlots)if(key!==api.CHECKPOINT_KEY)assert.equal(data.get(key),value,name+' must not alter '+key);
  }
});
test('a real airborne throw resumes with finite physics and no repeated collision reward',()=>{
  const {c,api,data,start}=fixture();start();
  vm.runInContext(fs.readFileSync('night_combat.js','utf8'),c);
  const combat=c.TechOpsNightCombat,n=c.NM,e=n.enemies[0],other=n.enemies[1];
  n.block=false;n.x=777;e.x=810;e.hp=e.maxHp=100;other.alive=true;other.hp=other.maxHp=100;other.x=827;other.y=e.y;
  assert.equal(combat.grab(n,{}),true);combat.tick(n,.05,{});combat.tick(n,.05,{});combat.tick(n,.05,{});
  assert.equal(combat.attack(n,{arrowright:true},'punch'),true);
  combat.stepEnemy(n,e,.016);
  assert.ok(e._nightCombat.air&&e._nightCombat.thrown,'fixture must checkpoint a real in-flight throw');
  assert.ok(e._nightCombat.flightHits.includes(other._nightCombat.id),'fixture must include a prior collision');
  const before={hp:e.hp,otherHp:other.hp,cash:n.cash,kills:n.kills,time:n._nightCombat.time,flightHits:plain(e._nightCombat.flightHits)};
  assert.equal(api.saveCheckpoint(),true);const valid=data.get(api.CHECKPOINT_KEY);
  for(const mutate of [n=>{n.enemies[0]._nightCombat.airHits='invalid';},n=>{delete n.enemies[0]._nightCombat.stunUntil;},n=>{n._nightCombat.serial='invalid';}]){
    const record=JSON.parse(valid);mutate(record.state.nightMode);const raw=JSON.stringify(record);data.set(api.CHECKPOINT_KEY,raw);
    assert.equal(api.checkpointStatus().status,'invalid');assert.equal(api.resumeCheckpoint(),false);assert.equal(c.NM,n);assert.equal(data.get(api.CHECKPOINT_KEY),raw);
  }
  data.set(api.CHECKPOINT_KEY,valid);c.S=null;c.NM=null;assert.equal(api.resumeCheckpoint(),true);
  const restored=c.NM,thrown=restored.enemies[0],target=restored.enemies[1];
  assert.equal(restored._nightCombat.attack,null,'queued player action is retired without replaying contact');
  assert.equal(thrown._nightCombat.air,true);assert.deepEqual(plain(thrown._nightCombat.flightHits),before.flightHits);
  assert.equal(restored._nightCombat.time,before.time);assert.equal(thrown.hp,before.hp);
  combat.tick(restored,.016,{});combat.stepEnemy(restored,thrown,.016);
  assert.ok(Number.isFinite(thrown.x)&&Number.isFinite(thrown.y),'restored enemy physics must remain playable');
  assert.equal(target.hp,before.otherHp,'a previously struck collision target must not take the same flight hit again');
  assert.equal(restored.cash,before.cash);assert.equal(restored.kills,before.kills);
  assert.equal(combat.attack(restored,{},'punch'),true);combat.tick(restored,.05,{});combat.tick(restored,.05,{});
  assert.ok(thrown.hp<before.hp,'a fresh player attack must still connect after recovery');
  assert.equal(thrown._nightCombat.airHits,1,'a resumed juggle retains its finite hit budget');
  assert.ok(Number.isFinite(thrown._nightCombat.stunUntil));assert.ok(Number.isSafeInteger(restored._nightCombat.serial));
  assert.ok(restored._nightCombat.events.length>0&&restored._nightCombat.events.every(event=>Number.isSafeInteger(event.id)),'post-resume events retain numeric identities');
  assert.equal(api.saveCheckpoint(),true,'the recovered fight remains valid for its next checkpoint');
});
test('quota failure preserves the previous snapshot and reports failure until retry succeeds',()=>{
  const {c,api,data,start}=fixture();start();assert.equal(api.saveCheckpoint(),true);const original=data.get(api.CHECKPOINT_KEY);
  c.NM.x=888;c.quota=true;assert.equal(c.saveFromGame(),false);assert.equal(data.get(api.CHECKPOINT_KEY),original);assert.match(api.health().checkpointError,/not saved/);assert.ok(c.__techopsSaveError);
  c.quota=false;assert.equal(c.saveFromGame(),true);assert.equal(api.checkpointStatus().state.nightMode.x,888);assert.equal(api.health().checkpointError,null);assert.equal(c.__techopsSaveError,null);
});
test('frame checkpoints and pagehide retain real progress without a second simulation timer',()=>{
  const {c,api,events,start}=fixture();start();api.frame(.05);assert.equal(api.checkpointStatus().status,'ready');
  c.NM.x=912;for(let i=0;i<105;i++)api.frame(.05);assert.equal(api.checkpointStatus().state.nightMode.x,912);
  c.NM.cash=240;api.frame(.05);assert.equal(api.checkpointStatus().state.nightMode.cash,240);
  c.NM.x=1024;c.S.inDialog=true;events.pagehide();assert.equal(api.checkpointStatus().state.nightMode.x,1024);assert.equal(api.checkpointStatus().state.inDialog,false);
});
test('fractional minute rollover remains a valid checkpoint and autosaves the next minute',()=>{
  const {c,api,start}=fixture();start();c.NM._nightLifecycle.seconds=0;c.S.clock=1199;
  for(let i=0;i<100;i++)api.tick(.05);
  assert.equal(c.S.clock,1200);assert.ok(c.NM._nightLifecycle.seconds>=0);assert.equal(api.checkpointStatus().status,'ready');
  assert.equal(api.checkpointStatus().state.clock,1200);assert.equal(api.saveCheckpoint(),true);
});
test('a standalone run cannot enter or mutate the campaign through its run menu',()=>{
  const {c,api,data,start}=fixture();start();c.TechOpsCampaign={load(){throw new Error('standalone touched campaign');}};
  assert.equal(api.resumeDay(),false,'standalone cannot bypass isolation through the runtime return API');
  assert.equal(api.openCampaign(),true);assert.match(c.dialog.title,/STANDALONE/);assert.equal(c.dialog.options.some(o=>/Sector/.test(o.t)),false);
  c.dialog.options[0].f();assert.equal(c.reloads,1);assert.equal(api.checkpointStatus().status,'ready');assert.equal(data.get('techops_hero_campaign_v1'),'campaign-bytes');
});
test('completion retires the saved run before paying rewards and retries failed storage explicitly',()=>{
  const {c,api,start}=fixture();start();api.saveCheckpoint();c.quota=true;
  assert.equal(c.exitNight(true),false);assert.equal(c.exits,0);assert.equal(c.S.budget,80);assert.equal(api.checkpointStatus().status,'ready');assert.match(c.dialog.title,/NOT SAVED/);
  c.quota=false;c.dialog.options[0].f();assert.equal(c.exits,1);assert.equal(c.S.budget,295);assert.equal(api.checkpointStatus().status,'empty');
  c.exitNight(true);assert.equal(c.exits,1);assert.equal(api.resumeCheckpoint(),false);
});
test('title router resumes the checkpoint once without starting a new run, difficulty or intro',()=>{
  const {c,api,elements,start}=fixture();start();api.saveCheckpoint();c.S=null;c.NM=null;
  c.document={getElementById:id=>elements[id]||null,addEventListener(){}};
  c.enterNight=()=>{throw new Error('resume replayed intro');};c.startRun=()=>{throw new Error('resume reset run');};
  vm.runInContext(fs.readFileSync('production_mode_router.js','utf8'),c);
  assert.equal(c.TechOpsProductionModeRouter.launchNightCrawler(true),true);
  assert.equal(c.__productionNightLaunchOk,true);assert.equal(c.__productionActiveMode,'nightcrawler');assert.equal(c.NM.x,777);assert.equal(c.S.diff,1.3);assert.equal(c.S.clock,1191);
  assert.equal(c.__productionNightLaunchTrace.filter(item=>item.event==='checkpoint.restored').length,1);
});
test('a failed restore remains stopped through health polls and keeps the saved checkpoint',()=>{
  for(const throws of [false,true]){
    const {c,api,data,elements,start}=fixture();start();api.saveCheckpoint();const saved=data.get(api.CHECKPOINT_KEY);c.S=null;c.NM=null;
    c.document={getElementById:id=>elements[id]||null,addEventListener(){}};
    let starts=0,enters=0;c.startRun=()=>{starts++;};c.enterNight=()=>{enters++;};
    c.TechOpsRestoreNightState=()=>{if(throws)throw new Error('restore failed');return false;};
    vm.runInContext(fs.readFileSync('production_mode_router.js','utf8'),c);
    assert.equal(c.TechOpsProductionModeRouter.launchNightCrawler(true),false);
    for(let i=0;i<5;i++)c.TechOpsProductionModeRouter.healthTick();
    assert.equal(starts,0);assert.equal(enters,0);assert.equal(c.S,null);assert.equal(c.__productionDesiredMode,null);assert.equal(c.__techopsAlternateStartMode,null);
    assert.equal(data.get(api.CHECKPOINT_KEY),saved);assert.equal(elements['title-screen'].classList.contains('hidden'),false);
  }
});
console.log(`Night recovery: ${passed} regression groups passed`);
