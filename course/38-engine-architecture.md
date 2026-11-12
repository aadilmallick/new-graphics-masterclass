# Designing a small graphics engine

You do not need to replace Three.js to understand engine design. A small renderer built from explicit responsibilities can teach resource ownership, data flow, scheduling, and the tradeoffs hidden inside a larger library. The aim is a coherent system you can reason about, not an abstraction layer for every line of code.

**Working examples:** `labs/webgl.js`, `labs/three-scene.js`, `labs/webgpu.js`, and the website’s lab mounting/cleanup boundary.

## Begin with the problem a second scene creates

A single demonstration can keep geometry, camera, animation, and cleanup in one small function. Now imagine an application with a material studio, a particle scene, a model viewer, and an image-processing inspector. Users switch among them, resize panels, load assets, and change settings. The challenge is no longer merely drawing a triangle; it is keeping ownership and dependencies understandable as those activities overlap.

An engine architecture is an arrangement of responsibilities that makes such behavior reliable. It does not have to mean thousands of classes or a universal abstraction over every graphics API. A small set of explicit records and lifecycle boundaries can be enough. The course's `mount` and returned cleanup function are an example of an architectural choice with immediate practical value.

We will reason from a concrete application: a sculpture viewer with an optional bloom pass and asynchronously loaded models. It needs stable shared rendering infrastructure, scene-specific resources, a selectable object, and a UI that remains usable while a model loads. Every architectural concept below should help explain one of those needs rather than exist solely because large engines use the same terminology.

## Trace a user action through the system

Suppose the user changes the sculpture's roughness slider. The input handler updates material state. It should not allocate a new geometry, recreate the camera, or rebuild the entire scene. The next frame uses the updated material data. This is a small example of separating a state change from the machinery that presents it.

Now suppose the user selects a different model. That change may start network and decoding work, eventually create new geometry and textures, update the scene hierarchy, recompute bounds, and choose camera framing. It is not equivalent to changing one float. The application benefits from giving loading and scene replacement their own explicit lifecycle rather than hiding them inside a render callback.

Finally suppose the user switches off bloom. The render graph changes: the scene can render through a simpler path or the bloom contribution can be bypassed under a defined policy. Existing effect resources might be retained for quick reactivation or disposed to save memory. That is a deliberate resource-lifetime decision, separate from the checkbox's visual appearance.

## Separate the world from the frame

Scene data describes what exists: transforms, geometry references, material parameters, light descriptions, and simulation state. Frame preparation decides what is visible and which passes need it. Rendering encodes those passes. Input changes scene state; it should not casually issue half a render pass from an event handler.

A useful frame sequence is: collect input, advance simulation, update transforms/bounds, build visible draw lists, prepare resource updates, encode render passes, submit, and present status. Some tasks can overlap, but this ordering makes dependencies explicit. A fixed simulation step can run several times before one rendered frame.

## Define small records before inventing a framework

A raw renderer can begin with a geometry record containing buffers, a vertex layout, and an index count. A material record can contain a program or pipeline plus parameter data. An object record can reference geometry and material and contain a transform. A pass record can describe destination attachments and the objects it draws.

This is an illustrative JavaScript data sketch, not a complete rendering implementation:

```js
const object = {
  geometry: cubeGeometry,
  material: mintMaterial,
  localTransform: identityMatrix.slice(),
  worldTransform: identityMatrix.slice(),
  visible: true
};
const pass = {
  name: 'scene',
  inputs: [],
  output: sceneColorTarget,
  objects: [object]
};
```

The names make relationships visible. Geometry and material can be shared by several objects. The object does not need to own the renderer. The pass does not need to know which slider created a parameter value. Once a second real requirement appears, refine the records to serve it. Avoid predicting every possible future renderer feature before the first useful system works.

## Give transforms a clear update policy

A local transform depends on position, rotation, and scale. A world transform depends on the local transform and its parent's world transform. If the parent changes, all descendants' world transforms can change even when their local values remain constant. The scene-graph lab's planet demonstrates exactly this dependency.

A simple system recomputes all world transforms each frame in parent-before-child order. That can be perfectly reasonable for a small scene. A larger system may mark changed subtrees dirty and recompute only affected values. Dirty flags save work only if their propagation and invalidation are correct; a stale world matrix can break rendering, culling, raycasting, and camera calculations simultaneously.

