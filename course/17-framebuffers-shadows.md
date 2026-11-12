# Framebuffers, filters, and shadows

The screen is only one possible rendering destination. If we render into a texture, later passes can read the image. This one idea supports image processing, reflections, shadows, picking buffers, deferred shading, and many simulations.

**Experiment:** [Two-pass image lab](#/lab/framebuffers). **Reading bridge:** Eck §7.4; [render to texture](https://webglfundamentals.org/webgl/lessons/webgl-render-to-texture.html), [image processing](https://webglfundamentals.org/webgl/lessons/webgl-image-processing.html), and [shadows](https://webglfundamentals.org/webgl/lessons/webgl-shadows.html).

## A framebuffer is an attachment configuration

A framebuffer object, FBO, names where outputs go. Attach a texture for color and optionally a depth texture or renderbuffer. A texture can later be sampled; a renderbuffer is optimized for render attachment usage and is not directly sampled as an ordinary texture. The framebuffer itself does not allocate all these images for you.

After creating attachments, check `gl.checkFramebufferStatus(gl.FRAMEBUFFER)`. It must be `FRAMEBUFFER_COMPLETE` before drawing. On a target change, set the matching viewport; a 512 × 512 target should not inherit a 1600 × 900 screen viewport. On resize, recreate or resize attachments consistently, including depth.

## Two explicit passes

The lab first renders procedural rings into an RGBA8 texture. The second pass draws a full-screen triangle and samples that texture. Its fragment shader uses `texel = (1/width, 1/height)` to step by one source texel. A 3 × 3 box blur adds nine neighboring samples and divides by nine:

$$
C'(x,y)=\frac19\sum_{i=-1}^{1}\sum_{j=-1}^{1}C(x+i,y+j).
$$

A **convolution kernel** is a set of weights for such neighboring samples. A normalized blur kernel preserves constant colors. An edge kernel subtracts a local average from a center-related value; the lab uses the magnitude of an eight-neighbor difference. For physically meaningful color filtering, perform the operation in linear light when the source represents light. The lab’s generated display pattern focuses on spatial filtering.

Avoid sampling an image that is simultaneously being written through the current framebuffer. This **feedback loop** is invalid for the ordinary pattern shown here. Use separate input and output textures, then swap roles between passes. For repeated simulation, this is called ping-ponging.

## A shadow map is a visibility measurement

A light can illuminate a point only if no nearer surface blocks the path. Shadow mapping asks the same visibility question from the light’s viewpoint:

1. Render the scene from the light camera, storing depth in a shadow texture.
2. Render from the viewer camera.
3. Transform each world point into the light’s projected coordinates.
4. Sample stored light depth at that projected XY.
5. Compare the point’s light depth to the stored nearest depth.

If the point is farther than the stored surface, it is in shadow. All depths must use matching projection and mapping conventions. A depth value is not automatically a linear world distance. A point outside the light’s frustum needs an explicit policy rather than accidentally sampling repeated border data.

## Bias and filtering

Finite precision can make a surface shadow itself, producing **shadow acne**. A small depth or normal bias reduces it. Excessive bias detaches shadows from contact points, called peter-panning. Better light frustum bounds and sufficient resolution can reduce the amount of bias needed. Bias is a controlled approximation, not a universal magic constant.

Percentage-closer filtering, PCF, averages several **comparison results** around the projected location. It does not simply blur raw depth and compare once; those operations are not equivalent. Shadow softness depends on the technique and sampling. A point light needs multiple directional views, commonly six cube faces, and can be much more expensive than one directional shadow.

## Additional render-to-texture uses

An ID buffer writes a unique object color for selection, then reads a selected pixel. An environment map renders or loads six directions around a location. A planar reflection uses a reflected camera and clipping. Deferred rendering writes several material/geometry outputs to multiple render targets and computes lighting afterward. These are variations of data flow through attachments, with different accuracy and bandwidth costs.

`readPixels` can stall if the CPU needs unfinished GPU data. For occasional picking it may be acceptable; for continuous analysis consider asynchronous patterns and whether the result can stay on the GPU. Browser capture also has timing and color-space concerns; capture after rendering, and do not enable `preserveDrawingBuffer` by default just to make a screenshot convenient.

**Optional application:** extend the lab with a separable blur: one horizontal pass followed by one vertical pass. A large 2D box kernel can be implemented more cheaply as two 1D kernels when its weights are separable. Keep three resources clearly named: source, temporary, and final target.
