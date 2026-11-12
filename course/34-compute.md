# Compute shaders and readback

A compute shader performs GPU work without pretending that the result is a color in a triangle. It is useful for regular data-parallel tasks such as particle updates, image filters, reductions, histograms, and geometry generation. It is not automatically faster than JavaScript for small jobs, especially if data must travel back immediately.

**Experiment:** [Numbers on the GPU](#/lab/webgpu-compute). **Source:** `labs/17-webgpu-compute.js`. **Reading bridge:** Eck §9.6; [compute basics](https://webgpufundamentals.org/webgpu/lessons/webgpu-compute-shaders.html).

## Start from an ordinary JavaScript loop

Suppose we have eight readings and want to multiply each by a calibration factor. In JavaScript, a loop can visit one value after another, calculate a result, and move to the next index. The values do not depend on each other. That independence makes the operation a good first compute example because execution order does not affect the mathematical answer.

```js
const input = [1, 2, 3, 4, 5, 6, 7, 8];
const factor = 2;
const output = input.map(value => value * factor);
console.log(output); // [2, 4, 6, 8, 10, 12, 14, 16]
```

This complete console program is the CPU reference. The GPU version must produce the same mapping, but its data lives in explicit buffers and many invocations can perform independent elements concurrently. We are changing the execution and storage model, not inventing a different multiplication rule.

For only eight values, the GPU setup and readback cost is not justified as a speed optimization. We intentionally keep the dataset tiny so every result is visible and verifiable. A small educational workload is easier to inspect than a huge array whose incorrect values remain unnoticed behind an attractive visualization.

## One invocation per element

The lab multiplies eight numbers by a slider-controlled factor. Its storage buffer holds `array<f32>`. The shader uses a 64-invocation workgroup:

```wgsl
@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3u) {
  if (id.x >= arrayLength(&values)) { return; }
  values[id.x] = values[id.x] * factor.x;
}
```

`global_invocation_id` identifies one invocation across the whole dispatch. The X component chooses an array element. The bounds check is essential because dispatch sizes are rounded to whole workgroups. With N values and workgroup width K, dispatch $\lceil N/K\rceil$ workgroups. Eight values and K=64 dispatch one group, with 56 invocations doing no data operation.

This multiplication is safe in place because each invocation reads and writes only its own element. If it read neighboring elements that other invocations were changing, the result could depend on execution timing. Such an algorithm needs separate input/output buffers or a carefully synchronized design.

## Translate the loop's index into invocation identity

In the JavaScript map callback, an index identifies one input element. In the compute shader, `global_invocation_id.x` provides the corresponding identity. The shader does not contain a loop that runs through the entire input array. Each invocation receives its own index and computes at most one mapped value in this example.

A workgroup size of sixty-four means one workgroup contains sixty-four local invocation positions. Dispatching two workgroups along X creates global X indices zero through 127. For workgroup width K, the relation is `globalX = workgroupX * K + localX`. The first group has workgroup index zero, and the second has index one. Its local index zero therefore corresponds to global index sixty-four.

For N = 130 and K = 64, two groups cover only 128 elements, so we need three. The ceiling of 130 divided by 64 is three, giving 192 invocations. Indices zero through 129 operate on data; the remaining sixty-two return at the bounds check. Rounding down would silently leave the last two values unchanged, which is why the dispatch formula matters.

The invocation ID is three-dimensional because workloads can be arranged as grids. An image filter might use X and Y as pixel coordinates. For a two-dimensional output of width W, flattening to a one-dimensional buffer index uses `index = y * W + x`, exactly as a JavaScript image array would. Bounds must be checked against the actual width and height when the dispatch grid is rounded.

## Encoding and storage roles

Create a compute pipeline, bind resources, begin a compute pass, set pipeline and bind group, dispatch, end, and submit. The work buffer has `STORAGE | COPY_DST | COPY_SRC`: shaders use it as storage, JavaScript uploads input through a copy destination, and a later command copies output from it.

Uniforms carry small shared parameters such as the multiplier. Use correct alignment; the lab uses a 16-byte vec4 uniform to keep the layout straightforward. Changing the factor does not change shader structure or pipeline identity.

## Trace the lab's three buffers

The input typed array contains eight 32-bit floats, totaling thirty-two bytes. The work buffer stores the values the shader reads and writes. It needs STORAGE for shader access, COPY_DST for JavaScript upload, and COPY_SRC for copying its result to another resource. Its size is the array's byte length, not the number of elements.

The readback buffer also has thirty-two bytes, but its roles differ. It is a destination for a GPU copy and a source of CPU mapping, so it uses COPY_DST and MAP_READ. It is not declared as the shader's storage buffer. The parameter buffer stores a vec4 factor, sixteen bytes, with UNIFORM and COPY_DST usage.

Why not use one buffer for every role? WebGPU's buffer usage and mapping restrictions make resource roles explicit, and a buffer being mapped is not simultaneously an ordinary GPU-working resource. A staging buffer gives the GPU an efficient working representation and the CPU an explicit point at which to access completed data. This separation also makes repeated asynchronous transfers easier to schedule correctly.

The bind group contains only the shader resources: work at binding zero and factor at binding one. The staging buffer is absent because the shader never sees it. A command-encoder copy moves work data into staging after the compute pass ends. Resources used by commands and resources bound to a shader are related but not identical categories.

## Readback uses a staging buffer

A GPU storage resource is not an ordinary JavaScript array you can synchronously inspect. The lab creates a separate buffer with `COPY_DST | MAP_READ`, copies results into it with the command encoder, submits, then awaits `mapAsync(GPUMapMode.READ)`.

```js
await readBuffer.mapAsync(GPUMapMode.READ);
const result = new Float32Array(readBuffer.getMappedRange()).slice();
readBuffer.unmap();
```

The `.slice()` copies values into independent CPU-owned memory before unmapping. The mapped range is tied to the buffer’s mapping lifetime; do not keep using it afterward. A mapped buffer cannot simultaneously be used by the GPU in the normal way. Manage repeated readbacks with state or a ring of staging buffers rather than overlapping incompatible map operations.

The displayed cells are actual mapped compute results. The application serializes updates so rapidly moving the slider cannot map the same buffer twice. It reuploads the original input for each run, so factor changes do not compound previous multiplication.

## Why the mapped result is copied before unmapping

`getMappedRange()` exposes memory associated with the current mapping. A typed-array view over that range does not create independent storage. Unmapping ends the mapping lifetime. If the application wants to keep values after that point, it must copy them first, as the lab does with `.slice()`.

Compare this with ordinary JavaScript views over an ArrayBuffer. Two views can refer to the same bytes, and changing one affects what the other reads. Copying an array's values creates an independent representation. The same distinction explains why retaining a view and retaining a result are not always the same operation.

For frequent readback, several staging buffers can rotate through pending, mapped, and reusable states. That can avoid forcing the newest GPU work to finish before the CPU consumes an older result. It adds bookkeeping, so use it when throughput or latency measurements justify the complexity rather than making the first example unnecessarily elaborate.

## Follow one run from slider to displayed values

When the slider chooses factor 2.5, JavaScript records that value in its application state. The lab's `run` function uploads the original input array into work and uploads `[2.5,0,0,0]` into the factor uniform. Uploading the original array each time ensures the operation remains a fresh mapping rather than repeated multiplication of previous results.

The encoder records a compute pass using the pipeline and bind group. One group is dispatched because eight elements fit inside sixty-four invocations. The pass ends. A buffer copy follows in the same command sequence, moving all thirty-two bytes from work into the readback buffer. Submission makes those operations available to the queue in the intended order.

The function awaits mapping, obtains the mapped range, copies its eight floats, and unmaps. The displayed results should be 2.5, 5, 7.5, 10, 12.5, 15, 17.5, and 20. If a result is wrong, the tiny CPU reference lets you identify whether arithmetic, input reset, parameter upload, or binary interpretation is responsible.

The `busy` flag prevents a second run from trying to map the same staging buffer while the first is still pending. If the user moves the slider again during that interval, the current run finishes and the function notices that the desired factor changed, then performs another run. This is an application scheduling policy layered over GPU computation. Shader correctness alone cannot prevent a JavaScript lifecycle race.

## Independence determines whether in-place updates are safe

Multiplication reads `values[i]` and writes `values[i]`. No other invocation needs the old value at that index, so in-place work is mathematically straightforward. Now imagine changing the operation to an average of `values[i-1]`, `values[i]`, and `values[i+1]`. If one invocation writes early, a neighbor might read the new value instead of the old one. The result can depend on execution timing.

A separate output buffer solves that kind of old-state/new-state dependency: all invocations read the unchanged input and write distinct output elements. After the dispatch, swap roles. This is the compute equivalent of the framebuffer ping-pong pattern and leads directly to the particle chapter.

Do not infer that all in-place operations are invalid. Some algorithms are specifically designed around disjoint access or synchronized atomic updates. The essential question is whether concurrent accesses have a defined, correct relationship. A familiar sequential JavaScript loop can hide a dependency that becomes important when iterations run independently.

## Workgroups and shared memory

Invocations in one workgroup can cooperate using `var<workgroup>` storage and barriers. A workgroup barrier must be reached under the required uniform control flow by the participating invocations. Returning early before a barrier in only some lanes can invalidate the algorithm. A bounds check that returns is fine in our independent multiplication shader because it has no later barrier.

A workgroup barrier does not synchronize every workgroup in a dispatch. For a global multi-stage reduction, write partial results, end the appropriate pass/dispatch sequence, then run another dispatch consuming them. Atomics coordinate particular memory operations; they do not make arbitrary racing reads and writes safe.

## Introduce cooperation through a small reduction

A sum reduction has a different shape from a map. Instead of producing one independent output for each input, it combines many inputs into fewer outputs. A naive shared `total += value` from every invocation is a race unless a supported atomic operation or another valid coordination scheme defines it.

One strategy gives each workgroup a private partial sum. Within that group, invocations load values into workgroup memory, synchronize, then combine pairs in a sequence of stages. At each stage, the number of active combining positions shrinks. A barrier ensures the next stage sees the writes it depends on. Finally one invocation writes the group's partial result to a global output buffer.

For 1,024 inputs and groups processing sixty-four inputs each, the first stage can produce sixteen partial sums. A later dispatch combines those sixteen. This stage boundary provides a global dependency structure without pretending that a barrier in one group pauses every group in the dispatch.

The bounds policy also changes when barriers exist. Returning early from some invocations before a barrier that others reach can violate required uniform participation. Instead, inactive lanes can load a neutral value such as zero and still participate in synchronization. The exact algorithm must satisfy WGSL's uniformity rules; a bounds check copied from an independent map is not automatically correct in a cooperative kernel.

## Common compute patterns

A map transforms each element independently. A reduction combines many elements, such as a sum or maximum. A scan computes prefixes and often supports compaction. A histogram counts values into bins and may use atomics. An image filter reads a neighborhood and writes a new texture. Tiling a filter into shared memory can reduce repeated global reads, but adds synchronization and boundary handling.

The best workgroup size depends on the algorithm and device limits. Sixty-four is a useful teaching choice, not a universal optimum. Query limits, benchmark representative data, and keep correctness independent of execution order.

## Choose an algorithm before choosing a group size

Also include zero-length input in your application policy. You may choose to skip dispatch entirely and display an empty result. That is usually clearer than constructing a nominal workload and hoping every buffer and binding combination remains valid with no useful elements.

Group width influences how data is divided, how much local memory is needed, and how invocations cooperate. A wider group is not inherently faster. It may increase pressure on resources or exceed device limits. The best choice depends on the kernel's memory access, arithmetic, synchronization, and the device's implementation.

For image filtering, a two-dimensional tile can improve reuse of neighboring values. For a map with no reuse, extra workgroup storage and barriers may only add cost. For a histogram, local bins can reduce global contention, but their size and merge strategy matter. Begin with a simple correct reference, then compare variants on representative data.

Keep correctness tests small and exact enough to inspect. Include lengths smaller than a group, exactly one group, just over one group, and several groups with a remainder. These cases exercise dispatch arithmetic and bounds handling. A kernel that works only for a convenient multiple of sixty-four has not yet solved the general data-layout problem.

**Optional application:** change the multiplication to a clamped nonlinear mapping and verify the eight results against JavaScript. Then design a sum reduction on paper: each workgroup produces a partial sum, and a second dispatch combines partials. Do not use one unsynchronized global variable as though GPU invocations were sequential loop iterations.
