/* ============================================================================
   11b. DIREÇÃO DAS PEÇAS — alça de giro no próprio token
   A peça selecionada (montagem) ou a peça da vez (combate) mostra uma alça
   redonda na borda, apontando para onde ela está virada. Arrastar a alça gira
   a peça (em passos de 45° no quadriculado, 30° no hexágono; Shift = livre);
   um toque na alça gira um passo no sentido horário.
   ============================================================================ */

/** Passo de giro da grade atual. */
function facingStep() {
  return STATE.grid.type === 'square' ? 45 : 30;
}

/** A arte do token gira junto? Só a vista de cima (do app ou extra); chibi, retratos e imagens próprias ganham uma seta na borda. */
function tokenArtRotates(unit) {
  if (unit.customTokenDataUrl) return false;
  const key = effectiveTokenKey(unit.sculpt);
  if (isExtraToken(key)) return EXTRA_TOKENS[key].kind === 'topo';
  return activeTokenStyle === 'topo' || activeTokenStyle === 'celtopo';
}

/** Vetor unitário de tela para onde a peça aponta (0° = sul). */
function facingVector(deg) {
  const a = normalizeFacing(deg) * Math.PI / 180;
  return { x: -Math.sin(a), y: Math.cos(a) };
}

/** Peça que pode ser girada agora (e por isso mostra a alça). */
function facingControlUnit() {
  if (STATE.ruler.active) return null;
  const id = STATE.mode === 'combat' ? STATE.combat.activeUnitId : STATE.selectedUnitId;
  const unit = STATE.units.find(u => u.id === id);
  if (!unit || (STATE.mode === 'combat' && unit.hp <= 0)) return null;
  return unit;
}

/** Vira a peça para uma célula (mover, atacar, lançar). Mesma célula: não muda. */
function faceTowardCell(unit, col, row) {
  if (!unit || (unit.col === col && unit.row === row)) return;
  const a = getCellPixelCenter(unit.col, unit.row);
  const b = getCellPixelCenter(col, row);
  unit.facing = facingFromVector(b.x - a.x, b.y - a.y);
}

