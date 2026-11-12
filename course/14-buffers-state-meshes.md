# Buffers, vertex arrays, meshes, and state

The GPU does not receive a JavaScript object with named position fields. It receives bytes plus a description of how to interpret them. Understanding that description makes mesh formats, instancing, and WebGPU layouts much easier later.

**Experiment:** [Raw WebGL cube](#/lab/webgl-cube). **Reading bridge:** Eck §§3.4 and 6.1.5–6.1.8; [indexed vertices](https://webglfundamentals.org/webgl/lessons/webgl-indexed-vertices.html) and [attributes](https://webglfundamentals.org/webgl/lessons/webgl-attributes.html).

## Data and its view

An `ArrayBuffer` is a region of bytes. A `Float32Array` interprets groups of four bytes as 32-bit floating-point numbers. A `Uint16Array` interprets pairs as unsigned 16-bit integers. Constructing two typed-array views over the same buffer does not convert numbers; constructing a new typed array from another typed array copies and converts values. That distinction becomes critical in WGSL struct packing.

`gl.bufferData(target, data, usage)` creates or replaces a buffer’s data store. `STATIC_DRAW` is a usage hint, not an enforcement rule. `bufferSubData` updates a range without replacing the whole store. For frequent changes, consider data size, synchronization, and update frequency before deciding which path is best.

## Separate and interleaved layouts

In a separate layout, positions and normals occupy different buffers. In an interleaved layout, one record contains position followed by normal. Our cube uses six floats per record: 24 bytes, with position at byte 0 and normal at byte 12. Neither is inherently always faster. Interleaving is convenient when attributes are consumed and updated together; separate buffers help when one attribute changes much more often than the others.

A vertex array object, **VAO**, records attribute enables, formats, buffer associations, divisors, and the element-array binding. It does not store the shader program, textures, uniform values, blend state, or framebuffer. Confusing those boundaries creates draws that work only after a particular previous draw.

## Indices reuse complete records

A quad can be made from triangles `(0,1,2)` and `(0,2,3)`. An index buffer stores the sequence `0,1,2,0,2,3`, allowing four vertex records instead of six. `drawElements` uses an index count, an index type, and a byte offset into that index buffer.

```js
gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
```

This cube draw consumes 36 indices, not 36 unique positions. Each face has four records with its own normal. Six faces therefore use 24 records even though a cube has only eight geometric corners. Sharing only by position would smooth normals across edges and change the appearance.

Indices must refer to available records in every enabled attribute stream. A large mesh may need 32-bit indices, supported directly in WebGL 2. Do not request `UNSIGNED_INT` while uploading a `Uint16Array`: the bytes will be interpreted incorrectly.

## Depth, culling, and blending belong to a draw policy

Opaque solid objects commonly enable depth testing and depth writing, disable blending, and optionally cull back faces. Translucent objects commonly enable blending, retain depth testing, disable depth writing, and use a suitable order. Two-sided surfaces need explicit normal and material choices, not just a global “disable all culling forever” workaround.

Before clearing depth, ensure the depth write mask allows the clear to affect it; state persists between passes. Before drawing to a different target, set its viewport. Before uploading a matrix uniform, select its program. A robust renderer establishes required state rather than relying on leftovers.

## Multiple objects and scene graphs

To draw several objects with the same program, keep camera and lighting uniforms shared, then update each model transform and material inputs before its draw. Group draws by expensive state changes when profiling justifies it. A scene graph organizes transforms; a render list organizes draw order. These are related but different structures.

The raw cube source calculates `projection * view * model` using our tested math module. Position is transformed with the whole product; the normal uses only rotation in this example. Because the model has no nonuniform scale, that simplified normal transform is valid. The next lighting chapter explains the general case.

## Instancing preview

Instancing repeats one geometry with different per-instance data. An attribute divisor of 1 advances its input once per instance rather than once per vertex. A matrix requires four vector attribute locations. `drawElementsInstanced` then repeats the indexed geometry. This reduces CPU submission but not the total shading cost of visible geometry.

**Optional application:** add a second cube by reusing the same VAO and program but changing the model uniform before a second draw. Then compare that structure with Three.js `InstancedMesh` after the scene chapters.
