/* Good Boys Earthfall ending authority v3.
 * Owns the M8 return-home sequence and campaign completion. This prevents the
 * authored route from falling back into the legacy v7.36 b736m8 canvas reel.
 */
(function(root){
  "use strict";
  if(!root)return;
  try{var old=root.TechOpsGoodBoysEarthfallEnding;if(old&&old.timer&&root.clearInterval)root.clearInterval(old.timer);if(old&&old.detachInput)old.detachInput();}catch(_){}
  var VERSION=3,running=false,complete=false,scene=0,overlay=null,canvas=null,ctx=null,raf=0,img=null,lastFrame="",timer=null,inputAttached=false;
  var SCENES=[
    {title:"ESCAPE BURN",kicker:"BLACKSITE MERIDIAN · SHUTTLE BAY",body:"The Warden is down. K drags the route controls offline while Waldo seals the maintenance hatch. Katrin and Manchez are aboard before the prison can rebuild its lock.",goal:"K · WALDO · KATRIN · MANCHEZ — ACCOUNTED FOR",frames:["sh_takeoff","sh_climb","sh_thrust2"]},
    {title:"EARTHFALL",kicker:"REENTRY CORRIDOR",body:"The stolen shuttle was built for maintenance hops, not atmospheric return. Heat eats the telemetry. K keeps the guidance alive. Waldo points at the only patch of ground they all recognize.",goal:"HOLD THE LINE · KEEP THE SHIP TOGETHER",frames:["sh_reentry","sh_damage0","sh_damage1"]},
    {title:"WALDO'S PLACE",kicker:"DAWN · HOME VECTOR",body:"The shuttle clears the tree line and turns Waldo's hidden bay into a very visible problem. The garage survives. Mostly. The porch light is still on.",goal:"HOME IS NOT QUIET · HOME IS HOME",frames:["sh_crash","sh_wreck"]},
    {title:"GOOD BOYS PROTOCOL — COMPLETE",kicker:"118 FREE · 1984 FREE",body:"K walks out under his own name. Waldo walks back through his own door. Katrin and Manchez do what they came to do: bring everyone home.",goal:"BREAKOUT COMPLETE · KATRIN + MANCHEZ UNLOCKED",frames:["sh_wreck"],cta:"END OPERATION"}
  ];
  function now(){return root.performance&&root.performance.now?root.performance.now():Date.now();}
  function meta(){try{if(!root.S)return null;root.S.meta=root.S.meta||{};var m=root.S.meta._v736||(root.S.meta._v736={m:1,evidence:[],k:false,waldo:false,done:false});if(m.done&&Number(m.m)>8){m.m=8;root.__goodBoysTerminalMissionNormalized=true;}return m;}catch(e){return null;}}
  function cs(){try{return root.NM&&root.NM._v736?root.NM._v736:null;}catch(e){return null;}}
  function mission(){try{var c=cs(),m=meta();return Number(c&&c.m||m&&m.m||0)||0;}catch(e){return 0;}}
  function save(){try{if(typeof root.save==="function")root.save();else if(typeof root.saveGame==="function")root.saveGame();}catch(_){} }
  function bgSrc(){try{var b=root.NM_BG734&&root.NM_BG734.goodboys_earthfall;if(b&&b.src)return b.src;var map=root.GOOD_BOYS_CAMPAIGN_BACKGROUND_SOURCE,k=map&&map.goodboys_earthfall,im=k&&root.NM_BG734&&root.NM_BG734[k];return im&&im.src||"";}catch(e){return "";}}
  function atlas(){try{return root.SHUTTLE&&root.SHUTTLE.src&&root.SHUTTLE.frames?root.SHUTTLE:null;}catch(e){return null;}}
  function atlasImage(){try{var a=atlas();if(!a)return null;if(!img||img.src!==a.src){img=new root.Image();img.src=a.src;}return img.complete&&img.naturalWidth?img:null;}catch(e){return null;}}
  function installStyle(){
    if(!root.document)return;var id="good-boys-earthfall-style",s=root.document.getElementById(id);if(s)return;
    s=root.document.createElement("style");s.id=id;s.textContent=[
      "#good-boys-earthfall-cine{position:fixed;inset:0;z-index:130000;background:#02050b center/cover no-repeat;color:#eef8ff;font-family:monospace;overflow:hidden;touch-action:none}",
      "#good-boys-earthfall-cine:before,#good-boys-earthfall-cine:after{content:'';position:absolute;left:0;right:0;height:7vh;background:#000;z-index:4}#good-boys-earthfall-cine:before{top:0}#good-boys-earthfall-cine:after{bottom:0}",
      "#good-boys-earthfall-cine canvas{position:absolute;inset:0;width:100%;height:100%;z-index:2;image-rendering:pixelated}",
      "#good-boys-earthfall-cine .gbe-shade{position:absolute;inset:0;z-index:1;background:linear-gradient(to bottom,rgba(1,4,8,.12),rgba(1,4,8,.28) 45%,rgba(1,4,8,.96))}",
      "#good-boys-earthfall-cine .gbe-card{position:absolute;z-index:5;left:50%;bottom:max(9vh,calc(env(safe-area-inset-bottom) + 28px));transform:translateX(-50%);width:min(720px,92vw);box-sizing:border-box;padding:16px 18px;border:2px solid #ffd166;border-radius:14px;background:rgba(2,7,13,.94);box-shadow:0 0 42px #000c}",
      "#good-boys-earthfall-cine .gbe-kicker{color:#ffd166;font:700 10px/1.3 monospace;letter-spacing:.09em}#good-boys-earthfall-cine h2{margin:7px 0 9px;color:#fff;font:800 21px/1.1 monospace}#good-boys-earthfall-cine p{margin:0 0 10px;color:#d9edf7;font:13px/1.5 monospace}#good-boys-earthfall-cine .gbe-goal{padding:8px 10px;margin:0 0 12px;border-left:3px solid #55dfff;background:#07131ddd;color:#bfeaff;font:800 10px/1.4 monospace}#good-boys-earthfall-cine button{width:100%;min-height:50px;border:2px solid #ffd166;border-radius:10px;background:#171107;color:#fff5d6;font:800 12px monospace;touch-action:manipulation}",
      "body.good-boys-earthfall-active #good-boys-director-controls{display:none!important;pointer-events:none!important}"
    ].join("");(root.document.head||root.document.documentElement).appendChild(s);
  }
  function drawFrame(t){
    try{
      if(!running||!ctx||!canvas)return;var dpr=Math.max(1,Math.min(2,root.devicePixelRatio||1)),w=Math.max(1,Math.round(canvas.clientWidth*dpr)),h=Math.max(1,Math.round(canvas.clientHeight*dpr));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}ctx.clearRect(0,0,w,h);
      var s=SCENES[scene],a=atlas(),im=atlasImage(),frames=s&&s.frames||[],idx=Math.floor(t/420)%Math.max(1,frames.length),key=frames[idx],fr=a&&a.frames&&a.frames[key];lastFrame=key||"";
      if(im&&fr){var targetW=Math.min(w*.48,460*dpr),targetH=targetW*(fr[3]/fr[2]),x=w*.5-targetW*.5,y=scene===0?h*.34:scene===1?h*.28:h*.43;ctx.save();ctx.imageSmoothingEnabled=false;if(scene===1){ctx.globalAlpha=.18;for(var i=0;i<8;i++){ctx.fillStyle="#fff";ctx.fillRect((w*((i*.137+(t/5000))%1)),h*.16+i*23*dpr,60*dpr,2*dpr);}}ctx.globalAlpha=1;ctx.drawImage(im,fr[0],fr[1],fr[2],fr[3],x,y,targetW,targetH);ctx.restore();}
      if(scene===1){var glow=.13+.07*Math.sin(t/90);ctx.fillStyle="rgba(255,112,46,"+glow+")";ctx.fillRect(0,0,w,h*.7);}if(scene===2){ctx.fillStyle="rgba(255,255,255,"+Math.max(0,.07*Math.sin(t/120))+")";ctx.fillRect(0,0,w,h);}raf=root.requestAnimationFrame?root.requestAnimationFrame(drawFrame):0;
    }catch(e){root.__goodBoysEarthfallDrawError=String(e&&e.stack||e);}
  }
  function render(){
    if(!overlay)return;var s=SCENES[scene];var card=overlay.querySelector(".gbe-card");if(!card)return;card.innerHTML='<div class="gbe-kicker">GOOD BOYS PROTOCOL · '+s.kicker+' · '+(scene+1)+' / '+SCENES.length+'</div><h2>'+s.title+'</h2><p>'+s.body+'</p><div class="gbe-goal">'+s.goal+'</div><button id="gbe-next">'+(s.cta||(scene===SCENES.length-1?'END OPERATION':'CONTINUE'))+'</button>';var b=card.querySelector("#gbe-next");if(b)b.addEventListener("click",next);
  }
  function finishFlags(){
    try{var m=meta();if(!m)return false;m.k=true;m.waldo=true;m.done=true;m.m=8;root.S.meta._v736breakout=true;root.S.meta._v736pair=true;try{root.localStorage&&root.localStorage.setItem("techops_char_1181984","katrin_manchez");}catch(_){}var c=cs();if(c){c.m=8;c.ending=true;}if(root.NM){root.NM.enemies=[];root.NM.clear=false;root.NM._gbEarthfallComplete=true;}complete=true;root.__goodBoysEarthfallCompleteAt=Date.now();save();return true;}catch(e){root.__goodBoysEarthfallCompleteError=String(e&&e.stack||e);return false;}
  }
  function detachInput(){try{if(inputAttached&&root.document)root.document.removeEventListener("keydown",onKey,true);}catch(_){}inputAttached=false;}
  function close(){try{if(raf&&root.cancelAnimationFrame)root.cancelAnimationFrame(raf);}catch(_){}raf=0;detachInput();try{if(overlay&&overlay.parentNode)overlay.parentNode.removeChild(overlay);}catch(_){}overlay=null;canvas=null;ctx=null;running=false;try{if(root.document&&root.document.body){root.document.body.classList.remove("good-boys-earthfall-active");root.document.body.classList.remove("good-boys-cinematic");}if(root.S)root.S.inDialog=false;}catch(_){} }
  function next(e){if(e){e.preventDefault();e.stopPropagation();}if(!running)return false;if(scene<SCENES.length-1){scene++;render();return true;}finishFlags();close();return true;}
  function onKey(e){try{if(!running||!e)return;var k=e.code||e.key;if(k==="KeyE"||k==="Enter"||k==="Space"||k===" "){next(e);}}catch(err){root.__goodBoysEarthfallInputError=String(err&&err.stack||err);}}
  function attachInput(){try{if(inputAttached||!root.document)return;root.document.addEventListener("keydown",onKey,true);inputAttached=true;}catch(e){root.__goodBoysEarthfallInputError=String(e&&e.stack||e);}}
  function begin(){
    try{
      var m=meta();if(!m||m.done){complete=!!(m&&m.done);return false;}if(running)return true;if(!root.document||!root.document.body){finishFlags();return true;}installStyle();running=true;scene=0;var c=cs();if(c)c.ending=true;if(root.NM){root.NM.enemies=[];root.NM.clear=false;}if(root.S)root.S.inDialog=true;root.document.body.classList.add("good-boys-earthfall-active");root.document.body.classList.add("good-boys-cinematic");overlay=root.document.createElement("div");overlay.id="good-boys-earthfall-cine";var bg=bgSrc();if(bg)overlay.style.backgroundImage='linear-gradient(to bottom,rgba(1,4,8,.05),rgba(1,4,8,.55)),url("'+String(bg).replace(/"/g,"%22")+'")';overlay.innerHTML='<div class="gbe-shade"></div><canvas aria-hidden="true"></canvas><div class="gbe-card"></div>';root.document.body.appendChild(overlay);canvas=overlay.querySelector("canvas");ctx=canvas&&canvas.getContext?canvas.getContext("2d"):null;attachInput();render();if(ctx&&root.requestAnimationFrame)raf=root.requestAnimationFrame(drawFrame);root.__goodBoysEarthfallStartedAt=Date.now();return true;
    }catch(e){root.__goodBoysEarthfallError=String(e&&e.stack||e);running=false;detachInput();return false;}
  }
  function tick(){try{var m=meta();if(!m)return;if(m.done){complete=true;return;}if(mission()===8&&!running)begin();}catch(e){root.__goodBoysEarthfallError=String(e&&e.stack||e);}}
  function acceptance(){var m=meta();return{version:VERSION,running:running,scene:scene+1,sceneCount:SCENES.length,lastFrame:lastFrame,mission:mission(),done:!!(m&&m.done),k:!!(m&&m.k),waldo:!!(m&&m.waldo),breakout:!!(root.S&&root.S.meta&&root.S.meta._v736breakout),pair:!!(root.S&&root.S.meta&&root.S.meta._v736pair),overlay:!!(root.document&&root.document.getElementById("good-boys-earthfall-cine")),complete:complete,terminalMissionNormalized:!!root.__goodBoysTerminalMissionNormalized};}
  timer=root.setInterval?root.setInterval(tick,90):null;
  root.TechOpsGoodBoysEarthfallEnding={VERSION:VERSION,SCENES:SCENES,begin:begin,next:next,finishFlags:finishFlags,tick:tick,acceptance:acceptance,detachInput:detachInput,timer:timer};
  tick();
})(typeof globalThis!=="undefined"?globalThis:this);