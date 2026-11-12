# Thinking in GLSL

GLSL is the OpenGL Shading Language. A shader looks familiar to a JavaScript programmer, but it has explicit types, vector arithmetic, stage-specific inputs, and a different execution model. A good shader is a short explanation of what each invocation computes.

**Experiments:** [GPU triangle](#/lab/webgl-triangle), then [shader ocean](#/lab/ocean). **Reading bridge:** Eck §6.3; [shaders and GLSL](https://webglfundamentals.org/webgl/lessons/webgl-shaders-and-glsl.html).

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

## Useful scalar functions

`clamp(x, a, b)` limits a value; `mix(a, b, t)` interpolates; `step(edge, x)` returns a threshold; `smoothstep(low, high, x)` normalizes and smooths a transition when `low < high`. `fract(x)` returns the fractional part and makes patterns repeat. `sin` and `cos` generate oscillation. `pow` raises a value to a power, but negative bases with non-integer exponents are problematic. Avoid dividing by zero or normalizing a zero vector.

For a circular mask around UV center 0.5, `length(uv - 0.5)` computes distance. Comparing it to a radius creates an edge. A fixed-width `smoothstep` softens the edge, but its width changes in pixel terms as you zoom. Fragment derivatives such as `fwidth` estimate local screen variation and can choose an approximately one-pixel transition; we use them in procedural rendering.

## Local work and control flow

Variables declared inside `main` belong to that invocation. You cannot increment a local counter and expect the next fragment to see it. Uniforms are read-only shader inputs set by the CPU. Vertex outputs are interpolated, not written directly into a shared JavaScript array.

Loops and conditionals are allowed, but neighboring invocations often execute together. Divergent branches can cause extra work. Optimize based on measurement and clarity, not a blanket rule that every `if` is forbidden. Derivative-dependent operations need appropriate uniform control flow; a branch that excludes neighboring fragments can make derivative assumptions invalid.

## Stage boundaries and interpolation

A vertex shader cannot know the eventual color of every pixel it influences. It can provide data from which the fragment stage computes a color. For example, pass a world position and normal, interpolate them, normalize the normal in the fragment shader, then evaluate lighting. Interpolating already-lit vertex colors is cheaper but can miss small highlights; this is the distinction between per-vertex and per-fragment shading.

Integer or discrete values generally need `flat` interpolation. A material ID of 2.4 between integer IDs is not useful. Conversely, using `flat` for a smooth normal makes each triangle use one value, producing a faceted appearance.

**Optional application:** replace the triangle fragment output with `vec4(vColor.bgr, 1.0)` and observe a channel swap. Then inspect how the ocean shader constructs height and normal separately. Preserve a known-good shader while experimenting so compile errors remain easy to isolate.
