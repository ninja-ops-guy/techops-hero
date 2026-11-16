'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
let checks=0;async function test(name,fn){await fn();checks++;console.log('PASS',name);}
function fixture(){
 const events={},created=[],param=()=>({value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},setTargetAtTime(){}});
 class Node{constructor(){this.gain=param();this.frequency=param();this.Q=param();this.started=[];this.stopped=false;this.disconnected=false;}connect(){}disconnect(){this.disconnected=true;}start(t){this.started.push(t);}stop(){this.stopped=true;}}
 class AudioContext{constructor(){this.state='suspended';this.sampleRate=48000;this.currentTime=0;this.destination={};created.push(this);this.nodes=[];}async resume(){this.state='running';}createGain(){return new Node();}createBuffer(channels,length,sampleRate){return {duration:length/sampleRate,getChannelData:()=>new Float32Array(length)};}createBiquadFilter(){return new Node();}createOscillator(){const n=new Node();this.nodes.push(n);return n;}createBufferSource(){const n=new Node();this.nodes.push(n);return n;}async decodeAudioData(){return {duration:10};}}
 const root={AudioContext,document:{hidden:false,addEventListener:(name,fn)=>events[name]=fn},addEventListener:(name,fn)=>events[name]=fn,fetch:async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(16)})};root.globalThis=root;vm.runInNewContext(fs.readFileSync('runtime_field_score.js','utf8'),root);return {root,score:root.TechOpsFieldScore,created,events};
}
(async()=>{
 await test('no context, playback or request before explicit start',async()=>{const f=fixture();f.score.update({threat:true});assert.equal(f.created.length,0);assert.equal(f.score.engaged(),false);});
 await test('explicit start, phrase-boundary transitions and bounded voices',async()=>{const f=fixture();assert.equal(await f.score.start(.3),true);f.score.update({quiet:true});assert.equal(f.score.diagnostics().mode,'quiet');const ac=f.created[0];ac.currentTime=.5;f.score.update({threat:true});assert.equal(f.score.diagnostics().mode,'quiet');for(let i=0;i<30;i++){ac.currentTime+=.1;f.score.update({threat:true});}assert.equal(f.score.diagnostics().mode,'threat');assert(f.score.diagnostics().voices<=24);});
 await test('dialogue, master mute, hidden page and stop immediately dispose all voices',async()=>{for(const action of ['dialogue','mute','hidden','stop']){const f=fixture();await f.score.start();f.score.update({threat:true});assert(f.score.diagnostics().voices>0);if(action==='dialogue')f.score.update({blocked:true});if(action==='mute')f.score.setMuted(true);if(action==='hidden'){f.root.document.hidden=true;f.events.visibilitychange();}if(action==='stop')f.score.stop();assert.equal(f.score.diagnostics().voices,0);assert(f.created[0].nodes.every(n=>n.stopped&&n.disconnected));}});
 await test('unpause schedules a fresh phrase instead of replaying missed audio',async()=>{const f=fixture();await f.score.start();f.score.update({quiet:true});f.score.update({blocked:true});f.created[0].currentTime=100;f.score.update({escort:true});assert.equal(f.score.diagnostics().mode,'care');const nodes=f.created[0].nodes.filter(n=>!n.stopped);assert(nodes.every(n=>n.started[0]>=100));assert(nodes.length<=3);});
 await test('audio failure is reported without throwing into gameplay',async()=>{const f=fixture();f.root.AudioContext=undefined;assert.equal(await f.score.start(),false);assert.match(f.score.diagnostics().error,/unavailable/);f.score.update({});assert.equal(f.score.diagnostics().voices,0);});
 await test('leaving while resume is pending cannot enable late audio',async()=>{const f=fixture();let resolve;f.root.AudioContext=class{constructor(){this.state='suspended';this.destination={};}createGain(){return {connect(){},gain:{value:0}};}resume(){return new Promise(r=>{resolve=()=>{this.state='running';r();};});}};const pending=f.score.start();f.score.stop();resolve();assert.equal(await pending,false);assert.equal(f.score.engaged(),false);});
 await test('artist stems reject remote paths and mismatched durations',async()=>{const f=fixture();await f.score.start();await assert.rejects(()=>f.score.loadPack({bpm:96,bars:4,layers:{bed:'https://example.com/x.mp3'}}),/approved/);await assert.rejects(()=>f.score.loadPack({bpm:120,bars:1,layers:{bed:'assets/music/bed.wav'}}),/loop length/);assert.equal(f.score.diagnostics().source,'reference-arrangement');});
 await test('artist layers share an audio start time and replace the reference arrangement',async()=>{const f=fixture();await f.score.start();assert.equal(await f.score.loadPack({bpm:96,bars:4,layers:{bed:'assets/music/bed.wav',pulse:'assets/music/pulse.wav'}}),true);f.score.update({});const nodes=f.created[0].nodes;assert.equal(nodes.length,2);assert.equal(nodes[0].started[0],nodes[1].started[0]);assert(nodes.every(n=>n.loop&&n.loopEnd===10));assert.equal(f.score.diagnostics().source,'artist-stems');f.score.stop();assert(nodes.every(n=>n.disconnected));});
 await test('decoded stems respect a separate mobile memory budget',async()=>{const f=fixture();await f.score.start();f.created[0].decodeAudioData=async()=>({duration:10,length:20000000,numberOfChannels:2});await assert.rejects(()=>f.score.loadPack({bpm:96,bars:4,layers:{bed:'assets/music/bed.wav'}}),/mobile audio budget/);assert.equal(f.score.diagnostics().source,'reference-arrangement');});
 await test('a configured score load cancelled by leaving cannot activate late',async()=>{const f=fixture();await f.score.start();let resolve;f.root.fetch=()=>new Promise(r=>resolve=r);const pending=f.score.loadConfiguredPack();f.score.stop();resolve({ok:true,json:async()=>({source:'reference-arrangement'})});assert.equal(await pending,false);assert.equal(f.score.engaged(),false);});
 await test('rehearsal auditions survive only their own menu, then stop on other menus or blur',async()=>{const f=fixture();await f.score.start();assert.equal(f.score.playPattern([0,1,2,3]),true);assert.equal(f.score.diagnostics().auditions,4);f.score.update({blocked:true,rehearsal:true});assert.equal(f.score.diagnostics().auditions,4);f.score.update({blocked:true});assert.equal(f.score.diagnostics().voices,0);f.score.tap(0);f.events.blur({type:'blur'});assert.equal(f.score.diagnostics().voices,0);assert.equal(f.score.playPattern(Array(17).fill(0)),false);});
 await test('existing master toggle routes exclusively to the active field score',async()=>{const source=fs.readFileSync('game.js','utf8'),start=source.indexOf('function setMusic(on)'),end=source.indexOf('$("btn-music").addEventListener',start);let toggled,applied=0;const button={};const r={musicRequested:true,musicOn:true,sfxMuted:false,$:()=>button,applyMusicRequest:()=>applied++,TechOpsFieldScore:{engaged:()=>true,setMuted:v=>toggled=v}};r.window=r;vm.runInNewContext(source.slice(start,end),r);r.setMusic(false);assert.equal(toggled,true);assert.equal(r.musicRequested,false);assert.equal(r.sfxMuted,true);r.setMusic(true);assert.equal(toggled,false);assert.equal(r.musicRequested,false);assert.equal(r.musicOn,true);assert.equal(applied,2);});
 const manifest=()=>JSON.parse(fs.readFileSync('assets/music/field-score.json','utf8'));
 const ctx={episode:'iona_pressure',actor:'iona',moment:'countermeasure'};
 const drain=async()=>{for(let i=0;i<30;i++)await Promise.resolve();};
 const artist=()=>({approved:true,bpm:96,bars:4,meter:[4,4],phraseBars:2,percussionLayer:'pulse',layers:{bed:'assets/music/fixture_bed.wav',pulse:'assets/music/fixture_pulse.wav'}});
 function serve(f,m){const requests=[];f.root.fetch=async path=>{requests.push(path);return {ok:true,json:async()=>m,arrayBuffer:async()=>new ArrayBuffer(16)};};return requests;}
 await test('published catalog has approved scene references but no fabricated exports',async()=>{
   const f=fixture(),m=manifest();f.score.validateCatalog(m);assert.equal(m.source,'reference-arrangement');
   assert(Object.values(m.tracks).every(t=>t.pack===null));assert(!m.cues.some(c=>c.track==='the-mercy-i-buried'));
   const requests=serve(f,m);await assert.rejects(()=>f.score.loadConfiguredPack(ctx),/Enable audio/);assert.equal(requests.length,0);
   await f.score.start();await f.score.loadConfiguredPack(ctx);f.score.update(ctx);
   assert.equal(f.score.diagnostics().selectedTrack,'agamemnon');assert.equal(f.score.diagnostics().availability,'pending');
   assert.equal(f.score.diagnostics().source,'reference-arrangement');assert.deepEqual(requests,['assets/music/field-score.json']);
 });
 await test('catalog rejects unsupported meter, missing approval, duplicate stems and a reserved cue',async()=>{
   const f=fixture();for(const mutate of [p=>p.meter=[3,4],p=>p.approved=false,p=>p.percussionLayer='missing',p=>p.phraseBars=3,p=>p.layers.pulse=p.layers.bed]){
     const m=manifest();m.tracks.agamemnon.status='ready';m.tracks.agamemnon.pack=artist();mutate(m.tracks.agamemnon.pack);assert.throws(()=>f.score.validateCatalog(m));
   }
   const m=manifest();m.cues[0].track='the-mercy-i-buried';assert.throws(()=>f.score.validateCatalog(m),/cue/);
 });
 await test('artist catalog enables only a matching scene and retains declared phrase length',async()=>{
   const f=fixture(),m=manifest();m.source='artist-stems';m.tracks.agamemnon={status:'ready',pack:artist()};const requests=serve(f,m);
   await f.score.start();await f.score.loadConfiguredPack({...ctx,actor:'mike'});assert.equal(requests.length,1);
   f.score.update(ctx);await drain();f.score.update({...ctx,combat:true});assert.equal(f.score.diagnostics().source,'artist-stems');
   assert.equal(f.score.diagnostics().mode,'threat');assert.equal(f.created[0].nodes.length,2);
   f.created[0].currentTime=.2;f.score.update({...ctx,quiet:true});assert.equal(f.score.diagnostics().mode,'threat');
   for(let i=0;i<51;i++){f.created[0].currentTime+=.1;f.score.update({...ctx,quiet:true});}
   assert.equal(f.score.diagnostics().mode,'quiet');
 });
 await test('song selection waits for audible phrase boundary then leaves no artist voices',async()=>{
   const f=fixture(),m=manifest();m.source='artist-stems';m.tracks.agamemnon={status:'ready',pack:artist()};serve(f,m);
   await f.score.start();await f.score.loadConfiguredPack(ctx);f.score.update(ctx);const nodes=f.created[0].nodes.slice();
   f.created[0].currentTime=.2;f.score.update({episode:'home',actor:'mike'});assert.equal(f.score.diagnostics().selectedTrack,'agamemnon');
   for(let i=0;i<52;i++){f.created[0].currentTime+=.1;f.score.update({episode:'home',actor:'mike'});}
   assert.equal(f.score.diagnostics().source,'reference-arrangement');assert.equal(f.score.diagnostics().selectedTrack,null);assert(nodes.every(n=>n.stopped));
 });
 await test('a stopped fetch is discarded before decode and never activates later',async()=>{
   const f=fixture();await f.score.start();let resolve,decodes=0;f.root.fetch=()=>new Promise(r=>resolve=r);f.created[0].decodeAudioData=async()=>{decodes++;return {duration:10};};
   const pending=f.score.loadPack(artist());await drain();f.score.stop();resolve({ok:true,arrayBuffer:async()=>new ArrayBuffer(16)});
   assert.equal(await pending,false);assert.equal(decodes,0);assert.equal(f.score.diagnostics().decodedBytes,0);
 });
 await test('replacement loads serialize decoding and discard an obsolete decoded pack',async()=>{
   const f=fixture();await f.score.start();let resolve,decodes=0;f.created[0].decodeAudioData=()=>{decodes++;return decodes===1?new Promise(r=>resolve=r):Promise.resolve({duration:10});};
   const one=f.score.loadPack(artist());await drain();const two=f.score.loadPack(artist());await drain();assert.equal(decodes,1);
   resolve({duration:10});assert.equal(await one,false);assert.equal(await two,true);assert.equal(decodes,3);
 });
 await test('near-length layers with different sample counts are rejected',async()=>{
   const f=fixture();await f.score.start();let i=0;f.created[0].decodeAudioData=async()=>({duration:10+(i++*.001),sampleRate:48000,length:480000+(i-1)*48,numberOfChannels:2});
   await assert.rejects(()=>f.score.loadPack(artist()),/sample-aligned/);assert.equal(f.score.diagnostics().source,'reference-arrangement');
 });
 await test('failed routed load exposes the error without repeated per-frame fetches',async()=>{
   const f=fixture(),m=manifest();m.source='artist-stems';m.tracks.agamemnon={status:'ready',pack:artist()};serve(f,m);
   await f.score.start();await f.score.loadConfiguredPack({});let requests=0;f.root.fetch=async()=>{requests++;return {ok:false};};
   f.score.update(ctx);await drain();for(let i=0;i<5;i++)f.score.update(ctx);
   assert.equal(requests,1);assert.equal(f.score.diagnostics().availability,'error');assert.match(f.score.diagnostics().error,/unavailable/);
 });
 await test('missing initial artist pack returns a usable reference fallback with an error',async()=>{
   const f=fixture(),m=manifest();m.source='artist-stems';m.tracks.agamemnon={status:'ready',pack:artist()};
   f.root.fetch=async path=>path.endsWith('.json')?{ok:true,json:async()=>m}:{ok:false};
   await f.score.start();assert.equal(await f.score.loadConfiguredPack(ctx),true);await drain();f.score.update(ctx);
   assert.equal(f.score.engaged(),true);assert.equal(f.score.diagnostics().source,'reference-arrangement');assert.equal(f.score.diagnostics().availability,'error');assert(f.score.diagnostics().voices>0);
 });
 await test('a rejected stale resume cannot stop a later successful start',async()=>{
   const f=fixture();let reject;const original=f.root.AudioContext;f.root.AudioContext=class extends original{resume(){if(!reject)return new Promise((_,r)=>reject=r);this.state='running';return Promise.resolve();}};
   const stale=f.score.start();assert.equal(await f.score.start(),true);reject(Error('old interruption'));assert.equal(await stale,false);assert.equal(f.score.engaged(),true);
 });
 await test('muted asynchronous load cannot play and stop releases buffers',async()=>{
   const f=fixture();await f.score.start();const promise=f.score.loadPack(artist());f.score.setMuted(true);await promise;f.score.update({combat:true});assert.equal(f.created[0].nodes.length,0);
   f.score.setMuted(false);f.score.update({combat:true});assert.equal(f.created[0].nodes.length,2);f.score.stop();assert.equal(f.score.diagnostics().decodedBytes,0);
 });
 await test('danger, combat and recovery select separate mixes without hiding speech',async()=>{
   const f=fixture();await f.score.start();for(const [context,mode] of [[{danger:true},'danger'],[{combat:true,danger:true},'threat'],[{recovery:true},'recovery'],[{escort:true},'care']]){
     f.score.silence();f.score.update(context);assert.equal(f.score.diagnostics().mode,mode);f.score.update({blocked:true});assert.equal(f.score.diagnostics().voices,0);
   }
 });
 await test('real campaign adapter exposes only visible threats and completed dock departure',async()=>{
   const A=require('./campaign_living_world'),st=A.initial();st.done=A.Data.episodes.map(e=>e.id);st.flags.waldo_invited=st.flags.waldo_visit_received=true;
   const w={x:150,cam:0,hp:100,enemies:[]},game={};const r={TechOpsFieldcraft:A.Fieldcraft,document:{hidden:false,getElementById:()=>null},innerWidth:800};r.globalThis=r;
   vm.runInNewContext(fs.readFileSync('campaign_fieldcraft_runtime.js','utf8'),r);const x=r.TechOpsFieldcraftRuntime;
   x.attach({state:()=>st,world:()=>w,A,game:()=>game,active:()=>true});
   A.start(st,'dock',{});assert.equal(x.scoreContext().moment,null);st.active.step=A.episode('dock').goals.length;st.active.finished=true;assert.equal(x.scoreContext().moment,'departure-aftermath');
   A.start(st,'iona_pressure',{});st.active.step=1;assert.equal(x.scoreContext().moment,'countermeasure');
   w.enemies=[{alive:true,hp:100,x:-20,windup:3}];assert.equal(x.scoreContext().danger,false);
   w.enemies[0].x=250;assert.equal(x.scoreContext().danger,true);assert.equal(x.scoreContext().combat,true);
   w.enemies=[];st.active.elapsed=1;assert.equal(x.scoreContext().recovery,true);st.active.elapsed=6;assert.equal(x.scoreContext().recovery,false);
   A.start(st,'prison',{});assert.equal(x.scoreContext().moment,null);st.active.step=4;assert.equal(x.scoreContext().moment,'escape-corridor');
 });
 console.log(JSON.stringify({suite:'field-score',checks}));
})().catch(e=>{console.error(e);process.exitCode=1;});
