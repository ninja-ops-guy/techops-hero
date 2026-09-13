/* Post-118 corridor movement. Called by the existing simulation; no loop or
 * event listeners. Route distance remains native x; lateral metres are explicit.
 */
(function(root){
 'use strict';
 if(root.TechOpsGoodDogsGrounded)return;
 const LIMIT=2.15,SPEED=3.4;
 const active=n=>Number(n&&n._v736&&n._v736.m)===5;
 const lane=(b,fallback=0)=>Number.isFinite(b&&b._gdLane)?b._gdLane:fallback;
 const screenSign=()=>root.TechOpsGoodDogs3D?.status?.().view==='crew'?-1:1;
 const within=(a,b,r=.85)=>Math.abs(lane(a)-lane(b))<=r;
 function plant(b,floor=430){if(!b)return;b.y=floor-(b.h||34);b.vy=0;b.onGround=true;b.jumps=0;b.flip=0;}
 function prepare(n,floor=430){
  if(!active(n))return false;
  if(!n._gdGrounded){n._gdLane=lane(n,-.33);if(n._v736.partner)n._v736.partner._gdLane=lane(n._v736.partner,.33);n._gdGrounded=true;}
  n.platforms=[];n._goodBoysHazards=[];plant(n,floor);plant(n._v736.partner,floor);return true;
 }
 function steer(b,axis,side,dt){
  b._gdPreviousX=b.x;b._gdPreviousLane=lane(b);
  const length=Math.max(1,Math.hypot(axis,side));axis/=length;side/=length;
  b._gdSideSpeed=side*SPEED;b._gdLane=Math.max(-LIMIT,Math.min(LIMIT,lane(b)+b._gdSideSpeed*Math.min(.05,Math.max(0,dt))));
  if(Math.hypot(axis,side)>.01)b._gdHeading=Math.atan2(side,axis);
  if(axis)b.face=Math.sign(axis);
  return axis;
 }
 function resolve(n,b=n){
  b.x=Math.max(95,Math.min(n._v736._gbAccessNodeSeized?1535:1440,b.x));
  if(lane(b)<-1.48&&b.x>1015&&b.x<1125){if(b._gdPreviousX<=1015)b.x=1015;else if(b._gdPreviousX>=1125)b.x=1125;else b._gdLane=-1.48;}
 }
 function input(n,keys,dt,local=false){
  prepare(n,typeof root.NM_FLOOR==='number'?root.NM_FLOOR:430);
  const axis=((!local&&keys.w)||keys.arrowup?1:0)-((!local&&keys.s)||keys.arrowdown?1:0);
  const side=((!local&&keys.a)||keys.arrowleft?1:0)-((!local&&keys.d)||keys.arrowright?1:0);
  return steer(n,axis*screenSign(),side*screenSign(),dt);
 }
 function follow(n,dt){
  const p=n._v736.partner;if(!p)return;
  const target=Math.max(-LIMIT,Math.min(LIMIT,lane(n)+.8)),delta=target-lane(p,.33);
  steer(p,Math.abs(p.vx||0)>.2?Math.sign(p.vx):0,Math.abs(delta)>.08?Math.max(-1,Math.min(1,delta*2)):0,dt);
  plant(p,typeof root.NM_FLOOR==='number'?root.NM_FLOOR:430);
 }
 function enemy(n,e,dt){
  if(!active(n))return true;
  if(!Number.isFinite(e._gdLane))e._gdLane=0;
  if(Math.abs(e.x-n.x)<400&&!(e.windup>0)&&!(e.down>0)){
   const delta=lane(n)-lane(e);e._gdLane+=Math.sign(delta)*Math.min(Math.abs(delta),Math.max(0,dt)*.8);
  }
  return within(n,e);
 }
 function dodgeMove(b,dt){
  const angle=b._gdDodgeHeading??b._gdHeading??((b.face||1)<0?Math.PI:0);b.vx=Math.cos(angle)*8;
  b._gdSideSpeed=Math.sin(angle)*8;b._gdLane=Math.max(-LIMIT,Math.min(LIMIT,(b._gdPreviousLane??lane(b))+b._gdSideSpeed*dt));
 }
 function dodge(n){
  if(!active(n)||n.dashCD>0||n.block)return false;
  n._gdDodgeHeading=n._gdHeading??((n.face||1)<0?Math.PI:0);n.dashT=10;n.dashCD=42;n.ifr=Math.max(n.ifr||0,12);n.vx=(n.face||1)*8;
  plant(n,typeof root.NM_FLOOR==='number'?root.NM_FLOOR:430);return true;
 }
 root.TechOpsGoodDogsGrounded={VERSION:1,LIMIT,SPEED,active,lane,screenSign,within,plant,resolve,prepare,steer,input,follow,enemy,dodge,dodgeMove};
})(typeof globalThis!=='undefined'?globalThis:this);
