/* Creator-approved opening prototype, 2026-11-22. Explicit review launch only.
 * Physical simulation produces observations; existing rescue/siege own outcomes. */
(function(root,factory){
  const api=factory(typeof module==='object'&&module.exports?require('./campaign_low_quarter.js'):root.TechOpsLowQuarter,
    typeof module==='object'&&module.exports?require('./campaign_chorus_siege.js'):root.TechOpsChorusSiege);
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.TechOpsLowQuarterOperation=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(R,Siege){
  'use strict';
  const ID='low_quarter_opening',REV='review_1',ROOMS=['approaches','services','shelters','departure'];
  const LINKS=[['approaches','services',20],['services','shelters',15],['services','departure',25],['shelters','departure',20]];
  const clone=x=>JSON.parse(JSON.stringify(x));
  function assert(v,m){if(!v)throw Error(m);}
  const prop=(id,room,x,label,seconds=2)=>({id,room,x,label,seconds});
  const PROPS=[
    prop('lookout','approaches',160,'Observe the incoming ship',3),prop('watch','approaches',320,'Ask the local watch to corroborate',3),
    prop('survey_approaches','approaches',520,'Survey approach and warn the watch'),
    prop('survey_services','services',100,'Survey service routes and warn operators'),
    prop('power','services',240,'Repair distribution and load-test power',6),prop('radio','services',400,'Repair and challenge local radio',5),
    prop('records','services',560,'Compare independent dispatch records',3),prop('rota','services',720,'Assign service and care rota',4),
    prop('coalition','services',880,'Ask local officers to join the coalition',4),
    prop('dispatch','services',1040,'Dispatch a test team to the marked post',3),
    prop('stop','services',1200,'Use the independent stop during the drill',3),
    prop('audit','services',1360,'Compare officer dispatch with the external log',3),
    prop('veto','departure',180,'Exercise civilian veto on the occupied loading gate',3),
    prop('challenge','departure',350,'Challenge early gate closure; open the alternate',4),
    prop('cooperate','shelters',130,'Agree service support with the shelter crew',3),
    prop('isolate','services',1520,'Isolate coordinator link and test fallback',5),
    prop('restore','services',1660,'Restore shared coordination',3),
    prop('survey_shelters','shelters',300,'Survey courtyard and warn residents'),
    prop('vent','shelters',460,'Clear shelter ventilation and test seal',5),
    prop('care','shelters',640,'Staff the care room and verify supplies',4),
    prop('survey_departure','departure',520,'Survey loading road and warn residents'),
    prop('road','departure',710,'Clear and test the service-road route',4),
    prop('alternative','departure',880,'Clear the alternate road',4),
    prop('van','departure',1120,'Board consenting residents and dispatch convoy',3),
    prop('ready','approaches',720,'Commit deployment and start warned approach',3),
    prop('gate','approaches',1040,'Close the breached ingress gate',4),
    prop('cut_route','departure',960,'Close the compromised service road',3),
    prop('receiver','receiving',600,'Accept receiving care with the yard medic',15)
  ].concat(ROOMS.map((room,i)=>prop('test_'+room,room,room==='services'?1800-160:1100,'Load-test local service and containment',4)));
  function definition(){
    const checks=[...new Set(R.COMMON.concat(...Object.values(R.AUTHORITY)))].map(id=>({id,location:id==='threat_corroborated'?'approaches':id==='civilian_veto'||id==='risky_order_challenged'?'departure':'services',roles:['officer','engineer','witness'],sources:[id+'_instrument',id+'_independent']}));
    const actors=[];
    for(const r of ROOMS){actors.push({id:'officer_'+r,role:'officer',location:r},{id:'witness_'+r,role:'witness',location:r},{id:'engineer_'+r,role:'engineer',location:r});}
    actors.push({id:'driver',role:'engineer',location:'departure'},{id:'carer',role:'engineer',location:'departure'},{id:'receiver',role:'receiver',location:'receiving'});
    const links=LINKS.flatMap(([a,b,d])=>[{from:a,to:b,duration:d},{from:b,to:a,duration:d}]);
    links.push({from:'departure',to:'receiving',duration:90},{from:'receiving',to:'departure',duration:90});
    return {approved:true,areas:Object.fromEntries(ROOMS.map(x=>[x,x])),hopperRecovery:180,
      relay:{location:'approaches',uploadDelay:10,orderDelay:5},
      waves:[{id:'first_ship',tick:900,warningTick:0,infected:80000,sector:'approaches'},{id:'second_ship',tick:7200,warningTick:180,infected:160000,sector:'approaches'}],
      facts:[{id:'road_v1',kind:'route',target:'service_road',version:'v1',sector:'departure',knownBy:['team_approaches']}],
      observations:['arrival','resolution','assimilation','relay','response','order'].map(kind=>({id:'observe_'+kind,kind,location:kind==='response'?'departure':'approaches',roles:['witness'],sources:[kind+'_physical',kind+'_watch']})),
      rescue:{id:ID,revision:REV,approved:true,encounter:Siege.AUTHORITY,sectors:ROOMS.map(id=>({id,requiredStrength:2,posts:[id+'_post']})),actors,
        people:Array.from({length:12},(_,i)=>({id:'resident_'+(i+1),sector:i<8?'departure':'shelters'})),
        units:Array.from({length:6},(_,i)=>({id:i<4?'team_'+ROOMS[i]:'reserve_'+(i-3),kind:'military',strength:2,commandModes:['independent','central','distributed']})).concat([{id:'robot',kind:'robot',strength:2,commandModes:['central','distributed']}]),
        vehicles:[{id:'van',capacity:8,location:'departure'}],routes:[{id:'service_road',sector:'departure',gate:'departure',destination:'receiving',duration:90},{id:'alternate_road',sector:'departure',gate:'departure',destination:'receiving',duration:90}],links,checks}
    };
  }
  function register(){return Siege.registerScenario(definition());}
  function begin(campaign,ending,runId){
    assert(campaign.story&&campaign.story.ending===ending&&campaign.story.facts.campaign_complete,'Review launch needs an explicitly eligible ending setup');
    register();const s=Siege.begin(campaign,ID,REV,runId);
    s.lowQuarterOperation={schema:1,revision:REV,scope:'review_opening',tick:0,serial:0,room:'approaches',x:80,y:0,vy:0,facing:1,hp:100,
      observations:[],done:{},work:null,travel:null,message:'Iona: Get a second report before we warn the district.',
      units:ROOMS.map((r,i)=>({id:'team_'+r,room:'services',x:1000+i*30,target:null,hp:100,ready:false})).concat([{id:'reserve_1',room:'services',x:950,hp:100,ready:false},{id:'reserve_2',room:'services',x:920,hp:100,ready:false},{id:'robot',room:'services',x:890,hp:100,ready:false}]),
      residents:Array.from({length:12},(_,i)=>({id:'resident_'+(i+1),room:i<8?'departure':'shelters',x:i<8?240+i*75:800+(i-8)*90,consent:null,follow:false,boarded:false})),
      drill:{x:1040,target:1120,moving:false,stopped:false,arrived:false},enemies:[],spawned:0,kills:0,attackAt:-1,hurtAt:-1,assaultStart:null,breachStart:null,convoy:null,checkpoint:false,halted:false};
    return s;
  }
  function validate(s){
    const o=s.lowQuarterOperation;
    if(!o)return {valid:true};
    if(o.schema!==1||o.revision!==REV)return {valid:true,blocked:true,reason:'Opening revision unavailable; retain this save.'};
    try{
      assert(o.scope==='review_opening'&&s.lowQuarter.scenario===ID&&s.lowQuarter.revision===REV,'Wrong opening scope');
      assert(Number.isFinite(o.tick)&&o.tick>=0&&o.tick<=7200,'Invalid operation clock');
      assert(['receiving',...ROOMS].includes(o.room)&&Number.isFinite(o.x)&&o.x>=40&&o.x<=1740,'Invalid physical position');
      assert(Array.isArray(o.observations)&&o.observations.length<=2048&&o.observations.every((e,i)=>e.serial===i+1&&e.runId===s.lowQuarter.runId&&e.revision===REV&&Number.isFinite(e.tick)&&e.tick<=o.tick),'Invalid observation provenance');
      assert(o.observations.every((e,i)=>!i||e.tick>=o.observations[i-1].tick),'Observation clock reversal');
      assert(o.residents.length===12&&new Set(o.residents.map(p=>p.id)).size===12,'Invalid opening cohort');
      assert(o.enemies.length<=18&&o.spawned<=18&&o.kills<=o.spawned,'Invalid breach population');
      assert(s.lowQuarter.phase==='active'&&s.lowQuarter.result===null,'Opening cannot close district rescue');
      assert(!s.lowQuarter.events.some(e=>e.check==='roster_reconciled'||e.check==='final_sweep_witnessed'),'Opening cannot certify whole district');
      assert(!s.lowQuarter.siege.events.some(e=>['resolve_wave','relay_cut'].includes(e.type)||e.phase==='complete'),'Opening cannot resolve whole invasion');
      const v=R.validate(s);assert(v.valid&&!v.continuationBlocked,(v.errors||[v.reason]).join('; '));return {valid:true};
    }catch(e){return {valid:false,reason:e.message};}
  }
  function transact(s,fn,persist){const c=clone(s);fn(c);const v=validate(c);assert(v.valid&&!v.blocked,v.reason);assert(persist(c)===true,'Opening progress was not saved; last committed state retained');return c;}
  function observation(s,kind,producer,target,detail){const o=s.lowQuarterOperation;const e={serial:o.observations.length+1,id:'physical_'+(++o.serial),runId:s.lowQuarter.runId,revision:REV,tick:o.tick,kind,producer,target,detail:detail||null};o.observations.push(e);return e;}
  function rescue(s,type,fields){const o=s.lowQuarterOperation;const next=R.applyEvent(s,Object.assign({id:'rescue_'+(++o.serial),runId:s.lowQuarter.runId,operation:ID,tick:Math.floor(o.tick),type},fields));s.lowQuarter=next.lowQuarter;}
  function siege(s,type,fields){const o=s.lowQuarterOperation;const next=Siege.applyEvent(s,Object.assign({id:'siege_'+(++o.serial),runId:s.lowQuarter.runId,operation:ID,tick:Math.floor(o.tick),rescueCount:s.lowQuarter.events.length,type},fields));s.lowQuarter=next.lowQuarter;}
  function checked(s,id){return !!R.inspect(s).checks[id];}
  function emitCheck(s,id,room){if(checked(s,id))return;const d=definition().rescue.checks.find(x=>x.id===id);assert(d.location===room,'Check location mismatch');
    const a=observation(s,'instrument',id+'_instrument',id),b=observation(s,'witness',id+'_independent',id,{instrument:a.id,actor:'officer_'+room});
    rescue(s,'check',{check:id,actor:'officer_'+room,sources:d.sources});b.receipt=s.lowQuarter.events.at(-1).id;
  }
  function observedSiege(s,type,kind,fields){const a=observation(s,kind,kind+'_physical',fields.unit||fields.wave||fields.order),b=observation(s,'witness',kind+'_watch',a.target,{source:a.id});
    siege(s,type,Object.assign({actor:'witness_'+(kind==='response'?'departure':'approaches'),observation:'observe_'+kind,sources:[kind+'_physical',kind+'_watch']},fields));b.receipt=s.lowQuarter.siege.events.at(-1).id;}
  function commandReady(s){return R.AUTHORITY[s.story.ending].every(id=>checked(s,id));}
  function canWork(s,id){const o=s.lowQuarterOperation,d=o.done,e=s.story.ending;
    if(id.startsWith('test_'))return d.power&&d.radio&&d.vent&&d.care?'':'Restore power, radio, ventilation and care first.';
    if(id.startsWith('survey_'))return checked(s,'threat_corroborated')?'':'Corroborate the warning at the approach first.';
    const req={watch:['lookout'],radio:['power'],records:['radio'],rota:['care','radio'],coalition:['records'],dispatch:['radio','power'],stop:['dispatch'],audit:['stop'],veto:['audit'],challenge:['veto','alternative'],cooperate:['vent','care'],isolate:['dispatch','cooperate'],restore:['isolate'],care:['vent'],van:['road'],alternative:['road'],gate:['ready'],cut_route:['alternative']};
    if((req[id]||[]).some(k=>!d[k]))return 'Complete the preceding repair or protection objective first.';
    if(['stop','audit','veto','challenge'].includes(id)&&e!=='control')return 'This is the Control command exercise.';
    if(['cooperate','isolate','restore'].includes(id)&&e!=='open_network')return 'This is the Open Network command exercise.';
    if(['records','coalition'].includes(id)&&e!=='shutdown')return 'This is the independent Shutdown command exercise.';
    if(id==='ready'&&o.tick>=840)return 'The final approach window is too close to certify a fresh deployment; review preparations remain incomplete.';
    if(id==='stop'&&!o.drill.moving)return 'The test team must still be moving when you operate the stop.';
    if(id==='audit'&&!o.drill.stopped)return 'Stop the actual test team before reviewing its log.';
    if(id==='isolate'&&!o.drill.arrived)return 'Wait for the test team to arrive before isolating its coordinator.';
    if(id==='dispatch'&&e==='shutdown'&&!d.coalition)return 'Secure the military coalition first.';
    if(id==='dispatch'&&e==='open_network'&&!d.cooperate)return 'Earn shelter cooperation first.';
    if(id==='van'&&o.residents.filter(p=>p.consent==='transport'&&p.room==='departure'&&Math.abs(p.x-1120)<75).length===0)return 'Ask residents and physically escort them to the vehicle first.';
    if(id==='gate'&&(!o.breachStart||o.kills<18||o.enemies.some(e=>e.alive)))return 'Clear the eighteen-person breach before sealing the ingress.';
    if(id==='receiver'&&(!o.convoy||!o.convoy.arrived||o.convoy.interrupted))return 'The vehicle must physically reach this yard first.';
    if(id==='cut_route'&&!o.done.enemy_order)return 'No compromised route has been observed yet.';
    if(id==='ready'){
      if(!commandReady(s)||!checked(s,'essential_services_tested')||!checked(s,'continuity_staffed'))return 'Finish command, services and staffing tests first.';
      const r=R.inspect(s);if(!ROOMS.every(k=>r.sectors[k].surveyed&&r.sectors[k].warned&&o.units.some(u=>u.ready&&u.room===k&&u.hp>0)))return 'Survey and warn all four sectors, and escort a qualified team to every post.';
    }
    return '';
  }
  function finishWork(s,id){const o=s.lowQuarterOperation,d=o.done;o.work=null;d[id]=true;observation(s,'interaction','iona',id,{room:o.room,x:o.x});
    switch(id){
      case 'watch':emitCheck(s,'threat_corroborated','approaches');siege(s,'wave_warning',{wave:'first_ship',receipt:R.inspect(s).checks.threat_corroborated});o.message='Iona: Two reports agree. Warn every sector.';break;
      case 'power':if(s.story.ending==='shutdown')emitCheck(s,'local_power_tested','services');break;
      case 'radio':if(s.story.ending==='shutdown')emitCheck(s,'manual_comms_tested','services');break;
      case 'records':emitCheck(s,'independent_records','services');break;
      case 'rota':if(s.story.ending==='shutdown')emitCheck(s,'human_rota','services');break;
      case 'coalition':emitCheck(s,'military_coalition','services');break;
      case 'dispatch':o.drill.moving=true;o.drill.target=1420;o.message='Test team moving. Control: operate the external stop before it passes the red line.';break;
      case 'stop':o.drill.stopped=true;o.drill.moving=false;emitCheck(s,'external_stop_tested','services');break;
      case 'audit':emitCheck(s,'independent_audit','services');break;
      case 'veto':emitCheck(s,'civilian_veto','departure');o.message='Resident: There are still people on the loading road. Keep this gate open.';break;
      case 'challenge':emitCheck(s,'risky_order_challenged','departure');o.message='Iona: Reject the closure. Use the protected alternate.';break;
      case 'cooperate':break;
      case 'isolate':o.drill.moving=true;o.drill.arrived=false;o.drill.target=1100;o.message='Coordinator disconnected. Watch the local leaders return the test team.';break;
      case 'restore':emitCheck(s,'network_maintained','services');emitCheck(s,'cooperation_earned','services');break;
      case 'vent':break;
      case 'road':rescue(s,'route',{route:'service_road',actor:'engineer_departure',open:true});break;
      case 'alternative':rescue(s,'route',{route:'alternate_road',actor:'engineer_departure',open:true});break;
      case 'van':{
        const people=o.residents.filter(p=>p.consent==='transport'&&p.room==='departure'&&Math.abs(p.x-1120)<75&&!p.boarded).map(p=>p.id);
        rescue(s,'depart',{route:d.enemy_order?'alternate_road':'service_road',vehicle:'van',trip:'opening_trip',actor:'witness_departure',staff:['driver','carer'],people});
        people.forEach(id=>{const p=o.residents.find(x=>x.id===id);p.boarded=true;p.follow=false;});
        o.convoy={progress:0,arrived:false,interrupted:false,care:0,route:d.enemy_order?'alternate_road':'service_road'};o.message='Convoy underway. The receiving yard must verify care after the journey.';break;
      }
      case 'ready':{
        siege(s,'advance',{phase:'deployment'});siege(s,'advance',{phase:'first_assault'});
        // Fixed reviewed arrival schedule; preparation never moves the landing.
        o.assaultStart=900;o.message='Watch: Ship scheduled to land at local operation time 15:00. Hold the freight road.';break;
      }
      case 'gate':o.message='K: The breach is sealed. That was one approach, not the whole landing.';break;
      case 'receiver':{
        rescue(s,'arrive',{trip:'opening_trip',actor:'receiver',careAccepted:true});
        o.residents.filter(p=>p.boarded).forEach(p=>{p.room='receiving';p.x=470+Number(p.id.split('_')[1])*14;});
        o.message='Receiving medic: Care accepted. We still need a district count and the other landings.';break;
      }
      case 'cut_route':rescue(s,'route',{route:'service_road',actor:'engineer_departure',open:false});observedSiege(s,'respond','response',{order:'road_attack',receipt:s.lowQuarter.events.at(-1).id});break;
      default:if(id.startsWith('survey_')){const room=id.slice(7);rescue(s,'survey',{sector:room,actor:'witness_'+room});rescue(s,'warn',{sector:room,actor:'witness_'+room});}
    }
    if(id.startsWith('test_')){
      const room=id.slice(5);observation(s,'load_test','engineer_'+room,room,{power:d.power,radio:d.radio,vent:d.vent,care:d.care});
      rescue(s,'sector',{sector:room,actor:'engineer_'+room,habitable:true,contained:true});
    }
    if(ROOMS.every(r=>d['test_'+r])&&o.room==='services'){
      emitCheck(s,'essential_services_tested','services');if(d.rota)emitCheck(s,'continuity_staffed','services');
    }
  }
  function position(s){return s.lowQuarterOperation;}
  function nearby(s){const o=position(s);if(o.travel||o.halted||o.checkpoint)return [];
    const objects=PROPS.filter(p=>p.room===o.room&&(!o.done[p.id]||p.id==='test_services'&&!checked(s,'essential_services_tested'))&&Math.abs(p.x-o.x)<65).map(p=>({...p,kind:'prop'}));
    if(o.room==='services'&&commandReady(s))for(const u of o.units.filter(u=>!u.target&&!u.ready&&u.hp>0&&u.room===o.room&&Math.abs(u.x-o.x)<70))objects.push({id:u.id,label:u.id==='robot'?'Robot lacks independent Shutdown qualification; use military reserves':'Ask '+u.id+' to follow to a defensive post',kind:'unit'});
    if(ROOMS.includes(o.room)&&Math.abs(o.x-820)<65&&commandReady(s)&&o.units.some(u=>u.follow&&u.room===o.room&&Math.abs(u.x-o.x)<90))objects.push({id:'post',label:'Assign following team to this sector post',kind:'post'});
    for(const p of o.residents.filter(p=>!p.boarded&&p.room===o.room&&Math.abs(p.x-o.x)<55&&!p.follow&&!o.done['shelter_'+p.id]))objects.push({id:p.id,label:p.consent==='declined'?'Resident declined. Ask again':o.room==='shelters'?'Ask resident to shelter with care':'Ask resident to follow to the vehicle',kind:'resident'});
    return objects;
  }
  function interact(s,id,choice){const o=position(s);if(o.work||o.travel||o.halted||o.checkpoint)return false;
    const p=nearby(s).find(p=>p.id===id);if(!p){o.message='Move within reach of the person or object.';return false;}
    if(p.kind==='prop'){const why=canWork(s,id);if(why){o.message=why;return false;}o.work={id,remaining:p.seconds,room:o.room,x:p.x};o.message=p.label+'… stay nearby.';return true;}
    if(p.kind==='unit'){const u=o.units.find(u=>u.id===id);if(id==='robot'&&s.story.ending==='shutdown'){o.message='Robot independent control is unqualified. Use military teams.';return false;}u.follow=true;o.message='Team following. Walk to a sector post and assign them.';return true;}
    if(p.kind==='post'){
      const u=o.units.find(u=>u.follow&&u.room===o.room&&Math.abs(u.x-o.x)<90);u.follow=false;u.ready=true;u.x=820;
      observation(s,'deployment','officer_'+o.room,u.id,{room:o.room});rescue(s,'unit',{unit:u.id,sector:o.room,post:o.room+'_post',actor:'officer_'+o.room,ready:true});return true;
    }
    if(p.kind==='resident'){
      const r=o.residents.find(r=>r.id===id);const c=choice==='declined'?'declined':o.room==='shelters'?'shelter':'transport';
      observation(s,'consent',r.id,r.id,{choice:c});rescue(s,'consent',{person:r.id,choice:c,actor:'witness_'+o.room});r.consent=c;
      if(c==='transport')r.follow=true;
      if(c==='shelter'&&o.done.vent&&o.done.care){rescue(s,'shelter',{person:r.id,actor:'witness_shelters',careVerified:true,safetyVerified:true});o.done['shelter_'+r.id]=true;}
      return true;
    }
    return false;
  }
  function travel(s,to){const o=position(s);if(o.travel||o.work||o.halted||o.checkpoint)return false;
    let cost=LINKS.find(([a,b])=>a===o.room&&b===to||b===o.room&&a===to)?.[2];
    if(o.room==='departure'&&to==='receiving'){if(!o.convoy){o.message='Dispatch a convoy before following it to the receiving yard.';return false;}cost=90;}
    if(o.room==='receiving'&&to==='departure')cost=90;
    if(!cost)return false;o.travel={from:o.room,to,remaining:cost,duration:cost};o.message='Travelling to '+to+'; time and convoy continue.';return true;
  }
  function attack(s){const o=position(s);if(o.travel||o.work||o.halted||o.checkpoint||o.hp<=0||o.tick-o.attackAt<0.4)return false;o.attackAt=o.tick;
    const targets=o.enemies.filter(e=>e.alive&&Math.abs(e.x-o.x)<80&&Math.abs(e.y-o.y)<55);const e=targets.sort((a,b)=>Math.abs(a.x-o.x)-Math.abs(b.x-o.x))[0];
    if(e){e.hp=Math.max(0,e.hp-20);e.x+=o.facing*18;if(!e.hp){e.alive=false;o.kills++;observation(s,'combat','iona',e.id,{defeated:true});}}return true;
  }
  function step(s,seconds,input={}){const o=position(s);if(o.halted||o.checkpoint)return;assert(Number.isFinite(seconds)&&seconds>=0&&seconds<=1,'Bounded simulation step required');const dt=seconds;o.tick+=dt;
    if(o.tick>=900&&!o.done.ready){o.halted=true;o.message='The landing window arrived before command and defense were ready. Review halted with incomplete preparations; no defense or rescue success awarded.';return;}
    if(o.tick>=7199){o.halted=true;o.message='Review interval ended. Later ship content is unavailable; no district result awarded.';return;}
    if(o.travel){o.travel.remaining-=dt;if(o.travel.remaining<=0){
      const t=o.travel;o.room=t.to;o.x=100;o.travel=null;observation(s,'travel','iona',t.to,{from:t.from,duration:t.duration});
      o.units.filter(u=>u.follow&&u.room===t.from).forEach(u=>{u.room=t.to;u.x=60;});
    }}else if(!o.work){const dx=(input.right?1:0)-(input.left?1:0);o.x=Math.max(40,Math.min(1740,o.x+dx*160*dt));if(dx)o.facing=dx;
      if(input.jump&&o.y===0)o.vy=260;o.vy-=700*dt;o.y=Math.max(0,o.y+o.vy*dt);if(o.y===0)o.vy=0;
    }
    if(o.work){if(o.room!==o.work.room||Math.abs(o.x-o.work.x)>65)o.work=null;else{o.work.remaining-=dt;if(o.work.remaining<=0)finishWork(s,o.work.id);}}
    if(o.drill.moving){const dir=Math.sign(o.drill.target-o.drill.x);o.drill.x+=dir*20*dt;
      if(Math.abs(o.drill.target-o.drill.x)<3){o.drill.moving=false;o.drill.arrived=true;
        observation(s,'drill','local_officer','test_team',{x:o.drill.x,coordinatorDisconnected:!!o.done.isolate});
        if(s.story.ending==='shutdown')emitCheck(s,'independent_command_tested','services');
        else if(o.done.isolate){emitCheck(s,'local_fallback_tested','services');emitCheck(s,'distributed_authority_tested','services');}
        else emitCheck(s,'orpheus_coordination_tested','services');
      }
    }
    if(o.done.stop&&!checked(s,'orpheus_coordination_tested'))emitCheck(s,'orpheus_coordination_tested','services');
    for(const u of o.units.filter(u=>u.follow&&u.room===o.room)){u.x+=Math.sign(o.x-40-u.x)*Math.min(Math.abs(o.x-40-u.x),140*dt);}
    for(const p of o.residents.filter(p=>p.follow&&p.room===o.room)){const target=Math.min(o.x-25,1120);p.x+=Math.sign(target-p.x)*Math.min(Math.abs(target-p.x),100*dt);}
    if(o.convoy&&!o.convoy.interrupted&&!o.convoy.arrived){o.convoy.progress+=dt;if(o.convoy.progress>=90){o.convoy.arrived=true;observation(s,'vehicle_arrival','yard_watch','van',{trip:'opening_trip'});}}
    if(o.assaultStart!==null&&!o.breachStart&&o.tick>=o.assaultStart){observedSiege(s,'arrival','arrival',{wave:'first_ship'});siege(s,'advance',{phase:'adaptation'});o.breachStart=o.tick;o.message='Ship landing witnessed. Eighteen infected are through the freight breach.';}
    if(o.breachStart&&!o.done.gate){
      if(o.spawned<18&&o.enemies.filter(e=>e.alive).length<6){o.enemies.push({id:'infected_'+(++o.spawned),x:1250+o.spawned%3*70,y:0,hp:60,alive:true,hitAt:-1});}
      const team=o.units.find(u=>u.id==='team_approaches');
      for(const e of o.enemies.filter(e=>e.alive)){
        const nearPlayer=o.room==='approaches'&&!o.travel&&o.hp>0;const target=nearPlayer?o.x:820;e.x+=Math.sign(target-e.x)*42*dt;
        if(nearPlayer&&Math.abs(e.x-o.x)<35&&o.y<35&&o.tick-e.hitAt>1&&o.tick-o.hurtAt>0.8){e.hitAt=o.tick;o.hurtAt=o.tick;o.hp=Math.max(0,o.hp-3);}
        if(!nearPlayer&&team.hp>0&&Math.abs(e.x-820)<40){team.hp=Math.max(0,team.hp-4*dt);}
      }
      if(!team.hp&&!o.done.assimilated){team.ready=false;observation(s,'defender_loss','approach_watch',team.id,{physicalInfected:true});
        rescue(s,'unit',{unit:team.id,sector:'approaches',post:'approaches_post',actor:'officer_approaches',ready:false});
        observedSiege(s,'assimilate','assimilation',{unit:team.id,receipt:s.lowQuarter.events.at(-1).id});o.done.assimilated=o.tick;
      }
      if(o.hp===0){o.halted=true;o.message='Iona is incapacitated. Opening halted; missing people and defense remain unresolved. Restart the review to try again.';}
    }
    if(o.done.assimilated&&!o.done.upload&&o.tick>=o.done.assimilated+10){siege(s,'upload',{fact:'road_v1'});o.done.upload=o.tick;}
    if(o.done.upload&&!o.done.enemy_order&&o.tick>=o.done.upload+5){observedSiege(s,'order','order',{fact:'road_v1',order:'road_attack',command:'sudo'});o.done.enemy_order=o.tick;o.raiders={room:'approaches',x:1200,travel:0};o.message='Watch: The enemy is targeting the service road the lost team knew. Clear an alternate and close that road.';}
    if(o.raiders&&!o.done.cut_route){o.raiders.travel+=dt;if(o.raiders.travel>=45){o.raiders.room='departure';o.raiders.x=Math.max(1120,o.raiders.x-42*dt);}else if(o.raiders.travel>=20)o.raiders.room='services';}
    if(o.raiders?.room==='departure'&&o.raiders.x<=1120&&!o.done.cut_route&&o.convoy?.route==='service_road'&&!o.convoy.arrived&&!o.convoy.interrupted){o.convoy.interrupted=true;rescue(s,'trip_failed',{trip:'opening_trip',actor:'witness_departure'});o.message='Convoy route compromised. Passengers unresolved; vehicle and crew remain committed.';}
    if(o.done.gate&&o.done.receiver&&(!o.done.enemy_order||o.done.cut_route)&&o.residents.filter(p=>o.done['shelter_'+p.id]).length===4){
      const r=R.inspect(s);if(o.residents.filter(p=>r.people[p.id].status==='evacuated').length===8&&ROOMS.every(k=>Object.values(r.units).some(u=>u.ready&&u.sector===k))){o.checkpoint=true;observation(s,'opening_checkpoint','local_watch','opening_only');o.message='Opening checkpoint saved. Breach sealed; receiving care verified. District census, other landing fronts and later ships remain unresolved.';}
    }
  }
  function objective(s){const o=position(s),d=o.done;if(o.checkpoint||o.halted)return o.message;
    if(!checked(s,'threat_corroborated'))return 'Approaches: observe the ship and obtain a separate watch report. First landing at 15:00; prepare before then.';
    if(!ROOMS.every(k=>d['survey_'+k]))return 'Visit, survey and warn all four sectors.';
    if(!d.power||!d.radio||!d.vent||!d.care||!d.rota)return 'Repair power/radio, test shelter ventilation, staff care and assign the service rota.';
    if(!checked(s,'essential_services_tested')||!checked(s,'continuity_staffed'))return 'Physically load-test each sector after repairs; perform the Services test last to collect the independent reports.';
    if(!commandReady(s))return s.story.ending==='shutdown'?'Services: records → coalition → dispatch drill.':s.story.ending==='control'?'Services: dispatch → external stop → audit. Departure: veto → clear alternate → challenge closure.':'Shelters: cooperation. Services: dispatch drill → isolate → local return drill → restore.';
    if(!d.ready)return 'At Services, recruit teams. Escort one to each sector and assign a post; return to the Approaches deployment marker.';
    if(!d.van)return 'Departure: clear the road. Ask eight residents and escort them to the vehicle. Shelters: ask four residents to shelter.';
    if(!o.breachStart)return 'Ship approaching. Use the interval to protect residents; the watch will observe its arrival.';
    if(!d.gate)return 'Approaches: contain the eighteen infected and seal the breached ingress gate.';
    if(d.enemy_order&&!d.cut_route)return 'Departure: clear the alternate and close the compromised service road.';
    if(!d.receiver)return 'Follow the departed vehicle to the receiving yard and verify care with the medic.';
    return 'Check all four shelter choices and replace any lost defensive team.';
  }
  return {ID,REV,ROOMS,LINKS,PROPS,definition,register,begin,validate,transact,step,interact,travel,attack,nearby,objective};
});
