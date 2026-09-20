/* TechOps Hero — Good Dogs title-button authority v16.
 *
 * Fresh route: playable M1 at Waldo's property; no ship footage before discovery.
 * Resume route: the persisted campaign mission, without replaying the opener.
 * M2 owns GD_CUT_01 -> cockpit -> GD_CUT_02 -> flight -> crash -> M3 through the ship-flight
 * authority. This module never resets an existing save to M3.
 */
(function(root){
  "use strict";
  if(!root||!root.document)return;
  var PRIOR=root.TechOpsGoodBoysButtonHardFix;
  if(PRIOR&&Number(PRIOR.VERSION||0)>=16)return;
  var VERSION=16,STANDALONE_ORIGIN="standalone",GOOD_DOGS_SAVE_KEY=root.TechOpsSaveKeys&&root.TechOpsSaveKeys.goodDogs||"techops_good_dogs_session_v1",lastLaunch=0,launching=false,depTimer=0,presentationToken=null;

  function target(t){try{return t&&t.closest&&t.closest("#btn-v736");}catch(_){return null;}}
  function meta(){try{return root.S&&root.S.meta&&root.S.meta._v736||null;}catch(_){return null;}}
  function tagStandalone(state,campaign){
    try{
      if(state){state.meta=state.meta||{};state.meta._standaloneMode="gooddogs";if(state.meta._v736)state.meta._v736.campaignOrigin=STANDALONE_ORIGIN;}
      if(campaign)campaign.campaignOrigin=STANDALONE_ORIGIN;
      return state||null;
    }catch(e){root.__goodBoysOriginTagError=String(e&&e.stack||e);return state||null;}
  }
  function clearForeignIdentity(state){
    try{var seen=[],items=[state,root.S];for(var i=0;i<items.length;i++){var s=items[i];if(!s||seen.indexOf(s)>=0||!isStandaloneState(s))continue;seen.push(s);if(s.meta&&Object.prototype.hasOwnProperty.call(s.meta,"_char"))delete s.meta._char;}}catch(_){}
    return state||null;
  }
  function isStandaloneState(state){try{return!!(state&&state.meta&&state.meta._standaloneMode==="gooddogs"&&state.meta._v736&&state.meta._v736.campaignOrigin==="standalone");}catch(e){return false;}}
  function durableState(){try{var live=root.S;if(isStandaloneState(live))return live;var raw=root.localStorage&&root.localStorage.getItem(GOOD_DOGS_SAVE_KEY),saved=raw&&JSON.parse(raw);if(!isStandaloneState(saved))saved=null;if(!saved){var legacyRaw=root.localStorage&&root.localStorage.getItem("techops_save"),legacy=legacyRaw&&JSON.parse(legacyRaw);if(legacy&&legacy.meta&&legacy.meta._v736){saved=JSON.parse(JSON.stringify(legacy));root.__goodBoysLegacyResumeCandidate={mission:Number(saved.meta._v736.m)||1,at:Date.now()};}}if(!saved)return null;if(saved.meta._v736.done&&Number(saved.meta._v736.m)>8)saved.meta._v736.m=8;var validator=root.TechOpsStateValidator;if(validator&&typeof validator.validate==="function"){var vr=validator.validate(saved,null);if(!vr.valid){root.__goodBoysResumeValidationFailure=vr;return null;}}return saved;}catch(e){root.__goodBoysResumeLoadError=String(e&&e.stack||e);return null;}}
  function freshConfig(){return{mission:1,k:false,waldo:false,evidence:[],fresh:true,done:false,state:null,campaign:null};}
  function launchConfig(){
    var state=durableState(),m=state&&state.meta&&state.meta._v736;if(!m)return freshConfig();
    tagStandalone(state,m);clearForeignIdentity(state);
    if(m.done)return{mission:8,k:!!m.k,waldo:!!m.waldo,evidence:(m.evidence||[]).slice(),fresh:false,done:true,state:state,campaign:m};
    var mission=Math.max(1,Math.min(7,Number(m.m)||1));
    return{mission:mission,k:!!m.k,waldo:!!m.waldo,evidence:(m.evidence||[]).slice(),fresh:false,done:false,state:state,campaign:m};
  }
  function persistModeChoice(cfg,mode){
    mode=mode==="local"?"local":"solo";cfg=cfg||freshConfig();cfg.playMode=mode;var state=cfg.state||(!cfg.fresh&&root.S)||null;
    try{if(!state&&typeof root.newState==="function")state=root.newState();}catch(e){root.__goodBoysModeChoiceStateError=String(e&&e.stack||e);}
    if(!state){root.__goodBoysModeChoicePersisted={ok:false,mode:mode,reason:"state-unavailable",at:Date.now()};return false;}
    state.meta=state.meta||{};var campaign=state.meta._v736||(state.meta._v736={m:1,evidence:[],k:false,waldo:false,done:false,pairPuzzles:{}});campaign.playMode=mode;campaign.pairPuzzles=campaign.pairPuzzles||{};cfg.state=state;cfg.campaign=campaign;tagStandalone(state,campaign);clearForeignIdentity(state);
    var ok=false;
    try{
      if(root.S===state&&typeof root.save==="function")ok=root.save()!==false;
      else if(root.localStorage){var validator=root.TechOpsStateValidator,vr=validator&&typeof validator.validate==="function"?validator.validate(state,null):{valid:true};if(!vr.valid){root.__goodBoysModeChoiceValidationFailure=vr;}else{root.localStorage.setItem(GOOD_DOGS_SAVE_KEY,JSON.stringify(state));ok=true;}}
    }catch(e){root.__goodBoysModeChoiceSaveError=String(e&&e.stack||e);ok=false;}
    root.__goodBoysModeChoicePersisted={ok:ok,mode:mode,mission:Number(campaign.m)||1,at:Date.now()};return ok;
  }
  function phase(name,extra){root.__goodBoysOpeningPhase=Object.assign({phase:name,owner:"hard-title-button-v16",at:Date.now()},extra||{});}
  function clearForeignUi(){
    try{["act1-reference","good-boys-story-cine","good-boys-premise","good-boys-ship-interlude","good-boys-opening-error","good-boys-deck-v4","good-boys-deck-supplied","good-boys-flight-v4","good-boys-crash-v4","good-boys-crash-canonical","good-boys-prison-approach-cine","good-boys-ship-flight"].forEach(function(id){var n=root.document.getElementById(id);if(n)n.remove();});}catch(_){}
    try{var d=root.document.getElementById("dialogue");if(d)d.classList.add("hidden");if(root.S)root.S.inDialog=false;}catch(_){}
    try{var p=root.document.getElementById("panel");if(p)p.classList.add("hidden");var e=root.document.getElementById("eod");if(e)e.classList.add("hidden");}catch(_){}
  }
  function cleanOwnedPresentation(){try{var guard=root.TechOpsProductionPresentationGuard;if(guard&&typeof guard.clean==="function")guard.clean();}catch(_){} }
  function setButton(text,disabled){try{var b=root.document.getElementById("btn-v736");if(b){b.disabled=!!disabled;b.textContent=text;}}catch(_){} }
  function depsReady(){var c=root.GoodDogsCutscenes,a=root.TechOpsGoodDogsSingleAtlasAuthority,p=root.TechOpsGoodBoysProgressionAuthority;return!!(root.__productionBootstrapReady===true&&root.__techopsWrapperGuardInstalled===true&&root.__goodBoysShipFlightInstalled===true&&root.TechOpsGoodDogsHomeScene&&root.TechOpsGoodDogsCoop&&c&&parseFloat(c.VERSION||0)>=3.4&&typeof c.play==="function"&&a&&Number(a.VERSION||0)>=2&&a.installed!==false&&p&&Number(p.VERSION||0)>=14&&root.v736&&typeof root.v736.start==="function");}
  function dependencySnapshot(){return{productionReady:root.__productionBootstrapReady===true,wrapperReady:root.__techopsWrapperGuardInstalled===true,shipFlightReady:root.__goodBoysShipFlightInstalled===true,bootstrapError:root.__productionBootstrapError||root.__productionBootstrapWireError||null,cutscenes:root.GoodDogsCutscenes&&root.GoodDogsCutscenes.VERSION||null,atlas:root.TechOpsGoodDogsSingleAtlasAuthority&&root.TechOpsGoodDogsSingleAtlasAuthority.VERSION||null,progression:root.TechOpsGoodBoysProgressionAuthority&&root.TechOpsGoodBoysProgressionAuthority.VERSION||null,v736:root.v736&&root.v736.version||null,registry:root.TechOpsLevelRegistry&&root.TechOpsLevelRegistry.VERSION||null};}
  function waitForDeps(timeout){return new Promise(function(resolve,reject){var start=Date.now();function poll(){if(depsReady()){resolve(true);return;}if(Date.now()-start>=timeout){var e=new Error("Good Dogs dependencies not ready: "+JSON.stringify(dependencySnapshot()));e.code="GOOD_DOGS_DEPS_TIMEOUT";reject(e);return;}depTimer=root.setTimeout(poll,50);}poll();});}
  function esc(v){return String(v==null?"":v).replace(/[&<>\"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;"}[c];});}
  function endPresentation(outcome){try{var d=root.TechOpsPresentationDirector;if(presentationToken&&d&&d.end)d.end(presentationToken,outcome||"completed");}catch(_){}presentationToken=null;}
  function showOpeningError(err){
    endPresentation("error");var old=root.document.getElementById("good-boys-opening-error");if(old)old.remove();
    var ph=root.__goodBoysOpeningPhase&&root.__goodBoysOpeningPhase.phase||"unknown",msg=String(err&&err.message||err||"Unknown opening failure"),box=root.document.createElement("div");
    box.id="good-boys-opening-error";box.style.cssText="position:fixed;inset:0;z-index:160000;display:flex;align-items:center;justify-content:center;padding:22px;background:#02050af2;color:#eaf6ff;font-family:monospace";
    box.innerHTML='<div style="width:min(620px,100%);border:1px solid #ff6b81;background:#071019;padding:22px;box-shadow:0 18px 60px #000"><div style="color:#ff8fa3;font-weight:700;letter-spacing:.12em">GOOD DOGS OPENING ERROR</div><p style="line-height:1.55;margin-bottom:10px">The story stopped safely before gameplay. No mission state was skipped.</p><div style="border:1px solid #294252;background:#040a10;padding:10px;margin:0 0 14px;font-size:11px;line-height:1.45"><b style="color:#72dcff">FAILED PHASE:</b> '+esc(ph)+'<br><b style="color:#ffb14a">REASON:</b> '+esc(msg)+'</div><button type="button" style="width:100%;min-height:52px;border:1px solid #67e8f9;background:#0a1a28;color:#fff;font:700 13px monospace">RETRY OPENING</button></div>';
    root.document.body.appendChild(box);box.querySelector("button").onclick=function(){box.remove();launch("retry");};
    root.__goodBoysOpeningError=String(err&&err.stack||err);root.__goodBoysOpeningErrorDetail={phase:ph,message:msg,deps:dependencySnapshot(),at:Date.now(),version:VERSION};root.__goodBoysHardButtonLaunch={ok:false,status:"opening-error",phase:ph,error:msg,at:Date.now(),version:VERSION};
  }
  function validMovieResult(result,id){if(!result)throw new Error(id+" returned no result");var status=result.status||result.result;if(status&&status!=="COMPLETED"&&status!=="USER_SKIPPED")throw new Error(id+" did not complete: "+String(status));return result;}
  function mount(cfg,source){
    if(!root.v736||typeof root.v736.start!=="function")throw new Error("v736.start unavailable");tagStandalone(cfg&&cfg.state,cfg&&cfg.campaign);clearForeignIdentity(cfg&&cfg.state);clearForeignUi();endPresentation("completed");
    if(cfg.done){
      phase("earthfall-replay",{mission:8});
      var restored=root.v736.start({mission:8,k:true,waldo:true,evidence:cfg.evidence||[],state:cfg.state,campaign:cfg.campaign,suppressDoneReplay:true});if(restored===false)throw new Error("Completed Good Dogs state could not be restored");tagStandalone(root.S,meta());clearForeignIdentity(root.S);cleanOwnedPresentation();
      var semantic=root.TechOpsGoodDogsCampaignState;if(!semantic||typeof semantic.completeReturn!=="function")throw new Error("Good Dogs completion authority is unavailable");semantic.completeReturn();
      try{if(typeof root.save==="function"&&root.save()===false)throw new Error("completed Good Dogs state could not be saved");}catch(e){root.__goodBoysIdentitySaveError=String(e&&e.stack||e);throw e;}
      var earthfall=root.TechOpsGoodBoysEarthfallEnding;if(!earthfall||typeof earthfall.replay!=="function"||earthfall.replay()===false)throw new Error("Authored Earthfall replay is unavailable");
      launching=false;root.__goodBoysPhysicalLaunchActive=false;root.__goodBoysHardButtonLaunch={ok:restored!==false,status:"earthfall-replay",source:source||"unknown",mission:8,resume:true,authoredReplay:true,openingAuthority:"TechOpsGoodBoysButtonHardFix",at:Date.now(),version:VERSION};return restored!==false;
    }
    phase(cfg.fresh?"waldo-property-handoff":"campaign-resume",{mission:cfg.mission});
    var ok=root.v736.start({mission:cfg.mission,k:cfg.k,waldo:cfg.waldo,evidence:cfg.evidence||[],state:cfg.state,campaign:cfg.campaign,directGameplay:true}),c=root.NM&&root.NM._v736,m=meta();tagStandalone(root.S,m);clearForeignIdentity(root.S);cleanOwnedPresentation();
    if(!c||c.ending)throw new Error("Katrin/Manchez runtime did not mount synchronously");if(Number(c.m||0)!==cfg.mission)throw new Error("Good Dogs mounted wrong mission: "+String(c.m));
    if(!cfg.fresh&&(!m||Number(m.m)!==cfg.mission||!!m.k!==cfg.k||!!m.waldo!==cfg.waldo||JSON.stringify(m.evidence||[])!==JSON.stringify(cfg.evidence||[])))throw new Error("Good Dogs resume snapshot was not restored completely");
    if(m&&cfg.fresh)m.pairPuzzles={};
    root.TechOpsGoodDogsCoop.configure(cfg.playMode||m&&m.playMode||"solo");cleanOwnedPresentation();
    try{root.__goodBoysModeChoiceMountSave=typeof root.save!=="function"||root.save()!==false;}catch(e){root.__goodBoysModeChoiceMountSave=false;root.__goodBoysModeChoiceSaveError=String(e&&e.stack||e);}
    phase("campaign-gameplay",{mission:cfg.mission});root.__goodBoysPhysicalLaunchActive=false;root.__goodBoysHardButtonLaunch={ok:ok!==false,status:"campaign-gameplay",source:source||"unknown",mission:cfg.mission,resume:!cfg.fresh,pair:!!(c.chars&&c.chars.katrin&&c.chars.manchez),atlasAuthority:root.__goodDogsAtlasAuthority||null,actorAuthority:root.__goodDogsActorRenderAuthority||null,openingAuthority:"TechOpsGoodBoysButtonHardFix",openingContract:"playable M1 -> playable M2 -> board -> GD_CUT_01 -> cockpit -> GD_CUT_02 -> playable flight -> authored crash -> M3",at:Date.now(),version:VERSION};launching=false;return ok!==false;
  }
  async function opening(source,cfg){
    clearForeignIdentity(cfg&&cfg.state);phase("opening-dependencies");setButton("LOADING GOOD DOGS…",true);await waitForDeps(9000);
    phase("campaign-mode-choice");var director=root.TechOpsPresentationDirector;if(director)presentationToken=director.begin({id:"waldo-home-opening",owner:"good-dogs-title",mode:"gooddogs",blocking:true});
    var mode=await root.TechOpsGoodDogsHomeScene.choose();
    if(!mode){endPresentation("cancelled");launching=false;lastLaunch=0;root.__goodBoysPhysicalLaunchActive=false;setButton("GOOD DOGS PROTOCOL",false);phase("title");if(root.TechOpsProductionTitleExperience&&root.TechOpsProductionTitleExperience.routeCancelled)root.TechOpsProductionTitleExperience.routeCancelled("gooddogs");return false;}
    cfg.playMode=mode;if(!persistModeChoice(cfg,mode))throw new Error("Good Dogs mode choice could not be saved");root.TechOpsGoodDogsCoop.configure(mode);
    if(cfg.fresh){phase("waldo-house-prologue");await root.TechOpsGoodDogsHomeScene.play();}
    return mount(cfg,source);
  }
  function launch(source){
    var now=Date.now();if(launching||now-lastLaunch<700)return true;lastLaunch=now;launching=true;root.__goodBoysPhysicalLaunchActive=true;clearForeignIdentity(root.S);clearForeignUi();var cfg=launchConfig();
    root.__goodBoysHardButtonLaunch={ok:null,status:cfg.fresh?"opening":"resuming",source:source||"unknown",mission:cfg.mission,freshStoryStart:cfg.fresh,resume:!cfg.fresh,openingAuthority:"TechOpsGoodBoysButtonHardFix",openingContract:"M1 -> M2 -> board -> GD_CUT_01 -> cockpit -> GD_CUT_02 -> flight -> crash -> M3",at:now,version:VERSION};
    setButton(cfg.fresh?"OPENING GOOD DOGS PROTOCOL…":"RESUMING GOOD DOGS M"+cfg.mission+"…",true);
    opening(source,cfg).catch(function(err){launching=false;lastLaunch=0;root.__goodBoysPhysicalLaunchActive=false;setButton("RETRY GOOD DOGS PROTOCOL",false);showOpeningError(err);});return true;
  }
  function own(e){if(!target(e&&e.target))return;try{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();}catch(_){}launch(e&&e.type||"event");}
  root.document.addEventListener("pointerup",own,true);root.document.addEventListener("click",own,true);
  root.TechOpsGoodBoysButtonHardFix={VERSION:VERSION,GOOD_DOGS_SAVE_KEY:GOOD_DOGS_SAVE_KEY,launch:launch,freshConfig:freshConfig,durableState:durableState,launchConfig:launchConfig,persistModeChoice:persistModeChoice,tagStandalone:tagStandalone,clearForeignIdentity:clearForeignIdentity,opening:opening,mount:mount,clearForeignUi:clearForeignUi,depsReady:depsReady,dependencySnapshot:dependencySnapshot,get launching(){return launching;}};
})(typeof globalThis!=="undefined"?globalThis:this);
