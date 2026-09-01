/* TechOps Hero — Felicia first-office "Marketing" beat v1
 * Intercepts only Felicia's first daylight interaction after the company video.
 * It then yields permanently to campaign_native_act2.js.
 */
(function(root){
  "use strict";
  if(!root || root.TechOpsFeliciaFirstOfficeDialogue) return;
  var VERSION=1, wrapped=false;
  var LINES=[
    ["MIKE","You're the one from the company video."],
    ["FELICIA","Depends which video. I've been in a few."],
    ["TEAMMATE","Marketing's here."],
    ["MIKE","Marketing?"],
    ["TEAMMATE","Technically she's Systems Integrations. Security Research. But you'll understand when you meet her."],
    ["FELICIA","I play violin on aircraft. It makes people nervous when Security Research does that."],
    ["MIKE","Your title says security research."],
    ["FELICIA","It does. I also fix things. Sometimes I break them first to see how they work. The violin is quieter than the alternatives."],
    ["MIKE","I'll keep that in mind."],
    ["FELICIA","You should. I'm about to ask you for printer access."]
  ];
  function campaign(){try{return root.TechOpsCampaign&&root.TechOpsCampaign.load?root.TechOpsCampaign.load(root.localStorage):null;}catch(e){return null;}}
  function save(s){try{if(root.TechOpsCampaign&&root.TechOpsCampaign.save)root.TechOpsCampaign.save(s,root.localStorage);return true;}catch(e){root.__feliciaOfficeSaveError=String(e&&e.stack||e);return false;}}
  function office(s){s.p1=s.p1||{};return s.p1.office||(s.p1.office={feliciaFirstOfficeMet:false,at:null});}
  function watched(s){var f=s&&s.flags||{};return !!(f.felicia_video_watched||f.feliciaVideoSeen);}
  function canTrigger(){var s=campaign();return !!(s&&watched(s)&&!office(s).feliciaFirstOfficeMet);}
  function play(i){
    i=i||0;
    if(i>=LINES.length){
      var s=campaign();if(s){var o=office(s);o.feliciaFirstOfficeMet=true;o.at=new Date().toISOString();save(s);}
      root.__feliciaFirstOfficeBeat={complete:true,at:Date.now(),version:VERSION};
      if(typeof root.closeDlg==="function")root.closeDlg();
      return true;
    }
    if(typeof root.dlg!=="function")return false;
    var line=LINES[i];
    root.dlg(line[0],line[1],[{t:i===LINES.length-1?"Back to work":"Continue",f:function(){play(i+1);}}]);
    return true;
  }
  function trigger(){if(!canTrigger())return false;root.__feliciaFirstOfficeBeat={complete:false,started:Date.now(),version:VERSION};return play(0);}
  function adjacentFelicia(){
    try{
      var s=root.S;if(!s||!s.npcs||typeof root.adjacent!=="function")return false;
      var p={x:s.px,y:s.py};
      for(var i=0;i<s.npcs.length;i++){var n=s.npcs[i];if(n&&n.campaignAct2==="felicia_daylight"&&root.adjacent(p,n))return true;}
    }catch(e){}return false;
  }
  function install(){
    if(wrapped||typeof root.interact!=="function")return false;
    var base=root.interact;
    var fn=function(){if(canTrigger()&&adjacentFelicia())return trigger();return base.apply(this,arguments);};
    fn.__feliciaOfficeWrapped=true;fn.__base=base;root.interact=fn;wrapped=true;return true;
  }
  var timer=(root.setInterval||setInterval)(function(){if(install()&&timer){(root.clearInterval||clearInterval)(timer);timer=null;}},250);
  root.TechOpsFeliciaFirstOfficeDialogue={VERSION:VERSION,LINES:LINES,canTrigger:canTrigger,trigger:trigger,install:install};
  install();
})(typeof globalThis!=="undefined"?globalThis:this);
