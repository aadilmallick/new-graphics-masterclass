# The small language of graphics mathematics

Graphics equations are compact programs. A variable is a named quantity; an equation states a relationship; a function maps input to output. This chapter translates the notation you will meet into JavaScript and introduces interpolation, the bridge between discrete data and smooth appearance.

## Variables, units, and expressions

In $x'=sx+t$, the prime means “new x,” not a derivative here. `s` scales and `t` translates. It is exactly `newX = scale * x + translation`. If `x` is measured in meters, `translation` must also be meters. Scale is a ratio and has no length unit. When animating, speed has units per second and time has seconds, so `position += speed * dt` has units of position.

Parentheses establish evaluation order. A superscript such as $x^2$ means `x * x`, while $x^{-1}$ means `1 / x` for nonzero `x`. A subscript such as $p_x$ names the x component of `p`; it is not multiplication. Greek $\theta$ (theta) is conventionally an angle; $\alpha$ often names opacity or an interpolation parameter. The letters themselves carry no hidden behavior.

The symbol $\sum$ means repeated addition. For example, $\sum_{i=0}^{2}a_i b_i=a_0b_0+a_1b_1+a_2b_2$. That becomes a three-step loop. Vertical bars around a scalar, $|x|$, mean absolute value, the nonnegative distance from zero. For a vector, we use $\|v\|$ for length and will derive it next.

## Functions and graphs

A function such as $f(x)=2x+1$ returns one output per input. Sampling it at `x = 0, 1, 2` gives `1, 3, 5`. A graph plots the pairs `(x, f(x))`. Graphics uses functions of more inputs too: a texture can be regarded as $C(u,v)$, a color for each two-dimensional coordinate, and an animated field as $C(u,v,t)$.

The **domain** is the allowed input set; the **range** is the output set. A square-root function on real numbers needs nonnegative inputs. A normalized interpolation parameter normally lies from 0 to 1. Defining these boundaries prevents `NaN`, overflow, and extrapolation surprises.

## Linear interpolation, step by step

Suppose the camera should move from coordinate 2 to coordinate 10 over one second. At a fraction $t$ of the transition, move the same fraction of the total difference:

$$
\operatorname{lerp}(a,b,t)=a+t(b-a)=(1-t)a+tb.
$$

At `t = 0`, the result is `a`. At `t = 1`, it is `b`. At `t = 0.25`, with `a = 2` and `b = 10`, the result is `4`. The coefficients `1-t` and `t` add to one: they are weights. Interpolation works component by component for positions and linear-light colors.

The following complete console example uses the actual math module in this project:

```js
import { lerp } from './labs/math.js';
for (const t of [0, 0.25, 0.5, 0.75, 1]) {
  console.log(t, lerp(2, 10, t));
}
// Outputs: 0 2; 0.25 4; 0.5 6; 0.75 8; 1 10.
```

Run it from a served module or adapt the function in a browser console. JavaScript does not provide `Math.lerp`; our helper is a normal exported function. Values outside `[0,1]` produce **extrapolation**, continuing beyond an endpoint. Use `clamp(t, 0, 1)` when a transition must stop.

## Remapping and easing

To convert a value $x$ from an interval $[a,b]$ into a normalized fraction, compute $t=(x-a)/(b-a)$, provided $a\ne b$. To map onward into $[c,d]$, compute $c+t(d-c)$. This is how a slider becomes a material parameter or a mouse position becomes a rotation.

Linear progress has an abrupt start and stop. An **easing function** changes the fraction before interpolation. The polynomial $e(t)=t^2(3-2t)$, commonly called smoothstep on a normalized interval, has zero slope at both endpoints. It makes a camera transition start and end gently. It is not a physical acceleration model. Also, interpolating between 350° and 10° directly goes the long way around; periodic quantities need extra care.

## Precision and tolerances

Numbers such as one-third cannot be represented exactly by a finite binary floating-point format. A result can be `0.99999994` instead of `1`. Compare approximate calculations with a tolerance chosen for their units and scale, rather than demanding exact equality. GPUs commonly use 32-bit floating point, while JavaScript `Number` arithmetic is normally 64-bit floating point. Converting into `Float32Array` rounds values.

**Optional application:** print a table that maps pixels `0, 200, 400, 600, 800` to NDC. Derive the formula as two operations: normalize to `[0,1]`, then remap to `[-1,1]`. This is the previous chapter’s conversion in a reusable form.
