/* M5-only presentation entry. Called directly by the existing compositor.
 * No frame loop, input hook, damage, campaign writes, or audio owner. */
(function(root){
 'use strict';if(root.TechOpsGoodDogs3D)return;
 var engine=null,loading=null,failed=false,lastActive=false;
 var base=root.document&&root.document.currentScript?new URL('assets/good-dogs-3d/',root.document.currentScript.src):null;
 function eligible(){var n=root.NM,s=root.S,c=n&&n._v736,m=s&&s.meta&&s.meta._v736,d=root.TechOpsPresentationDirector;return !!(c&&m&&Number(c.m)===5&&Number(m.m)===5&&m.k&&s.nightMode===n&&!c.ending&&!s.inDialog&&!s.inBattle&&!s.gameOver&&!(d&&d.isBlocking&&d.isBlocking('gooddogs')));}
 function prepare(){if(loading||engine||failed||!base)return loading;loading=import(new URL('level.mjs?v=20260913-grounded-r1',base).href).then(function(m){return m.createLevel({assetBase:base});}).then(function(e){engine=e;return e;}).catch(function(e){failed=true;root.__goodDogs3DError=String(e&&e.message||e);return null;});return loading;}
 function draw(ctx,n){lastActive=false;
  if(!eligible()||!ctx){lastActive=false;return false;}if(!engine){prepare();return false;}
  try{if(!engine.draw(n,ctx.canvas.width,ctx.canvas.height))return false;ctx.save();try{ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.drawImage(engine.canvas,0,0,ctx.canvas.width,ctx.canvas.height);}finally{ctx.restore();}lastActive=true;return true;}
  catch(e){failed=true;root.__goodDogs3DError=String(e&&e.message||e);engine.dispose();engine=null;return false;}
 }
 root.TechOpsGoodDogs3D={eligible:eligible,prepare:prepare,draw:draw,setView:function(v){if(engine)engine.setView(v);},cycleView:function(){if(!engine)return;const views=['third','first','crew'];engine.setView(views[(views.indexOf(engine.view)+1)%views.length]);},setQuality:function(v){return engine?engine.setQuality(v):Promise.resolve();},status:function(){return {view:engine&&engine.view,quality:engine&&engine.quality,ready:!!engine,failed:failed,active:lastActive,mission:5,ownsStory:false,ownsLoop:false};}};
})(typeof globalThis!=='undefined'?globalThis:this);
