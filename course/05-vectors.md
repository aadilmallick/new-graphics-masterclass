# Vectors: directions, distances, and orientation

A point answers “where?” A vector answers “how far and in which direction?” Both can be stored as three numbers, but their meanings differ. Subtracting two points gives a displacement vector. Adding a displacement to a point gives another point. Adding two positions without interpreting the result usually does not describe a meaningful geometric operation.

**Experiment:** [Vector workbench](#/lab/vectors). **Source:** `labs/math.js` and `labs/02-vectors.js`. **Reading bridge:** Eck §3.5.1; [directional lighting](https://webglfundamentals.org/webgl/lessons/webgl-3d-lighting-directional.html).

## Components and length

Let $A=(1,2)$ and $B=(4,6)$. The displacement $B-A=(3,4)$ means three units right and four units up. Pythagoras gives its length:

$$
\|v\|=\sqrt{v_x^2+v_y^2+v_z^2}.
$$

For `(3,4,0)`, the length is 5. Component addition combines displacements: `(3,4,0) + (1,-2,0) = (4,2,0)`. Multiplication by a scalar changes length; multiplying by a negative scalar also reverses direction.

A **unit vector** has length 1. To normalize a nonzero vector, divide each component by its length: $\hat v=v/\|v\|$. For `(3,4,0)`, that is `(0.6,0.8,0)`. The hat means unit length. Normalization preserves direction, not magnitude. Never divide a zero vector by its length; our helper returns a zero vector, and camera construction rejects degenerate bases where a direction is required.

## The dot product

The dot product multiplies corresponding components and adds:

$$
a\cdot b=a_xb_x+a_yb_y+a_zb_z=\|a\|\|b\|\cos\theta.
$$

The second equality connects arithmetic to geometry. For unit vectors, the dot is the cosine of their angle. Aligned unit vectors produce 1, perpendicular vectors 0, and opposite vectors -1. We explain cosine fully in the next chapter; for now think of it as an alignment factor.

In the vector lab, $a=(2,0)$ and $b$ rotates. At 60°, with length 2, $a\cdot b=2\cdot2\cdot0.5=2$. At 120° it is -2. A negative dot is a geometric signal, not a failed calculation. A light behind a surface has negative alignment with its outward normal; diffuse shading clamps that contribution to zero.

To project `b` onto a **unit** direction $\hat a$, take the scalar length $b\cdot\hat a$ and multiply back by $\hat a$:

$$
\operatorname{proj}_{a}(b)=\frac{b\cdot a}{a\cdot a}a.
$$

The denominator handles a non-unit direction. Do not omit it unless you normalized first. If `a` is zero, the projection direction is undefined.

## The cross product

In three dimensions, a cross product returns a vector perpendicular to both inputs:

$$
a\times b=(a_yb_z-a_zb_y,\ a_zb_x-a_xb_z,\ a_xb_y-a_yb_x).
$$

Its length is the parallelogram area spanned by the inputs. Half that length is a triangle’s area. Its direction follows the right-hand rule: curling fingers from `a` toward `b` points the thumb along `a × b`. Reversing the order negates the result. `(1,0,0) × (0,1,0) = (0,0,1)` defines our right-handed convention.

![Vector operations and geometric interpretation](../public/diagrams/vectors-dot-cross.svg)

For triangle positions `A`, `B`, `C`, compute `normalize(cross(B-A, C-A))` to obtain one face normal. If the vertices lie on a straight line, the cross is zero: the triangle is degenerate. Adjacent faces can share a position yet need different normals at a sharp crease, a reason vertex data includes more than position.

## A complete numerical experiment

```js
import { subtract, length, normalize, dot, cross } from './labs/math.js';
const displacement = subtract([4, 6, 0], [1, 2, 0]);
console.log(length(displacement));          // 5
console.log(normalize(displacement));       // [0.6, 0.8, 0]
console.log(dot([1, 0, 0], [0, 1, 0]));      // 0
console.log(cross([1, 0, 0], [0, 1, 0]));    // [0, 0, 1]
```

These functions run in a served module and are also tested with Node. Three.js provides the same operations through `Vector3`, but many methods mutate the receiving vector. `direction.subVectors(target, eye).normalize()` computes into `direction`; `target.sub(eye)` changes `target` itself. Use `.clone()` when preserving the original matters.

**Optional application:** compute the velocity direction toward a destination, then move `speed * dt` units along it. Stop at the destination rather than stepping past it. The speed remains constant regardless of distance because the direction is normalized.
