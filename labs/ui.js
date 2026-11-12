export function range(panel,label,min,max,value,step=0.01,onChange=()=>{}) {
  const wrapper=document.createElement('label'); wrapper.className='lab-control';
  const caption=document.createElement('span'); caption.textContent=label;
  const output=document.createElement('output'); output.textContent=String(value);
  const input=document.createElement('input'); input.type='range'; Object.assign(input,{min,max,step,value});
  input.setAttribute('aria-label',label);
  input.addEventListener('input',()=>{ output.textContent=input.value; onChange(Number(input.value)); });
  wrapper.append(caption,output,input); panel.append(wrapper); return input;
}
export function select(panel,label,options,onChange) {
  const wrapper=document.createElement('label'); wrapper.className='lab-control';
  const caption=document.createElement('span'); caption.textContent=label;
  const input=document.createElement('select'); input.setAttribute('aria-label',label);
  for (const [value,text] of Object.entries(options)) { const o=document.createElement('option'); o.value=value; o.textContent=text; input.append(o); }
  input.addEventListener('change',()=>onChange(input.value)); wrapper.append(caption,input);panel.append(wrapper); return input;
}
export function note(panel,text) { const p=document.createElement('p'); p.className='lab-note';p.textContent=text;panel.append(p);return p; }
export function fitCanvas(canvas,cap=2) {
  const rect=canvas.getBoundingClientRect(), dpr=Math.min(window.devicePixelRatio||1,cap);
  const w=Math.max(1,Math.round(rect.width*dpr)),h=Math.max(1,Math.round(rect.height*dpr));
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
  return {width:w,height:h,dpr};
}
export function canvas2D(host,label) {
  const canvas=document.createElement('canvas');canvas.setAttribute('aria-label',label);canvas.setAttribute('role','img');host.append(canvas);
  const ctx=canvas.getContext('2d'); if(!ctx) throw new Error('Canvas 2D is unavailable.');
  return {canvas,ctx};
}
export function animate(draw) {
  let id,previous,active=true; const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function tick(ms){ if(!active)return; const dt=previous===undefined?0:Math.min((ms-previous)/1000,0.05);previous=ms;draw(ms/1000,dt,reduced);id=requestAnimationFrame(tick); }
  id=requestAnimationFrame(tick);return ()=>{active=false;cancelAnimationFrame(id);};
}
export function grid(ctx,w,h,spacing=40) {
  ctx.fillStyle='#0d1721';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#203242';ctx.lineWidth=1;
  ctx.beginPath();for(let x=w/2%spacing;x<w;x+=spacing){ctx.moveTo(x,0);ctx.lineTo(x,h);}for(let y=h/2%spacing;y<h;y+=spacing){ctx.moveTo(0,y);ctx.lineTo(w,y);}ctx.stroke();
}
export function arrow(ctx,a,b,color='#82ebcc',label='') {
  const angle=Math.atan2(b[1]-a[1],b[0]-a[0]);ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();
  ctx.beginPath();ctx.moveTo(...b);ctx.lineTo(b[0]-12*Math.cos(angle-.4),b[1]-12*Math.sin(angle-.4));ctx.lineTo(b[0]-12*Math.cos(angle+.4),b[1]-12*Math.sin(angle+.4));ctx.closePath();ctx.fill();
  ctx.font='14px system-ui';ctx.fillText(label,b[0]+12,b[1]-10);
}
