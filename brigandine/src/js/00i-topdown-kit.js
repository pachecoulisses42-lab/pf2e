/* ============================================================================
   1j. TOKENS VISTOS DE CIMA — kit de desenho (estilo "Zênite")
   Figura vista do alto, virada para o sul (para baixo da tela), luz sempre de
   cima-esquerda, volumes pintados com gradiente, grão de tinta e sombra
   projetada macia. Sem moldura: a sombra é o único chão.
   ============================================================================ */
const TDK = (() => {
  const OUT = 'rgba(22, 14, 9, 0.62)';           // contorno pintado (não é linha de cartum)
  const r1 = (n) => Math.round(n * 10) / 10;
  const P = (pt) => `${r1(pt[0])} ${r1(pt[1])}`;
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const mul = (a, k) => [a[0] * k, a[1] * k];
  const norm = (v) => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };
  const perp = (v) => [-v[1], v[0]];
  const { lighten, darken } = TK;

  /**
   * Pintor por token: registra gradientes sob demanda (um por cor) e devolve url(#...).
   * Luz de cima-esquerda: claro no foco, cor base no meio, escuro na borda.
   */
  function painter(id) {
    const defs = [];
    const cache = {};
    let n = 0;
    const paint = (color, { hi = 0.32, lo = 0.42, fx = 0.34, fy = 0.28 } = {}) => {
      const key = `${color}|${hi}|${lo}|${fx}|${fy}`;
      if (cache[key]) return cache[key];
      const gid = `${id}_p${n++}`;
      defs.push(`<radialGradient id="${gid}" cx="${fx}" cy="${fy}" r="0.85"><stop offset="0" stop-color="${lighten(color, hi)}"/><stop offset="0.5" stop-color="${color}"/><stop offset="1" stop-color="${darken(color, lo)}"/></radialGradient>`);
      cache[key] = `url(#${gid})`;
      return cache[key];
    };
    /** Gradiente linear ao longo de uma peça (lâminas, cabos), claro no lado iluminado. */
    const metal = (color, angle = 0) => {
      const key = `m${color}|${angle}`;
      if (cache[key]) return cache[key];
      const gid = `${id}_m${n++}`;
      const a = (angle * Math.PI) / 180;
      const x = Math.cos(a) * 0.5, y = Math.sin(a) * 0.5;
      defs.push(`<linearGradient id="${gid}" x1="${r1(0.5 - x)}" y1="${r1(0.5 - y)}" x2="${r1(0.5 + x)}" y2="${r1(0.5 + y)}"><stop offset="0" stop-color="${lighten(color, 0.55)}"/><stop offset="0.45" stop-color="${color}"/><stop offset="1" stop-color="${darken(color, 0.45)}"/></linearGradient>`);
      cache[key] = `url(#${gid})`;
      return cache[key];
    };
    const raw = (s) => defs.push(s);
    return { paint, metal, raw, defs: () => defs.join(''), id };
  }

  const shape = (d, fill, sw = 1.6) => `<path d="${d}" fill="${fill}" stroke="${OUT}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"/>`;
  const ellipse = (cx, cy, rx, ry, fill, rot = 0, sw = 1.6) => `<ellipse cx="${r1(cx)}" cy="${r1(cy)}" rx="${r1(rx)}" ry="${r1(ry)}" fill="${fill}" stroke="${OUT}" stroke-width="${sw}"${rot ? ` transform="rotate(${r1(rot)} ${r1(cx)} ${r1(cy)})"` : ''}/>`;
  const line = (a, b, w, color, cap = 'round') => `<path d="M${P(a)} L${P(b)}" stroke="${color}" stroke-width="${w}" stroke-linecap="${cap}" fill="none"/>`;
  /** Cápsula pintada: contorno + preenchimento + filete de luz. */
  const rod = (a, b, w, color, light = true) => line(a, b, w + 2.6, OUT) + line(a, b, w, color) +
    (light ? line(add(a, mul(perp(norm(sub(b, a))), -w * 0.22)), add(b, mul(perp(norm(sub(b, a))), -w * 0.22)), Math.max(1, w * 0.28), 'rgba(255,255,255,0.28)') : '');

  /* ---------------- Corpo ---------------- */

  /** Capa que escorre para trás (norte). sway desloca a ponta para os lados. */
  function cape(p, color, { len = 92, sway = -10, width = 60 } = {}) {
    const tip = 128 + sway;
    const y0 = 116, yT = y0 - len;
    return shape(`M${128 - width} ${y0} C${128 - width - 8} ${y0 - len * 0.45} ${tip - width * 0.7} ${yT + 10} ${tip - 6} ${yT} C${tip + width * 0.35} ${yT - 4} ${128 + width + 6} ${y0 - len * 0.5} ${128 + width} ${y0} Q128 ${y0 + 16} ${128 - width} ${y0}Z`, p.paint(color, { fx: 0.3, fy: 0.55 })) +
      `<path d="M${128 - width * 0.45} ${y0 - 6} Q${tip - width * 0.4} ${y0 - len * 0.5} ${tip - width * 0.2} ${yT + 18} M${128 + width * 0.2} ${y0 - 4} Q${tip + width * 0.1} ${y0 - len * 0.55} ${tip + width * 0.05} ${yT + 12} M${128 + width * 0.62} ${y0 - 8} Q${tip + width * 0.5} ${y0 - len * 0.45} ${tip + width * 0.3} ${yT + 26}" stroke="${darken(color, 0.35)}" stroke-width="2.2" fill="none" stroke-linecap="round" opacity="0.7"/>`;
  }

  /** Pernas e botas aparecendo à frente (sul). stride > 0 = passo largo. */
  function feet(p, { pants = '#4a4038', boot = '#3a2a20', stride = 8, spread = 16 } = {}) {
    const L = [128 - spread, 162 + stride * 0.6], R = [128 + spread, 162 - stride * 0.6];
    return rod([128 - spread * 0.8, 140], L, 16, p.paint(pants)) + rod([128 + spread * 0.8, 140], R, 16, p.paint(pants)) +
      ellipse(L[0] - 1, L[1] + 5, 10, 12, p.paint(boot)) + ellipse(R[0] + 1, R[1] + 5, 10, 12, p.paint(boot));
  }

  /** Ombros e costas vistos de cima. */
  function torso(p, color, { rx = 50, ry = 30, cy = 126 } = {}) {
    return ellipse(128, cy, rx, ry, p.paint(color, { fy: 0.2 }));
  }

  /** Ombreiras (armadura). */
  function pauldrons(p, color, { rx = 22, ry = 17, y = 120, dx = 40 } = {}) {
    return ellipse(128 - dx, y, rx, ry, p.paint(color), -18) + ellipse(128 + dx, y, rx, ry, p.paint(color), 18) +
      `<path d="M${128 - dx - 14} ${y - 6} Q${128 - dx} ${y - 14} ${128 - dx + 12} ${y - 8} M${128 + dx - 12} ${y - 8} Q${128 + dx} ${y - 14} ${128 + dx + 14} ${y - 6}" stroke="rgba(255,255,255,0.45)" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
  }

  /** Gola de pelo irregular em volta do pescoço. */
  function fur(p, color, { r = 40, cy = 118 } = {}) {
    let d = '';
    const n = 22;
    for (let i = 0; i <= n; i++) {
      const a = Math.PI + (i / n) * Math.PI * 2;
      const rr = r + (i % 2 ? 7 : -1);
      d += `${i ? 'L' : 'M'}${P([128 + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.72])} `;
    }
    return shape(d + 'Z', p.paint(color, { hi: 0.4 }));
  }

  /** Braço: do ombro (lado -1 esquerdo, +1 direito) até a mão. */
  function arm(p, side, hand, sleeve, skin, { w = 15, shoulder } = {}) {
    const s = shoulder || [128 + side * 42, 124];
    const elbow = add(mul(add(s, hand), 0.5), [side * 5, 2]);
    return rod(s, elbow, w, p.paint(sleeve)) + rod(elbow, hand, w - 2, p.paint(sleeve)) + ellipse(hand[0], hand[1], 7.5, 7.5, p.paint(skin));
  }

  /* ---------------- Cabeça ---------------- */

  /**
   * Cabeça vista do alto, testa e nariz à frente (sul).
   * style: short | long | bald | hood | helmet | wide-hat | pointed-hat | horned | skull | bun | mohawk
   */
  function head(p, o = {}) {
    const {
      skin = '#e2b490', hair = '#4a3020', style = 'short', cx = 128, cy = 112, r = 29,
      helm = '#9aa4b0', hat = '#3a3a5a', trim = '#c9a24a', plume = null, beard = null, ears = 'round'
    } = o;
    const id = p.id;
    const clip = `${id}_hc`;
    p.raw(`<clipPath id="${clip}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>`);
    let out = '';
    // orelhas
    if (ears === 'round') out += ellipse(cx - r + 1, cy + 4, 5, 8, p.paint(skin)) + ellipse(cx + r - 1, cy + 4, 5, 8, p.paint(skin));
    if (ears === 'pointed') out += shape(`M${cx - r + 3} ${cy - 2} L${cx - r - 16} ${cy - 10} L${cx - r + 4} ${cy + 10}Z M${cx + r - 3} ${cy - 2} L${cx + r + 16} ${cy - 10} L${cx + r - 4} ${cy + 10}Z`, p.paint(skin));
    // cabelo comprido / barba escorrendo
    if (style === 'long') out += shape(`M${cx - r + 2} ${cy - 4} C${cx - r - 6} ${cy - 40} ${cx - 10} ${cy - 66} ${cx + 4} ${cy - 70} C${cx + 22} ${cy - 62} ${cx + r + 8} ${cy - 38} ${cx + r - 2} ${cy - 4}Z`, p.paint(hair, { fy: 0.6 }));
    if (beard) out += shape(`M${cx - 18} ${cy + 18} Q${cx} ${cy + r + 30} ${cx + 18} ${cy + 18} Q${cx} ${cy + 24} ${cx - 18} ${cy + 18}Z`, p.paint(beard));
    // crânio (pele) + nariz
    out += ellipse(cx, cy, r, r, p.paint(skin, { fy: 0.25 }));
    out += ellipse(cx, cy + r - 1, 4.6, 6, p.paint(skin, { hi: 0.4 }), 0, 1.2);
    out += `<path d="M${cx - 13} ${cy + r - 12} Q${cx - 6} ${cy + r - 16} ${cx - 1} ${cy + r - 12} M${cx + 1} ${cy + r - 12} Q${cx + 6} ${cy + r - 16} ${cx + 13} ${cy + r - 12}" stroke="${darken(skin, 0.5)}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;

    const cap = (color, shift = 0.34, opt = {}) => `<g clip-path="url(#${clip})"><circle cx="${cx}" cy="${cy - r * shift}" r="${r}" fill="${p.paint(color, opt)}"/></g><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${OUT}" stroke-width="1.6"/>`;
    const strands = (color) => `<path d="M${cx - 14} ${cy - 20} Q${cx - 4} ${cy - 8} ${cx - 8} ${cy + 4} M${cx + 2} ${cy - 24} Q${cx + 10} ${cy - 10} ${cx + 6} ${cy + 2} M${cx + 14} ${cy - 18} Q${cx + 20} ${cy - 6} ${cx + 18} ${cy + 4}" stroke="${lighten(color, 0.35)}" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.7"/>`;

    if (style === 'short' || style === 'long' || style === 'bun' || style === 'mohawk') {
      if (style !== 'mohawk') out += cap(hair) + strands(hair);
      if (style === 'bun') out += ellipse(cx, cy - r + 4, 10, 9, p.paint(hair));
      if (style === 'mohawk') out += shape(`M${cx - 6} ${cy + r - 22} L${cx - 7} ${cy - r - 4} Q${cx} ${cy - r - 14} ${cx + 7} ${cy - r - 4} L${cx + 6} ${cy + r - 22}Z`, p.paint(hair));
    }
    if (style === 'hood') {
      out += `<g clip-path="url(#${clip})"><circle cx="${cx}" cy="${cy - r * 0.2}" r="${r}" fill="${p.paint(hair, { fy: 0.2 })}"/></g>` +
        shape(`M${cx - r - 4} ${cy + 6} C${cx - r - 8} ${cy - r - 24} ${cx + r + 8} ${cy - r - 24} ${cx + r + 4} ${cy + 6} Q${cx + r - 2} ${cy + r - 2} ${cx} ${cy + r + 4} Q${cx - r + 2} ${cy + r - 2} ${cx - r - 4} ${cy + 6}Z M${cx - r + 8} ${cy + 8} Q${cx} ${cy + r - 2} ${cx + r - 8} ${cy + 8} Q${cx} ${cy + 18} ${cx - r + 8} ${cy + 8}Z`, p.paint(hair, { fy: 0.2 })) +
        `<path d="M${cx} ${cy - r - 14} L${cx} ${cy - 2}" stroke="${darken(hair, 0.35)}" stroke-width="2" opacity="0.7"/>`;
    }
    if (style === 'helmet' || style === 'horned') {
      out += cap(helm, 0.22) +
        `<path d="M${cx} ${cy - r} L${cx} ${cy + r - 6}" stroke="${darken(helm, 0.3)}" stroke-width="5" stroke-linecap="round"/><path d="M${cx - 2} ${cy - r + 2} L${cx - 2} ${cy + r - 8}" stroke="rgba(255,255,255,0.5)" stroke-width="1.6"/>` +
        `<path d="M${cx - r + 3} ${cy + 6} Q${cx} ${cy + 16} ${cx + r - 3} ${cy + 6}" stroke="${darken(helm, 0.35)}" stroke-width="3" fill="none"/>` +
        line([cx, cy + 6], [cx, cy + r + 3], 4, darken(helm, 0.2));
      if (style === 'horned') out += shape(`M${cx - r + 4} ${cy - 2} C${cx - r - 18} ${cy - 4} ${cx - r - 26} ${cy - 22} ${cx - r - 20} ${cy - 34} C${cx - r - 14} ${cy - 22} ${cx - r - 6} ${cy - 14} ${cx - r + 6} ${cy - 12}Z M${cx + r - 4} ${cy - 2} C${cx + r + 18} ${cy - 4} ${cx + r + 26} ${cy - 22} ${cx + r + 20} ${cy - 34} C${cx + r + 14} ${cy - 22} ${cx + r + 6} ${cy - 14} ${cx + r - 6} ${cy - 12}Z`, p.paint('#e8dcc0'));
      if (plume) out += shape(`M${cx - 4} ${cy - r + 2} C${cx - 10} ${cy - r - 30} ${cx + 8} ${cy - r - 44} ${cx + 4} ${cy - r - 58} C${cx + 16} ${cy - r - 38} ${cx + 8} ${cy - r - 16} ${cx + 5} ${cy - r + 2}Z`, p.paint(plume));
    }
    if (style === 'wide-hat') {
      out += ellipse(cx, cy - 2, r + 22, r + 18, p.paint(hat, { fy: 0.3 })) + ellipse(cx, cy - 6, r - 4, r - 6, p.paint(hat, { hi: 0.45 })) +
        `<ellipse cx="${cx}" cy="${cy - 6}" rx="${r - 3}" ry="${r - 5}" fill="none" stroke="${trim}" stroke-width="3.4"/>`;
      if (plume) out += shape(`M${cx + 10} ${cy - 10} C${cx + 30} ${cy - 30} ${cx + 52} ${cy - 30} ${cx + 66} ${cy - 46} C${cx + 54} ${cy - 22} ${cx + 32} ${cy - 10} ${cx + 12} ${cy - 2}Z`, p.paint(plume, { hi: 0.5 }));
    }
    if (style === 'pointed-hat') {
      out += ellipse(cx, cy - 2, r + 24, r + 20, p.paint(hat, { fy: 0.3 })) +
        `<ellipse cx="${cx}" cy="${cy - 4}" rx="${r + 4}" ry="${r + 2}" fill="none" stroke="${trim}" stroke-width="4"/>` +
        shape(`M${cx - r - 2} ${cy} Q${cx - 12} ${cy - r - 10} ${cx + 4} ${cy - r - 34} Q${cx + 6} ${cy - r - 14} ${cx + r + 2} ${cy} Q${cx} ${cy + 10} ${cx - r - 2} ${cy}Z`, p.paint(hat, { hi: 0.42, fx: 0.4, fy: 0.25 }));
    }
    if (style === 'skull') {
      out += ellipse(cx, cy, r, r, p.paint('#e6dcc2', { hi: 0.3 })) +
        ellipse(cx - 10, cy + 12, 7, 6, '#1a1210', 0, 1) + ellipse(cx + 10, cy + 12, 7, 6, '#1a1210', 0, 1) +
        `<circle cx="${cx - 10}" cy="${cy + 13}" r="2.2" fill="#ff5a3a"/><circle cx="${cx + 10}" cy="${cy + 13}" r="2.2" fill="#ff5a3a"/>` +
        `<path d="M${cx - 18} ${cy - 10} L${cx - 6} ${cy - 2} M${cx + 8} ${cy - 18} L${cx + 14} ${cy - 6}" stroke="${OUT}" stroke-width="1.6"/>`;
    }
    return out;
  }

  /* ---------------- Armas e objetos ---------------- */

  /** Espada: punho em `hilt`, ponta em `tip`. */
  function sword(p, hilt, tip, { blade = '#c4ccd6', guard = '#b8913a', grip = '#5a3a22', w = 4.2, glow = null } = {}) {
    const d = norm(sub(tip, hilt)), q = perp(d);
    const b0 = add(hilt, mul(d, 7)), t0 = sub(tip, mul(d, 12));
    let s = '';
    if (glow) s += line(b0, tip, w * 4, glow) .replace('stroke=', 'opacity="0.35" stroke=');
    s += shape(`M${P(add(b0, mul(q, w)))} L${P(add(t0, mul(q, w * 0.85)))} L${P(tip)} L${P(sub(t0, mul(q, w * 0.85)))} L${P(sub(b0, mul(q, w)))}Z`, p.metal(blade, Math.atan2(q[1], q[0]) * 180 / Math.PI), 1.4);
    s += line(add(b0, mul(d, 4)), sub(t0, mul(d, 2)), 1.2, 'rgba(255,255,255,0.6)');
    s += rod(sub(hilt, mul(d, 12)), hilt, 4.5, p.paint(grip), false) + ellipse(...sub(hilt, mul(d, 14)), 4, 4, p.paint(guard));
    s += rod(add(b0, mul(q, 12)), sub(b0, mul(q, 12)), 4, p.paint(guard), false);
    return s;
  }

  /** Machado: cabo de `grip` até `head`; double = lâmina dos dois lados. */
  function axe(p, grip, headPt, { blade = '#b0b8c2', haft = '#6a4a2a', double = false, size = 1 } = {}) {
    const d = norm(sub(headPt, grip)), q = perp(d);
    const c = sub(headPt, mul(d, 6 * size));
    const half = (k) => shape(`M${P(add(sub(c, mul(d, 13 * size)), mul(q, k * 4)))} Q${P(add(c, mul(q, k * 34 * size)))} ${P(add(add(c, mul(d, 13 * size)), mul(q, k * 4)))}Z`, p.metal(blade, Math.atan2(q[1] * k, q[0] * k) * 180 / Math.PI), 1.4);
    return rod(grip, add(headPt, mul(d, 4)), 5.5, p.paint(haft)) + half(1) + (double ? half(-1) : '') + ellipse(c[0], c[1], 5, 5, p.paint('#7a828c'));
  }

  /** Lança/azagaia: haste de `butt` até `tip`. */
  function spear(p, butt, tip, { haft = '#7a5a36', head: hd = '#c4ccd6', w = 4 } = {}) {
    const d = norm(sub(tip, butt)), q = perp(d);
    const base = sub(tip, mul(d, 22));
    return rod(butt, base, w, p.paint(haft)) +
      shape(`M${P(tip)} L${P(add(add(base, mul(d, 8)), mul(q, 6)))} L${P(base)} L${P(sub(add(base, mul(d, 8)), mul(q, 6)))}Z`, p.metal(hd, Math.atan2(q[1], q[0]) * 180 / Math.PI), 1.3) +
      rod(add(base, mul(q, 1)), sub(base, mul(d, 6)), 6, p.paint('#4a3020'), false);
  }

  /** Cajado com ornamento: orb | crook | leaves | crystal | sun | moon. */
  function staff(p, butt, top, { wood = '#7a5432', ornament = 'orb', color = '#8fd8ff' } = {}) {
    const d = norm(sub(top, butt)), q = perp(d);
    let s = rod(butt, top, 5, p.paint(wood));
    if (ornament === 'orb' || ornament === 'crystal') {
      s += `<circle cx="${r1(top[0])}" cy="${r1(top[1])}" r="18" fill="${color}" opacity="0.22"/>`;
      s += ornament === 'orb' ? ellipse(top[0], top[1], 9, 9, p.paint(color, { hi: 0.6 })) :
        shape(`M${P(add(top, mul(d, 14)))} L${P(add(top, mul(q, 7)))} L${P(sub(top, mul(d, 8)))} L${P(sub(top, mul(q, 7)))}Z`, p.paint(color, { hi: 0.6 }));
    }
    if (ornament === 'crook') s += `<path d="M${P(top)} Q${P(add(add(top, mul(d, 18)), mul(q, 4)))} ${P(add(add(top, mul(d, 8)), mul(q, 16)))}" stroke="${OUT}" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M${P(top)} Q${P(add(add(top, mul(d, 18)), mul(q, 4)))} ${P(add(add(top, mul(d, 8)), mul(q, 16)))}" stroke="${p.paint(wood)}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    if (ornament === 'leaves') s += [-1, 0, 1].map(k => ellipse(...add(add(top, mul(d, 8)), mul(q, k * 9)), 6, 10, p.paint('#6aa84a'), Math.atan2(d[1], d[0]) * 180 / Math.PI + 90 + k * 30)).join('');
    if (ornament === 'sun') s += ellipse(top[0], top[1], 11, 11, p.paint('#e8c04a', { hi: 0.5 })) + [0, 1, 2, 3, 4, 5, 6, 7].map(i => { const a = i * Math.PI / 4; return line([top[0] + Math.cos(a) * 13, top[1] + Math.sin(a) * 13], [top[0] + Math.cos(a) * 19, top[1] + Math.sin(a) * 19], 3, '#c9a03a'); }).join('');
    if (ornament === 'moon') s += shape(`M${P(add(top, mul(q, -9)))} A11 11 0 1 0 ${P(add(top, mul(q, 9)))} A8 8 0 1 1 ${P(add(top, mul(q, -9)))}Z`, p.paint('#efe6b8', { hi: 0.4 }));
    return s;
  }

  /** Arco de lado, empunhado em `hand`, mirando na direção `aim` (vetor). drawHand puxa a corda. */
  function bow(p, hand, aim, { len = 46, wood = '#7a4a24', drawHand = null, arrow = true } = {}) {
    const d = norm(aim), q = perp(d);
    const t1 = add(hand, mul(q, len)), t2 = sub(hand, mul(q, len));
    const belly = add(hand, mul(d, 18));
    const nock = drawHand || sub(hand, mul(d, 4));
    let s = `<path d="M${P(t1)} Q${P(add(belly, mul(q, len * 0.9)))} ${P(belly)} Q${P(sub(belly, mul(q, len * 0.9)))} ${P(t2)}" stroke="${OUT}" stroke-width="8" fill="none" stroke-linecap="round"/>` +
      `<path d="M${P(t1)} Q${P(add(belly, mul(q, len * 0.9)))} ${P(belly)} Q${P(sub(belly, mul(q, len * 0.9)))} ${P(t2)}" stroke="${p.paint(wood)}" stroke-width="5" fill="none" stroke-linecap="round"/>` +
      `<path d="M${P(t1)} L${P(nock)} L${P(t2)}" stroke="#efe6d0" stroke-width="1.3" fill="none"/>`;
    if (arrow) {
      const tip = add(belly, mul(d, 20));
      s += line(nock, tip, 2.4, '#d8c49a') + shape(`M${P(add(tip, mul(d, 7)))} L${P(add(tip, mul(q, 3.5)))} L${P(sub(tip, mul(q, 3.5)))}Z`, '#c4ccd6', 1) +
        shape(`M${P(nock)} L${P(add(add(nock, mul(d, 9)), mul(q, 4)))} L${P(add(nock, mul(d, 12)))} L${P(sub(add(nock, mul(d, 9)), mul(q, 4)))}Z`, '#c84a3a', 1);
    }
    return s;
  }

  /**
   * Escudo redondo visto de frente (de cima, deitado no braço).
   * pattern: plain | quarters | swirl | cross | sun | rings
   */
  function shield(p, cx, cy, r, { wood = '#7a5232', c1 = '#b8382e', c2 = '#e8d8b0', rim = '#8a929c', pattern = 'quarters' } = {}) {
    const id = `${p.id}_sh${Math.round(cx)}${Math.round(cy)}`;
    p.raw(`<clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${r - 3}"/></clipPath>`);
    let face = `<circle cx="${cx}" cy="${cy}" r="${r - 3}" fill="${p.paint(wood)}"/>`;
    for (let i = -3; i <= 3; i++) face += `<path d="M${cx - r} ${cy + i * r * 0.28} L${cx + r} ${cy + i * r * 0.28 + 6}" stroke="${darken(wood, 0.35)}" stroke-width="1.2" opacity="0.6"/>`;
    if (pattern === 'quarters') face += `<path d="M${cx} ${cy} L${cx} ${cy - r} A${r} ${r} 0 0 1 ${cx + r} ${cy}Z M${cx} ${cy} L${cx} ${cy + r} A${r} ${r} 0 0 1 ${cx - r} ${cy}Z" fill="${c1}" opacity="0.9"/>`;
    if (pattern === 'swirl') face += [0, 120, 240].map(a => `<path d="M${cx} ${cy} C${cx + r * 0.2} ${cy - r * 0.6} ${cx + r * 0.9} ${cy - r * 0.5} ${cx + r * 0.7} ${cy - r * 0.05} C${cx + r * 0.5} ${cy - r * 0.35} ${cx + r * 0.25} ${cy - r * 0.3} ${cx} ${cy}Z" fill="${c1}" transform="rotate(${a} ${cx} ${cy})"/>`).join('');
    if (pattern === 'cross') face += `<path d="M${cx - 5} ${cy - r} h10 v${r - 5} h${r - 5} v10 h-${r - 5} v${r - 5} h-10 v-${r - 5} h-${r - 5} v-10 h${r - 5}Z" fill="${c1}"/>`;
    if (pattern === 'sun') face += `<circle cx="${cx}" cy="${cy}" r="${r * 0.55}" fill="${c1}"/>` + [0, 1, 2, 3, 4, 5, 6, 7].map(i => `<path d="M${cx} ${cy - r * 0.6} L${cx - 4} ${cy - r * 0.95} L${cx + 4} ${cy - r * 0.95}Z" fill="${c1}" transform="rotate(${i * 45} ${cx} ${cy})"/>`).join('');
    if (pattern === 'rings') face += `<circle cx="${cx}" cy="${cy}" r="${r * 0.72}" fill="none" stroke="${c1}" stroke-width="${r * 0.22}"/>`;
    if (c2 && pattern !== 'plain') face += `<circle cx="${cx}" cy="${cy}" r="${r * 0.32}" fill="${c2}" opacity="0.9"/>`;
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${p.metal(rim, 225)}" stroke="${OUT}" stroke-width="1.6"/>` +
      `<g clip-path="url(#${id})">${face}<circle cx="${cx}" cy="${cy}" r="${r}" fill="${p.paint('#000000', { hi: 0, lo: 0 })}" opacity="0"/></g>` +
      `<circle cx="${cx}" cy="${cy}" r="${r - 3}" fill="none" stroke="rgba(0,0,0,0.25)" stroke-width="2"/>` +
      ellipse(cx, cy, r * 0.22, r * 0.22, p.paint(rim, { hi: 0.55 })) +
      `<path d="M${cx - r * 0.7} ${cy - r * 0.55} A${r * 0.9} ${r * 0.9} 0 0 1 ${cx - r * 0.1} ${cy - r * 0.88}" stroke="rgba(255,255,255,0.4)" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  }

  /** Escudo de cavaleiro (heráldico), apontando para o sul. */
  function kite(p, cx, cy, s, { face = '#e8e2d0', c1 = '#2a5a9a', rim = '#c9a24a' } = {}) {
    const d = `M${cx - 22 * s} ${cy - 26 * s} L${cx + 22 * s} ${cy - 26 * s} L${cx + 22 * s} ${cy + 2 * s} Q${cx + 18 * s} ${cy + 26 * s} ${cx} ${cy + 36 * s} Q${cx - 18 * s} ${cy + 26 * s} ${cx - 22 * s} ${cy + 2 * s}Z`;
    return shape(d, p.metal(rim, 225), 1.6) +
      shape(`M${cx - 18 * s} ${cy - 22 * s} L${cx + 18 * s} ${cy - 22 * s} L${cx + 18 * s} ${cy + 1 * s} Q${cx + 15 * s} ${cy + 22 * s} ${cx} ${cy + 31 * s} Q${cx - 15 * s} ${cy + 22 * s} ${cx - 18 * s} ${cy + 1 * s}Z`, p.paint(face), 1) +
      `<path d="M${cx - 4 * s} ${cy - 20 * s} h${8 * s} v${14 * s} h${12 * s} v${8 * s} h-${12 * s} v${22 * s} h-${8 * s} v-${22 * s} h-${12 * s} v-${8 * s} h${12 * s}Z" fill="${c1}"/>`;
  }

  const orb = (p, c, color, r = 10) => `<circle cx="${r1(c[0])}" cy="${r1(c[1])}" r="${r * 2.1}" fill="${color}" opacity="0.2"/><circle cx="${r1(c[0])}" cy="${r1(c[1])}" r="${r * 1.45}" fill="${color}" opacity="0.25"/>` + ellipse(c[0], c[1], r, r, p.paint(color, { hi: 0.65 }), 0, 1.2);
  function flame(p, c, color, s = 1) {
    const [x, y] = c;
    return `<circle cx="${x}" cy="${y}" r="${22 * s}" fill="${color}" opacity="0.18"/>` +
      shape(`M${x} ${y + 12 * s} C${x - 14 * s} ${y + 8 * s} ${x - 12 * s} ${y - 10 * s} ${x - 2 * s} ${y - 20 * s} C${x} ${y - 10 * s} ${x + 6 * s} ${y - 12 * s} ${x + 6 * s} ${y - 22 * s} C${x + 18 * s} ${y - 8 * s} ${x + 14 * s} ${y + 8 * s} ${x} ${y + 12 * s}Z`, p.paint(color, { hi: 0.6 }), 1.2) +
      shape(`M${x} ${y + 8 * s} C${x - 6 * s} ${y + 4 * s} ${x - 4 * s} ${y - 6 * s} ${x + 1 * s} ${y - 10 * s} C${x + 6 * s} ${y - 4 * s} ${x + 6 * s} ${y + 4 * s} ${x} ${y + 8 * s}Z`, '#fff4c8', 0);
  }
  function dagger(p, hilt, tip, opts = {}) { return sword(p, hilt, tip, { w: 2.8, guard: '#8a7a5a', ...opts }); }
  function mace(p, grip, headPt, { head: hd = '#9aa2ac', haft = '#6a4a2a' } = {}) {
    const d = norm(sub(headPt, grip));
    return rod(grip, headPt, 5, p.paint(haft)) + ellipse(headPt[0], headPt[1], 10, 10, p.paint(hd)) +
      [0, 1, 2, 3, 4, 5].map(i => { const a = i * Math.PI / 3; return ellipse(headPt[0] + Math.cos(a) * 9, headPt[1] + Math.sin(a) * 9, 3.6, 3.6, p.paint(hd)); }).join('') + (d ? '' : '');
  }
  function flask(p, c, liquid) {
    const [x, y] = c;
    return ellipse(x, y, 9, 9, p.paint(liquid, { hi: 0.55 })) + `<circle cx="${x}" cy="${y}" r="16" fill="${liquid}" opacity="0.18"/>` + ellipse(x, y - 9, 3.4, 3.4, p.paint('#a87a4a'));
  }
  function book(p, c, color = '#6a2a2a', rot = 0) {
    const [x, y] = c;
    return `<g transform="rotate(${rot} ${x} ${y})">${shape(`M${x - 16} ${y - 11} L${x} ${y - 8} L${x + 16} ${y - 11} L${x + 16} ${y + 11} L${x} ${y + 14} L${x - 16} ${y + 11}Z`, p.paint(color))}${shape(`M${x - 13} ${y - 8} L${x - 1} ${y - 6} L${x - 1} ${y + 11} L${x - 13} ${y + 8}Z M${x + 13} ${y - 8} L${x + 1} ${y - 6} L${x + 1} ${y + 11} L${x + 13} ${y + 8}Z`, '#efe4c8', 1)}</g>`;
  }
  function lute(p, neckEnd, body) {
    return rod(neckEnd, body, 5, p.paint('#6a4224')) + ellipse(body[0], body[1], 17, 21, p.paint('#b07838'), Math.atan2(body[1] - neckEnd[1], body[0] - neckEnd[0]) * 180 / Math.PI + 90) + ellipse(body[0], body[1], 5, 5, '#2a1a10', 0, 1);
  }
  /** Mochila/aljava nas costas (vista de cima). */
  const pack = (p, color, { cx = 128, cy = 96, w = 34, h = 26 } = {}) => shape(`M${cx - w / 2} ${cy - h / 2 + 6} Q${cx - w / 2} ${cy - h / 2} ${cx - w / 2 + 6} ${cy - h / 2} L${cx + w / 2 - 6} ${cy - h / 2} Q${cx + w / 2} ${cy - h / 2} ${cx + w / 2} ${cy - h / 2 + 6} L${cx + w / 2} ${cy + h / 2} L${cx - w / 2} ${cy + h / 2}Z`, p.paint(color));
  function quiver(p, a, b) {
    const d = norm(sub(b, a)), q = perp(d);
    return rod(a, b, 11, p.paint('#6a4224')) + [-3, 0, 3].map(k => shape(`M${P(add(add(b, mul(q, k)), mul(d, 2)))} L${P(add(add(b, mul(q, k + 3)), mul(d, 10)))} L${P(add(add(b, mul(q, k - 3)), mul(d, 10)))}Z`, '#e8e0cc', 1)).join('');
  }

  /**
   * Composição final. art(p) devolve as camadas já na ordem (de trás para a frente).
   * O filtro aplica grão de tinta e projeta a sombra macia para baixo-direita.
   */
  function frame(id, art) {
    const p = painter(id);
    const body = art(p);
    return `<svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="${id}_f" filterUnits="userSpaceOnUse" x="-20" y="-20" width="296" height="296" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="11" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0.9 0.9 0.9 0 -0.85" result="g"/>
      <feComposite in="g" in2="SourceAlpha" operator="in" result="gm"/>
      <feBlend in="SourceGraphic" in2="gm" mode="overlay" result="tex"/>
      <feGaussianBlur in="SourceAlpha" stdDeviation="4.2" result="b"/>
      <feOffset in="b" dx="8" dy="10" result="ob"/>
      <feFlood flood-color="#1c140e" flood-opacity="0.5"/>
      <feComposite in2="ob" operator="in" result="shadow"/>
      <feMerge><feMergeNode in="shadow"/><feMergeNode in="tex"/></feMerge>
    </filter>
    ${p.defs()}
  </defs>
  <g filter="url(#${id}_f)">${body}</g>
</svg>`;
  }

  return { painter, frame, head, torso, pauldrons, fur, arm, feet, cape, sword, axe, spear, staff, bow, shield, kite, orb, flame, dagger, mace, flask, book, lute, pack, quiver, rod, shape, ellipse, line, OUT, add, sub, mul, norm, perp };
})();

/** Estilo "vista de cima": uma função por personagem, mesmas chaves dos outros estilos. */
const TOPDOWN_SVGS = {};
