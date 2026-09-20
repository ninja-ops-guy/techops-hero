/* TechOps Hero — Good Dogs mobile presentation cleanup v2.
 * Owns responsive styles and the active body class. Cinematic UI guard owns
 * modal HUD visibility; viewport width must never suppress the canonical HUD.
 */
(function(root){
  "use strict";
  if(!root||!root.document||root.TechOpsGoodDogsMobileVisualPolish)return;
  var VERSION=2,style=root.document.createElement("style");
  style.id="good-dogs-mobile-visual-polish";
  style.textContent=`
    body.good-dogs-active #game-wrap:after{content:none!important;display:none!important}
    @media(max-width:700px){
      body.good-dogs-active #hud{pointer-events:none}
      body.good-dogs-active #good-dogs-touch{z-index:12000!important;box-sizing:border-box!important;max-width:100vw!important}
      body.good-dogs-active #good-dogs-touch button{min-height:48px!important;touch-action:manipulation!important}
      body.good-dogs-active #game-wrap{overflow:hidden!important}
    }
  `;
  (root.document.head||root.document.documentElement).appendChild(style);
  function active(){try{return !!(root.NM&&root.NM._v736&&!root.NM._v736.ending);}catch(_){return false;}}
  function apply(){
    var on=active();
    try{root.document.body.classList.toggle("good-dogs-active",on);}catch(_){}
    /* Single-HUD authority replaced the old reference-only HUD. Its visibility
       now follows actual modal state in good_boys_cinematic_ui_guard.js. */
    if(on)root.__goodDogsMobileVisualPolish={active:true,version:VERSION,at:Date.now()};
  }
  var timer=root.setInterval(apply,100);apply();
  root.TechOpsGoodDogsMobileVisualPolish={VERSION:VERSION,apply:apply,timer:timer};
})(typeof globalThis!=="undefined"?globalThis:this);
