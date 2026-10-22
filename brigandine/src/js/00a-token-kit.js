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

  const skinDefs = (id, skin) => rad(`skin_${id}`, [[0, lighten(skin, 0.34)], [0.45, skin], [1, darken(skin, 0.4)]], [0.4, 0.3, 0.8]);

  /**
   * Rosto frontal em estilo de quadrinhos. Retorna { neck, head }.
   * Opções: skin, eye, brow, mouth, y, w, h,
   *   chin (0..1, largura do queixo: maior = mais quadrado), tilt (-1..1, + = bravo, - = triste),
   *   squint (0..1), smile (-1..1), teeth ('none'|'grin'|'fangs'|'snarl'), eyeGlow, lashes,
   *   ears ('round'|'pointed'|'none'), nose (escala), stubble (bool), crow (rugas laterais).
   */
  function face(id, o = {}) {
    const {
      skin = '#e2b48c', eye = '#3b2a1c', brow = '#2a1a10', mouth = '#8c4a3a',
      y = 102, w = 33, h = 38, chin = 0.34, tilt = 0.2, squint = 0, smile = 0.4, teeth = 'none',
      eyeGlow = false, lashes = false, ears = 'round', nose = 1, stubble = false, browW = 1, wink = false
    } = o;
    const ink = '#06060c';
    const dark = darken(skin, 0.38);
    const mid = darken(skin, 0.18);
    const ex = 14.5;
    const ey = y + 3;
    const lid = squint * 3.4;
    const cw = w * chin;                 // meia-largura do queixo
    const jaw = `M${128 - w} ${y - 4} C${128 - w} ${y - 30} ${128 - w * 0.62} ${y - h} 128 ${y - h} C${128 + w * 0.62} ${y - h} ${128 + w} ${y - 30} ${128 + w} ${y - 4}
       C${128 + w} ${y + 16} ${128 + w * 0.82} ${y + h * 0.7} ${128 + cw + 4} ${y + h * 0.93} Q128 ${y + h * 1.04} ${128 - cw - 4} ${y + h * 0.93}
       C${128 - w * 0.82} ${y + h * 0.7} ${128 - w} ${y + 16} ${128 - w} ${y - 4}Z`;

    const eyeSVG = (sx) => `
      <g transform="translate(${128 + sx * ex} ${ey}) scale(${sx} 1)">
        <path d="M-10.5 1.5 Q-3 ${-8 + lid} 10.5 -1.2 Q2 ${6.5 - lid * 0.5} -10.5 1.5Z" fill="#fbf6ec" stroke="${ink}" stroke-width="1.2" stroke-linejoin="round"/>
        <clipPath id="eyc_${id}_${sx > 0 ? 'r' : 'l'}"><path d="M-10.5 1.5 Q-3 ${-8 + lid} 10.5 -1.2 Q2 ${6.5 - lid * 0.5} -10.5 1.5Z"/></clipPath>
        <g clip-path="url(#eyc_${id}_${sx > 0 ? 'r' : 'l'})">
          <circle cx="1.5" cy="-0.4" r="6" fill="${eye}"/>
          <path d="M-5 3 Q1.5 8 8 3 L8 8 L-5 8Z" fill="${lighten(eye, 0.35)}" opacity="0.8"/>
          <circle cx="1.5" cy="-0.4" r="6" fill="none" stroke="${darken(eye, 0.6)}" stroke-width="1.6"/>
          <circle cx="1.5" cy="-0.4" r="2.6" fill="#07070c"/>
          <path d="M-9 -3 Q-2 -9 11 -4 L11 -9 L-9 -9Z" fill="${ink}" opacity="0.32"/>
        </g>
        <circle cx="-0.6" cy="-2.6" r="1.9" fill="#fff"/><circle cx="3.6" cy="1.2" r="0.9" fill="#fff" opacity="0.9"/>
        ${eyeGlow ? `<circle cx="1.5" cy="-0.4" r="9" fill="${eye}" opacity="0.3"/>` : ''}
        <path d="M-11.5 2 Q-3 ${-9.4 + lid} 11.5 -1.6" fill="none" stroke="${ink}" stroke-width="${lashes ? 3.8 : 3.1}" stroke-linecap="round"/>
        ${lashes ? `<path d="M-11 1 L-14 -2 M10.500 -2 L14 -5" stroke="${ink}" stroke-width="2" stroke-linecap="round"/>` : ''}
        <path d="M-7 ${-9.5 + lid} Q2 ${-13 + lid * 0.5} 10 ${-8.5}" fill="none" stroke="${dark}" stroke-width="1.1" stroke-linecap="round" opacity="0.7"/>
        <path d="M-7 7.5 Q1 10 8 6.5" fill="none" stroke="${dark}" stroke-width="1" opacity="0.5"/>
      </g>`;

    // sobrancelha como cunha afilada; tilt>0 baixa a ponta interna (bravo)
    const browSVG = (sx) => {
      const ix = 128 + sx * 5, ox = 128 + sx * 27;
      const iy = y - 8 + tilt * 5 + squint * 1.5, oy = y - 12 - tilt * 4 - squint * 1;
      const t = 3.6 * browW;
      return `<path d="M${ix} ${iy} Q${128 + sx * 15} ${(iy + oy) / 2 - 5.5} ${ox} ${oy} Q${128 + sx * 15} ${(iy + oy) / 2 - 5.5 + t} ${ix} ${iy + t * 1.1}Z" fill="${brow}" stroke="${ink}" stroke-width="1.4" stroke-linejoin="round"/>`;
    };

    const toothRow = teeth === 'none' ? '' : (() => {
      const n = teeth === 'fangs' ? 2 : 6;
      if (teeth === 'fangs') return `<path d="M${128 - 8} ${y + 24} L${128 - 5} ${y + 33} L${128 - 2} ${y + 24}Z M${128 + 8} ${y + 24} L${128 + 5} ${y + 33} L${128 + 2} ${y + 24}Z" fill="#fff" stroke="${ink}" stroke-width="1.2" stroke-linejoin="round"/>`;
      let t = '';
      for (let i = 0; i < n; i++) t += `<path d="M${128 - 13 + i * 5.2} ${y + 25 + smile * 1} h5.2 v${teeth === 'snarl' ? 7 : 5} h-5.2z" fill="#fff" stroke="${ink}" stroke-width="0.9"/>`;
      return t;
    })();

    const sy = y + 26;
    const mouthSVG = teeth === 'none'
      ? `<path d="M${128 - 11} ${sy - smile * 1.5} Q128 ${sy + 6 * smile + 0.5} ${128 + 11} ${sy - smile * 1.5}" fill="none" stroke="${ink}" stroke-width="2.8" stroke-linecap="round"/>
         <path d="M${128 - 5} ${sy + 4 + smile * 2} Q128 ${sy + 7 + smile * 2.6} ${128 + 5} ${sy + 4 + smile * 2}" fill="none" stroke="${mouth}" stroke-width="2.2" stroke-linecap="round" opacity="0.8"/>`
      : `<path d="M${128 - 14} ${sy - 1} Q128 ${sy + 12 * Math.max(0.3, smile)} ${128 + 14} ${sy - 1} Q128 ${sy + 2} ${128 - 14} ${sy - 1}Z" fill="#3a0c12" stroke="${ink}" stroke-width="2.2" stroke-linejoin="round"/>${toothRow}`;

    const earSVG = ears === 'none' ? '' : ears === 'pointed'
      ? `<path d="M${128 - w + 2} ${y - 6} L${128 - w - 30} ${y - 26} L${128 - w - 2} ${y + 16}Z" fill="url(#skin_${id})" stroke="${ink}" stroke-width="2.6" stroke-linejoin="round"/>
         <path d="M${128 - w - 4} ${y - 8} L${128 - w - 22} ${y - 19} L${128 - w - 4} ${y + 8}Z" fill="${dark}" opacity="0.4"/>
         <path d="M${128 + w - 2} ${y - 6} L${128 + w + 30} ${y - 26} L${128 + w + 2} ${y + 16}Z" fill="url(#skin_${id})" stroke="${ink}" stroke-width="2.6" stroke-linejoin="round"/>
         <path d="M${128 + w + 4} ${y - 8} L${128 + w + 22} ${y - 19} L${128 + w + 4} ${y + 8}Z" fill="${dark}" opacity="0.4"/>`
      : `<path d="M${128 - w + 1} ${y - 8} C${128 - w - 10} ${y - 10} ${128 - w - 9} ${y + 12} ${128 - w + 3} ${y + 12}Z" fill="url(#skin_${id})" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/>
         <path d="M${128 + w - 1} ${y - 8} C${128 + w + 10} ${y - 10} ${128 + w + 9} ${y + 12} ${128 + w - 3} ${y + 12}Z" fill="url(#skin_${id})" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/>
         <path d="M${128 - w - 4} ${y - 2} q-1 7 3 8 M${128 + w + 4} ${y - 2} q1 7 -3 8" stroke="${dark}" stroke-width="1.4" fill="none" opacity="0.7"/>`;

    const nx = 3.6 * nose;
    const head = `
      <g filter="url(#cel_${id})">
        ${earSVG}
        <path d="${jaw}" fill="url(#skin_${id})" stroke="${ink}" stroke-width="3.2" stroke-linejoin="round"/>
      </g>
      <!-- planos do rosto: bochecha, sombra do nariz e sob o lábio (sombra dura) -->
      <path d="M${128 + w - 4} ${y + 6} Q${128 + w - 9} ${y + 26} ${128 + cw + 4} ${y + h * 0.9} Q${128 + w - 14} ${y + 24} ${128 + w - 17} ${y + 8}Z" fill="${dark}" opacity="0.38"/>
      <path d="M${128 + 4} ${y + 6} Q${128 + 9 * nose} ${y + 14} ${128 + 6 * nose} ${y + 19} L${128 + 2} ${y + 19}Z" fill="${dark}" opacity="0.4"/>
      <path d="M${128 - 8} ${sy + 9} Q128 ${sy + 13} ${128 + 8} ${sy + 9} Q128 ${sy + 16} ${128 - 8} ${sy + 9}Z" fill="${dark}" opacity="0.35"/>
      ${stubble ? `<path d="M${128 - w + 4} ${y + 14} Q${128 - w + 6} ${y + h * 0.9} 128 ${y + h} Q${128 + w - 6} ${y + h * 0.9} ${128 + w - 4} ${y + 14} Q128 ${y + 26} ${128 - w + 4} ${y + 14}Z" fill="url(#hatch_${id})" opacity="0.28"/>` : ''}
      ${browSVG(-1)}${browSVG(1)}
      ${eyeSVG(-1)}${wink ? `<path d="M${128 + ex - 11} ${ey + 2} Q${128 + ex} ${ey + 9} ${128 + ex + 11} ${ey + 2}" fill="none" stroke="${ink}" stroke-width="3.4" stroke-linecap="round"/><path d="M${128 + ex + 11} ${ey + 2} l4 -3 M${128 + ex + 8} ${ey + 5} l4 1" stroke="${ink}" stroke-width="1.8" stroke-linecap="round"/>` : eyeSVG(1)}
      <path d="M${128 - 2.5} ${y - 2} Q${128 - 3.5 * nose} ${y + 9} ${128 - nx} ${y + 16}" fill="none" stroke="${dark}" stroke-width="1.5" stroke-linecap="round" opacity="0.8"/>
      <path d="M${128 - nx - 3} ${y + 17} Q${128 - nx} ${y + 21.500} 128 ${y + 20} Q${128 + nx} ${y + 21.500} ${128 + nx + 3} ${y + 17}" fill="none" stroke="${ink}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
      ${mouthSVG}`;
    // pescoço curto e grosso, com trapézios descendo até os ombros
    const neck = `<g filter="url(#cel_${id})">
        <path d="M${128 - 19} ${y + 20} L${128 + 19} ${y + 20} L${128 + 21} ${y + 46} C${128 + 24} ${y + 56} ${128 + 28} ${y + 66} ${128 + 31} ${y + 80} L${128 - 31} ${y + 80} C${128 - 28} ${y + 66} ${128 - 24} ${y + 56} ${128 - 21} ${y + 46}Z" fill="${mid}" stroke="${ink}" stroke-width="2.8" stroke-linejoin="round"/>
      </g>
      <path d="M${128 - 17} ${y + 24} L${128 + 17} ${y + 24} L${128 + 19} ${y + 40} Q128 ${y + 54} ${128 - 19} ${y + 40}Z" fill="#000" opacity="0.32"/>
      <path d="M${128 + 4} ${y + 40} Q${128 + 12} ${y + 50} ${128 + 22} ${y + 48}" fill="none" stroke="${dark}" stroke-width="2" opacity="0.6"/>`;
    return { neck, head };
  }

  /** Pauldron de placas sobrepostas (lado -1 esquerdo, +1 direito). */
  function pauldron(id, side, { fill = `url(#steel_${id})`, trim = `url(#gold_${id})`, plates = 3 } = {}) {
    const mx = (x) => (side < 0 ? x : 256 - x);
    let out = `<g filter="url(#cel_${id})"><path d="M${mx(36)} 226 C${mx(34)} 190 ${mx(58)} 168 ${mx(92)} 174 L${mx(102)} 214 C${mx(78)} 226 ${mx(56)} 232 ${mx(36)} 226Z" fill="${fill}" stroke="#101722" stroke-width="3" stroke-linejoin="round"/>`;
    for (let i = 1; i <= plates; i++) {
      const t = i / (plates + 1);
      out += `<path d="M${mx(38 + t * 4)} ${226 - t * 14} Q${mx(66)} ${236 - t * 30} ${mx(100)} ${216 - t * 16}" fill="none" stroke="#101722" stroke-width="2" opacity="0.5"/>`;
    }
    out += `<path d="M${mx(46)} 200 C${mx(52)} 184 ${mx(70)} 177 ${mx(88)} 178" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.55"/>
      <path d="M${mx(36)} 226 C${mx(56)} 232 ${mx(78)} 226 ${mx(102)} 214" fill="none" stroke="${trim}" stroke-width="4" stroke-linecap="round"/>
      <circle cx="${mx(60)}" cy="202" r="3.2" fill="${trim}" stroke="#101722" stroke-width="1.2"/></g>`;
    return out;
  }

  /** Brilho de quatro pontas (reflexo em metal, gemas e olhos). */
  const gl = (x, y, sc = 1, rot = 0, op = 0.95) =>
    `<path d="M0 -9 L1.8 -1.8 L9 0 L1.8 1.8 L0 9 L-1.8 1.8 L-9 0 L-1.8 -1.8Z" fill="#fff" opacity="${op}" transform="translate(${x} ${y}) rotate(${rot}) scale(${sc})"/>`;

  const TORSO = 'M34 256 C38 214 62 190 100 178 L156 178 C194 190 218 214 222 256Z';


  /**
   * Linguagem de quadrinhos como filtros SVG, aplicáveis a qualquer grupo:
   *  - comic: contorno de nanquim + sombra em cel shading (luz vinda de cima-esquerda)
   *    + brilho de borda + luz de recorte na cor de acento (lado direito)
   *  - cel:   só o sombreamento (para partes internas, sem contorno)
   */
  function comicDefs(id, accent) {
    const region = 'filterUnits="userSpaceOnUse" x="-24" y="-24" width="304" height="304" color-interpolation-filters="sRGB"';
    const shade = (dx, dy, op) => `
      <feOffset in="SourceAlpha" dx="${dx}" dy="${dy}" result="o1"/>
      <feComposite in="SourceAlpha" in2="o1" operator="out" result="cres"/>
      <feFlood flood-color="#0c0614" flood-opacity="${op}"/>
      <feComposite in2="cres" operator="in" result="shade"/>`;
    const light = `
      <feOffset in="SourceAlpha" dx="3.5" dy="4.5" result="o2"/>
      <feComposite in="SourceAlpha" in2="o2" operator="out" result="rim"/>
      <feFlood flood-color="#ffffff" flood-opacity="0.42"/>
      <feComposite in2="rim" operator="in" result="hi"/>
      <feOffset in="SourceAlpha" dx="-3.5" dy="0" result="o3"/>
      <feComposite in="SourceAlpha" in2="o3" operator="out" result="bnc"/>
      <feFlood flood-color="${accent}" flood-opacity="0.55"/>
      <feComposite in2="bnc" operator="in" result="bounce"/>`;
    return `
    <filter id="comic_${id}" ${region}>
      <feMorphology in="SourceAlpha" operator="dilate" radius="2.2" result="dil"/>
      <feFlood flood-color="#06060c"/>
      <feComposite in2="dil" operator="in" result="outline"/>
      ${shade(-6, -8, 0.36)}${light}
      <feMerge><feMergeNode in="outline"/><feMergeNode in="SourceGraphic"/><feMergeNode in="shade"/><feMergeNode in="bounce"/><feMergeNode in="hi"/></feMerge>
    </filter>
    <filter id="cel_${id}" ${region}>
      ${shade(-5, -7, 0.34)}${light}
      <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="shade"/><feMergeNode in="bounce"/><feMergeNode in="hi"/></feMerge>
    </filter>
    <pattern id="ht_${id}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(28)"><circle cx="3" cy="3" r="1.35" fill="#000"/></pattern>
    <pattern id="hatch_${id}" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><path d="M0 0 V5" stroke="#06060c" stroke-width="1.6"/></pattern>
    <linearGradient id="htg_${id}" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#fff"/><stop offset="0.55" stop-color="#000"/></linearGradient>
    <mask id="htm_${id}"><rect width="256" height="256" fill="url(#htg_${id})"/></mask>`;
  }

  /** Moldura do medalhão + composição das camadas. */
  function frame(id, { faction, bg, accent, art, lean = faction === 'hero' ? -3 : 3 }) {
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
    ${comicDefs(id, accent)}
    ${materials(id)}
    ${a.defs || ''}
  </defs>
  <circle cx="128" cy="130" r="124" fill="#000" opacity="0.35"/>
  <circle cx="128" cy="128" r="124" fill="url(#rim_${id})"/>
  <circle cx="128" cy="128" r="123" fill="none" stroke="#fff" stroke-opacity="0.35" stroke-width="1.5"/>
  <circle cx="128" cy="128" r="124.5" fill="none" stroke="#06060c" stroke-width="3"/>
  <circle cx="128" cy="128" r="116" fill="none" stroke="${stud}" stroke-width="4.2" stroke-dasharray="1.2 20.6" stroke-linecap="round" opacity="0.9"/>
  <circle cx="128" cy="128" r="111" fill="none" stroke="#000" stroke-opacity="0.45" stroke-width="3"/>
  <circle cx="128" cy="128" r="108" fill="url(#bg_${id})"/>
  <g clip-path="url(#clip_${id})">
    <g fill="${accent}" opacity="0.16">${rays}</g>
    <rect width="256" height="256" fill="url(#ht_${id})" mask="url(#htm_${id})" opacity="0.35"/>
    ${a.glow || ''}
    <g filter="url(#comic_${id})">${a.back || ''}</g>
    <g filter="url(#comic_${id})" transform="rotate(${lean} 128 214)">${a.body}</g>
    <circle cx="128" cy="128" r="108" fill="url(#vig_${id})"/>
  </g>
  <circle cx="128" cy="128" r="108" fill="none" stroke="${accent}" stroke-width="2" opacity="0.95"/>
  <circle cx="128" cy="128" r="106.5" fill="none" stroke="#000" stroke-opacity="0.5" stroke-width="1"/>
  <g filter="url(#comic_${id})">${a.over || ''}</g>
  <path d="M128 221 L140 233 L128 246 L116 233Z" fill="url(#gem_${id})" stroke="${faction === 'hero' ? '#5a3f0e' : '#140c0e'}" stroke-width="2.2" stroke-linejoin="round"/>
  <path d="M128 224 L134 232 L128 230Z" fill="#fff" opacity="0.6"/>
</svg>`;
  }

  return { lin, rad, mix, lighten, darken, cloth, skinDefs, face, pauldron, frame, gl, TORSO };
})();

const SCULPT_SVGS = {};
