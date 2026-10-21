/* ============================================================================
   8. GRID GEOMETRY & DISTANCE CALCULATIONS
   ============================================================================ */
function getCellPixelCenter(col, row) {
  const s = STATE.camera.basePx * STATE.camera.zoom;
  if (STATE.grid.type === 'square') {
    return {
      x: STATE.camera.x + col * s + s / 2,
      y: STATE.camera.y + row * s + s / 2
    };
  } else {
    const radius = s * 0.56;
    const hexW = Math.sqrt(3) * radius;
    const hexH = 2 * radius;
    const xOffset = (row % 2 !== 0) ? hexW / 2 : 0;
    return {
      x: STATE.camera.x + col * hexW + xOffset + hexW / 2,
      y: STATE.camera.y + row * (hexH * 0.75) + radius
    };
  }
}

function pixelToCell(px, py) {
  const s = STATE.camera.basePx * STATE.camera.zoom;
  if (STATE.grid.type === 'square') {
    const col = Math.floor((px - STATE.camera.x) / s);
    const row = Math.floor((py - STATE.camera.y) / s);
    if (col >= 0 && col < STATE.grid.cols && row >= 0 && row < STATE.grid.rows) {
      return { col, row };
    }
    return null;
  } else {
    let best = null;
    let minDist = Infinity;
    const radius = s * 0.56;
    for (let r = 0; r < STATE.grid.rows; r++) {
      for (let c = 0; c < STATE.grid.cols; c++) {
        const center = getCellPixelCenter(c, r);
        const d = Math.hypot(px - center.x, py - center.y);
        if (d < radius && d < minDist) {
          minDist = d;
          best = { col: c, row: r };
        }
      }
    }
    return best;
  }
}

function getNeighbors(col, row) {
  const list = [];
  if (STATE.grid.type === 'square') {
    const dirs = [
      { dc: 0, dr: -1, diag: false }, { dc: 1, dr: 0, diag: false },
      { dc: 0, dr: 1, diag: false },  { dc: -1, dr: 0, diag: false },
      { dc: 1, dr: -1, diag: true },  { dc: 1, dr: 1, diag: true },
      { dc: -1, dr: 1, diag: true },  { dc: -1, dr: -1, diag: true }
    ];
    for (const d of dirs) {
      const nc = col + d.dc;
      const nr = row + d.dr;
      if (nc >= 0 && nc < STATE.grid.cols && nr >= 0 && nr < STATE.grid.rows) {
        list.push({ col: nc, row: nr, diag: d.diag });
      }
    }
  } else {
    const isOdd = (row % 2 !== 0);
    const dirs = isOdd
      ? [[+1, 0], [+1, -1], [0, -1], [-1, 0], [0, +1], [+1, +1]]
      : [[+1, 0], [0, -1], [-1, -1], [-1, 0], [-1, +1], [0, +1]];
    for (const [dc, dr] of dirs) {
      const nc = col + dc;
      const nr = row + dr;
      if (nc >= 0 && nc < STATE.grid.cols && nr >= 0 && nr < STATE.grid.rows) {
        list.push({ col: nc, row: nr, diag: false });
      }
    }
  }
  return list;
}

function isAdjacentCell(c1, r1, c2, r2) {
  if (c1 === c2 && r1 === r2) return false;
  return getNeighbors(c1, r1).some(nb => nb.col === c2 && nb.row === r2);
}

function cellDistanceInSteps(c1, r1, c2, r2) {
  if (STATE.grid.type === 'square') {
    const dx = Math.abs(c1 - c2);
    const dy = Math.abs(r1 - r2);
    const diag = Math.min(dx, dy);
    const straight = Math.max(dx, dy) - diag;
    return straight + diag + Math.floor(diag / 2);
  } else {
    const q1 = c1 - (r1 - (r1 & 1)) / 2;
    const q2 = c2 - (r2 - (r2 & 1)) / 2;
    const dq = q1 - q2;
    const dr = r1 - r2;
    return (Math.abs(dq) + Math.abs(dq + dr) + Math.abs(dr)) / 2;
  }
}

function cellDistanceMeters(c1, r1, c2, r2) {
  if (isAdjacentCell(c1, r1, c2, r2)) return STATE.grid.cellScale;
  return cellDistanceInSteps(c1, r1, c2, r2) * STATE.grid.cellScale;
}

/* ============================================================================
   9. MOVEMENT ENGINE (50%, 25%, 10% TRANSLUCENCY SCALE)
   ============================================================================ */
