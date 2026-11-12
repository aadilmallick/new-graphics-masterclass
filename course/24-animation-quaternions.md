# Time, animation, and quaternions

Animation is state changing over time. A good model separates how time is measured, how state evolves, and how the image is rendered. Otherwise the same program can behave differently on a 60 Hz laptop, a 144 Hz monitor, and a tab returning from the background.

**Experiment:** [Scene graph](#/lab/scene-graph), then [compute particles](#/lab/webgpu-particles). **Reading bridge:** Eck §§2.7.5, 4.4 and B.3; [animation](https://webglfundamentals.org/webgl/lessons/webgl-animation.html).

## Begin with a distance-per-frame mistake

Suppose you move a mesh by 0.1 world units every rendered frame. At sixty frames per second it travels six units per second. At 144 frames per second it travels 14.4. The code's apparent “speed” is actually distance per frame, so the display's frame rate changes the motion. A variable named `speed` cannot fix a unit mismatch by itself.

Express intended speed as distance per second instead. If speed is six units per second and a frame interval is one sixtieth of a second, movement is `6/60 = 0.1`. At one 144th, movement is `6/144`, approximately 0.04167. Over one second, both accumulate roughly six units. The equation `distance = speed * elapsedSeconds` follows directly from units, not a graphics-specific trick.

Timestamps from animation callbacks are normally milliseconds, so divide their difference by one thousand. The first frame has no prior timestamp; initialize the interval to zero or establish the previous value before stepping. Keep the timer's meaning clear: wall-clock elapsed time, accumulated simulation time, and normalized transition progress are related but different quantities.

## Choose direct evaluation or evolving state

A decorative orbit can be evaluated directly from time. For radius R and phase theta, use `(R*cos(theta),0,R*sin(theta))`. Let theta be angular speed times simulation time. At any timestamp, the position is determined without replaying earlier frames. This is convenient for repeatable motion, seeking, and pause/resume behavior.

A particle under changing forces instead has evolving position and velocity. Its next state depends on its previous state and applied acceleration. You cannot generally jump to an arbitrary time with one simple sine expression. Integrating the dynamics means approximating how those quantities change over short time intervals. A closed-form artistic trajectory and a numerical physical simulation are different models, even when both produce attractive motion.

The orbit lab uses an accumulated phase so the time-scale control affects future advancement. The planet's orbit parent rotates by phase; its own spin uses another multiple; the moon pivot uses another. These are illustrative rates, not astronomical measurements. Because the graph composes transforms, the moon inherits the planet-orbit frame while keeping its local offset.

## Absolute time versus integration

For a periodic decorative motion, compute state directly from elapsed time: `y = base + amplitude * sin(frequency * time)`. This is reproducible and avoids accumulated drift. For a velocity-driven object, integrate: `position += velocity * dt`. Here `dt` is elapsed seconds, not a fixed amount per frame.

After a long pause, a large `dt` can launch a simulation through walls or destabilize it. Cap elapsed time for a decorative animation. For physics-like simulation, use a fixed step accumulator: add elapsed time to an accumulator, update in small steps while enough time remains, and render between states if needed. Limit catch-up work so one slow frame does not trigger an endless spiral of updates.

Semi-implicit Euler updates velocity first, then position using the new velocity. It is often more stable than explicit Euler for simple dynamics, but it is still an approximation. Choose time step and numerical method based on the system rather than treating `dt` multiplication as a guarantee of physical accuracy.

## Build a finite-duration transition correctly

Suppose a camera must move from position two to position ten over two seconds. Store the initial position, destination, start time, and duration. At elapsed time 0.5 seconds, normalized progress is `0.5/2 = 0.25`; lerp produces `2 + 0.25*(10-2) = 4`. At two seconds, progress reaches one and the result reaches ten. Clamp after the end so it stays there.

The start value must remain fixed for the transition. If you repeatedly lerp from the current position using that same progress, the path changes. If you always use a fixed factor such as 0.1, you create an exponential follower whose behavior depends on how often you apply it. Both can be useful, but they answer different timing requirements.

Here is a complete console experiment comparing a timed midpoint with repeated following:

```js
const lerp = (a, b, t) => a + (b - a) * t;
console.log(lerp(2, 10, 0.5)); // 6: halfway through a fixed transition
let follower = 2;
for (let frame = 0; frame < 5; frame++) {
  follower = lerp(follower, 10, 0.1);
  console.log(follower);
}
// 2.8, 3.52, 4.168, 4.7512, 5.27608
```

The follower removes ten percent of the remaining error on every iteration. It does not reach the destination after a predetermined number of seconds. An exponential weight derived from dt makes its decay approximately consistent across frame schedules, but it is still a follower rather than a finite-duration transition.

## Derive the exponential following weight from remaining error

Let error be target minus current. Suppose you want the error to be multiplied by `exp(-k*dt)` over each interval. A lerp with weight alpha leaves `(1-alpha)` of the old error. Equating these expressions gives `1-alpha = exp(-k*dt)`, so alpha is `1-exp(-k*dt)`. This is the formula used by exponential following.

For k equal to four and dt equal to 0.25, the remaining fraction is `exp(-1)`, approximately 0.3679. About 63.2 percent of the current error is removed over that quarter-second. Two eighth-second updates produce the same ideal remaining fraction because exponentials multiply consistently: `exp(-0.5)*exp(-0.5)=exp(-1)`.

In finite precision and with a moving target, practical results are approximate, but the time model is clear. Choose k by the desired response rate. You can also derive it from a half-life: if error should halve every h seconds, use `k = ln(2)/h`. That is a more meaningful tuning parameter than an unexplained per-frame lerp constant.

## Smooth following

Repeated `lerp(current, target, 0.1)` depends on frame count. For approximately frame-independent exponential smoothing, use

$$
\alpha=1-e^{-k\Delta t},\qquad current\leftarrow\operatorname{lerp}(current,target,\alpha).
$$

`k` controls how quickly the error decays. This comes from multiplying the remaining error by $e^{-k\Delta t}$. It approaches the target asymptotically and is useful for camera follow, not a finite-duration arrival unless you define a stopping threshold. For an animation lasting exactly one second, interpolate from a fixed start using normalized elapsed time and a chosen easing function.

## Introduce acceleration without pretending one step is exact

Acceleration is velocity change per second. With constant acceleration a over a short step dt, explicit Euler updates position using the old velocity and then updates velocity. Semi-implicit Euler updates velocity first, then uses the new velocity for position. The latter often behaves better for simple mechanical systems, but neither becomes exact for arbitrary forces merely because the code multiplies by dt.

Take initial height zero, velocity zero, downward acceleration minus ten, and a step of 0.1 seconds. Semi-implicit Euler gives velocity minus one, then height minus 0.1. The exact constant-acceleration displacement over that interval would be minus 0.05. Smaller steps reduce the discrepancy. This example makes numerical error visible without requiring a complicated physics engine.

A large pause can create an enormous integration step. Clamping dt is acceptable for a decorative effect if slowing or skipping elapsed motion is an intentional policy. For a physical simulation, use a fixed small step accumulator and cap catch-up work. If the application has been paused for several seconds, decide whether to discard that elapsed time, resynchronize, or simulate it progressively. That is a product and numerical-model decision, not an incidental timing implementation detail.

## Understand gimbal lock as a representation issue

Euler angles specify an ordered sequence of rotations. They are intuitive for a single hinge or a constrained editor field. In three-dimensional unrestricted orientation, some configurations align axes so the angle representation loses independent local control. The object still has a valid physical orientation; the chosen coordinate description becomes awkward.

There is also a simpler interpolation problem before gimbal lock. An angle moving from 350 degrees to 10 degrees should often cross zero through a short twenty-degree turn. A direct numeric lerp takes the long path through 180. You need an angle-wrap policy. With three ordered angles, several such issues combine with the noncommutativity of rotations.

A quaternion represents orientation without relying on those three sequential angle coordinates for interpolation. It does not make rotation order irrelevant. Multiplying two quaternion rotations in the opposite order still changes the result. It gives another representation and useful operations, not an exception to the geometry established in the matrix chapter.

## Why Euler angles can be awkward

Euler angles describe a sequence of rotations around axes. Their order matters. At certain orientations, two rotation axes align, reducing independent control; this is gimbal lock. Interpolating each angle also does not generally follow a natural shortest orientation path.

A quaternion is a four-number representation of rotation, written $(x,y,z,w)$ in Three.js. For a unit axis $\hat a$ and angle $\theta$:

$$
q=(\hat a_x\sin(\theta/2),\hat a_y\sin(\theta/2),\hat a_z\sin(\theta/2),\cos(\theta/2)).
$$

It encodes a rotation rather than an ordinary 4D position. Unit length matters. `q` and `-q` represent the same physical orientation. Quaternion multiplication composes rotations and is order-dependent. You can use the library’s methods without memorizing the full multiplication expansion, while still understanding what they represent.

## Build an axis-angle quaternion numerically

Choose the unit axis `(0,1,0)` and a ninety-degree rotation. The angle is pi over two, so the half-angle is pi over four. Sine and cosine of that half-angle are both approximately 0.7071. The quaternion in Three.js component order is therefore `(0,0.7071,0,0.7071)`.

For zero rotation, sine of the half-angle is zero and cosine is one, giving identity `(0,0,0,1)`. A quaternion `(0,0,0,0)` is not the identity rotation. This distinction is easy to miss when thinking of all four-component arrays as generic vectors. Its components encode a unit rotation relationship, so normalization and identity have particular meanings.

The axis must be normalized for the usual axis-angle construction. Axis `(0,10,0)` points in the same direction but is not a unit axis. Supplying its magnitude as though it were part of the intended rotation can produce invalid assumptions. Normalize the direction first and keep angle as a separate scalar quantity.

The quaternions q and minus q describe the same spatial orientation. An interpolation implementation should choose the appropriate representative path so it does not take an unintended long arc. Three.js's documented quaternion interpolation methods handle the intended rotation operation; manually interpolating components without considering unit length and sign equivalence is not a substitute.

## Read SLERP as interpolation on the unit sphere

Linear interpolation between two points on a circle cuts across its interior, reducing length. The same phenomenon occurs for unit quaternion components. Spherical interpolation follows an angular path on the unit sphere of representations. For valid unit orientations and the selected shortest path, uniform interpolation progress corresponds to uniform angular progress.

You can still apply easing to the progress before SLERP. The geometric path and the timing along that path are separate choices. An eased camera turn accelerates and decelerates along its orientation path, while an uneased SLERP uses uniform angular timing with respect to t. The code fragment above stores a fixed starting quaternion and a fixed target for this finite transition.

Avoid overwriting `.rotation` and `.quaternion` independently without understanding their relationship in the object. They describe the same orientation through different interfaces. A clean animation system chooses one authoritative source for a given update and composes any additional rotation intentionally. Imported clips and manual code targeting the same transform can otherwise fight each other frame after frame.

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

## Use animation clips as data evaluated over time

A clip contains tracks targeting properties over time. An `AnimationMixer` evaluates actions for an associated hierarchy, while actions control playback, weights, and transitions. Updating a mixer with elapsed seconds advances its evaluation. It is not the same thing as rendering; a scene can evaluate animation and then render through the normal pipeline.

Cross-fading blends action contributions over a chosen duration. The result depends on compatible target properties and the authored poses. Root motion may require an application policy if the animated asset also changes its world placement. Morph tracks change target weights, while skeletal tracks change joint transforms that later deform vertices. Knowing the data path helps diagnose whether an odd pose comes from playback, hierarchy, skinning, or an unrelated manual transform.

Pause should freeze simulation or clip time according to the intended behavior, not merely stop one visible rotation while other updates continue. Reduced-motion preferences should suppress nonessential automatic motion while leaving controls and important state available. A stable nonmoving presentation is a valid mode of a graphics application, not a failure to demonstrate animation.

## Imported animation

`AnimationMixer` evaluates clips over a target hierarchy. A typical setup creates `new THREE.AnimationMixer(gltf.scene)`, calls `mixer.clipAction(clip).play()`, and updates with `mixer.update(dt)`. Cross-fades combine actions over time. Skeleton animation changes joint transforms; skinning deforms vertices from them. Morph animation changes target weights. Avoid overwriting transforms manually on the same nodes unless you intend to combine or replace animation.

For a fixed-step simulation, choose a step such as one hundredth of a second and accumulate real elapsed time. If the accumulator contains 0.027 seconds, perform two 0.01-second updates and retain 0.007 for the next frame. The rendered frame can optionally interpolate between previous and current simulation states using the remaining fraction. Do not feed that leftover fraction back into the physical state as an extra arbitrary step if the algorithm assumes fixed intervals. Also cap the number of catch-up updates after a stall. Otherwise one slow frame can demand so much simulation work that the next becomes slower still. The integration method, step size, and catch-up policy together define the behavior; rendering frequency is a separate scheduling choice.

**Optional application:** add a pause control and a time-scale slider to the orbit lab. Keep simulation time separate from wall-clock time so pause truly freezes state, and respect reduced-motion settings for automatic decorative movement.
