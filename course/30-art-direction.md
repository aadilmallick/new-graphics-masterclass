# Art direction: a complete scene study

A technically correct scene can still feel flat, crowded, or arbitrary. A striking scene coordinates camera, silhouette, material, lighting, color, motion, and detail around a clear idea. This chapter turns the material studio into a reproducible artistic study.

**Working scene:** [Material studio](#/lab/materials), with [shader ocean](#/lab/ocean) and [bloom](#/lab/post-processing) as companion implementations. These are complete runnable studies, not references to unavailable assets.

## Learn to see the image before changing its settings

Open the material studio and pause automatic rotation by using reduced motion or by adapting its small update callback locally. For a moment, ignore the names of materials and lights. Look at the image as a set of bright and dark regions. The focal object has an outer silhouette, internal openings, broad shaded surfaces, and smaller highlights. Each communicates something different.

The outer silhouette tells us the overall shape before we understand its surface. The internal openings make the knot legible as interwoven strands. Broad shading tells us how those strands curve. Highlights describe the relationship between curvature, material response, and bright surroundings. If all four mechanisms are changing at once, it becomes difficult to identify which adjustment improved the image.

This is why a disciplined scene study begins with a simple material and a fixed camera. It reduces the number of variables while you establish composition. A sophisticated shader cannot repair an object whose silhouette is hidden behind an unrelated foreground element. Conversely, a strong silhouette can remain compelling with a modest material and only a few lights.

You can make this analysis concrete by temporarily viewing the scene in grayscale or by squinting at a small preview. Fine detail disappears first. If the main form then vanishes into the background, the scene depends too heavily on small highlights or hue differences. Establish a larger value relationship before adding microdetail.

## Start with one sentence

Use a concrete brief: “A mint metallic artifact suspended in a quiet midnight studio.” It implies one focal object, a restrained palette, a dark environment, and slow or optional motion. It does not imply every available effect. Write down the intended mood and the one shape the viewer should notice first.

Choose an asymmetric or recognizable silhouette. The torus knot supplies interlocking negative spaces that respond well to light. A sphere is better for comparing material parameters; a knot is better for showing changing curvature and reflections. Let the shape serve the lesson or story.

## Color and hierarchy

Use a dominant hue, a secondary environment relationship, and a limited accent. Value contrast often determines readability more strongly than saturation. Test the image in grayscale mentally or with an image-processing pass. If the focal object and background have similar value everywhere, a perfect shader will not fix the hierarchy.

Bloom should support bright sources, not haze every edge. Depth of field should guide attention, not hide the form you are explaining. Fog can create separation but also flatten distant contrast intentionally. Every effect should have a role you can state in one sentence.

## Frame the object through geometry rather than guesswork

Field of view and camera distance both change framing, but they do not produce identical perspective. Moving the camera closer exaggerates near/far relationships. Moving it farther away and narrowing the field of view can preserve object size while making depth relationships appear flatter. The correct choice depends on the object and mood.

For a simple bounding sphere of radius r centered on the viewing axis, a useful conservative framing distance is related to `r / sin(fov/2)` for a vertically limiting angular view, with room for padding and aspect constraints. You do not need to use this as a universal camera formula; it illustrates that framing can be reasoned about from angular size. A wide object on a narrow phone screen may be constrained horizontally instead.

Always test the actual composition at the target aspect ratios. A desktop view can leave generous side space for controls, while a portrait screen may crop the focal silhouette if the camera policy remains unchanged. Decide whether the product preserves vertical framing, horizontal framing, or a particular object-bound fit.

## Build the image in layers

First use a neutral material and no post-processing. Position the camera so the silhouette reads at thumbnail size. Keep adequate space around the object and avoid accidental tangencies between its outline and background lines. A perspective camera at a moderate distance gives depth without extreme distortion.

Second, establish one key light. Move it until large light and shadow regions explain the form. Add fill only to preserve necessary detail. Add a cool rim or a bright environment card to separate the far edge. The studio’s procedural PMREM creates reflections that reveal curved surfaces even where direct highlights are limited.

Third, set roughness and metalness. A slightly rough metal can be more readable than a perfect mirror because its reflections are broader. Fix exposure, then tune lighting relationships. If every surface becomes clipped white, reducing base-color saturation is not the first diagnosis; inspect radiance and exposure.

Fourth, add grounding. A subtle floor and contact shadow communicate scale and location. A floating object can still have a shadow that anchors it. A grid is helpful for teaching coordinate systems but can be distracting in a finished artwork; decide whether it belongs to the visual brief.

## Walk through the studio's construction

The complete studio first creates a scene through the shared helper. That helper chooses a perspective camera, orbit controls, a dark background, a hemisphere fill, and two directional lights. The lab adds a floor and a torus knot. The knot's center is raised above the floor so its lower curve does not intersect it. These are spatial decisions with visible consequences, not merely setup boilerplate.

The knot uses a standard material with mint base color, roughness 0.25, and metalness 0.65 as an artistic mixed setting. It casts a shadow. The floor receives shadows and has a much rougher response, preventing it from becoming a competing mirror. The helper's camera initially sees the knot from above and to the side, exposing its internal negative spaces.

Next, the lab constructs a separate environment scene containing bright planar cards. Those cards are not added to the viewer's scene. They are rendered into a filtered environment representation, which the material can sample for reflections and illumination. A large white card provides a broad bright feature; a warm side card adds a different directional color relationship.

This separate environment is especially useful for teaching because it requires no external HDR download and makes the source of reflections understandable. A glossy surface is not intrinsically filled with beautiful highlights. It reflects bright and dark regions around it. A uniformly colored environment gives a different appearance from a studio containing deliberate light-card shapes.

## Develop a neutral ceramic variant first

For a ceramic-like study, begin with metalness zero and moderate roughness. Keep base color restrained. The material should retain a diffuse contribution that explains the form even where no bright reflection is visible. Raise roughness gradually until reflections become broad enough to support the shape without turning every strand into a sharp mirror.

Keep the existing key light in a position that creates one broad lit side and one darker side. If both sides become identical in brightness, reduce fill or reposition it rather than adding texture immediately. The visual purpose is to distinguish overlapping strands. A readable occlusion shadow and a stable rim can help separate a front strand from one passing behind it.

Imagine the lit side has relative linear brightness around 0.8 and the shadow side around 0.2 before display transformation. Their ratio is four to one. Raising fill so the shadow side reaches 0.6 reduces that contrast dramatically, even if the overall image seems brighter. The useful question is whether the form reads better, not whether every pixel became brighter.

Do not interpret those illustrative values as direct light-intensity settings. The rendered result depends on material response, environment, geometry, and tone mapping. The numbers describe a relationship in an image. Use them to reason about contrast while evaluating actual output from the scene.

## Develop a metallic variant by changing the surroundings

Now set metalness near one and lower roughness. The same object can suddenly appear darker in some regions because its appearance depends much more strongly on reflected surroundings. Increasing base color alone may not produce the desired broad highlight. Move or reshape an environment card so its reflection crosses the surface where you want the curvature to be understood.

A bright narrow card can create a thin reflected stripe. A larger card can create a broader region. Changing roughness blurs and spreads that directional structure. Therefore a highlight's width is jointly controlled by the material and the light/environment's angular size. If you attribute every highlight-width change to roughness, you miss half the explanation.

This relationship provides a controlled experiment. Keep roughness fixed and move a card. Then restore the card and vary roughness. The first changes which directions contain bright radiance; the second changes how the material distributes those directions into the viewer's direction. The visual effects are connected, but their causes differ.

For a midnight-metal image, let a substantial part of the object remain dark while preserving a few readable reflection bands. A dark surface can look intentionally dramatic when the silhouette and key reflections are clear. It looks accidentally broken when all useful shape information disappears. Art direction means controlling that boundary.

## Build an emissive variant without confusing emission and lighting

An emissive material contributes brightness independent of the ordinary diffuse light response. In the bloom lab, emissive rings become bright enough to produce a spread effect. However, the raster scene's floor does not automatically receive physically computed light from those surfaces. The viewer may perceive a luminous source even when the nearby illumination is a separate approximation.

If the intended scene needs the artifact to illuminate its surroundings, add a corresponding light or another appropriate illumination method. Keep its placement and color consistent with the emissive shape. A mint luminous object casting a strongly unrelated orange pool with no explanation can weaken the visual story, even if both effects look attractive separately.

Start with bloom disabled and establish a readable source shape. Then enable a small amount of spread. If the bloom obliterates every internal opening of the knot, reduce strength, source intensity, or threshold participation until the geometry remains understandable. A glare effect should support the focal object, not erase the information that makes it interesting.

## Motion as a relationship

Slow rotation reveals the object over time and makes reflections legible. It should be tied to elapsed seconds, suppressible under reduced motion, and pausable in a production presentation. Camera movement and object movement have different perceptual effects. Avoid moving both continuously until the viewer loses a stable frame of reference.

For an ocean study, use wave amplitude and frequency as a coordinated pair. Very high frequency on insufficient geometry produces faceted displacement; very large amplitude can make the plane self-intersect or leave its bounds. Add color variation related to height and normal orientation rather than arbitrary rapidly changing RGB values.

## Motion should reveal information over time

A slowly rotating knot reveals surfaces that a fixed image cannot show. That is a useful purpose for animation. But if rotation is too fast, highlights flash across the surface and the viewer may never establish a stable understanding of its form. If the camera also orbits automatically, two moving coordinate relationships compete.

The lab increments object rotation by elapsed seconds times a small angular speed. A speed of 0.15 radians per second is about 8.6 degrees per second, so a full turn takes roughly 41.9 seconds. This arithmetic makes the intended pace explicit. It is very different from adding 0.15 radians every frame, which would rotate dramatically faster and depend on frame rate.

Offer a still state as a legitimate presentation, not as a degraded version. Some users need reduced motion, and others simply want time to inspect a reflection or compare settings. A scene can preserve its beauty through composition, materials, and lighting even when nothing moves.

## Save a reproducible scene recipe

Keep camera position/target, geometry parameters, material parameters, light positions/intensities, environment setup, exposure, and post settings in a configuration object. Avoid scattering artistic constants across a large loop. The complete studio source is an example you can refactor into such data.

For a final scene variant, copy `labs/09-material-studio.js`, register it in the catalog, and modify one layer at a time. Use procedural geometry and the local environment first. Add a licensed glTF focal asset only after the composition works with a proxy.

## Store visual decisions as a reproducible recipe

The following configuration is an illustrative data structure rather than a new complete renderer. Its purpose is to separate artistic choices from the loop that implements them:

```js
const study = {
  camera: { position: [5, 3.5, 7], target: [0, 0.5, 0], fov: 45 },
  surface: { color: '#82ebcc', roughness: 0.25, metalness: 0.65 },
  display: { exposure: 1.2 },
  motion: { radiansPerSecond: 0.15, paused: false }
};
```

The renderer reads this data into the appropriate existing objects. A saved preset can then restore the whole relationship, not merely one slider. When comparing two studies, record which fields differ. This gives you a small experimental language for visual design.

Keep source values in clear units. A field named `radiansPerSecond` is harder to misinterpret than `speed`. A target is a point in world space, while a material color is interpreted through the library's color management. Writing those meanings down makes presets reusable and prevents subtle mismatches when the scene grows.

## Finish by subtracting

View the scene at desktop and phone sizes. Check that controls do not obscure the focal shape. Remove secondary objects that compete without contributing. Inspect shadows, color conversion, aliasing, and reflection seams. Measure performance at the final camera angle, where large on-screen objects can create much more fragment work than an empty overview.

## Review the final image in several contexts

Inspect a thumbnail for hierarchy, a full-size image for shading and aliasing, an orbiting view for geometric consistency, and a phone layout for framing. Check what happens when the user chooses an extreme control value. A beautiful default does not excuse a slider range that routinely creates a broken or incomprehensible image.

Finally, compare the image with the original brief. If the scene was intended to feel quiet, a dense animated grid and intense bloom may work against it. Remove or reduce elements whose contribution you cannot explain. The earlier math gives you control over individual mechanisms; art direction coordinates those mechanisms into one readable experience.

**Optional studio project:** create three saved variants from the same geometry: soft ceramic daylight, polished midnight metal, and an emissive sci-fi artifact. Deliver each with a screenshot, a parameter recipe, and a short explanation of how light and material create the difference. The target is controlled visual intent, not a larger count of effects.
