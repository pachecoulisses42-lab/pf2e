import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTemplates } from './helpers/load-rules.mjs';

const T = loadTemplates();
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const plain = (v) => JSON.parse(JSON.stringify(v));
const templates = plain(T.UNIT_TEMPLATES);
const chibiKeys = Object.keys(T.CHIBI_SVGS);

test('todo token chibi tem uma peça (modelo) e toda peça aponta para um token existente', () => {
  const sculptsWithTemplate = new Set(templates.map(t => t.sculpt));
  for (const key of chibiKeys) assert.ok(sculptsWithTemplate.has(key), `token "${key}" está sem peça`);
  for (const t of templates) assert.ok(chibiKeys.includes(t.sculpt), `modelo ${t.id} usa token inexistente "${t.sculpt}"`);
});

test('todo token existe também em medalhão (automático quando não há arte própria)', () => {
  for (const key of chibiKeys) assert.equal(typeof T.MEDALLION_SVGS[key], 'function', key);
});

test('os tokens renderizam SVG válido e com ids próprios', () => {
  for (const key of chibiKeys) {
    const svg = T.CHIBI_SVGS[key]();
    assert.match(svg, /^<svg viewBox="0 0 256 256"/, key);
    assert.ok(svg.includes(`c_${key}`), `${key}: id c_${key} ausente`);
    assert.ok(!/<(image|text)\b/.test(svg), `${key}: não use <image> nem <text>`);
    // todo url(#x) tem o id correspondente
    for (const m of svg.matchAll(/url\(#([^)]+)\)/g)) assert.ok(svg.includes(`id="${m[1]}"`), `${key}: gradiente/filtro ${m[1]} sem definição`);
  }
});

test('ids de modelo são únicos e a facção bate com a lista de vilões', () => {
  const ids = templates.map(t => t.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const t of templates) {
    assert.equal(t.faction === 'villain', T.VILLAIN_SCULPTS.has(t.sculpt), `${t.id}: facção diferente da lista de vilões`);
  }
});

test('cada peça está equipada: arma válida, magias e itens do catálogo, defesas válidas', () => {
  for (const t of templates) {
    assert.ok(t.weapons.length >= 1, `${t.id} sem arma`);
    for (const w of t.weapons) {
      const n = plain(T.normalizeWeapon(w));
      assert.ok(T.isValidDice(n.dmgDie), `${t.id}/${n.name}: dado`);
      assert.ok(n.dmgType, `${t.id}/${n.name}: sem tipo de dano`);
      for (const x of n.extra) assert.ok(T.DAMAGE_TYPES.includes(x.type), `${t.id}/${n.name}: runa ${x.type}`);
    }
    for (const sp of t.spells) {
      const n = plain(T.normalizeSpell(sp));
      assert.ok(T.isValidDice(n.dmgDie) && n.dmgType, `${t.id}/${n.name}`);
    }
    for (const it of t.items) assert.ok(it.qty > 0 && it.name, `${t.id}: item`);
    const d = plain(T.normalizeDefenses({ resistances: t.resistances, weaknesses: t.weaknesses, immunities: t.immunities }));
    assert.equal(d.resistances.length, (t.resistances || []).length, `${t.id}: resistência inválida`);
    assert.equal(d.weaknesses.length, (t.weaknesses || []).length, `${t.id}: fraqueza inválida`);
    assert.equal(d.immunities.length, (t.immunities || []).length, `${t.id}: imunidade inválida`);
  }
});

test('a ficha de cada peça calcula PV e CA coerentes e declara o escudo', () => {
  for (const t of templates) {
    assert.ok(Number.isFinite(t.sheet.shieldBonus), `${t.id}: shieldBonus não definido`);
    const unit = plain({ ...t, hp: 1, maxHp: 1, ac: 0 });
    T.recalculateUnitFromSheet(unit, true);
    assert.ok(unit.maxHp >= 6 && unit.hp === unit.maxHp, `${t.id}: PV`);
    assert.ok(unit.ac >= 10 && unit.ac <= 30, `${t.id}: CA ${unit.ac}`);
    assert.ok(Object.keys(unit.sheet.attrs).length === 6, `${t.id}: atributos`);
  }
});

test('classes só usam magias coerentes: sem magia arcana em marcial e sem magia em marcial puro', () => {
  const noSpells = ['t_guerreiro', 't_barbaro', 't_ranger', 't_rogue', 't_espadachim', 't_orc', 't_esqueleto', 't_zumbi', 't_kobold', 't_goblin', 't_lobo', 't_bandido'];
  for (const id of noSpells) assert.equal(templates.find(t => t.id === id).spells.length, 0, `${id} não deveria ter magias`);
  const casters = { t_druida: 'espinhos_vivos', t_bruxa: 'maldicao_sombria', t_cultista: 'toque_sombrio', t_monge: 'rajada_de_ki', t_clerigo: 'lanca_divina' };
  for (const [id, spell] of Object.entries(casters)) {
    assert.ok(templates.find(t => t.id === id).spells.some(s => s.id === spell), `${id} sem ${spell}`);
  }
});

test('mortos-vivos têm as defesas de morto-vivo', () => {
  for (const id of ['t_esqueleto', 't_zumbi']) {
    const t = templates.find(x => x.id === id);
    assert.ok(t.immunities.includes('veneno') && t.immunities.includes('mental'), `${id}: imunidades`);
    assert.ok(t.weaknesses.some(w => w.type === 'vital'), `${id}: fraqueza a vital`);
  }
});

test('os seletores de token da interface listam todos os tokens', () => {
  const html = readFileSync(join(root, 'src/index.html'), 'utf8');
  for (const id of ['inspTokenSelect', 'newPieceSculpt']) {
    const select = html.match(new RegExp(`<select id="${id}"[^>]*>([\\s\\S]*?)</select>`))[1];
    for (const key of chibiKeys) assert.ok(select.includes(`value="${key}"`), `${id} sem "${key}"`);
  }
});
