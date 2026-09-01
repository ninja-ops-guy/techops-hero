"use strict";
const assert=require("assert"),fs=require("fs"),vm=require("vm");

function context(seed={}){
  const state=seed.state||{
    flags:{tuesday_morning_reached:true,felicia_video_watched:true},
    story:{schemaVersion:1,completedActs:[],facts:{morningstar_signature_found:true,violinist_revealed:true}},
    p1:{evidence:{score:3,records:[]},trust:{score:1,history:[]},morningstar:{},reveal:{violinistRevealed:true},duet:{protocolCompleted:false,freeplayUnlocked:false}},
    lateGame:{}
  };
  const root={
    console,Date,Math,JSON,Object,Array,String,Number,Boolean,RegExp,
    globalThis:null,localStorage:{},S:null,
    setInterval:()=>0,clearInterval:()=>{},setTimeout:(fn)=>{if(fn)fn();return 0;},clearTimeout:()=>{},
    closeDlg:()=>{},toast:()=>{},
    TechOpsCampaign:{load:()=>state,save:(s)=>{assert.strictEqual(s,state);return true;}},
    TechOpsCampaignAct2:{
      snapshot:(s)=>({evidenceScore:(s.p1&&s.p1.evidence&&s.p1.evidence.score)||0,trustScore:(s.p1&&s.p1.trust&&s.p1.trust.score)||0,violinistRevealed:!!(s.p1&&s.p1.reveal&&s.p1.reveal.violinistRevealed),morningstarSignatureFound:true}),
      ensure:(s)=>s.p1,
      completeDuetProtocol:(s)=>{s.p1.duet.protocolCompleted=true;s.p1.duet.freeplayUnlocked=true;return{};}
    },
    TechOpsStory:{eligibleActs:()=>[],completeAct:()=>true,chooseEnding:(s,id)=>{s.story.ending=id;s.story.achievement=id;return{};}},
    dlg:(name,body,opts)=>{root.__dialog={name,body,opts};return true;}
  };
  root.globalThis=root;
  return {root,state,ctx:vm.createContext(root)};
}
function run(file,c){vm.runInContext(fs.readFileSync(file,"utf8"),c.ctx,{filename:file});}

// Browser bootstrap: load all four modules only after canonical campaign dependencies exist.
{
  const bootstrap=fs.readFileSync("campaign_late_game_bootstrap.js","utf8");
  assert.doesNotThrow(()=>new Function(bootstrap),"late-game browser bootstrap must parse");
  ["morningstar_build.js","swarm_doctrine.js","chapters_vii_x.js","felicia_first_office.js"].forEach(file=>assert.ok(bootstrap.includes(file),`late-game bootstrap must load ${file}`));
  assert.ok(bootstrap.includes("TechOpsCampaignNativeAct2"),"Felicia office wrapper must wait until native Act II owns interaction");
  assert.ok(!bootstrap.includes("TechOpsGoodBoysCampaignState.transition"),"late-game bootstrap must never mutate Good Boys mission authority");
  const entry=fs.readFileSync("campaign_native_act1_visuals.js","utf8");
  assert.ok(entry.includes("campaign_late_game_bootstrap.js"),"browser campaign entrypoint must wire the late-game bootstrap");
}

// MORNINGSTAR: every phase requires its authored day tickets plus night recovery.
{
  const c=context();run("morningstar_build.js",c);
  const M=c.root.TechOpsMORNINGSTARBuild;assert.ok(M,"MORNINGSTAR authority exported");
  for(let phase=0;phase<5;phase++){
    const def=M.PHASES[phase];
    assert.strictEqual(M.getCurrentPhase(),phase);
    assert.strictEqual(M.canAdvance(),false,"phase cannot advance before requirements");
    def.dayTickets.forEach(id=>M.onTicketResolved(id));
    assert.strictEqual(M.canAdvance(),false,"night recovery remains mandatory");
    M.onNightRecovery(def.nightRecovery);
    assert.strictEqual(M.getCurrentPhase(),phase+1,"phase advances atomically after both halves");
  }
  assert.strictEqual(M.getCurrentPhase(),5);
  assert.ok(c.state.lateGame.morningstar.unlocks.includes("shared_authority_keys"));
  assert.strictEqual(c.state.story.facts.morningstar_airborne,true);
  assert.ok(!fs.readFileSync("morningstar_build.js","utf8").includes("TechOpsGoodBoysCampaignState.transition"),"MORNINGSTAR must not mutate Good Boys authority");
}

