"use strict";
const assert = require("assert");
const fs = require("fs");
const vm = require("vm");
const src = fs.readFileSync("good_boys_canon_runtime.js", "utf8");
let loaded = null;
const context = {
  console,
  setInterval(){ return 1; },
  performance:{ now(){ return 0; } },
  S:{ meta:{ _v736:{ m:1, done:false } } },
  NM:null,
  nmLoadDistrict(id){ loaded=id; this.NM={ district:id }; return id; },
  drawNM(){ return true; },
  v736:{ start(){ context.nmLoadDistrict("suburbs"); context.NM._v736={m:1,active:"katrin",chars:{katrin:{hp:100,maxHp:100},manchez:{hp:100,maxHp:100}},sync:0}; } }
};
context.globalThis=context;
vm.createContext(context);
vm.runInContext(src, context, {filename:"good_boys_canon_runtime.js"});
assert.ok(context.TechOpsGoodBoysCanon, "canon runtime must export authority");
assert.strictEqual(context.TechOpsGoodBoysCanon.VERSION,1);
assert.strictEqual(context.TechOpsGoodBoysCanon.SEQUENCE[1].name,"THE INCIDENT");
assert.strictEqual(context.TechOpsGoodBoysCanon.SEQUENCE[4].name,"CELL 118");
assert.strictEqual(context.TechOpsGoodBoysCanon.SEQUENCE[6].name,"CELL 1984");
assert.strictEqual(context.TechOpsGoodBoysCanon.SEQUENCE[7].name,"GOOD BOYS PROTOCOL");
context.v736.start();
assert.strictEqual(loaded,"orbital","legacy M1 suburbs must be replaced by orbital canon");
assert.strictEqual(context.NM.district,"orbital");
assert.strictEqual(context.NM._goodBoysCanonDistrict,"orbital");
assert.strictEqual(context.NM._goodBoysRequestedDistrict,"suburbs");
context.S.meta._v736.m=2; context.NM=null; loaded=null;
context.nmLoadDistrict("industrial");
assert.strictEqual(loaded,"orbital","legacy M2 industrial launch must remain inside the orbital incident arc");
context.S.meta._v736.m=4; context.NM={_v736:{m:4,active:"katrin",chars:{},sync:0}};
assert.strictEqual(context.TechOpsGoodBoysCanon.canonical().objective,"FIND CELL 118 · GET HIM OUT");
context.NM._v736.m=6;
assert.strictEqual(context.TechOpsGoodBoysCanon.canonical().objective,"FREE WALDO IN CELL 1984");
console.log("Good Boys canon orbital runtime: PASS");
