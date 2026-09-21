import assert from 'node:assert/strict';
import {buildGovernanceEvidence,validateKnownIssues,validateRollback} from './scripts/release_governance_report.mjs';

const source={head:'a'.repeat(40),tree:'b'.repeat(40),fingerprint:'c'.repeat(64),dirty:false};

{
  const valid={schema_version:1,issues:[
    {id:'#old-blocker',severity:'P1',status:'closed'},
    {id:'#polish',severity:'P2',status:'open',disposition:'Accepted for candidate; tracked for post-R1 polish'}
  ]};
  const result=validateKnownIssues(valid);
  assert.equal(result.ok,true);
  assert.equal(result.unclassified_count,0);
  const blocker=structuredClone(valid);blocker.issues.push({id:'#stop',severity:'P0',status:'open',disposition:'pending'});
  assert.equal(validateKnownIssues(blocker).ok,false,'open P0 must block governance evidence');
  const missingDisposition=structuredClone(valid);missingDisposition.issues[1].disposition='';
  assert.equal(validateKnownIssues(missingDisposition).ok,false,'open P2/P3 requires explicit disposition');
  const unclassified=structuredClone(valid);unclassified.issues[1].severity='critical';
  assert.equal(validateKnownIssues(unclassified).ok,false,'free-form severities cannot certify');
}

{
  const valid={schema_version:1,rollback_target_sha:'d'.repeat(40),rollback_tested:true,forward_restore_tested:true,save_compatibility_checked:true,environment:'production-like Pages candidate'};
  assert.equal(validateRollback(valid,source.head).ok,true);
  assert.equal(validateRollback({...valid,rollback_target_sha:source.head},source.head).ok,false,'candidate cannot be its own rollback');
  assert.equal(validateRollback({...valid,rollback_tested:false},source.head).ok,false,'untested rollback cannot certify');
  assert.equal(validateRollback({...valid,save_compatibility_checked:false},source.head).ok,false,'save compatibility is part of rollback proof');
}

{
  const built=buildGovernanceEvidence({
    source,
    knownIssues:{schema_version:1,issues:[{id:'#polish',severity:'P3',status:'open',disposition:'accepted cosmetic debt'}]},
    rollback:{schema_version:1,rollback_target_sha:'d'.repeat(40),rollback_tested:true,forward_restore_tested:true,save_compatibility_checked:true,environment:'staging'}
  });
  assert.equal(built.report.status,'passed');
  assert.deepEqual(built.report.checks.map(c=>c.id),['known_issue_gate','rollback_receipt']);
  assert.equal(built.report.artifacts.length,2);
  for(const check of built.report.checks)assert.equal(check.status,'passed');
  const issueArtifact=built.report.checks[0].observations.issue_inventory;
  assert.equal(issueArtifact.sha256,built.report.artifacts.find(a=>a.path===issueArtifact.artifact_path).sha256);
  const rollbackArtifact=built.report.checks[1].observations.rollback_record;
  assert.equal(rollbackArtifact.sha256,built.report.artifacts.find(a=>a.path===rollbackArtifact.artifact_path).sha256);
}

{
  const built=buildGovernanceEvidence({source,knownIssues:{schema_version:1,issues:[{id:'#blocker',severity:'P1',status:'open',disposition:'must fix'}]}});
  assert.equal(built.report.status,'failed');
  assert.equal(built.report.checks[0].status,'failed');
  assert.match(built.report.problems.join(' '),/open release blockers/);
}

console.log('R1 release governance evidence builder: PASS');
