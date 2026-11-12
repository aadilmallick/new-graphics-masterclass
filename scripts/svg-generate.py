"""Original educational diagrams for Graphics Atelier. Run from any directory."""
from pathlib import Path
from html import escape
import math, textwrap

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'research'/'diagram-drafts'
OUT.mkdir(parents=True,exist_ok=True)
MINT='#78efce'; BLUE='#82b6ff'; PEACH='#ffc19b'; INK='#101827'; GRID='#26384b'; MUTED='#aebfd0'; WHITE='#eef5f8'

def text(x,y,s,size=21,color=WHITE,anchor='start',weight=400):
 return f'<text x="{x}" y="{y}" font-size="{size}" fill="{color}" text-anchor="{anchor}" font-weight="{weight}">{escape(s)}</text>'
def line(x1,y1,x2,y2,color=MUTED,width=2,dash=None,arrow=False):
 return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="{width}"'+(f' stroke-dasharray="{dash}"' if dash else '')+(f' marker-end="url(#{color[1:]})"' if arrow else '')+'/>'
def box(x,y,w,h,fill='#172337',stroke=GRID,r=15):
 return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" stroke="{stroke}"/>'
def circle(x,y,r,fill=MINT,stroke='none'):
 return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{fill}" stroke="{stroke}"/>'
def path(d,color=MINT,width=3,fill='none',dash=None):
 return f'<path d="{d}" stroke="{color}" stroke-width="{width}" fill="{fill}"'+(f' stroke-dasharray="{dash}"' if dash else '')+'/>'
def grid(x,y,w,h,step=36):
 return ''.join(line(i,y,i,y+h,GRID,1) for i in range(x,x+w+1,step))+''.join(line(x,j,x+w,j,GRID,1) for j in range(y,y+h+1,step))
def finish(name,title,subtitle,body,footer):
 defs='<defs>'+''.join(f'<marker id="{c[1:]}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 Z" fill="{c}"/></marker>' for c in [MINT,BLUE,PEACH,MUTED])+'''<linearGradient id="surface" x1="0" x2="1" color-interpolation="linearRGB"><stop offset="0" stop-color="#192c42"/><stop offset="0.35" stop-color="#234455"/><stop offset="0.7" stop-color="#2b5c65"/><stop offset="1" stop-color="#488a80"/></linearGradient></defs>'''
 footer_lines=textwrap.wrap(footer,width=113)
 footer_svg=''.join(text(42,565+j*20,s,15,MUTED) for j,s in enumerate(footer_lines))
 svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 600" role="img" aria-labelledby="title desc"><title id="title">{escape(title)}</title><desc id="desc">{escape(subtitle+" "+footer)}</desc>{defs}<rect width="1000" height="600" rx="22" fill="{INK}"/><g font-family="Segoe UI, Arial, sans-serif">'+text(42,52,title,29,WHITE,weight=650)+text(42,85,subtitle,17,MUTED)+body+line(42,542,958,542,GRID)+footer_svg+'</g></svg>'
 (OUT/name).write_text(svg,encoding='utf-8')

# 1. Coordinate spaces: an explicit sequence rather than falsely identical axes.
b=''
labels=[('Local','mesh coordinates'),('World','shared scene'),('View','camera at origin'),('Clip','homogeneous xyzw'),('NDC','divide xyz by w')]
for i,(a,c) in enumerate(labels):
 x=42+i*187
 b+=box(x,150,167,190)+text(x+83,184,a,23,MINT if i%2==0 else BLUE,'middle',600)+text(x+83,316,c,14,MUTED,'middle')
 ox=x+42;oy=267
 b+=line(ox,oy,ox+85,oy,MINT,2,arrow=True)+line(ox,oy,ox,oy-57,BLUE,2,arrow=True)
 b+=path(f'M {ox+16} {oy-12} L {ox+69} {oy-18} L {ox+30} {oy-47} Z',PEACH,2,'#59483f')
 if i<4:b+=line(x+168,244,x+184,244,MUTED,2,arrow=True)
b+=text(218,394,'M',26,MINT,'middle')+text(405,394,'V = C⁻¹',26,BLUE,'middle')+text(592,394,'P',26,MINT,'middle')+text(779,394,'÷ w',26,BLUE,'middle')+text(42,465,'pclip = P V M plocal',28,PEACH)+text(42,505,'Viewport then maps NDC to drawing-buffer pixels.',20,WHITE)
finish('coordinate-spaces.svg','One point, five coordinate spaces','Column vectors: the rightmost transform acts first.',b,'WebGL NDC z: −1…1. WebGPU NDC z: 0…1. Pixel Y orientation is a separate convention.')

