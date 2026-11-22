/* Hold the Way Home: owner-approved November 22 2026 game response-area content.
 * This scope is 48 residents, not the entire Low Quarter or its broader realm. */
(function(root,factory){
  var siege=typeof module==='object'&&module.exports?require('./campaign_chorus_siege.js'):root.TechOpsChorusSiege;
  var api=factory(siege);if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.TechOpsLowQuarterScenario=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Siege){
  'use strict';
  var ids=['approaches','services','shelters','departure'];
  var posts=[['a_screen','a_bend'],['s_room','s_supply'],['l_entry','l_rear'],['d_gate','d_lane']];
  var names=['Handrail approach','Secondary service room','Occupied block','Transfer court'];
  var places=ids.map(function(id,i){return {id:id,name:names[i],width:i===0||i===2?2880:1920,requiredStrength:i===0?10:8,posts:posts[i]};});
  var actors=[];ids.forEach(function(id){['witness','officer','engineer'].forEach(function(role){actors.push({id:id+'_'+role,role:role,location:id});});});
  actors.push({id:'nera',role:'witness',location:'approaches'});
  [1,2].forEach(function(n){actors.push({id:'driver_'+n,role:'engineer',location:'approaches'},{id:'attendant_'+n,role:'witness',location:'approaches'},{id:'receiver_'+n,role:'receiver',location:'receiving'});});
  var people=[];ids.forEach(function(sector,i){for(var n=1;n<=12;n++)people.push({id:'lq_'+String.fromCharCode(97+i)+'_'+String(n).padStart(2,'0'),sector:sector,label:n===1?'Resident with a care request':'Neighbor '+n,care:n===1?'travels with attendant':'ordinary care',x:620+(n-1)*36});});
  var units=[];places.forEach(function(p){p.posts.forEach(function(post){units.push({id:'mil_'+post,kind:'military',strength:4,commandModes:['independent','central','distributed']});});});
  units.push({id:'signal_picket',kind:'military',strength:2,commandModes:['independent','central','distributed']});
  ['reserve_1','reserve_2'].forEach(function(id){units.push({id:id,kind:'military',strength:4,commandModes:['independent','central','distributed']});});
  ['s_supply','d_lane'].forEach(function(post){units.push({id:'robot_'+post,kind:'robot',strength:4,commandModes:['central','distributed']});});
  var links=[];function link(a,b,t){links.push({from:a,to:b,duration:t},{from:b,to:a,duration:t});}
  link('approaches','services',20);link('approaches','shelters',25);link('services','shelters',15);link('services','departure',20);link('shelters','departure',15);
  var durations=[45,30,35,40],routes=[];ids.forEach(function(id,i){link('receiving',id,durations[i]);['primary','alternative'].forEach(function(kind){routes.push({id:id+'_'+kind,sector:id,gate:id,destination:'receiving',duration:durations[i]+(kind==='alternative'?15:0)});});});
  var common=['threat_corroborated','roster_reconciled','final_sweep_witnessed','essential_services_tested','continuity_staffed'];
  var authority={shutdown:['independent_records','manual_comms_tested','local_power_tested','human_rota','military_coalition','independent_command_tested'],control:['orpheus_coordination_tested','external_stop_tested','independent_audit','civilian_veto','risky_order_challenged'],open_network:['orpheus_coordination_tested','cooperation_earned','network_maintained','local_fallback_tested','distributed_authority_tested']};
  var checks=Array.from(new Set(common.concat.apply(common,Object.values(authority)))).map(function(id){return {id:id,location:'approaches',roles:['witness'],sources:[id+'_instrument',id+'_local_witness']};});
  var observations=[];ids.forEach(function(id){['arrival','resolution','assimilation','relay','response','order'].forEach(function(kind){observations.push({id:id+'_'+kind,kind:kind,location:id,roles:['witness'],sources:[id+'_'+kind+'_local_record',id+'_'+kind+'_independent_witness']});});});
  var definition={approved:true,rescue:{id:'lq_hold_01',revision:'r1',approved:true,encounter:Siege.AUTHORITY,
    sectors:places.map(function(p){return {id:p.id,requiredStrength:p.requiredStrength,posts:p.posts};}),actors:actors,people:people,units:units,
    vehicles:[{id:'carrier_1',capacity:6,location:'approaches'},{id:'carrier_2',capacity:6,location:'approaches'}],routes:routes,links:links,checks:checks},
    areas:Object.fromEntries(ids.map(function(id){return [id,id];})),relay:{location:'approaches',uploadDelay:20,orderDelay:10},hopperRecovery:240,
    waves:ids.map(function(id,i){return {id:'arrival_'+(i+1),sector:id,tick:120+240*i,warningTick:i===0?20:270+240*(i-1),infected:60000};}),
    facts:[{id:'a_route_v1',kind:'route',target:'approaches_primary',sector:'approaches',version:'v1',knownBy:['signal_picket']},
      {id:'a_bend_v1',kind:'post',target:'a_bend',sector:'approaches',version:'v1',knownBy:['signal_picket']},
      {id:'s_isolation_v1',kind:'service',target:'approaches_isolation',sector:'approaches',version:'v1',knownBy:['signal_picket']}],observations:observations};
  Siege.registerScenario(definition);
  return {id:'lq_hold_01',revision:'r1',definition:definition,places:places,authority:authority,
    scope:'Surveyed four-sector response area — 48 residents. Wider Low Quarter unassessed.',
    approval:'Owner approved Low-Quarter-First-Playable-Siege-Review.md on 2026-11-22; implementation only, no merge/deployment.'};
});
