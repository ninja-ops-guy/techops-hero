'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const read=p=>fs.readFileSync(p,'utf8'),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const manifest=JSON.parse(read('assets/visual-combat/mike-moves.json')),scene=JSON.parse(read('assets/visual-combat/scene-sources.json'));
const bytes=fs.readFileSync(manifest.src);assert.equal(hash(bytes),manifest.sha256);
assert.equal(bytes.readUInt32BE(16),704);assert.equal(bytes.readUInt32BE(20),2880);assert.equal(bytes[25],6,'RGBA atlas');
const r={console,performance:{now:()=>0}};r.globalThis=r;
for(const f of ['night_combat.js','night_move_atlas.js','night_move_visuals.js'])vm.runInNewContext(read(f),r);
const expected=[...Object.keys(r.TechOpsNightCombat.MOVES),'grab','throw','throw-up','throw-down','dash','block','hurt','down','get-up'];
assert.deepEqual(Object.keys(manifest.moves).sort(),expected.sort());assert.equal(manifest.frameCount,80);
const positions=new Set();
for(const [name,move] of Object.entries(manifest.moves)){
 assert.equal(move.frames.length,4,name+' has four authored poses');
 for(const f of move.frames){const [x,y,w,h]=f.rect;assert.ok(x>=0&&y>=0&&x+w<=704&&y+h<=2880);positions.add(x+','+y);assert.ok(f.pivot[0]>0&&f.pivot[0]<w&&f.pivot[1]>0&&f.pivot[1]<=h);}
 const source=manifest.sources[move.source];assert.equal(hash(fs.readFileSync(source.path)),source.sha256);
}
assert.equal(positions.size,80,'no relabelled duplicate atlas cells');
for(const [kind,move] of Object.entries(r.TechOpsNightCombat.MOVES)){
 const n={district:'industrial',hp:100,face:1,_nightCombat:{time:move.windup-1,attack:{kind,at:0,windup:move.windup,duration:move.recovery,face:-1}}};
 assert.equal(r.TechOpsNightMoves.sample(n).frame,0,kind+' anticipation before contact');n._nightCombat.time=move.windup;
 assert.equal(r.TechOpsNightMoves.sample(n).frame,1,kind+' contact pose follows damage clock');assert.equal(r.TechOpsNightMoves.sample(n).face,-1,'locked strike facing');
 n._nightCombat.time=move.recovery-1;assert.equal(r.TechOpsNightMoves.sample(n).frame,3,kind+' recovery');
}
let runtimeBytes=bytes.length+fs.statSync('assets/visual-combat/waldo-props.png').size;
const loaded=[];
class ImageFixture{
 set src(src){this.source=src;loaded.push(this);const p=Object.values(scene.plates).find(p=>p.src===src);this.naturalWidth=p?p.width:640;this.naturalHeight=p?p.height:144;this.complete=true;}
 get src(){return this.source;}
}
r.Image=ImageFixture;r.TechOpsNightRuntime={HOME_X:1560};vm.runInNewContext(read('runtime_scene_art.js'),r);
for(const [id,p] of Object.entries(scene.plates)){const b=fs.readFileSync(p.src);assert.equal(hash(b),p.sha256);assert.ok(p.qa.startsWith('QA-'));assert.equal(hash(fs.readFileSync(p.capture.path)),p.capture.sha256,'original browser capture remains unaltered');assert.equal(p.groundRatio,r.TechOpsSceneArt.specs[id].ground);runtimeBytes+=b.length;}
assert.ok(runtimeBytes<5*1024*1024,'scene + move runtime art stays under 5 MiB');
function context(width,height){const calls=[];return {canvas:{width,height},calls,save(){},restore(){},beginPath(){},rect(){},clip(){},fillRect(){},drawImage(...args){calls.push(args);}};}
for(const width of [320,1048,1440])for(const district of ['industrial','longwharf','waldo','home'])for(const cam of [0,1800-width]){
 const ctx=context(width,720),n={district,cam,x:700,enemies:[],platforms:[{x:350,y:320,w:140,h:10}]},before=JSON.stringify(n);
 assert.equal(r.TechOpsSceneArt.drawBackdrop(ctx,n),true);assert.equal(r.TechOpsSceneArt.drawGround(ctx,n),true);assert.equal(r.TechOpsSceneArt.drawPlatforms(ctx,n),true);assert.equal(JSON.stringify(n),before,'art cannot mutate gameplay');
 for(const call of ctx.calls){assert.ok(call.slice(1).every(Number.isFinite));assert.ok(call[3]>0&&call[4]>0&&call[7]>0&&call[8]>0,'valid source and destination rectangles');}
 if(district==='home'){
  const door=ctx.calls[0];assert.equal(door[1],0,'continuous panorama');const anchor=door[5]+1368*door[7]/door[3];assert.ok(Math.abs(anchor-(1560-cam))<.001,'APT 4B follows the actual door coordinate');
 }
 if(district==='home'||district==='waldo'){
  const backdrop=ctx.calls[0],ground=ctx.calls[1];assert.equal(backdrop[5],-cam);assert.equal(ground[5],backdrop[5]);assert.equal(ground[7],backdrop[7],'ground and architecture share horizontal scale');assert.ok(ground[5]+ground[7]>=width,'panorama covers the viewport at the world edge');
  if(district==='waldo')for(const [sourceLeft,sourceRight,hotspot] of [[870,920,820],[1216,1386,1120]]){
   const scale=backdrop[7]/backdrop[3];assert.ok(hotspot>=sourceLeft*scale&&hotspot<=sourceRight*scale,'property hotspot falls inside the authored doorway');
  }
 }
}
for(const n of [{district:'industrial',_sector04:{}},{district:'gb_m3',_v736:{m:3}},{district:'gb_m8',_v736:{m:8}},{district:'wooster'}])assert.equal(r.TechOpsSceneArt.ready(n),false,'unrelated scenes retain their own art');
assert.equal(r.TechOpsSceneArt.ready({district:'gb_m1',_v736:{m:1}}),true);
const im=loaded.find(i=>i.src===scene.plates.home.src);im.complete=false;assert.equal(r.TechOpsSceneArt.drawBackdrop(context(1048,720),{district:'home'}),false,'undecoded art returns to the established fallback');
assert.ok(!/setInterval|requestAnimationFrame|addEventListener/.test(read('runtime_scene_art.js')+read('night_move_visuals.js')),'presentation must not add another loop or input owner');
const live=read('visual_cohesion_live_crawl.js');assert.ok(!live.includes('ref.drawReferenceNightWalker=function'),'scale patch may not replace the animation-capable renderer');
console.log(JSON.stringify({suite:'visual-combat-assets',moves:expected.length,authoredFrames:positions.size,scenePlates:Object.keys(scene.plates).length,runtimeArtBytes:runtimeBytes,failed:0}));
