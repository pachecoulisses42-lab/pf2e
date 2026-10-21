/* ============================================================================
   1c. TOKENS — carregamento (cache de imagens e pré-visualização HTML)
   ============================================================================ */
const SVG_IMAGE_CACHE = {};
function getUnitTokenImage(unitOrSculpt, customDataUrl = null) {
  if (customDataUrl) {
    if (SVG_IMAGE_CACHE[customDataUrl]) return SVG_IMAGE_CACHE[customDataUrl];
    const img = new Image();
    img.src = customDataUrl;
    img.onload = () => requestRender();
    SVG_IMAGE_CACHE[customDataUrl] = img;
    return img;
  }
  const key = typeof unitOrSculpt === 'string' ? unitOrSculpt : unitOrSculpt.sculpt;
  if (SVG_IMAGE_CACHE[key]) return SVG_IMAGE_CACHE[key];
  const svgFn = SCULPT_SVGS[key] || SCULPT_SVGS.guerreiro;
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

function getTokenPreviewHTML(sculptKey, customDataUrl = null) {
  if (customDataUrl) {
    return `<img src="${customDataUrl}" alt="" style="width:100%; height:100%; object-fit:contain;"/>`;
  }
  const svgFn = SCULPT_SVGS[sculptKey] || SCULPT_SVGS.guerreiro;
  return uniquifySvgIds(svgFn());
}
