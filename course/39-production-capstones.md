# Production and the capstone sequence

You have reached the point where the major pieces connect: sampled images, geometry, transforms, shaders, materials, interaction, GPU computation, and resource lifetime. Fluency comes from building scenes whose behavior you can explain and whose failures you can diagnose. These capstones consolidate that skill with working references already included in the project.

## Capstone 1: a graphics mathematics explorer

[Open the project brief](#/lesson/p01).

Combine the pixel, vector, transform, and triangle labs into a small educational tool. The working references are `01-pixels.js` through `04-rasterizer.js`. Preserve explicit units and coordinate conventions. Show numeric values beside each control and a diagram explaining the relationship. Provide reset values and keyboard-accessible inputs.

The finished study should explain why resolution changes a silhouette, why a dot product changes sign, why matrix order moves a pivot, and why barycentric weights interpolate a color. A correct implementation is one you can describe without saying “the library somehow handles it.” The separate project brief supplies milestones and extension ideas.

## Capstone 2: a small raw WebGL renderer

[Open the project brief](#/lesson/p02).

Start from the indexed cube and add two objects sharing geometry, a camera control, and the two-pass framebuffer filter. Establish explicit opaque and transparent state policies. Add one shadow-map pass after the filter path is stable. The complete cube and filter labs are references; the combined shadow renderer is an optional learner extension, not a claim that the filter lab already implements shadows.

Deliver readable shader compile/link diagnostics, resize behavior, cleanup, and a short resource diagram. Test a wrong shader identifier, a zero-sized container, and repeated scene entry/exit. Keep enough debug visualization to inspect normals and depth.

## Capstone 3: an interactive Three.js studio

[Open the project brief](#/lesson/p03).

Use the material studio and picking lab as references. Build a product or sculpture explorer with a chosen focal object, three saved lighting/material presets, a camera reset, and selection through both the canvas and an HTML object list. If you import an asset, include source/license and an asynchronous loading/error state.

Keep a correct linear-light/color pipeline, useful shadow framing, and explicit disposal. The scene should be readable on a phone as well as a desktop. A fixed beautiful screenshot is only one state; orbiting, resizing, loading, and changing presets should remain coherent.

## Capstone 4: a procedural environment

[Open the project brief](#/lesson/p04).

Use the ocean and post-processing labs. Build a landscape or water study from functions with analytically or numerically consistent normals. Add a restrained palette, atmosphere, and at most a few purposeful effects. Explain which features are physical models and which are artistic approximations.

Compare high and low quality presets and record their costs on a representative device. Check CPU bounds and picking if geometry moves in a shader. Ensure shadows follow displacement if you enable shadow casting. Include a reduced-motion or paused presentation.

## Capstone 5: a native WebGPU simulation

[Open the project brief](#/lesson/p05). The [final exhibition brief](#/lesson/p06) combines the full course into a personal presentation.

Start from the complete compute particle lab. Add a second force or a lifetime system, then measure compute and render separately if optional timing support is available. Keep state on the GPU. Document the WGSL struct layout, buffer usage flags, workgroup dimensions, bounds policy, and input/output swap.

Verify a small deterministic update against a CPU reference before scaling. Handle no adapter, validation errors, device loss, and teardown. A million unstable particles are less informative than a smaller system with a correct numerical model and a clear performance explanation.

## Production readiness

Run `npm run check`, `npm test`, and `npm run build`. Serve the built `dist` directory with an HTTP server to verify the packaged application, not only the development version. Hash routes make this static website portable without a server-side router. If hosting under a subdirectory, test the configured relative asset base and diagram links.

Test keyboard navigation, visible focus, responsive layout, reduced motion, and readable errors when a GPU capability is missing. Provide text for essential information. Profile representative camera angles and effect settings. Check console errors and validation messages, but also look at actual rendered output: successful compilation does not establish visual correctness.

Keep dependencies pinned and the lockfile committed. Upgrade deliberately with current migration notes and a small visual test scene. Keep secrets out of static source; this course requires none. Treat externally loaded models and source documents as data, with documented provenance and appropriate licenses.

## A practical definition of fluency

You can derive a coordinate conversion and explain its units. You can inspect a shader’s inputs and predict what each stage computes. You can choose a material and light setup intentionally. You can connect a WebGPU binding to bytes in an array. You can separate CPU submission time from GPU work. You can trace a resource from creation to disposal.

You do not need to remember every method signature. Use references to look up syntax while retaining the model. When learning a new engine or rendering technique, identify its coordinate spaces, data representation, execution model, and approximation boundaries. Those questions carry beyond this particular API version.

**Continue with the project briefs and Technique Atlas.** They extend the complete core without making every optional research topic a prerequisite for building a compelling scene.
