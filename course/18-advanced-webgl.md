# Organizing and extending a WebGL renderer

Once one object works, the challenge becomes managing many resources and techniques without turning render order into a fragile web of assumptions. This chapter collects the patterns that make raw WebGL usable beyond an isolated triangle.

**Working foundation:** the WebGL labs and their shared `webgl.js` helper. **Reading bridge:** Eck §§7.3–7.5; [scene graphs](https://webglfundamentals.org/webgl/lessons/webgl-scene-graph.html), [GPGPU](https://webglfundamentals.org/webgl/lessons/webgl-gpgpu.html), and [drawing many things](https://webglfundamentals.org/webgl/lessons/webgl-drawing-multiple-things.html).

## Separate data from drawing

A geometry resource owns vertex/index buffers and a VAO. A material description selects a program and values. An object has a transform and references geometry and material. A render pass chooses destination, clear policy, viewport, and draw list. This organization lets ten objects share one mesh and lets a shadow pass reuse geometry with a different program.

Cache uniform locations after linking. Recompile a program only when shader structure changes, not when a slider changes a numeric value. Update dynamic buffer ranges deliberately. Dispose shared resources only when no owner needs them. A scene graph computes transforms; it should not be the only source of render ordering.

## Sprites, text, and 2D images

A sprite is commonly two triangles forming a quad, textured with an image. Animate atlas UVs rather than uploading an entire new image every frame. Camera-facing billboards derive their horizontal and vertical axes from the view basis. Transparent sprites need sensible depth and blend state, and soft particles can need scene-depth sampling to avoid hard intersections.

Text can be HTML positioned above the canvas, a Canvas-generated texture, or a glyph atlas. HTML gives accessibility and crisp layout. A glyph atlas batches many characters by selecting UV rectangles; signed-distance or multi-channel distance fields can keep edges crisp over a wider scale range. A glyph lookup, kerning, line layout, and accessibility still need consideration; putting letters in a texture does not solve typography automatically.

For a Canvas-generated texture, redraw only when the content changes, upload the changed texture, and reuse it. Do not create a new texture each frame. Account for alpha representation and gutters around glyphs to avoid filtering fringes.

## Cubemaps, skies, fog, and projection

A cubemap stores six face images. A direction selects a face and location, making it natural for skyboxes and environment lookups. A skybox shader reconstructs a view ray and samples the sky without applying camera translation. An environment reflection uses `reflect(-viewDirection, normal)` to query incoming radiance; a realistic rough reflection needs filtered data rather than one infinitely sharp lookup.

Fog blends a surface toward an atmospheric color based on a chosen depth or distance. Linear fog uses a remapped interval; exponential fog can use $1-e^{-\sigma d}$. It is an appearance approximation unless you model actual participating media. Projection mapping transforms world positions through another camera into texture coordinates, much like shadow-map lookup but sampling color instead of comparing depth.

## Skinning and morph targets

Skeletal animation stores bone transforms and per-vertex joint indices and weights. A basic linear blend skinning position is $p'=\sum_i w_iB_i p$, where the `B` matrices include the correct bind-space transforms and weights sum to one. Mixing arbitrary rotation matrices can lose volume around joints; this explains some twisting artifacts. The normal path must also follow the deformation consistently.

Morph targets store alternate vertex positions or offsets and blend them by weights. Their topology and attribute correspondence must match the base mesh. A face expression often suits morphs; an articulated limb suits a skeleton. The asset chapter shows how a loader supplies these structures rather than reimplementing them every time.

## GPU computation with textures

WebGL 2 has no general compute shader stage. You can encode state in textures, run a fragment shader over a target, then ping-pong input and output. Each fragment computes the next state for one cell. Floating-point storage, renderability, filtering, and blending are distinct capabilities; query extensions such as `EXT_color_buffer_float` for the intended format instead of assuming all float operations work.

WebGL 2 transform feedback can capture vertex shader outputs into buffers, useful for some particle updates. Neither technique is the same programming model as WebGPU compute. Prefer the simplest supported mechanism for the task.

## Resilience and profiling

Handle `webglcontextlost` by preventing the default if you plan restoration and stopping rendering; recreate resources after `webglcontextrestored`. Do not keep using old GPU handles. Label resources in your own bookkeeping. Use browser GPU tools and supported disjoint timer query extensions for GPU timing; discard invalid timing samples when the disjoint flag indicates unreliable results.

Multiple views can share one canvas with viewport and scissor rectangles. Many canvases can mean many contexts and duplicated resources. A mini-map, main view, and inspector often fit better in one managed renderer. Exporting screenshots, reading pixels, and rendering offscreen should be explicit passes with known dimensions and output conversion.

**Optional application:** refactor a two-object raw renderer into geometry, material, object, and pass records. Add a sprite overlay as a separate pass. The goal is to make every resource’s owner and every pass’s input/output obvious before adding more features.
