/* TechOps Hero — Good Dogs pre-rendered cutscene player v2.9.
 * Defensive contract:
 *   COMPLETED    = media reached ended
 *   USER_SKIPPED = player explicitly requested skip
 * Playback/decode/autoplay failures NEVER satisfy progression. They remain on
 * screen in a retry state until the player retries or explicitly skips.
 * iPhone/iPad uses the exact same contract; there is no silent iOS bypass.
 */
(function(){
  "use strict";
  const CLIPS={
    GD_CUT_01:{src:"assets/cutscenes/good_dogs/01_signal_beyond_earth_pixel.mp4"},
    GD_CUT_02:{src:"assets/cutscenes/good_dogs/02_signal_pull_transition_pixel.mp4"},
    GD_CUT_03:{src:"assets/cutscenes/good_dogs/03_orbital_approach_pixel.mp4"},
    GD_CUT_04:{src:"assets/cutscenes/good_dogs/04_cell118_triple_jump_to_terminal_pixel.mp4"},
    GD_CUT_05:{src:"assets/cutscenes/good_dogs/05_cell118_approach_k_reveal_pixel.mp4"},
    GD_CUT_06:{src:"assets/cutscenes/good_dogs/06_k_freed_prison_escort_pixel.mp4"},
    GD_CUT_07:{src:"assets/cutscenes/good_dogs/07_cell1984_hack_pixel.mp4"},
    GD_CUT_08:{src:"assets/cutscenes/good_dogs/08_team_reunited_exit_pixel.mp4"}
  };
  const STATUS=Object.freeze({COMPLETED:"COMPLETED",USER_SKIPPED:"USER_SKIPPED"});
  function ensureState(){
    window.__goodDogsCutsceneState=window.__goodDogsCutsceneState||{};
    if(window.S){S.meta=S.meta||{};S.meta.goodDogsCutscenes=S.meta.goodDogsCutscenes||{};const dst=S.meta.goodDogsCutscenes,src=window.__goodDogsCutsceneState;Object.keys(src).forEach(id=>{if(!dst[id])dst[id]=src[id];});return dst;}
    return window.__goodDogsCutsceneState;
  }
  function isIOSDevice(){try{const nav=window.navigator||{},ua=String(nav.userAgent||""),platform=String(nav.platform||"");return /iPad|iPhone|iPod/i.test(ua)||(platform==="MacIntel"&&Number(nav.maxTouchPoints||0)>1);}catch(_){return false;}}
  function makeOverlay(){
    let root=document.getElementById("good-dogs-cutscene-overlay");if(root)return root;
    root=document.createElement("div");root.id="good-dogs-cutscene-overlay";root.setAttribute("role","dialog");root.setAttribute("aria-modal","true");
    root.innerHTML='<div class="gd-film-frame"><div class="gd-film-title">GOOD DOGS PROTOCOL</div><video class="gd-film-video" playsinline webkit-playsinline preload="auto" muted></video><div class="gd-film-status" aria-live="polite">LOADING TRANSMISSION…</div><button class="gd-film-play" type="button">TAP TO PLAY</button><div class="gd-crt" aria-hidden="true"></div><div class="gd-vignette" aria-hidden="true"></div><button class="gd-film-skip" type="button">SKIP</button></div>';
    document.body.appendChild(root);return root;
  }
  const css=document.createElement("style");css.textContent=`
    #good-dogs-cutscene-overlay{position:fixed;inset:0;z-index:150000;background:#010205;display:none;align-items:center;justify-content:center;overscroll-behavior:none;touch-action:manipulation}
    #good-dogs-cutscene-overlay.active{display:flex}.gd-film-frame{position:relative;width:min(100vw,1100px);height:min(100vh,720px);background:#000;border:1px solid #273846;box-shadow:0 0 40px #000;display:flex;align-items:center;justify-content:center;overflow:hidden}
    .gd-film-video{width:100%;height:100%;object-fit:contain;background:#000}.gd-film-status{position:absolute;left:50%;top:50%;transform:translate(-50%,-72px);z-index:6;color:#9be8cf;font:700 11px/1.4 monospace;letter-spacing:1.2px;text-align:center;width:min(88vw,560px);pointer-events:none;text-shadow:0 0 12px #6ee7c766}.gd-film-frame.gd-playing .gd-film-status{display:none}
    .gd-film-play{display:none;position:absolute;left:50%;top:50%;transform:translate(-50%,-10%);z-index:10;min-width:200px;min-height:58px;padding:12px 18px;border:1px solid #8df1ce;background:#071019f2;color:#fff;font:700 13px monospace;letter-spacing:.08em;touch-action:manipulation}.gd-film-play.active{display:block}
    .gd-crt{position:absolute;inset:0;pointer-events:none;z-index:2;background:repeating-linear-gradient(0deg,rgba(210,235,230,.018) 0 1px,transparent 1px 4px);opacity:.42}.gd-vignette{position:absolute;inset:0;pointer-events:none;z-index:3;box-shadow:inset 0 0 70px rgba(0,0,0,.36)}
    .gd-film-title{position:absolute;left:12px;top:10px;z-index:4;padding:5px 9px;font:700 11px monospace;letter-spacing:1.5px;color:#9be8cf;background:#071019cc;border:1px solid #294851;pointer-events:none}.gd-film-skip{position:absolute;right:12px;top:10px;z-index:11;min-width:86px;min-height:48px;background:#09121bf2;color:#fff;border:1px solid #71879a;padding:8px 12px;font:700 12px monospace;touch-action:manipulation}
    @media(max-width:600px){.gd-film-frame{width:100vw;height:100vh;border:0}.gd-film-title,.gd-film-skip{top:max(8px,env(safe-area-inset-top))}.gd-film-skip{right:max(10px,env(safe-area-inset-right))}.gd-film-status{font-size:10px}}
  `;document.head.appendChild(css);
  async function play(id,options={}){
    const def=CLIPS[id];if(!def)throw new Error("Unknown Good Dogs cutscene: "+id);
    const state=ensureState(),root=makeOverlay(),frame=root.querySelector(".gd-film-frame"),video=root.querySelector(".gd-film-video"),status=root.querySelector(".gd-film-status"),playBtn=root.querySelector(".gd-film-play"),skip=root.querySelector(".gd-film-skip"),priorOverflow=document.body.style.overflow;
    root.classList.add("active");root.dataset.activeCutscene=id;document.body.style.overflow="hidden";frame.classList.remove("gd-playing");playBtn.classList.remove("active");status.textContent="LOADING TRANSMISSION…";status.style.display="block";
    video.controls=false;video.muted=true;video.defaultMuted=true;video.volume=0;video.setAttribute("muted","");video.setAttribute("playsinline","");video.setAttribute("webkit-playsinline","");skip.disabled=false;skip.textContent="SKIP";
    let done=false,startTimer=0,stallTimer=0,hardTimer=0,lastTime=-1,progressed=false,retryReason="";
    return new Promise(resolve=>{
      const clearTimers=()=>{clearTimeout(startTimer);clearTimeout(stallTimer);clearTimeout(hardTimer);startTimer=stallTimer=hardTimer=0;};
      const cleanup=()=>{clearTimers();video.onended=null;video.onerror=null;video.onloadeddata=null;video.onplaying=null;video.ontimeupdate=null;video.onwaiting=null;video.onstalled=null;skip.removeEventListener("pointerup",skipEvent);skip.removeEventListener("click",skipEvent);playBtn.removeEventListener("pointerup",playEvent);playBtn.removeEventListener("click",playEvent);document.removeEventListener("keydown",key);};
      const finish=(resultStatus,source)=>{if(done)return;done=true;clearTimers();const skipped=resultStatus===STATUS.USER_SKIPPED,at=Date.now();window.__goodDogsCutsceneExit={id,status:resultStatus,skipped,source,at,currentTime:Number(video.currentTime||0),readyState:Number(video.readyState||0)};try{video.pause();video.removeAttribute("src");video.load();}catch(_){}frame.classList.remove("gd-playing");playBtn.classList.remove("active");root.classList.remove("active");delete root.dataset.activeCutscene;document.body.style.overflow=priorOverflow;state[id]={seen:true,status:resultStatus,skipped,at};window.__goodDogsCutsceneState[id]=state[id];if(typeof options.onStateWrite==="function")options.onStateWrite({id,status:resultStatus,skipped});cleanup();resolve({id,status:resultStatus,skipped,source});};
      const waitForUser=(reason,label)=>{if(done)return;retryReason=reason;clearTimers();frame.classList.remove("gd-playing");status.style.display="block";status.textContent=label;playBtn.textContent=reason==="media-error"?"RETRY VIDEO":"TAP TO PLAY";playBtn.classList.add("active");window.__goodDogsCutsceneNeedsGesture={id,reason,at:Date.now(),currentTime:Number(video.currentTime||0),readyState:Number(video.readyState||0)};};
      const armStall=()=>{clearTimeout(stallTimer);stallTimer=setTimeout(()=>waitForUser("media-stall","TRANSMISSION STALLED · TAP TO RESUME"),3600);};
      const markPlaying=()=>{if(done)return;progressed=true;playBtn.classList.remove("active");status.style.display="";frame.classList.add("gd-playing");armStall();clearTimeout(hardTimer);hardTimer=setTimeout(()=>waitForUser("hard-timeout","TRANSMISSION PAUSED · TAP TO RESUME"),60000);};
      const attemptPlay=(reset)=>{if(done)return;playBtn.classList.remove("active");status.style.display="block";status.textContent="LOADING TRANSMISSION…";if(reset){try{video.pause();video.src=options.src||def.src;video.load();video.currentTime=0;}catch(_){}}let p;try{p=video.play();}catch(err){window.__goodDogsCutsceneAutoplayBlocked={id,at:Date.now(),error:String(err&&err.message||err)};waitForUser("play-throw","TAP TO PLAY TRANSMISSION");return;}if(p&&typeof p.catch==="function")p.catch(err=>{window.__goodDogsCutsceneAutoplayBlocked={id,at:Date.now(),error:String(err&&err.message||err)};waitForUser("play-rejected","TAP TO PLAY TRANSMISSION");});clearTimeout(startTimer);startTimer=setTimeout(()=>{if(!done&&!progressed)waitForUser("no-first-frame","NO VIDEO FRAME YET · TAP TO RETRY")},3200);};
      const skipEvent=e=>{if(done)return;try{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();}catch(_){}skip.disabled=true;skip.textContent="SKIPPING…";finish(STATUS.USER_SKIPPED,e&&e.type||"skip");};
      const playEvent=e=>{if(done)return;try{e.preventDefault();e.stopPropagation();}catch(_){}progressed=false;attemptPlay(retryReason==="media-error"||retryReason==="no-first-frame");};
      const key=e=>{if(e.key==="Escape")finish(STATUS.USER_SKIPPED,"keyboard-skip");};
      skip.addEventListener("pointerup",skipEvent,{passive:false});skip.addEventListener("click",skipEvent);playBtn.addEventListener("pointerup",playEvent,{passive:false});playBtn.addEventListener("click",playEvent);document.addEventListener("keydown",key);
      video.onended=()=>finish(STATUS.COMPLETED,"ended");video.onerror=()=>waitForUser("media-error","VIDEO UNAVAILABLE · RETRY OR SKIP");video.onloadeddata=()=>{if(video.videoWidth>0&&video.videoHeight>0){clearTimeout(startTimer);markPlaying();}};video.onplaying=()=>{clearTimeout(startTimer);markPlaying();};video.ontimeupdate=()=>{const t=Number(video.currentTime||0);if(t>lastTime+.01){lastTime=t;progressed=progressed||t>0;markPlaying();}};video.onwaiting=video.onstalled=()=>{if(progressed)armStall();};
      video.src=options.src||def.src;try{video.load();}catch(_){}attemptPlay(false);
    });
  }
  window.GoodDogsCutscenes={VERSION:"2.9",STATUS,play,clips:CLIPS,state:ensureState,isIOSDevice};
})();