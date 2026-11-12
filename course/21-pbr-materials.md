# Materials and physically based shading

The same geometry can look like chalk, plastic, copper, or glass because light interacts with its surface differently. A material is a model of that interaction. A physically based model constrains the approximation using ideas such as energy conservation and view-dependent reflection; it does not make every scene automatically photorealistic.

**Experiment:** [Material studio](#/lab/materials). **Reading bridge:** Eck §§4.1–4.3, 5.3.5 and 8.2.1; [Three.js materials](https://threejs.org/manual/en/materials.html) and [MeshStandardMaterial](https://threejs.org/docs/pages/MeshStandardMaterial.html).

## Begin by fixing the scene and changing only the surface

To understand a material, compare identical geometry under identical lighting. If you change shape, camera, light intensity, exposure, and roughness simultaneously, the resulting image cannot tell you which change caused the effect. The studio lab deliberately gives you one recognizable curved object and controls over a few parameters. Keep its camera and exposure fixed while comparing the surface response first.

Imagine three spheres. One is matte white ceramic, another glossy red plastic, and the third polished copper. Their visible boundaries can be identical, yet their interiors look different. Ceramic spreads much incoming light broadly. Plastic combines a colored broad contribution with a more neutral surface reflection. Copper's visible response is dominated by colored reflection rather than an ordinary diffuse body contribution. A useful material model must distinguish those behaviors instead of providing only one generic brightness slider.

The word physically based names constraints and approximations, not an automatic style. Energy conservation prevents a passive surface from reflecting more energy than it receives under the model. Reciprocity relates scattering when incoming and outgoing directions are exchanged under the relevant assumptions. Real-time implementations approximate light transport and microstructure to make the calculation practical. A scene can obey those model choices and still look unconvincing if its scale, lights, assets, or color handling are inconsistent.

## Understand a directional response before an integral

You learned the cosine factor for one incoming direction. Now imagine the surface receives three small contributions from three different directions. For each one, evaluate how much illumination arrives, how the material sends it toward the viewer, and the geometric cosine. Add those three contributions. Nothing about the basic idea requires an integral yet; it is a weighted sum.

Suppose the contributions after material and geometric factors are 0.2, 0.35, and 0.1 in one color channel. The outgoing reflected total is 0.65 for that simplified finite set. If the environment contains a continuous spread of directions, there are no longer only three terms. The integral notation compactly represents adding contributions over all the direction patches. A numerical approximation samples finitely many patches or directions and includes suitable weights.

This is why the BRDF has two direction arguments. Knowing where light arrives from is insufficient; a shiny surface can send most of that contribution in a direction that misses the camera. The outgoing direction toward the viewer matters. A diffuse idealization sends the contribution broadly and has a simpler angular response, but it is still a particular directional model rather than a universal rule for all materials.

A solid angle measures a patch of directions as seen from a point. It is analogous to an ordinary angle measuring an arc in a plane, but it describes directional extent in three dimensions. A tiny nearby light can occupy a larger directional patch than the same-sized light far away. You do not need to calculate arbitrary solid-angle integrals by hand to understand why environment lighting combines many incoming directions.

## From one light to many directions

A small patch can receive light from many directions. A **BRDF**, bidirectional reflectance distribution function, describes how incoming direction and outgoing direction determine reflected light. You can think of it as a directional response function. A rough surface spreads reflected light over many directions; a polished surface concentrates it.

The rendering equation combines incoming radiance, the BRDF, and the cosine factor over all incoming directions. The integral symbol in

$$
L_o=L_e+\int_{\Omega}f_r(\omega_i,\omega_o)L_i(\omega_i)\max(0,n\cdot\omega_i)\,d\omega_i
$$

means “add contributions from a continuous set of directions.” `Lo` is outgoing radiance, `Le` is emission, `fr` the BRDF, `Li` incoming radiance, and `Omega` the relevant hemisphere. `dω` represents a tiny solid-angle region. This is a definition of the problem, not a formula you must evaluate directly in every real-time shader. Real-time renderers approximate parts with analytic lights, filtered environment maps, shadow maps, and other methods. The ray chapter introduces sampling this integral.

## Work through energy allocation conceptually

Consider a simplified dielectric patch receiving one unit of incident energy. Some is reflected near the surface; some enters the material, scatters, is absorbed, or emerges. A model should not independently assign a full unit to surface reflection and another full unit to diffuse reflection without accounting for their relationship. Otherwise the combined response can create energy artificially.

A metalness workflow packages common material families into a manageable parameterization. At the dielectric end, base color mainly controls the diffuse/body contribution while the normal-incidence specular response is usually comparatively neutral under the model. At the metallic end, the ordinary diffuse contribution is removed and base color influences the reflected color. The engine handles the detailed combination, so understanding the workflow helps you author plausible inputs rather than manually add unrelated lobes.

A metalness value such as 0.5 can be useful for a texture representing mixed coverage between metallic and nonmetallic regions. It is not a universal physical composition percentage. A copper object with dirt or paint can have different material identities across its surface. Use texture masks to describe those regions rather than assuming the whole object becomes physically half-metallic everywhere.

## Base color, roughness, metalness

For `MeshStandardMaterial`, base color participates differently for dielectrics and metals. A **dielectric** is a non-metal such as plastic or ceramic: much visible color comes from diffuse scattering, while the surface reflection is often roughly neutral. A metal has no ordinary diffuse lobe in the standard metalness model, and its reflected color is influenced by base color.

`metalness` usually represents material identity: 0 for a pure dielectric and 1 for a pure metal. Intermediate values are useful for mixed regions, transitions, or artistic effects, rather than a claim that an entire polished substance is “half metal.” Roughness describes the microstructure’s spread of surface orientations. It broadens reflections; it does not simply reduce a uniform opacity.

In the studio, set metalness to 1 and vary roughness. A dark metal with no bright environment can look almost black because it has little diffuse contribution and nothing strong to reflect. The procedural environment gives the material a studio card pattern to reflect, making the parameter visible without external HDR files.

## Roughness is a distribution, not a blur button

Picture a surface as many tiny mirror-like facets whose orientations vary. A polished region has a narrow orientation distribution, so reflected highlights stay concentrated. A rough region has a broader distribution, so more outgoing directions receive smaller contributions. The visible result is broader highlights and blurrier environmental reflections, not merely a darker copy of the same image.

At a fixed camera, increasing roughness can make one pixel brighter and another darker because reflected energy is redistributed directionally. It is therefore misleading to explain roughness as the opposite of brightness. Likewise, a rough metal is still metal in this workflow; roughness does not add a diffuse body contribution by itself.

Try the studio at high metalness and low roughness. The bright procedural cards appear as concentrated structure across the knot. Increase roughness while holding exposure fixed. The structure broadens. Now set metalness to zero: the same base color participates differently, and diffuse illumination becomes important. This controlled comparison separates two material axes that beginners often change together without understanding their independent roles.

## Evaluate Fresnel at a few angles

Schlick's expression provides an instructive numerical model. Suppose normal-incidence reflectance F0 is 0.04, a common illustrative dielectric value rather than a universal constant for every substance. At cosine one, the extra term contains `(1-1)^5`, so the result is 0.04. At cosine 0.5, the extra factor is `0.5^5 = 0.03125`, giving `0.04 + 0.96*0.03125 = 0.07`.

At cosine 0.1, the factor is `0.9^5 = 0.59049`, so reflectance becomes about `0.04 + 0.56687 = 0.60687`. At grazing cosine zero it reaches one. These values explain why a surface that seems weakly reflective straight on can show strong reflection near a silhouette. The material response changes with angle even when roughness and base color stay fixed.

The cosine in a specific microfacet Fresnel calculation belongs to the appropriate interacting directions, not an arbitrary screen-edge measure. A stylized rim term based only on normal-view alignment can be visually useful, but it should be named as an artistic approximation. PBR parameters are most useful when their mathematical role remains distinct from a decorative effect.

## Fresnel reflection

Reflection generally grows toward grazing angles. A common approximation is Schlick’s expression:

$$
F(\theta)=F_0+(1-F_0)(1-\cos\theta)^5.
$$

`F0` is reflectance at normal incidence. The expression approaches 1 at grazing angles. This explains bright rims and why glass or plastic can be strongly reflective from the side. Do not implement a universal bright outline and call it physically accurate Fresnel: the normal, view direction, material, and lighting still matter.

## Give a reflective material something meaningful to reflect

A perfect mirror in an environment containing only a uniform dark color will mostly show that dark color. The mirror shader can be correct while the image looks flat or black. Reflectivity is a response to incoming radiance, not a source of radiance. This is why environment design is integral to material evaluation.

The studio creates a separate environment scene with a dark background and bright planes. `PMREMGenerator` turns that directional lighting pattern into a filtered resource suitable for the material system. The planes function like studio reflection cards. They need not appear as visible geometry in the main scene to contribute recognizable reflection structure through the environment.

The generated environment is an approximation of surroundings. It does not automatically contain every dynamic object in the main scene. A nearby moving object will not necessarily appear in reflections unless the rendering technique captures or otherwise computes that contribution. Understanding this limitation helps explain why an environment-mapped object can look plausible while failing a close inspection of local reflections.

## Decode material maps by meaning and channel

A base-color texture records a color intended to participate in shading, so its encoding must be interpreted correctly. A roughness texture records a parameter. A normal texture records a direction representation. Applying the same color-space transform to all three treats numerical data as though it were a photograph and changes the material in unintended ways.

For a common tangent-space normal map, stored RGB values from zero to one are remapped into signed components with `2*value-1`. A near-flat normal often appears approximately `(0.5,0.5,1)` before remapping, giving `(0,0,1)` in its local tangent frame. That tangent frame aligns the normal perturbation with the surface's UV orientation. It is not automatically a world-space vector.

A normal map changes shading orientation without moving the mesh silhouette. Looking along a surface edge can reveal that the “bumps” have no geometric thickness. Displacement changes actual positions where supported and where sufficient vertex resolution exists. Bump mapping derives orientation variation from a scalar height signal. Choose based on whether the detail must affect outline, parallax, shadowing, or only local highlight variation.

Packed textures save resources by storing different scalar parameters in different channels. Common glTF material conventions place roughness in green and metalness in blue. A grayscale image duplicated into all channels can conceal a wrong channel choice during testing; use a deliberately distinct test pattern when verifying packing. Format conventions belong to the asset contract, not to an intuitive assumption that red is always the first parameter.

## Maps and texture channels

Base color and emission are color textures. Normal, roughness, metalness, ambient occlusion, and displacement are numerical textures. In common glTF packing, roughness uses green and metalness blue in a combined texture; inspect the format rather than assuming red. AO needs the intended UV set and represents local occlusion of indirect light, not a replacement for every shadow.

A normal map perturbs the shading normal, usually in a tangent frame. It does not move vertices or alter silhouette. A displacement map changes actual geometry when the material/rendering path supports it and sufficient subdivisions exist. Bump mapping estimates normal variation from a height signal. Their names describe different mechanisms.

## Read the studio material settings as an authored compromise

The studio starts with roughness 0.25 and metalness 0.65. Those values make reflection changes legible on its procedural shape. They are an artistic teaching preset, not a measurement of a named real substance. A production asset intended as pure polished copper would usually establish its metallic identity more explicitly and author its reflectance and roughness from an appropriate reference.

The renderer uses ACES filmic tone mapping and an exposure value through the shared scene helper. This influences the displayed image after lighting. The exposure slider can make bright regions approach display white, but it does not change how the surface redirects light. The key-light slider changes one illumination source. A consistent comparison holds output treatment steady while evaluating a material parameter.

A useful diagnostic sequence is to inspect the object with a basic material, then normals, then a neutral standard material, then the desired maps and environment. If the surface appears washed out only after adding a texture, inspect its color-space annotation. If a metal remains dark, inspect incoming environment and direct-light placement before changing base color to implausibly high values. If a roughness pattern seems inverted, inspect channel selection and source convention rather than adding unrelated light.

## Decide how much material complexity the scene needs

A standard material is a strong default for opaque metal/dielectric studies. A physical material can add features such as clearcoat or transmission, but each feature introduces additional assumptions and cost. Clearcoat represents another surface-like layer; it is not merely a second arbitrary specular color. Transmission is not the same as blending the object with the page behind it, and its real-time approximation has information limits.

Begin with the minimum material that explains the intended object. Add richer features when their visual role is identifiable and their input data is available. A compelling scene often comes from coherent light, reflection structure, roughness variation, and composition rather than activating every available material option. Being fluent means being able to explain which layer contributes to the observed image.

## Choosing a material

`MeshBasicMaterial` is useful for unlit graphics. `MeshNormalMaterial` diagnoses normals. `MeshStandardMaterial` is a practical PBR default. `MeshPhysicalMaterial` adds features such as clearcoat, transmission, and other richer behaviors with additional cost and setup requirements. Transparent opacity and physical transmission are different: lowering opacity is compositing, while transmission models light passing through a surface under renderer-specific approximations.

**Optional application:** create three identical spheres: a rough dielectric, a glossy dielectric, and a metal. Use one environment and fixed exposure, then change one parameter at a time. The shared shape makes material differences legible, while fixed lighting prevents unrelated changes from masking the cause.
