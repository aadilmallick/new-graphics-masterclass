# 3D rendering and textures in WebGPU

The textured cube is a complete native WebGPU renderer in miniature. It combines indexed geometry, model/view/projection math, normal-based lighting, a texture, a sampler, and a depth attachment. Compare it directly with the raw WebGL cube to see which ideas stay the same.

**Experiment:** [A textured WebGPU world](#/lab/webgpu-cube). **Source:** `labs/20-webgpu-cube.js`. **Reading bridge:** Eck §§9.2, 9.4–9.5; Learn WebGPU’s buffers, textures, and lighting topic families.

## Assemble the renderer as a set of solved problems

The first native triangle established shader modules, a pipeline, a uniform buffer, bind groups, and command encoding. A textured three-dimensional object adds several problems, but none requires abandoning that foundation. We need actual mesh records, a depth policy, a camera transform, a sampled image, and lighting vectors in a consistent frame.

Treat each addition as a reasoned extension. Vertex buffers answer where mesh data lives. An index buffer answers how those records form triangles. A projection matrix answers how view-space positions become clip coordinates. A depth attachment answers which overlapping surface is nearer. A texture and sampler answer how a surface coordinate becomes color. The final shader combines those answers into one image.

If the cube fails after one addition, temporarily remove that addition's influence. A fixed unlit color can establish geometry and depth. A UV gradient can establish the texture-coordinate path. A normal visualization can establish orientation. A checker texture can establish sampling. These diagnostic states are more informative than changing every subsystem at once.

## Describe vertex records explicitly

Each cube vertex stores eight floats: position XYZ, normal XYZ, UV. Eight floats are 32 bytes. The pipeline declares one buffer layout with `arrayStride: 32` and three attributes: `float32x3` at offset 0/location 0, `float32x3` at offset 12/location 1, and `float32x2` at offset 24/location 2.

The WGSL vertex entry point receives the corresponding `@location` inputs. Its output contains `@builtin(position)` plus normal and UV values for interpolation. The shader multiplies local position by the MVP matrix, while the normal uses the model’s rotation. This is valid because the model has only rotation. With nonuniform scale, supply an inverse-transpose normal transform instead.

The index buffer uses `Uint16Array` and is bound with `'uint16'`. `pass.drawIndexed(indices.length)` consumes index count. The same “complete vertex record” rule from WebGL explains why a hard-edged cube has four records per face rather than only eight shared positions.

## Trace one vertex record in bytes

The first eight floats in a vertex record might be position `(1,-1,-1)`, normal `(1,0,0)`, and UV `(0,0)`. The first position component is at byte zero. The normal begins after three floats, at byte twelve. UV begins after six floats, at byte twenty-four. The next vertex begins after eight floats, at byte thirty-two.

The pipeline's attribute descriptors reproduce that exact structure. `shaderLocation` chooses a WGSL input slot, `offset` chooses where its data starts within the record, and `format` chooses how many components and which representation are read. `arrayStride` determines how far to advance to reach the next record. The shader parameter names can be descriptive, but the location annotations establish the connection.

This packed vertex layout does not need the uniform-buffer padding rules from the previous lesson. Its formats and stride explicitly describe how to fetch attributes. Keeping these contracts distinct is crucial: a tightly packed normal at byte twelve is correct here, while a vec3 array in a storage buffer can require a different stride.

The upload helper allocates a buffer with the requested role plus COPY_DST, then writes the typed array into it. The vertex buffer has VERTEX usage; the index buffer has INDEX usage. The helper is small because the role is supplied as data, but the roles remain explicit and validated.

## Why the cube duplicates corners

A geometric corner can belong to three faces with different outward normals. If all faces shared one vertex record at that point, there would be only one normal value to fetch. Averaging those normals would create smooth shading across what should be a sharp box edge. The cube instead uses four complete records per face and six faces, for twenty-four records.

Each face's six indices refer to its four records in two triangles. The sequence `o,o+1,o+2,o,o+2,o+3` reuses the diagonal endpoints within that face. With six faces, the index list has thirty-six entries. Calling `drawIndexed(36)` therefore draws twelve triangles, not thirty-six triangles and not thirty-six unique geometric corners.

UVs also belong to records. Giving each face its own four UV corners makes the checker pattern easy to understand. In a more complex model, UV seams can require duplicated records even when normals are smooth. Attribute sharing is a property of the complete record, not only of position equality.

## Trace a frame's transforms

The frame callback builds a model rotation around Y. It builds a view matrix looking from `(3,2.2,5)` toward the origin. It builds a perspective projection using the current aspect ratio, a positive near distance, a larger far distance, and the WebGPU depth convention. Then it multiplies projection by view, and that product by model.

For column vectors, the rightmost transform acts first. A local corner is rotated into world space, then expressed relative to the camera, then projected. The shader does not need to reconstruct these matrices from separate scalar properties. It receives the combined MVP plus the model matrix needed for its simple world-space normal calculation.

Why keep both when MVP already includes model? Position and normal have different jobs. The normal should not receive translation or projection. Because this model contains only rotation, multiplying its direction with W zero by model is valid. A more general renderer would provide an appropriate normal transform when scale or other deformation requires it.

The light vector `(1,2,3)` is interpreted in the same world frame as the transformed normal. It is normalized before the dot product. A view-space light vector would need a view-space normal instead. A renderer can choose either frame, but mixing them produces highlights and brightness that change incorrectly as the camera moves.

## Match the depth convention

The math helper’s `webgpu=true` option creates a projection whose divided near and far depths are 0 and 1. A WebGL projection cannot be reused unchanged. The pipeline declares `depth24plus`, depth writes enabled, and comparison `'less'`. Each frame’s render pass includes a matching depth attachment cleared to 1.

Resize the depth texture when the canvas drawing buffer changes. A mismatched attachment size or sample count is a validation error. Destroy the old depth resource after replacing it appropriately. The lab creates a fresh view from the current canvas texture every frame.

## Depth is both storage and policy

The depth texture is storage. `depthCompare: 'less'` is policy: it says that a candidate nearer depth should pass relative to the stored value under this projection convention. `depthWriteEnabled: true` says passing opaque geometry updates the stored depth. The render pass clears that depth to one, establishing an initially far value.

Imagine two fragments reaching the same sample with divided depths 0.3 and 0.7. If 0.7 arrives first, it passes against one and writes 0.7. The later 0.3 is less and replaces it. If 0.3 arrives first, 0.7 subsequently fails. The final opaque result is the nearer surface in either ordering. This is the behavior the raw WebGL cube illustrated with its depth-test control.

The depth texture must match the render target's extent for the intended pass and must have a compatible sample count. The lab tracks width and height and destroys/recreates depth when the canvas changes dimensions. Retaining a depth texture sized for an old canvas is a resource-configuration error, not a camera-math problem.

## Texture, view, and sampler are separate

The lab creates a 32 × 32 `rgba8unorm-srgb` texture with `TEXTURE_BINDING | COPY_DST` usage. A view is bound to one resource slot. A separate sampler describes repeat addressing and linear filtering in another slot. The fragment shader declares:

```wgsl
@group(0) @binding(1) var image: texture_2d<f32>;
@group(0) @binding(2) var imageSampler: sampler;
```

`textureSample(image, imageSampler, uv)` combines both. The sRGB texture format decodes color samples into linear values for lighting. The fragment shader encodes the final linear result for the canvas output path used by this simple example. It uses the piecewise sRGB function, not an extra tone-mapping pipeline. Keep the shader’s values within the intended range or add a deliberate HDR/display transform.

The small lab has one mip level for clarity. A production texture should supply appropriate mip levels when minified. WebGPU does not offer a universal `generateMipmap` call like WebGL’s convenience operation; generate levels with render/compute passes or load precomputed data. A sampler’s mipmap filter cannot create missing levels.

## Construct the texture as inspectable data

The lab generates an RGBA checker in JavaScript. A 32 by 32 image has 1,024 texels. Four bytes per texel give 4,096 bytes. The row pitch is thirty-two times four, or 128 bytes. Each texel receives one of two known four-channel values based on its integer X and Y pattern.

An asymmetric test image would additionally make orientation obvious, but the checker has the advantage that filtering and repetition are easy to see. The shader multiplies UV by three, so each face repeats the texture three times along each axis. The sampler's repeat addressing makes coordinates beyond one wrap back through the image.

Texture storage, texture view, and sampler remain separate objects. The view says which texture data is exposed to the shader. The sampler says how coordinates are addressed and filtered. The bind group provides each at its declared resource slot. Changing a sampler policy is not the same operation as uploading a new set of texels.

## Uploads and row layout

`queue.writeTexture` copies CPU data into texture storage using a layout such as bytes per row. The lab’s RGBA8 rows have 32 × 4 = 128 bytes. Do not blindly impose a 256-byte rule on every write operation: command-encoder buffer-to-texture copies have row-pitch constraints that differ from `queue.writeTexture`. Consult the exact operation’s validation rules and format block dimensions.

External images can be copied with `copyExternalImageToTexture` under its source and destination rules. Decide orientation, alpha, and color-space policy explicitly. CORS still matters for cross-origin sources. Resource flags and formats must support the operation you request.

## Interpret upload alignment rules by operation

The texture's 128-byte row works with the lab's `queue.writeTexture` call. Some buffer-to-texture copy paths require row pitch aligned to 256 bytes. If you assume that rule applies identically to every upload API, you may add unnecessary padding or reject a valid example. If you ignore it for an operation that requires it, validation fails.

The general discipline is more useful than memorizing one number: read the exact operation's source layout contract, format block dimensions, extent, and usage requirements. An RGBA8 texel is simple; compressed formats have block-based constraints. A copy from an external image has another set of source and color/alpha decisions. Keep those cases separate until their common structure is understood.

## Work through color decoding and lighting

The texture uses an sRGB format because its bytes are color data. Sampling produces decoded linear-light values for the fragment calculation. The material's diffuse factor is a base contribution plus a positive normal-light alignment. Multiplying the decoded color by this factor gives an illustrative linear-light shaded value.

At a face normal aligned exactly with the normalized light direction, the dot is one and the factor is `0.12 + 0.88 = 1`. At a perpendicular normal, the factor is 0.12. At a back-facing normal relative to the light, the negative dot is clamped, again leaving the base contribution. This is a teaching model of direct shape shading, not a complete PBR environment.

The fragment function then uses a piecewise sRGB encoding function for the chosen simple canvas path. The low-value branch multiplies by 12.92; the higher branch uses the nonlinear power relationship. This is separate from HDR tone mapping. Because the lab's chosen inputs and factor remain controlled, it does not need to introduce an additional exposure/compression system to teach the texture path.

Do not copy that final encoding into every pipeline indiscriminately. An sRGB attachment view or a later output pass can change who owns conversion. The rule is to know the representation at each boundary and apply the intended display conversion exactly once. A built-in engine material path can make different output arrangements from this direct native example.

## MSAA and multiple outputs

For multisampling, create a multisampled color attachment, configure the pipeline’s matching sample count, and resolve into a single-sample output. The depth attachment must also match sample count. The canvas texture is typically the resolve destination rather than the multisampled storage itself. MSAA improves geometric sample coverage; it does not automatically fix all shader or texture aliasing.

Multiple color outputs can write to multiple render attachments, enabling deferred data or custom pipelines. Their formats and locations must match the pipeline. More attachments increase storage and bandwidth. Start with one clearly understood output, then add only the data a later pass needs.

## Extend the example without losing the reference

When exporting or capturing the final image, preserve the intended output representation too. A correct on-screen result does not automatically establish that copied bytes have the encoding expected by an image file. Capture belongs to the same explicit data-flow reasoning as rendering and sampling.

A useful next step is to bind a second generated texture and mix colors with a uniform weight. Keep the original checker accessible as a diagnostic state. If sampling fails, replace the final output with UV color; if that works, inspect binding and texture setup rather than changing vertex matrices.

For a mipmapped extension, allocate the intended mip count and fill each level through a deliberate generation or loading step. Make the sampler's mip policy match available data. For an MSAA extension, add a multisampled target and matching depth/pipeline settings, then resolve into the presentation texture. Add one new compatibility contract at a time so failures remain attributable.

**Optional application:** add a second texture binding and mix its sampled color with the checker. Then add mip generation as a separate resource-preparation step. Keep geometry, sampling, depth, and display conversion independently testable.
