// Column vectors; flat matrices are column-major: index = column * 4 + row.
export const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
export const lerp = (a, b, t) => a + (b - a) * t;
export const radians = degrees => degrees * Math.PI / 180;
export const dot = (a, b) => a.reduce((sum, value, i) => sum + value * b[i], 0);
export const length = a => Math.hypot(...a);
export const normalize = a => { const n = length(a); return n > 1e-10 ? a.map(v => v / n) : a.map(() => 0); };
export const subtract = (a, b) => a.map((v, i) => v - b[i]);
export const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
export function identity() { return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]); }
export function multiply(a, b) {
  const out = new Float32Array(16);
  for (let col = 0; col < 4; col++) for (let row = 0; row < 4; row++)
    for (let k = 0; k < 4; k++) out[col*4+row] += a[k*4+row] * b[col*4+k];
  return out;
}
export function transform(m, p) { return Array.from({length:4}, (_, r) => p.reduce((s,v,c)=>s+m[c*4+r]*v,0)); }
export function translation(x,y,z) { const m = identity(); m.set([x,y,z],12); return m; }
export function scaling(x,y,z) { const m = identity(); m[0]=x; m[5]=y; m[10]=z; return m; }
export function rotationY(a) { const c=Math.cos(a),s=Math.sin(a); return new Float32Array([c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1]); }
export function perspective(fovY, aspect, near, far, webgpu=false) {
  if (!(fovY>0 && fovY<Math.PI && aspect>0 && near>0 && far>near)) throw new RangeError('Invalid perspective camera');
  const f=1/Math.tan(fovY/2), range=1/(near-far);
  return new Float32Array([f/aspect,0,0,0, 0,f,0,0, 0,0,(webgpu?far:far+near)*range,-1, 0,0,(webgpu?far*near:2*far*near)*range,0]);
}
export function lookAt(eye,target,up=[0,1,0]) {
  const z=normalize(subtract(eye,target));
  const x=normalize(cross(up,z));
  if (length(x)<1e-8 || length(z)<1e-8) throw new RangeError('Degenerate camera basis');
  const y=cross(z,x);
  return new Float32Array([x[0],y[0],z[0],0, x[1],y[1],z[1],0, x[2],y[2],z[2],0, -dot(x,eye),-dot(y,eye),-dot(z,eye),1]);
}
export function barycentric(p,a,b,c) {
  const d=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);
  if (Math.abs(d)<1e-10) return null;
  const u=((b[1]-c[1])*(p[0]-c[0])+(c[0]-b[0])*(p[1]-c[1]))/d;
  const v=((c[1]-a[1])*(p[0]-c[0])+(a[0]-c[0])*(p[1]-c[1]))/d;
  return [u,v,1-u-v];
}
export function raySphere(origin,direction,center,radius) {
  const oc=subtract(origin,center), a=dot(direction,direction), halfB=dot(oc,direction), c=dot(oc,oc)-radius*radius;
  if (a<1e-12) return null;
  const discriminant=halfB*halfB-a*c;
  if(discriminant<0) return null;
  const root=Math.sqrt(discriminant);
  return [(-halfB-root)/a,(-halfB+root)/a].find(t=>t>1e-4) ?? null;
}
