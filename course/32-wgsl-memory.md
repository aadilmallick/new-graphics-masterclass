# WGSL, bindings, and memory layout

WGSL is WebGPU’s shading language. Its explicit stage annotations and address spaces make resource roles visible. The main new challenge for a JavaScript programmer is matching binary memory layout: the GPU does not know the property structure of a JavaScript object.

**Experiments:** [WebGPU triangle](#/lab/webgpu-triangle) and [textured WebGPU cube](#/lab/webgpu-cube). **Reading bridge:** Eck §9.3, modernized; [data memory layout](https://webgpufundamentals.org/webgpu/lessons/webgpu-memory-layout.html) and the [WGSL specification](https://www.w3.org/TR/WGSL/).

## Entry points and declarations

`@vertex`, `@fragment`, and `@compute` identify entry functions. `@builtin(position)` is a clip-space position output in the vertex stage; `@location(0)` labels an inter-stage or vertex-input slot. `@group(0) @binding(1)` identifies a resource slot in a bind group, a different namespace from vertex locations.

Use `let` for an immutable local binding, `var` for a mutable variable, `const` for a creation-time constant, and `override` for a pipeline-overridable constant where supported by the intended expression context. Types such as `f32`, `u32`, `vec3f`, and `mat4x4f` describe numeric representations. `vec3f` is shorthand for `vec3<f32>`. WGSL uses `fn`, explicit parameter types, and `->` for return types.

Address spaces include `function`, `private`, `workgroup`, `uniform`, and `storage`. Uniform resources are read-only inputs. Storage buffers can be declared read-only or read/write. Workgroup variables are shared only among invocations in one compute workgroup, not all workgroups in a dispatch.

## Bytes, size, and alignment

A 32-bit scalar occupies four bytes. **Size** is how many bytes a value’s representation needs. **Alignment** is the required multiple for its starting offset. A `vec3f` has size 12 but alignment 16. That does not mean every vec3 member always consumes 16 bytes independently of what follows.

For this struct:

```wgsl
struct ObjectParams {
  position: vec3f,
  radius: f32,
  tint: vec4f,
};
```

`position` starts at byte 0 and occupies 12 bytes. `radius` can start at byte 12, filling the fourth word. `tint` starts at byte 16 and occupies 16 bytes. The struct alignment is 16 and size is 32. A JavaScript `Float32Array(8)` can hold it as `[px, py, pz, radius, red, green, blue, alpha]`.

A `mat4x4f` occupies four vec4 columns, 64 bytes. A `mat3x3f` has three vec3 columns with 16-byte column stride, totaling 48 bytes, not 36. An array of vec3 values also has 16-byte element stride. Host-shareable layout rules and address-space constraints must be followed for nested arrays and structs; use the specification or a reliable layout calculator when structures grow.

## Pack one actual lab struct

The textured cube uses `mvp: mat4x4f`, `model: mat4x4f`, `light: vec4f`. Their offsets are 0, 64, and 128 bytes, total 144 bytes. Its host array is 36 floats:

```js
const values = new Float32Array(36);
values.set(mvp, 0);       // float offset 0 = byte offset 0
values.set(model, 16);    // float offset 16 = byte offset 64
values.set([1, 2, 3, 0], 32);
device.queue.writeBuffer(uniformBuffer, 0, values);
```

Typed-array indices count elements; WebGPU buffer offsets count bytes. Keep those units explicit. For mixed integer and float fields, create views over the same `ArrayBuffer` at the correct byte offsets. `new Uint32Array(floatArray)` numerically converts values; it does not reinterpret the same bits.

## Member alignment is not binding-offset alignment

If many object structs share one buffer and bind groups select different offsets, the binding offset must respect device limits such as `minUniformBufferOffsetAlignment`. Dynamic offsets have the relevant alignment requirement too. A 32-byte struct does not imply every binding can start 32 bytes after the previous one. Compute an aligned stride from the actual device limit:

$$
\operatorname{roundUp}(a,n)=a\left\lceil n/a\right\rceil.
$$

For a 144-byte object and alignment 256, stride is 256. That does not require padding every member inside the WGSL struct to 256. These are separate contracts.

## Vertex layouts are another contract

Vertex buffers use explicit `arrayStride`, `offset`, `format`, and `shaderLocation`. Their packed layout does not automatically follow uniform-struct layout. The cube uses a 32-byte vertex: position at 0, normal at 12, UV at 24. Three tightly packed floats are valid in a `float32x3` vertex attribute at the described offset even though a `vec3f` inside a storage array has different stride rules.

## Debugging layout failures

Begin with one struct containing simple known values. Display one parameter as color. Verify byte offsets on paper and compare the allocated buffer size with the bound range. Label buffers and bindings. If every fourth vector appears wrong, inspect stride or padding before changing math. If pipeline creation fails, inspect entry points, bindings, formats, and visibility rather than assuming the GPU silently guessed your intended layout.

**Optional application:** pack two `ObjectParams` records into a storage buffer and compute their offsets. Then plan uniform bindings with a hypothetical 256-byte offset alignment. The difference between the compact storage layout and aligned binding stride should now be explainable in bytes.
