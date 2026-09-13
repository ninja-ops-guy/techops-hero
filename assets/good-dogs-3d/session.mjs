import {nearest,strikeTarget,distance,guidance} from './guidance.mjs?v=20260913-guided-r1';
import '../../good_dogs_grounded.js?v=20260913-grounded-r1';
const ground=globalThis.TechOpsGoodDogsGrounded;
// Standalone playable review harness only. Production never imports this file.
// The Access Core authority is shared with the game; these providers supply the
// isolated demo's movement/combat and cannot touch a production save.
export function createSession(root=globalThis,saveData=null){
 const chars={katrin:{hp:120,maxHp:120},manchez:{hp:120,maxHp:120}};
 const c={m:5,active:'katrin',chars,partner:{x:150,y:396,w:22,h:34,vx:0,vy:0,face:1,onGround:true},sync:0};
 const n={x:190,y:396,w:22,h:34,vx:0,vy:0,face:1,hp:120,onGround:true,jumps:0,enemies:[],_v736:c};
 const facts={cell_118_reached:true,k_seen:true,k_freed:true,k_identity_status:'K_pending'};
 root.S={meta:{_v736:{m:5,k:true,waldo:false},goodDogs:facts},story:{facts},inDialog:false,inBattle:false,gameOver:false};root.NM=n;root.S.nightMode=n;root.NM_FLOOR=430;
 root.NM_KINDS={mikeindex:{hp:240,w:34,h:90},guard:{hp:60,w:28,h:70},hunter:{hp:75,w:28,h:70}};
 root.TechOpsGoodDogsCampaignState={write(key,value){facts[key]=value;}};
 root.TechOpsGoodBoysCampaignState={mission(){return root.S.meta._v736.m;},reconcile(){return true;}};
 let time=0,paused=false,complete=false,attackCD=0,dashCD=0,invulnerable=0,block=false,attackPose=0,sampleCD=0,invulnerable2=0,reviveT=0;
 let history=[],events=[],localCoop=false,p2attackCD=0;
 ground.prepare(n,430);
 function event(type,detail={}){events.push({type,...detail});}
 function setPause(value){paused=!!value;root.S.inDialog=paused;n.vx=0;c.partner.vx=0;n._gdSideSpeed=0;c.partner._gdSideSpeed=0;}
 function canAct(){return !paused&&!complete&&!root.S.gameOver;}
 function identity(player=1){return player===1?c.active:(c.active==='katrin'?'manchez':'katrin');}
 function attack(player=1){if(!canAct()||c.chars[identity(player)].hp<=0||(player===1&&block))return false;const body=player===2?c.partner:n;if(player===2?p2attackCD>0:attackCD>0)return false;
  if(player===2)p2attackCD=localCoop?.34:.8;else attackCD=.34;attackPose=.18;
  const e=strikeTarget(n,body);body._gdAttack=.22;
  if(e){const dx=e.x-body.x;body.face=dx<0?-1:1;body._gdHeading=Math.atan2((e._gdLane||0)-(body._gdLane||0),dx/60);e.hp=Math.max(0,e.hp-26);e.hitT=8;if(!e.hp)e.alive=false;c.sync=Math.min(100,c.sync+8);}
  event(e?'hit':'swing',{player});return !!e;
 }
 function dash(){if(!canAct()||c.chars[c.active].hp<=0||dashCD>0)return;dashCD=.75;n.dash=.15;n._gdDodgeHeading=n._gdHeading;invulnerable=.2;event('dash');}
 function swap(){if(!canAct()||localCoop||c.chars[identity(2)].hp<=0)return false;const p=c.partner;for(const key of ['x','y','vx','vy','face','onGround','_gdLane','_gdHeading','_gdSideSpeed','_gdPreviousX','_gdPreviousLane','_gdAttack']){const value=n[key];n[key]=p[key];p[key]=value;}n.dash=0;p.dash=0;[invulnerable,invulnerable2]=[invulnerable2,invulnerable];[attackCD,p2attackCD]=[p2attackCD,attackCD];c.active=c.active==='katrin'?'manchez':'katrin';n.hp=c.chars[c.active].hp;event('switch');return true;}
 function use(player=1){if(!canAct()||c.chars[identity(player)].hp<=0)return false;const other=identity(player===1?2:1);if(c.chars[other].hp<=0&&distance(n,c.partner)<=1.8){c.chars[other].hp=48;event('revive');return true;}if(player===2)return false;
  if(c._gbAccessNodeSeized&&n.x>=1400&&c.partner.x>=1320){complete=true;facts.cell_1984_route_open=true;event('complete');return true;}
  const ok=root.TechOpsGoodBoysAccessCoreAuthority?.seizeAccessNode()||false;if(ok){facts.cell_1984_route_open=true;event('node');}return ok;
 }
 function action(name,player=1){if(name==='attack')return attack(player);if(name==='jump')return false;if(name==='dash')return dash();if(name==='swap')return swap();if(name==='use')return use(player);return false;}
 function physics(b,axis,side,dt){
  const forward=ground.steer(b,axis,side,dt);b.vx=forward*3.4;
  if(b.dash>0){b.dash-=dt;ground.dodgeMove(b,dt);}
  b.x=Math.max(95,Math.min(c._gbAccessNodeSeized?1535:1440,b.x+b.vx*dt*60));ground.plant(b,430);ground.resolve(n,b);
 }
 function damage(amount,player=1){if(player===1?invulnerable>0:invulnerable2>0)return;const ch=c.chars[identity(player)],guarded=player===1&&block;if(ch.hp<=0)return;ch.hp=Math.max(0,ch.hp-(guarded?Math.ceil(amount*.2):amount));if(player===1){n.hp=ch.hp;invulnerable=.8;}else invulnerable2=.8;event(guarded?'block':'hurt',{player});if(c.chars.katrin.hp<=0&&c.chars.manchez.hp<=0){root.S.gameOver=true;event('down');}}
 function tick(dt,input={}){
  if(!canAct())return;dt=Math.min(.05,Math.max(0,dt));time+=dt;attackCD=Math.max(0,attackCD-dt);p2attackCD=Math.max(0,p2attackCD-dt);dashCD=Math.max(0,dashCD-dt);invulnerable=Math.max(0,invulnerable-dt);invulnerable2=Math.max(0,invulnerable2-dt);attackPose=Math.max(0,attackPose-dt);block=!!input.block;n._gdAttack=Math.max(0,(n._gdAttack||0)-dt);c.partner._gdAttack=Math.max(0,(c.partner._gdAttack||0)-dt);
  if(c.chars[c.active].hp>0)physics(n,block?0:(input.axis||0),block?0:(input.strafe||0),dt);else n.vx=0;
  const p=c.partner;
  if(c.chars[identity(2)].hp<=0)p.vx=0;else if(localCoop)physics(p,input.partnerAxis||0,input.partnerStrafe||0,dt);
  else{const delta=n.x-55-p.x;physics(p,Math.abs(delta)>35?Math.sign(delta):0,Math.max(-1,Math.min(1,(ground.lane(n)+.8-ground.lane(p))*2)),dt);}
  if(input.attack)attack();if(!localCoop&&strikeTarget(n,p))attack(2);
  if(localCoop&&Math.abs(n.x-p.x)>420){if(n.x>p.x)n.x=p.x+420;else p.x=n.x+420;}
  if(!localCoop&&c.chars[c.active].hp<=0&&c.chars[identity(2)].hp>0&&Math.abs(p.x-n.x)<110){reviveT+=dt;if(reviveT>2){c.chars[c.active].hp=48;reviveT=0;event('revive');}}else reviveT=0;
  sampleCD-=dt;if(sampleCD<=0){sampleCD=.25;history.push({time,x:n.x,lane:ground.lane(n)});history=history.filter(s=>s.time>=time-4);}
  for(const e of n.enemies){if(e.alive===false||e.hp<=0)continue;e.hitT=Math.max(0,(e.hitT||0)-dt*60);e.cooldown=(e.cooldown??1.4)-dt;
   if(e.windup>0){e.windup-=dt;if(e.windup<=0){if(Math.hypot((n.x-(e.recordedTarget??e.x))/60,ground.lane(n)-(e.recordedLane??ground.lane(e)))<1.25)damage(e.kind==='mikeindex'?20:12);if(Math.hypot((p.x-(e.recordedTarget??e.x))/60,ground.lane(p)-(e.recordedLane??ground.lane(e)))<1.25)damage(e.kind==='mikeindex'?20:12,2);e.cooldown=e.kind==='mikeindex'?1.6:1.1;event('enemy-strike');}}
   else if(e.cooldown<=0&&distance(n,e)<5){const prior=history.filter(s=>s.time<=time-.9).at(-1);e.recordedTarget=prior?prior.x:e.x;e.recordedLane=prior?prior.lane:ground.lane(e);e.windup=.9;event('warning',{kind:e.kind});}
   else{ground.enemy(n,e,dt);if(Math.abs(e.x-n.x)>100)e.x+=Math.sign(n.x-e.x)*dt*(e.kind==='mikeindex'?48:62);}
  }
  const before=n._gbMikeIndexDefeated;root.TechOpsGoodBoysAccessCoreAuthority?.tick();if(!before&&n._gbMikeIndexDefeated)event('index-defeated');
 }
 function snapshot(){return {schema:2,complete,localCoop,time,active:c.active,x:n.x,y:n.y,lane:ground.lane(n),partner:{x:c.partner.x,y:c.partner.y,lane:ground.lane(c.partner)},chars:c.chars,indexDefeated:!!n._gbMikeIndexDefeated,securitySeeded:!!n._gbAccessCoreSecuritySeeded,nodeSeized:!!c._gbAccessNodeSeized,enemies:n.enemies.map(e=>({...e})),facts:{...facts}};}
 // Resume is applied after canonical authority has initialized this NM instance.
 function restore(data){if(!data||![1,2].includes(data.schema)||!Array.isArray(data.enemies)||!Number.isFinite(data.x))return false;
  n.x=Math.max(95,Math.min(1535,data.x));n.y=Number.isFinite(data.y)?data.y:396;c.partner.x=Number.isFinite(data.partner?.x)?data.partner.x:n.x-50;c.partner.y=Number.isFinite(data.partner?.y)?data.partner.y:396;
  n._gdLane=Math.max(-ground.LIMIT,Math.min(ground.LIMIT,Number.isFinite(data.lane)?data.lane:-.33));c.partner._gdLane=Math.max(-ground.LIMIT,Math.min(ground.LIMIT,Number.isFinite(data.partner?.lane)?data.partner.lane:.33));ground.plant(n,430);ground.plant(c.partner,430);
  c.active=data.active==='manchez'?'manchez':'katrin';for(const id of ['katrin','manchez'])c.chars[id].hp=Math.max(0,Math.min(120,Number.isFinite(data.chars?.[id]?.hp)?data.chars[id].hp:120));
  n.enemies=data.enemies.filter(e=>['mikeindex','guard','hunter'].includes(e.kind));n._gbMikeIndexEncounterStarted=true;n._gbMikeIndexDefeated=!!data.indexDefeated;c._gbMikeIndexDefeated=!!data.indexDefeated;n._gbAccessCoreSecuritySeeded=!!data.securitySeeded;c._gbAccessNodeSeized=!!(data.nodeSeized&&data.indexDefeated);localCoop=!!data.localCoop;complete=!!(data.complete&&c._gbAccessNodeSeized);time=Number(data.time)||0;
  root.S.gameOver=c.chars.katrin.hp<=0&&c.chars.manchez.hp<=0;
  if(data.indexDefeated){facts.mike_index_defeated=true;facts.k_identity_status='K';}if(c._gbAccessNodeSeized)facts.cell_1984_route_open=true;return true;
 }
 return {root,n,c,guidance(){return guidance(n,{nearNode:root.TechOpsGoodBoysAccessCoreAuthority?.nearNode()||false,localCoop});},action,tick,snapshot,restore,setPause,setCoop(v){localCoop=!!v;},get paused(){return paused;},get complete(){return complete;},get localCoop(){return localCoop;},get time(){return time;},drainEvents(){const e=events;events=[];return e;}};
}
