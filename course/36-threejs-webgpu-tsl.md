# Three.js WebGPU and TSL

You can use WebGPU directly when you need explicit control, or use Three.js to retain scene and material abstractions. Three.js’s `WebGPURenderer` has a different custom-material architecture from the traditional WebGL renderer. Learning that boundary prevents a frustrating migration based on swapping only one class name.

**Experiment:** [Shaders in JavaScript](#/lab/three-tsl). **Source:** `labs/19-three-tsl.js`. **Primary references:** [WebGPURenderer guide](https://threejs.org/manual/pages/webgpurenderer.html), [Three.js Shading Language](https://github.com/mrdoob/three.js/wiki/Three.js-Shading-Language), and [WebGPU post-processing](https://threejs.org/manual/pages/webgpu-postprocessing.html).

## Separate the scene problem from the shader-language problem

You have now seen the same triangle idea expressed through WebGL and native WebGPU. In both cases, building a complete scene also requires transforms, assets, materials, input, and resource lifetime. Three.js can continue to supply those higher-level responsibilities while a newer renderer handles backend details. The difficult part of migration is identifying which abstractions remain shared and which belong specifically to one rendering architecture.

For example, a mesh's local position and camera projection are still meaningful. A custom fragment shader written as a GLSL string belongs to a particular shader integration path. Moving the scene graph does not automatically translate that string into WGSL or rebuild its lighting assumptions. TSL offers a different way to describe the shader calculation so the renderer can generate backend-appropriate code.

This chapter therefore teaches two changes independently. First, initialize and use the WebGPU-capable renderer. Second, replace a hand-authored shader string with an expression graph. Starting with an unlit stripe material keeps lighting out of the way while that new representation becomes understandable.

## Renderer initialization

Import the WebGPU build through `three/webgpu`. Initialization is asynchronous. Use `setAnimationLoop` as documented, or await `renderer.init()` before rendering through your own loop. The course explicitly awaits initialization and provides cleanup.

The renderer can select a WebGPU backend or fall back to WebGL 2 on supported configurations. That makes it different from our native WGSL labs, which require WebGPU and report its absence. A fallback-capable scene should still be tested on both intended backends; support for a renderer does not imply every optional feature has identical performance or availability.

## Understand a graph by building an ordinary JavaScript analogy

In a normal JavaScript expression, `Math.sin(2)` immediately calculates one scalar. In a shader graph, the argument may represent a different value at every surface position. We need a description of the operation rather than one already calculated answer. That is the conceptual leap behind TSL.

Consider this small complete console example, which is an analogy and not a TSL implementation:

```js
const expression = {
  operation: 'multiply',
  left: { operation: 'input', name: 'height' },
  right: { operation: 'constant', value: 5 }
};
console.log(expression.left.name, expression.right.value);
```

The object stores a description: multiply an input named height by five. It has not yet chosen a numerical height or performed that multiplication. Another program could inspect the object and generate source code, or evaluate it for many heights. TSL nodes similarly describe shader operations, though the actual library includes far more sophisticated types, stage handling, generation, and optimization than this analogy.

This explains why a JavaScript variable holding a node should not be mentally treated as one float. It is a reference to an expression. Two other nodes can use it, forming a graph of dependencies. The renderer determines how to turn that graph into calculations in the relevant shader stages.

## TSL describes a graph

TSL, Three.js Shading Language, uses JavaScript expressions to construct a shader graph. Calling `sin(node)` does not calculate one JavaScript sine value for the whole object. It creates a node describing a sine operation that will be evaluated in the shader for each relevant invocation.

The lab’s essential fragment is:

```js
import { color, positionLocal, sin, mix, uniform } from 'three/tsl';
const frequency = uniform(5);
const phase = uniform(0);
const stripe = sin(positionLocal.y.mul(frequency).add(phase))
  .mul(0.5).add(0.5);
material.colorNode = mix(color('#84aaff'), color('#82ebcc'), stripe);
```

`positionLocal.y` is a shader-space quantity. `.mul` and `.add` build arithmetic nodes. The sine is remapped from -1..1 to 0..1 to become an interpolation weight. `uniform` makes a value adjustable without rebuilding the graph. Updating `frequency.value` changes data; replacing the expression structure changes the shader program description.

The material is a `MeshBasicNodeMaterial`, so the stripe result is unlit. A standard node material can combine custom nodes with the PBR lighting system. Choose the correct node slot: a base-color contribution and a final output contribution have different roles in the shading pipeline.

## Build the stripe signal slowly

The lab begins with `positionLocal.y`. This represents the local Y coordinate available to the shader at the shaded surface. Multiplying by frequency converts position into a phase. Adding phase shifts the pattern over time. Applying sine produces values from negative one to positive one. Multiplying by one half and adding one half remaps that range to zero through one.

Each step has a visible role. At local Y zero and phase zero, sine is zero, so the blend factor is 0.5. At a location whose phase is pi over two, sine is one, so the factor is one. At phase three pi over two, sine is negative one, so the factor is zero. The two endpoint colors appear where the wave reaches its extremes, with blended colors between them.

The same arithmetic could be written in GLSL or WGSL. TSL changes how the application describes it, not the mathematics. By naming the intermediate result `stripe`, the lab gives the reader a handle for the signal before it becomes a final color. A more complex material should keep similarly meaningful intermediate names rather than forming one long unreadable expression.

The final `mix` blends a blue color node and a mint color node. Because its factor stays in the intended zero-to-one range, it interpolates between them. If the factor were left as raw sine, negative values would extrapolate past an endpoint and the result would have a different meaning. Remapping is a deliberate stage, not decorative arithmetic.

## Uniform nodes are adjustable data

The `frequency` and `phase` nodes are created once with `uniform`. Their `.value` properties are updated by ordinary JavaScript. The graph retains the same operation structure while the input values change. This is analogous to updating a GLSL uniform or writing a WGSL uniform buffer, with the library managing the lower-level representation.

Changing the graph itself is different. Replacing sine with another operation, adding a new branch, or changing the material's structural configuration can require a different generated shader. Avoid rebuilding those structures merely because a slider moved. The lab's slider changes `frequency.value`, which expresses exactly the intended data update.

This distinction is useful beyond performance. It gives the application a stable place to store controls and presets. A preset can describe numeric values, while the material construction function describes the algorithm. Mixing those responsibilities makes it harder to know whether a change should update data or regenerate code.

## JavaScript operators are not always shader operators

Ordinary `a + b` between node objects does not necessarily build the intended shader addition. Follow TSL’s documented operations and function/control-flow patterns. A JavaScript `if` can choose graph construction at setup time; a shader conditional needs the appropriate graph representation to vary per invocation. The distinction resembles code that generates another program.

Keep graphs readable by naming intermediate signals: `height`, `slope`, `foam`, `baseColor`. The same teaching discipline used in GLSL applies. Visualize intermediate values as color before combining many effects.

## Do not confuse graph construction time with invocation time

Suppose a JavaScript `if` chooses one of two node expressions based on a settings object while creating the material. That decision happens in JavaScript and chooses which graph is built. It does not automatically become a shader condition that varies across pixels.

A shader-side conditional needs a supported node/control-flow expression representing the decision in generated code. The same distinction applies to loops. A JavaScript loop can create several repeated graph nodes during construction, while a shader loop is a runtime operation executed by shader invocations. Follow TSL's documented constructs for the intended behavior rather than assuming ordinary JavaScript control flow is transparently moved onto the GPU.

This is a common pattern in systems that generate code or queries: the host language constructs a program that another execution system later runs. Understanding the two timescales prevents many apparently puzzling results, such as a condition remaining uniform across the whole object when you expected it to depend on position.

## Distinguish local pattern motion from object motion

The lab advances a uniform phase over time, causing stripes to move across the surface in local coordinates. It also slowly rotates the knot as an object. These are independent transformations. The first changes the material's calculation at a fixed local point. The second changes where that point lies relative to the camera.

If phase is frozen but the object rotates, the stripe pattern remains attached to the object. If object rotation is frozen but phase advances, colors move over its surface. If the graph instead used a world-coordinate input, moving the object through the world could make it pass through a stationary pattern. Coordinate choice determines that visual behavior.

A complete understanding of the effect therefore requires more than recognizing the sine function. You must know which position is sampled, in which frame, how phase is measured, and which parameters evolve with time. These are the same questions you asked in the custom GLSL chapter.

## Read the complete lab's lifecycle

The module dynamically imports `three/webgpu` and `three/tsl`, so this optional rendering path is loaded when its lab is opened. It constructs a renderer, sets a capped pixel ratio, attaches its canvas to the host, and awaits initialization. Only after that does it create the scene, camera, node material, and knot.

The camera sits along positive Z and looks toward the default forward direction at the origin. The knot's geometry supplies positions. The basic node material uses the custom color expression without requiring a scene lighting setup. This choice isolates graph-driven appearance from the much larger PBR system.

The shared animation utility supplies elapsed time and reduced-motion information. The lab updates renderer size and camera aspect from the host rectangle, advances phase and rotation only when motion is allowed, then renders the scene. The cleanup stops the animation and disposes geometry, material, renderer, and the canvas attachment.

Because the renderer initializes asynchronously, failures can happen after the mount function starts but before the scene is ready. The `try`/`catch` path disposes the renderer before propagating the error to the page's readable startup message. This is not merely visual setup; it is a resource-lifetime contract.

## Migrating an existing scene

Ordinary scene hierarchy, geometry, cameras, and many material concepts transfer. GLSL `ShaderMaterial`, `RawShaderMaterial`, `onBeforeCompile` patches, and the traditional `EffectComposer` pipeline do not transfer directly. Rewrite custom shading as node/TSL expressions and use the WebGPU renderer’s current rendering/post-processing system.

For r187, consult the installed APIs and current official examples before using a post-processing class name copied from an older release. The renderer’s processing architecture is evolving; the course pins the dependency and keeps the working TSL lab small enough to inspect. Upgrading should be a deliberate migration with visual comparisons.

## Plan a migration by inventorying custom work

Keep the old and new implementations under the same fixed test scene while migrating. Use identical geometry, camera, base parameters, and display settings wherever the two paths support them. If the images differ, visualize intermediate signals before deciding the backend is responsible. A local-versus-world coordinate mistake or duplicated output conversion can produce a much larger difference than the rendering API itself. A controlled comparison turns migration into a sequence of explainable changes rather than a search for one mysterious compatibility switch.

For an existing WebGL project, list ordinary scene objects separately from custom shader and post-processing integrations. A camera, transform hierarchy, and geometry can often retain their conceptual role. A GLSL shader string, an `onBeforeCompile` modification, and an EffectComposer chain need deliberate replacement in the new renderer path.

Begin by rendering the geometry with a simple supported material. Then reproduce one custom signal, such as a height gradient or stripe. Compare output under a fixed camera and display policy. Add normal behavior, lighting, transparency, and effects one by one. A staged visual comparison is more reliable than changing renderer, material system, and post-processing simultaneously.

Also test the intended fallback behavior. A fallback-capable renderer is valuable, but backend support does not establish identical performance or optional-feature availability. Keep user-facing capability messages accurate. The native WGSL labs remain distinct: they directly require WebGPU, while this engine-level example can select a supported backend according to its renderer configuration.

## Compute through an engine

Node-based compute and storage abstractions can connect GPU-generated data to scene rendering, but they still embody the same ideas as the native particle lab: declared data layout, independent work, synchronization boundaries, and resource lifetime. Learn the native version first so the higher-level operations retain a clear meaning.

Choosing native WebGPU versus Three.js is a scope decision. A custom numerical pipeline may benefit from direct resource control. A rich scene with assets, camera controls, and materials often benefits from a library. Both require capability handling and measured performance.

## Transfer the ocean's reasoning rather than copying its syntax

To port the ocean, start with the scalar height function. Build a node for each phase, then sine/cosine contributions, amplitude, and their sum. Confirm that the signal has the expected values at known local coordinates and time. Display it as color before using it to move positions.

Only then apply it to the material's supported position-deformation path, with a clear choice of local plane and height axis. A moved surface also needs a consistent normal/shading strategy. The earlier analytic derivatives remain relevant even though the expression representation changes. A library abstraction can manage plumbing, but it cannot infer an arbitrary author's intended coordinate conventions or artistic model.

Finally consider shadows, bounds, and CPU interaction. GPU deformation can still disagree with CPU geometry unless the application accounts for it. A successful graph translation is not complete merely because the shader compiles. It is complete when the resulting surface, lighting, visibility, and interaction agree with the intended scene behavior.

**Optional application:** reproduce the GLSL ocean’s height rule as a TSL position deformation. Keep a simple unlit height gradient first, then choose a normal/shading strategy. Compare the generated result visually with the original rather than assuming equivalent-looking expression code guarantees identical coordinate spaces.
