# Organizing and extending a WebGL renderer

Once one object works, the challenge becomes managing many resources and techniques without turning render order into a fragile web of assumptions. This chapter collects the patterns that make raw WebGL usable beyond an isolated triangle.

**Working foundation:** the WebGL labs and their shared `webgl.js` helper. **Reading bridge:** Eck §§7.3–7.5; [scene graphs](https://webglfundamentals.org/webgl/lessons/webgl-scene-graph.html), [GPGPU](https://webglfundamentals.org/webgl/lessons/webgl-gpgpu.html), and [drawing many things](https://webglfundamentals.org/webgl/lessons/webgl-drawing-multiple-things.html).

## Grow from one draw to two before inventing an engine

Suppose your triangle renderer works and you now want two cubes. A tempting first attempt copies the entire setup code, including buffers and program creation, for the second object. That can render correctly, but it duplicates resources that describe the same shape and shader. The actual difference may be only the model matrix and base color. Identifying which data is shared is the first architectural step.

Keep one geometry resource containing the vertex/index buffers and VAO. Keep one linked program for the compatible shader structure. Create two object records referencing those resources, each with its own transform and material values. For every object, select the required program and vertex input, upload the object's values, and draw. This is still ordinary JavaScript iteration; no elaborate framework is required.

The following host-side integration sketch deliberately leaves native resource construction to the already complete cube lab:

```js
const objects = [
  { geometry: cubeGeometry, material: mintMaterial, model: leftModel },
  { geometry: cubeGeometry, material: blueMaterial, model: rightModel }
];
for (const object of objects) {
  gl.useProgram(object.material.program);
  gl.bindVertexArray(object.geometry.vao);
  gl.uniformMatrix4fv(object.material.modelLocation, false, object.model);
  gl.uniform3fv(object.material.colorLocation, object.material.color);
  gl.drawElements(gl.TRIANGLES, object.geometry.indexCount,
    object.geometry.indexType, 0);
}
```

This sketch assumes the material declares matching uniforms and the camera-related values have been prepared appropriately. It illustrates ownership and repetition, not an additional drop-in implementation. The shape is shared because both objects reference the same geometry record. Each matrix is different, so each draw places that shape independently. If a third object uses another material but the same geometry, you still need not duplicate the buffers.

## Separate data from drawing

A geometry resource owns vertex/index buffers and a VAO. A material description selects a program and values. An object has a transform and references geometry and material. A render pass chooses destination, clear policy, viewport, and draw list. This organization lets ten objects share one mesh and lets a shadow pass reuse geometry with a different program.

Cache uniform locations after linking. Recompile a program only when shader structure changes, not when a slider changes a numeric value. Update dynamic buffer ranges deliberately. Dispose shared resources only when no owner needs them. A scene graph computes transforms; it should not be the only source of render ordering.

## Separate changing values from changing program structure

A numeric slider usually changes data. Roughness, angle, light intensity, or a blending amount can be uniforms. A change in shader structure, such as enabling a fundamentally different algorithm through source generation, can require another compiled program. Recompiling when only an angle changes wastes work and can introduce a visible stall.

A program cache therefore needs a key describing the generated shader structure, not every numeric parameter. Conversely, two materials with different shader code must not accidentally share a cached program merely because they have the same friendly name. Store the program and its uniform locations together, because locations are associated with the linked program that produced them.

Think of setup as creating the machinery and frame updates as feeding it values. This distinction is familiar from JavaScript: you do not rebuild a parser every time a text field changes if the grammar is unchanged. Graphics has an additional cost because compilation and GPU resource management cross the host/driver boundary. Small architectural choices that respect stable resources can prevent performance issues before low-level optimization is necessary.

## A scene graph computes frames, not final draw order

Consider a car with four wheels. The wheel's local transform positions it relative to the car. The car's transform positions the assembly in the world. Multiplying them gives the wheel's world transform. If the car moves, all wheels move without rewriting their local attachment positions. This is a coordinate dependency tree.

Rendering has different dependencies. Opaque objects might be sorted by program or distance for efficiency. Transparent objects may need back-to-front ordering. A shadow pass uses a light camera and only shadow-casting geometry. Those orders need not match the parent-child traversal. You can traverse the graph to compute world transforms and collect renderable objects, then build separate lists for each pass.

A common error is to draw a child immediately while its parent's transform is being updated, then later introduce transparent sorting or another camera and discover that drawing is tangled with hierarchy evaluation. Separate the two responsibilities early: compute world state, then render that state. The final engine-architecture chapter develops this pattern further, but two passes are enough to make its benefit concrete.

## Make a sprite atlas an affine UV transform

A sprite quad usually has local UVs from zero to one. Suppose a texture atlas contains four columns and two rows. Each tile has normalized size `(1/4,1/2)`, or `(0.25,0.5)`. Tile column two, row one has an origin determined by your chosen row orientation. Under a bottom-origin row convention its offset is `(0.5,0.5)`.

The mapping is `atlasUV = tileOffset + localUV * tileSize`. Local UV `(0,0)` maps to the tile origin, and `(1,1)` to its opposite corner. This is the same scale-plus-translation relationship used in coordinate transforms. An animation changes which tile offset is selected over time. It does not require a new image upload for each frame.

Filtering can cross a tile boundary, so an atlas needs padding and suitable mip preparation. A barely visible border on one frame is often neighboring tile color leaking into a sample. Adding half a texel to one endpoint can help a particular simple lookup, but it is not a universal substitute for properly constructed gutters across mip levels. Your intended filter footprint determines the asset preparation needed.

A camera-facing billboard also transforms geometry. Its horizontal and vertical directions can be taken from the camera basis, so the quad stays oriented toward the viewer. A world-aligned sign, in contrast, keeps its own surface orientation. Both can use the same texture atlas. Geometry orientation and UV selection solve different parts of sprite appearance.

## Sprites, text, and 2D images

A sprite is commonly two triangles forming a quad, textured with an image. Animate atlas UVs rather than uploading an entire new image every frame. Camera-facing billboards derive their horizontal and vertical axes from the view basis. Transparent sprites need sensible depth and blend state, and soft particles can need scene-depth sampling to avoid hard intersections.

Text can be HTML positioned above the canvas, a Canvas-generated texture, or a glyph atlas. HTML gives accessibility and crisp layout. A glyph atlas batches many characters by selecting UV rectangles; signed-distance or multi-channel distance fields can keep edges crisp over a wider scale range. A glyph lookup, kerning, line layout, and accessibility still need consideration; putting letters in a texture does not solve typography automatically.

For a Canvas-generated texture, redraw only when the content changes, upload the changed texture, and reuse it. Do not create a new texture each frame. Account for alpha representation and gutters around glyphs to avoid filtering fringes.

## Understand a skybox as a direction lookup

A skybox represents the distant surroundings by direction. If you translate the viewer a small amount, the infinitely distant sky should not slide like a nearby wall. The lookup therefore uses view orientation but excludes camera translation. A cubemap converts a three-component direction into the appropriate face and local coordinates.

An environment reflection uses the direction in which a reflected ray leaves a surface. For a sharp mirror, one direction lookup is a useful approximation. A rough surface gathers a spread of directions, so a prefiltered environment better matches the material response. This is why making a rough metal brighter is not equivalent to making its reflected environment correct.

Fog uses another coordinate-dependent signal, commonly view depth or world distance. They differ away from the optical axis. A constant-density artistic fog can blend based on distance, while a more physical volume model accounts for transmittance and in-scattering along the ray. State the approximation you use. A simple fog term can communicate depth beautifully without being a complete atmospheric simulation.

## Cubemaps, skies, fog, and projection

A cubemap stores six face images. A direction selects a face and location, making it natural for skyboxes and environment lookups. A skybox shader reconstructs a view ray and samples the sky without applying camera translation. An environment reflection uses `reflect(-viewDirection, normal)` to query incoming radiance; a realistic rough reflection needs filtered data rather than one infinitely sharp lookup.

Fog blends a surface toward an atmospheric color based on a chosen depth or distance. Linear fog uses a remapped interval; exponential fog can use $1-e^{-\sigma d}$. It is an appearance approximation unless you model actual participating media. Projection mapping transforms world positions through another camera into texture coordinates, much like shadow-map lookup but sampling color instead of comparing depth.

## Decode a skinning equation into a tiny example

A skeleton is a hierarchy of transforms called joints or bones. A mesh vertex stores a few joint indices and corresponding weights. The joint matrices used for deformation include the relationship to the bind pose, the reference configuration in which the mesh was attached. Applying a current joint world matrix alone generally omits part of that relationship.

In a simplified two-joint example, one transformed candidate position is `(1,0,0)` and another is `(1,2,0)`. Weights 0.75 and 0.25 produce `0.75*(1,0,0) + 0.25*(1,2,0) = (1,0.5,0)`. Each joint proposes where the vertex would go; the weighted sum blends those proposals. Weights summing to one prevent an unintended overall scale in this simple affine combination.

This interpolation explains flexibility and a limitation. Blending rotated candidates can pull points inward around a bending joint, losing volume. A more sophisticated deformation method may reduce the artifact, but the basic linear blend is still widely useful. Normals must follow a compatible deformation treatment, and joint indices are discrete values. Do not interpolate joint identities across a primitive as though joint 2.5 were meaningful.

Morphing is a different data model. It stores corresponding alternate positions or offsets and combines them by weights. A smile target can move face vertices without a joint hierarchy. Topology correspondence is essential: element ten of one target must refer to the intended element ten of the base. Skeleton and morph animation can coexist because they solve different kinds of deformation.

## Skinning and morph targets

Skeletal animation stores bone transforms and per-vertex joint indices and weights. A basic linear blend skinning position is $p'=\sum_i w_iB_i p$, where the `B` matrices include the correct bind-space transforms and weights sum to one. Mixing arbitrary rotation matrices can lose volume around joints; this explains some twisting artifacts. The normal path must also follow the deformation consistently.

Morph targets store alternate vertex positions or offsets and blend them by weights. Their topology and attribute correspondence must match the base mesh. A face expression often suits morphs; an articulated limb suits a skeleton. The asset chapter shows how a loader supplies these structures rather than reimplementing them every time.

## Treat a numerical texture as a structured array

Imagine simulating a particle with position X, position Y, velocity X, and velocity Y. One RGBA floating-point texel can store those four components. A fragment shader reads one old-state texel, computes a new state, and writes one output texel. A render pass over a rectangular target becomes a way to evaluate a data-parallel update.

For width 128 and height 128, the image can store 16,384 such records. A particle index `i` maps to column `i % width` and row `floor(i / width)`. If using sampled coordinates, address the center with `((column+0.5)/width,(row+0.5)/height)`. For exact numerical records, interpolation between neighboring particles is usually meaningless, so use an exact texel-fetch or appropriate nearest policy rather than ordinary smooth color sampling.

Read old texture A and write new texture B, then swap. If the next state depends on neighboring old states, an in-place read/write feedback design is not a safe replacement. The ordering of fragment execution is not your simulation loop order. WebGL computation techniques work by respecting rendering's resource rules rather than escaping them.

Precision and capability choices follow the data. An RGBA8 texture can store only a small finite set of channel values and clamps a simple normalized color representation. A simulation may need signed values, larger range, or more precision. Floating-point storage, attachment renderability, filtering, and blending are separate questions. Check the exact role you need instead of treating one extension name as permission for every floating-point operation.

## GPU computation with textures

WebGL 2 has no general compute shader stage. You can encode state in textures, run a fragment shader over a target, then ping-pong input and output. Each fragment computes the next state for one cell. Floating-point storage, renderability, filtering, and blending are distinct capabilities; query extensions such as `EXT_color_buffer_float` for the intended format instead of assuming all float operations work.

WebGL 2 transform feedback can capture vertex shader outputs into buffers, useful for some particle updates. Neither technique is the same programming model as WebGPU compute. Prefer the simplest supported mechanism for the task.

## Prepare for failure without obscuring the normal path

A context can be lost because the browser or system reclaims GPU resources. If you support restoration, stop the current loop, handle the event according to browser requirements, and recreate the GPU resources afterward. Keeping the JavaScript description of a mesh is useful because the old GPU handle is no longer a valid stored mesh. Application state and GPU state should not be assumed to have identical lifetimes.

Resource cleanup needs a similarly explicit policy. A geometry shared by ten objects should survive removal of one. A pass-owned temporary image can be disposed with that pass. Event listeners and animation callbacks also consume lifetime; deleting a texture does not stop a callback from trying to use it next frame. The lab mount/cleanup boundary is a small example of treating ownership as part of correctness.

For performance, distinguish CPU submission from GPU completion. A fast return from a draw call does not prove the GPU finished the image quickly. Reading data back immediately can force waiting and change the workload being measured. Use representative scenes and the intended profiling facilities, then optimize the limiting stage. A renderer becomes manageable when its data flow, ownership, and measurement boundaries are visible.

## Resilience and profiling

Handle `webglcontextlost` by preventing the default if you plan restoration and stopping rendering; recreate resources after `webglcontextrestored`. Do not keep using old GPU handles. Label resources in your own bookkeeping. Use browser GPU tools and supported disjoint timer query extensions for GPU timing; discard invalid timing samples when the disjoint flag indicates unreliable results.

Multiple views can share one canvas with viewport and scissor rectangles. Many canvases can mean many contexts and duplicated resources. A mini-map, main view, and inspector often fit better in one managed renderer. Exporting screenshots, reading pixels, and rendering offscreen should be explicit passes with known dimensions and output conversion.

**Optional application:** refactor a two-object raw renderer into geometry, material, object, and pass records. Add a sprite overlay as a separate pass. The goal is to make every resource’s owner and every pass’s input/output obvious before adding more features.
