'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const motion=require('./campaign_low_quarter_motion.js'),art=require('./campaign_low_quarter_art.js');
function state(x=80,t=0,sector='access'){return {elapsed:t,player:{x,jump:0,sector},hold:null,attack:0,travel:null};}
let a=state(),b=state(91,.1),tracker=motion.create();tracker.reset(a);tracker.commit(a,b);
assert.equal(tracker.sample(b,0).x,80);assert.equal(tracker.sample(b,.5).x,85.5);assert.equal(tracker.sample(b,1).x,91);
assert.equal(tracker.sample(b,.2,true).x,91,'pause renders its exact committed position');
assert.equal(tracker.sample(b,.2,false).x,91,'resume never rewinds to an older interpolated position');
const saved=JSON.stringify(b);for(let i=0;i<60;i++)tracker.sample(b,i/60);assert.equal(JSON.stringify(b),saved,'rendering cannot alter save or motion');
const c=state(91,.2);tracker.commit(b,c);assert.equal(tracker.sample(c,.5).pose,28,'no actual distance means no walking in place');
const d=state(350,.3,'services');tracker.commit(c,d);assert.equal(tracker.sample(d,0).x,350,'crossing a sector never interpolates across unrelated geography');
tracker.reset(a);tracker.commit(a,b);assert.equal(tracker.sample(b,.5).point({x:90,sector:'access'},{x:82,sector:'access'}),86,'moving neighbors interpolate independently');
const atlas=fs.readFileSync('assets/v736/k_action_atlas.png');assert.ok(atlas.length>0);
function context(width=960){const calls=[];return {calls,canvas:{width,height:540},save(){},restore(){},translate(...a){assert(a.every(Number.isFinite));},scale(){},beginPath(){},closePath(){},moveTo(){},lineTo(){},fill(){},fillText(){},fillRect(...a){assert(a.every(Number.isFinite));assert(a[2]>0&&a[3]>0);calls.push(a);},drawImage(){}};}
for(const sector of ['access','approaches','services','shelters','departure','receiving'])for(const width of [540,960])for(const cam of [0,300,1920-width]){
 const m=state(350,20,sector);m.stage='assault';const before=JSON.stringify(m),ctx=context(width);
 assert.equal(art.world(ctx,m,cam,430,1920),true);art.ship(ctx,20,270,false);art.carrier(ctx,200,430);art.person(ctx,350,430,'#516c70','witness',1);
 assert.equal(JSON.stringify(m),before,'art never creates evidence or changes mission state');assert(ctx.calls.length>300,'material architecture and surface detail must render');assert(ctx.calls.length<12000,'bounded scene workload');
}
// Exercise real cache lifecycle without a browser or image mocks.
const ctx=vm.createContext({document:{createElement(){return {width:0,height:0,getContext(){return context();}};}}});
vm.runInContext(fs.readFileSync('campaign_low_quarter_art.js','utf8'),ctx);
for(const sector of ['access','services','shelters','receiving','departure']){const m=state(100,1,sector);ctx.TechOpsLowQuarterArt.world(context(),m,0,430,1920);assert(ctx.TechOpsLowQuarterArt.cacheStats().count<=2);}
const count=ctx.TechOpsLowQuarterArt.cacheStats().paints;ctx.TechOpsLowQuarterArt.world(context(),state(100,1,'departure'),0,430,1920);assert.equal(ctx.TechOpsLowQuarterArt.cacheStats().paints,count,'unchanged architecture is reused');
const play=fs.readFileSync('campaign_low_quarter_play.js','utf8');assert.ok(play.includes('motion.commit(before.lowQuarterMission,next.lowQuarterMission)'));assert.ok(play.includes('motion.sample(m,accumulator/.1'));assert.ok(play.includes('clientWidth<600?540:960'));
assert(!/setInterval|requestAnimationFrame|addEventListener|localStorage/.test(fs.readFileSync('campaign_low_quarter_art.js','utf8')+fs.readFileSync('campaign_low_quarter_motion.js','utf8')),'no second input/frame/save owner');
console.log('Low Quarter art/motion: interpolation, pause, boundaries, immutable mission inputs, 36 compositions and bounded cache PASS');
