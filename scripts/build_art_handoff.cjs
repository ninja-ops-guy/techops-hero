/* Deterministic extraction of the supplied 2026-09-11 handoff. No synthesis.
 * Usage: node scripts/build_art_handoff.cjs /path/to/techops-art-handoff
 * Requires sharp in the authoring environment, never in the shipped game.
 * Source rectangles are reviewed regions, not an inferred uniform sheet grid.
 */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),sharp=require('sharp');
const source=path.resolve(process.argv[2]||''),out=path.resolve('assets/handoff');
if(!fs.existsSync(path.join(source,'manifest.json')))throw Error('Supply the extracted art handoff directory');
fs.mkdirSync(out,{recursive:true});
const sourceManifest=JSON.parse(fs.readFileSync(path.join(source,'manifest.json')));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const dogsX=[[20,280],[310,565],[585,878],[890,1183],[1190,1465],[1475,1755]];
const humansX=[[12,246],[252,508],[520,776],[784,1027],[1030,1285],[1290,1528]];
function regions(xs,ys){return ys.flatMap(([top,bottom])=>xs.map(([left,right])=>[left,top,right-left,bottom-top]));}
const plans={
  kat:{file:'generated/katrin-locomotion.png',rects:regions(dogsX,[[62,331],[353,620],[637,882]]),cell:[160,128],scale:.38,standing:90},
  man:{file:'generated/manchez-locomotion.png',rects:regions(dogsX,[[67,341],[354,620],[635,882]]),cell:[160,128],scale:.38,standing:90},
  mike:{file:'generated/mike-night-traversal.png',rects:regions(humansX,[[35,285],[310,530],[540,790],[797,1017]]),cell:[160,144],scale:.46,standing:100},
  waldo:{file:'generated/waldo-prison-masked.png',rects:regions(humansX,[[15,272],[277,511],[518,756],[765,1019]]),cell:[160,144],scale:.46,standing:100},
  charger:{file:'generated/charger-four-door.png',rects:[[10,165,748,281],[775,163,740,283]],cell:[384,160],scale:.49,standing:128},
  prison:{file:'generated/orbital-prison-props.png',rects:[[7,5,347,330],[402,5,344,330],[752,5,375,344],[1140,25,389,310],[2,450,394,177],[412,381,345,291],[775,382,430,265],[1220,388,306,295],[48,682,259,321],[431,691,193,309],[711,730,414,236],[1220,675,257,337]],cell:[224,192],scale:.50,standing:170}
};
plans.man.rects.splice(12,6,[20,635,260,247],[263,635,309,247],[572,635,326,247],[898,635,318,247],[1220,635,265,247],[1490,635,278,247]);
// Remove only light neutral pixels connected to a crop border. Dark outlines
// protect cream fur, silver chains, windows and enclosed highlights.
function alphaExterior(data,w,h){
 const seen=new Uint8Array(w*h),queue=new Int32Array(w*h);let head=0,tail=0;
 function visit(p){if(seen[p])return;seen[p]=1;const i=p*4,r=data[i],g=data[i+1],b=data[i+2];if(Math.min(r,g,b)>=168&&Math.max(r,g,b)-Math.min(r,g,b)<=18){queue[tail++]=p;data[i+3]=0;}}
 for(let x=0;x<w;x++){visit(x);visit((h-1)*w+x);}for(let y=0;y<h;y++){visit(y*w);visit(y*w+w-1);}
 while(head<tail){const p=queue[head++],x=p%w,y=Math.floor(p/w);if(x)visit(p-1);if(x<w-1)visit(p+1);if(y)visit(p-w);if(y<h-1)visit(p+w);}
 return tail;
}
async function main(){
 const manifest={version:1,sourcePack:'TechOps-Hero-Art-Handoff(1).zip',generatedThisPass:false,atlases:{},excluded:{dogWalk:'Near-repeated poses do not establish alternating gait; original idle hold retained below run speed.',mikeDash:'Extended fist reads as punch; no traversal binding.',waldoFall:'Airborne kick excluded from falling.',pairedBlueJacket:'Identity unresolved; no assignment.',unmaskedWaldo:'Existing everyday Waldo remains authority; prison mask never replaced.'}};
 for(const [id,plan] of Object.entries(plans)){
  const bytes=fs.readFileSync(path.join(source,plan.file)),expected=sourceManifest.assets.find(a=>a.file===plan.file);
  if(hash(bytes)!==expected.sha256)throw Error('Source digest mismatch: '+plan.file);
  const [cw,ch]=plan.cell,frames=[],composite=[];
  for(let i=0;i<plan.rects.length;i++){
   const [left,top,width,height]=plan.rects[i],raw=await sharp(bytes).extract({left,top,width,height}).ensureAlpha().raw().toBuffer();
   const removed=alphaExterior(raw,width,height);let l=width,t=height,r=-1,b=-1;
   for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(raw[(y*width+x)*4+3]){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
   if(r<l)throw Error('Empty source region '+id+':'+i);
   const w=Math.max(1,Math.round((r-l+1)*plan.scale)),h=Math.max(1,Math.round((b-t+1)*plan.scale));
   if(w>cw-4||h>ch-4)throw Error('Clipped frame '+id+':'+i);
   const png=await sharp(raw,{raw:{width,height,channels:4}}).extract({left:l,top:t,width:r-l+1,height:b-t+1}).resize(w,h,{kernel:'nearest'}).png().toBuffer();
   const x=i%6*cw,y=Math.floor(i/6)*ch,px=Math.round((cw-w)/2),py=ch-h-4;
   composite.push({input:png,left:x+px,top:y+py});
   frames.push({rect:[x,y,cw,ch],sourceRect:[left+l,top+t,r-l+1,b-t+1],pivot:[cw/2,ch-4],opaqueBounds:[px,py,w,h],removedBackgroundPixels:removed});
  }
  const atlas=await sharp({create:{width:6*cw,height:Math.ceil(frames.length/6)*ch,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(composite).png({palette:true,colours:128,dither:0}).toBuffer();
  fs.writeFileSync(path.join(out,id+'.png'),atlas);
  manifest.atlases[id]={src:'assets/handoff/'+id+'.png',sourceFile:plan.file,sourceSha256:hash(bytes),sha256:hash(atlas),width:6*cw,height:Math.ceil(frames.length/6)*ch,standingHeight:plan.standing,frames};
 }
 fs.writeFileSync(path.join(out,'atlas.json'),JSON.stringify(manifest,null,2)+'\n');
 fs.writeFileSync(path.resolve('ART_HANDOFF_SOURCE.json'),JSON.stringify(sourceManifest,null,2)+'\n');
 console.log('Extracted',Object.keys(plans).length,'atlases; original files unchanged.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
