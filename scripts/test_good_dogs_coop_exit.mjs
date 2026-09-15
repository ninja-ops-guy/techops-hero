import assert from 'node:assert/strict';
import vm from 'node:vm';
import test from 'node:test';
import {enterLocalHiddenBay, localHiddenBayExitSnapshot} from './good_dogs_coop_exit.mjs';

function world() {
  const root = {
    NM: {x:1440,vx:0,_gbWaldoTrailComplete:true,_v736:{m:1,active:'katrin',
      partner:{x:1410,vx:0},chars:{katrin:{hp:100},manchez:{hp:120}}}},
    S: {nightMode:true,inDialog:false,meta:{_v736:{m:1}}},
    TechOpsLevelRegistry: {goodDogsMission:()=>({target:1460})},
    TechOpsGoodDogsCoop: {mode:()=> 'local',complete:()=>true,blocked:()=>false}
  };
  const context=vm.createContext({window:root});
  const invoke=(fn,arg)=>{context.arg=arg;return vm.runInContext(`(${fn.toString()})(arg)`,context);};
  return {root,invoke,snapshot:(arg=false)=>invoke(localHiddenBayExitSnapshot,arg)};
}

// These are driver/VM tests, not a substitute for the full-page browser suites.
function driver(options={}) {
  const h=world(),events=[],waits=[],pressed=[],disposed=[];
  const handle=value=>({jsonValue:async()=>value,dispose:async()=>{disposed.push(value);}});
  const page={
    evaluate:async(fn,arg)=>h.invoke(fn,arg),
    keyboard:{press:async key=>{pressed.push(key);events.push('use');if(!options.noAdvance)h.root.S.meta._v736.m=2;}},
    waitForFunction:async(fn,arg,config)=>{
      waits.push({arg,config});events.push(arg===true?'ready':'advanced');
      if(arg===true&&options.beforeGate)options.beforeGate(h.root);
      const value=h.invoke(fn,arg);
      if(!value)throw Error('predicate timeout');
      return handle(value);
    }
  };
  const move=async(received,target,config)=>{
    assert.equal(received,page);events.push('move-'+config.player);
    assert.equal(config.tolerance,5);
    if(config.player===2)h.root.NM._v736.partner.x=target;
    else h.root.NM.x=target-(options.p1SettleBack||0);
  };
  return {...h,page,move,events,waits,pressed,disposed};
}

