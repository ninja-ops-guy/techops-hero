"use strict";
const assert=require("assert"),fs=require("fs"),vm=require("vm"),Story=require("./campaign_story.js");

function context(seed={}){
  const state=seed.state||{
    flags:{tuesday_morning_reached:true,felicia_video_watched:true},
    story:{schemaVersion:2,completedActs:["prologue","act_1","act_2","act_3","act_4"],facts:{morningstar_signature_found:true,violinist_revealed:true,felicia_alliance:true,morningstar_hangar_revealed:true}},
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
    TechOpsStory:Object.assign({},Story),
    dlg:(name,body,opts)=>{root.__dialog={name,body,opts};return true;}
  };
  root.globalThis=root;
  return {root,state,ctx:vm.createContext(root)};
}
function run(file,c){vm.runInContext(fs.readFileSync(file,"utf8"),c.ctx,{filename:file});}

// Browser bootstrap: load all late-game modules only after canonical campaign dependencies exist.
{
  const bootstrap=fs.readFileSync("campaign_late_game_bootstrap.js","utf8");
  assert.doesNotThrow(()=>new Function(bootstrap),"late-game browser bootstrap must parse");
  ["morningstar_build.js","swarm_doctrine.js","morningstar_swarm_runtime.js","chapters_vii_x.js","felicia_first_office.js","campaign_completion_runtime.js"].forEach(file=>assert.ok(bootstrap.includes(file),`late-game bootstrap must load ${file}`));
  assert.ok(bootstrap.includes('def.src+"?v=20260920-revision-r1"'),"late-game progression repairs must bypass stale browser caches");
  assert.ok(bootstrap.includes("TechOpsCampaignNativeAct2"),"Felicia office wrapper must wait until native Act II owns interaction");
  assert.ok(bootstrap.indexOf("swarm_doctrine.js")<bootstrap.indexOf("morningstar_swarm_runtime.js"),"swarm doctrine must load before its gameplay bridge");
  assert.ok(bootstrap.indexOf("morningstar_swarm_runtime.js")<bootstrap.indexOf("campaign_completion_runtime.js"),"gameplay bridge must exist before shared maintenance owner runs");
  assert.ok(!bootstrap.includes("TechOpsGoodBoysCampaignState.transition"),"late-game bootstrap must never mutate Good Boys mission authority");
  const entry=fs.readFileSync("campaign_native_act1_visuals.js","utf8");
  assert.ok(entry.includes("campaign_late_game_bootstrap.js?v=20260920-revision-r1"),"browser campaign entrypoint must wire the current late-game bootstrap without stale cache reuse");
}

// Player-facing MORNINGSTAR/swarm bridge: shared HUD + Felicia Watchdog actions remain authority-routed.
{
  const runtime=fs.readFileSync("morningstar_swarm_runtime.js","utf8");
  assert.doesNotThrow(()=>new Function(runtime),"MORNINGSTAR/swarm gameplay bridge must parse");
  assert.match(runtime,/VERSION=5/);
  assert.match(runtime,/btn-morningstar/);
  assert.match(runtime,/btn-swarm-command/);
  assert.match(runtime,/TechOpsMORNINGSTARBuild\.openHub/);
  assert.match(runtime,/v64-swarm/);
  assert.match(runtime,/TechOpsSwarmDoctrine\.issueCommand/);
  assert.match(runtime,/Mike can issue bounded, nonlethal swarm commands/);
  assert.match(runtime,/INTERCEPT/);
  assert.match(runtime,/nmNextStage/);
  assert.match(runtime,/checkQuestioningMoment/);
  assert.match(runtime,/recordExternalActivation/);
  assert.match(runtime,/orpheus-matched-felicia-authorization-pattern/);
  assert.ok(!runtime.includes("TechOpsGoodBoysCampaignState"),"player-facing MORNINGSTAR/swarm bridge must not own Good Boys progression");
  assert.ok(!/\.lateGame\s*=|morningstarPhase\s*=/.test(runtime),"gameplay bridge must not directly mutate main-campaign progression state");
  const maintenance=fs.readFileSync("campaign_completion_runtime.js","utf8");
  assert.doesNotThrow(()=>new Function(maintenance),"shared campaign completion runtime must parse");
  assert.match(maintenance,/TechOpsMORNINGSTARRuntime\.install/);
}

