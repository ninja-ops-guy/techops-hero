import {CONTRACT,NATIVE_KEY,PROFILE_KEY,CAMPAIGN_KEY,LOCK,context,makeSnapshot,parse,same,identityOK,locked,loadProgress,sections,nightKey,timeline} from '/theemrld-portfolio/see-world/linked.mjs';
const root=window,ACTIVE='techops:linked:active:v1',storage=localStorage;
const campaign=root.TechOpsCampaign,rawSet=Storage.prototype.setItem,rawRemove=Storage.prototype.removeItem;
let pending=null,publishing=false,lastError='',dialog=null,mission=null,observedIdentity=null;
const id=()=>({profileId:'local-primary',runId:crypto.randomUUID()});
const game=()=>root.S;
const solo=s=>!!(s?.meta?._standaloneMode||s?.meta?._v736?.campaignOrigin==='standalone'||root.__productionDesiredMode==='goodboys');
const currentId=()=>game()?.meta?.seeWorldLink;
const activeId=()=>{try{return parse(storage.getItem(ACTIVE),1000);}catch{return null;}};
function put(key,value){rawSet.call(storage,key,JSON.stringify(value));}
function notify(t){lastError=t;const el=document.getElementById('linked-native-status');if(el)el.textContent=t;}
function standalone(){return solo(game())||new URLSearchParams(location.search).get('dev')==='1'||root.__TECHOPS_LINKED_PREVIEW__===true;}
function selectedRun(){const a=activeId(),b=currentId();return identityOK(b)&&same(a,b)&&!standalone();}
function nativeContext(){if(!selectedRun())throw Error('Continue the linked main-story run. Standalone or another playthrough cannot use these routes.');const c=context(storage);if(!c.ok)throw Error(c.error);if(!same(c.snapshot,currentId()))throw Error('Playthrough changed.');return c.snapshot;}
function queuePublish(){queueMicrotask(()=>void publish());}
// Fail closed before a stale tab writes either native primary. Never rewrite save bytes.
Storage.prototype.setItem=function(key,value){
 if(this===storage&&(key===PROFILE_KEY||key===CAMPAIGN_KEY)){
   const active=activeId();
   if(active){const payload=parse(String(value)),binding=key===PROFILE_KEY?payload.meta?.seeWorldLink:payload.seeWorldLink;
    if(!same(binding,active))throw Error('Another playthrough owns linked persistence. Reload this tab before saving.');}
 }
 const result=rawSet.call(this,key,value);
 if(this===storage&&(key===PROFILE_KEY||key===CAMPAIGN_KEY))queuePublish();return result;
};
// Prepare identity only on an explicit normal New Game. Continue keeps the saved identity.
const originalNewState=root.newState;
root.newState=function(...args){const state=originalNewState.apply(this,args);state.meta.seeWorldLink=pending||id();return state;};
const start=root.document.getElementById('btn-start');
start?.addEventListener('click',()=>{if(root.__techopsAlternateStartMode||root.__productionDesiredMode)return;pending=id();put(ACTIVE,pending);rawRemove.call(storage,NATIVE_KEY);mission=null;},true);
const originalLoad=campaign.load,originalSave=campaign.save,originalReset=campaign.reset;
campaign.load=function(adapter){const result=originalLoad.apply(this,arguments),a=currentId();if(adapter&&adapter!==storage)return result;if(standalone())return result;
 if(identityOK(a)&&same(a,activeId())){
   if(result.seeWorldLink&&!same(result.seeWorldLink,a))throw Error('Campaign belongs to another playthrough.');
   if(!result.seeWorldLink&&!storage.getItem(CAMPAIGN_KEY))result.seeWorldLink=a;
 }
 return result;
};
campaign.save=function(state,adapter){if(adapter&&adapter!==storage)return originalSave.apply(this,arguments);
 if(selectedRun()){
  if(state.seeWorldLink&&!same(state.seeWorldLink,currentId()))throw Error('Refusing cross-run campaign save.');
  // An unbound existing campaign must be adopted explicitly, not silently merged.
  const raw=storage.getItem(CAMPAIGN_KEY);if(!state.seeWorldLink&&raw&&!parse(raw).seeWorldLink)throw Error('Link this existing run explicitly from Linked Story.');
  state.seeWorldLink=currentId();
 }
 const result=originalSave.call(this,state,adapter);if(result===true)queuePublish();return result;
};
campaign.reset=function(adapter){const result=originalReset.apply(this,arguments);if(!adapter||adapter===storage){rawRemove.call(storage,NATIVE_KEY);if(pending)result.seeWorldLink=pending;}return result;};
async function publish(){if(publishing||standalone())return false;publishing=true;try{return await locked(()=>{
 const pr=storage.getItem(PROFILE_KEY),cr=storage.getItem(CAMPAIGN_KEY);if(!pr||!cr)return false;
 const p=parse(pr),c=parse(cr),identity=p.meta?.seeWorldLink;if(!identityOK(identity)||!same(identity,c.seeWorldLink)||!same(identity,currentId()))return false;
 const active=activeId();if(active&&!same(active,identity))return false;if(!active)put(ACTIVE,identity);
 let previous=null;try{previous=parse(storage.getItem(NATIVE_KEY));}catch{}
 const next=makeSnapshot(pr,cr,previous);if(next!==previous)put(NATIVE_KEY,next);pending=null;observedIdentity=identity;return true;
 });}catch(e){notify(e.message);return false;}finally{publishing=false;}}
