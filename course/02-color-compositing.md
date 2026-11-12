# Color, alpha, and the meaning of brightness

A color is a set of numbers interpreted under a convention. The same triplet can mean different physical brightness in different color spaces. This matters because lighting is arithmetic on light, while image files are often encoded for storage and display.

**Related lab:** [Material studio](#/lab/materials), revisited after lighting. **Reading bridge:** Eck §2.1.4; [WebGL and alpha](https://webglfundamentals.org/webgl/lessons/webgl-and-alpha.html); [Three.js color management](https://threejs.org/manual/pages/color-management.html).

## Channels and ranges

RGB represents red, green, and blue channel values. On an 8-bit image each channel commonly has 256 possible values, 0 through 255. The normalized version divides by 255. `[255, 128, 0]` therefore becomes approximately `[1, 0.502, 0]`. A fourth channel, **alpha**, describes opacity or coverage under a chosen compositing model. Alpha is not a fourth kind of colored light.

One uncompressed 1920 × 1080 RGBA8 image needs $1920\cdot1080\cdot4=8,294,400$ bytes, about 7.91 MiB. A mip chain adds roughly a third more for a large square texture. Higher precision and multisampling increase the cost further.

## Read a color record one channel at a time

Take the color used throughout the workshop, hexadecimal `#82ebcc`. Hexadecimal writes a byte with two base-sixteen digits. The red pair `82` means eight groups of sixteen plus two, giving 130. The green pair `eb` means fourteen groups of sixteen plus eleven, giving 235. The blue pair `cc` means twelve groups of sixteen plus twelve, giving 204. We therefore have the integer RGB record `(130,235,204)`.

Normalizing these channel values divides each by 255. The resulting values are approximately `(0.510,0.922,0.800)`. Normalization changes the numerical scale used to store or communicate the values. It does not, by itself, decode sRGB into linear light. This is an important distinction: dividing by 255 removes an integer scale factor, while decoding changes the transfer relationship between stored code and represented light.

The following complete console example separates those steps:

```js
function byteToNormalized(value) {
  return value / 255;
}
function decodeSRGB(value) {
  return value <= 0.04045
    ? value / 12.92
    : ((value + 0.055) / 1.055) ** 2.4;
}
const bytes = [130, 235, 204];
const encoded = bytes.map(byteToNormalized);
const linear = encoded.map(decodeSRGB);
console.log('Normalized sRGB:', encoded);
console.log('Linear light:', linear);
```

The first output tells us the image's normalized encoded values. The second gives values appropriate for light-proportional arithmetic under the sRGB convention. Keeping the two names distinct prevents a variable such as `color` from silently changing meaning halfway through a shader.

RGB is a practical representation based on three chosen primary directions in color space. It is not a literal record of every wavelength of incoming light. Different spectral mixtures can produce the same tristimulus color under specified conditions. For the real-time rendering topics here, an RGB working space is a useful approximation. More specialized spectral rendering exists, but is not required to reason correctly about the basic RGB pipeline.

## Derive source-over blending as a weighted contribution

Imagine a foreground layer covering one quarter of a pixel area, with a completely opaque background visible in the remaining three quarters. If the foreground has linear-light red value 0.8 and the background red value 0.2, averaging area contributions gives `0.25*0.8 + 0.75*0.2`. The first contribution is 0.2 and the second 0.15, so output red is 0.35.

The same calculation applies independently to green and blue. The foreground's fraction is alpha, and the background's remaining fraction is one minus alpha. This motivates the source-over formula for an opaque destination. An opacity interpretation can use the same algebra under an idealized thin-layer model, although alpha does not capture every physical interaction of light with a translucent material.

Use an alpha of zero and the source contributes nothing. Use an alpha of one and the source replaces the background. Intermediate values create a weighted mixture. These endpoint checks are valuable when implementing a blend equation because they expose a swapped factor immediately.

For a foreground linear color `(0.8,0.2,0.1)`, a background `(0.1,0.3,0.7)`, and alpha 0.25, the output channels are:

- Red: `0.25*0.8 + 0.75*0.1 = 0.275`.
- Green: `0.25*0.2 + 0.75*0.3 = 0.275`.
- Blue: `0.25*0.1 + 0.75*0.7 = 0.55`.

The result is bluish because the mostly visible background dominates. Alpha does not ask whether the source color is bright, saturated, or visually important. It scales the source contribution according to the compositing model.

## Straight alpha and premultiplied alpha

With straight alpha, RGB stores the unattenuated surface color. For a source color $C_s$ with alpha $\alpha_s$ over an opaque background $C_b$:

$$
C_{out}=\alpha_s C_s+(1-\alpha_s)C_b.
$$

Half-opaque red over blue gives $(0.5,0,0.5)$ **if the arithmetic is performed in linear light**. This numeric example is about the blend equation; a typical encoded 8-bit operation may produce a different perceived result.

Premultiplied alpha stores $C'_s=\alpha_s C_s$ beforehand. The same operation becomes $C'_{out}=C'_s+(1-\alpha_s)C'_b$, with $\alpha_{out}=\alpha_s+(1-\alpha_s)\alpha_b$. For a translucent destination, straight output RGB is premultiplied output divided by output alpha, when alpha is nonzero.

These representations need different WebGL blend factors. Straight output commonly uses `SRC_ALPHA, ONE_MINUS_SRC_ALPHA`; premultiplied output uses `ONE, ONE_MINUS_SRC_ALPHA`. `blendFuncSeparate` can handle alpha accumulation separately. A WebGL canvas is itself composited into the page, and context attributes such as `premultipliedAlpha` describe that browser boundary. They do not automatically rewrite every shader’s internal math.

Dark fringes around translucent edges often signal a mismatch: an image was filtered as premultiplied data and then treated as straight, or vice versa. Match asset encoding, shader output, blend factors, and page compositing.

## Work through two translucent layers

When the background is also translucent, we must calculate output alpha as well as color. Let a source have alpha 0.5 over a destination with alpha 0.4. The source occupies half the available contribution. The destination can contribute only through the source's remaining half, so its effective alpha contribution is `0.4*0.5 = 0.2`. Total output alpha is `0.5 + 0.2 = 0.7`.

For color, premultiplied representation makes the bookkeeping direct. Suppose the source's straight RGB is red `(1,0,0)` and the destination's straight RGB is blue `(0,0,1)`. Premultiplying produces source `(0.5,0,0)` and destination `(0,0,0.4)`. Source-over yields `(0.5,0,0) + 0.5*(0,0,0.4) = (0.5,0,0.2)`, with alpha 0.7.

If you need straight output RGB, divide the premultiplied RGB by 0.7. The result is approximately `(0.714,0,0.286)`. If you keep premultiplied storage, leave it as `(0.5,0,0.2,0.7)`. Both describe the same composited result under the appropriate interpretation. Dividing by alpha zero is undefined, so a conversion routine needs an explicit zero-alpha policy.

This console program implements the premultiplied calculation:

```js
function premultiply(rgb, alpha) {
  return [...rgb.map(channel => channel * alpha), alpha];
}
function over(source, destination) {
  const remaining = 1 - source[3];
  return source.map((channel, index) =>
    channel + destination[index] * remaining
  );
}
const source = premultiply([1, 0, 0], 0.5);
const destination = premultiply([0, 0, 1], 0.4);
console.log(over(source, destination)); // [0.5, 0, 0.2, 0.7]
```

The same expression works for the fourth channel because the source alpha and destination alpha obey the same source-over accumulation pattern. Inputs must already be premultiplied. Calling this function with straight source colors would produce a different and incorrect interpretation.

## Why filtering transparent edges can create fringes

Consider a two-texel image containing opaque red `(1,0,0,1)` and fully transparent black `(0,0,0,0)`. Interpolating their straight stored values halfway gives `(0.5,0,0,0.5)`. If that result is then treated as straight color and blended over black, its red is multiplied by alpha again, producing 0.25. A half-covered red edge should instead contribute 0.5.

With premultiplied interpretation, the interpolated record `(0.5,0,0,0.5)` already represents half a red contribution. Using the premultiplied blend factors preserves 0.5. The bytes can look identical at one point while the interpretation and subsequent arithmetic differ. This is why a texture upload flag, a shader's output convention, a blend configuration, and browser canvas compositing must form a consistent chain.

Another strategy for straight-alpha assets is to keep meaningful color in transparent border texels rather than black, so filtering does not pull unrelated dark RGB into the edge. Atlas padding and image-processing tools often address this. The right implementation depends on the asset pipeline and API path; blindly multiplying or unmultiplying several times is not a robust repair.

## Linear light and sRGB

**Linear light** means doubling a value doubles the represented light quantity. sRGB uses a nonlinear encoding that allocates more code values to dark regions. An sRGB channel of 0.5 represents about 0.214 in linear light, not half the light of 1.0.

For an sRGB channel $s$ between 0 and 1, decode it as

$$
L=\begin{cases}s/12.92&s\le0.04045\\((s+0.055)/1.055)^{2.4}&s>0.04045.\end{cases}
$$

The braces mean “use one formula under one condition and the other formula otherwise.” There is no calculus here. Decode color input, perform lighting and blending in linear space, then encode output once. A rough power of 2.2 is a common illustration, but it is not the exact sRGB transfer function. The small raw ray tracer labels its approximation explicitly.

In Three.js r187, CSS and hexadecimal colors are interpreted through its color-management system. Color image textures such as base color and emission usually need `texture.colorSpace = THREE.SRGBColorSpace`. Numerical textures, including normal, roughness, metalness, and displacement maps, remain `THREE.NoColorSpace`. Incorrectly decoding a roughness map changes material behavior.

## A numerical demonstration of linear-light mixing

Let us compare a midpoint between black and white under two procedures. The first averages encoded values: `(0 + 1)/2 = 0.5`. Decode that 0.5 with the sRGB function and it represents about 0.214 linear light. The second averages linear-light endpoints: `(0 + 1)/2 = 0.5` linear, then encodes that result. Encoding 0.5 linear produces approximately 0.735 sRGB.

The two visible midpoints differ because the nonlinear encoding does not preserve arithmetic averages. The word midpoint is incomplete until we say which quantity is halfway. A UI color picker may intentionally interpolate a perceptual or artistic space. Lighting integration normally needs a light-proportional space. Different goals require different operations, not one universally correct-looking gradient.

Here is the inverse transfer function and a complete comparison:

```js
function encodeSRGB(linear) {
  return linear <= 0.0031308
    ? 12.92 * linear
    : 1.055 * linear ** (1 / 2.4) - 0.055;
}
console.log('Encoded arithmetic midpoint:', 0.5);
console.log('Half-light midpoint encoded for display:', encodeSRGB(0.5));
// Approximately 0.73536 for the second value.
```

This function handles nonnegative values in the basic intended range. A production color pipeline needs a defined policy for larger HDR values, negative intermediate values, gamut limits, and output display characteristics. We introduce tone mapping to manage part of that problem; clipping everything immediately to one would destroy useful bright-light information.

## Quantization is another sampling decision

An 8-bit channel has a finite set of representable levels. Converting a normalized value to a byte usually involves scaling by 255 and rounding according to the intended operation. A value of 0.5 sits between integer codes 127 and 128; either representation is an approximation. A smooth dark gradient can show visible bands when the available encoded levels are too coarse for the displayed transition.

Dithering adds controlled variation so a region's average can suggest an intermediate value, trading structured banding for fine noise. It does not increase the actual number of stored channel levels. A higher-precision intermediate render target can preserve light calculations before final encoding and quantization, while the final display path still has its own limits.

This is distinct from spatial resolution. Doubling image width adds samples across space, but does not automatically add brightness levels within each sample. A renderer can therefore have both spatial aliasing and color banding, caused by different finite representations. Choose a remedy that addresses the quantity being undersampled.

A byte value also does not identify a complete color space. The channel primaries, white point, transfer function, and intended interpretation matter. Our examples use the familiar sRGB/Linear-sRGB workflow to keep the scope concrete. If you later work with wide-gamut or HDR displays, retain this habit of naming the representation rather than treating RGB as one universal unqualified convention.

## HDR, exposure, and tone mapping

Lighting can produce values greater than 1. A bright source does not stop emitting because an 8-bit display saturates. **High dynamic range**, HDR, preserves those larger values. Exposure scales the light reaching the display transform. Tone mapping compresses a large light range into a displayable range. This is different from sRGB encoding; both can be needed, in that order.

The studio lab uses an HDR-capable rendering path with ACES filmic tone mapping. Increasing exposure brightens the whole image; increasing one light changes the illumination relationship. They can look similar in one region but have different causes.

## Follow a material color through the studio

The material studio creates a standard material from a hexadecimal color. Three.js interprets that input through its color-management system. The renderer evaluates material and light relationships in its working representation, incorporates environment illumination, then applies its configured tone mapping and output conversion. You do not manually decode the hexadecimal number again inside every frame update.

A roughness texture takes a different route because its channels describe a material parameter rather than encoded photographic light. Treating roughness 0.5 as sRGB and decoding it to about 0.214 would make the material much smoother than intended. A normal map similarly encodes vector components, not display brightness. Color-space metadata must follow the meaning of the data rather than the fact that it happens to live in an image file.

The studio's exposure slider scales the scene's display mapping, while its key-light slider changes one source of illumination. If a highlight clips after an exposure increase, the geometry has not changed. If a shadow-side contrast changes after a key-light change, the relative illumination has changed. Holding the camera and material fixed makes these differences easier to observe.

## Diagnose color errors in a controlled order

Begin with an unlit known color and a plain background. If that disagrees with an HTML reference swatch, investigate input interpretation and output conversion before adding lighting. Next use a grayscale texture with known values and verify its metadata. Then add one light and inspect whether shading appears plausible in a linear working space.

For transparency, test a fully opaque source, a fully transparent source, and a half-alpha source over a known opaque background. If the endpoints fail, the blend setup is wrong before any subtle discussion of appearance. If only edges have fringes, inspect filtering and alpha representation. If an entire scene looks washed out, inspect duplicated output conversion or a mistaken tone-mapping stage.

These small experiments separate artistic choices from data-contract errors. Once the contracts are correct, you can choose exposure, saturation, and contrast intentionally. Until then, tuning by eye can make one image appear acceptable while leaving every other lighting condition inconsistent.

A useful final check is to write the representation beside every stage in a small diagram: encoded input, decoded linear values, material/light arithmetic, tone-mapped display values, and encoded output. If an arrow has no defined conversion, investigate it. The diagram is a data-flow contract, and it remains useful when the renderer automates most operations.

**Optional application:** use the studio’s exposure control and compare the appearance of a rough versus glossy object. Later, build a grayscale ramp with a correct linear-to-sRGB conversion. Display a second ramp without conversion to make the distinction visible.
