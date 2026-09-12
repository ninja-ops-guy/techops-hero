"use strict";
const assert=require("assert"),fs=require("fs"),vm=require("vm");
const src=fs.readFileSync("recording_world_cohesion.js","utf8");
assert.doesNotThrow(()=>new Function(src),"recording world cohesion source must parse");
assert.ok(src.includes("__recordingSingleAuthority"),"single Night player authority guard must exist");
assert.ok(src.includes("dressPlatforms"),"Night collision geometry must receive presentation dressing");
assert.ok(src.includes("night_home_return")&&src.includes("night_return_investigation")&&src.includes("night_sector_dawn"),"all Night->day transitions must be upgraded");
assert.ok(src.includes("TechOpsNightReferenceVisuals"),"canonical Night reference renderer must remain the single Mike owner");

let legacyCalls=0,drawCalls=0,registers=[];
const canvas={width:390,height:700},ctx={canvas,save(){},restore(){},fillRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},createLinearGradient(){return{addColorStop(){}}},measureText(){return{width:20}},set fillStyle(v){},set strokeStyle(v){},set lineWidth(v){},set globalAlpha(v){},set imageSmoothingEnabled(v){}};
const root={
 console,Date,Math,
 S:{nightMode:{district:"downtown",platforms:[{x:120,y:300,w:120,h:8}],cam:0,x:40}},
 NM_DISTRICTS:{downtown:{accent:"#4af"}},NM_FLOOR:430,ctx,
 drawNightPlayerAtlas(){legacyCalls++;return true;},
 TechOpsNightReferenceVisuals:{drawReferenceNightWalker(){return true;}},
 drawNM(){drawCalls++;},
 v725:{h:{bg(){},cityGlow(){},panel(){},mike(){},txt(){}},register(id,spec){registers.push([id,spec]);return true;}},
 TechOpsNightRuntime:{registerScenes(){root.v725.register("night_home_return",{shots:[]});root.v725.register("night_return_investigation",{shots:[]});root.v725.register("night_sector_dawn",{shots:[]});}},
 matchMedia(){return{matches:false}},nmCar(){},
};
const geometryBefore=JSON.stringify(root.S.nightMode.platforms);
root.globalThis=root;vm.createContext(root);vm.runInContext(src,root,{filename:"recording_world_cohesion.js"});
assert.equal(root.TechOpsRecordingWorldCohesion.VERSION,1);
assert.equal(root.drawNightPlayerAtlas(ctx,root.S.nightMode,0,0,0),true);
assert.equal(legacyCalls,0,"legacy Night Mike renderer must be suppressed when reference authority exists");
root.drawNM();assert.equal(drawCalls,1,"world cohesion must delegate to the existing Night renderer exactly once");
assert.equal(JSON.stringify(root.S.nightMode.platforms),geometryBefore,"platform dressing must not mutate collision geometry");
assert.ok(registers.length>=3,"Night transition scenes must be re-registered through the cohesion transformer");
for(const [id,spec] of registers.slice(-3)){assert.ok(Array.isArray(spec.shots)&&spec.shots.length===3,id+" must have three composed transition shots");}
const bootstrap=fs.readFileSync("production_bootstrap.js","utf8");
const version=Number((bootstrap.match(/VERSION=(\d+)/)||[])[1]);assert.ok(version>=37,"production bootstrap must retain or advance the recording-world contract");
assert.ok(bootstrap.indexOf('"recording_world_cohesion.js"')>bootstrap.indexOf('"runtime_night.js"'),"world cohesion authority must load after runtime_night");
console.log("Recording world cohesion single-render, platform dressing, transition, and bootstrap contract: PASS");
