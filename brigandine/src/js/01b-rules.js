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

/* ---------- Resistências, fraquezas e imunidades ---------- */
const PHYSICAL_TYPES = ['cortante', 'perfurante', 'contundente'];
const ENERGY_TYPES = ['fogo', 'gélido', 'elétrico', 'ácido', 'sônico', 'força', 'vital'];
/** Além dos tipos de dano, defesas aceitam estes grupos. */
const DEFENSE_GROUPS = ['físico', 'energia', 'todos'];
const DEFENSE_TYPES = [...DAMAGE_TYPES.filter((t) => t !== 'precisão'), ...DEFENSE_GROUPS];

/** Uma defesa do tipo `entryType` vale para o dano de tipo `damageType`? */
function defenseMatches(entryType, damageType) {
  if (entryType === 'todos') return true;
  if (entryType === damageType) return true;
  if (entryType === 'físico') return PHYSICAL_TYPES.includes(damageType);
  if (entryType === 'energia') return ENERGY_TYPES.includes(damageType);
  return false;
}

/**
 * Aplica imunidades, resistências e fraquezas de `target` ao pacote de dano.
 *  - `multiplier` (1, 2 no crítico, 0.5 em metade) é aplicado antes das defesas.
 *  - Dano de "precisão" conta como o tipo da arma/magia (parte base).
 *  - Por tipo vale a maior resistência e a maior fraqueza aplicáveis.
 *  - Fraqueza só soma se algum dano daquele tipo foi causado e o alvo não é imune.
 * Retorna { total, lines: [{ type, raw, resisted, weakness, immune, final }] }.
 */
function applyDefenses(parts, multiplier, target) {
  const baseType = (parts[0] && parts[0].type) || '';
  const buckets = new Map();
  for (const p of parts) {
    const eff = (p.type === 'precisão' ? baseType : p.type) || 'sem tipo';
    buckets.set(eff, (buckets.get(eff) || 0) + Math.floor(p.total * multiplier));
  }

  const resistances = (target && target.resistances) || [];
  const weaknesses = (target && target.weaknesses) || [];
  const immunities = (target && target.immunities) || [];
  const best = (list, type) => list.reduce((m, d) => (defenseMatches(d.type, type) ? Math.max(m, d.value) : m), 0);

  const lines = [];
  let total = 0;
  for (const [type, raw] of buckets) {
    const immune = immunities.some((t) => defenseMatches(t, type));
    let final = 0;
    let resisted = 0;
    let weakness = 0;
    if (!immune) {
      resisted = Math.min(raw, best(resistances, type));
      weakness = raw > 0 ? best(weaknesses, type) : 0;
      final = raw - resisted + weakness;
    }
    lines.push({ type, raw, resisted, weakness, immune, final });
    total += final;
  }
  return { total, lines };
}

/** "fogo: resistência −5 · gélido: fraqueza +3 · veneno: imune" — só o que mudou algo. */
function describeDefenseEffects(lines) {
  return lines
    .filter((l) => l.immune || l.resisted > 0 || l.weakness > 0)
    .map((l) => {
      const bits = [];
      if (l.immune) bits.push('imune');
      if (l.resisted > 0) bits.push(`resistência −${l.resisted}`);
      if (l.weakness > 0) bits.push(`fraqueza +${l.weakness}`);
      return `${l.type}: ${bits.join(', ')}`;
    })
    .join(' · ');
}

/** Garante a forma { resistances:[{type,value}], weaknesses:[...], immunities:[type] } em qualquer peça. */
function normalizeDefenses(unit) {
  const clean = (list) => (Array.isArray(list) ? list : [])
    .filter((d) => d && DEFENSE_TYPES.includes(d.type) && Number.isFinite(d.value) && d.value > 0)
    .map((d) => ({ type: d.type, value: Math.floor(d.value) }));
  unit.resistances = clean(unit.resistances);
  unit.weaknesses = clean(unit.weaknesses);
  unit.immunities = (Array.isArray(unit.immunities) ? unit.immunities : []).filter((t) => DEFENSE_TYPES.includes(t));
  return unit;
}

/* ---------- Pré-visualização de ataque (tooltip no alvo) ---------- */
/** Média arredondada de "NdM" + bônus (mínimo 1). */
function averageRoll(dieStr, bonus = 0) {
  const m = String(dieStr).match(/(\d+)d(\d+)/i);
  if (!m) return Math.max(1, 1 + bonus);
  return Math.max(1, Math.round(parseInt(m[1], 10) * (parseInt(m[2], 10) + 1) / 2 + bonus));
}

/** Mesmo formato de rollDamage, mas com o dano médio — sem aleatoriedade. */
function averageDamage(src) {
  const base = averageRoll(src.dmgDie, src.dmgBonus || 0);
  const parts = [{ kind: 'base', label: src.name || '', type: src.dmgType || '', total: base }];
  let total = base;
  for (const x of (src.extra || [])) {
    const t = averageRoll(x.die, x.bonus || 0);
    parts.push({ kind: 'extra', label: x.name || '', type: x.type || '', total: t });
    total += t;
  }
  return { total, parts };
}

/**
 * Chances de um d20 + `toHit` contra `ac`, com as regras do motor:
 * 1 natural sempre erra, 20 natural sempre é crítico, +10 sobre a CA é crítico.
 */
function attackOdds(toHit, ac) {
  let hit = 0;
  let crit = 0;
  for (let face = 1; face <= 20; face++) {
    if (face === 1) continue; // 1 natural sempre erra, mesmo com bônus enorme
    const total = face + toHit;
    if (face === 20 || total >= ac + 10) crit++;
    else if (total >= ac) hit++;
  }
  return { hit: (hit + crit) / 20, crit: crit / 20 };
}

/* ---------------- Direção da peça ----------------
   Graus no sentido horário da tela; 0 = virada para o sul (para baixo), como a arte
   dos tokens é desenhada. 90 = oeste, 180 = norte, 270 = leste. */

/** Ângulo válido entre 0 e 359 (valores ausentes ou inválidos viram 0 = sul). */
function normalizeFacing(deg) {
  const n = Number(deg);
  if (!Number.isFinite(n)) return 0;
  return ((Math.round(n) % 360) + 360) % 360;
}

/** Arredonda para o passo mais próximo (45° na grade quadrada, 30° no hexágono). */
function snapFacing(deg, step) {
  if (!(step > 1)) return normalizeFacing(deg);
  return normalizeFacing(Math.round(deg / step) * step);
}

/** Direção que aponta do centro da peça para o vetor (dx, dy) em pixels de tela. */
function facingFromVector(dx, dy) {
  if (!dx && !dy) return 0;
  return normalizeFacing(Math.atan2(-dx, dy) * 180 / Math.PI);
}

const FACING_NAMES = ['sul', 'sudoeste', 'oeste', 'noroeste', 'norte', 'nordeste', 'leste', 'sudeste'];
/** Nome do ponto cardeal mais próximo. */
function facingLabel(deg) {
  return FACING_NAMES[Math.round(normalizeFacing(deg) / 45) % 8];
}
