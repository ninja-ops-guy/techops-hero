/* Living Archive: physical, correctable traces of this run's work.
 * Rescue/Siege own facts and outcomes. This module owns optional posted route
 * marks and the player's last-read copies, inside the existing mission save.
 * It never reads K's notebook, restores memory, or awards safe residents. */
(function(root,factory){
  var node=typeof module==='object'&&module.exports;
  var api=factory(node?require('./campaign_low_quarter_scenario.js'):root.TechOpsLowQuarterScenario);
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.TechOpsLivingArchive=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Content){
  'use strict';
  var SCHEMA=1,SECTORS=['approaches','services','shelters','departure'],PLACES=SECTORS.concat(['receiving']);
  function copy(v){return JSON.parse(JSON.stringify(v));}
  function assert(v,message){if(!v)throw Error(message);}
  function latest(list,predicate){for(var i=list.length-1;i>=0;i--)if(predicate(list[i]))return list[i];return null;}
  function local(state){return state.lowQuarterMission;}
  function events(state){return state.lowQuarter?state.lowQuarter.events:[];}
  function data(state){var m=local(state);return m&&m.archive||{schema:SCHEMA,runId:m&&m.runId,marks:[],readings:{}};}
  function source(state,route){return latest(events(state),function(e){return e.type==='route'&&e.route===route;});}
  function currentMark(state,sector){return latest(data(state).marks,function(mark){return mark.sector===sector;});}
  function preferredSource(state,sector){var primary=source(state,sector+'_primary');return primary&&primary.open?primary:source(state,sector+'_alternative');}
  function status(state,sector){
    var m=local(state),mark=currentMark(state,sector),route=mark&&source(state,mark.route);
    var health=latest(events(state),function(e){return e.type==='sector'&&e.sector===sector;});
    if(!mark)return {ready:false,reason:'No local route marks posted',mark:null};
    if(!route||!route.open||route.id!==mark.source)return {ready:false,reason:'Route changed; correct the old directions',mark:copy(mark)};
    if(!m.services[sector]||!m.staffed[sector]||!m.warned[sector]||!health||!health.habitable||!health.contained)return {ready:false,reason:'Wait for local care, services and containment',mark:copy(mark)};
    var definition=Content.definition.rescue,area=definition.sectors.find(function(v){return v.id===sector;});
    var positions=Object.create(null);events(state).forEach(function(e){if(e.type==='unit')positions[e.unit]=e;});
    var units=definition.units.map(function(unit){var e=positions[unit.id];return e&&e.ready&&e.sector===sector?{strength:unit.strength,post:e.post}:null;}).filter(Boolean);
    if(units.reduce(function(n,u){return n+u.strength;},0)<area.requiredStrength||!area.posts.every(function(post){return units.some(function(u){return u.post===post;});}))return {ready:false,reason:'Wait for local defenders to reach every required post',mark:copy(mark)};
    return {ready:true,reason:'Current local directions to the loading gate',mark:copy(mark)};
  }
  function canPost(state,sector){
    var m=local(state),e=preferredSource(state,sector),mark=currentMark(state,sector);
    return !!(m&&state.lowQuarter&&state.lowQuarter.phase==='active'&&m.player.sector===sector&&SECTORS.includes(sector)&&m.routeTested[sector]&&e&&e.open&&(!mark||mark.source!==e.id));
  }
  function post(state,sector){
    var m=local(state);assert(canPost(state,sector),'Test the local lanes and correct directions in person');
    assert(Math.abs(m.player.x-1640)<65&&!m.travel,'Reach the physical route-mark station');
    var a=copy(data(state)),e=preferredSource(state,sector);
    assert(a.marks.length<64,'Route-mark history is full; preserve existing records');
    a.marks.push({id:'mark_'+(a.marks.length+1),sector:sector,route:e.route,source:e.id,witness:e.actor,by:'k_red_el',at:m.elapsed});
    return a;
  }
  function canFollow(state,id,knownStatus){
    var m=local(state),r=m&&m.residents[id],person=Content.definition.rescue.people.find(function(p){return p.id===id;});
    var consent=latest(events(state),function(e){return e.type==='consent'&&e.person===id;});
    if(!r||!person||r.sector!==person.sector||m.choices[id]!=='transport'||!consent||consent.choice!=='transport'||r.status!=='home'||person.care!=='ordinary care')return false;
    var guide=knownStatus||status(state,r.sector);if(!guide.ready)return false;
    // A mark supplies directions, not protection. A live threat blocks the
    // remaining physical corridor even when K is working in another sector.
    return !m.enemies.some(function(e){return e.hp>0&&!e.contained&&e.sector===r.sector&&e.x>=Math.min(r.x,1500)-100&&e.x<=Math.max(r.x,1500)+100;});
  }
  function card(id,title,body,refs,state){return {id:id,title:title,body:body,sources:refs.map(function(e){return {id:e.id,actor:e.actor||null,tick:e.tick};}),observedAt:local(state).elapsed};}
  function inspect(state,sector){
    var m=local(state),out=[],ev=events(state);if(!m||!state.lowQuarter||!PLACES.includes(sector))return out;
    if(sector==='receiving'){
      var received=ev.filter(function(e){return e.type==='arrive';});
      if(received.length)out.push(card('receiving_care','The receiving register','Local receivers accepted '+received.length+' carrier handoffs. Departure alone never established care. Each arrival remains a separate record.',received,state));
      return out;
    }
    var repairs=ev.filter(function(e){return e.type==='sector'&&e.sector===sector;});
    if(repairs.length){var current=repairs[repairs.length-1];out.push(card(sector+'_service','The repair tag',current.habitable&&current.contained?'The local engineer has rechecked working services and containment. Earlier damage remains in the record.':'The earlier repair happened. Current damage has made its assurance stale; recheck services before relying on it.',repairs,state));}
    var routes=ev.filter(function(e){return e.type==='route'&&e.route.indexOf(sector+'_')===0;});
    if(routes.length){var guide=status(state,sector),marks=data(state).marks.filter(function(mark){return mark.sector===sector;}),both=['primary','alternative'].every(function(kind){var e=source(state,sector+'_'+kind);return e&&e.open;});out.push(card(sector+'_route','Directions someone can use',marks.length?'K left '+marks.length+' version'+(marks.length===1?'':'s')+' of the local directions. '+guide.reason+'. A willing independent walker can follow a current mark; an attendant request still needs an escort.':both?'Both local lanes were physically checked. Leave directions at the gate so consenting independent walkers can follow while K helps elsewhere.':'A local lane record exists. Check the current lanes before relying on a direction.',routes,state));}
    var care=ev.filter(function(e){return e.type==='shelter'&&e.person.indexOf('lq_'+String.fromCharCode(97+SECTORS.indexOf(sector))+'_')===0;});
    if(care.length)out.push(card(sector+'_care','People accepted care','The local witness recorded '+new Set(care.map(function(e){return e.person;})).size+' accepted shelter placements. Continued safety still depends on services and containment.',care,state));
    var declined=ev.filter(function(e){return e.type==='consent'&&e.choice==='declined'&&e.person.indexOf('lq_'+String.fromCharCode(97+SECTORS.indexOf(sector))+'_')===0;});
    if(declined.length)out.push(card(sector+'_choice','A choice stayed theirs','A refusal was recorded here. A useful mark does not supply consent, and a later choice does not erase the earlier refusal.',declined,state));
    if(sector==='approaches'){
      var checks=ev.filter(function(e){return e.type==='check'&&['independent_command_tested','local_fallback_tested','risky_order_challenged'].includes(e.check);});
      if(checks.length)out.push(card('local_authority','People kept the means to act','The local test retained people’s ability to acknowledge, refuse or continue an order under this ending. This record is limited to the test actually performed.',checks,state));
      var sg=state.lowQuarter.siege.events,assimilated=sg.filter(function(e){return e.type==='assimilate';}),cut=sg.filter(function(e){return e.type==='relay_cut';});
      if(assimilated.length)out.push(card('chorus_fragment','A route taken from someone','The witnessed assimilation exposed the picket’s bounded tactical knowledge. It did not reveal a person’s complete memory or the new defense plan. Local acquired knowledge can persist after relay interruption.',assimilated.concat(cut),state));
      else if(cut.length)out.push(card('relay_cut','The interrupted relay','Forward traffic was interrupted. This observation establishes a link failure; it does not establish a cure or erase already issued attacks.',cut,state));
    }
    return out;
  }
  function read(state,sector){
    var m=local(state);assert(m&&m.player.sector===sector&&!m.travel&&Math.abs(m.player.x-570)<65,'Read the records at their physical local station');
    var a=copy(data(state));a.readings[sector]=inspect(state,sector);return a;
  }
  function remembered(state){var a=data(state);return PLACES.flatMap(function(k){return a.readings[k]||[];}).map(copy);}
  function validate(state){
    var m=local(state),a=m&&m.archive;if(!a)return {valid:true};
    if(a.schema!==SCHEMA)return {valid:true,continuationBlocked:true,reason:'Living Archive checkpoint version unavailable; preserve original save'};
    try{
      assert(a.runId===m.runId&&a.runId===state.lowQuarter.runId,'Archive belongs to a different mission run');
      assert(Array.isArray(a.marks)&&a.marks.length<=64,'Invalid route-mark history');
      var lastAt=-1;a.marks.forEach(function(mark,i){
        var e=events(state).find(function(event){return event.id===mark.source;});
        assert(mark.id==='mark_'+(i+1)&&SECTORS.includes(mark.sector)&&mark.by==='k_red_el','Invalid route-mark identity');
        assert(e&&e.type==='route'&&e.open&&e.route===mark.route&&e.actor===mark.witness&&mark.route.indexOf(mark.sector+'_')===0,'Route mark lacks its physical source');
        assert(Number.isFinite(mark.at)&&mark.at>=lastAt&&mark.at<=m.elapsed,'Invalid route-mark time');lastAt=mark.at;
      });
      assert(a.readings&&typeof a.readings==='object'&&!Array.isArray(a.readings),'Invalid local readings');
      var sourceById=Object.create(null);events(state).concat(state.lowQuarter.siege.events).forEach(function(e){sourceById[e.id]=e;});
      Object.keys(a.readings).forEach(function(sector){assert(PLACES.includes(sector)&&Array.isArray(a.readings[sector])&&a.readings[sector].length<=8,'Invalid local reading scope');a.readings[sector].forEach(function(c){
        assert(typeof c.id==='string'&&typeof c.title==='string'&&c.title.length<=160&&typeof c.body==='string'&&c.body.length<=1400&&Number.isFinite(c.observedAt)&&c.observedAt>=0&&c.observedAt<=m.elapsed,'Invalid local reading');
        assert(Array.isArray(c.sources)&&c.sources.length<=1024&&new Set(c.sources.map(function(ref){return ref.id;})).size===c.sources.length&&c.sources.every(function(ref){var e=sourceById[ref.id];return e&&e.actor===(ref.actor||undefined)&&e.tick===ref.tick;}),'Reading source is missing');
      });});
      return {valid:true};
    }catch(e){return {valid:false,errors:[e.message]};}
  }
  return {SCHEMA:SCHEMA,status:status,canPost:canPost,post:post,canFollow:canFollow,currentMark:currentMark,inspect:inspect,read:read,remembered:remembered,validate:validate};
});
