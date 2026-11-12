# Interaction, picking, and accessible controls

A graphics scene becomes a tool when people can act on it predictably. Pointer input, keyboard input, camera controls, selection, and accessible HTML need a shared interaction model. The geometry of picking is only one part of that model.

**Experiment:** [Point into the world](#/lab/picking). **Reading bridge:** Eck §5.3.2; [picking](https://webglfundamentals.org/webgl/lessons/webgl-picking.html) and [Three.js picking](https://threejs.org/manual/en/picking.html).

## Start with the user's action rather than the intersection algorithm

“Select that object” sounds like one action, but the application must answer several questions. Which screen region belongs to the scene? Is the user clicking or dragging the camera? Which visual elements are selectable? If several surfaces overlap, which logical object should be chosen? How is that selection communicated to someone using a keyboard or unable to interpret a color change?

These are interaction-model decisions. A mathematically correct ray can intersect a decorative helper that the user never intended to select. A physically nearest triangle can belong to a transparent cover while the intended control is behind it. Begin by defining the selectable set and the behavior, then choose an intersection technique that implements that behavior.

The picking lab makes the policy small and visible. It has five crystals in an explicit array. The floor and grid are not in that selectable array. A pointer hit selects the nearest crystal, and an HTML selector chooses from the same logical objects. The selected object's emissive contribution changes slightly, while a textual status identifies it. This keeps selection state separate from how the input arrived.

## Work through the coordinate conversion with actual numbers

Suppose the canvas rectangle begins 200 CSS pixels from the viewport's left edge and 100 from the top. Its width is 800 and height 400. A pointer at viewport `(600,200)` is therefore at canvas-relative `(400,100)`. Subtracting the rectangle origin is essential: dividing the viewport coordinates directly by canvas size would include the sidebar and header offsets.

Normalize within the rectangle: horizontal fraction is `400/800 = 0.5`, vertical fraction is `100/400 = 0.25`. Remap X from zero-to-one into minus-one-to-one: `2*0.5-1 = 0`. Reverse and remap Y: `1-2*0.25 = 0.5`. The resulting NDC pointer is `(0,0.5)`, horizontally centered and halfway between screen center and the top edge.

If the display has DPR two, the drawing buffer may be 1600 by 800, but this calculation still uses CSS event coordinates and CSS rectangle dimensions. Multiplying the pointer by two while leaving the rectangle unchanged would mix units. For GPU pixel readback you will later convert into the target's physical pixel coordinates. That is a different boundary, so perform it deliberately rather than carrying an unexplained DPR factor through every stage.

The following complete console example isolates this arithmetic:

```js
function pointerToNDC(clientX, clientY, rect) {
  return [
    2 * (clientX - rect.left) / rect.width - 1,
    1 - 2 * (clientY - rect.top) / rect.height
  ];
}
console.log(pointerToNDC(600, 200,
  {left: 200, top: 100, width: 800, height: 400}));
// [0, 0.5]
```

In production, handle a zero-sized or unavailable rectangle before dividing. The visible canvas may be temporarily hidden during layout or tab changes. CSS transforms and unusual page compositions also deserve testing against the actual measured rectangle. The simple formula is correct for the ordinary displayed rectangular canvas used by this course.

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

## Explain how a screen point defines a 3D ray

A perspective camera collapses depth into an image. One screen location corresponds not to one world point, but to a line of possible points extending from the camera through that image direction. To select geometry, construct that ray and find where it first intersects a selectable surface.

Conceptually, choose the screen X/Y and a near-depth coordinate, undo projection and view transforms to recover a world-space point, then subtract the camera position to obtain a direction. Normalize that direction if you want the ray parameter to measure world distance. `Raycaster.setFromCamera` handles this camera-specific construction through the library's conventions. Its usefulness comes from a clear mathematical task, not a mysterious connection between the mouse and a mesh.

For an orthographic camera, rays through different image locations are parallel. Their origins vary across the camera plane. This is why manually using the same perspective-style camera origin for every orthographic ray would be incorrect. A camera-aware library operation is valuable precisely because the underlying projection models differ.

Once constructed, the ray equation is `origin + t*direction`. An intersection method finds t values satisfying the geometry's constraints. A sphere has an analytic quadratic solution; a triangle uses a ray-triangle test; a complex mesh repeats tests with acceleration and bounds where appropriate. The later ray-rendering chapter derives a sphere intersection, so selection and ray-based image generation share a reusable geometric idea.

## Turn a geometric hit into application state

An intersection result can contain distance, hit point, face data, and an object reference. The application often needs a more stable logical identity. For example, a loaded car may consist of separate wheel, glass, and body meshes, but clicking any of them should select “Car.” Store a relationship from renderable mesh to the logical entity rather than making every material primitive an unrelated selectable item.

The lab's `choose` function is the shared state boundary. It clears the previous object's selection emission, stores the new object, applies the new indication, and synchronizes the HTML selector. The pointer handler only computes a hit and calls that function. The selector handler only identifies an object and calls the same function. This avoids two almost-identical implementations that gradually disagree.

A selected object should not lose its original artistic material state permanently. The lab changes a controlled emissive value because its initial emissive contribution is known. A more general application should store and restore the appropriate previous state or use an independent selection outline/overlay. If several meshes share one material, changing that material can highlight them all. Resource sharing is relevant to interaction as well as rendering efficiency.

## Intersections and selection

Raycasting tests geometry and reports intersections, typically sorted by distance. The picking lab selects the nearest crystal and reports distance and triangle index. It adds a small emissive selection indication without modifying the object’s base material color permanently.

Keep the selectable set explicit. Testing every object, helper, ground plane, and decorative particle can produce surprising selection and unnecessary cost. For nested models, request recursive traversal appropriately and map a hit mesh to the logical object the user recognizes. `InstancedMesh` intersections can include an instance ID, letting many repeated objects remain individually selectable.

CPU raycasting generally sees CPU geometry. A vertex shader can move a surface without updating its CPU mesh, so the hit can disagree with the displayed shape. Solutions include matching CPU deformation, a suitable analytic test, a conservative proxy, or GPU ID picking. Choose based on accuracy and cost.

## Distinguish a click from a camera drag

Orbit controls respond to pointer movement over the scene. A browser may dispatch a click after a drag-like gesture depending on the sequence. If every click selects, ending a camera orbit can unexpectedly choose an object. Record the initial pointer position and compare total movement before treating the release as a selection gesture.

A small threshold can distinguish a stationary press from movement, but it should be expressed in sensible screen units and tested with mouse and touch. Pointer identity matters when multiple pointers participate. Cancellation matters too: a lost pointer or interrupted gesture should not leave the application believing a drag is still active.

Pointer capture lets a dragging control continue receiving relevant events even after the pointer leaves its initial hit region. A translation handle or slider-like 3D interaction can need that behavior. Release capture and clear state appropriately. Do not assume every interaction ends through the ordinary pointer-up path; cancellation and window changes are part of the lifecycle.

The course lab intentionally keeps its pointer handler simple, while providing a keyboard selector. A production editor can add drag discrimination, hover feedback, handles, and camera reset. These should remain explicit extensions of one selection/gesture model, not independent listeners that compete without coordination.

## Camera gestures and object gestures

Orbit controls consume pointer movement. Clicking at the end of a drag can accidentally select an object. Track pointer-down position and movement distance; distinguish a click from a camera drag. Use pointer capture when dragging a handle outside its original bounds. Handle cancellation, touch input, and pointer release so controls do not get stuck.

Avoid hijacking page scroll unexpectedly. Give a scene a clear interaction boundary. A full-screen game and a small educational figure need different policies. Provide reset-view and zoom alternatives when freeform camera manipulation could leave a beginner lost.

## Know which geometry a CPU raycaster can see

CPU raycasting generally tests the geometry representation stored on the CPU. If a shader displaces vertices into a wave, the CPU may still see the original plane. A pointer can then appear to hit below the visible crest or miss the visible displaced edge. This is not evidence that the coordinate conversion is wrong; it is evidence that the query and renderer use different surfaces.

One solution is to evaluate the same deformation on the CPU for queries, where affordable. Another is an analytic intersection with the known surface rule. A conservative proxy can deliberately simplify the target, useful when interaction tolerance matters more than exact triangle identity. GPU ID picking can query the displayed result more directly under an appropriate rendering policy.

An instanced mesh adds another identity layer. Many visible objects share one mesh and geometry, so an object reference alone may not identify the intended instance. Use the reported instance identity and connect it to application data. Updating a selected instance's color or transform also requires the relevant buffer update flag and possibly bound maintenance.

## Derive the readback pixel conversion separately

For GPU ID picking, the pointer must select a pixel in the picking target. If a canvas-relative CSS point is `(400,100)` in an 800 by 400 rectangle and the target is 1600 by 800, the target coordinate is approximately `(800,200)` in a top-origin interpretation. A WebGL readback uses a bottom-origin framebuffer convention, so convert Y according to the exact pixel-index policy, commonly using target height minus one minus the top-origin integer index.

The minus one appears because pixel indices range from zero to height minus one. Coordinates on a right or bottom boundary should be clamped or rejected rather than indexing outside the resource. If the picking target has a different resolution from the visible drawing buffer, use its own dimensions. This is why naming `cssPointer`, `ndcPointer`, and `pickPixel` prevents subtle off-by-one and scaling bugs.

The ID pass should preserve IDs exactly. Blending, tone mapping, output encoding, and some filtering operations can alter values. Antialiased boundaries can mix contributions under some strategies, so establish how edge pixels are interpreted. The visual material may be beautifully color-managed while the ID material needs a numerical data path with entirely different rules.

Readback can force synchronization if JavaScript requests results before the GPU has completed them. Occasional clicks may tolerate that cost; continuous hover at high frame rate can need a different asynchronous or throttled strategy. Choosing GPU picking does not make every interaction free. Profile the actual pattern of requests.

## GPU ID picking

Render an offscreen pass where each selectable object writes a unique ID, then read the pixel under the pointer. Use exact encoding, no blending, and no color transform that alters IDs. Convert CSS coordinates to the target’s buffer coordinates, including Y orientation. A scissored one-pixel region or a dedicated small view can reduce work, but readback can still synchronize the pipeline.

Transparent objects and multisampled edges require a defined policy. Selection should represent the user’s intended target, which may differ from the nearest opaque triangle. A larger invisible selection proxy can make small objects easier to choose.

## Make the essential interaction available outside the canvas

A canvas supplies pixels, not an automatic accessible tree of scene objects. An HTML selector or button list can expose logical objects to keyboard users and assistive technology. The picking lab's selector is a complete example of sharing selection logic across visual and nonvisual input. A status region announces the selected name and relevant feedback without requiring someone to infer a subtle green tint.

Avoid announcing continuously changing simulation coordinates every frame unless the user explicitly asks for such monitoring. Excessive live updates can overwhelm useful feedback. Report meaningful events such as selection, loading completion, or an unavailable capability. Give controls visible labels and current values, and retain visible focus.

A reset-view button is valuable even for users who can orbit freely. It provides a known state after an accidental zoom or rotation and helps beginners compare examples. A pause or reduced-motion presentation lets the user inspect geometry without chasing continuous movement. These controls are part of making the underlying graphics understandable, not merely a compliance layer added after the image is finished.

## Accessibility and communication

Expose material sliders, object lists, and actions as native HTML controls. Give controls specific labels and visible values. Provide a keyboard-selectable list of scene objects if selection matters to a task; the canvas alone is not an accessible object tree. Report selection changes in a status region without narrating every animation frame.

Ensure focus is visible. Do not encode state using color alone. Respect reduced motion and offer pause when ongoing motion is substantial. A textual summary or diagram can convey essential content when a GPU API is unavailable. Our native WebGPU labs show an explicit capability message while leaving lessons and source readable.

**Optional application:** extend the picking lab with five HTML buttons named after its crystals. Each button selects the same logical object as a pointer hit. This creates a shared selection function, improves accessibility, and makes the interaction easier to test.
