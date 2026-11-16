/* Optional, deterministic field systems. No story grants, timers, DOM or audio.
 * One world preference record; physical changes belong to one chapter/room. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;root.TechOpsFieldcraft=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const KITS=Object.freeze({
    survey:{name:'Survey kit',tools:['scan','isolate','overdrive'],description:'Read the cycle, then interrupt only the task circuit. Independent support stays on.'},
    route:{name:'Route kit',tools:['lift','decoy'],description:'Power an optional service platform or redirect a work routine. Watch where it goes.'},
    escort:{name:'Escort kit',tools:['scan','lift'],description:'Read the hazard and open a raised crossing. The group still needs the wide floor route.'}
  });
  const TOOLS=Object.freeze({
    scan:{name:'Read local cycle',x:620,description:'Reveal the current phase and its next transition. Observation does not establish consciousness or consent.'},
    isolate:{name:'Isolate task circuit',x:620,description:'After a scan: stop this task for 8 seconds. A 3-second repair warning follows; support remains powered.'},
    overdrive:{name:'Try a quick bypass',x:620,description:'A quiet cycle gives a short stop. A live or restarting cycle rejects the bypass and opens a service-walkway fallback.'},
    lift:{name:'Power service platform',x:780,description:'Raise a local crossing for the rest of this visit. It does not unlock story doors or move an escort for you.'},
    decoy:{name:'Start diversion motor',x:1430,description:'Redirect the local task for 10 seconds. The work zone moves to the motor; keep clear of it.'}
  });
  const KEY_ACTIONS=['punch','kick','grab','jump','dash','interact','field'];
  const DEFAULT_KEYS={punch:'KeyE',kick:'KeyJ',grab:'KeyG',jump:'Space',dash:'ShiftLeft',interact:'KeyF',field:'KeyT'};
  const ALLOWED_KEYS=['KeyE','KeyJ','KeyG','KeyF','KeyT','KeyQ','KeyR','KeyU','KeyI','KeyO','KeyP','KeyZ','KeyX','KeyV','KeyB','KeyN','Space','ShiftLeft'];
  const quietThemes=['home','studio','garage','shelter'];
  const assert=(ok,msg)=>{if(!ok)throw new Error(msg);};
  const bounded=(v,min,max)=>Number.isFinite(v)&&v>=min&&v<=max;
  const prefs=()=>({version:1,kit:'survey',timing:'standard',damage:'standard',text:1,motion:true,score:false,volume:.25,bindings:{...DEFAULT_KEYS}});
  const run=()=>({version:1,rooms:{},moments:{},last:null});
  function ensure(s){if(!s.fieldcraft)s.fieldcraft=prefs();if(s.active&&!s.active.fieldcraft)s.active.fieldcraft=run();return s.fieldcraft;}
  function validatePrefs(p){
    assert(p&&p.version===1&&KITS[p.kit],'Invalid field kit');
    assert(['standard','relaxed'].includes(p.timing)&&['standard','gentle'].includes(p.damage),'Invalid field assists');
    assert([1,1.15,1.3].includes(p.text)&&typeof p.motion==='boolean'&&typeof p.score==='boolean'&&bounded(p.volume,0,.6),'Invalid presentation settings');
    assert(p.bindings&&Object.keys(p.bindings).length===KEY_ACTIONS.length,'Invalid controls');
    const codes=KEY_ACTIONS.map(k=>p.bindings[k]);assert(codes.every(k=>ALLOWED_KEYS.includes(k))&&new Set(codes).size===codes.length,'Controls must be unique');
  }
  function validateRun(f,e){
    assert(f&&f.version===1&&f.rooms&&f.moments&&typeof f.rooms==='object'&&!Array.isArray(f.rooms)&&typeof f.moments==='object'&&!Array.isArray(f.moments),'Invalid field record');
    for(const [id,r] of Object.entries(f.rooms)){
      assert(e.rooms.some(x=>x.id===id),'Unknown field room');
      for(const k of ['scanned','lift','detour'])assert(typeof r[k]==='boolean','Invalid room condition');
      for(const k of ['isolation','diversion','restore','cooldown'])assert(bounded(r[k],0,60),'Invalid field clock');
      if(r.workX!==undefined)assert(bounded(r.workX,500,1500),'Invalid work position');
      assert(Number.isInteger(r.attempts)&&r.attempts>=0&&r.attempts<=100000,'Invalid recovery count');
    }
    const allowed=['lighting','phone','rhythm','desk'];
    assert(Object.keys(f.moments).every(k=>allowed.includes(k)),'Unknown quiet activity');
    for(const [k,v] of Object.entries(f.moments))assert(k==='rhythm'?Array.isArray(v)&&v.length<=16&&v.every(n=>Number.isInteger(n)&&n>=0&&n<4):['warm','cool','away','green','amber'].includes(v),'Invalid quiet activity');
    assert(f.last===null||typeof f.last==='string'&&f.last.length<=240,'Invalid local recap');
  }
  function room(s){ensure(s);const a=s.active;assert(a,'Enter a chapter first');return a.fieldcraft.rooms[a.room]||(a.fieldcraft.rooms[a.room]={scanned:false,lift:false,detour:false,isolation:0,diversion:0,restore:0,cooldown:0,attempts:0,workX:1070});}
  const isQuiet=(e,a)=>quietThemes.includes(e.rooms.find(r=>r.id===a.room).theme)&&(!e.danger||e.mode==='rest');
  const equipped=(e,a)=>!e.vehicle&&['mike','iona','felicia','k'].includes(a.actor);
  const hazard=(e,a)=>!a.finished&&!!e.danger&&['horror','rescue','stealth'].includes(e.mode);
  function available(s,e){const a=s.active;return !!a&&equipped(e,a)&&!isQuiet(e,a);}
  function relevant(s,e,id){return id==='scan'||id==='lift'||(id==='isolate'||id==='overdrive'?hazard(e,s.active):!!e.danger);}
  function points(s,e){if(!available(s,e))return [];const p=ensure(s);return [...new Set(KITS[p.kit].tools.filter(k=>relevant(s,e,k)).map(k=>TOOLS[k].x))].map(x=>({x,y:413,label:x===620?'Local task panel':x===780?'Service platform':'Diversion motor'}));}
  function canChange(s,e,frame){return isQuiet(e,s.active)||((frame.x<210||frame.x>1500)&&!(frame.enemies||[]).some(n=>n.alive&&Math.abs(n.x-frame.x)<340));}
  function equip(s,e,id,frame){assert(KITS[id],'Unknown field kit');assert(equipped(e,s.active),'This viewpoint does not carry field tools');assert(canChange(s,e,frame),'Change kits in a quiet room or at a clear room entry.');ensure(s).kit=id;return KITS[id].name+' equipped.';}
  function bind(s,action,code){const p=ensure(s);assert(KEY_ACTIONS.includes(action)&&ALLOWED_KEYS.includes(code),'Unsupported control');const other=KEY_ACTIONS.find(k=>p.bindings[k]===code);if(other)p.bindings[other]=p.bindings[action];p.bindings[action]=code;validatePrefs(p);}
  function use(s,e,id,baseCycle,frame){
    const a=s.active,p=ensure(s),r=room(s),tool=TOOLS[id];
    assert(tool&&available(s,e)&&KITS[p.kit].tools.includes(id)&&relevant(s,e,id),'This tool is not in your current kit.');
    assert(Math.abs(frame.x+11-tool.x)<=96&&Math.abs(frame.y+17-413)<=96,'Approach the marked '+(id==='lift'?'service platform':id==='decoy'?'diversion motor':'local panel')+'.');
    assert(!(frame.enemies||[]).some(n=>n.alive&&Math.abs(n.x-frame.x)<140),'Create space before using a tool.');
    let text;
    if(id==='scan'){r.scanned=true;text=hazard(e,a)?'Local cycle read. The field HUD now shows the phase and next transition.':'Local route inspection recorded. Review the current route conditions in Field equipment; inspection does not open a locked door.';}
    else if(id==='lift'){r.lift=true;text='Service platform powered. The raised route is available; escort handoffs still require the whole group.';}
    else {
      assert(r.cooldown<=0&&r.restore<=0,'The task circuit is resetting. Wait for the repair warning to finish.');
      if(id==='isolate'){assert(r.scanned,'Read the local cycle before isolating its task circuit.');r.isolation=8;r.diversion=0;r.cooldown=14;text='Task circuit isolated for 8 seconds. Independent support remains powered. Expect a repair warning before restart.';}
      if(id==='decoy'){r.diversion=10;r.isolation=0;r.cooldown=14;text='Routine redirected to the motor for 10 seconds. The far end is now a work zone.';}
      if(id==='overdrive'){
        if(baseCycle.on||baseCycle.warning){r.detour=true;r.restore=4;r.cooldown=10;r.attempts=Math.min(100000,r.attempts+1);text='Bypass rejected during a live cycle. The service walkway is available above the task; objectives and independent support are unchanged.';}
        else{r.isolation=4;r.diversion=0;r.cooldown=12;text='Quick bypass accepted for 4 seconds. A restart warning follows.';}
      }
    }
    a.fieldcraft.last=text;return text;
  }
  function tick(s,dt,base){if(!s.active)return;const r=room(s);dt=Math.min(.05,Math.max(0,Number(dt)||0));const was=r.isolation;
    for(const key of ['isolation','diversion','restore','cooldown'])r[key]=Math.max(0,r[key]-dt);
    if(was>0&&r.isolation<=0)r.restore=3;
    if(!Number.isFinite(r.workX))r.workX=1070;
    const target=r.restore>0?620:r.diversion>0?1430:base?base.x:1070;
    if(r.isolation<=0)r.workX+=Math.sign(target-r.workX)*Math.min(Math.abs(target-r.workX),120*dt);
  }
  function cycle(s,e,base){
    const r=room(s),p=ensure(s),h={...base,x:Number.isFinite(r.workX)?r.workX:base.x,task:'working',seconds:base.phase<=4?4-base.phase:base.phase<=5?5-base.phase:base.phase<8.5?8.5-base.phase:14-base.phase};
    if(p.timing==='relaxed'&&h.on&&h.phase<6){h.on=false;h.warning=true;h.seconds=6-h.phase;}
    if(r.isolation>0)return {...h,on:false,warning:false,task:'isolated',seconds:r.isolation};
    if(r.restore>0)return {...h,on:false,warning:true,task:'restoring',seconds:r.restore};
    if(r.diversion>0)return {...h,task:'diverted',seconds:r.diversion};
    return h;
  }
  function platforms(s){const r=room(s),p=[];if(r.lift)p.push({x:735,y:365,w:150,h:14,_fieldcraft:true},{x:880,y:305,w:280,h:14,_fieldcraft:true},{x:1160,y:365,w:150,h:14,_fieldcraft:true});if(r.detour)p.push({x:430,y:350,w:220,h:14,_fieldcraft:true},{x:655,y:290,w:210,h:14,_fieldcraft:true});return p;}
  function recover(s,e,walkway){const r=room(s);assert(!walkway||available(s,e),'No service walkway in this room');r.attempts=Math.min(100000,r.attempts+1);if(walkway)r.detour=true;s.active.fieldcraft.last=walkway?'Recovered at the service walkway. Rejoin the group at the entry before continuing.':'Recovered at this room’s entry. Completed work remains recorded.';return walkway?{x:460,y:316}:{x:150,y:396};}
  function activities(s,e){
    const a=s.active;if(!a)return [];
    if(e.id==='home'&&a.room==='house'&&a.step>0)return [{id:'lighting',label:'Settle into the room',x:680,text:'Choose a lamp and stay for a while. Nothing here needs to be earned.'}];
    if(e.id==='waldo_visit'&&a.room==='garage'&&s.flags.waldo_visit_received)return [{id:'phone',label:'Put the work phone away',x:1040,text:'Waldo leaves space beside the bench. Mike turns the work phone face down. There is no new job waiting underneath this moment.'}];
    if(e.id==='iona_local'&&a.room==='room'&&a.step>=4)return [{id:'rhythm',label:'Stay for a rehearsal',x:960,text:'Iona stays at the drums. Tap a pattern; keep the imperfect take or begin again. This is her time.'}];
    if(e.id==='archive'&&a.room==='room')return [{id:'desk',label:'Arrange the working desk',x:680,text:'K chooses how the desk looks today. A present preference does not authenticate an old memory.'}];
    return [];
  }
  function moment(s,e,id,value,frame){const item=activities(s,e).find(x=>x.id===id);assert(item&&Math.abs(frame.x+11-item.x)<96&&Math.abs(frame.y+17-413)<96,'Approach the quiet activity.');ensure(s);const f=s.active.fieldcraft;if(id==='rhythm'){assert(Array.isArray(value)&&value.length<=16&&value.every(n=>Number.isInteger(n)&&n>=0&&n<4),'Invalid rhythm');f.moments[id]=value.slice();}else{assert(({lighting:['warm','cool'],phone:['away'],desk:['green','amber']})[id].includes(value),'Invalid activity choice');f.moments[id]=value;}f.last=id==='rhythm'?'Kept a private rehearsal pattern.':item.text;return f.last;}
  function recap(s,e){const a=s.active,parent=e.goals[a.step],g=parent&&parent.tasks&&a.task?parent.tasks.find(t=>t.id===a.task):parent,loc=e.rooms.find(r=>r.id===a.room);return {actor:a.actor,chapter:e.title,place:loc.name,next:g?g.label:'Quiet aftermath',last:a.fieldcraft&&a.fieldcraft.last||null,record:(s.knowledge[a.actor]||[]).slice(-1)[0]||null,escort:a.escort?a.escort.name:null};}
  /* Called only by the existing physics owner. Timers are simulation seconds. */
  function jump(n,dt,pressed,locked,maxJumps=2){
    const f=n._fieldFeel||(n._fieldFeel={held:false,buffer:0,grace:0});dt=Math.min(.05,Math.max(0,Number(dt)||0));
    if(locked){f.buffer=0;f.held=!!pressed;f.grace=0;return false;}
    f.buffer=Math.max(0,f.buffer-dt);f.grace=n.onGround?.09:Math.max(0,f.grace-dt);
    if(pressed&&!f.held)f.buffer=.14;f.held=!!pressed;
    if(f.buffer<=0)return false;
    if(n.onGround||f.grace>0){n.vy=-10.4;n.onGround=false;n.jumps=1;}
    else if(n.jumps<Math.min(4,Math.max(2,maxJumps))){n.vy=-8.8;n.jumps=Math.max(1,n.jumps)+1;n.flip=16;}
    else return false;
    f.buffer=0;f.grace=0;return true;
  }
  return {KITS,TOOLS,KEY_ACTIONS,DEFAULT_KEYS,ALLOWED_KEYS,prefs,run,ensure,validatePrefs,validateRun,room,isQuiet,equipped,hazard,available,relevant,points,canChange,equip,bind,use,tick,cycle,platforms,recover,activities,moment,recap,jump};
});
