/* TechOps Hero — production Good Dogs co-op authority.
 * Fixes the live 118/1984 entry path and render authority after the historical hook stack:
 *  - entering the co-op side story must not fall through the generic Night Crawl cinematic;
 *  - the controlled body is Katrin/Manchez, never Mike/Night Walker;
 *  - partner locomotion uses conservative dog frames instead of action poses as fake walking;
 *  - mobile gets explicit SWAP / SYNC / K SUPPORT controls.
 */
(function(root){
  "use strict";
  if (!root || root.TechOpsGoodDogsProduction) return;
  var VERSION = 1;
  var gdImage = null;
  var starting = false;
  var baseEnterNight = null;
  var baseNightPlayer = null;

  function atlas(){ return root.KATRIN_MANCHEZ || null; }
  function atlasReady(){
    try {
      var A=atlas(); if(!A||!A.src||!A.frames||typeof root.Image!=="function") return null;
      if(!gdImage){gdImage=new root.Image();gdImage.src=A.src;}
      return gdImage.complete&&gdImage.naturalWidth?gdImage:null;
    }catch(e){return null;}
  }
  function campaign(){ try{return root.NM&&root.NM._v736?root.NM._v736:null;}catch(e){return null;} }
  function activeWho(){ var cs=campaign(); return cs&&cs.active==="manchez"?"manchez":"katrin"; }

  function conservativeFrame(who,NM,now){
    var p=who==="manchez"?"man_":"kat_", A=atlas(), has=function(k){return !!(A&&A.frames&&A.frames[k]);};
    if(!NM||NM.hp<=0) return p+"down";
    if(NM.ifr>0&&has(p+"wall_hit")) return p+"wall_hit";
    if(NM.dashT>0&&has(p+"roll")) return p+"roll";
    if(NM.jabAnim>0){
      if(NM.jabStage===2&&has(p+"strike")) return p+"strike";
      return has(p+"pounce")?p+"pounce":p+"strike";
    }
    if(NM.block&&has(p+"shield")) return p+"shield";
    if(!NM.onGround&&has(p+"leap")) return p+"leap";
    /* There is no authored walk cycle in the recovered source. Keep locomotion
       readable by alternating the two neutral dog poses only. */
    if(Math.abs(NM.vx||0)>.45) return p+((Math.floor((now||0)/150)%2)?"idle1":"idle0");
    return p+((Math.floor((now||0)/650)%2)?"idle1":"idle0");
  }

  function drawDogFrame(x,key,cx,base,h,flip){
    try{
      var A=atlas(),img=atlasReady(),fr=A&&A.frames&&A.frames[key];
      if(!img||!fr||fr.length<4) return false;
      var dw=h*(fr[2]/fr[3]);
      x.save();x.imageSmoothingEnabled=false;
      /* Ground shadow gives both dogs the same physical contact language as Night Walker. */
      x.globalAlpha=.28;x.fillStyle="#000";x.beginPath();x.ellipse(cx,base-2,Math.max(18,dw*.30),5,0,0,Math.PI*2);x.fill();x.globalAlpha=1;
      if(flip){x.translate(cx,0);x.scale(-1,1);x.drawImage(img,fr[0],fr[1],fr[2],fr[3],-dw/2,base-h,dw,h);}else{x.drawImage(img,fr[0],fr[1],fr[2],fr[3],cx-dw/2,base-h,dw,h);}
      x.restore();return true;
    }catch(e){return false;}
  }

  function drawActiveDog(x,NM,px,py,now){
    var cs=campaign(); if(!cs||!cs.active) return false;
    var who=activeWho(), c=cs.chars&&cs.chars[who]; if(c&&c.downed) return false;
    var h=Math.max(68,(NM.h||34)*2.05),cx=px+(NM.w||22)/2,base=py+(NM.h||34)+5;
    return drawDogFrame(x,conservativeFrame(who,NM,now||0),cx,base,h,(NM.face||1)<0);
  }

  function normalizePartnerIdleFrames(){
    /* v7.36 historically cycles seven frames, several of which are action poses.
       Alias those slots to the two neutral reference poses until a true walk row exists. */
    try{
      var A=atlas(); if(!A||!A.frames) return false;
      ["kat","man"].forEach(function(p){
        var a=A.frames[p+"_idle0"],b=A.frames[p+"_idle1"]||a;
        if(!a)return;
        for(var i=2;i<7;i++) A.frames[p+"_idle"+i]=(i%2?b:a);
      });
      return true;
    }catch(e){return false;}
  }

  function markStarting(){ starting=true; root.__TECHOPS_GOOD_DOGS_STARTING=true; }
  function isStarting(){ return !!(starting||root.__TECHOPS_GOOD_DOGS_STARTING); }

  function installEntryFix(){
    try{
      if(typeof root.enterNight!=="function"||root.enterNight.__goodDogsProduction) return false;
      baseEnterNight=root.enterNight;
      root.enterNight=function(){
        if(!isStarting()) return baseEnterNight.apply(this,arguments);
        var r=baseEnterNight.apply(this,arguments);
        /* v7.22 owns an asynchronous Night Drive wrapper. Skip it immediately for
           Good Dogs so its callback creates NM synchronously; v7.36 can then attach
           NM._v736 and load the correct mission instead of returning into Downtown. */
        try{if(root.v722&&typeof root.v722.active==="function"&&root.v722.active()&&typeof root.v722.skip==="function")root.v722.skip();}catch(e){}
        starting=false;root.__TECHOPS_GOOD_DOGS_STARTING=false;
        return r;
      };
      root.enterNight.__goodDogsProduction=true;
      return true;
    }catch(e){return false;}
  }

  function installStartCapture(){
    try{
      if(root.document&&!root.document.__goodDogsStartCapture){
        root.document.addEventListener("click",function(e){try{var t=e.target&&e.target.closest?e.target.closest("#btn-v736"):null;if(t)markStarting();}catch(_){}},true);
        root.document.__goodDogsStartCapture=true;
      }
      if(root.v736&&typeof root.v736.start==="function"&&!root.v736.start.__goodDogsProduction){
        var s=root.v736.start;root.v736.start=function(){markStarting();return s.apply(this,arguments);};root.v736.start.__goodDogsProduction=true;
      }
      return true;
    }catch(e){return false;}
  }

  function installPlayerAuthority(){
    try{
      if(typeof root.drawNightPlayerAtlas!=="function"||root.drawNightPlayerAtlas.__goodDogsProduction)return false;
      baseNightPlayer=root.drawNightPlayerAtlas;
      root.drawNightPlayerAtlas=function(x,NM,px,py,now){
        if(NM&&NM._v736){ if(drawActiveDog(x,NM,px,py,now)) return true; return false; }
        return baseNightPlayer.apply(this,arguments);
      };
      root.drawNightPlayerAtlas.__goodDogsProduction=true;
      return true;
    }catch(e){return false;}
  }

  function ensureMobileControls(){
    try{
      if(!root.document)return false;
      var id="good-dogs-touch",box=root.document.getElementById(id);
      var on=!!campaign();
      if(!box){
        box=root.document.createElement("div");box.id=id;
        box.style.cssText="position:fixed;right:max(92px,calc(env(safe-area-inset-right) + 92px));bottom:max(24px,calc(env(safe-area-inset-bottom) + 24px));z-index:9998;display:none;flex-direction:column;gap:8px;pointer-events:auto";
        function b(label,fn){var el=root.document.createElement("button");el.textContent=label;el.style.cssText="min-width:74px;min-height:44px;border:2px solid #8fd8ff;border-radius:10px;background:#07111ddd;color:#eef9ff;font:bold 10px monospace;box-shadow:0 0 12px #3fa9f566";el.addEventListener("pointerdown",function(ev){ev.preventDefault();ev.stopPropagation();try{fn();}catch(_){}},{passive:false});return el;}
        box.appendChild(b("⇄ SWAP",function(){if(root.v736&&root.v736.swap)root.v736.swap();}));
        box.appendChild(b("🤝 SYNC",function(){if(root.v736&&root.v736.finisher)root.v736.finisher();}));
        box.appendChild(b("K SUPPORT",function(){if(root.v736&&root.v736.support)root.v736.support();}));
        root.document.body.appendChild(box);
      }
      box.style.display=on?"flex":"none";
      return true;
    }catch(e){return false;}
  }

  function tick(){normalizePartnerIdleFrames();installStartCapture();installEntryFix();installPlayerAuthority();ensureMobileControls();}
  tick();
  var timer=null;try{timer=root.setInterval(tick,350);}catch(e){}
  root.TechOpsGoodDogsProduction={VERSION:VERSION,atlasReady:atlasReady,conservativeFrame:conservativeFrame,drawActiveDog:drawActiveDog,normalizePartnerIdleFrames:normalizePartnerIdleFrames,markStarting:markStarting,installEntryFix:installEntryFix,installStartCapture:installStartCapture,installPlayerAuthority:installPlayerAuthority,ensureMobileControls:ensureMobileControls,tick:tick,timer:timer};
})(typeof globalThis!=="undefined"?globalThis:this);
