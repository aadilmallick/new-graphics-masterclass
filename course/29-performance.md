# Performance by measurement

Optimization begins by identifying the limiting resource. A frame can be slow because of JavaScript, draw submission, vertex work, fragment work, memory bandwidth, asset decoding, synchronization, or several interacting causes. Lowering a random quality setting can help accidentally without teaching you what happened.

**Experiment:** [Instanced city](#/lab/instancing), [post-processing](#/lab/post-processing), and [CPU ray tracer](#/lab/ray-tracing). **Reading bridge:** [WebGL cross-platform issues](https://webglfundamentals.org/webgl/lessons/webgl-cross-platform-issues.html) and [WebGPU optimization](https://webgpufundamentals.org/webgpu/lessons/webgpu-optimization.html).

## Budget time, not just frames per second

At 60 frames per second, the frame budget is about 16.67 ms. At 120 it is 8.33 ms. A frame taking 33 ms is perceptibly different from one taking 17 ms even if a short average masks it. Inspect frame-time distribution, long stalls, and input responsiveness as well as average FPS.

CPU and GPU work overlap. Timing `renderer.render()` with `performance.now()` measures JavaScript and submission duration, not necessarily completed GPU work. Use browser profiling and appropriate GPU timing facilities when available. WebGPU timestamp queries are optional features; request and use them only when supported. Do not force a GPU readback every frame merely to measure timing, because that changes the workload.

## Controlled experiments

If reducing render resolution greatly improves frame time, suspect fragment work or bandwidth. If replacing complex materials with a basic material helps, suspect shader cost, lighting, or texture access. If hiding most objects helps while reducing resolution does not, inspect draw count, traversal, and vertex work. Disable one expensive post effect or shadow light at a time.

Use an identical camera path and scene state for comparisons. Warm up shaders and assets before recording steady-state performance. Measure load time and first-interaction latency separately from steady rendering. A fast scene after a 30-second frozen load still has a user-experience problem.

## Draw calls and geometry

Instancing and merging reduce submissions for compatible geometry and material. They can complicate culling, sorting, and individual updates. Level of detail, LOD, reduces geometry or shading complexity with distance. Frustum culling skips objects outside the camera volume; occlusion techniques skip hidden objects under more complex assumptions. A single huge merged mesh can defeat useful fine-grained culling.

Inspect `renderer.info.render.calls`, triangle counts, and resource counts as indicators. They are not GPU time measurements. A fullscreen shader with one draw can cost more than hundreds of small simple meshes.

## Memory and bandwidth

Texture memory is roughly dimensions × bytes per texel × layers × mip factor, with format and block-compression details. Vertex memory is records × stride plus indices. Render targets add attachment storage and potentially samples. Keep this arithmetic visible in a scene budget.

Repeatedly allocating typed arrays, vectors, materials, and geometries can create garbage-collection stalls or GPU resource growth. Reuse temporary objects and update stable resources. Do not mark an entire static buffer dirty every frame. Dispose resources when their owners end, while preserving shared resources still in use.

## Pixel work and transparency

Large transparent surfaces and particles often create overdraw. Shadow maps render additional views. Environment captures can render six views. Post-processing can touch every pixel many times. Cap DPR, tune shadow coverage/resolution, use lower-resolution effects where appropriate, and avoid expensive work outside the focal area.

A quality ladder can choose several presets based on observed sustained frame time rather than a user-agent guess. Change slowly with hysteresis so quality does not oscillate. Let users override the choice. Test on actual lower-powered devices; desktop results do not establish mobile performance.

## Loading and responsiveness

Compress assets thoughtfully, lazy-load optional modules, and show useful progress or a fallback. Shader compilation can stall on first use; controlled precompilation or warmup can help. Avoid making a browser parse and initialize every optional scene before the first lesson is readable. The course loads lab code on demand, while its text remains available independently.

## A practical investigation log

Record the device/browser, viewport, DPR, scene state, baseline frame times, one changed variable, and the new result. Keep correctness comparisons alongside speed: removing shadows is faster but changes the image. Your job is to choose a better tradeoff for the user’s task, not to minimize a number at any visual cost.

**Optional application:** compare the city with shadow casting enabled and disabled, then compare DPR 1 and 2. Form an explanation from which variable changes performance most. Do not claim a cause from draw count alone.
