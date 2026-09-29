'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('comm_hooks.js','utf8');
function boot(){const ctx=vm.createContext({S:{day:1,meta:{},rep:{},inDialog:false},window:{},localStorage:{},save(){},closeDlg(){ctx.S.inDialog=false;},dlg(name,body,options){ctx.S.inDialog=true;ctx.dialog={name,body,options};},__origTicketFlowV43(n){n.interviewed=true;ctx.technical=(ctx.technical||0)+1;}});vm.runInContext(source.slice(source.indexOf('const DAY_INTAKE'),source.indexOf('// ---------- battle bonuses')),ctx);return ctx;}
function npc(dept,type,name='Yuki'){return {name,dept,type:{id:type,label:type},root:'SECRET ROOT CAUSE'};}
const a=boot(),n=npc('HR','printer');a.commBattle(n);
assert.doesNotMatch(a.dialog.body,/Patience|SECRET ROOT/);assert(!a.dialog.options.some(o=>/Guess|Period|Reassure/.test(o.t)));
const first=a.dialog.options.map(o=>o.t);a.dialog.options[0].f();assert.match(a.dialog.body,/employee details/);assert.equal(a.technical,undefined);a.dialog.options[0].f();assert(!a.dialog.options.some(o=>o.t===first[0]));a.closeDlg();a.commBattle(n);assert.match(a.dialog.body,/pick up from the notes/);assert.equal(n.dayConversation.asked.length,1);
const other=boot();other.commBattle(npc('Manufacturing','plc','Tess'));assert.notDeepEqual(other.dialog.options.map(o=>o.t),first);assert(other.dialog.options.some(o=>/operator/.test(o.t)));assert.doesNotMatch(other.dialog.body,/SECRET ROOT/);
const stale=other.dialog.options[0];other.closeDlg();stale.f();assert.equal(other.technical,undefined);
const current=a.dialog.options.find(o=>o.t==='Take this to the device');current.f();assert.equal(a.technical,1);assert.equal(n.preConf,undefined);
const crew=boot();crew.window.TechOpsCampaign={load:()=>({flags:{standup_completed:true},investigations:{}})};const office=fs.readFileSync('office_hooks.js','utf8');vm.runInContext(office.slice(office.indexOf('const DAY_CREW_TOPICS'),office.indexOf('// ---------- marketing:')),crew);
const labels=[];for(const id of ['nick','amit','brandon','daniel']){crew.coworkerTalk({id,name:id.toUpperCase(),face:''});labels.push(crew.dialog.options.map(o=>o.t).join('|'));assert.doesNotMatch(crew.dialog.body,/Screens glow/);const topic=crew.dialog.options.find(o=>!o.t.includes('intern')&&o.t!=='Leave them to it');topic.f();crew.dialog.options[0].f();assert.equal(crew.S.meta.dayCrewTalk['1:'+id].heard.length,1);}
assert.equal(new Set(labels).size,4);
console.log('PASS incident-specific intake, branching answers, persistent topic memory, distinct crew, no guessed evidence and stale-close protection');
