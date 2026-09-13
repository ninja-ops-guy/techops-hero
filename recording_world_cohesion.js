/* TechOps Hero — recording-derived world cohesion v1.
 * Evidence: 2026-09-12 physical-iPhone gameplay recording.
 * Fixes rendering-authority duplication and dresses the existing Night collision
 * geometry without changing physics, combat, progression, or district bindings.
 */
(function(root){
  'use strict';
  if(!root||root.TechOpsRecordingWorldCohesion)return;
  let installed=false,legacyPlayer=null,baseDraw=null,baseRegister=null;
  const state=()=>{try{return root.S||null;}catch(_){return null;}};
  const world=()=>{try{const s=state();return s&&s.nightMode||null;}catch(_){return null;}};
  const ordinaryNight=()=>{const n=world();return !!(n&&!n._v736&&!n._sector04&&typeof n.district==='string');};

  function suppressDuplicateNightPlayer(){
    if(typeof root.drawNightPlayerAtlas!=='function'||root.drawNightPlayerAtlas.__recordingSingleAuthority)return false;
    legacyPlayer=root.drawNightPlayerAtlas;
    function singleAuthority(ctx,n,px,py,now){
      /* v737/reference visuals own Mike in ordinary Night. Returning true tells
         the legacy renderer that the player has been handled, while the outer
         v737 pass draws the canonical sprite exactly once. Good Dogs/Sector 04
         retain their existing render paths. */
      if(ordinaryNight()&&root.TechOpsNightReferenceVisuals&&typeof root.TechOpsNightReferenceVisuals.drawReferenceNightWalker==='function')return true;
      return legacyPlayer.apply(this,arguments);
    }
    singleAuthority.__recordingSingleAuthority=true;
    singleAuthority.__recordingLegacy=legacyPlayer;
    root.drawNightPlayerAtlas=singleAuthority;
    root.__recordingNightPlayerAuthority='TechOpsNightReferenceVisuals';
    return true;
  }

  function platformPalette(n){
    const d=(root.NM_DISTRICTS&&n&&root.NM_DISTRICTS[n.district])||null;
    return {accent:d&&d.accent||'#7ec8ff',steel:'#263248',edge:'#7084a8',dark:'#101725',lamp:'#ffd27a'};
  }
  function dressPlatforms(ctx,n){
    if(!ctx||!n||n.drive||!Array.isArray(n.platforms))return false;
    if(root.TechOpsSceneArt&&root.TechOpsSceneArt.ready(n))return false; // already drawn behind actors at the canonical layer
    const pal=platformPalette(n),cam=Number(n.cam)||0,floor=typeof root.NM_FLOOR==='number'?root.NM_FLOOR:430,playerX=Number(n.x)||0;
    ctx.save();ctx.imageSmoothingEnabled=false;
    for(let i=0;i<n.platforms.length;i++){
      const p=n.platforms[i];if(!p||!(p.w>8))continue;
      const x=Math.round(p.x-cam),y=Math.round(p.y),w=Math.round(p.w),h=Math.max(4,Math.round(p.h||8));
      if(x>ctx.canvas.width+80||x+w<-80)continue;
      /* Give collision slabs an authored-world reading: dark fascia, bright lip,
         diagonal braces, posts and tiny safety lights. Physics rectangles stay
         untouched; this is presentation only. */
      ctx.fillStyle=pal.dark;ctx.fillRect(x,y,w,h+5);
      ctx.fillStyle=pal.steel;ctx.fillRect(x,y+3,w,Math.max(4,h+2));
      ctx.fillStyle=pal.edge;ctx.fillRect(x,y,w,2);
      ctx.fillStyle=pal.accent+'55';ctx.fillRect(x,y+2,w,1);
      const postXs=[p.x+8,p.x+p.w-8];
      if(p.w>110)postXs.push(p.x+p.w/2);
      for(const wx of postXs){
        if(Math.abs(wx-playerX)<54)continue;
        const sx=Math.round(wx-cam),top=y+h+4,bottom=Math.min(floor,top+92);
        if(bottom<=top)continue;
        ctx.fillStyle=pal.dark;ctx.fillRect(sx-2,top,4,bottom-top);
        ctx.strokeStyle=pal.edge+'99';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(sx,top+4);ctx.lineTo(sx+(wx<p.x+p.w/2?22:-22),Math.min(bottom,top+44));ctx.stroke();
      }
      if(p.w>70){
        ctx.fillStyle=pal.lamp;ctx.globalAlpha=.7;ctx.fillRect(x+10,y-4,3,3);ctx.fillRect(x+w-13,y-4,3,3);ctx.globalAlpha=1;
      }
    }
    ctx.restore();return true;
  }

  function wrapNightDraw(){
    if(typeof root.drawNM!=='function'||root.drawNM.__recordingWorldCohesion)return false;
    baseDraw=root.drawNM;
    function wrapped(){
      const result=baseDraw.apply(this,arguments);
      try{if(ordinaryNight())dressPlatforms(root.ctx||root.cv&&root.cv.getContext&&root.cv.getContext('2d'),world());}catch(e){root.__recordingPlatformDressError=String(e&&e.stack||e);}
      return result;
    }
    wrapped.__recordingWorldCohesion=true;wrapped.__recordingBase=baseDraw;root.drawNM=wrapped;return true;
  }

  function transitionSpec(id,original){
    const cine=root.v725,h=cine&&cine.h;if(!h)return original;
    const duration=root.matchMedia&&root.matchMedia('(prefers-reduced-motion: reduce)').matches?1000:2100;
    function wetStreet(x,tm,dawn){
      const W=x.canvas.width,H=x.canvas.height,roadY=Math.floor(H*.62);
      const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,dawn?'#233f68':'#060b17');g.addColorStop(.58,dawn?'#6c7890':'#111b31');g.addColorStop(1,dawn?'#c78d68':'#0b101d');x.fillStyle=g;x.fillRect(0,0,W,H);
      x.fillStyle=dawn?'#324257':'#10192c';
      for(let i=0;i<9;i++){const bw=70+(i*31%80),bh=90+(i*47%130),bx=(i*170-Math.floor(tm*.025))%(W+220)-90;x.fillRect(bx,roadY-bh,bw,bh);x.fillStyle=(dawn?'#ffd9a0':'#ffd36a')+'44';for(let yy=0;yy<3;yy++)for(let xx=0;xx<3;xx++)if((i+xx+yy)%2===0)x.fillRect(bx+12+xx*20,roadY-bh+16+yy*25,6,9);x.fillStyle=dawn?'#324257':'#10192c';}
      x.fillStyle=dawn?'#222b38':'#151c2a';x.fillRect(0,roadY,W,H-roadY);
      x.fillStyle='#d9aa4f66';for(let i=0;i<7;i++)x.fillRect(((i*160-tm*.08)%(W+160))-80,roadY+28,58,4);
      x.globalAlpha=.18;x.fillStyle=dawn?'#f7c88f':'#4ab7ff';for(let i=0;i<7;i++){const rx=((i*155-tm*.035)%(W+180))-90;x.fillRect(rx,roadY+8,34,Math.max(30,H-roadY-18));}x.globalAlpha=1;
      return roadY;
    }
    function exterior(x,tm,local){const road=wetStreet(x,tm,false),W=x.canvas.width;if(h.cityGlow)h.cityGlow(x,tm);if(root.nmCar)root.nmCar(x,W*.34,road-4,Math.min(260,W*.38),tm);if(h.mike)h.mike(x,'right0',W*.58+Math.min(W*.13,local/18),road+5,Math.min(132,W*.18));h.txt(x,'HOME BEFORE MORNING',W*.5,Math.max(82,x.canvas.height*.16),Math.min(24,W*.045),'#eef6ff','center',true);}
    function interior(x,tm){const W=x.canvas.width,H=x.canvas.height;h.bg(x,'#0d1626');h.panel(x,W*.22,H*.22,W*.56,H*.5,'#18283b');x.fillStyle='#8b6848';x.fillRect(W*.29,H*.70,W*.42,10);x.fillStyle='#e4c17a';x.fillRect(W*.60,H*.39,W*.08,H*.10);x.fillStyle='#44556b';x.fillRect(W*.64,H*.49,5,H*.16);if(h.mike)h.mike(x,'down0',W*.43,H*.72,Math.min(145,W*.2));h.txt(x,'THE CITY STAYS OUTSIDE',W*.5,H*.16,Math.min(22,W*.042),'#dbe8f0','center',true);}
    function dawn(x,tm){const road=wetStreet(x,tm,true),W=x.canvas.width,H=x.canvas.height;if(root.nmCar)root.nmCar(x,W*.72,road-4,Math.min(230,W*.34),tm);h.txt(x,id==='night_sector_dawn'?'TUESDAY':'MORNING',W*.5,H*.18,Math.min(30,W*.055),'#fff0d5','center',true);h.txt(x,id==='night_sector_dawn'?'The investigation moves into daylight.':'A new shift. The unfinished work is still there.',W*.5,H*.84,Math.min(17,W*.032),'#fff0d5','center',true);}
    const title=id==='night_sector_dawn'?'AFTER HOURS / TUESDAY':id==='night_return_investigation'?'BACK TO THE INVESTIGATION':'HOME BEFORE MORNING';
    return {title,cues:{0:'silence',1:'silence',2:'silence'},shots:[{dur:duration,cap:'The streets fall behind you.',draw:exterior},{dur:duration,cap:'For a moment, everything is quiet.',draw:interior},{dur:duration,cap:id==='night_sector_dawn'?'Tuesday is already waiting.':'Morning comes. The queue is waiting.',draw:dawn}]};
  }
  function wrapCinematicRegistration(){
    const cine=root.v725;if(!cine||typeof cine.register!=='function'||cine.register.__recordingWorldCohesion)return false;
    baseRegister=cine.register;
    function register(id,spec){if(id==='night_home_return'||id==='night_return_investigation'||id==='night_sector_dawn')spec=transitionSpec(id,spec);return baseRegister.call(this,id,spec);}
    register.__recordingWorldCohesion=true;register.__recordingBase=baseRegister;cine.register=register;
    try{root.TechOpsNightRuntime&&root.TechOpsNightRuntime.registerScenes&&root.TechOpsNightRuntime.registerScenes();}catch(e){root.__recordingTransitionRegisterError=String(e&&e.stack||e);}
    return true;
  }

  function install(){if(installed)return true;installed=true;suppressDuplicateNightPlayer();wrapNightDraw();wrapCinematicRegistration();return true;}
  root.TechOpsRecordingWorldCohesion={VERSION:1,install,suppressDuplicateNightPlayer,wrapNightDraw,wrapCinematicRegistration,dressPlatforms,ordinaryNight};
  install();
})(typeof globalThis!=='undefined'?globalThis:this);