function computeReachableCells(unit) {
  if (!unit || unit.hp <= 0) return {};
  const scale = STATE.grid.cellScale;
  const maxMeters = unit.moveSpeed * 3;
  const distMap = {};
  const startKey = `${unit.col},${unit.row}`;
  distMap[startKey] = 0;

  const queue = [{ col: unit.col, row: unit.row, cost: 0, diagCount: 0 }];

  while (queue.length > 0) {
    queue.sort((a, b) => a.cost - b.cost);
    const curr = queue.shift();
    const currKey = `${curr.col},${curr.row}`;
    if (curr.cost > distMap[currKey]) continue;

    for (const nb of getNeighbors(curr.col, curr.row)) {
      const nbKey = `${nb.col},${nb.row}`;
      const terrain = STATE.terrainMap[nbKey] || 'normal';
      if (terrain === 'wall') continue;

      const occ = STATE.units.find(u => u.hp > 0 && u.id !== unit.id && u.col === nb.col && u.row === nb.row);
      if (occ) continue;

      let stepMultiplier = 1;
      let nextDiag = curr.diagCount;
      if (nb.diag) {
        nextDiag += 1;
        if (nextDiag % 2 === 0) stepMultiplier = 2;
      }
      if (terrain === 'difficult') stepMultiplier *= 2;

      const stepMeters = scale * stepMultiplier;
      const newCost = curr.cost + stepMeters;

      if (newCost <= maxMeters && (distMap[nbKey] === undefined || newCost < distMap[nbKey])) {
        distMap[nbKey] = newCost;
        queue.push({ col: nb.col, row: nb.row, cost: newCost, diagCount: nextDiag });
      }
    }
  }

  const result = {};
  for (const [key, meters] of Object.entries(distMap)) {
    if (key === startKey) continue;
    let actionsNeeded = 1;
    if (meters > unit.moveSpeed * 2) actionsNeeded = 3;
    else if (meters > unit.moveSpeed) actionsNeeded = 2;

    result[key] = {
      meters,
      actionsNeeded,
      canAfford: actionsNeeded <= unit.actions
    };
  }
  return result;
}

/* ============================================================================
   10. RANGE & SPELL AREA CALCULATORS
   ============================================================================ */
function computeCellsInReach(originCol, originRow, reachMeters, includeOrigin = false) {
  const cells = [];
  for (let r = 0; r < STATE.grid.rows; r++) {
    for (let c = 0; c < STATE.grid.cols; c++) {
      if (c === originCol && r === originRow) {
        if (includeOrigin) cells.push({ col: c, row: r });
        continue;
      }
      if (reachMeters <= STATE.grid.cellScale) {
        if (isAdjacentCell(originCol, originRow, c, r)) {
          cells.push({ col: c, row: r });
        }
      } else {
        const d = cellDistanceMeters(originCol, originRow, c, r);
        if (d <= reachMeters) {
          cells.push({ col: c, row: r });
        }
      }
    }
  }
  return cells;
}

function computeLineCells(originCol, originRow, targetCol, targetRow, lengthMeters) {
  const origPx = getCellPixelCenter(originCol, originRow);
  const targPx = getCellPixelCenter(targetCol, targetRow);
  const angleRad = Math.atan2(targPx.y - origPx.y, targPx.x - origPx.x);
  const s = STATE.camera.basePx * STATE.camera.zoom;
  const maxPx = (lengthMeters / STATE.grid.cellScale) * s;

  const affected = [];
  const ux = Math.cos(angleRad);
  const uy = Math.sin(angleRad);

  for (let r = 0; r < STATE.grid.rows; r++) {
    for (let c = 0; c < STATE.grid.cols; c++) {
      if (c === originCol && r === originRow) continue;
      const distM = cellDistanceMeters(originCol, originRow, c, r);
      if (distM > lengthMeters) continue;

      const cellPx = getCellPixelCenter(c, r);
      const dx = cellPx.x - origPx.x;
      const dy = cellPx.y - origPx.y;
      const proj = dx * ux + dy * uy;
      const perp = Math.abs(-dx * uy + dy * ux);
      if (proj >= 0 && proj <= maxPx + s * 0.25 && perp <= s * 0.48) {
        affected.push({ col: c, row: r });
      }
    }
  }
  return { affected, angleRad };
}

function computeBurstCells(centerCol, centerRow, radiusMeters) {
  const affected = [];
  for (let r = 0; r < STATE.grid.rows; r++) {
    for (let c = 0; c < STATE.grid.cols; c++) {
      const d = cellDistanceMeters(centerCol, centerRow, c, r);
      if (d <= radiusMeters) {
        affected.push({ col: c, row: r });
      }
    }
  }
  return affected;
}

