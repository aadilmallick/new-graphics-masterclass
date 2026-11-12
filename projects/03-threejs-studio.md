# Project 3 — An interactive sculpture studio

**Prerequisites:** lessons 19–25. **Working references:** labs 09, 10, and 13. **Goal:** make a visually intentional scene that remains understandable and usable.

## Build sequence

Use the material studio’s procedural geometry and environment. Save three material/light presets as data. Choose a camera position, target, and exposure for each rather than scattering constants through the render loop.

Add object selection from the picking lab. Keep a single `selectObject` function used by both pointer raycasting and an HTML list. Add camera reset and a pause control. Make selection visible through both color and a textual name/status.

Optionally load a licensed glTF asset. Inspect its hierarchy and bounds, preserve animation nodes, and place it through a wrapper group. Add a loading state, failure state, and a scene-generation check so a late result cannot attach after navigation.

## Reference solution and explanation

`09-material-studio.js` provides a complete PBR study with a locally generated environment. `13-picking.js` provides a complete CSS-pointer-to-world-ray selection example. `three-scene.js` handles the common scene lifecycle. Lesson 23 supplies the intentionally asset-dependent loader integration fragment.

## Finish criteria

The scene reads at phone size, its focal object has a clear silhouette, controls are keyboard accessible, and color conversion occurs once. The environment gives the material something useful to reflect. A missing asset does not break the entire page.

## Extension

Add a framed screenshot export and a small scene-recipe JSON download. Keep exported settings separate from application code and do not include private paths or credentials.
