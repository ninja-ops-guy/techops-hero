/* Scene presentation for authored environments. No story state,
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
  const BAY_WIDTH = 1800;
  const BAY_DECK_DEPTH = 310;
  const BAY_AMBER = '#e5a55f';
  const BAY_TEAL = '#76b9b7';
  let bayPlate = null;

  function bayRect(ctx, color, x, y, w, h) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  function bayPolygon(ctx, color, points) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (const [x, y] of points.slice(1)) ctx.lineTo(x, y);
    ctx.closePath();
    ctx.fill();
  }

  function bayLamp(ctx, x, y, w, height, warm) {
    bayPolygon(ctx, warm ? '#b8773f16' : '#61a5ab13', [
      [x, y], [x + w, y], [x + w + 44, y + height], [x - 44, y + height]
    ]);
    bayPolygon(ctx, warm ? '#c58a4420' : '#61a5ab13', [
      [x + 6, y], [x + w - 6, y], [x + w + 22, y + height - 24], [x - 22, y + height - 24]
    ]);
    bayRect(ctx, '#10151a', x - 5, y - 7, w + 10, 12);
    bayRect(ctx, warm ? '#885f38' : '#44666d', x, y - 5, w, 6);
    bayRect(ctx, warm ? '#f1bf80' : '#acd1d0', x + 5, y + 1, w - 10, 3);
  }

  function drawBayWorkshop(ctx, floor) {
    // The property stair and rough foundation meet a lower mechanical shop.
    bayPolygon(ctx, '#12151b', [[0, 118], [128, 118], [266, 238], [266, floor], [0, floor]]);
    bayPolygon(ctx, '#24252a', [[0, 122], [112, 122], [248, 251], [232, 266], [0, 236]]);
    for (let i = 0; i < 10; i++) {
      const y = 126 + i * 13;
      bayRect(ctx, '#392e2b', 10 + i * 19, y, 77, 9);
      bayRect(ctx, '#67503e', 10 + i * 19, y, 77, 2);
      bayRect(ctx, '#15171c', 78 + i * 19, y + 3, 9, 6);
    }
    bayRect(ctx, '#15181d', 12, floor - 139, 95, 139);
    bayRect(ctx, '#3a3433', 19, floor - 136, 83, 5);
    bayRect(ctx, '#28262a', 23, floor - 130, 72, 130);
    bayRect(ctx, '#503f35', 87, floor - 130, 8, 130);
    bayRect(ctx, BAY_AMBER, 73, floor - 69, 5, 9);

    bayRect(ctx, '#16181d', 147, floor - 146, 212, 88);
    bayRect(ctx, '#43372f', 153, floor - 142, 199, 77);
    for (let x = 161; x < 350; x += 9) {
      for (let y = floor - 135; y < floor - 69; y += 9) {
        bayRect(ctx, '#5a4537', x, y, 2, 2);
      }
    }
    for (const [x, y, h] of [[175, 311, 21], [194, 304, 29], [218, 314, 15], [238, 308, 27], [275, 310, 22], [314, 304, 27]]) {
      bayRect(ctx, '#a99881', x, y, 3, h);
      bayRect(ctx, '#c0a88c', x - 3, y, 9, 3);
      bayRect(ctx, '#58453c', x, y + h - 8, 4, 8);
    }
    bayRect(ctx, '#674836', 135, floor - 62, 232, 11);
    bayRect(ctx, '#a37a53', 135, floor - 62, 232, 3);
    bayRect(ctx, '#282224', 148, floor - 51, 12, 51);
    bayRect(ctx, '#282224', 343, floor - 51, 12, 51);
    bayRect(ctx, '#4e352d', 171, floor - 50, 86, 50);
    for (let y = floor - 45; y < floor - 10; y += 11) {
      bayRect(ctx, '#675044', 178, y, 70, 7);
      bayRect(ctx, '#ad8761', 200, y + 2, 22, 2);
    }
    bayRect(ctx, '#454143', 284, floor - 44, 49, 44);
    bayRect(ctx, '#7c6d61', 288, floor - 45, 42, 3);
    bayRect(ctx, '#684e3a', 276, floor - 71, 31, 9);
    bayRect(ctx, '#b28864', 276, floor - 71, 31, 2);
    bayLamp(ctx, 177, floor - 159, 145, 108, true);
  }

  function drawBayPlant(ctx, floor) {
    // Fixed crane rail covers the full travel of the center lift.
    bayRect(ctx, '#12181c', 480, 170, 615, 34);
    bayRect(ctx, '#43545a', 488, 172, 601, 5);
    bayRect(ctx, '#2b353b', 488, 179, 601, 11);
    bayRect(ctx, '#0f181d', 488, 191, 601, 8);
    for (let x = 509; x < 1080; x += 45) bayRect(ctx, '#738085', x, 183, 4, 3);

    for (const [x, w, h] of [[401, 58, 88], [483, 83, 119], [623, 96, 127], [882, 60, 79], [1065, 86, 111]]) {
      const y = floor - h;
      bayRect(ctx, '#161c22', x - 3, y - 3, w + 6, h + 3);
      bayRect(ctx, '#303940', x, y, w, h);
      bayRect(ctx, '#546168', x + 1, y + 1, w - 2, 3);
      bayRect(ctx, '#1b2429', x + 6, y + 12, w - 12, h - 25);
      for (let v = y + 22; v < floor - 23; v += 9) {
        bayRect(ctx, '#405157', x + 13, v, w - 26, 2);
      }
      bayRect(ctx, '#c89553', x + 11, y + 6, 5, 2);
    }
    bayRect(ctx, '#151e24', 559, floor - 201, 439, 18);
    bayRect(ctx, '#4e5a5f', 559, floor - 201, 439, 3);
    bayRect(ctx, '#38444a', 567, floor - 195, 425, 5);
    bayRect(ctx, '#303c41', 571, floor - 190, 10, 90);
    bayRect(ctx, '#303c41', 976, floor - 190, 10, 88);
    bayLamp(ctx, 607, 222, 91, floor - 242, false);
    bayLamp(ctx, 985, 222, 71, floor - 247, true);
  }

  function drawBayCradle(ctx, floor) {
    // A recessed cavity behind the independently gated ship reveal.
    bayPolygon(ctx, '#11191e', [
      [1180, floor], [1180, 219], [1251, 148], [1635, 148],
      [1715, 219], [1715, floor]
    ]);
    bayPolygon(ctx, '#26343b', [
      [1191, floor], [1191, 223], [1257, 161], [1630, 161],
      [1702, 223], [1702, floor]
    ]);
    bayPolygon(ctx, '#17262b', [
      [1212, floor], [1212, 227], [1263, 176], [1626, 176],
      [1681, 227], [1681, floor]
    ]);
    bayRect(ctx, '#101c22', 1229, 237, 435, floor - 237);
    for (const y of [257, 295, 335, 375]) bayRect(ctx, '#18282e', 1234, y, 425, 3);
    bayRect(ctx, '#577073', 1261, 164, 371, 3);
    bayRect(ctx, '#10191d', 1292, 193, 309, 10);
    bayRect(ctx, '#39484c', 1292, 193, 309, 3);
    for (const x of [1196, 1692]) {
      bayRect(ctx, '#3d4a4f', x, 243, 7, floor - 243);
      bayRect(ctx, '#141e24', x, floor - 35, 16, 35);
      bayRect(ctx, '#8e704b', x + 2, floor - 38, 12, 3);
    }
    bayRect(ctx, '#11191e', 1234, floor - 9, 444, 9);
    bayRect(ctx, '#567471', 1234, floor - 9, 444, 2);
    bayRect(ctx, '#18272c', 1291, floor - 4, 331, 4);
    for (let x = 1278; x < 1660; x += 24) bayRect(ctx, '#745b42', x, floor - 4, 5, 2);
  }

  function getBayPlate(floor) {
    if (bayPlate?.floor === floor) return bayPlate.canvas;
    const canvas = root.document.createElement('canvas');
    canvas.width = BAY_WIDTH;
    canvas.height = floor + BAY_DECK_DEPTH;
    const ctx = canvas.getContext('2d');
    const wall = ctx.createLinearGradient(0, 104, 0, floor);
    wall.addColorStop(0, '#232a30');
    wall.addColorStop(.65, '#1c242a');
    wall.addColorStop(1, '#2f3437');
    bayRect(ctx, wall, 0, 0, BAY_WIDTH, floor);

    // A stepped ceiling is visible behind the hand-built structural frames.
    const ceiling = [[0, 102], [101, 102], [131, 87], [213, 87], [254, 107], [369, 107], [405, 85],
      [550, 85], [589, 67], [750, 67], [808, 81], [961, 81], [1008, 112], [1161, 112], [1206, 87],
      [1306, 87], [1359, 72], [1501, 72], [1546, 91], [1694, 91], [1740, 107], [1800, 107]];
    bayPolygon(ctx, '#3d3b3c', [[0, 0], [1800, 0], ...ceiling.slice().reverse()]);
    bayPolygon(ctx, '#11151a', [[0, 0], [1800, 0], ...ceiling.slice().reverse().map(([x, y]) => [x, y - 10])]);
    for (let x = 20; x < BAY_WIDTH; x += 41) {
      const y = 118 + ((x * 37) % 170);
      bayRect(ctx, '#3d3d40', x, y, 18, 2);
      bayRect(ctx, '#171e24', x + 2, y + 3, 8, 2);
    }
    for (const x of [126, 378, 602, 849, 1118, 1738]) {
      bayRect(ctx, '#171c20', x - 6, 110, 36, floor - 110);
      bayRect(ctx, '#354149', x, 110, 18, floor - 110);
      bayRect(ctx, '#4a555b', x, 111, 3, floor - 111);
      bayRect(ctx, '#4c4b47', x - 8, floor - 37, 34, 4);
      bayRect(ctx, '#21262a', x - 8, floor - 33, 34, 33);
    }
    drawBayWorkshop(ctx, floor);
    drawBayPlant(ctx, floor);
    drawBayCradle(ctx, floor);

    // A scuffed deck, guides and conduit covers extend below the actors.
    bayRect(ctx, '#2f373a', 0, floor, BAY_WIDTH, 34);
    bayRect(ctx, '#282e32', 0, floor + 34, BAY_WIDTH, 47);
    bayRect(ctx, '#1b2429', 0, floor + 81, BAY_WIDTH, BAY_DECK_DEPTH - 81);
    bayRect(ctx, '#606467', 0, floor, BAY_WIDTH, 2);
    bayRect(ctx, '#4c5254', 0, floor + 33, BAY_WIDTH, 2);
    bayRect(ctx, '#0c151b', 0, floor + 81, BAY_WIDTH, 7);
    bayRect(ctx, '#323e42', 0, floor + 88, BAY_WIDTH, 2);
    for (let x = 28; x < BAY_WIDTH; x += 108) {
      bayRect(ctx, '#121c20', x, floor + 8, 2, 25);
      bayRect(ctx, '#151e22', x + 32, floor + 36, 2, 45);
      bayRect(ctx, '#69655a', x + 9, floor + 24, 9, 2);
    }
    for (let x = 430; x < 1740; x += 31) bayRect(ctx, '#9d7a4a', x, floor + 14, 13, 2);
    bayRect(ctx, '#111b20', 0, floor + 133, BAY_WIDTH, 15);
    bayRect(ctx, '#465156', 0, floor + 134, BAY_WIDTH, 2);
    for (let x = 12; x < BAY_WIDTH; x += 25) bayRect(ctx, '#29353b', x, floor + 138, 16, 7);
    bayPlate = { floor, canvas };
    return canvas;
  }

  function drawBayPlatform(ctx, p, left, floor) {
    const bottom = p.y + p.h;
    const moving = p.y === 300;
    for (const x of [left + 9, left + p.w - 15]) {
      if (moving) {
        bayRect(ctx, '#11181e', x - 2, 194, 9, p.y - 194);
        bayRect(ctx, '#687279', x + 1, 196, 2, p.y - 196);
        for (let y = 199; y < p.y; y += 9) bayRect(ctx, '#91938b', x, y, 4, 2);
      } else {
        bayRect(ctx, '#141d23', x, bottom, 6, Math.max(0, floor - bottom));
        bayRect(ctx, '#596265', x + 1, bottom, 2, Math.max(0, floor - bottom));
      }
    }
    bayRect(ctx, '#121b21', left, p.y, p.w, p.h);
    bayRect(ctx, '#48535a', left + 2, p.y + 3, p.w - 4, p.h - 6);
    bayRect(ctx, moving ? BAY_TEAL : '#a68c62', left, p.y, p.w, 2);
    bayRect(ctx, moving ? '#b5d0c9' : BAY_AMBER, left, p.y, 10, 2);
    bayRect(ctx, moving ? '#b5d0c9' : BAY_AMBER, left + p.w - 10, p.y, 10, 2);
    for (let x = left + 10; x < left + p.w - 5; x += 17) bayRect(ctx, '#222c33', x, p.y + 6, 5, 3);
  }

  function drawHiddenBay(ctx, n, floor = 430) {
    if (Number(n?._v736?.m) !== 2 || !root.document) return false;
    const camera = Math.round(Number(n.cam) || 0);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    bayRect(ctx, '#11191e', 0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.drawImage(getBayPlate(floor), -camera, 0);
    if (n._gbShipRevealed) {
      bayLamp(ctx, 1281 - camera, 216, 52, floor - 239, false);
      bayLamp(ctx, 1568 - camera, 216, 52, floor - 239, false);
      bayRect(ctx, '#3a7f80', 1235 - camera, floor - 7, 441, 2);
    }
    for (const platform of n.platforms || []) {
      const x = Math.round(platform.x - camera);
      if (x + platform.w >= 0 && x <= ctx.canvas.width) drawBayPlatform(ctx, platform, x, floor);
    }
    ctx.restore();
    return true;
  }
  root.TechOpsSceneArt={VERSION:2,specs,key,image,ready,drawBackdrop,drawGround,drawPlatforms,drawProp,drawPropertyProps,drawDomesticCinematic,drawHiddenBay};
  Object.keys(specs).forEach(image);image('props');
})(typeof globalThis!=='undefined'?globalThis:this);
