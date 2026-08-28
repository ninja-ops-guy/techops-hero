/* Good Boys campaign-bible world authority v1.
 * Makes the late production runtime agree with the authored route, not just the
 * labels: Waldo's property -> hidden bay -> prison breach -> 118 -> core ->
 * 1984 -> Warden/shuttle -> Earthfall. Also suppresses incompatible v7.36
 * legacy mission state that can leak into the Good Boys campaign.
 */
(function(root){
  "use strict";
  if(!root||root.TechOpsGoodBoysBibleWorld)return;
  var VERSION=1,lastMission=0,normalizedMission=0,drawInstalled=false,repairs=0;
  var ROUTE={
    1:{name:"WALDO'S HOUSE",objective:"SEARCH THE PROPERTY · FOLLOW THE TRAIL THROUGH THE GARAGE · FIND THE HIDDEN BAY",zone:"WALDO'S PLACE — HOUSE / YARD / GARAGE",target:1460,color:"#ffd166"},
    2:{name:"THE HIDDEN BAY",objective:"CLEAR THE HANGAR · REACH THE SECRET SHIP · BOARD",zone:"WALDO'S CONCEALED LAUNCH BAY",target:1390,color:"#55dfff"},
    3:{name:"ORBITAL PRISON — BREACH",objective:"SURVIVE IMPACT · CROSS THE BREACH · REACH CELL BLOCK 118",zone:"BLACKSITE MERIDIAN — MAINTENANCE HULL",target:1450,color:"#ff8a4c"},
    4:{name:"CELL 118",objective:"INVESTIGATE THE PRISONER · VERIFY K · BREAK THE CELL LOCK",zone:"BLACKSITE MERIDIAN — BLOCK 118",target:1320,color:"#55dfff"},
    5:{name:"ACCESS CORE",objective:"ESCORT K · SEIZE THE ROUTE CONTROLS · OPEN THE PATH TO 1984",zone:"BLACKSITE MERIDIAN — ORPHEUS ACCESS CORE",target:1480,color:"#22c55e"},
    6:{name:"CELL 1984",objective:"DEFEND K'S DECRYPT · BREAK LOCKDOWN · FREE WALDO",zone:"BLACKSITE MERIDIAN — SURVEILLANCE BLOCK 1984",target:1360,color:"#ff475d"},
    7:{name:"ESCAPE VELOCITY",objective:"BREAK THE WARDEN · REACH THE MAINTENANCE SHUTTLE",zone:"BLACKSITE MERIDIAN — WARDEN CORE / SHUTTLE BAY",target:1580,color:"#f59e0b"},
    8:{name:"EARTHFALL",objective:"GET K · WALDO · KATRIN · MANCHEZ HOME",zone:"WALDO'S HOUSE — DAWN",target:820,color:"#ffd18b"}
  };
  var STAGES={
    1:{platforms:[],hazards:[],landmarks:[{x:520,label:"YARD",kind:"yard"},{x:790,label:"PORCH",kind:"porch"},{x:1120,label:"GARAGE",kind:"garage"},{x:1460,label:"HIDDEN BAY",kind:"door"}]},
    2:{platforms:[[420,338,210],[760,300,180],[1060,338,220]],hazards:[],landmarks:[{x:620,label:"HANGAR SECURITY",kind:"console"},{x:1390,label:"SECRET SHIP",kind:"shuttle"}]},
    3:{platforms:[[280,348,210],[590,320,190],[880,350,230],[1185,318,205],[1450,350,170]],hazards:[[505,55],[1090,55]],landmarks:[{x:330,label:"IMPACT BREACH",kind:"breach"},{x:900,label:"MAINTENANCE AIRLOCK",kind:"door"},{x:1450,label:"BLOCK 118",kind:"door"}]},
    4:{platforms:[[260,350,230],[560,315,210],[860,350,250],[1190,318,235],[1490,350,170]],hazards:[],landmarks:[{x:500,label:"EVIDENCE",kind:"console"},{x:800,label:"RESTRAINT CIPHER",kind:"console"},{x:1100,label:"REFLECTION",kind:"console"},{x:1320,label:"CELL 118",kind:"cell118"}]},
    5:{platforms:[[250,345,240],[590,345,240],[930,310,230],[1260,345,260]],hazards:[[845,45]],landmarks:[{x:760,label:"K — ROUTE KEY",kind:"k"},{x:1070,label:"ACCESS NODE",kind:"console"},{x:1480,label:"ROUTE 1984",kind:"door"}]},
    6:{platforms:[[220,350,260],[565,315,220],[875,350,250],[1200,305,250],[1510,350,170]],hazards:[],landmarks:[{x:420,label:"K UPLINK",kind:"console"},{x:1010,label:"LOCKDOWN",kind:"warden"},{x:1360,label:"CELL 1984",kind:"cell1984"}]},
    7:{platforms:[[210,340,180],[465,295,160],[700,255,155],[930,305,180],[1190,255,180],[1450,325,170]],hazards:[[400,45],[1378,45]],landmarks:[{x:900,label:"WARDEN CORE",kind:"warden"},{x:1580,label:"MAINTENANCE SHUTTLE",kind:"shuttle"}]},
    8:{platforms:[],hazards:[],landmarks:[{x:640,label:"WALDO'S PORCH",kind:"porch"},{x:930,label:"GARAGE",kind:"garage"},{x:1180,label:"SHUTTLE WRECK",kind:"shuttle"}]}
  };
  function cs(){try{return root.NM&&root.NM._v736?root.NM._v736:null;}catch(e){return null;}}
  function meta(){try{return root.S&&root.S.meta&&root.S.meta._v736?root.S.meta._v736:null;}catch(e){return null;}}
  function active(){return !!cs();}
  function mission(){try{var c=cs(),m=c&&c.m||meta()&&meta().m||1;return Math.max(1,Math.min(8,Number(m)||1));}catch(e){return 1;}}
  function now(){return root.performance&&root.performance.now?root.performance.now():Date.now();}
  function setMsg(t,ms){try{if(root.NM){root.NM.msg=t;root.NM.msgT=now()+(ms||2200);}}catch(e){}}
  function syncDefinitions(){
    try{
      var canon=root.TechOpsGoodBoysCanon&&root.TechOpsGoodBoysCanon.SEQUENCE;
      var bg=root.TechOpsGoodBoysBackgroundAuthority&&root.TechOpsGoodBoysBackgroundAuthority.MAP;
      var g=root.TechOpsGoodBoysGameplayLoop;
      Object.keys(ROUTE).forEach(function(k){
        var r=ROUTE[k],b=bg&&bg[k];
        if(canon&&canon[k]){canon[k].name=r.name;canon[k].objective=r.objective;canon[k].zone=r.zone;if(b){canon[k].bg=b.key;canon[k].district=b.district;}}
        if(g&&g.PHASES){g.PHASES[k]={id:k==1?"waldo_property":k==2?"hidden_bay":k==3?"breach":k==4?"cell118":k==5?"core":k==6?"cell1984":k==7?"escape":"earthfall",label:r.name,objective:r.objective,accent:r.color,hazard:k==3?"debris":k==5?"security":k==6?"lockdown":k==7?"warden":"none",bg:b&&b.key||""};}
        if(g&&g.STAGES)g.STAGES[k]=STAGES[k];
      });
      return true;
    }catch(e){root.__goodBoysBibleSyncError=String(e&&e.stack||e);return false;}
  }
  function applyStage(){
    try{
      if(!active()||!root.NM)return false;var m=mission(),s=STAGES[m],n=root.NM;if(!s)return false;
      if(n._gbBibleStageRevision===VERSION&&n._gbBibleStageMission===m)return true;
      n.platforms=s.platforms.map(function(p){return{x:p[0],y:p[1],w:p[2],h:12};});
      n._goodBoysHazards=s.hazards.map(function(h){return{x:h[0],w:h[1]};});
      n._goodBoysLandmarks=s.landmarks.slice();
      n._goodBoysStageMission=m;n._gbBibleStageMission=m;n._gbBibleStageRevision=VERSION;
      return true;
    }catch(e){root.__goodBoysBibleStageError=String(e&&e.stack||e);return false;}
  }
  function retype(e,kind){
    try{if(!e||!root.NM_KINDS||!root.NM_KINDS[kind])return e;var k=root.NM_KINDS[kind],oldMax=Number(e.maxHp)||Number(e.hp)||1,ratio=Math.max(.15,Math.min(1,(Number(e.hp)||oldMax)/oldMax));e.kind=kind;e.name=k.name||kind;e.spd=k.spd||e.spd;e.dmg=k.dmg||e.dmg;e.tint=k.tint||e.tint;e.w=k.w||e.w;e.h=k.h||e.h;e.blocks=!!k.blocks;e.dashes=!!k.dashes;e.lunges=!!k.lunges;e.hover=!!k.hover;e.boss=!!k.boss;var hp=Math.round((Number(k.hp)||oldMax)*(1+mission()*.04));e.maxHp=hp;e.hp=Math.max(1,Math.round(hp*ratio));return e;}catch(_){return e;}
  }
  function spawnBible(kind,x){
    try{var k=root.NM_KINDS&&root.NM_KINDS[kind];if(!k)return null;var F=typeof root.NM_FLOOR==="number"?root.NM_FLOOR:430;var hp=Math.round((Number(k.hp)||60)*(1+mission()*.04));return Object.assign({},k,{kind:kind,x:x,y:F-(k.h||40),w:k.w||28,h:k.h||40,hp:hp,maxHp:hp,dmg:Math.round((k.dmg||8)*(1+mission()*.03)),vx:0,windup:0,hitT:0,kb:0,launch:0,down:0,alive:true,cd:40,face:-1,weak:false,_counted:false,phase:1,_spawnX:x});}catch(e){return null;}
  }
  function normalizeEnemies(m){
    try{var es=root.NM&&root.NM.enemies||[];for(var i=0;i<es.length;i++){var e=es[i];if(!e)continue;if(m>=2&&m<=7&&e.kind==="thug")retype(e,m>=5?"hunter":"guard");if(m>=3&&m<=7&&e.kind==="droneop")retype(e,"skimmer");}return true;}catch(e){return false;}
  }
  function normalizeLegacy(){
    try{
      if(!active()||!root.NM)return false;var n=root.NM,c=cs(),m=mission();
      if(m!==normalizedMission){normalizedMission=m;n._gbBibleMissionNormalized=false;n._gbBibleM5Reframed=false;}
      if(m===1){c.wave=999;c.waveDelay=0;c.pendingSpawn=null;c.towers=[];c.evidence=null;c.uplink=null;c.decrypt=null;c.barrier=null;if(n.enemies&&n.enemies.length){n.enemies=[];repairs++;}n.clear=false;n._gbBibleMissionNormalized=true;}
      if(m===2){if(!c.towers||!c.towers.length||!c.towers[0]._bibleSentinel){c.towers=[{x:-100000,done:false,_bibleSentinel:true}];repairs++;}c.pendingSpawn=c.pendingSpawn||null;n._gbBibleMissionNormalized=true;}
      normalizeEnemies(m);
      if(m===5&&!n._gbBibleM5Reframed){var had=false;for(var i=(n.enemies||[]).length-1;i>=0;i--){if(n.enemies[i]&&n.enemies[i].kind==="mikeindex"){n.enemies.splice(i,1);had=true;}}if(had){var a=spawnBible("guard",650),b=spawnBible("hunter",1010),d=spawnBible("guard",1360);[a,b,d].forEach(function(e){if(e)n.enemies.push(e);});c._adds66=true;n._gbBibleM5Reframed=true;n._gbBibleMissionNormalized=true;setMsg("ACCESS CORE — K NEEDS THE ROUTE CONTROLS · CLEAR SECURITY",2600);repairs++;}}
      if(m===6)n._gbBibleMissionNormalized=true;
      if(m===7)n._gbBibleMissionNormalized=true;
      n._gbBibleRouteName=ROUTE[m]&&ROUTE[m].name;n._gbBibleObjective=ROUTE[m]&&ROUTE[m].objective;
      return true;
    }catch(e){root.__goodBoysBibleNormalizeError=String(e&&e.stack||e);return false;}
  }
  function updateWaldoTrail(){
    try{
      if(!active()||mission()!==1||!root.NM)return false;var n=root.NM,x=Number(n.x)||0,step=Number(n._gbWaldoTrailStep)||0,next=step;
      if(x>=360)next=Math.max(next,1);if(x>=720)next=Math.max(next,2);if(x>=1050)next=Math.max(next,3);if(x>=1425)next=Math.max(next,4);
      if(next!==step){n._gbWaldoTrailStep=next;if(next===1)setMsg("YARD — WALDO'S TRAIL NEVER REACHES THE STREET",1800);if(next===2)setMsg("PORCH LIGHT ON · WALDO GONE · TRAIL CONTINUES TO THE GARAGE",2200);if(next===3)setMsg("GARAGE — FRESH SCRAPE MARKS BEHIND THE TOOL WALL",2200);if(next===4){n._gbWaldoTrailComplete=true;setMsg("FALSE WALL OPEN · HIDDEN BAY FOUND",2600);} }
      if(next>=4)n._gbWaldoTrailComplete=true;
      n._gbWaldoPropertyCanonical=true;
      return !!n._gbWaldoTrailComplete;
    }catch(e){return false;}
  }
  function beacon(x,target,label,color){
    try{var n=root.NM,W=x.canvas.width,sx=target-(Number(n.cam)||0),px=Math.max(72,Math.min(W-72,sx)),off=sx<72||sx>W-72,pulse=.5+.5*Math.sin(now()/240);x.save();x.textAlign="center";x.font="bold 9px monospace";x.fillStyle="rgba(2,8,14,.86)";x.fillRect(px-70,126,140,30);x.strokeStyle=color;x.strokeRect(px-70.5,126.5,141,30);x.fillStyle=color;x.fillText((off?(sx<72?"← ":"→ "):"")+label,px,139);x.fillStyle="rgba(255,255,255,"+(.55+pulse*.4)+")";x.font="bold 13px monospace";x.fillText("▼",px,153);x.restore();}catch(e){}
  }
  function drawPropertyCues(x){
    try{var n=root.NM,cam=Number(n.cam)||0,F=typeof root.NM_FLOOR==="number"?root.NM_FLOOR:430,t=now(),step=Number(n._gbWaldoTrailStep)||0;x.save();
      /* Transparent property identity over the painted Waldo plate. */
      x.globalAlpha=.72;x.strokeStyle="#ffd166";x.lineWidth=2;x.strokeRect(620-cam,F-238,430,238);x.beginPath();x.moveTo(600-cam,F-238);x.lineTo(835-cam,F-305);x.lineTo(1080-cam,F-238);x.stroke();
      x.strokeStyle="#7c5b35";x.strokeRect(690-cam,F-155,300,155);x.strokeStyle="#55dfff";x.strokeRect(1055-cam,F-178,255,178);
      for(var i=0;i<11;i++){var lx=700-cam+i*27,ly=F-144+5*Math.sin(i*.8);x.fillStyle=((t/550+i)|0)%2?"#ffd166":"#ffb347";x.beginPath();x.arc(lx,ly,2.4,0,Math.PI*2);x.fill();}
      /* Satellite dish. */
      x.strokeStyle="#55dfff";x.lineWidth=3;x.beginPath();x.moveTo(1385-cam,F);x.lineTo(1385-cam,F-76);x.stroke();x.beginPath();x.ellipse(1385-cam,F-92,35,21,-.55,0,Math.PI*2);x.stroke();
      /* Scent/data trail. */
      var pts=[300,430,570,730,900,1060,1210,1370,1460];for(var p=0;p<pts.length;p++){var wx=pts[p],required=p<2?1:p<4?2:p<6?3:4,done=step>=required;x.fillStyle=done?"rgba(255,209,102,.8)":"rgba(85,223,255,"+(.25+.25*Math.sin(t/260+p))+')';x.beginPath();x.arc(wx-cam,F-20-(p%2)*5,done?3:4,0,Math.PI*2);x.fill();}
      /* False garage wall becomes visibly discoverable. */
      var glow=step>=3?.65+.25*Math.sin(t/180):.12;x.fillStyle="rgba(2,10,15,.82)";x.fillRect(1280-cam,F-174,180,174);x.strokeStyle="rgba(85,223,255,"+glow+")";x.lineWidth=3;x.strokeRect(1280-cam,F-174,180,174);x.fillStyle="rgba(85,223,255,"+glow+")";x.fillRect(1287-cam,F-168,3,160);if(step>=3){x.fillStyle="#dff8ff";x.font="bold 9px monospace";x.textAlign="center";x.fillText(step>=4?"HIDDEN BAY — OPEN":"FALSE WALL — SIGNAL",1370-cam,F-188);}
      x.restore();beacon(x,step<2?790:step<3?1120:1460,step<2?"PORCH":step<3?"GARAGE":"HIDDEN BAY",step<3?"#ffd166":"#55dfff");
    }catch(e){root.__goodBoysPropertyDrawError=String(e&&e.stack||e);}
  }
  function drawHangarUnder(x){
    try{var n=root.NM,cam=Number(n.cam)||0,F=typeof root.NM_FLOOR==="number"?root.NM_FLOOR:430,t=now();x.save();x.globalAlpha=.55;x.strokeStyle="#55dfff";x.lineWidth=2;for(var p=240;p<1640;p+=260){x.strokeRect(p-cam,F-280,18,280);x.beginPath();x.moveTo(p-cam,F-280);x.lineTo(p+150-cam,F-330);x.stroke();}x.fillStyle="rgba(85,223,255,.12)";for(var r=300;r<1500;r+=180)x.fillRect(r-cam,F-18,120,3);x.fillStyle="#bdefff";x.font="bold 9px monospace";x.textAlign="center";x.fillText("WALDO'S CONCEALED LAUNCH BAY",900-cam,F-300);if(!n._gbShipRevealed){var pulse=.25+.25*Math.sin(t/250);x.fillStyle="rgba(2,8,14,.9)";x.fillRect(1285-cam,F-210,220,210);x.strokeStyle="rgba(85,223,255,"+pulse+")";x.strokeRect(1285-cam,F-210,220,210);x.fillStyle="#9fdcf0";x.fillText("BAY 01 · SECURITY LOCK",1395-cam,F-222);}x.restore();beacon(x,1390,n._gbShipRevealed?"BOARD SECRET SHIP":"CLEAR HANGAR","#55dfff");}catch(e){}
  }
  function drawPrisonCue(x){
    try{var m=mission(),r=ROUTE[m];if(!r||m<3||m>7)return;var n=root.NM,cam=Number(n.cam)||0,F=typeof root.NM_FLOOR==="number"?root.NM_FLOOR:430,t=now(),target=r.target;x.save();var alarm=m===6||m===7;var a=.35+.25*Math.sin(t/(alarm?130:260));x.strokeStyle=alarm?"rgba(255,71,93,"+a+")":"rgba(85,223,255,"+a+")";x.lineWidth=2;for(var i=260;i<1640;i+=320){x.beginPath();x.moveTo(i-cam,F-250);x.lineTo(i+80-cam,F-250);x.stroke();x.beginPath();x.arc(i+40-cam,F-265,5,0,Math.PI*2);x.stroke();}if(m===4){x.fillStyle="rgba(85,223,255,.12)";[500,800,1100].forEach(function(px){x.beginPath();x.arc(px-cam,F-64,12+3*Math.sin(t/230),0,Math.PI*2);x.fill();});}if(m===5){x.strokeStyle="rgba(34,197,94,"+(.45+.3*Math.sin(t/180))+")";for(var y=F-210;y<F-40;y+=42){x.beginPath();x.moveTo(930-cam,y);x.lineTo(1370-cam,y);x.stroke();}}if(m===6){x.fillStyle="rgba(255,71,93,.16)";x.fillRect(1275-cam,F-210,170,210);x.fillStyle="#ff93a4";x.font="bold 20px monospace";x.textAlign="center";x.fillText("1984",1360-cam,F-228);}if(m===7){x.strokeStyle="rgba(245,158,11,.55)";x.beginPath();x.arc(900-cam,F-120,85+6*Math.sin(t/160),0,Math.PI*2);x.stroke();}x.restore();beacon(x,target,m===3?"CELL BLOCK 118":m===4?"CELL 118":m===5?"ROUTE 1984":m===6?"FREE WALDO":"MAINTENANCE SHUTTLE",r.color);}catch(e){}
  }
  function installDrawAuthority(){
    try{var g=root.TechOpsGoodBoysGameplayLoop;if(!g||drawInstalled||typeof g.drawStageAccents!=="function")return false;var base=g.drawStageAccents;g.drawStageAccents=function(x){var m=mission(),r;if(m===2)drawHangarUnder(x);r=base&&base.apply(this,arguments);if(!active())return r;if(m===1)drawPropertyCues(x);else if(m>=3&&m<=7)drawPrisonCue(x);return r;};g.__goodBoysBibleWorldDraw=true;drawInstalled=true;return true;}catch(e){root.__goodBoysBibleDrawInstallError=String(e&&e.stack||e);return false;}
  }
  function tick(){
    try{syncDefinitions();installDrawAuthority();if(!active()){lastMission=0;normalizedMission=0;return;}var m=mission();if(m!==lastMission){lastMission=m;applyStage();}else applyStage();normalizeLegacy();if(m===1)updateWaldoTrail();var a=root.TechOpsGoodBoysBackgroundAuthority;if(a&&a.enforce)a.enforce();}catch(e){root.__goodBoysBibleWorldError=String(e&&e.stack||e);}
  }
  function acceptance(){var n=root.NM||{},m=mission(),r=ROUTE[m]||{};return{version:VERSION,active:active(),mission:m,name:r.name||null,objective:r.objective||null,stage:!!(n._gbBibleStageRevision===VERSION&&n._gbBibleStageMission===m),normalized:!!n._gbBibleMissionNormalized,waldoProperty:m!==1||!!n._gbWaldoPropertyCanonical,trailStep:Number(n._gbWaldoTrailStep)||0,trailComplete:!!n._gbWaldoTrailComplete,m5Reframed:m!==5||!!n._gbBibleM5Reframed,repairs:repairs,pass:!active()||!!(n._gbBibleStageRevision===VERSION&&n._gbBibleStageMission===m&&(m!==1||n._gbWaldoPropertyCanonical))};}
  syncDefinitions();installDrawAuthority();tick();var timer=root.setInterval?root.setInterval(tick,75):null;
  root.TechOpsGoodBoysBibleWorld={VERSION:VERSION,ROUTE:ROUTE,STAGES:STAGES,syncDefinitions:syncDefinitions,applyStage:applyStage,normalizeLegacy:normalizeLegacy,updateWaldoTrail:updateWaldoTrail,installDrawAuthority:installDrawAuthority,tick:tick,acceptance:acceptance,timer:timer};
})(typeof globalThis!=="undefined"?globalThis:this);
