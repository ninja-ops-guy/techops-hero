/* TechOps Hero — Good Dogs pre-rendered cutscene bridge v1.
 * Binds the v2.2 source-master movies to canonical Good Boys mission entry.
 * The campaign progression authority remains the owner of mission state; this
 * bridge only blocks input while a movie plays, writes authored story flags,
 * suppresses overlapping legacy mission cards, and always fails open.
 */
(function(root){
  "use strict";
  if(!root||root.TechOpsGoodDogsCutsceneBridge)return;

  var VERSION=1,timer=null,running=false,currentMission=0,lastObservedMission=0;
  var MISSION_SEQUENCE={
    1:["GD_CUT_01"],
    3:["GD_CUT_02","GD_CUT_03"],
    4:["GD_CUT_04","GD_CUT_05"],
    5:["GD_CUT_06"],
    6:["GD_CUT_07"],
    7:["GD_CUT_08"]
  };
  var WRITES={
    GD_CUT_01:["good_dogs_signal_heard","signal_beyond_earth_seen"],
    GD_CUT_02:["signal_pull_seen"],
    GD_CUT_03:["orbital_detention_seen"],
    GD_CUT_04:["triple_jump_cinematic_seen","cell118_outer_access_seen","cell118_terminal_seen"],
    GD_CUT_05:["k_seen","k_freed"],
    GD_CUT_06:["k_joined_party","escort_started"],
    GD_CUT_07:["cell1984_hack_started","hold_the_door_seeded"],
    GD_CUT_08:["waldo_reunited","release_was_expected_ready"]
  };

  function cs(){try{return root.NM&&root.NM._v736?root.NM._v736:null;}catch(e){return null;}}
  function active(){return !!cs();}
  function mission(){var c=cs();try{return Math.max(1,Math.min(8,Number(c&&c.m||root.S&&root.S.meta&&root.S.meta._v736&&root.S.meta._v736.m||1)));}catch(e){return 1;}}
  function meta(){
    try{
      if(!root.S)return null;
      root.S.meta=root.S.meta||{};
      root.S.meta._v736=root.S.meta._v736||{m:mission(),evidence:[],k:false,waldo:false,done:false};
      return root.S.meta._v736;
    }catch(e){return null;}
  }
  function cutState(){
    try{
      if(root.GoodDogsCutscenes&&typeof root.GoodDogsCutscenes.state==="function")return root.GoodDogsCutscenes.state();
      if(!root.S)return root.__goodDogsCutsceneState||(root.__goodDogsCutsceneState={});
      root.S.meta=root.S.meta||{};
      return root.S.meta.goodDogsCutscenes||(root.S.meta.goodDogsCutscenes={});
    }catch(e){return root.__goodDogsCutsceneState||(root.__goodDogsCutsceneState={});}
  }
  function persist(){try{if(typeof root.save==="function")root.save();else if(typeof root.saveGame==="function")root.saveGame();}catch(_){} }
  function write(name,value){var m=meta();if(m)m[name]=value===undefined?true:value;}
  function writeTrigger(id){
    if(id==="GD_CUT_01")write("good_dogs_campaign_started");
    else if(id==="GD_CUT_02")write("shuttle_launch_started");
    else if(id==="GD_CUT_03")write("shuttle_launched");
    else if(id==="GD_CUT_04")write("triple_jump_route_ready");
    else if(id==="GD_CUT_05")write("cell118_terminal_seen");
    else if(id==="GD_CUT_06")write("k_freed");
    else if(id==="GD_CUT_07")write("cell1984_reached");
    else if(id==="GD_CUT_08")write("waldo_freed");
    persist();
  }
  function applyWrites(id){
    try{
      var flags=WRITES[id]||[];for(var i=0;i<flags.length;i++)write(flags[i]);
      if(id==="GD_CUT_05")write("k_identity_status","K_pending");
      root.__goodDogsCutsceneLastWrite={id:id,mission:mission(),at:Date.now(),flags:flags.slice()};
      persist();return true;
    }catch(e){root.__goodDogsCutsceneWriteError=String(e&&e.stack||e);return false;}
  }
  function seen(id){try{var s=cutState();return !!(s&&s[id]&&s[id].seen);}catch(e){return false;}}
  function unseenForMission(m){var ids=MISSION_SEQUENCE[m]||[],out=[];for(var i=0;i<ids.length;i++)if(!seen(ids[i]))out.push(ids[i]);return out;}

  function prisonPatch(){try{return root.TechOpsGoodBoysPrisonCinematicPatch||null;}catch(e){return null;}}
  function suppressPrison(){
    try{
      var p=prisonPatch();if(!p)return false;
      if(p.pendingEntry&&root.clearTimeout)root.clearTimeout(p.pendingEntry);
      if(typeof p.closePrisonCinematic==="function")p.closePrisonCinematic(true);
      return true;
    }catch(e){return false;}
  }
  function restoreMissionCard(m){
    if(m<3||m>7||m===4)return false; // M4 is replaced by the canonical terminal -> K reveal pair.
    try{
      var p=prisonPatch();if(!p||typeof p.showPrisonCinematic!=="function")return false;
      root.setTimeout(function(){try{if(!running&&active()&&mission()===m)p.showPrisonCinematic(m);}catch(_){}},60);
      return true;
    }catch(e){return false;}
  }
  function setBlocked(on,prior){
    try{
      root.__goodDogsPreRenderedCutsceneActive=!!on;
      if(root.S)root.S.inDialog=on?true:!!prior;
      return true;
    }catch(e){return false;}
  }
  async function playMission(m){
    if(running||!active()||mission()!==m)return false;
    var ids=MISSION_SEQUENCE[m]||[];
    if(!ids.length||!unseenForMission(m).length)return false;
    running=true;currentMission=m;
    var priorDialog=!!(root.S&&root.S.inDialog);
    setBlocked(true,priorDialog);suppressPrison();
    root.__goodDogsCutsceneSequence={mission:m,ids:ids.slice(),startedAt:Date.now(),status:"running"};
    try{
      for(var i=0;i<ids.length;i++){
        var id=ids[i];
        if(!active()||mission()!==m)break;
        writeTrigger(id);
        if(seen(id)){applyWrites(id);continue;}
        suppressPrison();
        if(!root.GoodDogsCutscenes||typeof root.GoodDogsCutscenes.play!=="function"){
          root.__goodDogsCutsceneLoadError="GoodDogsCutscenes player unavailable for "+id;
          applyWrites(id);continue;
        }
        try{
          var result=await root.GoodDogsCutscenes.play(id);
          root.__goodDogsCutsceneLastResult=result||{id:id};
        }catch(e){
          root.__goodDogsCutscenePlayError={id:id,error:String(e&&e.stack||e),at:Date.now()};
        }
        applyWrites(id);
      }
      if(root.__goodDogsCutsceneSequence)root.__goodDogsCutsceneSequence.status="complete";
      return true;
    }catch(e){
      root.__goodDogsCutsceneBridgeError=String(e&&e.stack||e);
      if(root.__goodDogsCutsceneSequence)root.__goodDogsCutsceneSequence.status="error";
      return false;
    }finally{
      running=false;currentMission=0;setBlocked(false,priorDialog);persist();restoreMissionCard(m);
    }
  }
  function tick(){
    try{
      if(running){suppressPrison();if(root.S)root.S.inDialog=true;return;}
      if(!active()){lastObservedMission=0;return;}
      var m=mission();
      if(m===lastObservedMission)return;
      lastObservedMission=m;
      if(MISSION_SEQUENCE[m]&&unseenForMission(m).length)playMission(m);
    }catch(e){root.__goodDogsCutsceneBridgeError=String(e&&e.stack||e);running=false;currentMission=0;}
  }
  function acceptance(){
    var s=cutState(),seenMap={};Object.keys(WRITES).forEach(function(id){seenMap[id]=!!(s&&s[id]&&s[id].seen);});
    return{version:VERSION,active:active(),mission:mission(),running:running,currentMission:currentMission,lastObservedMission:lastObservedMission,seen:seenMap,lastResult:root.__goodDogsCutsceneLastResult||null,lastWrite:root.__goodDogsCutsceneLastWrite||null,error:root.__goodDogsCutscenePlayError||root.__goodDogsCutsceneBridgeError||root.__goodDogsCutsceneLoadError||null};
  }

  timer=root.setInterval?root.setInterval(tick,40):null;
  root.TechOpsGoodDogsCutsceneBridge={VERSION:VERSION,MISSION_SEQUENCE:MISSION_SEQUENCE,WRITES:WRITES,tick:tick,playMission:playMission,acceptance:acceptance,suppressPrison:suppressPrison,restoreMissionCard:restoreMissionCard,get running(){return running;},get timer(){return timer;}};
  tick();
})(typeof globalThis!=="undefined"?globalThis:this);
