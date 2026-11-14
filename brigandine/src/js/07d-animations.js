/* ============================================================================
   11d. ANIMAÇÕES — motor e desenhos (ataques, magias e itens)
   As regras resolvem tudo na hora; a animação só mostra. Enquanto ela toca, os
   números flutuantes e a barra de PV no tabuleiro esperam o "impacto". Um clique
   no tabuleiro pula. Ver docs/PLANO-ANIMACOES.md.
   ============================================================================ */

const ANIM = {
  on: true,            // preferência do usuário (botão na barra do tabuleiro)
  collecting: null,    // textos flutuantes segurados durante a resolução
  spec: null,          // animação pedida pela ação em resolução
  hpBefore: null,
  current: null,       // animação tocando
  hpShown: new Map(),  // PV exibido no tabuleiro até o impacto
  particles: [],
  lastFrame: 0,
  fallback: 0
};
const ANIM_MAX_PARTICLES = 300;

function prefersReducedMotion() {
  try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; }
}

function animationsEnabled() {
  return ANIM.on && !prefersReducedMotion();
}

function setAnimationsEnabled(on, persist = true) {
  ANIM.on = !!on;
  if (!ANIM.on) finishAnimation();
  if (persist && typeof savePrefs === 'function') savePrefs({ animations: ANIM.on });
  const btn = document.getElementById('btnHudAnim');
  if (btn) {
    btn.classList.toggle('active', ANIM.on);
    btn.setAttribute('aria-pressed', String(ANIM.on));
    btn.title = ANIM.on ? 'Animações ligadas (clique no tabuleiro pula)' : 'Animações desligadas';
  }
}

function toggleAnimations() {
  setAnimationsEnabled(!ANIM.on);
}

/* ---------------- Captura: a ação resolve, a animação mostra ---------------- */

/**
 * Roda uma ação de combate segurando os textos flutuantes e o PV exibido até o impacto.
 * Ações aninhadas (pergaminho → magia) usam a captura de fora.
 */
function withAnimation(fn) {
  if (!animationsEnabled() || ANIM.collecting) return fn();
  finishAnimation();
  ANIM.collecting = [];
  ANIM.spec = null;
  ANIM.hpBefore = new Map(STATE.units.map(u => [u.id, u.hp]));
  let result;
  try {
    result = fn();
  } finally {
    const texts = ANIM.collecting;
    const spec = ANIM.spec;
    const hpBefore = ANIM.hpBefore;
    ANIM.collecting = null;
    ANIM.spec = null;
    ANIM.hpBefore = null;
    if (spec) startAnimation(spec, texts, hpBefore);
    else texts.forEach(args => spawnFloatingText(...args));
  }
  return result;
}

/** Chamado pelas regras quando a ação de fato acontece. Sem captura (desligado), não faz nada. */
function setAnimSpec(spec) {
  if (!ANIM.collecting) return;
  ANIM.spec = {
    ...spec,
    from: spec.from ? { id: spec.from.id, col: spec.from.col, row: spec.from.row } : null,
    targets: (spec.targets || []).map(t => ({ id: t.unit.id, col: t.unit.col, row: t.unit.row, hit: !!t.hit }))
  };
}

/** Segura o texto flutuante enquanto há captura. Devolve true se segurou. */
function holdFloatingText(args) {
  if (!ANIM.collecting) return false;
  ANIM.collecting.push(args);
  return true;
}

function startAnimation(spec, texts, hpBefore) {
  const duration = animDurationMs(spec.kind, spec.family);
  ANIM.current = {
    ...spec,
    color: spec.color || '#e2e8f0',
    texts,
    start: performance.now(),
    duration,
    impactAt: animImpactAt(spec.kind),
    impacted: false,
    impactTime: 0,
    seed: Math.random() * 1000
  };
  ANIM.particles = [];
  ANIM.lastFrame = 0;
  ANIM.hpShown.clear();
  for (const u of STATE.units) {
    if (hpBefore.has(u.id) && hpBefore.get(u.id) !== u.hp) ANIM.hpShown.set(u.id, hpBefore.get(u.id));
  }
  clearTimeout(ANIM.fallback);
  // garante o fim mesmo sem quadros (aba em segundo plano)
  ANIM.fallback = setTimeout(finishAnimation, duration + 400);
  requestRender();
}

function animationPlaying() {
  return !!ANIM.current;
}

/** Pula/termina: aplica o impacto que faltar e limpa a camada. */
function finishAnimation() {
  const a = ANIM.current;
  if (!a) return;
  if (!a.impacted) animImpact(a, performance.now());
  ANIM.current = null;
  ANIM.particles = [];
  ANIM.hpShown.clear();
  clearTimeout(ANIM.fallback);
  requestRender();
}

function animImpact(a, now) {
  a.impacted = true;
  a.impactTime = now;
  ANIM.hpShown.clear();
  a.texts.forEach(args => spawnFloatingText(...args));
  a.texts = [];
  const f = animFrame(a, now);
  if (f) (ANIM_IMPACTS[a.kind] || ANIM_IMPACTS.default)(f);
}

/** PV mostrado no tabuleiro (o anterior até o impacto). */
function displayHp(unit) {
  return ANIM.hpShown.has(unit.id) ? ANIM.hpShown.get(unit.id) : unit.hp;
}

/* ---------------- Utilidades de desenho ---------------- */

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const animSeg = (t, a, b) => clamp01((t - a) / (b - a));
const easeOut = (k) => 1 - Math.pow(1 - k, 3);
const easeIn = (k) => k * k * k;
const animLerp = (a, b, k) => a + (b - a) * k;
const lerpPt = (p, q, k) => ({ x: animLerp(p.x, q.x, k), y: animLerp(p.y, q.y, k) });
const bump = (k) => Math.sin(Math.PI * clamp01(k)); // 0 → 1 → 0

