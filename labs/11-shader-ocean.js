import {setup,THREE} from './three-scene.js';import {range,note} from './ui.js';
export function mount(host,panel){
  const app=setup(host,{cameraPosition:[4,4,6]});const uniforms={uTime:{value:0},uAmplitude:{value:.35},uFrequency:{value:2.2}};
  const material=new THREE.ShaderMaterial({uniforms,side:THREE.DoubleSide,vertexShader:`uniform float uTime,uAmplitude,uFrequency;varying vec3 vNormal;varying float vHeight;
void main(){vec3 p=position;float a=p.x*uFrequency+uTime,b=p.y*uFrequency*.8-uTime*.7;
p.z=uAmplitude*(sin(a)+.5*cos(b));vec3 dx=vec3(1.,0.,uAmplitude*uFrequency*cos(a));vec3 dy=vec3(0.,1.,-.4*uAmplitude*uFrequency*sin(b));
vNormal=normalize(normalMatrix*cross(dx,dy));vHeight=p.z;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,fragmentShader:`varying vec3 vNormal;varying float vHeight;
void main(){vec3 n=normalize(vNormal);float light=.2+.8*max(dot(n,normalize(vec3(.3,1.,1.))),0.);vec3 c=mix(vec3(.015,.09,.19),vec3(.25,.8,.65),smoothstep(-.5,.5,vHeight));gl_FragColor=vec4(c*light,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});
  const ocean=new THREE.Mesh(new THREE.PlaneGeometry(9,9,180,180),material);ocean.rotation.x=-Math.PI/2;app.scene.add(ocean);
  range(panel,'Wave amplitude',0,1,.35,.01,v=>uniforms.uAmplitude.value=v);range(panel,'Spatial frequency',.4,6,2.2,.01,v=>uniforms.uFrequency.value=v);note(panel,'Vertex positions move on the GPU. The normal is rebuilt from analytic surface derivatives, so highlights follow the waves. This ShaderMaterial lab uses the WebGL renderer.');
  let time=0;app.update=(t,dt,reduced)=>{if(!reduced)time+=dt;uniforms.uTime.value=time;};return app.dispose;
}
