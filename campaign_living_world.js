/* Pure expedition state. The browser bridge owns persistence and input. */
(function(root,factory){const api=factory(typeof module==='object'?require('./campaign_living_world_data.js'):root.TechOpsLivingWorldData,typeof module==='object'?require('./campaign_fieldcraft.js'):root.TechOpsFieldcraft);if(typeof module==='object')module.exports=api;root.TechOpsLivingWorld=api;})(typeof globalThis!=='undefined'?globalThis:this,function(Data,F){
  'use strict';
  const clone=x=>JSON.parse(JSON.stringify(x));
  const assert=(ok,message)=>{if(!ok)throw new Error(message);};
  const episode=id=>Data.episodes.find(e=>e.id===id);
  const initial=scope=>({version:1,scope:scope==='campaign'?'campaign':'standalone',done:[],flags:{},choices:{},side:{},knowledge:{},runs:{},active:null});
  const active=s=>s&&s.active;
  function validate(s){
    assert(s&&s.version===1&&['campaign','standalone'].includes(s.scope),'Unsupported expedition save');
    assert(Array.isArray(s.done)&&s.done.every(id=>episode(id))&&new Set(s.done).size===s.done.length,'Invalid completed chapters');
    for(const key of ['flags','choices','side','knowledge','runs'])assert(s[key]&&typeof s[key]==='object'&&!Array.isArray(s[key]),'Invalid '+key);
    assert(Object.keys(s.flags).length<200&&Object.values(s.flags).every(x=>x===true),'Invalid world consequences');
    for(const [id,n] of Object.entries(s.side)){const q=Data.sidequests.find(q=>q.id===id);assert(q&&Number.isInteger(n)&&n>=0&&n<=q.steps.length,'Invalid side quest');}
    for(const value of Object.values(s.knowledge))assert(Array.isArray(value)&&value.length<200&&value.every(t=>typeof t==='string'&&t.length<4000),'Invalid viewpoint record');
    for(const [id,run] of Object.entries(s.runs)){assert(id===run.id,'Invalid saved chapter');validateRun(run);}
    if(s.fieldcraft)F.validatePrefs(s.fieldcraft);
    if(s.active)validateRun(s.active);
    return s;
  }
  function validateRun(a){
    const e=a&&episode(a.id);assert(e&&e.rooms.some(r=>r.id===a.room),'Unknown active location');
    assert((e.actors||[e.actor]).includes(a.actor),'Unknown viewpoint');
    assert(Number.isInteger(a.step)&&a.step>=0&&a.step<=e.goals.length,'Invalid objective');
    assert(typeof a.finished==='boolean'&&a.finished===(a.step===e.goals.length)&&typeof a.holding==='boolean','Invalid completion state');
    assert(a.variant===0||a.variant===1,'Invalid encounter variation');
    assert(Number.isFinite(a.x)&&a.x>=0&&a.x<=1760&&Number.isFinite(a.y)&&a.y>=-1000&&a.y<=430,'Invalid position');
    assert(Number.isFinite(a.elapsed)&&a.elapsed>=0&&Number.isFinite(a.hold)&&a.hold>=0,'Invalid clock');
    assert(a.encounters&&typeof a.encounters==='object'&&!Array.isArray(a.encounters),'Invalid encounter state');
    for(const v of Object.values(a.encounters))assert(v&&Number.isFinite(v.hp)&&v.hp>=0&&typeof v.cleared==='boolean','Invalid saved encounter');
    if(a.fieldcraft)F.validateRun(a.fieldcraft,e);
    const parent=e.goals[a.step];
    if(a.sceneIndex!==undefined)assert(Number.isInteger(a.sceneIndex)&&a.sceneIndex>=0&&(!parent||a.sceneIndex<(parent.lines?parent.lines.length:1)),'Invalid dialogue cursor');
    if(a.task)assert(parent&&parent.tasks&&parent.tasks.some(t=>t.id===a.task),'Invalid selected call');
    if(a.tasks!==undefined)assert(Array.isArray(a.tasks)&&new Set(a.tasks).size===a.tasks.length&&a.tasks.every(id=>parent&&parent.tasks&&parent.tasks.some(t=>t.id===id))&&!a.tasks.includes(a.task),'Invalid completed calls');
    if(a.escort)assert(typeof a.escort.id==='string'&&typeof a.escort.name==='string'&&e.rooms.some(r=>r.id===a.escort.room)&&Number.isFinite(a.escort.x)&&a.escort.x>=0&&a.escort.x<=1800,'Invalid escort');
  }
  function gate(s,id,native){
    const e=episode(id);if(!e)return {open:false,reason:'Unknown chapter'};
    if(e.requiresVisit&&(!s.flags.waldo_invited||!s.flags.waldo_visit_received))return {open:false,reason:'Hear Waldo’s later porch invitation, then visit him at the garage.'};
    const missing=s.done.includes(id)?[]:e.after.filter(id=>!s.done.includes(id));
    if(missing.length)return {open:false,reason:'Complete '+episode(missing[0]).title+' first.'};
    if(s.scope==='campaign'){
      const facts=native&&native.facts||{};
      const needs=e.native.filter(id=>facts[id]!==true);
      if(needs.length)return {open:false,reason:'Continue the main story: '+needs.map(x=>x.replace(/_/g,' ')).join(', ')+'.'};
      if(e.minDay&&(!(native.day>=e.minDay)))return {open:false,reason:'Felicia’s private branch begins around Day '+e.minDay+'.'};
    }
    return {open:true,reason:s.done.includes(id)?'Replay a completed chapter.':'Ready'};
  }
  function start(s,id,native,restart){
    validate(s);const g=gate(s,id,native);assert(g.open,g.reason);
    for(const chapter of ['hangar','fracture']){const r=s.active&&s.active.id===chapter?s.active:s.runs[chapter];if(s.done.includes(chapter)||r&&r.step>1)s.flags[chapter+'_local_support']=true;}
    if(s.active&&s.active.id===id&&!restart){F.ensure(s);return s.active;}
    if(s.active&&s.active.id!==id)leave(s);
    const e=episode(id),old=s.runs[id];
    s.active=!restart&&old&&!old.finished?clone(old):{id,room:e.rooms[0].id,actor:e.actor,step:0,x:150,y:396,elapsed:0,hold:0,holding:false,escort:null,encounters:{},variant:old?(old.variant+1)%2:(Data.episodes.indexOf(e)%2),finished:false};
    F.ensure(s);
    return s.active;
  }
  function parentGoal(s){const a=active(s);return a&&episode(a.id).goals[a.step]||null;}
  function current(s){const g=parentGoal(s),a=s.active;return g&&g.tasks&&a.task?g.tasks.find(t=>t.id===a.task)||g:g;}
  function holdSeconds(s,g){return g.assistChoice&&s.choices[g.assistChoice[0]]===g.assistChoice[1]?g.assistChoice[2]:g.seconds;}
  function sceneLine(s){const g=current(s);return g&&g.lines&&g.lines[s.active.sceneIndex||0];}
  function sideLocation(s,q){return q.stages?q.stages[Math.min(s.side[q.id]||0,q.stages.length-1)]:{episode:q.episode,room:q.room,x:q.points&&q.points[s.side[q.id]||0]||q.x};}
  function consequences(s){const rows=[];for(const q of Data.sidequests)if(s.flags[q.reward])rows.push(q.title+': '+q.steps.at(-1)[1]);return rows.length?rows.join('\n\n'):'The receiving desk is open again. Optional work can still be revisited; nobody’s missing side quest erases the main rescue.';}

  function record(s,text){const a=s.active,k=a.actor;s.knowledge[k]=s.knowledge[k]||[];if(!s.knowledge[k].includes(text))s.knowledge[k].push(text);}
  function advance(s,choice){
    const a=s.active,e=episode(a.id),g=current(s);assert(g,'No current objective');
    (g.sets||[]).forEach(f=>s.flags[f]=true);
    if(g.choiceKey)s.choices[g.choiceKey]=choice;
    record(s,g.kind==='consequence'?consequences(s):g.text);a.hold=0;a.holding=false;a.sceneIndex=0;
    const parent=parentGoal(s);
    if(parent.tasks&&a.task){
      a.tasks=a.tasks||[];a.tasks.push(a.task);a.task=null;
      if(a.tasks.length<parent.tasks.length)return {ok:true,advanced:true,text:g.text};
      a.tasks=[];
    }
    a.step++;
    if(a.step===e.goals.length){a.finished=true;if(!s.done.includes(e.id))s.done.push(e.id);s.runs[e.id]=clone(a);}
    return {ok:true,advanced:true,finished:a.finished,text:a.finished?e.ending:g.text};
  }
  function interact(s,choice){
    validate(s);const a=s.active,g=current(s);assert(a&&g,'No active objective');
    if(a.room!==g.room||Math.abs(a.x+11-g.x)>92||Math.abs(a.y+17-g.y)>96)return {ok:false,text:'Move close to '+g.label+'.'};
    if(g.actor&&g.actor!==a.actor)return {ok:false,text:'This action belongs to '+g.actor+'. Switch operator at the field controls.'};
    if(g.requires&&g.requires.some(f=>!s.flags[f]))return {ok:false,text:'Complete the local support and receiving checks first.'};
    if(g.kind==='dispatch'){
      const task=g.tasks.find(t=>t.id===choice);if(!task||(a.tasks||[]).includes(choice))return {ok:false,choose:true,text:'Choose an unfinished call.'};
      a.task=choice;if(g.choiceKey&&!s.choices[g.choiceKey])s.choices[g.choiceKey]=choice;
      return {ok:true,advanced:true,text:task.text};
    }
    if(g.kind==='scene'){
      a.sceneIndex=(a.sceneIndex||0)+1;
      if(a.sceneIndex<g.lines.length)return {ok:true,scene:true,text:g.lines[a.sceneIndex][1]};
    }
    if(g.kind==='hold'){a.holding=true;return {ok:true,holding:true,text:'Stay beside the station. Movement or damage pauses work.'};}
    if(g.options){const option=g.options.find(o=>o[0]===choice);if(!option)return {ok:false,choose:true,text:g.text};if(g.answer&&choice!==g.answer)return {ok:false,text:option[2]};const r=advance(s,choice);r.text=option[2];return r;}
    if(g.kind==='escort'){a.escort={id:g.escort,name:g.escortName,room:a.room,x:a.x-45};return advance(s);}
    if(g.kind==='handoff'){
      if(!a.escort||a.escort.room!==a.room||Math.abs(a.escort.x-g.x)>135)return {ok:false,text:'Wait for the whole group to reach the receiving point.'};
      record(s,'Receiving person confirmed '+a.escort.name+'.');a.escort=null;
    }
    return advance(s);
  }
  function routes(s){const a=s.active,e=episode(a.id);return e.routes.filter(r=>r.from===a.room||r.to===a.room).map(r=>{
    const to=r.from===a.room?r.to:r.from;let reason='';
    if(r.requires&&!s.flags[r.requires])reason=r.requires==='never_open'?'Physically blocked despite the displayed route.':'This route has not been established.';
    if(r.choice&&s.choices[r.choice[0]]!==r.choice[1])reason='This earlier response did not establish the shortcut.';
    if(r.actor&&r.actor!==a.actor)reason='Switch to '+r.actor+' at the field controls.';
    if(r.power&&!s.flags[r.power])reason='Local support is not ready.';
    if(r.width==='dog'&&!['katrin','manchez'].includes(a.actor))reason='Only the dogs fit this passage.';
    if(r.width==='person'&&(e.vehicle||a.escort))reason='The group or transport needs the wide route.';
    if(a.escort&&(a.escort.room!==a.room||Math.abs(a.escort.x-a.x)>140))reason='Wait for your group before changing rooms.';
    return Object.assign({},r,{to,open:!reason,reason,status:reason?'blocked':s.flags['route_'+e.id+'_'+[r.from,r.to].sort().join('_')]?'verified':r.reported});
  });}
  function travel(s,to){
    const a=s.active,r=routes(s).find(r=>r.to===to);assert(r,'No adjacent route');assert(r.open,r.reason);assert(a.x<210||a.x>1470,'Reach a marked room exit first');
    s.flags['route_'+a.id+'_'+[r.from,r.to].sort().join('_')]=true;
    a.room=to;a.x=170;a.y=396;a.hold=0;a.holding=false;if(a.escort){a.escort.room=to;a.escort.x=125;}
    return a;
  }
  function tick(s,dt,frame){
    const a=s.active;if(!a||a.finished||frame.paused)return {changed:false};
    dt=Math.min(.05,Math.max(0,Number(dt)||0));a.elapsed+=dt;F.tick(s,dt,baseCycle(s));
    a.x=Math.max(0,Math.min(1760,frame.x));a.y=Math.max(-1000,Math.min(430,frame.y));
    if(a.escort&&a.escort.room===a.room){const dx=a.x-45-a.escort.x;if(Math.abs(dx)>12&&Math.abs(dx)<300)a.escort.x+=Math.sign(dx)*Math.min(Math.abs(dx),95*dt);}
    const g=current(s);if(!a.holding||!g||g.kind!=='hold')return {changed:false};
    const near=g.room===a.room&&Math.abs(a.x+11-g.x)<=92&&Math.abs(a.y+17-g.y)<=96;
    if(!near||frame.hurt||Math.abs(frame.vx||0)>.6){a.holding=false;if(g.observeCycle)a.hold=0;return {changed:true,paused:true};}
    a.hold+=dt;if(a.hold>=holdSeconds(s,g))return Object.assign(advance(s),{changed:true});
    return {changed:false};
  }
  function switchActor(s){const a=s.active,e=episode(a.id),actors=e.actors||[e.actor];assert(actors.length>1,'This chapter has one viewpoint');a.actor=actors[(actors.indexOf(a.actor)+1)%actors.length];a.holding=false;if(e.remoteRooms){a.room=a.actor==='iona'?'iona':'earth';a.x=150;a.y=396;}return a.actor;}
  function sidequest(s,id){
    const q=Data.sidequests.find(q=>q.id===id),a=s.active;assert(q&&a,'Unknown side quest');
    const loc=sideLocation(s,q),step=s.side[id]||0;
    assert(loc.episode===a.id&&loc.room===a.room&&Math.abs(a.x+11-loc.x)<95&&Math.abs(a.y+17-413)<96,'Approach the person or object first');
    if(step>=q.steps.length)return {complete:true,text:'This shared moment is already part of the world.'};
    s.side[id]=step+1;if(s.side[id]===q.steps.length)s.flags[q.reward]=true;
    record(s,q.steps[step][1]);return {complete:s.side[id]===q.steps.length,text:q.steps[step][1]};
  }
  function leave(s){if(!s.active)return false;s.active.holding=false;s.runs[s.active.id]=clone(s.active);s.active=null;return true;}
  function retry(s){const a=s.active;assert(a,'No active chapter');a.x=150;a.y=396;a.holding=false;a.hold=0;if(a.escort){a.escort.room=a.room;a.escort.x=105;}return a;}
  function baseCycle(s){const a=s.active,e=episode(a.id),room=e.rooms.findIndex(r=>r.id===a.room),phase=(a.elapsed+room*2+a.variant*3)%10;return {on:phase>5&&phase<8.5,warning:phase>4&&phase<=5,x:1070+Math.sin(phase)*90,phase};}
  function cycle(s){return F.cycle(s,episode(s.active.id),baseCycle(s));}
  function facts(c){const f=Object.assign({},c&&c.flags||{},c&&c.story&&c.story.facts||{});if(f.tuesday_morning_reached)f.tuesday_morning=true;return {facts:f,day:c&&c.campaign&&c.campaign.day||0};}
  function validateData(){
    const seen=new Set();for(const e of Data.episodes){assert(!seen.has(e.id),'Duplicate episode');for(const p of e.after)assert(seen.has(p),'Out-of-order chapter');seen.add(e.id);const rooms=new Set(e.rooms.map(r=>r.id));assert(rooms.size===e.rooms.length,'Duplicate room');for(const g of e.goals.flatMap(g=>[g,...g.tasks||[]])){assert(rooms.has(g.room)&&g.x>200&&g.x<1500,'Unreachable goal');assert(!g.options||!g.answer||g.options.some(o=>o[0]===g.answer),'Missing supported choice');}for(const r of e.routes)assert(rooms.has(r.from)&&rooms.has(r.to),'Unknown route');assert(e.goals.at(-1).kind==='finish','Missing authored ending');}
    return true;
  }
  validateData();
  return {VERSION:1,Data,clone,initial,validate,episode,gate,start,current,holdSeconds,sceneLine,sideLocation,consequences,interact,routes,travel,tick,switchActor,sidequest,leave,retry,cycle,baseCycle,Fieldcraft:F,facts};
});