# 2. Dot and cross: perpendicular vectors and consistent area.
b=box(42,123,440,390)+box(508,123,450,390)
b+=text(68,158,'Dot product = alignment',23,MINT,weight=600)+grid(74,192,360,252)
o=(130,416); a=(406,416);v=(296,250)
b+=line(*o,*a,MINT,4,arrow=True)+line(*o,*v,BLUE,4,arrow=True)+line(v[0],v[1],v[0],o[1],PEACH,2,'6 6')
b+=text(315,445,'a = (3, 0)',18,MINT)+text(264,239,'b = (1.8, 1.8)',18,BLUE)+text(160,392,'45°',19,PEACH)
b+=path('M 195 416 A 65 65 0 0 0 176 370',PEACH,2)+text(68,486,'a · b = |a| |b| cos θ',23,WHITE)
b+=text(534,158,'Cross product = oriented area',23,BLUE,weight=600)
b+=path('M 605 383 L 829 383 L 880 265 L 656 265 Z',MINT,2,'#203d43')+line(605,383,829,383,MINT,4,arrow=True)+line(605,383,656,265,BLUE,4,arrow=True)+circle(605,383,5,WHITE)
b+=line(706,326,706,206,PEACH,4,arrow=True)+text(720,228,'a × b',22,PEACH)+text(747,411,'a',22,MINT)+text(614,290,'b',22,BLUE)+text(534,451,'Perpendicular to both a and b.',20,WHITE)+text(534,486,'|a × b| = |a| |b| sin θ',23,WHITE)
finish('vectors-dot-cross.svg','Two vector products, two different questions','Dot returns a scalar. Cross in 3D returns a vector; swapping inputs flips its sign.',b,'Normalize nonzero vectors before using the dot product as cos θ. A zero vector has no direction.')

# 3. Matrix composition two panels with explicit example point.
b=''
for x,title,formula,pts,notes in [(42,'Rotate, then translate','T R p',[(170,320),(170,270),(230,270),(230,320)],'p=(1,0) → (0,1) → (2,1)'),(514,'Translate, then rotate','R T p',[(642,320),(642,170),(702,170),(702,320)],'p=(1,0) → (3,0) → (0,3)')]:
 b+=box(x,123,444,390)+text(x+24,159,title,23,MINT if x==42 else BLUE,weight=600)+grid(x+40,186,360,216)
 ox=x+90;oy=382
 b+=line(ox-18,oy,ox+255,oy,MUTED,2,arrow=True)+line(ox,oy+16,ox,oy-190,MUTED,2,arrow=True)
 final=(ox+120,oy-60) if x==42 else (ox,oy-180)
 b+=circle(ox+60,oy,6,BLUE)+text(ox+66,oy-12,'p',19,BLUE)+circle(*final,8,MINT)+text(final[0]+13,final[1]-10,'result',17,MINT)
 b+=text(x+24,446,formula,30,PEACH)+text(x+24,485,notes,19,WHITE)
finish('matrix-composition.svg','Transform order changes the result','Here R rotates +90° around the origin; T translates by (2, 0).',b,'For column vectors, T R p means apply R first. Matrix multiplication is generally not commutative.')

# 4. Projection side view; no physically ambiguous frustum perspective.
b=box(42,124,610,386)+box(677,124,281,386)+text(65,159,'Side view: a pinhole camera',21,MINT,weight=600)
eye=(110,320)
b+=circle(*eye,9,PEACH)+text(70,357,'eye',18,PEACH)+line(110,320,603,320,MUTED,2,'6 6')
b+=path('M 110 320 L 593 169 L 593 471 Z',BLUE,2,'#172c42')
b+=line(253,275,253,365,MINT,4)+line(593,169,593,471,BLUE,4)+text(253,403,'near',19,MINT,'middle')+text(593,503,'far',19,BLUE,'middle')
b+=line(420,320,420,223,PEACH,5)+text(434,245,'height y',18,PEACH)
b+=line(110,320,420,223,PEACH,2)+line(253,275,253,320,PEACH,5)+text(276,301,'image y′',16,PEACH)
b+=text(122,454,'Objects beyond the far plane are clipped.',17,MUTED)+text(699,166,'Similar triangles',21,BLUE,weight=600)
b+=text(699,224,'y′ / n = y / d',24,WHITE)+text(699,276,'y′ = n y / d',25,MINT)+text(699,332,'d = −zview > 0',20,PEACH)+text(699,382,'Farther objects',18,WHITE)+text(699,411,'project smaller.',18,WHITE)+text(699,473,'n > 0, far > n',20,MUTED)
finish('projection-frustum.svg','Perspective is division by distance','The visible volume is a frustum: a pyramid cut by near and far planes.',b,'This is a side view. The horizontal field of view is also affected by the canvas aspect ratio.')

