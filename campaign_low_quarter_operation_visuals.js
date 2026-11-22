/* Provisional pixel staging, authored in code; no claim of final likeness approval. */
(function(root){'use strict';
 const colors={approaches:'#253842',services:'#1b3e42',shelters:'#34473a',departure:'#303449',receiving:'#29453b'};
 function actor(c,x,y,color,name,kind='local',facing=1,time=0){
   c.save();c.translate(Math.round(x),Math.round(y));c.scale(facing,1);
   const stride=Math.sin(time*7)*3;
   c.fillStyle='#0a1019';c.fillRect(-8,-14,7,14+stride);c.fillRect(2,-14,7,14-stride);
   c.fillStyle=color;c.fillRect(-11,-40,22,27);c.fillRect(-17,-35,6,22);c.fillRect(11,-35,6,22);
   c.fillStyle=kind==='iona'?'#c99f79':'#ac866c';c.fillRect(-8,-57,16,17);
   c.fillStyle='#10131b';c.fillRect(-9,-60,18,8);if(kind==='iona')c.fillRect(-9,-54,4,16);
   if(kind==='k'){c.fillStyle='#11141c';c.fillRect(-10,-64,20,9);c.fillStyle='#9ae4cd';c.fillRect(3,-31,5,5);c.strokeStyle='#c6e1dd';c.strokeRect(-6,-49,12,4);}
   c.restore();c.fillStyle='#e9f3ee';c.font='11px monospace';c.textAlign='center';c.fillText(name,x,y-72);
 }
 function draw(canvas,s){const c=canvas.getContext('2d'),o=s.lowQuarterOperation,room=o.room,W=960,H=420,cam=Math.max(0,Math.min(840,o.x-440));c.imageSmoothingEnabled=false;c.clearRect(0,0,W,H);c.fillStyle=colors[room];c.fillRect(0,0,W,H);
   c.fillStyle='#101c28';for(let i=0;i<10;i++){const x=i*180-cam*.35;c.fillRect(x,65+(i%3)*24,148,250);c.fillStyle='#4e6969';for(let j=0;j<5;j++)c.fillRect(x+12+j*25,110,9,15);c.fillStyle='#101c28';}
   c.fillStyle='#090f17';c.fillRect(0,330,W,90);c.fillStyle='#5a7167';c.fillRect(0,330,W,5);c.fillStyle='#cda65b';for(let x=-cam%100;x<W;x+=100)c.fillRect(x,370,45,3);
   c.save();c.translate(-cam,0);
   for(const p of root.TechOpsLowQuarterOperation.PROPS.filter(p=>p.room===room)){
     c.fillStyle=o.done[p.id]?'#3e6f59':'#b69b58';c.fillRect(p.x-14,285,28,45);c.fillStyle='#0c1d23';c.fillRect(p.x-10,290,20,17);c.fillStyle='#d6e6db';c.font='10px monospace';c.textAlign='center';c.fillText(p.id.replaceAll('_',' '),p.x,274);
   }
   if(room==='approaches'){
     c.fillStyle=o.done.gate?'#7caaa0':'#705c52';c.fillRect(1000,210,12,120);c.fillRect(1000,210,100,12);if(o.done.gate)c.fillRect(1012,225,87,105);
     if(o.done.ready){const t=o.assaultStart-o.tick;c.fillStyle='#b4abb8';const x=1050-Math.max(0,Math.min(160,(60-t)*3));c.fillRect(x,90,130,18);c.fillRect(x+30,74,75,20);c.fillStyle='#c77979';c.fillRect(x+90,110,40,6);}
   }
   if(room==='services')actor(c,o.drill.x,330,'#597a8b','Test team','local',1,o.drill.moving?o.tick:0);
   for(const u of o.units.filter(u=>u.room===room&&u.hp>0))actor(c,u.x,330,u.ready?'#5c8b78':'#617887',u.id+(u.ready?' · POST':''),'local',1,u.follow?o.tick:0);
   for(const p of o.residents.filter(p=>p.room===room&&!p.boarded))actor(c,p.x,330,o.done['shelter_'+p.id]?'#77a981':'#ad8f76',p.id.replace('resident_','R'),'local',1,p.follow?o.tick:0);
   if(room==='departure'&&!o.convoy){c.fillStyle='#637878';c.fillRect(1070,280,130,49);c.fillStyle='#16242d';c.fillRect(1160,285,32,20);c.fillStyle='#05090e';c.fillRect(1080,320,20,15);c.fillRect(1170,320,20,15);}
   if(room==='receiving'){actor(c,600,330,'#9bc6ac','Receiving medic');if(o.convoy?.arrived){c.fillStyle='#637878';c.fillRect(700,280,130,49);}}
   if(room==='approaches')for(const e of o.enemies.filter(e=>e.alive)){actor(c,e.x,330,'#965068','INFECTED');c.fillStyle='#eea5a5';c.fillRect(e.x-15,257,e.hp/2,3);}
   if(room!=='receiving'){
     actor(c,room==='approaches'?360:100,330,'#bfb188','Local witness');actor(c,room==='approaches'?420:160,330,'#658b9a','Officer');
   }
   actor(c,o.x-45,330-o.y,'#283a40','K','k',o.facing,0);actor(c,o.x,330-o.y,'#354452','IONA','iona',o.facing,o.work||o.travel?0:o.tick);
   if(o.tick-o.attackAt<.2){c.strokeStyle='#efdbab';c.lineWidth=4;c.beginPath();c.arc(o.x+o.facing*30,300-o.y,35,-1.1,1.1);c.stroke();}
   c.restore();c.fillStyle='#cce0d7';c.font='14px monospace';c.textAlign='left';c.fillText(room.toUpperCase()+' · '+s.story.ending.replaceAll('_',' ').toUpperCase(),16,24);
   c.fillStyle='#293c41';c.fillRect(16,38,102,8);c.fillStyle='#9cd0a6';c.fillRect(17,39,o.hp,6);
   if(o.travel){c.fillStyle='rgba(5,12,20,.82)';c.fillRect(150,140,660,90);c.fillStyle='#d8eddf';c.textAlign='center';c.fillText('Travelling to '+o.travel.to+' · '+Math.ceil(o.travel.remaining)+' seconds',480,186);}
 }
 root.TechOpsLowQuarterOperationVisuals={draw};
})(globalThis);
