/* Good Boys deterministic progression authority v12.
 * Canonical campaign state lives in S.meta._v736. Runtime NM._v736 is a mirror.
 * Normal mission handoffs are async-safe across authored cinematics. The custom
 * opening may request directGameplay for M2; v736_hooks.js owns that fast path
 * and mounts startCombat736 directly. Later authored mission cinematics remain
 * asynchronous and are settled by finalizeHandoff when their runtime appears.
 */
(function(root){
  "use strict";
  if(!root)return;
  try{var prior=root.TechOpsGoodBoysProgressionAuthority;if(prior&&prior.timer&&root.clearInterval)root.clearInterval(prior.timer);if(prior&&prior.observer)prior.observer.disconnect();}catch(_){}
  var VERSION=13,timer=null,observer=null,missionSeen=0,seenEnemy=false,emptySince=0,transition=false,lastAdvance=0,repairs=0;
  function now(){return root.performance&&root.performance.now?root.performance.now():Date.now();}
  function runtime(){try{return root.NM&&root.NM._v736?root.NM._v736:null;}catch(e){return null;}}
  function clampMission(v){v=Number(v);return Math.max(1,Math.min(8,isFinite(v)&&v>0?v:1));}
  function rawMeta(){try{if(!root.S)return null;root.S.meta=root.S.meta||{};return root.S.meta._v736||(root.S.meta._v736={m:1,evidence:[],k:false,waldo:false,done:false});}catch(e){return null;}}
  function save(){try{if(typeof root.save==="function")root.save();else if(typeof root.saveGame==="function")root.saveGame();return true;}catch(e){root.__goodBoysProgressionSaveError=String(e&&e.stack||e);return false;}}

  var CampaignState=root.TechOpsGoodBoysCampaignState||{
    VERSION:1,
    _getMeta:rawMeta,
    _getRuntime:runtime,
    mission:function(){var m=this._getMeta();return m?clampMission(m.m):1;},
    reconcile:function(reason){
      try{var m=this._getMeta(),c=this._getRuntime();if(!m||!c)return false;var canonical=clampMission(m.m),before=Number(c.m)||0;if(before!==canonical){c.m=canonical;repairs++;root.__goodBoysReconcile={runtime:before,canonical:canonical,reason:reason||"reconcile",at:Date.now(),count:repairs};}return true;}catch(e){root.__goodBoysReconcileError=String(e&&e.stack||e);return false;}
    },
    transition:function(from,to,reason,patch){
      var m=this._getMeta();if(!m)throw new Error("CampaignState: no meta");from=clampMission(from);to=clampMission(to);var current=clampMission(m.m);
      if(current!==from)throw new Error("CampaignState: transition from "+from+" rejected, current="+current);
      if(to!==from+1&&!(from===8&&to===8))throw new Error("CampaignState: non-sequential transition "+from+" -> "+to);
      patch=patch||{};if(Object.prototype.hasOwnProperty.call(patch,"k"))m.k=!!patch.k;if(Object.prototype.hasOwnProperty.call(patch,"waldo"))m.waldo=!!patch.waldo;if(Array.isArray(patch.evidence))m.evidence=patch.evidence.slice();
      m.m=to;
      var validator=root.TechOpsStateValidator;if(validator&&typeof validator.validateCampaign==="function"){var vr=validator.validateCampaign(m,null);if(!vr.valid){root.__stateValidationFailure=vr;throw new Error("CampaignState: invalid persisted transition: "+vr.errors.join(" | "));}}
      if(!save())throw new Error("CampaignState: save failed");
      var c=this._getRuntime();if(c)c.m=to;
      root.__goodBoysTransition={from:from,to:to,reason:reason||"transition",at:Date.now()};
      if(c&&Number(c.m)!==to)throw new Error("CampaignState: runtime mirror failed, expected "+to+", got "+c.m);
      return true;
    }
  };
  root.TechOpsGoodBoysCampaignState=CampaignState;
  function meta(){return CampaignState._getMeta();}
  function cs(){return CampaignState._getRuntime();}
  function mission(){return CampaignState.mission();}
  function reconcileMission(reason){var ok=CampaignState.reconcile(reason);if(ok)root.__goodBoysMissionRepair=root.__goodBoysReconcile||root.__goodBoysMissionRepair;return ok;}
  function invariant(expected,reason){try{expected=clampMission(expected);var m=meta(),c=cs(),pm=Number(m&&m.m||0),rm=Number(c&&c.m||0),ok=pm===expected&&rm===expected;root.__goodBoysMissionInvariant={ok:ok,expected:expected,metaMission:pm,runtimeMission:rm,reason:reason||"check",at:Date.now()};return ok;}catch(e){root.__goodBoysMissionInvariant={ok:false,expected:expected,error:String(e&&e.stack||e),reason:reason||"check",at:Date.now()};return false;}}
  function living(){try{return (root.NM&&root.NM.enemies||[]).filter(function(e){return e&&e.alive!==false&&Number(e.hp)>0;}).length;}catch(e){return 0;}}
  function pending(){try{var c=cs(),n=root.NM;return !!(c&&(c.pendingSpawn||c.spawnT>0||c.wavePending)||n&&(n.spawnT>0||n.wavePending));}catch(e){return false;}}
  function setMsg(t,ms){try{if(root.NM){root.NM.msg=t;root.NM.msgT=now()+(ms||1800);}}catch(_){} }
  function cinematicVisible(){try{if(!root.document)return false;var ids=["good-boys-story-cine","gb-prison-cine","good-boys-campaign-intro","good-boys-earthfall-cine","good-boys-ship-interlude","good-dogs-cutscene-overlay"];for(var i=0;i<ids.length;i++){var el=root.document.getElementById(ids[i]);if(!el)continue;var s=root.getComputedStyle?root.getComputedStyle(el):el.style;if(!s||s.display!=="none"&&s.visibility!=="hidden"&&Number(s.opacity||1)!==0)return true;}return false;}catch(e){return false;}}
  function enforceCinematicBlock(){try{if(cinematicVisible()&&root.S){root.S.inDialog=true;root.__goodBoysCinematicBlockHeld=(root.__goodBoysCinematicBlockHeld||0)+1;return true;}return false;}catch(e){return false;}}
  function releaseCinematicBlock(){try{if(root.S&&!cinematicVisible()){root.S.inDialog=false;return true;}return false;}catch(e){return false;}}
  function stopLegacyMobileTimer(){try{var m=root.TechOpsGoodBoysMobileRuntimeFix;if(m&&m.timer!=null){root.clearInterval(m.timer);m.timer=null;root.__goodBoysLegacyMobileTimerStopped=true;}}catch(_){} }
  function removeCompetingPads(){try{if(!root.document)return;var legacy=root.document.querySelectorAll("#good-boys-loop-controls");for(var i=0;i<legacy.length;i++)if(legacy[i]&&legacy[i].parentNode)legacy[i].parentNode.removeChild(legacy[i]);var canonical=root.document.querySelectorAll("#good-dogs-touch");for(var k=1;k<canonical.length;k++)if(canonical[k]&&canonical[k].parentNode)canonical[k].parentNode.removeChild(canonical[k]);var ds=root.document.querySelectorAll("#good-boys-director-controls");for(var j=1;j<ds.length;j++)if(ds[j].parentNode)ds[j].parentNode.removeChild(ds[j]);var keep=ds[0],live=cs(),owns=!!(live&&!live.ending&&!cinematicVisible());if(keep){keep.style.display=owns?"grid":"none";keep.style.pointerEvents=owns?"auto":"none";}root.__goodBoysCanonicalPadCount=canonical.length?1:0;}catch(_){} }
  function installObserver(){try{if(root.__productionSingleCompositor){if(observer){observer.disconnect();observer=null;}root.__goodBoysProgressionObserverSuppressed=true;return false;}if(observer||!root.MutationObserver||!root.document)return false;observer=new root.MutationObserver(function(records){var dirty=false;for(var i=0;i<records.length;i++)if(records[i].addedNodes&&records[i].addedNodes.length){dirty=true;break;}if(dirty){reconcileMission("dom-mutation");removeCompetingPads();enforceCinematicBlock();}});observer.observe(root.document.documentElement,{subtree:true,childList:true});return true;}catch(e){root.__goodBoysProgressionObserverError=String(e&&e.stack||e);return false;}}
  function resetWorldForHandoff(){try{var n=root.NM,c=cs();if(c){c.ending=true;c.pendingSpawn=null;}if(n){n.enemies=[];n.clear=false;n._gbShipRevealed=false;n.x=180;n.cam=0;n.hitStop=0;}}catch(_){} }

  function hardenStart(){
    try{
      if(!root.v736||typeof root.v736.start!=="function"||root.v736.start.__goodBoysCanonicalStart)return !!(root.v736&&root.v736.start);
      var base=root.v736.start;
      var wrapped=function(options){
        options=options||{};var m=meta();
        if(m&&options.mission!=null)m.m=clampMission(options.mission);
        if(m&&Object.prototype.hasOwnProperty.call(options,"k"))m.k=!!options.k;
        if(m&&Object.prototype.hasOwnProperty.call(options,"waldo"))m.waldo=!!options.waldo;
        if(m&&Array.isArray(options.evidence))m.evidence=options.evidence.slice();
        var expected=m?clampMission(m.m):clampMission(options.mission||1),r=base.call(this,options);
        var c=cs();
        if(c&&!c.ending){if(Number(c.m)!==expected)c.m=expected;reconcileMission("v736-start-wrapper");invariant(expected,"v736-start-wrapper");if(options.directGameplay&&root.__goodBoysDirectGameplay)root.__goodBoysDirectGameplay.runtimeMission=Number(c.m||0);}
        else if(root.__goodBoysHandoffInProgress)root.__goodBoysRuntimePending={mission:expected,status:c&&c.ending?"awaiting-fresh-runtime":"awaiting-runtime",source:"v736-start-wrapper",at:Date.now()};
        return r;
      };
      wrapped.__goodBoysCanonicalStart=true;wrapped.__baseStart=base;root.v736.start=wrapped;return true;
    }catch(e){root.__goodBoysStartPatchError=String(e&&e.stack||e);return false;}
  }

  function finalizeHandoff(reason){
    try{
      var h=root.__goodBoysHandoffInProgress;if(!h)return true;
      var m=meta(),c=cs(),expected=clampMission(h.mission),canonical=Number(m&&m.m||0);
      if(!m||clampMission(canonical)!==expected){root.__goodBoysHandoffError="canonical mission changed during handoff: expected "+expected+", got "+canonical;return false;}
      if(!c||c.ending){root.__goodBoysRuntimePending={mission:expected,status:c&&c.ending?"awaiting-fresh-runtime":"awaiting-runtime",source:reason||"handoff",at:Date.now()};return false;}
      var observed=Number(c.m||0);if(observed!==expected){c.m=expected;root.__goodBoysForcedRepair={expected:expected,observed:observed,at:Date.now(),source:reason||"handoff"};}
      reconcileMission(reason||"handoff-finalize");if(!invariant(expected,reason||"handoff-finalize"))return false;
      var validator=root.TechOpsStateValidator;if(validator&&typeof validator.validateCampaign==="function"){var vr=validator.validateCampaign(m,c);if(!vr.valid){root.__stateValidationFailure=vr;throw new Error("Good Boys state validator failed: "+vr.errors.join(" | "));}}
      if(h.directGameplay&&root.__goodBoysDirectGameplay){root.__goodBoysDirectGameplay.runtimeMission=Number(c.m||0);root.__goodBoysDirectGameplay.mountedAt=Date.now();}
      root.__goodBoysHandoffComplete={mission:expected,startedAt:h.at,completedAt:Date.now(),reason:reason||"handoff-finalize",directGameplay:!!h.directGameplay};root.__goodBoysHandoffInProgress=null;root.__goodBoysRuntimePending=null;root.__goodBoysHandoffError=null;root.__goodBoysProgressionError=null;return true;
    }catch(e){root.__goodBoysHandoffError=String(e&&e.stack||e);root.__goodBoysProgressionError=root.__goodBoysHandoffError;return false;}
  }

  function startNext(next,options){
    options=options||{};
    try{var m=meta();if(!m)return false;next=clampMission(next);hardenStart();if(root.S&&!cinematicVisible())root.S.inDialog=false;
      if(next===8&&root.TechOpsGoodBoysEarthfallEnding&&typeof root.TechOpsGoodBoysEarthfallEnding.begin==="function"){reconcileMission("before-earthfall");root.TechOpsGoodBoysEarthfallEnding.begin();return true;}
      if(root.v736&&typeof root.v736.start==="function"){
        root.__goodBoysHandoffInProgress={mission:next,directGameplay:!!options.directGameplay,at:Date.now()};root.__goodBoysHandoffError=null;root.__goodBoysProgressionError=null;
        root.v736.start({mission:next,k:!!m.k,waldo:!!m.waldo,evidence:(m.evidence||[]).slice(),directGameplay:!!options.directGameplay});
        if(!finalizeHandoff("after-v736-start"))root.__goodBoysRuntimePending=root.__goodBoysRuntimePending||{mission:next,status:"awaiting-runtime",source:"v736.start",at:Date.now()};
        return true;
      }
    }catch(e){root.__goodBoysHandoffInProgress=null;root.__goodBoysProgressionError=String(e&&e.stack||e);}return false;
  }
  function advance(next,reason){
    try{if(transition||now()-lastAdvance<700)return false;var c=cs(),m=meta();if(!c||!m)return false;reconcileMission("pre-transition");var from=mission();if(from>=8)return false;next=Math.min(8,from+1);transition=true;lastAdvance=now();var patch={};if(from===4)patch.k=true;if(from===6)patch.waldo=true;
      CampaignState.transition(from,next,reason||"clear",patch);if(!invariant(next,"pre-handoff")){reconcileMission("pre-handoff-repair");if(!invariant(next,"pre-handoff-repaired"))throw new Error("Good Boys mission invariant failed before handoff");}
      resetWorldForHandoff();root.__goodBoysLastProgression={from:from,to:next,reason:reason||"clear",at:Date.now()};setMsg("MISSION "+from+" COMPLETE · M"+next+" UNLOCKED",2200);
      var restart=function(){try{startNext(next);finalizeHandoff("handoff-complete");}finally{root.setTimeout(function(){transition=false;},500);}};root.setTimeout(restart,120);return true;
    }catch(e){root.__goodBoysProgressionError=String(e&&e.stack||e);transition=false;return false;}
  }
  function revealShip(){try{var n=root.NM;if(!n)return false;if(!n._gbShipRevealed){n._gbShipRevealed=true;n.clear=false;setMsg("HANGAR CLEAR · SECRET SHIP REVEALED",2400);root.__goodBoysShipRevealAt=Date.now();}return true;}catch(e){return false;}}
  function runAccessCore(){try{var a=root.TechOpsGoodBoysAccessCoreAuthority;if(a&&typeof a.tick==="function")a.tick();}catch(e){root.__goodBoysAccessCoreUnifiedTickError=String(e&&e.stack||e);}}
  function tick(){try{installObserver();hardenStart();stopLegacyMobileTimer();reconcileMission("tick");removeCompetingPads();enforceCinematicBlock();runAccessCore();finalizeHandoff("tick-handoff");var c=cs(),n=root.NM;if(!c||!n||c.ending){missionSeen=0;seenEnemy=false;emptySince=0;if(!root.__goodBoysHandoffInProgress)lastAdvance=0;if(!root.__goodBoysHandoffInProgress)transition=false;return;}var m=mission();if(m!==missionSeen){missionSeen=m;seenEnemy=false;emptySince=0;}if(transition)return;if(m===8){var end=root.TechOpsGoodBoysEarthfallEnding;if(end&&typeof end.begin==="function")end.begin();return;}if(m===1)return;var alive=living();if(m===2){if(alive>0){seenEnemy=true;emptySince=0;return;}var wavesComplete=Number(c.wave)>=2;if((seenEnemy||wavesComplete)&&!pending())revealShip();if(n._gbShipRevealed&&Number(n.x)>=1255)advance(3,"boarded-secret-ship");return;}if(alive>0){seenEnemy=true;emptySince=0;return;}if(m>=3&&m<=7){if(!seenEnemy||pending())return;if(!emptySince)emptySince=now();if(now()-emptySince>=900)advance(m+1,m===4?"freed-k":m===6?"freed-waldo":m===7?"warden-defeated-shuttle-reached":"encounter-clear");}}catch(e){root.__goodBoysProgressionError=String(e&&e.stack||e);}}
  function acceptance(){var end=root.TechOpsGoodBoysEarthfallEnding,c=cs(),m=meta(),canonical=mission(),rm=Number(c&&c.m||0),pm=Number(m&&m.m||0);return{version:VERSION,active:!!(c&&!c.ending),mission:canonical,runtimeMission:rm,metaMission:pm,missionDiverged:!!(c&&m&&rm!==pm),missionRepairs:repairs,lastMissionRepair:root.__goodBoysReconcile||null,invariant:root.__goodBoysMissionInvariant||null,forcedRepair:root.__goodBoysForcedRepair||null,handoff:root.__goodBoysHandoffInProgress||null,handoffComplete:root.__goodBoysHandoffComplete||null,runtimePending:root.__goodBoysRuntimePending||null,handoffError:root.__goodBoysHandoffError||null,directGameplay:root.__goodBoysDirectGameplay||null,campaignTransition:root.__goodBoysTransition||null,living:living(),pending:pending(),seenEnemy:seenEnemy,emptyFor:emptySince?Math.round(now()-emptySince):0,transition:transition,lastAdvanceAge:lastAdvance?Math.round(now()-lastAdvance):null,last:root.__goodBoysLastProgression||null,cinematicVisible:cinematicVisible(),cinematicBlocked:!!(cinematicVisible()&&root.S&&root.S.inDialog),legacyMobileTimerStopped:!!root.__goodBoysLegacyMobileTimerStopped,directorPads:root.document?root.document.querySelectorAll("#good-boys-director-controls").length:0,legacyPads:root.document?root.document.querySelectorAll("#good-boys-loop-controls").length:0,canonicalPads:root.document?root.document.querySelectorAll("#good-dogs-touch").length:0,observerSuppressed:!!root.__goodBoysProgressionObserverSuppressed,canonicalState:true,unifiedAuthorityTick:true,earthfall:end&&end.acceptance?end.acceptance():null};}
  function testPrimeClear(){try{reconcileMission("test-prime");var n=root.NM,c=cs(),before=mission();if(!c||!n||before<3||before>7||transition||now()-lastAdvance<700)return false;n.enemies=[{x:(n.x||100)+40,y:n.y||300,w:28,h:38,hp:1,alive:true,kind:"test-clear"}];tick();for(var i=0;i<n.enemies.length;i++){if(n.enemies[i]){n.enemies[i].hp=0;n.enemies[i].alive=false;}}c.pendingSpawn=null;c.spawnT=0;c.wavePending=false;n.spawnT=0;n.wavePending=false;emptySince=now()-1000;tick();return mission()===before+1&&root.__goodBoysLastProgression&&root.__goodBoysLastProgression.from===before&&root.__goodBoysLastProgression.to===before+1;}catch(e){root.__goodBoysProgressionTestError=String(e&&e.stack||e);return false;}}
  installObserver();hardenStart();timer=root.setInterval?root.setInterval(tick,50):null;root.TechOpsGoodBoysProgressionAuthority={VERSION:VERSION,tick:tick,advance:advance,revealShip:revealShip,startNext:startNext,finalizeHandoff:finalizeHandoff,mission:mission,reconcileMission:reconcileMission,invariant:invariant,hardenStart:hardenStart,acceptance:acceptance,testPrimeClear:testPrimeClear,cinematicVisible:cinematicVisible,enforceCinematicBlock:enforceCinematicBlock,releaseCinematicBlock:releaseCinematicBlock,removeCompetingPads:removeCompetingPads,observer:observer,timer:timer};tick();
})(typeof globalThis!=="undefined"?globalThis:this);