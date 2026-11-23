/* Render-time interpolation. The 10 Hz mission, inputs and saved state stay authoritative. */
(function(root){
 'use strict';
 function clamp(v){return Math.max(0,Math.min(1,v));}
 function create(){
  let previous=null,current=null,distance=0,start=0,frozen=false;
  function reset(m){previous=current=m;distance=start=0;frozen=false;}
  function commit(a,b){
   const dt=b.elapsed-a.elapsed,dx=b.player.x-a.player.x;
   if(current!==a||a.player.sector!==b.player.sector||dt<0||dt>.251||Math.abs(dx)>110*dt+.001||a.travel||b.travel){reset(b);return;}
   previous=a;current=b;frozen=false;start=distance;distance+=Math.abs(dx);
  }
  function sample(m,alpha,freeze){
   if(current!==m)reset(m);
   if(freeze)frozen=true;
   const same=previous&&previous.player.sector===m.player.sector,a=frozen||!same?1:clamp(alpha);
   function point(now,before){
    if(!same||!before||before.sector!==now.sector||Math.abs(now.x-before.x)>100)return now.x;
    return before.x+(now.x-before.x)*a;
   }
   const moving=same&&!m.travel&&Math.abs(m.player.x-previous.player.x)>.001;
   return {x:point(m.player,previous&&previous.player),jump:same?previous.player.jump+(m.player.jump-previous.player.jump)*a:m.player.jump,
    pose:m.hold?12:m.attack>0?5:moving?Math.floor((start+(distance-start)*a)/13)%4:28,
    point:point,previous:previous,alpha:a,moving:moving};
  }
  return {reset:reset,commit:commit,sample:sample};
 }
 root.TechOpsLowQuarterMotion={create:create};
 if(typeof module==='object')module.exports=root.TechOpsLowQuarterMotion;
})(typeof globalThis!=='undefined'?globalThis:this);
