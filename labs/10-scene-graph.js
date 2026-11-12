import {setup,THREE} from './three-scene.js';import {range,note} from './ui.js';
export function mount(host,panel){
  const app=setup(host,{cameraPosition:[0,8,12]});app.controls.target.set(0,0,0);let speed=.6;
  const sun=new THREE.Mesh(new THREE.SphereGeometry(.75,32,24),new THREE.MeshBasicMaterial({color:0xffc183}));app.scene.add(sun);
  const orbit=new THREE.Group();app.scene.add(orbit);const planet=new THREE.Mesh(new THREE.SphereGeometry(.4,32,24),new THREE.MeshStandardMaterial({color:0x82ebcc,roughness:.5}));planet.position.x=3;orbit.add(planet);
  const moonPivot=new THREE.Group();moonPivot.position.x=3;orbit.add(moonPivot);const moon=new THREE.Mesh(new THREE.SphereGeometry(.15,24,16),new THREE.MeshStandardMaterial({color:0xb6c8df}));moon.position.x=1;moonPivot.add(moon);
  const ring=new THREE.Mesh(new THREE.RingGeometry(2.98,3.02,128),new THREE.MeshBasicMaterial({color:0x2e5367,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;app.scene.add(ring);app.scene.add(new THREE.AxesHelper(5));
  range(panel,'Time scale',0,2,speed,.01,v=>speed=v);const info=note(panel,'');note(panel,'The planet’s local x remains 3. Its world coordinates change because its parent rotates. The moon inherits two parent transforms. Distances and times are illustrative.');
  let phase=0;const world=new THREE.Vector3();app.update=(t,dt,reduced)=>{if(!reduced)phase+=dt*speed;orbit.rotation.y=phase;moonPivot.rotation.y=phase*2;planet.rotation.y=phase*3;planet.getWorldPosition(world);info.textContent=`Planet local = (3, 0, 0) · world = (${world.x.toFixed(2)}, ${world.y.toFixed(2)}, ${world.z.toFixed(2)})`;};return app.dispose;
}
