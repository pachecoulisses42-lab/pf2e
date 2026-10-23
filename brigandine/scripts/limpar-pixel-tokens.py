"""Limpa as folhas: em cada quadro mantém só a figura principal (maior componente conectado e
os pedaços grandes encostados nela), apagando fragmentos de outras figuras. Mede cortes nas bordas."""
import sys, json, os
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
ids = [m['id'] for m in json.load(open(os.path.join(src, 'manifest.json')))]
report = {}
for i in ids:
    sh = Image.open(os.path.join(src, 'assets', i + '_sheet.png')).convert('RGBA')
    W, H = sh.size
    px = sh.load()
    res = Image.new('RGBA', sh.size, (0, 0, 0, 0))
    rp = res.load()
    edge_hits = {'left': 0, 'right': 0, 'top': 0, 'bottom': 0}
    for fy in range(H // 128):
        for fx in range(W // 128):
            x0, y0 = fx * 128, fy * 128
            seen = set(); comps = []
            for y in range(128):
                for x in range(128):
                    if (x, y) in seen or px[x0 + x, y0 + y][3] < 20: continue
                    stack = [(x, y)]; seen.add((x, y)); comp = []
                    while stack:
                        cx, cy = stack.pop(); comp.append((cx, cy))
                        for dx in (-1, 0, 1):
                            for dy in (-1, 0, 1):
                                nx, ny = cx + dx, cy + dy
                                if 0 <= nx < 128 and 0 <= ny < 128 and (nx, ny) not in seen and px[x0 + nx, y0 + ny][3] >= 20:
                                    seen.add((nx, ny)); stack.append((nx, ny))
                    comps.append(comp)
            if not comps: continue
            comps.sort(key=len, reverse=True)
            main = comps[0]
            ys = [p[1] for p in main]; xs = [p[0] for p in main]
            keep = [main]
            # pedaços médios dentro da faixa vertical da figura principal (arma, mão destacada)
            for c in comps[1:]:
                cy = sum(p[1] for p in c) / len(c)
                if len(c) >= 6 and min(ys) - 4 <= cy <= max(ys) + 4: keep.append(c)
            for c in keep:
                for (x, y) in c: rp[x0 + x, y0 + y] = px[x0 + x, y0 + y]
            if fy == 0 and fx == 0:
                edge_hits = {'left': sum(1 for p in main if p[0] == 0), 'right': sum(1 for p in main if p[0] == 127),
                             'top': sum(1 for p in main if p[1] == 0), 'bottom': sum(1 for p in main if p[1] == 127),
                             'w': max(xs) - min(xs) + 1, 'h': max(ys) - min(ys) + 1, 'px': len(main)}
    res.save(os.path.join(out, i + '_sheet.png'))
    report[i] = edge_hits
for k, v in report.items(): print(k, v)
