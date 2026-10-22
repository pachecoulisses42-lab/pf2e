/* ============================================================================
   2d. ANIMAÇÕES — escolha da animação (funções puras)
   Qual animação cada arma, magia ou item usa e quanto ela dura. O desenho fica
   em 07d-animations.js. Ver docs/PLANO-ANIMACOES.md.
   ============================================================================ */

/** Duração por ritmo: armas no "normal", magias e efeitos mágicos no "cinema" (decisão do dono). */
const ANIM_PACE_MS = { normal: 900, cinema: 1400 };

/** Animações de arma que o editor oferece (auto = decide pelo nome, alcance e tipo de dano). */
const WEAPON_ANIMS = {
  auto: 'Automática',
  slash: 'Corte',
  thrust: 'Estocada',
  bash: 'Impacto',
  claw: 'Garras / mordida',
  arrow: 'Flecha',
  bolt: 'Virote',
  thrown: 'Arremesso',
  bomb: 'Bomba',
  shot: 'Tiro',
  energy: 'Disparo de energia'
};

/** Animações de magia: uma por magia do catálogo + quatro genéricas para magias novas. */
const SPELL_ANIMS = {
  auto: 'Automática',
  orb: 'Projétil mágico',
  beam: 'Feixe',
  explosion: 'Explosão',
  touch: 'Toque',
  lightning: 'Relâmpago',
  fireball: 'Bola de fogo',
  sound: 'Ondas sonoras',
  crystal_flame: 'Chama cristalina',
  radiant: 'Coluna de luz',
  shock: 'Faíscas',
  arcane_ray: 'Raio arcano',
  thorns: 'Espinhos do chão',
  wind: 'Lâminas de vento',
  ice: 'Estilhaços de gelo',
  curse: 'Maldição sombria',
  ki: 'Rajada de ki',
  shadow_hand: 'Mão de sombra',
  divine_spear: 'Lança de luz',
  missiles: 'Mísseis mágicos',
  fox_fire: 'Fogo-fátuo',
  water: 'Jato d\'água',
  breath: 'Sopro de fogo',
  eidolon: 'Investida espectral',
  bonfire: 'Colunas de fogo',
  howl: 'Uivo espectral'
};

/** Animação própria de cada magia do catálogo (pelo id). */
const SPELL_ANIM_BY_ID = {
  relampago: 'lightning',
  bola_de_fogo: 'fireball',
  acorde_dissonante: 'sound',
  chama_cristalina: 'crystal_flame',
  julgamento_divino: 'radiant',
  toque_chocante: 'shock',
  raio_arcano: 'arcane_ray',
  espinhos_vivos: 'thorns',
  vento_cortante: 'wind',
  estilhacos_de_gelo: 'ice',
  maldicao_sombria: 'curse',
  rajada_de_ki: 'ki',
  toque_sombrio: 'shadow_hand',
  lanca_divina: 'divine_spear',
  fogo_de_raposa: 'fox_fire',
  jato_de_agua: 'water',
  sopro_draconico: 'breath',
  investida_eidolon: 'eidolon',
  fogueira_goblin: 'bonfire',
  uivo_espectral: 'howl',
  misseis_magicos: 'missiles'
};

/** Cor principal por tipo de dano (brilho, partículas, rastro). */
const DAMAGE_ANIM_COLORS = {
  cortante: '#f1f5f9', perfurante: '#e2e8f0', contundente: '#e7d3b0',
  fogo: '#ff7a1a', 'gélido': '#9be7ff', 'elétrico': '#a5d8ff', 'ácido': '#a3e635', 'sônico': '#f0abfc',
  espiritual: '#fde68a', vital: '#86efac', veneno: '#84cc16', mental: '#f472b6', 'força': '#c084fc',
  'precisão': '#f8fafc'
};

const PHYSICAL_DAMAGE = ['cortante', 'perfurante', 'contundente', 'precisão'];

function damageAnimColor(type) {
  return DAMAGE_ANIM_COLORS[type] || '#e2e8f0';
}

const animLowerName = (o) => String((o && o.name) || '').toLowerCase();

/** Animação de uma arma: escolha manual, senão pelo nome, depois alcance e tipo de dano. */
function weaponAnimKind(w) {
  if (w && w.anim && w.anim !== 'auto' && WEAPON_ANIMS[w.anim]) return w.anim;
  const n = animLowerName(w);
  const type = (w && w.dmgType) || '';
  const ranged = ((w && w.reach) || 1.5) > 3;
  if (/\bbesta\b/.test(n)) return 'bolt';
  if (/\barcos?\b/.test(n)) return 'arrow';
  if (/pistola|arcabuz|mosquete|bacamarte|arma de fogo/.test(n)) return 'shot';
  if (/bomba|frasco|granada/.test(n)) return 'bomb';
  if (/mand[íi]bula|mordida|garra|presa|dentes/.test(n)) return 'claw';
  if (/azagaia|arremess|shuriken|funda|dardo|machadinha|chakram|bumerangue/.test(n)) return 'thrown';
  if (ranged) {
    if (!PHYSICAL_DAMAGE.includes(type) && type) return 'energy';
    return type === 'perfurante' ? 'arrow' : 'thrown';
  }
  if (type === 'perfurante') return 'thrust';
  if (type === 'contundente') return 'bash';
  return 'slash';
}

/** Animação de uma magia: escolha manual, a do catálogo, ou uma genérica pela área e alcance. */
function spellAnimKind(sp) {
  if (sp && sp.anim && sp.anim !== 'auto' && SPELL_ANIMS[sp.anim]) return sp.anim;
  if (sp && sp.id && SPELL_ANIM_BY_ID[sp.id]) return SPELL_ANIM_BY_ID[sp.id];
  if (sp && sp.areaType === 'line') return 'beam';
  if (sp && sp.areaType === 'burst') return 'explosion';
  if (sp && (sp.range || 0) <= 1.5) return 'touch';
  return 'orb';
}

/** Momento do impacto (0–1) dentro da animação: dano, número e barra de PV aparecem aí. */
const ANIM_IMPACT_AT = {
  slash: 0.42, thrust: 0.38, bash: 0.45, claw: 0.4,
  arrow: 0.55, bolt: 0.5, thrown: 0.6, bomb: 0.6, shot: 0.25, energy: 0.5,
  orb: 0.5, beam: 0.3, explosion: 0.5, touch: 0.35,
  lightning: 0.25, fireball: 0.5, sound: 0.55, crystal_flame: 0.5, radiant: 0.45, shock: 0.35,
  arcane_ray: 0.35, thorns: 0.45, wind: 0.45, ice: 0.5, curse: 0.5, ki: 0.45, shadow_hand: 0.5,
  divine_spear: 0.5, missiles: 0.6, fox_fire: 0.6, water: 0.35, breath: 0.4, eidolon: 0.5,
  bonfire: 0.4, howl: 0.35,
  heal: 0.45, shield: 0.4, light: 0.4, hazard: 0.3
};

function animImpactAt(kind) {
  return ANIM_IMPACT_AT[kind] ?? 0.5;
}

/** Duração em ms: magias e efeitos mágicos (cura) no cinema, o resto no normal. */
function animDurationMs(kind, family) {
  return family === 'spell' || kind === 'heal' ? ANIM_PACE_MS.cinema : ANIM_PACE_MS.normal;
}

/** Tremida de tela: críticos e explosões (decisão do dono). */
function animShakes(kind, crit) {
  return !!crit || ['explosion', 'fireball', 'ice', 'breath', 'bonfire', 'bomb', 'eidolon'].includes(kind);
}
