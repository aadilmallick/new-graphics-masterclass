# 3D transforms and coordinate frames

Adding depth does not replace the mathematics you already know. It adds one spatial component, one extra basis direction, and more choices about rotation. The central discipline is always the same: name the coordinate frame in which a quantity is expressed.

**Experiment:** [Scene graph](#/lab/scene-graph), then [raw WebGL cube](#/lab/webgl-cube). **Reading bridge:** Eck §§3.2, 3.3.1, 3.5 and 5.1.3.

## Add a third direction without changing the basic idea

A point in a plane needs two coordinates because two independent directions locate it. A point in a volume needs three. In our default world, X points right, Y points up, and Z completes a right-handed basis. A location `(2,1,-3)` means two units along X, one along Y, and three opposite positive Z from the origin.

The numbers only make sense relative to that frame. A camera can have its own origin and axes; an object can have another. The same physical point may have different coordinate triples in each frame, just as a location can have a street address relative to a town and a room number relative to a building. The analogy stops at the arithmetic: our frame changes are explicit geometric transforms, not arbitrary naming systems.

Three-dimensional length follows the same Pythagorean construction as two dimensions. First measure the XY-plane diagonal from X and Y, then combine that diagonal with Z as another right triangle. Squaring the intermediate diagonal removes its square root, yielding the familiar sum of three squared components. A displacement `(2,3,6)` has squared length `4+9+36=49`, so its length is seven.

The extra coordinate therefore does not introduce a new kind of number. It introduces another component whose units and frame must match the existing ones. Most difficult 3D bugs arise when those meanings become implicit rather than from the mere presence of a third component.

## Author geometry in a useful local frame

Imagine a robot arm link extending two units along its own positive X axis, with its hinge at local origin. Its endpoints are `(0,0,0)` and `(2,0,0)`. This is a convenient description because rotating the link around its local origin naturally rotates it around the hinge.

Place the hinge at world position `(3,1,0)`. Without rotation, the far endpoint becomes `(5,1,0)`. Rotate the link 90 degrees around world Z, then place it at the hinge, and the endpoint becomes `(3,3,0)`. The link's local geometry is unchanged. Its placement transform is what changed.

If the geometry had instead been authored with points already offset by the hinge position, rotating around the default object origin would swing it around the wrong point. You could correct that with pivot transforms, but authoring useful local origins simplifies both modeling and interaction. This is why an imported model's origin can matter even when its visible mesh looks correct.

An object transform is therefore a mapping from local coordinates into its parent's coordinates. It is not inherently a mapping directly into the world. Only an object whose parent is the world/root frame has that simple relationship. Nested objects require composition through every ancestor.

## Local, parent, world, and view

An object’s geometry is usually authored in its **local** coordinates. Its transform places it in its parent’s coordinates. Combining transforms up the hierarchy produces a **world** transform. A view transform then expresses world positions relative to the camera. Projection converts view coordinates to a representation suitable for the screen.

If a wheel’s local point is `p`, the wheel is attached to a car, and the car is in the world:

$$
p_{world}=M_{car}M_{wheel}p_{local}.
$$

The wheel does not need to know where the car is. This is hierarchical modeling. A scene graph stores that parent-child relationship and computes composed transforms. In the scene-graph lab, the planet’s local X stays 3 while its world position changes because its orbit parent rotates.

![Scene graph and inherited transforms](../public/diagrams/scene-graph.svg)

## Follow a point through two parents

Let a car have world translation `(10,0,0)`. A wheel is attached at car-local position `(2,0,1)`. A point on the wheel lies at wheel-local position `(0,1,0)`. With translations only, first place the point into car space by adding the wheel attachment: `(2,1,1)`. Then add the car's translation: `(12,1,1)` in world space.

Now rotate the car 90 degrees around world Y before its world translation. Using our right-handed convention, `(2,1,1)` becomes `(1,1,-2)`. Translating the car then gives world position `(11,1,-2)`. The wheel did not need an updated local attachment position. Its parent's rotation moved the whole relationship.

This is the reason scene graphs are powerful. A car can move as one unit while its wheels retain their local relationships. A wheel can spin in its own frame while the car turns. A wheel-mounted detail inherits both effects without a separate world-space placement formula written for that detail.

The mathematical product for our point is `Mcar * Mwheel * p`. The rightmost wheel transform acts first because the input coordinates belong to the wheel. Each next transform expects the output frame of the previous one. Reading frame labels from right to left is a dependable way to check whether a product is meaningful.

## Read a 4-by-4 affine transform as columns

The first three columns tell where the local basis directions go. The fourth column tells where the local origin goes. For an identity transform, these are X `(1,0,0)`, Y `(0,1,0)`, Z `(0,0,1)`, and origin `(0,0,0)`. Scaling changes basis lengths, rotation changes basis directions, and translation changes origin placement.

Appending W = 1 to a point includes the origin placement when combining columns. Appending W = 0 to a direction excludes it. For a translation by `(3,4,5)`, point `(1,0,0,1)` becomes `(4,4,5,1)`, while direction `(1,0,0,0)` remains unchanged. The same numeric XYZ input has different behavior because point and direction represent different geometric quantities.

A transformed tangent is a direction along a surface. A transformed normal must remain perpendicular to transformed tangents. Those requirements coincide for pure rotation but differ under nonuniform scale. That is why a normal cannot always use the same matrix path as a direction even though both are commonly represented with three components.

## Four-component representations

A 3D point becomes $(x,y,z,1)$ and a direction becomes $(x,y,z,0)$. Translation occupies the final column of a 4 × 4 affine transform. “Affine” means a linear transform plus translation; it preserves straight lines and parallelism. Perspective is projective rather than affine.

For our column-vector convention:

$$
M=\begin{bmatrix}
m_{00}&m_{01}&m_{02}&t_x\\
m_{10}&m_{11}&m_{12}&t_y\\
m_{20}&m_{21}&m_{22}&t_z\\
0&0&0&1
\end{bmatrix}.
$$

The first three columns describe transformed basis directions. The final column places the origin. Our `translation`, `rotationY`, `scaling`, and `multiply` functions produce and combine these matrices. For example, this runnable module fragment computes a point after scale and translation:

```js
import { multiply, translation, scaling, transform } from './labs/math.js';
const model = multiply(translation(3, 0, 0), scaling(2, 1, 1));
console.log(transform(model, [1, 2, 0, 1])); // [5, 2, 0, 1]
console.log(transform(model, [1, 0, 0, 0])); // [2, 0, 0, 0]
```

The direction receives scale but not translation. A normal is not just any direction; nonuniform scale requires the inverse-transpose transform, derived in the lighting chapter.

## Rotation in 3D

Rotation around Y leaves Y unchanged and rotates the XZ plane. A right-handed rotation in this course is

$$
R_y(\theta)=\begin{bmatrix}c&0&s&0\\0&1&0&0\\-s&0&c&0\\0&0&0&1\end{bmatrix}.
$$

At 90°, +X rotates toward -Z. Rotation order matters even when all operations are rotations. Turning around world Y then local X differs from the reverse. Three Euler angles are convenient, but their order must be specified. Three.js defaults to `XYZ`; a **quaternion**, introduced in animation, provides another rotation representation that avoids Euler interpolation problems.

## Construct and verify a 3D transform with the actual helper

The following complete served-module example uses the project's math functions. It scales a local point, rotates around Y, then translates into the world.

```js
import {
  multiply, translation, scaling, rotationY, transform
} from './labs/math.js';
const model = multiply(
  translation(10, 1, 0),
  multiply(rotationY(Math.PI / 2), scaling(2, 1, 1))
);
const localPoint = [1, 2, 3, 1];
console.log(transform(model, localPoint));
// Approximately [13, 3, -2, 1].
```

Follow the point manually. Scale `(1,2,3)` by `(2,1,1)` to obtain `(2,2,3)`. Rotate Y by a quarter turn; X becomes old Z and Z becomes negative old X, giving `(3,2,-2)`. Finally add `(10,1,0)` to obtain `(13,3,-2)`. The program result should agree within floating-point tolerance.

The helper stores matrices in column-major `Float32Array` values. Its multiplication loop uses `column*4 + row` to select a stored element. That indexing is a representation detail; the geometric order remains the column-vector order described above. Mixing these two topics is a common source of transposed matrices and incorrect translations.

## Distinguish the matrix from its factorization

A model matrix can combine translation, rotation, scale, shear, and reflection. Many scene libraries expose position, orientation, and scale as editable properties, then build a matrix from those properties. This factorization is convenient for common authoring operations, but not every arbitrary affine matrix has a unique intuitive decomposition into those properties.

Nonuniform parent scale followed by child rotation can create an effective shear in world space. A child that looks like a simple rotated object locally can therefore have a more complicated world linear transform. This matters for normals, bounding volumes, and attempts to copy a world transform back into simple local rotation/scale controls.

The composed matrix still has a precise meaning even when the decomposition is awkward: multiply a local point by it to obtain its world coordinates. Keep that direct mapping as the source of geometric truth. Editable properties are a useful interface, not a promise that every hierarchy reduces to one visually obvious set of angles.

## Make coordinate conversion reversible

If a world point is known and an object-local point is needed, apply the inverse world transform. This is useful for placing a hit marker on a rotating object, evaluating an object-space procedural pattern, or interpreting a drag in a local plane. The inverse answers which local coordinates would have produced the given world coordinates.

For a translation-only object at `(10,0,0)`, world point `(12,3,0)` has local coordinates `(2,3,0)`. Subtracting translation performs the inverse. If the object is also rotated, subtract translation first and rotate backward. If scaled, apply reciprocal scale at the correct stage. The inverse of a product reverses the operation order because the final forward operation must be undone first.

A singular transform cannot support this conversion uniquely. A zero-scaled axis has collapsed multiple local points onto the same world point. A picking or manipulation tool should handle that case explicitly instead of assuming every visible object has a usable inverse. Extremely small scales can also make inversions numerically sensitive even when mathematically nonzero.

## Understand what a camera frame adds

A camera is another placed frame, with an additional projection rule. Its local origin is the viewpoint. Its local negative Z direction is forward under our convention. Its local X and Y directions define right and up. To express world geometry relative to the camera, use the inverse camera world transform.

This is why moving the camera forward can be represented during rendering as moving the world backward in camera coordinates. The scene is not actually rewritten in world space. We calculate a different coordinate description for the same world positions. A view matrix is a change of description, not an instruction to permanently mutate every object.

Projection comes after view conversion because its formulas are easiest to define relative to a camera with a standard origin and forward direction. The complete position chain is local to world, world to view, view to clip, then divide and viewport mapping. Each step has a distinct question to answer. Treating the entire product as one unexplained matrix hides useful opportunities to diagnose errors.

## Handedness and orientation

“Right-handed” describes a basis relationship, not an unavoidable property of screens. With +X right, +Y up, and +Z toward you, the basis is right-handed. A conventional camera looks along its local -Z. WebGL itself does not require your world convention; your transforms define it. Keep mesh winding, normal directions, culling, and camera conventions consistent.

Scaling one axis by a negative value reflects orientation. A triangle that was counterclockwise can become clockwise. Face culling can then hide what you expected to see. This is especially relevant when importing assets with a different axis system.

## Handedness is a convention you must carry consistently

The cross product of our positive X and Y basis directions is positive Z. That relationship defines a right-handed basis. A camera looking along negative Z is compatible with it. Another application may use a different up axis or a left-handed world; neither is inherently impossible for a browser renderer, but imported data and formulas must be converted consistently.

Swapping an axis or negating one direction can reverse orientation. A triangle whose vertices were counterclockwise from its front can become clockwise after reflection. Its normal and tangent frame may need corresponding treatment. Disabling culling can make the triangle visible again, but it does not necessarily repair its lighting or normal-map interpretation.

The simplest debugging geometry is a labeled axis triad and one asymmetric object. A sphere can hide an orientation mistake because many rotations leave its silhouette unchanged. An arrow, letter-shaped mesh, or colored cube exposes which direction is actually which. Choose diagnostic geometry that makes the convention visible.

## Trace the orbit lab as a hierarchy

The orbit lab's parent group rotates around Y. A planet mesh is attached three units along that group's local X. A second pivot is placed at the same attachment location, and a moon sits one unit from that pivot. Changing the outer pivot rotates both planet and moon around the central origin. Changing the moon pivot adds a local orbit within the already moving frame.

The displayed planet-local coordinates remain `(3,0,0)`. Its world position changes, which the lab obtains with `getWorldPosition`. This is a direct demonstration that an object's `.position` is not generally its world location. The local property encodes the parent relationship; the world query composes ancestors.

The planet's own rotation changes its orientation without changing the attachment location of the separate moon pivot. That modeling choice separates spin from the moon's orbit. If the moon pivot were a child of the spinning planet mesh, it would inherit that spin too. Scene graphs express exactly the relationships you build, so parenting is a modeling decision rather than merely a way to organize a list.

## Use frame names as a debugging tool

A light direction named `direction` is easy to misuse. A name such as `worldLightDirection` communicates a contract. Before taking a dot product with a normal, confirm that the normal is also world-space. If it is view-space, transform one side appropriately. The components cannot tell you the frame by themselves.

The same discipline helps interaction. A ray hit can return a world point while a label needs local coordinates, or a control handle may be manipulated in a parent frame. Write the conversion at that boundary and name the result after its new frame. Do not let a variable silently change from local to world while retaining the same generic name.

When a complex scene behaves unexpectedly, follow one point through the chain and write down its value after each stage. An origin test exposes translation. A basis-direction test exposes orientation and scale. A parent/child test exposes composition order. These small concrete calculations remain useful even when the final engine automates all matrix updates.

## Practical frame bookkeeping

Never dot a world-space normal with a view-space light direction. Never apply an object’s local position as if it were world-space. Never assume a child’s `.position` is global. In Three.js use `getWorldPosition`, `localToWorld`, and `worldToLocal` when crossing these boundaries. If you manually change matrices with automatic updates disabled, explicitly update them before queries.

**Optional application:** add a moon beneath a planet beneath an orbit pivot. Change only the pivot and observe all descendants. Then detach the moon while preserving its world transform; that operation requires converting between its old and new parent frames.
