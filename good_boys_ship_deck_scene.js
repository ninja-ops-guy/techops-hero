/* Good Boys ship deck scene — production cockpit authority.
 * Uses the shipped Good Ship extraction for the cockpit environment and
 * KATRIN_MANCHEZ for actors. No embedded/base64 placeholder art.
 */
(function(root){
  "use strict";
  if(!root||!root.document)return;
  var VERSION=2;
  var DECK_SRC="assets/good_boys/good_ship_arcade.atlas.png?v=20260902-deck-v2";
  var DECK_FRAME=[0,405,292,114]; /* supplied sheet: large cockpit/ship interior panel */
  function remove(id){try{var n=root.document.getElementById(id);if(n)n.remove();}catch(_){}}
  function drawActor(ctx,A,img,key,cx,base,h,flip){try{var fr=A&&A.frames&&A.frames[key];if(!fr||!img||!img.complete||!img.naturalWidth)return false;var w=h*(fr[2]/fr[3]);ctx.save();ctx.imageSmoothingEnabled=false;if(flip){ctx.translate(cx,0);ctx.scale(-1,1);ctx.drawImage(img,fr[0],fr[1],fr[2],fr[3],-w/2,base-h,w,h);}else ctx.drawImage(img,fr[0],fr[1],fr[2],fr[3],cx-w/2,base-h,w,h);ctx.restore();return true;}catch(_){return false;}}
  function install(){
    var opening=root.TechOpsGoodBoysOpeningV4;if(!opening)return false;
    if(opening.showDeckInteraction&&opening.showDeckInteraction.__goodShipDeckV2)return true;
    function showDeckInteraction(){return new Promise(function(resolve,reject){
      remove("good-boys-ship-interlude");remove("good-boys-deck-v4");remove("good-boys-deck-supplied");
      root.__goodBoysOpeningPhase={phase:"ship-deck-interact",owner:"good-ship-deck-v2",at:Date.now()};
      var host=root.document.createElement("div");host.id="good-boys-deck-supplied";host.style.cssText="position:fixed;inset:0;z-index:150300;background:#02050a;color:#eff8ff;font-family:monospace;display:flex;align-items:center;justify-content:center;padding:max(8px,env(safe-area-inset-top)) 8px max(8px,env(safe-area-inset-bottom));box-sizing:border-box";
      host.innerHTML='<div style="width:min(100%,980px);height:min(100%,760px);display:grid;grid-template-rows:auto 1fr auto;gap:8px;min-height:0"><div style="display:flex;justify-content:space-between;gap:10px;align-items:center;padding:4px 2px"><b style="color:#ffb14a;letter-spacing:.12em">SHIP DECK · LIVE</b><span style="font-size:10px;color:#a8c6d8">APPROACH THE CREW STATION · INTERACT</span></div><div data-stage style="position:relative;min-height:0;overflow:hidden;border:1px solid #5c3b26;background:#02050a;box-shadow:0 16px 50px #000"></div><div data-controls></div></div>';
      var stage=host.querySelector("[data-stage]"),controls=host.querySelector("[data-controls]");var canvas=root.document.createElement("canvas");canvas.width=960;canvas.height=540;canvas.style.cssText="width:100%;height:100%;object-fit:contain;image-rendering:auto;background:#02050a";stage.appendChild(canvas);
      var ctx=canvas.getContext("2d"),env=new root.Image(),A=root.KATRIN_MANCHEZ||null,dog=A&&A.src?new root.Image():null,envReady=false,done=false,start=performance.now(),raf=0;
      function fail(msg){if(done)return;done=true;try{root.cancelAnimationFrame(raf);}catch(_){}root.__goodBoysDeckAssetState={asset:DECK_SRC,loaded:false,error:msg,at:Date.now()};remove("good-boys-deck-supplied");reject(new Error(msg));}
      function render(now){if(done)return;ctx.fillStyle="#02050a";ctx.fillRect(0,0,960,540);if(!envReady){raf=root.requestAnimationFrame(render);return;}var fr=DECK_FRAME;ctx.imageSmoothingEnabled=true;ctx.drawImage(env,fr[0],fr[1],fr[2],fr[3],0,0,960,375);var floor=ctx.createLinearGradient(0,330,0,540);floor.addColorStop(0,"rgba(7,11,16,.08)");floor.addColorStop(1,"rgba(2,5,10,.88)");ctx.fillStyle=floor;ctx.fillRect(0,330,960,210);if(A&&dog){drawActor(ctx,A,dog,"kat_idle0",360,460,126,false);drawActor(ctx,A,dog,"man_idle0",485,460,126,false);}var pulse=.55+.35*Math.sin((now-start)/180);ctx.save();ctx.strokeStyle="rgba(255,166,55,"+pulse+")";ctx.lineWidth=4;ctx.shadowColor="#ff8a22";ctx.shadowBlur=18;ctx.strokeRect(650,245,145,110);ctx.restore();ctx.fillStyle="rgba(3,7,12,.82)";ctx.fillRect(610,385,260,48);ctx.fillStyle="#ffd18a";ctx.font="700 15px monospace";ctx.textAlign="center";ctx.fillText("CREW STATION · USE / INTERACT",740,414);root.__goodBoysDeckAssetState={asset:"GOOD_BOYS_SHIP_ARCADE.ship_large",src:DECK_SRC,loaded:true,actorAtlas:"KATRIN_MANCHEZ",singleActorAtlas:true,at:Date.now()};raf=root.requestAnimationFrame(render);}
      controls.style.cssText="display:grid;grid-template-columns:1fr;gap:8px";controls.innerHTML='<button type="button" style="min-height:60px;border:1px solid #ff9e3d;background:#15100c;color:#fff;font:700 14px monospace;letter-spacing:.08em;touch-action:manipulation">USE / INTERACT</button>';
      function finish(e){if(done)return;done=true;if(e){e.preventDefault();e.stopPropagation();}try{root.cancelAnimationFrame(raf);}catch(_){}root.__goodBoysDeckInteract={completed:true,interaction:"crew-station",asset:"GOOD_BOYS_SHIP_ARCADE.ship_large",at:Date.now()};root.__goodBoysOpeningPhase={phase:"ship-deck-complete",owner:"good-ship-deck-v2",at:Date.now()};remove("good-boys-deck-supplied");resolve({completed:true,interaction:"crew-station",asset:"GOOD_BOYS_SHIP_ARCADE.ship_large"});}
      var b=controls.querySelector("button");b.addEventListener("pointerup",finish,{once:true});b.addEventListener("click",finish,{once:true});root.document.body.appendChild(host);root.__goodBoysDeckInteract={completed:false,asset:"GOOD_BOYS_SHIP_ARCADE.ship_large",at:Date.now()};env.onload=function(){envReady=!!env.naturalWidth;if(!envReady){fail("Good Ship cockpit art decoded empty");return;}raf=root.requestAnimationFrame(render);};env.onerror=function(){fail("Good Ship cockpit art failed to load: "+DECK_SRC);};env.src=DECK_SRC;if(dog)dog.src=A.src;
    });}
    showDeckInteraction.__goodShipDeckV2=true;opening.showDeckInteraction=showDeckInteraction;root.__goodBoysDeckSceneAuthority={owner:"good-ship-deck-v2",asset:"GOOD_BOYS_SHIP_ARCADE.ship_large",src:DECK_SRC,actorAtlas:"KATRIN_MANCHEZ",version:VERSION,at:Date.now()};return true;
  }
  var timer=root.setInterval(function(){if(install())root.clearInterval(timer);},50);install();root.TechOpsGoodBoysShipDeckScene={VERSION:VERSION,install:install};
})(typeof globalThis!=="undefined"?globalThis:this);
