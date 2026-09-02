/* TechOps Hero — canonical Good Dogs actor contract v1.
 * Production invariant: KATRIN_MANCHEZ is the only actor atlas and the stable
 * compositor is the only render owner. Legacy feature modules may provide HUD,
 * controls and backgrounds, but must not wrap drawNightPlayerAtlas again.
 */
(function(root){
  "use strict";
  if(!root||root.TechOpsGoodDogsActorContract)return;
  var VERSION=1,ATLAS_NAME="KATRIN_MANCHEZ",enforceCount=0,lastError=null;
  var ACTIONS=Object.freeze({IDLE:"IDLE",RUN:"RUN",JUMP:"JUMP",DASH:"DASH",ATTACK:"ATTACK",BLOCK:"BLOCK",HIT:"HIT",DOWN:"DOWN"});
  function atlas(){
    var A=root.KATRIN_MANCHEZ;
    if(A&&A.frames&&A.src){lastError=null;return A;}
    lastError="canonical_atlas_missing";
    root.__goodDogsActorContractError=lastError;
    return null;
  }
  function alias(fr,to,from){if(fr&&fr[from])fr[to]=fr[from];}
  function normalize(){
    var A=atlas();if(!A)return false;var fr=A.frames;
    ["kat","man"].forEach(function(p){
      alias(fr,p+"_idle0",p+"_idle");
      alias(fr,p+"_idle1",p+"_walk");
      if(!fr[p+"_idle1"]&&fr[p+"_idle0"])fr[p+"_idle1"]=fr[p+"_idle0"];
      /* Never permit semantic locomotion to cycle action poses. */
      for(var i=2;i<8;i++)fr[p+"_idle"+i]=fr[p+"_idle"+(i%2)];
      if(!fr[p+"_strike"]&&fr[p+"_pounce"])fr[p+"_strike"]=fr[p+"_pounce"];
      if(!fr[p+"_leap"]&&fr[p+"_pounce"])fr[p+"_leap"]=fr[p+"_pounce"];
      if(!fr[p+"_roll"]&&fr[p+"_dash"])fr[p+"_roll"]=fr[p+"_dash"];
      if(!fr[p+"_shield"]&&fr[p+"_hack"])fr[p+"_shield"]=fr[p+"_hack"];
      if(!fr[p+"_wall_hit"]&&fr[p+"_down"])fr[p+"_wall_hit"]=fr[p+"_down"];
    });
    root.__goodDogsCanonicalAtlas=ATLAS_NAME;
    return true;
  }
  function actionFor(NM){
    if(!NM||NM.hp<=0)return ACTIONS.DOWN;
    if(NM.ifr>0)return ACTIONS.HIT;
    if(NM.dashT>0)return ACTIONS.DASH;
    if(NM.jabAnim>0)return ACTIONS.ATTACK;
    if(NM.block)return ACTIONS.BLOCK;
    if(!NM.onGround)return ACTIONS.JUMP;
    return Math.abs(Number(NM.vx)||0)>.45?ACTIONS.RUN:ACTIONS.IDLE;
  }
  function frameFor(who,NM,now){
    var A=atlas(),p=who==="manchez"?"man_":"kat_";if(!A)return null;
    var has=function(k){return !!A.frames[k];},action=actionFor(NM),key=null;
    if(action===ACTIONS.DOWN)key=p+"down";
    else if(action===ACTIONS.HIT)key=has(p+"wall_hit")?p+"wall_hit":p+"down";
    else if(action===ACTIONS.DASH)key=has(p+"roll")?p+"roll":p+"idle1";
    else if(action===ACTIONS.ATTACK)key=has(p+"strike")?p+"strike":p+"pounce";
    else if(action===ACTIONS.BLOCK)key=has(p+"shield")?p+"shield":p+"idle0";
    else if(action===ACTIONS.JUMP)key=has(p+"leap")?p+"leap":p+"idle1";
    else key=p+((Math.floor((Number(now)||0)/(action===ACTIONS.RUN?145:720))%2)?"idle1":"idle0");
    return has(key)?key:(has(p+"idle0")?p+"idle0":null);
  }
  function blockLegacyPlayerWrapper(){
    try{
      var fn=root.drawNightPlayerAtlas;
      if(typeof fn!=="function")return false;
      /* good_dogs_production_runtime checks this marker before wrapping. */
      fn.__goodDogsProduction=true;
      fn.__goodDogsActorContractGuard=true;
      return true;
    }catch(e){lastError=String(e&&e.stack||e);return false;}
  }
  function enforce(){
    enforceCount++;
    normalize();
    blockLegacyPlayerWrapper();
    root.__productionCompositorOwnsGoodDogsActor=true;
    root.__goodDogsActorContractVersion=VERSION;
    root.__goodDogsActorContractEnforceCount=enforceCount;
    root.__goodDogsActorContractError=lastError;
    return !lastError;
  }
  function health(){return{version:VERSION,atlas:ATLAS_NAME,atlasReady:!!atlas(),compositorOwner:!!root.__productionCompositorOwnsGoodDogsActor,legacyWrapperBlocked:!!(root.drawNightPlayerAtlas&&root.drawNightPlayerAtlas.__goodDogsActorContractGuard),enforceCount:enforceCount,error:lastError};}
  root.TechOpsGoodDogsActorContract={VERSION:VERSION,ATLAS_NAME:ATLAS_NAME,ACTIONS:ACTIONS,atlas:atlas,normalize:normalize,actionFor:actionFor,frameFor:frameFor,enforce:enforce,health:health};
  enforce();
})(typeof globalThis!=="undefined"?globalThis:this);
