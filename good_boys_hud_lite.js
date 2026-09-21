/* TechOps Hero — Good Boys single-HUD authority v4.
 * Compact mobile presentation: health + sync remain readable while reclaiming
 * vertical playfield. Cell 118 presents K; Cell 1984 presents Waldo.
 */
(function(root){
  "use strict";
  if(!root||root.TechOpsGoodBoysHudLite)return;
  var VERSION=4,installed=false;
  var C={katrin:"#22b8ff",manchez:"#ff9f1c",green:"#22c55e",red:"#ff4055",cyan:"#55dfff",gold:"#ffd166"};
  function n(){try{return root.NM||null;}catch(e){return null;}}
  function cs(){try{var w=n();return w&&w._v736?w._v736:null;}catch(e){return null;}}
  function active(){return !!cs();}
  function state(){try{return typeof S!=="undefined"&&S?S:(root.S||null);}catch(e){return root.S||null;}}
  function visible(id){try{var el=root.document&&root.document.getElementById(id);if(!el)return false;if(el.classList&&el.classList.contains("hidden"))return false;var s=root.getComputedStyle?root.getComputedStyle(el):el.style;return !s||s.display!=="none"&&s.visibility!=="hidden"&&Number(s.opacity||1)!==0;}catch(e){return false;}}
  function blocked(){try{var quality=root.TechOpsGameplayExperience;if(quality&&quality.blocked(n()))return true;var s=state();return !!(root.__goodBoysHideHud||(s&&s.inDialog)||visible("dialogue")||visible("v725-cine")||visible("good-boys-story-cine")||visible("gb-prison-cine")||visible("good-boys-earthfall-cine")||visible("good-boys-campaign-intro"));}catch(e){return false;}}
  function mission(){try{var a=root.TechOpsGoodBoysProgressionAuthority;if(a&&typeof a.mission==="function")return Number(a.mission())||1;var m=root.S&&root.S.meta&&root.S.meta._v736;return Math.max(1,Math.min(8,Number(m&&m.m||cs()&&cs().m||1)));}catch(e){return 1;}}
  function seq(){try{return root.TechOpsGoodBoysCanon&&root.TechOpsGoodBoysCanon.SEQUENCE||null;}catch(e){return null;}}
  function box(x,a,b,w,h,r){x.beginPath();if(x.roundRect)x.roundRect(a,b,w,h,r);else x.rect(a,b,w,h);}
  function bar(x,a,b,w,h,val,max,col){var p=Math.max(0,Math.min(1,(Number(val)||0)/Math.max(1,Number(max)||1)));x.fillStyle="rgba(0,0,0,.62)";x.fillRect(a,b,w,h);x.fillStyle=col;x.fillRect(a+1,b+1,(w-2)*p,h-2);}
  function canon(){try{var s=seq();if(s&&s[4]){s[4].name="CELL 118";s[4].objective="VERIFY K · FREE K";}if(s&&s[6]){s[6].name="CELL 1984";s[6].objective="FREE WALDO · BREAK LOCKDOWN";}return true;}catch(e){return false;}}
  var lastLayout=null;
  function now(){return root.performance&&root.performance.now?root.performance.now():Date.now();}
  function ownsMessage(world){return world===n()&&!!cs()&&!blocked()&&Number(world.msgT)>now()&&!!String(world.msg||"");}
  function message(world,guide){
    if(!ownsMessage(world))return "";
    var repeated={4:"VERIFY THE PRISONER IN CELL 118",6:"WALDO IS IN CELL 1984",7:"REACH THE MAINTENANCE SHUTTLE"};
    if(guide&&Number(guide.mission)===mission()&&(world.msg===guide.text||world.msg===repeated[mission()]))return "";
    return String(world.msg||"");
  }
  function wrap(x,text,width){
    var lines=[],line="";
    String(text||"").split(/\s+/).filter(Boolean).forEach(function(word){
      var trial=line?line+" "+word:word;
      if(x.measureText(trial).width<=width){line=trial;return;}
      if(line){lines.push(line);line="";}
      while(word&&x.measureText(word).width>width){
        var end=1;while(end<word.length&&x.measureText(word.slice(0,end+1)).width<=width)end++;
        lines.push(word.slice(0,end));word=word.slice(end);
      }
      line=word;
    });
    if(line)lines.push(line);return lines;
  }
  function drawHud(x,NM){
    var saved=false;
    try{
      var c=cs();if(!c||blocked()){lastLayout=null;return;}canon();
      var helper=root.TechOpsRuntimeHud,view=helper&&helper.viewport?helper.viewport(x.canvas):{width:x.canvas.width,height:x.canvas.height,scaleX:1,scaleY:1};
      var W=view.width,m=mission(),sequence=seq(),cfg=sequence&&sequence[m]||{};
      var guide=root.TechOpsGameplayExperience&&root.TechOpsGameplayExperience.objective(NM);
      var pad=8,gap=6,centerW=Math.min(164,Math.max(86,W*.24)),edgeW=Math.min(210,(W-centerW-pad*2-gap*2)/2),h=50,y=6;
      var coop=!!(root.TechOpsGoodDogsCoop&&root.TechOpsGoodDogsCoop.active()),aw=c.active==="manchez"?"manchez":"katrin";
      x.save();saved=true;if(view.scaleX!==1||view.scaleY!==1)x.scale(view.scaleX,view.scaleY);
      x.textBaseline="alphabetic";
      lastLayout={width:W,height:view.height,font:13,cards:[],objective:null,message:null,players:[],text:guide?guide.text:cfg.objective||"",detail:guide&&guide.detail||""};
      function card(who,left){
        var ch=c.chars&&c.chars[who]||{},hp=who===aw&&NM&&isFinite(NM.hp)?NM.hp:(Number(ch.hp)||0),mx=Number(ch.maxHp)||100;
        var col=who==="katrin"?C.katrin:C.manchez,px=left?pad:W-pad-edgeW;
        var role=coop?(who===aw?"P1":"P2"):(who===aw?"YOU":"AI");
        x.fillStyle="rgba(2,8,14,.94)";x.strokeStyle=col;x.lineWidth=1.5;box(x,px,y,edgeW,h,6);x.fill();x.stroke();
        x.textAlign="left";x.fillStyle=col;x.font="bold 13px monospace";x.fillText(who.toUpperCase(),px+6,y+16);
        bar(x,px+6,y+23,edgeW-12,7,hp,mx,C.red);
        x.fillStyle="#e4f3ff";x.font="13px monospace";
        x.fillText(ch.out?"OUT":ch.downed?"DOWN":Math.max(0,Math.round(hp))+"/"+mx,px+6,y+44);
        x.textAlign="right";x.fillStyle=col;x.fillText(role,px+edgeW-6,y+44);
        lastLayout.cards.push({x:px,y:y,width:edgeW,height:h});lastLayout.players.push({who:who,role:role,hp:hp,maxHp:mx,downed:!!ch.downed,out:!!ch.out});
      }
      card("katrin",true);card("manchez",false);
      var cx=(W-centerW)/2,sync=Math.max(0,Math.min(100,Number(c.sync)||0)),accent=cfg.light==="emergency_red"?C.red:(cfg.light==="hack_green"?C.green:(cfg.light==="earthfall_gold"?C.gold:C.cyan));
      x.fillStyle="rgba(2,8,14,.94)";x.strokeStyle=accent;x.lineWidth=1.25;box(x,cx,y,centerW,h,6);x.fill();x.stroke();
      x.textAlign="center";x.fillStyle=accent;x.font="bold 13px monospace";x.fillText("MISSION "+m,W/2,y+16);
      x.fillStyle="#e4f3ff";x.font="13px monospace";x.fillText("SYNC "+Math.round(sync)+"%",W/2,y+33);
      bar(x,cx+7,y+39,centerW-14,6,sync,100,sync>=100?C.green:C.cyan);
      lastLayout.cards.push({x:cx,y:y,width:centerW,height:h});
      function strip(text,detail,top,color){
        x.font="bold 13px monospace";var lines=wrap(x,text,W-pad*2-16);
        x.font="13px monospace";var details=wrap(x,detail,W-pad*2-16);
        var height=12+(lines.length+details.length)*16;
        x.fillStyle="rgba(2,8,14,.92)";x.strokeStyle="rgba(120,210,255,.35)";x.lineWidth=1;box(x,pad,top,W-pad*2,height,4);x.fill();x.stroke();
        x.textAlign="center";x.fillStyle=color||"#eef8ff";x.font="bold 13px monospace";
        lines.forEach(function(line,i){x.fillText(line,W/2,top+17+i*16);});
        x.fillStyle="#c5e5f5";x.font="13px monospace";
        details.forEach(function(line,i){x.fillText(line,W/2,top+17+(lines.length+i)*16);});
        return {x:pad,y:top,width:W-pad*2,height:height,lines:lines,details:details};
      }
      lastLayout.objective=strip(lastLayout.text,lastLayout.detail,y+h+6);
      var unique=message(NM,guide);
      if(unique)lastLayout.message=strip(unique,"",lastLayout.objective.y+lastLayout.objective.height+6,C.gold);
      if(NM)NM._goodBoysHudAuthority="single_hud_v2";
    }catch(e){root.__goodBoysHudLiteDrawError=String(e&&e.stack||e);}
    finally{if(saved)x.restore();}
  }
  drawHud.__goodBoysHudLite=true;
  function noHud(){return;}noHud.__goodBoysHudLite=true;
  function install(){try{canon();var gd=root.TechOpsGoodDogsProduction,g=root.TechOpsGoodBoysGameplayLoop,gc=root.TechOpsGoodBoysCanon;if(!gd||!g||!gc)return false;gd.drawReferenceHUD=drawHud;g.drawLoopOverlay=noHud;gc.drawHud=noHud;installed=gd.drawReferenceHUD===drawHud&&g.drawLoopOverlay===noHud&&gc.drawHud===noHud;root.__goodBoysHudLiteInstalled=installed;return installed;}catch(e){root.__goodBoysHudLiteInstallError=String(e&&e.stack||e);return false;}}
  function acceptance(){var w=n();return{version:VERSION,installed:installed,active:active(),mission:mission(),authority:w&&w._goodBoysHudAuthority||null,kAt118:!!(seq()&&seq()[4]&&/K/.test(seq()[4].objective||"")),waldoAt1984:!!(seq()&&seq()[6]&&/WALDO/.test(seq()[6].objective||"")),blocked:blocked(),drawError:root.__goodBoysHudLiteDrawError||null,installError:root.__goodBoysHudLiteInstallError||null};}
  install();try{(root.setTimeout||setTimeout)(install,140);}catch(e){}
  root.TechOpsGoodBoysHudLite={VERSION:VERSION,drawHud:drawHud,install:install,acceptance:acceptance,ownsMessage:ownsMessage,layout:function(){return lastLayout;}};
})(typeof globalThis!=="undefined"?globalThis:this);
