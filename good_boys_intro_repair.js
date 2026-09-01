/* TechOps Hero — Good Boys direct cinematic intro v5
 * The legacy four-card preamble is intentionally retired. Launching Good Boys
 * now opens on GD_CUT_01, then enters the canonical v7.36 campaign.
 */
(function(root){
  "use strict";
  if(!root||root.TechOpsGoodBoysIntroRepair)return;
  var VERSION=5,launching=false;
  function button(){return root.document&&root.document.getElementById("btn-v736");}
  function bypass(){var b=button();if(!b)return false;b.dataset.gbdBypass="1";b.dataset.gbiRepair="1";return true;}
  function attached(){try{return !!(root.NM&&root.NM._v736);}catch(_){return false;}}
  function dismissLegacy(){try{var n=root.document&&root.document.getElementById("good-boys-story-cine");if(n)n.remove();}catch(_){}try{if(root.document&&root.document.body)root.document.body.classList.remove("good-boys-cinematic");}catch(_){} }
  function canonicalClockIn(){try{var title=root.document&&root.document.getElementById("title-screen");if(title&&!title.classList.contains("hidden")){var start=root.document.getElementById("btn-start");if(start){start.click();return true;}}return true;}catch(e){root.__goodBoysDirectIntroClockInError=String(e&&e.stack||e);return false;}}
  function startCampaign(){try{canonicalClockIn();root.__gbiSkipBuiltinM1=true;root.__gbdSkipBuiltinM1=true;if(root.v736&&typeof root.v736.start==="function"){root.v736.start();return true;}}catch(e){root.__goodBoysDirectIntroStartError=String(e&&e.stack||e);}return false;}
  function verify(attempt){if(attached()){launching=false;root.__goodBoysDirectIntro={ok:true,at:Date.now(),attempt:attempt};return;}if(attempt<2){startCampaign();root.setTimeout(function(){verify(attempt+1);},300);return;}launching=false;root.__goodBoysDirectIntro={ok:false,at:Date.now(),attempt:attempt,error:root.__goodBoysDirectIntroStartError||"campaign did not attach"};}
  async function launch(e){
    if(e){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();}
    if(launching||attached())return false;
    launching=true;bypass();dismissLegacy();
    var b=button(),old=b&&b.textContent;if(b){b.disabled=true;b.textContent="OPENING TRANSMISSION…";}
    try{if(root.GoodDogsCutscenes&&typeof root.GoodDogsCutscenes.play==="function")await root.GoodDogsCutscenes.play("GD_CUT_01");else root.__goodBoysDirectIntroMediaError="GoodDogsCutscenes unavailable";}catch(err){root.__goodBoysDirectIntroMediaError=String(err&&err.stack||err);}
    if(b){b.disabled=false;b.textContent=old||"🐕 GOOD BOYS — 118 / 1984 BREAKOUT";}
    root.setTimeout(function(){startCampaign();root.setTimeout(function(){verify(1);},350);},0);
    return true;
  }
  function install(){var b=button();if(!b)return false;bypass();b.addEventListener("click",launch,true);return true;}
  var timer=root.setInterval(function(){if(install())root.clearInterval(timer);},50);install();
  root.TechOpsGoodBoysIntroRepair={VERSION:VERSION,launch:launch,install:install,get launching(){return launching;}};
})(typeof globalThis!=="undefined"?globalThis:this);
