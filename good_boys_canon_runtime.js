/* Good Boys canon runtime — music-video + approved concept authority.
 * Canon sources: user-supplied Good Boys gameplay sheet, Katrin/Manchez sprite sheets,
 * and the uploaded orbital music-video frames (command deck, hull breach, shuttle,
 * Cell 118, prison escape). This module deliberately overrides legacy M1/M2 suburbs.
 */
(function(root){
  "use strict";
  if(!root||root.TechOpsGoodBoysCanon)return;
  var VERSION=1,chain=false,baseLoad=null,baseDraw=null,bgKey="",bgImage=null;
  var SEQ={
    1:{name:"THE INCIDENT",objective:"SURVIVE THE HULL BREACH",zone:"ORBITAL COMMAND RING",tone:"breach"},
    2:{name:"DEAD SATELLITE",objective:"REACH THE MAINTENANCE SHUTTLE",zone:"SHATTERED TRANSIT SPINE",tone:"shuttle"},
    3:{name:"DETENTION RING",objective:"ENTER BLACKSITE MERIDIAN",zone:"ORBITAL DETENTION",tone:"detention"},
    4:{name:"CELL 118",objective:"FIND CELL 118 · GET HIM OUT",zone:"PRISON BLOCK 118",tone:"cell118"},
    5:{name:"ACCESS GRANTED",objective:"DEFEND K WHILE HE OPENS THE ROUTE",zone:"ORPHEUS ACCESS CORE",tone:"access"},
    6:{name:"CELL 1984",objective:"FREE WALDO IN CELL 1984",zone:"SURVEILLANCE BLOCK",tone:"cell1984"},
    7:{name:"GOOD BOYS PROTOCOL",objective:"ESCAPE TO THE SHUTTLE · FINISH TOGETHER",zone:"COLLAPSING DETENTION RING",tone:"escape"},
    8:{name:"RETURN TO EARTH",objective:"GET EVERYONE HOME",zone:"MAINTENANCE SHUTTLE",tone:"return"}
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
      root.v736.start=function(){latch();return start.apply(this,arguments);};
      root.v736.start.__goodBoysCanon=true;return true;
    }catch(e){return false;}
  }

  function installDistrictAuthority(){
    try{
      if(typeof root.nmLoadDistrict!=="function"||root.nmLoadDistrict.__goodBoysCanon)return false;
      baseLoad=root.nmLoadDistrict;
      root.nmLoadDistrict=function(id){
        var requested=id;
        if(isChain() && mission()<=7) id="orbital";
        var r=baseLoad.call(this,id);
        try{
          if(isChain()&&root.NM&&mission()<=7){
            root.NM.district="orbital";
            root.NM._goodBoysRequestedDistrict=requested;
            root.NM._goodBoysCanonDistrict="orbital";
          }
        }catch(_){}
        return r;
      };
      root.nmLoadDistrict.__goodBoysCanon=true;return true;
    }catch(e){return false;}
  }

  function rr(ctx,x,y,w,h,r){ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x,y,w,h,r);else ctx.rect(x,y,w,h);}
  function makeBg(m){
    try{
      if(!root.document||typeof root.Image!=="function")return null;
      var key=String(m);if(bgKey===key&&bgImage)return bgImage;
      var c=root.document.createElement("canvas");c.width=960;c.height=540;var x=c.getContext("2d"),cfg=SEQ[m]||SEQ[1];
      x.imageSmoothingEnabled=false;
      var g=x.createLinearGradient(0,0,0,540);g.addColorStop(0,"#020611");g.addColorStop(.55,"#07101c");g.addColorStop(1,"#0d0b0b");x.fillStyle=g;x.fillRect(0,0,960,540);
      // space + Earth/galaxy glow, matching the uploaded orbital footage.
      for(var i=0;i<120;i++){var sx=(i*83)%960,sy=(i*47)%245,a=.25+((i%7)/12);x.fillStyle="rgba(190,220,255,"+a+")";x.fillRect(sx,sy,(i%9===0?2:1),(i%11===0?2:1));}
      var rg=x.createRadialGradient(760,78,4,760,78,115);rg.addColorStop(0,"rgba(255,181,89,.95)");rg.addColorStop(.15,"rgba(237,105,38,.46)");rg.addColorStop(1,"rgba(40,80,160,0)");x.fillStyle=rg;x.fillRect(620,0,340,230);
      // giant curved station hull / pressure ring.
      x.strokeStyle="#202938";x.lineWidth=34;x.beginPath();x.arc(480,260,420,Math.PI*1.02,Math.PI*1.98);x.stroke();
      x.strokeStyle="#80552d";x.lineWidth=5;x.beginPath();x.arc(480,260,401,Math.PI*1.03,Math.PI*1.97);x.stroke();
      x.strokeStyle="#1d6a84";x.lineWidth=3;x.beginPath();x.arc(480,260,382,Math.PI*1.05,Math.PI*1.95);x.stroke();
      // industrial depth: racks, cells, gantries, pipes.
      for(i=0;i<8;i++){var bx=34+i*126;x.fillStyle=i%2?"#101823":"#11141b";x.fillRect(bx,244,94,206);x.strokeStyle="#273342";x.lineWidth=2;x.strokeRect(bx,244,94,206);for(var j=0;j<5;j++){x.fillStyle=j%2?"#0e2630":"#171a20";x.fillRect(bx+11,260+j*33,72,19);x.fillStyle=(j+i)%3===0?"#43cde8":"#d87830";x.fillRect(bx+17,266+j*33,4,3);}}
      x.fillStyle="#1a2028";x.fillRect(0,408,960,132);x.fillStyle="#28303a";x.fillRect(0,410,960,8);x.fillStyle="#0b0d10";for(i=0;i<10;i++)x.fillRect(i*105,465,72,8);
      x.strokeStyle="#664421";x.lineWidth=6;x.beginPath();x.moveTo(0,388);x.lineTo(960,388);x.stroke();
      for(i=0;i<7;i++){x.strokeStyle=i%2?"#21364b":"#5a3521";x.lineWidth=4;x.beginPath();x.moveTo(25+i*150,0);x.bezierCurveTo(15+i*150,100,80+i*130,168,48+i*145,360);x.stroke();}
      // mission-specific landmarks.
      x.font="bold 24px monospace";x.textAlign="center";
      if(cfg.tone==="breach"){x.fillStyle="rgba(190,225,255,.14)";x.beginPath();x.moveTo(335,30);x.lineTo(470,12);x.lineTo(535,150);x.lineTo(420,214);x.closePath();x.fill();x.strokeStyle="#9ccfff";x.lineWidth=2;x.stroke();for(i=0;i<28;i++){x.fillStyle="rgba(200,230,255,.55)";x.fillRect(330+(i*37)%250,40+(i*29)%180,3+(i%4),2+(i%5));}}
      if(cfg.tone==="shuttle"||cfg.tone==="escape"){x.fillStyle="#626d72";x.beginPath();x.ellipse(690,330,145,42,0,0,Math.PI*2);x.fill();x.fillStyle="#171c24";x.beginPath();x.ellipse(730,316,72,24,0,0,Math.PI*2);x.fill();x.fillStyle="#ed8a36";x.beginPath();x.arc(557,332,18,0,Math.PI*2);x.fill();}
      if(cfg.tone==="cell118"||cfg.tone==="detention"){x.fillStyle="#151719";x.fillRect(350,245,260,174);x.strokeStyle="#d9974a";x.lineWidth=4;x.strokeRect(350,245,260,174);x.fillStyle="#f1bd76";x.fillText("PRISON CELL 118",480,278);}
      if(cfg.tone==="cell1984"){x.fillStyle="#181012";x.fillRect(325,236,310,183);x.strokeStyle="#ef4e43";x.lineWidth=4;x.strokeRect(325,236,310,183);x.fillStyle="#ff7b68";x.fillText("CELL 1984",480,274);}
      if(cfg.tone==="access"){for(i=0;i<5;i++){x.strokeStyle=i%2?"#38bdf8":"#22c55e";x.lineWidth=2;x.strokeRect(365+i*48,245+i%2*18,40,95);x.fillStyle="rgba(30,220,190,.16)";x.fillRect(370+i*48,250+i%2*18,30,85);}}
      // practical orange lamps / blue instrumentation.
      for(i=0;i<7;i++){var lx=55+i*145;x.fillStyle=i%2?"#42c9ff":"#ff9a45";x.fillRect(lx,222,18,6);var glow=x.createRadialGradient(lx+9,225,2,lx+9,225,34);glow.addColorStop(0,i%2?"rgba(70,200,255,.30)":"rgba(255,145,60,.34)");glow.addColorStop(1,"rgba(0,0,0,0)");x.fillStyle=glow;x.fillRect(lx-30,190,78,70);}
      x.fillStyle="rgba(3,8,12,.72)";x.fillRect(0,0,960,54);x.fillStyle="#9ee8ff";x.font="bold 15px monospace";x.textAlign="left";x.fillText("GOOD BOYS // "+cfg.zone,22,33);
      var im=new root.Image();im.src=c.toDataURL("image/png");bgKey=key;bgImage=im;return im;
    }catch(e){return null;}
  }

  function enforceBackground(){
    try{
      if(!active()||!root.NM_BG734)return false;var im=makeBg(mission());if(!im)return false;
      root.NM_BG734.orbital=im;root.NM_BG734.orbital_gate=im;if(mission()>=5)root.NM_BG734.orbital_eye=im;return true;
    }catch(e){return false;}
  }

  function hideLegacyUi(){
    try{
      if(!root.document)return false;var on=active(),ids=["hud","quest-tracker","chaos-banner","btn-twin","btn-sweep","btn-music"];
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

  function installHudAuthority(){
    try{
      if(typeof root.drawNM!=="function"||root.drawNM.__goodBoysCanon)return false;baseDraw=root.drawNM;
      root.drawNM=function(){var r=baseDraw.apply(this,arguments);try{if(active()&&root.ctx)drawCanonHud(root.ctx);}catch(_){}return r;};
      root.drawNM.__goodBoysCanon=true;return true;
    }catch(e){return false;}
  }

  function syncMissionIdentity(){
    try{if(!active())return false;var c=cs(),cfg=canonical();c.canonName=cfg.name;c.canonObjective=cfg.objective;c.canonZone=cfg.zone;if(root.NM){root.NM._goodBoysCanon=true;root.NM._goodBoysMission=mission();}return true;}catch(e){return false;}
  }
  function tick(){installStartAuthority();installDistrictAuthority();installHudAuthority();hideLegacyUi();syncMissionIdentity();enforceBackground();}
  tick();var timer=null;try{timer=root.setInterval(tick,120);}catch(e){}
  root.TechOpsGoodBoysCanon={VERSION:VERSION,SEQUENCE:SEQ,mission:mission,canonical:canonical,latch:latch,isChain:isChain,installStartAuthority:installStartAuthority,installDistrictAuthority:installDistrictAuthority,installHudAuthority:installHudAuthority,enforceBackground:enforceBackground,hideLegacyUi:hideLegacyUi,drawCanonHud:drawCanonHud,tick:tick,timer:timer};
})(typeof globalThis!=="undefined"?globalThis:this);
