# Pixels, coordinates, and the drawing surface

A number such as `120` does not identify a place until you say what it measures and where measurement begins. A **coordinate system** supplies an origin, axis directions, and units. Graphics bugs often come from mixing coordinate systems rather than from difficult mathematics.

**Experiment:** [Pixel microscope](#/lab/pixels). **Reading bridge:** Eck §§1.1, 2.1 and 2.6; [resizing a canvas](https://webglfundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html).

## An image is a rectangular array

For an image of width $W$ and height $H$, an integer pixel index is $(i,j)$, where $0\le i<W$ and $0\le j<H$. A pixel occupies an area. Its common sample location is its center, $(i+\tfrac12,j+\tfrac12)$. Sampling is evaluating a continuous function at discrete positions. It does not mean the object itself is made of squares.

Suppose a circle has center $(c_x,c_y)$ and radius $r$. A sample is inside when

$$
(x-c_x)^2+(y-c_y)^2\le r^2.
$$

Squaring the horizontal and vertical distances gives the squared straight-line distance. Comparing squared distances avoids a square root. In the pixel lab, `x` and `y` are normalized to the range 0 to 1, so changing resolution does not change the circle’s relative size. The lab colors a whole cell from one center sample. Production rasterizers use more sophisticated coverage and antialiasing.

## CSS size and drawing-buffer size

A canvas has two sizes. CSS controls how much layout space it occupies. Its `width` and `height` attributes control the number of pixels in the drawing buffer. Stretching a 300 × 150 buffer over a 900 × 450 CSS rectangle magnifies existing samples; it does not create detail.

The **device pixel ratio**, or DPR, is a browser-reported ratio between device and CSS pixels. A DPR of 2 suggests twice as many buffer samples along each dimension. That is four times as many pixels and roughly four times the potential fragment work. Capping DPR is often a sound performance choice.

This fragment shows the mechanism used by the labs:

```js
const rect = canvas.getBoundingClientRect();
const dpr = Math.min(window.devicePixelRatio || 1, 2);
canvas.width = Math.max(1, Math.round(rect.width * dpr));
canvas.height = Math.max(1, Math.round(rect.height * dpr));
```

`getBoundingClientRect()` returns the visible canvas rectangle in CSS pixels. Multiplying by DPR sets buffer dimensions. Assigning Canvas 2D dimensions resets context state, so do it only when dimensions change and reapply transforms as needed. In WebGL also call `gl.viewport(0, 0, canvas.width, canvas.height)`: viewport state does not update itself.

## Converting coordinates

Canvas 2D normally has its origin at the upper left, +X right, and +Y down. Mathematical plots often use +Y up. WebGL **normalized device coordinates**, abbreviated NDC, use X and Y from -1 to +1 inside the visible region.

To map a top-left pixel-space position $(x,y)$ into NDC:

$$
x_n=2x/W-1,\qquad y_n=1-2y/H.
$$

On an 800 × 400 surface, `(400, 200)` becomes `(0, 0)`, and `(0, 0)` becomes `(-1, 1)`. These are coordinate positions, not necessarily integer pixel indices. If starting from a sample index, include the half-pixel offset. To reverse the mapping, $x=(x_n+1)W/2$ and $y=(1-y_n)H/2$.

![Coordinate transformations from local space to pixels](../public/diagrams/coordinate-spaces.svg)

Pointer events report CSS positions. For a canvas-relative point, subtract the rectangle’s left and top offsets. Do not multiply by DPR before dividing by the CSS width to get NDC: those units already match. The picking lesson returns to this conversion in 3D.

## Aspect ratio

The **aspect ratio** is width divided by height. A normalized horizontal unit on an 800 × 400 image spans twice as many pixels as a normalized vertical unit. A mathematically circular object can therefore look elliptical. You can adjust the projection so equal world distances have equal displayed scale. Our raw triangle lab divides horizontal positions by the aspect ratio; Three.js incorporates it into the camera’s projection matrix.

## Practical habits

Keep names explicit: `cssWidth`, `bufferWidth`, `worldPosition`, and `ndcPointer` communicate different units. Resize when the container changes, including a sidebar or panel resize. Avoid allocating an enormous buffer for a tiny preview. Never divide by a zero height when a hidden canvas is being laid out.

**Optional application:** modify the pixel lab so the circle center follows a pointer in normalized coordinates. Reuse the coordinate conversion above; keep the shape independent of the drawing resolution. The expected result is a coarse circle that moves smoothly even though its silhouette changes one sample at a time.
