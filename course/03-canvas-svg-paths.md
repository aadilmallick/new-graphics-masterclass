# Drawing with Canvas and SVG

Before programming triangles directly, it helps to draw with a higher-level 2D interface. Canvas and SVG also remain useful in 3D projects: Canvas can generate textures, SVG can explain a scene, and ordinary HTML can provide crisp, accessible labels above a GPU canvas.

**Implementation connection:** the first four labs use Canvas 2D; every course diagram is a standalone SVG. **Reading bridge:** Eck §§2.2, 2.4, 2.6, 2.7.

## The page, the element, and the drawing context

A JavaScript program normally manipulates values, objects, and functions. A browser page adds a document: a tree of elements such as headings, buttons, and canvases. The expression `document.querySelector('#picture')` searches that tree for an element whose `id` is `picture`. It returns the element, not a drawing interface. Calling `getContext('2d')` on a canvas requests the Canvas 2D interface associated with that particular drawing surface.

The distinction is useful because the element participates in layout while the context performs drawing. CSS can give the element a border or a displayed width. Context methods can draw a line or change the current fill. A reference called `canvas` and a reference called `ctx` therefore have different responsibilities even though they belong to one visible component.

The HTML example earlier puts the script after the canvas element. At that moment the browser has already created the element, so the selector can find it. If the script ran before the element existed, the selector could return `null`, and the next method call would fail. A module script placed in the head is normally deferred, but understanding when elements exist is more reliable than treating a selector as a magic global lookup.

If the context cannot be created, handle that result before using it. Our `canvas2D` helper creates a canvas, attaches a descriptive label, requests a context, and throws a useful error if it is unavailable. It returns both references because a lab needs layout dimensions from the element and drawing operations from the context.

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

## Follow the first drawing in execution order

The browser starts with an empty drawing surface. Setting `ctx.fillStyle` changes a piece of context state; it does not paint anything by itself. `fillRect(0,0,640,360)` reads that state and paints the specified rectangle. The first two arguments place its corner, and the next two give width and height. These are drawing coordinates, which initially correspond directly to drawing-buffer units.

Next, `beginPath` starts a fresh collection of path segments. `arc(320,180,70,0,Math.PI*2)` appends a full circular arc. Its center is halfway across and down the 640 × 360 buffer, and its radius is 70 drawing units. `fill()` then reads the current fill style and paints the path's interior. Changing the fill style between appending the path and filling it changes the result because the style is used when the drawing operation occurs.

A stroke is a different operation. It paints a band along the path according to `lineWidth`, `lineCap`, `lineJoin`, and `strokeStyle`. A filled circle with a stroke can therefore occupy a slightly larger visible region than its radius alone suggests: a typical centered stroke extends half its width on either side of the mathematical outline. This matters when aligning crisp UI shapes or choosing a collision proxy.

Canvas state persists. If you set a thick line width for one object and forget to change or restore it, the next object's stroke is thick too. This is not a bug in the next object; it is an unrecorded dependency on previous commands. Saving and restoring state around reusable drawings helps each drawing establish a clear contract.

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

## Construct a path from named points

A path can have several subpaths. `moveTo` begins a subpath without painting a connecting segment. Subsequent `lineTo` calls add edges. `closePath` adds the final connection back to that subpath's start. It does not automatically fill or stroke. Keeping path construction and painting separate lets the same path receive several treatments.

This complete console example creates and displays a canvas with an outlined filled triangle:

```js
const surface = document.createElement('canvas');
surface.width = 400;
surface.height = 300;
document.body.append(surface);
const pen = surface.getContext('2d');
pen.fillStyle = '#0d1721';
pen.fillRect(0, 0, 400, 300);
pen.beginPath();
pen.moveTo(80, 230);
pen.lineTo(200, 60);
pen.lineTo(320, 230);
pen.closePath();
pen.fillStyle = '#82ebcc';
pen.strokeStyle = '#e2fff5';
pen.lineWidth = 4;
pen.fill();
pen.stroke();
```

The three named locations could equally be stored in an array and traversed in a loop, as in the transform lab. The order of points defines the outline. Crossing edges produces a self-intersecting path, whose filled region depends on the fill rule. The default nonzero winding rule and the alternative even-odd rule make different decisions for some overlapping subpaths. This is a geometric definition, not simply a request to color every enclosed-looking region.

For a shape with a hole, the even-odd rule is often easy to reason about: crossing each boundary toggles inside/outside status. With the nonzero rule, subpath direction matters. When a hole unexpectedly fills, inspect both the rule and path orientation before assuming the browser ignored one contour.

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

## A reusable wheel and a bicycle hierarchy

Now consider a wheel drawn around its own origin. Its rim is centered at `(0,0)`, and spoke endpoints are defined relative to that center. The function does not decide where the bicycle is in the scene. That separation makes the same wheel drawing reusable for the front and back wheel.

The following is a complete browser-console example. It uses rotation angles already introduced as full-turn fractions; the trigonometry chapter will derive the circle relationships more deeply.

```js
const bikeCanvas = document.createElement('canvas');
bikeCanvas.width = 640;
bikeCanvas.height = 360;
document.body.append(bikeCanvas);
const bikePen = bikeCanvas.getContext('2d');
function wheel(pen, radius) {
  pen.beginPath();
  pen.arc(0, 0, radius, 0, Math.PI * 2);
  pen.stroke();
  for (let spoke = 0; spoke < 8; spoke++) {
    const angle = spoke * Math.PI * 2 / 8;
    pen.beginPath();
    pen.moveTo(0, 0);
    pen.lineTo(radius * Math.cos(angle), radius * Math.sin(angle));
    pen.stroke();
  }
}
bikePen.fillStyle = '#0d1721';
bikePen.fillRect(0, 0, 640, 360);
bikePen.strokeStyle = '#82ebcc';
bikePen.lineWidth = 3;
for (const centerX of [200, 440]) {
  bikePen.save();
  bikePen.translate(centerX, 240);
  wheel(bikePen, 65);
  bikePen.restore();
}
```

