# SVG verification

Ten original graphics diagrams were created using the requested [SVG Creator skill](https://github.com/upbrew-tech/svg-creator-skill).

The local `scripts/svg-loop.py` adapts its render/view/fix/finish workflow for Windows. It uses the bundled Sharp renderer instead of CairoSVG and writes all working state inside this project. Finish requires a matching SHA-256 render and a recorded inspection of that rendered version. The upstream skill and Apache-2.0 license remain under `vendor/svg-creator/`.

Every diagram was rendered twice, visually inspected as a contact sheet, and finalized only after checking the final rendering. `texture-sampling.svg` received a third render to improve the sampling-point label contrast. The second pass wrapped long notes and placed the transform labels between the relevant coordinate-space stages.

| SVG in `public/diagrams/` | Teaching purpose |
| --- | --- |
| `coordinate-spaces.svg` | Local, world, view, clip, and normalized device coordinates; transformation order |
| `vectors-dot-cross.svg` | Scalar alignment versus perpendicular oriented-area vector |
| `matrix-composition.svg` | Concrete noncommutative rotate/translate example |
| `projection-frustum.svg` | Perspective division derived from similar triangles |
| `rasterization-barycentric.svg` | Triangle weights, coverage, and perspective-correct interpolation |
| `gpu-pipeline.svg` | CPU submission, programmable shaders, and fixed-function stages |
| `texture-sampling.svg` | Bilinear filtering and mipmap motivation |
| `lighting-normals.svg` | Lambert cosine and inverse-transpose normal transformation |
| `webgpu-bindings.svg` | GPU resources, bind groups, and WGSL interface slots |
| `scene-graph.svg` | Parent/local composition and inherited transformations |

Final PNG previews and per-file render records are under `research/diagram-previews/`. `contact-sheet.png` shows all ten. SVGs use an accessible title and description, a scalable 1000 × 600 viewBox, and no animation.
