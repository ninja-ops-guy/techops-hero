/* Good Boys gameplay-loop authority v2.
 * Source of truth: approved Good Boys concept sheets supplied by the user.
 * Sheet 3 = moment-to-moment gameplay/HUD; sheet 2 = mechanics/level design;
 * sheet 1 = campaign progression/environment language.
 */
(function(root){
  "use strict";
  if(!root||root.TechOpsGoodBoysGameplayLoop)return;
  var VERSION=2,baseDraw=null,style=null,controls=null;
  var PHASES={
    1:{id:"arrival",label:"ARRIVAL / THE INCIDENT",objective:"Cross the breach. Reach the shuttle.",accent:"#38bdf8",hazard:"pressure",bg:"orbital_gate"},
    2:{id:"traversal",label:"HULL BREACH",objective:"Use boost jumps and two air dashes to cross the transit spine.",accent:"#38bdf8",hazard:"debris",bg:"orbital_gate"},
    3:{id:"infiltration",label:"DETENTION FACILITY",objective:"Infiltrate the station. Keep both dogs together.",accent:"#38bdf8",hazard:"security",bg:"orbital_gate"},
    4:{id:"cell118",label:"CELL 118 — FREE K",objective:"Locate Cell 118. Break the controls. Free K.",accent:"#22c55e",hazard:"hack",bg:"orbital_gate"},
    5:{id:"escort",label:"K SUPPORT ONLINE",objective:"Defend K while he opens the route to Cell 1984.",accent:"#22c55e",hazard:"waves",bg:"orbital_eye"},
    6:{id:"cell1984",label:"CELL 1984 — FREE WALDO",objective:"Break the Warden. Free Waldo.",accent:"#ef4444",hazard:"warden",bg:"orbital_eye"},
    7:{id:"escape",label:"GOOD BOYS PROTOCOL",objective:"Run for the shuttle. Build Sync. Finish together.",accent:"#f59e0b",hazard:"collapse",bg:"orbital_eye"},
    8:{id:"earthfall",label:"EARTHFALL",objective:"Survive reentry and get everyone home.",accent:"#60a5fa",hazard:"reentry",bg:"orbital_gate"}
  };
  var COLORS={katrin:"#22b8ff",manchez:"#ff9f1c",green:"#3cff78",red:"#ff4055",panel:"rgba(2,7,13,.96)",text:"#eef8ff"};
  function cs(){try{return root.NM&&root.NM._v736?root.NM._v736:null;}catch(e){return null;}}
  function active(){return !!cs();}
  function mission(){var c=cs();try{return Math.max(1,Math.min(8,Number(c&&c.m||root.S&&root.S.meta&&root.S.meta._v736&&root.S.meta._v736.m||1)));}catch(e){return 1;}}
  function phase(){return PHASES[mission()]||PHASES[1];}
  function mechanics(){return root.TechOpsGoodBoysReferenceMechanics||null;}
  function activeWho(){var c=cs();return c&&c.active==="manchez"?"manchez":"katrin";}
  function char(who){var c=cs();return c&&c.chars&&c.chars[who]?c.chars[who]:null;}

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
      n._goodBoysLoop=true;n._goodBoysPhase=phase().id;n._goodBoysReferenceScale=1.55;
      c._referenceHud=true;c._referenceLinkedPair=true;
      return true;
    }catch(e){root.__goodBoysLoopError=String(e&&e.stack||e);return false;}
  }

  function ensureStyle(){
    try{
      if(!root.document)return false;
      if(style)return true;style=root.document.getElementById("good-boys-loop-style");if(style)return true;
      style=root.document.createElement("style");style.id="good-boys-loop-style";
      style.textContent="body.good-boys-loop #hud,body.good-boys-loop #quest-tracker,body.good-boys-loop #chaos-banner{display:none!important}body.good-boys-loop #dpad{transform:scale(.78);transform-origin:left bottom;opacity:.9}body.good-boys-loop #touch-buttons{display:none!important}body.good-boys-loop #good-dogs-touch{display:none!important}#good-boys-loop-controls{position:fixed;right:max(10px,calc(env(safe-area-inset-right) + 10px));bottom:max(24px,calc(env(safe-area-inset-bottom) + 24px));z-index:10020;display:none;grid-template-columns:repeat(2,66px);gap:7px;pointer-events:auto}#good-boys-loop-controls button{min-width:66px;min-height:48px;border-radius:12px;background:#05101ddd;color:#eef8ff;font:700 9px monospace;box-shadow:0 0 14px #0008}body.good-boys-loop #good-boys-loop-controls{display:grid}@media(max-width:520px){#good-boys-loop-controls{right:max(8px,calc(env(safe-area-inset-right) + 8px));bottom:max(18px,calc(env(safe-area-inset-bottom) + 18px));grid-template-columns:repeat(2,58px);gap:6px}#good-boys-loop-controls button{min-width:58px;min-height:44px;font-size:7px}body.good-boys-loop #dpad{transform:scale(.72)}}";
      (root.document.head||root.document.documentElement).appendChild(style);return true;
    }catch(e){return false;}
  }

  function button(label,color,fn,id){var b=root.document.createElement("button");b.id=id;b.textContent=label;b.style.border="2px solid "+color;b.addEventListener("pointerdown",function(e){e.preventDefault();e.stopPropagation();try{fn();}catch(_){}},{passive:false});return b;}
  function proxyKey(key){try{var ev=new KeyboardEvent("keydown",{key:key,bubbles:true,cancelable:true});root.dispatchEvent(ev);}catch(e){try{if(root.document)root.document.dispatchEvent(new KeyboardEvent("keydown",{key:key,bubbles:true}));}catch(_){} }}
  function ensureControls(){
    try{
      if(!root.document)return false;if(!controls)controls=root.document.getElementById("good-boys-loop-controls");
      if(!controls){
        controls=root.document.createElement("div");controls.id="good-boys-loop-controls";
        controls.appendChild(button("⚡ DASH","#38bdf8",function(){var m=mechanics();if(!(m&&m.airDash&&m.airDash()))proxyKey("Shift");},"gbl-dash"));
        controls.appendChild(button("🐾 ATTACK","#f59e0b",function(){try{if(typeof root.interact==="function")root.interact();else proxyKey("e");}catch(_){proxyKey("e");}},"gbl-attack"));
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
  function rr(x,a,b,w,h,r){x.beginPath();if(x.roundRect)x.roundRect(a,b,w,h,r);else x.rect(a,b,w,h);}
  function hpValue(who){var c=char(who),n=root.NM;if(who===activeWho()&&n&&isFinite(n.hp))return Math.max(0,n.hp);return Math.max(0,Number(c&&c.hp)||0);}
  function drawBar(x,a,b,w,h,val,max,color){var p=Math.max(0,Math.min(1,val/Math.max(1,max)));x.fillStyle="#071018";x.fillRect(a,b,w,h);x.fillStyle=color;x.fillRect(a+2,b+2,(w-4)*p,h-4);}
  function drawDogCard(x,who,left,W,compact){
    var c=char(who)||{},color=who==="katrin"?COLORS.katrin:COLORS.manchez,name=who.toUpperCase(),cw=compact?132:176,ch=compact?48:56,px=left?8:W-cw-8,py=8,max=c.maxHp||100,hp=hpValue(who);
    x.fillStyle=COLORS.panel;x.strokeStyle=color;x.lineWidth=2;rr(x,px,py,cw,ch,8);x.fill();x.stroke();
    x.fillStyle=color;x.textAlign="left";x.font="bold "+(compact?9:11)+"px monospace";x.fillText(name,px+8,py+14);
    drawBar(x,px+8,py+21,cw-16,10,hp,max,COLORS.red);
    x.fillStyle="#d9edfb";x.font="bold 7px monospace";x.fillText(Math.round(hp)+" / "+max,px+8,py+42);
    if(who===activeWho()){x.textAlign="right";x.fillStyle=color;x.fillText("P1 ACTIVE",px+cw-8,py+42);}
  }
  function drawLinkStatus(x,W,top,compact){
    var c=cs(),sync=Math.max(0,Math.min(100,Number(c&&c.sync)||0)),w=compact?150:210,a=(W-w)/2;
    x.fillStyle="rgba(3,9,13,.95)";x.strokeStyle=sync>=100?COLORS.green:"#4aa9d3";x.lineWidth=1;rr(x,a,top,w,18,5);x.fill();x.stroke();
    x.fillStyle="#17232d";x.fillRect(a+43,top+6,w-51,6);x.fillStyle=sync>=100?COLORS.green:"#38bdf8";x.fillRect(a+43,top+6,(w-51)*(sync/100),6);
    x.fillStyle=sync>=100?COLORS.green:"#dff6ff";x.textAlign="left";x.font="bold 7px monospace";x.fillText(sync>=100?"LINK!":"LINK",a+7,top+12);
  }
  function drawLoopOverlay(x){
    try{
      if(!active())return;var p=phase(),W=x.canvas.width,H=x.canvas.height,compact=W<720;
      x.save();
      /* cover all older co-op HUD layers: this is the concept-art HUD authority */
      x.fillStyle="rgba(1,5,9,.97)";x.fillRect(0,0,W,compact?104:92);
      drawDogCard(x,"katrin",true,W,compact);drawDogCard(x,"manchez",false,W,compact);
      var centerW=Math.min(compact?W-286:360,W*.46),cx=(W-centerW)/2;
      if(centerW>80){x.fillStyle=COLORS.panel;x.strokeStyle=p.accent;x.lineWidth=1;rr(x,cx,8,centerW,compact?48:56,7);x.fill();x.stroke();x.textAlign="center";x.fillStyle=p.accent;x.font="bold "+(compact?8:10)+"px monospace";x.fillText(p.label,W/2,23);x.fillStyle="#e8f5ff";x.font="bold "+(compact?6:8)+"px monospace";x.fillText(p.objective,W/2,40);}
      drawLinkStatus(x,W,compact?73:67,compact);
      var alpha=.055;if(p.hazard==="warden")x.fillStyle="rgba(255,30,40,"+alpha+")";else if(p.hazard==="hack"||p.hazard==="waves")x.fillStyle="rgba(20,255,130,"+alpha+")";else if(p.hazard==="collapse"||p.hazard==="reentry")x.fillStyle="rgba(255,140,30,"+alpha+")";else x.fillStyle="rgba(40,150,255,"+alpha+")";x.fillRect(0,104,W,H-104);
      /* objective plate matches the concept sheet without covering play space */
      var ow=Math.min(W*.72,520),oh=compact?26:30,ox=(W-ow)/2,oy=compact?108:98;x.fillStyle="rgba(2,7,13,.84)";x.strokeStyle=p.accent;rr(x,ox,oy,ow,oh,6);x.fill();x.stroke();x.fillStyle="#e8f5ff";x.textAlign="center";x.font="bold "+(compact?7:8)+"px monospace";x.fillText("OBJECTIVE · "+p.objective,W/2,oy+17);
      x.restore();
    }catch(e){}
  }
  function enforceBackdrop(){try{if(!active()||!root.NM_BG734)return false;var p=phase(),im=root.NM_BG734[p.bg]||root.NM_BG734.orbital_gate;if(im)root.NM_BG734.orbital=im;return !!im;}catch(e){return false;}}
  function installDraw(){
    try{
      if(typeof root.drawNM!=="function"||root.drawNM.__goodBoysGameplayLoop)return false;baseDraw=root.drawNM;
      root.drawNM=function(){var r=baseDraw.apply(this,arguments);try{if(active()&&root.ctx)drawLoopOverlay(root.ctx);}catch(_){}return r;};root.drawNM.__goodBoysGameplayLoop=true;return true;
    }catch(e){return false;}
  }
  function acceptance(){
    var c=cs(),n=root.NM,p=phase();return {active:active(),mission:mission(),phase:p.id,paired:!!(c&&c.chars&&c.chars.katrin&&c.chars.manchez&&c.partner),orbital:!!(n&&((n.district==="orbital")||mission()===8)),playerFinite:!!(n&&isFinite(n.x)&&isFinite(n.y)),sync:Math.round(c&&c.sync||0),hudAuthority:"concept_v2",controls:8,referenceScale:Number(n&&n._goodBoysReferenceScale||0)};
  }
  function tick(){ensureStyle();ensureControls();applyBodyMode();if(active()){repairState();enforceBackdrop();}installDraw();}
  tick();var timer=null;try{timer=root.setInterval(tick,100);}catch(e){}
  root.TechOpsGoodBoysGameplayLoop={VERSION:VERSION,PHASES:PHASES,phase:phase,mission:mission,active:active,repairState:repairState,ensureControls:ensureControls,drawLoopOverlay:drawLoopOverlay,enforceBackdrop:enforceBackdrop,installDraw:installDraw,acceptance:acceptance,tick:tick,timer:timer};
})(typeof globalThis!=="undefined"?globalThis:this);
