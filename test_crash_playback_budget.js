const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');

function fixture(options={}){
 let now=0,next=1;const timers=new Map(),nodes=[],listeners=new Map();
 const set=(fn,ms,repeat=false)=>{const id=next++;timers.set(id,{fn,at:now+ms,ms,repeat});return id;};
 const doc={hidden:false,activeElement:null,addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,new Set());listeners.get(type).add(fn);},removeEventListener(type,fn){listeners.get(type)?.delete(fn);},getElementById(id){return nodes.find(n=>n.id===id&&n.isConnected)||null;}};
 function connect(node,value){node.isConnected=value;node.children.forEach(child=>connect(child,value));}
 const make=tag=>{
  const n={tag,style:{},dataset:{},children:[],attrs:{},isConnected:false,hidden:false,disabled:false,textContent:'',duration:9.433333,currentTime:0,playCalls:0,pauseCalls:0,
   appendChild(child){this.children.push(child);child.parentNode=this;connect(child,this.isConnected);return child;},
   remove(){connect(this,false);if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(child=>child!==this);},
   setAttribute(key,value){this.attrs[key]=value;},removeAttribute(key){delete this.attrs[key];if(key==='src')delete this.src;},
   focus(){doc.activeElement=this;},pause(){this.pauseCalls++;},load(){},play(){this.playCalls++;return Promise.resolve();},
   canPlayType(){return options.elementSupport===undefined?'probably':options.elementSupport;},
   querySelector(selector){return this.children.find(child=>selector==='[data-stage]'?child.attrs['data-stage']!==undefined:child.id===selector.slice(1))||null;}
  };
  Object.defineProperty(n,'innerHTML',{set(html){
   const stage=make('div');stage.attrs['data-stage']='';this.appendChild(stage);
   for(const match of html.matchAll(/<(button|p)\b([^>]*)>([^<]*)<\/\1>/g)){
    const id=match[2].match(/id="([^"]+)"/);if(!id)continue;
    const child=make(match[1]);child.id=id[1];child.textContent=match[3];child.hidden=/\bhidden\b/.test(match[2]);this.appendChild(child);
   }
  }});
  nodes.push(n);return n;
 };
 doc.createElement=make;doc.body=make('body');doc.body.isConnected=true;
 const launcher=make('button');launcher.id='launcher';doc.body.appendChild(launcher);launcher.focus();
 const root={document:doc,Date:{now:()=>now},setTimeout:(f,m)=>set(f,m),clearTimeout:id=>timers.delete(id),setInterval:(f,m)=>set(f,m,true),clearInterval:id=>timers.delete(id),TechOpsGoodBoysOpeningV4:{},MediaSource:{isTypeSupported:()=>!!options.mediaSourceSupport}};
 if(options.sharedSupport!==undefined)root.GoodDogsCutscenes={mediaCapability:()=>({supported:options.sharedSupport})};
 vm.createContext(root);vm.runInContext(fs.readFileSync('good_boys_crash_scene.js','utf8'),root);
 const tick=ms=>{const until=now+ms;while(true){const due=[...timers].filter(([,t])=>t.at<=until).sort((a,b)=>a[1].at-b[1].at)[0];if(!due)break;const [id,t]=due;now=t.at;if(t.repeat)t.at+=t.ms;else timers.delete(id);t.fn();}now=until;};
 const event=extra=>({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){},...extra});
 const dispatch=(type,extra={})=>{for(const fn of [...(listeners.get(type)||[])])fn(event(extra));};
 tick(50); // Retire the installation poll; remaining timers belong to playback.
 return {root,doc,nodes,timers,listeners,launcher,tick,dispatch,event,button:name=>doc.getElementById('good-boys-crash-'+name),video:()=>nodes.find(n=>n.tag==='video'),state:()=>root.__goodBoysCrashScene};
}
function start(f){const done=f.root.TechOpsGoodBoysCrashScene.showCrashScene(),v=f.video();v.onloadeddata();v.onplaying();return {done,v};}
function assertClean(f){assert.equal(f.doc.getElementById('good-boys-crash-canonical'),null);assert.equal(f.doc.activeElement,f.launcher,'prior focus restored');assert.equal(f.timers.size,0,'playback timers cleaned');for(const set of f.listeners.values())assert.equal(set.size,0,'modal listeners cleaned');}

