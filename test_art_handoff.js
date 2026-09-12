'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const manifest=JSON.parse(fs.readFileSync('assets/handoff/atlas.json'));
assert.equal(manifest.generatedThisPass,false);
let bytes=0;
for(const [id,a] of Object.entries(manifest.atlases)){
 const png=fs.readFileSync(a.src);bytes+=png.length;
 assert.equal(crypto.createHash('sha256').update(png).digest('hex'),a.sha256,id+' derivative drift');
 assert.equal(png.readUInt32BE(16),a.width);assert.equal(png.readUInt32BE(20),a.height);
 assert.ok(png.includes(Buffer.from('tRNS')),id+' must have real alpha, not a baked checkerboard');
 for(const f of a.frames){const [x,y,w,h]=f.rect;assert.ok(x>=0&&y>=0&&x+w<=a.width&&y+h<=a.height);assert.ok(f.removedBackgroundPixels>0);assert.equal(f.pivot[1],h-4);}
}
assert.ok(bytes<600*1024,'lazy art budget must stay below 600 KiB');
const c={console,Date,Math,Object,Array,Number,String,isFinite,WeakMap};c.globalThis=c;vm.createContext(c);vm.runInContext(fs.readFileSync('cinematic_systems.js','utf8'),c);
const art=c.TechOpsArtHandoff,n={hp:100,onGround:true,vx:4,face:1};
assert.equal(art.select('kat',n,0).frame,6);assert.equal(art.select('kat',n,100).frame,7);
n.vx=1;assert.equal(art.select('kat',n,150),null,'unproved walk must retain base idle hold');
n.jabAnim=9;n.vx=4;assert.equal(art.select('kat',n,200),null,'attack authority outranks locomotion');
n.jabAnim=0;n.onGround=false;n.dashT=8;assert.equal(art.select('kat',n,250).frame,13);
assert.equal(art.select('kat',n,1000).frame,17,'air dash clamps to recovery, never loops the windup');
n.dashT=0;n.vy=-5;assert.equal(art.select('mike',n,1100).frame,14);
n.vy=0;assert.equal(art.select('mike',n,1200).frame,15);
n.vy=5;assert.equal(art.select('mike',n,1300).frame,16);
const exposed={x:1000,y:380,w:22,platforms:[]};assert.equal(art.surveillance(exposed,0).observed,true);
exposed.platforms=[{x:875,y:350,w:250}];assert.equal(art.surveillance(exposed,0).observed,false,'catwalk shelter must affect the visible surveillance sweep');
assert.equal(art.drawEnvironment({}, {district:'downtown'},'back',0),false,'orbital props may not leak to arbitrary streets');
assert.ok(fs.readFileSync('v737_hooks.js','utf8').includes('art.drawActor'),'actual single actor render owner must consume handoff');
assert.ok(fs.readFileSync('night_hooks.js','utf8').includes('drawEnvironment(ctx,NM,"back",now)'));
assert.ok(fs.readFileSync('production_wrapper_guard.js','utf8').includes('drawImpacts(x,n,clock())'));
console.log('Handoff provenance, transparency, budget, semantic priority, animation timing, and world isolation: PASS',bytes+' bytes');
