'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(process.env.ARENA_CLIENT_PATH||require.resolve('./client.js'),'utf8');

// Run the real client against browser event/API boundaries; assert requests and visible UI,
// never inspect its private control/session variables. This is not a physical-browser test.
function browser(){
 const events={},docEvents={},requests=[],timeouts=new Map(),queued=[];
 let interval,nextTimer=0,clears=0,now=1000;
 const ctx=new Proxy({}, {get:(_,key)=>key==='clearRect'?()=>clears++:()=>{}});
 const elements={};
 for(const id of ['arena','character','code','create','join','leave','ready','lobby','status','health'])elements['#'+id]={textContent:'',hidden:false,value:'',tagName:'BUTTON',getContext:()=>ctx};
 elements['#character'].value='mike';elements['#code'].value='ABCD1234';
 const buttons=Object.fromEntries(['left','right','jump','punch','kick','block','dash'].map(key=>[key,{dataset:{key},tagName:'BUTTON',setPointerCapture(){}}]));
 const state={phase:'fight',players:[{character:'mike',hp:100,focus:0,x:300,y:360,face:1},{character:'k',hp:100,focus:0,x:660,y:360,face:-1}],scores:[0,0],round:1,roundTicks:5400};
 const reply=(status,body)=>({ok:status>=200&&status<300,status,json:async()=>body});
 const context={Date:{now:()=>now},document:{querySelector:s=>elements[s],querySelectorAll:()=>Object.values(buttons),addEventListener:(n,f)=>docEvents[n]=f},window:{addEventListener:(n,f)=>events[n]=f},AbortController,setInterval:f=>{interval=f;},setTimeout:(f,ms)=>{timeouts.set(++nextTimer,{f,ms});return nextTimer;},clearTimeout:id=>timeouts.delete(id),fetch:async(_url,options)=>{
  const request=JSON.parse(options.body);requests.push(request);
  if(queued.length)return queued.shift()(request,options,reply);
  return reply(200,['create','join'].includes(request.action)?{token:'seat-token',slot:0,code:'ABCD1234'}:{code:'ABCD1234',slot:0,waiting:false,ready:0,state});
 }};
 vm.runInNewContext(source,context,{filename:'arena/client.js'});
 return {elements,buttons,requests,timeouts,state,queue:fn=>queued.push(fn),tick:(advance=3000)=>{now+=advance;return interval();},create:async(prime=true)=>{await elements['#create'].onclick();if(prime)await interval();},leave:()=>elements['#leave'].onclick(),ready:()=>elements['#ready'].onclick(),clearCount:()=>clears,
 key:(type,key,code,target,repeat=false)=>{const event={key,code,target,repeat,defaultPrevented:false,preventDefault(){this.defaultPrevented=true;}};events[type](event);return event;},
 pointer:(type,action,pointerId)=>buttons[action]['onpointer'+type]({pointerId,preventDefault(){}}),
 blur:()=>events.blur(),hide:()=>docEvents.visibilitychange(),
 last:()=>requests.filter(r=>r.action==='input').at(-1)
 };
}

test('Shift combinations and release order preserve movement and attacks',async()=>{
 const b=browser();await b.create();b.key('keydown','Shift','ShiftLeft');b.key('keydown','D','KeyD');b.key('keydown','E','KeyE');await b.tick();
 assert.deepEqual(b.last().keys,{dash:true,right:true,punch:true});
 b.key('keyup','Shift','ShiftLeft');b.key('keyup','d','KeyD');b.key('keyup','e','KeyE');await b.tick();assert.deepEqual(b.last().keys,{});
});

test('keyboard aliases, pointers and multiple contacts retain independent held ownership',async()=>{
 const b=browser();await b.create();b.key('keydown','a','KeyA');b.key('keydown','ArrowLeft','ArrowLeft');b.pointer('down','left',1);b.pointer('down','left',2);await b.tick();
 b.key('keyup','a','KeyA');b.pointer('up','left',1);await b.tick();assert.equal(b.last().keys.left,true);
 b.key('keyup','ArrowLeft','ArrowLeft');await b.tick();assert.equal(b.last().keys.left,true);
 b.pointer('cancel','left',2);await b.tick();assert.deepEqual(b.last().keys,{});
 b.pointer('down','right',3);b.pointer('down','punch',4);await b.tick();assert.deepEqual(b.last().keys,{right:true,punch:true});
 b.pointer('cancel','punch',4);await b.tick();assert.deepEqual(b.last().keys,{right:true});
});

