/* TechOps Hero — production wrapper guard v1.
 * P0: late Good Boys presentation modules periodically re-wrapped drawNM using
 * mutable module-global `baseDraw` variables. Cross-rewraps created circular
 * call graphs (A -> B -> A) and black-screened Night Crawler + Good Boys.
 *
 * This module establishes one stable compositor after the synchronous legacy
 * stack has loaded. Feature modules are marked as already composed so their
 * polling installers cannot mutate the draw/step chain again. Their exported
 * overlay/stage APIs are invoked explicitly from this compositor.
 */
(function(root){
  "use strict";
  if(!root) return;
  if(root.TechOpsProductionWrapperGuard&&root.TechOpsProductionWrapperGuard.VERSION>=1)return;
  var VERSION=1,timer=null,installed=false,baseDraw=null,baseStep=null,stableDraw=null,stableStep=null;

  function lexicalDraw(){try{return typeof drawNM==="function"?drawNM:null;}catch(e){return null;}}
  function lexicalStep(){try{return typeof stepNM==="function"?stepNM:null;}catch(e){return null;}}
  function world(){try{return (typeof NM!=="undefined"&&NM)?NM:null;}catch(e){return root.NM||null;}}
  function canvasCtx(){try{return (typeof ctx!=="undefined"&&ctx)?ctx:(root.ctx||null);}catch(e){return root.ctx||null;}}
  function hasProductionMarker(fn){return !!(fn&&(fn.__goodDogsHud||fn.__goodBoysCanon||fn.__goodBoysGameplayLoop));}

  function selectBaseDraw(){
    var current=lexicalDraw();
    /* If the production wrappers already raced us, never capture that chain.
       dogs.js snapshots a known-safe pre-production renderer before v7.36/37. */
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
    stableStep=function(){var r;try{r=baseStep.apply(this,arguments);}catch(e){root.__techopsStableBaseStepError=String(e&&e.stack||e);throw e;}try{stepFeatures();}catch(e){}return r;};
    markDraw(stableDraw);markStep(stableStep);
    try{drawNM=stableDraw;}catch(e){try{root.drawNM=stableDraw;}catch(_){} }
    try{stepNM=stableStep;}catch(e){try{root.stepNM=stableStep;}catch(_){} }
    installed=true;root.__techopsWrapperGuardInstalled=true;return true;
  }
  function enforce(){
    if(!installed){install();return;}
    try{var d=lexicalDraw();if(d!==stableDraw){/* A late poller wrapped us. Replace it; never recapture. */drawNM=stableDraw;}}catch(e){try{root.drawNM=stableDraw;}catch(_){} }
    try{var s=lexicalStep();if(s!==stableStep)stepNM=stableStep;}catch(e){try{root.stepNM=stableStep;}catch(_){} }
    markDraw(stableDraw);markStep(stableStep);
  }
  /* Zero-delay waits until parser-loaded v7.36/v7.37 and campaign scripts finish.
     Then an interval prevents any late dynamic module from rebuilding a cycle. */
  try{(root.setTimeout||setTimeout)(function(){install();enforce();},0);timer=(root.setInterval||setInterval)(enforce,50);}catch(e){}
  root.TechOpsProductionWrapperGuard={VERSION:VERSION,install:install,enforce:enforce,world:world,selectBaseDraw:selectBaseDraw,selectBaseStep:selectBaseStep,getBaseDraw:function(){return baseDraw;},getBaseStep:function(){return baseStep;},timer:timer};
})(typeof globalThis!=="undefined"?globalThis:this);
