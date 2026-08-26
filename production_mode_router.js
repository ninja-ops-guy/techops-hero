/* TechOps Hero — production mode router v4.
 * Owns alternate-mode convergence and clears legacy dialogue state before
 * handing input to the Night engine. Good Boys launch now respects its own
 * intro handoff instead of racing enterNight() against v736.start().
 */
(function(root){
  "use strict";
  if(!root) return;
  try{if(root.TechOpsProductionModeRouter&&root.TechOpsProductionModeRouter.timer)root.clearInterval(root.TechOpsProductionModeRouter.timer);}catch(e){}
  var VERSION=4, desired=null, timer=null;

  function textOf(node){try{return String(node&&node.textContent||"").toUpperCase();}catch(e){return"";}}
  function setDesired(mode){desired=mode||null;root.__productionDesiredMode=desired;return desired;}
  function state(){try{return (typeof S!=="undefined"&&S)?S:null;}catch(e){return null;}}
  function world(){try{return (typeof NM!=="undefined"&&NM)?NM:null;}catch(e){return null;}}
  function enterNightFn(){try{return typeof enterNight==="function"?enterNight:null;}catch(e){return null;}}
  function startRunFn(){try{return typeof startRun==="function"?startRun:null;}catch(e){return null;}}
  function nightWorldReady(){try{var s=state(),n=world();return !!(s&&s.nightMode&&n&&typeof stepNM==="function"&&typeof drawNM==="function"&&isFinite(n.x)&&isFinite(n.y));}catch(e){return false;}}
  function pairReady(){try{var n=world(),c=n&&n._v736;return !!(c&&c.chars&&c.chars.katrin&&c.chars.manchez&&c.partner&&(c.active==="katrin"||c.active==="manchez"));}catch(e){return false;}}
  function clearErrors(){root.__productionModeRouterError=null;root.__productionModeRouterEnterNightError=null;root.__productionModeRouterNightStartError=null;root.__productionModeRouterGoodBoysStartError=null;}
  function clearBlockingDialog(){try{var s=state();if(s)s.inDialog=false;var d=root.document&&root.document.getElementById("dialogue");if(d){d.classList.add("hidden");if(d.style)d.style.removeProperty("display");}return true;}catch(e){return false;}}
  function forceNightIdentity(){try{root.localStorage&&root.localStorage.setItem("techops_char","nightcrawler");}catch(e){}try{var s=state();if(s){s.meta=s.meta||{};s.meta._char="nightcrawler";s.clock=Math.max(Number(s.clock||0),960);}}catch(e){}}
  function clearNightIdentity(){try{root.localStorage&&root.localStorage.removeItem("techops_char");}catch(e){}try{var s=state();if(s&&s.meta&&s.meta._char==="nightcrawler")delete s.meta._char;}catch(e){}}
  function hideLegacyShell(){try{var d=root.document;if(!d)return;["hud","dialogue","panel","battle","eod"].forEach(function(id){var el=d.getElementById(id);if(el&&el.style)el.style.setProperty("display","none","important");});}catch(e){}}
  function showTouch(){try{var t=root.document&&root.document.getElementById("touch-ui");if(t){t.classList.remove("hidden");t.style.removeProperty("display");}}catch(e){}}
  function restoreRuntimeUi(){showTouch();try{if(root.TechOpsNightProductionAssets)root.TechOpsNightProductionAssets.install();}catch(e){}try{if(root.TechOpsNightReferenceVisuals)root.TechOpsNightReferenceVisuals.install();}catch(e){}try{if(root.TechOpsGoodDogsProduction)root.TechOpsGoodDogsProduction.tick();}catch(e){}try{if(root.TechOpsGoodBoysReferenceMechanics)root.TechOpsGoodBoysReferenceMechanics.tick();}catch(e){}try{if(root.TechOpsGoodBoysCanon)root.TechOpsGoodBoysCanon.tick();}catch(e){}try{if(root.TechOpsGoodBoysGameplayLoop)root.TechOpsGoodBoysGameplayLoop.tick();}catch(e){}try{if(root.TechOpsProductionWrapperGuard)root.TechOpsProductionWrapperGuard.enforce();}catch(e){}}
  function enterNightReliably(done){var tries=0,max=200;function poll(){var s=state(),f=enterNightFn();try{if(s&&s.inDialog)clearBlockingDialog();if(s&&!s.nightMode&&f){clearBlockingDialog();f();clearBlockingDialog();}}catch(e){root.__productionModeRouterEnterNightError=String(e&&e.stack||e);}if(nightWorldReady()){clearBlockingDialog();root.__productionModeRouterRuntime="night";if(done)done();return;}if(++tries>=max){root.__productionModeRouterError="night_runtime_timeout";return;}(root.setTimeout||setTimeout)(poll,25);}poll();}
  function launchNightCrawler(){setDesired("nightcrawler");clearGoodBoysState();forceNightIdentity();hideLegacyShell();try{var s=state(),start=startRunFn(),en=enterNightFn();if(!s&&start){start();clearBlockingDialog();s=state();}if(s&&!s.nightMode&&en){clearBlockingDialog();en();clearBlockingDialog();}}catch(e){root.__productionModeRouterNightStartError=String(e&&e.stack||e);}enterNightReliably(function(){clearBlockingDialog();forceNightIdentity();restoreRuntimeUi();clearErrors();desired=null;root.__productionDesiredMode=null;root.__productionNightLaunchOk=true;root.__productionActiveMode="nightcrawler";});}
  function clearGoodBoysState(){try{var n=world();if(n&&n._v736&&!desired)delete n._v736;}catch(e){}}
  function goodBoysIntroVisible(){try{return !!(root.document&&root.document.getElementById("good-boys-campaign-intro"));}catch(e){return false;}}
  function finishGoodBoys(){clearBlockingDialog();restoreRuntimeUi();clearErrors();desired=null;root.__productionDesiredMode=null;root.__productionGoodBoysLaunchOk=true;root.__productionActiveMode="goodboys";}
  function launchGoodBoys(){
    setDesired("goodboys");clearNightIdentity();hideLegacyShell();clearBlockingDialog();
    try{if(root.v736&&typeof root.v736.start==="function")root.v736.start();else root.__productionModeRouterGoodBoysStartError="v736_start_missing";}catch(e){root.__productionModeRouterGoodBoysStartError=String(e&&e.stack||e);}
    var tries=0,max=320,priming=false;
    function poll(){
      restoreRuntimeUi();
      if(pairReady())return finishGoodBoys();
      /* The canon intro owns the explicit player confirmation. Do not call
         enterNight() behind it: doing so replaces NM while v736 is preparing
         the linked-pair state. */
      if(goodBoysIntroVisible()){if(++tries>=max){root.__productionModeRouterError="good_boys_intro_timeout";return;}(root.setTimeout||setTimeout)(poll,25);return;}
      if(!nightWorldReady()&&!priming){
        priming=true;
        enterNightReliably(function(){priming=false;clearBlockingDialog();try{if(root.v736&&typeof root.v736.start==="function"&&!pairReady())root.v736.start();}catch(e){root.__productionModeRouterGoodBoysStartError=String(e&&e.stack||e);}poll();});
        return;
      }
      if((tries===80||tries===180)&&root.v736&&typeof root.v736.start==="function"){try{root.v736.start();}catch(e){root.__productionModeRouterGoodBoysStartError=String(e&&e.stack||e);}}
      if(++tries>=max){root.__productionModeRouterError="good_boys_pair_timeout";return;}
      (root.setTimeout||setTimeout)(poll,25);
    }
    poll();
  }
  function captureIntent(ev){var t=textOf(ev&&ev.target);if(t.indexOf("NIGHT CRAWLER")>=0){setDesired("nightcrawler");forceNightIdentity();(root.setTimeout||setTimeout)(launchNightCrawler,0);}else if(t.indexOf("118/1984")>=0||t.indexOf("BREAKOUT")>=0||t.indexOf("GOOD BOYS")>=0){setDesired("goodboys");clearNightIdentity();(root.setTimeout||setTimeout)(launchGoodBoys,0);}}
  function healthTick(){if(desired==="nightcrawler"){forceNightIdentity();hideLegacyShell();clearBlockingDialog();if(!nightWorldReady())enterNightReliably(function(){clearBlockingDialog();restoreRuntimeUi();clearErrors();desired=null;root.__productionDesiredMode=null;root.__productionActiveMode="nightcrawler";});else{clearBlockingDialog();restoreRuntimeUi();clearErrors();desired=null;root.__productionDesiredMode=null;root.__productionActiveMode="nightcrawler";}}else if(desired==="goodboys"){hideLegacyShell();if(nightWorldReady()&&pairReady())finishGoodBoys();}else if(root.__productionActiveMode==="nightcrawler"&&nightWorldReady()){clearBlockingDialog();clearErrors();}else if(root.__productionActiveMode==="goodboys"&&nightWorldReady()&&pairReady()){clearBlockingDialog();clearErrors();}}
  try{root.document&&root.document.addEventListener("pointerdown",captureIntent,true);root.document&&root.document.addEventListener("click",captureIntent,true);}catch(e){}
  timer=root.setInterval?root.setInterval(healthTick,100):null;
  root.TechOpsProductionModeRouter={VERSION:VERSION,setDesired:setDesired,state:state,world:world,nightWorldReady:nightWorldReady,pairReady:pairReady,clearErrors:clearErrors,clearBlockingDialog:clearBlockingDialog,launchNightCrawler:launchNightCrawler,launchGoodBoys:launchGoodBoys,enterNightReliably:enterNightReliably,healthTick:healthTick,timer:timer};
})(typeof globalThis!=="undefined"?globalThis:this);
