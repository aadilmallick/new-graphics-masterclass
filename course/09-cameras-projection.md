# Cameras, perspective, and clipping

A camera is a coordinate frame plus a projection. Moving a camera does not move the world, but rendering can produce the same image by transforming the world oppositely. This is why the view matrix is the inverse of the camera’s world transform.

**Experiment:** [WebGL cube](#/lab/webgl-cube), using the field-of-view control. **Source:** `perspective` and `lookAt` in `labs/math.js`. **Reading bridge:** Eck §3.3; [perspective](https://webglfundamentals.org/webgl/lessons/webgl-3d-perspective.html) and [cameras](https://webglfundamentals.org/webgl/lessons/webgl-3d-camera.html).

## Separate the viewpoint from the lens

Imagine standing in a room holding a camera. Changing where you stand changes which side of an object you see. Turning the camera changes its viewing direction. Changing the lens changes how much angular extent fits into the image. These are related decisions, but they are not one parameter. A graphics camera similarly combines a placed coordinate frame with a projection.

The view transform handles placement and orientation. The projection handles framing and the relationship between depth and image scale. A viewport then maps the normalized result into actual render-target dimensions. Keeping these stages separate allows you to move a camera without rewriting a lens formula, or resize a panel without moving the scene.

An object can therefore be visible under one projection and clipped under another even when its world position and camera orientation are unchanged. A wide field of view includes more angular extent. An orthographic projection can show the same object with no distance-dependent size change. Understanding the chosen projection is essential before diagnosing an object's apparent scale.

## A simple camera translation worked numerically

Start with a camera at world position `(0,0,5)`, aligned with the world axes and looking toward the origin along negative Z. A world point at `(2,1,0)` is two units right, one up, and five units forward from the camera. Its view coordinates are therefore `(2,1,-5)`. We subtract the camera origin from the point.

The camera's world transform translates its own local origin to `(0,0,5)`. The view transform must undo that translation, so it translates world coordinates by `(0,0,-5)`. Applying it to the camera's own world position produces view origin `(0,0,0)`. Applying it to the target gives a negative Z coordinate. These two checks establish whether the view transform's sign is correct.

Now rotate the camera. Subtracting position alone is no longer enough because the camera's right and up axes differ from the world's. After subtracting the camera position, project the displacement onto the camera basis. Dot products produce the amount along right, up, and backward. This is exactly the vector projection idea from earlier chapters applied three times.

## Build an orthonormal camera basis step by step

Let eye be `(3,2,5)` and target `(0,0,0)`. The backward displacement is `(3,2,5)` with length `sqrt(38)`, approximately 6.1644. Normalizing gives backward axis approximately `(0.4867,0.3244,0.8111)`. Forward is the opposite direction because the camera looks along local negative Z.

Choose preferred world up `(0,1,0)`. Cross up with backward. Before normalization, the right vector is approximately `(0.8111,0,-0.4867)`. Its length is approximately 0.9459, so the normalized right axis is approximately `(0.8575,0,-0.5145)`. Cross backward with right to obtain the corrected up axis, approximately `(-0.1669,0.9460,-0.2782)`.

The corrected up differs from the original preference because the camera must tilt toward its target while retaining perpendicular axes. A preferred up vector supplies orientation guidance; it need not remain identical to the final camera up axis. The three final axes form an orthonormal basis: each has length one and each pair has dot product zero within rounding.

Our `lookAt` helper returns the world-to-view matrix directly. Some libraries use a function named look-at to return a camera-world matrix instead, then invert it separately. The name alone is not a complete contract. Check what space the function maps from and to, and verify where the eye and target land.

## Constructing a view basis

Let the camera position be `eye`, its focus point `target`, and a preferred up direction `up`. For a camera looking along local -Z:

1. Backward axis: $z=\operatorname{normalize}(eye-target)$.
2. Right axis: $x=\operatorname{normalize}(up\times z)$.
3. Corrected up axis: $y=z\times x$.

These are mutually perpendicular unit directions. A world point `p` becomes view coordinates by subtracting `eye` and projecting onto the basis: $(x\cdot(p-eye),y\cdot(p-eye),z\cdot(p-eye))$. That directly explains the dot products in our view matrix.

If `eye == target`, there is no view direction. If `up` is parallel to `z`, their cross is zero and there is no unique right direction. Choose a different up direction or retain a previous orientation. A numeric guard is better than allowing `NaN` to propagate into every vertex.

## Derive perspective from similar triangles

Place a conceptual image plane in front of a camera at distance one. A point with horizontal offset X and forward distance D forms a triangle with the camera origin. The intersection with the image plane forms a smaller similar triangle. Ratios of corresponding sides match, so image-plane horizontal offset divided by one equals X divided by D.

Thus the image coordinate is `X/D`. A point at X = 2 and D = 4 projects to 0.5. At the same X and D = 8, it projects to 0.25. Doubling distance halves projected offset and size. A line segment from X = -1 to +1 at D = 4 spans 0.5 image-plane units; at D = 8 it spans 0.25.

This construction also explains why points behind the camera need clipping rather than naive division. For negative forward distance, the ratio changes sign and can produce an inverted-looking projection. A physically meaningful visible camera volume is in front of the viewpoint and bounded away from the divide singularity at zero distance.

A perspective matrix arranges for homogeneous W to equal D, which is negative view Z under our convention. The GPU can then clip in homogeneous coordinates and divide the resulting X, Y, and Z by W at the appropriate stage. We do not need a different division expression in every material shader.

## Derive the field-of-view scale

The vertical field of view is the angle between the bottom and top view boundaries. Half that angle describes a right triangle from the forward axis to the top boundary. At forward distance D, the top boundary has vertical extent `D*tan(phi/2)`. We want that boundary to become normalized Y = 1.

Before the perspective divide, multiply view Y by `q = 1/tan(phi/2)`. After division by D, the top boundary becomes `q * D*tan(phi/2) / D = 1`. This cancellation explains the projection's vertical coefficient. It is not an arbitrary focal-length-looking constant copied into a table.

For a 60-degree vertical FOV, half angle is 30 degrees and tangent is approximately 0.57735. Its reciprocal is approximately 1.73205. At distance five, the visible half-height is about 2.88675 world units. A point at view Y = 1 projects to normalized Y about `1.73205/5 = 0.34641`.

To preserve proportions on an aspect-two image, visible horizontal extent must be twice the vertical extent. The horizontal coefficient therefore becomes `q/aspect`. With aspect two it is approximately 0.86603. This is the general version of dividing X by aspect in the simple triangle lab.

## Derive the depth coefficients from endpoint requirements

The projection's X and Y rows are now understandable. Depth needs a mapping that places the near and far planes at the API's required normalized endpoints. Assume clip Z has the form `A*z + B`, while clip W is `-z`. After division, normalized depth is `(A*z+B)/(-z)`.

For WebGL, a point at view Z = `-near` should map to -1, and a point at view Z = `-far` should map to +1. Substituting those two positions gives two equations for A and B. Solving them yields `A=(far+near)/(near-far)` and `B=2*far*near/(near-far)`, the coefficients used by our matrix.

Use near one and far nine for easy arithmetic. A becomes `10/-8 = -1.25`; B becomes `18/-8 = -2.25`. At Z = -1, clip Z is `1.25-2.25=-1`, W is one, and divided depth is -1. At Z = -9, clip Z is `11.25-2.25=9`, W is nine, and divided depth is +1. Both required endpoints hold.

At Z = -5, however, clip Z is `6.25-2.25=4`, W is five, and NDC depth is 0.8. The midpoint in world distance is not the midpoint in normalized depth. The divide produces a nonlinear depth distribution. This is the mathematical reason standard perspective depth precision is concentrated near the camera.

For WebGPU, the near endpoint is zero instead of minus one. The corresponding coefficients become `A=far/(near-far)` and `B=far*near/(near-far)`. The math helper's boolean option selects these values. The X/Y coefficients and W row remain the same for the convention used here.

## Orthographic versus perspective

An orthographic projection maps coordinates linearly. Equal world lengths remain equal on screen regardless of depth. It is useful for plans, diagrams, and isometric-like views. Perspective makes equal objects appear smaller as distance grows.

Similar triangles explain perspective. A point at horizontal offset `x` and forward distance $d=-z_{view}$ intersects an image plane at a horizontal position proportional to $x/d$. A point twice as far away has half the projected size. There is no need to attach a “make 3D” property to the mesh.

Let the vertical field of view be $\phi$, aspect ratio $a$, near distance $n>0$, and far distance $f>n$. Define $q=1/\tan(\phi/2)$. The standard OpenGL-style perspective matrix is

$$
P=\begin{bmatrix}
q/a&0&0&0\\0&q&0&0\\
0&0&(f+n)/(n-f)&2fn/(n-f)\\
0&0&-1&0
\end{bmatrix}.
$$

Multiplication sets $w_{clip}=-z_{view}$. The GPU later divides X, Y, and Z by W. This **perspective divide** produces the desired distance dependence. The vertex shader should normally output clip coordinates; it should not manually divide and then pretend W was always 1.

![Camera frustum and perspective projection](../public/diagrams/projection-frustum.svg)

## Clip coordinates and NDC are different

In WebGL, a vertex inside the clip volume satisfies $-w\le x,y,z\le w$. After clipping, dividing by W gives NDC from -1 to +1. In WebGPU, X and Y use the same clip inequalities but Z must satisfy $0\le z\le w$, giving NDC depth 0 to 1. The default WebGL depth buffer maps NDC Z from -1..1 into 0..1; the stored depth range alone does not make the projection matrices interchangeable.

Our `perspective(fov, aspect, near, far, true)` creates a WebGPU-style depth projection. To convert an OpenGL clip result to WebGPU explicitly, use $z'=(z+w)/2$ before dividing, leaving X, Y, and W unchanged. Use a matching projection rather than scattering ad hoc conversions across shaders.

## Check projection with executable endpoint tests

A camera matrix should be tested with known points before being trusted on a complex scene. This served-module example uses our actual implementation:

```js
import { perspective, transform } from './labs/math.js';
const near = 1;
const far = 9;
for (const webgpu of [false, true]) {
  const projection = perspective(Math.PI / 3, 2, near, far, webgpu);
  for (const z of [-near, -5, -far]) {
    const clip = transform(projection, [0, 0, z, 1]);
    console.log({ webgpu, z, depth: clip[2] / clip[3] });
  }
}
```

The WebGL depths are approximately -1, 0.8, and 1. The WebGPU depths are approximately 0, 0.9, and 1. These are divided coordinates, not raw clip Z. Inspecting only `clip[2]` would miss the perspective divide and lead to an incorrect conclusion about the mapping.

The project's numerical tests also check a top-edge point and invalid camera inputs. A near distance of zero is rejected because this projection requires a positive near plane. A far plane behind or equal to near is rejected because it does not define the intended forward volume.

## Explain depth precision through a practical scene

Suppose two wall surfaces lie almost on top of each other far from the camera. Their world depths differ, but the projection compresses distant depth differences into a small normalized interval. A finite depth buffer can quantize both to indistinguishably close values. As viewing and rounding change, the apparent winner changes, producing z-fighting.

Moving the near plane from an extremely tiny value to a more appropriate value can improve the distribution substantially. Reducing the far plane helps too, but the near plane often has a particularly strong influence in standard perspective depth. Do not set near to a tiny number merely because it seems to include everything; choose a range matching the actual scene.

Separating coplanar geometry or using an appropriate polygon-offset strategy can address specific overlays. Reversed-depth or logarithmic-depth approaches provide other tradeoffs in suitable rendering paths. Those are deliberate pipeline choices, not a reason to ignore the conventional depth mapping while learning it.

## Near plane and depth precision

The near plane must be positive for this perspective camera. A near plane of zero makes the projection invalid. Perspective depth precision is concentrated near the camera, so a huge far/near ratio makes distant overlapping surfaces difficult to distinguish. **Z-fighting** is the flickering pattern when surfaces quantize to nearly identical depths. Move the near plane outward when possible, reduce the far plane, separate surfaces, or use an appropriate depth strategy.

Field of view is not identical to camera distance. Moving closer changes perspective relationships; narrowing field of view from farther away compresses them. To preserve framing when resizing, update aspect ratio and rebuild the projection matrix. In Three.js call `camera.updateProjectionMatrix()` after changing its fields.

## Understand framing changes before changing the lens

Moving a camera closer enlarges a subject but also changes relative size relationships between near and far parts. Narrowing the field of view from a greater distance can keep the subject similarly framed while changing those perspective relationships. This is why camera distance and FOV are not interchangeable artistic controls.

An orthographic view has no distance-dependent size scaling. Moving an object farther away changes visibility and depth but does not shrink it under a fixed orthographic projection. Adjust the orthographic bounds or zoom to change framing. This can be ideal for technical diagrams where equal lengths should remain comparable.

When a browser panel resizes, update aspect and projection rather than stretching an old image. Decide whether vertical field of view stays fixed, horizontal field of view stays fixed, or a scene region must fit. Those are framing policies. The default Three.js perspective pattern keeps vertical FOV and changes horizontal extent through aspect.

## Diagnose a camera through simple landmarks

Use a known origin, visible axes, and one object at a known distance. First verify that the camera's target appears near image center. Next verify a point to camera-right appears on the right. Check near and far endpoints numerically. Then add the model transform. This order separates view-basis errors from projection and object-placement errors.

If every object disappears after a change, inspect W and clip bounds before increasing light intensities. If shapes stretch, inspect aspect and viewport. If depth flickers, inspect precision and coplanarity. If a camera rolls unexpectedly near a vertical direction, inspect the preferred-up degeneracy. The correct diagnostic follows the stage whose responsibility matches the symptom.

**Optional application:** inspect `tests/math.test.mjs`. It verifies that a point at view Z = `-near` maps to the near depth and `-far` maps to the far depth for both APIs. These endpoint checks catch sign and layout mistakes more reliably than eyeballing a cube.
