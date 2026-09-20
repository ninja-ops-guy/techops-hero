'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const listeners={},docListeners={},dom={},ctx={console,Date,Math,WeakMap,setTimeout,clearTimeout,performance:{now:()=>1000},addEventListener:(k,f)=>{(listeners[k]||=[]).push(f);},getComputedStyle:e=>e.style||{},document:{hidden:false,querySelector:()=>null,getElementById:id=>dom[id]||null,addEventListener:(k,f)=>{docListeners[k]=f;}},S:{meta:{_v736:{m:1}},inDialog:false},save(){}};ctx.globalThis=ctx;vm.createContext(ctx);
for(const file of ['cinematic_systems.js','good_dogs_coop.js'])vm.runInContext(fs.readFileSync(file,'utf8'),ctx);
const api=ctx.TechOpsGoodDogsCoop;
function world(m=1){const c={m,active:'katrin',partner:{x:100,y:396,w:22,h:34,vx:0,vy:0,onGround:true,face:1,jumps:0,cd:0},chars:{katrin:{hp:100,maxHp:100},manchez:{hp:120,maxHp:120}},shots:[],sync:0};ctx.NM={x:110,y:396,w:22,h:34,vx:0,vy:0,onGround:true,face:1,platforms:[],enemies:[],_v736:c};ctx.S.meta._v736={m};api.stepPuzzle(ctx.NM,0);return ctx.NM;}
function key(code,down=true){const event={code,preventDefault(){},stopImmediatePropagation(){}};for(const f of listeners[down?'keydown':'keyup']||[])f(event);}
function steps(n,count){for(let i=0;i<count;i++)api.stepPuzzle(n,.02);}
let n=world();api.configure('local');key('KeyD');api.stepPartner(n,1/60,1,()=>{});assert.equal(n.x,110,'P2 must never write P1 movement');assert.ok(n._v736.partner.x>100);key('KeyD',false);
const p=n._v736.partner;key('KeyW');api.stepPartner(n,1/60,1,()=>{});assert.ok(p.vy<0);assert.equal(p.jumps,1);key('KeyW',false);
ctx.S.inDialog=true;key('KeyD');const pausedX=p.x;api.stepPartner(n,1/60,1,()=>{});assert.equal(p.x,pausedX,'dialog pauses second-player simulation');ctx.S.inDialog=false;
key('KeyD');listeners.blur.forEach(f=>f());p.vx=0;api.stepPartner(n,1/60,1,()=>{});assert.equal(p.vx,0,'blur releases held input');
// Every modal/lifecycle transition rejects and releases a held P2 input. Closing
// the blocker cannot replay movement that began before it appeared.
function visibleNode(){return{hidden:false,classList:{contains:()=>false},style:{display:'block',visibility:'visible',opacity:'1'}};}
function noReplay(label,block,unblock){n=world();api.configure('local');const body=n._v736.partner;body.vx=0;key('KeyD');block();api.stepPartner(n,1/60,1,()=>{});const x=body.x;unblock();api.stepPartner(n,1/60,1,()=>{});assert.equal(body.x,x,label+' must clear held movement');assert.equal(body.vx,0,label+' must not leave velocity queued');key('KeyD',false);}
noReplay('game over',()=>{ctx.S.gameOver=true;},()=>{ctx.S.gameOver=false;});
noReplay('hidden document',()=>{ctx.document.hidden=true;},()=>{ctx.document.hidden=false;});
noReplay('panel',()=>{dom.panel=visibleNode();},()=>{delete dom.panel;});
noReplay('settings',()=>{dom['v67-settings']=visibleNode();},()=>{delete dom['v67-settings'];});
let presentationBlocked=false;ctx.TechOpsPresentationDirector={isBlocking:()=>presentationBlocked};
noReplay('presentation claim',()=>{presentationBlocked=true;},()=>{presentationBlocked=false;});
noReplay('campaign cinematic',()=>{dom['good-boys-ship-interlude']=visibleNode();},()=>{delete dom['good-boys-ship-interlude'];});
n=world();api.configure('local');const queued=n._v736.partner;key('KeyD');key('KeyW');ctx.S.inDialog=true;api.beginStep(n);ctx.S.inDialog=false;api.stepPartner(n,1/60,1,()=>{});assert.equal(queued.x,100,'frame-boundary modal cleanup rejects held movement when partner scheduling was skipped');assert.equal(queued.jumps,0,'frame-boundary modal cleanup rejects queued jump edges');key('KeyD',false);key('KeyW',false);
// No auto-attacks. A miss cannot manufacture damage/SYNC.
n=world(2);api.configure('local');let hits=0;n.enemies=[{x:130,y:396,w:24,h:34,hp:30,alive:true}];api.stepPartner(n,.02,1.2,()=>hits++);assert.equal(hits,0);key('KeyF');api.stepPartner(n,.02,1.2,()=>hits++);assert.equal(hits,1);key('KeyF',false);n._v736.partner.cd=0;n.enemies[0].x=500;key('KeyF');api.stepPartner(n,.02,1.2,()=>hits++);assert.equal(hits,1);assert.equal(n._v736.sync,0);key('KeyF',false);
// At the shared-screen limit, P2 cannot drag an idle P1 across the world.
n=world();api.configure('local');n.x=100;n._v736.partner.x=780;api.beginStep(n);n._v736.partner.x=800;api.constrain(n,1280);assert.equal(n.x,100);assert.equal(n._v736.partner.x,780);
api.beginStep(n);n.x=80;api.constrain(n,1280);assert.equal(n.x,100);assert.equal(n._v736.partner.x,780);
// Weight puzzle: one dog, same pad, airborne or a downed partner never suffice.
n=world();api.configure('local');n.x=1179;n._v736.partner.x=1179;steps(n,100);assert.equal(api.complete(1),false);n._v736.partner.x=1369;n._v736.partner.y=350;steps(n,100);assert.equal(api.complete(1),false);n._v736.partner.y=396;n._v736.chars.manchez.downed=true;steps(n,100);assert.equal(api.complete(1),false);n._v736.chars.manchez.downed=false;steps(n,15);assert.ok(n._v736.pairPuzzle.charge>0);n.x=100;steps(n,1);assert.equal(n._v736.pairPuzzle.charge,0,'letting go resets the hold');n.x=1179;steps(n,45);assert.equal(api.complete(1),true);
// M2 additionally requires security clearance AND an actual console interaction.
n=world(2);api.configure('local');n.x=1200;n._v736.partner.x=969;steps(n,100);assert.equal(api.complete(2),false);assert.equal(api.interact(1),false,'combat USE must not be consumed by the locked console');steps(n,100);assert.equal(api.complete(2),false);n._gbShipRevealed=true;assert.equal(api.interact(1),true);steps(n,65);assert.equal(api.complete(2),true);assert.equal(api.complete(3),true);
n=world(2);api.configure('solo');n.x=969;assert.equal(api.interact(1),false,'combat E must not accidentally toggle partner hold');assert.equal(api.aiHolding(),false);
n=world(2);api.configure('local');n._gbShipRevealed=true;n.x=969;n._v736.partner.x=1199;assert.equal(api.interact(2),true,'P2 can operate the console while P1 holds power');steps(n,65);assert.equal(api.complete(2),true);
// Solo partner command has explicit hold and release; no second device required.
n=world();api.configure('solo');n.x=1179;assert.equal(api.interact(1),true);assert.equal(api.aiHolding(),true);assert.equal(api.aiTarget(n),1179);assert.equal(api.interact(1),true);assert.equal(api.aiHolding(),false);
// A human revives the other body's state, without changing ownership/positions.
n=world();api.configure('local');n._v736.chars.katrin.downed=true;n._v736.chars.katrin.hp=0;assert.equal(api.revive(2),true);assert.equal(n._v736.active,'katrin');assert.equal(n.x,110);assert.equal(n._v736.partner.x,100);assert.equal(n._v736.chars.katrin.hp,40);assert.equal(api.revive(2),false);
const boot=fs.readFileSync('campaign_native_act1_visuals.js','utf8'),title=fs.readFileSync('good_boys_button_hard_fix.js','utf8'),home=fs.readFileSync('good_dogs_home_scene.js','utf8');
assert.ok(boot.includes('VERSION||0)<16'));assert.ok(boot.indexOf('good_dogs_home_scene.js')<boot.indexOf('good_boys_button_hard_fix.js'));assert.ok(title.indexOf('await root.TechOpsGoodDogsHomeScene.choose()')<title.indexOf('await root.TechOpsGoodDogsHomeScene.play()'));assert.ok(!home.includes('GD_CUT_01'));assert.ok(home.includes('drawWorldBack'),'gameplay must share the home prologue source');
assert.ok(home.includes('role="status"')&&home.includes('aria-describedby="gd-local-device-note"'),'touch-only local mode must explain its disabled state accessibly');
function homeHarness(touch,{coarse=touch,touchApi=touch}={}){const events={};const r={console,navigator:{maxTouchPoints:touch?5:0},matchMedia:()=>({matches:coarse}),document:{getElementById:()=>null},addEventListener:(k,f)=>{events[k]=f;}};if(touchApi)r.ontouchstart=null;r.globalThis=r;vm.createContext(r);vm.runInContext(home,r,{filename:'good_dogs_home_scene.js'});return{r,events,api:r.TechOpsGoodDogsHomeScene};}
let h=homeHarness(true);assert.equal(h.api.localAvailable(),false,'touch-primary devices start with local keyboard co-op disabled');assert.match(h.api.localReason(),/physical keyboard/i);assert.equal(h.api.observeKeyboard({key:'a',isTrusted:false}),false,'synthetic keys cannot claim a physical keyboard');assert.equal(h.api.localAvailable(),false);assert.equal(h.api.observeKeyboard({key:'a',isTrusted:true}),true);assert.equal(h.api.localAvailable(),true,'an observed physical key enables local mode for the session');
h=homeHarness(true,{coarse:false,touchApi:true});assert.equal(h.api.touchPrimary(),true,'touch API plus touch points detects WebKit mobile even when pointer media emulation is incomplete');assert.equal(h.api.localAvailable(),false,'WebKit mobile fails closed until a trusted physical key is observed');
h=homeHarness(true,{coarse:false,touchApi:false});assert.equal(h.api.touchPrimary(),true,'touch points alone are the conservative device capability boundary');assert.equal(h.api.localAvailable(),false,'touch-capable devices fail closed and recover after a trusted keyboard event');assert.equal(h.api.observeKeyboard({key:'Enter',isTrusted:true}),true);assert.equal(h.api.localAvailable(),true);
h=homeHarness(false);assert.equal(h.api.localAvailable(),true,'desktop keeps local mode available without a capability prompt');
console.log('Good Dogs independent co-op controls, puzzle gates, solo commands, revive and opening ownership: PASS');
