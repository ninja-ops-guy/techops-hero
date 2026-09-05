/* TechOps Hero - Good Boys authored crash-scene authority v5.
 * Uses the picked crash media when present and an authored crash plate fallback.
 * The old in-engine shuttle animation is intentionally removed from the opening.
 * v5 guarantees a bounded handoff when mobile video playback stalls without
 * emitting ended/error.
 */
(function(root){
  "use strict";
  if(!root||!root.document)return;
  var VERSION=5,CRASH_VIDEO="assets/cutscenes/good_dogs/09_prison_crash_selected_pixel.mp4?v=20260903-picked-crash-r1",CRASH_PLATE="assets/v742/cutscenes/crash_site.png";
  function remove(id){try{var n=root.document.getElementById(id);if(n)n.remove();}catch(_){}}
  function mark(extra){
    var prev=root.__goodBoysCrashScene||{};
    root.__goodBoysCrashScene=Object.assign({},prev,{active:true,completed:false,version:VERSION,authored:true,procedural:false,video:CRASH_VIDEO,plate:CRASH_PLATE,at:Date.now()},extra||{});
  }
  function finish(resolve,host,source){
    mark({active:false,completed:true,source:source||"authored-crash",at:Date.now()});
    try{host.remove();}catch(_){}
    root.__goodBoysOpeningPhase={phase:"crash-complete",owner:"authored-crash-scene-v5",at:Date.now()};
    resolve({completed:true,source:source||"authored-crash",video:CRASH_VIDEO,plate:CRASH_PLATE,authored:true,procedural:false,watchdogTriggered:!!(root.__goodBoysCrashScene&&root.__goodBoysCrashScene.watchdogTriggered),watchdogReason:root.__goodBoysCrashScene&&root.__goodBoysCrashScene.watchdogReason||null});
  }
  function fail(resolve,host,msg){
    mark({active:false,completed:false,error:msg,source:"asset-error",at:Date.now()});
    try{host.remove();}catch(_){}
    resolve({completed:false,assetError:true,error:msg,video:CRASH_VIDEO,plate:CRASH_PLATE,authored:true,procedural:false});
  }
  function showCrashScene(){return new Promise(function(resolve){
    remove("good-boys-crash-v4");remove("good-boys-crash-canonical");
    root.__goodBoysOpeningPhase={phase:"crash-scene",owner:"authored-crash-scene-v5",at:Date.now()};
    var host=root.document.createElement("div");host.id="good-boys-crash-canonical";
    host.style.cssText="position:fixed;inset:0;z-index:150400;background:#02050a;color:#fff;font-family:monospace;display:flex;align-items:center;justify-content:center;padding:max(8px,env(safe-area-inset-top)) 8px max(8px,env(safe-area-inset-bottom));box-sizing:border-box";
    host.innerHTML='<div style="width:min(100%,980px);height:min(100%,760px);display:grid;grid-template-rows:auto 1fr auto;gap:8px;min-height:0"><div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><b style="color:#ffb14a;letter-spacing:.12em">IMPACT VECTOR</b><span style="font-size:10px;color:#c8d8e4">ORBITAL DETENTION PERIMETER</span></div><div data-stage style="position:relative;min-height:0;overflow:hidden;border:1px solid #6c3e2b;background:#02050a;box-shadow:0 16px 50px #000"></div><div style="text-align:center;color:#ffd166;font:700 11px monospace">AUTOMATIC CINEMATIC</div></div>';
    var stage=host.querySelector("[data-stage]"),video=root.document.createElement("video"),plate=root.document.createElement("img"),done=false,plateTimer=0,loadTimer=0,watchdogTimer=0,absoluteTimer=0,lastMediaTime=0,lastAdvanceAt=Date.now(),playStarted=false;
    function clearVideoTimers(){clearTimeout(loadTimer);clearTimeout(absoluteTimer);if(watchdogTimer)root.clearInterval(watchdogTimer);watchdogTimer=0;}
    function complete(source){if(done)return;done=true;clearVideoTimers();clearTimeout(plateTimer);try{video.pause();video.removeAttribute("src");video.load();}catch(_){}finish(resolve,host,source);}
    function showPlate(reason){
      if(done||plate.dataset.active)return;
      plate.dataset.active="1";clearVideoTimers();
      var watchdog=/stall|watchdog|absolute/i.test(String(reason||""));
      mark({phase:"fallback",source:"authored-crash-plate",videoUnavailable:reason||false,watchdogTriggered:watchdog,watchdogReason:watchdog?String(reason):null});
      try{video.pause();video.remove();}catch(_){}
      plate.style.cssText="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#02050a";plate.alt="Authored Good Boys prison crash scene";
      plate.onload=function(){mark({phase:"plate",source:"authored-crash-plate",videoUnavailable:reason||false,watchdogTriggered:watchdog,watchdogReason:watchdog?String(reason):null});plateTimer=root.setTimeout(function(){complete("authored-crash-plate");},2200);};
      plate.onerror=function(){if(done)return;done=true;clearVideoTimers();clearTimeout(plateTimer);fail(resolve,host,"Authored crash plate failed to load");};
      plate.src=CRASH_PLATE;stage.appendChild(plate);
    }
    function noteProgress(){
      var t=Number(video.currentTime||0);
      if(t>lastMediaTime+.025){lastMediaTime=t;lastAdvanceAt=Date.now();}
    }
    function armPlaybackWatchdog(){
      if(watchdogTimer)return;
      lastMediaTime=Number(video.currentTime||0);lastAdvanceAt=Date.now();
      watchdogTimer=root.setInterval(function(){
        if(done||plate.dataset.active)return;
        noteProgress();
        if(playStarted&&Date.now()-lastAdvanceAt>3000)showPlate("video-stall");
      },400);
      absoluteTimer=root.setTimeout(function(){showPlate("video-absolute-watchdog");},9000);
    }
    video.style.cssText="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#02050a";
    video.playsInline=true;video.muted=true;video.defaultMuted=true;video.preload="auto";video.setAttribute("playsinline","");video.setAttribute("webkit-playsinline","");video.setAttribute("muted","");
    video.onloadeddata=function(){
      clearTimeout(loadTimer);mark({phase:"video",source:"authored-crash-video"});armPlaybackWatchdog();
      var p;try{p=video.play();playStarted=true;}catch(_){showPlate("play-throw");return;}
      if(p&&typeof p.then==="function")p.then(function(){playStarted=true;lastAdvanceAt=Date.now();}).catch(function(){showPlate("play-rejected");});
    };
    video.ontimeupdate=noteProgress;video.onplaying=function(){playStarted=true;lastAdvanceAt=Date.now();mark({phase:"video",source:"authored-crash-video",playing:true});};
    video.onwaiting=function(){mark({phase:"video",source:"authored-crash-video",waiting:true,currentTime:Number(video.currentTime||0)});};
    video.onstalled=function(){mark({phase:"video",source:"authored-crash-video",stalled:true,currentTime:Number(video.currentTime||0)});};
    video.onended=function(){complete("authored-crash-video");};
    video.onerror=function(){showPlate("video-error");};
    stage.appendChild(video);root.document.body.appendChild(host);mark({phase:"loading"});
    loadTimer=root.setTimeout(function(){showPlate("video-load-timeout");},3000);
    video.src=CRASH_VIDEO;try{video.load();}catch(_){showPlate("load-throw");}
  });}
  function install(){
    var opening=root.TechOpsGoodBoysOpeningV4;if(!opening)return false;
    if(opening.showCrashScene&&opening.showCrashScene.__authoredCrashVideoV4)return true;
    showCrashScene.__authoredCrashVideoV4=true;showCrashScene.__authoredCrashVideoV3=true;showCrashScene.__authoredCrashClipV3=true;showCrashScene.__canonicalCrashArt=true;showCrashScene.__canonicalCrashArtV2=true;opening.showCrashScene=showCrashScene;
    root.__goodBoysCrashSceneAuthority={version:VERSION,video:CRASH_VIDEO,plate:CRASH_PLATE,authored:true,procedural:false,owner:"authored-crash-scene-v5",watchdog:true,at:Date.now()};
    return true;
  }
  var timer=root.setInterval(function(){if(install())root.clearInterval(timer);},50);install();
  root.TechOpsGoodBoysCrashScene={VERSION:VERSION,install:install,showCrashScene:showCrashScene,video:CRASH_VIDEO,plate:CRASH_PLATE,timer:timer};
})(typeof globalThis!=="undefined"?globalThis:this);
