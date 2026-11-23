/* Authored engine pixel-art layers. No evidence, clocks, input or save authority.
 * All geometry is in mission world coordinates; F remains its original contact plane. */
(function(root){
 'use strict';
 const themes={access:['#243746','#c9a367'],approaches:['#32424d','#c49a70'],services:['#344448','#75b5b0'],shelters:['#443d49','#c9a879'],departure:['#34444e','#8fbec6'],receiving:['#35474b','#b6c7b0']};
 const cache=new Map();let paints=0;
 function r(c,x,y,w,h,color){if(w<=0||h<=0)return;c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
 function poly(c,points,color){c.fillStyle=color;c.beginPath();c.moveTo(...points[0]);for(let i=1;i<points.length;i++)c.lineTo(...points[i]);c.closePath();c.fill();}
 function pipe(c,x,y,w,h){r(c,x,y,w,h,'#0a171e');r(c,x+2,y+2,w-4,h-4,'#536770');r(c,x+2,y+2,2,h-4,'#8b9998');for(let k=7;k<h;k+=24)r(c,x,y+k,w,3,'#273e49');}
 function door(c,x,F,w=36){r(c,x-3,F-81,w+6,81,'#101a24');r(c,x,F-76,w,76,'#43545a');r(c,x+3,F-72,w-6,27,'#1b303a');r(c,x+4,F-40,w-8,3,'#657575');r(c,x+w-8,F-32,3,8,'#c6ae7d');r(c,x-5,F-3,w+10,3,'#a2a697');}
 function brick(c,x,y,w,h,color){r(c,x,y,w,h,color);for(let yy=y+9;yy<y+h;yy+=13){r(c,x,yy,w,1,'#27313a');for(let xx=x+(yy%2?5:17);xx<x+w;xx+=31)r(c,xx,yy-12,1,12,'#29333b');}}
 function window(c,x,y,w,h,lit){r(c,x-2,y-2,w+4,h+4,'#101c27');r(c,x,y,w,h,lit?'#b5a17b':'#344751');r(c,x+2,y+2,w-4,h-4,lit?'#706a58':'#21343f');r(c,x+w/2,y,2,h,'#47555e');r(c,x,y+h-3,w,3,'#67716f');}
 function facade(c,x,F,w,h,color,lit){
  brick(c,x,F-h,w,h,color);r(c,x-5,F-h-7,w+10,7,'#111e29');r(c,x-5,F-h-7,w+10,2,'#79817b');
  for(let yy=F-h+26;yy<F-85;yy+=54)for(let xx=x+16;xx<x+w-24;xx+=48)window(c,xx,yy,25,32,lit&&((xx+yy)%5<2));
  r(c,x,F-89,w,5,'#17232d');r(c,x,F-88,w,1,'#858777');
  for(let xx=x+20;xx<x+w-35;xx+=80){door(c,xx,F);r(c,xx+7,F-86,20,3,'#bca882');r(c,xx+8,F-83,18,2,lit?'#e7c695':'#75888b');}
  r(c,x+w-9,F-h+1,9,h-1,'#1a2a34');
  for(let j=0;j<Math.floor(w/13);j++){let xx=x+(j*47)%w,yy=F-h+15+(j*37)%(h-24);r(c,xx,yy,3+j%5,1,j%3?'#53606a':'#192b36');}
  for(let yy=F-h+72;yy<F-90;yy+=54){r(c,x+4,yy,w-13,2,'#1b2b36');r(c,x+4,yy+2,w-13,1,'#55626a');}
 }
 function cabinet(c,x,F,w=58){r(c,x,F-94,w,94,'#10202a');r(c,x+3,F-91,w-6,88,'#4a5e64');r(c,x+7,F-86,w-14,26,'#122c36');r(c,x+11,F-81,w-22,3,'#8caaa9');for(let y=F-49;y<F-10;y+=8)r(c,x+8,y,w-16,2,'#243c46');r(c,x+w-10,F-56,3,9,'#c0ad7b');}
 function rail(c,x,F,w){r(c,x,F-61,w,3,'#8b9e99');r(c,x,F-31,w,2,'#405f66');for(let xx=x;xx<=x+w;xx+=35){r(c,xx,F-60,4,60,'#1a303b');r(c,xx,F-60,1,60,'#76938f');}r(c,x-4,F-3,w+12,3,'#263d46');}
 function paint(c,id,width,F){
  paints++;const color=themes[id][0];
  if(id==='access'){
   facade(c,20,F,430,227,color,false);r(c,110,F-134,248,45,'#263d48');for(let i=0;i<8;i++)r(c,120+i*29,F-126,18,27,'#102631');
   for(let x=520;x<width;x+=260){cabinet(c,x,F);r(c,x+84,F-45,106,45,'#5a5548');r(c,x+90,F-40,94,3,'#b7a67e');pipe(c,x+8,F-180,12,85);}
  }else if(id==='approaches'){
   for(const [x,w,h] of [[0,480,208],[610,335,284],[1110,290,245],[1570,440,196],[2230,520,310]])facade(c,x,F,w,h,color,false);
   // The surviving handrail is on its authored 110..210 interaction span.
   rail(c,110,F,100);r(c,0,94,670,19,'#142632');r(c,0,94,670,3,'#668186');
   for(let x=32;x<670;x+=120){r(c,x,113,9,129,'#223843');r(c,x+2,113,2,129,'#546b70');}
   for(let x=750;x<width;x+=740){pipe(c,x,F-171,15,171);r(c,x-35,F-25,100,25,'#263a42');}
  }else if(id==='services'){
   facade(c,0,F,690,258,color,false);facade(c,965,F,340,217,'#3b4b4c',true);
   // Secondary room entrance stays behind Iona at x1020; never a new door.
   r(c,1009,F-104,76,22,'#192d36');door(c,1020,F,52);
   for(let x=90;x<1850;x+=220){pipe(c,x,184,12,246);r(c,x,184,130,10,'#607778');r(c,x,186,130,2,'#b4aaa0');cabinet(c,x+40,F);}
   for(let x=1390;x<1850;x+=120){r(c,x,F-142,86,142,'#203640');r(c,x+5,F-135,76,126,'#465b60');for(let y=F-125;y<F-20;y+=13)r(c,x+12,y,62,4,'#1d323e');}
  }else if(id==='shelters'){
   for(let x=0;x<width;x+=370)facade(c,x,F,326,260+(x%3)*18,color,true);
   // Occupied frontage is preserved; scenery never asserts a person is safe.
   r(c,732,F-130,255,9,'#8d7a63');r(c,732,F-130,255,2,'#bdac8d');r(c,739,F-121,7,121,'#263b43');r(c,975,F-121,7,121,'#263b43');
   for(let x=620;x<=1016;x+=36){r(c,x-12,F-53,24,49,'#1b2c36');r(c,x-10,F-50,20,44,'#4e5554');r(c,x+6,F-30,2,5,'#c5ab78');}
   for(let x=1140;x<width;x+=460){r(c,x,F-80,94,80,'#1b2f39');r(c,x+3,F-78,88,4,'#687c79');rail(c,x+115,F,140);}
  }else if(id==='departure'){
   facade(c,0,F,570,199,color,false);r(c,620,156,1140,20,'#213945');r(c,620,156,1140,3,'#8d9994');
   for(let x=650;x<1800;x+=330){r(c,x,176,12,254,'#344b55');r(c,x+2,176,3,254,'#788e90');r(c,x-10,F-8,34,8,'#142a35');}
   for(let x=720;x<1350;x+=148){r(c,x,F-65,125,65,'#40535d');r(c,x+3,F-63,119,3,'#8b9390');for(let xx=x+9;xx<x+120;xx+=14)r(c,xx,F-59,3,54,'#293e49');}
   rail(c,1470,F,300);r(c,1493,F-145,8,145,'#8b9c93');r(c,1493,F-145,86,9,'#9eaa96');
  }else{
   facade(c,320,F,980,268,color,true);r(c,550,F-151,490,19,'#566d69');r(c,550,F-151,490,3,'#c2c4ac');
   for(let x=580;x<1060;x+=160){r(c,x,F-130,112,6,'#b7c0a9');door(c,x+30,F,47);}
   for(let x=570;x<1050;x+=174){r(c,x,F-34,74,7,'#738f88');r(c,x+4,F-27,5,27,'#2f4852');r(c,x+65,F-27,5,27,'#2f4852');}
   rail(c,80,F,200);rail(c,1380,F,290);
  }
 }
 function layer(id,width,F){
  if(!root.document)return null;const key=id+':'+width+':'+F;
  if(cache.has(key)){const value=cache.get(key);cache.delete(key);cache.set(key,value);return value;}
  const cv=root.document.createElement('canvas');cv.width=width;cv.height=F;paint(cv.getContext('2d'),id,width,F);cache.set(key,cv);
  if(cache.size>2)cache.delete(cache.keys().next().value);return cv;
 }
 function world(c,m,cam,F=430,width=1920){
  const id=themes[m.player.sector]?m.player.sector:'access',W=c.canvas.width,H=c.canvas.height;
  c.save();c.imageSmoothingEnabled=false;
  r(c,0,0,W,H,'#0b1723');r(c,0,85,W,190,'#202338');r(c,0,190,W,160,'#33313e');
  // Static violet dusk bands and distant ruined silhouettes use separate parallax.
  poly(c,[[0,78],[W*.3,116],[W*.58,83],[W,106],[W,116],[W*.57,94],[W*.3,127],[0,88]],'#303047');
  poly(c,[[0,95],[W*.3,132],[W*.58,98],[W,121],[W,125],[W*.57,104],[W*.3,139],[0,101]],'#3a324c');
  for(let i=-1;i<15;i++){const x=i*156-((cam*.22)%156),h=82+(i*37%80);r(c,x,330-h,118,h,'#182531');r(c,x+9,326-h,13,7,'#182531');for(let j=0;j<3;j++)r(c,x+18+j*27,345-h,6,10,'#4c4853');}
  if(m.stage==='assault')for(let i=0;i<85;i++){const x=((i*67-cam*.1)%W+W)%W;r(c,x,302+i%5*3,3,8,'#76505f');r(c,x,300+i%5*3,3,2,'#8c5f68');}
  const art=layer(id,width,F);if(art)c.drawImage(art,Math.round(-cam),0);else{c.save();c.translate(-cam,0);paint(c,id,width,F);c.restore();}
  r(c,0,F,W,H-F,'#162631');r(c,0,F,W,4,'#80918a');r(c,0,F+4,W,7,'#0d1e2a');
  for(let wx=Math.floor(cam/96)*96;wx<cam+W+96;wx+=96){const x=wx-cam;for(let j=0;j<7;j++)r(c,x+(j*37+wx)%81,F+18+j*13,7+j*3,1,j%2?'#344650':'#213641');r(c,x+14,F+8,24,6,'#091b26');for(let k=0;k<6;k++)r(c,x+16+k*4,F+9,1,4,'#50666b');}
  c.restore();return true;
 }
 function ship(c,x,y,sealed){
  c.save();c.translate(Math.round(x),Math.round(y));
  // Heavy transport is one visible hull in a multi-hull arrival, never capacity proof.
  poly(c,[[0,40],[32,18],[110,18],[137,0],[330,0],[382,28],[463,42],[488,75],[475,100],[36,100],[4,77]],'#111e2b');
  poly(c,[[14,44],[38,25],[120,25],[145,8],[323,8],[372,36],[454,48],[474,76],[458,89],[45,89],[17,74]],'#4e5660');
  r(c,47,57,385,29,'#303f4a');r(c,142,13,171,7,'#848383');r(c,358,40,77,14,'#132c39');
  for(let i=0;i<7;i++){r(c,65+i*41,30,7,60,'#202e3c');r(c,66+i*41,30,2,53,'#81908e');}
  r(c,199,35,81,64,sealed?'#4e4c51':'#111923');for(let i=0;i<5;i++)r(c,205+i*14,38,3,55,sealed?'#80706a':'#2b2634');
  for(const xx of [53,376]){r(c,xx,93,13,56,'#111e29');r(c,xx-8,144,39,7,'#60716f');}
  for(const xx of [38,310,444]){r(c,xx,76,12,4,'#bca16f');r(c,xx+2,76,3,2,'#f4d3a2');}
  poly(c,[[205,100],[278,100],[310,151],[174,151]],sealed?'#30353d':'#5b4b54');for(let j=0;j<5;j++)r(c,196-j*3,110+j*8,91+j*6,2,'#9a7a75');
  c.restore();
 }
 function carrier(c,x,F,color='#5c8590'){
  c.save();c.translate(Math.round(x),F);poly(c,[[-68,-47],[40,-47],[63,-28],[68,-10],[-68,-10]],'#0b1b28');
  poly(c,[[-65,-44],[38,-44],[58,-27],[64,-13],[-65,-13]],color);r(c,-59,-41,83,19,'#172c39');
  for(let i=0;i<6;i++)r(c,-56+i*13,-38,9,12,'#729498');r(c,32,-39,11,15,'#a4b8b0');
  r(c,-62,-21,120,3,'#9ba89c');r(c,59,-22,4,5,'#e5c18c');
  for(const xx of [-44,43]){r(c,xx-10,-16,20,18,'#08131f');r(c,xx-6,-12,12,11,'#637982');r(c,xx-3,-9,6,5,'#202f40');}
  c.restore();
 }
 function person(c,x,F,color,label,step){
  x=Math.round(x);const stride=step?Math.round(Math.sin(step)*3):0,leftLift=Math.max(0,stride),rightLift=Math.max(0,-stride);
  r(c,x-8,F-34,16,22,'#101d29');r(c,x-6,F-33,12,20,color);r(c,x-6,F-47,12,13,'#142632');r(c,x-4,F-44,8,9,'#b49b83');r(c,x-7,F-48,14,5,'#243947');
  r(c,x-11,F-31-stride,4,16,'#182733');r(c,x+7,F-31+stride,4,16,'#182733');r(c,x-6,F-12,5,10-leftLift,'#1b2936');r(c,x+2,F-12,5,10-rightLift,'#1b2936');r(c,x-8,F-3-leftLift,8,3,'#101a26');r(c,x+1,F-3-rightLift,8,3,'#101a26');
  // Distinguish an evacuation crew from residents at gameplay scale.
  const robot=color==='#7f9dba',infected=color==='#9a405d'||color==='#584e64';
  if(robot){
   r(c,x-8,F-47,16,10,'#526b83');r(c,x-6,F-43,12,3,'#a6d7d2');
   r(c,x-10,F-33,20,6,'#91aabb');r(c,x-5,F-25,10,4,'#384e62');
  }else if(infected){
   poly(c,[[x-10,F-27],[x-14,F-42],[x-5,F-33],[x+1,F-38],[x+5,F-29]],'#753951');
   r(c,x-3,F-40,7,2,'#c48883');r(c,x+3,F-28,3,13,'#b96d78');
  }else{
   r(c,x-5,F-33,3,17,'#394451');r(c,x-5,F-24,9,3,'#627276');
   r(c,x-6,F-15,12,3,'#344152');r(c,x+3,F-18,4,5,'#788078');
   if(color==='#ddaf68'||color==='#6c8d78'){
    r(c,x-6,F-49,12,5,color);r(c,x-8,F-45,17,3,color);
    r(c,x-5,F-32,2,12,'#d5c79e');r(c,x+3,F-32,2,12,'#d5c79e');
   }
  }
  if(label){c.fillStyle='#cedbdd';c.font='10px monospace';c.textAlign='left';c.fillText(label,x-22,F-56);}
 }
 root.TechOpsLowQuarterArt={world:world,ship:ship,carrier:carrier,person:person,cacheStats:()=>({count:cache.size,paints:paints})};
 if(typeof module==='object')module.exports=root.TechOpsLowQuarterArt;
})(typeof globalThis!=='undefined'?globalThis:this);
