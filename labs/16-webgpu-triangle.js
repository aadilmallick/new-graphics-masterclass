import {deviceFor,checkedModule} from './webgpu.js';import {animate,fitCanvas,range,note} from './ui.js';
export async function mount(host,panel){
  const {device,canvas,context,format}=await deviceFor(host);let angle=0;
  try{
    const module=await checkedModule(device,`
struct Params { angle: f32, aspect: f32, padding: vec2f };
@group(0) @binding(0) var<uniform> params: Params;
struct Output { @builtin(position) position: vec4f, @location(0) color: vec3f };
@vertex fn vs(@builtin(vertex_index) index:u32)->Output{
  let positions=array<vec2f,3>(vec2f(-.75,-.55),vec2f(.75,-.55),vec2f(0.,.8));
  let colors=array<vec3f,3>(vec3f(1.,.4,.3),vec3f(.4,1.,.7),vec3f(.4,.6,1.));
  let c=cos(params.angle);let s=sin(params.angle);let p=positions[index];
  var out:Output;out.position=vec4f((c*p.x-s*p.y)/params.aspect,s*p.x+c*p.y,0.,1.);out.color=colors[index];return out;
}
@fragment fn fs(in:Output)->@location(0) vec4f{return vec4f(in.color,1.);}`);
    const pipeline=await device.createRenderPipelineAsync({layout:'auto',vertex:{module,entryPoint:'vs'},fragment:{module,entryPoint:'fs',targets:[{format}]},primitive:{topology:'triangle-list'}});
    const uniform=device.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});const group=device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:uniform}}]});
    range(panel,'Rotation (degrees)',-180,180,0,1,v=>angle=v*Math.PI/180);note(panel,'Native WebGPU: one immutable pipeline, a 16-byte uniform buffer, a bind group and a fresh command buffer each frame. No WebGL fallback is used in this lab.');
    const stop=animate(()=>{fitCanvas(canvas);device.queue.writeBuffer(uniform,0,new Float32Array([angle,canvas.width/canvas.height,0,0]));const encoder=device.createCommandEncoder();const pass=encoder.beginRenderPass({colorAttachments:[{view:context.getCurrentTexture().createView(),clearValue:[.05,.09,.13,1],loadOp:'clear',storeOp:'store'}]});pass.setPipeline(pipeline);pass.setBindGroup(0,group);pass.draw(3);pass.end();device.queue.submit([encoder.finish()]);});return ()=>{stop();uniform.destroy();context.unconfigure();device.destroy();};
  }catch(error){context.unconfigure();device.destroy();throw error;}
}
