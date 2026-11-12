# Project 5 — A native GPU simulation

**Prerequisites:** lessons 31–35. **Working references:** labs 16–18 and 20. **Goal:** keep a complete simulation/render loop on the GPU.

## Build sequence

First run the eight-number compute example and compare its output with JavaScript. Then inspect the particle struct byte layout and two storage buffers. Follow one frame on paper: A is read, B is written, B is rendered, roles swap.

Add a second attractor or age/lifetime fields. Recalculate alignment and stride rather than appending numbers blindly. Keep the bounds check and a stable small time step. For a neighbor-dependent extension, retain separate old/new buffers and introduce spatial organization before attempting a huge count.

Expose numeric parameters with native HTML controls. Add a deterministic reset so visual comparisons use the same initial state. Handle unavailable adapters and report shader/validation errors without a silent empty canvas.

## Reference solution and explanation

`18-webgpu-particles.js` is the complete compute-to-render reference. `17-webgpu-compute.js` shows asynchronous staging readback for validation. `20-webgpu-cube.js` supplies a complete 3D camera/depth/texture path if you move the simulation into 3D.

## Finish criteria

Document every buffer’s size, usage, binding, and owner. No per-frame particle readback is required. The renderer consumes the newly computed output. A small CPU reference agrees within a chosen tolerance. Device teardown and loss have explicit policies.

## Extension

Add a tiled image-processing compute kernel or a histogram. Explain barrier participation and global stage boundaries before optimizing workgroup dimensions.
