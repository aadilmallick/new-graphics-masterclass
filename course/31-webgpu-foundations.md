# WebGPU: explicit resources and commands

WebGPU gives JavaScript access to modern rendering and compute capabilities through explicit resources, pipelines, and command passes. The geometry and lighting math remain familiar. The way you describe and schedule work changes.

**Experiment:** [A new kind of pipeline](#/lab/webgpu-triangle). **Source:** `labs/16-webgpu-triangle.js` and `labs/webgpu.js`. **Reading bridge:** Eck §9.1; [Learn WebGPU](https://learn-webgpu.com/en) setup/triangle sequence; [WebGPU fundamentals](https://webgpufundamentals.org/webgpu/lessons/webgpu-fundamentals.html).

## Capability is a result to handle

WebGPU requires a secure context, normally HTTPS or localhost. An exposed `navigator.gpu` does not guarantee a usable adapter. Check both stages:

```js
if (!navigator.gpu) throw new Error('WebGPU is not exposed');
const adapter = await navigator.gpu.requestAdapter();
if (!adapter) throw new Error('No suitable GPU adapter');
const device = await adapter.requestDevice();
```

An **adapter** describes an available implementation and its capabilities. A **device** is the interface through which you create and use resources. Optional features and higher limits must be requested when creating the device if your algorithm requires them. Request only what you need, and check support first. Avoid static browser-version promises; hardware, drivers, settings, and implementation status also matter.

The course’s native labs show a readable capability message when unavailable. They do not silently substitute a CPU or WebGL simulation and call it WebGPU. The TSL lab separately demonstrates Three.js’s fallback-capable renderer.

## Configure the canvas

Get a `'webgpu'` context and choose `navigator.gpu.getPreferredCanvasFormat()`. Configure it with device, format, and alpha mode. Each frame, get the current canvas texture and create a view. Do not keep a canvas texture view forever across frames or resizing; it represents a current presentation resource.

Textures own storage. Views describe which portion and interpretation of that storage a pass or binding uses. A texture can have several views when permitted, but the texture’s format, usage, dimensions, and sample count constrain them.

## Modules, pipelines, and bind groups

A shader module contains WGSL code. A render pipeline fixes a compatible shader setup, vertex layouts, primitive policy, color targets, and depth/multisample policy. A bind group supplies actual resources matching a layout. This makes many dependencies explicit rather than mutating one global context.

The triangle lab uses `layout: 'auto'` so the pipeline derives a layout from shader declarations. That is convenient for a small example. Explicit bind-group layouts support resource sharing across intentionally compatible pipelines and make larger renderer contracts clearer. Bind groups created from one auto-derived layout should not be assumed interchangeable with another pipeline’s layout merely because declarations look similar.

![WebGPU pipeline and resource bindings](../public/diagrams/webgpu-bindings.svg)

## Encoding one frame

Create a command encoder, begin a render pass with a color attachment, set pipeline and bind group, draw, end the pass, finish the encoder, and submit the command buffer. The lab’s central flow is:

```js
const encoder = device.createCommandEncoder();
const pass = encoder.beginRenderPass({
  colorAttachments: [{
    view: context.getCurrentTexture().createView(),
    clearValue: [0.05, 0.09, 0.13, 1],
    loadOp: 'clear', storeOp: 'store'
  }]
});
pass.setPipeline(pipeline);
pass.setBindGroup(0, group);
pass.draw(3);
pass.end();
device.queue.submit([encoder.finish()]);
```

`loadOp` chooses whether previous attachment contents are loaded or cleared. `storeOp` chooses whether results are preserved. A command encoder is used to produce a command buffer once; create new frame commands rather than trying to append forever to a finished encoder. Queue submission schedules work asynchronously.

## Immutable choices versus changing data

Changing a rotation angle should write a uniform buffer, not rebuild a pipeline. Changing target format or sample count may require a matching pipeline. Buffer usage flags declare permitted roles, such as `UNIFORM`, `VERTEX`, `STORAGE`, `COPY_DST`, or `MAP_READ`. They are not decorative hints; invalid role combinations or missing flags cause validation errors.

## Validation and lifetime

Use shader compilation information, descriptive labels, error scopes around operations you want to handle, and an `uncapturederror` handler for diagnostics. Device loss uses the Promise property `device.lost.then(...)`, not a function call. If a device is lost, stop the old loop and recreate the resources on a new device as appropriate. A resource from the old device cannot simply be reused on the new one.

The small labs destroy their device on teardown because each owns its device exclusively. A production application may share a device across scenes and should destroy only resources owned by the departing scene. Resource ownership is an application-level design decision.

**Optional application:** compare this frame encoding with the raw WebGL triangle. List which choices are now pipeline descriptors, which are bind-group resources, and which remain per-frame command arguments. The purpose is to translate the model, not memorize a second pile of API names.
