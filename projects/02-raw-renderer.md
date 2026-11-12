# Project 2 — A small WebGL renderer

**Prerequisites:** lessons 11–18. **Working references:** labs 05–08 and `webgl.js`. **Goal:** understand an entire frame without a scene library.

## Build sequence

Begin with the indexed cube. Reuse one geometry and program for two objects with different model matrices. Keep projection and view shared, and update the model/MVP uniforms before each draw. Add a camera orbit with explicit yaw/pitch/distance state.

Render the scene into a color texture with a matching depth attachment. Apply the two-pass filter lab’s fullscreen sampling to present it. This combines the complete cube and framebuffer references; label all target dimensions and recreate attachments on resize.

Then add a directional shadow map as an optional advanced stage: light-view depth pass, projected lookup, comparison, modest bias, and a debug view of the shadow target. Follow lesson 17’s derivation. The supplied filter lab does not pretend to implement a shadow map already.

## Reference solution and explanation

`06-webgl-cube.js` supplies face records, indices, depth, transforms, and diffuse normals. `08-framebuffer.js` supplies valid attachment setup and an input/output-separated filter. `math.js` supplies a tested camera/projection convention. Use these complete components before inventing a generic engine layer.

## Finish criteria

Compile/link errors are readable. Resources have owners. Resize updates projection, buffer dimensions, viewport, and targets. Opaque rendering remains correct under object draw-order changes. Leaving and reentering the scene does not leave animation loops or buffers behind.

## Extension

Add a glyph texture or a sprite pass, then compare individual draws with instanced quads. Profile draw submission and pixel cost separately.
