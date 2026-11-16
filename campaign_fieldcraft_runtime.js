/* Presentation adapter for optional field systems. The expedition owns saves,
 * menus, lifecycle, simulation and input; this module owns none of those. */
(function(root){
  'use strict';
  const F=root.TechOpsFieldcraft,reducedMotion=root.matchMedia?root.matchMedia('(prefers-reduced-motion: reduce)'):null;
  let H=null,button=null,status=null,landing=null,lastGround=true,previousHP=null,lastSaved=null,scoreRequest=0;
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const key=c=>c==='Space'?'Space':c==='ShiftLeft'?'Shift':c.replace('Key','');
  const s=()=>H.state(),n=()=>H.world(),e=()=>H.A.episode(s().active.id),p=()=>F.ensure(s());
  const score=()=>root.TechOpsFieldScore;
  const live=()=>H&&H.active(n());
  function commit(fn){const value=H.commit(fn);if(value!==null){syncPlatforms();applyPreferences();}return value;}
  function attach(host){H=host;return api;}
  function syncPlatforms(){if(!live())return;const w=n();w.platforms=(w.platforms||[]).filter(x=>!x._fieldcraft).concat(F.platforms(s()));}
  function loaded(){if(!live())return;F.ensure(s());syncPlatforms();applyPreferences();lastGround=!!n().onGround;previousHP=n().hp;landing=null;}
  function applyPreferences(){if(!root.document||!live())return;root.document.body.style.setProperty('--field-text-scale',String(p().text));root.document.body.classList.add('living-world-active');}
  function show(title,body,options){const result=H.dialog(title,'<div>'+body+'</div>',options);if(root.document){root.document.body.classList.add('field-menu-open');const el=root.document.getElementById('dialogue');if(el)el.scrollTop=0;}return result;}
  function tools(){
    if(!live())return false;const st=s(),ep=e(),kit=F.KITS[p().kit],a=st.active,r=F.room(st);
    if(!F.equipped(ep,a))return show('FIELD NOTES','This viewpoint uses its own movement and transport controls. Portable field equipment is available to the on-foot operators.',[{t:'Comfort and controls',f:settings},{t:'Return',f:H.close}]);
    const options=[];
    for(const id of kit.tools.filter(id=>F.relevant(st,ep,id))){const tool=F.TOOLS[id],near=Math.abs(n().x+11-tool.x)<=96&&Math.abs(n().y+17-413)<=96;
      if(F.available(st,ep)&&near)options.push({t:tool.name,f:()=>{const result=commit(world=>F.use(world,ep,id,H.A.baseCycle(world),n()));if(result)show(tool.name,esc(result),[{t:'Return to the room',f:H.close},{t:'Field tools',f:tools}]);}});
    }
    options.push({t:'Choose equipment',f:kits},{t:'Comfort, controls and audio',f:settings},{t:'Return to the room',f:H.close});
    const available=F.available(st,ep);const text=available?kit.tools.filter(id=>F.relevant(st,ep,id)).map(id=>'<b>'+esc(F.TOOLS[id].name)+'</b> · '+esc(F.TOOLS[id].description)+'<br><small>'+esc(F.TOOLS[id].x===620?'Local task panel':F.TOOLS[id].x===780?'Service platform':'Diversion motor')+' · '+(Math.abs(n().x+11-F.TOOLS[id].x)<=96?'nearby':'follow the matching floor marker')+'</small>').join('<br><br>'):'There is no field work to do in this quiet room. You can change equipment or spend time here.';
    const routes=r.scanned?'<br><br><b>Local route inspection</b><br>'+H.A.routes(st).map(route=>esc(ep.rooms.find(room=>room.id===route.to).name)+' · '+esc(route.open?'passage accessible; verify the receiving end':route.reason)).join('<br>'):'';
    return show(kit.name.toUpperCase(),text+routes+(r.cooldown>0?'<br><br>Task reset: '+Math.ceil(r.cooldown)+' seconds.':'')+'<br><br>Tools create optional approaches. Authored verification, support, and receiving checks still apply.',options);
  }
  function kits(){const ep=e(),st=s(),can=F.canChange(st,ep,n());return show('CHOOSE EQUIPMENT',Object.values(F.KITS).map(k=>'<b>'+esc(k.name)+'</b> · '+esc(k.description)).join('<br><br>')+(can?'':'<br><br>Return to a quiet room or clear room entry to change equipment.'),(can?Object.keys(F.KITS).map(id=>({t:(p().kit===id?'Equipped — ':'Equip — ')+F.KITS[id].name,f:()=>{const r=commit(st=>F.equip(st,ep,id,n()));if(r)tools();}})):[]).concat([{t:'Back',f:tools}]));}
  function setting(name,value){if(commit(st=>{F.ensure(st)[name]=value;return true;})){if(score())score().setVolume(p().volume);settings();}}
  function settings(){const v=p(),audio=score();return show('COMFORT / CONTROLS',
    'These settings apply to Living World expeditions.<br><br><b>Combat:</b> '+(v.damage==='gentle'?'Gentle · half incoming damage':'Standard')+'<br><b>Machine timing:</b> '+(v.timing==='relaxed'?'Relaxed · one extra warning second':'Standard')+'<br><b>Text:</b> '+Math.round(v.text*100)+'%<br><b>Motion accents:</b> '+(v.motion?'On (system reduced-motion preference respected)':'Off')+'<br><br>Field ambience is an optional instrumental arrangement. Your existing soundtrack remains available when it is off. Audio starts only when you choose it.',[
      {t:'Combat: '+(v.damage==='standard'?'Gentle':'Standard'),f:()=>setting('damage',v.damage==='standard'?'gentle':'standard')},
      {t:'Machine timing: '+(v.timing==='standard'?'Relaxed':'Standard'),f:()=>setting('timing',v.timing==='standard'?'relaxed':'standard')},
      {t:'Text size: '+Math.round((v.text===1?1.15:v.text===1.15?1.3:1)*100)+'%',f:()=>setting('text',v.text===1?1.15:v.text===1.15?1.3:1)},
      {t:v.motion?'Turn motion accents off':'Turn motion accents on',f:()=>setting('motion',!v.motion)},
      {t:'Remap action controls',f:controls},
      {t:audio&&audio.engaged()?'Stop field ambience':'Start field ambience',f:toggleScore},
      {t:'Ambience volume: '+(v.volume<.3?'40%':'20%'),f:()=>setting('volume',v.volume<.3?.4:.2)},
      {t:'Return to field journal',f:H.openJournal},{t:'Resume',f:H.close}
    ]);}
  async function toggleScore(after=settings){if(typeof after!=='function')after=settings;const audio=score();if(!audio)return;
    if(audio.engaged()){audio.stop();if(root.setMusic)root.setMusic(false);if(commit(st=>{F.ensure(st).score=false;return true;}))after();return;}
    // Resolve persistence before enabling any audible side effect.
    if(!commit(st=>{F.ensure(st).score=true;return true;}))return;
    const owner=s().active,request=++scoreRequest;
    show('FIELD AMBIENCE','Starting the instrumental arrangement…',[{t:'Cancel',f:()=>{scoreRequest++;audio.stop();H.close();}}]);
    const started=await audio.start(p().volume);if(request!==scoreRequest)return;
    if(!live()||s().active!==owner){audio.stop();return;}
    if(started){
      try{const loaded=await audio.loadConfiguredPack();if(request!==scoreRequest)return;if(!loaded||!live()||s().active!==owner){audio.stop();return;}if(root.setMusic)root.setMusic(true);after();}
      catch(error){if(request!==scoreRequest)return;audio.stop();show('AUDIO UNAVAILABLE',esc(error.message),[{t:'Back',f:settings}]);}
    }
    else show('AUDIO UNAVAILABLE',esc(audio.diagnostics().error||'Tap again to enable audio.'),[{t:'Back',f:settings}]);
  }
  function controls(){return show('ACTION CONTROLS','Movement remains on the arrows / WASD and touch stick. C opens the journal. Escape closes menus. Selecting a key already used by another action swaps the two bindings. Touch buttons keep their labelled actions.',F.KEY_ACTIONS.map(action=>({t:action.toUpperCase()+' — '+key(p().bindings[action]),f:()=>show('REMAP '+action.toUpperCase(),'Choose a key.',F.ALLOWED_KEYS.map(code=>({t:key(code),f:()=>{if(commit(st=>{F.bind(st,action,code);return true;})){if(root.TechOpsNightInput)root.TechOpsNightInput.reset();controls();}}})).concat([{t:'Cancel',f:controls}]))})).concat([{t:'Restore default controls',f:()=>{if(commit(st=>{F.ensure(st).bindings={...F.DEFAULT_KEYS};return true;}))controls();}},{t:'Back',f:settings}]));}
  function activity(id){const ep=e(),item=F.activities(s(),ep).find(x=>x.id===id);if(!item)return false;
    if(id==='rhythm')return rhythm(item,(s().active.fieldcraft.moments.rhythm||[]).slice());
    const choices=id==='lighting'?[['warm','Warm lamp'],['cool','Cool lamp']]:id==='desk'?[['green','Green desk light'],['amber','Amber desk light']]:[['away','Stay without checking the phone']];
    return show(item.label,esc(item.text),choices.map(([value,t])=>({t,f:()=>{const r=commit(st=>F.moment(st,ep,id,value,n()));if(r)show(item.label,esc(r),[{t:'Stay in the room',f:H.close}]);}})).concat([{t:'Another time',f:H.close}]));
  }
  function rhythm(item,pattern){
    const labels=['Kick','Snare','Tom','Hat'],audio=score(),audible=audio&&audio.engaged()&&!audio.isMuted();
    const options=labels.map((label,i)=>({t:label,f:()=>{if(pattern.length<16)pattern.push(i);if(audio)audio.tap(i);rhythm(item,pattern);}}));
    if(audible&&pattern.length)options.push({t:'Play this take',f:()=>audio.playPattern(pattern)});
    if(!audible)options.push({t:'Enable ambience and drum sounds',f:()=>{if(audio&&audio.engaged()){if(root.setMusic)root.setMusic(true);rhythm(item,pattern);}else toggleScore(()=>rhythm(item,pattern));}});
    options.push({t:'Keep this take',f:()=>{if(commit(st=>F.moment(st,e(),'rhythm',pattern,n())))H.close();}},{t:'Start again',f:()=>{if(audio)audio.silence();rhythm(item,[]);}},{t:'Leave without saving',f:H.close});
    const result=show(item.label,esc(item.text)+'<br><br><b>Your take:</b> '+(pattern.length?pattern.map(i=>labels[i]).join(' · '):'Tap a drum to begin.')+'<br><small>Up to 16 taps. Play back at a steady rehearsal tempo. No score, rewards, or public sharing.</small>',options);
    if(root.document){const box=root.document.getElementById('dialogue');if(box)box.dataset.fieldActivity='rhythm';}return result;
  }
  function nearby(){if(!live())return [];const st=s(),ep=e();return F.points(st,ep).map(x=>({...x,type:'field',id:String(x.x)})).concat(F.activities(st,ep).map(x=>({...x,y:413,type:'moment'})));}
  function handle(point){return point.type==='field'?tools():point.type==='moment'?activity(point.id):false;}
  function input(action){if(!live())return false;if(action==='interact'){H.interact();return true;}if(action==='field'){tools();return true;}return false;}
  function bindings(){return live()?p().bindings:null;}
  function beforeStep(){
    if(!live())return;const game=H.game(),ep=e(),w=n(),st=s(),work=H.A.cycle(st);
    if(score())score().update({blocked:game.inDialog||game.paused||game.gameOver||root.document.hidden,rehearsal:!!game.inDialog&&!game.paused&&!game.gameOver&&!root.document.hidden&&root.document.getElementById('dialogue')?.dataset.fieldActivity==='rhythm',threat:!st.active.finished&&(w.enemies||[]).some(x=>x.alive&&Math.abs(x.x-w.x)<350)||F.hazard(ep,st.active)&&(work.warning||work.on),escort:!!st.active.escort,quiet:F.isQuiet(ep,st.active)||st.active.finished});
  }
  function afterStep(dt){if(!live())return;const w=n();
    if(!lastGround&&w.onGround)landing={x:w.x+w.w/2,y:w.y+w.h,age:0};lastGround=w.onGround;
    if(landing){landing.age+=Math.min(.05,dt||0);if(landing.age>.28)landing=null;}
    previousHP=w.hp;
  }
  function redirectEnemy(w,enemy,dt){if(!live()||w!==n()||!enemy._livingEncounter||F.room(s()).diversion<=0)return false;const dx=1430-enemy.x;enemy.windup=0;enemy.x+=Math.sign(dx)*Math.min(Math.abs(dx),Math.max(30,enemy.spd*60)*Math.min(.05,dt||0));return true;}
  function incoming(value){return live()&&p().damage==='gentle'?value*.5:value;}
  function setupUI(){if(button)return;const doc=root.document,style=doc.createElement('style');style.textContent=`
    .living-world-active.field-menu-open #dialogue,.living-world-active.field-menu-open #dlg-text{animation:none!important}
    .living-world-active #dialogue{font-size:calc(16px * var(--field-text-scale,1))}
    .living-world-active #living-world-objective{font-size:calc(12px * var(--field-text-scale,1))}
    .living-world-active #dlg-text{font-size:inherit;line-height:1.55}
    .living-world-active #dlg-options button{min-height:44px;font-size:calc(14px * var(--field-text-scale,1))}
    #field-tools{position:fixed;z-index:36;left:12px;bottom:150px;min-height:44px;padding:10px 14px;border:1px solid #a4ccba;border-radius:6px;background:#10232ef5;color:#e4f5ec;font:13px monospace}
    #field-status{font-size:calc(11px * var(--field-text-scale,1));line-height:1.45;margin-top:5px;color:#b8d3cd}
    #field-tools[hidden]{display:none!important}
    @media(max-width:559px){#field-tools{bottom:280px}}
    @media(min-width:560px){#field-tools{bottom:210px}}
    @media(max-height:500px){#field-tools{bottom:70px;left:auto;right:12px}#field-status{max-width:350px}}
  `;doc.head.append(style);button=doc.createElement('button');button.id='field-tools';button.type='button';button.textContent='FIELD / T';button.onclick=tools;button.hidden=true;doc.body.append(button);}
  function draw(ctx,w,t){if(!live())return;setupUI();const st=s(),ep=e(),a=st.active,r=F.room(st),pref=p(),game=H.game();
    button.hidden=!!game.inDialog||!!game.paused;button.textContent='FIELD / '+key(pref.bindings.field);
    const card=root.document.getElementById('living-world-objective');if(card&&!status){status=root.document.createElement('div');status.id='field-status';card.append(status);}
    if(status){const h=H.A.cycle(st);const phase=h.task==='isolated'?'TASK PAUSED':h.task==='restoring'?'REPAIR WARNING':h.task==='diverted'?'WORK AT MOTOR':h.on?'ACTIVE':h.warning?'STARTING':'QUIET';status.textContent=(F.equipped(ep,a)?F.KITS[pref.kit].name+' · ':'')+(F.hazard(ep,a)?phase+(r.scanned?' · '+Math.ceil(h.seconds)+'s':'')+' · ':'')+(pref.damage==='gentle'?'Gentle combat · ':'')+(lastSaved?'Saved':'Save pending');}
    ctx.save();ctx.textAlign='center';ctx.font='11px monospace';
    for(const point of F.points(st,ep)){
      const x=point.x-w.cam;ctx.fillStyle='#183c41';ctx.fillRect(x-18,389,36,41);ctx.strokeStyle='#91c9c0';ctx.strokeRect(x-18,389,36,41);
      ctx.fillStyle='#b8ded0';ctx.fillText(point.x===620?'SCAN':point.x===780?'LIFT':'MOTOR',x,379);
      if(point.x===1430&&r.diversion>0){ctx.strokeStyle='#e7b67a';ctx.beginPath();ctx.arc(x,405,26+Math.sin(t/160)*3,0,Math.PI*2);ctx.stroke();}
      if(point.x===620&&r.isolation>0){ctx.fillStyle='#bde9bb';ctx.fillRect(x-11,396,22,4);}
    }
    for(const item of F.activities(st,ep)){const x=item.x-w.cam;ctx.fillStyle='#9b7952';ctx.fillRect(x-30,396,60,12);ctx.fillRect(x-24,408,5,22);ctx.fillRect(x+19,408,5,22);ctx.fillStyle='#dfc38c';ctx.fillText(item.label,x,377);}
    if(a.fieldcraft.moments.lighting||a.fieldcraft.moments.desk){const warm=a.fieldcraft.moments.lighting==='warm'||a.fieldcraft.moments.desk==='amber';ctx.fillStyle=warm?'#eec77c22':'#79d6c822';ctx.fillRect(420-w.cam,260,450,170);}
    if(r.detour){ctx.fillStyle='#e0bb77';ctx.fillText('SERVICE WALKWAY',540-w.cam,333);}
    const reduced=reducedMotion&&reducedMotion.matches;
    if(landing&&pref.motion&&!reduced){ctx.globalAlpha=1-landing.age/.28;ctx.strokeStyle='#b9d8c7';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(landing.x-w.cam,landing.y,9+landing.age*80,3,0,0,Math.PI*2);ctx.stroke();}
    ctx.restore();
  }
  function hidden(){scoreRequest++;if(button)button.hidden=true;if(score())score().stop();landing=null;previousHP=null;lastSaved=null;}
  const api={attach,loaded,tools,settings,nearby,handle,input,bindings,beforeStep,afterStep,incoming,redirectEnemy,draw,hidden,syncPlatforms,saved:()=>{lastSaved=Date.now();},failed:()=>{lastSaved=null;},keyLabel:key};
  root.TechOpsFieldcraftRuntime=api;
})(typeof globalThis!=='undefined'?globalThis:this);
