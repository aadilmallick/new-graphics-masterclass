# Post-processing and color pipelines

Post-processing treats a rendered image as input to another rendering operation. It can add bloom, grade color, detect edges, simulate lens effects, or combine several views. It also adds textures, bandwidth, and ordering constraints. A clear pass graph is more useful than an unexplained chain of effects.

**Experiment:** [Light after the lens](#/lab/post-processing). **Reading bridge:** Eck §7.4 and the earlier framebuffer lesson; [Three.js post-processing](https://threejs.org/manual/en/post-processing.html).

## The pass graph

The lab uses the WebGL renderer and `EffectComposer`:

```js
composer.addPass(new RenderPass(scene, camera));
composer.addPass(bloom);
composer.addPass(new OutputPass());
```

The first pass renders scene radiance into a target. Bloom extracts sufficiently bright regions, blurs them at several scales, and adds a controlled contribution. `OutputPass` applies the final tone mapping and output color conversion. The complete source includes construction, resizing, rendering, and disposal of these resources.

Keep scene-referred lighting calculations in a suitable linear representation. Tone mapping compresses intensity for display, and output color conversion encodes that display result. Applying these before a bloom threshold changes the meaning of “bright.” Applying output conversion twice can wash out or distort the image.

## Bloom is not indirect illumination

An emissive ring appears bright. Bloom spreads its contribution around the screen, suggesting glare. It does not automatically cast real light onto the floor or other objects. Add an appropriate light or a more complete illumination method if the ring should illuminate its surroundings. Similarly, ambient occlusion darkens contact-like regions but does not compute all indirect lighting.

The lab’s threshold, strength, and emission sliders have separate roles. Threshold decides what participates, emission changes source radiance, and strength scales the spread contribution. Raising strength to compensate for an incorrect color pipeline often makes the whole image hazy rather than fixing the cause.

## Screen-space data has limits

A depth-of-field effect uses depth to approximate defocus. Screen-space ambient occlusion estimates local occlusion from visible geometry. Screen-space reflections march through visible depth/color data. Information outside the frame or behind the nearest surfaces is absent, so these effects can fail near boundaries or reveal missing data. Temporal methods can reuse previous frames but must handle motion and disocclusion.

Motion blur needs a motion model, often velocity buffers or reconstruction from transforms. A simple accumulation trail is a stylistic persistence effect and should not be presented as a complete physically based shutter simulation. Name the approximation so you can reason about its artifacts.

## Resolution and memory

A full-resolution RGBA16F target needs roughly eight bytes per pixel before depth, multisampling, or extra attachments. At 1920 × 1080 that is about 15.82 MiB. Ping-pong targets, bloom pyramids, normals, velocities, and histories add more. DPR 2 quadruples pixel count compared with DPR 1 at the same CSS size.

Resize composer targets with the renderer’s actual intended dimensions and pixel-ratio policy. Avoid setting renderer size and composer size with inconsistent assumptions about CSS versus physical pixels. Our helper gives the composer CSS dimensions while its renderer pixel ratio participates through composer configuration. Test the actual output size after changes.

Many blur-like effects can run at lower resolution and be upsampled. Small UI text and diagrams should usually stay as HTML or vector overlays rather than going through bloom or blur. This keeps the course controls crisp and accessible.

## Ordering decisions

Color grading may belong before or after a tone mapping stage depending on how the grading transform was authored. FXAA commonly expects display-referred color, while other antialiasing methods work at different stages. An outline can use depth and normals from an earlier pass. A transparent overlay can be composed at the end. Read an effect’s required input convention rather than arranging passes only by how their names sound.

## The WebGPU renderer has a different stack

Three.js `WebGPURenderer` does not accept the traditional `EffectComposer` stack as a drop-in. Its node/TSL rendering pipeline describes effects differently. The TSL chapter gives the conceptual mapping and version-specific references. Keep the WebGL lab as a working implementation of the current composer path rather than trying to swap just the renderer constructor.

**Optional application:** add a grayscale pass that computes luminance from linear RGB, then decide whether its placement belongs before final output conversion. Compare that with applying a display-space desaturation and explain the visual difference from the data each operation receives.
