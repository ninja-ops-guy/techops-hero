/* Approved Chorus siege encounter authority. No synthetic geography/population is
 * registered here. Trusted mission adapters supply observed events, never UI flags.
 * This validates single-player chronology and provenance, not external truth. */
(function(root,factory){
  var rescue=typeof module==='object'&&module.exports?require('./campaign_low_quarter.js'):root.TechOpsLowQuarter;
  var api=factory(rescue);if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.TechOpsChorusSiege=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Rescue){
  'use strict';
  var AUTHORITY='chorus_siege_v1',SCHEMA=1,definitions=Object.create(null);
  var PHASES=['warning','deployment','first_assault','adaptation','hold','complete'];
  var AREAS=['approaches','services','shelters','departure'];
  function assert(v,m){if(!v)throw new Error(m);}
  function copy(v){return JSON.parse(JSON.stringify(v));}
  function same(a,b){return JSON.stringify(a)===JSON.stringify(b);}
  function own(o,k){return Object.prototype.hasOwnProperty.call(o,k);}
  function id(v){return typeof v==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(v)&&!['__proto__','constructor','prototype'].includes(v);}
  function integer(v){return Number.isSafeInteger(v)&&v>=0;}
  function table(a){assert(Array.isArray(a),'Authored list required');var o=Object.create(null);a.forEach(function(v){assert(id(v.id)&&!own(o,v.id),'Duplicate or invalid identity');o[v.id]=v;});return o;}
  function registerScenario(input){
    var d=copy(input),r=d.rescue;assert(d.approved===true&&r&&r.approved===true,'Reviewed scenario required');
    assert(r.encounter===AUTHORITY,'Rescue must require siege authority');
    var sectors=table(r.sectors),units=table(r.units),facts=table(d.facts),waves=table(d.waves),observations=table(d.observations);
    assert(d.areas&&same(Object.keys(d.areas).sort(),AREAS.slice().sort()),'Four defense areas required');
    assert(new Set(Object.values(d.areas)).size===4&&Object.values(d.areas).every(function(s){return own(sectors,s);}), 'Distinct authored defense sectors required');
    assert(r.sectors.length===4,'Define the full four-area scope explicitly');
    assert(d.relay&&id(d.relay.location)&&integer(d.relay.uploadDelay)&&d.relay.uploadDelay>0&&integer(d.relay.orderDelay)&&d.relay.orderDelay>0,'Explicit forward relay delays required');
    assert(integer(d.hopperRecovery)&&d.hopperRecovery>0&&d.waves.length>=2,'Successive arrivals and Hopper recovery required');
    var total=0,previous=-d.hopperRecovery;
    d.waves.forEach(function(w){assert(integer(w.tick)&&w.tick-previous>=d.hopperRecovery&&integer(w.warningTick)&&w.warningTick<w.tick,'Arrival requires warning and Hopper recovery');
      assert(integer(w.infected)&&w.infected>0&&own(sectors,w.sector),'Authored wave strength/location required');total+=w.infected;previous=w.tick;});
    assert(Number.isSafeInteger(total)&&total>=200000,'Hundreds-of-thousands assault required');
    d.facts.forEach(function(f){assert(['route','post','service'].includes(f.kind)&&id(f.target)&&id(f.version),'Bounded tactical fact required');
      assert(Array.isArray(f.knownBy)&&f.knownBy.length&&f.knownBy.every(function(u){return own(units,u)&&units[u].kind==='military';}),'Human defender knowledge source required');
      assert(own(sectors,f.sector),'Fact location required');
      if(f.kind==='route')assert(r.routes.some(function(v){return v.id===f.target&&v.sector===f.sector;}),'Unknown remembered route');
      if(f.kind==='post')assert(sectors[f.sector].posts.includes(f.target),'Unknown remembered post');});
    d.observations.forEach(function(o){assert(id(o.location)&&Array.isArray(o.roles)&&o.roles.length&&o.roles.every(function(v){return ['officer','engineer','witness'].includes(v);}), 'Independent observation roles required');
      assert(Array.isArray(o.sources)&&o.sources.length>=2&&new Set(o.sources).size===o.sources.length&&o.sources.every(id),'Independent observation sources required');
      assert(['arrival','resolution','assimilation','relay','response','order'].includes(o.kind),'Unknown observation kind');});
    ['arrival','resolution','assimilation','relay','response','order'].forEach(function(k){assert(d.observations.some(function(o){return o.kind===k;}),'Missing observation contract: '+k);});
    var key=r.id+':'+r.revision;assert(!own(definitions,key)||same(definitions[key],d),'Siege revision cannot be replaced');
    Rescue.registerScenario(r);definitions[key]=d;return key;
  }
  function definition(state){var lq=state.lowQuarter,d=lq&&definitions[lq.scenario+':'+lq.revision];assert(d,'Authored siege is unavailable');return d;}
  function begin(state,scenario,revision,runId){
    assert(own(definitions,scenario+':'+revision),'Authored siege is unavailable');
    var s=Rescue.begin(state,scenario,revision,runId);s.lowQuarter.siege={schema:SCHEMA,events:[]};return s;
  }
  function replay(state){
    var d=definition(state),lq=state.lowQuarter,sg=lq.siege;
    assert(sg&&sg.schema===SCHEMA&&Array.isArray(sg.events)&&sg.events.length<=1024,'Unsupported or missing siege history');
    var x={phase:'warning',tick:0,relay:true,arrivals:{},resolved:{},assimilated:{},localFacts:{},sudoFacts:{},orders:{},responses:{},warnings:{},lastRescueCount:0};
    var facts=table(d.facts),waves=table(d.waves),seen=new Set();
    function prefix(e){
      assert(integer(e.rescueCount)&&e.rescueCount>=x.lastRescueCount&&e.rescueCount<=lq.events.length,'Invalid rescue receipt boundary');
      var before=lq.events[e.rescueCount-1],after=lq.events[e.rescueCount];
      assert((!before||before.tick<=e.tick)&&(!after||after.tick>=e.tick),'Siege/rescue chronology mismatch');
      var s=copy(state);s.lowQuarter.events=s.lowQuarter.events.slice(0,e.rescueCount);x.lastRescueCount=e.rescueCount;
      return Rescue.inspect(s);
    }
    function observe(e,r,kind){
      var o=d.observations.find(function(v){return v.id===e.observation&&v.kind===kind;});
      assert(o,'Authored observation required');var a=r.actors[e.actor];
      assert(a&&a.location===o.location&&o.roles.includes(a.role)&&e.actor!=='orpheus','Independent observer must be present');
      assert(Array.isArray(e.sources)&&same(e.sources.slice().sort(),o.sources.slice().sort()),'Observation sources missing');
    }
    function receipt(e,type,match){
      var v=lq.events.slice(0,e.rescueCount).find(function(v){return v.id===e.receipt;});
      assert(v&&v.type===type&&match(v),'Matching rescue observation required');return v;
    }
    function defended(r){return d.rescue.sectors.every(function(s){
      var a=d.rescue.units.filter(function(u){var v=r.units[u.id];return v&&v.ready&&v.sector===s.id;});
      return a.reduce(function(n,u){return n+u.strength;},0)>=s.requiredStrength&&s.posts.every(function(p){return a.some(function(u){return r.units[u.id].post===p;});});
    });}
    sg.events.forEach(function(e){
      assert(id(e.id)&&!seen.has(e.id)&&e.runId===lq.runId&&e.operation===lq.scenario,'Invalid siege event scope or identity');seen.add(e.id);
      assert(integer(e.tick)&&e.tick>=x.tick,'Siege requires ordered logical time');var r=prefix(e);x.tick=e.tick;
      switch(e.type){
        case 'advance':
          var next=PHASES[PHASES.indexOf(x.phase)+1];assert(e.phase===next,'Invalid siege phase transition');
          if(next==='deployment')assert(r.checks.threat_corroborated&&Object.values(r.sectors).every(function(v){return v.surveyed&&v.warned;}),'Corroborate warning and survey every sector');
          if(next==='first_assault')assert(Rescue.AUTHORITY[lq.endingAtStart].every(function(k){return !!r.checks[k];})&&r.checks.essential_services_tested&&r.checks.continuity_staffed&&defended(r),'Command, services, staffing and defensive posts must be ready');
          if(next==='adaptation')assert(Object.keys(x.arrivals).length,'First assault must arrive');
          if(next==='hold')assert(d.waves.every(function(w){return x.arrivals[w.id];})&&Object.keys(x.orders).every(function(k){return x.responses[k];}),'Receive all arrivals and address issued attacks');
          if(next==='complete')assert(d.waves.every(function(w){return x.resolved[w.id];})&&Object.keys(x.orders).every(function(k){return x.responses[k];})&&defended(r)&&Object.values(r.sectors).every(function(s){return s.habitable&&s.contained;}),'Hold every post, contain sectors and resolve the immediate assault');
          x.phase=next;break;
        case 'wave_warning':
          var w=waves[e.wave];assert(w&&e.tick>=w.warningTick&&e.tick<w.tick&&!own(x.warnings,w.id),'Warn before arrival');
          receipt(e,'check',function(v){return v.check==='threat_corroborated';});x.warnings[w.id]=e.tick;break;
        case 'arrival':
          var w=waves[e.wave];assert(['first_assault','adaptation'].includes(x.phase)&&w&&x.warnings[w.id]!==undefined&&e.tick>=w.tick&&!x.arrivals[w.id],'Warned physical arrival required');
          var last=d.waves.filter(function(v){return x.arrivals[v.id];}).reduce(function(t,v){return Math.max(t,x.arrivals[v.id].tick);},-d.hopperRecovery);
          assert(e.tick-last>=d.hopperRecovery,'Hopper recovery incomplete');observe(e,r,'arrival');assert(d.observations.find(function(o){return o.id===e.observation;}).location===w.sector,'Observe the actual landing sector');x.arrivals[w.id]={tick:e.tick};break;
        case 'resolve_wave':
          assert(x.arrivals[e.wave]&&!x.resolved[e.wave]&&e.tick>x.arrivals[e.wave].tick,'Observed arrival precedes resolution');
          observe(e,r,'resolution');assert(d.observations.find(function(o){return o.id===e.observation;}).location===waves[e.wave].sector,'Observe the actual assault sector');x.resolved[e.wave]=e.id;break;
        case 'assimilate':
          assert(['first_assault','adaptation','hold'].includes(x.phase)&&!x.assimilated[e.unit],'Assimilation unavailable');
          assert(Object.keys(x.arrivals).length,'Physical infected presence required');observe(e,r,'assimilation');
          var lost=receipt(e,'unit',function(v){return v.unit===e.unit&&v.ready===false;});
          assert(r.units[e.unit]&&r.units[e.unit].ready===false&&d.rescue.units.some(function(u){return u.id===e.unit&&u.kind==='military';}),'Defender loss must affect actual defense');
          assert(d.observations.find(function(o){return o.id===e.observation;}).location===lost.sector,'Witness must observe the defender location');
          x.assimilated[e.unit]=e.id;d.facts.filter(function(f){return f.knownBy.includes(e.unit);}).forEach(function(f){if(!x.localFacts[f.id])x.localFacts[f.id]={tick:e.tick,source:e.id,version:f.version};});break;
        case 'upload':
          var f=x.localFacts[e.fact];assert(x.relay&&f&&e.tick>=f.tick+d.relay.uploadDelay&&!x.sudoFacts[e.fact],'Fresh acquisition and live relay required');
          x.sudoFacts[e.fact]={tick:e.tick,source:f.source,version:f.version};break;
        case 'order':
          assert(['first_assault','adaptation','hold'].includes(x.phase)&&id(e.order)&&!own(x.orders,e.order),'Order unavailable');
          var f=(e.command==='sudo'?x.sudoFacts:e.command==='local'?x.localFacts:{})[e.fact];
          assert(f&&facts[e.fact],'Enemy cannot use unknown knowledge');
          if(e.command==='sudo')assert(x.relay&&e.tick>=f.tick+d.relay.orderDelay,'Sudo needs a live forward command path');
          observe(e,r,'order');x.orders[e.order]={fact:e.fact,version:f.version,source:f.source,command:e.command,tick:e.tick};break;
        case 'respond':
          assert(x.orders[e.order]&&!x.responses[e.order]&&e.tick>x.orders[e.order].tick,'An issued attack precedes its response');observe(e,r,'response');
          var f=facts[x.orders[e.order].fact];
          if(f.kind==='route')receipt(e,'route',function(v){return v.route===f.target&&v.open===false;});
          else if(f.kind==='post')receipt(e,'unit',function(v){return v.sector===f.sector&&v.post===f.target&&v.ready===true&&v.tick>x.orders[e.order].tick;});
          else receipt(e,'sector',function(v){return v.sector===f.sector&&v.contained===true&&v.habitable===true&&v.tick>x.orders[e.order].tick;});
          x.responses[e.order]=e.id;break;
        case 'relay_cut':
          assert(x.relay&&['first_assault','adaptation','hold'].includes(x.phase),'Relay interruption unavailable');observe(e,r,'relay');assert(d.observations.find(function(o){return o.id===e.observation;}).location===d.relay.location,'Observer must reach the relay');x.relay=false;break;
        default:throw new Error('Unknown siege event');
      }
    });
    var current=Rescue.inspect(state);
    Object.keys(x.assimilated).forEach(function(u){assert(!current.units[u].ready,'Assimilated defenders cannot silently return to service');});
    return x;
  }
  function assess(state){
    if(state.lowQuarter.siege&&integer(state.lowQuarter.siege.schema)&&state.lowQuarter.siege.schema>SCHEMA)return {continuationBlocked:true,reason:'Unsupported siege version; preserve original save'};
    var x=replay(state);return {missing:x.phase==='complete'?[]:['siege_hold_unverified']};}
  Rescue.registerEncounterAuthority(AUTHORITY,assess);
  function applyEvent(state,event){
    assert(state.lowQuarter&&state.lowQuarter.phase==='active','Rescue is closed or unavailable');
    var previous=state.lowQuarter.siege&&state.lowQuarter.siege.events.find(function(e){return e.id===event.id;});
    if(previous){assert(same(previous,event),'Conflicting siege event');return copy(state);}
    var s=copy(state);assert(s.lowQuarter.siege&&s.lowQuarter.siege.events.length<1024,'Siege history limit reached');
    s.lowQuarter.siege.events.push(copy(event));replay(s);return s;
  }
  function status(state){var x=replay(state);return {phase:x.phase,relayConnected:x.relay,arrivedWaves:Object.keys(x.arrivals),resolvedWaves:Object.keys(x.resolved),acquiredFacts:copy(x.localFacts),sudoFacts:copy(x.sudoFacts),orders:copy(x.orders),responses:copy(x.responses),missing:assess(state).missing};}
  return {SCHEMA:SCHEMA,AUTHORITY:AUTHORITY,PHASES:PHASES.slice(),AREAS:AREAS.slice(),registerScenario:registerScenario,begin:begin,applyEvent:applyEvent,status:status};
});
