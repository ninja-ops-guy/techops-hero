/* TechOps Hero — Good Boys legacy HUD filter v1.
 * Loaded before the production compositor captures the parser Night draw chain.
 * Preserves all v7.36 world/combat rendering while suppressing only its old
 * duplicate duo HUD once the final single-HUD authority is active.
 */
(function(root){
  "use strict";
  if(!root||root.TechOpsGoodBoysLegacyHudFilter)return;
  var VERSION=1,base=null,installed=false,suppressed=0;
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
        var oFillRect=x.fillRect,oStrokeRect=x.strokeRect,oFillText=x.fillText,oDrawImage=x.drawImage;
        function blockRect(a,b,w,h){
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
