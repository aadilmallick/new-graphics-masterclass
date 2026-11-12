# Custom shaders and procedural surfaces

A procedural material computes appearance from a rule rather than only reading a stored image. A vertex shader can also deform geometry. This is where the earlier math becomes a design tool: waves, stripes, contours, animated surfaces, and distance fields are functions evaluated many times in parallel.

**Experiments:** [An ocean of equations](#/lab/ocean) and [distance-field sculpture](#/lab/ray-marching). **Reading bridge:** Eck §7.3.3–7.3.4; [Shadertoy patterns in WebGL](https://webglfundamentals.org/webgl/lessons/webgl-shadertoy.html).

## ShaderMaterial in the WebGL renderer

Three.js `ShaderMaterial` lets you supply GLSL vertex and fragment source while the library manages geometry and common uniforms. For this renderer, built-ins such as `position`, `normalMatrix`, `modelViewMatrix`, and `projectionMatrix` are supplied through its shader system. `RawShaderMaterial` expects more explicit declarations. Native GLSL ES 3.00 examples require the appropriate Three.js GLSL version setting and interface syntax; do not mix them blindly with the default ShaderMaterial convention.

The ocean uses the default ShaderMaterial conventions intentionally. Its vertex shader receives a densely subdivided local XY plane. It computes

$$
h(x,y,t)=A\left[\sin(kx+t)+\tfrac12\cos(0.8ky-0.7t)\right].
$$

Amplitude `A` controls height; spatial frequency `k` controls repetitions. Updating `uTime.value` changes a uniform, not the geometry buffer. The GPU computes displaced positions afresh for every draw.

## Derive the normal from the same function

From the derivatives chapter:

$$
h_x=Ak\cos(kx+t),\qquad h_y=-0.4Ak\sin(0.8ky-0.7t).
$$

The local tangents are `(1,0,hx)` and `(0,1,hy)`. Their cross product gives the surface normal. The shader then applies `normalMatrix` to put it into view space and normalizes again in the fragment stage. Without this update, the geometry moves but the lighting still describes a flat plane.

The material’s simple lighting is illustrative. It does not automatically inherit all `MeshStandardMaterial` features or receive the standard light/shadow system just because the scene contains lights. A custom shader owns the shading features it implements.

## Coordinate choice is an artistic decision

Object-space stripes move with an object. World-space stripes stay aligned across different objects and can appear to slide across moving geometry. UV-space patterns follow an unwrap and may have seams. Screen-space patterns stay aligned with the image. Choose the space before writing the function, then make the transform into that space explicit.

Periodic functions such as `fract(uv * repeats)` make tiles. Combining distances with smooth thresholds makes circles or contours. A deterministic hash can produce repeatable variation; a hash is not the same as coherent noise. Value noise interpolates random values over a lattice, gradient noise interpolates directional contributions, and fractal sums combine frequencies. More octaves add detail and cost, and can alias when the highest frequency exceeds pixel resolution.

## Screen derivatives and antialiasing

In a fragment shader, `dFdx` and `dFdy` estimate variation across neighboring fragments. `fwidth(x)` approximates `abs(dFdx(x)) + abs(dFdy(x))`. For a distance `d` from a pattern boundary, a transition width based on `fwidth(d)` keeps the edge roughly pixel-sized as the camera moves. This is analytic antialiasing of a procedural edge, not a replacement for every form of scene antialiasing.

Avoid derivative-dependent sampling in divergent flow where neighboring execution is not guaranteed appropriately. Ordinary texture sampling also uses derivatives to choose mip levels. In compute shaders, choose explicit levels or other sampling methods appropriate to the stage rather than assuming fragment derivatives exist.

## Displacement affects more than the image

CPU bounding volumes and CPU raycasts do not automatically know a shader moved vertices. Expand bounds conservatively or maintain them from the deformation rule. If the material casts shadows, a matching deformation must be used by the shadow rendering path; otherwise a waving object casts a static silhouette. Large vertex displacement also requires enough geometry samples to represent the shape.

The ocean disables a complex shadow setup for clarity. A production ocean additionally considers reflections, refraction, Fresnel, depth-dependent color, foam, and horizon behavior. Add those as separate tested layers rather than pasting one enormous opaque shader.

## Output and renderer compatibility

The ocean fragment shader includes Three.js tone-mapping and color-space chunks at the end. Forgetting these can make a custom surface disagree with surrounding built-in materials. Applying them twice can also be wrong. These GLSL chunks and `ShaderMaterial` belong to the WebGL renderer path. `WebGPURenderer` custom materials use TSL/node materials instead; its chapter shows the transition.

**Optional application:** add a height-based foam mask using `smoothstep` and a derivative-aware threshold. Keep the normal derived from geometry, and distinguish a white surface color mask from actual foam geometry or physical light scattering.
