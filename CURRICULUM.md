# Complete curriculum index

Read the numbered core lessons in order. The website provides the same material with rendered math and connected experiments. Only JavaScript programming is assumed.

## 1. The first pixel

Seeing, sampling, and drawing.

- [00 — From a JavaScript program to a visible world](course/00-start-here.md) · Lab: Pixel microscope
- [01 — Pixels, coordinates, and the drawing surface](course/01-pixels-coordinates.md) · Lab: Pixel microscope
- [02 — Color, alpha, and the meaning of brightness](course/02-color-compositing.md)
- [03 — Drawing with Canvas and SVG](course/03-canvas-svg-paths.md) · Lab: Pixel microscope

## 2. The language of space

Math you can see and use.

- [04 — The small language of graphics mathematics](course/04-math-language.md)
- [05 — Vectors: directions, distances, and orientation](course/05-vectors.md) · Lab: Vector workbench
- [06 — Angles, circles, and oscillation](course/06-trigonometry.md) · Lab: Vector workbench
- [07 — Matrices as coordinate machines](course/07-matrices-2d.md) · Lab: Transform playground
- [08 — 3D transforms and coordinate frames](course/08-3d-coordinate-frames.md) · Lab: An orbit inside an orbit
- [09 — Cameras, perspective, and clipping](course/09-cameras-projection.md) · Lab: Depth & perspective
- [10 — From triangles to fragments](course/10-triangles-rasterization.md) · Lab: Triangle microscope

## 3. Inside the GPU

Build a renderer with WebGL 2.

- [11 — The GPU and the programmable pipeline](course/11-gpu-pipeline.md) · Lab: The first GPU triangle
- [12 — Your first complete WebGL 2 program](course/12-first-webgl-triangle.md) · Lab: The first GPU triangle
- [13 — Thinking in GLSL](course/13-glsl.md) · Lab: The first GPU triangle
- [14 — Buffers, vertex arrays, meshes, and state](course/14-buffers-state-meshes.md) · Lab: Depth & perspective
- [15 — Textures and sampling](course/15-textures-sampling.md) · Lab: The sampling room
- [16 — Lighting and the geometry of normals](course/16-lighting-normals.md) · Lab: Depth & perspective
- [17 — Framebuffers, filters, and shadows](course/17-framebuffers-shadows.md) · Lab: Two-pass image lab
- [18 — Organizing and extending a WebGL renderer](course/18-advanced-webgl.md) · Lab: Two-pass image lab

## 4. Building worlds

Three.js from scene to interaction.

- [19 — Your first Three.js scene](course/19-threejs-scene.md) · Lab: Material studio
- [20 — Geometry, curves, and surface derivatives](course/20-geometry-curves.md) · Lab: An ocean of equations
- [21 — Materials and physically based shading](course/21-pbr-materials.md) · Lab: Material studio
- [22 — Lighting a scene with intent](course/22-environments-shadows.md) · Lab: Material studio
- [23 — Models, textures, and the asset pipeline](course/23-assets-gltf.md) · Lab: An orbit inside an orbit
- [24 — Time, animation, and quaternions](course/24-animation-quaternions.md) · Lab: An orbit inside an orbit
- [25 — Interaction, picking, and accessible controls](course/25-interaction-picking.md) · Lab: Point into the world

## 5. Craft & performance

Expressive scenes that run well.

- [26 — Custom shaders and procedural surfaces](course/26-custom-shaders.md) · Lab: An ocean of equations
- [27 — Particles, instancing, and data-driven worlds](course/27-particles-instancing.md) · Lab: A city in one mesh
- [28 — Post-processing and color pipelines](course/28-post-processing.md) · Lab: Light after the lens
- [29 — Performance by measurement](course/29-performance.md) · Lab: A city in one mesh
- [30 — Art direction: a complete scene study](course/30-art-direction.md) · Lab: Material studio

## 6. The next pipeline

WebGPU, WGSL, and compute.

- [31 — WebGPU: explicit resources and commands](course/31-webgpu-foundations.md) · Lab: A new kind of pipeline
- [32 — WGSL, bindings, and memory layout](course/32-wgsl-memory.md) · Lab: A new kind of pipeline
- [33 — 3D rendering and textures in WebGPU](course/33-webgpu-rendering.md) · Lab: A textured WebGPU world
- [34 — Compute shaders and readback](course/34-compute.md) · Lab: Numbers on the GPU
- [35 — A compute-to-render particle system](course/35-compute-particles.md) · Lab: 8,192 moving particles
- [36 — Three.js WebGPU and TSL](course/36-threejs-webgpu-tsl.md) · Lab: Shaders in JavaScript

