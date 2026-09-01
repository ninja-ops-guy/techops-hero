"use strict";
const assert=require("assert"),fs=require("fs"),vm=require("vm");

const state={
  flags:{tuesday_morning_reached:true},
  story:{schemaVersion:1,completedActs:[],facts:{}},
  p1:{evidence:{score:3,records:[]},trust:{score:1,history:[]}},
  lateGame:{
    morningstar:{phase:3},
    // v1-shaped save: no consequences[] field.
    swarm:{
      log:[{id:"legacy-recon",timestamp:Date.now()-1000,command:"RECON",issuer:"Mike",params:{range:100,duration:20},result:"EXECUTED",bounds:{reversible:true},reversedAt:null}],
      triggeredQuestioningMoments:[],
      integrityAuditUnlocked:false
    }
  }
};
let saves=0;
const root={
  console,Date,Math,JSON,Object,Array,String,Number,Boolean,RegExp,
  globalThis:null,localStorage:{},S:{meta:{_char:"felicia"}},
  TechOpsCampaign:{load:()=>state,save:s=>{assert.strictEqual(s,state);saves++;return true;}},
  TechOpsCampaignAct2:{ensure:s=>s.p1},
  TechOpsMORNINGSTARBuild:{getCurrentPhase:()=>3},
  dlg:()=>true,closeDlg:()=>{}
};
root.globalThis=root;
const ctx=vm.createContext(root);
vm.runInContext(fs.readFileSync("swarm_doctrine.js","utf8"),ctx,{filename:"swarm_doctrine.js"});
const S=root.TechOpsSwarmDoctrine;
assert.ok(S,"swarm doctrine must load against a legacy save");
assert.doesNotThrow(()=>S.snapshot(),"legacy v1 swarm state must self-migrate during read");
let snap=S.snapshot();
assert.strictEqual(snap.logSize,1,"legacy audit history must survive migration");
assert.ok(Array.isArray(state.lateGame.swarm.consequences),"v2+ consequences ledger must be backfilled");
assert.deepStrictEqual(state.lateGame.swarm.triggeredQuestioningMoments,[]);

const reversed=S.reverseAction("legacy-recon","Felicia");
assert.strictEqual(reversed.success,true,"legacy reversible action remains reversible after migration");
snap=S.snapshot();
assert.ok(snap.questioningMomentsTriggered.includes("swarm_q3"),"legacy action can still enter the canonical questioning path");
assert.ok(snap.consequences.length>=1,"questioning consequence is recorded after migration");
assert.strictEqual(state.p1.evidence.score,3,"migration/questioning must not rewrite raw Act II evidence");
assert.strictEqual(state.p1.trust.score,1,"migration/questioning must not rewrite raw Act II trust");
assert.ok(saves>0,"migrated state remains persistable through canonical campaign save");
console.log("Swarm doctrine legacy-save migration: PASS");
