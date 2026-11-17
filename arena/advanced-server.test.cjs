'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{createRequire}=require('node:module');
const core=require('./advanced-simulation.js'),transport=require('./advanced-transport.cjs');
const packet=(seq,transitions,buttons=transitions.at(-1),round=1)=>({protocol:2,rulesetId:core.RULESET_ID,seq,transitions,buttons,round});
function harness(){
  let clock=100000,handler,timer,replay=null,steps=0;const listeners={};
  const server={on(e,fn){listeners[e]=fn;return this;},listen(){return this;},address(){return {port:4260};},setTimeout(){return this;}};
  const filename=path.join(__dirname,'server.cjs'),real=createRequire(filename),module={exports:{}};
  vm.runInNewContext(fs.readFileSync(filename,'utf8'),{module,exports:module.exports,__dirname,__filename:filename,URL,Buffer,console,Date,require(name){
    if(name==='node:http')return {createServer(fn){handler=fn;return server;}};
    if(name==='./advanced-simulation.js')return {...core,createMatch(config){const m=core.createMatch(JSON.parse(JSON.stringify(config)));replay=core.snapshot(m);return m;},stepMatch(m,frames){
      // Re-execute the exact frames accepted by the authoritative server.
      const e=core.stepMatch(m,JSON.parse(JSON.stringify(frames))),r=core.stepMatch(replay,JSON.parse(JSON.stringify(frames)));assert.deepEqual(e,r);assert.deepEqual(m,replay);steps++;return e;
    },nextRound(m){const a=core.nextRound(m),b=core.nextRound(replay);assert.equal(a,b);return a;}};
    return real(name);
  },setInterval(fn){timer=fn;return 1;},clearInterval(){}});
  module.exports.start({advancedCombat:true,now:()=>clock});
  return {tick(n=1){for(let i=0;i<n;i++){clock+=1000/60;timer();}},elapsed(ms){clock+=ms;},steps:()=>steps,close(){listeners.close?.();},async call(data){
    let status,body;await handler({method:'POST',url:'/api',headers:{host:'127.0.0.1:4260'},socket:{remoteAddress:'127.0.0.1'},async *[Symbol.asyncIterator](){yield Buffer.from(JSON.stringify(data));}}, {writeHead(v){status=v;},end(v){body=JSON.parse(v);}});return {status,body};
  }};
}
async function pair(h){const a=await h.call({action:'create',character:'mike',protocol:2,rulesetId:core.RULESET_ID});assert.equal(a.status,200);const b=await h.call({action:'join',code:a.body.code,character:'k',protocol:2,rulesetId:core.RULESET_ID});assert.equal(b.status,200);return [a.body,b.body];}
test('transition FIFO preserves every short press/release and assigns actual server ticks',()=>{
  const c=transport.create();assert.equal(transport.accept(c,packet(0,[8,0,8,0]),1,0),null);
  const frames=[1,2,3,4].map(t=>transport.consume(c,t,1,t*17,250));assert.deepEqual(frames.map(f=>f.buttons),[8,0,8,0]);assert.deepEqual(frames.map(f=>f.tick),[1,2,3,4]);
});
test('queue/schema/version/round/reordering errors are atomic and bounded',()=>{
  const c=transport.create();transport.accept(c,packet(0,[8,0]),1,0);
  for(const data of [packet(0,[16]),{...packet(1,[16]),protocol:1},packet(1,[16],16,2),packet(1,[512]),packet(1,[8],0),packet(1,Array(17).fill(0)),packet(1,[],8)]){const before=JSON.stringify(c);assert.ok(transport.accept(c,data,1,1));assert.equal(JSON.stringify(c),before);}
  transport.accept(c,packet(1,Array(16).fill(0)),1,1);const before=JSON.stringify(c);assert.equal(transport.accept(c,packet(2,Array(16).fill(0)),1,2).status,429);assert.equal(JSON.stringify(c),before);
});
test('stale input flushes delayed presses and requires a received release before rearming',()=>{
  const c=transport.create();transport.accept(c,packet(0,[8]),1,0);assert.equal(transport.consume(c,1,1,1,250).buttons,8);
  assert.equal(transport.consume(c,2,1,251,250).buttons,0);transport.accept(c,packet(1,[8]),1,252);assert.equal(transport.consume(c,3,1,253,250).buttons,0);
  transport.accept(c,packet(2,[0,8]),1,254);assert.equal(transport.consume(c,4,1,255,250).buttons,0);assert.equal(transport.consume(c,5,1,256,250).buttons,8);
});
test('two authenticated seats execute directional contact and replay every consumed frame',async()=>{
  const h=harness();const [a,b]=await pair(h);h.tick(180);let sa=0,sb=0;
  const send=(seat,seq,transitions,buttons)=>h.call({action:'input',token:seat.token,...packet(seq,transitions,buttons)});
  assert.equal((await send(a,sa++,[2])).status,200);assert.equal((await send(b,sb++,[1])).status,200);
  for(let i=0;i<35;i++){if(i&&i%10===0){await send(a,sa++,[],2);await send(b,sb++,[],1);}h.tick();}
  await send(a,sa++,[0,8|128,0]);await send(b,sb++,[0]);h.tick(6);
  const result=await h.call({action:'poll',token:a.token});assert.equal(result.body.state.players[1].hp,80);assert.ok(result.body.state.players[1].vy<0);assert.equal(result.body.state.players[0].attack.moveId,'uppercut');
  assert.equal(h.steps(),221);assert.equal(result.body.protocol,2);
  for(const p of result.body.state.players)for(const field of ['previous','input','buffer','buttons','lastPress'])assert.equal(Object.hasOwn(p,field),false);
  assert.equal(Object.hasOwn(result.body,'events'),false,'events require a future acknowledged delivery contract');
  const forged=await send(a,sa++,[512]);assert.equal(forged.status,400);
  assert.equal((await h.call({action:'input',token:'forged',...packet(99,[8])})).status,401);
  const before=result.body.state.players[0].hp;await h.call({action:'input',token:a.token,...packet(sa++,[0]),hp:999,slot:1,x:1});h.tick();
  assert.equal((await h.call({action:'poll',token:a.token})).body.state.players[0].hp,before);
});
test('advanced mode rejects old clients and is never exposed on a non-loopback bind',async()=>{
  const h=harness();assert.equal((await h.call({action:'create',character:'mike'})).status,409);
  const {start}=require('./server.cjs');assert.throws(()=>start({advancedCombat:true,host:'0.0.0.0',allowedOrigins:['http://example.com']}),/local review/);
});
test('expired seats cannot be revived and terminal advanced states remain frozen',async()=>{
  const h=harness();const [a,b]=await pair(h);h.tick(180);h.elapsed(10001);
  const first=await h.call({action:'poll',token:a.token});assert.equal(first.body.state.phase,'disconnected');assert.equal(first.body.state.winner,null);
  h.tick(5);assert.deepEqual((await h.call({action:'poll',token:b.token})).body.state,first.body.state);
});

