/* ============================================================================
   1g. TOKENS — estilos disponíveis e seleção do estilo ativo
   ============================================================================ */
const TOKEN_STYLES = {
  chibi: { label: 'Chibi', svgs: CHIBI_SVGS },
  medalhao: { label: 'Medalhão', svgs: MEDALLION_SVGS }
};
const DEFAULT_TOKEN_STYLE = 'chibi';

/** Personagens vilões (define a moldura do medalhão e o selo na documentação). */
const VILLAIN_SCULPTS = new Set(['goblin', 'lobo', 'bandido', 'esqueleto', 'orc', 'cultista', 'zumbi', 'kobold']);

/**
 * Personagens que só existem em chibi ganham um medalhão automático: o chibi recortado
 * em círculo dentro do aro (ouro para heróis, ferro para vilões).
 */
function chibiAsMedallion(key) {
  return () => buildCustomTokenSVG(
    'data:image/svg+xml;utf8,' + encodeURIComponent(CHIBI_SVGS[key]()),
    { faction: VILLAIN_SCULPTS.has(key) ? 'villain' : 'hero', framed: true, zoom: 1.4, focusY: 118 }
  );
}
for (const key of Object.keys(CHIBI_SVGS)) {
  if (!MEDALLION_SVGS[key]) MEDALLION_SVGS[key] = chibiAsMedallion(key);
}

/** Mapa ativo usado por todo o app: key de personagem -> função que devolve o SVG. */
const SCULPT_SVGS = {};
let activeTokenStyle = DEFAULT_TOKEN_STYLE;

function setTokenStyle(style) {
  const key = TOKEN_STYLES[style] ? style : DEFAULT_TOKEN_STYLE;
  activeTokenStyle = key;
  for (const k of Object.keys(SCULPT_SVGS)) delete SCULPT_SVGS[k];
  Object.assign(SCULPT_SVGS, TOKEN_STYLES[key].svgs);
}
setTokenStyle(DEFAULT_TOKEN_STYLE);
