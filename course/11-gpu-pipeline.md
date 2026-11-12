# The GPU and the programmable pipeline

The CPU runs your JavaScript, organizes the application, and requests work. A GPU is designed to process many similar pieces of work efficiently. Rendering a million sample colors has a great deal of this repeated structure. The GPU is not simply “a faster CPU,” and uploading data or reading results back has costs.

**Experiment:** [First GPU triangle](#/lab/webgl-triangle). **Reading bridge:** Eck §6.1; [WebGL Fundamentals](https://webglfundamentals.org/webgl/lessons/webgl-fundamentals.html) and [state diagram](https://webglfundamentals.org/webgl/lessons/resources/webgl-state-diagram.html).

## Begin with the division of labor

Imagine drawing a large image with a JavaScript loop. For each sample, the loop could test geometry, determine color, and write four channels. This is a perfectly understandable starting renderer, and our CPU ray tracer later does something similar. The challenge is the amount of regular repeated work required for interactive high-resolution output.

A GPU is organized to execute many related invocations efficiently. Instead of having JavaScript individually calculate every visible sample, we describe reusable programs and provide arrays of data. The GPU applies those programs across vertices or covered fragments. JavaScript remains responsible for application behavior, resource setup, input, and scheduling.

This is not a promise that moving any function to the GPU makes it faster. Preparing data, transferring it, and retrieving results all have costs. A tiny computation whose answer is needed immediately by JavaScript may be faster and simpler on the CPU. Rendering is a good fit because a large result can remain in GPU-accessible image storage and be presented without copying every intermediate value back.

The practical question is therefore not simply which processor is faster. It is which representation and execution pattern suit the task. A scene graph with irregular editing interactions often benefits from CPU objects. Large regular arrays of vertex or particle data often benefit from GPU processing. Most real applications use both and manage the boundary deliberately.

## A pipeline is a sequence of responsibilities

For a conventional triangle draw:

1. JavaScript prepares buffers and render state.
2. A vertex shader computes a clip-space position and other outputs for each vertex invocation.
3. Primitive assembly groups vertices into triangles; clipping handles boundaries.
4. Rasterization determines covered samples and interpolation values.
5. A fragment shader computes candidate colors and possibly other outputs.
6. Depth, stencil, blending, and related operations determine what is stored.

Hardware can optimize, overlap, or run some tests early. This is a conceptual flow, not a promise of a strict one-fragment-one-pixel execution schedule.

![Programmable rendering pipeline](../public/diagrams/gpu-pipeline.svg)

The **vertex shader** does not position an entire object in one invocation. It runs over vertex inputs, and each invocation produces one output record. The **fragment shader** does not run JavaScript or query the DOM. It runs GLSL code with the data the pipeline makes available.

## Tell one triangle's story from beginning to end

Suppose our scene contains a triangle with three local positions and three colors. JavaScript creates a typed array holding those records. It allocates a WebGL buffer and uploads the bytes. It defines a layout telling WebGL where position ends and color begins. It compiles two shaders and links them into a program.

At draw time, a vertex invocation receives one position and color according to the input layout. It applies the transform math needed for that position and writes clip coordinates. It also passes a color output forward. The three transformed vertices define a primitive, which is clipped and rasterized.

For an interior sample, the rasterizer computes interpolation values from the vertex outputs. The fragment invocation receives the interpolated color, writes an output value, and the pipeline applies relevant visibility and blend policies. If the contribution survives, it updates the attachment that will become part of the presented image.

No stage needed a built-in concept called triangle material color gradient. The gradient emerged because a vertex program supplied three different values and the rasterizer interpolated them for a fragment program. Understanding these responsibilities lets you change one mechanism at a time instead of assuming a single drawing command contains every visual feature.

## Four routes into shader data

An **attribute** provides per-vertex inputs, read from buffers according to a layout. A **uniform** supplies values constant across a draw, such as a camera matrix. A **texture** provides sampled data accessible by coordinates. A **varying** connects a vertex output to interpolated fragment input. In WebGL 2 GLSL, both stage interfaces use `in` and `out`; older examples use `attribute`, `varying`, and `gl_FragColor`.

Imagine a JavaScript array of position and color records. You upload it once to a buffer. You tell WebGL which bytes form a position and which form a color. Your vertex shader computes a position and forwards color. The rasterizer interpolates color. The fragment shader writes it. Changing a uniform can animate every vertex without rewriting the vertex buffer.

## Attributes are streams, not shader-side JavaScript objects

A JavaScript vertex object might look like `{position:[x,y],color:[r,g,b]}`. WebGL does not send that property dictionary into a shader invocation. You pack the values into bytes and describe how each attribute reads them. The vertex shader receives typed variables such as a `vec2` position and `vec3` color.

For the course triangle, each record contains five floats. A 32-bit float occupies four bytes, so the record stride is twenty bytes. Position reads eight bytes starting at offset zero; color reads twelve bytes starting at offset eight. The next vertex begins twenty bytes after the current one. These numbers are a data contract shared by CPU preparation and GPU input.

Changing the JavaScript object layout without changing the attribute description would break that contract. A buffer has no intrinsic knowledge that its first two numbers are coordinates. The same byte store can be interpreted differently by different layouts where the API permits. This flexibility is powerful, but it makes explicit layout arithmetic essential.

## Uniforms vary between draws rather than between vertices

A camera matrix should be shared by many vertex invocations in one draw. Repeating it in every vertex record would waste storage and complicate updates. A uniform supplies shared shader parameters that JavaScript sets before drawing. Each invocation reads the same uniform values for that draw.

This does not mean a uniform is constant for the entire application. The angle uniform can change each frame. A model matrix can change between two object draws in the same frame. The key distinction is the granularity of the input: one selected value for a draw versus different attribute values across vertex inputs.

The triangle lab's slider changes an angle variable. During the next render, JavaScript uploads that number with `uniform1f`. The vertex shader uses it to rotate every position. The buffer remains unchanged. This demonstrates why shaders are useful for transformations: a small parameter update can affect many vertices without uploading a new position array.

## Varyings bridge stages through interpolation

A vertex shader output is not usually passed unchanged to every fragment. For a floating-point color, the rasterizer calculates a value appropriate to each covered sample. A fragment near one corner receives more influence from that corner's output, while a fragment near the center receives a mixture.

In WebGL 2 GLSL, the vertex stage declares an `out` variable and the fragment stage a matching `in` variable. The word varying remains useful for the conceptual role even though the older GLSL `varying` keyword is not the syntax used in these shaders. Names, types, and interpolation declarations must form a compatible interface.

A vertex normal can be passed this way, but the interpolated normal generally needs normalization before lighting. A discrete ID usually should not be smoothly mixed into meaningless fractional IDs. The interpolation policy follows the data's meaning. The mechanism is general; choosing its correct interpretation is part of shader design.

## Textures provide a different access pattern

An attribute arrives through the vertex-input stream. A texture can be looked up by coordinates chosen inside a shader. A fragment can sample a surface image at its interpolated UV, inspect neighboring texels for a filter, or retrieve numerical state encoded in image storage.

The lookup uses sampling rules: nearest or filtered reconstruction, address wrapping, and mip-level selection where applicable. A texture is therefore more than an array of colors. Its storage format and sampling configuration jointly determine what value the shader receives. We postpone the detailed rules until the texture chapter so you can first understand the pipeline connection.

In WebGL, a sampler uniform selects a texture unit. A texture object is bound to that unit. Setting the uniform to zero does not upload an image or create a texture; it selects the unit whose binding supplies the resource. Keeping resource creation, resource binding, and shader access separate helps prevent many apparently mysterious black-texture failures.

## State setup is a hidden argument list

Consider a normal JavaScript function `draw(program, geometry, viewport, uniforms)`. Its dependencies are visible in the call. WebGL distributes similar dependencies across context state. `useProgram` selects one program, vertex-array binding selects input configuration, uniform calls change values, and viewport calls choose image mapping. A later draw reads the selected state.

This style means a draw call can depend on something set much earlier. If one pass disables depth writing and the next assumes it is enabled, the second pass can fail even though its own geometry and shaders are correct. The context remembers state until changed; it does not infer a fresh default configuration from your conceptual object boundary.

A robust drawing function establishes the state it requires or relies on a renderer that tracks that state explicitly. It should not accidentally work only because another object happened to render first. The raw labs are small enough to show the setup near the draw, while the engine chapters discuss how to manage the same contracts at scale.

## WebGL is a state machine

Calling `bindBuffer` chooses a current buffer for a target; it does not draw. `vertexAttribPointer` describes how an attribute reads data and captures the currently bound array buffer into vertex-array state. `useProgram` selects shaders. `drawArrays` or `drawElements` asks the GPU to use the selected state to draw.

Think of state setup as assembling the inputs to a function call. Unfortunately, many inputs live in mutable global context state rather than being explicit arguments to the draw. Encapsulate setup to avoid hidden dependencies. A program can compile correctly yet render nothing because its attribute array is disabled, its viewport is zero, its winding is culled, or its transform moves the mesh outside the clip volume.

## Compilation and linking have separate jobs

A shader's source string must be translated into an executable form for its stage. Compilation can reject syntax errors, invalid types, or unsupported constructs. Linking then checks whether the stage programs can be used together and establishes a complete program interface. A valid vertex shader and valid fragment shader can still fail to link if their connection is incompatible.

Our `program` helper creates each shader, supplies source, compiles, and checks the compile status. It attaches successful shaders to a program, links, and checks link status. Information logs are included in thrown errors. It then deletes the intermediate shader objects after linking, while retaining the usable linked program.

This helper does not make shaders infallible. A program can compile and link while calculating positions outside the visible volume or outputting black. Compilation verifies a set of language/interface rules, not whether your geometry or artistic intent is correct. Treat a successful compile as one milestone, then verify the numerical behavior visually or with diagnostics.

## The CPU and GPU do not run in lockstep

When JavaScript calls a draw method, it requests work. The GPU may execute that work later while JavaScript continues. Measuring the few microseconds around the request does not prove the entire rendered result completed in that duration. Submission time and completed GPU time are different quantities.

Some operations require CPU-visible results from GPU work. Reading pixels can force waiting or require an asynchronous strategy, depending on the API path. Repeated synchronous queries can disrupt the overlap that makes the pipeline efficient. Keep intermediate rendering data on the GPU when later GPU passes can consume it directly.

This asynchronous model also affects resource lifetime. A well-designed API coordinates queued usage, but your application must still manage ownership and avoid continually allocating replacement resources without releasing old ones. A scene that looks correct for ten seconds can still accumulate memory through repeated mounts if its cleanup path is incomplete.

## Commands are usually asynchronous

JavaScript submits work; the browser and driver arrange GPU execution. A short CPU time around `drawArrays` measures submission overhead, not necessarily completed rendering. Operations such as reading pixels or synchronously requesting results can force expensive waiting. Keep intermediate results on the GPU when possible.

Shader invocations also do not have a convenient global order. A fragment should not assume its neighbor ran first. Shaders are small data-parallel programs, not loops whose previous iteration’s ordinary local variables survive into the next invocation. Compute shaders later add explicit shared-memory and synchronization mechanisms, still with constraints.

## Invocation independence changes how you write code

A fragment shader cannot keep an ordinary local variable from one invocation and expect the next fragment to read it. Each invocation has its own local calculations. Execution order is not a convenient left-to-right scan of the canvas. This rules out directly translating every sequential JavaScript loop into a fragment shader.

Instead, describe each output from the inputs it can read. A color pattern can depend on UV and time. A filter can sample an input texture. A state update that depends on neighbors usually reads an old-state resource and writes a separate new-state resource. This avoids depending on whether one neighboring invocation happened to run first.

WebGPU compute later provides workgroup memory, atomics, and barriers for controlled cooperation. Those mechanisms do not make arbitrary global ordering safe. The independent-input/output model learned here remains useful even when the API offers more explicit parallel features.

## WebGL 1 versus WebGL 2

The requested WebGL Fundamentals site primarily teaches WebGL 1. Its mental model remains valuable. This course uses WebGL 2: request `'webgl2'`, use GLSL ES 3.00 with `#version 300 es`, use `in`/`out` interfaces, declare a fragment output, and use core vertex array and instancing APIs. WebGL 1 extension examples may need translation. Do not mix shader versions between stages or paste WebGL 1 syntax into a WebGL 2 shader unchanged.

## Establish visibility before adding complexity

A dependable first diagnostic clears the canvas to a conspicuous color. This verifies that the context, surface size, and presentation path are alive. Next draw a fixed triangle whose clip positions are known to be inside the visible volume. Use a constant fragment color so material calculations cannot hide the geometry.

Then add the position buffer, verifying its layout. Add a varying color, verifying stage connection and interpolation. Add a simple transform, verifying its units and order. Add perspective and depth only after the planar result works. Each step introduces one new contract, so a failure has a small set of likely causes.

The course triangle already contains position/color records and angle/scale/aspect uniforms, but you can mentally remove these layers to understand its foundation. The next chapter walks through the exact calls and provides a standalone construction. Carry this pipeline map with you: every API operation should have an identifiable role in preparing data, selecting state, executing a stage, or storing the result.

## A reliable debugging sequence

First verify that a context exists and that clearing changes the canvas. Next draw a fixed triangle with a fixed color. Then add a position buffer, then color, then transforms. If the image disappears, the most recent change narrows the search. Shader compile and program link logs are evidence, not optional decoration. Our `program` helper checks both and throws useful errors.

**Optional application:** inspect the complete triangle lab and identify which statements prepare state and which one actually requests drawing. There is one draw call per frame. Its result is the combination of all the state prepared before it.
