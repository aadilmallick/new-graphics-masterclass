import {context,program,viewport,cleanup} from './webgl.js';import {animate,range,note} from './ui.js';
export function mount(host,panel){
  const {canvas,gl}=context(host,'A ray-marched union of signed-distance shapes');let blend=.3,maxSteps=96;
  const p=program(gl,`#version 300 es
out vec2 uv;void main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));uv=p;gl_Position=vec4(p*2.-1.,0,1);}`,`#version 300 es
precision highp float;in vec2 uv;uniform float time,aspect,blend;uniform int maxSteps;out vec4 outColor;
float smoothMin(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}
float distanceField(vec3 p){float a=length(p-vec3(-.55,.15,0.))-.75;vec3 q=p-vec3(.65,.15+sin(time)*.18,0.);float b=length(vec2(length(q.xz)-.65,q.y))-.22;return min(smoothMin(a,b,max(blend,.001)),p.y+1.);}
vec3 normalAt(vec3 p){vec2 e=vec2(.001,0);return normalize(vec3(distanceField(p+e.xyy)-distanceField(p-e.xyy),distanceField(p+e.yxy)-distanceField(p-e.yxy),distanceField(p+e.yyx)-distanceField(p-e.yyx)));}
void main(){vec2 screen=(uv*2.-1.)*vec2(aspect,1.);vec3 origin=vec3(0.,.6,4.),direction=normalize(vec3(screen.x,screen.y-.1,-2.));float travel=0.;bool hit=false;
for(int i=0;i<192;i++){if(i>=maxSteps)break;float d=distanceField(origin+direction*travel);if(d<.001){hit=true;break;}travel+=d*.8;if(travel>20.)break;}
vec3 color=vec3(.03,.065,.1);if(hit){vec3 point=origin+direction*travel,n=normalAt(point),l=normalize(vec3(-2.,4.,3.));float diffuse=max(dot(n,l),0.);float fresnel=pow(1.-max(dot(n,-direction),0.),3.);vec3 base=point.y<-.99?vec3(.12,.17,.22):vec3(.16,.67,.5);color=base*(.2+diffuse*.8)+vec3(.3,.5,.8)*fresnel*.5;color=mix(color,vec3(.03,.065,.1),1.-exp(-travel*.045));}outColor=vec4(pow(color,vec3(1./2.2)),1.);}`);
  const uniforms=Object.fromEntries(['time','aspect','blend','maxSteps'].map(n=>[n,gl.getUniformLocation(p,n)]));range(panel,'Smooth union radius',.01,.8,blend,.01,v=>blend=v);range(panel,'Maximum march steps',12,192,maxSteps,1,v=>maxSteps=v);note(panel,'A full-screen fragment shader follows rays through an analytic distance field. It advances by a conservative fraction of the field estimate until near a surface. The smooth union is illustrative; insufficient steps cause missing regions.');const stop=animate((t,dt,reduced)=>{viewport(gl,canvas);gl.useProgram(p);gl.uniform1f(uniforms.time,reduced?0:t);gl.uniform1f(uniforms.aspect,canvas.width/canvas.height);gl.uniform1f(uniforms.blend,blend);gl.uniform1i(uniforms.maxSteps,maxSteps);gl.drawArrays(gl.TRIANGLES,0,3);});return ()=>{stop();cleanup(gl,[['Program',p]]);};
}
