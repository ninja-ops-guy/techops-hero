/* In-engine pixel-art mission surface. Input stays local; campaign save owns bytes. */
(function(root){
  'use strict';
  if(!root.document||root.TechOpsLowQuarterPlay)return;
  var Mission=root.TechOpsLowQuarterMission,Content=root.TechOpsLowQuarterScenario,Archive=root.TechOpsLivingArchive;
  if(!Mission||!Content)return;
  var ui=null,state=null,keys={},last=0,accumulator=0,savedAt=0,frame=0,priorDialog=false,error=null;
  var presentation=null;
  var motion=root.TechOpsLowQuarterMotion&&root.TechOpsLowQuarterMotion.create();
  var sprite=new root.Image();sprite.src='assets/v736/k_action_atlas.png';
  function load(){return root.TechOpsCampaign.load(root.localStorage);}
  function save(next){var v=Mission.validate(next);if(!v.valid||v.continuationBlocked)throw Error((v.errors||[v.reason]).join('; '));root.TechOpsLowQuarter.transact(next,function(s){return s;},function(s){return root.TechOpsCampaign.save(s,root.localStorage);});savedAt=next.lowQuarterMission.elapsed;}
  function button(label,fn){var b=root.document.createElement('button');b.textContent=label;b.type='button';b.addEventListener('click',fn);return b;}
  function message(text){ui.status.textContent=text;}
  function key(e,down){
    if(!ui)return;
    if(down&&e.code==='Escape'&&state.lowQuarterMission.dialog&&state.lowQuarterMission.dialog.kind==='archive'){e.preventDefault();e.stopImmediatePropagation();choose('cancel');return;}
    if(e.code==='Tab'&&down){var container=ui.choice.hidden?ui.host:ui.choice,buttons=Array.from(container.querySelectorAll('button')).filter(function(b){return !b.disabled;});var at=buttons.indexOf(root.document.activeElement);e.preventDefault();e.stopImmediatePropagation();buttons[(at+(e.shiftKey?-1:1)+buttons.length)%buttons.length].focus();return;}
    if(ui.choice.hidden===false&&e.code!=='Escape'){e.stopImmediatePropagation();return;}
    if(!['ArrowLeft','ArrowRight','ArrowUp','KeyA','KeyD','KeyW','KeyE','KeyJ','KeyK','Space','Escape'].includes(e.code))return;e.preventDefault();e.stopImmediatePropagation();
    keys[e.code]=down;if(down&&e.code==='Escape'){ui.paused=!ui.paused;keys={};ui.pause.textContent=ui.paused?'Resume':'Pause';}
  }
  function down(e){key(e,true);}function up(e){key(e,false);}
  function release(){keys={};if(ui){ui.paused=true;ui.pause.textContent='Resume';}}
  function control(label,code){var b=button(label,function(){});b.dataset.control=code;
    b.addEventListener('pointerdown',function(e){e.preventDefault();b.setPointerCapture(e.pointerId);keys[code]=true;});
    ['pointerup','pointercancel','lostpointercapture'].forEach(function(n){b.addEventListener(n,function(){keys[code]=false;});});return b;
  }
  function open(){
    if(ui)return true;
    try{
      var meta=root.S&&root.S.meta||{};if(meta._standaloneMode||meta._v736&&meta._v736.campaignOrigin==='standalone')throw Error('Return to the main campaign first.');
      var original=load(),v=Mission.validate(original);if(!v.valid||v.continuationBlocked)throw Error((v.errors||[v.reason]).join('; '));
      if(original.lowQuarter&&original.lowQuarter.scenario!==Content.id&&original.lowQuarter.phase!=='legacy_unassessed')throw Error('This save belongs to a different rescue operation.');
      state=original.lowQuarterMission?original:Mission.create(original);
      if(state.lowQuarter&&state.lowQuarter.phase==='closed'){state.lowQuarterMission.stage='closed';state.lowQuarterMission.message='Recorded response-area outcome: '+state.lowQuarter.result.outcome.replaceAll('_',' ')+'. Wider Low Quarter unassessed. Iona’s campaign and the Chorus continue.';}
      save(state);if(motion)motion.reset(state.lowQuarterMission);
      if(root.closeDlg)root.closeDlg();priorDialog=!!(root.S&&root.S.inDialog);if(root.S)root.S.inDialog=true;
      var host=root.document.createElement('section');host.id='low-quarter-play';host.setAttribute('role','dialog');host.setAttribute('aria-modal','true');host.setAttribute('aria-label','Hold the Way Home — surveyed response area');
      var style=root.document.createElement('style');style.textContent='#low-quarter-play{position:fixed;inset:0;z-index:2147483000;display:flex;flex-direction:column;background:#080e18;color:#e8f0f3;font:14px system-ui;padding:8px;box-sizing:border-box;overscroll-behavior:none}#low-quarter-play button{min-height:44px;min-width:44px;padding:8px 12px;background:#162a39;color:#f5faf8;border:1px solid #60928d;border-radius:5px;font:inherit;touch-action:none}#low-quarter-play header,#low-quarter-play nav{display:flex;gap:6px;flex-wrap:wrap;align-items:center}#low-quarter-play h2{font-size:17px;margin:4px auto 4px 0}#low-quarter-play canvas{width:100%;height:100%;object-fit:contain;image-rendering:pixelated;min-height:0}#lq-scene{flex:1;min-height:140px;overflow:hidden;background:#080e18}#lq-status{min-height:42px;margin:5px 0;font-size:14px;line-height:1.4}#lq-choice{position:absolute;inset:20% 5% auto;background:#112332;border:2px solid #8acaab;border-radius:8px;padding:18px;box-shadow:0 0 0 100vmax #0009}#lq-choice[hidden]{display:none}#lq-choice button{margin:5px}#low-quarter-play small{color:#a9bfcb}#lq-prompt{min-height:42px;font-size:14px}@media(max-width:600px){#low-quarter-play{padding:6px;font-size:12px}#low-quarter-play button{padding:6px;min-height:44px}#low-quarter-play h2{font-size:14px}#lq-status{font-size:12px}#low-quarter-play small{font-size:11px}}';
      // Give the street the full display height on landscape phones.
      style.textContent += `@media (orientation:landscape) and (max-height:480px) and (min-width:640px){
        #low-quarter-play{display:grid;grid-template-columns:minmax(0,1fr) 210px;grid-template-rows:auto 1fr auto auto;gap:4px 8px;padding:4px}
        #lq-scene{grid-column:1;grid-row:1/5;align-self:stretch;min-height:0}
        #low-quarter-play header,#lq-prompt,#lq-status,#low-quarter-play nav{grid-column:2}
        #low-quarter-play header{grid-row:1}#low-quarter-play h2{font-size:13px;width:100%}
        #low-quarter-play>small{display:none}#lq-prompt{grid-row:2;align-self:end}
        #lq-status{grid-row:3}#low-quarter-play nav{grid-row:4;gap:3px}
        #low-quarter-play button{padding:4px;font-size:12px}
        #lq-prompt,#lq-status{font-size:12px;min-height:0}
      }`;
      style.textContent += '#lq-choice{inset:8% 5% auto;max-height:84%;overflow-y:auto;box-sizing:border-box}#lq-choice h3{font-size:17px;margin:0 0 10px}#lq-choice article{border-top:1px solid #41635f;padding:12px 0}#lq-choice article h4{margin:0 0 6px;color:#aee1c7}#lq-choice article p{line-height:1.5;margin:0 0 6px;overflow-wrap:anywhere}#lq-choice article small{display:block;line-height:1.5}';
      host.appendChild(style);var header=root.document.createElement('header'),title=root.document.createElement('h2');title.textContent='LOW QUARTER · HOLD THE WAY HOME';header.appendChild(title);
      var pause=button('Pause',function(){ui.paused=!ui.paused;keys={};pause.textContent=ui.paused?'Resume':'Pause';});header.appendChild(pause);header.appendChild(button('Save & return',close));host.appendChild(header);
      var scope=root.document.createElement('small');scope.textContent=Content.scope+' K and Iona are here; other crew stay at their established stations.';host.appendChild(scope);
      var area=root.document.createElement('div');area.id='lq-scene';var canvas=root.document.createElement('canvas');canvas.width=960;canvas.height=540;canvas.setAttribute('aria-label','Side-view district. Walk to marked objects, hold interact, and fight nearby infected.');area.appendChild(canvas);host.appendChild(area);
      var prompt=root.document.createElement('div');prompt.id='lq-prompt';host.appendChild(prompt);var status=root.document.createElement('div');status.id='lq-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');host.appendChild(status);
      var nav=root.document.createElement('nav');nav.setAttribute('aria-label','Mission controls');[['◀','ArrowLeft'],['▶','ArrowRight'],['Jump','Space'],['Strike','KeyJ'],['Guard','KeyK'],['Interact','KeyE']].forEach(function(pair){nav.appendChild(control(pair[0],pair[1]));});host.appendChild(nav);
      nav.appendChild(button('People & routes',function(){ui.paused=true;ui.pause.textContent='Resume';keys={};var s=state.lowQuarter?root.TechOpsLowQuarter.evaluate(state):null;message(s?'Verified safe '+s.safe.length+' / 48. Unresolved '+s.unresolved.length+'. '+state.lowQuarterMission.carriers.map(function(c){return c.id+': '+c.phase+' ('+c.sector+')';}).join(' · '):'The repaired two-ended crossing must be verified before entering.');}));
      if(Archive)nav.appendChild(button('Read records',function(){try{var next=Mission.step(state,{readArchive:true},.1);save(next);state=next;keys={};dialog();}catch(e){error=e.message;message('Records unavailable: '+error);}}));
      var choice=root.document.createElement('div');choice.id='lq-choice';choice.hidden=true;host.appendChild(choice);root.document.body.appendChild(host);
      ui={host:host,canvas:canvas,ctx:canvas.getContext('2d'),status:status,prompt:prompt,choice:choice,pause:pause,paused:false,dialogKey:null,focus:root.document.activeElement};
      root.addEventListener('keydown',down,true);root.addEventListener('keyup',up,true);root.addEventListener('blur',release);root.document.addEventListener('visibilitychange',visibility);
      pause.focus();last=0;accumulator=0;error=null;message(state.lowQuarterMission.message);frame=root.requestAnimationFrame(loop);return true;
    }catch(e){error=e.message;if(root.toast)root.toast(error,5000);return false;}
  }
  function visibility(){if(root.document.hidden)release();}
  function close(){if(!ui)return false;try{save(state);}catch(e){error=e.message;message('Save failed: '+error+'. Last durable checkpoint remains available.');return false;}
    root.cancelAnimationFrame(frame);root.removeEventListener('keydown',down,true);root.removeEventListener('keyup',up,true);root.removeEventListener('blur',release);root.document.removeEventListener('visibilitychange',visibility);
    var focus=ui.focus;ui.host.remove();ui=null;keys={};if(root.S)root.S.inDialog=priorDialog;if(focus&&focus.isConnected)focus.focus();return true;
  }
  function choose(value){try{var next=Mission.step(state,{choice:value},.1);save(next);state=next;keys={};}catch(e){error=e.message;message('Choice was not saved: '+error);}}
  function dialog(){var m=state.lowQuarterMission,d=m.dialog,key=d?JSON.stringify(d):null;if(key===ui.dialogKey)return;ui.dialogKey=key;ui.choice.replaceChildren();ui.choice.hidden=!d;if(!d)return;
    if(d.kind==='archive'){
      var heading=root.document.createElement('h3');heading.textContent=d.sector?'Records left here':'Your copies of local records';ui.choice.appendChild(heading);
      var introduction=root.document.createElement('p');introduction.textContent='Repair tags, directions and care handoffs preserve what people did. These are the last copies K read; a later change needs another visit.';ui.choice.appendChild(introduction);
      var cards=d.sector?m.archive&&m.archive.readings[d.sector]||[]:Archive.remembered(state);
      if(!cards.length){var empty=root.document.createElement('p');empty.textContent='No local records copied yet. Walk to a records station after work has been witnessed.';ui.choice.appendChild(empty);}
      cards.forEach(function(card){var article=root.document.createElement('article'),title=root.document.createElement('h4'),body=root.document.createElement('p'),source=root.document.createElement('small');title.textContent=card.title;body.textContent=card.body;source.textContent=card.sources.length+' local observation'+(card.sources.length===1?'':'s')+' · copied '+Math.floor(card.observedAt)+' seconds into this mission';article.appendChild(title);article.appendChild(body);article.appendChild(source);ui.choice.appendChild(article);});
      ui.choice.appendChild(button('Return to the street',function(){choose('cancel');ui.pause.focus();}));ui.choice.querySelector('button').focus();return;
    }
    var p=root.document.createElement('p');p.textContent=d.kind==='resident'?d.label+'. '+(d.care==='ordinary care'?'A neighbor asks who will receive them.':'“I need an attendant. Where will someone accept my care?”')+' The route stays in this realm; the ship is not the destination.':'Outcome: '+d.outcome.replaceAll('_',' ')+'. This permanently closes this surveyed response area for this run. Wider Low Quarter unassessed.';ui.choice.appendChild(p);
    (d.kind==='resident'?[['Offer attended transport','transport'],['Offer supported shelter','shelter'],['Respect refusal','declined'],['Keep talking later','cancel']]:[['Keep working','cancel'],['Confirm permanent closeout','confirm']]).forEach(function(pair){ui.choice.appendChild(button(pair[0],function(){choose(pair[1]);}));});ui.choice.querySelector('button').focus();
  }
  function loop(at){if(!ui)return;var dt=last?Math.min(.25,(at-last)/1000):0;last=at;
    if(!ui.paused&&!root.document.hidden){accumulator+=dt;try{while(accumulator>=.1){var before=state,old=before.lowQuarter?before.lowQuarter.events.length+before.lowQuarter.siege.events.length:0;
      var next=Mission.step(state,{move:(keys.ArrowRight||keys.KeyD?1:0)-(keys.ArrowLeft||keys.KeyA?1:0),interact:!!keys.KeyE,attack:!!keys.KeyJ,block:!!keys.KeyK,jump:!!(keys.Space||keys.ArrowUp||keys.KeyW)},.1);
      var n=next.lowQuarter?next.lowQuarter.events.length+next.lowQuarter.siege.events.length:0;
      if(n!==old||next.lowQuarterMission.elapsed-savedAt>=2||next.lowQuarterMission.stage!==before.lowQuarterMission.stage||!!next.lowQuarterMission.dialog!==!!before.lowQuarterMission.dialog)save(next);
      if(motion)motion.commit(before.lowQuarterMission,next.lowQuarterMission);state=next;accumulator-=.1;
    }}catch(e){error=e.message;ui.paused=true;keys={};ui.pause.textContent='Resume';state=load();message('Mission paused at its saved checkpoint: '+error);}}
    draw(at);dialog();frame=root.requestAnimationFrame(loop);
  }
  function rect(x,y,w,h,color){ui.ctx.fillStyle=color;ui.ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
  function text(label,x,y,color,size){var c=ui.ctx;c.fillStyle=color||'#d9e5e9';c.font=Math.max(size||13,ui.labelSize||10)+'px monospace';c.textAlign='left';c.fillText(label,Math.round(x),Math.round(y));}
  function figure(x,y,color,label,stride){if(root.TechOpsLowQuarterArt){root.TechOpsLowQuarterArt.person(ui.ctx,x,y,color,null,stride);if(label)text(label,x-22,y-56,'#cedbdd',10);return;}rect(x-7,y-34,14,22,color);rect(x-5,y-47,10,12,'#c7a68b');rect(x-7,y-12,5,12,'#1b2636');rect(x+2,y-12,5,12,'#1b2636');if(label)text(label,x-22,y-54,'#b8cbd0',10);}
  function draw(at){
    var m=state.lowQuarterMission,p=m.player,c=ui.ctx,area=Content.places.find(function(a){return a.id===p.sector;}),width=area?area.width:p.sector==='receiving'?1920:1450,floor=430;
    var W=ui.canvas.parentElement.clientWidth<600?540:960;if(ui.canvas.width!==W)ui.canvas.width=W;
    ui.labelSize=Math.ceil(10/Math.max(.25,Math.min(ui.canvas.parentElement.clientWidth/W,ui.canvas.parentElement.clientHeight/540)));
    var reduced=root.matchMedia&&root.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var view=motion&&motion.sample(m,accumulator/.1,ui.paused||!!m.dialog||!!m.travel),px=view?view.x:p.x,jump=view?view.jump:p.jump;
    var cam=Math.max(0,Math.min(width-W,px-W/2)),art=root.TechOpsLowQuarterArt;
    function smooth(entity,list){var old=list&&list.find(function(v){return v.id===entity.id;});return view?view.point(entity,old):entity.x;}
    function stride(entity,old){return !reduced&&old&&entity.sector===old.sector&&Math.abs(entity.x-old.x)>.001?m.elapsed*9:0;}
    c.clearRect(0,0,W,540);
    if(art)art.world(c,m,cam,floor,width);else{
      rect(0,0,W,540,'#0b1420');rect(0,60,W,210,'#17192b');
      for(var i=0;i<12;i++){var bx=i*220-cam*.4;rect(bx,170-(i%3)*20,150,180,'#202936');for(var j=0;j<3;j++)rect(bx+25+j*35,210,10,14,'#45515d');}
      if(m.stage==='assault')for(var n=0;n<85;n++)rect(((n*67-cam*.1)%W+W)%W,294+(n%5)*4,3,7,'#704658');
      rect(0,floor,W,110,'#1b2931');rect(0,floor,W,4,'#576a6d');
      for(var x=0;x<width;x+=160)rect(x-cam,445,90,3,'#34424b');
    }
    // One foreground hull plus accompanying distant hulls represent the existing
    // physical group; scenery is never a wave arrival or capacity receipt.
    Content.definition.waves.forEach(function(w){var v=m.waves[w.id];if(w.sector!==p.sector||!v)return;
      var sy=v.arrived===null?55+Math.min(1,v.flight/20)*224:279;
      if(art){art.ship(c,12-cam,sy,v.sealed);for(var j=0;j<4;j++){c.save();c.translate(280+j*125-cam*.3,95+j*13);c.scale(.16,.16);art.ship(c,0,0,true);c.restore();}}
      else {rect(35-cam,sy,190,34,'#384452');rect(60-cam,sy-15,115,15,'#4d5264');}
      text(v.arrived===null?'PHYSICAL APPROACH':v.sealed?'UNLOADING DENIED':'INFECTED TRANSPORT GROUP',30-cam,sy-17,'#e3bbc4',11);
    });
    rect(8,8,Math.min(W-16,510),54,'#0a1926');
    text(area?area.name:p.sector==='receiving'?'Screened receiving care':'Source-side service access',20,28,'#9ed8c2',18);text('K  '+Math.round(p.hp)+' HP   '+(m.stage==='assault'?Math.floor(m.clock)+'s · '+(state.lowQuarter.siege.events.filter(function(e){return e.type==='advance';}).slice(-1)[0]||{phase:'warning'}).phase:m.stage),20,52);
    if(m.travel){rect(20,195,W-40,100,'#122c39');text('Following '+m.travel.from+' → '+m.travel.to,35,228,'#cbe5df');text(Math.ceil(m.travel.remaining)+' seconds along the physical route',35,258);}
    if(!art&&p.sector==='approaches'){rect(110-cam,360,100,8,'#a7c3b5');rect(110-cam,365,5,65,'#6d8f87');rect(205-cam,365,5,65,'#6d8f87');text('HANDRAIL',110-cam,350,'#a7c3b5',11);}
    if(!art&&p.sector==='services'){rect(1020-cam,320,130,110,'#283948');text('SECONDARY ROOM',1015-cam,302,'#b9ccd3',12);}
    if(!art&&p.sector==='shelters'){rect(750-cam,305,200,125,'#263741');text('OCCUPIED BLOCK',755-cam,290,'#b9ccd3',12);}
    if(area){figure(1170-cam,floor,'#ddaf68','engineer');figure(1490-cam,floor,'#82b9ab','witness');figure(1270-cam,floor,'#94a9b6','officer');
      // Iona remains a separate local signal engineer, not a remote commander.
      if(m.iona&&m.iona.sector===p.sector)figure(m.iona.x-cam,floor,'#322e43','Iona · signal');
    }
    if(m.probe){text('TEST '+m.probe.channel,20,88,'#9ed8c2',12);text('Independent endpoint replies: '+m.probe.replies.length+' / 2',20,108,'#d6e8e2',12);}
    if(p.sector==='approaches'&&m.ending==='control'&&m.branch.step===4){var progress=m.branch.crossing,person=m.residents[m.branch.crossingResident];figure(person.x-40-cam,floor,'#94a9ad','attendant');rect(1760-cam,440,400,8,m.branch.stopped?'#6ebca4':'#b95f63');text(m.branch.stopped?'CIVILIAN VETO · CROSSING OPEN':'HARMFUL SEAL ORDER · USE EXTERNAL STOP',1750-cam,330,'#e0c89a',12);}
    Object.entries(m.residents).forEach(function(pair){var id=pair[0],r=pair[1];if(r.sector===p.sector&&['home','gate','sheltered'].includes(r.status))figure(view?view.point(r,view.previous&&view.previous.residents[id])-cam:r.x-cam,floor,r.status==='sheltered'?'#507c76':'#9b8c78',r.status==='gate'?'gate':null,stride(r,view&&view.previous&&view.previous.residents[id]));});
    m.units.filter(function(u){return u.sector===p.sector&&u.travel<=0&&!u.lost;}).forEach(function(u){figure(smooth(u,view&&view.previous&&view.previous.units)-cam,floor,u.id.startsWith('robot')?'#7f9dba':'#6c8d78',u.id==='signal_picket'?'picket':null);});
    m.enemies.filter(function(e){return e.sector===p.sector;}).forEach(function(e){var ex=smooth(e,view&&view.previous&&view.previous.enemies)-cam;figure(ex,floor,e.contained?'#584e64':'#9a405d',e.contained?'contained lane':null);rect(ex-10,floor-60,e.hp*6,3,'#b96b87');});
    if(p.sector==='approaches'&&m.primaryClosed){rect(1860-cam,350,18,80,'#b7ac83');text('OLD BRANCH CLOSED',1790-cam,332,'#e1d5b1',11);}
    if(Archive&&area){var guide=Archive.status(state,p.sector);if(guide.mark){var markColor=guide.ready?'#a8d9ba':'#d9ba78';
      [1100,1240,1380].forEach(function(x){rect(x-cam,floor+20,35,3,markColor);rect(x+27-cam,floor+14,3,15,markColor);rect(x+31-cam,floor+17,3,9,markColor);});
      text(guide.ready?'FOLLOW MARKS TO GATE':'WAIT · CHECK LOCAL CONDITIONS',1100-cam,floor+48,markColor,11);
    }}
    if(p.sector==='receiving'){figure(660-cam,floor,'#e4c49a','receiver 1');figure(860-cam,floor,'#e4c49a','receiver 2');text('SCREENED CARE · SAME REALM',550-cam,300,'#b8d7ca',13);}
    m.carriers.filter(function(v){return v.sector===p.sector&&['idle','loading','outbound','interrupted','handoff','care'].includes(v.phase);}).forEach(function(v){var x=smooth(v,view&&view.previous&&view.previous.carriers)-cam;if(art)art.carrier(c,x,floor);else{rect(x-40,floor-38,80,28,'#577d89');rect(x-30,floor-10,18,12,'#090e16');rect(x+20,floor-10,18,12,'#090e16');}text(v.id,x-40,floor-58,'#c1e0e8',10);});
    var pose=view?view.pose:m.hold?12:m.attack>0?5:(keys.ArrowLeft||keys.ArrowRight||keys.KeyA||keys.KeyD)?Math.floor(m.elapsed*1000/120)%4:28;if(reduced&&view&&view.moving&&!m.attack&&!m.hold)pose=0;
    presentation={x:Math.round(px),jump:Math.round(jump),screenX:Math.round(px-cam),cam:cam,width:W,pose:pose,alpha:view?view.alpha:1,elapsed:m.elapsed,paused:ui.paused,cache:art?art.cacheStats():null};
    // Gameplay actors retain original pixels, proportions and foot baseline.
    if(sprite.complete&&sprite.naturalWidth){var sx=(pose%7)*288,sy=Math.floor(pose/7)*184;c.save();c.translate(Math.round(px-cam),Math.round(floor-jump));if(p.face<0)c.scale(-1,1);c.imageSmoothingEnabled=false;c.drawImage(sprite,sx,sy,288,184,-60,-77,120,77);c.restore();}else text('K',px-cam,floor-jump,'#8fe6b0',22);
    if(m.attack>0)rect(px-cam+p.face*50,floor-45-jump,24,4,'#edc28a');
    var nearest=Mission.nearest(state),objects=Mission.objects(state);objects.filter(function(o){return o.action!=='resident'&&o.action!=='carrier';}).forEach(function(o){rect(o.x-cam-9,floor-78,18,18,'#78b89b');text(o.id.split('_')[0].toUpperCase(),o.x-cam-28,floor-88,'#a9ddc9',10);});
    ui.prompt.textContent=ui.paused?'Paused. Resume to continue.':nearest?'Hold E / Interact: '+nearest.label+(m.hold?' · '+Math.min(100,Math.round(m.hold.progress/nearest.duration*100))+'%':''):'Walk with ← → / A D. Hold E at a marker or neighbor; J strike, K guard, Space jump. Exits are marked at the right edge.';
    if(!ui.paused&&!error)message(m.message);if(ui.paused)text('PAUSED',W/2-48,120,'#e6d29c',25);
  }
  root.TechOpsLowQuarterPlay={open:open,close:close,active:function(){return !!ui;},snapshot:function(){return state?JSON.parse(JSON.stringify(state.lowQuarterMission)):null;},presentation:function(){return presentation?Object.assign({},presentation):null;},error:function(){return error;}};
})(typeof globalThis!=='undefined'?globalThis:this);
