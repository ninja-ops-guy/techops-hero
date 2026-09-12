/* Good Dogs M4-M7 staging. Reuses the approved prison atlas and registry anchors.
 * Called only by the existing art renderer; no frame loop, collision or saves.
 * These are staged raster compositions, not replacement art or DCC masters. */
(function(root){
  'use strict';
  if(!root||root.TechOpsOrbitalStaging)return;
  var PROFILES=Object.freeze({
    4:Object.freeze({id:'detention',accent:'#55dfff',shadow:'#071321',pipe:6}),
    5:Object.freeze({id:'access-core',accent:'#22c55e',shadow:'#071811',pipe:6}),
    6:Object.freeze({id:'surveillance',accent:'#ff475d',shadow:'#1a080f',pipe:6}),
    7:Object.freeze({id:'shuttle-bay',accent:'#f5b544',shadow:'#1a1022',pipe:7})
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
    var W=ctx.canvas.width,H=ctx.canvas.height,F=430,cam=Number(n.cam)||0;
    ctx.save();try{
      ctx.globalAlpha=1;ctx.fillStyle=p.shadow;ctx.fillRect(0,0,W,H);
      ctx.fillStyle='#030810';ctx.fillRect(0,80,W,64);
      var drift=((cam*.28)%216+216)%216;
      for(var x=-drift;x<W+216;x+=216){
        ctx.fillStyle='#13212d';ctx.fillRect(Math.round(x)+6,145,204,F-145);
        ctx.fillStyle=p.shadow;ctx.fillRect(Math.round(x)+10,149,196,F-153);
        ctx.fillStyle='#213645';ctx.fillRect(Math.round(x)+8,147,2,F-151);
        ctx.globalAlpha=.30;ctx.fillStyle=p.accent;ctx.fillRect(Math.round(x)+28,159,52,2);ctx.globalAlpha=1;
        ctx.fillStyle='#070c13';ctx.fillRect(Math.round(x)+26,194,162,99);
        ctx.fillStyle=p.id==='shuttle-bay'?'#02040b':'#0b151f';ctx.fillRect(Math.round(x)+30,198,154,91);
      }
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
        // Long structural ribs establish depth; all render behind the actor pass.
        var drift=((cam*.28)%240+240)%240;
        ctx.fillStyle=p.shadow;ctx.globalAlpha=.62;
        for(var x=-drift;x<W+240;x+=240){ctx.fillRect(Math.round(x),F-246,9,232);ctx.fillRect(Math.round(x+9),F-246,118,6);}
        scene.items.forEach(function(item){
          var sx=item.x-cam*item.depth;if(sx<-240||sx>W+240)return;
          ctx.globalAlpha=1;requested++;
          if(drawFrame(ctx,'prison',item.frame,Math.round(sx),F+item.y,item.height,false,item.alpha))ready++;
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
    root.__orbitalStagingEvidence={version:1,level:scene.id,mission:scene.mission,profile:p.id,pass:pass,opened:opened,requested:requested,decodedDraws:ready,source:'approved-prison-atlas',collisionOwned:false,finalArt:false};
    return true;
  }
  function drawLandmark(ctx,n,l){
    var p=profile(n);if(!p||!l||!Number.isFinite(l.x)||!ctx||!ctx.canvas)return false;
    var W=ctx.canvas.width,cam=Number(n.cam)||0,x=l.x-cam,F=Number.isFinite(root.NM_FLOOR)?root.NM_FLOOR:430;
    if(x<-100||x>W+100)return true;
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
  root.TechOpsOrbitalStaging={VERSION:1,PROFILES:PROFILES,profile:profile,layout:layout,drawBackdrop:drawBackdrop,draw:draw,drawLandmark:drawLandmark};
})(typeof globalThis!=='undefined'?globalThis:this);
