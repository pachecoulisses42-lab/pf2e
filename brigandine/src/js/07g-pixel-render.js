/* ============================================================================
   11g. PIXEL ART NO TABULEIRO — quadros das folhas "Pixel Tokens v2"
   Parado em ciclo; andar enquanto a peça caminha; ataque durante a animação da
   ação (arma, magia); atingido no impacto; morte toca uma vez e fica no último
   quadro. Pixels nítidos (sem suavização), pés alinhados no disco da facção.
   ============================================================================ */
const PIXEL_FPS = 8;
const PIXEL_REF_HEIGHT = 98; // altura (px da folha) da figura mais alta: as demais ficam proporcionais

function unitIsPixel(unit) {
  return !!unit && !unit.customTokenDataUrl && isPixelToken(unit.sculpt);
}

/** Linha da folha e quadro (0–7) que a peça mostra agora. */
function unitPixelFrame(unit, now, isDead) {
  const t = PIXEL_TOKENS[unit.sculpt];
  const row = (name) => Math.max(0, t.rows.indexOf(name));
  const loop = (seconds) => Math.floor(seconds * PIXEL_FPS) % 8;
  const a = typeof ANIM !== 'undefined' ? ANIM.current : null;
  const tg = a && a.targets.find(x => x.id === unit.id);
  const since = a && a.impacted ? (now - a.impactTime) / 1000 : -1;
  if (isDead) {
    // morreu agora: toca a morte uma vez; depois fica caído no último quadro
    if (tg && tg.hit && since >= 0 && since < 1) return { row: row('death'), frame: Math.min(7, Math.floor(since * PIXEL_FPS)) };
    return { row: row('death'), frame: 7 };
  }
  const w = T3D_RUNTIME.walks.get(unit.id);
  if (w) return { row: row('walk'), frame: loop((now - w.start) / 1000) };
  if (a && a.from && a.from.id === unit.id && (a.family === 'weapon' || a.family === 'spell')) {
    const k = Math.max(0, Math.min(0.999, (now - a.start) / a.duration));
    return { row: row('attack'), frame: Math.floor(k * 8) };
  }
  if (tg && tg.hit && since >= 0 && since < 1 && (!a.from || a.from.id !== unit.id)) return { row: row('hit'), frame: Math.min(7, Math.floor(since * PIXEL_FPS)) };
  const phase = (parseInt(hashString(unit.id), 36) % 1000) / 160;
  const live = typeof t3dLive === 'function' ? t3dLive() : true;
  return { row: row('idle'), frame: live ? loop(now / 1000 + phase) : 0 };
}

/** Desenha a peça em pixel art: disco da facção e o quadro atual, pés no centro de baixo do disco. */
function drawUnitPixel(unit, center, tokenR, isDead) {
  const t = PIXEL_TOKENS[unit.sculpt];
  const img = pixelSheetImage(unit.sculpt);
  ctx.save();
  ctx.beginPath();
  ctx.arc(center.x, center.y, tokenR * 0.9, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(12, 10, 8, 0.28)';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = isDead ? 'rgba(120, 120, 120, 0.7)' : (T3D_FACTION_RING[unit.faction] || T3D_FACTION_RING.hero);
  ctx.stroke();
  if (img.complete && img.naturalWidth) {
    const { row, frame } = unitPixelFrame(unit, performance.now(), isDead);
    const scale = (tokenR * 1.75) / PIXEL_REF_HEIGHT;
    const feetX = (t.box[0] + t.box[2]) / 2;
    const feetY = t.box[3];
    const size = t.frame * scale;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.ellipse(center.x, center.y + tokenR * 0.62, tokenR * 0.45, tokenR * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.drawImage(img, frame * t.frame, row * t.frame, t.frame, t.frame,
      center.x - feetX * scale, center.y + tokenR * 0.62 - feetY * scale, size, size);
  }
  ctx.restore();
}
