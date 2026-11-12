import {deviceFor,checkedModule} from './webgpu.js';
import {fitCanvas,animate,range,note} from './ui.js';
import {multiply,perspective,lookAt,rotationY,radians} from './math.js';
export async function mount(host,panel){
  const {device,canvas,context,format}=await deviceFor(host);let fov=50,angle=.3;
  try{
    const module=await checkedModule(device,`
struct Params { mvp:mat4x4f, model:mat4x4f, light:vec4f };
@group(0) @binding(0) var<uniform> params:Params;
@group(0) @binding(1) var image:texture_2d<f32>;
@group(0) @binding(2) var imageSampler:sampler;
struct Out { @builtin(position) position:vec4f, @location(0) normal:vec3f, @location(1) uv:vec2f };
@vertex fn vs(@location(0) p:vec3f,@location(1) n:vec3f,@location(2) uv:vec2f)->Out{
  var o:Out;o.position=params.mvp*vec4f(p,1.);o.normal=(params.model*vec4f(n,0.)).xyz;o.uv=uv;return o;
}
fn encodeSRGB(c:vec3f)->vec3f{return select(1.055*pow(c,vec3f(1./2.4))-.055,c*12.92,c<=vec3f(.0031308));}
@fragment fn fs(in:Out)->@location(0) vec4f{
  let base=textureSample(image,imageSampler,in.uv*3.).rgb;
  let light=.12+.88*max(dot(normalize(in.normal),normalize(params.light.xyz)),0.);
  return vec4f(encodeSRGB(base*light),1.);
}`);
    const faces=[[[1,0,0],[[1,-1,-1],[1,1,-1],[1,1,1],[1,-1,1]]],[[-1,0,0],[[-1,-1,1],[-1,1,1],[-1,1,-1],[-1,-1,-1]]],[[0,1,0],[[-1,1,-1],[-1,1,1],[1,1,1],[1,1,-1]]],[[0,-1,0],[[-1,-1,1],[-1,-1,-1],[1,-1,-1],[1,-1,1]]],[[0,0,1],[[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]]],[[0,0,-1],[[1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,1,-1]]]];
    const verts=[],indices=[];faces.forEach(([n,points],f)=>{points.forEach((p,i)=>verts.push(...p,...n,...[[0,0],[1,0],[1,1],[0,1]][i]));const o=f*4;indices.push(o,o+1,o+2,o,o+2,o+3);});
    function upload(data,usage){const b=device.createBuffer({size:data.byteLength,usage:usage|GPUBufferUsage.COPY_DST});device.queue.writeBuffer(b,0,data);return b;}
    const vb=upload(new Float32Array(verts),GPUBufferUsage.VERTEX),ib=upload(new Uint16Array(indices),GPUBufferUsage.INDEX),uniform=device.createBuffer({size:144,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});
    const texture=device.createTexture({size:[32,32],format:'rgba8unorm-srgb',usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST});const pixels=new Uint8Array(32*32*4);for(let y=0;y<32;y++)for(let x=0;x<32;x++)pixels.set(((x>>2)+(y>>2))%2?[130,235,204,255]:[65,92,146,255],(y*32+x)*4);device.queue.writeTexture({texture},pixels,{bytesPerRow:128},[32,32]);
    const sampler=device.createSampler({addressModeU:'repeat',addressModeV:'repeat',magFilter:'linear',minFilter:'linear'});
    const pipeline=await device.createRenderPipelineAsync({layout:'auto',vertex:{module,entryPoint:'vs',buffers:[{arrayStride:32,attributes:[{shaderLocation:0,offset:0,format:'float32x3'},{shaderLocation:1,offset:12,format:'float32x3'},{shaderLocation:2,offset:24,format:'float32x2'}]}]},fragment:{module,entryPoint:'fs',targets:[{format}]},primitive:{topology:'triangle-list'},depthStencil:{format:'depth24plus',depthWriteEnabled:true,depthCompare:'less'}});
    const group=device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:uniform}},{binding:1,resource:texture.createView()},{binding:2,resource:sampler}]});let depth=null,w=0,h=0;const values=new Float32Array(36);range(panel,'Vertical field of view',20,100,fov,1,v=>fov=v);note(panel,'Native WebGPU indexed geometry, a 144-byte uniform struct, a sampled sRGB texture, a separate sampler, and a depth attachment. Model motion is pure rotation, so its normal transform is valid. This tiny texture has one mip level for clarity.');
    const stop=animate((t,dt,reduced)=>{fitCanvas(canvas);if(canvas.width!==w||canvas.height!==h){w=canvas.width;h=canvas.height;depth?.destroy();depth=device.createTexture({size:[w,h],format:'depth24plus',usage:GPUTextureUsage.RENDER_ATTACHMENT});}if(!reduced)angle+=dt*.3;const model=rotationY(angle),pv=multiply(perspective(radians(fov),w/h,.1,100,true),lookAt([3,2.2,5],[0,0,0]));values.set(multiply(pv,model),0);values.set(model,16);values.set([1,2,3,0],32);device.queue.writeBuffer(uniform,0,values);const encoder=device.createCommandEncoder(),pass=encoder.beginRenderPass({colorAttachments:[{view:context.getCurrentTexture().createView(),clearValue:[.05,.09,.13,1],loadOp:'clear',storeOp:'store'}],depthStencilAttachment:{view:depth.createView(),depthClearValue:1,depthLoadOp:'clear',depthStoreOp:'store'}});pass.setPipeline(pipeline);pass.setBindGroup(0,group);pass.setVertexBuffer(0,vb);pass.setIndexBuffer(ib,'uint16');pass.drawIndexed(indices.length);pass.end();device.queue.submit([encoder.finish()]);});return ()=>{stop();[vb,ib,uniform].forEach(b=>b.destroy());texture.destroy();depth?.destroy();context.unconfigure();device.destroy();};
  }catch(error){device.destroy();context.unconfigure();throw error;}
}
