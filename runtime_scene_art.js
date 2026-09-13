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
  function drawGround(x,n,F=430){
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
  root.TechOpsSceneArt={VERSION:2,specs,key,image,ready,drawBackdrop,drawGround,drawPlatforms,drawProp,drawPropertyProps,drawDomesticCinematic};
  Object.keys(specs).forEach(image);image('props');
})(typeof globalThis!=='undefined'?globalThis:this);
