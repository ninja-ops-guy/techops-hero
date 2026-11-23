'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const O=require('./campaign_low_quarter_operation.js'),C=require('./campaign_act1.js');
let fills=0,draws=0,created=0;
function ctx(){return new Proxy({canvas:{width:960,height:420},measureText:t=>({width:t.length*6}),fillRect(){fills++;},drawImage(){draws++;},save(){},restore(){},translate(){},scale(){},rotate(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){},stroke(){},fillText(){}},{set(o,k,v){o[k]=v;return true;}});}
const context=ctx(),sandbox={Map,Math,console,document:{createElement:()=>{created++;return {width:0,height:0,getContext:()=>ctx()};}},matchMedia:()=>({matches:false}),TechOpsLowQuarterOperation:O};sandbox.globalThis=sandbox;
vm.runInNewContext(fs.readFileSync('campaign_low_quarter_operation_visuals.js','utf8'),sandbox);
const V=sandbox.TechOpsLowQuarterOperationVisuals;
function fresh(){const s=C.createInitialState();s.story={ending:'shutdown',facts:{campaign_complete:true}};return O.begin(s,'shutdown','graphics_test');}
function freeze(o){if(o&&typeof o==='object'){Object.freeze(o);Object.values(o).forEach(freeze);}return o;}
let n=0;
for(const width of [320,390,844,1280])for(const room of [...O.ROOMS,'receiving'])for(const calm of [false,true]){
 const s=fresh();s.lowQuarterOperation.room=room;s.lowQuarterOperation.x=700;s.lowQuarterOperation.tick=901;
 if(room==='approaches'){s.lowQuarterOperation.breachStart=900;s.lowQuarterOperation.enemies=Array.from({length:6},(_,i)=>({id:'enemy_'+i,alive:true,x:750+i*40,hp:60}));}
 const before=JSON.stringify(s);freeze(s);sandbox.matchMedia=()=>({matches:calm});const canvas={width:960,height:420,clientWidth:width,getContext:()=>context};V.draw(canvas,s);V.draw(canvas,s);
 assert.equal(JSON.stringify(s),before,'Drawing mutated simulation');assert.equal(canvas.width,width<620?600:960);assert.equal(canvas.height,420);n++;
}
const cachedDraws=draws;assert(cachedDraws>0);assert.equal(created,5,'Reuse one background per sector across viewports/motion modes');assert(fills>5000);assert.equal(V.VERSION,2);
const css=fs.readFileSync('low-quarter-review.css','utf8'),html=fs.readFileSync('low-quarter-review.html','utf8');
assert(css.includes('prefers-reduced-motion'));assert(css.includes('min-height:46px'));assert(html.includes('low-quarter-review.css'));assert(!fs.readFileSync('campaign_low_quarter_operation_visuals.js','utf8').includes('Math.random'));
console.log('Low Quarter graphics: '+n+' frozen-state viewport/sector/motion cases PASS; cached backgrounds, deterministic draw, scoped CSS.');
