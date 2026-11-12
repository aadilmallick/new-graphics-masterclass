# Particles, instancing, and data-driven worlds

Many impressive scenes are built from a simple rule repeated thousands of times. The challenge is representing that repetition economically and making each element’s variation intentional. Instancing, points, and particles are related tools with different tradeoffs.

**Experiment:** [A city in one mesh](#/lab/instancing). **Later:** [native compute particles](#/lab/webgpu-particles). **Reading bridge:** Eck §§5.3.1, 7.5.3; [instanced drawing](https://webglfundamentals.org/webgl/lessons/webgl-instanced-drawing.html).

## Begin with the expensive version so the abstraction has a purpose

Imagine building a street with a hundred identical bollards. The straightforward program creates a geometry, material, and mesh inside a loop. It works, but it answers three different questions with one repeated construction: what is the bollard's shape, what surface does it have, and where is this particular bollard? Only the last answer needs to differ.

The first improvement is to create one geometry and one material outside the loop, then let many meshes reference them. That already saves duplicate resource storage. However, the renderer still sees many object records and commonly submits many draws. Instancing takes the next step: describe the common shape once and send an array of placements as data belonging to one repeated draw.

Here is an integration fragment for an initialized Three.js scene. It isolates that transition without adding lights, camera setup, or event handling; those are supplied by the complete city lab:

```js
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({ color: '#82ebcc' });
const buildings = new THREE.InstancedMesh(geometry, material, 3);
const placement = new THREE.Object3D();
for (let i = 0; i < 3; i++) {
  placement.position.set(i * 2 - 2, 0.5, 0);
  placement.scale.set(1, 1, 1);
  placement.updateMatrix();
  buildings.setMatrixAt(i, placement.matrix);
}
buildings.instanceMatrix.needsUpdate = true;
scene.add(buildings);
```

The geometry remains centered around its own origin. A unit box therefore extends half a unit below its local center. Positioning its center at Y = 0.5 places its base at ground height zero. This small geometric detail explains the later formula `height / 2`; it is not an unexplained magic adjustment.

The temporary object named `placement` is not added to the scene. It is a convenient matrix builder. Each iteration changes its transform properties, asks it to calculate a matrix, and copies that matrix into one instance slot. Reusing it avoids allocating a new temporary object for every placement. The uploaded matrix data remains separate from this temporary object afterward.

## What instancing saves

Without batching, 900 separate meshes can require many JavaScript object traversals, state decisions, and draw submissions. `InstancedMesh` stores one geometry and material plus a transform per instance. The renderer can submit repeated geometry in fewer draws. Every visible vertex and fragment still costs work. Shadow passes, additional material passes, and lights can add draws, so “one mesh” does not imply exactly one total frame draw.

The city lab creates 900 instances of one box. An `Object3D` temporarily holds each building’s position and scale, `updateMatrix()` builds its transform, and `setMatrixAt(i, matrix)` writes it into the instance buffer. After updates:

```js
mesh.instanceMatrix.needsUpdate = true;
if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
mesh.computeBoundingSphere();
```

The update flags request GPU upload; recomputing bounds keeps culling consistent with changed transforms. Reuse temporary objects rather than creating hundreds of vectors inside every frame. If only a portion changes, use the library’s supported update-range facilities deliberately.

## Follow one city building from index to pixels

The complete lab arranges 900 buildings in 30 columns and 30 rows. For instance index 61, the remainder of dividing by 30 is 1, so its column coordinate before centering is 1. The integer quotient is 2, so its row is 2. Subtracting 14.5 centers the full grid between its outermost positions: X becomes -13.5 and Z becomes -12.5 before spacing is applied.

With spacing 0.8, the horizontal center is `(-10.8, -10.0)` in the XZ ground plane. The geometry is scaled to width and depth 0.55, leaving a gap of 0.25 units between neighboring buildings along each grid direction. Its height comes from the deterministic sine expression. Once that height is known, the center is placed at half its height so the scaled box sits on the floor.

The color formula depends on height as well. Taller buildings shift both hue and lightness. This creates correlated variation rather than independent random noise in every property. Correlation is often visually useful: it gives the repeated structures an underlying organization. You could instead make color represent a meaningful measured quantity, turning the same renderer into a data visualization.

An instance matrix has sixteen floating-point entries. At four bytes per float, 900 matrices occupy 57,600 bytes, about 56.25 KiB. An RGB float color per instance adds 10,800 bytes. Those are small compared with many large texture resources, but frequent uploads can still matter. The arithmetic lets you estimate the data transfer rather than treating “many objects” as an inherently mysterious cost.

## Capacity, visible count, and bounds

The `InstancedMesh` constructor's count establishes the intended instance capacity in this example. The lab also changes `mesh.count` to draw fewer of the available records. Lowering the visible count does not mean all underlying instance data suddenly disappears. It changes how much of the initialized data participates in drawing.

Keep the statistics display equally precise. A count labeled visible instances means the requested leading records in this demonstration, not necessarily the number of buildings whose pixels survive clipping and depth tests. Some can lie outside the camera or behind other geometry. Application counts, submitted primitive counts, and final visible sample contributions describe different stages of the pipeline.

Bounding volumes summarize where geometry might be so the renderer can skip work outside the view. If placements change, old bounds may no longer contain the instances. A box whose vertices are correct but whose bounds are wrong can vanish unexpectedly near the edge of the camera. The city recomputes its bounding sphere after placement changes and after changing visible count.

This is a useful example of a dependency that is easy to overlook. Updating instance matrices affects more than GPU upload. It can affect visibility queries, collision proxies, selection, and spatial indexing. Keep a short list of those dependent structures whenever you add a new kind of dynamic data to an engine.

## Variation from data

A deterministic formula can assign height, color, rotation, and phase from an instance index. The city uses a simple sine-derived pattern for reproducibility, not as a claim of statistically uniform randomness. For controlled random distributions, use a seeded generator or store stable random values so the scene does not rearrange on every render.

Uniformly sampling radius produces too many points near the center of a disk. Area grows with $r^2$, so a uniform-area disk sample uses $r=R\sqrt{u}$ with `u` uniform from 0 to 1 and angle $2\pi v$. For a sphere surface, choose Z uniformly from -1 to 1 and an independent azimuth, then reconstruct the horizontal radius. Sampling each coordinate uniformly in a cube and normalizing has its own distribution and should not be assumed uniform on a sphere.

## Distributions are part of the visual model

Suppose you want uniformly distributed stars inside a circular region of radius ten. Uniformly choosing radius from zero to ten allocates the same number of samples to the central band of width one as to the outer band of width one. But the outer band has much more area. The center therefore becomes denser per unit area.

The disk of radius r occupies a fraction `r*r/(R*R)` of the total area. To make a uniform random number u represent that area fraction, solve `u = r*r/(R*R)`. Taking square roots gives `r = R*sqrt(u)`. At u = 0.25 and R = 10, radius is 5: the inner half-radius disk contains one quarter of the total area, which is exactly the intended probability.

This complete console experiment illustrates the difference without requiring a renderer:

```js
const radius = 10;
for (const u of [0, 0.25, 0.5, 0.75, 1]) {
  console.log({ areaFraction: u, radialPosition: radius * Math.sqrt(u) });
}
```

The particle lab's deterministic angular sequence avoids using a fresh random angle every frame. A seeded random generator is another useful approach when you need both irregularity and reproducibility. Reproducibility helps debugging because you can compare the same initial configuration before and after a change.

## Why repeating a mesh is different from animating particles

The city is mostly static data. The frame loop does not need to recalculate all 900 transforms just because time advances. A particle system, by contrast, usually updates state such as position or age. Its rendering might use the same instancing mechanism, but its state evolution is an additional algorithm.

Consider a simple CPU particle with position `(1,2,0)` and velocity `(0.5,-1,0)` measured in units per second. Over 0.1 seconds its displacement is `(0.05,-0.1,0)`, so its new position is `(1.05,1.9,0)` under constant velocity. This calculation must be repeated for each particle, then the new data must reach the renderer. Instancing can reduce the number of draw submissions while leaving this update cost unchanged.

If acceleration is present, choose an integration method and time policy. Do not merely add a random vector every rendered frame unless frame-dependent jitter is actually the desired effect. Lifetime is also time data: age increases by seconds, and an expiration policy decides whether to respawn, hide, or recycle a record. A particle pool reuses records rather than constantly creating and destroying objects.

## Simulation placement

CPU updates are simple and flexible for modest counts, but uploading all positions every frame has a cost. WebGL can update state through render-to-texture or transform feedback. WebGPU compute can update storage buffers directly, then render from them without CPU readback. GPU simulation is especially useful when each update has regular parallel structure and results remain on the GPU.

For neighbor-dependent systems, a naive all-pairs interaction is $O(N^2)$: doubling particles quadruples pair checks. Spatial grids, sorting, or approximate fields can reduce the work. Instancing alone does not change simulation complexity.

## Points, sprites, and instanced quads

`THREE.Points` renders a point primitive per vertex and can be efficient for stars or distant particles. Point-size limits depend on implementation. A point does not provide arbitrary large billboard geometry everywhere. Instanced quads use two triangles per particle and let you control shape, rotation, size, and UVs more generally.

A particle is an element with state over time: position, velocity, age, lifetime, size, color, or other parameters. The renderer representation can be points, quads, meshes, or volumes. Separate simulation state from visual representation so one can change without rewriting the other.

## Choose a particle's shape from its job

A distant star may occupy a fraction of a pixel and need little geometric detail. A smoke puff occupies a broad translucent area and needs a soft billboard. A tumbling leaf needs orientation and perhaps actual mesh shape. Representing all three with the same primitive is convenient only until its limitations become visible.

An instanced quad often uses six vertex invocations per particle, two triangles, and a fragment mask that makes the rectangular geometry appear circular. At 8,192 particles, that is 49,152 vertex invocations before considering implementation optimizations. The number of fragments depends on projected size and overlap, which can vary far more dramatically than the vertex count.

If a thousand translucent particles each cover one tenth of the screen, their combined potential fragment coverage is a hundred screenfuls before depth rejection and other effects. This is why enlarging a smoke effect can slow a scene even when the particle count and draw count remain unchanged. The visible workload is data size multiplied by how that data projects into the image.

## Transparency and overdraw

Thousands of overlapping translucent quads can shade the same pixels repeatedly. This **overdraw** can dominate cost even when the geometry is tiny and draw count is low. Additive blending avoids some ordering problems for glowing effects, but it changes the appearance: it accumulates light-like values and can saturate. Standard alpha particles often need depth-aware sorting or an order-independent technique.

Reduce particle screen size or count, render selected effects at lower resolution, use suitable depth testing, and keep shader work small. Measure before assuming the bottleneck is the number of JavaScript objects. A thousand tiny points and a thousand full-screen smoke billboards are completely different workloads.

## Transparency is a model, not a universal switch

Ordinary alpha blending describes a source covering part of the destination. It is order-dependent: red over blue generally differs from blue over red. Additive blending accumulates contributions and is useful for sparks or luminous particles, but it cannot represent opaque smoke merely by changing a texture. Alpha testing discards samples below a threshold and can avoid some sorting problems for cutout leaves, at the cost of hard coverage decisions unless antialiasing strategies are added.

Keep depth testing where it serves the effect, so particles hidden behind opaque walls need not show through. Depth writing is another decision: a nearly transparent quad should not necessarily block all later particles as if it were a solid rectangle. The right settings follow the intended compositing model rather than a memorized global recipe.

## Extend the city with a purpose

Selection adds another useful distinction. The renderer can treat hundreds of buildings as one instanced mesh while the application still treats each instance as a logical building with its own name or data. Keep that identity in an indexed application array and map a selected instance identifier back to it. Do not assume that batching requires every repeated element to lose individual meaning. Conversely, if users need to edit each building with complex independent behavior, decide how those authoring objects synchronize with the packed instance data. Rendering representation and editing representation can differ, provided their mapping is explicit. This separation lets a tool remain pleasant to use while retaining an efficient GPU-facing arrangement.

For an optional guided variation, clear a circular plaza in the middle of the city. Compute each grid location's distance from the origin and either lower the corresponding building or omit its active record. If you omit scattered records, compact active records into the leading part of the instance buffer before setting count; lowering count alone hides only a trailing sequence.

Place a focal object in that plaza, then choose building colors to frame it. This uses spatial math, data organization, and composition together. After the scene works, compare its static update policy with rewriting all transforms each frame. The comparison teaches which work is necessary and which work the program is performing merely because a frame loop exists.

**Optional application:** replace the city’s deterministic heights with a seeded distribution while preserving a central low region for a focal sculpture. This combines data generation with composition. Then compare a static city against one whose entire instance buffer is rewritten every frame to understand the update cost.
