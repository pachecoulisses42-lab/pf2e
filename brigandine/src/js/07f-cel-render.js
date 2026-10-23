/* ============================================================================
   11f. CEL-SHADED NO TABULEIRO — estilos "Cel frente" e "Cel de cima"
   Cada token tem um boneco cel-shaded (00o). As atividades têm 8 quadros:
   parado, andar, ataque, magia, poção, pergaminho, atingido (e caído). Os quadros
   são desenhados uma vez e guardados; a frente espelha conforme o lado para onde
   a peça olha, a vista de cima gira com a direção da peça.
   ============================================================================ */

const CEL_STYLES = ['cel', 'celtopo'];
const CEL_FRAMES = 8;
const CEL_SPRITES = new Map();
const CEL_SPRITE_LIMIT = 900;
const CEL_THUMBS = {};

function celStyleActive() {
  return CEL_STYLES.includes(activeTokenStyle);
}

/** Boneco cel da peça (null com imagem própria ou sem boneco). */
function unitCelKey(unit) {
  if (!unit || unit.customTokenDataUrl) return null;
  return celCharKey(unit.sculpt);
}

function unitUsesCel(unit) {
  return celStyleActive() && !!unitCelKey(unit);
}

/** Ângulo de câmera da vista frontal: humanoides em 3/4; quadrúpedes de lado. */
function celFrontYaw(model) {
  return model.kind === 'quad' ? -1.3 : -0.45;
}

/** Desenha um quadro num canvas próprio (cache). view: 'front' | 'top'. */
function celSprite(key, view, anim, frame, px) {
  const id = `${key}|${view}|${anim}|${frame}|${px}`;
  let c = CEL_SPRITES.get(id);
  if (c) return c;
  if (CEL_SPRITES.size > CEL_SPRITE_LIMIT) CEL_SPRITES.clear();
  const model = celModel(key);
  const cfg = celCharConfig(key);
  const top = view === 'top';
  const w = Math.ceil(px * (top ? 1.9 : 1.7));
  const h = Math.ceil(px * (top ? 1.9 : 2.1));
  c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  const scale = px * (top ? 0.46 : 0.44);
  const feet = { x: w / 2, y: top ? h / 2 : h - px * 0.3 };
  let pose, rootOffset, flags;
  if (anim === 'dead') {
    ({ pose, rootOffset, flags } = t3dPose('idle', 0, model.style));
    pose = { ...pose, [model.kind === 'quad' ? 'body' : 'root']: model.kind === 'quad' ? [0, 0, 1.4] : [-1.45, 0, 0] };
    rootOffset = model.kind === 'quad' ? [0, -0.25, 0] : [0, 0.16, 0];
    g.filter = 'grayscale(100%) brightness(60%)';
  } else {
    ({ pose, rootOffset, flags } = t3dPose(anim, (frame + 0.5) / CEL_FRAMES * T3D_CYCLE[anim], model.style));
  }
  const anchors = t3dDraw(g, model, {
    x: feet.x, y: feet.y, scale, yaw: top ? Math.PI / 2 : celFrontYaw(model), elev: (top ? 90 : 16) * T3D_DEG,
    pose, rootOffset, flags, cel: true, flash: flags.includes('hitFlash') ? 0.5 : 0
  });
  g.filter = 'none';
  const glowAt = (p, r, color) => {
    const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
    gr.addColorStop(0, rgba(color, 0.9));
    gr.addColorStop(1, rgba(color, 0));
    g.fillStyle = gr;
    g.beginPath(); g.arc(p.x, p.y, r, 0, Math.PI * 2); g.fill();
  };
  if (flags.includes('cast')) {
    const col = cfg.flameHand ? '#ff9a3c' : (cfg.glowColor || '#c084fc');
    for (const hnd of ['handL', 'handR', 'head']) if (anchors[hnd]) glowAt(anchors[hnd], scale * (hnd === 'head' ? 0.35 : 0.3), col);
  }
  if (flags.includes('scrollGlow') && anchors.handL && anchors.handR) {
    glowAt({ x: (anchors.handL.x + anchors.handR.x) / 2, y: (anchors.handL.y + anchors.handR.y) / 2 }, scale * 0.5, '#fde68a');
  }
  CEL_SPRITES.set(id, c);
  return c;
}

