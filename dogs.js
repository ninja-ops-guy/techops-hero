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
  bridge("save",function(){try{return typeof save==="function"?save:null;}catch(e){return null;}});
  bridge("NM_DISTRICTS",function(){try{return typeof NM_DISTRICTS!=="undefined"?NM_DISTRICTS:null;}catch(e){return null;}});
  bridge("NM_KINDS",function(){try{return typeof NM_KINDS!=="undefined"?NM_KINDS:null;}catch(e){return null;}});
  bridge("NM_FLOOR",function(){try{return typeof NM_FLOOR!=="undefined"?NM_FLOOR:null;}catch(e){return null;}});
  bridge("NM_W",function(){try{return typeof NM_W!=="undefined"?NM_W:null;}catch(e){return null;}});
  try{root.__techopsPreProductionDrawNM=(typeof drawNM==="function"?drawNM:null);}catch(e){}
  try{root.__techopsPreProductionStepNM=(typeof stepNM==="function"?stepNM:null);}catch(e){}
  root.__techopsLexicalBridgeVersion=4;
})(window);

// Native persistence must not depend on the optional portfolio module loading.
// Keep this core in the already parser-loaded native bundle. It does not grant
// story progress; it only owns the native primary-save writer and run identity.
(function(root){
  'use strict';
  if(root.TechOpsLinkedSaveCore)return;
  const ACTIVE='techops:linked:active:v1',WRITER='techops:linked:writer:v1';
  const PROFILE='techops_save',CAMPAIGN='techops_hero_campaign_v1',SNAPSHOT='techops:linked:native:v1';
  const rawSet=Storage.prototype.setItem,rawRemove=Storage.prototype.removeItem;
  let storage=null,installed=false,pending=null;
  try{storage=root.localStorage;}catch(error){root.__seeWorldLinkedCoreError=String(error.message||error);}
  const tabId=root.crypto.randomUUID();
  const valid=x=>!!x&&typeof x==='object'&&!Array.isArray(x)&&/^[a-zA-Z0-9-]{8,80}$/.test(x.runId)&&/^[a-zA-Z0-9-]{3,80}$/.test(x.profileId);
  const same=(a,b)=>!!a&&!!b&&a.profileId===b.profileId&&a.runId===b.runId;
  const read=k=>{const text=storage?.getItem(k);return text?JSON.parse(text):null;};
  const currentId=()=>root.S?.meta?.seeWorldLink;
  function activeId(){try{return read(ACTIVE);}catch{return null;}}
  function standalone(){const s=root.S;return !!(s?.meta?._standaloneMode||s?.meta?._v736?.campaignOrigin==='standalone'||root.__productionDesiredMode==='goodboys'||new URLSearchParams(root.location.search).get('dev')==='1'||root.__TECHOPS_LINKED_PREVIEW__===true);}
  function ownsWriter(){try{const w=read(WRITER);return w?.tabId===tabId&&same(w,currentId());}catch{return false;}}
  function selectedRun(){return valid(currentId())&&same(currentId(),activeId())&&ownsWriter()&&!standalone();}
  function claimWriter(binding){
    if(!storage||!valid(binding))throw Error('A valid native run and available storage are required.');
    rawSet.call(storage,ACTIVE,JSON.stringify(binding));
    rawSet.call(storage,WRITER,JSON.stringify({...binding,tabId}));
  }
  function guardWrite(key,value){
    if(!storage||![PROFILE,CAMPAIGN].includes(key))return;
    const active=read(ACTIVE);if(!active)return;
    const payload=JSON.parse(String(value));
    const binding=key===PROFILE?payload.meta?.seeWorldLink:payload.seeWorldLink;
    const writer=read(WRITER);
    if(!valid(active)||!valid(binding)||!same(binding,active)||!writer||writer.tabId!==tabId||!same(writer,active)||standalone())
      throw Error('Linked save refused: reload and Continue the active run before writing from this tab.');
  }
  function saved(key){
    if(![PROFILE,CAMPAIGN].includes(key))return;
    try{const p=read(PROFILE),c=read(CAMPAIGN);if(pending&&same(p?.meta?.seeWorldLink,pending)&&same(c?.seeWorldLink,pending))pending=null;}catch{}
    root.dispatchEvent(new CustomEvent('techops:linked:native-saved',{detail:{key}}));
  }
  function install(){
    if(installed||!storage)return;
    const campaign=root.TechOpsCampaign;if(!campaign||typeof root.newState!=='function')throw Error('Native save core loaded before game authorities.');
    installed=true;
    // Guard the prototype path too. v7.32 has an older captured setter, so its
    // instance wrapper explicitly calls guardWrite before touching any backup.
    const previousSet=Storage.prototype.setItem;
    Storage.prototype.setItem=function(key,value){
      if(this===storage)guardWrite(key,value);
      const result=previousSet.call(this,key,value);
      if(this===storage)saved(key);
      return result;
    };
    const originalNewState=root.newState;
    root.newState=function(...args){const state=originalNewState.apply(this,args);state.meta.seeWorldLink=pending||{profileId:'local-primary',runId:root.crypto.randomUUID()};return state;};
    root.document.getElementById('btn-start')?.addEventListener('click',()=>{
      if(root.__techopsAlternateStartMode||root.__productionDesiredMode)return;
      pending={profileId:'local-primary',runId:root.crypto.randomUUID()};claimWriter(pending);rawRemove.call(storage,SNAPSHOT);
    },true);
    root.document.getElementById('btn-continue')?.addEventListener('click',()=>{
      try{const p=read(PROFILE);if(valid(p?.meta?.seeWorldLink))claimWriter(p.meta.seeWorldLink);}catch(error){root.__seeWorldLinkedCoreError=String(error.message||error);}
    },true);
    const originalLoad=campaign.load,originalSave=campaign.save,originalReset=campaign.reset;
    campaign.load=function(adapter){
      const result=originalLoad.apply(this,arguments),binding=currentId();
      if(adapter&&adapter!==storage||standalone())return result;
      if(valid(binding)&&same(binding,activeId())){
        if(result.seeWorldLink&&!same(result.seeWorldLink,binding))throw Error('Campaign belongs to another playthrough.');
        if(!result.seeWorldLink&&!storage.getItem(CAMPAIGN))result.seeWorldLink=binding;
      }
      return result;
    };
    campaign.save=function(state,adapter){
      if(adapter&&adapter!==storage)return originalSave.apply(this,arguments);
      if(selectedRun()){
        if(state.seeWorldLink&&!same(state.seeWorldLink,currentId()))throw Error('Refusing cross-run campaign save.');
        const previous=read(CAMPAIGN);
        if(!state.seeWorldLink&&previous&&!previous.seeWorldLink)throw Error('Link this existing run explicitly from Linked Story.');
        state.seeWorldLink=currentId();
      }
      const result=originalSave.call(this,state,adapter);if(result===true)saved(CAMPAIGN);return result;
    };
    campaign.reset=function(adapter){
      const result=originalReset.apply(this,arguments);
      if(!adapter||adapter===storage){rawRemove.call(storage,SNAPSHOT);if(pending)result.seeWorldLink=pending;}
      return result;
    };
    if(valid(currentId())&&!activeId())claimWriter(currentId());
  }
  root.TechOpsLinkedSaveCore=Object.freeze({version:1,install,guardWrite,saved,claimWriter,ownsWriter,selectedRun,standalone,currentId,activeId});
})(window);

// Install core ownership before attempting any optional companion imports.
(function(root){
  if(!root.document)return;
  function loadLinked(){
    try{root.TechOpsLinkedSaveCore.install();}catch(error){root.__seeWorldLinkedCoreError=String(error.message||error);return;}
    import('./see_world_linked_native.mjs').catch(function(error){root.__seeWorldLinkedLoadError=String(error&&error.message||error);});
  }
  if(root.document.readyState==='loading')root.addEventListener('DOMContentLoaded',loadLinked,{once:true});else loadLinked();
})(window);
