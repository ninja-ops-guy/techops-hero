"use strict";
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const fn=fs.readFileSync('v736_hooks.js','utf8').match(/    function missionWin736\(\) \{[\s\S]*?\n    \}/)[0];
for(const accepted of [true,false]){
  const meta={m:7,k:true,waldo:true};let dialogs=0,calls=[];
  const context={window:{TechOpsGoodBoysProgressionAuthority:{advance(next,reason){calls.push({next,reason});return accepted;}}},NM:{_v736:{m:7,sync:0},enemies:[{kind:'warden1984',alive:false}],clear:true},meta736:()=>meta,dlg:()=>dialogs++};
  vm.createContext(context);vm.runInContext(fn,context);
  assert.equal(context.missionWin736(),accepted);
  assert.deepEqual(calls,[{next:8,reason:'encounter-clear'}]);
  assert.equal(meta.m,7,'provider must not mutate canonical state itself');
  assert.equal(dialogs,0,'provider must not create old completion dialog, including when authority refuses');
  assert.equal(context.NM._v736.ending,undefined);
}
// Standalone legacy entrypoints without the production authority retain their
// existing completion UI and state behavior.
const meta={m:7};let dialogs=0;
const legacy={window:{},NM:{_v736:{m:7,sync:0},enemies:[{}],clear:true},meta736:()=>meta,save(){},sfx(){},dlg(){dialogs++;},missionSpec:m=>({name:m===7?'WARDEN':'EARTHFALL'}),Math};
vm.createContext(legacy);vm.runInContext(fn,legacy);legacy.missionWin736();
assert.equal(meta.m,8);assert.equal(dialogs,1);assert.equal(legacy.NM._v736.ending,true);
console.log('Canonical Good Boys completion ownership / legacy fallback: PASS');
