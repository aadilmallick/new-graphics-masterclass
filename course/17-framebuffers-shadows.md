# Framebuffers, filters, and shadows

The screen is only one possible rendering destination. If we render into a texture, later passes can read the image. This one idea supports image processing, reflections, shadows, picking buffers, deferred shading, and many simulations.

**Experiment:** [Two-pass image lab](#/lab/framebuffers). **Reading bridge:** Eck §7.4; [render to texture](https://webglfundamentals.org/webgl/lessons/webgl-render-to-texture.html), [image processing](https://webglfundamentals.org/webgl/lessons/webgl-image-processing.html), and [shadows](https://webglfundamentals.org/webgl/lessons/webgl-shadows.html).

## Start by changing only the destination

You already know how to draw a triangle into the canvas. Imagine performing exactly the same geometry and fragment calculations, but storing the result in an image that another shader can read. The first conceptual change is the destination, not the shape or the lighting. This is why render-to-texture becomes such a powerful organizing idea: a rendered image can become data for another rendering step.

The default framebuffer is the browser-managed destination associated with the canvas. Binding your own framebuffer selects a different attachment configuration. The fragment shader still produces outputs; the attachment says where those outputs are stored. When you later bind `null`, you return to the default destination. That return does not automatically restore viewport, clear values, depth state, or program. Those remain separate responsibilities.

A color texture stores pixel-like records. A framebuffer refers to that texture as an attachment. Confusing these roles can lead to allocating a framebuffer handle and assuming it contains an image already. It does not. You must allocate the texture's storage and attach an appropriate image level. If the pass needs depth, allocate and attach a compatible depth resource as well.

## A framebuffer is an attachment configuration

A framebuffer object, FBO, names where outputs go. Attach a texture for color and optionally a depth texture or renderbuffer. A texture can later be sampled; a renderbuffer is optimized for render attachment usage and is not directly sampled as an ordinary texture. The framebuffer itself does not allocate all these images for you.

After creating attachments, check `gl.checkFramebufferStatus(gl.FRAMEBUFFER)`. It must be `FRAMEBUFFER_COMPLETE` before drawing. On a target change, set the matching viewport; a 512 × 512 target should not inherit a 1600 × 900 screen viewport. On resize, recreate or resize attachments consistently, including depth.

## Allocate a small target you can reason about

Suppose the offscreen target is 256 by 256 with one RGBA8 color texture. There are 65,536 texels, four bytes each, so base color storage is 262,144 bytes, or 256 KiB. A depth attachment adds its own storage. Rendering this target at the canvas's much larger viewport would not make it higher resolution; it would create an inappropriate mapping/clipping relationship. Set the viewport to the attachment size.

The following is an integration fragment for an already initialized WebGL 2 context. It creates a color-only target suitable for a fullscreen image pass. It is not a complete application; the framebuffer lab provides the surrounding shader and frame lifecycle.

```js
const width = 256;
const height = 256;
const image = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, image);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8,
  width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
const target = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, target);
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
  gl.TEXTURE_2D, image, 0);
if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
  throw new Error('Offscreen target is incomplete');
}
gl.viewport(0, 0, width, height);
```

The `null` upload allocates storage without supplying an initial image. The filtering parameters choose non-mipmapped sampling, so a single level is sufficient for the later lookup. Clamp-to-edge prevents a neighbor sample near one edge from wrapping to the opposite edge. `COLOR_ATTACHMENT0` selects the first color output destination, while the final zero selects mip level zero.

An FBO can be incomplete because an attachment is missing, dimensions or sample relationships are incompatible, or a chosen format/combination is unsupported. Check immediately after setup and after significant reconfiguration. A clear error at allocation time is easier to diagnose than a later blank post-process pass.

## Follow a frame as a data-flow diagram

In the included lab, pass one evaluates a ring pattern at each sample and stores RGBA into the offscreen texture. Pass two evaluates a filter, reading the ring texture and writing to the canvas. The dependency is one-directional within the frame: ring calculation, stored image, filter calculation, displayed image. The filter cannot read an image that has not been produced yet.

The code explicitly unbinds the source texture from ordinary sampling before the first draw, then binds it as a sampler after switching the destination back to the canvas. This avoids the ordinary feedback situation in which a shader reads the same image currently attached for writing. A shader's apparent per-pixel simplicity does not make simultaneous read/write to that image well-defined. The implementation is free to process regions in an order you should not assume.

For an iterative effect, use two textures. Frame or iteration zero reads A and writes B. The next reads B and writes A. This ping-pong arrangement makes old and new state distinct. A blur repeated three times can use the same pattern. A simulation can encode position or velocity into texture channels, but then its formats, filtering, and numerical precision should follow the meaning of that state rather than a display-image convention.

## Two explicit passes

The lab first renders procedural rings into an RGBA8 texture. The second pass draws a full-screen triangle and samples that texture. Its fragment shader uses `texel = (1/width, 1/height)` to step by one source texel. A 3 × 3 box blur adds nine neighboring samples and divides by nine:

$$
C'(x,y)=\frac19\sum_{i=-1}^{1}\sum_{j=-1}^{1}C(x+i,y+j).
$$

A **convolution kernel** is a set of weights for such neighboring samples. A normalized blur kernel preserves constant colors. An edge kernel subtracts a local average from a center-related value; the lab uses the magnitude of an eight-neighbor difference. For physically meaningful color filtering, perform the operation in linear light when the source represents light. The lab’s generated display pattern focuses on spatial filtering.

Avoid sampling an image that is simultaneously being written through the current framebuffer. This **feedback loop** is invalid for the ordinary pattern shown here. Use separate input and output textures, then swap roles between passes. For repeated simulation, this is called ping-ponging.

## Calculate one filtered sample by hand

Consider a scalar 3 by 3 neighborhood with rows `0,0,0`, `0,1,0`, and `0,0,0`. The sum is one, so a box blur outputs one ninth at the center. At a neighborhood where every sample is 0.6, the sum is 5.4 and dividing by nine returns 0.6. The filter preserves a constant field because its nine weights sum to one. It spreads a sharp isolated signal because neighboring outputs also include the center sample in their own neighborhoods.

A simple edge response compares the center to nearby values. The lab computes `abs(original * 9 - sum)`. Because `sum` includes the center, this is equivalent to the magnitude of eight times the center minus the eight neighbors. On a constant field it is zero: nine copies of the same value minus their sum cancel. Near a discontinuity it becomes nonzero. The absolute value displays either sign as positive magnitude, which is useful for a visible edge study but discards directional sign information.

The shader samples neighbors using offsets of `(1/width,1/height)` in UV coordinates. For width 256, one horizontal texel step is 0.00390625. An offset of one whole UV unit would jump an entire image width, not one texel. If the input target is half the canvas size, derive texel steps from the input image, not the output canvas. Source and destination resolution need not match.

## A separable blur explains an important optimization

A square box blur can be written as a horizontal average followed by a vertical average. For a 9 by 9 kernel, a direct evaluation needs 81 source samples per output. Two one-dimensional passes need nine horizontal samples and nine vertical samples, eighteen total, plus the cost of writing and reading the intermediate image. That can be a substantial saving, although actual performance depends on bandwidth, cache behavior, and implementation.

The mathematical reason is that the two-dimensional weights factor into a horizontal weight times a vertical weight. Not every filter is separable. Replacing an arbitrary 2D kernel with two 1D filters changes the operator unless that factorization is valid or you intentionally accept an approximation. Learn the structure before applying the optimization as a universal recipe.

Intermediate precision also matters. Writing every pass into RGBA8 rounds and clamps values to its representable range. That can be appropriate for a display pattern but unsuitable for HDR lighting or numerical simulation. A floating-point target may preserve the required range, subject to the intended format's renderability and filtering support. A resource being creatable does not establish that every desired operation is supported on it.

## Derive the shadow comparison from two viewpoints

Imagine a light at one end of a hallway. Along one light-view ray, a box is encountered before the floor behind it. The shadow map stores the nearest depth along that ray, which belongs to the box. When the viewer later shades the floor point, transforming it through the light camera identifies the same shadow-map location. Its depth is farther than the stored depth, so the box blocks the light.

The viewer camera decides which floor sample is visible to the viewer. The light camera decides whether illumination reaches that sample. These are two separate visibility questions. This is why rendering a depth buffer only from the viewer does not by itself solve shadows from a differently positioned light. The needed occluder can be outside the viewer's image but inside the light's view.

For an OpenGL-style light projection, divide clip XYZ by W, then remap divided XY from minus-one-to-one into zero-to-one texture coordinates. Depth must use a matching remapping to compare with the shadow texture's stored convention. A point outside the valid projection must receive an explicit decision. Otherwise clamp or repeat addressing can accidentally reuse an unrelated edge value and create a false shadow.

Suppose a stored depth is 0.42 and the current point's matching light depth is 0.60. The point is behind an occluder. If its depth is 0.40, it lies in front of that stored surface. When both represent the same surface, rounding and different rasterization paths can give 0.42001 versus 0.42. A small bias addresses that numerical disagreement. A huge bias could turn a genuinely occluded 0.43 point into an apparent lit point, detaching contact shadows.

## A shadow map is a visibility measurement

A light can illuminate a point only if no nearer surface blocks the path. Shadow mapping asks the same visibility question from the light’s viewpoint:

1. Render the scene from the light camera, storing depth in a shadow texture.
2. Render from the viewer camera.
3. Transform each world point into the light’s projected coordinates.
4. Sample stored light depth at that projected XY.
5. Compare the point’s light depth to the stored nearest depth.

If the point is farther than the stored surface, it is in shadow. All depths must use matching projection and mapping conventions. A depth value is not automatically a linear world distance. A point outside the light’s frustum needs an explicit policy rather than accidentally sampling repeated border data.

## Relate shadow quality to world coverage

A directional shadow map with width 1024 covering a twenty-unit light-space width has roughly 51.2 texels per world unit in that direction. Covering two hundred units with the same texture reduces that to 5.12 texels per unit. Increasing the texture size helps, but tightening the useful light frustum can improve effective resolution without increasing storage.

Percentage-closer filtering asks several nearby visibility questions and averages the answers. Four comparisons such as lit, lit, shadowed, shadowed yield an average of 0.5. Blurring depths first would create an invented intermediate surface depth, which can answer a different visibility question. Understand the distinction before implementing a filter over a shadow resource.

The two-pass lab demonstrates image filtering, not a complete shadow implementation. The Three.js studio supplies a working shadow-enabled scene through the engine. A raw shadow pass is an optional extension using the exact camera, framebuffer, and comparison ideas developed here. Keeping those scopes clear lets you transfer the mechanism without mistaking one visual effect for another.

## Bias and filtering

Finite precision can make a surface shadow itself, producing **shadow acne**. A small depth or normal bias reduces it. Excessive bias detaches shadows from contact points, called peter-panning. Better light frustum bounds and sufficient resolution can reduce the amount of bias needed. Bias is a controlled approximation, not a universal magic constant.

Percentage-closer filtering, PCF, averages several **comparison results** around the projected location. It does not simply blur raw depth and compare once; those operations are not equivalent. Shadow softness depends on the technique and sampling. A point light needs multiple directional views, commonly six cube faces, and can be much more expensive than one directional shadow.

## Additional render-to-texture uses

An ID buffer writes a unique object color for selection, then reads a selected pixel. An environment map renders or loads six directions around a location. A planar reflection uses a reflected camera and clipping. Deferred rendering writes several material/geometry outputs to multiple render targets and computes lighting afterward. These are variations of data flow through attachments, with different accuracy and bandwidth costs.

`readPixels` can stall if the CPU needs unfinished GPU data. For occasional picking it may be acceptable; for continuous analysis consider asynchronous patterns and whether the result can stay on the GPU. Browser capture also has timing and color-space concerns; capture after rendering, and do not enable `preserveDrawingBuffer` by default just to make a screenshot convenient.

An offscreen image also has a temporal lifetime. If a pass fully overwrites every texel, it may not need an additional clear for color correctness. If it draws only part of the target, uncleared regions retain earlier contents according to the rendering operation's actual storage lifetime. That can be a purposeful history effect or an accidental ghost image. Resizing reallocates storage and invalidates any assumption that old history survives meaningfully. For an accumulation effect, define initialization, reset conditions, and which previous frame is sampled. Camera movement, changed scene parameters, or altered dimensions can require clearing an accumulated estimate. These rules are part of the algorithm rather than an unexplained call to clear somewhere in the loop.

**Optional application:** extend the lab with a separable blur: one horizontal pass followed by one vertical pass. A large 2D box kernel can be implemented more cheaply as two 1D kernels when its weights are separable. Keep three resources clearly named: source, temporary, and final target.
