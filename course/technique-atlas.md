# Technique atlas

The core course gives a complete path through the main systems. This atlas connects additional techniques from the requested sources to that foundation. Code here is deliberately labeled as integration fragments; the numbered labs remain the complete runnable references. Each recipe states its mechanism and limits so you can choose an extension intelligently.

## Sprites and drawImage-style rendering

A textured quad is a small general-purpose image renderer. Store four corners, draw two indexed triangles, transform the corners, and sample a texture. To select an atlas tile, map a unit UV with `uv = tileOffset + localUV * tileScale`. A sprite animation changes the tile offset at a time-based rate. Add padding around tiles to prevent bilinear/mipmap bleeding.

Canvas `drawImage` handles source/destination rectangles at a higher level. Recreating it in WebGL means supplying those rectangles as coordinate transforms and UV ranges. Rotated sprites use the same local-origin matrix composition as every other object. For many compatible sprites, instance the quad and provide transform/UV/color per instance.

## Matrix stacks and articulated models

A transform stack saves a parent matrix, multiplies by a child transform, draws, and restores. A recursive scene graph performs the same composition naturally. For a robot arm, put the elbow at the end of the upper-arm local frame, then rotate the lower arm around its own origin. A mesh centered far from its pivot makes this harder; use a wrapper group or author local geometry sensibly.

The orbit lab is the complete reference for inherited transforms. Canvas `save`/`restore` is the 2D counterpart, with drawing state included. Neither stack automatically solves collisions or inverse kinematics; those are additional algorithms on top of the hierarchy.

## Text as HTML, Canvas, and glyph atlases

Use HTML for readable accessible interface text. To attach a label to a world point, project that point through the camera, map NDC to the canvas’s CSS rectangle, then position an absolutely placed DOM element. Hide labels behind the camera and define how occlusion should work; projecting alone does not tell whether a wall blocks the point.

For a texture label, draw text into an offscreen Canvas, make a `CanvasTexture`, mark its color space appropriately, and reuse it. This integration fragment assumes an imported Three.js module:

```js
const labelCanvas = document.createElement('canvas');
labelCanvas.width = 512; labelCanvas.height = 128;
const labelContext = labelCanvas.getContext('2d');
labelContext.fillStyle = '#82ebcc';
labelContext.font = '48px sans-serif';
labelContext.fillText('Graphics Atelier', 16, 80);
const labelTexture = new THREE.CanvasTexture(labelCanvas);
labelTexture.colorSpace = THREE.SRGBColorSpace;
// Assign labelTexture to a suitable material map; dispose it when owned use ends.
```

If text changes, redraw then set `labelTexture.needsUpdate = true`; do not create a new texture on every frame. A glyph atlas batches letters into one texture, but requires metrics, kerning, line breaking, UV selection, and an accessibility strategy. Distance-field fonts improve scale behavior but are still sampled representations.

## Toon ramps and contour lines

Compute a diffuse alignment factor `d = max(dot(n,l),0)`, then quantize it or use it to sample a 1D color ramp stored in a thin 2D texture. Nearest filtering creates hard bands; filtered ramps soften them. This is a stylized material response, not a new visibility algorithm.

Outlines can come from inverted hull geometry, depth/normal edge detection, or analytic contours. Each has failure modes: hull thickness varies with scale and perspective unless corrected; image-space edges depend on screen resolution and available buffers; normal discontinuities can draw internal edges you may not want.

## Cubemaps, skies, and local reflections

A cubemap’s six faces represent directions. A sky sample should use view direction without camera translation. Reflective objects query a reflected direction; rough materials need prefiltered radiance. A local dynamic capture renders six directions and can be expensive. Avoid capturing the reflective object into its own environment unless the recursive effect is deliberately managed.

For planar mirrors, reflect the viewer camera across a plane and clip the scene consistently to avoid geometry leaking through the mirror. Projective texture mapping reuses camera transforms to place the reflected image. Screen-space reflection is cheaper in some cases but lacks offscreen and hidden data.

## Fog and atmospheric separation

