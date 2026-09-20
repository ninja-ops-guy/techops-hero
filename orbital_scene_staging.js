/* Good Dogs M4-M7 staging. Reuses the approved prison atlas and registry anchors.
 * Called only by the existing art renderer; no frame loop, collision or saves.
 * These are staged raster compositions, not replacement art or DCC masters. */
(function(root){
  'use strict';
  if(!root||root.TechOpsOrbitalStaging)return;
  var PROFILES=Object.freeze({
    4:Object.freeze({id:'detention',accent:'#55dfff',shadow:'#071321',pipe:6,section:'DETENTION / 118'}),
    5:Object.freeze({id:'access-core',accent:'#22c55e',shadow:'#071811',pipe:6,section:'ORPHEUS / CORE'}),
    6:Object.freeze({id:'surveillance',accent:'#ff475d',shadow:'#1a080f',pipe:6,section:'SURVEILLANCE / 1984'}),
    7:Object.freeze({id:'shuttle-bay',accent:'#f5b544',shadow:'#1a1022',pipe:7,section:'SERVICE / SHUTTLE'})
  });
  function profile(n){
    var c=n&&n._v736,m=c&&Number(c.m),s=root.S;
    if(!c||!s||s.gameOver||(s.nightMode!==n&&s.nightMode!==true)||!Object.prototype.hasOwnProperty.call(PROFILES,m))return null;
    var saved=s.meta&&s.meta._v736;if(saved&&Number(saved.m)!==m)return null;
    return PROFILES[m];
  }
  function calm(){try{return !!(root.matchMedia&&root.matchMedia('(prefers-reduced-motion: reduce)').matches);}catch(_){return true;}}
  function layout(n){
    var p=profile(n),r=root.TechOpsLevelRegistry,c=n&&n._v736;
    if(!p||!r||typeof r.goodDogsMission!=='function')return null;
    var row=r.goodDogsMission(c.m);if(!row||!row.stage)return null;
    var marks=row.stage.landmarks||[],items=[];
    function add(frame,x,height,depth,y,alpha){if(Number.isFinite(x))items.push({frame:frame,x:x,height:height,depth:depth,y:y||0,alpha:alpha==null?1:alpha});}
    // Subtle far/mid service runs connect the same architecture across scenes.
    add(p.pipe,360,90,.28,-185,.28);add(p.pipe,980,108,.55,-175,.48);add(p.pipe,1580,88,.55,-195,.40);
    // Approved service-balcony and cargo silhouettes sit well behind the
    // traversable plane. Their subdued treatment does not advertise new ledges.
    add(4,320,46,.28,-204,.28);add(10,1160,54,.55,-16,.32);
    if(c.m===4){
      var clues=Array.isArray(c.evidence)?c.evidence:null;
      if(clues)clues.slice(0,4).forEach(function(e){if(e)add(8,e.x,72,1,0,e.found?.45:1);});
      else marks.filter(function(l){return l.kind==='console';}).forEach(function(l){add(8,l.x,72,1,0,1);});
      marks.filter(function(l){return l.kind==='cell118';}).forEach(function(l){add(c.cellOpened?1:0,l.x,184,1,0,1);});
    }else if(c.m===5){
      marks.filter(function(l){return l.kind==='console';}).forEach(function(l){add(8,l.x,112,1,0,1);});
      marks.filter(function(l){return l.kind==='door';}).forEach(function(l){add(3,l.x,182,1,0,1);});
      add(6,650,120,.72,-45,.30);
    }else if(c.m===6){
      var uplink=c.uplink;
      marks.forEach(function(l){if(l.kind==='cell1984')add(c._gbWaldoFreed?1:0,l.x,184,1,0,1);if(l.kind==='console')add(8,uplink&&Number.isFinite(uplink.x)?uplink.x:l.x,100,1,0,1);if(l.kind==='warden')add(11,l.x,76,1,-165,1);});
      add(11,650,50,.65,-170,.40);
    }else{
      marks.forEach(function(l){if(l.kind==='shuttle')add(3,l.x,190,1,0,1);if(l.kind==='warden')add(11,l.x,78,1,-175,.9);});
      add(7,450,125,.85,-145,.75);
    }
    return {id:row.id,mission:c.m,profile:p,items:items};
  }
  function drawBackdrop(ctx,n){
    var p=profile(n),art=root.TechOpsArtHandoff;
    // Keep the original generated fallback until the real source has decoded.
    if(!p||!ctx||!ctx.canvas||!art||!art.image||!art.image('prison'))return false;
    var W=ctx.canvas.width,H=ctx.canvas.height,F=Number.isFinite(root.NM_FLOOR)?root.NM_FLOOR:430,cam=Number(n.cam)||0;
    ctx.save();try{
      ctx.globalAlpha=1;ctx.fillStyle='#040b13';ctx.fillRect(0,0,W,H);
      if(ctx.createLinearGradient){var wash=ctx.createLinearGradient(0,96,0,F);wash.addColorStop(0,'#14242e');wash.addColorStop(.50,p.shadow);wash.addColorStop(1,'#111b24');ctx.fillStyle=wash;ctx.fillRect(0,96,W,Math.max(0,F-96));}
      // Deep recessed bays, beveled pressure ribs and a continuous ceiling
      // cable tray replace the repeated flat boxes. Parallax stays decorative.
      var bay=320,drift=((cam*.28)%bay+bay)%bay,top=Math.max(104,F-314),base=F-24;
      for(var x=-drift;x<W;x+=bay){
        x=Math.round(x);var left=x+26,right=x+bay-26;
        ctx.globalAlpha=1;ctx.fillStyle='#09121c';ctx.fillRect(left,top+32,right-left,base-top-32);
        ctx.fillStyle='#17232d';ctx.fillRect(left+8,top+40,right-left-16,8);
        ctx.fillStyle='#030913';ctx.fillRect(left+12,top+54,right-left-24,126);
        // M7 reads as an exterior service aperture; the other blocks retain
        // opaque detention glass and vertical containment fins.
        if(p.id==='shuttle-bay'){
          ctx.fillStyle='#8392a9';ctx.globalAlpha=.34;
          for(var s=0;s<7;s++)ctx.fillRect(left+20+(s*53%222),top+64+(s*29%106),s%3===0?2:1,1);
          ctx.fillStyle='#1b2b40';ctx.globalAlpha=.8;ctx.fillRect(left+12,top+151,right-left-24,29);
          ctx.fillStyle='#3b5365';ctx.globalAlpha=.32;ctx.fillRect(left+12,top+151,right-left-24,2);
        }else{
          ctx.fillStyle=p.accent;ctx.globalAlpha=.055;ctx.fillRect(left+12,top+54,right-left-24,126);
          ctx.fillStyle='#263342';ctx.globalAlpha=.85;
          for(var sl=left+30;sl<right-12;sl+=46)ctx.fillRect(sl,top+54,p.id==='detention'?4:9,126);
        }
        ctx.globalAlpha=.35;ctx.fillStyle=p.accent;ctx.fillRect(left+18,top+29,62,2);
        ctx.globalAlpha=.75;ctx.fillStyle='#283a46';ctx.beginPath();ctx.moveTo(x+3,base);ctx.lineTo(x+3,top+32);ctx.lineTo(x+27,top+8);ctx.lineTo(x+bay-27,top+8);ctx.lineTo(x+bay-3,top+32);ctx.lineTo(x+bay-3,base);ctx.lineTo(x+bay-14,base);ctx.lineTo(x+bay-14,top+38);ctx.lineTo(x+bay-34,top+20);ctx.lineTo(x+34,top+20);ctx.lineTo(x+14,top+38);ctx.lineTo(x+14,base);ctx.closePath();ctx.fill();
        ctx.fillStyle='#547080';ctx.globalAlpha=.35;ctx.fillRect(x+4,top+40,2,Math.max(0,base-top-40));
        ctx.globalAlpha=.6;ctx.fillStyle='#0a111b';ctx.fillRect(left,base-39,right-left,34);
        ctx.globalAlpha=.22;ctx.fillStyle='#67818e';ctx.fillRect(left+8,base-33,right-left-16,1);
        // Practical light pools are static: no flashing or time-based camera
        // motion, and the clear actor plane retains its strongest contrast.
        ctx.globalAlpha=.045;ctx.fillStyle=p.accent;ctx.beginPath();ctx.moveTo(left+22,top+32);ctx.lineTo(left+80,top+32);ctx.lineTo(left+120,base);ctx.lineTo(left-14,base);ctx.closePath();ctx.fill();
      }
      ctx.globalAlpha=1;ctx.fillStyle='#040a11';ctx.fillRect(0,88,W,18);ctx.fillStyle='#263844';ctx.fillRect(0,105,W,2);
      ctx.fillStyle='#718b98';ctx.globalAlpha=.50;ctx.font='bold 9px monospace';ctx.textAlign='left';ctx.fillText(p.section,16,122);
      ctx.fillStyle='#02070c';ctx.fillRect(0,F-18,W,18);
      ctx.globalAlpha=.45;ctx.fillStyle=p.accent;ctx.fillRect(0,F-18,W,2);
    }finally{ctx.restore();}
    return true;
  }
  function lit(n){var c=n._v736;return c.m===4?!!c.cellOpened:c.m===5?!!c._gbAccessNodeSeized:c.m===6?!!c._gbWaldoFreed:!!c._gbWardenTandemDefeated;}
  function draw(ctx,n,pass,at,drawFrame){
    var scene=layout(n);if(!scene||!ctx||!ctx.canvas||typeof drawFrame!=='function'||(pass!=='back'&&pass!=='front'))return false;
    var c=n._v736,p=scene.profile,F=Number.isFinite(root.NM_FLOOR)?root.NM_FLOOR:430,W=ctx.canvas.width,cam=Number(n.cam)||0,ready=0,requested=0;
    var quiet=calm()||root.S.inDialog||root.document&&root.document.hidden,opened=lit(n),accent=opened?'#8be5ae':p.accent;
    ctx.save();
    try{
      if(pass==='back'){
        scene.items.forEach(function(item){
          var sx=item.x-cam*item.depth;if(sx<-240||sx>W+240)return;
          ctx.globalAlpha=1;requested++;
          if(drawFrame(ctx,'prison',item.frame,Math.round(sx),F+item.y,item.height,false,item.alpha))ready++;
        });
        // Structural supports share the existing platform coordinates. Nothing
        // here creates a platform, alters collisions or moves an interaction.
        ctx.globalAlpha=.45;
        (n.platforms||[]).slice(0,16).forEach(function(platform){
          var px=Number(platform.x)-cam,py=Number(platform.y),pw=Number(platform.w);
          if(!Number.isFinite(px)||!Number.isFinite(py)||!Number.isFinite(pw)||pw<24||py>=F-12||px+pw<0||px>W)return;
          var height=F-py-12;ctx.fillStyle='#0c1721';ctx.fillRect(px+8,py+12,10,height);ctx.fillRect(px+pw-18,py+12,10,height);
          ctx.fillStyle='#46606d';ctx.fillRect(px+8,py+12,1,height);ctx.fillRect(px+pw-18,py+12,1,height);
          ctx.fillStyle='#21323d';ctx.fillRect(px+8,py+26,Math.max(0,pw-26),4);
        });
        ctx.strokeStyle=accent;ctx.lineWidth=2;ctx.globalAlpha=.26;
        ctx.beginPath();ctx.moveTo(0,F-8);ctx.lineTo(W,F-8);ctx.stroke();
        var guide=root.TechOpsGameplayExperience&&root.TechOpsGameplayExperience.objective(n);
        if(guide&&Number.isFinite(guide.targetX)){
          var gx=guide.targetX-cam;
          if(gx>-50&&gx<W+50){ctx.globalAlpha=quiet?.12:.12+Math.sin((Number(at)||0)/900)*.025;ctx.fillStyle=accent;ctx.fillRect(Math.round(gx)-18,F-150,36,150);}
        }
      }else{
        // The foreground light run is below the feet; it never masks silhouettes.
        ctx.fillStyle=accent;ctx.globalAlpha=.22;
        for(var lx=-((cam*1.18)%112);lx<W;lx+=112)ctx.fillRect(Math.round(lx),F+5,32,2);
      }
    }finally{ctx.restore();}
    root.__orbitalStagingEvidence={version:2,level:scene.id,mission:scene.mission,profile:p.id,pass:pass,opened:opened,requested:requested,decodedDraws:ready,source:'approved-prison-atlas',collisionOwned:false,finalArt:false};
    return true;
  }
  function drawLandmark(ctx,n,l){
    var p=profile(n);if(!p||!l||!Number.isFinite(l.x)||!ctx||!ctx.canvas)return false;
    var W=ctx.canvas.width,cam=Number(n.cam)||0,x=l.x-cam,F=Number.isFinite(root.NM_FLOOR)?root.NM_FLOOR:430;
    // Offscreen labels must not be clamped onto the edge as though the target
    // were inside the viewport. The objective HUD owns offscreen guidance.
    if(x<12||x>W-12)return true;
    // Do not re-cover the approved source with the old generic opaque rectangles.
    var text=String(l.label||''),c=n._v736,s=root.S.meta&&root.S.meta._v736;
    if(l.kind==='k'&&!(s&&s.k))text='PRISONER';
    if(l.kind==='console'&&c.m===5)text=c._gbAccessNodeSeized?'ACCESS SECURED':'ACCESS NODE';
    if(l.kind==='shuttle'&&c.m===7)text=c._gbWardenTandemDefeated?'SHUTTLE ROUTE OPEN':'MAINTENANCE SHUTTLE';
    if(!n.onGround&&Math.abs(l.x-n.x)<85&&n.y<F-120)return true;
    ctx.save();try{
      ctx.font='bold 9px monospace';ctx.textAlign='center';
      var max=Math.min(184,W-24);while(text.length>3&&ctx.measureText(text).width>max)text=text.slice(0,-2)+'…';
      var w=ctx.measureText(text).width+12,tx=Math.max(w/2+6,Math.min(W-w/2-6,x));
      ctx.globalAlpha=.8;ctx.fillStyle='#061018';ctx.fillRect(Math.round(tx-w/2),F-201,w,16);
      ctx.globalAlpha=1;ctx.fillStyle=lit(n)?'#8be5ae':p.accent;ctx.fillText(text,Math.round(tx),F-190);
      ctx.globalAlpha=.6;ctx.fillRect(Math.round(x)-6,F-183,12,2);
    }finally{ctx.restore();}return true;
  }
  root.TechOpsOrbitalStaging={VERSION:2,PROFILES:PROFILES,profile:profile,layout:layout,drawBackdrop:drawBackdrop,draw:draw,drawLandmark:drawLandmark};
})(typeof globalThis!=='undefined'?globalThis:this);
