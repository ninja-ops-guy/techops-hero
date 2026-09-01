/* TechOps Hero — Good Boys direct cinematic intro v6
 * Canon opening: ship interior/takeover clips 01 + 02 -> one premise card -> gameplay.
 * The retired four-card preamble stays gone.
 */
(function(root){
  "use strict";
  if(!root||root.TechOpsGoodBoysIntroRepair)return;
  var VERSION=6,launching=false,premise=null;
  function button(){return root.document&&root.document.getElementById("btn-v736");}
  function bypass(){var b=button();if(!b)return false;b.dataset.gbdBypass="1";b.dataset.gbiRepair="1";return true;}
  function attached(){try{return !!(root.NM&&root.NM._v736);}catch(_){return false;}}
  function dismissLegacy(){try{var n=root.document&&root.document.getElementById("good-boys-story-cine");if(n)n.remove();}catch(_){}try{if(root.document&&root.document.body)root.document.body.classList.remove("good-boys-cinematic");}catch(_){} }
  function canonicalClockIn(){try{var title=root.document&&root.document.getElementById("title-screen");if(title&&!title.classList.contains("hidden")){var start=root.document.getElementById("btn-start");if(start){start.click();return true;}}return true;}catch(e){root.__goodBoysDirectIntroClockInError=String(e&&e.stack||e);return false;}}
  function startCampaign(){try{canonicalClockIn();root.__gbiSkipBuiltinM1=true;root.__gbdSkipBuiltinM1=true;if(root.v736&&typeof root.v736.start==="function"){root.v736.start();return true;}}catch(e){root.__goodBoysDirectIntroStartError=String(e&&e.stack||e);}return false;}
  function verify(attempt){if(attached()){launching=false;root.__goodBoysDirectIntro={ok:true,at:Date.now(),attempt:attempt};return;}if(attempt<2){startCampaign();root.setTimeout(function(){verify(attempt+1);},300);return;}launching=false;root.__goodBoysDirectIntro={ok:false,at:Date.now(),attempt:attempt,error:root.__goodBoysDirectIntroStartError||"campaign did not attach"};}
  function showPremise(){
    return new Promise(function(resolve){
      if(!root.document){resolve();return;}
      premise=root.document.createElement("div");premise.id="good-boys-premise";
      premise.innerHTML='<div class="gbp-card"><div class="gbp-kicker">GOOD BOYS PROTOCOL</div><h2>WALDO IS OFF-WORLD.</h2><p>Katrin and Manchez have taken the ship. Its navigation cache points to Blacksite Meridian: an orbital detention ring holding a prisoner under Mike Olivefield’s identity in Cell 118 — and Waldo in Cell 1984.</p><div class="gbp-route">INFILTRATE THE DOCK → FIND CELL 118 → FREE WALDO</div><button type="button">TAKE CONTROL</button></div>';
      var css=root.document.getElementById("good-boys-premise-style");if(!css){css=root.document.createElement("style");css.id="good-boys-premise-style";css.textContent="#good-boys-premise{position:fixed;inset:0;z-index:150200;display:flex;align-items:center;justify-content:center;padding:22px;background:radial-gradient(circle at 50% 25%,#132133 0,#050912 48%,#010205 100%);font-family:monospace;color:#eaf6ff}#good-boys-premise:before{content:'';position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(255,255,255,.025) 0 1px,transparent 1px 4px)}#good-boys-premise .gbp-card{position:relative;width:min(680px,100%);padding:24px;border:1px solid #67e8f9;background:#050b12ee;box-shadow:0 0 0 3px #08131d,0 18px 60px #000}#good-boys-premise .gbp-kicker{color:#8df1ce;font-size:11px;letter-spacing:.16em}#good-boys-premise h2{margin:10px 0 14px;color:#fff;font-size:clamp(22px,6vw,38px);line-height:1.05}#good-boys-premise p{font-size:clamp(13px,3.5vw,17px);line-height:1.55;color:#d7e9f3}#good-boys-premise .gbp-route{margin:18px 0;padding:12px;border-left:3px solid #ffd166;background:#0b1722;color:#ffd166;font-weight:700;line-height:1.5}#good-boys-premise button{width:100%;min-height:54px;border:1px solid #67e8f9;background:#0a1a28;color:#fff;font:700 13px monospace;letter-spacing:.08em;touch-action:manipulation}";(root.document.head||root.document.documentElement).appendChild(css);}
      root.document.body.appendChild(premise);var b=premise.querySelector("button");var finish=function(e){if(e){e.preventDefault();e.stopPropagation();}try{premise.remove();}catch(_){}premise=null;resolve();};b.addEventListener("click",finish,{once:true});
    });
  }
  async function playOpening(){
    if(!root.GoodDogsCutscenes||typeof root.GoodDogsCutscenes.play!=="function"){root.__goodBoysDirectIntroMediaError="GoodDogsCutscenes unavailable";return;}
    await root.GoodDogsCutscenes.play("GD_CUT_01",{force:true,muted:true});
    await root.GoodDogsCutscenes.play("GD_CUT_02",{force:true,muted:true});
  }
  async function launch(e){
    if(e){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();}
    if(launching||attached())return false;
    launching=true;bypass();dismissLegacy();
    var b=button(),old=b&&b.textContent;if(b){b.disabled=true;b.textContent="OPENING TRANSMISSION…";}
    try{await playOpening();}catch(err){root.__goodBoysDirectIntroMediaError=String(err&&err.stack||err);}
    try{await showPremise();}catch(err2){root.__goodBoysPremiseError=String(err2&&err2.stack||err2);}
    if(b){b.disabled=false;b.textContent=old||"🐕 GOOD BOYS — 118 / 1984 BREAKOUT";}
    root.setTimeout(function(){startCampaign();root.setTimeout(function(){verify(1);},350);},0);
    return true;
  }
  function install(){var b=button();if(!b)return false;bypass();b.addEventListener("click",launch,true);return true;}
  var timer=root.setInterval(function(){if(install())root.clearInterval(timer);},50);install();
  root.TechOpsGoodBoysIntroRepair={VERSION:VERSION,launch:launch,install:install,get launching(){return launching;}};
})(typeof globalThis!=="undefined"?globalThis:this);
