import * as THREE from './vendor/three.module.js';

// A fixed route frame: +Z is forward. Facing changes the actor, never the camera.
export function positionCamera(camera,side,{view,targetZ,focusY,aspect,separation=0,end=25,open=false,kPosition}){
 if(view==='retro'){
  const h=3.8,w=h*aspect;side.left=-w;side.right=w;side.top=h;side.bottom=-h;
  side.position.set(-12,3.0,targetZ);side.lookAt(0,1,targetZ);side.updateProjectionMatrix();return side;
 }
 if(view==='crew'){
  const back=aspect<.8?Math.max(2.75,.66/(Math.tan(24*Math.PI/180)*aspect)+Math.min(3,separation*.5)+.5):2.75;
  camera.position.set(aspect<.8?0:.55,1.15,targetZ+back);camera.lookAt(0,.68,targetZ-.15);camera.fov=48;
 }else if(view==='first'){
  camera.position.copy(kPosition).add(new THREE.Vector3(0,1.67,0));camera.lookAt(0,1.1,targetZ+4);camera.fov=65;
 }else{
  const spread=Math.min(3,separation*.5);
  const back=aspect<.8?Math.max(2.8+spread,.66/(Math.tan(25*Math.PI/180)*aspect)+spread+.5):2.8+spread;
  camera.position.set(aspect<.8?0:.65,focusY+.64,Math.max(-4,Math.min(open?28:end-.4,targetZ-back)));
  camera.lookAt(0,focusY+.12,targetZ+1.9);camera.fov=50;
 }
 camera.aspect=aspect;camera.updateProjectionMatrix();return camera;
}

export function movementInput(held,pointers,view='third'){
 const has=(...keys)=>keys.some(k=>held.has(k)),touch=[...pointers];
 // Crew close-up looks back toward Cell 118; its controls follow that view.
 const sign=view==='crew'?-1:1;
 return {axis:sign*((has('KeyW','KeyD','ArrowUp','ArrowRight')||touch.includes('forward')?1:0)-(has('KeyS','KeyA','ArrowDown','ArrowLeft')||touch.includes('back')?1:0))||0,block:has('KeyB')||touch.includes('block'),partnerAxis:sign*((has('KeyI')?1:0)-(has('KeyK')?1:0))||0};
}