async function bindExisting(){
 if(!game()||standalone())throw Error('Load the main story before linking.');
 const profile=parse(storage.getItem(PROFILE_KEY)),state=originalLoad.call(campaign,storage);
 campaign.validate(state);if(root.TechOpsStateValidator?.validateStory){const v=root.TechOpsStateValidator.validateStory(state);if(v&&v.valid===false)throw Error('Repair the native story save before linking.');}
 const pId=profile.meta?.seeWorldLink,cId=state.seeWorldLink;
 if(pId&&cId&&!same(pId,cId))throw Error('Conflicting native run identities. No progress was merged.');
 const binding=pId||cId||id();if(!identityOK(binding))throw Error('Unsupported native identity.');
 // An explicit player action adopts only the loaded primary pair, never backups or greatest progress.
 put(ACTIVE,binding);game().meta.seeWorldLink=binding;state.seeWorldLink=binding;
 if(root.save()!==true)throw Error('Native profile could not be saved.');
 if(originalSave.call(campaign,state,storage)!==true)throw Error('Native campaign could not be saved.');
 await publish();nativeContext();notify('Current main-story run linked. Preview histories were not imported.');
}
// v1.7: initial solo play is not the later Duet/shared-roam gate.
const previousAuthority=root.TechOpsStoryAuthority;
root.TechOpsStoryAuthority=Object.freeze({...previousAuthority,linkedVersion:CONTRACT,
 canPlayFelicia:()=>{try{const s=originalLoad.call(campaign,storage);return s.story?.completedActs?.includes('act_3')&&s.story?.facts?.violinist_revealed===true;}catch{return false;}},
 canShareFelicia:()=>previousAuthority?.canPlayFelicia?.()===true
});
function make(tag,text='',cls=''){const e=document.createElement(tag);e.textContent=text;if(cls)e.className=cls;return e;}
function button(text,fn){const b=make('button',text);b.type='button';b.onclick=()=>Promise.resolve().then(fn).catch(e=>notify(e.message));return b;}
function close(){dialog?.close();if(game()&&dialog?.dataset.wasPaused!=='true')game().paused=false;}
function open(){
 if(!dialog){dialog=make('dialog');dialog.id='see-world-native-journal';dialog.setAttribute('aria-label','Linked Story and Night Walker sections');document.body.append(dialog);dialog.addEventListener('cancel',()=>{if(game()&&dialog.dataset.wasPaused!=='true')game().paused=false;});}
 if(!dialog.open){dialog.dataset.wasPaused=String(!!game()?.paused);if(game())game().paused=true;dialog.showModal();}renderJournal();
}
function getNight(s){const raw=storage.getItem(nightKey(s));if(!raw)return{contract:CONTRACT,profileId:s.profileId,runId:s.runId,sequence:0,completed:{}};const n=parse(raw,30000);if(n.contract!==CONTRACT||!same(n,s)||!Number.isSafeInteger(n.sequence)||!n.completed||Array.isArray(n.completed))throw Error('Invalid Night operation record. Original preserved.');return n;}
function renderJournal(){
 dialog.replaceChildren(make('h2','LINKED STORY / NIGHT WALKER'),button('Close journal',close));
 const status=make('p',lastError);status.id='linked-native-status';status.setAttribute('role','status');dialog.append(status);
 if(!game()||standalone()){dialog.append(make('p','Load the main-story run. Standalone modes cannot change linked campaign chronology.'));return;}
 const c=context(storage);
 if(!c.ok||!selectedRun()){dialog.append(make('p','Your main-story profile and campaign must belong to one linked playthrough. Old preview completions do not grant rewards.'),button('Link this loaded main-story run',async()=>{await bindExisting();renderJournal();}));return;}
 const s=c.snapshot,p=loadProgress(storage,s),night=getNight(s);dialog.append(make('p','One local playthrough. Completing a section never marks an unrelated main-story act complete.'));
 for(const row of timeline(s,p)){const box=make('section');box.append(make('h3',row.title),make('p',row.state+' — '+row.placement));dialog.append(box);}
 const a=make('a','Continue in See World ↗');a.href='/theemrld-portfolio/see-world/index.html';a.target='_blank';a.rel='noopener';dialog.append(a);
 if(s.milestones.ghostFork&&!s.milestones.ionaAccount)dialog.append(button('Read an earlier perspective',()=>{
  dialog.replaceChildren(make('h2','EARLIER INTERLUDE / PLAYER ACCOUNT'),make('p','This account takes place after Red’s arrest and before Iona’s later voice-window contact. Red is absent. The story concerns Iona’s response and the people still within reach. The exact interval remains unspecified.'),make('p','This is information for the player, not an unshown transfer of knowledge to Mike.'),button('Record this account and reveal the interlude',async()=>{const live=nativeContext();if(!live.milestones.ghostFork)throw Error('Story prerequisite changed.');const st=campaign.load(storage);st.seeWorldDisclosures={...st.seeWorldDisclosures,redArrestAccount:{version:1,audience:'player',at:new Date().toISOString()}};campaign.save(st,storage);await publish();renderJournal();}),button('Leave unread',renderJournal));
 }));
 const earned=sections(p,s).filter(x=>x.earned);dialog.append(make('h3','EARNED NIGHT WALKER SECTIONS'));
 if(!earned.length)dialog.append(make('p','Advance an available See World viewpoint to earn a section.'));
 for(const sec of earned){const b=button((night.completed[sec.id]?'Completed: ':'Enter: ')+sec.title,()=>launch(sec.id));b.disabled=!sec.available;dialog.append(b,make('p',sec.placement));}
 if(mission)dialog.append(button('Resume the active objective',close));
}
function validNight(){const s=game(),n=s?.nightMode;return selectedRun()&&n&&root.TechOpsNightRuntime?.active(n)&&!n._sector04&&!n._v736&&!s.inBattle&&!n.drive;}
function launch(sectionId){
 const s=nativeContext(),p=loadProgress(storage,s),sec=sections(p,s).find(x=>x.id===sectionId&&x.available);
 if(!sec)throw Error('This section has not been earned in this playthrough.');
 if(!validNight())throw Error('Enter Night Walker through the main campaign first; finish or leave the current special encounter.');
 if(mission&&mission.id!==sectionId)throw Error('Finish or leave the active side operation first.');
 close();if(!mission){root.nmLoadDistrict(sec.district);mission={...sec,runId:s.runId,profileId:s.profileId,step:0,answers:[],position:[420,820,1220]};}
 updateObjective();
}
function near(){const n=game()?.nightMode;return !!mission&&validNight()&&same(mission,currentId())&&n.district===mission.district&&Math.abs(n.x+n.w/2-mission.position[mission.step])<90;}
function updateObjective(){let box=document.getElementById('see-world-night-objective');if(!box){box=make('aside');box.id='see-world-night-objective';box.setAttribute('aria-label','Linked side operation');document.getElementById('game-wrap').append(box);}
 box.hidden=!mission;if(!mission)return;
 if(!same(mission,currentId())||!selectedRun()){mission=null;box.hidden=true;return;}
 box.replaceChildren(make('strong',mission.title),make('p',`Objective ${mission.step+1}/3 · ${mission.steps[mission.step][0]} · ${mission.district} · x ${mission.position[mission.step]}`));
 const b=button('Inspect objective',inspect);b.disabled=!near();box.append(b,button('Leave side operation',()=>{mission=null;box.hidden=true;}));
}
function inspect(){
 if(!near())throw Error('Reach the marked location in Night Walker.');
 const snap=nativeContext(),p=loadProgress(storage,snap);if(!sections(p,snap).some(x=>x.id===mission.id&&x.available))throw Error('Unlock prerequisites changed.');
 const op=mission,step=op.steps[op.step];open();dialog.replaceChildren(make('h2',step[0]),make('p','Observe the local condition. Choose the interpretation that the evidence supports.'),button(step[1],async()=>{if(!near()||mission!==op)throw Error('Operation changed.');op.answers.push({step:op.step,choice:0});if(op.step<2){op.step++;close();updateObjective();}else{await complete(op);dialog.replaceChildren(make('h2','SECTION COMPLETE'),make('p','The bounded operation is recorded. Main-story acts, rescues and endings remain unchanged.'),button('Return to Night Walker',close));mission=null;updateObjective();}}),button(step[2],()=>{dialog.append(make('p','That conclusion is not supported. Check the observation before proceeding.'));}),button('Back to the street',close));
}
async function complete(op){await locked(()=>{const s=nativeContext(),p=loadProgress(storage,s);if(!same(op,s)||!sections(p,s).some(x=>x.id===op.id&&x.available)||op.answers.length!==3||op.answers.some((x,i)=>x.step!==i||x.choice!==0))throw Error('Section completion requirements not met.');const n=getNight(s);if(!n.completed[op.id]){n.sequence++;n.completed[op.id]={version:1,sourceSequence:p.sequence,answers:op.answers,at:new Date().toISOString()};put(nightKey(s),n);}});}
const css=make('style');css.textContent='#see-world-native-journal{width:min(720px,94vw);max-height:88dvh;overflow:auto;background:#101b25;color:#eef6f3;border:2px solid #8bdac1;padding:24px;font:15px/1.6 monospace}#see-world-native-journal::backdrop{background:#000a}#see-world-native-journal button,#see-world-native-journal a{display:block;min-height:44px;margin:10px 0;padding:12px;background:#203641;color:#fff;border:1px solid #6b948e;font:inherit;text-align:left;cursor:pointer}#see-world-native-journal button:disabled{opacity:.5}#see-world-native-journal section{border-top:1px solid #38515c}#see-world-linked-button{position:fixed;right:12px;top:80px;min-height:44px;z-index:550;font:12px monospace;padding:12px;background:#15342f;color:#eff;border:1px solid #82d4b3}#see-world-night-objective{position:absolute;left:12px;bottom:120px;width:min(380px,92vw);z-index:550;background:#101c25ed;color:#eff;padding:12px;font:12px/1.4 monospace}#see-world-night-objective button{min-height:44px;padding:10px;margin:3px;color:#eff;background:#213b48;border:1px solid #6c9c91}#see-world-night-objective button:disabled{opacity:.45}#see-world-night-objective[hidden]{display:none}';document.head.append(css);
const ui=button('Linked Story',open);ui.id='see-world-linked-button';document.body.append(ui);
root.addEventListener('storage',e=>{if([PROFILE_KEY,CAMPAIGN_KEY,ACTIVE,NATIVE_KEY].includes(e.key)){if(!selectedRun())mission=null;queuePublish();if(dialog?.open)renderJournal();}});
root.addEventListener('focus',queuePublish);root.addEventListener('pageshow',queuePublish);
root.document.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='e'&&near()&&!dialog?.open){e.preventDefault();e.stopImmediatePropagation();inspect();}},true);
let timer=null;function startTimer(){if(timer===null)timer=setInterval(()=>{void publish();updateObjective();},750);}startTimer();
root.addEventListener('pagehide',()=>{clearInterval(timer);timer=null;});root.addEventListener('pageshow',startTimer);
root.TechOpsLinked={version:CONTRACT,publish,bindExisting,open,launch,inspect,context:nativeContext,mission:()=>mission,health:()=>({selected:selectedRun(),error:lastError})};
// An already linked Continue can be restored without a new identity or an import.
if(identityOK(currentId())&&!activeId())put(ACTIVE,currentId());queuePublish();
