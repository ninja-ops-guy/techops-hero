/* Native owner for linked playthrough identity, milestone publication, and Night sections.
 * Publishing follows successful native persistence; See World never edits native flags.
 */
(function(root){
'use strict';
if(!root||root.TechOpsUniverse)return;
const U=root.TechOpsUniverseCore,Q=root.TechOpsUniverseSections;
if(!U||!Q)throw Error('Linked progression dependencies missing.');
let session=null,pending=Promise.resolve(false),lastError='',busy=false,storeModule=null,dialogOwner=false;
const game=()=>{try{return typeof S!=='undefined'?S:root.S;}catch{return root.S;}};
const storage=()=>root.localStorage;
const qa=()=>{try{const p=new URLSearchParams(root.location?.search||'');return p.has('qa')||p.has('dev')||p.has('test')||root.__K_QA__===true;}catch{return false;}};
const eligibleGame=()=>{const s=game();return !!s&&!U.standalone(s)&&!qa();};
const freshId=prefix=>prefix+(root.crypto&&root.crypto.randomUUID?root.crypto.randomUUID():Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)+'-'+Math.random().toString(36).slice(2));
function fail(e){lastError=String(e&&e.message||e);root.__universeProgressError=lastError;return false;}
function rawObject(st,key){const raw=st.getItem(key);return raw?U.parse(raw):null;}
function profileId(st){let id=st.getItem(U.KEYS.profile);if(id===null){id=freshId('p_');st.setItem(U.KEYS.profile,id);}if(!/^p_[a-zA-Z0-9-]{8,80}$/.test(id))throw Error('Invalid linked profile identity; saved data was preserved.');return id;}
function freshBinding(st){return {schema:1,profileId:profileId(st),playthroughId:freshId('r_')};}
function attachSession(b){const id={schema:1,profileId:b.profileId,playthroughId:b.playthroughId};session=id;const s=game();if(s&&!U.standalone(s)){s.meta=s.meta||{};if(s.meta.universe&&!U.same(s.meta.universe,b))throw Error('A different playthrough is loaded in this tab. Continue the current run before saving.');s.meta.universe=U.clone(id);}}
function beforeCampaign(c,st){
 if(qa()||game()&&U.standalone(game()))return;
 const prior=rawObject(st,U.KEYS.campaign);
 if(c.universe){
  if(!U.binding(c.universe))throw Error('Invalid native linked identity.');
  if(prior&&prior.universe){
   if(!U.same(c.universe,prior.universe)||c.universe.revision!==prior.universe.revision)throw Error('Stale native campaign save; another tab changed the playthrough.');
  }else if(prior)throw Error('Cannot replace a legacy run with another run’s linked history.');
  const live=game();if(live&&live.meta&&live.meta.universe&&!U.same(live.meta.universe,c.universe))throw Error('Wrong active native playthrough.');
 }else if(prior){
  if(prior.universe)throw Error('Unbound state cannot replace the active linked campaign.');
  return; // Existing unbound saves require explicit migration from the journal.
 }else c.universe={...freshBinding(st),revision:0,disclosures:{},sections:{}};
 if(!Number.isSafeInteger(c.universe.revision)||c.universe.revision<0)throw Error('Invalid native save revision.');
 c.universe.revision++;
 attachSession(c.universe);
}
function beforeProfile(s,st){
 if(qa()||U.standalone(s))return;
 const c=rawObject(st,U.KEYS.campaign);if(!c||!U.binding(c.universe))return;
 s.meta=s.meta||{};
 if(s.meta.universe&&!U.same(s.meta.universe,c.universe))throw Error('This tab belongs to an older native playthrough.');
 if(!s.meta.universe){if(!session||!U.same(session,c.universe))return;s.meta.universe={schema:1,profileId:c.universe.profileId,playthroughId:c.universe.playthroughId};}
}
function completed(c){
 const out=[];
 if(Object.keys(c.universe.sections||{}).filter(id=>id.startsWith('iona_')).length>1)throw Error('Mutually exclusive Iona sections cannot share a linked run.');
 for(const [id,record] of Object.entries(c.universe.sections||{})){
  if(!Q.definition(id)||!record||record.revision!==Q.REVISION||!U.same(record.binding,c.universe)||!record.grant||record.grant.id!==id||!Number.isSafeInteger(record.grant.sourceSequence)||record.grant.sourceSequence<1)throw Error('Invalid native linked-section record.');
  if(Q.replay(id,record.history).complete)out.push(id);
 }
 return out;
}
function publish(){
 if(qa()||game()&&U.standalone(game()))return Promise.resolve(false);
 const locks=root.navigator&&root.navigator.locks;
 if(!locks||!locks.request){fail('Linked synchronization requires Web Locks support. Native progress remains saved.');return Promise.resolve(false);}
 const job=locks.request('techops-universe-native-source',{mode:'exclusive'},()=>{
  const st=storage(),cRaw=st.getItem(U.KEYS.campaign),pRaw=st.getItem(U.KEYS.game);
  if(!cRaw||!pRaw)return false;
  const c=U.parse(cRaw),p=U.parse(pRaw);
  if(!U.binding(c.universe)||!U.same(c.universe,p.meta&&p.meta.universe)||U.standalone(p))return false;
  const live=game();if(live&&live.meta&&live.meta.universe&&!U.same(live.meta.universe,c.universe))throw Error('The loaded run is stale; no source snapshot was published.');
  const milestones=U.normalize(c,p,completed(c));
  if(!Number.isSafeInteger(c.universe.revision)||c.universe.revision<1||!Number.isSafeInteger(p._saveRevision)||p._saveRevision<1)throw Error('Native save revisions are missing.');
  const previous=(()=>{try{return rawObject(st,U.KEYS.source);}catch{return null;}})();
  const campaignStamp=U.stamp(cRaw),profileStamp=U.stamp(pRaw);
  if(U.validateSource(previous)&&U.same(previous.binding,c.universe)&&previous.campaignStamp===campaignStamp&&previous.profileStamp===profileStamp)return previous;
  const counterKey=U.KEYS.source+':sequence:'+c.universe.playthroughId,rawCounter=st.getItem(counterKey),counter=rawCounter===null?0:Number(rawCounter);
  if(!Number.isSafeInteger(counter)||counter<0)throw Error('Invalid source sequence counter. Recovery is required.');
  const sequence=Math.max(counter,U.validateSource(previous)&&U.same(previous.binding,c.universe)?previous.sequence:0)+1;
  const s={schema:U.VERSION,rules:U.RULES,status:'ready',binding:{schema:1,profileId:c.universe.profileId,playthroughId:c.universe.playthroughId},sequence,campaignRevision:c.universe.revision,profileRevision:p._saveRevision,campaignStamp,profileStamp,milestones};
  if(st.getItem(U.KEYS.campaign)!==cRaw||st.getItem(U.KEYS.game)!==pRaw)throw Error('Native save changed during synchronization. Retry from the current run.');
  st.setItem(counterKey,String(sequence));st.setItem(U.KEYS.source,JSON.stringify(s));
  if(!U.validateSource(U.readSource(st)))throw Error('Source publication could not be verified.');
  lastError='';root.__universeProgressError=null;
  try{root.dispatchEvent(new CustomEvent('techops:universe-source',{detail:{sequence}}));}catch{}
  return s;
 }).catch(fail);
 pending=job;return job;
}
function afterSave(){void publish();}
function initializeNewRun(){
 if(!eligibleGame())return false;
 try{
  const st=storage(),C=root.TechOpsCampaign;
  if(st.getItem(U.KEYS.campaign)!==null)return false;
  return C.save(C.createInitialState(),st);
 }catch(e){return fail(e);}
}
function afterReset(st){
 session=null;
 try{st.setItem(U.KEYS.source,JSON.stringify({schema:U.VERSION,rules:U.RULES,status:'reset'}));}catch(e){fail(e);}
}
function nativeSave(){try{if(typeof save==='function')return save();if(typeof root.save==='function')return root.save();return false;}catch(e){return fail(e);}}
function dlg(title,text,options){
 const f=typeof root.dlg==='function'?root.dlg:typeof globalThis.dlg==='function'?globalThis.dlg:null;
 if(!f)return false;dialogOwner=true;f(title,text,options);return true;
}
function close(){dialogOwner=false;if(typeof root.closeDlg==='function')root.closeDlg();}
const escape=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function module(){if(!storeModule)storeModule=import(new URL('../theemrld-portfolio/see-world/linked-store.mjs',root.location.href).href).then(M=>{if(M.U.RULES!==U.RULES)throw Error('The two deployments use incompatible progression rules.');return M;}).catch(e=>{storeModule=null;throw e;});return storeModule;}
async function context(){await publish();const source=U.readSource(storage());if(!U.validateSource(source))throw Error(source.reason||lastError||'No linked native run.');const M=await module(),record=M.inspectLinkedSave(storage(),source);return {source,record,grants:U.grants(record.runs,source)};}
function openError(e){fail(e);return dlg('LINKED STORY — NOT CHANGED',escape(lastError),[{t:'Return to Story Timeline',f:openJournal},{t:'Close',f:close}]);}
function storyUrl(){return new URL('../theemrld-portfolio/#/see-world',root.location.href).href;}
async function goSeeWorld(){try{if(!nativeSave())throw Error('Save the current native run before leaving.');await publish();if(!U.validateSource(U.readSource(storage())))throw Error(lastError||'The current run could not be synchronized.');root.location.assign(storyUrl());}catch(e){openError(e);}}
async function linkLegacy(){
 if(!eligibleGame())return openError(Error('Start or continue the main story run first. Standalone and QA sessions cannot link.'));
 try{
  const st=storage(),C=root.TechOpsCampaign,c=C.load(st);if(c.universe)return openJournal();
  // Explicit user adoption writes the loaded native profile, not a union of unrelated save files.
  U.ordered(c.story&&c.story.completedActs||[]);
  const b=freshBinding(st);c.universe={...b,revision:0,disclosures:{},sections:{}};
  session=b;game().meta=game().meta||{};game().meta.universe=U.clone(b);
  // Preserve both originals before the one-time migration. A failure is recoverable and publishes no grant.
  const oldC=st.getItem(U.KEYS.campaign),oldP=st.getItem(U.KEYS.game);
  if(oldC)st.setItem(U.KEYS.campaign+':pre-linked',oldC);if(oldP)st.setItem(U.KEYS.game+':pre-linked',oldP);
  c.universe.revision=1;C.validate(c);st.setItem(U.KEYS.campaign,JSON.stringify(c));
  if(!nativeSave())throw Error('Native profile migration could not be saved. Original bytes remain in recovery slots.');
  await publish();return openJournal();
 }catch(e){return openError(e);}
}
function migrationPrompt(){return dlg('CONNECT THIS STORY RUN','This links the <b>currently loaded main story</b> and its campaign record. Original save bytes are retained. Standalone Good Dogs/Night sessions and old See World preview completions are not imported.<br><br>Continue the intended story run before confirming.',[{t:'Link this loaded story run',f:linkLegacy},{t:'Cancel',f:close}]);}
async function showIonaDisclosure(){
 try{const {source}=await context();if(!eligibleGame()||!source.milestones.ghostFork)throw Error('Continue the main story before opening this interlude.');
  return dlg('EARLIER INTERLUDE — LOW QUARTER','<b>Player viewpoint: Iona, speaking to Mara.</b><br>After Red’s arrest; before her voice-window contact. This is a narrative cutaway, not a recording Mike possesses.<br><br><b>IONA:</b> “Red was arrested. AeroTech stamped his transfer.”<br><b>MARA:</b> “Do you know where they took him?”<br><b>IONA:</b> “No. I’ve got two names on tonight’s flight. I need you on the ground.”<br><br>The authorizer remains unknown. This scene does not transfer Iona’s private knowledge to Mike.',[
   {t:'Record this viewpoint and its place in the timeline',f:async()=>{try{const ctx=await context();if(!ctx.source.milestones.ghostFork||!eligibleGame())throw Error('Native story context changed.');const c=root.TechOpsCampaign.load(storage());c.universe.disclosures=c.universe.disclosures||{};c.universe.disclosures.iona_arrest='player-cutaway-v1';root.TechOpsCampaign.save(c,storage());await publish();openJournal();}catch(e){openError(e);}}},
   {t:'Read later — keep the chapter locked',f:openJournal}]);
 }catch(e){return openError(e);}
}
function nativeSectionAllowed(){const s=game(),r=root.TechOpsNightRuntime;return eligibleGame()&&s.nightMode&&!s.nightMode._v736&&!s.nightMode._sector04&&!s.inBattle&&!s.gameOver&&r&&r.active(s.nightMode)&&!(r.health&&r.health().transitioning);}
async function playSection(id){
 try{
  if(!nativeSectionAllowed())throw Error('Enter Night Walker from this main story run, then open CAMPAIGN → Linked Story Timeline. Standalone Night runs cannot consume linked unlocks.');
  const ctx=await context(),grant=ctx.grants.find(g=>g.id===id),def=Q.definition(id);if(!grant||!def)throw Error('This section is not earned in the active playthrough.');
  const c=root.TechOpsCampaign.load(storage()),record=c.universe.sections&&c.universe.sections[id],run=Q.replay(id,record?record.history:[]),node=def.nodes.find(n=>n.id===run.node);
  const actions=node.choices.map(option=>({t:option.label,f:()=>sectionAction(id,option.id,run.history)}));
  if(run.complete)actions.push({t:'Return to See World — result saved',f:goSeeWorld});
  actions.push({t:run.complete?'Back to the timeline':'Pause section — keep progress',f:openJournal});
  return dlg(escape(def.actor+' — '+def.title),'<small>'+escape(def.placement)+'</small><br><br>'+escape(node.text)+'<br><br><small>Optional Night Walker story section. It does not complete a main campaign act.</small>',actions);
 }catch(e){return openError(e);}
}
async function sectionAction(id,choiceId,expectedHistory){
 if(busy)return;busy=true;
 try{
  const {source}=await context();
  await root.navigator.locks.request('techops-universe-action:'+source.binding.playthroughId,{mode:'exclusive'},async()=>{
   if(!nativeSectionAllowed())throw Error('Night Walker context changed; no section progress was written.');
   const ctx=await context();if(!U.same(ctx.source.binding,source.binding))throw Error('Active native run changed.');
   const grant=ctx.grants.find(g=>g.id===id);if(!grant)throw Error('The required See World checkpoint is no longer valid.');
   const c=root.TechOpsCampaign.load(storage());if(!U.same(c.universe,source.binding))throw Error('Native playthrough mismatch.');
   c.universe.sections=c.universe.sections||{};const old=c.universe.sections[id],history=old?old.history:[];
   if(JSON.stringify(history)!==JSON.stringify(expectedHistory))throw Error('This section advanced in another tab. Reopen the saved scene.');
   const result=Q.choose(id,history,choiceId);
   if(result.feedback){dlg('CHECK THE EVIDENCE',escape(result.feedback),[{t:'Return to the observation',f:()=>playSection(id)}]);return;}
   c.universe.sections[id]={revision:Q.REVISION,binding:U.clone(ctx.source.binding),grant:{id:grant.id,campaign:grant.campaign,checkpoint:grant.checkpoint,sourceSequence:ctx.source.sequence},history:result.run.history};
   if(root.TechOpsCampaign.save(c,storage())!==true)throw Error('Native section save was rejected.');
   await publish();await playSection(id);
  });
 }catch(e){openError(e);}finally{busy=false;}
}
async function openJournal(){
 if(!eligibleGame())return dlg('LINKED STORY TIMELINE','Start or continue the main TechOps Hero story. Standalone modes and QA sessions remain separate.',[{t:'Close',f:close}]);
 try{
  const c=root.TechOpsCampaign.load(storage());if(!U.binding(c.universe))return migrationPrompt();
  const {source,record,grants}=await context(),m=source.milestones,lines=['<b>ONE PLAYTHROUGH / MULTIPLE VIEWPOINTS</b>','Native completion opens See World chapters. See World checkpoints open optional Night Walker sections. Availability is not completion.'],options=[];
  for(const id of U.CAMPAIGNS){const visible=U.gate(id,U.ENTRIES[id],source).allowed,r=record.runs[id];lines.push(visible?'<br><b>'+escape({iona:'Iona',felicia:'Felicia',k:'K',waldo:'Waldo / Oz'}[id])+'</b> — '+(r&&r.ended?'episode completed':r&&r.history.length?'in progress':'available')+'<br><small>'+escape(U.PLACEMENT[id])+'</small>':'<br>Undiscovered perspective — continue the main story.');}
  for(const grant of grants){const d=Q.definition(grant.id),done=m.completedSections.includes(grant.id);options.push({t:(done?'Review completed: ':'Enter unlocked: ')+d.title,f:()=>playSection(grant.id)});}
  if(m.ghostFork&&!m.iona)options.push({t:'Read an earlier interlude — new player viewpoint',f:showIonaDisclosure});
  options.push({t:'Open See World — save and continue there',f:goSeeWorld},{t:'Back to the game',f:close});
  if(!nativeSectionAllowed()&&grants.length)lines.push('<br><br>To play unlocked sections: enter Night Walker in this story run, then reopen this timeline.');
  return dlg('LINKED STORY TIMELINE',lines.join('<br>'),options);
 }catch(e){return openError(e);}
}
function install(){
 if(!root.document)return;
 const hud=root.document.getElementById('hud-right');if(hud&&!root.document.getElementById('btn-universe')){const b=root.document.createElement('button');b.id='btn-universe';b.className='hud-btn';b.textContent='◈';b.setAttribute('aria-label','Open linked Story Timeline');b.onclick=openJournal;hud.append(b);}
 root.addEventListener('focus',()=>{void publish();});
 root.addEventListener('storage',event=>{if([U.KEYS.campaign,U.KEYS.game].includes(event.key)){void publish();if(dialogOwner)close();}});
 void module().catch(fail);void publish();
}
root.TechOpsUniverse={VERSION:1,beforeCampaign,beforeProfile,afterSave,afterReset,initializeNewRun,publish,settled:()=>pending,openJournal,playSection,showIonaDisclosure,goSeeWorld,health:()=>({lastError,linked:U.readSource(storage()).status,session:session&&session.playthroughId})};
if(root.document){if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',install,{once:true});else install();}
})(typeof globalThis!=='undefined'?globalThis:this);
