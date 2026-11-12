# Compute shaders and readback

A compute shader performs GPU work without pretending that the result is a color in a triangle. It is useful for regular data-parallel tasks such as particle updates, image filters, reductions, histograms, and geometry generation. It is not automatically faster than JavaScript for small jobs, especially if data must travel back immediately.

**Experiment:** [Numbers on the GPU](#/lab/webgpu-compute). **Source:** `labs/17-webgpu-compute.js`. **Reading bridge:** Eck §9.6; [compute basics](https://webgpufundamentals.org/webgpu/lessons/webgpu-compute-shaders.html).

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

## Encoding and storage roles

Create a compute pipeline, bind resources, begin a compute pass, set pipeline and bind group, dispatch, end, and submit. The work buffer has `STORAGE | COPY_DST | COPY_SRC`: shaders use it as storage, JavaScript uploads input through a copy destination, and a later command copies output from it.

Uniforms carry small shared parameters such as the multiplier. Use correct alignment; the lab uses a 16-byte vec4 uniform to keep the layout straightforward. Changing the factor does not change shader structure or pipeline identity.

## Readback uses a staging buffer

A GPU storage resource is not an ordinary JavaScript array you can synchronously inspect. The lab creates a separate buffer with `COPY_DST | MAP_READ`, copies results into it with the command encoder, submits, then awaits `mapAsync(GPUMapMode.READ)`.

```js
await readBuffer.mapAsync(GPUMapMode.READ);
const result = new Float32Array(readBuffer.getMappedRange()).slice();
readBuffer.unmap();
```

The `.slice()` copies values into independent CPU-owned memory before unmapping. The mapped range is tied to the buffer’s mapping lifetime; do not keep using it afterward. A mapped buffer cannot simultaneously be used by the GPU in the normal way. Manage repeated readbacks with state or a ring of staging buffers rather than overlapping incompatible map operations.

The displayed cells are actual mapped compute results. The application serializes updates so rapidly moving the slider cannot map the same buffer twice. It reuploads the original input for each run, so factor changes do not compound previous multiplication.

## Workgroups and shared memory

Invocations in one workgroup can cooperate using `var<workgroup>` storage and barriers. A workgroup barrier must be reached under the required uniform control flow by the participating invocations. Returning early before a barrier in only some lanes can invalidate the algorithm. A bounds check that returns is fine in our independent multiplication shader because it has no later barrier.

A workgroup barrier does not synchronize every workgroup in a dispatch. For a global multi-stage reduction, write partial results, end the appropriate pass/dispatch sequence, then run another dispatch consuming them. Atomics coordinate particular memory operations; they do not make arbitrary racing reads and writes safe.

## Common compute patterns

A map transforms each element independently. A reduction combines many elements, such as a sum or maximum. A scan computes prefixes and often supports compaction. A histogram counts values into bins and may use atomics. An image filter reads a neighborhood and writes a new texture. Tiling a filter into shared memory can reduce repeated global reads, but adds synchronization and boundary handling.

The best workgroup size depends on the algorithm and device limits. Sixty-four is a useful teaching choice, not a universal optimum. Query limits, benchmark representative data, and keep correctness independent of execution order.

**Optional application:** change the multiplication to a clamped nonlinear mapping and verify the eight results against JavaScript. Then design a sum reduction on paper: each workgroup produces a partial sum, and a second dispatch combines partials. Do not use one unsynchronized global variable as though GPU invocations were sequential loop iterations.
