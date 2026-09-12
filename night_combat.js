/* Contextual street combat. The existing Night loop calls this service once per
 * step; it owns no timer, input listener, renderer wrapper or campaign state. */
(function(root){
  'use strict';
  const RULES=Object.freeze({beatMin:260,beatMax:500,chainLife:900,windup:70,recovery:230,buffer:65,grabLife:1600,stun:240,maxAirHits:3,grabReach:58});
  let nextEnemyId=0;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function active(n){return !!n&&Array.isArray(n.enemies)&&typeof n.district==='string'&&!n._v736&&!n._sector04&&n.district!=='waldo';}
  function state(n){return n._nightCombat||(n._nightCombat={time:0,attack:null,grab:null,stunUntil:0,lastInput:-10000,lastHit:-10000,stage:0,hits:0,beat:false,events:[],fx:[],serial:0});}
  function enemy(e){return e._nightCombat||(e._nightCombat={id:++nextEnemyId,stunUntil:0,air:false,airHits:0,recoverUntil:0,vx:0,vy:0,flightHits:[],held:false});}
  function sound(id){if(!root.TechOpsCombatAudio&&typeof root.sfx==='function')root.sfx(id);}
  function wallClock(){return root.performance?root.performance.now():Date.now();}
  function say(n,text){n.msg=text;n.msgT=wallClock()+1000;}
  function event(n,type,e,extra){const c=state(n),r=Object.assign({id:++c.serial,type,time:c.time,x:e?e.x+e.w/2:n.x+n.w/2,y:e?e.y+e.h/2:n.y},extra||{});c.events.push(r);if(c.events.length>32)c.events.shift();c.fx.push(r);if(c.fx.length>24)c.fx.shift();root.__nightCombatEvent=r;try{if(root.TechOpsCombatAudio)root.TechOpsCombatAudio.emit(n,r);}catch(_){}return r;}
  function direction(k){return k.arrowup||k.w?'up':k.arrowleft||k.a?'left':k.arrowright||k.d?'right':null;}
  function target(n,k,grab){const c=state(n),cx=n.x+n.w/2;return (n.enemies||[]).filter(e=>{if(!e.alive||e.hp<=0)return false;const ec=enemy(e),dx=e.x+e.w/2-cx;if(ec.held||ec.recoverUntil>c.time||Math.abs(e.y-n.y)>(grab?24:n.onGround?60:80))return false;if(grab){const dir=direction(k),toward=dir===(dx<0?'left':'right');return n.onGround&&!ec.air&&!e.hover&&e.grabbable!==false&&Math.abs(dx)<46&&toward;}return dx*(n.face||1)>-10&&Math.abs(dx)<76;}).sort((a,b)=>Math.abs(a.x-n.x)-Math.abs(b.x-n.x))[0]||null;}
  function clearChain(n){const c=state(n);c.hits=0;c.stage=0;c.beat=false;c.lastHit=-10000;n.combo=0;}
  function cancel(n){if(!active(n))return;const c=state(n);if(c.grab){const ec=enemy(c.grab.enemy);ec.held=false;ec.stunUntil=c.time+180;}c.grab=null;c.attack=null;n.jabAnim=0;clearChain(n);}
  function damage(n,e,value,kind,flags){if(!e.alive||e.hp<=0)return false;const c=state(n),ec=enemy(e);e.hp=Math.max(0,e.hp-Math.round(value));e.hitT=8;e.windup=0;ec.stunUntil=Math.max(ec.stunUntil,c.time+RULES.stun);n.hitStop=Math.max(n.hitStop||0,kind==='throw'||kind==='launcher'?5:3);event(n,kind,e,Object.assign({damage:Math.round(value)},flags||{}));if(root.TechOpsArtHandoff)root.TechOpsArtHandoff.impact(n,e,kind==='jab'?'hit':'finisher',wallClock());sound('hit');if(e.hp<=0){e.alive=false;ec.held=false;n.kills=(n.kills||0)+1;const cash=e.cash||[0,0],pay=cash[0]+Math.floor(Math.random()*(cash[1]-cash[0]+1));n.cash=(n.cash||0)+pay;event(n,'ko',e,{cash:pay});say(n,'KNOCKOUT · +$'+pay);if(typeof root.nmCheckClear==='function')root.nmCheckClear();}return true;}
  function lift(n,e,vx,vy,thrown){const c=state(n),ec=enemy(e);ec.held=false;ec.air=true;ec.airHits=0;ec.locked=false;ec.vx=vx;ec.vy=vy;ec.thrown=thrown;ec.flightHits=[];ec.wallHit=false;ec.stunUntil=c.time+450;e.launch=0;e.down=0;e.kb=0;}
  function throwHeld(n,dir){const c=state(n),g=c.grab;if(!g||c.time-g.at<120)return false;const e=g.enemy;c.grab=null;if(!e.alive){enemy(e).held=false;return false;}const sign=dir==='left'?-1:dir==='right'?1:(n.face||1);n.face=sign;lift(n,e,dir==='up'?sign*1.3:sign*9.2,dir==='up'?-12:-5.5,true);damage(n,e,dir==='up'?16:24,'throw');c.attack={kind:dir==='up'?'throw-up':'throw',at:c.time,hit:true,stage:0,duration:270,face:sign};n.jabAnim=17;c.hits++;c.lastHit=c.time;n.combo=c.hits;n.comboT=wallClock()+RULES.chainLife;say(n,dir==='up'?'LAUNCH · JUMP + ATTACK':'THROW · LINE THEM UP');return true;}
  function attack(n,k){if(!active(n))return false;try{if(root.TechOpsCombatAudio)root.TechOpsCombatAudio.unlock();}catch(_){}const c=state(n);if(n.drive||n.block||n.hp<=0||c.stunUntil>c.time||root.S&&(root.S.inDialog||root.S.inBattle))return false;
    if(c.grab)return throwHeld(n,direction(k)||((n.face||1)<0?'left':'right'));
    if(c.attack){const age=c.time-c.attack.at;if(age>=c.attack.duration-RULES.buffer&&!c.attack.buffer)c.attack.buffer={at:c.time,keys:Object.assign({},k),action};return false;}
    return begin(n,k,c.time,action);
  }
  function begin(n,k,pressedAt,action='legacy'){
    const c=state(n);faceInput(n,k);
    const dir=direction(k),implicit=action==='legacy'&&(dir==='left'||dir==='right');
    const e=(action==='grab'||implicit)?target(n,k,true):null;
    if(e){
      n.face=e.x+e.w/2<n.x+n.w/2?-1:1;const ec=enemy(e);ec.held=true;e.windup=0;e.kb=0;
      c.grab={enemy:e,at:c.time,entry:dir,armed:false};n.vx=0;event(n,'grab',e);say(n,'GRABBED · ← / → THROW · ↑ LAUNCH · ↓ SLAM');return true;
    }
    if(action==='grab'){clearChain(n);event(n,'grab-miss');say(n,'GRAB · GET CLOSE TO A GROUNDED ENEMY');return false;}
    const gap=pressedAt-c.lastInput,connected=c.lastHit>=0&&c.time-c.lastHit<RULES.chainLife;
    const beat=connected&&gap>=RULES.beatMin&&gap<=RULES.beatMax;
    const eq=root.v733&&root.v733.equipped?root.v733.equipped():[];
    const stage=beat?(c.stage+1)%3:0;
    let kind;
    if(!n.onGround)kind=action==='kick'?(dir==='down'?'air-slam':'air-kick'):'air';
    else if(action==='kick')kind=dir==='up'?'rising-kick':dir==='down'?'sweep':'kick';
    else kind=dir==='up'?'uppercut':dir==='down'?'low':stage===2||stage===1&&eq.includes('pivot')?'launcher':stage===1?'cross':'jab';
    const move=MOVES[kind];c.lastInput=pressedAt;
    c.attack={kind,stage,beat,at:c.time,hit:false,connected:false,launch:!!move.launch,windup:move.windup,duration:move.recovery,face:n.face||1};
    n.jabAnim=16;n.jabStage=stage+1;n.lastJab=wallClock();event(n,'windup',null,{kind});return true;
  }
  // A confirmed launcher may cancel recovery into a player-requested jump.
  // No auto-jump, whiff reward, target teleport or extra simulation loop.
  function jumpCancel(n){
    if(!active(n))return false;const c=state(n),a=c.attack;
    if(!n.onGround||c.grab||c.stunUntil>c.time||!a||!a.connected||!a.launch)return false;
    c.attack=null;n.jabAnim=0;return true;
  }
  function strike(n,a){
    const c=state(n),move=MOVES[a.kind]||MOVES.jab;
    const e=target(n,{},false,Object.assign({face:a.face},move));
    if(!e){clearChain(n);event(n,'whiff');sound('ping');return;}
    const ec=enemy(e);if(ec.air&&ec.locked){clearChain(n);event(n,'whiff');return;}
    const eq=root.v733&&root.v733.equipped?root.v733.equipped():[];
    let value=move.damage+(a.beat?3:0);
    const shield=e.blocks&&a.kind==='jab'&&!a.beat&&!ec.air&&ec.stunUntil<=c.time;
    if(shield){value=5;clearChain(n);event(n,'guard',e);say(n,'GUARD · WALK IN + ATTACK TO GRAB');}else{c.hits++;c.stage=a.stage;c.beat=a.beat;c.lastHit=c.time;n.combo=c.hits;n.comboT=wallClock()+RULES.chainLife;if(a.beat)n.perfectT=wallClock()+550;}
    if(eq.includes('orbital')&&(ec.air||a.kind==='launcher')){e.marked=true;value+=4;}
    damage(n,e,value,a.kind,{guarded:!!shield});if(!e.alive)return;
    if(a.kind==='launcher'&&!shield){lift(n,e,a.face*2,-10.5,false);say(n,'RISING FINISH · JUMP TO FOLLOW');}
    else if(ec.air){ec.airHits++;ec.vx=a.face*2.4;ec.vy=ec.airHits>=RULES.maxAirHits?10:-5.4;ec.locked=ec.airHits>=RULES.maxAirHits;n.vy=Math.min(n.vy, -4.5);say(n,ec.locked?'AIR FINISH · SLAM':'AIR '+ec.airHits+' / '+RULES.maxAirHits);}
    else {e.kb=a.face*(shield?1.5:3);ec.stunUntil=c.time+(a.beat?360:RULES.stun);if(!shield)say(n,a.beat?'ON BEAT · '+(a.stage===1?'CROSS':'JAB'):'JAB · TAP ON THE GOLD BEAT');}
    if(eq.includes('telemetry')&&c.hits>=5)e.showHp=wallClock()+4000;
    if(a.beat&&eq.includes('intercept'))e.exposed=wallClock()+2500;
    c.relay=a.beat?(c.relay||0)+1:0;if(eq.includes('relay')&&c.relay>=3){n.dashCD=0;c.relay=0;say(n,'LOW-ORBIT RELAY · DASH READY');}
  }
  function tick(n,dt,k){if(!active(n))return {locked:false};if(n.drive||blocked())return {locked:true};const c=state(n);k=readInput(k);c.time+=(Number.isFinite(dt)?Math.min(Math.max(dt,0),.05):0)*1000;
    if(c.grab){const g=c.grab,ec=enemy(g.enemy),dir=direction(k);if(!g.enemy.alive||!n.enemies.includes(g.enemy)||c.time-g.at>RULES.grabLife){ec.held=false;ec.stunUntil=c.time+180;c.grab=null;event(n,'escape',g.enemy);}else{g.enemy.x=clamp(n.x+(n.face>0?n.w+3:-g.enemy.w-3),0,1800-g.enemy.w);g.enemy.y=n.y+n.h-g.enemy.h;ec.stunUntil=c.time+180;if(!dir)g.armed=true;if(g.pending)throwHeld(n,g.pending);else if(dir&&(g.armed||dir!==g.entry))throwHeld(n,dir);}}
    if(c.attack){const a=c.attack,age=c.time-a.at;n.jabAnim=Math.max(1,(a.duration-age)/16);if(!a.hit&&age>=(a.windup||RULES.windup)){a.hit=true;strike(n,a);}if(age>=a.duration){const queued=a.buffer;c.attack=null;n.jabAnim=0;if(queued&&c.stunUntil<=c.time)begin(n,queued.keys,queued.at,queued.action);}}
    if(c.time-c.lastHit>RULES.chainLife)clearChain(n);c.fx=c.fx.filter(e=>c.time-e.time<650);
    return {locked:!!c.grab||c.stunUntil>c.time};
  }
  function stepEnemy(n,e,dt){if(!active(n))return false;const c=state(n),ec=enemy(e),f=(Number.isFinite(dt)?Math.max(0,Math.min(dt,.05)):0)*60;e.hitT=Math.max(0,(e.hitT||0)-f);
    if(ec.held){e.windup=0;return true;}
    if(ec.air){const oldBottom=e.y+e.h;ec.vy=Math.min(13,ec.vy+.43*f);e.x+=ec.vx*f;e.y+=ec.vy*f;ec.vx*=Math.pow(.99,f);if(e.x<0||e.x+e.w>1800){e.x=clamp(e.x,0,1800-e.w);ec.vx*=-.45;if(!ec.wallHit){ec.wallHit=true;damage(n,e,8,'wall');}}
      if(ec.thrown)for(const other of n.enemies||[]){if(other===e||!other.alive||enemy(other).held||ec.flightHits.includes(enemy(other).id))continue;if(e.x<other.x+other.w&&e.x+e.w>other.x&&e.y<other.y+other.h&&e.y+e.h>other.y){ec.flightHits.push(enemy(other).id);damage(n,other,18,'collision');other.kb=Math.sign(ec.vx)*5;}}
      let floor=430;for(const p of n.platforms||[])if(ec.vy>=0&&oldBottom<=p.y&&e.y+e.h>=p.y&&e.x+e.w>p.x&&e.x<p.x+p.w)floor=Math.min(floor,p.y);
      if(e.y+e.h>=floor&&ec.vy>=0){e.y=floor-e.h;ec.air=false;ec.thrown=false;ec.recoverUntil=c.time+420;ec.stunUntil=c.time+420;ec.airHits=0;event(n,'land',e);if(ec.locked)damage(n,e,8,'slam');ec.locked=false;}
      return true;
    }
    if(ec.stunUntil>c.time||ec.recoverUntil>c.time){e.windup=0;const decay=Math.pow(.7,f);e.x=clamp(e.x+(e.kb||0)*(1-decay)/.3,0,1800-e.w);e.kb=(e.kb||0)*decay;return true;}return false;
  }
  function blocked(n,e){if(active(n))event(n,'block',e);}
  function hurt(n){if(!active(n))return;cancel(n);const c=state(n);c.stunUntil=c.time+180;event(n,'hurt');}
  function pose(n){
    if(!active(n))return null;const c=state(n);
    if(c.grab)return {frame:'guard0',lean:(n.face||1)*.08,shift:0};
    if(c.stunUntil>c.time)return {frame:'hit0',lean:-(n.face||1)*.12,shift:0};
    const a=c.attack;if(!a)return null;
    const age=c.time-a.at,wind=age<(a.windup||RULES.windup),power=1-clamp((age-(a.windup||RULES.windup))/180,0,1);
    const kick=/kick|sweep|slam/.test(a.kind),low=a.kind==='low'||a.kind==='sweep';
    return {frame:wind?'guard0':kick||a.kind==='launcher'||a.kind==='throw-up'?'heavy0':a.kind==='uppercut'?'light1':a.kind==='throw'?'light2':['light0','light1','light2'][a.stage],
      lean:a.face*(wind?-.08:low?.34*power:a.kind==='uppercut'?-.16*power:.16*power),shift:a.face*(wind?-3:9*power)};
  }
  function draw(ctx,n){if(!active(n))return;const c=state(n),W=ctx.canvas.width,calm=root.matchMedia&&root.matchMedia('(prefers-reduced-motion: reduce)').matches;ctx.save();ctx.font='bold 11px monospace';ctx.textAlign='center';
    for(const e of n.enemies||[]){const ec=enemy(e);if(!e.alive)continue;const x=e.x+e.w/2-(n.cam||0),y=e.y-60;if(ec.held){ctx.fillStyle='#ffd166';ctx.fillText('GRAB',x,y);}else if(ec.stunUntil>c.time&&!ec.air){ctx.fillStyle='#ffd166';for(let i=0;i<3;i++)ctx.fillRect(x-12+i*10,y+(calm?0:Math.sin(c.time/100+i)*3),4,4);}}
    for(const e of c.fx){const age=c.time-e.time;if(!['jab','cross','launcher','air','throw','collision','slam','wall','ko'].includes(e.type))continue;ctx.globalAlpha=Math.max(0,1-age/450);ctx.fillStyle=e.type==='ko'?'#ffd166':'#fff2cd';ctx.fillText(e.type==='ko'?'KO':String(e.damage||''),e.x-(n.cam||0),e.y-45-(calm?0:age/25));}ctx.globalAlpha=1;
    let caption='';try{if(root.TechOpsCombatAudio&&typeof root.TechOpsCombatAudio.caption==='function')caption=root.TechOpsCombatAudio.caption(n);}catch(_){}if(caption){ctx.fillStyle='#08111de8';ctx.fillRect(W/2-105,139,210,24);ctx.fillStyle='#fff2cd';ctx.fillText(caption,W/2,155);}
    const width=Math.min(290,W-20),x=(W-width)/2,y=91;ctx.fillStyle='#08111de8';ctx.fillRect(x,y,width,42);ctx.fillStyle='#a9c4d9';ctx.fillText(c.grab?'← / → THROW   ↑ LAUNCH':c.stunUntil>c.time?'RECOVER':c.attack?.kind==='air'?'AIR COMBO · THREE HITS MAX':'JAB · CROSS · RISING FINISH',W/2,y+14);
    const age=c.time-c.lastInput,barW=width-24;ctx.fillStyle='#27354b';ctx.fillRect(x+12,y+25,barW,6);ctx.fillStyle='#b18b39';ctx.fillRect(x+12+barW*RULES.beatMin/700,y+25,barW*(RULES.beatMax-RULES.beatMin)/700,6);if(c.lastHit>=0&&age<700){ctx.fillStyle=age>=RULES.beatMin&&age<=RULES.beatMax?'#ffe39a':'#8dc6fa';ctx.fillRect(x+12+barW*age/700-2,y+23,4,10);}ctx.restore();
  }
  root.TechOpsNightCombat={VERSION:2,RULES,active,state,attack,tick,stepEnemy,hurt,blocked,cancel,pose,draw,target};
})(typeof globalThis!=='undefined'?globalThis:this);
