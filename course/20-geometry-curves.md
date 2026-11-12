# Geometry, curves, and surface derivatives

Built-in shapes are convenient, but fluency means being able to generate a shape from a rule. This chapter introduces parametric geometry and the small amount of calculus needed to understand tangents and normals. A derivative is a local rate of change; we derive it from a finite difference you can compute in JavaScript.

**Experiment:** [Shader ocean](#/lab/ocean). **Reading bridge:** Eck §§5.2.1–5.2.2; [custom buffer geometry](https://threejs.org/manual/en/custom-buffergeometry.html).

## Begin with a rectangle assembled from two triangles

Procedural geometry is a program that produces vertex records. Start with a flat rectangular patch so the shape is already familiar. Choose four positions: A `(-1,0,-1)`, B `(1,0,-1)`, C `(1,0,1)`, and D `(-1,0,1)`. The order of the indices determines orientation. Under a Y-up world, the triangle `(A,C,B)` has an upward normal; verify this with the cross product rather than guessing from the drawing.

For that triangle, C minus A is `(2,0,2)` and B minus A is `(2,0,0)`. Their cross is `(0,4,0)`, pointing upward. The second triangle can be `(A,D,C)`, whose cross also points upward. The six indices therefore are `0,2,1,0,3,2` if the four records are stored A through D. A different ordering can cover the same spatial rectangle while reversing its front face.

This integration fragment creates that complete geometry after importing Three.js. Add it to a mesh and initialized scene as in the previous chapter:

```js
const patch = new THREE.BufferGeometry();
patch.setAttribute('position', new THREE.Float32BufferAttribute([
  -1, 0, -1,
   1, 0, -1,
   1, 0,  1,
  -1, 0,  1
], 3));
patch.setAttribute('uv', new THREE.Float32BufferAttribute([
  0, 0, 1, 0, 1, 1, 0, 1
], 2));
patch.setIndex([0, 2, 1, 0, 3, 2]);
patch.computeVertexNormals();
patch.computeBoundingSphere();
```

The attribute names are part of the material/shader contract. Position item size is three because each record contains XYZ. UV item size is two because each record contains UV. The index list reuses complete records. `computeVertexNormals()` infers normals from triangles and shared records; it does not know your intended smooth-versus-hard artistic boundaries beyond the topology you supply.

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

## Turn the rectangle into a sampled surface

A larger plane can be generated as a grid. With `columns` horizontal segments and `rows` vertical segments, there are `(columns+1)*(rows+1)` vertices because both endpoints of each segment sequence must exist. Each cell produces two triangles, so there are `2*columns*rows` triangles and six times that cell count indices.

For ten by ten segments, the grid has 121 vertices and 200 triangles. For one hundred by one hundred, it has 10,201 vertices and 20,000 triangles. Multiplying segment counts by ten increases triangle count by one hundred. This arithmetic explains why increasing a pair of subdivision sliders can become expensive much faster than expected.

Generate a vertex from normalized parameters `u = column/columns` and `v = row/rows`. Map them into spatial coordinates, for example `x = (u-0.5)*width` and `z = (v-0.5)*depth`. Then assign height from a function `y = height(x,z)`. The grid topology stays regular while the function changes the surface. UVs can remain `(u,v)`, but that mapping may stretch over steep regions because projected parameter distance and actual surface distance differ.

A finer grid captures higher-frequency shape variation. It does not automatically remove pixel aliasing, and no number of smooth normals can create a silhouette detail that the vertices do not contain. Decide whether a desired detail should affect geometry, shading normals, color, or all three. This decision controls both visual behavior and resource cost.

## Read a Bézier curve as repeated interpolation

You already understand lerp between two points. A cubic Bézier curve can be constructed entirely from that operation. With controls P0, P1, P2, P3, first interpolate adjacent pairs to make A, B, and C. Interpolate A/B and B/C to make D and E. Finally interpolate D/E to obtain the curve point. Each stage uses the same parameter t.

At t equal to one half, each stage is an average. Take two-dimensional controls `(0,0)`, `(0,2)`, `(2,2)`, and `(2,0)`. The first averages are `(0,1)`, `(1,2)`, `(2,1)`. The next are `(0.5,1.5)` and `(1.5,1.5)`. Their final average is `(1,1.5)`. The curve passes through that point, while the inner control points influence the path without generally lying on it.

Expanding those nested lerps yields the cubic formula in the following section. The coefficients add to one, which helps keep the point within the controls' convex hull for t in the ordinary zero-to-one interval. This construction is also numerically and geometrically meaningful: it shows a curve as a smooth evolution of weighted combinations, rather than an arbitrary polynomial to memorize.

At the start, the tangent direction follows P1 minus P0; at the end, it follows P3 minus P2. Joining two cubic segments smoothly therefore requires attention to their endpoint tangent relationship, not merely matching endpoint position. Two curves can meet without a gap while still showing a sharp corner in direction.

## A curve as a function of a parameter

A parametric curve $p(t)$ returns a position for each `t`. A circle is `(r*cos(t), r*sin(t), 0)`. A helix adds a height proportional to `t`. A cubic Bézier curve uses four controls:

$$
B(t)=(1-t)^3P_0+3(1-t)^2tP_1+3(1-t)t^2P_2+t^3P_3,\quad0\le t\le1.
$$

The coefficients add to one, so the result is a weighted combination of the controls. At `t=0` it reaches `P0`; at `t=1`, `P3`. The inner controls influence the tangent but are generally not on the curve. The formula can also be built entirely from repeated lerps, called de Casteljau’s construction.

Equal steps in `t` do not generally produce equal travel distances. For constant-speed movement, sample an approximate arc-length table, accumulate segment lengths, then find the parameter corresponding to a desired distance. Three.js curve methods such as `getPointAt` use an arc-length mapping; the approximation resolution still matters.

## Separate parameter speed from world speed

Imagine controls clustered tightly at one end of a curve and spread out at the other. Equal steps in t can travel short distances in one region and longer distances elsewhere. A camera animated with `t += dt/duration` follows the curve's parameter uniformly, not necessarily its world distance uniformly.

A practical arc-length approximation samples the curve at many t values, measures distances between successive positions, and accumulates them. Suppose cumulative distances at t values 0, 0.25, 0.5, 0.75, and 1 are 0, 0.3, 1.0, 1.7, and 2.0. To travel one quarter of the total length, request distance 0.5. It falls between cumulative 0.3 and 1.0, so interpolate within that interval to estimate a t between 0.25 and 0.5.

The approximation improves with suitable sampling, especially where curvature or speed changes rapidly. Three.js curve methods can provide arc-length-based mapping, but their resolution still matters. A method named `getPointAt` is not an assertion that finite sampling has become exact symbolic integration.

## Derive a tangent from two nearby points

A tangent is the direction a curve is moving at a particular parameter. Before using a symbolic derivative, compute a short displacement. For the scalar function `f(x)=x*x`, compare values at x equal to two and two plus h. At h equal to 0.1, the difference quotient is `(4.41-4)/0.1 = 4.1`. At h equal to 0.01, it is `(4.0401-4)/0.01 = 4.01`. The values approach four as the interval shrinks.

Algebra explains why. Expanding `(x+h)^2 - x^2` gives `2*x*h + h*h`. Dividing by h gives `2*x+h`. As h approaches zero, the extra h disappears, leaving `2*x`. This is the derivative of the square function. At x equal to two it is four, the local rate at which height changes as x changes.

For a curve represented as `(x,f(x))`, a small positive x step produces displacement approximately `(h,f'(x)*h)`. Dividing by h gives tangent direction `(1,f'(x))`. In three dimensions, differentiate each component of a parametric position. The resulting vector can be normalized for orientation, or its length can describe speed relative to the parameter.

A central difference compares points on both sides. For `x*x`, `(f(x+h)-f(x-h))/(2*h)` cancels the h-squared terms and gives exactly `2*x` in exact arithmetic. Other functions retain approximation error. Real floating-point arithmetic introduces rounding, so choosing h absurdly small can subtract nearly equal rounded values and amplify error. Numerical differentiation is an approximation with a scale choice, not a guarantee that smaller is always better.

## Derivatives from differences

For a scalar function `f`, `(f(x+h)-f(x))/h` is its average rate of change over a short interval. As `h` approaches zero, that approaches the derivative $f'(x)$ when it exists. A central difference `(f(x+h)-f(x-h))/(2*h)` is often a better numerical estimate. Too-large `h` misses local detail; too-small `h` amplifies floating-point cancellation.

For a curve, $p'(t)$ is a tangent vector. It gives both direction and speed with respect to the parameter. Normalize it when only direction matters. For `sin(x)`, the derivative is `cos(x)`; for `cos(x)`, it is `-sin(x)`. The chain rule accounts for an inner scale: the derivative of `sin(k*x)` is `k*cos(k*x)`.

## Derive the height-surface normal from two tangents

For a local height surface `(x,y,h(x,y))`, moving a little in x while holding y fixed produces tangent `(1,0,hx)`. Moving in y while holding x fixed produces `(0,1,hy)`. Their cross product is `(-hx,-hy,1)`. This explicit form explains why a positive x slope tilts the normal toward negative x: the normal must remain perpendicular to the rising surface.

Consider `h(x,y)=0.5*x + 0.25*y`. Its slopes are constants 0.5 and 0.25. An unnormalized normal is `(-0.5,-0.25,1)`. Dotting it with the first tangent `(1,0,0.5)` gives `-0.5+0.5=0`. Dotting with `(0,1,0.25)` gives `-0.25+0.25=0`. These checks establish perpendicularity before normalization.

The ocean uses sine and cosine instead of a plane. Its x slope contains the frequency multiplier from the chain rule. For `sin(k*x+t)`, differentiating with respect to x gives `k*cos(k*x+t)` because changing x changes the phase k times as quickly. Time is held fixed for this partial derivative. Differentiating with respect to time would be a different quantity describing motion, not the spatial normal.

The shader calculates these tangents in the plane's local coordinates, crosses them, then applies the supplied normal matrix. The mesh rotates the local plane into the world orientation. This sequence keeps the definition of the surface and the definition of its normal in agreement. A shader that changes vertex height but retains the original flat normal presents contradictory geometry and lighting.

## Surface parameters and normals

A surface $p(u,v)$ takes two parameters. Its partial derivatives $p_u$ and $p_v$ are tangents in the two parameter directions. The cross product gives a perpendicular direction:

$$
n=\operatorname{normalize}(p_u\times p_v).
$$

For a height surface $p(x,y)=(x,y,h(x,y))$, the tangents are `(1,0,hx)` and `(0,1,hy)`. The ocean shader uses exactly this construction for a sum of waves. It changes vertex height and derives a normal from the same function, keeping geometry and lighting consistent.

The ocean’s local plane uses X and Y with displacement in Z, then the mesh rotates into a horizontal world plane. Its derivative names refer to local coordinates. This is an example of why frame labels matter even inside artistic code.

## Choose a generation strategy from the intended surface

A lathe needs a profile radius and height, plus an angle around the axis. An extrusion needs a cross-section and a sweep direction or path. A tube along a curve needs a frame describing how its cross-section is oriented at every sample. A naive fixed-up cross product can collapse where the tangent aligns with that up direction, so the frame construction needs a stable policy.

A UV sphere uses longitude and latitude, with duplicate records at the texture seam when U jumps from one back to zero. Near a pole, many parameter values converge to the same spatial position and one tangent can degenerate. Use the known radial normal or a stable special case rather than normalizing a zero cross product. Parameterization singularities are mathematical properties of the chosen coordinates, not necessarily errors in the intended sphere.

Finally, update CPU bounds when CPU-side positions change, and account for GPU-only displacement conservatively. A correct surface can disappear if the renderer culls it using an old smaller bound. Geometry generation includes its support data: positions, indices, normals, UVs, bounds, and ownership all participate in a reliable result.

## Generating useful meshes

A lathe rotates a profile around an axis. An extrusion sweeps a 2D shape through depth or along a path. A tube sweeps a cross-section along a curve and needs a stable moving frame; blindly crossing a fixed up vector with a tangent fails when they become parallel. Adaptive subdivision adds samples where curvature is large. Start with a uniform grid, then optimize if its errors are visible or measured.

A curve can provide both a path and an orientation problem. To move a small vehicle along it, evaluate a position and a tangent. The tangent supplies the forward direction, but it does not uniquely determine roll around that direction. You need another orientation choice, often a transported frame or a suitable up policy. A fixed world-up vector works until forward becomes parallel to it; then their cross product loses a stable right direction. This is the same degeneracy encountered when constructing a camera basis. Treating the path as only a sequence of positions postpones that issue until the first sharp turn.

A useful numerical check is to visualize sampled tangent arrows before attaching a detailed model. Ensure their lengths are normalized if they represent direction only, and keep their raw lengths separately if measuring parameter speed. Then inspect the chosen up/right frame through a full traversal. Sudden flips can come from inconsistent frame construction even when the curve itself is perfectly smooth. Solving that frame problem is more reliable than inserting arbitrary orientation offsets at the places where the model appears upside down. The surface and camera chapters therefore provide practical prerequisites for believable motion along generated geometry.

**Optional application:** generate a UV sphere from longitude and latitude, keeping duplicate vertices at the UV seam. Compare face normals to radial smooth normals. At the poles, parameter tangents can become degenerate, so choose a stable normal from the known sphere geometry rather than normalizing a zero cross product.
