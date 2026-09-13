import * as THREE from './vendor/three.module.js';

// Short, curved fur cards follow the existing skin, including its bone weights.
// Seeded sampling gives every quality tier the same stable grooming direction.
export function groomFur(actor,id){
 if(id==='k')return;
 const meshes=[];actor.traverse(o=>{if(o.isSkinnedMesh&&!Array.isArray(o.material)&&o.material.userData.detailKind==='fur')meshes.push(o);});
 const eye=[];actor.traverse(o=>{if(o.isMesh&&o.material?.name?.includes('Eyes')){o.geometry.computeBoundingBox();eye.push(o);}});
 const bb=eye[0]?.geometry.boundingBox,originX=bb?(bb.min.x+bb.max.x)/2:0,originZ=bb?(bb.min.z+bb.max.z)/2-.383:0;
 const c=document.createElement('canvas');c.width=128;c.height=256;const ctx=c.getContext('2d');ctx.strokeStyle='rgba(255,255,255,.88)';ctx.lineCap='round';
 for(let i=0;i<23;i++){const x=14+i*4.4;ctx.lineWidth=1.1+(i%3)*.35;ctx.beginPath();ctx.moveTo(x,254);ctx.bezierCurveTo(x-18,198,x+19,159,x-3,123);ctx.bezierCurveTo(x-19,88,x+17,54,x+(i%5-2)*3,12+i%4*7);ctx.stroke();}
 const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;(actor.userData.detailTextures??=[]).push(map);
 let seed=1181984;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return (seed>>>0)/4294967296;};
 for(const source of meshes){
  const g=source.geometry,p=g.attributes.position,n=g.attributes.normal,skin=g.attributes.skinIndex,weights=g.attributes.skinWeight,ix=g.index;if(!skin||!weights||!ix)continue;
  const triangles=[],a=new THREE.Vector3(),b=new THREE.Vector3(),d=new THREE.Vector3();let total=0;
  for(let t=0;t<ix.count;t+=3){const ia=ix.getX(t),ib=ix.getX(t+1),ic=ix.getX(t+2);a.fromBufferAttribute(p,ia);b.fromBufferAttribute(p,ib);d.fromBufferAttribute(p,ic);
   const y=(a.y+b.y+d.y)/3,z=(a.z+b.z+d.z)/3-originZ;
   if(!actor.userData.videoMatch&&y>.21&&y<.52&&z<.17&&z>-.30)continue;
   if(actor.userData.videoMatch&&y>.77&&source.material.color.r>.3)continue;
   const area=b.sub(a).cross(d.sub(a)).length()*.5;if(area<1e-9)continue;total+=area;triangles.push([total,ia,ib,ic]);
  }
  if(!total)continue;
  const count=Math.min(actor.userData.videoMatch?9500:2000,Math.max(100,Math.round(total*(actor.userData.videoMatch?10500:3300)))),pos=[],norm=[],uv=[],bones=[],boneWeights=[],indices=[];
  const point=new THREE.Vector3(),normal=new THREE.Vector3(),tangent=new THREE.Vector3(),across=new THREE.Vector3(),tip=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
  for(let i=0;i<count;i++){
   const sample=random()*total;let lo=0,hi=triangles.length-1;while(lo<hi){const mid=(lo+hi)>>1;if(triangles[mid][0]<sample)lo=mid+1;else hi=mid;}
   const [,ia,ib,ic]=triangles[lo];let u=random(),v=random();if(u+v>1){u=1-u;v=1-v;}const w=1-u-v;
   point.fromBufferAttribute(p,ia).multiplyScalar(w).addScaledVector(a.fromBufferAttribute(p,ib),u).addScaledVector(b.fromBufferAttribute(p,ic),v);
   normal.fromBufferAttribute(n,ia).multiplyScalar(w).addScaledVector(a.fromBufferAttribute(n,ib),u).addScaledVector(b.fromBufferAttribute(n,ic),v).normalize();
   tangent.crossVectors(normal,Math.abs(normal.y)>.9?new THREE.Vector3(1,0,0):up).normalize();across.crossVectors(normal,tangent).normalize();
   const angle=random()*Math.PI*2;tangent.multiplyScalar(Math.cos(angle)).addScaledVector(across,Math.sin(angle)).normalize();
   const face=point.y>.58&&point.z>.29;const len=(face?.007:.014)+random()*(face?.010:.024),width=.007+random()*.009;point.addScaledVector(normal,.0015);tip.copy(point).addScaledVector(normal,len*.80);tip.y-=len*.18;
   const start=pos.length/3;
   for(let k=0;k<4;k++){
    a.copy(k<2?point:tip).addScaledVector(tangent,(k%2?1:-1)*width*.5);pos.push(a.x,a.y,a.z);norm.push(normal.x,normal.y,normal.z);uv.push(k%2,k<2?0:1);
    const dominant=w>=u&&w>=v?ia:u>=v?ib:ic;for(let q=0;q<4;q++){bones.push(skin.array[dominant*4+q]);boneWeights.push(weights.array[dominant*4+q]);}
   }
   indices.push(start,start+1,start+2,start+2,start+1,start+3);
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(norm,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(bones,4));geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(boneWeights,4));geometry.setIndex(indices);
  const mat=new THREE.MeshStandardMaterial({map,color:source.material.color,roughness:1,side:THREE.DoubleSide,transparent:false,depthWrite:true,opacity:1,alphaTest:.22,alphaToCoverage:true,metalness:0});
  const hair=new THREE.SkinnedMesh(geometry,mat);hair.name=id+' / groomed fur';hair.position.copy(source.position);hair.quaternion.copy(source.quaternion);hair.scale.copy(source.scale);hair.bindMode=source.bindMode;hair.bind(source.skeleton,source.bindMatrix);hair.frustumCulled=false;source.parent.add(hair);
 }
}
