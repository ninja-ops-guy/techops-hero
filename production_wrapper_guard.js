/* TechOps Hero — production compositor authority v5.
 * Owns the one authoritative Night draw/step function. Feature runtimes are
 * composed through exported callbacks instead of being allowed to form mutable
 * drawNM -> drawNM wrapper chains. Both lexical and global bindings are forced
 * to the same stable function so browser binding semantics cannot diverge.
 */
(function(root){
  "use strict";
  if(!root)return;
  try{var prior=root.TechOpsProductionWrapperGuard;if(prior&&prior.timer&&root.clearInterval)root.clearInterval(prior.timer);}catch(e){}
  var VERSION=5,timer=null,baseDraw=null,baseStep=null,stableDraw=null,stableStep=null,installed=false,drawing=false,stepping=false;

  function state(){try{return (typeof S!=="undefined"&&S)?S:(root.S||null);}catch(e){return root.S||null;}}
  function world(){try{return (typeof NM!=="undefined"&&NM)?NM:(root.NM||null);}catch(e){return root.NM||null;}}
  function lexicalDraw(){try{return typeof drawNM==="function"?drawNM:null;}catch(e){return null;}}
  function lexicalStep(){try{return typeof stepNM==="function"?stepNM:null;}catch(e){return null;}}
  function visible(el){try{if(!el||el.classList.contains("hidden"))return false;var s=root.getComputedStyle?root.getComputedStyle(el):el.style;return !s||(s.display!=="none"&&s.visibility!=="hidden"&&Number(s.opacity||1)!==0);}catch(e){return false;}}
  function hasBlockingModal(){try{var d=root.document;if(!d)return false;var ids=["dialogue","battle","eod","good-boys-campaign-intro","good-boys-mobile-recovery"];for(var i=0;i<ids.length;i++)if(visible(d.getElementById(ids[i])))return true;return false;}catch(e){return false;}}
  function repairStaleDialog(){try{var s=state(),n=world();if(!s||!n||!s.nightMode||!s.inDialog||hasBlockingModal())return false;s.inDialog=false;root.__productionStaleDialogRepairs=(root.__productionStaleDialogRepairs||0)+1;return true;}catch(e){return false;}}

  function markDraw(fn){if(!fn)return;fn.__productionStableCompositor=true;fn.__goodDogsHud=true;fn.__goodBoysCanon=true;fn.__goodBoysGameplayLoop=true;}
  function markStep(fn){if(!fn)return;fn.__productionStableCompositor=true;fn.__goodBoysGameplayLoop=true;}
  function sameBase(fn){return typeof fn==="function"&&!fn.__productionStableCompositor&&!fn.__goodDogsHud&&!fn.__goodBoysCanon&&!fn.__goodBoysGameplayLoop;}

  function drawFeatureLayers(){
    var x=root.ctx,n=world();if(!x||!n)return;
    try{var gd=root.TechOpsGoodDogsProduction;if(gd&&typeof gd.drawReferenceHUD==="function")gd.drawReferenceHUD(x,n);}catch(e){root.__productionGoodDogsDrawError=String(e&&e.stack||e);}
    try{var gb=root.TechOpsGoodBoysGameplayLoop;if(gb){if(typeof gb.drawStageAccents==="function")gb.drawStageAccents(x);if(typeof gb.drawLoopOverlay==="function")gb.drawLoopOverlay(x);}}catch(e){root.__productionGoodBoysDrawError=String(e&&e.stack||e);}
  }
  function stepFeatureLayers(){
    try{var gb=root.TechOpsGoodBoysGameplayLoop;if(gb&&typeof gb.active==="function"&&gb.active()){if(typeof gb.configureStage==="function")gb.configureStage();if(typeof gb.applyHazards==="function")gb.applyHazards();}}catch(e){root.__productionGoodBoysStepError=String(e&&e.stack||e);}
  }
  function assignDraw(){try{drawNM=stableDraw;}catch(e){}try{root.drawNM=stableDraw;}catch(e){}markDraw(stableDraw);}
  function assignStep(){try{stepNM=stableStep;}catch(e){}try{root.stepNM=stableStep;}catch(e){}markStep(stableStep);}

  function install(){
    if(installed)return true;
    var ld=lexicalDraw(),rd=typeof root.drawNM==="function"?root.drawNM:null;
    var ls=lexicalStep(),rs=typeof root.stepNM==="function"?root.stepNM:null;
    baseDraw=sameBase(ld)?ld:(sameBase(rd)?rd:null);
    baseStep=sameBase(ls)?ls:(sameBase(rs)?rs:null);
    if(typeof baseDraw!=="function"||typeof baseStep!=="function")return false;

    stableDraw=function(){
      if(drawing){root.__productionRecursiveDrawBlocked=(root.__productionRecursiveDrawBlocked||0)+1;return;}
      drawing=true;
      try{var r=baseDraw.apply(this,arguments);drawFeatureLayers();return r;}finally{drawing=false;}
    };
    stableStep=function(){
      if(stepping){root.__productionRecursiveStepBlocked=(root.__productionRecursiveStepBlocked||0)+1;return;}
      stepping=true;
      try{repairStaleDialog();var r=baseStep.apply(this,arguments);stepFeatureLayers();return r;}finally{stepping=false;}
    };
    assignDraw();assignStep();
    installed=true;root.__techopsWrapperGuardInstalled=true;root.__techopsParserNightChainPreserved=true;root.__productionSingleCompositor=true;return true;
  }
  function enforce(){
    repairStaleDialog();if(!installed&&!install())return false;
    if(lexicalDraw()!==stableDraw||root.drawNM!==stableDraw)assignDraw();
    if(lexicalStep()!==stableStep||root.stepNM!==stableStep)assignStep();
    return true;
  }
  function health(){return{
    version:VERSION,installed:installed,draw:typeof lexicalDraw()==="function",step:typeof lexicalStep()==="function",
    singleCompositor:!!root.__productionSingleCompositor,globalDrawAligned:root.drawNM===stableDraw,globalStepAligned:root.stepNM===stableStep,
    recursiveDrawBlocked:root.__productionRecursiveDrawBlocked||0,recursiveStepBlocked:root.__productionRecursiveStepBlocked||0,
    staleDialogRepairs:root.__productionStaleDialogRepairs||0,parserChainPreserved:true
  };}
  install();try{timer=root.setInterval(enforce,100);}catch(e){}
  root.TechOpsProductionWrapperGuard={VERSION:VERSION,install:install,enforce:enforce,state:state,world:world,hasBlockingModal:hasBlockingModal,repairStaleDialog:repairStaleDialog,health:health,getBaseDraw:function(){return baseDraw;},getBaseStep:function(){return baseStep;},timer:timer};
})(typeof globalThis!=="undefined"?globalThis:this);
