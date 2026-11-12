# Particles, instancing, and data-driven worlds

Many impressive scenes are built from a simple rule repeated thousands of times. The challenge is representing that repetition economically and making each element’s variation intentional. Instancing, points, and particles are related tools with different tradeoffs.

**Experiment:** [A city in one mesh](#/lab/instancing). **Later:** [native compute particles](#/lab/webgpu-particles). **Reading bridge:** Eck §§5.3.1, 7.5.3; [instanced drawing](https://webglfundamentals.org/webgl/lessons/webgl-instanced-drawing.html).

## What instancing saves

Without batching, 900 separate meshes can require many JavaScript object traversals, state decisions, and draw submissions. `InstancedMesh` stores one geometry and material plus a transform per instance. The renderer can submit repeated geometry in fewer draws. Every visible vertex and fragment still costs work. Shadow passes, additional material passes, and lights can add draws, so “one mesh” does not imply exactly one total frame draw.

The city lab creates 900 instances of one box. An `Object3D` temporarily holds each building’s position and scale, `updateMatrix()` builds its transform, and `setMatrixAt(i, matrix)` writes it into the instance buffer. After updates:

```js
mesh.instanceMatrix.needsUpdate = true;
if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
mesh.computeBoundingSphere();
```

The update flags request GPU upload; recomputing bounds keeps culling consistent with changed transforms. Reuse temporary objects rather than creating hundreds of vectors inside every frame. If only a portion changes, use the library’s supported update-range facilities deliberately.

## Variation from data

A deterministic formula can assign height, color, rotation, and phase from an instance index. The city uses a simple sine-derived pattern for reproducibility, not as a claim of statistically uniform randomness. For controlled random distributions, use a seeded generator or store stable random values so the scene does not rearrange on every render.

Uniformly sampling radius produces too many points near the center of a disk. Area grows with $r^2$, so a uniform-area disk sample uses $r=R\sqrt{u}$ with `u` uniform from 0 to 1 and angle $2\pi v$. For a sphere surface, choose Z uniformly from -1 to 1 and an independent azimuth, then reconstruct the horizontal radius. Sampling each coordinate uniformly in a cube and normalizing has its own distribution and should not be assumed uniform on a sphere.

## Points, sprites, and instanced quads

`THREE.Points` renders a point primitive per vertex and can be efficient for stars or distant particles. Point-size limits depend on implementation. A point does not provide arbitrary large billboard geometry everywhere. Instanced quads use two triangles per particle and let you control shape, rotation, size, and UVs more generally.

A particle is an element with state over time: position, velocity, age, lifetime, size, color, or other parameters. The renderer representation can be points, quads, meshes, or volumes. Separate simulation state from visual representation so one can change without rewriting the other.

## Transparency and overdraw

Thousands of overlapping translucent quads can shade the same pixels repeatedly. This **overdraw** can dominate cost even when the geometry is tiny and draw count is low. Additive blending avoids some ordering problems for glowing effects, but it changes the appearance: it accumulates light-like values and can saturate. Standard alpha particles often need depth-aware sorting or an order-independent technique.

Reduce particle screen size or count, render selected effects at lower resolution, use suitable depth testing, and keep shader work small. Measure before assuming the bottleneck is the number of JavaScript objects. A thousand tiny points and a thousand full-screen smoke billboards are completely different workloads.

## Simulation placement

CPU updates are simple and flexible for modest counts, but uploading all positions every frame has a cost. WebGL can update state through render-to-texture or transform feedback. WebGPU compute can update storage buffers directly, then render from them without CPU readback. GPU simulation is especially useful when each update has regular parallel structure and results remain on the GPU.

For neighbor-dependent systems, a naive all-pairs interaction is $O(N^2)$: doubling particles quadruples pair checks. Spatial grids, sorting, or approximate fields can reduce the work. Instancing alone does not change simulation complexity.

**Optional application:** replace the city’s deterministic heights with a seeded distribution while preserving a central low region for a focal sculpture. This combines data generation with composition. Then compare a static city against one whose entire instance buffer is rewritten every frame to understand the update cost.
