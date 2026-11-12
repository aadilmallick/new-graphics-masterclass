# Your first complete WebGL 2 program

This chapter connects every pipeline concept to a working file. Open [the first GPU triangle](#/lab/webgl-triangle), then open its Source tab. `labs/05-webgl-triangle.js`, `labs/webgl.js`, and `labs/ui.js` form the complete runnable example inside the course project. The snippets below intentionally isolate parts of that implementation.

**Reading bridge:** Eck §§6.1–6.2; [WebGL boilerplate](https://webglfundamentals.org/webgl/lessons/webgl-boilerplate.html). Our helpers are included and readable; they are not a hidden engine.

## 1. Ask for a context

```js
const gl = canvas.getContext('webgl2', { antialias: true, alpha: false });
if (!gl) throw new Error('WebGL 2 is unavailable');
```

A canvas can have one context type; a canvas already initialized as 2D cannot also become a WebGL canvas. Check the return value. A missing context is a capability result to handle, not a reason to access methods on `null`. `alpha: false` requests an opaque drawing surface; it does not control the alpha channel of every texture you create.

## Understand what the browser constructs first

The canvas element is created by parsing the HTML before the script runs. CSS makes its displayed rectangle fill the viewport. The script looks up that element and requests a WebGL 2 context. The `gl` object exposes methods and constants associated with that context; it is not a Three.js scene or a drawing-object registry.

The context request can return `null`. Hardware acceleration settings, implementation limits, or lack of support can prevent initialization. Checking that result turns a vague later exception into a meaningful capability message. In a user-facing application, show the message in the page rather than relying only on a console error.

The canvas buffer initially has default dimensions unless assigned. The `draw` function replaces them with dimensions derived from the visible CSS rectangle and capped DPR. It does so only when they change. A zero-size layout is guarded with a minimum of one buffer pixel, although a production panel may choose not to draw while hidden.

## 2. Write the vertex shader

```glsl
#version 300 es
layout(location=0) in vec2 position;
layout(location=1) in vec3 color;
uniform float angle;
uniform float scale;
uniform float aspect;
out vec3 vColor;
void main() {
  float c = cos(angle), s = sin(angle);
  vec2 p = mat2(c, s, -s, c) * position * scale;
  p.x /= aspect;
  gl_Position = vec4(p, 0.0, 1.0);
  vColor = color;
}
```

`#version` is the first directive. Locations are numbered input slots, not array element indices. `vec2` stores two floats; `vec3` stores three. `mat2` constructor arguments fill columns, so `mat2(c,s,-s,c)` implements the rotation we derived. `gl_Position` is a built-in clip-space output. We put the planar triangle at Z = 0 with W = 1. Dividing X by aspect preserves shape on a wide canvas. This simple correction is not a full perspective camera.

## 3. Write the fragment shader

```glsl
#version 300 es
precision highp float;
in vec3 vColor;
out vec4 outColor;
void main() {
  outColor = vec4(vColor, 1.0);
}
```

The fragment input’s name and type match the vertex output. Its value is interpolated across the triangle. The four-component result supplies RGB and alpha. `precision highp float` declares a default floating-point precision for the fragment stage. The shader uses a fixed simple display-color example; it is not yet a physically based linear-light shading pipeline.

## Treat shader source as a program in another language

JavaScript template strings hold GLSL source. JavaScript does not execute the text inside those strings. `shaderSource` supplies that text to the WebGL shader compiler. This separation explains why a JavaScript variable declared outside the string is not automatically available inside the shader.

The vertex shader's input names are typed variables. Position is two floats and color three floats. Explicit locations zero and one correspond to the attribute setup in JavaScript. The `aspect` uniform is another input, supplied with a different API path. `vColor` is an output to be interpolated for the fragment shader.

The shader constructs a four-component clip position. X is corrected for the drawing rectangle's aspect, Y is unchanged, Z is zero, and W is one. Because W is one and the coordinates lie inside the clip bounds, the example has no distance-dependent perspective effect. It is a planar rendering demonstration, not a hidden 3D camera.

The fragment shader receives `vColor` as an input. Its output is a four-component color with alpha one. The default interpolation produces a gradient among vertex colors. The shader does not manually loop over pixels or know how many fragments the triangle will cover. Rasterization determines the invocation inputs.

## 4. Compile and link

The browser compiles each shader, then links both stages into a **program**. Compilation checks one shader’s syntax and types; linking checks whether the stages can form a compatible executable. Our `program(gl, vertex, fragment)` helper checks `COMPILE_STATUS`, `LINK_STATUS`, and their information logs. It deletes intermediate shader objects after linking.

If you deliberately rename `vColor` in one stage only, the mismatch demonstrates why linking is a separate step. Restore it before continuing. Do not debug a black image before reading a reported compile error.

## Compilation reports language errors; linking reports connections

The `compile` function creates one shader object for a requested stage, assigns its source, compiles it, and checks status. If compilation fails, it retrieves a message before deleting that failed resource. Throwing stops setup rather than letting an invalid shader create a confusing blank image later.

After both stages compile, the program attaches and links them. The vertex output and fragment input must be compatible. A misspelled interface name or a type disagreement can cause a link failure even if both source strings individually use valid syntax. The program information log is therefore a separate source of evidence from each shader's compilation log.

The standalone example deletes shader objects after a successful link because the linked program is the resource used by drawing. The helper in `webgl.js` also ensures cleanup in failure paths. Reading its `try`, `catch`, and `finally` structure is useful: a helper's job includes resource lifetime and diagnostics, not just saving typing.

## 5. Upload and describe records

Each vertex in the lab has five floats: X, Y, red, green, blue. `Float32Array` makes the binary representation explicit. Five floats at four bytes each means a 20-byte **stride** from one record to the next. Position starts at byte 0; color starts at byte 8.

```js
gl.enableVertexAttribArray(0);
gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 20, 0);
gl.enableVertexAttribArray(1);
gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 20, 8);
```

These calls assume the intended buffer and vertex array are bound. `false` means do not normalize integer attribute data; for floating-point data it does not scale values. Offset and stride are bytes, not counts of floats. The lab’s `attribute` helper performs this exact setup.

## Calculate the attribute layout byte by byte

Write out the first record as five float values: position X -0.8, position Y -0.6, red 1.0, green 0.25, blue 0.2. A `Float32Array` stores each in four bytes. The first position occupies bytes 0 through 7; its color occupies bytes 8 through 19. The second record begins at byte 20.

The position pointer therefore has item size two, type float, stride twenty, and offset zero. The color pointer has item size three, type float, the same stride twenty, and offset eight. Stride describes the distance from one record's corresponding attribute to the next record's corresponding attribute. Offset describes where the first one begins.

`enableVertexAttribArray` says the location should read from its configured array rather than use a constant attribute value. `vertexAttribPointer` records the format and currently bound array-buffer association in the active vertex array. The buffer must be bound before that call. Binding another array buffer afterward does not retroactively replace all previously recorded associations.

A layout error can produce plausible but wrong pictures. If the color offset were zero, color would begin by reading position X and Y as red and green. Negative or out-of-range values might then be clamped by output storage, obscuring the underlying mistake. Use a known simple record layout before packing many attributes.

## Establish the vertex-array boundary

A vertex array object groups the input interpretation. The example creates one and binds it before configuring attributes. Later, binding that VAO restores those attribute associations for the draw. This keeps input state from becoming an unstructured collection of independent global assumptions.

A VAO does not contain the shader program, uniform values, viewport, or clear color. Those still need setup. If you switch to another program whose inputs use different locations, a VAO built for the first program may not be compatible with the second program's expectations. Explicit layouts make this contract easier to inspect.

The triangle uses `drawArrays`, so it does not need an index buffer. The following geometry chapter adds indexing and shows that the element-array binding is part of VAO state. Learn that addition after this nonindexed path is clear, rather than introducing two input-selection mechanisms at once.

## 6. Set uniforms and draw

The lab obtains uniform locations once. Every frame it resizes the buffer if necessary, sets the viewport, clears, uses the program, binds the vertex array, uploads angle, scale, and aspect, then calls:

```js
gl.drawArrays(gl.TRIANGLES, 0, 3);
```

`TRIANGLES` groups each three successive vertex inputs into one triangle. `0` is the starting vertex, and `3` is the vertex count. Uniform values must be set with the program active. Querying a uniform that the compiler optimized away can return `null`; do not assume every declared value remains active.

## Trace one frame's state changes

At the beginning of `draw`, the program determines buffer dimensions and selects a viewport covering the entire buffer. It sets a dark clear color and clears the color attachment. This produces a known background and removes the previous image, which matters after resizing or changing geometry.

`useProgram` selects the linked shader program. Binding the VAO selects vertex input layout. `uniform1f` writes the aspect value for the selected program. Only after those dependencies are established does `drawArrays` request triangle rendering. The draw call has three arguments because most of its other inputs live in selected context state.

`gl.TRIANGLES` chooses groups of three vertex inputs. Starting at zero with count three means this draw uses records zero, one, and two. Count is not the number of floats in the buffer and not the number of triangles. Fifteen floats describe three five-float records, which describe one triangle under this topology.

A draw with count six would require enough records for two nonindexed triangles. It would not magically duplicate the three existing records. An indexed draw provides a separate mechanism for reusing records, introduced next. These distinctions become especially important when a mesh's triangle count, index count, and vertex count differ.

## Start with a complete program you can isolate

The lab lives inside the course's mount/cleanup system, which is useful for switching experiments. For first construction, it helps to see a version with no course helpers. The HTML below creates one canvas, compiles two shaders, uploads three interleaved vertex records, and draws once. Save it as an HTML file and serve it through an HTTP development server. It needs no imported library.

```html
<!doctype html>
<html lang="en">
<meta charset="utf-8">
<title>A complete WebGL triangle</title>
<style>
  body { margin: 0; background: #0d1721; }
  canvas { display: block; width: 100vw; height: 100vh; }
</style>
<canvas id="surface" aria-label="A colored WebGL triangle"></canvas>
<script>
const canvas = document.querySelector('#surface');
const gl = canvas.getContext('webgl2', { alpha: false });
if (!gl) throw new Error('WebGL 2 is unavailable');

const vertexSource = `#version 300 es
layout(location=0) in vec2 position;
layout(location=1) in vec3 color;
uniform float aspect;
out vec3 vColor;
void main() {
  gl_Position = vec4(position.x / aspect, position.y, 0.0, 1.0);
  vColor = color;
}`;
const fragmentSource = `#version 300 es
precision highp float;
in vec3 vColor;
out vec4 outColor;
void main() { outColor = vec4(vColor, 1.0); }
`;
function compile(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}
const vertexShader = compile(gl.VERTEX_SHADER, vertexSource);
const fragmentShader = compile(gl.FRAGMENT_SHADER, fragmentSource);
const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
  throw new Error(gl.getProgramInfoLog(program));
}
gl.deleteShader(vertexShader);
gl.deleteShader(fragmentShader);

const vao = gl.createVertexArray();
gl.bindVertexArray(vao);
const vertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
  -0.8, -0.6,  1.0, 0.25, 0.2,
   0.8, -0.6,  0.2, 1.0,  0.65,
   0.0,  0.8,  0.3, 0.45, 1.0
]), gl.STATIC_DRAW);
gl.enableVertexAttribArray(0);
gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 20, 0);
gl.enableVertexAttribArray(1);
gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 20, 8);
const aspectLocation = gl.getUniformLocation(program, 'aspect');

function draw() {
  const rect = canvas.getBoundingClientRect();
  const ratio = Math.min(devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.round(rect.width * ratio));
  const height = Math.max(1, Math.round(rect.height * ratio));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  gl.viewport(0, 0, width, height);
  gl.clearColor(0.05, 0.09, 0.13, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(program);
  gl.bindVertexArray(vao);
  gl.uniform1f(aspectLocation, width / height);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}
addEventListener('resize', draw);
draw();
</script>
</html>
```

This example deliberately omits a full application teardown because its lifetime is the page's lifetime. The course lab adds an explicit cleanup function because experiments are repeatedly created and removed inside one page. If you turn this standalone example into an application panel, add the same ownership boundary rather than assuming page unload will release everything at the right time.

## Add rotation as one controlled extension

The course lab extends the standalone shader with angle and scale uniforms. The angle is converted from a degree-labeled control into radians before upload. Inside the shader, sine and cosine build the 2-by-2 rotation matrix derived earlier. Multiplication rotates the local position, then scale and aspect handling determine its visible size.

Changing the angle slider does not rebuild the buffer or recompile source. The next frame uploads a new uniform number, and every vertex invocation reads it. This is a useful contrast with a CPU deformation approach that rewrites all positions and uploads them. Either can be appropriate for particular tasks, but they have different data-flow costs.

The lab animates its drawing loop even when controls are not moving so resizing and updates remain simple. A production static viewer could render on demand when state changes, saving work. That scheduling choice is separate from the shader's mathematics and does not change the attribute/uniform contracts.

## Diagnose failures using the smallest observation

If the canvas stays the page background color, first verify that the canvas is visible and `gl` exists. Change the clear color to bright magenta. If magenta appears but no triangle does, the presentation surface works, so focus on shader status, input layout, program selection, and clip positions.

Replace the fragment result with opaque white to remove interpolation and color interpretation from the problem. If geometry appears, restore color and inspect the location/offset mapping. Replace transformed position with known fixed clip coordinates if transforms are suspect. Each replacement removes one layer while preserving the rest of the system.

If resizing stretches the shape, inspect viewport and aspect together. If one triangle corner jumps far away, inspect record stride and attribute size. If a uniform seems ignored, verify the intended program is selected and the location was obtained from that same linked program. A compiler may optimize unused uniforms away, so a declared name alone does not guarantee an active location.

## Lifetime and cleanup

The `mount` function returns a cleanup function. It stops animation and deletes the program, buffers, and vertex array. The website calls cleanup when changing experiments. Removing a canvas from the DOM is not a complete resource-management strategy. This explicit lifetime boundary becomes essential in editors, routers, and applications that load many scenes.

## Release exactly what the example owns

The course lab owns its program, buffer, VAO, canvas, controls, and animation callback. Its returned cleanup function stops animation before deleting resources. The application then removes the visual subtree when switching pages. Stopping the loop prevents later frames from trying to use objects whose lifetime has ended.

In a larger renderer, several objects may share a program or geometry buffer. Removing one object should not delete resources still used elsewhere. Ownership must therefore move to a shared resource manager or another explicit policy. The small lab keeps exclusive ownership so that the basic lifecycle is visible without introducing reference counting prematurely.

The important achievement of this first program is not merely the colored triangle. You can now follow every dependency from a JavaScript array and two source strings to an image. Later features add more attributes, textures, passes, and objects, but retain the same disciplined chain of data, interpretation, execution, and storage.

**Optional application:** change only the third vertex’s color, reload, and observe how an entire interior region changes through interpolation. Then change a uniform with the existing controls and note that no vertex buffer needs to be uploaded again.
