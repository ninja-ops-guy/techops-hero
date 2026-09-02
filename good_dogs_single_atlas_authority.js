/* TechOps Hero — Good Dogs single-atlas / single-actor authority v1.
 * Physical-device fix:
 *   - KATRIN_MANCHEZ is the only Good Dogs character atlas.
 *   - sanitize pseudo-idle aliases so locomotion never cycles attack/leap/roll art.
 *   - v7.37 owns the active fighter draw; suppress the later production overlay
 *     during _v736 so Katrin/Manchez are never painted twice in one frame.
 */
(function(root){
  "use strict";
  if(!root||root.TechOpsGoodDogsSingleAtlasAuthority)return;
  var VERSION=1,installed=false,priorPlayer=null;
  function sanitize(){
    var A=root.KATRIN_MANCHEZ;if(!A||!A.frames)return false;
    ["kat_","man_"].forEach(function(p){
      var a=A.frames[p+"idle0"],b=A.frames[p+"idle1"]||a;if(!a)return;
      for(var i=2;i<7;i++)A.frames[p+"idle"+i]=(i%2?b:a).slice?((i%2?b:a).slice()):(i%2?b:a);
    });
    root.__goodDogsAtlasAuthority={name:"KATRIN_MANCHEZ",src:A.src||null,version:VERSION,at:Date.now()};
    return true;
  }
  function installRendererArbiter(){
    var fn=root.drawNightPlayerAtlas;if(typeof fn!=="function")return false;
    if(fn.__goodDogsSingleAtlasAuthority)return true;
    priorPlayer=fn;
    var wrapped=function(x,NM,px,py,now){
      /* v737_hooks draws the canonical _v736 active fighter after the base NM
         pass. Returning false here keeps this later production atlas overlay
         from drawing the same dog a second time. The v737 pass is still the
         sole visible fighter compositor. */
      if(NM&&NM._v736&&typeof root.drawGoodDogActive737==="function")return false;
      return priorPlayer.apply(this,arguments);
    };
    wrapped.__goodDogsSingleAtlasAuthority=true;
    /* Also carry the production marker so its recurring installer does not
       wrap this arbiter again on the next tick. */
    wrapped.__goodDogsProduction=true;
    root.drawNightPlayerAtlas=wrapped;installed=true;
    root.__goodDogsActorRenderAuthority="v737-single-pass";
    return true;
  }
  function tick(){sanitize();installRendererArbiter();}
  tick();var timer=root.setInterval?root.setInterval(tick,250):0;
  root.TechOpsGoodDogsSingleAtlasAuthority={VERSION:VERSION,sanitize:sanitize,install:installRendererArbiter,get installed(){return installed;},timer:timer};
})(typeof globalThis!=="undefined"?globalThis:this);