// MORNINGSTAR: every phase requires its authored day tickets plus night recovery and reaches the Duet gate.
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
    if(phase===3)assert.strictEqual(c.state.story.facts.mike_model_discovered,true,"integrated MORNINGSTAR must produce Chapter VII's Mike-model gate");
  }
  assert.strictEqual(M.getCurrentPhase(),5);
  assert.ok(c.state.lateGame.morningstar.unlocks.includes("shared_authority_keys"));
  assert.strictEqual(c.state.story.facts.morningstar_airborne,true);
  assert.ok(!fs.readFileSync("morningstar_build.js","utf8").includes("TechOpsGoodBoysCampaignState.transition"),"MORNINGSTAR must not mutate Good Boys authority");
}

// Swarm doctrine: bounds, lethal authorization, reversal, all questioning moments, and percent metrics.
{
  const c=context();c.root.TechOpsMORNINGSTARBuild={getCurrentPhase:()=>3,capabilityUnlocked:()=>true};run("swarm_doctrine.js",c);
  const S=c.root.TechOpsSwarmDoctrine;assert.ok(S,"swarm authority exported");
  assert.strictEqual(S.issueCommand("RECON",{range:900,duration:30},"Mike").success,false,"range bound enforced");
  assert.strictEqual(S.issueCommand("INTERCEPT",{range:100,duration:20},"Felicia").success,false,"lethal command requires authorization");
  const recon=S.issueCommand("RECON",{range:100,duration:20,intent:"inspect"},"Mike");assert.strictEqual(recon.success,true);
  assert.strictEqual(S.reverseAction(recon.logId,"Felicia").success,true,"reversible command reverses inside window");
  assert.ok(S.snapshot().questioningMomentsTriggered.includes("swarm_q3"),"Felicia reversing Mike's action must trigger the consent/logging dialogue");
  const lethal=S.issueCommand("INTERCEPT",{range:100,duration:20,authorizedBy:"Mike"},"Felicia");assert.strictEqual(lethal.success,true);
  assert.strictEqual(S.reverseAction(lethal.logId,"Mike").success,false,"INTERCEPT is intentionally irreversible");
  const selfAuth=S.issueCommand("INTERCEPT",{range:100,duration:20,authorizedBy:"Felicia"},"Felicia");assert.strictEqual(selfAuth.success,true);
  assert.ok(S.snapshot().questioningMomentsTriggered.includes("swarm_q1"),"Felicia self-authorized lethal action must trigger Mike's challenge");
  assert.strictEqual(c.state.p1.evidence.score,3,"late-game percentage consequence must not corrupt raw Act II evidence score");
  assert.strictEqual(c.state.p1.trust.score,1,"late-game percentage consequence must not corrupt raw Act II trust score");
  const afterQ1=S.snapshot().metrics;assert.ok(afterQ1.evidence>=85,"Evidence +10 must apply on the percentage late-game scale");assert.ok(afterQ1.trust>=72,"Trust consequences must apply on the percentage late-game scale");
  assert.strictEqual(S.recordExternalActivation("felicia-pattern"),true,"external authorization-pattern match must seed integrity audit dialogue");
  const snap=S.snapshot();assert.ok(snap.questioningMomentsTriggered.includes("swarm_q2"));assert.strictEqual(snap.integrityAuditUnlocked,true);
  assert.ok(snap.consequences.length>=3,"questioning consequences remain inspectable");
  assert.ok(S.getLog().length>=7,"accepted, rejected, reversed and external actions are auditable");
  assert.ok(!fs.readFileSync("swarm_doctrine.js","utf8").includes("TechOpsGoodBoysCampaignState.transition"),"swarm must not mutate Good Boys authority");
}

