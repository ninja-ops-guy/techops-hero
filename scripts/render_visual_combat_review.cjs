/* Offline asset/composition review, NOT browser/gameplay screenshots.
 * Uses the actual scene layer functions and checked-in sprite rectangles.
 * Authoring environment dependencies: @napi-rs/canvas and sharp.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.argv[2]||path.join(root,'art-review/visual-combat'));
async function main(){
 fs.mkdirSync(out,{recursive:true});const source=JSON.parse(fs.readFileSync(path.join(root,'assets/visual-combat/scene-sources.json'))),moves=JSON.parse(fs.readFileSync(path.join(root,'assets/visual-combat/mike-moves.json'))),handoff=JSON.parse(fs.readFileSync(path.join(root,'assets/handoff/atlas.json')));
 const cache=new Map();for(const file of [moves.src,'assets/visual-combat/waldo-props.png',...Object.values(source.plates).map(p=>p.src),...['mike','kat','man','charger'].map(id=>handoff.atlases[id].src)])cache.set(file,await loadImage(path.join(root,file)));
 class LocalImage{set src(value){this.native=cache.get(value);this.complete=!!this.native;this.naturalWidth=this.native?.width||0;this.naturalHeight=this.native?.height||0;}}
 const r={Image:LocalImage,TechOpsNightRuntime:{HOME_X:1560}};r.globalThis=r;vm.runInNewContext(fs.readFileSync(path.join(root,'runtime_scene_art.js'),'utf8'),r);
 const proxy=x=>new Proxy(x,{get(t,k){if(k==='drawImage')return(im,...args)=>t.drawImage(im.native||im,...args);const v=t[k];return typeof v==='function'?v.bind(t):v;},set(t,k,v){t[k]=v;return true;}});
 function actor(x,id,frame,cx,base,height){const a=handoff.atlases[id],f=a.frames[frame],s=height/a.standingHeight;x.imageSmoothingEnabled=false;x.drawImage(cache.get(a.src),...f.rect,cx-f.pivot[0]*s,base-f.pivot[1]*s,f.rect[2]*s,f.rect[3]*s);}
 const platforms=[{x:300,y:330,w:130,h:14},{x:560,y:262,w:110,h:14},{x:820,y:340,w:150,h:14},{x:1100,y:270,w:120,h:14},{x:1380,y:338,w:140,h:14}];
 for(const id of Object.keys(source.plates))for(const cam of [0,752]){
  const canvas=createCanvas(1048,720),x=proxy(canvas.getContext('2d')),n={district:id,cam,platforms:['industrial','longwharf','gooddogs-home'].includes(id)?platforms:[],x:cam+200};if(id==='gooddogs-home')n._v736={m:1};
  r.TechOpsSceneArt.drawBackdrop(x,n);r.TechOpsSceneArt.drawGround(x,n);r.TechOpsSceneArt.drawPlatforms(x,n);r.TechOpsSceneArt.drawPropertyProps(x,n);
  if(id==='gooddogs-home'){actor(x,'kat',0,200,433,65);actor(x,'man',0,285,433,65);}else{actor(x,'charger',0,86-cam,426,65);actor(x,'mike',0,200,433,75);}
  x.fillStyle='#07111be8';x.fillRect(0,678,1048,42);x.fillStyle='#cddbe6';x.font='14px monospace';x.fillText(id.toUpperCase()+' · CAMERA '+cam+' · OFFLINE COMPOSITION FIXTURE — NOT GAMEPLAY CAPTURE',20,704);
  fs.writeFileSync(path.join(out,'composition-'+id+'-'+cam+'.png'),canvas.toBuffer('image/png'));
 }
 const names=Object.keys(moves.moves),atlas=cache.get(moves.src);
 for(let frame=0;frame<4;frame++){
  const canvas=createCanvas(800,1010),x=canvas.getContext('2d');x.fillStyle='#0b121c';x.fillRect(0,0,800,1010);x.fillStyle='#edf2e6';x.font='bold 24px monospace';x.fillText('TECHOPS HERO · NIGHT MIKE',24,40);x.font='13px monospace';x.fillStyle='#a8bbc5';x.fillText('20 authored animation states · four distinct keyframes per state',24,67);
  names.forEach((name,i)=>{const cx=12+(i%4)*197,cy=90+Math.floor(i/4)*176,f=moves.moves[name].frames[frame];x.fillStyle='#15212d';x.fillRect(cx,cy,185,165);x.fillStyle='#efbe71';x.font='12px monospace';x.fillText(name.toUpperCase(),cx+10,cy+20);x.imageSmoothingEnabled=false;x.drawImage(atlas,...f.rect,cx+4,cy+22,176,144);});
  x.fillStyle='#879ba6';x.font='12px monospace';x.fillText('Animation asset preview · not a gameplay capture',24,991);
  fs.writeFileSync(path.join(out,'moves-'+frame+'.png'),canvas.toBuffer('image/png'));
 }
 console.log('Offline composition fixtures and four animation-review frames: '+out);
}
main().catch(e=>{console.error(e);process.exit(1);});
