import {setup,THREE,floor} from './three-scene.js';import {range,select,note} from './ui.js';
export function mount(host,panel){
  const app=setup(host);floor(app.scene);const material=new THREE.MeshStandardMaterial({color:0x82ebcc,roughness:.25,metalness:.65});
  const mesh=new THREE.Mesh(new THREE.TorusKnotGeometry(1,.32,180,28),material);mesh.position.y=1.65;mesh.castShadow=true;app.scene.add(mesh);
  // A procedural environment supplies reflected radiance without external images.
  const envScene=new THREE.Scene();envScene.background=new THREE.Color(0x243b54);const card=new THREE.Mesh(new THREE.PlaneGeometry(12,8),new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide}));card.position.set(0,7,0);card.rotation.x=Math.PI/2;envScene.add(card);const warm=card.clone();warm.material=new THREE.MeshBasicMaterial({color:0xffc393,side:THREE.DoubleSide});warm.position.set(-5,1,0);warm.rotation.set(0,Math.PI/2,0);envScene.add(warm);
  const pmrem=new THREE.PMREMGenerator(app.renderer),environment=pmrem.fromScene(envScene,.04);app.scene.environment=environment.texture;app.disposeWith(()=>{environment.dispose();pmrem.dispose();card.geometry.dispose();card.material.dispose();warm.material.dispose();});
  range(panel,'Roughness',0,1,.25,.01,v=>material.roughness=v);range(panel,'Metalness',0,1,.65,.01,v=>material.metalness=v);range(panel,'Exposure',.2,2.5,1.2,.01,v=>app.renderer.toneMappingExposure=v);
  select(panel,'Surface',{solid:'Lit material',wire:'Wireframe'},v=>material.wireframe=v==='wire');range(panel,'Key light',0,10,4,.1,v=>app.key.intensity=v);
  note(panel,'Drag the scene to orbit. Roughness spreads reflections; metalness changes how base color participates in reflection. The procedural studio environment provides something for the surface to reflect.');
  app.update=(t,dt,reduced)=>{if(!reduced)mesh.rotation.y+=dt*.15;};return app.dispose;
}
