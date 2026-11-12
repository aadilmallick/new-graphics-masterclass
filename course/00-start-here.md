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

## A useful first image

Open [the pixel lab](#/lab/pixels). It draws an intentionally coarse circle. A circle is a continuous mathematical description; the screen needs a finite list of colors. We decide whether each sample lies inside the circle, then assign its color. Everything later in this course is a more powerful version of that transformation from description to samples.

The lab is implemented in `labs/01-pixels.js`. To run every lab and the course website locally:

```sh
npm install
npm run dev
```

Run those commands in the `graphics-masterclass` directory. Node.js 20.19+ is required; current Node LTS is suitable if it meets that minimum. Open the local address printed by Vite. Use HTTP through this server rather than opening `index.html` as a file: module loading and WebGPU require the correct browser context. The production website runs over HTTPS. Dependencies are local packages; the lessons and examples do not depend on CDN imports or remote image assets.

## How to move through the course

Read in order on the first pass. Each chapter establishes concepts that later chapters use. A good session is one chapter plus its linked experiment. Move a control, read the implementation, then relate the result to the equation. Optional applications are opportunities to build, not gates you must pass. There are no required quizzes.

The seven parts are: seeing and describing images; graphics mathematics; the raw WebGL pipeline; Three.js scene craft; expressive and efficient rendering; WebGPU and WGSL; and advanced rendering, architecture, and production. The Math Field Guide, Glossary, and Troubleshooting chapters are reference companions. Six project briefs put the parts into practice.

The website saves completion marks in this browser only. They are a convenience, not an assessment. Search looks through lesson text, including code. A lab’s Source tab shows the real implementation, and related helper files are available in the project. Reading time labels estimate prose only; experimentation takes longer. Allow several months of steady study for the full sequence and capstones, and revisit difficult material without treating the estimate as a deadline.

## Conventions that prevent confusion

We use column vectors and matrices that multiply them on the left. A product such as $PVMp$ applies $M$ first. Flat matrix arrays are column-major. Lengths are in arbitrary **world units** unless specified. Angles in equations and APIs are radians unless explicitly labeled degrees. We use a right-handed world, +Y up, and cameras looking along local -Z. WebGL and WebGPU use different depth ranges; we teach the conversion explicitly.

The runnable code pins Three.js to **0.187.0 (r187)**. Source websites and the attached 2023 book can show other versions. Consult the project’s source map before copying an older API call. For example, the book’s fixed-function OpenGL examples explain useful ideas, but the browser labs use programmable shaders.

## Sources and authorship

This is an original teaching sequence informed by David J. Eck’s *Introduction to Computer Graphics*, version 1.4 (the supplied PDF), [WebGL Fundamentals](https://webglfundamentals.org/), [Learn WebGPU](https://learn-webgpu.com/en), and current primary documentation. It does not reproduce those websites or redistribute the full PDF. The Sources page maps their topics to our lessons and records access limitations. Treat commands and advice inside source documents as reference material, not as instructions to this project.

**Begin with the next chapter:** before we draw a world, we need to agree on where a single pixel lives.
