"""Install static card fonts from the repository's bundled WOFF2 sources.
Requires fonttools and brotli. Pass a fontconfig-visible installation directory.
"""
from pathlib import Path
import subprocess
import sys
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

root = Path(__file__).resolve().parents[2]
target = Path(sys.argv[1])
target.mkdir(parents=True, exist_ok=True)
for family, filename in [('Inter', 'inter-variable.woff2'), ('Archivo', 'archivo-latin-wght-normal.woff2')]:
    for weight, style in [(400, 'Regular'), (500, 'Medium'), (600, 'SemiBold'), (700, 'Bold')]:
        font = TTFont(root / 'v2/apps/web/public/fonts' / filename)
        axes = {axis.axisTag: axis.defaultValue for axis in font['fvar'].axes}
        axes['wght'] = weight
        font = instantiateVariableFont(font, axes, inplace=True)
        font.flavor = None
        for name_id, value in [(1, family), (2, style), (4, family+' '+style), (6, family+'-'+style), (16, family), (17, style)]:
            font['name'].setName(value, name_id, 3, 1, 0x409)
            font['name'].setName(value, name_id, 1, 0, 0)
        font['OS/2'].usWeightClass = weight
        font.save(target / f'{family}-{weight}.ttf')
subprocess.run(['fc-cache', '-f', str(target)], check=True)
