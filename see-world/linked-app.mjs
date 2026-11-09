import {gameUrl, portfolioUrl, isNativeReader} from './origin-routes.mjs';
import {CAMPAIGNS,campaignById,nodeById} from './campaigns.mjs';
import {newRun,choose,availability,consequence} from './engine.mjs';
import {CONTRACT,ACTIVE_KEY,NATIVE_KEY,PROFILE_KEY,CAMPAIGN_KEY,context,loadProgress,runsFrom,gate,saveRuns,sections,timeline,same,progressKey,nightKey,loadNight} from './linked.mjs';
const $=id=>document.getElementById(id),content=$('content');
let storage=null;
function acquireStorage(){try{const candidate=window.localStorage;candidate.getItem(PROFILE_KEY);storage=candidate;return true;}catch{storage=null;return false;}}
acquireStorage();
const make=(tag,text='',cls='')=>{const e=document.createElement(tag);e.textContent=text;if(cls)e.className=cls;return e;};
const button=(label,fn,cls='')=>{const b=make('button',label,cls);b.type='button';b.onclick=()=>Promise.resolve().then(fn).catch(showError);return b;};
let snap=null,progress=null,runs={},selected='',view='hub',pending=null,busy=false,frame=null,exploring=false,last='',loadError='',lastIdentity=null,lastSemantic='',actionError='',pendingReader=null;
function showError(e){actionError=e.message||String(e);$('storage-status').textContent=actionError;$('announcement').textContent=actionError;}
function refresh(){if(!storage){snap=null;progress=null;runs={};loadError='Browser storage is unavailable. Linked progress is read-only. Your saved data has not been changed; public media and the main game remain accessible.';return false;}const c=context(storage);if(!c.ok){snap=null;progress=null;runs={};loadError=c.error;return false;}try{const p=loadProgress(storage,c.snapshot);if(lastIdentity&&!same(lastIdentity,c.snapshot)){selected='';view='hub';last='';}lastIdentity=c.snapshot;snap=c.snapshot;progress=p;runs=runsFrom(p,snap);loadError='';return true;}catch(e){snap=null;progress=null;runs={};loadError=e.message;return false;}}
function navigate(to){if(!['comic','links','terminal','portfolio'].includes(to))return;if(parent!==window)parent.postMessage({type:'see-world:navigate',to},location.origin);else location.href=isNativeReader(location.pathname)?portfolioUrl(to):'../#/'+(to==='portfolio'?'':to);}
function nativeLink(label='Continue TechOps Hero ↗'){const a=make('a',label,'primary');a.href=gameUrl(location.hostname);a.target='_blank';a.rel='noopener';return a;}
function leaveWorld(){exploring=false;document.body.classList.remove('exploring');$('world-stage').hidden=true;$('world-nav').textContent='Explore 3D';}
function explore(){if(isNativeReader(location.pathname)){location.href=portfolioUrl('k/gallery');return;}if(exploring){leaveWorld();render();return;}exploring=true;document.body.classList.add('exploring');$('world-stage').hidden=false;$('world-nav').textContent='Return to story';if(!frame){frame=make('iframe');frame.title='See World existing 3D gallery';frame.allow='autoplay; fullscreen';frame.referrerPolicy='strict-origin-when-cross-origin';frame.src='../k-world/index.html?entry=gallery';$('world-stage').append(frame);$('world-note').textContent='Existing 3D gallery. Exploration alone does not complete a native story milestone.';}}
window.addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==frame?.contentWindow)return;if(e.data?.type==='k-world:comic')navigate('comic');if(e.data?.type==='k-world:portfolio')navigate('portfolio');});
function confirm(title,body,fn){pending=fn;$('confirm-title').textContent=title;$('confirm-body').textContent=body;$('confirm-dialog').showModal();}
$('cancel').onclick=()=>{pending=null;$('confirm-dialog').close();};$('confirm-dialog').addEventListener('cancel',()=>{pending=null;});$('confirm').onclick=()=>{const f=pending;pending=null;$('confirm-dialog').close();Promise.resolve().then(f).catch(showError);};
function chooseCampaign(id){leaveWorld();refresh();const c=campaignById(id);if(!c||!snap||!gate(id,c.start,snap).allowed){selected='';view='hub';render();return;}selected=id;view='story';last='';history.replaceState(null,'','#'+id);render();}
function home(){leaveWorld();selected='';view='hub';history.replaceState(null,'',location.pathname);render();}
function collection(){leaveWorld();view='collection';render();}
function hero(){const h=make('section','','hero'),a=make('div');a.append(make('p','THE EMRLD / ONE LINKED PLAYTHROUGH','eyebrow'));const title=make('h1');title.append(document.createTextNode('ONE STORY.'),document.createElement('br'),make('span','YOUR PERSPECTIVES.'));a.append(title);const b=make('div','','hero-copy');b.append(make('p','Your completed TechOps Hero milestones open these chapters. Your choices here earn sections inside Night Walker—not automatic victories.'),nativeLink());h.append(a,b);content.append(h);}
function hub(){hero();if(!snap){const b=make('section','','result');b.append(make('h2','Begin with the main story'),make('p',loadError||'No linked native playthrough is available in this browser.'),make('p','Open TechOps Hero, continue the main-story run, and use Linked Story to connect an existing save. New runs receive a new playthrough identity. Old preview completions stay separate.'),nativeLink('Open TechOps Hero ↗'));if(!storage)b.append(button('Try storage again',()=>{acquireStorage();refresh();render();},'secondary'));content.append(b);}
 const grid=make('div','','cards');grid.style.gridTemplateColumns='repeat(auto-fit,minmax(240px,1fr))';
 CAMPAIGNS.forEach((c,i)=>{const allowed=!!snap&&gate(c.id,c.start,snap).allowed,card=make('article','','card');card.style.setProperty('--tone',allowed?c.color:'#78908c');const art=make('div','','card-art');art.setAttribute('aria-hidden','true');art.append(make('span',String(i+1).padStart(2,'0')),make('strong',allowed?c.name:'UNDISCOVERED'));const body=make('div','','card-body');body.append(make('h2',allowed?c.title:'A perspective still ahead'),make('p',allowed?c.premise:'Continue the main story. The viewpoint, title and rewards stay hidden until discovered.'));
 const b=button(allowed?(runs[c.id]?.ended?'Review completed route':'Continue this perspective'):'Locked in this playthrough',()=>chooseCampaign(c.id));b.disabled=!allowed;body.append(b);if(allowed)body.append(make('p',c.id==='iona'?'Earlier interlude. Event order and discovery order are distinct.':c.chronology,'mechanics'));card.append(art,body);grid.append(card);});content.append(grid);renderTimeline();renderSections();}