function rgba(hex, a) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${Math.max(0, Math.min(1, a))})`;
}

/** Pseudoaleatório estável por animação (o raio não "pisca" de forma diferente a cada quadro). */
function animRand(a, i) {
  const x = Math.sin((a.seed + i) * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function glow(x, y, r, color, alpha) {
  if (r <= 0 || alpha <= 0) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(color, alpha));
  g.addColorStop(0.45, rgba(color, alpha * 0.45));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function ring(x, y, r, width, color, alpha) {
  if (r <= 0 || alpha <= 0) return;
  ctx.strokeStyle = rgba(color, alpha);
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
}

function strokeLine(p, q, width, color, alpha, cap = 'round') {
  ctx.strokeStyle = rgba(color, alpha);
  ctx.lineWidth = width;
  ctx.lineCap = cap;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(q.x, q.y);
  ctx.stroke();
}

/** Linha em zigue-zague (raios, faíscas). */
function jaggedPath(p, q, segments, amp, rnd) {
  const pts = [p];
  const dx = q.x - p.x, dy = q.y - p.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  for (let i = 1; i < segments; i++) {
    const k = i / segments;
    const off = (rnd(i) - 0.5) * 2 * amp * Math.sin(Math.PI * k);
    pts.push({ x: p.x + dx * k + nx * off, y: p.y + dy * k + ny * off });
  }
  pts.push(q);
  return pts;
}

function strokePath(pts, width, color, alpha) {
  ctx.strokeStyle = rgba(color, alpha);
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  pts.forEach((pt, i) => (i ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y)));
  ctx.stroke();
}

/** Contorno escuro + cor, no estilo dos tokens. */
function inkStroke(drawPath, width, color, alpha = 1) {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = rgba('#0b0f17', alpha * 0.85);
  ctx.lineWidth = width + 2.5;
  drawPath(); ctx.stroke();
  ctx.strokeStyle = rgba(color, alpha);
  ctx.lineWidth = width;
  drawPath(); ctx.stroke();
}

/* ---------------- Partículas (em unidades de casa, relativas à origem) ---------------- */

function emit(f, n, opts) {
  for (let i = 0; i < n && ANIM.particles.length < ANIM_MAX_PARTICLES; i++) {
    const ang = opts.angle !== undefined ? opts.angle + (Math.random() - 0.5) * (opts.spread ?? Math.PI * 2) : Math.random() * Math.PI * 2;
    const sp = (opts.speed || 2) * (0.4 + Math.random() * 0.8);
    ANIM.particles.push({
      x: opts.x, y: opts.y,
      vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
      g: opts.gravity || 0, drag: opts.drag ?? 1.6,
      life: (opts.life || 0.5) * (0.6 + Math.random() * 0.8), age: 0,
      size: (opts.size || 0.06) * (0.6 + Math.random() * 0.8),
      color: opts.colors ? opts.colors[Math.floor(Math.random() * opts.colors.length)] : (opts.color || f.a.color),
      kind: opts.kind || 'dot',
      rot: Math.random() * Math.PI * 2, vr: (Math.random() - 0.5) * 10
    });
  }
}

/** Ponto em pixels → unidades de casa a partir da origem do quadro. */
function toUnits(f, p) {
  return { x: (p.x - f.A.x) / f.s, y: (p.y - f.A.y) / f.s };
}

function emitAt(f, p, n, opts) {
  const u = toUnits(f, p);
  emit(f, n, { ...opts, x: u.x, y: u.y });
}

function drawParticles(f) {
  const dt = f.dt;
  for (let i = ANIM.particles.length - 1; i >= 0; i--) {
    const p = ANIM.particles[i];
    p.age += dt;
    if (p.age >= p.life) { ANIM.particles.splice(i, 1); continue; }
    const k = Math.exp(-p.drag * dt);
    p.vx *= k; p.vy = p.vy * k + p.g * dt;
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.rot += p.vr * dt;
    const life = 1 - p.age / p.life;
    const x = f.A.x + p.x * f.s, y = f.A.y + p.y * f.s, r = p.size * f.s;
    if (p.kind === 'smoke') {
      glow(x, y, r * (2 - life), p.color, 0.35 * life);
    } else if (p.kind === 'spark') {
      strokeLine({ x, y }, { x: x - p.vx * f.s * 0.04, y: y - p.vy * f.s * 0.04 }, Math.max(1, r * 0.5), p.color, life);
    } else if (p.kind === 'shard') {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(p.rot);
      ctx.fillStyle = rgba(p.color, life);
      ctx.strokeStyle = rgba('#0b0f17', life * 0.7);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -r * 1.6); ctx.lineTo(r * 0.6, 0); ctx.lineTo(0, r * 1.6); ctx.lineTo(-r * 0.6, 0);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
    } else if (p.kind === 'cross') {
      ctx.fillStyle = rgba(p.color, life);
      ctx.fillRect(x - r * 0.3, y - r, r * 0.6, r * 2);
      ctx.fillRect(x - r, y - r * 0.3, r * 2, r * 0.6);
    } else {
      glow(x, y, r * 2.2, p.color, 0.5 * life);
      ctx.fillStyle = rgba(p.color, life);
      ctx.beginPath(); ctx.arc(x, y, Math.max(0.8, r * 0.7), 0, Math.PI * 2); ctx.fill();
    }
  }
}

/* ---------------- Quadro: geometria do momento ---------------- */

function animFrame(a, now) {
  const s = STATE.camera.basePx * STATE.camera.zoom;
  const A = a.from ? getCellPixelCenter(a.from.col, a.from.row) : null;
  const t0 = a.targets[0];
  const B = a.endCell ? getCellPixelCenter(a.endCell.col, a.endCell.row)
    : (t0 ? getCellPixelCenter(t0.col, t0.row) : A);
  if (!A || !B) return null;
  const dx = B.x - A.x, dy = B.y - A.y;
  const dist = Math.hypot(dx, dy) || 1;
  const dir = { x: dx / dist, y: dy / dist };
  const perp = { x: -dir.y, y: dir.x };
  const t = clamp01((now - a.start) / a.duration);
  const center = a.areaCenter ? getCellPixelCenter(a.areaCenter.col, a.areaCenter.row) : B;
  const radius = a.areaRadius ? (a.areaRadius + 0.5) * s : s * 0.6;
  const dt = ANIM.lastFrame ? Math.min(0.05, (now - ANIM.lastFrame) / 1000) : 0;
  return {
    a, now, t, s, A, B, dir, perp, dist, dt, center, radius,
    ang: Math.atan2(dy, dx),
    imp: a.impactAt,
    hit: a.targets.some(x => x.hit),
    since: a.impacted ? (now - a.impactTime) / 1000 : -1,
    targetsPx: a.targets.map(x => ({ ...getCellPixelCenter(x.col, x.row), hit: x.hit })),
    // ponto de passagem quando erra: um pouco além e ao lado do alvo
    missPt: { x: B.x + dir.x * s * 1.1 + perp.x * s * 0.45, y: B.y + dir.y * s * 1.1 + perp.y * s * 0.45 }
  };
}

/** Deslocamento da peça: avanço do atacante corpo a corpo, recuo/esquiva do alvo. */
function animUnitOffset(unit) {
  const a = ANIM.current;
  if (!a) return null;
  const now = performance.now();
  const f = animFrame(a, now);
  if (!f) return null;
  if (a.from && unit.id === a.from.id && ANIM_LUNGE.includes(a.kind) && unit.id !== (a.targets[0] && a.targets[0].id)) {
    const k = f.t < f.imp ? easeOut(f.t / f.imp) : 1 - easeIn(animSeg(f.t, f.imp, Math.min(1, f.imp + 0.35)));
    const amt = f.s * 0.26 * k;
    return { x: f.dir.x * amt, y: f.dir.y * amt };
  }
  const tg = a.targets.find(x => x.id === unit.id);
  if (!tg || (a.from && unit.id === a.from.id)) return null;
  const tp = getCellPixelCenter(tg.col, tg.row);
  const away = f.A ? { x: tp.x - f.A.x, y: tp.y - f.A.y } : { x: 0, y: 0 };
  const len = Math.hypot(away.x, away.y) || 1;
  if (tg.hit && f.since >= 0) {
    const k = Math.max(0, 1 - f.since / 0.3);
    const jitter = Math.sin(f.since * 70) * f.s * 0.04 * k;
    const push = f.s * 0.12 * k;
    return { x: away.x / len * push + jitter, y: away.y / len * push };
  }
  if (!tg.hit && ANIM_DODGE.includes(a.family)) {
    const k = bump(animSeg(f.t, f.imp - 0.2, f.imp + 0.2));
    return { x: -away.y / len * f.s * 0.22 * k, y: away.x / len * f.s * 0.22 * k };
  }
  return null;
}
const ANIM_LUNGE = ['slash', 'thrust', 'bash', 'claw', 'touch', 'shock', 'shadow_hand'];
const ANIM_DODGE = ['weapon', 'spell'];

/** Tremida de tela após o impacto (críticos e explosões). */
function animShakeOffset() {
  const a = ANIM.current;
  if (!a || !a.impacted || !animShakes(a.kind, a.crit)) return null;
  const since = (performance.now() - a.impactTime) / 1000;
  if (since > 0.35) return null;
  const amp = (a.crit ? 6 : 5) * (1 - since / 0.35);
  return { x: Math.sin(since * 95) * amp, y: Math.cos(since * 77) * amp * 0.7 };
}

/** Camada da animação: chamada pelo renderBoard depois das peças. */
function drawAnimationLayer() {
  const a = ANIM.current;
  if (!a) return;
  const now = performance.now();
  const f = animFrame(a, now);
  if (!f) { finishAnimation(); return; }
  if (!a.impacted && f.t >= f.imp) animImpact(a, now);
  ctx.save();
  (ANIM_DRAW[a.kind] || ANIM_DRAW.orb)(f);
  drawParticles(f);
  if (a.crit && a.impacted) drawCritBadge(f);
  ctx.restore();
  ANIM.lastFrame = now;
  if (f.t >= 1) finishAnimation();
  else requestRender();
}

function drawCritBadge(f) {
  const k = clamp01(f.since / 0.5);
  if (k >= 1) return;
  const p = f.targetsPx[0] || f.B;
  ctx.save();
  ctx.globalAlpha = 1 - easeIn(k);
  ctx.font = `900 ${Math.round(f.s * (0.3 + 0.12 * bump(k * 2)))}px Figtree, system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#1a1205';
  ctx.strokeText('CRÍTICO', p.x, p.y - f.s * 0.85);
  ctx.fillStyle = '#facc15';
  ctx.fillText('CRÍTICO', p.x, p.y - f.s * 0.85);
  ctx.restore();
}

