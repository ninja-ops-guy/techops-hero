/* Authored in-engine domestic prologue, using existing background and actor art.
 * Source plates contain reference HUDs/actors: only the clean architecture band
 * is sampled. The live canvas supplies staging, lighting and the actual pair. */
(function(root){
  'use strict';
  if(!root.document||root.TechOpsGoodDogsHomeScene)return;
  var cachedImages=null,loading=null,keyboardObserved=!!root.__techopsPhysicalKeyboardObserved;
  function touchPrimary(){try{return !!(root.navigator&&Number(root.navigator.maxTouchPoints||0)>0);}catch(_){return false;}}
  function localAvailable(){return !touchPrimary()||keyboardObserved;}
  function localReason(){return localAvailable()?'Physical keyboard detected. Local two-player is available.':'Local two-player needs a physical keyboard on this touch device. Use Single player, or connect a keyboard and press any key.';}
  function restoreFocus(previous){if(previous&&previous.isConnected!==false&&typeof previous.focus==='function')previous.focus();}
  function trapTab(e,el){if(e.key!=='Tab')return false;var buttons=Array.from(el.querySelectorAll('button')).filter(function(b){return !b.disabled&&!b.hidden;}),i=buttons.indexOf(root.document.activeElement);if(!buttons.length)return false;e.preventDefault();e.stopImmediatePropagation();buttons[i<0?(e.shiftKey?buttons.length-1:0):(i+(e.shiftKey?-1:1)+buttons.length)%buttons.length].focus();return true;}
  function refreshLocalChoice(scope){try{var el=scope||root.document.getElementById('good-dogs-mode-select'),button=el&&el.querySelector('#gd-mode-local'),note=el&&el.querySelector('#gd-local-device-note'),ok=localAvailable();if(button){button.disabled=!ok;button.setAttribute('aria-disabled',ok?'false':'true');button.setAttribute('aria-describedby','gd-local-device-note');}if(note){note.hidden=ok;note.textContent=localReason();}return ok;}catch(_){return false;}}
  function observeKeyboard(e){try{if(e&&e.isTrusted===false)return false;var key=String(e&&e.key||e&&e.code||'');if(!key||/^(Shift|Control|Alt|Meta|CapsLock|NumLock|ScrollLock)$/i.test(key))return false;keyboardObserved=true;root.__techopsPhysicalKeyboardObserved=true;refreshLocalChoice();return true;}catch(_){return false;}}
  if(root.addEventListener)root.addEventListener('keydown',observeKeyboard,true);
  var shots=[
    {place:"WALDO'S HOUSE",title:'The porch light is still on.',body:'Waldo is missing. Katrin and Manchez return to his house to find his trail.',plate:'house',pan:0},
    {place:'THE YARD',title:'Something leads toward the garage.',body:'Follow the traces across the property. Whatever happened here, the dogs will find it together.',plate:'house',pan:28},
    {place:"WALDO'S GARAGE",title:'Start with what he left behind.',body:'Search the garage. Work together to open the false wall.',plate:'garage',pan:0}
  ];
  function style(){if(root.document.getElementById('good-dogs-opening-style'))return;var s=root.document.createElement('style');s.id='good-dogs-opening-style';s.textContent=`
.gd-opening{position:fixed;inset:0;z-index:170000;background:#070c12;color:#f9eedc;font-family:monospace;display:grid;place-items:center;padding:max(20px,env(safe-area-inset-top)) 20px max(20px,env(safe-area-inset-bottom));box-sizing:border-box;overflow:auto}
body[data-good-dogs-mode="local"] #gb-swap,body[data-good-dogs-mode="local"] #gb-partner{display:none!important}.gd-opening *{box-sizing:border-box}.gd-opening button{font:700 13px monospace;min-height:48px;border:1px solid #756b50;background:#172128;color:#fff0d5;padding:12px 18px;cursor:pointer;border-radius:5px}.gd-opening button:hover,.gd-opening button:focus-visible{outline:2px solid #ffe0a2;outline-offset:3px;background:#293334}
.gd-opening .gd-kicker{color:#d9b878;letter-spacing:.16em;font-size:11px}.gd-opening h1{font-size:clamp(24px,5vw,38px);line-height:1.12;margin:14px 0}.gd-opening p{font-size:13px;line-height:1.7;color:#c9d0cb;margin:12px 0 22px}.gd-opening .gd-choices{display:grid;grid-template-columns:1fr 1fr;gap:14px}.gd-opening .gd-choice{text-align:left;min-height:170px;padding:22px}.gd-opening .gd-choice strong{display:block;color:#fff0d5;font-size:18px;margin-bottom:12px}.gd-opening .gd-choice span{display:block;font:12px/1.7 monospace;color:#bac8c7}.gd-opening .gd-cancel{border:0;background:transparent;margin-top:18px;color:#9faeac}.gd-opening .gd-story{width:min(100%,1000px)}.gd-opening canvas{display:block;width:100%;aspect-ratio:16/7;image-rendering:pixelated;background:#0d151d;border:1px solid #343932}.gd-opening .gd-story-copy{max-width:740px;margin:22px auto 0}.gd-opening .gd-actions{display:flex;justify-content:space-between;gap:16px;align-items:center}.gd-opening .gd-dots{display:flex;gap:7px}.gd-opening .gd-dot{height:3px;width:24px;background:#344039}.gd-opening .gd-dot.active{background:#e7bd78}
@media(max-width:700px){#good-boys-board-ship{bottom:auto!important;top:144px!important;min-width:180px!important;min-height:44px!important;font-size:11px!important;padding:10px 14px!important}}
@media(max-width:580px){.gd-opening .gd-choices{grid-template-columns:1fr}.gd-opening .gd-choice{min-height:110px;padding:15px}.gd-opening canvas{aspect-ratio:16/7}.gd-opening h1{font-size:25px}.gd-opening .gd-story-copy{margin-top:18px}}
`;root.document.head.appendChild(s);}
  function shell(id){style();var el=root.document.createElement('section');el.id=id;el.className='gd-opening';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');root.document.body.appendChild(el);return el;}
  function choose(){return new Promise(function(resolve){
    var focus=root.document.activeElement,el=shell('good-dogs-mode-select'),done=false;
    el.setAttribute('aria-labelledby','gd-mode-title');el.innerHTML='<div style="width:min(720px,100%)"><div class="gd-kicker">GOOD DOGS PROTOCOL · STORY CAMPAIGN</div><h1 id="gd-mode-title">Two dogs. One way home.</h1><p>Choose how you will play Katrin and Manchez.</p><div class="gd-choices"><button id="gd-mode-solo" class="gd-choice"><strong>Single player</strong><span>Control one dog. Your AI partner follows, fights and holds puzzle pads on command.<br>Arrows / touch · USE to interact · C to swap</span></button><button id="gd-mode-local" class="gd-choice" aria-describedby="gd-local-device-note"><strong>Local two-player</strong><span>Two people, one keyboard, one shared camera.<br>P1: arrows · E use/attack · Shift dash<br>P2: A/D · W jump · F attack · R use<br>P2: S guard · V dash</span></button></div><p id="gd-local-device-note" role="status" aria-live="polite" style="color:#ffd18b;line-height:1.5" hidden></p><button class="gd-cancel" id="gd-mode-cancel">Back to title</button></div>';refreshLocalChoice(el);
    function finish(value){if(done)return false;if(value==='local'&&!localAvailable())return false;done=true;root.removeEventListener('keydown',key,true);el.remove();restoreFocus(focus);resolve(value);return true;}
    function key(e){if(done)return;if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();finish(null);}else trapTab(e,el);}
    root.addEventListener('keydown',key,true);el.querySelector('#gd-mode-solo').onclick=function(){finish('solo');};el.querySelector('#gd-mode-local').onclick=function(){finish('local');};el.querySelector('#gd-mode-cancel').onclick=function(){finish(null);};el.querySelector('button').focus();
  });}
  function load(src){return new Promise(function(resolve,reject){var im=new root.Image(),timer=root.setTimeout(function(){reject(Error('Home scene asset timed out: '+src));},8000);im.onload=function(){root.clearTimeout(timer);resolve(im);};im.onerror=function(){root.clearTimeout(timer);reject(Error('Home scene asset unavailable: '+src));};im.src=src;});}
  function warm(){if(!loading)loading=Promise.all([load('assets/v742/cutscenes/waldo_house.png'),load('assets/v742/cutscenes/waldo_garage.png'),load('assets/handoff/kat.png'),load('assets/handoff/man.png')]).then(function(images){cachedImages=images;return images;}).catch(function(err){loading=null;throw err;});return loading;}
  function drawWorldBack(x,n,F,garageOnly=false){
    if(!garageOnly&&root.TechOpsSceneArt&&root.TechOpsSceneArt.drawBackdrop(x,n,F))return true;
    if(!cachedImages){warm().catch(function(e){root.__goodDogsHomeAssetError=String(e);});return false;}
    var W=x.canvas.width,cam=n.cam||0,blend=garageOnly?1:Math.max(0,Math.min(1,(cam-280)/380));x.save();x.imageSmoothingEnabled=false;x.fillStyle='#0b151b';x.fillRect(0,0,W,F);
    x.drawImage(cachedImages[0],0,42,384,77,-cam*.08,60,W+130,F-90);
    if(blend){x.globalAlpha=blend;x.drawImage(cachedImages[1],0,42,384,77,-cam*.08,60,W+130,F-90);x.globalAlpha=1;}
    var shade=x.createLinearGradient(0,F-145,0,F);shade.addColorStop(0,'#10202400');shade.addColorStop(1,'#101c1c');x.fillStyle=shade;x.fillRect(0,F-145,W,145);
    x.fillStyle='#071216';for(var i=0;i<45;i++){var px=((i*83-cam*1.05)%(W+90)+W+90)%(W+90);x.fillRect(px,F-18-(i%5)*3,2,19+(i%5)*3);}x.restore();root.__goodDogsHomeBackground={source:'existing-house-and-garage',blend:blend,referenceHudCropped:true};return true;
  }
  async function play(){
    var images=await warm();
    return new Promise(function(resolve){
      var focus=root.document.activeElement,el=shell('good-dogs-home-scene'),index=0,raf=0,start=root.performance.now(),done=false,pausedAt=root.document.hidden?start:0,calm=root.matchMedia&&root.matchMedia('(prefers-reduced-motion: reduce)').matches;
      el.setAttribute('aria-labelledby','gd-home-title');el.innerHTML='<div class="gd-story"><canvas width="960" height="420" aria-label="Katrin and Manchez investigate Waldo’s house at night"></canvas><div class="gd-story-copy"><div class="gd-kicker" id="gd-home-place"></div><h1 id="gd-home-title"></h1><p id="gd-home-body"></p><div class="gd-actions"><div class="gd-dots" aria-hidden="true"><i class="gd-dot"></i><i class="gd-dot"></i><i class="gd-dot"></i></div><button id="gd-home-next">Continue</button></div><button class="gd-cancel" id="gd-home-skip">Skip introduction</button></div></div>';
      var canvas=el.querySelector('canvas'),x=canvas.getContext('2d');
      function render(t){
        if(done||root.document.hidden)return;
        var s=shots[index],im=images[s.plate==='house'?0:1],u=calm?0:Math.min(1,(t-start)/8000),pan=s.pan+u*8,W=960,H=420;
        x.imageSmoothingEnabled=false;x.fillStyle='#111823';x.fillRect(0,0,W,H);
        var painted=root.TechOpsSceneArt&&s.plate==='house'&&root.TechOpsSceneArt.drawDomesticCinematic(x,pan);
        if(!painted){
        // Crop away the source HUD and embedded reference characters.
        x.drawImage(im,0,42,384,77,-pan,40,W+60,245);
        var sky=x.createLinearGradient(0,0,0,85);sky.addColorStop(0,'#080e16');sky.addColorStop(1,'#080e1600');x.fillStyle=sky;x.fillRect(0,0,W,85);
        var shade=x.createLinearGradient(0,180,0,H);shade.addColorStop(0,'#0a131800');shade.addColorStop(.5,'#102024');shade.addColorStop(1,'#060e15');x.fillStyle=shade;x.fillRect(0,180,W,H-180);
        x.fillStyle='#be8d4d';x.globalAlpha=.2;x.beginPath();x.moveTo(380-pan,114);x.lineTo(240-pan,340);x.lineTo(570-pan,340);x.closePath();x.fill();x.globalAlpha=1;
        x.fillStyle='#071113';for(var i=0;i<55;i++){var px=(i*83)%W;x.fillRect(px,323+(i%7)*5,2,14+(i%5)*6);}
        }
        // Supplied idle poses only; no rejected walk frames or invented gait.
        [images[2],images[3]].forEach(function(dog,i){var cx=510+i*105-pan*.3;x.globalAlpha=.5;x.fillStyle='#000';x.beginPath();x.ellipse(cx,351,42,8,0,0,Math.PI*2);x.fill();x.globalAlpha=1;x.drawImage(dog,0,0,160,128,cx-80,230,160,128);});
        if(!calm){x.fillStyle='#f5c987';for(var j=0;j<10;j++){x.globalAlpha=.12+(j%3)*.05;x.fillRect((j*127+t*.003)%W,125+(j*29)%180,2,2);}x.globalAlpha=1;}
        x.fillStyle='#061017';x.fillRect(0,395,W,25);root.__goodDogsHomeScene={shot:index+1,place:s.place,asset:painted?'real-frame-house-overpaint':s.plate,generated:!!painted,engineCanvas:true};raf=root.requestAnimationFrame(render);
      }
      function update(){var s=shots[index];el.querySelector('#gd-home-place').textContent='PROLOGUE · '+s.place+' · '+(index+1)+' / '+shots.length;el.querySelector('h1').textContent=s.title;el.querySelector('p').textContent=s.body;el.querySelector('#gd-home-next').textContent=index===2?'Search the property':'Continue';el.querySelectorAll('.gd-dot').forEach(function(d,i){d.classList.toggle('active',i===index);});start=root.performance.now();}
      function finish(skipped){if(done||root.document.hidden)return false;done=true;root.cancelAnimationFrame(raf);root.removeEventListener('keydown',key,true);root.document.removeEventListener('visibilitychange',visibility);el.remove();restoreFocus(focus);root.__goodDogsHomeSceneExit={status:skipped?'USER_SKIPPED':'COMPLETED',shotsViewed:index+1};resolve(true);return true;}
      function next(){if(done||root.document.hidden)return;if(index<2){index++;update();}else finish(false);}
      function visibility(){if(done)return;if(root.document.hidden){pausedAt=root.performance.now();root.cancelAnimationFrame(raf);raf=0;}else{if(pausedAt)start+=root.performance.now()-pausedAt;pausedAt=0;raf=root.requestAnimationFrame(render);}}
      function key(e){if(done||root.document.hidden)return;if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();finish(true);}else trapTab(e,el);}
      root.addEventListener('keydown',key,true);root.document.addEventListener('visibilitychange',visibility);el.querySelector('#gd-home-next').onclick=next;el.querySelector('#gd-home-skip').onclick=function(){finish(true);};el.querySelector('.gd-story-copy').setAttribute('aria-live','polite');el.querySelector('.gd-story-copy').setAttribute('aria-atomic','true');update();el.querySelector('#gd-home-next').focus();if(!root.document.hidden)raf=root.requestAnimationFrame(render);
    });
  }
  root.TechOpsGoodDogsHomeScene={VERSION:1,choose:choose,play:play,shots:shots,drawWorldBack:drawWorldBack,touchPrimary:touchPrimary,localAvailable:localAvailable,localReason:localReason,observeKeyboard:observeKeyboard,refreshLocalChoice:refreshLocalChoice};
})(typeof globalThis!=='undefined'?globalThis:this);
