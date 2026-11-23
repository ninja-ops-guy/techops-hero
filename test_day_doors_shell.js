'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('runtime_day.js','utf8');
const second=source.slice(source.indexOf('/* Day desktop and opening cinematics.'));
const input={value:'',focusCount:0,focus(){this.focusCount++;}};
const output={children:[],scrollTop:0,scrollHeight:100,appendChild(row){this.children.push(row);},removeChild(row){this.children.splice(this.children.indexOf(row),1);}};
Object.defineProperty(output,'firstElementChild',{get(){return this.children[0];}});
Object.defineProperty(output,'textContent',{get(){return this.children.map(x=>x.textContent).join('');},set(text){assert.equal(text,'');this.children=[];}});
const form={querySelector(selector){assert.equal(selector,'input');return input;}};
const content={html:'',set innerHTML(value){this.html=value;},querySelector(selector){return selector==='form'?form:selector==='pre'?output:null;}};
const box={querySelector(selector){assert.equal(selector,'.os-content');return content;}};
const routes=[];
const r={S:{inDialog:true,inBattle:false},TechOpsDayExperience:{desktopNearby:()=>true},TechOpsCampaignNativeAct1:{openWorkstationTab(app){routes.push(app);},openWorkstation(){routes.push('home');}},document:{createElement(){return{dataset:{},textContent:''};},getElementById(){return null;},body:{classList:{remove(){}}}},clearTimeout(){}};
// Reach the real private Prompt controller without expanding production API.
vm.runInNewContext(fs.readFileSync('runtime_day_prompt.js','utf8'),r);
vm.runInNewContext(second.replace('root.TechOpsDayDesktop={present:', 'root.__shellTest={startPrompt:startPrompt,appIcon:appIcon,crest:crest};root.TechOpsDayDesktop={present:'),r);
r.__shellTest.startPrompt(box,0);
assert.match(content.html,/aria-label="Command output"/);
assert.match(content.html,/aria-label="Command"/);
assert.match(content.html,/>Run<\/button>/);
assert.match(output.textContent,/help.*dir.*hostname/);
function command(line){input.value=line;let prevented=false;form.onsubmit({preventDefault(){prevented=true;}});assert.equal(prevented,true);}
command('hostname');assert.equal(output.children.at(-1).dataset.kind,'output');assert.match(output.children.at(-1).textContent,/MIKE-WS/);assert.equal(input.value,'');
command('<img src=x onerror=alert(1)>');assert.equal(output.children.at(-1).dataset.kind,'error');assert.equal(output.children.at(-2).dataset.kind,'input');assert.match(output.children.at(-2).textContent,/<img src=x/);assert.match(output.children.at(-1).textContent,/Unknown command/);
command('open invalid');assert.equal(output.children.at(-1).dataset.kind,'error');assert.match(output.children.at(-1).textContent,/Installed apps/);assert.deepEqual(routes,[]);
for(const app of ['queue','teams','alerts','company','music'])command('open '+app);
assert.deepEqual(routes,['QUEUE','TEAMS','ALERTS','COMPANY','MUSIC']);
command('cls');assert.equal(output.children.length,0);
for(let i=0;i<30;i++)command('hostname');assert.equal(output.children.length,50,'bounded output history');
command('exit');assert.equal(routes.at(-1),'home');
const count=output.children.length;r.TechOpsDayDesktop.release();command('hostname');assert.equal(output.children.length,count,'stale prompt cannot run after release');
assert.equal(r.__shellTest.crest(),'','missing approved emblem has no invented replacement');
const iconPaths=['queue','teams','alerts','company','music','prompt'].map(name=>r.__shellTest.appIcon(name));assert.equal(new Set(iconPaths).size,6);assert.ok(iconPaths.every(svg=>svg.includes('aria-hidden="true"')));
const shellCss=fs.readFileSync('runtime_day_doors.css','utf8');for(const name of ['queue','teams','alerts','company','music','prompt'])assert.ok(shellCss.includes('.doors-app-icon[data-icon='+name+'] { --doors-icon: url('),'icon uses scoped CSS mask: '+name);
const e={TO_EMBLEM:'data:image/png;base64,APPROVED'};vm.runInNewContext(fs.readFileSync('runtime_day_doors.js','utf8'),e);
const station={id:'plating_workstation',label:'Plating workstation'},session={};
const html=e.TechOpsDayDoors.view(station,{complete:false,record:{fixApplied:false},def:{notifications:['Needs attention.']}},session,'');
assert.match(html,/src="data:image\/png;base64,APPROVED"/);
assert.match(html,/PLATING-WS07 \/ PRODUCTION/);
const hostile=e.TechOpsDayDoors.view({id:'custom',label:'<script>bad</script>',caseId:'laptop_dock_link'},null,{},'');assert.doesNotMatch(hostile,/<script>/);assert.match(hostile,/&lt;script&gt;/);
const shipping=e.TechOpsDayDoors.view({id:'shipping_workstation',label:'Shipping workstation'},null,{},'');assert.match(shipping,/SHIPPING \/ DISPATCH WORKSTATION/);
console.log('Doors shell: bounded Prompt commands, input/output/error states, inert text, stale controller, icons, station labels and approved crest PASS');

// Drive the actual lazy wrapper with a deterministic import boundary. This
// isolates network scheduling while preserving its real session checks.
(async()=>{
 let resolveImport,imports=0,mounts=0;
 const lazyPane={innerHTML:''},lazyBox={querySelector(){return lazyPane;}};
 const lazy={S:{inDialog:true,inBattle:false},TechOpsDayExperience:{desktopNearby:()=>true},TechOpsCampaignNativeAct1:{},document:{getElementById(){return null;},body:{classList:{remove(){}}}},clearTimeout(){},__importPrompt(){imports++;return new Promise(resolve=>{resolveImport=resolve;});}};
 const code=second.replace("import('./runtime_day_prompt.js?v=20261122-doors-batch2')",'root.__importPrompt()').replace('root.TechOpsDayDesktop={present:', 'root.__startPrompt=startPrompt;root.TechOpsDayDesktop={present:');
 vm.runInNewContext(code,lazy);
 lazy.__startPrompt(lazyBox,0);assert.match(lazyPane.innerHTML,/Loading Prompt/);
 lazy.TechOpsDayDesktop.release();lazy.TechOpsDayPrompt={start(){mounts++;}};resolveImport();await new Promise(resolve=>setImmediate(resolve));assert.equal(mounts,0,'late import never mounts in replacement session');
 delete lazy.TechOpsDayPrompt;
 // A fresh desktop context independently exercises import failure and retry.
 const failed=Object.assign({},lazy,{__importPrompt(){imports++;return Promise.reject(Error('offline'));}});delete failed.TechOpsDayDesktop;delete failed.__startPrompt;
 vm.runInNewContext(code,failed);failed.__startPrompt(lazyBox,0);await new Promise(resolve=>setImmediate(resolve));assert.match(lazyPane.innerHTML,/Prompt unavailable/);
 const before=imports;failed.__startPrompt(lazyBox,0);await new Promise(resolve=>setImmediate(resolve));assert.equal(imports,before+1,'failed import can retry when reopened');
 console.log('Doors Prompt lazy load: stale session isolation and failed-load retry PASS');
})().catch(error=>{console.error(error);process.exitCode=1;});
