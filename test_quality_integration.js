'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
let count=0;
function test(name,fn){fn();console.log('PASS '+name);count++;}
const uiSource=fs.readFileSync('good_boys_reference_ui_v1.js','utf8');
function skin(){
 const nodes=new Map(),bodyClasses=new Set();
 const document={body:{classList:{toggle(k,on){on?bodyClasses.add(k):bodyClasses.delete(k);}}},head:{appendChild(e){nodes.set(e.id,e);}},getElementById:id=>nodes.get(id)||null,createElement:tag=>({style:{},dataset:{},setAttribute(k,v){this[k]=v;}})};
 const n={district:'goodboys_breach',_v736:{m:3}};
 const r={document,NM:n,S:{nightMode:n},setInterval:()=>1,clearInterval(){}};
 vm.runInNewContext(uiSource,r);
 return {r,n,nodes,bodyClasses,api:r.TechOpsGoodBoysReferenceUI};
}
test('mobile skin preserves the M3 relay verb on repeated updates',()=>{const f=skin(),b={dataset:{context:'1'},textContent:'USE · OVERRIDE'};f.nodes.set('gb-use',b);for(let i=0;i<20;i++)f.api.labels();assert.equal(b.textContent,'USE · OVERRIDE');});
test('mobile skin preserves reach, cell and custom mission interaction labels',()=>{for(const label of ['REACH RELAY','OPEN CELL 118','SEIZE ACCESS NODE','BOARD','USE / INTERACT'])for(const context of ['0','1']){const f=skin(),b={dataset:{context},textContent:label};f.nodes.set('gb-use',b);f.api.labels();assert.equal(b.textContent,label);}});
test('mobile skin leaves disabled and contextual action ownership untouched',()=>{const f=skin(),b={dataset:{context:'1'},textContent:'WAIT FOR SECURITY',disabled:true,onclick:()=>42};f.nodes.set('gb-use',b);const fn=b.onclick;f.api.labels();assert.equal(b.disabled,true);assert.equal(b.onclick,fn);assert.equal(b.dataset.context,'1');});
test('stale Good Dogs state cannot restyle a Day or another Night world',()=>{const f=skin();f.r.S.nightMode=null;f.api.apply();assert.equal(f.bodyClasses.has('good-boys-reference-ui'),false);f.r.S.nightMode={district:'downtown'};f.api.apply();assert.equal(f.bodyClasses.has('good-boys-reference-ui'),false);});
test('live Good Dogs still receives the current mobile skin',()=>{const f=skin();f.api.apply();assert.equal(f.bodyClasses.has('good-boys-reference-ui'),true);});
test('bootstrap retains latest main Night flow and mobile controls exactly once',()=>{const src=fs.readFileSync('production_bootstrap.js','utf8'),r={setTimeout(){}};vm.runInNewContext(src,r);for(const file of ['runtime_night.js','good_boys_reference_ui_v1.js','runtime_combat_audio.js','production_gameplay_experience.js','orbital_scene_staging.js'])assert.equal(r.TechOpsProductionBootstrap.FILES.filter(x=>x===file).length,1,file);assert.equal(r.TechOpsProductionBootstrap.FILES.filter(x=>x==="runtime_night.js").length,1);assert.match(src,/TechOpsGoodBoysReferenceUI\.apply\(\)/);});
test('entrypoint cache key matches the integrated bootstrap build',()=>{const loader=fs.readFileSync('bg_noc.js','utf8'),src=fs.readFileSync('production_bootstrap.js','utf8');assert.equal(loader.match(/var BUILD="([^"]+)"/)[1],src.match(/BUILD="([^"]+)"/)[1]);});
test('entrypoint requests exactly one local loader with the current bootstrap cache key',()=>{
 const html=fs.readFileSync('index.html','utf8'),src=fs.readFileSync('production_bootstrap.js','utf8');
 const build=src.match(/BUILD="([^"]+)"/)[1];
 const entries=[...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*>/gi)]
  .map(match=>new URL(match[1],'https://example.invalid/techops-hero/'))
  .filter(url=>url.pathname.endsWith('/bg_noc.js'));
 assert.equal(entries.length,1,'One production-loader entrypoint is required');
 assert.equal(entries[0].origin,'https://example.invalid','Loader must stay same-origin');
 assert.equal(entries[0].pathname,'/techops-hero/bg_noc.js','Loader must retain the Pages project mount');
 assert.deepEqual(entries[0].searchParams.getAll('v'),[build],'Version the loader URL whenever its bootstrap build advances');
});
test('integration gate includes Night flow and every new quality regression suite',()=>{const src=fs.readFileSync('scripts/production_release_gate.js','utf8');for(const file of ['test_night_lifecycle.js','test_quality_integration.js','test_runtime_combat_audio.js','test_production_gameplay_experience.js','test_orbital_scene_staging.js'])assert.ok(src.includes('"'+file+'"'),file);});
console.log('Quality integration: '+count+' tests passed');