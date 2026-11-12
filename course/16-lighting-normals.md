# Lighting and the geometry of normals

An unlit color says what to display regardless of surroundings. A lit material estimates how much light reaches the camera after interacting with a surface. We begin with a deliberately small model so every term has a geometric meaning.

**Experiment:** [Lit WebGL cube](#/lab/webgl-cube). **Reading bridge:** Eck §§4.1, 7.1.4, 7.2; [point lighting](https://webglfundamentals.org/webgl/lessons/webgl-3d-lighting-point.html) and [spot lighting](https://webglfundamentals.org/webgl/lessons/webgl-3d-lighting-spot.html).

## Normals describe surface orientation

A normal is a direction perpendicular to a surface. For a triangle, cross two nonparallel edge vectors and normalize. For a smooth mesh, vertex normals can be averaged across neighboring faces, then interpolated and normalized per fragment. A box should keep separate face normals; a sphere usually benefits from smoothly changing normals.

Interpolation does not preserve unit length. Always normalize an interpolated normal before using it in an angular expression. And keep all vectors in one frame: world normal with world light direction, or view normal with view light direction.

## Lambert’s cosine factor

Imagine a beam illuminating a flat patch. Tilting the patch spreads the same arriving light over more surface area. The contribution decreases with the cosine of the angle between its normal `n` and the direction `l` **toward the light**:

$$
L_{diffuse}=k_d C_{light}\max(0,\hat n\cdot\hat l).
$$

`kd` is a diffuse reflectance factor and `C_light` is incoming light color/intensity in linear units. The dot assumes unit vectors. `max(0,...)` removes light arriving from behind a one-sided surface. A physically normalized Lambertian BRDF includes a $1/\pi$ factor; this simple teaching equation absorbs constants into the light scale. Later PBR systems use a more complete convention.

A directional light has a common direction everywhere. A point light’s direction is `lightPosition - surfacePosition`, and its intensity physically decreases approximately as $1/r^2$ in unobstructed space. Clamp or soften the near-source singularity in an artistic renderer. A spotlight adds a cone falloff based on another dot product. These are distinct geometric factors.

![Normals, incident light, and reflected view direction](../public/diagrams/lighting-normals.svg)

## Highlights and the camera

A specular highlight depends on view direction. In Blinn–Phong shading, the half-vector is $h=\operatorname{normalize}(l+v)$ and a teaching highlight term is $k_s\max(0,n\cdot h)^q$. The exponent `q` controls concentration: larger values create tighter highlights. Evaluate it only under sensible front-facing illumination conditions and in the same coordinate frame.

This model is useful for understanding, but its exponent is not the same parameter as a modern roughness value. Do not convert by simply assigning `roughness = 1 / shininess` and expect physical equivalence. Likewise, an ambient constant prevents pure black in a simple lab but is not a simulation of indirect light.

## Why normals need inverse transpose

A tangent `t` lies along a surface, so $n\cdot t=0$. Under a linear transform `A`, the tangent becomes `At`. We need a new normal $n'$ satisfying $n'\cdot At=0$ for every tangent. Choosing

$$
n'=(A^{-1})^T n
$$

preserves that perpendicular relationship. The superscript T means transpose, swapping rows and columns. Inverse undoes the distortion, while transpose gives the correct dual relationship under the dot product. Normalize afterward.

For scale `(2,1,1)`, a diagonal normal `(1,1,0)` transformed as an ordinary direction becomes `(2,1,0)`, which tilts the wrong way. Inverse transpose gives `(0.5,1,0)` before normalization. A pure rotation has inverse transpose equal to itself, so the cube lab can use `mat3(model)` only because its model is rotation. Three.js provides `normalMatrix`, the inverse transpose of the model-view linear portion, in its shader system.

## Debugging light

First display normals as RGB. Check winding and verify a known face points the expected way. Next use a fixed unit light direction and a white diffuse material. Add transforms, then view-dependent highlights. If an object becomes darker only when scaled, investigate normal transformation before increasing every light’s intensity.

Light, shadow, environment reflection, and exposure are separate mechanisms. A specular material can look dark in a scene with nothing useful to reflect. A shadow map can make a lit patch dark without changing its normal. The studio chapters connect these mechanisms without hiding them behind arbitrary brightness adjustments.

**Optional application:** add a nonuniform scale to the raw cube, observe the simplified normal transform fail, then supply a CPU-computed normal matrix. This is a meaningful visual test of a derivation, not merely a formula to memorize.
