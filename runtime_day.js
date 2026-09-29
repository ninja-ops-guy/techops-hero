/* Day field experience. Owns presentation/proximity only; canonical evidence and
 * closure stay in campaign_act1_investigations. Ordinary cases live in S.meta.
 * One existing dialogue owner, no polling, frame loop, teleport or music player. */
(function(root){
  'use strict';
  var active=null,returnFocus=null,lastHud='',hud=null,targetMenuOwner=0;
  var CANON={shipping_cannot_print:{requester:'SHIPPING CLERK',need:'Print accurate customs labels before the outbound shipment leaves.',symptom:'The printer says Ready. The clerk’s labels disappear.',notification:'Your printer is ready. Your label has chosen a different career.'},plating_workstation_down:{requester:'PLATING OPERATOR / AMIT',need:'Restore the operator’s production session without disturbing the controlled process.',symptom:'The workstation is responsive. The production application cannot reconnect.',notification:'Restart complete. Your dependencies have elected to remain asleep.'}};
  function gs(){try{return typeof S!=='undefined'?S:root.S;}catch(_){return null;}}
  function world(){return root.TechOpsDayWorld;}
  function campaign(){return root.TechOpsCampaign.load(root.localStorage);}
  function escape(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function cue(name){if(root.TechOpsDayAudio)root.TechOpsDayAudio.emit(name);}
  function notify(s){if(typeof root.toast==='function')root.toast(s,3200);}
  function saveGame(){var ok=typeof save==='function'?save():typeof root.save==='function'?root.save():false;if(ok===false)throw new Error('The checkpoint could not be saved. Retry before leaving.');}
  function isDay(){var s=gs();return !!(s&&s.map&&!s.room&&!s.nightMode&&!(s.meta&&s.meta._standaloneMode));}
  function stationById(id){return world()&&world().stations().find(function(s){return s.id===id;});}
  function near(station){return !!(isDay()&&station&&world()&&world().at(station.id));}
  function sideDeskNearby(){var s=gs();return !!(s&&!s.nightMode&&!s.inBattle&&s.room&&s.room.id==='itdept'&&Math.abs(s.room.x-.82)<=.06);}
  function desktopNearby(){if(sideDeskNearby())return true;return !!(isDay()&&world()&&world().deskNearby());}
  function unlock(){if(root.TechOpsDayAudio)root.TechOpsDayAudio.unlock({userGesture:true});}
  function guard(station){
    if(gs()&&gs().inBattle)return false;
    if(!near(station)){notify('Walk to '+(station?station.label:'the equipment')+' before using it.');return false;}
    if(!campaign().flags.day_work_unlocked){notify('Finish the morning at Mike’s desk and clock in first.');return false;}
    return true;
  }
  function routeTo(id){var target=stationById(id),s=gs();if(!s)return false;s.meta=s.meta||{};s.meta.dayRouteTarget=id;exit();if(id==='mike_desk'&&s.room&&s.room.id==='itdept'){notify('Mike’s desk is on the right side of this room. Walk over and press E.');return true;}var route=world()&&world().route(id);notify(s.room?'Route saved. Walk to the glowing room exit or press Q to return to the floor.':route&&route.ok?'Route marked: '+(target?target.label:id):'Check the floor map for '+(target?target.label:id)+'.');syncHud();return true;}
  function canonicalStation(ticketId,screen){return ticketId==='shipping_cannot_print'?(screen?'shipping_workstation':'shipping_printer'):'plating_workstation';}
  function requireDesk(){if(desktopNearby())return true;routeTo('mike_desk');return false;}
  function release(){
    if(standupTimer)root.clearTimeout(standupTimer);standupTimer=null;
    if(root.TechOpsDayDesktop)root.TechOpsDayDesktop.release();
    targetMenuOwner++;
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
      if(action==='technical'&&active.surface!=='screen')throw new Error('Use the local diagnostic screen to verify the technical path.');
      if(action==='repair'&&active.surface!==(data.canonical?'screen':def.repairSurface||'screen'))throw new Error('Use the '+(data.canonical?'screen':def.repairSurface||'screen')+' view for this repair.');
      if(action==='observe'){
        active.app=value;
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
  function diagram(kind,repaired){
    // Coordinate-aligned equipment drawings keep the clue on the actual component.
    var body='',ink='#132936',edge='#9aadb7',metal='#516876',light='#ced7d8',cyan='#81d4ce',gold='#d8ad68';
    if(kind==='laptop'){
      body='<path d="M155 176V43Q155 32 166 32H353Q364 32 364 43V176" fill="'+metal+'"/><rect x="166" y="44" width="187" height="122" rx="3" fill="'+ink+'"/><path d="M183 64H302M183 80H330M183 99H259" stroke="#477482" stroke-width="4"/><path d="M151 176H368L393 227H130Z" fill="#83969f"/><path d="M172 185H351L361 207H162Z" fill="#263e4b"/><path d="M185 188L182 204M207 188L205 204M229 188V204M251 188V204M273 188V204M295 188L297 204M317 188L320 204M170 196H355" stroke="#66828e" stroke-width="2"/><path d="M230 212H285L288 222H227Z" fill="#b9c6ca"/><path d="M130 227H393V234H130Z" fill="#3b5361"/><rect x="126" y="182" width="19" height="13" rx="3" fill="#06161f"/><path d="'+(repaired?'M122 183H142V195H122Z':'M102 183H122V195H102Z')+'" fill="'+light+'"/><rect x="'+(repaired?113:93)+'" y="181" width="15" height="17" rx="3" fill="'+gold+'"/><path d="'+(repaired?'M115 190H70V252H470V189':'M95 190H70V252H470V189')+'" fill="none" stroke="'+gold+'" stroke-width="5"/>'+(repaired?'':'<path d="M123 184V194" stroke="#f2d398" stroke-width="2"/>')+'<rect x="419" y="129" width="130" height="64" rx="7" fill="'+metal+'"/><rect x="431" y="168" width="48" height="10" rx="2" fill="'+ink+'"/><path d="M488 173H537" stroke="#263e4b" stroke-width="7"/><circle cx="456" cy="153" r="5" fill="'+cyan+'"/><circle cx="491" cy="153" r="4" fill="'+(repaired?cyan:ink)+'"/><path d="M504 129V84H561V222H548" fill="none" stroke="#728993" stroke-width="4"/><path d="M510 187V221H542V240" fill="none" stroke="#728993" stroke-width="4"/>';
    }else if(kind==='mini_pc'){
      body='<rect x="72" y="25" width="367" height="172" rx="8" fill="'+metal+'"/><rect x="84" y="37" width="343" height="148" rx="3" fill="'+ink+'"/>'+(repaired?'':'<rect x="99" y="52" width="312" height="21" rx="2" fill="#554b34"/>')+'<path d="M115 62H196M111 100H294M111 120H352M111 140H315" stroke="#749198" stroke-width="4"/><path d="M237 198V226M199 229H277" stroke="'+edge+'" stroke-width="10"/><path d="M393 196V212H354V199" fill="none" stroke="'+gold+'" stroke-width="5"/><rect x="345" y="180" width="142" height="73" rx="8" fill="#526a77"/><path d="M355 199V239" stroke="#253e4c" stroke-width="3"/><rect x="358" y="184" width="18" height="11" rx="2" fill="#c9b380"/><circle cx="463" cy="218" r="5" fill="'+cyan+'"/><path d="M382 217H437M382 225H437M382 233H437" stroke="#1d3543" stroke-width="3"/><path d="M484 229H526V263" fill="none" stroke="#7c96a0" stroke-width="4"/>';
    }else if(kind==='printer'||kind==='label_printer'){
      body='<path d="M154 86V34H411V86" fill="'+light+'"/><path d="M176 51H386M176 65H339" stroke="#7c9099" stroke-width="3"/><rect x="94" y="83" width="384" height="145" rx="13" fill="'+metal+'"/><path d="M94 118H478" stroke="#7c929f" stroke-width="3"/><rect x="384" y="93" width="63" height="15" rx="3" fill="#213d49"/><circle cx="455" cy="100" r="4" fill="'+cyan+'"/><rect x="109" y="139" width="337" height="42" rx="4" fill="#0c202b"/><path d="M139 157H372L399 244H119Z" fill="#e5e1d7"/><path d="M159 182H356M151 199H369M144 218H295" stroke="#74828a" stroke-width="4"/><path d="M113 228V248H411V230M438 157V204" fill="none" stroke="#91a5af" stroke-width="5"/><path d="M109 151H132" stroke="'+gold+'" stroke-width="3"/>';
    }else if(kind==='plc_hmi'||kind==='hmi'||kind==='plc'){
      body='<rect x="104" y="27" width="394" height="228" rx="8" fill="'+metal+'"/><rect x="125" y="49" width="185" height="151" rx="5" fill="'+ink+'"/><path d="M143 70H229M143 92H285" stroke="#547a87" stroke-width="4"/><path d="M145 162H188V125H224V143H286" fill="none" stroke="'+cyan+'" stroke-width="4"/><path d="M144 182H244" stroke="'+gold+'" stroke-width="4"/><rect x="329" y="50" width="145" height="100" rx="4" fill="#2b4350"/><circle cx="348" cy="87" r="7" fill="'+cyan+'"/><circle cx="386" cy="87" r="7" fill="#152d3a"/><circle cx="424" cy="87" r="7" fill="#152d3a"/><path d="M337 116H461M337 129H438" stroke="#7b919c" stroke-width="3"/><rect x="329" y="166" width="145" height="64" rx="3" fill="#415a68"/><circle cx="358" cy="196" r="11" fill="#173644"/><circle cx="441" cy="196" r="16" fill="#b29853"/><circle cx="441" cy="196" r="10" fill="#854e49"/><path d="M113 243H485" stroke="#233c4a" stroke-width="3"/><g fill="#b8c5ca"><circle cx="116" cy="39" r="3"/><circle cx="485" cy="39" r="3"/><circle cx="116" cy="243" r="3"/><circle cx="485" cy="243" r="3"/></g>';
    }else if(kind==='industrial_scanner'||kind==='scanner'){
      body='<rect x="82" y="41" width="213" height="124" rx="7" fill="'+metal+'"/><rect x="93" y="52" width="190" height="99" rx="3" fill="'+ink+'"/><path d="M110 74H245M110 92H226M110 127H175" stroke="#6896a1" stroke-width="4"/><path d="M183 166V193M139 198H229" stroke="'+edge+'" stroke-width="9"/><path d="M396 74L457 105L442 139L412 128L392 191L365 182L382 117L373 109Z" fill="#73909b"/><path d="M386 81L444 110L437 124L380 99Z" fill="#162f3d"/><path d="M394 89L438 111" stroke="'+cyan+'" stroke-width="3"/><path d="M378 192V221Q378 237 402 237H461V264" fill="none" stroke="#667f8c" stroke-width="4"/><rect x="260" y="168" width="79" height="70" rx="3" fill="#b4c1c4"/><rect x="272" y="177" width="21" height="26" rx="2" fill="#182e39"/><rect x="277" y="188" width="14" height="17" rx="2" fill="'+gold+'"/><circle cx="303" cy="189" r="3" fill="'+cyan+'"/><path d="M284 204V247H238V221H198V165" fill="none" stroke="'+gold+'" stroke-width="4"/><path d="M273 220H325" stroke="#5b737e" stroke-width="4"/>';
    }else if(kind==='access_point'||kind==='network'||kind==='ap'){
      body='<path d="M69 22H250" stroke="#718993" stroke-width="4"/><path d="M104 25H212L225 54Q225 88 157 88Q88 88 88 54Z" fill="#b8c5ca"/><path d="M97 51H216" stroke="#8c9ea5" stroke-width="3"/><ellipse cx="138" cy="57" rx="10" ry="4" fill="'+(repaired?cyan:'#344952')+'"/><path d="M194 87V119H525V231H496" stroke="#526f7d" stroke-width="4" stroke-dasharray="7 6" fill="none"/><rect x="73" y="155" width="430" height="80" rx="6" fill="'+metal+'"/><path d="M86 166H489M86 223H489" stroke="#8b9fa9" stroke-width="2"/><g fill="#112b39"><rect x="116" y="180" width="31" height="20" rx="2"/><rect x="171" y="180" width="31" height="20" rx="2"/><rect x="226" y="180" width="31" height="20" rx="2"/><rect x="281" y="180" width="31" height="20" rx="2"/><rect x="336" y="180" width="31" height="20" rx="2"/><rect x="391" y="180" width="31" height="20" rx="2"/></g><path d="'+(repaired?'M124 185H140V201H124Z':'M124 195H140V211H124Z')+'" fill="#c3cbd0"/><path d="'+(repaired?'M131 201V262H91':'M131 211V262H91')+'" fill="none" stroke="'+gold+'" stroke-width="5"/><path d="'+(repaired?'M127 186H135':'M127 192L135 187')+'" stroke="'+gold+'" stroke-width="2"/><path d="M183 197V249H458V236M238 197V257H479V236" fill="none" stroke="#728e9a" stroke-width="4"/><g fill="'+cyan+'"><circle cx="192" cy="211" r="3"/><circle cx="247" cy="211" r="3"/><circle cx="301" cy="211" r="3"/></g><circle cx="138" cy="216" r="3" fill="'+(repaired?cyan:'#1c3542')+'"/><path d="M118 172H144" stroke="#bac5ca" stroke-width="3"/>';
    }else if(kind==='time_clock'){
      body='<rect x="71" y="25" width="356" height="238" rx="14" fill="'+metal+'"/><rect x="88" y="44" width="228" height="99" rx="5" fill="'+ink+'"/><text x="105" y="99" fill="'+light+'" font-family="monospace" font-size="37" letter-spacing="3">'+(repaired?'SYNC':'07:42')+'</text><path opacity="'+(repaired?'0':'1')+'" d="M278 56L297 87H259Z" fill="'+gold+'"/><path opacity="'+(repaired?'0':'1')+'" d="M278 66V76M278 80V82" stroke="#283f4b" stroke-width="3"/><path d="M104 123H225" stroke="#78949f" stroke-width="4"/><rect x="339" y="63" width="58" height="144" rx="5" fill="#29434f"/><path d="M350 81H386M350 92H386M350 103H386M350 114H386M350 125H386" stroke="#65818e" stroke-width="3"/><g fill="#1e3745"><rect x="103" y="162" width="51" height="22" rx="3"/><rect x="170" y="162" width="51" height="22" rx="3"/><rect x="237" y="162" width="51" height="22" rx="3"/><rect x="103" y="197" width="51" height="22" rx="3"/><rect x="170" y="197" width="51" height="22" rx="3"/><rect x="237" y="197" width="51" height="22" rx="3"/></g><circle cx="359" cy="233" r="4" fill="'+cyan+'"/><circle cx="380" cy="233" r="4" fill="'+cyan+'"/><path d="M425 224H468V265" stroke="#7694a0" stroke-width="4" fill="none"/>';
    }else{
      body='<rect x="81" y="35" width="282" height="171" rx="8" fill="'+metal+'"/><rect x="93" y="47" width="258" height="146" rx="3" fill="'+ink+'"/><rect x="112" y="65" width="156" height="13" rx="2" fill="#4f7785"/><path d="M112 98H324M112 114H299M112 130H310" stroke="#446773" stroke-width="4"/><path d="M112 157H302" stroke="#2b4b5b" stroke-width="10"/><path d="M112 157H215" stroke="'+cyan+'" stroke-width="10"/><path d="M213 208V235M170 239H267" stroke="'+edge+'" stroke-width="10"/><rect x="384" y="47" width="106" height="198" rx="7" fill="#586e7b"/><path d="M399 66H475M399 81H475" stroke="#233f4d" stroke-width="5"/><circle cx="408" cy="129" r="7" fill="'+cyan+'"/><path d="M434 123H472M434 138H472M400 182H475M400 192H475M400 202H475M400 212H475" stroke="#2b4654" stroke-width="4"/><path d="M362 170H379V228" fill="none" stroke="#7a929c" stroke-width="4"/><path d="M94 255H317L330 272H83Z" fill="#687f8c"/>';
    }
    return '<svg viewBox="0 0 600 300" role="img" aria-label="'+escape(kind||'equipment')+' inspection diagram"><ellipse cx="302" cy="279" rx="235" ry="10" fill="#06121b"/>'+body+'</svg>';
  }
  function render(){
    if(!active)return;var st=stationById(active.stationId);if(!near(st)){exit();return;}
    var data=snapshot(st),def=data.def,rec=data.record,surface=active.surface,done=data.complete;
    var all=def.evidence,items=all.filter(function(e){if(e.surface!==surface)return false;if(st.ticketId==='shipping_cannot_print')return st.id==='shipping_printer'?e.surface==='physical':e.surface==='screen';return true;});
    var title=st.label||def.title,kind=st.deviceType||def.deviceKind||'desktop';
    var physical=surface==='physical',canScreen=st.id!=='shipping_printer'&&st.surface!=='physical';
    var visual=physical?'<div class="day-device-stage">'+diagram(kind,rec.fixApplied||done)+items.map(function(e,i){return button(rec.evidence.includes(e.id)?'✓':String(i+1),'observe',e.id,' class="day-hotspot" aria-label="'+escape(e.label)+'" data-seen="'+rec.evidence.includes(e.id)+'" style="left:calc('+Math.max(8,Math.min(85,e.hotspot?e.hotspot.x:25+i*24))+'% - 22px);top:calc('+Math.max(15,Math.min(76,e.hotspot?e.hotspot.y:45))+'% - 22px)"');}).join('')+'<div class="day-stage-caption">'+escape(title)+' · PHYSICAL INSPECTION</div></div><div class="day-hotspot-labels">'+items.map(function(e,i){return button('<b>'+(rec.evidence.includes(e.id)?'✓':i+1)+'</b>'+escape(e.label),'observe',e.id);}).join('')+'</div>':
      '<div class="day-desktop"><div class="day-os-bar"><span>AERODESK // '+escape(st.supportComputer?st.supportComputer.label:'LOCAL SESSION')+'</span><span>'+escape(title)+'</span></div><div class="day-app-grid">'+items.map(function(e){return button(escape(e.label)+'<small>'+(rec.evidence.includes(e.id)?'Observation saved':'Open diagnostic view')+'</small>','observe',e.id);}).join('')+'</div>'+(active.app&&active.notice?'<section class="day-diagnostic-window"><header>◈ '+escape((items.find(function(e){return e.id===active.app;})||{}).label||'Diagnostic result')+'</header><div class="day-diagnostic-body"><span>LOCAL RESULT / READ ONLY</span><p>'+escape(active.notice)+'</p></div></section>':'')+'<div class="day-notification">'+escape(done?'Service restored. The requester can get back to work.':(def.notifications||[])[0]||def.symptom)+'</div><div class="day-taskbar"><span>LOCAL TOOLS · CASE NOTES</span><span>'+(done?'VERIFIED':'DIAGNOSTIC SESSION')+'</span></div></div>';
    if(physical&&!items.length)visual+='<p class="day-empty">The enclosure is intact. Read the front-panel status, then use the local screen to investigate the software path.</p>';
    var actions='';
    if(done)actions='<div class="day-observation day-success"><h3>Service restored. Task verified.</h3><p>'+escape(def.requesterCheck)+'</p></div>';
    else if(data.canonical&&rec.phase==='workaround_verify'){
      actions='<p>The temporary workaround is ready. The requester must confirm the limited workflow before a partial handoff.</p>'+button('Return to requester to verify limited service','requester-route',st.ticketId);
    }else if(rec.technicalCheckPassed||rec.technicalVerified){
      actions='<p>Technical checks passed. The requester still needs to perform the real task.</p>'+(data.canonical?button('Return to requester for verification','requester-route',st.ticketId):button('Ask '+escape(def.requester)+' to perform the task here','requester'));
    }else if(rec.fixApplied){actions='<p>'+escape(def.technicalCheck)+'</p>'+button(surface==='screen'?'Run the technical verification':canScreen?'Use the local screen for verification':'Walk to the workstation for verification',surface==='screen'?'technical':canScreen?'screen':'route',canScreen?null:canonicalStation(st.ticketId,true),' class="day-primary"');}
    else if(rec.hypothesis){
      var needsHold=data.canonical?st.ticketId==='plating_workstation_down'&&!(gs().meta.dayOperatorHolds||{})[st.ticketId]:!rec.authorized;
      var repairView=data.canonical?'screen':def.repairSurface||'screen';
      actions='<p>'+escape(def.remediation)+'</p>'+(needsHold?button(escape(data.canonical?'Coordinate operator hold with Amit':'Confirm the agreed change window'),'authorize',null,' class="day-primary"'):surface!==repairView?button(repairView==='physical'?'Inspect the external connector to apply the repair':canScreen?'Use the local screen to apply the repair':'Walk to the workstation to apply the repair',repairView==='screen'&&!canScreen?'route':repairView,repairView==='screen'&&!canScreen?canonicalStation(st.ticketId,true):null):button('Apply the supported repair','repair',null,' class="day-primary"'));
    }else actions='<p>Which explanation accounts for the observations?</p>'+def.hypotheses.map(function(h){return button(escape(h.label),'hypothesis',h.id);}).join('');
    if(st.ticketId==='shipping_cannot_print')actions+=button(st.id==='shipping_printer'?'Walk to Shipping workstation':'Walk to label printer','route',st.id==='shipping_printer'?'shipping_workstation':'shipping_printer');
    var count=rec.evidence.length,phases=[count>0,!!rec.hypothesis,!!rec.fixApplied,done];
    var html='<section class="day-console" aria-labelledby="day-device-title"><header class="day-console-header"><div><span class="day-eyebrow">DAY SHIFT / '+escape(st.roomName||st.roomId||st.zoneId||'FIELD SERVICE')+'</span><h2 id="day-device-title">'+escape(title)+'</h2></div>'+button('Return to floor','exit',null,' class="day-close"')+'</header><nav class="day-stage-nav" aria-label="Device views">'+button('01 · Inspect equipment','physical',null,' aria-pressed="'+physical+'"')+(canScreen?button('02 · Use local screen','screen',null,' aria-pressed="'+!physical+'"'):'')+'<span class="day-stage-note">'+escape(def.title)+'</span></nav><div class="day-workspace"><main class="day-main"><div class="day-request"><span class="day-eyebrow">'+escape(def.requester)+'</span><h3>'+escape(def.symptom)+'</h3><p>'+escape(def.humanNeed)+'</p></div>'+visual+(active.notice?'<div class="day-observation" role="status" aria-live="polite"><strong>'+(active.error?'Review the evidence':'Field note')+'</strong><p>'+escape(active.notice)+'</p></div>':'')+'</main><aside class="day-evidence"><ol class="day-progress">'+['Observe','Diagnose','Repair','Verify'].map(function(p,i){return '<li data-done="'+phases[i]+'">'+p+'</li>';}).join('')+'</ol><h3>Evidence · '+count+' / '+all.length+'</h3>'+(count?rec.evidence.map(function(id){var e=all.find(function(x){return x.id===id;});return e?'<div class="day-evidence-item"><strong>'+escape(e.label)+'</strong>'+escape(e.text)+'</div>':'';}).join(''):'<p class="day-empty">Click an inspection point or a diagnostic tool. Every conclusion needs an observation.</p>')+'<div class="day-actions">'+actions+'</div></aside></div><footer class="day-console-footer"><span>Floor → Equipment → Local session → Verified work</span><span>Progress saves after each accepted action · Esc to leave</span></footer></section>';
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
    if(station.ticketId&&CANON[station.ticketId]){
      var state=campaign(),followup=state.flags.tuesday_morning_reached&&root.TechOpsCampaign.workdayHandoff(state).find(function(item){return item.ticketId===station.ticketId;});
      if(followup&&followup.kind!=='carryover')return root.TechOpsCampaignNativeAct1.openWorkdayFollowup(station.ticketId);
    }
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
    if(rec&&rec.phase==='workaround_verify'){
      root.dlg(data.requester,escape(I.definition(ticketId).workaroundCheck)+'<br><br>This confirms limited service. The durable repair remains a next-shift follow-up.',[{t:'Requester confirms limited service',f:function(){try{if(!requesterNearby(ticketId)||!gs().inDialog)throw new Error('Return to the requester before verifying limited service.');var current=campaign();I.verifyWorkaroundOutcome(current,ticketId);if(root.TechOpsCampaign.save(current,root.localStorage)===false)throw new Error('The limited-service outcome could not be saved.');gs().meta.dayRouteTarget=null;if(world())world().route(null);cue('verify');root.dlg('LIMITED SERVICE VERIFIED','The requester confirmed the workaround. Partial verification and degraded service are recorded; the remaining repair stays in the handoff.',[{t:'Return to work',f:root.closeDlg}]);}catch(error){notify(error.message);}}},{t:'Keep the handoff open',f:root.closeDlg}]);return true;
    }
    if(rec&&rec.technicalCheckPassed){root.dlg(data.requester,escape(I.definition(ticketId).humanVerification)+'<br><br>The technical check alone did not close this incident.',[{t:'Witness the requester’s successful task',f:function(){try{if(!requesterNearby(ticketId)||!gs().inDialog)throw new Error('Return to the requester before verifying the real task.');var current=campaign();I.verifyHumanOutcome(current,ticketId);if(root.TechOpsCampaign.save(current,root.localStorage)===false)throw new Error('The verified outcome could not be saved. Retry before closing.');cue('verify');root.dlg('SERVICE RESTORED',escape(I.definition(ticketId).humanVerification),[{t:'Return to work',f:root.closeDlg}]);}catch(e){notify(e.message);} }},{t:'Keep the verification open',f:root.closeDlg}]);return true;}
    root.dlg(data.requester,escape(data.need)+'<br><br>'+escape(data.symptom)+(ticketId==='plating_workstation_down'?'<br><br>Amit owns this incident. Coordinate with him and the operator before any change.':''),[{t:'Mark the route to the equipment',f:function(){routeTo(canonicalStation(ticketId,false));}},{t:'Back to floor',f:root.closeDlg}]);return true;
  }
  function nearbyTargets(){
    var s=gs(),w=world();if(!isDay()||!w)return [];var result=w.nearby().slice(),native=s.meta&&s.meta.campaignAct1Native||{};
    [{id:'standup',label:s.day>=2?'Shift handoff board':'Morning standup board'},{id:'shipping',label:'Shipping clerk',ticketId:'shipping_cannot_print'},{id:'plating',label:'Plating operator',ticketId:'plating_workstation_down'},{id:'access',label:'Security Ops'}].forEach(function(item){var p=native[item.id];if(p&&Math.abs(s.px-p.x)+Math.abs(s.py-p.y)<=1)result.push(Object.assign({},item,{kind:'contact',x:p.x,y:p.y}));});
    var coworkers=typeof COWORKERS!=='undefined'?COWORKERS:[];
    var people=(s.npcs||[]).map(function(n){return {npc:n,handler:n.ambient?'ambientTalk':'ticketFlow'};}).concat(coworkers.map(function(n){return {npc:n,handler:'coworkerTalk'};}));
    if(typeof MAYA!=='undefined')people.push({npc:MAYA,handler:'mktShop'});
    people.forEach(function(entry){var n=entry.npc;if(Math.abs(s.px-n.x)+Math.abs(s.py-n.y)>1||result.some(function(item){return item.kind==='contact'&&item.x===n.x&&item.y===n.y;}))return;result.push({id:'person:'+(n.id||n.name),kind:'person',label:n.name,npc:n,handler:entry.handler,x:n.x,y:n.y});});
    return result;
  }
  function targetResolution(){
    var options=nearbyTargets(),s=gs(),route=s&&s.meta&&s.meta.dayRouteTarget,target=options.some(function(item){return item.kind==='person';})?null:options.find(function(item){return item.id===route;});
    return {options:options,target:target||(options.length===1?options[0]:null),choose:options.length>1&&!target};
  }
  function targetLabel(item){return item.kind==='person'?'Talk to '+item.label:item.kind==='contact'?(item.id==='standup'?'Read '+item.label:'Talk to '+item.label):item.id==='mike_desk'?'Use Mike’s workstation':'Inspect '+item.label;}
  function actOnTarget(item){
    if(!nearbyTargets().some(function(current){return current.id===item.id&&current.kind===item.kind;}))return false;
    if(item.kind==='person'){var handler=root[item.handler];if(typeof handler!=='function')return false;handler(item.npc);return true;}
    if(item.kind!=='contact')return openDevice(item);
    if(item.ticketId)return talk(item.ticketId);
    var n=root.TechOpsCampaignNativeAct1;if(item.id==='standup')return gs().day>=2?n.openWorkdayHandoff():n.openStandup();
    if(item.id==='access'){root.dlg('SECURITY OPS','Security has a badge record that needs review against physical presence. Read the access log on the Security workstation before documenting a conclusion.',[{t:'Walk to Security workstation',f:function(){return routeTo('security_workstation');}},{t:'Back to floor',f:root.closeDlg}]);return true;}return false;
  }
  function interact(){
    var s=gs();if(!isDay()||s.inDialog||s.inBattle)return false;
    if(world())world().ensureWorld();
    var resolution=targetResolution();if(!resolution.options.length)return false;
    if(resolution.target){actOnTarget(resolution.target);return true;}
    var owner,options=resolution.options.map(function(item){return {t:targetLabel(item),f:function(){if(owner!==targetMenuOwner||!gs().inDialog)return false;return actOnTarget(item);}};});
    options.push({t:'Back to floor',f:root.closeDlg});root.dlg('NEARBY / CHOOSE AN INTERACTION','You are beside more than one person or device. Choose what Mike should do.',options);owner=++targetMenuOwner;return true;
  }
  function workstationSkin(name){
    var d=root.document&&root.document.getElementById('dialogue');if(!d)return;
    if(desktopNearby()&&/WORKSTATION|COMPANY|PEOPLE BEHIND THE FLIGHT|MIKE \/\//.test(name)){d.classList.add('day-workstation');gs().dayInteraction='workstation';}
  }
  var standupTimer=null,entryState=null,wasInOffice=false;
  function standupScene(decision){
    var s=gs(),i=0;
    var shots=[['NICK','Morning. Shipping has a label problem, Plating has a workstation down, and Security has an access record that needs explaining.'],['AMIT','I’ll own Plating. We coordinate with the operator before touching the production session.'],['BRANDON','Shipping says the printer is ready, but the labels disappear. We need to follow the job, not assume the printer is broken.'],['DANIEL','Make the ownership clear before we scatter. Mike, do you want the access investigation, or should Security take that one?']];
    function finish(){if(gs()!==s||!s.inDialog)return;delete s.dayStandupSpeaker;if(root.document)root.document.body.classList.remove('day-standup-open');s.meta.dayStandupIntroSeen=s.day;if(typeof root.save==='function')root.save();decision();}
    function show(){
      if(gs()!==s||s.nightMode)return;var shot=shots[i];
      s.dayStandupSpeaker=shot[0];
      if(root.document)root.document.body.classList.add('day-standup-open');
      root.dlg('STANDUP SCENE // '+shot[0],'<small>08:55 · IT DEPARTMENT · '+(i+1)+' / '+shots.length+'</small><br><br><b>'+shot[0]+'</b><br><br>“'+shot[1]+'”',[
        {t:i===shots.length-1?'Decide the assignments':'Continue standup',f:function(){if(owner!==targetMenuOwner||!s.inDialog)return;if(i===shots.length-1)finish();else{i++;show();}}},
        {t:'Skip to assignments',f:function(){if(owner===targetMenuOwner)finish();}}
      ]);
      var owner=targetMenuOwner;
      if(i<shots.length-1)standupTimer=root.setTimeout(function(){if(gs()===s&&s.inDialog&&owner===targetMenuOwner){i++;show();}},5500);
    }
    show();return true;
  }
  function checkOfficeEntry(){
    var s=gs();if(!s||!s.map||s.nightMode||s.day!==1)return;
    var inside=s.room?s.room.id==='itdept':s.px>=28&&s.px<=41&&s.py>=10&&s.py<=17;
    if(entryState!==s){entryState=s;wasInOffice=false;}
    if(!inside){wasInOffice=false;return;}
    if(wasInOffice||s.inDialog||s.inBattle||s.gameOver||s.meta&&s.meta._standaloneMode)return;
    var title=root.document.getElementById('title-screen');if(title&&!title.classList.contains('hidden'))return;
    wasInOffice=true;var c=campaign();if(!c.flags.standup_completed&&root.TechOpsCampaignNativeAct1)root.TechOpsCampaignNativeAct1.openStandup();
  }
  function syncHud(){
    if(root.document)checkOfficeEntry();
    if(!root.document)return;if(active&&!isDay())release();var s=gs();root.document.body.classList[s&&s.room&&!s.nightMode?'add':'remove']('day-room-visible');var visible=isDay()&&!s.inDialog&&!s.inBattle;var title=root.document.getElementById('title-screen');if(title&&!title.classList.contains('hidden'))visible=false;
    if(!hud){hud=root.document.createElement('section');hud.id='day-route-hud';hud.setAttribute('aria-label','Day shift objective');root.document.body.appendChild(hud);}
    hud.hidden=!visible;root.document.body.classList[visible?'add':'remove']('day-route-visible');if(!visible){lastHud='';return;}
    var w=world();if(!w)return;w.ensureWorld();var objective=w.nextObjective()||{},resolution=targetResolution(),nearby=resolution.target;
    var target=s.meta.dayRouteTarget||objective.stationId||objective.targetId||objective.id;
    var data={title:objective.title||objective.label||'Day shift',detail:objective.detail||objective.description||'Follow the workday. Inspect before making changes.',target:target,near:nearby&&nearby.id,choices:resolution.choose};var key=JSON.stringify(data);if(key===lastHud)return;lastHud=key;
    if(s.meta.dayRouteTarget){var tracked=stationById(target),contactNames={shipping:'Shipping clerk',plating:'Plating operator',standup:s.day>=2?'Shift handoff board':'Morning standup board',access:'Security Ops',sector04Door:'Sector 04 entrance'};data.title='Destination · '+(tracked?tracked.label:contactNames[target]||'Marked location');data.detail='Follow the floor route. '+(tracked?'Use this equipment when Mike reaches it.':'Meet the requester or inspect the marked destination.');}
    hud.innerHTML='<header>AEROTECH / FIELD OPERATIONS</header><div class="day-objective"><strong>'+escape(data.title)+'</strong><small>'+escape(data.detail)+'</small></div>'+(nearby||resolution.choose?'<button type="button" class="day-nearby" data-day-interact>E / A · '+escape(resolution.choose?'Choose nearby interaction':targetLabel(nearby))+'</button>':'')+'<button type="button" data-day-route>Show floor route</button><button type="button" data-day-jobs>Field service board</button>';
    hud.querySelector('[data-day-route]').onclick=function(){routeTo(target||'mike_desk');};hud.querySelector('[data-day-jobs]').onclick=openBoard;
    var nearbyButton=hud.querySelector('[data-day-interact]');if(nearbyButton)nearbyButton.onclick=interact;
  }
  function openBoard(){
    if(!isDay()||gs().inDialog)return;var c=campaign(),options=[];
    options.push({t:'Main objective — '+(world().nextObjective().title||world().nextObjective().label||'Day shift'),f:function(){var o=world().nextObjective();routeTo(o.stationId||o.target||o.targetId||o.id||'mike_desk');}});
    if(c.flags.day_work_unlocked)world().stations().filter(function(st){return st.caseId;}).forEach(function(st){var r=(gs().meta.dayCases||{})[st.caseId];options.push({t:(r&&r.phase==='complete'?'✓ ':'')+st.label,f:function(){routeTo(st.id);}});});
    options.push({t:'Back to floor',f:root.closeDlg});root.dlg('FIELD SERVICE BOARD','The story work stays first. Optional service calls develop your investigation skills and keep the factory running. Choose a destination to mark its walking route.',options);
  }
  function keydown(e){if(!active)return;if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();exit();return;}if(e.key==='Tab'){var list=Array.from(root.document.querySelectorAll('#dialogue.day-device-mode button:not(:disabled)'));if(!list.length)return;var first=list[0],last=list[list.length-1];if(e.shiftKey&&root.document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&root.document.activeElement===last){e.preventDefault();first.focus();}}if(/^(Arrow| |Enter$|[wasdemv]$)/i.test(e.key))e.stopPropagation();}
  if(root.document)root.document.addEventListener('keydown',keydown,true);
  root.TechOpsDayExperience={VERSION:1,standupScene:standupScene,sideDeskNearby:sideDeskNearby,openDevice:openDevice,talk:talk,interact:interact,routeTo:routeTo,requireDesk:requireDesk,desktopNearby:desktopNearby,release:release,exit:exit,render:render,syncHud:syncHud,workstationSkin:workstationSkin,transact:transact,active:function(){return active;},openBoard:openBoard};
})(typeof globalThis!=='undefined'?globalThis:this);

/* Day desktop and opening cinematics. Presentation only: native campaign callbacks
 * retain state authority, and the existing dialogue owns input and dismissal. */
(function(root){
  'use strict';
  var serial=0,timer=null,current=null;
  var apps=[['QUEUE','▤','Service queue'],['TEAMS','◉','Team messages'],['ALERTS','△','Event viewer'],['COMPANY','◈','Company intranet'],['MUSIC','♫','Music']];
  function esc(x){return String(x||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function release(){serial++;if(timer)root.clearTimeout(timer);timer=null;current=null;var d=root.document&&root.document.getElementById('dialogue');if(d)d.classList.remove('day-os-mode','day-film-mode');if(root.document)root.document.body.classList.remove('day-os-open');if(root.TechOpsDayAudio)root.TechOpsDayAudio.resume('opening-film');}
  function valid(token){return token===serial&&root.S&&root.S.inDialog&&root.TechOpsDayExperience.desktopNearby();}
  function present(name,body,options){
    if(!root.document||!root.TechOpsDayExperience||!root.TechOpsDayExperience.desktopNearby())return false;
    if(!/WORKSTATION|COMPANY|PEOPLE BEHIND THE FLIGHT|MORNING LISTENING|09:00 \/\/ DAY SHIFT/.test(name))return false;
    release();var token=serial,d=root.document.getElementById('dialogue'),box=root.document.getElementById('dlg-text');if(!d||!box)return false;
    current={name:name};d.classList.add('day-os-mode');root.document.body.classList.add('day-os-open');root.S.dayInteraction='workstation';box.onclick=null;
    var home=name==='MIKE // WORKSTATION',film=name==='PEOPLE BEHIND THE FLIGHT'||name==='MORNING LISTENING'||name==='09:00 // DAY SHIFT';
    var native=root.TechOpsCampaignNativeAct1;
    var app=name.split(' // ').pop(),icons=apps.map(function(a){return '<button type="button" class="os-icon" data-os-app="'+a[0]+'" aria-label="'+a[0]+'"><span aria-hidden="true">'+a[1]+'</span><b>'+a[0]+'</b><small>'+a[2]+'</small></button>';}).join('');
    box.innerHTML='<section class="os-desktop" aria-label="Mike’s simulated computer"><div class="os-wallpaper"><span>AEROTECH</span><p>NEW HAVEN · OPERATIONS</p></div><nav class="os-icons" '+(home?'hidden':'')+' aria-label="Desktop applications">'+icons+'</nav><section class="os-window '+(home?'os-welcome':'')+'" aria-label="'+esc(app)+'"><header class="os-titlebar"><span>◈ &nbsp; '+esc(home?'MIKE / WORKSPACE':app)+'</span><div><button type="button" data-os-min aria-label="Minimize window">—</button><button type="button" data-os-max aria-label="Maximize window">□</button><button type="button" data-os-close aria-label="Close application">×</button></div></header><div class="os-address">'+esc(home?'aerodesk://mike/home':'aerodesk://'+app.toLowerCase().replace(/ /g,'-'))+'</div><div class="os-content">'+(home?'<span class="os-kicker">DAY '+esc(root.S.day)+' / MORNING SHIFT</span><h1>Good morning, Mike.</h1><p>Your tools. Your team. One shift at a time.</p><div class="os-shortcuts">'+icons+'</div>': '<h1>'+esc(app)+'</h1>')+'<div class="os-copy">'+body+'</div></div><div class="os-actions"></div></section><footer class="os-taskbar"><button type="button" data-os-home aria-label="Show desktop">▦ <span>AeroDesk</span></button><span class="os-task-name">'+esc(home?'Workspace':app)+'</span><span class="os-session">MIKE · LOCAL SESSION</span><button type="button" data-os-exit>Leave computer</button></footer></section>';
    function bind(selector,fn){box.querySelectorAll(selector).forEach(function(el){el.onclick=function(){if(!valid(token))return false;if(root.TechOpsDayAudio)root.TechOpsDayAudio.emit('inspect');return fn(el);};});}
    bind('[data-os-app]',function(el){return native.openWorkstationTab(el.dataset.osApp);});
    bind('[data-os-home]',function(){native.openWorkstation();});bind('[data-os-close]',function(){native.openWorkstation();});
    bind('[data-os-exit]',function(){root.closeDlg();});
    bind('[data-os-min]',function(){box.querySelector('.os-window').classList.toggle('os-minimized');});
    bind('[data-os-max]',function(){box.querySelector('.os-window').classList.toggle('os-maximized');});
    var actions=box.querySelector('.os-actions');
    (options||[]).forEach(function(option){if(home&&apps.some(function(a){return a[0]===option.t;}))return;var b=root.document.createElement('button');b.type='button';b.textContent=option.t==='Combat sound & captions'?'Sound & captions':option.t;b.onclick=function(){if(valid(token))return option.f();};actions.appendChild(b);});
    if(film)startFilm(name,box,actions,token);
    return true;
  }
  function startFilm(name,box,actions,token){
    root.document.getElementById('dialogue').classList.add('day-film-mode');
    var profile=name==='PEOPLE BEHIND THE FLIGHT',listening=name==='MORNING LISTENING';
    var shots=profile?[
      ['FIELD SYSTEMS','Every flight begins with people on the ground.','assets/campaign/workstation.corporate_aircraft_panel.png','wide'],
      ['FELICIA / SECURITY RESEARCH','Aircraft systems. Antenna racks. A violin case beside the work.','assets/campaign/workstation.corporate_aircraft_panel.png','pan'],
      ['PEOPLE BEHIND THE FLIGHT','Felicia plays. For a moment, the company profile feels personal.','assets/campaign/workstation.felicia.video_frame.png','portrait'],
      ['SIGNAL INTERRUPTION','ORPHEUS','assets/campaign/workstation.corporate_aircraft_panel.png','signal'],
      ['PROFILE ENDS','The corporate edit continues. Mike has not met her yet.','assets/campaign/workstation.felicia.video_frame.png','portrait']
    ]:listening?[
      ['RED IN THE MIRROR','The correct track is playing. The queue can wait a moment.','assets/campaign/workstation.corporate_aircraft_panel.png','wide'],
      ['BEFORE THE SHIFT','An ordinary song, heard before the work begins.','assets/campaign/workstation.corporate_aircraft_panel.png','pan']
    ]:[['09:00 / NEW HAVEN','Shipping is waiting. Plating is waiting. Security has a contradiction.','assets/campaign/shipping.dock_background.png','wide'],['DAY SHIFT','The clock begins. Leave it better than you found it.','assets/campaign/plating.line_background.png','pan']];
    var content=box.querySelector('.os-content'),i=0;
    if(profile&&root.TechOpsDayAudio)root.TechOpsDayAudio.duck('opening-film',.22);
    var finish=Array.from(actions.querySelectorAll('button')).find(function(b){return b.textContent==='Finish video';});if(finish)finish.disabled=true;
    function shot(){if(!valid(token))return;var s=shots[i];content.innerHTML='<div class="day-film-shot '+s[3]+'"><img src="'+s[2]+'" alt="'+esc(s[0])+'"><div class="day-film-shade"></div><div class="day-film-caption" aria-live="polite"><small>'+esc(s[0])+'</small><h2>'+esc(s[1])+'</h2></div><div class="day-film-progress">'+shots.map(function(_,n){return '<i class="'+(n<=i?'seen':'')+'"></i>';}).join('')+'</div></div>';if(i<shots.length-1)timer=root.setTimeout(function(){i++;shot();},s[3]==='signal'?650:4200);else{if(finish)finish.disabled=false;next.textContent='Replay scene';}}
    var next=root.document.createElement('button');next.type='button';next.textContent='Next shot';next.onclick=function(){if(!valid(token))return;root.clearTimeout(timer);i=i<shots.length-1?i+1:0;shot();};actions.appendChild(next);shot();
  }
  root.TechOpsDayDesktop={present:present,release:release,active:function(){return current;}};
})(typeof globalThis!=='undefined'?globalThis:this);
