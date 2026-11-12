# Angles, circles, and oscillation

Rotations and waves share one mathematical source: the circle. Sine and cosine let us turn a single angle into a direction. You do not need to memorize a large table of identities; you need to understand the unit circle, radians, and a few practical relationships.

**Experiments:** rotate `b` in the [vector lab](#/lab/vectors), then inspect [shader waves](#/lab/ocean). The second lab becomes fully understandable after shaders.

## Measure a turn before choosing a unit

An angle describes a difference in direction. Two arrows can have different lengths yet the same angle between them, because changing length does not change direction. To measure the turn, imagine one arrow rotating around its tail until it aligns with the other. The amount and orientation of that turn are the geometric quantities we want to describe.

Degrees divide a full turn into 360 parts. Radians instead connect the turn to the circle it sweeps. On a circle of radius two, a full circumference is approximately 12.566 units. Dividing the arc length by radius gives approximately 6.283, the same value as a full turn on any other radius. The ratio removes the circle's scale, leaving an angle.

This scale independence explains why radians are convenient in formulas. If a wheel of radius `r` rotates through angle `theta` radians, a point on its rim travels arc length `r*theta`. A radius of 0.4 meters and a turn of 0.5 radians give 0.2 meters of rim travel. The formula needs no extra conversion factor because radians were defined from this relationship.

For degrees, convert first: ninety degrees times pi divided by 180 equals pi over two radians. In code, `90 * Math.PI / 180` is approximately 1.5708. Sending the literal value 90 into `Math.sin` therefore asks for ninety radians, not a quarter turn. Both are legitimate numeric inputs, but they represent very different directions.

## Radians are arc length divided by radius

A full circle has circumference $2\pi r$. The angle in radians is arc length divided by radius, so a full turn is $2\pi$ radians. Half a turn is $\pi$, and a quarter turn is $\pi/2$. Convert degrees with $\theta_{rad}=\theta_{deg}\pi/180$.

`Math.sin`, `Math.cos`, and Three.js rotation components use radians. Three.js `PerspectiveCamera` takes its field-of-view argument in degrees. That API difference is worth naming every time values cross the boundary.

## Find sine and cosine on the circle

Draw a radius-one circle centered at the origin in a Y-up plane. At angle zero the radius points right, so its endpoint is `(1,0)`. Rotate counterclockwise by a quarter turn and its endpoint is `(0,1)`. The endpoint's horizontal coordinate is cosine; its vertical coordinate is sine. These names describe coordinate-producing functions of angle.

At an angle between zero and a quarter turn, both coordinates are positive. The horizontal coordinate decreases as the radius tilts upward, while the vertical coordinate increases. At a half turn the endpoint is `(-1,0)`. In the next quarter both coordinates become negative, and the final quarter returns to positive X with negative Y. The signs are consequences of quadrant location, not values to memorize separately from geometry.

A right triangle formed by the endpoint, its horizontal projection, and the origin has hypotenuse one. Its leg lengths are the absolute horizontal and vertical coordinates. Pythagoras therefore gives cosine squared plus sine squared equal to one. For an arbitrary radius `r`, multiply both coordinates by `r`; their squared sum becomes `r*r`.

At 45 degrees, symmetry makes the two coordinates equal. If each is `u`, then `u*u + u*u = 1`, so `2*u*u = 1`, and positive `u` is `sqrt(1/2)`, approximately 0.7071. We have derived a familiar sine/cosine value from the circle rather than importing a table without explanation.

## The unit circle

Place a point one unit from the origin. At angle $\theta$, measured counterclockwise from +X in a Y-up plane, its position is

$$
(x,y)=(\cos\theta,\sin\theta).
$$

Cosine is the horizontal component, sine the vertical component. At 0 they are `(1,0)`; at $\pi/2$, `(0,1)`; at $\pi$, `(-1,0)`. Because the point stays one unit from the origin, $\cos^2\theta+\sin^2\theta=1$.

For radius `r` and center `(cx, cy)`, use `(cx + r*cos(theta), cy + r*sin(theta))`. In a Y-down Canvas coordinate system the visible rotation appears clockwise unless you flip Y. The mathematics did not change; the screen convention did.

To recover an angle from a displacement, use `Math.atan2(dy, dx)`. It handles quadrants and vertical directions; `Math.atan(dy / dx)` does not. For a zero displacement, the numerical return value is not a meaningful direction even if the function returns a number.

## Recover a direction from components

Suppose a displacement is `(3,4)`. We know its length is five, so its normalized coordinates are `(0.6,0.8)`. The angle must have cosine 0.6 and sine 0.8. `Math.atan2(4,3)` recovers the angle with both component signs available, returning approximately 0.9273 radians or 53.13 degrees.

Why use two arguments? A simple ratio `dy/dx` is unchanged if both components change sign. `(3,4)` and `(-3,-4)` both have ratio four-thirds, yet point in opposite directions. Dividing also fails at a vertical direction where X is zero. `atan2` receives the original pair and can choose the correct quadrant without that ambiguity.

A zero vector has no geometric direction. Although an implementation returns a numerical value for `atan2(0,0)`, do not interpret it as a meaningful orientation. If your character has stopped, retaining its previous facing direction may be a better application policy than making it face a default axis.

This complete console example demonstrates conversion in both directions:

```js
const displacement = [3, 4];
const angle = Math.atan2(displacement[1], displacement[0]);
const length = Math.hypot(...displacement);
const reconstructed = [length * Math.cos(angle), length * Math.sin(angle)];
console.log(angle, angle * 180 / Math.PI);
console.log(reconstructed); // approximately [3, 4]
```

The reconstruction is approximate because floating-point trigonometric evaluation is finite. The geometric relationship is what matters. Compare with a tolerance rather than requiring the reconstructed components to have exactly identical binary representations.

## Rotate a basis, then rotate any vector

Any 2D vector `(x,y)` can be built from `x` copies of the horizontal unit direction plus `y` copies of the vertical unit direction. Rotating the horizontal basis through angle theta produces `(cos(theta),sin(theta))`. Rotating the vertical basis gives a direction a quarter turn farther around: `(-sin(theta),cos(theta))`.

Now multiply the first rotated basis by X and the second by Y, then add components. Horizontal output is `x*cos(theta) - y*sin(theta)`. Vertical output is `x*sin(theta) + y*cos(theta)`. This derivation explains all four coefficients of a rotation matrix before we introduce the matrix notation itself.

For point `(2,1)` rotated 30 degrees, cosine is approximately 0.8660 and sine 0.5. The new X is `2*0.8660 - 1*0.5 = 1.2320`. The new Y is `2*0.5 + 1*0.8660 = 1.8660`. The original squared length is five. The new squared length is also approximately five, allowing for rounding. Rotation changes direction while preserving Euclidean length.

A rotation around another pivot first subtracts that pivot from the point, rotates the displacement, and adds the pivot back. For pivot `(3,0)` and point `(4,0)`, the local displacement is `(1,0)`. A 90-degree rotation gives `(0,1)`, and adding the pivot gives `(3,1)`. Rotating the original point directly would instead give `(0,4)`, a turn around the wrong origin.

## Deriving a planar rotation

Rotating the X basis vector gives $(\cos\theta,\sin\theta)$. Rotating the Y basis gives $(-\sin\theta,\cos\theta)$. Any vector is `x` copies of the first basis plus `y` copies of the second. Therefore

$$
x'=x\cos\theta-y\sin\theta,\qquad
y'=x\sin\theta+y\cos\theta.
$$

At 90°, `(2,1)` becomes `(-1,2)`. Try the numerical calculation with `Math.PI/2`; tiny nonzero cosine residues are floating-point approximation. This basis explanation will become the columns of a rotation matrix in the next chapter.

## Distinguish angular speed from linear speed

If an angle changes at two radians per second, after 0.1 seconds it advances 0.2 radians. A point at radius one travels 0.2 units along the arc; a point at radius three travels 0.6 units. The angular speed is the same, while linear rim speed depends on radius.

This distinction helps explain a rotating rigid object. Every point shares one angular velocity around the rotation axis, but points farther from the axis move farther each second. A particle orbit whose intended linear speed is constant needs its angular speed adjusted by radius. Otherwise moving the orbit outward changes the particle's actual travel speed.

For a circular path, speed along the circumference is radius times angular speed. If you want a point at radius two to move at three units per second, use angular speed 1.5 radians per second. The period is circumference divided by linear speed, equivalently full-turn angle divided by angular speed. Both routes give the same result when units are consistent.

## Read a wave as a moving circle coordinate

Sine of an increasing angle repeats because points around a circle return to the same height after each full turn. If we use time to advance that angle, sine becomes a repeating height signal. One cycle per second means angle must increase by two pi radians each second. Half a cycle per second uses pi radians per second.

Amplitude scales the height variation. An amplitude of 0.2 produces outputs between -0.2 and +0.2 before adding any midpoint. Adding midpoint one shifts the entire range to 0.8 through 1.2. Phase shifts the starting location around the cycle. A phase of pi over two makes the sine start at its maximum instead of at zero.

For `height = 1 + 0.2*sin(pi*time)`, time zero gives one, time 0.5 gives 1.2, time one returns to one, and time 1.5 gives 0.8. At time two, the signal completes a full cycle. Writing down these sample times helps you choose parameters with a clear visual intention before animating anything.

This complete console example prints those values:

```js
function buoyHeight(seconds) {
  const midpoint = 1;
  const amplitude = 0.2;
  const cyclesPerSecond = 0.5;
  const phase = 2 * Math.PI * cyclesPerSecond * seconds;
  return midpoint + amplitude * Math.sin(phase);
}
for (const seconds of [0, 0.5, 1, 1.5, 2]) {
  console.log(seconds, buoyHeight(seconds).toFixed(3));
}
```

The function derives height directly from absolute elapsed time. It does not depend on how many frames happened between observations. This is especially convenient for decorative periodic motion. A force-driven simulation is different: it evolves state, and its numerical time step requires separate care.

## Time, frequency, amplitude, and phase

A sine wave is a repeating function. Write it as

$$
h(t)=A\sin(2\pi f t+\phi)+b.
$$

`A` is amplitude: the maximum distance from the midpoint. `f` is frequency in cycles per second. `phi` is phase, an angular offset. `b` is the midpoint. The period is $1/f$ for positive `f`.

For a buoy bobbing 0.2 units above and below a height of 1 at half a cycle per second, `height = 1 + 0.2 * Math.sin(Math.PI * time)`. Using elapsed seconds makes the frequency independent of frame rate. Adding a small amount per frame would make motion depend on the display.

This complete browser-console experiment prints positions around a circle:

```js
for (let i = 0; i < 8; i++) {
  const angle = i * 2 * Math.PI / 8;
  console.log(Math.cos(angle).toFixed(3), Math.sin(angle).toFixed(3));
}
```

Eight samples do not make a circle smooth by themselves; they define an octagonal approximation if connected. More samples improve geometry resolution, at a computational cost. The same sampling tradeoff returns with textures and animation.

## Turn temporal repetition into spatial repetition

A spatial wave uses position where the buoy used time. `sin(k*x)` produces repeating heights across X. The wavelength is the spatial distance required for the inner angle to advance one full turn. If `k` is two pi radians per unit, wavelength is one unit. If `k` doubles, the pattern repeats twice as often and wavelength halves.

For a traveling wave `sin(k*x - omega*time)`, a fixed crest keeps the inner phase constant. Increasing time must therefore be accompanied by increasing X when both coefficients are positive. Solving `k*x - omega*time = constant` gives X advancing at speed `omega/k`. This is a derivation of direction and speed, not a memorized sign convention.

The ocean lab combines waves with different coefficients and directions. Its time parameters are artistic angular rates rather than labeled oceanographic measurements. The mathematical operation is still clear: a phase combines position and time, sine or cosine maps phase to a bounded signal, and amplitude converts that signal into displacement units.

A high spatial frequency requires enough geometry or pixel samples to represent it. If a mesh has only two endpoints across several wavelengths, evaluating the height only at those endpoints cannot reconstruct the intended surface. If a texture-like procedural pattern changes faster than pixels can sample it, aliasing appears. Trigonometry provides the continuous signal; sampling determines what the renderer can represent.

## Oscillation over space

Replacing time with position creates a wave across a surface. `sin(k*x - omega*t)` travels in +X for positive `k` and `omega`. Here $k=2\pi/\lambda$ is angular spatial frequency, $\lambda$ is wavelength, and $\omega=2\pi f$. Holding phase constant gives speed $\omega/k$.

Sine motion is a useful artistic model, not a universal physics solver. A pendulum at large angles does not follow a perfect sine wave, and a sum of waves is not a complete water simulation. Start with the simple model when its appearance is appropriate, then refine based on the effect you need.

## Periodicity and shortest turns

Angles separated by a full turn represent the same direction. This makes interpolation around a boundary subtle. Moving numerically from 350 degrees to 10 degrees by direct linear interpolation passes through 180 degrees, taking a long 340-degree route. The shorter route increases by twenty degrees through the full-turn boundary.

One approach computes a wrapped signed angle difference in the interval from minus pi to plus pi, then interpolates that difference from the starting angle. The exact choice at an opposite 180-degree orientation needs a policy because two shortest paths are equally long. For 3D orientation, quaternion interpolation later provides a suitable representation with its own conventions.

Keep storage, display, and computation units separate. A slider can display degrees because they are familiar, while converting once before sending an angle to `Math.sin` or a shader. Name the variable `angleRadians` after conversion. Many apparent trigonometry bugs are simply unlabeled values crossing a unit boundary.

## Use a meaningful reference angle

An angle needs both a plane and a reference direction. Saying an object is rotated thirty degrees is incomplete without identifying the axis or plane and the starting orientation. The vector workbench uses +X as zero and a mathematical Y-up plane. The displayed Canvas reverses Y only during drawing. Keeping that reference explicit prevents a screen-coordinate flip from being mistaken for a change in the underlying trigonometry.

**Optional application:** animate two points on concentric circles with different frequencies and phases. Use `requestAnimationFrame` timestamps in seconds and keep the positions derived from time rather than accumulated per-frame rotations.
