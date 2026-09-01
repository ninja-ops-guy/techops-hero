/* TechOps Hero — Good Boys direct cinematic intro v8
 * Canon opening: ship interior/takeover clips 01 + 02 -> one premise card -> gameplay.
 * Owns the launch surface continuously so the retired director premise cannot reappear.
 */
(function(root){
  "use strict";
  if(!root)return;
  var PRIOR=root.TechOpsGoodBoysIntroRepair;
  if(PRIOR&&Number(PRIOR.VERSION||0)>=8)return;
  try{if(PRIOR&&PRIOR.timer&&root.clearInterval)root.clearInterval(PRIOR.timer);if(PRIOR&&PRIOR.observer)PRIOR.observer.disconnect();}catch(_){}
  var VERSION=8,launching=false,premise=null,installedButton=null,launchEpoch=0,observer=null;
  function button(){return root.document&&root.document.getElementById("btn-v736");}
  function bypass(){var b=button();if(!b)return false;b.dataset.gbdBypass="1";b.dataset.gbiRepair="1";return true;}
  function attached(){try{return !!(root.NM&&root.NM._v736);}catch(_){return false;}}
  function dismissLegacy(){
    try{["good-boys-story-cine","good-boys-premise"].forEach(function(id){var n=root.document&&root.document.getElementById(id);if(n)n.remove();});}catch(_){}
    try{if(root.document&&root.document.body&&!root.document.getElementById("good-boys-campaign-intro"))root.document.body.classList.remove("good-boys-cinematic");}catch(_){}
  }
  function guardOwnership(){
    try{
      bypass();
      if(launching||premise||!attached())dismissLegacy();
      return true;
    }catch(e){root.__goodBoysIntroOwnershipError=String(e&&e.stack||e);return false;}
  }
  function canonicalClockIn(){try{var title=root.document&&root.document.getElementById("title-screen");if(title&&!title.classList.contains("hidden")){var start=root.document.getElementById("btn-start");if(start){start.click();return true;}}return true;}catch(e){root.__goodBoysDirectIntroClockInError=String(e&&e.stack||e);return false;}}
  function startCampaign(){try{canonicalClockIn();root.__gbiSkipBuiltinM1=true;root.__gbdSkipBuiltinM1=true;if(attached())return true;if(root.v736&&typeof root.v736.start==="function"){root.v736.start();return true;}}catch(e){root.__goodBoysDirectIntroStartError=String(e&&e.stack||e);}return false;}
  function verify(attempt,epoch){if(epoch!==launchEpoch)return;if(attached()){launching=false;guardOwnership();root.__goodBoysDirectIntro={ok:true,at:Date.now(),attempt:attempt,epoch:epoch};return;}if(attempt<3){startCampaign();root.setTimeout(function(){verify(attempt+1,epoch);},300);return;}launching=false;root.__goodBoysDirectIntro={ok:false,at:Date.now(),attempt:attempt,epoch:epoch,error:root.__goodBoysDirectIntroStartError||"campaign did not attach"};}
  function showPremise(){
    return new Promise(function(resolve){
      if(!root.document){resolve();return;}
      dismissLegacy();
      var stale=root.document.getElementById("good-boys-campaign-intro");if(stale)stale.remove();
      premise=root.document.createElement("div");premise.id="good-boys-campaign-intro";premise.dataset.goodDogsOpening="premise";
      premise.innerHTML='<div class="gbp-card"><div class="gbp-kicker">GOOD BOYS PROTOCOL</div><h2>WALDO IS OFF-WORLD.</h2><p>Katrin and Manchez have taken the ship. Its navigation cache points to Blacksite Meridian: an orbital detention ring holding a prisoner under Mike Olivefield’s identity in Cell 118 — and Waldo in Cell 1984.</p><div class="gbp-route">INFILTRATE THE DOCK → FIND CELL 118 → FREE WALDO</div><button type="button">TAKE CONTROL</button></div>';
      var css=root.document.getElementById("good-boys-premise-style");if(!css){css=root.document.createElement("style");css.id="good-boys-premise-style";css.textContent="#good-boys-campaign-intro[data-good-dogs-opening=\"premise\"]{position:fixed;inset:0;z-index:150200;display:flex;align-items:center;justify-content:center;padding:22px;background:radial-gradient(circle at 50% 25%,#132133 0,#050912 48%,#010205 100%);font-family:monospace;color:#eaf6ff}#good-boys-campaign-intro .gbp-card{position:relative;width:min(680px,100%);padding:24px;border:1px solid #67e8f9;background:#050b12ee;box-shadow:0 0 0 3px #08131d,0 18px 60px #000}#good-boys-campaign-intro .gbp-kicker{color:#8df1ce;font-size:11px;letter-spacing:.16em}#good-boys-campaign-intro h2{margin:10px 0 14px;color:#fff;font-size:clamp(22px,6vw,38px);line-height:1.05}#good-boys-campaign-intro p{font-size:clamp(13px,3.5vw,17px);line-height:1.55;color:#d7e9f3}#good-boys-campaign-intro .gbp-route{margin:18px 0;padding:12px;border-left:3px solid #ffd166;background:#0b1722;color:#ffd166;font-weight:700;line-height:1.5}#good-boys-campaign-intro button{width:100%;min-height:54px;border:1px solid #67e8f9;background:#0a1a28;color:#fff;font:700 13px monospace;letter-spacing:.08em;touch-action:manipulation}";(root.document.head||root.document.documentElement).appendChild(css);}
      root.document.body.appendChild(premise);var b=premise.querySelector("button"),done=false;
      var finish=function(e){if(done)return;done=true;if(e){e.preventDefault();e.stopPropagation();}try{premise.remove();}catch(_){}premise=null;dismissLegacy();resolve();};
      b.addEventListener("pointerup",finish,{once:true});b.addEventListener("click",finish,{once:true});
    });
  }
  async function playOpening(){
    if(!root.GoodDogsCutscenes||typeof root.GoodDogsCutscenes.play!=="function"){root.__goodBoysDirectIntroMediaError="GoodDogsCutscenes unavailable";return {skipped:true,missing:true};}
    var first=await root.GoodDogsCutscenes.play("GD_CUT_01",{force:true,muted:true});root.__goodBoysOpeningClipResult=first||null;
    if(first&&first.skipped)return first;
    var second=await root.GoodDogsCutscenes.play("GD_CUT_02",{force:true,muted:true});root.__goodBoysOpeningClipResult=second||null;return second||first||null;
  }
  async function launch(e){
    if(e){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();}
    if(launching||attached())return false;
    var epoch=++launchEpoch;launching=true;bypass();dismissLegacy();
    var b=button(),old=b&&b.textContent;if(b){b.disabled=true;b.textContent="OPENING TRANSMISSION…";}
    root.__goodBoysDirectIntro={ok:null,status:"opening",at:Date.now(),epoch:epoch};
    try{await playOpening();}catch(err){root.__goodBoysDirectIntroMediaError=String(err&&err.stack||err);}
    if(epoch!==launchEpoch)return false;dismissLegacy();
    try{await showPremise();}catch(err2){root.__goodBoysPremiseError=String(err2&&err2.stack||err2);}
    if(epoch!==launchEpoch)return false;
    if(b){b.disabled=false;b.textContent=old||"🐕 GOOD BOYS — 118 / 1984 BREAKOUT";}
    root.__goodBoysDirectIntro={ok:null,status:"handoff",at:Date.now(),epoch:epoch};
    root.setTimeout(function(){if(epoch!==launchEpoch)return;dismissLegacy();startCampaign();root.setTimeout(function(){verify(1,epoch);},350);},0);
    return true;
  }
  function install(){
    var b=button();if(!b)return false;bypass();
    if(installedButton===b&&b.dataset.gbiRepairInstalled==="8")return true;
    if(installedButton)try{installedButton.removeEventListener("click",launch,true);}catch(_){}
    b.addEventListener("click",launch,true);b.dataset.gbiRepairInstalled="8";installedButton=b;return true;
  }
  function installObserver(){try{if(observer||!root.MutationObserver||!root.document)return;observer=new root.MutationObserver(function(){install();guardOwnership();});observer.observe(root.document.documentElement,{subtree:true,childList:true});}catch(e){root.__goodBoysIntroObserverError=String(e&&e.stack||e);}}
  var timer=root.setInterval(function(){install();guardOwnership();},100);installObserver();install();guardOwnership();
  root.TechOpsGoodBoysIntroRepair={VERSION:VERSION,launch:launch,install:install,playOpening:playOpening,startCampaign:startCampaign,guardOwnership:guardOwnership,timer:timer,observer:observer,get launching(){return launching;},get premise(){return premise;}};
})(typeof globalThis!=="undefined"?globalThis:this);
