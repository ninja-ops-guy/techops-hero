/* Lazy browser bridge. Uses the one production Night simulation/compositor;
 * no private animation loop, duplicate input owner, or original-story grants. */
(function(root){
  'use strict';
  const A=root.TechOpsLivingWorld,D=A.Data,FLOOR=430,F=A.Fieldcraft,X=root.TechOpsFieldcraftRuntime;
  let origin=null,saveAge=0,lastHP=100,ui=null,images={},saveError=null;
  const game=()=>typeof S!=='undefined'?S:root.S;
  const world=()=>game()&&game().nightMode;
  const active=n=>!!(n&&n===world()&&n._livingWorld&&n._livingWorld.active);
  function viewpoint(n){if(!active(n))return null;const s=state();if(!s||!s.active)return null;const e=A.episode(s.active.id);return e&&(!e.requiresVisit||s.flags.waldo_invited&&s.flags.waldo_visit_received)&&!e.vehicle?s.active.actor:null;}
  const state=()=>game().meta.livingWorld;
  const now=()=>root.performance?root.performance.now():Date.now();
  const html=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clone=A.clone;
  function close(){if(root.document&&root.document.body){root.document.body.classList.remove('field-menu-open');const box=root.document.getElementById('dialogue');if(box)delete box.dataset.fieldActivity;}if(root.TechOpsCampaignVisuals)root.TechOpsCampaignVisuals.hide();if(root.closeDlg)root.closeDlg();}
  function dialog(title,body,options){if(root.document&&root.document.body){root.document.body.classList.remove('field-menu-open');const box=root.document.getElementById('dialogue');if(box)delete box.dataset.fieldActivity;}if(!root.dlg)return false;root.dlg(title,body,options);const el=root.document&&root.document.getElementById('dialogue');if(el){el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-labelledby','dlg-name');const first=el.querySelector('button');if(first)first.focus({preventScroll:true});el.scrollTop=0;}return true;}
  function native(){try{const n=A.facts(root.TechOpsCampaign.load(root.localStorage));n.day=Math.max(n.day,Number(game().day)||0);return n;}catch(_){return {facts:{},day:0};}}
  function ensure(){const s=game();s.meta=s.meta||{};const scope=s.meta._standaloneMode==='nightcrawler'?'standalone':'campaign';if(!s.meta.livingWorld)s.meta.livingWorld=A.initial(scope);A.validate(s.meta.livingWorld);if(s.meta.livingWorld.scope!==scope)throw new Error('This expedition belongs to a different playthrough.');return s.meta.livingWorld;}
  function persist(){
    try{A.validate(state());const ok=typeof save==='function'?save():root.save&&root.save();if(!ok)throw new Error(root.__techopsSaveError||'Save did not complete');saveError=null;if(X)X.saved();return true;}catch(e){saveError=String(e.message||e);if(X)X.failed();return false;}
  }
  function failed(){dialog('PROGRESS NOT SAVED','This action could not be saved. Its completion has been rolled back. Your supplies remain unchanged.<br><br>'+html(saveError||'Storage is unavailable.'),[{t:'Keep playing and retry the action',f:close},{t:'Open field journal',f:openJournal}]);}
  function commit(fn){
    const before=clone(state()),journal=(game().journal||[]).slice();let result;
    try{
      result=fn(state());const a=state().active;
      if(a&&a.finished&&!before.done.includes(a.id)){
        const e=A.episode(a.id);
        if(!e.privateCompletion&&(e.actor==='mike'||e.actors&&e.actors.includes('mike')))game().journal=journal.concat({day:game().day,title:'Field report — '+e.title,body:e.ending});
      }
      if(!persist()){game().meta.livingWorld=before;game().journal=journal;failed();return null;}
      return result;
    }catch(e){game().meta.livingWorld=before;game().journal=journal;dialog('ROUTE NOT AVAILABLE',html(e.message),[{t:'Back',f:close}]);return null;}
  }
  function snapshotNight(n){return JSON.parse(JSON.stringify(n,(k,v)=>['_nightCombat','_livingWorld','_fieldFeel'].includes(k)?undefined:v));}
  function resumable(s,id){return !!(s.active&&s.active.id===id&&!s.active.finished||s.runs[id]&&!s.runs[id].finished);}
  function checkpointNight(){if(!origin||!active(world()))return null;const n=world(),restored=clone(origin);restored.hp=Math.max(1,n.hp);restored.cash=n.cash;restored.kills=n.kills;return restored;}
  function openBoard(){
    let s;try{s=ensure();}catch(e){return dialog('EXPEDITION SAVE NEEDS ATTENTION',html(e.message)+' No progress has been reset.',[{t:'Back to Night Walker',f:close}]);}
    if(active(world()))return openJournal();
    const ns=s.scope==='campaign'?native():{},options=[];
    for(const e of D.episodes){const g=A.gate(s,e.id,ns);if(!g.open)continue;options.push({t:(resumable(s,e.id)?'Resume — ':s.done.includes(e.id)?'Revisit — ':'Begin — ')+e.title,f:()=>brief(e.id)});}
    const next=D.episodes.find(e=>!s.done.includes(e.id)),reason=next&&!A.gate(s,next.id,ns).open?A.gate(s,next.id,ns).reason:'';
    options.push({t:'Back to Night Walker',f:close});
    return dialog('LIVING WORLD / EXPEDITIONS','<b>'+s.done.length+' / '+D.episodes.length+' chapters completed</b><br>Explore → fight → preserve a route → rescue → return.<br><br>'+(s.scope==='standalone'?'A companion campaign with marked earlier viewpoints, later returns, and separate character knowledge and consequences. It includes later-comic spoilers as you advance. Main Day-story milestones remain separate.':'Expeditions open alongside your main campaign. Day evidence and authored milestones determine access. Expedition reports remain in this playthrough.')+(reason?'<br><br><b>Next:</b> '+html(reason):''),options);
  }
  function brief(id){const e=A.episode(id),s=state(),resume=resumable(s,id),a=s.active&&s.active.id===id?s.active:s.runs[id],recap=resume&&a?F.recap({...s,active:a},e):null;return dialog(e.title.toUpperCase(),'<b>'+html(e.chapter)+'</b><br><br>'+html(e.bridge||'')+(e.bridge?'<br><br>':'')+html(e.premise)+(s.done.includes(id)?'<br><br><b>Replay</b> — You are revisiting an earlier chapter. Saved consequences remain; this does not repeat events in the story.':'')+(recap?'<br><br><b>Welcome back · '+html(recap.actor.toUpperCase())+'</b><br>'+html(recap.place)+'<br><b>Next:</b> '+html(recap.next)+(recap.escort?'<br><b>With you:</b> '+html(recap.escort):'')+(recap.last?'<br>'+html(recap.last):'')+(recap.record?'<br><b>Your last record:</b> '+html(recap.record):''):'')+'<br><br>Move with arrows / stick. Jump with Space. Use F or INTERACT beside a marked point. E is Light; J is Kick. T opens field equipment and C opens the journal. Action keys can be remapped in Comfort and controls.'+(e.vehicle?'<br><br>You control the '+(e.vehicle==='cradle'?'supported transport':e.vehicle==='service_car'?'service car':'service carrier')+' from '+html(e.actor)+'’s viewpoint. Use wide routes; this is a grounded transport segment.':''),[{t:resume?'Resume this chapter':'Enter this chapter',f:()=>enter(id)},{t:'Back to expeditions',f:openBoard}]);}
  function enter(id){
    const n=world();if(!n||n._v736||n._sector04||n._nightwalker)return false;
    ensure();if(!origin)origin=snapshotNight(n);
    // Set the transient marker before saving, so the Night checkpoint owner
    // writes a validated street return plus the expedition state atomically.
    n._livingWorld={active:true};
    const result=commit(s=>A.start(s,id,s.scope==='campaign'?native():{},s.done.includes(id)&&!resumable(s,id)));
    if(!result){delete n._livingWorld;origin=null;return false;}
    loadRoom();close();ensureUI();return true;
  }
  function platforms(e,a){
    const r=e.rooms.find(r=>r.id===a.room),make=rows=>rows.map(([x,y,w])=>({x,y,w,h:14}));
    if(e.vehicle||['home','studio','garage','shelter'].includes(r.theme))return [];
    if(r.theme==='roof')return make([[420,350,180],[650,305,120],[810,280,210],[1080,350,190]]);
    if(r.theme==='pier')return make([[420,365,240],[830,330,250],[1320,370,180]]);
    if(r.theme==='prison')return make([[400,360,180],[700,320,190],[1040,345,280]]);
    if(r.theme.startsWith('quarter'))return make([[390,370,180],[860,350,250],[1260,375,170]]);
    if(r.theme==='fracture')return make([[400,355,230],[760,325,210],[1040,325,270],[1370,365,130]]);
    if(r.theme==='darkfactory')return make([[450,360,210],[820,330,480],[1350,365,170]]);
    if(r.theme==='hangar')return make([[470,350,300],[980,330,330]]);
    return make([[420,350,180],[810,320,210],[1080,350,190]]);
  }
  function loadRoom(){
    const n=world(),a=state().active,e=A.episode(a.id);n._livingWorld={active:true};n.district='industrial';n.street=1;n.drive=null;n.x=a.x;n.y=a.y;n.vx=0;n.vy=0;n.w=e.vehicle==='cradle'?76:e.vehicle?68:22;n.h=34;n.cam=0;n.face=1;n.clear=false;n.platforms=platforms(e,a);n.enemies=[];delete n._nightCombat;n.hitStop=0;n.jHeld=false;n.onGround=true;n.dashCD=0;n.dashT=0;lastHP=n.hp;if(a.id==='low_return')n._livingWorld.staging={x:Math.max(25,n.x-60),vx:0,face:n.face};spawn(n);resetInput();announce();if(X)X.loaded();
  }
  function resetInput(){if(world())delete world()._fieldFeel;if(root.TechOpsNightInput)root.TechOpsNightInput.reset();try{for(const k of Object.keys(keys))keys[k]=false;}catch(_){} }
  function spawn(n){
    const s=state(),a=s.active,e=A.episode(a.id),g=A.current(s);if(!g||!e.danger||a.finished||g.room!==a.room||a.step===0||e.vehicle)return;
    // Chorus hosts are never farmable humanoid targets. Only unoccupied
    // machines use the fighter damage model; occupied frames are hazards.
    if(e.mode==='horror'||e.mode==='rescue')return;
    const key=a.room+'_'+a.step;if(a.encounters[key]&&a.encounters[key].cleared)return;
    const enemy={name:'Local security construct',kind:'guard',x:Math.max(550,g.x-190+a.variant*90),y:FLOOR-38,w:30,h:38,hp:36,maxHp:36,spd:.65,dmg:4,tint:'#bfa0ff',cash:[0,0],vx:0,windup:0,hitT:0,kb:0,launch:0,down:0,alive:true,cd:0,_livingEncounter:key};
    if(a.encounters[key]&&Number.isFinite(a.encounters[key].hp))enemy.hp=Math.max(1,a.encounters[key].hp);
    n.enemies=[enemy];
  }
  function nearby(){
    if(!active(world()))return [];const n=world(),s=state(),a=s.active,g=A.current(s),c=[];
    if(g&&g.room===a.room)c.push({type:'goal',x:g.x,y:g.y,label:g.label});
    for(const q of D.sidequests){if(A.sideLocation(s,q).episode===a.id&&A.sideLocation(s,q).room===a.room&&(s.side[q.id]||0)<q.steps.length)c.push({type:'side',id:q.id,x:sideX(q,s),y:413,label:q.title});}
    if(X)c.push(...X.nearby());
    if(a.id==='factory_return'&&a.room==='return'&&a.step>=3)c.push({type:'staging',id:'billy-care',x:670,y:413,label:'Check Billy’s care watch'});
    if(n.x<180||n.x>1490)c.push({type:'exit',x:n.x+11,y:n.y+17,label:'Choose a physical route'});
    return c.map(p=>Object.assign(p,{distance:Math.hypot(n.x+n.w/2-p.x,n.y+n.h/2-p.y)})).filter(p=>p.distance<=96).sort((a,b)=>a.distance-b.distance);
  }
  function nearest(){return nearby()[0]||null;}
  function sideX(q,s){return A.sideLocation(s,q).x;}
  function interact(selection){
    if(!active(world())||game().inDialog)return false;
    const points=nearby(),chosen=selection&&['goal','side','exit','field','moment','staging'].includes(selection.type)?points.find(p=>p.type===selection.type&&p.id===selection.id):null;
    if(!chosen&&points.filter(p=>p.type!=='exit').length>1){
      dialog('AT THIS LOCATION','Choose the person or task you want to spend time with.',points.filter(p=>p.type!=='exit').map(p=>({t:p.label,f:()=>{close();interact(p);}})).concat({t:'Step back',f:close}));return true;
    }
    const p=chosen||points[0];if(!p)return false;
    const s=state(),g=A.current(s);s.active.x=Math.max(0,Math.min(1760,world().x));s.active.y=world().y;
    if(X&&['field','moment'].includes(p.type))return X.handle(p);
    if(p.type==='staging'){dialog('BILLY / CARE WATCH','A crewmate stays beside Billy’s supported stretcher. His living body remains here under care while Tarin’s receiving handoff is recorded separately. There is one Billy, with one place in the care plan.',[{t:'Return to the room',f:close}]);return true;}
    if(p.type==='exit'){openRoutes();return true;}
    if(p.type==='side'){const q=D.sidequests.find(q=>q.id===p.id),step=s.side[q.id]||0;dialog(q.title,html(q.steps[step][1]),[{t:q.steps[step][0],f:()=>{const r=commit(st=>A.sidequest(st,q.id,sideX(q,st)));if(r){const note=A.optionalNotes(state()).find(n=>n.id===q.id);const follow=q.stages&&!r.complete?'<br><br>'+html(note&&note.next?'Next: '+note.next:'The next lead is not known to this viewpoint yet. You can continue the main chapter.'):'';dialog(q.title,html(r.text)+follow,[{t:r.complete||q.stages?'Keep this moment':'Continue in the room',f:close}]);announce();}}},{t:'Another time',f:close}]);return true;}
    if(g.kind==='scene'){showScene();return true;}
    if(g.kind==='dispatch'){dialog(g.label,html(g.text),g.tasks.filter(t=>!(s.active.tasks||[]).includes(t.id)).map(t=>({t:t.label,f:()=>action(t.id)})).concat({t:'Step back',f:close}));return true;}
    const choices=g.options?g.options.map(o=>({t:o[1],f:()=>action(o[0])})):[{t:g.kind==='hold'?'Begin working at the station':g.label,f:()=>action()}];choices.push({t:'Step back',f:close});dialog(g.label,html(g.kind==='consequence'?A.consequences(s):g.text),choices);return true;
  }
  function showScene(){const line=A.sceneLine(state()),g=A.current(state());if(!line)return;dialog(line[0],html(line[1]),[{t:(state().active.sceneIndex||0)+1===g.lines.length?'Finish the conversation':'Continue',f:()=>action()},{t:'Pause the conversation',f:close}]);}
  function action(choice){const r=commit(s=>A.interact(s,choice));if(!r)return;if(!r.ok){dialog('CHECK THE OBSERVATION',html(r.text),[{t:'Try again',f:()=>{close();interact();}},{t:'Return to the room',f:close}]);return;}if(r.scene){showScene();return;}close();if(r.finished)completion();else if(r.advanced){world().enemies=[];spawn(world());announce();}}
  function completion(){resetInput();dialog('CHAPTER COMPLETE',html(A.episode(state().active.id).ending)+'<br><br><b>Saved.</b> You can explore the quiet aftermath or return to the expedition board.',[{t:'Stay for the aftermath',f:close},{t:'Return to expeditions',f:()=>leave(true)}]);}
  function openRoutes(){
    const s=state(),a=s.active,e=A.episode(a.id),rs=A.routes(s),atExit=world().x<210||world().x>1470;
    const text='<b>'+html(e.rooms.find(r=>r.id===a.room).name)+'</b><br>'+rs.map(r=>html(e.rooms.find(x=>x.id===r.to).name)+' — '+html(r.open?r.status:r.reason)).join('<br>')+'<br><br>Routes depend on physical access, group width, local power, and what has actually been checked.';
    const options=rs.filter(r=>r.open&&atExit).map(r=>({t:(e.remoteRooms?'Viewpoint — ':'Travel — ')+e.rooms.find(x=>x.id===r.to).name,f:()=>{const result=commit(s=>{s.active.x=Math.min(1760,world().x);return A.travel(s,r.to);});if(result){loadRoom();close();}}}));
    if(!atExit)options.push({t:'Return to a marked room exit',f:close});else options.push({t:'Stay here',f:close});return dialog('ROUTES / VERIFIED AND REPORTED',text,options);
  }
  function openOptionalNotes(){
    const notes=A.optionalNotes(state()),body=notes.length?notes.map(note=>'<b>'+html(note.title)+'</b><br>'+(note.last?'Last interaction: '+html(note.last)+'<br>':'')+(note.complete?'Complete — this consequence is already recorded.':note.next?'Next known place: '+html(note.next)+'<br>'+html(note.action):'No next location is known to this viewpoint yet. Continue the main chapter.')).join('<br><br>'):'Explore this chapter to find optional moments. Nothing here is required to continue.';
    const result=dialog('OPTIONAL QUEST NOTES','<div>'+body+'<br><br>These notes belong to '+html(state().active.actor.toUpperCase())+'. They reveal only visited places and this viewpoint’s interactions.</div>',[{t:'Back to field journal',f:openJournal},{t:'Resume chapter',f:close}]);
    if(root.document&&root.document.body)root.document.body.classList.add('field-menu-open');return result;
  }
  function openJournal(){
    if(!active(world()))return openBoard();const s=state(),a=s.active,e=A.episode(a.id),g=A.current(s);
    const options=[{t:'Resume — '+(g?g.label:'quiet aftermath'),f:close},{t:'Routes and current conditions',f:openRoutes},{t:'Optional quest notes',f:openOptionalNotes}];
    if(e.actors)options.push({t:'Switch operator — '+e.actors.find(x=>x!==a.actor),f:()=>{const r=commit(s=>A.switchActor(s));if(r){delete world()._nightCombat;if(e.remoteRooms)loadRoom();resetInput();announce();close();}}});
    if(X)options.push({t:'Field equipment and approaches',f:X.tools},{t:'Comfort, controls and audio',f:X.settings});
    if(root.openNightSupplies)options.push({t:'Supplies and store',f:()=>root.openNightSupplies()});
    options.push({t:'Save chapter and return to the street',f:()=>leave(false)});
    const knowledge=(s.knowledge[a.actor]||[]).slice(-4).map(html).join('<br><br>');
    return dialog(e.title.toUpperCase(),'<b>'+html(a.actor.toUpperCase())+' / '+html(e.chapter)+'</b><br><br>'+html(g?g.label:'Complete — the aftermath is quiet.')+'<br><br><b>This viewpoint’s record</b><br>'+knowledge,options);
  }
  function leave(board){const n=world(),restored=checkpointNight();if(!restored)return false;const r=commit(s=>A.leave(s));if(!r)return false;close();Object.keys(n).forEach(k=>delete n[k]);Object.assign(n,restored);origin=null;hideUI();resetInput();if(board)openBoard();return true;}
  function beforeStep(n){if(!active(n))return;if(X)X.beforeStep();const e=A.episode(state().active.id);n.clear=false;if(e.vehicle){n.vy=0;n.dashT=0;n.vx=Math.max(-2.6,Math.min(2.6,n.vx));} }
  function afterStep(n,dt){
    if(!active(n)||game().inDialog||game().paused||root.document.hidden)return;
    const s=state(),a=s.active,e=A.episode(a.id),hurt=n.hp<lastHP,before=clone(s);
    if(e.vehicle){n.y=FLOOR-n.h;n.vy=0;n.vx=Math.max(-2.6,Math.min(2.6,n.vx));}
    const result=A.tick(s,dt,{x:n.x,y:n.y,vx:n.vx,hurt,paused:false});
    for(const enemy of n.enemies){if(enemy._livingEncounter)a.encounters[enemy._livingEncounter]={hp:Math.max(0,enemy.hp),cleared:!enemy.alive};}
    // Authored machine work cycles, not omniscient pursuit. Quiet windows and
    // raised service platforms remain available, with no random named deaths.
    if(!a.finished&&e.danger&&['horror','rescue','stealth'].includes(e.mode)){
      const h=A.cycle(s);if(h.on&&Math.abs(n.x-h.x)<50&&n.y+n.h>390&&n.ifr<=0){n.hp=Math.max(1,n.hp-(X?X.incoming(6):6));n.ifr=55;n.vx=-4; a.holding=false;if(n.hp<=1){onDefeat();return;}}
    }
    if(before.active.holding&&!a.holding&&!result.advanced){
      n.msg='WORK PAUSED — wait for space, then interact to resume';n.msgT=now()+3500;
      if(ui)ui.querySelector('[role=status]').textContent=n.msg;
      result.changed=true;
    }
    const companion=n._livingWorld.staging;
    if(a.id==='low_return'&&companion){const dx=n.x-60-companion.x,step=Math.sign(dx)*Math.min(Math.abs(dx),205*Math.min(.05,dt||0));companion.vx=Math.abs(dx)>10?step:0;if(companion.vx){companion.x=Math.max(25,Math.min(1720,companion.x+step));companion.face=step<0?-1:1;}}
    if(X)X.afterStep(dt);
    lastHP=n.hp;saveAge+=Math.min(.05,dt||0);
    if(result.changed||saveAge>=4){saveAge=0;if(!persist()){game().meta.livingWorld=before;failed();return;}}
    if(result.advanced){n.enemies=[];spawn(n);announce();if(result.finished)completion();}
    if(ui){ui.hidden=false;const p=nearest();ui.querySelector('button').disabled=!p;ui.querySelector('button').textContent=p?'INTERACT · '+p.label:'Move to a marked point';}
  }
  function recover(walkway){const oldHP=world().hp;world().hp=40;const result=commit(s=>{A.retry(s);const pos=F.recover(s,A.episode(s.active.id),walkway);Object.assign(s.active,pos);return true;});if(result){loadRoom();close();}else world().hp=oldHP;}
  function onDefeat(){if(!active(world()))return false;world().hp=Math.max(1,world().hp);resetInput();const options=[{t:'Recover at the room entry',f:()=>recover(false)}];if(F.available(state(),A.episode(state().active.id)))options.push({t:'Recover via the service walkway',f:()=>recover(true)});options.push({t:'Save and leave the expedition',f:()=>leave(false)});dialog('FALL BACK TO THE CHECKPOINT','Objectives and consumed supplies remain recorded. Recover with emergency support, or take a raised service approach. Your group waits at the room entry; rejoin them before leaving.',options);return true;}
  function input(action){if(!active(world()))return false;if(X&&X.input(action))return true;return !!A.episode(state().active.id).vehicle;}
  function ensureUI(){
    if(ui)return;
    const style=root.document.createElement('style');style.textContent='.living-world-active #see-world-linked-button{display:none!important}#living-world-controls[hidden]{display:none!important}#living-world-interact{position:absolute;left:50%;transform:translateX(-50%);bottom:150px;pointer-events:auto;min-height:44px;max-width:310px;padding:10px 15px;border:1px solid #7edbcc;border-radius:6px;background:#071b23f2;color:#e5f7f2;font:12px/1.4 monospace}#living-world-objective{position:absolute;left:12px;right:12px;max-width:520px;box-sizing:border-box;padding:9px 12px;border-left:2px solid #75cbbb;background:#071119ed;color:#e0eeeb;font:12px/1.45 monospace}#living-world-progress{height:3px;background:#75cbbb;margin-top:6px;max-width:100%}@media(max-width:559px){#living-world-interact{left:12px;transform:none;bottom:202px;width:185px;max-width:48vw}}@media(max-height:500px){#living-world-interact{bottom:70px;max-width:280px}#living-world-objective{max-width:390px;font-size:11px;padding:6px 10px}}';root.document.head.append(style);
    ui=root.document.createElement('div');ui.id='living-world-controls';ui.style.cssText='position:fixed;inset:0;z-index:35;pointer-events:none';
    const button=root.document.createElement('button');button.id='living-world-interact';button.textContent='INTERACT';button.onclick=interact;ui.append(button);
    const card=root.document.createElement('div');card.id='living-world-objective';card.innerHTML='<b></b><div class="living-world-location"></div><div id="living-world-progress"></div>';ui.append(card);
    const status=root.document.createElement('div');status.id='living-world-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.style.cssText='position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)';ui.append(status);root.document.body.append(ui);
  }
  function announce(){ensureUI();const g=A.current(state()),a=state().active;const text=a.actor.toUpperCase()+' — '+(g?g.label:'Chapter complete');ui.querySelector('[role=status]').textContent=text;world().msg=text;world().msgT=now()+2800;}
  function image(src){if(!src)return null;if(!images[src]){const im=new root.Image();im.src=src;images[src]=im;}return images[src].complete&&images[src].naturalWidth?images[src]:null;}
  function drawK(ctx,cx,feet,face,vx,t){const atlas=root.K_ACTION,im=atlas&&image(atlas.src);if(!im)return false;const frame=atlas.frames[Math.abs(vx)>.2?'action'+Math.floor(t/120)%4:'action28'],w=68*atlas.cell/atlas.cellH;ctx.save();ctx.translate(cx,feet);if(face<0)ctx.scale(-1,1);ctx.drawImage(im,frame[0]*atlas.cell,frame[1]*atlas.cellH,atlas.cell,atlas.cellH,-w/2,-68,w,68);ctx.restore();return true;}
  function drawStaging(ctx,n,t){
    const a=state().active;ctx.save();ctx.font='11px monospace';ctx.textAlign='center';ctx.fillStyle='#d7e9e1';
    const companion=n._livingWorld.staging;
    if(a.id==='low_return'&&companion){
      const x=companion.x-n.cam,renderer=root.TechOpsIonaNightwalker,still=game().inDialog||game().paused||root.document.hidden;
      if(renderer&&renderer.drawCompanion)renderer.drawCompanion(ctx,{x,face:companion.face,vx:still?0:companion.vx},t,75);
      else ctx.fillText('Iona · loading',x+11,400);
      ctx.fillStyle='#d7e9e1';ctx.fillText('IONA · WITH K',x+11,338);
    }
    if(a.id==='factory_return'&&a.room==='compute'&&a.step>=2){const x=1340-n.cam;drawK(ctx,x,430,1,0,t);ctx.fillStyle='#d7e9e1';ctx.fillText('K · RESCUE ROUTE',x,344);}
    if(a.id==='factory_return'&&a.room==='return'&&a.step>=3){
      const x=600-n.cam;ctx.fillStyle='#829b9e';ctx.fillRect(x,394,145,8);ctx.fillRect(x+10,402,5,23);ctx.fillRect(x+130,402,5,23);ctx.fillStyle='#0a121b';ctx.fillRect(x+6,422,14,8);ctx.fillRect(x+125,422,14,8);
      ctx.fillStyle='#b8c4bc';ctx.fillRect(x+10,381,23,13);ctx.fillStyle='#54716e';ctx.fillRect(x+34,380,100,14);ctx.fillStyle='#cad6ce';ctx.fillRect(x+3,372,32,8);
      const watch=x+230;ctx.fillStyle='#af947b';ctx.fillRect(watch+4,369,14,16);ctx.fillStyle='#687f87';ctx.fillRect(watch,385,22,27);ctx.fillStyle='#253842';ctx.fillRect(watch+2,412,7,18);ctx.fillRect(watch+13,412,7,18);
      ctx.fillStyle='#d7e9e1';ctx.fillText('BILLY · SUPPORTED',x+72,355);ctx.fillText('CARE WATCH',watch+11,350);
    }
    ctx.restore();
  }
  function actor(ctx,n,t){
    const a=state().active,e=A.episode(a.id),x=n.x-n.cam,y=n.y,cx=x+n.w/2,feet=y+n.h;
    if(e.vehicle){ctx.fillStyle='#071219';ctx.fillRect(x-8,407,n.w+16,14);ctx.fillStyle=e.vehicle==='cradle'?'#c3d6cc':'#525d65';ctx.fillRect(x,384,n.w,24);ctx.strokeStyle='#7edde0';ctx.strokeRect(x,384,n.w,24);if(e.vehicle==='cradle'){ctx.fillStyle='#719c93';ctx.fillRect(x+12,374,45,12);ctx.fillStyle='#afe6bf';ctx.fillRect(x+50,382,4,19);}else{ctx.fillStyle='#1c303f';ctx.fillRect(x+10,373,42,13);}for(const xx of [x+10,x+n.w-13]){ctx.fillStyle='#080c13';ctx.fillRect(xx,416,12,12);ctx.fillStyle='#768494';ctx.fillRect(xx+4,420,4,4);}return;}
    if(a.actor==='iona'&&root.TechOpsIonaNightwalker&&root.TechOpsIonaNightwalker.draw(ctx,n,x,y,t,75))return;
    if(a.actor==='mike'&&root.drawNightPlayerAtlas&&root.drawNightPlayerAtlas(ctx,n,x,y,t))return;
    if(['katrin','manchez'].includes(a.actor)&&root.TechOpsArtHandoff&&root.TechOpsArtHandoff.drawActor(ctx,a.actor==='katrin'?'kat':'man',n,cx,feet,65,t))return;
    if(a.actor==='k'&&drawK(ctx,cx,feet,n.face,n.vx,t))return;
    if(a.actor==='felicia'){let src;try{src=typeof TO_FELICIA!=='undefined'?TO_FELICIA:null;}catch(_){}const im=image(src);if(im){ctx.save();if(n.face<0){ctx.translate(cx,0);ctx.scale(-1,1);}ctx.drawImage(im,128,0,128,128,n.face<0?-37:cx-37,feet-74,74,74);ctx.restore();return;}}
    // Keep identity explicit if an existing atlas has not decoded. This is a
    // loading marker, never a different cast member substituted as the actor.
    ctx.fillStyle='#98e3d6';ctx.fillRect(cx-5,feet-20,10,20);ctx.font='11px monospace';ctx.textAlign='center';ctx.fillText(a.actor.toUpperCase(),cx,feet-30);
  }
  function backdrop(ctx,n,W,H,t){
    const a=state().active,e=A.episode(a.id),r=e.rooms.find(r=>r.id===a.room),quiet=['home','studio','shelter'].includes(r.theme),quarter=r.theme.startsWith('quarter'),accent=quiet?'#dfb577':quarter?'#a4c39b':r.theme==='prison'?'#b88695':'#64c7cd';
    ctx.fillStyle=quiet?'#142124':'#071019';ctx.fillRect(0,0,W,H);ctx.imageSmoothingEnabled=false;
    const src=e.id==='queue_afterward'?null:quiet?'assets/visual-combat/home.webp':r.theme==='pier'?'assets/visual-combat/longwharf.webp':r.theme==='garage'?'assets/visual-combat/waldo.webp':!quarter&&r.theme!=='prison'?'assets/visual-combat/industrial.webp':null;
    const im=image(src);if(im){ctx.save();ctx.globalAlpha=.25;ctx.drawImage(im,-n.cam*.12,70,Math.max(W+220,im.naturalWidth*.5),420);ctx.restore();}
    for(let i=0;i<14;i++){const x=i*155-n.cam*.45;ctx.fillStyle=quiet?'#263a38':'#15222b';ctx.fillRect(x,140+(i%3)*18,130,290);ctx.strokeStyle=accent+'44';ctx.strokeRect(x+10,174,106,160);for(let j=0;j<4;j++){ctx.fillStyle=(i+j)%3?'#263b43':accent+'66';ctx.fillRect(x+20+(j%2)*42,190+Math.floor(j/2)*45,26,22);}}
    ctx.fillStyle=quiet?'#644e3b':'#25343a';ctx.fillRect(0,FLOOR,W,H-FLOOR);ctx.fillStyle=accent;ctx.fillRect(0,FLOOR,W,3);
    for(let x=-n.cam%100;x<W;x+=100){ctx.fillStyle='#0b131c';ctx.fillRect(x,FLOOR+30,60,3);}
    if(['factory','service','darkfactory','annex','hangar','dock','prison'].includes(r.theme)){for(let i=0;i<8;i++){const x=i*235-n.cam;ctx.fillStyle='#263d46';ctx.fillRect(x,115,10,315);ctx.fillStyle='#62727a';ctx.fillRect(x+2,115,2,315);ctx.fillStyle='#c89e5e';ctx.fillRect(x,132,150,5);}ctx.strokeStyle='#688d92';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(-n.cam,220);ctx.lineTo(1800-n.cam,220);ctx.stroke();}
    if(e.id==='queue_afterward'){
      ctx.fillStyle='#182831';ctx.fillRect(0,145,W,285);
      for(let i=0;i<8;i++){const x=i*270-n.cam;ctx.strokeStyle='#52636b';ctx.lineWidth=3;ctx.strokeRect(x+12,160,246,265);ctx.fillStyle='#09121f';ctx.fillRect(x+66,193,130,94);ctx.strokeStyle='#7c929b';ctx.strokeRect(x+66,193,130,94);ctx.fillStyle='#b7cdd4';for(let j=0;j<6;j++)ctx.fillRect(x+78+(j*19)%108,206+(j*31)%66,2,2);ctx.fillStyle='#8bafad';ctx.fillRect(x+30,174,204,3);}
    }
    if(r.theme==='pier'){ctx.fillStyle='#0c303d';ctx.fillRect(0,300,W,115);for(let i=0;i<12;i++){ctx.fillStyle='#285b67';ctx.fillRect((i*110+t*.005)%W,330+(i%3)*20,50,2);}const x=900-n.cam;ctx.fillStyle='#bd8d4d';ctx.fillRect(x,150,20,280);ctx.fillRect(x-120,150,250,13);ctx.strokeStyle='#aeaa8a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+120,160);ctx.lineTo(x+120,350);ctx.stroke();}
    if(r.theme==='roof'){
      ctx.fillStyle='#0a172a';ctx.fillRect(0,145,W,285);
      for(let i=0;i<30;i++){ctx.fillStyle=i%3?'#63778c':'#adcbd1';ctx.fillRect((i*97+31)%W,155+(i*29)%100,2,2);}
      for(let i=0;i<16;i++){const x=i*130-n.cam*.25,h=70+(i*37)%90;ctx.fillStyle='#192b3e';ctx.fillRect(x,430-h,100,h);ctx.fillStyle='#61796c';ctx.fillRect(x+25,447-h,5,6);}
      const x=900-n.cam;ctx.strokeStyle='#98bec5';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,280);ctx.lineTo(x,180);ctx.moveTo(x-30,200);ctx.lineTo(x+30,200);ctx.moveTo(x-20,215);ctx.lineTo(x+20,215);ctx.stroke();ctx.fillStyle='#d9bd75';ctx.fillRect(x-3,176,6,6);
    }
    if(r.theme==='prison'){
      ctx.fillStyle='#282330';ctx.fillRect(0,165,W,265);
      for(let i=0;i<8;i++){const x=i*240-n.cam;ctx.fillStyle='#0b111a';ctx.fillRect(x,235,120,195);ctx.strokeStyle='#66616e';ctx.lineWidth=5;for(let j=0;j<5;j++){ctx.beginPath();ctx.moveTo(x+12+j*24,235);ctx.lineTo(x+12+j*24,430);ctx.stroke();}ctx.fillStyle='#997586';ctx.fillRect(x,215,120,8);}
      ctx.fillStyle='#cec1ca';ctx.font='bold 20px monospace';ctx.fillText(r.id==='cell118'?'118':r.id==='cell1984'?'1984':'VENT JUNCTION',780-n.cam,200);
    }
    if(r.theme==='darkfactory'){
      for(let i=0;i<7;i++){const x=i*255+40-n.cam;ctx.fillStyle='#111b28';ctx.fillRect(x,240,130,185);ctx.strokeStyle='#547076';ctx.strokeRect(x,240,130,185);for(let j=0;j<5;j++){ctx.fillStyle='#293c49';ctx.fillRect(x+10,250+j*30,110,22);ctx.fillStyle=e.id==='factory_return'&&j%2?'#bd795e':'#8eac80';ctx.fillRect(x+100,257+j*30,8,6);}if(e.id==='factory_return'){ctx.strokeStyle='#aa8b66';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+120,240);ctx.lineTo(x+145,375);ctx.lineTo(x+200,420);ctx.stroke();}}
    }
    if(r.theme==='dock'){
      ctx.fillStyle='#344e51';ctx.fillRect(250-n.cam,200,260,215);ctx.fillStyle='#12242e';ctx.fillRect(275-n.cam,230,210,185);ctx.fillStyle='#91c7a7';ctx.fillRect(290-n.cam,211,180,7);
      for(let i=0;i<8;i++){const x=i*210+50-n.cam;ctx.fillStyle='#7caa98';ctx.beginPath();ctx.moveTo(x,449);ctx.lineTo(x+38,449);ctx.lineTo(x+38,442);ctx.lineTo(x+56,455);ctx.lineTo(x+38,468);ctx.lineTo(x+38,461);ctx.lineTo(x,461);ctx.fill();}
    }
    if(r.theme==='garage'||r.theme==='hangar'){
      for(const x of [640-n.cam,1140-n.cam]){ctx.fillStyle='#8c7959';ctx.fillRect(x,352,180,12);ctx.fillStyle='#344c51';ctx.fillRect(x+12,364,8,66);ctx.fillRect(x+158,364,8,66);ctx.fillStyle='#151f29';ctx.fillRect(x+60,312,65,40);ctx.fillStyle='#80b9a5';ctx.fillRect(x+67,319,51,24);ctx.fillStyle='#b2bec1';ctx.fillRect(x+16,344,30,6);}
    }
    if(quarter){for(let i=0;i<5;i++){const x=i*390-n.cam;ctx.fillStyle=r.theme==='quarter_ruin'?'#363a33':'#70513d';ctx.fillRect(x,250,280,180);ctx.fillStyle='#122525';ctx.fillRect(x+115,320,55,110);ctx.fillStyle=accent;ctx.fillRect(x+105,300,75,8);if(r.theme==='quarter_ruin'){ctx.fillStyle='#77716a';ctx.fillRect(x+30,405,65,25);ctx.fillRect(x+170,393,80,37);}}}
    if(quiet){const x=550-n.cam;ctx.fillStyle='#746d54';ctx.fillRect(x,355,230,60);ctx.fillStyle='#a8a285';ctx.fillRect(x+12,350,205,20);ctx.fillStyle='#ad8863';ctx.fillRect(x+320,385,95,9);ctx.fillRect(x+330,394,5,36);ctx.fillRect(x+400,394,5,36);if(e.id==='home'&&state().flags.two_cups){ctx.fillStyle='#bbddd2';ctx.fillRect(x+341,369,11,16);ctx.fillRect(x+368,369,11,16);}}
    if(e.id==='home'&&r.id==='porch'&&state().flags.separate_record){ctx.fillStyle='#dab87e';ctx.fillRect(490-n.cam,245,80,40);ctx.fillStyle='#1c2a27';ctx.font='bold 20px monospace';ctx.fillText('K',520-n.cam,273);}
    if(e.id==='home'&&r.id==='garage'&&state().flags.soundcheck){for(let i=0;i<4;i++){ctx.fillStyle=Math.floor(t/500)%4===i?'#e4c886':'#466466';ctx.fillRect(920+i*22-n.cam,280,14,14);}}
    if(e.id==='service_ring'&&r.id==='bay'&&state().flags.ordinary_delivery){ctx.fillStyle='#b9d9b2';ctx.font='13px monospace';ctx.fillText('RECEIVER: IN USE',650-n.cam,290);}
    if(e.id==='fracture'&&r.id==='shelter'&&state().flags.shelter_contact){ctx.fillStyle='#b9d9b2';ctx.font='12px monospace';ctx.fillText('FAMILIAR CALLBACK / VERIFY THE PERSON HERE',430-n.cam,285);}
    for(const p of n.platforms){ctx.fillStyle='#294751';ctx.fillRect(p.x-n.cam,p.y,p.w,14);ctx.fillStyle=accent;ctx.fillRect(p.x-n.cam,p.y,p.w,2);ctx.fillStyle='#263940';ctx.fillRect(p.x+8-n.cam,p.y+14,7,FLOOR-p.y-14);}
    ctx.textAlign='left';ctx.fillStyle=accent;ctx.font='bold 15px monospace';ctx.fillText(r.detail,220-n.cam,140);
    for(const x of [70,1640]){ctx.fillStyle='#16322d';ctx.fillRect(x-n.cam,332,65,98);ctx.strokeStyle='#76b59b';ctx.strokeRect(x-n.cam,332,65,98);ctx.font='11px monospace';ctx.fillStyle='#b3e1cb';ctx.fillText('ROUTES',x-n.cam+8,355);}
    return accent;
  }
  function marker(ctx,x,y,label,color,kind){ctx.save();ctx.fillStyle='#07151bef';ctx.fillRect(x-22,y-38,44,38);ctx.strokeStyle=color;ctx.lineWidth=2;ctx.strokeRect(x-22,y-38,44,38);ctx.fillStyle=color;ctx.font='bold 17px monospace';ctx.textAlign='center';ctx.fillText(kind==='side'?'◇':'!',x,y-13);ctx.font='11px monospace';ctx.fillText(label,x,y-52);ctx.restore();}
  function drawScene(ctx,n,W,H,t){
    if(!active(n))return false;const s=state(),a=s.active,e=A.episode(a.id),g=A.current(s),accent=backdrop(ctx,n,W,H,t);
    if(['horror','rescue','stealth'].includes(e.mode)&&!a.finished){const light=ctx.createRadialGradient(n.x-n.cam+n.w/2,n.y+10,80,n.x-n.cam+n.w/2,n.y+10,360);light.addColorStop(0,'#02071100');light.addColorStop(1,'#02071199');ctx.fillStyle=light;ctx.fillRect(0,145,W,H-145);}
    if(g&&g.room===a.room)marker(ctx,g.x-n.cam,g.y+17,g.label,accent,'goal');
    for(const q of D.sidequests)if(A.sideLocation(s,q).episode===a.id&&A.sideLocation(s,q).room===a.room&&(s.side[q.id]||0)<q.steps.length)marker(ctx,sideX(q,s)-n.cam,FLOOR,q.title,'#dfbd83','side');
    if(a.escort&&a.escort.room===a.room){const x=a.escort.x-n.cam;ctx.fillStyle='#98b7ac';ctx.fillRect(x,386,20,44);ctx.fillStyle='#f0d49e';ctx.fillRect(x+3,374,14,15);ctx.fillStyle='#dbf2e7';ctx.font='11px monospace';ctx.textAlign='center';ctx.fillText(a.escort.name,x+10,365);}
    if(!a.finished&&e.danger&&['horror','rescue','stealth'].includes(e.mode)){const h=A.cycle(s),x=h.x-n.cam;ctx.fillStyle=h.on?'#dba16a':'#435657';ctx.fillRect(x-30,355,60,68);ctx.fillStyle='#172731';ctx.fillRect(x-14,369,28,30);ctx.strokeStyle=h.on||h.warning?'#ffbb72':'#8caaa7';ctx.strokeRect(x-30,355,60,68);ctx.font='11px monospace';ctx.textAlign='center';ctx.fillStyle='#ebd7bd';ctx.fillText(h.on?'WORK CYCLE / KEEP CLEAR':h.warning?'WORK CYCLE / STARTING':'WORK CYCLE / PAUSED',x,340);}
    for(const enemy of n.enemies||[]){if(!enemy.alive)continue;if(root.drawNightEnemyAtlas)root.drawNightEnemyAtlas(ctx,enemy,enemy.x-n.cam,t);ctx.fillStyle='#8b69aa';ctx.fillRect(enemy.x-n.cam,enemy.y-9,30*enemy.hp/enemy.maxHp,4);if(enemy.windup>8){ctx.fillStyle='#ffd596';ctx.font='bold 20px monospace';ctx.fillText('!',enemy.x-n.cam,enemy.y-18);}}
    if(X)X.draw(ctx,n,t);
    drawStaging(ctx,n,t);actor(ctx,n,t);if(root.TechOpsNightCombat)root.TechOpsNightCombat.draw(ctx,n);
    const hud=root.TechOpsRuntimeHud;if(hud)hud.drawNight(ctx,n,{district:{name:e.title,streets:1,accent,danger:e.danger},clock:a.actor.toUpperCase(),status:a.finished?'QUIET AFTERMATH':e.mode.toUpperCase(),now:t});
    if(ui){
      ui.hidden=!!game().inDialog||!!game().paused;root.document.body.classList.add('living-world-active');
      const p=nearest(),button=ui.querySelector('button');button.disabled=!p;button.textContent=p?'INTERACT · '+p.label:'Move to a marked point';
      const card=ui.querySelector('#living-world-objective'),receipt=root.__techOpsNightHudEvidence;
      card.style.top=((receipt&&receipt.bottom||100)+8)+'px';
      card.querySelector('b').textContent=Math.min(a.step+1,e.goals.length)+' / '+e.goals.length+' · '+(g?g.label:'Quiet aftermath');
      card.querySelector('.living-world-location').textContent=a.escort&&Math.abs(a.escort.x-n.x)>240?a.escort.name+' is waiting behind. Return and stay close.':g?'Next: '+e.rooms.find(r=>r.id===g.room).name:'Optional moments remain. C opens the field journal.';
      const progress=card.querySelector('#living-world-progress');progress.hidden=!(a.holding&&g);progress.style.width=a.holding&&g?Math.min(100,a.hold/A.holdSeconds(s,g)*100)+'%':'0%';
    }
    return true;
  }
  function hideUI(){if(X)X.hidden();if(ui)ui.hidden=true;if(root.document)root.document.body.classList.remove('living-world-active');}
  if(X)X.attach({A,state,world,active,game,commit,dialog,close,openJournal,interact});
  root.TechOpsLivingWorldRuntime={VERSION:2,active,viewpoint,openBoard,openJournal,openRoutes,enter,interact,nearest,input,beforeStep,afterStep,drawScene,checkpointNight,onDefeat,hideUI,leave,health:()=>({active:active(world()),saveError,chapter:game()&&game().meta?.livingWorld?.active?.id})};
})(typeof globalThis!=='undefined'?globalThis:this);
