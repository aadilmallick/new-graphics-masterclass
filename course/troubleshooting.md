# Debugging field guide

Start with the first failed layer. A blank image can result from a missing browser capability, an invisible canvas, a compile error, incorrect state, bad coordinates, or a material with no light. Changing all of them at once destroys useful evidence.

## The surface is blank

Confirm the canvas exists and has nonzero CSS and drawing-buffer dimensions. Clear to a conspicuous color. If that fails, check context creation and whether another context type already owns the canvas. If clear works, use a fixed triangle and fixed fragment color. Only then add attributes, uniforms, transforms, textures, and lighting.

Read shader compilation and program linking logs. In WebGPU, read module compilation messages, validation errors, and pipeline-creation rejection. Check the console for an earlier JavaScript exception that stopped setup. The course lab displays startup errors in the experiment stage so the lesson remains usable.

## Geometry is missing or distorted

| Symptom | Inspect first |
| --- | --- |
| Shape stretches after resize | Aspect ratio, camera projection update, viewport dimensions |
| Object disappears when rotated | Winding, culling, clipping, bounds |
| Random spikes | Index type, stride, offsets, buffer lengths |
| Everything at the origin | Attribute enable, binding, shader location, missing matrix |
| Orbit rather than spin | Local origin and transform order |
| Child unexpectedly moves | Parent transforms and local versus world coordinates |
| Far surfaces flicker | Near/far ratio, coplanar geometry, depth precision |
| Shader-deformed object is culled | CPU bounds do not include GPU displacement |

Visualize a known coordinate as color. Replace the model matrix with identity, then add transforms one at a time. Test projection near/far endpoints numerically. A transposed matrix can create an image that looks almost plausible, so compare a known point rather than guessing from a complex mesh.

## Lighting looks wrong

Display normals as `n * 0.5 + 0.5`. Verify they are normalized and in the same frame as light and view vectors. If scaling changes the lighting strangely, inspect inverse-transpose normal handling. If highlights stick to the object incorrectly, inspect whether the light or view direction was transformed into the intended frame.

Try an unlit material. If that looks correct, the geometry/visibility path probably works. A metal without useful surroundings can be dark. A visible emissive surface may not illuminate neighbors in a raster renderer. Exposure, environment, direct lights, shadows, and base color each have a separate role.

For shadows, verify renderer support enabled, light casts, object casts/receives, and the light camera includes the geometry. Use helpers to view shadow bounds. Acne suggests precision/bias issues; detached shadows can indicate too much bias. Increasing resolution without tightening a giant frustum can waste memory.

## Color, alpha, or textures disagree

Check color-texture decoding and final output conversion. Annotate sRGB base-color/emission maps, keep normal/roughness/metalness maps numerical, and apply display conversion once. Compare custom shader output to a built-in material under a simple setup.

Black textures can indicate an incomplete mip chain, wrong texture unit, wrong sampler binding, failed image upload, unsupported format combination, or cross-origin restrictions. Use a tiny generated checker first. If that works, the problem is likely in image loading or metadata. Check UV orientation with a labeled asymmetric image, not a symmetric checker alone.

Dark alpha fringes suggest straight/premultiplied mismatch or filtering from unsuitable transparent-edge RGB. Transparent sorting artifacts can remain even with correct blend factors. Decide whether the intended effect is alpha compositing, alpha testing, additive glow, or physical transmission.

## WebGPU validation

Confirm every buffer/texture has the required usage flags. Match target formats, sample counts, binding types, shader stages, and resource ranges. Distinguish vertex-buffer packing from uniform/storage struct layout. A vec3 has size 12 and alignment 16; an array’s stride or a matrix column stride can insert padding.

Binding-offset alignment follows the device limit, not just struct size. A staging read buffer needs mapping/copy usage compatible with its role. Do not submit GPU work using a buffer while it is mapped. Copy data out of a mapped range before unmapping if you need to retain it.

For compute, check workgroup counts and global bounds. If a shader uses barriers, all required invocations must reach them under the language’s uniformity rules. A barrier inside one workgroup cannot order every workgroup globally. Separate algorithm stages into dispatches when global dependencies require it.

## The scene slows down or leaks

Compare fixed scene states. Lower resolution to isolate fragment/bandwidth pressure; simplify materials; disable one shadow or post pass at a time. Inspect draw and resource counts, while remembering they are not timing measurements. Check for allocations and buffer uploads in every frame.

Enter and leave a lab repeatedly. Resource counts should stabilize under the intended ownership model. Stop loops, remove event listeners, dispose controls and targets, and delete owned GPU resources. A late async loader should not attach to a scene already replaced. A WebGPU device loss requires recreation, not reuse of old handles.

## Local build and deployment

Run the project through `npm run dev`, not `file://`. Use the project directory for package commands. `npm run check` detects missing lessons, broken internal lab links, missing diagrams, and invalid math expressions. `npm test` checks mathematical conventions. `npm run build` verifies bundling. The built site is in `dist`.

On a hosted subpath, inspect asset base paths and hash routing. Check that model/decoder/texture files were included if you add them. Test the deployed image, not only the local server. Browser support must be detected at runtime; a readable fallback is a successful capability-handling result, while a silent empty canvas is not.

**A useful debugging note contains:** the smallest reproduction, expected result, observed result, first error message, coordinate conventions, relevant resource layout, and one change that alters the failure. That is enough evidence to reason from rather than randomly rewriting the scene.
