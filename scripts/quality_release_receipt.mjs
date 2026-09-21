#!/usr/bin/env node
// Evidence validator for TechOps Hero release qualification.
// An absent, stale, fixture-only or weak report must block release rather than
// being converted into a synthetic success.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

export const digest = value => crypto.createHash('sha256').update(value).digest('hex');
const SHA40=/^[a-f0-9]{40}$/;
const SHA256=/^[a-f0-9]{64}$/;

function retainedArtifact(report,item){
  if(!item||typeof item.artifact_path!=='string'||!SHA256.test(item.sha256||''))return false;
  return report.artifacts.some(a=>a.path===item.artifact_path&&a.sha256===item.sha256);
}

function requiredCasesMatch(cases,requirement,predicate=()=>true){
  const expected=requirement.required_cases;
  return Array.isArray(expected)&&expected.length>0&&Array.isArray(cases)&&new Set(cases.map(c=>c?.id)).size===cases.length&&
    expected.every(id=>cases.some(c=>c?.id===id&&c.passed===true&&predicate(c)));
}

function observationMatches(check,requirement,report,source){
  const o=check.observations;
  if(check.id==='candidate_freeze')return o.head===source?.head&&o.tree===source?.tree&&o.fingerprint===source?.fingerprint&&
    SHA40.test(o.head||'')&&SHA40.test(o.tree||'')&&SHA256.test(o.fingerprint||'')&&
    Number.isFinite(Date.parse(o.frozen_at))&&o.change_policy==='invalidate-all-evidence';
  if(check.id==='deployed_identity')return o.head===source?.head&&o.tree===source?.tree&&o.immutable===true&&
    typeof o.build_id==='string'&&o.build_id.length>0&&/^https:\/\//.test(o.deployment_url||'')&&retainedArtifact(report,o.asset_manifest);
  if(check.id==='title_routes')return Array.isArray(o.cards)&&['btn-start','btn-v736','btn-nightcrawler'].every(id=>o.cards.some(c=>c.id===id&&c.disabled===false&&typeof c.label==='string'&&c.label.length))&&o.viewport?.width>0&&o.viewport?.height>0;
  if(check.id==='day_resume')return o.checkpoint_saved_at>0&&o.resumed?.ticketsAlias===true&&o.resumed.music===true&&o.resumed.shell==='day'&&['day','px','py','budget','clock'].every(k=>Number.isFinite(o.resumed[k]));
  if(check.id==='night_resume')return o.checkpoint_saved_at>0&&o.campaign_isolation===true&&o.after?.inDialog===false&&Array.isArray(o.before?.enemies)&&['x','hp','district','street','cash','kills'].every(k=>o.before[k]===o.after[k]);
  if(check.id==='good_dogs_selector')return ['solo','local'].includes(o.mode)&&o.cancellation_recovered===true&&o.prologue_shots===3&&typeof o.touch_only_local_disabled==='boolean';
  if(check.id==='cinematic_recovery')return o.source_assigned===false&&o.late_escape_did_not_repeat===true&&Array.isArray(o.writes)&&o.writes.length===1&&o.writes[0].status==='USER_SKIPPED';
  if(check.id==='vertical_slice_checkpoints')return requiredCasesMatch(o.checkpoints,requirement,c=>c.reviewed===true&&c.blocker!==true&&retainedArtifact(report,c));
  if(check.id==='device_input_matrix')return requiredCasesMatch(o.cases,requirement,c=>c.progression_reachable===true&&c.prompt_action_match===true&&c.lost_input===false&&c.duplicate_input===false);
  if(check.id==='physical_mobile')return requiredCasesMatch(o.cases,requirement);
  if(check.id==='persistence_matrix')return requiredCasesMatch(o.cases,requirement,c=>c.equivalent_state===true&&c.data_loss===false&&c.duplicate_events===0&&c.duplicate_rewards===0);
  if(check.id==='unassisted_routes')return o.route_completed===true&&o.save_reload_verified===true&&typeof o.terminal_state==='string'&&o.terminal_state.length>0&&Array.isArray(o.assistance)&&o.assistance.length===0;
  if(check.id==='performance_budget'){
    const budget=requirement.budgets?.[check.profile];
    return !!budget&&Number.isFinite(o.first_playable_ms)&&o.first_playable_ms>0&&o.first_playable_ms<=budget.first_playable_ms&&
      Number.isFinite(o.core_input_p95_ms)&&o.core_input_p95_ms>0&&o.core_input_p95_ms<=budget.core_input_p95_ms&&
      Number.isFinite(o.duration_seconds)&&o.duration_seconds>0&&o.asset_decode_failures===0&&o.softlocks===0&&
      Number.isInteger(o.blocking_stalls)&&o.blocking_stalls>=0;
  }
  if(check.id==='device_soak')return Number.isFinite(o.frame_p95_ms)&&o.frame_p95_ms>0&&Number.isFinite(o.frame_p99_ms)&&o.frame_p99_ms>=o.frame_p95_ms&&typeof o.memory_observation==='string'&&o.memory_observation.length>0&&typeof o.thermal_observation==='string'&&o.thermal_observation.length>0&&o.blocking_stalls===0;
  if(check.id==='fresh_context_playtest')return o.route_completed===true&&o.developer_intervention===false&&Array.isArray(o.assistance)&&o.assistance.length===0&&
    Array.isArray(o.confusion_points)&&o.blocking_confusion===0&&typeof o.terminal_state==='string'&&o.terminal_state.length>0&&
    Number.isFinite(o.duration_seconds)&&o.duration_seconds>0&&requiredCasesMatch((o.checkpoints_seen||[]).map(id=>({id,passed:true})),requirement);
  if(check.id==='known_issue_gate'){
    if(!Array.isArray(o.issues))return false;
    const valid=o.issues.every(i=>typeof i.id==='string'&&i.id&&['P0','P1','P2','P3'].includes(i.severity)&&['open','closed'].includes(i.status)&&
      (i.status==='closed'||typeof i.disposition==='string'&&i.disposition.length>0));
    return valid&&!o.issues.some(i=>i.status==='open'&&(i.severity==='P0'||i.severity==='P1'))&&o.unclassified_count===0;
  }
  if(check.id==='rollback_receipt')return o.candidate_head===source?.head&&SHA40.test(o.rollback_target_sha||'')&&o.rollback_target_sha!==source?.head&&
    o.rollback_tested===true&&o.forward_restore_tested===true&&o.save_compatibility_checked===true&&retainedArtifact(report,o.rollback_record);
  return true;
}

