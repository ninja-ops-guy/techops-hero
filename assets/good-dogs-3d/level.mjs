import * as THREE from './vendor/three.module.js';
import {prisonEntry} from './prison-entry.mjs?v=20260913-reference-r2';
import {positionCamera} from './camera.mjs?v=20260913-reference-r2';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {surface,dressActors,environmentMap,filmPipeline,QUALITY} from './fidelity.mjs?v=20260913-reference-r2';
import {buildCorridor,beveledBox} from './corridor.mjs?v=20260913-reference-r2';

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
export async function createLevel({canvas,assetBase=new URL('./',import.meta.url),reducedMotion=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches||false,quality=globalThis.matchMedia?.('(pointer:coarse)').matches?'balanced':'high'}={}){
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,preserveDrawingBuffer:true,powerPreference:'high-performance'});
 let qualityMode=QUALITY[quality]?quality:'balanced';
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
 renderer.info.autoReset=false;
 const scene=new THREE.Scene();scene.background=new THREE.Color('#0b0e11');scene.fog=new THREE.FogExp2('#282019',.022);
 const env=environmentMap(renderer);scene.environment=env.texture;scene.environmentIntensity=.32;
 scene.add(new THREE.HemisphereLight(0xd7deec,0x2f2922,.72));
 const fill=new THREE.DirectionalLight(0xcadbed,1.15);fill.position.set(-3,7,-3);scene.add(fill);
 const key=new THREE.DirectionalLight(0xffe9cc,2.15);key.position.set(-2,6,-2);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-5;key.shadow.camera.right=5;key.shadow.camera.top=5;key.shadow.camera.bottom=-5;key.shadow.camera.near=.1;key.shadow.camera.far=18;key.shadow.normalBias=.008;key.shadow.bias=-.0002;key.shadow.radius=2;scene.add(key,key.target);
 const camera=new THREE.PerspectiveCamera(53,1,.08,80),side=new THREE.OrthographicCamera(-9,9,6,-6,.05,100);
 const geo=beveledBox(),kit=buildCorridor(scene,geo),metal=kit.steel,rust=kit.rust,black=kit.dark,gold=kit.caution,amber=kit.amber,green=new THREE.MeshStandardMaterial({color:0xa4f2c8,emissive:0x43cf91,emissiveIntensity:2});
 const pipeline=filmPipeline(renderer);
 const objects=[],textures=[];
 function box(x,y,z,w,h,d,mat=metal,parent=scene){const o=new THREE.Mesh(geo,mat);o.position.set(x,y,z);o.scale.set(w,h,d);o.castShadow=parent!==scene;o.receiveShadow=true;parent.add(o);if(parent===scene)objects.push(o);return o;}
 function label(text,x,y,z,width=2.5,color='#efcf94',rotate=0){
  const c=document.createElement('canvas');c.width=768;c.height=128;const cx=c.getContext('2d');cx.fillStyle='#121b1c';cx.fillRect(0,0,768,128);cx.strokeStyle='#8a7551';cx.strokeRect(5,5,758,118);cx.font='bold 55px sans-serif';cx.textAlign='center';cx.textBaseline='middle';cx.fillStyle=color;cx.fillText(text,384,65,725);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;textures.push(t);const o=new THREE.Mesh(new THREE.PlaneGeometry(width,width/6),new THREE.MeshBasicMaterial({map:t,side:THREE.DoubleSide}));o.position.set(x,y,z);o.rotation.y=rotate;scene.add(o);return o;
 }
 // Pools of motivated sodium light along the service corridor.
 for(let z=-1.55;z<28;z+=6.2){const light=new THREE.PointLight(0xffae57,11,7.8,2);light.position.set(0,3.2,z);scene.add(light);}
 const entry=prisonEntry(scene,geo,kit);textures.push(...entry.textures);
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
 const loader=new GLTFLoader(),actorSets=new Map(),pendingSets=new Map();let actors={},mixers=[],requestedQuality=qualityMode;
 function releaseActorSet(set){for(const a of Object.values(set.actors))a.userData.detailTextures?.forEach(t=>t.dispose());const geometries=new Set(),materials=new Set();for(const o of Object.values(set.actors)){o.traverse(n=>{if(n.geometry)geometries.add(n.geometry);if(n.material)(Array.isArray(n.material)?n.material:[n.material]).forEach(m=>materials.add(m));});}set.mixers.forEach(a=>a.mixer.stopAllAction());geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}
 async function loadActors(tier){
  if(actorSets.has(tier))return actorSets.get(tier);if(pendingSets.has(tier))return pendingSets.get(tier);
  const promise=Promise.all(['dog.katrin','dog.manchez','char.k'].map(id=>loader.loadAsync(new URL('models/'+id+(tier==='high'?'':'.lite')+'.glb',assetBase).href))).then(loaded=>{
   const set={actors:{},mixers:[]};['katrin','manchez','k'].forEach((id,i)=>{const gltf=loaded[i],o=gltf.scene;dressActors(o,id);const mixer=new THREE.AnimationMixer(o);for(const clip of gltf.animations)mixer.clipAction(clip).play();set.mixers.push({mixer,id});set.actors[id]=o;});actorSets.set(tier,set);return set;
  });pendingSets.set(tier,promise);try{return await promise;}finally{pendingSets.delete(tier);}
 }
 function activate(set){for(const o of Object.values(actors))scene.remove(o);actors=set.actors;mixers=set.mixers;for(const o of Object.values(actors))scene.add(o);}
 try{activate(await loadActors(qualityMode==='high'?'high':'lite'));}catch(error){pipeline.dispose();env.dispose();renderer.dispose();throw error;}
 // The Index is visibly a white containment projection, never a substitute Mike.
 const enemyMeshes=new Map();const hologram=new THREE.MeshStandardMaterial({color:0xd8ffff,emissive:0x73c4d8,emissiveIntensity:.6,metalness:.5,roughness:.3,transparent:true,opacity:.78});
 function enemyMesh(e){const group=new THREE.Group(),index=String(e.kind).includes('mikeindex'),mat=index?hologram:rust;
  const chest=new THREE.Mesh(new THREE.CapsuleGeometry(.28,.5,6,16),mat);chest.position.y=1.1;chest.scale.z=.67;chest.castShadow=true;group.add(chest);for(const x of [-.17,.17]){const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.095,.52,5,12),mat);leg.position.set(x,.4,0);leg.castShadow=true;group.add(leg);box(x,.075,-.06,.23,.15,.39,black,group);}for(const x of [-.39,.39]){const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.08,.42,5,12),mat);arm.position.set(x,1.05,0);arm.castShadow=true;group.add(arm);}box(0,1.2,-.22,.48,.37,.09,index?hologram:black,group);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.24,24,16),mat);head.position.y=1.7;group.add(head);box(0,1.73,-.23,.28,.045,.035,index?green:amber,group);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.53,.017,5,32),index?hologram:gold);ring.rotation.x=Math.PI/2;ring.position.y=.03;group.add(ring);const bar=box(0,2.1,0,.7,.05,.06,green,group);group.userData.healthBar=bar;scene.add(group);return group;
 }
 const projectileGeometry=new THREE.SphereGeometry(.075,8,6),projectiles=[];
 const cueRing=new THREE.Mesh(new THREE.RingGeometry(.45,.6,40),new THREE.MeshBasicMaterial({color:0xff653c,side:THREE.DoubleSide,transparent:true,opacity:.6}));cueRing.rotation.x=-Math.PI/2;scene.add(cueRing);
 let view='third',lastTime=0,lastCameraView='',lost=false,disposed=false;
 const onLost=e=>{e.preventDefault();lost=true;};renderer.domElement.addEventListener('webglcontextlost',onLost);
 function draw(n,width,height,time=performance.now()){
  if(lost||disposed)return false;
  const dt=lastTime?Math.min(.05,Math.max(0,(time-lastTime)/1000)):0;lastTime=time;const c=n._v736,p=c.partner||n;
  const active=c.active==='manchez'?'manchez':'katrin',other=active==='katrin'?'manchez':'katrin';
  function place(o,b,lane){o.position.set(lane,Math.max(0,(430-(b.y||0)-(b.h||34))/60),(Number(b.x)||0)/60);o.rotation.y=(b.face||1)<0?Math.PI:0;}
  place(actors[active],n,-.44);place(actors[other],p,.44);
  for(const id of ['katrin','manchez'])actors[id].rotation.z=c.chars?.[id]?.hp<=0?Math.PI/2:0;
  const lead=(Number(n.x)||0)/60,partner=(Number(p.x)||0)/60;
  actors.k.position.set(-1.5,0,Math.max(.8,Math.min(lead,partner)-1.15));actors.k.rotation.y=(n.face||1)<0?Math.PI:0;
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
  const previousPosition=camera.position.clone(),previousRotation=camera.quaternion.clone();
  const cam=positionCamera(camera,side,{view,targetZ,focusY,aspect,separation:Math.abs(lead-partner),end,open,kPosition:actors.k.position});
  if(view==='third'&&lastCameraView===view&&dt>0&&!reducedMotion){const blend=1-Math.exp(-12*dt);camera.position.lerpVectors(previousPosition,camera.position,blend);camera.quaternion.slerpQuaternions(previousRotation,camera.quaternion,blend);}lastCameraView=view;
  kit.setRetro(view==='retro');
  for(const o of objects)if(o.position.x< -2.7&&o.position.y>.2)o.visible=view!=='retro';
  for(const pl of platformMeshes){const blocked=view!=='retro'&&focusY<pl.height&&pl.min<=Math.max(camera.position.z,targetZ)&&pl.max>=Math.min(camera.position.z,targetZ);pl.deck.visible=pl.edge.visible=!blocked;}
  actors.k.visible=view!=='first';camera.aspect=aspect;camera.updateProjectionMatrix();
  key.position.set(-2,6,targetZ-2);key.target.position.set(0,0,targetZ+1);
  const q=QUALITY[qualityMode];renderer.shadowMap.enabled=q.shadow>0&&view!=='retro';if(key.shadow.mapSize.x!==q.shadow&&q.shadow){key.shadow.mapSize.set(q.shadow,q.shadow);key.shadow.map?.dispose();key.shadow.map=null;}
  const pixelRatio=view==='retro'?.27:Math.min(q.pixelRatio,globalThis.devicePixelRatio||1);
  if(renderer.getPixelRatio()!==pixelRatio)renderer.setPixelRatio(pixelRatio);
  const size=renderer.getSize(new THREE.Vector2());if(size.x!==width||size.y!==height)renderer.setSize(width,height,false);
  renderer.info.reset();if(qualityMode==='low'||view==='retro')renderer.render(scene,cam);else pipeline.render(scene,cam,Math.max(1,Math.round(width*pixelRatio)),Math.max(1,Math.round(height*pixelRatio)),{quality:qualityMode});return true;
 }
 function dispose(){if(disposed)return;disposed=true;renderer.domElement.removeEventListener('webglcontextlost',onLost);for(const set of actorSets.values())if(set.actors!==actors)releaseActorSet(set);mixers.forEach(a=>a.mixer.stopAllAction());for(const a of Object.values(actors))a.userData.detailTextures?.forEach(t=>t.dispose());const geometries=new Set(),materials=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());env.dispose();pipeline.dispose();renderer.dispose();}
 return {draw,dispose,canvas:renderer.domElement,setView(value){view=['third','retro','first','crew'].includes(value)?value:'third';lastTime=0;},get view(){return view;},get lost(){return lost;},async setQuality(value){const next=QUALITY[value]?value:'balanced';requestedQuality=next;const set=await loadActors(next==='high'?'high':'lite');if(disposed){releaseActorSet(set);return;}if(requestedQuality!==next)return;activate(set);qualityMode=next;},get quality(){return qualityMode;},stats(){return {...renderer.info.render,quality:qualityMode,hdr:pipeline.hdr,meshes:renderer.info.memory.geometries,textures:renderer.info.memory.textures};}};
}
