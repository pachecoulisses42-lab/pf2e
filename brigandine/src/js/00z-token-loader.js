/* ============================================================================
   1c. TOKENS — carregamento (cache de imagens e pré-visualização HTML)
   ============================================================================ */
const SVG_IMAGE_CACHE = {};

/** Hash curto para chaves de cache de imagens grandes (djb2). */
function hashString(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36) + str.length.toString(36);
}

/**
 * Token a partir de uma imagem do usuário.
 *  framed = true  -> recortada em círculo, dentro do aro (ouro para heróis, ferro para vilões)
 *  framed = false -> imagem inteira, sem moldura (ideal para PNG com fundo transparente)
 */
function buildCustomTokenSVG(dataUrl, { faction = 'hero', framed = true, zoom = 1, focusY = 128 } = {}) {
  if (!framed) {
    return `<svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"><image href="${dataUrl}" x="0" y="0" width="256" height="256" preserveAspectRatio="xMidYMid meet"/></svg>`;
  }
  const hero = faction === 'hero';
  const rim = hero ? ['#fff1b8', '#d9ac4a', '#6b4b12'] : ['#c9bcbc', '#5f4d50', '#1b1214'];
  const stud = hero ? '#fff7d1' : '#ff5b5b';
  return `<svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cr" x1="0.1" y1="0" x2="0.9" y2="1"><stop offset="0" stop-color="${rim[0]}"/><stop offset="0.45" stop-color="${rim[1]}"/><stop offset="1" stop-color="${rim[2]}"/></linearGradient>
    <clipPath id="cc"><circle cx="128" cy="128" r="108"/></clipPath>
    <radialGradient id="cv" cx="0.5" cy="0.5" r="0.5"><stop offset="0.6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.5"/></radialGradient>
  </defs>
  <circle cx="128" cy="130" r="124" fill="#000" opacity="0.35"/>
  <circle cx="128" cy="128" r="124" fill="url(#cr)"/>
  <circle cx="128" cy="128" r="124.5" fill="none" stroke="#06060c" stroke-width="3"/>
  <circle cx="128" cy="128" r="123" fill="none" stroke="#fff" stroke-opacity="0.35" stroke-width="1.5"/>
  <circle cx="128" cy="128" r="116" fill="none" stroke="${stud}" stroke-width="4.2" stroke-dasharray="1.2 20.6" stroke-linecap="round" opacity="0.9"/>
  <circle cx="128" cy="128" r="111" fill="none" stroke="#000" stroke-opacity="0.45" stroke-width="3"/>
  <circle cx="128" cy="128" r="108" fill="#10141a"/>
  <g clip-path="url(#cc)"><image href="${dataUrl}" x="${(128 - 108 * zoom).toFixed(1)}" y="${(128 - (focusY / 256) * 216 * zoom).toFixed(1)}" width="${(216 * zoom).toFixed(1)}" height="${(216 * zoom).toFixed(1)}" preserveAspectRatio="xMidYMid slice"/><circle cx="128" cy="128" r="108" fill="url(#cv)"/></g>
  <circle cx="128" cy="128" r="108" fill="none" stroke="#06060c" stroke-width="2"/>
</svg>`;
}

/** Opções de renderização de um token personalizado a partir da peça/modelo. */
function customTokenOptions(unitLike) {
  return { faction: (unitLike && unitLike.faction) || 'hero', framed: !unitLike || unitLike.customTokenFrame !== false };
}

function getUnitTokenImage(unitOrSculpt, customDataUrl = null, options = {}) {
  if (customDataUrl) {
    const opts = { faction: 'hero', framed: true, ...options };
    const key = `custom:${hashString(customDataUrl)}:${opts.faction}:${opts.framed}`;
    if (SVG_IMAGE_CACHE[key]) return SVG_IMAGE_CACHE[key];
    const img = new Image();
    img.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(buildCustomTokenSVG(customDataUrl, opts));
    img.onload = () => requestRender();
    SVG_IMAGE_CACHE[key] = img;
    return img;
  }
  const sculpt = typeof unitOrSculpt === 'string' ? unitOrSculpt : unitOrSculpt.sculpt;
  const key = `${activeTokenStyle}:${sculpt}`;
  if (SVG_IMAGE_CACHE[key]) return SVG_IMAGE_CACHE[key];
  const svgFn = SCULPT_SVGS[sculpt] || SCULPT_SVGS.guerreiro;
  const img = new Image();
  img.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(svgFn());
  img.onload = () => requestRender();
  SVG_IMAGE_CACHE[key] = img;
  return img;
}

/**
 * SVGs inline compartilham o namespace de ids do documento. Gradientes dentro de um
 * container `display:none` não renderizam, então cada instância ganha ids exclusivos.
 */
let svgInstanceCounter = 0;
function uniquifySvgIds(svg) {
  const suffix = `_i${++svgInstanceCounter}`;
  return svg
    .replace(/\bid="([^"]+)"/g, (_, id) => `id="${id}${suffix}"`)
    .replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${id}${suffix})`);
}

function getTokenPreviewHTML(sculptKey, customDataUrl = null, options = {}) {
  if (customDataUrl) {
    return uniquifySvgIds(buildCustomTokenSVG(customDataUrl, { faction: 'hero', framed: true, ...options }));
  }
  const svgFn = SCULPT_SVGS[sculptKey] || SCULPT_SVGS.guerreiro;
  return uniquifySvgIds(svgFn());
}
