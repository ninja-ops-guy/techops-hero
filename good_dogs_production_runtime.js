/* TechOps Hero — production Good Dogs co-op authority v3.
 * Reference lock: user-supplied Katrin/Manchez sheets + Good Dogs Protocol UI direction.
 * Goals:
 *  - the 118/1984 side story always plays as Katrin + Manchez;
 *  - no Mike/Night Walker body or generic Downtown intro survives campaign entry;
 *  - locomotion uses neutral dog frames only; actions use matching authored frames;
 *  - mobile HUD reads as a two-character co-op game, not the Day Shift HUD;
 *  - blue Katrin / amber Manchez visual language remains consistent.
 *
 * v3: production rendering is compositor-owned. This module exports its HUD
 * callback and installs its non-render authorities once, but never wraps drawNM
 * or starts wrapper-maintenance intervals when the production compositor exists.
 */
(function(root){
  "use strict";
  if (!root || root.TechOpsGoodDogsProduction) return;
  var VERSION = 3;
  var gdImage = null;
  var starting = false;
  var baseEnterNight = null;
  var baseNightPlayer = null;
  var baseDrawNM = null;
  var hudStyle = null;

  var COLORS={
    katrin:"#22b8ff", manchez:"#ff9f1c", green:"#3cff78", red:"#ff4055",
    bg:"rgba(4,8,14,.90)", line:"rgba(120,210,255,.28)", text:"#eff8ff"
  };

  function productionCompositorActive(){try{return !!(root.TechOpsProductionWrapperGuard||root.__productionSingleCompositor||root.__productionCompositorPlanned);}catch(e){return false;}}
  function atlas(){ return root.KATRIN_MANCHEZ || null; }
  function atlasReady(){
    try{
      var A=atlas(); if(!A||!A.src||!A.frames||typeof root.Image!=="function") return null;
      if(!gdImage){gdImage=new root.Image();gdImage.src=A.src;}
      return gdImage.complete&&gdImage.naturalWidth?gdImage:null;
    }catch(e){return null;}
  }
  function campaign(){ try{return root.NM&&root.NM._v736?root.NM._v736:null;}catch(e){return null;} }
  function activeWho(){ var cs=campaign(); return cs&&cs.active==="manchez"?"manchez":"katrin"; }
  function partnerWho(){ return activeWho()==="katrin"?"manchez":"katrin"; }
  function charState(who){var cs=campaign();return cs&&cs.chars&&cs.chars[who]?cs.chars[who]:null;}

  function conservativeFrame(who,NM,now){
    var p=who==="manchez"?"man_":"kat_", A=atlas(), has=function(k){return !!(A&&A.frames&&A.frames[k]);};
    if(!NM||NM.hp<=0) return p+"down";
    if(NM.ifr>0&&has(p+"wall_hit")) return p+"wall_hit";
    if(NM.dashT>0&&has(p+"roll")) return p+"roll";
    if(NM.jabAnim>0){
      if(NM.jabStage===2&&has(p+"strike")) return p+"strike";
      return has(p+"pounce")?p+"pounce":p+"strike";
    }
    if(NM.block&&has(p+"shield")) return p+"shield";
    if(!NM.onGround&&has(p+"leap")) return p+"leap";
    /* Reference rule: never substitute attack/crouch/knockdown art for walk.
       The recovered sheet has no authored walk row, so use the two clean side-neutral poses. */
    if(Math.abs(NM.vx||0)>.45) return p+((Math.floor((now||0)/145)%2)?"idle1":"idle0");
    return p+((Math.floor((now||0)/720)%2)?"idle1":"idle0");
  }

  function drawDogFrame(x,key,cx,base,h,flip,alpha){
    try{
      var A=atlas(),img=atlasReady(),fr=A&&A.frames&&A.frames[key];
      if(!img||!fr||fr.length<4)return false;
      var dw=h*(fr[2]/fr[3]);
      x.save();x.imageSmoothingEnabled=false;x.globalAlpha=alpha==null?1:alpha;
      x.save();x.globalAlpha*=.30;x.fillStyle="#000";x.beginPath();x.ellipse(cx,base-2,Math.max(18,dw*.31),5.5,0,0,Math.PI*2);x.fill();x.restore();
      if(flip){x.translate(cx,0);x.scale(-1,1);x.drawImage(img,fr[0],fr[1],fr[2],fr[3],-dw/2,base-h,dw,h);}else{x.drawImage(img,fr[0],fr[1],fr[2],fr[3],cx-dw/2,base-h,dw,h);}
      x.restore();return true;
    }catch(e){return false;}
  }

  function drawActiveDog(x,NM,px,py,now){
    var cs=campaign();if(!cs||!cs.active)return false;
    var who=activeWho(),c=cs.chars&&cs.chars[who];if(c&&c.downed)return false;
    /* Reference scale: dogs should read as the heroes, not tiny pets under the HUD. */
    var h=Math.max(78,(NM.h||34)*2.30),cx=px+(NM.w||22)/2,base=py+(NM.h||34)+7;
    return drawDogFrame(x,conservativeFrame(who,NM,now||0),cx,base,h,(NM.face||1)<0,1);
  }

  function normalizePartnerIdleFrames(){
    try{
      var A=atlas();if(!A||!A.frames)return false;
      ["kat","man"].forEach(function(p){var a=A.frames[p+"_idle0"],b=A.frames[p+"_idle1"]||a;if(!a)return;for(var i=2;i<7;i++)A.frames[p+"_idle"+i]=(i%2?b:a);});
      return true;
    }catch(e){return false;}
  }

  function markStarting(){starting=true;root.__TECHOPS_GOOD_DOGS_STARTING=true;}
  function isStarting(){return !!(starting||root.__TECHOPS_GOOD_DOGS_STARTING);}

  function installEntryFix(){
    try{
      if(typeof root.enterNight!=="function"||root.enterNight.__goodDogsProduction)return false;
      baseEnterNight=root.enterNight;
      root.enterNight=function(){
        if(!isStarting())return baseEnterNight.apply(this,arguments);
        var r=baseEnterNight.apply(this,arguments);
        try{if(root.v722&&typeof root.v722.active==="function"&&root.v722.active()&&typeof root.v722.skip==="function")root.v722.skip();}catch(e){}
        starting=false;root.__TECHOPS_GOOD_DOGS_STARTING=false;
        return r;
      };
      root.enterNight.__goodDogsProduction=true;return true;
    }catch(e){return false;}
  }

  function installStartCapture(){
    try{
      if(root.document&&!root.document.__goodDogsStartCapture){
        root.document.addEventListener("click",function(e){try{var t=e.target&&e.target.closest?e.target.closest("#btn-v736"):null;if(t)markStarting();}catch(_){}},true);
        root.document.__goodDogsStartCapture=true;
      }
      if(root.v736&&typeof root.v736.start==="function"&&!root.v736.start.__goodDogsProduction){var s=root.v736.start;root.v736.start=function(){markStarting();return s.apply(this,arguments);};root.v736.start.__goodDogsProduction=true;}
      return true;
    }catch(e){return false;}
  }

  function installPlayerAuthority(){
    try{
      if(typeof root.drawNightPlayerAtlas!=="function"||root.drawNightPlayerAtlas.__goodDogsProduction)return false;
      baseNightPlayer=root.drawNightPlayerAtlas;
      root.drawNightPlayerAtlas=function(x,NM,px,py,now){if(NM&&NM._v736){if(drawActiveDog(x,NM,px,py,now))return true;return false;}return baseNightPlayer.apply(this,arguments);};
      root.drawNightPlayerAtlas.__goodDogsProduction=true;return true;
    }catch(e){return false;}
  }

  function roundRect(x,px,py,w,h,r,fill,stroke){
    x.beginPath();if(x.roundRect)x.roundRect(px,py,w,h,r);else{x.rect(px,py,w,h);}if(fill)x.fill();if(stroke)x.stroke();
  }
  function bar(x,px,py,w,h,val,max,color){
    var p=Math.max(0,Math.min(1,(Number(val)||0)/Math.max(1,Number(max)||1)));
    x.fillStyle="rgba(0,0,0,.65)";roundRect(x,px,py,w,h,3,true,false);
    x.fillStyle=color;roundRect(x,px+2,py+2,(w-4)*p,h-4,2,true,false);
  }
  function dogPortrait(x,who,px,py,size){
    var p=who==="manchez"?"man_":"kat_",key=p+"idle0",A=atlas(),img=atlasReady(),fr=A&&A.frames&&A.frames[key];
    x.save();x.fillStyle=who==="katrin"?"#071b2b":"#2a1605";roundRect(x,px,py,size,size,8,true,false);
    x.strokeStyle=who==="katrin"?COLORS.katrin:COLORS.manchez;x.lineWidth=2;roundRect(x,px,py,size,size,8,false,true);
    if(img&&fr){var pad=3;x.drawImage(img,fr[0],fr[1],fr[2],fr[3],px+pad,py+pad,size-pad*2,size-pad*2);}x.restore();
  }

  function drawReferenceHUD(x,NM){
    var cs=campaign();if(!cs)return;
    var W=(root.cv&&root.cv.width)||x.canvas.width,H=(root.cv&&root.cv.height)||x.canvas.height;
    var compact=W<700,pad=compact?10:16,cardW=compact?Math.min(150,(W-34)/2):188,cardH=compact?55:64;
    function card(who,left){
      var c=charState(who)||{},color=who==="katrin"?COLORS.katrin:COLORS.manchez,name=who.toUpperCase();
      var px=left?pad:W-pad-cardW,py=pad+4,portrait=cardH-10;
      x.save();x.fillStyle=COLORS.bg;x.strokeStyle=color;x.lineWidth=2;roundRect(x,px,py,cardW,cardH,9,true,true);
      dogPortrait(x,who,px+5,py+5,portrait);
      x.fillStyle=color;x.font="bold "+(compact?10:12)+"px monospace";x.textAlign="left";x.fillText(name,px+portrait+12,py+17);
      var hp=(who===activeWho()&&NM)?NM.hp:(c.hp==null?100:c.hp),mx=c.maxHp||100;
      bar(x,px+portrait+12,py+26,cardW-portrait-20,10,hp,mx,COLORS.red);
      x.fillStyle="#cfe8ff";x.font="bold 8px monospace";x.fillText(Math.max(0,Math.round(hp))+" / "+mx,px+portrait+12,py+49);
      if(who===activeWho()){x.fillStyle=color;x.font="bold 8px monospace";x.textAlign="right";x.fillText("ACTIVE",px+cardW-8,py+49);}x.restore();
    }
    card("katrin",true);card("manchez",false);

    var titleW=Math.min(compact?210:360,W*.46),tx=(W-titleW)/2,ty=pad+6;
    x.save();x.fillStyle="rgba(3,8,12,.86)";x.strokeStyle="rgba(60,255,120,.45)";x.lineWidth=1;roundRect(x,tx,ty,titleW,compact?40:48,7,true,true);
    x.fillStyle=COLORS.green;x.textAlign="center";x.font="bold "+(compact?9:11)+"px monospace";x.fillText("GOOD DOGS PROTOCOL",W/2,ty+15);
    x.fillStyle="#d8fce5";x.font="bold "+(compact?7:9)+"px monospace";var mission=(cs.m||1);x.fillText("118 / 1984  ·  MISSION "+mission,W/2,ty+30);x.restore();

    var sync=Math.max(0,Math.min(100,Number(cs.sync)||0)),sw=Math.min(220,W*.42),sx=(W-sw)/2,sy=H-(compact?46:54);
    x.save();x.fillStyle="rgba(2,8,10,.87)";x.strokeStyle=sync>=100?COLORS.green:"#38779a";roundRect(x,sx,sy,sw,24,6,true,true);bar(x,sx+48,sy+7,sw-58,10,sync,100,sync>=100?COLORS.green:"#44c9ff");x.fillStyle=sync>=100?COLORS.green:"#dcefff";x.textAlign="left";x.font="bold 8px monospace";x.fillText(sync>=100?"SYNC!":"SYNC",sx+8,sy+16);x.restore();
  }

  function installHudAuthority(){
    try{
      if(productionCompositorActive())return false;
      if(typeof root.drawNM!=="function"||root.drawNM.__goodDogsHud)return false;
      baseDrawNM=root.drawNM;
      root.drawNM=function(){var r=baseDrawNM.apply(this,arguments);try{if(campaign()&&root.ctx&&root.NM)drawReferenceHUD(root.ctx,root.NM);}catch(e){}return r;};
      root.drawNM.__goodDogsHud=true;return true;
    }catch(e){return false;}
  }

  function ensureCampaignCss(){
    try{
      if(!root.document)return false;
      if(!hudStyle){hudStyle=root.document.getElementById("good-dogs-reference-style");if(!hudStyle){hudStyle=root.document.createElement("style");hudStyle.id="good-dogs-reference-style";hudStyle.textContent="body.good-dogs-active #hud{display:none!important}body.good-dogs-active #quest-tracker{display:none!important}body.good-dogs-active #touch-buttons{opacity:.88}body.good-dogs-active #dpad{transform:scale(.88);transform-origin:left bottom}";(root.document.head||root.document.documentElement).appendChild(hudStyle);}}
      var on=!!campaign();if(root.document.body)root.document.body.classList.toggle("good-dogs-active",on);return true;
    }catch(e){return false;}
  }

  function ensureMobileControls(){
    try{
      if(!root.document)return false;
      var id="good-dogs-touch",box=root.document.getElementById(id),on=!!campaign();
      if(!box){
        box=root.document.createElement("div");box.id=id;box.style.cssText="position:fixed;right:max(12px,calc(env(safe-area-inset-right) + 12px));bottom:max(88px,calc(env(safe-area-inset-bottom) + 88px));z-index:9998;display:none;grid-template-columns:repeat(2,64px);gap:7px;pointer-events:auto";
        function b(label,color,fn){var el=root.document.createElement("button");el.textContent=label;el.style.cssText="min-width:64px;min-height:48px;border:2px solid "+color+";border-radius:11px;background:#06101ddd;color:#eef9ff;font:bold 9px monospace;box-shadow:0 0 12px "+color+"55";el.addEventListener("pointerdown",function(ev){ev.preventDefault();ev.stopPropagation();try{fn();}catch(_){}},{passive:false});return el;}
        box.appendChild(b("⇄ SWAP",COLORS.katrin,function(){if(root.v736&&root.v736.swap)root.v736.swap();}));
        box.appendChild(b("SYNC",COLORS.manchez,function(){if(root.v736&&root.v736.finisher)root.v736.finisher();}));
        box.appendChild(b("K SUPPORT",COLORS.green,function(){if(root.v736&&root.v736.support)root.v736.support();}));
        root.document.body.appendChild(box);
      }
      box.style.display=on?"grid":"none";return true;
    }catch(e){return false;}
  }

  function tick(){normalizePartnerIdleFrames();installStartCapture();installEntryFix();installPlayerAuthority();installHudAuthority();ensureCampaignCss();ensureMobileControls();}
  tick();var timer=null;try{if(!productionCompositorActive())timer=root.setInterval(tick,300);}catch(e){}
  root.TechOpsGoodDogsProduction={VERSION:VERSION,COLORS:COLORS,productionCompositorActive:productionCompositorActive,atlasReady:atlasReady,conservativeFrame:conservativeFrame,drawActiveDog:drawActiveDog,drawReferenceHUD:drawReferenceHUD,normalizePartnerIdleFrames:normalizePartnerIdleFrames,markStarting:markStarting,installEntryFix:installEntryFix,installStartCapture:installStartCapture,installPlayerAuthority:installPlayerAuthority,installHudAuthority:installHudAuthority,ensureCampaignCss:ensureCampaignCss,ensureMobileControls:ensureMobileControls,tick:tick,timer:timer};
})(typeof globalThis!=="undefined"?globalThis:this);