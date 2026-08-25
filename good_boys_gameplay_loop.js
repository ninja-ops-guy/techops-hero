/* Good Boys gameplay-loop authority v1.
 * Source of truth: approved Good Boys concept sheets supplied by the user.
 * Sheet 3 = moment-to-moment gameplay/HUD; sheet 2 = mechanics/level design;
 * sheet 1 = campaign progression/environment language.
 */
(function(root){
  "use strict";
  if(!root||root.TechOpsGoodBoysGameplayLoop)return;
  var VERSION=1,baseDraw=null,style=null,controls=null;
  var PHASES={
    1:{id:"arrival",label:"ARRIVAL / THE INCIDENT",objective:"Cross the breach. Reach the shuttle.",accent:"#38bdf8",hazard:"pressure"},
    2:{id:"traversal",label:"HULL BREACH",objective:"Use boost jumps and two air dashes to cross the transit spine.",accent:"#38bdf8",hazard:"debris"},
    3:{id:"infiltration",label:"DETENTION FACILITY",objective:"Infiltrate the station. Keep both dogs together.",accent:"#38bdf8",hazard:"security"},
    4:{id:"cell118",label:"CELL 118 — FREE K",objective:"Locate Cell 118. Break the controls. Free K.",accent:"#22c55e",hazard:"hack"},
    5:{id:"escort",label:"K SUPPORT ONLINE",objective:"Defend K while he opens the route to Cell 1984.",accent:"#22c55e",hazard:"waves"},
    6:{id:"cell1984",label:"CELL 1984 — FREE WALDO",objective:"Break the Warden. Free Waldo.",accent:"#ef4444",hazard:"warden"},
    7:{id:"escape",label:"GOOD BOYS PROTOCOL",objective:"Run for the shuttle. Build Sync. Finish together.",accent:"#f59e0b",hazard:"collapse"},
    8:{id:"earthfall",label:"EARTHFALL",objective:"Survive reentry and get everyone home.",accent:"#60a5fa",hazard:"reentry"}
  };
  function cs(){try{return root.NM&&root.NM._v736?root.NM._v736:null;}catch(e){return null;}}
  function active(){return !!cs();}
  function mission(){var c=cs();try{return Math.max(1,Math.min(8,Number(c&&c.m||root.S&&root.S.meta&&root.S.meta._v736&&root.S.meta._v736.m||1)));}catch(e){return 1;}}
  function phase(){return PHASES[mission()]||PHASES[1];}
  function mechanics(){return root.TechOpsGoodBoysReferenceMechanics||null;}

  function repairState(){
    try{
      var c=cs(),n=root.NM;if(!c||!n)return false;
      c.chars=c.chars||{};
      c.chars.katrin=c.chars.katrin||{hp:100,maxHp:100,stress:0,downed:false,out:false};
      c.chars.manchez=c.chars.manchez||{hp:120,maxHp:120,stress:0,downed:false,out:false};
      c.active=c.active==="manchez"?"manchez":"katrin";
      c.partner=c.partner||{x:(Number(n.x)||180)-62,y:Number(n.y)||260,vx:0,vy:0,w:22,h:34,face:1,onGround:true,jumps:0,cd:0,anim:0};
      if(!isFinite(c.partner.x))c.partner.x=(Number(n.x)||180)-62;
      if(!isFinite(c.partner.y))c.partner.y=Number(n.y)||260;
      if(!isFinite(n.x))n.x=180;if(!isFinite(n.y))n.y=260;
      if(!isFinite(n.vx))n.vx=0;if(!isFinite(n.vy))n.vy=0;
      if(!n.w)n.w=22;if(!n.h)n.h=34;
      n._goodBoysLoop=true;n._goodBoysPhase=phase().id;
      return true;
    }catch(e){root.__goodBoysLoopError=String(e&&e.stack||e);return false;}
  }

  function ensureStyle(){
    try{
      if(!root.document)return false;
      if(style)return true;style=root.document.getElementById("good-boys-loop-style");if(style)return true;
      style=root.document.createElement("style");style.id="good-boys-loop-style";
      style.textContent="body.good-boys-loop #hud,body.good-boys-loop #quest-tracker,body.good-boys-loop #chaos-banner{display:none!important}body.good-boys-loop #dpad{transform:scale(.84);transform-origin:left bottom}body.good-boys-loop #touch-buttons{opacity:.58}body.good-boys-loop #good-dogs-touch{display:none!important}#good-boys-loop-controls{position:fixed;right:max(10px,calc(env(safe-area-inset-right) + 10px));bottom:max(26px,calc(env(safe-area-inset-bottom) + 26px));z-index:10020;display:none;grid-template-columns:repeat(2,66px);gap:7px;pointer-events:auto}#good-boys-loop-controls button{min-width:66px;min-height:48px;border-radius:12px;background:#05101ddd;color:#eef8ff;font:700 9px monospace;box-shadow:0 0 14px #0008}body.good-boys-loop #good-boys-loop-controls{display:grid}@media(max-width:520px){#good-boys-loop-controls{right:max(8px,calc(env(safe-area-inset-right) + 8px));bottom:max(20px,calc(env(safe-area-inset-bottom) + 20px));grid-template-columns:repeat(2,60px)}#good-boys-loop-controls button{min-width:60px;min-height:46px;font-size:8px}}";
      (root.document.head||root.document.documentElement).appendChild(style);return true;
    }catch(e){return false;}
  }

  function button(label,color,fn,id){var b=root.document.createElement("button");b.id=id;b.textContent=label;b.style.border="2px solid "+color;b.addEventListener("pointerdown",function(e){e.preventDefault();e.stopPropagation();try{fn();}catch(_){}},{passive:false});return b;}
  function proxyKey(key){try{var ev=new KeyboardEvent("keydown",{key:key,bubbles:true,cancelable:true});root.dispatchEvent(ev);}catch(e){try{if(root.document)root.document.dispatchEvent(new KeyboardEvent("keydown",{key:key,bubbles:true}));}catch(_){} }}
  function ensureControls(){
    try{
      if(!root.document)return false;if(!controls){controls=root.document.getElementById("good-boys-loop-controls");}
      if(!controls){
        controls=root.document.createElement("div");controls.id="good-boys-loop-controls";
        controls.appendChild(button("⚡ DASH","#38bdf8",function(){var m=mechanics();if(!(m&&m.airDash&&m.airDash()))proxyKey("Shift");},"gbl-dash"));
        controls.appendChild(button("🐾 ATTACK","#f59e0b",function(){proxyKey("e");},"gbl-attack"));
        controls.appendChild(button("🛡 BLOCK","#38bdf8",function(){proxyKey("k");},"gbl-block"));
        controls.appendChild(button("⇄ SWAP","#f59e0b",function(){if(root.v736&&root.v736.swap)root.v736.swap();},"gbl-swap"));
        controls.appendChild(button("⬆ BOOST","#38bdf8",function(){var m=mechanics();if(m&&m.boostJump)m.boostJump();},"gbl-boost"));
        controls.appendChild(button("🤝 THROW","#f59e0b",function(){var m=mechanics();if(m&&m.throwOrCatch)m.throwOrCatch();},"gbl-throw"));
        controls.appendChild(button("🐾 SYNC","#facc15",function(){if(root.v736&&root.v736.finisher)root.v736.finisher();},"gbl-sync"));
        controls.appendChild(button("K SUPPORT","#22c55e",function(){if(mission()>=5&&root.v736&&root.v736.support)root.v736.support();},"gbl-k"));
        root.document.body.appendChild(controls);
      }
      var k=root.document.getElementById("gbl-k");if(k){k.disabled=mission()<5;k.style.opacity=mission()<5?".35":"1";}
      return true;
    }catch(e){return false;}
  }

  function applyBodyMode(){try{if(root.document&&root.document.body)root.document.body.classList.toggle("good-boys-loop",active());return true;}catch(e){return false;}}

  function drawLoopOverlay(x){
    try{
      if(!active())return;var n=root.NM,c=cs(),p=phase(),W=x.canvas.width,H=x.canvas.height,compact=W<720;
      x.save();
      /* concept-art lighting language: blue orbital, green K, red 1984, orange escape */
      var alpha=.055;if(p.hazard==="warden")x.fillStyle="rgba(255,30,40,"+alpha+")";else if(p.hazard==="hack")x.fillStyle="rgba(20,255,130,"+alpha+")";else if(p.hazard==="collapse"||p.hazard==="reentry")x.fillStyle="rgba(255,140,30,"+alpha+")";else x.fillStyle="rgba(40,150,255,"+alpha+")";x.fillRect(0,0,W,H);
      var w=Math.min(compact?W-18:560,W*.78),h=compact?38:42,left=(W-w)/2,top=compact?108:96;
      x.fillStyle="rgba(2,7,13,.88)";x.strokeStyle=p.accent;x.lineWidth=1;x.fillRect(left,top,w,h);x.strokeRect(left+.5,top+.5,w-1,h-1);
      x.textAlign="center";x.fillStyle=p.accent;x.font="bold "+(compact?8:10)+"px monospace";x.fillText(p.label,W/2,top+14);x.fillStyle="#e8f5ff";x.font="bold "+(compact?7:8)+"px monospace";x.fillText(p.objective,W/2,top+29);
      /* linked-pair status anchored under the mission strip */
      var sync=Math.max(0,Math.min(100,Number(c.sync)||0));x.fillStyle="#101820";x.fillRect(left,top+h+4,w,7);x.fillStyle=sync>=100?"#22c55e":"#38bdf8";x.fillRect(left,top+h+4,w*(sync/100),7);
      if(sync>=100){x.fillStyle="#d9ffe5";x.font="bold 7px monospace";x.fillText("SYNC READY — TANDEM FINISHER",W/2,top+h+23);}
      x.restore();
    }catch(e){}
  }

  function installDraw(){
    try{
      if(typeof root.drawNM!=="function"||root.drawNM.__goodBoysGameplayLoop)return false;baseDraw=root.drawNM;
      root.drawNM=function(){var r=baseDraw.apply(this,arguments);try{if(active()&&root.ctx)drawLoopOverlay(root.ctx);}catch(_){}return r;};root.drawNM.__goodBoysGameplayLoop=true;return true;
    }catch(e){return false;}
  }

  function acceptance(){
    var c=cs(),n=root.NM;return {active:active(),mission:mission(),phase:phase().id,paired:!!(c&&c.chars&&c.chars.katrin&&c.chars.manchez&&c.partner),orbital:!!(n&&((n.district==="orbital")||mission()===8)),playerFinite:!!(n&&isFinite(n.x)&&isFinite(n.y)),sync:Math.round(c&&c.sync||0)};
  }
  function tick(){ensureStyle();ensureControls();applyBodyMode();if(active())repairState();installDraw();}
  tick();var timer=null;try{timer=root.setInterval(tick,100);}catch(e){}
  root.TechOpsGoodBoysGameplayLoop={VERSION:VERSION,PHASES:PHASES,phase:phase,mission:mission,active:active,repairState:repairState,ensureControls:ensureControls,drawLoopOverlay:drawLoopOverlay,installDraw:installDraw,acceptance:acceptance,tick:tick,timer:timer};
})(typeof globalThis!=="undefined"?globalThis:this);
