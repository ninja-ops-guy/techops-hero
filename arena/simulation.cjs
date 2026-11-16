'use strict';
// Pure fixed-step prototype. No campaign globals, storage, randomness or wall clock.
const HZ=60, DT=1/HZ, WIDTH=960, FLOOR=360;
const KEYS=['left','right','jump','punch','kick','block','dash'];
const ROSTER=['mike','k','iona','felicia'];
function fighter(character,x,face){return {character,x,y:FLOOR,vx:0,vy:0,face,hp:100,focus:0,jumps:0,cooldown:0,dashCooldown:0,stun:0,attack:null,previous:{},input:{}};}
function round(s){s.players=s.characters.map((c,i)=>fighter(c,i?650:310,i?-1:1));s.phase='countdown';s.remaining=180;s.roundTicks=90*HZ;s.winner=null;}
function create(characters=['mike','k']){const s={tick:0,characters:characters.map(c=>ROSTER.includes(c)?c:'mike'),scores:[0,0],round:1};round(s);return s;}
function input(s,slot,value){if(!s.players[slot]||!value||typeof value!=='object')return; s.players[slot].input=Object.fromEntries(KEYS.map(k=>[k,value[k]===true]));}
function step(s){s.tick++;if(s.phase==='countdown'){if(--s.remaining<=0)s.phase='fight';return s;}if(s.phase!=='fight')return s;
 const hits=[];
 for(let i=0;i<2;i++){
 const p=s.players[i],other=s.players[1-i],k=p.input,edge=n=>k[n]&&!p.previous[n];
 p.cooldown=Math.max(0,p.cooldown-1);p.dashCooldown=Math.max(0,p.dashCooldown-1);p.stun=Math.max(0,p.stun-1);
 if(!p.stun){const direction=Number(!!k.right)-Number(!!k.left);if(direction)p.face=direction;p.vx=direction*(k.block?80:240);
 if(edge('jump')&&p.jumps<2&&!p.attack){p.vy=-420;p.jumps++;}
 if(edge('dash')&&!p.dashCooldown&&!p.attack&&!k.block){p.vx=p.face*780;p.dashCooldown=36;}else if(p.dashCooldown>27)p.vx=p.face*780;
 if(!p.cooldown&&!p.attack&&!k.block&&(edge('punch')||edge('kick'))){const heavy=edge('kick');p.attack={age:0,contact:heavy?14:7,damage:heavy?18:10,reach:heavy?82:62};p.cooldown=heavy?38:23;}
 }else p.vx*=.8;
 p.x=Math.max(20,Math.min(WIDTH-20,p.x+p.vx*DT));p.vy+=1100*DT;p.y+=p.vy*DT;if(p.y>=FLOOR){p.y=FLOOR;p.vy=0;p.jumps=0;}
 if(p.attack){p.attack.age++;if(p.attack.age===p.attack.contact)hits.push({from:i,...p.attack});if(p.cooldown===0)p.attack=null;}
 p.previous={...k};
 }
 // Collect contacts before resolving damage so trades do not depend on slot order.
 const contacts=hits.filter(h=>{const p=s.players[h.from],q=s.players[1-h.from];return Math.abs(q.x-p.x)<=h.reach&&Math.abs(q.y-p.y)<48&&(q.x-p.x)*p.face>=0;});
 const focusDelta=[0,0];
 for(const h of contacts){const p=s.players[h.from],q=s.players[1-h.from],blocked=q.input.block&&!q.attack&&!q.stun&&(p.x-q.x)*q.face>=0;
 q.hp=Math.max(0,q.hp-(blocked?2:h.damage));focusDelta[h.from]+=blocked?2:8;if(blocked)focusDelta[1-h.from]+=4;else {q.stun=12;q.attack=null;focusDelta[1-h.from]-=15;q.vx=p.face*180;}}
 for(let i=0;i<2;i++)s.players[i].focus=Math.max(0,Math.min(100,s.players[i].focus+focusDelta[i]));
 s.roundTicks--;if(s.players.some(p=>p.hp===0)||s.roundTicks<=0){const [a,b]=s.players.map(p=>p.hp);s.winner=a===b?null:a>b?0:1;if(s.winner!==null)s.scores[s.winner]++;s.phase=s.scores.some(v=>v>=2)?'finished':'round-over';}
 return s;}
function next(s){if(s.phase==='round-over'){s.round++;round(s);return true;}return false;}
module.exports={HZ,KEYS,ROSTER,create,input,step,next};
