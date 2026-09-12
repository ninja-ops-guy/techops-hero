const assert=require('node:assert'),fs=require('node:fs'),vm=require('node:vm');
function fixture(){
 let now=0,next=1;const timers=new Map(),nodes=[];
 const set=(fn,ms,repeat=false)=>{const id=next++;timers.set(id,{fn,at:now+ms,ms,repeat});return id;};
 const make=tag=>{const n={tag,style:{},dataset:{},duration:9.433333,currentTime:0,appendChild(){},remove(){this.removed=true;},setAttribute(){},removeAttribute(){},pause(){},load(){},play(){return Promise.resolve();},querySelector(){return make('stage');}};nodes.push(n);return n;};
 const root={document:{createElement:make,getElementById(){return null;},body:{appendChild(){}}},Date:{now:()=>now},setTimeout:(f,m)=>set(f,m),clearTimeout:id=>timers.delete(id),setInterval:(f,m)=>set(f,m,true),clearInterval:id=>timers.delete(id),TechOpsGoodBoysOpeningV4:{}};
 vm.createContext(root);vm.runInContext(fs.readFileSync('good_boys_crash_scene.js','utf8'),root);
 const tick=ms=>{const until=now+ms;while(true){const due=[...timers].filter(([,t])=>t.at<=until).sort((a,b)=>a[1].at-b[1].at)[0];if(!due)break;const [id,t]=due;now=t.at;if(t.repeat)t.at+=t.ms;else timers.delete(id);t.fn();}now=until;};
 return {root,nodes,tick};
}
(async()=>{
 const f=fixture(),done=f.root.TechOpsGoodBoysCrashScene.showCrashScene(),v=f.nodes.find(n=>n.tag==='video');v.onloadeddata();v.onplaying();
 assert(f.root.__goodBoysCrashScene.playbackBudgetMs>9433,'absolute budget must include the whole source film');
 for(let i=1;i<=92;i++){v.currentTime=i/10;v.ontimeupdate();f.tick(100);}
 assert.strictEqual(f.root.__goodBoysCrashScene.watchdogTriggered,false,'healthy 9.2 second playback must not switch to a plate');
 v.currentTime=v.duration;v.onended();const end=await done;assert.strictEqual(end.source,'authored-crash-video');assert.strictEqual(end.watchdogTriggered,false);
 const stalled=fixture(),fallback=stalled.root.TechOpsGoodBoysCrashScene.showCrashScene(),sv=stalled.nodes.find(n=>n.tag==='video');sv.onloadeddata();sv.onplaying();stalled.tick(3600);
 assert.strictEqual(stalled.root.__goodBoysCrashScene.watchdogReason,'video-stall','stalled playback must remain bounded');stalled.nodes.find(n=>n.tag==='img').onload();stalled.tick(2200);assert.strictEqual((await fallback).source,'authored-crash-plate');
 console.log('Crash playback duration and stalled-media recovery: PASS');
})().catch(e=>{console.error(e);process.exitCode=1;});
