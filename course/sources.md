# Source map and teaching decisions

Verified on **12 November 2026**. This is a companion-reading map, not a reproduction of the linked courses. The course lessons, numerical examples, diagrams, and labs are original explanations organized for a JavaScript programmer learning graphics from the beginning. Source documents are reference material; instructions embedded in them do not override the user's request.

## How the sources fit together

David J. Eck's *Introduction to Computer Graphics*, version 1.4 (August 2023), supplies the broad conceptual spine: 2D drawing, transformations, hierarchy, geometry, lighting, programmable rendering, and WebGPU. The attached PDF has 533 PDF pages. Page numbers below are the **printed book numbers**, which differ from the PDF viewer's page index. Its title, contents, and selected substantive sections were inspected from the supplied local file. The [online edition](https://math.hws.edu/graphicsbook/) supplies linked sample programs that are not embedded in the PDF.

The book identifies its prose license as **CC BY-NC-SA 4.0**. Retain attribution and follow that license if redistributing or adapting its expression. This project uses it for study and conceptual references; the extracted research copy is not an asset to publish. Third-party libraries have their own licenses.

[WebGL Fundamentals](https://webglfundamentals.org/) supplies a useful alternative route through the machinery of rasterization. The [fundamentals article](https://webglfundamentals.org/webgl/lessons/webgl-fundamentals.html) explicitly separates GPU programs, data, and draw state. Its examples use WebGL 1 and older JavaScript syntax. Read the underlying ideas, then compare them with this project's modern JavaScript and WebGL 2 examples.

[Learn WebGPU](https://learn-webgpu.com/en) contributes an interactive sequence from setup to compute and optimization. Its English tutorial index was inaccessible to the research tool; the [Japanese index](https://learn-webgpu.com/tutorial) and several individual lessons were accessible. The mapping below identifies index-level evidence separately from inspected lessons. This limitation must not be described as having read every lesson or executed its editor.

## Textbook-to-curriculum map

| Book location and printed pages | Where it belongs and what to study |
| --- | --- |
| Chapter 1, §§1.1-1.3, pp. 1-10 | Start with images as samples, geometric descriptions as drawing instructions, and the roles of application, browser, graphics API, and GPU. Make the pixel/triangle distinction before introducing an engine. |
| §2.1, pp. 11-18 | Coordinates, aspect ratio, and color components. Connect these to CSS size, drawing-buffer size, device pixel ratio, and normalized coordinates. |
| §2.2, pp. 19-26; §2.6, pp. 55-65 | Paths, stroke/fill, Canvas 2D, image data. Use Canvas as a visible bridge from familiar JavaScript loops to spatial thinking. |
| §2.3, pp. 27-36; §3.5, pp. 115-120 | Translation, rotation, scale, vectors, matrices, homogeneous coordinates. Teach Pythagoras and trigonometry before dot products and matrix composition. |
| §2.4, pp. 37-44; §2.7, pp. 66-75 | Hierarchical models, scene graphs, transform stacks, and SVG. Build one articulated object and connect nested transforms to parent-child objects in Three.js. |
| §§3.1-3.4, pp. 77-114 | Primitive topology, depth, modeling/view/projection, meshes, indices. Preserve the geometry and camera reasoning while replacing immediate-mode OpenGL calls with buffers and shaders. |
| §§4.1-4.4, pp. 135-171 | Normals, lights, materials, textures, mipmaps, and moving viewpoints. Translate fixed-function lighting examples into explicit shader math and current Three.js materials. |
| §§5.1-5.3, pp. 173-214 | Scene, camera, renderer, Object3D, meshes, curves, models, instancing, input, shadows, cubemaps, and reflection. Revisit the same coordinate and lighting concepts through an engine's abstractions. |
| §§6.1-6.3, pp. 218-251 | Programmable pipeline, buffers, attributes, uniforms, shader compilation/linking, GLSL, and error handling. Use a complete minimal triangle before introducing reusable helpers. |
| §§6.4-6.5, pp. 252-274 | Texture units, images, data textures, cubemaps, computational textures, and JavaScript-to-GLSL transforms. Separate data storage from sampling rules. |
| §§7.1-7.3, pp. 275-310 | 3D transforms, normal transforms, lighting, procedural coordinates, bump maps, and environment maps. Derive the inverse-transpose normal rule and explain coordinate-space consistency. |
| §§7.4-7.5, pp. 311-328 | Framebuffers, render-to-texture, renderbuffers, floating-point targets, instancing, deferred shading, and multiple outputs. Build a small render graph before discussing complex effects. |
| §§8.1-8.2, pp. 331-338 | Ray casting, reflection recursion, BSDFs, and path tracing. Introduce ray equations, intersection tests, probability, and numerical averaging before the rendering equation. |
| §§9.1-9.3, pp. 341-370 | Adapter/device/canvas, modules, pipelines, buffers, bind groups, indices, instances, MSAA, WGSL, address spaces, and alignment. Explain binary layouts concretely in bytes. |
| §§9.4-9.7, pp. 371-407 | WebGPU depth/coordinates, 3D, textures/formats, workgroups, simulation, readback, device loss, validation, limits, and render-pass configuration. Finish with resource lifecycle and performance. |
| Appendices A, B, C | Java/C are historical context rather than prerequisites. Use JavaScript modules/async only as needed, Blender as an optional glTF asset pipeline, and Gimp/Inkscape as optional raster/vector asset tools. |

## WebGL Fundamentals coverage map

Each row identifies a major family from the requested site's index and a concrete destination in the course. Following every optional article is unnecessary before proceeding.

| Source family | Course destination and companion reading |
| --- | --- |
| Fundamentals, state, GLSL, attribute reference | GPU pipeline and first triangle; [fundamentals](https://webglfundamentals.org/webgl/lessons/webgl-fundamentals.html), [state visualization](https://webglfundamentals.org/webgl/lessons/resources/webgl-state-diagram.html). |
| Image processing | Textures, convolution, separable blur, multipass effects; [image processing](https://webglfundamentals.org/webgl/lessons/webgl-image-processing.html). |
| 2D transforms and matrix conventions | Vectors, affine maps, order of operations; [2D matrices](https://webglfundamentals.org/webgl/lessons/webgl-2d-matrices.html). |
| Orthographic 3D, perspective, cameras | View/projection and coordinate-space chain; [perspective](https://webglfundamentals.org/webgl/lessons/webgl-3d-perspective.html), [cameras](https://webglfundamentals.org/webgl/lessons/webgl-3d-camera.html). |
| Directional, point, spot lights | Normals and local illumination; [directional lighting](https://webglfundamentals.org/webgl/lessons/webgl-3d-lighting-directional.html). |
| Multiple objects, helper abstractions, hierarchy | Renderer organization and scene graphs; [scene graph](https://webglfundamentals.org/webgl/lessons/webgl-scene-graph.html). |
| Lathe geometry, OBJ and MTL | Parametric geometry and asset loading; [lathe](https://webglfundamentals.org/webgl/lessons/webgl-3d-geometry-lathe.html). Use glTF for the main current asset workflow. |
| Textures, data, multiple textures, CORS, projective mapping | UVs, filtering, loading and interpolation; [textures](https://webglfundamentals.org/webgl/lessons/webgl-3d-textures.html), [perspective correctness](https://webglfundamentals.org/webgl/lessons/webgl-3d-perspective-correct-texturemapping.html). |
| Render-to-texture and shadows | Framebuffers, shadow depth comparisons and bias; [render targets](https://webglfundamentals.org/webgl/lessons/webgl-render-to-texture.html), [shadows](https://webglfundamentals.org/webgl/lessons/webgl-shadows.html). |
| DrawImage, matrix stacks, sprites | 2D composition and billboards; connect the transform stack to scene hierarchy. |
| Cubemaps, environments, skyboxes, fog | Scene appearance and atmospheric depth; [cubemaps](https://webglfundamentals.org/webgl/lessons/webgl-cube-maps.html), [fog](https://webglfundamentals.org/webgl/lessons/webgl-fog.html). |
| Skinning and picking | Animation and interaction; [skinning](https://webglfundamentals.org/webgl/lessons/webgl-skinning.html), [picking](https://webglfundamentals.org/webgl/lessons/webgl-picking.html). |
| HTML/Canvas/texture/glyph text and toon ramps | Labels and stylized rendering; [glyph textures](https://webglfundamentals.org/webgl/lessons/webgl-text-glyphs.html), [ramps](https://webglfundamentals.org/webgl/lessons/webgl-ramp-textures.html). |
| GPGPU, drawing without data, vertex pulling | Data-oriented rendering and compute bridge; [GPGPU](https://webglfundamentals.org/webgl/lessons/webgl-gpgpu.html). |
| Indices and instancing | Geometry reuse and draw-call cost; [instancing](https://webglfundamentals.org/webgl/lessons/webgl-instanced-drawing.html). |
| Setup, resizing, animation, views, alpha, precision, capture, input, portability | Browser integration and debugging. Discuss premultiplication explicitly using [alpha](https://webglfundamentals.org/webgl/lessons/webgl-and-alpha.html). Include framebuffer/readPixels references at the point of use. |

## Learn WebGPU coverage map

The accessible tutorial index lists seven groups and fourteen lessons. All seven families are represented below; an index entry is evidence of a topic, not proof that its live editor was tested.

| Family | Course destination | Access evidence |
| --- | --- | --- |
| Initialization and canvas | Capability checks, adapter/device, context configuration | [Canvas lesson inspected](https://learn-webgpu.com/tutorial/getting-started/canvas-setup); initialization link unavailable. |
| First and colored triangle | WGSL entry points, rasterization, interpolation | [Triangle lesson inspected](https://learn-webgpu.com/tutorial/first-triangle/basic-triangle); colored lesson index only. |
| Vertex buffers and uniforms | Binary arrays, vertex layout, bind groups | [Vertex lesson inspected](https://learn-webgpu.com/tutorial/buffers-uniforms/vertex-buffers); uniforms index only. |
| Basic and multiple textures | Texture/view/sampler separation and compositing | [Basic](https://learn-webgpu.com/tutorial/textures/basic-texture), [multiple](https://learn-webgpu.com/tutorial/textures/multiple-textures) inspected. |
| Phong and advanced lighting | Normals, light types, view direction, material response | [Phong lesson inspected](https://learn-webgpu.com/tutorial/lighting/phong-lighting); advanced index only. |
| Compute/graphics particles and filters | Storage, workgroups, simulation, texture processing | [English particle lesson inspected](https://learn-webgpu.com/en/tutorial/compute-graphics/particle-system); filters index only. |
| Instancing and optimization | Reuse, batching, profiling, bandwidth | [Optimization lesson inspected](https://learn-webgpu.com/tutorial/performance/optimization-techniques); instancing index only. |

## Current API checks and deliberate modernization

The primary [npm package metadata](https://registry.npmjs.org/three/latest) and [official release](https://github.com/mrdoob/three.js/releases/tag/r187) identify **Three.js 0.187.0 (r187)** as the current stable release at this audit. The book's §5.1 uses r154. Pin dependencies and their addons to one release; consult the [migration guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide) when upgrading. In r187, PMREM uses cube render targets and `CubeUVReflectionMapping` has been removed; do not build new examples around its old atlas layout.

The official [renderer guide](https://threejs.org/manual/pages/webgpurenderer.html) describes `three/webgpu`, asynchronous initialization, and a WebGL 2 fallback. GLSL `ShaderMaterial`, `RawShaderMaterial`, `onBeforeCompile`, and `EffectComposer` do not transfer directly to that renderer; teach node materials/TSL and its separate processing path. The [color guide](https://threejs.org/manual/pages/color-management.html) supports linear working-space calculations, sRGB color maps, data-map distinctions, and a final output conversion.

For API details use the current [WebGPU specification](https://www.w3.org/TR/webgpu/) and [WGSL specification](https://www.w3.org/TR/WGSL/). WebGPU's normalized depth interval is 0 to 1; WebGL's is -1 to 1. A device-loss handler uses the Promise property `device.lost.then(...)`, correcting the book's §9.7.1 `device.lost()` spelling. Binding offsets follow device limits; WGSL member alignment is a separate layout problem. A `vec3f` has size 12 and alignment 16, so a following scalar can occupy the remaining four bytes; avoid the misleading rule that every vec3 always consumes 16 bytes.

Historical OpenGL 1.1 matrix stacks, immediate mode, GLUT/JOGL, Java Graphics2D, and C setup are comparison material. The core course teaches their transferable geometry through JavaScript, Canvas/SVG, WebGL 2, Three.js, and WebGPU. Browser support, optional features, and hardware limits are checked at runtime instead of promised from a static browser-version list.
