/* TechOps Hero — Good Dogs pre-rendered cutscene player v3.1.
 * Production playback contract:
 *   - attempt muted + playsInline autoplay on every device, including iPhone
 *   - only expose the PLAY button when the browser actually rejects/stalls
 *   - never expose a black video surface while media is preparing
 *   - reveal video only after a decoded frame is available
 *   - autoplay/decode/stall failures never satisfy progression
 *   - only COMPLETED or USER_SKIPPED may advance campaign state
 */
(function(){
  "use strict";
  const BASE="assets/cutscenes/good_dogs/";
  const PLATE="assets/v742/cutscenes/";
  const CLIPS={
    GD_CUT_01:{src:BASE+"01_signal_beyond_earth_pixel.mp4",poster:PLATE+"hidden_bay.png"},
    GD_CUT_02:{src:BASE+"02_signal_pull_transition_pixel.mp4",poster:PLATE+"secret_ship_interior.png"},
    GD_CUT_03:{src:BASE+"03_orbital_approach_pixel.mp4",poster:PLATE+"orbital_approach.png"},
    GD_CUT_04:{src:BASE+"04_cell118_triple_jump_to_terminal_pixel.mp4",poster:PLATE+"cell_118.png"},
    GD_CUT_05:{src:BASE+"05_cell118_approach_k_reveal_pixel.mp4",poster:PLATE+"cell_118.png"},
    GD_CUT_06:{src:BASE+"06_k_freed_prison_escort_pixel.mp4",poster:PLATE+"access_core.png"},
    GD_CUT_07:{src:BASE+"07_cell1984_hack_pixel.mp4",poster:PLATE+"cell_1984.png"},
    GD_CUT_08:{src:BASE+"08_team_reunited_exit_pixel.mp4",poster:PLATE+"warden_shuttle_bay.png"}
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
    root.innerHTML='<div class="gd-film-frame"><div class="gd-film-poster" aria-hidden="true"></div><div class="gd-film-title">GOOD DOGS PROTOCOL</div><video class="gd-film-video" playsinline webkit-playsinline preload="auto" muted></video><div class="gd-film-status" aria-live="polite">PREPARING TRANSMISSION…</div><button class="gd-film-play" type="button">PLAY CUTSCENE</button><div class="gd-crt" aria-hidden="true"></div><div class="gd-vignette" aria-hidden="true"></div><button class="gd-film-skip" type="button">SKIP</button></div>';
    document.body.appendChild(root);return root;
  }
  const css=document.createElement("style");css.textContent=`
    #good-dogs-cutscene-overlay{position:fixed;inset:0;z-index:150000;background:#010205;display:none;align-items:center;justify-content:center;overscroll-behavior:none;touch-action:manipulation}
    #good-dogs-cutscene-overlay.active{display:flex}.gd-film-frame{position:relative;width:min(100vw,1100px);height:min(100vh,720px);background:linear-gradient(180deg,#07111c,#010205);border:1px solid #273846;box-shadow:0 0 40px #000;display:flex;align-items:center;justify-content:center;overflow:hidden}
    .gd-film-poster{position:absolute;inset:0;z-index:0;background-position:center;background-repeat:no-repeat;background-size:contain;opacity:1;transition:opacity .12s linear}.gd-film-frame.gd-frame-ready .gd-film-poster{opacity:0}
    .gd-film-video{position:absolute;inset:0;z-index:1;width:100%;height:100%;object-fit:contain;background:transparent;opacity:0;visibility:hidden}.gd-film-frame.gd-frame-ready .gd-film-video{opacity:1;visibility:visible}
    .gd-film-status{position:absolute;left:50%;top:50%;transform:translate(-50%,-72px);z-index:6;color:#9be8cf;font:700 11px/1.4 monospace;letter-spacing:1.2px;text-align:center;width:min(88vw,560px);pointer-events:none;text-shadow:0 0 12px #6ee7c766}.gd-film-frame.gd-playing .gd-film-status{display:none}
    .gd-film-play{display:none;position:absolute;left:50%;top:50%;transform:translate(-50%,-10%);z-index:10;min-width:210px;min-height:58px;padding:12px 18px;border:1px solid #8df1ce;background:#071019f2;color:#fff;font:700 13px monospace;letter-spacing:.08em;touch-action:manipulation}.gd-film-play.active{display:block}
    .gd-crt{position:absolute;inset:0;pointer-events:none;z-index:2;background:repeating-linear-gradient(0deg,rgba(210,235,230,.018) 0 1px,transparent 1px 4px);opacity:.42}.gd-vignette{position:absolute;inset:0;pointer-events:none;z-index:3;box-shadow:inset 0 0 70px rgba(0,0,0,.36)}
    .gd-film-title{position:absolute;left:12px;top:10px;z-index:4;padding:5px 9px;font:700 11px monospace;letter-spacing:1.5px;color:#9be8cf;background:#071019cc;border:1px solid #294851;pointer-events:none}.gd-film-skip{position:absolute;right:12px;top:10px;z-index:11;min-width:86px;min-height:48px;background:#09121bf2;color:#fff;border:1px solid #71879a;padding:8px 12px;font:700 12px monospace;touch-action:manipulation}
    @media(max-width:600px){.gd-film-frame{width:100vw;height:100vh;border:0}.gd-film-title,.gd-film-skip{top:max(8px,env(safe-area-inset-top))}.gd-film-skip{right:max(10px,env(safe-area-inset-right))}.gd-film-status{font-size:10px}}
  `;document.head.appendChild(css);
  async function play(id,options={}){
    const def=CLIPS[id];if(!def)throw new Error("Unknown Good Dogs cutscene: "+id);
    const state=ensureState(),root=makeOverlay(),frame=root.querySelector(".gd-film-frame"),poster=root.querySelector(".gd-film-poster"),video=root.querySelector(".gd-film-video"),status=root.querySelector(".gd-film-status"),playBtn=root.querySelector(".gd-film-play"),skip=root.querySelector(".gd-film-skip"),priorOverflow=document.body.style.overflow,ios=isIOSDevice(),autoRequested=options.autoplay!==false;
    root.classList.add("active");root.dataset.activeCutscene=id;document.body.style.overflow="hidden";frame.classList.remove("gd-playing","gd-frame-ready");poster.style.backgroundImage='url("'+(options.poster||def.poster)+'")';playBtn.classList.remove("active");status.textContent="PREPARING TRANSMISSION…";status.style.display="block";
    video.controls=false;video.muted=true;video.defaultMuted=true;video.volume=0;video.setAttribute("muted","");video.setAttribute("playsinline","");video.setAttribute("webkit-playsinline","");video.preload="auto";skip.disabled=false;skip.textContent="SKIP";
    let done=false,startTimer=0,stallTimer=0,hardTimer=0,lastTime=-1,progressed=false,retryReason="",playInFlight=false,frameRevealed=false,autoAttempted=false;
    return new Promise(resolve=>{
      const clearTimers=()=>{clearTimeout(startTimer);clearTimeout(stallTimer);clearTimeout(hardTimer);startTimer=stallTimer=hardTimer=0;};
      const cleanup=()=>{clearTimers();video.onended=null;video.onerror=null;video.onloadedmetadata=null;video.onloadeddata=null;video.oncanplay=null;video.onplaying=null;video.ontimeupdate=null;video.onwaiting=null;video.onstalled=null;skip.removeEventListener("click",skipEvent);playBtn.removeEventListener("click",playEvent);document.removeEventListener("keydown",key);};
      const finish=(resultStatus,source)=>{if(done)return;done=true;clearTimers();const skipped=resultStatus===STATUS.USER_SKIPPED,at=Date.now();window.__goodDogsCutsceneExit={id,status:resultStatus,skipped,source,at,currentTime:Number(video.currentTime||0),readyState:Number(video.readyState||0),ios};try{video.pause();video.removeAttribute("src");video.load();}catch(_){}frame.classList.remove("gd-playing","gd-frame-ready");playBtn.classList.remove("active");root.classList.remove("active");delete root.dataset.activeCutscene;document.body.style.overflow=priorOverflow;state[id]={seen:true,status:resultStatus,skipped,at};window.__goodDogsCutsceneState[id]=state[id];if(typeof options.onStateWrite==="function")options.onStateWrite({id,status:resultStatus,skipped});cleanup();resolve({id,status:resultStatus,skipped,source});};
      const waitForUser=(reason,label)=>{if(done)return;retryReason=reason;playInFlight=false;clearTimers();frame.classList.remove("gd-playing");status.style.display="block";status.textContent=label;playBtn.textContent=reason==="media-error"?"RETRY VIDEO":"PLAY CUTSCENE";playBtn.classList.add("active");window.__goodDogsCutsceneNeedsGesture={id,reason,at:Date.now(),currentTime:Number(video.currentTime||0),readyState:Number(video.readyState||0),ios};};
      const revealFrame=()=>{if(done||frameRevealed)return;frameRevealed=true;frame.classList.add("gd-frame-ready");};
      const requestDecodedFrame=()=>{if(done||frameRevealed)return;if(typeof video.requestVideoFrameCallback==="function"){try{video.requestVideoFrameCallback(()=>revealFrame());return;}catch(_){}}if(Number(video.readyState||0)>=2&&Number(video.currentTime||0)>.02)revealFrame();};
      const armStall=()=>{clearTimeout(stallTimer);stallTimer=setTimeout(()=>waitForUser("media-stall","TRANSMISSION STALLED · PLAY TO RESUME"),4200);};
      const markPlaying=()=>{if(done)return;progressed=true;playInFlight=false;playBtn.classList.remove("active");status.style.display="";frame.classList.add("gd-playing");requestDecodedFrame();armStall();clearTimeout(hardTimer);hardTimer=setTimeout(()=>waitForUser("hard-timeout","TRANSMISSION PAUSED · PLAY TO RESUME"),60000);};
      const attemptPlay=()=>{if(done||playInFlight)return;playInFlight=true;playBtn.classList.remove("active");status.style.display="block";status.textContent="STARTING TRANSMISSION…";let p;try{p=video.play();}catch(err){window.__goodDogsCutsceneAutoplayBlocked={id,at:Date.now(),error:String(err&&err.message||err),ios};waitForUser("play-throw","PLAY CUTSCENE");return;}if(p&&typeof p.then==="function")p.then(()=>{playInFlight=false;requestDecodedFrame();}).catch(err=>{window.__goodDogsCutsceneAutoplayBlocked={id,at:Date.now(),error:String(err&&err.message||err),ios};waitForUser("play-rejected","PLAY CUTSCENE");});clearTimeout(startTimer);startTimer=setTimeout(()=>{if(!done&&!progressed)waitForUser("no-first-frame","VIDEO READY · PLAY CUTSCENE")},4200);};
      const attemptAutoplay=()=>{if(done||!autoRequested||autoAttempted)return;autoAttempted=true;window.__goodDogsCutsceneAutoplay={id,requested:true,ios,muted:true,playsInline:true,at:Date.now()};attemptPlay();};
      const skipEvent=e=>{if(done)return;try{e.preventDefault();e.stopPropagation();}catch(_){}skip.disabled=true;skip.textContent="SKIPPING…";finish(STATUS.USER_SKIPPED,"click-skip");};
      const playEvent=e=>{if(done)return;try{e.preventDefault();e.stopPropagation();}catch(_){}progressed=false;if(retryReason==="media-error"){try{video.pause();video.src=options.src||def.src;video.load();}catch(_){}}attemptPlay();};
      const key=e=>{if(e.key==="Escape")finish(STATUS.USER_SKIPPED,"keyboard-skip");};
      skip.addEventListener("click",skipEvent);playBtn.addEventListener("click",playEvent);document.addEventListener("keydown",key);
      video.onended=()=>finish(STATUS.COMPLETED,"ended");video.onerror=()=>waitForUser("media-error","VIDEO UNAVAILABLE · RETRY OR SKIP");video.onloadedmetadata=attemptAutoplay;video.onloadeddata=attemptAutoplay;video.oncanplay=attemptAutoplay;video.onplaying=()=>{clearTimeout(startTimer);markPlaying();};video.ontimeupdate=()=>{const t=Number(video.currentTime||0);if(t>lastTime+.01){lastTime=t;if(t>.02){progressed=true;requestDecodedFrame();markPlaying();}}};video.onwaiting=video.onstalled=()=>{if(progressed)armStall();};
      video.src=options.src||def.src;try{video.load();}catch(_){}
      if(autoRequested){startTimer=setTimeout(()=>{if(!done&&!progressed&&!playInFlight&&!autoAttempted)waitForUser("autoplay-timeout","VIDEO READY · PLAY CUTSCENE")},3000);}else waitForUser("autoplay-disabled","VIDEO READY · PLAY CUTSCENE");
    });
  }
  window.GoodDogsCutscenes={VERSION:"3.1",STATUS,play,clips:CLIPS,state:ensureState,isIOSDevice};
})();
