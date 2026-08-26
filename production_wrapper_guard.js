/* TechOps Hero — production wrapper guard v4.
 * Freezes the COMPLETE post-parser/post-production Night wrapper chain once all
 * feature authorities are loaded. Unlike v2, it never rolls back to an early
 * snapshot. The stable outer wrapper advertises every composed feature marker,
 * preventing periodic feature installers from recursively wrapping each other.
 */
(function(root){
  "use strict";
  if(!root)return;
  try{var prior=root.TechOpsProductionWrapperGuard;if(prior&&prior.timer&&root.clearInterval)root.clearInterval(prior.timer);}catch(e){}
  var VERSION=4,timer=null,baseDraw=null,baseStep=null,stableDraw=null,stableStep=null,installed=false;
  function state(){try{return (typeof S!=="undefined"&&S)?S:(root.S||null);}catch(e){return root.S||null;}}
  function world(){try{return (typeof NM!=="undefined"&&NM)?NM:(root.NM||null);}catch(e){return root.NM||null;}}
  function lexicalDraw(){try{return typeof drawNM==="function"?drawNM:null;}catch(e){return null;}}
  function lexicalStep(){try{return typeof stepNM==="function"?stepNM:null;}catch(e){return null;}}
  function visible(el){try{if(!el||el.classList.contains("hidden"))return false;var s=root.getComputedStyle?root.getComputedStyle(el):el.style;return !s||(s.display!=="none"&&s.visibility!=="hidden"&&Number(s.opacity||1)!==0);}catch(e){return false;}}
  function hasBlockingModal(){try{var d=root.document;if(!d)return false;var ids=["dialogue","battle","eod","good-boys-campaign-intro","good-boys-mobile-recovery"];for(var i=0;i<ids.length;i++)if(visible(d.getElementById(ids[i])))return true;return false;}catch(e){return false;}}
  function repairStaleDialog(){try{var s=state(),n=world();if(!s||!n||!s.nightMode||!s.inDialog||hasBlockingModal())return false;s.inDialog=false;root.__productionStaleDialogRepairs=(root.__productionStaleDialogRepairs||0)+1;return true;}catch(e){return false;}}
  function markDraw(fn){if(!fn)return;fn.__productionStableCompositor=true;fn.__goodDogsHud=true;fn.__goodBoysCanon=true;fn.__goodBoysGameplayLoop=true;}
  function markStep(fn){if(!fn)return;fn.__productionStableCompositor=true;fn.__goodBoysGameplayLoop=true;}
  function install(){
    if(installed)return true;
    baseDraw=lexicalDraw();baseStep=lexicalStep();
    if(typeof baseDraw!=="function"||typeof baseStep!=="function")return false;
    stableDraw=function(){return baseDraw.apply(this,arguments);};
    stableStep=function(){repairStaleDialog();return baseStep.apply(this,arguments);};
    markDraw(stableDraw);markStep(stableStep);
    try{drawNM=stableDraw;}catch(e){try{root.drawNM=stableDraw;}catch(_){} }
    try{stepNM=stableStep;}catch(e){try{root.stepNM=stableStep;}catch(_){} }
    installed=true;root.__techopsWrapperGuardInstalled=true;root.__techopsParserNightChainPreserved=true;return true;
  }
  function enforce(){repairStaleDialog();if(!installed)return install();try{if(lexicalDraw()!==stableDraw)drawNM=stableDraw;}catch(e){}try{if(lexicalStep()!==stableStep)stepNM=stableStep;}catch(e){}markDraw(stableDraw);markStep(stableStep);return true;}
  function health(){return{version:VERSION,installed:installed,draw:typeof lexicalDraw()==="function",step:typeof lexicalStep()==="function",staleDialogRepairs:root.__productionStaleDialogRepairs||0,parserChainPreserved:true};}
  install();try{timer=root.setInterval(enforce,100);}catch(e){}
  root.TechOpsProductionWrapperGuard={VERSION:VERSION,install:install,enforce:enforce,state:state,world:world,hasBlockingModal:hasBlockingModal,repairStaleDialog:repairStaleDialog,health:health,getBaseDraw:function(){return baseDraw;},getBaseStep:function(){return baseStep;},timer:timer};
})(typeof globalThis!=="undefined"?globalThis:this);
