/* Good Boys orbital-prison cinematic + visual patch v3.
 * Owns detention artwork and mission-entry cinematics only. Campaign identity,
 * objectives, stages and progression are owned by the bible authorities.
 * Delayed mission cards are mission-bound so an M7 card can never land on top
 * of Earthfall after progression has already advanced to M8.
 */
(function(root){
  "use strict";
  if(!root)return;
  try{var old=root.TechOpsGoodBoysPrisonCinematicPatch;if(old&&old.timer&&root.clearInterval)root.clearInterval(old.timer);if(old&&old.pendingEntry&&root.clearTimeout)root.clearTimeout(old.pendingEntry);}catch(_){}
  var VERSION=3,atlasImg=null,building=false,built=false,lastMission=0,cinematicOpen=false,cinematicMission=0,style=null,pendingEntry=0;
  function cs(){try{return root.NM&&root.NM._v736?root.NM._v736:null;}catch(e){return null;}}
  function active(){return !!cs();}
  function mission(){var c=cs();try{return Math.max(1,Math.min(8,Number(c&&c.m||root.S&&root.S.meta&&root.S.meta._v736&&root.S.meta._v736.m||1)));}catch(e){return 1;}}
  function asset(){try{return root.ORBITAL_TILES&&root.ORBITAL_TILES.src&&root.ORBITAL_TILES.frames?root.ORBITAL_TILES:null;}catch(e){return null;}}
  function image(){try{var A=asset();if(!A)return null;if(!atlasImg||atlasImg.src!==A.src){atlasImg=new root.Image();atlasImg.onload=function(){buildBackdrops();};atlasImg.src=A.src;}return atlasImg.complete&&atlasImg.naturalWidth?atlasImg:null;}catch(e){return null;}}
  function fr(ctx,key,dx,dy,dw,dh,alpha){var A=asset(),im=image(),r=A&&A.frames&&A.frames[key];if(!ctx||!im||!r)return false;ctx.save();ctx.globalAlpha=alpha==null?1:alpha;ctx.imageSmoothingEnabled=false;ctx.drawImage(im,r[0],r[1],r[2],r[3],dx,dy,dw,dh);ctx.restore();return true;}
  function alarmFrame(){var A=asset(),f=A&&A.frames||{};return f.alarm_red?'alarm_red':f.alarm_red1?'alarm_red1':f.alarm_1?'alarm_1':f.alarm_0?'alarm_0':null;}
  function makeBackdrop(kind){
    var c=root.document.createElement('canvas');c.width=768;c.height=512;var x=c.getContext('2d');
    var g=x.createLinearGradient(0,0,0,512);g.addColorStop(0,kind==='cell1984'||kind==='escape'?'#17070b':'#07101a');g.addColorStop(.45,'#071019');g.addColorStop(1,'#02060a');x.fillStyle=g;x.fillRect(0,0,768,512);
    x.fillStyle='rgba(4,10,15,.94)';x.fillRect(0,54,768,345);
    for(var bx=0;bx<768;bx+=92)fr(x,(bx/92)%2?'cell_wall1':'cell_wall0',bx,80,96,74,.94);
    for(var fx=0;fx<768;fx+=64)fr(x,'floor_'+((fx/64)%6),fx,390,68,90,.96);
    fr(x,'pipe_0',34,42,176,52,.72);fr(x,'pipe_u',210,36,132,82,.68);fr(x,'vent_0',540,35,120,82,.74);
    fr(x,'cam_0',105,125,58,48,.95);fr(x,'cam_3',596,126,58,48,.95);
    var alarm=alarmFrame();if(alarm)fr(x,alarm,365,118,42,42,1);
    fr(x,'catwalk_0',0,300,156,105,.76);fr(x,'catwalk_1',150,300,126,105,.76);fr(x,'catwalk_3',510,300,138,105,.76);fr(x,'catwalk_4',640,300,128,105,.76);
    if(kind==='breach'){
      fr(x,'door_broken',94,232,90,118,1);fr(x,'rubble_0',180,320,100,110,.92);fr(x,'rubble_2',266,323,104,108,.92);fr(x,'bg_smoke',390,222,90,156,.46);fr(x,'laser_0',548,245,160,60,.86);
      x.strokeStyle='rgba(255,138,76,.68)';x.lineWidth=4;x.beginPath();x.moveTo(58,232);x.lineTo(120,170);x.lineTo(176,225);x.stroke();
    }else if(kind==='cell118'){
      fr(x,'door_bars0',80,202,116,142,1);fr(x,'door_bars1',195,202,116,142,1);fr(x,'console',355,230,150,110,.96);fr(x,'keypad_1',506,230,45,45,1);fr(x,'pod_0',615,195,88,155,.84);
      x.fillStyle='rgba(85,223,255,.8)';x.font='bold 22px monospace';x.textAlign='center';x.fillText('118',138,188);
    }else if(kind==='core'){
      fr(x,'rack_0',90,214,108,118,.95);fr(x,'rack_1',190,214,108,118,.95);fr(x,'console',324,220,180,126,1);fr(x,'laser_green',540,205,170,135,.72);fr(x,'door_glitch',615,205,132,137,.84);
      x.strokeStyle='rgba(34,197,94,.6)';x.lineWidth=2;for(var yy=178;yy<348;yy+=34){x.beginPath();x.moveTo(300,yy);x.lineTo(610,yy);x.stroke();}
    }else if(kind==='cell1984'){
      fr(x,'door_heavy0',104,192,118,154,1);fr(x,'door_heavy1',220,192,126,154,1);fr(x,'chair_2',390,217,86,130,.9);fr(x,'cam_5',530,170,64,52,1);fr(x,'laser_1',530,265,180,70,.86);
      x.fillStyle='rgba(255,71,93,.9)';x.font='bold 22px monospace';x.textAlign='center';x.fillText('1984',220,178);
    }else if(kind==='escape'){
      fr(x,'door_big',84,203,190,150,1);fr(x,'rubble_3',310,295,110,115,.92);fr(x,'rubble_5',408,302,104,110,.92);fr(x,'bg_red0',540,200,120,145,.48);if(alarm)fr(x,alarm,680,160,54,70,1);
      x.strokeStyle='rgba(245,158,11,.65)';x.lineWidth=3;x.beginPath();x.arc(565,270,70,0,Math.PI*2);x.stroke();
    }
    x.fillStyle='rgba(2,6,10,.22)';x.fillRect(0,0,768,512);
    var out=new root.Image();out.src=c.toDataURL('image/png');out._goodBoysDetentionBackdrop=true;out._goodBoysDetentionKind=kind;return out;
  }
  function buildBackdrops(){
    if(built||building||!root.document||!asset()||!image())return false;building=true;
    try{root.NM_BG734=root.NM_BG734||{};root.NM_BG734.goodboys_breach=makeBackdrop('breach');root.NM_BG734.goodboys_cell118=makeBackdrop('cell118');root.NM_BG734.goodboys_core=makeBackdrop('core');root.NM_BG734.goodboys_cell1984=makeBackdrop('cell1984');root.NM_BG734.goodboys_escape=makeBackdrop('escape');built=true;root.__goodBoysPrisonBackdropsReady=true;return true;}catch(e){root.__goodBoysPrisonBackdropError=String(e&&e.stack||e);return false;}finally{building=false;}
  }
  function syncBible(){try{var w=root.TechOpsGoodBoysBibleWorld;if(w&&w.syncDefinitions)return w.syncDefinitions();var b=root.TechOpsGoodBoysBackgroundAuthority;if(b&&b.syncCanon)return b.syncCanon();return false;}catch(e){return false;}}
  function ensureStyle(){if(!root.document||style)return;style=root.document.getElementById('good-boys-prison-cine-style')||root.document.createElement('style');style.id='good-boys-prison-cine-style';style.textContent=[
    'body.good-boys-cinematic #good-dogs-touch,body.good-boys-cinematic #good-boys-loop-controls,body.good-boys-cinematic #touch-buttons,body.good-boys-cinematic #good-boys-director-controls{display:none!important;visibility:hidden!important;pointer-events:none!important}',
    '#gb-prison-cine{position:fixed;inset:0;z-index:130000;background:#02050a center/cover no-repeat;display:flex;align-items:flex-end;justify-content:center;padding:0 14px max(24px,env(safe-area-inset-bottom));font-family:monospace;color:#eef8ff}',
    '#gb-prison-cine:before,#gb-prison-cine:after{content:"";position:absolute;left:0;right:0;height:9vh;background:#000;z-index:1}#gb-prison-cine:before{top:0}#gb-prison-cine:after{bottom:0}',
    '#gb-prison-cine .card{position:relative;z-index:2;width:min(720px,94vw);margin-bottom:8vh;background:rgba(1,6,11,.94);border:1px solid #6bdcff;padding:17px 18px;border-radius:10px;box-shadow:0 0 42px #000}',
    '#gb-prison-cine .eyebrow{font:700 9px monospace;color:#ffb45e;letter-spacing:.12em}#gb-prison-cine h2{margin:7px 0 9px;font:700 21px/1.1 monospace}#gb-prison-cine p{margin:0 0 14px;font:12px/1.55 monospace;color:#d9edf7}',
    '#gb-prison-cine .goal{padding:9px 10px;border-left:3px solid #38bdf8;background:#07131ddd;color:#bfeaff;font:700 10px/1.4 monospace;margin-bottom:12px}',
    '#gb-prison-cine button{width:100%;height:50px;border:1px solid #6bdcff;border-radius:8px;background:#071624;color:#fff;font:700 11px monospace}'
  ].join('');if(!style.parentNode)(root.document.head||root.document.documentElement).appendChild(style);}
  function bgForMission(m){try{var p=root.GOOD_BOYS_CUTSCENE_PLATES,pk=m===3?'orbital_approach':m===4?'cell_118':m===5?'access_core':m===6?'cell_1984':'warden_shuttle_bay';if(p&&p[pk])return p[pk];buildBackdrops();var k=m===3?'goodboys_breach':m===4?'goodboys_cell118':m===5?'goodboys_core':m===6?'goodboys_cell1984':'goodboys_escape',im=root.NM_BG734&&root.NM_BG734[k];return im&&im.src?im.src:'';}catch(e){return '';}}
  function scenesFor(m){
    if(m===3)return[
      {t:'IMPACT VECTOR',p:'Blacksite Meridian rejects the stolen ship. Katrin and Manchez do not dock — they ram the maintenance hull and tear an entrance through the prison skin.',g:'SURVIVE IMPACT · CROSS THE HULL BREACH.'},
      {t:'BLACKSITE MERIDIAN',p:'This is an orbital detention complex: barred cells, cameras, restraint systems, lockdown doors and automated security. The breach opens onto the maintenance deck.',g:'REACH CELL BLOCK 118.'},
      {t:'TWO NUMBERS',p:'The nav cache lists Cell 118 under Mike’s identity. Cell 1984 belongs to Waldo. The first prisoner may be the only route to the second.',g:'BREACH → CELL 118 → ACCESS CORE → CELL 1984.'}
    ];
    if(m===4)return[{t:'CELL 118',p:'The prison record says Mike. The prisoner does not move like Mike. Get close, inspect the evidence and verify who the station actually locked here.',g:'INVESTIGATE · VERIFY K · BREAK THE CELL LOCK.'}];
    if(m===5)return[{t:'ACCESS CORE',p:'K is free. His cipher is the route key, but the prison has sealed the path to Surveillance Block 1984. Keep security off him while he takes the route controls.',g:'ESCORT K · SEIZE THE ACCESS NODE · OPEN 1984.'}];
    if(m===6)return[{t:'CELL 1984',p:'Waldo is alive behind the surveillance lockdown. K needs time on the uplink while the block throws everything it has at the pair.',g:'DEFEND THE DECRYPT · BREAK LOCKDOWN · FREE WALDO.'}];
    return[{t:'ESCAPE VELOCITY',p:'K and Waldo are out. The Warden seals the shuttle bay and manifests through the prison control core. Break its hold, reunite the pair and reach the maintenance shuttle.',g:'BREAK THE WARDEN · REACH THE SHUTTLE · LEAVE BLACKSITE MERIDIAN.'}];
  }
  function otherBlockingCinematic(){try{return !!(root.document&&(root.document.getElementById('good-boys-earthfall-cine')||root.document.getElementById('good-boys-story-cine')||root.document.getElementById('good-boys-campaign-intro')));}catch(e){return false;}}
  function closePrisonCinematic(preserveDialog){
    try{var o=root.document&&root.document.getElementById('gb-prison-cine');if(o&&o.parentNode)o.parentNode.removeChild(o);}catch(_){}
    cinematicOpen=false;cinematicMission=0;
    try{if(root.document&&root.document.body&&!otherBlockingCinematic())root.document.body.classList.remove('good-boys-cinematic');if(root.S&&!preserveDialog&&!otherBlockingCinematic())root.S.inDialog=false;}catch(_){}
    return true;
  }
  function showPrisonCinematic(m,done){
    if(!active()||m<3||m>7||mission()!==m){if(done)done();return false;}
    if(cinematicOpen){if(cinematicMission===m)return true;closePrisonCinematic(true);}
    if(!root.document){if(done)done();return false;}cinematicOpen=true;cinematicMission=m;ensureStyle();var scenes=scenesFor(m),i=0,o=root.document.createElement('div');o.id='gb-prison-cine';root.document.body.appendChild(o);try{if(root.S)root.S.inDialog=true;if(root.document.body)root.document.body.classList.add('good-boys-cinematic');}catch(e){}
    function render(){var s=scenes[i],src=bgForMission(m);o.style.backgroundImage=src?'linear-gradient(to bottom,rgba(0,0,0,.08),rgba(0,0,0,.55)),url("'+String(src).replace(/"/g,'%22')+'")':'linear-gradient(#07111b,#02050a)';o.innerHTML='<div class="card"><div class="eyebrow">GOOD BOYS PROTOCOL · ORBITAL DETENTION</div><h2>'+s.t+'</h2><p>'+s.p+'</p><div class="goal">'+s.g+'</div><button id="gb-prison-next">'+(i===scenes.length-1?'TAKE CONTROL':'CONTINUE')+'</button></div>';o.querySelector('#gb-prison-next').addEventListener('pointerdown',next,{passive:false});}
    function next(e){if(e){e.preventDefault();e.stopPropagation();}if(mission()!==m){closePrisonCinematic(true);if(done)done();return;}i++;if(i<scenes.length){render();return;}closePrisonCinematic(false);if(done)done();}
    render();return true;
  }
  function missionEntry(){
    if(!active())return;var m=mission();if(m===lastMission){if(cinematicOpen&&cinematicMission!==m)closePrisonCinematic(m===8);return;}
    lastMission=m;if(pendingEntry&&root.clearTimeout){try{root.clearTimeout(pendingEntry);}catch(_){}pendingEntry=0;}
    if(m<3||m>7){if(cinematicOpen||root.document&&root.document.getElementById('gb-prison-cine'))closePrisonCinematic(m===8);return;}
    try{if(root.NM){root.NM.msg=m===3?'CELL 118 IS YOUR FIRST LEAD':m===4?'VERIFY THE PRISONER IN CELL 118':m===5?'K IS THE ROUTE KEY':m===6?'WALDO IS IN CELL 1984':'REACH THE MAINTENANCE SHUTTLE';root.NM.msgT=(root.performance&&root.performance.now?root.performance.now():Date.now())+2600;}}catch(e){}
    var expected=m;pendingEntry=root.setTimeout(function(){pendingEntry=0;if(active()&&mission()===expected)showPrisonCinematic(expected);},180);
  }
  function enforceBackdrop(){try{if(!active()||mission()<3||mission()>7)return;buildBackdrops();var b=root.TechOpsGoodBoysBackgroundAuthority;if(b&&b.enforce)b.enforce();else{var c=root.TechOpsGoodBoysCanon;if(c&&c.enforceBackground)c.enforceBackground();}}catch(e){}}
  function tick(){try{image();buildBackdrops();syncBible();missionEntry();if(cinematicOpen&&(mission()<3||mission()>7||cinematicMission!==mission()))closePrisonCinematic(mission()===8);enforceBackdrop();}catch(e){root.__goodBoysPrisonPatchError=String(e&&e.stack||e);}}
  tick();var timer=root.setInterval?root.setInterval(tick,180):null;
  root.TechOpsGoodBoysPrisonCinematicPatch={VERSION:VERSION,tick:tick,buildBackdrops:buildBackdrops,syncBible:syncBible,showPrisonCinematic:showPrisonCinematic,closePrisonCinematic:closePrisonCinematic,enforceBackdrop:enforceBackdrop,get pendingEntry(){return pendingEntry;},timer:timer};
})(typeof globalThis!=="undefined"?globalThis:this);
