/* TechOps Hero — workstation cinematic retirement v2.
 * The old full-screen Mike/Felicia/ORPHEUS workstation composition was a
 * pre-production concept frame, not an in-world dialogue surface. Keep the
 * authored workstation/company progression, but never let that concept overlay
 * replace ordinary conversations or the real Felicia video flow.
 */
(function(root){
  "use strict";
  if(!root||!root.document)return;

  try{
    if(root.TechOpsWorkstationClarityPatch&&root.TechOpsWorkstationClarityPatch.observer&&typeof root.TechOpsWorkstationClarityPatch.observer.disconnect==="function"){
      root.TechOpsWorkstationClarityPatch.observer.disconnect();
    }
  }catch(e){}

  function visualApi(){return root.TechOpsCampaignNativeAct1Visuals||null;}

  function isRetiredOverlay(el){
    return !!(el&&el.id==="act1-reference"&&el.classList&&el.classList.contains("a1-first_person"));
  }

  function retireConceptOverlay(){
    var el=root.document.getElementById("act1-reference");
    var active=root.__techopsAct1ReferenceScene;
    if(active!=="workstation"&&!isRetiredOverlay(el))return false;
    var api=visualApi();
    if(api&&typeof api.hide==="function"){
      api.hide(true);
      return true;
    }
    if(el&&el.parentNode){
      el.parentNode.removeChild(el);
      root.__techopsAct1ReferenceScene=null;
      return true;
    }
    return false;
  }

  function installDialogueGuard(){
    if(root.__techopsWorkstationRetirementDlgGuard)return true;
    if(typeof root.dlg!=="function")return false;
    var baseDlg=root.dlg;
    root.dlg=function(){
      var result=baseDlg.apply(this,arguments);
      try{retireConceptOverlay();}catch(e){}
      return result;
    };
    root.__techopsWorkstationRetirementDlgGuard=true;
    return true;
  }

  function removeLegacyDecoration(){
    try{
      var style=root.document.getElementById("workstation-cinematic-clarity-style");
      if(style&&style.parentNode)style.parentNode.removeChild(style);
      var key=root.document.querySelector&&root.document.querySelector(".a1-workstation-key");
      if(key&&key.parentNode)key.parentNode.removeChild(key);
    }catch(e){}
  }

  removeLegacyDecoration();
  installDialogueGuard();
  retireConceptOverlay();

  var observer=null;
  if(typeof root.MutationObserver==="function"){
    observer=new root.MutationObserver(function(){
      installDialogueGuard();
      removeLegacyDecoration();
      retireConceptOverlay();
    });
    observer.observe(root.document.documentElement,{subtree:true,childList:true});
  }

  root.TechOpsWorkstationClarityPatch={
    VERSION:2,
    RETIRED:true,
    retireConceptOverlay:retireConceptOverlay,
    installDialogueGuard:installDialogueGuard,
    observer:observer
  };
})(typeof globalThis!=="undefined"?globalThis:this);
