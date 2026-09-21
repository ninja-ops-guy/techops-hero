'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
let passed=0;
function test(name,run){run();passed++;console.log('PASS '+name);}
function fixture(){
  const store=new Map(),listeners=new Map();
  const c={console,document:null,performance:{now:()=>1000},setInterval:()=>1,clearInterval(){},setTimeout:()=>1,
    S:{day:1,clock:900,budget:100,weather:'storm',meta:{},tickets:[{age:8}],nightMode:null,inDialog:false},
    keys:{d:true},joy:{x:1,y:0},steps:0,draws:0,exits:0,oldClockCalls:0,
    localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)},
    addEventListener:(name,fn)=>{const a=listeners.get(name)||[];a.push(fn);listeners.set(name,a);},
    dispatchEvent:e=>(listeners.get(e.type)||[]).forEach(fn=>fn(e)),
    CustomEvent:class{constructor(type,{detail}){this.type=type;this.detail=detail;}},
    v725:{h:{},definitions:{},register(id,def){this.definitions[id]=def;},play(id,done){c.scene={id,done};return true;},skip(){c.scene.done();}},
    stepNM(){c.steps++;},drawNM(){c.draws++;},draw(){},save(){return true;},fmtClock(){return 'old';},
    advanceClock(m){c.oldClockCalls++;c.S.clock+=m;c.S.tickets[0].age+=m;},
    interact:()=> 'old-interact',closeDlg(){c.S.inDialog=false;},dlg(title,body,opts){c.dialog={title,body,opts};c.S.inDialog=true;},
    exitNight(){if(!c.S.nightMode)return;c.exits++;c.S.budget+=c.S.nightMode.cash;c.S.nightMode=null;c.NM=null;c.TechOpsNightRuntime.endVisit(c.S);}
  };
  c.window=c;c.globalThis=c;vm.createContext(c);
  // The real director's claim handling participates in every scene test.
  vm.runInContext(fs.readFileSync('cinematic_systems.js','utf8'),c);
  vm.runInContext(fs.readFileSync('runtime_night.js','utf8'),c);
  const api=c.TechOpsNightRuntime;
  c.enter=()=>{api.beforeEnter(c.S);c.S.clock=Math.max(1080,c.S.clock);const n={district:'home',street:1,x:1489,y:396,w:22,h:34,cash:37,kills:2,done:{},platforms:[],enemies:[]};c.NM=n;c.S.nightMode=n;api.onEntered(c.S,n);return n;};
  return {c,api};
}
test('one frame-owned clock advances once without aging work tickets',()=>{
  const{c,api}=fixture();c.enter();for(let i=0;i<100;i++)api.frame(.05);
  assert.equal(c.S.clock,1081);assert.equal(c.steps,100);assert.equal(c.oldClockCalls,0);assert.equal(c.S.tickets[0].age,8);
  assert.ok(Number.isFinite(c.__nightRuntimeLastOk),'authoritative Night frames must stamp the recovery heartbeat');
  assert.equal(c.advanceClock(20),true);assert.equal(c.S.clock,1101);assert.equal(c.oldClockCalls,0);
});
test('dialogue, pause, game-over and hidden tabs stop time',()=>{
  const{c,api}=fixture();c.enter();for(const key of ['inDialog','inBattle','paused','gameOver']){c.S[key]=true;for(let i=0;i<100;i++)api.tick(.1);c.S[key]=false;}
  c.document={hidden:true};for(let i=0;i<100;i++)api.tick(.1);c.document=null;
  assert.equal(c.S.clock,1080);assert.equal(c.steps,0);
});
test('invalid deltas and suspended frames cannot fast-forward the night',()=>{
  const{c,api}=fixture();c.enter();for(const dt of [Infinity,NaN,-10])api.tick(dt);assert.equal(c.NM._nightLifecycle.seconds,0);
  api.tick(3600);assert.ok(c.NM._nightLifecycle.seconds<=.1);assert.equal(c.S.clock,1080);
});
test('midnight changes display, not the workday or office state',()=>{
  const{c,api}=fixture();c.enter();c.S.clock=1439;api.advance(3);assert.equal(c.S.clock,1442);assert.equal(c.fmtClock(c.S.clock),'00:02');assert.equal(c.S.day,1);assert.equal(api.advance(-20),false);assert.equal(api.advance(Infinity),false);
});
test('travel counts, while Good Dogs and Waldo retain their own loop',()=>{
  const{c,api}=fixture(),n=c.enter();assert.equal(api.active(true),false);n.drive={};for(let i=0;i<50;i++)api.frame(.1);assert.equal(c.S.clock,1081);
  n._v736={m:3};assert.equal(api.frame(.1),false);delete n._v736;n.district='waldo';assert.equal(api.frame(.1),false);n.district='home';c.__productionDesiredMode='goodboys';assert.equal(api.frame(.1),false);
});
test('home requires the spatial ground-level door and explicit interaction',()=>{
  const{c,api}=fixture(),n=c.enter();assert.equal(api.atHome(),true);n.x=1770;assert.equal(api.sleep(),false);n.x=1489;n.y=220;assert.equal(api.atHome(),false);n.y=396;n._sector04={};assert.equal(api.atHome(),false);delete n._sector04;n.drive={};assert.equal(api.atHome(),false);n.drive=null;
  assert.equal(api.openHome(),true);assert.equal(c.exits,0);c.dialog.opts.find(o=>/Stay/.test(o.t)).f();assert.equal(c.S.inDialog,false);assert.equal(c.S.nightMode,n);
});
test('home claims survive the actual stale-dialog guard and block gameplay',()=>{
  const{c,api}=fixture();c.enter();vm.runInContext(fs.readFileSync('production_wrapper_guard.js','utf8'),c);
  assert.equal(api.sleep(),true);assert.equal(c.TechOpsPresentationDirector.isBlocking(),true);
  for(let i=0;i<100;i++){c.TechOpsProductionWrapperGuard.enforce();api.frame(.1);}
  assert.equal(c.S.inDialog,true);assert.equal(c.steps,0);assert.equal(c.S.clock,1080);assert.equal(c.exits,0);
});
test('normal finish and skip use one settlement and clear Night identity',()=>{
  for(const skip of [true,false]){const{c,api}=fixture();c.enter();c.S.meta._char='nightcrawler';c.localStorage.setItem('techops_char','nightcrawler');api.sleep();const done=c.scene.done;if(skip)c.v725.skip();else done();done();c.exitNight(true);
  assert.equal(c.exits,1);assert.equal(c.S.budget,137);assert.equal(c.S.nightMode,null);assert.equal(c.localStorage.getItem('techops_char'),null);assert.equal(c.S.meta._char,undefined);assert.equal(c.__productionActiveMode,'day');assert.equal(c.TechOpsPresentationDirector.isBlocking(),false);assert.equal(c.keys.d,false);assert.equal(c.joy.x,0);}
});
test('stale callbacks release their claim but do not touch a replacement run',()=>{
  const{c,api}=fixture();c.enter();api.sleep();const done=c.scene.done,next={day:8,clock:600,budget:444,meta:{},nightMode:null};c.S=next;c.NM=null;api.frame(.1);done();assert.equal(c.S,next);assert.equal(c.S.budget,444);assert.equal(c.exits,0);assert.equal(c.TechOpsPresentationDirector.isBlocking(),false);
});
test('missing cinematic renderer keeps an explicit safe continuation',()=>{
  const{c,api}=fixture();c.enter();c.v725=null;api.sleep();assert.equal(c.exits,0);c.dialog.opts[0].f();assert.equal(c.exits,1);assert.equal(c.TechOpsPresentationDirector.isBlocking(),false);
});
function transitionDOM(c){
  const nodes=new Map();
  const node=()=>({style:{removeProperty(key){delete this[key];}},classList:{contains(){return false;},toggle(){}},children:[],hidden:false,attributes:{},
    setAttribute(key,value){this.attributes[key]=String(value);},getAttribute(key){return this.attributes[key];},getBoundingClientRect(){return {left:0,top:0};},appendChild(child){this.children.push(child);child.parent=this;if(child.id)nodes.set(child.id,child);return child;},
    append(...children){children.forEach(child=>this.appendChild(child));},
    remove(){if(nodes.get(this.id)===this)nodes.delete(this.id);if(this.parent)this.parent.children=this.parent.children.filter(child=>child!==this);this.parent=null;},
    focus(){c.document.activeElement=this;},querySelector(selector){return this.selectors&&this.selectors[selector]||null;}
  });
  c.document={hidden:false,body:node(),head:node(),getElementById:id=>nodes.get(id)||null,createElement:node};
  c.getComputedStyle=()=>({display:'block',visibility:'visible'});
  const overlay=node();overlay.id='v725-cine';
  c.v725.play=(id,done)=>{c.document.body.appendChild(overlay);c.scene={id,done(){overlay.remove();done();}};return true;};
  function attachShared(){const shared=node(),pause=node();shared.selectors={'.day-cine-pause':pause};overlay.selectors={'.day-cine-touch':shared};return pause;}
  return {nodes,overlay,attachShared};
}
test('shared cinematic controls own Night transitions without a duplicate skip',()=>{
  const{c,api}=fixture();c.enter();const dom=transitionDOM(c),pause=dom.attachShared();pause.focus();
  assert.equal(api.sleep(),true);assert.equal(dom.nodes.has('night-home-skip'),false);assert.equal(c.document.activeElement,pause);
  c.scene.done();assert.equal(c.exits,1);assert.equal(api.health().transitioning,false);
});
test('late shared controls replace only the owned fallback and transfer its focus',()=>{
  const{c,api}=fixture();c.enter();const dom=transitionDOM(c);api.sleep();
  const fallback=dom.nodes.get('night-home-skip');assert.ok(fallback,'unavailable shared controls keep an explicit skip');assert.equal(c.document.activeElement,fallback);assert.equal(fallback.parent,dom.overlay,'fallback stays within the cinematic keyboard boundary');
  c.document.hidden=true;fallback.onclick();assert.equal(c.exits,0,'hidden fallback cannot settle a transition');c.document.hidden=false;
  const pause=dom.attachShared();api.frame(.016);assert.equal(dom.nodes.has('night-home-skip'),false);assert.equal(c.document.activeElement,pause);
  c.scene.done();assert.equal(c.exits,1);
  c.enter();dom.overlay.selectors={};api.sleep();const current=dom.nodes.get('night-home-skip'),done=c.scene.done;
  fallback.onclick();assert.equal(c.exits,1,'retired fallback cannot skip a replacement transition');assert.equal(dom.nodes.get('night-home-skip'),current);
  current.onclick();done();assert.equal(c.exits,2,'fallback skip still settles its own transition once');assert.equal(dom.nodes.has('night-home-skip'),false);
});
test('campaign discovery cannot invent prerequisites or evidence',()=>{
  const{c,api}=fixture();c.enter();const story={campaign:{day:1},flags:{day_work_unlocked:false},evidence:{}};c.TechOpsCampaign={load:()=>story};c.TechOpsSector04Runtime={enterBrowser(){}};
  const original=JSON.stringify(story);api.openCampaign();assert.match(c.dialog.body,/standup/);assert.equal(c.dialog.opts.some(o=>/Enter Sector/.test(o.t)),false);assert.equal(JSON.stringify(story),original);story.flags.day_work_unlocked=true;api.openCampaign();assert.match(c.dialog.body,/Identity evidence missing/);assert.equal(c.dialog.opts.some(o=>/Enter Sector/.test(o.t)),true);
});
test('same-day return preserves evidence, original clock, weather and cash',()=>{
  const{c,api}=fixture();c.enter();let shellExits=0;c.TechOpsModeShell={exitNight(state){shellExits++;assert.equal(state,c.S);return true;}};const story={campaign:{day:1},flags:{},evidence:{preserved:true}};c.TechOpsCampaign={load:()=>story};api.resumeDay();c.scene.done();assert.equal(c.S.clock,900);assert.equal(c.S.day,1);assert.equal(c.S.weather,'storm');assert.equal(c.S.budget,137);assert.equal(story.evidence.preserved,true);assert.equal(shellExits,1,'campaign Return to Day must release the Night shell');
});
test('delayed day notices are scoped to state, day and mode generation',()=>{
  const src=fs.readFileSync('game.js','utf8'),body=src.slice(src.indexOf('function dayNotice('),src.indexOf('// ---------- game loop ----------'));const c={S:{day:1},hit:0};c.window=c;vm.createContext(c);vm.runInContext(body,c);const f=c.dayNotice(()=>c.hit++);f();c.S.nightMode={};f();c.S.nightMode=null;c.S._modeEpoch=1;f();assert.equal(c.hit,1);const g=c.dayNotice(()=>c.hit++);c.S.day++;g();assert.equal(c.hit,1);
});
function sectorFixture(){
  const{c,api}=fixture(),C=require('./campaign_act1.js');c.TechOpsCampaign=C;c.TechOpsSector04=require('./campaign_sector04.js');const story=C.createInitialState();C.assignTicket(story,'shipping_cannot_print','mike');C.assignTicket(story,'plating_workstation_down','amit');C.assignTicket(story,'impossible_access_event','mike');C.completeStandup(story);C.completeWorkstation(story,{redInTheMirrorHeard:true,feliciaVideoSeen:true});C.save(story,c.localStorage);c.enterCalls=0;c.enterNight=()=>{c.enterCalls++;};c.nmJab=()=>{};vm.runInContext(fs.readFileSync('campaign_sector04_runtime.js','utf8'),c);c.TechOpsSector04Runtime.install();return{c,api,rt:c.TechOpsSector04Runtime};
}
test('real Sector 04 adapter waits for Night Drive and reuses the encounter',()=>{
  const{c,rt}=sectorFixture();assert.equal(rt.enterBrowser().pending,true);assert.equal(c.enterCalls,1);c.enter();const n=c.S.nightMode;assert.equal(n.district,'sector04');n.x=750;rt.enterBrowser();assert.equal(c.S.nightMode,n);assert.equal(n.x,750);assert.equal(c.enterCalls,1);
});
test('pending Sector 04 attachment cannot enter a different run',()=>{
  const{c,rt}=sectorFixture();rt.enterBrowser();c.S={day:1,clock:900,meta:{},nightMode:null};c.enter();assert.equal(c.S.nightMode.district,'home');
});
test('one dispatch, no competing heartbeat or automatic edge sleep',()=>{
  const src=fs.readFileSync('runtime_night.js','utf8'),game=fs.readFileSync('game.js','utf8'),hooks=fs.readFileSync('night_hooks.js','utf8');assert.doesNotMatch(src,/setInterval\s*\(/);assert.match(game,/nightRuntime && nightRuntime\.frame\(dt\)/);assert.match(game,/__nightRuntimeLastOk = Date\.now\(\)/);assert.doesNotMatch(hooks,/NM\.district === "home" && NM\.x[^\n]*exitNight/);assert.match(hooks,/"EARLY RETURN"/);assert.match(hooks,/"EXTRACTION REQUIRED"/);assert.match(src,/overflow-y:auto/);
});
test('existing presentation places the readable menu in the current HUD reservation before any drawing receipt',()=>{
  for(const [width,height] of [[568,320],[844,390],[320,568],[390,844],[1280,800]]){
    const{c,api}=fixture(),n=c.enter();const dom=transitionDOM(c);
    vm.runInContext(fs.readFileSync('runtime_hud.js','utf8'),c);
    c.cv={width:Math.round(width*540/height),height:540,getBoundingClientRect:()=>({width,height,left:10,top:8})};
    const before=JSON.stringify({x:n.x,y:n.y,w:n.w,h:n.h,cam:n.cam});
    const expected=c.TechOpsRuntimeHud.layout(c.TechOpsRuntimeHud.viewport(c.cv)).menu;
    assert.equal(c.__techOpsNightHudEvidence,undefined,'the menu cannot require a previous draw');api.frame(.016);
    const button=dom.nodes.get('night-campaign'),host=dom.nodes.get('night-runtime-ui');
    assert.equal(button.style.left,(expected.x+10)+'px');assert.equal(button.style.top,(expected.y+8)+'px');assert.equal(button.style.right,'auto');assert.equal(button.getAttribute('data-readable-hud'),'true');
    assert.equal(button.onclick,api.openCampaign,'the original click owner is retained');assert.equal(host.hidden,false);
    const probe=dom.nodes.get('night-hud-safe-area');assert.ok(probe,'passive inset probe exists before rendering');
    c.getComputedStyle=item=>item===probe?{paddingTop:'20px',paddingRight:'44px',paddingBottom:'0px',paddingLeft:'0px'}:{display:'block',visibility:'visible'};
    api.frame(.016);assert.equal(button.style.top,'28px');assert.ok(parseFloat(button.style.left)+122<=width-44+10);
    c.getComputedStyle=()=>({display:'block',visibility:'visible'});api.frame(.016);assert.equal(button.style.left,(expected.x+10)+'px');assert.equal(button.style.top,(expected.y+8)+'px');
    c.cv.getBoundingClientRect=()=>({width:844,height:390,left:10,top:8});host.getBoundingClientRect=()=>({left:4,top:2});
    const rotated=c.TechOpsRuntimeHud.layout(c.TechOpsRuntimeHud.viewport(c.cv)).menu;api.frame(.016);
    assert.equal(button.style.left,(rotated.x+6)+'px');assert.equal(button.style.top,(rotated.y+6)+'px');
    assert.equal(JSON.stringify({x:n.x,y:n.y,w:n.w,h:n.h,cam:n.cam}),before,'menu geometry cannot move the world');
    c.S.inDialog=true;api.frame(.016);assert.equal(host.hidden,true,'modal keeps ownership');c.S.inDialog=false;
    n._sector04={};api.frame(.016);assert.equal(button.getAttribute('data-readable-hud'),'false');for(const key of ['left','top','right'])assert.equal(button.style[key],undefined,'specialized Sector04 restores original positioning');
  }
  const source=fs.readFileSync('runtime_night.js','utf8');assert.match(source,/#night-runtime-ui #night-campaign\[data-readable-hud="true"\][^\n]*height:44px[^\n]*font:13px\/1\.15 monospace!important/,'readable menu overrides retired10px recording styling');
});
test('campaign control retains its label node across stable frames and updates only changed presentation',()=>{
  const{c,api}=fixture(),n=c.enter(),dom=transitionDOM(c);
  vm.runInContext(fs.readFileSync('runtime_hud.js','utf8'),c);
  let rect={width:844,height:390,left:10,top:8};
  c.cv={width:1169,height:540,getBoundingClientRect:()=>rect};api.frame(.016);
  const button=dom.nodes.get('night-campaign'),owner=button.onclick,writes=[];
  let label=button.textContent,labelNode={nodeType:3,data:label};
  // Like a real element, assigning textContent replaces its text child even
  // when the string is unchanged. This fixture checks mutation, not native
  // browser click synthesis, which belongs to the held-press browser route.
  Object.defineProperties(button,{
    textContent:{get:()=>label,set(value){label=String(value);labelNode={nodeType:3,data:label};writes.push('text='+label);}},
    firstChild:{get:()=>labelNode}
  });
  const setAttribute=button.setAttribute;
  button.setAttribute=function(key,value){writes.push('attribute.'+key+'='+value);return setAttribute.call(this,key,value);};
  const style={...button.style};
  style.removeProperty=key=>{writes.push('remove.'+key);delete style[key];};
  button.style=new Proxy(style,{set(target,key,value){writes.push('style.'+key+'='+value);target[key]=value;return true;}});
  function frames(count=1){
    writes.length=0;for(let i=0;i<count;i++)api.frame(.016);
    return {node:button.firstChild,label:button.textContent,writes:writes.slice().sort(),left:style.left,top:style.top,right:style.right,readable:button.getAttribute('data-readable-hud'),button:dom.nodes.get('night-campaign'),owner:button.onclick};
  }
  const originalNode=button.firstChild,stable=frames(8);
  rect={width:320,height:568,left:12,top:16};
  const menu=c.TechOpsRuntimeHud.layout(c.TechOpsRuntimeHud.viewport(c.cv)).menu;
  const resized=frames(),stableResized=frames(8);
  n._sector04={};const handedOff=frames(),stableSector=frames(8);
  delete n._sector04;const restored=frames(),stableRestored=frames(8);
  c.S.meta._standaloneMode='nightcrawler';const renamed=frames(),stableRenamed=frames(8);

  assert.equal(stable.node,originalNode,'an unchanged frame must not replace the campaign label between native pointer down/up');
  for(const [name,snapshot] of Object.entries({stable,stableResized,stableSector,stableRestored,stableRenamed})){
    assert.deepEqual(snapshot.writes,[],name+' must not rewrite unchanged label, attributes or inline geometry');
  }
  assert.equal(resized.left,(menu.x+12)+'px');assert.equal(resized.top,(menu.y+16)+'px');
  assert.deepEqual(resized.writes,['style.left='+resized.left,'style.top='+resized.top].sort(),'resize updates only changed geometry');
  assert.equal(handedOff.readable,'false');assert.equal(handedOff.left,undefined);assert.equal(handedOff.top,undefined);assert.equal(handedOff.right,undefined);
  assert.deepEqual(handedOff.writes,['attribute.data-readable-hud=false','remove.left','remove.right','remove.top'],'Sector 04 releases reserved geometry once');
  assert.equal(restored.readable,'true');assert.equal(restored.left,resized.left);assert.equal(restored.top,resized.top);assert.equal(restored.right,'auto');
  assert.deepEqual(restored.writes,['attribute.data-readable-hud=true','style.left='+restored.left,'style.right=auto','style.top='+restored.top].sort(),'returning to the shared HUD restores its current geometry');
  for(const snapshot of [stable,resized,stableResized,handedOff,stableSector,restored,stableRestored])assert.equal(snapshot.node,originalNode,'geometry and presentation ownership do not replace the label');
  assert.equal(renamed.label,'RUN MENU [C]');assert.notEqual(renamed.node,originalNode);assert.deepEqual(renamed.writes,['text=RUN MENU [C]']);assert.equal(stableRenamed.node,renamed.node,'a real label change settles after one write');
  for(const snapshot of [stable,resized,stableResized,handedOff,stableSector,restored,stableRestored,renamed,stableRenamed]){assert.equal(snapshot.button,button);assert.equal(snapshot.owner,owner,'presentation must retain the existing campaign click owner');}
});
console.log(`Night lifecycle: ${passed} regression groups passed`);
