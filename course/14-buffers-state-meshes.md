# Buffers, vertex arrays, meshes, and state

The GPU does not receive a JavaScript object with named position fields. It receives bytes plus a description of how to interpret them. Understanding that description makes mesh formats, instancing, and WebGPU layouts much easier later.

**Experiment:** [Raw WebGL cube](#/lab/webgl-cube). **Reading bridge:** Eck §§3.4 and 6.1.5–6.1.8; [indexed vertices](https://webglfundamentals.org/webgl/lessons/webgl-indexed-vertices.html) and [attributes](https://webglfundamentals.org/webgl/lessons/webgl-attributes.html).

## Data and its view

An `ArrayBuffer` is a region of bytes. A `Float32Array` interprets groups of four bytes as 32-bit floating-point numbers. A `Uint16Array` interprets pairs as unsigned 16-bit integers. Constructing two typed-array views over the same buffer does not convert numbers; constructing a new typed array from another typed array copies and converts values. That distinction becomes critical in WGSL struct packing.

`gl.bufferData(target, data, usage)` creates or replaces a buffer’s data store. `STATIC_DRAW` is a usage hint, not an enforcement rule. `bufferSubData` updates a range without replacing the whole store. For frequent changes, consider data size, synchronization, and update frequency before deciding which path is best.

## Reconstruct a vertex fetch as address arithmetic

The GPU can fetch attributes only because the host describes where each value lives. Work through one record in bytes before looking at a complex mesh. A 32-bit float occupies four bytes. In the cube lab, a position contains three floats and therefore occupies twelve bytes. Its normal contains another three floats, another twelve bytes. The entire position/normal record is twenty-four bytes.

For vertex index 0, position begins at byte 0 and normal at byte 12. For vertex index 1, position begins at byte 24 and normal at byte 36. For vertex index 2, they begin at byte 48 and byte 60. The general formula for an attribute address is `recordIndex * stride + attributeOffset`. The attribute's component count and numeric type then tell WebGL how many values to read and how to interpret their bits.

This arithmetic explains why a wrong stride can produce an image that is recognizable in one area and wildly distorted elsewhere. If the real stride is 24 but you declare 12, vertex 1's position comes from vertex 0's normal. The first position can still look correct because its address is zero under both formulas. The error grows in structure as subsequent records are misread. A shader compile log will not diagnose this: the shader is valid, but the host described the data incorrectly.

Here is a complete console calculation of the layout, independent of a graphics context:

```js
const floatsPerPosition = 3;
const floatsPerNormal = 3;
const bytesPerFloat = Float32Array.BYTES_PER_ELEMENT;
const stride = (floatsPerPosition + floatsPerNormal) * bytesPerFloat;
const normalOffset = floatsPerPosition * bytesPerFloat;
for (let vertex = 0; vertex < 3; vertex++) {
  console.log({
    vertex,
    positionByte: vertex * stride,
    normalByte: vertex * stride + normalOffset
  });
}
```

The printed records are `(0,0,12)`, `(1,24,36)`, and `(2,48,60)` when read as vertex/position/normal. `BYTES_PER_ELEMENT` keeps the conversion explicit rather than scattering unexplained fours through the code. The actual typed array still contains six numbers per record. A typed-array index and a WebGL byte offset are two different units describing the same storage.

## Uploading data does not describe its meaning

Creating a GPU buffer gives you a handle. Binding it chooses a target for subsequent operations. Uploading a `Float32Array` copies bytes. None of those operations says that the first twelve bytes are a position. That meaning arrives through the vertex-input configuration. The separation lets one buffer hold different kinds of data and lets different programs interpret a compatible resource in different ways.

The cube calls `buffer(gl, new Float32Array(vertices))`. The helper creates and binds an array buffer, then calls `bufferData` with `STATIC_DRAW`. Next, `attribute(gl,0,3,24,0)` enables location zero and describes three floats at byte offset zero with a twenty-four-byte stride. `attribute(gl,1,3,24,12)` supplies the normal. The helper does not infer the relationship from names; the numeric locations agree with the shader's explicit layout declarations.

`STATIC_DRAW` communicates an expected usage pattern. It does not make the buffer immutable, and it does not verify that you draw only once. A static mesh can be uploaded once and drawn every frame. A dynamic mesh can update a range with `bufferSubData`. Reallocating the whole store is another option, with different synchronization implications. Begin with a correct ownership/update policy, then measure whether a particular upload strategy matters for your workload.

Suppose only a particle's position changes while its color stays constant. Interleaving everything means an update may touch bytes belonging to unchanged fields. Separate position and color buffers can simplify that update. Conversely, a static mesh whose attributes are always consumed together can be convenient to store as interleaved records. Layout is a design decision about access and update patterns, not a universal contest with one winning arrangement.

## Separate and interleaved layouts

In a separate layout, positions and normals occupy different buffers. In an interleaved layout, one record contains position followed by normal. Our cube uses six floats per record: 24 bytes, with position at byte 0 and normal at byte 12. Neither is inherently always faster. Interleaving is convenient when attributes are consumed and updated together; separate buffers help when one attribute changes much more often than the others.

A vertex array object, **VAO**, records attribute enables, formats, buffer associations, divisors, and the element-array binding. It does not store the shader program, textures, uniform values, blend state, or framebuffer. Confusing those boundaries creates draws that work only after a particular previous draw.

## Understand what a vertex array remembers

A useful way to think about a VAO is as a saved vertex-reader configuration. It remembers enabled attributes, the buffer captured for each attribute, the component format, stride, offset, and divisor. It also remembers the element-array buffer binding. Binding a VAO prepares that vertex-reading relationship without manually repeating every pointer description.

The subtle step is that `vertexAttribPointer` captures the currently bound array buffer for the selected attribute. Merely binding a new `ARRAY_BUFFER` afterward does not redirect every existing attribute pointer to that new buffer. If a draw reads an unexpected buffer, inspect the point at which the pointer was specified. The current array-buffer binding and the buffers recorded inside a VAO are related state, but they are not the same thing.

A VAO does not remember the entire draw. The program is selected separately. Uniform values belong to the program state. Textures occupy context bindings, and the framebuffer chooses the destination. This explains a characteristic bug: geometry renders correctly only after another object was drawn first. The first object accidentally established state that the second draw needed but never set for itself.

For a small renderer, make a draw function establish its dependencies in a predictable order: program, VAO, uniforms, texture bindings, and render-state policy. You may later skip redundant state changes through a cache, but only after defining the complete state each draw logically requires. Optimization should remove proven redundancy, not preserve accidental dependence on the previous draw.

## Derive the indexed cube's record count

A cube has eight spatial corners, six square faces, and twelve triangles. Why does our buffer contain twenty-four records? Inspect one corner where three faces meet. The front face's outward normal might be `(0,0,1)`, the right face's `(1,0,0)`, and the top face's `(0,1,0)`. One record cannot hold all three normals simultaneously. The position is shared geometrically, but the full vertex attributes are different.

Each square face uses four records so its two triangles can share their edge consistently. Six faces times four records gives twenty-four. Each record has six floats, so the vertex buffer contains 144 floats. At four bytes per float that is 576 bytes. Each face needs six indices, giving 36 indices for the cube. At two bytes per `Uint16Array` element, the index buffer occupies 72 bytes. Total geometry storage for this simple layout is therefore 648 bytes, excluding object handles and driver bookkeeping.

If we expanded every triangle without indices, twelve triangles times three vertices gives thirty-six records. At twenty-four bytes each that is 864 bytes. The indexed representation saves storage and can improve vertex processing reuse. Real GPU behavior depends on caching and draw structure, but the record arithmetic already explains why indices are useful.

The same reasoning applies to UV seams. A sphere's seam can use the same spatial position with U equal to zero on one side and one on the other. Those are distinct records even when the normal is identical. Deduplicating by position alone can weld a texture seam incorrectly. Deduplicate only when the complete set of relevant attributes is compatible.

## Indices reuse complete records

A quad can be made from triangles `(0,1,2)` and `(0,2,3)`. An index buffer stores the sequence `0,1,2,0,2,3`, allowing four vertex records instead of six. `drawElements` uses an index count, an index type, and a byte offset into that index buffer.

```js
gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
```

This cube draw consumes 36 indices, not 36 unique positions. Each face has four records with its own normal. Six faces therefore use 24 records even though a cube has only eight geometric corners. Sharing only by position would smooth normals across edges and change the appearance.

Indices must refer to available records in every enabled attribute stream. A large mesh may need 32-bit indices, supported directly in WebGL 2. Do not request `UNSIGNED_INT` while uploading a `Uint16Array`: the bytes will be interpreted incorrectly.

## Treat a draw command's numbers as a typed contract

In `drawElements`, the count is how many indices to consume, not how many triangles and not how many unique vertices. A count of 36 with triangle topology requests twelve triangles. The index type tells WebGL how many bytes make one index. The final offset is a byte offset into the element buffer and must satisfy the index type's alignment requirements.

For example, to draw the second face's six indices in a tightly packed `Uint16Array`, the starting offset is six earlier indices times two bytes, or twelve bytes. Passing offset six would start in the wrong place because six is not a count of index elements in that argument. Giving names such as `indexByteOffset` makes these distinctions visible in host code.

Every referenced index must be valid for every enabled input stream used by the program. Having enough position records does not compensate for an undersized normal buffer. If geometry corruption starts at a particular index, inspect record lengths and maximum referenced index before changing the shader. The problem may be a malformed mesh rather than a matrix error.

## Visibility state is part of your scene's meaning

Depth testing compares a candidate fragment with stored depth. Depth writing controls whether an accepted fragment updates that storage. These are independent switches. An opaque object normally uses both. A translucent object often tests against opaque depth but avoids writing its own depth, so later transparent layers can still contribute. This is a policy choice with limitations, not a perfect solution to arbitrary transparency.

Imagine a transparent pane drawn first with depth writes enabled. It writes a near depth even where it contributes only a faint color. A transparent object behind it may then fail the depth test completely, disappearing rather than blending through the pane. Disabling depth writes for the transparent pass addresses this case, but back-to-front ordering is still generally needed for ordinary alpha compositing.

Face culling is another policy. It can remove interior faces of a closed solid, but a leaf represented by one plane might need both sides visible. Negative scaling can reverse orientation. If a mesh disappears only from one direction, display both sides temporarily to diagnose winding, then decide the intended final material/culling behavior. A global workaround can hide an asset-authoring problem without explaining it.

## Depth, culling, and blending belong to a draw policy

Opaque solid objects commonly enable depth testing and depth writing, disable blending, and optionally cull back faces. Translucent objects commonly enable blending, retain depth testing, disable depth writing, and use a suitable order. Two-sided surfaces need explicit normal and material choices, not just a global “disable all culling forever” workaround.

Before clearing depth, ensure the depth write mask allows the clear to affect it; state persists between passes. Before drawing to a different target, set its viewport. Before uploading a matrix uniform, select its program. A robust renderer establishes required state rather than relying on leftovers.

## Multiple objects and scene graphs

To draw several objects with the same program, keep camera and lighting uniforms shared, then update each model transform and material inputs before its draw. Group draws by expensive state changes when profiling justifies it. A scene graph organizes transforms; a render list organizes draw order. These are related but different structures.

The raw cube source calculates `projection * view * model` using our tested math module. Position is transformed with the whole product; the normal uses only rotation in this example. Because the model has no nonuniform scale, that simplified normal transform is valid. The next lighting chapter explains the general case.

## Instancing preview

Instancing repeats one geometry with different per-instance data. An attribute divisor of 1 advances its input once per instance rather than once per vertex. A matrix requires four vector attribute locations. `drawElementsInstanced` then repeats the indexed geometry. This reduces CPU submission but not the total shading cost of visible geometry.

## Follow the cube lab from setup to teardown

The source constructs face records and index data once during `mount`. It compiles one program and prepares one VAO. Each frame computes a model rotation, a view matrix, and a perspective matrix. It clears both color and depth, selects the program and VAO, uploads model and combined MVP, then issues one indexed draw. The slider changes FOV or speed data, not shader structure.

On teardown, the animation loop stops before GPU objects are deleted. This order prevents a later frame from trying to use deleted resources. The buffer, index buffer, VAO, and program each have an explicit lifetime. A larger application may share geometry among many objects, so disposing one object must not automatically delete a shared buffer. Ownership is the bridge from this small example to a reliable renderer.

**Optional application:** add a second cube by reusing the same VAO and program but changing the model uniform before a second draw. Then compare that structure with Three.js `InstancedMesh` after the scene chapters.
