/* Low Quarter rescue authority. No scenario geography/casualties are invented here.
 * Authored mission adapters register a definition; all progress is replayed from
 * scoped events. The browser board never offers buttons that fabricate evidence.
 */
(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.TechOpsLowQuarter=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  var SCHEMA=1,definitions=Object.create(null),encounters=Object.create(null);
  var COMMON=['threat_corroborated','roster_reconciled','final_sweep_witnessed','essential_services_tested','continuity_staffed'];
  var AUTHORITY={
    shutdown:['independent_records','manual_comms_tested','local_power_tested','human_rota','military_coalition','independent_command_tested'],
    control:['orpheus_coordination_tested','external_stop_tested','independent_audit','civilian_veto','risky_order_challenged'],
    open_network:['orpheus_coordination_tested','cooperation_earned','network_maintained','local_fallback_tested','distributed_authority_tested']
  };
  var LABELS={threat_corroborated:'Corroborate the Chorus warning',roster_reconciled:'Reconcile the resident count',final_sweep_witnessed:'Witness the final sector sweep',essential_services_tested:'Test essential services',continuity_staffed:'Staff continued local support',independent_records:'Recover independent records',manual_comms_tested:'Test local communications',local_power_tested:'Test local power',human_rota:'Agree the response rota',military_coalition:'Secure military cooperation',independent_command_tested:'Test independent military command',orpheus_coordination_tested:'Test Orpheus military and robot coordination',external_stop_tested:'Test an independently operated stop',independent_audit:'Arrange independent command review',civilian_veto:'Establish a civilian veto',risky_order_challenged:'Challenge a harmful optimization',cooperation_earned:'Earn local cooperation',network_maintained:'Verify the shared network',local_fallback_tested:'Test local fallback',distributed_authority_tested:'Test distributed command authority'};
  function copy(v){return JSON.parse(JSON.stringify(v));}
  function assert(v,m){if(!v)throw new Error(m);}
  function own(o,k){return Object.prototype.hasOwnProperty.call(o,k);}
  function object(o){return o&&typeof o==='object'&&!Array.isArray(o);}
  function id(v){return typeof v==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(v)&&['__proto__','constructor','prototype'].indexOf(v)<0;}
  function integer(v){return Number.isSafeInteger(v)&&v>=0;}
  function unique(list){return new Set(list).size===list.length;}
  function equal(a,b){return JSON.stringify(a)===JSON.stringify(b);}
  function table(list){var o=Object.create(null);list.forEach(function(x){assert(id(x.id)&&!own(o,x.id),'Duplicate or invalid definition id');o[x.id]=x;});return o;}
  function registerScenario(input){
    var d=copy(input);assert(id(d.id)&&id(d.revision),'Scenario identity required');
    assert(d.approved===true,'Only authored, reviewed scenarios may be registered');
    assert(Array.isArray(d.sectors)&&d.sectors.length>0,'Authored sectors required');
    var sectors=table(d.sectors),actors=table(d.actors||[]),people=table(d.people||[]);
    var units=table(d.units||[]),routes=table(d.routes||[]),vehicles=table(d.vehicles||[]),checks=table(d.checks||[]);
    d.sectors.forEach(function(s){assert(integer(s.requiredStrength)&&s.requiredStrength>0,'Explicit defensive strength required');assert(Array.isArray(s.posts)&&s.posts.length&&unique(s.posts)&&s.posts.every(id),'Authored defense posts required');});
    d.actors.forEach(function(a){assert(['commander','witness','receiver','engineer','officer'].indexOf(a.role)>=0&&id(a.location),'Invalid actor role/location');});
    d.people.forEach(function(p){assert(own(sectors,p.sector),'Person requires known sector');});
    d.units.forEach(function(u){assert(['military','robot'].indexOf(u.kind)>=0&&integer(u.strength)&&u.strength>0,'Invalid defensive unit');assert(Array.isArray(u.commandModes)&&u.commandModes.every(function(m){return ['independent','central','distributed'].indexOf(m)>=0;}),'Unit command modes required');});
    d.vehicles.forEach(function(v){assert(integer(v.capacity)&&v.capacity>0&&id(v.location),'Vehicle capacity and starting location required');});
    d.routes.forEach(function(r){assert(own(sectors,r.sector)&&id(r.gate)&&id(r.destination)&&integer(r.duration)&&r.duration>0,'Invalid evacuation route');});
    var all=Array.from(new Set(COMMON.concat.apply(COMMON, Object.keys(AUTHORITY).map(function(k){return AUTHORITY[k];}))));
    d.checks.forEach(function(c){assert(all.indexOf(c.id)>=0||['space_lead','ship_qualified','crew_accounted','home_handoff'].indexOf(c.id)>=0,'Unknown check');assert(id(c.location)&&Array.isArray(c.roles)&&c.roles.length&&c.roles.every(function(r){return ['witness','receiver','engineer','officer'].indexOf(r)>=0;}),'Independent verifier roles required');assert(Array.isArray(c.sources)&&c.sources.length>=2&&unique(c.sources)&&c.sources.every(id),'Two independent authored evidence sources required');});
    all.forEach(function(k){assert(own(checks,k),'Scenario must support every ending: '+k);});
    assert(!d.deadline||(integer(d.deadline.tick)&&integer(d.deadline.warningTick)&&d.deadline.warningTick<d.deadline.tick),'Deadline requires advance warning');
    assert(!d.encounter||id(d.encounter),'Invalid encounter authority');
    var key=d.id+':'+d.revision;
    if(own(definitions,key))assert(equal(definitions[key],d),'Scenario revision cannot be replaced');
    else definitions[key]=d;
    return key;
  }
  function registerEncounterAuthority(name,handler){
    assert(id(name)&&typeof handler==='function','Encounter authority required');
    assert(!own(encounters,name)||encounters[name]===handler,'Encounter authority cannot be replaced');encounters[name]=handler;
  }
  function inspect(state){var lq=state.lowQuarter;return copy(replay(lq));}
  function definition(lq){var d=definitions[lq.scenario+':'+lq.revision];assert(d,'Authored rescue mission is not available in this build');return d;}
  function ending(state){
    var e=state.story&&state.story.ending,mirror=state.lateGame&&state.lateGame.chapters&&state.lateGame.chapters.ending;
    assert(own(AUTHORITY,e),'Choose an Orpheus ending before beginning rescue');
    assert(!mirror||mirror===e,'Conflicting Orpheus endings require save recovery');return e;
  }
  function migrate(state){var s=copy(state);if(!own(s,'lowQuarter'))s.lowQuarter={schema:SCHEMA,phase:'legacy_unassessed',result:null};return s;}
  function begin(state,scenario,revision,runId){
    assert(id(runId),'Run identity required');var s=copy(state),e=ending(s);
    assert(s.story.facts&&s.story.facts.campaign_complete===true,'Complete the existing epilogue before rescue');
    assert(!s.lowQuarter||s.lowQuarter.schema===SCHEMA&&s.lowQuarter.phase==='legacy_unassessed','Rescue run already exists or uses an unsupported version');
    var d=definitions[scenario+':'+revision];assert(d,'Authored rescue mission is not available in this build');
    s.lowQuarter={schema:SCHEMA,phase:'active',scenario:scenario,revision:revision,runId:runId,endingAtStart:e,events:[],continuationEvents:[],result:null};return s;
  }
  function initial(d){
    var x={tick:0,checks:{},sectors:{},people:{},actors:{},units:{},routes:{},trips:{},vehicles:{},warning:false};
    d.sectors.forEach(function(s){x.sectors[s.id]={surveyed:false,warned:false,habitable:false,contained:false};});
    d.people.forEach(function(p){x.people[p.id]={sector:p.sector,status:'unknown',consent:null};});
    d.actors.forEach(function(a){x.actors[a.id]={role:a.role,location:a.location};});
    d.vehicles.forEach(function(v){x.vehicles[v.id]={location:v.location,since:0};});
    return x;
  }
  function verifier(x,event,location,roles){
    var a=x.actors[event.actor];assert(a&&a.location===location&&roles.indexOf(a.role)>=0,'Independent verifier must be present in the correct role');
    assert(event.actor!=='orpheus','Orpheus cannot independently verify its own work');return a;
  }
  function reconcileInvalidated(x){delete x.checks.roster_reconciled;delete x.checks.final_sweep_witnessed;}
  function reduce(x,e,lq,d){
    assert(id(e.id)&&e.runId===lq.runId&&e.operation===lq.scenario,'Event belongs to a different rescue operation');
    assert(integer(e.tick)&&e.tick>=x.tick,'Events must use ordered logical time');
    assert(!d.deadline||e.tick<d.deadline.tick||e.type==='deadline','The warned rescue window has closed');
    x.tick=e.tick;
    var sector,person,route,unit,trip,actor;
    switch(e.type){
      case 'move':
        actor=x.actors[e.actor];assert(actor,'Unknown actor');
        assert(!Object.values(x.trips).some(function(t){return !t.arrived&&!t.failed&&t.staff.indexOf(e.actor)>=0;}),'Staff member is in transit');
        assert((d.links||[]).some(function(link){return link.from===actor.location&&link.to===e.to&&e.tick-(actor.movedAt||0)>=link.duration;}),'No traversable authored route');
        actor.location=e.to;actor.movedAt=e.tick;break;
      case 'check':
        var c=d.checks.find(function(v){return v.id===e.check;});assert(c,'Unknown mission check');
        verifier(x,e,c.location,c.roles);
        assert(Array.isArray(e.sources)&&unique(e.sources)&&c.sources.every(function(s){return e.sources.indexOf(s)>=0;}),'Independent evidence sources missing');
        (c.requires||[]).forEach(function(k){assert(x.checks[k],'Mission prerequisite missing: '+k);});
        if(e.check==='roster_reconciled'||e.check==='final_sweep_witnessed')assert(Object.values(x.sectors).every(function(s){return s.surveyed;}),'Survey every sector before reconciling');
        x.checks[e.check]=e.id;break;
      case 'survey':
        sector=x.sectors[e.sector];assert(sector,'Unknown sector');verifier(x,e,e.sector,['witness','officer']);sector.surveyed=true;reconcileInvalidated(x);break;
      case 'discover':
        assert(id(e.person)&&!own(x.people,e.person)&&own(x.sectors,e.sector),'Invalid newly discovered resident');
        verifier(x,e,e.sector,['witness','officer']);x.people[e.person]={sector:e.sector,status:'unknown',consent:null};reconcileInvalidated(x);break;
      case 'warn':
        sector=x.sectors[e.sector];assert(sector,'Unknown sector');verifier(x,e,e.sector,['witness','officer']);assert(x.checks.threat_corroborated,'Corroborate warning first');sector.warned=true;break;
      case 'consent':
        person=x.people[e.person];assert(person&&['transport','shelter','declined'].indexOf(e.choice)>=0,'Invalid consent');
        verifier(x,e,person.sector,['witness']);assert(person.status!=='in_transit'&&person.status!=='evacuated'&&person.status!=='dead','Consent change unavailable');person.consent=e.choice;break;
      case 'route':
        route=d.routes.find(function(r){return r.id===e.route;});assert(route,'Unknown route');verifier(x,e,route.gate,['engineer','officer']);x.routes[e.route]=e.open===true;break;
      case 'depart':
        route=d.routes.find(function(r){return r.id===e.route;});var vehicle=d.vehicles.find(function(v){return v.id===e.vehicle;});
        assert(route&&vehicle&&x.routes[route.id],'An open tested route and vehicle are required');
        assert(x.vehicles[e.vehicle].location===route.gate,'Vehicle has not returned to the departure gate');
        assert(id(e.trip)&&!own(x.trips,e.trip),'Duplicate trip');
        verifier(x,e,route.gate,['witness']);
        assert(Array.isArray(e.people)&&e.people.length>0&&unique(e.people)&&e.people.length<=vehicle.capacity,'Trip exceeds capacity');
        assert(Array.isArray(e.staff)&&e.staff.length>0&&unique(e.staff)&&e.staff.every(function(a){return x.actors[a]&&x.actors[a].location===route.gate;}),'Transport staff must be present');
        assert(e.staff.indexOf(e.actor)<0,'Gate witness must remain independent of the transport');
        Object.values(x.trips).forEach(function(t){if(!t.arrived&&!t.failed)assert(t.vehicle!==e.vehicle&&!t.staff.some(function(a){return e.staff.indexOf(a)>=0;}),'Vehicle or staff already committed');});
        e.people.forEach(function(p){var v=x.people[p];assert(v&&v.sector===route.sector&&v.consent==='transport'&&['unknown','sheltered'].indexOf(v.status)>=0,'Resident not available or consenting');v.status='in_transit';v.trip=e.trip;});
        x.vehicles[e.vehicle]={location:'in_transit',since:e.tick};
        x.trips[e.trip]={vehicle:e.vehicle,staff:e.staff.slice(),people:e.people.slice(),route:e.route,departed:e.tick};break;
      case 'arrive':
        trip=x.trips[e.trip];assert(trip&&!trip.arrived&&!trip.failed,'Trip is not in transit');route=d.routes.find(function(r){return r.id===trip.route;});
        verifier(x,e,route.destination,['receiver']);assert(e.tick>=trip.departed+route.duration,'Transport has not arrived');
        assert(e.careAccepted===true,'Receiving care handoff required');
        assert(!trip.interrupted,'Interrupted transport needs an authored recovery operation');
        x.vehicles[trip.vehicle]={location:route.destination,since:e.tick};
        trip.arrived=true;trip.people.forEach(function(p){x.people[p].status='evacuated';x.people[p].receivedBy=e.actor;});
        trip.staff.forEach(function(a){x.actors[a].location=route.destination;x.actors[a].movedAt=e.tick;});break;
      case 'return_vehicle':
        var v=x.vehicles[e.vehicle];actor=x.actors[e.actor];
        assert(v&&actor&&actor.role==='engineer'&&actor.location===v.location,'A driver must be with the vehicle');
        assert((d.links||[]).some(function(link){return link.from===v.location&&link.to===e.to&&e.tick-Math.max(v.since,actor.movedAt||0)>=link.duration;}),'Vehicle return requires an authored route and travel time');
        v.location=e.to;v.since=e.tick;actor.location=e.to;actor.movedAt=e.tick;break;
      case 'trip_failed':
        trip=x.trips[e.trip];assert(trip&&!trip.arrived&&!trip.failed,'Trip is not in transit');route=d.routes.find(function(r){return r.id===trip.route;});
        verifier(x,e,route.gate,['witness','officer']);assert(!trip.interrupted,'Transport already interrupted');trip.people.forEach(function(p){x.people[p].status='unknown';});
        // Crew and vehicle remain unavailable pending authored recovery; no teleportation.
        trip.interrupted=true;break;
      case 'shelter':
        person=x.people[e.person];assert(person&&person.consent==='shelter'&&person.status!=='in_transit'&&person.status!=='dead'&&person.status!=='evacuated','Resident must consent to shelter');
        verifier(x,e,person.sector,['witness']);assert(e.careVerified===true&&e.safetyVerified===true,'Shelter and care need verification');person.status='sheltered';break;
      case 'unit':
        unit=d.units.find(function(u){return u.id===e.unit;});assert(unit,'Unknown defense unit');verifier(x,e,e.sector,['officer']);
        sector=d.sectors.find(function(s){return s.id===e.sector;});assert(sector&&sector.posts.indexOf(e.post)>=0,'Unknown defense post');
        var mode=lq.endingAtStart==='shutdown'?'independent':lq.endingAtStart==='control'?'central':'distributed';
        assert(unit.commandModes.indexOf(mode)>=0,'Unit cannot operate under this command arrangement');
        AUTHORITY[lq.endingAtStart].forEach(function(k){assert(x.checks[k],'Command readiness missing: '+k);});
        if(unit.kind==='robot'&&mode==='independent')assert(e.independentControlTested===true,'Robot independent control not established');
        x.units[e.unit]={sector:e.sector,post:e.post,mode:mode,ready:e.ready===true};break;
      case 'sector':
        sector=x.sectors[e.sector];assert(sector,'Unknown sector');verifier(x,e,e.sector,['engineer','officer']);
        sector.habitable=e.habitable===true;sector.contained=e.contained===true;break;
      case 'deadline_warning':
        assert(d.deadline&&e.tick>=d.deadline.warningTick&&e.tick<d.deadline.tick,'Warning outside authored window');verifier(x,e,d.deadline.location,['officer','witness']);x.warning=true;break;
      case 'deadline':
        assert(d.deadline&&x.warning&&e.tick>=d.deadline.tick,'Deadline requires prior visible warning');verifier(x,e,d.deadline.location,['officer','witness']);x.expired=true;break;
      default:throw new Error('Unknown rescue event');
    }
    return x;
  }
  function replay(lq){
    assert(lq.schema===SCHEMA,'Unsupported rescue version; preserve original save');
    var d=definition(lq),x=initial(d),seen=Object.create(null);
    assert(Array.isArray(lq.events)&&lq.events.length<=4096,'Invalid rescue history');
    lq.events.forEach(function(e){assert(!own(seen,e.id),'Duplicate stored event');reduce(x,e,lq,d);seen[e.id]=true;});return x;
  }
  function applyEvent(state,event){
    var lq=state.lowQuarter;assert(lq&&lq.phase==='active','Rescue is not active');assert(ending(state)===lq.endingAtStart,'Orpheus ending changed');
    var previous=lq.events.find(function(e){return e.id===event.id;});
    if(previous){assert(equal(previous,event),'Conflicting event id');return copy(state);}
    var x=replay(lq);assert(!x.expired,'Rescue window closed');reduce(x,copy(event),lq,definition(lq));
    var s=copy(state);assert(s.lowQuarter.events.length<4096,'Rescue history limit reached');s.lowQuarter.events.push(copy(event));return s;
  }
  function evaluate(state){
    var lq=state.lowQuarter;assert(lq&&ending(state)===lq.endingAtStart,'Rescue ending mismatch');var d=definition(lq),x=replay(lq);
    var missing=COMMON.concat(AUTHORITY[lq.endingAtStart]).filter(function(k){return !x.checks[k];});
    var retained=[];d.sectors.forEach(function(s){
      var v=x.sectors[s.id],assigned=d.units.filter(function(u){var a=x.units[u.id];return a&&a.ready&&a.sector===s.id;});
      var strength=assigned.reduce(function(n,u){return n+u.strength;},0);
      var posts=s.posts.every(function(p){return assigned.some(function(u){return x.units[u.id].post===p;});});
      if(!v.surveyed)missing.push(s.id+':survey');if(!v.warned)missing.push(s.id+':warning');
      if(!v.habitable)missing.push(s.id+':essential_services');if(!v.contained)missing.push(s.id+':local_containment');
      if(strength<s.requiredStrength||!posts)missing.push(s.id+':defensive_capacity');
      if(v.habitable&&v.contained&&strength>=s.requiredStrength&&posts)retained.push(s.id);
    });
    if(d.encounter){
      assert(own(encounters,d.encounter),'Encounter authority is not available in this build');
      var encounter=encounters[d.encounter](copy(state),copy(x));
      assert(encounter&&!encounter.continuationBlocked,encounter&&encounter.reason||'Encounter version unavailable');
      assert(encounter&&Array.isArray(encounter.missing)&&encounter.missing.every(id),'Invalid encounter assessment');
      missing=missing.concat(encounter.missing);
    }
    var safe=Object.keys(x.people).filter(function(p){var person=x.people[p],sector=x.sectors[person.sector];return person.status==='evacuated'||person.status==='sheltered'&&sector.habitable&&sector.contained;});
    var unresolved=Object.keys(x.people).filter(function(p){return safe.indexOf(p)<0;});
    var accounted=!!x.checks.roster_reconciled&&!!x.checks.final_sweep_witnessed&&Object.values(x.sectors).every(function(s){return s.surveyed;});
    var allSafe=accounted&&unresolved.length===0;
    var outcome=allSafe&&missing.length===0&&retained.length===d.sectors.length?'district_saved':allSafe?'evacuation_only':safe.length||retained.length?'partial_rescue':'rescue_failed';
    return {outcome:outcome,safe:safe,unresolved:unresolved,retainedSectors:retained,missing:missing,people:copy(x.people),sectors:copy(x.sectors),chorus:'active',ionaCampaign:'ongoing',deepSpaceEligible:['space_lead','ship_qualified','crew_accounted','home_handoff'].every(function(k){return !!x.checks[k];}),malarUnlocked:false};
  }
  function continuationState(state){
    var lq=state.lowQuarter,d=definition(lq),x=replay(lq),seen=new Set(lq.events.map(function(e){return e.id;}));
    var events=lq.continuationEvents||[];assert(Array.isArray(events)&&events.length<=512,'Invalid continuation history');
    events.forEach(function(e){
      assert(e.type==='check'&&['space_lead','ship_qualified','crew_accounted','home_handoff'].indexOf(e.check)>=0,'Continuation cannot rewrite district rescue');
      assert(!seen.has(e.id),'Duplicate continuation event');seen.add(e.id);
      // A later journey is not constrained by the closed district crisis deadline.
      reduce(x,e,lq,Object.assign({},d,{deadline:null}));
    });return x;
  }
  function continuationStatus(state){
    var x=continuationState(state);
    return {ionaCampaign:'ongoing',chorus:'active',malarUnlocked:false,
      deepSpaceEligible:['space_lead','ship_qualified','crew_accounted','home_handoff'].every(function(k){return !!x.checks[k];})};
  }
  function applyContinuationEvent(state,event){
    var lq=state.lowQuarter;assert(lq&&['active','closed'].indexOf(lq.phase)>=0&&ending(state)===lq.endingAtStart,'Rescue continuation unavailable');
    var events=lq.continuationEvents||[],previous=events.find(function(e){return e.id===event.id;});
    if(previous){assert(equal(previous,event),'Conflicting continuation event');return copy(state);}
    assert(events.length<512,'Continuation history limit reached');
    var s=copy(state);s.lowQuarter.continuationEvents=events.concat([copy(event)]);continuationState(s);return s;
  }
  function closeout(state,expectedCount,confirmed){
    assert(confirmed===true,'Confirm the irreversible rescue closeout');var lq=state.lowQuarter;
    var expected=typeof expectedCount==='object'&&expectedCount?expectedCount:{rescue:expectedCount};
    assert(lq&&lq.phase==='active'&&lq.events.length===expected.rescue,'Stale or closed rescue operation');
    if(lq.siege)assert(expected.siege===lq.siege.events.length,'Stale siege closeout preview');
    var result=evaluate(state),s=copy(state);s.lowQuarter.phase='closed';s.lowQuarter.result=result;return s;
  }
  function validate(state){
    try{var lq=state.lowQuarter;if(!lq)return {valid:true};
      assert(object(lq)&&integer(lq.schema),'Invalid rescue namespace');
      if(lq.schema!==SCHEMA)return {valid:true,continuationBlocked:true,reason:'Unsupported rescue version; preserve original save'};
      if(lq.phase==='legacy_unassessed'){assert(lq.result===null,'Unassessed rescue cannot have a result');return {valid:true};}
      assert(['active','closed'].indexOf(lq.phase)>=0&&id(lq.runId),'Invalid rescue phase/run');
      assert(ending(state)===lq.endingAtStart,'Rescue ending mismatch');
      // Missing content revisions block only the continuation, preserving old saves.
      if(!definitions[lq.scenario+':'+lq.revision])return {valid:true,continuationBlocked:true,reason:'Authored rescue mission is not available in this build'};
      var activeDefinition=definitions[lq.scenario+':'+lq.revision];
      if(activeDefinition.encounter&&!own(encounters,activeDefinition.encounter))return {valid:true,continuationBlocked:true,reason:'Encounter authority is not available in this build'};
      if(activeDefinition.encounter){var compatibility=encounters[activeDefinition.encounter](copy(state),inspect(state));if(compatibility.continuationBlocked)return {valid:true,continuationBlocked:true,reason:compatibility.reason};}
      var r=evaluate(state);continuationState(state);assert(lq.phase==='closed'?equal(lq.result,r):lq.result===null,'Rescue result does not match verified events');return {valid:true};
    }catch(e){return {valid:false,errors:[e.message]};}
  }
  function transact(state,operation,persist){
    var next=operation(copy(state)),v=validate(next);assert(v.valid&&!v.continuationBlocked,(v.errors||[v.reason]).join('; '));
    assert(typeof persist==='function'&&persist(next)===true,'Rescue progress could not be saved');return next;
  }
  function status(state){
    var lq=state.lowQuarter;if(!lq||lq.phase==='legacy_unassessed')return {phase:'unassessed',message:'District rescue has not been assessed. An authored defense mission is required.',requirements:endingRequirements(state)};
    var v=validate(state);if(!v.valid||v.continuationBlocked)return {phase:'blocked',message:(v.errors||[v.reason]).join('; ')};
    return {phase:lq.phase,result:evaluate(state),continuation:continuationStatus(state),requirements:endingRequirements(state)};
  }
  function endingRequirements(state){var e=state.story&&state.story.ending;return own(AUTHORITY,e)?COMMON.concat(AUTHORITY[e]).map(function(k){return {id:k,label:LABELS[k]};}):[];}
  return {SCHEMA:SCHEMA,COMMON:COMMON.slice(),AUTHORITY:copy(AUTHORITY),registerScenario:registerScenario,registerEncounterAuthority:registerEncounterAuthority,inspect:inspect,migrate:migrate,begin:begin,applyEvent:applyEvent,evaluate:evaluate,continuationStatus:continuationStatus,applyContinuationEvent:applyContinuationEvent,closeout:closeout,validate:validate,transact:transact,status:status};
});
