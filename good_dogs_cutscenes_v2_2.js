/* TechOps Hero — Good Dogs pre-rendered cutscene player
   v2.4: silent source-detail presentation, non-destructive retro treatment,
   and state migration across the title-screen -> campaign handoff.
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
  function makeOverlay(){let root=document.getElementById("good-dogs-cutscene-overlay");if(root)return root;root=document.createElement("div");root.id="good-dogs-cutscene-overlay";root.setAttribute("role","dialog");root.setAttribute("aria-modal","true");root.innerHTML='<div class="gd-film-frame"><div class="gd-film-title">GOOD DOGS PROTOCOL</div><video class="gd-film-video" playsinline webkit-playsinline preload="auto" muted></video><div class="gd-crt" aria-hidden="true"></div><div class="gd-vignette" aria-hidden="true"></div><button class="gd-film-skip" type="button">SKIP</button></div>';document.body.appendChild(root);return root;}
  const css=document.createElement("style");css.textContent=`
    #good-dogs-cutscene-overlay{position:fixed;inset:0;z-index:150000;background:#010205;display:none;align-items:center;justify-content:center;overscroll-behavior:none;touch-action:manipulation}
    #good-dogs-cutscene-overlay.active{display:flex}.gd-film-frame{position:relative;width:min(100vw,1100px);height:min(100vh,720px);background:#000;border:1px solid #273846;box-shadow:0 0 40px #000;display:flex;align-items:center;justify-content:center;overflow:hidden}
    .gd-film-video{width:100%;height:100%;object-fit:contain;background:#000;image-rendering:auto;filter:contrast(1.035) saturate(.91) brightness(.98)}
    .gd-crt{position:absolute;inset:0;pointer-events:none;z-index:2;background:repeating-linear-gradient(0deg,rgba(210,235,230,.018) 0 1px,transparent 1px 4px);opacity:.42}
    .gd-vignette{position:absolute;inset:0;pointer-events:none;z-index:3;box-shadow:inset 0 0 70px rgba(0,0,0,.36),inset 0 0 12px rgba(110,190,170,.035)}
    .gd-film-title{position:absolute;left:12px;top:10px;z-index:4;padding:5px 9px;font:700 11px/1 monospace;letter-spacing:1.5px;color:#9be8cf;background:#071019cc;border:1px solid #294851;pointer-events:none}.gd-film-skip{position:absolute;right:12px;top:10px;z-index:5;background:#09121bcc;color:#fff;border:1px solid #536779;padding:8px 12px;font:700 12px monospace;touch-action:manipulation}
    @media(max-width:600px){.gd-film-frame{width:100vw;height:100vh;border:0}.gd-film-title,.gd-film-skip{top:max(8px,env(safe-area-inset-top))}}
  `;document.head.appendChild(css);
  async function play(id,options={}){const def=CLIPS[id];if(!def)throw new Error("Unknown Good Dogs cutscene: "+id);const root=makeOverlay(),video=root.querySelector(".gd-film-video"),skip=root.querySelector(".gd-film-skip"),state=ensureState(),priorOverflow=document.body.style.overflow;root.classList.add("active");document.body.style.overflow="hidden";video.controls=false;video.muted=true;video.defaultMuted=true;video.volume=0;video.setAttribute("muted","");video.removeAttribute("autoplay");let done=false;return new Promise((resolve)=>{const finish=(skipped)=>{if(done)return;done=true;try{video.pause();video.removeAttribute("src");video.load();}catch(_){}root.classList.remove("active");document.body.style.overflow=priorOverflow;state[id]={seen:true,skipped:!!skipped,at:Date.now()};window.__goodDogsCutsceneState[id]=state[id];if(typeof options.onStateWrite==="function")options.onStateWrite({id,skipped:!!skipped});cleanup();resolve({id,skipped:!!skipped});};const cleanup=()=>{video.onended=null;video.onerror=null;skip.onclick=null;document.removeEventListener("keydown",key);};const key=(e)=>{if(e.key==="Escape"||e.key==="Enter")finish(true);};skip.onclick=()=>finish(true);video.onended=()=>finish(false);video.onerror=()=>finish(true);document.addEventListener("keydown",key);video.src=options.src||def.src;video.currentTime=0;video.play().catch(()=>{video.controls=true;});});}
  window.GoodDogsCutscenes={VERSION:"2.4",play,clips:CLIPS,state:ensureState};
})();
