import assert from 'node:assert/strict';
import vm from 'node:vm';
import test from 'node:test';
import {roomBootstrapSnapshot} from './room_bootstrap_snapshot.mjs';
const symbols=[...Array.from({length:8},(_,i)=>`ROOM_B64_IT_${i+1}`),
  ...['ENG','FAC','OFC'].flatMap(p=>Array.from({length:3},(_,i)=>`ROOM_B64_${p}_${i+1}`))];
function probe(context){return vm.runInContext(`(${roomBootstrapSnapshot.toString()})()`,context);}
function boot(except=[]){
  const c=vm.createContext({});
  vm.runInContext(symbols.filter(s=>!except.includes(s)).map(s=>`const ${s}='fixture';`).join('\n'),c);
  return c;
}
test('empty page reports all 17 missing chunks without throwing',()=>{
  const r=probe(vm.createContext({}));assert.equal(r.missing.length,17);assert.equal(r.registryReady,false);
});
test('classic-script lexical globals are observed without window properties',()=>{
  const c=boot();vm.runInContext("const TO_ROOMS={itdept:'data:image/jpeg;base64,fixture',eng:'data:image/jpeg;base64,fixture',factory:'data:image/jpeg;base64,fixture',office:'data:image/jpeg;base64,fixture'}",c);
  const r=probe(c);assert.equal(r.missing.length,0);assert.equal(r.registryReady,true);assert.equal(c.ROOM_B64_IT_1,undefined);
});
test('failed rooms initializer remains observable despite temporal dead zone',()=>{
  const c=boot(['ROOM_B64_ENG_1']);
  assert.throws(()=>vm.runInContext('const TO_ROOMS={eng:ROOM_B64_ENG_1}',c));
  const r=probe(c);assert.deepEqual(Array.from(r.missing),['rooms_eng_p1.js']);
  assert.equal(r.registryReady,false);assert.match(r.registryError,/ReferenceError/);
});
test('snapshot records resource status and strips query/hash values',()=>{
  const c=vm.createContext({performance:{getEntriesByType:()=>[
    {name:'http://127.0.0.1:4173/rooms_eng_p1.js?v=secret#fragment',duration:18,transferSize:0,encodedBodySize:0,responseStatus:404},
    {name:'http://127.0.0.1:4173/unrelated.js',duration:1} ]}});
  const r=probe(c);assert.equal(r.resources.length,1);assert.equal(r.resources[0].responseStatus,404);
  assert.equal(r.resources[0].url,'http://127.0.0.1:4173/rooms_eng_p1.js');
});
test('empty chunks and empty registry data are not marked ready',()=>{
  const c=boot(['ROOM_B64_ENG_1']);vm.runInContext("const ROOM_B64_ENG_1='';const TO_ROOMS={itdept:'',eng:'',factory:'',office:''}",c);
  const r=probe(c);assert.deepEqual(Array.from(r.missing),['rooms_eng_p1.js']);assert.equal(r.registryReady,false);
});
