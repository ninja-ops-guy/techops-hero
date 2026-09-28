/* TechOps Hero — optional Day field cases.
 * Pure, deterministic concern module. The world owns physical proximity and input;
 * the caller keeps these JSON records in S.meta.dayCases. No campaign ticket,
 * story flag, clock, storage, reward, DOM or operating-system side effects live here.
 */
(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.TechOpsDayCases=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  var VERSION=1;
  function freeze(value){Object.keys(value).forEach(function(key){if(value[key]&&typeof value[key]==='object')freeze(value[key]);});return Object.freeze(value);}
  function evidence(id,label,text,surface,x,y,w,h){return {id:id,label:label,text:text,surface:surface,hotspot:{x:x,y:y,w:w,h:h}};}
  function hypothesis(id,label,reason){return {id:id,label:label,reason:reason};}
  var CASES=freeze({
    laptop_dock_link:{
      id:'laptop_dock_link',title:'The Dock Is On Vacation',deviceKind:'laptop',deviceLabel:'Engineering laptop and dock',roomId:'eng',zoneId:'eng',requester:'Design engineer',
      humanNeed:'The engineer needs the approved drawing on the large display for a design review.',
      symptom:'The laptop is awake, but its external display and wired network disappeared together.',
      evidence:[
        evidence('dock_power','Inspect dock power light','The dock power light is steady. Its adapter and display cable are seated.','physical',76,51,19,15),
        evidence('upstream_cable','Inspect laptop-to-dock plug','The laptop end of the upstream USB-C cable is visibly half-seated. One connection carries both missing devices.','physical',18,63,25,17),
        evidence('device_inventory','Open connected devices','The built-in screen and keyboard work; both the dock display and dock Ethernet adapter are absent from the device list.','screen',12,20,76,23)
      ],
      hypotheses:[
        hypothesis('display_failure','Failed external display','A failed display would not also remove the dock Ethernet adapter.'),
        hypothesis('upstream_disconnected','Loose upstream dock cable','A loose laptop-to-dock connection explains why two downstream devices disappeared while the dock stayed powered.'),
        hypothesis('network_outage','Department network outage','A network outage does not explain the missing external display or the loose upstream plug.')
      ],correctHypothesis:'upstream_disconnected',requiredEvidence:['dock_power','upstream_cable','device_inventory'],
      authorization:'Ask the engineer to save the drawing and agree to a brief dock reconnect.',
      remediation:'Reseat the identified external upstream connector once, leaving the dock power and unrelated connections in place.',
      technicalCheck:'Confirm the dock display and Ethernet adapter both reappear and the approved drawing share is reachable.',
      requesterCheck:'The engineer opens the correct drawing revision on the large screen and confirms the review can begin.',
      notifications:['AeroDesk reports: your peripherals are pursuing independent careers.','One connector. Two symptoms. Zero reasons to reinstall everything.']
    },
    desktop_restart_window:{
      id:'desktop_restart_window',title:'Restart Required. Timing Optional.',deviceKind:'desktop',deviceLabel:'Finance batch workstation',roomId:'office',zoneId:'finance',requester:'Finance analyst',
      humanNeed:'Finance must finish an approved export without losing the running batch.',
      symptom:'The workstation displays a pending restart reminder while a finance export is still running.',
      evidence:[
        evidence('workstation_status','Inspect workstation indicator','The workstation is powered and responsive; there is no hardware fault indicator.','physical',68,43,19,28),
        evidence('active_batch','Inspect export progress','The approved export is still running. Its job record has not yet recorded a completed output.','screen',10,20,80,23),
        evidence('restart_policy','Read restart schedule','The approved update is installed and awaiting restart. A restart window can be scheduled after the current export completes.','screen',10,55,80,24)
      ],
      hypotheses:[
        hypothesis('schedule_conflict','Restart conflicts with active work','The machine is healthy; the pending restart needs coordination with the unfinished export.'),
        hypothesis('hardware_crash','Hardware has crashed','The responsive workstation and advancing export do not support a hardware crash.'),
        hypothesis('disable_updates','Updates should be disabled','Disabling updates does not preserve a verified export or complete the required maintenance.')
      ],correctHypothesis:'schedule_conflict',requiredEvidence:['workstation_status','active_batch','restart_policy'],
      authorization:'Agree on a maintenance window with the analyst after the export has finished and its output has been checked.',
      remediation:'At the agreed window, confirm the finished output is saved, close the application with the analyst, and perform the approved restart.',
      technicalCheck:'Confirm the workstation returns to sign-in, the restart requirement clears, and the saved export passes its completion check.',
      requesterCheck:'The analyst signs back in, opens the completed export, and confirms the actual finance handoff is usable.',
      notifications:['AeroDesk would like to restart at a time convenient to AeroDesk.','Your productivity matters. Please hold while we schedule it.']
    },
    signage_player_session:{
      id:'signage_player_session',title:'Welcome to Yesterday',deviceKind:'mini_pc',deviceLabel:'Lobby signage mini-PC',roomId:'office',zoneId:'lobby',requester:'Reception coordinator',
      humanNeed:'Reception needs the approved visitor welcome board showing the current schedule.',
      symptom:'The display is lit, but the welcome board is stuck on yesterday and shows a player sign-in banner.',
      evidence:[
        evidence('display_link','Inspect display and mini-PC','The display has power and a live picture from the mini-PC. The connected video cable is seated.','physical',61,63,27,20),
        evidence('network_health','Open player connection status','The managed mini-PC reaches the approved signage service; its clock and network status are healthy.','screen',10,20,80,22),
        evidence('player_session','Read player status banner','The signage player session expired overnight. It is rendering the last cached playlist until managed enrollment is renewed.','screen',10,55,80,24)
      ],
      hypotheses:[
        hypothesis('display_cable','Bad video cable','A stable live picture and visible player banner do not fit a disconnected video path.'),
        hypothesis('expired_session','Expired managed player session','The service is reachable, but the expired player session prevents the current approved playlist from loading.'),
        hypothesis('publish_unapproved','Replace the approved playlist','There is no evidence the approved content is wrong; the player cannot currently fetch it.')
      ],correctHypothesis:'expired_session',requiredEvidence:['display_link','network_health','player_session'],
      authorization:'Confirm the reception content owner approves renewing this existing managed signage enrollment.',
      remediation:'Renew the player through its approved managed enrollment flow and refresh the assigned playlist; do not use a personal account.',
      technicalCheck:'Confirm the enrolled device identity, current playlist revision, healthy player session and advancing playback.',
      requesterCheck:'Reception checks today’s approved schedule on the physical display and confirms visitors can use it.',
      notifications:['Welcome, valued visitor. Today is apparently yesterday.','Your screen is online. Its paperwork has expired.']
    },
    printer_queue_blocked:{
      id:'printer_queue_blocked',title:'The Printer Is “Ready”',deviceKind:'printer',deviceLabel:'Finance batch printer',roomId:'office',zoneId:'finance',requester:'Accounts payable clerk',
      humanNeed:'Accounts payable needs one complete approved reconciliation packet for the handoff.',
      symptom:'The Finance printer shows Ready while the same batch job blocks later jobs.',
      evidence:[
        evidence('printer_self_test','Inspect tray and local test page','Paper and output paths are clear. A local self-test prints normally, proving the print engine works.','physical',20,53,59,28),
        evidence('queue_head','Inspect queue head','The same malformed batch job remains at the head of the Finance queue. Later jobs wait behind it.','screen',10,20,80,23),
        evidence('requester_access','Check job authorization','The clerk has approved Print access and the queued job passed authorization. It remains in the queue behind the blocked batch.','screen',10,56,80,23)
      ],
      hypotheses:[
        hypothesis('paper_jam','Paper jam','The clear path and successful local self-test rule against a jam.'),
        hypothesis('permissions','Missing requester permission','This job passed authorization and remains queued. A permission failure does not explain the malformed job blocking later work.'),
        hypothesis('blocked_job','Malformed job blocks the queue','The working print engine and authorized job waiting at the queue head identify a bounded queue fault.')
      ],correctHypothesis:'blocked_job',requiredEvidence:['printer_self_test','queue_head','requester_access'],
      authorization:'Confirm the clerk owns the blocked batch and can resend its source before cancelling that one job.',
      remediation:'Cancel only the identified malformed job. Have its owner resend one clean copy through the approved queue; preserve unrelated jobs.',
      technicalCheck:'Confirm the blocked item is gone, later jobs advance, and one replacement packet prints without duplicate submissions.',
      requesterCheck:'The clerk counts the pages, checks the reconciliation details, and confirms the packet is complete and usable.',
      notifications:['Ready is a state of mind, according to this printer.','Thirty-seven copies of “final-final” are still thirty-seven copies.']
    },
    plc_hmi_dependency:{
      id:'plc_hmi_dependency',title:'The Line Is Fine. The Screen Disagrees.',deviceKind:'plc_hmi',deviceLabel:'Packaging-cell HMI',roomId:'factory',zoneId:'factory',requester:'Packaging operator',
      humanNeed:'The packaging operator needs trustworthy readouts before the next authorized cell run.',
      symptom:'The packaging HMI shows stale telemetry even though the operator reports the controller remains healthy.',
      evidence:[
        evidence('operator_panel','Inspect external status with operator','From the permitted operator position, the controller status is normal and no cabinet is opened. The operator confirms the cell is held safely.','physical',58,29,25,29),
        evidence('approved_path','Read HMI connection diagnostics','Approved read-only HMI diagnostics show the controller network path available; the last telemetry timestamp is stale.','screen',10,20,80,23),
        evidence('hmi_dependency','Inspect HMI service status','The approved HMI communications dependency is stopped after its host maintenance. No PLC logic or safety-state change is indicated.','screen',10,55,80,24)
      ],
      hypotheses:[
        hypothesis('hmi_service','Stopped HMI communications dependency','The reachable controller and stopped HMI dependency explain stale presentation without inventing a controller fault.'),
        hypothesis('plc_logic','Change PLC logic','The evidence identifies a host-side dependency; changing PLC logic is outside IT’s permitted repair and is unsupported.'),
        hypothesis('bypass_interlock','Bypass an interlock','An interlock is not a troubleshooting shortcut. The case provides no permission or evidence for any safety-control change.')
      ],correctHypothesis:'hmi_service',requiredEvidence:['operator_panel','approved_path','hmi_dependency'],
      authorization:'The operator and controls owner confirm a safe maintenance window and authorize only restoration of the named HMI host dependency.',
      remediation:'Within that approved window, restore only the named HMI host dependency using the approved support action; leave controller logic, outputs and interlocks untouched.',
      technicalCheck:'Confirm the HMI dependency stays healthy, read-only telemetry timestamps advance, and the displayed controller identity matches the approved cell.',
      requesterCheck:'The operator checks the readout against the cell, owns the return to operation, and confirms the authorized workflow is usable.',
      safety:{requiresSafeWindow:true,scope:'HMI host communications dependency only',forbiddenChanges:['PLC logic','controller outputs','interlocks','cabinet access']},
      notifications:['AeroDesk has confidently displayed the last known confidence.','A green screen is not permission to move a machine.']
    },
    industrial_scanner_vlan:{
      id:'industrial_scanner_vlan',title:'Connected to Somewhere',deviceKind:'industrial_scanner',deviceLabel:'Traceability scanner station',roomId:'factory',zoneId:'factory',requester:'Traceability operator',
      humanNeed:'Traceability needs approved scan records attached to the correct work order before the next handoff.',
      symptom:'The station has Ethernet link but cannot reach its approved scan service after a desk-port move.',
      evidence:[
        evidence('port_label','Inspect patch lead and port label','The lead has link and is seated. Its new wall-port label differs from the approved traceability station record.','physical',47,63,36,20),
        evidence('network_lease','Read station network details','The scanner station received an office-network lease, which does not match its assigned traceability network.','screen',10,20,80,23),
        evidence('approved_assignment','Compare approved port assignment','The asset and port record identifies the authorized traceability VLAN; the moved port still has the office profile.','screen',10,55,80,24)
      ],
      hypotheses:[
        hypothesis('scanner_failed','Scanner hardware failure','A working link and mismatched network assignment provide a more specific cause than failed scanner hardware.'),
        hypothesis('wrong_vlan','Wrong managed port profile','The lease, port label and approved assignment agree: the moved station is on the wrong network profile.'),
        hypothesis('open_firewall','Remove network segmentation','The approved station assignment is wrong at this port. Broad access would hide the fault and bypass the intended boundary.')
      ],correctHypothesis:'wrong_vlan',requiredEvidence:['port_label','network_lease','approved_assignment'],
      authorization:'Coordinate a scan pause with the operator and obtain the network owner’s approved port-profile correction.',
      remediation:'Apply the approved existing traceability profile to the identified station port through the network-owner workflow; preserve segmentation and unrelated ports.',
      technicalCheck:'Confirm the station obtains its assigned network settings and reaches only the approved scan service with its expected device identity.',
      requesterCheck:'The operator scans the authorized test work order, checks its recorded identity and confirms normal traceability can resume.',
      safety:{requiresSafeWindow:true,scope:'Approved station network profile',forbiddenChanges:['broad firewall exceptions','machine-control configuration','unrelated ports']},
      notifications:['Connected: yes. Connected to the useful thing: pending.','Your network has successfully delivered you to the wrong department.']
    },
    access_point_poe:{
      id:'access_point_poe',title:'Wireless, Except for the Wire',deviceKind:'access_point',deviceLabel:'Engineering access point',roomId:'eng',zoneId:'eng',requester:'Test engineer',
      humanNeed:'Engineering needs its approved tablet checklist available at the bench.',
      symptom:'The nearby access point is dark and engineering tablets no longer see their usual network.',
      evidence:[
        evidence('ap_indicator','Inspect access-point indicator','The installed access point is dark. Inspect it from the safe floor position; no ladder or ceiling access is needed.','physical',23,19,53,28),
        evidence('patch_lead','Inspect accessible patch lead','At the authorized accessible patch panel, the labeled AP patch lead has an unlatched plug. Do not touch unknown links.','physical',22,63,56,21),
        evidence('poe_status','Read approved switch status','Read-only status for that labeled port shows no link and no PoE draw. Neighboring AP ports are healthy.','screen',10,22,80,30)
      ],
      hypotheses:[
        hypothesis('radio_interference','Radio interference','Radio interference would not explain a dark AP with no PoE draw and an unlatched upstream lead.'),
        hypothesis('poe_lead','Disconnected PoE patch lead','The labeled loose lead explains the missing link, missing power and absent local wireless coverage together.'),
        hypothesis('reset_all','Reset every access point','Neighboring APs are healthy. A building-wide reset is not supported by the isolated physical evidence.')
      ],correctHypothesis:'poe_lead',requiredEvidence:['ap_indicator','patch_lead','poe_status'],
      authorization:'Confirm the identified AP and patch port with the network owner and agree on a brief reconnect with Engineering.',
      remediation:'Reconnect the identified accessible AP patch lead using the approved support action, leaving neighboring links untouched.',
      technicalCheck:'Confirm that port has stable link and PoE draw, the AP joins its managed controller, and the assigned network is available.',
      requesterCheck:'The engineer joins the approved network on the test tablet, opens the current checklist and confirms it saves successfully.',
      notifications:['Wireless service interrupted by a wire. We regret the branding.','Please enjoy our complimentary absence of connectivity.']
    },
    timeclock_time_sync:{
      id:'timeclock_time_sync',title:'The Clock That Worked Overtime',deviceKind:'time_clock',deviceLabel:'Employee time clock',roomId:'office',zoneId:'hr',requester:'HR shift coordinator',
      humanNeed:'The shift coordinator needs accurate clock status without changing anyone’s attendance record.',
      symptom:'The clock is powered but displays the wrong time and flags synchronization warnings.',
      evidence:[
        evidence('clock_display','Inspect clock display and link','Power and link indicators are steady. Its displayed local time disagrees with the approved site clock.','physical',18,23,63,33),
        evidence('sync_log','Read time synchronization status','The terminal reports its configured time source unavailable; the attendance collector connection remains healthy.','screen',10,20,80,23),
        evidence('time_source','Compare managed time configuration','The terminal still names a retired time source. The approved managed profile specifies its replacement and the correct site time zone.','screen',10,55,80,24)
      ],
      hypotheses:[
        hypothesis('power_fault','Failing power supply','The stable power and collector connection do not explain the explicitly unavailable retired time source.'),
        hypothesis('retired_time_source','Retired managed time source','The sync warning and old source identify a configuration fault; existing attendance records are not evidence to rewrite.'),
        hypothesis('rewrite_punches','Adjust employee punches','Changing attendance entries is outside this device repair and would not restore its managed time source.')
      ],correctHypothesis:'retired_time_source',requiredEvidence:['clock_display','sync_log','time_source'],
      authorization:'Agree on a brief device-maintenance window with HR and approve the existing managed time-profile correction; retain recorded punches.',
      remediation:'Apply the approved replacement time source and site time zone through device management, following the supported synchronization workflow.',
      technicalCheck:'Confirm successful synchronization, the correct displayed site time and continued collector delivery without editing prior records.',
      requesterCheck:'HR checks an approved non-payroll test transaction and the displayed time, then confirms the clock is ready for employees.',
      notifications:['You are early. Or late. The clock is keeping its options open.','Attendance records are not a creative-writing exercise.']
    }
  });

  var PHASES=['inspect','authorize','remediate','technical','requester','complete'];
  var NEXT={inspect:'Inspect physical clues and device diagnostics, then support a cause.',authorize:'Coordinate the bounded repair with its owner.',remediate:'Apply the approved repair.',technical:'Verify the technical path.',requester:'Ask the requester to perform the real task.',complete:'Service restored and requester verified.'};
  function assert(ok,message){if(!ok)throw new Error(message);}
  function definition(id){assert(Object.prototype.hasOwnProperty.call(CASES,id),'Unknown Day device case: '+id);return CASES[id];}
  function ids(){return Object.keys(CASES);}
  function create(id){definition(id);return {version:VERSION,caseId:id,phase:'inspect',evidence:[],ruledOut:[],hypothesis:null,authorized:false,fixApplied:false,technicalVerified:false,requesterVerified:false};}
  function checked(record){
    assert(record&&typeof record==='object'&&!Array.isArray(record),'Day case record required');
    var def=definition(record.caseId);
    assert(record.version===VERSION,'Unsupported Day case record version');
    assert(PHASES.indexOf(record.phase)>=0,'Unknown Day case phase');
    assert(Array.isArray(record.evidence)&&Array.isArray(record.ruledOut),'Malformed Day case observations');
    var knownEvidence=def.evidence.map(function(item){return item.id;});
    assert(record.evidence.every(function(id,index,all){return knownEvidence.indexOf(id)>=0&&all.indexOf(id)===index;}),'Invalid or duplicated Day case evidence');
    assert(record.ruledOut.every(function(id,index,all){return id!==def.correctHypothesis&&def.hypotheses.some(function(h){return h.id===id;})&&all.indexOf(id)===index;}),'Invalid rejected hypothesis');
    ['authorized','fixApplied','technicalVerified','requesterVerified'].forEach(function(key){assert(typeof record[key]==='boolean','Malformed Day case flag: '+key);});
    var stage=PHASES.indexOf(record.phase);
    assert(record.hypothesis===(stage?def.correctHypothesis:null),'Hypothesis does not match Day case phase');
    assert(record.authorized===(stage>=2)&&record.fixApplied===(stage>=3)&&record.technicalVerified===(stage>=4)&&record.requesterVerified===(stage>=5),'Day case phase and verification flags disagree');
    if(stage)assert(def.requiredEvidence.every(function(id){return record.evidence.indexOf(id)>=0;}),'Supported case is missing required evidence');
    return def;
  }
  function observe(record,evidenceId,surface){
    var def=checked(record),item=def.evidence.find(function(e){return e.id===evidenceId;});
    assert(item,'Unknown evidence for this device: '+evidenceId);
    assert(surface===item.surface,'This observation requires the '+item.surface+' inspection surface');
    if(record.evidence.indexOf(evidenceId)>=0)return record;
    assert(record.phase==='inspect','New evidence must be gathered before committing the repair');
    record.evidence.push(evidenceId);return record;
  }
  function hypothesize(record,id){
    var def=checked(record),choice=def.hypotheses.find(function(h){return h.id===id;});
    assert(choice,'Unknown hypothesis for this device: '+id);
    if(record.hypothesis===id)return {correct:true,reason:choice.reason,record:record};
    assert(record.phase==='inspect','A supported repair cannot be replaced by a new hypothesis');
    assert(record.evidence.length>=2,'Inspect at least two independent clues before choosing a cause');
    if(id!==def.correctHypothesis){
      if(record.ruledOut.indexOf(id)<0)record.ruledOut.push(id);
      return {correct:false,reason:choice.reason,record:record};
    }
    var missing=def.requiredEvidence.filter(function(key){return record.evidence.indexOf(key)<0;});
    if(missing.length)return {correct:false,needsEvidence:true,missingEvidence:missing,reason:'That explanation is plausible, but the physical and diagnostic evidence is not complete. Inspect the remaining clues before changing anything.',record:record};
    record.hypothesis=id;record.phase='authorize';return {correct:true,reason:choice.reason,record:record};
  }
  function authorize(record){checked(record);if(record.authorized)return record;assert(record.phase==='authorize','Support a cause before coordinating the repair');record.authorized=true;record.phase='remediate';return record;}
  function remediate(record){checked(record);if(record.fixApplied)return record;assert(record.phase==='remediate'&&record.authorized,'Owner authorization and any safe maintenance window are required before repair');record.fixApplied=true;record.phase='technical';return record;}
  function verifyTechnical(record){checked(record);if(record.technicalVerified)return record;assert(record.phase==='technical'&&record.fixApplied,'Apply the bounded repair before technical verification');record.technicalVerified=true;record.phase='requester';return record;}
  function verifyRequester(record){checked(record);if(record.requesterVerified)return record;assert(record.phase==='requester'&&record.technicalVerified,'Technical verification is required before requester verification');record.requesterVerified=true;record.phase='complete';return record;}
  function phase(record){checked(record);return record.phase;}
  function summary(record){
    var def=checked(record),stage=PHASES.indexOf(record.phase),count=record.evidence.length;
    return {caseId:record.caseId,title:def.title,phase:record.phase,status:stage===5?'VERIFIED / RESTORED':'OPEN',complete:stage===5,evidenceCount:count,evidenceTotal:def.evidence.length,progress:stage===0?Math.round(count/def.evidence.length*20):stage*20,nextAction:NEXT[record.phase],perfect:stage===5&&record.ruledOut.length===0};
  }
  return Object.freeze({VERSION:VERSION,CASES:CASES,definition:definition,ids:ids,create:create,observe:observe,hypothesize:hypothesize,authorize:authorize,remediate:remediate,verifyTechnical:verifyTechnical,verifyRequester:verifyRequester,phase:phase,summary:summary});
});
