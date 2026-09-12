'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
let count=0;
function test(name,fn){fn();console.log('PASS '+name);count++;}
const uiSource=fs.readFileSync('good_boys_reference_ui_v1.js','utf8');
function skin(classicState=false){
 const nodes=new Map(),bodyClasses=new Set();
 const document={body:{classList:{toggle(k,on){on?bodyClasses.add(k):bodyClasses.delete(k);}}},head:{appendChild(e){nodes.set(e.id,e);}},getElementById:id=>nodes.get(id)||null,createElement:tag=>({style:{},dataset:{},setAttribute(k,v){this[k]=v;}})};
 const n={district:'goodboys_breach',_v736:{m:3}};
 const r={document,NM:n,S:{nightMode:n},setInterval:()=>1,clearInterval(){}};
 vm.createContext(r);if(classicState)vm.runInContext('let S=globalThis.S;',r);
 vm.runInContext(uiSource,r);
 return {r,n,nodes,bodyClasses,api:r.TechOpsGoodBoysReferenceUI};
}
test('mobile skin preserves the M3 relay verb on repeated updates',()=>{const f=skin(),b={dataset:{context:'1'},textContent:'USE · OVERRIDE'};f.nodes.set('gb-use',b);for(let i=0;i<20;i++)f.api.labels();assert.equal(b.textContent,'USE · OVERRIDE');});
test('mobile skin preserves reach, cell and custom mission interaction labels',()=>{for(const label of ['REACH RELAY','OPEN CELL 118','SEIZE ACCESS NODE','BOARD','USE / INTERACT'])for(const context of ['0','1']){const f=skin(),b={dataset:{context},textContent:label};f.nodes.set('gb-use',b);f.api.labels();assert.equal(b.textContent,label);}});
test('mobile skin leaves disabled and contextual action ownership untouched',()=>{const f=skin(),b={dataset:{context:'1'},textContent:'WAIT FOR SECURITY',disabled:true,onclick:()=>42};f.nodes.set('gb-use',b);const fn=b.onclick;f.api.labels();assert.equal(b.disabled,true);assert.equal(b.onclick,fn);assert.equal(b.dataset.context,'1');});
test('stale Good Dogs state cannot restyle a Day or another Night world',()=>{const f=skin();f.r.S.nightMode=null;f.api.apply();assert.equal(f.bodyClasses.has('good-boys-reference-ui'),false);f.r.S.nightMode={district:'downtown'};f.api.apply();assert.equal(f.bodyClasses.has('good-boys-reference-ui'),false);});
test('live Good Dogs still receives the current mobile skin',()=>{const f=skin();f.api.apply();assert.equal(f.bodyClasses.has('good-boys-reference-ui'),true);});
test('bootstrap retains latest main Night flow and mobile controls exactly once',()=>{const src=fs.readFileSync('production_bootstrap.js','utf8'),r={setTimeout(){}};vm.runInNewContext(src,r);for(const file of ['runtime_night.js','good_boys_reference_ui_v1.js','runtime_combat_audio.js','production_gameplay_experience.js','orbital_scene_staging.js'])assert.equal(r.TechOpsProductionBootstrap.FILES.filter(x=>x===file).length,1,file);assert.match(fs.readFileSync('game.js','utf8'),/nightRuntime\.frame\(dt\)/);assert.match(fs.readFileSync('runtime_night.js','utf8'),/else install\(\);/);assert.match(src,/TechOpsGoodBoysReferenceUI\.apply\(\)/);});
test('entrypoint cache key matches the integrated bootstrap build',()=>{const loader=fs.readFileSync('bg_noc.js','utf8'),src=fs.readFileSync('production_bootstrap.js','utf8');assert.equal(loader.match(/var BUILD="([^"]+)"/)[1],src.match(/BUILD="([^"]+)"/)[1]);});
test('integration gate includes Night flow and every new quality regression suite',()=>{const src=fs.readFileSync('scripts/production_release_gate.js','utf8');for(const file of ['test_runtime_night.js','test_quality_integration.js','test_runtime_combat_audio.js','test_production_gameplay_experience.js','test_orbital_scene_staging.js'])assert.ok(src.includes('"'+file+'"'),file);});
test('a downed partner stays at zero health rather than appearing fully healed',()=>{const f=skin();f.n._v736.chars={katrin:{hp:100,maxHp:100},manchez:{hp:0,maxHp:120}};f.n._v736.active='katrin';f.n.hp=70;assert.deepEqual(Array.from(f.api.hp('manchez')),[0,120]);assert.deepEqual(Array.from(f.api.hp('katrin')),[70,100]);f.n._v736.chars.manchez.hp=40;f.n._v736.chars.manchez.downed=true;assert.equal(f.api.hp('manchez')[0],0);});
test('missing health telemetry is never interpreted as a full heal',()=>{const f=skin();assert.equal(f.api.hp('manchez')[0],0);f.n._v736.chars={manchez:{hp:Infinity,maxHp:NaN}};assert.deepEqual(Array.from(f.api.hp('manchez')),[0,120]);});
test('the mobile skin yields its alternate HUD to the native single-HUD owner',()=>{const f=skin(),el={style:{display:'block'},setAttribute(){}};f.nodes.set('gb-ref-hud',el);f.r.TechOpsGoodBoysHudLite={drawHud(){}};assert.equal(f.api.updateHud(),false);assert.equal(el.style.display,'none');});
test('modal and hidden states suppress standalone guidance without changing gameplay',()=>{for(const key of ['inDialog','inBattle','paused','gameOver']){const f=skin(),el={style:{display:'block'},setAttribute(){}};f.nodes.set('gb-ref-hud',el);f.r.S[key]=true;const before=JSON.stringify(f.n);f.api.apply();assert.equal(el.style.display,'none');assert.equal(JSON.stringify(f.n),before);}});
test('classic-script aliases and current-world identity govern the mobile skin',()=>{const f=skin(true);vm.runInContext('S={nightMode:null}; TechOpsGoodBoysReferenceUI.apply();',f.r);assert.equal(f.api.active(),false);assert.equal(f.bodyClasses.has('good-boys-reference-ui'),false);});
test('the existing game frame schedules skin updates, without a second interval',()=>{assert.doesNotMatch(uiSource,/setInterval\(sync/);const src=fs.readFileSync('game.js','utf8');assert.equal((src.match(/skin\.sync\(t\)/g)||[]).length,1);const f=skin();f.api.sync(1000);f.r.S.nightMode=null;f.api.sync(1001);assert.equal(f.bodyClasses.has('good-boys-reference-ui'),false);assert.equal(f.api.timer,null);});
console.log('Quality integration: '+count+' tests passed');
