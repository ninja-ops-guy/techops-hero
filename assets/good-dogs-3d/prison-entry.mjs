import * as THREE from './vendor/three.module.js';

export function prisonEntry(scene,geo,kit){
 const {steel,dark,rust,trim,amber}=kit,group=new THREE.Group();group.name='Cell 118 / open pressure bulkhead';group.position.z=-.75;scene.add(group);
 const bins=new Map();function panel(x,y,z,w,h,d,m=steel,angle=0){if(!bins.has(m))bins.set(m,[]);bins.get(m).push(new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),angle),new THREE.Vector3(w,h,d)));}
 for(const side of [-1,1]){
  panel(side*2.42,1.87,0,1.7,3.75,.38,dark);
  panel(side*1.58,1.25,.05,.34,2.5,.50,steel);
  panel(side*1.38,1.22,.34,.055,2.39,.075,trim);
  panel(side*1.34,2.53,.04,.38,.64,.50,steel,side*Math.PI/4);
  panel(side*1.20,2.5,.34,.04,.54,.07,trim,side*Math.PI/4);
  panel(side*1.58,.14,.35,.26,.28,.17,rust);
  // Visible hinge blocks and lock keepers around the seal.
  for(let y=.38;y<2.35;y+=.42){panel(side*1.65,y,.31,.20,.12,.14,rust);panel(side*1.65,y,.40,.055,.055,.035,trim);}
  for(let k=0;k<4;k++)panel(side*(2.25+k*.09),1.86,.23,.033,3.48,.033,k%2?trim:dark);
  for(let y=.28;y<3.5;y+=.33)panel(side*2.8,y,.25,.10,.10,.035,trim);
  // Retracted barred door leaves remain attached to the opening.
  panel(side*2.05,1.25,.27,.58,2.42,.13,steel);
  panel(side*2.05,1.4,.35,.44,.80,.05,dark);
  for(const x of [-.14,0,.14])panel(side*2.05+x,1.4,.40,.024,.76,.032,trim);
  panel(side*1.10,2.93,.28,.52,.19,.24,dark);
  panel(side*1.10,2.92,.415,.39,.10,.026,amber);
 }
 panel(0,2.8,0,3.55,.50,.5,steel);panel(0,3.45,0,6.4,.58,.38,dark);
 panel(0,.027,.08,2.83,.054,.69,trim);
 panel(0,3.21,.24,3.35,.47,.12,steel);panel(0,3.21,.312,3.16,.34,.04,dark);
 const c=document.createElement('canvas');c.width=1024;c.height=128;const x=c.getContext('2d');x.fillStyle='#171a1b';x.fillRect(0,0,1024,128);x.fillStyle='#e1bd83';x.font='bold 74px sans-serif';x.textBaseline='middle';x.textAlign='center';x.fillText('PRISON CELL 118',512,69,980);
 const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;
 const sign=new THREE.Mesh(new THREE.PlaneGeometry(3.08,.32),new THREE.MeshStandardMaterial({map,roughness:.8,emissive:0xa88442,emissiveIntensity:.10}));sign.position.set(0,3.21,.337);group.add(sign);
 // Recessed masonry gives the cell actual depth beyond the steel frame.
 const stone=new THREE.MeshStandardMaterial({color:0x4a4439,roughness:.98});
 panel(0,1.6,-3.1,3.2,3.2,.25,dark);
 for(let row=0;row<8;row++)for(let col=0;col<5;col++)panel(-1.26+col*.63+(row%2)*.06,.20+row*.40,-2.96,.60,.375,.06,stone);
 for(const side of [-1,1])panel(side*1.61,1.5,-1.55,.10,3,3.1,dark);
 panel(0,.4,-2,.75,.13,.75,steel);panel(0,.78,-2.3,.75,.83,.10,dark);panel(0,.18,-2,.14,.4,.14,trim);
 const glow=new THREE.PointLight(0xffa44b,20,6,2);glow.position.set(0,2.5,-1.2);group.add(glow);
 for(const [material,matrices] of bins){const batch=new THREE.InstancedMesh(geo,material,matrices.length);matrices.forEach((m,i)=>batch.setMatrixAt(i,m));batch.receiveShadow=batch.castShadow=true;batch.computeBoundingSphere();group.add(batch);}
 return {textures:[map]};
}
