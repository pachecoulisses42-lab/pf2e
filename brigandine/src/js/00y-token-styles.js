/* ============================================================================
   1g. TOKENS — estilos disponíveis e seleção do estilo ativo
   ============================================================================ */
const TOKEN_STYLES = {
  chibi: { label: 'Chibi', svgs: CHIBI_SVGS },
  medalhao: { label: 'Medalhão', svgs: MEDALLION_SVGS }
};
const DEFAULT_TOKEN_STYLE = 'chibi';

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
