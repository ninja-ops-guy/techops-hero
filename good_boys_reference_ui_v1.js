/* TechOps Hero — Good Dogs reference UI v3
 * Presentation-only authority derived from the approved portrait gameplay reference.
 * Gameplay/progression/input remain owned by existing Good Dogs runtimes.
 */
(function(root){
  "use strict";
  if(!root)return;
  try{var old=root.TechOpsGoodBoysReferenceUI;if(old&&old.timer&&root.clearInterval)root.clearInterval(old.timer);}catch(_){}
  var VERSION=3,style=null,timer=null,hud=null,lastSync=-Infinity,lastWorld=null,lastMode=null,lastBlocked=null;
  // The native compact HUD remains the sole production HUD. This skin only
  // styles its existing controls. A standalone fallback reads the same canon.
  function world(){try{return typeof NM!=="undefined"?NM:root.NM||null;}catch(e){return root.NM||null;}}
  function state(){try{return typeof S!=="undefined"?S:root.S||null;}catch(e){return root.S||null;}}
  function cs(){var n=world();return n&&n._v736||null;}
  function active(){var n=world(),s=state();return !!(n&&cs()&&s&&(s.nightMode===n||s.nightMode===true)&&!s.gameOver);}
  function mission(){var c=cs(),s=state(),m=c&&Number(c.m),saved=s&&s.meta&&s.meta._v736;return active()&&Number.isInteger(m)&&m>=1&&m<=8&&(!saved||Number(saved.m)===m)?m:0;}
  function nativeHud(){return !!(root.TechOpsGoodBoysHudLite&&typeof root.TechOpsGoodBoysHudLite.drawHud==='function');}
  function blocked(){var n=world(),s=state(),d=root.TechOpsPresentationDirector,g=root.TechOpsGameplayExperience;return !mission()||!!(s&&(s.inDialog||s.inBattle||s.paused)||n&&n.drive||cs()&&cs().ending||root.__goodBoysHideHud||root.document&&root.document.hidden)||(g&&g.blocked?g.blocked(n):!!(d&&d.isBlocking&&d.isBlocking()));}
  function hp(who){
    var c=cs(),ch=c&&c.chars&&c.chars[who]||{},n=world(),max=Number(ch.maxHp),value;
    max=Number.isFinite(max)&&max>0?max:(who==='manchez'?120:100);
    value=c&&c.active===who&&n?Number(n.hp):Number(ch.hp);
    // Zero and missing telemetry are never displayed as a healed partner.
    if(ch.downed||ch.out||!Number.isFinite(value))value=0;
    return [Math.max(0,Math.min(max,value)),max];
  }
  function installStyle(){try{if(!root.document)return false;style=root.document.getElementById("good-boys-reference-ui-style")||root.document.createElement("style");style.id="good-boys-reference-ui-style";style.textContent=[
    "body.good-boys-reference-ui{--gbp:rgba(2,10,21,.94);--gbb:#278fff;--gbc:#47cfff;--gbt:#eef8ff;--gbo:#ff9d3e}",
    "#gb-ref-hud{display:none;position:fixed;inset:0;z-index:10048;pointer-events:none;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--gbt);text-shadow:0 2px 3px #000}",
    "body.good-boys-reference-ui #gb-ref-hud{display:block}",
    "#gb-ref-objective,#gb-ref-location,#gb-ref-interact,#gb-ref-status{position:absolute;background:linear-gradient(180deg,rgba(4,18,35,.92),rgba(2,9,19,.96));border:2px solid rgba(55,156,255,.88);box-shadow:0 10px 26px #0009,inset 0 1px rgba(255,255,255,.07);backdrop-filter:blur(8px)}",
    "#gb-ref-objective{left:max(18px,calc(env(safe-area-inset-left) + 18px));top:max(22px,calc(env(safe-area-inset-top) + 22px));width:min(32vw,320px);padding:13px 15px;border-radius:12px;clip-path:polygon(0 0,94% 0,100% 14%,100% 100%,0 100%)}",
    "#gb-ref-objective b{display:block;color:#53b8ff;font-size:clamp(13px,1.8vw,20px);letter-spacing:1.5px;margin-bottom:8px}#gb-ref-objective span{display:block;font-size:clamp(10px,1.3vw,14px);line-height:1.45;color:#e7f4ff}#gb-ref-objective span:before{content:'◯';color:#65aaff;margin-right:8px}#gb-ref-objective span.current:before{content:'◉';color:#54ffb0}",
    "#gb-ref-location{right:max(18px,calc(env(safe-area-inset-right) + 18px));top:max(22px,calc(env(safe-area-inset-top) + 22px));width:min(20vw,190px);padding:10px;border-radius:12px;text-align:center}#gb-ref-location b{display:block;color:#52c8ff;letter-spacing:1.5px;font-size:clamp(10px,1.5vw,15px)}#gb-ref-map{height:72px;margin-top:7px;border:1px solid #28506e;background:linear-gradient(90deg,transparent 48%,#23415a55 49%,#23415a55 51%,transparent 52%),linear-gradient(0deg,transparent 48%,#23415a55 49%,#23415a55 51%,transparent 52%),#03101d;position:relative}#gb-ref-map:after{content:'▲';position:absolute;left:48%;top:38%;color:#55ffb0;font-size:18px;filter:drop-shadow(0 0 6px #55ffb0)}",
    "#gb-ref-interact{left:50%;bottom:31%;transform:translateX(-50%);min-width:min(36vw,330px);padding:11px 18px;border-radius:15px;text-align:center;font-weight:900;font-size:clamp(11px,1.5vw,16px);opacity:0;transition:opacity .16s,transform .16s;border-color:#4bc6ff}#gb-ref-interact.show{opacity:1;transform:translateX(-50%) translateY(-3px)}#gb-ref-interact kbd{display:inline-grid;place-items:center;border:2px solid #e9fbff;border-radius:7px;padding:3px 9px;margin-right:10px;font:900 15px monospace}",
    "#gb-ref-status{left:50%;bottom:max(18px,calc(env(safe-area-inset-bottom) + 18px));transform:translateX(-50%);width:min(42vw,420px);display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:8px;border-radius:12px}#gb-ref-status .dog{min-width:0;padding:5px 8px;border:1px solid #244b69;border-radius:7px;background:#020b14cc}#gb-ref-status b{display:flex;justify-content:space-between;color:#54baff;font-size:11px}.gb-hp{height:8px;margin-top:5px;background:#14212c;border-radius:4px;overflow:hidden}.gb-hp i{display:block;height:100%;background:#39ef7d;transition:width .2s}",
    "body.good-boys-reference-ui #dpad{left:max(18px,calc(env(safe-area-inset-left) + 18px))!important;bottom:max(38px,calc(env(safe-area-inset-bottom) + 38px))!important;transform:scale(1.18)!important;transform-origin:left bottom!important;opacity:1!important;filter:drop-shadow(0 8px 18px #000a)}",
    "body.good-boys-reference-ui #good-dogs-touch{right:max(18px,calc(env(safe-area-inset-right) + 18px))!important;bottom:max(28px,calc(env(safe-area-inset-bottom) + 28px))!important;width:min(29vw,286px)!important;grid-template-columns:repeat(2,minmax(88px,1fr))!important;grid-template-rows:52px 74px 74px 62px!important;gap:9px!important;padding:10px!important;border:1px solid #2c80bb66!important;border-radius:18px!important;background:linear-gradient(180deg,#041426e8,#020a14f5)!important;box-shadow:0 16px 38px #000a!important;backdrop-filter:blur(10px)!important}",
    "body.good-boys-reference-ui #good-dogs-touch button{width:auto!important;min-width:0!important;height:auto!important;min-height:0!important;margin:0!important;padding:7px 5px!important;border-width:3px!important;border-radius:14px!important;background:linear-gradient(180deg,#071d33fa,#030e1bfa)!important;color:#f3f8ff!important;font:900 clamp(9px,1.55vw,14px)/1.05 ui-monospace,SFMono-Regular,Menlo,monospace!important;white-space:pre-line!important;box-shadow:inset 0 0 0 1px #ffffff10,0 6px 15px #0007!important}",
    "body.good-boys-reference-ui #gb-attack{border-color:#38ed7a!important}body.good-boys-reference-ui #gb-boost{border-color:#3b8fff!important}body.good-boys-reference-ui #gb-airdash{border-color:#35d9ff!important}body.good-boys-reference-ui #gb-partner,body.good-boys-reference-ui #gb-sync{border-color:#ff9e3d!important}body.good-boys-reference-ui #gb-swap{border-color:#2ca7ff!important}body.good-boys-reference-ui #good-dogs-touch #gb-use{width:auto!important;height:auto!important;min-height:0!important;grid-column:1/3!important;border-color:#ffd45c!important;border-radius:14px!important}",
    "body.good-boys-reference-ui #good-dogs-touch button:active{transform:translateY(2px) scale(.98)!important;filter:brightness(1.3)!important}",
    "@media(max-width:560px){#gb-ref-objective{width:42vw;padding:9px 10px}#gb-ref-location{width:25vw;padding:7px}#gb-ref-map{height:48px}#gb-ref-status{width:46vw;bottom:12px;padding:5px}#gb-ref-interact{bottom:29%;min-width:42vw;padding:8px 11px}body.good-boys-reference-ui #good-dogs-touch{right:8px!important;bottom:14px!important;width:40vw!important;grid-template-columns:repeat(2,minmax(62px,1fr))!important;grid-template-rows:38px 55px 55px 45px!important;gap:6px!important;padding:7px!important}body.good-boys-reference-ui #good-dogs-touch button{font-size:8px!important;border-width:2px!important}body.good-boys-reference-ui #dpad{left:8px!important;bottom:18px!important;transform:scale(.94)!important}}",
    "@media(min-width:700px) and (orientation:portrait){#gb-ref-objective{width:31vw}#gb-ref-location{width:18vw}#gb-ref-interact{bottom:35%}#gb-ref-status{bottom:22px}body.good-boys-reference-ui #dpad{transform:scale(1.28)!important}}"
    ,"@media(prefers-reduced-motion:reduce){#gb-ref-hud *,body.good-boys-reference-ui #good-dogs-touch button{transition:none!important;animation:none!important}}"
    ,"@media(max-height:500px) and (orientation:landscape){body.good-boys-reference-ui #good-dogs-touch{right:max(8px,env(safe-area-inset-right))!important;bottom:max(8px,env(safe-area-inset-bottom))!important;width:196px!important;grid-template-columns:repeat(3,minmax(54px,1fr))!important;grid-template-rows:repeat(3,44px)!important;gap:4px!important;padding:5px!important}body.good-boys-reference-ui #good-dogs-touch button{grid-column:auto!important;grid-row:auto!important;min-height:44px!important;font-size:9px!important}body.good-boys-reference-ui #good-dogs-touch #gb-use{grid-column:1/-1!important}body.good-boys-reference-ui #dpad{bottom:max(8px,env(safe-area-inset-bottom))!important;transform:scale(.85)!important}}"
  ].join("");if(!style.parentNode)(root.document.head||root.document.documentElement).appendChild(style);return true;}catch(e){root.__goodBoysReferenceUIError=String(e&&e.stack||e);return false;}}
  function hideHud(){var el=root.document&&root.document.getElementById('gb-ref-hud');if(el){el.style.display='none';el.setAttribute&&el.setAttribute('aria-hidden','true');}return false;}
  function ensureHud(){try{
    if(!root.document||!root.document.body||nativeHud()||blocked())return hideHud();
    hud=root.document.getElementById('gb-ref-hud');
    if(!hud){hud=root.document.createElement('div');hud.id='gb-ref-hud';hud.innerHTML='<section id="gb-ref-objective"><b></b><span class="current"></span><span></span><span></span></section><section id="gb-ref-location"><b></b></section><div id="gb-ref-interact"><kbd>E</kbd><span>USE / INTERACT</span></div><section id="gb-ref-status"><div class="dog" data-dog="katrin"><b><span>KATRIN</span><span class="num"></span></b><div class="gb-hp"><i></i></div></div><div class="dog" data-dog="manchez"><b><span>MANCHEZ</span><span class="num"></span></b><div class="gb-hp"><i></i></div></div></section>';root.document.body.appendChild(hud);}
    // Retired v2's decorative map is not a navigable minimap.
    var oldMap=root.document.getElementById('gb-ref-map');if(oldMap)oldMap.style.display='none';
    hud.style.display='block';hud.setAttribute('aria-hidden','false');return true;
  }catch(e){return false;}}
  function labels(){try{var map={"gb-swap":"↔\nSWAP","gb-sync":"✦\nSYNC","gb-attack":"✊\nATTACK","gb-boost":"↑\nJUMP","gb-airdash":"➜\nDASH","gb-partner":"🐾\nPARTNER"};Object.keys(map).forEach(function(id){var b=root.document.getElementById(id);if(b){b.textContent=map[id];b.dataset.referenceLabel="3";}});/* gb-use is owned by the current mission: preserve its label, disabled state and handler. */}catch(e){} }
  function updateHud(){try{
    if(nativeHud()||blocked())return hideHud();if(!ensureHud())return false;
    var m=mission(),r=root.TechOpsLevelRegistry,row=r&&r.goodDogsMission&&r.goodDogsMission(m),g=root.TechOpsGameplayExperience,guide=g&&g.objective&&g.objective(world());
    if(!row)return hideHud();
    var obj=root.document.getElementById('gb-ref-objective'),loc=root.document.getElementById('gb-ref-location');
    if(obj){obj.querySelector('b').textContent=row.name;var ss=obj.querySelectorAll('span');ss[0].textContent=guide?guide.text:row.objective;ss[1].textContent=guide?guide.detail:'';ss[2].textContent='';}
    if(loc)loc.querySelector('b').textContent='GOOD DOGS · M'+m;
    ['katrin','manchez'].forEach(function(w){var v=hp(w),el=hud.querySelector('[data-dog="'+w+'"]');if(el){el.querySelector('.num').textContent=Math.round(v[0])+'/'+Math.round(v[1]);el.querySelector('i').style.width=(100*v[0]/v[1])+'%';}});
    var use=root.document.getElementById('gb-use'),inter=root.document.getElementById('gb-ref-interact'),context=!!(use&&!use.disabled&&use.dataset.context==='1');
    if(inter){inter.classList.toggle('show',context);inter.querySelector('span').textContent=context?use.textContent:'';}
    return true;
  }catch(e){return hideHud();}}
  function sync(at){try{
    var n=world(),on=active(),pause=blocked();
    // The game's existing frame owns scheduling; mode changes bypass throttling.
    if(Number.isFinite(at)&&at>=lastSync&&at-lastSync<120&&n===lastWorld&&on===lastMode&&pause===lastBlocked)return true;
    lastSync=Number.isFinite(at)?at:-Infinity;lastWorld=n;lastMode=on;lastBlocked=pause;
    if(root.document&&root.document.body)root.document.body.classList.toggle('good-boys-reference-ui',on);
    if(on){labels();updateHud();}else hideHud();return true;
  }catch(e){return false;}}
  function apply(){installStyle();ensureHud();sync();return true;}
  apply(); // No independent interval: game.js calls sync at the canonical frame seam.
  root.TechOpsGoodBoysReferenceUI={VERSION:VERSION,active:active,sync:sync,hp:hp,nativeHud:nativeHud,blocked:blocked,apply:apply,labels:labels,updateHud:updateHud,timer:timer};
})(typeof globalThis!=="undefined"?globalThis:this);
