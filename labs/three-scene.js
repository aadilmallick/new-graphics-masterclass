import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {animate} from './ui.js';
export {THREE};
export function setup(host,{cameraPosition=[5,3.5,7],background=0x0d1721}={}){
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
  renderer.domElement.setAttribute('aria-label','Interactive 3D scene; drag to orbit and scroll to zoom');renderer.domElement.setAttribute('role','img');renderer.domElement.tabIndex=0;host.append(renderer.domElement);
  const scene=new THREE.Scene();scene.background=new THREE.Color(background);const camera=new THREE.PerspectiveCamera(45,1,.1,150);camera.position.set(...cameraPosition);
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.target.set(0,.5,0);controls.update();
  scene.add(new THREE.HemisphereLight(0xc4e7ff,0x212535,1.5));const key=new THREE.DirectionalLight(0xffe4c9,4);key.position.set(3,7,5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-12,right:12,top:12,bottom:-12,near:.5,far:35});key.shadow.normalBias=.03;scene.add(key);
  const fill=new THREE.DirectionalLight(0x86abff,2);fill.position.set(-5,2,-3);scene.add(fill);
  const extraDisposals=[];let renderFn=()=>renderer.render(scene,camera),lastW=0,lastH=0;
  const api={renderer,scene,camera,controls,key,fill,update:()=>{},onResize:()=>{},disposeWith:fn=>extraDisposals.push(fn),setRender:fn=>renderFn=fn};
  const stop=animate((time,dt,reduced)=>{const rect=host.getBoundingClientRect(),w=Math.max(1,rect.width),h=Math.max(1,rect.height);if(w!==lastW||h!==lastH){lastW=w;lastH=h;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();api.onResize(w,h);}
    controls.update();api.update(time,dt,reduced);renderFn();
  });
  api.dispose=()=>{stop();controls.dispose();extraDisposals.forEach(fn=>fn());const geometries=new Set(),materials=new Set(),textures=new Set();scene.traverse(object=>{if(object.geometry)geometries.add(object.geometry);for(const material of object.material?(Array.isArray(object.material)?object.material:[object.material]):[]){materials.add(material);Object.values(material).forEach(v=>{if(v?.isTexture)textures.add(v);});}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());key.shadow.map?.dispose();renderer.dispose();renderer.domElement.remove();};return api;
}
export function floor(scene,size=20){const mesh=new THREE.Mesh(new THREE.PlaneGeometry(size,size),new THREE.MeshStandardMaterial({color:0x182635,roughness:.9}));mesh.rotation.x=-Math.PI/2;mesh.position.y=-.02;mesh.receiveShadow=true;scene.add(mesh);const grid=new THREE.GridHelper(size,size,0x355267,0x203648);grid.position.y=.005;scene.add(grid);return mesh;}
