import * as THREE from './vendor/three.module.js';

// Keep the original skeleton and skin weights. The disconnected curl clusters
// are removed before adding curved, skinned fur cards over the undercoat.
export function softenCurls(geometry){
 const p=geometry.attributes.position,n=geometry.attributes.normal,ix=geometry.index;
 if(!p||!n||!ix)return;
 const parents=Int32Array.from({length:p.count},(_,i)=>i);
 function root(i){while(parents[i]!==i){parents[i]=parents[parents[i]];i=parents[i];}return i;}
 for(let i=0;i<ix.count;i+=3){const a=root(ix.getX(i));parents[root(ix.getX(i+1))]=a;parents[root(ix.getX(i+2))]=a;}
 const clusters=new Map();for(let i=0;i<p.count;i++){const r=root(i);if(!clusters.has(r))clusters.set(r,[]);clusters.get(r).push(i);}
 const hidden=new Set();
 for(const ids of clusters.values())if(ids.length===15||ids.length===50)ids.forEach(i=>hidden.add(i));
 const triangles=[];for(let i=0;i<ix.count;i+=3)if(!hidden.has(ix.getX(i)))triangles.push(ix.getX(i),ix.getX(i+1),ix.getX(i+2));
 geometry.setIndex(triangles);
 p.needsUpdate=n.needsUpdate=true;geometry.computeBoundingSphere();
}

export function identityDetails(actor,id){
 if(id==='k')return;
 const c=document.createElement('canvas');c.width=768;c.height=192;const x=c.getContext('2d');
 x.clearRect(0,0,768,192);x.font='bold 112px Georgia';x.textAlign='center';x.textBaseline='middle';x.fillStyle='#d8af55';x.fillText(id==='katrin'?'Katrin':'Manchez',384,96,730);
 const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;
 const tag=new THREE.Mesh(new THREE.PlaneGeometry(.30,.075),new THREE.MeshStandardMaterial({map,transparent:true,alphaTest:.15,roughness:.7,metalness:.5,side:THREE.DoubleSide}));
 tag.name=id+' / embroidered name';tag.position.set(0,actor.userData.videoMatch?.43:.37,actor.userData.videoMatch?.319:.345);tag.rotation.x=-.20;actor.add(tag);
 (actor.userData.detailTextures??=[]).push(map);
 if(actor.userData.videoMatch)return;
 // The reference chain is a prominent collar, with individual interlocked links.
 const gold=new THREE.MeshStandardMaterial({color:0xd5a748,metalness:.92,roughness:.29});
 const geometry=new THREE.TorusGeometry(.017,.0042,6,14);
 const links=new THREE.InstancedMesh(geometry,gold,32),o=new THREE.Object3D();
 for(let i=0;i<32;i++){
  const a=i/32*Math.PI*2;o.position.set(Math.cos(a)*.188,.49-Math.sin(a)*.04,.18+Math.sin(a)*.16);o.rotation.set(Math.PI/2+(i%2)*.65,0,a);o.scale.set(1.2,.85,1);o.updateMatrix();links.setMatrixAt(i,o.matrix);
 }
 links.computeBoundingSphere();actor.add(links);

}
