/* SEE WORLD / TECHOPS HERO — shared, pure chronology contract. No save mutations. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.TechOpsUniverseCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION=1, RULES='linked-2026-11-07.1';
const KEYS=Object.freeze({source:'theemrld:universe:source:v1',profile:'theemrld:universe:profile:v1',campaign:'techops_hero_campaign_v1',game:'techops_save',see:'theemrld:universe:see:v2:'});
const ORDER=['prologue','act_1','act_2','act_3','act_4','act_5','act_6','interlude','act_7','act_8','act_9','epilogue'];
const CAMPAIGNS=['iona','felicia','k','waldo'];
const SECTION_IDS=['felicia_signal','felicia_stop','k_anchor','waldo_route','iona_freight','iona_workshop','iona_witness'];
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const own=(x,k)=>object(x)&&Object.prototype.hasOwnProperty.call(x,k);
const clone=x=>JSON.parse(JSON.stringify(x));
const binding=x=>object(x)&&x.schema===1&&typeof x.profileId==='string'&&/^p_[a-zA-Z0-9-]{8,80}$/.test(x.profileId)&&typeof x.playthroughId==='string'&&/^r_[a-zA-Z0-9-]{8,80}$/.test(x.playthroughId);
const same=(a,b)=>binding(a)&&binding(b)&&a.profileId===b.profileId&&a.playthroughId===b.playthroughId;
function parse(raw,max=2000000){if(typeof raw!=='string'||raw.length>max)throw Error('Missing or oversized save.');const d=JSON.parse(raw);if(!object(d))throw Error('Invalid save object.');return d;}
function ordered(acts){if(!Array.isArray(acts)||acts.length>ORDER.length||new Set(acts).size!==acts.length)throw Error('Invalid native act list.');for(let i=0;i<acts.length;i++)if(acts[i]!==ORDER[i])throw Error('Native story acts are not an ordered prefix.');return acts.length;}
function standalone(p){const m=p&&p.meta||{},g=m._v736||{};return !!m._standaloneMode||g.campaignOrigin==='standalone';}
function normalize(c,p,completedSections=[]){
 if(!object(c)||c.schemaVersion!==2||!object(p)||!same(c.universe,p.meta&&p.meta.universe)||standalone(p))throw Error('Native save pair is unbound or belongs to standalone play.');
 const st=c.story||{},f=st.facts||{},n=ordered(st.completedActs||[]), reached=id=>n>ORDER.indexOf(id),yes=k=>f[k]===true;
 const violinist=reached('act_3')&&yes('violinist_revealed');
 const duet=violinist&&reached('act_6')&&yes('duet_protocol_complete')&&yes('orbital_signal_found');
 const g=p.meta&&p.meta.goodDogs||{}, origin=p.meta&&p.meta._v736&&p.meta._v736.campaignOrigin;
 // Intermediate rescues must come from the same bound native profile, never the standalone slot.
 const nativeDogs=duet&&origin!== 'standalone';
 const returned=duet&&reached('interlude')&&['k_freed','waldo_freed','warden_null_defeated','crew_returned_to_earth'].every(yes);
 const kSeen=returned||(nativeDogs&&g.cell_118_reached===true&&g.k_seen===true);
 const kFreed=returned||(kSeen&&nativeDogs&&g.k_freed===true);
 const ozFreed=returned||(kFreed&&nativeDogs&&g.waldo_freed===true);
 const warden=returned||(ozFreed&&nativeDogs&&g.warden_null_defeated===true);
 const ghostFork=returned&&reached('act_7')&&yes('mike_meets_k')&&yes('k_personhood_affirmed');
 const disclosure=c.universe.disclosures||{};
 const iona=ghostFork&&disclosure.iona_arrest=== 'player-cutaway-v1';
 return {violinist,duet,orbital:duet,kSeen,kFreed,ozKnown:duet&&(returned||g.cell_1984_known===true),ozFreed,warden,returned,ghostFork,iona,
   complete:reached('epilogue')&&yes('campaign_complete'),completedActs:(st.completedActs||[]).slice(),
   completedSections:completedSections.filter(id=>SECTION_IDS.includes(id))};
}
function stamp(text){let a=2166136261,b=2246822519;for(let i=0;i<text.length;i++){const n=text.charCodeAt(i);a=Math.imul(a^n,16777619);b=Math.imul(b^n,3266489917);}return text.length+':'+(a>>>0).toString(16)+':'+(b>>>0).toString(16);}
function validateSource(s){return object(s)&&s.schema===VERSION&&s.rules===RULES&&s.status==='ready'&&binding(s.binding)&&Number.isSafeInteger(s.sequence)&&s.sequence>0&&Number.isSafeInteger(s.campaignRevision)&&s.campaignRevision>0&&Number.isSafeInteger(s.profileRevision)&&s.profileRevision>0&&object(s.milestones)&&Array.isArray(s.milestones.completedSections);}
function readSource(storage){
 try{
  const s=parse(storage.getItem(KEYS.source),64000);if(!validateSource(s))return {status:s.status==='reset'?'reset':'unavailable',reason:'Start or continue the linked TechOps Hero story run.'};
  const cRaw=storage.getItem(KEYS.campaign),pRaw=storage.getItem(KEYS.game),c=parse(cRaw),p=parse(pRaw);
  if(!same(s.binding,c.universe)||!same(s.binding,p.meta&&p.meta.universe)||standalone(p))return {status:'unavailable',reason:'The active native playthrough changed. Return to TechOps Hero.'};
  if(c.universe.revision!==s.campaignRevision||p._saveRevision!==s.profileRevision||stamp(cRaw)!==s.campaignStamp||stamp(pRaw)!==s.profileStamp||storage.getItem(KEYS.campaign)!==cRaw||storage.getItem(KEYS.game)!==pRaw)return {status:'stale',reason:'Native progress is awaiting a successful sync. Return to TechOps Hero.'};
  return s;
 }catch{return {status:'unavailable',reason:'No readable linked TechOps Hero save is available in this browser.'};}
}
const denied=reason=>({allowed:false,reason}),allowed=()=>({allowed:true,reason:''});
function gate(id,node,s){
 if(!validateSource(s))return denied(s&&s.reason||'Start or continue TechOps Hero to discover this perspective.');
 const m=s.milestones,sections=m.completedSections||[];
 if(!CAMPAIGNS.includes(id))return denied('Unknown perspective.');
 if(id==='felicia'){
  if(!m.violinist)return denied('Continue the main investigation in TechOps Hero.');
  if(!['rooftop','relay','crossing'].includes(node)&&!sections.includes('felicia_signal'))return denied('Complete the unlocked signal investigation in Night Walker.');
  return allowed();
 }
 if(id==='iona'){
  if(!m.iona)return denied('Continue the main story and read the newly available interlude in the native Story Timeline.');
  const required={'burn-end':'iona_freight','take-end':'iona_workshop','witness-end':'iona_witness'}[node];
  if(required&&!sections.includes(required))return denied('Complete this branch’s unlocked Night Walker follow-up.');
  return allowed();
 }
 if(id==='k'){
  if(!m.kSeen)return denied('Continue the orbital investigation in TechOps Hero.');
  if(['release','alcove','warden','shuttle','record-end','shared-end','quiet-end'].includes(node)&&!m.kFreed)return denied('Continue the first prison release in TechOps Hero.');
  if(['alcove','warden','shuttle','record-end','shared-end','quiet-end'].includes(node)&&!m.ozFreed)return denied('Complete the next prison release in TechOps Hero.');
  if(['shuttle','record-end','shared-end','quiet-end'].includes(node)&&!m.warden)return denied('Resolve the custody barrier in TechOps Hero.');
  if(node.endsWith('-end')&&(!m.returned||!sections.includes('k_anchor')))return denied('Complete the return and the unlocked memory investigation in Night Walker.');
  return allowed();
 }
 if(!m.ozKnown||!m.kSeen)return denied('Continue the orbital investigation in TechOps Hero.');
 if(['wait','freed','alcove','route','warden','shuttle','return-choice','shelter-end','introduction-end','record-end'].includes(node)&&!m.kFreed)return denied('Continue the first prison release in TechOps Hero.');
 if(['freed','alcove','route','warden','shuttle','return-choice','shelter-end','introduction-end','record-end'].includes(node)&&!m.ozFreed)return denied('Complete the next prison release in TechOps Hero.');
 if(['shuttle','return-choice','shelter-end','introduction-end','record-end'].includes(node)&&!m.warden)return denied('Resolve the custody barrier in TechOps Hero.');
 if(node.endsWith('-end')&&(!m.returned||!sections.includes('waldo_route')))return denied('Complete the return and the unlocked companion section in Night Walker.');
 return allowed();
}
const ENTRIES={iona:'rehearsal',felicia:'rooftop',k:'cell',waldo:'1984'};
const PLACEMENT={
 iona:'Earlier interlude: after Red’s arrest, before voice-window contact. Player perspective; Mike does not inherit it.',
 felicia:'After The Violinist. Independent preparation precedes formal Duet Protocol.',
 k:'Prison recollection and release, then return. Good Dogs precedes Ghost Fork.',
 waldo:'Good Dogs: Cell 118 first, then Cell 1984, custody barrier, return.'
};
function grants(runs,s){
 if(!validateSource(s))return [];
 const m=s.milestones,has=(id,node)=>!!runs[id]&&runs[id].history.some(x=>x.node===node),out=[];
 const add=(id,campaign,checkpoint)=>out.push({id,campaign,checkpoint,playthroughId:s.binding.playthroughId,sourceSequence:s.sequence});
 if(m.violinist&&has('felicia','relay'))add('felicia_signal','felicia','relay');
 if(m.violinist&&has('felicia','swarm'))add('felicia_stop','felicia','swarm');
 if(m.returned&&runs.k&&runs.k.flags.loopObserved&&has('k','alcove'))add('k_anchor','k','alcove');
 if(m.returned&&runs.waldo&&runs.waldo.flags.carePause&&has('waldo','alcove'))add('waldo_route','waldo','alcove');
 const i=runs.iona;
 if(m.iona&&i&&i.flags.ledger&&i.flags.rescue&&i.flags.allClear&&has('iona','fate')){
  const id={burned:'iona_freight',workshop:'iona_workshop',witnesses:'iona_witness'}[i.flags.depot];if(id)add(id,'iona','fate');
 }
 return out;
}
function sourceSignature(s){return validateSource(s)?`${s.binding.profileId}/${s.binding.playthroughId}/${s.sequence}/${s.campaignRevision}/${s.profileRevision}`:'unavailable';}
return Object.freeze({VERSION,RULES,KEYS,ORDER,CAMPAIGNS,SECTION_IDS,ENTRIES,PLACEMENT,object,own,clone,binding,same,parse,stamp,ordered,standalone,normalize,validateSource,readSource,gate,grants,sourceSignature});
});
