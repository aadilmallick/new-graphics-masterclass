# A compute-to-render particle system

The previous lab brought a small result back to JavaScript to make computation visible. A simulation usually benefits from leaving its evolving state on the GPU. This chapter follows the complete path from initialized bytes to compute updates to instanced rendering.

**Experiment:** [8,192 moving particles](#/lab/webgpu-particles). **Source:** `labs/18-webgpu-particles.js`. **Reading bridge:** Eck §9.6.3; [Learn WebGPU particle system](https://learn-webgpu.com/en/tutorial/compute-graphics/particle-system).

## Understand the whole system before examining the shader

We want thousands of moving elements to follow the same update rule, remain visible, and respond to a few controls. The image is the final result, but the system has three separate responsibilities. Initialization creates an initial state. Simulation transforms old state into new state over time. Rendering turns the current state into pixels.

Keeping those responsibilities separate lets us change one without rewriting everything. We can render stationary data to debug the visual path. We can update a handful of values and read them back to debug the numerical rule. Only after both work do we connect thousands of updates directly to rendering without a CPU round trip.

The lab uses a two-dimensional central-force illustration. That choice keeps the state small and the force easy to inspect while still exercising real storage buffers, compute dispatch, instanced rendering, binding layouts, and per-frame command ordering. Its orbital appearance is a visual study, not a claim that numerical integration and reset rules preserve a physical astronomical system.

## Define the state

Each particle contains `position: vec2f` and `velocity: vec2f`. Each vec2 occupies eight bytes with eight-byte alignment, so one particle is 16 bytes. An array of 8,192 particles needs 131,072 bytes. Two ping-pong buffers need 262,144 bytes, excluding uniforms and rendering resources.

JavaScript initializes an approximately disk-like distribution with deterministic angles and square-root radius scaling. Tangential starting velocities create orbital-looking motion. These choices are an artistic initial condition, not a validated astrophysical simulation.

## Pack one particle and then scale the array

One particle's four float values are position X, position Y, velocity X, and velocity Y. If its position is `(0.5,0)` and velocity `(0,0.8)`, the host writes `[0.5,0,0,0.8]`. The shader's two vec2 members interpret exactly those sixteen bytes. Particle number i starts at float index `i * 4` or byte offset `i * 16`.

For particle number ten, the first position component is at byte 160. Its velocity begins eight bytes later, at 168. Particle eleven starts at byte 176. This small arithmetic is enough to verify host packing against the WGSL struct without relying on an opaque data helper.

At 8,192 particles, one buffer has 32,768 floats. Multiplying by four bytes gives 131,072 bytes, or 128 KiB. Two buffers use 256 KiB. The visible complexity of thousands of particles therefore does not imply enormous state storage in this particular model. Rendering cost can still be significant because every particle covers pixels and overlaps others.

## Examine the initial distribution

The lab assigns a deterministic angular sequence and a radius that increases with the square root of a normalized index. This spreads samples over a disk-like region rather than concentrating an equal count into each radial interval. A small inner radius prevents particles from beginning exactly at the singular center.

For each radius r, the initial velocity is tangential: its X component is proportional to negative sine of angle and its Y component to cosine. Dotting this velocity with the radial direction gives zero, so the initial motion is perpendicular to the radius. That is what makes the starting configuration look orbital rather than simply collapsing straight inward.

The speed uses the square root of attraction strength divided by radius as an illustrative central-force relationship. Changing the runtime attraction slider does not automatically regenerate those initial velocities. If attraction becomes weaker, existing velocities may be too large for the former orbit-like path; if it becomes stronger, paths can tighten or become more unstable. That response is a meaningful consequence of changing a parameter after initialization.

## Work through one update with actual numbers

Take position `(0.5,0)`, velocity `(0,0.8)`, attraction 0.35, and time step 0.01 seconds. Radius is 0.5, above the soft lower bound 0.15. Radius cubed is 0.125. Dividing position by that gives `(4,0)`, and multiplying by attraction gives `(1.4,0)` directed outward before the shader's subtraction. The resulting acceleration is `(-1.4,0)`.

Velocity changes by acceleration times time: `(-0.014,0)`. New velocity becomes `(-0.014,0.8)`. The shader then changes position using this new velocity, adding `(-0.00014,0.008)`. The new position is approximately `(0.49986,0.008)`. It has moved mostly tangentially while acquiring a small inward component.

This ordering is semi-implicit Euler. If position were updated from the old velocity first, the X component would remain 0.5 for this step, giving a different numerical method. Both are approximations to continuous motion. Naming the chosen method lets you reason about time-step sensitivity rather than treating shader arithmetic as an exact physical law.

The code's soft lower radius limits how large the denominator-driven acceleration can become near the center. It changes the force model there. The escape rule also changes physics: beyond radius 1.5, position and velocity are multiplied by 0.3. This keeps the demonstration visually bounded, but it does not conserve energy or angular momentum. Such choices are appropriate when clearly labeled as artistic stabilization.

## Separate old and new state

Compute reads buffer A and writes buffer B. The next frame reads B and writes A. This makes the update independent of whether one invocation runs before another. The shader bounds-checks its global index and writes one complete output record.

The force model uses acceleration toward the center proportional to $-p/\max(\|p\|,\epsilon)^3$. Multiplying position by inverse cubed distance gives inverse-squared magnitude because the position vector already contributes one distance factor. A soft lower radius prevents a singular acceleration at the center.

The update is semi-implicit Euler:

$$
v_{new}=v_{old}+a(p_{old})\Delta t,\qquad
p_{new}=p_{old}+v_{new}\Delta t.
$$

The shader also contracts particles that escape a chosen radius. This is a visual reset policy, not conservation of orbital energy. Naming that policy prevents a pleasing effect from being mistaken for a physical solver.

## Follow the buffer swap over three frames

Call the two storage buffers A and B. At initialization both contain the same values, so either could serve as the first input. With index zero, compute bind group zero reads A and writes B. The render pass binds the render group for B. After submission, the JavaScript index changes to one.

On the second frame, compute reads B and writes A. Rendering reads A, the newly computed result. Index changes back to zero. On the third frame the first arrangement repeats, but A now contains the updated state from frame two rather than the original initialization. The data evolves even though the identity of the two allocated resources alternates.

The two sets of compute bind groups are prepared once because their resource combinations are stable. The frame only selects which prepared group to use. Similarly, two render bind groups expose either A or B. Swapping a small integer and selecting existing bindings avoids recreating the buffers or bind groups on every frame.

This explicit pattern also reveals a common error: rendering the input instead of the output makes the visible state lag behind the newest update. Another error is swapping before choosing the compute group, which can read a different state than intended. Write the three-frame table before debugging a complicated visual effect; the intended dependency then becomes unambiguous.

## Compute then render in one command sequence

The command encoder records a compute pass writing B, ends it, then records a render pass reading B. The submitted sequence and resource usage rules establish the intended ordering. JavaScript does not map B or wait for every particle to return to the CPU.

The render shader uses `@builtin(instance_index)` to select a particle and `@builtin(vertex_index)` to select one of six quad corners. Each particle therefore becomes two triangles. A tiny local offset creates the billboard’s size. The fragment shader computes a radial alpha falloff and a speed-related color. The output uses a premultiplied additive style with blend factors chosen to accumulate its contributions.

## Understand why pass ordering is enough here

Within the compute pass, each invocation reads its own input record and writes its corresponding output record. There are no neighbor reads and no shared local totals. It needs no workgroup barrier. The separate input/output resources provide a simple old-state/new-state boundary.

The render pass follows the compute pass in the recorded command sequence and consumes the output under valid resource usage. JavaScript does not need to map the particle buffer or await one Promise per particle to establish this relationship. Keeping work on the GPU is precisely the benefit of organizing dependent passes in a single coherent frame.

If a future extension reads neighboring particles, the input must remain unchanged throughout the update. Ping-pong buffers already support that requirement. But if the extension writes shared grid counters or compacted lists, it introduces new coordination problems. Resource separation is helpful; it is not a universal substitute for analyzing every concurrent access.

## Turn one record into two triangles

The render vertex shader defines six corner coordinates covering a square. Vertex index selects a corner, while instance index selects a particle record. The final position is particle center plus a tiny scaled corner offset. Six requested vertices form two triangles per particle. There is no separate per-particle quad mesh object in JavaScript.

The corner's local coordinate is forwarded to the fragment stage. At the center of the square its interpolated value is near `(0,0)`. Near a corner, the squared radius exceeds one. The fragment alpha uses `max(0,1-dot(local,local))`, so it fades toward zero around a disk-shaped region within the quad. The geometry is rectangular, but its visible contribution is softened by the shader.

The shader also forwards speed, the length of velocity, as a color-mixing factor after clamping to the chosen interval. Faster particles become warmer in the demonstration. This is a visualization of a numerical quantity, not an effect caused by physical blackbody heating. Connecting appearance to state makes the simulation easier to inspect than assigning unrelated changing colors.

## Keep size and aspect meanings explicit

The position shader divides horizontal coordinates by the canvas aspect ratio. This keeps the two-dimensional simulation's equal X and Y distances visually comparable on a wide surface. Without that correction, a circular orbit-like pattern could become an ellipse simply because the panel is rectangular.

The quad offset uses a fixed simulation-space size, so its pixel size changes with drawing dimensions and framing. A production particle system may instead want a size in pixels or a perspective-scaled world size. Those are different design choices. Decide which behavior serves the effect before adding a slider named size.

Larger quads increase overdraw quickly. Doubling a particle's diameter can roughly quadruple its projected area. Even though compute still updates exactly 8,192 records, fragment work can rise substantially. This is a concrete reason to measure simulation and rendering separately.

## Uniforms and time

A 16-byte uniform stores time step, attraction strength, aspect, and padding. The lab clamps the simulation time step to limit large jumps. At a low frame rate, this deliberately slows the illustrative simulation rather than attempting unlimited catch-up. A production physical simulation would use a fixed-step accumulator and possibly interpolation, with a maximum catch-up budget.

Reduced motion sets the effective time step to zero. The particles remain visible without automatic movement. A separate speed slider allows freezing or adjusting the update. Rendering is still repeated in the course helper; an on-demand path could stop unnecessary frames when fully paused.

## Handle time as a policy rather than a side effect

The host receives elapsed seconds from the shared animation helper, multiplies by simulation speed, and clamps to 0.016. This avoids extremely large numerical steps after a pause or a slow frame. However, at a sustained low frame rate it also means simulation time progresses more slowly than wall-clock time. The lab chooses visual stability over real-time catch-up.

A physically motivated application might use fixed small steps in an accumulator and run several updates before a rendered frame. That would require additional dispatches or a shader time-integration loop, with a deliberate upper limit on catch-up work. A visual exhibit might instead pause when hidden and resume gently. The correct policy depends on what the simulation promises to represent.

For reduced motion, the effective time step becomes zero. Compute still copies equivalent state through the rule, and the image remains available without automatic motion. A further optimization could stop dispatching entirely while paused, but the educational implementation keeps the frame structure straightforward.

## Why ping-pong still matters for future extensions

For this central-force model, each particle depends only on its own old state, so an in-place design could be constructed carefully. Two buffers make the data flow explicit and prepare the implementation for neighbor-dependent rules such as flocking. Once neighbors are read, in-place updates generally risk races unless the algorithm has a proven synchronization structure.

For boids, begin with a naive reference implementation at small N, then use a spatial grid. For collisions, choose a broad phase to avoid testing all pairs. For fluids, distinguish stable integration, boundary treatment, pressure solving, and visual rendering. A large particle count alone does not imply a physically complete fluid model.

## Useful extensions

Add age and lifetime to recycle particles deterministically. Add a pointer-controlled attractor by converting the pointer into simulation coordinates. Store per-particle color or size if the extra bandwidth is justified. For 3D, use vec4-packed state or a carefully calculated struct, supply a camera transform, and choose a billboard basis from the camera.

Measure compute and render separately where possible. Increasing particle size can make fragment overdraw dominate even when the compute update is unchanged. Increasing neighbors per particle changes simulation cost. Different controls stress different parts of the pipeline.

## Add a controlled extension

To add a second attractor at position c, compute displacement `p.position - c` and apply the same kind of softened central contribution before integrating. Start with a weak force and a small deterministic dataset. Verify one step numerically, as above, before restoring thousands of particles.

Expose attractor coordinates in clearly named simulation units. Pointer control requires converting from CSS positions through the canvas rectangle into that same simulation frame. A screen-space coordinate of two hundred pixels cannot be used directly as a simulation position merely because both are numbers.

**Optional application:** add a second attractor and expose its position with accessible HTML controls. Keep the simulation data on the GPU, and use a stable small time step. Explain which buffer is input, which is output, and which one the render pass consumes on every frame.
