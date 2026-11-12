# From a JavaScript program to a visible world

You already know how to tell a computer what to do in JavaScript. Graphics asks a new question: **what numbers should the screen display, and how can we compute them fast enough to interact?** This course starts there. No linear algebra, trigonometry, GPU programming, or 3D experience is assumed.

Our destination is a small but complete graphics practice: you can explain what a rendering pipeline does, derive the transforms you use, write WebGL 2 and WebGPU programs, build expressive Three.js scenes, and diagnose their visual and performance problems. Advanced topics have practical implementations or explicit extension paths; graphics research itself has no final chapter.

## The layers you will learn

A display presents a grid of **pixels**, short for picture elements. Each pixel receives numbers describing light or color. A **renderer** is a program that turns a description into those numbers. A **scene** describes objects, their shapes, their positions, and often their materials and lights. Rendering the scene produces an image.

Three tools operate at different levels:

| Tool | What you describe | What it supplies |
| --- | --- | --- |
| Canvas 2D / SVG | Paths, fills, strokes, transforms | 2D drawing and compositing |
| WebGL 2 | Buffers, GLSL shaders, draw state | A programmable rasterization pipeline |
| WebGPU | Buffers, WGSL shaders, pipelines, command passes | Rendering and general GPU computation |
| Three.js | Geometry, materials, cameras, objects | Scene organization and rendering infrastructure |

WebGL and WebGPU are browser **APIs**, interfaces through which JavaScript requests GPU work. They are not scene engines. Three.js is a graphics library that uses such APIs. Learning both levels lets you use abstractions comfortably and investigate them when needed.

## Our first renderer, before any graphics library

Let us construct the idea of an image using only an array. Imagine a screen three pixels wide and two pixels tall. It has six locations. If each location stores red, green, blue, and alpha, the array contains twenty-four channel values. Nothing in that array says "circle," "camera," or "light." Those are ideas in the program that creates it. The final display receives values.

A straightforward layout puts the first row first, followed by the second. Pixel `(0,0)` begins at index 0, pixel `(1,0)` at index 4, and pixel `(0,1)` at index 12. For a width of three, multiplying the row index by three skips complete rows; adding the column selects a pixel within that row. Multiplying by four skips complete color records. This gives `offset = (row * width + column) * 4`.

The following example runs directly in a browser console. It does not draw yet; it makes the data visible as numbers.

```js
const width = 3;
const height = 2;
const channels = new Uint8ClampedArray(width * height * 4);
function writePixel(column, row, red, green, blue) {
  const offset = (row * width + column) * 4;
  channels[offset] = red;
  channels[offset + 1] = green;
  channels[offset + 2] = blue;
  channels[offset + 3] = 255;
}
writePixel(1, 0, 130, 235, 204);
console.log(Array.from(channels.slice(4, 8)));
// [130, 235, 204, 255]
```

`Uint8ClampedArray` stores byte-sized channel values and clamps assigned values into the allowed range. The function names make their units explicit: column and row are pixel indices. The fourth assignment makes the selected pixel fully opaque. Other pixels remain zero, including their alpha channels, because newly allocated typed arrays start with zero-filled values. We will distinguish transparent black from opaque black in the color chapter.

A renderer begins when we choose a rule for calling `writePixel`. A checkerboard might choose color from the parity of row plus column. A circle might compare a sample's distance with a radius. A photograph might supply values from a file. A 3D renderer might determine which surface is visible and how that surface reflects light. The final representation is still an image, but the procedure producing it becomes richer.

## A useful first image