function protectedChecksMatch(observations,requirement,head){
  const expected=requirement.required_contexts,contexts=observations.required_contexts,checks=observations.required_checks;
  if(observations.protection_verified!==true||observations.protection_enabled!==true||observations.protection_enforced!==true||observations.head!==head)return false;
  if(!Array.isArray(expected)||!expected.length||expected.some(name=>typeof name!=='string'||!name)||new Set(expected).size!==expected.length)return false;
  if(!Array.isArray(contexts)||contexts.length!==expected.length||new Set(contexts).size!==contexts.length||expected.some(name=>!contexts.includes(name)))return false;
  if(!Array.isArray(checks)||checks.length!==expected.length||new Set(checks.map(check=>check?.name)).size!==checks.length)return false;
  return expected.every(name=>checks.some(check=>check?.name===name&&check.conclusion==='success'));
}

export function sourceIdentity(cwd = process.cwd()) {
  const git = args => execFileSync('git',args,{cwd,encoding:'utf8',maxBuffer:32*1024*1024}).trim();
  const head=git(['rev-parse','HEAD']),tree=git(['rev-parse','HEAD^{tree}']);
  const paths=[...new Set([...git(['diff','--name-only','HEAD']).split('\n'),...git(['ls-files','--others','--exclude-standard']).split('\n')])]
    .filter(p=>p&&!/^(artifacts|runtime-bot-artifacts|node_modules)(\/|$)/.test(p)).sort();
  const changes=paths.map(p=>({path:p,sha256:fs.existsSync(path.join(cwd,p))&&fs.statSync(path.join(cwd,p)).isFile()?digest(fs.readFileSync(path.join(cwd,p))):'deleted-or-nonfile'}));
  return {head,tree,dirty:changes.length>0,fingerprint:digest(JSON.stringify({tree,changes}))};
}