Linear fog remaps distance into a blend weight. Exponential transmittance uses $T=e^{-\sigma d}$, and the simplest fog blend uses `surface*T + fogColor*(1-T)`. `sigma` is an extinction-like coefficient in inverse distance units. This is a homogeneous single-color approximation; volumetric shafts require a model of scattering and visibility along the view/light paths.

Use world distance or view depth intentionally. They differ toward screen edges. Fog can hide a distant cutoff and reinforce scale, but it should not conceal broken geometry or an overly large depth range.

## Projective texturing and multiple textures

Transform a world point through a projector’s view/projection matrix, perform the divide, and map into texture coordinates. Define behavior outside the projector volume. This is closely related to shadow-map lookup. Blend a projected decal with a base material using a mask; handle angle/occlusion according to the effect’s needs.

Two image textures require two resource bindings and two sampled values. A blend factor can be uniform, a vertex attribute, another texture, or a procedural field. Decode color data before light arithmetic. Numerical masks do not automatically need sRGB decoding. “More textures” is a resource-binding and sampling problem, not a different kind of geometry.

## Skinning and morphing

Linear blend skinning combines bone-space transforms weighted per vertex. Include inverse bind matrices and the correct mesh/root conventions; bone world matrices alone are not the full formula. Weights should follow the asset format’s normalization rules. Joint indices are integer identities, not smoothly interpolated values.

Morph targets blend corresponding vertex positions or deltas. A matching topology is essential. Animation clips can change transform components, bone poses, or morph weights. The glTF loader and `AnimationMixer` provide a practical path through these structures, while the earlier vector/matrix rules explain their operation.

## Vertex pulling and drawing without buffers

A vertex shader can derive positions from `gl_VertexID` in WebGL 2 or `vertex_index` in WGSL. The fullscreen triangle labs use this to generate three corners without a vertex buffer. Vertex pulling reads records manually from a texture or storage buffer, allowing custom indexing and layouts at the cost of explicit addressing work.

Do not assume omitting a vertex buffer removes vertex shader work. You still execute invocations and fetch/compute data. This is useful for generated fullscreen passes, procedural geometry, or specialized data layouts; ordinary mesh attributes remain a good default.

## Deferred rendering and multiple targets

A deferred path writes a G-buffer containing selected geometry/material information, then evaluates lights from that data. It can reduce repeated material work under many lights but consumes memory/bandwidth and complicates transparency and some material models. Normal encoding, depth reconstruction, precision, and sample layout all become deliberate choices.

WebGL 2 supports multiple draw buffers; WebGPU pipelines can declare multiple color targets. Match each shader output to its attachment format and intended color/data meaning. A normal buffer is numerical data and should not be display encoded just because it is stored in a color attachment.

## Compute image filters and histograms

A compute filter reads an input texture and writes a separate output storage texture. Use an explicit bounds check for rounded dispatch dimensions. For a neighborhood filter, consider tiling into workgroup memory and loading a halo region. All participating invocations must reach required barriers; do not early-return some lanes before a shared-memory barrier.

A histogram increments bins, often using atomic operations. Local workgroup histograms can reduce global contention before combining partial results. For floating-point accumulation, choose a supported atomic/algorithm strategy rather than assuming every floating type supports arbitrary atomics. Numerical order can affect floating-point sums even when races are prevented.

## Capture, picking, and multiple views

For screenshots, render at a known output size and capture after the intended frame with the correct display conversion. Avoid permanently retaining the drawing buffer unless necessary. For ID picking, disable blending and any conversion that changes encoded IDs; inspect multisampled boundary policy.

For multiple views in one WebGL canvas, use viewport and scissor rectangles and clear the intended region. A main camera and mini-map can share resources. Multiple contexts duplicate many resources and have implementation limits. In WebGPU, organize views as explicit passes or attachment regions with compatible policies.

## Portability and extension boundaries

Float texture storage, filtering, color renderability, and blending are separate capabilities. A supported format in one role does not establish all others. Read device limits, request only required optional features, and provide fallback quality or a readable explanation. Cross-origin policy and asynchronous image loading remain browser concerns even when the rendering math is correct.

Use [the source coverage map](#/lesson/sources) to reach companion articles for each family. The atlas is a set of transfer patterns: the practical question is always which data is stored, which program reads it, in what coordinate space, under which resource and sampling rules.
