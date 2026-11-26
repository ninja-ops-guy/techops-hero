/* The Cylinder: a paused shop visit owned by the opening review runtime.
 * No campaign currency, rescue receipts, healing or inventory mutations.
 * Dr Mortise's new pixel appearance is a provisional game design. */
(function(root){'use strict';
 const ENTRANCE={room:'services',x:640,reach:58};
 let dialog=null,onLeave=null;
 const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
 function text(c,value,x,y,size=12,color='#eed9a7',align='left'){
  c.fillStyle=color;c.font='bold '+size+'px monospace';c.textAlign=align;c.fillText(value,x,y);
 }
 function line(c,points,color,width=2){c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();}
 function canEnter(state){const o=state&&state.lowQuarterOperation;return !!(o&&o.room===ENTRANCE.room&&Math.abs(o.x-ENTRANCE.x)<ENTRANCE.reach&&o.y===0&&!o.work&&!o.travel&&!o.halted&&!o.checkpoint&&o.hp>0);}
 function drawEntrance(c){
  c.save();
  rect(c,583,173,114,157,'#122025');rect(c,588,178,104,152,'#6e6750');
  rect(c,598,188,84,142,'#1c3839');rect(c,604,198,72,52,'#0e242c');
  for(let y=204;y<247;y+=8)rect(c,606,y,68,2,'#40574f');
  rect(c,604,260,72,62,'#294a46');rect(c,665,264,4,20,'#d9c38e');
  rect(c,571,147,138,29,'#151f24');rect(c,574,150,132,23,'#b09561');
  text(c,'THE CYLINDER',640,166,14,'#172628','center');
  rect(c,604,270,47,19,'#13272a');text(c,'OPEN',628,284,11,'#d3d4aa','center');
  rect(c,583,328,114,4,'#c2ad81');c.restore();
 }
 function drawRoom(canvas){
  const c=canvas.getContext('2d');c.save();c.imageSmoothingEnabled=false;
  rect(c,0,0,600,360,'#142529');
  // Masonry, cable runs and warm task lighting keep the established pixel palette.
  for(let y=36;y<289;y+=18){rect(c,0,y,600,1,'#284044');for(let x=(y%36?0:30);x<600;x+=60)rect(c,x,y,1,18,'#284044');}
  rect(c,0,0,600,12,'#0b171c');rect(c,0,12,600,5,'#53605a');
  line(c,[[20,18],[20,58],[158,58]],'#7f7b64',4);
  rect(c,178,36,246,58,'#091a20');rect(c,182,40,238,50,'#a58c5f');rect(c,186,44,230,42,'#1c3030');
  text(c,'THE CYLINDER',301,65,24,'#ead3a0','center');text(c,'HARDWARE  /  SAFEHOUSE',301,80,9,'#b3c0a6','center');
  // Hardware stock: lock cylinders, hinges and boxed closers, not generic potions.
  for(const y of [142,204]){rect(c,34,y,143,9,'#85704c');rect(c,39,y+9,7,12,'#151e22');rect(c,163,y+9,7,12,'#151e22');}
  for(let i=0;i<5;i++){
   const x=43+i*25;rect(c,x,120,18,17,'#3c504b');rect(c,x+3,116,12,23,'#bc9c60');rect(c,x+6,119,6,6,'#e1c28a');rect(c,x+8,127,3,8,'#33403a');
  }
  for(let i=0;i<3;i++){rect(c,42+i*43,165,34,35,'#8a795b');rect(c,46+i*43,170,26,9,'#c5b78d');line(c,[[51+i*43,190],[61+i*43,185],[69+i*43,192]],'#303c37',3);}
  rect(c,47,230,115,39,'#10252b');text(c,'LOCKS & HINGES',104,245,9,'#bcbea2','center');text(c,'CLOSERS & BARS',104,259,9,'#bcbea2','center');
  // New shopkeeper design: glasses and a workshop apron, with both hands on his counter.
  rect(c,264,119,34,9,'#757d72');rect(c,258,128,45,32,'#273735');
  rect(c,263,130,34,29,'#b08b68');rect(c,262,129,9,10,'#a9ada0');rect(c,291,129,9,10,'#a9ada0');
  rect(c,266,139,12,8,'#263d3b');rect(c,283,139,12,8,'#263d3b');rect(c,269,141,7,3,'#a2c1b4');rect(c,286,141,7,3,'#a2c1b4');rect(c,278,141,5,2,'#ccd0b9');
  rect(c,276,148,8,7,'#d1ad85');rect(c,275,159,11,10,'#b08b68');
  rect(c,255,169,49,55,'#b6b59b');rect(c,265,174,29,56,'#405c58');rect(c,271,193,18,15,'#28423f');rect(c,280,197,3,8,'#c1a46a');
  line(c,[[256,176],[245,192],[248,223]],'#b6b59b',10);line(c,[[302,176],[314,193],[310,223]],'#b6b59b',10);
  rect(c,242,220,13,8,'#c29a73');rect(c,304,220,13,8,'#c29a73');
  rect(c,201,226,180,11,'#bea273');rect(c,208,237,166,54,'#514d3d');rect(c,218,245,146,36,'#283e3b');
  rect(c,239,247,106,23,'#c7ae7e');text(c,'Dr Mortise',292,263,14,'#1c3030','center');
  rect(c,215,216,20,10,'#8a9f8e');rect(c,218,212,14,4,'#bdc7ad');rect(c,333,213,29,13,'#243c3c');rect(c,337,217,21,3,'#cdad69');
  // Exit device on the interior face: two cases, horizontal push pad and latch strike.
  rect(c,443,92,116,203,'#0a181c');rect(c,447,97,108,195,'#778780');
  rect(c,454,104,94,184,'#284448');rect(c,460,110,82,172,'#3e5b59');
  for(const y of [126,241]){rect(c,450,y,7,15,'#aab6a5');rect(c,452,y+2,2,11,'#e4d8b6');}
  rect(c,474,151,54,30,'#1b343c');rect(c,478,155,46,22,'#76938c');
  rect(c,465,201,12,22,'#87988f');rect(c,529,201,12,22,'#87988f');
  rect(c,473,205,60,14,'#1d3033');rect(c,476,204,53,10,'#d5d8bd');rect(c,479,206,47,3,'#f3ebcc');
  rect(c,540,207,8,6,'#b9c6b0');rect(c,549,204,5,13,'#e2d6b3');
  text(c,'PUSH TO EXIT',502,238,9,'#dee2c5','center');
  // Surface-mounted closer body on the leaf, jointed arm attached to the head frame.
  rect(c,471,117,42,14,'#a4b1a6');rect(c,475,120,34,7,'#d0d1b9');
  line(c,[[503,117],[524,107],[537,97]],'#0e232b',5);line(c,[[503,117],[524,107],[537,97]],'#dce0c7',3);
  rect(c,534,94,10,5,'#b2c2b1');rect(c,521,104,6,6,'#ecdfbc');
  rect(c,471,64,61,21,'#263c31');rect(c,475,67,53,15,'#c9dfb5');text(c,'EXIT',501,79,13,'#234d3f','center');
  // Continuous floor/contact plane, with a clear path from counter to door.
  rect(c,0,292,600,68,'#232f2e');rect(c,0,290,600,4,'#7c8068');
  for(let y=305;y<360;y+=19){rect(c,0,y,600,1,'#3e4940');for(let x=0;x<600;x+=73)rect(c,x+y%38,y,1,18,'#3e4940');}
  rect(c,444,293,117,4,'#b6b49a');rect(c,208,292,167,4,'#111f22');
  text(c,'A QUIET PLACE TO CATCH YOUR BREATH.',27,341,10,'#a8b39e');c.restore();
 }
 function create(){
  dialog=document.createElement('dialog');dialog.id='cylinder';dialog.setAttribute('aria-labelledby','cylinder-title');
  dialog.innerHTML='<header class="cylinder-heading"><p class="eyebrow">LOW QUARTER · SAFEHOUSE</p><h2 id="cylinder-title">The Cylinder</h2><p>Dr Mortise’s hardware shop</p></header><div class="cylinder-room"><canvas id="cylinder-scene" width="600" height="360" role="img" aria-label="Dr Mortise behind a hardware counter. The exit door on the right has a horizontal push-bar exit device and an overhead closer with a jointed arm."></canvas><button class="cylinder-hotspot cylinder-keeper" id="cylinder-talk" aria-label="Talk to Dr Mortise">Talk to Dr Mortise</button><button class="cylinder-hotspot cylinder-exit" id="cylinder-exit" aria-label="Push the exit device and leave The Cylinder">Push bar · Exit</button></div><div class="cylinder-conversation"><p id="cylinder-dialogue" aria-live="polite"></p><nav aria-label="Shop conversations"><button id="cylinder-stock">Browse hardware</button><button id="cylinder-door">Ask about the door</button></nav><p class="cylinder-status">Siege paused while inside · Escape or the exit door returns you to the street.</p></div>';
  document.body.append(dialog);
  const say=words=>{dialog.querySelector('#cylinder-dialogue').textContent='Dr Mortise: “'+words+'”';};
  dialog.querySelector('#cylinder-talk').onclick=()=>say('Welcome to The Cylinder. Take a breath. I’m Dr Mortise.');
  dialog.querySelector('#cylinder-stock').onclick=()=>say('Cylinders, hinges, exit devices and door closers. Have a look around.');
  dialog.querySelector('#cylinder-door').onclick=()=>say('Push the bar to get out. The closer overhead brings the door back behind you.');
  dialog.querySelector('#cylinder-exit').onclick=()=>dialog.close();
  dialog.addEventListener('keydown',e=>{
   if(e.key!=='Tab')return;
   const controls=dialog.querySelectorAll('button'),first=controls[0],last=controls[controls.length-1];
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  });
  dialog.addEventListener('close',()=>{const leave=onLeave;onLeave=null;if(leave)leave();});
  drawRoom(dialog.querySelector('canvas'));
 }
 function open(leave){if(!dialog)create();if(dialog.open)return false;onLeave=leave;
  dialog.querySelector('#cylinder-dialogue').textContent='Dr Mortise: “Welcome to The Cylinder. Take a breath. I’m Dr Mortise.”';
  dialog.showModal();dialog.querySelector('#cylinder-talk').focus();return true;
 }
 root.TechOpsLowQuarterSafehouse={ENTRANCE,canEnter,drawEntrance,drawRoom,open,isOpen:()=>!!dialog?.open};
})(globalThis);
