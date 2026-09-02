/* TechOps Hero — Good Boys canonical ship flight v3.
 * Production authority for the Good Ship prison approach. The supplied Good
 * Ship sheet is the only gameplay visual source for the ship, asteroid hazards,
 * prison station, dock and flight backdrop. No procedural ship fallback.
 */
(function(root){
  "use strict";
  if(!root||!root.document)return;
  var PRIOR=root.TechOpsGoodBoysShipFlight;if(PRIOR&&Number(PRIOR.VERSION||0)>=3)return;
  try{if(PRIOR&&PRIOR.timer)root.clearInterval(PRIOR.timer);}catch(_){}
  var VERSION=3,DURATION_MS=8200,active=false,installed=false,origAdvance=null,raf=0,keys={},touch={x:0,boost:false},flight=null,atlasImage=null,timer=null;
  var ATLAS={
    src:"assets/good_boys/good_ship_arcade.atlas.png?v=20260902-flight-v3",width:768,height:520,
    frames:{
      space_bg:[0,0,552,60],ship_player:[600,0,76,98],prison_station:[0,80,380,250],prison_dock:[390,80,161,147],
      asteroid_1:[570,110,94,90],asteroid_2:[670,110,62,66],asteroid_3:[570,205,55,48],asteroid_4:[640,205,54,49],asteroid_5:[700,205,55,52],
      lead_1:[0,350,82,38],lead_2:[98,350,77,35],lead_3:[191,350,97,55],lead_4:[304,350,118,77],ship_large:[0,405,292,114]
    },source:"user-provided Good Ship asset sheet"
  };
  root.GOOD_BOYS_SHIP_ARCADE=ATLAS;
  function now(){return root.performance&&root.performance.now?root.performance.now():Date.now();}
  function authority(){return root.TechOpsGoodBoysProgressionAuthority||null;}
  function trace(event,extra){var a=root.__goodBoysShipFlightTrace||(root.__goodBoysShipFlightTrace=[]),o={event:event,at:now(),active:active,version:VERSION};if(extra)Object.assign(o,extra);a.push(o);if(a.length>180)a.splice(0,a.length-180);return o;}
  function state(extra){var s=root.__goodBoysShipFlightState||{};Object.assign(s,{version:VERSION,active:active,at:Date.now(),asset:ATLAS.src},extra||{});root.__goodBoysShipFlightState=s;return s;}
  function fr(name){return ATLAS.frames[name]||null;}
  function loadAtlas(){return new Promise(function(resolve){
    if(atlasImage&&atlasImage.complete&&atlasImage.naturalWidth){resolve(atlasImage);return;}
    var img=new root.Image();atlasImage=img;var settled=false;
    function done(ok){if(settled)return;settled=true;if(ok){trace("asset.ready",{w:img.naturalWidth,h:img.naturalHeight});state({assetReady:true,phase:"ready"});resolve(img);}else{trace("asset.error");state({assetReady:false,phase:"asset-error",error:"Good Ship atlas failed to decode"});resolve(null);}}
    img.onload=function(){done(true);};img.onerror=function(){done(false);};img.src=ATLAS.src;root.setTimeout(function(){done(!!(img.complete&&img.naturalWidth));},3200);
  });}
  function drawFrame(ctx,name,dx,dy,dw,dh,alpha){var r=fr(name);if(!atlasImage||!atlasImage.naturalWidth||!r)return false;if(!dh)dh=dw*(r[3]/r[2]);ctx.save();ctx.imageSmoothingEnabled=false;if(alpha!=null)ctx.globalAlpha=alpha;ctx.drawImage(atlasImage,r[0],r[1],r[2],r[3],dx,dy,dw,dh);ctx.restore();return true;}
  function collide(a,b){return a.x-a.w/2<b.x+b.w/2&&a.x+a.w/2>b.x-b.w/2&&a.y-a.h/2<b.y+b.h/2&&a.y+a.h/2>b.y-b.h/2;}
  function make(){
    var old=root.document.getElementById("good-boys-ship-flight");if(old)old.remove();var portrait=(root.innerHeight||900)>(root.innerWidth||540),W=portrait?540:960,H=portrait?900:540;
    var host=root.document.createElement("div");host.id="good-boys-ship-flight";host.style.cssText="position:fixed;inset:0;z-index:170000;background:#01040a;color:#eaf6ff;font-family:'Press Start 2P',monospace;overflow:hidden;touch-action:none;display:grid;grid-template-rows:auto 1fr auto";
    host.innerHTML='<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;padding:max(14px,env(safe-area-inset-top)) 14px 8px;font-size:9px;letter-spacing:.08em"><b style="color:#8df1ce">GOOD SHIP · PRISON RUN</b><span data-dist style="color:#c5d8e5">6.8 KM</span></div><div data-stage style="position:relative;min-height:0;overflow:hidden"><canvas></canvas><div data-error style="display:none;position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(82%,520px);padding:18px;background:#070b12;border:2px solid #ef4444;color:#ffd8dc;font:10px/1.6 monospace;text-align:center">GOOD SHIP ASSET FAILED TO LOAD<br><span style="color:#9be8cf">Canonical art is required. Reload to retry.</span></div><div style="position:absolute;left:14px;top:12px;font:8px/1.6 monospace;text-shadow:2px 2px #000">AVOID ASTEROIDS · REACH BLACKSITE MERIDIAN<br><span data-hull>HULL ● ● ●</span></div></div><div data-touch style="display:grid;grid-template-columns:70px 1fr 70px;gap:8px;padding:8px 12px max(14px,env(safe-area-inset-bottom));"><button data-dir="-1">◀</button><button data-boost>BOOST</button><button data-dir="1">▶</button></div>';
    var cv=host.querySelector("canvas");cv.width=W;cv.height=H;cv.style.cssText="width:100%;height:100%;display:block;image-rendering:pixelated;background:#01040a";
    Array.prototype.forEach.call(host.querySelectorAll("button"),function(b){b.style.cssText="min-height:52px;border:1px solid #38bdf8;background:#07131f;color:#eef8ff;font:700 11px monospace;touch-action:none;border-radius:5px";});root.document.body.appendChild(host);return {host:host,canvas:cv,W:W,H:H,portrait:portrait};
  }
  function bind(host){function dir(v,e){if(e){e.preventDefault();e.stopPropagation();}touch.x=v;}host.querySelectorAll("[data-dir]").forEach(function(b){var v=Number(b.dataset.dir)||0;b.addEventListener("pointerdown",function(e){dir(v,e);},{passive:false});["pointerup","pointercancel","pointerleave","lostpointercapture"].forEach(function(n){b.addEventListener(n,function(e){if(touch.x===v)dir(0,e);},{passive:false});});});var boost=host.querySelector("[data-boost]");boost.addEventListener("pointerdown",function(e){e.preventDefault();touch.boost=true;},{passive:false});["pointerup","pointercancel","pointerleave","lostpointercapture"].forEach(function(n){boost.addEventListener(n,function(){touch.boost=false;});});}
  function cleanup(host){try{if(raf)root.cancelAnimationFrame(raf);}catch(_){}raf=0;touch.x=0;touch.boost=false;try{if(host&&host.parentNode)host.remove();}catch(_){} }
  function launch(done){
    if(active)return false;active=true;trace("flight.begin");state({phase:"loading",completed:false,assetReady:false,hull:3,hits:0,progress:0,distanceKm:6.8});var ui=make(),host=ui.host,cv=ui.canvas,W=ui.W,H=ui.H,portrait=ui.portrait;bind(host);
    loadAtlas().then(function(img){
      if(!active)return;if(!img){var er=host.querySelector("[data-error]");if(er)er.style.display="block";active=false;state({phase:"asset-error",completed:false,assetReady:false});trace("flight.blocked.asset-error");if(typeof done==="function")done({completed:false,assetError:true});return;}
      var ctx=cv.getContext("2d"),dist=host.querySelector("[data-dist]"),hullText=host.querySelector("[data-hull]"),start=now(),last=start,spawnIndex=0,spawnPlan=[550,1250,1950,2650,3350,4050,4750,5450,6100,6800,7450];
      var ship={x:W*.5,y:H*(portrait?.82:.78),w:portrait?58:54,h:portrait?74:70,hull:3,hits:0,invuln:0},objects=[];
      function spawn(){var idx=(spawnIndex%5)+1,lane=(.12+(((spawnIndex*7)%11)/10)*.76)*W,scale=portrait?1:0.9;objects.push({key:"asteroid_"+idx,x:lane,y:-85,w:(42+idx*6)*scale,h:(40+idx*5)*scale,speed:(145+idx*17)*(portrait?1.15:1),dead:false});spawnIndex++;}
      function hit(o,t){if(o.dead||t<ship.invuln)return;o.dead=true;ship.hits++;ship.hull=Math.max(1,ship.hull-1);ship.invuln=t+700;trace("asteroid.hit",{hits:ship.hits,hull:ship.hull});hullText.textContent="HULL "+[0,1,2].map(function(i){return i<ship.hull?"●":"○";}).join(" ");}
      function background(progress){ctx.fillStyle="#01040a";ctx.fillRect(0,0,W,H);var r=fr("space_bg"),tileW=portrait?W:Math.min(552,W),tileH=portrait?72:60;if(r){for(var y=-tileH+(progress*H*2)%tileH;y<H;y+=tileH)for(var x=0;x<W;x+=tileW)ctx.drawImage(atlasImage,r[0],r[1],r[2],r[3],x,y,tileW,tileH);}ctx.fillStyle="rgba(1,4,10,.24)";ctx.fillRect(0,0,W,H);}
      function finish(){if(!active)return;active=false;cleanup(host);state({phase:"flight-complete",completed:true,assetReady:true,progress:1,distanceKm:0,hull:ship.hull,hits:ship.hits});trace("flight.arrived",{hull:ship.hull,hits:ship.hits});if(typeof done==="function")done({completed:true,hull:ship.hull,hits:ship.hits,asset:ATLAS.src});}
      function loop(t){
        if(!active)return;var dt=Math.min(.05,Math.max(.001,(t-last)/1000));last=t;var elapsed=t-start,progress=Math.min(1,elapsed/DURATION_MS);while(spawnIndex<spawnPlan.length&&elapsed>=spawnPlan[spawnIndex])spawn();
        var input=(keys.ArrowLeft||keys.a?-1:0)+(keys.ArrowRight||keys.d?1:0)+touch.x,boost=!!(keys.Shift||keys[" "]||touch.boost),speed=boost?(portrait?340:390):(portrait?245:280);ship.x=Math.max(ship.w*.7,Math.min(W-ship.w*.7,ship.x+Math.sign(input)*speed*dt));
        objects.forEach(function(o){if(o.dead)return;o.y+=o.speed*dt;if(o.y>H+100)o.dead=true;if(collide(ship,o))hit(o,t);});
        background(progress);
        var ps=(portrait?.26:.22)+(portrait?.52:.48)*progress,pw=(portrait?330:380)*ps,ph=(portrait?218:250)*ps;drawFrame(ctx,"prison_station",W/2-pw/2,portrait?40:18,pw,ph,.42+.58*progress);if(progress>.76){var dockW=(portrait?125:145)*(progress-.76)/.24;drawFrame(ctx,"prison_dock",W*.69,portrait?165:120,dockW,null,Math.min(1,(progress-.76)/.18));}
        objects.forEach(function(o){if(!o.dead)drawFrame(ctx,o.key,o.x-o.w/2,o.y-o.h/2,o.w,o.h,1);});var blink=t<ship.invuln&&Math.floor(t/75)%2===0?.32:1;drawFrame(ctx,"ship_player",ship.x-ship.w/2,ship.y-ship.h/2,ship.w,ship.h,blink);
        var km=6.8*(1-progress);dist.textContent=km.toFixed(1)+" KM";state({phase:"flight",completed:false,assetReady:true,hull:ship.hull,hits:ship.hits,progress:Number(progress.toFixed(3)),distanceKm:Number(km.toFixed(1)),asteroids:objects.filter(function(o){return !o.dead;}).length});if(progress>=1){finish();return;}raf=root.requestAnimationFrame(loop);
      }
      raf=root.requestAnimationFrame(loop);
    });return true;
  }
  function install(){var p=authority();if(installed||!p||typeof p.advance!=="function")return false;origAdvance=p.advance.bind(p);p.advance=function(next,reason){if(Number(next)===3&&/^boarded-secret-ship/.test(String(reason||""))&&!active){trace("boarding.intercept",{reason:reason});launch(function(result){if(result&&result.completed){trace("progression.handoff");origAdvance(3,"ship-flight-arrived-prison");}});return true;}return origAdvance(next,reason);};installed=true;root.__goodBoysShipFlightInstalled=true;trace("installed");return true;}
  root.addEventListener("keydown",function(e){keys[e.key]=true;keys[String(e.key).toLowerCase()]=true;if(active&&["ArrowLeft","ArrowRight"," "].indexOf(e.key)>=0)e.preventDefault();},{passive:false});root.addEventListener("keyup",function(e){keys[e.key]=false;keys[String(e.key).toLowerCase()]=false;});timer=root.setInterval(function(){if(install())root.clearInterval(timer);},80);install();
  root.TechOpsGoodBoysShipFlight={VERSION:VERSION,ATLAS:ATLAS,install:install,launch:launch,active:function(){return active;},telemetry:function(){return root.__goodBoysShipFlightState||null;},timer:timer};
})(typeof globalThis!=="undefined"?globalThis:this);
