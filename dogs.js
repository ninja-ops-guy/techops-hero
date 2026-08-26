window.TO_DOGS = (function(){ try { return window.__GK_DOGS || undefined; } catch(e) { return undefined; } })();
/* Production lexical bridge. game.js/night_hooks.js use top-level let/const, so
 * window properties are otherwise absent even though later classic scripts can
 * resolve the identifiers. Publish live getters for production modules.
 *
 * IMPORTANT: this file no longer dynamically loads production guards. Parser-
 * loaded v7.36/v7.37 gameplay wrappers must finish first; production_bootstrap
 * is the sole authority that loads post-parser production modules.
 */
(function(root){
  function bridge(name,getter,setter){try{var d=Object.getOwnPropertyDescriptor(root,name);if(d&&!d.configurable)return;var spec={configurable:true,enumerable:false,get:getter};if(setter)spec.set=setter;Object.defineProperty(root,name,spec);}catch(e){}}
  bridge("S",function(){try{return typeof S!=="undefined"?S:null;}catch(e){return null;}},function(v){try{S=v;}catch(e){}});
  bridge("NM",function(){try{return typeof NM!=="undefined"?NM:null;}catch(e){return null;}},function(v){try{NM=v;}catch(e){}});
  bridge("ctx",function(){try{return typeof ctx!=="undefined"?ctx:null;}catch(e){return null;}});
  bridge("cv",function(){try{return typeof cv!=="undefined"?cv:null;}catch(e){return null;}});
  bridge("keys",function(){try{return typeof keys!=="undefined"?keys:null;}catch(e){return null;}});
  bridge("NM_DISTRICTS",function(){try{return typeof NM_DISTRICTS!=="undefined"?NM_DISTRICTS:null;}catch(e){return null;}});
  bridge("NM_KINDS",function(){try{return typeof NM_KINDS!=="undefined"?NM_KINDS:null;}catch(e){return null;}});
  bridge("NM_FLOOR",function(){try{return typeof NM_FLOOR!=="undefined"?NM_FLOOR:null;}catch(e){return null;}});
  bridge("NM_W",function(){try{return typeof NM_W!=="undefined"?NM_W:null;}catch(e){return null;}});
  try{root.__techopsPreProductionDrawNM=(typeof drawNM==="function"?drawNM:null);}catch(e){}
  try{root.__techopsPreProductionStepNM=(typeof stepNM==="function"?stepNM:null);}catch(e){}
  root.__techopsLexicalBridgeVersion=3;
})(window);
