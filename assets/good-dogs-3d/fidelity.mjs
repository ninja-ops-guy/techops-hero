import * as THREE from './vendor/three.module.js';

// Materials are evaluated in object/world metres, so no external texture request
// or frame-dependent random texture is needed. This is all presentation state.
const noiseGLSL=`
float hash31(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
float noise3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash31(i),hash31(i+vec3(1,0,0)),f.x),mix(hash31(i+vec3(0,1,0)),hash31(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash31(i+vec3(0,0,1)),hash31(i+vec3(1,0,1)),f.x),mix(hash31(i+vec3(0,1,1)),hash31(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){return noise3(p)*.56+noise3(p*2.03)*.28+noise3(p*4.11)*.12+noise3(p*8.17)*.04;}
vec3 surfaceBump(vec3 N,vec3 pos,float h,float amount){vec3 dx=dFdx(pos),dy=dFdy(pos);vec3 r1=cross(dy,N),r2=cross(N,dx);float det=dot(dx,r1);vec3 grad=sign(det)*(dFdx(h)*r1+dFdy(h)*r2);return normalize(abs(det)*N-amount*grad);}
`;

export function surface(material,kind,{world=false}={}){
 material.userData.detailKind=kind;
 material.onBeforeCompile=shader=>{
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vDetail;');
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvDetail = '+(world?'vec3(0.);\nvec4 detailP=vec4(position,1.);\n#ifdef USE_INSTANCING\ndetailP=instanceMatrix*detailP;\n#endif\nvDetail=(modelMatrix*detailP).xyz':'position')+';');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vDetail;\n'+noiseGLSL);
  const steel=`float grain=fbm(vDetail*14.);float pits=noise3(vDetail*135.);float oxide=smoothstep(.57,.77,fbm(vDetail*3.2+9.));float scratches=pow(noise3(vDetail*vec3(220.,4.,8.)),14.);diffuseColor.rgb*=.68+.45*grain;diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.14,.065,.025),oxide*.35);diffuseColor.rgb+=scratches*.045;float relief=grain*.07+pits*.006;`;
  const floor=`float grain=fbm(vDetail*12.);float wet=smoothstep(.46,.69,fbm(vDetail*2.1));float tread=pow(abs(sin((vDetail.x+vDetail.z)*52.)*sin((vDetail.x-vDetail.z)*52.)),8.);diffuseColor.rgb*=.74+.36*grain;diffuseColor.rgb*=mix(1.,.63,wet);float relief=grain*.04+tread*.026;`;
  const cloth=`float fibers=noise3(vDetail*460.);float weave=sin(vDetail.x*1000.)*sin(vDetail.z*850.);diffuseColor.rgb*=.85+.28*fibers;float relief=weave*.018+fibers*.016;`;
  const knit=`float rows=sin(vDetail.z*630.+sin(vDetail.x*440.)*1.9);float knit=pow(abs(sin(vDetail.x*460.)*.6+rows*.4),2.);diffuseColor.rgb*=.74+.50*knit;float relief=knit*.026+noise3(vDetail*850.)*.012;`;
  const fur=`float strands=noise3(vDetail*270.);diffuseColor.rgb*=.83+.22*strands;float relief=strands*.028;`;
  const camo=`float camoField=fbm(vDetail*vec3(21.,17.,23.));vec3 fabric=mix(vec3(.095,.11,.07),vec3(.22,.19,.115),smoothstep(.38,.50,camoField));fabric=mix(fabric,vec3(.042,.048,.029),smoothstep(.58,.63,camoField));diffuseColor.rgb=fabric*(.83+.23*noise3(vDetail*450.));float relief=noise3(vDetail*370.)*.024;`;
  const leather=`float grain=fbm(vDetail*180.);float creases=pow(1.-abs(2.*noise3(vDetail*vec3(16.,45.,12.))-1.),9.);diffuseColor.rgb*=.82+.40*grain-creases*.12;float relief=grain*.014-creases*.015;`;
  const code=({steel,floor,cloth,knit,fur,camo,leather})[kind]||cloth;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n'+code);
  shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\nnormal=surfaceBump(normal,-vViewPosition,relief,'+(world?'.035':'.025')+');');
  if(kind==='floor')shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(.68,.24,wet);');
  if(kind==='steel')shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=clamp(roughnessFactor+oxide*.22+(grain-.5)*.10,.24,.94);');
 };
 material.customProgramCacheKey=()=>`gooddogs-fidelity-v1-${kind}-${world}`;
 return material;
}

