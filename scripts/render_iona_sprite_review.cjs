// Offline sprite composition at gameplay scale, not a browser capture.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const root=path.resolve(__dirname,'..'),out=path.join(root,'art-review/iona-nightwalker');
(async()=>{
 const atlas=await loadImage(path.join(root,'assets/iona-nightwalker/iona-band-v1.webp'));
 const reference=await loadImage(path.join(root,'assets/iona-nightwalker/source/band-reference.webp'));
 const runtime={};runtime.globalThis=runtime;vm.runInNewContext(fs.readFileSync(path.join(root,'iona_nightwalker.js'),'utf8'),runtime);
 const c=createCanvas(1152,820),x=c.getContext('2d');
 x.fillStyle='#0c1520';x.fillRect(0,0,c.width,c.height);
 x.fillStyle='#e2edf1';x.font='bold 25px sans-serif';x.fillText('IONA / NIGHTWALKER',24,40);
 x.font='14px sans-serif';x.fillStyle='#9eb4bf';x.fillText('Band reference → 24 gameplay key poses · offline review, not gameplay capture',24,69);
 x.drawImage(reference,0,0,256,256,960,0,160,160);
 const labels=['idle','walk 1','walk 2','walk 3','walk 4','jump','guard','jab','cross','uppercut','low punch','kick','rising kick','sweep','launcher','air punch','air kick','air slam','dash','grab','throw','rising throw','hurt','down'];
 labels.forEach((label,i)=>{
  const left=(i%6)*192,top=160+Math.floor(i/6)*160,s=75/220;
  x.fillStyle=Math.floor(i/6)%2?'#d3e1e4':'#152635';x.fillRect(left+4,top+4,184,152);
  const f=runtime.TechOpsIonaNightwalker.frame(i);
  x.imageSmoothingEnabled=false;x.drawImage(atlas,...f.rect,left+96-f.pivot[0]*s,top+114-f.pivot[1]*s,f.rect[2]*s,f.rect[3]*s);
  x.fillStyle=Math.floor(i/6)%2?'#233647':'#d5e5ec';x.font='13px monospace';x.fillText(label,left+12,top+143);
 });
 fs.writeFileSync(path.join(out,'gameplay-scale-review.png'),c.toBuffer('image/png'));
 console.log('Wrote offline review at 75px standing height.');
})().catch(e=>{console.error(e);process.exitCode=1;});
