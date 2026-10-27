import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

/** Carrega os módulos de regras puras (sem DOM) em um contexto isolado. */
export function loadRules() {
  const ctx = vm.createContext({ console });
  for (const f of ['01-catalog.js', '01b-rules.js', '02-sheet-engine.js']) {
    vm.runInContext(readFileSync(join(root, 'src/js', f), 'utf8'), ctx, { filename: f });
  }
  return vm.runInContext(`({
    DAMAGE_TYPES, RUNE_PRESETS, SPELL_CATALOG, isValidDice, rollDiceExpression, rollDamage,
    formatDamageParts, describeDamage, shieldBonusOf, normalizeWeapon, normalizeSpell,
    escapeHtml, cleanText, recalculateUnitFromSheet,
    applyDefenses, describeDefenseEffects, normalizeDefenses, defenseMatches, DEFENSE_TYPES,
    averageRoll, averageDamage, attackOdds,
    normalizeFacing, snapFacing, facingFromVector, facingLabel
  })`, ctx);
}

/** RNG determinístico: devolve sempre a sequência dada (cíclica). */
export function seq(...values) {
  let i = 0;
  return () => values[i++ % values.length];
}

export function makeUnit(overrides = {}) {
  return {
    id: 'u1', name: 'Teste', hp: 30, maxHp: 30, ac: 0, faction: 'hero',
    sheet: {
      level: 3, keyAttr: 'FOR', ancestryHp: 8, classHp: 10, armorItemBonus: 4, dexCap: 1,
      attrs: { FOR: 4, DES: 2, CON: 2, INT: 0, SAB: 1, CAR: 0 },
      prof: { armor: 2, weapon: 4, spell: 2, perception: 4, fort: 4, ref: 4, will: 2 }
    },
    weapons: [{ name: 'Espada', atkBonus: 0, dmgDie: '1d8', dmgBonus: 0, reach: 1.5 }],
    spells: [{ name: 'Raio', atkBonus: 0, dmgDie: '3d6', dmgBonus: 4, range: 18, areaType: 'single', areaSize: 0, cost: 2 }],
    items: [],
    ...overrides
  };
}

/** Carrega catálogo, regras, ficha, modelos e os kits de token (sem DOM). */
export function loadTemplates() {
  const ctx = vm.createContext({ console });
  // tokens extras como o build embute, com a imagem trocada por um marcador
  const manifest = JSON.parse(readFileSync(join(root, 'src/tokens-extra/manifest.json'), 'utf8'));
  ctx.EXTRA_TOKEN_GROUPS = manifest.groups.map((g) => ({ ...g, items: g.items.map(({ file, ...it }) => ({ ...it, src: 'data:image/webp;base64,AA' })) }));
  const files = ['01-catalog.js', '01b-rules.js', '02-sheet-engine.js', '03-templates.js', '03b-templates-extras.js', '03c-piece-import.js', '03d-templates-3d.js'];
  const tokenFiles = readdirSync(join(root, 'src/js')).filter((f) => /^00[a-y]/.test(f)).sort();
  for (const f of [...tokenFiles, ...files]) vm.runInContext(readFileSync(join(root, 'src/js', f), 'utf8'), ctx, { filename: f });
  return vm.runInContext(`({
    UNIT_TEMPLATES, SPELL_CATALOG, ITEM_CATALOG, CHIBI_SVGS, TOPDOWN_SVGS, TOKEN_STYLES, setTokenStyle, activeStyle: () => activeTokenStyle, VILLAIN_SCULPTS, DAMAGE_TYPES,
    isValidDice, normalizeWeapon, normalizeSpell, normalizeDefenses, recalculateUnitFromSheet,
    EXTRA_TOKENS, effectiveTokenKey, sameTokenFigure, suggestTokenKey, matchTokenKey, resolvePieceToken, normalizePieceTemplate, extractPieceList, isKnownTokenKey, T3D_TOKENS
  })`, ctx);
}
