# Project 1 — A mathematics explorer

**Prerequisites:** lessons 00–10. **Working references:** labs 01–04. **Goal:** turn the vector and transformation ideas into a small explanatory instrument.

## Build sequence

Start with the vector lab and retain its dot-product and projection display. Add independent X/Y controls for both vectors. Use the tested `dot`, `length`, `normalize`, and `barycentric` helpers. Show a useful message for a zero-length direction rather than dividing by zero.

Add a second panel using the transform-order lab. Keep the original polygon faintly visible, expose scale/rotation/translation, and state the exact product next to the result. Add a selectable pivot using `T(pivot) * R * T(-pivot)`.

Finally, put the triangle rasterizer beside the numeric weights. A selected sample should have weights summing to one; a point outside can have a negative weight. Keep pixel sample coordinates separate from normalized coordinates.

## Reference solution and explanation

The supplied labs are complete reference implementations of each individual instrument. `02-vectors.js` projects onto a normalized axis, `03-transforms.js` shows noncommutativity, and `04-rasterizer.js` evaluates barycentric samples directly. Combining their panels is optional application work; no unavailable helper is assumed.

## Finish criteria

The tool works by pointer and keyboard, shows units, handles degenerate inputs, and resizes without changing the represented math. Include an SVG explanation using the supplied diagrams. Test known values: perpendicular unit vectors dot to zero, a 90° rotation maps `(1,0)` to `(0,1)`, and triangle vertices have unit barycentric weights.

## Extension

Add 3D basis visualization or a normal-transform comparison. Keep the original simple experiment available so the advanced view does not hide the core relationship.
