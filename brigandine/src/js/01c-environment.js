/* ============================================================================
   2c. AMBIENTE — terreno, objetos, perigos, clima e luz (dados e regras puras)
   Distâncias em metros. Luz: `bright` = luz plena (anula escuridão), `dim` =
   penumbra (escuridão pela metade). Toda fonte de luz nova precisa decidir como
   interage com a escuridão (ver CLAUDE.md do projeto).
   ============================================================================ */

/**
 * Terrenos pintados por célula. move: multiplicador do custo de movimento (null = intransponível).
 * blocksLight: a luz não atravessa. As chaves antigas (difficult, wall, hazard) continuam valendo.
 */
const TERRAIN_TYPES = {
  chao:      { label: 'Chão',      move: 1,    blocksLight: false, desc: 'Piso de pedra' },
  terra:     { label: 'Terra',     move: 1,    blocksLight: false, desc: 'Terra batida' },
  lama:      { label: 'Lama',      move: 2,    blocksLight: false, desc: 'Terreno difícil' },
  neve:      { label: 'Neve',      move: 2,    blocksLight: false, desc: 'Terreno difícil' },
  agua:      { label: 'Água',      move: 2,    blocksLight: false, desc: 'Terreno difícil (nadar)' },
  abismo:    { label: 'Abismo',    move: null, blocksLight: false, desc: 'Intransponível' },
  difficult: { label: 'Difícil',   move: 2,    blocksLight: false, desc: 'Escombros, mato' },
  wall:      { label: 'Parede',    move: null, blocksLight: true,  desc: 'Bloqueia passagem e luz' },
  hazard:    { label: 'Perigo',    move: 1,    blocksLight: false, desc: 'Marcação de área perigosa' }
};

/** Objetos posicionados numa célula. light: fonte de luz própria (emanação). */
const OBJECT_TYPES = {
  pedra:        { label: 'Pedra',          move: null, blocksLight: false },
  cadeira:      { label: 'Cadeira',        move: 2,    blocksLight: false },
  mesa:         { label: 'Mesa',           move: 2,    blocksLight: false },
  barril:       { label: 'Barril',         move: null, blocksLight: false },
  bau:          { label: 'Baú',            move: null, blocksLight: false },
  arvore:       { label: 'Árvore',         move: null, blocksLight: false },
  muro:         { label: 'Muro',           move: null, blocksLight: true },
  tocha_parede: { label: 'Tocha de parede', move: 1,   blocksLight: false, light: { shape: 'emanation', bright: 6, dim: 12 } },
  braseiro:     { label: 'Braseiro',       move: null, blocksLight: false, light: { shape: 'emanation', bright: 6, dim: 12 } },
  lampiao:      { label: 'Lampião',        move: 1,    blocksLight: false, light: { shape: 'emanation', bright: 9, dim: 18 } },
  cristal_luz:  { label: 'Cristal de luz', move: 1,    blocksLight: false, light: { shape: 'emanation', bright: 6, dim: 12 } }
};

/** Perigos: dano a quem termina o movimento na célula (combate). A fogueira também ilumina. */
const HAZARD_TYPES = {
  espinhos:       { label: 'Espinhos',          dmgDie: '1d6', dmgType: 'perfurante' },
  fogueira:       { label: 'Fogueira',          dmgDie: '1d6', dmgType: 'fogo', light: { shape: 'emanation', bright: 6, dim: 12 } },
  acido:          { label: 'Poça de ácido',     dmgDie: '1d6', dmgType: 'ácido' },
  armadilha_urso: { label: 'Armadilha de urso', dmgDie: '1d8', dmgType: 'perfurante' },
  runa_explosiva: { label: 'Runa explosiva',    dmgDie: '2d6', dmgType: 'força' }
};

/** Clima e ambiente (menu Tabuleiro). Só a escuridão interage com a luz. */
const EFFECT_TYPES = {
  nevoa:     { label: 'Névoa' },
  escuridao: { label: 'Escuridão', darkness: true },
  chuva:     { label: 'Chuva' },
  nevasca:   { label: 'Nevasca' },
  fumaca:    { label: 'Fumaça' }
};

/** Formas de pintura. needsDrag: definida arrastando da origem até a direção/canto. */
const PAINT_SHAPES = {
  cell:      { label: 'Célula' },
  burst:     { label: 'Raio', sized: true },
  emanation: { label: 'Emanação', sized: true, effectOnly: true },
  cone:      { label: 'Cone', sized: true, needsDrag: true },
  line:      { label: 'Linha', sized: true, needsDrag: true },
  square:    { label: 'Quadrado', needsDrag: true },
  all:       { label: 'Tudo' }
};

/** Transparência dos menus: 0 % (opaco) a 90 %. */
const TRANSPARENCY_MIN = 0;
const TRANSPARENCY_MAX = 90;

function clampTransparency(v) {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.max(TRANSPARENCY_MIN, Math.min(TRANSPARENCY_MAX, n)) : 50;
}

/** Opacidade (0–1) a partir da transparência em %. */
function opacityFromTransparency(t) {
  return 1 - clampTransparency(t) / 100;
}

/**
 * Custo de entrar numa célula: maior multiplicador entre terreno e objeto; null = não dá para entrar.
 * Perigos não alteram o custo.
 */
function cellMoveMultiplier(terrainKey, objectType) {
  const t = TERRAIN_TYPES[terrainKey];
  const o = OBJECT_TYPES[objectType];
  const tm = t ? t.move : 1;
  const om = o ? o.move : 1;
  if (tm === null || om === null) return null;
  return Math.max(tm, om);
}

