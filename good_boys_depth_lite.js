/* TechOps Hero — Good Boys Depth Lite authority v1.
 * Pre-GA presentation-only pass. No physics, collision, combat, progression,
 * or save ownership. Canon: Cell 118 prisoner = K; Cell 1984 = Waldo.
 */
(function(root){
  "use strict";
  if(!root||root.TechOpsGoodBoysDepthLite)return;
  var VERSION=1,installed=false,repairs=0;
  var C={cyan:"#55dfff",green:"#22c55e",gold:"#ffd166",red:"#ff475d",orange:"#f59e0b",ice:"#9fdcf0"};
  function N(){try{return root.NM||null;}catch(e){return null;}}
  function R(){try{var n=N();return n&&n._v736?n._v736:null;}catch(e){return null;}}
  function M(){try{return root.S&&root.S.meta&&root.S.meta._v736?root.S.meta._v736:null;}catch(e){return null;}}
  function active(){return !!R();}
  function now(){try{return root.performance&&root.performance.now?root.performance.now():Date.now();}catch(e){return Date.now();}}
  function mission(){try{var a=root.TechOpsGoodBoysProgressionAuthority;if(a&&typeof a.mission==="function")return Math.max(1,Math.min(8,Number(a.mission())||1));var m=M(),r=R(),v=m&&m.m!=null?m.m:(r&&r.m!=null?r.m:1);return Math.max(1,Math.min(8,Number(v)||1));}catch(e){return 1;}}
  function G(){return root.TechOpsGoodBoysGameplayLoop||null;}
  function B(){return root.TechOpsGoodBoysBibleWorld||null;}
  function phase(){var g=G();try{return g&&typeof g.phase==="function"?g.phase():{};}catch(e){return {};}}
  function stage(){var m=mission(),b=B(),g=G();try{if(b&&b.STAGES&&b.STAGES[m])return b.STAGES[m];}catch(e){}try{return g&&typeof g.stage==="function"?g.stage():{};}catch(e){return {};}}
  function mobile(x){return !!(x&&x.canvas&&x.canvas.width<=560);}

  function canonicalize(){
    try{
      var seq=root.TechOpsGoodBoysCanon&&root.TechOpsGoodBoysCanon.SEQUENCE,g=G(),n=N(),m=mission(),ls=n&&n._goodBoysLandmarks;
      if(seq&&seq[4]){seq[4].name="CELL 118";seq[4].objective="INVESTIGATE THE PRISONER · VERIFY K · FREE K";seq[4].zone="DETENTION BLOCK 118";}
      if(seq&&seq[6]){seq[6].name="CELL 1984";seq[6].objective="FREE WALDO · HOLD BOTH SIDES · BREAK LOCKDOWN";}
      if(g&&g.PHASES&&g.PHASES[4]){g.PHASES[4].label="CELL 118 — K";g.PHASES[4].objective="Investigate the prisoner. Verify K. Break the cell lock.";}
      if(g&&g.PHASES&&g.PHASES[6]){g.PHASES[6].label="CELL 1984 — FREE WALDO";g.PHASES[6].objective="Break lockdown. Free Waldo.";}
      if(n){n._goodBoysPrisoner118Canon="K";n._goodBoysPrisoner1984Canon="WALDO";}
      if(ls&&ls.length)for(var i=0;i<ls.length;i++){var l=ls[i];if(!l||!l.label)continue;var before=String(l.label),after=before;if(m===4&&/\b(MIKE|WALDO)\b/i.test(after))after=after.replace(/\b(MIKE|WALDO)\b/ig,"K");if(m===6&&/\bMIKE\b/i.test(after))after=after.replace(/\bMIKE\b/ig,"WALDO");if(after!==before){l.label=after;repairs++;}}
      return true;
    }catch(e){root.__goodBoysDepthCanonError=String(e&&e.stack||e);return false;}
  }
  function accent(l,p){if(l&&(l.kind==="cell1984"||l.kind==="warden"))return C.red;if(l&&(l.kind==="cell118"||l.kind==="k"))return C.green;return p&&p.accent||C.cyan;}

  function marker(x,l,p,cam,F,W,t){
    var sx=Number(l.x||0)-cam,col=accent(l,p),label=String(l.label||"").replace(/\s+/g," ").trim();
    if(sx<-130||sx>W+130){var edge=sx<0?15:W-15;x.save();x.globalAlpha=.7;x.fillStyle=col;x.beginPath();if(sx<0){x.moveTo(edge-6,165);x.lineTo(edge+3,159);x.lineTo(edge+3,171);}else{x.moveTo(edge+6,165);x.lineTo(edge-3,159);x.lineTo(edge-3,171);}x.closePath();x.fill();x.restore();return;}
    x.save();x.textAlign="center";x.font="bold 8px monospace";var tw=Math.min(92,Math.max(30,x.measureText(label).width+12)),ty=F-72;
    x.globalAlpha=.70;x.fillStyle="rgba(2,8,14,.62)";x.fillRect(sx-tw/2,ty,tw,16);x.strokeStyle=col;x.lineWidth=1;x.beginPath();x.moveTo(sx-tw/2,ty+15.5);x.lineTo(sx+tw/2,ty+15.5);x.stroke();x.globalAlpha=.94;x.fillStyle=col;x.fillText(label,sx,ty+11);
    x.globalAlpha=.58+.24*Math.sin(t/260+Number(l.x||0)*.01);x.beginPath();x.moveTo(sx,ty+20);x.lineTo(sx-4,ty+25);x.lineTo(sx+4,ty+25);x.closePath();x.fill();
    x.globalAlpha=.68;
    if(l.kind==="console"||l.kind==="k"){x.fillStyle="rgba(2,12,18,.72)";x.fillRect(sx-11,F-31,22,14);x.strokeStyle=col;x.strokeRect(sx-11.5,F-31.5,23,15);x.fillStyle=col;x.fillRect(sx-6,F-27,12,2);}
    else if(l.kind==="cell118"||l.kind==="cell1984"||l.kind==="door"){x.strokeStyle=col;x.strokeRect(sx-14.5,F-51.5,29,51);for(var q=-8;q<=8;q+=8){x.globalAlpha=.25;x.beginPath();x.moveTo(sx+q,F-50);x.lineTo(sx+q,F);x.stroke();}}
    else if(l.kind==="shuttle"){x.fillStyle="rgba(56,75,91,.64)";x.strokeStyle=col;x.beginPath();x.moveTo(sx-31,F-14);x.lineTo(sx+26,F-14);x.lineTo(sx+34,F-25);x.lineTo(sx-22,F-29);x.closePath();x.fill();x.stroke();}
    else{x.strokeStyle=col;x.beginPath();x.moveTo(sx,F-31);x.lineTo(sx,F-7);x.stroke();x.beginPath();x.arc(sx,F-34,3,0,Math.PI*2);x.stroke();}
    x.restore();
  }

  function haze(x,m,W,H){try{var g=x.createLinearGradient(0,120,0,H);g.addColorStop(0,m===1||m===8?"rgba(34,24,48,.01)":"rgba(10,24,42,.01)");g.addColorStop(1,m===1||m===8?"rgba(33,22,36,.12)":"rgba(18,32,55,.13)");x.save();x.fillStyle=g;x.fillRect(0,120,W,H-120);x.restore();}catch(e){}}
  function bloom(x,m,cam,F,W,H,t){
    var wx=790,rgb="255,209,102",rad=150,a=.10;if(m===2){wx=1390;rgb="85,223,255";rad=180;a=.08;}if(m===3){wx=330;rgb="255,138,76";rad=165;a=.08;}if(m===4){wx=1320;rgb="85,223,255";rad=145;a=.10;}if(m===5){wx=1070;rgb="34,197,94";rad=165;a=.09;}if(m===6){wx=1360;rgb="255,71,93";rad=170;a=.08;}if(m===7){wx=900;rgb="245,158,11";rad=185;a=.08;}if(m===8){wx=820;rgb="255,209,102";rad=220;a=.08;}var sx=wx-cam*.62;
    try{var g=x.createRadialGradient(sx,F-105,4,sx,F-105,rad);g.addColorStop(0,"rgba("+rgb+","+(a+.025*Math.sin(t/430))+")");g.addColorStop(1,"rgba("+rgb+",0)");x.save();x.globalCompositeOperation="screen";x.fillStyle=g;x.fillRect(Math.max(0,sx-rad),Math.max(90,F-105-rad),Math.min(W,rad*2),Math.min(H,rad*2));x.restore();}catch(e){}
  }
  function motes(x,m,cam,F,W,t,isMobile){var count=isMobile?6:11,h=Math.max(120,F-175);x.save();for(var i=0;i<count;i++){var px=((i*137+43+t*((m===3||m===7)? .026:.012)-cam*.08)%(W+80)+W+80)%(W+80)-40,py=160+((i*61+19-t*(.006+(i%3)*.001))%h+h)%h;x.globalAlpha=.10+(i%4)*.025;x.fillStyle=m===1||m===8?C.gold:(m===5?C.green:(m===6?C.red:C.ice));x.fillRect(px,py,i%3===0?2:1,i%3===0?2:1);}x.restore();}
  function parallax(x,m,cam,F,W,isMobile){
    x.save();x.globalAlpha=.12;x.fillStyle=m===1||m===8?C.gold:C.cyan;var fs=(cam*.10)%96;for(var i=-1;i<Math.ceil(W/96)+2;i++){var fx=i*96-fs+(i%2)*19,fy=185+(i%3)*18;x.fillRect(fx,fy,2,2);if(!isMobile&&i%2===0)x.fillRect(fx+15,fy+11,1,1);}
    x.globalAlpha=.10;x.strokeStyle=m===6?C.red:(m===1||m===8?C.gold:C.cyan);x.lineWidth=1;var ms=(cam*.30)%180;x.beginPath();x.moveTo(-180-ms,238);x.bezierCurveTo(W*.25-ms,228,W*.62-ms,248,W+180-ms,232);x.stroke();
    if(m>=3&&m<=7){x.globalAlpha=.22;x.fillStyle="rgba(1,7,12,.68)";var ns=(cam*.72)%220;for(var p=-220-ns;p<W+220;p+=220){if(p>W*.25&&p<W*.75)continue;x.fillRect(p,F-152,8,174);x.strokeStyle=m===6?"rgba(255,71,93,.28)":"rgba(85,223,255,.22)";x.strokeRect(p+.5,F-152.5,8,174);}}
    else if(m===1||m===8){x.globalAlpha=.34;x.strokeStyle="rgba(18,12,16,.72)";x.lineWidth=7;x.beginPath();x.moveTo(-30-(cam*1.12)%90,155);x.quadraticCurveTo(90-(cam*1.12)%90,118,190-(cam*1.12)%90,170);x.stroke();x.lineWidth=2;x.strokeStyle="rgba(255,209,102,.18)";for(var r=-80-((cam*.66)%105);r<W+100;r+=105){x.beginPath();x.moveTo(r,F-45);x.lineTo(r,F+12);x.stroke();}}
    else if(m===2){x.globalAlpha=.22;x.strokeStyle="rgba(85,223,255,.22)";x.lineWidth=4;for(var j=-100-((cam*.62)%210);j<W+120;j+=210){x.beginPath();x.moveTo(j,F-185);x.lineTo(j,F+16);x.stroke();}}
    x.restore();
  }
  function fx(x,m,cam,F,W,t,isMobile){x.save();if(m===4){x.strokeStyle="rgba(125,215,255,.18)";x.lineWidth=1;for(var i=0;i<(isMobile?2:4);i++){var dx=(90+i*173-cam*.18)%(W+40),dy=170+((t*.035+i*73)%150);x.beginPath();x.moveTo(dx,dy);x.lineTo(dx,dy+8);x.stroke();}}
    else if(m===5){var node=1070-cam;x.strokeStyle="rgba(34,197,94,.22)";x.lineWidth=1;for(var y=F-155;y<F-35;y+=28){x.beginPath();x.moveTo(node-58,y+((t/80)%4));x.lineTo(node+58,y+((t/80)%4));x.stroke();}}
    else if(m===6||m===7){x.fillStyle=m===6?C.red:C.orange;for(var s=0;s<(isMobile?2:4);s++){var px=((s*211+t*.045-cam*.45)%(W+60)+W+60)%(W+60)-30,py=210+(s*47)%150;x.globalAlpha=.18+.08*Math.sin(t/120+s);x.fillRect(px,py,2,2);}}x.restore();}
  function trail(x,cam,F,t){var n=N(),step=Number(n&&n._gbWaldoTrailStep)||0,pts=[300,430,570,730,900,1060,1210,1370,1460];x.save();for(var i=0;i<pts.length;i++){var req=i<2?1:i<4?2:i<6?3:4,done=step>=req;x.globalAlpha=done ? .58 :(.16+.08*Math.sin(t/240+i));x.fillStyle=done?C.gold:C.cyan;x.beginPath();x.arc(pts[i]-cam,F-18-(i%2)*4,done?2.5:2,0,Math.PI*2);x.fill();}if(step>=3){var wall=1460-cam,gl=.36+.22*Math.sin(t/180);x.globalAlpha=gl;x.strokeStyle=C.cyan;x.lineWidth=2;x.beginPath();x.moveTo(wall,F-126);x.lineTo(wall,F-7);x.stroke();x.globalAlpha=.22;x.beginPath();x.moveTo(wall-4,F-126);x.lineTo(wall-4,F-7);x.stroke();}x.restore();}
  function hazards(x,hs,cam,F){if(!hs)return;x.save();for(var i=0;i<hs.length;i++){var h=hs[i],hx=Number(h.x!=null?h.x:h[0])-cam,hw=Number(h.w!=null?h.w:h[1])||0;x.fillStyle="rgba(255,85,30,.10)";x.fillRect(hx,F-5,hw,5);x.strokeStyle="rgba(255,122,42,.62)";x.lineWidth=1;x.beginPath();x.moveTo(hx,F-6);x.lineTo(hx+hw,F-6);x.stroke();}x.restore();}

  function drawStageAccents(x){
    try{var n=N(),g=G();if(!n||!g||!active())return;canonicalize();var m=mission(),p=phase()||{},s=stage()||{},W=x.canvas.width,H=x.canvas.height,F=typeof root.NM_FLOOR==="number"?root.NM_FLOOR:430,cam=Number(n.cam)||0,t=now(),isMobile=mobile(x),hs=n._goodBoysHazards||s.hazards||[],ls=n._goodBoysLandmarks||s.landmarks||[];haze(x,m,W,H);bloom(x,m,cam,F,W,H,t);motes(x,m,cam,F,W,t,isMobile);parallax(x,m,cam,F,W,isMobile);fx(x,m,cam,F,W,t,isMobile);hazards(x,hs,cam,F);if(m===1)trail(x,cam,F,t);for(var i=0;i<ls.length;i++)marker(x,ls[i],p,cam,F,W,t);n._goodBoysDepthLite=true;n._goodBoysDepthLayers=isMobile?3:4;n._goodBoysLandmarkPresentation="compact_world_marker";}catch(e){root.__goodBoysDepthDrawError=String(e&&e.stack||e);}
  }
  drawStageAccents.__goodBoysDepthLite=true;
  function install(){try{canonicalize();var g=G();if(!g)return false;g.drawStageAccents=drawStageAccents;installed=g.drawStageAccents===drawStageAccents;if(installed){root.__goodBoysDepthLiteInstalled=true;root.__goodBoysDepthLiteVersion=VERSION;}return installed;}catch(e){root.__goodBoysDepthInstallError=String(e&&e.stack||e);return false;}}
  function acceptance(){var n=N(),seq=root.TechOpsGoodBoysCanon&&root.TechOpsGoodBoysCanon.SEQUENCE,g=G();return{version:VERSION,installed:installed&&!!(g&&g.drawStageAccents&&g.drawStageAccents.__goodBoysDepthLite),active:active(),mission:mission(),cell118Canon:!!(seq&&seq[4]&&/K/.test(seq[4].objective||"")&&!/MIKE|WALDO/i.test(seq[4].objective||"")),cell1984Canon:!!(seq&&seq[6]&&/WALDO/.test(seq[6].objective||"")),compactMarkers:!!(n&&n._goodBoysLandmarkPresentation==="compact_world_marker"),depthLayers:Number(n&&n._goodBoysDepthLayers)||0,noPhysicsOwnership:true,repairs:repairs,drawError:root.__goodBoysDepthDrawError||null,installError:root.__goodBoysDepthInstallError||null};}
  install();try{(root.setTimeout||setTimeout)(install,120);}catch(e){}
  root.TechOpsGoodBoysDepthLite={VERSION:VERSION,mission:mission,canonicalize:canonicalize,drawStageAccents:drawStageAccents,install:install,acceptance:acceptance};
})(typeof globalThis!=="undefined"?globalThis:this);
