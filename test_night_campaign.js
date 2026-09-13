'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const C=require('./campaign_act1.js'),A=require('./campaign_act2.js');
let passed=0;
function test(name,fn){fn();passed++;console.log('PASS '+name);}
function fixture(){
 const data=new Map();let failSave=false,writes=0;
 const storage={getItem:k=>data.get(k)||null,setItem(k,v){if(failSave)throw Error('quota');data.set(k,v);writes++;}};
 const r={TechOpsCampaign:C,TechOpsCampaignAct2:A,localStorage:storage,S:{},performance:{now:()=>1000},nmSpawnEnemies:()=>[{alive:true}],closeDlg(){r.S.inDialog=false;},dlg(title,body,options){r.dialog={title,body,options};r.S.inDialog=true;}};
 vm.runInNewContext(fs.readFileSync('night_campaign.js','utf8'),r);
 const n={district:'downtown',street:1,x:1549,y:396,w:22,h:34,onGround:true,platforms:[{x:40}],enemies:[{alive:true}],cam:12,clear:false,location:'exterior'};
 return {r,n,api:r.TechOpsNightCampaign,save:s=>C.save(s,storage),load:()=>C.load(storage),writes:()=>writes,fail(v){failSave=v;}};
}
function ready(f){
 const c=C.createInitialState();
 // Explicit Tuesday fixture; all Act II prerequisites are awarded by real semantics.
 for(const id of C.TICKETS)C.assignTicket(c,id,'mike');C.completeStandup(c);C.completeWorkstation(c,{redInTheMirrorHeard:true,feliciaVideoSeen:true});
 c.flags.tuesday_morning_reached=true;
 A.beginGhostFrequency(c);A.recordBadgeClonerEvidence(c,{physicalArtifact:true,auditContradiction:true});
 A.firstDaylightFeliciaConversation(c,{approach:'professional'});
 A.recordMorningstarTrace(c,{component:'telemetry',source:'verified fixture',verified:true});f.save(c);return c;
}
function point(f,id){f.n.x=f.api.POINTS.find(p=>p.id===id).x-11;f.n.y=396;f.n.onGround=true;}
function scan(f,id){point(f,id);f.api.interact(f.n);for(let i=0;i<31;i++)f.api.step(f.n,.05);}
test('journal describes each gate without changing facts, trust or identity',()=>{
 const f=fixture(),c=C.createInitialState(),ids=[];
 const visit=()=>{const before=JSON.stringify(c);ids.push(f.api.objective(c).id);assert.equal(JSON.stringify(c),before);};
 visit();c.flags.day_work_unlocked=true;visit();c.evidence.ghostIdentityEvidence.status='established';visit();c.flags.sector04_completed=true;visit();c.flags.tuesday_morning_reached=true;visit();
 A.beginGhostFrequency(c);A.recordBadgeClonerEvidence(c,{physicalArtifact:true,auditContradiction:true});visit();c.flags.felicia_video_watched=true;A.firstDaylightFeliciaConversation(c,{});visit();A.recordMorningstarTrace(c,{component:'telemetry',source:'fixture',verified:true});visit();
 assert.deepEqual(ids,['opening','access','sector04','tuesday','badge','daylight','trace','rooftop']);
 assert.doesNotMatch(f.api.objective(c).detail,/Felicia/);ready(f);const writes=f.writes();f.api.open(f.n,()=>{});assert.equal(f.writes(),writes);assert.equal(f.load().p1.reveal.violinistRevealed,false);
});
test('stairwell needs prerequisites and ground-level proximity; other modes are isolated',()=>{
 const f=fixture();assert.equal(f.api.enter(f.n),false);ready(f);
 for(const mutate of [n=>n.x=280,n=>n.y=200,n=>n.onGround=false,n=>n._sector04={},n=>n._v736={},n=>n.drive={},n=>n.district='industrial']){const n={...f.n};mutate(n);assert.equal(f.api.enter(n),false);}
 assert.equal(f.api.enter(f.n),true);assert.equal(f.n.location,'rooftop');assert.equal(f.load().p1.evidence.rooftopViolinVerified,false);
});
test('guards, interrupted observations and paused frames cannot award evidence',()=>{
 const f=fixture();ready(f);f.api.enter(f.n);scan(f,'source');assert.equal(f.n._nightMission.scan,null);f.n.enemies[0].alive=false;
 point(f,'source');f.api.interact(f.n);f.r.S.paused=true;for(let i=0;i<40;i++)f.api.step(f.n,.05);assert.equal(f.n._nightMission.scan.seconds,0);f.r.S.paused=false;
 f.n.x+=150;f.api.step(f.n,.05);assert.equal(f.n._nightMission.scan,null);assert.equal(f.load().p1.evidence.rooftopViolinVerified,false);
 scan(f,'source');assert.equal(f.load().p1.evidence.rooftopViolinVerified,false);assert.equal(f.load().p1.reveal.violinistRevealed,false);
});
test('two spatial observations persist evidence; explicit recognition preserves the Duet gate',()=>{
 const f=fixture();ready(f);const before=f.load(),enemies=f.n.enemies,platforms=f.n.platforms;f.api.enter(f.n);f.n.enemies[0].alive=false;
 scan(f,'source');scan(f,'relay');let c=f.load();assert.equal(c.p1.evidence.rooftopViolinVerified,true);assert.equal(c.p1.trust.score,before.p1.trust.score);assert.equal(c.p1.reveal.violinistRevealed,false);
 f.r.dialog.options.find(o=>o.t==='Recognize the violinist').f();c=f.load();assert.equal(c.p1.reveal.violinistRevealed,true);assert.equal(c.p1.duet.freeplayUnlocked,false);assert.equal(f.api.objective(c).id,'duet');
 assert.equal(f.api.leave(f.n),true);assert.equal(f.n.enemies,enemies);assert.equal(f.n.platforms,platforms);assert.equal(f.n.location,'exterior');assert.equal(f.n._nightMission,undefined);
});
test('failed evidence save is retryable without granting progress',()=>{
 const f=fixture();ready(f);f.api.enter(f.n);f.n.enemies[0].alive=false;scan(f,'source');f.fail(true);scan(f,'relay');assert.equal(f.n._nightMission.complete,false);assert.equal(f.load().p1.evidence.rooftopViolinVerified,false);
 f.fail(false);scan(f,'relay');assert.equal(f.load().p1.evidence.rooftopViolinVerified,true);
});
test('Sector 04 journal resumes the same encounter',()=>{
 const f=fixture();f.n._sector04={active:true};f.api.open(f.n,()=>{});f.r.dialog.options.find(o=>o.t==='Continue Sector 04 investigation').f();assert.equal(f.r.S.inDialog,false);assert.equal(f.n._sector04.active,true);
});
test('Day dispatch is retained for Day and suppressed during Night launch',()=>{
 const src=fs.readFileSync('game.js','utf8'),start=src.slice(src.indexOf('function startRun()'),src.indexOf('$("btn-continue")'));
 for(const mode of ['day','intent','mounted']){let dialogs=0;const c={S:{nightMode:mode==='mounted'?{}:null},__productionDesiredMode:mode==='intent'?'nightcrawler':null,setupDay(){},$:()=>({classList:{add(){},remove(){}}}),showTouchUI(){},initMusic(){},dlg(){dialogs++;},rank:()=>({name:'Mike'}),closeDlg(){}};vm.runInNewContext(start,c);c.startRun();assert.equal(dialogs,mode==='day'?1:0);}
});
test('contextual car action reaches Charger directly and respects blocking',()=>{
 const f=fixture();f.n.hp=100;f.r.S.nightMode=f.n;f.r.NM=f.n;let calls=0;
 f.r.TechOpsNightCombat={active:()=>true};f.r.TechOpsNightTravel={doorway:()=>null,nearCar:()=>true};
 f.r.nmCarMenu=()=>calls++;f.r.interact=()=>{throw Error('stale Day wrapper');};
 vm.runInNewContext(fs.readFileSync('night_combat_input.js','utf8'),f.r);
 assert.equal(f.r.TechOpsNightInput.dispatch('punch'),true);assert.equal(calls,1);
 f.r.S.inDialog=true;assert.equal(f.r.TechOpsNightInput.dispatch('punch'),false);assert.equal(calls,1);
});
console.log(JSON.stringify({suite:'night-campaign',passed,failed:0}));
