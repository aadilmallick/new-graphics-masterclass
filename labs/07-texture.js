import {context,program,viewport,cleanup} from './webgl.js';import {animate,range,select,note} from './ui.js';
export function mount(host,panel){
  const {canvas,gl}=context(host,'A checker texture demonstrating nearest, linear and mipmap sampling');let repeats=5,zoom=1,filter='nearest';
  const p=program(gl,`#version 300 es
out vec2 uv;void main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));uv=p;gl_Position=vec4(p*2.-1.,0,1);}`,`#version 300 es
precision highp float;in vec2 uv;uniform sampler2D image;uniform float repeats;uniform float zoom;out vec4 outColor;
void main(){vec2 p=(uv-.5)*repeats/zoom;outColor=texture(image,p);}`);
  const texture=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);const data=new Uint8Array(32*32*4);
  for(let y=0;y<32;y++)for(let x=0;x<32;x++){const i=(y*32+x)*4,c=((x>>2)+(y>>2))%2;data.set(c?[130,235,204,255]:[26,42,66,255],i);}
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,32,32,0,gl.RGBA,gl.UNSIGNED_BYTE,data);gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.REPEAT);
  const ur=gl.getUniformLocation(p,'repeats'),uz=gl.getUniformLocation(p,'zoom');gl.useProgram(p);gl.uniform1i(gl.getUniformLocation(p,'image'),0);
  range(panel,'Texture repeats',1,100,repeats,1,v=>repeats=v);range(panel,'Zoom',.3,6,zoom,.05,v=>zoom=v);select(panel,'Filter',{nearest:'Nearest',linear:'Bilinear',mipmap:'Trilinear mipmaps'},v=>filter=v);
  note(panel,'Use many repeats to shrink texels below one pixel. Mipmaps prefilter the signal and reduce shimmering. A texture can store arbitrary data; these colors were generated in JavaScript.');
  const stop=animate(()=>{viewport(gl,canvas);gl.useProgram(p);gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,filter==='nearest'?gl.NEAREST:gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,filter==='nearest'?gl.NEAREST:filter==='linear'?gl.LINEAR:gl.LINEAR_MIPMAP_LINEAR);gl.uniform1f(ur,repeats);gl.uniform1f(uz,zoom);gl.drawArrays(gl.TRIANGLES,0,3);});return ()=>{stop();cleanup(gl,[['Program',p],['Texture',texture]]);};
}
