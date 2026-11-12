# Performance by measurement

Optimization begins by identifying the limiting resource. A frame can be slow because of JavaScript, draw submission, vertex work, fragment work, memory bandwidth, asset decoding, synchronization, or several interacting causes. Lowering a random quality setting can help accidentally without teaching you what happened.

**Experiment:** [Instanced city](#/lab/instancing), [post-processing](#/lab/post-processing), and [CPU ray tracer](#/lab/ray-tracing). **Reading bridge:** [WebGL cross-platform issues](https://webglfundamentals.org/webgl/lessons/webgl-cross-platform-issues.html) and [WebGPU optimization](https://webgpufundamentals.org/webgpu/lessons/webgpu-optimization.html).

## Begin with a model of overlapping work

Imagine a restaurant where a server takes orders while a kitchen prepares earlier orders. Measuring how long the server spends handing one ticket to the kitchen does not tell you when the meal finishes. CPU submission and GPU execution have a similar overlap. The analogy stops at actual architecture details, but it explains why a tiny duration around a draw function can coexist with a slow visible frame.

For a simple mental model, suppose CPU preparation needs 5 milliseconds and GPU work needs 12. With useful overlap, the long-term throughput can be limited near the slower stage, rather than necessarily adding to 17. But if the CPU then demands a result that the GPU has not finished, it may wait. Dependencies can remove overlap and make the observed cost change abruptly.

The practical first question is therefore what work is being timed and where a dependency forces waiting. A CPU stopwatch is still valuable: it measures exactly the CPU-side interval you surround. It becomes misleading only when its result is labeled as completed GPU execution without justification.

## Budget time, not just frames per second

At 60 frames per second, the frame budget is about 16.67 ms. At 120 it is 8.33 ms. A frame taking 33 ms is perceptibly different from one taking 17 ms even if a short average masks it. Inspect frame-time distribution, long stalls, and input responsiveness as well as average FPS.

CPU and GPU work overlap. Timing `renderer.render()` with `performance.now()` measures JavaScript and submission duration, not necessarily completed GPU work. Use browser profiling and appropriate GPU timing facilities when available. WebGPU timestamp queries are optional features; request and use them only when supported. Do not force a GPU readback every frame merely to measure timing, because that changes the workload.

## Convert frame rates into an interpretable budget

One second contains one thousand milliseconds. Dividing by sixty frames gives approximately 16.667 milliseconds per frame. A 4 ms improvement from 20 ms to 16 ms changes a scene from roughly fifty frames per second to roughly sixty-two and a half, before display scheduling. The same 4 ms improvement from 8 ms to 4 ms changes the theoretical throughput much more dramatically. Frame-rate differences are nonlinear; frame time is often easier to reason about.

An average can hide poor consistency. Consider ten frames: nine take 10 ms and one takes 100 ms. Their average is 19 ms, but the experience includes a conspicuous pause. If another implementation takes 19 ms every frame, the same average describes a different sensation. Report long-frame frequency or percentiles when interactive quality matters.

For a simple local CPU timing experiment, collect a bounded list of measurements and sort a copy when calculating percentiles. Avoid appending to an ever-growing array forever. The measurement tool itself should not become a memory leak. Also separate startup compilation and decoding from steady-state rendering; both matter, but they require different improvements.

## Controlled experiments

If reducing render resolution greatly improves frame time, suspect fragment work or bandwidth. If replacing complex materials with a basic material helps, suspect shader cost, lighting, or texture access. If hiding most objects helps while reducing resolution does not, inspect draw count, traversal, and vertex work. Disable one expensive post effect or shadow light at a time.

Use an identical camera path and scene state for comparisons. Warm up shaders and assets before recording steady-state performance. Measure load time and first-interaction latency separately from steady rendering. A fast scene after a 30-second frozen load still has a user-experience problem.

## Conduct a resolution experiment carefully

Suppose the scene renders at 1,600 by 900 pixels. Halving both dimensions produces 800 by 450, one quarter of the pixels. If frame time drops from 24 ms to 9 ms while scene objects and camera remain fixed, pixel-related work is a strong candidate. It could be fragment arithmetic, texture traffic, blending, or post-processing bandwidth; the experiment alone does not distinguish them all.

If frame time instead changes from 24 ms to 22 ms, the primary limitation may be elsewhere, or fixed per-frame costs may dominate at that operating point. This does not prove fragments are free. It tells you that this particular resolution reduction did not eliminate the dominant cost. Good diagnosis narrows hypotheses rather than turning one measurement into a universal law.

Repeat the comparison after allowing shader compilation and resource allocation to settle. Keep the same camera view because projected coverage matters. A dense scene viewed from above may have very different overdraw from the same scene viewed through a cloud of transparent particles. State the camera and effect settings alongside the result so another person can reproduce the test.

## Draw calls and geometry

Instancing and merging reduce submissions for compatible geometry and material. They can complicate culling, sorting, and individual updates. Level of detail, LOD, reduces geometry or shading complexity with distance. Frustum culling skips objects outside the camera volume; occlusion techniques skip hidden objects under more complex assumptions. A single huge merged mesh can defeat useful fine-grained culling.

Inspect `renderer.info.render.calls`, triangle counts, and resource counts as indicators. They are not GPU time measurements. A fullscreen shader with one draw can cost more than hundreds of small simple meshes.

## Separate draw submission from geometry cost

The city lab is useful because count and placement are controlled. Drawing 900 separate meshes can cost substantial CPU traversal and submission even if each box is simple. Instancing reduces many repeated submissions. However, the boxes still generate geometry processing and pixel coverage, including shadow-map work. A speedup from instancing does not imply geometry complexity no longer matters.

To isolate submission pressure, compare many small objects with one compatible instanced representation at similar total geometry and screen coverage. To investigate vertex work, vary subdivisions while preserving material and approximate screen coverage. To investigate pixel work, vary resolution or projected size. Each comparison tries to hold unrelated factors steady.

Merging geometry can reduce draws but create one large bound. If half the merged content is offscreen, the renderer may still process more geometry than separate culled objects would require. An optimization has changed the available culling granularity. The best organization depends on how the scene is viewed and updated, not only on its total object count.

## Pixel work and transparency

Large transparent surfaces and particles often create overdraw. Shadow maps render additional views. Environment captures can render six views. Post-processing can touch every pixel many times. Cap DPR, tune shadow coverage/resolution, use lower-resolution effects where appropriate, and avoid expensive work outside the focal area.

A quality ladder can choose several presets based on observed sustained frame time rather than a user-agent guess. Change slowly with hysteresis so quality does not oscillate. Let users override the choice. Test on actual lower-powered devices; desktop results do not establish mobile performance.

## Memory and bandwidth

Texture memory is roughly dimensions × bytes per texel × layers × mip factor, with format and block-compression details. Vertex memory is records × stride plus indices. Render targets add attachment storage and potentially samples. Keep this arithmetic visible in a scene budget.

Repeatedly allocating typed arrays, vectors, materials, and geometries can create garbage-collection stalls or GPU resource growth. Reuse temporary objects and update stable resources. Do not mark an entire static buffer dirty every frame. Dispose resources when their owners end, while preserving shared resources still in use.

## Follow memory from file to GPU

A compressed image download and a GPU texture are different representations. A small JPEG file can decode into millions of channel values. A 4,096 by 4,096 RGBA8 texture uses 67,108,864 bytes at its base level, exactly 64 MiB. A complete ordinary mip chain adds approximately one third, bringing it near 85.33 MiB before implementation overhead.

Four such maps for one object can therefore consume hundreds of MiB even when the downloaded files seem modest. This arithmetic is why texture resolution deserves deliberate budgeting. A prop occupying a hundred pixels across usually does not need the same maps as a hero object viewed inches from the camera, although UV coverage and reuse also affect the decision.

GPU block compression can reduce resident storage when supported and prepared appropriately. Ordinary image-file compression primarily reduces transfer size, not necessarily the final GPU footprint. Likewise, lowering mesh polygon count may not solve a texture-memory problem. Diagnose the representation that is actually consuming the limiting resource.

Render targets have similar arithmetic but different lifetimes. A color target, a depth attachment, several bloom levels, and temporal history can coexist. Count them all. A program can have few visible scene textures yet consume considerable memory in post-processing targets. The composer abstraction manages allocation details, but it does not make the memory cost disappear.

## Understand upload traffic

A static vertex buffer uploaded once is a different workload from the same buffer replaced sixty times per second. A million positions with three 32-bit components occupy twelve million bytes. Reuploading all of them at sixty updates per second represents 720 million bytes per second of source payload before considering copies and synchronization. This estimate is not a guaranteed bus measurement, but it reveals why update frequency matters.

If only a small region changes, consider a supported partial update. If a regular motion can be expressed using a time uniform and a shader function, avoid uploading every deformed position from JavaScript. If a simulation can remain on the GPU, compute-to-render storage can eliminate repeated round trips. Each choice trades flexibility, code complexity, and resource usage.

Do not optimize static data prematurely. The city updates placements only when a relevant control changes, so the simplest win is to avoid a needless per-frame upload. Before replacing an algorithm, identify work the program performs despite having no new information to communicate.

## Distinguish allocation from reuse

Creating vectors in a small setup function is usually harmless. Creating thousands of temporary objects inside every animation frame can increase garbage-collection pressure. A collector may pause execution at an inconvenient moment. Reusing a temporary vector or matrix in a hot loop can reduce this churn while keeping the code understandable.

GPU allocations have another lifetime. Replacing a material object repeatedly can trigger program/resource work beyond ordinary JavaScript allocation. Creating a new render target on every frame is particularly expensive and risks resource growth if old targets are not released. Keep dimensions and format stable where possible; recreate only when their defining configuration changes.

At the same time, avoid turning every short-lived scalar expression into an elaborate global pool. Optimization should make a measured hot path cheaper, not make the whole application difficult to maintain. A useful rule is to keep simple setup code clear and optimize repeated high-volume operations when evidence points to them.

## Recognize synchronization traps

Reading pixels, mapping results, querying some completed measurements, or requesting information that depends on unfinished work can force waiting. Sometimes the result is necessary, as in occasional object picking or the educational compute readback lab. The issue is frequency and placement. A once-per-click read can be acceptable where an every-frame read is disruptive.

If a GPU result is needed several frames later, asynchronous buffering can preserve overlap. If the result only controls another GPU pass, leave it on the GPU. If a user interface needs an approximate status, update it less frequently than the render loop. None of these strategies removes the underlying calculation, but they can remove unnecessary immediate dependencies.

Beware measuring an optimization with a tool that introduces the very stall you are trying to remove. State how timing data was collected. GPU timer facilities are valuable when available, but their optional support, precision, and validity conditions must be handled rather than assumed.

## Loading and responsiveness

Compress assets thoughtfully, lazy-load optional modules, and show useful progress or a fallback. Shader compilation can stall on first use; controlled precompilation or warmup can help. Avoid making a browser parse and initialize every optional scene before the first lesson is readable. The course loads lab code on demand, while its text remains available independently.

## Design a quality ladder with stable behavior

A simple quality ladder might have three presets. Low uses DPR one, modest shadow resolution, and limited post-processing. Medium raises selected effects. High uses a denser image and additional effects where justified. The exact settings should follow your scene's bottlenecks, not a universal collection of labels.

For automatic selection, average several recent frame times and require sustained evidence before changing quality. Use different thresholds for moving down and moving back up, called hysteresis. Without it, a scene can oscillate: lowering quality improves speed, which immediately triggers higher quality, which becomes slow again. A stable user experience is more important than constantly chasing a threshold.

Let the user choose a preset and retain that choice if the product supports persistence. A high-powered device may still need reduced battery usage, while a user on a modest device may prefer visual fidelity for a paused scene. Performance policy is part of product behavior, not just a technical afterthought.

## A practical investigation log

Record the device/browser, viewport, DPR, scene state, baseline frame times, one changed variable, and the new result. Keep correctness comparisons alongside speed: removing shadows is faster but changes the image. Your job is to choose a better tradeoff for the user’s task, not to minimize a number at any visual cost.

## Turn evidence into an engineering decision

Write a short record with baseline settings, device context, camera state, frame times, the single changed variable, and the observed image difference. For example: reducing bloom resolution improved a representative frame from 21 ms to 16 ms while preserving the intended soft glow. That is more actionable than claiming that bloom is slow in general.

If a change improves one scene and worsens another, keep both observations. An interior full of occlusion and an open landscape can stress different parts of the system. Optimize for representative user activity, and retain a simple diagnostic scene so future regressions can be isolated quickly.

**Optional application:** compare the city with shadow casting enabled and disabled, then compare DPR 1 and 2. Form an explanation from which variable changes performance most. Do not claim a cause from draw count alone.
