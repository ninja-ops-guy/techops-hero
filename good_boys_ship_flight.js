/* TechOps Hero — Good Boys canonical ship flight v2.
 * Production authority for the M2 -> M3 prison approach. The supplied Good Ship
 * atlas is the only visual source for the playable ship, hazards and approach
 * beat. Missing canonical art is surfaced in diagnostics and recovered without
 * soft-locking; it is never silently replaced with procedural final art.
 */
(function(root){
  "use strict";
  if(!root||!root.document||root.TechOpsGoodBoysShipFlight)return;

  var VERSION=2,DURATION_MS=6200,CINE_MS=2200;
  var active=false,installed=false,origAdvance=null,raf=0,keys={},touch={x:0,y:0,boost:false},flight=null,atlasImage=null;
  var ATLAS={
    VERSION:2,
    src:"assets/good_boys/good_ship_arcade.atlas.png?v=20260902-canonical-flight-r2",
    width:768,height:520,
    frames:{
      space_bg:[0,0,552,60],ship_player:[600,0,76,98],prison_station:[0,80,380,250],prison_dock:[390,80,161,147],
      asteroid_1:[570,110,94,90],asteroid_2:[670,110,62,66],asteroid_3:[570,205,55,48],asteroid_4:[640,205,54,49],asteroid_5:[700,205,55,52],
      lead_1:[0,350,82,38],lead_2:[98,350,77,35],lead_3:[191,350,97,55],lead_4:[304,350,118,77],ship_large:[0,405,292,114]
    },
    source:"user-provided Good Ship asset sheet"
  };
  root.GOOD_BOYS_SHIP_ARCADE=ATLAS;

  function now(){return root.performance&&performance.now?performance.now():Date.now();}
  function authority(){return root.TechOpsGoodBoysProgressionAuthority||null;}
  function trace(event,extra){var a=root.__goodBoysShipFlightTrace||(root.__goodBoysShipFlightTrace=[]),o={event:event,at:now(),active:active};if(extra)Object.assign(o,extra);a.push(o);if(a.length>160)a.splice(0,a.length-160);return o;}
  function state(extra){var s=root.__goodBoysShipFlightState||{};Object.assign(s,{version:VERSION,active:active,at:Date.now()},extra||{});root.__goodBoysShipFlightState=s;return s;}
  function frame(name){return ATLAS.frames[name]||null;}
  function loadAtlas(){
    return new Promise(function(resolve){
      if(atlasImage&&atlasImage.complete&&atlasImage.naturalWidth){resolve(atlasImage);return;}
      var img=new root.Image();atlasImage=img;var settled=false;
      function done(ok){if(settled)return;settled=true;if(!ok){root.__goodBoysShipFlightAssetError="canonical Good Ship atlas failed to decode";trace("asset.error",{src:ATLAS.src});state({phase:"asset-error",assetReady:false,asset:ATLAS.src});}else{trace("asset.ready",{src:ATLAS.src,w:img.naturalWidth,h:img.naturalHeight});state({assetReady:true,asset:ATLAS.src});}resolve(ok?img:null);}
      img.onload=function(){done(true);};img.onerror=function(){done(false);};img.src=ATLAS.src;
      root.setTimeout(function(){done(!!(img.complete&&img.naturalWidth));},2500);
    });
  }
  function drawFrame(ctx,name,dx,dy,dw,dh,alpha){var fr=frame(name);if(!atlasImage||!fr||!atlasImage.naturalWidth)return false;var sw=fr[2],sh=fr[3];if(!dh)dh=dw*(sh/sw);ctx.save();ctx.imageSmoothingEnabled=false;if(alpha!==undefined)ctx.globalAlpha=alpha;ctx.drawImage(atlasImage,fr[0],fr[1],sw,sh,dx,dy,dw,dh);ctx.restore();return true;}
  function collide(a,b){return a.x-a.w/2<b.x+b.w/2&&a.x+a.w/2>b.x-b.w/2&&a.y-a.h/2<b.y+b.h/2&&a.y+a.h/2>b.y-b.h/2;}

  function make(){
    var old=document.getElementById("good-boys-ship-flight");if(old)old.remove();
    var host=document.createElement("div");host.id="good-boys-ship-flight";host.style.cssText="position:fixed;inset:0;z-index:170000;background:#02050a;color:#eaf6ff;font-family:'Press Start 2P',monospace;overflow:hidden;touch-action:none";
    host.innerHTML='<canvas width="960" height="540" style="width:100%;height:100%;display:block;image-rendering:pixelated"></canvas><div data-hud style="position:absolute;inset:0;pointer-events:none;padding:max(14px,env(safe-area-inset-top)) 16px 16px"><div style="display:flex;justify-content:space-between;gap:12px;font-size:10px;text-shadow:2px 2px #000"><span>GOOD SHIP // PRISON VECTOR</span><span data-dist>6.8 KM</span></div><div style="position:absolute;left:16px;bottom:max(18px,env(safe-area-inset-bottom));font-size:9px;line-height:1.7;text-shadow:2px 2px #000">AVOID ASTEROIDS · REACH BLACKSITE MERIDIAN<br><span data-hull>HULL ● ● ●</span></div></div><div data-touch style="position:absolute;inset:auto 0 max(12px,env(safe-area-inset-bottom)) 0;display:flex;justify-content:space-between;align-items:end;padding:12px;pointer-events:none"><div style="display:grid;grid-template-columns:54px 54px 54px;grid-template-rows:48px 48px;gap:5px;pointer-events:auto"><button data-move="up" style="grid-column:2;min-width:44px;min-height:44px">▲</button><button data-move="left" style="min-width:44px;min-height:44px">◀</button><button data-move="down" style="min-width:44px;min-height:44px">▼</button><button data-move="right" style="min-width:44px;min-height:44px">▶</button></div><button data-boost style="pointer-events:auto;width:92px;height:58px;min-width:44px;min-height:44px">BOOST</button></div><div data-error style="display:none;position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);max-width:80vw;padding:16px;background:#070b12;border:2px solid #ef4444;font:10px/1.6 monospace;text-align:center">CANONICAL SHIP ART FAILED TO LOAD<br>RECOVERING ROUTE…</div>';
    document.body.appendChild(host);return host;
  }
  function bind(host){
    function setMove(k,v){if(k==="left")touch.x=v?-1:(touch.x<0?0:touch.x);if(k==="right")touch.x=v?1:(touch.x>0?0:touch.x);if(k==="up")touch.y=v?-1:(touch.y<0?0:touch.y);if(k==="down")touch.y=v?1:(touch.y>0?0:touch.y);}
    host.querySelectorAll('[data-move]').forEach(function(b){var k=b.dataset.move;b.addEventListener('pointerdown',function(e){e.preventDefault();try{b.setPointerCapture(e.pointerId);}catch(_){}setMove(k,true);});['pointerup','pointercancel','pointerleave','lostpointercapture'].forEach(function(n){b.addEventListener(n,function(){setMove(k,false);});});});
    var boost=host.querySelector('[data-boost]');boost.addEventListener('pointerdown',function(e){e.preventDefault();touch.boost=true;});['pointerup','pointercancel','pointerleave','lostpointercapture'].forEach(function(n){boost.addEventListener(n,function(){touch.boost=false;});});
  }
  function cleanup(host){try{if(raf)root.cancelAnimationFrame(raf);}catch(_){}raf=0;touch.x=touch.y=0;touch.boost=false;try{if(host&&host.parentNode)host.parentNode.removeChild(host);}catch(_){} }

  function runApproachCutscene(done){
    if(!atlasImage||!atlasImage.naturalWidth){if(typeof done==="function")done();return;}
    var el=document.createElement("div");el.id="good-boys-prison-approach-cine";el.style.cssText="position:fixed;inset:0;z-index:170010;background:#01040a;display:flex;align-items:center;justify-content:center;pointer-events:none";
    var c=document.createElement("canvas");c.width=960;c.height=540;c.style.cssText="width:100%;height:100%;object-fit:contain;image-rendering:pixelated";el.appendChild(c);document.body.appendChild(el);var ctx=c.getContext("2d"),start=now();
    trace("approach-cine.begin");state({phase:"approach-cinematic"});
    function tick(ts){
      var t=Math.min(1,(ts-start)/CINE_MS);ctx.clearRect(0,0,960,540);
      var bg=frame("space_bg");if(bg)for(var y=0;y<540;y+=60)for(var x=0;x<960;x+=552)ctx.drawImage(atlasImage,bg[0],bg[1],bg[2],bg[3],x,y,552,60);
      ctx.fillStyle="rgba(0,0,0,.18)";ctx.fillRect(0,0,960,540);
      var ps=.38+.62*t,pw=380*ps,ph=250*ps;drawFrame(ctx,"prison_station",480-pw/2,28+(1-t)*55,pw,ph,1);
      var lead="lead_"+(1+Math.min(3,Math.floor(t*4)));drawFrame(ctx,lead,80+455*t,406-90*t,120+150*t,null,1);
      if(t>.72)drawFrame(ctx,"prison_dock",690,235,150,null,Math.min(1,(t-.72)/.18));
      ctx.fillStyle="#9be8cf";ctx.font="700 16px monospace";ctx.fillText("BLACKSITE MERIDIAN // APPROACH",24,34);ctx.fillStyle="#ffd166";ctx.font="700 12px monospace";ctx.fillText(t<.7?"PRISON VECTOR LOCKED":"DOCK WINDOW ACQUIRED",24,55);
      if(t<1){raf=root.requestAnimationFrame(tick);return;}
      trace("approach-cine.complete");state({phase:"handoff",approachComplete:true});root.setTimeout(function(){try{el.remove();}catch(_){}if(typeof done==="function")done();},150);
    }
    raf=root.requestAnimationFrame(tick);
  }

  function launch(done){
    if(active)return true;active=true;trace("flight.begin");state({phase:"loading",completed:false,hull:3,hits:0,progress:0,distanceKm:6.8,assetReady:false});
    var host=make();bind(host);
    loadAtlas().then(function(img){
      if(!active)return;
      if(!img){
        var err=host.querySelector('[data-error]');if(err)err.style.display="block";
        root.setTimeout(function(){if(!active)return;active=false;cleanup(host);state({phase:"recovered-asset-error",completed:false,softlockPrevented:true});trace("flight.asset-recovery");if(typeof done==="function")done();},900);return;
      }
      var cv=host.querySelector('canvas'),ctx=cv.getContext('2d'),dist=host.querySelector('[data-dist]'),hullEl=host.querySelector('[data-hull]');
      flight={x:480,y:420,w:58,h:74,hull:3,hits:0,objects:[],spawnAt:0,invulnUntil:0,start:now(),last:now(),done:done,host:host};
      var spawnPlan=[550,1250,1950,2650,3350,4050,4750,5350];
      function spawn(){var idx=(flight.spawnAt%5)+1,lanes=[145,280,420,560,705,830],lane=lanes[(flight.spawnAt*2+1)%lanes.length];flight.objects.push({key:"asteroid_"+idx,x:lane,y:-90,w:48+idx*5,h:46+idx*4,speed:160+idx*18,dead:false});flight.spawnAt++;}
      function hit(o,t){if(o.dead||t<flight.invulnUntil)return;o.dead=true;flight.hits++;flight.hull=Math.max(0,flight.hull-1);flight.invulnUntil=t+650;trace("asteroid.hit",{hits:flight.hits,hull:flight.hull});if(flight.hull<=0){flight.hull=1;trace("hull.recovered",{reason:"recoverable-failure-philosophy"});}hullEl.textContent="HULL "+[0,1,2].map(function(i){return i<flight.hull?"●":"○";}).join(" ");}
      function finish(){if(!active)return;active=false;cleanup(host);flight=null;trace("flight.arrived");state({phase:"flight-complete",completed:true,progress:1,distanceKm:0});runApproachCutscene(function(){if(typeof done==="function")done();});}
      function drawBg(dt,progress){var offset=(progress*980)%60,fr=frame("space_bg");if(fr)for(var y=-60+offset;y<540;y+=60)for(var x=0;x<960;x+=552)ctx.drawImage(atlasImage,fr[0],fr[1],fr[2],fr[3],x,y,552,60);ctx.fillStyle="rgba(1,4,10,.24)";ctx.fillRect(0,0,960,540);}
      function loop(t){
        if(!active||!flight)return;var dt=Math.min(.05,Math.max(.001,(t-flight.last)/1000));flight.last=t;var elapsed=t-flight.start,progress=Math.min(1,elapsed/DURATION_MS);
        while(flight.spawnAt<spawnPlan.length&&elapsed>=spawnPlan[flight.spawnAt])spawn();
        var dx=(keys.ArrowLeft||keys.a?-1:0)+(keys.ArrowRight||keys.d?1:0)+touch.x,dy=(keys.ArrowUp||keys.w?-1:0)+(keys.ArrowDown||keys.s?1:0)+touch.y,boost=!!(keys.Shift||keys[" "]||touch.boost),spd=boost?330:235;
        flight.x=Math.max(70,Math.min(890,flight.x+Math.sign(dx)*spd*dt));flight.y=Math.max(110,Math.min(470,flight.y+Math.sign(dy)*spd*dt));
        for(var i=0;i<flight.objects.length;i++){var o=flight.objects[i];if(o.dead)continue;o.y+=o.speed*dt;if(o.y>620)o.dead=true;if(collide(flight,o))hit(o,t);}
        ctx.clearRect(0,0,960,540);drawBg(dt,progress);
        var pScale=.18+.62*progress,pW=380*pScale,pH=250*pScale;drawFrame(ctx,"prison_station",480-pW/2,12,pW,pH,.35+.62*progress);
        for(var j=0;j<flight.objects.length;j++){var a=flight.objects[j];if(!a.dead)drawFrame(ctx,a.key,a.x-a.w/2,a.y-a.h/2,a.w,a.h,1);}
        var blink=t<flight.invulnUntil&&Math.floor(t/80)%2===0?.35:1;drawFrame(ctx,"ship_player",flight.x-flight.w/2,flight.y-flight.h/2,flight.w,flight.h,blink);
        ctx.fillStyle="#22d3ee";ctx.fillRect(28,42,360*progress,6);ctx.strokeStyle="#334155";ctx.strokeRect(28,42,360,6);
        var km=6.8*(1-progress);dist.textContent=km.toFixed(1)+" KM";state({phase:"flight",assetReady:true,hull:flight.hull,hits:flight.hits,progress:Number(progress.toFixed(3)),distanceKm:Number(km.toFixed(1)),asteroids:flight.objects.filter(function(o){return !o.dead;}).length});
        if(progress>=1){finish();return;}raf=root.requestAnimationFrame(loop);
      }
      state({phase:"flight",assetReady:true});raf=root.requestAnimationFrame(loop);
    });
    return true;
  }

  function install(){
    var p=authority();if(installed||!p||typeof p.advance!=="function")return false;origAdvance=p.advance.bind(p);
    p.advance=function(next,reason){
      if(Number(next)===3&&/^boarded-secret-ship/.test(String(reason||""))&&!active){trace("boarding.intercept",{next:next,reason:reason});launch(function(){trace("crash-cinematic.handoff");origAdvance(3,"ship-flight-arrived-prison");});return true;}
      return origAdvance(next,reason);
    };
    installed=true;root.__goodBoysShipFlightInstalled=true;trace("installed");return true;
  }

  root.addEventListener('keydown',function(e){keys[e.key]=true;keys[String(e.key).toLowerCase()]=true;if(active&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].indexOf(e.key)>=0)e.preventDefault();},{passive:false});
  root.addEventListener('keyup',function(e){keys[e.key]=false;keys[String(e.key).toLowerCase()]=false;});
  var timer=setInterval(function(){if(install())clearInterval(timer);},80);install();
  root.TechOpsGoodBoysShipFlight={VERSION:VERSION,ATLAS:ATLAS,DURATION_MS:DURATION_MS,install:install,launch:launch,active:function(){return active;},state:function(){return root.__goodBoysShipFlightState||null;}};
})(typeof globalThis!=="undefined"?globalThis:this);