## 7. Beyond the frame

Rendering, architecture, and capstones.

- [37 — Rays, distance fields, and path tracing](course/37-rays-paths.md) · Lab: A ray for every sample
- [38 — Designing a small graphics engine](course/38-engine-architecture.md)
- [39 — Production and the capstone sequence](course/39-production-capstones.md) · Lab: 8,192 moving particles

## Keep close

- [Math field guide](course/math-field-guide.md)
- [Graphics glossary](course/glossary.md)
- [Debugging field guide](course/troubleshooting.md)
- [Sources & coverage map](course/sources.md)
- [Technique atlas](course/technique-atlas.md)

## Project studio

- [Project 1 — Mathematics explorer](projects/01-math-explorer.md)
- [Project 2 — Raw WebGL renderer](projects/02-raw-renderer.md)
- [Project 3 — Three.js studio](projects/03-threejs-studio.md)
- [Project 4 — Procedural environment](projects/04-procedural-environment.md)
- [Project 5 — WebGPU simulation](projects/05-webgpu-simulation.md)
- [Project 6 — Personal exhibition](projects/06-final-world.md)

## Runnable source studies

- [Pixel microscope](labs/01-pixels.js) — Canvas 2D. Watch a continuous circle become a finite grid of samples.
- [Vector workbench](labs/02-vectors.js) — Math. See dot products, direction, and projection change together.
- [Transform playground](labs/03-transforms.js) — Math. Swap matrix order and see why a rotation changes everything.
- [Triangle microscope](labs/04-rasterizer.js) — Software renderer. Color a triangle sample by sample with barycentric weights.
- [The first GPU triangle](labs/05-webgl-triangle.js) — WebGL 2. Buffers, shaders, uniforms, and a single draw call.
- [Depth & perspective](labs/06-webgl-cube.js) — WebGL 2. A lit, indexed cube built without a 3D engine.
- [The sampling room](labs/07-texture.js) — WebGL 2. Compare nearest, bilinear, and mipmapped filtering.
- [Two-pass image lab](labs/08-framebuffer.js) — WebGL 2. Render into a texture, then filter its neighboring samples.
- [Material studio](labs/09-material-studio.js) — Three.js. Sculpt reflections with roughness, metalness, light, and exposure.
- [An orbit inside an orbit](labs/10-scene-graph.js) — Three.js. Make local and world coordinates visible with a tiny solar system.
- [An ocean of equations](labs/11-shader-ocean.js) — GLSL + Three.js. Move vertices with waves and derive their surface normals.
- [A city in one mesh](labs/12-instancing.js) — Three.js. Explore 900 instances sharing geometry and material.
- [Point into the world](labs/13-picking.js) — Three.js. Turn a pointer location into a ray and select a crystal.
- [Light after the lens](labs/14-post-processing.js) — Three.js. Build a bloom chain with a correct final output transform.
- [A ray for every sample](labs/15-ray-tracing.js) — CPU renderer. Trace primary rays and shadow rays through an analytic scene.
- [A new kind of pipeline](labs/16-webgpu-triangle.js) — Native WebGPU. Render with WGSL, a uniform buffer, and explicit commands.
- [Numbers on the GPU](labs/17-webgpu-compute.js) — Native WebGPU. Dispatch a compute shader and read the actual result back.
- [8,192 moving particles](labs/18-webgpu-particles.js) — Native WebGPU. Compute a simulation and render directly from its storage buffers.
- [Shaders in JavaScript](labs/19-three-tsl.js) — Three.js + TSL. Describe a procedural material as a portable shader graph.
- [A textured WebGPU world](labs/20-webgpu-cube.js) — Native WebGPU. Combine an indexed mesh, matrices, a texture, a sampler, and depth.
- [Sculpting a distance field](labs/21-ray-marching.js) — WebGL 2. Find smooth analytic shapes by marching a ray through space.

Lab modules run inside this Vite project and import their included helpers. See [README](README.md) for setup, validation, and source provenance.
