# The small language of graphics mathematics

Graphics equations are compact programs. A variable is a named quantity; an equation states a relationship; a function maps input to output. This chapter translates the notation you will meet into JavaScript and introduces interpolation, the bridge between discrete data and smooth appearance.

## Read an equation as a small program

Start with a familiar assignment: `newX = scale * x + translation`. It has inputs, arithmetic, and an output. Mathematical notation removes some punctuation and writes the same relationship as $x'=sx+t$. The absence of a multiplication symbol between `s` and `x` is a notational convention. It does not mean that `sx` is one variable. The prime attached to X distinguishes the transformed value from the original.

Suppose `x` is 3, `s` is 2, and `t` is -4. Multiply first: two times three is six. Add the translation: six plus negative four is two. The result is `newX = 2`. A negative translation is movement opposite the positive axis. A negative scale reverses direction as well as changing magnitude. These meanings arise from the expression; they are not special cases added by a graphics library.

An equation can also be a constraint rather than an assignment. The statement $x^2+y^2=r^2$ describes all points on a circle of radius `r` around the origin. It does not instruct us to change X or Y in a particular order. To use that relationship in a program, decide the question: test whether a point lies on the boundary, test whether it lies inside, or generate positions that satisfy it. The same mathematical relationship supports several algorithms.

This distinction prevents a common confusion when reading mathematical derivations. A line replacing one expression with an equal expression is not necessarily a new mutation of program state. It is often a different way to describe the same value. You can implement whichever equal form is clearer or more numerically appropriate for the situation.

## Variables, units, and expressions

In $x'=sx+t$, the prime means “new x,” not a derivative here. `s` scales and `t` translates. It is exactly `newX = scale * x + translation`. If `x` is measured in meters, `translation` must also be meters. Scale is a ratio and has no length unit. When animating, speed has units per second and time has seconds, so `position += speed * dt` has units of position.

Parentheses establish evaluation order. A superscript such as $x^2$ means `x * x`, while $x^{-1}$ means `1 / x` for nonzero `x`. A subscript such as $p_x$ names the x component of `p`; it is not multiplication. Greek $\theta$ (theta) is conventionally an angle; $\alpha$ often names opacity or an interpolation parameter. The letters themselves carry no hidden behavior.

The symbol $\sum$ means repeated addition. For example, $\sum_{i=0}^{2}a_i b_i=a_0b_0+a_1b_1+a_2b_2$. That becomes a three-step loop. Vertical bars around a scalar, $|x|$, mean absolute value, the nonnegative distance from zero. For a vector, we use $\|v\|$ for length and will derive it next.

## Fractions, signs, and the meaning of division

A fraction such as $x/W$ asks how many widths fit into X, or equivalently what fraction of the width X represents. If X is 200 pixels and W is 800 pixels, the units cancel and the result is 0.25. This cancellation is why normalized coordinates are dimensionless ratios. If the numerator is meters and the denominator pixels, the result has a different meaning and cannot be casually substituted.

The expression $(x-a)/(b-a)$ compares a distance from the start with the full interval length. For an interval from 10 to 30, a value of 15 is five units after the start and the whole interval is twenty units long. Five divided by twenty is one quarter. For a value of 5, the numerator is -5, so the normalized fraction is -0.25: the point lies one quarter interval before the start.

If the interval endpoints are equal, the denominator is zero. There is no unique fraction describing progress through a zero-length interval. A program must define a policy, such as throwing an error, choosing an endpoint, or returning a special state. Avoid replacing every denominator with an arbitrary tiny constant: that can conceal a conceptual problem and produce enormous values rather than a meaningful answer.

Parentheses are particularly important around fractions. `x - a / b - a` is not equivalent to `(x - a) / (b - a)`. JavaScript applies its operator precedence rules, while a written fraction bar visually groups the entire numerator and denominator. When translating notation into code, write the grouping explicitly before attempting algebraic simplification.

## Functions and graphs

A function such as $f(x)=2x+1$ returns one output per input. Sampling it at `x = 0, 1, 2` gives `1, 3, 5`. A graph plots the pairs `(x, f(x))`. Graphics uses functions of more inputs too: a texture can be regarded as $C(u,v)$, a color for each two-dimensional coordinate, and an animated field as $C(u,v,t)$.

