# Math field guide

This companion gathers the relationships used throughout the course. Use it after reading the relevant chapter; a formula is easier to remember when attached to a visible operation. All vectors are columns. Flat matrices in the code store columns consecutively. Angles are radians unless labeled otherwise.

## Notation and units

| Notation | Meaning | JavaScript connection |
| --- | --- | --- |
| $x^2$ | x squared | `x * x` or `x ** 2` |
| $\sqrt{x}$ | nonnegative square root | `Math.sqrt(x)` |
| $\sum_i a_i$ | add indexed terms | loop or `reduce` |
| $\|v\|$ | vector length | `Math.hypot(...v)` |
| $\hat v$ | unit vector in v’s direction | divide by nonzero length |
| $M^T$ | transpose, swap rows/columns | change indexing |
| $M^{-1}$ | inverse transform | undo M when invertible |
| $\Delta t$ | elapsed time interval | seconds since update |
| $\partial h/\partial x$ | rate of change along x | partial derivative |
| $\int f(x)dx$ | continuous accumulation | numerical weighted sum |

Always check units. Velocity times seconds produces distance. Angular velocity in radians per second times seconds produces radians. A normal has direction but no intended length after normalization. A texture UV is a normalized coordinate, not automatically a world distance or a texel index.

## Remapping and interpolation

Normalize $x\in[a,b]$ with $t=(x-a)/(b-a)$, requiring $a\ne b$. Map to `[c,d]` with `c + t*(d-c)`. Clamp only when the application intends to restrict the result. Extrapolation can be useful for geometry but dangerous for an opacity control.

Linear interpolation is $(1-t)a+tb$. Smoothstep’s normalized polynomial is $t^2(3-2t)$. Exponential following uses $1-e^{-k\Delta t}$ as its lerp weight. These solve different problems: a timed transition uses a fixed start; a follower repeatedly updates from the current value.

## Vectors and geometric tests

Length is $\sqrt{x^2+y^2+z^2}$. Dot product is $a_xb_x+a_yb_y+a_zb_z$. For unit vectors it measures angular alignment. Cross product produces a perpendicular vector and has magnitude equal to parallelogram area. Triangle area is half `length(cross(B-A,C-A))`.

Projection onto a nonzero direction `a` is $(b\cdot a)/(a\cdot a)\,a$. Reflection of direction `d` about unit normal `n` is $d-2(d\cdot n)n$. A plane through `p0` with unit normal `n` has signed distance $n\cdot(p-p_0)$.

A ray-plane intersection solves $n\cdot(o+td-p_0)=0$, giving $t=n\cdot(p_0-o)/(n\cdot d)$. If the denominator is near zero, the ray is parallel or nearly parallel. A positive `t` is in front; a negative one is behind. Choose the tolerance in relation to units and expected scale.

## Rotations and composition

A planar rotation maps `(x,y)` to `(c*x-s*y,s*x+c*y)`, with `c=cos(theta)` and `s=sin(theta)`. A point uses homogeneous W=1, a direction W=0. For column vectors, `T*R*S*p` scales, rotates, then translates.

To rotate around pivot `q`, use `T(q)*R*T(-q)`. To undo a composition, reverse the order and invert each operation. A zero scale is singular. A negative determinant indicates orientation reversal; culling and tangent handedness can be affected.

A camera view transform is the inverse camera world transform. A normal transform is the inverse transpose of the relevant linear transform, followed by normalization. A rotation alone transforms normals like directions; a nonuniform scale generally does not.

## Perspective endpoints

With vertical FOV `phi`, aspect `a`, near `n`, far `f`, set `q=1/tan(phi/2)`. Camera-forward positions have negative view Z. Projection sets clip W to `-viewZ`; divide after clipping. WebGL divided depth is -1 at the near plane and +1 at far. WebGPU divided depth is 0 at near and 1 at far.

The viewport maps NDC X by `(x+1)*W/2`. For top-left screen coordinates, Y maps by `(1-y)*H/2`. For sample indices include the center offset. A larger FOV increases visible angular extent; a smaller near plane can greatly harm standard depth precision.

## Barycentric interpolation

Weights sum to one, and interior weights are nonnegative. Interpolate an affine quantity by summing weight times value. For a projected attribute, use the perspective-correct ratio $\sum(\lambda_i a_i/w_i)/\sum(\lambda_i/w_i)$. Degenerate triangles have no stable area denominator.

This is also a useful general pattern: a normalized set of weights creates an average. Skinning weights, color blends, and numerical integration weights all need their own interpretation, but incorrect normalization is a common source of scale or brightness errors.

## Derivatives and the chain rule

A derivative is the limiting rate of change as an interval shrinks. Numerically, central difference approximates it with `(f(x+h)-f(x-h))/(2*h)`. It balances approximation error against finite precision; choosing the smallest possible `h` is not always best.

For a constant `k`, the derivative of `sin(k*x)` is `k*cos(k*x)`. For a sum, differentiate each term. For a product, `(fg)' = f'g + fg'`. For a composition, `(f(g(x)))' = f'(g(x))*g'(x)`. This chain rule explains the frequency factor in a wave normal.

For a parametric surface `p(u,v)`, `normalize(cross(dp/du,dp/dv))` gives one orientation of the normal. Reversing the cross changes its direction. A tangent becoming zero signals a parameterization degeneracy, such as a sphere pole, and needs a stable alternative.

## Integrals as accumulated contributions

An integral adds a continuous distribution. The area under `f(x)` over `[a,b]` can be approximated by splitting the interval into N pieces of width `dx`, sampling each piece, and adding `f(sample)*dx`. A midpoint rule uses each interval’s center. Finer partitions improve a sufficiently regular function’s approximation, within numerical limits.

The fundamental connection to derivatives is that accumulation and rate of change undo each other under appropriate conditions. You do not need symbolic integration to understand a filtered pixel, incoming light over a hemisphere, or numerical exposure. You need to know what is being accumulated and what each sample’s weight measures.

## Probability and sampling

A probability density integrates to one. An expectation is a weighted average under that density. To estimate an integral using samples drawn from `p`, average `f(x)/p(x)`. If you change the distribution without adjusting weights, you generally change the answer.

For uniform area sampling of a disk, `radius = R*sqrt(u)` and `angle = 2*pi*v`. For cosine-weighted hemisphere sampling, a common construction uses `r=sqrt(u)`, azimuth `2*pi*v`, and local Z `sqrt(1-u)`, then transforms the local sample into a surface frame. The PDF is `cos(theta)/pi` over the hemisphere. In a diffuse path tracer, this can cancel the cosine and Lambertian normalization factors in throughput when applied consistently.

## Stable numerical habits

Check denominators, normalize only meaningful nonzero vectors, clamp dot products to `[-1,1]` before `acos` when rounding can exceed the range, and use `atan2` for planar direction. Keep scene coordinates near a sensible scale to preserve relative precision. Compare approximate results with a tolerance in the relevant units.

The tests in `tests/math.test.mjs` exercise projection endpoints, camera frames, composition, barycentric weights, and intersections. They are a small executable companion to this guide. They do not prove every possible graphics algorithm, but they protect the conventions used by our runnable examples.
