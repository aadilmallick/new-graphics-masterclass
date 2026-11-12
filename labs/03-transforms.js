import {canvas2D,range,select,note,animate,fitCanvas,grid} from './ui.js';
export function mount(host,panel){
  const {canvas,ctx}=canvas2D(host,'An asymmetric polygon transformed in different orders');let angle=30,tx=1.5,sx=1.2,order='TRS';
  range(panel,'Rotation (degrees)',-180,180,angle,1,v=>angle=v);range(panel,'Translation x',-3,3,tx,.05,v=>tx=v);range(panel,'Scale x',.2,2,sx,.05,v=>sx=v);
  select(panel,'Matrix order',{TRS:'T · R · S: scale first',RTS:'R · T · S: translate before rotation'},v=>order=v);
  note(panel,'The faint polygon is the original. Column-vector matrix products act from right to left. Swapping T and R changes the path of the center.');
  return animate(()=>{const {width:w,height:h,dpr}=fitCanvas(canvas);grid(ctx,w,h,40*dpr);const s=Math.min(w,h)*.12;const points=[[-.6,-.5],[.6,-.5],[.6,0],[0,0],[0,.8],[-.6,.8]];
    function polygon(transformed,fill){ctx.beginPath();points.forEach(([x,y],i)=>{if(transformed){x*=sx;const c=Math.cos(angle*Math.PI/180),sn=Math.sin(angle*Math.PI/180);if(order==='TRS'){[x,y]=[x*c-y*sn,x*sn+y*c];x+=tx;}else{x+=tx;[x,y]=[x*c-y*sn,x*sn+y*c];}}const p=[w/2+x*s,h/2-y*s];i?ctx.lineTo(...p):ctx.moveTo(...p);});ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle='#82ebcc';ctx.stroke();}
    polygon(false,'#20374b');polygon(true,'#82ebcc99');ctx.fillStyle='#ffbd94';ctx.beginPath();ctx.arc(w/2,h/2,4*dpr,0,Math.PI*2);ctx.fill();
  });
}
