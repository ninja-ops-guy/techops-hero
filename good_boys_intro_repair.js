/* TechOps Hero — Good Boys intro repair v2
 * Repairs the pre-campaign four-card opening on mobile without changing the
 * canonical campaign/progression authority. The legacy director is bypassed
 * via its documented data-gbd-bypass hook; the familiar cinematic DOM id is
 * retained so existing runtime QA still treats this as an authored blocker.
 */
(function(root){
  "use strict";
  if(!root||root.TechOpsGoodBoysIntroRepair)return;

  var VERSION=2;
  var active=false,index=0,launching=false,advancing=false,watchdog=null;
  var overlay=null,style=null,dialogLock=null;
  var SCENES=[
    {k:"goodboys_home",t:"WALDO'S PLACE",p:"The porch lights are on. The grill is cold. The dish is tracking something overhead — but Waldo is gone. Katrin and Manchez pick up his trail in the yard.",g:"SEARCH THE PROPERTY · FOLLOW WALDO'S TRAIL"},
    {k:"goodboys_home",t:"THE GARAGE WALL",p:"The trail crosses the porch and dies inside Waldo's garage. Fresh scrape marks trace a tool wall that should not move.",g:"YARD → PORCH → GARAGE → FALSE WALL"},
    {k:"goodboys_hangar",t:"THE HIDDEN BAY",p:"Behind the wall is a concealed launch bay and an unregistered ship. Waldo did not leave by car. He left Earth.",g:"CLEAR THE BAY · BOARD THE SECRET SHIP"},
    {k:"goodboys_approach",t:"118 / 1984",p:"The stolen nav cache points at Blacksite Meridian, an orbital detention complex. Cell 118 is filed under Mike's identity. Cell 1984 is Waldo. The prison will not grant docking clearance.",g:"FIND 118 FIRST · THEN REACH WALDO IN 1984",cta:"FOLLOW THE TRAIL"}
  ];

  function bgSrc(key){
    try{
      var plateMap={goodboys_home:"waldo_house",goodboys_hangar:"hidden_bay",goodboys_approach:"orbital_approach",goodboys_earthfall:"earthfall"};
      var plates=root.GOOD_BOYS_CUTSCENE_PLATES,pk=plateMap[key]||key;
      if(plates&&plates[pk])return plates[pk];
      var im=root.NM_BG734&&root.NM_BG734[key];if(im&&im.src)return im.src;
      var map=root.GOOD_BOYS_CAMPAIGN_BACKGROUND_SOURCE,srcKey=map&&map[key],fb=srcKey&&root.NM_BG734&&root.NM_BG734[srcKey];
      return fb&&fb.src||"";
    }catch(e){return "";}
  }

  function installStyle(){
    if(!root.document)return;
    style=root.document.getElementById("good-boys-intro-repair-style");
    if(style)return;
    style=root.document.createElement("style");style.id="good-boys-intro-repair-style";
    style.textContent=[
      "#good-boys-story-cine.gbi-repaired{position:fixed;inset:0;z-index:150500;box-sizing:border-box;padding:0!important;display:flex!important;flex-direction:column!important;align-items:stretch!important;justify-content:flex-start!important;background:#02050b!important;color:#eef8ff;overflow:hidden;isolation:isolate;font-family:monospace}",
      "#good-boys-story-cine.gbi-repaired:before,#good-boys-story-cine.gbi-repaired:after{display:none!important}",
      "#good-boys-story-cine.gbi-repaired .gbi-visual{position:relative;flex:0 0 clamp(190px,38dvh,390px);min-height:190px;background-color:#07101b;background-position:center;background-size:cover;background-repeat:no-repeat;box-shadow:inset 0 -55px 60px -35px #02050b;overflow:hidden}",
      "#good-boys-story-cine.gbi-repaired .gbi-visual:after{content:'';position:absolute;inset:0;background:linear-gradient(to bottom,rgba(2,5,11,.04),rgba(2,5,11,.08) 58%,#02050b 100%);pointer-events:none}",
      "#good-boys-story-cine.gbi-repaired .gbi-card-zone{position:relative;z-index:2;flex:1 1 auto;min-height:0;display:flex;align-items:flex-start;justify-content:center;padding:0 max(12px,env(safe-area-inset-right)) max(12px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left));margin-top:-18px;overflow:auto;overscroll-behavior:contain}",
      "#good-boys-story-cine.gbi-repaired .gb-card{box-sizing:border-box;width:min(720px,100%);max-height:none!important;overflow:visible!important;margin:0!important;padding:16px 18px 17px!important;background:rgba(2,7,13,.97);border:1.5px solid #62d9ff;border-radius:14px;box-shadow:0 14px 38px #000d,0 0 0 1px #061827}",
      "#good-boys-story-cine.gbi-repaired .gb-kicker{color:#ffd166;font:700 10px/1.3 monospace;letter-spacing:.11em}",
      "#good-boys-story-cine.gbi-repaired h2{margin:7px 0 9px;font:700 clamp(20px,5vw,28px)/1.08 monospace;color:#fff}",
      "#good-boys-story-cine.gbi-repaired p{margin:0 0 10px;font:clamp(12px,3.25vw,15px)/1.45 monospace;color:#d9edf7}",
      "#good-boys-story-cine.gbi-repaired .gb-goal{margin:0 0 12px;padding:9px 10px;border-left:3px solid #38bdf8;background:#07131d;color:#bfeaff;font:700 clamp(10px,2.8vw,12px)/1.4 monospace}",
      "#good-boys-story-cine.gbi-repaired button{box-sizing:border-box;width:100%;min-height:52px;border:1.5px solid #62d9ff;border-radius:11px;background:#071624;color:#eef8ff;font:700 12px monospace;touch-action:manipulation;-webkit-tap-highlight-color:transparent;cursor:pointer}",
      "#good-boys-story-cine.gbi-repaired button:active{transform:translateY(1px);background:#0a2033}",
      "@supports not (height:1dvh){#good-boys-story-cine.gbi-repaired .gbi-visual{flex-basis:38vh}}",
      "@media(max-width:600px){#good-boys-story-cine.gbi-repaired .gbi-visual{flex-basis:clamp(175px,34dvh,285px)}#good-boys-story-cine.gbi-repaired .gbi-card-zone{margin-top:-14px}#good-boys-story-cine.gbi-repaired .gb-card{padding:14px!important;border-radius:12px}#good-boys-story-cine.gbi-repaired p{font-size:12px;line-height:1.42}#good-boys-story-cine.gbi-repaired button{min-height:50px}}",
      "@media(max-height:720px){#good-boys-story-cine.gbi-repaired .gbi-visual{flex-basis:31dvh;min-height:145px}#good-boys-story-cine.gbi-repaired .gbi-card-zone{overflow:auto}#good-boys-story-cine.gbi-repaired .gb-card{padding:11px 13px 13px!important}#good-boys-story-cine.gbi-repaired h2{margin:5px 0 6px}#good-boys-story-cine.gbi-repaired p{line-height:1.34;margin-bottom:7px}#good-boys-story-cine.gbi-repaired .gb-goal{margin-bottom:8px;padding:7px 9px}#good-boys-story-cine.gbi-repaired button{min-height:44px}}",
      "@media(min-aspect-ratio:4/3){#good-boys-story-cine.gbi-repaired{display:grid!important;grid-template-columns:minmax(0,1.3fr) minmax(360px,.7fr)!important;grid-template-rows:1fr!important}#good-boys-story-cine.gbi-repaired .gbi-visual{min-height:100%;height:100%;flex-basis:auto}#good-boys-story-cine.gbi-repaired .gbi-card-zone{margin:0;padding:max(20px,env(safe-area-inset-top)) max(20px,env(safe-area-inset-right)) max(20px,env(safe-area-inset-bottom)) 18px;align-items:center;background:#02050b}#good-boys-story-cine.gbi-repaired .gb-card{max-width:560px}}"
    ].join("");
    (root.document.head||root.document.documentElement).appendChild(style);
  }

  function armLaunchButton(){
    try{var b=root.document&&root.document.getElementById("btn-v736");if(!b)return false;b.dataset.gbdBypass="1";b.dataset.gbiRepair="1";return true;}catch(e){return false;}
  }
  function gameState(){try{return root.S||null;}catch(_){return null;}}
  function lockDialog(){
    try{
      var s=gameState();if(!s)return false;
      if(dialogLock&&dialogLock.state===s){try{s.inDialog=true;}catch(_){}return true;}
      unlockDialog(false);
      var d=Object.getOwnPropertyDescriptor(s,"inDialog"),backing=!!s.inDialog;
      if(!d||d.configurable){
        dialogLock={state:s,descriptor:d,backing:backing};
        Object.defineProperty(s,"inDialog",{configurable:true,enumerable:d?d.enumerable:true,get:function(){return active?true:!!(dialogLock&&dialogLock.backing);},set:function(v){if(dialogLock)dialogLock.backing=!!v;}});
        return true;
      }
      s.inDialog=true;return false;
    }catch(e){root.__goodBoysIntroDialogLockError=String(e&&e.stack||e);return false;}
  }
  function unlockDialog(next){
    var l=dialogLock;dialogLock=null;
    if(!l){try{var s=gameState();if(s)s.inDialog=!!next;}catch(_){}return;}
    try{
      if(l.descriptor){
        var d=l.descriptor;
        if(Object.prototype.hasOwnProperty.call(d,"value")){d.value=!!next;Object.defineProperty(l.state,"inDialog",d);}
        else{Object.defineProperty(l.state,"inDialog",d);try{l.state.inDialog=!!next;}catch(_){}}
      }else{delete l.state.inDialog;l.state.inDialog=!!next;}
    }catch(e){try{l.state.inDialog=!!next;}catch(_){}root.__goodBoysIntroDialogUnlockError=String(e&&e.stack||e);}
  }
  function setDialog(on){if(on){if(!lockDialog()){try{var s=gameState();if(s)s.inDialog=true;}catch(_){}}}else unlockDialog(false);}
  function cleanup(){
    if(watchdog){root.clearTimeout(watchdog);watchdog=null;}
    try{if(overlay&&overlay.parentNode)overlay.remove();}catch(_){}
    overlay=null;active=false;advancing=false;
    try{if(root.document&&root.document.body)root.document.body.classList.remove("good-boys-cinematic");}catch(_){}
    unlockDialog(false);
  }
  function escape(s){return String(s==null?"":s).replace(/[&<>\"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c];});}

  function render(){
    if(!overlay)return;
    var s=SCENES[index],src=bgSrc(s.k),visual=overlay.querySelector(".gbi-visual"),zone=overlay.querySelector(".gbi-card-zone");
    visual.style.backgroundImage=src?'url("'+String(src).replace(/"/g,"%22")+'")':'linear-gradient(145deg,#0b1b2c,#050912 55%,#02050b)';
    zone.innerHTML='<div class="gb-card"><div class="gb-kicker">GOOD BOYS PROTOCOL · '+(index+1)+' / '+SCENES.length+'</div><h2>'+escape(s.t)+'</h2><p>'+escape(s.p)+'</p>'+(s.g?'<div class="gb-goal">'+escape(s.g)+'</div>':'')+'<button id="gb-cine-next" type="button">'+escape(s.cta||(index===SCENES.length-1?'FOLLOW THE TRAIL':'CONTINUE'))+'</button></div>';
    var btn=zone.querySelector("#gb-cine-next");
    if(btn){btn.addEventListener("click",advance,{once:false});}
    try{zone.scrollTop=0;btn&&btn.focus({preventScroll:true});}catch(_){}
    advancing=false;
  }

  function ensureBuiltinM1Skip(){
    try{
      if(root.v725&&typeof root.v725.play==="function"&&!root.v725.play.__gbiSkipM1){
        var base=root.v725.play;
        var wrapped=function(id,cb){
          if(id==="b736m1"&&root.__gbiSkipBuiltinM1){root.__gbiSkipBuiltinM1=false;root.__gbdSkipBuiltinM1=false;if(cb)try{cb();}catch(_){}return true;}
          return base.apply(this,arguments);
        };
        wrapped.__gbiSkipM1=true;wrapped.__gbdSkipM1=true;root.v725.play=wrapped;
      }
      root.__gbiSkipBuiltinM1=true;root.__gbdSkipBuiltinM1=true;
      return true;
    }catch(e){root.__goodBoysIntroRepairSkipError=String(e&&e.stack||e);return false;}
  }
  function campaignAttached(){try{return !!(root.NM&&root.NM._v736);}catch(e){return false;}}
  function invokeStart(){
    try{ensureBuiltinM1Skip();if(root.v736&&typeof root.v736.start==="function"){root.v736.start();return true;}}catch(e){root.__goodBoysIntroRepairStartError=String(e&&e.stack||e);}return false;
  }
  function verifyLaunch(attempt){
    if(campaignAttached()){launching=false;root.__goodBoysIntroRepairLaunch={ok:true,attempt:attempt,at:Date.now()};return;}
    if(attempt<2){invokeStart();watchdog=root.setTimeout(function(){verifyLaunch(attempt+1);},350);return;}
    launching=false;root.__goodBoysIntroRepairLaunch={ok:false,attempt:attempt,at:Date.now(),error:root.__goodBoysIntroRepairStartError||"campaign did not attach"};
    try{var b=root.document&&root.document.getElementById("btn-v736");if(b){b.dataset.gbdBypass="1";b.textContent="🛰 RETRY 118 / 1984 BREAKOUT";}}catch(_){}
  }
  function launchCampaign(){
    if(launching||campaignAttached())return false;
    launching=true;cleanup();
    /* Return from the user gesture before v736.start performs the shared Night
       handoff. iOS/WebKit otherwise keeps the final button gesture pending while
       synchronous campaign bootstrap work runs, presenting as a dead CTA. */
    (root.setTimeout||setTimeout)(function(){
      ensureBuiltinM1Skip();
      if(!invokeStart()){launching=false;root.__goodBoysIntroRepairLaunch={ok:false,attempt:0,at:Date.now(),error:root.__goodBoysIntroRepairStartError||"v736 start missing"};return;}
      watchdog=root.setTimeout(function(){verifyLaunch(0);},250);
    },0);
    return true;
  }
  function advance(e){
    if(e){try{e.preventDefault();e.stopPropagation();}catch(_){}}
    if(advancing||!active)return;advancing=true;
    if(index<SCENES.length-1){index++;render();return;}
    launchCampaign();
  }
  function showOpening(){
    if(active||launching)return false;
    installStyle();
    try{var stale=root.document.getElementById("good-boys-story-cine");if(stale)stale.remove();}catch(_){}
    overlay=root.document.createElement("div");overlay.id="good-boys-story-cine";overlay.className="gbi-repaired";overlay.setAttribute("role","dialog");overlay.setAttribute("aria-modal","true");overlay.setAttribute("aria-label","Good Boys Protocol opening");overlay.innerHTML='<div class="gbi-visual" aria-hidden="true"></div><div class="gbi-card-zone"></div>';
    root.document.body.appendChild(overlay);index=0;active=true;advancing=false;setDialog(true);
    try{root.document.body.classList.add("good-boys-cinematic");}catch(_){}
    render();return true;
  }
  function onLaunchClick(e){
    try{
      var t=e.target&&e.target.closest?e.target.closest("#btn-v736"):null;if(!t)return;
      if(campaignAttached())return;
      t.dataset.gbdBypass="1";
      e.preventDefault();e.stopImmediatePropagation();
      showOpening();
    }catch(err){root.__goodBoysIntroRepairError=String(err&&err.stack||err);}
  }
  function onKey(e){if(!active)return;if(e.key==="Enter"||e.key===" "){var b=root.document.getElementById("gb-cine-next");if(b){e.preventDefault();b.click();}}}
  function tick(){installStyle();armLaunchButton();if(active)setDialog(true);}

  installStyle();armLaunchButton();
  if(root.document){root.document.addEventListener("click",onLaunchClick,true);root.document.addEventListener("keydown",onKey,true);}
  var timer=root.setInterval?root.setInterval(tick,150):null;tick();
  root.TechOpsGoodBoysIntroRepair={VERSION:VERSION,SCENES:SCENES,showOpening:showOpening,launchCampaign:launchCampaign,tick:tick,armLaunchButton:armLaunchButton,get active(){return active;},get index(){return index;},get launching(){return launching;},timer:timer};
})(typeof globalThis!=="undefined"?globalThis:this);
