import {deviceFor,checkedModule} from './webgpu.js';import {range,note} from './ui.js';
export async function mount(host,panel){
  const {device}=await deviceFor(host,{canvas:false});let multiplier=2,disposed=false,busy=false;
  const result=document.createElement('div');result.className='compute-result';result.setAttribute('role','status');host.append(result);
  try{
    const module=await checkedModule(device,`
@group(0) @binding(0) var<storage,read_write> values:array<f32>;
@group(0) @binding(1) var<uniform> factor:vec4f;
@compute @workgroup_size(64) fn main(@builtin(global_invocation_id) id:vec3u){
  if(id.x>=arrayLength(&values)){return;}
  values[id.x]=values[id.x]*factor.x;
}`);
    const pipeline=await device.createComputePipelineAsync({layout:'auto',compute:{module,entryPoint:'main'}}),input=new Float32Array([1,2,3,4,5,6,7,8]);
    const work=device.createBuffer({size:input.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC}),read=device.createBuffer({size:input.byteLength,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST}),uniform=device.createBuffer({size:16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});
    const group=device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:work}},{binding:1,resource:{buffer:uniform}}]});
    async function run(){if(disposed||busy)return;busy=true;const factor=multiplier;try{device.queue.writeBuffer(work,0,input);device.queue.writeBuffer(uniform,0,new Float32Array([factor,0,0,0]));const encoder=device.createCommandEncoder();const pass=encoder.beginComputePass();pass.setPipeline(pipeline);pass.setBindGroup(0,group);pass.dispatchWorkgroups(Math.ceil(input.length/64));pass.end();encoder.copyBufferToBuffer(work,0,read,0,input.byteLength);device.queue.submit([encoder.finish()]);await read.mapAsync(GPUMapMode.READ);if(disposed){read.unmap();return;}const output=new Float32Array(read.getMappedRange()).slice();read.unmap();result.replaceChildren();const title=document.createElement('h2');title.textContent=`GPU result × ${factor}`;const before=document.createElement('p');before.textContent=`Input: ${Array.from(input).join(' · ')}`;const cells=document.createElement('div');cells.className='compute-cells';for(const value of output){const cell=document.createElement('span');cell.textContent=value.toFixed(1);cells.append(cell);}result.append(title,before,cells);}
      catch(error){if(!disposed)result.textContent=error.message;}finally{busy=false;if(!disposed&&factor!==multiplier)run();}}
    range(panel,'Multiply each value by',0,10,multiplier,.25,v=>{multiplier=v;run();});note(panel,'This dispatch has one workgroup with 64 invocations. Only eight touch data; a bounds check guards the rest. The result is copied to a staging buffer and mapped asynchronously.');await run();return ()=>{disposed=true;work.destroy();read.destroy();uniform.destroy();device.destroy();};
  }catch(error){device.destroy();throw error;}
}
