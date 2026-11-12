# Art direction: a complete scene study

A technically correct scene can still feel flat, crowded, or arbitrary. A striking scene coordinates camera, silhouette, material, lighting, color, motion, and detail around a clear idea. This chapter turns the material studio into a reproducible artistic study.

**Working scene:** [Material studio](#/lab/materials), with [shader ocean](#/lab/ocean) and [bloom](#/lab/post-processing) as companion implementations. These are complete runnable studies, not references to unavailable assets.

## Start with one sentence

Use a concrete brief: “A mint metallic artifact suspended in a quiet midnight studio.” It implies one focal object, a restrained palette, a dark environment, and slow or optional motion. It does not imply every available effect. Write down the intended mood and the one shape the viewer should notice first.

Choose an asymmetric or recognizable silhouette. The torus knot supplies interlocking negative spaces that respond well to light. A sphere is better for comparing material parameters; a knot is better for showing changing curvature and reflections. Let the shape serve the lesson or story.

## Build the image in layers

First use a neutral material and no post-processing. Position the camera so the silhouette reads at thumbnail size. Keep adequate space around the object and avoid accidental tangencies between its outline and background lines. A perspective camera at a moderate distance gives depth without extreme distortion.

Second, establish one key light. Move it until large light and shadow regions explain the form. Add fill only to preserve necessary detail. Add a cool rim or a bright environment card to separate the far edge. The studio’s procedural PMREM creates reflections that reveal curved surfaces even where direct highlights are limited.

Third, set roughness and metalness. A slightly rough metal can be more readable than a perfect mirror because its reflections are broader. Fix exposure, then tune lighting relationships. If every surface becomes clipped white, reducing base-color saturation is not the first diagnosis; inspect radiance and exposure.

Fourth, add grounding. A subtle floor and contact shadow communicate scale and location. A floating object can still have a shadow that anchors it. A grid is helpful for teaching coordinate systems but can be distracting in a finished artwork; decide whether it belongs to the visual brief.

## Motion as a relationship

Slow rotation reveals the object over time and makes reflections legible. It should be tied to elapsed seconds, suppressible under reduced motion, and pausable in a production presentation. Camera movement and object movement have different perceptual effects. Avoid moving both continuously until the viewer loses a stable frame of reference.

For an ocean study, use wave amplitude and frequency as a coordinated pair. Very high frequency on insufficient geometry produces faceted displacement; very large amplitude can make the plane self-intersect or leave its bounds. Add color variation related to height and normal orientation rather than arbitrary rapidly changing RGB values.

## Color and hierarchy

Use a dominant hue, a secondary environment relationship, and a limited accent. Value contrast often determines readability more strongly than saturation. Test the image in grayscale mentally or with an image-processing pass. If the focal object and background have similar value everywhere, a perfect shader will not fix the hierarchy.

Bloom should support bright sources, not haze every edge. Depth of field should guide attention, not hide the form you are explaining. Fog can create separation but also flatten distant contrast intentionally. Every effect should have a role you can state in one sentence.

## Save a reproducible scene recipe

Keep camera position/target, geometry parameters, material parameters, light positions/intensities, environment setup, exposure, and post settings in a configuration object. Avoid scattering artistic constants across a large loop. The complete studio source is an example you can refactor into such data.

For a final scene variant, copy `labs/09-material-studio.js`, register it in the catalog, and modify one layer at a time. Use procedural geometry and the local environment first. Add a licensed glTF focal asset only after the composition works with a proxy.

## Finish by subtracting

View the scene at desktop and phone sizes. Check that controls do not obscure the focal shape. Remove secondary objects that compete without contributing. Inspect shadows, color conversion, aliasing, and reflection seams. Measure performance at the final camera angle, where large on-screen objects can create much more fragment work than an empty overview.

**Optional studio project:** create three saved variants from the same geometry: soft ceramic daylight, polished midnight metal, and an emissive sci-fi artifact. Deliver each with a screenshot, a parameter recipe, and a short explanation of how light and material create the difference. The target is controlled visual intent, not a larger count of effects.