function renderTimeline(){const box=make('section','','rules');box.style.gridTemplateColumns='1fr';box.append(make('h2','STORY TIMELINE'));if(!snap){box.append(make('p','Undiscovered entries stay hidden until the native story establishes them.'));content.append(box);return;}for(const row of timeline(snap,progress)){const item=make('article');item.append(make('h3',row.title),make('p',row.state+' — '+row.placement));box.append(item);}content.append(box);}
function renderSections(){if(!snap)return;const earned=sections(progress,snap).filter(s=>s.earned);if(!earned.length)return;const box=make('section','','result');box.append(make('h2','EARNED IN NIGHT WALKER'));
 const night=loadNight(storage,snap,progress);
 if(night.invalid.length)box.append(make('p','An invalid completion record was ignored. Its original is retained; complete the section in Night Walker again to repair it.'));
 for(const s of earned){const done=!!night.record.completed[s.id];
 box.append(make('h3',s.title),make('p',done?'Completed in Night Walker.':s.available?'Available. Enter Night Walker in the linked main run, then open Linked Story.':'Earned here; continue TechOps Hero to meet the native entry prerequisite.'),make('p',s.placement));}
 box.append(nativeLink('Return to Night Walker ↗'));content.append(box);}
async function commit(option,node){
 if(busy)return;actionError='';busy=true;
 const actor=selected,oldSnap=snap,oldProgress=progress,oldRuns={...runs};
 try{
  if(!oldSnap||!oldProgress)throw Error('Native synchronization is pending. Retry when the chapter is available.');
  const before=oldRuns[actor]||newRun(actor),next=choose(before,option.id,node);
  if(!gate(actor,before.node,oldSnap).allowed||!gate(actor,next.node,oldSnap).allowed)throw Error('Complete the corresponding native story checkpoint first.');
  // saveRuns revalidates the native source and choice prefix under the lock;
  // temporary same-run publication is retried, never mistaken for a reset.
  const result=await saveRuns(storage,oldProgress,{...oldRuns,[actor]:next},oldSnap);
  const live=context(storage);
  if(live.ok&&same(live.snapshot,oldSnap)){
   progress=result;snap=live.snapshot;lastIdentity=snap;runs=runsFrom(progress,snap);
   if(selected===actor){last=consequence(campaignById(actor),before,next);$('announcement').textContent=last;}
  }else refresh();
 }finally{busy=false;render();}
}
function story(){const c=campaignById(selected);if(!snap){content.append(make('h1','Synchronizing story progress'),make('p',loadError||'Waiting for the matching native save.'),nativeLink());return;}if(!gate(selected,c.start,snap).allowed){content.append(make('h1','Continue the main story'),make('p','This perspective is not available in the current playthrough.'),button('Story timeline',home));return;}const run=runs[selected]||newRun(selected),n=nodeById(c,run.node),access=gate(c.id,n.id,snap);if(!access.allowed){content.append(make('h1','Continue the main story'),make('p',access.reason),nativeLink());return;}
 content.style.setProperty('--tone',c.color);const top=make('div','','story-top');top.append(button('← Story timeline',home),make('small',c.name+' / LINKED PLAYTHROUGH'));content.append(top);
 const layout=make('div','','story-grid'),body=make('section','','story');body.append(make('p',c.id==='iona'?'EARLIER INTERLUDE / PLAYER VIEWPOINT':'CHRONOLOGICAL CHARACTER VIEWPOINT','chapter-label'));const title=make('h1',n.title);title.id='scene-title';title.tabIndex=-1;body.append(title,make('p',n.place,'location'));if(last)body.append(make('p',last,'after-choice'));const t=make('div','','story-text');n.text.forEach(p=>t.append(make('p',p)));body.append(t);const quote=make('blockquote','','dialogue');quote.append(make('small',n.speaker||c.name),make('p','“'+n.quote+'”'));body.append(quote);
 if(n.ending){const result=make('section','','result');result.append(make('h2',n.worldState),make('p',c.reward.text),button('Open collection',collection,'primary'));body.append(result);}else{const choices=make('div','','choices');n.choices.forEach((o,i)=>{const status=availability(run,o),target=gate(c.id,o.to,snap);const b=button('',()=>o.confirm?confirm('Commit this linked route?',o.hint+' This choice cannot be replaced in the current playthrough.',()=>commit(o,n.id)):commit(o,n.id),'choice');b.dataset.choice=o.id;b.disabled=!status.allowed||!target.allowed||busy;const label=make('span');label.append(make('strong',target.allowed?o.label:'Continue TechOps Hero before this next beat'),make('small',!target.allowed?target.reason:status.allowed?o.hint:status.reason));b.append(make('span',String(i+1).padStart(2,'0'),'choice-index'),label,make('span',b.disabled?'—':'↗'));choices.append(b);});body.append(choices);}
 const side=make('aside','','sidebar');side.append(make('h2','THIS PLAYTHROUGH'));for(const[k,v]of Object.entries(run.stats)){const stat=make('p',c.labels[k]+' / '+v);side.append(stat);}side.append(make('p','Linked decisions are append-only. Unrestricted review previews cannot overwrite this run or award native unlocks.'));
 const journal=make('details','','journal');journal.append(make('summary','Decision journal / '+run.history.length));const list=make('ol');for(const step of run.history){const old=nodeById(c,step.node);if(!gate(c.id,old.id,snap).allowed)continue;const li=make('li');li.append(make('strong',old.title),make('span',old.choices.find(x=>x.id===step.choice).label));list.append(li);}journal.append(list);side.append(journal,button('Explore the existing gallery',explore,'secondary'),nativeLink());layout.append(body,side);content.append(layout);renderSections();}
