'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const core=fs.readFileSync('glitch.js','utf8');

function contextWith(parts,{poisonPart3=false}={}){
  const context=vm.createContext({});
  vm.runInContext(`const TO_GLITCH_1=${JSON.stringify(parts[0])};const TO_GLITCH_2=${JSON.stringify(parts[1])};const TO_GLITCH_4=${JSON.stringify(parts[3])};`,context);
  if(poisonPart3){
    assert.throws(()=>vm.runInContext('const TO_GLITCH_3 = missingInitializer;',context),/missingInitializer/);
  }else if(parts[2]!==undefined){
    vm.runInContext(`const TO_GLITCH_3=${JSON.stringify(parts[2])};`,context);
  }
  return context;
}

{
  const context=contextWith(['a','b','c','d']);
  vm.runInContext(core,context);
  assert.equal(vm.runInContext('TO_GLITCH',context),'data:image/png;base64,abcd');
}

{
  const context=contextWith(['a','b',undefined,'d']);
  assert.doesNotThrow(()=>vm.runInContext(core,context));
  assert.equal(vm.runInContext('TO_GLITCH',context),'');
}

{
  const context=contextWith(['a','b','ignored','d'],{poisonPart3:true});
  assert.doesNotThrow(()=>vm.runInContext(core,context));
  assert.equal(vm.runInContext('TO_GLITCH',context),'');
}

console.log('Glitch split-asset graceful degradation: PASS');
