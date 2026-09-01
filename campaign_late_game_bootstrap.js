/* TechOps Hero — Story Bible gaps 4–7 browser bootstrap v1.
 * Loads late-game content only after the canonical campaign/runtime layers exist.
 * This preserves Good Boys _v736 as an interlude-only authority.
 */
(function(root){
  "use strict";
  if(!root||!root.document||root.TechOpsLateGameBootstrap)return;
  var VERSION=1,started=false,ready=false,tries=0;
  var FILES=[
    {src:"morningstar_build.js",global:"TechOpsMORNINGSTARBuild"},
    {src:"swarm_doctrine.js",global:"TechOpsSwarmDoctrine"},
    {src:"chapters_vii_x.js",global:"TechOpsLateGameCampaign"},
    {src:"felicia_first_office.js",global:"TechOpsFeliciaFirstOfficeDialogue"}
  ];
  function dependenciesReady(){
    return !!(root.TechOpsCampaign&&root.TechOpsCampaignAct2&&root.TechOpsStory&&root.TechOpsCampaignNativeAct2&&root.interact);
  }
  function loadOne(def){
    return new Promise(function(resolve){
      try{
        if(root[def.global]){resolve(true);return;}
        var existing=root.document.querySelector('script[data-techops-late-game="'+def.src+'"]');
        if(existing){
          var n=0,t=(root.setInterval||setInterval)(function(){if(root[def.global]||n++>100){(root.clearInterval||clearInterval)(t);resolve(!!root[def.global]);}},25);return;
        }
        var s=root.document.createElement("script");
        s.src=def.src+"?v=20260901-bible-gaps-4567-v1";
        s.async=false;s.dataset.techopsLateGame=def.src;
        s.onload=function(){resolve(!!root[def.global]);};
        s.onerror=function(){root.__lateGameBootstrapError="load-failed:"+def.src;resolve(false);};
        (root.document.head||root.document.documentElement).appendChild(s);
      }catch(e){root.__lateGameBootstrapError=String(e&&e.stack||e);resolve(false);}
    });
  }
  function patchEndingSelection(){
    try{
      var x=root.TechOpsChapterX,story=root.TechOpsStory,camp=root.TechOpsCampaign;
      if(!x||typeof x.selectEnding!=="function"||x.selectEnding.__storyAuthorityFirst)return false;
      var base=x.selectEnding;
      var wrapped=function(id){
        try{
          var verdict=root.TechOpsEndingValidator&&root.TechOpsEndingValidator.validate?root.TechOpsEndingValidator.validate(id):{valid:true};
          if(!verdict.valid)return base.apply(this,arguments);
          var state=camp&&camp.load?camp.load(root.localStorage):null;
          if(state&&story&&typeof story.ensureStoryState==="function"&&typeof story.chooseEnding==="function"){
            var st=story.ensureStoryState(state);
            if(!st.ending){story.chooseEnding(state,id);if(camp.save)camp.save(state,root.localStorage);}
          }
        }catch(e){root.__endingAuthorityPrimeError=String(e&&e.stack||e);}
        return base.apply(this,arguments);
      };
      wrapped.__storyAuthorityFirst=true;wrapped.__base=base;x.selectEnding=wrapped;return true;
    }catch(e){root.__endingAuthorityPatchError=String(e&&e.stack||e);return false;}
  }
  async function start(){
    if(started)return;started=true;
    while(!dependenciesReady()&&tries++<400)await new Promise(function(r){(root.setTimeout||setTimeout)(r,25);});
    if(!dependenciesReady()){root.__lateGameBootstrapError="canonical-dependencies-timeout";return;}
    var results=[];
    for(var i=0;i<FILES.length;i++)results.push(await loadOne(FILES[i]));
    patchEndingSelection();
    ready=results.every(Boolean);
    root.__lateGameBootstrapAcceptance={version:VERSION,ready:ready,files:FILES.map(function(f,i){return{src:f.src,loaded:!!results[i]};}),goodBoysWrites:false,at:Date.now()};
    try{root.dispatchEvent(new CustomEvent("techops:late-game-ready",{detail:root.__lateGameBootstrapAcceptance}));}catch(_){}
  }
  root.TechOpsLateGameBootstrap={VERSION:VERSION,FILES:FILES.slice(),start:start,ready:function(){return ready;},acceptance:function(){return root.__lateGameBootstrapAcceptance||{version:VERSION,ready:false};}};
  if(root.document.readyState==="loading")root.addEventListener("DOMContentLoaded",start,{once:true});else (root.setTimeout||setTimeout)(start,0);
})(typeof globalThis!=="undefined"?globalThis:this);
