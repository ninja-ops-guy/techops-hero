import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {assessEvidence,digest} from './scripts/quality_release_receipt.mjs';

const root=fs.mkdtempSync(path.join(os.tmpdir(),'techops-receipt-'));
try{
  const source={head:'a'.repeat(40),tree:'b'.repeat(40),fingerprint:'c'.repeat(64),dirty:false};
  const captureBytes='observed touch sequence';
  const captureSha=digest(captureBytes);
  fs.writeFileSync(path.join(root,'capture.txt'),captureBytes);
  const baseReport={schema_version:1,status:'passed',source,artifacts:[{path:'capture.txt',sha256:captureSha}]};
  const inventory={schema_version:1,requirements:[{id:'touch',profiles:['iphone-safari'],evidence_types:['physical-device']}]};
  const report={...structuredClone(baseReport),checks:[{id:'touch',profile:'iphone-safari',status:'passed',evidence_type:'physical-device',physical_device:true,fixture:false,operator:'Device tester',device:'Named physical iPhone',browser:'Safari/OS build recorded',observations:{rotation:true,resume:true}}]};
  const assess=reports=>assessEvidence(inventory,reports,{source,root});
  assert.equal(assess([]).status,'blocked','missing reports cannot certify release');
  assert.equal(assess([{status:'passed'}]).status,'blocked','pass booleans are insufficient');
  assert.equal(assess([report]).status,'ready');
  for(const mutate of [
    r=>r.source.fingerprint='d'.repeat(64),
    r=>r.source.head='d'.repeat(40),
    r=>r.source.tree='e'.repeat(40),
    r=>r.artifacts[0].sha256='e'.repeat(64),
    r=>r.checks[0].physical_device=false,
    r=>r.checks[0].fixture=true,
    r=>delete r.checks[0].operator,
    r=>r.checks[0].observations={},
    r=>r.checks[0].evidence_type='browser-input',
    r=>r.checks[0].profile='chromium-portrait'
  ]){
    const copy=structuredClone(report);mutate(copy);assert.equal(assess([copy]).status,'blocked');
  }
  assert.equal(assessEvidence(inventory,[report],{source:{...source,dirty:true},root}).status,'blocked','dirty candidate cannot become release certified');

  const actual=JSON.parse(fs.readFileSync('release_certification.json','utf8'));
  const req=id=>actual.requirements.find(r=>r.id===id);
  const assessSingle=(requirement,check)=>assessEvidence({schema_version:1,requirements:[requirement]},[{...structuredClone(baseReport),checks:[check]}],{source,root});

  const mediaRequirement=req('decoded_cinematics');
  const mediaInventory={schema_version:1,requirements:[{...mediaRequirement,profiles:['desktop-chrome']}]};
  const manifest=JSON.parse(fs.readFileSync(mediaRequirement.media_manifest,'utf8'));
  const mediaReport={...structuredClone(baseReport),checks:[{id:'decoded_cinematics',profile:'desktop-chrome',status:'passed',evidence_type:'decoded-media',physical_device:false,fixture:false,operator:'Media tester',device:'Desktop',browser:'Chrome stable',observations:{clips:manifest.processed_media.map(c=>({file:c.pixel_file,sha256:c.sha256,decoded_frames:30,current_time:1,pause_resume_verified:true,skip_verified:true}))}}]};
  const assessMedia=r=>assessEvidence(mediaInventory,[r],{source,root});
  assert.equal(assessMedia(mediaReport).status,'ready');
  for(const mutate of [
    r=>r.checks[0].observations.clips.pop(),
    r=>r.checks[0].observations.clips[1]=r.checks[0].observations.clips[0],
    r=>r.checks[0].observations.clips[0].sha256='f'.repeat(64),
    r=>r.checks[0].observations.clips[0].decoded_frames=0,
    r=>r.checks[0].observations.clips[0].skip_verified=false
  ]){
    const copy=structuredClone(mediaReport);mutate(copy);assert.equal(assessMedia(copy).status,'blocked','partial/duplicate/stale/undecoded media evidence cannot certify');
  }

  const titleRequirement=req('title_routes');
  const forged={...structuredClone(baseReport),checks:[{id:'title_routes',profile:'chromium-desktop',status:'passed',evidence_type:'browser-input',observations:{claimed_pass:true}}]};
  assert.equal(assessEvidence({schema_version:1,requirements:[{...titleRequirement,profiles:['chromium-desktop']}]},[forged],{source,root}).status,'blocked','nonempty arbitrary observations cannot certify a title');

  const ciRequirement=req('protected_ci');
  assert.deepEqual(ciRequirement.required_contexts,['Static and release contracts','Browser acceptance','required'],'protection contract must retain exact check names');
  const ciInventory={schema_version:1,requirements:[ciRequirement]},ciReport={...structuredClone(baseReport),checks:[{id:'protected_ci',profile:'github',status:'passed',evidence_type:'remote-ci',observations:{protection_verified:true,protection_enabled:true,protection_enforced:true,head:source.head,required_contexts:[...ciRequirement.required_contexts],required_checks:ciRequirement.required_contexts.map(name=>({name,conclusion:'success'}))}}]};
  const assessCI=r=>assessEvidence(ciInventory,[r],{source,root});
  assert.equal(assessCI(ciReport).status,'ready','enabled and enforced protection with every exact required check succeeds');
  const reproduced=structuredClone(ciReport);
  reproduced.checks[0].observations={protection_verified:true,protection_enabled:false,required_contexts:[],head:source.head,required_checks:[{name:'Static and release contracts',conclusion:'success'}]};
  assert.equal(assessCI(reproduced).status,'blocked','verified absence/disabled protection plus one green check cannot certify');
  for(const [reason,mutate]of [
    ['unverified protection',o=>delete o.protection_verified],
    ['absent protection',o=>delete o.protection_enabled],
    ['disabled protection',o=>o.protection_enabled=false],
    ['unenforced protection',o=>o.protection_enforced=false],
    ['missing enforcement evidence',o=>delete o.protection_enforced],
    ['no required contexts',o=>o.required_contexts=[]],
    ['missing required context',o=>o.required_contexts.pop()],
    ['renamed required context',o=>o.required_contexts[1]='Browser acceptance renamed'],
    ['duplicate required context',o=>o.required_contexts[1]=o.required_contexts[0]],
    ['missing expected check',o=>o.required_checks.pop()],
    ['failed expected check',o=>o.required_checks[1].conclusion='failure'],
    ['pending expected check',o=>o.required_checks[1].conclusion=null],
    ['renamed expected check',o=>o.required_checks[1].name='Browser acceptance renamed'],
    ['duplicate expected check',o=>o.required_checks[1]=o.required_checks[0]],
    ['stale candidate head',o=>o.head='f'.repeat(40)]
  ]){const copy=structuredClone(ciReport);mutate(copy.checks[0].observations);assert.equal(assessCI(copy).status,'blocked',reason);}

  const freeze=req('candidate_freeze');
  const freezeCheck={id:freeze.id,profile:'candidate',status:'passed',evidence_type:'freeze-record',observations:{head:source.head,tree:source.tree,fingerprint:source.fingerprint,frozen_at:'2026-09-21T04:30:00Z',change_policy:'invalidate-all-evidence',freeze_record:{artifact_path:'capture.txt',sha256:captureSha}}};
  assert.equal(assessSingle(freeze,freezeCheck).status,'ready','explicit candidate freeze should pass');
  const staleFreeze=structuredClone(freezeCheck);staleFreeze.observations.fingerprint='f'.repeat(64);
  assert.equal(assessSingle(freeze,staleFreeze).status,'blocked','stale freeze cannot certify');

  const deployment=req('deployed_identity');
  const deploymentCheck={id:deployment.id,profile:'production-like',status:'passed',evidence_type:'deployment',observations:{head:source.head,tree:source.tree,immutable:true,build_id:'techops-r1-candidate',deployment_url:'https://example.invalid/build',asset_manifest:{artifact_path:'capture.txt',sha256:captureSha}}};
  assert.equal(assessSingle(deployment,deploymentCheck).status,'ready','exact deployed identity should pass');
  const staleDeployment=structuredClone(deploymentCheck);staleDeployment.observations.head='d'.repeat(40);
  assert.equal(assessSingle(deployment,staleDeployment).status,'blocked','deployment must match candidate HEAD');

  const vertical=req('vertical_slice_checkpoints');
  const verticalArtifacts=vertical.required_cases.map(id=>{
    const artifactPath=`checkpoints/${id}.txt`,bytes=`checkpoint ${id}`;
    fs.mkdirSync(path.dirname(path.join(root,artifactPath)),{recursive:true});
    fs.writeFileSync(path.join(root,artifactPath),bytes);
    return {path:artifactPath,sha256:digest(bytes)};
  });
  const checkpointCheck={id:vertical.id,profile:'desktop',status:'passed',evidence_type:'visual-checkpoint',fixture:false,operator:'Visual reviewer',device:'Desktop reference',browser:'Chromium',observations:{checkpoints:vertical.required_cases.map((id,index)=>({id,passed:true,reviewed:true,blocker:false,artifact_path:verticalArtifacts[index].path,sha256:verticalArtifacts[index].sha256}))}};
  const verticalReport={...structuredClone(baseReport),artifacts:[...structuredClone(baseReport.artifacts),...verticalArtifacts],checks:[checkpointCheck]};
  assert.equal(assessEvidence({schema_version:1,requirements:[{...vertical,profiles:['desktop']}]},[verticalReport],{source,root}).status,'ready','reviewed vertical-slice checkpoints should pass');
  const missingCheckpoint=structuredClone(verticalReport);missingCheckpoint.checks[0].observations.checkpoints.pop();
  assert.equal(assessEvidence({schema_version:1,requirements:[{...vertical,profiles:['desktop']}]},[missingCheckpoint],{source,root}).status,'blocked');
  const duplicateCapture=structuredClone(verticalReport);duplicateCapture.checks[0].observations.checkpoints[1].artifact_path=duplicateCapture.checks[0].observations.checkpoints[0].artifact_path;duplicateCapture.checks[0].observations.checkpoints[1].sha256=duplicateCapture.checks[0].observations.checkpoints[0].sha256;
  assert.equal(assessEvidence({schema_version:1,requirements:[{...vertical,profiles:['desktop']}]},[duplicateCapture],{source,root}).status,'blocked','each vertical checkpoint needs a distinct retained capture');

  const input=req('device_input_matrix');
  const inputCheck={id:input.id,profile:'candidate',status:'passed',evidence_type:'device-input-matrix',observations:{matrix_artifact:{artifact_path:'capture.txt',sha256:captureSha},cases:input.required_cases.map(id=>({id,passed:true,progression_reachable:true,prompt_action_match:true,lost_input:false,duplicate_input:false}))}};
  assert.equal(assessSingle(input,inputCheck).status,'ready');
  const badInput=structuredClone(inputCheck);badInput.observations.cases[0].prompt_action_match=false;
  assert.equal(assessSingle(input,badInput).status,'blocked');

  const persistence=req('persistence_matrix');
  const persistenceCheck={id:persistence.id,profile:'candidate',status:'passed',evidence_type:'persistence-matrix',observations:{matrix_artifact:{artifact_path:'capture.txt',sha256:captureSha},cases:persistence.required_cases.map(id=>({id,passed:true,equivalent_state:true,data_loss:false,duplicate_events:0,duplicate_rewards:0}))}};
  assert.equal(assessSingle(persistence,persistenceCheck).status,'ready');
  const badPersistence=structuredClone(persistenceCheck);badPersistence.observations.cases[2].duplicate_events=1;
  assert.equal(assessSingle(persistence,badPersistence).status,'blocked');

  const performance=req('performance_budget');
  const desktopPerformance={id:performance.id,profile:'desktop-chromium',status:'passed',evidence_type:'performance-profile',fixture:false,operator:'Perf tester',device:'Desktop reference',browser:'Chromium',physical_device:false,observations:{first_playable_ms:2500,core_input_p95_ms:70,duration_seconds:1800,asset_decode_failures:0,softlocks:0,blocking_stalls:0,measurement_artifact:{artifact_path:'capture.txt',sha256:captureSha}}};
  assert.equal(assessEvidence({schema_version:1,requirements:[{...performance,profiles:['desktop-chromium']}]},[{...structuredClone(baseReport),checks:[desktopPerformance]}],{source,root}).status,'ready');
  const slow=structuredClone(desktopPerformance);slow.observations.first_playable_ms=3500;
  assert.equal(assessEvidence({schema_version:1,requirements:[{...performance,profiles:['desktop-chromium']}]},[{...structuredClone(baseReport),checks:[slow]}],{source,root}).status,'blocked','budget regression must block');
  const mobilePerf={...structuredClone(desktopPerformance),profile:'iphone-safari',device:'Named iPhone',browser:'Safari',observations:{...desktopPerformance.observations,first_playable_ms:4000}};
  assert.equal(assessEvidence({schema_version:1,requirements:[{...performance,profiles:['iphone-safari']}]},[{...structuredClone(baseReport),checks:[mobilePerf]}],{source,root}).status,'blocked','mobile performance must be physical evidence');
  mobilePerf.physical_device=true;
  assert.equal(assessEvidence({schema_version:1,requirements:[{...performance,profiles:['iphone-safari']}]},[{...structuredClone(baseReport),checks:[mobilePerf]}],{source,root}).status,'ready');

  const playtest=req('fresh_context_playtest');
  const playtestCheck={id:playtest.id,profile:'r1-vertical-slice',status:'passed',evidence_type:'human-playtest',fixture:false,operator:'Fresh-context tester',device:'Desktop',browser:'Chromium',observations:{route_completed:true,developer_intervention:false,assistance:[],confusion_points:['Workstation prompt learned from desk proximity'],blocking_confusion:0,terminal_state:'returned',duration_seconds:1200,checkpoints_seen:[...playtest.required_cases],playtest_record:{artifact_path:'capture.txt',sha256:captureSha}}};
  assert.equal(assessSingle(playtest,playtestCheck).status,'ready');
  const coached=structuredClone(playtestCheck);coached.observations.developer_intervention=true;
  assert.equal(assessSingle(playtest,coached).status,'blocked','developer intervention invalidates fresh-context comprehension');

  const known=req('known_issue_gate');
  const knownCheck={id:known.id,profile:'candidate',status:'passed',evidence_type:'release-governance',observations:{unclassified_count:0,issue_inventory:{artifact_path:'capture.txt',sha256:captureSha},issues:[{id:'#4-device-evidence',severity:'P2',status:'open',disposition:'Accepted for this candidate with explicit owner disposition'},{id:'#old-p0',severity:'P0',status:'closed'}]}};
  assert.equal(assessSingle(known,knownCheck).status,'ready');
  const openP1=structuredClone(knownCheck);openP1.observations.issues.push({id:'#blocker',severity:'P1',status:'open',disposition:'pending'});
  assert.equal(assessSingle(known,openP1).status,'blocked','open P0/P1 must block certification');

  const rollback=req('rollback_receipt');
  const rollbackCheck={id:rollback.id,profile:'candidate',status:'passed',evidence_type:'rollback-validation',observations:{candidate_head:source.head,rollback_target_sha:'d'.repeat(40),rollback_tested:true,forward_restore_tested:true,save_compatibility_checked:true,rollback_record:{artifact_path:'capture.txt',sha256:captureSha}}};
  assert.equal(assessSingle(rollback,rollbackCheck).status,'ready');
  const untestedRollback=structuredClone(rollbackCheck);untestedRollback.observations.rollback_tested=false;
  assert.equal(assessSingle(rollback,untestedRollback).status,'blocked');

  fs.writeFileSync(path.join(root,'capture.txt'),'changed capture');
  assert.equal(assess([report]).status,'blocked','artifact bytes are reverified');
  assert.equal(new Set(actual.requirements.map(r=>r.id)).size,actual.requirements.length);
  for(const item of actual.requirements)for(const key of ['id','description','evidence_types','profiles','spot_check'])assert.ok(item[key]?.length,`${item.id}: missing ${key}`);
  console.log('Release certification refuses missing, stale, spoofed-tier, weak R1 and modified evidence: PASS');
}finally{fs.rmSync(root,{recursive:true,force:true});}
