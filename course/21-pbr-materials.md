# Materials and physically based shading

The same geometry can look like chalk, plastic, copper, or glass because light interacts with its surface differently. A material is a model of that interaction. A physically based model constrains the approximation using ideas such as energy conservation and view-dependent reflection; it does not make every scene automatically photorealistic.

**Experiment:** [Material studio](#/lab/materials). **Reading bridge:** Eck §§4.1–4.3, 5.3.5 and 8.2.1; [Three.js materials](https://threejs.org/manual/en/materials.html) and [MeshStandardMaterial](https://threejs.org/docs/pages/MeshStandardMaterial.html).

## From one light to many directions

A small patch can receive light from many directions. A **BRDF**, bidirectional reflectance distribution function, describes how incoming direction and outgoing direction determine reflected light. You can think of it as a directional response function. A rough surface spreads reflected light over many directions; a polished surface concentrates it.

The rendering equation combines incoming radiance, the BRDF, and the cosine factor over all incoming directions. The integral symbol in

$$
L_o=L_e+\int_{\Omega}f_r(\omega_i,\omega_o)L_i(\omega_i)\max(0,n\cdot\omega_i)\,d\omega_i
$$

means “add contributions from a continuous set of directions.” `Lo` is outgoing radiance, `Le` is emission, `fr` the BRDF, `Li` incoming radiance, and `Omega` the relevant hemisphere. `dω` represents a tiny solid-angle region. This is a definition of the problem, not a formula you must evaluate directly in every real-time shader. Real-time renderers approximate parts with analytic lights, filtered environment maps, shadow maps, and other methods. The ray chapter introduces sampling this integral.

## Base color, roughness, metalness

For `MeshStandardMaterial`, base color participates differently for dielectrics and metals. A **dielectric** is a non-metal such as plastic or ceramic: much visible color comes from diffuse scattering, while the surface reflection is often roughly neutral. A metal has no ordinary diffuse lobe in the standard metalness model, and its reflected color is influenced by base color.

`metalness` usually represents material identity: 0 for a pure dielectric and 1 for a pure metal. Intermediate values are useful for mixed regions, transitions, or artistic effects, rather than a claim that an entire polished substance is “half metal.” Roughness describes the microstructure’s spread of surface orientations. It broadens reflections; it does not simply reduce a uniform opacity.

In the studio, set metalness to 1 and vary roughness. A dark metal with no bright environment can look almost black because it has little diffuse contribution and nothing strong to reflect. The procedural environment gives the material a studio card pattern to reflect, making the parameter visible without external HDR files.

## Fresnel reflection

Reflection generally grows toward grazing angles. A common approximation is Schlick’s expression:

$$
F(\theta)=F_0+(1-F_0)(1-\cos\theta)^5.
$$

`F0` is reflectance at normal incidence. The expression approaches 1 at grazing angles. This explains bright rims and why glass or plastic can be strongly reflective from the side. Do not implement a universal bright outline and call it physically accurate Fresnel: the normal, view direction, material, and lighting still matter.

## Maps and texture channels

Base color and emission are color textures. Normal, roughness, metalness, ambient occlusion, and displacement are numerical textures. In common glTF packing, roughness uses green and metalness blue in a combined texture; inspect the format rather than assuming red. AO needs the intended UV set and represents local occlusion of indirect light, not a replacement for every shadow.

A normal map perturbs the shading normal, usually in a tangent frame. It does not move vertices or alter silhouette. A displacement map changes actual geometry when the material/rendering path supports it and sufficient subdivisions exist. Bump mapping estimates normal variation from a height signal. Their names describe different mechanisms.

## Choosing a material

`MeshBasicMaterial` is useful for unlit graphics. `MeshNormalMaterial` diagnoses normals. `MeshStandardMaterial` is a practical PBR default. `MeshPhysicalMaterial` adds features such as clearcoat, transmission, and other richer behaviors with additional cost and setup requirements. Transparent opacity and physical transmission are different: lowering opacity is compositing, while transmission models light passing through a surface under renderer-specific approximations.

**Optional application:** create three identical spheres: a rough dielectric, a glossy dielectric, and a metal. Use one environment and fixed exposure, then change one parameter at a time. The shared shape makes material differences legible, while fixed lighting prevents unrelated changes from masking the cause.