Open [the pixel lab](#/lab/pixels). It draws an intentionally coarse circle. A circle is a continuous mathematical description; the screen needs a finite list of colors. We decide whether each sample lies inside the circle, then assign its color. Everything later in this course is a more powerful version of that transformation from description to samples.

The lab is implemented in `labs/01-pixels.js`. To run every lab and the course website locally:

```sh
npm install
npm run dev
```

Run those commands in the `graphics-masterclass` directory. Node.js 20.19+ is required; current Node LTS is suitable if it meets that minimum. Open the local address printed by Vite. Use HTTP through this server rather than opening `index.html` as a file: module loading and WebGPU require the correct browser context. The production website runs over HTTPS. Dependencies are local packages; the lessons and examples do not depend on CDN imports or remote image assets.

## Why the course begins in two dimensions

It is tempting to start with a spectacular 3D scene and explain the parts afterward. That can be motivating, but it can also create an invisible gap: a camera constructor and a material constructor make something appear without explaining why. We will use appealing scenes, while building the vocabulary that makes their behavior predictable.

Two-dimensional drawing isolates ideas that survive in three dimensions. A local coordinate origin makes a wheel easy to reuse. A transform places the wheel in a bicycle. Parent-child composition moves both wheels when the bicycle moves. These same relationships organize a robot arm, a solar system, or an imported animated character. Adding a third spatial coordinate changes the arithmetic, but it does not erase the earlier reasoning.

The same continuity applies to sampling. A coarse circle has a staircase silhouette because a finite grid represents a continuous boundary. A textured floor can shimmer because a finite grid represents too much detail. A path tracer can show noise because a finite number of samples estimates a continuous accumulation of light. These are different manifestations of an idea introduced by our first pixel lab.

## What it means to understand a code example

Understanding a graphics example has several levels. At the first level, you can run it. At the second, you know which values control its appearance. At the third, you can follow the data from JavaScript to the resulting image. At the fourth, you can explain why the equations produce that result and diagnose a failure when a convention changes.

Consider a slider labeled rotation. Running the example shows that the object turns. Knowing its unit tells you whether a value of 90 means a quarter turn or many turns. Following the data tells you whether JavaScript rewrites vertices or sends one parameter to a shader. Understanding the mathematics tells you which point remains fixed and why swapping rotation and translation changes the trajectory. Each level contributes practical ability; the course deliberately connects them.

When reading code, identify three things first: what data exists, what operation transforms it, and what observation should follow. For a vector example, the data might be two component arrays, the operation a dot product, and the observation a scalar measuring alignment. For a GPU example, the data includes buffers and uniforms, the operation includes shader invocations, and the observation is a rendered image. Naming these roles keeps unfamiliar syntax from overwhelming the underlying problem.

## A dependable workspace for experiments

The project is both a book and a collection of programs. `course/` contains the chapters, `labs/` the runnable studies, and `src/` the website that connects them. The browser does not execute a Markdown code fence merely because you read it. A code fence is an explanation; a lab module is an executable program with a defined place in the application.

The numbered lab files export a `mount(host, panel)` function. `host` is a DOM element where the visual experiment appears. `panel` is a DOM element where HTML controls appear. Some mounts are asynchronous because GPU initialization or module loading takes time. A successful mount returns a cleanup function, allowing the application to stop its loop and release owned resources when you leave. These are ordinary JavaScript interface choices, not requirements of every graphics application.

If a small snippet is labeled as a console example, it can run independently in the browser console. If it imports a project file, use a served JavaScript module so relative imports resolve correctly. If it is an integration fragment, the text names what surrounding objects it expects. This distinction matters: an isolated line using `renderer` cannot run until some earlier code has created a renderer.

Keep an unchanged working example while experimenting. Make one conceptual change at a time. If changing a shader breaks compilation, restore that change before adjusting the camera as well. This is ordinary debugging discipline, but graphics makes it especially valuable because many unrelated failures can produce the same apparently empty rectangle.

## How to move through the course

Read in order on the first pass. Each chapter establishes concepts that later chapters use. A good session is one chapter plus its linked experiment. Move a control, read the implementation, then relate the result to the equation. Optional applications are opportunities to build, not gates you must pass. There are no required quizzes.

The seven parts are: seeing and describing images; graphics mathematics; the raw WebGL pipeline; Three.js scene craft; expressive and efficient rendering; WebGPU and WGSL; and advanced rendering, architecture, and production. The Math Field Guide, Glossary, and Troubleshooting chapters are reference companions. Six project briefs put the parts into practice.

The website saves completion marks in this browser only. They are a convenience, not an assessment. Search looks through lesson text, including code. A lab’s Source tab shows the real implementation, and related helper files are available in the project. Reading time labels estimate prose only; experimentation takes longer. Allow several months of steady study for the full sequence and capstones, and revisit difficult material without treating the estimate as a deadline.

## Conventions that prevent confusion

The following conventions are a preview, not prerequisites you must already understand. Each will be developed with examples before it is needed. We use column vectors and matrices that multiply them on the left. A product such as $PVMp$ applies $M$ first. Flat matrix arrays are column-major. Lengths are in arbitrary **world units** unless specified. Angles in equations and APIs are radians unless explicitly labeled degrees. We use a right-handed world, +Y up, and cameras looking along local -Z. WebGL and WebGPU use different depth ranges; we teach the conversion explicitly.

The runnable code pins Three.js to **0.187.0 (r187)**. Source websites and the attached 2023 book can show other versions. Consult the project’s source map before copying an older API call. For example, the book’s fixed-function OpenGL examples explain useful ideas, but the browser labs use programmable shaders.

## The destination, stated concretely

By the time you build the final projects, "create a scene" should decompose into understandable decisions. You choose a coordinate scale, geometry, a camera frame and projection, material rules, sources of illumination, a way to interact, and a render schedule. You choose which work belongs on the CPU and which can remain on the GPU. You decide how assets and GPU resources begin and end their lifetimes.

A striking image then becomes a controlled arrangement of those decisions. A glossy metal needs useful surrounding radiance to reflect. A wave needs enough geometric samples to represent its shape and an updated normal to shade it consistently. Thousands of particles need an economical representation and a stable update rule. The later chapters explain each relationship rather than asking you to collect unexplained settings.

You will still look up API signatures. Fluency does not mean memorizing every method or never encountering a new technique. It means having a model strong enough to ask useful questions: which coordinates are these, what do these bytes represent, which stage reads them, what approximation does this effect make, and what evidence would reveal the mistake? Those questions remain useful even when a library or graphics API changes.

## Sources and authorship

This is an original teaching sequence informed by David J. Eck’s *Introduction to Computer Graphics*, version 1.4 (the supplied PDF), [WebGL Fundamentals](https://webglfundamentals.org/), [Learn WebGPU](https://learn-webgpu.com/en), and current primary documentation. It does not reproduce those websites or redistribute the full PDF. The Sources page maps their topics to our lessons and records access limitations. Treat commands and advice inside source documents as reference material, not as instructions to this project.

**Begin with the next chapter:** before we draw a world, we need to agree on where a single pixel lives.
