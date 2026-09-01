/* Good Boys deterministic progression authority v8.
 * Owns campaign handoffs, cinematic input blocking, control-surface cleanup,
 * and the canonical persisted mission counter. Runtime NM._v736.m is a mirror.
 */
(function(root){
  "use strict";
  if(!root)return;
  try{var prior=root.TechOpsGoodBoysProgressionAuthority;if(prior&&prior.timer&&root.clearInterval)root.clearInterval(prior.timer);if(prior&&prior.observer)prior.observer.disconnect();}catch(_){}
  var VERSION=8,timer=null,observer=null,missionSeen=0,seenEnemy=false,emptySince=0,transition=false,lastAdvance=0,repairs=0;
  function now(){return root.performance&&root.performance.now?root.performance.now():Date.now();}
  function cs(){try{return root.NM&&root.NM._v736?root.NM._v736:null;}catch(e){return null;}}
  function meta(){try{if(!root.S)return null;root.S.meta=root.S.meta||{};return root.S.meta._v736||(root.S.meta._v736={m:1,evidence:[],k:false,waldo:false,done:false});}catch(e){return null;}}
  function clampMission(v){v=Number(v);return Math.max(1,Math.min(8,isFinite(v)&&v>0?v:1));}
  function mission(){var m=meta();if(m&&Number(m.m)>0)return clampMission(m.m);var c=cs();return clampMission(c&&c.m||1);}
  function reconcileMission(reason){try{var c=cs(),m=meta();if(!c||!m)return false;var canonical=clampMission(m.m),runtime=clampMission(c.m||canonical);if(runtime!==canonical||Number(c.m)!==canonical){c.m=canonical;repairs++;root.__goodBoysMissionRepair={runtime:runtime,canonical:canonical,reason:reason||"reconcile",at:Date.now(),count:repairs};}return true;}catch(e){root.__goodBoysMissionRepairError=String(e&&e.stack||e);return false;}}
  function invariant(expected,reason){try{var m=meta(),c=cs(),pm=Number(m&&m.m||0),rm=Number(c&&c.m||0),ok=pm===expected&&rm===expected;root.__goodBoysMissionInvariant={ok:ok,expected:expected,metaMission:pm,runtimeMission:rm,reason:reason||"check",at:Date.now()};return ok;}catch(e){root.__goodBoysMissionInvariant={ok:false,expected:expected,error:String(e&&e.stack||e),reason:reason||"check",at:Date.now()};return false;}}
  function living(){try{return (root.NM&&root.NM.enemies||[]).filter(function(e){return e&&e.alive!==false&&Number(e.hp)>0;}).length;}catch(e){return 0;}}
  function pending(){try{var c=cs(),n=root.NM;return !!(c&&(c.pendingSpawn||c.spawnT>0||c.wavePending)||n&&(n.spawnT>0||n.wavePending));}catch(e){return false;}}
  function setMsg(t,ms){try{if(root.NM){root.NM.msg=t;root.NM.msgT=now()+(ms||1800);}}catch(_){} }
  function cinematicVisible(){try{if(!root.document)return false;var a=root.document.getElementById("good-boys-story-cine"),b=root.document.getElementById("gb-prison-cine"),c=root.document.getElementById("good-boys-campaign-intro"),d=root.document.getElementById("good-boys-earthfall-cine"),e=root.document.getElementById("good-boys-ship-interlude");function visible(el){if(!el)return false;var s=root.getComputedStyle?root.getComputedStyle(el):el.style;return !s||s.display!=="none"&&s.visibility!=="hidden"&&Number(s.opacity||1)!==0;}return visible(a)||visible(b)||visible(c)||visible(d)||visible(e);}catch(e){return false;}}
  function enforceCinematicBlock(){try{if(cinematicVisible()&&root.S){root.S.inDialog=true;root.__goodBoysCinematicBlockHeld=(root.__goodBoysCinematicBlockHeld||0)+1;return true;}return false;}catch(e){return false;}}
  function stopLegacyMobileTimer(){try{var m=root.TechOpsGoodBoysMobileRuntimeFix;if(m&&m.timer!=null){root.clearInterval(m.timer);m.timer=null;root.__goodBoysLegacyMobileTimerStopped=true;}}catch(_){} }
  function removeCompetingPads(){try{if(!root.document)return;["good-dogs-touch","good-boys-loop-controls"].forEach(function(id){var xs=root.document.querySelectorAll("#"+id);for(var i=0;i<xs.length;i++)if(xs[i]&&xs[i].parentNode)xs[i].parentNode.removeChild(xs[i]);});var ds=root.document.querySelectorAll("#good-boys-director-controls");for(var j=1;j<ds.length;j++)if(ds[j].parentNode)ds[j].parentNode.removeChild(ds[j]);var keep=ds[0];if(keep){keep.style.display=cs()&&!cinematicVisible()?"grid":"none";keep.style.pointerEvents=cs()&&!cinematicVisible()?"auto":"none";} }catch(_){} }
  function installObserver(){try{if(observer||!root.MutationObserver||!root.document)return;observer=new root.MutationObserver(function(records){var dirty=false;for(var i=0;i<records.length;i++)if(records[i].addedNodes&&records[i].addedNodes.length){dirty=true;break;}if(dirty){reconcileMission("dom-mutation");removeCompetingPads();enforceCinematicBlock();}});observer.observe(root.document.documentElement,{subtree:true,childList:true});}catch(e){root.__goodBoysProgressionObserverError=String(e&&e.stack||e);}}
  function save(){try{if(typeof root.save==="function")root.save();else if(typeof root.saveGame==="function")root.saveGame();}catch(e){root.__goodBoysProgressionSaveError=String(e&&e.stack||e);} }
  function resetWorldForHandoff(){try{var n=root.NM,c=cs();if(c){c.ending=true;c.pendingSpawn=null;}if(n){n.enemies=[];n.clear=false;n._gbShipRevealed=false;n.x=180;n.cam=0;n.hitStop=0;} }catch(_){} }
  function startNext(next){
    try{
      var m=meta();if(!m)return false;next=clampMission(next);
      if(root.S&&!cinematicVisible())root.S.inDialog=false;
      if(next===8&&root.TechOpsGoodBoysEarthfallEnding&&typeof root.TechOpsGoodBoysEarthfallEnding.begin==="function"){reconcileMission("before-earthfall");root.TechOpsGoodBoysEarthfallEnding.begin();return true;}
      if(root.v736&&typeof root.v736.start==="function"){
        root.__goodBoysHandoffInProgress={mission:next,at:Date.now()};
        root.v736.start({mission:next,k:!!m.k,waldo:!!m.waldo,evidence:(m.evidence||[]).slice()});
        var c2=cs(),observed=Number(c2&&c2.m||0);if(c2&&observed!==next)c2.m=next;
        if(observed!==next)root.__goodBoysForcedRepair={expected:next,observed:observed,at:Date.now(),source:"v736.start"};
        reconcileMission("after-v736-start");invariant(next,"after-v736-start");
        try{var a=root.TechOpsGoodBoysAccessCoreAuthority;if(a&&typeof a.tick==="function")a.tick();}catch(_){}
        root.__goodBoysHandoffInProgress=null;return true;
      }
    }catch(e){root.__goodBoysHandoffInProgress=null;root.__goodBoysProgressionError=String(e&&e.stack||e);}
    return false;
  }
  function advance(next,reason){
    try{
      if(transition||now()-lastAdvance<700)return false;var c=cs(),m=meta();if(!c||!m)return false;reconcileMission("pre-transition");var from=mission();if(from>=8)return false;next=Math.min(8,from+1);transition=true;lastAdvance=now();if(from===4)m.k=true;if(from===6)m.waldo=true;
      m.m=next;c.m=next;if(!invariant(next,"pre-save")){reconcileMission("pre-save-repair");if(!invariant(next,"pre-save-repaired"))throw new Error("Good Boys mission invariant failed before save");}
      resetWorldForHandoff();save();if(Number(meta()&&meta().m||0)!==next)throw new Error("Good Boys mission failed to persist: expected "+next);
      root.__goodBoysLastProgression={from:from,to:next,reason:reason||"clear",at:Date.now()};setMsg("MISSION "+from+" COMPLETE · M"+next+" UNLOCKED",2200);
      var restart=function(){try{startNext(next);reconcileMission("handoff-complete");invariant(next,"handoff-complete");}finally{root.setTimeout(function(){transition=false;},500);}};root.setTimeout(restart,120);return true;
    }catch(e){root.__goodBoysProgressionError=String(e&&e.stack||e);transition=false;return false;}
  }
  function revealShip(){try{var n=root.NM;if(!n)return false;if(!n._gbShipRevealed){n._gbShipRevealed=true;n.clear=false;setMsg("HANGAR CLEAR · SECRET SHIP REVEALED",2400);root.__goodBoysShipRevealAt=Date.now();}return true;}catch(e){return false;}}
  function tick(){try{installObserver();stopLegacyMobileTimer();reconcileMission("tick");removeCompetingPads();enforceCinematicBlock();var c=cs(),n=root.NM;if(!c||!n){missionSeen=0;seenEnemy=false;emptySince=0;lastAdvance=0;transition=false;return;}var m=mission();if(m!==missionSeen){missionSeen=m;seenEnemy=false;emptySince=0;}if(transition)return;if(m===8){var end=root.TechOpsGoodBoysEarthfallEnding;if(end&&typeof end.begin==="function")end.begin();return;}if(m===1){var w=root.TechOpsGoodBoysBibleWorld;if(w&&w.updateWaldoTrail)w.updateWaldoTrail();if(n._gbWaldoTrailComplete&&Number(n.x)>=1425)advance(2,"found-hidden-bay-behind-waldo-garage");return;}var alive=living();if(m===2){if(alive>0){seenEnemy=true;emptySince=0;return;}var wavesComplete=Number(c.wave)>=2;if((seenEnemy||wavesComplete)&&!pending())revealShip();if(n._gbShipRevealed&&Number(n.x)>=1255)advance(3,"boarded-secret-ship");return;}if(alive>0){seenEnemy=true;emptySince=0;return;}if(m>=3&&m<=7){if(!seenEnemy||pending())return;if(!emptySince)emptySince=now();if(now()-emptySince>=900)advance(m+1,m===4?"freed-k":m===6?"freed-waldo":m===7?"warden-defeated-shuttle-reached":"encounter-clear");}}catch(e){root.__goodBoysProgressionError=String(e&&e.stack||e);}}
  function acceptance(){var end=root.TechOpsGoodBoysEarthfallEnding,c=cs(),m=meta(),canonical=mission(),runtime=Number(c&&c.m||0),persisted=Number(m&&m.m||0);return{version:VERSION,active:!!c,mission:canonical,runtimeMission:runtime,metaMission:persisted,missionDiverged:!!(c&&m&&runtime!==persisted),missionRepairs:repairs,lastMissionRepair:root.__goodBoysMissionRepair||null,invariant:root.__goodBoysMissionInvariant||null,forcedRepair:root.__goodBoysForcedRepair||null,handoff:root.__goodBoysHandoffInProgress||null,living:living(),pending:pending(),seenEnemy:seenEnemy,emptyFor:emptySince?Math.round(now()-emptySince):0,transition:transition,lastAdvanceAge:lastAdvance?Math.round(now()-lastAdvance):null,last:root.__goodBoysLastProgression||null,cinematicVisible:cinematicVisible(),cinematicBlocked:!!(cinematicVisible()&&root.S&&root.S.inDialog),legacyMobileTimerStopped:!!root.__goodBoysLegacyMobileTimerStopped,directorPads:root.document?root.document.querySelectorAll("#good-boys-director-controls").length:0,legacyPads:root.document?root.document.querySelectorAll("#good-dogs-touch,#good-boys-loop-controls").length:0,waldoTrailComplete:!!(root.NM&&root.NM._gbWaldoTrailComplete),earthfall:end&&end.acceptance?end.acceptance():null};}
  function testPrimeClear(){try{reconcileMission("test-prime");var n=root.NM,c=cs(),before=mission();if(!c||!n||before<3||before>7||transition||now()-lastAdvance<700)return false;n.enemies=[{x:(n.x||100)+40,y:n.y||300,w:28,h:38,hp:1,alive:true,kind:"test-clear"}];tick();for(var i=0;i<n.enemies.length;i++){if(n.enemies[i]){n.enemies[i].hp=0;n.enemies[i].alive=false;}}c.pendingSpawn=null;c.spawnT=0;c.wavePending=false;n.spawnT=0;n.wavePending=false;emptySince=now()-1000;tick();return mission()===before+1&&root.__goodBoysLastProgression&&root.__goodBoysLastProgression.from===before&&root.__goodBoysLastProgression.to===before+1;}catch(e){root.__goodBoysProgressionTestError=String(e&&e.stack||e);return false;}}
  installObserver();timer=root.setInterval?root.setInterval(tick,50):null;root.TechOpsGoodBoysProgressionAuthority={VERSION:VERSION,tick:tick,advance:advance,revealShip:revealShip,startNext:startNext,mission:mission,reconcileMission:reconcileMission,invariant:invariant,acceptance:acceptance,testPrimeClear:testPrimeClear,cinematicVisible:cinematicVisible,enforceCinematicBlock:enforceCinematicBlock,removeCompetingPads:removeCompetingPads,observer:observer,timer:timer};tick();
})(typeof globalThis!=="undefined"?globalThis:this);
