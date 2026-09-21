#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {sourceIdentity,digest} from './quality_release_receipt.mjs';

const SHA40=/^[a-f0-9]{40}$/;

export function buildIdentityEvidence({source,frozenAt=new Date().toISOString(),deployment=null,assetManifestBytes=null}){
  if(!source||!SHA40.test(source.head||'')||!SHA40.test(source.tree||'')||!/^[a-f0-9]{64}$/.test(source.fingerprint||''))throw new Error('candidate source identity is incomplete');
  const artifacts=[],checks=[],files={};

  const freezeBody={
    schema_version:1,
    head:source.head,
    tree:source.tree,
    fingerprint:source.fingerprint,
    frozen_at:frozenAt,
    change_policy:'invalidate-all-evidence'
  };
  const freezeBytes=JSON.stringify(freezeBody,null,2)+'\n';
  const freezeArtifact={path:'candidate-freeze.json',sha256:digest(freezeBytes)};
  files[freezeArtifact.path]=freezeBytes;artifacts.push(freezeArtifact);
  checks.push({
    id:'candidate_freeze',
    profile:'candidate',
    status:'passed',
    evidence_type:'freeze-record',
    observations:{...freezeBody,freeze_record:{artifact_path:freezeArtifact.path,sha256:freezeArtifact.sha256}}
  });

  if(deployment){
    if(!/^https:\/\//.test(deployment.url||''))throw new Error('deployment URL must be HTTPS');
    if(typeof deployment.build_id!=='string'||!deployment.build_id.trim())throw new Error('deployment build_id is required');
    if(deployment.head!==source.head||deployment.tree!==source.tree)throw new Error('deployment HEAD/tree must match frozen candidate');
    if(!assetManifestBytes)throw new Error('deployed identity requires retained asset manifest bytes');

    const manifestName='deployed-asset-manifest.json';
    const manifestArtifact={path:manifestName,sha256:digest(assetManifestBytes)};
    files[manifestName]=assetManifestBytes;artifacts.push(manifestArtifact);
    checks.push({
      id:'deployed_identity',
      profile:'production-like',
      status:'passed',
      evidence_type:'deployment',
      observations:{
        head:deployment.head,
        tree:deployment.tree,
        immutable:deployment.immutable===true,
        build_id:deployment.build_id.trim(),
        deployment_url:deployment.url,
        asset_manifest:{artifact_path:manifestName,sha256:manifestArtifact.sha256}
      }
    });
    if(deployment.immutable!==true)throw new Error('deployment must be recorded as immutable');
  }

  return {
    report:{schema_version:1,status:'passed',source,artifacts,checks},
    files
  };
}

async function main(){
  const args=process.argv.slice(2);
  const arg=name=>{const i=args.indexOf(name);return i>=0?args[i+1]:null;};
  const outDir=path.resolve(arg('--out-dir')||'/tmp/techops-release-identity');
  const manifestPath=arg('--asset-manifest');
  const deploymentUrl=arg('--deployment-url');
  const buildId=arg('--build-id');
  const deploymentHead=arg('--deployment-head');
  const deploymentTree=arg('--deployment-tree');
  const source=sourceIdentity();
  const deployment=deploymentUrl||buildId||manifestPath?{
    url:deploymentUrl,
    build_id:buildId,
    head:deploymentHead||source.head,
    tree:deploymentTree||source.tree,
    immutable:true
  }:null;
  const assetManifestBytes=manifestPath?fs.readFileSync(manifestPath):null;
  const built=buildIdentityEvidence({source,deployment,assetManifestBytes});
  fs.mkdirSync(outDir,{recursive:true});
  for(const [name,bytes] of Object.entries(built.files))fs.writeFileSync(path.join(outDir,name),bytes);
  const reportPath=path.join(outDir,'release-identity-report.json');
  fs.writeFileSync(reportPath,JSON.stringify(built.report,null,2)+'\n');
  console.log(JSON.stringify({status:'passed',checks:built.report.checks.map(c=>c.id),report:reportPath}));
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
