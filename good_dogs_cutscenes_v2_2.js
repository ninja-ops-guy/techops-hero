/* TechOps Hero — Good Dogs pre-rendered cutscene player v3.5.
 * Production playback contract:
 *   - authored movie is the only cinematic image on screen
 *   - fresh <video> element for every play() session (no stale media lifecycle)
 *   - muted + playsInline autoplay, user PLAY fallback only on actual failure/stall
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
  let sessionSerial=0;

  function ensureState(){
    window.__goodDogsCutsceneState=window.__goodDogsCutsceneState||{};
    if(window.S){S.meta=S.meta||{};S.meta.goodDogsCutscenes=S.meta.goodDogsCutscenes||{};const dst=S.meta.goodDogsCutscenes,src=window.__goodDogsCutsceneState;Object.keys(src).forEach(id=>{if(!dst[id])dst[id]=src[id];});return dst;}
    return window.__goodDogsCutsceneState;
  }
  function isIOSDevice(){try{const nav=window.navigator||{},ua=String(nav.userAgent||""),platform=String(nav.platform||"");return /iPad|iPhone|iPod/i.test(ua)||(platform==="MacIntel"&&Number(nav.maxTouchPoints||0)>1);}catch(_){return false;}}
  function makeOverlay(){
    let root=document.getElementById("good-dogs-cutscene-overlay");
    if(!root){
      root=document.createElement("div");root.id="good-dogs-cutscene-overlay";root.setAttribute("role","dialog");root.setAttribute("aria-modal","true");
      root.innerHTML='<div class="gd-film-frame"><button class="gd-film-play" type="button">PLAY CUTSCENE</button><button class="gd-film-skip" type="button">SKIP</button></div>';
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
      .gd-film-video{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#000;opacity:0;visibility:hidden}.gd-film-frame.gd-frame-ready .gd-film-video{opacity:1;visibility:visible}
      .gd-film-play{display:none;position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:10;min-width:210px;min-height:58px;padding:12px 18px;border:1px solid #8df1ce;background:#071019f2;color:#fff;font:700 13px monospace;letter-spacing:.08em;touch-action:manipulation}.gd-film-play.active{display:block}
      .gd-film-skip{position:absolute;right:max(10px,env(safe-area-inset-right));top:max(8px,env(safe-area-inset-top));z-index:11;min-width:86px;min-height:48px;background:#09121bf2;color:#fff;border:1px solid #71879a;padding:8px 12px;font:700 12px monospace;touch-action:manipulation}
    `;(document.head||document.documentElement).appendChild(css);
  }
  function settle(resolve,value){try{requestAnimationFrame(()=>setTimeout(()=>resolve(value),0));}catch(_){setTimeout(()=>resolve(value),0);}}

  async function play(id,options={}){
    const def=CLIPS[id];if(!def)throw new Error("Unknown Good Dogs cutscene: "+id);if(def.retired&&!options.force)throw new Error("Retired Good Dogs cutscene: "+id);
    ensureCss();
    const root=makeOverlay(),frame=root.querySelector(".gd-film-frame"),playBtn=root.querySelector(".gd-film-play"),skip=root.querySelector(".gd-film-skip");
    const ticket=++sessionSerial,state=ensureState(),priorOverflow=document.body.style.overflow,ios=isIOSDevice(),autoRequested=options.autoplay!==false;
    const video=document.createElement("video");video.className="gd-film-video";video.playsInline=true;video.muted=true;video.defaultMuted=true;video.volume=0;video.preload="auto";video.setAttribute("playsinline","");video.setAttribute("webkit-playsinline","");video.setAttribute("muted","");frame.insertBefore(video,playBtn);
    root.classList.add("active");root.dataset.activeCutscene=id;document.body.style.overflow="hidden";frame.classList.remove("gd-playing","gd-frame-ready");playBtn.classList.remove("active");skip.disabled=false;skip.textContent="SKIP";
    let done=false,startTimer=0,stallTimer=0,hardTimer=0,lastTime=-1,progressed=false,retryReason="",playInFlight=false,frameRevealed=false,autoAttempted=false;
    window.__goodDogsCutscenePresentation={id,authoredVideoOnly:true,poster:false,proceduralPlate:false,crt:false,vignette:false,freshVideoNode:true,session:ticket,at:Date.now()};

    return new Promise(resolve=>{
      const valid=()=>ticket===sessionSerial&&!done;
      const clearTimers=()=>{clearTimeout(startTimer);clearTimeout(stallTimer);clearTimeout(hardTimer);startTimer=stallTimer=hardTimer=0;};
      const cleanup=()=>{clearTimers();video.onended=null;video.onerror=null;video.onloadedmetadata=null;video.onloadeddata=null;video.oncanplay=null;video.onplaying=null;video.ontimeupdate=null;video.onwaiting=null;video.onstalled=null;skip.removeEventListener("click",skipEvent);playBtn.removeEventListener("click",playEvent);document.removeEventListener("keydown",key);};
      const finish=(resultStatus,source)=>{
        if(!valid())return;done=true;const skipped=resultStatus===STATUS.USER_SKIPPED,at=Date.now(),currentTime=Number(video.currentTime||0),readyState=Number(video.readyState||0);
        window.__goodDogsCutsceneExit={id,status:resultStatus,skipped,source,at,currentTime,readyState,ios,session:ticket};
        /* Detach callbacks before touching media. Never call load() during teardown: on
           WebKit that can dispatch an abort/error into the next back-to-back clip. */
        cleanup();
        try{video.pause();}catch(_){}
        try{video.removeAttribute("src");}catch(_){}
        try{video.remove();}catch(_){}
        frame.classList.remove("gd-playing","gd-frame-ready");playBtn.classList.remove("active");root.classList.remove("active");delete root.dataset.activeCutscene;document.body.style.overflow=priorOverflow;
        state[id]={seen:true,status:resultStatus,skipped,at};window.__goodDogsCutsceneState[id]=state[id];
        if(typeof options.onStateWrite==="function")try{options.onStateWrite({id,status:resultStatus,skipped});}catch(_){}
        settle(resolve,{id,status:resultStatus,skipped,source,session:ticket});
      };
      const waitForUser=(reason)=>{if(!valid())return;retryReason=reason;playInFlight=false;clearTimers();frame.classList.remove("gd-playing");playBtn.textContent=reason==="media-error"?"RETRY VIDEO":"PLAY CUTSCENE";playBtn.classList.add("active");window.__goodDogsCutsceneNeedsGesture={id,reason,at:Date.now(),currentTime:Number(video.currentTime||0),readyState:Number(video.readyState||0),networkState:Number(video.networkState||0),mediaError:video.error?{code:video.error.code,message:video.error.message}:null,ios,session:ticket};};
      const revealFrame=()=>{if(!valid()||frameRevealed)return;frameRevealed=true;frame.classList.add("gd-frame-ready");};
      const requestDecodedFrame=()=>{if(!valid()||frameRevealed)return;if(typeof video.requestVideoFrameCallback==="function"){try{video.requestVideoFrameCallback(()=>{if(valid())revealFrame();});return;}catch(_){}}if(Number(video.readyState||0)>=2&&Number(video.currentTime||0)>.02)revealFrame();};
      const armStall=()=>{clearTimeout(stallTimer);stallTimer=setTimeout(()=>waitForUser("media-stall"),4200);};
      const markPlaying=()=>{if(!valid())return;progressed=true;playInFlight=false;playBtn.classList.remove("active");frame.classList.add("gd-playing");requestDecodedFrame();armStall();clearTimeout(hardTimer);hardTimer=setTimeout(()=>waitForUser("hard-timeout"),60000);};
      const attemptPlay=()=>{if(!valid()||playInFlight)return;playInFlight=true;playBtn.classList.remove("active");let p;try{p=video.play();}catch(err){window.__goodDogsCutsceneAutoplayBlocked={id,at:Date.now(),error:String(err&&err.message||err),ios,session:ticket};waitForUser("play-throw");return;}if(p&&typeof p.then==="function")p.then(()=>{if(!valid())return;playInFlight=false;requestDecodedFrame();}).catch(err=>{if(!valid())return;window.__goodDogsCutsceneAutoplayBlocked={id,at:Date.now(),error:String(err&&err.message||err),ios,session:ticket};waitForUser("play-rejected");});clearTimeout(startTimer);startTimer=setTimeout(()=>{if(valid()&&!progressed)waitForUser("no-first-frame");},4200);};
      const attemptAutoplay=()=>{if(!valid()||!autoRequested||autoAttempted)return;autoAttempted=true;window.__goodDogsCutsceneAutoplay={id,requested:true,ios,muted:true,playsInline:true,session:ticket,at:Date.now()};attemptPlay();};
      const skipEvent=e=>{if(!valid())return;try{e.preventDefault();e.stopPropagation();}catch(_){}skip.disabled=true;skip.textContent="SKIPPING…";finish(STATUS.USER_SKIPPED,"click-skip");};
      const playEvent=e=>{if(!valid())return;try{e.preventDefault();e.stopPropagation();}catch(_){}progressed=false;if(retryReason==="media-error"){try{video.pause();video.src=options.src||def.src;video.load();}catch(_){}}attemptPlay();};
      const key=e=>{if(e.key==="Escape")finish(STATUS.USER_SKIPPED,"keyboard-skip");};
      skip.addEventListener("click",skipEvent);playBtn.addEventListener("click",playEvent);document.addEventListener("keydown",key);
      video.onended=()=>finish(STATUS.COMPLETED,"ended");
      video.onerror=()=>waitForUser("media-error");
      video.onloadedmetadata=attemptAutoplay;video.onloadeddata=attemptAutoplay;video.oncanplay=attemptAutoplay;
      video.onplaying=()=>{clearTimeout(startTimer);markPlaying();};
      video.ontimeupdate=()=>{if(!valid())return;const t=Number(video.currentTime||0);if(t>lastTime+.01){lastTime=t;if(t>.02){progressed=true;requestDecodedFrame();markPlaying();}}};
      video.onwaiting=video.onstalled=()=>{if(valid()&&progressed)armStall();};
      video.src=options.src||def.src;try{video.load();}catch(_){}
      if(autoRequested)startTimer=setTimeout(()=>{if(valid()&&!progressed&&!playInFlight&&!autoAttempted)waitForUser("autoplay-timeout");},3000);else waitForUser("autoplay-disabled");
    });
  }
  window.GoodDogsCutscenes={VERSION:"3.5",STATUS,play,clips:CLIPS,state:ensureState,isIOSDevice};
})();
