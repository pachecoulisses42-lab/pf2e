/* ============================================================================
   1k. TOKENS 3D — motor low-poly sem dependências
   Bonecos montados com prismas facetados, esqueleto simples e poses por animação
   (parado, andar, atacar, magia, item). Desenha em canvas 2D com sombreamento por face.
   ============================================================================ */

const T3D_DEG = Math.PI / 180;
const T3D_LIGHT = (() => { const v = [-0.45, 0.8, 0.55]; const l = Math.hypot(...v); return v.map(x => x / l); })();

/* ---------- matrizes 3x4 (rotação + translação) ---------- */
function t3dMat(rx = 0, ry = 0, rz = 0, tx = 0, ty = 0, tz = 0) {
  const cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry), cz = Math.cos(rz), sz = Math.sin(rz);
  // R = Ry * Rx * Rz
  const m00 = cy * cz + sy * sx * sz, m01 = -cy * sz + sy * sx * cz, m02 = sy * cx;
  const m10 = cx * sz, m11 = cx * cz, m12 = -sx;
  const m20 = -sy * cz + cy * sx * sz, m21 = sy * sz + cy * sx * cz, m22 = cy * cx;
  return [m00, m01, m02, tx, m10, m11, m12, ty, m20, m21, m22, tz];
}
function t3dMul(a, b) {
  return [
    a[0] * b[0] + a[1] * b[4] + a[2] * b[8], a[0] * b[1] + a[1] * b[5] + a[2] * b[9], a[0] * b[2] + a[1] * b[6] + a[2] * b[10], a[0] * b[3] + a[1] * b[7] + a[2] * b[11] + a[3],
    a[4] * b[0] + a[5] * b[4] + a[6] * b[8], a[4] * b[1] + a[5] * b[5] + a[6] * b[9], a[4] * b[2] + a[5] * b[6] + a[6] * b[10], a[4] * b[3] + a[5] * b[7] + a[6] * b[11] + a[7],
    a[8] * b[0] + a[9] * b[4] + a[10] * b[8], a[8] * b[1] + a[9] * b[5] + a[10] * b[9], a[8] * b[2] + a[9] * b[6] + a[10] * b[10], a[8] * b[3] + a[9] * b[7] + a[10] * b[11] + a[11]
  ];
}
function t3dApply(m, p) {
  return [m[0] * p[0] + m[1] * p[1] + m[2] * p[2] + m[3], m[4] * p[0] + m[5] * p[1] + m[6] * p[2] + m[7], m[8] * p[0] + m[9] * p[1] + m[10] * p[2] + m[11]];
}

/* ---------- primitivas (polígonos com cor) ---------- */

/**
 * Prisma/tronco de n lados ao longo de y, de y0 a y1. rx/rz: raios em x e z (base e topo).
 * off: deslocamento do topo (chapéu torto, capuz). twist: gira o polígono (facetado).
 */
function t3dPrism({ n = 6, y0 = 0, y1 = 1, r0 = 0.2, r1 = 0.2, sx = 1, sz = 1, off = [0, 0], twist = 0, color, top = true, bottom = true, cx = 0, cz = 0, jag = 0 }) {
  const ring = (y, r, ox, oz, k) => Array.from({ length: n }, (_, i) => {
    const a = twist + (i / n) * Math.PI * 2;
    const rr = r * (1 + (jag && k ? ((i % 2) ? jag : -jag) : 0));
    return [cx + ox + Math.cos(a) * rr * sx, y, cz + oz + Math.sin(a) * rr * sz];
  });
  const A = ring(y0, r0, 0, 0, 1), B = ring(y1, r1, off[0], off[1], 0);
  const faces = [];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    if (r1 <= 0.0001) faces.push({ v: [A[i], B[i], A[j]], c: color });
    else faces.push({ v: [A[i], B[i], B[j], A[j]], c: color });
  }
  if (bottom && r0 > 0.0001) faces.push({ v: [...A], c: color });
  if (top && r1 > 0.0001) faces.push({ v: [...B], c: color });
  return t3dOrient(faces);
}

