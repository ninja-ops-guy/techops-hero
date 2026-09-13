import {createLevel,objective} from './level.mjs?v=20260913-reference-r2';
import {movementInput} from './camera.mjs?v=20260913-reference-r2';
import {createSession} from './session.mjs';
const $=id=>document.getElementById(id),STORE='techops.gooddogs.m5.review.v1';
let session=createSession(),level,held=new Set(),pointers=new Map(),ready=false,started=false,saved=null,last=0,saveAt=0,captionUntil=0,soundOn=true,audio;
try{saved=JSON.parse(localStorage.getItem(STORE)||'null');}catch{}
function say(text,ms=2500){$('caption').textContent=text;captionUntil=performance.now()+ms;}
function save(){try{localStorage.setItem(STORE,JSON.stringify(session.snapshot()));return true;}catch{say('Checkpoint could not be saved on this device.',5000);return false;}}
function sound(type){if(!soundOn)return;try{audio=audio||new (window.AudioContext||window.webkitAudioContext)();audio.resume();const osc=audio.createOscillator(),gain=audio.createGain();osc.connect(gain);gain.connect(audio.destination);const t=audio.currentTime;osc.type=type==='hit'?'triangle':'sine';osc.frequency.setValueAtTime(({hit:120,hurt:70,block:250,node:620,jump:360,complete:840,warning:520})[type]||160,t);osc.frequency.exponentialRampToValueAtTime(type==='node'?1000:70,t+.12);gain.gain.setValueAtTime(.035,t);gain.gain.exponentialRampToValueAtTime(.001,t+.16);osc.start(t);osc.stop(t+.17);}catch{}}
function clear(){held.clear();pointers.clear();document.querySelectorAll('.held').forEach(b=>b.classList.remove('held'));}
function overlay(title,brief,button){$('title').textContent=title;$('brief').textContent=brief;$('begin').textContent=button;$('overlay').hidden=false;$('restart').hidden=!started;clear();}
function resume(){if(!ready)return;if(session.complete||S.gameOver){restart();return;}started=true;session.setPause(false);$('overlay').hidden=true;document.activeElement?.blur();$('pause').textContent='PAUSE';save();sound('node');}
function restart(){clear();session=createSession();TechOpsGoodBoysAccessCoreAuthority.tick();session.setPause(true);saved=null;save();resume();}
function pause(){if(!started||session.complete||S.gameOver)return;session.setPause(true);save();overlay('ESCORT PAUSED','K and the dogs will wait here.','RESUME ESCORT');}
function act(name,player=1){if(!ready||!started||session.paused)return;if(name==='use'&&!session.action('use',player)){say(Math.abs(NM.x-1070)>120?'Reach the Access Node after breaking the Index and clearing security.':'The Access Node is locked until the Index and security are cleared.');return;}else if(name!=='use')session.action(name,player);}
$('begin').onclick=resume;$('restart').onclick=restart;$('pause').onclick=pause;
$('coop').onclick=()=>{session.setCoop(!session.localCoop);$('coop').textContent=session.localCoop?'LOCAL CO-OP · P1 / P2':'SOLO + PARTNER AI';say(session.localCoop?'P2: I/K move · T jump · R strike':'Partner AI is following.');save();};
let mode=0;$('camera').onclick=()=>{$('caption').textContent='';captionUntil=0;mode=(mode+1)%4;const view=['third','retro','first','crew'][mode];clear();level?.setView(view);document.querySelector('[data-hold=back]').textContent=view==='retro'?'◀':'▼';document.querySelector('[data-hold=forward]').textContent=view==='retro'?'▶':'▲';$('camera').textContent=['DOG CAMERA','RETRO SIDE VIEW','K OBSERVATION VIEW','CREW CLOSE-UP'][mode];document.body.classList.toggle('retro',view==='retro');if(view==='first')say('K’s observation camera. You still control the dogs.');};
$('sound').onclick=()=>{soundOn=!soundOn;$('sound').textContent=soundOn?'SOUND ON':'SOUND OFF';$('sound').setAttribute('aria-pressed',String(soundOn));};
const keys={KeyF:'attack',Space:'jump',ShiftLeft:'dash',ShiftRight:'dash',KeyQ:'swap',KeyE:'use'};
const movement=['KeyW','KeyS','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyA','KeyD','KeyB','KeyI','KeyK'];
addEventListener('keydown',e=>{if(e.target.matches('button,input,textarea')&&['Space','Enter'].includes(e.code))return;if(e.code==='Escape'){e.preventDefault();if(session.paused&&started)resume();else pause();return;}if(!started||session.paused)return;if(movement.includes(e.code)){e.preventDefault();held.add(e.code);}if(!e.repeat&&keys[e.code]){e.preventDefault();act(keys[e.code]);}if(session.localCoop&&!e.repeat&&['KeyR','KeyT','KeyU'].includes(e.code)){e.preventDefault();act(e.code==='KeyR'?'attack':e.code==='KeyT'?'jump':'use',2);}});
addEventListener('keyup',e=>held.delete(e.code));
for(const button of document.querySelectorAll('[data-hold],[data-action]')){
 button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);button.classList.add('held');if(button.dataset.hold)pointers.set(e.pointerId,button.dataset.hold);else act(button.dataset.action);});
 button.addEventListener('click',e=>{if(e.detail===0&&button.dataset.action)act(button.dataset.action);});
 const release=e=>{pointers.delete(e.pointerId);button.classList.remove('held');};button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);
}
addEventListener('blur',()=>{clear();if(started&&!session.paused)pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden){clear();if(started&&!session.paused)pause();}});addEventListener('pagehide',()=>{if(started)save();level?.dispose();});
function input(){return movementInput(held,pointers.values(),level?.view);}
function frame(now){const dt=last?Math.min(.25,(now-last)/1000):0;last=now;if(ready){
 for(let remaining=dt;remaining>0;){const step=Math.min(.05,remaining);session.tick(step,input());remaining-=step;}if(!level.draw(NM,innerWidth,innerHeight,now)){session.setPause(true);overlay('3D CONTEXT LOST','Reload this level to restore your review checkpoint.','RELOAD');$('begin').onclick=()=>location.reload();}
 $('objective').textContent=objective(NM);$('active').textContent=session.c.active.toUpperCase();$('health').value=session.c.chars[session.c.active].hp;$('partner-health').textContent='PARTNER '+session.c.chars[session.c.active==='katrin'?'manchez':'katrin'].hp;$('sync').textContent='SYNC '+session.c.sync+'%';
 const target=NM.enemies.find(e=>e.alive!==false&&e.hp>0);$('enemy').hidden=!target;if(target){$('enemy-name').textContent=target.kind==='mikeindex'?'THE MIKE INDEX / RECORDED BEHAVIOR':'ROUTE SECURITY';$('enemy-health').max=target.maxHp;$('enemy-health').value=target.hp;}
 for(const event of session.drainEvents()){
  sound(event.type);if(event.type==='revive')say('PARTNER REVIVED · STAY TOGETHER',2000);if(event.type==='index-defeated')say('MIKE INDEX FRACTURED · K’S ROUTE IS STILL UNDER GUARD',4200);
  if(event.type==='node'){say('ACCESS GRID SEIZED · REGROUP AT ROUTE 1984',4200);save();}
  if(event.type==='warning')say('EXPECTED ROUTE · move away from the marked position',1000);
  if(event.type==='hurt'){document.body.classList.add('hurt');setTimeout(()=>document.body.classList.remove('hurt'),140);}
  if(event.type==='down'){save();overlay('ESCORT DOWN','Retry from K’s release. Waldo is still waiting in Cell 1984.','RETRY AFTER 118');}
  if(event.type==='complete'){save();overlay('ROUTE 1984 OPEN','K and the dogs reached the next block. The next canonical beat is Waldo’s Cell 1984 release defense. This playable level ends here.','REPLAY LEVEL');}
 }
 if(started&&!session.paused&&!session.complete&&!S.gameOver&&now-saveAt>2000){saveAt=now;save();}
 if(now>captionUntil)$('caption').textContent='';
 }requestAnimationFrame(frame);}
