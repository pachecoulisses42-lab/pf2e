/* ============================================================================
   10b. FORMAS DE PINTURA E LUZ
   Formas (célula, raio, emanação, cone, linha, quadrado, tudo) usadas por terreno e
   clima; fontes de luz (objetos, perigos, itens acesos nas peças) e o nível de luz
   de cada célula, com paredes/muros bloqueando a luz.
   ============================================================================ */

const cellKey = (c, r) => `${c},${r}`;

function allBoardCells() {
  const out = [];
  for (let r = 0; r < STATE.grid.rows; r++) for (let c = 0; c < STATE.grid.cols; c++) out.push({ col: c, row: r });
  return out;
}

/** Ângulo (rad, tela) do centro de A ao centro de B; mesma célula = leste. */
function cellAngle(a, b) {
  const pa = getCellPixelCenter(a.col, a.row);
  const pb = getCellPixelCenter(b.col, b.row);
  return pa.x === pb.x && pa.y === pb.y ? 0 : Math.atan2(pb.y - pa.y, pb.x - pa.x);
}

/** Ângulo de tela para onde a peça olha (direção 0° = sul). */
function facingAngle(facingDeg) {
  const a = normalizeFacing(facingDeg) * Math.PI / 180;
  return Math.atan2(Math.cos(a), -Math.sin(a));
}

/** Cone de 90° (Pathfinder): células até `lengthMeters`, a até 45° da direção. Inclui a origem se pedido. */
function computeConeCells(originCol, originRow, angleRad, lengthMeters, includeOrigin = false) {
  const o = getCellPixelCenter(originCol, originRow);
  const out = [];
  for (const cell of allBoardCells()) {
    if (cell.col === originCol && cell.row === originRow) { if (includeOrigin) out.push(cell); continue; }
    if (cellDistanceMeters(originCol, originRow, cell.col, cell.row) > lengthMeters) continue;
    const p = getCellPixelCenter(cell.col, cell.row);
    let diff = Math.atan2(p.y - o.y, p.x - o.x) - angleRad;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    if (Math.abs(diff) <= Math.PI / 4 + 0.02) out.push(cell);
  }
  return out;
}

/** Retângulo entre duas células (por coluna e linha). */
function computeSquareCells(a, b) {
  const out = [];
  const c0 = Math.min(a.col, b.col), c1 = Math.max(a.col, b.col);
  const r0 = Math.min(a.row, b.row), r1 = Math.max(a.row, b.row);
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) out.push({ col: c, row: r });
  return out;
}

/** Células de uma forma de pintura. a = origem, b = fim do arrasto (ou a mesma), size em metros. */
function shapeCells(shape, a, b, size) {
  switch (shape) {
    case 'burst':
    case 'emanation': return computeBurstCells(a.col, a.row, size);
    case 'cone': return computeConeCells(a.col, a.row, cellAngle(a, b), size, false);
    case 'line': return [a, ...computeLineCells(a.col, a.row, b.col, b.row, size).affected];
    case 'square': return computeSquareCells(a, b);
    case 'all': return allBoardCells();
    default: return [a];
  }
}

/* ---------------- Linha de visão da luz ---------------- */

/** Células atravessadas pela reta entre duas células (sem as pontas). Hexágono em coordenadas cúbicas. */
function cellsBetween(a, b) {
  const out = [];
  if (STATE.grid.type === 'square') {
    const n = Math.max(Math.abs(b.col - a.col), Math.abs(b.row - a.row)) * 2;
    for (let i = 1; i < n; i++) {
      const t = i / n;
      out.push({ col: Math.round(a.col + (b.col - a.col) * t), row: Math.round(a.row + (b.row - a.row) * t) });
    }
  } else {
    const toCube = (c) => { const x = c.col - (c.row - (c.row & 1)) / 2; const z = c.row; return [x, -x - z, z]; };
    const A = toCube(a), B = toCube(b);
    const n = cellDistanceInSteps(a.col, a.row, b.col, b.row);
    for (let i = 1; i < n; i++) {
      const t = i / n;
      // pequeno deslocamento evita empates exatos na borda entre dois hexágonos
      let [x, y, z] = [0, 1, 2].map((k) => A[k] + (B[k] - A[k]) * t + [1e-6, 2e-6, -3e-6][k]);
      let rx = Math.round(x), ry = Math.round(y), rz = Math.round(z);
      const dx = Math.abs(rx - x), dy = Math.abs(ry - y), dz = Math.abs(rz - z);
      if (dx > dy && dx > dz) rx = -ry - rz; else if (dy > dz) ry = -rx - rz; else rz = -rx - ry;
      out.push({ col: rx + (rz - (rz & 1)) / 2, row: rz });
    }
  }
  return out;
}

function objectAtCell(col, row) {
  return (STATE.objects || []).find((o) => o.col === col && o.row === row) || null;
}

