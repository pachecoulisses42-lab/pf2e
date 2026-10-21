/* ============================================================================
   1. TOKENS — KIT DE ILUSTRAÇÃO SVG (medalhões de retrato 256×256)
   Cada token é um medalhão: aro metálico (herói = ouro, vilão = ferro),
   campo pintado com raios e vinheta, busto do personagem recortado no campo e
   armas/adereços que ultrapassam o aro para dar profundidade.
   ============================================================================ */
const TK = (() => {
  const attr = (a) => (a === undefined ? '' : ` stop-opacity="${a}"`);

  const lin = (id, stops, [x1, y1, x2, y2] = [0, 0, 0, 1]) =>
    `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${attr(a)}/>`).join('')}</linearGradient>`;

  const rad = (id, stops, [cx, cy, r, fx, fy] = [0.5, 0.5, 0.5]) =>
    `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}"${fx !== undefined ? ` fx="${fx}" fy="${fy}"` : ''}>${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${attr(a)}/>`).join('')}</radialGradient>`;

  /** Mistura duas cores #rrggbb (t = 0..1). */
  const mix = (a, b, t) => {
    const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
    const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
    return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('');
  };
  const lighten = (c, t) => mix(c, '#ffffff', t);
  const darken = (c, t) => mix(c, '#000000', t);

  /** Materiais compartilhados: aço, ouro, couro, madeira, osso. */
  const materials = (id) => [
    lin(`steel_${id}`, [[0, '#fbfdff'], [0.3, '#bcc8d8'], [0.62, '#6f7d92'], [1, '#2f3949']], [0, 0, 1, 1]),
    lin(`steelv_${id}`, [[0, '#8896ab'], [0.5, '#f4f8ff'], [1, '#55637a']], [0, 0, 1, 0]),
    lin(`gold_${id}`, [[0, '#fff4bd'], [0.38, '#eab94a'], [0.75, '#b8841f'], [1, '#6b4a10']], [0, 0, 1, 1]),
    lin(`leather_${id}`, [[0, '#b27844'], [1, '#4a2a14']], [0, 0, 0, 1]),
    lin(`wood_${id}`, [[0, '#a8763f'], [0.5, '#7a4f27'], [1, '#43290f']], [0, 0, 1, 0]),
    lin(`bone_${id}`, [[0, '#fffaf0'], [1, '#c9bda3']], [0, 0, 1, 1])
  ].join('');

  /** Gradiente de tecido iluminado de cima-esquerda. */
  const cloth = (id, name, light, dark) => lin(`${name}_${id}`, [[0, light], [1, dark]], [0.15, 0, 0.85, 1]);

  const skinDefs = (id, skin) => rad(`skin_${id}`, [[0, lighten(skin, 0.28)], [0.6, skin], [1, darken(skin, 0.3)]], [0.38, 0.32, 0.85]);

  /**
   * Rosto frontal. Retorna { neck, head } para controlar a ordem das camadas.
   * Opções: skin, eye, brow, mouth, y (centro), w/h (largura/altura do crânio),
   * eyeGlow (olhos emissivos), squint (0..1), smile (-1..1), ears ('round'|'pointed'|'none').
   */
  function face(id, o = {}) {
    const {
      skin = '#e2b48c', eye = '#3b2a1c', brow = '#2a1a10', mouth = '#8c4a3a',
      y = 102, w = 33, h = 38, eyeGlow = false, squint = 0, smile = 0.4,
      ears = 'round', browW = 3.2, lashes = false, nose = 1
    } = o;
    const dark = darken(skin, 0.35);
    const ex = 14.5;
    const ey = y + 3;
    const lid = squint * 3.2;
    const eyeSVG = (sx) => `
      <g transform="translate(${128 + sx * ex} ${ey}) scale(${sx} 1)">
        <path d="M-9.5 0.5 Q-2 ${-6.5 + lid} 9.5 -0.8 Q1 ${5.5 - lid * 0.4} -9.5 0.5Z" fill="#f8f3ea" stroke="${darken(skin, 0.55)}" stroke-width="1.3" stroke-linejoin="round"/>
        <circle cx="0.8" cy="-0.6" r="4.4" fill="${eye}"/>
        <circle cx="0.8" cy="-0.6" r="4.4" fill="none" stroke="${darken(eye, 0.5)}" stroke-width="0.9"/>
        <circle cx="0.8" cy="-0.6" r="2" fill="#0b0b10"/>
        <circle cx="-0.8" cy="-2.1" r="1.2" fill="#fff" opacity="0.95"/>
        ${eyeGlow ? `<circle cx="0.8" cy="-0.6" r="7" fill="${eye}" opacity="0.28"/>` : ''}
        <path d="M-9.8 0.8 Q-2 ${-7.4 + lid} 9.8 -1" fill="none" stroke="${darken(skin, 0.6)}" stroke-width="${lashes ? 2.6 : 1.8}" stroke-linecap="round"/>
      </g>`;
    const browSVG = (sx) => `<path d="M${128 + sx * 6} ${y - 7 + squint * 2} Q${128 + sx * 15} ${y - 14 + squint * 3} ${128 + sx * 24} ${y - 8 - squint * 2}" fill="none" stroke="${brow}" stroke-width="${browW}" stroke-linecap="round"/>`;
    const smileY = y + 25;
    const head = `
      ${ears === 'none' ? '' : ears === 'pointed'
        ? `<path d="M${128 - w + 2} ${y - 6} L${128 - w - 26} ${y - 22} L${128 - w - 2} ${y + 16} Z" fill="url(#skin_${id})" stroke="${dark}" stroke-width="2" stroke-linejoin="round"/>
           <path d="M${128 + w - 2} ${y - 6} L${128 + w + 26} ${y - 22} L${128 + w + 2} ${y + 16} Z" fill="url(#skin_${id})" stroke="${dark}" stroke-width="2" stroke-linejoin="round"/>`
        : `<ellipse cx="${128 - w - 1}" cy="${y + 2}" rx="5.5" ry="9" fill="url(#skin_${id})" stroke="${dark}" stroke-width="1.8"/>
           <ellipse cx="${128 + w + 1}" cy="${y + 2}" rx="5.5" ry="9" fill="url(#skin_${id})" stroke="${dark}" stroke-width="1.8"/>`}
      <path d="M${128 - w} ${y - 4} C${128 - w} ${y - 30} ${128 - w * 0.62} ${y - h} 128 ${y - h} C${128 + w * 0.62} ${y - h} ${128 + w} ${y - 30} ${128 + w} ${y - 4} C${128 + w} ${y + 22} ${128 + w * 0.56} ${y + h * 0.96} 128 ${y + h} C${128 - w * 0.56} ${y + h * 0.96} ${128 - w} ${y + 22} ${128 - w} ${y - 4}Z"
            fill="url(#skin_${id})" stroke="${dark}" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M${128 - w + 5} ${y + 12} Q${128 - w + 8} ${y + 30} 128 ${y + h - 3} Q${128 + w - 8} ${y + 30} ${128 + w - 5} ${y + 12}" fill="none" stroke="${dark}" stroke-width="2" opacity="0.18"/>
      ${browSVG(-1)}${browSVG(1)}
      ${eyeSVG(-1)}${eyeSVG(1)}
      <path d="M128 ${y + 5} Q${128 - 5 * nose} ${y + 17} ${128 - 3.5 * nose} ${y + 18.5} Q128 ${y + 21} ${128 + 3.5 * nose} ${y + 18.5} Q${128 + 5 * nose} ${y + 17} 128 ${y + 5}" fill="${dark}" opacity="0.2"/>
      <path d="M${128 - 4 * nose} ${y + 19} Q128 ${y + 22.5} ${128 + 4 * nose} ${y + 19}" fill="none" stroke="${dark}" stroke-width="1.6" stroke-linecap="round" opacity="0.7"/>
      <path d="M${128 - 10} ${smileY - smile * 1} Q128 ${smileY + 5 * smile + 1} ${128 + 10} ${smileY - smile * 1}" fill="none" stroke="${mouth}" stroke-width="2.4" stroke-linecap="round"/>`;
    const neck = `<path d="M${128 - 15} ${y + 22} L${128 + 15} ${y + 22} L${128 + 18} ${y + 62} L${128 - 18} ${y + 62}Z" fill="${darken(skin, 0.2)}"/>
      <path d="M${128 - 15} ${y + 22} L${128 + 15} ${y + 22} L${128 + 15} ${y + 40} Q128 ${y + 50} ${128 - 15} ${y + 40}Z" fill="#000" opacity="0.22"/>`;
    return { neck, head };
  }

  /** Pauldron de placas sobrepostas (lado -1 esquerdo, +1 direito). */
  function pauldron(id, side, { fill = `url(#steel_${id})`, trim = `url(#gold_${id})`, plates = 3 } = {}) {
    const mx = (x) => (side < 0 ? x : 256 - x);
    let out = `<path d="M${mx(36)} 226 C${mx(34)} 190 ${mx(58)} 168 ${mx(92)} 174 L${mx(102)} 214 C${mx(78)} 226 ${mx(56)} 232 ${mx(36)} 226Z" fill="${fill}" stroke="#101722" stroke-width="3" stroke-linejoin="round"/>`;
    for (let i = 1; i <= plates; i++) {
      const t = i / (plates + 1);
      out += `<path d="M${mx(38 + t * 4)} ${226 - t * 14} Q${mx(66)} ${236 - t * 30} ${mx(100)} ${216 - t * 16}" fill="none" stroke="#101722" stroke-width="2" opacity="0.5"/>`;
    }
    out += `<path d="M${mx(46)} 200 C${mx(52)} 184 ${mx(70)} 177 ${mx(88)} 178" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.55"/>
      <path d="M${mx(36)} 226 C${mx(56)} 232 ${mx(78)} 226 ${mx(102)} 214" fill="none" stroke="${trim}" stroke-width="4" stroke-linecap="round"/>
      <circle cx="${mx(60)}" cy="202" r="3.2" fill="${trim}" stroke="#101722" stroke-width="1.2"/>`;
    return out;
  }

  const TORSO = 'M34 256 C38 214 62 190 100 178 L156 178 C194 190 218 214 222 256Z';

  /** Moldura do medalhão + composição das camadas. */
  function frame(id, { faction, bg, accent, art }) {
    const rim = faction === 'hero'
      ? ['#fff1b8', '#d9ac4a', '#6b4b12']
      : ['#c9bcbc', '#5f4d50', '#1b1214'];
    const stud = faction === 'hero' ? '#fff7d1' : '#ff5b5b';
    let rays = '';
    for (let i = 0; i < 12; i++) {
      const a0 = (i * 30 - 6) * Math.PI / 180;
      const a1 = (i * 30 + 6) * Math.PI / 180;
      rays += `<path d="M128 128 L${(128 + 170 * Math.cos(a0)).toFixed(1)} ${(128 + 170 * Math.sin(a0)).toFixed(1)} L${(128 + 170 * Math.cos(a1)).toFixed(1)} ${(128 + 170 * Math.sin(a1)).toFixed(1)}Z"/>`;
    }
    const a = typeof art === 'function' ? art(id) : art;
    return `<svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
  <defs>
    ${lin(`rim_${id}`, [[0, rim[0]], [0.45, rim[1]], [1, rim[2]]], [0.1, 0, 0.9, 1])}
    ${rad(`bg_${id}`, [[0, bg[0]], [1, bg[1]]], [0.5, 0.4, 0.72])}
    ${rad(`vig_${id}`, [[0.55, '#000', 0], [1, '#000', 0.62]], [0.5, 0.5, 0.5])}
    ${rad(`gem_${id}`, [[0, lighten(accent, 0.6)], [0.55, accent], [1, darken(accent, 0.5)]], [0.35, 0.3, 0.8])}
    <clipPath id="clip_${id}"><circle cx="128" cy="128" r="108"/></clipPath>
    ${materials(id)}
    ${a.defs || ''}
  </defs>
  <circle cx="128" cy="130" r="124" fill="#000" opacity="0.35"/>
  <circle cx="128" cy="128" r="124" fill="url(#rim_${id})"/>
  <circle cx="128" cy="128" r="123" fill="none" stroke="#fff" stroke-opacity="0.35" stroke-width="1.5"/>
  <circle cx="128" cy="128" r="116" fill="none" stroke="${stud}" stroke-width="4.2" stroke-dasharray="1.2 20.6" stroke-linecap="round" opacity="0.9"/>
  <circle cx="128" cy="128" r="111" fill="none" stroke="#000" stroke-opacity="0.45" stroke-width="3"/>
  <circle cx="128" cy="128" r="108" fill="url(#bg_${id})"/>
  <g clip-path="url(#clip_${id})">
    <g fill="#fff" opacity="0.07">${rays}</g>
    ${a.glow || ''}
    ${a.back || ''}
    ${a.body}
    <circle cx="128" cy="128" r="108" fill="url(#vig_${id})"/>
  </g>
  <circle cx="128" cy="128" r="108" fill="none" stroke="${accent}" stroke-width="2" opacity="0.95"/>
  <circle cx="128" cy="128" r="106.5" fill="none" stroke="#000" stroke-opacity="0.5" stroke-width="1"/>
  ${a.over || ''}
  <path d="M128 221 L140 233 L128 246 L116 233Z" fill="url(#gem_${id})" stroke="${faction === 'hero' ? '#5a3f0e' : '#140c0e'}" stroke-width="2.2" stroke-linejoin="round"/>
  <path d="M128 224 L134 232 L128 230Z" fill="#fff" opacity="0.6"/>
</svg>`;
  }

  return { lin, rad, mix, lighten, darken, cloth, skinDefs, face, pauldron, frame, TORSO };
})();

const SCULPT_SVGS = {};