# 5. Triangle barycentrics point calculated exact 0.25 A +.25 B +.5 C.
b=box(42,124,533,390)+box(600,124,358,390)+grid(70,164,468,288)
A=(129,443);B=(501,443);C=(315,185);P=(315,314)
b+=path(f'M {A[0]} {A[1]} L {B[0]} {B[1]} L {C[0]} {C[1]} Z',BLUE,3,'#25374d')
b+=path(f'M {A[0]} {A[1]} L {B[0]} {B[1]} L {P[0]} {P[1]} Z',MINT,1,'#2e655b')+line(*A,*P,PEACH,2)+line(*B,*P,PEACH,2)+line(*C,*P,PEACH,2)
for pos,label,col in [(A,'A',MINT),(B,'B',BLUE),(C,'C',PEACH)]:b+=circle(*pos,6,col)+text(pos[0]+12,pos[1]-10,label,23,col)
b+=circle(*P,8,WHITE)+text(328,307,'P',24,WHITE)+text(67,488,'Weights also interpolate colors, UVs, and normals.',18,MUTED)
b+=text(623,163,'A weighted average',22,MINT,weight=600)+text(623,220,'P = ¼ A + ¼ B + ½ C',22,WHITE)+text(623,270,'¼ + ¼ + ½ = 1',23,PEACH)+text(623,323,'Inside: all weights ≥ 0',20,WHITE)+text(623,365,'On an edge: one is 0',20,WHITE)+text(623,407,'Outside: one is negative',20,WHITE)+text(623,478,'Rasterization finds coverage.',18,MUTED)
finish('rasterization-barycentric.svg','Triangles become samples','Barycentric coordinates express a point as three weights that sum to one.',b,'Perspective-correct attributes interpolate a/w and 1/w, then divide. Screen-space weights alone distort UVs.')

# 6 pipeline data flow, correct fixed function vs programmable.
b=''
stages=[('Vertex fetch','Read buffer attributes',BLUE),('Vertex shader','Compute clip position',MINT),('Clip + rasterize','Find covered samples',BLUE),('Fragment shader','Compute sample color',MINT),('Depth + blend','Test and combine',BLUE)]
for i,(name,detail,col) in enumerate(stages):
 x=42+i*187
 b+=box(x,171,167,180)+text(x+83,211,str(i+1).zfill(2),26,col,'middle',600)+text(x+83,259,name,18,WHITE,'middle',600)+text(x+83,310,detail,13,MUTED,'middle')
 if i<4:b+=line(x+170,260,x+183,260,MUTED,2,arrow=True)
b+=box(42,395,916,103)+text(66,432,'CPU / JavaScript',20,PEACH,weight=600)+text(66,469,'Create resources → upload data → set state or pipeline → issue draw calls',21,WHITE)
b+=line(328,396,328,357,PEACH,2,arrow=True)+text(43,139,'GPU: parallel work with fixed-function stages between programs',20,MUTED)
finish('gpu-pipeline.svg','The programmable rendering pipeline','A draw call submits work; JavaScript does not execute the vertex or fragment shaders.',b,'Mint stages are your shader programs. Implementations may run early depth tests when the shader permits it.')

