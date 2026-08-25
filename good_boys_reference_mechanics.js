/* GOOD BOYS production mechanics — reference parity for Katrin + Manchez.
 * Adds the mechanics explicitly shown in the approved concept: 3x boost jump,
 * two mid-air dashes, partner throw/catch support, and mobile buttons.
 * Scoped strictly to NM._v736 so normal Night Walker physics are untouched.
 */
(function(root){
  "use strict";
  if(!root||root.TechOpsGoodBoysReferenceMechanics)return;
  var VERSION=1,state={airDashes:0,boostUsed:false,lastGround:false};
  function cs(){try{return root.NM&&root.NM._v736?root.NM._v736:null;}catch(e){return null;}}
  function active(){var c=cs();return c&&c.active==="manchez"?"manchez":"katrin";}
  function partner(){return active()==="katrin"?"manchez":"katrin";}
  function now(){return root.performance&&root.performance.now?root.performance.now():Date.now();}
  function msg(t){try{root.NM.msg=t;root.NM.msgT=now()+950;}catch(e){}}
  function nearPartner(max){try{var c=cs(),n=root.NM,p=c&&c.partner;if(!c||!n||!p)return false;return Math.hypot((p.x||0)-(n.x||0),(p.y||0)-(n.y||0))<=(max||150);}catch(e){return false;}}

  function boostJump(){
    try{var c=cs(),n=root.NM;if(!c||!n||n.onGround||state.boostUsed||Number(n.jumps||0)<2)return false;n.vy=-10.2;n.jumps=3;n.flip=Math.max(n.flip||0,16);state.boostUsed=true;c.sync=Math.min(100,(c.sync||0)+8);msg("🐾 BOOST JUMP · partner launch");try{if(root.sfx)root.sfx("jump");}catch(_){}return true;}catch(e){return false;}
  }
  function airDash(){
    try{var c=cs(),n=root.NM;if(!c||!n||n.onGround||state.airDashes>=2||n.block)return false;state.airDashes++;n.dashT=10;n.ifr=Math.max(n.ifr||0,12);n.vx=(n.face||1)*10.5;n.dashCD=7;c.sync=Math.min(100,(c.sync||0)+4);msg("⚡ AIR DASH "+state.airDashes+" / 2");try{if(root.sfx)root.sfx("dash");}catch(_){}return true;}catch(e){return false;}
  }
  function partnerThrow(){
    try{var c=cs(),n=root.NM,p=c&&c.partner,w=partner(),ch=c&&c.chars&&c.chars[w];if(!c||!n||!p||!ch||ch.downed||ch.out||!nearPartner(135))return false;p.vx=(n.face||1)*8.8;p.vy=-10.8;p.onGround=false;p.jumps=1;p.face=n.face||1;p.anim=18;c.sync=Math.min(100,(c.sync||0)+7);msg("🤝 PARTNER THROW · "+w.toUpperCase());return true;}catch(e){return false;}
  }
  function midAirCatch(){
    try{var c=cs(),n=root.NM,p=c&&c.partner,w=partner(),ch=c&&c.chars&&c.chars[w];if(!c||!n||!p||!ch||ch.downed||ch.out||n.onGround||!nearPartner(120))return false;n.vy=Math.min(n.vy||0,-4.8);p.x=n.x-(n.face||1)*34;p.y=n.y+10;p.vx=(n.vx||0)*.7;p.vy=-3.8;p.onGround=false;c.sync=Math.min(100,(c.sync||0)+10);msg("🫴 MID-AIR CATCH · link recovered");return true;}catch(e){return false;}
  }
  function throwOrCatch(){try{return root.NM&&!root.NM.onGround?midAirCatch():partnerThrow();}catch(e){return false;}}

  function resetGround(){try{var n=root.NM;if(!cs()||!n)return;if(n.onGround&&!state.lastGround){state.airDashes=0;state.boostUsed=false;}state.lastGround=!!n.onGround;}catch(e){}}
  function installKeys(){
    try{if(!root.document||root.document.__goodBoysReferenceKeys)return false;root.document.addEventListener("keydown",function(e){if(!cs())return;var k=(e.key||"").toLowerCase();if(k==="w"||k==="arrowup")setTimeout(boostJump,0);else if(k==="shift")setTimeout(airDash,0);else if(k==="f")throwOrCatch();},true);root.document.__goodBoysReferenceKeys=true;return true;}catch(e){return false;}
  }
  function addButton(box,id,label,color,fn){if(root.document.getElementById(id))return;var b=root.document.createElement("button");b.id=id;b.textContent=label;b.style.cssText="min-width:64px;min-height:46px;border:2px solid "+color+";border-radius:11px;background:#06101ddd;color:#fff;font:bold 9px monospace;box-shadow:0 0 12px "+color+"55";b.addEventListener("pointerdown",function(e){e.preventDefault();e.stopPropagation();fn();},{passive:false});box.appendChild(b);}
  function installTouch(){
    try{if(!root.document)return false;var box=root.document.getElementById("good-dogs-touch");if(!box)return false;box.style.gridTemplateColumns="repeat(2,64px)";addButton(box,"gb-boost","⬆ BOOST","#69d6ff",boostJump);addButton(box,"gb-airdash","⚡ AIR x2","#7ce8ff",airDash);addButton(box,"gb-throw","↗ THROW","#ffad32",throwOrCatch);return true;}catch(e){return false;}
  }
  function tick(){resetGround();installKeys();installTouch();}
  tick();var timer=null;try{timer=root.setInterval(tick,100);}catch(e){}
  root.TechOpsGoodBoysReferenceMechanics={VERSION:VERSION,boostJump:boostJump,airDash:airDash,partnerThrow:partnerThrow,midAirCatch:midAirCatch,throwOrCatch:throwOrCatch,nearPartner:nearPartner,state:state,tick:tick,timer:timer};
})(typeof globalThis!=="undefined"?globalThis:this);