// A forged legacy phase cannot bypass the Act IV alliance boundary to unlock
// new swarm commands.
{
  const c=context();
  c.state.story.completedActs=["prologue","act_1","act_2","act_3"];
  delete c.state.story.facts.felicia_alliance;
  delete c.state.story.facts.morningstar_hangar_revealed;
  c.state.lateGame.morningstar={phase:3,completedDayTickets:[],nightRecoveredItems:[],unlocks:[],history:[]};
  run("morningstar_build.js",c);
  run("swarm_doctrine.js",c);
  assert.strictEqual(c.root.TechOpsMORNINGSTARBuild.capabilityUnlocked(3),false);
  const rejected=c.root.TechOpsSwarmDoctrine.issueCommand("RECON",{range:100,duration:20,intent:"forged legacy phase"},"Mike");
  assert.strictEqual(rejected.success,false);
  assert.strictEqual(rejected.reason,"swarm_not_unlocked");
  c.root.document={getElementById:()=>null};
  run("morningstar_swarm_runtime.js",c);
  assert.strictEqual(c.root.TechOpsMORNINGSTARRuntime.openSwarm(),false,"a forged phase cannot open the player-facing swarm command UI");
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
  const c=context();c.state.story.completedActs=["act_6"];c.state.story.facts.orbital_signal_found=true;
  c.root.TechOpsStory.eligibleActs=s=>s.story.completedActs.includes("act_6")&&s.story.facts.orbital_signal_found&&!s.story.completedActs.includes("interlude")?["interlude"]:[];
  c.root.TechOpsStory.completeAct=(s,id)=>{assert.strictEqual(id,"interlude");s.story.completedActs.push(id);["k_freed","waldo_freed","warden_null_defeated","crew_returned_to_earth"].forEach(f=>{s.story.facts[f]=true;});return true;};
  c.root.S={inDialog:true,meta:{_v736:{m:8,done:true,k:true,waldo:true}}};run("chapters_vii_x.js",c);
  const L=c.root.TechOpsLateGameCampaign;assert.ok(L);
  L.syncGoodBoysFacts();L.syncGoodBoysFacts();
  const imports=c.state.lateGame.chapters.history.filter(h=>h.type==="good_dogs_interlude_imported");
  assert.strictEqual(imports.length,1,"Good Dogs completion must be imported idempotently");
  assert.strictEqual(c.state.story.completedActs.includes("interlude"),true,"eligible canonical completion must complete the interlude");
  assert.strictEqual(c.state.story.facts.k_freed,true);assert.strictEqual(c.state.story.facts.waldo_freed,true);
}

// The same completed mission state is read-only when it came from the direct title route.
{
  const c=context();c.state.story.completedActs=["act_6"];c.state.story.facts.orbital_signal_found=true;
  c.root.TechOpsStory.eligibleActs=()=>["interlude"];
  c.root.TechOpsStory.completeAct=()=>{throw new Error("standalone Good Dogs reached canonical act completion");};
  c.root.S={inDialog:false,meta:{_standaloneMode:"gooddogs",_v736:{m:8,done:true,k:true,waldo:true,campaignOrigin:"standalone"}}};
  const before=JSON.stringify(c.state);run("chapters_vii_x.js",c);const L=c.root.TechOpsLateGameCampaign;
  assert.strictEqual(L.syncGoodBoysFacts(),false);assert.strictEqual(L.check(),false);
  assert.strictEqual(JSON.stringify(c.state),before,"standalone completion must not mutate canonical campaign state");
  assert.strictEqual(c.state.story.completedActs.includes("interlude"),false);
  assert.strictEqual(c.state.story.facts.k_freed,undefined);
}

// Duet completion is ordered and transactional: no Act V means no Act VI
// mirrors, even when late-game facts/phase are forged into an otherwise valid shape.
{
  const c=context();
  c.state.story.facts.mike_model_discovered=true;
  c.root.TechOpsMORNINGSTARBuild={getCurrentPhase:()=>4};
  run("chapters_vii_x.js",c);
  assert.strictEqual(c.root.TechOpsChapterVII.canStart(),false,"Chapter VII requires canonical Act V completion");
  assert.strictEqual(c.root.TechOpsChapterVII.onTutorialComplete(),false);
  assert.strictEqual(c.state.story.facts.duet_protocol_complete,undefined,"a rejected Act VI transition cannot leak Duet rewards");
  assert.strictEqual(c.state.lateGame.chapters.duetComplete,false);

  c.state.story.completedActs.push("act_5");
  c.root.TechOpsCampaignAct2.completeDuetProtocol=(s)=>Story.completeAct(s,"act_6");
  assert.strictEqual(c.root.TechOpsChapterVII.canStart(),true);
  assert.strictEqual(c.root.TechOpsChapterVII.onTutorialComplete(),true);
  assert.ok(c.state.story.completedActs.includes("act_6"));
  assert.strictEqual(c.state.story.facts.duet_protocol_complete,true);
  assert.strictEqual(c.state.lateGame.chapters.duetComplete,true);
}

