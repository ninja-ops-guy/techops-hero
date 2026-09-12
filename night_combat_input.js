/* Canonical input adapter for ordinary Night Crawler only.
 * v55's existing frame bridge calls runStep; its existing draw calls sync.
 * This module owns input/controls, not a simulation timer, damage or a renderer.
 */
(function(root){
  'use strict';
  if(root.TechOpsNightInput)return;
  let frameInput=null,jumpKey=false,jumpQueued=false,lastRuntime=null;
  const jumpPointers=new Set(),bound=new WeakSet();
  const keyMap={KeyE:'punch',Enter:'punch',KeyJ:'kick',KeyG:'grab',Space:'jump'};
  function runtime(){const s=game();return s&&s.nightMode&&typeof s.nightMode==='object'?s.nightMode:typeof NM!=='undefined'?NM:root.NM;}
  function game(){return typeof S!=='undefined'?S:root.S;}
  function keyboard(){return typeof keys!=='undefined'?keys:(root.keys||{});}
  function joystick(){return typeof joy!=='undefined'?joy:(root.joy||{});}
  function owns(){const n=runtime(),s=game();return !!(s&&s.nightMode&&root.TechOpsNightCombat&&root.TechOpsNightCombat.active(n));}
  function ready(){
    const n=runtime(),s=game(),lifecycle=root.TechOpsNightRuntime;
    return owns()&&!s.inDialog&&!s.inBattle&&!s.paused&&!s.gameOver&&!n.drive&&n.hp>0&&
      !(root.document&&root.document.hidden)&&!(lifecycle&&lifecycle.blocked());
  }
  // E/Punch remains an interaction at the established home/Charger boundaries.
  // Delegate to the existing owner rather than creating a second navigation path.
  function contextAction(){
    if(!ready())return null;
    const n=runtime(),lifecycle=root.TechOpsNightRuntime;
    if(lifecycle&&lifecycle.atHome())return 'home';
    const car=typeof NM_CAR_X==='number'?NM_CAR_X:26;
    if(n.x<car+150&&!(n.enemies||[]).some(e=>e.alive&&Math.abs(e.x-n.x)<90))return 'charger';
    return null;
  }
  function snapshot(k){return frameInput||root.TechOpsNightCombat.normalizeInput(k||keyboard(),joystick());}
  function reset(){jumpKey=false;jumpQueued=false;jumpPointers.clear();}
  function dispatch(action,k){
    if(!ready())return false;
    if(runtime()!==lastRuntime){reset();lastRuntime=runtime();}
    if(action==='punch'&&contextAction()&&typeof root.interact==='function'){root.interact();return true;}
    if(action==='jump'){jumpQueued=true;return true;}
    return root.TechOpsNightCombat.attack(runtime(),snapshot(k),action);
  }
  function runStep(step,dt,k,j){
    if(!owns()){reset();lastRuntime=null;return step(dt);}
    const n=runtime();if(n!==lastRuntime){reset();lastRuntime=n;}
    if(!ready())reset();
    const saved=['a','d','w','arrowleft','arrowright','arrowup'].map(key=>({key,owned:Object.prototype.hasOwnProperty.call(k,key),value:k[key]}));
    const previous=frameInput;
    frameInput=root.TechOpsNightCombat.normalizeInput(k,j||{});
    try{
      k.a=frameInput.a;k.d=frameInput.d;k.arrowleft=frameInput.arrowleft;k.arrowright=frameInput.arrowright;k.w=false;
      // Up is aim here. Jump has its own edge, so held aim never double-jumps.
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
  function keyDown(e){
    const action=keyMap[e.code];if(!action||!ready()||editable(e.target))return;
    stop(e);if(e.repeat)return;
    dispatch(action);
    if(action==='jump')jumpKey=true;
  }
  function keyUp(e){if(e.code==='Space')jumpKey=false;if(keyMap[e.code]&&ready()&&!editable(e.target))stop(e);}
  function bindButton(button,action,legacy=false){
    if(!button||bound.has(button))return;bound.add(button);
    const press=e=>{
      if(!ready())return;
      if(e.type==='pointerdown'&&e.button>0)return;
      stop(e);
      // Pointer Events own physical presses. Suppress compatibility duplicates.
      if((e.type==='touchstart'||e.type==='mousedown')&&root.PointerEvent)return;
      if(e.type==='click'&&e.detail!==0)return;
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
      style.textContent='#v55-nmbtns[data-night-combat-input="active"]{position:fixed!important;display:grid!important;grid-template-columns:repeat(2,56px);gap:8px;right:max(10px,env(safe-area-inset-right))!important;bottom:max(106px,calc(env(safe-area-inset-bottom) + 106px))!important}#v55-nmbtns[data-night-combat-input="paused"]{display:none!important}#v55-nmbtns .night-input-action[hidden]{display:none!important}#v55-nmbtns .night-input-action{min-width:56px;min-height:44px;cursor:pointer}';
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
      const context=contextAction();punch.textContent=context?'A':'PUNCH';
      punch.setAttribute('aria-label',context==='home'?"Enter Mike's house":context==='charger'?'Open Charger routes':'Directional punch');
      punch.title=context?'E / A interacts':'Aim up: uppercut; aim down: low strike. E punch / J kick / G grab / Space jump.';
    }
    else if(punch&&punch.dataset.nightCombatPunch==='true'){punch.removeAttribute('aria-label');punch.removeAttribute('title');}
    if(!enabled)reset();
  }
  root.TechOpsNightInput={VERSION:2,owns,ready,contextAction,snapshot,dispatch,runStep,sync,reset};
  if(root.addEventListener){
    root.addEventListener('keydown',keyDown,true);root.addEventListener('keyup',keyUp,true);
    root.addEventListener('blur',reset);
  }
  if(root.document){root.document.addEventListener('visibilitychange',()=>{if(root.document.hidden)reset();});sync();}
})(typeof globalThis!=='undefined'?globalThis:this);