/* ---------------- Formas reutilizadas ---------------- */

function drawArrowShape(p, ang, len, width, color, alpha, bolt) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(ang);
  ctx.globalAlpha = alpha;
  inkStroke(() => { ctx.beginPath(); ctx.moveTo(-len, 0); ctx.lineTo(0, 0); }, width, bolt ? '#8b5a2b' : '#c8a26a');
  // ponta
  ctx.fillStyle = '#cbd5e1';
  ctx.strokeStyle = '#0b0f17';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(width * 3.2, 0); ctx.lineTo(-width * 0.8, -width * 1.8); ctx.lineTo(-width * 0.8, width * 1.8);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  // penas
  ctx.fillStyle = bolt ? '#475569' : color;
  for (const sgn of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(-len, 0); ctx.lineTo(-len - width * 2, sgn * width * 2.2); ctx.lineTo(-len + width * 2.5, sgn * width * 0.6);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}

function drawBlade(p, rot, size, color, alpha) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(rot);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.strokeStyle = '#0b0f17';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(size, 0); ctx.lineTo(0, -size * 0.28); ctx.lineTo(-size * 0.55, 0); ctx.lineTo(0, size * 0.28);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#7c4a1e';
  ctx.fillRect(-size * 0.75, -size * 0.1, size * 0.3, size * 0.2);
  ctx.restore();
}

/** Projétil mágico genérico com rastro. */
function drawOrb(f, p, r, color, alpha = 1) {
  glow(p.x, p.y, r * 3, color, 0.55 * alpha);
  glow(p.x, p.y, r * 1.3, '#ffffff', 0.9 * alpha);
}

/** Arco de corte (meia-lua) centrado no alvo. */
function drawSlashArc(f, center, k, color, width) {
  const base = f.ang + Math.PI;
  const start = base - 1.25, sweep = 2.5;
  const head = start + sweep * easeOut(k);
  const tail = Math.max(start, head - 1.4);
  const r = f.s * 0.55;
  for (let i = 0; i < 4; i++) {
    const a0 = tail + (head - tail) * (i / 4);
    ctx.strokeStyle = rgba(i === 3 ? '#ffffff' : color, 0.25 + i * 0.22);
    ctx.lineWidth = width * (0.4 + i * 0.25);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(center.x, center.y, r, a0, head);
    ctx.stroke();
  }
}

function travel(f, t0, t1, ease = (k) => k) {
  return ease(animSeg(f.t, t0, t1));
}

/** Destino do projétil: o alvo, ou o ponto ao lado/além se errou. */
function projectileEnd(f) {
  return f.hit ? f.B : f.missPt;
}

/* ---------------- Desenho por tipo ---------------- */

