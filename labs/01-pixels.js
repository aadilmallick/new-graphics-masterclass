import {canvas2D,range,note,animate,fitCanvas} from './ui.js';
export function mount(host,panel){
  const {canvas,ctx}=canvas2D(host,'A magnified pixel grid samples a moving circle');
  let resolution=24, radius=.27; range(panel,'Grid resolution',8,80,resolution,1,v=>resolution=v);range(panel,'Circle radius',.1,.45,radius,.01,v=>radius=v);
  note(panel,'Each square is one sample. Increase resolution to see the same shape become smoother. This is Canvas 2D, with intentionally coarse sampling.');
  return animate((time,dt,reduced)=>{const {width:w,height:h}=fitCanvas(canvas);ctx.fillStyle='#0d1721';ctx.fillRect(0,0,w,h);
    const cell=Math.min(w,h)*.8/resolution,ox=(w-cell*resolution)/2,oy=(h-cell*resolution)/2;
    const cx=.5+(reduced?0:Math.sin(time*.6)*.08);
    for(let y=0;y<resolution;y++)for(let x=0;x<resolution;x++){
      const d=Math.hypot((x+.5)/resolution-cx,(y+.5)/resolution-.5);
      ctx.fillStyle=d<radius?'#82ebcc':'#1b2d3b';ctx.fillRect(ox+x*cell,oy+y*cell,Math.max(1,cell-1),Math.max(1,cell-1));
    }
    ctx.fillStyle='#c7d7e3';ctx.font=`${14*(window.devicePixelRatio>1?1.5:1)}px system-ui`;ctx.fillText(`${resolution} × ${resolution} samples`,20,30);
  });
}
