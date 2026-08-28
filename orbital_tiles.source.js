/* TechOps Hero — orbital detention tile raster source v1.
 * The v7.35 atlas descriptor shipped without its BFC1B0DD source payload. This
 * reconstructs a deterministic 768x512 painted/pixel-hybrid detention sheet at
 * the exact atlas coordinates so existing prison composition code can render
 * real cells, doors, cameras, consoles, lasers, catwalks and rubble.
 */
(function(root){
  "use strict";
  if(!root||root.__GK_ORBITAL_TILES)return;
  try{
    var d=root.document;if(!d)return;var c=d.createElement("canvas");c.width=768;c.height=512;var x=c.getContext&&c.getContext("2d");if(!x)return;x.imageSmoothingEnabled=false;
    var F={
      cell_wall0:[6,10,91,59],cell_wall1:[93,9,88,68],door_bars0:[305,8,54,66],door_bars1:[355,8,54,66],door_heavy0:[560,10,44,64],door_heavy1:[613,10,49,64],
      floor_0:[5,82,63,67],floor_1:[64,82,64,67],floor_2:[124,82,64,67],floor_3:[184,82,64,67],floor_4:[244,82,64,67],floor_5:[304,82,64,67],
      door_broken:[524,82,43,58],chair_2:[99,148,47,74],console:[284,148,99,74],keypad_1:[408,150,29,30],cam_0:[513,150,40,33],cam_3:[621,150,40,33],cam_5:[693,150,40,33],alarm_red:[443,191,29,29],
      pipe_0:[5,218,88,26],pipe_u:[150,208,66,41],vent_0:[212,210,60,41],laser_0:[579,185,91,35],laser_1:[666,185,96,35],laser_green:[573,235,96,76],door_glitch:[665,234,93,77],
      catwalk_0:[5,268,78,62],catwalk_1:[79,268,63,64],catwalk_3:[260,268,69,59],catwalk_4:[325,268,79,64],rack_0:[424,274,58,55],rack_1:[478,274,60,55],
      rubble_0:[188,338,60,78],rubble_2:[306,336,64,80],rubble_3:[367,340,59,76],rubble_5:[472,345,54,71],pod_0:[568,315,51,96],door_big:[665,335,100,79],bg_red0:[218,425,74,79],bg_smoke:[350,425,39,78]
    };
    var P={ink:"#061019",deep:"#0a1722",steel:"#1d3442",steel2:"#294a59",edge:"#6b8792",light:"#b9d7df",cyan:"#55dfff",amber:"#f59e0b",red:"#ff475d",green:"#22c55e",rust:"#8a4f35",black:"#020609"};
    function local(k,fn){var r=F[k];if(!r)return;x.save();x.beginPath();x.rect(r[0],r[1],r[2],r[3]);x.clip();x.translate(r[0],r[1]);fn(r[2],r[3]);x.restore();}
    function rect(px,py,w,h,fill,stroke){x.fillStyle=fill;x.fillRect(px,py,w,h);if(stroke){x.strokeStyle=stroke;x.lineWidth=1;x.strokeRect(px+.5,py+.5,w-1,h-1);}}
    function rivets(w,h,color){x.fillStyle=color||P.edge;for(var yy=5;yy<h;yy+=Math.max(12,Math.floor(h/3)))for(var xx=5;xx<w;xx+=Math.max(16,Math.floor(w/4)))x.fillRect(xx,yy,2,2);}
    function wall(k,alt){local(k,function(w,h){rect(0,0,w,h,alt?P.deep:P.steel,P.edge);rect(4,5,w-8,h-10,alt?"#142735":"#18303d","#365564");x.strokeStyle="#0b151d";for(var i=12;i<w;i+=22){x.beginPath();x.moveTo(i,6);x.lineTo(i,h-6);x.stroke();}rect(9,h-16,w-18,7,"#08131b");rivets(w,h);});}
    wall("cell_wall0",false);wall("cell_wall1",true);
    function floor(k,n){local(k,function(w,h){rect(0,0,w,h,"#0c171e","#445963");rect(0,0,w,10,"#233946");x.strokeStyle=n%2?"#344d59":"#263f4a";for(var i=-h;i<w+h;i+=18){x.beginPath();x.moveTo(i,h);x.lineTo(i+h,0);x.stroke();}rect(4,h-13,w-8,5,"#101e27");rivets(w,h,"#536a74");});}
    for(var fi=0;fi<6;fi++)floor("floor_"+fi,fi);
    function barred(k,heavy){local(k,function(w,h){rect(0,0,w,h,P.black,heavy?"#80939c":"#58717e");rect(3,3,w-6,h-6,"#0a1116");x.strokeStyle=heavy?"#8398a0":"#67828d";x.lineWidth=heavy?4:3;for(var xx=7;xx<w;xx+=heavy?11:9){x.beginPath();x.moveTo(xx,4);x.lineTo(xx,h-4);x.stroke();}x.lineWidth=2;x.beginPath();x.moveTo(4,h*.45);x.lineTo(w-4,h*.45);x.moveTo(4,h*.7);x.lineTo(w-4,h*.7);x.stroke();rect(w-12,h*.48,7,12,heavy?P.red:P.cyan);});}
    barred("door_bars0",false);barred("door_bars1",false);barred("door_heavy0",true);barred("door_heavy1",true);
    local("door_broken",function(w,h){rect(0,0,w,h,"#071018",P.edge);x.strokeStyle="#6b8792";x.lineWidth=4;x.beginPath();x.moveTo(5,3);x.lineTo(9,h-15);x.lineTo(19,h-5);x.moveTo(w-6,3);x.lineTo(w-13,h*.52);x.lineTo(w-5,h-4);x.stroke();x.strokeStyle=P.red;x.lineWidth=2;x.beginPath();x.moveTo(12,12);x.lineTo(24,24);x.lineTo(15,34);x.lineTo(31,48);x.stroke();});
    local("door_big",function(w,h){rect(0,0,w,h,"#09141b","#8398a0");rect(8,7,w-16,h-14,"#152936","#506b77");x.strokeStyle="#6f8791";x.lineWidth=3;x.beginPath();x.moveTo(w/2,8);x.lineTo(w/2,h-8);x.stroke();rect(w/2-8,h/2-6,16,13,P.amber);for(var yy=12;yy<h-10;yy+=16){x.fillStyle="#273e49";x.fillRect(12,yy,w-24,3);}});
    local("chair_2",function(w,h){x.strokeStyle="#77919b";x.lineWidth=5;x.beginPath();x.moveTo(w*.28,h*.2);x.lineTo(w*.3,h*.78);x.lineTo(w*.18,h*.98);x.moveTo(w*.72,h*.2);x.lineTo(w*.7,h*.78);x.lineTo(w*.82,h*.98);x.stroke();rect(w*.2,h*.34,w*.6,h*.34,"#273944","#9b6262");rect(w*.28,h*.08,w*.44,h*.2,"#1b2c35","#80949c");rect(2,h*.47,w-4,6,"#6b2833");});
    local("console",function(w,h){rect(0,8,w,h-8,"#101f29","#69828c");rect(9,15,w-18,h*.42,"#041016",P.cyan);x.fillStyle="#103847";for(var yy=19;yy<h*.42;yy+=7)x.fillRect(13,yy,w-26,2);for(var i=0;i<6;i++){x.fillStyle=i%2?P.amber:P.green;x.fillRect(12+i*13,h-16,6,4);} });
    local("keypad_1",function(w,h){rect(0,0,w,h,"#111f27","#67808a");for(var yy=5;yy<h-4;yy+=8)for(var xx=5;xx<w-4;xx+=8){x.fillStyle=(xx+yy)%3?P.cyan:P.amber;x.fillRect(xx,yy,3,3);}});
    function camera(k,flip){local(k,function(w,h){x.save();if(flip){x.translate(w,0);x.scale(-1,1);}rect(4,8,w-12,14,"#2a414c","#859ba4");rect(w-12,11,8,8,"#071017",P.red);x.strokeStyle="#607985";x.lineWidth=3;x.beginPath();x.moveTo(9,21);x.lineTo(3,h-2);x.stroke();x.restore();});}
    camera("cam_0",false);camera("cam_3",true);camera("cam_5",false);
    local("alarm_red",function(w,h){x.fillStyle="rgba(255,71,93,.2)";x.beginPath();x.arc(w/2,h/2,w*.48,0,Math.PI*2);x.fill();rect(w*.3,h*.25,w*.4,h*.5,P.red,"#ffd7dc");x.fillStyle="#fff";x.fillRect(w*.4,h*.28,w*.2,4);});
    local("pipe_0",function(w,h){x.strokeStyle="#647d86";x.lineWidth=9;x.beginPath();x.moveTo(3,h/2);x.lineTo(w-3,h/2);x.stroke();x.strokeStyle="#1e333d";x.lineWidth=3;x.stroke();for(var xx=12;xx<w;xx+=24)rect(xx,h/2-7,4,14,"#9a694b");});
    local("pipe_u",function(w,h){x.strokeStyle="#667e87";x.lineWidth=8;x.beginPath();x.moveTo(5,5);x.lineTo(5,h-10);x.quadraticCurveTo(5,h-3,13,h-3);x.lineTo(w-13,h-3);x.quadraticCurveTo(w-5,h-3,w-5,h-10);x.lineTo(w-5,5);x.stroke();});
    local("vent_0",function(w,h){rect(0,0,w,h,"#152630","#748b94");for(var yy=7;yy<h-5;yy+=7)rect(7,yy,w-14,2,"#526b76");});
    function laser(k,color){local(k,function(w,h){x.fillStyle="rgba(5,12,17,.72)";x.fillRect(0,0,w,h);for(var i=0;i<4;i++){var yy=5+i*(h-10)/3;x.strokeStyle=color;x.lineWidth=2;x.beginPath();x.moveTo(3,yy);x.lineTo(w-3,yy);x.stroke();x.globalAlpha=.18;x.lineWidth=6;x.stroke();x.globalAlpha=1;}rect(0,1,7,h-2,"#263b45");rect(w-7,1,7,h-2,"#263b45");});}
    laser("laser_0",P.red);laser("laser_1",P.red);laser("laser_green",P.green);
    local("door_glitch",function(w,h){rect(0,0,w,h,"#07120d","#1b713c");for(var yy=3;yy<h;yy+=7){x.fillStyle=yy%14?"rgba(34,197,94,.45)":"rgba(85,223,255,.28)";x.fillRect((yy*3)%17,yy,w-((yy*5)%24),2);}x.strokeStyle=P.green;x.lineWidth=3;x.strokeRect(8,7,w-16,h-14);});
    function catwalk(k){local(k,function(w,h){x.strokeStyle="#647985";x.lineWidth=4;x.beginPath();x.moveTo(0,h*.38);x.lineTo(w,h*.38);x.moveTo(4,h*.38);x.lineTo(4,h);x.moveTo(w-5,h*.38);x.lineTo(w-5,h);x.stroke();rect(0,h*.34,w,7,"#344b56");for(var xx=8;xx<w;xx+=15){x.strokeStyle="#223844";x.beginPath();x.moveTo(xx,h*.4);x.lineTo(xx+10,h*.62);x.stroke();}});}
    ["catwalk_0","catwalk_1","catwalk_3","catwalk_4"].forEach(catwalk);
    function rack(k,green){local(k,function(w,h){rect(0,0,w,h,"#101b22","#647b86");for(var yy=6;yy<h-5;yy+=10){rect(5,yy,w-10,7,"#172a34");for(var xx=9;xx<w-7;xx+=10){x.fillStyle=(xx+yy)%3?(green?P.green:P.cyan):P.amber;x.fillRect(xx,yy+2,3,2);}}});}
    rack("rack_0",false);rack("rack_1",true);
    function rubble(k,seed){local(k,function(w,h){for(var i=0;i<9;i++){var xx=(seed*17+i*23)%Math.max(1,w-12),yy=h-8-((seed*11+i*19)%Math.max(8,h*.55)),ww=9+((i*7+seed)%18),hh=7+((i*5+seed)%13);x.fillStyle=i%3?"#263841":"#704b37";x.beginPath();x.moveTo(xx,yy+hh);x.lineTo(xx+ww*.25,yy);x.lineTo(xx+ww,yy+hh*.35);x.lineTo(xx+ww*.8,yy+hh);x.closePath();x.fill();x.strokeStyle="#4e6269";x.stroke();}});}
    rubble("rubble_0",1);rubble("rubble_2",2);rubble("rubble_3",3);rubble("rubble_5",5);
    local("pod_0",function(w,h){rect(w*.18,2,w*.64,h-4,"#10232c","#76a8b5");x.fillStyle="rgba(85,223,255,.18)";x.fillRect(w*.24,8,w*.52,h*.62);x.strokeStyle="#55dfff";x.beginPath();x.ellipse(w/2,h*.39,w*.19,h*.24,0,0,Math.PI*2);x.stroke();rect(w*.28,h*.72,w*.44,8,"#273e48");});
    local("bg_red0",function(w,h){x.fillStyle="rgba(56,6,12,.78)";x.fillRect(0,0,w,h);for(var yy=5;yy<h;yy+=12){x.fillStyle="rgba(255,71,93,.2)";x.fillRect(0,yy,w,3);} });
    local("bg_smoke",function(w,h){for(var i=0;i<8;i++){x.fillStyle="rgba(151,173,181,"+(0.05+i*.018)+")";x.beginPath();x.arc((i*17)%w,h-8-i*8,10+i*2,0,Math.PI*2);x.fill();}});
    root.__GK_ORBITAL_TILES=c.toDataURL("image/png");root.__GK_ORBITAL_TILES_GENERATED=true;root.__GK_ORBITAL_TILES_VERSION=1;
    try{if(root.ORBITAL_TILES&&!root.ORBITAL_TILES.src)root.ORBITAL_TILES.src=root.__GK_ORBITAL_TILES;}catch(_){}
  }catch(e){root.__GK_ORBITAL_TILES_SOURCE_ERROR=String(e&&e.stack||e);}
})(typeof globalThis!=="undefined"?globalThis:this);
