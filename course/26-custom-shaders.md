# Custom shaders and procedural surfaces

A procedural material computes appearance from a rule rather than only reading a stored image. A vertex shader can also deform geometry. This is where the earlier math becomes a design tool: waves, stripes, contours, animated surfaces, and distance fields are functions evaluated many times in parallel.

**Experiments:** [An ocean of equations](#/lab/ocean) and [distance-field sculpture](#/lab/ray-marching). **Reading bridge:** Eck §7.3.3–7.3.4; [Shadertoy patterns in WebGL](https://webglfundamentals.org/webgl/lessons/webgl-shadertoy.html).

## Build a surface function before writing a material

Let us slow down and construct the ocean as a sequence of increasingly useful programs. Imagine a square tabletop. We know where every original point lies because the tabletop is a plane. We want to lift each point by an amount that depends on its position. The problem is not yet lighting, water, or even animation. It is simply finding a rule that maps an old position to a new position.

Start in JavaScript, where the rule is easy to inspect. The following complete console experiment samples one row of a wave:

```js
function heightAt(x, amplitude, frequency) {
  return amplitude * Math.sin(frequency * x);
}
for (const x of [0, Math.PI / 4, Math.PI / 2, Math.PI]) {
  console.log(x.toFixed(3), heightAt(x, 0.5, 1).toFixed(3));
}
```

The outputs are approximately 0, 0.354, 0.5, and 0. The `frequency` argument is angular spatial frequency: it controls how quickly phase changes as X changes. Calling it frequency without stating its units can be misleading. Here X is a world-like local length and `frequency * x` is an angle in radians. A wavelength is the distance required for that angle to increase by a full turn. Consequently wavelength equals two pi divided by this frequency.

At frequency 1, a complete cycle occupies about 6.283 units. At frequency 2, it occupies about 3.142 units. Amplitude changes height without changing those horizontal distances. This distinction matters when designing controls: a slider named wave size is ambiguous because it could mean height, wavelength, or both. The ocean lab uses two explicit parameters rather than hiding them inside one vague setting.

Now add time: `amplitude * Math.sin(frequency * x + time)`. At a fixed X, phase advances as time increases, so height changes. At a fixed phase, X must decrease as time increases, so this particular sign makes the wave travel toward negative X. Changing the sign before time reverses travel. A shader's apparent motion is a consequence of the equation, not of vertices remembering their previous positions.

This also explains why we compute displaced height from the original position every frame. If we repeatedly added a sine value to an already displaced vertex, we would accumulate changes and eventually produce a different, unstable surface. The lab begins with `vec3 p = position`, so every invocation starts from the geometry's original local coordinates, assigns a new Z, and then projects the result.

## ShaderMaterial in the WebGL renderer

Three.js `ShaderMaterial` lets you supply GLSL vertex and fragment source while the library manages geometry and common uniforms. For this renderer, built-ins such as `position`, `normalMatrix`, `modelViewMatrix`, and `projectionMatrix` are supplied through its shader system. `RawShaderMaterial` expects more explicit declarations. Native GLSL ES 3.00 examples require the appropriate Three.js GLSL version setting and interface syntax; do not mix them blindly with the default ShaderMaterial convention.

The ocean uses the default ShaderMaterial conventions intentionally. Its vertex shader receives a densely subdivided local XY plane. It computes

$$
h(x,y,t)=A\left[\sin(kx+t)+\tfrac12\cos(0.8ky-0.7t)\right].
$$

Amplitude `A` controls height; spatial frequency `k` controls repetitions. Updating `uTime.value` changes a uniform, not the geometry buffer. The GPU computes displaced positions afresh for every draw.

## Trace one vertex through the actual wave equation

Take a local vertex at X = 0, Y = 0, with time zero, amplitude 0.35 and frequency 2.2. The first phase is zero, so its sine is zero. The second phase is also zero, so its cosine is one. The weighted sum is therefore zero plus one half, and height is 0.175. The new local position becomes `(0, 0, 0.175)`.

At the same vertex after a small time interval, both phases change, but at different rates and signs. The surface is the sum of two traveling contributions. Summing waves gives a richer appearance because their peaks and troughs sometimes reinforce and sometimes cancel. It does not require a special GPU feature; the fragment and vertex processors are evaluating ordinary arithmetic functions many times.

The shader computes two temporary phase values named `a` and `b`. Temporary names make the repeated formulas shorter, but they should not obscure meaning. A teaching version might name them `xPhase` and `yPhase`. Both are scalars. The resulting position `p` is a vector. The matrix expression at the end converts that vector through the model-view and projection transforms you have already studied. Geometry deformation and camera projection remain separate operations.

The mesh then rotates around X by negative pi over two. Before that object transform, the plane's height direction is local Z. After it, that direction points along world Y. This is why copying the formula onto a geometry already authored in XZ can give a confusing result: the formula's parameter plane is different. Either change the function's coordinate interpretation or change the object transform, but do not mix the two fixes accidentally.

## Derive the normal from the same function

From the derivatives chapter:

$$
h_x=Ak\cos(kx+t),\qquad h_y=-0.4Ak\sin(0.8ky-0.7t).
$$

The local tangents are `(1,0,hx)` and `(0,1,hy)`. Their cross product gives the surface normal. The shader then applies `normalMatrix` to put it into view space and normalizes again in the fragment stage. Without this update, the geometry moves but the lighting still describes a flat plane.

The material’s simple lighting is illustrative. It does not automatically inherit all `MeshStandardMaterial` features or receive the standard light/shadow system just because the scene contains lights. A custom shader owns the shading features it implements.

## Work through a normal numerically

At X = 0, Y = 0, time zero, the X derivative is amplitude times frequency times cosine zero: `0.35 * 2.2 * 1 = 0.77`. The Y derivative is zero because sine zero is zero. The two tangents are therefore `(1,0,0.77)` and `(0,1,0)`. Their cross product is `(-0.77,0,1)`.

Notice the sign: a surface rising toward positive X has a normal leaning toward negative X. This makes geometric sense if you imagine standing a perpendicular stick on an uphill ramp. Its length is the square root of `0.77² + 1`, approximately 1.262. Dividing gives a unit normal near `(-0.610,0,0.792)`. That is the direction the lighting calculation needs before the appropriate frame transform.

You can reproduce the calculation with the earlier math module:

```js
import { cross, normalize } from './labs/math.js';
const tangentX = [1, 0, 0.77];
const tangentY = [0, 1, 0];
console.log(cross(tangentX, tangentY));
console.log(normalize(cross(tangentX, tangentY)));
```

This is a complete served-module experiment within the project. The first output is the unnormalized perpendicular; the second has length one. Computing this once in JavaScript illustrates the math, while the shader computes the corresponding direction independently for every vertex. The fragment shader normalizes again because interpolating several unit normals does not generally produce another unit normal.

Why use analytic derivatives when numerical differences are easier to remember? An analytic expression can avoid several extra height evaluations and gives a stable exact derivative of the chosen mathematical rule, within floating-point error. Numerical differences are useful when a complicated function is easier to evaluate than differentiate. They need an appropriate step size and more evaluations. Both approaches must describe the same surface function as the displacement.

## Geometry sampling and pixel sampling are separate limits

The lab's plane has 180 segments in each direction. That creates 181 vertices per row and 181 rows, or 32,761 vertex positions before accounting for attribute storage. It creates 180 times 180 grid cells, each represented by two triangles, for 64,800 triangles. These numbers explain why a simple-looking ocean can still have substantial vertex work.

A vertex shader only moves existing vertices. Between them, the surface remains a triangle mesh. If wavelength becomes comparable to the spacing between vertices, the mesh cannot describe the intended oscillation faithfully. Increasing fragment detail does not add missing geometric samples. Conversely, an extremely dense mesh may represent the shape well but still show jagged screen edges or shimmer because the final pixel sampling is insufficient.

There is no universal rule that more subdivisions always improves a scene. A distant ocean region may occupy few pixels and need fewer triangles. Adaptive grids, level of detail, or screen-oriented meshes can allocate samples more effectively. Those are worthwhile extensions after the basic wave's math and representation are clear. Begin by deciding which visible error you are trying to reduce.

## Coordinate choice is an artistic decision

Object-space stripes move with an object. World-space stripes stay aligned across different objects and can appear to slide across moving geometry. UV-space patterns follow an unwrap and may have seams. Screen-space patterns stay aligned with the image. Choose the space before writing the function, then make the transform into that space explicit.

Periodic functions such as `fract(uv * repeats)` make tiles. Combining distances with smooth thresholds makes circles or contours. A deterministic hash can produce repeatable variation; a hash is not the same as coherent noise. Value noise interpolates random values over a lattice, gradient noise interpolates directional contributions, and fractal sums combine frequencies. More octaves add detail and cost, and can alias when the highest frequency exceeds pixel resolution.

## Inspect the fragment shader as a sequence of signals

The ocean fragment shader first normalizes its interpolated view-space normal. It compares it with a fixed direction in that same view frame. This direction is an illustrative light expression embedded in the shader; it is not automatically the scene's directional light object. The constant 0.2 supplies a base brightness, while the remaining 0.8 scales the positive directional contribution.

Next, height becomes a color-mixing factor through `smoothstep(-0.5, 0.5, vHeight)`. A height below the lower endpoint selects the darker color, a height above the upper endpoint selects the lighter color, and intermediate heights blend smoothly. The result is multiplied by the lighting factor. Finally the output chunks apply the renderer's intended display transformation.

This gives you three independent debugging images. Display height alone as a grayscale remapping to inspect deformation data. Display normal as RGB to inspect orientation. Display the lighting factor alone to inspect direction and frame consistency. Combine them only after each signal behaves sensibly. A complex final color can conceal which earlier quantity is wrong.

The shader uses `DoubleSide` so the educational plane remains visible from either side. The explicit custom shading expression does not automatically implement a physically complete underside model. A production thin sheet may need a deliberate face-aware normal policy; an opaque ocean normally has a preferred visible surface. A convenience visibility choice and a physically meaningful material model are different decisions.

## Screen derivatives and antialiasing

In a fragment shader, `dFdx` and `dFdy` estimate variation across neighboring fragments. `fwidth(x)` approximates `abs(dFdx(x)) + abs(dFdy(x))`. For a distance `d` from a pattern boundary, a transition width based on `fwidth(d)` keeps the edge roughly pixel-sized as the camera moves. This is analytic antialiasing of a procedural edge, not a replacement for every form of scene antialiasing.

Avoid derivative-dependent sampling in divergent flow where neighboring execution is not guaranteed appropriately. Ordinary texture sampling also uses derivatives to choose mip levels. In compute shaders, choose explicit levels or other sampling methods appropriate to the stage rather than assuming fragment derivatives exist.

## Displacement affects more than the image

CPU bounding volumes and CPU raycasts do not automatically know a shader moved vertices. Expand bounds conservatively or maintain them from the deformation rule. If the material casts shadows, a matching deformation must be used by the shadow rendering path; otherwise a waving object casts a static silhouette. Large vertex displacement also requires enough geometry samples to represent the shape.

The ocean disables a complex shadow setup for clarity. A production ocean additionally considers reflections, refraction, Fresnel, depth-dependent color, foam, and horizon behavior. Add those as separate tested layers rather than pasting one enormous opaque shader.

## From a controlled example to a convincing effect

There is one more useful boundary between geometry and material: changing a fragment color cannot move a silhouette. A dark circular mask drawn on a flat plane may suggest a hole from one viewpoint, but an oblique view still reveals the plane's outline. Vertex displacement changes sampled geometry and can affect silhouette; a distance-field renderer finds a different implicit surface altogether. Choose the representation from the visual requirement before choosing an attractive color formula. This prevents spending hours refining a fragment shader for an effect that fundamentally needs geometry or a different visibility method. It also keeps the cost discussion honest: more elaborate shading and more detailed shape solve different classes of error, even when their screenshots look similar from a carefully chosen angle.

To add foam, first choose a quantity that correlates with foam in your artistic model. Height alone makes the highest parts white, while slope selects steep regions. A combination can look more plausible. Describe the mask's range and threshold before mixing colors. An animated noise modulation can break uniform bands, but noise should enrich a coherent rule rather than conceal an unexplained one.

To add reflections, derive a reflected view direction in a named frame and sample an environment representation appropriate to roughness. To add shallow-water color, obtain a meaningful depth difference rather than using raw nonlinear depth as if it were meters. Each improvement introduces a data dependency, not merely another attractive term in the final expression.

## Output and renderer compatibility

The ocean fragment shader includes Three.js tone-mapping and color-space chunks at the end. Forgetting these can make a custom surface disagree with surrounding built-in materials. Applying them twice can also be wrong. These GLSL chunks and `ShaderMaterial` belong to the WebGL renderer path. `WebGPURenderer` custom materials use TSL/node materials instead; its chapter shows the transition.

**Optional application:** add a height-based foam mask using `smoothstep` and a derivative-aware threshold. Begin by displaying the mask alone, then blend it into the established color signal. Keep the normal derived from geometry, and distinguish a white surface color mask from actual foam geometry or physical light scattering.