(async()=>{
 assert.ok(fs.readFileSync('campaign_native_act1_visuals.js','utf8').includes('good_boys_crash_scene.js?v=20260920-crash-recovery-r1'),'lazy loader must invalidate the retired automatic fallback owner');
 // A healthy authored film retains its complete duration and terminal owner.
 const healthy=fixture(),{done,v}=start(healthy);
 assert(healthy.state().playbackBudgetMs>9433,'budget must include the whole source film');
 for(let i=1;i<=92;i++){v.currentTime=i/10;v.ontimeupdate();healthy.tick(100);}
 assert.equal(healthy.state().watchdogTriggered,false,'healthy 9.2 seconds cannot trigger recovery');
 v.currentTime=v.duration;v.onended();const ended=await done;
 assert.equal(ended.status,'COMPLETED');assert.equal(ended.source,'authored-crash-video');assert.equal(ended.watchdogTriggered,false);assertClean(healthy);

 // Neither capability absence nor the passive approved plate can advance story.
 for(const options of [{elementSupport:'',mediaSourceSupport:false},{sharedSupport:false,elementSupport:'probably',mediaSourceSupport:true}]){
  const f=fixture(options),promise=f.root.TechOpsGoodBoysCrashScene.showCrashScene();let settlements=0;promise.then(()=>settlements++);
  assert.equal(f.root.TechOpsGoodBoysCrashScene.showCrashScene(),promise,'concurrent callers share one owner/promise');
  assert.equal(f.nodes.filter(n=>n.id==='good-boys-crash-canonical').length,1);
  assert.equal(f.video().src,undefined,'unsupported media cannot assign video src');assert.equal(f.video().playCalls,0);
  assert.equal(f.state().recoveryReason,'codec-unsupported');assert.equal(f.state().completed,false);
  assert.equal(f.button('play').disabled,true);assert.match(f.button('status').textContent,/cannot play.*Skip/);
  assert.equal(f.doc.activeElement,f.button('skip'));f.dispatch('keydown',{key:'Tab'});assert.equal(f.doc.activeElement,f.button('skip'));
  f.dispatch('keydown',{key:'Tab',shiftKey:true});assert.equal(f.doc.activeElement,f.button('skip'));
  const plate=f.nodes.find(n=>n.tag==='img');assert.equal(plate.hidden,false);if(plate.onload)plate.onload();f.tick(60000);await Promise.resolve();
  assert.equal(settlements,0,'passive plate and elapsed time cannot settle');assert.equal(f.state().completed,false);
  const skip=f.button('skip').onclick,lateEnded=f.video().onended;
  skip(f.event());skip(f.event());lateEnded();const result=await promise;await Promise.resolve();
  assert.equal(settlements,1,'double Skip and late ended settle once');assert.equal(result.status,'USER_SKIPPED');assert.equal(result.source,'user-skipped');assertClean(f);
 }
 const mediaSourceOnly=fixture({elementSupport:'',mediaSourceSupport:true}),mse=mediaSourceOnly.root.TechOpsGoodBoysCrashScene.showCrashScene();assert.match(mediaSourceOnly.video().src,/09_prison_crash/);mediaSourceOnly.button('skip').onclick(mediaSourceOnly.event());await mse;

 // The stall watchdog bounds recovery time, not narrative completion time.
 const stalled=fixture(),stalledRun=start(stalled);let stallSettled=false;stalledRun.done.then(()=>stallSettled=true);stalled.tick(3600);
 assert.equal(stalled.state().watchdogReason,'video-stall');assert.equal(stalled.state().recovery,true);assert.equal(stalled.state().completed,false);
 const still=stalled.nodes.find(n=>n.tag==='img');assert.equal(still.hidden,false);if(still.onload)still.onload();stalled.tick(60000);await Promise.resolve();assert.equal(stallSettled,false);
 assert.equal(stalled.doc.activeElement,stalled.button('play'));stalled.dispatch('keydown',{key:'Tab'});assert.equal(stalled.doc.activeElement,stalled.button('skip'));
 stalled.dispatch('keydown',{key:'Tab',shiftKey:true});assert.equal(stalled.doc.activeElement,stalled.button('play'));
 stalled.dispatch('keydown',{key:'Escape'});assert.equal((await stalledRun.done).status,'USER_SKIPPED');assertClean(stalled);

 // Pause freezes watchdog budget; explicit resume receives remaining duration.
 const paused=fixture(),pausedRun=start(paused);pausedRun.v.currentTime=2;pausedRun.v.ontimeupdate();
 paused.button('pause').onclick(paused.event());assert.equal(paused.timers.size,0);paused.tick(60000);
 assert.equal(paused.state().completed,false);assert.equal(paused.state().watchdogTriggered,false);
 paused.button('play').onclick(paused.event());pausedRun.v.onplaying();
 assert.equal(paused.state().playbackBudgetMs,Math.ceil((pausedRun.v.duration-2)*1000)+3000);
 paused.button('skip').onclick(paused.event());await pausedRun.done;assertClean(paused);

 // A hidden ended event waits for visible, deliberate Resume instead of credit.
 const hidden=fixture(),hiddenRun=start(hidden);hidden.doc.hidden=true;hidden.dispatch('visibilitychange');
 assert.equal(hidden.timers.size,0);hiddenRun.v.currentTime=hiddenRun.v.duration;hiddenRun.v.onended();hidden.tick(60000);
 assert.equal(hidden.state().completed,false);hidden.button('skip').onclick(hidden.event());assert.equal(hidden.state().completed,false,'hidden Skip does not advance');
 hidden.doc.hidden=false;hidden.dispatch('visibilitychange');assert.equal(hidden.state().completed,false);assert.equal(hidden.doc.activeElement,hidden.button('play'));
 hidden.button('play').onclick(hidden.event());assert.equal((await hiddenRun.done).status,'COMPLETED');assertClean(hidden);
 console.log('Crash duration, capability, recovery, pause/visibility, idempotence and modal cleanup: PASS');
})().catch(error=>{console.error(error);process.exitCode=1;});
