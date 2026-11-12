import {range,note,fitCanvas,animate} from './ui.js';
export async function mount(host,panel){
  const THREE=await import('three/webgpu');const {color,positionLocal,sin,mix,uniform}=await import('three/tsl');
  const renderer=new THREE.WebGPURenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));host.append(renderer.domElement);renderer.domElement.setAttribute('aria-label','Three.js node material rendered through WebGPURenderer');
  try{await renderer.init();const scene=new THREE.Scene();scene.background=new THREE.Color(0x0d1721);const camera=new THREE.PerspectiveCamera(45,1,.1,50);camera.position.set(0,0,5);
    const frequency=uniform(5),phase=uniform(0),material=new THREE.MeshBasicNodeMaterial();const stripe=sin(positionLocal.y.mul(frequency).add(phase)).mul(.5).add(.5);material.colorNode=mix(color('#84aaff'),color('#82ebcc'),stripe);
    const geometry=new THREE.TorusKnotGeometry(1,.3,160,24),mesh=new THREE.Mesh(geometry,material);scene.add(mesh);range(panel,'Stripe frequency',1,15,5,.1,v=>frequency.value=v);note(panel,'A TSL expression graph describes a shader using JavaScript. WebGPURenderer may select WebGPU or fall back to WebGL 2. This is separate from the native WGSL labs.');let phaseTime=0;
    const stop=animate((t,dt,reduced)=>{const rect=host.getBoundingClientRect();renderer.setSize(Math.max(1,rect.width),Math.max(1,rect.height),false);camera.aspect=rect.width/Math.max(1,rect.height);camera.updateProjectionMatrix();if(!reduced){phaseTime+=dt;mesh.rotation.y+=dt*.2;}phase.value=phaseTime;renderer.render(scene,camera);});return ()=>{stop();geometry.dispose();material.dispose();renderer.dispose();renderer.domElement.remove();};
  }catch(error){renderer.dispose();throw error;}
}