try{
 await import('../../good_boys_access_core_authority.js');
 let graphics=matchMedia('(pointer:coarse)').matches?'balanced':'high';try{graphics=localStorage.getItem('techops.gooddogs.graphics.v1')||graphics;}catch{}
 level=await createLevel({canvas:$('game'),quality:graphics});$('quality').value=level.quality;$('quality').onchange=async()=>{const value=$('quality').value;$('quality').disabled=true;try{await level.setQuality(value);localStorage.setItem('techops.gooddogs.graphics.v1',level.quality);}catch{say('Graphics could not be changed. The current setting is still active.',5000);$('quality').value=level.quality;}finally{$('quality').disabled=false;}};level.draw(NM,innerWidth,innerHeight,performance.now());ready=true;if(saved)session.restore(saved);$('coop').textContent=session.localCoop?'LOCAL CO-OP · P1 / P2':'SOLO + PARTNER AI';session.setPause(true);$('begin').disabled=false;$('begin').textContent=saved?'CONTINUE ESCORT':'BEGIN AFTER K’S RELEASE';$('restart').hidden=!saved;
 if(saved&&!session.complete&&S.gameOver){$('title').textContent='ESCORT DOWN';$('brief').textContent='Both dogs are down. Restart this review from K’s release.';$('begin').textContent='RETRY AFTER 118';}
 if(saved?.complete){$('title').textContent='ROUTE 1984 OPEN';$('brief').textContent='This review checkpoint completed the Access Core level. Replay from K’s release.';}
 window.__goodDogs3DReview={get ready(){return ready;},get session(){return session;},get level(){return level;},get state(){return session.snapshot();}};
 requestAnimationFrame(frame);
}catch(error){$('title').textContent='LEVEL COULD NOT LOAD';$('brief').textContent=error.message+' — serve this folder over HTTP and reload.';$('begin').textContent='RELOAD';$('begin').disabled=false;$('begin').onclick=()=>location.reload();console.error(error);}
