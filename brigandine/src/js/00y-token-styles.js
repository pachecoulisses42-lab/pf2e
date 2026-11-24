/* ============================================================================
   1g. TOKENS — estilos disponíveis e seleção do estilo ativo
   ============================================================================ */
const TOKEN_STYLES = {
  chibi: { label: 'Chibi', svgs: CHIBI_SVGS },
  topo: { label: 'Vista de cima', svgs: TOPDOWN_SVGS }
};
/** Estilos que deixaram de existir e o estilo que os substitui (preferências salvas). */
const RETIRED_TOKEN_STYLES = { medalhao: 'topo' };
const DEFAULT_TOKEN_STYLE = 'chibi';

/** Personagens vilões (moldura de imagem importada e selo na documentação). */
const VILLAIN_SCULPTS = new Set(['goblin', 'lobo', 'bandido', 'esqueleto', 'orc', 'cultista', 'zumbi', 'kobold']);

/** Mapa ativo usado por todo o app: key de personagem -> função que devolve o SVG. */
const SCULPT_SVGS = {};
let activeTokenStyle = DEFAULT_TOKEN_STYLE;

function setTokenStyle(style) {
  const wanted = RETIRED_TOKEN_STYLES[style] || style;
  const key = TOKEN_STYLES[wanted] ? wanted : DEFAULT_TOKEN_STYLE;
  activeTokenStyle = key;
  for (const k of Object.keys(SCULPT_SVGS)) delete SCULPT_SVGS[k];
  Object.assign(SCULPT_SVGS, TOKEN_STYLES[key].svgs);
}
setTokenStyle(DEFAULT_TOKEN_STYLE);
