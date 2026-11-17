(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./advanced-input.js'),require('./advanced-moves.js'));
  else root.ArenaAdvancedSimulation=factory(root.ArenaAdvancedInput,root.ArenaAdvancedMoves);
})(typeof globalThis==='object'?globalThis:this,function(input,moves){
'use strict';
const HZ=60, FLOOR=360, WIDTH=960, DT=1/HZ;
const SCHEMA_VERSION=2, RULESET_ID='arena-directional-v2';
const ROSTER=Object.freeze(['mike','k','iona','felicia']);
const B=input.BUTTONS, M=moves.MOVES;
const STATE_KEYS=['tick','characters','scores','round','phase','remaining','roundTicks','winner','players'];
const PLAYER_KEYS=['id','character','x','y','vx','vy','face','hp','focus','jumps','dashUntil','dashReady','stunUntil','recoveryUntil','attack','buffer','previous','buttons','lastPress','lastHit','comboStage','comboHits','airHits','airLocked'];
function fail(){const e=new TypeError('Invalid advanced Arena state');e.code='ERR_ARENA_SCHEMA';throw e;}
function ok(v){if(!v)fail();}
function rec(v,keys,optional=[]){
  ok(v!==null&&typeof v==='object'&&!Array.isArray(v));
  ok(Object.getPrototypeOf(v)===Object.prototype||Object.getPrototypeOf(v)===null);
  const fields=Reflect.ownKeys(v);ok(fields.length>=keys.length&&fields.length<=keys.length+optional.length);
  for(const k of fields){ok(typeof k==='string'&&(keys.includes(k)||optional.includes(k)));const d=Object.getOwnPropertyDescriptor(v,k);ok(d&&Object.hasOwn(d,'value')&&d.enumerable);}
  for(const k of keys)ok(Object.hasOwn(v,k));
}
function pair(v){ok(Array.isArray(v)&&Object.getPrototypeOf(v)===Array.prototype);const d=Object.getOwnPropertyDescriptors(v);ok(Reflect.ownKeys(d).length===3&&d.length.value===2);for(const k of ['0','1'])ok(d[k]&&Object.hasOwn(d[k],'value')&&d[k].enumerable);}
function integer(v,lo,hi=Number.MAX_SAFE_INTEGER){ok(Number.isSafeInteger(v)&&v>=lo&&v<=hi);}
function real(v,lo,hi){ok(typeof v==='number'&&Number.isFinite(v)&&v>=lo&&v<=hi);}
function bool(v){ok(typeof v==='boolean');}
function clone(v){return JSON.parse(JSON.stringify(v));}
function metadata(m){ok(m.schemaVersion===SCHEMA_VERSION&&m.rulesetId===RULESET_ID);ok(typeof m.matchId==='string'&&/^[A-Za-z0-9_-]{1,64}$/.test(m.matchId));}
function player(id,character){return {id,character,x:id?650:310,y:FLOOR,vx:0,vy:0,face:id?-1:1,hp:100,focus:0,jumps:0,dashUntil:0,dashReady:0,stunUntil:0,recoveryUntil:0,attack:null,buffer:null,previous:0,buttons:0,lastPress:null,lastHit:null,comboStage:0,comboHits:0,airHits:0,airLocked:false};}
function resetRound(s){s.phase='countdown';s.remaining=180;s.roundTicks=5400;s.winner=null;s.players=s.characters.map((c,i)=>player(i,c));}
function validate(m){
  rec(m,['schemaVersion','rulesetId','matchId','state']);metadata(m);
  const s=m.state;rec(s,STATE_KEYS,['outcome']);integer(s.tick,0,Number.MAX_SAFE_INTEGER-100);integer(s.round,1,Number.MAX_SAFE_INTEGER-1);
  pair(s.characters);pair(s.scores);pair(s.players);s.characters.forEach(c=>ok(ROSTER.includes(c)));
  s.scores.forEach(n=>integer(n,0,2));ok(s.scores.filter(n=>n===2).length<=1&&s.scores[0]+s.scores[1]<=s.round);
  ok(['countdown','fight','round-over','finished','disconnected'].includes(s.phase));integer(s.remaining,0,180);integer(s.roundTicks,0,5400);ok(s.winner===null||s.winner===0||s.winner===1);
  s.players.forEach((p,i)=>{
    rec(p,PLAYER_KEYS);ok(p.id===i&&p.character===s.characters[i]);ok(p.face===-1||p.face===1);
    real(p.x,20,WIDTH-20);real(p.y,-2048,FLOOR);real(p.vx,-780,780);real(p.vy,-612,900);
    integer(p.hp,0,100);integer(p.focus,0,100);integer(p.jumps,0,2);
    for(const k of ['dashUntil','dashReady','stunUntil','recoveryUntil'])integer(p[k],0,s.tick+60);
    for(const k of ['previous','buttons'])integer(p[k],0,511);
    for(const k of ['lastPress','lastHit'])if(p[k]!==null)integer(p[k],0,s.tick);
    integer(p.comboStage,0,2);integer(p.comboHits,0,10000);integer(p.airHits,0,3);bool(p.airLocked);
    if(p.y===FLOOR){ok(p.vy<=0);if(p.vy===0)ok(p.jumps===0);}
    if(p.airHits===3)ok(p.airLocked);
    if(p.attack!==null){const a=p.attack;rec(a,['moveId','start','face','stage','beat','connected','contactDone']);ok(typeof a.moveId==='string'&&Object.hasOwn(M,a.moveId));integer(a.start,1,s.tick);ok(a.face===-1||a.face===1);integer(a.stage,0,2);bool(a.beat);bool(a.connected);bool(a.contactDone);const age=s.tick-a.start+1;ok(age<=M[a.moveId].durationTicks&&p.recoveryUntil===a.start+M[a.moveId].durationTicks&&p.stunUntil<=s.tick&&p.hp>0);ok(a.contactDone===(age>=M[a.moveId].contactTick));if(a.connected)ok(a.contactDone);ok(a.face===p.face);if(!a.beat)ok(a.stage===0);
      if(a.moveId==='jab')ok(a.stage===0);if(a.moveId==='cross')ok(a.beat&&a.stage===1);if(a.moveId==='launcher')ok(a.beat&&a.stage===2);}
    if(p.buffer!==null){const q=p.buffer;rec(q,['action','vertical','face','pressTick']);ok(['light','heavy'].includes(q.action)&&[-1,0,1].includes(q.vertical)&&[-1,1].includes(q.face));integer(q.pressTick,Math.max(0,s.tick-moves.BUFFER_TICKS),s.tick);ok(p.attack!==null&&p.recoveryUntil-q.pressTick<=moves.BUFFER_TICKS);}
  });
  const won=s.scores.some(n=>n===2),sum=s.scores[0]+s.scores[1];
  if(won)ok(['finished','disconnected'].includes(s.phase));
  if(s.phase==='countdown'){ok(s.remaining>0&&s.roundTicks===5400&&s.winner===null&&sum<s.round);s.players.forEach((p,i)=>{const initial=player(i,s.characters[i]);for(const key of PLAYER_KEYS)ok(p[key]===initial[key]);});}
  if(s.phase==='fight')ok(s.remaining===0&&s.roundTicks>0&&s.winner===null&&sum<s.round&&s.players.every(p=>p.hp>0));
  if(['round-over','finished'].includes(s.phase)){
    ok(s.remaining===0&&s.roundTicks<5400);if(s.roundTicks>0)ok(s.players.some(p=>p.hp===0));
    const [a,b]=s.players.map(p=>p.hp);ok(s.winner===(a===b?null:a>b?0:1));if(s.winner!==null)ok(s.scores[s.winner]>0);else ok(sum<s.round);
    if(s.phase==='finished')ok(won&&s.winner!==null&&s.scores[s.winner]===2);else ok(!won);
  }
  if(s.phase==='disconnected'){rec(s.outcome,['reason','winner'],['matchComplete']);ok(['leave','timeout'].includes(s.outcome.reason)&&s.outcome.winner===s.winner);if(won)ok(s.outcome.matchComplete===true&&s.winner===s.scores.indexOf(2));else ok(!Object.hasOwn(s.outcome,'matchComplete'));}
  else ok(!Object.hasOwn(s,'outcome'));
  return m;
}
function createMatch(c){rec(c,['schemaVersion','rulesetId','matchId','characters']);metadata(c);pair(c.characters);c.characters.forEach(x=>ok(ROSTER.includes(x)));const s={tick:0,characters:[...c.characters],scores:[0,0],round:1};resetRound(s);return validate({schemaVersion:SCHEMA_VERSION,rulesetId:RULESET_ID,matchId:c.matchId,state:s});}
function snapshot(m){validate(m);return clone(m);}
function restore(m){return snapshot(m);}
function writable(m){ok(Object.getOwnPropertyDescriptor(m,'state').writable===true);}
function intent(p,k,edge,t){const action=edge('heavy')?'heavy':edge('light')?'light':null;return action?{action,vertical:Number(k.up)-Number(k.down),face:(Number(k.right)-Number(k.left))||p.face,pressTick:t}:null;}
function begin(p,q,t,emit){
  const pick=moves.selectMove({airborne:(p.y<FLOOR||p.vy<0),up:q.vertical===1,down:q.vertical===-1,action:q.action,tick:t,pressTick:q.pressTick,lastPress:p.lastPress,lastHit:p.lastHit,stage:p.comboStage});
  p.face=q.face;p.lastPress=q.pressTick;p.buffer=null;p.dashUntil=0;
  p.attack={moveId:pick.moveId,start:t,face:q.face,stage:pick.stage,beat:pick.beat,connected:false,contactDone:false};p.recoveryUntil=t+M[pick.moveId].durationTicks;
  emit({type:'attack',source:p.id,moveId:pick.moveId,face:q.face,beat:pick.beat});
}
function clearChain(p){p.comboStage=0;p.comboHits=0;p.lastHit=null;}
function run(s,inputs,emit){
  ++s.tick;const t=s.tick;
  // Countdown deliberately consumes no actions; the adapter clears transitions
  // at the fight boundary. A new input packet starts play after the countdown.
  if(s.phase==='countdown'){if(--s.remaining===0){s.phase='fight';emit({type:'phase',phase:'fight',winner:null});}return;}
  const candidates=[];
  s.players.forEach((p,i)=>{
    const k=inputs[i],buttons=input.KEYS.reduce((mask,key)=>mask|(k[key]?B[key]:0),0);p.buttons=buttons;
    const edge=key=>!!(buttons&B[key])&&!(p.previous&B[key]);
    if(p.lastHit!==null&&t-p.lastHit>=moves.CHAIN_LIFE_TICKS)clearChain(p);
    if(p.y===FLOOR&&p.vy===0&&t>=p.stunUntil){p.airHits=0;p.airLocked=false;}
    if(p.attack&&t>=p.recoveryUntil)p.attack=null;
    const direction=Number(k.right)-Number(k.left),canAct=t>=p.stunUntil;
    if(canAct){
      if(direction&&!p.attack)p.face=direction;
      p.vx=direction*(k.block?80:240);
      const q=intent(p,k,edge,t),a=p.attack;
      if(a){
        if(edge('jump')&&p.y===FLOOR&&p.vy===0&&a.connected&&a.contactDone&&M[a.moveId].launch){p.attack=null;p.buffer=null;p.recoveryUntil=t;p.vy=-420;p.jumps=1;emit({type:'jump-cancel',source:i,moveId:a.moveId});}
        else if(q&&!k.block&&!p.buffer&&p.recoveryUntil-t<=moves.BUFFER_TICKS)p.buffer=q;
      }else if(t>=p.recoveryUntil){
        // Captured buffer wins over a new edge; block cancels it without starting.
        const queued=p.buffer;p.buffer=null;
        if(!k.block&&(queued||q))begin(p,queued||q,t,emit);
        else if(!k.block&&edge('dash')&&t>=p.dashReady){p.dashUntil=t+9;p.dashReady=t+36;emit({type:'dash',source:i});}
        else if(edge('jump')&&p.jumps<2){p.vy=-420;p.jumps++;emit({type:'jump',source:i});}
      }
      if(t<p.dashUntil)p.vx=p.face*780;
    }else{p.vx*=.8;p.buffer=null;}
    p.x=Math.max(20,Math.min(WIDTH-20,p.x+p.vx*DT));p.vy=Math.min(900,p.vy+1100*DT);p.y+=p.vy*DT;
    if(p.y>=FLOOR){p.y=FLOOR;p.vy=0;p.jumps=0;}
    const a=p.attack;if(a&&!a.contactDone&&t-a.start+1===M[a.moveId].contactTick){a.contactDone=true;candidates.push({source:i,attack:a,move:M[a.moveId]});}
    p.previous=buttons;
  });
  // All contact and block predicates read the same post-movement, pre-hit state.
  const contacts=[];
  for(const h of candidates){const p=s.players[h.source],q=s.players[1-h.source],m=h.move,dx=q.x-p.x,dy=q.y-p.y;
    const vertical=m.low?18:m.downward?130:m.launch?120:(p.y<FLOOR||p.vy<0)?92:65;
    const hit=!q.airLocked&&dx*h.attack.face>=0&&Math.abs(dx)<=m.reach&&Math.abs(dy)<vertical&&(!m.low||q.y===FLOOR&&q.vy===0)&&(!m.downward||dy>=-18);
    if(!hit){clearChain(p);emit({type:'whiff',source:p.id,moveId:h.attack.moveId});continue;}
    const blocked=!!(q.buttons&B.block)&&!q.attack&&t>=q.stunUntil&&(p.x-q.x)*q.face>=0;
    contacts.push({...h,blocked,air:q.y<FLOOR||q.vy<0});
  }
  const delta=[0,0],reactions=[];
  for(const h of contacts){const p=s.players[h.source],q=s.players[1-h.source],a=h.attack,m=h.move;
    const damage=h.blocked?2:m.damage+(a.beat?3:0);q.hp=Math.max(0,q.hp-damage);
    delta[p.id]+=h.blocked?2:8;delta[q.id]+=h.blocked?4:-15;
    emit({type:'contact',source:p.id,target:q.id,moveId:a.moveId,blocked:h.blocked,damage});
    if(h.blocked){clearChain(p);continue;}
    a.connected=true;p.lastHit=t;p.comboStage=a.stage;p.comboHits++;
    reactions.push({target:q.id,source:p.id,face:a.face,move:m,air:h.air,beat:a.beat});
  }
  // At most one opposing contact per fighter in this two-seat base kit.
  for(const r of reactions){const p=s.players[r.source],q=s.players[r.target];
    q.attack=null;q.buffer=null;q.dashUntil=0;clearChain(q);
    const stun=r.move.knockdown?26:r.beat?22:15;q.stunUntil=t+stun+1;q.recoveryUntil=q.stunUntil;q.vx=r.face*180;
    if(r.air){q.airHits++;q.airLocked=r.move.slam===true||q.airHits>=3;q.vx=r.face*90;q.vy=q.airLocked?600:r.move.downward?252:-348;
      // Shared lift only on a confirmed air follow-up, never on a whiff.
      // If both fighters are hit, each receives its own reaction below instead.
      if(!q.airLocked&&!r.move.downward&&(p.y<FLOOR||p.vy<0)&&!reactions.some(v=>v.target===p.id))p.vy=-348;
    }else if(r.move.launch){q.vx=r.face*r.move.vx;q.vy=r.move.vy;q.jumps=Math.max(1,q.jumps);}
  }
  s.players.forEach((p,i)=>{p.focus=Math.max(0,Math.min(100,p.focus+delta[i]));if(!p.hp){p.attack=null;p.buffer=null;} // landing after a downward hit must remain canonical
    if(p.y===FLOOR&&p.vy>0)p.vy=0;
  });
  --s.roundTicks;
  if(s.players.some(p=>p.hp===0)||s.roundTicks===0){const [a,b]=s.players.map(p=>p.hp);s.winner=a===b?null:a>b?0:1;if(s.winner!==null)s.scores[s.winner]++;s.phase=s.scores.some(n=>n===2)?'finished':'round-over';s.players.forEach(p=>{p.buffer=null;});emit({type:'phase',phase:s.phase,winner:s.winner});}
}
function stepMatch(m,frames){validate(m);writable(m);const inputs=input.normalizeFramePair(frames,m.state.tick,m.state.round);if(!['countdown','fight'].includes(m.state.phase))return [];
  const candidate=clone(m),events=[];run(candidate.state,inputs,e=>events.push({id:`${m.matchId}:${candidate.state.round}:${candidate.state.tick}:${events.length}`,tick:candidate.state.tick,round:candidate.state.round,...e}));validate(candidate);m.state=candidate.state;return events;}
function nextRound(m){validate(m);writable(m);if(m.state.phase!=='round-over')return false;const c=clone(m);c.state.round++;resetRound(c.state);validate(c);m.state=c.state;return true;}
return Object.freeze({HZ,ROSTER,SCHEMA_VERSION,RULESET_ID,createMatch,stepMatch,snapshot,restore,nextRound});
});