/** Caixa centrada em (x,y,z) com tamanhos w,h,d. */
function t3dBox({ x = 0, y = 0, z = 0, w = 0.2, h = 0.2, d = 0.2, color, taper = 1 }) {
  const hw = w / 2, hh = h / 2, hd = d / 2, tw = hw * taper, td = hd * taper;
  const p = [
    [x - hw, y - hh, z - hd], [x + hw, y - hh, z - hd], [x + hw, y - hh, z + hd], [x - hw, y - hh, z + hd],
    [x - tw, y + hh, z - td], [x + tw, y + hh, z - td], [x + tw, y + hh, z + td], [x - tw, y + hh, z + td]
  ];
  const f = (a, b, c, d) => ({ v: [p[a], p[b], p[c], p[d]], c: color });
  return t3dOrient([f(0, 1, 2, 3), f(7, 6, 5, 4), f(3, 2, 6, 7), f(1, 0, 4, 5), f(2, 1, 5, 6), f(0, 3, 7, 4)]);
}

/** Lâmina/placa fina (losango alongado ao longo de y): espadas, adagas, penas. */
function t3dBlade({ y0 = 0, y1 = 1, w = 0.08, t = 0.02, color, tip = 0.15, glow = false }) {
  const ym = y1 - tip;
  const p = [[0, y0, -t], [w / 2, y0, 0], [0, y0, t], [-w / 2, y0, 0], [0, ym, -t], [w / 2, ym, 0], [0, ym, t], [-w / 2, ym, 0], [0, y1, 0]];
  const faces = [];
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    faces.push({ v: [p[i], p[j], p[j + 4], p[i + 4]], c: color, glow });
    faces.push({ v: [p[i + 4], p[j + 4], p[8]], c: color, glow });
  }
  return t3dOrient(faces);
}

/** Vira para fora as faces de uma peça convexa (normal apontando para longe do centro). */
function t3dOrient(faces) {
  let cx = 0, cy = 0, cz = 0, n = 0;
  for (const f of faces) for (const v of f.v) { cx += v[0]; cy += v[1]; cz += v[2]; n++; }
  cx /= n; cy /= n; cz /= n;
  for (const f of faces) {
    let nx = 0, ny = 0, nz = 0, fx = 0, fy = 0, fz = 0;
    for (let i = 0; i < f.v.length; i++) {
      const a = f.v[i], b = f.v[(i + 1) % f.v.length];
      nx += (a[1] - b[1]) * (a[2] + b[2]); ny += (a[2] - b[2]) * (a[0] + b[0]); nz += (a[0] - b[0]) * (a[1] + b[1]);
      fx += a[0]; fy += a[1]; fz += a[2];
    }
    const k = f.v.length;
    if (nx * (fx / k - cx) + ny * (fy / k - cy) + nz * (fz / k - cz) < 0) f.v.reverse();
  }
  return faces;
}

/* ---------- esqueleto ---------- */

/** Nó do esqueleto: pos relativa ao pai, rot base, peças e filhos. */
function t3dNode(name, pos, parts = [], children = [], rot = [0, 0, 0], when = null) {
  return { name, pos, rot, parts: parts.flat(), children, when };
}

function t3dFind(node, name) {
  if (node.name === name) return node;
  for (const c of node.children) { const r = t3dFind(c, name); if (r) return r; }
  return null;
}

/* ---------- desenho ---------- */

/**
 * Desenha o modelo num contexto 2D. opts: { x, y (pés na tela), scale (px por unidade), yaw (rad),
 * elev (rad, inclinação da câmera), pose: { nome: [rx, ry, rz] }, offset: [x,y,z] do corpo }.
 */
