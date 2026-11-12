import {canvas2D,range,note,animate,fitCanvas} from './ui.js';import {barycentric} from './math.js';
export function mount(host,panel){
  const {canvas,ctx}=canvas2D(host,'CPU triangle rasterizer showing barycentric color interpolation');let resolution=36,px=.5,py=.5;
  range(panel,'Raster resolution',12,80,resolution,1,v=>resolution=v);range(panel,'Sample x',0,1,px,.01,v=>px=v);range(panel,'Sample y (up)',0,1,py,.01,v=>py=v);
  const info=note(panel,'');note(panel,'Red, green and blue are attached to vertices. Interior samples mix the vertex values using area weights. The crosshair is the selected sample.');
  return animate(()=>{const {width:w,height:h,dpr}=fitCanvas(canvas);ctx.fillStyle='#0d1721';ctx.fillRect(0,0,w,h);const size=Math.min(w,h)*.82,ox=(w-size)/2,oy=(h-size)/2;
    const a=[.12,.12],b=[.9,.22],c=[.45,.9],step=size/resolution;
    for(let j=0;j<resolution;j++)for(let i=0;i<resolution;i++){const weights=barycentric([(i+.5)/resolution,(j+.5)/resolution],a,b,c);const inside=weights.every(v=>v>=0);ctx.fillStyle=inside?`rgb(${weights.map(v=>Math.round(v*255)).join(',')})`:'#1a2a39';ctx.fillRect(ox+i*step,oy+(resolution-1-j)*step,step-.6,step-.6);}
    const x=ox+px*size,y=oy+(1-py)*size;ctx.strokeStyle='#fff';ctx.lineWidth=2*dpr;ctx.beginPath();ctx.moveTo(x-9*dpr,y);ctx.lineTo(x+9*dpr,y);ctx.moveTo(x,y-9*dpr);ctx.lineTo(x,y+9*dpr);ctx.stroke();
    const weights=barycentric([px,py],a,b,c);info.textContent=`Weights: ${weights.map(v=>v.toFixed(3)).join(', ')} · sum = ${weights.reduce((a,b)=>a+b,0).toFixed(3)} · ${weights.every(v=>v>=0)?'inside':'outside'} triangle`;
  });
}
