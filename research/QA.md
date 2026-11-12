# Expanded textbook revision verification

The 40 core lessons were expanded from 27,527 to 95,008 prose words, excluding fenced code. The complete learning collection now contains 102,796 prose words, 76 fenced examples, and 198 parsed math expressions. Technical chapters 01–38 exceed 2,300 prose words; orientation and conclusion exceed 2,000. Per-chapter counts are in chapter-depth.json.

The revision integrates numerical reasoning, derivations, code walkthroughs, prerequisite explanations, and diagnostic scenarios into each chapter. Section order was reviewed so related worked explanations precede or accompany formal summaries. The reference chapters remain lookup companions.

All 51 reading pages were opened in the production preview without missing content or KaTeX errors. The long-chapter table of contents was visually inspected and now scrolls independently. Mathematical tests, content/link/math checks, and the production build passed. Lab source was unchanged; the earlier lab verification below remains a record of those implementations. New instructional code fragments were reviewed in context, not all executed as independent applications.

The record below describes the original edition and its rendering tests.

---

# Verification record

Verified on 12 November 2026 in the local desktop environment.

## Content and mathematics

- 40 core lessons, 5 reference chapters, and 6 project briefs: 51 learning files.
- Approximately 35,315 prose words, excluding fenced code and repository setup/provenance files.
- 35 fenced code examples plus 21 complete interactive lab modules and their shared helpers.
- 193 inline/display math expressions parsed successfully by KaTeX.
- Internal lab/lesson links and referenced SVG files passed the content checker.
- All 51 learning pages were opened in the website: no missing titles, unavailable-content fallbacks, KaTeX errors, or observed broken diagram images.
- Eight numerical tests passed: point/direction transforms, transform order and handedness, camera basis and degeneracy, WebGL/WebGPU projection endpoints, barycentrics, vector invariants, ray intersections, and buffer byte offsets.

## Rendering

All 21 labs rendered and were visually inspected in the in-app browser. This included four Canvas/math labs, five raw WebGL studies including ray marching, six Three.js studies, one CPU ray tracer, four native WebGPU labs, and one Three.js TSL lab.

Native WebGPU initialization, WGSL compilation, rendering, compute dispatch, mapped readback, and compute-to-render storage were available and exercised on this machine. The multiplier lab returned 2–16 for factor 2 and 10–80 for factor 10. The particle lab displayed 8,192 GPU-updated particles. The textured WebGPU cube and TSL material also rendered without observed validation errors.

A removed r187 `PCFSoftShadowMap` setting was identified during initial inspection and changed to `PCFShadowMap`. Subsequent scene visits did not produce a new warning from that setting. No console errors were observed during the final lab/page sweep.

## Interaction and layout

- Tested pointer ray selection and the accessible crystal selector; both selected the same logical crystal and updated status.
- Tested Source and Shared Helpers tabs, slider keyboard input, native compute updates, full-text search, and completion/undo. Completion was returned to zero after testing.
- Checked desktop home, gallery/scene views, lesson typography, display/inline math, and diagram placement.
- Checked representative phone layouts at 390 × 844: home, lesson reading, menu open/close/navigation, and the material lab. No horizontal page overflow was observed. Reset the temporary viewport afterward.
- Hidden mobile navigation is inert until opened; controls use native elements and visible focus styles. Decorative animation honors reduced-motion preferences in code.

## Production build

`npm run check`, `npm test`, and `npm run build` passed. The built `dist` site was served separately on a production preview server; home, camera math/diagram, and native WebGPU particles worked there. Runtime assets, math fonts, and libraries are local to the build. No remote model/image downloads are required by the included labs.

## Limits of this verification

This is one GPU/browser environment, not a cross-device certification. An actual unsupported-WebGPU device, forced Three.js WebGL fallback, context/device-loss recovery event, every screen-reader/browser combination, and long-duration memory/performance behavior were not exercised. The native labs contain capability/error messaging, but optional extensions in lessons and capstone briefs are learner projects rather than implemented claims. Source website editors were not executed; access limitations are recorded in the source audit.

SVG verification is recorded separately in `diagram-verification.md`. Every delivered SVG was rendered and visually inspected through the requested render/view/fix workflow.