function t3dDraw(ctx2, model, opts) {
  const { x, y, scale, yaw = 0, elev = 50 * T3D_DEG, pose = {}, rootOffset = [0, 0, 0], flags = [], offsets = {} } = opts;
  const anchors = {};
  const ce = Math.cos(elev), se = Math.sin(elev);
  const view = [0, se, ce];
  const polys = [];
  const walk = (node, parentM) => {
    if (node.when && !flags.includes(node.when)) return;
    const extra = pose[node.name] || [0, 0, 0];
    const base = node.name === 'root' ? [node.pos[0] + rootOffset[0], node.pos[1] + rootOffset[1], node.pos[2] + rootOffset[2]] : node.pos;
    const off = offsets[node.name];
    const p = off ? [base[0] + off[0], base[1] + off[1], base[2] + off[2]] : base;
    const local = t3dMat(node.rot[0] + extra[0], node.rot[1] + extra[1], node.rot[2] + extra[2], p[0], p[1], p[2]);
    const m = t3dMul(parentM, local);
    if (node.anchor) { const q = t3dApply(m, [0, 0, 0]); anchors[node.name] = { x: x + q[0] * scale, y: y + (-q[1] * ce + q[2] * se) * scale }; }
    for (const f of node.parts) {
      const w = f.v.map(v => t3dApply(m, v));
      // normal pela regra da mão direita (Newell)
      let nx = 0, ny = 0, nz = 0;
      for (let i = 0; i < w.length; i++) {
        const a = w[i], b = w[(i + 1) % w.length];
        nx += (a[1] - b[1]) * (a[2] + b[2]); ny += (a[2] - b[2]) * (a[0] + b[0]); nz += (a[0] - b[0]) * (a[1] + b[1]);
      }
      const nl = Math.hypot(nx, ny, nz) || 1;
      nx /= nl; ny /= nl; nz /= nl;
      const facing = nx * view[0] + ny * view[1] + nz * view[2];
      if (facing <= 0 && !f.both) continue;
      let depth = 0;
      const pts = w.map(q => { depth += q[1] * se + q[2] * ce; return [x + q[0] * scale, y + (-q[1] * ce + q[2] * se) * scale]; });
      const lam = Math.max(0, nx * T3D_LIGHT[0] + ny * T3D_LIGHT[1] + nz * T3D_LIGHT[2]);
      polys.push({ pts, depth: depth / w.length, c: f.c, shade: f.glow ? 1.15 : 0.58 + 0.55 * lam, glow: f.glow });
    }
    for (const c of node.children) walk(c, m);
  };
  walk(model.root, t3dMat(0, yaw, 0, 0, 0, 0));
  polys.sort((a, b) => a.depth - b.depth);
  ctx2.save();
  ctx2.lineJoin = 'round';
  for (const p of polys) {
    const col = t3dShade(p.c, p.shade);
    ctx2.fillStyle = col;
    ctx2.strokeStyle = col;
    ctx2.lineWidth = 0.6;
    ctx2.beginPath();
    p.pts.forEach((q, i) => (i ? ctx2.lineTo(q[0], q[1]) : ctx2.moveTo(q[0], q[1])));
    ctx2.closePath();
    ctx2.fill();
    ctx2.stroke();
  }
  ctx2.restore();
  return anchors;
}

const T3D_SHADE_CACHE = new Map();
function t3dShade(hex, k) {
  if (!hex) hex = '#888888';
  const key = hex + Math.round(k * 40);
  let v = T3D_SHADE_CACHE.get(key);
  if (v) return v;
  const n = parseInt(hex.slice(1), 16);
  const q = Math.round(k * 40) / 40;
  const ch = (c) => Math.max(0, Math.min(255, Math.round(c * q)));
  v = `rgb(${ch((n >> 16) & 255)}, ${ch((n >> 8) & 255)}, ${ch(n & 255)})`;
  T3D_SHADE_CACHE.set(key, v);
  return v;
}