/** Miniatura (frente, parado) para galerias e seletores. */
function celThumbnail(key) {
  const id = `${activeTokenStyle}:${key}`;
  if (CEL_THUMBS[id]) return CEL_THUMBS[id];
  if (typeof document === 'undefined') return '';
  CEL_THUMBS[id] = celCropToSquare(celSprite(key, activeTokenStyle === 'celtopo' ? 'top' : 'front', 'idle', 2, 96)).toDataURL('image/png');
  return CEL_THUMBS[id];
}

/** Recorta o boneco (área não transparente) num quadrado com pouca margem. */
function celCropToSquare(src) {
  const g = src.getContext('2d');
  const { data, width, height } = g.getImageData(0, 0, src.width, src.height);
  let x0 = width, y0 = height, x1 = -1, y1 = -1;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (data[(y * width + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  if (x1 < 0) return src;
  const side = Math.max(x1 - x0, y1 - y0) + 8;
  const out = document.createElement('canvas');
  out.width = out.height = side;
  out.getContext('2d').drawImage(src, x0, y0, x1 - x0 + 1, y1 - y0 + 1, (side - (x1 - x0)) / 2, (side - (y1 - y0)) / 2, x1 - x0 + 1, y1 - y0 + 1);
  return out;
}

/** Qual atividade e qual dos 8 quadros a peça mostra agora. */
function unitCelFrame(unit, now) {
  const w = T3D_RUNTIME.walks.get(unit.id);
  const cycleFrame = (anim, seconds) => Math.floor(((seconds % T3D_CYCLE[anim]) / T3D_CYCLE[anim]) * CEL_FRAMES) % CEL_FRAMES;
  if (w) return { anim: 'walk', frame: cycleFrame('walk', (now - w.start) / 1000) };
  const a = typeof ANIM !== 'undefined' ? ANIM.current : null;
  if (a) {
    const k = Math.max(0, Math.min(0.999, (now - a.start) / a.duration));
    const f = Math.floor(k * CEL_FRAMES);
    if (a.from && a.from.id === unit.id) {
      if (a.family === 'weapon') return { anim: 'attack', frame: f };
      if (a.family === 'spell') return { anim: a.scroll ? 'scroll' : 'cast', frame: f };
      if (a.kind === 'heal' || a.kind === 'light') return { anim: 'item', frame: f };
    }
    const tg = a.targets.find(t => t.id === unit.id);
    if (tg && tg.hit && a.impacted && (!a.from || a.from.id !== unit.id)) {
      const since = (now - a.impactTime) / 1000;
      if (since < T3D_CYCLE.hit) return { anim: 'hit', frame: Math.floor(since / T3D_CYCLE.hit * CEL_FRAMES) };
    }
  }
  const live = typeof t3dLive === 'function' ? t3dLive() : true;
  const phase = (parseInt(hashString(unit.id), 36) % 1000) / 160;
  return { anim: 'idle', frame: live ? cycleFrame('idle', now / 1000 + phase) : 2 };
}

/** Desenha a peça no estilo cel: disco da facção e o quadro da atividade atual. */
function drawUnitCel(unit, center, tokenR, isDead) {
  const key = unitCelKey(unit);
  const top = activeTokenStyle === 'celtopo';
  const px = Math.max(16, Math.round(tokenR * 2 / 6) * 6);
  ctx.save();
  ctx.beginPath();
  ctx.arc(center.x, center.y, tokenR * 0.9, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(12, 10, 8, 0.28)';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = isDead ? 'rgba(120, 120, 120, 0.7)' : (T3D_FACTION_RING[unit.faction] || T3D_FACTION_RING.hero);
  ctx.stroke();
  const { anim, frame } = isDead ? { anim: 'dead', frame: 0 } : unitCelFrame(unit, performance.now());
  const img = celSprite(key, top ? 'top' : 'front', anim, frame, px);
  if (top) {
    const v = facingVector(unit.facing || 0);
    ctx.translate(center.x, center.y);
    ctx.rotate(Math.atan2(v.y, v.x));
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
  } else {
    const feetY = center.y + tokenR * 0.62;
    ctx.translate(center.x, feetY);
    if (facingVector(unit.facing || 0).x < -0.2) ctx.scale(-1, 1);
    ctx.drawImage(img, -img.width / 2, -(img.height - px * 0.3));
  }
  ctx.restore();
}
