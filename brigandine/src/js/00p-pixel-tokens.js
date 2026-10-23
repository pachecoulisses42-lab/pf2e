/* ============================================================================
   1p. TOKENS EM PIXEL ART — protótipo "Pixel Tokens v2"
   Folhas de 8 quadros × 5 linhas (parado, andar, ataque, atingido, morte), quadros
   de 128 px. As imagens ficam em src/tokens-pixel/ e o build as embute em
   PIXEL_TOKEN_SHEETS. Chaves px_<nome>. Desenho no tabuleiro: 07g.
   ============================================================================ */
const PIXEL_TOKEN_LIST = typeof PIXEL_TOKEN_SHEETS !== 'undefined' ? PIXEL_TOKEN_SHEETS : [];
const PIXEL_TOKENS = Object.fromEntries(PIXEL_TOKEN_LIST.map(t => [t.key, t]));
const PIXEL_IMAGES = {};
const PIXEL_THUMBS = {};

function isPixelToken(key) {
  return typeof key === 'string' && Object.prototype.hasOwnProperty.call(PIXEL_TOKENS, key);
}

/** Folha carregada (Image); redesenha o tabuleiro quando termina de carregar. */
function pixelSheetImage(key) {
  if (!PIXEL_IMAGES[key]) {
    const img = new Image();
    img.onload = () => { if (typeof requestRender === 'function') requestRender(); };
    img.src = PIXEL_TOKENS[key].src;
    PIXEL_IMAGES[key] = img;
  }
  return PIXEL_IMAGES[key];
}

/** Miniatura: o primeiro quadro "parado", recortado na figura e ampliado sem suavizar. */
function pixelThumbnail(key) {
  if (PIXEL_THUMBS[key]) return PIXEL_THUMBS[key];
  if (typeof document === 'undefined') return '';
  const t = PIXEL_TOKENS[key];
  const img = pixelSheetImage(key);
  if (!img.complete || !img.naturalWidth) return t.src; // ainda carregando: a folha inteira serve de marcador
  const [x0, y0, x1, y1] = t.box;
  const side = Math.max(x1 - x0, y1 - y0) + 6;
  const k = 3;
  const c = document.createElement('canvas');
  c.width = c.height = side * k;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  g.drawImage(img, x0, y0, x1 - x0, y1 - y0, ((side - (x1 - x0)) / 2) * k, (side - (y1 - y0) - 3) * k, (x1 - x0) * k, (y1 - y0) * k);
  PIXEL_THUMBS[key] = c.toDataURL('image/png');
  return PIXEL_THUMBS[key];
}
