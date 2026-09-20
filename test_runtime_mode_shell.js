const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const shellSource = fs.readFileSync('runtime_mode_shell.js', 'utf8');
const hooksSource = fs.readFileSync('night_hooks.js', 'utf8');
const lifecycleSource = fs.readFileSync('runtime_night.js', 'utf8');
const bootstrapSource = fs.readFileSync('production_bootstrap.js', 'utf8');

function style(){
  const values = new Map(), priorities = new Map();
  return {
    getPropertyValue(name){ return values.get(name) || ''; },
    getPropertyPriority(name){ return priorities.get(name) || ''; },
    setProperty(name,value,priority=''){ values.set(name,String(value)); priorities.set(name,String(priority)); },
    removeProperty(name){ const old=values.get(name)||''; values.delete(name); priorities.delete(name); return old; }
  };
}
function classes(initial=[]){
  const set = new Set(initial);
  return { add(...items){items.forEach(x=>set.add(x));}, remove(...items){items.forEach(x=>set.delete(x));}, contains(x){return set.has(x);}, values(){return [...set];} };
}
function node(id, hidden=false){
  const attrs = new Map();
  return {id,style:style(),classList:classes(hidden?['hidden']:[]),getAttribute(k){return attrs.has(k)?attrs.get(k):null;},setAttribute(k,v){attrs.set(k,String(v));},removeAttribute(k){attrs.delete(k);}};
}
function fixture(){
  const ids=['hud','dialogue','panel','battle','eod','quest-tracker'];
  const nodes=Object.fromEntries(ids.map(id=>[id,node(id,['dialogue','panel','battle','eod'].includes(id))]));
  const body=node('body');
  const context={
    console,Math,Object,performance:{now:()=>1000},
    S:{clock:960,meta:{},nightMode:null,inDialog:false,inBattle:false,paused:false,budget:0},
    keys:{a:true,arrowright:true},joy:{x:1,y:-1},
    document:{body,getElementById:id=>nodes[id]||null}
  };
  context.window=context;context.globalThis=context;
  vm.createContext(context);
  vm.runInContext('let panelOpen=false,eodOpen=false; globalThis.readBlockers=()=>({panelOpen,eodOpen});',context);
  vm.runInContext(shellSource,context,{filename:'runtime_mode_shell.js'});
  return {context,nodes,api:context.TechOpsModeShell};
}
function hiddenHard(nodes){
  for(const id of ['hud','panel','battle','eod','quest-tracker']){
    assert.equal(nodes[id].style.getPropertyValue('display'),'none',id+' display');
    assert.equal(nodes[id].style.getPropertyPriority('display'),'important',id+' priority');
    assert.equal(nodes[id].style.getPropertyValue('pointer-events'),'none',id+' input');
  }
}
function extractFunction(source,name){
  const start=source.indexOf('function '+name+'(');assert.ok(start>=0,'missing '+name);
  const open=source.indexOf('{',start);let depth=0;
  for(let i=open;i<source.length;i++){
    if(source[i]==='{')depth++;
    else if(source[i]==='}'&&--depth===0)return source.slice(start,i+1);
  }
  throw new Error('unclosed '+name);
}

// Exact direct-day snapshot, blocker ownership and repeated calls.
{
  const f=fixture(),{context:c,nodes,api}=f;
  nodes.hud.style.setProperty('display','grid','important');
  nodes.hud.style.setProperty('visibility','visible');
  nodes.dialogue.style.setProperty('display','flex');
  nodes.dialogue.classList.remove('hidden');
  c.S.inDialog=true;c.S.inBattle=true;c.S.paused=true;
  vm.runInContext('panelOpen=true;eodOpen=true;',c);
  const token=api.enterNight(c.S);
  assert.match(token,/^mode-shell:night:/);hiddenHard(nodes);
  assert.ok(nodes.dialogue.classList.contains('hidden'),'stale Day dialogue hidden at boundary');
  assert.equal(nodes.dialogue.style.getPropertyValue('display'),'','shared Night dialogue has no hard display lock');
  assert.deepEqual({inDialog:c.S.inDialog,inBattle:c.S.inBattle,paused:c.S.paused},{inDialog:false,inBattle:false,paused:false});
  assert.deepEqual(c.readBlockers(),{panelOpen:false,eodOpen:false});
  assert.deepEqual(c.keys,{a:false,arrowright:false});assert.deepEqual(c.joy,{x:0,y:0});
  nodes.dialogue.classList.remove('hidden');c.S.inDialog=true; // active Night car dialog
  nodes.hud.style.removeProperty('display');
  assert.equal(api.enterNight(c.S),token,'idempotent entry keeps one snapshot');
  hiddenHard(nodes);assert.ok(!nodes.dialogue.classList.contains('hidden'),'repeat entry does not close an active Night dialog');
  assert.equal(api.exitNight(c.S),true);assert.equal(api.exitNight(c.S),false,'duplicate exit is a no-op');
  assert.equal(nodes.hud.style.getPropertyValue('display'),'grid');assert.equal(nodes.hud.style.getPropertyPriority('display'),'important');
  assert.equal(nodes.hud.style.getPropertyValue('visibility'),'visible');
  assert.equal(nodes.dialogue.style.getPropertyValue('display'),'flex');assert.ok(!nodes.dialogue.classList.contains('hidden'));
  assert.deepEqual({inDialog:c.S.inDialog,inBattle:c.S.inBattle,paused:c.S.paused},{inDialog:true,inBattle:true,paused:true});
  assert.deepEqual(c.readBlockers(),{panelOpen:true,eodOpen:true});
}

