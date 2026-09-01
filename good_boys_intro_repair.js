/* TechOps Hero — Good Boys direct cinematic intro v9
 * Canon opening: clip 01 -> playable ship approach/interact -> clip 02 -> one premise -> campaign.
 * Owns launch + retires the obsolete FOLLOW THE TRAIL director path.
 */
(function(root){
  "use strict";
  if(!root)return;
  var PRIOR=root.TechOpsGoodBoysIntroRepair;
  if(PRIOR&&Number(PRIOR.VERSION||0)>=9)return;
  try{if(PRIOR&&PRIOR.timer&&root.clearInterval)root.clearInterval(PRIOR.timer);if(PRIOR&&PRIOR.observer)PRIOR.observer.disconnect();}catch(_){}
  var VERSION=9,launching=false,premise=null,interlude=null,installedButton=null,launchEpoch=0,observer=null;
  function button(){return root.document&&root.document.getElementById("btn-v736");}
  function bypass(){var b=button();if(!b)return false;b.dataset.gbdBypass="1";b.dataset.gbiRepair="1";return true;}
  function attached(){try{return !!(root.NM&&root.NM._v736);}catch(_){return false;}}
  function dismissLegacy(){
    try{var n=root.document&&root.document.getElementById("good-boys-story-cine");if(n)n.remove();var p=root.document&&root.document.getElementById("good-boys-premise");if(p)p.remove();}catch(_){}
    try{if(root.document&&root.document.body&&!root.document.getElementById("good-boys-campaign-intro")&&!root.document.getElementById("good-boys-ship-interlude"))root.document.body.classList.remove("good-boys-cinematic");}catch(_){}
  }
  function legacyFollowTarget(t){try{var b=t&&t.closest?t.closest("#gb-cine-next"):null;return b&&/FOLLOW\s+THE\s+TRAIL/i.test(b.textContent||"")?b:null;}catch(_){return null;}}
  function rescueLegacyFollow(e){
    var b=legacyFollowTarget(e&&e.target);if(!b)return;
    try{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();}catch(_){}
    dismissLegacy();
    root.__goodBoysLegacyFollowRescued={at:Date.now()};
    if(!launching&&!attached())launch();
  }
  function guardOwnership(){
    try{
      bypass();
      var legacy=root.document&&root.document.getElementById("good-boys-story-cine");
      if(legacy&&(/FOLLOW\s+THE\s+TRAIL/i.test(legacy.textContent||"")||launching||premise||interlude||!attached()))legacy.remove();
      if(launching||premise||interlude||!attached())dismissLegacy();
      return true;
    }catch(e){root.__goodBoysIntroOwnershipError=String(e&&e.stack||e);return false;}
  }
  function canonicalClockIn(){try{var title=root.document&&root.document.getElementById("title-screen");if(title&&!title.classList.contains("hidden")){var start=root.document.getElementById("btn-start");if(start){start.click();return true;}}return true;}catch(e){root.__goodBoysDirectIntroClockInError=String(e&&e.stack||e);return false;}}
  function startCampaign(){try{canonicalClockIn();root.__gbiSkipBuiltinM1=true;root.__gbdSkipBuiltinM1=true;if(attached())return true;if(root.v736&&typeof root.v736.start==="function"){root.v736.start({mission:1});return true;}}catch(e){root.__goodBoysDirectIntroStartError=String(e&&e.stack||e);}return false;}
  function verify(attempt,epoch){if(epoch!==launchEpoch)return;if(attached()){launching=false;guardOwnership();root.__goodBoysDirectIntro={ok:true,at:Date.now(),attempt:attempt,epoch:epoch};return;}if(attempt<3){startCampaign();root.setTimeout(function(){verify(attempt+1,epoch);},300);return;}launching=false;root.__goodBoysDirectIntro={ok:false,at:Date.now(),attempt:attempt,epoch:epoch,error:root.__goodBoysDirectIntroStartError||"campaign did not attach"};}
  function showPremise(){return new Promise(function(resolve){
    if(!root.document){resolve();return;}dismissLegacy();var stale=root.document.getElementById("good-boys-campaign-intro");if(stale)stale.remove();
    premise=root.document.createElement("div");premise.id="good-boys-campaign-intro";premise.dataset.goodDogsOpening="premise";
    premise.innerHTML='<div class="gbp-card"><div class="gbp-kicker">GOOD BOYS PROTOCOL</div><h2>THE SHIP IS THEIRS.</h2><p>The crewman is down and the navigation cache is unlocked. Blacksite Meridian is holding a prisoner under Mike Olivefield’s identity in Cell 118 — and Waldo in Cell 1984.</p><div class="gbp-route">INFILTRATE THE DOCK → FIND CELL 118 → FREE WALDO</div><button type="button">TAKE CONTROL</button></div>';
    var css=root.document.getElementById("good-boys-premise-style");if(!css){css=root.document.createElement("style");css.id="good-boys-premise-style";css.textContent="#good-boys-campaign-intro[data-good-dogs-opening=\"premise\"]{position:fixed;inset:0;z-index:150200;display:flex;align-items:center;justify-content:center;padding:22px;background:radial-gradient(circle at 50% 25%,#132133 0,#050912 48%,#010205 100%);font-family:monospace;color:#eaf6ff}#good-boys-campaign-intro .gbp-card{position:relative;width:min(680px,100%);padding:24px;border:1px solid #67e8f9;background:#050b12ee;box-shadow:0 0 0 3px #08131d,0 18px 60px #000}#good-boys-campaign-intro .gbp-kicker{color:#8df1ce;font-size:11px;letter-spacing:.16em}#good-boys-campaign-intro h2{margin:10px 0 14px;color:#fff;font-size:clamp(22px,6vw,38px);line-height:1.05}#good-boys-campaign-intro p{font-size:clamp(13px,3.5vw,17px);line-height:1.55;color:#d7e9f3}#good-boys-campaign-intro .gbp-route{margin:18px 0;padding:12px;border-left:3px solid #ffd166;background:#0b1722;color:#ffd166;font-weight:700;line-height:1.5}#good-boys-campaign-intro button{width:100%;min-height:54px;border:1px solid #67e8f9;background:#0a1a28;color:#fff;font:700 13px monospace;letter-spacing:.08em;touch-action:manipulation}";(root.document.head||root.document.documentElement).appendChild(css);}
    root.document.body.appendChild(premise);var b=premise.querySelector("button"),done=false;var finish=function(e){if(done)return;done=true;if(e){e.preventDefault();e.stopPropagation();}try{premise.remove();}catch(_){}premise=null;dismissLegacy();resolve();};b.addEventListener("pointerup",finish,{once:true});b.addEventListener("click",finish,{once:true});
  });}
  function showShipInterlude(){return new Promise(function(resolve){
    if(!root.document){resolve({completed:false,missing:true});return;}dismissLegacy();
    var old=root.document.getElementById("good-boys-ship-interlude");if(old)old.remove();
    interlude=root.document.createElement("div");interlude.id="good-boys-ship-interlude";interlude.dataset.goodDogsOpening="ship-gameplay";
    interlude.innerHTML='<div class="gbi-ship-shell"><div class="gbi-ship-head"><b>SHIP DECK · LIVE</b><span>APPROACH THE CREWMAN · INTERACT</span></div><canvas width="960" height="540" aria-label="Katrin and Manchez ship interaction"></canvas><div class="gbi-ship-msg">MOVE RIGHT. GET CLOSE ENOUGH TO INTERACT.</div><div class="gbi-ship-controls"><button data-move="left" aria-label="Move left">◀</button><button data-move="right" aria-label="Move right">▶</button><button data-interact="1" disabled>INTERACT</button></div></div>';
    var css=root.document.getElementById("good-boys-ship-interlude-style");if(!css){css=root.document.createElement("style");css.id="good-boys-ship-interlude-style";css.textContent="#good-boys-ship-interlude{position:fixed;inset:0;z-index:150180;background:#01040a;display:flex;align-items:center;justify-content:center;padding:max(10px,env(safe-area-inset-top)) 10px max(10px,env(safe-area-inset-bottom));box-sizing:border-box;color:#eaf6ff;font-family:monospace;touch-action:none}#good-boys-ship-interlude .gbi-ship-shell{width:min(100%,980px);display:grid;gap:8px}#good-boys-ship-interlude .gbi-ship-head{display:flex;justify-content:space-between;gap:12px;font-size:11px;color:#8df1ce;letter-spacing:.08em}#good-boys-ship-interlude canvas{width:100%;max-height:68vh;aspect-ratio:16/9;background:#07101a;border:1px solid #34566b;box-shadow:0 14px 50px #000;image-rendering:auto}#good-boys-ship-interlude .gbi-ship-msg{text-align:center;min-height:18px;font-size:11px;color:#ffd166}#good-boys-ship-interlude .gbi-ship-controls{display:grid;grid-template-columns:1fr 1fr 1.6fr;gap:8px}#good-boys-ship-interlude button{min-height:54px;border:1px solid #5cbde8;background:#071624;color:#fff;font:700 13px monospace;touch-action:none}#good-boys-ship-interlude button:disabled{opacity:.35}@media(max-width:600px){#good-boys-ship-interlude .gbi-ship-head{font-size:9px;flex-direction:column;gap:3px}#good-boys-ship-interlude canvas{max-height:60vh}}";(root.document.head||root.document.documentElement).appendChild(css);}
    root.document.body.appendChild(interlude);var canvas=interlude.querySelector("canvas"),ctx=canvas.getContext("2d"),msg=interlude.querySelector(".gbi-ship-msg"),ib=interlude.querySelector("[data-interact]"),x=115,target=760,held=0,raf=0,done=false,img=null;
    try{var A=root.KATRIN_MANCHEZ;if(A&&A.src){img=new root.Image();img.src=A.src;}}catch(_){}
    function drawAtlas(key,dx,dy,dw){try{var A=root.KATRIN_MANCHEZ,fr=A&&A.frames&&(A.frames[key]||A.frames[key+"0"]);if(!img||!img.complete||!img.naturalWidth||!fr)return false;var sx,sy,sw,sh;if(fr.length>=4){sx=fr[0];sy=fr[1];sw=fr[2];sh=fr[3];}else{var c=A.cell||64;sx=fr[0]*c;sy=fr[1]*c;sw=c;sh=A.cellH||c;}ctx.drawImage(img,sx,sy,sw,sh,dx,dy,dw,dw*(sh/sw));return true;}catch(_){return false;}}
    function dogFallback(dx,dy,coat,accent){ctx.save();ctx.fillStyle=coat;ctx.beginPath();ctx.ellipse(dx,dy,34,19,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(dx+31,dy-12,18,0,Math.PI*2);ctx.fill();ctx.strokeStyle=accent;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(dx-31,dy-4);ctx.lineTo(dx-53,dy-22);ctx.stroke();ctx.fillStyle="#111";ctx.fillRect(dx+36,dy-16,4,4);ctx.restore();}
    function draw(){ctx.clearRect(0,0,960,540);var g=ctx.createLinearGradient(0,0,0,540);g.addColorStop(0,"#071522");g.addColorStop(1,"#02070d");ctx.fillStyle=g;ctx.fillRect(0,0,960,540);ctx.fillStyle="#0d2332";for(var i=0;i<8;i++)ctx.fillRect(i*130+30,75,82,220);ctx.strokeStyle="#4e7487";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,380);ctx.lineTo(960,380);ctx.stroke();ctx.fillStyle="#17384b";ctx.fillRect(690,125,165,190);ctx.fillStyle="#67e8f9";ctx.font="700 18px monospace";ctx.fillText("NAV CONSOLE",704,154);ctx.fillStyle="#1a1d20";ctx.fillRect(target-14,300,28,80);ctx.beginPath();ctx.arc(target,284,17,0,Math.PI*2);ctx.fill();ctx.fillStyle="#d9edf7";ctx.font="700 15px monospace";ctx.fillText("CREWMAN",target-38,250);var ok1=drawAtlas("kat_stand",x-38,315,82),ok2=drawAtlas("man_idle0",x+18,320,76);if(!ok1)dogFallback(x,350,"#dcecff","#3fa9f5");if(!ok2)dogFallback(x+64,356,"#ffe4bd","#f59e0b");var near=x>=610;ib.disabled=!near;ctx.strokeStyle=near?"#ffd166":"#34566b";ctx.lineWidth=2;ctx.strokeRect(target-58,230,116,165);if(near){ctx.fillStyle="#ffd166";ctx.font="700 16px monospace";ctx.fillText("INTERACT",target-36,220);}root.__goodBoysOpeningGameplay={active:true,x:Math.round(x),target:target,near:near,at:Date.now()};}
    function frame(){if(done)return;if(held){x=Math.max(80,Math.min(650,x+held*5.5));draw();}raf=root.requestAnimationFrame(frame);}function setHeld(v){held=v;if(v)draw();}
    function keydown(e){if(e.key==="ArrowRight"||e.key.toLowerCase()==="d"){e.preventDefault();setHeld(1);}if(e.key==="ArrowLeft"||e.key.toLowerCase()==="a"){e.preventDefault();setHeld(-1);}if((e.key.toLowerCase()==="e"||e.key==="Enter")&&!ib.disabled)finish(e);}
    function keyup(e){if(["ArrowRight","ArrowLeft","a","A","d","D"].indexOf(e.key)>=0)setHeld(0);}
    function wireMove(b,dir){b.addEventListener("pointerdown",function(e){e.preventDefault();setHeld(dir);});["pointerup","pointercancel","pointerleave"].forEach(function(n){b.addEventListener(n,function(){setHeld(0);});});}
    function finish(e){if(done||ib.disabled)return;done=true;if(e){e.preventDefault();e.stopPropagation();}msg.textContent="CREWMAN DISTRACTED · TAKEOVER WINDOW OPEN";root.__goodBoysOpeningGameplay={active:false,completed:true,x:Math.round(x),target:target,near:true,at:Date.now()};root.setTimeout(function(){cleanup();resolve({completed:true});},420);}
    function cleanup(){try{root.cancelAnimationFrame(raf);}catch(_){}root.removeEventListener("keydown",keydown,true);root.removeEventListener("keyup",keyup,true);try{interlude.remove();}catch(_){}interlude=null;}
    wireMove(interlude.querySelector('[data-move="left"]'),-1);wireMove(interlude.querySelector('[data-move="right"]'),1);ib.addEventListener("pointerup",finish);ib.addEventListener("click",finish);root.addEventListener("keydown",keydown,true);root.addEventListener("keyup",keyup,true);draw();raf=root.requestAnimationFrame(frame);
  });}
  async function playOpening(){
    if(!root.GoodDogsCutscenes||typeof root.GoodDogsCutscenes.play!=="function"){root.__goodBoysDirectIntroMediaError="GoodDogsCutscenes unavailable";return {skipped:true,missing:true};}
    var first=await root.GoodDogsCutscenes.play("GD_CUT_01",{force:true,muted:true});root.__goodBoysOpeningClipResult=first||null;if(first&&first.skipped)return first;
    var gameplay=await showShipInterlude();root.__goodBoysOpeningGameplayResult=gameplay||null;
    var second=await root.GoodDogsCutscenes.play("GD_CUT_02",{force:true,muted:true});root.__goodBoysOpeningClipResult=second||null;return second||gameplay||first||null;
  }
  function launch(e){
    if(e){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();}if(launching||attached())return false;var epoch=++launchEpoch;launching=true;bypass();dismissLegacy();var b=button(),old=b&&b.textContent;if(b){b.disabled=true;b.textContent="OPENING TRANSMISSION…";}root.__goodBoysDirectIntro={ok:null,status:"opening",at:Date.now(),epoch:epoch};
    Promise.resolve().then(playOpening).catch(function(err){root.__goodBoysDirectIntroMediaError=String(err&&err.stack||err);}).then(function(){if(epoch!==launchEpoch)return;dismissLegacy();return showPremise();}).catch(function(err2){root.__goodBoysPremiseError=String(err2&&err2.stack||err2);}).then(function(){if(epoch!==launchEpoch)return;if(b){b.disabled=false;b.textContent=old||"🐕 GOOD BOYS — 118 / 1984 BREAKOUT";}root.__goodBoysDirectIntro={ok:null,status:"handoff",at:Date.now(),epoch:epoch};root.setTimeout(function(){if(epoch!==launchEpoch)return;dismissLegacy();startCampaign();root.setTimeout(function(){verify(1,epoch);},350);},0);});return true;
  }
  function install(){var b=button();if(!b)return false;bypass();if(installedButton===b&&b.dataset.gbiRepairInstalled==="9")return true;if(installedButton)try{installedButton.removeEventListener("click",launch,true);}catch(_){}b.addEventListener("click",launch,true);b.dataset.gbiRepairInstalled="9";installedButton=b;return true;}
  function installObserver(){try{if(observer||!root.MutationObserver||!root.document)return;observer=new root.MutationObserver(function(){install();guardOwnership();});observer.observe(root.document.documentElement,{subtree:true,childList:true});}catch(e){root.__goodBoysIntroObserverError=String(e&&e.stack||e);}}
  if(root.document){root.document.addEventListener("pointerdown",rescueLegacyFollow,true);root.document.addEventListener("click",rescueLegacyFollow,true);}var timer=root.setInterval(function(){install();guardOwnership();},80);installObserver();install();guardOwnership();
  root.TechOpsGoodBoysIntroRepair={VERSION:VERSION,launch:launch,install:install,playOpening:playOpening,showShipInterlude:showShipInterlude,startCampaign:startCampaign,guardOwnership:guardOwnership,timer:timer,observer:observer,get launching(){return launching;},get premise(){return premise;},get interlude(){return interlude;}};
})(typeof globalThis!=="undefined"?globalThis:this);
