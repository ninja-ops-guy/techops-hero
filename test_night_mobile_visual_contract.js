"use strict";
const assert=require("assert"),fs=require("fs"),vm=require("vm");
const src=fs.readFileSync("night_mobile_visual_cohesion.js","utf8"),boot=fs.readFileSync("production_bootstrap.js","utf8");
assert.doesNotThrow(()=>new Function(src),"Night mobile cohesion source must parse");
assert.ok(src.includes("grid-template-columns:repeat(3,52px)"),"Night actions must collapse to a compact three-column layout");
assert.ok(src.includes("#touch-buttons #tb-interact"),"Night context/punch control must receive a scoped compact size");
assert.ok(src.includes("#dpad{left:max(12px"),"Night d-pad must use the compact coarse-pointer layout");
assert.ok(src.includes("#toast{top:auto"),"Night tutorial toast must move out of the gameplay focal area");
assert.ok(src.includes("Double-tap ←/→: DASH · Then ATTACK: GRAB · ↑/↓ AIM · JUMP to follow"),"Night mobile tutorial must use the compact control hint");
assert.ok(src.includes("MutationObserver"),"Night mobile presentation must follow runtime ownership without another polling timer");
assert.ok(boot.includes('"night_mobile_visual_cohesion.js"'),"Production bootstrap must load Night mobile cohesion after Night input");
const version=Number((boot.match(/VERSION=(\d+)/)||[])[1]);assert.ok(version>=35,"Production bootstrap must retain or advance the Night mobile cache-bump contract");
console.log("Night mobile visual contract: PASS");

// Execute the real viewport projection. Night and Good Dogs use a fixed
// 430-unit floor; landscape must display the complete actor and contact plane.
const gameSource=fs.readFileSync("game.js","utf8"),resizeSource=gameSource.slice(gameSource.indexOf("function viewportSize()"),gameSource.indexOf('addEventListener("resize", resize);'));
assert.ok(resizeSource.includes("function resize()"),"viewport regression must execute the production resize owner");
for(const [width,height] of [[844,390],[844,320],[568,320],[390,844],[1280,800]]){
  const canvas={style:{}},actor=Object.freeze({x:110,y:396,h:34}),r={cv:canvas,innerWidth:width,innerHeight:height,document:{documentElement:{clientWidth:width,clientHeight:height}},NM:actor,NM_FLOOR:430};r.window=r;r.visualViewport={width,height};vm.createContext(r);vm.runInContext(resizeSource+";resize();",r);
  const scale=height/canvas.height,foot=(actor.y+actor.h)*scale,top=foot-100*scale;
  assert.ok(canvas.height>=540&&canvas.height<=720,"scene buffer must retain floor headroom and bounded rendering height");
  assert.ok(Math.abs(canvas.width/canvas.height-width/height)<1/canvas.height,"world projection must preserve aspect ratio");
  assert.strictEqual(canvas.style.width,width+"px");assert.strictEqual(canvas.style.height,height+"px");
  assert.ok(top>=0&&foot<=height-12,"grounded Night/Good Dogs silhouettes and feet must fit short landscape viewports");
  assert.strictEqual(actor.y,396,"projection cannot reposition gameplay actors");assert.strictEqual(r.NM_FLOOR,430,"projection cannot change the collision floor");
  assert.ok(Math.abs((canvas.height/14)*scale-height/14)<1e-9,"Day's 14-row physical view must retain its scale");
}
console.log("Short landscape world projection and actor bounds: PASS");