# 7 filtering with exact bilinear weights.
b=box(42,124,452,390)+box(519,124,439,390)+text(65,161,'A texture is a grid of texels',22,MINT,weight=600)
colors=['#f4b68d','#a6d4c7','#92b8ec','#666fad']
for i,c in enumerate(colors):b+=box(94+(i%2)*151,200+(i//2)*112,150,111,c,INK,0)
b+=circle(230,317,9,WHITE,INK)+text(65,185,'White point: sampling location',16,MUTED)+text(65,479,'Nearest chooses one. Linear blends neighbors.',18,MUTED)
b+=text(544,162,'Bilinear = lerp, then lerp',22,BLUE,weight=600)+text(544,216,'a = mix(topLeft, topRight, u)',18,WHITE)+text(544,257,'b = mix(bottomLeft, bottomRight, u)',18,WHITE)+text(544,298,'color = mix(a, b, v)',20,MINT)
b+=line(548,345,920,345,GRID)+text(544,384,'Mipmaps prefilter smaller images.',20,PEACH)+text(544,424,'They reduce shimmer when many',18,WHITE)+text(544,452,'texels land on a single pixel.',18,WHITE)+text(544,488,'u and v here are local cell fractions.',16,MUTED)
finish('texture-sampling.svg','Texture sampling reconstructs a signal','Texel centers and screen pixels are different grids. Filtering bridges them.',b,'A full mip chain needs about 4/3 of the base texture storage. Color textures and data textures need different handling.')

# 8 diffuse + inverse transpose normals precise statement.
b=box(42,124,506,390)+box(573,124,385,390)
b+=path('M 88 430 L 471 430 L 501 363 L 119 363 Z',MINT,2,'url(#surface)')
P=(285,382)
b+=line(*P,285,192,MINT,4,arrow=True)+text(295,211,'unit normal n',20,MINT)+line(*P,434,227,PEACH,4,arrow=True)+text(433,219,'to light ℓ',20,PEACH)+path('M 285 292 A 90 90 0 0 1 347 317',BLUE,2)+text(309,287,'θ',23,BLUE)
b+=text(67,482,'Normal = perpendicular direction to a surface.',18,MUTED)
b+=text(598,166,'Lambert diffuse',22,MINT,weight=600)+text(598,225,'brightness = max(0, n · ℓ)',21,WHITE)+text(598,278,'Front-lit: θ = 0°, value = 1',18,PEACH)+text(598,317,'Grazing: θ = 90°, value = 0',18,WHITE)+text(598,377,'After non-uniform scaling:',19,MUTED)+text(598,421,'n′ ∝ (M⁻¹)ᵀ n',27,BLUE)+text(598,479,'Normalize n′ before shading.',18,WHITE)
finish('lighting-normals.svg','Lighting begins with surface direction','Both vectors must use the same coordinate space before taking their dot product.',b,'The normal matrix is the inverse transpose of the relevant nonsingular linear transform; translation does not affect directions.')

# 9 binding address and encoding not huge text.
b=box(42,125,276,384)+box(362,125,277,384)+box(683,125,275,384)
b+=text(65,166,'JavaScript resources',22,MINT,weight=600)
for j,(a,c) in enumerate([('GPUBuffer',BLUE),('GPUTextureView',PEACH),('GPUSampler',MINT)]):b+=box(65,202+j*86,229,61,'#1c2b40',c,10)+text(179,239+j*86,a,21,c,'middle')
b+=text(385,166,'Bind group',22,BLUE,weight=600)
for j,a in enumerate(['binding 0: uniform','binding 1: texture','binding 2: sampler']):
 b+=box(385,202+j*86,230,61)+text(499,239+j*86,a,20,WHITE,'middle')
 b+=line(320,232+j*86,358,232+j*86,MUTED,2,arrow=True)
b+=text(705,166,'WGSL declarations',22,PEACH,weight=600)+text(705,219,'@group(0)',19,MINT)+text(705,249,'@binding(0)',19,MINT)+text(705,282,'var<uniform> camera…',16,WHITE)+text(705,340,'@binding(1) texture…',17,PEACH)+text(705,426,'@binding(2) sampler…',17,BLUE)
b+=line(641,295,679,295,MUTED,2,arrow=True)+text(65,478,'Data is allocated here.',17,MUTED)+text(385,478,'Resources get addresses.',17,MUTED)+text(705,478,'Shader uses addresses.',17,MUTED)
finish('webgpu-bindings.svg','Bindings connect resources to shader code','Bind group layouts specify what each binding accepts; a pipeline layout collects the groups.',b,'pass.setBindGroup(0, group) selects group 0. A binding number is an interface slot, not a byte offset.')

# 10 hierarchy math.
b=box(42,125,550,385)+box(617,125,341,385)
nodes=[(205,156,220,62,'Scene / root',BLUE),(205,277,220,62,'Orbit group',MINT),(83,402,202,62,'Planet mesh',PEACH),(326,402,222,62,'Moon group',MINT)]
b+=path('M 315 218 V 277',MUTED,2)+path('M 315 339 V 369 H 184 V 402 M 315 369 H 437 V 402',MUTED,2)
for x,y,w,h,s,c in nodes:b+=box(x,y,w,h,'#1c2b40',c,11)+text(x+w/2,y+39,s,22,c,'middle',600)
b+=text(642,168,'Local → world',23,MINT,weight=600)+text(642,227,'Wchild = Wparent Lchild',22,WHITE)+text(642,287,'Move a parent:',20,PEACH)+text(642,321,'all descendants follow.',20,WHITE)+text(642,380,'Geometry stays in its',19,WHITE)+text(642,411,'own local coordinates.',19,WHITE)+text(642,475,'Share geometry; vary transforms.',16,MUTED)
finish('scene-graph.svg','A scene graph composes local transforms','A child inherits its parent’s transform, then applies its own local transform.',b,'A mesh combines geometry and material. A group organizes transforms without needing visible geometry.')

print(f'Wrote {len(list(OUT.glob("*.svg")))} draft diagrams to {OUT}')
