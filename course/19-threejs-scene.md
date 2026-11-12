# Your first Three.js scene

You now know the operations a renderer must perform. Three.js packages many of them into reusable objects so you can work at the level of scenes, meshes, cameras, and materials. The earlier math remains active inside that abstraction.

**Experiment:** [Material studio](#/lab/materials). **Reading bridge:** Eck §5.1, updated from the book’s r154 to our pinned r187; [creating a scene](https://threejs.org/manual/en/creating-a-scene.html).

## Why introduce a scene library after learning the raw pipeline?

In the raw cube example, you were responsible for compiling shaders, uploading records, describing attributes, composing matrices, selecting state, and deleting resources. That is valuable knowledge, but rebuilding it for every creative project would make simple tasks laborious. Three.js supplies reusable implementations of these recurring responsibilities while preserving the underlying concepts. It lets you spend more attention on the scene you want to build.

An abstraction becomes useful when you know which problem it solves. `BoxGeometry` prepares a particular mesh's attributes and indices. `MeshStandardMaterial` selects a managed shading model with supported lighting features. `PerspectiveCamera` produces projection and view relationships from its properties. `WebGLRenderer` translates scene state into compatible shader programs, resources, and draws. None means that coordinates, sampling, and GPU costs have disappeared.

This chapter deliberately begins with one object and a stable viewpoint. The material studio contains a richer environment, shadows, orbit controls, and a torus knot. Those are understandable extensions, but including them all in your first few lines would hide the minimum relationships. Build a visible shape first, then add one responsibility at a time and identify which object owns it.

## Establish the module and browser environment

The supplied project already installs Three.js as an npm package and uses Vite to serve JavaScript modules. An import such as `import * as THREE from 'three'` asks that toolchain to resolve the installed package. A plain browser does not automatically know how the bare name `three` maps to a URL. This is why copying only the import into an arbitrary HTML file opened with `file://` is not the same setup.

The host page needs an HTML document containing a module script reference, for example `<script type="module" src="/main.js"></script>`. The JavaScript example in this chapter is the contents of that module. Run it through the project's development server, or create a separate Vite project with the same dependency. Avoid loading one release of core Three.js and a different release of addons through unrelated URLs; their internal contracts may differ.

The rendering canvas is a DOM element. Appending it puts it in the page, but the page still needs a visible layout. A canvas with zero CSS height can contain valid rendering resources and remain invisible. Our standalone example uses the viewport dimensions for clarity. The course helper instead measures its host panel because the canvas shares the page with navigation and controls. The correct size source depends on the actual layout.

## Read the first object's construction as three decisions

`new THREE.BoxGeometry(1,1,1)` chooses a one-unit box shape. These dimensions use the scene's arbitrary world units; they are not pixels. The geometry is centered around its local origin. Its faces and normals are prepared by the library, following the same principle as the separate face records in the raw cube lab.

`new THREE.MeshStandardMaterial({color:'#82ebcc'})` chooses how to shade that shape. This material expects light or environment input to produce its intended appearance. The color is interpreted through Three.js's color-management conventions. It is not simply a replacement fragment shader that writes those three bytes unchanged to every visible sample.

`new THREE.Mesh(geometry, material)` joins the shape and shading choice into a renderable object. The mesh also has a transform because it is an `Object3D`. Adding it to the scene attaches it to that hierarchy. Creating a mesh without adding it to the rendered scene leaves it as an ordinary JavaScript object that the chosen render call does not traverse.

You can reuse a geometry with several meshes, giving each a different material or transform. Likewise, multiple meshes can share a material, so changing that material affects all its users. This is useful but can surprise you when selecting one object changes the color of several. Clone the material only when you intend independent material state; do not duplicate every resource automatically.

## Place the camera before trying to move the object

A new object at the origin and a new camera at the origin can overlap in an unhelpful way. The camera looks along its local negative Z direction. If the box surrounds the camera, the image may show nothing useful depending on culling and clipping. Position the camera outside the box and orient it toward the origin before diagnosing geometry.

Our example places the camera at `(3,2,5)` and calls `lookAt(0,0,0)`. The distance to the origin is `sqrt(9+4+25)`, about 6.16 world units. With a vertical field of view of 45 degrees, this leaves comfortable framing for a unit box. The near and far distances, 0.1 and 100, include the object without requiring an unnecessarily extreme range for this tiny scene.

The camera's aspect begins as one because actual dimensions are supplied during resize. Setting `camera.aspect` alone changes a property, not the already computed projection matrix. Calling `updateProjectionMatrix()` rebuilds that derived matrix. This distinction between source properties and derived state appears throughout graphics libraries. The library automates many updates during rendering, but projection-property changes still need their documented update path.

## Add light only after the visibility path is understood

A useful first diagnostic material is `MeshBasicMaterial`, which does not depend on scene lighting. If the box is visible with that material, its basic geometry, camera, and render path are probably functioning. Switching to a standard material then introduces a new dependency: illumination. If the result turns dark, that narrows the diagnosis rather than proving the whole scene broke.

The hemisphere light in the example supplies a broad sky-versus-ground color treatment. It makes unshadowed forms readable but is not a complete physical sky simulation. The directional light establishes a stronger direction from a chosen position toward its target. Its role is similar to the directional dot-product light in the raw cube, while the material handles a richer response.

The light's intensity is not a screen brightness percentage. Material response, exposure, tone mapping, other light sources, and environment radiance all influence the final display. Begin with fixed exposure and a neutral material, then adjust the key light to read the form. Raising every intensity simultaneously makes it difficult to understand which relationship changed.

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

## Follow one frame in slow motion

The animation callback receives a timestamp in milliseconds. On the first call there is no earlier timestamp, so `dt` is set to zero. On later calls, subtracting the previous timestamp gives elapsed milliseconds, dividing by a thousand gives seconds, and clamping limits a large pause. Multiplying seconds by 0.4 radians per second gives the rotation increment in radians.

For a 16-millisecond frame, `dt` is 0.016 and the increment is 0.0064 radians. For a 32-millisecond frame, it is 0.0128 radians. Both correspond to the same angular speed over time, unlike adding a fixed increment per rendered frame. A long-tab pause is intentionally treated as a small capped update in this decorative example rather than a demand to simulate every missed moment.

After changing rotation, `renderer.render(scene,camera)` asks the library to update ordinary automatic transforms and render the scene from that camera. The callback does not need to regenerate the box or compile a shader every time. The shape is stable; its transform changes. This separation is one of the main reasons scene libraries make animation concise.

For a nonmoving educational figure, you can render on demand when data, controls, or layout changes. Continuous rendering is convenient while learning and necessary for automatic motion, but it is not a requirement of displaying a Three.js scene. A paused view with no damping or updates can often stop requesting frames to save work.

## Trace the course helper's additional responsibilities

The `setup` function in `labs/three-scene.js` creates the renderer, scene, camera, orbit controls, and default lighting. It exposes an object containing those resources plus an `update` function slot. Each lab assigns its own update behavior while sharing the lifecycle. This is ordinary dependency sharing through a returned JavaScript object, not a hidden scene language.

Its resize path measures the host rectangle, sets renderer size without overwriting the layout's CSS policy, changes camera aspect, and updates the projection. It notifies an optional `onResize` hook so a post-processing lab can resize its own targets. The later bloom example needs that hook because changing the canvas alone does not automatically resize every separate image resource.

Orbit controls use a target point, here near the object's center. Camera position says where the eye is; controls target says what it orbits around. A mismatched target can make the object swing out of frame even though the controls are mathematically functioning. Damping smooths the interaction and requires repeated `controls.update()` calls so the remaining motion can settle.

The helper also caps pixel ratio. At DPR two, a canvas uses four times as many physical samples as the same CSS rectangle at DPR one. This can improve sharpness and raise fragment/shadow/post costs. The cap is an intentional quality/performance choice. It does not change scene distances, camera FOV, or the object's dimensions.

## Diagnose three common first-scene failures

If the page is entirely empty, inspect the console and canvas layout before changing lights. A module import failure means the JavaScript did not reach scene setup. A canvas with zero height means there is no visible drawing region. A missing context can indicate browser/GPU availability. These failures occur before material interpretation matters.

If the background clears correctly but the object is absent, inspect the camera and transform. Use an unlit material and a known mesh at the origin. Verify near/far planes and camera target. A scale of zero collapses geometry; a position far outside the frustum removes it from view. An object added to a different scene is not part of this render call.

If the object appears but looks wrong, inspect normal orientation, material choice, color interpretation, lights, and environment one at a time. A wireframe view helps reveal topology. A normal material exposes orientation. A grid and axes help reveal scale and location. These diagnostic materials and helpers answer specific questions; they are more informative than making random adjustments to a complicated final material.

## When the first scene is blank

Check that the canvas has a visible size, the camera sees the origin, the mesh is inside near/far planes, and the chosen material has the lighting it requires. `MeshBasicMaterial` ignores lights and is a useful diagnostic. `MeshNormalMaterial` visualizes normals. `AxesHelper`, `GridHelper`, and light-camera helpers reveal coordinate errors. A black standard material can be a missing-light or missing-environment problem rather than a broken mesh.

## Give the scene an explicit end

A scene can leave the page while JavaScript references and GPU resources remain alive. Stop animation before disposing the resources it uses. Remove resize and input listeners. Dispose geometries and materials owned by the scene, and dispose controls so their listeners stop. Textures require their own ownership policy; disposing a material does not mean every referenced image should be destroyed if another material shares it.

The standalone example includes a `dispose` function to show that boundary, but it does not automatically call it. A router or component lifecycle should invoke it when replacing the scene. The course website calls the returned lab cleanup function during navigation. This is why you can enter several experiments without intentionally leaving their old render loops running behind the new one.

Keep object motion and camera motion distinct while learning. Moving the mesh one unit right changes its world relationship to the lights and other objects. Moving the camera one unit left can produce a related screen displacement, but it changes the view frame and reflection direction differently. Likewise, `lookAt` sets an orientation toward a point; it does not move the camera to that point. If the image changes unexpectedly after a camera edit, inspect position and orientation separately. A helper axis attached to the object and another at the world origin make those frame relationships visible without changing the object's material.

**Optional application:** replace the box with the studio’s torus knot while retaining camera, lights, and lifecycle. Then put two meshes in one group and rotate the group. This distinguishes changing shape, changing shading, and changing a coordinate frame.
