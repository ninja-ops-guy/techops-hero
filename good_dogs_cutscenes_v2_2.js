/* TechOps Hero — Good Dogs pre-rendered cutscene player
   v2.2 pixel media integration. Drop in after core state scripts.
*/
(function(){
  "use strict";
  const CLIPS = {
    GD_CUT_01:{src:"assets/cutscenes/good_dogs/01_signal_beyond_earth_pixel.mp4"},
    GD_CUT_02:{src:"assets/cutscenes/good_dogs/02_signal_pull_transition_pixel.mp4"},
    GD_CUT_03:{src:"assets/cutscenes/good_dogs/03_orbital_approach_pixel.mp4"},
    GD_CUT_04:{src:"assets/cutscenes/good_dogs/04_cell118_triple_jump_to_terminal_pixel.mp4"},
    GD_CUT_05:{src:"assets/cutscenes/good_dogs/05_cell118_approach_k_reveal_pixel.mp4"},
    GD_CUT_06:{src:"assets/cutscenes/good_dogs/06_k_freed_prison_escort_pixel.mp4"},
    GD_CUT_07:{src:"assets/cutscenes/good_dogs/07_cell1984_hack_pixel.mp4"},
    GD_CUT_08:{src:"assets/cutscenes/good_dogs/08_team_reunited_exit_pixel.mp4"}
  };

  function ensureState(){
    if (window.S) {
      S.meta = S.meta || {};
      S.meta.goodDogsCutscenes = S.meta.goodDogsCutscenes || {};
      return S.meta.goodDogsCutscenes;
    }
    window.__goodDogsCutsceneState = window.__goodDogsCutsceneState || {};
    return window.__goodDogsCutsceneState;
  }

  function makeOverlay(){
    let root=document.getElementById("good-dogs-cutscene-overlay");
    if(root) return root;
    root=document.createElement("div");
    root.id="good-dogs-cutscene-overlay";
    root.setAttribute("role","dialog");
    root.setAttribute("aria-modal","true");
    root.setAttribute("aria-label","Good Dogs Protocol cutscene");
    root.innerHTML=`
      <div class="gd-film-frame">
        <div class="gd-film-title">GOOD DOGS PROTOCOL</div>
        <video class="gd-film-video" playsinline webkit-playsinline preload="auto"></video>
        <button class="gd-film-skip" type="button">SKIP</button>
      </div>`;
    document.body.appendChild(root);
    return root;
  }

  const css=document.createElement("style");
  css.textContent=`
    #good-dogs-cutscene-overlay{position:fixed;inset:0;z-index:150000;background:#02050a;
      display:none;align-items:center;justify-content:center;overscroll-behavior:none;touch-action:manipulation}
    #good-dogs-cutscene-overlay.active{display:flex}
    .gd-film-frame{position:relative;width:min(100vw,1100px);height:min(100vh,720px);
      background:#050911;border:2px solid #263848;box-shadow:0 0 0 3px #070b10,0 0 32px #6724a955;
      display:flex;align-items:center;justify-content:center;overflow:hidden}
    .gd-film-video{width:100%;height:100%;object-fit:contain;background:#000}
    .gd-film-title{position:absolute;left:12px;top:10px;z-index:2;padding:5px 9px;
      font:700 12px/1 monospace;letter-spacing:1px;color:#8df1ce;background:#071019dd;
      border:1px solid #234c57;pointer-events:none}
    .gd-film-skip{position:absolute;right:12px;top:10px;z-index:3;background:#09121bdd;color:#fff;
      border:1px solid #6d3ca4;padding:8px 12px;font:700 12px monospace;touch-action:manipulation}
    @media(max-width:600px){.gd-film-frame{width:100vw;height:100vh;border:0}.gd-film-title{top:8px}.gd-film-skip{top:8px}}
  `;
  document.head.appendChild(css);

  async function play(id, options={}){
    const def=CLIPS[id];
    if(!def) throw new Error("Unknown Good Dogs cutscene: "+id);
    const root=makeOverlay(), video=root.querySelector(".gd-film-video"), skip=root.querySelector(".gd-film-skip");
    const state=ensureState();
    const priorOverflow=document.body.style.overflow;
    root.classList.add("active"); document.body.style.overflow="hidden";
    video.controls=false;
    video.setAttribute("playsinline","");
    video.setAttribute("webkit-playsinline","");
    let done=false;
    return new Promise((resolve)=>{
      const finish=(skipped)=>{
        if(done) return; done=true;
        try{ video.pause(); video.removeAttribute("src"); video.load(); }catch(_){}
        root.classList.remove("active"); document.body.style.overflow=priorOverflow;
        state[id]={seen:true,skipped:!!skipped,at:Date.now()};
        if(typeof options.onStateWrite==="function") options.onStateWrite({id,skipped:!!skipped});
        cleanup(); resolve({id,skipped:!!skipped});
      };
      const cleanup=()=>{
        video.onended=null; video.onerror=null; skip.onclick=null;
        document.removeEventListener("keydown",key);
      };
      const key=(e)=>{ if(e.key==="Escape"||e.key==="Enter") finish(true); };
      skip.onclick=()=>finish(true);
      video.onended=()=>finish(false);
      video.onerror=()=>finish(true); // never soft-lock campaign on failed media.
      document.addEventListener("keydown",key);
      video.src=options.src||def.src;
      video.currentTime=0;
      video.play().catch(()=>{ video.controls=true; });
    });
  }

  window.GoodDogsCutscenes={play, clips:CLIPS, state:ensureState};
})();