function renderCollection(){content.append(make('p','LINKED COLLECTION / CURRENT RUN','eyebrow'),make('h1','What you carry.'));const grid=make('div','','collection');for(const c of CAMPAIGNS){const disclosed=!!snap&&gate(c.id,c.start,snap).allowed,run=runs[c.id],done=disclosed&&run?.ended;const card=make('article','','card');card.append(make('h2',done?c.reward.title:'An unopened record'),make('p',done?c.reward.text:disclosed?'Complete this perspective in the linked playthrough.':'Continue the main story to discover this perspective.'));grid.append(card);}content.append(grid);if(snap&&CAMPAIGNS.every(c=>runs[c.id]?.ended))content.append(make('h2','Four witnesses'),make('p','Voice is not consent. Trust is not evidence. Origin is not ownership. Care is not command.'));renderSections();}
function semanticKey(){
 if(!snap||!progress)return JSON.stringify({view,selected,error:loadError});
 let night;try{const n=loadNight(storage,snap,progress);night={completed:n.record.completed,invalid:n.invalid};}catch(e){night={error:e.message};}
 return JSON.stringify({run:snap.runId,profile:snap.profileId,milestones:snap.milestones,runs:progress.runs,night,view,selected});
}
function readerState(){
 const active=document.activeElement;
 return{x:scrollX,y:scrollY,journals:[...content.querySelectorAll('details')].map(d=>d.open),
  focus:active&&content.contains(active)?{id:active.id,choice:active.dataset.choice,tag:active.tagName,text:active.textContent}:null};
}
function restoreReader(state){
 [...content.querySelectorAll('details')].forEach((d,i)=>{d.open=state.journals[i]||false;});
 const f=state.focus;
 if(f){const target=[...content.querySelectorAll('[id],button,a,summary')].find(e=>f.id?e.id===f.id:f.choice?e.dataset.choice===f.choice:e.tagName===f.tag&&e.textContent===f.text);target?.focus({preventScroll:true});}
 window.scrollTo(state.x,state.y);
}
function render(preserve=false){
 const retained=preserve?readerState():null;
 content.inert=false;content.removeAttribute('aria-busy');content.replaceChildren();content.style.removeProperty('--tone');
 $('storage-status').textContent=loadError||actionError;document.title='SEE WORLD — Linked Story';
 $('export').disabled=!snap;$('import').disabled=!snap;
 if(view==='story'&&selected)story();else if(view==='collection')renderCollection();else hub();
 lastSemantic=semanticKey();
 if(!exploring){if(retained)restoreReader(retained);else{window.scrollTo(0,0);($('scene-title')||content).focus({preventScroll:true});}}
}
function download(value){const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'})),a=make('a');a.href=url;a.download='see-world-linked-progress.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('export').onclick=()=>{if(!refresh())return showError(loadError);download({...progress,nativeSource:snap.source,nativeSequence:snap.sequence});};
$('import').onchange=async e=>{const f=e.target.files?.[0];e.target.value='';if(!f)return;try{if(f.size>200000)throw Error('Import exceeds the bounded save size.');if(!refresh())throw Error(loadError);const p=JSON.parse(await f.text());if(p.contract!==CONTRACT||p.revision!==progress.revision||!same(p,snap))throw Error('This is a different run, unsupported save, or an unlinked preview. Nothing was imported.');const proposed=runsFrom(p,snap);confirm('Extend this linked history?', 'Only a compatible continuation is accepted. Existing decisions and depot fate cannot be replaced.',async()=>{progress=await saveRuns(storage,progress,proposed,snap);refresh();render();});}catch(err){showError(err);}};
$('home').onclick=home;$('campaigns-nav').onclick=home;$('collection-nav').onclick=collection;$('world-nav').onclick=explore;$('comic-nav').onclick=()=>navigate('comic');$('portfolio-nav').onclick=()=>navigate('portfolio');
function onExternal(){
 const before=lastIdentity;
 const ok=refresh();
 if(!ok){
  let unchanged=false;try{unchanged=!!before&&same(JSON.parse(storage?.getItem(ACTIVE_KEY)||'null'),before);}catch{}
  if(unchanged){
   // Source writes and snapshot publication are separate events. Keep the reader
   // DOM (scroll, focus, selection, details), but disable actions until validated.
   if(!pendingReader)pendingReader=readerState();
   content.inert=true;content.setAttribute('aria-busy','true');$('storage-status').textContent=loadError;
   return;
  }
  if($('confirm-dialog').open){pending=null;$('confirm-dialog').close();}
  pendingReader=null;selected='';view='hub';render();return;
 }
 content.inert=false;content.removeAttribute('aria-busy');
 if(semanticKey()===lastSemantic){$('storage-status').textContent=actionError;if(pendingReader)restoreReader(pendingReader);pendingReader=null;return;}
 if($('confirm-dialog').open){pending=null;$('confirm-dialog').close();}
 const preserve=!!before&&same(before,snap);render(preserve);if(preserve&&pendingReader)restoreReader(pendingReader);pendingReader=null;
}
let refreshTimer=null;
function scheduleRefresh(){clearTimeout(refreshTimer);refreshTimer=setTimeout(onExternal,30);}
window.addEventListener('storage',e=>{if(e.key===ACTIVE_KEY){clearTimeout(refreshTimer);onExternal();}else if([NATIVE_KEY,PROFILE_KEY,CAMPAIGN_KEY].includes(e.key)||e.key?.startsWith('techops:linked:'))scheduleRefresh();});
window.addEventListener('focus',scheduleRefresh);window.addEventListener('pageshow',scheduleRefresh);
function applyHash(){refresh();const requested=location.hash.slice(1);if(campaignById(requested)&&snap&&gate(requested,campaignById(requested).start,snap).allowed){selected=requested;view='story';last='';}else{selected='';view='hub';}render();}
window.addEventListener('hashchange',()=>{leaveWorld();applyHash();});applyHash();
