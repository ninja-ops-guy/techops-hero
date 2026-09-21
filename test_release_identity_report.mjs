import assert from 'node:assert/strict';
import {buildIdentityEvidence} from './scripts/release_identity_report.mjs';

const source={head:'a'.repeat(40),tree:'b'.repeat(40),fingerprint:'c'.repeat(64),dirty:false};

{
  const built=buildIdentityEvidence({source,frozenAt:'2026-09-21T04:00:00Z'});
  assert.equal(built.report.status,'passed');
  assert.deepEqual(built.report.checks.map(c=>c.id),['candidate_freeze']);
  const freeze=built.report.checks[0];
  assert.equal(freeze.observations.head,source.head);
  assert.equal(freeze.observations.change_policy,'invalidate-all-evidence');
  assert.equal(freeze.observations.freeze_record.sha256,built.report.artifacts[0].sha256);
}

{
  const manifest=Buffer.from('{"assets":["index.html","game.js"]}\n');
  const built=buildIdentityEvidence({
    source,
    frozenAt:'2026-09-21T04:00:00Z',
    deployment:{url:'https://example.invalid/techops/',build_id:'r1-candidate',head:source.head,tree:source.tree,immutable:true},
    assetManifestBytes:manifest
  });
  assert.deepEqual(built.report.checks.map(c=>c.id),['candidate_freeze','deployed_identity']);
  const deployed=built.report.checks[1];
  assert.equal(deployed.observations.head,source.head);
  assert.equal(deployed.observations.immutable,true);
  assert.equal(deployed.observations.asset_manifest.sha256,built.report.artifacts.find(a=>a.path==='deployed-asset-manifest.json').sha256);
}

for(const [label,deployment] of [
  ['wrong head',{url:'https://example.invalid',build_id:'x',head:'d'.repeat(40),tree:source.tree,immutable:true}],
  ['wrong tree',{url:'https://example.invalid',build_id:'x',head:source.head,tree:'d'.repeat(40),immutable:true}],
  ['mutable',{url:'https://example.invalid',build_id:'x',head:source.head,tree:source.tree,immutable:false}],
  ['non-https',{url:'http://example.invalid',build_id:'x',head:source.head,tree:source.tree,immutable:true}],
  ['no build id',{url:'https://example.invalid',build_id:'',head:source.head,tree:source.tree,immutable:true}]
]){
  assert.throws(()=>buildIdentityEvidence({source,deployment,assetManifestBytes:Buffer.from('{}') }),undefined,label);
}
assert.throws(()=>buildIdentityEvidence({source,deployment:{url:'https://example.invalid',build_id:'x',head:source.head,tree:source.tree,immutable:true}}),/asset manifest/);

console.log('R1 candidate/deployment identity evidence builder: PASS');
