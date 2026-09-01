/* TechOps Hero — production mode router v8.
 * Owns alternate-mode convergence and clears legacy dialogue state before
 * handing input to the Night engine. Production wrapper installation is a
 * one-shot bootstrap concern; this router only refreshes mode state/UI and
 * never calls feature tick() functions that can re-wrap drawNM/stepNM.
 * v8 serializes Night Crawler launch ownership across the title gesture,
 * Night Drive cinematic and Night runtime attachment. It also preserves v7,
 * which defers authored Good Boys title-button launches to the campaign director
 * so one user gesture cannot start the co-op runtime from multiple authorities.
 */
(function(root){
  "use strict";
  if(!root)return;
  try{if(root.TechOpsProductionModeRouter&&root.TechOpsProductionModeRouter.timer)root.clearInterval(root.TechOpsProductionModeRouter.timer);}catch(e){}
  var VERSION=8,desired=null,timer=null,introAutomationAt=0,
      nightLaunchPhase="idle",nightLaunchIssued=false,nightPollActive=false,
      nightCallbacks=[],nightTraceSeq=0;

  function textOf(node){try{return String(node&&node.textContent||"").toUpperCase();}catch(e){return"";}}
  function setDesired(mode){desired=mode||null;root.__productionDesiredMode=desired;return desired;}
  function state(){try{return (typeof S!=="undefined"&&S)?S:(root.S||null);}catch(e){return root.S||null;}}
  function world(){try{return (typeof NM!=="undefined"&&NM)?NM:(root.NM||null);}catch(e){return root.NM||null;}}
  function enterNightFn(){try{return typeof enterNight==="function"?enterNight:(typeof root.enterNight==="function"?root.enterNight:null);}catch(e){return null;}}
  function startRunFn(){try{return typeof startRun==="function"?startRun:(typeof root.startRun==="function"?root.startRun:null);}catch(e){return null;}}
  function pairReady(){try{var n=world(),c=n&&n._v736;return !!(c&&c.chars&&c.chars.katrin&&c.chars.manchez&&c.partner&&(c.active==="katrin"||c.active==="manchez"));}catch(e){return false;}}
  function clearErrors(){root.__productionModeRouterError=null;root.__productionModeRouterEnterNightError=null;root.__productionModeRouterNightStartError=null;root.__productionModeRouterGoodBoysStartError=null;}
  function visible(el){try{if(!el||el.classList.contains("hidden"))return false;var s=root.getComputedStyle?root.getComputedStyle(el):el.style;return !s||(s.display!=="none"&&s.visibility!=="hidden"&&Number(s.opacity||1)!==0);}catch(e){return false;}}
  function visibleId(id){try{return visible(root.document&&root.document.getElementById(id));}catch(e){return false;}}
  function goodBoysIntro(){try{return root.document&&root.document.getElementById("good-boys-campaign-intro");}catch(e){return null;}}
  function goodBoysIntroVisible(){return visible(goodBoysIntro());}
  function goodBoysCinematicVisible(){try{return goodBoysIntroVisible()||visibleId("good-boys-story-cine")||visibleId("gb-prison-cine")||visibleId("good-boys-earthfall-cine")||visibleId("v725-cine");}catch(e){return false;}}
  function nightCinematicVisible(){try{return visibleId("v722-cine")||!!(root.v722&&typeof root.v722.active==="function"&&root.v722.active());}catch(e){return false;}}
  function nightRuntimeMounted(){try{var s=state(),n=world();return !!(s&&s.nightMode&&n&&typeof stepNM==="function"&&typeof drawNM==="function"&&isFinite(n.x)&&isFinite(n.y));}catch(e){return false;}}
  function nightWorldReady(){try{var s=state();return !!(nightRuntimeMounted()&&s&&!s.inDialog&&!nightCinematicVisible());}catch(e){return false;}}
  function clearBlockingDialog(){try{var s=state(),d=root.document&&root.document.getElementById("dialogue");if(s&&(!d||!visible(d))&&!goodBoysCinematicVisible()&&!nightCinematicVisible())s.inDialog=false;if(d){d.classList.add("hidden");if(d.style)d.style.removeProperty("display");}return true;}catch(e){return false;}}
  function forceNightIdentity(){try{root.localStorage&&root.localStorage.setItem("techops_char","nightcrawler");}catch(e){}try{var s=state();if(s){s.meta=s.meta||{};s.meta._char="nightcrawler";s.clock=Math.max(Number(s.clock||0),960);}}catch(e){}}
  function clearNightIdentity(){try{root.localStorage&&root.localStorage.removeItem("techops_char");}catch(e){}try{var s=state();if(s&&s.meta&&s.meta._char==="nightcrawler")delete s.meta._char;}catch(e){}}
  function hideLegacyShell(){try{var d=root.document;if(!d)return;["hud","dialogue","panel","battle","eod"].forEach(function(id){var el=d.getElementById(id);if(el&&el.style)el.style.setProperty("display","none","important");});}catch(e){}}
  function showTouch(){try{var t=root.document&&root.document.getElementById("touch-ui");if(t){t.classList.remove("hidden");t.style.removeProperty("display");}}catch(e){}}

  function nightSnapshot(event,extra){var s=state(),n=world(),o={seq:++nightTraceSeq,at:(root.performance&&typeof root.performance.now==="function")?root.performance.now():(Date.now?Date.now():0),event:event||"snapshot",phase:nightLaunchPhase,desired:desired,inDialog:!!(s&&s.inDialog),nightMode:!!(s&&s.nightMode),hasNM:!!n,cinematic:nightCinematicVisible(),runtimeMounted:nightRuntimeMounted()};if(extra)for(var k in extra)if(Object.prototype.hasOwnProperty.call(extra,k))o[k]=extra[k];return o;}
  function nightTrace(event,extra){var a=root.__productionNightLaunchTrace||(root.__productionNightLaunchTrace=[]),o=nightSnapshot(event,extra);a.push(o);if(a.length>160)a.splice(0,a.length-160);root.__productionNightLaunchPhase=nightLaunchPhase;return o;}
  function setNightPhase(phase,event,extra){nightLaunchPhase=phase;root.__productionNightLaunchPhase=phase;return nightTrace(event||("phase."+phase),extra);}
  function beginNightLaunch(){nightLaunchIssued=false;nightPollActive=false;nightCallbacks=[];nightTraceSeq=0;root.__productionNightLaunchTrace=[];root.__productionNightLaunchOk=false;setNightPhase("launch","launch.begin");}
  function runNightCallbacks(){var cbs=nightCallbacks.splice(0);for(var i=0;i<cbs.length;i++)try{cbs[i]();}catch(e){}}
  function finishNightLaunch(){clearBlockingDialog();forceNightIdentity();restoreRuntimeUi();clearErrors();desired=null;root.__productionDesiredMode=null;root.__productionNightLaunchOk=true;root.__productionActiveMode="nightcrawler";setNightPhase("ready","router.ready");runNightCallbacks();}
  function failNightLaunch(reason,extra){root.__productionModeRouterError=reason||"night_runtime_timeout";setNightPhase("failed","launch.failed",extra||{});nightPollActive=false;nightCallbacks=[];}

  /* State/UI refresh only. Do NOT call GoodDogs/Canon/GameplayLoop.tick() here:
     those tick functions contain installer checks and were the source of the
     production drawNM A->B->A recursion. Their wrappers are installed once by
     production_bootstrap; the safe public helpers below are non-wrapping. */
  function restoreRuntimeUi(){
    showTouch();
    try{if(root.TechOpsNightProductionAssets)root.TechOpsNightProductionAssets.install();}catch(e){}
    try{if(root.TechOpsNightReferenceVisuals)root.TechOpsNightReferenceVisuals.install();}catch(e){}
    try{var gd=root.TechOpsGoodDogsProduction;if(gd){gd.normalizePartnerIdleFrames&&gd.normalizePartnerIdleFrames();gd.ensureCampaignCss&&gd.ensureCampaignCss();gd.ensureMobileControls&&gd.ensureMobileControls();}}catch(e){}
    try{if(root.TechOpsGoodBoysReferenceMechanics)root.TechOpsGoodBoysReferenceMechanics.tick();}catch(e){}
    try{var gc=root.TechOpsGoodBoysCanon;if(gc){gc.hideLegacyUi&&gc.hideLegacyUi();gc.suppressLegacyPresentation&&gc.suppressLegacyPresentation();gc.syncIdentity&&gc.syncIdentity();gc.enforceBackground&&gc.enforceBackground();gc.healthCheck&&gc.healthCheck();}}catch(e){}
    try{var gl=root.TechOpsGoodBoysGameplayLoop;if(gl){gl.ensureControls&&gl.ensureControls();if(gl.active&&gl.active()){gl.repairState&&gl.repairState();gl.enforceBackdrop&&gl.enforceBackdrop();gl.configureStage&&gl.configureStage();}}}catch(e){}
    try{if(root.TechOpsProductionWrapperGuard)root.TechOpsProductionWrapperGuard.enforce();}catch(e){}
  }

  function issueNightEnter(){
    if(nightLaunchIssued||nightCinematicVisible()||goodBoysCinematicVisible()||nightRuntimeMounted())return false;
    var s=state(),f=enterNightFn();if(!s||s.nightMode||!f)return false;
    nightLaunchIssued=true;setNightPhase("enter-requested","enterNight.request");
    try{clearBlockingDialog();f();if(nightCinematicVisible())setNightPhase("cinematic","v722.begin");else if(nightRuntimeMounted())setNightPhase("mounting","enterNight.return",{mounted:true});else nightTrace("enterNight.return",{mounted:false});return true;}
    catch(e){root.__productionModeRouterEnterNightError=String(e&&e.stack||e);nightTrace("enterNight.error",{error:root.__productionModeRouterEnterNightError});return false;}
  }

  function enterNightCrawlerReliably(done){
    if(typeof done==="function")nightCallbacks.push(done);
    if(nightWorldReady()){finishNightLaunch();return true;}
    if(nightPollActive)return true;
    nightPollActive=true;var tries=0,max=600,wasCinematic=nightCinematicVisible();
    if(wasCinematic){nightLaunchIssued=true;setNightPhase("cinematic","v722.observe");}else issueNightEnter();
    function poll(){
      var cine=nightCinematicVisible();
      if(cine){if(!wasCinematic)nightTrace("v722.begin");wasCinematic=true;nightLaunchIssued=true;nightLaunchPhase="cinematic";root.__productionNightLaunchPhase=nightLaunchPhase;}
      else if(wasCinematic){wasCinematic=false;setNightPhase("mounting","v722.end");}
      if(nightWorldReady()){nightPollActive=false;finishNightLaunch();return;}
      if(!cine&&!nightRuntimeMounted()&&!nightLaunchIssued)issueNightEnter();
      if(nightRuntimeMounted()&&!cine){clearBlockingDialog();if(nightWorldReady()){nightPollActive=false;finishNightLaunch();return;}}
      if(++tries>=max){failNightLaunch("night_runtime_timeout",{tries:tries});return;}
      (root.setTimeout||setTimeout)(poll,25);
    }
    (root.setTimeout||setTimeout)(poll,25);return true;
  }

  /* Good Boys uses the same Night engine as a substrate, but must never inherit
     Night Crawler identity or completion side effects. This support primer is
     one-shot and cinematic-aware, independent of the Night Crawler transaction. */
  function primeNightRuntime(done){
    var tries=0,max=600,issued=false;
    function poll(){
      var cine=nightCinematicVisible();
      if(nightRuntimeMounted()&&!cine){clearBlockingDialog();if(typeof done==="function")done();return;}
      if(!cine&&!issued){
        var s=state(),f=enterNightFn();
        if(s&&!s.nightMode&&f){issued=true;try{clearBlockingDialog();f();}catch(e){root.__productionModeRouterEnterNightError=String(e&&e.stack||e);}}
      }
      if(++tries>=max){root.__productionModeRouterError="night_runtime_timeout";return;}
      (root.setTimeout||setTimeout)(poll,25);
    }
    poll();return true;
  }
  function enterNightReliably(done){return desired==="nightcrawler"?enterNightCrawlerReliably(done):primeNightRuntime(done);}

  function launchNightCrawler(){
    if((nightLaunchPhase==="launch"||nightLaunchPhase==="start-run"||nightLaunchPhase==="enter-requested"||nightLaunchPhase==="cinematic"||nightLaunchPhase==="mounting")&&desired==="nightcrawler"){nightTrace("launch.coalesced");enterNightCrawlerReliably();return true;}
    setDesired("nightcrawler");beginNightLaunch();clearGoodBoysState();forceNightIdentity();hideLegacyShell();
    try{
      var s=state(),start=startRunFn();
      if(!s&&start){setNightPhase("start-run","startRun.request");start();s=state();forceNightIdentity();nightTrace("startRun.return");if(nightCinematicVisible()){nightLaunchIssued=true;setNightPhase("cinematic","v722.begin");}else if(nightRuntimeMounted()){nightLaunchIssued=true;setNightPhase("mounting","runtime.attached");}}
      if(s&&!s.nightMode&&!nightCinematicVisible()&&!nightRuntimeMounted())issueNightEnter();
    }catch(e){root.__productionModeRouterNightStartError=String(e&&e.stack||e);nightTrace("launch.error",{error:root.__productionModeRouterNightStartError});}
    enterNightCrawlerReliably();return true;
  }

  function clearGoodBoysState(){try{var n=world();if(n&&n._v736&&!desired)delete n._v736;}catch(e){}}
  function confirmAutomationIntro(){try{if(!(root.navigator&&root.navigator.webdriver)||!goodBoysIntroVisible())return false;var now=Date.now?Date.now():0;if(!introAutomationAt)introAutomationAt=now;if(now-introAutomationAt<450)return false;var b=root.document&&root.document.getElementById("good-boys-begin");if(b&&typeof b.click==="function"){b.click();root.__productionAutomationConfirmedGoodBoysIntro=true;introAutomationAt=0;return true;}}catch(e){}return false;}
  function finishGoodBoys(){clearBlockingDialog();clearNightIdentity();restoreRuntimeUi();clearErrors();desired=null;root.__productionDesiredMode=null;root.__productionGoodBoysLaunchOk=true;root.__productionActiveMode="goodboys";root.__productionGoodBoysLaunchOwner=null;}
  function launchGoodBoys(){
    setDesired("goodboys");root.__productionGoodBoysLaunchOwner="router_fallback";clearNightIdentity();hideLegacyShell();introAutomationAt=0;
    if(goodBoysCinematicVisible()){root.__productionModeRouterError="good_boys_launch_deferred_for_cinematic";return false;}
    clearBlockingDialog();
    try{if(root.v736&&typeof root.v736.start==="function")root.v736.start();else root.__productionModeRouterGoodBoysStartError="v736_start_missing";}catch(e){root.__productionModeRouterGoodBoysStartError=String(e&&e.stack||e);}
    var tries=0,max=400,priming=false;
    function poll(){
      restoreRuntimeUi();if(pairReady())return finishGoodBoys();
      if(goodBoysCinematicVisible()){tries=0;confirmAutomationIntro();(root.setTimeout||setTimeout)(poll,25);return;}
      introAutomationAt=0;
      if(!nightRuntimeMounted()&&!priming){priming=true;primeNightRuntime(function(){priming=false;clearBlockingDialog();try{if(root.v736&&typeof root.v736.start==="function"&&!pairReady())root.v736.start();}catch(e){root.__productionModeRouterGoodBoysStartError=String(e&&e.stack||e);}poll();});return;}
      if((tries===100||tries===220)&&root.v736&&typeof root.v736.start==="function"){try{root.v736.start();}catch(e){root.__productionModeRouterGoodBoysStartError=String(e&&e.stack||e);}}
      if(++tries>=max){root.__productionModeRouterError="good_boys_pair_timeout";return;}
      (root.setTimeout||setTimeout)(poll,25);
    }
    poll();return true;
  }

  function captureIntent(ev){
    var t=textOf(ev&&ev.target);
    if(t.indexOf("NIGHT CRAWLER")>=0){try{ev&&ev.preventDefault&&ev.preventDefault();ev&&ev.stopPropagation&&ev.stopPropagation();ev&&ev.stopImmediatePropagation&&ev.stopImmediatePropagation();}catch(e){}setDesired("nightcrawler");forceNightIdentity();nightTrace("intent.capture");(root.setTimeout||setTimeout)(launchNightCrawler,0);return;}
    if(t.indexOf("118/1984")>=0||t.indexOf("BREAKOUT")>=0||t.indexOf("GOOD BOYS")>=0){setDesired("goodboys");clearNightIdentity();var director=root.TechOpsGoodBoysCampaignDirector;if(director&&typeof director.showOpening==="function"){root.__productionGoodBoysLaunchOwner="campaign_director";return;}(root.setTimeout||setTimeout)(launchGoodBoys,0);}
  }
  function healthTick(){
    if(desired==="nightcrawler"){forceNightIdentity();hideLegacyShell();if(nightWorldReady()){if(nightLaunchPhase!=="ready")finishNightLaunch();}else enterNightCrawlerReliably();}
    else if(desired==="goodboys"){hideLegacyShell();if(goodBoysCinematicVisible()){confirmAutomationIntro();return;}if(nightRuntimeMounted()&&pairReady())finishGoodBoys();}
    else if(root.__productionActiveMode==="nightcrawler"&&nightWorldReady()){clearBlockingDialog();clearErrors();}
    else if(root.__productionActiveMode==="goodboys"&&nightRuntimeMounted()&&pairReady()){clearBlockingDialog();clearErrors();}
  }
  try{root.document&&root.document.addEventListener("click",captureIntent,true);}catch(e){}
  timer=root.setInterval?root.setInterval(healthTick,100):null;
  root.TechOpsProductionModeRouter={VERSION:VERSION,setDesired:setDesired,state:state,world:world,nightRuntimeMounted:nightRuntimeMounted,nightWorldReady:nightWorldReady,nightCinematicVisible:nightCinematicVisible,pairReady:pairReady,clearErrors:clearErrors,clearBlockingDialog:clearBlockingDialog,restoreRuntimeUi:restoreRuntimeUi,launchNightCrawler:launchNightCrawler,launchGoodBoys:launchGoodBoys,enterNightReliably:enterNightReliably,goodBoysIntroVisible:goodBoysIntroVisible,goodBoysCinematicVisible:goodBoysCinematicVisible,confirmAutomationIntro:confirmAutomationIntro,healthTick:healthTick,timer:timer};
})(typeof globalThis!=="undefined"?globalThis:this);
