/* Good Boys canon runtime — production authority v4.
 * Canon: music-video orbital incident + approved Good Boys gameplay concept.
 * Fixes legacy title copy, M1 premise, async Night runtime handoff, district
 * leakage, Day Shift HUD leakage, and keeps the 118/1984 loop orbital-first.
 */
(function(root){
  "use strict";
  if(!root||root.TechOpsGoodBoysCanon)return;
  var VERSION=4,chain=false,baseLoad=null,basePlay=null,baseDraw=null;
  var SEQ={
    1:{name:"THE INCIDENT",objective:"STAY TOGETHER · CROSS THE BREACH · REACH THE SHUTTLE",zone:"ORBITAL COMMAND RING",bg:"orbital_gate",light:"pressure_blue"},
    2:{name:"HULL BREACH",objective:"BOOST · AIR DASH · REACH THE MAINTENANCE SHUTTLE",zone:"SHATTERED TRANSIT SPINE",bg:"orbital_gate",light:"pressure_blue"},
    3:{name:"DETENTION RING",objective:"INFILTRATE THE ORBITAL DETENTION FACILITY",zone:"ORBITAL DETENTION",bg:"orbital_gate",light:"detention_blue"},
    4:{name:"CELL 118",objective:"LOCATE CELL 118 · BREAK THE CONTROLS · FREE K",zone:"PRISON BLOCK 118",bg:"orbital_gate",light:"cell118_blue"},
    5:{name:"ACCESS GRANTED",objective:"DEFEND K WHILE HE OPENS THE ROUTE",zone:"ORPHEUS ACCESS CORE",bg:"orbital_eye",light:"hack_green"},
    6:{name:"CELL 1984",objective:"FREE WALDO · BREAK THE WARDEN",zone:"SURVEILLANCE BLOCK 1984",bg:"orbital_eye",light:"emergency_red"},
    7:{name:"GOOD BOYS PROTOCOL",objective:"RUN FOR THE SHUTTLE · TANDEM FINISHER",zone:"COLLAPSING DETENTION RING",bg:"orbital_eye",light:"explosion_orange"},
    8:{name:"EARTHFALL",objective:"GET K · WALDO · KATRIN · MANCHEZ HOME",zone:"MAINTENANCE SHUTTLE",bg:"orbital_gate",light:"earthfall_blue"}
  };
  function cs(){try{return root.NM&&root.NM._v736?root.NM._v736:null;}catch(e){return null;}}
  function meta(){try{return root.S&&root.S.meta&&root.S.meta._v736?root.S.meta._v736:null;}catch(e){return null;}}
  function mission(){var c=cs(),m=c&&c.m||meta()&&meta().m||1;return Math.max(1,Math.min(8,Number(m)||1));}
  function active(){return !!cs();}
  function latch(){chain=true;root.__TECHOPS_GOOD_BOYS_CANON_CHAIN=true;}
  function isChain(){return !!(chain||root.__TECHOPS_GOOD_BOYS_CANON_CHAIN||active());}
  function canonical(){return SEQ[mission()]||SEQ[1];}

  function cleanTitle(){
    try{
      if(!root.document)return false;
      var ts=root.document.getElementById("title-screen");if(!ts)return false;
      var all=ts.querySelectorAll("button,a,div,span,p");
      for(var i=0;i<all.length;i++){
        var el=all[i],t=(el.textContent||"").replace(/\s+/g," ").trim().toLowerCase();
        if(t.indexOf("play as mike instead")>=0){el.style.setProperty("display","none","important");el.setAttribute("aria-hidden","true");}
      }
      return true;
    }catch(e){return false;}
  }

  function installStartAuthority(){
    try{
      if(!root.v736||typeof root.v736.start!=="function"||root.v736.start.__goodBoysCanon)return false;
      var start=root.v736.start;
      root.v736.start=function(){latch();return start.apply(this,arguments);};
      root.v736.start.__goodBoysCanon=true;return true;
    }catch(e){return false;}
  }

  function installDistrictAuthority(){
    try{
      if(typeof root.nmLoadDistrict!=="function"||root.nmLoadDistrict.__goodBoysCanon)return false;
      baseLoad=root.nmLoadDistrict;
      root.nmLoadDistrict=function(id){
        var requested=id;if(isChain()&&mission()<=7)id="orbital";
        var r=baseLoad.call(this,id);
        try{if(isChain()&&root.NM&&mission()<=7){root.NM.district="orbital";root.NM._goodBoysRequestedDistrict=requested;root.NM._goodBoysCanonDistrict="orbital";}}catch(_){}
        return r;
      };
      root.nmLoadDistrict.__goodBoysCanon=true;return true;
    }catch(e){return false;}
  }

  function closeLegacyDialog(){
    try{
      if(root.S)root.S.inDialog=false;
      var d=root.document&&root.document.getElementById("dialogue");if(d)d.classList.add("hidden");
    }catch(e){}
  }

  /* startCombat736 assumes enterNight() has produced NM synchronously. On mobile,
     that assumption is false in several paths. Prime the Night runtime first,
     then invoke the original mission callback only after NM exists. */
  function prepareNightRuntime(cb){
    var tries=0,maxTries=80;
    function ready(){
      closeLegacyDialog();
      if(root.NM){try{if(cb)cb();}catch(e){root.__goodBoysHandoffError=String(e&&e.stack||e);}return;}
      if(++tries>=maxTries){root.__goodBoysCoreBroken="night_runtime_timeout";return;}
      try{(root.setTimeout||setTimeout)(ready,25);}catch(e){root.__goodBoysCoreBroken="night_runtime_timer_failed";}
    }
    try{
      if(!root.NM&&typeof root.enterNight==="function")root.enterNight();
      try{if(root.v722&&typeof root.v722.active==="function"&&root.v722.active()&&typeof root.v722.skip==="function")root.v722.skip();}catch(_){}
    }catch(e){root.__goodBoysHandoffError=String(e&&e.stack||e);}
    ready();
  }

  function showIncidentIntro(cb){
    try{
      if(!root.document){prepareNightRuntime(cb);return true;}
      var old=root.document.getElementById("good-boys-incident-intro");if(old)old.remove();
      closeLegacyDialog();
      var o=root.document.createElement("div");o.id="good-boys-incident-intro";
      o.style.cssText="position:fixed;inset:0;z-index:100000;background:radial-gradient(circle at 50% 25%,#0e2940 0,#060a12 38%,#010307 100%);display:flex;align-items:flex-end;justify-content:center;padding:max(18px,env(safe-area-inset-bottom)) 14px;color:#eef8ff;font-family:monospace";
      o.innerHTML='<div style="width:min(680px,96vw);margin-bottom:4vh;background:#050914f2;border:2px solid #39bdf8;border-radius:14px;padding:18px;box-shadow:0 0 30px #0ea5e955"><div style="color:#f4c75b;font:700 22px monospace;line-height:1.05">GOOD BOYS PROTOCOL — THE INCIDENT</div><p style="font-size:16px;line-height:1.55;margin:14px 0">Katrin and Manchez are already aboard an orbital installation when the structure tears open around them.</p><p style="font-size:16px;line-height:1.55;margin:0 0 14px">Pressure alarms. Broken glass. Failing gravity. The maintenance route is collapsing.</p><div style="font-weight:700;font-size:16px;margin:14px 0">Stay together. Cross the breach. Reach the shuttle.</div><div style="color:#9fb5c9;font-size:13px;line-height:1.45">BOOST JUMP ×3 · AIR DASH ×2 · PARTNER THROW/CATCH · SWAP · SYNC</div><button id="good-boys-begin" style="width:100%;min-height:54px;margin-top:18px;border:2px solid #38bdf8;border-radius:10px;background:#0a1726;color:#e9f8ff;font:700 15px monospace">BEGIN THE INCIDENT</button></div>';
      root.document.body.appendChild(o);
      var done=false,go=function(ev){if(ev){ev.preventDefault();ev.stopPropagation();}if(done)return;done=true;try{o.remove();}catch(_){}closeLegacyDialog();prepareNightRuntime(cb);};
      var b=root.document.getElementById("good-boys-begin");if(b){b.addEventListener("pointerdown",go,{once:true});b.addEventListener("click",go,{once:true});}
      return true;
    }catch(e){root.__goodBoysIntroError=String(e&&e.stack||e);prepareNightRuntime(cb);return false;}
  }

  function installOpeningAuthority(){
    try{
      if(!root.v725||typeof root.v725.play!=="function"||root.v725.play.__goodBoysCanon)return false;
      basePlay=root.v725.play;
      root.v725.play=function(id,cb){if(id!=="b736m1")return basePlay.apply(this,arguments);latch();return showIncidentIntro(cb);};
      root.v725.play.__goodBoysCanon=true;return true;
    }catch(e){return false;}
  }

  function hideLegacyUi(){
    try{
      if(!root.document)return false;var on=isChain(),ids=["hud","quest-tracker","chaos-banner","btn-twin","btn-sweep","btn-music"];
      ids.forEach(function(id){var el=root.document.getElementById(id);if(!el)return;if(on){if(el.dataset.gbCanonDisplay===undefined)el.dataset.gbCanonDisplay=el.style.display||"";el.style.setProperty("display","none","important");}else if(el.dataset.gbCanonDisplay!==undefined){el.style.display=el.dataset.gbCanonDisplay;delete el.dataset.gbCanonDisplay;}});
      if(root.document.body)root.document.body.classList.toggle("good-boys-canon",on);return true;
    }catch(e){return false;}
  }

  function enforceBackground(){
    try{
      if(!active()||!root.NM_BG734)return false;var cfg=canonical(),im=root.NM_BG734[cfg.bg]||root.NM_BG734.orbital_gate;if(!im)return false;
      root.NM_BG734.orbital=im;return true;
    }catch(e){return false;}
  }

  function drawHud(x){
    try{
      var c=cs();if(!c)return;var W=x.canvas.width,cfg=canonical(),compact=W<760;
      x.save();
      var stripY=compact?76:68,stripH=compact?36:32;
      x.fillStyle="rgba(1,5,9,.86)";x.fillRect(Math.max(6,W*.19),stripY,W-Math.max(12,W*.38),stripH);
      x.strokeStyle=cfg.light==="emergency_red"?"#ef4444":cfg.light==="hack_green"?"#22c55e":"#38bdf8";x.lineWidth=1;x.strokeRect(Math.max(6,W*.19)+.5,stripY+.5,W-Math.max(12,W*.38)-1,stripH-1);
      x.textAlign="center";x.fillStyle="#f2f7fb";x.font="bold "+(compact?8:10)+"px monospace";x.fillText(cfg.name+" · "+cfg.objective,W/2,stripY+14);
      x.fillStyle="#8edcff";x.font="bold 7px monospace";x.fillText(cfg.zone+" · SYNC "+Math.round(c.sync||0)+"%",W/2,stripY+27);x.restore();
    }catch(e){}
  }

  function installHudAuthority(){
    try{
      if(typeof root.drawNM!=="function"||root.drawNM.__goodBoysCanon)return false;baseDraw=root.drawNM;
      root.drawNM=function(){var r=baseDraw.apply(this,arguments);try{if(active()&&root.ctx)drawHud(root.ctx);}catch(_){}return r;};root.drawNM.__goodBoysCanon=true;return true;
    }catch(e){return false;}
  }

  function healthCheck(){
    try{
      if(!active())return true;var c=cs();
      if(!root.NM||!c.chars||!c.chars.katrin||!c.chars.manchez){root.__goodBoysCoreBroken="missing_pair_state";return false;}
      if(root.NM.district!=="orbital"&&mission()<=7){try{root.nmLoadDistrict("orbital");}catch(_){} }
      if(!isFinite(root.NM.x)||!isFinite(root.NM.y)){root.__goodBoysCoreBroken="invalid_player_position";return false;}
      root.__goodBoysCoreBroken=null;return true;
    }catch(e){root.__goodBoysCoreBroken=String(e);return false;}
  }

  function syncIdentity(){try{if(!active())return false;var c=cs(),cfg=canonical();c.canonName=cfg.name;c.canonObjective=cfg.objective;c.canonZone=cfg.zone;c.canonLight=cfg.light;root.NM._goodBoysCanon=true;root.NM._goodBoysMission=mission();return true;}catch(e){return false;}}
  function tick(){cleanTitle();installStartAuthority();installDistrictAuthority();installOpeningAuthority();installHudAuthority();hideLegacyUi();syncIdentity();enforceBackground();healthCheck();}
  tick();var timer=null;try{timer=root.setInterval(tick,120);}catch(e){}
  root.TechOpsGoodBoysCanon={VERSION:VERSION,SEQUENCE:SEQ,mission:mission,canonical:canonical,latch:latch,isChain:isChain,cleanTitle:cleanTitle,prepareNightRuntime:prepareNightRuntime,showIncidentIntro:showIncidentIntro,installStartAuthority:installStartAuthority,installDistrictAuthority:installDistrictAuthority,installOpeningAuthority:installOpeningAuthority,installHudAuthority:installHudAuthority,enforceBackground:enforceBackground,hideLegacyUi:hideLegacyUi,healthCheck:healthCheck,tick:tick,timer:timer};
})(typeof globalThis!=="undefined"?globalThis:this);
