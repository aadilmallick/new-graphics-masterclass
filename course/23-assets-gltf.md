# Models, textures, and the asset pipeline

Generated geometry teaches the mechanism; authored assets let you build complex scenes efficiently. Loading a model is not just downloading vertices. It can involve materials, textures, skeletons, animations, compressed data, coordinate conventions, and resource ownership.

**Connection:** the scene-graph and material labs show what a loaded hierarchy will contain. **Reading bridge:** Eck §5.2.5 and Appendix B; [loading glTF](https://threejs.org/manual/en/load-gltf.html) and [GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html).

## Why glTF

glTF is an interchange format designed for efficient delivery of 3D scenes. A `.gltf` file is JSON and can reference separate buffers and images. A `.glb` is a binary container that can package data together, though you should still inspect whether external references exist. The format has well-defined PBR material conventions and supports hierarchies, animation, morph targets, and skinning.

OBJ is useful for simple geometry interchange but does not provide the same complete modern scene and animation model. Loading an OBJ plus MTL and textures requires matching all those references. Prefer glTF for a new web delivery pipeline unless a specific asset or tool requires another format.

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

## Framing and normalization

Use `Box3().setFromObject(root)` after world transforms are current to inspect bounds. Compute center and size, then choose camera framing or an explicit root transform. Avoid blindly scaling every asset to one unit: a chair and a building should retain meaningful relative scale if they belong to the same world.

Three.js commonly uses +Y up and a right-handed convention. DCC applications may have different authoring axes, but exporters often convert. Verify rather than applying another automatic 90° rotation on top. A negative scale can affect handedness and culling. Keep a clean wrapper group for scene placement so imported animation transforms remain intact.

## Compression and delivery

Geometry compression such as Draco or Meshopt reduces transfer size at a decoding cost and requires the appropriate loader configuration and decoder resources. Texture compression such as KTX2/Basis targets GPU-friendly formats after capability detection. JPEG or WebP reduces download size but is often expanded to much larger GPU storage. Network size and GPU memory are different budgets.

Choose texture resolution from expected screen coverage and material needs. A tiny prop usually does not need several 4K maps. Generate mipmaps appropriately. Packed channels can save fetches and storage when format conventions align. Keep color-space metadata correct after any image-processing step.

## Authoring checklist in practical terms

In Blender or another DCC tool, check object origins, scale, normals, UV seams, material assignments, and animation names before export. Apply destructive operations only when their effects on rigs and animation are understood. Export a small sample early, verify it in the target renderer, then build the full asset pipeline. Tangent-space normal maps need compatible tangent conventions and texture orientation.

Give files stable paths and names. Verify the production server serves binary assets with correct paths and that deployment includes decoder resources. A model working locally does not prove an external texture URL will permit cross-origin access in production.

## Cleanup and licensing

Removing the imported root from a scene does not automatically dispose GPU resources. Traverse and dispose geometries, materials, and owned textures, accounting for sharing. Animation mixers need their actions stopped and caches uncached as appropriate. Keep asset author, source URL, and license with the project. Do not embed a random downloaded model without understanding the rights and attribution terms.

**Optional application:** export a simple animated object from your preferred DCC tool, load it into the course scene helper, and frame it from its bounds. Then test a failed URL and a scene change during loading. A reliable error and lifecycle path is part of a complete asset integration.
