/* Contextual street combat. The existing Night loop calls this service once per
 * step; it owns no timer, input listener, renderer wrapper or campaign state. */
(function(root){
  'use strict';
  const RULES=Object.freeze({beatMin:260,beatMax:500,chainLife:900,windup:70,recovery:230,buffer:65,grabLife:1600,stun:240,maxAirHits:3,grabReach:58,doubleTap:260,dashGrabWindow:340,followVertical:155});
  let nextEnemyId=0;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function active(n){return !!n&&Array.isArray(n.enemies)&&typeof n.district==='string'&&!n._v736&&!n._sector04&&n.district!=='waldo';}
  function actor(n){
    const s=typeof S!=='undefined'?S:root.S,linked=root.TechOpsLinked;
    const expedition=root.TechOpsLivingWorldRuntime;
    if(active(n)&&s&&s.nightMode===n&&n._combatLab&&root.TechOpsCombatLab?.ROSTER[n._combatLab.actor])return n._combatLab.actor;
    if(active(n)&&!n.drive&&s&&s.nightMode===n&&expedition&&['mike','k','iona','felicia'].includes(expedition.viewpoint(n)))return expedition.viewpoint(n);
    if(!active(n)||n.drive||!s||s.nightMode!==n||!linked)return 'mike';
    const op=linked.mission(),id=s.meta&&s.meta.seeWorldLink;
    return op&&op.actor==='iona'&&op.district===n.district&&id&&op.runId===id.runId&&op.profileId===id.profileId&&linked.health().selected?'iona':'mike';
  }
  function state(n){return n._nightCombat||(n._nightCombat={time:0,attack:null,grab:null,stunUntil:0,lastInput:-10000,lastHit:-10000,stage:0,hits:0,beat:false,events:[],fx:[],serial:0});}
  function enemy(e){return e._nightCombat||(e._nightCombat={id:++nextEnemyId,stunUntil:0,air:false,airHits:0,recoverUntil:0,vx:0,vy:0,flightHits:[],held:false});}
  function sound(id){try{if(!root.TechOpsCombatAudio&&typeof root.sfx==='function')root.sfx(id);}catch(_){/* Cosmetic audio cannot abort a hit or reward. */}}
  function inputBlocked(){const s=typeof S!=='undefined'?S:root.S;return !!(s&&(s.inDialog||s.inBattle||s.paused||s.gameOver)||root.document&&root.document.hidden||root.TechOpsNightRuntime&&root.TechOpsNightRuntime.blocked());}
  function wallClock(){return root.performance?root.performance.now():Date.now();}
  function say(n,text){n.msg=text;n.msgT=wallClock()+1000;}
  function event(n,type,e,extra){const c=state(n),r=Object.assign({id:++c.serial,type,time:c.time,x:e?e.x+e.w/2:n.x+n.w/2,y:e?e.y+e.h/2:n.y},extra||{});c.events.push(r);if(c.events.length>32)c.events.shift();c.fx.push(r);if(c.fx.length>24)c.fx.shift();root.__nightCombatEvent=r;if(root.TechOpsCombatLab?.onCombatEvent)root.TechOpsCombatLab.onCombatEvent(n,r);try{if(root.TechOpsCombatAudio){const map={uppercut:'launcher',low:'jab',kick:'launcher','rising-kick':'launcher',sweep:'cross','air-kick':'air','air-slam':'slam','air-down':'air','bicycle-kick':'air','grab-miss':'whiff'};root.TechOpsCombatAudio.emit(n,map[type]?Object.assign({},r,{type:map[type]}):r);}}catch(_){}return r;}
  // Capture joystick state when the action is pressed, not only inside v55's
  // temporary joystick-to-keys frame bridge. Never mutate the caller's keys.
  function normalizeInput(k={},j={}){
    const left=!!(k.arrowleft||k.a||j.x<-.3),right=!!(k.arrowright||k.d||j.x>.3);
    const up=!!(k.arrowup||k.w||j.y<-.4),down=!!(k.arrowdown||k.s||j.y>.4);
    return Object.assign({},k,{a:left&&!right,d:right&&!left,w:up&&!down,s:down&&!up,
      arrowleft:left&&!right,arrowright:right&&!left,arrowup:up&&!down,arrowdown:down&&!up});
  }
  function readInput(k){
    if(root.TechOpsNightInput)return root.TechOpsNightInput.snapshot(k);
    const j=typeof joy!=='undefined'?joy:(root.joy||{});
    return normalizeInput(k||{},j);
  }
  function direction(k){return k.arrowup||k.w?'up':k.arrowdown||k.s?'down':k.arrowleft||k.a?'left':k.arrowright||k.d?'right':null;}
  function faceInput(n,k){if(k.arrowleft||k.a)n.face=-1;else if(k.arrowright||k.d)n.face=1;}
  const MOVES=Object.freeze({
    'felicia-notes':Object.freeze({actor:'felicia',damage:9,reach:420,windup:100,recovery:580,contacts:Object.freeze([100,230,360]),focus:35,notes:true,visual:'cross'}),
    'felicia-missile':Object.freeze({actor:'felicia',damage:52,reach:550,windup:900,recovery:1120,focus:70,missile:true,groundOnly:true,visual:'jab'}),
    'mike-breaker':Object.freeze({actor:'mike',damage:32,reach:105,windup:170,recovery:500,launch:true,vx:1.3,vy:-9.8,focus:30,groundOnly:true,visual:'uppercut'}),
    'mike-sweep':Object.freeze({actor:'mike',damage:26,reach:115,windup:140,recovery:450,low:true,knockdown:true,focus:35,groundOnly:true,visual:'sweep'}),
    'k-rise':Object.freeze({actor:'k',damage:24,reach:110,windup:100,recovery:390,launch:true,vx:1,vy:-10,focus:30,groundOnly:true,visual:'uppercut'}),
    'k-descent':Object.freeze({actor:'k',damage:30,reach:110,windup:110,recovery:440,slam:true,knockdown:true,downward:true,focus:40,playerAirOnly:true,visual:'air-slam'}),
    'iona-flurry':Object.freeze({actor:'iona',damage:7,reach:135,windup:80,recovery:410,contacts:Object.freeze([80,150,220]),focus:30,visual:'cross'}),
    'iona-burst':Object.freeze({actor:'iona',damage:7,reach:380,windup:100,recovery:530,contacts:Object.freeze([100,190,280]),focus:50,ranged:true,visual:'jab'}),
    'felicia-sweep':Object.freeze({actor:'felicia',damage:18,reach:125,windup:100,recovery:340,low:true,knockdown:true,focus:25,groundOnly:true,evade:8,visual:'sweep'}),
    'felicia-precision':Object.freeze({actor:'felicia',damage:28,reach:140,windup:80,recovery:330,focus:40,visual:'kick'}),
    jab:Object.freeze({damage:14,reach:76,windup:70,recovery:230}),
    cross:Object.freeze({damage:18,reach:76,windup:70,recovery:230}),
    launcher:Object.freeze({damage:24,reach:80,windup:70,recovery:230,launch:true,vx:1.4,vy:-9.6}),
    uppercut:Object.freeze({damage:20,reach:82,windup:80,recovery:270,launch:true,vx:.9,vy:-9.8}),
    low:Object.freeze({damage:12,reach:76,windup:65,recovery:210,low:true}),
    kick:Object.freeze({damage:22,reach:104,windup:100,recovery:300,launch:true,vx:1.8,vy:-8.8}),
    'rising-kick':Object.freeze({damage:26,reach:94,windup:110,recovery:320,launch:true,vx:1,vy:-10.2}),
    sweep:Object.freeze({damage:16,reach:96,windup:90,recovery:300,low:true,knockdown:true}),
    air:Object.freeze({damage:14,reach:112,windup:70,recovery:230}),
    'air-kick':Object.freeze({damage:18,reach:102,windup:70,recovery:230}),
    'air-slam':Object.freeze({damage:22,reach:98,windup:85,recovery:260,slam:true}),
    'air-down':Object.freeze({damage:12,reach:96,windup:50,recovery:180,downward:true,visual:'air-slam'}),
    'bicycle-kick':Object.freeze({damage:6,reach:108,windup:75,recovery:340,contacts:Object.freeze([75,145,215]),airOnly:true,actor:'iona',visual:'air-kick'})
  });
  function target(n,k,grab,move={}){
    const c=state(n),cx=n.x+n.w/2,face=move.face||n.face||1;
    return (n.enemies||[]).filter(e=>{
      if(!e.alive||e.hp<=0)return false;
      const ec=enemy(e),dx=e.x+e.w/2-cx,feet=(e.y+e.h)-(n.y+n.h);
      if(ec.held||ec.recoverUntil>c.time)return false;
      if(move.onlyEnemy&&e!==move.onlyEnemy||move.airOnly&&!ec.air)return false;
      if(grab){if(e.hover||e.grabbable===false||Math.abs(dx)>=RULES.grabReach||dx*face<=-12)return false;
        if(n.onGround)return !ec.air&&Math.abs(feet)<=18;
        return ec.air&&!ec.locked&&ec.airHits<RULES.maxAirHits&&Math.abs(feet)<=45;
      }
      if(move.low&&(ec.air||e.hover))return false;
      const follow=!!(c.follow&&c.follow.engaged&&c.follow.enemy===e&&ec.air&&!ec.locked);
      const vertical=move.ranged?45:move.downward?130:follow?RULES.followVertical:(move.launch?120:n.onGround?65:92);
      if(move.downward&&feet<-18)return false;
      return Math.abs(feet)<vertical&&dx*face>-10&&Math.abs(dx)<(move.reach||76);
    }).sort((a,b)=>Math.abs(a.x+a.w/2-cx)-Math.abs(b.x+b.w/2-cx))[0]||null;
  }
  function focus(n){return clamp(Number(state(n).focus)||0,0,100);}
  function has(n,id){return !!root.TechOpsNightProgression?.has(n,id);}
  function gainFocus(n,amount){state(n).focus=clamp(focus(n)+amount,0,100);}
  function special(n,slot,k={},buffered=false){
    if(!active(n)||inputBlocked()||n.drive||n.hp<=0||n.block||![1,2].includes(slot))return false;
    const c=state(n);if(c.grab||n.dashT>0||c.stunUntil>c.time)return false;
    if(c.attack){
      const a=c.attack,entry=root.TechOpsNightProgression?.selected(n,slot);
      if(c.time-a.at>=a.duration-RULES.buffer&&!a.buffer&&entry&&has(n,entry[0]))
        a.buffer={specialSlot:slot,keys:Object.assign({},readInput(k)),actor:actor(n),skill:entry[0]};
      return false;
    }
    const entry=root.TechOpsNightProgression?.selected(n,slot);
    if(!entry||!has(n,entry[0])){say(n,'LEARN THIS MOVE · STATS & SKILLS');return false;}
    const move=MOVES[entry[1].move];if(move.groundOnly&&!n.onGround||move.playerAirOnly&&n.onGround){say(n,move.groundOnly?'GROUND MOVE · LAND FIRST':'AIR MOVE · JUMP FIRST');return false;}
    if(focus(n)<move.focus){say(n,'NEED '+move.focus+' FOCUS · LAND ATTACKS');return false;}
    // Failed prerequisites must not consume the slide or gravity window.
    if(c.slide&&!cancelSlide(n))return false;
    if(c.gravity)c.gravity=null;
    faceInput(n,buffered?k:readInput(k));gainFocus(n,-move.focus);c.dash=null;c.lastInput=c.time;
    c.attack={kind:entry[1].move,stage:0,beat:false,at:c.time,hit:false,contactIndex:0,connected:false,launch:!!move.launch,windup:move.windup,duration:Math.max((move.contacts?.at(-1)||move.windup)+45,move.recovery*(root.TechOpsNightProgression?.modifiers(n).recovery||1)),face:n.face||1};
    if(move.missile){const e=target(n,{},false,{face:n.face,reach:move.reach});c.attack.impactX=clamp(e?e.x+e.w/2:n.x+n.w/2+(n.face||1)*220,30,1770);c.attack.impactY=e?e.y+e.h/2:n.y+n.h-17;}
    if(move.evade)n.ifr=Math.max(n.ifr||0,move.evade);n.jabAnim=20;event(n,'special',null,{kind:entry[1].move});say(n,entry[1].name+' · −'+move.focus+' FOCUS');return true;
  }
  function clearChain(n){const c=state(n);c.hits=0;c.stage=0;c.beat=false;c.lastHit=-10000;n.combo=0;}
  function cancel(n){if(!active(n))return;const c=state(n);if(c.grab){const ec=enemy(c.grab.enemy);ec.held=false;ec.stunUntil=c.time+180;}c.grab=null;c.attack=null;c.notes=[];c.dash=null;c.slide=null;c.gravity=null;c.follow=null;n.jabAnim=0;clearChain(n);}
  function dash(n,face){
    if(!active(n)||inputBlocked())return false;
    const c=state(n);if(n.drive||n.hp<=0||n.block||n.dashCD>0||c.grab||c.attack||c.stunUntil>c.time)return false;
    face=face<0?-1:1;n.face=face;n.dashT=10;n.dashCD=42*(root.TechOpsNightProgression?.modifiers(n).dash||1)*(has(n,'feliciaFootwork')?.85:1);n.ifr=Math.max(n.ifr||0,12);n.vx=face*9.5;
    c.dash={at:c.time,until:c.time+RULES.dashGrabWindow,face,spent:false};event(n,'dash');sound('dash');return true;
  }
  // Slide has no invulnerability and shares dash cooldown. A deliberate jump
  // or attack after startup cancels it; held directions cannot chain slides.
  function slide(n,face){
    if(!active(n)||inputBlocked()||!n.onGround)return false;
    const c=state(n);if(n.drive||n.hp<=0||n.block||n.dashCD>0||c.grab||c.attack||c.slide||c.stunUntil>c.time)return false;
    face=face<0?-1:1;n.face=face;n.dashCD=48;n.vx=face*7.2;c.dash=null;c.slide={at:c.time,until:c.time+500,face};event(n,'slide');return true;
  }
  function cancelSlide(n){if(!active(n))return false;const c=state(n);if(!c.slide||c.time-c.slide.at<100)return false;c.slide=null;n.vx=Math.max(-4.8,Math.min(4.8,n.vx));event(n,'slide-cancel');return true;}
  // One airborne gravity cancel per jump sequence. No invulnerability or extra
  // jump; it spends dash cooldown and can cancel only a confirmed attack.
  function gravityCancel(n){
    if(!active(n)||inputBlocked()||n.onGround)return false;
    const c=state(n),a=c.attack,move=a&&MOVES[a.kind];
    if(n.drive||n.hp<=0||n.block||n.dashCD>0||c.grab||c.slide||c.gravity||c.gravityUsed||c.stunUntil>c.time)return false;
    if(a&&(!a.connected||(move?.contacts&&!a.finished&&a.contactIndex<move.contacts.length)))return false;
    if(a){c.attack=null;n.jabAnim=0;}c.dash=null;c.gravityUsed=true;c.gravity={at:c.time,until:c.time+180};n.dashCD=60;n.vy=0;n.vx=clamp(n.vx||0,-3.4,3.4);event(n,'gravity-cancel');say(n,'GRAVITY CANCEL · ATTACK NOW');return true;
  }
  function damage(n,e,value,kind,flags){if(!e.alive||e.hp<=0)return false;value*=root.TechOpsNightProgression?.modifiers(n).damage||1;if(kind==='throw'&&has(n,'mikeGrip'))value*=1.1;if(!n.onGround&&has(n,'kAir'))value*=1.12;const c=state(n),ec=enemy(e);e.hp=Math.max(0,e.hp-Math.round(value));e.hitT=8;e.windup=0;ec.stunUntil=Math.max(ec.stunUntil,c.time+RULES.stun);n.hitStop=Math.max(n.hitStop||0,kind==='throw'||kind==='launcher'?5:3);event(n,kind,e,Object.assign({damage:Math.round(value)},flags||{}));if(root.TechOpsArtHandoff)root.TechOpsArtHandoff.impact(n,e,kind==='jab'?'hit':'finisher',wallClock());sound('hit');if(e.hp<=0){e.alive=false;ec.held=false;n.kills=(n.kills||0)+1;const cash=e.cash||[0,0],pay=cash[0]+Math.floor(Math.random()*(cash[1]-cash[0]+1));n.cash=(n.cash||0)+pay;event(n,'ko',e,{cash:pay});if(root.TechOpsNightProgression)root.TechOpsNightProgression.defeat(n,e);say(n,'KNOCKOUT · +$'+pay);if(typeof root.nmCheckClear==='function')root.nmCheckClear();}return true;}
  function lift(n,e,vx,vy,thrown){const c=state(n),ec=enemy(e);ec.held=false;ec.air=true;ec.airHits=0;ec.locked=false;ec.vx=vx;ec.vy=vy;ec.thrown=thrown;ec.flightHits=[];ec.wallHit=false;ec.stunUntil=c.time+450;e.launch=0;e.down=0;e.kb=0;c.follow={enemy:e,engaged:false};}
  function throwHeld(n,dir){
    const c=state(n),g=c.grab;if(!g)return false;
    if(c.time-g.at<120){g.pending=dir;return false;}
    const e=g.enemy;c.grab=null;if(!e.alive){enemy(e).held=false;return false;}
    const sign=dir==='left'?-1:dir==='right'?1:(n.face||1);n.face=sign;
    e.x=clamp(n.x+(sign>0?n.w+3:-e.w-3),0,1800-e.w);e.y=n.y+n.h-e.h;
    // A side toss still collides with crowds, but stays inside a jump's reach.
    lift(n,e,dir==='up'?sign*.9:dir==='down'?0:sign*2.8,dir==='up'?-9.8:dir==='down'?3:-8.8,true);
    if(g.air){const ec=enemy(e);ec.airHits=RULES.maxAirHits;ec.locked=true;if(dir==='down')ec.vy=10;}
    else if(dir==='down')enemy(e).locked=true;
    damage(n,e,dir==='up'?16:dir==='down'?22:24,'throw');
    c.attack={kind:dir==='up'?'throw-up':dir==='down'?'throw-down':'throw',at:c.time,hit:true,connected:true,launch:dir!=='down',stage:0,duration:270,face:sign};
    n.jabAnim=17;c.hits++;c.lastHit=c.time;n.combo=c.hits;n.comboT=wallClock()+RULES.chainLife;
    say(n,dir==='up'?'LAUNCH · JUMP + ATTACK':dir==='down'?'SLAM':'THROW · LINE THEM UP');return true;
  }
  // Legacy callers retain their walk-in grab shortcut. The explicit input
  // adapter dispatches punch/kick/grab, so a directional punch is never a grab.
  function attack(n,k={},action='legacy'){
    if(!active(n)||inputBlocked()||!['legacy','punch','kick','grab'].includes(action))return false;try{if(root.TechOpsCombatAudio)root.TechOpsCombatAudio.unlock();}catch(_){}
    const c=state(n);if(n.drive||n.block||n.hp<=0||c.stunUntil>c.time||root.S&&(root.S.inDialog||root.S.inBattle))return false;
    k=readInput(k);
    if(c.slide&&!cancelSlide(n))return false;
    if(c.grab)return throwHeld(n,direction(k)||((n.face||1)<0?'left':'right'));
    if(c.attack){const age=c.time-c.attack.at;if(age>=c.attack.duration-RULES.buffer&&!c.attack.buffer)c.attack.buffer={at:c.time,keys:Object.assign({},k),action};return false;}
    return begin(n,k,c.time,action);
  }
  function begin(n,k,pressedAt,action='legacy'){
    const c=state(n);faceInput(n,k);
    const dir=direction(k),implicit=action==='legacy'&&n.onGround&&(dir==='left'||dir==='right');
    const dashGrab=c.dash&&!c.dash.spent&&c.time<=c.dash.until&&n.onGround&&dir!=='up'&&dir!=='down'&&(n.face||1)===c.dash.face;
    const e=(action==='grab'||implicit||dashGrab)?target(n,k,true):null;
    if(c.dash)c.dash.spent=true;
    if(e){
      n.face=e.x+e.w/2<n.x+n.w/2?-1:1;const ec=enemy(e);ec.held=true;e.windup=0;e.kb=0;
      c.grab={enemy:e,at:c.time,entry:dir,armed:false,air:!n.onGround};n.vx=0;n.dashT=0;event(n,'grab',e,{fromDash:!!dashGrab});say(n,n.onGround?'GRABBED · ← / → THROW · ↑ LAUNCH · ↓ SLAM':'AIR GRAB · DIRECTION TO FINISH');return true;
    }
    if(action==='grab'){clearChain(n);event(n,'grab-miss');say(n,n.onGround?'GRAB · GET CLOSE TO A GROUNDED ENEMY':'AIR GRAB · GET CLOSE TO A LAUNCHED ENEMY');return false;}
    const gap=pressedAt-c.lastInput,connected=c.lastHit>=0&&c.time-c.lastHit<RULES.chainLife;
    const beat=connected&&gap>=RULES.beatMin&&gap<=RULES.beatMax+(root.TechOpsNightProgression?.modifiers(n).combo||0);
    const eq=root.v733&&root.v733.equipped?root.v733.equipped():[];
    const stage=beat?(c.stage+1)%3:0;
    const f=c.follow,fe=f&&f.enemy,fec=fe&&enemy(fe);
    const followAir=!!(f&&f.engaged&&fe&&fe.alive&&n.enemies.includes(fe)&&fec.air&&!fec.locked&&Math.abs((fe.y+fe.h)-(n.y+n.h))<RULES.followVertical);
    const groundedCancel=!!(c.gravity&&action!=='grab');if(groundedCancel)c.gravity=null;
    let kind;
    if((!n.onGround||followAir)&&!groundedCancel)kind=action==='kick'?(dir==='down'?'air-slam':dir==='up'&&actor(n)==='iona'?'bicycle-kick':'air-kick'):(dir==='down'?'air-down':'air');
    else if(action==='kick')kind=dir==='up'?'rising-kick':dir==='down'?'sweep':'kick';
    else kind=dir==='up'?'uppercut':dir==='down'?'low':stage===2||stage===1&&eq.includes('pivot')?'launcher':stage===1?'cross':'jab';
    const move=MOVES[kind];c.lastInput=pressedAt;
    c.attack={kind,stage,beat,at:c.time,hit:false,contactIndex:0,connected:false,launch:!!move.launch,windup:move.windup,duration:Math.max((move.contacts?.at(-1)||move.windup)+45,move.recovery*(root.TechOpsNightProgression?.modifiers(n).recovery||1)),face:n.face||1};
    n.jabAnim=16;n.jabStage=stage+1;n.lastJab=wallClock();event(n,'windup',null,{kind});return true;
  }
  // A confirmed launcher may cancel recovery into a player-requested jump.
  // No auto-jump, whiff reward, target teleport or extra simulation loop.
  function jumpCancel(n){
    if(!active(n))return false;const c=state(n),a=c.attack;
    if(!n.onGround||c.grab||c.stunUntil>c.time||!a||!a.connected||!a.launch)return false;
    c.attack=null;n.jabAnim=0;
    const f=c.follow;if(f&&f.enemy.alive&&enemy(f.enemy).air){f.engaged=true;const dx=f.enemy.x+f.enemy.w/2-n.x-n.w/2;n.vx=clamp(dx*.045,-3.4,3.4);}
    return true;
  }
  // Bounded drift toward the launched target, only after the player jumps.
  // Directional input owns movement; no snapping, auto-hop or extra air hits.
  function followAir(n,dt,k){
    const c=state(n),f=c.follow;if(!f)return;
    const e=f.enemy,ec=enemy(e);
    if(!e.alive||!n.enemies.includes(e)||!ec.air||ec.locked){c.follow=null;return;}
    if(!f.engaged||n.onGround||k.a||k.d||k.arrowleft||k.arrowright)return;
    const dx=e.x+e.w/2-n.x-n.w/2,dy=e.y+e.h-n.y-n.h;
    if(Math.abs(dx)>160||Math.abs(dy)>RULES.followVertical)return;
    const desired=clamp(ec.vx+(dx-(n.face||1)*38)*.05,-3.4,3.4),amount=.28*Math.min(Math.max(dt||0,0),.05)*60;
    n.vx+=(clamp(desired-(n.vx||0),-amount,amount));
  }
  function specialContact(n,e,value,kind,face,knockdown){
    const c=state(n),ec=enemy(e);if(!e.alive||ec.held||ec.locked)return false;
    if(!damage(n,e,value,kind))return false;
    if(ec.air){ec.airHits++;ec.locked=knockdown||ec.airHits>=RULES.maxAirHits;ec.vy=ec.locked?10:-3;ec.vx=face;}
    else{e.kb=face*2;ec.stunUntil=c.time+(knockdown?420:200);if(knockdown)ec.recoverUntil=c.time+420;}
    return true;
  }
  function tickNotes(n,dt){const c=state(n);if(actor(n)!=='felicia'){c.notes=[];return;}
    c.notes=(c.notes||[]).filter(p=>{
      const distance=Math.min(700*Math.max(0,Math.min(dt||0,.05)),420-p.travel),old=p.x,next=old+p.face*distance;
      p.travel+=distance;p.x=next;
      // Swept collision prevents fast notes skipping a target or platform.
      const lo=Math.min(old,next)-5,hi=Math.max(old,next)+5;
      const wall=(n.platforms||[]).filter(b=>p.y>=b.y&&p.y<=b.y+(b.h||12)&&hi>=b.x&&lo<=b.x+b.w).sort((a,b)=>Math.abs(a.x-old)-Math.abs(b.x-old))[0];
      const hits=(n.enemies||[]).filter(e=>e.alive&&!enemy(e).held&&!enemy(e).locked&&p.y>=e.y-5&&p.y<=e.y+e.h+5&&hi>=e.x&&lo<=e.x+e.w).sort((a,b)=>p.face>0?a.x-b.x:b.x-a.x);
      const e=hits[0],wallEdge=wall&&(p.face>0?wall.x:wall.x+wall.w),enemyEdge=e&&(p.face>0?e.x:e.x+e.w);
      if(wall&&(!e||p.face>0&&wallEdge<=enemyEdge||p.face<0&&wallEdge>=enemyEdge))return false;
      if(e){specialContact(n,e,9,'felicia-notes',p.face,false);return false;}
      return p.travel<420&&next>=0&&next<=1800;
    });
  }
  function strike(n,a){
    const c=state(n),move=MOVES[a.kind]||MOVES.jab;
    if(move.notes){c.notes=c.notes||[];if(c.notes.length<6)c.notes.push({x:n.x+n.w/2+a.face*16,y:n.y+n.h-20,face:a.face,travel:0});event(n,'note-release');return;}
    if(move.missile){event(n,'missile-impact',null,{x:a.impactX,y:a.impactY});for(const e of n.enemies||[])if(Math.abs(e.x+e.w/2-a.impactX)<=85&&Math.abs(e.y+e.h/2-a.impactY)<=60)specialContact(n,e,move.damage,a.kind,a.face,true);a.finished=true;return;}
    if(a.target&&(!a.target.alive||!n.enemies.includes(a.target)||enemy(a.target).locked)){a.finished=true;return;}
    const e=target(n,{},false,Object.assign({face:a.face,onlyEnemy:a.target},move));
    if(!e){a.finished=true;if(!a.contactIndex){clearChain(n);event(n,'whiff');sound('ping');}return;}
    // A horizontal burst cannot pass through a platform at muzzle height.
    // Check every contact so a moving target or newly intervening cover matters.
    if(move.ranged){const from=n.x+n.w/2,to=e.x+e.w/2,y=n.y+n.h-20,lo=Math.min(from,to),hi=Math.max(from,to);
      if((n.platforms||[]).some(p=>y>=p.y&&y<=p.y+(p.h||12)&&p.x+p.w>lo&&p.x<hi)){a.finished=true;if(!a.contactIndex){clearChain(n);event(n,'whiff');sound('ping');}return;}}
    const ec=enemy(e);if(ec.air&&ec.locked){clearChain(n);event(n,'whiff');return;}
    if(move.contacts)a.target=e;
    const eq=root.v733&&root.v733.equipped?root.v733.equipped():[];
    let value=move.damage+(a.beat&&!a.contactIndex?3:0);
    const shield=e.blocks&&a.kind==='jab'&&!a.beat&&!ec.air&&ec.stunUntil<=c.time;
    if(shield){value=5;clearChain(n);event(n,'guard',e);say(n,'GUARD · GRAB OR AIM LOW');}
    else{c.hits++;c.stage=a.stage;c.beat=a.beat;c.lastHit=c.time;n.combo=c.hits;n.comboT=wallClock()+RULES.chainLife;if(a.beat)n.perfectT=wallClock()+550;}
    if(eq.includes('orbital')&&(ec.air||move.launch)){e.marked=true;value+=4;}
    a.connected=damage(n,e,value,a.kind,{guarded:!!shield})&&!shield;
    if(a.connected&&!move.focus)gainFocus(n,8+(a.beat?4:0)+(has(n,'ionaRhythm')&&['jab','cross','low','air','air-down'].includes(a.kind)?4:0));
    if(a.connected&&c.follow&&c.follow.enemy===e)c.follow=null;
    if(move.focus)say(n,Object.values(root.TechOpsNightProgression?.SKILLS||{}).find(s=>s.move===a.kind)?.name||'SPECIAL');
    if(move.ranged)event(n,'burst-trace',e,{from:n.x+n.w/2,fy:n.y+n.h-20});
    if(!e.alive){a.finished=true;return;}
    // Air reactions come FIRST: a second uppercut must not reset the juggle cap.
    if(ec.air){
      ec.airHits++;ec.vx=a.face*1.5;ec.locked=!!move.slam||ec.airHits>=RULES.maxAirHits;
      // A confirmed contact supplies enough shared lift for a human touch
      // follow-up after recovery, including slower WebKit input frames.
      ec.vy=ec.locked?10:move.downward?4.2:-5.8;
      if(!ec.locked){
        c.follow={enemy:e,engaged:true};
        if(!n.onGround&&!move.downward){n.vy=-5.8;n.vx=a.face*1.5;}
      }
      if(ec.locked)a.finished=true;
      say(n,ec.locked?'AIR FINISH · SLAM':move.downward?'DOWN LIGHT · FOLLOW THE LANDING':a.kind==='bicycle-kick'?'BICYCLE · '+ec.airHits+' / '+RULES.maxAirHits:'AIR '+ec.airHits+' / '+RULES.maxAirHits);
    }else if(move.launch&&!shield){
      lift(n,e,a.face*move.vx,move.vy,false);say(n,a.kind==='uppercut'?'UPPERCUT · JUMP TO FOLLOW':a.kind==='rising-kick'?'RISING KICK · JUMP TO FOLLOW':a.kind==='kick'?'KICK LAUNCH · JUMP TO FOLLOW':'RISING FINISH · JUMP TO FOLLOW');
    }else if(move.knockdown){
      e.kb=a.face*3;ec.stunUntil=c.time+420;ec.recoverUntil=c.time+420;say(n,'LOW SWEEP');
    }else{
      e.kb=a.face*(shield?1.5:3);ec.stunUntil=c.time+(a.beat?360:RULES.stun);
      if(!shield)say(n,move.low?'LOW STRIKE':a.beat?'ON BEAT · '+(a.stage===1?'CROSS':'JAB'):'JAB · TAP ON THE GOLD BEAT');
    }
    if(eq.includes('telemetry')&&c.hits>=5)e.showHp=wallClock()+4000;
    if(a.beat&&eq.includes('intercept'))e.exposed=wallClock()+2500;
    c.relay=a.beat?(c.relay||0)+1:0;if(eq.includes('relay')&&c.relay>=3){n.dashCD=0;c.relay=0;say(n,'LOW-ORBIT RELAY · DASH READY');}
    if(move.focus)say(n,Object.values(root.TechOpsNightProgression?.SKILLS||{}).find(s=>s.move===a.kind)?.name||'SPECIAL');
  }
  function tick(n,dt,k){if(!active(n))return {locked:false};if(n.drive||inputBlocked())return {locked:true};const c=state(n);k=readInput(k);c.time+=(Number.isFinite(dt)?Math.min(Math.max(dt,0),.05):0)*1000;
    if(c.slide&&c.time>=c.slide.until)c.slide=null;
    if(n.onGround){c.gravity=null;c.gravityUsed=false;}else if(c.gravity&&c.time>=c.gravity.until)c.gravity=null;
    if(c.grab){const g=c.grab,ec=enemy(g.enemy),dir=direction(k);if(!g.enemy.alive||!n.enemies.includes(g.enemy)||c.time-g.at>RULES.grabLife){ec.held=false;ec.stunUntil=c.time+180;c.grab=null;event(n,'escape',g.enemy);}else{g.enemy.x=clamp(n.x+(n.face>0?n.w+3:-g.enemy.w-3),0,1800-g.enemy.w);g.enemy.y=n.y+n.h-g.enemy.h;ec.stunUntil=c.time+180;if(!dir)g.armed=true;if(g.pending)throwHeld(n,g.pending);else if(dir&&(g.armed||dir!==g.entry))throwHeld(n,dir);}}
    if(c.attack){const a=c.attack,age=c.time-a.at;n.jabAnim=Math.max(1,(a.duration-age)/16);const move=MOVES[a.kind]||{};if(move.actor&&actor(n)!==move.actor)a.finished=true;const contacts=a.hit&&a.contactIndex===undefined?[]:move.contacts||[a.windup||RULES.windup];while(!a.finished&&(a.contactIndex||0)<contacts.length&&age>=contacts[a.contactIndex||0]){a.hit=true;strike(n,a);a.contactIndex=(a.contactIndex||0)+1;}if(age>=a.duration){const queued=a.buffer;c.attack=null;n.jabAnim=0;if(queued&&c.stunUntil<=c.time){if(queued.specialSlot){if(actor(n)===queued.actor&&root.TechOpsNightProgression?.selected(n,queued.specialSlot)?.[0]===queued.skill)special(n,queued.specialSlot,queued.keys,true);}else begin(n,queued.keys,queued.at,queued.action);}}}
    tickNotes(n,dt);
    followAir(n,dt,k);
    if(c.time-c.lastHit>RULES.chainLife)clearChain(n);c.fx=c.fx.filter(e=>c.time-e.time<650);
    return {locked:!!c.grab||c.stunUntil>c.time};
  }
  function stepEnemy(n,e,dt){if(!active(n))return false;const c=state(n),ec=enemy(e),f=(Number.isFinite(dt)?Math.max(0,Math.min(dt,.05)):0)*60;e.hitT=Math.max(0,(e.hitT||0)-f);
    if(ec.held){e.windup=0;return true;}
    if(ec.air){const oldBottom=e.y+e.h;ec.vy=Math.min(13,ec.vy+.43*f);e.x+=ec.vx*f;e.y+=ec.vy*f;ec.vx*=Math.pow(.99,f);if(e.x<0||e.x+e.w>1800){e.x=clamp(e.x,0,1800-e.w);ec.vx*=-.45;if(!ec.wallHit){ec.wallHit=true;damage(n,e,8,'wall');}}
      if(ec.thrown)for(const other of n.enemies||[]){if(other===e||!other.alive||enemy(other).held||ec.flightHits.includes(enemy(other).id))continue;if(e.x<other.x+other.w&&e.x+e.w>other.x&&e.y<other.y+other.h&&e.y+e.h>other.y){ec.flightHits.push(enemy(other).id);damage(n,other,18,'collision');other.kb=Math.sign(ec.vx)*5;}}
      let floor=430;for(const p of n.platforms||[])if(ec.vy>=0&&oldBottom<=p.y&&e.y+e.h>=p.y&&e.x+e.w>p.x&&e.x<p.x+p.w)floor=Math.min(floor,p.y);
      if(e.y+e.h>=floor&&ec.vy>=0){e.y=floor-e.h;ec.air=false;ec.thrown=false;ec.recoverUntil=c.time+420;ec.stunUntil=c.time+420;ec.airHits=0;if(c.follow&&c.follow.enemy===e)c.follow=null;event(n,'land',e);if(ec.locked)damage(n,e,8,'slam');ec.locked=false;}
      return true;
    }
    if(ec.stunUntil>c.time||ec.recoverUntil>c.time){e.windup=0;const decay=Math.pow(.7,f);e.x=clamp(e.x+(e.kb||0)*(1-decay)/.3,0,1800-e.w);e.kb=(e.kb||0)*decay;return true;}return false;
  }
  function blockedContact(n,e){if(active(n)){gainFocus(n,4);event(n,'block',e);}}
  function hurt(n){if(!active(n))return;cancel(n);const c=state(n);gainFocus(n,-25);c.stunUntil=c.time+180;event(n,'hurt');}
  function pose(n){
    if(!active(n))return null;const c=state(n);
    if(c.grab)return {frame:'guard0',lean:(n.face||1)*.08,shift:0};
    if(c.stunUntil>c.time)return {frame:'hit0',lean:-(n.face||1)*.12,shift:0};
    const a=c.attack;if(!a)return null;
    const age=c.time-a.at,wind=age<(a.windup||RULES.windup),power=1-clamp((age-(a.windup||RULES.windup))/180,0,1);
    const visual=MOVES[a.kind]?.visual||a.kind;const kick=/kick|sweep|slam/.test(visual),low=a.kind==='low'||a.kind==='sweep';
    return {frame:wind?'guard0':kick||a.kind==='launcher'||a.kind==='throw-up'?'heavy0':a.kind==='uppercut'?'light1':a.kind==='throw'?'light2':['light0','light1','light2'][a.stage],
      lean:a.face*(wind?-.08:low?.34*power:a.kind==='uppercut'?-.16*power:.16*power),shift:a.face*(wind?-3:9*power)};
  }
  function draw(ctx,n){if(!active(n))return;const c=state(n),W=ctx.canvas.width,calm=root.matchMedia&&root.matchMedia('(prefers-reduced-motion: reduce)').matches,hud=root.TechOpsRuntimeHud;ctx.save();ctx.font='bold '+(hud?13*hud.viewport(ctx.canvas).scaleY:11)+'px monospace';ctx.textAlign='center';
    const weapon=c.attack,weaponAge=weapon?c.time-weapon.at:0;
    if(weapon&&['iona-flurry','iona-burst'].includes(weapon.kind)&&weaponAge>=weapon.windup&&weaponAge<weapon.duration-60){
      ctx.save();ctx.translate(n.x+(n.w||22)/2-(n.cam||0),n.y+(n.h||34)-23);ctx.scale(weapon.face,1);
      if(weapon.kind==='iona-burst'){ctx.fillStyle='#7c929d';ctx.fillRect(8,-5,22,9);ctx.fillRect(18,4,6,10);ctx.fillStyle='#1a2730';ctx.fillRect(30,-3,8,4);}
      else{const swing=calm?.3:Math.sin(weaponAge/45)*1.2;ctx.rotate(swing);ctx.strokeStyle='#9ee8d0';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(8,0);ctx.lineTo(27,-4);ctx.stroke();ctx.strokeStyle='#bac7cf';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(27,-4);ctx.lineTo(35,-14);ctx.stroke();ctx.strokeStyle='#9ee8d0';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(35,-14);ctx.lineTo(49,-24);ctx.stroke();}ctx.restore();
    }
    for(const p of c.notes||[]){ctx.fillStyle='#9fe4ff';ctx.font='bold 24px serif';ctx.fillText('♪',p.x-(n.cam||0),p.y+8);}
    if(weapon?.kind==='felicia-notes'){const x=n.x+(n.w||22)/2-(n.cam||0),y=n.y+(n.h||34)-28;ctx.save();ctx.translate(x,y);ctx.scale(weapon.face,1);ctx.fillStyle='#b8743d';ctx.beginPath();ctx.ellipse(14,0,7,12,-.6,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#ebd7b2';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(5,-13);ctx.lineTo(30,8);ctx.stroke();ctx.strokeStyle='#623c25';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(16,-6);ctx.lineTo(27,-18);ctx.stroke();ctx.restore();}
    if(weapon?.kind==='felicia-missile'&&weaponAge<900){
      const x=weapon.impactX-(n.cam||0),y=weapon.impactY;ctx.strokeStyle='#f1c96b';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y+16,85,14,0,0,Math.PI*2);ctx.stroke();ctx.font='bold 11px monospace';ctx.fillStyle='#ffe3a5';ctx.fillText('MR. KALI · INBOUND',x,y-46);
      // Provisional long-haired black cat silhouette at Felicia's feet.
      const catX=n.x-(n.cam||0)-20,catY=n.y+(n.h||34)-9;ctx.fillStyle='#10151e';ctx.strokeStyle='#8893aa';ctx.beginPath();ctx.ellipse(catX,catY,13,9,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(catX+3,catY-3);ctx.lineTo(catX+4,catY-20);ctx.lineTo(catX+10,catY-14);ctx.lineTo(catX+16,catY-20);ctx.lineTo(catX+17,catY-3);ctx.closePath();ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(catX-10,catY);ctx.quadraticCurveTo(catX-28,catY-24,catX-25,catY-8);ctx.stroke();ctx.fillStyle='#91e5a5';ctx.fillRect(catX+7,catY-10,2,2);ctx.fillRect(catX+12,catY-10,2,2);
      if(weaponAge>550){const my=y-190+(weaponAge-550)/350*190;ctx.fillStyle='#a4bac6';ctx.fillRect(x-5,my-23,10,23);ctx.fillStyle='#ffb662';ctx.beginPath();ctx.moveTo(x-5,my);ctx.lineTo(x+5,my);ctx.lineTo(x,my+9);ctx.closePath();ctx.fill();}
    }
    for(const fx of c.fx)if(fx.type==='missile-impact'&&c.time-fx.time<300){ctx.strokeStyle='#ffd58a';ctx.lineWidth=calm?2:4;ctx.beginPath();ctx.ellipse(fx.x-(n.cam||0),fx.y,85,40,0,0,Math.PI*2);ctx.stroke();}
    ctx.font='bold '+(hud?13*hud.viewport(ctx.canvas).scaleY:11)+'px monospace';
    for(const fx of c.fx){if(fx.type==='burst-trace'&&c.time-fx.time<75){ctx.strokeStyle='#ffe1a1';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(fx.from-(n.cam||0),fx.fy);ctx.lineTo(fx.x-(n.cam||0),fx.y);ctx.stroke();}}
    for(const e of n.enemies||[]){const ec=enemy(e);if(!e.alive)continue;const x=e.x+e.w/2-(n.cam||0),y=e.y-60;if(ec.held){ctx.fillStyle='#ffd166';ctx.fillText('GRAB',x,y);}else if(ec.stunUntil>c.time&&!ec.air){ctx.fillStyle='#ffd166';for(let i=0;i<3;i++)ctx.fillRect(x-12+i*10,y+(calm?0:Math.sin(c.time/100+i)*3),4,4);}}
    for(const e of c.fx){const age=c.time-e.time;if(!MOVES[e.type]?.focus&&!['jab','cross','launcher','uppercut','low','kick','rising-kick','sweep','air','air-kick','air-slam','air-down','bicycle-kick','throw','collision','slam','wall','ko'].includes(e.type))continue;ctx.globalAlpha=Math.max(0,1-age/450);ctx.fillStyle=e.type==='ko'?'#ffd166':'#fff2cd';ctx.fillText(e.type==='ko'?'KO':String(e.damage||''),e.x-(n.cam||0),e.y-45-(calm?0:age/25));}ctx.globalAlpha=1;
    // The passive screen-space HUD draws the rhythm bar with status/captions.
    // World-attached grab and damage feedback above keep their world anchors.
    if(hud&&hud.handles(n)){ctx.restore();return;}
    const dashReady=c.dash&&!c.dash.spent&&c.time<=c.dash.until;
    if(!c.grab&&!c.attack&&!c.hits&&!dashReady&&c.stunUntil<=c.time){ctx.restore();return;}
    const width=Math.min(290,W-20),x=(W-width)/2,y=91;ctx.fillStyle='#08111de8';ctx.fillRect(x,y,width,42);ctx.fillStyle='#a9c4d9';ctx.fillText(c.grab?'← / → THROW   ↑ LAUNCH   ↓ SLAM':c.stunUntil>c.time?'RECOVER':dashReady?'DASH → ATTACK TO GRAB':c.attack?.kind==='bicycle-kick'?'BICYCLE · THREE AIR HITS MAX':c.attack?.kind==='air-down'?'DOWN LIGHT · AIM BELOW':c.attack?.kind?.startsWith('air')?'AIR COMBO · THREE HITS MAX':'↑ / ↓ AIM · JUMP TO FOLLOW',W/2,y+14);
    const age=c.time-c.lastInput,barW=width-24;ctx.fillStyle='#27354b';ctx.fillRect(x+12,y+25,barW,6);ctx.fillStyle='#b18b39';ctx.fillRect(x+12+barW*RULES.beatMin/700,y+25,barW*(RULES.beatMax-RULES.beatMin)/700,6);if(c.lastHit>=0&&age<700){ctx.fillStyle=age>=RULES.beatMin&&age<=RULES.beatMax?'#ffe39a':'#8dc6fa';ctx.fillRect(x+12+barW*age/700-2,y+23,4,10);}ctx.restore();
  }
  root.TechOpsNightCombat={VERSION:4,RULES,MOVES,focus,special,active,actor,state,attack,dash,slide,cancelSlide,gravityCancel,tick,stepEnemy,blocked:blockedContact,hurt,cancel,pose,draw,target,normalizeInput,readInput,jumpCancel,grab:(n,k)=>attack(n,k,'grab'),kick:(n,k)=>attack(n,k,'kick')};
})(typeof globalThis!=='undefined'?globalThis:this);
