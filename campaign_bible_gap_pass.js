/* TechOps Hero — Story Bible v1.2 gap pass.
 * Closes three authored-content gaps without creating parallel state authorities:
 *   1) guarantee the canonical Day 1 Shipping / Plating / Impossible Access spine,
 *   2) make K the EMRLD — Red in the Mirror real diegetic workstation music that
 *      ducks under Felicia's company video and resumes afterward,
 *   3) add the quiet Mike/K recognition beat to the existing Ghost Fork gk6 finale.
 */
(function(root){
  "use strict";
  if(!root||root.TechOpsCampaignBibleGapPass)return;

  var VERSION=1;
  var CANONICAL_DAY1=["shipping_cannot_print","plating_workstation_down","impossible_access_event"];
  var CONTACT_IDS=["campaign_shipping","campaign_plating","campaign_access"];
  var timer=null,feliciaVideoVisible=false,recognitionSaved=false;

  function now(){return Date.now();}
  function campaign(){return root.TechOpsCampaign||null;}
  function nativeAct1(){return root.TechOpsCampaignNativeAct1||null;}
  function storage(){try{return root.localStorage||null;}catch(_){return null;}}
  function gameState(){try{return root.S||null;}catch(_){return null;}}
  function saveGame(){try{if(typeof root.save==="function")return root.save();if(typeof root.saveGame==="function")return root.saveGame();}catch(e){root.__techopsBibleGapSaveError=String(e&&e.stack||e);}return false;}

  function canonicalCampaignState(){
    try{var c=campaign(),s=storage();return c&&typeof c.load==="function"?c.load(s):null;}catch(e){root.__techopsBibleGapCampaignLoadError=String(e&&e.stack||e);return null;}
  }

  function ensureDay1Spine(){
    var gs=gameState(),c=campaign(),n=nativeAct1(),state=canonicalCampaignState();
    if(!gs||!c||!n||!state||!state.campaign)return {active:false,reason:"authorities-not-ready"};
    if(Number(state.campaign.day)!==1||state.flags&&state.flags.tuesday_morning_reached)return {active:false,reason:"not-day-1"};
    try{if(typeof n.ensureWorld==="function")n.ensureWorld();}catch(e){root.__techopsCanonicalDay1Error=String(e&&e.stack||e);}
    var ticketContract=Array.isArray(c.TICKETS)?c.TICKETS:[];
    var missingTickets=CANONICAL_DAY1.filter(function(id){return ticketContract.indexOf(id)<0;});
    var npcs=Array.isArray(gs.npcs)?gs.npcs:[];
    var missingContacts=CONTACT_IDS.filter(function(id){return !npcs.some(function(npc){return npc&&npc.id===id;});});
    var result={active:true,guaranteed:missingTickets.length===0&&missingContacts.length===0,tickets:CANONICAL_DAY1.slice(),contacts:CONTACT_IDS.slice(),missingTickets:missingTickets,missingContacts:missingContacts,at:now()};
    gs.meta=gs.meta||{};gs.meta.canonicalDay1Spine=result;root.__techopsCanonicalDay1Spine=result;
    return result;
  }

  var DiegeticMusic=(function(){
    var widget=null,redActive=false,ducked=false,restoreVolume=18,trackIndex=-1,trackTitle="",lastError=null,priming=false,nextPrimeAt=0,readyBound=false;
    function diag(extra){
      var d={version:1,redActive:redActive,ducked:ducked,restoreVolume:restoreVolume,trackIndex:trackIndex,trackTitle:trackTitle,lastError:lastError,priming:priming,at:now()};
      if(extra)Object.keys(extra).forEach(function(k){d[k]=extra[k];});
      root.__techopsDiegeticMusic=d;return d;
    }
    function getWidget(){
      if(widget)return widget;
      try{
        var frame=root.document&&root.document.getElementById("sc-widget");
        if(!frame||!root.SC||typeof root.SC.Widget!=="function")return null;
        widget=root.SC.Widget(frame);
        if(!readyBound&&root.SC.Widget.Events&&typeof widget.bind==="function"){
          readyBound=true;widget.bind(root.SC.Widget.Events.READY,function(){nextPrimeAt=0;prime();});
        }
        return widget;
      }catch(e){lastError=String(e&&e.stack||e);diag();return null;}
    }
    function setVolume(value){var w=getWidget();if(!w)return false;try{w.setVolume(value);return true;}catch(e){lastError=String(e&&e.stack||e);diag();return false;}}
    function findTrack(sounds){
      sounds=Array.isArray(sounds)?sounds:[];
      for(var i=0;i<sounds.length;i++){
        var title=String(sounds[i]&&sounds[i].title||""),permalink=String(sounds[i]&&sounds[i].permalink_url||"");
        if(/red\s+in\s+the\s+mirror/i.test(title)||/red[-_]?in[-_]?the[-_]?mirror/i.test(permalink)){trackIndex=i;trackTitle=title||"Red in the Mirror";lastError=null;return true;}
      }
      return false;
    }
    function prime(){
      if(trackIndex>=0||priming||now()<nextPrimeAt)return trackIndex>=0;
      var w=getWidget();if(!w)return false;priming=true;
      try{
        w.getSounds(function(sounds){
          priming=false;if(!findTrack(sounds)){lastError="Red in the Mirror not found in SoundCloud playlist";nextPrimeAt=now()+2500;}diag({primed:trackIndex>=0});
        });return true;
      }catch(e){priming=false;nextPrimeAt=now()+2500;lastError=String(e&&e.stack||e);diag();return false;}
    }
    function startKnownTrack(w,source){
      if(trackIndex<0)return false;
      try{
        w.skip(trackIndex);w.setVolume(18);w.play();redActive=true;ducked=false;restoreVolume=18;
        root.__techopsRedMirrorPlayback={playing:true,index:trackIndex,title:trackTitle||"Red in the Mirror",context:"ordinary_listening",source:source||"workstation",at:now()};
        diag({requested:true,found:true,gesturePath:source||"workstation"});return true;
      }catch(e){lastError=String(e&&e.stack||e);diag();return false;}
    }
    function playRed(){
      var w=getWidget();if(!w){lastError="SoundCloud widget unavailable";diag({requested:true});return false;}
      // Preferred path: track index was resolved before the player taps MUSIC, so skip/play
      // both execute inside the same iPhone user gesture that invoked hearRedInMirror().
      if(trackIndex>=0)return startKnownTrack(w,"primed-user-gesture");
      try{
        w.getSounds(function(sounds){
          try{if(!findTrack(sounds)){lastError="Red in the Mirror not found in SoundCloud playlist";redActive=false;diag({requested:true,found:false});return;}startKnownTrack(w,"async-fallback");}
          catch(e){lastError=String(e&&e.stack||e);diag();}
        });return true;
      }catch(e){lastError=String(e&&e.stack||e);diag();return false;}
    }
    function duck(reason){
      if(!redActive||ducked)return false;var w=getWidget();if(!w)return false;
      try{
        if(typeof w.getVolume==="function")w.getVolume(function(v){if(Number(v)>5)restoreVolume=Number(v);setVolume(5);});else setVolume(5);
        ducked=true;diag({reason:reason||"dialogue"});return true;
      }catch(e){lastError=String(e&&e.stack||e);diag();return false;}
    }
    function resume(reason){if(!redActive||!ducked)return false;ducked=false;setVolume(restoreVolume||18);diag({reason:reason||"dialogue-closed"});return true;}
    function acceptance(){return diag();}
    return{VERSION:1,prime:prime,playRed:playRed,duck:duck,resume:resume,acceptance:acceptance};
  })();
  root.TechOpsDiegeticMusic=DiegeticMusic;

  function patchRedInMirror(){
    var c=campaign();if(!c||typeof c.hearRedInMirror!=="function")return false;
    if(c.hearRedInMirror.__techopsDiegeticRed)return true;
    var base=c.hearRedInMirror;
    var wrapped=function(state){var result=base.apply(this,arguments);DiegeticMusic.playRed();return result;};
    wrapped.__techopsDiegeticRed=true;wrapped.__base=base;c.hearRedInMirror=wrapped;return true;
  }

  function watchFeliciaVideo(){
    if(!root.document)return false;
    var name=root.document.getElementById("dlg-name"),dialog=root.document.getElementById("dialogue");
    var visible=!!(name&&/ENGINEERING THE HUMAN CONNECTION/i.test(name.textContent||"")&&(!dialog||!dialog.classList.contains("hidden")));
    if(visible&&!feliciaVideoVisible)DiegeticMusic.duck("felicia-company-video");
    if(!visible&&feliciaVideoVisible)DiegeticMusic.resume("felicia-company-video-closed");
    feliciaVideoVisible=visible;return visible;
  }

  function recognitionShots(h){
    var floor=h.LH-h.BAR-34;
    return[
      {dur:3000,cap:"Two people meet before either one becomes an explanation.",draw:function(x){h.bg(x,"#14101a");h.mike(x,"down0",420,floor,190);h.k(x,850,floor,190);h.txt(x,"WALDO'S PLACE — DAWN",h.LW/2,h.BAR+48,16,h.DIM,"center",true);h.bubble(x,"Waldo said there was someone I should meet.",205,h.BAR+120,430);h.bubble(x,"K.",720,h.BAR+205,250);}},
      {dur:3400,cap:"Mike recognizes the title only after he has met the person.",draw:function(x){h.bg(x,"#120b11");h.mike(x,"down0",420,floor,190);h.k(x,850,floor,190);x.fillStyle="rgba(255,68,85,.18)";x.fillRect(0,h.LH/2-2,h.LW,4);h.bubble(x,"Red in the Mirror?",235,h.BAR+135,330);h.bubble(x,"Red is me. You're the mirror.",690,h.BAR+225,410);h.txt(x,"RED IN THE MIRROR",h.LW/2,h.BAR+54,18,h.RED,"center",true);}},
      {dur:3000,cap:"A branch is not a backup. A person chooses the name that stays.",draw:function(x){h.bg(x,"#0d1118");h.mike(x,"down0",420,floor,190);h.k(x,850,floor,190,"fist");h.bubble(x,"You're not me.",245,h.BAR+145,300);h.bubble(x,"Never was.",720,h.BAR+225,270);h.txt(x,"NOT A COPY. NOT A BACKUP. K.",h.LW/2,h.LH-h.BAR-12,17,h.GOLD,"center",true);}}
    ];
  }

  function injectKRecognition(){
    try{
      var engine=root.v725;if(!engine||typeof engine.defs!=="function"||!engine.h)return false;
      var defs=engine.defs(),def=defs&&defs.gk6;if(!def||!Array.isArray(def.shots))return false;
      if(def.__techopsRecognitionV1)return true;
      var shots=recognitionShots(engine.h),insertAt=Math.max(0,def.shots.length-1),oldLast=def.shots.length-1;
      def.shots.splice.apply(def.shots,[insertAt,0].concat(shots));
      if(def.cues&&def.cues[oldLast]==="chime"){delete def.cues[oldLast];def.cues[def.shots.length-1]="chime";}
      def.__techopsRecognitionV1=true;root.__techopsKRecognitionInjected={scene:"gk6",insertAt:insertAt,shots:shots.length,line:"Red is me. You're the mirror.",at:now()};return true;
    }catch(e){root.__techopsKRecognitionInjectionError=String(e&&e.stack||e);return false;}
  }

  function commitKRecognition(){
    var gs=gameState();if(!gs||!gs.meta||!gs.meta._v734gk6)return false;
    if(gs.meta._v734recognitionCommitted){recognitionSaved=true;return true;}
    gs.meta._v734recognitionCommitted=true;gs.meta._v734recognitionLine="Red is me. You're the mirror.";
    try{
      var c=campaign(),s=storage(),state=c&&typeof c.load==="function"?c.load(s):null,storyApi=root.TechOpsStory;
      if(state&&storyApi&&typeof storyApi.ensureStoryState==="function"){
        var story=storyApi.ensureStoryState(state);story.facts.mike_meets_k=true;story.facts.k_personhood_affirmed=true;
        state.history=state.history||[];state.history.push({type:"k_recognition_committed",line:"Red is me. You're the mirror.",at:new Date().toISOString()});
        if(c&&typeof c.save==="function")c.save(state,s);
      }
    }catch(e){root.__techopsKRecognitionCommitError=String(e&&e.stack||e);}
    saveGame();recognitionSaved=true;root.__techopsKRecognitionCommitted={committed:true,at:now()};return true;
  }

  function acceptance(){
    var day1=root.__techopsCanonicalDay1Spine||null;
    return{version:VERSION,canonicalDay1:day1,day1Guaranteed:!!(day1&&day1.guaranteed),music:DiegeticMusic.acceptance(),redMirrorHooked:!!(campaign()&&campaign().hearRedInMirror&&campaign().hearRedInMirror.__techopsDiegeticRed),feliciaVideoVisible:feliciaVideoVisible,kRecognitionInjected:!!root.__techopsKRecognitionInjected,kRecognitionCommitted:!!(gameState()&&gameState().meta&&gameState().meta._v734recognitionCommitted),recognitionSaved:recognitionSaved};
  }

  function tick(){try{patchRedInMirror();DiegeticMusic.prime();ensureDay1Spine();watchFeliciaVideo();injectKRecognition();commitKRecognition();}catch(e){root.__techopsBibleGapTickError=String(e&&e.stack||e);}}

  root.TechOpsCampaignBibleGapPass={VERSION:VERSION,CANONICAL_DAY1:CANONICAL_DAY1.slice(),ensureDay1Spine:ensureDay1Spine,music:DiegeticMusic,patchRedInMirror:patchRedInMirror,injectKRecognition:injectKRecognition,commitKRecognition:commitKRecognition,acceptance:acceptance,tick:tick};
  tick();if(root.setInterval)timer=root.setInterval(tick,250);root.TechOpsCampaignBibleGapPass.timer=timer;
})(typeof globalThis!=="undefined"?globalThis:this);
