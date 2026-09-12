/* TechOps Hero — live-crawl visual cohesion authority v1.
 * Evidence basis: QA-011 Night Industrial + QA-017 Good Dogs mobile captures.
 * This module intentionally does not invent M2+ art. It owns only cross-mode
 * presentation hygiene, Night actor scale, and fresh M1 pair separation.
 */
(function(root){
  "use strict";
  if(!root||root.TechOpsLiveCrawlVisualCohesion)return;
  var VERSION=1,timer=null,nightImage=null,interactWrapped=false;

  function state(){try{return root.S||null;}catch(e){return null;}}
  function night(){var s=state();return !!(s&&s.nightMode);}
  function goodDogs(){try{return !!(root.NM&&root.NM._v736);}catch(e){return false;}}

  function installStyle(){
    if(!root.document)return false;
    var style=root.document.getElementById("live-crawl-visual-cohesion-style");
    if(!style){style=root.document.createElement("style");style.id="live-crawl-visual-cohesion-style";(root.document.head||root.document.documentElement).appendChild(style);}
    style.textContent=[
      /* Night owns its viewport. Legacy Day shell must never reappear over it. */
      "body.live-crawl-night #hud,body.live-crawl-night #panel,body.live-crawl-night #battle,body.live-crawl-night #eod{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}",
      "body.live-crawl-night #dialogue:not(#v722-cine #dialogue){display:none!important}",
      /* Good Dogs gets a clean edge-to-edge gameplay canvas; controls remain overlays. */
      "body.live-crawl-good-dogs{overflow:hidden!important}",
      "body.live-crawl-good-dogs #game{max-width:100vw!important;max-height:100dvh!important}",
      /* Hide known retired/duplicate pads when the canonical Good Dogs controls own input. */
      "body.live-crawl-good-dogs #good-boys-loop-controls,body.live-crawl-good-dogs #v55-nmbtns,body.live-crawl-good-dogs #touch-buttons{display:none!important;visibility:hidden!important;pointer-events:none!important}",
      /* Contextual board action remains readable without becoming the composition. */
      "body.live-crawl-good-dogs #good-boys-board-ship{z-index:10040!important}",
      "@media(max-width:520px){body.live-crawl-good-dogs #good-boys-board-ship{max-width:54vw!important;min-height:42px!important;padding:8px 12px!important;font-size:11px!important}}"
    ].join("");
    return true;
  }

  function enforceModeOwnership(){
    try{
      if(!root.document||!root.document.body)return false;
      var n=night(),g=goodDogs();
      root.document.body.classList.toggle("live-crawl-night",n);
      root.document.body.classList.toggle("live-crawl-good-dogs",g);
      if(n){
        ["hud","panel","battle","eod"].forEach(function(id){var el=root.document.getElementById(id);if(el&&el.style)el.style.setProperty("display","none","important");});
      }
      return true;
    }catch(e){root.__liveCrawlModeOwnershipError=String(e&&e.stack||e);return false;}
  }

  /* v64's day investigation wrapper historically ran before the Night interaction
     owner. During Night, temporarily mask only Felicia's day-world positions while
     delegating through the exact existing interaction chain. This prevents Café
     Table/day clues from stealing E without bypassing any Night interaction code. */
  function wrapInteract(){
    try{
      if(interactWrapped||typeof root.interact!=="function")return interactWrapped;
      var prior=root.interact;
      function wrapped(){
        var s=state(),f=s&&s.meta&&s.meta._fel;
        if(!(s&&s.nightMode&&f))return prior.apply(this,arguments);
        var pos=f.pos,spots=f.spots;
        try{f.pos=null;f.spots=null;return prior.apply(this,arguments);}
        finally{f.pos=pos;f.spots=spots;}
      }
      wrapped.__liveCrawlNightDayGuard=true;
      wrapped.__liveCrawlBase=prior;
      root.interact=wrapped;interactWrapped=true;return true;
    }catch(e){root.__liveCrawlInteractGuardError=String(e&&e.stack||e);return false;}
  }

  function installNightScale(){
    try{
      var ref=root.TechOpsNightReferenceVisuals,atlas=ref&&ref.atlas;
      if(!ref||!atlas||!atlas.frames||ref.__liveCrawlScaleV1)return false;
      ref.__liveCrawlScaleV1=true;
      ref.drawReferenceNightWalker=function(ctx,NM,px,py,now){
        try{
          if(!nightImage&&atlas.src&&root.Image){nightImage=new root.Image();nightImage.src=atlas.src;}
          if(!nightImage||!nightImage.complete||!nightImage.naturalWidth)return false;
          var key=ref.framePlan?ref.framePlan(NM,now||0):"idle0",fr=atlas.frames[key]||atlas.frames.idle0;if(!fr)return false;
          var C=atlas.cell||128;
          /* Live QA showed Mike visually overpowering the Charger. Keep him readable,
             but target ~74 px standing height instead of the previous hard 92 px floor. */
          var h=Math.round(Math.max(70,Math.min(82,(Number(NM&&NM.h)||34)*2.2)));
          var scale=h/(atlas.standingHeight||C),w=C*scale,spriteH=C*scale;
          var moving=Math.abs(Number(NM&&NM.vx)||0)>.45,bob=moving&&NM.onGround?Math.round(Math.sin((now||0)/92)*1.2):0;
          var dx=Math.round(px+(NM.w||22)/2-w/2),dy=Math.round(py+(NM.h||34)+5-(atlas.pivot?atlas.pivot[1]:C)*scale+bob);
          ctx.save();ctx.imageSmoothingEnabled=false;
          if(NM.onGround){ctx.save();ctx.globalAlpha=.25;ctx.fillStyle="#000";ctx.beginPath();ctx.ellipse(px+(NM.w||22)/2,py+(NM.h||34)+2,w*.24,4,0,0,Math.PI*2);ctx.fill();ctx.restore();}
          if(NM.ifr>0&&Math.floor((now||0)/80)%2)ctx.globalAlpha=.55;
          if((NM.face||1)<0){ctx.translate(dx+w,0);ctx.scale(-1,1);ctx.drawImage(nightImage,fr[0],fr[1],C,C,0,dy,w,spriteH);}else ctx.drawImage(nightImage,fr[0],fr[1],C,C,dx,dy,w,spriteH);
          ctx.restore();return true;
        }catch(e){root.__liveCrawlNightScaleError=String(e&&e.stack||e);return false;}
      };
      return true;
    }catch(e){root.__liveCrawlNightScaleError=String(e&&e.stack||e);return false;}
  }

  function separateFreshPair(){
    try{
      var n=root.NM,c=n&&n._v736;if(!c||Number(c.m||0)!==1||c.__liveCrawlSpawnSeparated)return false;
      c.__liveCrawlSpawnSeparated=true;
      var p=c.partner;if(!p||!isFinite(n.x)||!isFinite(p.x))return false;
      var delta=p.x-n.x;
      if(Math.abs(delta)<64){var dir=delta<0?-1:1;p.x=n.x+dir*84;root.__liveCrawlPairSeparation={from:delta,to:p.x-n.x,mission:1,at:Date.now()};}
      return true;
    }catch(e){root.__liveCrawlPairSeparationError=String(e&&e.stack||e);return false;}
  }

  function visualContract(){
    var d=root.document,v={night:night(),goodDogs:goodDogs(),failures:[]};
    try{
      if(v.night){["hud","panel","battle","eod"].forEach(function(id){var el=d&&d.getElementById(id);if(el&&root.getComputedStyle&&root.getComputedStyle(el).display!=="none")v.failures.push("day-ui-visible:"+id);});}
      if(v.goodDogs&&d){var pad=d.getElementById("good-dogs-touch"),board=d.getElementById("good-boys-board-ship");if(pad){var r=pad.getBoundingClientRect();if(r.right>root.innerWidth+1||r.bottom>root.innerHeight+1||r.left<-1||r.top<-1)v.failures.push("controls-outside-viewport");}if(board){var b=board.getBoundingClientRect();if(b.right>root.innerWidth+1||b.left<-1)v.failures.push("board-prompt-clipped");}}
    }catch(e){v.failures.push("contract-error:"+String(e&&e.message||e));}
    v.pass=!v.failures.length;return v;
  }

  function tick(){installStyle();enforceModeOwnership();wrapInteract();installNightScale();separateFreshPair();}
  tick();try{timer=root.setInterval(tick,180);}catch(e){}
  root.TechOpsLiveCrawlVisualCohesion={VERSION:VERSION,tick:tick,enforceModeOwnership:enforceModeOwnership,wrapInteract:wrapInteract,installNightScale:installNightScale,separateFreshPair:separateFreshPair,visualContract:visualContract,timer:timer};
})(typeof globalThis!=="undefined"?globalThis:this);
