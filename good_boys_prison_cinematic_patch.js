/* Good Boys prison cinematic + visual direction patch v1.
 * Uses the existing ORBITAL_TILES production atlas to synthesize authored
 * detention backdrops, clarifies mission goals, and adds cinematic mission
 * entry cards for the orbital-prison arc.
 */
(function(root){
  "use strict";
  if(!root||root.TechOpsGoodBoysPrisonCinematicPatch)return;
  var VERSION=1,atlasImg=null,building=false,built=false,lastMission=0,cinematicOpen=false,style=null;
  function cs(){try{return root.NM&&root.NM._v736?root.NM._v736:null;}catch(e){return null;}}
  function active(){return !!cs();}
  function mission(){var c=cs();return Math.max(1,Math.min(8,Number(c&&c.m||root.S&&root.S.meta&&root.S.meta._v736&&root.S.meta._v736.m||1)));}
  function asset(){try{return root.ORBITAL_TILES&&root.ORBITAL_TILES.src&&root.ORBITAL_TILES.frames?root.ORBITAL_TILES:null;}catch(e){return null;}}
  function image(){try{var A=asset();if(!A)return null;if(!atlasImg||atlasImg.src!==A.src){atlasImg=new Image();atlasImg.onload=function(){buildBackdrops();};atlasImg.src=A.src;}return atlasImg.complete&&atlasImg.naturalWidth?atlasImg:null;}catch(e){return null;}}
  function fr(ctx,key,dx,dy,dw,dh,alpha){var A=asset(),im=image(),r=A&&A.frames&&A.frames[key];if(!ctx||!im||!r)return false;ctx.save();ctx.globalAlpha=alpha==null?1:alpha;ctx.imageSmoothingEnabled=false;ctx.drawImage(im,r[0],r[1],r[2],r[3],dx,dy,dw,dh);ctx.restore();return true;}
  function makeBackdrop(kind){
    var c=document.createElement('canvas');c.width=768;c.height=512;var x=c.getContext('2d');
    var g=x.createLinearGradient(0,0,0,512);g.addColorStop(0,kind==='cell1984'?'#17070b':'#07101a');g.addColorStop(.45,'#071019');g.addColorStop(1,'#02060a');x.fillStyle=g;x.fillRect(0,0,768,512);
    x.fillStyle='rgba(4,10,15,.92)';x.fillRect(0,54,768,345);
    for(var bx=0;bx<768;bx+=92)fr(x,(bx/92)%2?'cell_wall1':'cell_wall0',bx,80,96,74,.92);
    for(var fx=0;fx<768;fx+=64)fr(x,'floor_'+((fx/64)%6),fx,390,68,90,.95);
    fr(x,'pipe_0',34,42,176,52,.7);fr(x,'pipe_u',210,36,132,82,.68);fr(x,'vent_0',540,35,120,82,.72);
    fr(x,'cam_0',105,125,58,48,.95);fr(x,'cam_3',596,126,58,48,.95);
    fr(x,kind==='cell1984'?'alarm_red':'alarm_amber',365,118,42,42,1);
    fr(x,'catwalk_0',0,300,156,105,.75);fr(x,'catwalk_1',150,300,126,105,.75);fr(x,'catwalk_3',510,300,138,105,.75);fr(x,'catwalk_4',640,300,128,105,.75);
    if(kind==='breach'){
      fr(x,'door_broken',94,232,90,118,1);fr(x,'rubble_0',180,320,100,110,.9);fr(x,'rubble_2',266,323,104,108,.9);fr(x,'bg_smoke',390,222,90,156,.42);fr(x,'laser_0',548,245,160,60,.85);
    }else if(kind==='cell118'){
      fr(x,'door_bars0',80,202,116,142,1);fr(x,'door_bars1',195,202,116,142,1);fr(x,'console',355,230,150,110,.95);fr(x,'keypad_1',506,230,45,45,1);fr(x,'pod_0',615,195,88,155,.82);
    }else if(kind==='core'){
      fr(x,'rack_0',90,214,108,118,.94);fr(x,'rack_1',190,214,108,118,.94);fr(x,'console',324,220,180,126,1);fr(x,'laser_green',540,205,170,135,.7);fr(x,'door_glitch',615,205,132,137,.82);
    }else if(kind==='cell1984'){
      fr(x,'door_heavy0',104,192,118,154,1);fr(x,'door_heavy1',220,192,126,154,1);fr(x,'chair_2',390,217,86,130,.9);fr(x,'cam_5',530,170,64,52,1);fr(x,'alarm_red1',612,168,54,66,1);fr(x,'laser_1',530,265,180,70,.86);
    }else if(kind==='escape'){
      fr(x,'door_big',84,203,190,150,1);fr(x,'rubble_3',310,295,110,115,.9);fr(x,'rubble_5',408,302,104,110,.9);fr(x,'bg_red0',540,200,120,145,.45);fr(x,'alarm_red2',680,160,54,70,1);
    }
    x.fillStyle='rgba(2,6,10,.3)';x.fillRect(0,0,768,512);
    var out=new Image();out.src=c.toDataURL('image/png');return out;
  }
  function buildBackdrops(){
    if(built||building||!root.document||!asset()||!image())return false;building=true;
    try{root.NM_BG734=root.NM_BG734||{};root.NM_BG734.goodboys_breach=makeBackdrop('breach');root.NM_BG734.goodboys_cell118=makeBackdrop('cell118');root.NM_BG734.goodboys_core=makeBackdrop('core');root.NM_BG734.goodboys_cell1984=makeBackdrop('cell1984');root.NM_BG734.goodboys_escape=makeBackdrop('escape');built=true;root.__goodBoysPrisonBackdropsReady=true;return true;}catch(e){root.__goodBoysPrisonBackdropError=String(e&&e.stack||e);return false;}finally{building=false;}
  }
  function clarifyCanon(){
    try{
      var c=root.TechOpsGoodBoysCanon&&root.TechOpsGoodBoysCanon.SEQUENCE;if(c){
        c[3].name='ORBITAL PRISON — BREACH';c[3].objective='BREACH THE OUTER HULL · REACH CELL BLOCK 118';c[3].zone='BLACKSITE MERIDIAN — INTAKE DECK';c[3].bg='goodboys_breach';c[3].district='goodboys_breach';
        c[4].name='CELL 118';c[4].objective='FIND THE PRISONER · VERIFY K · BREAK THE CELL LOCK';c[4].zone='BLACKSITE MERIDIAN — BLOCK 118';c[4].bg='goodboys_cell118';c[4].district='goodboys_cell118';
        c[5].name='ACCESS CORE';c[5].objective='ESCORT K · OPEN THE ROUTE TO CELL 1984';c[5].zone='BLACKSITE MERIDIAN — ACCESS CORE';c[5].bg='goodboys_core';c[5].district='goodboys_core';
        c[6].name='CELL 1984';c[6].objective='BREAK LOCKDOWN · FREE WALDO';c[6].zone='BLACKSITE MERIDIAN — SURVEILLANCE BLOCK';c[6].bg='goodboys_cell1984';c[6].district='goodboys_cell1984';
      }
      var g=root.TechOpsGoodBoysGameplayLoop;if(g&&g.PHASES){
        g.PHASES[3]={id:'breach',label:'ORBITAL PRISON — BREACH',objective:'Reach Cell Block 118. Find the prisoner.',accent:'#ff8a4c',hazard:'debris',bg:'goodboys_breach'};
        g.PHASES[4]={id:'cell118',label:'CELL 118',objective:'Verify K. Break the lock. Free him.',accent:'#38bdf8',hazard:'security',bg:'goodboys_cell118'};
        g.PHASES[5]={id:'core',label:'ACCESS CORE',objective:'Escort K to the 1984 route controls.',accent:'#22c55e',hazard:'waves',bg:'goodboys_core'};
        g.PHASES[6]={id:'cell1984',label:'CELL 1984',objective:'Break lockdown. Free Waldo.',accent:'#ef4444',hazard:'warden',bg:'goodboys_cell1984'};
      }
    }catch(e){root.__goodBoysPrisonCanonError=String(e&&e.stack||e);}
  }
  function ensureStyle(){
    if(!root.document)return;if(style)return;style=root.document.createElement('style');style.id='good-boys-prison-cine-style';style.textContent=[
      '#gb-prison-cine{position:fixed;inset:0;z-index:130000;background:#02050a center/cover no-repeat;display:flex;align-items:flex-end;justify-content:center;padding:0 14px max(24px,env(safe-area-inset-bottom));font-family:monospace;color:#eef8ff}',
      '#gb-prison-cine:before,#gb-prison-cine:after{content:"";position:absolute;left:0;right:0;height:9vh;background:#000;z-index:1}#gb-prison-cine:before{top:0}#gb-prison-cine:after{bottom:0}',
      '#gb-prison-cine .card{position:relative;z-index:2;width:min(720px,94vw);margin-bottom:8vh;background:rgba(1,6,11,.94);border:1px solid #6bdcff;padding:17px 18px;border-radius:10px;box-shadow:0 0 42px #000}',
      '#gb-prison-cine .eyebrow{font:700 9px monospace;color:#ffb45e;letter-spacing:.12em}#gb-prison-cine h2{margin:7px 0 9px;font:700 21px/1.1 monospace}#gb-prison-cine p{margin:0 0 14px;font:12px/1.55 monospace;color:#d9edf7}',
      '#gb-prison-cine .goal{padding:9px 10px;border-left:3px solid #38bdf8;background:#07131ddd;color:#bfeaff;font:700 10px/1.4 monospace;margin-bottom:12px}',
      '#gb-prison-cine button{width:100%;height:50px;border:1px solid #6bdcff;border-radius:8px;background:#071624;color:#fff;font:700 11px monospace}'
    ].join('');(root.document.head||root.document.documentElement).appendChild(style);
  }
  function bgForMission(m){try{buildBackdrops();var k=m===3?'goodboys_breach':m===4?'goodboys_cell118':m===5?'goodboys_core':m===6?'goodboys_cell1984':'goodboys_escape',im=root.NM_BG734&&root.NM_BG734[k];return im&&im.src?im.src:'';}catch(e){return '';}}
  function showPrisonCinematic(m,done){
    if(cinematicOpen||!root.document){if(done)done();return;}cinematicOpen=true;ensureStyle();
    var scenes=m===3?[
      {t:'IMPACT VECTOR',p:'The stolen ship cannot dock. Katrin and Manchez ram the maintenance hull and punch a hole into Blacksite Meridian.',g:'GOAL: survive the breach and get inside the prison.'},
      {t:'BLACKSITE MERIDIAN',p:'This is not a portal. It is an orbital detention complex: cameras, barred cells, lockdown doors, and automated security on every deck.',g:'FIRST LEAD: CELL 118 — a prisoner logged under Mike’s identity.'},
      {t:'TWO NUMBERS',p:'118 is the clue. 1984 is Waldo. Free the first prisoner, learn why the records are wrong, then reach Waldo before the Warden seals the station.',g:'ROUTE: BREACH → CELL 118 → ACCESS CORE → CELL 1984.'}
    ]:[{t:m===4?'CELL 118':m===5?'ACCESS CORE':m===6?'CELL 1984':'ESCAPE DECK',p:m===4?'The record says Mike. The prisoner is not Mike. Get close enough to verify who is in the cell.':m===5?'K is free. Keep him alive while he tears open the route to Surveillance Block 1984.':m===6?'Waldo is behind the next lockdown. Break the Warden’s control and open Cell 1984.':'The prison is collapsing. Reach the shuttle bay and get everyone off the station.',g:m===4?'GOAL: verify K, destroy the cell controls, free him.':m===5?'GOAL: escort K to the access node.':m===6?'GOAL: free Waldo.':'GOAL: escape Blacksite Meridian.'}];
    var i=0,o=root.document.createElement('div');o.id='gb-prison-cine';root.document.body.appendChild(o);try{if(root.S)root.S.inDialog=true;}catch(e){}
    function render(){var s=scenes[i],src=bgForMission(m);o.style.backgroundImage=src?'linear-gradient(to bottom,rgba(0,0,0,.08),rgba(0,0,0,.55)),url("'+String(src).replace(/"/g,'%22')+'")':'linear-gradient(#07111b,#02050a)';o.innerHTML='<div class="card"><div class="eyebrow">GOOD BOYS PROTOCOL · ORBITAL DETENTION</div><h2>'+s.t+'</h2><p>'+s.p+'</p><div class="goal">'+s.g+'</div><button id="gb-prison-next">'+(i===scenes.length-1?'TAKE CONTROL':'CONTINUE')+'</button></div>';o.querySelector('#gb-prison-next').addEventListener('pointerdown',next,{passive:false});}
    function next(e){if(e){e.preventDefault();e.stopPropagation();}i++;if(i<scenes.length){render();return;}try{o.remove();}catch(_){}try{if(root.S)root.S.inDialog=false;}catch(_){}cinematicOpen=false;if(done)done();}
    render();
  }
  function missionEntry(){
    if(!active())return;var m=mission();if(m===lastMission)return;lastMission=m;
    try{if(root.NM){root.NM.cam=Math.max(0,Number(root.NM.cam)||0);root.NM.msg=m===3?'CELL 118 IS YOUR FIRST LEAD':m===4?'VERIFY THE PRISONER IN CELL 118':m===6?'WALDO IS IN CELL 1984':'';root.NM.msgT=(root.performance&&root.performance.now?root.performance.now():Date.now())+2600;}}catch(e){}
    if(m>=3&&m<=7)root.setTimeout(function(){showPrisonCinematic(m);},180);
  }
  function enforceBackdrop(){try{if(!active()||mission()<3||mission()>7)return;buildBackdrops();var c=root.TechOpsGoodBoysCanon;if(c&&c.enforceBackground)c.enforceBackground();}catch(e){}}
  function tick(){try{image();buildBackdrops();clarifyCanon();missionEntry();enforceBackdrop();}catch(e){root.__goodBoysPrisonPatchError=String(e&&e.stack||e);}}
  tick();var timer=root.setInterval?root.setInterval(tick,180):null;
  root.TechOpsGoodBoysPrisonCinematicPatch={VERSION:VERSION,tick:tick,buildBackdrops:buildBackdrops,clarifyCanon:clarifyCanon,showPrisonCinematic:showPrisonCinematic,enforceBackdrop:enforceBackdrop,timer:timer};
})(typeof globalThis!=="undefined"?globalThis:this);
