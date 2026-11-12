# Lighting a scene with intent

Understanding a light equation is necessary but not sufficient to make an image readable. A good scene gives the viewer a focal point, separates forms, and uses illumination to explain the surfaces. Lighting is both computation and composition.

**Experiment:** [Material studio](#/lab/materials). **Related:** [Bloom lab](#/lab/post-processing). **Reading bridge:** Eck §§5.1.5, 5.3.3–5.3.5; [Three.js lights](https://threejs.org/manual/en/lights.html) and [shadows](https://threejs.org/manual/en/shadows.html).

## Direct light and environment light

Directional, point, spot, and area-style lights describe different incoming-light distributions. A directional light approximates parallel rays. A point light radiates from a location. A spotlight restricts a cone. A rectangular area light can produce broad highlights under supported material/renderer paths; its shadow behavior is not automatically identical to a spot light’s.

Environment lighting samples radiance from surrounding directions. A sharp environment lookup suits a mirror; rough surfaces need a distribution of incoming directions. Three.js `PMREMGenerator` prepares a filtered environment representation for PBR materials. Use the library’s generator and returned texture for the pinned version rather than manually assuming an older internal layout. Internal environment formats can change between releases.

The studio constructs an environment scene with bright cards and generates a PMREM. These cards create reflection structure even though they are not visible in the main scene. This is similar to choosing reflectors in a photographic studio. It demonstrates that a reflection depends on surroundings, not just on a material’s “shininess” setting.

## A deliberate three-light study

Start with a neutral object and fixed exposure. A **key** establishes the main direction and shape. A weaker **fill** controls shadow contrast. A **rim** from behind or the side separates the silhouette from the background. These are roles, not required Three.js light classes. An environment can act as fill; an emissive visible object may still require a real light to illuminate neighbors in a rasterized scene.

Do not add lights until the object becomes uniformly bright. A readable shadow side helps communicate form. Use a simple camera angle and one dominant warm/cool relationship. A background close to the object’s value can erase its silhouette even if the shader is correct.

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

## Reflections, background, and visibility

Setting `scene.background` changes what the viewer sees behind objects. Setting `scene.environment` changes material illumination/reflection where supported. They can be different. A beautiful background image does not necessarily illuminate a standard material unless assigned as an environment appropriately.

A static environment cannot reflect every dynamically moving local object accurately. Dynamic cubemap capture can help but renders the surrounding scene multiple times and needs a coherent update schedule. Screen-space reflections use only visible image/depth information and fail outside that data. Ray tracing offers other tradeoffs. Choose an approximation with known limitations rather than assuming one “reflection” checkbox solves all cases.

## Color discipline

Make light intensities plausible relative to each other, set exposure intentionally, and apply output conversion once. If using post-processing, the final output pass owns the final transform. Annotate color textures correctly and leave data textures linear. A broken color pipeline cannot be reliably fixed by increasing every light or saturating base colors.

**Optional application:** build the same torus-knot study three ways: a soft studio object, a dramatic rim-lit silhouette, and a low-key metallic artifact. Keep geometry fixed and use lighting, environment, camera, and a restrained palette as the variables. Record parameter choices with the scene so you can reproduce each image.
