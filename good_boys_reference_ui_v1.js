/* TechOps Hero — Good Dogs reference UI v2
 * Live-crawl presentation pass. Keeps gameplay/input ownership in the existing
 * Good Dogs runtimes while enforcing a mobile-safe HUD hierarchy: gameplay first,
 * compact controls second, and exactly one dominant contextual action.
 */
(function(root){
  "use strict";
  if(!root)return;
  try{var prior=root.TechOpsGoodBoysReferenceUI;if(prior&&prior.timer&&root.clearInterval)root.clearInterval(prior.timer);}catch(_){}
  var VERSION=2,style=null,timer=null;
  function active(){try{return !!(root.NM&&root.NM._v736);}catch(e){return false;}}
  function installStyle(){
    try{
      if(!root.document)return false;
      style=root.document.getElementById("good-boys-reference-ui-style");
      if(!style){style=root.document.createElement("style");style.id="good-boys-reference-ui-style";(root.document.head||root.document.documentElement).appendChild(style);}
      style.textContent=[
        "body.good-boys-reference-ui{--gb-panel:rgba(2,10,20,.90);--gb-line:#218dff;--gb-cyan:#3fd7ff;--gb-text:#f3f8ff}",
        "body.good-boys-reference-ui #dpad{left:max(14px,calc(env(safe-area-inset-left) + 14px))!important;bottom:max(18px,calc(env(safe-area-inset-bottom) + 18px))!important;transform:scale(.94)!important;transform-origin:left bottom!important;opacity:.94!important;filter:drop-shadow(0 7px 14px rgba(0,0,0,.48))}",
        "body.good-boys-reference-ui #good-dogs-touch{right:max(12px,calc(env(safe-area-inset-right) + 12px))!important;bottom:max(16px,calc(env(safe-area-inset-bottom) + 16px))!important;width:min(28vw,236px)!important;grid-template-columns:repeat(2,minmax(76px,1fr))!important;grid-template-rows:36px 52px 52px 44px!important;gap:7px!important;padding:8px!important;border:1px solid rgba(70,162,255,.22)!important;border-radius:14px!important;background:linear-gradient(180deg,rgba(4,15,30,.76),rgba(2,8,17,.91))!important;box-shadow:0 12px 30px rgba(0,0,0,.48),inset 0 1px rgba(255,255,255,.05)!important;backdrop-filter:blur(8px)!important}",
        "body.good-boys-reference-ui #good-dogs-touch button{width:auto!important;min-width:0!important;height:auto!important;min-height:0!important;margin:0!important;padding:5px 4px!important;border-width:2px!important;border-radius:11px!important;background:linear-gradient(180deg,rgba(7,29,51,.95),rgba(3,14,27,.96))!important;color:var(--gb-text)!important;font:800 clamp(9px,1.35vw,13px)/1.02 ui-monospace,SFMono-Regular,Menlo,monospace!important;letter-spacing:0!important;text-shadow:0 1px 2px #000!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.05),0 5px 12px rgba(0,0,0,.34)!important;white-space:pre-line!important}",
        "body.good-boys-reference-ui #good-dogs-touch button:active{transform:translateY(1px) scale(.985)!important;filter:brightness(1.24)!important}",
        "body.good-boys-reference-ui #gb-attack{border-color:#38ed7a!important}body.good-boys-reference-ui #gb-boost{border-color:#3b8fff!important}body.good-boys-reference-ui #gb-airdash{border-color:#35d9ff!important}body.good-boys-reference-ui #gb-partner,body.good-boys-reference-ui #gb-sync{border-color:#ff9e3d!important}body.good-boys-reference-ui #gb-swap{border-color:#2ca7ff!important}",
        "body.good-boys-reference-ui #good-dogs-touch #gb-use{width:auto!important;height:auto!important;min-height:0!important;grid-column:1/3!important;border-color:#ffd45c!important;border-radius:11px!important;font-size:clamp(9px,1.35vw,13px)!important;background:linear-gradient(180deg,rgba(22,27,32,.96),rgba(8,14,20,.97))!important}",
        "body.good-boys-reference-ui #good-dogs-touch #gb-use[data-context='1']{box-shadow:0 0 18px rgba(255,212,92,.20),inset 0 0 0 1px rgba(255,255,255,.05)!important}",
        "body.good-boys-reference-ui #good-boys-board-ship{box-sizing:border-box!important;max-width:min(68vw,360px)!important;min-height:48px!important;padding:10px 18px!important;font-size:clamp(11px,2.2vw,16px)!important;letter-spacing:.12em!important;border-width:2px!important;border-radius:12px!important;box-shadow:0 10px 26px rgba(0,0,0,.46)!important}",
        "body.good-boys-reference-ui canvas{image-rendering:auto}",
        "@media(max-width:520px){body.good-boys-reference-ui #good-dogs-touch{right:max(7px,calc(env(safe-area-inset-right) + 7px))!important;bottom:max(10px,calc(env(safe-area-inset-bottom) + 10px))!important;width:min(34vw,176px)!important;grid-template-columns:repeat(2,minmax(58px,1fr))!important;grid-template-rows:30px 43px 43px 36px!important;gap:5px!important;padding:6px!important;border-radius:12px!important}body.good-boys-reference-ui #good-dogs-touch button{border-radius:9px!important;font-size:8px!important;padding:3px 2px!important}body.good-boys-reference-ui #good-dogs-touch #gb-use{font-size:8px!important}body.good-boys-reference-ui #dpad{left:max(6px,calc(env(safe-area-inset-left) + 6px))!important;bottom:max(10px,calc(env(safe-area-inset-bottom) + 10px))!important;transform:scale(.78)!important}body.good-boys-reference-ui #good-boys-board-ship{max-width:54vw!important;min-height:42px!important;padding:8px 12px!important;font-size:11px!important}}",
        "@media(max-height:760px){body.good-boys-reference-ui #good-dogs-touch{bottom:max(7px,calc(env(safe-area-inset-bottom) + 7px))!important;transform:scale(.88)!important;transform-origin:right bottom!important}body.good-boys-reference-ui #dpad{bottom:max(7px,calc(env(safe-area-inset-bottom) + 7px))!important;transform:scale(.72)!important}}",
        "@media(min-width:700px) and (orientation:portrait){body.good-boys-reference-ui #good-dogs-touch{width:min(27vw,250px)!important;grid-template-rows:40px 58px 58px 48px!important}body.good-boys-reference-ui #dpad{transform:scale(1.02)!important}}"
      ].join("");
      return true;
    }catch(e){root.__goodBoysReferenceUIError=String(e&&e.stack||e);return false;}
  }
  function labels(){
    try{
      if(!root.document)return false;
      var map={"gb-swap":"↔\nSWAP","gb-sync":"✦\nSYNC","gb-attack":"✊\nATTACK","gb-boost":"↑\nJUMP","gb-airdash":"➜\nDASH","gb-partner":"🐾\nPARTNER"};
      Object.keys(map).forEach(function(id){var b=root.document.getElementById(id);if(b&&b.dataset.referenceLabel!=="2"){b.textContent=map[id];b.dataset.referenceLabel="2";}});
      var use=root.document.getElementById("gb-use");
      if(use){var contextual=use.dataset.context==="1";var txt=contextual?"E  USE · CELL 118":"E  USE / INTERACT";if(use.textContent!==txt)use.textContent=txt;}
      return true;
    }catch(e){return false;}
  }
  function sync(){
    try{if(root.document&&root.document.body)root.document.body.classList.toggle("good-boys-reference-ui",active());if(active())labels();return true;}catch(e){return false;}
  }
  function apply(){installStyle();sync();return true;}
  apply();try{timer=root.setInterval(sync,180);}catch(e){}
  root.TechOpsGoodBoysReferenceUI={VERSION:VERSION,active:active,apply:apply,labels:labels,timer:timer};
})(typeof globalThis!=="undefined"?globalThis:this);
