/* TechOps Hero — Good Boys asteroid approach gameplay v1
 * Inserts a short playable ship approach after the three-system deck interaction
 * and before GD_CUT_02. Uses only the supplied Good Ship asset sheet extractions.
 */
(function(root){
  "use strict";
  if(!root||root.TechOpsGoodBoysShipApproach)return;
  var VERSION=1,active=false,overlay=null,raf=0,atlasImage=null,wrapped=false,originalPlay=null;
  var API=null;
  var DURATION_MS=4200;
  var ATLAS={VERSION:1,src:"assets/good_boys/good_ship_arcade.atlas.png?v=20260902-ship-approach-r1",width:768,height:520,frames:{space_bg:[0,0,552,60],ship_player:[600,0,76,98],prison_station:[0,80,380,250],prison_dock:[390,80,161,147],asteroid_1:[570,110,94,90],asteroid_2:[670,110,62,66],asteroid_3:[570,205,55,48],asteroid_4:[640,205,54,49],asteroid_5:[700,205,55,52],lead_1:[0,350,82,38],lead_2:[98,350,77,35],lead_3:[191,350,97,55],lead_4:[304,350,118,77],ship_large:[0,405,292,114]},source:"user-provided Good Ship asset sheet"};
  if(!root.GOOD_BOYS_SHIP_ARCADE)root.GOOD_BOYS_SHIP_ARCADE=ATLAS;

  function atlas(){return root.GOOD_BOYS_SHIP_ARCADE||ATLAS;}
  function frame(name){var a=atlas();return a&&a.frames&&a.frames[name]||null;}
  function loadAtlas(){
    return new Promise(function(resolve){
      var a=atlas();
      if(!a||!a.src){resolve(null);return;}
      if(atlasImage&&atlasImage.complete&&atlasImage.naturalWidth){resolve(atlasImage);return;}
      var img=new root.Image();atlasImage=img;
      var settled=false,done=function(ok){if(settled)return;settled=true;resolve(ok?img:null);};
      img.onload=function(){done(true);};img.onerror=function(){done(false);};img.src=a.src;
      root.setTimeout(function(){done(!!(img.complete&&img.naturalWidth));},2500);
    });
  }
  function drawFrame(ctx,name,dx,dy,dw,dh,alpha){
    var fr=frame(name);if(!atlasImage||!fr)return false;
    var sw=fr[2],sh=fr[3];if(!dh)dh=dw*(sh/sw);
    ctx.save();if(alpha!==undefined)ctx.globalAlpha=alpha;
    ctx.drawImage(atlasImage,fr[0],fr[1],sw,sh,dx,dy,dw,dh);ctx.restore();return true;
  }
  function makeOverlay(){
    var old=root.document&&root.document.getElementById("good-boys-ship-approach");if(old)old.remove();
    var el=root.document.createElement("div");el.id="good-boys-ship-approach";
    el.innerHTML='<div class="gbsa-shell"><div class="gbsa-top"><div><b>GOOD SHIP · PRISON VECTOR</b><span>AVOID ASTEROIDS</span></div><div class="gbsa-distance">PRISON <strong>6.8 km</strong></div></div><canvas width="960" height="540" aria-label="Good Ship asteroid approach"></canvas><div class="gbsa-bottom"><div class="gbsa-shield">HULL <span>● ● ●</span></div><div class="gbsa-progress"><i></i></div><div class="gbsa-controls"><button data-steer="-1" aria-label="Steer left">◀</button><button data-steer="1" aria-label="Steer right">▶</button></div></div></div>';
    var style=root.document.getElementById("good-boys-ship-approach-style");
    if(!style){style=root.document.createElement("style");style.id="good-boys-ship-approach-style";style.textContent='#good-boys-ship-approach{position:fixed;inset:0;z-index:150190;background:#02050b;display:flex;align-items:center;justify-content:center;padding:max(8px,env(safe-area-inset-top)) 8px max(8px,env(safe-area-inset-bottom));box-sizing:border-box;color:#eaf6ff;font-family:monospace;touch-action:none}#good-boys-ship-approach .gbsa-shell{width:min(100%,980px);display:grid;gap:7px}#good-boys-ship-approach .gbsa-top{display:flex;justify-content:space-between;align-items:end;gap:10px;font-size:11px;color:#9be8cf;letter-spacing:.08em}#good-boys-ship-approach .gbsa-top span{display:block;color:#ffd166;margin-top:3px}.gbsa-distance{color:#9cb8c7}.gbsa-distance strong{color:#fff}#good-boys-ship-approach canvas{width:100%;max-height:70vh;aspect-ratio:16/9;border:1px solid #35586d;background:#020713;box-shadow:0 14px 55px #000;image-rendering:auto}.gbsa-bottom{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:10px}.gbsa-shield{font-size:10px;color:#9cb8c7}.gbsa-shield span{color:#67e8f9}.gbsa-progress{height:7px;border:1px solid #29495c;background:#06111b;overflow:hidden}.gbsa-progress i{display:block;height:100%;width:0;background:linear-gradient(90deg,#3fa9f5,#8df1ce)}.gbsa-controls{display:flex;gap:7px}.gbsa-controls button{width:72px;min-height:48px;border:1px solid #5cbde8;background:#071624;color:#fff;font:700 16px monospace;touch-action:none}@media(max-width:600px){#good-boys-ship-approach .gbsa-top{font-size:9px}#good-boys-ship-approach canvas{max-height:58vh}.gbsa-bottom{grid-template-columns:1fr 1fr;gap:7px}.gbsa-shield{grid-column:1/2}.gbsa-progress{grid-column:2/3}.gbsa-controls{grid-column:1/3}.gbsa-controls button{flex:1;width:auto}}';(root.document.head||root.document.documentElement).appendChild(style);}
    root.document.body.appendChild(el);return el;
  }
  function runFlight(){
    if(active)return Promise.resolve({completed:false,busy:true});
    if(!root.document)return Promise.resolve({completed:false,missing:true});
    active=true;root.__goodBoysShipApproach={active:true,phase:"flight",progress:0,hull:3,hits:0,at:Date.now()};
    return loadAtlas().then(function(img){
      if(!img){active=false;root.__goodBoysShipApproach={active:false,phase:"asset-error",completed:false,at:Date.now()};return {completed:false,assetError:true};}
      return new Promise(function(resolve){
        overlay=makeOverlay();var canvas=overlay.querySelector("canvas"),ctx=canvas.getContext("2d"),bar=overlay.querySelector(".gbsa-progress i"),dist=overlay.querySelector(".gbsa-distance strong"),hullEl=overlay.querySelector(".gbsa-shield span");
        var W=canvas.width,H=canvas.height,ship={x:W/2,y:H-112,w:62,h:80},held=0,start=performance.now(),last=start,spawnAt=0,hull=3,hits=0,objects=[],done=false,starOffset=0;
        var spawnPlan=[420,1080,1740,2400,3060,3500];
        function spawn(){var idx=objects.length%5+1,lanes=[150,300,470,635,800],lane=lanes[(objects.length*2+1)%lanes.length];objects.push({key:"asteroid_"+idx,x:lane,y:-80,w:52+idx*4,h:50+idx*3,speed:185+idx*18,dead:false});}
        function snapshot(progress){root.__goodBoysShipApproach={active:!done,phase:"flight",progress:progress,hull:hull,hits:hits,shipX:Math.round(ship.x),asteroids:objects.filter(function(o){return !o.dead;}).length,distanceKm:Number((6.8*(1-progress)).toFixed(1)),completed:done,at:Date.now()};}
        function hit(o){if(o.dead)return;o.dead=true;hits++;hull=Math.max(0,hull-1);hullEl.textContent=[0,1,2].map(function(i){return i<hull?"●":"○";}).join(" ");root.__goodBoysShipApproachHit={hits:hits,hull:hull,at:Date.now()};if(hull===0){hull=3;root.setTimeout(function(){hullEl.textContent="● ● ●";},350);}}
        function collide(a,b){return a.x-a.w/2<b.x+b.w/2&&a.x+a.w/2>b.x-b.w/2&&a.y-a.h/2<b.y+b.h/2&&a.y+a.h/2>b.y-b.h/2;}
        function drawBg(dt){starOffset=(starOffset+dt*75)%60;var fr=frame("space_bg");if(fr){for(var y=-60+starOffset;y<H;y+=60){for(var x=0;x<W;x+=552){ctx.drawImage(atlasImage,fr[0],fr[1],fr[2],fr[3],x,y,552,60);}}}ctx.fillStyle="rgba(1,4,10,.28)";ctx.fillRect(0,0,W,H);}
        function draw(ts){if(done)return;var dt=Math.min(.05,(ts-last)/1000||0);last=ts;var elapsed=ts-start,progress=Math.min(1,elapsed/DURATION_MS);
          while(spawnAt<spawnPlan.length&&elapsed>=spawnPlan[spawnAt]){spawn();spawnAt++;}
          ship.x=Math.max(60,Math.min(W-60,ship.x+held*330*dt));
          for(var i=0;i<objects.length;i++){var o=objects[i];if(o.dead)continue;o.y+=o.speed*dt;if(o.y>H+90)o.dead=true;if(collide(ship,o))hit(o);}
          ctx.clearRect(0,0,W,H);drawBg(dt);
          var pScale=.22+.42*progress,pW=380*pScale,pH=250*pScale;drawFrame(ctx,"prison_station",W/2-pW/2,18,pW,pH,.42+.45*progress);
          ctx.fillStyle="rgba(103,232,249,.16)";ctx.fillRect(W/2-1,85,2,H-190);
          for(var j=0;j<objects.length;j++){var a=objects[j];if(!a.dead)drawFrame(ctx,a.key,a.x-a.w/2,a.y-a.h/2,a.w,a.h);}
          drawFrame(ctx,"ship_player",ship.x-ship.w/2,ship.y-ship.h/2,ship.w,ship.h);
          bar.style.width=Math.round(progress*100)+"%";dist.textContent=(6.8*(1-progress)).toFixed(1)+" km";snapshot(progress);
          if(progress>=1){done=true;snapshot(1);root.setTimeout(function(){cleanup();runApproachCutscene().then(function(c){resolve({completed:true,hits:hits,cutscene:c});});},120);return;}
          raf=root.requestAnimationFrame(draw);
        }
        function setHeld(v){held=v;}
        function keydown(e){if(e.key==="ArrowLeft"||e.key==="a"||e.key==="A"){e.preventDefault();setHeld(-1);}if(e.key==="ArrowRight"||e.key==="d"||e.key==="D"){e.preventDefault();setHeld(1);}}
        function keyup(e){if(["ArrowLeft","ArrowRight","a","A","d","D"].indexOf(e.key)>=0)setHeld(0);}
        function wire(btn,dir){btn.addEventListener("pointerdown",function(e){e.preventDefault();try{btn.setPointerCapture(e.pointerId);}catch(_){}setHeld(dir);});["pointerup","pointercancel","lostpointercapture"].forEach(function(n){btn.addEventListener(n,function(){setHeld(0);});});}
        function pointerMove(e){if(!(e.buttons||e.pressure>0))return;var r=canvas.getBoundingClientRect();ship.x=(e.clientX-r.left)/r.width*W;}
        function cleanup(){try{root.cancelAnimationFrame(raf);}catch(_){}root.removeEventListener("keydown",keydown,true);root.removeEventListener("keyup",keyup,true);canvas.removeEventListener("pointermove",pointerMove);try{overlay.remove();}catch(_){}overlay=null;active=false;}
        wire(overlay.querySelector('[data-steer="-1"]'),-1);wire(overlay.querySelector('[data-steer="1"]'),1);root.addEventListener("keydown",keydown,true);root.addEventListener("keyup",keyup,true);canvas.addEventListener("pointermove",pointerMove,{passive:true});raf=root.requestAnimationFrame(draw);
        API.finish=function(){if(done)return false;start=performance.now()-DURATION_MS;return true;};
      });
    });
  }
  function runApproachCutscene(){
    if(!root.document||!atlasImage)return Promise.resolve({completed:false});
    return new Promise(function(resolve){
      var el=root.document.createElement("div");el.id="good-boys-prison-approach-cine";el.style.cssText="position:fixed;inset:0;z-index:150195;background:#01040a;display:flex;align-items:center;justify-content:center;pointer-events:none";
      var c=root.document.createElement("canvas");c.width=960;c.height=540;c.style.cssText="width:100%;height:100%;object-fit:contain";el.appendChild(c);root.document.body.appendChild(el);var ctx=c.getContext("2d"),start=performance.now(),last=0;
      root.__goodBoysPrisonApproachCine={active:true,at:Date.now()};
      function tick(ts){var t=Math.min(1,(ts-start)/2600);ctx.clearRect(0,0,960,540);var fr=frame("space_bg");if(fr){for(var y=0;y<540;y+=60)for(var x=0;x<960;x+=552)ctx.drawImage(atlasImage,fr[0],fr[1],fr[2],fr[3],x,y,552,60);}ctx.fillStyle="rgba(0,0,0,.15)";ctx.fillRect(0,0,960,540);
        var ps=.38+.62*t,pw=380*ps,ph=250*ps;drawFrame(ctx,"prison_station",480-pw/2,34+(1-t)*45,pw,ph,1);
        var key="lead_"+(1+Math.min(3,Math.floor(t*4))),sw=120+150*t,sy=410-80*t;drawFrame(ctx,key,80+430*t,sy,sw,null,1);
        ctx.fillStyle="#9be8cf";ctx.font="700 16px monospace";ctx.fillText("BLACKSITE MERIDIAN // APPROACH",24,34);ctx.fillStyle="#ffd166";ctx.font="700 12px monospace";ctx.fillText(t<.7?"PRISON VECTOR LOCKED":"DOCK WINDOW ACQUIRED",24,55);
        if(t<1){raf=root.requestAnimationFrame(tick);return;}root.__goodBoysPrisonApproachCine={active:false,completed:true,at:Date.now()};root.setTimeout(function(){try{el.remove();}catch(_){}resolve({completed:true});},180);
      }raf=root.requestAnimationFrame(tick);
    });
  }
  function install(){
    var g=root.GoodDogsCutscenes;if(!g||typeof g.play!=="function"||wrapped)return false;
    originalPlay=g.play.bind(g);g.play=function(id,options){
      var p=root.__goodBoysOpeningPhase,opening=!!(p&&p.phase==="clip2");
      if(id==="GD_CUT_02"&&opening&&!root.__goodBoysShipApproachPlayed){
        root.__goodBoysShipApproachPlayed=true;return runFlight().catch(function(e){root.__goodBoysShipApproachError=String(e&&e.stack||e);return {completed:false,error:true};}).then(function(){return originalPlay(id,options);});
      }
      return originalPlay(id,options);
    };g.play.__goodBoysShipApproachWrapped=VERSION;wrapped=true;return true;
  }
  API=root.TechOpsGoodBoysShipApproach={VERSION:VERSION,install:install,runFlight:runFlight,runApproachCutscene:runApproachCutscene,get active(){return active;},snapshot:function(){return root.__goodBoysShipApproach||null;},finish:function(){return false;}};
  var tries=0,timer=root.setInterval(function(){tries++;if(install()||tries>200)root.clearInterval(timer);},25);install();
})(typeof globalThis!=="undefined"?globalThis:this);
