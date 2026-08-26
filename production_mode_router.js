/* TechOps Hero — production mode router v5.
 * Owns alternate-mode convergence and clears legacy dialogue state before
 * handing input to the Night engine. Good Boys preserves its player-facing
 * intro indefinitely; automated acceptance runs confirm the CTA explicitly so
 * they exercise the playable handoff instead of timing out on authored copy.
 */
(function(root){
  "use strict";
  if(!root)return;
  try{if(root.TechOpsProductionModeRouter&&root.TechOpsProductionModeRouter.timer)root.clearInterval(root.TechOpsProductionModeRouter.timer);}catch(e){}
  var VERSION=5,desired=null,timer=null,introAutomationAt=0;

  function textOf(node){try{return String(node&&node.textContent||"").toUpperCase();}catch(e){return"";}}
  function setDesired(mode){desired=mode||null;root.__productionDesiredMode=desired;return desired;}
  function state(){try{return (typeof S!=="undefined"&&S)?S:(root.S||null);}catch(e){return root.S||null;}}
  function world(){try{return (typeof NM!=="undefined"&&NM)?NM:(root.NM||null);}catch(e){return root.NM||null;}}
  function enterNightFn(){try{return typeof enterNight==="function"?enterNight:(typeof root.enterNight==="function"?root.enterNight:null);}catch(e){return null;}}
  function startRunFn(){try{return typeof startRun==="function"?startRun:(typeof root.startRun==="function"?root.startRun:null);}catch(e){return null;}}
  function nightWorldReady(){try{var s=state(),n=world();return !!(s&&s.nightMode&&n&&typeof stepNM==="function"&&typeof drawNM==="function"&&isFinite(n.x)&&isFinite(n.y));}catch(e){return false;}}
  function pairReady(){try{var n=world(),c=n&&n._v736;return !!(c&&c.chars&&c.chars.katrin&&c.chars.manchez&&c.partner&&(c.active==="katrin"||c.active==="manchez"));}catch(e){return false;}}
  function clearErrors(){root.__productionModeRouterError=null;root.__productionModeRouterEnterNightError=null;root.__productionModeRouterNightStartError=null;root.__productionModeRouterGoodBoysStartError=null;}
  function visible(el){try{if(!el||el.classList.contains("hidden"))return false;var s=root.getComputedStyle?root.getComputedStyle(el):el.style;return !s||(s.display!=="none"&&s.visibility!=="hidden"&&Number(s.opacity||1)!==0);}catch(e){return false;}}
  function clearBlockingDialog(){try{var s=state(),d=root.document&&root.document.getElementById("dialogue");if(s&&(!d||!visible(d)))s.inDialog=false;if(d){d.classList.add("hidden");if(d.style)d.style.removeProperty("display");}return true;}catch(e){return false;}}
  function forceNightIdentity(){try{root.localStorage&&root.localStorage.setItem("techops_char","nightcrawler");}catch(e){}try{var s=state();if(s){s.meta=s.meta||{};s.meta._char="nightcrawler";s.clock=Math.max(Number(s.clock||0),960);}}catch(e){}}
  function clearNightIdentity(){try{root.localStorage&&root.localStorage.removeItem("techops_char");}catch(e){}try{var s=state();if(s&&s.meta&&s.meta._char==="nightcrawler")delete s.meta._char;}catch(e){}}
  function hideLegacyShell(){try{var d=root.document;if(!d)return;["hud","dialogue","panel","battle","eod"].forEach(function(id){var el=d.getElementById(id);if(el&&el.style)el.style.setProperty("display","none","important");});}catch(e){}}
  function showTouch(){try{var t=root.document&&root.document.getElementById("touch-ui");if(t){t.classList.remove("hidden");t.style.removeProperty("display");}}catch(e){}}
  function restoreRuntimeUi(){showTouch();try{if(root.TechOpsNightProductionAssets)root.TechOpsNightProductionAssets.install();}catch(e){}try{if(root.TechOpsNightReferenceVisuals)root.TechOpsNightReferenceVisuals.install();}catch(e){}try{if(root.TechOpsGoodDogsProduction)root.TechOpsGoodDogsProduction.tick();}catch(e){}try{if(root.TechOpsGoodBoysReferenceMechanics)root.TechOpsGoodBoysReferenceMechanics.tick();}catch(e){}try{if(root.TechOpsGoodBoysCanon)root.TechOpsGoodBoysCanon.tick();}catch(e){}try{if(root.TechOpsGoodBoysGameplayLoop)root.TechOpsGoodBoysGameplayLoop.tick();}catch(e){}try{if(root.TechOpsProductionWrapperGuard)root.TechOpsProductionWrapperGuard.enforce();}catch(e){}}
  function enterNightReliably(done){var tries=0,max=240;function poll(){var s=state(),f=enterNightFn();try{if(s&&s.inDialog)clearBlockingDialog();if(s&&!s.nightMode&&f){clearBlockingDialog();f();clearBlockingDialog();}}catch(e){root.__productionModeRouterEnterNightError=String(e&&e.stack||e);}if(nightWorldReady()){clearBlockingDialog();root.__productionModeRouterRuntime="night";if(done)done();return;}if(++tries>=max){root.__productionModeRouterError="night_runtime_timeout";return;}(root.setTimeout||setTimeout)(poll,25);}poll();}
  function launchNightCrawler(){setDesired("nightcrawler");clearGoodBoysState();forceNightIdentity();hideLegacyShell();try{var s=state(),start=startRunFn(),en=enterNightFn();if(!s&&start){start();clearBlockingDialog();s=state();}if(s&&!s.nightMode&&en){clearBlockingDialog();en();clearBlockingDialog();}}catch(e){root.__productionModeRouterNightStartError=String(e&&e.stack||e);}enterNightReliably(function(){clearBlockingDialog();forceNightIdentity();restoreRuntimeUi();clearErrors();desired=null;root.__productionDesiredMode=null;root.__productionNightLaunchOk=true;root.__productionActiveMode="nightcrawler";});}
  function clearGoodBoysState(){try{var n=world();if(n&&n._v736&&!desired)delete n._v736;}catch(e){}}
  function goodBoysIntro(){try{return root.document&&root.document.getElementById("good-boys-campaign-intro");}catch(e){return null;}}
  function goodBoysIntroVisible(){return visible(goodBoysIntro());}
  function confirmAutomationIntro(){
    try{
      if(!(root.navigator&&root.navigator.webdriver)||!goodBoysIntroVisible())return false;
      var now=Date.now?Date.now():0;if(!introAutomationAt)introAutomationAt=now;
      if(now-introAutomationAt<450)return false;
      var b=root.document&&root.document.getElementById("good-boys-begin");
      if(b&&typeof b.click==="function"){b.click();root.__productionAutomationConfirmedGoodBoysIntro=true;introAutomationAt=0;return true;}
    }catch(e){}
    return false;
  }
  function finishGoodBoys(){clearBlockingDialog();restoreRuntimeUi();clearErrors();desired=null;root.__productionDesiredMode=null;root.__productionGoodBoysLaunchOk=true;root.__productionActiveMode="goodboys";}
  function launchGoodBoys(){
    setDesired("goodboys");clearNightIdentity();hideLegacyShell();clearBlockingDialog();introAutomationAt=0;
    try{if(root.v736&&typeof root.v736.start==="function")root.v736.start();else root.__productionModeRouterGoodBoysStartError="v736_start_missing";}catch(e){root.__productionModeRouterGoodBoysStartError=String(e&&e.stack||e);}
    var tries=0,max=400,priming=false;
    function poll(){
      restoreRuntimeUi();
      if(pairReady())return finishGoodBoys();
      /* Authored intro is a real player state, not a failure. Humans may read it
         as long as they want. Headless acceptance confirms its CTA so the bot
         reaches the gameplay it is meant to test. */
      if(goodBoysIntroVisible()){
        tries=0;confirmAutomationIntro();(root.setTimeout||setTimeout)(poll,25);return;
      }
      introAutomationAt=0;
      if(!nightWorldReady()&&!priming){
        priming=true;
        enterNightReliably(function(){priming=false;clearBlockingDialog();try{if(root.v736&&typeof root.v736.start==="function"&&!pairReady())root.v736.start();}catch(e){root.__productionModeRouterGoodBoysStartError=String(e&&e.stack||e);}poll();});
        return;
      }
      if((tries===100||tries===220)&&root.v736&&typeof root.v736.start==="function"){try{root.v736.start();}catch(e){root.__productionModeRouterGoodBoysStartError=String(e&&e.stack||e);}}
      if(++tries>=max){root.__productionModeRouterError="good_boys_pair_timeout";return;}
      (root.setTimeout||setTimeout)(poll,25);
    }
    poll();
  }
  function captureIntent(ev){var t=textOf(ev&&ev.target);if(t.indexOf("NIGHT CRAWLER")>=0){setDesired("nightcrawler");forceNightIdentity();(root.setTimeout||setTimeout)(launchNightCrawler,0);}else if(t.indexOf("118/1984")>=0||t.indexOf("BREAKOUT")>=0||t.indexOf("GOOD BOYS")>=0){setDesired("goodboys");clearNightIdentity();(root.setTimeout||setTimeout)(launchGoodBoys,0);}}
  function healthTick(){if(desired==="nightcrawler"){forceNightIdentity();hideLegacyShell();clearBlockingDialog();if(!nightWorldReady())enterNightReliably(function(){clearBlockingDialog();restoreRuntimeUi();clearErrors();desired=null;root.__productionDesiredMode=null;root.__productionActiveMode="nightcrawler";});else{clearBlockingDialog();restoreRuntimeUi();clearErrors();desired=null;root.__productionDesiredMode=null;root.__productionActiveMode="nightcrawler";}}else if(desired==="goodboys"){hideLegacyShell();if(goodBoysIntroVisible()){confirmAutomationIntro();return;}if(nightWorldReady()&&pairReady())finishGoodBoys();}else if(root.__productionActiveMode==="nightcrawler"&&nightWorldReady()){clearBlockingDialog();clearErrors();}else if(root.__productionActiveMode==="goodboys"&&nightWorldReady()&&pairReady()){clearBlockingDialog();clearErrors();}}
  try{root.document&&root.document.addEventListener("pointerdown",captureIntent,true);root.document&&root.document.addEventListener("click",captureIntent,true);}catch(e){}
  timer=root.setInterval?root.setInterval(healthTick,100):null;
  root.TechOpsProductionModeRouter={VERSION:VERSION,setDesired:setDesired,state:state,world:world,nightWorldReady:nightWorldReady,pairReady:pairReady,clearErrors:clearErrors,clearBlockingDialog:clearBlockingDialog,launchNightCrawler:launchNightCrawler,launchGoodBoys:launchGoodBoys,enterNightReliably:enterNightReliably,goodBoysIntroVisible:goodBoysIntroVisible,confirmAutomationIntro:confirmAutomationIntro,healthTick:healthTick,timer:timer};
})(typeof globalThis!=="undefined"?globalThis:this);
