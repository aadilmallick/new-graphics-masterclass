# Time, animation, and quaternions

Animation is state changing over time. A good model separates how time is measured, how state evolves, and how the image is rendered. Otherwise the same program can behave differently on a 60 Hz laptop, a 144 Hz monitor, and a tab returning from the background.

**Experiment:** [Scene graph](#/lab/scene-graph), then [compute particles](#/lab/webgpu-particles). **Reading bridge:** Eck §§2.7.5, 4.4 and B.3; [animation](https://webglfundamentals.org/webgl/lessons/webgl-animation.html).

## Absolute time versus integration

For a periodic decorative motion, compute state directly from elapsed time: `y = base + amplitude * sin(frequency * time)`. This is reproducible and avoids accumulated drift. For a velocity-driven object, integrate: `position += velocity * dt`. Here `dt` is elapsed seconds, not a fixed amount per frame.

After a long pause, a large `dt` can launch a simulation through walls or destabilize it. Cap elapsed time for a decorative animation. For physics-like simulation, use a fixed step accumulator: add elapsed time to an accumulator, update in small steps while enough time remains, and render between states if needed. Limit catch-up work so one slow frame does not trigger an endless spiral of updates.

Semi-implicit Euler updates velocity first, then position using the new velocity. It is often more stable than explicit Euler for simple dynamics, but it is still an approximation. Choose time step and numerical method based on the system rather than treating `dt` multiplication as a guarantee of physical accuracy.

## Smooth following

Repeated `lerp(current, target, 0.1)` depends on frame count. For approximately frame-independent exponential smoothing, use

$$
\alpha=1-e^{-k\Delta t},\qquad current\leftarrow\operatorname{lerp}(current,target,\alpha).
$$

`k` controls how quickly the error decays. This comes from multiplying the remaining error by $e^{-k\Delta t}$. It approaches the target asymptotically and is useful for camera follow, not a finite-duration arrival unless you define a stopping threshold. For an animation lasting exactly one second, interpolate from a fixed start using normalized elapsed time and a chosen easing function.

## Why Euler angles can be awkward

Euler angles describe a sequence of rotations around axes. Their order matters. At certain orientations, two rotation axes align, reducing independent control; this is gimbal lock. Interpolating each angle also does not generally follow a natural shortest orientation path.

A quaternion is a four-number representation of rotation, written $(x,y,z,w)$ in Three.js. For a unit axis $\hat a$ and angle $\theta$:

$$
q=(\hat a_x\sin(\theta/2),\hat a_y\sin(\theta/2),\hat a_z\sin(\theta/2),\cos(\theta/2)).
$$

It encodes a rotation rather than an ordinary 4D position. Unit length matters. `q` and `-q` represent the same physical orientation. Quaternion multiplication composes rotations and is order-dependent. You can use the library’s methods without memorizing the full multiplication expansion, while still understanding what they represent.

## Interpolating orientations

**SLERP**, spherical linear interpolation, moves between unit quaternion orientations along a spherical path at uniform angular speed with respect to the interpolation parameter, after choosing the appropriate representative path. Three.js provides quaternion interpolation methods. Do not independently lerp quaternion components and forget normalization; that can produce a non-rotation representation.

This fragment starts from a known orientation and interpolates toward a 90° Y rotation:

```js
const start = mesh.quaternion.clone();
const end = new THREE.Quaternion().setFromAxisAngle(
  new THREE.Vector3(0, 1, 0), Math.PI / 2
);
// In a timed update, with t clamped to [0, 1]:
mesh.quaternion.slerpQuaternions(start, end, t);
```

For a finite transition, keep `start` fixed throughout. Replacing it with the current orientation each frame changes the curve into a following system. This distinction mirrors position interpolation.

## Imported animation

`AnimationMixer` evaluates clips over a target hierarchy. A typical setup creates `new THREE.AnimationMixer(gltf.scene)`, calls `mixer.clipAction(clip).play()`, and updates with `mixer.update(dt)`. Cross-fades combine actions over time. Skeleton animation changes joint transforms; skinning deforms vertices from them. Morph animation changes target weights. Avoid overwriting transforms manually on the same nodes unless you intend to combine or replace animation.

**Optional application:** add a pause control and a time-scale slider to the orbit lab. Keep simulation time separate from wall-clock time so pause truly freezes state, and respect reduced-motion settings for automatic decorative movement.
