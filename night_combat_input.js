/* Canonical input adapter for ordinary Night Crawler only.
 * v55's existing frame bridge calls runStep; its existing draw calls sync.
 * This module owns input/controls, not a simulation timer, damage or a renderer.
 */
(function(root){
  'use strict';
  if(root.TechOpsNightInput)return;
  let frameInput=null,jumpKey=false,jumpQueued=false,lastRuntime=null;
  let keyboardHorizontal=0,stickHorizontal=0,lastTap=null,shiftHeld=false,assistControls=false;
  const jumpPointers=new Set(),bound=new WeakSet();
  const directionTaps=[],directionHeld=new Set();
  const directionCodes={KeyA:-1,ArrowLeft:-1,KeyD:1,ArrowRight:1};
  const keyMap={KeyE:'punch',Enter:'punch',KeyJ:'kick',KeyG:'grab',Space:'jump',ShiftLeft:'dash',ShiftRight:'dash'};
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
    const travel=root.TechOpsNightTravel;if(travel){if(travel.doorway(n))return 'door';return travel.nearCar(n)?'charger':null;}
    const car=typeof NM_CAR_X==='number'?NM_CAR_X:26;
    if(n.x<car+150&&!(n.enemies||[]).some(e=>e.alive&&Math.abs(e.x-n.x)<90))return 'charger';
    return null;
  }
  function snapshot(k){return frameInput||root.TechOpsNightCombat.normalizeInput(k||keyboard(),joystick());}
  function inputTime(){return root.performance&&root.performance.now?root.performance.now():Date.now();}
  function reset(){jumpKey=false;jumpQueued=false;jumpPointers.clear();directionTaps.length=0;directionHeld.clear();keyboardHorizontal=0;stickHorizontal=0;lastTap=null;shiftHeld=false;const c=runtime()?._nightCombat;if(c)c.dash=null;}
  function dispatch(action,k){
    if(!ready())return false;
    if(runtime()!==lastRuntime){reset();lastRuntime=runtime();}
    if(action==='punch'&&contextAction()&&typeof root.interact==='function'){root.interact();return true;}
    if(action==='jump'){jumpQueued=true;return true;}
    if(action==='dash')return root.TechOpsNightCombat.dash(runtime(),runtime().face||1);
    return root.TechOpsNightCombat.attack(runtime(),snapshot(k),action);
  }
  function movementGesture(n,k,j){
    if(!ready()){keyboardHorizontal=0;stickHorizontal=0;lastTap=null;shiftHeld=false;return;}
    const combat=root.TechOpsNightCombat;
    function tap(dir,source,at){
      if(lastTap&&lastTap.dir===dir&&lastTap.source===source&&at>=lastTap.at&&at-lastTap.at<=combat.RULES.doubleTap){combat.dash(n,dir);lastTap=null;}
      else lastTap={dir,at,source};
    }
    // Preserve keyboard presses that begin and end between two render frames.
    const queued=directionTaps.splice(0);
    for(const press of queued)if(press.opposed)lastTap=null;else tap(press.dir,'keyboard',press.at);
    // A neutral release separates taps. Analog sticks use hysteresis so small
    // threshold jitter cannot count as a second deliberate flick.
    const left=!!(k.a||k.arrowleft),right=!!(k.d||k.arrowright),digital=left||right;
    const kd=left===right?0:left?-1:1,v=Number(j&&j.x)||0;
    const sd=Math.abs(v)>=.65?Math.sign(v):Math.abs(v)<=.2?0:stickHorizontal;
    const source=digital?'keyboard':'stick',dir=digital?kd:sd;
    const edge=digital?kd!==keyboardHorizontal:sd!==stickHorizontal;
    keyboardHorizontal=kd;stickHorizontal=sd;
    const opposed=left&&right||digital&&v*kd<-.3;
    if(opposed)lastTap=null;
    else if(dir&&edge&&!(digital&&queued.length))tap(dir,source,inputTime());
    if(k.shift&&!shiftHeld)combat.dash(n,n.face||1);
    shiftHeld=!!k.shift;
  }
  function runStep(step,dt,k,j){
    if(!owns()){reset();lastRuntime=null;return step(dt);}
    const n=runtime();if(n!==lastRuntime){reset();lastRuntime=n;}
    if(n.drive){reset();return step(dt);}
    if(!ready())reset();
    movementGesture(n,k,j||{});
    const saved=['a','d','w','arrowleft','arrowright','arrowup','shift'].map(key=>({key,owned:Object.prototype.hasOwnProperty.call(k,key),value:k[key]}));
    const previous=frameInput;
    frameInput=root.TechOpsNightCombat.normalizeInput(k,j||{});
    try{
      k.a=frameInput.a;k.d=frameInput.d;k.arrowleft=frameInput.arrowleft;k.arrowright=frameInput.arrowright;k.w=false;k.shift=false;
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
    if(directionCodes[e.code]&&ready()&&!editable(e.target)&&!e.repeat){
      if(runtime()!==lastRuntime){reset();lastRuntime=runtime();}
      const dir=directionCodes[e.code],k=keyboard(),j=joystick();
      // A/Left and D/Right are aliases of one logical direction. Pressing an
      // alias while its partner is held is not a release-and-press gesture.
      const held=Array.from(directionHeld).some(code=>directionCodes[code]===dir);
      const opposed=Array.from(directionHeld).some(code=>directionCodes[code]===-dir)||(dir<0?!!(k.d||k.arrowright||j.x>.3):!!(k.a||k.arrowleft||j.x<-.3));
      directionHeld.add(e.code);
      if(!held)directionTaps.push({dir,at:inputTime(),opposed});
      if(directionTaps.length>8)directionTaps.shift();
    }
    const action=keyMap[e.code];if(!action||!ready()||editable(e.target))return;
    stop(e);if(e.repeat)return;
    dispatch(action);
    if(action==='jump')jumpKey=true;
  }
  function keyUp(e){directionHeld.delete(e.code);if(e.code==='Space')jumpKey=false;if(keyMap[e.code]&&ready()&&!editable(e.target))stop(e);}
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
      style.textContent='#v55-nmbtns[data-night-combat-input="active"]{position:fixed!important;display:grid!important;grid-template-columns:repeat(2,56px);gap:8px;right:max(10px,env(safe-area-inset-right))!important;bottom:max(164px,calc(env(safe-area-inset-bottom) + 164px))!important;pointer-events:none}#v55-nmbtns[data-night-combat-input="active"]>.v55-nbtn{pointer-events:auto}@media(max-height:480px) and (min-width:650px){#v55-nmbtns[data-night-combat-input="active"]{grid-template-columns:repeat(3,56px)}}#v55-nmbtns[data-night-combat-input="paused"]{display:none!important}#v55-nmbtns .v55-nbtn[hidden]{display:none!important}#v55-nmbtns .night-input-action{min-width:56px;min-height:44px;cursor:pointer}';
      (doc.head||doc.documentElement).appendChild(style);
    }
    const active=owns(),enabled=ready();
    for(const b of doc.querySelectorAll?doc.querySelectorAll('#dpad .d-left, #dpad .d-right'):[]){
      if(bound.has(b))continue;bound.add(b);
      b.addEventListener('dblclick',e=>{if(!ready())return;stop(e);root.TechOpsNightCombat.dash(runtime(),Number(b.dataset.dx)<0?-1:1);});
    }
    if(active)box.dataset.nightCombatInput=enabled?'active':'paused';else delete box.dataset.nightCombatInput;
    for(const action of ['grab','kick','jump']){
      const id='night-input-'+action;let b=doc.getElementById(id);
      if(!b){b=doc.createElement('button');b.id=id;b.type='button';b.className='v55-nbtn night-input-action';b.textContent=action.toUpperCase();b.setAttribute('aria-label',action==='grab'?'Grab or throw enemy':action==='kick'?'Directional kick':'Jump');box.appendChild(b);bindButton(b,action);}
      b.hidden=!active||(action==='grab'&&!assistControls);b.disabled=!enabled;
    }
    const dash=Array.from(box.children).find(b=>/DASH/.test(b.textContent||'')&&!b.id);
    if(dash){bindButton(dash,'dash');dash.hidden=active&&!assistControls;}
    let more=doc.getElementById('night-input-assists');
    if(!more){more=doc.createElement('button');more.id='night-input-assists';more.type='button';more.className='v55-nbtn night-input-action';more.textContent='MORE';more.setAttribute('aria-label','Show optional dash and grab buttons');more.addEventListener('click',()=>{assistControls=!assistControls;sync();});box.appendChild(more);}
    more.hidden=!active;more.disabled=!enabled;more.setAttribute('aria-expanded',String(assistControls));
    const punch=doc.getElementById('tb-interact');bindButton(punch,'punch',true);
    if(active&&punch){
      const context=contextAction();punch.textContent=context?'A':'PUNCH';
      punch.setAttribute('aria-label',context==='home'?"Enter Mike's house":context==='charger'?'Open Charger routes':context==='door'?'Use building door':'Directional punch');
      punch.title=context?'E / A interacts':'Double-tap left/right to dash; attack after dash to grab. Up/down aims attacks and throws. E punch / J kick / Space jump. More: optional dash and grab buttons.';
    }
    else if(punch&&punch.dataset.nightCombatPunch==='true'){punch.removeAttribute('aria-label');punch.removeAttribute('title');}
    if(!enabled)reset();
  }
  root.TechOpsNightInput={VERSION:4,owns,ready,contextAction,snapshot,dispatch,runStep,sync,reset};
  if(root.addEventListener){
    root.addEventListener('keydown',keyDown,true);root.addEventListener('keyup',keyUp,true);
    root.addEventListener('blur',reset);
  }
  if(root.document){root.document.addEventListener('visibilitychange',()=>{if(root.document.hidden)reset();});sync();}
})(typeof globalThis!=='undefined'?globalThis:this);
