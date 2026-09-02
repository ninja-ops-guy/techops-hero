/* TechOps Hero — Good Boys ship-deck production authority v4.
 * The cockpit never blocks on a network image request. A deterministic cockpit
 * renders on the first frame, the exact user-supplied JS-backed plate promotes
 * in when decoded, and the physical Good Ship atlas is an optional enhancement.
 * KATRIN_MANCHEZ remains the sole actor atlas.
 */
(function(root){
  "use strict";
  if(!root||!root.document)return;
  var VERSION=4;
  var DECK_SRC="assets/good_boys/good_ship_arcade.atlas.png";
  var DECK_FRAME=[0,405,292,114];
  var PRIME_KEY="__goodBoysCockpitPrimeV4";
  function remove(id){try{var n=root.document.getElementById(id);if(n)n.remove();}catch(_){}}
  function drawActor(ctx,A,img,key,cx,base,h,flip){try{var fr=A&&A.frames&&A.frames[key];if(!fr||!img||!img.complete||!img.naturalWidth)return false;var w=h*(fr[2]/fr[3]);ctx.save();ctx.imageSmoothingEnabled=false;if(flip){ctx.translate(cx,0);ctx.scale(-1,1);ctx.drawImage(img,fr[0],fr[1],fr[2],fr[3],-w/2,base-h,w,h);}else ctx.drawImage(img,fr[0],fr[1],fr[2],fr[3],cx-w/2,base-h,w,h);ctx.restore();return true;}catch(_){return false;}}
  function drawGuaranteedDeck(ctx,now){
    var g=ctx.createLinearGradient(0,0,0,540);g.addColorStop(0,"#10213a");g.addColorStop(.5,"#07111f");g.addColorStop(1,"#02050a");ctx.fillStyle=g;ctx.fillRect(0,0,960,540);
    ctx.fillStyle="#121e2c";ctx.fillRect(0,340,960,200);ctx.fillStyle="#24364a";for(var x=0;x<960;x+=96)ctx.fillRect(x,344,2,196);
    ctx.strokeStyle="#4d7898";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(70,300);ctx.quadraticCurveTo(480,20,890,300);ctx.stroke();
    ctx.strokeStyle="#203b53";ctx.lineWidth=22;ctx.beginPath();ctx.moveTo(92,298);ctx.quadraticCurveTo(480,48,868,298);ctx.stroke();
    var starShift=Math.floor((now||0)/80)%41;ctx.fillStyle="#cfefff";for(var i=0;i<42;i++){var sx=(i*137+starShift*3)%760+100,sy=(i*67)%220+62;ctx.fillRect(sx,sy,i%5===0?3:2,i%5===0?3:2);}
    ctx.fillStyle="#19314a";ctx.fillRect(110,285,190,95);ctx.fillRect(660,285,190,95);ctx.strokeStyle="#ff9e3d";ctx.lineWidth=3;ctx.strokeRect(125,300,160,62);ctx.strokeRect(675,300,160,62);
    ctx.fillStyle="#0a1826";ctx.beginPath();ctx.moveTo(410,430);ctx.lineTo(455,290);ctx.lineTo(505,290);ctx.lineTo(550,430);ctx.closePath();ctx.fill();ctx.strokeStyle="#5d819e";ctx.stroke();
    ctx.fillStyle="#72dcff";ctx.font="700 13px monospace";ctx.textAlign="center";ctx.fillText("GOOD SHIP // CREW DECK",480,90);
  }
  function primeAtlas(){if(root[PRIME_KEY])return root[PRIME_KEY];var img=new root.Image();root[PRIME_KEY]=img;img.decoding="async";try{img.src=DECK_SRC;}catch(_){}return img;}
  function install(){
    var opening=root.TechOpsGoodBoysOpeningV4;if(!opening)return false;
    if(opening.showDeckInteraction&&opening.showDeckInteraction.__goodShipDeckV4)return true;
    function showDeckInteraction(){return new Promise(function(resolve){
      ["good-boys-ship-interlude","good-boys-deck-v4","good-boys-deck-supplied"].forEach(remove);
      root.__goodBoysOpeningPhase={phase:"ship-deck-interact",owner:"good-ship-deck-v4",assetAuthority:"js-first",at:Date.now()};
      var host=root.document.createElement("div");host.id="good-boys-deck-supplied";host.style.cssText="position:fixed;inset:0;z-index:150300;background:#02050a;color:#eff8ff;font-family:monospace;display:flex;align-items:center;justify-content:center;padding:max(8px,env(safe-area-inset-top)) 8px max(8px,env(safe-area-inset-bottom));box-sizing:border-box";
      host.innerHTML='<div style="width:min(100%,980px);height:min(100%,760px);display:grid;grid-template-rows:auto 1fr auto;gap:8px;min-height:0"><div style="display:flex;justify-content:space-between;gap:10px;align-items:center;padding:4px 2px"><b style="color:#ffb14a;letter-spacing:.12em">GOOD SHIP · COCKPIT</b><span style="font-size:10px;color:#a8c6d8">CREW STATION ONLINE</span></div><div data-stage style="position:relative;min-height:0;overflow:hidden;border:1px solid #5c3b26;background:#02050a;box-shadow:0 16px 50px #000"></div><div data-controls></div></div>';
      var stage=host.querySelector("[data-stage]"),controls=host.querySelector("[data-controls]"),canvas=root.document.createElement("canvas");canvas.width=960;canvas.height=540;canvas.style.cssText="width:100%;height:100%;object-fit:contain;image-rendering:pixelated;background:#02050a";stage.appendChild(canvas);
      var ctx=canvas.getContext("2d"),atlas=primeAtlas(),inlineDef=root.GOOD_BOYS_SHIP_DECK_USER_ASSET||null,inlineImg=inlineDef&&inlineDef.src?new root.Image():null,A=root.KATRIN_MANCHEZ||null,dog=A&&A.src?new root.Image():null,done=false,start=performance.now(),raf=0,inlineReady=false,atlasReady=!!(atlas&&atlas.complete&&atlas.naturalWidth),dogReady=false;
      function render(now){if(done)return;drawGuaranteedDeck(ctx,now);
        if(inlineReady){ctx.save();ctx.imageSmoothingEnabled=false;ctx.globalAlpha=.96;ctx.drawImage(inlineImg,0,0,inlineImg.naturalWidth,inlineImg.naturalHeight,0,70,960,330);ctx.restore();}
        if(atlasReady){try{var fr=DECK_FRAME;ctx.save();ctx.imageSmoothingEnabled=false;ctx.globalAlpha=inlineReady?.34:1;ctx.drawImage(atlas,fr[0],fr[1],fr[2],fr[3],0,0,960,540);ctx.restore();}catch(_){atlasReady=false;}}
        var shade=ctx.createLinearGradient(0,300,0,540);shade.addColorStop(0,"rgba(2,5,10,0)");shade.addColorStop(1,"rgba(2,5,10,.66)");ctx.fillStyle=shade;ctx.fillRect(0,300,960,240);
        if(dogReady&&A){drawActor(ctx,A,dog,"kat_idle0",365,475,128,false);drawActor(ctx,A,dog,"man_idle0",505,475,128,false);}else{ctx.fillStyle="#d9ecff";ctx.font="700 15px monospace";ctx.textAlign="center";ctx.fillText("KATRIN",365,470);ctx.fillText("MANCHEZ",505,470);}
        var pulse=.55+.35*Math.sin((now-start)/190);ctx.save();ctx.fillStyle="rgba(255,158,61,"+(pulse*.22)+")";ctx.strokeStyle="rgba(255,190,92,"+pulse+")";ctx.lineWidth=3;ctx.shadowColor="#ff8a22";ctx.shadowBlur=14;ctx.beginPath();ctx.arc(704,324,28,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();ctx.fillStyle="rgba(3,7,12,.84)";ctx.fillRect(585,370,245,42);ctx.fillStyle="#ffd18a";ctx.font="700 14px monospace";ctx.textAlign="center";ctx.fillText("CREW CONSOLE · USE",707,397);
        root.__goodBoysDeckAssetState={asset:inlineReady?"GOOD_BOYS_SHIP_DECK_USER_ASSET":atlasReady?"GOOD_BOYS_SHIP_ARCADE.ship_large":"guaranteed-cockpit-render",src:atlasReady?DECK_SRC:null,loaded:true,inlineReady:inlineReady,atlasReady:atlasReady,actorAtlas:"KATRIN_MANCHEZ",actorReady:dogReady,singleActorAtlas:true,nonBlocking:true,at:Date.now()};raf=root.requestAnimationFrame(render);
      }
      controls.style.cssText="display:grid;grid-template-columns:1fr;gap:8px";controls.innerHTML='<button type="button" style="min-height:60px;border:1px solid #ff9e3d;background:#15100c;color:#fff;font:700 14px monospace;letter-spacing:.08em;touch-action:manipulation">USE / INTERACT</button>';
      function finish(e){if(done)return;done=true;if(e){try{e.preventDefault();e.stopPropagation();}catch(_){}}try{root.cancelAnimationFrame(raf);}catch(_){}root.__goodBoysDeckInteract={completed:true,interaction:"crew-console",asset:inlineReady?"GOOD_BOYS_SHIP_DECK_USER_ASSET":atlasReady?"GOOD_BOYS_SHIP_ARCADE.ship_large":"guaranteed-cockpit-render",at:Date.now()};root.__goodBoysOpeningPhase={phase:"ship-deck-complete",owner:"good-ship-deck-v4",at:Date.now()};remove("good-boys-deck-supplied");resolve({completed:true,interaction:"crew-console",asset:root.__goodBoysDeckInteract.asset});}
      controls.querySelector("button").addEventListener("click",finish,{once:true});root.document.body.appendChild(host);root.__goodBoysDeckInteract={completed:false,asset:"js-first-cockpit",at:Date.now()};
      if(inlineImg){inlineImg.onload=function(){inlineReady=!!inlineImg.naturalWidth;};inlineImg.onerror=function(){root.__goodBoysDeckInlineError="inline cockpit plate decode failed";};inlineImg.src=inlineDef.src;}
      if(atlas){atlas.onload=function(){atlasReady=!!atlas.naturalWidth;};atlas.onerror=function(){atlasReady=false;root.__goodBoysDeckAtlasError="Good Ship atlas unavailable; continuing on JS cockpit authority";};}
      if(dog){dog.onload=function(){dogReady=!!dog.naturalWidth;};dog.onerror=function(){dogReady=false;root.__goodBoysDeckActorError="KATRIN_MANCHEZ actor atlas unavailable in cockpit";};dog.src=A.src;}
      raf=root.requestAnimationFrame(render);
    });}
    showDeckInteraction.__goodShipDeckV4=true;showDeckInteraction.__goodShipDeckV3=true;opening.showDeckInteraction=showDeckInteraction;root.__goodBoysDeckSceneAuthority={owner:"good-ship-deck-v4",assetAuthority:"js-first",fallback:"guaranteed-cockpit-render",enhancement:DECK_SRC,actorAtlas:"KATRIN_MANCHEZ",version:VERSION,at:Date.now()};return true;
  }
  primeAtlas();var timer=root.setInterval(function(){if(install())root.clearInterval(timer);},50);install();root.TechOpsGoodBoysShipDeckScene={VERSION:VERSION,install:install,src:DECK_SRC};
})(typeof globalThis!=="undefined"?globalThis:this);