function lightBlockedBetween(a, b, blockers) {
  const ends = new Set([cellKey(a.col, a.row), cellKey(b.col, b.row)]);
  return cellsBetween(a, b).some((c) => { const k = cellKey(c.col, c.row); return !ends.has(k) && blockers.has(k); });
}

/* ---------------- Fontes de luz ---------------- */

/** Todas as fontes de luz ativas: objetos, perigos que iluminam e itens acesos carregados pelas peças. */
function collectLightSources() {
  const out = [];
  for (const o of STATE.objects || []) {
    const light = (OBJECT_TYPES[o.type] || HAZARD_TYPES[o.type] || {}).light;
    if (light) out.push({ col: o.col, row: o.row, ...light, from: o.type });
  }
  for (const u of STATE.units || []) {
    if (u.hp <= 0) continue;
    for (const it of u.items || []) {
      const light = it.lit && itemLight(it);
      if (light) out.push({ col: u.col, row: u.row, ...light, angle: light.shape === 'cone' ? facingAngle(u.facing) : 0, from: it.id, unitId: u.id });
    }
  }
  return out;
}

/** Nível de luz por célula: 2 = plena, 1 = penumbra (só as células com alguma luz aparecem). */
function computeLightMap() {
  const blockers = new Set();
  for (const [k, t] of Object.entries(STATE.terrainMap || {})) if (cellBlocksLight(t)) blockers.add(k);
  for (const o of STATE.objects || []) if (cellBlocksLight(undefined, o.type)) blockers.add(cellKey(o.col, o.row));
  const map = {};
  for (const src of collectLightSources()) {
    const cells = src.shape === 'cone'
      ? computeConeCells(src.col, src.row, src.angle, src.dim, true)
      : computeBurstCells(src.col, src.row, src.dim);
    for (const cell of cells) {
      const k = cellKey(cell.col, cell.row);
      // a face da parede recebe luz; só o que está atrás dela fica escuro
      if (lightBlockedBetween(src, cell, blockers)) continue;
      const d = cell.col === src.col && cell.row === src.row ? 0 : cellDistanceMeters(src.col, src.row, cell.col, cell.row);
      const level = d <= src.bright ? 2 : 1;
      if (!map[k] || map[k] < level) map[k] = level;
    }
  }
  // clarão de magia (fogo, raio, luz sagrada): área atingida em luz plena até o fim da rodada
  for (const f of STATE.flashLights || []) for (const k of f.keys) map[k] = 2;
  return map;
}

/** Registra o clarão de uma magia na área atingida; some quando a rodada termina. */
function addSpellFlash(spell, cells) {
  if (!spell || !spell.flash || !cells.length) return;
  (STATE.flashLights ||= []).push({ keys: cells.map(c => cellKey(c.col, c.row)), round: STATE.combat.round, from: spell.name });
}

/** Fim da rodada: os clarões das magias se apagam. */
function expireSpellFlashes(newRound) {
  STATE.flashLights = (STATE.flashLights || []).filter(f => f.round >= newRound);
}

/* ---------------- Clima ---------------- */

/** Células com um efeito de clima: pintadas + emanações presas a peças. */
function effectCellSet(type) {
  const set = new Set(Object.keys((STATE.effects && STATE.effects[type]) || {}));
  for (const z of STATE.effectZones || []) {
    if (z.type !== type) continue;
    const u = STATE.units.find((x) => x.id === z.unitId);
    if (!u) continue;
    for (const c of computeBurstCells(u.col, u.row, z.radius)) set.add(cellKey(c.col, c.row));
  }
  return set;
}

/** Nível de luz da casa: 'bright' | 'dim' | 'dark' (só há penumbra/escuridão onde a escuridão foi posta). */
function cellLightLevel(col, row, darkMap = computeDarknessMap()) {
  return lightLevelFromDarkness(darkMap[cellKey(col, row)] || 0);
}

/**
 * Como o observador percebe o alvo (luz na casa do alvo × visão do observador), CD do teste simples
 * e se o observador está escondido do alvo (alvo desprevenido contra ele).
 */
function visibilityBetween(observer, target, darkMap = computeDarknessMap()) {
  const vis = visibilityFor(cellLightLevel(target.col, target.row, darkMap), unitVision(observer));
  const back = visibilityFor(cellLightLevel(observer.col, observer.row, darkMap), unitVision(target));
  return { vis, dc: flatCheckDC(vis), observerHidden: back === 'hidden' };
}

/** Escuridão efetiva por célula (0, 0.5, 1) já descontada a luz. */
function computeDarknessMap(lightMap = computeLightMap()) {
  const out = {};
  for (const k of effectCellSet('escuridao')) {
    const d = darknessAt(true, lightMap[k] || 0);
    if (d > 0) out[k] = d;
  }
  return out;
}
