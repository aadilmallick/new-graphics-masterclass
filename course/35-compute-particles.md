# A compute-to-render particle system

The previous lab brought a small result back to JavaScript to make computation visible. A simulation usually benefits from leaving its evolving state on the GPU. This chapter follows the complete path from initialized bytes to compute updates to instanced rendering.

**Experiment:** [8,192 moving particles](#/lab/webgpu-particles). **Source:** `labs/18-webgpu-particles.js`. **Reading bridge:** Eck §9.6.3; [Learn WebGPU particle system](https://learn-webgpu.com/en/tutorial/compute-graphics/particle-system).

## Define the state

Each particle contains `position: vec2f` and `velocity: vec2f`. Each vec2 occupies eight bytes with eight-byte alignment, so one particle is 16 bytes. An array of 8,192 particles needs 131,072 bytes. Two ping-pong buffers need 262,144 bytes, excluding uniforms and rendering resources.

JavaScript initializes an approximately disk-like distribution with deterministic angles and square-root radius scaling. Tangential starting velocities create orbital-looking motion. These choices are an artistic initial condition, not a validated astrophysical simulation.

## Separate old and new state

Compute reads buffer A and writes buffer B. The next frame reads B and writes A. This makes the update independent of whether one invocation runs before another. The shader bounds-checks its global index and writes one complete output record.

The force model uses acceleration toward the center proportional to $-p/\max(\|p\|,\epsilon)^3$. Multiplying position by inverse cubed distance gives inverse-squared magnitude because the position vector already contributes one distance factor. A soft lower radius prevents a singular acceleration at the center.

The update is semi-implicit Euler:

$$
v_{new}=v_{old}+a(p_{old})\Delta t,\qquad
p_{new}=p_{old}+v_{new}\Delta t.
$$

The shader also contracts particles that escape a chosen radius. This is a visual reset policy, not conservation of orbital energy. Naming that policy prevents a pleasing effect from being mistaken for a physical solver.

## Compute then render in one command sequence

The command encoder records a compute pass writing B, ends it, then records a render pass reading B. The submitted sequence and resource usage rules establish the intended ordering. JavaScript does not map B or wait for every particle to return to the CPU.

The render shader uses `@builtin(instance_index)` to select a particle and `@builtin(vertex_index)` to select one of six quad corners. Each particle therefore becomes two triangles. A tiny local offset creates the billboard’s size. The fragment shader computes a radial alpha falloff and a speed-related color. The output uses a premultiplied additive style with blend factors chosen to accumulate its contributions.

## Uniforms and time

A 16-byte uniform stores time step, attraction strength, aspect, and padding. The lab clamps the simulation time step to limit large jumps. At a low frame rate, this deliberately slows the illustrative simulation rather than attempting unlimited catch-up. A production physical simulation would use a fixed-step accumulator and possibly interpolation, with a maximum catch-up budget.

Reduced motion sets the effective time step to zero. The particles remain visible without automatic movement. A separate speed slider allows freezing or adjusting the update. Rendering is still repeated in the course helper; an on-demand path could stop unnecessary frames when fully paused.

## Why ping-pong still matters for future extensions

For this central-force model, each particle depends only on its own old state, so an in-place design could be constructed carefully. Two buffers make the data flow explicit and prepare the implementation for neighbor-dependent rules such as flocking. Once neighbors are read, in-place updates generally risk races unless the algorithm has a proven synchronization structure.

For boids, begin with a naive reference implementation at small N, then use a spatial grid. For collisions, choose a broad phase to avoid testing all pairs. For fluids, distinguish stable integration, boundary treatment, pressure solving, and visual rendering. A large particle count alone does not imply a physically complete fluid model.

## Useful extensions

Add age and lifetime to recycle particles deterministically. Add a pointer-controlled attractor by converting the pointer into simulation coordinates. Store per-particle color or size if the extra bandwidth is justified. For 3D, use vec4-packed state or a carefully calculated struct, supply a camera transform, and choose a billboard basis from the camera.

Measure compute and render separately where possible. Increasing particle size can make fragment overdraw dominate even when the compute update is unchanged. Increasing neighbors per particle changes simulation cost. Different controls stress different parts of the pipeline.

**Optional application:** add a second attractor and expose its position with accessible HTML controls. Keep the simulation data on the GPU, and use a stable small time step. Explain which buffer is input, which is output, and which one the render pass consumes on every frame.
