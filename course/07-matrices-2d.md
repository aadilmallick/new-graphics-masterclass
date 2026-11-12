# Matrices as coordinate machines

A matrix packages a transformation so we can apply and combine it consistently. It is a table of coefficients, but its geometric meaning is more useful: its columns describe where basis directions go. Multiplying it by a vector recombines those transformed directions.

**Experiment:** [Transform order](#/lab/transforms). **Reading bridge:** Eck §§2.3 and 3.5.2–3.5.3; [2D matrices](https://webglfundamentals.org/webgl/lessons/webgl-2d-matrices.html).

## Begin with the two basis arrows

A coordinate pair `(x,y)` describes a combination of two agreed directions. The standard X basis is `(1,0)` and the standard Y basis `(0,1)`. Multiplying the first by X and the second by Y, then adding, reconstructs the point or vector: `x*(1,0) + y*(0,1) = (x,y)`. This is the geometric meaning behind component storage.

Now imagine a transformation sends the X basis to `(2,1)` and the Y basis to `(-1,3)`. To transform `(4,2)`, take four copies of the transformed X basis and two copies of the transformed Y basis. Four times `(2,1)` is `(8,4)`; two times `(-1,3)` is `(-2,6)`; the sum is `(6,10)`.

A matrix stores those two transformed basis arrows as columns. The table has first column `(2,1)` and second column `(-1,3)`. Multiplying it by `(4,2)` performs the combination we just described. You can view matrix multiplication either as row dot products or as a weighted sum of columns. These are two explanations of the same arithmetic, each useful in a different situation.

A transformation constructed this way sends the origin to the origin, because zero copies of both columns sum to zero. It also preserves addition and scalar multiplication: transforming a combination is the same as combining transformed inputs. These properties define a linear transformation. Rotation, scaling, shear, and reflection around the origin fit this model. Translation does not, because it moves the origin.

## Recognize basic transforms by their columns

A scale by `(2,3)` sends `(1,0)` to `(2,0)` and `(0,1)` to `(0,3)`. Its matrix is diagonal because each basis direction changes length without gaining a component along the other direction. A negative scale sends a basis direction backward and can reverse orientation. A zero scale collapses one direction, losing information.

A shear can send X basis to `(1,0)` and Y basis to `(k,1)`. A point `(x,y)` then becomes `(x+k*y,y)`. For `k=0.5`, points higher in Y shift farther to the right. Parallel lines remain parallel, but angles generally change. Shear is useful for understanding why a matrix is more general than a rotation plus a uniform size adjustment.

A rotation's columns are unit directions perpendicular to one another. This preserves lengths and angles. An arbitrary matrix's columns need not have those properties, so multiplying by a matrix does not inherently mean rotation. Inspect the columns when a transform stretches or skews a shape unexpectedly.

## From formulas to a matrix

The previous chapter derived a rotation:

$$
\begin{bmatrix}x'\\y'\end{bmatrix}
=\begin{bmatrix}\cos\theta&-\sin\theta\\\sin\theta&\cos\theta\end{bmatrix}
\begin{bmatrix}x\\y\end{bmatrix}.
$$

Each output is the dot product of one matrix row with the input column. For example, the first row gives $x\cos\theta-y\sin\theta$. The first column is the transformed X basis and the second is the transformed Y basis. Scaling uses a diagonal matrix with `sx` and `sy` on the diagonal. The identity matrix has ones on its diagonal and zeros elsewhere; it leaves every input unchanged.

Such a 2 × 2 matrix cannot express translation, because multiplying the zero vector always produces zero. We need one more coordinate.

## Add translation with a constant coordinate

We want the expression `newX = a*x + b*y + tx`, but a two-component matrix multiplication only gives two weighted input terms. Append a constant third input equal to one. The translation becomes an ordinary coefficient multiplied by that constant. The new point representation is `(x,y,1)`.

A homogeneous translation by `(3,-2)` maps `(4,5,1)` to `(7,3,1)`. The first output is `1*4 + 0*5 + 3*1`; the second is `0*4 + 1*5 - 2*1`; the third stays one. The matrix now handles translation using the same multiplication machinery as scaling and rotation.

For a displacement, append zero instead. The same translation matrix maps `(4,5,0)` to `(4,5,0)` because the translation coefficients multiply zero. This matches geometry: relocating the coordinate origin changes point coordinates, while a displacement's direction and magnitude are not shifted by translation. The W coordinate encodes this distinction compactly.

Homogeneous coordinates also support projective operations beyond translation. In an affine 2D transform, W remains one for ordinary points. Later perspective transforms can produce a different W, requiring a divide to recover represented coordinates. Do not treat the extra component as an unexplained placeholder; its role broadens when projection is introduced.

## Homogeneous coordinates

Represent a 2D point as $(x,y,1)$. A 3 × 3 matrix can then include translation:

$$
T=\begin{bmatrix}1&0&t_x\\0&1&t_y\\0&0&1\end{bmatrix},\quad
S=\begin{bmatrix}s_x&0&0\\0&s_y&0\\0&0&1\end{bmatrix},\quad
R=\begin{bmatrix}c&-s&0\\s&c&0\\0&0&1\end{bmatrix}.
$$

Here $c=\cos\theta$, $s=\sin\theta$. Multiplying `T` by `(x,y,1)` gives `(x+tx,y+ty,1)`. A direction is represented with final coordinate 0, so translation does not affect it. This extra coordinate is not an extra spatial dimension; it is a representation that unifies useful operations.

## Multiply a complete example by hand

Let scale double X and leave Y unchanged. Let rotation be a 90-degree counterclockwise turn in a Y-up plane. Let translation add `(3,1)`. Begin with point `(1,2)`. Scaling gives `(2,2)`. Rotation gives `(-2,2)`. Translation gives `(1,3)`.

The combined matrix is `T*R*S` under our column-vector convention. To apply that combined matrix, we do not execute all three operations separately for every point. We can first multiply the three matrices once, then multiply every vertex by the resulting matrix. This is especially useful for a mesh with many vertices sharing the same object transform.

To understand one column of the product, apply the operations to a basis direction. The X direction first doubles to `(2,0)`, then rotates to `(0,2)`, and translation does not affect it because its homogeneous W is zero. This becomes the combined matrix's first column. The Y direction becomes `(-1,0)` and becomes the second column. The origin moves to `(3,1)`, stored in the translation column.

The resulting affine mapping is therefore `newX = -y + 3` and `newY = 2*x + 1`. Substituting `(1,2)` yields `(1,3)`, matching the step-by-step construction. We have connected geometry, basis columns, matrix multiplication, and scalar formulas without relying on a library result.

## Build a minimal executable 3-by-3 implementation

The following complete console example uses nested row arrays for readability. This is a teaching representation; the project math module uses flat column-major arrays for GPU compatibility.

```js
function matrixTimesPoint(rows, point) {
  return rows.map(row => row.reduce((sum, value, i) =>
    sum + value * point[i], 0));
}
function matrixProduct(a, b) {
  return a.map(row => b[0].map((unused, column) =>
    row.reduce((sum, value, k) => sum + value * b[k][column], 0)
  ));
}
const scale = [[2,0,0], [0,1,0], [0,0,1]];
const rotate = [[0,-1,0], [1,0,0], [0,0,1]];
const translate = [[1,0,3], [0,1,1], [0,0,1]];
const combined = matrixProduct(translate, matrixProduct(rotate, scale));
console.log(combined);
console.log(matrixTimesPoint(combined, [1,2,1])); // [1,3,1]
```

`matrixTimesPoint` calculates one row dot product for each output component. `matrixProduct` chooses a result row and column, then adds products across the shared index K. Three nested choices are involved: which output row, which output column, and which intermediate component contributes. That shared-index sum is the entire algorithm.

The arrays in this example are arranged by rows. If you send them directly to a GPU API expecting a flat column-major list, the layout will be wrong even though the mathematical algorithm is correct. Representation conversion is a separate step from deriving the transform. Always state both the convention and the storage layout when sharing matrix code.

## Multiplying matrices without mystery

The element in result row `r`, column `c` is the sum of `a[r,k] * b[k,c]` over `k`. Why? The `c`th column of `b` is where one basis goes under `b`; applying `a` to that column gives where it goes after both transforms. Our tested 4 × 4 implementation in `labs/math.js` uses exactly this loop.

Storage order is a separate question. **Column-major** means consecutive values store one column. It does not change the abstract mathematics, and it does not mean “the first operation happens first.” Three.js `Matrix4.set` accepts arguments arranged as rows for readability but stores its `.elements` column-major. WebGL `uniformMatrix4fv` receives column-major values and requires its transpose argument to be `false`.

## Why multiplication is associative but order still matters

Associativity means that grouping a composition does not change the represented sequence. Applying scale, then rotation, then translation can be prepared as `(T*R)*S` or `T*(R*S)`. Both represent the same sequence. Within floating-point arithmetic, different grouping can produce tiny numerical differences, but the intended geometry is identical.

Commutativity would mean swapping operations is safe, which is generally false. Take point `(1,0)`, rotate it 90 degrees, then translate by `(3,0)`: the result is `(3,1)`. Translate first to `(4,0)`, then rotate: the result is `(0,4)`. These final points are far apart because the second sequence rotates the translation displacement too.

The transform playground makes exactly this distinction visible. Its `TRS` option scales local X, rotates the resulting point, then adds translation. Its `RTS` option scales, adds translation, then rotates. The original polygon remains faintly visible. That reference shape helps you see which origin and orientation the new result came from.

## Composition and order

Let $M=TRS$. Applying `M` to a column vector scales first, rotates second, translates third. Matrix multiplication composes operations; the rightmost operation acts first. It is associative, so `(T*R)*S` equals `T*(R*S)` within floating-point error. It is generally not commutative: `T*R` usually differs from `R*T`.

Take point `(1,0)`, scale by 2 in X, rotate 90°, then translate by `(3,0)`. The steps give `(2,0)`, then `(0,2)`, then `(3,2)`. If translation happens before rotation, the final location changes. The transform-order lab makes this visible without changing the original polygon.

![Matrix composition and right-to-left application](../public/diagrams/matrix-composition.svg)

To rotate around a pivot $q$, move the pivot to the origin, rotate, then move it back: $T(q)RT(-q)$. This formula explains orbiting, hinged doors, and local origins. A common error is rotating an object around the world origin when its geometry was authored far from its own origin.

## Derive a pivot transform from a local displacement

Suppose a door hinge is at Q `(2,1)`, while a point on the door is P `(5,1)`. The hinge-to-point displacement is `(3,0)`. Rotate that displacement 90 degrees to `(0,3)`, then add the hinge position, obtaining `(2,4)`. This is the desired rotation around the hinge.

The three steps are subtract Q, rotate, and add Q. In matrix notation that is `T(Q)*R*T(-Q)` acting on the point. The rightmost translation first relocates the hinge to the origin; the leftmost translation restores its placement afterward. A hinge becomes much easier to understand when geometry is authored around its own local origin.

The same construction applies to scaling around a pivot: move the pivot to zero, scale, move it back. A uniform scale of two around Q doubles each point's displacement from Q rather than doubling its absolute world coordinate. This distinction is useful for zoom gestures centered under the pointer and for object manipulation handles.

## Invert the mapping as an undo operation

The inverse of a transform answers which input produced a given output. For the mapping `newX = 2*x + 3`, subtract three and divide by two to recover X. The order reverses because the last forward operation must be undone first. A matrix inverse is the multidimensional version of this reasoning.

If a forward composition is scale, rotate, translate, its inverse sequence subtracts translation, rotates backward, and applies reciprocal scale. A point transformed to `(1,3)` in our earlier worked example returns first to `(-2,2)`, then to `(2,2)`, then to `(1,2)`. The undo sequence provides a concrete check of the inverse-product rule.

A zero scale cannot be undone uniquely. Scaling all X coordinates to zero makes points `(1,2)` and `(5,2)` coincide. After that collapse, no calculation can know which original X was intended. Singular matrices are therefore not simply inconvenient numerical cases; they represent information loss. Treat inversion failure as a meaningful input problem.

## Inverses and what they mean

An inverse transform undoes a transform: $M^{-1}M=I$. The inverse of translation by `t` is translation by `-t`; rotation by an angle is undone by rotation by the negative angle; scale is undone by reciprocal scale if no scale factor is zero. The inverse of a product reverses its order: $(TRS)^{-1}=S^{-1}R^{-1}T^{-1}$.

A zero scale destroys information, so there is no unique inverse. A **determinant** is a scalar that, among other things, tells whether a square matrix is invertible: zero means singular. In 2D it is `ad - bc`. Its magnitude is the area scale; its sign tells whether orientation flips. You do not need a general determinant expansion to use these geometric facts.

## Interpret determinant through area and orientation

For a 2D linear matrix with columns `(a,c)` and `(b,d)`, the determinant is `a*d - b*c`. Its magnitude measures the area scale applied to the unit square. A scale `(2,3)` has determinant six, and its transformed unit square has area six. A 90-degree rotation has determinant one and preserves area.

A reflection can have determinant negative one. The area magnitude stays one, but the ordering of a basis reverses. This orientation reversal helps explain why a negative object scale can change a mesh's winding and interact with face culling. A determinant of zero means the transformed basis arrows span no area, so they cannot provide a unique two-dimensional coordinate system.

You do not need to expand large determinants by hand to use these facts. Understand what a determinant reports, use a suitable tested implementation where needed, and keep the geometric interpretation available when diagnosing collapsed or reflected objects.

## Keep model coordinates independent of screen fitting

A reusable shape should usually have local coordinates convenient for its design. A wheel can have radius one; a robot link can extend from its pivot along local X. A separate placement transform puts it in the scene, and a separate viewport or camera transform fits that scene to the canvas. Mixing these roles forces you to rewrite geometry whenever the panel resizes.

For a 2D plot, the final mapping might first model the object, then translate/scale world coordinates into a visible window, then map that window to pixels. Each stage has a reason and can be inspected independently. The full composition is efficient to apply, while its factorization remains valuable for understanding and editing.

When a result looks wrong, test a simple origin and two basis points before rendering a complex polygon. The transformed origin reveals translation; transformed basis directions reveal rotation, scale, shear, and reflection. These three probes often explain a matrix error more clearly than staring at dozens of transformed vertices.

**Optional application:** calculate the transformed point in the example above by hand, then use the lab’s settings to verify the ordering. In the later 3D math tests, the same idea is checked numerically so storage mistakes cannot silently masquerade as camera bugs.