The **domain** is the allowed input set; the **range** is the output set. A square-root function on real numbers needs nonnegative inputs. A normalized interpolation parameter normally lies from 0 to 1. Defining these boundaries prevents `NaN`, overflow, and extrapolation surprises.

## Functions of several variables

A height function might take X and return Y, as `height(x)`. A surface height can depend on two coordinates, as `height(x,z)`. An animated height depends on time too, as `height(x,z,time)`. The number of inputs tells you how much information the rule requires, not how expensive it is by itself.

A function may return a scalar, a vector, a color, or a structured result. For example, a color field can return three channels for every UV coordinate, while a distance field returns one signed number for every 3D position. The same output type can serve different meanings: three numbers might be a position or a color, but adding them has different interpretations.

When a formula looks crowded, name intermediate functions. Instead of reading a large wave expression as one indivisible object, separate phase, height, slope, and color. This helps both mathematical understanding and debugging. If color is wrong, first display height or slope as a grayscale signal and verify the preceding stage independently.

## Derive interpolation from motion along a difference

Let the start coordinate be A = 2 and the end coordinate B = 10. The required total displacement is `B - A = 8`. At half the transition, take half of that displacement, giving four, then add it to the start, giving six. At one quarter, take two units of displacement and add them to two, giving four. The construction is `A + t * (B - A)`.

Expand the multiplication: `A + t*B - t*A`. Group the A terms: `(1-t)*A + t*B`. This second form describes a weighted average. At `t=0.25`, the A weight is 0.75 and B weight 0.25. Their sum is one, so a constant input remains constant: if A and B were both five, the result would be `0.75*5 + 0.25*5 = 5`.

That constant-preservation property is an important diagnostic. A blur kernel whose weights do not sum to one can unexpectedly brighten or darken a uniform image. A position blend with incorrect weights can drift or scale even when both inputs coincide. The same arithmetic pattern appears in several domains, but its data meaning must be stated each time.

A complete console experiment makes the endpoints and intermediate values explicit:

```js
function interpolate(start, end, fraction) {
  const displacement = end - start;
  const partialDisplacement = fraction * displacement;
  return start + partialDisplacement;
}
for (const fraction of [0, 0.25, 0.5, 0.75, 1, 1.25]) {
  console.log(fraction, interpolate(2, 10, fraction));
}
// Results: 2, 4, 6, 8, 10, 12.
```

The final result extends beyond the endpoint because fraction 1.25 means 125 percent of the displacement. Interpolation and extrapolation use the same expression. Whether to clamp is an application decision. A camera transition may stop at its target, while a line construction might intentionally evaluate positions beyond an endpoint.

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

## Compose small functions into a useful mapping

Suppose a slider produces values from 0 to 100, while a material parameter should range from 0.2 to 0.8. First normalize the slider by dividing by 100. Then interpolate between the parameter endpoints. At slider value 25, fraction is 0.25, and the result is `0.2 + 0.25*(0.8-0.2) = 0.35`.

The construction naturally splits into functions. One function knows how to normalize an interval, another interpolates, and a composition performs the entire mapping. This is ordinary functional decomposition applied to numerical geometry. It becomes especially useful when controls, stored scene data, and shader units do not share the same range.

```js
function normalizeInterval(value, start, end) {
  if (start === end) throw new RangeError('Zero-length interval');
  return (value - start) / (end - start);
}
function mapInterval(value, inStart, inEnd, outStart, outEnd) {
  const fraction = normalizeInterval(value, inStart, inEnd);
  return outStart + fraction * (outEnd - outStart);
}
console.log(mapInterval(25, 0, 100, 0.2, 0.8)); // 0.35
console.log(mapInterval(600, 0, 800, -1, 1));  // 0.5
```

The second result is exactly the horizontal coordinate conversion from the pixel chapter. We have not learned an unrelated second formula. We have recognized a general pattern behind a specific screen operation. This is one of the most useful habits in graphics mathematics: identify the reusable operation, then attach the correct units and conventions to its current use.

## Remapping and easing

To convert a value $x$ from an interval $[a,b]$ into a normalized fraction, compute $t=(x-a)/(b-a)$, provided $a\ne b$. To map onward into $[c,d]$, compute $c+t(d-c)$. This is how a slider becomes a material parameter or a mouse position becomes a rotation.