Each iteration saves the parent's state, translates the local origin to one wheel center, draws the wheel in that local frame, and restores the parent's state. The second wheel does not inherit the first wheel's translation. Without restore, translations accumulate: moving 200 units and then another 440 units would place the second origin at 640, not 440.

The important abstraction is not the wheel's appearance. It is the division between local geometry and placement. A robot hand can be drawn locally and placed relative to a forearm; a forearm can be placed relative to an upper arm. Three.js scene graphs implement this same idea with stored objects instead of immediate context calls.

## Why the order of transform calls changes a drawing

Suppose a local point is one unit right of its origin. Scaling by two makes it two units away. Rotating a quarter turn moves it along the positive local Y direction in a mathematical Y-up frame. Translating then moves the entire result. Reversing translation and rotation changes whether the translation itself rotates around the parent origin.

Canvas transform calls concatenate the current transform with the new operation. With the column-vector convention used later, calling translate, rotate, then scale constructs a product that applies scale first to a local point, then rotation, then translation. This can seem reversed if you imagine each command moving already-painted pixels. The commands instead modify the coordinate mapping used by future drawing operations.

Painted pixels do not retain this history. Changing the transform after drawing a wheel does not move that wheel. You must clear and redraw with the new mapping. This is one of the clearest ways to distinguish Canvas immediate drawing from SVG retained descriptions.

`save` and `restore` recover state but not the current path's geometry or previously painted image. To isolate paths, use `beginPath`. To isolate appearance and transforms, use state saves. To restore a previous image, redraw it or maintain another image resource. These are three separate kinds of information with separate lifetimes.

## SVG groups retain the relationship

An SVG `<g>` element groups children. Giving a group a transform places all its child shapes in a shared frame. A nested group therefore represents an explicit hierarchy. You can inspect that hierarchy in browser developer tools, attach events to a logical object, or change its transform later.

A wheel group can contain a circle and spoke paths. Two copies can be positioned with separate transforms, or a reusable definition can be referenced where appropriate. The browser retains the shape descriptions, so changing one group's translation requests a new rendering of its children in the new location. You do not manually clear the old wheel's pixels.

This retained structure has costs as well as benefits. Thousands of individually animated DOM nodes can become expensive to manage. A Canvas loop may be simpler for dense changing plots, and a GPU representation may be appropriate for much larger regular workloads. Choose based on the operations and accessibility requirements rather than assuming the more editable representation is always faster.

## Clipping changes where drawing is allowed

A clip restricts future drawing to a region. In Canvas, construct a path and call `clip`; subsequent paints affect only the intersection of that region with the existing clip. Use save and restore to keep a temporary clip from constraining unrelated drawings. A clip does not cut geometry out of a stored mesh; it changes the allowed painting region.

In SVG, a clipping path can be referenced by an element or group. A mask is different: it can vary visibility continuously according to its values, while a clip primarily defines the permitted region. These mechanisms are useful for picture frames, reveal effects, and diagrams that need a viewport-like window.

For a moving plot inside a panel, keep the panel's axes and labels outside the clip, then clip only the data marks. Otherwise the same clipping rule that correctly hides out-of-range points can cut off labels or strokes. This is another reason to organize a drawing into conceptual layers rather than one unstructured command list.

## A drawing's order is part of its meaning

A later opaque paint can cover an earlier one. Two overlapping circles drawn in opposite orders can therefore produce different images even when their paths and styles are individually unchanged. SVG also has a document painting order, while Canvas uses command order. Treat that ordering as a composition policy: background, structure, foreground emphasis, and labels form distinct layers.

A useful reusable drawing function should not clear the entire canvas or reset unrelated global state unexpectedly. Its caller owns the frame and decides the layer position. This small interface discipline makes a diagram grow predictably from one object into many.

## Redrawing an animated frame coherently

A simple animation computes all visible state from time, clears once, and draws layers back to front. The background comes first, then distant shapes, then foreground shapes, then labels. Clearing halfway through a reusable object function would erase earlier objects and make composition order unexpectedly destructive.

If a context has a world transform active, resetting to identity before clearing makes the clear rectangle easy to reason about. After clearing, establish the intended drawing transform and styles again. Resizing the canvas buffer also resets context state, so a renderer that resizes conditionally must reestablish its setup on the next draw.

The course's first four labs follow a small ownership pattern: mount creates a surface and controls, an animation helper repeatedly invokes the drawing function, and cleanup stops the helper. You can copy that architecture for another educational diagram without importing a 3D renderer. Its strength comes from making drawing, layout, controls, and lifetime distinct, ordinary JavaScript responsibilities.

## Choosing a tool

SVG suits a moderate number of editable shapes, diagrams, icons, and labels. Canvas suits many frequently redrawn 2D marks. WebGL and WebGPU suit substantial parallel rendering or computation. HTML is often best for buttons and readable text. A polished graphics application can use all four.

For accessibility, provide a useful image description and expose interactive controls as actual HTML elements. If a chart conveys numbers, offer a text or table representation. A canvas alone does not give screen readers a scene graph.

**Optional application:** draw a two-link robot arm with Canvas state saves, then recreate it as nested SVG groups. Both representations should share the same local origin and rotation angles. This previews hierarchical modeling without introducing 3D yet.
