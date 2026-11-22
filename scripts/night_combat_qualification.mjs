// Harness-only lifecycle checks. Never changes gameplay state or synthesizes input.
export class NightCleanupTimeout extends Error {
 constructor(operation,timeoutMs){super(`${operation} did not settle within ${timeoutMs}ms`);this.name='NightCleanupTimeout';}
}
export async function boundedNightCleanup(run,operation,timeoutMs=10000){
 let timer;
 try{
  return await Promise.race([
   Promise.resolve().then(run),
   new Promise((_,reject)=>{timer=setTimeout(()=>reject(new NightCleanupTimeout(operation,timeoutMs)),timeoutMs);})
  ]);
 }finally{clearTimeout(timer);}
}

// Serialized by Playwright into the page; keep this function self-contained.
export function nightStreetReady(){
 const dialog=document.querySelector('#dialogue'),more=document.querySelector('#night-input-assists');
 return !!(dialog?.classList.contains('hidden')&&window.TechOpsNightInput?.ready()&&
  more&&!more.hidden&&!more.disabled&&more.getClientRects().length);
}
