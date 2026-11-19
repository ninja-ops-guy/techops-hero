"use strict";
const assert=require("assert"),fs=require("fs"),vm=require("vm");

function load(file, overrides={}){
  let intervals=0;
  const baseDraw=function baseDraw(){return "draw";};
  const baseStep=function baseStep(){return "step";};
  const context={
    console,globalThis:null,document:null,S:null,NM:null,ctx:null,
    drawNM:baseDraw,stepNM:baseStep,
    TechOpsProductionWrapperGuard:{enforce(){return true;}},
    __productionSingleCompositor:true,
    setInterval(){intervals++;return 99;},setTimeout(){return 1;},clearInterval(){},
    performance:{now(){return 0;}}
  };
  Object.assign(context, overrides);
  context.globalThis=context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(file,"utf8"),context,{filename:file});
  return{context,baseDraw,baseStep,intervals};
}

const gameplay=load("good_boys_gameplay_loop.js");
assert.ok(gameplay.context.TechOpsGoodBoysGameplayLoop,"gameplay loop must export");
assert.ok(gameplay.context.TechOpsGoodBoysGameplayLoop.VERSION>=4,"gameplay loop must use compositor-owned production contract");
assert.strictEqual(gameplay.context.drawNM,gameplay.baseDraw,"gameplay module must not replace production drawNM");
assert.strictEqual(gameplay.context.stepNM,gameplay.baseStep,"gameplay module must not replace production stepNM");
assert.strictEqual(gameplay.context.TechOpsGoodBoysGameplayLoop.timer,null,"gameplay wrapper-maintenance timer must remain parked in production");
assert.strictEqual(gameplay.intervals,0,"gameplay module must not start a production maintenance interval");
assert.strictEqual(gameplay.context.TechOpsGoodBoysGameplayLoop.installDraw(),false);
assert.strictEqual(gameplay.context.TechOpsGoodBoysGameplayLoop.installStep(),false);

const canon=load("good_boys_canon_runtime.js");
assert.ok(canon.context.TechOpsGoodBoysCanon,"canon runtime must export");
assert.ok(canon.context.TechOpsGoodBoysCanon.VERSION>=6,"canon runtime must use compositor-owned production contract");
assert.strictEqual(canon.context.drawNM,canon.baseDraw,"canon module must not replace production drawNM");
assert.strictEqual(canon.context.TechOpsGoodBoysCanon.timer,null,"canon wrapper-maintenance timer must remain parked in production");
assert.strictEqual(canon.intervals,0,"canon module must not start a production maintenance interval");
assert.strictEqual(canon.context.TechOpsGoodBoysCanon.installHudAuthority(),false);
assert.strictEqual(typeof canon.context.TechOpsGoodBoysCanon.drawHud,"function","canon must export HUD compositor callback");
assert.strictEqual(typeof canon.context.TechOpsGoodBoysCanon.syncIdentity,"function","canon must export router state callback");

// Exercise the installed gameplay callback while changing the live OS preference.
const preference = {matches: false};
let timestamp = 1000;
const scene = {
  _v736: {m: 4}, cam: 0,
  _goodBoysHazards: [[120, 35]],
  _goodBoysLandmarks: [{kind: "cell118", label: "CELL 118", x: 240}]
};
const depth = load("good_boys_depth_lite.js", {
  NM: scene, TechOpsGoodBoysGameplayLoop: {},
  matchMedia(query) { assert.strictEqual(query, "(prefers-reduced-motion: reduce)"); return preference; },
  performance: {now: () => timestamp}
}).context;
function frame() {
  const calls = [];
  const canvas = new Proxy({canvas: {width: 800, height: 600}}, {
    get(target, key) {
      if (key in target) return target[key];
      return (...args) => {
        calls.push([key, ...args]);
        if (key === "measureText") return {width: 48};
        if (key === "createLinearGradient" || key === "createRadialGradient") return {addColorStop() {}};
      };
    }
  });
  depth.TechOpsGoodBoysGameplayLoop.drawStageAccents(canvas);
  assert.ifError(depth.__goodBoysDepthDrawError);
  return calls;
}
const moving = frame();
timestamp += 500;
assert.notDeepStrictEqual(frame(), moving, "standard mode animates the stage");
preference.matches = true;
const quiet = frame();
timestamp += 500;
assert.deepStrictEqual(frame(), quiet, "ambient motion stops at a fixed camera");
assert.ok(!quiet.some(([op]) => op === "bezierCurveTo"), "decorative parallax is omitted");
scene.cam = 50;
const scrolled = frame();
assert.ok(scrolled.some(([op, label, x]) => op === "fillText" && label === "CELL 118" && x === 190));
assert.ok(scrolled.some(([op, x, y, w]) => op === "fillRect" && x === 70 && y === 425 && w === 35));
preference.matches = false;
assert.ok(frame().some(([op]) => op === "bezierCurveTo"), "standard effects resume without reloading");

console.log("Good Boys production compositor ownership: PASS");
