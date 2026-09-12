// Review-only derivatives. Requires authoring-environment sharp; no runtime dependency.
// Run from this directory: node build.cjs. Never writes to assets/handoff.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),sharp=require('sharp');
process.chdir(__dirname);
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const plans={
 kat:{source:'source/katrin-v1.png',scale:.35,anchors:[215,660,1104,1547],grounds:[374,819],rects:[[61,110,297,274],[520,107,305,277],[961,107,304,277],[1406,100,305,280],[53,558,308,270],[519,559,294,270],[964,556,305,273],[1399,559,303,270]]},
 man:{source:'source/manchez-alpha-v2.png',scale:.33,anchors:[232,675,1117,1560],grounds:[394,799],rects:[[74,110,316,295],[515,109,319,293],[945,109,331,293],[1399,109,322,293],[67,514,323,295],[511,515,323,294],[954,514,322,295],[1383,515,337,294]]}
};
(async()=>{
 fs.mkdirSync('frames',{recursive:true});
 const manifest={version:1,status:'QUARANTINED',runtimeApproved:false,tool:'built-in image_gen',frameCount:16,contactEvents:[],notes:'Distinct image bytes are not proof of valid gait. Preserve the live walk fallback. Alpha is preserved; no synthesized poses, recoloring or matte repair in this build.',actors:{}};
 for(const [id,p] of Object.entries(plans)){
  const bytes=fs.readFileSync(p.source),meta=await sharp(bytes).metadata();
  if(!meta.hasAlpha)throw Error('Source lacks alpha: '+p.source);
  const frames=[],composite=[];
  for(let i=0;i<8;i++){
   const [left,top,width,height]=p.rects[i],w=Math.round(width*p.scale),h=Math.round(height*p.scale);
   const x=Math.round(80+(left-p.anchors[i%4])*p.scale),y=Math.round(124+(top-p.grounds[Math.floor(i/4)])*p.scale);
   if(x<0||y<0||x+w>160||y+h>128)throw Error('Clipped review crop: '+id+i);
   const crop=await sharp(bytes).extract({left,top,width,height}).resize(w,h,{kernel:'nearest'}).png().toBuffer();
   const frame=await sharp({create:{width:160,height:128,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite([{input:crop,left:x,top:y}]).png().toBuffer();
   const src='frames/'+id+'-'+String(i+1).padStart(2,'0')+'.png';fs.writeFileSync(src,frame);
   frames.push({index:i+1,src,sourceRect:p.rects[i],sourceAnchor:[p.anchors[i%4],p.grounds[Math.floor(i/4)]],pivot:[80,124],sha256:hash(frame)});
   composite.push({input:frame,left:i%4*160,top:Math.floor(i/4)*128});
  }
  const atlas=await sharp({create:{width:640,height:256,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(composite).png().toBuffer();
  fs.writeFileSync(id+'-review.png',atlas);
  manifest.actors[id]={source:p.source,sourceSha256:hash(bytes),sourceSize:[meta.width,meta.height],sourceHasAlpha:true,scale:p.scale,atlas:id+'-review.png',atlasSha256:hash(atlas),frames};
 }
 fs.writeFileSync('manifest.json',JSON.stringify(manifest,null,2)+'\n');
 console.log('16 review frames written; QUARANTINED, no runtime binding.');
})().catch(e=>{console.error(e);process.exitCode=1;});
