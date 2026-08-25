/* TechOps Hero — production mode router v3.
 * Reads the real lexical S/NM runtime and owns alternate-mode convergence.
 * v3 clears stale timeout telemetry once the requested runtime actually
 * converges, so delayed Safari recovery cannot remain falsely red.
 */
(function(root){
  "use strict";
  if(!root) return;
  try{if(root.TechOpsProductionModeRouter&&root.TechOpsProductionModeRouter.timer)root.clearInterval(root.TechOpsProductionModeRouter.timer);}catch(e){}
  var VERSION=3, desired=null, timer=null;

  function textOf(node){try{return String(node&&node.textContent||"").toUpperCase();}catch(e){return"";}}
  function setDesired(mode){desired=mode||null;root.__productionDesiredMode=desired;return desired;}
  function state(){try{return (typeof S!=="undefined"&&S)?S:null;}catch(e){return null;}}
  function world(){try{return (typeof NM!=="undefined"&&NM)?NM:null;}catch(e){return null;}}
  function enterNightFn(){try{return typeof enterNight==="function"?enterNight:null;}catch(e){return null;}}
  function startRunFn(){try{return typeof startRun==="function"?startRun:null;}catch(e){return null;}}
  function nightWorldReady(){try{var s=state(),n=world();return !!(s&&s.nightMode&&n&&typeof stepNM==="function"&&typeof drawNM==="function"&&isFinite(n.x)&&isFinite(n.y));}catch(e){return false;}}
  function pairReady(){try{var n=world(),c=n&&n._v736;return !!(c&&c.chars&&c.chars.katrin&&c.chars.manchez&&c.partner&&(c.active==="katrin"||c.active==="manchez"));}catch(e){return false;}}
  function clearErrors(){root.__productionModeRouterError=null;root.__productionModeRouterEnterNightError=null;root.__productionModeRouterNightStartError=null;root.__productionModeRouterGoodBoysStartError=null;}
  function forceNightIdentity(){try{root.localStorage&&root.localStorage.setItem("techops_char","nightcrawler");}catch(e){}try{var s=state();if(s){s.meta=s.meta||{};s.meta._char="nightcrawler";s.clock=Math.max(Number(s.clock||0),960);}}catch(e){}}
  function clearNightIdentity(){try{root.localStorage&&root.localStorage.removeItem("techops_char");}catch(e){}try{var s=state();if(s&&s.meta&&s.meta._char==="nightcrawler")delete s.meta._char;}catch(e){}}
  function hideLegacyShell(){try{var d=root.document;if(!d)return;["hud","dialogue","panel","battle","eod"].forEach(function(id){var el=d.getElementById(id);if(el&&el.style)el.style.setProperty("display","none","important");});}catch(e){}}
  function showTouch(){try{var t=root.document&&root.document.getElementById("touch-ui");if(t){t.classList.remove("hidden");t.style.removeProperty("display");}}catch(e){}}
  function restoreRuntimeUi(){showTouch();try{if(root.TechOpsNightReferenceVisuals)root.TechOpsNightReferenceVisuals.install();}catch(e){}try{if(root.TechOpsGoodDogsProduction)root.TechOpsGoodDogsProduction.tick();}catch(e){}try{if(root.TechOpsGoodBoysReferenceMechanics)root.TechOpsGoodBoysReferenceMechanics.tick();}catch(e){}try{if(root.TechOpsGoodBoysCanon)root.TechOpsGoodBoysCanon.tick();}catch(e){}try{if(root.TechOpsGoodBoysGameplayLoop)root.TechOpsGoodBoysGameplayLoop.tick();}catch(e){}try{if(root.TechOpsProductionWrapperGuard)root.TechOpsProductionWrapperGuard.enforce();}catch(e){}}
  function enterNightReliably(done){var tries=0,max=200;function poll(){var s=state(),f=enterNightFn();try{if(s&&!s.nightMode&&f)f();}catch(e){root.__productionModeRouterEnterNightError=String(e&&e.stack||e);}if(nightWorldReady()){root.__productionModeRouterRuntime="night";if(done)done();return;}if(++tries>=max){root.__productionModeRouterError="night_runtime_timeout";return;}(root.setTimeout||setTimeout)(poll,25);}poll();}
  function launchNightCrawler(){setDesired("nightcrawler");clearGoodBoysState();forceNightIdentity();hideLegacyShell();try{var s=state(),start=startRunFn(),en=enterNightFn();if(!s&&start)start();else if(s&&!s.nightMode&&en)en();}catch(e){root.__productionModeRouterNightStartError=String(e&&e.stack||e);}enterNightReliably(function(){forceNightIdentity();restoreRuntimeUi();clearErrors();desired=null;root.__productionDesiredMode=null;root.__productionNightLaunchOk=true;root.__productionActiveMode="nightcrawler";});}
  function clearGoodBoysState(){try{var n=world();if(n&&n._v736&&!desired)delete n._v736;}catch(e){}}
  function launchGoodBoys(){setDesired("goodboys");clearNightIdentity();hideLegacyShell();try{if(root.v736&&typeof root.v736.start==="function")root.v736.start();}catch(e){root.__productionModeRouterGoodBoysStartError=String(e&&e.stack||e);}enterNightReliably(function(){var tries=0,max=240;function pairPoll(){restoreRuntimeUi();if(pairReady()){clearErrors();desired=null;root.__productionDesiredMode=null;root.__productionGoodBoysLaunchOk=true;root.__productionActiveMode="goodboys";return;}if(tries===25||tries===70||tries===140){try{if(root.v736&&typeof root.v736.start==="function")root.v736.start();}catch(e){}}if(++tries>=max){root.__productionModeRouterError="good_boys_pair_timeout";return;}(root.setTimeout||setTimeout)(pairPoll,25);}pairPoll();});}
  function captureIntent(ev){var t=textOf(ev&&ev.target);if(t.indexOf("NIGHT CRAWLER")>=0){setDesired("nightcrawler");forceNightIdentity();(root.setTimeout||setTimeout)(launchNightCrawler,0);}else if(t.indexOf("118/1984")>=0||t.indexOf("BREAKOUT")>=0||t.indexOf("GOOD BOYS")>=0){setDesired("goodboys");clearNightIdentity();(root.setTimeout||setTimeout)(launchGoodBoys,0);}}
  function healthTick(){if(desired==="nightcrawler"){forceNightIdentity();hideLegacyShell();if(!nightWorldReady())enterNightReliably(function(){restoreRuntimeUi();clearErrors();desired=null;root.__productionDesiredMode=null;root.__productionActiveMode="nightcrawler";});else{restoreRuntimeUi();clearErrors();desired=null;root.__productionDesiredMode=null;root.__productionActiveMode="nightcrawler";}}else if(desired==="goodboys"){hideLegacyShell();if(nightWorldReady()&&pairReady()){restoreRuntimeUi();clearErrors();desired=null;root.__productionDesiredMode=null;root.__productionActiveMode="goodboys";}}else if(root.__productionActiveMode==="goodboys"&&nightWorldReady()&&pairReady()){clearErrors();}}
  try{root.document&&root.document.addEventListener("pointerdown",captureIntent,true);root.document&&root.document.addEventListener("click",captureIntent,true);}catch(e){}
  timer=root.setInterval?root.setInterval(healthTick,100):null;
  root.TechOpsProductionModeRouter={VERSION:VERSION,setDesired:setDesired,state:state,world:world,nightWorldReady:nightWorldReady,pairReady:pairReady,clearErrors:clearErrors,launchNightCrawler:launchNightCrawler,launchGoodBoys:launchGoodBoys,enterNightReliably:enterNightReliably,healthTick:healthTick,timer:timer};
})(typeof globalThis!=="undefined"?globalThis:this);
