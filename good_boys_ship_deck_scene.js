/* Good Boys ship deck scene — supplied-art authority v2.
 * Uses the user-supplied cockpit art, KATRIN_MANCHEZ actor atlas, and the
 * extracted cockpit pilot asset. The player must physically approach the pilot
 * before INTERACT can advance the opening; no procedural pilot is permitted.
 */
(function(root){
  "use strict";
  if(!root||!root.document)return;
  var prior=root.TechOpsGoodBoysShipDeckScene;
  if(prior&&Number(prior.VERSION||0)>=2)return;
  var VERSION=2,PILOT_SRC="assets/v736/good_boys_ship/cockpit_pilot.jpg";
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
    var opening=root.TechOpsGoodBoysOpeningV4,asset=root.GOOD_BOYS_SHIP_DECK_USER_ASSET;
    if(!opening||!asset||!asset.src)return false;
    if(opening.showDeckInteraction&&opening.showDeckInteraction.__suppliedDeckAssetV2)return true;
    function showDeckInteraction(){return new Promise(function(resolve){
      remove("good-boys-ship-interlude");remove("good-boys-deck-v4");remove("good-boys-deck-supplied");
      root.__goodBoysOpeningPhase={phase:"ship-deck-interact",owner:"supplied-ship-deck-scene-v2",at:Date.now()};
      var host=root.document.createElement("div");host.id="good-boys-deck-supplied";
      host.style.cssText="position:fixed;inset:0;z-index:150300;background:#02050a;color:#eff8ff;font-family:monospace;display:flex;align-items:center;justify-content:center;padding:max(8px,env(safe-area-inset-top)) 8px max(8px,env(safe-area-inset-bottom));box-sizing:border-box";
      host.innerHTML='<div style="width:min(100%,980px);height:min(100%,760px);display:grid;grid-template-rows:auto 1fr auto;gap:8px;min-height:0"><div style="display:flex;justify-content:space-between;gap:10px;align-items:center;padding:4px 2px"><b style="color:#ffb14a;letter-spacing:.12em">GOOD SHIP · COCKPIT</b><span data-objective style="font-size:10px;color:#a8c6d8;text-align:right">MOVE TO THE PILOT · INTERACT</span></div><div data-stage style="position:relative;min-height:0;overflow:hidden;border:1px solid #5c3b26;background:#02050a;box-shadow:0 16px 50px #000"></div><div data-controls></div></div>';
      var stage=host.querySelector("[data-stage]"),controls=host.querySelector("[data-controls]"),objective=host.querySelector("[data-objective]");
      var canvas=root.document.createElement("canvas");canvas.width=960;canvas.height=420;canvas.style.cssText="width:100%;height:100%;object-fit:contain;image-rendering:auto;background:#02050a";stage.appendChild(canvas);
      var ctx=canvas.getContext("2d"),env=new root.Image(),pilot=new root.Image(),A=root.KATRIN_MANCHEZ||null,dog=A&&A.src?new root.Image():null;
      var done=false,start=(root.performance&&root.performance.now?root.performance.now():Date.now()),last=start,raf=0,move=0,playerX=270,partnerX=205,pilotX=780,near=false,pilotFailed=false;
      env.src=asset.src;pilot.src=PILOT_SRC;if(dog)dog.src=A.src;
      function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
      function pilotReady(){return !!(pilot.complete&&pilot.naturalWidth&&!pilotFailed);}
      function setMove(v,e){if(e){try{e.preventDefault();e.stopPropagation();}catch(_){}}move=v;}
      function updateTelemetry(completed){root.__goodBoysDeckInteract={version:VERSION,completed:!!completed,interaction:"pilot",playerX:Math.round(playerX),pilotX:pilotX,nearPilot:near,pilotAsset:PILOT_SRC,pilotAssetReady:pilotReady(),pilotAssetFailed:pilotFailed,actorAtlas:"KATRIN_MANCHEZ",at:Date.now()};}
      function onKey(e){var k=String(e.key||"").toLowerCase();if(k==="arrowleft"||k==="a"){setMove(-1,e);}else if(k==="arrowright"||k==="d"){setMove(1,e);}else if(k==="e"||k==="enter"||k===" "){interact(e);}}
      function onKeyUp(e){var k=String(e.key||"").toLowerCase();if(k==="arrowleft"||k==="a"||k==="arrowright"||k==="d")setMove(0,e);}
      function cleanup(){try{root.cancelAnimationFrame(raf);}catch(_){}root.removeEventListener("keydown",onKey,true);root.removeEventListener("keyup",onKeyUp,true);remove("good-boys-deck-supplied");}
      function interact(e){
        if(e){try{e.preventDefault();e.stopPropagation();}catch(_){}}
        near=Math.abs(playerX-pilotX)<=112;
        if(!near){objective.textContent="MOVE CLOSER TO THE PILOT";updateTelemetry(false);return false;}
        if(!pilotReady()){objective.textContent="PILOT ASSET NOT READY";updateTelemetry(false);return false;}
        if(done)return true;done=true;updateTelemetry(true);root.__goodBoysOpeningPhase={phase:"ship-deck-complete",owner:"supplied-ship-deck-scene-v2",at:Date.now()};cleanup();resolve({completed:true,interaction:"pilot",pilotAsset:PILOT_SRC});return true;
      }
      function drawPilot(){
        if(pilotReady()){
          var h=154,w=h*(pilot.naturalWidth/pilot.naturalHeight);w=Math.min(w,154);
          ctx.save();ctx.imageSmoothingEnabled=true;ctx.drawImage(pilot,pilotX-w/2,168,w,h);ctx.restore();
          return true;
        }
        ctx.save();ctx.fillStyle="rgba(90,8,12,.92)";ctx.fillRect(704,182,152,112);ctx.strokeStyle="#ff475d";ctx.strokeRect(704.5,182.5,152,112);ctx.fillStyle="#ffd8dc";ctx.font="700 12px monospace";ctx.textAlign="center";ctx.fillText("PILOT ASSET",780,228);ctx.fillText(pilotFailed?"MISSING":"LOADING",780,248);ctx.restore();return false;
      }
      function render(now){
        if(done)return;
        var dt=Math.min(34,Math.max(0,now-last));last=now;
        playerX=clamp(playerX+move*0.31*dt,100,820);partnerX+=(playerX-72-partnerX)*Math.min(1,dt*.0085);near=Math.abs(playerX-pilotX)<=112;
        ctx.fillStyle="#02050a";ctx.fillRect(0,0,960,420);
        if(env.complete&&env.naturalWidth){ctx.imageSmoothingEnabled=true;ctx.drawImage(env,0,0,asset.width||640,asset.height||160,0,56,960,240);}
        var floor=ctx.createLinearGradient(0,270,0,420);floor.addColorStop(0,"rgba(8,16,24,.12)");floor.addColorStop(1,"rgba(2,5,10,.98)");ctx.fillStyle=floor;ctx.fillRect(0,265,960,155);
        drawPilot();
        if(A&&dog){var walking=Math.abs(move)>.1,keyK=walking?"kat_idle1":"kat_idle0",keyM=walking?"man_idle1":"man_idle0";drawActor(ctx,A,dog,keyM,partnerX,350,108,move<0);drawActor(ctx,A,dog,keyK,playerX,350,116,move<0);}
        var pulse=.55+.35*Math.sin((now-start)/180);ctx.save();ctx.strokeStyle=near?"rgba(85,223,255,"+pulse+")":"rgba(255,166,55,"+pulse+")";ctx.lineWidth=3;ctx.shadowColor=near?"#55dfff":"#ff8a22";ctx.shadowBlur=16;ctx.strokeRect(700,150,160,178);ctx.restore();
        ctx.fillStyle="rgba(3,7,12,.88)";ctx.fillRect(650,332,260,42);ctx.fillStyle=near?"#9df5ff":"#ffd18a";ctx.font="700 14px monospace";ctx.textAlign="center";ctx.fillText(near?"PILOT · INTERACT":"PILOT · MOVE CLOSER",780,358);
        objective.textContent=pilotFailed?"PILOT ASSET MISSING":near?"PILOT IN RANGE · INTERACT":"MOVE TO THE PILOT · INTERACT";
        var ib=controls.querySelector("#gbs-use");if(ib){ib.textContent=near?"INTERACT":"MOVE TO PILOT";ib.style.opacity=near?"1":".62";}
        root.__goodBoysDeckAssetState={asset:"GOOD_BOYS_SHIP_DECK_USER_ASSET",pilotAsset:PILOT_SRC,pilotAssetReady:pilotReady(),actorAtlas:"KATRIN_MANCHEZ",singleActorAtlas:true,at:Date.now()};updateTelemetry(false);
        raf=root.requestAnimationFrame(render);
      }
      controls.style.cssText="display:grid;grid-template-columns:72px 1fr 72px;gap:8px";
      controls.innerHTML='<button id="gbs-left" type="button">◀</button><button id="gbs-use" type="button">MOVE TO PILOT</button><button id="gbs-right" type="button">▶</button>';
      Array.prototype.forEach.call(controls.querySelectorAll("button"),function(b){b.style.cssText="min-height:56px;border:1px solid #ff9e3d;background:#0b1016;color:#fff;font:700 13px monospace;letter-spacing:.05em;touch-action:none;border-radius:4px";});
      function bindMove(id,v){var b=controls.querySelector(id);b.addEventListener("pointerdown",function(e){setMove(v,e);},{passive:false});["pointerup","pointercancel","pointerleave"].forEach(function(type){b.addEventListener(type,function(e){setMove(0,e);},{passive:false});});}
      bindMove("#gbs-left",-1);bindMove("#gbs-right",1);var use=controls.querySelector("#gbs-use");use.addEventListener("pointerup",interact,{passive:false});use.addEventListener("click",interact);
      root.addEventListener("keydown",onKey,true);root.addEventListener("keyup",onKeyUp,true);
      pilot.onerror=function(){pilotFailed=true;root.__goodBoysPilotAssetError={src:PILOT_SRC,at:Date.now()};updateTelemetry(false);};
      root.document.body.appendChild(host);updateTelemetry(false);raf=root.requestAnimationFrame(render);
    });}
    showDeckInteraction.__suppliedDeckAsset=true;showDeckInteraction.__suppliedDeckAssetV2=true;
    opening.showDeckInteraction=showDeckInteraction;
    root.__goodBoysDeckSceneAuthority={owner:"supplied-ship-deck-scene-v2",asset:"GOOD_BOYS_SHIP_DECK_USER_ASSET",pilotAsset:PILOT_SRC,actorAtlas:"KATRIN_MANCHEZ",version:VERSION,at:Date.now()};
    return true;
  }
  var timer=root.setInterval(function(){if(install()){root.clearInterval(timer);}},50);
  install();root.TechOpsGoodBoysShipDeckScene={VERSION:VERSION,PILOT_SRC:PILOT_SRC,install:install};
})(typeof globalThis!=="undefined"?globalThis:this);
