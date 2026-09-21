import assert from 'node:assert/strict';
import {R1_CHECKPOINTS,buildVerticalSliceEvidence} from './scripts/vertical_slice_evidence.mjs';

const source={head:'a'.repeat(40),tree:'b'.repeat(40),fingerprint:'c'.repeat(64),dirty:false};
const captures=Object.fromEntries(R1_CHECKPOINTS.map(id=>[id,`/${id}.png`]));
const review=Object.fromEntries(R1_CHECKPOINTS.map(id=>[id,{reviewed:true,blocker:false}]));
const profile=id=>({operator:`${id} reviewer`,device:`${id} device`,browser:`${id} browser`,captures:{...captures},review:{...review}});
const loader=file=>Buffer.from(`bytes:${file}`);

{
  const built=buildVerticalSliceEvidence({
    source,
    profiles:{desktop:profile('desktop'),phone:profile('phone')},
    playtest:{
      operator:'fresh tester',device:'desktop',browser:'Chromium',
      fresh_context:true,route_completed:true,developer_intervention:false,
      assistance:[],confusion_points:['desk prompt required a moment to notice'],blocking_confusion:0,
      terminal_state:'returned',duration_seconds:1200,checkpoints_seen:[...R1_CHECKPOINTS],
      record_path:'/playtest.txt'
    },
    loadArtifact:loader
  });
  assert.equal(built.report.status,'passed');
  assert.deepEqual(built.report.checks.map(c=>`${c.id}:${c.profile}`),[
    'vertical_slice_checkpoints:desktop',
    'vertical_slice_checkpoints:phone',
    'fresh_context_playtest:r1-vertical-slice'
  ]);
  assert.equal(built.report.artifacts.length,21);
  for(const profileId of ['desktop','phone']){
    const check=built.report.checks.find(c=>c.profile===profileId);
    assert.equal(check.observations.checkpoints.length,R1_CHECKPOINTS.length);
    assert.equal(new Set(check.observations.checkpoints.map(c=>c.artifact_path)).size,R1_CHECKPOINTS.length);
    assert.equal(new Set(check.observations.checkpoints.map(c=>c.sha256)).size,R1_CHECKPOINTS.length);
  }
}

{
  const bad=profile('desktop');
  bad.review['mike-desk']={reviewed:true,blocker:true};
  const built=buildVerticalSliceEvidence({
    source,
    profiles:{desktop:bad,phone:profile('phone')},
    playtest:{
      operator:'fresh tester',device:'desktop',browser:'Chromium',
      fresh_context:true,route_completed:true,developer_intervention:false,
      assistance:[],confusion_points:[],blocking_confusion:0,
      terminal_state:'returned',duration_seconds:800,checkpoints_seen:[...R1_CHECKPOINTS],
      record_path:'/playtest.txt'
    },
    loadArtifact:loader
  });
  assert.equal(built.report.status,'failed');
  assert.match(built.report.problems.join(' '),/mike-desk has blocking/);
}

{
  const built=buildVerticalSliceEvidence({
    source,
    profiles:{desktop:profile('desktop'),phone:profile('phone')},
    playtest:{
      operator:'experienced developer',device:'desktop',browser:'Chromium',
      fresh_context:false,route_completed:true,developer_intervention:false,
      assistance:[],confusion_points:[],blocking_confusion:0,
      terminal_state:'returned',duration_seconds:800,checkpoints_seen:[...R1_CHECKPOINTS],
      record_path:'/playtest.txt'
    },
    loadArtifact:loader
  });
  assert.equal(built.report.status,'failed');
  assert.match(built.report.problems.join(' '),/fresh-context/);
}

console.log('R1 vertical-slice visual + fresh-context evidence builder: PASS');
