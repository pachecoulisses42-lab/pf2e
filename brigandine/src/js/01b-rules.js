/* ============================================================================
   2b. REGRAS PURAS (sem DOM) — dados, tipos de dano, runas e pacote de dano.
   Tudo aqui é testável em Node (ver tests/).
   ============================================================================ */
const DAMAGE_TYPES = [
  'cortante', 'perfurante', 'contundente',
  'fogo', 'gélido', 'elétrico', 'ácido', 'sônico',
  'espiritual', 'vital', 'veneno', 'mental', 'força', 'precisão'
];

const DAMAGE_TAG_CLASS = {
  fogo: 'tag-fire', 'gélido': 'tag-cold', 'elétrico': 'tag-elec', 'ácido': 'tag-acid',
  'sônico': 'tag-sonic', espiritual: 'tag-holy', vital: 'tag-holy', mental: 'tag-unholy',
  veneno: 'tag-acid', 'força': 'tag-sonic', 'precisão': 'tag-phys'
};

/** Runas elementais e especiais disponíveis como dano adicional de arma. */
const RUNE_PRESETS = {
  flamejante: { name: 'Flamejante', die: '1d6', bonus: 0, type: 'fogo' },
  gelida: { name: 'Gélida', die: '1d6', bonus: 0, type: 'gélido' },
  chocante: { name: 'Chocante', die: '1d6', bonus: 0, type: 'elétrico' },
  corrosiva: { name: 'Corrosiva', die: '1d6', bonus: 0, type: 'ácido' },
  trovejante: { name: 'Trovejante', die: '1d6', bonus: 0, type: 'sônico' },
  sagrada: { name: 'Sagrada', die: '1d4', bonus: 0, type: 'espiritual' },
  profana: { name: 'Profana', die: '1d4', bonus: 0, type: 'espiritual' },
  furtivo: { name: 'Ataque furtivo', die: '1d6', bonus: 0, type: 'precisão' }
};

const DICE_PATTERN = /^(\d+)d(\d+)$/i;

function isValidDice(str) {
  const m = String(str).trim().match(DICE_PATTERN);
  return !!m && parseInt(m[1], 10) > 0 && parseInt(m[1], 10) <= 50 && parseInt(m[2], 10) > 1 && parseInt(m[2], 10) <= 100;
}

/** Rola "NdM" + bônus. `rng` é injetável para testes (retorna [0,1)). */
function rollDiceExpression(dieStr, bonus = 0, rng = Math.random) {
  const match = String(dieStr).match(/(\d+)d(\d+)/i);
  if (!match) return { total: Math.max(1, 1 + bonus), rolls: [1] };
  const count = parseInt(match[1], 10);
  const faces = parseInt(match[2], 10);
  const rolls = [];
  let sum = 0;
  for (let i = 0; i < count; i++) {
    const r = Math.floor(rng() * faces) + 1;
    rolls.push(r);
    sum += r;
  }
  return { total: Math.max(1, sum + bonus), rolls };
}

/**
 * Rola o dano base de uma arma/magia mais todos os danos adicionais (runas etc.).
 * Retorna o total e as partes, para detalhar no registro.
 */
function rollDamage(src, rng = Math.random) {
  const base = rollDiceExpression(src.dmgDie, src.dmgBonus || 0, rng);
  const parts = [{ kind: 'base', label: src.name || '', type: src.dmgType || '', die: src.dmgDie, bonus: src.dmgBonus || 0, total: base.total, rolls: base.rolls }];
  let total = base.total;
  for (const x of (src.extra || [])) {
    const r = rollDiceExpression(x.die, x.bonus || 0, rng);
    parts.push({ kind: 'extra', label: x.name || '', type: x.type || '', die: x.die, bonus: x.bonus || 0, total: r.total, rolls: r.rolls });
    total += r.total;
  }
  return { total, parts };
}

/** "9 cortante + 4 fogo (Flamejante)" — com multiplicador para crítico. */
function formatDamageParts(parts, multiplier = 1) {
  return parts.map((p) => {
    const t = p.total * multiplier;
    const type = p.type ? ` ${p.type}` : '';
    const name = p.kind === 'extra' && p.label ? ` (${p.label})` : '';
    return `${t}${type}${name}`;
  }).join(' + ');
}

/** "1d8+4 cortante + 1d6 fogo" — descrição estática (sem rolar). */
function describeDamage(src) {
  const fmt = (die, bonus, type) => `${die}${bonus ? (bonus > 0 ? '+' + bonus : bonus) : ''}${type ? ' ' + type : ''}`;
  return [fmt(src.dmgDie, src.dmgBonus || 0, src.dmgType || '')]
    .concat((src.extra || []).map((x) => fmt(x.die, x.bonus || 0, x.type || '')))
    .join(' + ');
}

const DEFAULT_SHIELD_BONUS = 2;

function shieldBonusOf(unit) {
  const b = unit && unit.sheet ? unit.sheet.shieldBonus : undefined;
  return b === undefined ? DEFAULT_SHIELD_BONUS : b;
}

/** Normaliza armas/magias vindas de modelos antigos ou de JSON importado. */
function normalizeWeapon(w) {
  return {
    name: w.name || 'Arma',
    atkBonus: Number.isFinite(w.atkBonus) ? w.atkBonus : 0,
    dmgDie: isValidDice(w.dmgDie) ? w.dmgDie : '1d6',
    dmgBonus: Number.isFinite(w.dmgBonus) ? w.dmgBonus : 0,
    reach: Number.isFinite(w.reach) && w.reach > 0 ? w.reach : 1.5,
    dmgType: w.dmgType || '',
    manual: !!w.manual,
    extra: Array.isArray(w.extra) ? w.extra.filter((x) => x && isValidDice(x.die)) : []
  };
}

function normalizeSpell(sp) {
  return {
    ...sp,
    name: sp.name || 'Magia',
    cost: [1, 2, 3].includes(sp.cost) ? sp.cost : 2,
    range: Number.isFinite(sp.range) && sp.range > 0 ? sp.range : 1.5,
    areaType: ['single', 'line', 'burst'].includes(sp.areaType) ? sp.areaType : 'single',
    areaSize: Number.isFinite(sp.areaSize) ? sp.areaSize : 0,
    atkBonus: Number.isFinite(sp.atkBonus) ? sp.atkBonus : 0,
    dmgDie: isValidDice(sp.dmgDie) ? sp.dmgDie : '1d6',
    dmgBonus: Number.isFinite(sp.dmgBonus) ? sp.dmgBonus : 0,
    dmgType: sp.dmgType || '',
    manual: !!sp.manual,
    desc: sp.desc || '',
    extra: Array.isArray(sp.extra) ? sp.extra.filter((x) => x && isValidDice(x.die)) : []
  };
}

/** Escapa texto de usuário para uso em innerHTML e atributos. */
function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** Nomes entram em logs HTML: remove marcação em vez de escapar. */
function cleanText(str) {
  return String(str ?? '').replace(/[<>]/g, '').trim();
}
