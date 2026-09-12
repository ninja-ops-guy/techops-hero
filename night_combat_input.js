/* Canonical input adapter for ordinary Night Crawler only.
 * v55's existing frame bridge calls runStep; the Night lifecycle calls sync.
 * Input/controls only: no independent simulation timer, damage or renderer.
 */
(function(root){
  'use strict';
  if(root.TechOpsNightInput)return;
  let frameInput=null,jumpKey=false,jumpQueued=false,lastRuntime=null;
  const jumpPointers=new Set(),bound=new WeakSet();
  const keyMap={KeyE:'punch',KeyJ:'kick',KeyG:'grab',Space:'jump'};
  function runtime(){return typeof NM!=='undefined'?NM:root.NM;}
  function game(){return typeof S!=='undefined'?S:root.S;}
  function keyboard(){return typeof keys!=='undefined'?keys:(root.keys||{});}
  function joystick(){return typeof joy!=='undefined'?joy:(root.joy||{});}
  function owns(){const n=runtime(),s=game();return !!(s&&s.nightMode&&(typeof s.nightMode!=='object'||s.nightMode===n)&&root.TechOpsNightCombat&&root.TechOpsNightCombat.active(n));}
  function blocked(){
    const s=game(),rt=root.TechOpsNightRuntime;
    if(!s||s.inDialog||s.inBattle||s.paused||s.gameOver||root.document&&root.document.hidden)return true;
    if(rt&&typeof rt.blocked==='function'&&rt.blocked())return true;
    const director=root.TechOpsPresentationDirector;
    return !!(director&&typeof director.isBlocking==='function'&&director.isBlocking());
  }
  function ready(){const n=runtime();return owns()&&!blocked()&&!n.drive&&n.hp>0;}
  function snapshot(k){return frameInput||root.TechOpsNightCombat.normalizeInput(k||keyboard(),joystick());}
  function reset(){jumpKey=false;jumpQueued=false;jumpPointers.clear();}
  function dispatch(action,k){
    if(!ready())return false;
    if(runtime()!==lastRuntime){reset();lastRuntime=runtime();}
    if(action==='jump'){jumpQueued=true;return true;}
    // Home/Charger/other legitimate interactions retain their established route.
    // nmJab labels the eventual combat action as punch, never an implicit grab.
    if(action==='punch'&&typeof root.interact==='function'){
      const previous=frameInput,intent=snapshot(k);frameInput=intent;
      try{return root.interact();}finally{frameInput=previous;}
    }
    return root.TechOpsNightCombat.attack(runtime(),snapshot(k),action);
  }
  function runStep(step,dt,k,j){
    if(!owns()){reset();lastRuntime=null;return step(dt);}
    const n=runtime();if(n!==lastRuntime){reset();lastRuntime=n;}
    if(!ready()){reset();if(!n.drive||blocked())return;}
    const saved=['a','d','w','arrowleft','arrowright','arrowup'].map(key=>({key,owned:Object.prototype.hasOwnProperty.call(k,key),value:k[key]}));
    const previous=frameInput;
    frameInput=root.TechOpsNightCombat.normalizeInput(k,j||{});
    try{
      k.a=frameInput.a;k.d=frameInput.d;k.arrowleft=frameInput.arrowleft;k.arrowright=frameInput.arrowright;k.w=false;
      // Up is aim, not jump. A tap waits through hit-stop, and is consumed once.
      const edge=jumpQueued&&ready()&&!(n.hitStop>0);
      if(edge)jumpQueued=false;
      if(edge){n.jHeld=false;root.TechOpsNightCombat.jumpCancel(n);}
      k.arrowup=!!(edge||jumpKey||jumpPointers.size);
      return step(dt);
    }finally{
      for(const rec of saved)if(rec.owned)k[rec.key]=rec.value;else delete k[rec.key];
      frameInput=previous;
    }
  }
  function editable(el){return !!(el&&el.closest&&el.closest('input,textarea,select,[contenteditable="true"],[role="textbox"]'));}
  function stop(e){e.preventDefault();e.stopImmediatePropagation();}
  function buttonActivation(e){return owns()&&['Space','Enter'].includes(e.code)&&e.target&&e.target.closest&&e.target.closest('button,[role="button"]');}
  function keyDown(e){
    if(buttonActivation(e)){e.stopImmediatePropagation();return;}
    const action=keyMap[e.code];if(!action||!ready()||editable(e.target))return;
    // A focused button retains native Space/Enter activation above; stopping
    // propagation, not its default, keeps the legacy gameplay key listener out.
    stop(e);if(e.repeat)return;
    dispatch(action);
    if(action==='jump')jumpKey=true;
  }
  function keyUp(e){if(e.code==='Space')jumpKey=false;if(buttonActivation(e)){e.stopImmediatePropagation();return;}if(keyMap[e.code]&&ready()&&!editable(e.target))stop(e);}
  function bindButton(button,action,legacy=false){
    if(!button||bound.has(button))return;bound.add(button);
    let consumedAt=-Infinity,lastPhysical='';
    const clock=()=>root.performance&&root.performance.now?root.performance.now():Date.now();
    const press=e=>{
      const compatibility=e.type==='touchstart'&&lastPhysical==='pointerdown'||e.type==='mousedown'&&lastPhysical!=='mousedown'||e.type==='click'&&e.detail!==0;
      // The consumed press may just have opened Home's dialog. Suppress its
      // compatibility events even though the game is no longer input-ready.
      if(compatibility&&clock()-consumedAt<750){stop(e);return;}
      if(!ready())return;
      if(e.type==='pointerdown'&&e.button>0)return;
      if(e.type==='click'&&e.detail!==0){stop(e);return;}
      stop(e);
      if((e.type==='touchstart'||e.type==='mousedown')&&root.PointerEvent)return;
      if(e.type!=='click'){consumedAt=clock();lastPhysical=e.type;}
      dispatch(action);
      if(action==='jump'&&e.type!=='click'){
        jumpPointers.add(e.pointerId===undefined?'fallback':e.pointerId);
        if(e.pointerId!==undefined&&button.setPointerCapture)try{button.setPointerCapture(e.pointerId);}catch(_){}
      }
    };
    const release=e=>{
      jumpPointers.delete(e.pointerId===undefined?'fallback':e.pointerId);
      if((e.type==='pointercancel'||e.type==='touchcancel')&&!jumpPointers.size)jumpQueued=false;
      if(ready())e.preventDefault();
    };
    button.addEventListener('pointerdown',press,{capture:true});
    button.addEventListener('touchstart',press,{capture:true,passive:false});
    button.addEventListener('mousedown',press,{capture:true});
    button.addEventListener('click',press,{capture:true});
    for(const type of ['pointerup','pointercancel','lostpointercapture','touchend','touchcancel','mouseup'])button.addEventListener(type,release,{passive:false});
    if(legacy)button.dataset.nightCombatPunch='true';
  }
  function sync(){
    const doc=root.document;if(!doc)return;
    const box=doc.getElementById('v55-nmbtns');if(!box)return;
    if(!doc.getElementById('night-combat-input-style')){
      const style=doc.createElement('style');style.id='night-combat-input-style';
      style.textContent='#v55-nmbtns[data-night-combat-input="active"]{position:fixed!important;display:grid!important;grid-template-columns:repeat(2,56px);gap:8px;right:max(10px,env(safe-area-inset-right))!important;bottom:max(106px,calc(env(safe-area-inset-bottom) + 106px))!important}#v55-nmbtns[data-night-combat-input="paused"]{display:none!important}#v55-nmbtns .night-input-action[hidden]{display:none!important}#v55-nmbtns .night-input-action{min-width:56px;min-height:44px;cursor:pointer}#tb-interact[data-night-combat-punch="true"]{font-size:12px}';
      (doc.head||doc.documentElement).appendChild(style);
    }
    const active=owns(),enabled=ready();
    if(active)box.dataset.nightCombatInput=enabled?'active':'paused';else delete box.dataset.nightCombatInput;
    for(const action of ['grab','kick','jump']){
      const id='night-input-'+action;let b=doc.getElementById(id);
      if(!b){b=doc.createElement('button');b.id=id;b.type='button';b.className='v55-nbtn night-input-action';b.textContent=action.toUpperCase();b.setAttribute('aria-label',action==='grab'?'Grab or throw enemy':action==='kick'?'Directional kick':'Jump');box.appendChild(b);bindButton(b,action);}
      b.hidden=!active;b.disabled=!enabled;
    }
    const punch=doc.getElementById('tb-interact');bindButton(punch,'punch',true);
    if(active&&punch){
      const home=root.TechOpsNightRuntime&&root.TechOpsNightRuntime.atHome();
      punch.dataset.nightCombatPunch='true';punch.textContent=home?'ENTER':'PUNCH / USE';
      punch.setAttribute('aria-label',home?"Enter Mike's house":'Interact or directional punch');
      punch.title='E / A interacts at Home or the Charger; otherwise punch. Up: uppercut; down: low strike. J kick / G grab / Space jump.';
    }else if(punch&&punch.dataset.nightCombatPunch==='true'){punch.removeAttribute('aria-label');punch.removeAttribute('title');delete punch.dataset.nightCombatPunch;}
    if(!enabled)reset();
  }
  root.TechOpsNightInput={VERSION:2,owns,ready,snapshot,dispatch,runStep,sync,reset};
  if(root.addEventListener){
    root.addEventListener('keydown',keyDown,true);root.addEventListener('keyup',keyUp,true);
    root.addEventListener('blur',reset);
  }
  if(root.document){root.document.addEventListener('visibilitychange',()=>{if(root.document.hidden)reset();});sync();}
})(typeof globalThis!=='undefined'?globalThis:this);
