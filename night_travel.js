/* Night district travel and street/building boundaries.
 * Called by the existing Night owners: no simulation timer or draw wrapper.
 * Coordinates for traffic are normalized so collision and rendering agree at
 * every canvas size. Campaign transport remains owned by its mission runtime. */
(function(root){
  'use strict';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const BUILDINGS=Object.freeze({industrial:{door:520,name:'FOUNDRY / PERSONNEL ENTRY'}});
  const PARK_X=150,SPAWN_X=280,FLOOR=430,TRIP_SECONDS=18;
  const ROOM_KEYS=['street','platforms','enemies','clear'];
  let controls=null,touch=0;
  function active(n){return !!n&&!n._v736&&!n._sector04&&typeof n.district==='string';}
  function building(n){return active(n)&&BUILDINGS[n.district];}
  function outside(n){return !!(building(n)&&n.location==='exterior');}
  function parked(n){return active(n)&&!n.drive&&(!building(n)||outside(n))&&(n.street===1||outside(n));}
  function grounded(n){return !!n.onGround&&Math.abs(n.y+(n.h||34)-FLOOR)<24;}
  function nearCar(n){return parked(n)&&grounded(n)&&Math.abs(n.x+(n.w||22)/2-PARK_X)<165&&!(n.enemies||[]).some(e=>e.alive&&Math.abs(e.x-n.x)<90);}
  function doorway(n){if(!building(n)||n.drive||!grounded(n))return null;return Math.abs(n.x+(n.w||22)/2-(outside(n)?BUILDINGS[n.district].door:72))<65?(outside(n)?'enter':'exit'):null;}
  function resetMotion(n,x){
    if(root.TechOpsNightCombat){root.TechOpsNightCombat.cancel(n);delete n._nightCombat;}
    if(root.TechOpsNightInput)root.TechOpsNightInput.reset();
    n.x=x;n.y=FLOOR-n.h;n.vx=0;n.vy=0;n.face=1;n.onGround=true;n.jumps=0;n.jHeld=false;n.dashT=0;n.block=false;n.hitStop=0;n.cam=0;
  }
  function room(n){const r={};for(const k of ROOM_KEYS)r[k]=n[k];return r;}
  function park(n){n.location='exterior';n.platforms=[];n.enemies=[];n.clear=false;resetMotion(n,SPAWN_X);n.msg='PARKED OUTSIDE — walk to the personnel door · E / A to enter';n.msgT=0;}
  function arrive(n){
    if(!active(n))return;
    n.location='street';n._buildingRoom=null;
    const saved=n._districtVisits&&n._districtVisits[n.district];
    if(building(n)){n._buildingRoom=saved||room(n);park(n);}
    else {if(saved)Object.assign(n,saved);resetMotion(n,SPAWN_X);}
  }
  function interact(n){
    const action=doorway(n);if(!action)return false;
    if(action==='enter'){
      Object.assign(n,n._buildingRoom);n.location='interior';resetMotion(n,105);
      n.msg='FOUNDRY — Charger parked outside · E / A at the left door to leave';
    }else{n._buildingRoom=room(n);park(n);resetMotion(n,BUILDINGS[n.district].door-100);}
    n.msgT=0;return true;
  }
  function cleared(n){if(!active(n))return false;if(!building(n)){n.street=1;resetMotion(n,SPAWN_X);return true;}if(outside(n))return false;n._buildingRoom=room(n);park(n);return true;}
  function start(n,to){
    const routes=root.TechOpsNightDistricts;
    if(!active(n)||n.drive||!nearCar(n)||!routes||!routes[to]||to==='sector04')return false;
    n._districtVisits=n._districtVisits||{};
    n._districtVisits[n.district]=outside(n)?n._buildingRoom:room(n);
    resetMotion(n,n.x);n.drive={to};init(n.drive);return true;
  }
  function init(d){
    if(d.traffic)return d;
    Object.assign(d,{t:0,dur:TRIP_SECONDS*1000,elapsed:0,progress:0,lane:1,y:1,held:0,cooldown:0,spawn:1.4,wave:0,traffic:[],integrity:100,hits:0,dodged:0,invincible:0,slow:0,failed:false});return d;
  }
  function step(n,dt,k={},j={}){
    if(!active(n)||!n.drive)return false;
    const d=init(n.drive);if(d.failed)return true;
    // Fixed bounded substeps also make low-FPS collision sweeps deterministic.
    let remaining=clamp(Number(dt)||0,0,.1);
    const direction=touch||((k.arrowup||k.w||j.y<-.5)?-1:0)+((k.arrowdown||k.s||j.y>.5)?1:0);
    if(direction&&direction!==d.held&&d.cooldown<=0){d.lane=clamp(d.lane+Math.sign(direction),0,2);d.cooldown=.16;}
    d.held=direction;
    while(remaining>0){
      const delta=Math.min(remaining,1/120);remaining-=delta;
      d.elapsed+=delta;d.cooldown=Math.max(0,d.cooldown-delta);d.invincible=Math.max(0,d.invincible-delta);d.slow=Math.max(0,d.slow-delta);
      d.y+=clamp(d.lane-d.y,-delta*5,delta*5);
      const speed=d.slow>0?.45:1;d.progress+=delta*speed/TRIP_SECONDS;d.t=d.progress*d.dur;
      d.spawn-=delta;
      if(d.spawn<=0){
        // Two lanes at most; the third always remains open with >2s warning.
        const free=[0,2,1,0,1,2][d.wave%6];
        for(let lane=0;lane<3;lane++)if(lane!==free&&(d.wave>1||lane===(free+1)%3))d.traffic.push({lane,x:1.12+(lane%2)*.13,speed:.29+(d.wave%3)*.015,hit:false,passed:false});
        d.wave++;d.spawn=4.5;
      }
      for(const car of d.traffic){
        const oldX=car.x;car.x-=delta*car.speed*speed;
        if(!car.hit&&d.invincible<=0&&oldX+.09>.22&&car.x-.09<.38&&Math.abs(car.lane-d.y)<.43){
          car.hit=true;d.hits++;d.integrity=Math.max(0,d.integrity-25);d.invincible=1.1;d.slow=.9;
          if(root.sfx)root.sfx('hit');
        }
        if(!car.passed&&car.x<.12){car.passed=true;if(!car.hit)d.dodged++;}
      }
      d.traffic=d.traffic.filter(car=>car.x>-.2);
      if(d.integrity<=0){d.failed=true;break;}
      if(d.progress>=1){
        const to=d.to;n.lastDrive={to,hits:d.hits,dodged:d.dodged,seconds:d.elapsed};n.drive=null;touch=0;
        if(root.nmLoadDistrict)root.nmLoadDistrict(to);if(root.nmApplyDriveWear733)root.nmApplyDriveWear733(to);break;
      }
    }
    return true;
  }
  function retry(n){if(!n||!n.drive||!n.drive.failed)return false;const to=n.drive.to;n.drive={to};init(n.drive);touch=0;return true;}
  function returnToCar(n){if(!n||!n.drive||!n.drive.failed)return false;n.drive=null;touch=0;resetMotion(n,SPAWN_X);return true;}
  function laneY(x,lane){return x.canvas.height*(.43+lane*.16);}
  function trafficCar(x,cx,base,width,color){
    // Ordinary traffic has its own four-door silhouette; the approved Charger
    // remains the player's unique green vehicle.
    const left=cx-width/2,h=width*.29,top=base-h;
    x.fillStyle='#02050b88';x.beginPath();x.ellipse(cx,base+5,width*.5,6,0,0,Math.PI*2);x.fill();
    x.fillStyle=color;x.beginPath();x.moveTo(left,base-10);x.lineTo(left+width*.09,top+h*.48);x.lineTo(left+width*.27,top+h*.42);x.lineTo(left+width*.37,top);x.lineTo(left+width*.73,top);x.lineTo(left+width*.86,top+h*.45);x.lineTo(left+width,top+h*.58);x.lineTo(left+width,base-8);x.closePath();x.fill();
    x.fillStyle='#121e2e';x.fillRect(left+width*.38,top+3,width*.15,h*.34);x.fillRect(left+width*.55,top+3,width*.17,h*.34);
    x.strokeStyle='#ffffff44';x.lineWidth=1;for(const f of [.36,.54,.76]){x.beginPath();x.moveTo(left+width*f,top+h*.43);x.lineTo(left+width*f,base-10);x.stroke();}
    for(const f of [.2,.8]){x.fillStyle='#060910';x.beginPath();x.arc(left+width*f,base-7,h*.23,0,7);x.fill();x.fillStyle='#9ba7b9';x.beginPath();x.arc(left+width*f,base-7,h*.11,0,7);x.fill();}
    x.fillStyle='#ff6767';x.fillRect(left+2,base-18,5,5);x.fillStyle='#fff0b8';x.fillRect(left+width-7,base-18,5,5);
  }
  function draw(x,n,now){
    if(!active(n)||!n.drive)return false;const d=init(n.drive),W=x.canvas.width,H=x.canvas.height;
    x.save();const sky=x.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#060d1b');sky.addColorStop(1,'#233244');x.fillStyle=sky;x.fillRect(0,0,W,H);
    // Reuse the authored city plate above the elevated road, with restrained parallax.
    const backgrounds=typeof NM_BG734!=='undefined'?NM_BG734:root.NM_BG734,im=backgrounds&&backgrounds.downtown;
    if(im&&im.complete&&im.naturalWidth){x.save();x.beginPath();x.rect(0,0,W,H*.29);x.clip();const s=Math.max(W/im.naturalWidth,H*.38/im.naturalHeight);x.globalAlpha=.55;x.drawImage(im,-(d.elapsed*18)%(Math.max(1,im.naturalWidth*s-W+1)),H*.3-im.naturalHeight*s,im.naturalWidth*s,im.naturalHeight*s);x.restore();}
    x.fillStyle='#0c1520';x.fillRect(0,H*.29,W,H*.58);
    for(let lane=0;lane<3;lane++){
      const y=laneY(x,lane);x.fillStyle=lane%2?'#1b2835':'#172431';x.fillRect(0,y-H*.1,W,H*.16);
      x.fillStyle='#80928d77';for(let i=0;i<14;i++)x.fillRect(((i*W/10-d.elapsed*W*.28)%(W+W/10)+W+W/10)%(W+W/10)-W/10,y+H*.045,W*.045,2);
    }
    x.fillStyle='#5e7787';x.fillRect(0,H*.30,W,3);x.fillRect(0,H*.84,W,4);
    for(let lane=0;lane<3;lane++){
      for(const car of d.traffic.filter(c=>c.lane===lane))trafficCar(x,car.x*W,laneY(x,lane),W*.14,['#7991a8','#bd8063','#8b879e'][lane]);
      if(Math.round(d.y)===lane){x.save();if(d.invincible>0)x.globalAlpha=.65;if(root.nmCar)root.nmCar(x,W*.30,laneY(x,d.y),W*.13,now);x.restore();}
    }
    const name=root.TechOpsNightDistricts&&root.TechOpsNightDistricts[d.to]?.name||d.to.toUpperCase();
    x.fillStyle='#09111de8';x.fillRect(W*.04,H*.04,W*.92,H*.14);x.textAlign='left';x.font=`bold ${Math.max(13,Math.min(20,W*.021))}px monospace`;x.fillStyle='#e4f5ef';x.fillText('EN ROUTE / '+name,W*.06,H*.085);
    x.font=`${Math.max(11,Math.min(15,W*.016))}px monospace`;x.fillStyle='#aac1d3';x.fillText('↑ / ↓ or W / S: change lane · Avoid traffic',W*.06,H*.125);
    x.fillStyle='#293e50';x.fillRect(W*.06,H*.15,W*.69,4);x.fillStyle='#56dfa9';x.fillRect(W*.06,H*.15,W*.69*clamp(d.progress,0,1),4);
    x.fillStyle=d.integrity<=25?'#ff8e7c':'#e3edeb';x.textAlign='right';x.fillText('CAR '+d.integrity+'%',W*.94,H*.15);
    if(d.failed){x.fillStyle='#060c16e8';x.fillRect(W*.12,H*.32,W*.76,H*.30);x.textAlign='center';x.fillStyle='#ffc09b';x.font='bold 22px monospace';x.fillText('PULL OVER',W*.5,H*.43);x.font='15px monospace';x.fillStyle='#e3edeb';x.fillText('Retry the drive or return to your parking spot.',W*.5,H*.51);}
    x.restore();return true;
  }
  function drawEntrance(x,n){
    if(!building(n)||n.drive)return false;const ext=outside(n),door=ext?BUILDINGS[n.district].door:72,cx=door-(n.cam||0);
    x.save();
    if(ext){
      // A curbside brick frontage, distinct from the authored factory interior.
      const left=cx-110;x.fillStyle='#253342';x.fillRect(left,160,520,FLOOR-160);x.strokeStyle='#60718055';x.lineWidth=1;
      for(let y=168;y<FLOOR;y+=16){x.beginPath();x.moveTo(left,y);x.lineTo(left+520,y);x.stroke();for(let bx=left+(y%32?0:24);bx<left+520;bx+=48)x.strokeRect(bx,y,48,16);}
      x.fillStyle='#101c29';x.fillRect(left+175,208,285,104);for(let i=0;i<7;i++){x.fillStyle=i%3?'#73a1ae55':'#edbc6977';x.fillRect(left+182+i*38,214,30,90);}
      x.fillStyle='#101923';x.fillRect(cx-58,FLOOR-133,116,133);x.fillStyle='#ffd38c';x.fillRect(cx-62,FLOOR-137,124,5);
    }
    x.fillStyle='#0b121e';x.fillRect(cx-30,FLOOR-99,60,99);x.strokeStyle='#79b7bc';x.lineWidth=3;x.strokeRect(cx-30,FLOOR-99,60,99);
    x.fillStyle='#83eac6';x.fillRect(cx+20,FLOOR-53,4,8);x.textAlign='center';x.fillStyle='#ffe1ac';x.font='bold 12px monospace';x.fillText(ext?'FOUNDRY / ENTRY':'EXIT TO STREET',cx,FLOOR-151);
    if(doorway(n)){x.fillStyle='#edfff8';x.font='12px monospace';x.fillText(ext?'E / A — ENTER':'E / A — LEAVE',cx,FLOOR-118);}
    x.restore();return true;
  }
  function syncUI(n){
    const doc=root.document;if(!doc)return;
    const driving=active(n)&&!!n.drive;doc.body.classList.toggle('night-driving',driving);
    if(!driving){touch=0;if(controls)controls.hidden=true;return;}
    if(!controls){
      const style=doc.createElement('style');style.textContent='body.night-driving #night-runtime-ui,body.night-driving #v55-nmbtns,body.night-driving #touch-btns,body.night-driving #toast{display:none!important}#night-drive-controls{position:fixed;left:50%;transform:translateX(-50%);bottom:max(14px,env(safe-area-inset-bottom));z-index:140;display:flex;gap:12px}#night-drive-controls[hidden]{display:none}#night-drive-controls button{min-width:100px;min-height:52px;padding:12px;border:2px solid #638795;border-radius:10px;background:#101e2bee;color:#edfff8;font:bold 14px monospace;touch-action:manipulation}';doc.head.appendChild(style);
      controls=doc.createElement('div');controls.id='night-drive-controls';
      for(const [label,action] of [['↑ LANE',-1],['↓ LANE',1],['RETRY','retry'],['RETURN','return']]){
        const b=doc.createElement('button');b.type='button';b.textContent=label;b.dataset.action=String(action);b.setAttribute('aria-label',typeof action==='number'?(action<0?'Change to upper traffic lane':'Change to lower traffic lane'):label==='RETRY'?'Retry drive':'Return to parked car');
        b.onclick=()=>{const world=root.TechOpsNightRuntime?.world();if(!world?.drive)return;if(action==='retry')retry(world);else if(action==='return')returnToCar(world);else{const d=init(world.drive);if(!d.failed)d.lane=clamp(d.lane+action,0,2);}};controls.appendChild(b);
      }doc.body.appendChild(controls);
    }
    const blocked=root.TechOpsNightRuntime?.blocked();controls.hidden=!!blocked;
    for(const b of controls.children)b.hidden=!!n.drive.failed!==['retry','return'].includes(b.dataset.action);
  }
  root.TechOpsNightTravel={VERSION:1,BUILDINGS,PARK_X,SPAWN_X,active,building,outside,parked,nearCar,doorway,arrive,interact,cleared,start,init,step,retry,returnToCar,draw,drawEntrance,syncUI};
})(typeof globalThis!=='undefined'?globalThis:this);
