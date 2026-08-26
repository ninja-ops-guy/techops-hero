/* Good Boys campaign asset authority v2 — production art only.
 * No procedural SVG stand-ins. Reuses the painted campaign backgrounds and the
 * extracted Katrin/Manchez, shuttle, orbital, K, Waldo and Warden atlases that
 * already ship in the production build.
 */
(function(root){
  "use strict";
  if(!root||root.TechOpsGoodBoysCampaignAssets)return;
  var VERSION=2;
  var BG_SOURCE={
    goodboys_home:"waldo_loft",
    goodboys_hangar:"waldo_garage",
    goodboys_approach:"orbital_gate",
    goodboys_breach:"orbital_gate",
    goodboys_cell118:"orbital_eye",
    goodboys_core:"orbital_eye",
    goodboys_cell1984:"orbital_eye",
    goodboys_escape:"orbital_gate",
    goodboys_earthfall:"waldo_loft"
  };
  var PRODUCTION={
    dogsAtlas:"assets/v736/katrin_manchez_atlas.png",
    dogsManifest:"assets/v736/katrin_manchez_manifest.json",
    katrinIdle:"assets/v736/katrin_manchez/kat_idle0.png",
    katrinAttack:"assets/v736/katrin_manchez/kat_strike.png",
    katrinShield:"assets/v736/katrin_manchez/kat_shield.png",
    katrinBark:"assets/v736/katrin_manchez/kat_bark.png",
    manchezIdle:"assets/v736/katrin_manchez/man_idle0.png",
    manchezAttack:"assets/v736/katrin_manchez/man_strike.png",
    manchezShield:"assets/v736/katrin_manchez/man_shield.png",
    manchezBark:"assets/v736/katrin_manchez/man_bark.png",
    orbitalTiles:"orbital_tiles.atlas.js",
    shuttle:"shuttle.atlas.js",
    kFull:"k_full.atlas.js",
    kAction:"k_action.atlas.js",
    waldo:"waldo_full.atlas.js",
    warden:"warden.atlas.js",
    wardenNull:"warden_null.atlas.js",
    enemies:"enemy_roster.atlas.js",
    coopUi:"ui_coop.js"
  };
  function aliasBackgrounds(){
    try{
      root.NM_BG734=root.NM_BG734||{};
      var n=0;
      Object.keys(BG_SOURCE).forEach(function(id){var src=BG_SOURCE[id],im=root.NM_BG734[src];if(im){root.NM_BG734[id]=im;n++;}});
      return n;
    }catch(e){return 0;}
  }
  function installDistricts(){
    try{
      aliasBackgrounds();
      if(typeof root.NM_DISTRICTS==="undefined")return false;
      var defs={
        goodboys_home:{name:"WALDO'S HOUSE — EARTH",streets:1,danger:.1,accent:"#e4bc66",sky:"#11131b",far:"#20232b",mid:"#28251f",signs:["WALDO'S HOUSE","HIDDEN BAY"],roster:[]},
        goodboys_hangar:{name:"WALDO'S SECRET HANGAR",streets:1,danger:.4,accent:"#54d6ff",sky:"#070b12",far:"#0c1620",mid:"#111820",signs:["SECRET SHIP","LAUNCH"],roster:["guard"]},
        goodboys_approach:{name:"ORBITAL DETENTION — APPROACH",streets:1,danger:1.4,accent:"#8e79ff",sky:"#02050b",far:"#08101c",mid:"#09111a",signs:["DOCKING DENIED","IMPACT VECTOR"],roster:["skimmer","guard"]},
        goodboys_breach:{name:"ORBITAL DETENTION — HULL BREACH",streets:1,danger:1.7,accent:"#ff7a45",sky:"#05070b",far:"#0c1018",mid:"#11151c",signs:["HULL BREACH","LOCKDOWN"],roster:["guard","hunter"]},
        goodboys_cell118:{name:"DETENTION BLOCK — CELL 118",streets:1,danger:1.8,accent:"#39d8ff",sky:"#05080e",far:"#09101a",mid:"#0b1118",signs:["CELL 118","VERIFY K"],roster:["guard","skimmer"]},
        goodboys_core:{name:"ORPHEUS ACCESS CORE",streets:1,danger:2,accent:"#22c55e",sky:"#05080e",far:"#09101a",mid:"#0b1118",signs:["ORPHEUS","CORE ACCESS"],roster:["guard","hunter"]},
        goodboys_cell1984:{name:"SURVEILLANCE BLOCK — CELL 1984",streets:1,danger:2,accent:"#ff475d",sky:"#070509",far:"#10080d",mid:"#140b10",signs:["CELL 1984","WALDO"],roster:["hunter","guard"]},
        goodboys_escape:{name:"WARDEN CORE / SHUTTLE BAY",streets:1,danger:2.2,accent:"#7d6cff",sky:"#04050a",far:"#090b12",mid:"#10131a",signs:["WARDEN NULL","MAINTENANCE SHUTTLE"],roster:["guard","hunter"]},
        goodboys_earthfall:{name:"WALDO'S HOUSE — DAWN",streets:1,danger:0,accent:"#ffd18b",sky:"#25314b",far:"#704d50",mid:"#42574a",signs:["HOME","EARTHFALL"],roster:[]}
      };
      Object.keys(defs).forEach(function(k){root.NM_DISTRICTS[k]=defs[k];});
      return true;
    }catch(e){return false;}
  }
  root.GOOD_BOYS_CAMPAIGN_ASSETS=PRODUCTION;
  root.GOOD_BOYS_CAMPAIGN_BACKGROUND_SOURCE=BG_SOURCE;
  root.TechOpsGoodBoysCampaignAssets={VERSION:VERSION,PRODUCTION:PRODUCTION,BG_SOURCE:BG_SOURCE,aliasBackgrounds:aliasBackgrounds,installDistricts:installDistricts};
  aliasBackgrounds();installDistricts();
})(typeof globalThis!=="undefined"?globalThis:this);
