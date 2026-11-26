/* Low Quarter scene-art renderer. Read-only projection of the opening operation.
 * Pixel silhouettes/costumes use the recovered K/Iona references listed in the
 * graphics manifest. New pixel renditions require creator likeness acceptance.
 * No timers, random gameplay values, save writes or authority mutations. */
(function(root){'use strict';
 const VERSION=2,FLOOR=330,cache=new Map(),lastHP=new Map();let previous=null,lastRun=null,lastCanvas=null,lastState=null;
 const characterAssets={};
 if(typeof root.Image==='function'){
  for(const [key,url] of Object.entries({freight:'assets/low-quarter-style-review/freight-actions-candidate.webp',defenders:'assets/low-quarter-style-review/defender-actions.webp',iona:'assets/low-quarter-style-review/iona-nightwalker-atlas.webp',k:'assets/low-quarter-style-review/k-iona-duo.webp',roles:'assets/low-quarter-style-review/supporting-roles-candidate.webp',variants:'assets/low-quarter-style-review/resident-infected-variants.webp',props:'assets/low-quarter-style-review/interactive-props-candidate.webp',kWalk:'assets/low-quarter-style-review/k-walk-candidate.webp',ship:'assets/low-quarter-style-review/infected-ship-candidate.webp',approaches:'assets/low-quarter-style-review/approaches-background.webp',services:'assets/low-quarter-style-review/services-background.webp',shelters:'assets/low-quarter-style-review/shelters-background.webp',departure:'assets/low-quarter-style-review/departure-background.webp',receiving:'assets/low-quarter-style-review/receiving-background.webp'})){
   const image=new root.Image();characterAssets[key]=image;image.onload=()=>{if(lastCanvas&&lastState)draw(lastCanvas,lastState);};image.src=url;
  }
 }
 function referenceStyleCharacter(c,x,y,kind,pose,t,facing,index=0){
  const n=Number.isFinite(index)?Math.abs(index):0;
  const useVariants=(kind==='civilian'&&n%5>=2)||(kind==='infected'&&n%4!==0);
  const variant=characterAssets.variants,readyVariant=useVariants&&variant&&variant.complete&&variant.naturalWidth;
  const img=readyVariant?variant:characterAssets[kind==='iona'||kind==='k'?kind:'roles'];if(!img||!img.complete||!img.naturalWidth)return false;
  c.save();c.translate(Math.round(x),Math.round(y));c.scale(facing||1,1);c.imageSmoothingEnabled=true;
  const freight=characterAssets.freight;
  const action=(kind==='infected' && n%4===0)
    ? {walk:Math.floor(x/18)&1,strike:2,hurt:3,down:4}[pose]
    : kind==='k' ? {work:0,strike:1,hurt:2}[pose] : undefined;
  if(action!==undefined && freight?.complete && freight.naturalWidth){
   const row=kind==='k'?0:1;
   const cell=pose==='walk' && root.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 0 : action;
   c.drawImage(freight,cell*224,row*224,224,224,-62,-119,124,124);
  }else if(kind==='infected' && pose==='down'){
   c.restore();
   return true;
  }else if(kind==='iona'){
   const fixed={work:20,hurt:22,down:23,jump:5};
   const n=fixed[pose] ?? (pose==='strike'?7:pose==='walk'?1+Math.floor(t*7)%4:0);
   c.drawImage(img,(n%6)*256,Math.floor(n/6)*256,256,256,-64,-119,128,128);
  }else if(kind==='k'){
   const walk=characterAssets.kWalk;
   if(pose==='walk'&&walk&&walk.complete&&walk.naturalWidth){const cell=walk.naturalWidth/6,n=Math.floor(t*7)%6;c.drawImage(walk,n*cell,0,cell,walk.naturalHeight,-38,-132,76,152);}
   else c.drawImage(img,0,0,887,887,-65,-125,130,130);
  }
  else{const slot=readyVariant?(kind==='civilian'?n%5-2:3+(n%4-1)):kind==='civilian'?n%2:kind==='medic'?2:kind==='military'?3:kind==='robot'?4:kind==='infected'?5:-1;
   if(slot<0){c.restore();return false;}c.drawImage(img,(slot%3)*512,Math.floor(slot/3)*512,512,512,-62,-121,124,124);
  }
  c.restore();return true;
 }
 const AREAS={
  approaches:{name:'FREIGHT APPROACH',subtitle:'Watch post / eastern ingress',sky:['#111324','#263044','#504052'],brick:'#33313c',light:'#d59b58',accent:'#e7b96a'},
  services:{name:'SERVICE EXCHANGE',subtitle:'Power / radio / local command',sky:['#101b27','#243b46','#426071'],brick:'#2e4148',light:'#91cfbd',accent:'#8ddac7'},
  shelters:{name:'SHELTER COURTYARD',subtitle:'Civilian care / protected rooms',sky:['#191c2b','#384347','#70504e'],brick:'#51443f',light:'#edbd7c',accent:'#b5d39e'},
  departure:{name:'DEPARTURE ROAD',subtitle:'Witnessed crossing / ground transport',sky:['#111b2b','#2a3b52','#545066'],brick:'#38414d',light:'#e2b987',accent:'#9bb9d5'},
  receiving:{name:'RECEIVING YARD',subtitle:'Independent care / confirmed arrivals',sky:['#152329','#34494a','#687168'],brick:'#3c4a47',light:'#cdd3a0',accent:'#acdbbb'}
 };
 const ink='#0a1019',skin=['#c68f6b','#b97c58','#875d48','#d7ae87','#996e51','#c79c7b'];
 const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h));};
 function poly(c,pts,color){c.fillStyle=color;c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(Math.round(x),Math.round(y)):c.moveTo(Math.round(x),Math.round(y)));c.closePath();c.fill();}
 function text(c,t,x,y,size=12,color='#e3e9e0',align='left'){c.fillStyle=color;c.font='600 '+size+'px monospace';c.textAlign=align;c.fillText(t,Math.round(x),Math.round(y));}
 function line(c,x,y,xx,yy,color,width=1){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(Math.round(x),Math.round(y));c.lineTo(Math.round(xx),Math.round(yy));c.stroke();}
 function windowPane(c,x,y,w,h,lit){rect(c,x-3,y-3,w+6,h+6,ink);rect(c,x,y,w,h,lit?'#ad956b':'#2d4b58');rect(c,x+3,y+3,w-6,h-6,lit?'#d1b17b':'#41616b');rect(c,x+w/2-1,y,3,h,ink);rect(c,x,y+h/2-1,w,3,ink);rect(c,x-5,y+h,w+10,4,'#677278');}
 function building(c,x,top,w,a,index){rect(c,x+5,top-7,w-10,7,'#62616b');rect(c,x,top,w,330-top,a.brick);rect(c,x,top,w,7,'#747477');rect(c,x+w-12,top+7,12,330-top,'#1b2830');
  for(let y=top+12;y<325;y+=11){line(c,x,y,x+w-14,y,'#202a32');for(let xx=x+(Math.floor(y/11)%2?12:0);xx<x+w-13;xx+=27)line(c,xx,y,xx,y+10,'#252d35');}
  for(let y=top+22;y<270;y+=63)for(let xx=x+17;xx<x+w-35;xx+=57)windowPane(c,xx,y,27,35,(index+Math.floor(xx/57)+Math.floor(y/63))%4===0);
  rect(c,x+18,277,34,53,ink);rect(c,x+22,281,26,49,'#35434a');rect(c,x+25,291,20,13,'#25333b');rect(c,x+43,309,3,3,'#c2ab76');
  for(let y=top+12;y<318;y+=22){rect(c,x+w-7,y,3,14,'#73818a');rect(c,x+w-12,y+13,11,3,'#455562');}
 }
 function background(room){if(cache.has(room))return cache.get(room);if(!root.document)return null;
  const b=root.document.createElement('canvas');b.width=1900;b.height=420;const c=b.getContext('2d'),a=AREAS[room];
  for(let y=0;y<330;y+=12)rect(c,0,y,1900,12,a.sky[Math.min(2,Math.floor(y/105))]);
  // Broken cloud bands retain a clear action plane; no moving full-screen flash.
  for(let i=0;i<17;i++){const x=i*143-80,y=42+i%4*24;rect(c,x,y,100+i%3*37,8,'#484454');rect(c,x+19,y+8,121,7,'#39394b');}
  for(let i=0;i<19;i++){const x=i*103,top=120+(i*31)%90;rect(c,x,top,77,330-top,'#1a2837');for(let j=0;j<5;j++)rect(c,x+8+j*12,top+15,3,4,i%3?'#496272':'#ae8b65');}
  // Five authored street fronts, sharing the physical 1800px operation span.
  const fronts=room==='approaches'?[[20,150,170],[270,115,160],[600,170,140],[1340,140,240],[1610,180,200]]:
   room==='services'?[[0,95,185],[260,130,220],[750,110,200],[1240,135,210],[1640,90,240]]:
   room==='shelters'?[[0,90,210],[260,145,180],[760,105,210],[1040,160,250],[1490,100,280]]:
   room==='departure'?[[10,140,210],[340,110,240],[710,170,190],[1410,130,300]]:[[0,150,270],[320,165,220],[930,170,260],[1480,130,340]];
  fronts.forEach(([x,y,w],i)=>building(c,x,y,w,a,i));
  for(let x=0;x<1800;x+=250){line(c,x,78,x+250,88,'#111a25',3);line(c,x,81,x+250,91,'#59616b',1);}
  rect(c,0,326,1900,8,'#76878c');rect(c,0,334,1900,9,'#26363f');rect(c,0,343,1900,77,'#121d29');
  for(let x=0;x<1900;x+=17){rect(c,x,326,14,2,'#b2b7ab');rect(c,x+7,345+(x*13)%65,8,1,'#233642');}
  for(let x=20;x<1900;x+=120){rect(c,x,377,48,3,'#b49c68');rect(c,x+2,380,43,1,'#514e43');}
  for(let x=63;x<1900;x+=303){rect(c,x,336,50,6,ink);for(let j=0;j<7;j++)rect(c,x+4+j*6,337,2,4,'#70818b');}
  // Sector-specific dressing never changes route/collision geometry.
  if(room==='approaches'){
   for(let x=0;x<1800;x+=240){rect(c,x,297,100,12,'#494a48');rect(c,x+6,286,88,11,'#66644e');for(let j=0;j<6;j++)rect(c,x+11+j*14,289,11,3,'#89806a');}
   line(c,1190,110,1190,325,'#11212c',10);line(c,1190,110,1440,110,'#11212c',8);line(c,1190,113,1320,180,'#677584',2);line(c,1435,110,1435,230,'#85919a',2);
  }
  if(room==='services'){
   for(let x=280;x<1500;x+=430){rect(c,x,205,72,102,'#172a32');rect(c,x+5,211,62,90,'#52616a');for(let j=0;j<6;j++)rect(c,x+10,218+j*12,50,3,'#23353d');}
   for(let x=50;x<1800;x+=290){rect(c,x,254,6,72,'#78848a');rect(c,x-6,251,38,7,'#70808b');rect(c,x+26,251,6,65,'#4c626d');}
  }
  if(room==='shelters'){
   for(let x=430;x<1100;x+=540){rect(c,x,230,175,8,'#4b655e');poly(c,[[x-12,230],[x+50,214],[x+190,230]],'#8d9b77');rect(c,x+7,238,6,89,'#716c5b');rect(c,x+160,238,6,89,'#716c5b');}
   for(let x=120;x<1800;x+=550){rect(c,x,293,70,34,'#4e4b43');for(let i=0;i<7;i++){rect(c,x+5+i*9,285-i%3*5,5,14,'#667c58');rect(c,x+4+i*9,282-i%3*5,7,3,'#b88f99');}}
   for(let x=700;x<1500;x+=260){rect(c,x,302,90,6,'#a58c66');rect(c,x+5,308,7,19,'#343b39');rect(c,x+78,308,7,19,'#343b39');}
  }
  if(room==='departure'||room==='receiving'){
   for(let x=20;x<1800;x+=100){rect(c,x,285,4,42,'#687c84');line(c,x,290,x+100,290,'#6e8288');line(c,x,308,x+100,308,'#4a636b');}
   for(let x=0;x<1800;x+=75)rect(c,x,350,40,1,'#456069');
   if(room==='receiving'){rect(c,540,210,160,10,'#a7bca9');rect(c,548,220,144,92,'#617a72');rect(c,568,223,57,104,'#183038');rect(c,632,238,46,48,'#9bb1a3');rect(c,649,247,11,28,'#456b5c');rect(c,641,255,27,11,'#456b5c');}
  }
  cache.set(room,b);return b;
 }
 function lamp(c,x,accent){rect(c,x,198,5,132,'#1a2932');rect(c,x-1,195,30,5,'#697a80');rect(c,x+22,198,8,7,'#c5ac7b');poly(c,[[x+18,206],[x+39,206],[x+73,330],[x-20,330]],'rgba(222,180,104,.065)');rect(c,x+21,202,10,3,accent);}
 function silhouette(c,x,y,kind,index,pose,t,facing=1){
  c.save();c.translate(Math.round(x),Math.round(y));c.scale(facing,1);
  const walk=pose==='walk'?Math.floor(t*9)%4:0,leg=pose==='walk'?[0,4,0,-4][walk]:0,bob=pose==='walk'&&walk%2?1:0;
  c.translate(0,-bob);
  const primary=kind==='iona'?'#3d474d':kind==='k'?'#24303d':kind==='military'?'#586b67':kind==='medic'?'#809a88':kind==='infected'?'#685064':['#79635e','#647782','#91836a','#5e6d70'][index%4];
  const light=kind==='k'?'#465666':kind==='iona'?'#687178':kind==='military'?'#87928b':kind==='infected'?'#a27884':'#aca18c',tone=kind==='iona'?'#c69471':kind==='k'?'#986446':skin[index%skin.length];
  // Contact shadow is drawn by caller before facing; all body pixels share one baseline.
  poly(c,[[-12,-38],[-13,-15+leg],[-16-leg,-4-Math.max(0,leg)],[-15-leg,-Math.max(0,leg)],[-2-leg,-Math.max(0,leg)],[-3-leg,-9],[-1,-35]],ink);
  poly(c,[[1,-37],[3,-14-leg],[leg,-4-Math.max(0,-leg)],[2+leg,-Math.max(0,-leg)],[16+leg,-Math.max(0,-leg)],[16+leg,-5-Math.max(0,-leg)],[11+leg,-13],[11,-37]],ink);
  poly(c,[[-10,-37],[-10,-16+leg],[-12-leg,-7-Math.max(0,leg)],[-5-leg,-7-Math.max(0,leg)],[-2,-34]],'#303b48');
  poly(c,[[3,-35],[5,-15-leg],[8+leg,-7-Math.max(0,-leg)],[13+leg,-7-Math.max(0,-leg)],[9,-36]],'#40505a');
  rect(c,-14-leg,-5-Math.max(0,leg),12,3,'#5e696e');rect(c,3+leg,-5-Math.max(0,-leg),13,3,'#55616a');
  // Rotate the upper body around the hips; the feet keep their street baseline.
  if(kind==='infected'){c.translate(0,-35);c.rotate(.27);c.translate(0,35);}
  poly(c,[[-10,-67],[7,-67],[16,-55],[12,-32],[-12,-32],[-15,-56]],ink);
  poly(c,[[-8,-65],[5,-65],[12,-54],[9,-35],[-10,-35],[-12,-54]],primary);
  rect(c,-6,-61,4,21,light);rect(c,-6,-61,3,21,primary);rect(c,5,-59,2,22,'#17212b');rect(c,-8,-41,7,4,'#202d36');rect(c,4,-42,5,4,'#202d36');
  line(c,-10,-49,8,-50,light);rect(c,-11,-35,23,3,'#141f28');rect(c,-2,-34,4,3,'#8c8b7b');
  const reach=kind==='infected'?20:pose==='strike'?25:pose==='work'?13:1,armSwing=pose==='walk'?leg:0;
  poly(c,[[-12,-61],[-19,-48+armSwing],[-18,-32+armSwing],[-11,-31+armSwing],[-10,-46]],ink);
  poly(c,[[-12,-59],[-16,-47+armSwing],[-15,-35+armSwing],[-12,-35+armSwing],[-9,-48]],primary);rect(c,-16,-34+armSwing,6,6,tone);
  poly(c,[[9,-61],[16+reach,-52],[14+reach,-36],[9+reach,-36],[10+reach,-48],[4,-51]],ink);
  poly(c,[[9,-58],[13+reach,-51],[11+reach,-39],[9+reach,-39],[8+reach,-48],[5,-51]],light);rect(c,8+reach,-39,6,7,tone);
  // Face profile: actual Iona/K references, current hair/costume correction applied.
  rect(c,-5,-74,10,10,tone);poly(c,[[-8,-87],[5,-88],[11,-80],[12,-73],[7,-68],[-3,-69],[-9,-77]],ink);
  poly(c,[[-6,-84],[5,-84],[8,-79],[9,-75],[12,-74],[9,-72],[8,-69],[0,-68],[-4,-73]],tone);
  rect(c,1,-81,6,2,'#e1b38b');rect(c,4,-78,3,2,ink);rect(c,5,-77,1,1,'#dbc8a5');rect(c,7,-71,3,1,'#684433');rect(c,-6,-77,4,6,'#b78566');
  if(kind==='iona'){
   poly(c,[[-10,-85],[-6,-91],[3,-92],[9,-88],[11,-83],[8,-80],[5,-81],[3,-80],[1,-83],[-2,-79],[-5,-80],[-6,-75],[-10,-77]],'#0c131e');
   poly(c,[[-10,-84],[-6,-82],[-6,-75],[-9,-71],[-11,-69],[-9,-77]],'#101720');
   rect(c,-6,-87,9,2,'#37404c');rect(c,-8,-83,2,5,'#29313d');rect(c,-5,-74,2,3,'#c3bdb0');rect(c,-7,-74,1,2,'#e0d8b9');
   if(pose==='strike'){line(c,21,-41,39,-36,'#afa485',2);line(c,39,-36,45,-49,'#aea38c',1);line(c,45,-49,55,-47,'#bfb19b',3);}
  }else if(kind==='k'){
   poly(c,[[-12,-88],[-10,-94],[-4,-97],[4,-97],[9,-93],[11,-86]],'#111923');rect(c,-12,-89,23,5,'#273440');for(let i=-7;i<9;i+=4)rect(c,i,-95,1,9,'#36404a');
   rect(c,-9,-85,4,12,'#101822');poly(c,[[-13,-82],[-10,-85],[-6,-85],[-3,-82],[-3,-75],[-6,-72],[-10,-72],[-13,-75]],'#778587');rect(c,-11,-81,6,7,'#202a36');line(c,-7,-88,5,-91,'#7a8787',2);
   poly(c,[[-3,-74],[2,-72],[8,-74],[8,-67],[1,-64],[-4,-69]],'#1b1c22');rect(c,-1,-70,3,3,'#3b302b');
   // Clear lenses leave skin visible; the historical atlas's dark lenses are not reused.
   line(c,-1,-80,9,-79,'#bdcac5');line(c,0,-76,8,-75,'#bdcac5');line(c,0,-80,0,-76,'#bdcac5');line(c,8,-79,8,-75,'#bdcac5');rect(c,1,-79,2,1,'#e4e8d2');
   rect(c,-16,-56,5,7,'#7da88c');
  }else if(kind==='military'){
   poly(c,[[-11,-84],[-8,-91],[3,-93],[10,-88],[12,-82]],'#465c59');rect(c,-11,-83,23,3,'#809087');rect(c,-7,-60,5,18,'#3a514c');rect(c,2,-60,6,17,'#364b48');rect(c,-7,-57,5,2,'#8c9d8d');
  }else if(kind==='medic'){rect(c,-10,-90,20,7,'#a0b7a5');rect(c,-2,-89,3,5,'#406b58');rect(c,-4,-87,7,1,'#406b58');rect(c,-8,-55,6,7,'#b4ccba');}
  else if(kind==='infected'){
   poly(c,[[-9,-88],[-2,-94],[9,-86],[7,-80],[-6,-79]],'#353040');rect(c,5,-78,3,2,'#e5ab97');rect(c,8,-74,3,3,'#8e575c');line(c,-11,-54,7,-42,'#b37a83',3);line(c,4,-59,-8,-34,'#80607b',2);rect(c,10,-49,4,8,'#7e5266');
  }else{poly(c,[[-10,-84],[-7,-91],[3,-91],[9,-87],[10,-82],[1,-81],[-5,-79]],['#302c30','#625044','#202d35','#464445'][index%4]);if(index%3===0)rect(c,-9,-51,21,3,'#aa9874');}
  c.restore();
  // Keep the K glyph readable in both directions rather than mirroring its lettering.
  if(kind==='k'){const bx=x+(facing===1?-15:12),by=y-bob-55;rect(c,bx,by,1,5,'#162d27');rect(c,bx+2,by,1,2,'#162d27');rect(c,bx+1,by+2,1,1,'#162d27');rect(c,bx+2,by+3,1,2,'#162d27');}
 }
 function person(c,x,y,kind,index,pose,t,facing=1){rect(c,x-15,y+1,29,3,'rgba(2,9,17,.40)');if(referenceStyleCharacter(c,x,y,kind,pose,t,facing,index))return;silhouette(c,x,y,kind,index,pose,t,facing);}
 function drawDefender(c,b,calm){
  const art=characterAssets.defenders;
  if((b.pose==='walk'||b.ready)&&art?.complete&&art.naturalWidth){
   const strides=[0,1,2,1];
   const frame=b.ready?3:calm?1:strides[Math.floor(Math.abs(b.x)/18)%4];
   c.save();c.translate(Math.round(b.x),Math.round(b.y));c.scale(b.facing||1,1);
   c.imageSmoothingEnabled=true;
   c.drawImage(art,frame*192,b.kind==='robot'?192:0,192,192,-62,-120,124,124);
   c.restore();
  }else if(b.kind==='robot'&&!referenceStyleCharacter(c,b.x,b.y,'robot','idle',0,b.facing)){
   robot(c,b.x,b.y,b.ready);
  }else if(b.kind==='military'){
   person(c,b.x,b.y,b.kind,b.i,b.pose,0,b.facing);
  }
 }
 function robot(c,x,y,ready){
  c.save();c.translate(x,y);
  rect(c,-32,1,64,3,'#101b24');
  for(const side of [-1,1]){
   line(c,side*13,-33,side*28,-20,ink,8);
   line(c,side*28,-20,side*24,-4,'#91a4a2',5);
   rect(c,side*28-4,-24,8,8,'#526775');
   rect(c,side*24-8,-5,16,5,'#283a46');
  }
  poly(c,[[-24,-48],[-16,-58],[15,-58],[24,-48],[17,-32],[-15,-32]],ink);
  poly(c,[[-20,-47],[-13,-54],[13,-54],[19,-46],[13,-36],[-12,-36]],'#728d90');
  rect(c,-13,-50,26,9,'#162b38');rect(c,-10,-48,20,3,ready?'#9ee3c7':'#d6b879');
  c.restore();
 }
 function ship(c,x,y,w,breach,t,calm){const h=w*.29,art=characterAssets.ship;if(art&&art.complete&&art.naturalWidth){c.drawImage(art,x,y,w,w*art.naturalHeight/art.naturalWidth);return;}c.save();c.translate(Math.round(x),Math.round(y));
  poly(c,[[0,9],[w*.16,0],[w*.72,0],[w*.95,h*.3],[w,h*.7],[w*.7,h],[w*.14,h*.82]],'#0d1620');poly(c,[[w*.07,12],[w*.21,4],[w*.72,5],[w*.91,h*.35],[w*.85,h*.67],[w*.13,h*.65]],'#56606c');
  rect(c,w*.25,-h*.12,w*.38,h*.34,'#353e4c');rect(c,w*.29,-h*.08,w*.3,3,'#89918c');for(let i=0;i<6;i++){rect(c,w*.18+i*w*.1,h*.3,w*.065,h*.13,'#283c4a');rect(c,w*.19+i*w*.1,h*.31,w*.04,2,'#b09575');}
  poly(c,[[w*.13,h*.68],[w*.3,h*.62],[w*.46,h*.83],[w*.66,h*.64],[w*.85,h*.73],[w*.76,h*.95],[w*.3,h*.94]],'#713f51');for(let i=0;i<6;i++){const xx=w*(.24+i*.1);line(c,xx,h*.74,xx+3,h*(1.12+(calm?0:Math.sin(t+i)*.12)),'#895064',Math.max(1,w/120));}
  rect(c,w*.12,h*.62,w*.14,4,'#cd8a6d');rect(c,w*.75,h*.62,w*.14,4,'#cd8a6d');if(breach){for(let i=0;i<5;i++)rect(c,w*.2+i*13,-13-i%2*8,8,9,'rgba(106,66,91,.35)');}c.restore();}
 function prop(c,p,done,near,t,calm){const x=p.x,y=FLOOR;let type='console';
  if(/lookout|watch/.test(p.id))type='watch';else if(/survey|rota|records|audit|coalition|cooperate/.test(p.id))type='board';else if(/vent|test_/.test(p.id))type='fan';else if(/gate|route|road|veto|challenge/.test(p.id))type='lever';else if(p.id==='care'||p.id==='receiver')type='care';else if(p.id==='van')return;
  const a=done?'#8bc7ad':near?'#edca82':'#9b9e85';
  const art=characterAssets.props;
  if(art&&art.complete&&art.naturalWidth&&type!=='care'){
   const slots={watch:0,board:1,console:(p.id==='radio'||p.id==='isolate')?3:2,fan:4,lever:5},i=slots[type];
   if(i!==undefined){c.drawImage(art,(i%3)*512,Math.floor(i/3)*512,512,512,x-40,y-87,80,92);
    rect(c,x-3,y-89,6,4,a);if(near){line(c,x-12,y-96,x+12,y-96,a);poly(c,[[x-4,y-102],[x+4,y-102],[x,y-98]],a);}if(done){line(c,x-5,y-89,x-1,y-85,'#a5e0bd',2);line(c,x-1,y-85,x+6,y-94,'#a5e0bd',2);}return;}
  }
  if(type==='watch'){rect(c,x-4,y-75,8,75,'#31434e');rect(c,x-18,y-81,38,12,'#1b2f3c');rect(c,x-15,y-78,28,5,'#748f93');rect(c,x+17,y-81,4,12,a);line(c,x,y-55,x-17,y,'#657b7c',3);line(c,x,y-55,x+18,y,'#657b7c',3);}
  if(type==='board'){rect(c,x-25,y-78,50,56,'#172832');rect(c,x-22,y-75,44,49,'#6e7f7a');rect(c,x-17,y-70,17,30,'#c8bc98');rect(c,x+3,y-67,15,22,'#94a89a');for(let i=0;i<4;i++)rect(c,x-14,y-66+i*6,11,1,'#777a6a');rect(c,x-19,y-22,4,22,'#344750');rect(c,x+15,y-22,4,22,'#344750');}
  if(type==='console'){rect(c,x-19,y-73,38,73,'#142631');rect(c,x-16,y-70,32,66,'#4d626c');rect(c,x-12,y-63,24,22,'#142b35');rect(c,x-9,y-60,18,3,a);for(let i=0;i<3;i++)rect(c,x-9,y-54+i*4,10+i*3,1,'#698e90');rect(c,x-12,y-34,7,7,'#b5ab85');rect(c,x+5,y-34,7,7,'#233f4b');for(let i=0;i<3;i++)rect(c,x-11,y-18+i*4,23,1,'#283f4c');if(p.id==='radio'||p.id==='isolate'){line(c,x+11,y-73,x+21,y-103,'#b5bda9',2);line(c,x+21,y-103,x+30,y-98,'#b5bda9',2);}}
  if(p.id==='power'){rect(c,x-15,y-79,30,6,'#354950');for(const dx of [-9,0,9])rect(c,x+dx-2,y-85,4,7,'#a7a78f');}
  if(type==='fan'){rect(c,x-25,y-67,50,67,'#172833');rect(c,x-21,y-63,42,58,'#536c75');rect(c,x-16,y-57,32,32,'#152f3d');const phase=calm?0:t*.8;c.save();c.translate(x,y-41);c.rotate(phase);for(let i=0;i<4;i++){c.rotate(Math.PI/2);poly(c,[[0,0],[2,-12],[9,-8],[8,-2]],'#8b9a96');}c.restore();rect(c,x-4,y-45,8,8,'#a1b6aa');for(let i=-12;i<15;i+=6)line(c,x+i,y-56,x+i,y-26,'#233c48');rect(c,x-15,y-15,30,3,a);}
  if(type==='lever'){rect(c,x-13,y-40,27,40,'#263c47');rect(c,x-9,y-36,19,33,'#6f7770');for(let i=0;i<3;i++)rect(c,x-7,y-33+i*9,15,3,'#b69c63');line(c,x,y-33,x+(done?13:-13),y-56,'#b5b6a1',4);rect(c,x+(done?9:-17),y-60,9,6,a);}
  if(type==='care'){rect(c,x-31,y-24,62,10,'#b2bd9e');rect(c,x-28,y-14,5,14,'#63776e');rect(c,x+23,y-14,5,14,'#63776e');rect(c,x-22,y-45,30,21,'#456d60');rect(c,x-10,y-42,5,14,'#d0d9bd');rect(c,x-15,y-37,15,4,'#d0d9bd');rect(c,x+13,y-36,12,12,'#a3bba4');}
  rect(c,x-3,y-89,6,4,a);if(near){line(c,x-12,y-96,x+12,y-96,a);poly(c,[[x-4,y-102],[x+4,y-102],[x,y-98]],a);}if(done){line(c,x-5,y-89,x-1,y-85,'#a5e0bd',2);line(c,x-1,y-85,x+6,y-94,'#a5e0bd',2);}
 }
 function vehicle(c,x,y,arrived){
  // Passenger door is ten pixels behind center, aligned to departure boarding.
  c.save();c.translate(x,y);
  rect(c,-110,1,221,4,'#0d1720');
  poly(c,[[-111,-96],[-102,-106],[67,-106],[99,-76],[109,-47],[109,-13],[-111,-13]],'#172a35');
  poly(c,[[-106,-93],[-99,-100],[65,-100],[94,-74],[103,-46],[103,-20],[-106,-20]],arrived?'#8fa99c':'#748f8b');
  for(const windowX of [-97,-66,14,44]){
   rect(c,windowX,-91,25,32,'#1b3441');rect(c,windowX+2,-89,21,6,'#617e87');
  }
  poly(c,[[72,-91],[91,-72],[99,-53],[73,-53]],'#28424c');
  rect(c,-106,-49,208,7,'#3b6f64');
  rect(c,-26,-96,33,84,'#182e36');rect(c,-23,-92,27,75,'#384d55');
  rect(c,-21,-88,23,32,'#20343f');rect(c,-2,-50,4,3,'#cbd4ba');
  rect(c,-25,-18,32,5,'#b6baa4');rect(c,-27,-10,36,4,'#748881');
  rect(c,102,-39,6,7,'#e9c787');rect(c,-110,-35,5,6,'#b26a65');
  for(const wheelX of [-73,77]){
   rect(c,wheelX-15,-26,30,25,ink);rect(c,wheelX-11,-23,22,21,'#283b45');rect(c,wheelX-5,-17,10,10,'#97a9a4');
  }
  text(c,'EVAC',36,-32,10,'#e6ead5','center');c.restore();
 }
 function caption(c,label,x,y,W,accent){const w=Math.min(W-20,Math.max(70,label.length*6+16)),xx=Math.max(w/2+5,Math.min(W-w/2-5,x));rect(c,xx-w/2,y-14,w,20,'rgba(9,20,30,.94)');rect(c,xx-w/2,y-14,2,20,accent);text(c,label,xx,y,11,'#e5ecdc','center');}
 function draw(canvas,s){if(!s?.lowQuarterOperation)return;lastCanvas=canvas;lastState=s;const o=s.lowQuarterOperation,room=o.room,a=AREAS[room];if(!a)return;if(lastRun!==s.lowQuarter.runId || previous && (previous.room!==room || previous.tick>o.tick)){lastHP.clear();previous=null;lastRun=s.lowQuarter.runId;}
  const small=(canvas.clientWidth||960)<620,W=small?600:960,H=420;if(canvas.width!==W)canvas.width=W;if(canvas.height!==H)canvas.height=H;
  const c=canvas.getContext('2d');c.save();c.imageSmoothingEnabled=false;const cam=Math.max(0,Math.min(1800-W,o.x-W*.47)),t=o.tick,calm=!!root.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const bg=background(room),art=characterAssets[room];if(art&&art.complete&&art.naturalWidth){
   // Preserve image proportions and align its sidewalk with the gameplay floor.
   // A modest camera-driven background pan avoids stretching faces or buildings.
   const width=Math.max(W*1.05,H*art.naturalWidth/art.naturalHeight),height=width*art.naturalHeight/art.naturalWidth;
   const x=-(width-W)*cam/Math.max(1,1800-W),y=FLOOR-height*.785;
   c.drawImage(art,x,y,width,height);
  }else if(bg)c.drawImage(bg,-Math.floor(cam),0);else rect(c,0,0,W,H,a.sky[0]);
  if(room==='approaches'){
   const approach=o.done.ready,progress=approach?Math.min(1,Math.max(0,1-(o.assaultStart-t)/180)):Math.min(1,t/900);
   ship(c,Math.min(W-90,W*.70)-progress*90,approach?82:67,approach?200:78,!!o.breachStart,t,calm);
  }
  c.save();c.translate(-Math.floor(cam),0);
  if(room==='services')root.TechOpsLowQuarterSafehouse?.drawEntrance(c);
  for(let x=70;x<1800;x+=450)lamp(c,x,a.light);
  if(room==='approaches'){
   rect(c,1000,202,11,128,'#223744');rect(c,1090,202,11,128,'#223744');rect(c,997,200,108,8,'#849392');
   if(o.done.gate){rect(c,1011,208,79,121,'#4d6269');for(let y=214;y<330;y+=10){rect(c,1013,y,75,3,'#8a9890');}for(let y=224;y<320;y+=26)poly(c,[[1014,y],[1026,y],[1053,y+14],[1041,y+14]],'#b29a64');}
   else{rect(c,1011,208,79,24,'#4d6269');rect(c,1012,230,77,3,'#a0a894');}
  }
  const props=root.TechOpsLowQuarterOperation.PROPS.filter(p=>p.room===room);for(const p of props)prop(c,p,!!o.done[p.id],Math.abs(p.x-o.x)<65,t,calm);
  if(room==='departure'&&!o.convoy)vehicle(c,1130,FLOOR,false);if(room==='receiving'&&o.convoy?.arrived)vehicle(c,812,FLOOR,true);
  // Render actors once in consistent foot order. Labels are a separate sparse layer.
  const actors=[];if(room==='services')actors.push({x:o.drill.x,y:FLOOR,kind:'military',i:0,pose:o.drill.moving?'walk':'idle',name:'TEST TEAM',facing:o.drill.moving&&o.drill.target<o.drill.x?-1:1});
  for(const u of o.units.filter(u=>u.room===room&&u.hp>0))actors.push({x:u.x,y:FLOOR,kind:u.id==='robot'?'robot':'military',i:1,pose:u.follow&&Math.abs(u.x-(o.x-40))>.1?'walk':'idle',name:u.id==='robot'?'ROBOT TEAM':u.ready?'DEFENDERS / POST':'DEFENSE TEAM',ready:u.ready,facing:u.follow&&u.x>o.x-40?-1:1});
  for(const p of o.residents.filter(p=>p.room===room&&(!p.boarded||room==='receiving'&&o.done.receiver))){actors.push({x:p.x,y:FLOOR,kind:'civilian',i:Number(p.id.split('_')[1]),pose:p.follow&&Math.abs(p.x-Math.min(o.x-25,1120))>4?'walk':'idle',name:'RESIDENT '+p.id.split('_')[1],facing:p.follow&&p.x>Math.min(o.x-25,1120)?-1:1});}
  if(room!=='receiving'){actors.push({x:room==='approaches'?360:100,y:FLOOR,kind:'civilian',i:2,pose:'idle',name:'LOCAL WITNESS'},{x:room==='approaches'?420:160,y:FLOOR,kind:'military',i:3,pose:'idle',name:'OFFICER'});}else actors.push({x:600,y:FLOOR,kind:'medic',i:0,pose:'idle',name:'RECEIVING MEDIC'});
  if(o.raiders?.room===room&&!o.done.cut_route)actors.push({x:o.raiders.x,y:FLOOR,kind:'infected',i:0,pose:'walk',name:'ROUTE RAIDERS',facing:-1});
  if(room==='approaches')for(const e of o.enemies){
   const index=Number(e.id.split('_')[1]), old=lastHP.get(e.id);
   if(!e.alive){
    if(index%4!==0 || !old || old.hp<=0 && old.defeat===undefined)continue;
    if(old.hp>0)lastHP.set(e.id,{hp:0,defeat:t});
    const age=t-lastHP.get(e.id).defeat;
    if(age>=0 && age<.22)actors.push({x:e.x,y:FLOOR,kind:'infected',i:index,pose:'down',facing:o.x<e.x?-1:1});
    continue;
   }
   const hit=old && old.hp>e.hp ? t : old?.hit ?? -1;
   lastHP.set(e.id,{hp:e.hp,hit});
   const pose=t-hit<.15?'hurt':t-e.hitAt<.2?'strike':'walk';
   actors.push({x:e.x,y:FLOOR,kind:'infected',i:index,pose,name:'INFECTED',hp:e.hp,hit,facing:o.x<e.x?-1:1});
  }
  const moving=previous&&previous.room===room&&Math.abs(previous.x-o.x)>.1;
  const pose=o.hp<=0?'down':t-o.hurtAt<.18?'hurt':t-o.attackAt<.22?'strike':o.work?'work':o.y>1?'jump':moving&&!o.travel?'walk':'idle';
  actors.push({x:o.x-75,y:FLOOR-o.y,kind:'k',i:0,pose:moving?'walk':'idle',name:'K',facing:o.facing},{x:o.x,y:FLOOR-o.y,kind:'iona',i:0,pose,name:'IONA',facing:o.facing});
  actors.sort((x,y)=>(x.kind==='iona'?2:x.kind==='k'?1:0)-(y.kind==='iona'?2:y.kind==='k'?1:0));
  for(const b of actors){if(b.x<cam-70||b.x>cam+W+70)continue;if(b.kind==='robot'||b.kind==='military')drawDefender(c,b,calm);else person(c,b.x,b.y,b.kind,b.i,b.pose,t,b.facing||1);if(b.ready){rect(c,b.x-19,FLOOR+5,38,2,'#91c5a4');}if(b.hp!==undefined){rect(c,b.x-17,b.y-107,34,4,'#192631');rect(c,b.x-16,b.y-106,32*b.hp/60,2,'#cc8a8e');if(!calm&&t>=b.hit&&t-b.hit<.13){line(c,b.x-20,b.y-57,b.x+20,b.y-41,'#f0cf96',3);line(c,b.x+10,b.y-64,b.x-8,b.y-31,'#e3ae83',2);}}}
  if(t-o.attackAt<.18&&!calm){poly(c,[[o.x+o.facing*20,FLOOR-o.y-62],[o.x+o.facing*65,FLOOR-o.y-44],[o.x+o.facing*70,FLOOR-o.y-31],[o.x+o.facing*48,FLOOR-o.y-38]],'rgba(232,208,157,.28)');}
  c.restore();
  // Only the current focus receives a label: no overlapping crowds of tiny IDs.
  const near=actors.filter(b=>b.kind!=='iona'&&b.kind!=='k'&&b.kind!=='infected'&&Math.abs(b.x-o.x)<85).sort((a,b)=>Math.abs(a.x-o.x)-Math.abs(b.x-o.x))[0];if(near)caption(c,near.name,near.x-cam,211,W,a.accent);
  const target=props.filter(p=>Math.abs(p.x-o.x)<65&&!o.done[p.id]).sort((a,b)=>Math.abs(a.x-o.x)-Math.abs(b.x-o.x))[0];if(target)caption(c,target.label.replace(/^(Ask|Repair|Survey|Observe) /,''),target.x-cam,175,W,a.accent);
  // Small diegetic sector strip; primary objective and status remain accessible DOM text.
  rect(c,0,0,W,39,'rgba(10,21,31,.86)');rect(c,0,37,W,2,a.accent);text(c,a.name,16,18,12,'#e5e8cf');text(c,a.subtitle,16,31,9,'#9cbbb9');
  const phase=o.breachStart?'BREACH ACTIVE':o.done.ready?'LANDING '+Math.max(0,Math.ceil(o.assaultStart-t))+'s':'WATCH / PREPARATION';text(c,phase,W-14,22,10,a.accent,'right');
  if(o.done.enemy_order&&!o.done.cut_route&&room==='departure'){rect(c,0,H-27,W,27,'#573b44');text(c,'SERVICE ROAD COMPROMISED / USE THE CLEARED ALTERNATE',12,H-10,small?10:12,'#ffdab3');}
  if(o.travel){rect(c,40,128,W-80,94,'rgba(9,22,33,.94)');rect(c,40,128,3,94,a.accent);text(c,'MOVING TO '+o.travel.to.toUpperCase(),W/2,158,14,'#e2e7cd','center');text(c,Math.ceil(o.travel.remaining)+' seconds / crew and routes remain committed',W/2,182,10,'#abc4bf','center');rect(c,64,202,W-128,3,'#243d4a');rect(c,64,202,(W-128)*(1-o.travel.remaining/o.travel.duration),3,a.accent);}
  c.restore();previous={room,x:o.x,tick:t};
 }
 root.TechOpsLowQuarterOperationVisuals={VERSION,draw,areas:AREAS,clearCache:function(){cache.clear();lastHP.clear();previous=null;lastRun=null;}};
})(globalThis);
