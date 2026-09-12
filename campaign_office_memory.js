/* Persistent office follow-ups: UI and procedural-ticket adapter only.
 * campaign_act1.js owns records and transitions; the ordinary KB is an idempotent
 * projection of published verification, not another evidence or reward authority. */
(function(root){
  'use strict';
  const ORDINARY=new Set(['printer','vpn','dns','ad','malware','email','bsod','plc','wifi','cert','disk','update','share','vlan','backup','slowpc']);
  const HYPOTHESES={service_dependency:'A failed shared service dependency',requester_path:'A requester-specific service path',verification_only:'No observed fault — complete verification'};
  function game(){try{return typeof S!=='undefined'?S:root.S;}catch(e){return root.S;}}
  function C(){return root.TechOpsCampaign;}
  function escape(text){return String(text==null?'Unrecorded':text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function close(){if(root.closeDlg)root.closeDlg();}
  function dialog(title,body,options){if(root.dlg)root.dlg(title,body,options);}
  function available(){const s=game();return !!(s&&!s.nightMode&&!s.inBattle&&C());}
  function notice(error){root.__officeMemoryError=String(error&&error.message||error);dialog('OFFICE MEMORY // RECORD UNAVAILABLE','The record could not be read or saved. Your prior progress has not been replaced. Close this view and retry.',[{t:'Close',f:close}]);return false;}
  function read(){const s=game(),state=C().load(root.localStorage);return {state,day:Math.max(1,Math.floor(Number(s&&s.day)||1))};}
  function syncKnowledge(state,s){if(!s)return;s.meta=s.meta||{};s.meta.kb=s.meta.kb||{};const kb=state.officeMemory&&state.officeMemory.knowledge||{};for(const id of Object.keys(kb))if(ORDINARY.has(id)&&kb[id].verified)s.meta.kb[id]=true;}
  function captureTicket(n,s,owner){
    if(!C()||!s||!n||!n.done||n.ambient||!n.type||!ORDINARY.has(n.type.id)||n.campaignContact||n.campaignTicketId)return false;
    try{const state=C().load(root.localStorage),record=C().recordOfficeClosure(state,{
      kind:'procedural',id:String(n.id)+':'+n.type.id+':'+(n.chainDepth||0),day:s.day,title:n.type.label,department:n.dept,
      ownerId:owner||n.delegatedTo||'mike',typeId:n.type.id,humanNeed:(n.name||'The requester')+' in '+n.dept+' needs the original task to work, not just a green device status.',
      verification:n.verifiedFix===true?'strong':'partial',humanOutcome:n.verifiedFix===true?'restored':'unknown',pendingRepeat:n.pendingRepeat===true,completedAt:new Date().toISOString()
    });if(!record){root.__officeMemoryCapacityReached=true;return false;}C().save(state,root.localStorage);return true;}catch(error){root.__officeMemoryError=String(error&&error.message||error);return false;}
  }
  function open(filter,page){
    if(!available())return false;filter=filter||'due';page=Math.max(0,Math.floor(Number(page)||0));
    try{const {state,day}=read();syncKnowledge(state,game());const all=C().officeRecords(state,day),rows=all.filter(r=>filter==='all'||(r.due&&r.followUp.phase!=='closed')).reverse(),last=Math.max(0,Math.ceil(rows.length/6)-1);page=Math.min(page,last);
      const opts=rows.slice(page*6,page*6+6).map(r=>({t:escape(r.title)+' · '+(r.followUp.phase==='closed'?'VERIFIED':!r.due?'DUE DAY '+r.dueDay:r.repeatRisk?'RECHECK':'SERVICE REVIEW'),f:()=>openRecord(r.id)}));
      if(page>0)opts.push({t:'Previous page',f:()=>open(filter,page-1)});if(page<last)opts.push({t:'Next page',f:()=>open(filter,page+1)});
      opts.push({t:filter==='all'?'Show due follow-ups':'Show all work history',f:()=>open(filter==='all'?'due':'all',0)},{t:'Return to work',f:close});
      dialog('OFFICE // SHIFT HANDOFF','<b>DAY '+day+' · '+rows.length+' '+(filter==='all'?'recorded cases':'due follow-ups')+'</b><br><br>Weak verification creates a reason to recheck, not proof that a fault returned. A strong closure can become a reusable handoff.<br><br>'+(rows.length?'Choose a case. Progress resumes at the last saved step.':'No follow-ups are due. Completed ordinary tickets enter this ledger for the following workday.'),opts);return true;
    }catch(error){return notice(error);}
  }
  function openRecord(id,message){
    if(!available())return false;
    try{const {state,day}=read(),r=C().officeRecords(state,day).find(r=>r.id===id);if(!r)return open();const f=r.followUp;
      let body='<b>'+escape(r.title)+'</b><br>'+escape(r.humanNeed)+'<br><br>Original owner: '+escape(r.ownerId)+' · Day '+r.day+'<br>Original verification: '+escape(r.verification)+' · Human outcome: '+escape(r.humanOutcome)+'<br>Follow-up: '+escape(f.phase.toUpperCase());
      if(message)body+='<br><br><b>'+escape(message)+'</b>';
      for(const observation of Object.values(f.observations))body+='<br><br>'+escape(observation.text);
      let opts=[];
      const option=(t,a,v)=>({t,f:()=>act(id,a,v)});
      if(r.due){
        if(f.phase==='intake')opts=[option('Talk to the requester','intake')];
        else if(f.phase==='evidence'){if(!f.observations.service_probe)opts.push(option('Check the technical service','observe','service_probe'));if(!f.observations.requester_trial)opts.push(option('Watch the requester repeat the real task','observe','requester_trial'));}
        else if(f.phase==='hypothesis')opts=Object.keys(HYPOTHESES).filter(h=>!f.ruledOut.includes(h)).map(h=>option(HYPOTHESES[h],'hypothesis',h));
        else if(f.phase==='remediation')opts=[option('Apply the targeted correction','remediate')];
        else if(f.phase==='verify')opts=[option('Recheck service AND requester outcome','verify')];
        else if(f.phase==='prevention')opts=[option('Publish verified handoff to the knowledge base','publish'),option('Close without publishing','close')];
        else body+='<br><br>Follow-up verified on Day '+f.verifiedDay+'. '+(f.published?'The verified handoff is available to the next shift.':'No reusable method was published.')+' Original closure and ownership remain unchanged.';
      }else body+='<br><br>Scheduled for Day '+r.dueDay+'. Nothing has been rechecked yet.';
      opts.push({t:'Back to shift handoff',f:()=>open()},{t:'Leave and resume later',f:close});
      dialog('FOLLOW-UP // '+escape(r.title),body,opts);return true;
    }catch(error){return notice(error);}
  }
  function act(id,action,value){
    if(!available())return false;
    try{const {state,day}=read(),result=C().followUpAction(state,id,day,action,value);if(result.changed){C().save(state,root.localStorage);syncKnowledge(state,game());if(action==='publish'&&root.save)root.save();
        const cost={intake:2,observe:3,remediate:6,verify:4,publish:3}[action]||0;
        if(cost&&root.advanceClock){close();root.advanceClock(cost);const eod=root.document&&root.document.getElementById('eod');if(eod&&!eod.classList.contains('hidden'))return true;}
      }
      return openRecord(id,result.message);
    }catch(error){return notice(error);}
  }
  root.TechOpsOfficeMemory={VERSION:1,ORDINARY,available,captureTicket,syncKnowledge,open,openRecord,act};
})(typeof globalThis!=='undefined'?globalThis:this);
