/* TechOps Hero — Good Dogs pre-rendered cutscene player v3.7.
 * Production playback contract:
 *   - authored movie is the only cinematic image on screen
 *   - fresh <video> element for every play() session (no stale media lifecycle)
 *   - muted + playsInline autoplay begins immediately; media events are retries, not the trigger
 *   - user PLAY fallback only on actual failure/stall
 *   - reveal only after a decoded frame exists
 *   - only COMPLETED or USER_SKIPPED advances campaign state
 */
(function(){
  "use strict";
  const BASE="assets/cutscenes/good_dogs/";
  const CLIPS={
    GD_CUT_01:{src:BASE+"01_signal_beyond_earth_pixel.mp4"},
    GD_CUT_02:{src:BASE+"02_signal_pull_transition_pixel.mp4?v=20260903-picked-pilot-attack-r1"},
    GD_CUT_03:{src:BASE+"03_orbital_approach_pixel.mp4",retired:true},
    GD_CUT_04:{src:BASE+"04_cell118_triple_jump_to_terminal_pixel.mp4"},
    GD_CUT_05:{src:BASE+"05_cell118_approach_k_reveal_pixel.mp4"},
    GD_CUT_06:{src:BASE+"06_k_freed_prison_escort_pixel.mp4"},
    GD_CUT_07:{src:BASE+"07_cell1984_hack_pixel.mp4"},
    GD_CUT_08:{src:BASE+"08_team_reunited_exit_pixel.mp4"}
  };
  const STATUS=Object.freeze({COMPLETED:"COMPLETED",USER_SKIPPED:"USER_SKIPPED"});
  const H264_MIME='video/mp4; codecs="avc1.42E01E"';
  let sessionSerial=0;

  function mediaCapability(video,mimeType){
    const type=mimeType||H264_MIME;
    let mediaSource=false,canPlay="",mediaSourceProbed=false,elementProbed=false;
    try{const M=window.MediaSource;if(M&&typeof M.isTypeSupported==="function"){mediaSourceProbed=true;mediaSource=!!M.isTypeSupported(type);}}catch(_){}
    try{if(video&&typeof video.canPlayType==="function"){elementProbed=true;canPlay=String(video.canPlayType(type)||"").toLowerCase();}}catch(_){}
    const elementSupported=canPlay==="probably"||canPlay==="maybe";
    return Object.freeze({mimeType:type,supported:mediaSource||elementSupported,mediaSource,canPlayType:canPlay,mediaSourceProbed,elementProbed});
  }
  function createSettlementGate(){let settled=false;return Object.freeze({claim(){if(settled)return false;settled=true;return true;},settled(){return settled;}});}

  function ensureState(){
    window.__goodDogsCutsceneState=window.__goodDogsCutsceneState||{};
    if(window.S){S.meta=S.meta||{};S.meta.goodDogsCutscenes=S.meta.goodDogsCutscenes||{};const dst=S.meta.goodDogsCutscenes,src=window.__goodDogsCutsceneState;Object.keys(src).forEach(id=>{if(!dst[id])dst[id]=src[id];});return dst;}
    return window.__goodDogsCutsceneState;
  }
  function isIOSDevice(){try{const nav=window.navigator||{},ua=String(nav.userAgent||""),platform=String(nav.platform||"");return /iPad|iPhone|iPod/i.test(ua)||(platform==="MacIntel"&&Number(nav.maxTouchPoints||0)>1);}catch(_){return false;}}
  function makeOverlay(){
    let root=document.getElementById("good-dogs-cutscene-overlay");
    if(!root){
      root=document.createElement("div");root.id="good-dogs-cutscene-overlay";root.setAttribute("role","dialog");root.setAttribute("aria-modal","true");root.setAttribute("aria-label","Good Dogs cinematic");root.setAttribute("aria-describedby","gd-film-status");
      root.innerHTML='<div class="gd-film-frame"><p id="gd-film-status" class="gd-film-status" role="status" aria-live="polite"></p><button class="gd-film-play" type="button">PLAY CUTSCENE</button><button class="gd-film-pause" type="button">PAUSE</button><button class="gd-film-skip" type="button">SKIP</button></div>';
      document.body.appendChild(root);
    }
    const frame=root.querySelector(".gd-film-frame")||root;
    Array.from(frame.querySelectorAll(".gd-film-video")).forEach(v=>{try{v.pause();}catch(_){}try{v.remove();}catch(_){}});
    return root;
  }
  function ensureCss(){
    if(document.getElementById("good-dogs-cutscene-v35-style"))return;
    const css=document.createElement("style");css.id="good-dogs-cutscene-v35-style";css.textContent=`
      #good-dogs-cutscene-overlay{position:fixed;inset:0;z-index:150000;background:#000;display:none;align-items:center;justify-content:center;overscroll-behavior:none;touch-action:manipulation}
      #good-dogs-cutscene-overlay.active{display:flex}.gd-film-frame{position:relative;width:100vw;height:100vh;background:#000;display:flex;align-items:center;justify-content:center;overflow:hidden}
      /* Fresh video nodes have no stale frame. Keep them visible so WebKit can submit decoded frames. */
      .gd-film-video{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#000;opacity:1;visibility:visible}
      .gd-film-play{display:none;position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:10;min-width:210px;min-height:58px;padding:12px 18px;border:1px solid #8df1ce;background:#071019f2;color:#fff;font:700 13px monospace;letter-spacing:.08em;touch-action:manipulation}.gd-film-play.active{display:block}
      .gd-film-skip{position:absolute;right:max(10px,env(safe-area-inset-right));top:max(8px,env(safe-area-inset-top));z-index:11;min-width:86px;min-height:48px;background:#09121bf2;color:#fff;border:1px solid #71879a;padding:8px 12px;font:700 12px monospace;touch-action:manipulation}
      .gd-film-status{position:absolute;left:max(16px,env(safe-area-inset-left));right:max(16px,env(safe-area-inset-right));bottom:max(12px,env(safe-area-inset-bottom));z-index:10;width:fit-content;max-width:calc(100% - 32px);margin:0 auto;padding:8px 12px;background:#071019e8;color:#e8f8ff;font:12px/1.5 monospace;text-align:center;pointer-events:none}.gd-playing .gd-film-status{opacity:0}.gd-film-pause{position:absolute;left:max(10px,env(safe-area-inset-left));top:max(8px,env(safe-area-inset-top));z-index:11;min-height:48px;min-width:86px;background:#09121bf2;color:#fff;border:1px solid #71879a;font:700 12px monospace}.gd-film-pause[hidden]{display:none}#good-dogs-cutscene-overlay button:focus-visible{outline:3px solid #ffe0a2;outline-offset:3px}
      @supports(height:100dvh){.gd-film-frame{height:100dvh}}@media(prefers-reduced-motion:reduce){#good-dogs-cutscene-overlay *{scroll-behavior:auto}}
    `;(document.head||document.documentElement).appendChild(css);
  }
  function settle(resolve,value){try{requestAnimationFrame(()=>setTimeout(()=>resolve(value),0));}catch(_){setTimeout(()=>resolve(value),0);}}

  async function play(id,options={}){
    const def=CLIPS[id];if(!def)throw new Error("Unknown Good Dogs cutscene: "+id);if(def.retired&&!options.force)throw new Error("Retired Good Dogs cutscene: "+id);
    ensureCss();
    const previousFocus=document.activeElement;
    const root=makeOverlay(),frame=root.querySelector(".gd-film-frame"),playBtn=root.querySelector(".gd-film-play"),skip=root.querySelector(".gd-film-skip"),pauseBtn=root.querySelector(".gd-film-pause"),status=root.querySelector(".gd-film-status");
    const ticket=++sessionSerial,state=ensureState(),priorOverflow=document.body.style.overflow,ios=isIOSDevice(),autoRequested=options.autoplay!==false;
    const video=document.createElement("video");video.className="gd-film-video";video.playsInline=true;video.muted=true;video.defaultMuted=true;video.volume=0;video.preload="auto";video.autoplay=autoRequested;video.setAttribute("playsinline","");video.setAttribute("webkit-playsinline","");video.setAttribute("muted","");if(autoRequested)video.setAttribute("autoplay","");frame.insertBefore(video,playBtn);
    root.classList.add("active");root.dataset.activeCutscene=id;document.body.style.overflow="hidden";frame.classList.remove("gd-playing","gd-frame-ready");playBtn.classList.remove("active");skip.disabled=false;skip.textContent="SKIP";
    const capability=mediaCapability(video,options.mimeType),settlement=createSettlementGate();
    let done=false,startTimer=0,stallTimer=0,hardTimer=0,lastTime=-1,progressed=false,retryReason="",playInFlight=false,frameRevealed=false,autoAttempted=false,deferredEnded=false;
    status.textContent="Loading cinematic. You can skip at any time.";pauseBtn.hidden=true;skip.focus();
    window.__goodDogsCutscenePresentation={id,authoredVideoOnly:true,poster:false,proceduralPlate:false,crt:false,vignette:false,freshVideoNode:true,session:ticket,at:Date.now()};
    window.__goodDogsCutsceneCapability=Object.assign({id,session:ticket,at:Date.now()},capability);

    return new Promise(resolve=>{
      const valid=()=>ticket===sessionSerial&&!done&&!settlement.settled();
      const clearTimers=()=>{clearTimeout(startTimer);clearTimeout(stallTimer);clearTimeout(hardTimer);startTimer=stallTimer=hardTimer=0;};
      const cleanup=()=>{clearTimers();video.onended=null;video.onerror=null;video.onloadedmetadata=null;video.onloadeddata=null;video.oncanplay=null;video.onplaying=null;video.ontimeupdate=null;video.onwaiting=null;video.onstalled=null;skip.removeEventListener("click",skipEvent);playBtn.removeEventListener("click",playEvent);pauseBtn.removeEventListener("click",pauseEvent);document.removeEventListener("keydown",key,true);document.removeEventListener("visibilitychange",visibility);};
      const finish=(resultStatus,source)=>{
        if(!valid()||document.hidden||!settlement.claim())return false;done=true;const skipped=resultStatus===STATUS.USER_SKIPPED,at=Date.now(),currentTime=Number(video.currentTime||0),readyState=Number(video.readyState||0);
        window.__goodDogsCutsceneExit={id,status:resultStatus,skipped,source,at,currentTime,readyState,ios,session:ticket};
        cleanup();
        try{video.pause();}catch(_){}
        try{video.removeAttribute("src");}catch(_){}
        try{video.remove();}catch(_){}
        frame.classList.remove("gd-playing","gd-frame-ready");playBtn.classList.remove("active");root.classList.remove("active");delete root.dataset.activeCutscene;document.body.style.overflow=priorOverflow;
        if(previousFocus&&previousFocus.isConnected!==false&&typeof previousFocus.focus==="function")previousFocus.focus();
        state[id]={seen:true,status:resultStatus,skipped,at};window.__goodDogsCutsceneState[id]=state[id];
        if(typeof options.onStateWrite==="function")try{options.onStateWrite({id,status:resultStatus,skipped});}catch(_){}
        settle(resolve,{id,status:resultStatus,skipped,source,session:ticket});return true;
      };
      const waitForUser=(reason)=>{if(!valid())return;retryReason=reason;playInFlight=false;clearTimers();try{video.pause();}catch(_){}frame.classList.remove("gd-playing");pauseBtn.hidden=true;const unsupported=reason==="codec-unsupported",paused=reason==="tab-hidden"||reason==="user-paused";playBtn.disabled=unsupported;playBtn.textContent=unsupported?"VIDEO UNAVAILABLE":reason==="media-error"?"RETRY VIDEO":paused?"RESUME CUTSCENE":"PLAY CUTSCENE";status.textContent=unsupported?"This browser cannot play this cinematic. Choose Skip to continue the story.":paused?"Cinematic paused. Resume when you are ready, or skip to continue the story.":reason==="autoplay-disabled"?"Ready to play. Choose Play cutscene, or skip to continue the story.":"Playback stopped. Choose Play or Retry, or skip to continue the story.";playBtn.classList.add("active");if(!document.hidden)(unsupported?skip:playBtn).focus();window.__goodDogsCutsceneNeedsGesture={id,reason,at:Date.now(),currentTime:Number(video.currentTime||0),readyState:Number(video.readyState||0),networkState:Number(video.networkState||0),paused:video.paused,ended:video.ended,duration:video.duration,buffered:Array.from({length:video.buffered.length},(_,i)=>[video.buffered.start(i),video.buffered.end(i)]),paint:video.getBoundingClientRect().toJSON(),visibility:getComputedStyle(video).visibility,mediaError:video.error?{code:video.error.code,message:video.error.message}:null,ios,session:ticket,capability};};
      const revealFrame=()=>{if(!valid()||frameRevealed)return;frameRevealed=true;frame.classList.add("gd-frame-ready");};
      const requestDecodedFrame=()=>{if(!valid()||frameRevealed)return;if(typeof video.requestVideoFrameCallback==="function"){try{video.requestVideoFrameCallback(()=>{if(valid())revealFrame();});return;}catch(_){}}if(Number(video.readyState||0)>=2&&Number(video.currentTime||0)>.02)revealFrame();};
      const armStall=()=>{clearTimeout(stallTimer);stallTimer=setTimeout(()=>waitForUser("media-stall"),4200);};
      const markPlaying=()=>{if(!valid())return;if(document.hidden){waitForUser("tab-hidden");return;}progressed=true;playInFlight=false;playBtn.classList.remove("active");pauseBtn.hidden=false;frame.classList.add("gd-playing");if(status.textContent!=="Cinematic playing.")status.textContent="Cinematic playing.";if(document.activeElement===playBtn)pauseBtn.focus();requestDecodedFrame();armStall();clearTimeout(hardTimer);hardTimer=setTimeout(()=>waitForUser("hard-timeout"),60000);};
      const attemptPlay=()=>{if(!valid()||playInFlight)return;if(document.hidden){waitForUser("tab-hidden");return;}playInFlight=true;playBtn.classList.remove("active");let p;try{p=video.play();}catch(err){window.__goodDogsCutsceneAutoplayBlocked={id,at:Date.now(),error:String(err&&err.message||err),ios,session:ticket};waitForUser("play-throw");return;}if(p&&typeof p.then==="function")p.then(()=>{if(!valid())return;playInFlight=false;if(document.hidden){waitForUser("tab-hidden");return;}requestDecodedFrame();}).catch(err=>{if(!valid())return;window.__goodDogsCutsceneAutoplayBlocked={id,at:Date.now(),error:String(err&&err.message||err),ios,session:ticket};waitForUser("play-rejected");});clearTimeout(startTimer);startTimer=setTimeout(()=>{if(valid()&&!progressed)waitForUser("no-first-frame");},4200);};
      const attemptAutoplay=()=>{if(!valid()||!autoRequested||autoAttempted)return;autoAttempted=true;window.__goodDogsCutsceneAutoplay={id,requested:true,ios,muted:true,playsInline:true,immediate:true,session:ticket,at:Date.now()};attemptPlay();};
      const skipEvent=e=>{if(!valid()||document.hidden)return;try{e.preventDefault();e.stopPropagation();}catch(_){}skip.disabled=true;skip.textContent="SKIPPING…";finish(STATUS.USER_SKIPPED,"click-skip");};
      const playEvent=e=>{if(!valid()||!capability.supported||document.hidden)return;try{e.preventDefault();e.stopPropagation();}catch(_){}if(deferredEnded){finish(STATUS.COMPLETED,"visible-resume");return;}progressed=false;if(retryReason==="media-error"){try{video.pause();video.src=options.src||def.src;video.load();}catch(_){}}attemptPlay();};
      const pauseEvent=e=>{try{e.preventDefault();e.stopPropagation();}catch(_){}waitForUser("user-paused");};
      const visibility=()=>{if(!valid())return;if(document.hidden)waitForUser(capability.supported?"tab-hidden":"codec-unsupported");else if(retryReason==="tab-hidden")(capability.supported?playBtn:skip).focus();};
      const key=e=>{if(!valid())return;if(e.key==="Escape"){e.preventDefault();e.stopImmediatePropagation();finish(STATUS.USER_SKIPPED,"keyboard-skip");}else if(e.key==="Tab"){e.preventDefault();e.stopImmediatePropagation();const buttons=[playBtn,pauseBtn,skip].filter(b=>!b.disabled&&!b.hidden&&(b!==playBtn||b.classList.contains("active"))),i=buttons.indexOf(document.activeElement);buttons[i<0?(e.shiftKey?buttons.length-1:0):(i+(e.shiftKey?-1:1)+buttons.length)%buttons.length].focus();}};
      skip.addEventListener("click",skipEvent);playBtn.addEventListener("click",playEvent);pauseBtn.addEventListener("click",pauseEvent);document.addEventListener("keydown",key,true);document.addEventListener("visibilitychange",visibility);
      video.onended=()=>{if(!valid())return;if(document.hidden){deferredEnded=true;waitForUser("tab-hidden");return;}finish(STATUS.COMPLETED,"ended");};
      video.onerror=()=>waitForUser("media-error");
      video.onloadedmetadata=attemptAutoplay;video.onloadeddata=attemptAutoplay;video.oncanplay=attemptAutoplay;
      video.onplaying=()=>{clearTimeout(startTimer);markPlaying();};
      video.ontimeupdate=()=>{if(!valid())return;const t=Number(video.currentTime||0);if(t>lastTime+.01){lastTime=t;if(t>.02){progressed=true;requestDecodedFrame();markPlaying();}}};
      video.onwaiting=video.onstalled=()=>{if(valid()&&progressed)armStall();};
      if(!capability.supported){waitForUser("codec-unsupported");return;}
      video.src=options.src||def.src;try{video.load();}catch(_){}
      if(autoRequested)attemptAutoplay();else waitForUser("autoplay-disabled");
    });
  }
  window.GoodDogsCutscenes={VERSION:"3.7",STATUS,H264_MIME,play,clips:CLIPS,state:ensureState,isIOSDevice,mediaCapability,createSettlementGate};
})();
