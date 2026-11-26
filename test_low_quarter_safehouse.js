'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const O=require('./campaign_low_quarter_operation.js'),C=require('./campaign_act1.js');
const sandbox={};vm.runInNewContext(fs.readFileSync('campaign_low_quarter_safehouse.js','utf8'),sandbox);
const H=sandbox.TechOpsLowQuarterSafehouse;
for(const ending of ['shutdown','control','open_network']){
 const seed=C.createInitialState();seed.story={ending,facts:{campaign_complete:true}};
 const s=O.begin(seed,ending,'cylinder_'+ending),o=s.lowQuarterOperation;
 assert(!H.canEnter(s),'No remote entry from Approaches');
 o.room='services';o.x=640;assert(H.canEnter(s));
 for(const [key,value] of [['x',700],['y',1],['work',{id:'radio'}],['travel',{to:'shelters'}],['halted',true],['checkpoint',true],['hp',0]]){
  const old=o[key];o[key]=value;assert(!H.canEnter(s),'Entry blocked by '+key);o[key]=old;
 }
 const before=JSON.stringify(s);H.canEnter(s);assert.equal(JSON.stringify(s),before);
 assert.equal(O.validate(s).valid,true);assert.equal(s.lowQuarter.events.length,0);assert.equal(s.lowQuarter.siege.events.length,0);
}
assert(!H.canEnter(null));assert(!H.canEnter(C.createInitialState()));
console.log('PASS The Cylinder: nearby grounded entry only, busy/dead/end-state guards, all endings, no mission mutations.');
