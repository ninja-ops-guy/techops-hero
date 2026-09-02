/* Good Boys Access Core authority v6.
 * Mission 5 contains the canonical Mike Index encounter immediately after K's
 * Cell 118 release, then the route-control security breach to Cell 1984. The
 * Mike Index is a recorded-behavior containment model, never Mike himself and
 * never a future-input reader.
 */
(function(root){
  "use strict";
  if(!root)return;
  try{var old=root.TechOpsGoodBoysAccessCoreAuthority;if(old&&old.timer&&root.clearInterval)root.clearInterval(old.timer);}catch(_){}
  var VERSION=6,timer=null,seeds=0,lastState=null,resets=0,missionRepairs=0,indexSpawns=0,indexDefeats=0;
  function cs(){try{return root.NM&&root.NM._v736?root.NM._v736:null;}catch(e){return null;}}
  function meta(){try{return root.S&&root.S.meta&&root.S.meta._v736?root.S.meta._v736:null;}catch(e){return null;}}
  function mission(){try{var a=root.TechOpsGoodBoysCampaignState;if(a&&typeof a.mission==="function")return Number(a.mission())||0;var m=meta();return Number(m&&m.m)||0;}catch(e){return 0;}}
  function reconcileMission(reason){try{var a=root.TechOpsGoodBoysCampaignState;if(a&&typeof a.reconcile==="function"){var before=Number(cs()&&cs().m||0),ok=a.reconcile(reason||"access-core"),after=Number(cs()&&cs().m||0);if(ok&&before!==after)missionRepairs++;return ok;}var m=meta(),c=cs();if(!m||!c)return false;var canonical=Number(m.m)||0;if(canonical&&Number(c.m)!==canonical){var prior=Number(c.m)||0;c.m=canonical;missionRepairs++;root.__goodBoysAccessCoreMissionRepair={runtime:prior,canonical:canonical,reason:reason||"access-core",at:Date.now(),count:missionRepairs};}return true;}catch(e){root.__goodBoysAccessCoreMissionRepairError=String(e&&e.stack||e);return false;}}
  function syncState(){try{var canonical=mission();if(!canonical)return null;reconcileMission("sync-state");var c=cs(),n=root.NM;if(c!==lastState){lastState=c;if(n){n._gbAccessCoreSecuritySeeded=false;n._gbAccessCoreSeedAttempted=false;n._gbMikeIndexEncounterStarted=false;n._gbMikeIndexDefeated=false;}resets++;}return c;}catch(e){root.__goodBoysAccessCoreStateError=String(e&&e.stack||e);return null;}}
  function isMikeIndex(e){try{if(!e)return false;var s=[e.kind,e.id,e.type,e.name].filter(Boolean).join(" ").toLowerCase().replace(/[\s_-]+/g,"");return s.indexOf("mikeindex")>=0;}catch(_){return false;}}
  function kind(name){try{return root.NM_KINDS&&root.NM_KINDS[name]||null;}catch(e){return null;}}
  function spawn(name,x){try{var k=kind(name);if(!k)return null;var floor=typeof root.NM_FLOOR==="number"?root.NM_FLOOR:430,h=Number(k.h)||40,hp=Math.round((Number(k.hp)||70)*1.18);return Object.assign({},k,{kind:name,name:k.name||name,x:x,y:floor-h,w:Number(k.w)||28,h:h,hp:hp,maxHp:hp,vx:0,windup:0,hitT:0,kb:0,launch:0,down:0,alive:true,cd:35,face:-1,weak:false,_counted:false,phase:1,_spawnX:x,_goodBoysAccessCore:true});}catch(e){return null;}}
  function livingMike(){try{return (root.NM&&root.NM.enemies||[]).filter(function(e){return e&&e.alive!==false&&Number(e.hp)>0&&isMikeIndex(e);});}catch(e){return [];}}
  function livingNonMike(){try{return (root.NM&&root.NM.enemies||[]).filter(function(e){return e&&e.alive!==false&&Number(e.hp)>0&&!isMikeIndex(e);}).length;}catch(e){return 0;}}
  function writeSemantic(name,value){try{var s=root.TechOpsGoodDogsCampaignState;if(s&&typeof s.write==="function")s.write(name,value);return true;}catch(e){root.__goodBoysAccessCoreSemanticError=String(e&&e.stack||e);return false;}}
  function seedMikeIndex(){
    try{var n=root.NM,c=cs();if(!n||!c||mission()!==5||n._gbMikeIndexEncounterStarted||n._gbMikeIndexDefeated)return false;var existing=livingMike();
      if(existing.length){n._gbMikeIndexEncounterStarted=true;existing.forEach(function(e){e._goodBoysMikeIndex=true;e._predictionHistoryOnly=true;e.tint="#f3f4f6";e.name="THE MIKE INDEX";});return true;}
      var e=spawn("mikeindex",980);if(!e)return false;e.name="THE MIKE INDEX";e.tint="#f3f4f6";e._goodBoysMikeIndex=true;e._predictionHistoryOnly=true;e._predictionRule="recorded-behavior-only";n.enemies=(n.enemies||[]).concat([e]);n._gbMikeIndexEncounterStarted=true;c._goodBoysMikeIndex=true;indexSpawns++;try{n.msg="THE MIKE INDEX — EXPECTED ROUTE · BREAK THE PATTERN";n.msgT=(root.performance&&root.performance.now?root.performance.now():Date.now())+2800;}catch(_){}return true;
    }catch(e){root.__goodBoysMikeIndexSeedError=String(e&&e.stack||e);return false;}
  }
  function seedSecurity(){try{var n=root.NM,c=cs();if(!n||!c||mission()!==5||!n._gbMikeIndexDefeated||n._gbAccessCoreSecuritySeeded)return false;var pack=[spawn("guard",650),spawn("hunter",1010),spawn("guard",1360)].filter(Boolean);if(!pack.length)return false;n.enemies=(n.enemies||[]).concat(pack);n._gbAccessCoreSecuritySeeded=true;c._adds66=true;seeds++;try{n.msg="MIKE INDEX FRACTURED · K NEEDS THE ROUTE CONTROLS · CLEAR SECURITY";n.msgT=(root.performance&&root.performance.now?root.performance.now():Date.now())+2800;}catch(_){}return true;}catch(e){root.__goodBoysAccessCoreSeedError=String(e&&e.stack||e);return false;}}
  function settleMikeIndex(){
    try{var n=root.NM;if(!n||mission()!==5||!n._gbMikeIndexEncounterStarted||n._gbMikeIndexDefeated)return false;if(livingMike().length)return false;n._gbMikeIndexDefeated=true;indexDefeats++;writeSemantic("mike_index_defeated",true);writeSemantic("k_identity_status","K");root.__goodBoysMikeIndexDefeat={at:Date.now(),historyOnly:true};seedSecurity();return true;}catch(e){root.__goodBoysMikeIndexSettleError=String(e&&e.stack||e);return false;}
  }
  function tick(){try{if(mission()!==5)return;var c=syncState(),n=root.NM;if(!c||!n)return;if(!n._gbMikeIndexEncounterStarted&&!n._gbMikeIndexDefeated)seedMikeIndex();settleMikeIndex();if(n._gbMikeIndexDefeated&&!n._gbAccessCoreSecuritySeeded&&livingNonMike()===0)seedSecurity();}catch(e){root.__goodBoysAccessCoreError=String(e&&e.stack||e);}}
  function acceptance(){var m=mission(),c=cs(),pm=meta(),boss=livingMike(),n=root.NM;return{version:VERSION,mission:m,runtimeMission:Number(c&&c.m||0),metaMission:Number(pm&&pm.m||0),missionDiverged:!!(c&&pm&&Number(c.m)!==Number(pm.m)),missionRepairs:missionRepairs,mikeIndexCount:boss.length,mikeIndexEncounterStarted:!!(n&&n._gbMikeIndexEncounterStarted),mikeIndexDefeated:!!(n&&n._gbMikeIndexDefeated),predictionHistoryOnly:boss.every(function(e){return e._predictionHistoryOnly===true;}),indexSpawns:indexSpawns,indexDefeats:indexDefeats,securitySeeded:!!(n&&n._gbAccessCoreSecuritySeeded),securitySeeds:seeds,resets:resets,canonicalOnly:true,unifiedTick:true,pass:m!==5||!!(n&&(n._gbMikeIndexEncounterStarted||n._gbMikeIndexDefeated))};}
  root.TechOpsGoodBoysAccessCoreAuthority={VERSION:VERSION,tick:tick,seedMikeIndex:seedMikeIndex,settleMikeIndex:settleMikeIndex,seedSecurity:seedSecurity,syncState:syncState,reconcileMission:reconcileMission,isMikeIndex:isMikeIndex,mission:mission,acceptance:acceptance,timer:null};tick();
})(typeof globalThis!=="undefined"?globalThis:this);
