/* TechOps Hero — production wrapper guard v3.
 * Production health authority. Parser-loaded v7.36/v7.37 own the Night step/
 * draw chain; this module must never roll that chain back to an earlier snapshot.
 * It only repairs stale hidden dialogue state and reports wrapper health.
 */
(function(root){
  "use strict";
  if(!root)return;
  try{var prior=root.TechOpsProductionWrapperGuard;if(prior&&prior.timer&&root.clearInterval)root.clearInterval(prior.timer);}catch(e){}
  var VERSION=3,timer=null;
  function state(){try{return (typeof S!=="undefined"&&S)?S:(root.S||null);}catch(e){return root.S||null;}}
  function world(){try{return (typeof NM!=="undefined"&&NM)?NM:(root.NM||null);}catch(e){return root.NM||null;}}
  function lexicalDraw(){try{return typeof drawNM==="function"?drawNM:null;}catch(e){return null;}}
  function lexicalStep(){try{return typeof stepNM==="function"?stepNM:null;}catch(e){return null;}}
  function visible(el){try{if(!el||el.classList.contains("hidden"))return false;var s=root.getComputedStyle?root.getComputedStyle(el):el.style;return !s||(s.display!=="none"&&s.visibility!=="hidden"&&Number(s.opacity||1)!==0);}catch(e){return false;}}
  function hasBlockingModal(){try{var d=root.document;if(!d)return false;var ids=["dialogue","battle","eod","good-boys-campaign-intro","good-boys-mobile-recovery"];for(var i=0;i<ids.length;i++)if(visible(d.getElementById(ids[i])))return true;return false;}catch(e){return false;}}
  function repairStaleDialog(){try{var s=state(),n=world();if(!s||!n||!s.nightMode||!s.inDialog||hasBlockingModal())return false;s.inDialog=false;root.__productionStaleDialogRepairs=(root.__productionStaleDialogRepairs||0)+1;return true;}catch(e){return false;}}
  function health(){var d=lexicalDraw(),s=lexicalStep();return{version:VERSION,draw:typeof d==="function",step:typeof s==="function",night:!!world(),staleDialogRepairs:root.__productionStaleDialogRepairs||0,parserChainPreserved:true};}
  function install(){root.__techopsWrapperGuardInstalled=true;root.__techopsParserNightChainPreserved=true;repairStaleDialog();return !!(lexicalDraw()&&lexicalStep());}
  function enforce(){repairStaleDialog();return health();}
  install();try{timer=root.setInterval(repairStaleDialog,75);}catch(e){}
  root.TechOpsProductionWrapperGuard={VERSION:VERSION,install:install,enforce:enforce,state:state,world:world,hasBlockingModal:hasBlockingModal,repairStaleDialog:repairStaleDialog,health:health,timer:timer};
})(typeof globalThis!=="undefined"?globalThis:this);
