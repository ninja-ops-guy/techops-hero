'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(process.env.ARENA_CLIENT_PATH||require.resolve('./advanced-client.js'),'utf8');

// Run the real client against browser event/API boundaries; assert requests and visible UI,
// never inspect its private control/session variables. This is not a physical-browser test.
function browser(){
 const events={},docEvents={},requests=[],timeouts=new Map(),queued=[];
 let interval,nextTimer=0,clears=0,now=1000;
 const ctx=new Proxy({}, {get:(_,key)=>key==='clearRect'?()=>clears++:()=>{}});
 const elements={};
 for(const id of ['arena','character','code','create','join','leave','ready','lobby','status','health'])elements['#'+id]={textContent:'',hidden:false,value:'',tagName:'BUTTON',getContext:()=>ctx};
 elements['#character'].value='mike';elements['#code'].value='ABCD1234';
 const buttons=Object.fromEntries(['left','right','jump','light','heavy','block','dash','up','down'].map(key=>[key,{dataset:{key},tagName:'BUTTON',setPointerCapture(){}}]));
 const state={phase:'fight',players:[{character:'mike',hp:100,focus:0,x:300,y:360,face:1},{character:'k',hp:100,focus:0,x:660,y:360,face:-1}],scores:[0,0],round:1,roundTicks:5400};
 const reply=(status,body)=>({ok:status>=200&&status<300,status,json:async()=>body});
 const context={ArenaAdvancedInput:require('./advanced-input.js'),ArenaAdvancedMoves:require('./advanced-moves.js'),Date:{now:()=>now},document:{querySelector:s=>elements[s],querySelectorAll:()=>Object.values(buttons),addEventListener:(n,f)=>docEvents[n]=f},window:{addEventListener:(n,f)=>events[n]=f},AbortController,setInterval:f=>{interval=f;},setTimeout:(f,ms)=>{timeouts.set(++nextTimer,{f,ms});return nextTimer;},clearTimeout:id=>timeouts.delete(id),fetch:async(_url,options)=>{
  const request=JSON.parse(options.body);requests.push(request);
  if(queued.length)return queued.shift()(request,options,reply);
  return reply(200,['create','join'].includes(request.action)?{token:'seat-token',slot:0,code:'ABCD1234'}:{protocol:2,rulesetId:'arena-directional-v2',code:'ABCD1234',slot:0,waiting:false,ready:0,state});
 }};
 vm.runInNewContext(source,context,{filename:'arena/client.js'});
 return {elements,buttons,requests,timeouts,state,queue:fn=>queued.push(fn),tick:(advance=3000)=>{now+=advance;return interval();},create:async(prime=true)=>{await elements['#create'].onclick();if(prime)await interval();},leave:()=>elements['#leave'].onclick(),ready:()=>elements['#ready'].onclick(),clearCount:()=>clears,
 key:(type,key,code,target,repeat=false)=>{const event={key,code,target,repeat,defaultPrevented:false,preventDefault(){this.defaultPrevented=true;}};events[type](event);return event;},
 pointer:(type,action,pointerId)=>buttons[action]['onpointer'+type]({pointerId,preventDefault(){}}),
 blur:()=>events.blur(),hide:()=>docEvents.visibilitychange(),
 last:()=>requests.filter(r=>r.action==='input').at(-1)
 };
}

test('two short taps preserve both press and release transitions in one HTTP batch',async()=>{
 const b=browser();await b.create();await b.tick();
 for(let i=0;i<2;i++){b.key('keydown','e','KeyE');b.key('keyup','e','KeyE');}
 await b.tick();assert.deepEqual(b.last().transitions,[8,0,8,0]);assert.equal(b.last().buttons,0);assert.equal(b.last().protocol,2);assert.equal(b.last().round,1);
 await b.tick();assert.deepEqual(b.last().transitions,[]);
});
test('independent key aliases and pointers preserve held ownership plus directional aim',async()=>{
 const b=browser();await b.create();await b.tick();b.key('keydown','a','KeyA');b.key('keydown','ArrowLeft','ArrowLeft');b.pointer('down','up',1);await b.tick();assert.equal(b.last().buttons,129);
 b.key('keyup','a','KeyA');await b.tick();assert.equal(b.last().buttons,129);
 b.key('keyup','ArrowLeft','ArrowLeft');b.pointer('down','light',2);b.pointer('up','light',2);b.pointer('cancel','up',1);await b.tick();assert.deepEqual(b.last().transitions,[128,136,128,0]);
});
test('blur drops unsent actions and repeated keydown never rearms them',async()=>{
 const b=browser();await b.create();b.key('keydown','e','KeyE');b.blur();b.key('keydown','e','KeyE',null,true);await b.tick();assert.deepEqual(b.last().transitions,[0]);assert.equal(b.last().buttons,0);
});
test('countdown inputs cannot prebuffer an opening strike and rounds reset local intent',async()=>{
 const b=browser();b.state.phase='countdown';b.state.remaining=180;await b.create();b.key('keydown','e','KeyE');await b.tick();assert.equal(b.requests.at(-1).action,'poll');
 b.state.phase='fight';await b.tick();await b.tick();assert.deepEqual(b.last().transitions,[0]);b.key('keydown','e','KeyE');await b.tick();const seq=b.last().seq;
 b.state.round=2;b.state.phase='countdown';await b.tick();b.state.phase='fight';await b.tick();await b.tick();assert.equal(b.last().round,2);assert.ok(b.last().seq>seq);assert.equal(b.last().buttons,0);
});
test('network loss clears queued actions and resumes the same seat with neutral input',async()=>{
 const b=browser();await b.create();b.key('keydown','e','KeyE');b.queue(()=>{throw Error('offline');});await b.tick();await b.tick();await b.tick();assert.equal(b.last().token,'seat-token');assert.equal(b.last().buttons,0);assert.deepEqual(b.last().transitions,[0]);
});
test('assistive clicks produce edges and the client bounds and splits transition batches',async()=>{
 const b=browser();await b.create();await b.tick();b.buttons.heavy.onclick({detail:0});await b.tick();assert.deepEqual(b.last().transitions,[16,0]);
 for(let i=0;i<10;i++){b.key('keydown','e','KeyE');b.key('keyup','e','KeyE');}await b.tick();assert.equal(b.last().transitions.length,16);await b.tick();assert.equal(b.last().transitions.length,4);
 for(let i=0;i<40;i++){b.key('keydown','e','KeyE');b.key('keyup','e','KeyE');}await b.tick();assert.ok(b.last().transitions.length<=16);assert.equal(b.last().buttons,0);
});
