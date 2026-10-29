/* ============================================================================
   1d. TOKENS CHIBI — kit de desenho (personagens de corpo inteiro, cabeça grande,
   contorno marrom grosso, cores chapadas com um tom de sombra).
   Cada personagem fica sobre uma base oval na cor da classe.
   ============================================================================ */
const CB = (() => {
  const INK = '#2b1b17';

  const blob = (d, fill, sw = 4.5) =>
    `<path d="${d}" fill="${fill}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"/>`;
  const ell = (cx, cy, rx, ry, fill, sw = 4, rot = 0) =>
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${INK}" stroke-width="${sw}"${rot ? ` transform="rotate(${rot} ${cx} ${cy})"` : ''}/>`;
  const circ = (cx, cy, r, fill, sw = 4) =>
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${INK}" stroke-width="${sw}"/>`;
  /** Cápsula com contorno (braços, pernas, cabos). */
  const cap = (x1, y1, x2, y2, w, fill, sw = 4.5) =>
    `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${INK}" stroke-width="${w + sw * 2}" stroke-linecap="round" fill="none"/>` +
    `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${fill}" stroke-width="${w}" stroke-linecap="round" fill="none"/>`;
  /** Reflexo curto (brilho) em formas grandes. */
  const shine = (d, op = 0.55) => `<path d="${d}" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="${op}"/>`;

  const { mix, lighten, darken } = TK;

  /** Pernas curtas com botas. stance > 0 abre as pernas. */
  function legs({ pants, boot, stance = 0, bootStyle = 'round' }) {
    const lx = 114 - stance, rx = 142 + stance;
    const b = (x) => bootStyle === 'round'
      ? ell(x, 225, 15, 9.5, boot, 4.2)
      : blob(`M${x - 15} 214 L${x + 13} 214 L${x + 17} 228 Q${x} 234 ${x - 17} 228Z`, boot, 4.2);
    return `${cap(lx + 2, 184, lx, 217, 18, pants)}${cap(rx - 2, 184, rx, 217, 18, pants)}${b(lx - 1)}${b(rx + 1)}`;
  }

  /** Tronco curto e largo. */
  function torso({ fill, y = 138, w = 58 }) {
    const l = 128 - w / 2, r = 128 + w / 2;
    return blob(`M${l} ${y + 8} Q${l} ${y} ${l + 9} ${y} L${r - 9} ${y} Q${r} ${y} ${r} ${y + 8} L${r + 3} ${y + 46} Q128 ${y + 58} ${l - 3} ${y + 46}Z`, fill);
  }

  /** Braço de cápsula + mão. side -1 esquerda, +1 direita (da peça). */
  function arm(side, hx, hy, sleeve, skin, w = 17) {
    const sx = 128 + side * 28, sy = 150;
    return `${cap(sx, sy, hx, hy, w, sleeve)}${circ(hx, hy, 9.5, skin, 4)}`;
  }

  /**
   * Cabeça grande de chibi. Retorna { back, head } (orelhas + cabeça + rosto).
   * eyes: 'round' | 'angry' | 'happy' | 'narrow' | 'glare' | 'sleepy'
   * mouth: 'smile' | 'open' | 'grin' | 'frown' | 'snarl' | 'cat' | 'none'
   */
  function head(id, o = {}) {
    const {
      skin = '#f0bf98', cy = 96, rx = 50, ry = 46, eyes = 'round', eyeColor = '#4a78b8', mouth = 'smile',
      brow = '#3a2418', browTilt = 0, blush = true, ears = 'round', nose = true, browW = 4.5, eyeY = 8, spread = 20
    } = o;
    const dark = darken(skin, 0.28);
    const cx = 128;
    const ey = cy + eyeY;

    const eyeOne = (sx) => {
      const x = cx + sx * spread;
      if (eyes === 'happy') return `<path d="M${x - 9} ${ey + 3} Q${x} ${ey - 9} ${x + 9} ${ey + 3}" fill="none" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/>`;
      if (eyes === 'narrow') return `<path d="M${x - 10} ${ey + (sx < 0 ? 1 : -1)} Q${x} ${ey - 5} ${x + 10} ${ey + (sx < 0 ? -1 : 1)} Q${x} ${ey + 5} ${x - 10} ${ey + (sx < 0 ? 1 : -1)}Z" fill="#fff" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/><circle cx="${x + sx * -1}" cy="${ey}" r="3.6" fill="${eyeColor}"/><circle cx="${x + sx * -1}" cy="${ey}" r="1.8" fill="#14100e"/>`;
      if (eyes === 'sleepy') return `<path d="M${x - 9} ${ey} L${x + 9} ${ey}" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/>`;
      if (eyes === 'glare') return `<ellipse cx="${x}" cy="${ey}" rx="9.5" ry="9" fill="#fff" stroke="${INK}" stroke-width="3.6"/><ellipse cx="${x}" cy="${ey + 1}" rx="3" ry="7.2" fill="${eyeColor}" stroke="${INK}" stroke-width="1.2"/><ellipse cx="${x}" cy="${ey + 1}" rx="1.3" ry="6" fill="#14100e"/><path d="M${x - 11} ${ey - 5 - sx * 3} L${x + 11} ${ey - 5 + sx * 3}" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`;
      const lid = eyes === 'angry' ? `<path d="M${x - 11} ${ey - 7 - sx * -2.5} L${x + 11} ${ey - 7 + sx * -2.5}" stroke="${INK}" stroke-width="5.5" stroke-linecap="round"/>` : '';
      return `<ellipse cx="${x}" cy="${ey}" rx="8" ry="${eyes === 'angry' ? 8 : 10}" fill="${eyeColor}" stroke="${INK}" stroke-width="3.6"/>
        <ellipse cx="${x}" cy="${ey + 1}" rx="4.8" ry="${eyes === 'angry' ? 5.6 : 7.4}" fill="#16100e"/>
        <circle cx="${x - 2.4}" cy="${ey - 3}" r="2.8" fill="#fff"/><circle cx="${x + 2.6}" cy="${ey + 3.4}" r="1.4" fill="#fff"/>${lid}`;
    };

    const browOne = (sx) => {
      const x = cx + sx * spread;
      const inner = ey - 17 + browTilt * 4, outer = ey - 17 - browTilt * 4;
      return `<path d="M${x - sx * 10} ${inner} Q${x} ${(inner + outer) / 2 - 3} ${x + sx * 12} ${outer}" fill="none" stroke="${brow}" stroke-width="${browW}" stroke-linecap="round"/>`;
    };

    const my = cy + 30;
    const mouthSVG = {
      smile: `<path d="M${cx - 9} ${my} Q${cx} ${my + 8} ${cx + 9} ${my}" fill="none" stroke="${INK}" stroke-width="3.6" stroke-linecap="round"/>`,
      cat: `<path d="M${cx - 12} ${my - 1} Q${cx - 6} ${my + 7} ${cx} ${my} Q${cx + 6} ${my + 7} ${cx + 12} ${my - 1}" fill="none" stroke="${INK}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>`,
      frown: `<path d="M${cx - 9} ${my + 5} Q${cx} ${my - 3} ${cx + 9} ${my + 5}" fill="none" stroke="${INK}" stroke-width="3.8" stroke-linecap="round"/>`,
      open: `<path d="M${cx - 12} ${my - 2} Q${cx} ${my + 20} ${cx + 12} ${my - 2}Z" fill="#7a1f2a" stroke="${INK}" stroke-width="3.6" stroke-linejoin="round"/><path d="M${cx - 6} ${my + 8} Q${cx} ${my + 4} ${cx + 6} ${my + 8} Q${cx} ${my + 13} ${cx - 6} ${my + 8}Z" fill="#e8737a"/>`,
      grin: `<path d="M${cx - 15} ${my - 3} Q${cx} ${my + 18} ${cx + 15} ${my - 3}Z" fill="#7a1f2a" stroke="${INK}" stroke-width="3.6" stroke-linejoin="round"/><path d="M${cx - 12} ${my - 1} L${cx + 12} ${my - 1} L${cx + 9} ${my + 5} L${cx - 9} ${my + 5}Z" fill="#fff"/>`,
      snarl: `<path d="M${cx - 14} ${my - 2} Q${cx} ${my + 14} ${cx + 14} ${my - 2}Z" fill="#7a1f2a" stroke="${INK}" stroke-width="3.6" stroke-linejoin="round"/><path d="M${cx - 11} ${my} L${cx - 7} ${my + 8} L${cx - 3} ${my + 1} M${cx + 11} ${my} L${cx + 7} ${my + 8} L${cx + 3} ${my + 1}" fill="#fff" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`,
      none: ''
    }[mouth];

    const earSVG = ears === 'none' ? '' : ears === 'pointed'
      ? blob(`M${cx - rx + 4} ${cy - 6} L${cx - rx - 30} ${cy - 24} L${cx - rx - 2} ${cy + 14}Z`, skin, 4.2) + blob(`M${cx + rx - 4} ${cy - 6} L${cx + rx + 30} ${cy - 24} L${cx + rx + 2} ${cy + 14}Z`, skin, 4.2)
      : ears === 'big'
        ? blob(`M${cx - rx + 4} ${cy - 10} Q${cx - rx - 36} ${cy - 34} ${cx - rx - 26} ${cy + 10} Q${cx - rx - 12} ${cy + 18} ${cx - rx + 6} ${cy + 12}Z`, skin, 4.2) + blob(`M${cx + rx - 4} ${cy - 10} Q${cx + rx + 36} ${cy - 34} ${cx + rx + 26} ${cy + 10} Q${cx + rx + 12} ${cy + 18} ${cx + rx - 6} ${cy + 12}Z`, skin, 4.2)
        : ell(cx - rx + 1, cy + 6, 8, 11, skin, 4) + ell(cx + rx - 1, cy + 6, 8, 11, skin, 4);

    const blushSVG = blush ? `<ellipse cx="${cx - 33}" cy="${cy + 22}" rx="8" ry="5" fill="#e8736a" opacity="0.45"/><ellipse cx="${cx + 33}" cy="${cy + 22}" rx="8" ry="5" fill="#e8736a" opacity="0.45"/>` : '';
    const noseSVG = nose ? `<path d="M${cx - 2} ${cy + 20} q2 3 4 0" fill="none" stroke="${dark}" stroke-width="2.6" stroke-linecap="round"/>` : '';

    return {
      back: earSVG,
      head: `<g filter="url(#cel_${id})">${ell(cx, cy, rx, ry, skin, 4.8)}</g>
        ${blushSVG}${browOne(-1)}${browOne(1)}${eyeOne(-1)}${eyeOne(1)}${noseSVG}${mouthSVG}`
    };
  }

  /** Moldura: sombra, base oval na cor da classe, filtros de contorno e sombreamento. */
  function frame(id, { faction, accent, art }) {
    const a = art(id);
    const ring = faction === 'hero' ? '#fff3c4' : '#ff6a6a';
    const region = 'filterUnits="userSpaceOnUse" x="-24" y="-24" width="304" height="304" color-interpolation-filters="sRGB"';
    const shade = `<feOffset in="SourceAlpha" dx="-6" dy="-7" result="o1"/><feComposite in="SourceAlpha" in2="o1" operator="out" result="cres"/><feFlood flood-color="#3a1840" flood-opacity="0.24"/><feComposite in2="cres" operator="in" result="shade"/>
      <feOffset in="SourceAlpha" dx="3" dy="4" result="o2"/><feComposite in="SourceAlpha" in2="o2" operator="out" result="rim"/><feFlood flood-color="#ffffff" flood-opacity="0.3"/><feComposite in2="rim" operator="in" result="hi"/>`;
    return `<svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="ink_${id}" ${region}>
      <feMorphology in="SourceAlpha" operator="dilate" radius="3.2" result="d"/><feFlood flood-color="${INK}"/><feComposite in2="d" operator="in" result="outline"/>
      ${shade}
      <feMerge><feMergeNode in="outline"/><feMergeNode in="SourceGraphic"/><feMergeNode in="shade"/><feMergeNode in="hi"/></feMerge>
    </filter>
    <filter id="cel_${id}" ${region}>
      ${shade}
      <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="shade"/><feMergeNode in="hi"/></feMerge>
    </filter>
    ${a.defs || ''}
  </defs>
  <ellipse cx="128" cy="240" rx="80" ry="14" fill="#000" opacity="0.3"/>
  <ellipse cx="128" cy="233" rx="72" ry="15" fill="${accent}" stroke="${INK}" stroke-width="4.5"/>
  <ellipse cx="128" cy="233" rx="58" ry="10" fill="none" stroke="${ring}" stroke-width="2.4" stroke-dasharray="3 6" opacity="0.9"/>
  <ellipse cx="108" cy="229" rx="28" ry="3.5" fill="#fff" opacity="0.28"/>
  <g filter="url(#ink_${id})">${a.body}</g>
  ${a.over ? `<g filter="url(#ink_${id})">${a.over}</g>` : ''}
</svg>`;
  }

  return { INK, blob, ell, circ, cap, shine, legs, torso, arm, head, frame, mix, lighten, darken };
})();

const CHIBI_SVGS = {};