test('missing runtime state fails closed without inventing a dogs array',()=>{
  const c=vm.createContext({window:{}});
  const state=vm.runInContext(`(${localHiddenBayExitSnapshot.toString()})()`,c);
  assert.equal(state.ready,false);assert.equal(state.settled,false);
});
test('#846 final coordinates are not exit ready',()=>{
  const h=world();h.root.NM.x=1418.63;h.root.NM._v736.partner.x=1400.56;
  assert.equal(h.snapshot().ready,false);assert.equal(h.snapshot(true),false);
});
test('production threshold is inclusive at 1425, not below it',()=>{
  const h=world();h.root.NM.x=1424.999;assert.equal(h.snapshot().ready,false);
  h.root.NM.x=1425;assert.equal(h.snapshot().ready,true);
});
test('regroup tolerance is strictly below 180, not 100',()=>{
  const h=world();h.root.NM.x=1440;
  for(const distance of [100,150,179.999]){
    h.root.NM._v736.partner.x=1440-distance;assert.equal(h.snapshot().ready,true);
  }
  h.root.NM._v736.partner.x=1260;assert.equal(h.snapshot().ready,false);
});
test('exit threshold follows the level registry target',()=>{
  const h=world();h.root.TechOpsLevelRegistry.goodDogsMission=()=>({target:1560});
  assert.equal(h.snapshot().exitX,1525);assert.equal(h.snapshot().ready,false);
  h.root.NM.x=1525;assert.equal(h.snapshot().ready,true);
});
test('trail and pair-puzzle completion are both mandatory',()=>{
  const h=world();h.root.NM._gbWaldoTrailComplete=false;assert.equal(h.snapshot().ready,false);
  h.root.NM._gbWaldoTrailComplete=true;h.root.TechOpsGoodDogsCoop.complete=()=>false;
  assert.equal(h.snapshot().ready,false);
});
test('wrong mission, mode, dialog and transition ownership reject USE',()=>{
  const cases=[r=>r.NM._v736.m=2,r=>r.S.meta._v736.m=2,r=>r.S.nightMode=false,
    r=>r.TechOpsGoodDogsCoop.mode=()=> 'solo',r=>r.S.inDialog=true,
    r=>r.NM._v736.ending=true,r=>r.NM._v736.resolving=true,
    r=>r.TechOpsGoodDogsCoop.blocked=()=>true];
  for(const change of cases){const h=world();change(h.root);assert.equal(h.snapshot(true),false);}
});
test('downed/out/dead dogs cannot accidentally invoke revive instead of exit',()=>{
  for(const id of ['katrin','manchez'])for(const [field,value] of [['downed',true],['out',true],['hp',0]]){
    const h=world();h.root.NM._v736.chars[id][field]=value;assert.equal(h.snapshot().ready,false);
  }
});
test('invalid coordinates fail closed',()=>{
  for(const value of [NaN,Infinity,null,undefined,'1440']){
    const h=world();h.root.NM.x=value;assert.equal(h.snapshot().ready,false);
  }
});
test('a threshold crossing while drifting is not a settled readiness sample',()=>{
  const h=world();h.root.NM.vx=-1;
  assert.equal(h.snapshot().ready,true);assert.equal(h.snapshot().settled,false);assert.equal(h.snapshot(true),false);
  h.root.NM.vx=0;h.root.NM._v736.partner.vx=.1;assert.equal(h.snapshot(true),false);
  h.root.NM._v736.partner.vx=0;assert.equal(h.snapshot(true).ready,true);
});
test('snapshot has no gameplay or save-state writes',()=>{
  const h=world(),before=JSON.stringify({NM:h.root.NM,S:h.root.S});h.snapshot();h.snapshot(true);
  assert.equal(JSON.stringify({NM:h.root.NM,S:h.root.S}),before);
});
test('P2 moves first, P1 last, predicate precedes exactly one real USE',async()=>{
  const h=driver();const result=await enterLocalHiddenBay(h.page,h.move);
  assert.deepEqual(h.events,['move-2','move-1','ready','use','advanced']);
  assert.deepEqual(h.pressed,['KeyE']);assert.equal(result.before.ready,true);
  assert.equal(result.before.x,1455);assert.equal(result.before.partnerX,1410);
  assert.equal(result.after.metaMission,2);assert.equal(h.disposed.length,2);
  assert.deepEqual(h.waits,[{arg:true,config:{timeout:5000}},{arg:null,config:{timeout:5000}}]);
});
test('#888 settlement pullback remains safely inside the exit threshold',async()=>{
  const h=driver({p1SettleBack:17});
  const result=await enterLocalHiddenBay(h.page,h.move);
  assert.equal(result.before.x,1438);
  assert.equal(result.before.exitX,1425);
  assert.equal(result.before.ready,true);
  assert.deepEqual(h.pressed,['KeyE']);
});
test('drift below threshold before the gate never sends USE or retries',async()=>{
  const h=driver({beforeGate:r=>{r.NM.x=1418.63;r.NM._v736.partner.x=1400.56;}});
  await assert.rejects(enterLocalHiddenBay(h.page,h.move),e=>{
    assert.equal(e.exitEvidence.before,null);assert.equal(e.exitEvidence.observed.x,1418.63);return true;
  });
  assert.deepEqual(h.pressed,[]);assert.equal(h.root.S.meta._v736.m,1);
});
test('failed M2 confirmation preserves evidence and does not repeat the interaction',async()=>{
  const h=driver({noAdvance:true});
  await assert.rejects(enterLocalHiddenBay(h.page,h.move),e=>{
    assert.equal(e.exitEvidence.before.ready,true);assert.equal(e.exitEvidence.observed.metaMission,1);return true;
  });
  assert.deepEqual(h.pressed,['KeyE']);
});
test('movement targets also track a changed registry target',async()=>{
  const h=driver();h.root.TechOpsLevelRegistry.goodDogsMission=()=>({target:1560});
  const result=await enterLocalHiddenBay(h.page,h.move);
  assert.equal(result.before.x,1555);assert.equal(result.before.partnerX,1510);assert.equal(result.before.exitX,1525);
});
