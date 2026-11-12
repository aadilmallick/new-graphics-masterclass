# Thinking in GLSL

GLSL is the OpenGL Shading Language. A shader looks familiar to a JavaScript programmer, but it has explicit types, vector arithmetic, stage-specific inputs, and a different execution model. A good shader is a short explanation of what each invocation computes.

**Experiments:** [GPU triangle](#/lab/webgl-triangle), then [shader ocean](#/lab/ocean). **Reading bridge:** Eck §6.3; [shaders and GLSL](https://webglfundamentals.org/webgl/lessons/webgl-shaders-and-glsl.html).

## A shader is a second program, not a callback into JavaScript

It is useful to pause over a boundary that the first triangle example can make look deceptively simple. JavaScript executes one program, while the GPU executes another. A shader string is data to JavaScript. The browser takes those characters and asks a different compiler to interpret them as GLSL. A value declared outside the string is therefore not automatically available inside it. If JavaScript defines `const brightness = 0.7`, the GLSL compiler knows nothing about that binding.

A uniform is one explicit route across this boundary. The shader declares a name and type, the host obtains a location from the linked program, and the host uploads a compatible value while that program is active. This is why the triangle source has separate steps for declaring `angle`, obtaining its location, and calling `uniform1f`. Each step has a different responsibility. A missing declaration is a language problem; an incorrect location or active program is a host-state problem; a wrong angle unit is a mathematical problem.

This separation also explains two kinds of errors. A malformed JavaScript template string prevents the application from running at all. A syntactically valid string containing malformed GLSL lets JavaScript run, but shader compilation fails. If you see a blank canvas, first determine which compiler reported the error. Reading a GLSL line number as though it were a line in the surrounding JavaScript file can send you to the wrong place, especially when strings contain introductory comments or generated source.

The `program` helper in this project does not remove that boundary. It creates shader objects, supplies their source, compiles them, checks status, attaches them to a program, and links. After linking, the program has the executable relationship between vertex and fragment stages. The helper then deletes intermediate shader objects, while keeping the linked program until the lab is disposed. You can inspect these operations in `labs/webgl.js` rather than treating compilation as invisible infrastructure.

## Types and constructors

Use `float`, `int`, `uint`, and `bool` for scalar values. `vec2`, `vec3`, and `vec4` are floating-point vectors. `ivec3` is a three-component integer vector. `mat3` and `mat4` are matrices. A constructor such as `vec3(0.5)` fills all components with 0.5; `vec4(position, 1.0)` appends W to a three-component position.

Explicit floating-point literals such as `1.0` make intended types clear. Modern GLSL has conversion rules, but relying on accidental implicit conversions makes examples harder to reason about. A sampler is not an ordinary image object; it refers to a texture binding unit selected by a uniform.

## Component operations and swizzles

`a * b` for two vectors multiplies components, while `dot(a,b)` adds component products into one scalar. Matrix-vector multiplication uses the geometric operation derived earlier. `normalize`, `length`, and `cross` have their mathematical meanings.

Swizzling selects or rearranges components. `color.rgb` is equivalent to `color.xyz`; `uv.yx` swaps components; `vec3(value).xxx` repeats a value. Use readable swizzles rather than clever ones. GLSL arrays have declared types and lengths; they are not dynamic JavaScript arrays.

This fragment is a complete fragment shader for a UV gradient when paired with a vertex stage that outputs `uv`:

```glsl
#version 300 es
precision highp float;
in vec2 uv;
out vec4 outColor;
void main() {
  vec3 gradient = vec3(uv.x, uv.y, 0.5);
  outColor = vec4(gradient, 1.0);
}
```

If UVs range from 0 to 1, the red channel grows horizontally and green vertically. Visualizing an intermediate vector as color is one of the most useful shader debugging tools. For signed normals, map from `[-1,1]` to `[0,1]` with `normal * 0.5 + 0.5`.

## Read arithmetic by reading the types

Consider two JavaScript arrays, `base = [0.2, 0.5, 0.8]` and `light = [1, 0.6, 0.25]`. Component multiplication produces `[0.2, 0.3, 0.2]`. Red is `0.2 * 1`, green is `0.5 * 0.6`, and blue is `0.8 * 0.25`. GLSL writes that operation as `base * light` when both variables are vectors. Their dot product is a different result: `0.2 + 0.3 + 0.2 = 0.7`, one scalar rather than three channels.

Matrix multiplication is a third meaning of the multiplication symbol. A matrix times a vector mixes components according to its coefficients, rather than independently multiplying matching components. When reading GLSL, establish the operand types before interpreting the operator. This habit prevents a surprising number of lighting and transform mistakes. The compiler resolves the operation from types, so your explanation should do the same.

A constructor can also express several different operations. `vec3(0.5)` repeats a scalar three times. `vec3(uv, 0.5)` combines two UV components with one additional component. `vec4(position, 1.0)` turns a three-component position into a homogeneous point. These are not arbitrary convenience shortcuts; each tells the compiler exactly how many components the result contains. If you accidentally select `uv.x` instead of `uv`, you have changed both the meaning and the number of supplied components.

Swizzles rearrange existing numbers; they do not perform a geometric transform. `normal.zyx` exchanges components, while `normalMatrix * normal` expresses a transformation between frames. Swapping channels until the image appears plausible can conceal a coordinate error. Use swizzles for clear selection or a purposeful visualization, and use derived transformations when changing coordinate spaces.

## Useful scalar functions

`clamp(x, a, b)` limits a value; `mix(a, b, t)` interpolates; `step(edge, x)` returns a threshold; `smoothstep(low, high, x)` normalizes and smooths a transition when `low < high`. `fract(x)` returns the fractional part and makes patterns repeat. `sin` and `cos` generate oscillation. `pow` raises a value to a power, but negative bases with non-integer exponents are problematic. Avoid dividing by zero or normalizing a zero vector.

For a circular mask around UV center 0.5, `length(uv - 0.5)` computes distance. Comparing it to a radius creates an edge. A fixed-width `smoothstep` softens the edge, but its width changes in pixel terms as you zoom. Fragment derivatives such as `fwidth` estimate local screen variation and can choose an approximately one-pixel transition; we use them in procedural rendering.

## Build a scalar signal before building a material

A productive learning method is to compute one number that varies over the image. Such a number is a signal. You can later use it as brightness, opacity, a blending weight, a height, or an input to another function. Beginning with the signal avoids trying to debug geometry, lighting, texture loading, and color conversion simultaneously.

Suppose a vertex stage provides UV coordinates from zero to one across a rectangle. Displaying `vec3(uv.x)` gives a horizontal grayscale ramp. At the left, `uv.x` is zero, so all channels are zero. At the middle, each channel is 0.5. At the right, each is one. This example is about a simple numerical output convention; a physically based renderer additionally interprets the color space and output conversion.

Now multiply the coordinate by four. The expression `uv.x * 4.0` ranges from zero to four. The function `fract` keeps only the fractional part: `fract(0.2)` is 0.2, `fract(1.2)` is 0.2, and `fract(3.8)` is 0.8. The result is four repeating ramps. Applying `step(0.5, repeatedRamp)` changes each ramp into a binary band. Values below 0.5 become zero; values at or above it become one. A repeating stripe pattern has emerged from three understandable operations.

The following is a complete replacement fragment shader for a raw WebGL 2 vertex stage that outputs `uv`. The texture lab already supplies such a stage; replace only its fragment source when trying this variation.

```glsl
#version 300 es
precision highp float;
in vec2 uv;
out vec4 outColor;
void main() {
  float repeatedRamp = fract(uv.x * 4.0);
  float stripe = step(0.5, repeatedRamp);
  vec3 dark = vec3(0.04, 0.10, 0.16);
  vec3 light = vec3(0.50, 0.92, 0.80);
  vec3 surfaceColor = mix(dark, light, stripe);
  outColor = vec4(surfaceColor, 1.0);
}
```

The two named colors are local vectors. `mix` uses the interpolation equation from the math chapters. Because `stripe` is either zero or one, it selects an endpoint. Replacing the threshold with a smooth transition allows intermediate weights. The named intermediate values are deliberate: if the final result is wrong, display `repeatedRamp` first, then `stripe`, then the mixed color. This is the shader equivalent of logging intermediate JavaScript values, except the output is an image.

The pattern's units deserve attention. Four repetitions mean four repetitions over the UV interval, not four repetitions per meter. If a mesh stretches across ten world units but its UVs still cover zero to one, each stripe cycle covers 2.5 world units along that direction. Another mesh with the same UVs but half the world width displays the pattern at half the physical scale. Coordinate choice is therefore part of the effect specification, not incidental syntax.

## Derive a circular mask one operation at a time

Let `offset = uv - vec2(0.5)`. At image center the offset is `(0,0)`. At UV `(0.8,0.9)`, the offset is `(0.3,0.4)`. Pythagoras gives distance `sqrt(0.09 + 0.16) = 0.5`. Thus `length(offset)` is a distance from the center, measured in UV units. A radius of 0.25 describes the circle where that distance equals 0.25.

A hard inside mask is `1.0 - step(0.25, distance)`. The subtraction reverses the threshold: distances below the radius produce one, and distances beyond it produce zero. A soft mask can use `1.0 - smoothstep(0.24, 0.26, distance)`. There is now an interior region, an exterior region, and a transition band of width 0.02. Each component has a clear interpretation, so changing the radius should not unexpectedly change the intended softness policy.

A fixed UV softness changes appearance with resolution. On a thousand-pixel-wide square, 0.02 of its width is about twenty pixels; on a hundred-pixel-wide square, it is about two. This motivates screen derivatives. `fwidth(distance)` estimates how much the distance varies across a pixel-sized neighborhood. A transition width based on that estimate approximately follows projected size. The shader is using information about local variation rather than assuming a fixed relationship between a UV unit and a pixel.

Derivative-aware smoothing has limits. Fragment derivatives rely on neighboring fragment evaluations and valid control flow. They are not available as the same operation in a vertex shader. Nor does smoothing one procedural boundary solve texture aliasing, geometry coverage, or temporal flicker everywhere else. Choose the method for the signal being sampled. The important conceptual step is recognizing whether your width is specified in texture coordinates, world distance, or screen pixels.

## Local work and control flow

Variables declared inside `main` belong to that invocation. You cannot increment a local counter and expect the next fragment to see it. Uniforms are read-only shader inputs set by the CPU. Vertex outputs are interpolated, not written directly into a shared JavaScript array.

Loops and conditionals are allowed, but neighboring invocations often execute together. Divergent branches can cause extra work. Optimize based on measurement and clarity, not a blanket rule that every `if` is forbidden. Derivative-dependent operations need appropriate uniform control flow; a branch that excludes neighboring fragments can make derivative assumptions invalid.

## Trace one fragment without inventing a global order

Imagine a triangle whose vertex colors are red, green, and blue. At an interior sample with equal clip W and barycentric weights `(0.2,0.3,0.5)`, the fragment receives color `(0.2,0.3,0.5)`. Its `main` can halve that vector, reorder its components, or combine it with another input. It does not change the original vertices, and it does not prepare a local variable for the fragment next to it.

A loop inside `main` is ordinary repeated work within one invocation. In the image filter lab, one fragment runs a nine-sample loop, while many fragments independently run their own loops for other image locations. Distinguish these two kinds of repetition. The GPU's parallel execution does not make a dependent sequence inside one invocation disappear, and a local loop counter does not become shared between fragments.

A branch is likewise a decision about an invocation's computation. Neighboring invocations may take different paths, which can affect efficiency. That is a reason to profile a costly divergent shader, not a reason to eliminate all readable conditionals. Some mathematical expressions also have restricted domains: a compact branchless expression that divides by zero or takes a non-real power is worse than a clear guarded computation. Correctness comes before algebraic cleverness.

## Stage boundaries and interpolation

A vertex shader cannot know the eventual color of every pixel it influences. It can provide data from which the fragment stage computes a color. For example, pass a world position and normal, interpolate them, normalize the normal in the fragment shader, then evaluate lighting. Interpolating already-lit vertex colors is cheaper but can miss small highlights; this is the distinction between per-vertex and per-fragment shading.

Integer or discrete values generally need `flat` interpolation. A material ID of 2.4 between integer IDs is not useful. Conversely, using `flat` for a smooth normal makes each triangle use one value, producing a faceted appearance.

## Diagnose a shader through progressively stronger evidence

If compilation fails, inspect the reported stage and nearby source. A missing semicolon often causes the next declaration to be blamed. An unknown name can mean a spelling error or a JavaScript-only variable used without an input declaration. A type error can mean a scalar/vector mismatch, a wrong constructor component count, or an interface that differs between stages.

If compilation succeeds but linking fails, compare the two stage interfaces. If linking succeeds but the image is wrong, output a constant fragment color. A visible constant triangle establishes a working position and drawing path. Next visualize each input directly. Only restore the full calculation after its pieces behave as expected. This makes debugging an ordered investigation rather than a sequence of unconnected edits.

The ocean lab later uses Three.js's default `ShaderMaterial` convention, including `varying`, `gl_FragColor`, and supplied matrix declarations. The raw labs use explicitly declared GLSL ES 3.00 interfaces. Both can be valid within their own surrounding systems. Transferring a snippet requires understanding which declarations and transformations the library supplies; matching the visual goal alone does not establish matching shader contracts.

**Optional application:** replace the triangle fragment output with `vec4(vColor.bgr, 1.0)` and observe a channel swap. Then inspect how the ocean shader constructs height and normal separately. Preserve a known-good shader while experimenting so compile errors remain easy to isolate.
