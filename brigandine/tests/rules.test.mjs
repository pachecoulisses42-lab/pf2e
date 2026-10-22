import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRules, seq, makeUnit } from './helpers/load-rules.mjs';

const R = loadRules();
/** Arrays criados no contexto do vm têm outro protótipo; compara por valor. */
const plain = (v) => JSON.parse(JSON.stringify(v));

test('isValidDice aceita NdM e recusa lixo', () => {
  for (const ok of ['1d6', '2d12', '10d4', ' 3D8 ']) assert.equal(R.isValidDice(ok), true, ok);
  for (const bad of ['', 'd6', '0d6', '1d1', '1d101', '51d6', '1d6+2', 'abc', '1d', null]) assert.equal(R.isValidDice(bad), false, String(bad));
});

test('rollDiceExpression usa o RNG injetado e soma o bônus', () => {
  // rng 0 -> 1 em todos os dados; rng 0.999 -> face máxima
  assert.deepEqual(plain(R.rollDiceExpression('2d6', 3, seq(0)).rolls), [1, 1]);
  assert.equal(R.rollDiceExpression('2d6', 3, seq(0)).total, 5);
  assert.equal(R.rollDiceExpression('1d8', 4, seq(0.999)).total, 12);
});

test('rollDiceExpression nunca devolve menos que 1', () => {
  assert.equal(R.rollDiceExpression('1d4', -10, seq(0)).total, 1);
});

test('rollDamage soma dano base e runas, preservando as partes', () => {
  const weapon = {
    name: 'Espada Longa', dmgDie: '1d8', dmgBonus: 4, dmgType: 'cortante',
    extra: [
      { name: 'Flamejante', die: '1d6', bonus: 0, type: 'fogo' },
      { name: 'Ataque furtivo', die: '1d6', bonus: 1, type: 'precisão' }
    ]
  };
  const dmg = R.rollDamage(weapon, seq(0.999)); // máximos: 8+4, 6, 6+1
  assert.equal(dmg.parts.length, 3);
  assert.deepEqual(plain(dmg.parts.map(p => p.total)), [12, 6, 7]);
  assert.equal(dmg.total, 25);
  assert.equal(dmg.parts[1].kind, 'extra');
  assert.equal(dmg.parts[1].type, 'fogo');
});

test('rollDamage sem runas devolve só o dano base', () => {
  const dmg = R.rollDamage({ dmgDie: '2d6', dmgBonus: 0 }, seq(0));
  assert.equal(dmg.parts.length, 1);
  assert.equal(dmg.total, 2);
});

test('formatDamageParts dobra cada parte no crítico', () => {
  const parts = [
    { kind: 'base', type: 'cortante', total: 9 },
    { kind: 'extra', label: 'Flamejante', type: 'fogo', total: 4 }
  ];
  assert.equal(R.formatDamageParts(parts), '9 cortante + 4 fogo (Flamejante)');
  assert.equal(R.formatDamageParts(parts, 2), '18 cortante + 8 fogo (Flamejante)');
});

test('describeDamage monta a descrição estática com runas', () => {
  const w = { dmgDie: '1d8', dmgBonus: 4, dmgType: 'cortante', extra: [{ die: '1d6', bonus: 0, type: 'fogo' }] };
  assert.equal(R.describeDamage(w), '1d8+4 cortante + 1d6 fogo');
  assert.equal(R.describeDamage({ dmgDie: '2d6', dmgBonus: -1 }), '2d6-1');
});

test('toda runa predefinida é válida e usa tipo de dano conhecido', () => {
  for (const [key, rune] of Object.entries(R.RUNE_PRESETS)) {
    assert.equal(R.isValidDice(rune.die), true, key);
    assert.ok(R.DAMAGE_TYPES.includes(rune.type), `${key}: ${rune.type}`);
  }
});

test('Erguer Escudo soma o bônus à CA e sai ao baixar', () => {
  const u = makeUnit();
  R.recalculateUnitFromSheet(u, true);
  const base = u.ac;
  assert.equal(u.baseAc, base);

  u.shieldRaised = true;
  R.recalculateUnitFromSheet(u, false);
  assert.equal(u.ac, base + 2, 'bônus padrão do escudo é +2');

  u.sheet.shieldBonus = 3;
  R.recalculateUnitFromSheet(u, false);
  assert.equal(u.ac, base + 3);

  u.shieldRaised = false;
  R.recalculateUnitFromSheet(u, false);
  assert.equal(u.ac, base);
});

