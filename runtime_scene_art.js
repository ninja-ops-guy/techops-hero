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
  // Sector 04 uses an authored pixel hangar drawn from the live world geometry.
  const WORLD_WIDTH = 1800;
  const SCENE_HEIGHT = 720;
  const STEEL = "#2b4148";
  const SEAM = "#101a20";
  const AMBER = "#c68d4a";
  const BAYS = [12, 354, 702, 1048, 1394, 1774];
  let sheet;
  let sheetFloor;

  function rect(ctx, color, x, y, w, h) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  function beam(ctx, color, x, y, width, rise, thickness) {
    for (let step = 0; step < width; step += 4) {
      const top = y + Math.round(rise * step / width / 2) * 2;
      const next = y + Math.round(rise * Math.min(step + 4, width) / width / 2) * 2;
      rect(ctx, color, x + step, Math.min(top, next), Math.min(4, width - step), Math.abs(top - next) + thickness);
    }
  }

  function drawGlazing(ctx, start, width) {
    rect(ctx, "#081318", start - 8, 92, width + 16, 154);
    rect(ctx, "#182d36", start, 100, width, 134);
    rect(ctx, "#223b44", start, 103, width, 45);
    rect(ctx, "#1a323b", start, 148, width, 41);
    rect(ctx, "#132831", start, 189, width, 45);

    for (let i = 0; i < 11; i++) {
      const x = start + 5 + i * 27;
      const y = 222 - (i * 43 + start) % 42;
      rect(ctx, "#11222a", x, y, 18 + (i % 3) * 4, 234 - y);
      rect(ctx, "#1f3339", x + 4, y + 4, 10, 2);
    }
    for (let i = 0; i < 28; i++) {
      const x = start + 6 + (i * 49 + start) % (width - 16);
      const y = 106 + (i * 37 + start) % 113;
      rect(ctx, "#3b555d", x, y, 2, 5);
      rect(ctx, "#30484f", x - 2, y + 5, 2, 5);
    }
    for (let x = start; x < start + width; x += 52) {
      rect(ctx, "#101d24", x, 98, 6, 141);
      rect(ctx, "#3a535a", x + 6, 98, 2, 141);
    }
    rect(ctx, "#162329", start, 146, width, 6);
    rect(ctx, "#3a535a", start, 152, width, 2);
    rect(ctx, "#32484c", start - 8, 234, width + 16, 6);
    rect(ctx, "#090f13", start - 8, 240, width + 16, 8);
  }

  function drawPillar(ctx, x, floor) {
    rect(ctx, "#0a1318", x - 6, 56, 35, floor - 56);
    rect(ctx, "#23343b", x, 60, 17, floor - 60);
    rect(ctx, "#3e5355", x + 2, 60, 3, floor - 60);
    rect(ctx, "#15242a", x + 15, 60, 7, floor - 60);
    rect(ctx, "#34464a", x - 6, 250, 34, 12);
    rect(ctx, "#151f25", x - 6, 258, 34, 6);
    rect(ctx, "#253234", x - 8, floor - 28, 38, 28);
    rect(ctx, "#3c4a48", x - 8, floor - 28, 38, 3);
    for (let y = 275; y < floor - 31; y += 38) {
      rect(ctx, "#10191d", x + 7, y, 5, 5);
      rect(ctx, "#61706b", x + 7, y, 2, 2);
    }
  }

  function drawWallCabinet(ctx, x, bottom, width, height) {
    const y = bottom - height;
    rect(ctx, "#0a1318", x - 4, y - 4, width + 8, height + 4);
    rect(ctx, "#263940", x, y, width, height);
    rect(ctx, "#3b5050", x + 2, y + 2, width - 4, 3);
    for (let sx = x + 6; sx < x + width - 18; sx += 22) {
      rect(ctx, "#17272e", sx, y + 8, 18, height - 15);
      rect(ctx, "#3a4b49", sx + 2, y + 12, 14, 2);
      rect(ctx, "#78644a", sx + 4, y + 17, 3, 2);
      for (let v = y + 25; v < bottom - 9; v += 5) {
        rect(ctx, "#0e1b21", sx + 4, v, 10, 2);
      }
    }
    rect(ctx, "#10191d", x, bottom - 4, width, 4);
  }

  function drawLandmarks(ctx, floor) {
    // A recessed entry bay, with darker steel behind Mike's initial route.
    rect(ctx, "#0f1a1f", 38, 306, 205, floor - 306);
    rect(ctx, "#304043", 38, 306, 205, 5);
    rect(ctx, "#213238", 38, 311, 8, floor - 311);
    rect(ctx, "#213238", 235, 311, 8, floor - 311);
    for (let y = 321; y < floor - 3; y += 16) {
      rect(ctx, "#18272c", 47, y, 187, 2);
    }

    // The maintenance bridge and hoist identify the high-ceiling middle bay.
    rect(ctx, "#0c1519", 432, 177, 508, 19);
    rect(ctx, "#3e4742", 438, 178, 490, 4);
    rect(ctx, "#283338", 438, 188, 490, 4);
    for (let x = 445; x < 928; x += 48) rect(ctx, "#645337", x, 183, 18, 3);
    rect(ctx, "#20292b", 747, 172, 58, 31);
    rect(ctx, "#594a37", 750, 179, 51, 5);
    rect(ctx, "#11191b", 767, 201, 20, 10);
    rect(ctx, "#4b4c40", 773, 211, 2, 48);
    rect(ctx, "#4b4c40", 779, 211, 2, 48);
    rect(ctx, "#292e29", 767, 258, 20, 11);
    rect(ctx, "#685338", 771, 269, 5, 7);
    rect(ctx, "#685338", 776, 274, 8, 3);

    // Ribbed service wall behind the final door and terminal.
    rect(ctx, "#111c20", 1434, 286, 274, floor - 286);
    rect(ctx, "#3a4a4a", 1434, 286, 274, 4);
    rect(ctx, "#263638", 1440, 292, 262, floor - 292);
    rect(ctx, "#111b1e", 1517, 305, 108, floor - 305);
    rect(ctx, "#3a4541", 1517, 305, 108, 4);
    for (const x of [1440, 1462, 1508, 1625, 1682, 1703]) {
      rect(ctx, "#1b292c", x, 293, 8, floor - 293);
      rect(ctx, "#45514a", x, 293, 2, floor - 293);
    }
    rect(ctx, "#755e3e", 1533, 314, 76, 3);
  }

  function drawWall(ctx, floor) {
    rect(ctx, "#142127", 0, 0, WORLD_WIDTH, floor);
    rect(ctx, "#1c2b31", 0, 254, WORLD_WIDTH, floor - 254);
    rect(ctx, "#152329", 0, floor - 122, WORLD_WIDTH, 122);
    rect(ctx, "#243337", 0, floor - 77, WORLD_WIDTH, 3);
    rect(ctx, "#0e191d", 0, floor - 16, WORLD_WIDTH, 16);
    rect(ctx, "#273638", 0, floor - 17, WORLD_WIDTH, 2);

    for (let i = 0; i < BAYS.length - 1; i++) {
      const left = BAYS[i];
      const width = BAYS[i + 1] - left;
      drawGlazing(ctx, left + 29, width - 38);
      rect(ctx, "#33454a", left + 28, 278, width - 46, 2);
      rect(ctx, "#101c20", left + 28, 280, width - 46, 5);
      for (let j = 0; j < 3; j++) {
        const sx = left + 74 + j * 88;
        rect(ctx, "#111d22", sx, 286, 2, floor - 303);
        rect(ctx, "#253438", sx + 2, 286, 2, floor - 303);
      }
      drawPillar(ctx, left, floor);
    }
    drawPillar(ctx, BAYS.at(-1), floor);

    rect(ctx, "#0b151b", 0, 0, WORLD_WIDTH, 54);
    for (let x = 0; x < WORLD_WIDTH; x += 172) {
      beam(ctx, "#293b40", x, 24, 84, 49, 7);
      beam(ctx, "#17262d", x + 84, 74, 84, -48, 7);
    }
    rect(ctx, "#17262b", 0, 49, WORLD_WIDTH, 6);
    rect(ctx, "#0a1217", 0, 54, WORLD_WIDTH, 13);
    rect(ctx, "#34464a", 0, 66, WORLD_WIDTH, 3);
    rect(ctx, "#1b282b", 0, 70, WORLD_WIDTH, 16);
    rect(ctx, "#47544e", 0, 83, WORLD_WIDTH, 3);
    rect(ctx, "#0a1318", 0, 86, WORLD_WIDTH, 8);

    for (const x of [218, 474, 824, 1216, 1536, 1728]) {
      rect(ctx, "#252b2a", x + 18, 89, 4, 22);
      rect(ctx, "#141e23", x - 3, 107, 47, 14);
      rect(ctx, "#765b3c", x, 116, 40, 5);
      rect(ctx, "#b58c58", x + 5, 121, 30, 3);
      rect(ctx, "#bb976317", x + 1, 125, 39, 7);
    }

    drawLandmarks(ctx, floor);
    drawWallCabinet(ctx, 57, floor - 8, 70, 80);
    drawWallCabinet(ctx, 385, floor - 9, 92, 64);
    drawWallCabinet(ctx, 516, floor - 18, 58, 104);
    drawWallCabinet(ctx, 869, floor - 13, 75, 63);
    drawWallCabinet(ctx, 1118, floor - 21, 112, 63);
    drawWallCabinet(ctx, 1318, floor, 64, 98);
    drawWallCabinet(ctx, 1714, floor, 57, 113);

    rect(ctx, "#0a151a", 143, 269, 162, 35);
    rect(ctx, "#53605a", 143, 269, 162, 2);
    rect(ctx, AMBER, 148, 275, 3, 21);
    ctx.fillStyle = "#d5bd8b";
    ctx.font = "bold 21px monospace";
    ctx.textAlign = "left";
    ctx.fillText("SECTOR 04", 161, 294);
  }

  function drawFloor(ctx, floor) {
    rect(ctx, "#101a1d", 0, floor, WORLD_WIDTH, SCENE_HEIGHT - floor);
    rect(ctx, "#2c3c3e", 0, floor, WORLD_WIDTH, 3);
    rect(ctx, "#233034", 0, floor + 3, WORLD_WIDTH, 44);
    rect(ctx, "#1b272b", 0, floor + 47, WORLD_WIDTH, 52);
    rect(ctx, "#162124", 0, floor + 99, WORLD_WIDTH, 86);
    for (let x = 25; x < WORLD_WIDTH; x += 162) {
      beam(ctx, "#0c161a", x, floor + 5, 58, 148, 3);
      beam(ctx, "#263337", x + 4, floor + 5, 58, 148, 2);
    }
    for (const y of [45, 99, 187]) {
      rect(ctx, "#0c1619", 0, floor + y, WORLD_WIDTH, 3);
      rect(ctx, "#273538", 0, floor + y + 3, WORLD_WIDTH, 2);
    }
    for (const [center, warm] of [[209, true], [492, false], [799, false], [1167, true], [1515, false], [1643, true]]) {
      const reflection = warm ? "#9173423a" : "#5d909232";
      for (let i = 0; i < 23; i++) {
        const x = center - 52 + (i * 43) % 107;
        const y = floor + 9 + (i * 19) % 71;
        const length = 5 + (i * 17) % 33;
        rect(ctx, reflection, x, y, length, i % 4 === 0 ? 4 : 2);
        if (i % 5 === 0) rect(ctx, "#b3c6aa35", x + 2, y, length / 2, 2);
      }
    }
    for (const x of [16, 349, 698, 1044, 1390, 1758]) {
      for (let i = 0; i < 5; i++) rect(ctx, "#79613a", x + i * 7, floor + 5, 4, 5);
    }
    rect(ctx, "#0b1417", 0, floor + 160, WORLD_WIDTH, 4);
    rect(ctx, "#38423d", 0, floor + 164, WORLD_WIDTH, 2);
    for (let x = 28; x < WORLD_WIDTH; x += 53) rect(ctx, "#323b37", x, floor + 174, 35, 3);
  }

  function getSheet(floor) {
    if (sheetFloor === floor) return sheet;
    const next = root.document.createElement("canvas");
    next.width = WORLD_WIDTH;
    next.height = SCENE_HEIGHT;
    const ctx = next.getContext("2d");
    drawWall(ctx, floor);
    drawFloor(ctx, floor);
    sheetFloor = floor;
    sheet = next;
    return sheet;
  }

  function drawPlatform(ctx, platform, x, floor) {
    const {y, w, h} = platform;
    const depth = floor - y - h;
    for (const sx of [x + 8, x + w - 15]) {
      rect(ctx, "#101b20", sx, y + h, 7, depth);
      rect(ctx, "#35494b", sx + 1, y + h, 2, depth);
    }
    rect(ctx, "#263739", x, y - 25, w, 3);
    for (let dx = 3; dx < w; dx += 23) rect(ctx, "#273a3c", x + dx, y - 24, 2, 24);
    rect(ctx, SEAM, x, y, w, h);
    rect(ctx, STEEL, x + 2, y + 3, w - 4, h - 7);
    for (let dx = 8; dx < w - 6; dx += 12) rect(ctx, "#18272a", x + dx, y + 6, 5, 3);
    rect(ctx, AMBER, x, y, w, 2);
    rect(ctx, "#f1bf75", x, y, 10, 2);
    rect(ctx, "#f1bf75", x + w - 10, y, 10, 2);
  }

  function drawSector04(ctx, night, floor) {
    if (!night || !night._sector04 || !root.document) return false;
    const camera = Math.round(night.cam || 0);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    rect(ctx, "#0b1417", 0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.drawImage(getSheet(floor), -camera, 0);
    for (const platform of night.platforms) {
      const x = platform.x - camera;
      if (x + platform.w >= 0 && x <= ctx.canvas.width) drawPlatform(ctx, platform, x, floor);
    }
    ctx.restore();
    return true;
  }

  root.TechOpsSceneArt={VERSION:2,specs,key,image,ready,drawBackdrop,drawGround,drawPlatforms,drawProp,drawPropertyProps,drawDomesticCinematic,drawSector04};
  Object.keys(specs).forEach(image);image('props');
})(typeof globalThis!=='undefined'?globalThis:this);
