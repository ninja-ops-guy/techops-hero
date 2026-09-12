"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const act1Source=fs.readFileSync(path.join(__dirname,"campaign_act1.js"),"utf8");
const nativeSource=fs.readFileSync(path.join(__dirname,"campaign_native_act1.js"),"utf8");
const investigationSource=fs.readFileSync(path.join(__dirname,"campaign_act1_investigations.js"),"utf8");
const SHIPPING="shipping_cannot_print",PLATING="plating_workstation_down",ACCESS="impossible_access_event";
let passed=0;
function test(name,fn){fn();passed++;console.log("PASS "+name);}
function store(){const map=new Map();return {writes:0,getItem(k){return map.get(k)||null;},setItem(k,v){this.writes++;map.set(k,String(v));}};}
function boot(){
  const localStorage=store();
  const context=vm.createContext({console,localStorage,setTimeout:null,
    S:{day:1,px:4,py:4,clock:540,meta:{},npcs:[],inDialog:false,inBattle:false,nightMode:false},
    interact(){context.base=(context.base||0)+1;},
    dlg(name,body,options){context.dialog={name,body,options};context.S.inDialog=true;},
    closeDlg(){context.dialog=null;context.S.inDialog=false;},toast(){},adjacent(a,b){return Math.abs(a.x-b.x)+Math.abs(a.y-b.y)<=1;}
  });
  vm.runInContext(act1Source,context,{filename:"campaign_act1.js"});
  vm.runInContext(nativeSource,context,{filename:"campaign_native_act1.js"});
  vm.runInContext(investigationSource,context,{filename:"campaign_act1_investigations.js"});
  return {context,C:context.TechOpsCampaign,N:context.TechOpsCampaignNativeAct1,I:context.TechOpsCampaignInvestigations,store:localStorage};
}
function shift(b){const s=b.C.createInitialState();b.C.assignTicket(s,SHIPPING,"mike");b.C.assignTicket(s,PLATING,"amit");b.C.assignTicket(s,ACCESS,"mike");b.C.completeStandup(s);b.C.completeWorkstation(s,{feliciaVideoSkipped:true});b.C.save(s,b.store);return s;}
function click(b,label){const o=b.context.dialog.options.find(x=>x.t===label);assert.ok(o,"missing option: "+label);b.context.S.inDialog=false;return o.f();}
function clone(v){return JSON.parse(JSON.stringify(v));}

for(const [id,correct,evidence] of [
  [SHIPPING,"permissions",["printer_self_test","queue_trace"]],
  [PLATING,"integration_failure",["local_login","integration_service"]]
]){
  test(id+" cannot skip evidence",()=>{const b=boot(),s=shift(b);assert.throws(()=>b.I.chooseHypothesis(s,id,correct),/at least two/);assert.equal(s.tickets[id],undefined);});
  test(id+" wrong hypothesis is evidence-backed and non-terminal",()=>{const b=boot(),s=shift(b);b.I.recordEvidence(s,id,evidence[0]);b.I.recordEvidence(s,id,evidence[1]);const wrong=id===SHIPPING?"network_path":"credential_state";const r=b.I.chooseHypothesis(s,id,wrong);assert.equal(r.correct,false);assert.ok(r.reason.length>20);assert.ok(s.investigations[id].ruledOut.includes(wrong));assert.equal(s.tickets[id],undefined);});
  test(id+" remediation cannot skip supported hypothesis",()=>{const b=boot(),s=shift(b);assert.throws(()=>b.I.applyFix(s,id),/Supported hypothesis/);});
  test(id+" verification cannot skip remediation or technical check",()=>{const b=boot(),s=shift(b);b.I.recordEvidence(s,id,evidence[0]);b.I.recordEvidence(s,id,evidence[1]);b.I.chooseHypothesis(s,id,correct);assert.throws(()=>b.I.verifyHumanOutcome(s,id),/Technical check/);b.I.applyFix(s,id);assert.throws(()=>b.I.verifyHumanOutcome(s,id),/Technical check/);});
  test(id+" full flow closes only after requester verification",()=>{const b=boot(),s=shift(b);b.I.recordEvidence(s,id,evidence[0]);b.I.recordEvidence(s,id,evidence[1]);b.I.chooseHypothesis(s,id,correct);b.I.applyFix(s,id);b.I.runTechnicalCheck(s,id);assert.equal(s.tickets[id],undefined);const closed=b.I.verifyHumanOutcome(s,id);assert.equal(closed.verification,"strong");assert.equal(closed.humanOutcome,"restored");assert.equal(s.investigations[id].phase,"complete");assert.ok(s.history.some(e=>e.type==="investigation_human_verified"&&e.ticketId===id));});
}

test("progress persists inside canonical save and resumes without a parallel namespace",()=>{const b=boot(),s=shift(b);b.I.recordEvidence(s,SHIPPING,"printer_self_test");b.C.save(s,b.store);const loaded=b.C.load(b.store);assert.deepEqual(clone(b.I.getRecord(loaded,SHIPPING).evidence),["printer_self_test"]);});

