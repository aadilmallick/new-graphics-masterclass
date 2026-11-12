# Post-processing and color pipelines

Post-processing treats a rendered image as input to another rendering operation. It can add bloom, grade color, detect edges, simulate lens effects, or combine several views. It also adds textures, bandwidth, and ordering constraints. A clear pass graph is more useful than an unexplained chain of effects.

**Experiment:** [Light after the lens](#/lab/post-processing). **Reading bridge:** Eck §7.4 and the earlier framebuffer lesson; [Three.js post-processing](https://threejs.org/manual/en/post-processing.html).

## First understand what an image pass computes

Suppose the scene renderer has already produced a rectangular array of colors. At this stage we can temporarily forget about meshes, cameras, and lights. We have an input image and want a new image. A post-processing pass is a rule for computing every output sample from input data. Some rules need only the corresponding input sample; others need neighbors or additional buffers.

For example, a brightness adjustment can multiply each color by a scalar. A blur must inspect nearby colors. A depth-based effect needs a depth value associated with the image location. An outline might need both depth and surface orientation. These different data requirements explain why post-processing becomes a graph of resources rather than an arbitrary list of visual filters.

Begin with a tiny one-dimensional image represented by five brightness values: `[0,0,6,0,0]`. The central value is six times the reference brightness one. A three-sample average produces a broader feature: around the central region, neighboring outputs each receive part of that value. This is the beginning of a glow-like spread. The result has changed where brightness appears, not where geometry exists.

This complete console experiment uses edge clamping to make that operation explicit:

```js
const input = [0, 0, 6, 0, 0];
const sample = index => input[Math.max(0, Math.min(input.length - 1, index))];
const output = input.map((_, index) =>
  (sample(index - 1) + sample(index) + sample(index + 1)) / 3
);
console.log(output); // [0, 2, 2, 2, 0]
```

The output callback ignores the original value because it needs an index to inspect a neighborhood. Clamping prevents an out-of-range lookup at the first and last positions. A GPU blur performs the corresponding operation over a two-dimensional texture, with explicit filtering, coordinate conventions, and edge policy. The useful idea is already visible in five ordinary JavaScript numbers.

## From a color array to an image pipeline

If we change the input while calculating output from left to right, later outputs could read already modified values. That would turn the operation into a different, order-dependent filter. Keeping separate input and output arrays avoids the problem. GPU post-processing similarly needs well-defined resources for reading and writing. The framebuffer chapter's feedback-loop rule still applies.

Two reusable intermediate targets can alternate between passes: pass one reads A and writes B, pass two reads B and writes A. A composer manages much of that bookkeeping, but each effect still has a real input and output. An effect that needs the original scene as well as a blurred version must preserve both until the combination stage.

The term full-screen pass means a draw whose geometry covers the output region. The geometry is commonly a large triangle or a quad. Its job is only to invoke a fragment calculation for the image region; the visible content comes from sampled textures and shader arithmetic. Rendering another full scene hierarchy is unnecessary for a simple image adjustment.

## The pass graph

The lab uses the WebGL renderer and `EffectComposer`:

```js
composer.addPass(new RenderPass(scene, camera));
composer.addPass(bloom);
composer.addPass(new OutputPass());
```

The first pass renders scene radiance into a target. Bloom extracts sufficiently bright regions, blurs them at several scales, and adds a controlled contribution. `OutputPass` applies the final tone mapping and output color conversion. The complete source includes construction, resizing, rendering, and disposal of these resources.

Keep scene-referred lighting calculations in a suitable linear representation. Tone mapping compresses intensity for display, and output color conversion encodes that display result. Applying these before a bloom threshold changes the meaning of “bright.” Applying output conversion twice can wash out or distort the image.

## Work through a bloom calculation numerically

Consider three linear-light scene values: 0.2 for a dark floor, 0.8 for an ordinary surface, and 4.0 for a bright emissive source. A teaching bright-pass rule might subtract threshold one and clamp negative results to zero. It produces 0, 0, and 3.0. Real bloom implementations can use a smoother threshold and luminance weighting, but this simplified rule makes the decision clear.

Blur distributes the 3.0 contribution around the source. Suppose a particular neighboring pixel receives 0.25 after filtering, and bloom strength is 0.6. Its added contribution is `0.25 * 0.6 = 0.15`. If the original neighboring scene value was 0.2, the combined value becomes 0.35 before the final display transform. The original source remains part of the scene image; bloom is an additional spread contribution, not a replacement for the source.

Now suppose we first clipped every scene value to the display interval zero to one. The original value 4.0 would become 1.0. The threshold could no longer distinguish it from an ordinary white surface. This is why keeping HDR data until the appropriate final conversion is useful. The bright-pass needs information that early display compression can destroy.

There is a second ordering issue. An sRGB-encoded value is not proportional to light, so adding or averaging it as though it were linear produces a different result. This does not make every stylistic display-space effect invalid. It means the effect's intended domain must be known. A physical-like glare approximation and an artistic adjustment of already displayed pixels have different mathematical inputs.

## Bloom is not indirect illumination

An emissive ring appears bright. Bloom spreads its contribution around the screen, suggesting glare. It does not automatically cast real light onto the floor or other objects. Add an appropriate light or a more complete illumination method if the ring should illuminate its surroundings. Similarly, ambient occlusion darkens contact-like regions but does not compute all indirect lighting.

The lab’s threshold, strength, and emission sliders have separate roles. Threshold decides what participates, emission changes source radiance, and strength scales the spread contribution. Raising strength to compensate for an incorrect color pipeline often makes the whole image hazy rather than fixing the cause.

## Read the complete ring study one responsibility at a time

The lab creates three torus meshes sharing one geometry. Each has a material with an emissive color and intensity. Their rotations differ, producing a woven ring structure. Geometry sharing saves duplicate mesh data while allowing different material colors. The shared scene helper supplies camera, lights, floor, and the normal rendering lifecycle.

The lab then constructs a composer associated with that renderer. A scene pass references the scene and camera. A bloom pass receives an initial size, strength, radius, and threshold. An output pass ends the chain. The lab replaces the helper's normal render callback with `composer.render()`, ensuring the scene is rendered through this sequence rather than rendered once normally and again through effects accidentally.

When the host changes size, `app.onResize` updates the composer. On disposal, the bloom and output passes release their internal resources and the composer releases its targets. This is important because a pass can own several textures you did not create individually in the top-level scene code. Disposing mesh materials alone cannot release an effect's private targets.

The controls vary different levels of the model. Emission changes scene data. Threshold changes which image values contribute to the effect. Strength changes how much spread is added. Moving one control at a time gives a readable experiment. If changing all three together, a brighter image does not reveal which stage caused the difference.

## Derive a separable blur before optimizing it

A square kernel with width K samples K squared locations per output pixel in the straightforward form. With K = 9, that is 81 samples. Some kernels can be factored into a horizontal set of weights multiplied by a vertical set. A two-pass implementation then uses nine horizontal samples and nine vertical samples, 18 total, plus the cost of an intermediate write and later read.

This is called separability. It follows from the kernel's mathematical structure, not from a compiler promise that every blur automatically becomes cheap. A box filter and common Gaussian-like constructions can be separable. An arbitrary hand-painted two-dimensional kernel may not be. Always include the intermediate target and bandwidth cost when comparing the implementations.

For a larger apparent glow, using lower-resolution images can also help. Halving width and height leaves one quarter as many pixels. A blur of several low-resolution pixels corresponds to a wider region when upsampled. Bloom pyramids combine scales so the spread has both local and broad structure. The visual result and data cost follow from those scale choices.

## Resolution and memory

A full-resolution RGBA16F target needs roughly eight bytes per pixel before depth, multisampling, or extra attachments. At 1920 × 1080 that is about 15.82 MiB. Ping-pong targets, bloom pyramids, normals, velocities, and histories add more. DPR 2 quadruples pixel count compared with DPR 1 at the same CSS size.

Resize composer targets with the renderer’s actual intended dimensions and pixel-ratio policy. Avoid setting renderer size and composer size with inconsistent assumptions about CSS versus physical pixels. Our helper gives the composer CSS dimensions while its renderer pixel ratio participates through composer configuration. Test the actual output size after changes.

Many blur-like effects can run at lower resolution and be upsampled. Small UI text and diagrams should usually stay as HTML or vector overlays rather than going through bloom or blur. This keeps the course controls crisp and accessible.

## Calculate the real cost of a screen-sized operation

At a CSS size of 960 by 540 and DPR one, the drawing buffer has 518,400 pixels. At DPR two, it has 1,920 by 1,080, or 2,073,600 pixels. One eight-byte color target therefore changes from roughly 3.96 MiB to 15.82 MiB. Two ping-pong targets double that cost before depth or additional passes.

The same fourfold pixel increase applies to a full-screen shader's invocation coverage. A scene that was comfortable at a small preview can become expensive when displayed full-screen on a high-density monitor. This is why a quality control should often include resolution policy rather than only geometry subdivisions.

Avoid allocating every target at the maximum size an application has ever encountered unless that reuse policy is intentional. A resizable editor may move from a full-screen scene into a small panel. Keeping unnecessarily large targets can waste memory even if they are no longer filled. Conversely, reallocating continuously during every one-pixel resize can cause churn. A production application can choose throttling or a stable allocation policy based on its interaction needs.

## Ordering decisions

Color grading may belong before or after a tone mapping stage depending on how the grading transform was authored. FXAA commonly expects display-referred color, while other antialiasing methods work at different stages. An outline can use depth and normals from an earlier pass. A transparent overlay can be composed at the end. Read an effect’s required input convention rather than arranging passes only by how their names sound.

## Screen-space data has limits

A depth-of-field effect uses depth to approximate defocus. Screen-space ambient occlusion estimates local occlusion from visible geometry. Screen-space reflections march through visible depth/color data. Information outside the frame or behind the nearest surfaces is absent, so these effects can fail near boundaries or reveal missing data. Temporal methods can reuse previous frames but must handle motion and disocclusion.

Motion blur needs a motion model, often velocity buffers or reconstruction from transforms. A simple accumulation trail is a stylistic persistence effect and should not be presented as a complete physically based shutter simulation. Name the approximation so you can reason about its artifacts.

## Diagnose common pass-order failures

A completely black effect often indicates that its expected input texture is not the one being supplied, or that a target was not rendered before being sampled. A result drawn only in one corner suggests viewport or target-size disagreement. A washed-out image suggests color conversion or tone mapping may have been applied twice. A missing overlay may simply have been rendered before a later full-screen pass painted over it.

Begin diagnosis with a pass that copies its input unchanged. If that does not match the original scene, do not add bloom or color grading yet. Once copying works, display the bright-pass extraction alone. Then display one blur level. Finally composite. Each intermediate image answers a smaller question than the final effect chain.

For effects requiring depth, make sure the sampled depth belongs to the same camera, frame, dimensions, and projection convention as the color image. If reconstructing view positions, use the correct inverse projection and depth mapping. Raw depth values are not linear distance and must not be treated as meters merely because their numerical range is zero to one.

## The WebGPU renderer has a different stack

Three.js `WebGPURenderer` does not accept the traditional `EffectComposer` stack as a drop-in. Its node/TSL rendering pipeline describes effects differently. The TSL chapter gives the conceptual mapping and version-specific references. Keep the WebGL lab as a working implementation of the current composer path rather than trying to swap just the renderer constructor.

## A deliberately small extension

Keep an untouched scene-color reference available during experimentation. If a new effect appears to improve contrast, compare it with that reference at the same exposure and camera position. Otherwise a simultaneous camera or lighting change can be mistaken for an effect improvement.

For a grayscale experiment, first choose whether the effect should remove color before display mapping or operate on the displayed image as a stylistic filter. In a linear-light experiment, form a weighted sum of RGB using coefficients appropriate to the working primaries, then replicate that scalar into three channels. Keep alpha policy separate from luminance.

Display the grayscale result without bloom first, then reintroduce the existing chain. This makes it possible to explain why a colored emissive object can produce a differently weighted brightness than an equal numeric triplet in another color. The aim is not merely an attractive switch but a pipeline whose data meaning remains clear at every stage.

**Optional application:** add a grayscale pass that computes luminance from linear RGB, then decide whether its placement belongs before final output conversion. Compare that with applying a display-space desaturation and explain the visual difference from the data each operation receives.
