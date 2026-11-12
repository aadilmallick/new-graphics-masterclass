# Interaction, picking, and accessible controls

A graphics scene becomes a tool when people can act on it predictably. Pointer input, keyboard input, camera controls, selection, and accessible HTML need a shared interaction model. The geometry of picking is only one part of that model.

**Experiment:** [Point into the world](#/lab/picking). **Reading bridge:** Eck §5.3.2; [picking](https://webglfundamentals.org/webgl/lessons/webgl-picking.html) and [Three.js picking](https://threejs.org/manual/en/picking.html).

## From pointer to ray

A pointer event contains CSS coordinates relative to the viewport. Convert them into the canvas rectangle, then to NDC:

```js
const rect = renderer.domElement.getBoundingClientRect();
pointer.set(
  (event.clientX - rect.left) / rect.width * 2 - 1,
  1 - (event.clientY - rect.top) / rect.height * 2
);
raycaster.setFromCamera(pointer, camera);
const hits = raycaster.intersectObjects(selectableObjects);
```

The first value is -1 at the left edge and +1 at the right. The second reverses screen Y. Do not use `innerWidth` if the canvas occupies only a panel. Do not mix buffer pixels into this CSS-to-NDC calculation. `setFromCamera` uses the camera projection and world transform to construct a ray.

A perspective ray starts at the camera and points through the chosen image location. An orthographic ray’s origin varies across the camera plane while directions remain parallel. A ray is represented as $r(t)=o+td$, with origin `o`, direction `d`, and positive distance parameter `t` when `d` is normalized.

## Intersections and selection

Raycasting tests geometry and reports intersections, typically sorted by distance. The picking lab selects the nearest crystal and reports distance and triangle index. It adds a small emissive selection indication without modifying the object’s base material color permanently.

Keep the selectable set explicit. Testing every object, helper, ground plane, and decorative particle can produce surprising selection and unnecessary cost. For nested models, request recursive traversal appropriately and map a hit mesh to the logical object the user recognizes. `InstancedMesh` intersections can include an instance ID, letting many repeated objects remain individually selectable.

CPU raycasting generally sees CPU geometry. A vertex shader can move a surface without updating its CPU mesh, so the hit can disagree with the displayed shape. Solutions include matching CPU deformation, a suitable analytic test, a conservative proxy, or GPU ID picking. Choose based on accuracy and cost.

## GPU ID picking

Render an offscreen pass where each selectable object writes a unique ID, then read the pixel under the pointer. Use exact encoding, no blending, and no color transform that alters IDs. Convert CSS coordinates to the target’s buffer coordinates, including Y orientation. A scissored one-pixel region or a dedicated small view can reduce work, but readback can still synchronize the pipeline.

Transparent objects and multisampled edges require a defined policy. Selection should represent the user’s intended target, which may differ from the nearest opaque triangle. A larger invisible selection proxy can make small objects easier to choose.

## Camera gestures and object gestures

Orbit controls consume pointer movement. Clicking at the end of a drag can accidentally select an object. Track pointer-down position and movement distance; distinguish a click from a camera drag. Use pointer capture when dragging a handle outside its original bounds. Handle cancellation, touch input, and pointer release so controls do not get stuck.

Avoid hijacking page scroll unexpectedly. Give a scene a clear interaction boundary. A full-screen game and a small educational figure need different policies. Provide reset-view and zoom alternatives when freeform camera manipulation could leave a beginner lost.

## Accessibility and communication

Expose material sliders, object lists, and actions as native HTML controls. Give controls specific labels and visible values. Provide a keyboard-selectable list of scene objects if selection matters to a task; the canvas alone is not an accessible object tree. Report selection changes in a status region without narrating every animation frame.

Ensure focus is visible. Do not encode state using color alone. Respect reduced motion and offer pause when ongoing motion is substantial. A textual summary or diagram can convey essential content when a GPU API is unavailable. Our native WebGPU labs show an explicit capability message while leaving lessons and source readable.

**Optional application:** extend the picking lab with five HTML buttons named after its crystals. Each button selects the same logical object as a pointer hit. This creates a shared selection function, improves accessibility, and makes the interaction easier to test.
