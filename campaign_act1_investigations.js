/* TechOps Hero — canonical Day 1 field investigation mechanics.
 * Stable concern module: campaign_act1.js remains the canonical ticket/closure authority;
 * this module owns the evidence -> hypothesis -> remediation -> verification interaction
 * for the two ordinary opening tickets and persists progress inside that same save object.
 */
(function(root,factory){
  var api=factory(root);
  if(typeof module==="object"&&module.exports)module.exports=api;
  if(root)root.TechOpsCampaignInvestigations=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  var VERSION=1;
  var RETRY_MS=40;
  var CASES=Object.freeze({
    shipping_cannot_print:Object.freeze({
      title:"SHIPPING CANNOT PRINT",
      correctHypothesis:"permissions",
      evidence:Object.freeze([
        Object.freeze({id:"printer_self_test",label:"Run printer self-test",text:"The label printer produces a clean local self-test. Power, media, and the print engine are healthy."}),
        Object.freeze({id:"queue_trace",label:"Trace one customs-label job",text:"The job reaches the shared queue, then is removed immediately during the authorization stage."}),
        Object.freeze({id:"compare_user",label:"Compare another authorized user",text:"The same customs label prints for an authorized Shipping lead from the same workstation and queue."})
      ]),
      hypotheses:Object.freeze({
        driver_issue:"A broken driver would not explain why the same workstation and queue print successfully for another authorized user.",
        spooler_queue:"The spooler is accepting and processing the job far enough to reach authorization; the evidence does not show a stuck queue.",
        permissions:"The failure follows the requester identity, not the printer, workstation, or network path.",
        network_path:"A network-path failure would affect both users reaching the same shared queue."
      }),
      remediation:"Restore the Shipping clerk's Print permission through the approved queue security group, then refresh the session token.",
      technicalCheck:"A new job now remains in the queue through authorization and reaches the printer.",
      humanVerification:"The Shipping clerk prints the real customs label, checks the shipment details, and confirms it is usable."
    }),
    plating_workstation_down:Object.freeze({
      title:"PLATING WORKSTATION DOWN",
      correctHypothesis:"integration_failure",
      evidence:Object.freeze([
        Object.freeze({id:"local_login",label:"Check local workstation health",text:"Windows signs in normally and local applications open. The workstation itself is responsive."}),
        Object.freeze({id:"controller_reachability",label:"Test line-controller reachability",text:"The line controller responds on the expected network path with stable latency."}),
        Object.freeze({id:"integration_service",label:"Inspect production integration service",text:"The production integration service is stopped after the overnight reboot; its dependency did not restart automatically."})
      ]),
      hypotheses:Object.freeze({
        stale_service:"A generic stale service is possible, but the evidence identifies the specific production integration dependency as stopped after reboot.",
        credential_state:"Interactive sign-in succeeds and the controller path is reachable; there is no evidence of an authentication failure.",
        integration_failure:"The workstation and controller are healthy; the stopped production integration service is the missing dependency.",
        local_workstation_fault:"The workstation is responsive and can reach the controller, so a general local workstation fault does not fit the evidence."
      }),
      remediation:"Restore the production integration service and its automatic dependency start, then validate the controller session.",
      technicalCheck:"The integration service stays running and the workstation re-establishes its controller session.",
      humanVerification:"The plating operator completes a real production interaction and confirms the line can resume."
    })
  });

  function campaign(){return root&&root.TechOpsCampaign||null;}
  function nativeAct1(){return root&&root.TechOpsCampaignNativeAct1||null;}
  function storage(){try{return root&&root.localStorage||null;}catch(_){return null;}}
  function gameState(){try{return root&&root.S||null;}catch(_){return null;}}
  function now(){return new Date().toISOString();}
  function assert(condition,message){if(!condition)throw new Error(message);}
  function known(ticketId){return Object.prototype.hasOwnProperty.call(CASES,ticketId);}
  function definition(ticketId){assert(known(ticketId),"Unknown Day 1 investigation: "+ticketId);return CASES[ticketId];}
  function load(){var c=campaign();assert(c&&typeof c.load==="function","TechOpsCampaign is required");return c.load(storage());}
  function save(state){var c=campaign();assert(c&&typeof c.save==="function","TechOpsCampaign is required");c.save(state,storage());return state;}
  function close(){if(root&&typeof root.closeDlg==="function")root.closeDlg();}
  function dialog(name,body,options){if(root&&typeof root.dlg==="function"){root.dlg(name,body,options||[]);return true;}return false;}
  function notify(message){if(root&&typeof root.toast==="function")root.toast(message,3200);}
  function adjacent(a,b){if(!a||!b)return false;if(root&&typeof root.adjacent==="function")return root.adjacent(a,b);return Math.abs(a.x-b.x)+Math.abs(a.y-b.y)<=1;}
  function labelHypothesis(id){return String(id||"").replace(/_/g," ").replace(/\b\w/g,function(c){return c.toUpperCase();});}

  function ensureStore(state){
    state.investigations=state.investigations&&typeof state.investigations==="object"?state.investigations:{};
    return state.investigations;
  }
  function initialRecord(ticketId){return {ticketId:ticketId,phase:"gather",evidence:[],ruledOut:[],hypothesis:null,fixApplied:false,technicalCheckPassed:false,startedAt:now(),updatedAt:now()};}
  function getRecord(state,ticketId,create){
    definition(ticketId);var store=ensureStore(state),record=store[ticketId];
    if(!record&&create){record=initialRecord(ticketId);store[ticketId]=record;state.history=state.history||[];state.history.push({type:"investigation_started",ticketId:ticketId,at:record.startedAt});}
    if(record){record.evidence=Array.isArray(record.evidence)?record.evidence:[];record.ruledOut=Array.isArray(record.ruledOut)?record.ruledOut:[];}
    return record||null;
  }
  function publicRecord(state,ticketId){var record=getRecord(state,ticketId,false);return record?JSON.parse(JSON.stringify(record)):null;}
  function touch(record){record.updatedAt=now();return record;}
  function pushHistory(state,event){state.history=state.history||[];event.at=event.at||now();state.history.push(event);}

  function recordEvidence(state,ticketId,evidenceId){
    assert(state.flags&&state.flags.day_work_unlocked,"Day work must be unlocked before field investigation");
    assert(!state.tickets[ticketId],"Resolved ticket cannot collect new investigation evidence");
    var def=definition(ticketId),item=def.evidence.find(function(e){return e.id===evidenceId;});assert(item,"Unknown investigation evidence: "+evidenceId);
    var record=getRecord(state,ticketId,true);
    if(record.evidence.indexOf(evidenceId)<0){record.evidence.push(evidenceId);pushHistory(state,{type:"investigation_evidence",ticketId:ticketId,evidenceId:evidenceId});}
    record.phase="gather";touch(record);return record;
  }
  function chooseHypothesis(state,ticketId,hypothesisId){
    assert(state.flags&&state.flags.day_work_unlocked,"Day work must be unlocked before field investigation");
    assert(!state.tickets[ticketId],"Resolved ticket cannot form a new hypothesis");
    var def=definition(ticketId),record=getRecord(state,ticketId,true);
    assert(Object.prototype.hasOwnProperty.call(def.hypotheses,hypothesisId),"Unknown hypothesis: "+hypothesisId);
    assert(record.evidence.length>=2,"Gather at least two independent observations before forming a hypothesis");
    if(hypothesisId!==def.correctHypothesis){
      if(record.ruledOut.indexOf(hypothesisId)<0)record.ruledOut.push(hypothesisId);
      record.hypothesis=null;record.phase="gather";touch(record);
      pushHistory(state,{type:"investigation_hypothesis_rejected",ticketId:ticketId,hypothesis:hypothesisId});
      return {correct:false,reason:def.hypotheses[hypothesisId],record:record};
    }
    record.hypothesis=hypothesisId;record.phase="remediate";touch(record);
    pushHistory(state,{type:"investigation_hypothesis_supported",ticketId:ticketId,hypothesis:hypothesisId});
    return {correct:true,reason:def.hypotheses[hypothesisId],record:record};
  }
  function applyFix(state,ticketId){
    var def=definition(ticketId),record=getRecord(state,ticketId,false);assert(record&&record.hypothesis===def.correctHypothesis,"Supported hypothesis required before remediation");
    assert(!state.tickets[ticketId],"Resolved ticket cannot be remediated again");
    record.fixApplied=true;record.phase="technical_check";touch(record);pushHistory(state,{type:"investigation_fix_applied",ticketId:ticketId,hypothesis:record.hypothesis});return record;
  }
  function runTechnicalCheck(state,ticketId){
    var record=getRecord(state,ticketId,false);assert(record&&record.fixApplied,"Remediation required before technical validation");
    assert(!state.tickets[ticketId],"Resolved ticket cannot be technically revalidated here");
    record.technicalCheckPassed=true;record.phase="human_verify";touch(record);pushHistory(state,{type:"investigation_technical_check",ticketId:ticketId,result:"pass"});return record;
  }
  function verifyHumanOutcome(state,ticketId){
    var record=getRecord(state,ticketId,false);assert(record&&record.technicalCheckPassed,"Technical check required before requester verification");
    assert(!state.tickets[ticketId],"Ticket is already closed");
    var c=campaign();assert(c&&typeof c.resolveTicket==="function","Campaign resolver is required");
    var closed=c.resolveTicket(state,ticketId,{technicalResolution:true,verification:"strong",humanOutcome:"restored"});
    record.phase="complete";record.completedAt=closed.completedAt;touch(record);pushHistory(state,{type:"investigation_human_verified",ticketId:ticketId,outcome:"restored"});return closed;
  }

  function gatherSummary(def,record){
    if(!record.evidence.length)return "No observations recorded yet.";
    return record.evidence.map(function(id){var item=def.evidence.find(function(e){return e.id===id;});return "• "+(item?item.text:id);}).join("<br>");
  }
  function begin(ticketId){var state=load();if(state.tickets[ticketId])return existing(ticketId);var record=getRecord(state,ticketId,true);save(state);notify(definition(ticketId).title+" — investigation started");return openGather(ticketId,record);}
  function openInvestigation(ticketId){
    var def=definition(ticketId),state=load();
    if(!state.flags.day_work_unlocked)return false;
    if(state.tickets[ticketId])return existing(ticketId);
    var record=getRecord(state,ticketId,false);
    if(record){if(record.phase==="remediate")return openRemediation(ticketId);if(record.phase==="technical_check"||record.phase==="human_verify")return openVerification(ticketId);return openGather(ticketId,record);}
    return dialog(def.title,"<b>HUMAN NEED</b><br>"+campaign().getTicketTemplate(ticketId).humanNeed+"<br><br><b>VISIBLE SYMPTOM</b><br>"+campaign().getTicketTemplate(ticketId).visibleSymptom+"<br><br>Do not jump straight to a fix. Gather evidence first.",[
      {t:"Begin investigation",f:function(){begin(ticketId);}},
      {t:"Back",f:close}
    ]);
  }
  function openGather(ticketId,record){
    var def=definition(ticketId),state=load();record=record||getRecord(state,ticketId,true);
    var options=def.evidence.filter(function(item){return record.evidence.indexOf(item.id)<0;}).map(function(item){return {t:item.label,f:function(){var s=load();recordEvidence(s,ticketId,item.id);save(s);return dialog("EVIDENCE // "+def.title,item.text,[{t:"Continue investigation",f:function(){openGather(ticketId);}}]);}};});
    options.push({t:"Form hypothesis"+(record.evidence.length<2?" (need 2 observations)":""),f:function(){if(record.evidence.length<2)return dialog("INSUFFICIENT EVIDENCE","Gather at least two independent observations before choosing a cause.",[{t:"Back to evidence",f:function(){openGather(ticketId);}}]);openHypotheses(ticketId);}});
    options.push({t:"Back",f:close});
    return dialog("INVESTIGATE // "+def.title,"<b>RECORDED EVIDENCE</b><br>"+gatherSummary(def,record)+(record.ruledOut.length?"<br><br><b>RULED OUT</b><br>"+record.ruledOut.map(labelHypothesis).join(" · "):""),options);
  }
  function openHypotheses(ticketId){
    var def=definition(ticketId),state=load(),record=getRecord(state,ticketId,true);
    if(record.evidence.length<2)return openGather(ticketId,record);
    var template=campaign().getTicketTemplate(ticketId);
    var options=template.hypotheses.filter(function(id){return record.ruledOut.indexOf(id)<0;}).map(function(id){return {t:labelHypothesis(id),f:function(){var s=load(),result=chooseHypothesis(s,ticketId,id);save(s);if(result.correct)return dialog("HYPOTHESIS SUPPORTED",result.reason+"<br><br>The evidence supports a specific remediation. Do not close the ticket yet.",[{t:"Plan remediation",f:function(){openRemediation(ticketId);}}]);return dialog("HYPOTHESIS REJECTED",result.reason+"<br><br>Use the evidence; do not force the theory.",[{t:"Try another hypothesis",f:function(){openHypotheses(ticketId);}},{t:"Gather more evidence",f:function(){openGather(ticketId);}}]);}};});
    options.push({t:"Back to evidence",f:function(){openGather(ticketId);}});return dialog("FORM HYPOTHESIS // "+def.title,"Choose the explanation that best accounts for the observations. A familiar fix is not evidence.",options);
  }
  function openRemediation(ticketId){
    var def=definition(ticketId),state=load(),record=getRecord(state,ticketId,false);if(!record||record.hypothesis!==def.correctHypothesis)return openGather(ticketId,record);
    if(record.fixApplied)return openVerification(ticketId);
    return dialog("REMEDIATE // "+def.title,"<b>SUPPORTED CAUSE:</b> "+labelHypothesis(record.hypothesis)+"<br><br>"+def.remediation+"<br><br>Applying the fix is not the same as proving the outcome.",[
      {t:"Apply remediation",f:function(){var s=load();applyFix(s,ticketId);save(s);openVerification(ticketId);}},
      {t:"Review evidence",f:function(){openGather(ticketId);}}
    ]);
  }
  function openVerification(ticketId){
    var def=definition(ticketId),state=load(),record=getRecord(state,ticketId,false);if(!record||!record.fixApplied)return openRemediation(ticketId);
    if(!record.technicalCheckPassed)return dialog("VERIFY TECHNICALLY // "+def.title,def.technicalCheck+"<br><br>This proves the technical path, not the user's outcome.",[
      {t:"Run technical check",f:function(){var s=load();runTechnicalCheck(s,ticketId);save(s);openVerification(ticketId);}},
      {t:"Review evidence",f:function(){openGather(ticketId);}}
    ]);
    return dialog("VERIFY WITH REQUESTER // "+def.title,def.humanVerification+"<br><br><b>Closure requires the real work to succeed.</b>",[
      {t:"Requester confirms restored",f:function(){var s=load();verifyHumanOutcome(s,ticketId);save(s);notify(def.title+" — verified and restored");dialog(def.title,"Technical remediation passed and the requester verified the real outcome.<br><br><b>VERIFIED / RESTORED</b>",[{t:"Close ticket",f:close}]);}},
      {t:"Review evidence",f:function(){openGather(ticketId);}}
    ]);
  }
  function existing(ticketId){var n=nativeAct1();if(n&&typeof n.openTicketFollowUp==="function")return n.openTicketFollowUp(ticketId);return false;}

  function targetTicket(){
    var s=gameState(),n=s&&s.meta&&s.meta.campaignAct1Native;if(!s||s.inDialog||s.inBattle||s.nightMode||!n)return null;var p={x:s.px,y:s.py};
    if(n.shipping&&adjacent(p,n.shipping))return "shipping_cannot_print";
    if(n.plating&&adjacent(p,n.plating))return "plating_workstation_down";
    return null;
  }
  function install(){
    if(!root||root.__techopsCampaignInvestigationInstalled)return false;
    if(typeof root.interact!=="function"||!campaign()||!nativeAct1())return false;
    var base=root.interact;root.interact=function(){
      try{var ticketId=targetTicket();if(ticketId){var state=load();if(state.flags&&state.flags.day_work_unlocked&&!state.tickets[ticketId])return openInvestigation(ticketId);}}
      catch(e){root.__techopsCampaignInvestigationError=String(e&&e.stack||e);}
      return base.apply(this,arguments);
    };
    root.__techopsCampaignInvestigationInstalled=true;root.__techopsCampaignInvestigationBaseInteract=base;return true;
  }
  function bootstrap(){if(install())return true;if(root&&root.setTimeout)root.setTimeout(bootstrap,RETRY_MS);return false;}

  var api={VERSION:VERSION,CASES:CASES,definition:definition,getRecord:publicRecord,recordEvidence:recordEvidence,chooseHypothesis:chooseHypothesis,applyFix:applyFix,runTechnicalCheck:runTechnicalCheck,verifyHumanOutcome:verifyHumanOutcome,openInvestigation:openInvestigation,openGather:openGather,openHypotheses:openHypotheses,openRemediation:openRemediation,openVerification:openVerification,targetTicket:targetTicket,install:install,bootstrap:bootstrap};
  if(root&&root.document){if(root.document.readyState==="loading"&&root.document.addEventListener)root.document.addEventListener("DOMContentLoaded",bootstrap);else bootstrap();}
  return api;
});
