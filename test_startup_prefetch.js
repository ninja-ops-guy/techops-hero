"use strict";
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('production_bootstrap.js','utf8');

// Deterministic network model, not a physical-device performance measurement.
// Link hints fetch bytes only; the actual production loader issues scripts.
async function run({hints=true,failHint=false,failScript=null}={}){
  let time=0,maxHints=0,installs=0;
  const queue=[],children=[],network=new Map(),executed=[],events=[];
  const r={console,Promise,v736:{start(){}},v737:{},setTimeout:fn=>queue.push({at:time,fn}),
    setInterval(){installs++;return installs;},clearInterval(){},
    TechOpsGoodDogsActorContract:{enforce(){events.push('actor');}},
    TechOpsProductionWrapperGuard:{enforce(){events.push('freeze');}}};
  function request(url){if(!network.has(url))network.set(url,{start:time,end:time+200});return network.get(url);}
  const head={appendChild(node){node.parentNode=head;children.push(node);
    if(node.tag==='link'){
      assert.equal(node.rel,'preload');assert.equal(node.as,'script');
      maxHints=Math.max(maxHints,children.filter(n=>n.tag==='link').length);
      if(!failHint)request(node.href);
      return node;
    }
    assert.equal(node.async,false,'script order remains owned by the serial loader');
    const req=request(node.src),file=node.dataset.productionBootstrap;
    queue.push({at:Math.max(time,req.end),fn(){
      if(file===failScript){node.onerror();return;}
      executed.push(file);events.push(file);
      // Simulate maintenance registration under the real deferral boundary.
      if(file==='good_dogs_production_runtime.js')r.setInterval(()=>{},100);
      node.onload();
    }});return node;
  },removeChild(node){children.splice(children.indexOf(node),1);node.parentNode=null;}};
  r.document={head,createElement(tag){if(tag==='link'&&!hints)throw Error('preload unsupported');return {tag,dataset:{}};},
    querySelector(selector){const file=selector.match(/data-production-bootstrap="([^"]+)"/)[1];return children.find(n=>n.tag==='script'&&n.dataset.productionBootstrap===file)||null;}};
  r.globalThis=r;vm.createContext(r);vm.runInContext(source,r);
  for(let i=0;i<200&&!r.TechOpsProductionBootstrap.ready();i++){
    await new Promise(resolve=>setImmediate(resolve));
    queue.sort((a,b)=>a.at-b.at);const task=queue.shift();if(task){time=task.at;task.fn();}
  }
  assert.equal(r.TechOpsProductionBootstrap.ready(),true);
  const files=Array.from(r.TechOpsProductionBootstrap.FILES);
  assert.deepEqual(executed,files.filter(f=>f!==failScript),'fetch completion cannot reorder or duplicate execution');
  assert.equal(network.size,files.length,'identical versioned URLs reuse hinted bytes');
  assert.ok(maxHints<=5,'at most four future scripts plus the consuming hint');
  assert.equal(children.filter(n=>n.tag==='link').length,0,'temporary preload nodes retire');
  assert.equal(installs,0,'maintenance timers remain parked under the original owner');
  assert.equal(r.__productionTimersDeferred,false);
  assert.equal(events[events.indexOf('good_dogs_actor_contract.js')+1],'actor');
  assert.equal(events[events.indexOf('production_wrapper_guard.js')+1],'freeze');
  await r.TechOpsProductionBootstrap.start();
  assert.equal(executed.length,files.length-(failScript?1:0),'repeated start is idempotent');
  if(failScript)assert.equal(r.__productionBootstrapError,failScript,'script failures retain existing error reporting');
  return {time,maxHints,files:files.length};
}
(async()=>{
  const serial=await run({hints:false}),prefetched=await run();
  assert.ok(prefetched.time<serial.time/2,'bounded lookahead removes the serial network waterfall');
  const ignored=await run({failHint:true});assert.equal(ignored.time,serial.time,'ignored hints retain baseline fallback');
  await run({failScript:'night_combat.js'});
  console.log('Startup prefetch: ordering, bounded hints, fallback, errors, timers, cleanup and idempotency PASS');
  console.log(JSON.stringify({evidence:'simulated-200ms-per-script-network',serial,prefetched}));
})().catch(error=>{console.error(error);process.exitCode=1;});
