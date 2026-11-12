# Lighting a scene with intent

Understanding a light equation is necessary but not sufficient to make an image readable. A good scene gives the viewer a focal point, separates forms, and uses illumination to explain the surfaces. Lighting is both computation and composition.

**Experiment:** [Material studio](#/lab/materials). **Related:** [Bloom lab](#/lab/post-processing). **Reading bridge:** Eck §§5.1.5, 5.3.3–5.3.5; [Three.js lights](https://threejs.org/manual/en/lights.html) and [shadows](https://threejs.org/manual/en/shadows.html).

## Light a neutral proxy before decorating the scene

A lighting study should begin with a shape whose behavior is easy to read. Use a sphere, box, or the studio knot with a neutral material. Keep the camera fixed and remove optional effects. This does not mean the final scene must be plain. It means you need an uncomplicated reference against which later decisions can be judged.

With no light-dependent material response visible, an unlit mesh can still show its base color. Switch to a standard material and introduce one directional light. Move that light around the object. Its lit region and shadow-facing region change because the normal-light alignment changes. The camera's angle also changes which portions of that form you see. Establish these broad regions before adding textured detail that can conceal them.

The first artistic question is usually “what should the viewer understand about this form?” A broad highlight can explain curvature. A dark side can separate two planes. A rim can reveal an otherwise lost silhouette. A bright background can frame a dark reflective object. Each is a relationship between object, source, environment, and viewpoint. No single intensity value produces a universally good image independent of those relationships.

## Give different light types a geometric interpretation

A directional light approximates rays arriving from a common direction everywhere. Moving a surface farther from its nominal source position does not model the same inverse-square falloff as a point source. This is useful for a distant sun-like illumination approximation over a modest scene. A point light's location matters to both direction and distance at each surface point.

For a point source, compare surfaces at distances two and four units under the same unobstructed ideal conditions. Inverse-square scaling gives one fourth versus one sixteenth of the reference-distance factor. The farther surface receives one quarter as much as the nearer one. This is a large change, which is why arbitrary scene scale can make point lighting difficult to tune consistently.

A spotlight combines a position with a directional cone. Being close to the source does not ensure strong illumination if the point lies outside the cone. A rectangular source occupies a range of incoming directions and can create broader reflections. The material/rendering implementation determines which effects and shadow paths that light type supports. Use a helper or a simple proxy plane to verify direction before judging its intensity.

A hemisphere light is a practical broad orientation-based fill model. It helps a teaching scene distinguish upward- and downward-facing regions. It is not the same data as an HDR environment texture and does not simulate all local bounced illumination. Naming its approximation lets you use it deliberately rather than expecting it to produce every reflection visible in a real room.

## Direct light and environment light

Directional, point, spot, and area-style lights describe different incoming-light distributions. A directional light approximates parallel rays. A point light radiates from a location. A spotlight restricts a cone. A rectangular area light can produce broad highlights under supported material/renderer paths; its shadow behavior is not automatically identical to a spot light’s.

Environment lighting samples radiance from surrounding directions. A sharp environment lookup suits a mirror; rough surfaces need a distribution of incoming directions. Three.js `PMREMGenerator` prepares a filtered environment representation for PBR materials. Use the library’s generator and returned texture for the pinned version rather than manually assuming an older internal layout. Internal environment formats can change between releases.

The studio constructs an environment scene with bright cards and generates a PMREM. These cards create reflection structure even though they are not visible in the main scene. This is similar to choosing reflectors in a photographic studio. It demonstrates that a reflection depends on surroundings, not just on a material’s “shininess” setting.

## Build key, fill, and rim as roles

Set a key light first. Place it above and to one side of the object so the form has a readable light region and a shadow region. Look at the image at a small size. If the silhouette and main surface directions are already clear, the key is doing useful work. If the object is uniformly flat, moving the key can be more informative than increasing its intensity.

Add fill next, more weakly, from another useful direction or through an environment. Its role is to control how dark the unlit side becomes. Too much fill erases the contrast the key established. Too little can hide necessary structure. There is no fixed key-to-fill ratio that suits every subject; begin with a clear difference and adjust according to the image's purpose.

Add a rim only if separation needs it. A source behind or to the side can create a bright edge against a dark background. On a reflective object, an environment card can create a similar separation through reflection. Do not confuse a deliberately placed source with a shader that brightens every silhouette regardless of surroundings. Both can be valid artistic choices, but their behavior under camera motion differs.

The studio helper's directional key has a warm color and a stronger intensity, while a cooler directional fill comes from another side. A hemisphere contribution supplies broad readability. The procedural environment adds reflection structure. These components have different roles, so a convincing adjustment changes the component that corresponds to the observed problem.

## A deliberate three-light study

Start with a neutral object and fixed exposure. A **key** establishes the main direction and shape. A weaker **fill** controls shadow contrast. A **rim** from behind or the side separates the silhouette from the background. These are roles, not required Three.js light classes. An environment can act as fill; an emissive visible object may still require a real light to illuminate neighbors in a rasterized scene.

Do not add lights until the object becomes uniformly bright. A readable shadow side helps communicate form. Use a simple camera angle and one dominant warm/cool relationship. A background close to the object’s value can erase its silhouette even if the shader is correct.

## Understand a reflection card as directional scene content

Imagine photographing a polished metal object in a dark room. A large white panel may become visible as a bright streak in the object even if the camera cannot see the panel directly. The reflection traces incoming direction through the material's directional response. The studio's environment scene uses a white plane and a warm plane to create that sort of structure computationally.

A rough surface does not read one sharp environment direction. It integrates a broader response, so the environment needs filtering matched to material roughness. `PMREMGenerator` prepares the representation used by the library. The course uses the returned texture through the public API instead of assuming its internal storage arrangement. This matters because internal environment formats can change between releases.

The environment scene is separate from the main scene. Adding a new moving cube to the main scene does not automatically insert it into the already generated environment. If a local object needs a matching reflection, consider an updated capture or another reflection technique. A static studio environment is excellent for a controlled material study, while a moving mirror in a cluttered room has different requirements.

## Reflections, background, and visibility

Setting `scene.background` changes what the viewer sees behind objects. Setting `scene.environment` changes material illumination/reflection where supported. They can be different. A beautiful background image does not necessarily illuminate a standard material unless assigned as an environment appropriately.

A static environment cannot reflect every dynamically moving local object accurately. Dynamic cubemap capture can help but renders the surrounding scene multiple times and needs a coherent update schedule. Screen-space reflections use only visible image/depth information and fail outside that data. Ray tracing offers other tradeoffs. Choose an approximation with known limitations rather than assuming one “reflection” checkbox solves all cases.

## Trace the shadow setup through all required participants

A shadow is not enabled by one checkbox on a material. The renderer must support and enable the shadow path. A suitable light must render a shadow map. A mesh must participate as a caster if it should block the light. A receiving surface must participate if it should be darkened by that visibility result. Missing any one relationship can leave the image illuminated but shadowless.

In the studio, the knot casts and the floor receives. The key light renders a directional shadow. The camera used for that shadow has bounds chosen to include the intended region. A camera helper can reveal its volume. If the knot moves outside that volume, the shadow can vanish even while the knot remains visible to the viewer. Viewer visibility and light visibility are different coordinate questions.

Shadow-map resolution should be judged relative to coverage. Suppose a 1024-wide map covers twenty-four world units across. One texel corresponds to about `24/1024 = 0.0234` units in that light-space direction. Covering 240 units with the same resolution makes that roughly 0.234 units. Fine details no longer occupy enough shadow samples. Tightening bounds around the relevant subject often improves quality more efficiently than blindly raising resolution.

Doubling width and height quadruples sample count. A map at 2048 square has four times the texels of 1024 square. Additional lights can require additional shadow views; a point-light-style capture can require several directional faces. These costs make shadow decisions part of scene design and performance, not merely a final quality slider.

## Shadow configuration

For a standard shadow-mapped scene, enable renderer shadow maps, enable `castShadow` on the relevant light and object, and enable `receiveShadow` on receiving surfaces. Configure the light’s shadow camera bounds so the intended scene fits. A huge directional shadow frustum spreads a fixed shadow texture over too much space and makes detail coarse.

```js
renderer.shadowMap.enabled = true;
key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
mesh.castShadow = true;
ground.receiveShadow = true;
```

This fragment is setup, not the whole scene; the complete studio source includes it. Use `CameraHelper` for the shadow camera and light helpers to see the actual volume. Tune normal bias and depth bias modestly. Doubling shadow resolution quadruples texel count and can increase memory and rendering cost substantially. Point-light shadows need several views.

## Diagnose acne and detached contacts separately

Shadow acne often looks like stripes or speckled self-shadowing. The rendered receiver's reconstructed light depth disagrees slightly with the stored nearest depth due to finite precision and sampling. A modest bias can reduce that disagreement. Normal bias displaces the comparison in a way related to surface orientation; depth bias adjusts the comparison convention. Their effects depend on the light, scale, and rendering path.

A shadow visibly floating away from its object suggests too much bias or another mismatch. Increasing bias further makes the detachment worse even though it may remove remaining acne. First ensure the light volume and scene scale are sensible. Then tune the smallest useful bias while inspecting contact regions and grazing surfaces. A parameter that fixes one camera view can expose a problem in another.

Filtering softens discrete visibility samples but does not create perfect area-light transport automatically. A large soft-looking shadow can hide some aliasing while still having incorrect contact behavior. Start with a readable hard or modestly filtered shadow to verify geometry, projection, and bias, then choose softness appropriate to the scene.

## Keep background, illumination, and output treatment distinct

`scene.background` determines what appears where no foreground surface is drawn. `scene.environment` supplies surrounding radiance to supported materials. They can be different resources for a deliberate reason. A dark background can present a metallic object cleanly while a brighter unseen environment gives it useful reflected highlights.

Exposure changes how scene light is mapped toward display. Raising exposure can reveal a dark object, but it also affects every other region and may push highlights toward white. Changing the environment changes directional reflection content. Changing a light changes illumination from that source. These adjustments are not interchangeable, even when a small crop briefly looks similar.

The final color conversion belongs at the intended end of the pipeline. With post-processing, use the output pass as documented rather than encoding the scene early and then filtering encoded light accidentally. A material that is too pale might have a double conversion, an incorrectly annotated base texture, or overexposure. Adding contrast after the fact does not explain the underlying mismatch.

## Color discipline

Make light intensities plausible relative to each other, set exposure intentionally, and apply output conversion once. If using post-processing, the final output pass owns the final transform. Annotate color textures correctly and leave data textures linear. A broken color pipeline cannot be reliably fixed by increasing every light or saturating base colors.

## Develop one reproducible lighting recipe

For a soft studio variant, begin with a medium-rough dielectric, a broad readable environment, moderate key contrast, and minimal post-processing. For a polished midnight variant, use a metallic material and stronger directional reflection shapes against a dark background. For a dramatic silhouette, reduce fill and place a separating source so important edges remain visible. Keep the same geometry so the differences are attributable to lighting and material.

Record camera position and target, material parameters, light positions/colors/intensities, environment construction, exposure, shadow bounds, and any post-processing settings. These are the scene's photographic conditions. Saving only a mesh color is not enough to reproduce the image. A configuration object gives you repeatable studies and a controlled baseline when diagnosing changes.

View the result at phone size as well as a large desktop. Thin highlight detail can disappear, and controls can cover a focal shape. A readable scene should preserve its main value grouping and silhouette at reduced size. Good lighting supports the subject's meaning under the actual viewing conditions, not only at a carefully selected full-resolution screenshot.

**Optional application:** build the same torus-knot study three ways: a soft studio object, a dramatic rim-lit silhouette, and a low-key metallic artifact. Keep geometry fixed and use lighting, environment, camera, and a restrained palette as the variables. Record parameter choices with the scene so you can reproduce each image.
