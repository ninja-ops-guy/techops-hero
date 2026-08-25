"use strict";
const assert = require("assert");
const fs = require("fs");
const vm = require("vm");
const src = fs.readFileSync("good_boys_canon_runtime.js", "utf8");
let loaded=null,dialog=null,continued=false;
const context={
  console,
  setInterval(){return 1;},
  performance:{now(){return 0;}},
  S:{meta:{_v736:{m:1,done:false}}},
  NM:null,
  NM_BG734:{orbital_gate:{id:"gate"},orbital_eye:{id:"eye"}},
  nmLoadDistrict(id){loaded=id;this.NM={district:id};return id;},
  drawNM(){return true;},
  closeDlg(){},
  dlg(title,text,opts){dialog={title,text,opts};},
  v725:{play(id,cb){if(cb)cb();return true;}},
  v736:{start(){context.v725.play("b736m1",()=>{continued=true;context.nmLoadDistrict("suburbs");context.NM._v736={m:1,active:"katrin",chars:{katrin:{hp:100,maxHp:100},manchez:{hp:100,maxHp:100}},sync:0};});}}
};
context.globalThis=context;
vm.createContext(context);
vm.runInContext(src,context,{filename:"good_boys_canon_runtime.js"});
const api=context.TechOpsGoodBoysCanon;
assert.ok(api,"canon runtime must export authority");
assert.strictEqual(api.VERSION,2);
assert.strictEqual(api.SEQUENCE[1].name,"THE INCIDENT");
assert.strictEqual(api.SEQUENCE[2].name,"MAINTENANCE ROUTE");
assert.strictEqual(api.SEQUENCE[4].name,"CELL 118");
assert.strictEqual(api.SEQUENCE[6].name,"CELL 1984");
context.v736.start();
assert.ok(dialog,"M1 must use the corrected Good Boys opening instead of legacy satellite exposition");
assert.match(dialog.title,/THE INCIDENT/);
assert.match(dialog.text,/already aboard an orbital installation/i);
assert.match(dialog.text,/Reach the shuttle/i);
assert.doesNotMatch(dialog.text,/corrupted satellite/i);
assert.doesNotMatch(dialog.text,/expecting to rescue Mike/i);
assert.strictEqual(continued,false,"gameplay begins only after the corrected opening is acknowledged");
dialog.opts[0].f();
assert.strictEqual(continued,true);
assert.strictEqual(loaded,"orbital","legacy M1 suburbs must be replaced by orbital canon");
assert.strictEqual(context.NM.district,"orbital");
assert.strictEqual(context.NM._goodBoysCanonDistrict,"orbital");
assert.strictEqual(context.NM._goodBoysRequestedDistrict,"suburbs");
api.enforceBackground();
assert.strictEqual(context.NM_BG734.orbital,context.NM_BG734.orbital_gate,"M1 must use shipped orbital art, never runtime-generated data-URL art");
context.S.meta._v736.m=2;context.NM=null;loaded=null;context.nmLoadDistrict("industrial");
assert.strictEqual(loaded,"orbital","legacy M2 industrial launch must remain inside orbital arc");
context.S.meta._v736.m=4;context.NM={_v736:{m:4,active:"katrin",chars:{},sync:0}};
assert.strictEqual(api.canonical().objective,"FIND CELL 118 · GET THE PRISONER OUT");
context.NM._v736.m=6;
assert.strictEqual(api.canonical().objective,"FREE WALDO IN CELL 1984");
console.log("Good Boys corrected premise + gameplay handoff: PASS");
