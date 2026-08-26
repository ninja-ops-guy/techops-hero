/* TechOps Hero — Night production art authority v1.
 * Loads the painted JPEG payloads already shipped in /parts and installs them
 * into NM_BG734. This makes production art the normal Night path instead of
 * silently falling back to the procedural skyline when legacy TO_BG_* payloads
 * are absent.
 */
(function(root){
  "use strict";
  if(!root||root.TechOpsNightProductionAssets)return;
  var VERSION=1,loading=null,installed=false;
  var PACKS={
    suburb_rift:{prefix:"__GK_BG_SUBURB_RIFT",files:["parts/campaign_bg_bg_suburb_rift_p001.js","parts/campaign_bg_bg_suburb_rift_p002.js"]},
    orbital_gate:{prefix:"__GK_BG_ORBITAL_GATE",files:["parts/campaign_bg_bg_orbital_gate_p001.js","parts/campaign_bg_bg_orbital_gate_p002.js","parts/campaign_bg_bg_orbital_gate_p003.js"]},
    orbital_eye:{prefix:"__GK_BG_ORBITAL_EYE",files:["parts/campaign_bg_bg_orbital_eye_p001.js","parts/campaign_bg_bg_orbital_eye_p002.js","parts/campaign_bg_bg_orbital_eye_p003.js"]},
    noc_twin:{prefix:"__GK_BG_NOC_TWIN",files:["parts/campaign_bg_bg_noc_twin_p001.js","parts/campaign_bg_bg_noc_twin_p002.js","parts/campaign_bg_bg_noc_twin_p003.js"]},
    waldo_garage:{prefix:"__GK_BG_WALDO_GARAGE",files:["parts/campaign_bg2_bg_waldo_garage_p001.js","parts/campaign_bg2_bg_waldo_garage_p002.js","parts/campaign_bg2_bg_waldo_garage_p003.js"]},
    waldo_loft:{prefix:"__GK_BG_WALDO_LOFT",files:["parts/campaign_bg2_bg_waldo_loft_p001.js","parts/campaign_bg2_bg_waldo_loft_p002.js"]},
    music_venue:{prefix:"__GK_BG_MUSIC_VENUE",files:["parts/campaign_bg2_bg_music_venue_p001.js","parts/campaign_bg2_bg_music_venue_p002.js","parts/campaign_bg2_bg_music_venue_p003.js"]}
  };
  /* Until dedicated paint exists for every street, use canon production plates
     rather than generated geometry. The collision/gameplay layer stays shared. */
  var DISTRICT_SOURCE={
    downtown:"suburb_rift",
    longwharf:"noc_twin",
    industrial:"waldo_garage",
    wooster:"music_venue",
    airport:"orbital_gate",
    suburbs:"suburb_rift",
    orbital:"orbital_eye",
    waldo_loft:"waldo_loft",
    waldo_garage:"waldo_garage",
    music_venue:"music_venue",
    orbital_gate:"orbital_gate",
    orbital_eye:"orbital_eye",
    noc_twin:"noc_twin",
    suburb_rift:"suburb_rift"
  };
  function pad(n){return String(n).padStart(3,"0");}
  function scriptLoaded(src){try{return !!(root.document&&root.document.querySelector('script[data-night-production="'+src+'"]'));}catch(e){return false;}}
  function loadScript(src){return new Promise(function(resolve){
    try{
      if(!root.document){resolve(false);return;}
      if(scriptLoaded(src)){resolve(true);return;}
      var s=root.document.createElement("script");s.src=src;s.async=false;s.dataset.nightProduction=src;
      s.onload=function(){resolve(true);};s.onerror=function(){root.__nightProductionAssetError=src;resolve(false);};
      (root.document.head||root.document.documentElement).appendChild(s);
    }catch(e){root.__nightProductionAssetError=String(e&&e.stack||e);resolve(false);}
  });}
  function joined(pack){var out="";for(var i=1;i<=pack.files.length;i++)out+=String(root[pack.prefix+"_P"+pad(i)]||"");return out;}
  function buildSources(){var sources={};Object.keys(PACKS).forEach(function(k){var s=joined(PACKS[k]);if(s.indexOf("data:image/")===0)sources[k]=s;});return sources;}
  function putImage(id,src){try{if(!src)return false;root.NM_BG734=root.NM_BG734||{};var im=new Image();im.decoding="async";im.src=src;im._productionPaint=true;root.NM_BG734[id]=im;return true;}catch(e){return false;}}
  function aliasGoodBoys(){try{if(root.TechOpsGoodBoysCampaignAssets)root.TechOpsGoodBoysCampaignAssets.aliasBackgrounds();}catch(e){}}
  function install(){
    if(installed){aliasGoodBoys();return Promise.resolve(true);}
    if(loading)return loading;
    loading=(async function(){
      for(var key of Object.keys(PACKS)){for(var src of PACKS[key].files)await loadScript(src);}
      var sources=buildSources(),count=0;
      Object.keys(DISTRICT_SOURCE).forEach(function(id){var src=sources[DISTRICT_SOURCE[id]];if(src&&putImage(id,src))count++;});
      installed=count>=6;root.__nightProductionBackgroundCount=count;root.__nightProductionBackgroundsReady=installed;
      aliasGoodBoys();
      return installed;
    })();
    return loading;
  }
  root.TechOpsNightProductionAssets={VERSION:VERSION,PACKS:PACKS,DISTRICT_SOURCE:DISTRICT_SOURCE,install:install,buildSources:buildSources};
  install();
})(typeof globalThis!=="undefined"?globalThis:this);
