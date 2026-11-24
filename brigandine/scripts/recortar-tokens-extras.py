#!/usr/bin/env python3
"""
Recorta folhas de tokens (prévias em grade) em imagens individuais para src/tokens-extra/.
  pip install pillow numpy scipy
  python3 scripts/recortar-tokens-extras.py PASTA_DAS_FOLHAS [grupo1,grupo2]
Folhas esperadas: 7.webp (classes vistas de cima), 8.webp (vilões vistos de cima),
9.webp (retratos de classes), 10.webp (retratos de vilões). Vista de cima: o fundo de
papel vira transparente. Retrato: acha o círculo pela borda e recorta a parte de cima
(rosto), deixando a faixa do nome de fora; o app desenha o aro.
Grava também src/tokens-extra/recorte.json (posição de cada recorte); o app lê só manifest.json.
"""
import sys, json, numpy as np
from PIL import Image, ImageFilter, ImageDraw
from scipy import ndimage as nd
IMG = (sys.argv.pop(1).rstrip('/') + '/') if len(sys.argv) > 1 and not sys.argv[1].startswith(('topo', 'retrato')) else './'
OUT = 'src/tokens-extra/'
import os; os.makedirs(OUT, exist_ok=True)
SIZE = 256

def components(src, T):
    im = np.asarray(Image.open(src).convert('RGB')).astype(np.float32)
    mx, mn = im.max(-1), im.min(-1)
    lum = im @ np.array([0.299, 0.587, 0.114])
    sat = (mx - mn) / (mx + 1)
    fg = (lum < T) | (sat > 0.20)
    fg = nd.binary_opening(fg, iterations=1)
    fg = nd.binary_closing(fg, iterations=3)
    filled = nd.binary_fill_holes(fg)
    bgcol = (lum > T + 8) & (sat < 0.16)
    holes, hn = nd.label(filled & ~fg & bgcol)
    if hn:
        hs = nd.sum(np.ones_like(lum), holes, range(1, hn + 1))
        big = np.zeros(hn + 1, bool); big[1:] = hs > 60
        filled &= ~big[holes]
    fg = filled
    lab, n = nd.label(fg)
    sizes = nd.sum(fg, lab, range(1, n + 1))
    objs = nd.find_objects(lab)
    comps = [dict(id=i + 1, size=int(sizes[i]), y0=objs[i][0].start, y1=objs[i][0].stop, x0=objs[i][1].start, x1=objs[i][1].stop)
             for i in range(n) if 8000 < sizes[i] < 200000 and objs[i][1].stop - objs[i][1].start < 400 and objs[i][0].stop - objs[i][0].start < 400]
    # ordem de leitura: linhas por y, depois x
    comps.sort(key=lambda c: c['y1'])
    rows, cur = [], []
    for c in comps:
        if cur and c['y1'] - cur[0]['y1'] > 60: rows.append(cur); cur = []
        cur.append(c)
    rows.append(cur)
    ordered = [c for r in rows for c in sorted(r, key=lambda c: c['x0'])]
    return Image.open(src).convert('RGB'), lum, lab, ordered, rows, fg