Linear progress has an abrupt start and stop. An **easing function** changes the fraction before interpolation. The polynomial $e(t)=t^2(3-2t)$, commonly called smoothstep on a normalized interval, has zero slope at both endpoints. It makes a camera transition start and end gently. It is not a physical acceleration model. Also, interpolating between 350° and 10° directly goes the long way around; periodic quantities need extra care.

## Graph shape and local change

A straight-line function $f(x)=mx+b$ changes by a constant amount for each equal step in X. The coefficient `m` is its slope. For `f(x)=2*x+1`, increasing X from one to two increases output from three to five: a change of two for an input change of one. A negative slope decreases output as X grows. Zero slope gives a constant function.

A curved function changes its rate. For `f(x)=x*x`, steps from zero to one, one to two, and two to three produce output changes of one, three, and five. We will later formalize local rate of change as a derivative. For now, looking at successive differences already explains why a squared easing function speeds up rather than moving at a constant rate.

Smoothstep combines polynomial terms so its transition starts and ends gently. For normalized `t`, `t*t*(3-2*t)` gives zero at zero and one at one. At `t=0.25`, it gives `0.0625*2.5 = 0.15625`, less than linear progress 0.25. At `t=0.75`, it gives `0.5625*1.5 = 0.84375`, greater than linear progress. Early motion lags and later motion catches up, creating a gentle start and stop.

This is a timing design, not an automatic physics model. A falling object, a spring, and a camera following a target have different governing rules. Use easing when you are defining an authored transition. Use an appropriate update equation when simulating a system whose next state depends on its current state and forces.

## Time is an input with units

Browser animation timestamps are commonly milliseconds. Convert to seconds before applying a speed expressed in units per second. If an object moves at three world units per second and elapsed time is 0.02 seconds, displacement is `3*0.02 = 0.06` world units. If you accidentally use 20 milliseconds as though it were seconds, the displacement becomes sixty units, a thousand-fold error.

A fixed addition such as `position += 0.1` per frame expresses speed in units per frame. At sixty frames per second it moves six units per second; at 120 it moves twelve. A time-based expression removes that accidental display dependence. Numerical simulation still has time-step accuracy issues, which later chapters address, but units are the first necessary correction.

For a finite transition, derive fraction from elapsed time divided by duration. A two-second movement at elapsed 0.5 seconds has fraction 0.25. Clamp fraction after the duration if the motion should stop. Keep the original start fixed throughout the transition; repeatedly using the current position as a new start creates a different following behavior.

## Precision and tolerances

Numbers such as one-third cannot be represented exactly by a finite binary floating-point format. A result can be `0.99999994` instead of `1`. Compare approximate calculations with a tolerance chosen for their units and scale, rather than demanding exact equality. GPUs commonly use 32-bit floating point, while JavaScript `Number` arithmetic is normally 64-bit floating point. Converting into `Float32Array` rounds values.

## Numerical precision is part of the model

JavaScript's ordinary numbers approximate real arithmetic with finite binary floating point. Some familiar decimal fractions cannot be represented exactly, so `0.1 + 0.2` does not compare exactly equal to `0.3`. GPU arithmetic frequently has less precision than JavaScript's ordinary calculations, and writing values into `Float32Array` rounds them to the chosen representation.

A tolerance comparison expresses that you care about closeness within a meaningful scale. For a scene measured in meters, an error of one millionth of a meter may be irrelevant, while the same numerical tolerance can be unsuitable for a microscopic model or a coordinate near a billion meters. Choose tolerances in relation to units and magnitude; a single unexplained epsilon copied everywhere is rarely a complete numerical policy.

Arithmetic can also amplify error. Subtracting nearly equal large values can lose small differences. Dividing by a tiny denominator can magnify perturbations. Normalizing a nearly zero vector can turn noise into an arbitrary direction. Later algorithms include guards for these situations because a visible artifact may be caused by an ill-defined input, not simply by too few decimal digits.

The goal is not to fear equations. It is to read them with the same care you bring to a function's input contract. Identify units, domains, exceptional cases, expected endpoints, and output meaning. Once these are explicit, a formula becomes a small testable program rather than a symbol sequence you must trust without understanding.

**Optional application:** print a table that maps pixels `0, 200, 400, 600, 800` to NDC. Derive the formula as two operations: normalize to `[0,1]`, then remap to `[-1,1]`. This is the previous chapter’s conversion in a reusable form.
