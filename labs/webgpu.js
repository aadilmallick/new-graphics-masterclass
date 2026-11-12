export async function deviceFor(host,{canvas=true}={}){
  if(!isSecureContext)throw new Error('WebGPU needs HTTPS or localhost. Run npm run dev locally, or open the hosted HTTPS website.');
  if(!navigator.gpu)throw new Error('This browser does not expose WebGPU. Try a current browser with hardware acceleration. You can still read the full lesson and source, and run the WebGL labs.');
  const adapter=await navigator.gpu.requestAdapter();if(!adapter)throw new Error('No WebGPU adapter was returned. Your browser, GPU driver, or hardware acceleration may not support WebGPU.');
  const device=await adapter.requestDevice();const message=document.createElement('p');message.className='gpu-status';message.setAttribute('role','status');
  device.addEventListener('uncapturederror',event=>{message.textContent=`GPU validation: ${event.error.message}`;host.append(message);});
  device.lost.then(info=>{if(info.reason!=='destroyed'){message.textContent=`GPU device lost: ${info.message}. Reload this lab to recreate resources.`;host.append(message);}});
  if(!canvas)return {device,adapter};
  const surface=document.createElement('canvas');surface.setAttribute('aria-label','Native WebGPU rendering');surface.setAttribute('role','img');host.append(surface);const context=surface.getContext('webgpu');if(!context){device.destroy();throw new Error('A WebGPU canvas context could not be created.');}
  const format=navigator.gpu.getPreferredCanvasFormat();context.configure({device,format,alphaMode:'opaque'});return {device,adapter,canvas:surface,context,format};
}
export async function checkedModule(device,code){const module=device.createShaderModule({code});const info=await module.getCompilationInfo();const errors=info.messages.filter(m=>m.type==='error');if(errors.length)throw new Error(errors.map(m=>`Line ${m.lineNum}: ${m.message}`).join('\n'));return module;}
