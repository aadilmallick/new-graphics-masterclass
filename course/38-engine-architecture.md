# Designing a small graphics engine

You do not need to replace Three.js to understand engine design. A small renderer built from explicit responsibilities can teach resource ownership, data flow, scheduling, and the tradeoffs hidden inside a larger library. The aim is a coherent system you can reason about, not an abstraction layer for every line of code.

**Working examples:** `labs/webgl.js`, `labs/three-scene.js`, `labs/webgpu.js`, and the website’s lab mounting/cleanup boundary.

## Separate the world from the frame

Scene data describes what exists: transforms, geometry references, material parameters, light descriptions, and simulation state. Frame preparation decides what is visible and which passes need it. Rendering encodes those passes. Input changes scene state; it should not casually issue half a render pass from an event handler.

A useful frame sequence is: collect input, advance simulation, update transforms/bounds, build visible draw lists, prepare resource updates, encode render passes, submit, and present status. Some tasks can overlap, but this ordering makes dependencies explicit. A fixed simulation step can run several times before one rendered frame.

## Resource ownership

Geometry, material programs, textures, targets, and devices have different lifetimes. Ten meshes can share one geometry. Removing one mesh should not delete that shared geometry. A scene-specific render target can be disposed when the scene ends. A global renderer or device may outlive every individual scene.

Use an ownership registry, reference counts, or explicit asset handles according to complexity. Do not let every mesh recursively destroy everything reachable through a material if those resources are shared elsewhere. The course helper deduplicates resources within one owned scene; a larger application needs ownership across scenes as well.

Async work needs the same discipline. A loader can finish after the user navigates away. Keep a scene generation token or cancellation signal; attach the result only if its requester is still current, otherwise dispose or cache it under an intentional policy. The website uses a route generation counter and cleans up late-mounted labs.

## Render lists and state sorting

An opaque list can be sorted to reduce state changes and exploit early depth rejection. A transparent list often needs distance ordering, with limitations for intersecting surfaces. A shadow list may contain only shadow casters visible to a light. UI overlays form another policy. The scene tree is not automatically the optimal order for every pass.

A material pipeline cache key should include shader structure and relevant fixed pipeline choices, such as target formats and sample count for WebGPU. Numeric uniform values belong in data, not the pipeline cache key. Conversely, changing a structural shader define may require a distinct compiled program.

## A render graph

A render graph expresses passes and resource dependencies. For example: shadow depth → scene HDR → bloom pyramid → composite → output. A particle update writes a storage buffer that the scene pass reads. A picking pass writes an ID target read by an occasional CPU request.

Name each pass’s inputs, outputs, dimensions, format, clear/load policy, and lifetime. Detect accidental read/write feedback. Resize dependent targets consistently. An advanced graph can reuse transient allocations when lifetimes do not overlap, but that optimization should follow a correct explicit graph.

## Data-oriented updates and ECS

An entity-component system, ECS, stores aspects such as transform, velocity, or renderable data separately and runs systems over matching components. It can improve organization and regular iteration for large simulations. It is not required for a small scene. A simple array of particle state is already a data-oriented design; a thousand class hierarchies can be less useful than one clear typed array.

Prefer structures that match the operations you need. CPU-friendly objects can be convenient for editing. GPU-friendly packed arrays can be better for uploading or computing. A translation layer between authoring state and GPU state can be worthwhile, but keep its update rules and ownership visible.

## Multiple backends

A backend abstraction might expose buffer creation, resource layouts, pass descriptions, and draw commands. WebGL and WebGPU differ enough that a one-to-one wrapper can become awkward: mutable state versus immutable pipeline descriptions, texture-unit samplers versus bind groups, and fragment-based GPGPU versus compute.

Abstract around your application’s actual needs, such as “draw this material family with these resources,” rather than claiming every native feature maps identically. Keep capability queries and fallback decisions near initialization. A scene that requires compute can offer a different experience on a lower-capability backend rather than a misleading identical guarantee.

## Testing an engine

Use mathematical tests for transforms, intersections, and layout calculations. Use small render scenes for visual correctness and shader compilation. Use lifecycle tests for repeated load/unload and memory stability. Use representative performance scenes for regression trends. A screenshot alone cannot prove memory layout, and a passing matrix test cannot prove a material looks correct.

**Optional application:** build a raw renderer with four resource types—geometry, material, object, pass—and one shadow or filter pass. Add a loader generation token and explicit disposal. Stop adding abstractions when the next feature remains clear and reviewable without them.
