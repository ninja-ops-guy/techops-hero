/* TechOps Hero — Good Boys ship flight v1.
 * Inserts a playable prison-approach flight between M2 BOARD THE SHIP and the
 * authored M3 IMPACT VECTOR crash cinematic. No asteroids: navigation is built
 * around defense lanes, scan gates and prison approach alignment.
 */
(function(root){
  "use strict";
  if(!root||!root.document||root.TechOpsGoodBoysShipFlight)return;
  var active=false,installed=false,origAdvance=null,raf=0,keys={},touch={x:0,y:0,boost:false},flight=null;
  var prison=new Image(),shipRef=new Image();
  prison.src="assets/v742/cutscenes/orbital_approach.png";
  shipRef.src="assets/v742/cutscenes/secret_ship_interior.png";
  function now(){return root.performance&&performance.now?performance.now():Date.now();}
  function authority(){return root.TechOpsGoodBoysProgressionAuthority||null;}
  function trace(event,extra){var a=root.__goodBoysShipFlightTrace||(root.__goodBoysShipFlightTrace=[]),o={event:event,at:now(),active:active};if(extra)Object.assign(o,extra);a.push(o);if(a.length>120)a.splice(0,a.length-120);return o;}
  function pixelShip(ctx,x,y,s){
    ctx.save();ctx.translate(x,y);ctx.imageSmoothingEnabled=false;
    ctx.fillStyle="#111827";ctx.fillRect(-20*s,-8*s,40*s,16*s);ctx.fillStyle="#64748b";ctx.fillRect(-13*s,-12*s,24*s,24*s);
    ctx.fillStyle="#cbd5e1";ctx.fillRect(-8*s,-8*s,17*s,16*s);ctx.fillStyle="#f59e0b";ctx.fillRect(-4*s,-5*s,8*s,10*s);
    ctx.fillStyle="#38bdf8";ctx.fillRect(-25*s,-5*s,8*s,4*s);ctx.fillRect(-25*s,2*s,8*s,4*s);
    ctx.fillStyle="#0ea5e9";ctx.fillRect(-31*s,-4*s,7*s,2*s);ctx.fillRect(-31*s,3*s,7*s,2*s);ctx.restore();
  }
  function make(){
    var host=document.createElement("div");host.id="good-boys-ship-flight";host.style.cssText="position:fixed;inset:0;z-index:17000;background:#02050a;color:#eaf6ff;font-family:'Press Start 2P',monospace;overflow:hidden;touch-action:none";
    host.innerHTML='<canvas width="960" height="540" style="width:100%;height:100%;display:block;image-rendering:pixelated"></canvas><div data-hud style="position:absolute;inset:0;pointer-events:none;padding:max(14px,env(safe-area-inset-top)) 16px 16px"><div style="display:flex;justify-content:space-between;gap:12px;font-size:10px;text-shadow:2px 2px #000"><span>GOOD SHIP // PRISON APPROACH</span><span data-dist>8.0 KM</span></div><div style="position:absolute;left:16px;bottom:max(18px,env(safe-area-inset-bottom));font-size:9px;line-height:1.7">AVOID DEFENSE FIRE · CROSS SCAN GATES<br><span data-gates>GATES 0 / 3</span></div></div><div data-touch style="position:absolute;inset:auto 0 max(12px,env(safe-area-inset-bottom)) 0;display:flex;justify-content:space-between;align-items:end;padding:12px;pointer-events:none"><div style="display:grid;grid-template-columns:54px 54px 54px;grid-template-rows:48px 48px;gap:5px;pointer-events:auto"><button data-move="up" style="grid-column:2">▲</button><button data-move="left">◀</button><button data-move="down">▼</button><button data-move="right">▶</button></div><button data-boost style="pointer-events:auto;width:92px;height:58px">BOOST</button></div>';
    document.body.appendChild(host);return host;
  }
  function bind(host){
    function setMove(k,v){if(k==="left")touch.x=v?-1:(touch.x<0?0:touch.x);if(k==="right")touch.x=v?1:(touch.x>0?0:touch.x);if(k==="up")touch.y=v?-1:(touch.y<0?0:touch.y);if(k==="down")touch.y=v?1:(touch.y>0?0:touch.y);}
    host.querySelectorAll('[data-move]').forEach(function(b){var k=b.dataset.move;b.addEventListener('pointerdown',function(e){e.preventDefault();setMove(k,true);});['pointerup','pointercancel','pointerleave'].forEach(function(n){b.addEventListener(n,function(){setMove(k,false);});});});
    var boost=host.querySelector('[data-boost]');boost.addEventListener('pointerdown',function(e){e.preventDefault();touch.boost=true;});['pointerup','pointercancel','pointerleave'].forEach(function(n){boost.addEventListener(n,function(){touch.boost=false;});});
  }
  function launch(done){
    if(active)return true;active=true;trace("flight.begin");
    var host=make(),cv=host.querySelector('canvas'),ctx=cv.getContext('2d'),dist=host.querySelector('[data-dist]'),gateText=host.querySelector('[data-gates]');bind(host);
    flight={x:190,y:270,hp:100,progress:0,gates:0,nextGate:650,shots:[],flash:0,done:done,last:now(),host:host};
    function finish(){if(!active)return;active=false;cancelAnimationFrame(raf);host.remove();flight=null;trace("flight.arrived",{gates:3});if(typeof done==="function")done();}
    function frame(t){
      if(!active||!flight)return;var dt=Math.min(.034,Math.max(.001,(t-flight.last)/1000));flight.last=t;
      var dx=(keys.ArrowLeft||keys.a?-1:0)+(keys.ArrowRight||keys.d?1:0)+touch.x,dy=(keys.ArrowUp||keys.w?-1:0)+(keys.ArrowDown||keys.s?1:0)+touch.y,boost=!!(keys.Shift||touch.boost),spd=boost?285:190;
      flight.x=Math.max(70,Math.min(720,flight.x+Math.sign(dx)*spd*dt));flight.y=Math.max(80,Math.min(460,flight.y+Math.sign(dy)*spd*dt));flight.progress+=dt*(boost?115:78);
      if(flight.progress>=flight.nextGate&&flight.gates<3){flight.gates++;flight.nextGate+=620;trace("scan-gate",{gate:flight.gates});}
      if(flight.progress>1950&&flight.gates>=3){finish();return;}
      ctx.imageSmoothingEnabled=false;ctx.fillStyle="#02050a";ctx.fillRect(0,0,960,540);
      for(var i=0;i<70;i++){var sx=(i*137-flight.progress*(.25+(i%4)*.08))%1000;if(sx<0)sx+=1000;var sy=(i*83)%520;ctx.fillStyle=i%7===0?"#38bdf8":"#64748b";ctx.fillRect(sx,sy,i%5===0?3:1,1);}
      var approach=Math.max(0,(flight.progress-900)/1050),pw=170+approach*430,ph=110+approach*280,px=960-pw*.82,py=270-ph/2;
      if(prison.complete&&prison.naturalWidth){ctx.globalAlpha=.35+.55*approach;ctx.drawImage(prison,px,py,pw,ph);ctx.globalAlpha=1;}else{ctx.fillStyle="#111827";ctx.fillRect(px,py,pw,ph);ctx.strokeStyle="#ef4444";ctx.strokeRect(px,py,pw,ph);}
      for(var g=flight.gates;g<3;g++){var gx=820-((flight.nextGate+(g-flight.gates)*620-flight.progress)/620)*700;if(gx>40&&gx<920){ctx.strokeStyle=g===flight.gates?"#22d3ee":"#7c3aed";ctx.lineWidth=4;ctx.strokeRect(gx,85,22,370);ctx.fillStyle="#0f172a";ctx.fillRect(gx-42,58,106,20);ctx.fillStyle="#e2e8f0";ctx.font="10px monospace";ctx.fillText("SCAN "+(g+1),gx-34,72);}}
      var pulse=(Math.sin(t/220)+1)/2;ctx.strokeStyle="rgba(239,68,68,"+(.2+.35*pulse)+")";ctx.lineWidth=2;for(var l=0;l<3;l++){var ly=125+l*135;ctx.beginPath();ctx.moveTo(960,ly);ctx.lineTo(780,ly+Math.sin(t/300+l)*65);ctx.stroke();}
      pixelShip(ctx,flight.x,flight.y,boost?1.7:1.5);
      ctx.fillStyle="#22d3ee";ctx.fillRect(28,42,Math.min(360,flight.progress/1950*360),6);ctx.strokeStyle="#334155";ctx.strokeRect(28,42,360,6);
      dist.textContent=Math.max(0,(8-flight.progress/244)).toFixed(1)+" KM";gateText.textContent="GATES "+flight.gates+" / 3";
      raf=requestAnimationFrame(frame);
    }
    raf=requestAnimationFrame(frame);return true;
  }
  function install(){
    var p=authority();if(installed||!p||typeof p.advance!=="function")return false;origAdvance=p.advance.bind(p);
    p.advance=function(next,reason){
      if(Number(next)===3&&/^boarded-secret-ship/.test(String(reason||""))&&!active){
        trace("boarding.intercept",{next:next,reason:reason});
        launch(function(){trace("crash-cinematic.handoff");origAdvance(3,"ship-flight-arrived-prison");});
        return true;
      }
      return origAdvance(next,reason);
    };
    installed=true;root.__goodBoysShipFlightInstalled=true;trace("installed");return true;
  }
  root.addEventListener('keydown',function(e){keys[e.key]=true;keys[String(e.key).toLowerCase()]=true;if(active&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].indexOf(e.key)>=0)e.preventDefault();},{passive:false});
  root.addEventListener('keyup',function(e){keys[e.key]=false;keys[String(e.key).toLowerCase()]=false;});
  var timer=setInterval(function(){if(install())clearInterval(timer);},80);install();
  root.TechOpsGoodBoysShipFlight={VERSION:1,install:install,launch:launch,active:function(){return active;}};
})(typeof globalThis!=="undefined"?globalThis:this);
