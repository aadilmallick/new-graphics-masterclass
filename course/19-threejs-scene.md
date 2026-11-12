# Your first Three.js scene

You now know the operations a renderer must perform. Three.js packages many of them into reusable objects so you can work at the level of scenes, meshes, cameras, and materials. The earlier math remains active inside that abstraction.

**Experiment:** [Material studio](#/lab/materials). **Reading bridge:** Eck §5.1, updated from the book’s r154 to our pinned r187; [creating a scene](https://threejs.org/manual/en/creating-a-scene.html).

## Four central objects

A `Scene` holds a hierarchy of objects and environment settings. A `Camera` defines viewpoint and projection. A `Mesh` combines geometry with a material. A `Renderer` turns their current state into an image. Geometry says where surface samples are; material says how to shade them. Neither automatically creates the other.

Here is a complete standalone module for a Vite project with Three.js installed. It uses the same setup ideas as the shared lab helper:

```js
import * as THREE from 'three';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
document.body.style.margin = '0';
document.body.append(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color('#0d1721');
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
camera.position.set(3, 2, 5);
camera.lookAt(0, 0, 0);
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({ color: '#82ebcc' });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);
scene.add(new THREE.HemisphereLight('#d9efff', '#283342', 2));
const key = new THREE.DirectionalLight('#ffffff', 3);
key.position.set(3, 5, 4);
scene.add(key);
function resize() {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / Math.max(1, innerHeight);
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();
let previous;
renderer.setAnimationLoop(ms => {
  const dt = previous === undefined ? 0 : Math.min((ms - previous) / 1000, 0.05);
  previous = ms;
  cube.rotation.y += dt * 0.4;
  renderer.render(scene, camera);
});
// Call this when this scene is no longer needed:
function dispose() {
  renderer.setAnimationLoop(null);
  removeEventListener('resize', resize);
  geometry.dispose(); material.dispose(); renderer.dispose();
  renderer.domElement.remove();
}
```

The host HTML needs `<script type="module" src="/main.js"></script>`. The class constructors create resources or scene objects. `scene.add` establishes parent relationships. `setAnimationLoop` schedules repeated updates and renders. The timestamp is milliseconds; `dt` converts elapsed time to seconds and caps a long pause. A production accessible page should honor reduced motion and expose a pause control; our course lab loops suppress automatic motion under that preference.

## Objects and transforms

Most visible Three.js objects inherit from `Object3D`. Its `.position`, `.rotation`, `.quaternion`, and `.scale` determine local transforms. Children inherit parent transforms. `Group` is a convenient transform container. Adding one object to another changes its parent; an object has only one parent at a time.

The library updates matrices during rendering under normal automatic settings. If you query world positions before that, call an appropriate update method such as `updateWorldMatrix` when needed. Do not mix manually edited matrices with automatic property updates accidentally.

## Camera and controls

The camera looks along local -Z. `lookAt` sets its orientation toward a point. `OrbitControls` is an addon, imported from `three/addons/controls/OrbitControls.js`. It changes the camera using pointer input. When damping is enabled, call `controls.update()` in the frame loop. Dispose controls on teardown so event listeners do not accumulate.

The course’s `three-scene.js` helper handles camera setup, orbit controls, lighting, resizing, and disposal. Its render loop calls a lab-specific `update` function before rendering. The helper is intentionally readable: you can trace each Three.js operation back to an idea from the raw pipeline.

## When the first scene is blank

Check that the canvas has a visible size, the camera sees the origin, the mesh is inside near/far planes, and the chosen material has the lighting it requires. `MeshBasicMaterial` ignores lights and is a useful diagnostic. `MeshNormalMaterial` visualizes normals. `AxesHelper`, `GridHelper`, and light-camera helpers reveal coordinate errors. A black standard material can be a missing-light or missing-environment problem rather than a broken mesh.

**Optional application:** replace the box with the studio’s torus knot while retaining camera, lights, and lifecycle. Then put two meshes in one group and rotate the group. This distinguishes changing shape, changing shading, and changing a coordinate frame.
