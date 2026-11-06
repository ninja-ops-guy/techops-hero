'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const SHIPPING='shipping_cannot_print',PLATING='plating_workstation_down';
let count=0;
function test(name,run){run();count++;console.log('PASS '+name);}
function json(v){return JSON.parse(JSON.stringify(v));}
function documentMock(){
  const nodes=new Map(),doc={activeElement:null,addEventListener(){}};
  function node(id){
    const classes=new Set(),n={id,isConnected:true,hidden:false,dataset:{},attributes:{},children:[],classList:{add(...xs){xs.forEach(x=>classes.add(x));},remove(...xs){xs.forEach(x=>classes.delete(x));},contains(x){return classes.has(x);}},setAttribute(k,v){this.attributes[k]=v;},removeAttribute(k){delete this.attributes[k];},appendChild(child){this.children.push(child);nodes.set(child.id,child);},focus(){doc.activeElement=this;}};
    Object.defineProperty(n,'innerHTML',{get(){return this.html||'';},set(html){this.html=html;this.children.forEach(x=>x.isConnected=false);this.children=[];for(const match of html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)){const b=node('');for(const attr of match[1].matchAll(/([\w-]+)(?:="([^"]*)")?/g)){if(attr[1].startsWith('data-'))b.dataset[attr[1].slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=attr[2]||'';}b.label=match[2];this.children.push(b);}}});
    n.querySelectorAll=function(selector){if(selector.includes('data-day-action'))return this.children.filter(x=>x.dataset.dayAction);return this.children;};
    n.querySelector=function(selector){if(this.id==='dialogue')return nodes.get('dlg-text').children[0]||node('fallback');if(selector==='button')return this.children[0];if(selector.includes('data-day-route'))return this.children.find(x=>'dayRoute'in x.dataset);if(selector.includes('data-day-jobs'))return this.children.find(x=>'dayJobs'in x.dataset);if(selector.includes('data-day-interact'))return this.children.find(x=>'dayInteract'in x.dataset);return this.children[0];};
    return n;
  }
  doc.body=node('body');['dialogue','dlg-text','dlg-name','title-screen'].forEach(id=>nodes.set(id,node(id)));nodes.get('title-screen').classList.add('hidden');
  doc.createElement=()=>node('');doc.getElementById=id=>nodes.get(id)||null;doc.querySelectorAll=()=>nodes.get('dlg-text').children;doc.activeElement=node('origin');return doc;
}
function boot(){
  const entries=new Map(),storage={writes:0,fail:false,getItem(k){return entries.get(k)||null;},setItem(k,v){if(this.fail)throw Error('disk full');this.writes++;entries.set(k,String(v));}};
  const ctx=vm.createContext({console,localStorage:storage,setTimeout:null,S:{day:1,px:21,py:16,map:Array.from({length:32},()=>Array(42).fill(0)),meta:{campaignAct1Native:{shipping:{x:8,y:26},plating:{x:18,y:26},standup:{x:34,y:12},access:{x:38,y:12}}},npcs:[],inDialog:false,inBattle:false,nightMode:false},toast(message){ctx.lastToast=message;},save(){ctx.gameSaveCalls++;if(ctx.failGameSave)return false;ctx.gameCheckpoint=JSON.stringify(ctx.S.meta);return true;}});
  ctx.gameSaveCalls=0;ctx.failGameSave=false;
  for(const file of ['campaign_act1.js','campaign_act1_investigations.js','runtime_day_cases.js','runtime_day_world.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,file),'utf8'),ctx,{filename:file});
  const C=ctx.TechOpsCampaign,I=ctx.TechOpsCampaignInvestigations,W=ctx.TechOpsDayWorld;
  const c=C.createInitialState();C.assignTicket(c,SHIPPING,'mike');C.assignTicket(c,PLATING,'amit');C.assignTicket(c,'impossible_access_event','mike');C.completeStandup(c);C.completeWorkstation(c,{feliciaVideoSkipped:true});C.save(c,storage);
  ctx.document=documentMock();ctx.dlg=function(name,body,options){ctx.dialog={name,body,options};ctx.S.inDialog=true;ctx.document.getElementById('dlg-name').textContent=name;ctx.document.getElementById('dlg-text').innerHTML=body;};ctx.closeDlg=function(){ctx.S.inDialog=false;ctx.dialog=null;};
  ctx.TechOpsCampaignNativeAct1={openWorkstation(){ctx.workstationOpens=(ctx.workstationOpens||0)+1;ctx.S.inDialog=true;return true;},openTicketFollowUp(){return true;},recordAccessEvidence(){return true;}};
  vm.runInContext(fs.readFileSync(path.join(__dirname,'runtime_day.js'),'utf8'),ctx,{filename:'runtime_day.js'});W.ensureWorld();
  const X=ctx.TechOpsDayExperience;
  function move(id){const route=W.route(id);assert(route.ok,route.message);const end=route.path.at(-1);ctx.S.px=end.x;ctx.S.py=end.y;return W.stations().find(st=>st.id===id);}
  function open(id){X.exit();move(id);assert.equal(X.openDevice(id),true);}
  function button(action,value){const found=ctx.document.getElementById('dlg-text').children.find(b=>b.dataset.dayAction===action&&(value===undefined||b.dataset.value===value));assert(found,'missing button '+action+' '+value);return found;}
  function click(action,value){return button(action,value).onclick();}
  function surface(name){if(X.active().surface!==name)click(name);assert.equal(X.active().surface,name);}
  return {ctx,C,I,W,X,storage,move,open,button,click,surface,cases:ctx.TechOpsDayCases};
}

test('physical proximity gates device opening, observations and Mike’s desk',()=>{
  const b=boot(),before=b.storage.writes;
  assert.equal(b.X.openDevice('laptop_dock_link'),false);assert.equal(b.X.openDevice('mike_desk'),false);assert.equal(b.ctx.workstationOpens,undefined);assert.equal(b.storage.writes,before);
  b.open('laptop_dock_link');const first=b.cases.definition('laptop_dock_link').evidence[0];b.ctx.S.px=1;b.ctx.S.py=20;
  assert.equal(b.X.transact('observe',first.id),false);assert.equal(b.X.active(),null);assert.equal(b.ctx.S.meta.dayCases.laptop_dock_link,undefined);
  b.move('mike_desk');assert.equal(b.X.openDevice('mike_desk'),true);assert.equal(b.ctx.workstationOpens,1);
});
test('Mike’s physical workstation remains available before clock-in',()=>{
  const b=boot();b.C.save(b.C.createInitialState(),b.storage);b.move('mike_desk');assert.equal(b.X.openDevice('mike_desk'),true);
  b.X.exit();b.move('laptop_dock_link');assert.equal(b.X.openDevice('laptop_dock_link'),false);
});
test('no device opens during Night or combat',()=>{
  const b=boot();b.move('laptop_dock_link');b.ctx.S.nightMode=true;assert.equal(b.X.openDevice('laptop_dock_link'),false);b.ctx.S.nightMode=false;b.ctx.S.inBattle=true;assert.equal(b.X.openDevice('laptop_dock_link'),false);
});
test('screen and physical evidence cannot be cross-collected',()=>{
  const b=boot();b.open('laptop_dock_link');const def=b.cases.definition('laptop_dock_link'),screen=def.evidence.find(e=>e.surface==='screen'),physical=def.evidence.find(e=>e.surface==='physical');
  assert.equal(b.X.transact('observe',screen.id),false);assert.equal(b.ctx.S.meta.dayCases.laptop_dock_link,undefined);b.surface('screen');assert.equal(b.X.transact('observe',physical.id),false);assert.equal(b.X.transact('observe',screen.id),true);
  assert.deepEqual(json(b.ctx.S.meta.dayCases.laptop_dock_link.evidence),[screen.id]);
});
test('Shipping’s printer cannot expose or collect workstation observations',()=>{
  const b=boot();b.open('shipping_printer');assert(!b.ctx.document.getElementById('dlg-text').children.some(x=>x.dataset.dayAction==='screen'));assert.equal(b.X.transact('observe','queue_trace'),false);
  assert.equal(b.X.transact('observe','printer_self_test'),true);const c=b.C.load(b.storage);assert.deepEqual(json(b.I.getRecord(c,SHIPPING).evidence),['printer_self_test']);assert.equal(b.ctx.S.meta.dayCases,undefined);
});
test('all eight optional cases complete through the rendered action flow without canonical writes',()=>{
  const b=boot(),canon=b.storage.getItem(b.C.SAVE_KEY||'techops_hero_campaign_v1'),writes=b.storage.writes;
  for(const id of b.cases.ids()){
    b.open(id);const def=b.cases.definition(id);assert.equal(b.X.transact('repair'),false);
    for(const e of def.evidence){b.surface(e.surface);assert.equal(b.X.transact('observe',e.id),true);}
    assert.equal(b.X.transact('hypothesis',def.correctHypothesis),true);assert.equal(b.X.transact('repair'),false);
    b.click('authorize');b.surface(def.repairSurface);b.click('repair');b.surface('screen');b.click('technical');assert.equal(b.ctx.S.meta.dayCases[id].requesterVerified,false);b.click('requester');
    assert.equal(b.cases.summary(b.ctx.S.meta.dayCases[id]).status,'VERIFIED / RESTORED');const saved=JSON.stringify(b.ctx.S.meta.dayCases[id]);assert.equal(b.X.transact('requester'),false);assert.equal(JSON.stringify(b.ctx.S.meta.dayCases[id]),saved);
  }
  assert.equal(b.storage.writes,writes);assert.equal(b.storage.getItem(b.C.SAVE_KEY||'techops_hero_campaign_v1'),canon);assert.equal(Object.keys(b.C.load(b.storage).tickets).length,0);
});
test('retained buttons cannot operate a replacement modal',()=>{
  const b=boot();b.open('laptop_dock_link');const stale=b.button('screen');b.open('desktop_restart_window');assert.equal(b.X.active().surface,'physical');stale.onclick();assert.equal(b.X.active().surface,'physical');assert.equal(b.ctx.S.meta.dayCases.desktop_restart_window,undefined);
  const observe=b.button('observe');b.X.exit();observe.onclick();assert.equal(b.ctx.S.meta.dayCases.desktop_restart_window,undefined);
});
test('device rendering clears the previous dialogue typewriter click owner',()=>{
  const b=boot(),text=b.ctx.document.getElementById('dlg-text');text.onclick=function(){text.innerHTML='stale dialogue';};b.open('laptop_dock_link');assert.equal(text.onclick,null);assert.match(text.innerHTML,/PHYSICAL INSPECTION/);b.surface('screen');assert.equal(text.onclick,null);assert.match(text.innerHTML,/AERODESK/);
});
test('optional failed-save mutation rolls back and successful replay is idempotent',()=>{
  const b=boot();b.open('laptop_dock_link');const def=b.cases.definition('laptop_dock_link'),e=def.evidence[0];b.ctx.failGameSave=true;
  assert.equal(b.X.transact('observe',e.id),false);assert.equal(b.ctx.S.meta.dayCases.laptop_dock_link,undefined);
  b.ctx.failGameSave=false;assert.equal(b.X.transact('observe',e.id),true);const saved=JSON.stringify(b.ctx.S.meta.dayCases.laptop_dock_link);assert.equal(b.X.transact('observe',e.id),true);assert.equal(JSON.stringify(b.ctx.S.meta.dayCases.laptop_dock_link),saved);
  b.ctx.failGameSave=true;assert.equal(b.X.transact('observe',def.evidence[1].id),false);assert.equal(JSON.stringify(b.ctx.S.meta.dayCases.laptop_dock_link),saved);
  const calls=b.ctx.gameSaveCalls;assert.equal(b.X.transact('invented_action'),false);assert.equal(b.ctx.gameSaveCalls,calls);
});
test('canonical operator hold requires supported cause and rolls back on failed checkpoint',()=>{
  const b=boot();b.open('plating_workstation');assert.equal(b.X.transact('authorize'),false);assert.equal(b.ctx.S.meta.dayOperatorHolds,undefined);b.surface('screen');
  b.X.transact('observe','local_login');b.X.transact('observe','integration_service');b.X.transact('hypothesis','integration_failure');assert.equal(b.X.transact('repair'),false);
  const writes=b.storage.writes;b.ctx.failGameSave=true;assert.equal(b.X.transact('authorize'),false);assert.equal(b.ctx.S.meta.dayOperatorHolds,undefined);assert.equal(b.storage.writes,writes);
  b.ctx.failGameSave=false;assert.equal(b.X.transact('authorize'),true);assert.equal(b.storage.writes,writes);assert.equal(b.X.transact('repair'),true);assert.equal(b.X.transact('technical'),true);assert.equal(b.X.transact('requester'),false);assert.equal(b.C.load(b.storage).tickets[PLATING],undefined);
});
test('canonical save failure leaves evidence uncommitted and retry records it once',()=>{
  const b=boot();b.open('shipping_printer');b.storage.fail=true;assert.equal(b.X.transact('observe','printer_self_test'),false);assert.equal(b.I.getRecord(b.C.load(b.storage),SHIPPING),null);b.storage.fail=false;assert.equal(b.X.transact('observe','printer_self_test'),true);assert.equal(b.X.transact('observe','printer_self_test'),true);assert.equal(b.I.getRecord(b.C.load(b.storage),SHIPPING).evidence.length,1);
});
test('canonical requester verification checks physical presence again and closes only through authority',()=>{
  const b=boot();let state=b.C.load(b.storage);b.I.recordEvidence(state,SHIPPING,'printer_self_test');b.I.recordEvidence(state,SHIPPING,'queue_trace');b.I.chooseHypothesis(state,SHIPPING,'permissions');b.I.applyFix(state,SHIPPING);b.I.runTechnicalCheck(state,SHIPPING);b.C.save(state,b.storage);
  assert.equal(b.X.talk(SHIPPING),false);const p=b.ctx.S.meta.campaignAct1Native.shipping;b.ctx.S.px=p.x;b.ctx.S.py=p.y+1;assert.equal(b.X.talk(SHIPPING),true);const stale=b.ctx.dialog.options[0].f;b.ctx.S.px=1;b.ctx.S.py=20;stale();assert.equal(b.C.load(b.storage).tickets[SHIPPING],undefined);
  b.ctx.S.px=p.x;b.ctx.S.py=p.y+1;b.X.talk(SHIPPING);let resolutions=0;const resolve=b.C.resolveTicket;b.C.resolveTicket=function(){resolutions++;return resolve.apply(this,arguments);};b.ctx.dialog.options[0].f();assert.equal(resolutions,1);assert.equal(b.C.load(b.storage).tickets[SHIPPING].verification,'strong');assert.equal(b.ctx.S.meta.dayCases,undefined);
});
function ambiguousSpot(b){
  // The world separately proves reachability; this boundary fixture supplies
  // the two valid nearby capabilities that originally exposed the tie bug.
  const candidates=b.W.stations().filter(s=>s.id==='shipping_printer'||s.id==='shipping_workstation');
  b.W.nearby=()=>candidates;b.W.at=id=>candidates.some(s=>s.id===id);return candidates;
}
test('an explicit adjacent device route overrides alphabetical station priority and matches HUD',()=>{
  const b=boot(),near=ambiguousSpot(b),target=near.find((s,i)=>i>0&&(s.caseId||s.ticketId===SHIPPING));assert(target);b.ctx.S.meta.dayRouteTarget=target.id;b.X.syncHud();assert.match(b.ctx.document.getElementById('day-route-hud').innerHTML,new RegExp('Inspect '+target.label));assert.equal(b.X.interact(),true);assert.equal(b.X.active().stationId,target.id);
});
test('ambiguous nearby people and devices offer explicit Talk and Inspect choices',()=>{
  const b=boot();b.move('laptop_dock_link');b.ctx.S.meta.campaignAct1Native.shipping={x:b.ctx.S.px,y:b.ctx.S.py+1};b.ctx.S.meta.dayRouteTarget=null;b.X.syncHud();assert.match(b.ctx.document.getElementById('day-route-hud').innerHTML,/Choose nearby interaction/);assert.equal(b.X.interact(),true);assert.match(b.ctx.dialog.name,/CHOOSE/);const talk=b.ctx.dialog.options.find(o=>o.t==='Talk to Shipping clerk');assert(talk);assert(b.ctx.dialog.options.some(o=>/^Inspect /.test(o.t)));talk.f();assert.equal(b.ctx.dialog.name,'SHIPPING CLERK');
});
test('explicit requester route reaches verification even beside a device',()=>{
  const b=boot(),state=b.C.load(b.storage);b.I.recordEvidence(state,SHIPPING,'printer_self_test');b.I.recordEvidence(state,SHIPPING,'queue_trace');b.I.chooseHypothesis(state,SHIPPING,'permissions');b.I.applyFix(state,SHIPPING);b.I.runTechnicalCheck(state,SHIPPING);b.C.save(state,b.storage);
  b.move('laptop_dock_link');b.ctx.S.meta.campaignAct1Native.shipping={x:b.ctx.S.px,y:b.ctx.S.py+1};b.ctx.S.meta.dayRouteTarget='shipping';b.X.syncHud();assert.match(b.ctx.document.getElementById('day-route-hud').innerHTML,/Talk to Shipping clerk/);b.X.interact();assert.equal(b.ctx.dialog.name,'SHIPPING CLERK');assert.match(b.ctx.dialog.options[0].t,/Witness/);assert.equal(b.X.active(),null);
});
test('side view cannot use frozen floor coordinates and preserves a route without teleporting',()=>{
  const b=boot();b.move('mike_desk');b.X.syncHud();assert(b.ctx.document.body.classList.contains('day-route-visible'));const before={x:b.ctx.S.px,y:b.ctx.S.py};b.ctx.S.room={x:100,kind:'office'};b.X.syncHud();assert(!b.ctx.document.body.classList.contains('day-route-visible'));assert(b.ctx.document.getElementById('day-route-hud').hidden);assert.equal(b.X.desktopNearby(),false);assert.equal(b.X.openDevice('mike_desk'),false);assert.equal(b.X.interact(),false);b.X.routeTo('shipping_workstation');assert.equal(b.ctx.S.meta.dayRouteTarget,'shipping_workstation');assert.equal(b.ctx.S.room.x,100);assert.deepEqual({x:b.ctx.S.px,y:b.ctx.S.py},before);assert.match(b.ctx.lastToast,/room exit/);
});
test('an inherited workaround can be verified as limited service without false restoration',()=>{
  const b=boot(),state=b.C.load(b.storage);b.I.recordEvidence(state,SHIPPING,'printer_self_test');b.I.recordEvidence(state,SHIPPING,'queue_trace');b.I.chooseHypothesis(state,SHIPPING,'permissions');b.I.applyWorkaround(state,SHIPPING);b.C.save(state,b.storage);b.open('shipping_workstation');assert(b.button('requester-route'));assert(!b.ctx.document.getElementById('dlg-text').children.some(x=>x.dataset.dayAction==='repair'));b.X.exit();const p=b.ctx.S.meta.campaignAct1Native.shipping;b.ctx.S.px=p.x;b.ctx.S.py=p.y+1;b.X.talk(SHIPPING);assert.equal(b.ctx.dialog.options[0].t,'Requester confirms limited service');b.ctx.dialog.options[0].f();const closed=b.C.load(b.storage).tickets[SHIPPING];assert.equal(closed.verification,'partial');assert.equal(closed.humanOutcome,'degraded');
});
test('Day 2 field workstation reopens its follow-up while unfinished carryover retains original investigation',()=>{
  const b=boot(),state=b.C.load(b.storage);b.C.resolveTicket(state,SHIPPING,{technicalResolution:true,verification:'partial',humanOutcome:'degraded'});b.C.recordGhostEvidence(state,{id:'badge_impossible_access',perspective:'delegated_partial',discoveredBy:'security'});b.C.enterSector04(state);b.C.insightAccessGuard(state);b.C.severAccessController(state);b.C.transitionToTuesday(state);b.C.save(state,b.storage);b.ctx.S.day=2;b.W.ensureWorld();b.ctx.TechOpsCampaignNativeAct1.openWorkdayFollowup=function(id){b.ctx.followupOpened=id;return true;};b.open('shipping_workstation');assert.equal(b.ctx.followupOpened,SHIPPING);assert.equal(b.X.active(),null);b.open('plating_workstation');assert.equal(b.X.active().stationId,'plating_workstation');
});
test('progress list closes before evidence and action layout begins',()=>{
  const b=boot();b.open('laptop_dock_link');const html=b.ctx.document.getElementById('dlg-text').innerHTML;assert.match(html,/<ol class="day-progress">(?:<li[^>]*>[^<]+<\/li>){4}<\/ol><h3>Evidence/);
});
test('repairs require their physical or software surface and all technical checks require a screen',()=>{
  const b=boot();
  for(const id of b.cases.ids()){
    b.open(id);const def=b.cases.definition(id);for(const e of def.evidence){b.surface(e.surface);b.X.transact('observe',e.id);}b.X.transact('hypothesis',def.correctHypothesis);b.X.transact('authorize');b.surface(def.repairSurface==='screen'?'physical':'screen');assert.equal(b.X.transact('repair'),false);assert.equal(b.ctx.S.meta.dayCases[id].fixApplied,false);assert(b.button(def.repairSurface));b.surface(def.repairSurface);assert.equal(b.X.transact('repair'),true);b.surface('physical');assert.equal(b.X.transact('technical'),false);assert(b.button('screen'));b.surface('screen');assert.equal(b.X.transact('technical'),true);
  }
  let state=b.C.load(b.storage);b.I.recordEvidence(state,SHIPPING,'printer_self_test');b.I.recordEvidence(state,SHIPPING,'queue_trace');b.I.chooseHypothesis(state,SHIPPING,'permissions');b.C.save(state,b.storage);b.open('shipping_workstation');assert.equal(b.X.transact('repair'),false);b.surface('screen');assert.equal(b.X.transact('repair'),true);b.surface('physical');assert.equal(b.X.transact('technical'),false);b.surface('screen');assert.equal(b.X.transact('technical'),true);
});
test('HUD describes the tracked destination instead of contradicting its route button',()=>{
  const b=boot();b.ctx.S.meta.dayRouteTarget='laptop_dock_link';b.X.syncHud();const hud=b.ctx.document.getElementById('day-route-hud');assert.match(hud.innerHTML,/Destination · Engineering laptop dock/);assert.doesNotMatch(hud.innerHTML,/Inspect the Shipping printer/);b.ctx.S.meta.dayRouteTarget='shipping';b.X.syncHud();assert.match(hud.innerHTML,/Destination · Shipping clerk/);
});
test('talking to Security does not read the nearby computer or grant badge evidence',()=>{
  const b=boot();b.move('security_workstation');b.ctx.S.meta.campaignAct1Native.access={x:b.ctx.S.px,y:b.ctx.S.py+1};b.ctx.S.meta.dayRouteTarget='access';let reads=0;b.ctx.TechOpsCampaignNativeAct1.recordAccessEvidence=function(){reads++;return true;};const before=b.storage.writes;b.X.interact();assert.equal(b.ctx.dialog.name,'SECURITY OPS');assert.equal(reads,0);assert.equal(b.storage.writes,before);assert.equal(b.ctx.dialog.options[0].t,'Walk to Security workstation');b.X.exit();b.X.openDevice('security_workstation');assert.equal(reads,1);
});
console.log('Day experience integration: '+count+' tests passed');

for(const name of ['NICK','AMIT','BRANDON','DANIEL'])test(name+' remains a talk target beside a tracked workstation',()=>{
  const b=boot();b.move('mike_desk');
  b.ctx.COWORKERS=[{id:name.toLowerCase(),name,x:b.ctx.S.px+1,y:b.ctx.S.py}];
  b.ctx.coworkerTalk=n=>{b.ctx.dlg(n.name,'Conversation',[]);};
  b.ctx.S.meta.dayRouteTarget='mike_desk';b.X.syncHud();
  assert.match(b.ctx.document.getElementById('day-route-hud').innerHTML,/Choose nearby interaction/);
  b.X.interact();const option=b.ctx.dialog.options.find(o=>o.t==='Talk to '+name);assert(option);option.f();
  assert.equal(b.ctx.dialog.name,name);assert.equal(b.ctx.workstationOpens,undefined);
});
test('ordinary ambient and ticket NPCs retain their own interaction owners',()=>{
  for(const ambient of [true,false]){const b=boot();b.move('mike_desk');const npc={id:'ordinary',name:'Requester',ambient,x:b.ctx.S.px+1,y:b.ctx.S.py};b.ctx.S.npcs.push(npc);b.ctx[ambient?'ambientTalk':'ticketFlow']=n=>{b.ctx.talkedTo=n;};b.ctx.S.meta.dayRouteTarget='mike_desk';b.X.interact();b.ctx.dialog.options.find(o=>o.t==='Talk to Requester').f();assert.equal(b.ctx.talkedTo,npc);assert.equal(b.ctx.workstationOpens,undefined);}
});

test('side room uses its visible desk position, never frozen floor coordinates',()=>{
 const b=boot();b.move('mike_desk');b.ctx.S.room={id:'itdept',x:.15};assert.equal(b.X.desktopNearby(),false);
 b.ctx.S.room.x=.82;assert.equal(b.X.desktopNearby(),true);assert.equal(b.X.openDevice('mike_desk'),true);
 b.ctx.S.room.id='finance';assert.equal(b.X.desktopNearby(),false);
});
test('office entry triggers standup once per entry and never after completion',()=>{
 const b=boot();const c=b.C.createInitialState();b.C.save(c,b.storage);let opened=0;b.ctx.TechOpsCampaignNativeAct1.openStandup=()=>opened++;
 b.ctx.S.room={id:'itdept',x:.12};b.X.syncHud();b.X.syncHud();assert.equal(opened,1);
 c.flags.standup_completed=true;b.C.save(c,b.storage);b.ctx.S.room=null;b.ctx.S.px=21;b.ctx.S.py=16;b.X.syncHud();b.ctx.S.room={id:'itdept',x:.12};b.X.syncHud();assert.equal(opened,1);
});
