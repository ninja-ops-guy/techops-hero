/* TechOps Hero — Good Dogs pre-rendered cutscene bridge v4.
 * Mission cinematics punctuate gameplay instead of replacing it.
 * M4 now plays the terminal approach first; the K reveal (GD_CUT_05) is gated
 * to the actual Cell 118 open event so two videos are never launched back-to-back
 * at mission entry. GD_CUT_03 remains retired.
 */
(function(root){
  "use strict";if(!root)return;
  try{var prior=root.TechOpsGoodDogsCutsceneBridge;if(prior&&prior.timer&&root.clearInterval)root.clearInterval(prior.timer);}catch(_){}
  var VERSION=4,timer=null,running=false,currentMission=0,lastObservedMission=0;
  var MISSION_SEQUENCE={4:["GD_CUT_04"],5:["GD_CUT_06"],6:["GD_CUT_07"],7:["GD_CUT_08"]};
  var CONDITIONAL_SEQUENCE={4:{id:"GD_CUT_05",when:"cellOpened"}};
  var WRITES={GD_CUT_01:["good_dogs_signal_heard","signal_beyond_earth_seen"],GD_CUT_02:["signal_pull_seen","ship_takeover_complete"],GD_CUT_03:["orbital_detention_seen"],GD_CUT_04:["triple_jump_cinematic_seen","cell118_outer_access_seen","cell118_terminal_seen"],GD_CUT_05:["k_seen","k_freed"],GD_CUT_06:["k_joined_party","escort_started"],GD_CUT_07:["cell1984_hack_started","hold_the_door_seeded"],GD_CUT_08:["waldo_reunited","release_was_expected_ready"]};
  function cs(){try{return root.NM&&root.NM._v736?root.NM._v736:null;}catch(e){return null;}}
  function active(){return!!cs();}
  function mission(){var c=cs();try{return Math.max(1,Math.min(8,Number(c&&c.m||root.S&&root.S.meta&&root.S.meta._v736&&root.S.meta._v736.m||1)));}catch(e){return 1;}}
  function meta(){try{if(!root.S)return null;root.S.meta=root.S.meta||{};root.S.meta._v736=root.S.meta._v736||{m:mission(),evidence:[],k:false,waldo:false,done:false};return root.S.meta._v736;}catch(e){return null;}}
  function cutState(){try{if(root.GoodDogsCutscenes&&typeof root.GoodDogsCutscenes.state==="function")return root.GoodDogsCutscenes.state();if(!root.S)return root.__goodDogsCutsceneState||(root.__goodDogsCutsceneState={});root.S.meta=root.S.meta||{};return root.S.meta.goodDogsCutscenes||(root.S.meta.goodDogsCutscenes={});}catch(e){return root.__goodDogsCutsceneState||(root.__goodDogsCutsceneState={});}}
  function persist(){try{if(typeof root.save==="function")root.save();else if(typeof root.saveGame==="function")root.saveGame();}catch(_){}}
  function write(name,value){var m=meta();if(m)m[name]=value===undefined?true:value;}
  function applyWrites(id){var flags=WRITES[id]||[];for(var i=0;i<flags.length;i++)write(flags[i]);if(id==="GD_CUT_05")write("k_identity_status","K_pending");root.__goodDogsCutsceneLastWrite={id:id,mission:mission(),at:Date.now(),flags:flags.slice()};persist();}
  function seen(id){try{var s=cutState();return!!(s&&s[id]&&s[id].seen);}catch(e){return false;}}
  function unseen(m){var ids=MISSION_SEQUENCE[m]||[],o=[];for(var i=0;i<ids.length;i++)if(!seen(ids[i]))o.push(ids[i]);return o;}
  function prisonPatch(){try{return root.TechOpsGoodBoysPrisonCinematicPatch||null;}catch(e){return null;}}
  function elementVisible(id){try{var el=root.document&&root.document.getElementById(id);if(!el)return false;if(el.classList&&el.classList.contains("hidden"))return false;var s=root.getComputedStyle?root.getComputedStyle(el):el.style;return !s||s.display!=="none"&&s.visibility!=="hidden"&&Number(s.opacity||1)!==0;}catch(e){return false;}}
  function blockerVisible(){return elementVisible("good-dogs-cutscene-overlay")||elementVisible("gb-prison-cine")||elementVisible("good-boys-story-cine")||elementVisible("good-boys-earthfall-cine")||elementVisible("good-boys-campaign-intro")||elementVisible("dialogue");}
  function suppress(){try{var p=prisonPatch();if(!p)return false;if(p.pendingEntry&&root.clearTimeout)root.clearTimeout(p.pendingEntry);if(typeof p.closePrisonCinematic==="function")p.closePrisonCinematic(true);return true;}catch(e){return false;}}
  function restore(m){if(m<3||m>7||m===4)return false;try{var p=prisonPatch();if(!p||typeof p.showPrisonCinematic!=="function")return false;root.setTimeout(function(){try{if(!running&&active()&&mission()===m&&!blockerVisible())p.showPrisonCinematic(m);}catch(_){}},80);return true;}catch(e){return false;}}
  function block(on){try{root.__goodDogsPreRenderedCutsceneActive=!!on;if(root.S)root.S.inDialog=on?true:blockerVisible();return true;}catch(e){return false;}}
  function nextTurn(){return new Promise(function(resolve){try{if(root.requestAnimationFrame)root.requestAnimationFrame(function(){(root.setTimeout||setTimeout)(resolve,0);});else(root.setTimeout||setTimeout)(resolve,0);}catch(_){resolve();}});}
  function validResult(r){return!!(r&&(r.status==="COMPLETED"||r.status==="USER_SKIPPED"));}
  async function playClip(id,m){
    if(!active()||mission()!==m||seen(id))return seen(id);
    suppress();block(true);
    if(!root.GoodDogsCutscenes||typeof root.GoodDogsCutscenes.play!=="function"){root.__goodDogsCutsceneLoadError="player unavailable for "+id;return false;}
    try{
      var r=await root.GoodDogsCutscenes.play(id,{muted:true,noPoster:true});root.__goodDogsCutsceneLastResult=r;
      if(!validResult(r)){root.__goodDogsCutscenePlayError={id:id,error:"non-terminal result",result:r,at:Date.now()};return false;}
      applyWrites(id);await nextTurn();return true;
    }catch(e){root.__goodDogsCutscenePlayError={id:id,error:String(e&&e.stack||e),at:Date.now()};return false;}
  }
  async function playMission(m){
    if(running||!active()||mission()!==m)return false;var ids=MISSION_SEQUENCE[m]||[];if(!ids.length||!unseen(m).length)return false;
    running=true;currentMission=m;block(true);suppress();root.__goodDogsCutsceneSequence={mission:m,ids:ids.slice(),startedAt:Date.now(),status:"running"};
    try{for(var i=0;i<ids.length;i++){if(!active()||mission()!==m)break;var id=ids[i];if(seen(id))continue;if(!await playClip(id,m)){root.__goodDogsCutsceneSequence.status="media-wait-or-error";return false;}}root.__goodDogsCutsceneSequence.status="complete";return true;}
    catch(e){root.__goodDogsCutsceneBridgeError=String(e&&e.stack||e);if(root.__goodDogsCutsceneSequence)root.__goodDogsCutsceneSequence.status="error";return false;}
    finally{running=false;currentMission=0;block(false);persist();restore(m);}
  }
  async function playConditional(m){
    var rule=CONDITIONAL_SEQUENCE[m],c=cs();if(!rule||running||!c||mission()!==m||seen(rule.id)||!c[rule.when])return false;
    running=true;currentMission=m;block(true);suppress();root.__goodDogsCutsceneSequence={mission:m,ids:[rule.id],conditional:rule.when,startedAt:Date.now(),status:"running"};
    try{var ok=await playClip(rule.id,m);root.__goodDogsCutsceneSequence.status=ok?"complete":"media-wait-or-error";return ok;}
    catch(e){root.__goodDogsCutsceneBridgeError=String(e&&e.stack||e);return false;}
    finally{running=false;currentMission=0;block(false);persist();}
  }
  function tick(){
    try{
      if(running){suppress();if(root.S)root.S.inDialog=true;return;}
      if(!active()){lastObservedMission=0;block(false);return;}
      var m=mission(),rule=CONDITIONAL_SEQUENCE[m],c=cs();
      if(rule&&c&&c[rule.when]&&!seen(rule.id)){playConditional(m);return;}
      if(m!==lastObservedMission){lastObservedMission=m;if(MISSION_SEQUENCE[m]&&unseen(m).length)playMission(m);}
      else block(false);
    }catch(e){root.__goodDogsCutsceneBridgeError=String(e&&e.stack||e);running=false;currentMission=0;block(false);}
  }
  function acceptance(){var s=cutState(),map={};Object.keys(WRITES).forEach(function(id){map[id]=!!(s&&s[id]&&s[id].seen);});return{version:VERSION,active:active(),mission:mission(),running:running,currentMission:currentMission,lastObservedMission:lastObservedMission,sequence:MISSION_SEQUENCE,conditional:CONDITIONAL_SEQUENCE,retired:["GD_CUT_03"],seen:map,dialogBlocked:!!(root.S&&root.S.inDialog),visibleBlocker:blockerVisible(),error:root.__goodDogsCutscenePlayError||root.__goodDogsCutsceneBridgeError||root.__goodDogsCutsceneLoadError||null};}
  timer=root.setInterval?root.setInterval(tick,40):null;
  root.TechOpsGoodDogsCutsceneBridge={VERSION:VERSION,MISSION_SEQUENCE:MISSION_SEQUENCE,CONDITIONAL_SEQUENCE:CONDITIONAL_SEQUENCE,WRITES:WRITES,tick:tick,playMission:playMission,playConditional:playConditional,acceptance:acceptance,get running(){return running;},get timer(){return timer;}};tick();
})(typeof globalThis!=="undefined"?globalThis:this);
