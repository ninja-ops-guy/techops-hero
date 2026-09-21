#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {sourceIdentity,digest} from './quality_release_receipt.mjs';

export const R1_CHECKPOINTS=Object.freeze([
  'arrival','standup','npc-talk','mike-desk','workstation',
  'investigation','day-to-night','night-menu','night-encounter','return'
]);

const safeName=value=>String(value).replace(/[^a-z0-9._-]+/gi,'-').replace(/^-+|-+$/g,'')||'artifact';

function validateCheckpointSet(profileId,profile){
  const problems=[];
  if(!profile||typeof profile!=='object')return {problems:[`${profileId}: profile record missing`]};
  for(const key of ['operator','device','browser']){
    if(typeof profile[key]!=='string'||!profile[key].trim())problems.push(`${profileId}: missing ${key}`);
  }
  if(!profile.captures||typeof profile.captures!=='object')problems.push(`${profileId}: captures missing`);
  if(!profile.review||typeof profile.review!=='object')problems.push(`${profileId}: review missing`);
  for(const id of R1_CHECKPOINTS){
    if(typeof profile.captures?.[id]!=='string'||!profile.captures[id])problems.push(`${profileId}: missing capture ${id}`);
    const r=profile.review?.[id];
    if(!r||r.reviewed!==true)problems.push(`${profileId}: ${id} not explicitly reviewed`);
    if(r?.blocker===true)problems.push(`${profileId}: ${id} has blocking visual/UX defect`);
  }
  return {problems};
}

function validatePlaytest(playtest){
  const problems=[];
  if(!playtest)return {problems:['fresh-context playtest record missing']};
  for(const key of ['operator','device','browser','terminal_state','record_path']){
    if(typeof playtest[key]!=='string'||!playtest[key].trim())problems.push(`playtest: missing ${key}`);
  }
  if(playtest.fresh_context!==true)problems.push('playtest: tester must be explicitly fresh-context');
  if(playtest.route_completed!==true)problems.push('playtest: R1 slice was not completed');
  if(playtest.developer_intervention!==false)problems.push('playtest: developer intervention invalidates fresh-context evidence');
  if(!Array.isArray(playtest.assistance)||playtest.assistance.length)problems.push('playtest: assistance must be an empty array');
  if(!Array.isArray(playtest.confusion_points))problems.push('playtest: confusion_points must be recorded as an array');
  if(playtest.blocking_confusion!==0)problems.push('playtest: blocking confusion must be zero');
  if(!Number.isFinite(playtest.duration_seconds)||playtest.duration_seconds<=0)problems.push('playtest: positive duration_seconds required');
  const seen=playtest.checkpoints_seen;
  if(!Array.isArray(seen)||R1_CHECKPOINTS.some(id=>!seen.includes(id)))problems.push('playtest: all R1 checkpoints must be observed');
  return {problems};
}

export function buildVerticalSliceEvidence({source,profiles,playtest,loadArtifact=file=>fs.readFileSync(file)}){
  const problems=[],artifacts=[],checks=[],files={};
  for(const profileId of ['desktop','phone']){
    const profile=profiles?.[profileId];
    const validation=validateCheckpointSet(profileId,profile);
    problems.push(...validation.problems);
    if(validation.problems.length)continue;
    const checkpoints=[];
    for(const id of R1_CHECKPOINTS){
      const inputPath=profile.captures[id];
      let bytes;
      try{bytes=loadArtifact(inputPath);}catch(error){problems.push(`${profileId}: cannot read ${id} capture: ${error.message}`);continue;}
      const ext=path.extname(inputPath)||'.bin';
      const artifactPath=`vertical-slice/${profileId}/${safeName(id)}${ext}`;
      const sha256=digest(bytes);
      files[artifactPath]=bytes;
      artifacts.push({path:artifactPath,sha256});
      checkpoints.push({id,passed:true,reviewed:true,blocker:false,artifact_path:artifactPath,sha256});
    }
    if(checkpoints.length===R1_CHECKPOINTS.length){
      checks.push({
        id:'vertical_slice_checkpoints',
        profile:profileId,
        status:'passed',
        evidence_type:'visual-checkpoint',
        fixture:false,
        operator:profile.operator,
        device:profile.device,
        browser:profile.browser,
        observations:{checkpoints}
      });
    }
  }

  const playValidation=validatePlaytest(playtest);
  problems.push(...playValidation.problems);
  if(!playValidation.problems.length){
    let bytes;
    try{bytes=loadArtifact(playtest.record_path);}catch(error){problems.push(`playtest: cannot read retained record: ${error.message}`);}
    if(bytes){
      const ext=path.extname(playtest.record_path)||'.txt';
      const artifactPath=`playtest/fresh-context-record${ext}`;
      const sha256=digest(bytes);
      files[artifactPath]=bytes;artifacts.push({path:artifactPath,sha256});
      checks.push({
        id:'fresh_context_playtest',
        profile:'r1-vertical-slice',
        status:'passed',
        evidence_type:'human-playtest',
        fixture:false,
        operator:playtest.operator,
        device:playtest.device,
        browser:playtest.browser,
        observations:{
          fresh_context:true,
          route_completed:true,
          developer_intervention:false,
          assistance:[],
          confusion_points:playtest.confusion_points,
          blocking_confusion:0,
          terminal_state:playtest.terminal_state,
          duration_seconds:playtest.duration_seconds,
          checkpoints_seen:[...R1_CHECKPOINTS],
          playtest_record:{artifact_path:artifactPath,sha256}
        }
      });
    }
  }

  return {
    report:{schema_version:1,status:problems.length?'failed':'passed',source,artifacts,checks,problems},
    files
  };
}

async function main(){
  const args=process.argv.slice(2);
  const arg=name=>{const i=args.indexOf(name);return i>=0?args[i+1]:null;};
  const inputPath=arg('--input');
  if(!inputPath)throw new Error('--input <review.json> is required');
  const outDir=path.resolve(arg('--out-dir')||'/tmp/techops-vertical-slice-evidence');
  const input=JSON.parse(fs.readFileSync(inputPath,'utf8'));
  const built=buildVerticalSliceEvidence({source:sourceIdentity(),profiles:input.profiles,playtest:input.playtest});
  fs.mkdirSync(outDir,{recursive:true});
  for(const [name,bytes] of Object.entries(built.files)){
    const target=path.join(outDir,name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);
  }
  const reportPath=path.join(outDir,'vertical-slice-report.json');
  fs.writeFileSync(reportPath,JSON.stringify(built.report,null,2)+'\n');
  console.log(JSON.stringify({status:built.report.status,checks:built.report.checks.map(c=>`${c.id}:${c.profile}`),problems:built.report.problems,report:reportPath}));
  if(built.report.status!=='passed')process.exitCode=1;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