export function dressActors(object){
 const cache=new Map();
 object.traverse(o=>{
  if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=true;
  const convert=m=>{
   if(cache.has(m))return cache.get(m);
   const p=new THREE.MeshPhysicalMaterial();THREE.MeshStandardMaterial.prototype.copy.call(p,m);
   const name=m.name.toLowerCase();let kind;
   if(name.includes('knit')){kind='knit';p.sheen=.85;p.sheenColor.set(0x65666c);p.sheenRoughness=.92;}
   else if(name.includes('cloth')){kind='camo';p.sheen=.4;p.sheenColor.set(0x77714e);p.sheenRoughness=.95;}
   else if(name.includes('fur')){kind='fur';p.roughness=.94;p.sheen=.35;p.sheenColor.copy(p.color).multiplyScalar(1.1);p.sheenRoughness=.9;}
   else if(name.includes('leather')){kind='leather';p.clearcoat=.22;p.clearcoatRoughness=.55;p.roughness=.49;}
   else if(name.includes('gold')||name.includes('silver')){p.metalness=1;p.roughness=.24;}
   else if(name.includes('eye')||name.includes('nose')){p.clearcoat=1;p.roughness=.22;}
   if(kind)surface(p,kind);p.envMapIntensity=.8;cache.set(m,p);return p;
  };
  o.material=Array.isArray(o.material)?o.material.map(convert):convert(o.material);
 });
 // Imported materials have no external textures in this revision.
 for(const old of cache.keys())old.dispose();
}

export function environmentMap(renderer){
 const room=new THREE.Scene();room.background=new THREE.Color(0x10151b);
 const shell=new THREE.Mesh(new THREE.BoxGeometry(14,8,18),new THREE.MeshBasicMaterial({color:0x363431,side:THREE.BackSide}));room.add(shell);
 const geometry=new THREE.PlaneGeometry(1,1),mats=[];
 for(const [x,y,z,w,h,c,intensity,ry] of [[0,3.8,0,6,5,0xffbc69,5,Math.PI/2],[-6.9,1,0,7,2,0x7599bf,2,Math.PI/2],[6.9,1,0,7,1,0xffba68,4,-Math.PI/2],[0,1,-8.9,6,2,0xb4d4e1,1.5,0]]){
  const m=new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(intensity),side:THREE.DoubleSide});mats.push(m);const o=new THREE.Mesh(geometry,m);o.position.set(x,y,z);o.scale.set(w,h,1);if(y>3)o.rotation.x=Math.PI/2;else o.rotation.y=ry;room.add(o);
 }
 const pmrem=new THREE.PMREMGenerator(renderer),target=pmrem.fromScene(room,.08,.1,50);pmrem.dispose();shell.geometry.dispose();shell.material.dispose();geometry.dispose();mats.forEach(m=>m.dispose());return target;
}

