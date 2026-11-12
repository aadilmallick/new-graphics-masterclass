# Your first complete WebGL 2 program

This chapter connects every pipeline concept to a working file. Open [the first GPU triangle](#/lab/webgl-triangle), then open its Source tab. `labs/05-webgl-triangle.js`, `labs/webgl.js`, and `labs/ui.js` form the complete runnable example inside the course project. The snippets below intentionally isolate parts of that implementation.

**Reading bridge:** Eck §§6.1–6.2; [WebGL boilerplate](https://webglfundamentals.org/webgl/lessons/webgl-boilerplate.html). Our helpers are included and readable; they are not a hidden engine.

## 1. Ask for a context

```js
const gl = canvas.getContext('webgl2', { antialias: true, alpha: false });
if (!gl) throw new Error('WebGL 2 is unavailable');
```

A canvas can have one context type; a canvas already initialized as 2D cannot also become a WebGL canvas. Check the return value. A missing context is a capability result to handle, not a reason to access methods on `null`. `alpha: false` requests an opaque drawing surface; it does not control the alpha channel of every texture you create.

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

## 4. Compile and link

The browser compiles each shader, then links both stages into a **program**. Compilation checks one shader’s syntax and types; linking checks whether the stages can form a compatible executable. Our `program(gl, vertex, fragment)` helper checks `COMPILE_STATUS`, `LINK_STATUS`, and their information logs. It deletes intermediate shader objects after linking.

If you deliberately rename `vColor` in one stage only, the mismatch demonstrates why linking is a separate step. Restore it before continuing. Do not debug a black image before reading a reported compile error.

## 5. Upload and describe records

Each vertex in the lab has five floats: X, Y, red, green, blue. `Float32Array` makes the binary representation explicit. Five floats at four bytes each means a 20-byte **stride** from one record to the next. Position starts at byte 0; color starts at byte 8.

```js
gl.enableVertexAttribArray(0);
gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 20, 0);
gl.enableVertexAttribArray(1);
gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 20, 8);
```

These calls assume the intended buffer and vertex array are bound. `false` means do not normalize integer attribute data; for floating-point data it does not scale values. Offset and stride are bytes, not counts of floats. The lab’s `attribute` helper performs this exact setup.

## 6. Set uniforms and draw

The lab obtains uniform locations once. Every frame it resizes the buffer if necessary, sets the viewport, clears, uses the program, binds the vertex array, uploads angle, scale, and aspect, then calls:

```js
gl.drawArrays(gl.TRIANGLES, 0, 3);
```

`TRIANGLES` groups each three successive vertex inputs into one triangle. `0` is the starting vertex, and `3` is the vertex count. Uniform values must be set with the program active. Querying a uniform that the compiler optimized away can return `null`; do not assume every declared value remains active.

## Lifetime and cleanup

The `mount` function returns a cleanup function. It stops animation and deletes the program, buffers, and vertex array. The website calls cleanup when changing experiments. Removing a canvas from the DOM is not a complete resource-management strategy. This explicit lifetime boundary becomes essential in editors, routers, and applications that load many scenes.

**Optional application:** change only the third vertex’s color, reload, and observe how an entire interior region changes through interpolation. Then change a uniform with the existing controls and note that no vertex buffer needs to be uploaded again.
