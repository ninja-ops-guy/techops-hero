'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const root={};vm.runInNewContext(fs.readFileSync('runtime_scene_art.js','utf8'),root);
const art=root.TechOpsSceneArt;
function context(width,height){
 const calls=[],stack=[];
 return {canvas:{width,height},calls,globalAlpha:.7,fillStyle:'initial',
 save(){stack.push([this.globalAlpha,this.fillStyle]);},restore(){[this.globalAlpha,this.fillStyle]=stack.pop();},
 beginPath(){},rect(){},clip(){},
 fillRect(...rect){assert.ok(rect.every(Number.isFinite));assert.ok(rect[2]>=0&&rect[3]>=0);calls.push({rect,color:this.fillStyle,alpha:this.globalAlpha});}};
}
let count=0;
for(const district of ['downtown','wooster','airport','suburbs'])for(const width of [320,390,1048,1440])for(const cam of [0,97.5,1800-width]){
 const n={district,cam,platforms:[{x:350,y:320,w:140,h:10},{x:5000,y:300,w:140,h:10}]},before=JSON.stringify(n),c=context(width,720);
 assert.equal(art.drawGround(c,n,430),true);
 assert.ok(c.calls.length<650,'work stays bounded by viewport');
 assert.ok(c.calls.every(call=>call.rect[1]>=430),'ground stays below contact plane');
 const ground=c.calls.length;
 assert.equal(art.drawPlatforms(c,n,430),true);
 assert.ok(c.calls.slice(ground).every(call=>call.rect[1]>=320&&call.rect[1]+call.rect[3]<=430),'gantry starts at actual platform and stops at floor');
 assert.equal(c.globalAlpha,.7);assert.equal(c.fillStyle,'initial','canvas styles restored');
 assert.equal(JSON.stringify(n),before,'visual pass leaves simulation/save inputs unchanged');count++;
}
for(const n of [{district:'downtown',_v736:{m:1}},{district:'downtown',_sector04:{}},{district:'downtown',_nightwalker:{}},{district:'downtown',drive:{}},{district:'unknown'},{district:'industrial'},{district:'home'},{district:'waldo'}]){
 const c=context(1048,720);assert.equal(art.drawGround(c,n),false);assert.equal(art.drawPlatforms(c,n),false);assert.equal(c.calls.length,0,'unrelated scenes/undecoded plates keep existing fallbacks');
}
// Integer camera travel moves texture exactly once in screen space.
const a=context(390,720),b=context(390,720);
art.drawGround(a,{district:'downtown',cam:10});art.drawGround(b,{district:'downtown',cam:11});
assert.deepEqual(a.calls.slice(4).map(c=>({...c,rect:[c.rect[0]-1,...c.rect.slice(1)]})),b.calls.slice(4));
const hooks=fs.readFileSync('night_hooks.js','utf8');
assert.ok(hooks.includes('if(!sceneArt||!sceneArt.drawGround(ctx,NM,NM_FLOOR)){'),'street ground hook runs even with legacy painted backdrop');
console.log('Night street art: '+count+' viewport/district/camera cases, isolation, anchoring and canvas restoration PASS');
