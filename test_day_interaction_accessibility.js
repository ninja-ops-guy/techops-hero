'use strict';
/* Day interaction accessibility contracts: objective live region, route arrival
 * feedback, dialog labeling restoration, and the modal focus trap. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
let count=0;
function test(name,run){run();count++;console.log('PASS '+name);}

function documentMock(){
  const nodes=new Map(),doc={activeElement:null,handlers:{}};
  function node(id){
    const classes=new Set(),n={id,isConnected:true,hidden:false,dataset:{},attributes:{},children:[],style:{},textContent:'',className:'',
      classList:{add(...xs){xs.forEach(x=>classes.add(x));},remove(...xs){xs.forEach(x=>classes.delete(x));},contains(x){return classes.has(x);}},
      setAttribute(k,v){this.attributes[k]=v;},getAttribute(k){return k in this.attributes?this.attributes[k]:null;},removeAttribute(k){delete this.attributes[k];},
      appendChild(child){this.children.push(child);child.parentNode=this;if(child.id)nodes.set(child.id,child);return child;},
      contains(el){for(let cur=el;cur;cur=cur.parentNode||null){if(cur===this)return true;}return false;},
      focus(){doc.activeElement=this;},getClientRects(){return this.tag==='dead'?[]:[1];}};
    Object.defineProperty(n,'innerHTML',{get(){return this.html||'';},set(html){this.html=html;this.children.forEach(x=>x.isConnected=false);this.children=[];for(const match of html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)){const b=node('');for(const attr of match[1].matchAll(/([\w-]+)(?:="([^"]*)")?/g)){if(attr[1].startsWith('data-'))b.dataset[attr[1].slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=attr[2]||'';}b.label=match[2];b.parentNode=this;this.children.push(b);}}});
    n.querySelectorAll=function(selector){if(selector.includes('data-day-action'))return this.children.filter(x=>x.dataset.dayAction);return this.children;};
    n.querySelector=function(selector){if(this.id==='dialogue')return nodes.get('dlg-text').children[0]||node('fallback');if(selector==='button')return this.children[0];if(selector.includes('data-day-route'))return this.children.find(x=>'dayRoute'in x.dataset);if(selector.includes('data-day-jobs'))return this.children.find(x=>'dayJobs'in x.dataset);if(selector.includes('data-day-interact'))return this.children.find(x=>'dayInteract'in x.dataset);return this.children[0];};
    return n;
  }
  doc.body=node('body');
  ['dialogue','dlg-text','dlg-name','dlg-options','title-screen'].forEach(id=>nodes.set(id,node(id)));
  ['dlg-name','dlg-text','dlg-options'].forEach(id=>{nodes.get(id).parentNode=nodes.get('dialogue');});
  nodes.get('title-screen').classList.add('hidden');
  doc.createElement=()=>node('');
  doc.getElementById=id=>nodes.get(id)||null;
  doc.addEventListener=(type,fn)=>{doc.handlers[type]=fn;};
  doc.querySelectorAll=selector=>{
    const want=[];
    if(selector.includes('#dlg-text'))want.push(...nodes.get('dlg-text').children);
    if(selector.includes('#dlg-options'))want.push(...nodes.get('dlg-options').children);
    return want;
  };
  doc.activeElement=node('origin');
  return doc;
}

function boot(){
  const entries=new Map(),storage={writes:0,fail:false,getItem(k){return entries.get(k)||null;},setItem(k,v){if(this.fail)throw Error('disk full');this.writes++;entries.set(k,String(v));}};
  const observers=[];
  const MutationObserver=function(cb){this.cb=cb;observers.push(this);};
  MutationObserver.prototype.observe=function(target,opts){this.target=target;this.opts=opts;};
  const ctx=vm.createContext({console,localStorage:storage,setTimeout:null,MutationObserver,__dialogObservers:observers,S:{day:1,px:21,py:16,map:Array.from({length:32},()=>Array(42).fill(0)),meta:{campaignAct1Native:{shipping:{x:8,y:26},plating:{x:18,y:26},standup:{x:34,y:12},access:{x:38,y:12}}},npcs:[],inDialog:false,inBattle:false,nightMode:false},
    toast(message){ctx.toasts.push(message);},save(){ctx.gameCheckpoint=JSON.stringify(ctx.S.meta);return true;}});
  ctx.toasts=[];
  for(const file of ['campaign_act1.js','campaign_act1_investigations.js','runtime_day_cases.js','runtime_day_world.js','runtime_day_doors.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,file),'utf8'),ctx,{filename:file});
  const C=ctx.TechOpsCampaign;
  const c=C.createInitialState();C.assignTicket(c,'shipping_cannot_print','mike');C.assignTicket(c,'plating_workstation_down','amit');C.assignTicket(c,'impossible_access_event','mike');C.completeStandup(c);C.completeWorkstation(c,{feliciaVideoSkipped:true});C.save(c,storage);
  ctx.document=documentMock();
  ctx.dlg=function(name,body,options){ctx.dialog={name,body,options};ctx.S.inDialog=true;ctx.document.getElementById('dlg-name').textContent=name;ctx.document.getElementById('dlg-text').innerHTML=body;const box=ctx.document.getElementById('dlg-options');box.innerHTML=(options||[]).map(o=>'<button type="button">'+o.t+'</button>').join('');};
  ctx.closeDlg=function(){ctx.S.inDialog=false;ctx.dialog=null;};
  ctx.TechOpsCampaignNativeAct1={openWorkstation(){ctx.S.inDialog=true;return true;},openTicketFollowUp(){return true;},recordAccessEvidence(){return true;}};
  vm.runInContext(fs.readFileSync(path.join(__dirname,'runtime_day.js'),'utf8'),ctx,{filename:'runtime_day.js'});
  ctx.TechOpsDayWorld.ensureWorld();
  return {ctx,X:ctx.TechOpsDayExperience,W:ctx.TechOpsDayWorld};
}
function keyEvent(key,extra){const calls=[];return Object.assign({key,target:{tagName:'BUTTON'},preventDefault(){calls.push('preventDefault');},stopPropagation(){calls.push('stopPropagation');},stopImmediatePropagation(){calls.push('stopImmediatePropagation');},calls},extra);}

test('objective HUD exposes a persistent polite live region',()=>{
  const b=boot();b.X.syncHud();
  const status=b.ctx.document.getElementById('day-route-status');
  assert(status,'missing live region');assert.equal(status.getAttribute('role'),'status');assert.equal(status.getAttribute('aria-live'),'polite');assert.equal(status.className,'sr-only');
  assert(status.textContent.length>0,'live region must carry the current objective');
  const hud=b.ctx.document.getElementById('day-route-hud');
  assert.equal(hud.getAttribute('aria-label'),'Day shift objective');
});

test('live region announces objective changes but not proximity churn',()=>{
  const b=boot();b.X.syncHud();
  const status=b.ctx.document.getElementById('day-route-status'),first=status.textContent;
  // Walking next to equipment re-renders the HUD (nearby button appears) but the
  // objective text is unchanged, so the announcement must not repeat.
  const laptop=b.W.stations().find(st=>st.id==='laptop_dock_link');
  b.ctx.S.px=laptop.x;b.ctx.S.py=laptop.y-1<0?laptop.y+1:laptop.y-1;
  b.X.syncHud();assert.equal(status.textContent,first);
  b.X.routeTo('laptop_dock_link');b.X.syncHud();
  assert.notEqual(status.textContent,first);assert(status.textContent.startsWith('Destination ·'),status.textContent);
});

test('arrival at a routed destination notifies exactly once until the route changes',()=>{
  const b=boot();
  b.ctx.S.meta.dayRouteTarget='shipping';
  b.ctx.S.px=8;b.ctx.S.py=25; // adjacent to the Shipping clerk contact
  b.X.syncHud();
  const arrived=b.ctx.toasts.filter(t=>t.startsWith('Arrived — Talk to Shipping clerk'));
  assert.equal(arrived.length,1,'expected one arrival notice, got '+JSON.stringify(b.ctx.toasts));
  b.X.syncHud();b.X.syncHud();
  assert.equal(b.ctx.toasts.filter(t=>t.startsWith('Arrived')).length,1,'arrival must not repeat while standing still');
  // Walking away and back without a new route stays quiet; a new route resets it.
  b.ctx.S.px=21;b.ctx.S.py=16;b.X.syncHud();
  b.ctx.S.px=8;b.ctx.S.py=25;b.X.syncHud();
  assert.equal(b.ctx.toasts.filter(t=>t.startsWith('Arrived')).length,1,'same route must not re-announce');
  b.X.routeTo('plating');b.ctx.S.px=18;b.ctx.S.py=25;b.X.syncHud();
  assert.equal(b.ctx.toasts.filter(t=>t.startsWith('Arrived — Talk to Plating operator')).length,1);
  // Clearing the route silences the tracker entirely.
  b.X.clearRoute('plating');b.X.syncHud();
  const before=b.ctx.toasts.length;b.X.syncHud();assert.equal(b.ctx.toasts.length,before);
});

test('leaving a device console restores the dialog’s default labeling',()=>{
  const b=boot();
  const dialogue=b.ctx.document.getElementById('dialogue');
  assert.equal(dialogue.getAttribute('aria-labelledby'),null);
  b.X.release();
  assert.equal(dialogue.getAttribute('aria-labelledby'),'dlg-name');
  assert.equal(dialogue.getAttribute('aria-describedby'),'dlg-text');
});

test('Tab stays trapped inside a generic modal dialog',()=>{
  const b=boot();
  const doc=b.ctx.document,options=doc.getElementById('dlg-options');
  options.innerHTML='<button type="button">One</button><button type="button">Two</button><button type="button">Three</button>';
  const list=options.children,handler=doc.handlers.keydown;
  assert(handler,'runtime must register a keydown handler');
  b.ctx.S.inDialog=true;doc.getElementById('dialogue').classList.remove('hidden');
  // Focus outside the dialog: Tab pulls it to the first action.
  doc.activeElement=doc.body;
  let e=keyEvent('Tab');handler(e);
  assert.equal(doc.activeElement,list[0]);assert(e.calls.includes('preventDefault'));
  // Wrap forward from the last action and backward from the first.
  doc.activeElement=list[2];e=keyEvent('Tab');handler(e);assert.equal(doc.activeElement,list[0]);
  doc.activeElement=list[0];e=keyEvent('Tab',{shiftKey:true});handler(e);assert.equal(doc.activeElement,list[2]);
  // Escape on a generic dialog is not owned by the day device layer.
  e=keyEvent('Escape');handler(e);
  assert.equal(b.ctx.S.inDialog,true,'generic Escape must not bypass the dialog’s own options');
  assert(!e.calls.includes('stopImmediatePropagation'));
});

test('opening a generic dialog moves keyboard focus to its first action',()=>{
  const b=boot(),doc=b.ctx.document,dialogue=doc.getElementById('dialogue');
  const observer=b.ctx.__dialogObservers.find(o=>o.target===dialogue);
  assert(observer,'runtime must watch the dialogue for modal opens');
  doc.activeElement=doc.body;
  b.ctx.dlg('SHIPPING CLERK','Labels are escaping.',[{t:'Talk',f(){}},{t:'Leave',f(){}}]);
  dialogue.classList.remove('hidden');
  observer.cb();
  const first=doc.getElementById('dlg-options').children[0];
  assert.equal(doc.activeElement,first,'focus must land on the first dialog action');
  // A dialog that already has focus inside it is left alone.
  doc.activeElement=doc.getElementById('dlg-options').children[1];
  observer.cb();
  assert.equal(doc.activeElement,doc.getElementById('dlg-options').children[1],'existing in-dialog focus must be preserved');
});

test('the trap releases when no modal dialog is open',()=>{
  const b=boot(),doc=b.ctx.document,handler=doc.handlers.keydown;
  b.ctx.S.inDialog=false;doc.getElementById('dialogue').classList.add('hidden');
  doc.activeElement=doc.body;
  const e=keyEvent('Tab');handler(e);
  assert.equal(doc.activeElement,doc.body,'free exploration must leave focus alone');
  assert.equal(e.calls.length,0);
});

console.log('OK '+count+' day interaction accessibility contracts');
