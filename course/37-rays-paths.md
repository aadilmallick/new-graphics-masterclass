# Rays, distance fields, and path tracing

Rasterization asks which triangles cover image samples. Ray-based rendering asks what a line from a sample encounters in the scene. These are different ways to solve visibility and shading, and they can be combined. This chapter derives analytic intersection, introduces distance-field marching, then builds the probability model behind path tracing.

**Experiments:** [A ray for every sample](#/lab/ray-tracing) and [distance-field sculpture](#/lab/ray-marching). **Reading bridge:** Eck §§8.1–8.2.

## A ray is a parametric line

Write $r(t)=o+td$, where `o` is origin, `d` direction, and `t > 0` moves forward. If `d` is normalized, `t` measures world distance. For a sphere centered at `c` with radius `R`, points on its surface satisfy $\|p-c\|^2=R^2$.

Substitute the ray and expand the dot product:

$$
(d\cdot d)t^2+2d\cdot(o-c)t+(o-c)\cdot(o-c)-R^2=0.
$$

This is a quadratic $at^2+2bt+c_0=0$. Its roots are $(-b\pm\sqrt{b^2-ac_0})/a$. A negative discriminant means no real intersection. Otherwise choose the smallest positive root above a small self-intersection threshold. If the origin is inside the sphere, the nearer root can be negative while the farther positive root is the visible exit.

Our tested `raySphere` helper follows this derivation without assuming a normalized direction. The CPU ray tracer generates one primary ray per sample, checks all three spheres, picks the nearest hit, calculates a normal, and sends a shadow ray toward a point light. The large ground sphere approximates a plane. This is a small analytic ray tracer, not a path tracer.

## Reflection and refraction

For a unit normal `n` and incoming direction `d`, the reflected direction is $d-2(d\cdot n)n$. A recursive ray tracer can trace that new direction from the hit. Offset the origin slightly to avoid immediately hitting the same surface because of rounding. The offset should scale sensibly with scene precision rather than using an arbitrary huge distance.

Refraction uses the ratio of indices of refraction and Snell’s law. It can have no transmitted real direction under total internal reflection, in which case reflection dominates. A complete glass model also handles Fresnel weighting, entering versus exiting a medium, absorption, and path termination. A transparent alpha blend is not a substitute for these mechanisms.

## Signed distance fields and sphere tracing

A signed distance function, SDF, gives distance to a surface, negative inside and positive outside under a common convention. A sphere uses `length(p-center)-radius`. A plane uses a signed dot distance. `min(a,b)` combines a union, `max(a,b)` an intersection, and `max(a,-b)` a difference for compatible field conventions.

Along a ray, evaluating a true distance bound tells how far you can safely advance without crossing a surface. Repeating until the distance is small is sphere tracing, often called ray marching in real-time examples. An arbitrary scalar field is not automatically a safe distance bound; nonuniform transforms, warps, and smooth combinations need care. Overestimating distance can skip thin surfaces. The lab uses a conservative step factor, a maximum distance, and a step budget.

Normals can be estimated from central differences of the distance field: compute variation along X, Y, and Z and normalize the resulting gradient. This connects the derivative chapter directly to procedural geometry. A smaller threshold can improve detail but increase iterations and precision sensitivity.

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

## Paths through light transport

A path tracer repeatedly intersects a ray, gathers emission or sampled direct light, samples a new scattering direction, and updates a throughput weight containing material, cosine, and sampling-density factors. It accumulates many randomized paths per image sample. Russian roulette can probabilistically terminate paths while preserving an unbiased expectation if surviving paths are reweighted appropriately. A hard bounce limit introduces a different truncation policy.

An acceleration structure such as a BVH groups geometry into bounds, avoiding a ray test against every triangle. Building, updating, and traversing that hierarchy is a substantial engineering topic. Denoising can reduce visible noise but may blur detail or introduce temporal artifacts. Real-time path tracing combines sampling, acceleration, temporal reuse, and reconstruction; it is not merely turning on recursion.

**Optional application:** add a mirror sphere to the CPU tracer with a small fixed recursion depth, then compare the result with the distance-field scene. For a further project, build a diffuse sphere path tracer with explicit PDFs and accumulation reset when the camera changes. Keep the reference ray-casting lab’s simpler claims distinct from that extension.