// A stale exit callback restores only the state that acquired the shell.
{
  const f=fixture(),old=f.context.S,replacement={inDialog:'replacement',inBattle:'replacement',paused:'replacement'};
  old.inDialog=true;f.api.enterNight(old);f.api.exitNight(replacement);
  assert.equal(old.inDialog,true);assert.equal(replacement.inDialog,'replacement');
  assert.equal(replacement.inBattle,'replacement');assert.equal(replacement.paused,'replacement');
}

// Title router's temporary display:none must not become the restored Day state.
{
  const f=fixture(),{context:c,nodes,api}=f;
  c.__productionDesiredMode='nightcrawler';
  nodes.hud.classList.remove('hidden'); // startRun already made the live HUD available
  for(const id of ['hud','panel','battle','eod'])nodes[id].style.setProperty('display','none','important');
  api.enterNight(c.S);assert.equal(api.health().routed,true);api.exitNight(c.S);
  for(const id of ['hud','panel','battle','eod'])assert.equal(nodes[id].style.getPropertyValue('display'),'','parser inline baseline restored for '+id);
  assert.ok(!nodes.hud.classList.contains('hidden'),'title compatibility keeps the live run class state');
}

// Execute the real canonical enter/exit functions in a VM. Sector 04 reaches
// this same direct boundary and may attach its encounter only after entry.
{
  const f=fixture(),{context:c,nodes}=f;
  c.nmStagePlatforms=()=>[];c.nmSpawnEnemies=()=>[];c.sfx=()=>{};c.toast=()=>{};c.updateHUD=()=>{};c.save=()=>true;c.addStress=()=>{};
  c.TechOpsNightRuntime={
    beforeEnter(){},onEntered(){},
    endVisit(){ // the legacy lifecycle currently normalizes these before the shell restores its snapshot
      for(const id of ['hud','dialogue','panel','battle','eod','quest-tracker']){
        nodes[id].style.removeProperty('display');nodes[id].style.removeProperty('visibility');
      }
      nodes.hud.classList.remove('hidden');
    }
  };
  c.S.clock=540;c.S.meta={};
  const enter=extractFunction(hooksSource,'enterNight'),exit=extractFunction(hooksSource,'exitNight');
  vm.runInContext(`
    let NM=null; const NM_CAR_X=26,NM_FLOOR=430;
    const __origCheckDayEndV50=()=>{globalThis.dayEnds=(globalThis.dayEnds||0)+1;};
    ${enter}\n${exit}
    globalThis.directNight=enterNight;globalThis.directExit=exitNight;globalThis.currentNight=()=>NM;
  `,c,{filename:'night_hooks.boundary.vm.js'});
  c.directNight();assert.ok(c.S.nightMode);hiddenHard(nodes);
  c.S.nightMode._sector04={active:true};hiddenHard(nodes);
  c.directExit(true);assert.equal(c.S.nightMode,null);assert.equal(c.TechOpsModeShell.active(),false);
  assert.equal(nodes.hud.style.getPropertyValue('display'),'');assert.ok(nodes.panel.classList.contains('hidden'));assert.equal(c.dayEnds,1);
}

assert.equal((bootstrapSource.match(/"runtime_mode_shell\.js"/g)||[]).length,1,'bootstrap loads one mode shell');
assert.ok(bootstrapSource.indexOf('"runtime_mode_shell.js"')<bootstrapSource.indexOf('"production_mode_router.js"'),'shell baseline loads before title router');
assert.match(hooksSource,/TechOpsModeShell\.enterNight\(s\)/,'canonical Night entry owns shell');
assert.match(hooksSource,/TechOpsModeShell\.exitNight\(s\)/,'canonical Night exit restores shell');
assert.match(lifecycleSource,/endVisit\(s\);[\s\S]{0,120}TechOpsModeShell\.exitNight\(s\)/,'campaign Return to Day restores the same shell boundary');
assert.ok(!/setInterval|requestAnimationFrame|addEventListener/.test(shellSource),'shell adds no loop, poller, or input listener');

console.log('Runtime mode shell direct entry, Sector 04 isolation, title compatibility and idempotent restore: PASS');
