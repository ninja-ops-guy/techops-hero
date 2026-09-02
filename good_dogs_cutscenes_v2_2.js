/* TechOps Hero — Good Dogs pre-rendered cutscene player
   v2.6: iPhone/WebKit fail-open playback, visible loading state, deterministic
   skip handling, and media-stall recovery so a failed movie can never leave a
   permanent black fullscreen blocker in front of gameplay.
*/
(function(){
  "use strict";
  const CLIPS={
    GD_CUT_01:{src:"assets/cutscenes/good_dogs/01_signal_beyond_earth_pixel.mp4"},GD_CUT_02:{src:"assets/cutscenes/good_dogs/02_signal_pull_transition_pixel.mp4"},GD_CUT_03:{src:"assets/cutscenes/good_dogs/03_orbital_approach_pixel.mp4"},GD_CUT_04:{src:"assets/cutscenes/good_dogs/04_cell118_triple_jump_to_terminal_pixel.mp4"},GD_CUT_05:{src:"assets/cutscenes/good_dogs/05_cell118_approach_k_reveal_pixel.mp4"},GD_CUT_06:{src:"assets/cutscenes/good_dogs/06_k_freed_prison_escort_pixel.mp4"},GD_CUT_07:{src:"assets/cutscenes/good_dogs/07_cell1984_hack_pixel.mp4"},GD_CUT_08:{src:"assets/cutscenes/good_dogs/08_team_reunited_exit_pixel.mp4"}
  };
  function ensureState(){
    window.__goodDogsCutsceneState=window.__goodDogsCutsceneState||{};
    if(window.S){
      S.meta=S.meta||{};S.meta.goodDogsCutscenes=S.meta.goodDogsCutscenes||{};
      const dst=S.meta.goodDogsCutscenes,src=window.__goodDogsCutsceneState;
      Object.keys(src).forEach(id=>{if(!dst[id])dst[id]=src[id];});
      return dst;
    }
    return window.__goodDogsCutsceneState;
  }
  function makeOverlay(){
    let root=document.getElementById("good-dogs-cutscene-overlay");if(root)return root;
    root=document.createElement("div");root.id="good-dogs-cutscene-overlay";root.setAttribute("role","dialog");root.setAttribute("aria-modal","true");
    root.innerHTML='<div class="gd-film-frame"><div class="gd-film-title">GOOD DOGS PROTOCOL</div><video class="gd-film-video" playsinline webkit-playsinline preload="auto" muted></video><div class="gd-film-status" aria-live="polite">LOADING TRANSMISSION…</div><div class="gd-crt" aria-hidden="true"></div><div class="gd-vignette" aria-hidden="true"></div><button class="gd-film-skip" type="button">SKIP</button></div>';
    document.body.appendChild(root);return root;
  }
  const css=document.createElement("style");css.textContent=`
    #good-dogs-cutscene-overlay{position:fixed;inset:0;z-index:150000;background:#010205;display:none;align-items:center;justify-content:center;overscroll-behavior:none;touch-action:manipulation}
    #good-dogs-cutscene-overlay.active{display:flex}.gd-film-frame{position:relative;width:min(100vw,1100px);height:min(100vh,720px);background:radial-gradient(circle at 50% 44%,#0a1720 0,#03070b 46%,#000 100%);border:1px solid #273846;box-shadow:0 0 40px #000;display:flex;align-items:center;justify-content:center;overflow:hidden}
    .gd-film-video{width:100%;height:100%;object-fit:contain;background:transparent;image-rendering:auto;filter:contrast(1.035) saturate(.91) brightness(.98)}
    .gd-film-status{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:1;color:#9be8cf;font:700 11px/1.4 monospace;letter-spacing:1.2px;text-align:center;white-space:nowrap;pointer-events:none;text-shadow:0 0 12px #6ee7c766}
    .gd-film-frame.gd-playing .gd-film-status{display:none}
    .gd-crt{position:absolute;inset:0;pointer-events:none;z-index:2;background:repeating-linear-gradient(0deg,rgba(210,235,230,.018) 0 1px,transparent 1px 4px);opacity:.42}
    .gd-vignette{position:absolute;inset:0;pointer-events:none;z-index:3;box-shadow:inset 0 0 70px rgba(0,0,0,.36),inset 0 0 12px rgba(110,190,170,.035)}
    .gd-film-title{position:absolute;left:12px;top:10px;z-index:4;padding:5px 9px;font:700 11px/1 monospace;letter-spacing:1.5px;color:#9be8cf;background:#071019cc;border:1px solid #294851;pointer-events:none}
    .gd-film-skip{position:absolute;right:12px;top:10px;z-index:9;min-width:72px;min-height:44px;background:#09121bf2;color:#fff;border:1px solid #71879a;padding:8px 12px;font:700 12px monospace;touch-action:manipulation;pointer-events:auto;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent}
    @media(max-width:600px){.gd-film-frame{width:100vw;height:100vh;border:0}.gd-film-title,.gd-film-skip{top:max(8px,env(safe-area-inset-top))}.gd-film-skip{right:max(10px,env(safe-area-inset-right));min-width:86px;min-height:48px}.gd-film-status{font-size:10px}}
  `;document.head.appendChild(css);
  async function play(id,options={}){
    const def=CLIPS[id];if(!def)throw new Error("Unknown Good Dogs cutscene: "+id);
    const root=makeOverlay(),frame=root.querySelector(".gd-film-frame"),video=root.querySelector(".gd-film-video"),status=root.querySelector(".gd-film-status"),skip=root.querySelector(".gd-film-skip"),state=ensureState(),priorOverflow=document.body.style.overflow;
    root.classList.add("active");root.dataset.activeCutscene=id;document.body.style.overflow="hidden";
    frame.classList.remove("gd-playing");if(status)status.textContent="LOADING TRANSMISSION…";
    video.controls=false;video.muted=true;video.defaultMuted=true;video.volume=0;video.setAttribute("muted","");video.removeAttribute("autoplay");skip.disabled=false;skip.textContent="SKIP";
    let done=false,startTimer=0,stallTimer=0,hardTimer=0,lastTime=-1,progressed=false;
    return new Promise((resolve)=>{
      const clearTimers=()=>{clearTimeout(startTimer);clearTimeout(stallTimer);clearTimeout(hardTimer);startTimer=stallTimer=hardTimer=0;};
      const cleanup=()=>{
        clearTimers();
        video.onended=null;video.onerror=null;video.onloadeddata=null;video.onplaying=null;video.ontimeupdate=null;video.onwaiting=null;video.onstalled=null;
        skip.removeEventListener("pointerup",skipEvent);skip.removeEventListener("touchend",skipEvent);skip.removeEventListener("click",skipEvent);
        root.removeEventListener("pointerup",rootCapture,true);root.removeEventListener("touchend",rootCapture,true);root.removeEventListener("click",rootCapture,true);
        document.removeEventListener("pointerup",documentCapture,true);document.removeEventListener("touchend",documentCapture,true);document.removeEventListener("click",documentCapture,true);document.removeEventListener("keydown",key);
        if(skip.__goodDogsNativeClick){try{skip.click=skip.__goodDogsNativeClick;}catch(_){}delete skip.__goodDogsNativeClick;}
      };
      const finish=(skipped,source)=>{
        if(done)return;done=true;clearTimers();
        window.__goodDogsCutsceneExit={id,skipped:!!skipped,source:source||"unknown",at:Date.now(),currentTime:Number(video.currentTime||0),readyState:Number(video.readyState||0)};
        try{video.pause();video.removeAttribute("src");video.load();}catch(_){}
        frame.classList.remove("gd-playing");root.classList.remove("active");delete root.dataset.activeCutscene;document.body.style.overflow=priorOverflow;
        state[id]={seen:true,skipped:!!skipped,at:Date.now()};window.__goodDogsCutsceneState[id]=state[id];
        if(typeof options.onStateWrite==="function")options.onStateWrite({id,skipped:!!skipped});cleanup();resolve({id,skipped:!!skipped,source:source||"unknown"});
      };
      const armStall=()=>{clearTimeout(stallTimer);stallTimer=setTimeout(()=>{if(!done)finish(true,"media-stall");},3200);};
      const markPlaying=()=>{if(done)return;progressed=true;frame.classList.add("gd-playing");armStall();};
      const isSkipTarget=(target)=>{try{return !!(target&&target.closest&&target.closest(".gd-film-skip"));}catch(_){return false;}};
      const skipEvent=(e)=>{if(done)return;if(!isSkipTarget(e&&e.target)&&e&&e.currentTarget!==skip)return;try{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();}catch(_){}skip.disabled=true;skip.textContent="SKIPPING…";finish(true,e&&e.type||"skip");};
      const rootCapture=(e)=>{if(isSkipTarget(e&&e.target))skipEvent(e);};
      const documentCapture=(e)=>{if(root.classList.contains("active")&&isSkipTarget(e&&e.target))skipEvent(e);};
      const key=(e)=>{if(e.key==="Escape"||e.key==="Enter"||e.key===" ")finish(true,"keyboard");};
      skip.addEventListener("pointerup",skipEvent,{passive:false});skip.addEventListener("touchend",skipEvent,{passive:false});skip.addEventListener("click",skipEvent);
      root.addEventListener("pointerup",rootCapture,true);root.addEventListener("touchend",rootCapture,true);root.addEventListener("click",rootCapture,true);
      document.addEventListener("pointerup",documentCapture,true);document.addEventListener("touchend",documentCapture,true);document.addEventListener("click",documentCapture,true);document.addEventListener("keydown",key);
      try{skip.__goodDogsNativeClick=skip.click.bind(skip);skip.click=function(){finish(true,"programmatic-click");};}catch(_){}
      video.onended=()=>finish(false,"ended");video.onerror=()=>finish(true,"media-error");
      video.onloadeddata=()=>{if(video.videoWidth>0&&video.videoHeight>0){clearTimeout(startTimer);markPlaying();}};
      video.onplaying=()=>{clearTimeout(startTimer);markPlaying();};
      video.ontimeupdate=()=>{const t=Number(video.currentTime||0);if(t>lastTime+.01){lastTime=t;progressed=progressed||t>0;frame.classList.add("gd-playing");armStall();}};
      video.onwaiting=video.onstalled=()=>{if(progressed)armStall();};
      startTimer=setTimeout(()=>{if(!done&&!progressed)finish(true,"no-first-frame");},2600);
      hardTimer=setTimeout(()=>{if(!done)finish(true,"hard-timeout");},45000);
      video.src=options.src||def.src;video.currentTime=0;
      let playPromise;try{playPromise=video.play();}catch(err){window.__goodDogsCutsceneAutoplayBlocked={id,at:Date.now(),error:String(err&&err.message||err)};setTimeout(()=>finish(true,"play-throw"),0);return;}
      if(playPromise&&typeof playPromise.catch==="function")playPromise.catch(err=>{window.__goodDogsCutsceneAutoplayBlocked={id,at:Date.now(),error:String(err&&err.message||err)};setTimeout(()=>finish(true,"play-rejected"),120);});
    });
  }
  window.GoodDogsCutscenes={VERSION:"2.6",play,clips:CLIPS,state:ensureState};
})();