function cellBlocksLight(terrainKey, objectType) {
  return !!(TERRAIN_TYPES[terrainKey]?.blocksLight || OBJECT_TYPES[objectType]?.blocksLight);
}

/** Luz de um item carregado (tocha, lanterna…) ou null. */
function itemLight(item) {
  return item && item.kind === 'light' && item.light ? item.light : null;
}

/**
 * Nível de escuridão numa célula: 1 = escuro, 0.5 = penumbra, 0 = iluminado ou sem escuridão.
 * lightLevel: 2 = luz plena, 1 = penumbra, 0 = nada.
 */
function darknessAt(hasDarkness, lightLevel) {
  if (!hasDarkness) return 0;
  if (lightLevel >= 2) return 0;
  if (lightLevel === 1) return 0.5;
  return 1;
}

/** Normaliza o pacote de ambiente salvo (arquivos antigos não têm nada disso). */
function normalizeEnvironment(data = {}) {
  const objects = (Array.isArray(data.objects) ? data.objects : [])
    .filter((o) => o && (OBJECT_TYPES[o.type] || HAZARD_TYPES[o.type]) && Number.isInteger(o.col) && Number.isInteger(o.row))
    .map((o) => ({ id: String(o.id || `o_${o.col}_${o.row}_${o.type}`), type: o.type, col: o.col, row: o.row }));
  const effects = {};
  for (const type of Object.keys(EFFECT_TYPES)) {
    const src = data.effects && data.effects[type];
    const keys = Array.isArray(src) ? src : (src && typeof src === 'object' ? Object.keys(src) : []);
    effects[type] = {};
    for (const k of keys) if (/^\d+,\d+$/.test(k)) effects[type][k] = 1;
  }
  const zones = (Array.isArray(data.effectZones) ? data.effectZones : [])
    .filter((z) => z && EFFECT_TYPES[z.type] && typeof z.unitId === 'string' && Number(z.radius) > 0)
    .map((z) => ({ id: String(z.id || `z_${z.unitId}_${z.type}`), type: z.type, unitId: z.unitId, radius: Number(z.radius) }));
  const layers = data.layers || {};
  return {
    objects, effects, effectZones: zones,
    layers: {
      terrain: clampTransparency(layers.terrain ?? 50),
      effects: clampTransparency(layers.effects ?? 50),
      map: clampTransparency(layers.map ?? 0)
    }
  };
}

/* ---------------- Visão e luz (Pathfinder 2e Remaster, Player Core) ----------------
   Luz plena: todos veem. Penumbra: oculto (teste simples CD 5) para quem não tem visão
   na penumbra nem visão no escuro. Escuridão: escondido (CD 11; quem está escondido deixa
   o alvo desprevenido, −2 CA) para quem não tem visão no escuro; quem está na escuridão
   sem visão no escuro fica cego (terreno normal vira difícil, −4 em Percepção).
   Efeitos em área não fazem teste simples. */

const VISION_TYPES = {
  normal: 'Visão normal',
  'low-light': 'Visão na penumbra',
  darkvision: 'Visão no escuro'
};

/** Visão padrão por ancestralidade (valores do compêndio PF2e). Texto já sem acentos, minúsculo. */
const ANCESTRY_VISION_RULES = [
  [/^(anao|anan|dwarf|goblin|hobgoblin|orc|meio orc|kobold|morto vivo|undead|esqueleto|kappa|fera das sombras|espirito|fetchling|dragonete)/, 'darkvision'],
  [/^(elf|meio elf|half elf|gnom|kitsune|tengu|nagaji|fera|catfolk|ratfolk|sangue de dragao|tanuki|vanara|lizardfolk)/, 'low-light']
];

function foldText(s) {
  return String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function ancestryVision(ancestry) {
  const t = foldText(ancestry);
  for (const [re, v] of ANCESTRY_VISION_RULES) if (re.test(t)) return v;
  return 'normal';
}

/** Visão da peça: escolhida na aba Base ou, em "automática", pela ancestralidade. */
function unitVision(unit) {
  const v = unit && unit.sheet && unit.sheet.vision;
  return VISION_TYPES[v] ? v : ancestryVision(unit && unit.sheet && unit.sheet.ancestry);
}

/** Nível de luz a partir do nível de escuridão da célula (0, 0.5, 1). */
function lightLevelFromDarkness(d) {
  return d >= 1 ? 'dark' : d > 0 ? 'dim' : 'bright';
}

/** Como um observador com essa visão percebe uma criatura nesse nível de luz. */
function visibilityFor(lightLevel, observerVision) {
  if (lightLevel === 'dark') return observerVision === 'darkvision' ? 'observed' : 'hidden';
  if (lightLevel === 'dim') return observerVision === 'normal' ? 'concealed' : 'observed';
  return 'observed';
}

const VISIBILITY_LABELS = { observed: 'observado', concealed: 'oculto', hidden: 'escondido' };

/** CD do teste simples para mirar uma criatura (0 = não precisa). */
function flatCheckDC(visibility) {
  return visibility === 'hidden' ? 11 : visibility === 'concealed' ? 5 : 0;
}

/** Chance de passar num teste simples de CD dada (d20 ≥ CD). */
function flatCheckChance(dc) {
  return dc > 0 ? Math.max(0, Math.min(1, (21 - dc) / 20)) : 1;
}

/** Cego: está na escuridão sem visão no escuro. */
function isBlindedBy(lightLevel, vision) {
  return lightLevel === 'dark' && vision !== 'darkvision';
}
