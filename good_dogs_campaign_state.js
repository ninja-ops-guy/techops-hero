/* TechOps Hero — Good Dogs Protocol semantic state bridge v4.
 * Canonical story semantics for the compressed 8-mission browser runtime. The
 * Night-derived _v736 mission number remains a transport/runtime detail; these
 * named facts are the Story Bible contract consumed by Ghost Fork / Watchdog.
 */
(function(root){
  "use strict";
  if(!root||root.TechOpsGoodDogsCampaignState)return;
  var VERSION=4,bridgeTimer=null,bridgeInstalled=false,returnTimer=null;
  var ALL_FLAGS=[
    "good_dogs_signal_heard","good_dogs_campaign_started","good_dogs_tutorial_complete","cell_118_known","cell_1984_known",
    "shuttle_launched","orbital_detention_seen","prison_infiltrated","good_dogs_advanced_traversal_unlocked","cell_118_reached","k_seen",
    "k_freed","mike_index_defeated","cell_1984_route_open","waldo_seen","waldo_freed","release_expected_seen","orpheus_prediction_seeded",
    "warden_null_active","shuttle_bay_reached","warden_null_defeated","orbital_custody_broken","waldo_returned","good_dogs_returned",
    "good_dogs_protocol_complete","watchdog_k_available","watchdog_waldo_available","watchdog_good_dogs_available","crew_returned_to_earth"
  ];
  function ensure(){
    if(!root.S)return null;root.S.meta=root.S.meta||{};var g=root.S.meta.goodDogs||(root.S.meta.goodDogs={schemaVersion:VERSION});g.schemaVersion=VERSION;
    if(!root.S.story)root.S.story={schemaVersion:1,completedActs:[],facts:{},ending:null};
    root.S.story.facts=root.S.story.facts||{};root.S.story.completedActs=root.S.story.completedActs||[];
    return g;
  }
  function persist(){try{if(typeof root.save==="function"){root.save();return true;}if(typeof root.saveGame==="function"){root.saveGame();return true;}return false;}catch(e){root.__goodDogsSemanticSaveError=String(e&&e.stack||e);return false;}}
  function write(name,value){
    var g=ensure();if(!g)return false;value=value===undefined?true:value;g[name]=value;root.S.meta[name]=value;
    if(typeof value==="boolean"&&value)root.S.story.facts[name]=true;else if(name==="k_identity_status"||name==="waldo_relationship_k")root.S.story.facts[name]=value;
    g.updatedAt=Date.now();return true;
  }
  function writeMany(obj){for(var k in obj)if(Object.prototype.hasOwnProperty.call(obj,k))write(k,obj[k]);return snapshot();}
  function watchReturn(){
    if(returnTimer||!root.setInterval)return false;
    function check(){try{var m=root.S&&root.S.meta&&root.S.meta._v736;if(m&&m.done){completeReturn();if(returnTimer){root.clearInterval(returnTimer);returnTimer=null;}return true;}}catch(e){root.__goodDogsReturnBridgeError=String(e&&e.stack||e);}return false;}
    if(check())return true;returnTimer=root.setInterval(check,120);return true;
  }
  function markTransition(from,to){
    from=Number(from)||0;to=Number(to)||0;ensure();
    if(from===1&&to===2)writeMany({good_dogs_signal_heard:true,good_dogs_campaign_started:true,good_dogs_tutorial_complete:true,cell_118_known:true,cell_1984_known:true});
    if(from===2&&to===3)writeMany({shuttle_launched:true,orbital_detention_seen:true});
    if(from===3&&to===4)writeMany({prison_infiltrated:true,good_dogs_advanced_traversal_unlocked:true,cell_118_reached:true});
    if(from===4&&to===5)writeMany({k_seen:true,k_freed:true,k_identity_status:"K_pending"});
    if(from===5&&to===6)writeMany({mike_index_defeated:true,k_identity_status:"K",cell_1984_route_open:true});
    if(from===6&&to===7)writeMany({waldo_seen:true,waldo_freed:true,waldo_relationship_k:"accepted",release_expected_seen:true,orpheus_prediction_seeded:true,warden_null_active:true});
    if(from===7&&to===8){writeMany({shuttle_bay_reached:true,warden_null_defeated:true,orbital_custody_broken:true});watchReturn();}
    persist();root.__goodDogsSemanticTransition={from:from,to:to,at:Date.now(),state:snapshot(),persisted:true};return true;
  }
  function completeReturn(){
    var g=ensure();if(!g)return null;if(g.good_dogs_protocol_complete&&g.watchdog_k_available&&g.watchdog_waldo_available&&g.watchdog_good_dogs_available)return snapshot();
    writeMany({
      k_freed:true,k_identity_status:"K",waldo_freed:true,waldo_returned:true,good_dogs_returned:true,good_dogs_protocol_complete:true,
      warden_null_defeated:true,orbital_custody_broken:true,crew_returned_to_earth:true,
      watchdog_k_available:true,watchdog_waldo_available:true,watchdog_good_dogs_available:true
    });
    var story=root.S&&root.S.story;if(story){
      ["k_freed","waldo_freed","warden_null_defeated","crew_returned_to_earth","good_dogs_protocol_complete","watchdog_k_available","watchdog_waldo_available","watchdog_good_dogs_available"].forEach(function(f){story.facts[f]=true;});
      if(story.completedActs.indexOf("interlude")<0)story.completedActs.push("interlude");
    }
    g.completedAt=Date.now();root.__goodDogsMainCampaignBridge={complete:true,at:g.completedAt,facts:story&&story.facts||{}};persist();return snapshot();
  }
  function snapshot(){var g=ensure()||{},out={schemaVersion:VERSION};ALL_FLAGS.forEach(function(k){out[k]=g[k]!==undefined?g[k]:root.S&&root.S.meta&&root.S.meta[k];});out.k_identity_status=g.k_identity_status;out.waldo_relationship_k=g.waldo_relationship_k;return out;}
  function validate(){
    var s=snapshot(),errors=[];
    if(s.k_freed&&!(s.cell_118_reached||s.k_seen))errors.push("k_freed requires Cell 118 reach/identity encounter");
    if(s.waldo_freed&&!s.k_freed)errors.push("waldo_freed requires K freed first");
    if(s.warden_null_defeated&&!s.waldo_freed)errors.push("Warden defeat requires Waldo freed");
    if(s.good_dogs_protocol_complete&&!(s.k_freed&&s.waldo_freed&&s.warden_null_defeated&&s.crew_returned_to_earth))errors.push("Good Dogs completion missing rescue/return prerequisites");
    if(s.good_dogs_protocol_complete&&!(s.watchdog_k_available&&s.watchdog_waldo_available&&s.watchdog_good_dogs_available))errors.push("Good Dogs completion must unlock Watchdog participation");
    return{valid:errors.length===0,errors:errors,state:s,version:VERSION,at:Date.now()};
  }
  function installTransitionBridge(){
    if(bridgeInstalled)return true;var c=root.TechOpsGoodBoysCampaignState;if(!c||typeof c.transition!=="function")return false;if(c.transition.__goodDogsSemanticBridge){bridgeInstalled=true;return true;}
    var base=c.transition;var wrapped=function(from,to,reason,patch){var ok=base.apply(this,arguments);if(ok!==false)markTransition(from,to);return ok;};wrapped.__goodDogsSemanticBridge=true;wrapped.__baseTransition=base;c.transition=wrapped;bridgeInstalled=true;root.__goodDogsSemanticBridgeInstalled=true;return true;
  }
  var API=root.TechOpsGoodDogsCampaignState={VERSION:VERSION,ALL_FLAGS:ALL_FLAGS.slice(),ensure:ensure,persist:persist,write:write,writeMany:writeMany,markTransition:markTransition,completeReturn:completeReturn,snapshot:snapshot,validate:validate,installTransitionBridge:installTransitionBridge,watchReturn:watchReturn};
  ensure();
  try{var initial=root.S&&root.S.meta&&root.S.meta._v736;if(initial&&initial.done)completeReturn();else if(initial&&Number(initial.m)===8)watchReturn();}catch(_){}
  if(!installTransitionBridge()&&root.setInterval){bridgeTimer=root.setInterval(function(){if(installTransitionBridge()){root.clearInterval(bridgeTimer);bridgeTimer=null;}},50);root.setTimeout(function(){if(bridgeTimer){root.clearInterval(bridgeTimer);bridgeTimer=null;root.__goodDogsSemanticBridgeError="progression authority not found within bridge window";}},5000);}
})(typeof globalThis!=="undefined"?globalThis:this);
