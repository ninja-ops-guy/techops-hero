#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {sourceIdentity,digest} from './quality_release_receipt.mjs';

const SHA40=/^[a-f0-9]{40}$/;

export function validateKnownIssues(inventory){
  const problems=[];
  if(inventory?.schema_version!==1||!Array.isArray(inventory.issues))problems.push('known-issue inventory must be schema_version 1 with an issues array');
  const issues=Array.isArray(inventory?.issues)?inventory.issues:[];
  const normalized=[];
  for(const item of issues){
    const issue={
      id:String(item?.id||''),
      severity:String(item?.severity||''),
      status:String(item?.status||''),
      disposition:item?.disposition==null?'':String(item.disposition)
    };
    if(!issue.id)problems.push('known issue is missing id');
    if(!['P0','P1','P2','P3'].includes(issue.severity))problems.push(`${issue.id||'(unnamed)'} has invalid severity`);
    if(!['open','closed'].includes(issue.status))problems.push(`${issue.id||'(unnamed)'} has invalid status`);
    if(issue.status==='open'&&!issue.disposition)problems.push(`${issue.id||'(unnamed)'} open issue lacks disposition`);
    normalized.push(issue);
  }
  const blockers=normalized.filter(i=>i.status==='open'&&(i.severity==='P0'||i.severity==='P1'));
  if(blockers.length)problems.push(`open release blockers: ${blockers.map(i=>i.id).join(', ')}`);
  return {ok:problems.length===0,problems,issues:normalized,unclassified_count:normalized.filter(i=>!['P0','P1','P2','P3'].includes(i.severity)).length};
}

export function validateRollback(record,currentHead){
  const problems=[];
  if(record?.schema_version!==1)problems.push('rollback record must use schema_version 1');
  const target=String(record?.rollback_target_sha||'');
  if(!SHA40.test(target))problems.push('rollback_target_sha must be a full 40-character SHA');
  if(target===currentHead)problems.push('rollback target cannot equal candidate HEAD');
  for(const key of ['rollback_tested','forward_restore_tested','save_compatibility_checked']){
    if(record?.[key]!==true)problems.push(`${key} must be true`);
  }
  if(typeof record?.environment!=='string'||!record.environment.trim())problems.push('rollback environment must be recorded');
  return {ok:problems.length===0,problems,record:{schema_version:1,rollback_target_sha:target,rollback_tested:record?.rollback_tested===true,forward_restore_tested:record?.forward_restore_tested===true,save_compatibility_checked:record?.save_compatibility_checked===true,environment:String(record?.environment||''),notes:String(record?.notes||'')}};
}

export function buildGovernanceEvidence({source,knownIssues,rollback}){
  const problems=[],checks=[],artifacts=[];
  const files={};

  if(knownIssues){
    const result=validateKnownIssues(knownIssues);
    const bytes=JSON.stringify({schema_version:1,issues:result.issues},null,2)+'\n';
    const artifact={path:'known-issues.json',sha256:digest(bytes)};
    files[artifact.path]=bytes;artifacts.push(artifact);
    checks.push({
      id:'known_issue_gate',profile:'candidate',status:result.ok?'passed':'failed',evidence_type:'release-governance',
      observations:{unclassified_count:result.unclassified_count,issue_inventory:{artifact_path:artifact.path,sha256:artifact.sha256},issues:result.issues}
    });
    problems.push(...result.problems);
  }

  if(rollback){
    const result=validateRollback(rollback,source.head);
    const bytes=JSON.stringify(result.record,null,2)+'\n';
    const artifact={path:'rollback-record.json',sha256:digest(bytes)};
    files[artifact.path]=bytes;artifacts.push(artifact);
    checks.push({
      id:'rollback_receipt',profile:'candidate',status:result.ok?'passed':'failed',evidence_type:'rollback-validation',
      observations:{
        candidate_head:source.head,
        rollback_target_sha:result.record.rollback_target_sha,
        rollback_tested:result.record.rollback_tested,
        forward_restore_tested:result.record.forward_restore_tested,
        save_compatibility_checked:result.record.save_compatibility_checked,
        rollback_record:{artifact_path:artifact.path,sha256:artifact.sha256}
      }
    });
    problems.push(...result.problems);
  }

  if(!checks.length)problems.push('provide --known-issues and/or --rollback input');
  return {
    report:{schema_version:1,status:problems.length?'failed':'passed',source,artifacts,checks,problems},
    files
  };
}

async function main(){
  const args=process.argv.slice(2);
  const arg=name=>{const i=args.indexOf(name);return i>=0?args[i+1]:null;};
  const knownPath=arg('--known-issues'),rollbackPath=arg('--rollback');
  const outDir=path.resolve(arg('--out-dir')||'/tmp/techops-release-governance');
  const readJson=file=>file?JSON.parse(fs.readFileSync(file,'utf8')):null;
  const built=buildGovernanceEvidence({source:sourceIdentity(),knownIssues:readJson(knownPath),rollback:readJson(rollbackPath)});
  fs.mkdirSync(outDir,{recursive:true});
  for(const [name,bytes] of Object.entries(built.files))fs.writeFileSync(path.join(outDir,name),bytes);
  const reportPath=path.join(outDir,'release-governance-report.json');
  fs.writeFileSync(reportPath,JSON.stringify(built.report,null,2)+'\n');
  console.log(JSON.stringify({status:built.report.status,problems:built.report.problems,report:reportPath}));
  if(built.report.status!=='passed')process.exitCode=1;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