test('action-time expiry drops queued stale attacks before a heartbeat refresh',()=>{
 const c=transport.create();transport.accept(c,packet(0,[8,0]),1,0);
 transport.accept(c,packet(1,[],0),1,1000);assert.equal(transport.consume(c,1,1,1000,250).buttons,0);
 const held=transport.create();transport.accept(held,packet(0,[2|8]),1,0);transport.consume(held,1,1,0,250);
 transport.consume(held,2,1,251,250);transport.accept(held,packet(1,[],2|8),1,252);assert.equal(transport.consume(held,3,1,252,250).buttons,2);
 const boundary=transport.create();transport.accept(boundary,packet(0,[8,0]),1,0);transport.accept(boundary,packet(1,[],0),1,250);assert.equal(transport.consume(boundary,1,1,250,250).buttons,8);
});
test('two ready votes advance a drawn round, clear controls, and reject previous-round packets',async()=>{
 const h=harness(),[a,b]=await pair(h);h.tick(180);
 for(let left=5400;left>0;left-=400){await h.call({action:'poll',token:a.token});await h.call({action:'poll',token:b.token});h.tick(Math.min(left,400));}
 assert.equal((await h.call({action:'poll',token:a.token})).body.state.phase,'round-over');
 await h.call({action:'ready',token:a.token});assert.equal((await h.call({action:'poll',token:b.token})).body.state.round,1);
 const next=await h.call({action:'ready',token:b.token});assert.equal(next.body.state.round,2);assert.equal(next.body.state.phase,'countdown');
 assert.equal((await h.call({action:'input',token:a.token,...packet(0,[8])})).status,409);h.tick(180);
 assert.equal((await h.call({action:'input',token:a.token,...packet(0,[8,0],0,2)})).status,200);h.tick();assert.equal((await h.call({action:'poll',token:b.token})).body.state.players[0].attack.moveId,'jab');
});
