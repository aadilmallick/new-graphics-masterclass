// Local portability adapter for svg-creator's render/view/fix workflow.
let sharp;
try { sharp = require(process.env.GRAPHICS_SHARP_MODULE || 'sharp'); }
catch { throw new Error('Optional SVG verification needs Sharp. Install sharp locally, or set GRAPHICS_SHARP_MODULE to an installed Sharp module path. The course website does not need this optional tool.'); }
sharp(process.argv[2]).resize({width:1000}).png().toFile(process.argv[3]).catch(e=>{console.error(e);process.exit(1)});
