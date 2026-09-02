/* GOOD BOYS production mechanics — paired-combat authority v3.
 * Three boost jumps, two air dashes, partner throw/catch, and paired combo flow.
 * Scoped strictly to NM._v736 so ordinary Night Walker remains untouched.
 * Combat never delegates to interact(), and paired combo state advances only
 * after a real damage event so whiffs cannot manufacture combo/SYNC credit.
 */
(function(root){
  "use strict";
  if(!root||root.TechOpsGoodBoysReferenceMechanics)return;
  var VERSION=3,state={airDashes:0,boostUsed:false,lastGround:false,comboStep:0,lastAttackAt:0,lastThrowAt:0,lastAttackHit:false,whiffs:0,hits:0};
  function cs(){try{return root.NM&&root.NM._v736?root.NM._v736:null;}catch(e){return null;}}
  function active(){var c=cs();return c&&c.active==="manchez"?"manchez":"katrin";}
  function partner(){return active()==="katrin"?"manchez":"katrin";}
  function now(){return root.performance&&root.performance.now?root.performance.now():Date.now();}
  function msg(t){try{root.NM.msg=t;root.NM.msgT=now()+950;}catch(e){}}
  function nearPartner(max){try{var c=cs(),n=root.NM,p=c&&c.partner;if(!c||!n||!p)return false;return Math.hypot((p.x||0)-(n.x||0),(p.y||0)-(n.y||0))<=(max||150);}catch(e){return false;}}
  function enemyCenter(e){return (Number(e&&e.x)||0)+(Number(e&&e.w)||28)/2;}
  function livingEnemies(){try{return (root.NM&&root.NM.enemies||[]).filter(function(e){return e&&e.alive!==false&&Number(e.hp)>0;});}catch(e){return [];}}
  function nearestEnemy(max){
    try{var n=root.NM,arr=livingEnemies();if(!n)return null;var best=null,bd=max||150;for(var i=0;i<arr.length;i++){var e=arr[i];var d=Math.abs(enemyCenter(e)-((Number(n.x)||0)+(Number(n.w)||22)/2));if(d<bd){bd=d;best=e;}}return best;}catch(e){return null;}
  }
  function hitEnemy(e,damage,kb,down){
    try{if(!e)return false;e.hp=Math.max(0,(Number(e.hp)||1)-damage);e.hitT=Math.max(Number(e.hitT)||0,8);e.kb=(Number(root.NM&&root.NM.face)||1)*(kb||4);if(down)e.down=Math.max(Number(e.down)||0,down);if(e.hp<=0){e.alive=false;if(root.NM)root.NM.kills=(Number(root.NM.kills)||0)+1;}if(root.NM)root.NM.hitStop=Math.max(Number(root.NM.hitStop)||0,4);return true;}catch(_){return false;}
  }
  function boostJump(){
    try{var c=cs(),n=root.NM;if(!c||!n||n.onGround||state.boostUsed||Number(n.jumps||0)<2)return false;n.vy=-10.2;n.jumps=3;n.flip=Math.max(n.flip||0,16);state.boostUsed=true;c.sync=Math.min(100,(c.sync||0)+8);msg("🐾 BOOST JUMP · partner launch");try{if(root.sfx)root.sfx("jump");}catch(_){}return true;}catch(e){return false;}
  }
  function airDash(){
    try{var c=cs(),n=root.NM;if(!c||!n||n.onGround||state.airDashes>=2||n.block)return false;state.airDashes++;n.dashT=10;n.ifr=Math.max(n.ifr||0,12);n.vx=(n.face||1)*10.5;n.dashCD=7;c.sync=Math.min(100,(c.sync||0)+4);msg("⚡ AIR DASH "+state.airDashes+" / 2");try{if(root.sfx)root.sfx("dash");}catch(_){}return true;}catch(e){return false;}
  }
  function activeStrike(){
    try{
      if(!cs()||!root.NM||typeof root.nmJab!=="function")return false;
      var before=new Map();livingEnemies().forEach(function(e){before.set(e,{hp:Number(e.hp)||0,alive:e.alive!==false});});
      root.nmJab();
      var hit=false;before.forEach(function(v,e){if((Number(e.hp)||0)<v.hp||(v.alive&&e.alive===false))hit=true;});
      state.lastAttackHit=hit;if(hit)state.hits++;else state.whiffs++;root.__goodBoysLastCombatStrike={hit:hit,hits:state.hits,whiffs:state.whiffs,at:Date.now()};return hit;
    }catch(e){root.__goodBoysCombatStrikeError=String(e&&e.stack||e);return false;}
  }
  function partnerAssist(step){
    try{var c=cs(),n=root.NM,p=c&&c.partner;if(!c||!n||!p)return false;var e=nearestEnemy(175);p.face=n.face||1;p.anim=18;p.vx=(n.face||1)*(step>=3?6.8:4.6);if(e){hitEnemy(e,step>=3?13:7,step>=3?7:4,step>=3?14:0);p.x=enemyCenter(e)-(p.w||22)/2-(n.face||1)*20;c.sync=Math.min(100,(c.sync||0)+(step>=3?10:5));return true;}return false;}catch(_){return false;}
  }
  function pairedAttack(){
    try{
      var c=cs(),n=root.NM;if(!c||!n||n.block)return false;var t=now();if(t-state.lastAttackAt>720)state.comboStep=0;state.lastAttackAt=t;
      var hit=activeStrike();if(!hit){state.comboStep=0;msg("🐾 WHIFF · NO COMBO");return false;}
      state.comboStep=(state.comboStep%3)+1;if(state.comboStep>=2)partnerAssist(state.comboStep);c.sync=Math.min(100,(c.sync||0)+(state.comboStep===3?6:2));msg(state.comboStep===1?"🐾 1 · LEAD STRIKE":state.comboStep===2?"🐾 2 · PARTNER FOLLOW":"🐾 3 · TANDEM LAUNCH");return true;
    }catch(e){return false;}
  }
  function partnerThrow(){
    try{var c=cs(),n=root.NM,p=c&&c.partner,w=partner(),ch=c&&c.chars&&c.chars[w];if(!c||!n||!p||!ch||ch.downed||ch.out)return false;if(!nearPartner(165)){p.x=n.x-(n.face||1)*32;p.y=n.y;}
      p.vx=(n.face||1)*10.5;p.vy=-8.8;p.onGround=false;p.jumps=1;p.face=n.face||1;p.anim=24;var e=nearestEnemy(235);if(e){hitEnemy(e,16,8,18);p.x=enemyCenter(e)-(p.w||22)/2-(n.face||1)*10;p.y=Math.min(Number(p.y)||Number(n.y)||0,Number(e.y)||Number(n.y)||0);state.comboStep=2;c.sync=Math.min(100,(c.sync||0)+12);msg("🤝 THROW → PARTNER IMPACT · ATTACK TO FOLLOW");}else{state.comboStep=0;c.sync=Math.min(100,(c.sync||0)+7);msg("🤝 PARTNER THROW · "+w.toUpperCase());}state.lastThrowAt=now();return true;}catch(e){return false;}
  }
  function midAirCatch(){
    try{var c=cs(),n=root.NM,p=c&&c.partner,w=partner(),ch=c&&c.chars&&c.chars[w];if(!c||!n||!p||!ch||ch.downed||ch.out||!nearPartner(145))return false;n.vy=Math.min(n.vy||0,-4.8);p.x=n.x-(n.face||1)*34;p.y=n.y+10;p.vx=(n.vx||0)*.7;p.vy=-3.8;p.onGround=false;c.sync=Math.min(100,(c.sync||0)+10);state.comboStep=Math.max(1,state.comboStep);msg("🫴 CATCH → LINK RECOVERED · ATTACK TO CHAIN");return true;}catch(e){return false;}
  }
  function throwOrCatch(){try{var c=cs();if(!c||!root.NM)return false;return (!root.NM.onGround&&nearPartner(145))?midAirCatch():partnerThrow();}catch(e){return false;}}
  function resetGround(){try{var n=root.NM;if(!cs()||!n)return;if(n.onGround&&!state.lastGround){state.airDashes=0;state.boostUsed=false;}state.lastGround=!!n.onGround;}catch(e){}}
  function installKeys(){try{if(!root.document||root.document.__goodBoysReferenceKeys)return false;root.document.addEventListener("keydown",function(e){if(!cs())return;var k=(e.key||"").toLowerCase();if(k==="w"||k==="arrowup")setTimeout(boostJump,0);else if(k==="shift")setTimeout(airDash,0);else if(k==="f")throwOrCatch();},true);root.document.__goodBoysReferenceKeys=true;return true;}catch(e){return false;}}
  function tick(){resetGround();installKeys();}
  tick();var timer=null;try{timer=root.setInterval(tick,100);}catch(e){}
  root.TechOpsGoodBoysReferenceMechanics={VERSION:VERSION,boostJump:boostJump,airDash:airDash,activeStrike:activeStrike,pairedAttack:pairedAttack,partnerThrow:partnerThrow,midAirCatch:midAirCatch,throwOrCatch:throwOrCatch,nearPartner:nearPartner,state:state,tick:tick,timer:timer};
})(typeof globalThis!=="undefined"?globalThis:this);