/** Seta discreta na borda, para tokens cuja arte não gira. */
function drawFacingMarker(unit, center, tokenR) {
  const v = facingVector(unit.facing);
  const n = { x: -v.y, y: v.x };
  const tip = { x: center.x + v.x * (tokenR + 7), y: center.y + v.y * (tokenR + 7) };
  const base = { x: center.x + v.x * (tokenR - 1), y: center.y + v.y * (tokenR - 1) };
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(tip.x, tip.y);
  ctx.lineTo(base.x + n.x * 6, base.y + n.y * 6);
  ctx.lineTo(base.x - n.x * 6, base.y - n.y * 6);
  ctx.closePath();
  ctx.fillStyle = unit.faction === 'villain' ? '#c0392b' : '#e6b95f';
  ctx.strokeStyle = '#1a120c';
  ctx.lineWidth = 1.4;
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/** Desenha a alça de giro da peça controlável e guarda a posição para o clique. */
function drawFacingHandle() {
  STATE.interaction.facingHandle = null;
  const unit = facingControlUnit();
  if (!unit) return;
  const center = getCellPixelCenter(unit.col, unit.row);
  const s = STATE.camera.basePx * STATE.camera.zoom;
  const tokenR = s * 0.46;
  // a alça fica sobre a borda do token, dentro da própria célula: não cobre a peça vizinha
  const r = Math.max(7, Math.min(12, s * 0.13));
  const dist = tokenR + r * 0.6;
  const v = facingVector(unit.facing);
  const hx = center.x + v.x * dist;
  const hy = center.y + v.y * dist;
  const rotating = STATE.interaction.rotatingUnitId === unit.id;

  ctx.save();
  // trilho: círculo tracejado por onde a alça corre
  ctx.beginPath();
  ctx.arc(center.x, center.y, dist, 0, Math.PI * 2);
  ctx.strokeStyle = rotating ? 'rgba(230, 185, 95, 0.85)' : 'rgba(230, 185, 95, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([3, 5]);
  ctx.stroke();
  ctx.setLineDash([]);
  // haste do token até a alça
  ctx.beginPath();
  ctx.moveTo(center.x + v.x * (tokenR + 2), center.y + v.y * (tokenR + 2));
  ctx.lineTo(hx - v.x * r, hy - v.y * r);
  ctx.strokeStyle = 'rgba(26, 18, 12, 0.7)';
  ctx.lineWidth = 2;
  ctx.stroke();
  // botão
  ctx.beginPath();
  ctx.arc(hx, hy, r + (rotating ? 2 : 0), 0, Math.PI * 2);
  ctx.fillStyle = rotating ? '#f3d27a' : '#e6b95f';
  ctx.strokeStyle = '#2b1b17';
  ctx.lineWidth = 2;
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 1.5;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.stroke();
  // seta dentro do botão, apontando para fora
  const n = { x: -v.y, y: v.x };
  const k = r * 0.55;
  ctx.beginPath();
  ctx.moveTo(hx + v.x * k, hy + v.y * k);
  ctx.lineTo(hx - v.x * k * 0.6 + n.x * k, hy - v.y * k * 0.6 + n.y * k);
  ctx.lineTo(hx - v.x * k * 0.6 - n.x * k, hy - v.y * k * 0.6 - n.y * k);
  ctx.closePath();
  ctx.fillStyle = '#2b1b17';
  ctx.fill();
  ctx.restore();

  STATE.interaction.facingHandle = { unitId: unit.id, x: hx, y: hy, r, cx: center.x, cy: center.y, dist, cell: s };
}

/** O ponto (coordenadas do canvas) está sobre a alça? Toque tem área maior. */
function hitFacingHandle(pt, isTouch) {
  const h = STATE.interaction.facingHandle;
  if (!h) return null;
  // área de toque maior, mas nunca além de ~3/4 da célula (a vizinha continua clicável)
  const reach = Math.min(h.r + (isTouch ? 14 : 4), Math.max(h.r, h.cell * 0.78 - h.dist));
  return Math.hypot(pt.x - h.x, pt.y - h.y) <= reach ? h : null;
}

function startFacingDrag(pt, isTouch) {
  const h = hitFacingHandle(pt, isTouch);
  if (!h) return false;
  const unit = STATE.units.find(u => u.id === h.unitId);
  if (!unit) return false;
  STATE.interaction.rotatingUnitId = unit.id;
  STATE.interaction.rotateStart = { x: pt.x, y: pt.y, facing: normalizeFacing(unit.facing), moved: false };
  hideUnitTip();
  requestRender();
  return true;
}

function updateFacingDrag(pt, free) {
  const unit = STATE.units.find(u => u.id === STATE.interaction.rotatingUnitId);
  const st = STATE.interaction.rotateStart;
  if (!unit || !st) return;
  if (!st.moved && Math.hypot(pt.x - st.x, pt.y - st.y) < 4) return;
  st.moved = true;
  const c = getCellPixelCenter(unit.col, unit.row);
  const raw = facingFromVector(pt.x - c.x, pt.y - c.y);
  unit.facing = free ? raw : snapFacing(raw, facingStep());
  requestRender();
}

function endFacingDrag() {
  const unit = STATE.units.find(u => u.id === STATE.interaction.rotatingUnitId);
  const st = STATE.interaction.rotateStart;
  STATE.interaction.rotatingUnitId = null;
  STATE.interaction.rotateStart = null;
  if (!unit || !st) return;
  // toque sem arrastar: um passo no sentido horário
  if (!st.moved) unit.facing = snapFacing(normalizeFacing(unit.facing) + facingStep(), facingStep());
  if (STATE.mode === 'combat' && normalizeFacing(unit.facing) !== st.facing) {
    addLog(`🧭 <strong>${escapeHtml(unit.name)}</strong> virou para o ${facingLabel(unit.facing)}.`);
  }
  requestRender();
}

/** Gira a peça controlável um passo por teclado (Q anti-horário, E horário). */
function rotateControlledUnit(dir) {
  const unit = facingControlUnit();
  if (!unit) return;
  unit.facing = snapFacing(normalizeFacing(unit.facing) + dir * facingStep(), facingStep());
  requestRender();
}
