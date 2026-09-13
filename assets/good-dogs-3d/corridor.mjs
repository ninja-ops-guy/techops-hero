import * as THREE from './vendor/three.module.js';
import {surface} from './fidelity.mjs?v=20260913-video-r1';

export function beveledBox(){
 const g=new THREE.BoxGeometry(1,1,1,4,4,4),p=g.attributes.position,normal=g.attributes.normal;
 const a=new THREE.Vector3(),b=new THREE.Vector3();
 for(let i=0;i<p.count;i++){a.fromBufferAttribute(p,i);b.copy(a).clampScalar(-.43,.43);a.sub(b).normalize();p.setXYZ(i,b.x+a.x*.07,b.y+a.y*.07,b.z+a.z*.07);normal.setXYZ(i,a.x,a.y,a.z);}
 return g;
}

// Architectural detail is batched by material and corridor side. Beveled panels,
// flanges, drain slots and fasteners all remain actual mesh geometry.
export function buildCorridor(scene,geo,maps={}){
 const steel=surface(new THREE.MeshStandardMaterial({color:0x4b5358,metalness:.78,roughness:.45}),'steel',{world:true,texture:maps.steel});
 const dark=surface(new THREE.MeshStandardMaterial({color:0x272e34,metalness:.7,roughness:.51}),'steel',{world:true,texture:maps.steel});
 const rust=surface(new THREE.MeshStandardMaterial({color:0x514132,metalness:.48,roughness:.68}),'steel',{world:true,texture:maps.steel});
 const floor=surface(new THREE.MeshPhysicalMaterial({color:0x40464a,metalness:.66,roughness:.4,clearcoat:.3,clearcoatRoughness:.24}),'floor',{world:true,texture:maps.steel});
 const trim=new THREE.MeshStandardMaterial({color:0x5d625d,metalness:.85,roughness:.34});
 const caution=new THREE.MeshStandardMaterial({color:0xb89b49,metalness:.46,roughness:.64});
 const amber=new THREE.MeshStandardMaterial({color:0xffd9a0,emissive:0xffa339,emissiveIntensity:4.5});
 const bins=new Map(),cutaway=[],pipes=[];let count=0;
 function part(mat,side,x,y,z,w,h,d){const key=mat.uuid+'/'+side;if(!bins.has(key))bins.set(key,{mat,side,transforms:[]});const m=new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion(),new THREE.Vector3(w,h,d));bins.get(key).transforms.push(m);count++;}
 for(let i=-3;i<19;i++){
  const z=i*1.55;
  part(floor,0,0,-.12,z,6.5,.22,1.52);
  for(const x of [-1.04,1.04]){part(floor,0,x,-.007,z,1.97,.037,1.42);part(trim,0,x,.014,z-.68,1.9,.018,.018);}
  for(const side of [-1,1]){
   const x=side*3.2;
   part(dark,side,x,1.9,z,.20,3.8,1.52);
   part(steel,side,x-side*.12,1.86,z,.09,2.75,1.32);
   part(rust,side,x-side*.19,.40,z,.08,.14,1.32);
   part(dark,side,x-side*.175,2.15,z,.027,1.08,1.10);
   for(const y of [.65,2.92])for(const offset of [-.53,.53])part(trim,side,x-side*.21,y,z+offset,.042,.055,.055);
   // Cable tray and inspection gratings run at dog-eye height.
   part(dark,side,x-side*.21,.84,z,.06,.30,1.05);
   for(let sl=0;sl<8;sl++)part(trim,side,x-side*.25,.84,z-.44+sl*.126,.023,.17,.018);
   for(let sl=0;sl<10;sl++)part(dark,0,side*2.50,.015,z-.64+sl*.138,.70,.055,.058);
   if(i%2===0){
    part(steel,side,x-side*.16,1.85,z-.76,.27,3.7,.22);
    part(trim,side,x-side*.32,1.85,z-.76,.05,3.54,.046);
    part(dark,side,x-side*.27,2.95,z,.33,.28,.75);
    part(amber,side,x-side*.46,2.95,z,.055,.10,.49);
   }
  }
  if(i%2===0){
   part(steel,0,0,3.75,z-.76,6.30,.31,.25);
   part(trim,0,0,3.55,z-.76,5.9,.035,.038);
   part(dark,0,0,3.57,z,1.36,.17,.53);part(amber,0,0,3.47,z,1.04,.06,.25);
   for(const x of [-2.90,2.90])part(caution,0,x,.03,z,.046,.045,1.30);
  }
 }
 const pipeMat=surface(new THREE.MeshStandardMaterial({color:0x32312b,roughness:.61,metalness:.68}),'steel',{world:true,texture:maps.steel});
 for(const side of [-1,1])for(let j=0;j<3;j++){
  const p=new THREE.Mesh(new THREE.CylinderGeometry(.045+j*.015,.045+j*.015,31,20,1),pipeMat);p.rotation.x=Math.PI/2;p.position.set(side*(2.78-j*.17),3.36,12);p.receiveShadow=true;scene.add(p);pipes.push(p);
  for(let z=-3;z<28;z+=3.1)part(trim,side,side*(2.78-j*.17),3.36,z,.16,.17,.05);
 }
 for(const {mat,side,transforms} of bins.values()){
  const batch=new THREE.InstancedMesh(geo,mat,transforms.length);transforms.forEach((m,i)=>batch.setMatrixAt(i,m));batch.receiveShadow=true;batch.castShadow=false;batch.computeBoundingSphere();scene.add(batch);if(side===-1)cutaway.push(batch);
 }
 // Restrained beam haze uses depth testing, so it cannot glow through the wall.
 const beamMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,uniforms:{color:{value:new THREE.Color(0xffb669)}},vertexShader:'varying vec2 vUv;varying vec3 vn;varying vec3 vp;void main(){vUv=uv;vn=normalMatrix*normal;vec4 p=modelViewMatrix*vec4(position,1.);vp=p.xyz;gl_Position=projectionMatrix*p;}',fragmentShader:'varying vec2 vUv;varying vec3 vn;varying vec3 vp;uniform vec3 color;void main(){float soft=pow(abs(dot(normalize(vn),normalize(vp))),2.);float fade=pow(sin(vUv.y*3.14159),2.)*.007*soft;gl_FragColor=vec4(color,fade);}'});
 const beamGeo=new THREE.ConeGeometry(.92,3.15,24,1,true);for(let z=-1.55;z<28;z+=6.2){const b=new THREE.Mesh(beamGeo,beamMat);b.position.set(0,1.92,z);scene.add(b);}
 return {steel,dark,rust,floor,trim,caution,amber,count,setRetro(value){cutaway.forEach(o=>o.visible=!value);pipes.filter(o=>o.position.x<0).forEach(o=>o.visible=!value);}};
}
