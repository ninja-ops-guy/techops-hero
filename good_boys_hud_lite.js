/* TechOps Hero — Good Boys single-HUD authority v1.
 * Presentation only. Replaces the three overlapping campaign HUD callbacks with
 * one mobile-safe header. Cell 118 presents K; Cell 1984 presents Waldo.
 */
(function(root){
  "use strict";
  if(!root||root.TechOpsGoodBoysHudLite)return;
  var VERSION=1,installed=false;
  var C={katrin:"#22b8ff",manchez:"#ff9f1c",green:"#22c55e",red:"#ff4055",cyan:"#55dfff",gold:"#ffd166"};
  function n(){try{return root.NM||null;}catch(e){return null;}}
  function cs(){try{var w=n();return w&&w._v736?w._v736:null;}catch(e){return null;}}
  function active(){return !!cs();}
  function state(){try{return typeof S!=="undefined"&&S?S:(root.S||null);}catch(e){return root.S||null;}}
  function visible(id){try{var el=root.document&&root.document.getElementById(id);if(!el)return false;if(el.classList&&el.classList.contains("hidden"))return false;var s=root.getComputedStyle?root.getComputedStyle(el):el.style;return !s||s.display!=="none"&&s.visibility!=="hidden"&&Number(s.opacity||1)!==0;}catch(e){return false;}}
  function blocked(){try{var s=state();return !!(root.__goodBoysHideHud||(s&&s.inDialog)||visible("dialogue")||visible("v725-cine")||visible("good-boys-story-cine")||visible("gb-prison-cine")||visible("good-boys-earthfall-cine")||visible("good-boys-campaign-intro"));}catch(e){return false;}}
  function mission(){try{var a=root.TechOpsGoodBoysProgressionAuthority;if(a&&typeof a.mission==="function")return Number(a.mission())||1;var m=root.S&&root.S.meta&&root.S.meta._v736;return Math.max(1,Math.min(8,Number(m&&m.m||cs()&&cs().m||1)));}catch(e){return 1;}}
  function seq(){try{return root.TechOpsGoodBoysCanon&&root.TechOpsGoodBoysCanon.SEQUENCE||null;}catch(e){return null;}}
  function box(x,a,b,w,h,r){x.beginPath();if(x.roundRect)x.roundRect(a,b,w,h,r);else x.rect(a,b,w,h);}
  function bar(x,a,b,w,h,val,max,col){var p=Math.max(0,Math.min(1,(Number(val)||0)/Math.max(1,Number(max)||1)));x.fillStyle="rgba(0,0,0,.62)";x.fillRect(a,b,w,h);x.fillStyle=col;x.fillRect(a+1,b+1,(w-2)*p,h-2);}
  function fit(x,text,max){var s=String(text||"");if(x.measureText(s).width<=max)return s;while(s.length>8&&x.measureText(s+"…").width>max)s=s.slice(0,-1);return s+"…";}
  function canon(){try{var s=seq();if(s&&s[4]){s[4].name="CELL 118";s[4].objective="INVESTIGATE THE PRISONER · VERIFY K · FREE K";}if(s&&s[6]){s[6].name="CELL 1984";s[6].objective="FREE WALDO · HOLD BOTH SIDES · BREAK LOCKDOWN";}return true;}catch(e){return false;}}
  function drawHud(x,NM){
    try{
      var c=cs();if(!c||blocked())return;canon();var W=x.canvas.width,m=mission(),s=seq(),cfg=s&&s[m]||{},small=W<=560,pad=small?6:10,gap=small?4:8,centerW=small?Math.min(112,Math.max(92,W*.26)):Math.min(190,W*.30),edgeW=Math.min(small?148:190,(W-centerW-pad*2-gap*2)/2),h=small?46:52,y=6;
      function card(who,left){var ch=c.chars&&c.chars[who]||{},aw=c.active==="manchez"?"manchez":"katrin",hp=who===aw&&NM&&isFinite(NM.hp)?NM.hp:(Number(ch.hp)||0),mx=Number(ch.maxHp)||100,col=who==="katrin"?C.katrin:C.manchez,px=left?pad:W-pad-edgeW;x.save();x.fillStyle="rgba(2,8,14,.90)";x.strokeStyle=col;x.lineWidth=2;box(x,px,y,edgeW,h,7);x.fill();x.stroke();x.textAlign="left";x.fillStyle=col;x.font="bold "+(small?8:10)+"px monospace";x.fillText(who.toUpperCase(),px+7,y+13);bar(x,px+7,y+20,edgeW-14,9,hp,mx,C.red);x.fillStyle="#d9edfb";x.font="bold 7px monospace";x.fillText(Math.max(0,Math.round(hp))+" / "+mx,px+7,y+42);if(who===aw){x.textAlign="right";x.fillStyle=col;x.fillText("ACTIVE",px+edgeW-7,y+42);}x.restore();}
      card("katrin",true);card("manchez",false);
      var cx=(W-centerW)/2,sync=Math.max(0,Math.min(100,Number(c.sync)||0)),accent=cfg.light==="emergency_red"?C.red:(cfg.light==="hack_green"?C.green:(cfg.light==="earthfall_gold"?C.gold:C.cyan));x.save();x.fillStyle="rgba(2,8,14,.92)";x.strokeStyle=accent;x.lineWidth=1.5;box(x,cx,y,centerW,h,7);x.fill();x.stroke();x.textAlign="center";x.fillStyle=accent;x.font="bold "+(small?7:9)+"px monospace";x.fillText(fit(x,cfg.name||("MISSION "+m),centerW-10),W/2,y+15);x.fillStyle="#d9edfb";x.font="bold 6px monospace";x.fillText("SYNC "+Math.round(sync)+"%",W/2,y+29);bar(x,cx+8,y+36,centerW-16,7,sync,100,sync>=100?C.green:C.cyan);x.restore();
      var oy=y+h+6,ow=W-pad*2;x.save();x.fillStyle="rgba(2,8,14,.76)";x.strokeStyle="rgba(120,210,255,.34)";x.lineWidth=1;box(x,pad,oy,ow,small?27:30,5);x.fill();x.stroke();x.textAlign="center";x.fillStyle="#eef8ff";x.font="bold "+(small?6:8)+"px monospace";x.fillText(fit(x,cfg.objective||"",ow-16),W/2,oy+11);x.fillStyle="#8fbfd2";x.font="bold 6px monospace";x.fillText(fit(x,cfg.zone||"",ow-16),W/2,oy+22);x.restore();
      if(NM)NM._goodBoysHudAuthority="single_hud_v1";
    }catch(e){root.__goodBoysHudLiteDrawError=String(e&&e.stack||e);}
  }
  drawHud.__goodBoysHudLite=true;
  function noHud(){return;}
  noHud.__goodBoysHudLite=true;
  function install(){try{canon();var gd=root.TechOpsGoodDogsProduction,g=root.TechOpsGoodBoysGameplayLoop,gc=root.TechOpsGoodBoysCanon;if(!gd||!g||!gc)return false;gd.drawReferenceHUD=drawHud;g.drawLoopOverlay=noHud;gc.drawHud=noHud;installed=gd.drawReferenceHUD===drawHud&&g.drawLoopOverlay===noHud&&gc.drawHud===noHud;root.__goodBoysHudLiteInstalled=installed;return installed;}catch(e){root.__goodBoysHudLiteInstallError=String(e&&e.stack||e);return false;}}
  function acceptance(){var w=n();return{version:VERSION,installed:installed,active:active(),mission:mission(),authority:w&&w._goodBoysHudAuthority||null,kAt118:!!(seq()&&seq()[4]&&/K/.test(seq()[4].objective||"")),waldoAt1984:!!(seq()&&seq()[6]&&/WALDO/.test(seq()[6].objective||"")),blocked:blocked(),drawError:root.__goodBoysHudLiteDrawError||null,installError:root.__goodBoysHudLiteInstallError||null};}
  install();try{(root.setTimeout||setTimeout)(install,140);}catch(e){}
  root.TechOpsGoodBoysHudLite={VERSION:VERSION,drawHud:drawHud,install:install,acceptance:acceptance};
})(typeof globalThis!=="undefined"?globalThis:this);
