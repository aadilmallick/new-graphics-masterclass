import {canvas2D,range,note,animate,fitCanvas,grid,arrow} from './ui.js';
import {dot,normalize} from './math.js';
export function mount(host,panel){
  const {canvas,ctx}=canvas2D(host,'Two vectors and the projection of one onto the other');let angle=35,magnitude=2;
  range(panel,'Angle of vector b (degrees)',-180,180,angle,1,v=>angle=v);range(panel,'Length of b',.1,3,magnitude,.05,v=>magnitude=v);
  const info=note(panel,'');note(panel,'The peach arrow is b projected onto a. When the angle passes 90°, the dot product becomes negative.');
  return animate(()=>{const {width:w,height:h,dpr}=fitCanvas(canvas);grid(ctx,w,h,35*dpr);const o=[w/2,h/2],scale=Math.min(w,h)*.16;
    const a=[2,0],b=[Math.cos(angle*Math.PI/180)*magnitude,Math.sin(angle*Math.PI/180)*magnitude],unit=normalize(a),projection=dot(b,unit);
    arrow(ctx,o,[o[0]+a[0]*scale,o[1]],'#82ebcc','a = (2, 0)');arrow(ctx,o,[o[0]+b[0]*scale,o[1]-b[1]*scale],'#84aaff','b');
    arrow(ctx,[o[0],o[1]+35*dpr],[o[0]+projection*scale,o[1]+35*dpr],'#ffbd94','projection');
    info.textContent=`a · b = ${dot(a,b).toFixed(3)}     cos θ = ${Math.cos(angle*Math.PI/180).toFixed(3)}     |b| = ${magnitude.toFixed(2)}`;
  });
}
