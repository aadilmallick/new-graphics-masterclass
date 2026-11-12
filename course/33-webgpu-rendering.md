# 3D rendering and textures in WebGPU

The textured cube is a complete native WebGPU renderer in miniature. It combines indexed geometry, model/view/projection math, normal-based lighting, a texture, a sampler, and a depth attachment. Compare it directly with the raw WebGL cube to see which ideas stay the same.

**Experiment:** [A textured WebGPU world](#/lab/webgpu-cube). **Source:** `labs/20-webgpu-cube.js`. **Reading bridge:** Eck §§9.2, 9.4–9.5; Learn WebGPU’s buffers, textures, and lighting topic families.

## Describe vertex records explicitly

Each cube vertex stores eight floats: position XYZ, normal XYZ, UV. Eight floats are 32 bytes. The pipeline declares one buffer layout with `arrayStride: 32` and three attributes: `float32x3` at offset 0/location 0, `float32x3` at offset 12/location 1, and `float32x2` at offset 24/location 2.

The WGSL vertex entry point receives the corresponding `@location` inputs. Its output contains `@builtin(position)` plus normal and UV values for interpolation. The shader multiplies local position by the MVP matrix, while the normal uses the model’s rotation. This is valid because the model has only rotation. With nonuniform scale, supply an inverse-transpose normal transform instead.

The index buffer uses `Uint16Array` and is bound with `'uint16'`. `pass.drawIndexed(indices.length)` consumes index count. The same “complete vertex record” rule from WebGL explains why a hard-edged cube has four records per face rather than only eight shared positions.

## Match the depth convention

The math helper’s `webgpu=true` option creates a projection whose divided near and far depths are 0 and 1. A WebGL projection cannot be reused unchanged. The pipeline declares `depth24plus`, depth writes enabled, and comparison `'less'`. Each frame’s render pass includes a matching depth attachment cleared to 1.

Resize the depth texture when the canvas drawing buffer changes. A mismatched attachment size or sample count is a validation error. Destroy the old depth resource after replacing it appropriately. The lab creates a fresh view from the current canvas texture every frame.

## Texture, view, and sampler are separate

The lab creates a 32 × 32 `rgba8unorm-srgb` texture with `TEXTURE_BINDING | COPY_DST` usage. A view is bound to one resource slot. A separate sampler describes repeat addressing and linear filtering in another slot. The fragment shader declares:

```wgsl
@group(0) @binding(1) var image: texture_2d<f32>;
@group(0) @binding(2) var imageSampler: sampler;
```

`textureSample(image, imageSampler, uv)` combines both. The sRGB texture format decodes color samples into linear values for lighting. The fragment shader encodes the final linear result for the canvas output path used by this simple example. It uses the piecewise sRGB function, not an extra tone-mapping pipeline. Keep the shader’s values within the intended range or add a deliberate HDR/display transform.

The small lab has one mip level for clarity. A production texture should supply appropriate mip levels when minified. WebGPU does not offer a universal `generateMipmap` call like WebGL’s convenience operation; generate levels with render/compute passes or load precomputed data. A sampler’s mipmap filter cannot create missing levels.

## Uploads and row layout

`queue.writeTexture` copies CPU data into texture storage using a layout such as bytes per row. The lab’s RGBA8 rows have 32 × 4 = 128 bytes. Do not blindly impose a 256-byte rule on every write operation: command-encoder buffer-to-texture copies have row-pitch constraints that differ from `queue.writeTexture`. Consult the exact operation’s validation rules and format block dimensions.

External images can be copied with `copyExternalImageToTexture` under its source and destination rules. Decide orientation, alpha, and color-space policy explicitly. CORS still matters for cross-origin sources. Resource flags and formats must support the operation you request.

## MSAA and multiple outputs

For multisampling, create a multisampled color attachment, configure the pipeline’s matching sample count, and resolve into a single-sample output. The depth attachment must also match sample count. The canvas texture is typically the resolve destination rather than the multisampled storage itself. MSAA improves geometric sample coverage; it does not automatically fix all shader or texture aliasing.

Multiple color outputs can write to multiple render attachments, enabling deferred data or custom pipelines. Their formats and locations must match the pipeline. More attachments increase storage and bandwidth. Start with one clearly understood output, then add only the data a later pass needs.

**Optional application:** add a second texture binding and mix its sampled color with the checker. Then add mip generation as a separate resource-preparation step. Keep geometry, sampling, depth, and display conversion independently testable.
