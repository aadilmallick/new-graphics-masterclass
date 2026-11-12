# Models, textures, and the asset pipeline

Generated geometry teaches the mechanism; authored assets let you build complex scenes efficiently. Loading a model is not just downloading vertices. It can involve materials, textures, skeletons, animations, compressed data, coordinate conventions, and resource ownership.

**Connection:** the scene-graph and material labs show what a loaded hierarchy will contain. **Reading bridge:** Eck §5.2.5 and Appendix B; [loading glTF](https://threejs.org/manual/en/load-gltf.html) and [GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html).

## Start by identifying what the file actually contains

A model file is not necessarily one object with one texture. It may describe a hierarchy containing several meshes, shared materials, cameras, animations, and skinning data. It may reference separate binary buffers and image files. A loader reconstructs those relationships into runtime objects. Before writing code that modifies the result, inspect its structure and establish what the asset intends to represent.

A `.gltf` document uses JSON to describe the asset and can refer to external resources. A `.glb` places JSON and binary data into a container, making delivery convenient, but external references are still something to inspect rather than dismiss categorically. The distinction concerns packaging. It does not mean one format is automatically animated and the other static, or that a binary container changes the underlying geometry mathematics.

A photograph pasted onto a plane and a fully authored 3D chair have very different structures. The latter can have several material groups, transformed parts, and physically meaningful dimensions. Replacing every material with one generic material can destroy glass, metal, and fabric distinctions. It is a useful diagnostic operation when intentional, but not a default correction for unfamiliar appearance.

## Why glTF

glTF is an interchange format designed for efficient delivery of 3D scenes. A `.gltf` file is JSON and can reference separate buffers and images. A `.glb` is a binary container that can package data together, though you should still inspect whether external references exist. The format has well-defined PBR material conventions and supports hierarchies, animation, morph targets, and skinning.

OBJ is useful for simple geometry interchange but does not provide the same complete modern scene and animation model. Loading an OBJ plus MTL and textures requires matching all those references. Prefer glTF for a new web delivery pipeline unless a specific asset or tool requires another format.

## Follow loading as a sequence of asynchronous responsibilities

The browser first requests bytes. Those bytes may require decoding, parsing, decompression, image decoding, and creation of GPU-ready resources. Some work happens asynchronously, and errors can occur at several stages. A request returning successfully does not prove that every referenced texture was found or every extension can be decoded.

`await loader.loadAsync(url)` lets the surrounding asynchronous function wait for the loader's result. It does not freeze the browser's entire UI in the simple way a long synchronous JavaScript loop would. Your application can display a loading state while waiting. The `try/catch` around the await gives an explicit failure path, so you can preserve a placeholder or show a useful message instead of removing all content.

The result contains `.scene`, a root hierarchy, and `.animations`, a clip list. The expression `gltf.scene.children[0]` is not a universal “main model” API. The first child might be a group, an empty transform node, or only one small component. Traverse and inspect names/types when integrating an unfamiliar asset. Keep selection and material replacement policies connected to meaningful object identities, not accidental child order.

## A loading pattern

This fragment belongs in an initialized Three.js scene; replace the path with an asset you own or are licensed to use:

```js
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const loader = new GLTFLoader();
try {
  const gltf = await loader.loadAsync('/models/scene.glb');
  scene.add(gltf.scene);
  console.log(gltf.animations.map(clip => clip.name));
} catch (error) {
  console.error('Model could not be loaded', error);
  // Show a readable error and keep the rest of the application usable.
}
```

The result’s `.scene` is a hierarchy, not necessarily one mesh. Its `.animations` is a list of clips. Inspect the hierarchy before replacing every material or assuming the first child is the main object. Loader decoding can complete asynchronously, so check whether the requesting scene still exists before attaching late results.

## Use a generation token for late results

Suppose a user opens a model scene, then navigates away before the download finishes. If the loading callback blindly calls `scene.add`, it can attach resources to an obsolete scene or revive work the user has already left. This is a lifecycle race, even though the network request itself may be valid.

A small generation-token pattern separates request completion from permission to use the result. The following integration fragment assumes an application-owned loader and a disposal routine that follows your sharing policy:

```js
let generation = 0;
async function showModel(url) {
  const myGeneration = ++generation;
  const result = await loader.loadAsync(url);
  if (myGeneration !== generation) {
    disposeOwnedAsset(result.scene);
    return;
  }
  scene.add(result.scene);
}
function leaveScene() {
  generation++;
  // Stop loops and dispose resources owned by the departing scene.
}
```

The comparison does not cancel the HTTP request. It prevents a completed stale result from becoming active. The disposal routine is intentionally application-specific because meshes can share materials or textures with other users. A real cache might retain the result under an explicit asset handle instead of immediately destroying it. The important rule is that late completion does not silently choose its own lifetime.

## Inspect bounds before moving the camera randomly

A loaded model can be valid but outside the current camera's useful framing. It may be extremely large, extremely small, or offset from the origin. Compute its world bounds after transforms are current. A bounding box provides minimum and maximum coordinates; subtracting gives size, averaging gives center. This is evidence about the asset rather than a guess based on a blank image.

For example, if bounds are X from -2 to 4, Y from 0 to 3, and Z from -1 to 1, the center is `(1,1.5,0)` and size `(6,3,2)`. You can aim the camera at that center. To estimate a vertical camera distance for height H and FOV phi, use `distance >= (H/2)/tan(phi/2)` with a margin, while also accounting for horizontal fit through aspect and the model's depth. A single bounding sphere is another convenient conservative framing model.

Do not automatically scale every imported object to a one-unit box in a shared world. A person and a building have meaningful relative dimensions. If normalizing a standalone product viewer is useful, put that policy in a wrapper transform and document it. Retain the asset's original hierarchy when possible so animation channels and joint relationships remain intact.

## Framing and normalization

Use `Box3().setFromObject(root)` after world transforms are current to inspect bounds. Compute center and size, then choose camera framing or an explicit root transform. Avoid blindly scaling every asset to one unit: a chair and a building should retain meaningful relative scale if they belong to the same world.

Three.js commonly uses +Y up and a right-handed convention. DCC applications may have different authoring axes, but exporters often convert. Verify rather than applying another automatic 90° rotation on top. A negative scale can affect handedness and culling. Keep a clean wrapper group for scene placement so imported animation transforms remain intact.

## Separate placement from authored animation

An imported root may already have transforms, and animation clips may target nodes inside it. If you overwrite those exact transform properties for scene placement, you can fight the animation system. A wrapper group solves the separation: add the imported scene beneath a new group, then position/rotate/scale the wrapper as your application's placement frame.

The wrapper's world transform composes with the asset's authored local transforms, just as the orbit lab's parent combines with the planet's local position. This reuses a concept you already understand. Asset integration does not need a separate mysterious coordinate theory; it needs careful identification of which frame belongs to the authoring tool and which belongs to the application.

Verify axis conventions with a known upright test object. Exporters often convert from a DCC application's authoring convention into the interchange format. Applying a habitual extra 90-degree rotation can therefore make a correctly exported model wrong. A labeled axis marker or a simple asymmetric object is better evidence than guessing from a symmetric sphere.

## Distinguish transfer size, decoded size, and GPU storage

A compressed image file can be small on the network but large after decoding. A 2048-square RGBA8 texture has `2048*2048*4 = 16,777,216` base-level bytes, sixteen MiB. A full mip chain raises that approximately to twenty-one and one-third MiB. A model using several such maps can consume substantial GPU memory even if its download is only a few megabytes.

JPEG and WebP primarily reduce delivery size for appropriate imagery. GPU block-compressed textures aim to retain a compressed representation usable by the graphics hardware, subject to supported target formats. KTX2/Basis workflows can help select suitable formats after capability detection. Geometry compression similarly trades decoding work and configuration for reduced transfer size. These are distinct budgets, so measure load time, decode time, memory, and rendering separately.

A small object occupying sixty pixels on screen rarely benefits from a collection of 4K textures. On the other hand, a close product inspection may reveal detail that a tiny map cannot preserve. Choose asset resolution from expected viewing conditions and material importance. Mipmaps support changing projected size, but they do not make an oversized base texture free to store or download.

## Compression and delivery

Geometry compression such as Draco or Meshopt reduces transfer size at a decoding cost and requires the appropriate loader configuration and decoder resources. Texture compression such as KTX2/Basis targets GPU-friendly formats after capability detection. JPEG or WebP reduces download size but is often expanded to much larger GPU storage. Network size and GPU memory are different budgets.

Choose texture resolution from expected screen coverage and material needs. A tiny prop usually does not need several 4K maps. Generate mipmaps appropriately. Packed channels can save fetches and storage when format conventions align. Keep color-space metadata correct after any image-processing step.

## Treat decoder files as part of the deployed application

A compressed model may work on the author's machine because decoder resources exist at a local path. Production deployment must include or deliberately host the resources the loader needs. A loader configuration pointing to an absent decoder directory can make only certain assets fail, while simpler models continue to load. That pattern is evidence of format/decoder setup rather than a universal graphics failure.

Keep decoder versions compatible with the loader and asset workflow. Avoid mixing arbitrary core/addon releases. Verify the final built site's actual URLs and loading behavior. A local filesystem path is not a production web URL, and a development server can sometimes conceal missing files through fallback routing. Inspect network errors and asset content when a binary loader reports unexpected data.

## Preserve material semantics during export

Base color, roughness, metalness, normal, and occlusion maps have different meanings. The glTF loader applies format conventions, including material channel packing and color interpretation. After loading, avoid “fixing” every map's color space to sRGB. That would corrupt numerical normal and material-parameter data. Likewise, flipping every texture independently can break an asset whose UV/export conventions were already handled correctly.

Check normals and UV seams in the authoring tool before export. A reversed face can disappear under culling. A tangent-space normal map depends on a consistent tangent frame and orientation convention. A hard edge often requires split vertex attributes even if the positions meet. An exporter cannot always infer the artist's intended shading discontinuities from a visibly connected silhouette alone.

Use an early test export with one material, a few distinctive parts, and one short animation. Load it into the target application before building a large asset collection. This shortens the feedback loop: a convention error discovered in a three-object test scene is easier to repair than one embedded across a complex animated environment.

## Authoring checklist in practical terms

In Blender or another DCC tool, check object origins, scale, normals, UV seams, material assignments, and animation names before export. Apply destructive operations only when their effects on rigs and animation are understood. Export a small sample early, verify it in the target renderer, then build the full asset pipeline. Tangent-space normal maps need compatible tangent conventions and texture orientation.

Give files stable paths and names. Verify the production server serves binary assets with correct paths and that deployment includes decoder resources. A model working locally does not prove an external texture URL will permit cross-origin access in production.

## Dispose an asset according to ownership

Removing a root from the scene affects traversal and visibility, not automatically GPU allocation. Geometry, materials, and textures can remain referenced and alive. A naive recursive disposer can also destroy a texture shared by another asset. Decide whether the asset loader/cache owns resources globally or whether each scene owns independent copies.

For scene-owned independent assets, traverse and gather unique geometries, materials, and textures, then dispose each once when the scene ends. Stop animation actions and release mixer caches according to their documented lifecycle. Remove associated event handlers or selection records so application references do not keep an obsolete hierarchy alive. This turns loading and unloading into a balanced process.

Keep provenance with the asset too: author, source, license, and any required attribution. This is useful engineering metadata as well as responsible publishing. The included course labs use generated assets so they run without external model dependencies; the loading example is an integration path for a model you supply. A failed or unavailable asset should be a handled state, not a prerequisite that prevents the rest of the lesson from working.

## Cleanup and licensing

Removing the imported root from a scene does not automatically dispose GPU resources. Traverse and dispose geometries, materials, and owned textures, accounting for sharing. Animation mixers need their actions stopped and caches uncached as appropriate. Keep asset author, source URL, and license with the project. Do not embed a random downloaded model without understanding the rights and attribution terms.

Bounds can also reveal an intentionally distant pivot. A door may have geometry extending to one side of its hinge origin; recentering its vertices would change the meaningful rotation point. A product-viewer normalization and an articulated-model authoring convention need different policies. Prefer placing a wrapper or changing camera framing before destructively rewriting imported vertex positions. If you do recenter geometry, account for its relationship to animation, child transforms, skinning, and other shared users. A visually convenient center is not automatically the semantically correct origin for every object in the hierarchy.

**Optional application:** export a simple animated object from your preferred DCC tool, load it into the course scene helper, and frame it from its bounds. Then test a failed URL and a scene change during loading. A reliable error and lifecycle path is part of a complete asset integration.