Keep authoritative state explicit. If ordinary transform properties are authoritative, matrices are derived values. If manually edited matrices are authoritative, automatic property-to-matrix updates must not silently overwrite them. Mixing both models without a policy is a common source of objects snapping back or queries disagreeing with the rendered image.

## Resource ownership

Geometry, material programs, textures, targets, and devices have different lifetimes. Ten meshes can share one geometry. Removing one mesh should not delete that shared geometry. A scene-specific render target can be disposed when the scene ends. A global renderer or device may outlive every individual scene.

Use an ownership registry, reference counts, or explicit asset handles according to complexity. Do not let every mesh recursively destroy everything reachable through a material if those resources are shared elsewhere. The course helper deduplicates resources within one owned scene; a larger application needs ownership across scenes as well.

Async work needs the same discipline. A loader can finish after the user navigates away. Keep a scene generation token or cancellation signal; attach the result only if its requester is still current, otherwise dispose or cache it under an intentional policy. The website uses a route generation counter and cleans up late-mounted labs.

## Ownership is not the same as reachability

An object can reference a shared texture without owning the right to destroy it. A scene may contain ten materials that all reference one environment map. Traversing the scene and disposing every reachable resource can destroy data still used by another scene or editor panel. Deduplicating within one traversal avoids duplicate calls, but does not solve ownership across independent scenes.

One practical design gives an asset manager ownership of shared loaded assets and gives scene instances references or handles. Scene disposal releases those handles. When the last reference is released under that policy, the manager can dispose the resource or keep it in a bounded cache. Another design uses explicit scope objects whose resources are never shared outside the scope. Both can work when their rules are clear.

For render targets and temporary buffers, ownership often belongs to a pass or renderer subsystem. Their sizes may depend on viewport dimensions rather than any mesh. This is why disposing a model does not automatically release bloom targets, and disposing a composer does not necessarily dispose every model texture.

## Handle a loader that finishes after navigation

Imagine the user requests model A, then immediately switches to model B. Model B finishes first and becomes visible. If A later finishes and attaches without checking relevance, it can replace B or appear unexpectedly in the new scene. The graphics code can be correct while the application behavior is wrong.

A generation token provides a simple solution. Increment a counter whenever a new scene request supersedes the previous one. Capture the current generation when starting a load. When it finishes, compare the captured value with the latest one. Attach only if they still match; otherwise release or cache the result under the resource policy.

Cancellation can save work when supported, but a relevance check is still useful because not every stage can be canceled cleanly. Network transfer, image decoding, shader preparation, and asset construction can have different cancellation capabilities. The final attach operation should always know whether its requester remains current.

The course router uses the same pattern for asynchronously mounted labs. A late mount is cleaned up instead of being installed after a newer route. This architectural concern arises even with locally bundled modules, because initialization itself can be asynchronous.

## Render lists and state sorting

An opaque list can be sorted to reduce state changes and exploit early depth rejection. A transparent list often needs distance ordering, with limitations for intersecting surfaces. A shadow list may contain only shadow casters visible to a light. UI overlays form another policy. The scene tree is not automatically the optimal order for every pass.

A material pipeline cache key should include shader structure and relevant fixed pipeline choices, such as target formats and sample count for WebGPU. Numeric uniform values belong in data, not the pipeline cache key. Conversely, changing a structural shader define may require a distinct compiled program.

## Build a render list from scene state

The scene hierarchy describes relationships and authoring structure. The render list describes what a particular pass should draw and in what order. A parent might contain an opaque sculpture, transparent glass, a helper axis, and an HTML label anchor. Those descendants do not necessarily belong in the same rendering pass or sorting policy.

Opaque objects can often be organized to reduce state changes while taking advantage of depth rejection. Transparent objects may need back-to-front ordering, with limitations for intersecting surfaces. Shadow passes need relevant casters from a light's view rather than every object in the viewer's hierarchy. Picking passes use selectable identities and often a simpler material path.

Separating these structures makes such choices explicit. It also makes debugging easier: inspect the scene to understand where an object belongs, then inspect the pass list to understand why it was or was not drawn. A single recursive draw function can conceal both questions inside one call stack.

## A render graph