const ANIM_DRAW = {
  /* ----- armas ----- */
  slash(f) {
    const k = animSeg(f.t, f.imp - 0.16, f.imp + 0.14);
    if (k > 0 && k < 1) {
      const c = f.hit ? f.B : { x: f.B.x + f.perp.x * f.s * 0.35, y: f.B.y + f.perp.y * f.s * 0.35 };
      drawSlashArc(f, c, k, f.a.color, f.s * (f.a.crit ? 0.14 : 0.1));
    }
    if (f.hit && f.since >= 0 && f.since < 0.25) {
      const k2 = f.since / 0.25;
      const half = f.s * 0.5;
      strokeLine({ x: f.B.x - f.perp.x * half - f.dir.x * half * 0.4, y: f.B.y - f.perp.y * half - f.dir.y * half * 0.4 },
        { x: f.B.x + f.perp.x * half + f.dir.x * half * 0.4, y: f.B.y + f.perp.y * half + f.dir.y * half * 0.4 },
        f.s * 0.06 * (1 - k2), '#ffffff', 1 - k2);
    }
  },
  thrust(f) {
    const k = animSeg(f.t, f.imp - 0.2, f.imp);
    const out = animSeg(f.t, f.imp, f.imp + 0.2);
    if (k <= 0 || out >= 1) return;
    const tipEnd = f.hit ? { x: f.B.x - f.dir.x * f.s * 0.1, y: f.B.y - f.dir.y * f.s * 0.1 } : f.missPt;
    const startP = { x: f.A.x + f.dir.x * f.s * 0.35, y: f.A.y + f.dir.y * f.s * 0.35 };
    const tip = lerpPt(startP, tipEnd, easeOut(k));
    const tail = lerpPt(startP, tip, out);
    const alpha = 1 - out;
    const g = ctx.createLinearGradient(tail.x, tail.y, tip.x, tip.y);
    g.addColorStop(0, rgba(f.a.color, 0));
    g.addColorStop(1, rgba('#ffffff', alpha));
    ctx.strokeStyle = g;
    ctx.lineWidth = f.s * 0.09;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(tail.x, tail.y); ctx.lineTo(tip.x, tip.y); ctx.stroke();
    glow(tip.x, tip.y, f.s * 0.18, '#ffffff', alpha * 0.8);
  },
  bash(f) {
    if (f.since < 0) return;
    const k = clamp01(f.since / 0.4);
    const c = f.hit ? f.B : { x: f.B.x + f.perp.x * f.s * 0.4, y: f.B.y + f.perp.y * f.s * 0.4 };
    if (f.hit) {
      ring(c.x, c.y, f.s * (0.2 + 0.55 * easeOut(k)), f.s * 0.08 * (1 - k), '#fff7e6', 1 - k);
      ring(c.x, c.y, f.s * (0.1 + 0.4 * easeOut(k)), f.s * 0.04 * (1 - k), f.a.color, 1 - k);
    }
  },
  claw(f) {
    const k = animSeg(f.t, f.imp - 0.08, f.imp + 0.1);
    const fade = 1 - animSeg(f.t, f.imp + 0.15, 0.9);
    if (k <= 0 || fade <= 0) return;
    const c = f.hit ? f.B : { x: f.B.x + f.perp.x * f.s * 0.4, y: f.B.y + f.perp.y * f.s * 0.4 };
    const diag = { x: f.dir.x * 0.6 + f.perp.x * 0.8, y: f.dir.y * 0.6 + f.perp.y * 0.8 };
    for (let i = -1; i <= 1; i++) {
      const off = { x: -diag.y * i * f.s * 0.14, y: diag.x * i * f.s * 0.14 };
      const p = { x: c.x - diag.x * f.s * 0.35 + off.x, y: c.y - diag.y * f.s * 0.35 + off.y };
      const q = { x: c.x + diag.x * f.s * 0.35 * (2 * k - 1) + off.x, y: c.y + diag.y * f.s * 0.35 * (2 * k - 1) + off.y };
      strokeLine(p, q, f.s * 0.06, f.hit ? '#ef4444' : '#e2e8f0', fade);
      strokeLine(p, q, f.s * 0.02, '#ffffff', fade);
    }
  },
  arrow(f) { drawProjectileArrow(f, false); },
  bolt(f) { drawProjectileArrow(f, true); },
  thrown(f) {
    const k = travel(f, 0.05, f.imp);
    const end = projectileEnd(f);
    if (f.t <= f.imp) {
      const p = lerpPt(f.A, end, k);
      p.y -= Math.sin(Math.PI * k) * Math.min(f.dist * 0.25, f.s * 1.6);
      drawBlade(p, k * Math.PI * 5, f.s * 0.32, '#d1d5db', 1);
    } else if (!f.hit) {
      const k2 = animSeg(f.t, f.imp, f.imp + 0.25);
      const p = { x: end.x + f.dir.x * f.s * 0.3 * k2, y: end.y + f.dir.y * f.s * 0.3 * k2 - Math.sin(Math.PI * k2) * f.s * 0.2 };
      drawBlade(p, Math.PI * 5 + k2 * 4, f.s * 0.32, '#d1d5db', 1 - k2);
    }
  },
  bomb(f) {
    const k = travel(f, 0.05, f.imp);
    const end = projectileEnd(f);
    if (f.t <= f.imp) {
      const p = lerpPt(f.A, end, k);
      p.y -= Math.sin(Math.PI * k) * Math.min(f.dist * 0.3, f.s * 1.8);
      ctx.fillStyle = '#334155'; ctx.strokeStyle = '#0b0f17'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(p.x, p.y, f.s * 0.14, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      glow(p.x - f.s * 0.05, p.y - f.s * 0.05, f.s * 0.12, f.a.color, 0.9);
      glow(p.x + f.s * 0.08, p.y - f.s * 0.16, f.s * 0.1, '#fde047', 0.9);
    } else {
      const k2 = animSeg(f.t, f.imp, f.imp + 0.3);
      glow(end.x, end.y, f.s * (0.4 + 0.6 * k2), f.a.color, 0.8 * (1 - k2));
    }
  },
  shot(f) {
    const muzzle = { x: f.A.x + f.dir.x * f.s * 0.45, y: f.A.y + f.dir.y * f.s * 0.45 };
    const fl = 1 - animSeg(f.t, 0.02, 0.14);
    if (f.t < 0.14) {
      glow(muzzle.x, muzzle.y, f.s * 0.35 * fl, '#fde047', fl);
      glow(muzzle.x, muzzle.y, f.s * 0.15 * fl, '#ffffff', fl);
    }
    const k = animSeg(f.t, 0.05, f.imp + 0.15);
    if (k > 0 && k < 1) strokeLine(muzzle, projectileEnd(f), f.s * 0.035, '#fef3c7', 1 - k);
  },
  energy(f) {
    const k = travel(f, 0.08, f.imp);
    if (f.t <= f.imp) {
      const p = lerpPt(f.A, projectileEnd(f), k);
      drawOrb(f, p, f.s * 0.11, f.a.color);
      if (Math.random() < 0.7) emitAt(f, p, 1, { speed: 0.4, life: 0.35, size: 0.05 });
    }
  },

  /* ----- magias genéricas ----- */
  orb(f) {
    drawCharge(f, 0, 0.22);
    const k = travel(f, 0.2, f.imp, easeIn);
    if (f.t > 0.2 && f.t <= f.imp) {
      const p = lerpPt(f.A, projectileEnd(f), k);
      drawOrb(f, p, f.s * 0.14, f.a.color);
      emitAt(f, p, 2, { speed: 0.5, life: 0.4, size: 0.06 });
    }
  },
  beam(f) {
    drawCharge(f, 0, f.imp);
    const k = animSeg(f.t, f.imp - 0.05, f.imp + 0.05);
    const fade = 1 - animSeg(f.t, 0.7, 0.95);
    if (k > 0 && fade > 0) {
      const end = lerpPt(f.A, f.B, k);
      strokeLine(f.A, end, f.s * 0.3 * fade, f.a.color, 0.35 * fade);
      strokeLine(f.A, end, f.s * 0.12 * fade, '#ffffff', 0.9 * fade);
    }
  },
  explosion(f) {
    drawCharge(f, 0, 0.15);
    const k = travel(f, 0.12, f.imp, easeIn);
    if (f.t > 0.12 && f.t <= f.imp) drawOrb(f, lerpPt(f.A, f.center, k), f.s * 0.13, f.a.color);
    drawBlast(f, f.a.color, '#ffffff');
  },
  touch(f) {
    const k = bump(animSeg(f.t, f.imp - 0.15, f.imp + 0.3));
    if (k <= 0) return;
    const mid = lerpPt(f.A, f.B, 0.6);
    glow(mid.x, mid.y, f.s * 0.5 * k, f.a.color, 0.7 * k);
    if (Math.random() < 0.6) emitAt(f, mid, 2, { speed: 2, life: 0.3, kind: 'spark', size: 0.06 });
  },

  /* ----- magias do catálogo ----- */
  lightning(f) {
    drawCharge(f, 0, 0.22, '#a5d8ff');
    const on = f.t > 0.2 && f.t < 0.7;
    if (on) {
      const tick = Math.floor(f.now / 55);
      const fade = 1 - animSeg(f.t, 0.5, 0.7);
      const rnd = (i) => animRand(f.a, tick * 31 + i);
      const pts = jaggedPath(f.A, f.B, 12, f.s * 0.5, rnd);
      strokePath(pts, f.s * 0.28, '#60a5fa', 0.35 * fade);
      strokePath(pts, f.s * 0.1, '#bfdbfe', 0.9 * fade);
      strokePath(pts, f.s * 0.035, '#ffffff', fade);
      for (let b = 0; b < 3; b++) {
        const from = pts[2 + Math.floor(rnd(50 + b) * 8)];
        const to = { x: from.x + (rnd(60 + b) - 0.5) * f.s * 1.6, y: from.y + (rnd(70 + b) - 0.5) * f.s * 1.6 };
        strokePath(jaggedPath(from, to, 4, f.s * 0.2, (i) => rnd(80 + b * 10 + i)), f.s * 0.03, '#dbeafe', 0.8 * fade);
      }
    }
    if (f.since >= 0 && f.since < 0.25) {
      ctx.fillStyle = rgba('#e0f2fe', 0.22 * (1 - f.since / 0.25));
      ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    }
  },
  fireball(f) {
    drawCharge(f, 0, 0.12, '#ff7a1a');
    const k = travel(f, 0.08, f.imp, easeIn);
    if (f.t > 0.08 && f.t <= f.imp) {
      const p = lerpPt(f.A, f.center, k);
      p.y -= Math.sin(Math.PI * k) * f.s * 0.8;
      drawOrb(f, p, f.s * 0.12, '#ff7a1a');
      emitAt(f, p, 2, { speed: 0.3, life: 0.45, size: 0.06, colors: ['#ff7a1a', '#fbbf24', '#ef4444'] });
    }
    drawBlast(f, '#ff7a1a', '#fde047', '#7c2d12');
  },
  sound(f) {
    const end = f.B;
    for (let i = 0; i < 5; i++) {
      const k = animSeg(f.t, 0.05 + i * 0.07, 0.05 + i * 0.07 + 0.45);
      if (k <= 0 || k >= 1) continue;
      const p = lerpPt(f.A, end, k);
      const r = f.s * (0.25 + 0.25 * k);
      ctx.strokeStyle = rgba(i % 2 ? '#f0abfc' : '#e9d5ff', 0.9 * (1 - k * 0.6));
      ctx.lineWidth = f.s * 0.05;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(p.x - f.dir.x * r, p.y - f.dir.y * r, r, f.ang - 0.9, f.ang + 0.9); ctx.stroke();
    }
    if (f.since >= 0) {
      const k = clamp01(f.since / 0.45);
      ring(end.x, end.y, f.s * (0.3 + 0.5 * k), f.s * 0.05, '#f0abfc', 1 - k);
      ring(end.x, end.y, f.s * (0.15 + 0.35 * k), f.s * 0.03, '#ffffff', 1 - k);
    }
  },
  crystal_flame(f) {
    drawCharge(f, 0, 0.2, '#ef4444');
    if (f.t > 0.18 && f.t <= f.imp) {
      const k = travel(f, 0.18, f.imp);
      for (let i = 0; i < 3; i++) {
        const ang = k * Math.PI * 4 + i * (Math.PI * 2 / 3);
        const base = lerpPt(f.A, projectileEnd(f), k);
        const p = { x: base.x + Math.cos(ang) * f.s * 0.18, y: base.y + Math.sin(ang) * f.s * 0.18 };
        glow(p.x, p.y, f.s * 0.22, '#ef4444', 0.55);
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(ang);
        ctx.fillStyle = '#fecaca'; ctx.strokeStyle = '#7f1d1d'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(0, -f.s * 0.12); ctx.lineTo(f.s * 0.05, 0); ctx.lineTo(0, f.s * 0.12); ctx.lineTo(-f.s * 0.05, 0);
        ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      }
    }
  },
  radiant(f) {
    drawCharge(f, 0, 0.3, '#fde68a');
    const grow = animSeg(f.t, 0.28, f.imp);
    const fade = 1 - animSeg(f.t, 0.7, 0.98);
    if (grow > 0 && fade > 0) {
      const w = f.s * 0.55 * (0.4 + 0.6 * bump(animSeg(f.t, 0.28, 0.8)));
      const top = f.B.y - f.s * 5;
      const bottom = animLerp(top, f.B.y + f.s * 0.2, easeOut(grow));
      const g = ctx.createLinearGradient(0, top, 0, bottom);
      g.addColorStop(0, rgba('#fde68a', 0));
      g.addColorStop(0.7, rgba('#fde68a', 0.55 * fade));
      g.addColorStop(1, rgba('#ffffff', 0.9 * fade));
      ctx.fillStyle = g;
      ctx.fillRect(f.B.x - w / 2, top, w, bottom - top);
      ctx.fillStyle = rgba('#ffffff', 0.7 * fade);
      ctx.fillRect(f.B.x - w * 0.15, top, w * 0.3, bottom - top);
      if (f.since >= 0) glow(f.B.x, f.B.y, f.s * 0.9, '#fde68a', 0.6 * fade);
    }
  },
  shock(f) {
    const k = animSeg(f.t, 0.1, 0.7);
    if (k <= 0 || k >= 1) return;
    const tick = Math.floor(f.now / 45);
    for (let b = 0; b < 3; b++) {
      const rnd = (i) => animRand(f.a, tick * 17 + b * 7 + i);
      const end = { x: f.B.x + (rnd(90) - 0.5) * f.s * 0.5, y: f.B.y + (rnd(91) - 0.5) * f.s * 0.5 };
      strokePath(jaggedPath(f.A, f.hit ? end : f.missPt, 6, f.s * 0.25, rnd), f.s * 0.04, b ? '#93c5fd' : '#ffffff', 0.9 * bump(k));
    }
    glow(f.A.x + f.dir.x * f.s * 0.4, f.A.y + f.dir.y * f.s * 0.4, f.s * 0.3, '#a5d8ff', 0.7 * bump(k));
  },
  arcane_ray(f) {
    drawCharge(f, 0, f.imp, '#c084fc');
    const k = animSeg(f.t, f.imp - 0.08, f.imp + 0.02);
    const fade = 1 - animSeg(f.t, 0.72, 0.95);
    if (k <= 0 || fade <= 0) return;
    const end = lerpPt(f.A, projectileEnd(f), k);
    strokeLine(f.A, end, f.s * 0.26 * fade, '#a855f7', 0.35 * fade);
    strokeLine(f.A, end, f.s * 0.08 * fade, '#f5d0fe', 0.95 * fade);
    const n = Math.max(2, Math.floor(f.dist / f.s * 1.4));
    for (let i = 0; i < n; i++) {
      const kk = ((i / n) + f.t * 0.8) % 1;
      if (kk > k) continue;
      const p = lerpPt(f.A, end, kk);
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(f.t * 6 + i);
      ctx.strokeStyle = rgba('#f5d0fe', fade); ctx.lineWidth = 1.5;
      const r = f.s * 0.12;
      ctx.strokeRect(-r / 2, -r / 2, r, r);
      ctx.beginPath(); ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
  },
  thorns(f) {
    drawCharge(f, 0, 0.35, '#4ade80');
    const k = animSeg(f.t, f.imp - 0.12, f.imp + 0.05);
    const fade = 1 - animSeg(f.t, 0.72, 0.98);
    if (k <= 0 || fade <= 0) return;
    const c = f.B;
    for (let i = 0; i < 7; i++) {
      const ang = -Math.PI / 2 + (i - 3) * 0.32;
      const h = f.s * (0.5 + 0.3 * animRand(f.a, i)) * easeOut(k) * fade;
      const bx = c.x + (i - 3) * f.s * 0.12, by = c.y + f.s * 0.35;
      const tip = { x: bx + Math.cos(ang) * h, y: by + Math.sin(ang) * h };
      ctx.fillStyle = rgba(i % 2 ? '#166534' : '#3f6212', fade);
      ctx.strokeStyle = rgba('#052e16', fade);
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(bx - f.s * 0.06, by); ctx.lineTo(tip.x, tip.y); ctx.lineTo(bx + f.s * 0.06, by);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  },
  wind(f) {
    for (let i = 0; i < 3; i++) {
      const k = animSeg(f.t, 0.08 + i * 0.08, 0.08 + i * 0.08 + 0.45);
      if (k <= 0 || k >= 1) continue;
      const lateral = (i - 1) * f.s * 0.25;
      const p = lerpPt(f.A, f.B, easeOut(k));
      const c = { x: p.x + f.perp.x * lateral, y: p.y + f.perp.y * lateral };
      ctx.strokeStyle = rgba('#e0f2fe', 1 - k * 0.5);
      ctx.lineWidth = f.s * 0.06;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(c.x - f.dir.x * f.s * 0.3, c.y - f.dir.y * f.s * 0.3, f.s * 0.3, f.ang - 1.1, f.ang + 1.1); ctx.stroke();
      strokeLine({ x: c.x - f.dir.x * f.s * 1.2, y: c.y - f.dir.y * f.s * 1.2 }, { x: c.x - f.dir.x * f.s * 0.4, y: c.y - f.dir.y * f.s * 0.4 }, f.s * 0.02, '#bae6fd', 0.6 * (1 - k));
    }
  },
  ice(f) {
    drawCharge(f, 0, 0.15, '#9be7ff');
    const k = travel(f, 0.12, f.imp, easeIn);
    if (f.t > 0.12 && f.t <= f.imp) {
      const p = lerpPt(f.A, f.center, k);
      drawOrb(f, p, f.s * 0.12, '#9be7ff');
    }
    if (f.since >= 0) {
      const k2 = clamp01(f.since / 0.5);
      ring(f.center.x, f.center.y, f.radius * easeOut(k2), f.s * 0.08 * (1 - k2), '#e0f2fe', 1 - k2);
      ctx.fillStyle = rgba('#bae6fd', 0.18 * (1 - k2));
      ctx.beginPath(); ctx.arc(f.center.x, f.center.y, f.radius * easeOut(k2), 0, Math.PI * 2); ctx.fill();
    }
  },
  curse(f) {
    drawCharge(f, 0, 0.3, '#a21caf');
    const k = animSeg(f.t, 0.25, f.imp + 0.1);
    const fade = 1 - animSeg(f.t, 0.75, 0.98);
    if (k <= 0 || fade <= 0) return;
    const c = f.hit ? f.B : f.missPt;
    const r = f.s * 0.45;
    ctx.save();
    ctx.translate(c.x, c.y - f.s * 0.1);
    ctx.rotate(f.t * 3);
    ctx.strokeStyle = rgba('#f0abfc', 0.9 * fade * k);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i <= 5; i++) {
      const a = -Math.PI / 2 + i * (Math.PI * 4 / 5);
      i ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.stroke();
    ctx.restore();
    if (Math.random() < 0.8) emitAt(f, c, 2, { speed: 0.6, life: 0.7, kind: 'smoke', size: 0.16, gravity: -0.6, colors: ['#3b0764', '#581c87', '#1e1b4b'] });
  },
  ki(f) {
    drawCharge(f, 0, 0.18, '#60a5fa');
    const k = travel(f, 0.15, f.imp, easeIn);
    if (f.t > 0.15 && f.t <= f.imp) {
      const p = lerpPt(f.A, projectileEnd(f), k);
      glow(p.x, p.y, f.s * 0.45, '#3b82f6', 0.55);
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(f.ang);
      ctx.fillStyle = '#dbeafe'; ctx.strokeStyle = '#1e3a8a'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(-f.s * 0.14, -f.s * 0.14, f.s * 0.28, f.s * 0.28, f.s * 0.07); ctx.fill(); ctx.stroke();
      for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(f.s * 0.14, i * f.s * 0.08); ctx.lineTo(f.s * 0.04, i * f.s * 0.08); ctx.stroke(); }
      ctx.restore();
      emitAt(f, p, 1, { speed: 0.3, life: 0.3, size: 0.07, color: '#93c5fd' });
    }
    if (f.since >= 0) {
      const k2 = clamp01(f.since / 0.35);
      ring(f.B.x, f.B.y, f.s * (0.2 + 0.6 * k2), f.s * 0.06 * (1 - k2), '#93c5fd', 1 - k2);
    }
  },
  shadow_hand(f) {
    const k = animSeg(f.t, 0.2, f.imp + 0.05);
    const fade = 1 - animSeg(f.t, 0.75, 0.98);
    if (k <= 0 || fade <= 0) return;
    const c = f.hit ? f.B : f.missPt;
    glow(c.x, c.y + f.s * 0.2, f.s * 0.6, '#1e1b4b', 0.7 * fade);
    const close = easeOut(k);
    for (let i = 0; i < 5; i++) {
      const base = Math.PI * (0.15 + i * 0.175);
      const bx = c.x + Math.cos(base) * f.s * 0.5, by = c.y + Math.sin(base) * f.s * 0.35 + f.s * 0.15;
      const tip = { x: animLerp(bx, c.x + (i - 2) * f.s * 0.08, close), y: animLerp(by - f.s * 0.6, c.y - f.s * 0.15, close) };
      ctx.strokeStyle = rgba('#0b0f17', 0.95 * fade);
      ctx.lineWidth = f.s * 0.11;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(bx, tip.y, tip.x, tip.y); ctx.stroke();
      ctx.strokeStyle = rgba('#7c3aed', 0.6 * fade);
      ctx.lineWidth = f.s * 0.03;
      ctx.stroke();
    }
  },
  divine_spear(f) {
    drawCharge(f, 0, 0.2, '#fde68a');
    const k = travel(f, 0.18, f.imp, easeIn);
    if (f.t > 0.18 && f.t <= f.imp) {
      const p = lerpPt(f.A, projectileEnd(f), k);
      const len = f.s * 0.9;
      const tail = { x: p.x - f.dir.x * len, y: p.y - f.dir.y * len };
      strokeLine(tail, p, f.s * 0.22, '#fde68a', 0.35);
      strokeLine(tail, p, f.s * 0.06, '#fffbeb', 1);
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(f.ang);
      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#a16207'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(f.s * 0.2, 0); ctx.lineTo(0, -f.s * 0.08); ctx.lineTo(-f.s * 0.05, 0); ctx.lineTo(0, f.s * 0.08); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    if (f.since >= 0 && f.hit) glow(f.B.x, f.B.y, f.s * 0.8, '#fde68a', 0.7 * (1 - clamp01(f.since / 0.5)));
  },
  missiles(f) {
    drawCharge(f, 0, 0.18, '#c084fc');
    const end = projectileEnd(f);
    for (let i = 0; i < 3; i++) {
      const t0 = 0.15 + i * 0.06;
      const k = travel(f, t0, f.imp);
      if (f.t <= t0 || f.t > f.imp) continue;
      const bend = (i - 1) * f.s * 1.4 + f.s * 0.3;
      const ctrl = { x: (f.A.x + end.x) / 2 + f.perp.x * bend, y: (f.A.y + end.y) / 2 + f.perp.y * bend };
      const q = (kk) => ({
        x: (1 - kk) * (1 - kk) * f.A.x + 2 * (1 - kk) * kk * ctrl.x + kk * kk * end.x,
        y: (1 - kk) * (1 - kk) * f.A.y + 2 * (1 - kk) * kk * ctrl.y + kk * kk * end.y
      });
      const p = q(k);
      const trail = [q(Math.max(0, k - 0.15)), q(Math.max(0, k - 0.08)), p];
      strokePath(trail, f.s * 0.07, '#c084fc', 0.6);
      drawOrb(f, p, f.s * 0.08, '#e9d5ff');
    }
  },
  fox_fire(f) {
    const end = projectileEnd(f);
    for (let i = 0; i < 3; i++) {
      const k = travel(f, 0.1 + i * 0.05, f.imp);
      if (f.t > f.imp) continue;
      const base = lerpPt(f.A, end, k);
      const wav = Math.sin(k * Math.PI * 3 + i * 2) * f.s * 0.3 * (1 - k);
      const p = { x: base.x + f.perp.x * wav, y: base.y + f.perp.y * wav - Math.sin(f.now / 90 + i) * f.s * 0.04 };
      glow(p.x, p.y, f.s * 0.3, '#60a5fa', 0.55);
      ctx.fillStyle = rgba('#e0f2fe', 0.95);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - f.s * 0.16);
      ctx.quadraticCurveTo(p.x + f.s * 0.09, p.y, p.x, p.y + f.s * 0.07);
      ctx.quadraticCurveTo(p.x - f.s * 0.09, p.y, p.x, p.y - f.s * 0.16);
      ctx.fill();
    }
  },
  water(f) {
    const k = animSeg(f.t, 0.05, f.imp);
    const fade = 1 - animSeg(f.t, 0.75, 0.98);
    if (k <= 0 || fade <= 0) return;
    const end = lerpPt(f.A, f.B, easeOut(k));
    const pts = [];
    const n = 14;
    for (let i = 0; i <= n; i++) {
      const kk = i / n;
      const p = lerpPt(f.A, end, kk);
      const w = Math.sin(kk * 9 - f.now / 60) * f.s * 0.06;
      pts.push({ x: p.x + f.perp.x * w, y: p.y + f.perp.y * w });
    }
    strokePath(pts, f.s * 0.32 * fade, '#1d4ed8', 0.55 * fade);
    strokePath(pts, f.s * 0.16 * fade, '#60a5fa', 0.9 * fade);
    strokePath(pts, f.s * 0.05 * fade, '#e0f2fe', fade);
    if (Math.random() < 0.8) emitAt(f, end, 2, { speed: 2, life: 0.4, size: 0.05, gravity: 3, colors: ['#93c5fd', '#e0f2fe'] });
  },
  breath(f) {
    if (f.t > 0.05 && f.t < 0.62) {
      const mouth = { x: f.A.x + f.dir.x * f.s * 0.4, y: f.A.y + f.dir.y * f.s * 0.4 };
      const u = toUnits(f, f.center);
      const ang = Math.atan2(u.y - f.dir.y * 0.4, u.x - f.dir.x * 0.4);
      emitAt(f, mouth, 5, { angle: ang, spread: 0.7, speed: Math.hypot(u.x, u.y) * 2.2 + 2, life: 0.5, size: 0.1, drag: 1, colors: ['#ff7a1a', '#fbbf24', '#ef4444', '#fde047'] });
      glow(mouth.x, mouth.y, f.s * 0.35, '#fbbf24', 0.8);
    }
    drawBlast(f, '#ff7a1a', '#fde047', '#7c2d12');
  },
  eidolon(f) {
    const k = travel(f, 0.1, f.imp, easeIn);
    const fade = f.t <= f.imp ? 1 : 1 - animSeg(f.t, f.imp, f.imp + 0.2);
    if (fade > 0) {
      const p = lerpPt(f.A, projectileEnd(f), k);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(f.ang);
      ctx.globalAlpha = 0.75 * fade;
      glow(0, 0, f.s * 0.8, '#a78bfa', 0.6);
      ctx.fillStyle = rgba('#ddd6fe', 0.85);
      ctx.strokeStyle = rgba('#4c1d95', 0.9);
      ctx.lineWidth = 1.5;
      const S = f.s * 0.5;
      ctx.beginPath(); // corpo + cabeça
      ctx.moveTo(S * 0.9, 0); ctx.lineTo(S * 0.4, -S * 0.18); ctx.lineTo(-S * 0.7, -S * 0.12); ctx.lineTo(-S * 1.1, 0);
      ctx.lineTo(-S * 0.7, S * 0.12); ctx.lineTo(S * 0.4, S * 0.18); ctx.closePath(); ctx.fill(); ctx.stroke();
      const flap = Math.sin(f.now / 70) * 0.25;
      for (const sgn of [-1, 1]) { // asas
        ctx.beginPath(); ctx.moveTo(S * 0.15, sgn * S * 0.12);
        ctx.lineTo(-S * 0.35, sgn * S * (0.95 + flap)); ctx.lineTo(-S * 0.45, sgn * S * 0.15); ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      ctx.restore();
    }
    if (f.since >= 0) {
      const k2 = clamp01(f.since / 0.4);
      ring(f.B.x, f.B.y, f.s * (0.3 + 0.7 * k2), f.s * 0.08 * (1 - k2), '#c4b5fd', 1 - k2);
    }
  },
  bonfire(f) {
    drawCharge(f, 0, 0.3, '#ff7a1a');
    const cells = f.a.areaCells || [];
    const n = Math.min(cells.length, 9);
    for (let i = 0; i < n; i++) {
      const cell = cells[Math.floor(animRand(f.a, i) * cells.length)];
      const t0 = f.imp - 0.1 + animRand(f.a, i + 20) * 0.25;
      const k = animSeg(f.t, t0, t0 + 0.45);
      if (k <= 0 || k >= 1) continue;
      const c = getCellPixelCenter(cell.col, cell.row);
      const h = f.s * 1.1 * bump(k);
      const g = ctx.createLinearGradient(0, c.y, 0, c.y - h);
      g.addColorStop(0, rgba('#fde047', 0.9));
      g.addColorStop(0.5, rgba('#ff7a1a', 0.7));
      g.addColorStop(1, rgba('#ef4444', 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(c.x - f.s * 0.22, c.y + f.s * 0.1);
      ctx.quadraticCurveTo(c.x - f.s * 0.1, c.y - h * 0.6, c.x, c.y - h);
      ctx.quadraticCurveTo(c.x + f.s * 0.1, c.y - h * 0.6, c.x + f.s * 0.22, c.y + f.s * 0.1);
      ctx.closePath(); ctx.fill();
      if (Math.random() < 0.3) emitAt(f, { x: c.x, y: c.y - h * 0.6 }, 1, { speed: 0.6, life: 0.5, size: 0.05, gravity: -1.5, colors: ['#fbbf24', '#ff7a1a'] });
    }
  },
  howl(f) {
    for (let i = 0; i < 4; i++) {
      const k = animSeg(f.t, 0.1 + i * 0.12, 0.1 + i * 0.12 + 0.5);
      if (k <= 0 || k >= 1) continue;
      const r = f.radius * easeOut(k);
      ctx.strokeStyle = rgba('#bae6fd', 0.8 * (1 - k));
      ctx.lineWidth = f.s * 0.06 * (1 - k * 0.5);
      ctx.beginPath();
      for (let j = 0; j <= 48; j++) {
        const a = (j / 48) * Math.PI * 2;
        const rr = r + Math.sin(a * 7 + f.now / 80) * f.s * 0.06;
        const x = f.center.x + Math.cos(a) * rr, y = f.center.y + Math.sin(a) * rr;
        j ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
    }
    if (Math.random() < 0.5 && f.t < 0.7) emitAt(f, f.center, 1, { speed: 2.5, life: 0.6, kind: 'smoke', size: 0.14, colors: ['#e0f2fe', '#94a3b8'] });
  },

  /* ----- itens e efeitos ----- */
  heal(f) {
    const c = f.B;
    const k = animSeg(f.t, 0.1, 0.9);
    glow(c.x, c.y, f.s * 0.75, '#4ade80', 0.45 * bump(k));
    if (f.t < 0.75 && Math.random() < 0.7) {
      emitAt(f, { x: c.x + (Math.random() - 0.5) * f.s * 0.7, y: c.y + f.s * 0.25 }, 1, { angle: -Math.PI / 2, spread: 0.4, speed: 1.2, life: 0.7, size: 0.08, drag: 0.5, kind: Math.random() < 0.4 ? 'cross' : 'dot', colors: ['#86efac', '#bbf7d0', '#ffffff'] });
    }
  },
  shield(f) {
    const k = animSeg(f.t, 0.1, 0.8);
    const r = f.s * 0.6;
    ctx.strokeStyle = rgba('#9adfff', bump(k));
    ctx.lineWidth = f.s * 0.08;
    ctx.lineCap = 'round';
    const facing = (normalizeFacing((STATE.units.find(u => u.id === f.a.from.id) || {}).facing || 0) * Math.PI) / 180;
    ctx.beginPath(); ctx.arc(f.A.x, f.A.y, r, facing - 1.1, facing + 1.1); ctx.stroke();
    glow(f.A.x + Math.cos(facing) * r, f.A.y + Math.sin(facing) * r, f.s * 0.35, '#9adfff', 0.7 * bump(k));
  },
  light(f) {
    const k = animSeg(f.t, 0.05, 0.9);
    glow(f.A.x, f.A.y - f.s * 0.2, f.s * (0.3 + 1.2 * easeOut(k)), '#fbbf24', 0.5 * (1 - k));
    if (f.t < 0.4 && Math.random() < 0.6) emitAt(f, { x: f.A.x, y: f.A.y - f.s * 0.2 }, 2, { speed: 1.5, life: 0.35, kind: 'spark', size: 0.05, colors: ['#fde047', '#ffffff'] });
  },
  hazard(f) {
    const c = f.A;
    const k = animSeg(f.t, 0.05, 0.6);
    glow(c.x, c.y, f.s * 0.7, f.a.color, 0.6 * bump(k));
  }
};

function drawProjectileArrow(f, bolt) {
  const k = travel(f, 0.05, f.imp);
  const end = f.hit ? { x: f.B.x - f.dir.x * f.s * 0.18, y: f.B.y - f.dir.y * f.s * 0.18 } : f.missPt;
  const len = f.s * (bolt ? 0.38 : 0.55);
  const w = Math.max(2, f.s * (bolt ? 0.05 : 0.035));
  if (f.t <= f.imp) {
    const p = lerpPt(f.A, end, k);
    const lift = bolt ? 0 : Math.sin(Math.PI * k) * Math.min(f.dist * 0.08, f.s * 0.6);
    const pp = { x: p.x, y: p.y - lift };
    const tangent = f.ang + (bolt ? 0 : -Math.cos(Math.PI * k) * Math.atan2(Math.min(f.dist * 0.08, f.s * 0.6) * Math.PI, f.dist));
    strokeLine({ x: pp.x - f.dir.x * len * 1.8, y: pp.y - f.dir.y * len * 1.8 }, pp, w * 0.8, '#ffffff', 0.25);
    drawArrowShape(pp, tangent, len, w, '#ef4444', 1, bolt);
  } else if (f.hit) {
    const stay = 1 - animSeg(f.t, f.imp + 0.2, 0.95);
    if (stay > 0) drawArrowShape(end, f.ang, len, w, '#ef4444', stay, bolt);
  } else {
    const k2 = animSeg(f.t, f.imp, f.imp + 0.3);
    const p = { x: end.x + f.dir.x * f.s * 1.5 * k2, y: end.y + f.dir.y * f.s * 1.5 * k2 };
    drawArrowShape(p, f.ang, len, w, '#ef4444', 1 - k2, bolt);
  }
}

/** Brilho que cresce na peça que conjura. */
function drawCharge(f, t0, t1, color = f.a.color) {
  const k = animSeg(f.t, t0, t1);
  if (k <= 0 || f.t > t1 + 0.1) return;
  const fade = f.t > t1 ? 1 - animSeg(f.t, t1, t1 + 0.1) : 1;
  const p = { x: f.A.x + f.dir.x * f.s * 0.3, y: f.A.y + f.dir.y * f.s * 0.3 };
  glow(p.x, p.y, f.s * (0.2 + 0.35 * k), color, 0.7 * fade);
  ring(f.A.x, f.A.y, f.s * (0.6 - 0.15 * k), 1.5, color, 0.6 * k * fade);
}

/** Explosão em esfera até o raio da área. */
function drawBlast(f, color, core, smoke) {
  if (f.since < 0) return;
  const k = clamp01(f.since / (f.a.duration * (1 - f.imp) / 1000));
  const r = f.radius * easeOut(Math.min(1, k * 1.8));
  const fade = 1 - animSeg(k, 0.35, 1);
  const g = ctx.createRadialGradient(f.center.x, f.center.y, 0, f.center.x, f.center.y, Math.max(1, r));
  g.addColorStop(0, rgba(core, 0.95 * fade));
  g.addColorStop(0.45, rgba(color, 0.75 * fade));
  g.addColorStop(0.85, rgba(smoke || color, 0.35 * fade));
  g.addColorStop(1, rgba(smoke || color, 0));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(f.center.x, f.center.y, Math.max(1, r), 0, Math.PI * 2); ctx.fill();
  ring(f.center.x, f.center.y, r, f.s * 0.06 * fade, core, 0.8 * fade);
}

/* ---------------- Partículas no impacto ---------------- */

const ANIM_IMPACTS = {
  default(f) {
    if (!f.hit) return;
    for (const p of f.targetsPx) if (p.hit) emitAt(f, p, 10, { speed: 2.2, life: 0.4, kind: 'spark', size: 0.06 });
  },
  slash(f) { if (f.hit) emitAt(f, f.B, f.a.crit ? 18 : 10, { angle: f.ang, spread: 1.6, speed: 3, life: 0.35, kind: 'spark', size: 0.06, colors: ['#ffffff', '#fde68a'] }); },
  thrust(f) { if (f.hit) emitAt(f, f.B, 8, { angle: f.ang, spread: 0.9, speed: 3, life: 0.3, kind: 'spark', size: 0.06, colors: ['#ffffff', '#fde68a'] }); },
  bash(f) {
    const c = f.hit ? f.B : { x: f.B.x + f.perp.x * f.s * 0.4, y: f.B.y + f.perp.y * f.s * 0.4 };
    emitAt(f, { x: c.x, y: c.y + f.s * 0.25 }, f.hit ? 10 : 6, { angle: -Math.PI / 2, spread: 2.4, speed: 1.4, life: 0.5, kind: 'smoke', size: 0.12, colors: ['#a8a29e', '#d6d3d1'] });
  },
  claw(f) { if (f.hit) emitAt(f, f.B, 8, { speed: 1.8, life: 0.4, size: 0.05, gravity: 3, color: '#b91c1c' }); },
  arrow(f) { if (f.hit) emitAt(f, f.B, 6, { angle: f.ang + Math.PI, spread: 1.4, speed: 1.6, life: 0.3, kind: 'spark', size: 0.05, color: '#f1f5f9' }); },
  bolt(f) { ANIM_IMPACTS.arrow(f); },
  thrown(f) { ANIM_IMPACTS.arrow(f); },
  bomb(f) {
    const end = projectileEnd(f);
    emitAt(f, end, 24, { speed: 2.6, life: 0.55, size: 0.08, gravity: 2, color: f.a.color });
    emitAt(f, end, 8, { speed: 0.8, life: 0.8, kind: 'smoke', size: 0.18, gravity: -0.5, colors: ['#57534e', '#78716c'] });
  },
  shot(f) {
    const muzzle = { x: f.A.x + f.dir.x * f.s * 0.45, y: f.A.y + f.dir.y * f.s * 0.45 };
    emitAt(f, muzzle, 6, { angle: f.ang, spread: 1, speed: 0.6, life: 0.8, kind: 'smoke', size: 0.12, gravity: -0.6, colors: ['#9ca3af', '#d1d5db'] });
    if (f.hit) emitAt(f, f.B, 6, { speed: 2, life: 0.3, kind: 'spark', size: 0.05, color: '#fde68a' });
  },
  energy(f) { emitAt(f, projectileEnd(f), 14, { speed: 2, life: 0.45, size: 0.06 }); },
  orb(f) { emitAt(f, projectileEnd(f), 18, { speed: 2.2, life: 0.5, size: 0.07 }); },
  beam(f) { for (const p of f.targetsPx) emitAt(f, p, 10, { speed: 2, life: 0.5, size: 0.06 }); },
  explosion(f) { emitAt(f, f.center, 30, { speed: f.radius / f.s * 2.6, life: 0.6, size: 0.08, colors: [f.a.color, '#ffffff'] }); },
  touch(f) { if (f.hit) emitAt(f, f.B, 12, { speed: 2, life: 0.35, kind: 'spark', size: 0.06 }); },
  lightning(f) { for (const p of f.targetsPx) emitAt(f, p, 10, { speed: 3, life: 0.35, kind: 'spark', size: 0.06, colors: ['#ffffff', '#bfdbfe'] }); },
  fireball(f) {
    emitAt(f, f.center, 40, { speed: f.radius / f.s * 2.8, life: 0.7, size: 0.08, gravity: -0.6, colors: ['#ff7a1a', '#fbbf24', '#ef4444', '#fde047'] });
    emitAt(f, f.center, 10, { speed: f.radius / f.s * 1.2, life: 1, kind: 'smoke', size: 0.25, gravity: -0.8, colors: ['#44403c', '#57534e'] });
  },
  crystal_flame(f) { emitAt(f, projectileEnd(f), 14, { speed: 2.4, life: 0.5, kind: 'shard', size: 0.07, colors: ['#fecaca', '#ef4444', '#ffffff'] }); },
  radiant(f) { emitAt(f, f.B, 16, { angle: -Math.PI / 2, spread: 2.2, speed: 1.6, life: 0.8, size: 0.06, gravity: -1, colors: ['#fde68a', '#ffffff'] }); },
  shock(f) { if (f.hit) emitAt(f, f.B, 12, { speed: 2.6, life: 0.3, kind: 'spark', size: 0.06, colors: ['#ffffff', '#93c5fd'] }); },
  arcane_ray(f) { emitAt(f, projectileEnd(f), 16, { speed: 2.2, life: 0.5, size: 0.06, colors: ['#c084fc', '#f5d0fe'] }); },
  thorns(f) { if (f.hit) emitAt(f, f.B, 10, { angle: -Math.PI / 2, spread: 2, speed: 1.6, life: 0.5, kind: 'shard', size: 0.05, gravity: 3, colors: ['#4ade80', '#166534'] }); },
  wind(f) { for (const p of f.targetsPx) emitAt(f, p, 8, { angle: f.ang, spread: 1, speed: 3, life: 0.35, kind: 'spark', size: 0.05, color: '#e0f2fe' }); },
  ice(f) { emitAt(f, f.center, 36, { speed: f.radius / f.s * 3, life: 0.6, kind: 'shard', size: 0.08, colors: ['#e0f2fe', '#9be7ff', '#ffffff'] }); },
  curse(f) { /* a fumaça já sai durante o desenho */ },
  ki(f) { emitAt(f, projectileEnd(f), 14, { speed: 2.4, life: 0.4, size: 0.06, colors: ['#93c5fd', '#ffffff'] }); },
  shadow_hand(f) { emitAt(f, f.hit ? f.B : f.missPt, 10, { speed: 0.8, life: 0.7, kind: 'smoke', size: 0.16, gravity: -0.5, colors: ['#1e1b4b', '#312e81'] }); },
  divine_spear(f) { emitAt(f, projectileEnd(f), 18, { speed: 2.4, life: 0.5, kind: 'spark', size: 0.06, colors: ['#fde68a', '#ffffff'] }); },
  missiles(f) { emitAt(f, projectileEnd(f), 18, { speed: 2.2, life: 0.45, size: 0.06, colors: ['#c084fc', '#e9d5ff'] }); },
  fox_fire(f) { emitAt(f, projectileEnd(f), 14, { speed: 1.6, life: 0.6, size: 0.07, gravity: -1, colors: ['#60a5fa', '#e0f2fe'] }); },
  water(f) { for (const p of f.targetsPx) emitAt(f, p, 10, { speed: 2.4, life: 0.45, size: 0.05, gravity: 4, colors: ['#93c5fd', '#e0f2fe'] }); },
  breath(f) { ANIM_IMPACTS.fireball(f); },
  eidolon(f) { emitAt(f, f.B, 18, { speed: 2.6, life: 0.5, size: 0.07, colors: ['#c4b5fd', '#ffffff'] }); },
  bonfire(f) { emitAt(f, f.center, 20, { speed: f.radius / f.s * 1.5, life: 0.8, size: 0.06, gravity: -1.5, colors: ['#ff7a1a', '#fbbf24'] }); },
  howl(f) { /* os anéis já cobrem a área */ },
  heal(f) { emitAt(f, f.B, 10, { angle: -Math.PI / 2, spread: 1.5, speed: 1.4, life: 0.7, kind: 'cross', size: 0.07, drag: 0.8, colors: ['#86efac', '#ffffff'] }); },
  shield(f) { emitAt(f, f.A, 8, { speed: 1.6, life: 0.35, kind: 'spark', size: 0.05, color: '#9adfff' }); },
  light(f) { /* faíscas saem durante o desenho */ },
  hazard(f) { emitAt(f, f.A, 14, { angle: -Math.PI / 2, spread: 1.8, speed: 2.2, life: 0.5, kind: 'spark', size: 0.06, gravity: 3, colors: [f.a.color, '#ffffff'] }); }
};
