/* Good Boys Access Core authority v1.
 * Mission 5 is K's route-control breach, not the legacy Mike Index boss fight.
 * Enforces that contract continuously so v7.36 cannot respawn or redraw it.
 */
(function(root){
  "use strict";
  if(!root)return;
  try{var old=root.TechOpsGoodBoysAccessCoreAuthority;if(old&&old.timer&&root.clearInterval)root.clearInterval(old.timer);}catch(_){}
  var VERSION=1,timer=null,purges=0,seeds=0,lastPurge=0;
  function cs(){try{return root.NM&&root.NM._v736?root.NM._v736:null;}catch(e){return null;}}
  function mission(){try{var c=cs(),m=root.S&&root.S.meta&&root.S.meta._v736;return Number(c&&c.m||m&&m.m||0)||0;}catch(e){return 0;}}
  function legacyMike(e){try{if(!e)return false;var s=[e.kind,e.id,e.type,e.name].filter(Boolean).join(" ").toLowerCase().replace(/[\s_-]+/g,"");return s.indexOf("mikeindex")>=0||s.indexOf("technicianmike")>=0||s.indexOf("nightwalkermike")>=0;}catch(_){return false;}}
  function kind(name){try{return root.NM_KINDS&&root.NM_KINDS[name]||null;}catch(e){return null;}}
  function spawn(name,x){try{var k=kind(name);if(!k)return null;var floor=typeof root.NM_FLOOR==="number"?root.NM_FLOOR:430,h=Number(k.h)||40,hp=Math.round((Number(k.hp)||70)*1.18);return Object.assign({},k,{kind:name,name:k.name||name,x:x,y:floor-h,w:Number(k.w)||28,h:h,hp:hp,maxHp:hp,vx:0,windup:0,hitT:0,kb:0,launch:0,down:0,alive:true,cd:35,face:-1,weak:false,_counted:false,phase:1,_spawnX:x,_goodBoysAccessCore:true});}catch(e){return null;}}
  function livingNonLegacy(){try{return (root.NM&&root.NM.enemies||[]).filter(function(e){return e&&e.alive!==false&&Number(e.hp)>0&&!legacyMike(e);}).length;}catch(e){return 0;}}
  function seedSecurity(){try{var n=root.NM,c=cs();if(!n||!c||mission()!==5||n._gbAccessCoreSecuritySeeded)return false;var pack=[spawn("guard",650),spawn("hunter",1010),spawn("guard",1360)].filter(Boolean);if(!pack.length)return false;n.enemies=(n.enemies||[]).concat(pack);n._gbAccessCoreSecuritySeeded=true;n._gbBibleM5Reframed=true;c._adds66=true;c._goodBoysNoMikeIndex=true;seeds++;try{n.msg="ACCESS CORE — K NEEDS THE ROUTE CONTROLS · CLEAR SECURITY";n.msgT=(root.performance&&root.performance.now?root.performance.now():Date.now())+2600;}catch(_){}return true;}catch(e){root.__goodBoysAccessCoreSeedError=String(e&&e.stack||e);return false;}}
  function purge(){try{if(mission()!==5||!root.NM)return 0;var n=root.NM,es=n.enemies||[],removed=0;for(var i=es.length-1;i>=0;i--){if(legacyMike(es[i])){es.splice(i,1);removed++;}}if(removed){purges+=removed;lastPurge=Date.now();n._gbBibleM5Reframed=true;var c=cs();if(c){c._adds66=true;c._goodBoysNoMikeIndex=true;}if(!n._gbAccessCoreSecuritySeeded&&livingNonLegacy()===0)seedSecurity();}return removed;}catch(e){root.__goodBoysAccessCorePurgeError=String(e&&e.stack||e);return 0;}}
  function tick(){try{if(mission()!==5)return;var removed=purge();var n=root.NM,c=cs();if(!n||!c)return;c._adds66=true;c._goodBoysNoMikeIndex=true;n._gbBibleM5Reframed=true;if(!n._gbAccessCoreSecuritySeeded&&livingNonLegacy()===0&&(removed>0||!n._gbAccessCoreSeedAttempted)){n._gbAccessCoreSeedAttempted=true;seedSecurity();}}catch(e){root.__goodBoysAccessCoreError=String(e&&e.stack||e);}}
  function acceptance(){var count=0;try{count=(root.NM&&root.NM.enemies||[]).filter(legacyMike).length;}catch(_){}return{version:VERSION,mission:mission(),legacyMikeCount:count,purges:purges,seeds:seeds,lastPurge:lastPurge,securitySeeded:!!(root.NM&&root.NM._gbAccessCoreSecuritySeeded),pass:mission()!==5||count===0};}
  timer=root.setInterval?root.setInterval(tick,45):null;
  root.TechOpsGoodBoysAccessCoreAuthority={VERSION:VERSION,tick:tick,purge:purge,seedSecurity:seedSecurity,legacyMike:legacyMike,acceptance:acceptance,timer:timer};
  tick();
})(typeof globalThis!=="undefined"?globalThis:this);