// One linear HDR scene target, two half-resolution bloom targets and one final
// pass. Depth occlusion affects only opaque scene pixels; HUD is drawn later.
export function filmPipeline(renderer){
 const hdr=renderer.extensions.has('EXT_color_buffer_float');
 const type=hdr?THREE.HalfFloatType:THREE.UnsignedByteType;
 const target=new THREE.WebGLRenderTarget(1,1,{type,depthBuffer:true});
 target.depthTexture=new THREE.DepthTexture(1,1,THREE.UnsignedIntType);
 const ping=new THREE.WebGLRenderTarget(1,1,{type,depthBuffer:false}),pong=ping.clone();
 const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
 const vertex=`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
 const bloom=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,toneMapped:false,uniforms:{source:{value:null},stepUV:{value:new THREE.Vector2()},threshold:{value:1}},vertexShader:vertex,fragmentShader:`varying vec2 vUv;uniform sampler2D source;uniform vec2 stepUV;uniform float threshold;vec3 tap(vec2 p){vec3 c=texture2D(source,p).rgb;float l=max(c.r,max(c.g,c.b));return c*max(0.,l-threshold)/max(.001,l);}void main(){vec3 c=tap(vUv)*.227027;c+=(tap(vUv+stepUV*1.384615)+tap(vUv-stepUV*1.384615))*.316216;c+=(tap(vUv+stepUV*3.230769)+tap(vUv-stepUV*3.230769))*.070270;gl_FragColor=vec4(c,1.);}`});
 const final=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,toneMapped:false,uniforms:{colorMap:{value:target.texture},depthMap:{value:target.depthTexture},bloomMap:{value:pong.texture},inverseSize:{value:new THREE.Vector2()},clip:{value:new THREE.Vector2()},orthographic:{value:false},bloomStrength:{value:.2},aoStrength:{value:.35},exposure:{value:1.15}},vertexShader:vertex,fragmentShader:`
 varying vec2 vUv;uniform sampler2D colorMap,depthMap,bloomMap;uniform vec2 inverseSize,clip;uniform bool orthographic;uniform float bloomStrength,aoStrength,exposure;
 float linearZ(float z){return orthographic?mix(clip.x,clip.y,z):clip.x*clip.y/(clip.y-z*(clip.y-clip.x));}
 vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
 void main(){float z=linearZ(texture2D(depthMap,vUv).r),occlusion=0.;for(int i=0;i<8;i++){float a=float(i)*.785398;vec2 offset=vec2(cos(a),sin(a))*inverseSize*(3.+float(i%3)*2.);float sampleZ=linearZ(texture2D(depthMap,vUv+offset).r);float delta=z-sampleZ;occlusion+=smoothstep(.012,.10,delta)*(1.-smoothstep(.10,.55,abs(delta)));}vec3 c=texture2D(colorMap,vUv).rgb*(1.-occlusion*.125*aoStrength);c+=texture2D(bloomMap,vUv).rgb*bloomStrength;c=aces(c*exposure);vec2 p=vUv-.5;float vignette=1.-.28*smoothstep(.12,.65,dot(p,p)*1.6);c*=vignette;c=pow(max(c,vec3(0.)),vec3(1./2.2));gl_FragColor=vec4(c,1.);}
 `});
 const quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),bloom);scene.add(quad);let width=0,height=0;
 return {
  render(world,view,w,h,{quality='high',retro=false}={}){
   if(w!==width||h!==height){width=w;height=h;target.setSize(w,h);ping.setSize(Math.max(1,w>>1),Math.max(1,h>>1));pong.setSize(Math.max(1,w>>1),Math.max(1,h>>1));final.uniforms.inverseSize.value.set(1/w,1/h);}
   const previous=renderer.getRenderTarget();
   try{
    renderer.setRenderTarget(target);renderer.render(world,view);
    quad.material=bloom;bloom.uniforms.source.value=target.texture;bloom.uniforms.threshold.value=1.1;bloom.uniforms.stepUV.value.set(2/w,0);renderer.setRenderTarget(ping);renderer.render(scene,camera);
    bloom.uniforms.source.value=ping.texture;bloom.uniforms.threshold.value=0;bloom.uniforms.stepUV.value.set(0,2/h);renderer.setRenderTarget(pong);renderer.render(scene,camera);
    quad.material=final;final.uniforms.clip.value.set(view.near,view.far);final.uniforms.orthographic.value=!!view.isOrthographicCamera;final.uniforms.bloomStrength.value=retro?0:.2;final.uniforms.aoStrength.value=retro?0:quality==='high'?.52:.25;renderer.setRenderTarget(previous);renderer.render(scene,camera);
   }finally{renderer.setRenderTarget(previous);}
  },
  dispose(){target.dispose();ping.dispose();pong.dispose();quad.geometry.dispose();bloom.dispose();final.dispose();},
  get hdr(){return hdr;}
 };
}

export const QUALITY={high:{pixelRatio:1.5,shadow:2048},balanced:{pixelRatio:1,shadow:1024},low:{pixelRatio:.75,shadow:0}};
