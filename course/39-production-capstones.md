# Production and the capstone sequence

You have reached the point where the major pieces connect: sampled images, geometry, transforms, shaders, materials, interaction, GPU computation, and resource lifetime. Fluency comes from building scenes whose behavior you can explain and whose failures you can diagnose. These capstones consolidate that skill with working references already included in the project.

## Choose a project as a chain of understandable decisions

A capstone is most useful when it asks you to connect ideas you already understand, then introduces a small amount of new integration work. Beginning with a huge unexplained effect copied from the internet can produce an image, but it often leaves the learner unable to change or diagnose it. The projects here instead grow from the supplied working labs.

Keep a reference version running while you extend it. Save one known-good state before changing geometry, another before adding a new pass, and another before changing resource layout. When the result breaks, compare against the nearest useful reference. This is a practical way to retain evidence, not a requirement to follow a formal assessment system.

For every project, write a brief paragraph explaining its coordinate conventions, data representation, frame sequence, and resource owner. If those facts cannot be stated clearly, the integration is probably moving too fast. Slowing down at a boundary saves time later when a symptom could otherwise originate in several unrelated subsystems.

## Capstone 1: a graphics mathematics explorer

[Open the project brief](#/lesson/p01).

Combine the pixel, vector, transform, and triangle labs into a small educational tool. The working references are `01-pixels.js` through `04-rasterizer.js`. Preserve explicit units and coordinate conventions. Show numeric values beside each control and a diagram explaining the relationship. Provide reset values and keyboard-accessible inputs.

The finished study should explain why resolution changes a silhouette, why a dot product changes sign, why matrix order moves a pivot, and why barycentric weights interpolate a color. A correct implementation is one you can describe without saying “the library somehow handles it.” The separate project brief supplies milestones and extension ideas.

## Develop the first project through one concrete interaction

Begin with two vectors and a displayed dot product. Let a slider rotate one vector while its length remains fixed. The displayed alignment should change smoothly through positive, zero, and negative values. Keep the formula visible beside the drawing so the sign has a geometric interpretation rather than appearing as arbitrary output.

Add a projection display only after the vector and numeric values agree. For a non-unit target axis, include division by the squared axis length. When that axis has zero length, display a clear undefined-direction state instead of allowing division by zero. This one edge case connects mathematical domain reasoning to usable interface behavior.

Then introduce a transformed polygon in a separate panel. Use an asymmetric shape so rotation and reflection remain visible. Show the product order explicitly and retain a faint original. A centered square can hide some mistakes because its symmetry makes different transforms look similar. Choosing diagnostic geometry is part of good graphics teaching and debugging.

The reference labs implement these individual mechanisms. Combining them into one tool is the learner's integration task. There is no need to rewrite the math helpers merely to make the project feel original; originality can come from explanation, comparison, and thoughtful interaction design.

## Capstone 2: a small raw WebGL renderer

[Open the project brief](#/lesson/p02).

Start from the indexed cube and add two objects sharing geometry, a camera control, and the two-pass framebuffer filter. Establish explicit opaque and transparent state policies. Add one shadow-map pass after the filter path is stable. The complete cube and filter labs are references; the combined shadow renderer is an optional learner extension, not a claim that the filter lab already implements shadows.

Deliver readable shader compile/link diagnostics, resize behavior, cleanup, and a short resource diagram. Test a wrong shader identifier, a zero-sized container, and repeated scene entry/exit. Keep enough debug visualization to inspect normals and depth.

## Develop the raw renderer through a pass diagram

Start with one cube and a fixed camera. Add a second object sharing the same geometry but using a different model matrix. Verify that changing the second transform does not accidentally move the first. If it does, inspect shared mutable temporary state and whether values are copied or referenced where you expected.

Next draw the scene into a target with color and depth. Display that color unchanged before adding a filter. This establishes that the offscreen image, viewport, and final sampling all agree. A filter cannot be meaningfully debugged while the copy path is already wrong.

For a shadow-map extension, add a dedicated debug view of the light's depth result. Keep a simple scene with one elevated object and one floor. First verify light-camera coverage, then comparison mapping, then bias, then filtering. Adding a large imported model before the shadow path works multiplies possible causes without teaching a new principle.

The supplied cube and filter are working references, while this combined shadow implementation remains optional learner work. Keeping that distinction explicit helps you plan effort and prevents a project brief from being mistaken for a hidden finished application.

## Capstone 3: an interactive Three.js studio

[Open the project brief](#/lesson/p03).

Use the material studio and picking lab as references. Build a product or sculpture explorer with a chosen focal object, three saved lighting/material presets, a camera reset, and selection through both the canvas and an HTML object list. If you import an asset, include source/license and an asynchronous loading/error state.

Keep a correct linear-light/color pipeline, useful shadow framing, and explicit disposal. The scene should be readable on a phone as well as a desktop. A fixed beautiful screenshot is only one state; orbiting, resizing, loading, and changing presets should remain coherent.

## Develop the studio around saved visual states

Create three complete presets, each including material, lights, environment, camera, and exposure where those are intentionally part of the look. A preset named ceramic should not secretly inherit an unrelated exposure value left by the previous metallic preset. Define what belongs to a preset and restore all of it consistently.

Use the existing picking selector and raycasting path as two entrances to the same selection state. A keyboard selection should highlight the same object as a pointer hit. If imported models contain many meshes, map those mesh hits to the logical product or sculpture the user recognizes. The application model and rendering hierarchy need not be identical.

Test the studio while an asset is missing and while an asynchronous load finishes after navigation. A user who cannot load one model should still see navigation and a useful error. A complete interactive scene includes these ordinary states, not only the successful image captured for a portfolio.

## Capstone 4: a procedural environment

[Open the project brief](#/lesson/p04).

Use the ocean and post-processing labs. Build a landscape or water study from functions with analytically or numerically consistent normals. Add a restrained palette, atmosphere, and at most a few purposeful effects. Explain which features are physical models and which are artistic approximations.

Compare high and low quality presets and record their costs on a representative device. Check CPU bounds and picking if geometry moves in a shader. Ensure shadows follow displacement if you enable shadow casting. Include a reduced-motion or paused presentation.

## Develop the procedural scene from one field

Choose one height function or distance field and retain a simple visualization of it. For a wave surface, display height and normals before a final material. For a distance field, display step count or hit distance before adding elaborate shading. Diagnostic views should remain reachable as the visual design grows.

After the base effect is correct, choose a focal composition. Add atmosphere and post-processing only when you can state what each contributes. A scene with many technically impressive effects can still lack hierarchy. The art-direction chapter's ceramic, metallic, and emissive studies provide a controlled way to learn those visual relationships.

Finally define two quality levels with measured differences. A lower setting should preserve the essential idea, perhaps through a coarser image or fewer subdivisions, rather than randomly disabling every feature. Record which visual approximation changes and why that tradeoff serves a slower device.

## Capstone 5: a native WebGPU simulation

[Open the project brief](#/lesson/p05). The [final exhibition brief](#/lesson/p06) combines the full course into a personal presentation.

Start from the complete compute particle lab. Add a second force or a lifetime system, then measure compute and render separately if optional timing support is available. Keep state on the GPU. Document the WGSL struct layout, buffer usage flags, workgroup dimensions, bounds policy, and input/output swap.

Verify a small deterministic update against a CPU reference before scaling. Handle no adapter, validation errors, device loss, and teardown. A million unstable particles are less informative than a smaller system with a correct numerical model and a clear performance explanation.

## Develop the simulation from a CPU reference

Use a handful of deterministic particles and calculate one time step on the CPU. Pack the same initial values into the GPU layout, run one compute update, and read back for comparison. Choose a numerical tolerance consistent with 32-bit arithmetic and the operations used. Only after that small case agrees should you restore thousands of elements.

When adding a field to the particle struct, recalculate member offsets, struct size, array stride, host allocation, initialization, and every shader declaration that reads it. The same record can be declared in both compute and render modules. Updating one copy while forgetting another creates a contract mismatch that may produce plausible but wrong motion or color.

Keep a reset control that restores deterministic initial state. Without it, comparing two force settings can be misleading because they begin from different evolved configurations. A stable starting condition is useful experimental infrastructure, even for an artistic simulation.

## Present the final result with its explanation

A final exhibition should let someone enjoy the scene and also discover how it works. A short explanation can name its coordinate spaces, the main function or algorithm, the relevant GPU data, and one approximation. Link to readable source rather than hiding every operation behind an unexplained effect name.

Include screenshots or recorded views of representative states, but also verify the live interactions. A carefully framed screenshot cannot reveal that resizing stretches the camera or that a scene change leaves an old animation loop running. Check those behaviors directly and keep any remaining verification limits honest.

Write one debugging case study: what you expected, what appeared, which evidence narrowed the cause, what changed, and how you verified the fix. This turns a frustrating failure into transferable understanding. The ability to explain why a normal transform, buffer stride, or color conversion was wrong is a stronger sign of fluency than reproducing an API call from memory.

## Production readiness

Run `npm run check`, `npm test`, and `npm run build`. Serve the built `dist` directory with an HTTP server to verify the packaged application, not only the development version. Hash routes make this static website portable without a server-side router. If hosting under a subdirectory, test the configured relative asset base and diagram links.

Test keyboard navigation, visible focus, responsive layout, reduced motion, and readable errors when a GPU capability is missing. Provide text for essential information. Profile representative camera angles and effect settings. Check console errors and validation messages, but also look at actual rendered output: successful compilation does not establish visual correctness.

Keep dependencies pinned and the lockfile committed. Upgrade deliberately with current migration notes and a small visual test scene. Keep secrets out of static source; this course requires none. Treat externally loaded models and source documents as data, with documented provenance and appropriate licenses.

## A practical definition of fluency

You can derive a coordinate conversion and explain its units. You can inspect a shader’s inputs and predict what each stage computes. You can choose a material and light setup intentionally. You can connect a WebGPU binding to bytes in an array. You can separate CPU submission time from GPU work. You can trace a resource from creation to disposal.

You do not need to remember every method signature. Use references to look up syntax while retaining the model. When learning a new engine or rendering technique, identify its coordinate spaces, data representation, execution model, and approximation boundaries. Those questions carry beyond this particular API version.

**Continue with the project briefs and Technique Atlas.** They extend the complete core without making every optional research topic a prerequisite for building a compelling scene.

