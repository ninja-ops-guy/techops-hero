/* Good Boys canon runtime v2 — stable orbital authority.
 * Fixes the legacy opening premise, removes the generated-background handoff that
 * could corrupt mobile gameplay, forces M1-M7 into the existing orbital district,
 * and suppresses Day Shift UI for the entire Good Boys chain (cinematic + gameplay).
 */
(function(root){
  "use strict";
  if(!root||root.TechOpsGoodBoysCanon)return;
  var VERSION=2,chain=false,baseLoad=null,baseDraw=null,basePlay=null;
  var SEQ={
    1:{name:"THE INCIDENT",objective:"SURVIVE THE HULL BREACH · STAY TOGETHER",zone:"ORBITAL COMMAND RING"},
    2:{name:"MAINTENANCE ROUTE",objective:"REACH THE MAINTENANCE SHUTTLE",zone:"SHATTERED TRANSIT SPINE"},
    3:{name:"DETENTION RING",objective:"ENTER BLACKSITE MERIDIAN",zone:"ORBITAL DETENTION"},
    4:{name:"CELL 118",objective:"FIND CELL 118 · GET THE PRISONER OUT",zone:"PRISON BLOCK 118"},
    5:{name:"ACCESS GRANTED",objective:"DEFEND K WHILE HE OPENS THE ROUTE",zone:"ORPHEUS ACCESS CORE"},
    6:{name:"CELL 1984",objective:"FREE WALDO IN CELL 1984",zone:"SURVEILLANCE BLOCK"},
    7:{name:"GOOD BOYS PROTOCOL",objective:"ESCAPE TO THE SHUTTLE · FINISH TOGETHER",zone:"COLLAPSING DETENTION RING"},
    8:{name:"RETURN TO EARTH",objective:"GET EVERYONE HOME",zone:"MAINTENANCE SHUTTLE"}
  };
  function cs(){try{return root.NM&&root.NM._v736?root.NM._v736:null;}catch(e){return null;}}
  function meta(){try{return root.S&&root.S.meta&&root.S.meta._v736?root.S.meta._v736:null;}catch(e){return null;}}
  function mission(){var c=cs(),m=c&&c.m||meta()&&meta().m||1;return Math.max(1,Math.min(8,Number(m)||1));}
  function active(){return !!cs();}
  function canonical(){return SEQ[mission()]||SEQ[1];}
  function latch(){chain=true;root.__TECHOPS_GOOD_BOYS_CANON_CHAIN=true;}
  function isChain(){return !!(chain||root.__TECHOPS_GOOD_BOYS_CANON_CHAIN||active());}

  function installStartAuthority(){
    try{
      if(!root.v736||typeof root.v736.start!=="function"||root.v736.start.__goodBoysCanon)return false;
      var start=root.v736.start;
      root.v736.start=function(){latch();hideLegacyUi();return start.apply(this,arguments);};
      root.v736.start.__goodBoysCanon=true;return true;
    }catch(e){return false;}
  }

  /* Replace only the incorrect M1 legacy cinematic. The approved premise is that
     Katrin and Manchez are already aboard the orbital structure when it catastrophically
     fails. They do NOT receive satellite coordinates for Mike/Waldo and they do NOT know
     Cell 118 contains K yet. That discovery happens later in the prison. */
  function installOpeningAuthority(){
    try{
      if(!root.v725||typeof root.v725.play!=="function"||root.v725.play.__goodBoysCanon)return false;
      basePlay=root.v725.play;
      root.v725.play=function(id,cb){
        if(id!=="b736m1")return basePlay.apply(this,arguments);
        latch();hideLegacyUi();
        var finish=function(){try{if(typeof root.closeDlg==="function")root.closeDlg();}catch(_){};if(cb)try{cb();}catch(_){}};
        try{
          if(typeof root.dlg==="function"){
            root.dlg("GOOD BOYS PROTOCOL — THE INCIDENT",
              "Katrin and Manchez are already aboard an orbital installation when the structure tears open around them.<br><br>Pressure alarms. Broken glass. Failing gravity. The maintenance route is collapsing.<br><br><b>Stay together. Cross the breach. Reach the shuttle.</b><br><br><small>BOOST JUMP ×3 · AIR DASH ×2 · partner throw/catch · SWAP keeps both dogs alive.</small>",
              [{t:"🐾 MOVE — STAY TOGETHER",f:finish}]);
            return true;
          }
        }catch(e){}
        finish();return true;
      };
      root.v725.play.__goodBoysCanon=true;return true;
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

  /* Use the repo's shipped orbital art. v1 generated a canvas/data-URL background at
     runtime; on the deployed mobile path that could become the giant distorted/noisy
     frame seen in tester screenshots. Never replace the decoded orbital payload here. */
  function enforceBackground(){
    try{
      if(!active()||!root.NM_BG734)return false;
      var source=mission()>=5?(root.NM_BG734.orbital_eye||root.NM_BG734.orbital_gate):(root.NM_BG734.orbital_gate||root.NM_BG734.orbital_eye);
      if(source)root.NM_BG734.orbital=source;
      return !!source;
    }catch(e){return false;}
  }

  function rr(ctx,x,y,w,h,r){ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x,y,w,h,r);else ctx.rect(x,y,w,h);}
  function hideLegacyUi(){
    try{
      if(!root.document)return false;var on=isChain(),ids=["hud","quest-tracker","chaos-banner","btn-twin","btn-sweep","btn-music"];
      ids.forEach(function(id){var el=root.document.getElementById(id);if(!el)return;if(on){if(el.dataset.gbCanonDisplay===undefined)el.dataset.gbCanonDisplay=el.style.display||"";el.style.setProperty("display","none","important");}else if(el.dataset.gbCanonDisplay!==undefined){el.style.display=el.dataset.gbCanonDisplay;delete el.dataset.gbCanonDisplay;}});
      if(root.document.body)root.document.body.classList.toggle("good-boys-canon",on);return true;
    }catch(e){return false;}
  }

  function drawCanonHud(x){
    try{
      if(!active())return;var c=cs(),W=x.canvas.width,cfg=canonical(),compact=W<760,h=compact?112:88;
      x.save();x.fillStyle="rgba(2,6,10,.96)";x.fillRect(0,0,W,h);x.strokeStyle="rgba(70,200,255,.30)";x.beginPath();x.moveTo(0,h-.5);x.lineTo(W,h-.5);x.stroke();
      function card(who,left){var ch=c.chars&&c.chars[who]||{},col=who==="katrin"?"#38bdf8":"#f59e0b",px=left?12:W-(compact?160:218)-12,cw=compact?160:218,py=10;x.fillStyle="rgba(7,13,20,.96)";x.strokeStyle=col;x.lineWidth=2;rr(x,px,py,cw,44,7);x.fill();x.stroke();x.fillStyle=col;x.font="bold "+(compact?10:12)+"px monospace";x.textAlign="left";x.fillText((who==="katrin"?"KATRIN":"MANCHEZ")+(c.active===who?"  ▶":""),px+10,py+16);var hp=(c.active===who&&root.NM)?root.NM.hp:(ch.hp==null?100:ch.hp),mx=ch.maxHp||100;x.fillStyle="#18212c";x.fillRect(px+10,py+25,cw-20,9);x.fillStyle=col;x.fillRect(px+10,py+25,(cw-20)*Math.max(0,Math.min(1,hp/mx)),9);}
      card("katrin",true);card("manchez",false);
      x.textAlign="center";x.fillStyle="#f4f8fb";x.font="bold "+(compact?10:13)+"px monospace";x.fillText(cfg.name,W/2,compact?68:26);x.fillStyle="#91dffc";x.font="bold "+(compact?8:10)+"px monospace";x.fillText(cfg.objective,W/2,compact?84:45);x.fillStyle="#8da0b5";x.font="bold 8px monospace";x.fillText(cfg.zone+"  ·  SYNC "+Math.round(c.sync||0)+"%",W/2,compact?100:65);x.restore();
    }catch(e){}
  }

  function installHudAuthority(){try{if(typeof root.drawNM!=="function"||root.drawNM.__goodBoysCanon)return false;baseDraw=root.drawNM;root.drawNM=function(){var r=baseDraw.apply(this,arguments);try{if(active()&&root.ctx)drawCanonHud(root.ctx);}catch(_){}return r;};root.drawNM.__goodBoysCanon=true;return true;}catch(e){return false;}}
  function syncMissionIdentity(){try{if(!active())return false;var c=cs(),cfg=canonical();c.canonName=cfg.name;c.canonObjective=cfg.objective;c.canonZone=cfg.zone;if(root.NM){root.NM._goodBoysCanon=true;root.NM._goodBoysMission=mission();}return true;}catch(e){return false;}}
  function tick(){installStartAuthority();installOpeningAuthority();installDistrictAuthority();installHudAuthority();hideLegacyUi();syncMissionIdentity();enforceBackground();}
  tick();var timer=null;try{timer=root.setInterval(tick,100);}catch(e){}
  root.TechOpsGoodBoysCanon={VERSION:VERSION,SEQUENCE:SEQ,mission:mission,canonical:canonical,latch:latch,isChain:isChain,active:active,installStartAuthority:installStartAuthority,installOpeningAuthority:installOpeningAuthority,installDistrictAuthority:installDistrictAuthority,installHudAuthority:installHudAuthority,enforceBackground:enforceBackground,hideLegacyUi:hideLegacyUi,drawCanonHud:drawCanonHud,tick:tick,timer:timer};
})(typeof globalThis!=="undefined"?globalThis:this);
