import {context,program,buffer,attribute,viewport,cleanup} from './webgl.js';import {animate,range,note} from './ui.js';
export function mount(host,panel){
  const {canvas,gl}=context(host,'A raw WebGL 2 triangle with interpolated color');let angle=0,scale=.8;
  const vs=`#version 300 es
layout(location=0) in vec2 position;
layout(location=1) in vec3 color;
uniform float angle;
uniform float scale;
uniform float aspect;
out vec3 vColor;
void main(){
  float c=cos(angle),s=sin(angle);
  vec2 p=mat2(c,s,-s,c)*position*scale;
  p.x/=aspect;
  gl_Position=vec4(p,0.0,1.0);
  vColor=color;
}`;
  const fs=`#version 300 es
precision highp float;
in vec3 vColor;
out vec4 outColor;
void main(){outColor=vec4(vColor,1.0);}`;
  const p=program(gl,vs,fs),vao=gl.createVertexArray();gl.bindVertexArray(vao);
  const b=buffer(gl,new Float32Array([-.8,-.6,1,.25,.2, .8,-.6,.2,1,.65, 0,.8,.3,.45,1]));attribute(gl,0,2,20,0);attribute(gl,1,3,20,8);
  const uAngle=gl.getUniformLocation(p,'angle'),uScale=gl.getUniformLocation(p,'scale'),uAspect=gl.getUniformLocation(p,'aspect');
  range(panel,'Rotation (degrees)',-180,180,0,1,v=>angle=v*Math.PI/180);range(panel,'Scale',.1,1.4,scale,.01,v=>scale=v);
  note(panel,'No 3D engine: this is a buffer, vertex array, shader program, uniforms, and one drawArrays call. Vertex colors are interpolated by the rasterizer.');
  const stop=animate(()=>{viewport(gl,canvas);gl.clearColor(.05,.09,.13,1);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(p);gl.bindVertexArray(vao);gl.uniform1f(uAngle,angle);gl.uniform1f(uScale,scale);gl.uniform1f(uAspect,canvas.width/canvas.height);gl.drawArrays(gl.TRIANGLES,0,3);});
  return ()=>{stop();cleanup(gl,[['Buffer',b],['VertexArray',vao],['Program',p]]);};
}
