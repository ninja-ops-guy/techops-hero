/* Physical single-player mission producers. Rescue/Siege remain outcome owners.
 * A checkpoint is presentation/world state, never a district_saved flag. */
(function(root,factory){
  var node=typeof module==='object'&&module.exports;
  var api=factory(node?require('./campaign_low_quarter.js'):root.TechOpsLowQuarter,node?require('./campaign_chorus_siege.js'):root.TechOpsChorusSiege,node?require('./campaign_low_quarter_scenario.js'):root.TechOpsLowQuarterScenario);
  if(node)module.exports=api;if(root)root.TechOpsLowQuarterMission=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Rescue,Siege,Content){
  'use strict';
  var D=Content.definition,IDS=Content.places.map(function(p){return p.id;}),SPEED=110;
  function copy(v){return JSON.parse(JSON.stringify(v));}
  function assert(v,s){if(!v)throw Error(s);}
  function distance(a,b){return Math.abs(a.x-b.x);}
  function toward(p,x,speed,dt){var d=x-p.x;p.x+=Math.sign(d)*Math.min(Math.abs(d),speed*dt);}
  function place(m){return Content.places.find(function(p){return p.id===m.player.sector;})||(m.player.sector==='receiving'?{id:'receiving',name:'Screened receiving care',width:1920}:null);}
  function tick(m){return Math.floor(m.clock);}
  function rescue(s,type,fields){var l=s.lowQuarter,m=s.lowQuarterMission,e=Object.assign({id:'r_'+l.events.length,runId:l.runId,operation:l.scenario,tick:tick(m),type:type},fields);var n=Rescue.applyEvent(s,e);s.lowQuarter=n.lowQuarter;return e.id;}
  function siege(s,type,fields){var l=s.lowQuarter,m=s.lowQuarterMission,e=Object.assign({id:'s_'+l.siege.events.length,runId:l.runId,operation:l.scenario,tick:tick(m),rescueCount:l.events.length,type:type},fields);s.lowQuarter=Siege.applyEvent(s,e).lowQuarter;return e.id;}
  function observed(s,type,sector,fields){var kind=({resolve_wave:'resolution',assimilate:'assimilation',relay_cut:'relay',respond:'response'})[type]||type;var o=D.observations.find(function(v){return v.location===sector&&v.kind===kind;});return siege(s,type,Object.assign({actor:sector+'_witness',observation:o.id,sources:o.sources},fields));}
  function check(s,id){var m=s.lowQuarterMission;if(m.checked[id])return;var c=D.rescue.checks.find(function(v){return v.id===id;});assert(m.samples[id]&&m.samples[id].instrument&&m.samples[id].witness,'Physical measurement and independent witness missing');rescue(s,'check',{actor:'approaches_witness',check:id,sources:c.sources});m.checked[id]=true;}
  function sample(m,id){m.samples[id]={instrument:true,witness:true,at:m.elapsed};}
  function notice(m,text){m.message=text;m.log.push({at:Math.round(m.elapsed),text:text});if(m.log.length>60)m.log.shift();}
  function create(state){
    assert(state.story&&state.story.facts&&state.story.facts.campaign_complete&&Content.authority[state.story.ending],'Complete the original ending and epilogue first');
    assert(!state.lowQuarter||state.lowQuarter.phase==='legacy_unassessed','A rescue operation already exists');
    assert(!state.lowQuarterMission,'A mission checkpoint already exists');
    var s=copy(state);s.lowQuarterMission={schema:1,revision:Content.revision,stage:'access',clock:20,elapsed:0,player:{sector:'access',x:80,hp:100,face:1,jump:0,vy:0},access:0,samples:{},checked:{},survey:{},warned:{},services:{},staffed:{},swept:{},routeTested:{},choices:{},residents:{},units:[],carriers:[],enemies:[],waves:{},attack:0,hit:0,hold:null,dialog:null,travel:null,branch:{step:0,crossing:0,stopped:false,passed:false},picket:'exposed',picketContact:0,relay:true,orders:{},responded:{},shots:0,message:'Find the newly sourced coupling at the supply desk. The old spare remains spent.',log:[],runId:null};return s;
  }
  function enter(s){
    var m=s.lowQuarterMission;assert(m.access===4,'Source, replacement, power and empty transfer test required');
    var run='lq_'+String(s.history?s.history.length:0)+'_'+String(Math.floor(m.elapsed*10));
    s.lowQuarter=Siege.begin(s,Content.id,Content.revision,run).lowQuarter;m.runId=run;m.stage='preparation';m.player.sector='approaches';m.player.x=350;m.iona={sector:'services',x:1020,task:'maintaining the local warning channel'};
    D.rescue.people.forEach(function(p){m.residents[p.id]={x:p.x,sector:p.sector,care:p.care,status:'home'};});
    D.rescue.vehicles.forEach(function(v,i){m.carriers.push({id:v.id,driver:'driver_'+(i+1),attendant:'attendant_'+(i+1),receiver:'receiver_'+(i+1),sector:'approaches',x:1320+i*120,phase:'idle',people:[],timer:0});});
    notice(m,'Nera confirms this room and handrail. The occupied block is separate from the old ruin. Compare the lookout report with the optical trace.');
  }
  function validate(state){
    var m=state.lowQuarterMission;if(!m)return {valid:true};
    if(m.schema!==1||m.revision!==Content.revision)return {valid:true,continuationBlocked:true,reason:'Mission checkpoint version unavailable; preserve original save'};
    try{assert(Number.isFinite(m.elapsed)&&m.elapsed>=0&&Number.isFinite(m.clock)&&m.clock>=20,'Invalid mission clock');assert(m.player&&Number.isFinite(m.player.x)&&['access'].concat(IDS,['receiving']).includes(m.player.sector),'Invalid player location');assert(Array.isArray(m.enemies)&&m.enemies.length<=16&&m.enemies.every(function(e){return IDS.includes(e.sector)&&Number.isFinite(e.x)&&Number.isFinite(e.hp);}), 'Invalid active threats');assert(m.stage==='access'||state.lowQuarter&&state.lowQuarter.scenario===Content.id&&state.lowQuarter.runId===m.runId,'Mission run mismatch');return {valid:true};}catch(e){return {valid:false,errors:[e.message]};}
  }
  function ready(m){return IDS.every(function(k){return m.survey[k]&&m.warned[k]&&m.services[k]&&m.staffed[k]&&m.routeTested[k];})&&Content.authority[m.ending].every(function(k){return m.checked[k];})&&m.checked.threat_corroborated&&m.units.length>=9&&m.units.every(function(u){return u.ready;});}
  function addUnit(m,id,sector,post,x,delay){m.units.push({id:id,sector:sector,post:post,x:70,target:x,travel:delay||0,ready:false});}
  function deploy(s){
    var m=s.lowQuarterMission;if(m.units.length)return;
    assert(Content.authority[m.ending].every(function(k){return m.checked[k];}),'Complete the command test first');
    Content.places.forEach(function(p,i){p.posts.forEach(function(post,j){var robot=m.ending!=='shutdown'&&['s_supply','d_lane'].includes(post)&&!(m.ending==='control'&&post==='s_supply');addUnit(m,robot?'robot_'+post:'mil_'+post,p.id,post,1250+j*400,i===0?0:i===1?20:i===2?25:40);});});
    addUnit(m,'signal_picket','approaches','a_screen',350,0);
    notice(m,'Orders issued. Watch the units travel to their posts; assignments do not count as arrival.');
  }
  function unitStep(s,dt){var m=s.lowQuarterMission;m.units.forEach(function(u){if(u.lost)return;if(u.travel>0){u.travel-=dt;return;}if(!u.ready){toward(u,u.target,90,dt);if(Math.abs(u.x-u.target)<1){u.ready=true;rescue(s,'unit',{actor:u.sector+'_officer',unit:u.id,sector:u.sector,post:u.post,ready:true});}}});}
  function sectorState(s,sector,good){if(!good)s.lowQuarterMission.swept[sector]=false;rescue(s,'sector',{actor:sector+'_engineer',sector:sector,habitable:good,contained:good});}
  function branchTask(m){var end=m.ending;
    if(end==='shutdown')return ['independent_records','manual_comms_tested','local_power_tested','human_rota','military_coalition','independent_command_tested'][m.branch.step];
    if(end==='control')return ['orpheus_coordination_tested','external_stop_tested','independent_audit','civilian_veto','risky_order_challenged'][m.branch.step];
    return ['cooperation_earned','network_maintained','orpheus_coordination_tested','local_fallback_tested','distributed_authority_tested'][m.branch.step];
  }
  var BRANCH_TEXT={independent_records:'Compare coalition roster with the independent local register',manual_comms_tested:'Send radio challenge; hear the second post acknowledge',local_power_tested:'Disconnect remote feed; load-test local power',human_rota:'Agree attended relief with local officers',military_coalition:'Restore coalition link and share civilian protection rules',independent_command_tested:'Exercise independent order and acknowledgment',orpheus_coordination_tested:'Observe Orpheus order and local unit acknowledgment',external_stop_tested:'Operate the independently wired stop',independent_audit:'Compare local actuator trace with command log',civilian_veto:'Let the civilian representative exercise her veto',risky_order_challenged:'Keep the crossing open until the resident and attendant reach safety',cooperation_earned:'Repair the local link; agree participation with sector leaders',network_maintained:'Compare two local links under load',local_fallback_tested:'Disconnect coordinator uplink and exercise local fallback',distributed_authority_tested:'Witness two sector leaders challenge and acknowledge an order'};
  function objects(state){
    var m=state.lowQuarterMission,p=m.player,k=p.sector,out=[];function obj(id,label,x,duration,action){out.push({id:id,label:label,x:x,duration:duration||1,action:action});}
    if(m.stage==='access'){
      var access=[['Collect newly sourced coupling',250,3],['Fit replacement at the service bench',550,4],['Load-test external power',850,4],['Run instrumented empty transfer and compare local record',1150,5]];
      var a=access[m.access];obj('access_'+m.access,a[0],a[1],a[2],'access');return out;
    }
    if(m.travel)return out;
    var area=place(m);if(!area)return out;
    if(k==='receiving'){
      obj('care_bays','Inspect both staffed receiving bays and accepted care',650,2,'care_bays');
      IDS.forEach(function(to,i){obj('exit_'+to,'Return along the surveyed ground lane to '+to,1840-i*130,1,'exit');});return out;
    }
    if(!m.survey[k])obj('survey_'+k,'Search accessible rooms with the local witness',210,4,'survey');
    if(k==='approaches'&&!m.checked.threat_corroborated)obj('threat','Compare optical trace and independent lookout report',430,4,'threat');
    if(m.checked.threat_corroborated&&!m.warned[k])obj('warn_'+k,'Repair receiver and deliver the warning',330,3,'warn');
    if(!m.services[k])obj('repair_'+k,'Repair and load-test water, power and containment',1160,5,'repair');
    if(!m.staffed[k])obj('staff_'+k,'Check care supplies and arrange a witnessed relief rota',1380,3,'staff');
    if(!m.routeTested[k])obj('route_'+k,'Walk the loading gate; test both evacuation lanes',1570,4,'route');
    if(k==='approaches'&&m.stage==='preparation'){
      var key=branchTask(m);if(key)obj('command_'+key,BRANCH_TEXT[key],1800+(m.branch.step%3)*160,4,'command');
      if(m.ending==='control'&&m.branch.step===4&&!m.branch.stopped)obj('stop','Invoke the external stop: people are still crossing',2100,1,'stop');
      if(!key&&!m.units.length)obj('deploy','Give local officers the deployment order',2500,2,'deploy');
      if(ready(m))obj('launch','Confirm readiness and take position for the first arrival',2350,2,'launch');
    }
    if(m.stage==='assault'){
      if(!m.units.some(function(u){return u.id==='reserve_2';}))obj('relief_'+k,'Request the second reserve at this sector’s rear post',1260,3,'relief');
      if(k==='approaches'&&m.waves.arrival_1&&m.picket==='exposed')obj('picket','Guide the exposed signal picket behind the barrier',350,2,'picket');
      if(k==='approaches'&&m.picket==='assimilated'&&!m.units.some(function(u){return u.id==='reserve_1';}))obj('reserve','Lead a reserve to replace the lost defensive capacity',2430,3,'reserve');
      if(k==='approaches'&&m.waves.arrival_1&&m.waves.arrival_1.arrived!==null&&m.relay)obj('relay','Isolate the landed relay; verify loss of forward traffic',2270,5,'relay');
      if(k==='approaches'&&Object.keys(m.orders).some(function(o){return !m.responded[o];}))obj('counter','Close compromised primary lane and test the alternative',1890,3,'counter');
      var wave=D.waves.find(function(w){return w.sector===k;}),w=m.waves[wave.id];
      if(w&&!w.sealed)obj('ramp_'+k,'Seal this ship group\'s unloading access',100,5,'ramp');
      if(w&&w.resolved&&!m.swept[k])obj('sweep_'+k,'Sweep every accessible room and reconcile local names',210,5,'sweep');
      if(k==='approaches'&&IDS.every(function(id){return m.swept[id];}))obj('account','Compare four-sector sweep with receiving and shelter records',2200,5,'account');
    }
    if(m.stage==='accounted'&&k==='approaches')obj('closeout','Review the permanent response-area outcome',2200,1,'closeout');
    D.rescue.people.filter(function(person){var r=m.residents[person.id];return r.sector===k&&!['aboard','received','boarding','interrupted'].includes(r.status);}).forEach(function(person){obj(person.id,person.label+' — ask about care and offer a choice',m.residents[person.id].x,0.4,'resident');});
    m.carriers.filter(function(c){return c.sector===k&&c.phase==='idle';}).forEach(function(c){obj(c.id,'Inspect '+c.id.replace('_',' ')+' and witness boarding',c.x,2,'carrier');});
    var exits=D.rescue.links.filter(function(l){return l.from===k&&l.to!=='receiving';});exits.forEach(function(l,i){obj('exit_'+l.to,'Follow the physical route to '+Content.places.find(function(v){return v.id===l.to;}).name,area.width-60-i*100,1,'exit');});
    obj('exit_receiving','Follow the screened ground lane to receiving care',510,1,'exit');
    return out;
  }
  function nearest(state){var m=state.lowQuarterMission;return objects(state).filter(function(o){return Math.abs(o.x-m.player.x)<65;}).sort(function(a,b){return Math.abs(a.x-m.player.x)-Math.abs(b.x-m.player.x);})[0]||null;}
  function choice(s,input){
    var m=s.lowQuarterMission,d=m.dialog;if(!d||!input)return;
    if(d.kind==='resident'){
      if(!['transport','shelter','declined','cancel'].includes(input))return;
      if(input!=='cancel'){var person=D.rescue.people.find(function(p){return p.id===d.id;});assert(person.sector===m.player.sector,'Resident must be present');
        if(m.residents[person.id].status==='sheltered'&&input==='declined'){notice(m,'Existing accepted shelter care remains. Discuss transport or continue sheltering.');m.dialog=null;return;}
        rescue(s,'consent',{actor:person.sector+'_witness',person:person.id,choice:input});m.choices[person.id]=input;
        if(input==='transport')m.residents[person.id].status='home';
        if(input==='shelter'&&m.services[person.sector]&&m.staffed[person.sector]){rescue(s,'shelter',{actor:person.sector+'_witness',person:person.id,careVerified:true,safetyVerified:true});m.residents[person.id].status='sheltered';}
        notice(m,input==='declined'?'Choice respected. This person remains unresolved.':input==='shelter'?'Shelter accepted; safety depends on continued services and containment.':'Transport accepted. Walk with this neighbor to the sector loading gate.');
      }
    }else if(d.kind==='closeout'&&input==='confirm'){
      s.lowQuarter=Rescue.closeout(s,{rescue:s.lowQuarter.events.length,siege:s.lowQuarter.siege.events.length},true).lowQuarter;m.stage='closed';notice(m,'Response-area result recorded. The wider Chorus and Iona’s campaign continue.');
    }
    m.dialog=null;
  }
  function perform(s,o){
    var m=s.lowQuarterMission,k=m.player.sector;
    switch(o.action){
      case 'access':m.access++;if(m.access===4)enter(s);else notice(m,'Observed access step recorded. Continue to the next marked workstation.');break;
      case 'survey':if(!D.rescue.people.filter(function(p){return p.sector===k;}).every(function(p){return m.visitedRooms&&m.visitedRooms[p.id];})){notice(m,'Walk past every occupied doorway with the local witness, then return to compare the room count.');break;}m.survey[k]=true;rescue(s,'survey',{actor:k+'_witness',sector:k});notice(m,'Twelve resident entries checked against the rooms you visited. The later final sweep remains required.');break;
      case 'threat':sample(m,'threat_corroborated');check(s,'threat_corroborated');notice(m,'Independent lookout and optical trace agree: ships are preparing a crossing. Warn every sector.');break;
      case 'warn':rescue(s,'warn',{actor:k+'_witness',sector:k});m.warned[k]=true;notice(m,'Local receivers and runners deliver the warning.');break;
      case 'repair':m.services[k]=true;sectorState(s,k,true);notice(m,'Engineer load-test and independent local check passed. Care and relief still need staffing.');break;
      case 'staff':m.staffed[k]=true;notice(m,'Care room stocked. Local staff accept the relief rota.');break;
      case 'route':['primary','alternative'].forEach(function(v){rescue(s,'route',{actor:k+'_engineer',route:k+'_'+v,open:true});});m.routeTested[k]=true;notice(m,'Both physical outbound lanes and the screened receiving destination are checked.');break;
      case 'command':{
        var key=branchTask(m);if(m.ending==='control'&&key==='risky_order_challenged'&&(!m.branch.stopped||m.branch.crossing<1)){notice(m,'Use the independently wired stop, then keep the crossing open for the resident and attendant.');break;}
        if(m.ending==='control'&&key==='civilian_veto'){
          var consenting=D.rescue.people.find(function(p){return p.sector==='approaches'&&['transport','shelter'].includes(m.choices[p.id]);});
          if(!consenting){notice(m,'Speak with a local resident and agree attended care before the crossing encounter. Nobody is volunteered without consent.');break;}
          m.branch.crossingResident=consenting.id;
        }
        assert(m.probe&&m.probe.key===key&&m.probe.replies.length===2,'Both physical test endpoints must acknowledge');
        m.branch.lastTest=copy(m.probe);m.branch.tests=m.branch.tests||{};m.branch.tests[key]=copy(m.probe);m.probe=null;
        sample(m,key);check(s,key);m.branch.step++;
        if(m.ending==='control'&&m.branch.step===4){m.branch.crossing=0.01;notice(m,'Orpheus orders the crossing sealed. A resident and attendant are still on it. Operate the external stop now.');}
        else notice(m,BRANCH_TEXT[key]+': local witness confirms the observed result.');break;
      }
      case 'stop':m.branch.stopped=true;notice(m,'External stop engaged. The civilian veto holds the crossing open; wait for both people to reach the safe side.');break;
      case 'deploy':deploy(s);break;
      case 'launch':{
        assert(ready(m),'Readiness incomplete');sample(m,'essential_services_tested');check(s,'essential_services_tested');sample(m,'continuity_staffed');check(s,'continuity_staffed');
        siege(s,'advance',{phase:'deployment'});var ref=s.lowQuarter.events.find(function(e){return e.check==='threat_corroborated';}).id;
        siege(s,'wave_warning',{wave:'arrival_1',receipt:ref});siege(s,'advance',{phase:'first_assault'});m.stage='assault';notice(m,'Hundreds of thousands approach in combined transport groups. First crossing in 80 seconds; follow the handrail to the exposed picket.');break;
      }
      case 'picket':m.picket='withdrawing';var u=m.units.find(function(v){return v.id==='signal_picket';});if(u)u.target=850;notice(m,'Picket follows your route behind the barrier. No knowledge acquired.');break;
      case 'reserve':addUnit(m,'reserve_1','approaches','a_bend',1650,0);notice(m,'Reserve leaves muster for the bend. Coverage returns only on actual arrival.');break;
      case 'relief':addUnit(m,'reserve_2',k,place(m).posts[1],1650,k==='approaches'?0:k==='services'?20:k==='shelters'?25:40);notice(m,'Second reserve leaves local muster for this rear post. Its single assignment counts only on physical arrival.');break;
      case 'relay':observed(s,'relay_cut',k);m.relay=false;notice(m,'Forward relay interrupted. Already issued attacks and local acquired facts remain.');break;
      case 'counter':{
        var order=Object.keys(m.orders).find(function(id){return !m.responded[id];});if(!order)break;
        if(tick(m)<=m.orders[order].tick){notice(m,'Observe the issued attack before closing its route.');break;}
        var receipt=rescue(s,'route',{actor:k+'_engineer',route:'approaches_primary',open:false});observed(s,'respond',k,{order:order,receipt:receipt});m.responded[order]=true;m.primaryClosed=true;notice(m,'Compromised lane closed. The independently tested alternative stays available; Sudo has no new-plan knowledge.');break;
      }
      case 'ramp':{
        var wave=D.waves.find(function(w){return w.sector===k;}),w=m.waves[wave.id];if(m.enemies.some(function(e){return e.sector===k&&Math.abs(e.x-o.x)<180&&e.hp>0;})){notice(m,'Clear the live attackers around the ramp before sealing it.');break;}w.sealed=true;notice(m,'Unloading access denied. Clear or contain the remaining local attackers.');break;
      }
      case 'sweep':if(!D.rescue.people.filter(function(p){return p.sector===k;}).every(function(p){return m.finalRooms&&m.finalRooms[p.id];})){notice(m,'Revisit every doorway after this front is contained, then compare the final local names.');break;}m.swept[k]=true;notice(m,'Final local sweep compared with names and care records. Return to the handrail command post after all four sweeps.');break;
      case 'account':{
        var v=Rescue.inspect(s),allSafe=Object.entries(v.people).every(function(row){return row[1].status==='evacuated'||row[1].status==='sheltered'&&v.sectors[row[1].sector].habitable&&v.sectors[row[1].sector].contained;});
        if(!allSafe){notice(m,'Some people remain unresolved. Ask residents, finish escorts or restore shelter care before claiming a full rescue. You may review a partial closeout at the board.');break;}
        if(Siege.status(s).phase!=='complete'){notice(m,'The final defense and restored capacity are not yet independently complete.');break;}
        ['roster_reconciled','final_sweep_witnessed'].forEach(function(key){sample(m,key);check(s,key);});m.stage='accounted';notice(m,'All 48 people independently safe in this surveyed area. Review the permanent result.');break;
      }
      case 'closeout':m.dialog={kind:'closeout',outcome:Rescue.evaluate(s).outcome};break;
      case 'resident':m.dialog={kind:'resident',id:o.id,label:o.label,care:m.residents[o.id].care};break;
      case 'carrier':board(s,m.carriers.find(function(c){return c.id===o.id;}));break;
      case 'care_bays':notice(m,'Two independent receivers are present. '+Object.values(m.residents).filter(function(r){return r.status==='received';}).length+' residents accepted into screened, staffed care. The ship is not this destination.');break;
      case 'exit':{
        var to=o.id.slice(5),l=D.rescue.links.find(function(v){return v.from===k&&v.to===to;});m.travel={from:k,to:to,remaining:l.duration,duration:l.duration};notice(m,'Traveling the surveyed route. Local defenders remain at their actual posts.');break;
      }
    }
  }
  function board(s,c){
    var m=s.lowQuarterMission,k=c.sector;if(!m.routeTested[k]){notice(m,'Test the outbound and receiving route first.');return;}
    var people=D.rescue.people.filter(function(p){var r=m.residents[p.id];return p.sector===k&&m.choices[p.id]==='transport'&&r.status==='gate';}).slice(0,6);
    if(!people.length){notice(m,'No consenting residents have reached this gate. Escort them here on foot.');return;}
    c.people=people.map(function(p){return p.id;});c.people.forEach(function(id){m.residents[id].status='boarding';});c.timer=15;c.phase='loading';notice(m,'Gate witness checks names and seats while the carrier loads.');
  }
  function transportStep(s,dt){
    var m=s.lowQuarterMission;
    Object.keys(m.residents).forEach(function(id){var r=m.residents[id];if(m.choices[id]==='transport'&&r.status==='home'&&m.player.sector===r.sector&&Math.abs(r.x-m.player.x)<220){toward(r,1500,72,dt);if(Math.abs(r.x-1500)<1)r.status='gate';}
      if(m.choices[id]==='shelter'&&r.status==='home'&&m.services[r.sector]&&m.staffed[r.sector]){rescue(s,'shelter',{actor:r.sector+'_witness',person:id,careVerified:true,safetyVerified:true});r.status='sheltered';}
    });
    m.carriers.forEach(function(c){if(c.phase==='idle'||c.phase==='interrupted')return;
      if(c.phase==='outbound'){
        var r=D.rescue.routes.find(function(v){return v.id===c.route;}),area=Content.places.find(function(v){return v.id===c.sector;});
        c.x=1320+(area.width-1320)*Math.max(0,Math.min(1,1-c.timer/r.duration));
        if(m.enemies.some(function(e){return e.adaptive&&e.sector===c.sector&&e.hp>0&&Math.abs(e.x-c.x)<55;})){
          rescue(s,'trip_failed',{actor:c.sector+'_witness',trip:c.trip});c.phase='interrupted';c.people.forEach(function(id){m.residents[id].status='interrupted';m.residents[id].x=c.x;});notice(m,'The witnessed attack interrupted a carrier. People remain unresolved and the vehicle and crew stay reserved. This build has no transport-recovery extension.');return;
        }
      }
      c.timer-=dt;if(c.timer>0)return;
      if(c.phase==='loading'){
        var route=c.sector+'_'+(c.sector==='approaches'&&m.primaryClosed?'alternative':'primary');c.route=route;c.trip='trip_'+c.id+'_'+s.lowQuarter.events.length;
        rescue(s,'depart',{actor:c.sector+'_witness',route:route,vehicle:c.id,trip:c.trip,people:c.people,staff:[c.driver,c.attendant]});c.people.forEach(function(id){m.residents[id].status='aboard';});
        c.phase='outbound';c.departed=tick(m);c.timer=D.rescue.routes.find(function(r){return r.id===route;}).duration;
        notice(m,'Carrier departed under an independent gate witness. Receiving care is still pending.');
      }else if(c.phase==='outbound'){
        var duration=D.rescue.routes.find(function(r){return r.id===c.route;}).duration;if(tick(m)<c.departed+duration){c.timer=1;return;}
        c.phase='handoff';c.sector='receiving';c.timer=15;c.x=650+(c.id==='carrier_2'?200:0);notice(m,'Carrier physically reached its receiving bay. Local receivers are checking names and care needs.');
      }else if(c.phase==='handoff'){
        rescue(s,'arrive',{actor:c.receiver,trip:c.trip,careAccepted:true});c.people.forEach(function(id){m.residents[id].status='received';});c.phase='care';c.timer=15;c.sector='receiving';notice(m,'Receiving bay independently confirms '+c.people.length+' people and accepts their care.');
      }else if(c.phase==='care'){
        var target=IDS.find(function(id){return D.rescue.people.some(function(p){return p.sector===id&&m.choices[p.id]==='transport'&&m.residents[p.id].status==='gate';});})||IDS.find(function(id){return D.rescue.people.some(function(p){return p.sector===id&&m.residents[p.id].status==='home';});})||'departure';
        c.target=target;c.phase='returning';c.returnedAt=tick(m);c.timer=D.rescue.links.find(function(l){return l.from==='receiving'&&l.to===target;}).duration;
      }else if(c.phase==='returning'){
        var link=D.rescue.links.find(function(l){return l.from==='receiving'&&l.to===c.target;});if(tick(m)<c.returnedAt+link.duration){c.timer=1;return;}
        rescue(s,'return_vehicle',{actor:c.driver,vehicle:c.id,to:c.target});rescue(s,'move',{actor:c.attendant,to:c.target});c.sector=c.target;c.phase='idle';c.people=[];c.x=1320+(c.id==='carrier_2'?120:0);notice(m,'Carrier and both crew physically returned to '+c.sector+'.');
      }
    });
  }
  function spawn(m,sector,wave,adaptive){if(m.enemies.filter(function(e){return e.hp>0;}).length>=16)return false;
    var seq=m.spawnSeq=(m.spawnSeq||0)+1;m.enemies.push({id:'infected_'+seq,sector:sector,x:adaptive?1050:90+(seq%3)*24,hp:3,contact:0,wave:wave,adaptive:!!adaptive});return true;}
  function combatStep(s,input,dt){
    var m=s.lowQuarterMission,p=m.player;m.attack=Math.max(0,m.attack-dt);m.hit=Math.max(0,m.hit-dt);
    if(input.attack&&m.attack===0){m.attack=.45;m.shots++;m.enemies.forEach(function(e){if(e.sector===p.sector&&e.hp>0&&Math.abs(e.x-p.x)<115&&(e.x-p.x)*p.face>=-20)e.hp-=2;});}
    m.enemies.forEach(function(e){if(e.hp<=0)return;
      // The primary lane is a separate covered branch. Closing its exit
      // physically contains the fact-bound flank instead of just marking it.
      if(e.adaptive&&m.primaryClosed){e.contained=true;return;}
      var near=!m.travel&&e.sector===p.sector&&Math.abs(e.x-p.x)<300,target=near?p.x:e.adaptive?1500:1160;toward(e,target,e.adaptive?48:32,dt);
      if(near&&Math.abs(e.x-p.x)<35&&p.jump<25&&m.hit===0){p.hp-=input.block?1:6;m.hit=1;}
      if(m.picket==='exposed'&&e.sector==='approaches'&&Math.abs(e.x-350)<45){m.picketContact+=dt;}
      // Local officers observe actual allies firing on an attacker in their range.
      var defenders=m.units.filter(function(u){return u.ready&&!u.lost&&u.id!=='signal_picket'&&u.sector===e.sector&&Math.abs(u.x-e.x)<420;});
      e.contact+=dt;if(defenders.length&&e.contact>=2){e.hp-=1;e.contact=0;}
      if(e.x>1080&&e.x<1230&&!near){var w=m.waves[e.wave];if(w&&!w.damage){w.damage=true;m.services[e.sector]=false;sectorState(s,e.sector,false);notice(m,'A live attacker reached '+e.sector+' distribution. Repair and recheck containment.');}}
    });
    m.enemies=m.enemies.filter(function(e){return e.hp>0;});
    if(p.hp<=0){p.hp=100;p.x=650;m.hit=3;m.hold=null;notice(m,'Local medics stabilize K behind the barrier. Enemy and transport progress remain; no victory or rewind awarded.');}
    if(m.picket==='withdrawing'){var picket=m.units.find(function(u){return u.id==='signal_picket';});toward(picket,850,75,dt);if(picket.x>=849)m.picket='safe';}
    if(m.picket==='exposed'&&m.picketContact>=8){var u=m.units.find(function(v){return v.id==='signal_picket';});u.lost=true;u.ready=false;m.picket='assimilated';var receipt=rescue(s,'unit',{actor:'approaches_officer',unit:'signal_picket',sector:'approaches',post:'a_screen',ready:false});observed(s,'assimilate','approaches',{unit:'signal_picket',receipt:receipt});m.acquired=tick(m);notice(m,'Physical assimilation witnessed. The picket’s route, bend and isolation knowledge are compromised; approaches capacity fell.');}
  }
  function phase(s){var a=s.lowQuarter.siege.events;for(var i=a.length-1;i>=0;i--)if(a[i].type==='advance')return a[i].phase;return 'warning';}
  function waveStep(s,dt){
    var m=s.lowQuarterMission,clock=tick(m),sg={phase:phase(s)},ref=s.lowQuarter.events.find(function(e){return e.check==='threat_corroborated';}).id;
    D.waves.forEach(function(w,i){var v=m.waves[w.id];
      if(!m['warn_'+w.id]&&clock>=w.warningTick&&clock<w.tick){if(i>0)siege(s,'wave_warning',{wave:w.id,receipt:ref});m['warn_'+w.id]=true;if(i>0)notice(m,'Lookout warning: transport group approaching '+w.sector+'.');}
      var prior=i===0?null:m.waves[D.waves[i-1].id],earliest=Math.max(w.tick,prior?prior.arrived+D.hopperRecovery:w.tick);
      if(!v&&clock>=earliest-20&&(!i||prior)){v=m.waves[w.id]={flight:0,arrived:null,spawned:0,sealed:false,resolved:false,spawnTimer:0};notice(m,'A physical Star Hopper crossing appears outside '+w.sector+'. Ships approach through the intervening sky.');}
      if(!v)return;
      if(v.arrived===null){v.flight+=dt;if(v.flight>=20&&clock>=earliest){v.arrived=clock;observed(s,'arrival',w.sector,{wave:w.id});m.services[w.sector]=false;sectorState(s,w.sector,false);notice(m,'Transport group landed at '+w.sector+'. Infected are unloading.');}return;}
      if(!v.sealed&&v.spawned<12){v.spawnTimer-=dt;if(v.spawnTimer<=0&&spawn(m,w.sector,w.id,false)){v.spawned++;v.spawnTimer=3;}}
      if(v.sealed&&!v.resolved&&clock>v.arrived&&!m.enemies.some(function(e){return e.wave===w.id;})){observed(s,'resolve_wave',w.sector,{wave:w.id});v.resolved=true;notice(m,'Independent officers confirm the '+w.sector+' front contained. Revisit its doorways for the final sweep.');}
    });
    sg={phase:phase(s)};if(sg.phase==='first_assault'&&m.waves.arrival_1&&m.waves.arrival_1.arrived!==null&&clock>=150)siege(s,'advance',{phase:'adaptation'});
    if(m.acquired!==undefined&&!m.uploaded&&m.relay&&clock>=m.acquired+20){siege(s,'upload',{fact:'a_route_v1'});m.uploaded=clock;notice(m,'Forward relay carries the acquired route fragment to Sudo. No new defense plan is included.');}
    if(m.acquired!==undefined&&!m.firstOrder&&clock>=m.acquired+30){var command=m.relay&&m.uploaded!==undefined&&clock>=m.uploaded+10?'sudo':'local';
      if(spawn(m,'approaches','adaptive_route',true)){var id='old_route_attack';observed(s,'order','approaches',{fact:'a_route_v1',command:command,order:id});m.orders[id]={tick:clock,command:command};m.firstOrder=true;notice(m,(command==='sudo'?'Sudo orders':'Local acquired knowledge directs')+' a flank toward the picket’s old route. Close it and use the tested alternative.');}
    }
    sg={phase:phase(s)};if(sg.phase==='adaptation'&&D.waves.every(function(w){return m.waves[w.id]&&m.waves[w.id].arrived!==null;})&&Object.keys(m.orders).every(function(id){return m.responded[id];}))siege(s,'advance',{phase:'hold'});
    sg={phase:phase(s)};if(sg.phase==='hold'&&clock>=1080&&D.waves.every(function(w){return m.waves[w.id].resolved;})&&IDS.every(function(k){return m.services[k];})){
      var r=Rescue.inspect(s),defended=D.rescue.sectors.every(function(sec){var a=D.rescue.units.filter(function(u){var v=r.units[u.id];return v&&v.ready&&v.sector===sec.id;});return a.reduce(function(n,u){return n+u.strength;},0)>=sec.requiredStrength&&sec.posts.every(function(post){return a.some(function(u){return r.units[u.id].post===post;});});});
      if(defended){siege(s,'advance',{phase:'complete'});notice(m,'Final hold verified. Complete the independent sweep and people count.');}
    }
  }
  function step(state,input,dt){
    var valid=validate(state);assert(valid.valid&&!valid.continuationBlocked,(valid.errors||[valid.reason]).join('; '));
    assert(Number.isFinite(dt)&&dt>0&&dt<=.25,'Mission uses bounded simulation steps');
    var s=copy(state),m=s.lowQuarterMission;input=input||{};assert(m,'Start the mission first');m.ending=s.story.ending;
    if(m.dialog){choice(s,input.choice);return s;}if(input.paused||m.stage==='closed')return s;
    m.elapsed+=dt;if(m.stage==='assault'||m.stage==='accounted')m.clock+=dt;
    if(m.branch.crossing>0&&m.branch.crossingResident){
      var crossingPerson=m.residents[m.branch.crossingResident];
      if(!m.branch.atCrossing){toward(crossingPerson,1800,72,dt);if(Math.abs(crossingPerson.x-1800)<1)m.branch.atCrossing=true;}
      else if(m.branch.stopped){m.branch.crossing=Math.min(1,m.branch.crossing+dt/8);crossingPerson.x=1800+m.branch.crossing*320;}
    }
    if(m.travel){m.travel.remaining-=dt;if(m.travel.remaining<=0){m.player.sector=m.travel.to;m.player.x=350;m.travel=null;}if(m.stage==='assault'){unitStep(s,dt);transportStep(s,dt);combatStep(s,{},dt);waveStep(s,dt);}return s;}
    var p=m.player,move=Math.max(-1,Math.min(1,Number(input.move)||0)),width=m.stage==='access'?1450:place(m).width;
    if(move){p.face=Math.sign(move);p.x=Math.max(40,Math.min(width-40,p.x+move*SPEED*dt));m.hold=null;}
    if(m.stage!=='access'){m.visitedRooms=m.visitedRooms||{};m.finalRooms=m.finalRooms||{};
      var localWave=D.waves.find(function(w){return w.sector===p.sector;});
      D.rescue.people.forEach(function(person){if(person.sector===p.sector&&Math.abs(p.x-person.x)<55){m.visitedRooms[person.id]=true;if(localWave&&m.waves[localWave.id]&&m.waves[localWave.id].resolved)m.finalRooms[person.id]=true;}});
    }
    if(input.jump&&p.jump<=0)p.vy=270;p.vy-=650*dt;p.jump=Math.max(0,p.jump+p.vy*dt);if(p.jump===0)p.vy=0;
    if(input.interact&&!move){var target=nearest(s);if(target){if(!m.hold||m.hold.id!==target.id){m.hold={id:target.id,progress:0};if(target.action==='command'){
      var probeKey=branchTask(m),local=m.ending==='shutdown'||probeKey==='local_fallback_tested';
      m.probe={key:probeKey,channel:local?'independent local line':'coordinator with local authority',coordinatorConnected:!local,elapsed:0,replies:[],load:0};
    }}
    if(target.action==='command'&&m.probe){m.probe.elapsed+=dt;
      // Two separately positioned test endpoints process an actual simulated
      // challenge. A disconnected coordinator cannot supply local replies.
      [1,2].forEach(function(endpoint){if(m.services.approaches&&m.probe.elapsed>=endpoint&&m.probe.replies.length<endpoint)m.probe.replies.push({endpoint:endpoint,channel:m.probe.channel,receivedAt:m.elapsed});});
      m.probe.load=m.services.approaches?2:0;
    }
    m.hold.progress+=dt;if(m.hold.progress>=target.duration){perform(s,target);m=s.lowQuarterMission;m.hold=null;}}}else {m.hold=null;m.probe=null;}
    if(m.stage!=='access'&&m.stage!=='closed'){unitStep(s,dt);if(m.stage!=='preparation'){transportStep(s,dt);combatStep(s,input,dt);if(m.stage==='assault')waveStep(s,dt);}}
    return s;
  }
  return {create:create,step:step,validate:validate,objects:objects,nearest:nearest,scope:Content.scope,content:Content};
});