test('pre-room taps never leak into a session; a short in-session tap is sent once',async()=>{
 const b=browser();b.pointer('down','punch',1);b.pointer('up','punch',1);await b.create();await b.tick();assert.deepEqual(b.last().keys,{});
 b.pointer('down','punch',2);b.pointer('up','punch',2);await b.tick();assert.equal(b.last().keys.punch,true);await b.tick();assert.deepEqual(b.last().keys,{});
});

test('blur and visibility transitions release every source and pending tap without repeat rearming',async()=>{
 for(const clear of ['blur','hide']){
  const b=browser();await b.create();b.key('keydown','d','KeyD');b.pointer('down','punch',1);b[clear]();b.key('keydown','d','KeyD',null,true);await b.tick();assert.deepEqual(b.last().keys,{});
 }
});

test('focused pad buttons and assistive clicks activate their named action; ready keeps native activation',async()=>{
 const b=browser();await b.create();b.key('keydown',' ','Space',b.buttons.punch);await b.tick();assert.deepEqual(b.last().keys,{punch:true});b.key('keyup',' ','Space',b.buttons.punch);
 b.buttons.kick.onclick({detail:0});await b.tick();assert.deepEqual(b.last().keys,{kick:true});await b.tick();assert.deepEqual(b.last().keys,{});
 b.key('keydown',' ','Space',b.elements['#ready']);await b.tick();assert.deepEqual(b.last().keys,{});
});

test('transient network, stale-input, capacity and service errors retain the seat with released controls',async()=>{
 for(const status of [null,409,429,503]){
  const b=browser();await b.create();b.key('keydown','d','KeyD');b.queue((_r,_o,reply)=>{if(status===null)throw Error('offline');return reply(status,{error:'Retry later'});});await b.tick();
  assert.equal(b.elements['#lobby'].hidden,true);const failedCount=b.requests.length;await b.tick(0);assert.equal(b.requests.length,failedCount);await b.tick();assert.equal(b.requests.at(-1).action,'poll');await b.tick();assert.equal(b.last().token,'seat-token');assert.equal(b.last().seq,1);assert.deepEqual(b.last().keys,{});
 }
});

test('an unresponsive request times out within five seconds and the next tick retries the same seat',async()=>{
 const b=browser();await b.create();b.key('keydown','e','KeyE');b.queue((_r,options)=>new Promise((_resolve,reject)=>options.signal.addEventListener('abort',()=>reject(Error('aborted')))));
 const request=b.tick();const deadline=[...b.timeouts.values()][0];assert.ok(deadline,'input request has a deadline');assert.ok(deadline.ms<=5000);deadline.f();await request;
 assert.match(b.elements['#status'].textContent,/timed out/);assert.equal(b.elements['#lobby'].hidden,true);assert.equal(b.timeouts.size,0);await b.tick();await b.tick();assert.deepEqual(b.last().keys,{});assert.equal(b.last().token,'seat-token');
});

test('confirmed authentication loss clears the arena and returns to lobby without retrying old credentials',async()=>{
 const b=browser();await b.create();await b.tick();assert.match(b.elements['#health'].textContent,/100 HP/);const before=b.clearCount();
 b.queue((_r,_o,reply)=>reply(401,{error:'Session expired'}));await b.tick();assert.equal(b.elements['#lobby'].hidden,false);assert.equal(b.elements['#health'].textContent,'');assert.ok(b.clearCount()>before);
 assert.match(b.elements['#status'].textContent,/Session expired/);const count=b.requests.length;await b.tick();assert.equal(b.requests.length,count);
});

