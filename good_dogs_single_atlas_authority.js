/* TechOps Hero — Good Dogs single-atlas / single-actor authority v2.
 * Physical-device invariant:
 *   - KATRIN_MANCHEZ is the only Good Dogs character atlas.
 *   - sanitize pseudo-idle aliases so locomotion never cycles attack/leap/roll art.
 *   - v7.37 owns the visible _v736 active fighter draw.
 *   - suppress the secondary drawNightPlayerAtlas path unconditionally while
 *     Good Boys is active. The v1 root.drawGoodDogActive737 probe was invalid
 *     because that renderer is local to v737_hooks.js, so the second draw leaked.
 */
(function(root){
  "use strict";
  if(!root)return;
  try{var prior=root.TechOpsGoodDogsSingleAtlasAuthority;if(prior&&prior.timer&&root.clearInterval)root.clearInterval(prior.timer);}catch(_){}
  var VERSION=2,installed=false,priorPlayer=null;
  function sanitize(){
    var A=root.KATRIN_MANCHEZ;if(!A||!A.frames)return false;
    ["kat_","man_"].forEach(function(p){
      var a=A.frames[p+"idle0"],b=A.frames[p+"idle1"]||a;if(!a)return;
      for(var i=2;i<8;i++)A.frames[p+"idle"+i]=(i%2?b:a).slice?((i%2?b:a).slice()):(i%2?b:a);
    });
    root.__goodDogsAtlasAuthority={name:"KATRIN_MANCHEZ",src:A.src||null,version:VERSION,at:Date.now()};
    return true;
  }
  function installRendererArbiter(){
    var fn=root.drawNightPlayerAtlas;if(typeof fn!=="function")return false;
    if(fn.__goodDogsSingleAtlasAuthorityV2)return true;
    priorPlayer=fn;
    var wrapped=function(x,NM,px,py,now){
      /* v737_hooks already replaces the base Night player with the active Good
         Dogs fighter. Never let a later player-atlas layer paint that actor a
         second time. Partner rendering remains owned by the v7.36 campaign. */
      if(NM&&NM._v736){
        root.__goodDogsSecondaryActorDrawSuppressed=(root.__goodDogsSecondaryActorDrawSuppressed||0)+1;
        return false;
      }
      return priorPlayer.apply(this,arguments);
    };
    wrapped.__goodDogsSingleAtlasAuthority=true;
    wrapped.__goodDogsSingleAtlasAuthorityV2=true;
    wrapped.__goodDogsProduction=true;
    wrapped.__goodDogsActorContractGuard=true;
    root.drawNightPlayerAtlas=wrapped;installed=true;
    root.__goodDogsActorRenderAuthority="v737-single-pass";
    root.__goodDogsSecondaryActorPath="suppressed";
    return true;
  }
  function acceptance(){return{version:VERSION,installed:installed,atlas:root.__goodDogsAtlasAuthority||null,actorOwner:root.__goodDogsActorRenderAuthority||null,secondaryPath:root.__goodDogsSecondaryActorPath||null,pass:!!(installed&&root.__goodDogsAtlasAuthority&&root.__goodDogsAtlasAuthority.name==="KATRIN_MANCHEZ")};}
  function tick(){sanitize();installRendererArbiter();}
  tick();var timer=root.setInterval?root.setInterval(tick,250):0;
  root.TechOpsGoodDogsSingleAtlasAuthority={VERSION:VERSION,sanitize:sanitize,install:installRendererArbiter,acceptance:acceptance,get installed(){return installed;},timer:timer};
})(typeof globalThis!=="undefined"?globalThis:this);