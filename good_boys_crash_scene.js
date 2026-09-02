/* TechOps Hero — Good Boys canonical crash-scene authority v2.
 * Canon beat: orbital-prison approach -> shuttle impact -> crash-site wreck.
 * Uses only shipped authored plates plus canonical SHUTTLE frames. No procedural
 * skyline fallback; missing art fails closed so prison gameplay cannot start
 * behind a skipped/missing crash.
 */
(function(root){
  "use strict";
  if(!root||!root.document)return;
  var VERSION=2,APPROACH_BG="assets/v742/cutscenes/orbital_approach.png",CRASH_BG="assets/v742/cutscenes/crash_site.png";
  function remove(id){try{var n=root.document.getElementById(id);if(n)n.remove();}catch(_){}}
  function install(){
    var opening=root.TechOpsGoodBoysOpeningV4;
    if(!opening)return false;
    if(opening.showCrashScene&&opening.showCrashScene.__canonicalCrashArtV2)return true;
    function showCrashScene(){return new Promise(function(resolve,reject){
      remove("good-boys-crash-v4");remove("good-boys-crash-canonical");
      root.__goodBoysOpeningPhase={phase:"crash-scene",owner:"canonical-crash-scene-v2",at:Date.now()};
      var A=root.SHUTTLE||null;
      if(!A||!A.frames||!A.src){reject(new Error("Canonical SHUTTLE atlas unavailable for crash scene"));return;}
      var required=["sh_reentry","sh_crash","sh_wreck"];
      for(var i=0;i<required.length;i++){if(!A.frames[required[i]]){reject(new Error("Missing SHUTTLE crash frame: "+required[i]));return;}}
      var host=root.document.createElement("div");host.id="good-boys-crash-canonical";
      host.style.cssText="position:fixed;inset:0;z-index:150400;background:#02050a;color:#fff;font-family:monospace;display:flex;align-items:center;justify-content:center;padding:max(8px,env(safe-area-inset-top)) 8px max(8px,env(safe-area-inset-bottom));box-sizing:border-box";
      host.innerHTML='<div style="width:min(100%,980px);height:min(100%,760px);display:grid;grid-template-rows:auto 1fr auto;gap:8px;min-height:0"><div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><b style="color:#ffb14a;letter-spacing:.12em">IMPACT VECTOR</b><span style="font-size:10px;color:#c8d8e4">ORBITAL DETENTION PERIMETER</span></div><div data-stage style="position:relative;min-height:0;overflow:hidden;border:1px solid #6c3e2b;background:#02050a;box-shadow:0 16px 50px #000"></div><div style="text-align:center;color:#ffd166;font:700 11px monospace">AUTOMATIC CINEMATIC</div></div>';
      var stage=host.querySelector("[data-stage]");
      var canvas=root.document.createElement("canvas");canvas.width=960;canvas.height=540;canvas.style.cssText="width:100%;height:100%;image-rendering:pixelated";stage.appendChild(canvas);
      var ctx=canvas.getContext("2d"),approach=new root.Image(),crash=new root.Image(),shipImg=new root.Image();
      var readyApproach=false,readyCrash=false,readyShip=false,failed=false,start=0,raf=0;
      function fail(msg){if(failed)return;failed=true;try{root.cancelAnimationFrame(raf);}catch(_){}root.__goodBoysCrashScene={active:false,completed:false,error:msg,approachBackground:APPROACH_BG,crashBackground:CRASH_BG,at:Date.now()};remove("good-boys-crash-canonical");reject(new Error(msg));}
      function cover(img){var iw=img.naturalWidth,ih=img.naturalHeight,ir=iw/ih,rr=960/540,sx=0,sy=0,sw=iw,sh=ih;if(ir>rr){sw=ih*rr;sx=(iw-sw)/2;}else{sh=iw/rr;sy=(ih-sh)/2;}ctx.drawImage(img,sx,sy,sw,sh,0,0,960,540);}
      function drawShip(key,cx,cy,w){var fr=A.frames[key];if(!fr||!readyShip)return false;var h=w*(fr[3]/fr[2]);ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(shipImg,fr[0],fr[1],fr[2],fr[3],cx-w/2,cy-h/2,w,h);ctx.restore();return true;}
      function begin(){if(failed||!readyApproach||!readyCrash||!readyShip||start)return;start=performance.now();raf=root.requestAnimationFrame(loop);}
      function loop(now){if(failed)return;var t=(now-start)/1000;var preImpact=t<2.25;cover(preImpact?approach:crash);ctx.fillStyle="rgba(2,5,10,.12)";ctx.fillRect(0,0,960,540);
        var key,cx,cy,w;
        if(t<1.15){key="sh_reentry";var p=t/1.15;cx=805-p*165;cy=105+p*115;w=190+p*25;ctx.fillStyle="rgba(255,116,35,.22)";ctx.beginPath();ctx.arc(cx,cy,130,0,Math.PI*2);ctx.fill();}
        else if(t<2.25){key="sh_crash";var q=(t-1.15)/1.10;cx=640-q*300;cy=220+q*205;w=215+q*45;ctx.save();ctx.translate(cx,cy);ctx.rotate(-0.18-q*.16);ctx.translate(-cx,-cy);if(!drawShip(key,cx,cy,w)){ctx.restore();fail("Canonical shuttle crash frame failed to render");return;}ctx.restore();key=null;ctx.fillStyle="rgba(255,132,45,"+(0.18+q*.34)+")";ctx.beginPath();ctx.arc(cx,cy,115+q*70,0,Math.PI*2);ctx.fill();}
        else{key="sh_wreck";cx=325;cy=410;w=275;}
        if(key&&!drawShip(key,cx,cy,w)){fail("Canonical shuttle frame failed to render: "+key);return;}
        if(t>=2.05&&t<2.55){var flash=1-Math.abs(2.30-t)/.25;flash=Math.max(0,Math.min(1,flash));ctx.fillStyle="rgba(255,244,220,"+(flash*.88)+")";ctx.fillRect(0,0,960,540);}
        if(t>=2.25&&t<3.15){var fade=Math.min(1,(t-2.25)/.55);ctx.fillStyle="rgba(0,0,0,"+(0.42*(1-fade))+")";ctx.fillRect(0,0,960,540);}
        ctx.fillStyle="rgba(1,5,9,.74)";ctx.fillRect(22,22,390,42);ctx.fillStyle="#fff";ctx.font="700 14px monospace";ctx.textAlign="left";ctx.fillText(t<2.25?"COLLISION COURSE · BRACE":"HULL BREACH · ENTRY POINT OPEN",38,48);
        root.__goodBoysCrashScene={active:t<4.2,completed:false,frame:t<1.15?"sh_reentry":t<2.25?"sh_crash":"sh_wreck",background:preImpact?APPROACH_BG:CRASH_BG,canonical:true,impactIntoPrison:true,at:Date.now()};
        if(t>=4.2){root.__goodBoysCrashScene={active:false,completed:true,frame:"sh_wreck",background:CRASH_BG,canonical:true,impactIntoPrison:true,at:Date.now()};root.__goodBoysOpeningPhase={phase:"crash-complete",owner:"canonical-crash-scene-v2",at:Date.now()};remove("good-boys-crash-canonical");resolve({completed:true,frame:"sh_wreck",background:CRASH_BG,impactIntoPrison:true,canonical:true});return;}
        raf=root.requestAnimationFrame(loop);
      }
      approach.onload=function(){readyApproach=true;begin();};approach.onerror=function(){fail("Orbital approach art failed to load: "+APPROACH_BG);};
      crash.onload=function(){readyCrash=true;begin();};crash.onerror=function(){fail("Crash-site art failed to load: "+CRASH_BG);};
      shipImg.onload=function(){readyShip=true;begin();};shipImg.onerror=function(){fail("Canonical SHUTTLE atlas image failed to load");};
      approach.src=APPROACH_BG;crash.src=CRASH_BG;shipImg.src=A.src;root.document.body.appendChild(host);root.__goodBoysCrashScene={active:true,completed:false,loading:true,approachBackground:APPROACH_BG,crashBackground:CRASH_BG,canonical:true,impactIntoPrison:true,at:Date.now()};
    });}
    showCrashScene.__canonicalCrashArt=true;showCrashScene.__canonicalCrashArtV2=true;opening.showCrashScene=showCrashScene;
    root.__goodBoysCrashSceneAuthority={version:VERSION,approachBackground:APPROACH_BG,crashBackground:CRASH_BG,frames:["sh_reentry","sh_crash","sh_wreck"],impactIntoPrison:true,owner:"canonical-crash-scene-v2",at:Date.now()};
    return true;
  }
  var timer=root.setInterval(function(){if(install())root.clearInterval(timer);},50);install();
  root.TechOpsGoodBoysCrashScene={VERSION:VERSION,install:install,approachBackground:APPROACH_BG,crashBackground:CRASH_BG};
})(typeof globalThis!=="undefined"?globalThis:this);
