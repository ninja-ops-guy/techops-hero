'use strict';
const assert=require('node:assert/strict');
const api=require('./runtime_day_cases.js');
let assertions=0;
function check(value,message){assert.ok(value,message);assertions++;}
function rejectsUnchanged(record,operation,pattern){
  const before=JSON.stringify(record);
  assert.throws(operation,pattern);assert.equal(JSON.stringify(record),before);assertions+=2;
}
function gather(record){api.definition(record.caseId).evidence.forEach(item=>api.observe(record,item.id,item.surface));return record;}
function supported(id){const record=gather(api.create(id));check(api.hypothesize(record,api.definition(id).correctHypothesis).correct,'Complete evidence supports cause');return record;}

assert.equal(api.ids().length,8);assertions++;
check(!api.ids().includes('shipping_cannot_print')&&!api.ids().includes('plating_workstation_down'),'Optional cases do not replace canonical opening tickets');
assert.throws(()=>api.definition('__proto__'),/Unknown Day device/);assertions++;

for(const id of api.ids()){
  const def=api.definition(id),record=api.create(id);
  check(def.deviceKind&&def.roomId&&def.zoneId&&def.requester&&def.humanNeed&&def.symptom,'Cases include physical and human context');
  check(Object.isFrozen(def)&&Object.isFrozen(def.evidence)&&Object.isFrozen(def.evidence[0].hotspot),'Authored definitions are deeply immutable');
  check(def.hypotheses.length>=3,'Each incident has distinct competing hypotheses');
  check(def.evidence.some(e=>e.surface==='physical')&&def.evidence.some(e=>e.surface==='screen'),'Both physical and screen observations are authored');
  check(def.authorization&&def.remediation&&def.technicalCheck&&def.requesterCheck,'Every incident includes consent, bounded repair and both kinds of verification');
  for(const item of def.evidence){
    const h=item.hotspot;
    check(h.x>=0&&h.y>=0&&h.w>0&&h.h>0&&h.x+h.w<=100&&h.y+h.h<=100,'Pointer targets fit normalized device surface');
  }
  rejectsUnchanged(record,()=>api.hypothesize(record,def.correctHypothesis),/two independent/);
  rejectsUnchanged(record,()=>api.authorize(record),/Support a cause/);
  rejectsUnchanged(record,()=>api.remediate(record),/authorization/);
  rejectsUnchanged(record,()=>api.verifyTechnical(record),/bounded repair/);
  rejectsUnchanged(record,()=>api.verifyRequester(record),/Technical verification/);
  rejectsUnchanged(record,()=>api.observe(record,'unrelated_case_evidence','physical'),/Unknown evidence/);
  const first=def.evidence[0];
  rejectsUnchanged(record,()=>api.observe(record,first.id,first.surface==='physical'?'screen':'physical'),/inspection surface/);
  rejectsUnchanged(record,()=>api.observe(record,first.id),/inspection surface/);

  def.evidence.slice(0,2).forEach(e=>api.observe(record,e.id,e.surface));
  let snapshot=JSON.stringify(record);
  const premature=api.hypothesize(record,def.correctHypothesis);
  check(premature.correct===false&&premature.needsEvidence===true&&premature.missingEvidence.length>0,'Guessing right without the decisive observation does not progress');
  assert.equal(JSON.stringify(record),snapshot);assertions++;
  const wrong=def.hypotheses.find(h=>h.id!==def.correctHypothesis);
  const rejected=api.hypothesize(record,wrong.id);
  check(rejected.correct===false&&rejected.reason===wrong.reason,'Wrong cause explains why it does not fit');
  check(record.phase==='inspect'&&record.hypothesis===null&&!record.authorized&&!record.fixApplied,'Wrong cause creates no repair progress');
  snapshot=JSON.stringify(record);api.hypothesize(record,wrong.id);
  assert.equal(JSON.stringify(record),snapshot);assertions++;
  gather(record);snapshot=JSON.stringify(record);gather(record);
  assert.equal(JSON.stringify(record),snapshot);assertions++;

  const supportedResult=api.hypothesize(record,def.correctHypothesis);
  check(supportedResult.correct&&api.phase(record)==='authorize','Evidence unlocks coordination, not an automatic fix');
  rejectsUnchanged(record,()=>api.remediate(record),/authorization/);
  api.authorize(record);
  check(record.phase==='remediate'&&!record.fixApplied,'Owner coordination is separate from repair');
  rejectsUnchanged(record,()=>api.verifyTechnical(record),/bounded repair/);
  api.remediate(record);
  check(record.phase==='technical'&&!record.technicalVerified,'Repair still needs verification');
  rejectsUnchanged(record,()=>api.verifyRequester(record),/Technical verification/);
  api.verifyTechnical(record);
  check(record.phase==='requester'&&!api.summary(record).complete,'A green diagnostic does not close the human outcome');
  const restored=JSON.parse(JSON.stringify(record));
  api.verifyRequester(restored);
  check(api.summary(restored).complete&&api.summary(restored).status==='VERIFIED / RESTORED'&&api.summary(restored).progress===100,'Saved records resume to verified restoration');
  check(api.summary(restored).perfect===false,'Rejected guesses do not receive Perfect Investigation');
  snapshot=JSON.stringify(restored);
  gather(restored);api.hypothesize(restored,def.correctHypothesis);api.authorize(restored);api.remediate(restored);api.verifyTechnical(restored);api.verifyRequester(restored);
  assert.equal(JSON.stringify(restored),snapshot);assertions++;
  rejectsUnchanged(restored,()=>api.hypothesize(restored,wrong.id),/cannot be replaced/);

  const clean=supported(id);api.authorize(clean);api.remediate(clean);api.verifyTechnical(clean);api.verifyRequester(clean);
  check(api.summary(clean).perfect,'Evidence-led first choice earns perfect investigation');
  const malformed=api.create(id);malformed.fixApplied=true;
  rejectsUnchanged(malformed,()=>api.verifyTechnical(malformed),/flags disagree/);
  const corrupted=supported(id);corrupted.evidence=[];
  rejectsUnchanged(corrupted,()=>api.authorize(corrupted),/missing required evidence/);
}

const plc=api.definition('plc_hmi_dependency');
check(plc.safety.requiresSafeWindow&&plc.safety.forbiddenChanges.includes('PLC logic')&&plc.safety.forbiddenChanges.includes('interlocks'),'OT case scopes owner approval and forbids PLC/safety edits');
check(/operator and controls owner/i.test(plc.authorization),'PLC maintenance authority comes from the operator and controls owner');
check(/operator.*owns the return/i.test(plc.requesterCheck),'IT cannot independently return the machine to operation');
const printer=api.definition('printer_queue_blocked');
check(printer.correctHypothesis==='blocked_job'&&printer.zoneId==='finance','Queue incident is distinct from canonical Shipping permissions');
check(api.definition('timeclock_time_sync').remediation.indexOf('approved')>=0,'Clock correction stays within approved management');
console.log('Day device cases: PASS ('+assertions+' assertions; 8 complete paths, surface/order/authority/save/idempotence negatives)');
