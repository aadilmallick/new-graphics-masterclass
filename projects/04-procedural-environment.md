# Project 4 — A procedural environment

**Prerequisites:** lessons 20 and 26–30. **Working references:** labs 11, 14, and 21. **Goal:** use functions to create a coherent visual world.

## Build sequence

Start with the ocean. Change wave parameters while maintaining derivative-consistent normals. Create a restrained height/slope color treatment. Set a camera that shows both near detail and a clear horizon or boundary.

Add one supporting form—a procedural island, sculpture, or distant silhouette—and use atmosphere to separate depth. Keep coordinate spaces explicit. Expand bounds when shader displacement exceeds the original mesh.

Add a post-processing chain only after the base scene reads clearly. Use a final output transform and a small purposeful bloom contribution. Provide low/high quality settings that change subdivisions, DPR, shadows, or effect resolution under an explicit policy.

## Reference solution and explanation

`11-shader-ocean.js` contains the complete wave/normal implementation. `14-post-processing.js` contains the complete WebGL composer lifecycle. `21-ray-marching.js` is a separate complete distance-field scene for an alternative geometric representation; combining it with raster depth is a further project, not automatic.

## Finish criteria

The visual brief is expressible in one sentence. Motion can pause and respects reduced motion. Normals agree with deformation. The final scene has measured frame-time behavior and no unexplained shader or color warnings.

## Extension

Port the wave rule to TSL and compare images under equivalent camera and color settings. Record any backend/material differences instead of assuming syntax translation alone establishes equivalence.
