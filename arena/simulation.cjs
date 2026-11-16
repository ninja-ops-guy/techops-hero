(function(root,factory){
  'use strict';
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./input-contract.js'));
  else root.ArenaSimulation=factory(root.ArenaInputContract);
})(typeof globalThis!=='undefined'?globalThis:this,function(contract){
'use strict';
if(!contract)throw new Error('Arena input contract must load first');
// Pure fixed-step prototype. No campaign globals, storage, randomness or wall clock.
const HZ=60, DT=1/HZ, WIDTH=960, FLOOR=360;
const KEYS=contract.KEYS;
const ROSTER=Object.freeze(['mike','k','iona','felicia']);
function fighter(character,x,face){return {character,x,y:FLOOR,vx:0,vy:0,face,hp:100,focus:0,jumps:0,cooldown:0,dashCooldown:0,stun:0,attack:null,previous:{},input:{}};}
function round(s){s.players=s.characters.map((c,i)=>fighter(c,i?650:310,i?-1:1));s.phase='countdown';s.remaining=180;s.roundTicks=90*HZ;s.winner=null;}
function create(characters=['mike','k']){const s={tick:0,characters:characters.map(c=>ROSTER.includes(c)?c:'mike'),scores:[0,0],round:1};round(s);return s;}
function input(s,slot,value){if(!s.players[slot]||!value||typeof value!=='object')return; s.players[slot].input=Object.fromEntries(KEYS.map(k=>[k,value[k]===true]));}
function stepRules(s,emit){s.tick++;if(s.phase==='countdown'){if(--s.remaining<=0){s.phase='fight';if(emit)emit({type:'phase',phase:s.phase,winner:null});}return s;}if(s.phase!=='fight')return s;
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
 if(emit)emit({type:'contact',source:h.from,target:1-h.from,kind:h.contact===7?'punch':'kick',blocked:!!blocked,damage:blocked?2:h.damage});
 q.hp=Math.max(0,q.hp-(blocked?2:h.damage));focusDelta[h.from]+=blocked?2:8;if(blocked)focusDelta[1-h.from]+=4;else {q.stun=12;q.attack=null;focusDelta[1-h.from]-=15;q.vx=p.face*180;}}
 for(let i=0;i<2;i++)s.players[i].focus=Math.max(0,Math.min(100,s.players[i].focus+focusDelta[i]));
 s.roundTicks--;if(s.players.some(p=>p.hp===0)||s.roundTicks<=0){const [a,b]=s.players.map(p=>p.hp);s.winner=a===b?null:a>b?0:1;if(s.winner!==null)s.scores[s.winner]++;s.phase=s.scores.some(v=>v>=2)?'finished':'round-over';if(emit)emit({type:'phase',phase:s.phase,winner:s.winner});}
 return s;}
function next(s){if(s.phase==='round-over'){s.round++;round(s);return true;}return false;}
function step(s){return stepRules(s);}

// Versioned replay/checkpoint interface. It shares the rules above with the
// legacy server adapter; it does not authorize a room or restore a session.
const SCHEMA_VERSION=1, RULESET_ID='arena-138-v1';
const STATE_KEYS=['tick','characters','scores','round','phase','remaining','roundTicks','winner','players'];
const FIGHTER_KEYS=['character','x','y','vx','vy','face','hp','focus','jumps','cooldown','dashCooldown','stun','attack','previous','input'];
const PHASES=['countdown','fight','round-over','finished','disconnected'];
function fail(code='ERR_ARENA_SCHEMA'){
  const error=code==='ERR_ARENA_COUNTER'?new RangeError('Arena counter rejected'):new TypeError('Arena schema rejected');
  error.code=code;throw error;
}
function insist(condition){if(!condition)fail();}
function record(value,required,optional=[]){
  insist(value!==null&&typeof value==='object'&&!Array.isArray(value));
  const proto=Object.getPrototypeOf(value);
  insist(proto===Object.prototype||proto===null);
  const keys=Reflect.ownKeys(value),allowed=required.concat(optional);
  insist(keys.length>=required.length&&keys.length<=allowed.length);
  for(const key of keys){
    insist(typeof key==='string'&&allowed.includes(key));
    const desc=Object.getOwnPropertyDescriptor(value,key);
    insist(desc&&Object.hasOwn(desc,'value')&&desc.enumerable);
  }
  for(const key of required)insist(Object.hasOwn(value,key));
}
function pair(value){
  insist(Array.isArray(value)&&Object.getPrototypeOf(value)===Array.prototype);
  const length=Object.getOwnPropertyDescriptor(value,'length');
  insist(length&&Object.hasOwn(length,'value')&&length.value===2);
  const keys=Reflect.ownKeys(value);
  insist(keys.length===3&&keys.includes('length'));
  for(const key of ['0','1']){
    const desc=Object.getOwnPropertyDescriptor(value,key);
    insist(desc&&Object.hasOwn(desc,'value')&&desc.enumerable);
  }
}
function integer(value,min,max=Number.MAX_SAFE_INTEGER){insist(Number.isSafeInteger(value)&&value>=min&&value<=max);}
function real(value,min,max){insist(typeof value==='number'&&Number.isFinite(value)&&value>=min&&value<=max);}
function winner(value){insist(value===null||value===0||value===1);}
function maps(value){record(value,KEYS);for(const key of KEYS)insist(typeof value[key]==='boolean');}
function metadata(value){
  insist(value.schemaVersion===SCHEMA_VERSION&&value.rulesetId===RULESET_ID);
  insist(typeof value.matchId==='string'&&/^[A-Za-z0-9_-]{1,64}$/.test(value.matchId));
}
function validateFighter(p,character){
  record(p,FIGHTER_KEYS);
  insist(p.character===character&&(p.face===-1||p.face===1));
  real(p.x,20,940);real(p.y,199,360);real(p.vx,-780,780);real(p.vy,-420,600);
  integer(p.hp,0,100);insist(p.hp%2===0);integer(p.focus,0,100);integer(p.jumps,0,2);
  integer(p.cooldown,0,38);integer(p.dashCooldown,0,36);integer(p.stun,0,12);
  maps(p.previous);maps(p.input);
  if(p.y===360)insist(p.vy===0&&p.jumps===0);
  if(p.attack!==null){
    const a=p.attack;record(a,['age','contact','damage','reach']);
    const light=a.contact===7&&a.damage===10&&a.reach===62;
    const heavy=a.contact===14&&a.damage===18&&a.reach===82;
    insist(light||heavy);integer(a.age,1,light?23:38);
    insist(a.age+p.cooldown===(light?24:39)&&p.stun===0&&p.hp>0);
  }
}
function validate(match){
  record(match,['schemaVersion','rulesetId','matchId','state']);metadata(match);
  const s=match.state;record(s,STATE_KEYS,['outcome']);
  integer(s.tick,0);integer(s.round,1);pair(s.characters);pair(s.scores);pair(s.players);
  for(const character of s.characters)insist(ROSTER.includes(character));
  for(const score of s.scores)integer(score,0,2);
  insist(s.scores.filter(score=>score===2).length<=1&&s.scores[0]+s.scores[1]<=s.round);
  insist(PHASES.includes(s.phase));integer(s.remaining,0,180);integer(s.roundTicks,0,5400);winner(s.winner);
  s.players.forEach((p,i)=>validateFighter(p,s.characters[i]));
  const won=s.scores.some(score=>score===2),sum=s.scores[0]+s.scores[1];
  if(won)insist(s.phase==='finished'||s.phase==='disconnected');
  if(s.phase==='countdown'){
    insist(s.remaining>=1&&s.roundTicks===5400&&s.winner===null&&sum<s.round);
    s.players.forEach((p,i)=>{
      const initial=fighter(s.characters[i],i?650:310,i?-1:1);
      for(const key of FIGHTER_KEYS){if(key!=='input'&&key!=='previous')insist(p[key]===initial[key]);}
      for(const key of KEYS)insist(p.previous[key]===false);
    });
  }else if(s.phase==='fight'){
    insist(s.remaining===0&&s.roundTicks>=1&&s.winner===null&&sum<s.round&&s.players.every(p=>p.hp>0));
  }else if(s.phase==='round-over'||s.phase==='finished'){
    insist(s.remaining===0&&s.roundTicks<=5399);
    if(s.roundTicks>0)insist(s.players.some(p=>p.hp===0));
    const [a,b]=s.players.map(p=>p.hp),expected=a===b?null:a>b?0:1;
    insist(s.winner===expected);
    if(s.winner!==null)insist(s.scores[s.winner]>=1);else insist(sum<s.round);
    if(s.phase==='finished')insist(s.winner!==null&&s.scores[s.winner]===2);
    else insist(!won);
  }
  if(s.phase==='disconnected'){
    insist(Object.hasOwn(s,'outcome'));record(s.outcome,['reason','winner'],['matchComplete']);
    insist(['leave','timeout'].includes(s.outcome.reason));winner(s.outcome.winner);insist(s.outcome.winner===s.winner);
    if(won)insist(s.outcome.matchComplete===true&&s.winner===s.scores.indexOf(2));
    else insist(!Object.hasOwn(s.outcome,'matchComplete'));
  }else insist(!Object.hasOwn(s,'outcome'));
  return match;
}
function detach(value){return JSON.parse(JSON.stringify(value));}
function canonical(s){for(const p of s.players){p.previous=Object.fromEntries(KEYS.map(key=>[key,false]));p.input=Object.fromEntries(KEYS.map(key=>[key,false]));}return s;}
function writable(match){insist(Object.getOwnPropertyDescriptor(match,'state').writable===true);}
function increment(value){if(!Number.isSafeInteger(value+1))fail('ERR_ARENA_COUNTER');return value+1;}
function createMatch(config){
  record(config,['schemaVersion','rulesetId','matchId','characters']);metadata(config);pair(config.characters);
  for(const character of config.characters)insist(ROSTER.includes(character));
  return validate({schemaVersion:SCHEMA_VERSION,rulesetId:RULESET_ID,matchId:config.matchId,state:canonical(create([...config.characters]))});
}
function snapshot(match){validate(match);return detach(match);}
function restore(value){return snapshot(value);}
function stepMatch(match,frames){
  validate(match);writable(match);
  const inputs=contract.normalizeFramePair(frames,match.state.tick,match.state.round);
  // An authenticated server owns departure policy. A checkpoint can never resume it.
  if(match.state.phase==='disconnected')return [];
  const candidate=detach(match),events=[];
  candidate.state.players.forEach((p,i)=>{p.input=inputs[i];});
  stepRules(candidate.state,event=>{
    const ordinal=events.length,s=candidate.state;
    events.push({id:`${candidate.matchId}:${s.round}:${s.tick}:${ordinal}`,matchId:candidate.matchId,round:s.round,tick:s.tick,ordinal,...event});
  });
  validate(candidate);
  match.state=candidate.state;
  return events;
}
function nextRound(match){
  validate(match);writable(match);
  if(match.state.phase!=='round-over')return false;
  increment(match.state.round);
  const candidate=detach(match);next(candidate.state);canonical(candidate.state);validate(candidate);
  match.state=candidate.state;return true;
}
return Object.freeze({HZ,KEYS,ROSTER,SCHEMA_VERSION,RULESET_ID,create,input,step,next,createMatch,stepMatch,snapshot,restore,nextRound});
});
