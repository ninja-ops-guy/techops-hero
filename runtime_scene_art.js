/* Scene presentation for the five real-frame overpaints. No story state,
 * collision changes, listeners, timers or renderer wrappers. Existing owners
 * call these layer hooks; unavailable art returns to their established fallback. */
(function(root){
  'use strict';
  const images={},specs=Object.freeze({
    industrial:{src:'assets/visual-combat/industrial.webp',ground:.60,accent:'#ffba55'},
    longwharf:{src:'assets/visual-combat/longwharf.webp',ground:.60,accent:'#5ae0d1'},
    home:{src:'assets/visual-combat/home.webp',ground:490/793,doorSourceX:1368,accent:'#ffd395'},
    waldo:{src:'assets/visual-combat/waldo.webp',ground:500/793,worldWidth:1800,accent:'#ffd395'},
    'gooddogs-home':{src:'assets/visual-combat/gooddogs-home.webp',ground:.61,accent:'#ffd395'}
  });
  function key(n){if(!n||n._sector04)return null;if(n._v736)return Number(n._v736.m)===1?'gooddogs-home':null;return specs[n.district]?n.district:null;}
  function image(id){
    if(!images[id]&&root.Image){const im=new root.Image();images[id]=im;im.decoding='async';im.src=specs[id]?.src||(id==='props'?'assets/visual-combat/waldo-props.png':'');im.onerror=()=>{root.__sceneArtError=im.src;};}
    const im=images[id];return im&&im.complete&&im.naturalWidth?im:null;
  }
  // The property owner suppresses its legacy building and dish together.
  // Swap only when both authored layers have decoded, preserving visible
  // interaction targets if the separate prop atlas is slow or fails to load.
  function ready(n){const id=key(n);return !!(id&&image(id)&&(id!=='waldo'||image('props')));}
  function clip(x,y,h){x.beginPath();x.rect(0,y,x.canvas.width,h);x.clip();}
  function architecture(x,im,sw,sy,cam,F){
    const W=x.canvas.width,travel=Math.max(0,1800-W),scale=Math.max((W+travel*.18)/sw,F/sy),width=sw*scale;
    x.drawImage(im,0,0,sw,sy,-cam*.18,F-sy*scale,width,sy*scale);
  }
  function panoramaWidth(id,im){
    const spec=specs[id];
    return spec.doorSourceX?(root.TechOpsNightRuntime?.HOME_X||1560)*im.naturalWidth/spec.doorSourceX:spec.worldWidth;
  }
  function drawBackdrop(x,n,F=430){
    if(!ready(n))return false;const id=key(n),im=image(id);
    const sy=Math.round(im.naturalHeight*specs[id].ground),cam=Math.max(0,Number(n.cam)||0),sw=im.naturalWidth;
    x.save();x.imageSmoothingEnabled=false;clip(x,0,F);
    if(id==='home'||id==='waldo'){
      // A continuous panorama shares the interaction plane and ground scale.
      // Home's authored APT 4B door is anchored at HOME_X. Waldo's full property
      // spans the existing world, with its porch and garage over their hotspots.
      const width=panoramaWidth(id,im),scale=width/sw;
      x.drawImage(im,0,0,sw,sy,-cam,F-sy*scale,width,sy*scale);
    }else if(id==='gooddogs-home'){
      // The new house/yard plate must still lead to the established garage and
      // false-wall location. Share that source with the third prologue shot.
      const blend=Math.max(0,Math.min(1,(cam-280)/380)),home=root.TechOpsGoodDogsHomeScene;
      const garage=blend>0&&home&&home.drawWorldBack(x,n,F,true);
      x.globalAlpha=garage?1-blend:1;architecture(x,im,sw,sy,cam,F);x.globalAlpha=1;
    }else architecture(x,im,sw,sy,cam,F);
    x.restore();return true;
  }
  // Ordinary Earth streets share a world-anchored pixel surface. Authored
  // plates, campaign stages and the dogs retain their own ground/composition.
  const streets={downtown:'#426c83',wooster:'#805777',airport:'#667b56',suburbs:'#8b7453'};
  function street(n){return !!(n&&!n._v736&&!n._sector04&&!n._nightwalker&&!n.drive&&streets[n.district]);}
  function drawStreetGround(x,n,F){
    if(!street(n))return false;
    const W=x.canvas.width,H=x.canvas.height,cam=Number(n.cam)||0;
    x.save();clip(x,F,Math.max(0,H-F));
    x.fillStyle='#131e2b';x.fillRect(0,F,W,H-F);
    // A brighter contact plane falls off into a quiet foreground.
    x.fillStyle='#1d2b39';x.fillRect(0,F,W,42);
    x.fillStyle='#182430';x.fillRect(0,F+42,W,55);
    x.fillStyle='#101a26';x.fillRect(0,F+160,W,Math.max(0,H-F-160));
    const first=Math.floor(cam/96)*96;
    for(let wx=first;wx<cam+W+96;wx+=96){
      const dx=Math.round(wx-cam),seed=Math.floor(wx/96);
      // Broken reflections keep individual pixels, with no full-frame filter,
      // blur, random source, animation or animated flicker.
      for(let row=0;row<9;row++){
        const off=((seed*37+row*53)%83+83)%83;
        x.fillStyle=row%3===0?streets[n.district]:'#31424e';
        x.globalAlpha=row%3===0?.25:.35;
        x.fillRect(dx+off,F+13+row*15,12+(off%29),row%2+1);
      }
      x.globalAlpha=1;
      x.fillStyle='#34444e';x.fillRect(dx,F,94,3);
      x.fillStyle='#090f18';x.fillRect(dx+94,F,2,7);
      // Aggregate and tar seams run in world space, so they never swim as
      // the camera follows Mike. Work scales with viewport, not world width.
      for(let row=0;row<12;row++){
        const off=((seed*19+row*31)%91+91)%91;
        x.fillStyle=row%2?'#23313c':'#0b1420';
        x.fillRect(dx+off,F+8+row*23,2+off%4,1);
      }
    }
    // Existing street lane rhythm; drains establish scale at the curb.
    for(let wx=Math.floor(cam/260)*260;wx<cam+W+260;wx+=260){
      const dx=Math.round(wx-cam);
      x.fillStyle='#7a7046';x.fillRect(dx+70,F+23,46,3);
      x.fillStyle='#b2a26b';x.fillRect(dx+72,F+23,42,1);
      x.fillStyle='#080f17';x.fillRect(dx+168,F+4,28,7);
      x.fillStyle='#46515a';for(let i=0;i<6;i++)x.fillRect(dx+170+i*4,F+5,1,5);
    }
    x.restore();return true;
  }
  function drawStreetPlatforms(x,n,F){
    if(!street(n))return false;
    const cam=Number(n.cam)||0;
    x.save();
    for(const p of n.platforms||[]){
      const dx=Math.round(p.x-cam),w=p.w,y=p.y;
      if(dx+w<0||dx>x.canvas.width)continue;
      // Back-mounted service gantries: slim supports stop at the contact
      // plane, leaving the existing top edge/collision coordinate unchanged.
      const h=Math.max(0,F-y-12);
      for(const sx of [dx+8,dx+w-14]){
        x.fillStyle='#101b25';x.fillRect(sx,y+12,6,h);
        x.fillStyle='#3b4d5a';x.fillRect(sx,y+12,1,h);
        if(h){x.fillStyle='#0a121c';x.fillRect(sx-4,F-3,14,3);}
      }
      x.fillStyle='#111c28';x.fillRect(dx,y,w,14);
      x.fillStyle='#334652';x.fillRect(dx,y+3,w,7);
      x.fillStyle='#829ba7';x.fillRect(dx,y,w,2);
      x.fillStyle='#49636e';x.fillRect(dx,y+2,w,1);
      for(let i=8;i<w-4;i+=18){x.fillStyle='#152630';x.fillRect(dx+i,y+4,10,2);}
      for(const sx of [dx+3,dx+w-5]){x.fillStyle='#b1a56e';x.fillRect(sx,y+5,2,2);}
      x.fillStyle='#080e17';x.fillRect(dx,y+11,w,3);
    }
    x.restore();return true;
  }
  function drawGround(x,n,F=430){
    if(drawStreetGround(x,n,F))return true;
    if(!ready(n))return false;const id=key(n),im=image(id);
    const sy=Math.round(im.naturalHeight*specs[id].ground),sh=im.naturalHeight-sy,H=x.canvas.height;
    x.save();x.imageSmoothingEnabled=false;clip(x,F,H-F);
    if(id==='home'||id==='waldo'){
      const width=panoramaWidth(id,im),height=Math.max(H-F,sh*width/im.naturalWidth);
      x.drawImage(im,0,sy,im.naturalWidth,sh,-(Number(n.cam)||0),F,width,height);
    }else{
      const scale=Math.max(.64,(H-F)/sh),width=im.naturalWidth*scale,offset=-((Number(n.cam)||0)%width);
      for(let dx=offset;dx<x.canvas.width;dx+=width)x.drawImage(im,0,sy,im.naturalWidth,sh,dx,F,width,sh*scale);
    }
    x.restore();return true;
  }
  function drawPlatforms(x,n,F=430){
    if(drawStreetPlatforms(x,n,F))return true;
    if(!ready(n))return false;
    const id=key(n),im=image(id),cam=n.cam||0,accent=specs[id].accent;
    x.save();x.imageSmoothingEnabled=false;
    for(const p of n.platforms||[]){
      const px=Math.round(p.x-cam);if(px+p.w<0||px>x.canvas.width)continue;
      if(id==='industrial'||id==='longwharf'){
        const rect=id==='industrial'?[280,142,790,36]:[10,706,1200,36];
        // Textured fascia and full-height structural posts, behind live actors.
        for(const sx of [px+7,px+p.w-12]){
          x.fillStyle='#0a141b';x.fillRect(sx,p.y+10,7,Math.max(0,F-p.y-10));
          x.fillStyle='#52676c';x.fillRect(sx+1,p.y+10,1,Math.max(0,F-p.y-10));
        }
        x.drawImage(im,...rect,px,p.y,p.w,17);
      }else if(id==='gooddogs-home'){
        // Reuse the authored porch's wooden posts and stair fascia. Supports
        // register every climbable surface to the yard, including tall ledges.
        const height=Math.max(0,F-p.y-8);
        if(height)for(const sx of [px+7,px+p.w-17])x.drawImage(im,927,390,17,140,sx,p.y+8,10,height);
        x.drawImage(im,740,588,145,18,px,p.y,p.w,14);
      }else{
        const sy=Math.round(im.naturalHeight*specs[id].ground);
        x.drawImage(im,420,sy,360,30,px,p.y,p.w,14);
      }
      x.fillStyle=accent;x.globalAlpha=.8;x.fillRect(px,p.y,p.w,2);x.globalAlpha=1;
    }
    x.restore();return true;
  }
  function drawProp(x,name,cx,base,height){
    const im=image('props'),i={mower:0,grill:1,dish:2,chest:3}[name];if(!im||i===undefined)return false;
    const sourceHeights=[106,94,102,77],scale=height/sourceHeights[i];
    x.save();x.imageSmoothingEnabled=false;x.drawImage(im,i*160,0,160,144,cx-80*scale,base-138*scale,160*scale,144*scale);x.restore();return true;
  }
  function drawPropertyProps(x,n,F=430){
    if(n.district!=='waldo'||!ready(n)||!image('props'))return false;
    const cam=n.cam||0;drawProp(x,'mower',340-cam,F,66);drawProp(x,'grill',560-cam,F,66);drawProp(x,'dish',1420-cam,F,94);drawProp(x,'chest',1252-cam,F,62);return true;
  }
  function drawDomesticCinematic(x,pan=0){
    const n={_v736:{m:1},cam:pan};return drawBackdrop(x,n,351)&&drawGround(x,n,351);
  }
  root.TechOpsSceneArt={VERSION:3,specs,key,image,ready,drawBackdrop,drawGround,drawPlatforms,drawProp,drawPropertyProps,drawDomesticCinematic};
  Object.keys(specs).forEach(image);image('props');
})(typeof globalThis!=='undefined'?globalThis:this);
