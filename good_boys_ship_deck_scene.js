/* Good Boys ship deck scene — supplied-art authority.
 * Uses GOOD_BOYS_SHIP_DECK_USER_ASSET for the environment and
 * KATRIN_MANCHEZ for actors. The dog showcase strip from the source sheet is
 * intentionally not used so there is exactly one character atlas authority.
 */
(function(root){
  "use strict";
  if(!root||!root.document||root.TechOpsGoodBoysShipDeckScene)return;
  var VERSION=1;
  function remove(id){try{var n=root.document.getElementById(id);if(n)n.remove();}catch(_){}}
  function drawActor(ctx,A,img,key,cx,base,h,flip){
    try{
      var fr=A&&A.frames&&A.frames[key];
      if(!fr||!img||!img.complete||!img.naturalWidth)return false;
      var w=h*(fr[2]/fr[3]);
      ctx.save();ctx.imageSmoothingEnabled=false;
      if(flip){ctx.translate(cx,0);ctx.scale(-1,1);ctx.drawImage(img,fr[0],fr[1],fr[2],fr[3],-w/2,base-h,w,h);}
      else ctx.drawImage(img,fr[0],fr[1],fr[2],fr[3],cx-w/2,base-h,w,h);
      ctx.restore();return true;
    }catch(_){return false;}
  }
  function install(){
    var opening=root.TechOpsGoodBoysOpeningV4;
    var asset=root.GOOD_BOYS_SHIP_DECK_USER_ASSET;
    if(!opening||!asset||!asset.src)return false;
    if(opening.showDeckInteraction&&opening.showDeckInteraction.__suppliedDeckAsset)return true;
    function showDeckInteraction(){return new Promise(function(resolve){
      remove("good-boys-ship-interlude");remove("good-boys-deck-v4");remove("good-boys-deck-supplied");
      root.__goodBoysOpeningPhase={phase:"ship-deck-interact",owner:"supplied-ship-deck-scene",at:Date.now()};
      var host=root.document.createElement("div");host.id="good-boys-deck-supplied";
      host.style.cssText="position:fixed;inset:0;z-index:150300;background:#02050a;color:#eff8ff;font-family:monospace;display:flex;align-items:center;justify-content:center;padding:max(8px,env(safe-area-inset-top)) 8px max(8px,env(safe-area-inset-bottom));box-sizing:border-box";
      host.innerHTML='<div style="width:min(100%,980px);height:min(100%,760px);display:grid;grid-template-rows:auto 1fr auto;gap:8px;min-height:0"><div style="display:flex;justify-content:space-between;gap:10px;align-items:center;padding:4px 2px"><b style="color:#ffb14a;letter-spacing:.12em">SHIP DECK · LIVE</b><span style="font-size:10px;color:#a8c6d8">APPROACH THE CREW STATION · INTERACT</span></div><div data-stage style="position:relative;min-height:0;overflow:hidden;border:1px solid #5c3b26;background:#02050a;box-shadow:0 16px 50px #000"></div><div data-controls></div></div>';
      var stage=host.querySelector("[data-stage]"),controls=host.querySelector("[data-controls]");
      var canvas=root.document.createElement("canvas");canvas.width=960;canvas.height=420;canvas.style.cssText="width:100%;height:100%;object-fit:contain;image-rendering:auto;background:#02050a";stage.appendChild(canvas);
      var ctx=canvas.getContext("2d"),env=new root.Image(),A=root.KATRIN_MANCHEZ||null,dog=A&&A.src?new root.Image():null,done=false,start=performance.now(),raf=0;
      env.src=asset.src;if(dog)dog.src=A.src;
      function render(now){
        if(done)return;
        ctx.fillStyle="#02050a";ctx.fillRect(0,0,960,420);
        if(env.complete&&env.naturalWidth){
          ctx.imageSmoothingEnabled=true;
          ctx.drawImage(env,0,0,asset.width||640,asset.height||160,0,70,960,240);
        }
        var floor=ctx.createLinearGradient(0,275,0,420);floor.addColorStop(0,"rgba(10,12,16,.08)");floor.addColorStop(1,"rgba(2,5,10,.96)");ctx.fillStyle=floor;ctx.fillRect(0,270,960,150);
        if(A&&dog){drawActor(ctx,A,dog,"kat_idle0",355,340,116,false);drawActor(ctx,A,dog,"man_idle0",475,340,116,false);}
        var pulse=.55+.35*Math.sin((now-start)/180);
        ctx.save();ctx.strokeStyle="rgba(255,166,55,"+pulse+")";ctx.lineWidth=4;ctx.shadowColor="#ff8a22";ctx.shadowBlur=18;ctx.strokeRect(662,166,142,112);ctx.restore();
        ctx.fillStyle="rgba(3,7,12,.82)";ctx.fillRect(620,322,250,48);ctx.fillStyle="#ffd18a";ctx.font="700 15px monospace";ctx.textAlign="center";ctx.fillText("CREW STATION · USE / INTERACT",745,351);
        root.__goodBoysDeckAssetState={asset:"GOOD_BOYS_SHIP_DECK_USER_ASSET",actorAtlas:"KATRIN_MANCHEZ",singleActorAtlas:true,at:Date.now()};
        raf=root.requestAnimationFrame(render);
      }
      controls.style.cssText="display:grid;grid-template-columns:1fr;gap:8px";
      controls.innerHTML='<button type="button" style="min-height:60px;border:1px solid #ff9e3d;background:#15100c;color:#fff;font:700 14px monospace;letter-spacing:.08em;touch-action:manipulation">USE / INTERACT</button>';
      function finish(e){if(done)return;done=true;if(e){e.preventDefault();e.stopPropagation();}try{root.cancelAnimationFrame(raf);}catch(_){}root.__goodBoysDeckInteract={completed:true,interaction:"crew-station",asset:"GOOD_BOYS_SHIP_DECK_USER_ASSET",at:Date.now()};root.__goodBoysOpeningPhase={phase:"ship-deck-complete",owner:"supplied-ship-deck-scene",at:Date.now()};remove("good-boys-deck-supplied");resolve({completed:true,interaction:"crew-station",asset:"GOOD_BOYS_SHIP_DECK_USER_ASSET"});}
      var b=controls.querySelector("button");b.addEventListener("pointerup",finish,{once:true});b.addEventListener("click",finish,{once:true});
      root.document.body.appendChild(host);root.__goodBoysDeckInteract={completed:false,asset:"GOOD_BOYS_SHIP_DECK_USER_ASSET",at:Date.now()};
      env.onload=function(){if(!raf)raf=root.requestAnimationFrame(render);};if(dog)dog.onload=function(){if(!raf)raf=root.requestAnimationFrame(render);};raf=root.requestAnimationFrame(render);
    });}
    showDeckInteraction.__suppliedDeckAsset=true;
    opening.showDeckInteraction=showDeckInteraction;
    root.__goodBoysDeckSceneAuthority={owner:"supplied-ship-deck-scene",asset:"GOOD_BOYS_SHIP_DECK_USER_ASSET",actorAtlas:"KATRIN_MANCHEZ",version:VERSION,at:Date.now()};
    return true;
  }
  var timer=root.setInterval(function(){if(install()){root.clearInterval(timer);}},50);
  install();
  root.TechOpsGoodBoysShipDeckScene={VERSION:VERSION,install:install};
})(typeof globalThis!=="undefined"?globalThis:this);
