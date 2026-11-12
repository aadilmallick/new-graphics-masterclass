import {context,program,buffer,attribute,viewport,cleanup} from './webgl.js';import {animate,range,select,note} from './ui.js';
import {multiply,perspective,lookAt,rotationY,radians} from './math.js';
export function mount(host,panel){
  const {canvas,gl}=context(host,'A lit cube rendered with raw WebGL 2');let fov=50,speed=.35,depth=true;
  const vs=`#version 300 es
layout(location=0) in vec3 position;
layout(location=1) in vec3 normal;
uniform mat4 mvp;uniform mat4 model;
out vec3 vNormal;
void main(){gl_Position=mvp*vec4(position,1.);vNormal=mat3(model)*normal;}`;
  const fs=`#version 300 es
precision highp float;
in vec3 vNormal;out vec4 outColor;
void main(){vec3 n=normalize(vNormal);float diffuse=max(dot(n,normalize(vec3(1,2,3))),0.);
vec3 linearColor=vec3(.12,.7,.5)*(.12+.88*diffuse);
outColor=vec4(pow(linearColor,vec3(1./2.2)),1.);}`;
  // Each face has its own four vertices: corners share positions but not normals.
  const faces=[[[1,0,0],[[1,-1,-1],[1,1,-1],[1,1,1],[1,-1,1]]],[[-1,0,0],[[-1,-1,1],[-1,1,1],[-1,1,-1],[-1,-1,-1]]],[[0,1,0],[[-1,1,-1],[-1,1,1],[1,1,1],[1,1,-1]]],[[0,-1,0],[[-1,-1,1],[-1,-1,-1],[1,-1,-1],[1,-1,1]]],[[0,0,1],[[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]]],[[0,0,-1],[[1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,1,-1]]]];
  const vertices=[],indices=[];faces.forEach(([n,points],face)=>{points.forEach(p=>vertices.push(...p,...n));const o=face*4;indices.push(o,o+1,o+2,o,o+2,o+3);});
  const p=program(gl,vs,fs),vao=gl.createVertexArray();gl.bindVertexArray(vao);const vb=buffer(gl,new Float32Array(vertices));attribute(gl,0,3,24,0);attribute(gl,1,3,24,12);const ib=buffer(gl,new Uint16Array(indices),gl.ELEMENT_ARRAY_BUFFER);
  const um=gl.getUniformLocation(p,'model'),umvp=gl.getUniformLocation(p,'mvp');range(panel,'Vertical field of view',20,100,fov,1,v=>fov=v);range(panel,'Rotation speed',0,1,speed,.01,v=>speed=v);select(panel,'Depth test',{on:'Enabled',off:'Disabled'},v=>depth=v==='on');
  note(panel,'Disable the depth test to see later faces paint over nearer faces. The normal transform here is valid because the model contains only rotation. A nonuniform scale needs inverse transpose.');let angle=0;
  const stop=animate((t,dt,reduced)=>{if(!reduced)angle+=dt*speed;viewport(gl,canvas);depth?gl.enable(gl.DEPTH_TEST):gl.disable(gl.DEPTH_TEST);gl.clearColor(.05,.09,.13,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);const model=rotationY(angle),pv=multiply(perspective(radians(fov),canvas.width/canvas.height,.1,100),lookAt([3,2.2,5],[0,0,0]));gl.useProgram(p);gl.bindVertexArray(vao);gl.uniformMatrix4fv(um,false,model);gl.uniformMatrix4fv(umvp,false,multiply(pv,model));gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);});
  return ()=>{stop();cleanup(gl,[['Program',p],['VertexArray',vao],['Buffer',vb],['Buffer',ib]]);};
}
