"""Build the portable learner ZIP using Python's standard library."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import argparse

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--output', type=Path, default=root.parent / 'graphics-atelier-masterclass.zip')
args = parser.parse_args()
destination = args.output.resolve()
excluded = {'.git', 'node_modules', '.sites-runtime', '__pycache__'}
with ZipFile(destination, 'w', compression=ZIP_DEFLATED, compresslevel=7) as archive:
    for item in sorted(root.rglob('*')):
        if not item.is_file() or item.resolve() == destination:
            continue
        relative = item.relative_to(root)
        if any(part in excluded for part in relative.parts):
            continue
        if relative.as_posix() == 'research/textbook.txt' or item.suffix in {'.zip', '.gz'}:
            continue
        archive.write(item, Path(root.name) / relative)
with ZipFile(destination) as archive:
    assert archive.testzip() is None, 'Archive integrity check failed'
    names = archive.namelist()
    assert f'{root.name}/dist/index.html' in names, 'Build the website before packaging'
    assert len([n for n in names if n.startswith(f'{root.name}/course/') and n.endswith('.md')]) == 45
    assert len([n for n in names if n.startswith(f'{root.name}/projects/') and n.endswith('.md')]) == 6
print(f'Verified {destination} ({destination.stat().st_size:,} bytes)')
