/* Good Boys authored crash-scene authority v5.
 * The selected movie owns the image; only playback completion or deliberate
 * Skip releases the M2 handoff. Watchdogs expose recovery, never progression.
 */
(function(root){
  'use strict';
  if(!root||!root.document)return;
  var VERSION=5,CRASH_VIDEO='assets/cutscenes/good_dogs/09_prison_crash_selected_pixel.mp4?v=20260903-picked-crash-r1',CRASH_PLATE='assets/v742/cutscenes/crash_site.png',pendingScene=null;
  function mark(extra){root.__goodBoysCrashScene=Object.assign({},root.__goodBoysCrashScene||{},{version:VERSION,authored:true,procedural:false,video:CRASH_VIDEO,plate:CRASH_PLATE,at:Date.now()},extra||{});}
  function capability(video){
    var shared=root.GoodDogsCutscenes;
    if(shared&&typeof shared.mediaCapability==='function')return shared.mediaCapability(video);
    var type='video/mp4; codecs="avc1.42E01E"',element='',mediaSource=false;
    try{element=String(video.canPlayType(type)||'').toLowerCase();}catch(_){}
    try{mediaSource=!!(root.MediaSource&&root.MediaSource.isTypeSupported(type));}catch(_){}
    return {supported:mediaSource||element==='probably'||element==='maybe',canPlayType:element,mediaSource:mediaSource,mimeType:type};
  }
  function showCrashScene(){
    if(pendingScene)return pendingScene;
    pendingScene=new Promise(function(resolve){
      var doc=root.document,previousFocus=doc.activeElement,host=doc.createElement('div');
      root.__goodBoysOpeningPhase={phase:'crash-scene',owner:'authored-crash-scene-v5',at:Date.now()};
      host.id='good-boys-crash-canonical';host.setAttribute('role','dialog');host.setAttribute('aria-modal','true');host.setAttribute('aria-label','Orbital detention arrival cinematic');host.setAttribute('aria-describedby','good-boys-crash-status');
      host.style.cssText='position:fixed;inset:0;z-index:150400;background:#02050a;color:#fff;font-family:monospace;display:flex;align-items:center;justify-content:center;box-sizing:border-box';
      host.innerHTML='<style>#good-boys-crash-canonical button{min-height:48px;min-width:86px;padding:10px 14px;border:1px solid #8ca8bd;background:#071019f2;color:white;font:700 12px monospace;touch-action:manipulation}#good-boys-crash-canonical button:focus-visible{outline:3px solid #ffe0a2;outline-offset:3px}#good-boys-crash-canonical [hidden]{display:none!important}#good-boys-crash-canonical [data-stage]{position:absolute;inset:0}#good-boys-crash-canonical [data-controls]{position:absolute;inset:max(8px,env(safe-area-inset-top)) max(10px,env(safe-area-inset-right)) auto max(10px,env(safe-area-inset-left));display:flex;justify-content:space-between;pointer-events:none}#good-boys-crash-canonical [data-controls] button{pointer-events:auto}#good-boys-crash-play{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%)}#good-boys-crash-status{position:absolute;bottom:max(12px,env(safe-area-inset-bottom));left:16px;right:16px;margin:0 auto;width:fit-content;max-width:calc(100% - 32px);padding:8px 12px;background:#071019ef;color:#e8f8ff;text-align:center;font:12px/1.5 monospace}#good-boys-crash-canonical[data-playing="true"] #good-boys-crash-status{opacity:0}</style><div data-stage></div><div data-controls><button id="good-boys-crash-pause" type="button" hidden>PAUSE</button><button id="good-boys-crash-skip" type="button">SKIP</button></div><button id="good-boys-crash-play" type="button" hidden>PLAY CUTSCENE</button><p id="good-boys-crash-status" role="status" aria-live="polite">Loading cinematic. You can skip at any time.</p>';
      var stage=host.querySelector('[data-stage]'),video=doc.createElement('video'),plate=doc.createElement('img'),pause=host.querySelector('#good-boys-crash-pause'),skip=host.querySelector('#good-boys-crash-skip'),play=host.querySelector('#good-boys-crash-play'),status=host.querySelector('#good-boys-crash-status');
      plate.hidden=true;plate.alt='Authored Good Dogs prison crash scene';plate.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#02050a';skip.style.marginLeft='auto';
      var done=false,loadTimer=0,watchdogTimer=0,absoluteTimer=0,lastMediaTime=0,lastAdvanceAt=Date.now(),playStarted=false,playInFlight=false,autoAllowed=true,waiting=false,reason='',deferredEnded=false,support=capability(video);
      function clearVideoTimers(){root.clearTimeout(loadTimer);root.clearTimeout(absoluteTimer);if(watchdogTimer)root.clearInterval(watchdogTimer);loadTimer=absoluteTimer=watchdogTimer=0;}
      function cleanup(){
        clearVideoTimers();doc.removeEventListener('visibilitychange',visibility);doc.removeEventListener('keydown',key,true);
        video.onloadeddata=video.onplaying=video.ontimeupdate=video.onwaiting=video.onstalled=video.onended=video.onerror=null;
        play.onclick=pause.onclick=skip.onclick=null;
      }
      function complete(resultStatus,source){
        if(done||doc.hidden)return false;done=true;var skipped=resultStatus==='USER_SKIPPED';
        mark({active:false,completed:true,status:resultStatus,skipped:skipped,source:source,phase:'complete',recovery:false,mediaTime:Number(video.currentTime||0),mediaDuration:Number(video.duration||0)});
        cleanup();try{video.pause();video.removeAttribute('src');video.remove();}catch(_){}host.remove();
        if(previousFocus&&previousFocus.isConnected!==false&&typeof previousFocus.focus==='function')previousFocus.focus();
        root.__goodBoysOpeningPhase={phase:'crash-complete',owner:'authored-crash-scene-v5',at:Date.now()};
        resolve({completed:true,status:resultStatus,skipped:skipped,source:source,video:CRASH_VIDEO,plate:CRASH_PLATE,authored:true,procedural:false,watchdogTriggered:!!root.__goodBoysCrashScene.watchdogTriggered,watchdogReason:root.__goodBoysCrashScene.watchdogReason||null});return true;
      }
      function recover(why){
        if(done)return;reason=why;waiting=true;autoAllowed=false;playInFlight=false;clearVideoTimers();try{video.pause();}catch(_){}
        host.dataset.playing='false';pause.hidden=true;play.hidden=false;play.disabled=!support.supported;
        var paused=why==='background'||why==='user-paused',watchdog=/stall|watchdog/.test(why);
        // Retain the approved recovery plate as a still image. Its load event
        // and elapsed display time have no authority to complete the movie.
        plate.hidden=support.supported&&paused;if(!plate.hidden&&!plate.dataset.loaded){plate.dataset.loaded='true';plate.src=CRASH_PLATE;}
        play.textContent=!support.supported?'VIDEO UNAVAILABLE':paused?'RESUME CUTSCENE':'RETRY VIDEO';
        status.textContent=!support.supported?'This browser cannot play this cinematic. Choose Skip to continue the story.':paused?'Cinematic paused. Resume when you are ready, or skip to continue the story.':'Playback stopped. Retry the video, or choose Skip to continue the story.';
        mark({active:true,completed:false,phase:'recovery',recovery:true,recoveryReason:why,capability:support,watchdogTriggered:watchdog||!!root.__goodBoysCrashScene.watchdogTriggered,watchdogReason:watchdog?why:root.__goodBoysCrashScene.watchdogReason||null});
        if(!doc.hidden)(support.supported?play:skip).focus();
      }
      function noteProgress(){if(done)return;var t=Number(video.currentTime||0);if(t>lastMediaTime+.025){lastMediaTime=t;lastAdvanceAt=Date.now();}}
      function armPlaybackWatchdog(){
        clearVideoTimers();lastMediaTime=Number(video.currentTime||0);lastAdvanceAt=Date.now();
        watchdogTimer=root.setInterval(function(){if(done||waiting)return;if(doc.hidden){recover('background');return;}noteProgress();if(playStarted&&Date.now()-lastAdvanceAt>3000)recover('video-stall');},400);
        // Preserve the whole remaining 9.433-second movie plus three seconds.
        // Pausing clears this timer instead of consuming its playback budget.
        var duration=Number(video.duration),remaining=Math.max(0,duration-Number(video.currentTime||0)),budget=Number.isFinite(duration)&&duration>0?Math.min(60000,Math.ceil(remaining*1000)+3000):12000;
        mark({playbackBudgetMs:budget});absoluteTimer=root.setTimeout(function(){recover('video-absolute-watchdog');},budget);
      }
      function attemptPlay(){
        if(done||playInFlight||!support.supported)return;if(doc.hidden){recover('background');return;}
        if(deferredEnded){complete('COMPLETED','authored-crash-video');return;}
        waiting=false;playInFlight=true;play.hidden=true;plate.hidden=true;var p;
        root.clearTimeout(loadTimer);loadTimer=root.setTimeout(function(){recover('video-load-timeout');},3000);
        try{p=video.play();}catch(_){recover('play-throw');return;}
        if(p&&typeof p.then==='function')p.then(function(){playInFlight=false;if(done)return;if(doc.hidden)recover('background');}).catch(function(){if(!done)recover('play-rejected');});
      }
      function visibility(){if(done)return;if(doc.hidden)recover(support.supported?'background':'codec-unsupported');else if(waiting)(support.supported?play:skip).focus();}
      function skipEvent(e){if(e){e.preventDefault();e.stopPropagation();}return complete('USER_SKIPPED','user-skipped');}
      function key(e){if(done||doc.hidden)return;if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();skipEvent();}else if(e.key==='Tab'){e.preventDefault();e.stopImmediatePropagation();var buttons=[play,pause,skip].filter(function(b){return !b.hidden&&!b.disabled;}),i=buttons.indexOf(doc.activeElement);buttons[i<0?(e.shiftKey?buttons.length-1:0):(i+(e.shiftKey?-1:1)+buttons.length)%buttons.length].focus();}}
      play.onclick=function(e){e.preventDefault();e.stopPropagation();if(done||doc.hidden||!support.supported)return;if(reason==='video-error'){try{video.src=CRASH_VIDEO;video.load();}catch(_){}}attemptPlay();};
      pause.onclick=function(e){e.preventDefault();e.stopPropagation();recover('user-paused');};skip.onclick=skipEvent;
      video.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#02050a';
      video.playsInline=true;video.muted=true;video.defaultMuted=true;video.preload='auto';video.setAttribute('playsinline','');video.setAttribute('webkit-playsinline','');video.setAttribute('muted','');
      video.onloadeddata=function(){if(autoAllowed)attemptPlay();};
      video.onplaying=function(){if(done)return;if(doc.hidden||waiting){recover(doc.hidden?'background':reason);return;}playStarted=true;playInFlight=false;host.dataset.playing='true';play.hidden=true;pause.hidden=false;if(status.textContent!=='Cinematic playing.')status.textContent='Cinematic playing.';if(doc.activeElement===play)pause.focus();mark({phase:'video',source:'authored-crash-video',playing:true,recovery:false});armPlaybackWatchdog();};
      video.ontimeupdate=noteProgress;video.onwaiting=video.onstalled=function(){if(!done&&!waiting)mark({waiting:true,currentTime:Number(video.currentTime||0)});};
      video.onended=function(){if(done)return;if(doc.hidden||waiting){deferredEnded=true;recover(doc.hidden?'background':reason);return;}complete('COMPLETED','authored-crash-video');};
      video.onerror=function(){recover('video-error');};
      stage.appendChild(video);stage.appendChild(plate);doc.body.appendChild(host);doc.addEventListener('visibilitychange',visibility);doc.addEventListener('keydown',key,true);skip.focus();
      mark({active:true,completed:false,status:null,skipped:false,phase:'loading',recovery:false,watchdogTriggered:false,watchdogReason:null,mediaTime:0,mediaDuration:0,capability:support});
      if(!support.supported){recover('codec-unsupported');return;}
      if(doc.hidden)recover('background');
      loadTimer=doc.hidden?0:root.setTimeout(function(){recover('video-load-timeout');},3000);
      video.src=CRASH_VIDEO;try{video.load();}catch(_){recover('load-throw');}
    });
    pendingScene.then(function(){pendingScene=null;},function(){pendingScene=null;});return pendingScene;
  }
  function install(){
    var opening=root.TechOpsGoodBoysOpeningV4;if(!opening)return false;
    if(opening.showCrashScene&&opening.showCrashScene.__authoredCrashVideoV4)return true;
    showCrashScene.__authoredCrashVideoV4=true;showCrashScene.__authoredCrashVideoV3=true;showCrashScene.__authoredCrashClipV3=true;showCrashScene.__canonicalCrashArt=true;showCrashScene.__canonicalCrashArtV2=true;opening.showCrashScene=showCrashScene;
    root.__goodBoysCrashSceneAuthority={version:VERSION,video:CRASH_VIDEO,plate:CRASH_PLATE,authored:true,procedural:false,owner:'authored-crash-scene-v5',watchdog:true,at:Date.now()};return true;
  }
  var timer=root.setInterval(function(){if(install())root.clearInterval(timer);},50);install();
  root.TechOpsGoodBoysCrashScene={VERSION:VERSION,install:install,showCrashScene:showCrashScene,video:CRASH_VIDEO,plate:CRASH_PLATE,timer:timer};
})(typeof globalThis!=='undefined'?globalThis:this);
