# Geometry, curves, and surface derivatives

Built-in shapes are convenient, but fluency means being able to generate a shape from a rule. This chapter introduces parametric geometry and the small amount of calculus needed to understand tangents and normals. A derivative is a local rate of change; we derive it from a finite difference you can compute in JavaScript.

**Experiment:** [Shader ocean](#/lab/ocean). **Reading bridge:** Eck §§5.2.1–5.2.2; [custom buffer geometry](https://threejs.org/manual/en/custom-buffergeometry.html).

## BufferGeometry

Three.js `BufferGeometry` stores typed attributes and optional indices. A position attribute has three components per vertex. UVs have two. Normals have three. An index selects complete attribute records. A change to an attribute array requires `attribute.needsUpdate = true` to request upload. If changed positions affect culling or raycasting, recompute bounding volumes.

This fragment defines one triangle after a Three.js import:

```js
const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.BufferAttribute(
  new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]), 3
));
geometry.computeVertexNormals();
geometry.computeBoundingSphere();
```

The `3` is item size, not vertex count. Three vertices require nine floats. On an indexed geometry, normal computation averages contributions among shared records; intentional creases require splitting records. UV seams can also require duplicates. A normal map cannot fix a silhouette with too few polygons.

## A curve as a function of a parameter

A parametric curve $p(t)$ returns a position for each `t`. A circle is `(r*cos(t), r*sin(t), 0)`. A helix adds a height proportional to `t`. A cubic Bézier curve uses four controls:

$$
B(t)=(1-t)^3P_0+3(1-t)^2tP_1+3(1-t)t^2P_2+t^3P_3,\quad0\le t\le1.
$$

The coefficients add to one, so the result is a weighted combination of the controls. At `t=0` it reaches `P0`; at `t=1`, `P3`. The inner controls influence the tangent but are generally not on the curve. The formula can also be built entirely from repeated lerps, called de Casteljau’s construction.

Equal steps in `t` do not generally produce equal travel distances. For constant-speed movement, sample an approximate arc-length table, accumulate segment lengths, then find the parameter corresponding to a desired distance. Three.js curve methods such as `getPointAt` use an arc-length mapping; the approximation resolution still matters.

## Derivatives from differences

For a scalar function `f`, `(f(x+h)-f(x))/h` is its average rate of change over a short interval. As `h` approaches zero, that approaches the derivative $f'(x)$ when it exists. A central difference `(f(x+h)-f(x-h))/(2*h)` is often a better numerical estimate. Too-large `h` misses local detail; too-small `h` amplifies floating-point cancellation.

For a curve, $p'(t)$ is a tangent vector. It gives both direction and speed with respect to the parameter. Normalize it when only direction matters. For `sin(x)`, the derivative is `cos(x)`; for `cos(x)`, it is `-sin(x)`. The chain rule accounts for an inner scale: the derivative of `sin(k*x)` is `k*cos(k*x)`.

## Surface parameters and normals

A surface $p(u,v)$ takes two parameters. Its partial derivatives $p_u$ and $p_v$ are tangents in the two parameter directions. The cross product gives a perpendicular direction:

$$
n=\operatorname{normalize}(p_u\times p_v).
$$

For a height surface $p(x,y)=(x,y,h(x,y))$, the tangents are `(1,0,hx)` and `(0,1,hy)`. The ocean shader uses exactly this construction for a sum of waves. It changes vertex height and derives a normal from the same function, keeping geometry and lighting consistent.

The ocean’s local plane uses X and Y with displacement in Z, then the mesh rotates into a horizontal world plane. Its derivative names refer to local coordinates. This is an example of why frame labels matter even inside artistic code.

## Generating useful meshes

A lathe rotates a profile around an axis. An extrusion sweeps a 2D shape through depth or along a path. A tube sweeps a cross-section along a curve and needs a stable moving frame; blindly crossing a fixed up vector with a tangent fails when they become parallel. Adaptive subdivision adds samples where curvature is large. Start with a uniform grid, then optimize if its errors are visible or measured.

**Optional application:** generate a UV sphere from longitude and latitude, keeping duplicate vertices at the UV seam. Compare face normals to radial smooth normals. At the poles, parameter tangents can become degenerate, so choose a stable normal from the known sphere geometry rather than normalizing a zero cross product.
