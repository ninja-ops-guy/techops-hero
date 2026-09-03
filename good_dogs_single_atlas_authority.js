/* TechOps Hero — Good Dogs single-atlas / single-actor authority v3.
 * Physical-device invariant:
 *   - KATRIN_MANCHEZ is the only Good Dogs character atlas.
 *   - sanitize pseudo-idle aliases so locomotion never cycles attack/leap/roll art.
 *   - v7.37 owns the visible _v736 active fighter draw.
 *   - suppress the secondary drawNightPlayerAtlas path unconditionally while
 *     Good Boys is active.
 *
 * Renderer safety invariant:
 *   Every wrapper captures its delegate in its own closure. Never store the
 *   delegate in mutable module state: the periodic arbiter can otherwise turn
 *   an older wrapper into a cycle when another renderer wraps between ticks.
 */
(function(root){
  "use strict";
  if(!root)return;
  try{var prior=root.TechOpsGoodDogsSingleAtlasAuthority;if(prior&&prior.timer&&root.clearInterval)root.clearInterval(prior.timer);}catch(_){}
  var VERSION=3,installed=false;
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
    if(fn.__goodDogsSingleAtlasAuthorityV3){installed=true;return true;}
    var delegate=fn;
    var wrapped=function(x,NM,px,py,now){
      /* v737_hooks already replaces the base Night player with the active Good
         Dogs fighter. Never let a later player-atlas layer paint that actor a
         second time. Partner rendering remains owned by the v7.36 campaign. */
      if(NM&&NM._v736){
        root.__goodDogsSecondaryActorDrawSuppressed=(root.__goodDogsSecondaryActorDrawSuppressed||0)+1;
        return false;
      }
      return delegate.apply(this,arguments);
    };
    wrapped.__goodDogsSingleAtlasAuthority=true;
    wrapped.__goodDogsSingleAtlasAuthorityV2=true;
    wrapped.__goodDogsSingleAtlasAuthorityV3=true;
    wrapped.__goodDogsProduction=true;
    wrapped.__goodDogsActorContractGuard=true;
    wrapped.__goodDogsRendererDelegate=delegate;
    root.drawNightPlayerAtlas=wrapped;installed=true;
    root.__goodDogsActorRenderAuthority="v737-single-pass";
    root.__goodDogsSecondaryActorPath="suppressed";
    root.__goodDogsRendererWrapperHealth={version:VERSION,cyclic:false,at:Date.now()};
    return true;
  }
  function acceptance(){return{version:VERSION,installed:installed,atlas:root.__goodDogsAtlasAuthority||null,actorOwner:root.__goodDogsActorRenderAuthority||null,secondaryPath:root.__goodDogsSecondaryActorPath||null,wrapperHealth:root.__goodDogsRendererWrapperHealth||null,pass:!!(installed&&root.__goodDogsAtlasAuthority&&root.__goodDogsAtlasAuthority.name==="KATRIN_MANCHEZ")};}
  function tick(){sanitize();installRendererArbiter();}
  tick();var timer=root.setInterval?root.setInterval(tick,250):0;
  root.TechOpsGoodDogsSingleAtlasAuthority={VERSION:VERSION,sanitize:sanitize,install:installRendererArbiter,acceptance:acceptance,get installed(){return installed;},timer:timer};
})(typeof globalThis!=="undefined"?globalThis:this);