// Swarm doctrine: bounds, lethal authorization, logging, reversibility.
{
  const c=context();c.root.TechOpsMORNINGSTARBuild={getCurrentPhase:()=>3};run("swarm_doctrine.js",c);
  const S=c.root.TechOpsSwarmDoctrine;assert.ok(S,"swarm authority exported");
  assert.strictEqual(S.issueCommand("RECON",{range:900,duration:30},"Mike").success,false,"range bound enforced");
  assert.strictEqual(S.issueCommand("INTERCEPT",{range:100,duration:20},"Felicia").success,false,"lethal command requires authorization");
  const recon=S.issueCommand("RECON",{range:100,duration:20,intent:"inspect"},"Mike");assert.strictEqual(recon.success,true);
  assert.strictEqual(S.reverseAction(recon.logId,"Felicia").success,true,"reversible command reverses inside window");
  const lethal=S.issueCommand("INTERCEPT",{range:100,duration:20,authorizedBy:"Mike"},"Felicia");assert.strictEqual(lethal.success,true);
  assert.strictEqual(S.reverseAction(lethal.logId,"Mike").success,false,"INTERCEPT is intentionally irreversible");
  assert.ok(S.getLog().length>=5,"accepted and rejected actions are auditable");
  assert.ok(!fs.readFileSync("swarm_doctrine.js","utf8").includes("TechOpsGoodBoysCampaignState.transition"),"swarm must not mutate Good Boys authority");
}

// Felicia office beat: requires video, plays once, persists in canonical campaign save.
{
  const c=context();run("felicia_first_office.js",c);const F=c.root.TechOpsFeliciaFirstOfficeDialogue;
  assert.strictEqual(F.canTrigger(),true);assert.strictEqual(F.trigger(),true);
  for(let i=0;i<F.LINES.length;i++){assert.ok(c.root.__dialog&&c.root.__dialog.opts&&c.root.__dialog.opts[0]);c.root.__dialog.opts[0].f();}
  assert.strictEqual(c.state.p1.office.feliciaFirstOfficeMet,true);assert.strictEqual(F.canTrigger(),false);
  assert.ok(F.LINES.some(line=>/Marketing's here/.test(line[1])),"canonical Marketing joke must remain in the first office beat");
}

// Good Dogs completion imports into the main story exactly once; _v736 remains read-only.
{
  const c=context();c.root.S={inDialog:true,meta:{_v736:{m:8,done:true,k:true,waldo:true}}};run("chapters_vii_x.js",c);
  const L=c.root.TechOpsLateGameCampaign;assert.ok(L);
  L.syncGoodBoysFacts();L.syncGoodBoysFacts();
  const imports=c.state.lateGame.chapters.history.filter(h=>h.type==="good_dogs_interlude_imported");
  assert.strictEqual(imports.length,1,"Good Dogs completion must be imported idempotently");
  assert.strictEqual(c.state.story.facts.k_freed,true);assert.strictEqual(c.state.story.facts.waldo_freed,true);
}

// Late-game ending validator: semantic gates are real and canonical Story chooses the ending first.
{
  const c=context();c.state.lateGame={metrics:{evidence:80,trust:40},morningstar:{phase:5}};c.state.story.facts={mike_meets_k:true,k_personhood_affirmed:true,duet_protocol_complete:true,watchdog_defeated:true,orpheus_interface_reached:true};c.root.TechOpsMORNINGSTARBuild={getCurrentPhase:()=>5};run("chapters_vii_x.js",c);
  const V=c.root.TechOpsEndingValidator;assert.strictEqual(V.validate("shutdown").valid,true);assert.strictEqual(V.validate("control").valid,true);assert.strictEqual(V.validate("open_network").valid,false,"low trust blocks Open Network");
  c.state.lateGame.metrics.trust=80;assert.strictEqual(V.validate("control").valid,false,"high trust blocks Control");assert.strictEqual(V.validate("open_network").valid,true,"distributed ending unlocks only after prerequisites");
  assert.strictEqual(c.root.TechOpsChapterX.selectEnding("open_network"),true);
  assert.strictEqual(c.state.story.ending,"open_network");assert.strictEqual(c.state.story.achievement,"open_network","canonical Story.chooseEnding must own the achievement before epilogue routing");
  const src=fs.readFileSync("chapters_vii_x.js","utf8");assert.ok(src.includes("Red is me. You're the mirror."));assert.ok(src.includes("EVERY TICKET IS A DUNGEON."));assert.ok(!src.includes("TechOpsGoodBoysCampaignState.transition"),"late chapters must not repurpose Good Boys state authority");
}

// State validator keeps Good Boys invariants separate and rejects structurally invalid Open Network saves.
{
  const c=context();run("state_validator.js",c);const V=c.root.TechOpsStateValidator;assert.ok(V.validateStory);
  const invalid={story:{facts:{watchdog_defeated:true,k_personhood_affirmed:true,duet_protocol_complete:true}},lateGame:{morningstar:{phase:4},chapters:{watchdogDefeated:true,ending:"open_network"}}};
  const r=V.validateStory(invalid);assert.strictEqual(r.valid,false);assert.ok(r.errors.some(e=>/MORNINGSTAR phase 5/.test(e)));
}

console.log("Late-game / MORNINGSTAR / swarm contracts: PASS");
