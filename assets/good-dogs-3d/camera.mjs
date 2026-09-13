import * as THREE from './vendor/three.module.js';

// A fixed route frame: +Z is forward. Facing changes the actor, never the camera.
export function positionCamera(camera,side,{view,targetZ,focusY,aspect,separation=0,end=25,open=false,kPosition}){
 if(view==='retro'){
  const h=3.8,w=h*aspect;side.left=-w;side.right=w;side.top=h;side.bottom=-h;
  side.position.set(-12,3.0,targetZ);side.lookAt(0,1,targetZ);side.updateProjectionMatrix();return side;
 }
 if(view==='crew'){
  camera.position.set(.55,1.15,targetZ+3.25);camera.lookAt(0,1.04,targetZ-.35);camera.fov=48;
 }else if(view==='first'){
  camera.position.copy(kPosition).add(new THREE.Vector3(0,1.67,0));camera.lookAt(0,1.1,targetZ+4);camera.fov=65;
 }else{
  const back=3.1+Math.min(3,separation*.5)+(aspect<.8?1.5:0);
  camera.position.set(.65,focusY+.80,Math.max(-4,Math.min(open?28:end-.4,targetZ-back)));
  camera.lookAt(0,focusY+.12,targetZ+2.8);camera.fov=50;
 }
 camera.aspect=aspect;camera.updateProjectionMatrix();return camera;
}

export function movementInput(held,pointers,view='third'){
 const has=(...keys)=>keys.some(k=>held.has(k)),touch=[...pointers];
 // Crew close-up looks back toward Cell 118; its controls follow that view.
 const sign=view==='crew'?-1:1;
 return {axis:sign*((has('KeyW','KeyD','ArrowUp','ArrowRight')||touch.includes('forward')?1:0)-(has('KeyS','KeyA','ArrowDown','ArrowLeft')||touch.includes('back')?1:0))||0,block:has('KeyB')||touch.includes('block'),partnerAxis:sign*((has('KeyI')?1:0)-(has('KeyK')?1:0))||0};
}