test('explicit leave clears old health and late snapshots cannot repaint the departed match',async()=>{
 const b=browser();await b.create();await b.tick();let complete;
 b.queue((_r,_o,reply)=>new Promise(resolve=>complete=()=>resolve(reply(200,{code:'OLD',slot:0,waiting:true,state:null}))));const pending=b.tick();await b.leave();
 assert.equal(b.elements['#health'].textContent,'');assert.equal(b.elements['#lobby'].hidden,false);complete();await pending;assert.match(b.elements['#status'].textContent,/Left room/);
});

test('ready errors obey the same seat-retention and authentication rules',async()=>{
 const b=browser();await b.create();b.key('keydown','a','KeyA');b.queue((_r,_o,reply)=>reply(429,{error:'Retry later'}));await b.ready();await b.tick();await b.tick();assert.deepEqual(b.last().keys,{});assert.equal(b.elements['#lobby'].hidden,true);
 b.queue((_r,_o,reply)=>reply(401,{error:'Session expired'}));await b.ready();assert.equal(b.elements['#lobby'].hidden,false);
});


test('waiting and round results poll while active phases send controls; stale state recovers through poll',async()=>{
 const b=browser();await b.create(false);
 b.queue((_r,_o,reply)=>reply(200,{code:'ABCD1234',slot:0,waiting:true,ready:0,state:null}));await b.tick();assert.equal(b.requests.at(-1).action,'poll');assert.match(b.elements['#status'].textContent,/Waiting/);
 b.key('keydown','d','KeyD');b.state.phase='countdown';b.state.remaining=180;await b.tick();assert.equal(b.requests.at(-1).action,'poll');assert.match(b.elements['#status'].textContent,/Starts in/);
 b.state.phase='fight';await b.tick();assert.equal(b.last().action,'input');assert.deepEqual(b.last().keys,{});
 b.state.phase='round-over';b.state.winner=0;await b.tick();assert.equal(b.elements['#ready'].hidden,false);await b.tick();assert.equal(b.requests.at(-1).action,'poll');
 b.state.phase='fight';await b.tick();b.queue((_r,_o,reply)=>reply(409,{error:'Match not playing'}));await b.tick();await b.tick();assert.equal(b.requests.at(-1).action,'poll');assert.equal(b.elements['#lobby'].hidden,true);
 b.state.phase='disconnected';b.state.outcome={reason:'timeout',winner:0};await b.tick();await b.tick();assert.equal(b.requests.at(-1).action,'poll');assert.match(b.elements['#status'].textContent,/timeout.*Player 1 wins/);
});


test('held navigation repeats prevent scrolling without rearming released controls',async()=>{
 for(const [key,code] of [['ArrowLeft','ArrowLeft'],['ArrowRight','ArrowRight'],[' ','Space']]){
  const b=browser();await b.create();b.key('keydown',key,code);assert.equal(b.key('keydown',key,code,null,true).defaultPrevented,true);await b.tick();
  b.blur();assert.equal(b.key('keydown',key,code,null,true).defaultPrevented,true);await b.tick();assert.deepEqual(b.last().keys,{});
  b.key('keyup',key,code);b.key('keydown',key,code);b.queue(()=>{throw Error('offline');});await b.tick();await b.tick();
  assert.equal(b.key('keydown',key,code,null,true).defaultPrevented,true);await b.tick();assert.deepEqual(b.last().keys,{});
 }
 const b=browser();await b.create();assert.equal(b.key('keydown',' ','Space',b.buttons.punch,true).defaultPrevented,true);await b.tick();assert.deepEqual(b.last().keys,{});
 assert.equal(b.key('keydown',' ','Space',b.elements['#ready'],true).defaultPrevented,false);
});


test('terminal copy names the session outcome without assuming which peer disconnected',async()=>{
 for(const [winner,matchComplete,expected] of [[0,false,'Player 1 wins'],[1,false,'Player 2 wins'],[null,false,'No winner'],[0,true,'Recorded match result · Player 1 wins']]){
  const b=browser();await b.create();b.state.phase='disconnected';b.state.winner=winner;b.state.outcome={reason:'timeout',winner,matchComplete};await b.tick();
  const status=b.elements['#status'].textContent;assert.match(status,/Session ended \(timeout\)/);assert.ok(status.includes(expected));assert.doesNotMatch(status,/Opponent disconnected/);
 }
});
