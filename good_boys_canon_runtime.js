/* Good Boys canon runtime — production authority v3.
 * Fixes: no redundant "play as Mike instead" title copy, no legacy M1 premise,
 * safe DOM-owned opening handoff, orbital-only campaign districts, and direct
 * suppression of Day Shift UI while Good Boys is active.
 */
(function(root){
  "use strict";
  if(!root||root.TechOpsGoodBoysCanon)return;
  var VERSION=3,chain=false,baseLoad=null,basePlay=null,baseDraw=null;
  var SEQ={
    1:{name:"THE INCIDENT",objective:"STAY TOGETHER · CROSS THE BREACH · REACH THE SHUTTLE",zone:"ORBITAL COMMAND RING",bg:"orbital_gate"},
    2:{name:"HULL BREACH",objective:"REACH THE MAINTENANCE SHUTTLE",zone:"SHATTERED TRANSIT SPINE",bg:"orbital_gate"},
    3:{name:"DETENTION RING",objective:"ENTER BLACKSITE MERIDIAN",zone:"ORBITAL DETENTION",bg:"orbital_gate"},
    4:{name:"CELL 118",objective:"FIND CELL 118 · GET THE PRISONER OUT",zone:"PRISON BLOCK 118",bg:"orbital_gate"},
    5:{name:"ACCESS GRANTED",objective:"DEFEND K WHILE HE OPENS THE ROUTE",zone:"ORPHEUS ACCESS CORE",bg:"orbital_eye"},
    6:{name:"CELL 1984",objective:"FREE WALDO IN CELL 1984",zone:"SURVEILLANCE BLOCK",bg:"orbital_eye"},
    7:{name:"GOOD BOYS PROTOCOL",objective:"ESCAPE TO THE SHUTTLE · FINISH TOGETHER",zone:"COLLAPSING DETENTION RING",bg:"orbital_eye"},
    8:{name:"RETURN TO EARTH",objective:"GET EVERYONE HOME",zone:"MAINTENANCE SHUTTLE",bg:"orbital_gate"}
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
        if(t==="play as mike instead"||t==="← play as mike instead"||t.indexOf("play as mike instead")>=0){el.style.setProperty("display","none","important");el.setAttribute("aria-hidden","true");}
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

  function showIncidentIntro(cb){
    try{
      if(!root.document){if(cb)cb();return true;}
      var old=root.document.getElementById("good-boys-incident-intro");if(old)old.remove();
      closeLegacyDialog();
      var o=root.document.createElement("div");o.id="good-boys-incident-intro";
      o.style.cssText="position:fixed;inset:0;z-index:100000;background:radial-gradient(circle at 50% 28%,#102238 0,#050912 38%,#020409 100%);display:flex;align-items:flex-end;justify-content:center;padding:max(18px,env(safe-area-inset-bottom)) 14px;color:#eef8ff;font-family:monospace";
      o.innerHTML='<div style="width:min(680px,96vw);margin-bottom:4vh;background:#050914f2;border:2px solid #39bdf8;border-radius:14px;padding:18px;box-shadow:0 0 30px #0ea5e955"><div style="color:#f4c75b;font:700 22px monospace;line-height:1.05">GOOD BOYS PROTOCOL — THE INCIDENT</div><p style="font-size:16px;line-height:1.55;margin:14px 0">Katrin and Manchez are already aboard an orbital installation when the structure tears open around them.</p><p style="font-size:16px;line-height:1.55;margin:0 0 14px">Pressure alarms. Broken glass. Failing gravity. The maintenance route is collapsing.</p><div style="font-weight:700;font-size:16px;margin:14px 0">Stay together. Cross the breach. Reach the shuttle.</div><div style="color:#9fb5c9;font-size:13px;line-height:1.45">BOOST JUMP ×3 · AIR DASH ×2 · partner throw/catch · SWAP keeps both dogs alive.</div><button id="good-boys-begin" style="width:100%;min-height:54px;margin-top:18px;border:2px solid #38bdf8;border-radius:10px;background:#0a1726;color:#e9f8ff;font:700 15px monospace">BEGIN THE INCIDENT</button></div>';
      root.document.body.appendChild(o);
      var done=false,go=function(ev){if(ev){ev.preventDefault();ev.stopPropagation();}if(done)return;done=true;try{o.remove();}catch(_){}closeLegacyDialog();try{if(cb)cb();}catch(e){root.__goodBoysHandoffError=String(e&&e.stack||e);}};
      var b=root.document.getElementById("good-boys-begin");if(b){b.addEventListener("pointerdown",go,{once:true});b.addEventListener("click",go,{once:true});}
      return true;
    }catch(e){root.__goodBoysIntroError=String(e&&e.stack||e);if(cb)try{cb();}catch(_){}return false;}
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
      var c=cs();if(!c)return;var W=x.canvas.width,cfg=canonical(),compact=W<760,h=compact?110:84;
      x.save();x.fillStyle="rgba(2,6,10,.95)";x.fillRect(0,0,W,h);x.textAlign="center";x.fillStyle="#f2f7fb";x.font="bold "+(compact?10:13)+"px monospace";x.fillText(cfg.name,W/2,compact?66:24);x.fillStyle="#8edcff";x.font="bold "+(compact?8:10)+"px monospace";x.fillText(cfg.objective,W/2,compact?83:43);x.fillStyle="#7f95aa";x.font="bold 8px monospace";x.fillText(cfg.zone+" · SYNC "+Math.round(c.sync||0)+"%",W/2,compact?99:61);x.restore();
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
      return true;
    }catch(e){root.__goodBoysCoreBroken=String(e);return false;}
  }

  function syncIdentity(){try{if(!active())return false;var c=cs(),cfg=canonical();c.canonName=cfg.name;c.canonObjective=cfg.objective;c.canonZone=cfg.zone;root.NM._goodBoysCanon=true;root.NM._goodBoysMission=mission();return true;}catch(e){return false;}}
  function tick(){cleanTitle();installStartAuthority();installDistrictAuthority();installOpeningAuthority();installHudAuthority();hideLegacyUi();syncIdentity();enforceBackground();healthCheck();}
  tick();var timer=null;try{timer=root.setInterval(tick,120);}catch(e){}
  root.TechOpsGoodBoysCanon={VERSION:VERSION,SEQUENCE:SEQ,mission:mission,canonical:canonical,latch:latch,isChain:isChain,cleanTitle:cleanTitle,showIncidentIntro:showIncidentIntro,installStartAuthority:installStartAuthority,installDistrictAuthority:installDistrictAuthority,installOpeningAuthority:installOpeningAuthority,installHudAuthority:installHudAuthority,enforceBackground:enforceBackground,hideLegacyUi:hideLegacyUi,healthCheck:healthCheck,tick:tick,timer:timer};
})(typeof globalThis!=="undefined"?globalThis:this);
