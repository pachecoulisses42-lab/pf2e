#!/usr/bin/env python3
"""Importa um pacote de tokens com licença que proíbe redistribuição, SEM colocá-lo no repositório.

  python3 scripts/importar-tokens-locais.py <pasta-do-pacote> scripts/tokens-locais/abyssal-corsair.json
  npm run build:local      ->  dist-local/brigandine_pf2e_tatico_v5.html (só na sua máquina)

As imagens vão para src/tokens-local/ (ignorada pelo git), reduzidas a 384 px em WebP, com um
manifest.json que o build local embute. Rodar de novo com outra receita acrescenta o pacote.
"""
import json, os, re, sys
from PIL import Image

root = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
pack_dir, recipe_path = sys.argv[1], sys.argv[2]
recipe = json.load(open(recipe_path, encoding='utf-8'))
out_dir = os.path.join(root, 'src', 'tokens-local')
os.makedirs(out_dir, exist_ok=True)
manifest_path = os.path.join(out_dir, 'manifest.json')
manifest = json.load(open(manifest_path, encoding='utf-8')) if os.path.exists(manifest_path) else {'groups': [], 'pieces': []}

items = []
for name in sorted(os.listdir(pack_dir)):
    if not name.lower().endswith(('.webp', '.png')):
        continue
    for slug, ch in recipe['characters'].items():
        m = re.search(re.escape(slug) + r'_(.+?)_topdown_token', name)
        if not m:
            continue
        variant = m.group(1)
        key = f"{ch['key']}_{variant}"
        im = Image.open(os.path.join(pack_dir, name)).convert('RGBA')
        im.thumbnail((384, 384), Image.LANCZOS)
        im.save(os.path.join(out_dir, key + '.webp'), 'WEBP', quality=90, method=6)
        items.append({'key': key, 'name': f"{ch['name']} ({recipe['variants'].get(variant, variant)})", 'file': key + '.webp'})
        break

group = dict(recipe['group'], items=items)
manifest['groups'] = [g for g in manifest['groups'] if g['id'] != group['id']] + [group]
ids = {p['id'] for p in recipe['pieces']}
manifest['pieces'] = [p for p in manifest['pieces'] if p['id'] not in ids] + recipe['pieces']
json.dump(manifest, open(manifest_path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(f"{len(items)} tokens e {len(recipe['pieces'])} peças em {out_dir}")