test('shieldBonusOf respeita 0 (sem escudo) e usa +2 por padrão', () => {
  assert.equal(R.shieldBonusOf(makeUnit()), 2);
  const u = makeUnit(); u.sheet.shieldBonus = 0;
  assert.equal(R.shieldBonusOf(u), 0);
});

test('armas e magias seguem a ficha, exceto quando manuais', () => {
  const u = makeUnit();
  u.weapons.push({ name: 'Manual', atkBonus: 99, dmgDie: '1d6', dmgBonus: 77, reach: 1.5, manual: true });
  u.spells.push({ name: 'Manual', atkBonus: 55, dmgDie: '1d6', dmgBonus: 3, range: 9, manual: true });
  R.recalculateUnitFromSheet(u, true);

  const d = u.sheet.derived;
  assert.equal(u.weapons[0].atkBonus, d.weaponAtk);
  assert.equal(u.weapons[0].dmgBonus, d.meleeDmgBonus);
  assert.equal(u.weapons[1].atkBonus, 99, 'arma manual não é sobrescrita');
  assert.equal(u.weapons[1].dmgBonus, 77);
  assert.equal(u.spells[0].atkBonus, d.spellAtk);
  assert.equal(u.spells[1].atkBonus, 55, 'magia manual não é sobrescrita');
});

test('normalizeWeapon corrige dados inválidos e preserva runas válidas', () => {
  const w = R.normalizeWeapon({
    name: '', dmgDie: 'xyz', reach: -3, atkBonus: 'a',
    extra: [{ name: 'ok', die: '1d6', type: 'fogo' }, { name: 'ruim', die: 'oops', type: 'fogo' }, null]
  });
  assert.equal(w.name, 'Arma');
  assert.equal(w.dmgDie, '1d6');
  assert.equal(w.reach, 1.5);
  assert.equal(w.atkBonus, 0);
  assert.equal(w.extra.length, 1);
  assert.equal(w.manual, false);
});

test('normalizeSpell restringe custo, área e preenche padrões', () => {
  const s = R.normalizeSpell({ name: 'X', cost: 9, areaType: 'cone', dmgDie: '', range: 'x' });
  assert.equal(s.cost, 2);
  assert.equal(s.areaType, 'single');
  assert.equal(s.dmgDie, '1d6');
  assert.equal(s.range, 1.5);
  assert.deepEqual(plain(s.extra), []);
});

test('catálogo de magias: todas têm dado válido e tipo de dano', () => {
  for (const [key, sp] of Object.entries(R.SPELL_CATALOG)) {
    assert.equal(R.isValidDice(sp.dmgDie), true, key);
    assert.ok(R.DAMAGE_TYPES.includes(sp.dmgType), `${key} sem tipo de dano`);
  }
});

test('escapeHtml e cleanText neutralizam marcação', () => {
  assert.equal(R.escapeHtml('<img src=x onerror="a()">'), '&lt;img src=x onerror=&quot;a()&quot;&gt;');
  assert.equal(R.cleanText('  <b>Orc</b> '), 'bOrc/b');
  assert.equal(R.escapeHtml(null), '');
});

/* ---------- Resistências, fraquezas e imunidades ---------- */
const part = (type, total, kind = 'base') => ({ kind, type, total });

test('sem defesas o dano passa inteiro', () => {
  const r = R.applyDefenses([part('cortante', 9), part('fogo', 4, 'extra')], 1, {});
  assert.equal(r.total, 13);
  assert.equal(R.describeDefenseEffects(r.lines), '');
});

test('resistência reduz só o tipo correspondente e nunca abaixo de zero', () => {
  const target = { resistances: [{ type: 'fogo', value: 5 }] };
  const r = R.applyDefenses([part('cortante', 9), part('fogo', 4, 'extra')], 1, target);
  assert.equal(r.total, 9, 'fogo 4 − 5 = 0; cortante intacto');
  const fire = plain(r.lines).find(l => l.type === 'fogo');
  assert.equal(fire.resisted, 4);
  assert.equal(R.describeDefenseEffects(r.lines), 'fogo: resistência −4');
});