// Late-game ending validator: semantic gates are real and canonical Story chooses the ending first.
{
  const c=context();c.state.lateGame={metrics:{evidence:80,trust:40},morningstar:{phase:5}};c.state.story.facts={mike_meets_k:true,k_personhood_affirmed:true,duet_protocol_complete:true,watchdog_defeated:true,orpheus_interface_reached:true};c.root.TechOpsMORNINGSTARBuild={getCurrentPhase:()=>5};run("chapters_vii_x.js",c);
  const V=c.root.TechOpsEndingValidator;assert.strictEqual(V.validate("shutdown").valid,true);assert.strictEqual(V.validate("control").valid,true);assert.strictEqual(V.validate("open_network").valid,false,"low trust blocks Open Network");
  c.state.lateGame.metrics.trust=80;assert.strictEqual(V.validate("control").valid,false,"high trust blocks Control");assert.strictEqual(V.validate("open_network").valid,true,"distributed ending unlocks only after prerequisites");
  assert.strictEqual(c.root.TechOpsChapterX.selectEnding("open_network"),true);
  assert.strictEqual(c.state.story.ending,"open_network");assert.strictEqual(c.state.story.achievement,"NO SINGLE POINT OF FAILURE","canonical Story.chooseEnding must own the achievement before epilogue routing");
  const src=fs.readFileSync("chapters_vii_x.js","utf8");assert.ok(src.includes("Red is me. You're the mirror."));assert.ok(src.includes("EVERY TICKET IS A DUNGEON."));assert.ok(!src.includes("TechOpsGoodBoysCampaignState.transition"),"late chapters must not repurpose Good Boys state authority");
}

// State validator keeps Good Boys invariants separate and rejects structurally invalid Open Network saves.
{
  const c=context();run("state_validator.js",c);const V=c.root.TechOpsStateValidator;assert.ok(V.validateStory);
  const invalid={story:{facts:{watchdog_defeated:true,k_personhood_affirmed:true,duet_protocol_complete:true}},lateGame:{morningstar:{phase:4},chapters:{watchdogDefeated:true,ending:"open_network"}}};
  const r=V.validateStory(invalid);assert.strictEqual(r.valid,false);assert.ok(r.errors.some(e=>/MORNINGSTAR phase 5/.test(e)));
  const outOfOrder={story:{completedActs:["prologue","act_1","act_2","act_3","act_5","act_6"],facts:{felicia_alliance:true,morningstar_airborne:true,duet_protocol_complete:true}},lateGame:{morningstar:{phase:4},chapters:{duetComplete:true}}};
  const ordered=V.validateStory(outOfOrder);assert.strictEqual(ordered.valid,false);assert.ok(ordered.errors.some(e=>/act_5 requires completed act_4/.test(e)));assert.ok(ordered.errors.some(e=>/Act IV alliance rewards require completed act_4/.test(e)));
  const reversed=V.validateStory({story:{completedActs:["prologue","act_1","act_2","act_3","act_5","act_4","act_6"],facts:{felicia_alliance:true,morningstar_hangar_revealed:true,morningstar_airborne:true,mike_model_discovered:true,duet_protocol_complete:true,felicia_playable:true,orbital_signal_found:true}},lateGame:{morningstar:{phase:4}}});
  assert.strictEqual(reversed.valid,false);assert.ok(reversed.errors.some(e=>/act_4 must precede act_5/.test(e)));
}

console.log("Late-game / MORNINGSTAR / swarm contracts: PASS");
