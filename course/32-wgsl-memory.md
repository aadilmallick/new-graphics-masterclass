# WGSL, bindings, and memory layout

WGSL is WebGPU’s shading language. Its explicit stage annotations and address spaces make resource roles visible. The main new challenge for a JavaScript programmer is matching binary memory layout: the GPU does not know the property structure of a JavaScript object.

**Experiments:** [WebGPU triangle](#/lab/webgpu-triangle) and [textured WebGPU cube](#/lab/webgpu-cube). **Reading bridge:** Eck §9.3, modernized; [data memory layout](https://webgpufundamentals.org/webgpu/lessons/webgpu-memory-layout.html) and the [WGSL specification](https://www.w3.org/TR/WGSL/).

## Why a JavaScript object cannot be uploaded as a struct

In JavaScript you can create `{ position: [1, 2, 3], radius: 0.5 }` and access its properties by name. That object is an application-level structure. It does not promise that the three coordinates and radius occupy sixteen consecutive bytes in a particular format. A shader cannot follow JavaScript property references through browser memory.

Instead, JavaScript creates a byte representation and uploads it into a GPU resource. WGSL describes how the shader interprets that representation. The two sides must agree without inspecting each other's intentions. A property named radius in your application does not automatically match a WGSL member named radius unless you place the correct value at the correct byte offset.

This can feel unfamiliar because ordinary JavaScript programming lets you ignore binary layout most of the time. The cure is to begin with a small diagram or table of bytes. One 32-bit float occupies four bytes. Four consecutive floats occupy sixteen. Once that simple representation is clear, vectors, matrices, structs, and arrays become combinations of explicit rules rather than mysterious padding.

## Build a host representation one field at a time

Begin with four scalar floats representing X, Y, Z, and radius. The following complete console example creates one block of bytes and inspects its size:

```js
const values = new Float32Array([1, 2, 3, 0.5]);
console.log(values.length);      // 4 numeric elements
console.log(values.byteLength);  // 16 bytes
console.log(values.byteOffset);  // 0 within its ArrayBuffer
```

`length` counts elements, while `byteLength` counts bytes. A four-byte element size connects them in this particular array type. A `Uint16Array` has two-byte elements, so its corresponding multiplication differs. Never assume that an API parameter named offset counts the same unit as a typed-array index.

Now treat the first three floats as one position and the fourth as radius. A WGSL struct with vec3 position followed by scalar radius can use those exact sixteen bytes. The position begins at byte zero, a multiple of sixteen. Its three components occupy bytes zero through eleven. Radius needs only four-byte alignment and starts at byte twelve. The next object record starts at byte sixteen if this struct's array layout permits that stride.

The important observation is that alignment does not mean each value must be followed by an equally large empty region. Alignment constrains where the next member may begin. A scalar can use the space after a vec3 because its own starting requirement is less restrictive. This is the source of many misleading explanations that casually call every vec3 sixteen bytes long.

## Entry points and declarations

`@vertex`, `@fragment`, and `@compute` identify entry functions. `@builtin(position)` is a clip-space position output in the vertex stage; `@location(0)` labels an inter-stage or vertex-input slot. `@group(0) @binding(1)` identifies a resource slot in a bind group, a different namespace from vertex locations.

Use `let` for an immutable local binding, `var` for a mutable variable, `const` for a creation-time constant, and `override` for a pipeline-overridable constant where supported by the intended expression context. Types such as `f32`, `u32`, `vec3f`, and `mat4x4f` describe numeric representations. `vec3f` is shorthand for `vec3<f32>`. WGSL uses `fn`, explicit parameter types, and `->` for return types.

Address spaces include `function`, `private`, `workgroup`, `uniform`, and `storage`. Uniform resources are read-only inputs. Storage buffers can be declared read-only or read/write. Workgroup variables are shared only among invocations in one compute workgroup, not all workgroups in a dispatch.

## Distinguish four namespaces in one renderer

A vertex attribute location names data entering the vertex stage from a described vertex layout. An inter-stage location names data transferred from vertex output to fragment input. A resource binding identifies a buffer, texture, or sampler within a bind group. A JavaScript typed-array index identifies an element within CPU memory. The number zero can appear in all four places without referring to the same concept.

In the textured cube, vertex location zero is position. Group zero binding zero is the uniform buffer. Uniform float index zero is the first coefficient of MVP. The fragment color output at location zero selects the first color target. Their shared numeral is simply a local label in several independent interfaces.

Naming these roles explicitly prevents a common debugging mistake: changing an attribute location when the actual problem is a bind-group entry. Follow data from CPU bytes to buffer resource to bind group to shader declaration, or from vertex bytes to vertex layout to vertex input. Those are distinct routes into a shader.

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

## Change member order and recalculate

Consider a different struct containing `scale: f32`, `position: vec3f`, and `radius: f32`. Scale starts at byte zero and occupies four bytes. Position must start at a multiple of sixteen, so it cannot start immediately at byte four. Bytes four through fifteen are padding, and position starts at sixteen. Its size twelve brings the next free byte to twenty-eight. Radius can start there and occupies bytes twenty-eight through thirty-one.

The resulting struct size is thirty-two bytes after rounding to its required alignment. Reordering to position, radius, scale would put position at zero, radius at twelve, and scale at sixteen, followed by final struct padding to reach a multiple of sixteen. That also has size thirty-two, but the meaningful values occupy different offsets. A matching total size alone does not establish a correct layout.

This is why host code should use named offset constants or a layout helper for nontrivial structures. An array with the right number of floats can still contain fields in the wrong positions. A diagnostic shader that displays one member as color can reveal this much faster than a complex final lighting shader.

## Mixed numeric types require shared views

Suppose a storage record contains a floating-point intensity and an unsigned integer object ID. Both occupy four bytes, but their bit representations differ. Writing the ID through a float view stores a floating-point encoding of that number, which an integer shader member would interpret as a very different integer.

Use two views over one ArrayBuffer when the record contains different types. This is a complete console experiment:

```js
const record = new ArrayBuffer(8);
const floats = new Float32Array(record);
const integers = new Uint32Array(record);
floats[0] = 0.75;
integers[1] = 42;
console.log(floats[0], integers[1]); // 0.75, 42
console.log(new Uint32Array(new Float32Array([42]))[0]); // 42: numeric conversion
```

The first pair of views points into the same bytes. The final expression creates a new array from another typed array and numerically converts its elements. That is not a bit reinterpretation. If you need to inspect the bit pattern of a float, create another view over its `.buffer` with the appropriate offset and length rather than passing the float array as an iterable of values.

The shader side must have the same field ordering and types. A host struct diagram should therefore include not only offset and size, but also type. A sixteen-byte block containing four floats is not interchangeable with any arbitrary sixteen-byte WGSL struct.

## Understand matrix columns as stored vectors

We use column vectors in equations and column-major flat arrays in code. A mat4x4f consists of four four-component columns. Each column needs sixteen bytes, so the matrix occupies sixty-four. When `Float32Array.set` copies sixteen values from our math helper, it preserves the column-major ordering the shader multiplication expects.

A mat3x3f contains three vec3 columns. Each column's starting offset must satisfy sixteen-byte alignment, so the columns start at bytes zero, sixteen, and thirty-two. Their meaningful components occupy twelve bytes each. The storage includes spacing to support those starts, producing a forty-eight-byte matrix representation. Packing nine floats consecutively into thirty-six bytes does not match it.

For a numerical example, the identity mat3 can be packed as columns `[1,0,0,pad]`, `[0,1,0,pad]`, `[0,0,1,pad]`. Padding is not a fourth mathematical row. It is unused representation space between columns. Confusing representation padding with geometric components can lead to incorrectly applying a mat4 transform where a mat3 normal transform was intended.

## Arrays introduce their own stride

An array needs a repeatable distance from one element's start to the next. That distance must satisfy the element's alignment as well as contain its size. For an array of vec3f in the relevant ordinary storage layout, each new vector begins sixteen bytes after the previous one, even though only twelve bytes contain vector components.

For ten vectors, a naive host representation of thirty floats occupies 120 bytes. The padded array representation occupies 160 bytes. A shader reading vector one expects its X at byte sixteen, which is float index four. In the naive host array, float index four is the second vector's Y. The result can look like shifted or scrambled data without producing a helpful high-level error about your intent.

Uniform address-space layout can impose additional requirements, especially for arrays and nested structures. Do not extrapolate one storage-buffer example into every uniform layout. The practical method remains the same: identify the address space, apply its actual member and array rules, and record offsets before filling the bytes.

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

## Dynamic offsets are record selection, not member packing

Suppose each object's uniform struct occupies 144 bytes, as in the cube. If the device requires a 256-byte binding-offset alignment, object zero can start at byte zero and object one at byte 256. The 112 bytes between the end of the first record and start of the second are spacing between bound records. The members inside each record remain at offsets zero, sixty-four, and 128 relative to that record's start.

For object three, a 256-byte stride gives starting offset 768. Its model matrix begins at 768 plus sixty-four, or byte 832. Its light vector begins at 768 plus 128, or byte 896. This arithmetic is ordinary addition once the two levels of layout are separated.

Do not hardcode 256 as a universal device truth. It is a useful worked example and a common kind of alignment, but correct code uses the relevant reported limit and its intended binding path. Also make sure the bound size and total allocation cover the selected record. A correct member layout cannot compensate for a binding range that ends too early.

## Vertex layouts are another contract

Vertex buffers use explicit `arrayStride`, `offset`, `format`, and `shaderLocation`. Their packed layout does not automatically follow uniform-struct layout. The cube uses a 32-byte vertex: position at 0, normal at 12, UV at 24. Three tightly packed floats are valid in a `float32x3` vertex attribute at the described offset even though a `vec3f` inside a storage array has different stride rules.

## Debugging layout failures

Begin with one struct containing simple known values. Display one parameter as color. Verify byte offsets on paper and compare the allocated buffer size with the bound range. Label buffers and bindings. If every fourth vector appears wrong, inspect stride or padding before changing math. If pipeline creation fails, inspect entry points, bindings, formats, and visibility rather than assuming the GPU silently guessed your intended layout.

## Develop a layout-debugging routine

Treat padding bytes as representation details rather than application properties. Initialize the allocated storage predictably, but never rely on an unused padding value to communicate a hidden parameter to a shader. Give every meaningful input a declared member and a documented offset.

Write the shader struct first, then a table containing every field's type, alignment, size, and offset. Calculate the final struct size and any array or binding stride separately. Fill one record with unmistakable values such as position `(1,2,3)`, radius four, and a bright diagnostic color. Avoid starting with hundreds of random records that make shifted values hard to recognize.

Upload that record and use a tiny shader that displays or reports one relevant quantity. Compare CPU byte offsets with shader results before adding geometry, lighting, or simulation. Keep the layout table next to the host packing code so a later added field cannot silently invalidate every following offset.

**Optional application:** pack two `ObjectParams` records into a storage buffer and compute their offsets. Then plan uniform bindings with a hypothetical 256-byte offset alignment. The difference between the compact storage layout and aligned binding stride should now be explainable in bytes.
