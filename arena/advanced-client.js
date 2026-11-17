'use strict';
const $=s=>document.querySelector(s),canvas=$('#arena'),ctx=canvas.getContext('2d');
const REQUEST_TIMEOUT_MS=5000;
let session=null,seq=0,busy=false,matchPhase=null,retryAfter=0,failures=0;
const keyboard=new Map(),pointers=new Map();
const RULESET='arena-directional-v2';
let transitions=[],lastQueued=0,lastSent=0,currentRound=null;
function recordControls(){const held={};for(const action of [...keyboard.values(),...pointers.values()])held[action]=true;
 const bits=ArenaAdvancedInput.KEYS.reduce((n,k)=>n|(held[k]?ArenaAdvancedInput.BUTTONS[k]:0),0);
 if(bits!==lastQueued){if(transitions.length>=32){keyboard.clear();pointers.clear();transitions=[0];lastQueued=0;text('#status','Input queue full. Controls released.');return;}transitions.push(bits);lastQueued=bits;}
}
function tap(action){const bit=ArenaAdvancedInput.BUTTONS[action];if(lastQueued&bit)return;transitions.push(lastQueued|bit,lastQueued);if(transitions.length>32){clearControls();}}
const mapping={a:'left',ArrowLeft:'left',d:'right',ArrowRight:'right',' ':'jump',e:'light',j:'heavy',w:'up',ArrowUp:'up',s:'down',ArrowDown:'down',q:'block',Shift:'dash'};
function playing(){return matchPhase==='fight';}
function clearControls(){keyboard.clear();pointers.clear();transitions=[0];lastQueued=0;lastSent=0;}
function text(selector,value){if($(selector).textContent!==value)$(selector).textContent=value;}
async function api(data){
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),REQUEST_TIMEOUT_MS);
 try{
  const response=await fetch('/api',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),signal:controller.signal});
  const body=await response.json();
  if(!response.ok){const error=Error(body.error||`Request failed (${response.status})`);error.status=response.status;throw error;}
  return body;
 }catch(error){if(controller.signal.aborted)throw Error('Connection timed out. Retrying with controls released.');throw error;}
 finally{clearTimeout(timeout);}
}
function reset(){session=null;matchPhase=null;retryAfter=0;failures=0;clearControls();$('#lobby').hidden=false;$('#leave').hidden=true;$('#ready').hidden=true;text('#health','');draw(null);}
function failed(error,current){
 if(current!==session)return;
 clearControls();
 // Only a confirmed invalid/expired token ends a local seat. A failed poll is not a disconnect protocol.
 if(error.status===401)reset();
 else{matchPhase=null;retryAfter=Date.now()+Math.min(2000,250*2**Math.min(failures++,3));}
 text('#status',error.status?error.message:(error.message==='Connection timed out. Retrying with controls released.'?error.message:'Connection interrupted. Retrying with controls released.'));
}
for(const action of ['create','join'])$('#'+action).onclick=async()=>{
 if(busy)return;busy=true;clearControls();
 try{
  session=await api({action,protocol:2,rulesetId:RULESET,character:$('#character').value,code:$('#code').value.trim().toUpperCase()});
  seq=0;matchPhase=null;retryAfter=0;failures=0;clearControls();text('#health','');draw(null);$('#lobby').hidden=true;$('#leave').hidden=false;
  text('#status',`Room ${session.code} · You are player ${session.slot+1} · Connecting…`);
 }catch(error){text('#status',error.message);}finally{busy=false;}
};
$('#leave').onclick=async()=>{
 const old=session;reset();text('#status','Left room. Campaign progress unchanged.');
 if(old)await api({action:'leave',token:old.token}).catch(()=>{});
};
$('#ready').onclick=()=>{
 const current=session;
 if(current)return api({action:'ready',token:current.token}).catch(error=>failed(error,current));
};
function keyName(event){return event.key.length===1?event.key.toLowerCase():event.key;}
function keySource(event){return event.code||keyName(event);}
window.addEventListener('keydown',event=>{
 if(!session||!playing())return;
 const key=keyName(event),target=event.target;
 const buttonAction=target?.dataset?.key;
 const action=buttonAction&&[' ','Enter'].includes(key)?buttonAction:mapping[key];
 // Keep native form/button activation and text entry available outside the control pad.
 if(!action||(!buttonAction&&(target?.isContentEditable||['INPUT','SELECT','TEXTAREA','BUTTON'].includes(target?.tagName))))return;
 event.preventDefault();
 // Repeats must not scroll the page or rearm controls released on blur/failure.
 if(event.repeat)return;
 keyboard.set(keySource(event),action);recordControls();
});
window.addEventListener('keyup',event=>{keyboard.delete(keySource(event));recordControls();});
window.addEventListener('blur',clearControls);
document.addEventListener('visibilitychange',clearControls);
for(const button of document.querySelectorAll('[data-key]')){
 button.onpointerdown=event=>{
  if(!session||!playing())return;
  event.preventDefault();button.setPointerCapture(event.pointerId);pointers.set(event.pointerId,button.dataset.key);recordControls();
 };
 button.onpointerup=button.onpointercancel=button.onlostpointercapture=event=>{pointers.delete(event.pointerId);recordControls();};
 // Assistive technology can activate a button without pointer events.
 button.onclick=event=>{if(session&&playing()&&event.detail===0)tap(button.dataset.key);};
}
function draw(s){ctx.clearRect(0,0,960,420);ctx.fillStyle='#34475a';ctx.fillRect(0,360,960,60);if(!s)return;for(const [i,p]of s.players.entries()){ctx.fillStyle=i?'#ffbe86':'#79dfdb';ctx.fillRect(p.x-15,p.y-48,30,48);if(p.attack){const move=ArenaAdvancedMoves.MOVES[p.attack.moveId];ctx.strokeStyle=p.attack.contactDone?'#f9a':'#fff';ctx.strokeRect(p.x+(p.attack.face>0?0:-move.reach),p.y-38,move.reach,25);ctx.fillText(p.attack.moveId,p.x-30,p.y-65);}ctx.font='16px system-ui';ctx.fillText(`${i+1}: ${p.character.toUpperCase()} · HP ${p.hp} · Focus ${p.focus}`,i?550:25,30);ctx.fillStyle='#fff';ctx.fillRect(p.x+p.face*8-2,p.y-38,4,4);}ctx.fillStyle='#fff';ctx.textAlign='center';ctx.fillText(`${s.scores[0]} — ${s.scores[1]} · Round ${s.round} · ${Math.ceil(s.roundTicks/60)}s`,480,62);ctx.textAlign='left';}
setInterval(async()=>{
 if(!session||busy||Date.now()<retryAfter)return;busy=true;const current=session;
 try{
  const batch=playing()?transitions.splice(0,16):[];if(batch.length)lastSent=batch.at(-1);
  const request=playing()?{action:'input',token:current.token,seq:seq++,protocol:2,rulesetId:RULESET,round:currentRound,transitions:batch,buttons:lastSent}:{action:'poll',token:current.token};
  const r=await api(request);
  if(current!==session)return;
  if(r.protocol!==2||r.rulesetId!==RULESET)throw Error('Arena protocol mismatch');
  retryAfter=0;failures=0;matchPhase=r.state?.phase||null;
  if(currentRound!==r.state?.round){currentRound=r.state?.round||null;clearControls();}
  if(!playing())clearControls();
  draw(r.state);
  text('#health',r.state?r.state.players.map((p,i)=>`P${i+1} ${p.character.toUpperCase()}: ${p.hp} HP`).join(' · '):'');
  const phase=r.state?.phase;
  text('#status',`Room ${r.code} · You are player ${r.slot+1} · `+(r.waiting?'Waiting for player 2':phase==='countdown'?`Starts in ${Math.ceil(r.state.remaining/60)}`:phase==='fight'?'Fight!':phase==='disconnected'?`Session ended${r.state.outcome?` (${r.state.outcome.reason}) · ${r.state.outcome.matchComplete?'Recorded match result · ':''}${r.state.winner===null?'No winner':`Player ${r.state.winner+1} wins`}`:''}. Leave and create a new room.`:`${phase==='finished'?'Match finished':'Round over'} · ${r.state.winner===null?'Draw':`Player ${r.state.winner+1} wins`} · ${r.ready}/2 ready`));
  $('#ready').hidden=!['round-over','finished'].includes(phase);
 }catch(error){failed(error,current);}finally{busy=false;}
},33);
draw(null);
