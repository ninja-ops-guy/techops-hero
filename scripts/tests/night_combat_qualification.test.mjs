import assert from 'node:assert/strict';
import vm from 'node:vm';
import {test} from 'node:test';
import {boundedNightCleanup,NightCleanupTimeout,nightStreetReady} from '../night_combat_qualification.mjs';

test('cleanup returns a normal result and retains a rejection value',async()=>{
 assert.equal(await boundedNightCleanup(()=>42,'browser.close',100),42);
 for(const error of [Error('close failed'),undefined,null]){
  let caught=false;
  try{await boundedNightCleanup(()=>Promise.reject(error),'browser.close',100);}
  catch(actual){caught=true;assert.equal(actual,error);}
  assert.equal(caught,true);
 }
});
test('a close that never resolves produces a classified deadline failure',async()=>{
 await assert.rejects(boundedNightCleanup(()=>new Promise(()=>{}),'browser.close',10),
  error=>error instanceof NightCleanupTimeout&&/browser.close/.test(error.message));
});
test('late close rejection is consumed after its deadline',async()=>{
 let reject;
 await assert.rejects(boundedNightCleanup(()=>new Promise((_,r)=>{reject=r;}),'context.close',10),NightCleanupTimeout);
 reject(Error('late transport rejection'));
 await new Promise(resolve=>setImmediate(resolve));
});

function street(){
 const state={hidden:false,inputReady:false,more:{hidden:false,disabled:true,getClientRects:()=>[{}]}};
 const context=vm.createContext({window:{TechOpsNightInput:{ready:()=>state.inputReady}},document:{querySelector:selector=>selector==='#dialogue'?{classList:{contains:()=>state.hidden}}:state.more}});
 return {state,ready:()=>vm.runInContext('('+nightStreetReady.toString()+')()',context)};
}
test('delayed Charger dismissal cannot qualify before dialog and controls settle',()=>{
 const {state,ready}=street();
 assert.equal(ready(),false);
 state.hidden=true;assert.equal(ready(),false);
 state.inputReady=true;assert.equal(ready(),false);
 state.more.disabled=false;assert.equal(ready(),true);
 // A dialog reopening after the click must fail the same gate.
 state.hidden=false;assert.equal(ready(),false);
});
test('hidden, detached or missing optional controls cannot qualify street return',()=>{
 const {state,ready}=street();Object.assign(state,{hidden:true,inputReady:true});state.more.disabled=false;
 state.more.hidden=true;assert.equal(ready(),false);
 state.more.hidden=false;state.more.getClientRects=()=>[];assert.equal(ready(),false);
 state.more=null;assert.equal(ready(),false);
});
