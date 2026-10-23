/* ============================================================================
   11e. TOKENS 3D NO TABULEIRO — desenho, caminhada e gestos
   A peça 3D fica em pé sobre um disco da facção e gira com a direção da peça.
   Movimento: parado (sempre), andar (ao mover no combate), atacar / magia / item
   (acompanham a animação da ação em 07d). Só visual: as regras não mudam.
   ============================================================================ */

const T3D_RUNTIME = { walks: new Map(), timer: 0 };
const T3D_FACTION_RING = { hero: '#f5d27a', villain: '#ef4444' };
const T3D_FRAME_MS = 40; // ~25 quadros por segundo enquanto houver peça 3D no tabuleiro

function unitIs3D(unit) {
  return !!unit && !unit.customTokenDataUrl && is3DToken(unit.sculpt);
}

function t3dLive() {
  return typeof animationsEnabled === 'function' ? animationsEnabled() : true;
}

/** Caminhada visual da casa antiga até a atual (a regra já moveu a peça). */
function startUnitWalk(unit, fromCol, fromRow) {
  if (!(unitIs3D(unit) || unitIsPixel(unit)) || !t3dLive() || (fromCol === unit.col && fromRow === unit.row)) return;
  const cells = cellDistanceMeters(fromCol, fromRow, unit.col, unit.row) / (STATE.grid.cellScale || 1.5);
  const duration = Math.max(320, Math.min(2200, cells * 300));
  T3D_RUNTIME.walks.set(unit.id, { fromCol, fromRow, start: performance.now(), duration });
  requestRender();
}

/** Deslocamento (px) da caminhada em andamento; null quando parada. */
function unitWalkOffset(unit) {
  const w = T3D_RUNTIME.walks.get(unit.id);
  if (!w) return null;
  const k = (performance.now() - w.start) / w.duration;
  if (k >= 1 || !t3dLive()) { T3D_RUNTIME.walks.delete(unit.id); return null; }
  const from = getCellPixelCenter(w.fromCol, w.fromRow);
  const to = getCellPixelCenter(unit.col, unit.row);
  const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
  return { x: (from.x - to.x) * (1 - e), y: (from.y - to.y) * (1 - e) };
}

/** Qual movimento a peça faz agora e em que instante dele. */
function unit3DMotion(unit, now) {
  const w = T3D_RUNTIME.walks.get(unit.id);
  if (w) return { anim: 'walk', t: (now - w.start) / 1000 };
  const a = typeof ANIM !== 'undefined' ? ANIM.current : null;
  if (a && a.from && a.from.id === unit.id) {
    const k = Math.max(0, Math.min(0.999, (now - a.start) / a.duration));
    if (a.family === 'weapon') return { anim: 'attack', t: k * 1.1 };
    if (a.family === 'spell') return { anim: 'cast', t: k * 1.4, color: a.color };
    if (a.kind === 'heal' || a.kind === 'light') return { anim: 'item', t: k * 1.4 };
  }
  if (a && a.impacted && T3D_TOKENS[unit.sculpt] && T3D_TOKENS[unit.sculpt].attack === 'proto') {
    const tg = a.targets.find(x => x.id === unit.id && x.hit);
    const since = (now - a.impactTime) / 1000;
    if (tg && since < 0.6) return { anim: 'hit', t: since };
  }
  // fase própria por peça: não respiram todas juntas
  const phase = (parseInt(hashString(unit.id), 36) % 1000) / 160;
  return { anim: 'idle', t: t3dLive() ? now / 1000 + phase : phase };
}

function t3dGlow(x, y, r, color, alpha) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(color, alpha));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

/** Desenha a peça 3D: disco da facção, sombra e o boneco virado para onde a peça aponta. */
function drawUnit3D(unit, center, tokenR, isDead) {
  const key = unit.sculpt;
  const model = t3dModel(key);
  const cfg = T3D_TOKENS[key];
  const now = performance.now();
  ctx.save();
  // disco da facção
  ctx.beginPath();
  ctx.arc(center.x, center.y, tokenR * 0.9, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(12, 10, 8, 0.32)';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = isDead ? 'rgba(120, 120, 120, 0.7)' : (T3D_FACTION_RING[unit.faction] || T3D_FACTION_RING.hero);
  ctx.stroke();
  const feetY = center.y + tokenR * 0.62;
  const scale = tokenR * 1.08;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.ellipse(center.x, feetY, scale * 0.42, scale * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();

  const yaw = -normalizeFacing(unit.facing || 0) * Math.PI / 180;
  if (isDead) {
    ctx.filter = 'grayscale(100%) brightness(55%)';
    if (model.style === 'proto') {
      // o guerreiro do protótipo tem a própria animação de morte (tomba sobre a base)
      const D = t3dPose('dead', 9, model.style);
      t3dDraw(ctx, model, { x: center.x, y: feetY, scale, yaw, ...D });
    } else {
      const { pose } = t3dPose('idle', 0, model.style);
      pose.root = [-1.45, 0, 0];
      t3dDraw(ctx, model, { x: center.x, y: feetY, scale, yaw, pose, rootOffset: [0, 0.16, 0] });
    }
    ctx.restore();
    return;
  }
  const m = unit3DMotion(unit, now);
  const { pose, rootOffset, flags, offsets } = t3dPose(m.anim, m.t, model.style);
  const anchors = t3dDraw(ctx, model, { x: center.x, y: feetY, scale, yaw, pose, rootOffset, flags, offsets });
  if (flags.includes('cast')) {
    const pulse = 0.5 + 0.5 * Math.sin(now / 90);
    for (const h of ['handL', 'handR']) if (anchors[h]) t3dGlow(anchors[h].x, anchors[h].y, scale * (0.18 + 0.08 * pulse), m.color || '#c084fc', 0.85);
  } else if (cfg.flameHand === 'always' && anchors.handL) {
    t3dGlow(anchors.handL.x, anchors.handL.y, scale * 0.16, '#ff9a3c', 0.55);
  }
  if (flags.includes('item') && anchors.handR) t3dGlow(anchors.handR.x, anchors.handR.y, scale * 0.12, '#ef4444', 0.45);
  ctx.restore();
}

/** Mantém o tabuleiro desenhando enquanto houver peça 3D viva (respiração, caminhada). */
function scheduleT3DFrame() {
  if (T3D_RUNTIME.timer || !t3dLive()) return;
  if (!STATE.units.some(u => unitIs3D(u) || unitIsPixel(u))) return;
  T3D_RUNTIME.timer = setTimeout(() => { T3D_RUNTIME.timer = 0; requestRender(); }, T3D_FRAME_MS);
}
