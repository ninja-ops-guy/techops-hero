#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {sourceIdentity} from './quality_release_receipt.mjs';

const sha256=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const cleanLocalRef=value=>{
  const raw=String(value||'').trim();
  if(!raw||/^(?:https?:|data:|about:|#|\/\/)/i.test(raw))return null;
  return raw.split('#')[0].split('?')[0].replace(/^\.\//,'');
};
export function collectLocalRefs(text){
  const refs=[];
  for(const match of String(text).matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/gi)){
    const ref=cleanLocalRef(match[1]);if(ref)refs.push(ref);
  }
  return [...new Set(refs)];
}
export function collectQuotedScripts(text){
  const refs=[];
  for(const match of String(text).matchAll(/["']([^"'\n]+\.js(?:\?[^"']*)?)["']/g)){
    const ref=cleanLocalRef(match[1]);if(ref)refs.push(ref);
  }
  return [...new Set(refs)];
}
export function buildManifest(paths,{root='.',source}={}){
  const files=[];
  for(const rel of [...new Set(paths)].sort()){
    const normalized=rel.replace(/\\/g,'/');
    if(normalized.includes('..'))throw new Error(`unsafe manifest path: ${normalized}`);
    const absolute=path.resolve(root,normalized),base=path.resolve(root);
    if(!(absolute===base||absolute.startsWith(base+path.sep)))throw new Error(`manifest path escapes root: ${normalized}`);
    if(!fs.existsSync(absolute)||!fs.statSync(absolute).isFile())throw new Error(`runtime manifest references missing file: ${normalized}`);
    const bytes=fs.readFileSync(absolute);
    files.push({path:normalized,size:bytes.length,sha256:sha256(bytes)});
  }
  return {
    schema_version:1,
    source,
    total_files:files.length,
    total_bytes:files.reduce((sum,f)=>sum+f.size,0),
    files
  };
}
function productionRegistryPaths(root='.'){
  const source=fs.readFileSync(path.join(root,'production_asset_registry.js'),'utf8');
  const context={console,Promise,Image:function(){},fetch:null,document:{scripts:[],head:{appendChild(){}},documentElement:{appendChild(){}},createElement(){return{dataset:{},getAttribute(){return'';}};}}};
  context.globalThis=context;vm.createContext(context);vm.runInContext(source,context,{filename:'production_asset_registry.js'});
  const api=context.TechOpsProductionAssets;
  if(!api)throw new Error('production asset registry did not export TechOpsProductionAssets');
  return [
    'production_asset_registry.js',
    ...api.SCRIPT_ASSETS,...api.SOURCE_PARTS,...api.PNG_ASSETS,...api.JPG_ASSETS,...api.WEBP_ASSETS,...api.JSON_ASSETS
  ];
}
export function collectReleaseRuntimePaths(root='.'){
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const bootstrapPath=path.join(root,'production_bootstrap.js');
  const bootstrap=fs.existsSync(bootstrapPath)?fs.readFileSync(bootstrapPath,'utf8'):'';
  const clipManifestPath='assets/cutscenes/good_dogs/campaign_clip_manifest_v2_2_pixel.json';
  const clipManifest=JSON.parse(fs.readFileSync(path.join(root,clipManifestPath),'utf8'));
  const clips=(clipManifest.processed_media||[]).map(item=>`assets/cutscenes/good_dogs/${item.pixel_file}`);
  return [...new Set([
    'index.html',
    ...collectLocalRefs(html),
    ...collectQuotedScripts(bootstrap),
    ...productionRegistryPaths(root),
    clipManifestPath,
    ...clips
  ])].filter(Boolean).sort();
}
async function main(){
  const args=process.argv.slice(2);
  const arg=(name,fallback)=>{const i=args.indexOf(name);return i<0?fallback:args[i+1];};
  const root=path.resolve(arg('--root',process.cwd()));
  const out=path.resolve(arg('--out',path.join(root,'release-asset-manifest.json')));
  const source=sourceIdentity(root);
  const manifest=buildManifest(collectReleaseRuntimePaths(root),{root,source});
  fs.mkdirSync(path.dirname(out),{recursive:true});
  fs.writeFileSync(out,JSON.stringify(manifest,null,2)+'\n');
  console.log(JSON.stringify({status:'written',head:source.head,total_files:manifest.total_files,total_bytes:manifest.total_bytes,out}));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
