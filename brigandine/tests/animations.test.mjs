import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ctx = vm.createContext({ console });
for (const f of ['01-catalog.js', '01b-rules.js', '01d-animation-rules.js', '03-templates.js']) {
  vm.runInContext(readFileSync(join(root, 'src/js', f), 'utf8'), ctx, { filename: f });
}
const run = (code) => vm.runInContext(code, ctx);

test('arma: animação pelo nome, depois alcance e tipo de dano', () => {
  const k = (w) => run(`weaponAnimKind(${JSON.stringify(w)})`);
  assert.equal(k({ name: 'Espada Longa', reach: 1.5, dmgType: 'cortante' }), 'slash');
  assert.equal(k({ name: 'Rapieira', reach: 1.5, dmgType: 'perfurante' }), 'thrust');
  assert.equal(k({ name: 'Maça Solar', reach: 1.5, dmgType: 'contundente' }), 'bash');
  assert.equal(k({ name: 'Mandíbulas Ferozes', reach: 1.5, dmgType: 'perfurante' }), 'claw');
  assert.equal(k({ name: 'Arco Longo', reach: 18, dmgType: 'perfurante' }), 'arrow');
  assert.equal(k({ name: 'Besta de Mão', reach: 9, dmgType: 'perfurante' }), 'bolt');
  assert.equal(k({ name: 'Azagaia de Arremesso', reach: 9, dmgType: 'perfurante' }), 'thrown');
  assert.equal(k({ name: 'Adaga Arremessada', reach: 3, dmgType: 'perfurante' }), 'thrown');
  assert.equal(k({ name: 'Bomba de Fogo', reach: 9, dmgType: 'fogo' }), 'bomb');
  assert.equal(k({ name: 'Disparo Rubro', reach: 9, dmgType: 'fogo' }), 'energy');
  assert.equal(k({ name: 'Lança de Alcance', reach: 3, dmgType: 'perfurante' }), 'thrust');
  assert.equal(k({ name: 'Espada', reach: 1.5, dmgType: 'cortante', anim: 'shot' }), 'shot', 'escolha manual vence');
  assert.equal(k({ name: 'Espada', reach: 1.5, dmgType: 'cortante', anim: 'xyz' }), 'slash', 'valor desconhecido cai no automático');
});

test('todas as armas dos modelos têm animação conhecida', () => {
  const kinds = run('UNIT_TEMPLATES.flatMap(t => (t.weapons || []).map(w => weaponAnimKind(w)))');
  assert.ok(kinds.length > 10);
  for (const kd of kinds) assert.ok(run(`!!WEAPON_ANIMS[${JSON.stringify(kd)}]`), kd);
});

test('magia: cada magia do catálogo tem a sua; magias novas usam a genérica pela área', () => {
  const ids = run('Object.keys(SPELL_CATALOG)');
  const kinds = ids.map((id) => run(`spellAnimKind(SPELL_CATALOG.${id})`));
  assert.equal(new Set(kinds).size, ids.length, 'uma animação diferente por magia');
  for (const kd of kinds) assert.ok(run(`!!SPELL_ANIMS[${JSON.stringify(kd)}]`), kd);
  assert.equal(run("spellAnimKind({ areaType: 'line', range: 9 })"), 'beam');
  assert.equal(run("spellAnimKind({ areaType: 'burst', range: 18 })"), 'explosion');
  assert.equal(run("spellAnimKind({ areaType: 'single', range: 1.5 })"), 'touch');
  assert.equal(run("spellAnimKind({ areaType: 'single', range: 18 })"), 'orb');
  assert.equal(run("spellAnimKind({ id: 'relampago', anim: 'fireball' })"), 'fireball');
});

test('ritmo: armas no normal, magias e cura no cinema; tremida em crítico e explosão', () => {
  assert.equal(run("animDurationMs('slash', 'weapon')"), 900);
  assert.equal(run("animDurationMs('fireball', 'spell')"), 1400);
  assert.equal(run("animDurationMs('heal', 'item')"), 1400);
  assert.equal(run("animDurationMs('shield', 'item')"), 900);
  assert.equal(run("animShakes('slash', true)"), true);
  assert.equal(run("animShakes('slash', false)"), false);
  assert.equal(run("animShakes('fireball', false)"), true);
});

test('normalizar arma e magia guarda a animação escolhida', () => {
  assert.equal(run("normalizeWeapon({ name: 'X', anim: 'arrow' }).anim"), 'arrow');
  assert.equal(run("normalizeWeapon({ name: 'X', anim: 'nada' }).anim"), 'auto');
  assert.equal(run("normalizeSpell({ name: 'Y', anim: 'lightning' }).anim"), 'lightning');
  assert.equal(run("normalizeSpell({ name: 'Y' }).anim"), 'auto');
});
