# Graphics Atelier

A first-principles web graphics masterclass for JavaScript programmers: **40 sequenced lessons, 5 reference chapters, 6 project briefs, 21 interactive labs, and 10 original SVG diagrams**. Math is introduced before it is used. Lessons include LaTeX equations, numerical examples, explained code, practical mistakes, and optional applications.

The curriculum moves from pixels and Canvas/SVG through vectors, trigonometry, matrices, cameras, rasterization, WebGL 2, Three.js, PBR, shaders, performance, native WebGPU/WGSL, compute, TSL, ray-based rendering, and engine architecture. The website presents the same Markdown files with rendered math, source inspection, search, and browser-local completion marks.

The expanded textbook edition develops concepts through motivation, definitions, worked arithmetic, derivations, explained code, and practical diagnosis. Read the prose and worked examples in order before exploring the full lab. The reference chapters remain compact lookup companions. Run `node scripts/chapter-depth.mjs` for chapter-level reading statistics; these measure length, not an assessment of learning.

## Start locally

Install Node.js 20.19+ or a compatible current LTS, then run these commands in this folder:

```sh
npm install
npm run dev
```

Open the printed localhost address. On Windows PowerShell, use `npm.cmd` instead of `npm` if local script policy blocks `npm.ps1`. Serve through HTTP rather than opening HTML as a file. Native WebGPU needs HTTPS or localhost and compatible hardware/browser settings. Each native lab checks support and shows a readable message. Three.js’s TSL lab uses its separate fallback-capable WebGPU renderer.

## Read in order

| Part | Lessons | Focus |
| --- | --- | --- |
| 1 | 00–03 | Pixels, coordinates, color, Canvas, SVG |
| 2 | 04–10 | Mathematical notation, vectors, trig, matrices, frames, cameras, triangles |
| 3 | 11–18 | GPU model, complete WebGL triangle, GLSL, buffers, textures, lighting, targets, renderer patterns |
| 4 | 19–25 | Three.js, geometry/calculus, PBR, lighting, assets, animation, interaction |
| 5 | 26–30 | Custom shaders, instancing, post-processing, measurement, art direction |
| 6 | 31–36 | WebGPU, WGSL layouts, textured 3D, compute, simulation, TSL |
| 7 | 37–39 | Rays/SDF/path tracing, engine architecture, production capstones |

Start with [the orientation](course/00-start-here.md) or browse the [complete linked curriculum](CURRICULUM.md). The [Math Field Guide](course/math-field-guide.md), [Glossary](course/glossary.md), [Debugging Guide](course/troubleshooting.md), [Technique Atlas](course/technique-atlas.md), and [Sources](course/sources.md) are companion references. The website navigation lists every lesson; files are numbered for ordinary Markdown readers too.

The project briefs in `projects/` identify complete working reference labs and distinguish optional learner integrations from already implemented features. Reading estimates in the website cover prose, not practice time. Expect sustained study and repetition; there is no required quiz sequence.

## What runs

| Area | Complete interactive implementations |
| --- | --- |
| Canvas/math | Pixel sampling, dot/projection, transform order, barycentric rasterization |
| Raw WebGL 2 | Colored triangle, indexed lit cube, texture filtering/mips, two-pass filters, SDF ray marching |
| Three.js | Material studio, orbit hierarchy, analytic wave normals, 900-instance city, picking, HDR bloom |
| Ray rendering | CPU ray-sphere intersection, diffuse shading, hard shadow rays |
| Native WebGPU | Uniform-driven triangle, compute/readback, 8,192-particle compute/render loop, textured indexed cube |
| Three.js WebGPU | TSL node-material stripes |

Labs are numbered modules exporting `mount(host, panel)` and a cleanup function (some mounts are async). They run inside this project, using shared helper modules. The Source tab shows actual files. Tutorial snippets are intentionally isolated fragments unless explicitly described as standalone. There are no required remote image/model downloads; the asset-loading chapter explains how to add your own licensed assets.

## Validate and build

```sh
npm run check
npm test
npm run build
npm run preview
```

`check` validates curriculum files, internal lab links, diagram paths, and KaTeX expressions. Tests validate math conventions against known geometric outcomes. Vite builds a static site in `dist/`; hash routing works on ordinary static hosting. All runtime libraries are bundled locally, including math fonts. After a production build, serving `dist` does not require a CDN.

`research/content-stats.json` records actual content counts. `research/QA.md` records verification and hardware-specific limitations. User interaction is stored only in this browser’s local storage; there is no account backend, telemetry, or shared completion database.

## Project structure

```text
course/              40 core Markdown lessons + 5 references
projects/            6 capstone briefs with working reference links
labs/                21 runnable studies + shared helpers
public/diagrams/     10 standalone accessible SVGs
src/                 Website, catalog, Markdown/math rendering
tests/               Numerical geometry and projection checks
scripts/             Content checks and SVG verification utilities
research/            Source audit, QA, content metrics
vendor/svg-creator/  Requested SVG skill and its Apache license
dist/                Generated deployable static website
```

The locally extracted full textbook is a research aid only. It is ignored by Git and excluded from the learner archive and deployment. The supplied PDF itself is not redistributed.

## Sources and version policy

Primary teaching references are David J. Eck’s *Introduction to Computer Graphics*, version 1.4 (August 2023, supplied PDF), [WebGL Fundamentals](https://webglfundamentals.org/), and [Learn WebGPU](https://learn-webgpu.com/en/tutorial). Current API details were checked against official Three.js, WebGPU, and WGSL references. The exact source coverage and access limitations are in [Sources](course/sources.md) and `research/source-audit.json`. This is original teaching material, not a copy of the source websites.

Three.js is pinned to **0.187.0/r187**, with matching addons from that package. Older textbook code uses r154 and fixed-function OpenGL in some chapters; the course explains the transferable concepts with current JavaScript APIs. The requested [SVG Creator skill](https://github.com/upbrew-tech/svg-creator-skill) was used with a portable render/view/fix verification loop; its provenance and diagram verification notes are included.

Third-party libraries, the textbook, and the SVG skill retain their own licenses. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). No GitHub repository was created or modified by this work; the project source is ready for version control if you choose to publish it later.
