/* TechOps Hero — production runtime safety v2
 * Independent last-loaded safety loop for alternate modes.
 * Keeps Night/Good Boys render + input alive if a legacy hook throws and
 * surfaces the actual exception instead of leaving a black mobile screen.
 */
(function(root){
  "use strict";
  if(!root || root.TechOpsRuntimeSafety) return;
  var VERSION=2, raf=0, lastError=null, errorCount=0, lastOk=0;
  function state(){try{return (typeof S!=="undefined"&&S)?S:null;}catch(e){return null;}}
  function world(){try{return (typeof NM!=="undefined"&&NM)?NM:null;}catch(e){return null;}}
  function canvas(){try{return typeof cv!=="undefined"&&cv?cv:(root.document&&root.document.getElementById("game"));}catch(e){return null;}}
  function ctx(){try{return typeof g!=="undefined"&&g?g:(canvas()&&canvas().getContext("2d"));}catch(e){return null;}}
  function active(){var s=state();return !!(s&&s.nightMode);}
  function ensureVisible(){
    try{
      var c=canvas();if(c){c.style.display="block";c.style.visibility="visible";c.style.opacity="1";}
      var wrap=root.document&&root.document.getElementById("game-wrap");if(wrap){wrap.style.display="block";wrap.style.visibility="visible";wrap.style.opacity="1";}
      if(root.matchMedia&&root.matchMedia("(pointer:coarse)").matches){var t=root.document&&root.document.getElementById("touch-ui");if(t){t.classList.remove("hidden");t.style.removeProperty("display");}}
    }catch(e){}
  }
  function diagnostic(err){
    try{
      var c=canvas(),x=ctx();if(!c||!x)return;
      x.save();x.setTransform(1,0,0,1,0,0);x.fillStyle="#050913";x.fillRect(0,0,c.width,c.height);
      x.fillStyle="#7dd3fc";x.font="bold 18px monospace";x.fillText("NIGHT RUNTIME RECOVERY",24,42);
      x.fillStyle="#e5eef8";x.font="13px monospace";
      var msg=String(err&&err.message||err||"unknown render error").slice(0,180), lines=[];
      for(var i=0;i<msg.length;i+=48)lines.push(msg.slice(i,i+48));
      lines.forEach(function(line,i){x.fillText(line,24,76+i*18);});
      x.fillStyle="#94a3b8";x.fillText("Runtime kept alive; error captured for QA.",24,94+lines.length*18);
      x.restore();
    }catch(e){}
  }
  function safeDraw(){
    if(!active())return false;ensureVisible();
    try{
      if(typeof drawNM!=="function")throw new Error("drawNM missing");
      drawNM();lastOk=Date.now?Date.now():0;root.__nightRuntimeLastOk=lastOk;return true;
    }catch(e){lastError=e;errorCount++;root.__nightRuntimeRenderError=String(e&&e.stack||e);diagnostic(e);return false;}
  }
  function safeStep(dt){
    if(!active())return false;
    try{if(typeof stepNM!=="function")throw new Error("stepNM missing");stepNM(dt);return true;}
    catch(e){root.__nightRuntimeStepError=String(e&&e.stack||e);return false;}
  }
  var prev=0;
  function frame(ts){
    try{
      if(active()){
        /* requestAnimationFrame timestamps are milliseconds; gameplay stepNM
           consumes seconds. v1 passed 16-40 directly and could catapult a
           recovery frame across the entire stage. */
        var dtMs=prev?Math.min(40,Math.max(0,ts-prev)):16;prev=ts;
        var dt=dtMs/1000;
        /* Only provide an independent update when the main loop appears stalled. */
        var now=Date.now?Date.now():0;
        if(!root.__nightRuntimeLastOk || now-root.__nightRuntimeLastOk>250){safeStep(dt);}
        safeDraw();
      }else prev=ts;
    }catch(e){root.__nightRuntimeSafetyError=String(e&&e.stack||e);}
    raf=(root.requestAnimationFrame||function(fn){return setTimeout(function(){fn(Date.now());},16);})(frame);
  }
  function installErrorCapture(){
    try{root.addEventListener("error",function(ev){root.__lastWindowError=String((ev&&ev.error&&ev.error.stack)||ev&&ev.message||"window error");},true);
      root.addEventListener("unhandledrejection",function(ev){root.__lastUnhandledRejection=String(ev&&ev.reason&&ev.reason.stack||ev&&ev.reason||"unhandled rejection");},true);}catch(e){}
  }
  installErrorCapture();raf=(root.requestAnimationFrame||function(fn){return setTimeout(function(){fn(Date.now());},16);})(frame);
  root.TechOpsRuntimeSafety={VERSION:VERSION,state:state,world:world,active:active,ensureVisible:ensureVisible,safeDraw:safeDraw,safeStep:safeStep,diagnostic:diagnostic,get lastError(){return lastError;},get errorCount(){return errorCount;},raf:raf};
})(typeof globalThis!=="undefined"?globalThis:this);
