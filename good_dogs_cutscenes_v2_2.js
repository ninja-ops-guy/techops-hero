/* TechOps Hero — Good Dogs pre-rendered cutscene player
   v2.8: explicit iPhone/iPad playback is blocking and user-visible. A failed
   autoplay/decode/stall may ask for TAP TO PLAY / RETRY, but it may never
   silently mark the authored beat seen and advance into gameplay. Only an
   actual media end or an explicit SKIP exits the cutscene.
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
  function isIOSDevice(){
    try{
      const nav=window.navigator||{},ua=String(nav.userAgent||""),platform=String(nav.platform||"");
      return /iPad|iPhone|iPod/i.test(ua)||(platform==="MacIntel"&&Number(nav.maxTouchPoints||0)>1);
    }catch(_){return false;}
  }
  function recordIOSBypass(id,options,state){
    const at=Date.now(),result={id,skipped:true,source:"ios-nonblocking-bypass"};
    window.__goodDogsCutsceneIOSBypass={id,at,reason:"caller-did-not-request-ios-video"};
    window.__goodDogsCutsceneExit={id,skipped:true,source:result.source,at,currentTime:0,readyState:0};
    state[id]={seen:true,skipped:true,at};window.__goodDogsCutsceneState[id]=state[id];
    if(typeof options.onStateWrite==="function")options.onStateWrite({id,skipped:true});
    return result;
  }
  function makeOverlay(){
    let root=document.getElementById("good-dogs-cutscene-overlay");if(root)return root;
    root=document.createElement("div");root.id="good-dogs-cutscene-overlay";root.setAttribute("role","dialog");root.setAttribute("aria-modal","true");
    root.innerHTML='<div class="gd-film-frame"><div class="gd-film-title">GOOD DOGS PROTOCOL</div><video class="gd-film-video" playsinline webkit-playsinline preload="auto" muted></video><div class="gd-film-status" aria-live="polite">LOADING TRANSMISSION…</div><button class="gd-film-play" type="button">TAP TO PLAY</button><div class="gd-crt" aria-hidden="true"></div><div class="gd-vignette" aria-hidden="true"></div><button class="gd-film-skip" type="button">SKIP</button></div>';
    document.body.appendChild(root);return root;
  }
  const css=document.createElement("style");css.textContent=`
    #good-dogs-cutscene-overlay{position:fixed;inset:0;z-index:150000;background:#010205;display:none;align-items:center;justify-content:center;overscroll-behavior:none;touch-action:manipulation}
    #good-dogs-cutscene-overlay.active{display:flex}.gd-film-frame{position:relative;width:min(100vw,1100px);height:min(100vh,720px);background:radial-gradient(circle at 50% 44%,#0a1720 0,#03070b 46%,#000 100%);border:1px solid #273846;box-shadow:0 0 40px #000;display:flex;align-items:center;justify-content:center;overflow:hidden}
    .gd-film-video{width:100%;height:100%;object-fit:contain;background:#000;image-rendering:auto;filter:contrast(1.035) saturate(.91) brightness(.98)}
    .gd-film-status{position:absolute;left:50%;top:50%;transform:translate(-50%,-72px);z-index:6;color:#9be8cf;font:700 11px/1.4 monospace;letter-spacing:1.2px;text-align:center;white-space:normal;width:min(88vw,560px);pointer-events:none;text-shadow:0 0 12px #6ee7c766}
    .gd-film-frame.gd-playing .gd-film-status{display:none}.gd-film-play{display:none;position:absolute;left:50%;top:50%;transform:translate(-50%,-10%);z-index:10;min-width:180px;min-height:56px;padding:12px 18px;border:1px solid #8df1ce;background:#071019f2;color:#fff;font:700 13px monospace;letter-spacing:.08em;touch-action:manipulation}.gd-film-play.active{display:block}
    .gd-crt{position:absolute;inset:0;pointer-events:none;z-index:2;background:repeating-linear-gradient(0deg,rgba(210,235,230,.018) 0 1px,transparent 1px 4px);opacity:.42}
    .gd-vignette{position:absolute;inset:0;pointer-events:none;z-index:3;box-shadow:inset 0 0 70px rgba(0,0,0,.36),inset 0 0 12px rgba(110,190,170,.035)}
    .gd-film-title{position:absolute;left:12px;top:10px;z-index:4;padding:5px 9px;font:700 11px/1 monospace;letter-spacing:1.5px;color:#9be8cf;background:#071019cc;border:1px solid #294851;pointer-events:none}
    .gd-film-skip{position:absolute;right:12px;top:10px;z-index:11;min-width:72px;min-height:44px;background:#09121bf2;color:#fff;border:1px solid #71879a;padding:8px 12px;font:700 12px monospace;touch-action:manipulation;pointer-events:auto;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent}
    @media(max-width:600px){.gd-film-frame{width:100vw;height:100vh;border:0}.gd-film-title,.gd-film-skip{top:max(8px,env(safe-area-inset-top))}.gd-film-skip{right:max(10px,env(safe-area-inset-right));min-width:86px;min-height:48px}.gd-film-status{font-size:10px}.gd-film-play{min-width:200px;min-height:60px}}
  `;document.head.appendChild(css);
  async function play(id,options={}){
    const def=CLIPS[id];if(!def)throw new Error("Unknown Good Dogs cutscene: "+id);
    const state=ensureState();
    if(isIOSDevice()&&options.allowIOSVideo!==true)return recordIOSBypass(id,options,state);
    const root=makeOverlay(),frame=root.querySelector(".gd-film-frame"),video=root.querySelector(".gd-film-video"),status=root.querySelector(".gd-film-status"),playBtn=root.querySelector(".gd-film-play"),skip=root.querySelector(".gd-film-skip"),priorOverflow=document.body.style.overflow;
    root.classList.add("active");root.dataset.activeCutscene=id;document.body.style.overflow="hidden";
    frame.classList.remove("gd-playing");playBtn.classList.remove("active");if(status)status.textContent="LOADING TRANSMISSION…";
    video.controls=false;video.muted=true;video.defaultMuted=true;video.volume=0;video.setAttribute("muted","");video.setAttribute("playsinline","");video.setAttribute("webkit-playsinline","");skip.disabled=false;skip.textContent="SKIP";
    let done=false,startTimer=0,stallTimer=0,hardTimer=0,lastTime=-1,progressed=false,retryReason="";
    return new Promise((resolve)=>{
      const clearTimers=()=>{clearTimeout(startTimer);clearTimeout(stallTimer);clearTimeout(hardTimer);startTimer=stallTimer=hardTimer=0;};
      const cleanup=()=>{
        clearTimers();video.onended=null;video.onerror=null;video.onloadeddata=null;video.onplaying=null;video.ontimeupdate=null;video.onwaiting=null;video.onstalled=null;
        skip.removeEventListener("pointerup",skipEvent);skip.removeEventListener("touchend",skipEvent);skip.removeEventListener("click",skipEvent);playBtn.removeEventListener("pointerup",playEvent);playBtn.removeEventListener("click",playEvent);
        root.removeEventListener("pointerup",rootCapture,true);root.removeEventListener("touchend",rootCapture,true);root.removeEventListener("click",rootCapture,true);document.removeEventListener("pointerup",documentCapture,true);document.removeEventListener("touchend",documentCapture,true);document.removeEventListener("click",documentCapture,true);document.removeEventListener("keydown",key);
        if(skip.__goodDogsNativeClick){try{skip.click=skip.__goodDogsNativeClick;}catch(_){}delete skip.__goodDogsNativeClick;}
      };
      const finish=(skipped,source)=>{if(done)return;done=true;clearTimers();window.__goodDogsCutsceneExit={id,skipped:!!skipped,source:source||"unknown",at:Date.now(),currentTime:Number(video.currentTime||0),readyState:Number(video.readyState||0)};try{video.pause();video.removeAttribute("src");video.load();}catch(_){}frame.classList.remove("gd-playing");playBtn.classList.remove("active");root.classList.remove("active");delete root.dataset.activeCutscene;document.body.style.overflow=priorOverflow;state[id]={seen:true,skipped:!!skipped,at:Date.now()};window.__goodDogsCutsceneState[id]=state[id];if(typeof options.onStateWrite==="function")options.onStateWrite({id,skipped:!!skipped});cleanup();resolve({id,skipped:!!skipped,source:source||"unknown"});};
      const waitForUser=(reason,label)=>{if(done)return;retryReason=reason||"playback-paused";clearTimeout(startTimer);clearTimeout(stallTimer);clearTimeout(hardTimer);frame.classList.remove("gd-playing");if(status){status.style.display="block";status.textContent=label||"VIDEO PAUSED · TAP TO PLAY";}playBtn.textContent=reason==="media-error"?"RETRY VIDEO":"TAP TO PLAY";playBtn.classList.add("active");window.__goodDogsCutsceneNeedsGesture={id,reason:retryReason,at:Date.now(),currentTime:Number(video.currentTime||0),readyState:Number(video.readyState||0)};};
      const armStall=()=>{clearTimeout(stallTimer);stallTimer=setTimeout(()=>{if(!done)waitForUser("media-stall","TRANSMISSION STALLED · TAP TO RESUME")},3600);};
      const markPlaying=()=>{if(done)return;progressed=true;playBtn.classList.remove("active");if(status)status.style.display="";frame.classList.add("gd-playing");armStall();clearTimeout(hardTimer);hardTimer=setTimeout(()=>{if(!done)waitForUser("hard-timeout","TRANSMISSION PAUSED · TAP TO RESUME")},60000);};
      const attemptPlay=(reset)=>{if(done)return;playBtn.classList.remove("active");if(status){status.style.display="block";status.textContent="LOADING TRANSMISSION…";}if(reset){try{video.pause();video.src=options.src||def.src;video.load();video.currentTime=0;}catch(_){}}let p;try{p=video.play();}catch(err){window.__goodDogsCutsceneAutoplayBlocked={id,at:Date.now(),error:String(err&&err.message||err)};waitForUser("play-throw","TAP TO PLAY TRANSMISSION");return;}if(p&&typeof p.catch==="function")p.catch(err=>{window.__goodDogsCutsceneAutoplayBlocked={id,at:Date.now(),error:String(err&&err.message||err)};waitForUser("play-rejected","TAP TO PLAY TRANSMISSION");});startTimer=setTimeout(()=>{if(!done&&!progressed)waitForUser("no-first-frame","NO VIDEO FRAME YET · TAP TO RETRY")},3200);};
      const isSkipTarget=(target)=>{try{return !!(target&&target.closest&&target.closest(".gd-film-skip"));}catch(_){return false;}};
      const skipEvent=(e)=>{if(done)return;if(!isSkipTarget(e&&e.target)&&e&&e.currentTarget!==skip)return;try{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();}catch(_){}skip.disabled=true;skip.textContent="SKIPPING…";finish(true,e&&e.type||"skip");};
      const playEvent=(e)=>{if(done)return;try{e.preventDefault();e.stopPropagation();}catch(_){}progressed=false;attemptPlay(retryReason==="media-error"||retryReason==="no-first-frame");};
      const rootCapture=(e)=>{if(isSkipTarget(e&&e.target))skipEvent(e);};const documentCapture=(e)=>{if(root.classList.contains("active")&&isSkipTarget(e&&e.target))skipEvent(e);};const key=(e)=>{if(e.key==="Escape")finish(true,"keyboard-skip");};
      skip.addEventListener("pointerup",skipEvent,{passive:false});skip.addEventListener("touchend",skipEvent,{passive:false});skip.addEventListener("click",skipEvent);playBtn.addEventListener("pointerup",playEvent,{passive:false});playBtn.addEventListener("click",playEvent);
      root.addEventListener("pointerup",rootCapture,true);root.addEventListener("touchend",rootCapture,true);root.addEventListener("click",rootCapture,true);document.addEventListener("pointerup",documentCapture,true);document.addEventListener("touchend",documentCapture,true);document.addEventListener("click",documentCapture,true);document.addEventListener("keydown",key);
      try{skip.__goodDogsNativeClick=skip.click.bind(skip);skip.click=function(){finish(true,"programmatic-click");};}catch(_){}
      video.onended=()=>finish(false,"ended");video.onerror=()=>waitForUser("media-error","VIDEO UNAVAILABLE · RETRY OR SKIP");video.onloadeddata=()=>{if(video.videoWidth>0&&video.videoHeight>0){clearTimeout(startTimer);markPlaying();}};video.onplaying=()=>{clearTimeout(startTimer);markPlaying();};video.ontimeupdate=()=>{const t=Number(video.currentTime||0);if(t>lastTime+.01){lastTime=t;progressed=progressed||t>0;markPlaying();}};video.onwaiting=video.onstalled=()=>{if(progressed)armStall();};
      video.src=options.src||def.src;try{video.load();}catch(_){}attemptPlay(false);
    });
  }
  window.GoodDogsCutscenes={VERSION:"2.8",play,clips:CLIPS,state:ensureState,isIOSDevice};
})();