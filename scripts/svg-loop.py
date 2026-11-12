"""Portable render/view/fix/finish adaptation of vendor/svg-creator/scripts/svg_loop.py.

Uses the bundled Sharp SVG renderer instead of installing CairoSVG. States and
previews stay inside the project; finish requires a render of the current bytes.
Run `viewed` only after actually inspecting the preview with an image tool.
Upstream skill/script: upbrew-tech/svg-creator-skill, Apache-2.0.
"""
from pathlib import Path
import hashlib, json, subprocess, sys, shutil

ROOT=Path(__file__).resolve().parents[1]
PREVIEWS=ROOT/'research'/'diagram-previews'
PREVIEWS.mkdir(parents=True,exist_ok=True)
command=sys.argv[1]
source=Path(sys.argv[2]).resolve()
state_path=PREVIEWS/(source.stem+'.json')
preview=PREVIEWS/(source.stem+'.png')
digest=lambda:hashlib.sha256(source.read_bytes()).hexdigest()
state=json.loads(state_path.read_text()) if state_path.exists() else {'iterations':0}
if command=='render':
    subprocess.run(['node',str(ROOT/'scripts'/'svg-render.cjs'),str(source),str(preview)],check=True)
    state.update(iterations=state['iterations']+1,sha256=digest(),viewed=False,source=str(source))
    state_path.write_text(json.dumps(state,indent=2))
    print(f'Rendered {source.name}: {preview}')
elif command=='viewed':
    if state.get('sha256') != digest():raise SystemExit('Render current SVG first')
    state['viewed']=True
    state_path.write_text(json.dumps(state,indent=2))
    print(f'Inspection recorded: {source.name}')
elif command=='finish':
    if not state.get('viewed') or state.get('sha256')!=digest():raise SystemExit('BLOCKED: render and view current SVG before finish')
    output=ROOT/'public'/'diagrams'/source.name
    output.parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(source,output)
    state['delivered']=str(output)
    state_path.write_text(json.dumps(state,indent=2))
    print(f'Finished {source.name} after {state["iterations"]} render(s)')
else:raise SystemExit('Use render, viewed, finish <draft.svg>')
