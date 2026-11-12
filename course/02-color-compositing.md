# Color, alpha, and the meaning of brightness

A color is a set of numbers interpreted under a convention. The same triplet can mean different physical brightness in different color spaces. This matters because lighting is arithmetic on light, while image files are often encoded for storage and display.

**Related lab:** [Material studio](#/lab/materials), revisited after lighting. **Reading bridge:** Eck §2.1.4; [WebGL and alpha](https://webglfundamentals.org/webgl/lessons/webgl-and-alpha.html); [Three.js color management](https://threejs.org/manual/pages/color-management.html).

## Channels and ranges

RGB represents red, green, and blue channel values. On an 8-bit image each channel commonly has 256 possible values, 0 through 255. The normalized version divides by 255. `[255, 128, 0]` therefore becomes approximately `[1, 0.502, 0]`. A fourth channel, **alpha**, describes opacity or coverage under a chosen compositing model. Alpha is not a fourth kind of colored light.

One uncompressed 1920 × 1080 RGBA8 image needs $1920\cdot1080\cdot4=8,294,400$ bytes, about 7.91 MiB. A mip chain adds roughly a third more for a large square texture. Higher precision and multisampling increase the cost further.

## Straight alpha and premultiplied alpha

With straight alpha, RGB stores the unattenuated surface color. For a source color $C_s$ with alpha $\alpha_s$ over an opaque background $C_b$:

$$
C_{out}=\alpha_s C_s+(1-\alpha_s)C_b.
$$

Half-opaque red over blue gives $(0.5,0,0.5)$ **if the arithmetic is performed in linear light**. This numeric example is about the blend equation; a typical encoded 8-bit operation may produce a different perceived result.

Premultiplied alpha stores $C'_s=\alpha_s C_s$ beforehand. The same operation becomes $C'_{out}=C'_s+(1-\alpha_s)C'_b$, with $\alpha_{out}=\alpha_s+(1-\alpha_s)\alpha_b$. For a translucent destination, straight output RGB is premultiplied output divided by output alpha, when alpha is nonzero.

These representations need different WebGL blend factors. Straight output commonly uses `SRC_ALPHA, ONE_MINUS_SRC_ALPHA`; premultiplied output uses `ONE, ONE_MINUS_SRC_ALPHA`. `blendFuncSeparate` can handle alpha accumulation separately. A WebGL canvas is itself composited into the page, and context attributes such as `premultipliedAlpha` describe that browser boundary. They do not automatically rewrite every shader’s internal math.

Dark fringes around translucent edges often signal a mismatch: an image was filtered as premultiplied data and then treated as straight, or vice versa. Match asset encoding, shader output, blend factors, and page compositing.

## Linear light and sRGB

**Linear light** means doubling a value doubles the represented light quantity. sRGB uses a nonlinear encoding that allocates more code values to dark regions. An sRGB channel of 0.5 represents about 0.214 in linear light, not half the light of 1.0.

For an sRGB channel $s$ between 0 and 1, decode it as

$$
L=\begin{cases}s/12.92&s\le0.04045\\((s+0.055)/1.055)^{2.4}&s>0.04045.\end{cases}
$$

The braces mean “use one formula under one condition and the other formula otherwise.” There is no calculus here. Decode color input, perform lighting and blending in linear space, then encode output once. A rough power of 2.2 is a common illustration, but it is not the exact sRGB transfer function. The small raw ray tracer labels its approximation explicitly.

In Three.js r187, CSS and hexadecimal colors are interpreted through its color-management system. Color image textures such as base color and emission usually need `texture.colorSpace = THREE.SRGBColorSpace`. Numerical textures, including normal, roughness, metalness, and displacement maps, remain `THREE.NoColorSpace`. Incorrectly decoding a roughness map changes material behavior.

## HDR, exposure, and tone mapping

Lighting can produce values greater than 1. A bright source does not stop emitting because an 8-bit display saturates. **High dynamic range**, HDR, preserves those larger values. Exposure scales the light reaching the display transform. Tone mapping compresses a large light range into a displayable range. This is different from sRGB encoding; both can be needed, in that order.

The studio lab uses an HDR-capable rendering path with ACES filmic tone mapping. Increasing exposure brightens the whole image; increasing one light changes the illumination relationship. They can look similar in one region but have different causes.

**Optional application:** use the studio’s exposure control and compare the appearance of a rough versus glossy object. Later, build a grayscale ramp with a correct linear-to-sRGB conversion. Display a second ramp without conversion to make the distinction visible.
