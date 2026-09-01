/* TechOps Hero — Story Bible completion runtime v2
 * One maintenance owner for the Day 1/K gap pass plus gaps 4–7. This prevents
 * the completion layer from adding a collection of independent polling loops.
 */
(function(root){
  "use strict";
  if(!root || root.TechOpsCampaignCompletionRuntime) return;
  var VERSION=2,timer=null,ticks=0,lastError=null,lastValidation=null;
  function parkPrivateTimer(obj){try{if(obj&&obj.timer!=null&&root.clearInterval){root.clearInterval(obj.timer);obj.timer=null;return true;}}catch(e){}return false;}
  function installOwners(){
    try{parkPrivateTimer(root.TechOpsCampaignBibleGapPass);}catch(e){}
    try{parkPrivateTimer(root.TechOpsLateGameCampaign);}catch(e){}
    try{parkPrivateTimer(root.TechOpsMORNINGSTARRuntime);}catch(e){}
    try{if(root.TechOpsFeliciaFirstOfficeDialogue&&root.TechOpsFeliciaFirstOfficeDialogue.install)root.TechOpsFeliciaFirstOfficeDialogue.install();}catch(e){lastError=String(e&&e.stack||e);}
    try{if(root.TechOpsMORNINGSTARBuild&&root.TechOpsMORNINGSTARBuild.install)root.TechOpsMORNINGSTARBuild.install();}catch(e){lastError=String(e&&e.stack||e);}
    try{if(root.TechOpsMORNINGSTARRuntime&&root.TechOpsMORNINGSTARRuntime.install)root.TechOpsMORNINGSTARRuntime.install();}catch(e){lastError=String(e&&e.stack||e);}
  }
  function validate(){
    try{
      var c=root.TechOpsCampaign,s=c&&c.load?c.load(root.localStorage):null,v=root.TechOpsStateValidator;
      if(s&&v&&typeof v.validateStory==="function"){lastValidation=v.validateStory(s);root.__campaignCompletionValidation=lastValidation;}
    }catch(e){lastError=String(e&&e.stack||e);}
  }
  function tick(){
    ticks++;installOwners();
    try{if(root.TechOpsCampaignBibleGapPass&&root.TechOpsCampaignBibleGapPass.tick)root.TechOpsCampaignBibleGapPass.tick();}catch(e){lastError=String(e&&e.stack||e);}
    try{if(root.TechOpsSwarmDoctrine&&root.TechOpsSwarmDoctrine.checkQuestioningMoment)root.TechOpsSwarmDoctrine.checkQuestioningMoment();}catch(e){lastError=String(e&&e.stack||e);}
    try{if(root.TechOpsLateGameCampaign&&root.TechOpsLateGameCampaign.check)root.TechOpsLateGameCampaign.check();}catch(e){lastError=String(e&&e.stack||e);}
    if(ticks%8===0)validate();
    root.__campaignCompletionRuntimeTick=ticks;
  }
  function health(){return{version:VERSION,ticks:ticks,timerOwned:timer!=null,lastError:lastError,lastValidation:lastValidation,day1:root.TechOpsCampaignBibleGapPass&&root.TechOpsCampaignBibleGapPass.acceptance?root.TechOpsCampaignBibleGapPass.acceptance():null,morningstar:root.TechOpsMORNINGSTARBuild&&root.TechOpsMORNINGSTARBuild.snapshot?root.TechOpsMORNINGSTARBuild.snapshot():null,morningstarRuntime:root.TechOpsMORNINGSTARRuntime&&root.TechOpsMORNINGSTARRuntime.acceptance?root.TechOpsMORNINGSTARRuntime.acceptance():null,swarm:root.TechOpsSwarmDoctrine&&root.TechOpsSwarmDoctrine.snapshot?root.TechOpsSwarmDoctrine.snapshot():null,lateGame:root.TechOpsLateGameCampaign&&root.TechOpsLateGameCampaign.snapshot?root.TechOpsLateGameCampaign.snapshot():null};}
  timer=(root.setInterval||setInterval)(tick,250);
  root.TechOpsCampaignCompletionRuntime={VERSION:VERSION,tick:tick,installOwners:installOwners,validate:validate,health:health,timer:timer};
  tick();
})(typeof globalThis!=="undefined"?globalThis:this);
