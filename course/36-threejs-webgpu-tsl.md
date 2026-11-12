# Three.js WebGPU and TSL

You can use WebGPU directly when you need explicit control, or use Three.js to retain scene and material abstractions. Three.js’s `WebGPURenderer` has a different custom-material architecture from the traditional WebGL renderer. Learning that boundary prevents a frustrating migration based on swapping only one class name.

**Experiment:** [Shaders in JavaScript](#/lab/three-tsl). **Source:** `labs/19-three-tsl.js`. **Primary references:** [WebGPURenderer guide](https://threejs.org/manual/pages/webgpurenderer.html), [Three.js Shading Language](https://github.com/mrdoob/three.js/wiki/Three.js-Shading-Language), and [WebGPU post-processing](https://threejs.org/manual/pages/webgpu-postprocessing.html).

## Renderer initialization

Import the WebGPU build through `three/webgpu`. Initialization is asynchronous. Use `setAnimationLoop` as documented, or await `renderer.init()` before rendering through your own loop. The course explicitly awaits initialization and provides cleanup.

The renderer can select a WebGPU backend or fall back to WebGL 2 on supported configurations. That makes it different from our native WGSL labs, which require WebGPU and report its absence. A fallback-capable scene should still be tested on both intended backends; support for a renderer does not imply every optional feature has identical performance or availability.

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

## JavaScript operators are not always shader operators

Ordinary `a + b` between node objects does not necessarily build the intended shader addition. Follow TSL’s documented operations and function/control-flow patterns. A JavaScript `if` can choose graph construction at setup time; a shader conditional needs the appropriate graph representation to vary per invocation. The distinction resembles code that generates another program.

Keep graphs readable by naming intermediate signals: `height`, `slope`, `foam`, `baseColor`. The same teaching discipline used in GLSL applies. Visualize intermediate values as color before combining many effects.

## Migrating an existing scene

Ordinary scene hierarchy, geometry, cameras, and many material concepts transfer. GLSL `ShaderMaterial`, `RawShaderMaterial`, `onBeforeCompile` patches, and the traditional `EffectComposer` pipeline do not transfer directly. Rewrite custom shading as node/TSL expressions and use the WebGPU renderer’s current rendering/post-processing system.

For r187, consult the installed APIs and current official examples before using a post-processing class name copied from an older release. The renderer’s processing architecture is evolving; the course pins the dependency and keeps the working TSL lab small enough to inspect. Upgrading should be a deliberate migration with visual comparisons.

## Compute through an engine

Node-based compute and storage abstractions can connect GPU-generated data to scene rendering, but they still embody the same ideas as the native particle lab: declared data layout, independent work, synchronization boundaries, and resource lifetime. Learn the native version first so the higher-level operations retain a clear meaning.

Choosing native WebGPU versus Three.js is a scope decision. A custom numerical pipeline may benefit from direct resource control. A rich scene with assets, camera controls, and materials often benefits from a library. Both require capability handling and measured performance.

**Optional application:** reproduce the GLSL ocean’s height rule as a TSL position deformation. Keep a simple unlit height gradient first, then choose a normal/shading strategy. Compare the generated result visually with the original rather than assuming equivalent-looking expression code guarantees identical coordinate spaces.
