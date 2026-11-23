/* Explicit review page owner. Same campaign serializer/key, tab-local session
 * adapter; never reads or writes the ordinary localStorage campaign slot. */
(function(root){'use strict';
 const O=root.TechOpsLowQuarterOperation,C=root.TechOpsCampaign,R=root.TechOpsLowQuarter,V=root.TechOpsLowQuarterOperationVisuals;
 const $=id=>document.getElementById(id),keys={},storage=root.sessionStorage;
 let state=null,committed=null,paused=false,last=0,saveAge=0,uiAge=0,fatal=false;
 O.register();
 function persist(candidate){const v=O.validate(candidate);if(!v.valid||v.blocked)throw Error(v.reason);C.save(candidate,storage);return true;}
 function commit(){if(!state)return false;try{persist(state);committed=JSON.parse(JSON.stringify(state));$('save-error').textContent='';return true;}catch(e){
   if(committed)state=JSON.parse(JSON.stringify(committed));paused=true;$('save-error').textContent=e.message+' · Paused at last committed state. Free storage or retry after reload.';return false;}}
 function show(){ document.body.classList.add('opening-active');$('setup').hidden=true;$('game').hidden=false;last=performance.now();render();$('world').focus();}
 function start(ending){
   const initial=C.createInitialState();initial.story={schemaVersion:2,completedActs:['epilogue'],facts:{campaign_complete:true},ending};
   initial.lateGame={chapters:{ending,campaignComplete:true}};
   const candidate=O.begin(initial,ending,'review_'+Date.now().toString(36));
   persist(candidate);state=candidate;committed=JSON.parse(JSON.stringify(state));paused=false;fatal=false;show();
 }
 function resume(){const s=C.load(storage),v=O.validate(s);if(!s.lowQuarterOperation||!v.valid||v.blocked)throw Error(v.reason||'Opening save is unavailable');state=s;committed=JSON.parse(JSON.stringify(s));paused=false;show();}
 function act(fn){if(!state||paused||fatal)return;try{const next=O.transact(state,fn,persist);state=next;committed=JSON.parse(JSON.stringify(state));render();}catch(e){$('save-error').textContent=e.message;paused=true;}}
 function button(label,fn){const b=document.createElement('button');b.textContent=label;b.onclick=fn;return b;}
 let interactionKey='',routeKey='';
 function render(){if(!state)return;const o=state.lowQuarterOperation;V.draw($('world'),state);
   const clock=String(Math.floor(o.tick/60)).padStart(2,'0')+':'+String(Math.floor(o.tick%60)).padStart(2,'0');
   $('status').textContent='IONA '+Math.round(o.hp)+' HP  /  '+clock+' LOCAL  /  BREACH '+o.kills+'/18  /  '+(o.checkpoint?'CHECKPOINT':o.halted?'HALTED':paused?'PAUSED':'ACTIVE');
   $('objective').textContent=O.objective(state);const currentWork=o.work&&O.PROPS.find(p=>p.id===o.work.id);$('message').textContent=o.work?(currentWork?currentWork.label:'Working')+' · '+Math.ceil(o.work.remaining)+'s':o.message;
   const near=O.nearby(state),key=near.map(p=>p.id).join(',')+Boolean(o.work)+paused;
   if(key!==interactionKey){interactionKey=key;$('actions').replaceChildren();for(const p of near){const b=button(p.label,()=>act(s=>O.interact(s,p.id)));b.dataset.interaction=p.id;b.disabled=!!o.work||paused;$('actions').append(b);
     if(p.kind==='resident'){$('actions').append(button('Respect refusal',()=>act(s=>O.interact(s,p.id,'declined'))));}}
   }
   if(o.room!==routeKey){routeKey=o.room;$('routes').replaceChildren();
     for(const [a,b] of O.LINKS){const to=a===o.room?b:b===o.room?a:null;if(to){const bt=button('Walk to '+to,()=>act(s=>O.travel(s,to)));bt.dataset.route=to;$('routes').append(bt);}}
     if(o.room==='departure')$('routes').append(button('Follow convoy to receiving yard',()=>act(s=>O.travel(s,'receiving'))));
     if(o.room==='receiving')$('routes').append(button('Return to departure road',()=>act(s=>O.travel(s,'departure'))));
   }
   const r=R.evaluate(state);$('journal').textContent='Opening cohort safe: '+r.safe.length+'/12. Unresolved: '+r.unresolved.join(', ')+'. District result remains uncommitted. Siege phase: '+root.TechOpsChorusSiege.status(state).phase+'.\nMissing: '+r.missing.join(', ')+'.\n'+o.observations.slice(-12).map(e=>Math.floor(e.tick)+'s '+e.kind+' · '+e.producer+' → '+e.target).join('\n');$('journal').style.whiteSpace='pre-wrap';
   $('pause').textContent=paused?'Resume':'Pause';
 }
 $('launch').onclick=()=>{try{start($('ending').value);}catch(e){$('save-error').textContent=e.message;}};
 $('resume').onclick=()=>{try{resume();}catch(e){$('save-error').textContent=e.message;}};
 $('restart').onclick=()=>{if(confirm('Discard only this tab’s opening review and return to the command selection?')){state=null;committed=null;document.body.classList.remove('opening-active');C.reset(storage);$('game').hidden=true;$('setup').hidden=false;$('resume').hidden=true;interactionKey='';routeKey='';}};
 $('pause').onclick=()=>{if(!state)return;if(!paused&&!commit())return;paused=!paused;Object.keys(keys).forEach(k=>keys[k]=false);render();};
 $('strike').onclick=()=>act(O.attack);$('use').onclick=()=>{if(state){const p=O.nearby(state)[0];if(p)act(s=>O.interact(s,p.id));}};
 const map={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',Space:'jump'};
 document.addEventListener('keydown',e=>{if(!state||['SELECT','INPUT','TEXTAREA'].includes(e.target.tagName))return;if(map[e.code]){keys[map[e.code]]=true;e.preventDefault();}if(!e.repeat&&e.code==='KeyJ'){e.preventDefault();act(O.attack);}if(!e.repeat&&e.code==='KeyE')$('use').click();});
 document.addEventListener('keyup',e=>{if(map[e.code])keys[map[e.code]]=false;});
 for(const b of document.querySelectorAll('[data-hold]')){b.onpointerdown=e=>{keys[b.dataset.hold]=true;b.setPointerCapture(e.pointerId);e.preventDefault();};b.onpointerup=b.onpointercancel=()=>keys[b.dataset.hold]=false;b.onlostpointercapture=()=>keys[b.dataset.hold]=false;}
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&state){Object.keys(keys).forEach(k=>keys[k]=false);commit();paused=true;}});
 root.addEventListener('blur',()=>{Object.keys(keys).forEach(k=>keys[k]=false);if(state){commit();paused=true;}});
 root.addEventListener('pagehide',commit);
 function frame(now){const dt=last?Math.min(Math.max((now-last)/1000,0),.05):0;last=now;
   if(state&&!paused&&!fatal){try{O.step(state,dt,keys);saveAge+=dt;uiAge+=dt;if(saveAge>=1){commit();saveAge=0;}if(uiAge>=.12){render();uiAge=0;}else V.draw($('world'),state);
     if(state.lowQuarterOperation.checkpoint||state.lowQuarterOperation.halted){commit();paused=true;render();}
   }catch(e){fatal=true;paused=true;if(committed)state=JSON.parse(JSON.stringify(committed));$('save-error').textContent='Opening halted safely: '+e.message;}}
   root.requestAnimationFrame(frame);
 }
 try{if(C.load(storage).lowQuarterOperation)$('resume').hidden=false;}catch(e){$('setup').append(document.createTextNode('Saved review unavailable: '+e.message));}
 root.TechOpsLowQuarterOperationRuntime={snapshot:()=>state?JSON.parse(JSON.stringify(state)):null,paused:()=>paused};
 root.requestAnimationFrame(frame);
})(globalThis);