def topdown(sheet, names, prefix, T=185, clean_paper=False):
    img, lum, lab, comps, _, fgm = components(IMG + sheet, T)
    assert len(comps) == len(names), (sheet, len(comps), len(names))
    rgb = np.asarray(img)
    res = []
    for c, (key, name) in zip(comps, names):
        pad = 10
        y0, y1, x0, x1 = max(0, c['y0'] - pad), c['y1'] + pad, max(0, c['x0'] - pad), c['x1'] + pad
        sub = lab[y0:y1, x0:x1]
        # componente principal + pedaços pequenos que caem inteiros dentro da caixa (pontas de arma soltas)
        keep = sub == c['id']
        # tira a sombra clara do papel que encosta na borda da figura (cinza-bege, pouca cor)
        lsub = lum[y0:y1, x0:x1]; rs = rgb[y0:y1, x0:x1].astype(np.float32)
        ssub = (rs.max(-1) - rs.min(-1)) / (rs.max(-1) + 1)
        paper = keep & (lsub > 158) & (ssub < 0.14) & clean_paper
        for _ in range(3):
            pl, pn = nd.label(paper)
            if not pn: break
            outside = nd.binary_dilation(~keep, iterations=1)
            touch = np.unique(pl[outside & (pl > 0)])
            if not len(touch): break
            rm = np.isin(pl, touch)
            keep &= ~rm; paper &= ~rm
        keep = nd.binary_opening(keep, iterations=1)
        lab_k, kn = nd.label(keep)
        if kn > 1:
            ks = nd.sum(keep, lab_k, range(1, kn + 1)); keep = np.isin(lab_k, 1 + np.where(ks > 120)[0])
        for oid in np.unique(sub):
            if oid in (0, c['id']): continue
            ys, xs = np.where(lab == oid)
            if len(ys) < 40 or ys.min() < y0 or ys.max() >= y1 - pad or xs.min() < x0 or xs.max() >= x1: continue
            if ys.min() > c['y1'] - 4: continue  # texto do rótulo
            keep |= sub == oid
        alpha = Image.fromarray((keep * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))
        tile = Image.fromarray(rgb[y0:y1, x0:x1]).convert('RGBA'); tile.putalpha(alpha)
        side = int(max(tile.size) * 1.04)
        sq = Image.new('RGBA', (side, side), (0, 0, 0, 0))
        sq.paste(tile, ((side - tile.size[0]) // 2, (side - tile.size[1]) // 2), tile)
        sq = sq.resize((SIZE, SIZE), Image.LANCZOS)
        fn = f'{prefix}_{key}.webp'; sq.save(OUT + fn, 'WEBP', quality=82, method=6)
        res.append(dict(key=f'{prefix}_{key}', name=name, file=fn))
    return res

def fit_circle(fg, c):
    H, W = fg.shape
    ang = np.deg2rad(np.r_[np.arange(-180, 35, 6), np.arange(145, 181, 6)])  # tudo menos a faixa de baixo
    best = (-1, 0, 0, 0)
    bx = (c['x0'] + c['x1']) / 2
    for R in range(80, 106, 2):
        for cx in np.arange(bx - 14, bx + 15, 2):
            for cy in np.arange(c['y1'] - 2.2 * R, c['y1'] - 0.6 * R, 2):
                xi = np.clip((cx + (R - 5) * np.cos(ang)).astype(int), 0, W - 1); yi = np.clip((cy + (R - 5) * np.sin(ang)).astype(int), 0, H - 1)
                xo = np.clip((cx + (R + 5) * np.cos(ang)).astype(int), 0, W - 1); yo = np.clip((cy + (R + 5) * np.sin(ang)).astype(int), 0, H - 1)
                score = (fg[yi, xi] & ~fg[yo, xo]).mean()
                if score > best[0]: best = (score, cx, cy, R)
    return best

def portraits(sheet, names, prefix, T):
    img, lum, lab, comps, rows, fgm = components(IMG + sheet, T)
    assert len(comps) == len(names), (sheet, len(comps), len(names))
    rgb = img.convert('RGBA')
    res = []
    for c, (key, name) in zip(comps, names):
        score, cx, cy, R = fit_circle(fgm, c)
        # círculo interno deslocado para cima: rosto no centro e a faixa do nome fica de fora
        r = R * 0.8; ccy = cy - R * 0.16
        box = (int(cx - r), int(ccy - r), int(cx + r), int(ccy + r))
        tile = rgb.crop(box).resize((SIZE, SIZE), Image.LANCZOS)
        m = Image.new('L', (SIZE * 4, SIZE * 4), 0); ImageDraw.Draw(m).ellipse((2, 2, SIZE * 4 - 3, SIZE * 4 - 3), fill=255)
        tile.putalpha(m.resize((SIZE, SIZE), Image.LANCZOS))
        fn = f'{prefix}_{key}.webp'; tile.save(OUT + fn, 'WEBP', quality=82, method=6)
        res.append(dict(key=f'{prefix}_{key}', name=name, file=fn, fit=[round(score, 2), int(cx), int(cy), R]))
    return res

CLASSES = [('barbaro','Bárbaro'),('bardo','Bardo'),('clerigo','Clérigo'),('druida','Druida'),('guerreiro','Guerreiro'),('explorador','Explorador'),
           ('ladino','Ladino'),('mago','Mago'),('feiticeiro','Feiticeiro'),('arqueiro','Arqueiro'),('cavaleiro','Cavaleiro'),('cavaleiro_liberdade','Cavaleiro da Liberdade'),
           ('monge','Monge'),('ninja','Ninja'),('paladino','Paladino'),('pistoleiro','Pistoleiro'),('ranger_batalha','Ranger de Batalha'),('invocador','Invocador'),
           ('bruxo','Bruxo'),('kitsune','Kitsune'),('kappa','Kappa'),('tengu','Tengu'),('ryu','Ryu'),('samurai','Samurai')]
VILLAINS = [('goblin_comum','Goblin Comum'),('goblin_atirador','Goblin Atirador'),('goblin_lancador','Goblin Lançador'),('goblin_xama','Goblin Xamã'),('goblin_chefe','Goblin Chefe'),('goblin_arqueiro','Goblin Arqueiro'),('goblin_escudo','Goblin com Escudo'),
            ('lobo_comum','Lobo Comum'),('lobo_alfa','Lobo Alfa'),('lobo_feroz','Lobo Feroz'),('lobo_sombrio','Lobo Sombrio'),('lobo_matilha','Lobo da Matilha'),('lobo_espectral','Lobo Espectral'),('lobo_guerra','Lobo de Guerra'),
            ('ladrao_comum','Ladrão Comum'),('ladrao_arco','Ladrão com Arco'),('ladrao_adaga','Ladrão com Adaga'),('ladra','Ladrona'),('lider_ladroes','Líder de Ladrões'),('ladra_sombria','Ladra Sombria'),('assassino','Assassino')]
ONLY = sys.argv[1] if len(sys.argv) > 1 else None
out = json.load(open(OUT + 'recorte.json')) if ONLY else {}
jobs = {
  'topo_herois': lambda: topdown('7.webp', CLASSES, 'ct'),
  'topo_viloes': lambda: topdown('8.webp', VILLAINS, 'vt', clean_paper=True),
  'retrato_herois': lambda: portraits('9.webp', CLASSES, 'cr', 185),
  'retrato_viloes': lambda: portraits('10.webp', VILLAINS, 'vr', 165),
}
for k, f in jobs.items():
    if ONLY and k not in ONLY.split(','): continue
    out[k] = f()
json.dump(out, open(OUT + 'recorte.json', 'w'), ensure_ascii=False, indent=1)
print({k: len(v) for k, v in out.items()}, sum(os.path.getsize(OUT + f) for f in os.listdir(OUT)) // 1024, 'KB')
