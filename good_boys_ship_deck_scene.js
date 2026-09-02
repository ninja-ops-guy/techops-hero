/* TechOps Hero — Good Boys ship-deck production authority v3.
 * Dedicated browser-safe cockpit plate from the supplied Good Boys asset pack.
 * One contextual interaction; KATRIN_MANCHEZ remains the only actor atlas.
 */
(function(root){
  "use strict";
  if(!root||!root.document)return;
  var VERSION=3;
  var DECK_SRC="assets/good_boys/good_ship_arcade.atlas.png";
  var DECK_FRAME=[0,405,292,114];
  var PRIME_KEY="__goodBoysCockpitPrimeV3";
  function remove(id){try{var n=root.document.getElementById(id);if(n)n.remove();}catch(_){}}
  function drawActor(ctx,A,img,key,cx,base,h,flip){try{var fr=A&&A.frames&&A.frames[key];if(!fr||!img||!img.complete||!img.naturalWidth)return false;var w=h*(fr[2]/fr[3]);ctx.save();ctx.imageSmoothingEnabled=false;if(flip){ctx.translate(cx,0);ctx.scale(-1,1);ctx.drawImage(img,fr[0],fr[1],fr[2],fr[3],-w/2,base-h,w,h);}else ctx.drawImage(img,fr[0],fr[1],fr[2],fr[3],cx-w/2,base-h,w,h);ctx.restore();return true;}catch(_){return false;}}
  function drawDeck(ctx,img){var fr=DECK_FRAME;ctx.drawImage(img,fr[0],fr[1],fr[2],fr[3],0,0,960,540);}
  function prime(){if(root[PRIME_KEY])return root[PRIME_KEY];var img=new root.Image();root[PRIME_KEY]=img;try{var link=root.document.createElement("link");link.rel="preload";link.as="image";link.href=DECK_SRC;(root.document.head||root.document.documentElement).appendChild(link);}catch(_){}img.decoding="async";img.src=DECK_SRC;return img;}
  function install(){
    var opening=root.TechOpsGoodBoysOpeningV4;if(!opening)return false;
    if(opening.showDeckInteraction&&opening.showDeckInteraction.__goodShipDeckV3)return true;
    function showDeckInteraction(){return new Promise(function(resolve,reject){
      ["good-boys-ship-interlude","good-boys-deck-v4","good-boys-deck-supplied"].forEach(remove);
      root.__goodBoysOpeningPhase={phase:"ship-deck-loading",owner:"good-ship-deck-v3",asset:DECK_SRC,at:Date.now()};
      var host=root.document.createElement("div");host.id="good-boys-deck-supplied";host.style.cssText="position:fixed;inset:0;z-index:150300;background:#02050a;color:#eff8ff;font-family:monospace;display:flex;align-items:center;justify-content:center;padding:max(8px,env(safe-area-inset-top)) 8px max(8px,env(safe-area-inset-bottom));box-sizing:border-box";
      host.innerHTML='<div style="width:min(100%,980px);height:min(100%,760px);display:grid;grid-template-rows:auto 1fr auto;gap:8px;min-height:0"><div style="display:flex;justify-content:space-between;gap:10px;align-items:center;padding:4px 2px"><b style="color:#ffb14a;letter-spacing:.12em">GOOD SHIP · COCKPIT</b><span style="font-size:10px;color:#a8c6d8">CREW STATION ONLINE</span></div><div data-stage style="position:relative;min-height:0;overflow:hidden;border:1px solid #5c3b26;background:#02050a;box-shadow:0 16px 50px #000"></div><div data-controls></div></div>';
      var stage=host.querySelector("[data-stage]"),controls=host.querySelector("[data-controls]"),canvas=root.document.createElement("canvas");canvas.width=960;canvas.height=540;canvas.style.cssText="width:100%;height:100%;object-fit:contain;image-rendering:pixelated;background:#02050a";stage.appendChild(canvas);
      var ctx=canvas.getContext("2d"),env=prime(),A=root.KATRIN_MANCHEZ||null,dog=A&&A.src?new root.Image():null,envReady=!!(env.complete&&env.naturalWidth),done=false,start=performance.now(),raf=0,retried=false;
      function fail(msg){if(done)return;done=true;try{root.cancelAnimationFrame(raf);}catch(_){}root.__goodBoysDeckAssetState={asset:DECK_SRC,loaded:false,error:msg,at:Date.now()};remove("good-boys-deck-supplied");reject(new Error(msg));}
      function render(now){if(done)return;ctx.fillStyle="#02050a";ctx.fillRect(0,0,960,540);if(!envReady){raf=root.requestAnimationFrame(render);return;}ctx.imageSmoothingEnabled=false;drawDeck(ctx,env);var shade=ctx.createLinearGradient(0,285,0,540);shade.addColorStop(0,"rgba(2,5,10,0)");shade.addColorStop(1,"rgba(2,5,10,.72)");ctx.fillStyle=shade;ctx.fillRect(0,285,960,255);if(A&&dog){drawActor(ctx,A,dog,"kat_idle0",365,475,128,false);drawActor(ctx,A,dog,"man_idle0",505,475,128,false);}var pulse=.55+.35*Math.sin((now-start)/190);ctx.save();ctx.fillStyle="rgba(255,158,61,"+(pulse*.22)+")";ctx.strokeStyle="rgba(255,190,92,"+pulse+")";ctx.lineWidth=3;ctx.shadowColor="#ff8a22";ctx.shadowBlur=14;ctx.beginPath();ctx.arc(704,324,28,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();ctx.fillStyle="rgba(3,7,12,.84)";ctx.fillRect(585,370,245,42);ctx.fillStyle="#ffd18a";ctx.font="700 14px monospace";ctx.textAlign="center";ctx.fillText("CREW CONSOLE · USE",707,397);root.__goodBoysDeckAssetState={asset:"GOOD_BOYS_SHIP_ARCADE.ship_large",src:DECK_SRC,loaded:true,actorAtlas:"KATRIN_MANCHEZ",singleActorAtlas:true,at:Date.now()};raf=root.requestAnimationFrame(render);}
      controls.style.cssText="display:grid;grid-template-columns:1fr;gap:8px";controls.innerHTML='<button type="button" style="min-height:60px;border:1px solid #ff9e3d;background:#15100c;color:#fff;font:700 14px monospace;letter-spacing:.08em;touch-action:manipulation">USE / INTERACT</button>';
      function finish(e){if(done)return;done=true;if(e){e.preventDefault();e.stopPropagation();}try{root.cancelAnimationFrame(raf);}catch(_){}root.__goodBoysDeckInteract={completed:true,interaction:"crew-console",asset:"GOOD_BOYS_SHIP_ARCADE.ship_large",at:Date.now()};root.__goodBoysOpeningPhase={phase:"ship-deck-complete",owner:"good-ship-deck-v3",at:Date.now()};remove("good-boys-deck-supplied");resolve({completed:true,interaction:"crew-console",asset:"GOOD_BOYS_SHIP_ARCADE.ship_large"});}
      var b=controls.querySelector("button");b.addEventListener("pointerup",finish,{once:true});b.addEventListener("click",finish,{once:true});root.document.body.appendChild(host);root.__goodBoysDeckInteract={completed:false,asset:"GOOD_BOYS_SHIP_ARCADE.ship_large",at:Date.now()};
      function ready(){envReady=!!env.naturalWidth;if(!envReady){fail("Good Ship cockpit atlas decoded empty");return;}root.__goodBoysOpeningPhase={phase:"ship-deck-interact",owner:"good-ship-deck-v3",asset:DECK_SRC,at:Date.now()};raf=root.requestAnimationFrame(render);}
      function retry(){if(retried){fail("Good Ship cockpit atlas failed after preload retry: "+DECK_SRC);return;}retried=true;env=new root.Image();root[PRIME_KEY]=env;env.onload=ready;env.onerror=function(){fail("Good Ship cockpit atlas failed after preload retry: "+DECK_SRC);};env.decoding="async";env.src=DECK_SRC+"?retry="+Date.now();}
      if(envReady)ready();else{env.onload=ready;env.onerror=retry;}if(dog){dog.onerror=function(){fail("KATRIN_MANCHEZ actor atlas failed during cockpit scene");};dog.src=A.src;}
    });}
    showDeckInteraction.__goodShipDeckV3=true;opening.showDeckInteraction=showDeckInteraction;root.__goodBoysDeckSceneAuthority={owner:"good-ship-deck-v3",asset:"GOOD_BOYS_SHIP_ARCADE.ship_large",src:DECK_SRC,frame:DECK_FRAME.slice(),actorAtlas:"KATRIN_MANCHEZ",version:VERSION,at:Date.now()};return true;
  }
  prime();
  var timer=root.setInterval(function(){if(install())root.clearInterval(timer);},50);install();root.TechOpsGoodBoysShipDeckScene={VERSION:VERSION,install:install,src:DECK_SRC};
})(typeof globalThis!=="undefined"?globalThis:this);
