/* TechOps Hero — Good Dogs reference UI v1
 * Presentation-only pass derived from the approved mobile gameplay reference.
 * Keeps gameplay/input ownership in the existing Good Dogs runtimes while making
 * the touch experience read like a composed game HUD rather than floating debug controls.
 */
(function(root){
  "use strict";
  if(!root||root.TechOpsGoodBoysReferenceUI)return;
  var VERSION=1,style=null,timer=null;
  function active(){try{return !!(root.NM&&root.NM._v736);}catch(e){return false;}}
  function installStyle(){
    try{
      if(!root.document)return false;
      style=root.document.getElementById("good-boys-reference-ui-style");
      if(!style){style=root.document.createElement("style");style.id="good-boys-reference-ui-style";(root.document.head||root.document.documentElement).appendChild(style);}
      style.textContent=[
        "body.good-boys-reference-ui{--gb-panel:rgba(2,10,20,.93);--gb-line:#218dff;--gb-cyan:#3fd7ff;--gb-text:#f3f8ff}",
        "body.good-boys-reference-ui #dpad{left:max(18px,calc(env(safe-area-inset-left) + 18px))!important;bottom:max(34px,calc(env(safe-area-inset-bottom) + 34px))!important;transform:scale(1.16)!important;transform-origin:left bottom!important;opacity:1!important;filter:drop-shadow(0 8px 18px rgba(0,0,0,.55))}",
        "body.good-boys-reference-ui #good-dogs-touch{right:max(18px,calc(env(safe-area-inset-right) + 18px))!important;bottom:max(30px,calc(env(safe-area-inset-bottom) + 30px))!important;width:min(31vw,300px)!important;grid-template-columns:repeat(2,minmax(92px,1fr))!important;grid-template-rows:58px 82px 82px 70px!important;gap:10px!important;padding:12px!important;border:1px solid rgba(70,162,255,.24)!important;border-radius:20px!important;background:linear-gradient(180deg,rgba(4,15,30,.82),rgba(2,8,17,.96))!important;box-shadow:0 18px 40px rgba(0,0,0,.56),inset 0 1px rgba(255,255,255,.05)!important;backdrop-filter:blur(10px)!important}",
        "body.good-boys-reference-ui #good-dogs-touch button{width:auto!important;min-width:0!important;height:auto!important;min-height:0!important;margin:0!important;padding:8px 6px!important;border-width:3px!important;border-radius:16px!important;background:linear-gradient(180deg,rgba(7,29,51,.98),rgba(3,14,27,.98))!important;color:var(--gb-text)!important;font:800 clamp(10px,1.75vw,16px)/1.08 ui-monospace,SFMono-Regular,Menlo,monospace!important;letter-spacing:.1px!important;text-shadow:0 1px 2px #000!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.06),0 7px 16px rgba(0,0,0,.4)!important;white-space:pre-line!important}",
        "body.good-boys-reference-ui #good-dogs-touch button:active{transform:translateY(2px) scale(.98)!important;filter:brightness(1.28)!important}",
        "body.good-boys-reference-ui #gb-swap,body.good-boys-reference-ui #gb-sync{height:auto!important;min-height:0!important;border-radius:15px!important;font-size:clamp(10px,1.55vw,14px)!important}",
        "body.good-boys-reference-ui #gb-attack{border-color:#38ed7a!important;box-shadow:inset 0 0 0 1px rgba(56,237,122,.08),0 0 16px rgba(56,237,122,.10),0 7px 16px rgba(0,0,0,.4)!important}",
        "body.good-boys-reference-ui #gb-boost{border-color:#3b8fff!important}",
        "body.good-boys-reference-ui #gb-airdash{border-color:#35d9ff!important}",
        "body.good-boys-reference-ui #gb-partner{border-color:#ff9e3d!important}",
        "body.good-boys-reference-ui #gb-swap{border-color:#2ca7ff!important}",
        "body.good-boys-reference-ui #gb-sync{border-color:#ff9e3d!important}",
        "body.good-boys-reference-ui #good-dogs-touch #gb-use{width:auto!important;height:auto!important;min-height:0!important;grid-column:1/3!important;border-color:#ffd45c!important;border-radius:16px!important;font-size:clamp(11px,1.7vw,16px)!important;background:linear-gradient(180deg,rgba(22,27,32,.98),rgba(8,14,20,.98))!important}",
        "body.good-boys-reference-ui #good-dogs-touch #gb-use[data-context='1']{box-shadow:0 0 22px rgba(255,212,92,.22),inset 0 0 0 1px rgba(255,255,255,.06)!important}",
        "body.good-boys-reference-ui canvas{image-rendering:auto}",
        "@media(max-width:520px){body.good-boys-reference-ui #good-dogs-touch{right:max(10px,calc(env(safe-area-inset-right) + 10px))!important;bottom:max(22px,calc(env(safe-area-inset-bottom) + 22px))!important;width:min(40vw,210px)!important;grid-template-columns:repeat(2,minmax(72px,1fr))!important;grid-template-rows:44px 64px 64px 54px!important;gap:7px!important;padding:8px!important;border-radius:15px!important}body.good-boys-reference-ui #good-dogs-touch button{border-width:2px!important;border-radius:12px!important;font-size:9px!important;padding:5px 3px!important}body.good-boys-reference-ui #good-dogs-touch #gb-use{font-size:9px!important}body.good-boys-reference-ui #dpad{left:max(9px,calc(env(safe-area-inset-left) + 9px))!important;bottom:max(22px,calc(env(safe-area-inset-bottom) + 22px))!important;transform:scale(.92)!important}}",
        "@media(min-width:700px) and (orientation:portrait){body.good-boys-reference-ui #good-dogs-touch{width:min(30vw,310px)!important;grid-template-rows:62px 86px 86px 72px!important}body.good-boys-reference-ui #dpad{transform:scale(1.28)!important}}"
      ].join("");
      return true;
    }catch(e){root.__goodBoysReferenceUIError=String(e&&e.stack||e);return false;}
  }
  function labels(){
    try{
      if(!root.document)return false;
      var map={
        "gb-swap":"↔\nSWAP",
        "gb-sync":"✦\nSYNC",
        "gb-attack":"✊\nATTACK",
        "gb-boost":"↑\nJUMP",
        "gb-airdash":"➜\nDASH",
        "gb-partner":"🐾\nPARTNER"
      };
      Object.keys(map).forEach(function(id){var b=root.document.getElementById(id);if(b&&b.dataset.referenceLabel!=="1"){b.textContent=map[id];b.dataset.referenceLabel="1";}});
      var use=root.document.getElementById("gb-use");
      if(use){var contextual=use.dataset.context==="1";var txt=contextual?"E   USE · CELL 118":"E   USE / INTERACT";if(use.textContent!==txt)use.textContent=txt;}
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
