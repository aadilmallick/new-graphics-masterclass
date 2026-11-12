import {context,program,viewport,cleanup} from './webgl.js';import {animate,range,select,note} from './ui.js';
export function mount(host,panel){
  const {canvas,gl}=context(host,'Two-pass render-to-texture image processing');let strength=1,mode=0;
  const vs=`#version 300 es
out vec2 uv;void main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));uv=p;gl_Position=vec4(p*2.-1.,0,1);}`;
  const first=program(gl,vs,`#version 300 es
precision highp float;in vec2 uv;uniform float time;out vec4 outColor;
void main(){float rings=.5+.5*cos(length(uv-.5)*80.-time*2.);vec3 c=mix(vec3(.04,.1,.18),vec3(.5,.92,.8),rings);outColor=vec4(c,1);}`);
  const second=program(gl,vs,`#version 300 es
precision highp float;in vec2 uv;uniform sampler2D image;uniform vec2 texel;uniform float strength;uniform int mode;out vec4 outColor;
void main(){vec3 original=texture(image,uv).rgb;vec3 sum=vec3(0);for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++)sum+=texture(image,uv+vec2(x,y)*texel).rgb;
vec3 filtered=mode==0?sum/9.:abs(original*9.-sum);outColor=vec4(mix(original,filtered,strength),1);}`);
  const texture=gl.createTexture(),fbo=gl.createFramebuffer();let width=0,height=0;
  gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texture,0);
  const ut=gl.getUniformLocation(first,'time'),us=gl.getUniformLocation(second,'strength'),um=gl.getUniformLocation(second,'mode'),utexel=gl.getUniformLocation(second,'texel');gl.useProgram(second);gl.uniform1i(gl.getUniformLocation(second,'image'),0);
  select(panel,'3 × 3 kernel',{blur:'Box blur',edge:'Edge detector'},v=>mode=v==='blur'?0:1);range(panel,'Mix amount',0,1,strength,.01,v=>strength=v);note(panel,'Pass one draws rings into a texture. Pass two samples its neighbors. The sampled texture is never attached to the framebuffer being drawn into.');
  const stop=animate((time,dt,reduced)=>{viewport(gl,canvas);if(width!==canvas.width||height!==canvas.height){width=canvas.width;height=canvas.height;gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,width,height,0,gl.RGBA,gl.UNSIGNED_BYTE,null);gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw new Error('Framebuffer incomplete');}
    gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);gl.bindTexture(gl.TEXTURE_2D,null);gl.useProgram(first);gl.uniform1f(ut,reduced?0:time);gl.drawArrays(gl.TRIANGLES,0,3);
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.useProgram(second);gl.uniform1f(us,strength);gl.uniform1i(um,mode);gl.uniform2f(utexel,1/width,1/height);gl.drawArrays(gl.TRIANGLES,0,3);
  });return ()=>{stop();cleanup(gl,[['Program',first],['Program',second],['Texture',texture],['Framebuffer',fbo]]);};
}
