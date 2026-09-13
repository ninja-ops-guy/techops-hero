/* Animation only. Contact, invulnerability, movement and recovery remain in
 * night_combat.js/night_hooks.js. Timelines consume the same paused combat clock. */
(function(root){
  'use strict';
  let image=null;const entries=new WeakMap();
  function atlas(){return root.TECHOPS_NIGHT_MOVE_ATLAS;}
  function warm(){const a=atlas();if(!image&&a&&root.Image){image=new root.Image();image.decoding='async';image.src=a.src;image.onerror=()=>{root.__nightMoveAssetError=a.src;};}return image&&image.complete&&image.naturalWidth?image:null;}
  function phase(age,windup,duration){if(age<windup)return 0;if(age<windup+45)return 1;if(age<duration-55)return 2;return 3;}
  function sample(n,now){
    if(!n||n._v736||n._sector04)return null;
    const c=n._nightCombat||{time:now||0},time=c.time;
    let kind=null,age=0,frame=0,face=n.face||1;
    if(n.hp<=0||n.down>0)kind='down';
    else if(c.stunUntil>time){kind='hurt';age=180-(c.stunUntil-time);frame=Math.min(3,Math.floor(age/45));}
    else if(c.grab){kind='grab';age=time-c.grab.at;frame=Math.min(2,Math.floor(age/55));}
    else if(c.attack){const a=c.attack;kind=a.kind;age=time-a.at;face=a.face||face;
      // Throws release on their existing immediate contact event. Grab supplies
      // the preparation; render the open-hand release, then recovery.
      frame=kind.startsWith('throw')?(age<140?2:3):phase(age,a.windup||70,a.duration);
    }else if(n.dashT>0){kind='dash';age=c.dash?time-c.dash.at:(10-n.dashT)*1000/60;frame=Math.min(3,Math.floor(age/45));}
    else if(n.block)kind='block';
    let prior=entries.get(n);
    if(prior&&prior.kind==='down'&&!kind&&n.hp>0){kind='get-up';}
    if(prior&&prior.kind==='get-up'&&!kind&&time-prior.at<260)kind='get-up';
    if(kind!==prior?.kind){prior={kind,at:time};entries.set(n,prior);}
    if(['down','block','get-up'].includes(kind)){age=time-prior.at;frame=kind==='block'?Math.min(2,Math.floor(age/55)):Math.min(3,Math.floor(age/65));}
    const move=atlas()?.moves[kind];return move?{kind,frame,face,age,source:move.frames[Math.max(0,frame)]}:null;
  }
  function draw(ctx,n,px,py,now,height){
    const im=warm(),a=atlas();if(!im||!a)return false;const choice=sample(n,now);if(!choice)return false;
    const f=choice.source,[sx,sy,sw,sh]=f.rect,s=(height||75)/a.standingHeight,cx=px+(n.w||22)/2,base=py+(n.h||34)+3;
    ctx.save();ctx.imageSmoothingEnabled=false;
    if(n.onGround){ctx.fillStyle='#0005';ctx.beginPath();ctx.ellipse(cx,base-1,20,4,0,0,Math.PI*2);ctx.fill();}
    if(n.ifr>0&&Math.floor((now||0)/80)%2)ctx.globalAlpha=.55;
    ctx.translate(Math.round(cx),Math.round(base));ctx.scale(choice.face<0?-1:1,1);
    ctx.drawImage(im,sx,sy,sw,sh,-f.pivot[0]*s,-f.pivot[1]*s,sw*s,sh*s);ctx.restore();return true;
  }
  root.TechOpsNightMoves={VERSION:1,warm,sample,draw,phase};warm();
})(typeof globalThis!=='undefined'?globalThis:this);
