import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {assessEvidence,digest} from './scripts/quality_release_receipt.mjs';

const root=fs.mkdtempSync(path.join(os.tmpdir(),'techops-receipt-'));
try{
  const source={head:'a'.repeat(40),tree:'b'.repeat(40),fingerprint:'c'.repeat(64),dirty:false};
  const inventory={schema_version:1,requirements:[{id:'touch',profiles:['iphone-safari'],evidence_types:['physical-device']}]};
  fs.writeFileSync(path.join(root,'capture.txt'),'observed touch sequence');
  const report={schema_version:1,status:'passed',source,artifacts:[{path:'capture.txt',sha256:digest('observed touch sequence')}],checks:[{id:'touch',profile:'iphone-safari',status:'passed',evidence_type:'physical-device',physical_device:true,fixture:false,operator:'Device tester',device:'Named physical iPhone',browser:'Safari/OS build recorded',observations:{rotation:true,resume:true}}]};
  const assess=reports=>assessEvidence(inventory,reports,{source,root});
  assert.equal(assess([]).status,'blocked','missing reports cannot certify release');
  assert.equal(assess([{status:'passed'}]).status,'blocked','pass booleans are insufficient');
  assert.equal(assess([report]).status,'ready');
  for(const mutate of [r=>r.source.fingerprint='d'.repeat(64),r=>r.artifacts[0].sha256='e'.repeat(64),r=>r.checks[0].physical_device=false,r=>r.checks[0].fixture=true,r=>delete r.checks[0].operator,r=>r.checks[0].observations={},r=>r.checks[0].evidence_type='browser-input',r=>r.checks[0].profile='chromium-portrait']){
    const copy=structuredClone(report);mutate(copy);assert.equal(assess([copy]).status,'blocked');
  }
  assert.equal(assessEvidence(inventory,[report],{source:{...source,dirty:true},root}).status,'blocked','dirty candidate cannot become release certified');
  const mediaRequirement=JSON.parse(fs.readFileSync('release_certification.json','utf8')).requirements.find(r=>r.id==='decoded_cinematics');
  const mediaInventory={schema_version:1,requirements:[{...mediaRequirement,profiles:['desktop-chrome']}]};
  const manifest=JSON.parse(fs.readFileSync(mediaRequirement.media_manifest,'utf8'));
  const mediaReport=structuredClone(report);mediaReport.checks=[{...report.checks[0],id:'decoded_cinematics',profile:'desktop-chrome',evidence_type:'decoded-media',observations:{clips:manifest.processed_media.map(c=>({file:c.pixel_file,sha256:c.sha256,decoded_frames:30,current_time:1,pause_resume_verified:true,skip_verified:true}))}}];
  const assessMedia=r=>assessEvidence(mediaInventory,[r],{source,root});
  assert.equal(assessMedia(mediaReport).status,'ready');
  for(const mutate of [r=>r.checks[0].observations.clips.pop(),r=>r.checks[0].observations.clips[1]=r.checks[0].observations.clips[0],r=>r.checks[0].observations.clips[0].sha256='f'.repeat(64),r=>r.checks[0].observations.clips[0].decoded_frames=0,r=>r.checks[0].observations.clips[0].skip_verified=false]){
    const copy=structuredClone(mediaReport);mutate(copy);assert.equal(assessMedia(copy).status,'blocked','partial/duplicate/stale/undecoded media evidence cannot certify');
  }
  const titleRequirement=JSON.parse(fs.readFileSync('release_certification.json','utf8')).requirements.find(r=>r.id==='title_routes');
  const forged=structuredClone(report);forged.checks=[{id:'title_routes',profile:'chromium-desktop',status:'passed',evidence_type:'browser-input',observations:{claimed_pass:true}}];
  assert.equal(assessEvidence({schema_version:1,requirements:[{...titleRequirement,profiles:['chromium-desktop']}]},[forged],{source,root}).status,'blocked','nonempty arbitrary observations cannot certify a title');
  const ciRequirement=JSON.parse(fs.readFileSync('release_certification.json','utf8')).requirements.find(r=>r.id==='protected_ci');
  assert.deepEqual(ciRequirement.required_contexts,['Static and release contracts','Browser acceptance','required'],'protection contract must retain exact check names');
  const ciInventory={schema_version:1,requirements:[ciRequirement]},ciReport=structuredClone(report);
  ciReport.checks=[{id:'protected_ci',profile:'github',status:'passed',evidence_type:'remote-ci',observations:{protection_verified:true,protection_enabled:true,protection_enforced:true,head:source.head,required_contexts:[...ciRequirement.required_contexts],required_checks:ciRequirement.required_contexts.map(name=>({name,conclusion:'success'}))}}];
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
  fs.writeFileSync(path.join(root,'capture.txt'),'changed capture');
  assert.equal(assess([report]).status,'blocked','artifact bytes are reverified');
  const actual=JSON.parse(fs.readFileSync('release_certification.json','utf8'));
  assert.equal(new Set(actual.requirements.map(r=>r.id)).size,actual.requirements.length);
  for(const item of actual.requirements)for(const key of ['id','description','evidence_types','profiles','spot_check'])assert.ok(item[key]?.length,`${item.id}: missing ${key}`);
  console.log('Release certification refuses missing, stale, spoofed-tier and modified evidence: PASS');
}finally{fs.rmSync(root,{recursive:true,force:true});}
