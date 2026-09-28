/* Day field experience. Owns presentation/proximity only; canonical evidence and
 * closure stay in campaign_act1_investigations. Ordinary cases live in S.meta.
 * One existing dialogue owner, no polling, frame loop, teleport or music player. */
(function(root){
  'use strict';
  var active=null,returnFocus=null,lastHud='',hud=null;
  var CANON={shipping_cannot_print:{requester:'SHIPPING CLERK',need:'Print accurate customs labels before the outbound shipment leaves.',symptom:'The printer says Ready. The clerk’s labels disappear.',notification:'Your printer is ready. Your label has chosen a different career.'},plating_workstation_down:{requester:'PLATING OPERATOR / AMIT',need:'Restore the operator’s production session without disturbing the controlled process.',symptom:'The workstation is responsive. The production application cannot reconnect.',notification:'Restart complete. Your dependencies have elected to remain asleep.'}};
  function gs(){try{return typeof S!=='undefined'?S:root.S;}catch(_){return null;}}
  function world(){return root.TechOpsDayWorld;}
  function campaign(){return root.TechOpsCampaign.load(root.localStorage);}
  function escape(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function cue(name){if(root.TechOpsDayAudio)root.TechOpsDayAudio.emit(name);}
  function notify(s){if(typeof root.toast==='function')root.toast(s,3200);}
  function saveGame(){var ok=typeof save==='function'?save():typeof root.save==='function'?root.save():false;if(ok===false)throw new Error('The checkpoint could not be saved. Retry before leaving.');}
  function isDay(){var s=gs();return !!(s&&s.map&&!s.nightMode&&!(s.meta&&s.meta._standaloneMode));}
  function stationById(id){return world()&&world().stations().find(function(s){return s.id===id;});}
  function near(station){return !!(isDay()&&station&&world()&&world().at(station.id));}
  function desktopNearby(){return !!(isDay()&&world()&&world().deskNearby());}
  function unlock(){if(root.TechOpsDayAudio)root.TechOpsDayAudio.unlock({userGesture:true});}
  function guard(station){
    if(gs()&&gs().inBattle)return false;
    if(!near(station)){notify('Walk to '+(station?station.label:'the equipment')+' before using it.');return false;}
    if(!campaign().flags.day_work_unlocked){notify('Finish the morning at Mike’s desk and clock in first.');return false;}
    return true;
  }
  function routeTo(id){var target=stationById(id),s=gs();if(!s)return false;s.meta=s.meta||{};s.meta.dayRouteTarget=id;exit();var route=world()&&world().route(id);notify(route&&route.ok?'Route marked: '+(target?target.label:id):'Check the floor map for '+(target?target.label:id)+'.');syncHud();return true;}
  function canonicalStation(ticketId,screen){return ticketId==='shipping_cannot_print'?(screen?'shipping_workstation':'shipping_printer'):'plating_workstation';}
  function requireDesk(){if(desktopNearby())return true;routeTo('mike_desk');return false;}
  function release(){
    var d=root.document&&root.document.getElementById('dialogue');if(d){d.classList.remove('day-device-mode','day-workstation');d.removeAttribute('aria-labelledby');}
    if(root.document)root.document.body.classList.remove('day-device-open');
    var s=gs();if(s)s.dayInteraction=null;
    if(active&&root.TechOpsDayAudio)root.TechOpsDayAudio.onContext('field');active=null;
  }
  function exit(){var focus=returnFocus;release();if(typeof root.closeDlg==='function')root.closeDlg();if(focus&&focus.isConnected&&focus.focus)focus.focus();returnFocus=null;}
  function snapshot(station){
    if(station.ticketId&&CANON[station.ticketId]){
      var state=campaign(),I=root.TechOpsCampaignInvestigations,def=I.definition(station.ticketId),rec=I.getRecord(state,station.ticketId)||{phase:'gather',evidence:[],ruledOut:[]};
      var extra=CANON[station.ticketId],evidence=def.evidence.map(function(e,i){return Object.assign({},e,{surface:station.ticketId==='shipping_cannot_print'&&i===0?'physical':'screen',hotspot:{x:[30,70,48][i],y:[50,42,70][i]}});});
      return {canonical:true,state:state,record:rec,complete:!!state.tickets[station.ticketId],def:{title:def.title,requester:extra.requester,humanNeed:extra.need,symptom:extra.symptom,evidence:evidence,hypotheses:Object.keys(def.hypotheses).map(function(id){return {id:id,label:id.replace(/_/g,' ')};}),remediation:def.remediation,technicalCheck:def.technicalCheck,requesterCheck:def.humanVerification,authorization:'The operator confirms the process is safely held. Amit owns the change; Mike assists with the service dependency only.',notifications:[extra.notification]}};
    }
    var s=gs(),api=root.TechOpsDayCases; s.meta=s.meta||{};s.meta.dayCases=s.meta.dayCases||{};
    var record=s.meta.dayCases[station.caseId]||api.create(station.caseId);
    return {canonical:false,record:record,complete:record.phase==='complete',def:api.definition(station.caseId)};
  }
  function transact(action,value){
    if(!active)return false;var station=stationById(active.stationId);if(!gs().inDialog||!guard(station)){exit();return false;}
    var data=snapshot(station),rec=data.record,def=data.def,feedback='',sound='inspect';
    if(data.complete)return false;
    try{
      if(['observe','hypothesis','authorize','repair','technical','requester'].indexOf(action)<0)throw new Error('This field-service action is unavailable.');
      if(action==='observe'){
        var e=def.evidence.find(function(item){return item.id===value;});
        if(!e||e.surface!==active.surface)throw new Error('Use the correct physical or screen view to make that observation.');
        if(station.ticketId==='shipping_cannot_print'&&((e.surface==='physical'&&station.id!=='shipping_printer')||(e.surface==='screen'&&station.id!=='shipping_workstation')))throw new Error('This observation belongs to the other device. Follow its floor route.');
        feedback=e.text;sound='clue';
      }
      if(data.canonical){
        var I=root.TechOpsCampaignInvestigations;
        if(action==='observe')I.recordEvidence(data.state,station.ticketId,value);
        else if(action==='hypothesis'){var result=I.chooseHypothesis(data.state,station.ticketId,value);feedback=result.reason;sound=result.correct?'clue':'reject';}
        else if(action==='authorize'){
          if(station.ticketId!=='plating_workstation_down'||rec.phase!=='remediate'||rec.hypothesis!==I.definition(station.ticketId).correctHypothesis)throw new Error('Support the service-dependency cause before coordinating the operator hold.');
          var s=gs(),priorHolds=s.meta.dayOperatorHolds;s.meta.dayOperatorHolds=Object.assign({},priorHolds||{});s.meta.dayOperatorHolds[station.ticketId]=true;
          try{saveGame();}catch(holdError){if(priorHolds)s.meta.dayOperatorHolds=priorHolds;else delete s.meta.dayOperatorHolds;throw holdError;}
          feedback='Operator hold confirmed for this service change. PLC logic and interlocks remain under controls engineering.';
        }
        else if(action==='repair'){
          if(active.surface!=='screen')throw new Error('Use the workstation screen for this change.');
          if(station.ticketId==='plating_workstation_down'&&!(gs().meta.dayOperatorHolds||{})[station.ticketId])throw new Error('Coordinate the operator hold before changing the service.');
          I.applyFix(data.state,station.ticketId);feedback=def.remediation;sound='repair';
        }else if(action==='technical'){I.runTechnicalCheck(data.state,station.ticketId);feedback=def.technicalCheck;sound='verify';}
        else if(action==='requester')throw new Error('Return to the requester to witness the actual task.');
        if(action!=='authorize'&&root.TechOpsCampaign.save(data.state,root.localStorage)===false)throw new Error('The case record could not be saved. Retry this step.');
      }else{
        var api=root.TechOpsDayCases,copy=JSON.parse(JSON.stringify(rec));
        if(action==='observe')api.observe(copy,value,active.surface);
        else if(action==='hypothesis'){var result2=api.hypothesize(copy,value);feedback=result2.reason;sound=result2.correct?'clue':'reject';}
        else if(action==='authorize'){api.authorize(copy);feedback=def.authorization;}
        else if(action==='repair'){api.remediate(copy);feedback=def.remediation;sound='repair';}
        else if(action==='technical'){api.verifyTechnical(copy);feedback=def.technicalCheck;sound='verify';}
        else if(action==='requester'){api.verifyRequester(copy);feedback=def.requesterCheck;sound='verify';}
        var old=gs().meta.dayCases[station.caseId];gs().meta.dayCases[station.caseId]=copy;
        try{saveGame();}catch(err){if(old)gs().meta.dayCases[station.caseId]=old;else delete gs().meta.dayCases[station.caseId];throw err;}
      }
      active.notice=feedback||'Observation recorded.';active.error=false;cue(sound);render();return true;
    }catch(e){active.notice=e.message||String(e);active.error=true;cue('reject');render();return false;}
  }
  function button(label,action,value,extra){return '<button type="button" data-day-action="'+action+'"'+(value?' data-value="'+escape(value)+'"':'')+(extra||'')+'>'+label+'</button>';}
  function diagram(kind){
    // Technical equipment diagrams are functional inspection targets, not concept art.
    var printer=kind==='printer'||kind==='label_printer',industrial=/plc|industrial|scanner|hmi/.test(kind||''),network=/access|network|ap/.test(kind||'');
    var body=printer?'<rect x="135" y="73" width="330" height="157" rx="15" fill="#536673"/><path d="M166 73V35H434V73" fill="#9cb3ba" stroke="#d7e4e8"/><rect x="173" y="129" width="254" height="28" rx="5" fill="#081821"/><path d="M205 146H395V244H205Z" fill="#e4ded0"/><path d="M228 180H370M228 193H350M228 205H367" stroke="#657482" stroke-width="6"/><circle cx="432" cy="104" r="7" fill="#80d8bb"/>':industrial?'<rect x="107" y="31" width="386" height="222" rx="9" fill="#526571"/><rect x="132" y="53" width="193" height="155" rx="5" fill="#091e2c"/><path d="M153 159L183 116L211 145L244 96L301 129" fill="none" stroke="#81d6da" stroke-width="5"/><g fill="#263d4c" stroke="#b9cbd4"><rect x="350" y="56" width="37" height="133"/><rect x="395" y="56" width="37" height="133"/><rect x="439" y="56" width="29" height="133"/></g><path d="M357 215H461" stroke="#79c6d9" stroke-width="9"/>':network?'<rect x="95" y="82" width="410" height="130" rx="12" fill="#748a99"/><path d="M121 112H479" stroke="#172b39" stroke-width="27"/><path d="M143 101V122M183 101V122M223 101V122M263 101V122M303 101V122M343 101V122M383 101V122M423 101V122M463 101V122" stroke="#80d4ce" stroke-width="9"/><path d="M242 126V239H486" fill="none" stroke="#cca15f" stroke-width="8"/>':'<rect x="123" y="32" width="354" height="205" rx="11" fill="#4d6575"/><rect x="140" y="48" width="320" height="170" rx="4" fill="#0c2438"/><path d="M148 187L246 81L319 166L381 108L450 203" fill="none" stroke="#2d687f" stroke-width="13"/><rect x="268" y="239" width="64" height="20" fill="#718895"/><path d="M183 266H417" stroke="#b3c5cf" stroke-width="9"/><path d="M472 181H526V245" stroke="#c7a161" stroke-width="7" fill="none"/>';
    return '<svg viewBox="0 0 600 300" role="img" aria-label="'+escape(kind||'equipment')+' inspection diagram"><ellipse cx="302" cy="275" rx="227" ry="14" fill="#06121b"/>'+body+'</svg>';
  }
  function render(){
    if(!active)return;var st=stationById(active.stationId);if(!near(st)){exit();return;}
    var data=snapshot(st),def=data.def,rec=data.record,surface=active.surface,done=data.complete;
    var all=def.evidence,items=all.filter(function(e){if(e.surface!==surface)return false;if(st.ticketId==='shipping_cannot_print')return st.id==='shipping_printer'?e.surface==='physical':e.surface==='screen';return true;});
    var title=st.label||def.title,kind=st.deviceType||def.deviceKind||'desktop';
    var physical=surface==='physical',canScreen=st.id!=='shipping_printer'&&st.surface!=='physical';
    var visual=physical?'<div class="day-device-stage">'+diagram(kind)+items.map(function(e,i){return button(rec.evidence.includes(e.id)?'✓':String(i+1),'observe',e.id,' class="day-hotspot" aria-label="'+escape(e.label)+'" data-seen="'+rec.evidence.includes(e.id)+'" style="left:calc('+Math.max(8,Math.min(85,e.hotspot?e.hotspot.x:25+i*24))+'% - 22px);top:calc('+Math.max(15,Math.min(76,e.hotspot?e.hotspot.y:45))+'% - 22px)"');}).join('')+'<div class="day-stage-caption">'+escape(title)+' · PHYSICAL INSPECTION</div></div><div class="day-hotspot-labels">'+items.map(function(e,i){return button('<b>'+(rec.evidence.includes(e.id)?'✓':i+1)+'</b>'+escape(e.label),'observe',e.id);}).join('')+'</div>':
      '<div class="day-desktop"><div class="day-os-bar"><span>AERODESK // '+escape(st.supportComputer?st.supportComputer.label:'LOCAL SESSION')+'</span><span>'+escape(title)+'</span></div><div class="day-app-grid">'+items.map(function(e){return button(escape(e.label)+'<small>'+(rec.evidence.includes(e.id)?'Observation saved':'Open diagnostic view')+'</small>','observe',e.id);}).join('')+'</div><div class="day-notification">'+escape(done?'Service restored. The requester can get back to work.':(def.notifications||[])[0]||def.symptom)+'</div><div class="day-taskbar"><span>LOCAL TOOLS · CASE NOTES</span><span>'+(done?'VERIFIED':'DIAGNOSTIC SESSION')+'</span></div></div>';
    if(physical&&!items.length)visual+='<p class="day-empty">The enclosure is intact. Read the front-panel status, then use the local screen to investigate the software path.</p>';
    var actions='';
    if(done)actions='<div class="day-observation day-success"><h3>Service restored. Task verified.</h3><p>'+escape(def.requesterCheck)+'</p></div>';
    else if(rec.technicalCheckPassed||rec.technicalVerified){
      actions='<p>Technical checks passed. The requester still needs to perform the real task.</p>'+(data.canonical?button('Return to requester for verification','requester-route',st.ticketId):button('Ask '+escape(def.requester)+' to perform the task here','requester'));
    }else if(rec.fixApplied){actions='<p>'+escape(def.technicalCheck)+'</p>'+button('Run the technical verification','technical',null,' class="day-primary"');}
    else if(rec.hypothesis){
      var needsHold=data.canonical?st.ticketId==='plating_workstation_down'&&!(gs().meta.dayOperatorHolds||{})[st.ticketId]:!rec.authorized;
      actions='<p>'+escape(def.remediation)+'</p>'+(needsHold?button(escape(data.canonical?'Coordinate operator hold with Amit':'Confirm the agreed change window'),'authorize',null,' class="day-primary"'):data.canonical&&surface!=='screen'?button('Use the local screen to apply the repair','screen'):button('Apply the supported repair','repair',null,' class="day-primary"'));
    }else actions='<p>Which explanation accounts for the observations?</p>'+def.hypotheses.map(function(h){return button(escape(h.label),'hypothesis',h.id);}).join('');
    if(st.ticketId==='shipping_cannot_print')actions+=button(st.id==='shipping_printer'?'Walk to Shipping workstation':'Walk to label printer','route',st.id==='shipping_printer'?'shipping_workstation':'shipping_printer');
    var count=rec.evidence.length,phases=[count>0,!!rec.hypothesis,!!rec.fixApplied,done];
    var html='<section class="day-console" aria-labelledby="day-device-title"><header class="day-console-header"><div><span class="day-eyebrow">DAY SHIFT / '+escape(st.roomName||st.roomId||st.zoneId||'FIELD SERVICE')+'</span><h2 id="day-device-title">'+escape(title)+'</h2></div>'+button('Return to floor','exit',null,' class="day-close"')+'</header><nav class="day-stage-nav" aria-label="Device views">'+button('01 · Inspect equipment','physical',null,' aria-pressed="'+physical+'"')+(canScreen?button('02 · Use local screen','screen',null,' aria-pressed="'+!physical+'"'):'')+'<span class="day-stage-note">'+escape(def.title)+'</span></nav><div class="day-workspace"><main class="day-main"><div class="day-request"><span class="day-eyebrow">'+escape(def.requester)+'</span><h3>'+escape(def.symptom)+'</h3><p>'+escape(def.humanNeed)+'</p></div>'+visual+(active.notice?'<div class="day-observation" role="status" aria-live="polite"><strong>'+(active.error?'Review the evidence':'Field note')+'</strong><p>'+escape(active.notice)+'</p></div>':'')+'</main><aside class="day-evidence"><ol class="day-progress">'+['Observe','Diagnose','Repair','Verify'].map(function(p,i){return '<li data-done="'+phases[i]+'">'+p+'</li>';}).join('')+'<h3>Evidence · '+count+' / '+all.length+'</h3>'+(count?rec.evidence.map(function(id){var e=all.find(function(x){return x.id===id;});return e?'<div class="day-evidence-item"><strong>'+escape(e.label)+'</strong>'+escape(e.text)+'</div>':'';}).join(''):'<p class="day-empty">Click an inspection point or a diagnostic tool. Every conclusion needs an observation.</p>')+'<div class="day-actions">'+actions+'</div></aside></div><footer class="day-console-footer"><span>Floor → Equipment → Local session → Verified work</span><span>Progress saves after each accepted action · Esc to leave</span></footer></section>';
    var owner=active,box=root.document.getElementById('dlg-text');box.onclick=null;box.innerHTML=html;
    box.querySelectorAll('[data-day-action]').forEach(function(b){b.onclick=function(){unlock();var a=b.dataset.dayAction,v=b.dataset.value;
      if(active!==owner||!gs().inDialog||!near(st))return false;
      if(a==='exit')return exit();if(a==='route')return routeTo(v);
      if(a==='requester-route')return goRequester(v);
      if(a==='physical'||a==='screen'){if(a==='screen'&&!canScreen)return;active.surface=a;active.notice='';gs().dayInteraction=a==='screen'?'workstation':'inspect';if(root.TechOpsDayAudio)root.TechOpsDayAudio.onContext(a==='screen'?'desktop':'inspection');cue('transition');render();return;}
      transact(a,v);
    };});
    gs().dayInteraction=surface==='screen'?'workstation':'inspect';
  }
  function openDevice(station){
    station=stationById(typeof station==='string'?station:station&&station.id);
    if(station&&station.id==='mike_desk'){if(!desktopNearby()||gs().inBattle)return false;return root.TechOpsCampaignNativeAct1.openWorkstation();}
    if(!guard(station))return false;
    if(station.id==='security_workstation')return root.TechOpsCampaignNativeAct1.recordAccessEvidence();
    if(station.ticketId&&!root.TechOpsCampaignInvestigations){notify('Diagnostic tools are still loading. Try again in a moment.');return false;}
    returnFocus=root.document.activeElement;unlock();root.dlg('FIELD SERVICE','',[]);
    active={stationId:station.id,surface:'physical',notice:'',error:false};var d=root.document.getElementById('dialogue');d.classList.add('day-device-mode');d.setAttribute('aria-labelledby','day-device-title');root.document.body.classList.add('day-device-open');
    if(root.TechOpsDayAudio)root.TechOpsDayAudio.onContext('inspection');cue('transition');render();d.querySelector('button').focus();return true;
  }
  function goRequester(ticketId){var s=gs(),key=ticketId==='shipping_cannot_print'?'shipping':'plating';s.meta.dayRouteTarget=key;if(world())world().route(key);exit();notify('Return to the '+(key==='shipping'?'Shipping clerk':'Plating operator')+' to verify the actual task.');syncHud();}
  function requesterNearby(ticketId){
    var s=gs(),key=ticketId==='shipping_cannot_print'?'shipping':'plating',p=s&&s.meta&&s.meta.campaignAct1Native&&s.meta.campaignAct1Native[key];
    return !!(CANON[ticketId]&&isDay()&&!s.inBattle&&p&&Math.abs(s.px-p.x)+Math.abs(s.py-p.y)<=1);
  }
  function talk(ticketId){
    if(!requesterNearby(ticketId))return false;
    var N=root.TechOpsCampaignNativeAct1,C=campaign(),data=CANON[ticketId];if(!data)return false;
    if(!C.flags.day_work_unlocked){root.dlg(data.requester,'The shift is paused. Finish the morning at Mike’s desk before taking field work.',[{t:'Mark the route to Mike’s desk',f:function(){routeTo('mike_desk');}},{t:'Back',f:root.closeDlg}]);return true;}
    if(C.tickets[ticketId])return N.openTicketFollowUp(ticketId);
    var I=root.TechOpsCampaignInvestigations,rec=I&&I.getRecord(C,ticketId);
    if(rec&&rec.technicalCheckPassed){root.dlg(data.requester,escape(I.definition(ticketId).humanVerification)+'<br><br>The technical check alone did not close this incident.',[{t:'Witness the requester’s successful task',f:function(){try{if(!requesterNearby(ticketId)||!gs().inDialog)throw new Error('Return to the requester before verifying the real task.');var current=campaign();I.verifyHumanOutcome(current,ticketId);if(root.TechOpsCampaign.save(current,root.localStorage)===false)throw new Error('The verified outcome could not be saved. Retry before closing.');cue('verify');root.dlg('SERVICE RESTORED',escape(I.definition(ticketId).humanVerification),[{t:'Return to work',f:root.closeDlg}]);}catch(e){notify(e.message);} }},{t:'Keep the verification open',f:root.closeDlg}]);return true;}
    root.dlg(data.requester,escape(data.need)+'<br><br>'+escape(data.symptom)+(ticketId==='plating_workstation_down'?'<br><br>Amit owns this incident. Coordinate with him and the operator before any change.':''),[{t:'Mark the route to the equipment',f:function(){routeTo(canonicalStation(ticketId,false));}},{t:'Back to floor',f:root.closeDlg}]);return true;
  }
  function interact(){
    var s=gs();if(!isDay()||s.inDialog||s.inBattle)return false;
    if(world())world().ensureWorld();
    var n=world()&&world().nearby()[0];if(!n)return false;
    if(n.id==='mike_desk'){root.TechOpsCampaignNativeAct1.openWorkstation();return true;}
    if(n.ticketId||n.caseId){openDevice(n);return true;}return false;
  }
  function workstationSkin(name){
    var d=root.document&&root.document.getElementById('dialogue');if(!d)return;
    if(desktopNearby()&&/WORKSTATION|COMPANY|ENGINEERING THE HUMAN|MIKE \/\//.test(name)){d.classList.add('day-workstation');gs().dayInteraction='workstation';}
  }
  function syncHud(){
    if(!root.document)return;if(active&&!isDay())release();var s=gs(),visible=isDay()&&!s.inDialog&&!s.inBattle;var title=root.document.getElementById('title-screen');if(title&&!title.classList.contains('hidden'))visible=false;
    if(!hud){hud=root.document.createElement('section');hud.id='day-route-hud';hud.setAttribute('aria-label','Day shift objective');root.document.body.appendChild(hud);}
    hud.hidden=!visible;if(!visible){lastHud='';return;}
    var w=world();if(!w)return;w.ensureWorld();var objective=w.nextObjective()||{},nearby=w.nearby()[0];
    var target=s.meta.dayRouteTarget||objective.stationId||objective.targetId||objective.id;
    var data={title:objective.title||objective.label||'Day shift',detail:objective.detail||objective.description||'Follow the workday. Inspect before making changes.',target:target,near:nearby&&nearby.id};var key=JSON.stringify(data);if(key===lastHud)return;lastHud=key;
    hud.innerHTML='<header>AEROTECH / FIELD OPERATIONS</header><div class="day-objective"><strong>'+escape(data.title)+'</strong><small>'+escape(data.detail)+'</small></div>'+(nearby?'<div class="day-nearby">E / A · '+escape(nearby.id==='mike_desk'?'Use Mike’s workstation':'Inspect '+nearby.label)+'</div>':'')+'<button type="button" data-day-route>Show floor route</button><button type="button" data-day-jobs>Field service board</button>';
    hud.querySelector('[data-day-route]').onclick=function(){routeTo(target||'mike_desk');};hud.querySelector('[data-day-jobs]').onclick=openBoard;
  }
  function openBoard(){
    if(!isDay()||gs().inDialog)return;var c=campaign(),options=[];
    options.push({t:'Main objective — '+(world().nextObjective().title||world().nextObjective().label||'Day shift'),f:function(){var o=world().nextObjective();routeTo(o.stationId||o.target||o.targetId||o.id||'mike_desk');}});
    if(c.flags.day_work_unlocked)world().stations().filter(function(st){return st.caseId;}).forEach(function(st){var r=(gs().meta.dayCases||{})[st.caseId];options.push({t:(r&&r.phase==='complete'?'✓ ':'')+st.label,f:function(){routeTo(st.id);}});});
    options.push({t:'Back to floor',f:root.closeDlg});root.dlg('FIELD SERVICE BOARD','The story work stays first. Optional service calls develop your investigation skills and keep the factory running. Choose a destination to mark its walking route.',options);
  }
  function keydown(e){if(!active)return;if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();exit();return;}if(e.key==='Tab'){var list=Array.from(root.document.querySelectorAll('#dialogue.day-device-mode button:not(:disabled)'));if(!list.length)return;var first=list[0],last=list[list.length-1];if(e.shiftKey&&root.document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&root.document.activeElement===last){e.preventDefault();first.focus();}}if(/^(Arrow| |Enter$|[wasdemv]$)/i.test(e.key))e.stopPropagation();}
  if(root.document)root.document.addEventListener('keydown',keydown,true);
  root.TechOpsDayExperience={VERSION:1,openDevice:openDevice,talk:talk,interact:interact,routeTo:routeTo,requireDesk:requireDesk,desktopNearby:desktopNearby,release:release,exit:exit,render:render,syncHud:syncHud,workstationSkin:workstationSkin,transact:transact,active:function(){return active;},openBoard:openBoard};
})(typeof globalThis!=='undefined'?globalThis:this);
