# Graphics glossary

Use this as a quick lookup while reading. Each definition names a practical role rather than treating a term as a mysterious prerequisite.

## Images and coordinates

| Term | Meaning |
| --- | --- |
| Pixel | An element of a displayed or stored image; its color represents a sample or filtered region. |
| Texel | An element of a texture resource, which may contain color or numerical data. |
| Sample | One evaluation location or stored measurement used to approximate a continuous quantity. |
| Rasterization | Determining which samples a primitive covers and preparing fragment interpolation. |
| Fragment | A candidate contribution to a sample, which may be rejected, blended, or stored. |
| Coordinate frame | An origin, basis directions, and units used to express quantities. |
| Local space | Coordinates relative to an object’s own frame. |
| World space | A shared scene coordinate frame after parent transforms are composed. |
| View space | Coordinates relative to the camera. |
| Clip space | Homogeneous coordinates before clipping and perspective division. |
| NDC | Normalized device coordinates after dividing by homogeneous W. |
| Viewport | The mapping region from normalized coordinates into a render target. |
| DPR | Device pixel ratio, relating device and CSS pixel scales. |

## Geometry and mathematics

| Term | Meaning |
| --- | --- |
| Vector | A quantity with components; geometrically often a displacement or direction. |
| Unit vector | A vector of length one. |
| Dot product | A scalar measuring component alignment; unit-vector dot equals angle cosine. |
| Cross product | A 3D operation giving a perpendicular vector with area-related magnitude. |
| Matrix | Coefficients representing a linear or homogeneous coordinate transformation. |
| Homogeneous coordinates | An extra coordinate that unifies translation and projective operations. |
| Affine transform | A linear transform plus translation; preserves parallelism. |
| Normal | A surface-perpendicular direction used in geometry and shading. |
| Tangent | A direction along a curve or surface. |
| Derivative | Local rate of change of a function. |
| Gradient | Vector of a scalar field’s partial derivatives. |
| Integral | Continuous accumulation, often approximated by weighted samples. |
| Barycentric coordinates | Triangle weights summing to one; interior weights are nonnegative. |
| Quaternion | A four-component rotation representation, typically unit length. |
| Frustum | A camera’s visible volume between projection boundaries and clip planes. |
| Winding | Vertex ordering that determines a triangle’s oriented front/back classification. |
| Mesh | Geometry represented by vertices and primitives, usually triangles. |
| UV | Surface coordinates used to sample textures. |

## GPU resources and execution

| Term | Meaning |
| --- | --- |
| Shader | A GPU program executed for a rendering or compute stage. |
| GLSL | The shader language used by WebGL. |
| WGSL | The shader language used by WebGPU. |
| Attribute | Per-vertex or per-instance input data read according to a layout. |
| Uniform | Shared shader parameters that remain constant across the relevant draw or dispatch binding. |
| Varying | A vertex-to-fragment value, generally interpolated under declared rules. |
| Buffer | A GPU byte-storage resource with declared or intended roles. |
| Stride | Byte distance between successive records. |
| Offset | Byte position where a field or binding begins. |
| Alignment | Required multiple for a value or binding’s starting address. |
| VAO | WebGL object recording vertex-input configuration and index-buffer association. |
| Pipeline | WebGPU object describing compatible shaders and fixed rendering/compute configuration. |
| Bind group | WebGPU collection of actual resources matching a resource layout. |
| Texture view | A selected interpretation or portion of texture storage used by a binding or attachment. |
| Sampler | Rules for accessing a texture, including filtering and addressing. |
| Attachment | An image used as a rendering destination, such as color or depth. |
| Framebuffer | In WebGL, an attachment configuration for rendering destinations. |
| Command encoder | WebGPU recorder that produces a command buffer for submission. |
| Workgroup | A compute-invocation group that can cooperate through local shared storage and barriers. |
| Dispatch | A request to execute a grid of compute workgroups. |
| Readback | Transferring GPU results to CPU-accessible data. |
| Ping-pong | Alternating two resources as input and output to avoid unsafe feedback. |

## Light and appearance

| Term | Meaning |
| --- | --- |
| Linear light | Numerical representation proportional to the represented light quantity. |
| sRGB | A common color space/encoding with a nonlinear transfer function. |
| Alpha | A channel used for opacity or coverage under a defined compositing model. |
| Premultiplied alpha | RGB values already multiplied by alpha. |
| HDR | A representation retaining an intensity range beyond a basic normalized display range. |
| Exposure | A scale relating scene light to the display transformation. |
| Tone mapping | Compressing scene intensity into a displayable range. |
| Diffuse | Broadly scattered reflected contribution under a material model. |
| Specular | Directionally concentrated reflection related to surface microstructure and viewing direction. |
| BRDF | Function relating incoming and outgoing directions to reflected light. |
| PBR | Physically based rendering, using models constrained by physical principles. |
| Roughness | Material parameter controlling microfacet orientation spread and reflection width. |
| Metalness | Parameter in a metal/dielectric material workflow. |
| Fresnel | Change in reflection/transmission behavior with angle and medium properties. |
| Shadow map | Light-view depth data used to estimate whether a surface is occluded from a light. |
| Environment map | Direction-indexed surrounding radiance or imagery. |
| PMREM | Prefiltered environment representation supporting rough material response. |
| Bloom | Image-space spread of bright contributions, suggesting glare. |

## Performance and advanced rendering

| Term | Meaning |
| --- | --- |
| Draw call | A command requesting primitive rendering with selected resources/state. |
| Instancing | Reusing geometry with per-instance data in a repeated draw. |
| Overdraw | Repeated shading of the same screen region by overlapping primitives/passes. |
| LOD | Level of detail chosen to trade complexity against projected importance. |
| Mipmap | A progressively smaller prefiltered texture level. |
| Aliasing | False structure or instability caused by insufficient sampling of variation. |
| MSAA | Multisample antialiasing, especially addressing geometric coverage edges. |
| Ray casting | Finding visibility by intersecting rays with scene geometry. |
| Ray tracing | Ray-based rendering that may include further reflection, refraction, or shadow rays. |
| SDF | Signed distance field, ideally giving signed distance to a surface. |
| Sphere tracing | Advancing a ray using a conservative distance bound to approach a field surface. |
| Path tracing | Estimating light transport by sampling sequences of scattering events. |
| PDF | Probability density function in sampling contexts; unrelated to the book’s document format. |
| BVH | Bounding volume hierarchy accelerating geometric queries. |
| TSL | Three.js Shading Language, a JavaScript-based shader graph description system. |
| Render graph | Pass/resource dependency representation used to organize a frame. |

When a term feels abstract, return to the lab where its value is visible. A buffer becomes less mysterious when you can point to the typed array, its stride, the binding, and the shader input that reads it.
