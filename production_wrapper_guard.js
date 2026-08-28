/* TechOps Hero — production compositor authority v8.
 * Owns the one authoritative Night draw/step function. Feature runtimes are
 * composed through exported callbacks instead of mutable drawNM/stepNM chains.
 * Late Good Boys campaign authorities are scheduled from this same step owner,
 * so production timer parking cannot silently disable authored progression.
 */
(function(root){
  "use strict";
  if(!root)return;
  try{var prior=root.TechOpsProductionWrapperGuard;if(prior&&prior.timer&&root.clearInterval)root.clearInterval(prior.timer);}catch(e){}
  var VERSION=8,timer=null,baseDraw=null,baseStep=null,stableDraw=null,stableStep=null,installed=false,drawing=false,stepping=false,baseSource="none";
  var authorityLast={},authorityStepCount=0,authorityTimersParked=0;
  function state(){try{return (typeof S!=="undefined"&&S)?S:(root.S||null);}catch(e){return root.S||null;}}
  function world(){try{return (typeof NM!=="undefined"&&NM)?NM:(root.NM||null);}catch(e){return root.NM||null;}}
  function lexicalDraw(){try{return typeof drawNM==="function"?drawNM:null;}catch(e){return null;}}
  function lexicalStep(){try{return typeof stepNM==="function"?stepNM:null;}catch(e){return null;}}
  function visible(el){try{if(!el||el.classList.contains("hidden"))return false;var s=root.getComputedStyle?root.getComputedStyle(el):el.style;return !s||(s.display!=="none"&&s.visibility!=="hidden"&&Number(s.opacity||1)!==0);}catch(e){return false;}}
  function hasBlockingModal(){try{var d=root.document;if(!d)return false;var ids=["dialogue","battle","eod","good-boys-campaign-intro","good-boys-mobile-recovery","good-boys-story-cine","gb-prison-cine","good-boys-earthfall-cine"];for(var i=0;i<ids.length;i++)if(visible(d.getElementById(ids[i])))return true;return false;}catch(e){return false;}}
  function repairStaleDialog(){try{var s=state(),n=world();if(!s||!n||!s.nightMode||!s.inDialog||hasBlockingModal())return false;s.inDialog=false;root.__productionStaleDialogRepairs=(root.__productionStaleDialogRepairs||0)+1;return true;}catch(e){return false;}}
  function markDraw(fn){if(!fn)return;fn.__productionStableCompositor=true;fn.__goodDogsHud=true;fn.__goodBoysCanon=true;fn.__goodBoysGameplayLoop=true;}
  function markStep(fn){if(!fn)return;fn.__productionStableCompositor=true;fn.__goodBoysGameplayLoop=true;fn.__goodBoysAuthorityOwner=true;}
  function usable(fn){return typeof fn==="function"&&!fn.__productionStableCompositor;}
  function chooseBases(){var fd=root.__techopsFinalParserDrawNM,fs=root.__techopsFinalParserStepNM;if(usable(fd)&&usable(fs)){baseDraw=fd;baseStep=fs;baseSource="final-parser";return true;}var pd=root.__techopsPreProductionDrawNM,ps=root.__techopsPreProductionStepNM;if(usable(pd)&&usable(ps)){baseDraw=pd;baseStep=ps;baseSource="pre-production";return true;}var ld=lexicalDraw(),ls=lexicalStep();if(usable(ld)&&usable(ls)){baseDraw=ld;baseStep=ls;baseSource="lexical-fallback";return true;}var rd=root.drawNM,rs=root.stepNM;if(usable(rd)&&usable(rs)){baseDraw=rd;baseStep=rs;baseSource="global-fallback";return true;}baseSource="unavailable";return false;}
  function drawFeatureLayers(){var x=root.ctx,n=world();if(!x||!n)return;try{var gd=root.TechOpsGoodDogsProduction;if(gd&&typeof gd.drawReferenceHUD==="function")gd.drawReferenceHUD(x,n);}catch(e){root.__productionGoodDogsDrawError=String(e&&e.stack||e);}try{var gb=root.TechOpsGoodBoysGameplayLoop;if(gb){if(typeof gb.drawStageAccents==="function")gb.drawStageAccents(x);if(typeof gb.drawLoopOverlay==="function")gb.drawLoopOverlay(x);}}catch(e){root.__productionGoodBoysDrawError=String(e&&e.stack||e);}try{var gc=root.TechOpsGoodBoysCanon;if(gc&&typeof gc.drawHud==="function")gc.drawHud(x);}catch(e){root.__productionGoodBoysCanonDrawError=String(e&&e.stack||e);}}
  function goodBoysActive(){try{var n=world();return !!(n&&n._v736);}catch(e){return false;}}
  function clock(){try{return root.performance&&root.performance.now?root.performance.now():Date.now();}catch(e){return Date.now();}}
  function due(key,period){if(!period)return true;var t=clock(),last=Number(authorityLast[key])||0;if(t-last<period)return false;authorityLast[key]=t;return true;}
  function parkAuthorityTimer(obj,key){try{if(!obj||obj.timer==null)return;if(root.clearInterval)root.clearInterval(obj.timer);obj.timer=null;authorityTimersParked++;root.__productionAuthorityTimersParked=authorityTimersParked;root.__productionLastParkedAuthority=key;}catch(e){}}
  function authorityCall(key,obj,fn,period){if(!obj||typeof obj[fn]!=="function")return false;parkAuthorityTimer(obj,key);if(!due(key+":"+fn,period||0))return false;try{obj[fn]();return true;}catch(e){root.__productionGoodBoysAuthorityErrors=root.__productionGoodBoysAuthorityErrors||{};root.__productionGoodBoysAuthorityErrors[key+"."+fn]=String(e&&e.stack||e);return false;}}
  function stepGoodBoysAuthorities(){
    if(!goodBoysActive())return;
    authorityStepCount++;root.__productionGoodBoysAuthorityStepCount=authorityStepCount;
    var w=root.TechOpsGoodBoysBibleWorld,a=root.TechOpsGoodBoysAccessCoreAuthority,p=root.TechOpsGoodBoysPrisonCinematicPatch,b=root.TechOpsGoodBoysBackgroundAuthority,e=root.TechOpsGoodBoysEarthfallEnding,d=root.TechOpsGoodBoysCampaignDirector,g=root.TechOpsGoodBoysProgressionAuthority;
    /* Fast invariants run every frame so legacy M1 enemies and Mike Index can
       never survive long enough to become visible authored state. */
    authorityCall("bible",w,"normalizeLegacy",0);
    authorityCall("access",a,"tick",0);
    if(w&&typeof w.updateWaldoTrail==="function")authorityCall("bible",w,"updateWaldoTrail",0);
    /* Heavier presentation/world maintenance stays on the compositor clock,
       but at roughly its former cadence rather than once per render frame. */
    authorityCall("bible",w,"tick",75);
    authorityCall("prison",p,"tick",120);
    authorityCall("background",b,"enforce",75);
    authorityCall("director",d,"tick",120);
    authorityCall("earthfall",e,"tick",45);
    authorityCall("progression",g,"tick",45);
  }
  function stepFeatureLayers(){try{var gb=root.TechOpsGoodBoysGameplayLoop;if(gb&&typeof gb.active==="function"&&gb.active()){if(typeof gb.configureStage==="function")gb.configureStage();if(typeof gb.applyHazards==="function")gb.applyHazards();}}catch(e){root.__productionGoodBoysStepError=String(e&&e.stack||e);}try{stepGoodBoysAuthorities();}catch(e){root.__productionGoodBoysAuthorityStepError=String(e&&e.stack||e);}}
  function assignDraw(){try{drawNM=stableDraw;}catch(e){}try{root.drawNM=stableDraw;}catch(e){}markDraw(stableDraw);}
  function assignStep(){try{stepNM=stableStep;}catch(e){}try{root.stepNM=stableStep;}catch(e){}markStep(stableStep);}
  function install(){if(installed)return true;if(!chooseBases()){root.__productionWrapperInstallError="immutable_parser_chain_unavailable";return false;}stableDraw=function(){if(drawing){root.__productionRecursiveDrawBlocked=(root.__productionRecursiveDrawBlocked||0)+1;return;}drawing=true;try{var r=baseDraw.apply(this,arguments);drawFeatureLayers();return r;}finally{drawing=false;}};stableStep=function(){if(stepping){root.__productionRecursiveStepBlocked=(root.__productionRecursiveStepBlocked||0)+1;return;}stepping=true;try{repairStaleDialog();var r=baseStep.apply(this,arguments);stepFeatureLayers();return r;}finally{stepping=false;}};assignDraw();assignStep();installed=true;root.__productionWrapperInstallError=null;root.__techopsWrapperGuardInstalled=true;root.__techopsParserNightChainPreserved=true;root.__productionSingleCompositor=true;root.__productionCompositorOwnsGoodBoysAuthorities=true;root.__productionCompositorBaseSource=baseSource;return true;}
  function enforce(){repairStaleDialog();if(!installed&&!install())return false;if(lexicalDraw()!==stableDraw||root.drawNM!==stableDraw)assignDraw();if(lexicalStep()!==stableStep||root.stepNM!==stableStep)assignStep();return true;}
  function health(){return{version:VERSION,installed:installed,draw:typeof lexicalDraw()==="function",step:typeof lexicalStep()==="function",baseSource:baseSource,singleCompositor:!!root.__productionSingleCompositor,ownsGoodBoysAuthorities:!!root.__productionCompositorOwnsGoodBoysAuthorities,authoritySteps:authorityStepCount,authorityTimersParked:authorityTimersParked,authorityErrors:root.__productionGoodBoysAuthorityErrors||null,globalDrawAligned:root.drawNM===stableDraw,globalStepAligned:root.stepNM===stableStep,recursiveDrawBlocked:root.__productionRecursiveDrawBlocked||0,recursiveStepBlocked:root.__productionRecursiveStepBlocked||0,staleDialogRepairs:root.__productionStaleDialogRepairs||0,parserChainPreserved:true,installError:root.__productionWrapperInstallError||null};}
  install();try{timer=root.setInterval(enforce,100);}catch(e){}
  root.TechOpsProductionWrapperGuard={VERSION:VERSION,install:install,enforce:enforce,state:state,world:world,hasBlockingModal:hasBlockingModal,repairStaleDialog:repairStaleDialog,stepGoodBoysAuthorities:stepGoodBoysAuthorities,health:health,getBaseDraw:function(){return baseDraw;},getBaseStep:function(){return baseStep;},timer:timer};
})(typeof globalThis!=="undefined"?globalThis:this);