A render graph expresses passes and resource dependencies. For example: shadow depth → scene HDR → bloom pyramid → composite → output. A particle update writes a storage buffer that the scene pass reads. A picking pass writes an ID target read by an occasional CPU request.

Name each pass’s inputs, outputs, dimensions, format, clear/load policy, and lifetime. Detect accidental read/write feedback. Resize dependent targets consistently. An advanced graph can reuse transient allocations when lifetimes do not overlap, but that optimization should follow a correct explicit graph.

## Make pass dependencies concrete

For the sculpture viewer, a simple graph might produce shadow depth, then scene color, then bloom, then final display output. Shadow depth is read by the scene pass. Scene color is read by the bloom extraction and final combination. The output transform should see the intended combined linear image.

Write each resource's format, dimensions, sample count, and lifetime beside the pass graph. A depth map and an sRGB color image are both texture resources but have different meanings. A pass that expects linear HDR radiance cannot silently consume an already display-encoded image and retain the same mathematical interpretation.

Resource lifetimes also reveal reuse opportunities. If two temporary targets are never needed at the same time and have compatible configurations, an advanced allocator may reuse storage. Do not begin with this optimization. First make the dependency graph correct and ensure no pass reads data after its storage was repurposed.

## Cache programs by structure, update values as data

A shader algorithm, material feature selection, target format, and sample configuration can determine a program or pipeline variant. A roughness slider's numeric value normally does not need a new structural variant. If every float becomes part of the cache key, the application can accumulate many nearly identical pipelines.

Conversely, treating structurally different materials as the same pipeline can produce incompatible shader bindings or missing features. Define cache keys from the choices that actually affect generated code and fixed pipeline compatibility. Keep resource values and dynamic parameters in buffers, uniforms, and bind groups according to the backend's model.

Cache ownership needs a release or eviction policy too. A cache that only grows can become a leak even if every individual resource is technically reachable. Track use and choose a bounded strategy appropriate to the application's scene-switching behavior.

## Data-oriented updates and ECS

An entity-component system, ECS, stores aspects such as transform, velocity, or renderable data separately and runs systems over matching components. It can improve organization and regular iteration for large simulations. It is not required for a small scene. A simple array of particle state is already a data-oriented design; a thousand class hierarchies can be less useful than one clear typed array.

Prefer structures that match the operations you need. CPU-friendly objects can be convenient for editing. GPU-friendly packed arrays can be better for uploading or computing. A translation layer between authoring state and GPU state can be worthwhile, but keep its update rules and ownership visible.

## Multiple backends

A backend abstraction might expose buffer creation, resource layouts, pass descriptions, and draw commands. WebGL and WebGPU differ enough that a one-to-one wrapper can become awkward: mutable state versus immutable pipeline descriptions, texture-unit samplers versus bind groups, and fragment-based GPGPU versus compute.

Abstract around your application’s actual needs, such as “draw this material family with these resources,” rather than claiming every native feature maps identically. Keep capability queries and fallback decisions near initialization. A scene that requires compute can offer a different experience on a lower-capability backend rather than a misleading identical guarantee.

## Testing an engine

Use mathematical tests for transforms, intersections, and layout calculations. Use small render scenes for visual correctness and shader compilation. Use lifecycle tests for repeated load/unload and memory stability. Use representative performance scenes for regression trends. A screenshot alone cannot prove memory layout, and a passing matrix test cannot prove a material looks correct.

## Test boundaries with small deliberate failures

Test entering and leaving a scene repeatedly, not only launching it once. Test a failed asset path, a load finishing after navigation, a resize during initialization, and a paused simulation. Check that one scene's cleanup cannot destroy another's shared resources. These scenarios exercise architecture more directly than a static screenshot.

Use numeric tests for transform composition, projection endpoints, intersections, and byte packing. Use tiny visual scenes for normal orientation, transparency, output conversion, and shadow conventions. Use resource counts and long-running observations to detect growth, while recognizing that implementation caching and delayed reclamation can affect immediate counts.

The objective is not to prove an entire engine with one test suite. It is to keep important contracts observable. When a failure occurs, you should be able to identify which ownership, data-layout, coordinate-space, or pass-dependency promise was violated.

**Optional application:** build a raw renderer with four resource types—geometry, material, object, pass—and one shadow or filter pass. Add a loader generation token and explicit disposal. Stop adding abstractions when the next feature remains clear and reviewable without them.
