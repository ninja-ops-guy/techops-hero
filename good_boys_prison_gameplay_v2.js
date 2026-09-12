/* TechOps Hero — Good Boys prison gameplay v2.
 * Turns M3 into an authored multi-beat breach mission and adds a five-hit
 * pack-combat cadence across the orbital prison without touching Night Crawler.
 */
(function(root){
  "use strict";if(!root||root.TechOpsGoodBoysPrisonGameplayV2)return;
  var VERSION=2,RELAY_X=930,EXIT_X=1380,installed=false,style=null,hud=null;
  var combo={step:0,last:0,lastWho:null};
  function now(){return root.performance&&root.performance.now?root.performance.now():Date.now();}
  function cs(){try{return root.NM&&root.NM._v736?root.NM._v736:null;}catch(e){return null;}}
  function mission(){var c=cs();return Math.max(1,Math.min(8,Number(c&&c.m)||1));}
  function prisonActive(){var m=mission();return!!cs()&&m>=3&&m<=7;}
  function m3(){return!!cs()&&mission()===3;}
  function living(){try{return(root.NM&&root.NM.enemies||[]).filter(function(e){return e&&e.alive!==false&&Number(e.hp)>0;}).length;}catch(_){return 0;}}
  function msg(t,ms){try{if(root.NM){root.NM.msg=t;root.NM.msgT=now()+(ms||1500);}}catch(_){} }
  function cinematic(){try{var ids=["good-dogs-cutscene-overlay","gb-prison-cine","good-boys-story-cine","good-boys-earthfall-cine","dialogue"];for(var i=0;i<ids.length;i++){var e=root.document&&root.document.getElementById(ids[i]);if(!e)continue;if(e.classList&&e.classList.contains("hidden"))continue;var s=root.getComputedStyle?root.getComputedStyle(e):e.style;if(!s||s.display!=="none"&&s.visibility!=="hidden"&&Number(s.opacity||1)!==0)return true;}return false;}catch(_){return false;}}
  function ops(){
    var c=cs();if(!c)return null;
    if(!c.prisonOpsV2||Number(c.prisonOpsV2.mission)!==3)c.prisonOpsV2={version:VERSION,mission:3,phase:"breach",engaged:false,counterEngaged:false,relayUsed:false,startedAt:Date.now(),complete:false};
    return c.prisonOpsV2;
  }
  function syncDefinitions(){
    try{
      var g=root.TechOpsGoodBoysGameplayLoop;if(!g)return false;
      if(g.PHASES&&g.PHASES[3]){g.PHASES[3].id="breach_protocol";g.PHASES[3].label="BLACKSITE MERIDIAN — BREACH PROTOCOL";g.PHASES[3].objective="Break security. Override the detention relay. Survive the counterattack. Reach Cell 118.";g.PHASES[3].hazard="gravity/security";g.PHASES[3].bg="goodboys_breach";}
      if(g.STAGES&&g.STAGES[3]){var s=g.STAGES[3],has=(s.landmarks||[]).some(function(x){return x&&x.kind==="relay";});if(!has)(s.landmarks||(s.landmarks=[])).push({x:RELAY_X,label:"SECURITY RELAY",kind:"relay"});}
      return true;
    }catch(e){root.__goodBoysPrisonGameplayDefinitionError=String(e&&e.stack||e);return false;}
  }
  function setHold(on){try{var c=cs();if(!c)return;if(on)c.wavePending="prison-objective-v2";else if(c.wavePending==="prison-objective-v2")c.wavePending=false;}catch(_){} }
  function setPhase(p){var o=ops();if(!o||o.phase===p)return;o.phase=p;o.changedAt=Date.now();if(p==="terminal")msg("SECURITY WAVE BROKEN · REACH THE RELAY · USE",2200);else if(p==="counterattack")msg("LOCKDOWN OVERRIDE ACCEPTED · COUNTERATTACK INBOUND",2200);else if(p==="exfil")msg("ACCESS ROUTE OPEN · PUSH TO CELL BLOCK 118",2200);else if(p==="complete")msg("BREACH PROTOCOL COMPLETE · CELL 118 AHEAD",2200);}
  function nearRelay(){try{return m3()&&Math.abs((Number(root.NM&&root.NM.x)||0)-RELAY_X)<=115;}catch(_){return false;}}
  function activateRelay(){
    try{var c=cs(),o=ops();if(!c||!o||o.phase!=="terminal"||!nearRelay())return false;o.relayUsed=true;o.relayAt=Date.now();setPhase("counterattack");c.pendingSpawn={at:now()+850,kinds:["guard","skimmer","hunter","guard"]};setHold(true);return true;}catch(e){root.__goodBoysPrisonRelayError=String(e&&e.stack||e);return false;}
  }
  function objectiveText(){var o=ops();if(!o)return"";if(o.phase==="breach")return"BREACH · CLEAR THE FIRST SECURITY TEAM";if(o.phase==="terminal")return nearRelay()?"RELAY IN RANGE · USE / INTERACT":"REACH SECURITY RELAY · X930";if(o.phase==="counterattack")return"LOCKDOWN COUNTERATTACK · HOLD THE DECK";if(o.phase==="exfil")return"ROUTE OPEN · REACH CELL BLOCK 118";return"CELL 118 ACCESS SECURED";}
  function ensureHud(){
    if(!root.document)return;style=root.document.getElementById("good-boys-prison-v2-style");if(!style){style=root.document.createElement("style");style.id="good-boys-prison-v2-style";style.textContent="#good-boys-prison-objective{position:fixed;left:50%;top:max(70px,calc(env(safe-area-inset-top) + 62px));transform:translateX(-50%);z-index:10042;max-width:min(560px,86vw);padding:8px 12px;border:1px solid #69d6ff;background:#03101be8;color:#dff8ff;font:700 9px/1.35 monospace;text-align:center;letter-spacing:.04em;box-shadow:0 4px 22px #000a;pointer-events:none}body.good-boys-cinematic #good-boys-prison-objective{display:none!important}";(root.document.head||root.document.documentElement).appendChild(style);}hud=root.document.getElementById("good-boys-prison-objective");if(!hud){hud=root.document.createElement("div");hud.id="good-boys-prison-objective";root.document.body.appendChild(hud);}hud.style.display=m3()&&!cinematic()?"block":"none";if(m3())hud.textContent="BREACH PROTOCOL · "+objectiveText();
  }
  function updateUseLabel(){try{var b=root.document&&root.document.getElementById("gb-use");if(!b)return;if(m3()&&ops()&&ops().phase==="terminal"){b.textContent=nearRelay()?"USE · OVERRIDE":"REACH RELAY";b.dataset.context="1";}else if(mission()!==4){b.textContent="USE / INTERACT";b.dataset.context="0";}}catch(_){} }
  function decorateEnemies(){
    try{if(!prisonActive()||!root.NM||!root.NM.enemies)return;var arr=root.NM.enemies;for(var i=0;i<arr.length;i++){var e=arr[i];if(!e||e._gbPrisonRole)continue;var role=e.kind==="guard"?(i%2?"shield":"rusher"):e.kind==="hunter"?"jailer":e.kind==="skimmer"?"drone":"rusher";e._gbPrisonRole=role;if(role==="shield"){e.maxHp=Math.round((Number(e.maxHp)||Number(e.hp)||60)*1.22);e.hp=Math.max(Number(e.hp)||1,e.maxHp);e.spd=(Number(e.spd)||1)*.82;e.blocks=true;}else if(role==="rusher"){e.spd=(Number(e.spd)||1)*1.18;e.dmg=(Number(e.dmg)||8)*.92;}else if(role==="drone"){e.spd=(Number(e.spd)||1)*1.12;e.hp=Math.max(1,Math.round((Number(e.hp)||40)*.88));}else if(role==="jailer"){e.maxHp=Math.round((Number(e.maxHp)||Number(e.hp)||90)*1.18);e.hp=Math.max(Number(e.hp)||1,e.maxHp);e.dmg=(Number(e.dmg)||12)*1.12;}}}catch(e){root.__goodBoysPrisonRoleError=String(e&&e.stack||e);}
  }
  function enemyCenter(e){return(Number(e&&e.x)||0)+(Number(e&&e.w)||28)/2;}
  function nearest(range){try{var n=root.NM,b=null,bd=range||190;for(var i=0;i<(n&&n.enemies||[]).length;i++){var e=n.enemies[i];if(!e||e.alive===false||Number(e.hp)<=0)continue;var d=Math.abs(enemyCenter(e)-((Number(n.x)||0)+(Number(n.w)||22)/2));if(d<bd){bd=d;b=e;}}return b;}catch(_){return null;}}
  function hit(e,dmg,kb,down){if(!e)return false;e.hp=Math.max(0,(Number(e.hp)||1)-dmg);e.hitT=Math.max(Number(e.hitT)||0,9);e.kb=(Number(root.NM&&root.NM.face)||1)*(kb||4);if(down)e.down=Math.max(Number(e.down)||0,down);if(e.hp<=0)e.alive=false;if(root.NM)root.NM.hitStop=Math.max(Number(root.NM.hitStop)||0,5);return true;}
  function installCombat(){
    try{var m=root.TechOpsGoodBoysReferenceMechanics;if(!m||m.pairedAttack&&m.pairedAttack.__prisonPackV2)return false;var base=m.pairedAttack;if(typeof base!=="function")return false;
      var wrapped=function(){var ok=base.apply(this,arguments);if(!prisonActive())return ok;var t=now();if(t-combo.last>950)combo.step=0;combo.last=t;combo.step=combo.step%5+1;var c=cs(),who=c&&c.active||"katrin",target=nearest(combo.step>=4?230:185),alternate=combo.lastWho&&combo.lastWho!==who;combo.lastWho=who;if(alternate&&c)c.sync=Math.min(100,(Number(c.sync)||0)+5);
        if(target){if(combo.step===2)hit(target,5,3,5);else if(combo.step===3)hit(target,8,6,13);else if(combo.step===4){hit(target,10,8,18);if(c&&c.partner){c.partner.x=enemyCenter(target)-(c.partner.w||22)/2-(root.NM.face||1)*18;c.partner.anim=22;}}else if(combo.step===5){var arr=root.NM.enemies||[];for(var i=0;i<arr.length;i++){var e=arr[i];if(e&&e.alive!==false&&Number(e.hp)>0&&Math.abs(enemyCenter(e)-enemyCenter(target))<135)hit(e,15,10,24);}if(c)c.sync=Math.min(100,(Number(c.sync)||0)+18);root.NM.hitStop=Math.max(Number(root.NM.hitStop)||0,8);}}
        var labels=["","LEAD BITE","PARTNER CROSS","TANDEM LAUNCH","CHASE POUNCE","PACK BREAKER"];msg("🐾 PACK CHAIN "+combo.step+"/5 · "+labels[combo.step]+(alternate?" · SWITCH BONUS":""),900);return ok;};wrapped.__prisonPackV2=true;wrapped.__base=base;m.pairedAttack=wrapped;return true;
    }catch(e){root.__goodBoysPrisonCombatInstallError=String(e&&e.stack||e);return false;}
  }
  function tickM3(){
    var c=cs(),o=ops(),n=root.NM;if(!c||!o||!n)return;
    if(o.phase!=="complete")setHold(true);
    var alive=living(),pending=!!c.pendingSpawn;
    if(o.phase==="breach"){if(alive>0)o.engaged=true;if(o.engaged&&alive===0&&!pending)setPhase("terminal");}
    else if(o.phase==="counterattack"){if(alive>0)o.counterEngaged=true;if(o.counterEngaged&&alive===0&&!pending)setPhase("exfil");}
    else if(o.phase==="exfil"&&Number(n.x)>=EXIT_X){o.complete=true;o.completedAt=Date.now();setPhase("complete");setHold(false);}
    else if(o.phase==="complete")setHold(false);
  }
  function tick(){try{syncDefinitions();installCombat();decorateEnemies();if(m3())tickM3();ensureHud();updateUseLabel();try{if(root.TechOpsGoodDogsCutsceneBridge&&typeof root.TechOpsGoodDogsCutsceneBridge.tick==="function")root.TechOpsGoodDogsCutsceneBridge.tick();}catch(e){root.__goodBoysPrisonCutsceneTickError=String(e&&e.stack||e);}root.__goodBoysPrisonGameplayState=acceptance();}catch(e){root.__goodBoysPrisonGameplayError=String(e&&e.stack||e);}}
  function keyHandler(e){try{if(!m3()||!ops()||ops().phase!=="terminal"||!nearRelay())return;var k=String(e.key||"").toLowerCase();if(k!=="e"&&k!=="enter")return;e.preventDefault();e.stopImmediatePropagation();activateRelay();}catch(_){} }
  function pointerHandler(e){try{var b=e.target&&e.target.closest?e.target.closest("#gb-use"):null;if(!b||!m3()||!ops()||ops().phase!=="terminal"||!nearRelay())return;e.preventDefault();e.stopImmediatePropagation();activateRelay();}catch(_){} }
  function installHooks(){
    if(installed)return true;installed=true;try{if(root.document){root.document.addEventListener("keydown",keyHandler,true);root.document.addEventListener("pointerdown",pointerHandler,true);}}catch(_){}
    try{var g=root.TechOpsGoodBoysGameplayLoop;if(g&&typeof g.tick==="function"&&!g.tick.__prisonV2){var base=g.tick;g.tick=function(){var r=base.apply(this,arguments);tick();return r;};g.tick.__prisonV2=true;g.tick.__base=base;}if(g&&typeof g.configureStage==="function"&&!g.configureStage.__prisonV2){var baseConfigure=g.configureStage;g.configureStage=function(){var r=baseConfigure.apply(this,arguments);tick();return r;};g.configureStage.__prisonV2=true;g.configureStage.__base=baseConfigure;}}catch(_){}
    return true;
  }
  function testPrimeComplete(){try{var c=cs(),n=root.NM;if(!c||!n||mission()!==3)return false;var o=ops();o.engaged=true;o.relayUsed=true;o.counterEngaged=true;o.complete=true;o.phase="complete";o.completedAt=Date.now();c.pendingSpawn=null;c.wavePending=false;n.wavePending=false;n.x=Math.max(Number(n.x)||0,EXIT_X+10);tick();return o.phase==="complete"&&!c.wavePending;}catch(e){root.__goodBoysPrisonTestError=String(e&&e.stack||e);return false;}}
  function acceptance(){var o=m3()?ops():cs()&&cs().prisonOpsV2||null;return{version:VERSION,active:prisonActive(),mission:mission(),phase:o&&o.phase||null,relayX:RELAY_X,nearRelay:nearRelay(),living:living(),wavePending:cs()&&cs().wavePending||false,comboStep:combo.step,complete:!!(o&&o.complete),error:root.__goodBoysPrisonGameplayError||root.__goodBoysPrisonCombatInstallError||null};}
  syncDefinitions();installCombat();installHooks();tick();
  root.TechOpsGoodBoysPrisonGameplayV2={VERSION:VERSION,RELAY_X:RELAY_X,EXIT_X:EXIT_X,tick:tick,use:activateRelay,nearRelay:nearRelay,syncDefinitions:syncDefinitions,installCombat:installCombat,testPrimeComplete:testPrimeComplete,acceptance:acceptance};
})(typeof globalThis!=="undefined"?globalThis:this);
