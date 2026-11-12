import {canvas2D,range,note,animate} from './ui.js';import {raySphere,normalize,dot} from './math.js';
export function mount(host,panel){
  const {canvas,ctx}=canvas2D(host,'CPU ray-cast spheres with diffuse shading');canvas.style.imageRendering='pixelated';let resolution=140,lightX=-2,dirty=true;
  range(panel,'Image width',64,280,resolution,8,v=>{resolution=v;dirty=true;});range(panel,'Light x',-5,5,lightX,.1,v=>{lightX=v;dirty=true;});const info=note(panel,'');note(panel,'One primary ray per sample. This deliberately small CPU renderer has diffuse direct light and a hard shadow ray. It is ray tracing, but it is not a Monte Carlo path tracer.');
  const spheres=[{center:[-.8,0,-3.4],radius:.85,color:[.3,.9,.7]},{center:[.9,-.2,-4],radius:.65,color:[.45,.6,1]},{center:[0,-1001,-4],radius:1000,color:[.32,.38,.45]}];
  const observer=new ResizeObserver(()=>dirty=true);observer.observe(host);
  const stop=animate(()=>{if(!dirty)return;dirty=false;const rect=host.getBoundingClientRect();if(rect.width<1||rect.height<1)return;const start=performance.now();canvas.width=resolution;canvas.height=Math.max(1,Math.round(resolution*rect.height/rect.width));const image=ctx.createImageData(canvas.width,canvas.height),origin=[0,.3,0],light=[lightX,4,1];
    for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){
      const d=normalize([(2*(x+.5)/canvas.width-1)*canvas.width/canvas.height,1-2*(y+.5)/canvas.height,-2]);let nearest=Infinity,object;
      for(const s of spheres){const t=raySphere(origin,d,s.center,s.radius);if(t!==null&&t<nearest){nearest=t;object=s;}}
      let color=[.035,.065,.105];if(object){const point=origin.map((v,i)=>v+d[i]*nearest),normal=normalize(point.map((v,i)=>v-object.center[i])),toLight=light.map((v,i)=>v-point[i]),lightDistance=Math.hypot(...toLight),ld=normalize(toLight);const bias=point.map((v,i)=>v+normal[i]*.001);let shadow=false;for(const s of spheres){const t=raySphere(bias,ld,s.center,s.radius);if(t!==null&&t<lightDistance){shadow=true;break;}}const intensity=.12+(shadow?0:.88*Math.max(0,dot(normal,ld)));color=object.color.map(c=>c*intensity);}
      const i=(y*canvas.width+x)*4;image.data.set([...color.map(c=>Math.round(Math.pow(c,1/2.2)*255)),255],i);
    }ctx.putImageData(image,0,0);info.textContent=`${canvas.width*canvas.height} primary rays · CPU time ${(performance.now()-start).toFixed(1)} ms · approximate gamma 2.2 display encoding`;
  });return ()=>{stop();observer.disconnect();};
}
