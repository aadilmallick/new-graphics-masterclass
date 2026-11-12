# From triangles to fragments

A GPU does not need a complete geometric description of every curved object. A mesh approximates its surface with triangles. A triangle is planar, easy to interpolate across, and remains a triangle under affine transformations. More triangles improve approximation until another bottleneck matters.

**Experiment:** [Software triangle rasterizer](#/lab/rasterizer). **Reading bridge:** Eck §§3.4 and 6.1.3; [how WebGL works](https://webglfundamentals.org/webgl/lessons/webgl-how-it-works.html).

## Vertices describe corners and more

A **vertex** is an input record. It may contain position, normal, color, texture coordinate, skinning weights, and other attributes. A triangle consumes three vertex records. If two faces meet at a sharp edge, the same spatial corner can require different normals or UVs, so it needs separate vertex records even though the positions match.

Rasterization determines which samples a projected primitive covers. A **fragment** is a candidate contribution for a sample; it is not automatically the final pixel. It can fail depth or stencil tests, be discarded, or be blended with an existing value. Multisampling and early tests make the exact scheduling more involved than “one fragment shader call per pixel.”

## Barycentric coordinates

Any point in a triangle’s plane can be written using weights:

$$
p=\lambda_A A+\lambda_B B+\lambda_C C,\qquad
\lambda_A+\lambda_B+\lambda_C=1.
$$

The lambdas are **barycentric coordinates**. Inside the triangle all three are nonnegative. On an edge, the opposite weight is zero. At vertex A, the weights are `(1,0,0)`. The weights are also ratios of signed subtriangle areas to the full triangle’s signed area.

For A `(0,0)`, B `(1,0)`, C `(0,1)`, point `(0.2,0.3)` has weights `(0.5,0.2,0.3)`. Interpolating red, green, and blue vertex colors with those weights yields `(0.5,0.2,0.3)`. The software lab evaluates this explicitly at sample centers and paints the covered cells.

![Barycentric interpolation inside a triangle](../public/diagrams/rasterization-barycentric.svg)

The denominator in the weight formula is proportional to triangle area. If it is zero, the triangle is degenerate and no stable interior exists. Our helper returns `null`. Real rasterizers also use consistent edge rules, such as a top-left convention, so two adjacent triangles do not double-cover or leave a gap along a shared edge. The educational lab includes boundaries simply; it is not a bit-for-bit hardware rasterizer.

## Perspective-correct interpolation

Interpolating a UV directly in screen space distorts textures when vertex distances differ. Projection divides positions by W, so interpolation must account for the same projective relationship. For screen-space barycentric weights $\lambda_i$, an attribute `a` is reconstructed as

$$
a(p)=\frac{\sum_i\lambda_i a_i/w_i}{\sum_i\lambda_i/w_i}.
$$

When all W values are equal, the factors cancel and ordinary linear interpolation works. When they differ, the correction prevents a receding checkerboard from bending across the diagonal between triangles. GLSL `smooth` interpolation, the default for floating-point varyings, handles this for you. `flat` uses one vertex’s value without interpolation and is useful for discrete labels or face IDs. WGSL has interpolation attributes for the corresponding choices.

## Depth and visibility

A depth buffer stores a depth value per sample. With a conventional `LESS` comparison and a clear depth of 1, a nearer fragment passes and updates the stored value. Drawing opaque meshes in a different order should then preserve visibility, assuming matching depth state. Without the depth test, the last drawn triangle can cover a nearer triangle.

Transparent objects complicate this because the color depends on what lies behind them. They commonly depth-test against opaque geometry but avoid writing depth, and are drawn back to front. Object-level sorting cannot solve every case of intersecting translucent triangles. We return to alternatives in production rendering.

## Culling and aliasing

Face culling skips triangles whose projected winding identifies them as back-facing. It saves work and matches closed solid surfaces, but hides thin surfaces if their intended visible side is opposite. Antialiasing addresses the sampling of sharp edges. More geometry does not by itself fix stair-step silhouettes when the final image is undersampled.

**Optional application:** move the rasterizer’s sample outside the triangle and observe a negative weight. This gives a geometric interpretation to a value that might otherwise seem like an error. Then inspect how the raw cube uses a depth buffer to resolve triangles covering the same sample.