export function assessEvidence(inventory,reports,{source,root='.',requireClean=true}={}) {
  if(inventory?.schema_version!==1||!Array.isArray(inventory.requirements)||!inventory.requirements.length)throw Error('Invalid certification inventory');
  if(new Set(inventory.requirements.map(r=>r.id)).size!==inventory.requirements.length)throw Error('Duplicate certification requirement');
  const problems=[],accepted=[];
  for(const report of reports){
    const label=report._file||'(unnamed report)';
    if(report.schema_version!==1||report.status!=='passed'||!Array.isArray(report.checks)||!report.checks.length){problems.push(`${label}: malformed or failed report`);continue;}
    if(!source||report.source?.fingerprint!==source.fingerprint){problems.push(`${label}: source fingerprint does not match candidate`);continue;}
    if(report.source.head!==source.head||report.source.tree!==source.tree){problems.push(`${label}: source HEAD/tree does not match candidate`);continue;}
    if(!SHA40.test(report.source.head||'')||!SHA40.test(report.source.tree||'')){problems.push(`${label}: missing full source identities`);continue;}
    if(!Array.isArray(report.artifacts)||!report.artifacts.length){problems.push(`${label}: no retained artifacts`);continue;}
    let valid=true;
    for(const artifact of report.artifacts){
      const base=path.resolve(root),file=path.resolve(root,String(artifact.path||''));
      if(!file.startsWith(base+path.sep)||!SHA256.test(artifact.sha256||'')||!fs.existsSync(file)||!fs.statSync(file).isFile()||digest(fs.readFileSync(file))!==artifact.sha256){problems.push(`${label}: missing, changed or invalid artifact ${artifact.path}`);valid=false;}
    }
    if(!valid)continue;
    for(const check of report.checks){
      const requirement=inventory.requirements.find(r=>r.id===check.id);
      if(!requirement||check.status!=='passed'||!requirement.profiles.includes(check.profile)||!requirement.evidence_types.includes(check.evidence_type))continue;
      if(!check.observations||!Object.keys(check.observations).length){problems.push(`${label}: ${check.id} has no observations`);continue;}
      if(!observationMatches(check,requirement,report,source)){problems.push(`${label}: ${check.id} lacks its required observed invariants`);continue;}
      if(['physical-device','physical-device-soak','decoded-media','unassisted-playthrough','visual-checkpoint','human-playtest','performance-profile'].includes(check.evidence_type)){
        if(!check.operator||!check.device||!check.browser||check.fixture!==false){problems.push(`${label}: ${check.id} lacks operator/device/browser or has fixture assistance`);continue;}
        if(check.evidence_type.startsWith('physical-device')&&check.physical_device!==true){problems.push(`${label}: ${check.id} is not physical evidence`);continue;}
        if(check.evidence_type==='performance-profile'&&['iphone-safari','android-chrome'].includes(check.profile)&&check.physical_device!==true){problems.push(`${label}: ${check.id} mobile performance evidence is not physical`);continue;}
        if(check.evidence_type==='physical-device-soak'&&Number(check.observations.duration_seconds)<1800){problems.push(`${label}: soak is shorter than 30 minutes`);continue;}
        if(check.evidence_type==='decoded-media'){
          let expected=[];try{expected=JSON.parse(fs.readFileSync(requirement.media_manifest,'utf8')).processed_media;}catch{}
          const clips=check.observations.clips;
          if(!Array.isArray(expected)||!expected.length||!Array.isArray(clips)||clips.length!==expected.length||new Set(clips.map(c=>c.file)).size!==clips.length||expected.some(e=>!clips.some(c=>c.file===e.pixel_file&&c.sha256===e.sha256&&c.decoded_frames>2&&c.current_time>0&&(c.file==='03_orbital_approach_pixel.mp4'||c.pause_resume_verified===true&&c.skip_verified===true)))){problems.push(`${label}: ${check.id} lacks the complete distinct manifest assets with matching digests, decoded frames and active-route controls`);continue;}
        }
      }
      if(check.evidence_type==='remote-ci'&&!protectedChecksMatch(check.observations,requirement,source.head)){problems.push(`${label}: enabled/enforced protection and the complete declared required checks are unverified`);continue;}
      accepted.push({id:check.id,profile:check.profile,report:label,evidence_type:check.evidence_type});
    }
  }
  const requirements=inventory.requirements.map(r=>({...r,passed_profiles:r.profiles.filter(p=>accepted.some(c=>c.id===r.id&&c.profile===p)),missing_profiles:r.profiles.filter(p=>!accepted.some(c=>c.id===r.id&&c.profile===p))}));
  if(requireClean&&source?.dirty)problems.push('Candidate has uncommitted source changes; a release receipt requires a clean candidate');
  return {schema_version:1,status:problems.length||requirements.some(r=>r.missing_profiles.length)?'blocked':'ready',source,problems,requirements,accepted,generated_at:new Date().toISOString()};
}

async function main(){
  const args=process.argv.slice(2),arg=(name,fallback)=>{const i=args.indexOf(name);return i<0?fallback:args[i+1];};
  const dir=path.resolve(arg('--evidence-dir',process.env.QUALITY_OUT_DIR||'/tmp/techops-quality-acceptance'));
  const out=path.resolve(arg('--out',path.join(dir,'release-receipt.json')));
  const inventory=JSON.parse(fs.readFileSync('release_certification.json','utf8')),reports=[];
  const readErrors=[];
  if(fs.existsSync(dir))for(const name of fs.readdirSync(dir).filter(p=>p.endsWith('-report.json'))){
    try{reports.push({...JSON.parse(fs.readFileSync(path.join(dir,name),'utf8')),_file:name});}catch(error){readErrors.push(`${name}: ${error.message}`);}
  }
  const receipt=assessEvidence(inventory,reports,{source:sourceIdentity(),root:dir});
  receipt.problems.push(...readErrors);if(readErrors.length)receipt.status='blocked';
  fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(receipt,null,2)+'\n');
  console.log(JSON.stringify({status:receipt.status,passed_requirements:receipt.requirements.filter(r=>!r.missing_profiles.length).map(r=>r.id),remaining:receipt.requirements.filter(r=>r.missing_profiles.length).map(r=>({id:r.id,profiles:r.missing_profiles})),problems:receipt.problems,receipt:out}));
  if(receipt.status!=='ready')process.exitCode=1;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
