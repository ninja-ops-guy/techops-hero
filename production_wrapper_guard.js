/* TechOps Hero — production wrapper guard v2.
 * Establishes one stable Night compositor and repairs stale legacy modal state
 * before simulation. A hidden dialogue must never freeze Night Crawler or the
 * Good Boys shared Night engine.
 */
(function(root){
  "use strict";
  if(!root) return;
  try{if(root.TechOpsProductionWrapperGuard&&root.TechOpsProductionWrapperGuard.timer)root.clearInterval(root.TechOpsProductionWrapperGuard.timer);}catch(e){}
  var VERSION=2,timer=null,installed=false,baseDraw=null,baseStep=null,stableDraw=null,stableStep=null;

  function lexicalDraw(){try{return typeof drawNM==="function"?drawNM:null;}catch(e){return null;}}
  function lexicalStep(){try{return typeof stepNM==="function"?stepNM:null;}catch(e){return null;}}
  function state(){try{return (typeof S!=="undefined"&&S)?S:(root.S||null);}catch(e){return root.S||null;}}
  function world(){try{return (typeof NM!=="undefined"&&NM)?NM:(root.NM||null);}catch(e){return root.NM||null;}}
  function canvasCtx(){try{return (typeof ctx!=="undefined"&&ctx)?ctx:(root.ctx||null);}catch(e){return root.ctx||null;}}
  function hasProductionMarker(fn){return !!(fn&&(fn.__goodDogsHud||fn.__goodBoysCanon||fn.__goodBoysGameplayLoop));}
  function visible(el){
    try{
      if(!el||el.classList.contains("hidden"))return false;
      var s=root.getComputedStyle?root.getComputedStyle(el):el.style;
      return !s||((s.display!=="none")&&(s.visibility!=="hidden")&&Number(s.opacity||1)!==0);
    }catch(e){return false;}
  }
  function hasBlockingModal(){
    try{
      var d=root.document;if(!d)return false;
      var ids=["dialogue","battle","eod","good-boys-campaign-intro","good-boys-mobile-recovery"];
      for(var i=0;i<ids.length;i++)if(visible(d.getElementById(ids[i])))return true;
      return false;
    }catch(e){return false;}
  }
  function repairStaleDialog(){
    try{
      var s=state(),n=world();
      if(!s||!n||!s.nightMode||!s.inDialog)return false;
      if(hasBlockingModal())return false;
      s.inDialog=false;
      root.__productionStaleDialogRepairs=(root.__productionStaleDialogRepairs||0)+1;
      return true;
    }catch(e){return false;}
  }

  function selectBaseDraw(){
    var current=lexicalDraw();
    if(hasProductionMarker(current)&&typeof root.__techopsPreProductionDrawNM==="function")return root.__techopsPreProductionDrawNM;
    return current||root.__techopsPreProductionDrawNM||null;
  }
  function selectBaseStep(){
    var current=lexicalStep();
    if(current&&current.__goodBoysGameplayLoop&&typeof root.__techopsPreProductionStepNM==="function")return root.__techopsPreProductionStepNM;
    return current||root.__techopsPreProductionStepNM||null;
  }
  function drawFeatures(){
    var x=canvasCtx(),n=world();if(!x||!n)return;
    try{var g=root.TechOpsGoodBoysGameplayLoop;if(g&&typeof g.acceptance==="function"&&g.acceptance().active){if(typeof g.drawStageAccents==="function")g.drawStageAccents(x);if(typeof g.drawLoopOverlay==="function")g.drawLoopOverlay(x);return;}}catch(e){root.__techopsWrapperOverlayError=String(e&&e.stack||e);}
    try{var d=root.TechOpsGoodDogsProduction;if(d&&n._v736&&typeof d.drawReferenceHUD==="function")d.drawReferenceHUD(x,n);}catch(e){root.__techopsWrapperOverlayError=String(e&&e.stack||e);}
  }
  function stepFeatures(){
    try{var g=root.TechOpsGoodBoysGameplayLoop;if(g&&typeof g.acceptance==="function"&&g.acceptance().active){if(typeof g.configureStage==="function")g.configureStage();if(typeof g.applyHazards==="function")g.applyHazards();}}catch(e){root.__techopsWrapperStepError=String(e&&e.stack||e);}
  }
  function markDraw(fn){if(!fn)return;fn.__productionStableCompositor=true;fn.__goodDogsHud=true;fn.__goodBoysCanon=true;fn.__goodBoysGameplayLoop=true;}
  function markStep(fn){if(!fn)return;fn.__productionStableCompositor=true;fn.__goodBoysGameplayLoop=true;}

  function install(){
    if(installed)return true;
    baseDraw=selectBaseDraw();baseStep=selectBaseStep();
    if(typeof baseDraw!=="function"||typeof baseStep!=="function")return false;
    stableDraw=function(){var r;try{r=baseDraw.apply(this,arguments);}catch(e){root.__techopsStableBaseDrawError=String(e&&e.stack||e);throw e;}try{drawFeatures();}catch(e){}return r;};
    stableStep=function(){
      var r;
      try{repairStaleDialog();r=baseStep.apply(this,arguments);}catch(e){root.__techopsStableBaseStepError=String(e&&e.stack||e);throw e;}
      try{stepFeatures();}catch(e){}
      return r;
    };
    markDraw(stableDraw);markStep(stableStep);
    try{drawNM=stableDraw;}catch(e){try{root.drawNM=stableDraw;}catch(_){} }
    try{stepNM=stableStep;}catch(e){try{root.stepNM=stableStep;}catch(_){} }
    installed=true;root.__techopsWrapperGuardInstalled=true;return true;
  }
  function enforce(){
    repairStaleDialog();
    if(!installed){install();return;}
    try{var d=lexicalDraw();if(d!==stableDraw)drawNM=stableDraw;}catch(e){try{root.drawNM=stableDraw;}catch(_){} }
    try{var s=lexicalStep();if(s!==stableStep)stepNM=stableStep;}catch(e){try{root.stepNM=stableStep;}catch(_){} }
    markDraw(stableDraw);markStep(stableStep);
  }
  try{(root.setTimeout||setTimeout)(function(){install();enforce();},0);timer=(root.setInterval||setInterval)(enforce,50);}catch(e){}
  root.TechOpsProductionWrapperGuard={VERSION:VERSION,install:install,enforce:enforce,state:state,world:world,hasBlockingModal:hasBlockingModal,repairStaleDialog:repairStaleDialog,selectBaseDraw:selectBaseDraw,selectBaseStep:selectBaseStep,getBaseDraw:function(){return baseDraw;},getBaseStep:function(){return baseStep;},timer:timer};
})(typeof globalThis!=="undefined"?globalThis:this);
