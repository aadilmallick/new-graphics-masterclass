import {deviceFor,checkedModule} from './webgpu.js';import {animate,fitCanvas,range,note} from './ui.js';
export async function mount(host,panel){
  const {device,canvas,context,format}=await deviceFor(host);let attraction=.35,speed=1;const count=8192;
  try{
    const compute=await checkedModule(device,`
struct Particle { position:vec2f, velocity:vec2f };
@group(0) @binding(0) var<storage,read> input:array<Particle>;
@group(0) @binding(1) var<storage,read_write> output:array<Particle>;
@group(0) @binding(2) var<uniform> params:vec4f;
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) id:vec3u){
  if(id.x>=arrayLength(&input)){return;}
  var p=input[id.x];let dt=params.x;let r=max(length(p.position),.15);
  p.velocity-=p.position/(r*r*r)*params.y*dt;
  p.position+=p.velocity*dt;
  if(length(p.position)>1.5){p.position*=.3;p.velocity*=.3;}
  output[id.x]=p;
}`);
    const render=await checkedModule(device,`
struct Particle { position:vec2f, velocity:vec2f };
@group(0) @binding(0) var<storage,read> particles:array<Particle>;
@group(0) @binding(1) var<uniform> params:vec4f;
struct Out { @builtin(position) position:vec4f, @location(0) local:vec2f, @location(1) speed:f32 };
@vertex fn vs(@builtin(vertex_index) v:u32,@builtin(instance_index) i:u32)->Out{
  let corners=array<vec2f,6>(vec2f(-1,-1),vec2f(1,-1),vec2f(-1,1),vec2f(-1,1),vec2f(1,-1),vec2f(1,1));let p=particles[i];let local=corners[v];var o:Out;
  o.position=vec4f((p.position+local*.006)*vec2f(1./params.z,1.),0.,1.);o.local=local;o.speed=length(p.velocity);return o;
}
@fragment fn fs(in:Out)->@location(0) vec4f{
  let a=max(0.,1.-dot(in.local,in.local))*.75;return vec4f(mix(vec3f(.25,.7,.8),vec3f(1.,.65,.4),clamp(in.speed,0.,1.))*a,a);
}`);
    const cp=await device.createComputePipelineAsync({layout:'auto',compute:{module:compute,entryPoint:'main'}}),rp=await device.createRenderPipelineAsync({layout:'auto',vertex:{module:render,entryPoint:'vs'},fragment:{module:render,entryPoint:'fs',targets:[{format,blend:{color:{srcFactor:'one',dstFactor:'one',operation:'add'},alpha:{srcFactor:'one',dstFactor:'one',operation:'add'}}}]},primitive:{topology:'triangle-list'}});
    const data=new Float32Array(count*4);for(let i=0;i<count;i++){const angle=i*2.399963,r=.15+.8*Math.sqrt((i+.5)/count),s=Math.sqrt(.35/r);data.set([Math.cos(angle)*r,Math.sin(angle)*r,-Math.sin(angle)*s,Math.cos(angle)*s],i*4);}
    const buffers=[0,1].map(()=>device.createBuffer({size:data.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}));buffers.forEach(b=>device.queue.writeBuffer(b,0,data));const params=device.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});
    const cg=[0,1].map(i=>device.createBindGroup({layout:cp.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:buffers[i]}},{binding:1,resource:{buffer:buffers[1-i]}},{binding:2,resource:{buffer:params}}]}));const rg=[0,1].map(i=>device.createBindGroup({layout:rp.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:buffers[i]}},{binding:1,resource:{buffer:params}}]}));
    range(panel,'Attraction strength',0,.8,attraction,.01,v=>attraction=v);range(panel,'Simulation speed',0,2,speed,.01,v=>speed=v);note(panel,'8,192 particles are updated by a real compute dispatch. Two storage buffers alternate roles. The render pass reads the output directly; particle positions never return to JavaScript. This is an illustrative central-force simulation.');let index=0;
    const stop=animate((t,dt,reduced)=>{fitCanvas(canvas);device.queue.writeBuffer(params,0,new Float32Array([reduced?0:Math.min(dt*speed,.016),attraction,canvas.width/canvas.height,0]));const encoder=device.createCommandEncoder();const c=encoder.beginComputePass();c.setPipeline(cp);c.setBindGroup(0,cg[index]);c.dispatchWorkgroups(Math.ceil(count/64));c.end();const pass=encoder.beginRenderPass({colorAttachments:[{view:context.getCurrentTexture().createView(),clearValue:[.025,.045,.08,1],loadOp:'clear',storeOp:'store'}]});pass.setPipeline(rp);pass.setBindGroup(0,rg[1-index]);pass.draw(6,count);pass.end();device.queue.submit([encoder.finish()]);index=1-index;});return ()=>{stop();buffers.forEach(b=>b.destroy());params.destroy();context.unconfigure();device.destroy();};
  }catch(error){device.destroy();context.unconfigure();throw error;}
}
