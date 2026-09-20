'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('game.js','utf8');
const helper=source.slice(source.indexOf('function scheduleDayNotice('),source.indexOf('// ---------- game loop ----------'));
assert.match(source,/scheduleDayNotice\(\(\) => \{[\s\S]*?PAGER —[\s\S]*?\}, 3500\)/,'pager must use the scene-aware day queue');
function fixture(){
  const timers=[];
  const c={S:{day:2,meta:{},inDialog:false},document:{hidden:false},panelOpen:false,eodOpen:false,hits:0,blocking:false,setTimeout(fn,ms){timers.push({fn,ms});},TechOpsPresentationDirector:{isBlocking:()=>c.blocking}};
  c.window=c;vm.createContext(c);vm.runInContext(helper,c);
  c.scheduleDayNotice(()=>c.hits++,3500);
  return {c,timers,next(){const timer=timers.shift();assert.ok(timer,'a pending day notice is expected');timer.fn();return timer.ms;}};
}
for(const kind of ['inDialog','inBattle','paused','panelOpen','eodOpen','hidden','presentation']){
  const {c,timers,next}=fixture();
  const owner=kind==='hidden'?c.document:['panelOpen','eodOpen'].includes(kind)?c:kind==='presentation'?c:c.S;
  const key=kind==='presentation'?'blocking':kind;owner[key]=true;
  assert.equal(next(),3500);assert.equal(c.hits,0,kind+' cannot be interrupted');
  assert.equal(next(),250);assert.equal(c.hits,0,'a long '+kind+' retains the urgent notice');
  owner[key]=false;next();assert.equal(c.hits,1,'the notice is delivered when '+kind+' releases input');assert.equal(timers.length,0,'no duplicate alert timer remains');
}
for(const change of [c=>{c.S={day:2,meta:{}};},c=>{c.S.day=3;},c=>{c.S._modeEpoch=1;},c=>{c.S.nightMode={district:'home'};},c=>{c.__productionDesiredMode='goodboys';},c=>{c.S.meta._standaloneMode='nightcrawler';},c=>{c.S.gameOver=true;}]){
  const {c,timers,next}=fixture();change(c);next();assert.equal(c.hits,0);assert.equal(timers.length,0,'expired day notices cannot poll a different mode or run');
}
console.log('Day notice queue: modal deferral, eventual delivery, one-shot settlement and stale mode/run expiry PASS');
