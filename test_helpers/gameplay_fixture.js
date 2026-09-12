'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const SHIPPING='shipping_cannot_print',PLATING='plating_workstation_down',ACCESS='impossible_access_event';
const plain=value=>JSON.parse(JSON.stringify(value));
function storage(){const data=new Map();return {writes:0,data,getItem(k){return data.get(k)||null;},setItem(k,v){this.writes++;data.set(k,String(v));}};}
function boot(store=storage()){
 const r=vm.createContext({console,localStorage:store,setTimeout:null,
  S:{day:1,px:4,py:4,clock:540,meta:{},npcs:[],map:Array.from({length:43},()=>Array(45).fill(0)),inDialog:false,inBattle:false,nightMode:false},
  setupDay(){},interact(){r.baseInteractions=(r.baseInteractions||0)+1;},
  dlg(name,body,options){r.dialog={name,body,options};r.S.inDialog=true;},
  closeDlg(){r.dialog=null;r.S.inDialog=false;},toast(){},adjacent(a,b){return Math.abs(a.x-b.x)+Math.abs(a.y-b.y)<=1;}
 });
 for(const file of ['campaign_act1.js','campaign_native_act1.js','campaign_act1_investigations.js','campaign_native_act1_visuals_impl.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),r,{filename:file});
 return {r,C:r.TechOpsCampaign,N:r.TechOpsCampaignNativeAct1,I:r.TechOpsCampaignInvestigations,V:r.TechOpsCampaignNativeAct1Visuals,store};
}
function shift(b){const s=b.C.createInitialState();for(const [id,owner] of [[SHIPPING,'mike'],[PLATING,'amit'],[ACCESS,'security']])b.C.assignTicket(s,id,owner);b.C.completeStandup(s);b.C.completeWorkstation(s,{feliciaVideoSkipped:true});b.C.save(s,b.store);return s;}
function close(b,s,id,verification='strong',humanOutcome='restored'){b.C.resolveTicket(s,id,{technicalResolution:true,verification,humanOutcome});return s;}
function tuesday(b,s){b.C.recordGhostEvidence(s,{id:'badge_impossible_access',perspective:'delegated_partial',discoveredBy:'security'});b.C.enterSector04(s);b.C.insightAccessGuard(s);b.C.severAccessController(s);b.C.transitionToTuesday(s);b.C.save(s,b.store);b.r.S.day=2;return s;}
function click(b,label){const option=b.r.dialog.options.find(item=>item.t===label);assert.ok(option,'Missing option: '+label+'; got '+b.r.dialog.options.map(x=>x.t).join(', '));b.r.S.inDialog=false;return option.f();}
function freeze(x){if(x&&typeof x==='object'){Object.values(x).forEach(freeze);Object.freeze(x);}return x;}
function current(b,s,id){return b.C.workdayHandoff(s).find(item=>item.ticketId===id);}
function finish(b,s,id){let record=current(b,s,id),def=b.C.followupDefinition(record);for(const key of ['requester','technical'])b.C.performWorkdayFollowup(s,id,'observe',key);b.C.performWorkdayFollowup(s,id,'hypothesis',def.correctHypothesis);if(record.kind==='restore'){b.C.performWorkdayFollowup(s,id,'remediate');b.C.performWorkdayFollowup(s,id,'technical_check');}b.C.performWorkdayFollowup(s,id,'verify_requester');return current(b,s,id);}
module.exports={boot,storage,shift,close,tuesday,click,freeze,current,finish,plain,SHIPPING,PLATING,ACCESS};
