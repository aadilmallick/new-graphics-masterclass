# Angles, circles, and oscillation

Rotations and waves share one mathematical source: the circle. Sine and cosine let us turn a single angle into a direction. You do not need to memorize a large table of identities; you need to understand the unit circle, radians, and a few practical relationships.

**Experiments:** rotate `b` in the [vector lab](#/lab/vectors), then inspect [shader waves](#/lab/ocean). The second lab becomes fully understandable after shaders.

## Radians are arc length divided by radius

A full circle has circumference $2\pi r$. The angle in radians is arc length divided by radius, so a full turn is $2\pi$ radians. Half a turn is $\pi$, and a quarter turn is $\pi/2$. Convert degrees with $\theta_{rad}=\theta_{deg}\pi/180$.

`Math.sin`, `Math.cos`, and Three.js rotation components use radians. Three.js `PerspectiveCamera` takes its field-of-view argument in degrees. That API difference is worth naming every time values cross the boundary.

## The unit circle

Place a point one unit from the origin. At angle $\theta$, measured counterclockwise from +X in a Y-up plane, its position is

$$
(x,y)=(\cos\theta,\sin\theta).
$$

Cosine is the horizontal component, sine the vertical component. At 0 they are `(1,0)`; at $\pi/2$, `(0,1)`; at $\pi$, `(-1,0)`. Because the point stays one unit from the origin, $\cos^2\theta+\sin^2\theta=1$.

For radius `r` and center `(cx, cy)`, use `(cx + r*cos(theta), cy + r*sin(theta))`. In a Y-down Canvas coordinate system the visible rotation appears clockwise unless you flip Y. The mathematics did not change; the screen convention did.

To recover an angle from a displacement, use `Math.atan2(dy, dx)`. It handles quadrants and vertical directions; `Math.atan(dy / dx)` does not. For a zero displacement, the numerical return value is not a meaningful direction even if the function returns a number.

## Deriving a planar rotation

Rotating the X basis vector gives $(\cos\theta,\sin\theta)$. Rotating the Y basis gives $(-\sin\theta,\cos\theta)$. Any vector is `x` copies of the first basis plus `y` copies of the second. Therefore

$$
x'=x\cos\theta-y\sin\theta,\qquad
y'=x\sin\theta+y\cos\theta.
$$

At 90°, `(2,1)` becomes `(-1,2)`. Try the numerical calculation with `Math.PI/2`; tiny nonzero cosine residues are floating-point approximation. This basis explanation will become the columns of a rotation matrix in the next chapter.

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

## Oscillation over space

Replacing time with position creates a wave across a surface. `sin(k*x - omega*t)` travels in +X for positive `k` and `omega`. Here $k=2\pi/\lambda$ is angular spatial frequency, $\lambda$ is wavelength, and $\omega=2\pi f$. Holding phase constant gives speed $\omega/k$.

Sine motion is a useful artistic model, not a universal physics solver. A pendulum at large angles does not follow a perfect sine wave, and a sum of waves is not a complete water simulation. Start with the simple model when its appearance is appropriate, then refine based on the effect you need.

**Optional application:** animate two points on concentric circles with different frequencies and phases. Use `requestAnimationFrame` timestamps in seconds and keep the positions derived from time rather than accumulated per-frame rotations.
