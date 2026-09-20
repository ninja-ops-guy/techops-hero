/* TechOps Hero — mode shell authority v1.
 *
 * Owns the reversible Day -> Night UI boundary. This service is deliberately
 * passive: no wrappers, listeners, timers or frame work. The canonical Night
 * lifecycle calls enterNight()/exitNight() exactly where it changes modes.
 */
(function(root){
  "use strict";
  if(!root||root.TechOpsModeShell)return;

  var VERSION=1;
  var DAY_SURFACES=["hud","panel","battle","eod","quest-tracker"];
  var SHARED_SURFACES=["dialogue"];
  var STYLE_PROPS=["display","visibility","pointer-events"];
  var serial=0,session=null;

  function state(){
    try{return typeof S!=="undefined"?S:(root.S||null);}catch(_){return root.S||null;}
  }
  function element(id){
    try{return root.document&&root.document.getElementById(id);}catch(_){return null;}
  }
  function propSnapshot(style,name){
    if(!style)return{value:"",priority:""};
    try{return{value:style.getPropertyValue(name)||"",priority:style.getPropertyPriority(name)||""};}
    catch(_){return{value:style[name]||"",priority:""};}
  }
  function setProp(style,name,record){
    if(!style)return;
    try{
      if(record&&record.value!=="")style.setProperty(name,record.value,record.priority||"");
      else style.removeProperty(name);
    }catch(_){style[name]=record&&record.value||"";}
  }
  function surfaceSnapshot(id){
    var node=element(id),styles={};
    if(!node)return{id:id,missing:true};
    STYLE_PROPS.forEach(function(name){styles[name]=propSnapshot(node.style,name);});
    return{
      id:id,styles:styles,
      hiddenClass:!!(node.classList&&node.classList.contains("hidden")),
      ariaHidden:node.getAttribute?node.getAttribute("aria-hidden"):null
    };
  }
  function captureSurfaces(){
    var out={};
    DAY_SURFACES.concat(SHARED_SURFACES).forEach(function(id){out[id]=surfaceSnapshot(id);});
    return out;
  }
  /* Captured before either router can style the shell. Title-launched Night
     therefore restores the parser-authored inline baseline, not the router's
     temporary display:none values. Direct Day -> Night restores its live
     entry snapshot instead. */
  var parserBaseline=captureSurfaces();

  function restoreSurface(record){
    if(!record||record.missing)return;
    var node=element(record.id);if(!node)return;
    STYLE_PROPS.forEach(function(name){setProp(node.style,name,record.styles[name]);});
    if(node.classList){
      if(record.hiddenClass)node.classList.add("hidden");
      else node.classList.remove("hidden");
    }
    if(node.setAttribute){
      if(record.ariaHidden===null)node.removeAttribute("aria-hidden");
      else node.setAttribute("aria-hidden",record.ariaHidden);
    }
  }
  function hideDaySurface(id){
    var node=element(id);if(!node||!node.style)return;
    node.style.setProperty("display","none","important");
    node.style.setProperty("visibility","hidden","important");
    node.style.setProperty("pointer-events","none","important");
    if(node.setAttribute)node.setAttribute("aria-hidden","true");
  }
  function prepareSharedDialogue(){
    var node=element("dialogue");if(!node)return;
    /* Dialogue is hidden at handoff, but remains the Night car/home modal.
       Do not leave a hard inline display lock that dlg() cannot reopen. */
    if(node.classList)node.classList.add("hidden");
    if(node.style)STYLE_PROPS.forEach(function(name){try{node.style.removeProperty(name);}catch(_){node.style[name]="";}});
  }
  function resetHeldInput(){
    try{var k=typeof keys!=="undefined"?keys:root.keys;if(k)Object.keys(k).forEach(function(key){k[key]=false;});}catch(_){}
    try{var j=typeof joy!=="undefined"?joy:root.joy;if(j){j.x=0;j.y=0;}}catch(_){}
    try{if(root.TechOpsNightInput&&root.TechOpsNightInput.reset)root.TechOpsNightInput.reset();}catch(_){}
  }
  function fieldSnapshot(target,name){
    return target?{owned:Object.prototype.hasOwnProperty.call(target,name),value:target[name]}:{owned:false,value:undefined};
  }
  function restoreField(target,name,record){
    if(!target||!record)return;
    if(record.owned)target[name]=record.value;else try{delete target[name];}catch(_){target[name]=record.value;}
  }
  function readPanelOpen(){try{return typeof panelOpen!=="undefined"?{available:true,value:panelOpen}:{available:false};}catch(_){return{available:false};}}
  function readEodOpen(){try{return typeof eodOpen!=="undefined"?{available:true,value:eodOpen}:{available:false};}catch(_){return{available:false};}}
  function writePanelOpen(value){try{if(typeof panelOpen!=="undefined")panelOpen=!!value;}catch(_){}}
  function writeEodOpen(value){try{if(typeof eodOpen!=="undefined")eodOpen=!!value;}catch(_){}}
  function inputSnapshot(game){
    return{
      inDialog:fieldSnapshot(game,"inDialog"),
      inBattle:fieldSnapshot(game,"inBattle"),
      paused:fieldSnapshot(game,"paused"),
      panelOpen:readPanelOpen(),eodOpen:readEodOpen()
    };
  }
  function clearDayBlockers(game){
    if(game){game.inDialog=false;game.inBattle=false;if(Object.prototype.hasOwnProperty.call(game,"paused"))game.paused=false;}
    writePanelOpen(false);writeEodOpen(false);resetHeldInput();
  }
  function restoreInput(game,input){
    if(!input)return;
    restoreField(game,"inDialog",input.inDialog);
    restoreField(game,"inBattle",input.inBattle);
    restoreField(game,"paused",input.paused);
    if(input.panelOpen.available)writePanelOpen(input.panelOpen.value);
    if(input.eodOpen.available)writeEodOpen(input.eodOpen.value);
    resetHeldInput();
  }
  function titleOwned(){
    return root.__productionDesiredMode==="nightcrawler"||root.__productionActiveMode==="nightcrawler"||root.__v737NightStartIntent===true;
  }
  function titleRestoreSnapshot(live){
    var out={};
    DAY_SURFACES.concat(SHARED_SURFACES).forEach(function(id){
      var current=live[id],base=parserBaseline[id];
      if(!current||current.missing){out[id]=current;return;}
      out[id]={id:current.id,missing:false,hiddenClass:current.hiddenClass,ariaHidden:current.ariaHidden,styles:{}};
      STYLE_PROPS.forEach(function(name){out[id].styles[name]=current.styles[name];});
      /* The title router temporarily writes only display:none!important. Keep
         the live run's classes/input semantics, but restore the pre-router
         inline display value when that exact marker is present. */
      if(base&&!base.missing&&current.styles.display.value==="none"&&current.styles.display.priority==="important")out[id].styles.display=base.styles.display;
    });
    return out;
  }
  function enforceDayIsolation(){DAY_SURFACES.forEach(hideDaySurface);}

  function enterNight(game){
    game=game||state();if(!game)return false;
    if(session){
      if(session.state===game){enforceDayIsolation();return session.token;}
      exitNight(session.state);
    }
    var routed=titleOwned(),live=captureSurfaces();
    session={
      token:"mode-shell:night:"+(++serial),state:game,
      surfaces:routed?titleRestoreSnapshot(live):live,input:inputSnapshot(game),routed:routed
    };
    clearDayBlockers(game);enforceDayIsolation();prepareSharedDialogue();
    if(root.document&&root.document.body&&root.document.body.classList)root.document.body.classList.add("techops-night-shell");
    return session.token;
  }
  function exitNight(game){
    if(!session)return false;
    var closing=session;session=null;
    DAY_SURFACES.concat(SHARED_SURFACES).forEach(function(id){restoreSurface(closing.surfaces[id]);});
    /* A stale callback must not write old blocker values into a replacement
       run. The snapshot always belongs to the state that acquired the shell. */
    restoreInput(game===closing.state?game:closing.state,closing.input);
    if(root.document&&root.document.body&&root.document.body.classList)root.document.body.classList.remove("techops-night-shell");
    return true;
  }
  function health(){
    return{version:VERSION,active:!!session,mode:session?"night":"day",token:session&&session.token||null,routed:!!(session&&session.routed),surfaces:DAY_SURFACES.concat(SHARED_SURFACES),pass:true};
  }

  root.TechOpsModeShell={VERSION:VERSION,DAY_SURFACES:DAY_SURFACES.slice(),SHARED_SURFACES:SHARED_SURFACES.slice(),enterNight:enterNight,exitNight:exitNight,active:function(){return!!session;},health:health};
  if(typeof module!=="undefined"&&module.exports)module.exports=root.TechOpsModeShell;

  /* If a very fast title action beat the deferred production bootstrap, adopt
     the already-created Night world once without installing a watcher. */
  var current=state();if(current&&current.nightMode)enterNight(current);
})(typeof globalThis!=="undefined"?globalThis:this);
