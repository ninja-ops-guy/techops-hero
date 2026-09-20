/* TechOps Hero — Good Boys legacy HUD filter v3.
 * Loaded before the production compositor captures the parser Night draw chain.
 * Preserves all v7.36 world/combat rendering while suppressing only its old
 * duplicate duo HUD and the shared Night Crawler status bars once the final
 * single-HUD authority is active. Unique center messages remain visible;
 * only exact repeated briefing/objective strings lose the competing strip.
 */
(function(root){
  "use strict";
  if(!root||root.TechOpsGoodBoysLegacyHudFilter)return;
  var VERSION=3,base=null,installed=false,suppressed=0;
  var REPEATED_BRIEFING=Object.freeze({4:"VERIFY THE PRISONER IN CELL 118",6:"WALDO IS IN CELL 1984",7:"REACH THE MAINTENANCE SHUTTLE"});
  function active(){try{return !!(root.__goodBoysHudLiteInstalled&&root.NM&&root.NM._v736&&root.ctx);}catch(e){return false;}}
  function near(a,b,t){return Math.abs(Number(a)-Number(b))<=(t==null?.75:t);}
  function install(){
    try{
      var fn=root.__techopsFinalParserDrawNM;
      if(typeof fn!=="function")return false;
      if(fn.__goodBoysLegacyHudFiltered){installed=true;return true;}
      base=fn;
      var wrapped=function(){
        if(!active())return base.apply(this,arguments);
        var x=root.ctx;if(!x)return base.apply(this,arguments);
        var W=x.canvas&&x.canvas.width||0;
        var n=root.NM,c=n._v736,guide=null,messageLines=null,messageY=0,msgFont=W<620?10:13;
        try{guide=root.TechOpsGameplayExperience&&root.TechOpsGameplayExperience.objective(n);}catch(_){}
        var sameMission=guide&&Number(guide.mission)===Number(c.m),duplicateMessage=!!(sameMission&&(n.msg===guide.text||n.msg===REPEATED_BRIEFING[c.m]));
        var duplicateDecrypt=!!(sameMission&&Number(c.m)===6&&guide.phase==="decrypt"&&Number(c.decrypt)>0);
        var cell=null;try{var staging=root.TechOpsOrbitalStaging,art=root.TechOpsArtHandoff,registry=root.TechOpsLevelRegistry;if(Number(c.m)===4&&c.evidence&&!c.cellOpened&&staging&&staging.profile(n)&&art&&art.image('prison')&&registry&&registry.goodDogsCell118)cell=registry.goodDogsCell118();}catch(_){}
        var oFillRect=x.fillRect,oStrokeRect=x.strokeRect,oFillText=x.fillText,oDrawImage=x.drawImage;
        function blockObjectiveRect(a,b,w,h){
          if(!duplicateMessage||typeof x.measureText!=="function"||!near(w,Math.min(520,W-16))||!near(a,(W-w)/2)||![96,142,170].some(function(y){return near(b,y);}))return false;
          var lines=[];String(n.msg||"").split(/\s+/).forEach(function(word){var last=lines.length-1,trial=last<0?word:lines[last]+" "+word;if(last<0||x.measureText(trial).width>w-18)lines.push(word);else lines[last]=trial;});
          if(lines.length>3){lines.length=3;lines[2]=lines[2].replace(/[.…]*$/,"…");}
          if(!near(h,12+lines.length*(msgFont+4)))return false;messageLines=lines;messageY=b;return true;
        }
        function blockRect(a,b,w,h){
          if(blockObjectiveRect(a,b,w,h))return true;
          if(duplicateDecrypt&&((near(a,W/2-150)&&near(b,136)&&near(w,300)&&near(h,20))||(near(a,W/2-146)&&near(b,140)&&near(w,292*(1-c.decrypt/60))&&near(h,12))))return true;
          if(cell&&near(a,cell.entranceX-(n.cam||0))&&near(b,(root.NM_FLOOR||430)-160)&&near(w,90)&&near(h,160))return true;
          /* responsive shared HUD cards used below 620px */
          if(b<=10&&h>=60&&w>=130)return true;
          if(b>=12&&b<=46&&h<=11&&w<=170)return true;
          /* shared Night Crawler left status card / HP / focus pips */
          if(near(a,10)&&near(b,10)&&near(w,250)&&near(h,76))return true;
          if(near(a,18)&&near(b,18)&&w<=161&&near(h,10))return true;
          if(a>=65&&a<=147&&near(b,38)&&w<=11&&h<=9)return true;
          /* shared Night Crawler district/danger card */
          if(W&&near(a,W-262)&&near(b,10)&&near(w,252)&&near(h,62))return true;
          if(W&&near(a,W-100)&&near(b,40)&&w<=81&&h<=9)return true;
          /* v7.36 duo card */
          if(near(a,10)&&near(b,92)&&near(w,250)&&near(h,66))return true;
          /* v7.36 duo HP rows */
          if(near(a,76)&&((b>=100&&b<=112)||(b>=120&&b<=132))&&h<=10&&w<=132)return true;
          /* v7.36 sync track */
          if(near(a,16)&&b>=139&&b<=145&&near(w,240)&&h<=14)return true;
          /* v7.36 campaign banner */
          if(W&&near(a,W-262)&&b>=76&&b<=80&&near(w,252)&&near(h,22))return true;
          return false;
        }
        function blockText(text,a,b){
          var s=String(text||"");
          if(messageLines&&near(a,W/2)&&messageLines.some(function(line,i){return s===line&&near(b,messageY+10+(i+1)*(msgFont+3));}))return true;
          if(duplicateDecrypt&&s==="K DECRYPTING CELL 1984 — "+Math.ceil(c.decrypt)+"s"&&near(a,W/2)&&near(b,150))return true;
          if(cell&&s==="CELL 118"&&near(a,cell.labelX-(n.cam||0))&&near(b,(root.NM_FLOOR||430)-172))return true;
          if(b<90&&(s==="HP"||s==="FOCUS"||s==="DANGER"||/^\$/.test(s)||/^COMBO\s×/.test(s)||/^×\d+/.test(s)))return true;
          if(W&&a>=W*.48&&b<90)return true;
          if(a<=220&&b>=98&&b<=136&&(/^(?:▶\s*)?(?:KATRIN|MANCHEZ)$/.test(s)||/^DOWN\s/.test(s)||s==="OUT"))return true;
          if(a<=260&&b>=158&&b<=170&&(/^SYNC(?:\s|$)/.test(s)||/^K\s(?:READY|⏳)/.test(s)))return true;
          if(W&&a>=W-30&&b>=86&&b<=98&&/^118\/1984\s·\sM/.test(s))return true;
          return false;
        }
        x.fillRect=function(a,b,w,h){if(blockRect(a,b,w,h)){suppressed++;return;}return oFillRect.apply(this,arguments);};
        x.strokeRect=function(a,b,w,h){if(blockRect(a,b,w,h)){suppressed++;return;}return oStrokeRect.apply(this,arguments);};
        x.fillText=function(text,a,b){if(blockText(text,a,b)){suppressed++;return;}return oFillText.apply(this,arguments);};
        x.drawImage=function(){
          /* CAMP_UI meter_hack: 9-arg drawImage(...,16,140,240,14). */
          if(arguments.length>=9&&near(arguments[5],16)&&arguments[6]>=137&&arguments[6]<=144&&near(arguments[7],240)&&arguments[8]<=16){suppressed++;return;}
          return oDrawImage.apply(this,arguments);
        };
        try{return base.apply(this,arguments);}finally{x.fillRect=oFillRect;x.strokeRect=oStrokeRect;x.fillText=oFillText;x.drawImage=oDrawImage;root.__goodBoysLegacyHudSuppressed=suppressed;}
      };
      wrapped.__goodBoysLegacyHudFiltered=true;
      root.__techopsFinalParserDrawNM=wrapped;
      installed=true;root.__goodBoysLegacyHudFilterInstalled=true;return true;
    }catch(e){root.__goodBoysLegacyHudFilterError=String(e&&e.stack||e);return false;}
  }
  function acceptance(){return{version:VERSION,installed:installed,active:active(),suppressed:suppressed,error:root.__goodBoysLegacyHudFilterError||null};}
  install();
  root.TechOpsGoodBoysLegacyHudFilter={VERSION:VERSION,install:install,acceptance:acceptance};
})(typeof globalThis!=="undefined"?globalThis:this);
