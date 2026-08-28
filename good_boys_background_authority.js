/* Good Boys background authority v1.
 * Campaign bible owns environment identity. One mission -> one district -> one
 * backdrop. This module is deliberately late-loaded so legacy Night/Good Boys
 * modules cannot win a background race by load order.
 */
(function(root){
  "use strict";
  if(!root||root.TechOpsGoodBoysBackgroundAuthority)return;
  var VERSION=1,lastMission=0,lastKey="",repairs=0;
  var MAP={
    1:{key:"goodboys_home",district:"goodboys_home",scene:"WALDO'S HOUSE",fallback:"waldo_loft"},
    2:{key:"goodboys_hangar",district:"goodboys_hangar",scene:"THE HIDDEN BAY",fallback:"waldo_garage"},
    3:{key:"goodboys_breach",district:"goodboys_breach",scene:"ORBITAL PRISON — HULL BREACH",fallback:null},
    4:{key:"goodboys_cell118",district:"goodboys_cell118",scene:"DETENTION BLOCK 118",fallback:null},
    5:{key:"goodboys_core",district:"goodboys_core",scene:"ACCESS CORE",fallback:null},
    6:{key:"goodboys_cell1984",district:"goodboys_cell1984",scene:"SURVEILLANCE BLOCK 1984",fallback:null},
    7:{key:"goodboys_escape",district:"goodboys_escape",scene:"WARDEN / SHUTTLE BAY",fallback:null},
    8:{key:"goodboys_earthfall",district:"goodboys_earthfall",scene:"WALDO'S HOUSE — DAWN",fallback:"waldo_loft"}
  };
  function cs(){try{return root.NM&&root.NM._v736?root.NM._v736:null;}catch(e){return null;}}
  function active(){return !!cs();}
  function mission(){try{var c=cs(),m=c&&c.m||root.S&&root.S.meta&&root.S.meta._v736&&root.S.meta._v736.m||1;return Math.max(1,Math.min(8,Number(m)||1));}catch(e){return 1;}}
  function prisonPatch(){return root.TechOpsGoodBoysPrisonCinematicPatch;}
  function ensureGenerated(m){if(m<3||m>7)return true;try{var p=prisonPatch();if(p&&p.buildBackdrops)p.buildBackdrops();return !!(root.NM_BG734&&root.NM_BG734[MAP[m].key]);}catch(e){return false;}}
  function resolve(m){try{root.NM_BG734=root.NM_BG734||{};var spec=MAP[m],im=root.NM_BG734[spec.key];if(!im&&m>=3&&m<=7){ensureGenerated(m);im=root.NM_BG734[spec.key];}if(!im&&spec.fallback)im=root.NM_BG734[spec.fallback];return im||null;}catch(e){return null;}}
  function syncCanon(){try{var c=root.TechOpsGoodBoysCanon&&root.TechOpsGoodBoysCanon.SEQUENCE;if(c){Object.keys(MAP).forEach(function(k){var s=MAP[k],row=c[k];if(!row)return;row.bg=s.key;row.district=s.district;if(k==="3"){row.name="ORBITAL PRISON — BREACH";row.zone="ORBITAL DETENTION — HULL BREACH";}if(k==="5")row.zone="ORPHEUS ACCESS CORE";});}var g=root.TechOpsGoodBoysGameplayLoop;if(g&&g.PHASES){Object.keys(MAP).forEach(function(k){if(g.PHASES[k])g.PHASES[k].bg=MAP[k].key;});}return true;}catch(e){root.__goodBoysBackgroundCanonError=String(e&&e.stack||e);return false;}}
  function enforce(){
    if(!active())return false;
    try{
      var m=mission(),spec=MAP[m],im=resolve(m),n=root.NM,c=cs();
      syncCanon();
      if(!n||!spec)return false;
      if(n.district!==spec.district){n._goodBoysPreviousDistrict=n.district;n.district=spec.district;repairs++;}
      n._goodBoysCanonDistrict=spec.district;n._goodBoysCanonBackground=spec.key;n._goodBoysCanonScene=spec.scene;
      if(c){c.canonBackground=spec.key;c.canonDistrict=spec.district;c.canonScene=spec.scene;}
      if(im){root.NM_BG734[spec.key]=im;root.NM_BG734[spec.district]=im;/* legacy renderer may still ask for orbital */root.NM_BG734.orbital=im;}
      lastMission=m;lastKey=spec.key;
      return !!im;
    }catch(e){root.__goodBoysBackgroundAuthorityError=String(e&&e.stack||e);return false;}
  }
  function acceptance(){var m=mission(),s=MAP[m],n=root.NM||{};return {version:VERSION,active:active(),mission:m,expectedKey:s&&s.key,expectedDistrict:s&&s.district,district:n.district||null,canonBackground:n._goodBoysCanonBackground||null,hasImage:!!resolve(m),repairs:repairs,lastMission:lastMission,lastKey:lastKey,pass:!active()||!!(s&&n.district===s.district&&n._goodBoysCanonBackground===s.key&&resolve(m))};}
  syncCanon();enforce();var timer=root.setInterval?root.setInterval(enforce,90):null;
  root.TechOpsGoodBoysBackgroundAuthority={VERSION:VERSION,MAP:MAP,mission:mission,resolve:resolve,syncCanon:syncCanon,enforce:enforce,acceptance:acceptance,timer:timer};
})(typeof globalThis!=="undefined"?globalThis:this);
