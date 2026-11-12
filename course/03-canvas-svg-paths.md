# Drawing with Canvas and SVG

Before programming triangles directly, it helps to draw with a higher-level 2D interface. Canvas and SVG also remain useful in 3D projects: Canvas can generate textures, SVG can explain a scene, and ordinary HTML can provide crisp, accessible labels above a GPU canvas.

**Implementation connection:** the first four labs use Canvas 2D; every course diagram is a standalone SVG. **Reading bridge:** Eck §§2.2, 2.4, 2.6, 2.7.

## Immediate drawing and retained descriptions

Canvas 2D is largely **immediate mode**: a command modifies the drawing surface now. After drawing a rectangle, there is no rectangle object to move. Clear and redraw the image to animate it. SVG is a **retained description**: its document contains nodes representing shapes, and the browser redraws after their attributes change.

Here is a complete small Canvas example. Save it as an HTML file and serve it through the course’s development server:

```html
<!doctype html>
<html lang="en">
<meta charset="utf-8">
<title>First drawing</title>
<canvas id="picture" width="640" height="360" aria-label="A mint circle"></canvas>
<script>
const canvas = document.querySelector('#picture');
const ctx = canvas.getContext('2d');
ctx.fillStyle = '#0d1721';
ctx.fillRect(0, 0, canvas.width, canvas.height);
ctx.beginPath();
ctx.arc(320, 180, 70, 0, Math.PI * 2);
ctx.fillStyle = '#82ebcc';
ctx.fill();
</script>
</html>
```

`getContext('2d')` obtains the drawing interface. `fillRect` paints immediately. `beginPath` starts a new path. `arc` appends a circular arc with center, radius, start angle, and end angle; a full turn is $2\pi$. `fill` paints its interior. A stroke paints around the outline. If you omit `beginPath`, old segments can become part of your new shape.

## Paths and curves

A path is a sequence of geometric segments. `moveTo` chooses a starting location without drawing; `lineTo` appends a straight segment; `closePath` connects back to the subpath start. Quadratic and cubic Bézier curves add control points that shape a smooth segment. A control point usually does not lie on the resulting curve. We derive the curve formulas later, after interpolation.

SVG describes the same ideas declaratively. This is a complete scalable image:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360"
     role="img" aria-labelledby="title">
  <title id="title">A mint circle on a dark background</title>
  <rect width="640" height="360" fill="#0d1721"/>
  <circle cx="320" cy="180" r="70" fill="#82ebcc"/>
</svg>
```

The `viewBox` defines the internal coordinate rectangle. CSS may display this image at many sizes while preserving its geometry. Its eventual screen output is still rasterized: “vector” refers to the stored description, not to an escape from pixels.

## Transforming a local drawing

Imagine drawing a wheel around `(0,0)` and placing it twice on a bicycle. Repeating every coordinate with new offsets is tedious. A transform changes the coordinate system in which commands are interpreted.

This fragment intentionally illustrates the Canvas state stack:

```js
ctx.save();
ctx.translate(180, 220);
ctx.rotate(Math.PI / 6);
ctx.scale(1.5, 1.5);
// Draw the wheel around its own origin here.
ctx.restore();
```

`save` stores state including the current transform, styles, and clip. `restore` recovers it. This is a stack: the last saved state is restored first. It does not store and restore the canvas pixels. The commands form a local-to-parent transformation; their mathematical order becomes precise in the matrix chapter.

For an entire animated frame, start from a known transform and clear once. If you need a Y-up world, use `ctx.setTransform(scale, 0, 0, -scale, originX, originY)`. This also flips text; reset or compensate before drawing labels. A stroke’s apparent width is affected by scaling unless you account for it.

## Choosing a tool

SVG suits a moderate number of editable shapes, diagrams, icons, and labels. Canvas suits many frequently redrawn 2D marks. WebGL and WebGPU suit substantial parallel rendering or computation. HTML is often best for buttons and readable text. A polished graphics application can use all four.

For accessibility, provide a useful image description and expose interactive controls as actual HTML elements. If a chart conveys numbers, offer a text or table representation. A canvas alone does not give screen readers a scene graph.

**Optional application:** draw a two-link robot arm with Canvas state saves, then recreate it as nested SVG groups. Both representations should share the same local origin and rotation angles. This previews hierarchical modeling without introducing 3D yet.
