import * as THREE from './vendor/three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';

// Presentation only: the host remains the owner of NM, damage, story and time.
export function eligible(root){
 const n=root.NM,s=root.S,m=s?.meta?._v736,c=n?._v736;
 return !!(n&&c&&m&&Number(m.m)===5&&Number(c.m)===5&&m.k&&!c.ending&&s.nightMode===n&&!s.inDialog&&!s.inBattle&&!s.gameOver&&!root.TechOpsPresentationDirector?.isBlocking?.('gooddogs'));
}
export function objective(n){
 const c=n._v736;
 if(!n._gbMikeIndexDefeated)return 'Break the Mike Index. Its prediction follows recorded movement.';
 if((n.enemies||[]).some(e=>e.alive!==false&&e.hp>0))return 'Clear route security. Keep K and your partner moving.';
 if(!c._gbAccessNodeSeized)return 'Escort K to the Access Node. USE to open Route 1984.';
 return 'Route 1984 is open. Regroup at the marked door.';
}
export async function createLevel({canvas,assetBase=new URL('./',import.meta.url),reducedMotion=false}={}){
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,preserveDrawingBuffer:true,powerPreference:'high-performance'});
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
 const scene=new THREE.Scene();scene.background=new THREE.Color('#070c11');scene.fog=new THREE.FogExp2('#10191b',.039);
 scene.add(new THREE.HemisphereLight(0xb6d6e6,0x27170b,1.65));
 const fill=new THREE.DirectionalLight(0xbbddee,2);fill.position.set(-3,8,-3);scene.add(fill);
 const camera=new THREE.PerspectiveCamera(57,1,.08,80),side=new THREE.OrthographicCamera(-9,9,6,-6,.05,100);
 const geo=new THREE.BoxGeometry(1,1,1),metal=new THREE.MeshStandardMaterial({color:0x292e30,metalness:.7,roughness:.43}),rust=new THREE.MeshStandardMaterial({color:0x63442d,metalness:.65,roughness:.65}),black=new THREE.MeshStandardMaterial({color:0x111820,metalness:.35,roughness:.65}),gold=new THREE.MeshStandardMaterial({color:0xb28749,metalness:.65,roughness:.33}),green=new THREE.MeshStandardMaterial({color:0x5ce1b0,emissive:0x34cc88,emissiveIntensity:1.1}),amber=new THREE.MeshStandardMaterial({color:0xffd289,emissive:0xffa334,emissiveIntensity:3});
 const objects=[],textures=[];
 function box(x,y,z,w,h,d,mat=metal,parent=scene){const o=new THREE.Mesh(geo,mat);o.position.set(x,y,z);o.scale.set(w,h,d);parent.add(o);if(parent===scene)objects.push(o);return o;}
 function label(text,x,y,z,width=2.5,color='#efcf94',rotate=0){
  const c=document.createElement('canvas');c.width=768;c.height=128;const cx=c.getContext('2d');cx.fillStyle='#121b1c';cx.fillRect(0,0,768,128);cx.strokeStyle='#8a7551';cx.strokeRect(5,5,758,118);cx.font='bold 55px sans-serif';cx.textAlign='center';cx.textBaseline='middle';cx.fillStyle=color;cx.fillText(text,384,65,725);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;textures.push(t);const o=new THREE.Mesh(new THREE.PlaneGeometry(width,width/6),new THREE.MeshBasicMaterial({map:t,side:THREE.DoubleSide}));o.position.set(x,y,z);o.rotation.y=rotate;scene.add(o);return o;
 }
 // One traversable corridor, with the same dark metal / amber practical palette.
 for(let i=-3;i<19;i++){
  const z=i*1.55;
  box(0,-.12,z,6.4,.22,1.5);box(0,.002,z,2.7,.025,1.42,black);
  for(const x of [-3.2,3.2]){box(x,1.9,z,.16,3.8,1.5);if(i%2===0){box(x*.95,1.9,z,.16,3.8,.18,rust);box(x*.90,2.9,z,.18,.10,.6,amber);}}
  if(i%2===0){box(0,3.8,z,6.4,.20,.20,rust);box(0,3.7,z,1,.10,.27,amber);box(-2.75,.13,z,.045,.08,1.4,gold);box(2.75,.13,z,.045,.08,1.4,gold);}
  if(i%4===0){const l=new THREE.PointLight(0xff9d38,35,8,2);l.position.set(0,3.3,z);scene.add(l);}
 }
 box(-2.65,3.35,14,.13,.13,29,rust);box(2.6,3.4,14,.20,.20,29,black);
 box(0,1.9,-5,6.4,3.8,.20);label('CELL 118 · RELEASED',0,2.7,-4.85,3.7,'#e7c394');
 box(0,1,-4.83,1.7,1.9,.16,black);box(0,2.1,-4.69,1.4,.09,.12,amber);
 label('ORPHEUS / ACCESS CORE',0,3.24,9.5,4.6,'#b3ead3',Math.PI);
 label('1984 →',-2.9,2,12,1.8,'#ecd09c',Math.PI/2);
 // Physical platforms mirror the current M5 registry coordinates (60 px/metre).
 const platformMeshes=[];
 for(const [x,y,w] of [[250,345,240],[590,345,240],[930,310,230],[1260,345,260]]){
  const h=(430-y)/60;const deck=box(0,h-.09,(x+w/2)/60,3.4,.18,w/60,metal),edge=box(-1.65,h,(x+w/2)/60,.05,.07,w/60,gold);platformMeshes.push({deck,edge,height:h,min:x/60,max:(x+w)/60});
 }
 const hazard=box(0,.025,867.5/60,3.6,.04,.75,new THREE.MeshStandardMaterial({color:0x91392b,emissive:0xef4422,emissiveIntensity:.7}));
 box(-2.25,.7,1070/60,.65,1.4,.5,black);const screen=box(-2.25,1.52,1070/60,.70,.38,.12,green);screen.rotation.x=-.18;
 label('ACCESS NODE',-2.25,2.08,1070/60-.1,1.5,'#9feec8',Math.PI);
 const end=1480/60;box(-2.3,1.9,end,1.8,3.8,.3);box(2.3,1.9,end,1.8,3.8,.3);box(0,3.3,end,3,.9,.3);
 const door=box(0,1.35,end,2.7,2.7,.18,black);label('ROUTE 1984',0,3.15,end-.19,2.5,'#f7cc85',Math.PI);
 const lockLight=box(1.7,1.2,end-.22,.16,.4,.06,amber);
 const loader=new GLTFLoader();let loaded;
 try{loaded=await Promise.all(['dog.katrin','dog.manchez','char.k'].map(id=>loader.loadAsync(new URL('models/'+id+'.glb',assetBase).href)));}catch(error){renderer.dispose();throw error;}
 const actors={};const mixers=[];
 ['katrin','manchez','k'].forEach((id,i)=>{const gltf=loaded[i],o=gltf.scene;scene.add(o);const mixer=new THREE.AnimationMixer(o);for(const clip of gltf.animations)mixer.clipAction(clip).play();mixers.push({mixer,id});actors[id]=o;});
 // The Index is visibly a white containment projection, never a substitute Mike.
 const enemyMeshes=new Map();const hologram=new THREE.MeshStandardMaterial({color:0xd8ffff,emissive:0x73c4d8,emissiveIntensity:.6,metalness:.5,roughness:.3,transparent:true,opacity:.78});
 function enemyMesh(e){const group=new THREE.Group(),index=String(e.kind).includes('mikeindex'),mat=index?hologram:rust;
  box(0,1.05,0,.6,.82,.3,mat,group);box(-.18,.38,0,.19,.7,.22,mat,group);box(.18,.38,0,.19,.7,.22,mat,group);box(-.4,1,0,.17,.7,.2,mat,group);box(.4,1,0,.17,.7,.2,mat,group);
  const head=new THREE.Mesh(new THREE.IcosahedronGeometry(.25,1),mat);head.position.y=1.7;group.add(head);box(0,1.73,-.23,.28,.045,.035,index?green:amber,group);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.53,.017,5,32),index?hologram:gold);ring.rotation.x=Math.PI/2;ring.position.y=.03;group.add(ring);const bar=box(0,2.1,0,.7,.05,.06,green,group);group.userData.healthBar=bar;scene.add(group);return group;
 }
 const projectileGeometry=new THREE.SphereGeometry(.075,8,6),projectiles=[];
 const cueRing=new THREE.Mesh(new THREE.RingGeometry(.45,.6,40),new THREE.MeshBasicMaterial({color:0xff653c,side:THREE.DoubleSide,transparent:true,opacity:.6}));cueRing.rotation.x=-Math.PI/2;scene.add(cueRing);
 let view='third',lastTime=0,lost=false,disposed=false;const look=new THREE.Vector3();
 const onLost=e=>{e.preventDefault();lost=true;};renderer.domElement.addEventListener('webglcontextlost',onLost);
 function draw(n,width,height,time=performance.now()){
  if(lost||disposed)return false;
  const dt=lastTime?Math.min(.05,Math.max(0,(time-lastTime)/1000)):0;lastTime=time;const c=n._v736,p=c.partner||n;
  const active=c.active==='manchez'?'manchez':'katrin',other=active==='katrin'?'manchez':'katrin';
  function place(o,b,lane){o.position.set(lane,Math.max(0,(430-(b.y||0)-(b.h||34))/60),(Number(b.x)||0)/60);o.rotation.y=(b.face||1)<0?Math.PI:0;}
  place(actors[active],n,-.44);place(actors[other],p,.44);
  for(const id of ['katrin','manchez'])actors[id].rotation.z=c.chars?.[id]?.hp<=0?Math.PI/2:0;
  const lead=(Number(n.x)||0)/60,partner=(Number(p.x)||0)/60;
  actors.k.position.set(-2.2,0,Math.max(.8,Math.min(lead,partner)-1.15));actors.k.rotation.y=(n.face||1)<0?Math.PI:0;
  const speed=Math.abs(n.vx||0)+Math.abs(p.vx||0);mixers.forEach(a=>{if(a.id==='k'||speed>.15)a.mixer.update(dt);});
  const present=new Set();let telegraph=null;
  for(const e of n.enemies||[]){if(e.alive===false||e.hp<=0)continue;present.add(e);let o=enemyMeshes.get(e);if(!o){o=enemyMesh(e);enemyMeshes.set(e,o);}o.position.set(0,Math.max(0,(430-(e.y||390)-(e.h||40))/60),e.x/60);o.rotation.y=Math.PI;o.scale.setScalar(Math.max(.55,(e.h||70)/130));o.userData.healthBar.scale.x=.7*Math.max(0,e.hp/(e.maxHp||e.hp));if(e.windup>0)telegraph=e;}
  for(const [e,o] of enemyMeshes)if(!present.has(e)){scene.remove(o);enemyMeshes.delete(e);o.traverse(a=>{if(a.geometry&&a.geometry!==geo)a.geometry.dispose();});}
  cueRing.visible=!!telegraph;if(telegraph)cueRing.position.set(0,.04,(telegraph.recordedTarget??telegraph.x)/60);
  const shots=c.shots||[];for(let i=0;i<Math.max(shots.length,projectiles.length);i++){let o=projectiles[i];if(!o){o=new THREE.Mesh(projectileGeometry,green);scene.add(o);projectiles.push(o);}o.visible=i<shots.length;if(o.visible){o.position.set(0,(430-shots[i].y)/60,shots[i].x/60);o.scale.set(1,1,2);}}
  const open=!!c._gbAccessNodeSeized;door.position.y=1.35+(open?2.9:0);lockLight.material=open?green:amber;
  screen.material=n._gbMikeIndexDefeated?green:amber;hazard.visible=true;
  const aspect=width/height;const targetZ=(lead+partner)*.5;
  const focusY=Math.max(actors[active].position.y,actors[other].position.y)+.53;
  let cam=camera;
  if(view==='retro'){cam=side;const h=5.8,w=h*aspect;side.left=-w;side.right=w;side.top=h;side.bottom=-h;side.position.set(12,4.2,targetZ);side.lookAt(0,1,targetZ);side.updateProjectionMatrix();}
  else if(view==='first'){camera.position.copy(actors.k.position).add(new THREE.Vector3(0,1.67,0));look.set(0,1.1,lead+4);camera.lookAt(look);camera.fov=68;}
  else{const separation=Math.abs(lead-partner),back=5+Math.min(3,separation*.5)+(aspect<.8?1.8:0);const face=(n.face||1)<0?-1:1;camera.position.set(.9,focusY+1.8,Math.max(-4,Math.min(open?28:end-.4,targetZ-back*face)));look.set(0,focusY,targetZ+2.5*face);camera.lookAt(look);camera.fov=57;}
  for(const o of objects)if(o.position.x>2.7&&o.position.y>.2)o.visible=view!=='retro';
  for(const pl of platformMeshes){const blocked=view!=='retro'&&focusY<pl.height&&pl.min<=Math.max(camera.position.z,targetZ)&&pl.max>=Math.min(camera.position.z,targetZ);pl.deck.visible=pl.edge.visible=!blocked;}
  actors.k.visible=view!=='first';camera.aspect=aspect;camera.updateProjectionMatrix();
  const pixelRatio=view==='retro'?.27:Math.min(1.5,globalThis.devicePixelRatio||1);
  if(renderer.getPixelRatio()!==pixelRatio)renderer.setPixelRatio(pixelRatio);
  const size=renderer.getSize(new THREE.Vector2());if(size.x!==width||size.y!==height)renderer.setSize(width,height,false);
  renderer.render(scene,cam);return true;
 }
 function dispose(){if(disposed)return;disposed=true;renderer.domElement.removeEventListener('webglcontextlost',onLost);mixers.forEach(a=>a.mixer.stopAllAction());const geometries=new Set(),materials=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());renderer.dispose();}
 return {draw,dispose,canvas:renderer.domElement,setView(value){view=['third','retro','first'].includes(value)?value:'third';lastTime=0;},get view(){return view;},get lost(){return lost;},stats(){return {...renderer.info.render};}};
}
