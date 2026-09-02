/* TechOps Hero — Good Boys canonical crash-scene authority v1.
 * Replaces the procedural skyline fallback with the shipped crash-site plate
 * plus canonical SHUTTLE reentry/crash/wreck frames. Fails closed if required
 * art cannot decode so prison gameplay cannot begin behind a missing crash.
 */
(function(root){
  "use strict";
  if(!root||!root.document||root.TechOpsGoodBoysCrashScene)return;
  var VERSION=1,CRASH_BG="assets/v742/cutscenes/crash_site.png";
  function remove(id){try{var n=root.document.getElementById(id);if(n)n.remove();}catch(_){}}
  function install(){
    var opening=root.TechOpsGoodBoysOpeningV4;
    if(!opening)return false;
    if(opening.showCrashScene&&opening.showCrashScene.__canonicalCrashArt)return true;
    function showCrashScene(){return new Promise(function(resolve,reject){
      remove("good-boys-crash-v4");remove("good-boys-crash-canonical");
      root.__goodBoysOpeningPhase={phase:"crash-scene",owner:"canonical-crash-scene-v1",at:Date.now()};
      var A=root.SHUTTLE||null;
      if(!A||!A.frames||!A.src){reject(new Error("Canonical SHUTTLE atlas unavailable for crash scene"));return;}
      ["sh_reentry","sh_crash","sh_wreck"].forEach(function(k){if(!A.frames[k])throw new Error("Missing SHUTTLE crash frame: "+k);});
      var host=root.document.createElement("div");host.id="good-boys-crash-canonical";
      host.style.cssText="position:fixed;inset:0;z-index:150400;background:#02050a;color:#fff;font-family:monospace;display:flex;align-items:center;justify-content:center;padding:max(8px,env(safe-area-inset-top)) 8px max(8px,env(safe-area-inset-bottom));box-sizing:border-box";
      host.innerHTML='<div style="width:min(100%,980px);height:min(100%,760px);display:grid;grid-template-rows:auto 1fr auto;gap:8px;min-height:0"><div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><b style="color:#ffb14a;letter-spacing:.12em">IMPACT VECTOR</b><span style="font-size:10px;color:#c8d8e4">ORBITAL DETENTION PERIMETER</span></div><div data-stage style="position:relative;min-height:0;overflow:hidden;border:1px solid #6c3e2b;background:#02050a;box-shadow:0 16px 50px #000"></div><div style="text-align:center;color:#ffd166;font:700 11px monospace">AUTOMATIC CINEMATIC</div></div>';
      var stage=host.querySelector("[data-stage]");
      var canvas=root.document.createElement("canvas");canvas.width=960;canvas.height=540;canvas.style.cssText="width:100%;height:100%;image-rendering:pixelated";stage.appendChild(canvas);
      var ctx=canvas.getContext("2d"),bg=new root.Image(),shipImg=new root.Image(),readyBg=false,readyShip=false,failed=false,start=0,raf=0;
      function fail(msg){if(failed)return;failed=true;try{root.cancelAnimationFrame(raf);}catch(_){}root.__goodBoysCrashScene={active:false,completed:false,error:msg,background:CRASH_BG,at:Date.now()};remove("good-boys-crash-canonical");reject(new Error(msg));}
      function cover(img){var iw=img.naturalWidth,ih=img.naturalHeight,ir=iw/ih,rr=960/540,sx=0,sy=0,sw=iw,sh=ih;if(ir>rr){sw=ih*rr;sx=(iw-sw)/2;}else{sh=iw/rr;sy=(ih-sh)/2;}ctx.drawImage(img,sx,sy,sw,sh,0,0,960,540);}
      function drawShip(key,cx,cy,w){var fr=A.frames[key];if(!fr||!readyShip)return false;var h=w*(fr[3]/fr[2]);ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(shipImg,fr[0],fr[1],fr[2],fr[3],cx-w/2,cy-h/2,w,h);ctx.restore();return true;}
      function begin(){if(failed||!readyBg||!readyShip||start)return;start=performance.now();raf=root.requestAnimationFrame(loop);}
      function loop(now){if(failed)return;var t=(now-start)/1000;cover(bg);ctx.fillStyle="rgba(2,5,10,.18)";ctx.fillRect(0,0,960,540);
        var key,cx,cy,w;
        if(t<1.15){key="sh_reentry";cx=770-t*170;cy=115+t*90;w=205;ctx.fillStyle="rgba(255,116,35,.22)";ctx.beginPath();ctx.arc(cx,cy,135,0,Math.PI*2);ctx.fill();}
        else if(t<2.25){key="sh_crash";var q=(t-1.15)/1.10;cx=575-q*245;cy=220+q*190;w=230;ctx.fillStyle="rgba(255,130,40,"+(0.16+q*.28)+")";ctx.beginPath();ctx.arc(cx,cy,120+q*55,0,Math.PI*2);ctx.fill();}
        else{key="sh_wreck";cx=320;cy=418;w=270;}
        if(!drawShip(key,cx,cy,w)){fail("Canonical shuttle frame failed to render: "+key);return;}
        if(t>1.9&&t<2.6){ctx.fillStyle="rgba(255,244,220,"+(0.55-(t-1.9)*.65)+")";ctx.fillRect(0,0,960,540);}
        ctx.fillStyle="rgba(1,5,9,.74)";ctx.fillRect(22,22,360,42);ctx.fillStyle="#fff";ctx.font="700 14px monospace";ctx.textAlign="left";ctx.fillText(t<2.25?"GUIDANCE LOST · BRACE":"IMPACT CONFIRMED",38,48);
        root.__goodBoysCrashScene={active:t<3.7,completed:false,frame:key,background:CRASH_BG,canonical:true,at:Date.now()};
        if(t>=3.7){root.__goodBoysCrashScene={active:false,completed:true,frame:"sh_wreck",background:CRASH_BG,canonical:true,at:Date.now()};root.__goodBoysOpeningPhase={phase:"crash-complete",owner:"canonical-crash-scene-v1",at:Date.now()};remove("good-boys-crash-canonical");resolve({completed:true,frame:"sh_wreck",background:CRASH_BG,canonical:true});return;}
        raf=root.requestAnimationFrame(loop);
      }
      bg.onload=function(){readyBg=true;begin();};bg.onerror=function(){fail("Canonical crash-site art failed to load: "+CRASH_BG);};
      shipImg.onload=function(){readyShip=true;begin();};shipImg.onerror=function(){fail("Canonical SHUTTLE atlas image failed to load");};
      bg.src=CRASH_BG;shipImg.src=A.src;root.document.body.appendChild(host);root.__goodBoysCrashScene={active:true,completed:false,loading:true,background:CRASH_BG,canonical:true,at:Date.now()};
    });}
    showCrashScene.__canonicalCrashArt=true;
    opening.showCrashScene=showCrashScene;
    root.__goodBoysCrashSceneAuthority={version:VERSION,background:CRASH_BG,frames:["sh_reentry","sh_crash","sh_wreck"],owner:"canonical-crash-scene-v1",at:Date.now()};
    return true;
  }
  var timer=root.setInterval(function(){if(install())root.clearInterval(timer);},50);install();
  root.TechOpsGoodBoysCrashScene={VERSION:VERSION,install:install,background:CRASH_BG};
})(typeof globalThis!=="undefined"?globalThis:this);
