import {fitCanvas} from './ui.js';
export function context(host,label='WebGL 2 rendering') {
  const canvas=document.createElement('canvas');canvas.setAttribute('aria-label',label);canvas.setAttribute('role','img');host.append(canvas);
  const gl=canvas.getContext('webgl2',{antialias:true,alpha:false});if(!gl)throw new Error('WebGL 2 is unavailable. Enable hardware acceleration or try a supported browser. The lesson and source remain readable.');
  return {canvas,gl};
}
export function program(gl,vertex,fragment) {
  const shaders=[];const p=gl.createProgram();
  try{
    for(const [type,source] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]]){
      const shader=gl.createShader(type);shaders.push(shader);gl.shaderSource(shader,source);gl.compileShader(shader);
      if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(shader));gl.attachShader(p,shader);
    }
    gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return p;
  }catch(error){gl.deleteProgram(p);throw error;}finally{shaders.forEach(s=>gl.deleteShader(s));}
}
export function buffer(gl,data,target=gl.ARRAY_BUFFER){const b=gl.createBuffer();gl.bindBuffer(target,b);gl.bufferData(target,data,gl.STATIC_DRAW);return b;}
export function attribute(gl,location,size,stride=0,offset=0){gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,size,gl.FLOAT,false,stride,offset);}
export function viewport(gl,canvas){fitCanvas(canvas);gl.viewport(0,0,canvas.width,canvas.height);}
export function cleanup(gl,resources){for(const [type,obj] of resources)gl[`delete${type}`](obj);}