test('fraqueza soma ao dano do tipo e só quando houve dano daquele tipo', () => {
  const target = { weaknesses: [{ type: 'gélido', value: 3 }] };
  assert.equal(R.applyDefenses([part('cortante', 8)], 1, target).total, 8);
  const r = R.applyDefenses([part('cortante', 8), part('gélido', 4, 'extra')], 1, target);
  assert.equal(r.total, 8 + 4 + 3);
  assert.equal(R.describeDefenseEffects(r.lines), 'gélido: fraqueza +3');
});

test('imunidade zera o tipo e anula a fraqueza', () => {
  const target = { immunities: ['veneno'], weaknesses: [{ type: 'veneno', value: 9 }] };
  const r = R.applyDefenses([part('perfurante', 6), part('veneno', 5, 'extra')], 1, target);
  assert.equal(r.total, 6);
  assert.match(R.describeDefenseEffects(r.lines), /veneno: imune/);
});

test('grupos físico, energia e todos', () => {
  assert.equal(R.defenseMatches('físico', 'cortante'), true);
  assert.equal(R.defenseMatches('físico', 'fogo'), false);
  assert.equal(R.defenseMatches('energia', 'elétrico'), true);
  assert.equal(R.defenseMatches('energia', 'perfurante'), false);
  assert.equal(R.defenseMatches('todos', 'mental'), true);

  const target = { resistances: [{ type: 'físico', value: 5 }] };
  assert.equal(R.applyDefenses([part('contundente', 12)], 1, target).total, 7);
  assert.equal(R.applyDefenses([part('fogo', 12)], 1, target).total, 12);
});

test('com várias resistências aplicáveis vale a maior, sem somar', () => {
  const target = { resistances: [{ type: 'físico', value: 3 }, { type: 'cortante', value: 7 }, { type: 'todos', value: 2 }] };
  assert.equal(R.applyDefenses([part('cortante', 10)], 1, target).total, 3);
});

test('crítico dobra o dano ANTES das defesas', () => {
  const target = { resistances: [{ type: 'fogo', value: 5 }] };
  // fogo 6 dobrado = 12; menos 5 de resistência = 7 (e não 6−5 = 1, dobrado = 2)
  assert.equal(R.applyDefenses([part('fogo', 6)], 2, target).total, 7);
});

test('metade de dano (0.5) arredonda para baixo por tipo antes das defesas', () => {
  assert.equal(R.applyDefenses([part('fogo', 9)], 0.5, {}).total, 4);
  const target = { weaknesses: [{ type: 'fogo', value: 2 }] };
  assert.equal(R.applyDefenses([part('fogo', 9)], 0.5, target).total, 6);
});

test('dano de precisão conta como o tipo da arma', () => {
  const target = { resistances: [{ type: 'cortante', value: 4 }] };
  const r = R.applyDefenses([part('cortante', 8), part('precisão', 5, 'extra')], 1, target);
  assert.equal(r.total, 9, '(8 + 5) cortante − 4');
  assert.equal(plain(r.lines).length, 1);
});

test('dano sem tipo é tratado à parte e só "todos" o afeta', () => {
  const t1 = { resistances: [{ type: 'fogo', value: 5 }] };
  assert.equal(R.applyDefenses([part('', 7)], 1, t1).total, 7);
  const t2 = { resistances: [{ type: 'todos', value: 3 }] };
  assert.equal(R.applyDefenses([part('', 7)], 1, t2).total, 4);
});

test('normalizeDefenses descarta tipos inválidos, valores ruins e normaliza imunidades', () => {
  const u = R.normalizeDefenses({
    resistances: [{ type: 'fogo', value: 5.9 }, { type: 'banana', value: 3 }, { type: 'gélido', value: 0 }, null],
    weaknesses: 'x',
    immunities: ['veneno', 'xyz', 'físico']
  });
  assert.deepEqual(plain(u.resistances), [{ type: 'fogo', value: 5 }]);
  assert.deepEqual(plain(u.weaknesses), []);
  assert.deepEqual(plain(u.immunities), ['veneno', 'físico']);
  assert.equal(R.DEFENSE_TYPES.includes('precisão'), false, 'precisão não é um tipo de defesa');
});