test("duplicate evidence is idempotent and does not spam history",()=>{const b=boot(),s=shift(b);b.I.recordEvidence(s,SHIPPING,"queue_trace");b.I.recordEvidence(s,SHIPPING,"queue_trace");assert.deepEqual(clone(s.investigations[SHIPPING].evidence),["queue_trace"]);assert.equal(s.history.filter(e=>e.type==="investigation_evidence"&&e.evidenceId==="queue_trace").length,1);});

test("canonical resolver remains the only closure authority",()=>{const b=boot(),s=shift(b);const original=b.C.resolveTicket;let calls=0;b.C.resolveTicket=function(){calls++;return original.apply(this,arguments);};b.I.recordEvidence(s,SHIPPING,"printer_self_test");b.I.recordEvidence(s,SHIPPING,"queue_trace");b.I.chooseHypothesis(s,SHIPPING,"permissions");b.I.applyFix(s,SHIPPING);b.I.runTechnicalCheck(s,SHIPPING);b.I.verifyHumanOutcome(s,SHIPPING);assert.equal(calls,1);assert.equal(s.verificationHistory.at(-1).ticketId,SHIPPING);});

test("resolved tickets cannot be mutated by the investigation API",()=>{const b=boot(),s=shift(b);b.C.resolveTicket(s,SHIPPING,{technicalResolution:true,verification:"strong",humanOutcome:"restored"});assert.throws(()=>b.I.recordEvidence(s,SHIPPING,"queue_trace"),/Resolved ticket/);});

test("unknown tickets, evidence and hypotheses fail closed",()=>{const b=boot(),s=shift(b);assert.throws(()=>b.I.definition("fake"),/Unknown Day 1/);assert.throws(()=>b.I.recordEvidence(s,SHIPPING,"fake"),/Unknown investigation evidence/);b.I.recordEvidence(s,SHIPPING,"queue_trace");b.I.recordEvidence(s,SHIPPING,"printer_self_test");assert.throws(()=>b.I.chooseHypothesis(s,SHIPPING,"fake"),/Unknown hypothesis/);});

test("interaction intercepts only unresolved Shipping and Plating after day unlock",()=>{const b=boot();shift(b);b.context.S.meta.campaignAct1Native={shipping:{x:4,y:5},plating:{x:8,y:8},access:{x:9,y:9}};b.I.install();b.context.interact();assert.equal(b.context.dialog.name,"SHIPPING CANNOT PRINT");click(b,"Back");b.context.S.px=1;b.context.S.py=1;b.context.interact();assert.equal(b.context.base,1);});

test("UI path requires gather -> hypothesis -> remediation -> technical -> requester",()=>{const b=boot();shift(b);b.I.openInvestigation(SHIPPING);click(b,"Begin investigation");click(b,"Run printer self-test");click(b,"Continue investigation");click(b,"Trace one customs-label job");click(b,"Continue investigation");click(b,"Form hypothesis");click(b,"Permissions");assert.match(b.context.dialog.name,/HYPOTHESIS SUPPORTED/);click(b,"Plan remediation");click(b,"Apply remediation");assert.match(b.context.dialog.name,/VERIFY TECHNICALLY/);click(b,"Run technical check");assert.match(b.context.dialog.name,/VERIFY WITH REQUESTER/);click(b,"Requester confirms restored");assert.match(b.context.dialog.body,/VERIFIED \/ RESTORED/);assert.equal(b.C.load(b.store).tickets[SHIPPING].humanOutcome,"restored");});

test("reload between every investigation phase resumes from canonical state",()=>{const b=boot();let s=shift(b);b.I.recordEvidence(s,PLATING,"local_login");b.C.save(s,b.store);s=b.C.load(b.store);b.I.recordEvidence(s,PLATING,"integration_service");b.I.chooseHypothesis(s,PLATING,"integration_failure");b.C.save(s,b.store);s=b.C.load(b.store);b.I.applyFix(s,PLATING);b.C.save(s,b.store);s=b.C.load(b.store);b.I.runTechnicalCheck(s,PLATING);b.C.save(s,b.store);s=b.C.load(b.store);b.I.verifyHumanOutcome(s,PLATING);b.C.save(s,b.store);assert.equal(b.C.load(b.store).investigations[PLATING].phase,"complete");});

test("investigation copy contains no ORPHEUS/reveal leakage",()=>{const src=investigationSource.toLowerCase();assert.ok(!src.includes("orpheus"));assert.ok(!src.includes("violinist"));assert.ok(!src.includes("ghost fork"));});

test("bootstrap loader references the stable investigation module",()=>{const loader=fs.readFileSync(path.join(__dirname,"campaign_native_act1_visuals.js"),"utf8");assert.match(loader,/campaign_act1_investigations\.js\?v=20260912-gameplay-continuation-r4/);assert.doesNotMatch(loader,/v738_hooks|v739_hooks/);});

console.log(`Campaign Day 1 investigations: ${passed} tests passed`);
