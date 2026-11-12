# Rays, distance fields, and path tracing

Rasterization asks which triangles cover image samples. Ray-based rendering asks what a line from a sample encounters in the scene. These are different ways to solve visibility and shading, and they can be combined. This chapter derives analytic intersection, introduces distance-field marching, then builds the probability model behind path tracing.

**Experiments:** [A ray for every sample](#/lab/ray-tracing) and [distance-field sculpture](#/lab/ray-marching). **Reading bridge:** Eck §§8.1–8.2.

## Begin with visibility rather than realism

Place a camera in front of two spheres. For one image sample, we need to know which surface lies along its viewing direction first. Rasterization answers this by projecting triangles and comparing depth. A ray-based method starts with that sample's direction and asks the scene for the first intersection. Neither approach is automatically a complete lighting model.

This distinction is important because ray tracing is often used as a broad visual label. A program can cast primary rays and use very simple shading. It can add shadow rays without tracing indirect bounces. It can recursively trace perfect mirrors without performing Monte Carlo path tracing. Identify the actual rays and estimators before deciding what a renderer computes.

The supplied CPU lab deliberately uses analytic spheres so intersection can be derived without introducing triangle acceleration structures immediately. Its small image makes the per-sample loop readable. The goal is to trace the reasoning all the way from a camera sample to a final color, then understand which extensions make a more general renderer.

## A ray is a parametric line

Write $r(t)=o+td$, where `o` is origin, `d` direction, and `t > 0` moves forward. If `d` is normalized, `t` measures world distance. For a sphere centered at `c` with radius `R`, points on its surface satisfy $\|p-c\|^2=R^2$.

Substitute the ray and expand the dot product:

$$
(d\cdot d)t^2+2d\cdot(o-c)t+(o-c)\cdot(o-c)-R^2=0.
$$

This is a quadratic $at^2+2bt+c_0=0$. Its roots are $(-b\pm\sqrt{b^2-ac_0})/a$. A negative discriminant means no real intersection. Otherwise choose the smallest positive root above a small self-intersection threshold. If the origin is inside the sphere, the nearer root can be negative while the farther positive root is the visible exit.

Our tested `raySphere` helper follows this derivation without assuming a normalized direction. The CPU ray tracer generates one primary ray per sample, checks all three spheres, picks the nearest hit, calculates a normal, and sends a shadow ray toward a point light. The large ground sphere approximates a plane. This is a small analytic ray tracer, not a path tracer.

## Solve one intersection without skipping the arithmetic

Choose ray origin `(0,0,0)`, direction `(0,0,-1)`, sphere center `(0,0,-5)`, and radius one. The vector from the sphere center to the ray origin is `(0,0,5)`. Dotting direction with itself gives coefficient a = 1. Dotting direction with that offset gives the half-linear coefficient b = -5. The constant is 25 minus one, or 24.

The discriminant is b squared minus a times the constant: 25 minus 24 equals one. The roots are `(5-1)/1 = 4` and `(5+1)/1 = 6`. The ray enters the sphere four units forward and exits six units forward. The nearest positive root is therefore the visible hit. Substituting t = 4 into the ray gives point `(0,0,-4)`, exactly one unit in front of the center.

Now start the ray at the sphere center. The offset becomes zero, giving roots negative one and positive one for a unit direction. The negative root is behind the origin; the positive root is the exit. A function that always returns the smaller quadratic root would fail for this case. Our helper checks roots for a sufficiently positive value instead.

If the direction were `(0,0,-2)`, the same entry point would occur at parameter t = 2. The ray travels two world units for every parameter unit. This is why a general intersection routine includes `dot(direction,direction)` rather than assuming it is one. Normalize directions when convenient, but do not silently mix distance and parameter meanings.

## Trace a complete CPU sample

The CPU lab maps a sample center into a camera-like ray direction. It uses the image aspect ratio so the same angular scale applies horizontally and vertically, then normalizes the direction. For every sphere it asks the intersection helper for a positive hit parameter and retains the smallest one.

If no sphere is hit, the sample receives a background color. If a sphere is hit, the point is origin plus direction times the selected parameter. The outward normal is the normalized vector from sphere center to hit point. The material color and a simple diffuse factor determine the direct-light response.

The lab then casts a shadow ray from a slightly offset hit point toward the light. If another intersection occurs before the light's distance, the point is treated as blocked from that light. Comparing the intersection parameter to light distance is valid here because the shadow direction is normalized. A non-unit direction would require corresponding parameter conversion.

The origin offset reduces self-intersection from finite precision. Too little can produce acne-like artifacts; too much can make shadows detach or miss nearby thin geometry. The appropriate offset depends on numerical scale and the renderer's intersection strategy. A small educational constant is a visible simplification, not an argument that every scene should use the same value.

## Derive a reflected ray geometrically

Split an incoming direction into a component parallel to a unit normal and a component tangent to the surface. The normal component is `(d dot n) * n`. Reflection reverses that component while preserving the tangent component. Subtracting twice the original normal component therefore gives `d - 2*(d dot n)*n`.

For direction `(1,-1,0)` and upward normal `(0,1,0)`, the dot is negative one. Subtracting twice negative one times the normal adds `(0,2,0)`, producing `(1,1,0)`. The downward direction becomes upward with the same tangential X component. If you want a unit reflected direction, start with a unit incoming direction or normalize afterward as appropriate.

Tracing a mirror can now reuse the same nearest-hit function from a new origin and direction. Add a recursion depth limit to prevent endless work in mirror arrangements. The shading result combines reflected contribution according to the material model. A mirror term is not simply an extra unrelated color; it represents light arriving from the reflected direction.

## Reflection and refraction

For a unit normal `n` and incoming direction `d`, the reflected direction is $d-2(d\cdot n)n$. A recursive ray tracer can trace that new direction from the hit. Offset the origin slightly to avoid immediately hitting the same surface because of rounding. The offset should scale sensibly with scene precision rather than using an arbitrary huge distance.

Refraction uses the ratio of indices of refraction and Snell’s law. It can have no transmitted real direction under total internal reflection, in which case reflection dominates. A complete glass model also handles Fresnel weighting, entering versus exiting a medium, absorption, and path termination. A transparent alpha blend is not a substitute for these mechanisms.

## Understand a distance field as another intersection representation

A mesh stores a surface explicitly as primitives. A signed distance field stores a function whose zero set defines the surface. For a sphere, evaluating `length(p-center)-radius` tells whether a point is outside, on, or inside and how far it is from the surface in the ideal analytic case.

At a point three units from the center of a radius-one sphere, the field is two. A ray can advance by that distance without crossing this sphere because no surface lies closer than the known distance bound. Repeating the process approaches the surface efficiently in favorable cases. Near contact, the algorithm stops when the field is smaller than a chosen threshold.

The SDF lab combines a sphere, torus, and ground-like plane. A smooth minimum creates a blended shape between two fields. Such combinations and transformations must be checked for conservative distance behavior. Scaling coordinates nonuniformly and treating the result as an exact world-space distance can overstep surfaces. The lab's conservative step fraction helps, but no fixed fraction repairs every arbitrary invalid field.

Maximum steps and maximum travel distance are termination policies. A ray can miss geometry because its budget ends before convergence, even when the distance function is sensible. Increasing the budget improves some cases at additional fragment cost. Visualize step count as a color when diagnosing expensive regions or missing thin features.

## Signed distance fields and sphere tracing

A signed distance function, SDF, gives distance to a surface, negative inside and positive outside under a common convention. A sphere uses `length(p-center)-radius`. A plane uses a signed dot distance. `min(a,b)` combines a union, `max(a,b)` an intersection, and `max(a,-b)` a difference for compatible field conventions.

Along a ray, evaluating a true distance bound tells how far you can safely advance without crossing a surface. Repeating until the distance is small is sphere tracing, often called ray marching in real-time examples. An arbitrary scalar field is not automatically a safe distance bound; nonuniform transforms, warps, and smooth combinations need care. Overestimating distance can skip thin surfaces. The lab uses a conservative step factor, a maximum distance, and a step budget.

Normals can be estimated from central differences of the distance field: compute variation along X, Y, and Z and normalize the resulting gradient. This connects the derivative chapter directly to procedural geometry. A smaller threshold can improve detail but increase iterations and precision sensitivity.

## Build numerical integration from an ordinary average

The integral of a function over an interval represents accumulated contributions across that interval. Divide the interval zero to one into four equal pieces. Each has width 0.25. Sampling x squared at the midpoint of each piece gives values at 0.125, 0.375, 0.625, and 0.875. Multiply each squared value by 0.25 and add.

The squared values are approximately 0.015625, 0.140625, 0.390625, and 0.765625. Their sum is 1.3125, and multiplying by 0.25 gives 0.328125. The exact integral is one third, approximately 0.333333. The finite sum is already close, and increasing the number of midpoint samples improves this regular example.

Monte Carlo uses randomized samples instead of a fixed partition. For a uniform distribution over zero to one, the interval width and density are both particularly simple, so averaging sampled x squared estimates the same integral. On a different interval or under a different distribution, the weights must change. The estimator is a weighted calculation, not merely a ritual of adding random noise.

## Probability as weighted averaging

A random variable is a value selected according to a distribution. Its **expected value** is a probability-weighted average. Monte Carlo integration estimates a continuous sum by sampling. If `x` is drawn with probability density $p(x)>0$ wherever the integrand matters:

$$
\int f(x)\,dx\approx\frac1N\sum_{i=1}^{N}\frac{f(x_i)}{p(x_i)}.
$$

The density denominator compensates for sampling some regions more often. Sampling important regions more frequently can reduce noise, called importance sampling. Omitting the density factor biases the estimate unless the specific estimator already accounts for it.

For a simple complete console experiment, estimate the integral of $x^2$ from 0 to 1 with uniform samples:

```js
let sum = 0;
const samples = 100000;
for (let i = 0; i < samples; i++) {
  const x = Math.random();
  sum += x * x; // uniform density on [0,1] is 1
}
console.log(sum / samples); // approximately 1/3, varies per run
```

The estimate approaches the true integral statistically, not monotonically. Standard Monte Carlo noise commonly decreases proportional to $1/\sqrt N$ under its assumptions, so halving noise can require about four times as many independent samples.

## Why probability density appears in path throughput

Suppose one direction region is sampled twice as often as another. Without compensating weights, it contributes twice as often to the average even if its physical contribution should not be larger. Dividing by the sampling density corrects for how often that region was selected. Importance sampling deliberately chooses a nonuniform distribution that concentrates effort where contribution is likely, while retaining the correction needed for the intended integral.

For Lambertian reflection, the BRDF is diffuse reflectance divided by pi. The rendering equation also includes a cosine factor. If directions are sampled with a cosine-weighted hemisphere density, the cosine and pi terms cancel in the appropriate throughput ratio, leaving diffuse reflectance under the matching assumptions. This simplification is a consequence of choosing a compatible distribution, not permission to omit probability factors in general.

If sampling uniformly over the hemisphere instead, the density is constant over solid angle and the cosine remains in the weight. Both approaches can estimate the same integral but have different variance. A path tracer's noise and convergence depend strongly on such distribution choices, especially around small bright lights or sharp material lobes.

## Paths through light transport

A path tracer repeatedly intersects a ray, gathers emission or sampled direct light, samples a new scattering direction, and updates a throughput weight containing material, cosine, and sampling-density factors. It accumulates many randomized paths per image sample. Russian roulette can probabilistically terminate paths while preserving an unbiased expectation if surviving paths are reweighted appropriately. A hard bounce limit introduces a different truncation policy.

An acceleration structure such as a BVH groups geometry into bounds, avoiding a ray test against every triangle. Building, updating, and traversing that hierarchy is a substantial engineering topic. Denoising can reduce visible noise but may blur detail or introduce temporal artifacts. Real-time path tracing combines sampling, acceleration, temporal reuse, and reconstruction; it is not merely turning on recursion.

## Turn a ray tracer into a path tracer carefully

At each hit, keep a throughput weight representing how much the current path can contribute. Add emitted light under a consistent strategy, sample a scattering direction, multiply throughput by the material/cosine/density ratio, and continue from the new ray. Accumulate many independent or suitably controlled samples into the image.

When the camera or scene changes, previous samples generally no longer estimate the same image and accumulation must reset or use a more sophisticated reprojection policy. A simple running average that ignores a camera change creates ghosts because it mixes different target integrals. State changes and estimator state therefore belong in the renderer's lifecycle design.

Russian roulette uses a survival probability to stop some longer paths. Surviving paths are reweighted to preserve the expected contribution under the method's conditions. Terminating every path after a fixed small number of bounces is a different approximation that discards longer paths. Both can be useful engineering choices, but their statistical meanings should not be conflated.

## Keep scope and evidence clear

The included CPU renderer demonstrates analytic intersections, direct diffuse shading, and hard visibility shadows. The distance-field lab demonstrates shader-based sphere tracing of procedural fields. Neither is presented as a complete unbiased path tracer with a BVH, multiple-importance sampling, medium transport, and denoising.

These smaller systems are valuable precisely because their calculations are visible. Build the next mechanism only after you can follow one sample through the existing one. A convincing final image becomes much easier to debug when you know which visibility query, scattering rule, and sampling estimator produced each contribution.

**Optional application:** add a mirror sphere to the CPU tracer with a small fixed recursion depth, then compare the result with the distance-field scene. For a further project, build a diffuse sphere path tracer with explicit PDFs and accumulation reset when the camera changes. Keep the reference ray-casting lab’s simpler claims distinct from that extension.
